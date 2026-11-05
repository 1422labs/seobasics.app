/**
 * The license service against a real Postgres. Needs TEST_DATABASE_URL: a
 * dedicated, migrated database whose license tables this suite empties (never
 * point it at development data). Without it the suite is skipped.
 *
 *   createdb … seobasics_test
 *   DATABASE_URL=$TEST_DATABASE_URL pnpm db:deploy
 *   TEST_DATABASE_URL=… pnpm test:integration
 */
import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { generateLicenseKey, hashLicenseKey, licenseKeyHint, normalizeLicenseKey } from "../../lib/license/key.ts";
import { BALANCED_POLICY } from "../../lib/license/policy.ts";
import { createLicenseService, type LicenseServiceDeps } from "../../lib/license/service.ts";
import { loadSigningConfig, type SigningConfig } from "../../lib/license/signing.ts";
import { signActivationToken, verifyActivationToken } from "../../lib/license/token.ts";

const url = process.env.TEST_DATABASE_URL;
// CI must run this suite, never skip it silently.
if (!url && process.env.CI) throw new Error("TEST_DATABASE_URL must be set in CI");
const DAY = 86_400_000;

function signingFor(kid: string): SigningConfig {
  const { privateKey } = generateKeyPairSync("ed25519");
  const config = loadSigningConfig({
    LICENSE_SIGNING_KEY: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    LICENSE_SIGNING_KID: kid,
  });
  assert.ok(config);
  return config;
}

describe("license service (Postgres)", { skip: url ? false : "TEST_DATABASE_URL is not set" }, () => {
  let db: PrismaClient;
  const signing = signingFor("test1");
  let clock = new Date("2026-11-04T12:00:00Z");
  let service: ReturnType<typeof createLicenseService>;

  function make(overrides: Partial<LicenseServiceDeps> = {}) {
    return createLicenseService({ db, signing, policy: BALANCED_POLICY, now: () => clock, ...overrides });
  }

  async function seedLicense(status = "active") {
    const key = generateLicenseKey();
    const canonical = normalizeLicenseKey(key);
    assert.ok(canonical);
    const license = await db.license.create({
      data: { keyHash: hashLicenseKey(canonical), keyHint: licenseKeyHint(canonical), email: "buyer@example.com", status },
    });
    return { key, license };
  }

  async function activate(key: string, deviceId = randomUUID()) {
    return { deviceId, result: await service.activate({ licenseKey: key, deviceId, appVersion: "1.0.0", deviceName: "Studio Mac" }) };
  }

  before(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });
  });
  after(async () => {
    await db?.$disconnect();
  });
  beforeEach(async () => {
    clock = new Date("2026-11-04T12:00:00Z");
    service = make();
    await db.$executeRawUnsafe('TRUNCATE "LicenseActivation", "License" CASCADE');
  });

  test("activation issues a token this server and the app can verify offline", async () => {
    const { key, license } = await seedLicense();
    const { deviceId, result } = await activate(key.toLowerCase().replace(/-/g, " "));
    assert.ok(result.ok);
    assert.equal(result.status, 201);
    assert.equal(result.body.license.key_hint, license.keyHint);
    assert.equal(result.body.expires_at, new Date(clock.getTime() + 30 * DAY).toISOString());
    assert.equal(result.body.refresh_after, new Date(clock.getTime() + 7 * DAY).toISOString());

    const verified = verifyActivationToken(result.body.token, signing.publicKeys, { now: clock });
    assert.ok(verified.ok);
    assert.equal(verified.claims.license_id, license.id);
    assert.equal(verified.claims.activation_id, result.body.activation_id);

    const stored = await db.licenseActivation.findUniqueOrThrow({ where: { id: result.body.activation_id } });
    assert.equal(stored.deviceName, "Studio Mac");
    assert.notEqual(stored.deviceHash, deviceId, "the raw device id is never stored");
  });

  test("activating the same Mac again reuses its seat", async () => {
    const { key } = await seedLicense();
    const first = await activate(key);
    assert.ok(first.result.ok);
    const again = await activate(key, first.deviceId);
    assert.ok(again.result.ok);
    assert.equal(again.result.status, 200);
    assert.equal(again.result.body.activation_id, first.result.body.activation_id);
    assert.equal(await db.licenseActivation.count(), 1);
  });

  test("a fourth Mac is refused until one is deactivated", async () => {
    const { key } = await seedLicense();
    const macs = [];
    for (let i = 0; i < 3; i++) {
      const mac = await activate(key);
      assert.ok(mac.result.ok);
      macs.push(mac);
    }
    const fourth = await activate(key);
    assert.deepEqual(fourth.result.ok ? null : fourth.result.code, "device_limit_reached");

    const [first] = macs;
    assert.ok(first.result.ok);
    const off = await service.deactivate({ token: first.result.body.token, deviceId: first.deviceId });
    assert.deepEqual(off, { ok: true, status: 204, body: null });
    const retry = await activate(key, fourth.deviceId);
    assert.ok(retry.result.ok);
    assert.equal(retry.result.status, 201);
  });

  test("parallel activations from new Macs never exceed the limit", async () => {
    const { key } = await seedLicense();
    const results = await Promise.all(Array.from({ length: 6 }, () => activate(key)));
    const ok = results.filter((r) => r.result.ok).length;
    const refused = results.filter((r) => !r.result.ok && r.result.code === "device_limit_reached").length;
    assert.equal(ok, 3);
    assert.equal(refused, 3);
    assert.equal(await db.licenseActivation.count({ where: { deactivatedAt: null } }), 3);
  });

  test("refresh renews a token, even after it expired offline", async () => {
    const { key } = await seedLicense();
    const { deviceId, result } = await activate(key);
    assert.ok(result.ok);

    clock = new Date(clock.getTime() + 45 * DAY);
    const expired = verifyActivationToken(result.body.token, signing.publicKeys, { now: clock });
    assert.deepEqual(expired, { ok: false, reason: "expired" });

    const renewed = await service.refresh({ token: result.body.token, deviceId, appVersion: "1.1.0" });
    assert.ok(renewed.ok);
    assert.equal(renewed.status, 200);
    assert.equal(renewed.body.activation_id, result.body.activation_id);
    assert.equal(renewed.body.expires_at, new Date(clock.getTime() + 30 * DAY).toISOString());
    assert.ok(verifyActivationToken(renewed.body.token, signing.publicKeys, { now: clock }).ok);

    const stored = await db.licenseActivation.findUniqueOrThrow({ where: { id: result.body.activation_id } });
    assert.equal(stored.appVersion, "1.1.0");
    assert.equal(stored.lastValidatedAt.toISOString(), clock.toISOString());
  });

  test("a revoked license stops at its next refresh", async () => {
    const { key, license } = await seedLicense();
    const { deviceId, result } = await activate(key);
    assert.ok(result.ok);
    await db.license.update({ where: { id: license.id }, data: { status: "revoked", revokedReason: "refunded", revokedAt: clock } });

    const refreshed = await service.refresh({ token: result.body.token, deviceId, appVersion: "1.0.0" });
    assert.deepEqual(refreshed.ok ? null : refreshed.code, "license_revoked");
    const again = await activate(key, deviceId);
    assert.deepEqual(again.result.ok ? null : again.result.code, "license_revoked");
  });

  test("a token is bound to its Mac and to this server's keys", async () => {
    const { key } = await seedLicense();
    const { deviceId, result } = await activate(key);
    assert.ok(result.ok);

    const otherMac = await service.refresh({ token: result.body.token, deviceId: randomUUID(), appVersion: "1.0.0" });
    assert.deepEqual(otherMac.ok ? null : otherMac.code, "token_invalid");
    const otherMacOff = await service.deactivate({ token: result.body.token, deviceId: randomUUID() });
    assert.deepEqual(otherMacOff.ok ? null : otherMacOff.code, "token_invalid");

    const foreign = make({ signing: signingFor("test1") });
    const forged = await foreign.refresh({ token: result.body.token, deviceId, appVersion: "1.0.0" });
    assert.deepEqual(forged.ok ? null : forged.code, "token_invalid");
    const garbage = await service.refresh({ token: "sblt1.test1.e30.AAAA", deviceId, appVersion: "1.0.0" });
    assert.deepEqual(garbage.ok ? null : garbage.code, "token_invalid");
  });

  test("a deactivated Mac must activate again; deactivating twice is fine", async () => {
    const { key } = await seedLicense();
    const { deviceId, result } = await activate(key);
    assert.ok(result.ok);
    const input = { token: result.body.token, deviceId };
    assert.deepEqual(await service.deactivate(input), { ok: true, status: 204, body: null });
    assert.deepEqual(await service.deactivate(input), { ok: true, status: 204, body: null });

    const refreshed = await service.refresh({ ...input, appVersion: "1.0.0" });
    assert.deepEqual(refreshed.ok ? null : refreshed.code, "activation_not_found");

    const back = await activate(key, deviceId);
    assert.ok(back.result.ok);
    assert.notEqual(back.result.body.activation_id, result.body.activation_id);
  });

  test("a validly signed token for an unknown activation is activation_not_found", async () => {
    const deviceId = randomUUID();
    const { deviceHash } = await import("../../lib/license/token.ts");
    const seconds = Math.floor(clock.getTime() / 1000);
    const token = signActivationToken(
      { v: 1, edition: "direct", license_id: "nope", activation_id: "nope", device_hash: deviceHash(deviceId), iat: seconds, exp: seconds + 60 },
      signing.kid,
      signing.privateKey,
    );
    const refreshed = await service.refresh({ token, deviceId, appVersion: "1.0.0" });
    assert.deepEqual(refreshed.ok ? null : refreshed.code, "activation_not_found");
    const off = await service.deactivate({ token, deviceId });
    assert.deepEqual(off.ok ? null : off.code, "activation_not_found");
  });

  test("malformed and unknown keys are told apart", async () => {
    const malformed = await activate("SEOB-NOT-A-KEY");
    assert.deepEqual(malformed.result.ok ? null : malformed.result.code, "invalid_license_key");
    const unknown = await activate(generateLicenseKey());
    assert.deepEqual(unknown.result.ok ? null : unknown.result.code, "license_not_found");
  });

  test("without a signing key every endpoint is not_configured", async () => {
    const { key } = await seedLicense();
    const unconfigured = make({ signing: null });
    const results = [
      await unconfigured.activate({ licenseKey: key, deviceId: randomUUID(), appVersion: "1.0.0" }),
      await unconfigured.refresh({ token: "sblt1.a.b.c", deviceId: randomUUID(), appVersion: "1.0.0" }),
      await unconfigured.deactivate({ token: "sblt1.a.b.c", deviceId: randomUUID() }),
    ];
    for (const result of results) assert.deepEqual(result.ok ? null : result.code, "not_configured");
    assert.equal(await db.licenseActivation.count(), 0);
  });
});
