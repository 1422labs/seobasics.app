/**
 * The image's migrate runner (lib/migrate.ts) against a real Postgres, checked with the
 * Prisma CLI. Works in a scratch schema of TEST_DATABASE_URL's database and drops it after;
 * the license tables are not touched. Without TEST_DATABASE_URL the suite is skipped.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { after, before, describe, test } from "node:test";
import pg from "pg";
import { applyMigrations, localMigrations } from "../../lib/migrate.ts";

const url = process.env.TEST_DATABASE_URL;
if (!url && process.env.CI) throw new Error("TEST_DATABASE_URL must be set in CI");
const dir = "prisma/migrations";

describe("migrate runner (Postgres)", { skip: url ? false : "TEST_DATABASE_URL is not set" }, () => {
  const schema = `migrate_test_${randomBytes(4).toString("hex")}`;
  const withParam = (base: string, param: string) => `${base}${base.includes("?") ? "&" : "?"}${param}`;
  // pg reads the schema from `options`; the Prisma CLI from `schema`.
  const runnerUrl = () => withParam(url!, `options=${encodeURIComponent(`-c search_path=${schema}`)}`);
  const cliUrl = () => withParam(url!, `schema=${schema}`);
  const prisma = (...args: string[]) =>
    execFileSync("pnpm", ["exec", "prisma", ...args], { env: { ...process.env, DATABASE_URL: cliUrl() }, encoding: "utf8", stdio: "pipe" });
  let admin: pg.Client;

  before(async () => {
    admin = new pg.Client({ connectionString: url });
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${schema}"`);
  });
  after(async () => {
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  });

  test("applies every migration to an empty schema, then nothing on a second run", async () => {
    const first = await applyMigrations(runnerUrl(), dir);
    assert.deepEqual(first.applied, localMigrations(dir));
    assert.ok(first.applied.length > 0);
    const second = await applyMigrations(runnerUrl(), dir);
    assert.deepEqual(second.applied, []);
  });

  test("the Prisma CLI accepts the result: up to date, and identical to schema.prisma", () => {
    assert.match(prisma("migrate", "status"), /Database schema is up to date/);
    // Exits non-zero if the database differs from the schema.
    prisma("migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code");
  });
});
