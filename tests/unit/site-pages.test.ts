import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { releases } from "../../lib/changelog.ts";
import { pages } from "../../lib/site.ts";

const fileOf = (path: string) => (path === "/" ? "app/page.tsx" : `app${path}/page.tsx`);

test("every sitemap page exists", () => {
  for (const page of pages) assert.ok(existsSync(fileOf(page.path)), `${fileOf(page.path)} is missing`);
});

test("every content page sets its own canonical, and every page decides indexing per request", () => {
  for (const page of pages) {
    const source = readFileSync(fileOf(page.path), "utf8");
    // The root layout's robots and canonical depend on APP_URL at request time (lib/site.ts isIndexable).
    assert.match(source, /export const dynamic = "force-dynamic"/, `${page.path} must be force-dynamic`);
    if (page.path !== "/") {
      assert.ok(source.includes(`pageMetadata(\n  "${page.path}"`), `${page.path} must pass its own path to pageMetadata`);
    }
  }
  for (const file of ["app/sitemap.ts", "app/robots.ts"]) {
    assert.match(readFileSync(file, "utf8"), /export const dynamic = "force-dynamic"/, `${file} must be force-dynamic`);
  }
});

test("the changelog lists only well-formed releases, newest first", () => {
  for (const release of releases) {
    assert.match(release.version, /^\d+\.\d+(\.\d+)?$/);
    assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(release.groups.length > 0 && release.groups.every((group) => group.items.length > 0));
  }
  const dates = releases.map((release) => release.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});
