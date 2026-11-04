import { refreshBody, handleJson } from "@/lib/license/http";
import { licenseService } from "@/lib/license/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/v1/activations/refresh (docs/license-api-v1.md). */
export function POST(request: Request) {
  return handleJson(request, refreshBody, (input) => licenseService().refresh(input));
}
