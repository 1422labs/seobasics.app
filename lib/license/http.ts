import { z } from "zod";
import { apiError } from "@/lib/api";
import { logError } from "@/lib/logger";
import type { ServiceResult } from "./service";

/**
 * Request bodies of /api/v1/activations*. Unknown fields are ignored (v1 is
 * additive), lengths are bounded, and snake_case JSON maps to the service's
 * camelCase input.
 */
const deviceId = z.string().trim().min(16).max(128);
const appVersion = z.string().trim().min(1).max(32);
const token = z.string().min(1).max(4096);

export const activateBody = z
  .object({
    license_key: z.string().min(1).max(128),
    device_id: deviceId,
    app_version: appVersion,
    device_name: z.string().trim().max(100).optional(),
  })
  .transform((b) => ({
    licenseKey: b.license_key,
    deviceId: b.device_id,
    appVersion: b.app_version,
    deviceName: b.device_name || undefined,
  }));

export const refreshBody = z
  .object({ token, device_id: deviceId, app_version: appVersion })
  .transform((b) => ({ token: b.token, deviceId: b.device_id, appVersion: b.app_version }));

export const deactivateBody = z
  .object({ token, device_id: deviceId })
  .transform((b) => ({ token: b.token, deviceId: b.device_id }));

/** Parses a JSON body with `schema`, runs `run`, and maps the result to a Response. */
export async function handleJson<Input, Output>(
  request: Request,
  schema: z.ZodType<Input, unknown>,
  run: (input: Input) => Promise<ServiceResult<Output>>,
): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("invalid_request", "The request body must be JSON.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "body"))];
    return apiError("invalid_request", `Invalid or missing fields: ${fields.join(", ")}.`);
  }
  try {
    const result = await run(parsed.data);
    if (!result.ok) return apiError(result.code, result.message);
    const headers = { "Cache-Control": "no-store" };
    if (result.status === 204) return new Response(null, { status: 204, headers });
    return Response.json(result.body, { status: result.status, headers });
  } catch (error) {
    logError("license api", error);
    return apiError("internal_error", "Something went wrong. Try again later.");
  }
}
