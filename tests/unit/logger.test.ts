import assert from "node:assert/strict";
import { test } from "node:test";
import { generateLicenseKey } from "../../lib/license/key.ts";
import { redactSecrets } from "../../lib/logger.ts";

test("license keys, tokens, bearer and Stripe secrets never reach logs", () => {
  const key = generateLicenseKey();
  const line = redactSecrets(
    `activate ${key} lower ${key.toLowerCase()} token sblt1.dev1.eyJhIjoxfQ.c2ln ` +
      "Authorization: Bearer abc.def sk_test_51abcdefghij whsec_abcdefghijkl ?license_key=SEOB-x&ok=1",
  );
  assert.ok(!line.includes(key.slice(5)), line);
  assert.ok(!line.toLowerCase().includes(key.slice(5).toLowerCase()), line);
  for (const secret of ["eyJhIjoxfQ", "abc.def", "sk_test_51", "whsec_abc", "SEOB-x"]) {
    assert.ok(!line.includes(secret), `${secret} leaked: ${line}`);
  }
  assert.ok(line.includes("ok=1"));
});
