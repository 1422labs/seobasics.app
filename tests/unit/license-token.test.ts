import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import {
  deviceHash,
  signActivationToken,
  verifyActivationToken,
  type ActivationClaims,
} from "../../lib/license/token.ts";

const dev = generateKeyPairSync("ed25519");
const other = generateKeyPairSync("ed25519");
const keys = new Map([["dev1", dev.publicKey]]);
const now = new Date("2026-11-03T12:00:00Z");
const seconds = Math.floor(now.getTime() / 1000);

function claims(overrides: Partial<ActivationClaims> = {}): ActivationClaims {
  return {
    v: 1,
    edition: "direct",
    license_id: "lic_1",
    activation_id: "act_1",
    device_hash: deviceHash("device-a"),
    iat: seconds,
    exp: seconds + 3_600,
    ...overrides,
  };
}

test("a signed token verifies and round-trips its claims", () => {
  const token = signActivationToken(claims(), "dev1", dev.privateKey);
  assert.match(token, /^sblt1\.dev1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const result = verifyActivationToken(token, keys, { now, deviceHash: deviceHash("device-a") });
  assert.deepEqual(result, { ok: true, claims: claims() });
});

test("tokens from another key or environment are rejected", () => {
  const foreign = signActivationToken(claims(), "dev1", other.privateKey);
  assert.deepEqual(verifyActivationToken(foreign, keys, { now }), { ok: false, reason: "bad_signature" });
  const prod = signActivationToken(claims(), "prod1", other.privateKey);
  assert.deepEqual(verifyActivationToken(prod, keys, { now }), { ok: false, reason: "unknown_key" });
});

test("tampered, expired and copied tokens are rejected", () => {
  const token = signActivationToken(claims(), "dev1", dev.privateKey);
  const [prefix, kid, , signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify(claims({ exp: seconds + 10 ** 9 }))).toString("base64url");
  assert.deepEqual(verifyActivationToken([prefix, kid, forged, signature].join("."), keys, { now }), {
    ok: false,
    reason: "bad_signature",
  });

  const expired = signActivationToken(claims({ exp: seconds }), "dev1", dev.privateKey);
  assert.deepEqual(verifyActivationToken(expired, keys, { now }), { ok: false, reason: "expired" });

  assert.deepEqual(verifyActivationToken(token, keys, { now, deviceHash: deviceHash("device-b") }), {
    ok: false,
    reason: "wrong_device",
  });
});

test("malformed tokens never throw", () => {
  for (const token of ["", "sblt1", "sblt1.dev1.x", "sblt2.dev1.a.b", "sblt1.dev1.!!.@@", "sblt1.dev1.e30.AAAA"]) {
    const result = verifyActivationToken(token, keys, { now });
    assert.equal(result.ok, false, token);
  }
  const storeEdition = signActivationToken({ ...claims(), edition: "store" } as unknown as ActivationClaims, "dev1", dev.privateKey);
  assert.deepEqual(verifyActivationToken(storeEdition, keys, { now }), { ok: false, reason: "malformed" });
});

test("signing refuses non-Ed25519 keys and odd key ids", () => {
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.throws(() => signActivationToken(claims(), "dev1", rsa.privateKey), /Ed25519/);
  assert.throws(() => signActivationToken(claims(), "dev.1", dev.privateKey), /kid/);
});

test("device hashes are stable and do not reveal the id", () => {
  assert.equal(deviceHash("device-a"), deviceHash("device-a"));
  assert.notEqual(deviceHash("device-a"), deviceHash("device-b"));
  assert.ok(!deviceHash("device-a").includes("device-a"));
});
