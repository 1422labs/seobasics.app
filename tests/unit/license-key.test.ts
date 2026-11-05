import assert from "node:assert/strict";
import { test } from "node:test";
import { generateLicenseKey, hashLicenseKey, licenseKeyHint, normalizeLicenseKey } from "../../lib/license/key.ts";

const KEY_SHAPE = /^SEOB(?:-[0-9A-HJKMNP-TV-Z]{5}){5}$/;

test("generated keys have the documented shape and are unique", () => {
  const keys = new Set<string>();
  for (let i = 0; i < 2_000; i++) {
    const key = generateLicenseKey();
    assert.match(key, KEY_SHAPE);
    assert.equal(normalizeLicenseKey(key), key);
    keys.add(key);
  }
  assert.equal(keys.size, 2_000);
});

test("keys typed loosely normalize to the canonical form", () => {
  const key = generateLicenseKey();
  const body = key.slice(5).replace(/-/g, "");
  assert.equal(normalizeLicenseKey(body), key, "without prefix and dashes");
  assert.equal(normalizeLicenseKey(`  ${key.toLowerCase()} `), key, "lowercase with spaces");
  assert.equal(normalizeLicenseKey(key.replace(/-/g, " ")), key, "spaces instead of dashes");
  const confusable = key.replace(/0/g, "O").replace(/1/g, "l");
  assert.equal(normalizeLicenseKey(confusable), key, "O for 0 and l for 1");
});

test("malformed keys and typos are rejected before any lookup", () => {
  assert.equal(normalizeLicenseKey(""), null);
  assert.equal(normalizeLicenseKey("SEOB-12345"), null);
  assert.equal(normalizeLicenseKey(generateLicenseKey() + "A"), null);
  assert.equal(normalizeLicenseKey(generateLicenseKey().replace(/.$/, "U")), null, "U is not in the alphabet");

  // A single changed character fails the check almost always (31/32).
  let caught = 0;
  const trials = 2_000;
  for (let i = 0; i < trials; i++) {
    const key = generateLicenseKey();
    const positions = [...key].flatMap((char, index) => (index > 4 && char !== "-" ? [index] : []));
    const position = positions[Math.floor(Math.random() * positions.length)];
    const original = key[position];
    const replacement = original === "7" ? "8" : "7";
    if (normalizeLicenseKey(key.slice(0, position) + replacement + key.slice(position + 1)) === null) caught++;
  }
  assert.ok(caught / trials > 0.9, `only ${caught}/${trials} typos caught`);
});

test("hash and hint are derived from the canonical key only", () => {
  const key = generateLicenseKey();
  const hash = hashLicenseKey(key);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hashLicenseKey(normalizeLicenseKey(key.toLowerCase())!), hash);
  assert.notEqual(hashLicenseKey(generateLicenseKey()), hash);
  assert.equal(licenseKeyHint(key), key.slice(-4));
  assert.ok(!key.includes(hash));
});
