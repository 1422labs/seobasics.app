import { createHash, randomBytes } from "node:crypto";

/**
 * Direct-edition license keys: `SEOB-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`.
 *
 * - 24 random Crockford base32 characters (120 bits from the CSPRNG) and one
 *   check character, in five groups of five.
 * - Crockford's alphabet has no I, L, O or U. Input is uppercased, and O, I and L
 *   are read as 0, 1 and 1, so a key typed from an email still works.
 * - The check character catches almost all typos (31 in 32) before any network
 *   call. It is not a security measure: the key is a bearer secret, and the
 *   server only stores its hash.
 */

export const LICENSE_KEY_PREFIX = "SEOB";
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const RANDOM_LENGTH = 24;
const BODY_LENGTH = RANDOM_LENGTH + 1;

function checkCharacter(random: string) {
  const digest = createHash("sha256").update(`seobasics-license-v1:${random}`).digest();
  return ALPHABET[digest[0] & 31];
}

function format(body: string) {
  const groups = body.match(/.{5}/g) ?? [];
  return [LICENSE_KEY_PREFIX, ...groups].join("-");
}

/** A new random license key, formatted for display. */
export function generateLicenseKey() {
  // Rejection-free: 256 is a multiple of 32, so `byte & 31` is uniform.
  const bytes = randomBytes(RANDOM_LENGTH);
  let random = "";
  for (const byte of bytes) random += ALPHABET[byte & 31];
  return format(random + checkCharacter(random));
}

/**
 * The canonical form of a key as a user may have typed it, or null if it is
 * not a well-formed key (wrong length, foreign characters, failed check).
 */
export function normalizeLicenseKey(input: string): string | null {
  let compact = input.toUpperCase().replace(/[\s-]+/g, "");
  if (compact.startsWith(LICENSE_KEY_PREFIX)) compact = compact.slice(LICENSE_KEY_PREFIX.length);
  compact = compact.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (compact.length !== BODY_LENGTH) return null;
  for (const char of compact) if (!ALPHABET.includes(char)) return null;
  const random = compact.slice(0, RANDOM_LENGTH);
  if (compact[RANDOM_LENGTH] !== checkCharacter(random)) return null;
  return format(compact);
}

/** What the database stores: SHA-256 (hex) of the canonical key. */
export function hashLicenseKey(canonicalKey: string) {
  return createHash("sha256").update(canonicalKey).digest("hex");
}

/** Last four characters, safe to show in support conversations and the app. */
export function licenseKeyHint(canonicalKey: string) {
  return canonicalKey.slice(-4);
}
