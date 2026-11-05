const SECRET_PARAM_RE = /([?&](?:apikey|key|token|secret|license|license_key)=)[^&\s]+/gi;
const BEARER_RE = /(bearer\s+)[A-Za-z0-9._~+/=-]+/gi;
// Direct-edition license keys (lib/license/key.ts) and signed activation tokens.
const LICENSE_KEY_RE = /\bSEOB(?:-[0-9A-Z]{5}){5}\b/gi;
const LICENSE_TOKEN_RE = /\bsblt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const STRIPE_SECRET_RE = /\b(?:sk|rk|whsec)_(?:live|test)?_?[A-Za-z0-9]{8,}/g;

export function redactSecrets(value: string) {
  return value
    .replace(SECRET_PARAM_RE, "$1[redacted]")
    .replace(BEARER_RE, "$1[redacted]")
    .replace(LICENSE_KEY_RE, "SEOB-[redacted]")
    .replace(LICENSE_TOKEN_RE, "sblt1.[redacted]")
    .replace(STRIPE_SECRET_RE, "[redacted]");
}

export function logError(message: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(redactSecrets(`${message}: ${detail}`));
}

export function logWarn(message: string, detail: unknown) {
  console.warn(redactSecrets(`${message}: ${String(detail)}`));
}
