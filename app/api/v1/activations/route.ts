import { activateBody, handleJson } from "@/lib/license/http";
import { licenseService } from "@/lib/license/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/v1/activations (docs/license-api-v1.md). */
export function POST(request: Request) {
  return handleJson(request, activateBody, (input) => licenseService().activate(input));
}
