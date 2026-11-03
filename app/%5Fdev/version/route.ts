export const dynamic = "force-dynamic";

/** Deploy verification: CI polls this until the new commit is live. */
export function GET() {
  return Response.json({ sha: process.env.SEOBASICS_COMMIT_SHA ?? "unknown" }, { headers: { "Cache-Control": "no-store" } });
}
