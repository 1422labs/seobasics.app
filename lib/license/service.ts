import type { PrismaClient } from "@/generated/prisma/client";
import type { ApiErrorCode } from "@/lib/api";
import { decideActivation, tokenExpiry, type LicensePolicy } from "./activation";
import { hashLicenseKey, licenseKeyHint, normalizeLicenseKey } from "./key";
import type { SigningConfig } from "./signing";
import { deviceHash, signActivationToken, verifyActivationToken, type ActivationClaims } from "./token";

/**
 * The /api/v1/activations endpoints (docs/license-api-v1.md) as plain
 * functions over a Prisma client, a signing config and a clock, so they are
 * tested against a real Postgres without HTTP. Route handlers only parse the
 * body and turn the result into a Response.
 */

export type LicenseServiceDeps = {
  db: PrismaClient;
  /** null when the environment has no signing key: every call is `not_configured`. */
  signing: SigningConfig | null;
  policy: LicensePolicy;
  now?: () => Date;
};

export type ServiceResult<T> =
  | { ok: true; status: 200 | 201 | 204; body: T }
  | { ok: false; code: ApiErrorCode; message: string };

export type IssuedToken = {
  activation_id: string;
  token: string;
  /** ISO 8601; the token stops working offline after this. */
  expires_at: string;
  /** ISO 8601; refresh quietly after this when online. */
  refresh_after: string;
};

export type ActivationResponse = IssuedToken & { license: { key_hint: string } };

export type ActivateInput = { licenseKey: string; deviceId: string; appVersion: string; deviceName?: string };
export type RefreshInput = { token: string; deviceId: string; appVersion: string };
export type DeactivateInput = { token: string; deviceId: string };

function fail(code: ApiErrorCode, message: string) {
  return { ok: false as const, code, message };
}

const NOT_CONFIGURED = fail("not_configured", "Licensing is not configured on this server yet.");

export function createLicenseService(deps: LicenseServiceDeps) {
  const now = deps.now ?? (() => new Date());

  function issue(signing: SigningConfig, claims: Omit<ActivationClaims, "v" | "edition" | "iat" | "exp">): IssuedToken {
    const issuedAt = now();
    const iat = Math.floor(issuedAt.getTime() / 1000);
    const exp = tokenExpiry(issuedAt, deps.policy);
    const refreshAfter = iat + (deps.policy.refreshAfterSeconds ?? deps.policy.tokenLifetimeSeconds);
    const token = signActivationToken({ v: 1, edition: "direct", ...claims, iat, exp }, signing.kid, signing.privateKey);
    return {
      activation_id: claims.activation_id,
      token,
      expires_at: new Date(exp * 1000).toISOString(),
      refresh_after: new Date(Math.min(refreshAfter, exp) * 1000).toISOString(),
    };
  }

  /** The token's claims if it is ours, for this Mac, and well-formed; expiry is ignored. */
  function readToken(signing: SigningConfig, token: string, deviceId: string) {
    const result = verifyActivationToken(token, signing.publicKeys, {
      now: now(),
      deviceHash: deviceHash(deviceId),
      allowExpired: true,
    });
    return result.ok ? result.claims : null;
  }

  async function activate(input: ActivateInput): Promise<ServiceResult<ActivationResponse>> {
    const signing = deps.signing;
    if (!signing) return NOT_CONFIGURED;
    const key = normalizeLicenseKey(input.licenseKey);
    if (!key) return fail("invalid_license_key", "This license key is not valid. Check it for typos.");
    const hash = deviceHash(input.deviceId);

    // The License row lock serializes concurrent activations of one license,
    // so parallel requests from new Macs can't exceed the device limit.
    const outcome = await deps.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT "id", "status" FROM "License" WHERE "keyHash" = ${hashLicenseKey(key)} FOR UPDATE`;
      const license = rows[0];
      if (!license) return { kind: "not_found" as const };

      const active = await tx.licenseActivation.findMany({
        where: { licenseId: license.id, deactivatedAt: null },
        select: { id: true, deviceHash: true },
        orderBy: { activatedAt: "asc" },
      });
      const decision = decideActivation({
        license: { status: license.status === "active" ? "active" : "revoked" },
        active,
        deviceHash: hash,
        policy: deps.policy,
      });
      if (decision.kind === "refused") return decision;

      const at = now();
      const details = { appVersion: input.appVersion, lastValidatedAt: at, ...(input.deviceName ? { deviceName: input.deviceName } : {}) };
      if (decision.kind === "reuse") {
        await tx.licenseActivation.update({ where: { id: decision.activationId }, data: details });
        return { kind: "issued" as const, licenseId: license.id, activationId: decision.activationId, created: false };
      }
      const created = await tx.licenseActivation.create({
        data: { licenseId: license.id, deviceHash: hash, activatedAt: at, ...details },
        select: { id: true },
      });
      return { kind: "issued" as const, licenseId: license.id, activationId: created.id, created: true };
    });

    if (outcome.kind === "not_found") return fail("license_not_found", "No license with this key exists.");
    if (outcome.kind === "refused") {
      return outcome.code === "license_revoked"
        ? fail("license_revoked", "This license has been revoked.")
        : fail(
            "device_limit_reached",
            `This license is active on ${deps.policy.maxActiveDevices} Macs. Deactivate one of them first.`,
          );
    }
    const issued = issue(signing, { license_id: outcome.licenseId, activation_id: outcome.activationId, device_hash: hash });
    return { ok: true, status: outcome.created ? 201 : 200, body: { ...issued, license: { key_hint: licenseKeyHint(key) } } };
  }

  async function refresh(input: RefreshInput): Promise<ServiceResult<IssuedToken>> {
    const signing = deps.signing;
    if (!signing) return NOT_CONFIGURED;
    const claims = readToken(signing, input.token, input.deviceId);
    if (!claims) return fail("token_invalid", "This activation token is not valid for this Mac.");

    const activation = await deps.db.licenseActivation.findUnique({
      where: { id: claims.activation_id },
      select: { licenseId: true, deviceHash: true, deactivatedAt: true, license: { select: { status: true } } },
    });
    if (!activation || activation.licenseId !== claims.license_id || activation.deviceHash !== claims.device_hash) {
      return fail("activation_not_found", "This Mac is no longer activated. Activate it again.");
    }
    if (activation.license.status !== "active") return fail("license_revoked", "This license has been revoked.");
    if (activation.deactivatedAt) return fail("activation_not_found", "This Mac was deactivated. Activate it again.");

    // Conditional update: a deactivation that lands between the read and here wins.
    const updated = await deps.db.licenseActivation.updateMany({
      where: { id: claims.activation_id, deactivatedAt: null },
      data: { lastValidatedAt: now(), appVersion: input.appVersion },
    });
    if (updated.count === 0) return fail("activation_not_found", "This Mac was deactivated. Activate it again.");

    const issued = issue(signing, {
      license_id: claims.license_id,
      activation_id: claims.activation_id,
      device_hash: claims.device_hash,
    });
    return { ok: true, status: 200, body: issued };
  }

  async function deactivate(input: DeactivateInput): Promise<ServiceResult<null>> {
    const signing = deps.signing;
    if (!signing) return NOT_CONFIGURED;
    const claims = readToken(signing, input.token, input.deviceId);
    if (!claims) return fail("token_invalid", "This activation token is not valid for this Mac.");

    await deps.db.licenseActivation.updateMany({
      where: { id: claims.activation_id, licenseId: claims.license_id, deactivatedAt: null },
      data: { deactivatedAt: now() },
    });
    // Idempotent: deactivating an already deactivated Mac succeeds too.
    const exists = await deps.db.licenseActivation.count({
      where: { id: claims.activation_id, licenseId: claims.license_id },
    });
    if (exists === 0) return fail("activation_not_found", "This Mac is not activated.");
    return { ok: true, status: 204, body: null };
  }

  return { activate, refresh, deactivate };
}

export type LicenseService = ReturnType<typeof createLicenseService>;
