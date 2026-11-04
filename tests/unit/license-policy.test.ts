import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { assertValidPolicy } from "../../lib/license/activation.ts";
import { BALANCED_POLICY } from "../../lib/license/policy.ts";
import { loadSigningConfig } from "../../lib/license/signing.ts";

const DAY = 86_400;

test("the shipped policy is Balanced: 3 Macs, 30 days offline, weekly refresh", () => {
  assert.deepEqual({ ...BALANCED_POLICY }, { maxActiveDevices: 3, tokenLifetimeSeconds: 30 * DAY, refreshAfterSeconds: 7 * DAY });
  assert.ok(Object.isFrozen(BALANCED_POLICY));
});

test("the refresh hint must be shorter than the token lifetime", () => {
  assert.throws(() => assertValidPolicy({ maxActiveDevices: 1, tokenLifetimeSeconds: DAY, refreshAfterSeconds: DAY }));
  assert.throws(() => assertValidPolicy({ maxActiveDevices: 1, tokenLifetimeSeconds: DAY, refreshAfterSeconds: 1.5 }));
  assert.doesNotThrow(() => assertValidPolicy({ maxActiveDevices: 1, tokenLifetimeSeconds: DAY, refreshAfterSeconds: 3_600 }));
});

const ed = generateKeyPairSync("ed25519");
const edPem = ed.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const old = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }).toString();

test("signing config needs both an Ed25519 key and a kid", () => {
  assert.equal(loadSigningConfig({}), null);
  assert.equal(loadSigningConfig({ LICENSE_SIGNING_KEY: edPem }), null);
  assert.equal(loadSigningConfig({ LICENSE_SIGNING_KID: "dev1" }), null);
  assert.equal(loadSigningConfig({ LICENSE_SIGNING_KEY: "not a key", LICENSE_SIGNING_KID: "dev1" }), null);
  assert.equal(loadSigningConfig({ LICENSE_SIGNING_KEY: edPem, LICENSE_SIGNING_KID: "dev 1" }), null);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  assert.equal(loadSigningConfig({ LICENSE_SIGNING_KEY: rsa, LICENSE_SIGNING_KID: "dev1" }), null);

  const config = loadSigningConfig({ LICENSE_SIGNING_KEY: edPem, LICENSE_SIGNING_KID: "dev1" });
  assert.equal(config?.kid, "dev1");
  assert.deepEqual([...(config?.publicKeys.keys() ?? [])], ["dev1"]);
});

test("single-line PEM secrets and retired public keys are accepted", () => {
  const oneLine = edPem.replace(/\n/g, "\\n");
  const config = loadSigningConfig({
    LICENSE_SIGNING_KEY: oneLine,
    LICENSE_SIGNING_KID: "dev2",
    LICENSE_PREVIOUS_PUBLIC_KEYS: JSON.stringify({ dev1: old }),
  });
  assert.deepEqual([...(config?.publicKeys.keys() ?? [])].sort(), ["dev1", "dev2"]);
  for (const bad of ["[]", "{", JSON.stringify({ dev1: "nope" }), JSON.stringify({ dev2: old })]) {
    assert.equal(
      loadSigningConfig({ LICENSE_SIGNING_KEY: edPem, LICENSE_SIGNING_KID: "dev2", LICENSE_PREVIOUS_PUBLIC_KEYS: bad }),
      null,
      bad,
    );
  }
});
