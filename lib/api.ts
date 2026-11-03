/**
 * The versioned JSON API's error envelope (docs/license-api-v1.md):
 * `{ "error": { "code": "...", "message": "..." } }`. Codes are a stable
 * contract; messages are for people and may change.
 */

export type ApiErrorCode =
  | "invalid_request"
  | "invalid_license_key"
  | "license_not_found"
  | "license_revoked"
  | "device_limit_reached"
  | "activation_not_found"
  | "token_invalid"
  | "rate_limited"
  | "not_configured"
  | "internal_error";

const STATUS: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  invalid_license_key: 400,
  license_not_found: 404,
  license_revoked: 403,
  device_limit_reached: 409,
  activation_not_found: 404,
  token_invalid: 401,
  rate_limited: 429,
  not_configured: 503,
  internal_error: 500,
};

export function apiErrorStatus(code: ApiErrorCode) {
  return STATUS[code];
}

export function apiError(code: ApiErrorCode, message: string, init?: { headers?: HeadersInit }) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json({ error: { code, message } }, { status: STATUS[code], headers });
}
