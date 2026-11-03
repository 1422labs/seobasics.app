import { createHash, sign, verify, type KeyObject } from "node:crypto";

/**
 * Signed activation tokens: what lets the direct edition run without a network
 * call on every launch.
 *
 * Format: `sblt1.<kid>.<payload>.<signature>`
 * - payload: base64url JSON (`ActivationClaims`);
 * - signature: base64url Ed25519 over the ASCII bytes `sblt1.<kid>.<payload>`.
 *
 * The private key exists only in the server's secret store, one per
 * environment. The app ships the public keys of its environment and verifies
 * offline with CryptoKit (Curve25519.Signing). `kid` lets a key be rotated
 * without invalidating tokens signed by the previous one.
 */

export const TOKEN_PREFIX = "sblt1";

export type ActivationClaims = {
  /** Claims format version. */
  v: 1;
  /** Always "direct": App Store purchases never receive a token. */
  edition: "direct";
  license_id: string;
  activation_id: string;
  /** Must equal deviceHash() of the verifying Mac's device id. */
  device_hash: string;
  /** Unix seconds. */
  iat: number;
  /** Unix seconds; the app needs a fresh token (online) after this. */
  exp: number;
};

export type TokenVerification =
  | { ok: true; claims: ActivationClaims }
  | { ok: false; reason: "malformed" | "unknown_key" | "bad_signature" | "expired" | "wrong_device" };

/**
 * The server never stores or compares raw device ids. The app sends its
 * per-install random id; both sides derive this hash.
 */
export function deviceHash(deviceID: string) {
  return createHash("sha256").update(`seobasics-device-v1:${deviceID}`).digest("hex");
}

function encode(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

export function signActivationToken(claims: ActivationClaims, kid: string, privateKey: KeyObject) {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(kid)) throw new Error("kid must be 1-32 base64url characters");
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("activation tokens are signed with Ed25519");
  const signingInput = `${TOKEN_PREFIX}.${kid}.${encode(JSON.stringify(claims))}`;
  return `${signingInput}.${encode(sign(null, Buffer.from(signingInput), privateKey))}`;
}

function isClaims(value: unknown): value is ActivationClaims {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    c.v === 1 &&
    c.edition === "direct" &&
    typeof c.license_id === "string" &&
    typeof c.activation_id === "string" &&
    typeof c.device_hash === "string" &&
    Number.isSafeInteger(c.iat) &&
    Number.isSafeInteger(c.exp)
  );
}

/**
 * Verifies a token against the environment's public keys (by kid). The server
 * uses this when an app refreshes or deactivates; the app implements the same
 * steps in Swift.
 */
export function verifyActivationToken(
  token: string,
  publicKeys: ReadonlyMap<string, KeyObject>,
  options: { now: Date; deviceHash?: string },
): TokenVerification {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) return { ok: false, reason: "malformed" };
  const [, kid, payload, signature] = parts;
  const key = publicKeys.get(kid);
  if (!key) return { ok: false, reason: "unknown_key" };

  let valid = false;
  try {
    valid = verify(null, Buffer.from(`${TOKEN_PREFIX}.${kid}.${payload}`), key, Buffer.from(signature, "base64url"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!valid) return { ok: false, reason: "bad_signature" };

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isClaims(claims)) return { ok: false, reason: "malformed" };
  if (claims.exp <= Math.floor(options.now.getTime() / 1000)) return { ok: false, reason: "expired" };
  if (options.deviceHash !== undefined && claims.device_hash !== options.deviceHash) {
    return { ok: false, reason: "wrong_device" };
  }
  return { ok: true, claims };
}
