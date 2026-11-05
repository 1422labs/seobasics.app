# License API v1 (direct edition)

The contract between the direct-download macOS app and `seobasics.app`.
Mac App Store copies never call it: Apple entitles them, and they have no
license key. A Stripe license never unlocks a store copy, and a store purchase
never yields a license key.

Status: **v1, activation endpoints implemented** (`lib/license/`,
`app/api/v1/activations/`), tested against Postgres
(`tests/integration/`). Purchase, recovery and revocation flows are not built
yet; see "Not implemented yet" at the end.

## Policy (Balanced, owner decision 2026-11-04)

Implemented in `lib/license/policy.ts` (`BALANCED_POLICY`):

| | |
|---|---|
| Macs active at once | 3. The app can deactivate a Mac itself. |
| Offline token lifetime | 30 days (`expires_at`) |
| Quiet refresh while online | after 7 days (`refresh_after`) |
| Refund or dispute | the license is revoked; the app learns it at its next refresh (`license_revoked`) |
| Recovery | the key is emailed to the purchase address, plus a self-service "reset all activations" link to that address (not built yet) |
| Updates | all 1.x updates are included (license terms, not this protocol) |

## Environments

| | Development | Production |
|---|---|---|
| Base URL | `https://dev.seobasics.app` | `https://seobasics.app` |
| Stripe | test mode | live mode |
| Database | development Postgres | production Postgres |
| Token signing key | dev Ed25519 key (`kid` e.g. `dev1`) | prod Ed25519 key (`kid` e.g. `prod1`) |
| Secrets | 1Password item for dev | 1Password item for prod |

Each environment has its own credentials, webhook endpoint and deployment
configuration. A direct-edition app build is configured with exactly one base
URL and that environment's public keys. A token signed in development
therefore fails verification in a production build (`unknown_key`), and vice
versa.

## Versioning

- Every endpoint lives under `/api/v1/`.
- Within v1, changes are additive only: new optional request fields, new
  response fields, new error codes. The app ignores unknown response fields and
  treats an unknown error code like `internal_error`.
- A breaking change ships as `/api/v2/`. v1 keeps working for as long as a
  supported app version uses it.

## License keys

`SEOB-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

- 24 random Crockford base32 characters (120 bits) and a check character.
- Input is case-insensitive, with dashes and spaces ignored. O, I and L are read
  as 0, 1 and 1, and the `SEOB` prefix is optional.
- The check character rejects about 31 of 32 typos locally, before any request
  is sent (`normalizeLicenseKey`).
- The server stores only `sha256(canonical key)` and the last four characters
  (`keyHint`). It never stores or logs the key itself, and the log redactor
  strips keys and tokens.

## Device identity

On first launch the app creates a random device id (a UUID, kept in the
Keychain) and sends it with activation requests. The server stores only
`sha256("seobasics-device-v1:" + id)`, called the `device_hash`. No hardware
serials or MAC addresses are used.

## Activation tokens

`sblt1.<kid>.<payload>.<signature>`

- `payload` is base64url JSON:
  ```json
  { "v": 1, "edition": "direct", "license_id": "…", "activation_id": "…",
    "device_hash": "…", "iat": 1793707200, "exp": 1796299200 }
  ```
- `signature` is base64url Ed25519 over the ASCII bytes `sblt1.<kid>.<payload>`.
- The app checks the token offline with CryptoKit `Curve25519.Signing`. It
  accepts the token only if all of these hold:
  1. it has the `sblt1` prefix and four parts;
  2. `kid` is one of the bundled public keys;
  3. the signature is valid;
  4. the claims are well-formed, with `edition == "direct"`;
  5. `exp` is in the future;
  6. `device_hash` matches this Mac's device id.
- A failure after `exp` means "go online and refresh". Every other failure
  means "this copy is not activated".

## Endpoints

All requests and responses are JSON. Errors always use this envelope:

```json
{ "error": { "code": "device_limit_reached", "message": "Human-readable text." } }
```

| Method and path | Body | Success |
|---|---|---|
| `POST /api/v1/activations` | `license_key`, `device_id`, `app_version`, optional `device_name` | `201` with `activation_id`, `token`, `expires_at`, `refresh_after`, `license.key_hint`. Repeating the request from the same Mac returns `200` with its existing `activation_id` and a fresh token, and uses no new seat. |
| `POST /api/v1/activations/refresh` | `token` (may be expired), `device_id`, `app_version` | `200` with `activation_id`, a new `token`, `expires_at` and `refresh_after`, provided the license is still active and the activation has not been deactivated |
| `POST /api/v1/activations/deactivate` | `token` (may be expired), `device_id` | `204`; the seat is freed. Deactivating an already deactivated Mac is also `204`. |

Details:

- `expires_at` and `refresh_after` are ISO 8601 UTC timestamps. The app
  refreshes once `refresh_after` has passed and it is online; it keeps
  working offline until `expires_at`.
- `device_id` is the per-install UUID string (16–128 characters), sent
  exactly as stored; `app_version` is at most 32 characters and `device_name`
  at most 100. Unknown request fields are ignored.
- Refresh and deactivate accept an expired token (the signature, `kid` and
  device are still checked), so a Mac that was offline past `expires_at` can
  recover or free its seat. A token for another Mac, from another
  environment's key or with a bad signature is `token_invalid`.
- Activations of one license are serialized with a row lock on the license,
  so parallel requests from new Macs never exceed 3.
- Refresh checks the license before the activation: a revoked license is
  `license_revoked` even if that Mac was also deactivated.
- Every response carries `Cache-Control: no-store`; `/api/*` is
  `X-Robots-Tag: noindex`.

### Server configuration

| Variable | |
|---|---|
| `LICENSE_SIGNING_KEY` | PEM (PKCS#8) Ed25519 private key of this environment. Literal `\n` is accepted for single-line secrets. |
| `LICENSE_SIGNING_KID` | Its key id (`dev1`, `prod1`, …), 1–32 base64url characters. |
| `LICENSE_PREVIOUS_PUBLIC_KEYS` | Optional JSON `{ "<kid>": "<PEM public key>" }` of retired keys, so their tokens can still refresh and deactivate after a rotation. |

If the key or kid is missing or invalid, every endpoint answers `503
not_configured` and nothing is written. Key material is never logged.

Error codes are a stable contract, implemented in `lib/api.ts`:

| Code | HTTP | Meaning for the app |
|---|---|---|
| `invalid_request` | 400 | Bug or outdated client |
| `invalid_license_key` | 400 | The key is malformed (a typo) |
| `license_not_found` | 404 | No such key |
| `license_revoked` | 403 | Refunded or disputed; stop working |
| `device_limit_reached` | 409 | Deactivate another Mac first |
| `activation_not_found` | 404 | This Mac was deactivated; activate again |
| `token_invalid` | 401 | Bad signature, wrong device or malformed token |
| `rate_limited` | 429 | Retry after the `Retry-After` header |
| `not_configured` | 503 | The server has no license policy or signing key yet |
| `internal_error` | 500 | Retry later; keep using a still-valid token |

## Purchase flow (planned, not implemented)

1. Stripe Checkout runs on `seobasics.app`.
2. A webhook marks a paid session.
3. A license is created idempotently: one license per Checkout Session, with
   `StripeEvent` rows de-duplicating events.
4. The key is shown on the success page and emailed through the Email
   Gateway, together with the download link.
5. A refund or dispute revokes the license. At its next refresh the app gets
   `license_revoked`.

## Not implemented yet

- Rate limiting (`rate_limited` is reserved in the contract but never sent
  yet).
- Stripe Checkout, the webhook that creates licenses, and refund/dispute
  revocation. They need the Stripe test and live product/price IDs and the
  webhook events (owner decision).
- Key recovery email and the "reset all activations" link. They need the
  Email Gateway credentials for each environment.
- The signing keys themselves: created in each environment's 1Password item by
  the owner, never by this repository.

## Pending owner decisions

- Stripe product and price identifiers (test and live), and which webhook
  events revoke a license.
- Creation of the signing keys and production secrets in 1Password.
- Major-version upgrade policy (license terms, not the protocol).
