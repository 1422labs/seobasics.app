import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";
import { pages } from "@/lib/site";

// Per request, like robots.ts: the URLs come from the deployment's APP_URL, not the build's.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({ url: appUrl(page.path), changeFrequency: "monthly", priority: page.priority }));
}
