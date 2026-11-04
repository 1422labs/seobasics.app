import { getAppUrl } from "@/lib/env";

export const PRODUCTION_URL = "https://seobasics.app";

export const site = {
  name: "SEO Basics",
  title: "SEO Basics – SEO Audit & Website Crawler for Mac",
  description:
    "SEO Basics is a native Mac app that crawls your website or local dev server, finds technical SEO problems and explains how to fix them. Built-in MCP server for Claude Code and Codex. $39 once, no subscription.",
  price: "$39",
  mcpEndpoint: "http://127.0.0.1:18472/mcp",
};

/**
 * Purchase links. Stripe Checkout and the App Store listing don't exist yet
 * (owner gates: Stripe price IDs, App Store Connect). Until they do, both
 * actions point at the pricing section; set the env vars once they exist.
 */
export function purchaseLinks() {
  return {
    checkout: process.env.NEXT_PUBLIC_CHECKOUT_URL || "/#pricing",
    appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || "/#pricing",
  };
}

/** Only the production host may be indexed; dev.seobasics.app and previews never are. */
export function isIndexable() {
  return getAppUrl().replace(/\/$/, "") === PRODUCTION_URL;
}
