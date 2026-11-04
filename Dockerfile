# syntax=docker/dockerfile:1

# One image for dev.seobasics.app and seobasics.app, two commands: the Next.js server
# (`node server.js`, the default) and the migrate job (`node dist/migrate.mjs`). Everything
# environment-specific (APP_URL, DATABASE_URL, the license signing key, purchase links) is
# runtime env from the chart and its 1Password item; nothing secret is passed at build time.
# The runtime is Alpine with its Node 24 package: no package manager, no sources, no Prisma
# CLI, nothing writable under /app. Pattern: 1422labs/llmgw Dockerfile.

FROM node:24-alpine3.24 AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@12.11.2 && npm cache clean --force

# ---------------------------------------------------------------------------
# deps: the full install, from the frozen lockfile.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder: Prisma client, the migrate bundle, the Next.js standalone build.
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-only value: `prisma generate` and `next build` connect to nothing.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm db:generate \
 && pnpm build:tools \
 && pnpm build

# ---------------------------------------------------------------------------
FROM alpine:3.24 AS runner
RUN apk add --no-cache nodejs \
 && addgroup -S -g 1001 app && adduser -S -D -H -h /app -u 1001 -G app app
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Owned by root, readable by the app user: nothing under /app is written at runtime, and the
# chart mounts the root filesystem read-only, with a /tmp.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# The deployed commit, served by /_dev/version. Last, so a new commit rebuilds nothing above.
ARG SEOBASICS_COMMIT_SHA=dev
ENV SEOBASICS_COMMIT_SHA=$SEOBASICS_COMMIT_SHA

USER 1001
EXPOSE 3000
CMD ["node", "server.js"]
