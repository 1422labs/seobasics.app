import type { Metadata } from "next";
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
 * Who publishes SEO Basics and how to reach them. Owner decision, not set yet: the
 * support, privacy and licensing pages show "published before launch" until it is.
 * Set both before seobasics.app goes live (tests/unit/site.test.ts lists the pages).
 */
export const publisher: { name: string | null; email: string | null } = {
  name: null,
  email: null,
};

/** The indexable pages, for the sitemap; each sets its own canonical with pageMetadata(). */
export const pages = [
  { path: "/", priority: 1 },
  { path: "/docs/mcp", priority: 0.8 },
  { path: "/changelog", priority: 0.5 },
  { path: "/support", priority: 0.5 },
  { path: "/licensing", priority: 0.4 },
  { path: "/privacy", priority: 0.3 },
] as const;

export type PagePath = (typeof pages)[number]["path"];

/**
 * Title, description and canonical for a content page. The root layout's canonical is "/",
 * so every other page must override it, or search engines fold it into the homepage.
 */
export function pageMetadata(path: Exclude<PagePath, "/">, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: site.name, title: `${title} – ${site.name}`, description, url: path },
    twitter: { card: "summary", title: `${title} – ${site.name}`, description },
  };
}

/**
 * Purchase links. Stripe Checkout and the App Store listing don't exist yet
 * (owner gates: Stripe price IDs, App Store Connect). Until they do, both
 * actions point at the pricing section; set the env vars once they exist.
 * Read per request (every page is force-dynamic), and deliberately not
 * NEXT_PUBLIC_: Next.js would inline those at build time into the one image
 * that dev and prod share.
 */
export function purchaseLinks() {
  return {
    checkout: process.env.CHECKOUT_URL || "/#pricing",
    appStore: process.env.APP_STORE_URL || "/#pricing",
  };
}

/** Only the production host may be indexed; dev.seobasics.app and previews never are. */
export function isIndexable() {
  return getAppUrl().replace(/\/$/, "") === PRODUCTION_URL;
}
