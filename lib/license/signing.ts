import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";

/**
 * The environment's token signing key. One per environment (dev and prod
 * never share one), supplied by the deployment's secret store:
 *
 * - `LICENSE_SIGNING_KEY`: PEM (PKCS#8) Ed25519 private key. Literal `\n`
 *   sequences are accepted for single-line secret values.
 * - `LICENSE_SIGNING_KID`: its key id, e.g. `dev1` or `prod1`.
 * - `LICENSE_PREVIOUS_PUBLIC_KEYS` (optional): JSON object `{ "<kid>": "<PEM
 *   public key>" }` of retired keys, so tokens they signed can still refresh
 *   and deactivate after a rotation.
 *
 * Anything missing or invalid yields null: the API then answers 503
 * `not_configured` instead of issuing tokens it can't verify. Key material is
 * never logged or put in error messages.
 */
export type SigningConfig = {
  kid: string;
  privateKey: KeyObject;
  /** Every kid this server accepts on refresh/deactivate, current one included. */
  publicKeys: ReadonlyMap<string, KeyObject>;
};

const KID_RE = /^[A-Za-z0-9_-]{1,32}$/;

function pem(value: string) {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

function ed25519Public(value: string): KeyObject | null {
  try {
    const key = createPublicKey(pem(value));
    return key.asymmetricKeyType === "ed25519" ? key : null;
  } catch {
    return null;
  }
}

export function loadSigningConfig(env: Record<string, string | undefined> = process.env): SigningConfig | null {
  const rawKey = env.LICENSE_SIGNING_KEY;
  const kid = env.LICENSE_SIGNING_KID;
  if (!rawKey || !kid || !KID_RE.test(kid)) return null;

  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey(pem(rawKey));
  } catch {
    return null;
  }
  if (privateKey.asymmetricKeyType !== "ed25519") return null;

  const publicKeys = new Map<string, KeyObject>();
  const previous = env.LICENSE_PREVIOUS_PUBLIC_KEYS;
  if (previous) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(previous);
    } catch {
      return null;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    for (const [oldKid, value] of Object.entries(parsed)) {
      if (!KID_RE.test(oldKid) || oldKid === kid || typeof value !== "string") return null;
      const key = ed25519Public(value);
      if (!key) return null;
      publicKeys.set(oldKid, key);
    }
  }
  publicKeys.set(kid, createPublicKey(privateKey));
  return { kid, privateKey, publicKeys };
}

let cached: { fingerprint: string; config: SigningConfig | null } | undefined;

/** loadSigningConfig(process.env), parsed once per distinct value. */
export function currentSigningConfig() {
  const fingerprint = [
    process.env.LICENSE_SIGNING_KEY,
    process.env.LICENSE_SIGNING_KID,
    process.env.LICENSE_PREVIOUS_PUBLIC_KEYS,
  ].join("\u0000");
  if (!cached || cached.fingerprint !== fingerprint) cached = { fingerprint, config: loadSigningConfig() };
  return cached.config;
}
