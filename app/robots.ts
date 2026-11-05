import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { isIndexable } from "@/lib/site";

// Decided per request: the same image serves dev.seobasics.app (never indexed) and seobasics.app.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/_dev/"] },
    sitemap: appUrl("/sitemap.xml"),
  };
}
