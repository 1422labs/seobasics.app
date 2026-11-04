# seobasics.app (website + direct-license API)

Next.js (App Router) site and the versioned license API for the direct
(Stripe) edition of the SEO Basics macOS app. The app lives in
`1422labs/seobasics`; the license contract it consumes is
`docs/license-api-v1.md`.

## Layout

- `app/`: routes. The landing page (`page.tsx`), `robots.ts`, `sitemap.ts`,
  `healthz` (k8s probe) and `/_dev/version` (`app/%5Fdev`, deploy check).
  Load the `design` skill before any UI work. Tailwind v4 (`globals.css`,
  `@source not` excludes the unreadable `dev_db/data`).
  - Indexing is decided per request: only `APP_URL=https://seobasics.app` is
    indexable (`lib/site.ts`), so the same image never lets `dev.` be indexed.
  - Purchase links come from `NEXT_PUBLIC_CHECKOUT_URL` and
    `NEXT_PUBLIC_APP_STORE_URL`. Until Stripe and App Store exist they point
    at `/#pricing`.
- `components/`: page components. `star-mark.tsx` renders
  `brand/mark/paths.json`, and `agent-session.tsx` is the hero's MCP example,
  which uses real tool names and fields from the app's catalog.
- `public/fonts/`: self-hosted InterVariable (OFL), with no third-party font requests.
- `lib/license/`: license keys (`key.ts`), Ed25519 activation tokens
  (`token.ts`), pure activation decisions (`activation.ts`), the owner-approved
  Balanced policy (`policy.ts`, change only on Lars's decision), the
  env-loaded signing key (`signing.ts`), the activate/refresh/deactivate
  service over Prisma (`service.ts`), body parsing and responses (`http.ts`)
  and the wiring for route handlers (`server.ts`).
- `app/api/v1/activations/`: thin `POST` route handlers for
  `/api/v1/activations`, `/refresh` and `/deactivate`.
- `lib/api.ts`: the `/api/v1` error envelope and codes. These are a stable
  contract: add to it, never rename.
- `lib/env.ts`, `lib/logger.ts` (`redactSecrets` strips license keys, tokens
  and Stripe secrets), `lib/prisma.ts`.
- `prisma/`: Prisma 7 schema and migrations; the client is generated into
  `generated/` (gitignored).
- `brand/mark/`: the star mark (refined direction A, awaiting Lars's final
  approval). `python3 -I brand/mark/generate.py` regenerates the SVGs, the
  AppIcon.appiconset, the web icons in `app/` and `public/brand/`, and the
  test sheet. `brand/directions/` holds the superseded sketches.

## Commands

```sh
cp .env.example .env
docker compose -f dev_db/docker-compose.yml up -d   # Postgres on localhost:5347
pnpm install && pnpm db:generate && pnpm db:deploy
pnpm dev                                            # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
TEST_DATABASE_URL=<dedicated migrated db> pnpm test:integration  # empties license tables
DATABASE_URL=<empty db> pnpm check:migrations       # migrations == schema
```

## CI

`.github/workflows/ci.yml` has these jobs: `runner-policy`, `checks` (lint,
typecheck, unit tests), `build`, `database` (Postgres 16 service,
`check:migrations`, then `test:integration` on the same database) and the `Mandatory checks` gate.

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
