# seobasics.app (website + direct-license API)

Next.js (App Router) site and the versioned license API for the direct
(Stripe) edition of the SEO Basics macOS app. The app lives in
`1422labs/seobasics`; the license contract it consumes is
`docs/license-api-v1.md`.

## Layout

- `app/`: routes. The landing page (`page.tsx`), the content pages
  (`docs/mcp`, `changelog`, `support`, `licensing`, `privacy`), `robots.ts`, `sitemap.ts`,
  `healthz` (k8s probe) and `/_dev/version` (`app/%5Fdev`, deploy check).
  Load the `design` skill before any UI work. Tailwind v4 (`globals.css`,
  `@source not` excludes the unreadable `dev_db/data`).
  - Indexing is decided per request: only `APP_URL=https://seobasics.app` is
    indexable (`lib/site.ts`), so the same image never lets `dev.` be indexed.
  - Every page, `robots.ts` and `sitemap.ts` are `force-dynamic`, and every
    content page sets its own canonical with `pageMetadata()` (the root
    layout's is `/`). A new page goes into `pages` in `lib/site.ts`;
    `tests/unit/site-pages.test.ts` checks all three.
  - Purchase links come from the runtime env `CHECKOUT_URL` and
    `APP_STORE_URL` (never `NEXT_PUBLIC_`, which is inlined at build time).
    Until Stripe and App Store exist they point at `/#pricing`.
  - `publisher` in `lib/site.ts` (company name, support email) is an owner
    decision; until it is set, support and privacy show a "published before
    launch" note.
  - `lib/changelog.ts`: add a release only once it has shipped.
  - The privacy and licensing pages state what the code stores. Change them
    with any change to the schema, analytics, fonts or the license policy.
- `components/`: page components. `site-chrome.tsx` (header, footer),
  `content-page.tsx` (text-page layout and typography), `ui.tsx` (buttons). `star-mark.tsx` renders
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
- `lib/migrate.ts`: applies `prisma/migrations` like `prisma migrate deploy`,
  without the Prisma CLI; `scripts/migrate.ts` is the image's migrate job,
  bundled to `dist/migrate.mjs` by `pnpm build:tools`.
- `Dockerfile`: one image for dev and prod (`node server.js`, and `node
  dist/migrate.mjs` for the migrate job), non-root, nothing writable under
  `/app`. All environment-specific values are runtime env.
- `chart/`: Helm chart, for review; nothing deploys it yet. OnePasswordItem
  (sync-wave −20) → migrate Job as an Argo `Sync` hook (−10, never
  `PreSync`) → Deployment. Each release must set its own
  `onepassword.itemPath`; there is no default. `scripts/check-chart.mjs`
  guards all of this.
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
pnpm check:chart                                    # helm lint + render checks, applies nothing
docker build -t seobasics-app:review .
DATABASE_URL=<empty db> sh scripts/smoke-image.sh   # image: migrate job + server, read-only rootfs
```

## CI

`.github/workflows/ci.yml` has these jobs: `runner-policy`, `checks` (lint,
typecheck, unit tests), `build`, `database` (Postgres 16 service,
`check:migrations`, then `test:integration` on the same database), `chart`
(`check:chart`) and the `Mandatory checks` gate. No job builds or pushes the
image yet; that needs the shared BuildKit endpoint and Harbor credentials.

- Every job uses exactly `runs-on: arc-1422labs`;
  `scripts/check-workflow-runners.sh` and `tests/unit/ci-workflow.test.ts`
  enforce this.
- A new job must be added to the gate's `needs`, and the gate's
  `length == N` must be updated to match.
- No deploy or image workflow and no argo-deployments entry exist yet.
  Deploys, registry pushes, Argo entries, Stripe objects and secrets need
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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
