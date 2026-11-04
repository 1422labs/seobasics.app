import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Applies prisma/migrations to a database and records them in `_prisma_migrations` the way
// `prisma migrate deploy` (Prisma 7.10) does, so the Prisma CLI keeps working on the same
// database (`migrate status`, `migrate resolve`, `migrate dev`). The image's migrate job runs
// it (`node dist/migrate.mjs`, scripts/migrate.ts) because the runtime image has no Prisma
// CLI, no package manager and no sources. Development keeps using the CLI (`pnpm db:deploy`,
// `pnpm check:migrations`). Ported from 1422labs/llmgw lib/migrate.ts (2026-10-16).
//
// On purpose unlike the CLI, which sends a migration statement by statement: a migration
// file goes to Postgres as one query, which runs as one transaction, so a failed migration
// leaves nothing half-applied. A file with a statement that can't run inside that
// transaction (CREATE INDEX CONCURRENTLY, VACUUM, …) or that controls transactions itself
// (BEGIN, COMMIT, …) is refused before anything is touched; such a migration has to be
// applied with the CLI. tests/integration/migrate-runner.test.ts checks the runner against
// the CLI on a scratch schema.

/** The schema engine's own lock, `SELECT pg_advisory_lock(72707369)`, held for the session. */
const LOCK_KEY = 72707369;
const LOCK_TIMEOUT = "10s";
/**
 * What can't be part of the one transaction a migration runs in: statements Postgres
 * refuses inside a transaction block, and transaction control, which would split the file.
 */
const NOT_IN_TRANSACTION =
  /^(VACUUM|BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK|ABORT|SAVEPOINT|RELEASE|PREPARE\s+TRANSACTION|CREATE\s+(DATABASE|TABLESPACE)|DROP\s+(DATABASE|TABLESPACE)|ALTER\s+SYSTEM|REINDEX\s+(DATABASE|SYSTEM))\b|\bCONCURRENTLY\b/i;

/** The CLI's own definition of the table, column for column. */
const CREATE_TABLE = `CREATE TABLE _prisma_migrations (
    id                      VARCHAR(36) PRIMARY KEY NOT NULL,
    checksum                VARCHAR(64) NOT NULL,
    finished_at             TIMESTAMPTZ,
    migration_name          VARCHAR(255) NOT NULL,
    logs                    TEXT,
    rolled_back_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
)`;

export class MigrateError extends Error {
  constructor(
    /** The CLI's code for the same situation where it has one (P1002, P3005, P3009, P3018). */
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MigrateError";
  }
}

export type MigrateResult = { found: number; applied: string[] };

/** The statements of a migration, without comments: what `;` separates, trimmed. */
export function statementsOf(sql: string): string[] {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .split(";")
    .map((statement) => statement.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** The first statement of a migration that can't run in its transaction, or null. */
export function refusedStatement(sql: string): string | null {
  return statementsOf(sql).find((statement) => NOT_IN_TRANSACTION.test(statement)) ?? null;
}

/** The migrations of a directory, oldest first: every subdirectory with a migration.sql. */
export function localMigrations(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, "migration.sql")))
    .map((entry) => entry.name)
    .sort();
}

type Row = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

/**
 * Applies the pending migrations of `dir` to the database at `connectionString`. Resolves
 * with what it found and applied; throws a MigrateError and applies nothing further when a
 * migration fails or the database is not in a state the CLI would accept either.
 */
export async function applyMigrations(
  connectionString: string,
  dir: string,
  log: (line: string) => void = () => {},
): Promise<MigrateResult> {
  const lock = readFileSync(path.join(dir, "migration_lock.toml"), "utf8");
  if (!/provider\s*=\s*"postgresql"/.test(lock)) {
    throw new MigrateError("provider", `${path.join(dir, "migration_lock.toml")} is not for postgresql`);
  }
  const local = localMigrations(dir);
  const scriptOf = (name: string) => readFileSync(path.join(dir, name, "migration.sql"));

  const client = new pg.Client({ connectionString, application_name: "seobasics-migrate" });
  await client.connect();
  try {
    await client.query(`SET lock_timeout = '${LOCK_TIMEOUT}'`);
    try {
      await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
    } catch {
      throw new MigrateError(
        "P1002",
        `Another migration holds the lock; it was not free within ${LOCK_TIMEOUT}`,
      );
    }
    await client.query("RESET lock_timeout");

    const tables = (
      await client.query<{ relname: string }>(
        "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname = current_schema()",
      )
    ).rows.map((row) => row.relname);
    if (!tables.includes("_prisma_migrations")) {
      if (tables.length > 0) {
        throw new MigrateError(
          "P3005",
          "The database schema is not empty and has no _prisma_migrations table; baseline it with the Prisma CLI first",
        );
      }
      await client.query(CREATE_TABLE);
    }

    const rows = (
      await client.query<Row>(
        "SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at, migration_name",
      )
    ).rows;
    const failed = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
    if (failed.length > 0) {
      throw new MigrateError(
        "P3009",
        `Failed migrations in the database: ${failed.map((row) => row.migration_name).join(", ")}. Repair the database, then mark them with \`prisma migrate resolve\`.`,
      );
    }
    const applied = new Map(
      rows
        .filter((row) => row.finished_at !== null && row.rolled_back_at === null)
        .map((row) => [row.migration_name, row.checksum]),
    );
    for (const [name, checksum] of applied) {
      if (!local.includes(name)) log(`note: ${name} is applied in the database but not in ${dir}`);
      else if (checksum !== sha256(scriptOf(name))) log(`note: ${name} was edited after it was applied`);
    }
    const pending = local.filter((name) => !applied.has(name));
    log(`${local.length} migrations in ${dir}, ${pending.length} pending`);

    // Checked before the first one runs: all or nothing is the point of this runner.
    for (const name of pending) {
      const refused = refusedStatement(scriptOf(name).toString("utf8"));
      if (refused !== null) {
        throw new MigrateError(
          "transaction",
          `Migration ${name} has a statement that can't run inside its transaction (${refused.slice(0, 60)}); apply it with the Prisma CLI`,
        );
      }
    }

    for (const name of pending) {
      const script = scriptOf(name);
      const id = randomUUID();
      await client.query(
        "INSERT INTO _prisma_migrations (id, checksum, started_at, migration_name) VALUES ($1, $2, now(), $3)",
        [id, sha256(script), name],
      );
      try {
        // No parameters: the simple protocol, the whole file as one implicit transaction.
        await client.query(script.toString("utf8"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // The implicit transaction is gone with the error; this only matters if a file
        // smuggled a BEGIN past the check, so the row below can still be written.
        await client.query("ROLLBACK").catch(() => undefined);
        await client.query("UPDATE _prisma_migrations SET logs = $1 WHERE id = $2", [message, id]);
        throw new MigrateError("P3018", `Migration ${name} failed: ${message}`);
      }
      await client.query(
        "UPDATE _prisma_migrations SET applied_steps_count = 1, finished_at = now() WHERE id = $1",
        [id],
      );
      log(`applied ${name}`);
    }
    log(
      pending.length > 0
        ? "All migrations have been successfully applied."
        : "No pending migrations to apply.",
    );
    return { found: local.length, applied: pending };
  } finally {
    // Ends the session, which releases the advisory lock.
    await client.end();
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
