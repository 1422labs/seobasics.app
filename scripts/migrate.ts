// The image's migrate job, an Argo Sync hook (chart/templates/migrate-job.yml):
// `node dist/migrate.mjs`, bundled by `pnpm build:tools`. Applies prisma/migrations to
// DATABASE_URL the way `prisma migrate deploy` does, without the Prisma CLI (lib/migrate.ts).
//
//   node dist/migrate.mjs [migrations directory]   in the image
//   pnpm exec tsx scripts/migrate.ts                 in a checkout (`pnpm db:deploy` does the same with the CLI)
import path from "node:path";
import { applyMigrations, MigrateError } from "@/lib/migrate";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}
const dir = path.resolve(process.argv[2] ?? "prisma/migrations");

try {
  await applyMigrations(url, dir, (line) => console.log(line));
} catch (error) {
  // The message only: a connection error must not echo the URL.
  const message = error instanceof MigrateError ? `${error.code}: ${error.message}` : error instanceof Error ? error.message : String(error);
  console.error(`FAILED: ${message}`);
  process.exit(1);
}
