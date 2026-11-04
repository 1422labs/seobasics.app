import assert from "node:assert/strict";
import { test } from "node:test";
import { activateBody, deactivateBody, handleJson, refreshBody } from "../../lib/license/http.ts";

const DEVICE = "3F2504E0-4F89-11D3-9A0C-0305E82C3301";

function post(body: string) {
  return new Request("http://localhost/api/v1/activations", { method: "POST", body, headers: { "Content-Type": "application/json" } });
}

test("bodies map to service input and ignore unknown fields", () => {
  assert.deepEqual(
    activateBody.parse({ license_key: "k", device_id: DEVICE, app_version: "1.0", device_name: "", future: true }),
    { licenseKey: "k", deviceId: DEVICE, appVersion: "1.0", deviceName: undefined },
  );
  assert.deepEqual(refreshBody.parse({ token: "t", device_id: DEVICE, app_version: "1.0" }), {
    token: "t",
    deviceId: DEVICE,
    appVersion: "1.0",
  });
  assert.deepEqual(deactivateBody.parse({ token: "t", device_id: DEVICE }), { token: "t", deviceId: DEVICE });
  assert.equal(activateBody.safeParse({ license_key: "k", device_id: "short", app_version: "1.0" }).success, false);
});

test("non-JSON and invalid bodies are invalid_request, with no-store", async () => {
  const never = async () => {
    throw new Error("must not run");
  };
  const notJson = await handleJson(post("license"), activateBody, never);
  assert.equal(notJson.status, 400);
  assert.equal(notJson.headers.get("Cache-Control"), "no-store");
  assert.equal((await notJson.json()).error.code, "invalid_request");

  const missing = await handleJson(post(JSON.stringify({ device_id: DEVICE })), activateBody, never);
  const body = await missing.json();
  assert.equal(body.error.code, "invalid_request");
  assert.match(body.error.message, /license_key/);
  assert.match(body.error.message, /app_version/);
});

test("service results become responses; thrown errors stay generic", async () => {
  const ok = await handleJson(post(JSON.stringify({ token: "t", device_id: DEVICE })), deactivateBody, async () => ({
    ok: true as const,
    status: 204 as const,
    body: null,
  }));
  assert.equal(ok.status, 204);
  assert.equal(await ok.text(), "");

  const refused = await handleJson(post(JSON.stringify({ token: "t", device_id: DEVICE })), deactivateBody, async () => ({
    ok: false as const,
    code: "device_limit_reached" as const,
    message: "Deactivate one first.",
  }));
  assert.equal(refused.status, 409);

  const original = console.error;
  const logged: string[] = [];
  console.error = (line: string) => void logged.push(line);
  try {
    const crashed = await handleJson(post(JSON.stringify({ token: "sblt1.dev1.abc.def", device_id: DEVICE })), deactivateBody, async () => {
      throw new Error("db down while handling sblt1.dev1.abc.def");
    });
    assert.equal(crashed.status, 500);
    assert.equal((await crashed.json()).error.code, "internal_error");
  } finally {
    console.error = original;
  }
  assert.equal(logged.length, 1);
  assert.doesNotMatch(logged[0], /abc\.def/);
});
