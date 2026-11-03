import assert from "node:assert/strict";
import { test } from "node:test";
import { apiError, apiErrorStatus } from "../../lib/api.ts";

test("errors use the documented envelope and are never cached", async () => {
  const response = apiError("device_limit_reached", "This license is active on the maximum number of Macs.");
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: { code: "device_limit_reached", message: "This license is active on the maximum number of Macs." },
  });
  assert.equal(apiErrorStatus("token_invalid"), 401);
  assert.equal(apiErrorStatus("not_configured"), 503);
});
