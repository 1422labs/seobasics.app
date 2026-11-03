# License API v1 (direct edition)

The contract between the direct-download macOS app and `seobasics.app`.
Mac App Store copies never call it: Apple entitles them, and they have no
license key. A Stripe license never unlocks a store copy, and a store purchase
never yields a license key.

Status: **draft**. The format and primitives below are implemented and tested
(`lib/license/`). The route handlers wait for the owner decisions listed at
the end.

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

## Endpoints (planned)

All requests and responses are JSON. Errors always use this envelope:

```json
{ "error": { "code": "device_limit_reached", "message": "Human-readable text." } }
```

| Method and path | Body | Success |
|---|---|---|
| `POST /api/v1/activations` | `license_key`, `device_id`, `app_version`, optional `device_name` | `201` with `activation_id`, `token`, `expires_at`, `license.key_hint`. Repeating the request from the same Mac returns its existing activation and uses no new seat. |
| `POST /api/v1/activations/refresh` | `token` (may be expired), `device_id`, `app_version` | `200` with a new `token` and `expires_at`, provided the license is still active and the activation has not been deactivated |
| `POST /api/v1/activations/deactivate` | `token`, `device_id` | `204`; the seat is freed |

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

## Purchase flow (planned)

1. Stripe Checkout runs on `seobasics.app`.
2. A webhook marks a paid session.
3. A license is created idempotently: one license per Checkout Session, with
   `StripeEvent` rows de-duplicating events.
4. The key is shown on the success page and emailed through the Email
   Gateway, together with the download link.
5. A refund or dispute revokes the license. At its next refresh the app gets
   `license_revoked`.

## Pending owner decisions (do not implement before they are decided)

- Device limit, offline token lifetime and refresh cadence, recovery and
  transfer. This is Q3 in the evidence ledger.
- Stripe product and price identifiers (test and live), and which webhook
  events revoke a license.
- Creation of the signing keys and production secrets in 1Password.
- Included update term and major-version upgrade policy (this affects license
  terms, not the protocol).
