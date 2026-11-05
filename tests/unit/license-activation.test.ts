import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidPolicy, decideActivation, tokenExpiry, type LicensePolicy } from "../../lib/license/activation.ts";

// Test values only; the shipped policy is an owner decision.
const policy: LicensePolicy = { maxActiveDevices: 2, tokenLifetimeSeconds: 3_600 };
const active = { status: "active" as const };

test("a new Mac gets a seat while seats are free", () => {
  assert.deepEqual(decideActivation({ license: active, active: [], deviceHash: "a", policy }), { kind: "create" });
  assert.deepEqual(
    decideActivation({ license: active, active: [{ id: "1", deviceHash: "a" }], deviceHash: "b", policy }),
    { kind: "create" },
  );
});

test("re-activating the same Mac reuses its seat, even when all seats are taken", () => {
  const full = [{ id: "1", deviceHash: "a" }, { id: "2", deviceHash: "b" }];
  assert.deepEqual(decideActivation({ license: active, active: full, deviceHash: "b", policy }), {
    kind: "reuse",
    activationId: "2",
  });
  assert.deepEqual(decideActivation({ license: active, active: full, deviceHash: "c", policy }), {
    kind: "refused",
    code: "device_limit_reached",
  });
});

test("a revoked license activates nothing", () => {
  assert.deepEqual(
    decideActivation({ license: { status: "revoked" }, active: [{ id: "1", deviceHash: "a" }], deviceHash: "a", policy }),
    { kind: "refused", code: "license_revoked" },
  );
});

test("policies are validated and expiry follows the lifetime", () => {
  assert.throws(() => assertValidPolicy({ maxActiveDevices: 0, tokenLifetimeSeconds: 3_600 }));
  assert.throws(() => assertValidPolicy({ maxActiveDevices: 1, tokenLifetimeSeconds: 10 }));
  assert.doesNotThrow(() => assertValidPolicy(policy));
  assert.equal(tokenExpiry(new Date(1_000_000), policy), 1_000 + 3_600);
});
