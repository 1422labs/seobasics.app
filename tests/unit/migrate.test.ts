import assert from "node:assert/strict";
import { test } from "node:test";
import { localMigrations, refusedStatement, statementsOf } from "../../lib/migrate.ts";

test("statements are split on ; without comments", () => {
  assert.deepEqual(statementsOf("-- c\nCREATE TABLE a (id int);\n/* x; y */ CREATE INDEX b ON a (id);\n"), ["CREATE TABLE a (id int)", "CREATE INDEX b ON a (id)"]);
});

test("statements that can't run in the migration's transaction are refused", () => {
  assert.equal(refusedStatement("CREATE TABLE a (id int);"), null);
  assert.match(refusedStatement("CREATE INDEX CONCURRENTLY i ON a (id);") ?? "", /CONCURRENTLY/);
  assert.match(refusedStatement("BEGIN; CREATE TABLE a (id int); COMMIT;") ?? "", /^BEGIN/);
  assert.match(refusedStatement("VACUUM a;") ?? "", /^VACUUM/);
});

test("the shipped migrations all run inside one transaction each", async () => {
  const { readFileSync } = await import("node:fs");
  const names = localMigrations("prisma/migrations");
  assert.ok(names.length > 0);
  for (const name of names) assert.equal(refusedStatement(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8")), null, name);
});
