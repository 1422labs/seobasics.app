# seobasics.app (website + direct-license API)

Next.js (App Router) site and the versioned license API for the direct
(Stripe) edition of the SEO Basics macOS app. The app lives in
`1422labs/seobasics`; the license contract it consumes is
`docs/license-api-v1.md`.

## Layout

- `app/`: routes. `healthz` (k8s probe) and `/_dev/version` (`app/%5Fdev`,
  deploy check). There are no UI pages yet; load the `design` skill before
  adding any.
- `lib/license/`: license keys (`key.ts`), Ed25519 activation tokens
  (`token.ts`) and pure activation decisions (`activation.ts`). The policy
  numbers are owner decisions, so don't hard-code them.
- `lib/api.ts`: the `/api/v1` error envelope and codes. These are a stable
  contract: add to it, never rename.
- `lib/env.ts`, `lib/logger.ts` (`redactSecrets` strips license keys, tokens
  and Stripe secrets), `lib/prisma.ts`.
- `prisma/`: Prisma 7 schema and migrations; the client is generated into
  `generated/` (gitignored).
- `brand/`: star-mark directions (owner selection pending; not app code).

## Commands

```sh
cp .env.example .env
docker compose -f dev_db/docker-compose.yml up -d   # Postgres on localhost:5347
pnpm install && pnpm db:generate && pnpm db:deploy
pnpm dev                                            # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
DATABASE_URL=<empty db> pnpm check:migrations       # migrations == schema
```

## CI

`.github/workflows/ci.yml` has these jobs: `runner-policy`, `checks` (lint,
typecheck, unit tests), `build`, `database` (Postgres 16 service,
`check:migrations`) and the `Mandatory checks` gate.

- Every job uses exactly `runs-on: arc-1422labs`;
  `scripts/check-workflow-runners.sh` and `tests/unit/ci-workflow.test.ts`
  enforce this.
- A new job must be added to the gate's `needs`, and the gate's
  `length == N` must be updated to match.
- No deploy workflow exists yet. Deploys, Stripe objects and secrets need
  Lars's explicit decision.

## Rules

- Development (`dev.seobasics.app`, Stripe test mode, dev DB) and production
  (`seobasics.app`, live mode, prod DB) never share data, keys, webhooks or
  secrets.
- Never commit, log or print secrets, license keys or tokens. `.env*` is
  gitignored except `.env.example`.
- Store only `sha256` of license keys and device ids.
- Store-edition purchases never get license keys, and the license API never
  entitles a store copy.
