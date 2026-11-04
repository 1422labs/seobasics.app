import { CheckIcon, MenuIcon, MinusIcon } from "lucide-react";
import Link from "next/link";
import { AgentSession } from "@/components/agent-session";
import { StarMark } from "@/components/star-mark";
import { appUrl } from "@/lib/env";
import { purchaseLinks, site } from "@/lib/site";

// Indexing (layout metadata) and purchase links depend on the deployment's env, not the build's.
export const dynamic = "force-dynamic";

const container = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

const nav = [
  { href: "#checks", label: "What it checks" },
  { href: "#mcp", label: "MCP" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const checks = [
  {
    name: "Metadata",
    items: [
      "Missing, duplicate or overly long titles and meta descriptions",
      "Missing, multiple or cross-host canonical tags",
      "noindex and other robots directives",
      "Missing social sharing metadata",
    ],
  },
  {
    name: "Content and structure",
    items: ["Missing or multiple H1 headings", "Skipped heading levels", "Images without alt text", "Duplicate titles across the site"],
  },
  {
    name: "Indexability and links",
    items: [
      "HTTP errors, redirect chains and loops",
      "Broken internal links",
      "robots.txt and XML sitemap problems",
      "Pages excluded from indexing by mistake",
      "Basic hreflang checks",
    ],
  },
  {
    name: "Structured data and URLs",
    items: [
      "JSON-LD that isn't valid JSON",
      "Incomplete structured data",
      "Duplicate URL variants and uppercase URLs",
      "URLs that are too long",
    ],
  },
];

const steps = [
  {
    name: "Scan",
    body: "Enter a website or a localhost dev server. SEO Basics follows internal links and sitemaps, respects robots.txt and shows pages and findings as they arrive.",
  },
  {
    name: "Understand",
    body: "Every finding is marked critical, warning or info, and says what happened, why it matters and how to fix it. No scores, no jargon without an explanation.",
  },
  {
    name: "Fix and verify",
    body: "Fix it yourself, or let your coding agent read the findings over MCP and change your code. Then re-check the pages to confirm the fix actually worked.",
  },
];

const tools = [
  { name: "scan_website", body: "Start a crawl of a public site or local dev server." },
  { name: "list_scans", body: "List saved scans, newest first." },
  { name: "get_scan_summary", body: "Progress and severity counts for one scan." },
  { name: "get_seo_issues", body: "Findings with explanation and remediation, filterable and paged." },
  { name: "inspect_page", body: "Extracted SEO data and findings for one URL." },
  { name: "verify_urls", body: "Re-check URLs after a fix: resolved, remaining, introduced." },
  { name: "compare_scans", body: "What changed between two scans of the same site." },
];

const comparison: { feature: string; direct: string | boolean; store: string | boolean }[] = [
  { feature: "Price", direct: "$39 once", store: "$39 once (regional pricing)" },
  { feature: "All features, including MCP", direct: true, store: true },
  { feature: "Payment", direct: "Stripe, on seobasics.app", store: "Your Apple account" },
  { feature: "Activation", direct: "License key, up to 3 Macs", store: "None, via your Apple ID" },
  { feature: "Works offline", direct: "Yes, re-checks the license every 30 days", store: "Yes" },
  { feature: "Updates", direct: "Built-in, signed updates", store: "Mac App Store" },
  { feature: "Included updates", direct: "All 1.x releases", store: "All 1.x releases" },
  { feature: "App Sandbox", direct: false, store: true },
];

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. There is no sign-up and no cloud dashboard. The direct edition asks for the license key from your receipt once; the Mac App Store edition needs nothing at all.",
  },
  {
    q: "Does my crawl data leave my Mac?",
    a: "No. Scans, pages and findings are stored locally on your Mac. SEO Basics only contacts the sites you scan, plus, in the direct edition, the license and update servers on seobasics.app.",
  },
  {
    q: "Is there a free trial?",
    a: "No. SEO Basics is a one-time purchase of $39, with no trial, free tier or subscription.",
  },
  {
    q: "Can I scan sites on localhost?",
    a: "Yes. Enter a URL like http://localhost:3000 to audit your dev server before you deploy.",
  },
  {
    q: "Which AI agents work with it?",
    a: "Any MCP client that supports Streamable HTTP with a bearer token, such as Claude Code and Codex. SEO Basics doesn't include an AI model and doesn't change your code itself; your agent does.",
  },
  {
    q: "Can I move my license to a new Mac?",
    a: "Yes. A direct license works on up to 3 Macs at once. Deactivate an old Mac in Settings, or use the reset link we email to your purchase address to clear all activations.",
  },
  {
    q: "Does a direct license unlock the Mac App Store version?",
    a: "No. Purchases are tied to where you bought them: a Stripe license activates the direct download, and an App Store purchase covers the App Store version.",
  },
];

function Check() {
  return <CheckIcon className="size-4 h-lh shrink-0 stroke-star-600 dark:stroke-star-400" aria-hidden="true" />;
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <>
        <Check />
        <span className="sr-only">Yes</span>
      </>
    );
  if (value === false)
    return (
      <>
        <MinusIcon className="size-4 h-lh shrink-0 stroke-neutral-400" aria-hidden="true" />
        <span className="sr-only">No</span>
      </>
    );
  return <>{value}</>;
}

function Logo() {
  return (
    <Link href="/" aria-label="Homepage" className="flex items-center gap-2.5">
      <StarMark className="size-7 shrink-0 fill-star-500" />
      <span className="text-[1.0625rem] font-semibold tracking-tight">SEO Basics</span>
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-base/7 font-semibold text-neutral-950 hover:text-neutral-700 sm:text-sm/6 dark:text-white dark:hover:text-neutral-300">
      {children} <span aria-hidden="true">→</span>
    </a>
  );
}

function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-lg px-4 py-2.5 text-base/6 font-semibold text-neutral-950 ring-1 ring-neutral-950/15 hover:bg-neutral-950/[0.03] sm:py-2 sm:text-sm/6 dark:text-white dark:ring-white/20 dark:hover:bg-white/5"
    >
      {children}
    </a>
  );
}

export default function Home() {
  const links = purchaseLinks();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS",
    description: site.description,
    url: appUrl("/"),
    offers: { "@type": "Offer", price: "39.00", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="sticky top-0 z-10 border-b border-neutral-950/5 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
        <div className={`${container} flex h-16 items-center`}>
          <div className="flex flex-1 items-center">
            <Logo />
          </div>
          <nav aria-label="Main" className="flex items-center gap-x-8 max-lg:hidden">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-sm/6 text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-x-2">
            <a
              href={links.checkout}
              className="rounded-lg px-3 py-1.5 text-sm/6 font-semibold text-neutral-950 ring-1 ring-neutral-950/15 hover:bg-neutral-950/[0.03] dark:text-white dark:ring-white/20 dark:hover:bg-white/5"
            >
              Buy <span className="tabular-nums">{site.price}</span>
            </a>
            <details className="group relative lg:hidden">
              <summary className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-neutral-950/5 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
                <MenuIcon className="size-5 shrink-0 stroke-neutral-700 dark:stroke-neutral-300" aria-hidden="true" />
                <span className="sr-only">Open menu</span>
              </summary>
              <nav
                aria-label="Mobile"
                className="absolute right-0 mt-2 flex w-56 flex-col rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:shadow-none dark:ring-white/10"
              >
                {nav.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-base/6 text-neutral-700 hover:bg-neutral-950/5 dark:text-neutral-300 dark:hover:bg-white/5">
                    {item.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className={`${container} grid grid-cols-1 items-center gap-x-12 gap-y-14 lg:grid-cols-2`}>
            <div className="flex flex-col items-start">
              <p className="font-mono text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">Native macOS app · MCP built in</p>
              <h1 className="mt-5 max-w-[20ch] text-5xl font-semibold tracking-tight text-balance sm:text-6xl">The simple SEO crawler for Mac.</h1>
              <p className="mt-6 max-w-[48ch] text-lg/8 text-pretty text-neutral-600 dark:text-neutral-400">
                Scan your website or local dev server for technical SEO problems and see each one explained in plain language. Connect Claude Code or Codex,
                and your agent can read the findings, fix your code and verify the fix.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={links.checkout}
                  className="rounded-lg bg-star-500 px-4 py-3 text-base/6 font-semibold text-neutral-950 shadow-sm ring-1 ring-star-500 hover:bg-star-400 hover:ring-star-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-star-600 sm:py-2.5 sm:text-sm/6 dark:shadow-none"
                >
                  Get SEO Basics — <span className="tabular-nums">{site.price}</span>
                </a>
                <SecondaryLink href={links.appStore}>View on Mac App Store</SecondaryLink>
              </div>
              <p className="mt-5 text-base/7 text-neutral-500 sm:text-sm/6 dark:text-neutral-400">One-time purchase. No subscription, no account.</p>
            </div>
            <AgentSession />
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={container}>
            <h2 id="how" className="max-w-[40ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              From crawl to verified fix.
            </h2>
            <p className="mt-6 max-w-[56ch] text-base/7 text-pretty text-neutral-600 sm:text-lg/8 dark:text-neutral-400">
              SEO Basics finds the problems and checks the fixes. You or your coding agent make the changes.
            </p>
            <dl className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.name} className="border-t border-neutral-950/10 pt-6 dark:border-white/10">
                  <dt className="flex items-baseline gap-3 font-medium">
                    <span className="font-mono text-sm text-star-600 tabular-nums dark:text-star-400">0{i + 1}</span>
                    <span className="text-lg/7">{step.name}</span>
                  </dt>
                  <dd className="mt-3 text-base/7 text-pretty text-neutral-600 sm:text-sm/6 dark:text-neutral-400">{step.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* What it checks */}
        <section id="checks" aria-labelledby="checks-title" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={container}>
            <h2 id="checks-title" className="max-w-[40ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A technical SEO audit, without the enterprise suite.
            </h2>
            <p className="mt-6 max-w-[56ch] text-base/7 text-pretty text-neutral-600 sm:text-lg/8 dark:text-neutral-400">
              The checks that decide whether search engines can find, read and index your pages. Each comes with a short explanation and a concrete fix.
            </p>
            <dl className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {checks.map((group) => (
                <div key={group.name}>
                  <dt className="text-base/7 font-medium">{group.name}</dt>
                  <dd className="mt-4">
                    <ul role="list" className="flex flex-col gap-3">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-3 text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">
                          <Check />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-14 max-w-[56ch] text-base/7 text-pretty text-neutral-600 sm:text-sm/6 dark:text-neutral-400">
              Save every scan, compare two scans to see what was fixed and what regressed, and export the results as JSON or CSV.
            </p>
          </div>
        </section>

        {/* MCP */}
        <section id="mcp" aria-labelledby="mcp-title" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={`${container} grid grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-2`}>
            <div>
              <h2 id="mcp-title" className="max-w-[40ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Your coding agent sees what SEO Basics sees.
              </h2>
              <p className="mt-6 max-w-[48ch] text-base/7 text-pretty text-neutral-600 sm:text-lg/8 dark:text-neutral-400">
                While the app is open, it runs a local MCP server. Agents get the same findings as the app, with explanations they can act on, and can
                re-check pages until the fix holds. No CLI or helper to install.
              </p>
              <dl className="mt-10 flex flex-col divide-y divide-neutral-950/5 border-y border-neutral-950/5 dark:divide-white/10 dark:border-white/10">
                {tools.map((tool) => (
                  <div key={tool.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                    <dt className="shrink-0 font-mono text-sm/6 font-medium sm:w-44">{tool.name}</dt>
                    <dd className="text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">{tool.body}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-base/7 font-medium">Connect in one step</h3>
                <p className="mt-2 max-w-[56ch] text-base/7 text-pretty text-neutral-600 sm:text-sm/6 dark:text-neutral-400">
                  Turn on the server in Settings → MCP and copy the configuration for your client. It includes the endpoint and a private access token.
                </p>
                <pre className="mt-5 overflow-x-auto rounded-xl bg-neutral-900 p-5 font-mono text-[0.8125rem]/6 text-neutral-300 ring-1 ring-black/10 dark:ring-white/10">
                  <code>
                    <span className="text-neutral-500"># Claude Code</span>
                    {"\n"}claude mcp add --transport http seobasics \{"\n"}
                    {"  "}
                    {site.mcpEndpoint} \{"\n"}
                    {"  "}--header <span className="text-star-300">&quot;Authorization: Bearer $SEOBASICS_TOKEN&quot;</span>
                    {"\n\n"}
                    <span className="text-neutral-500"># Codex (~/.codex/config.toml)</span>
                    {"\n"}[mcp_servers.seobasics]{"\n"}url = <span className="text-star-300">&quot;{site.mcpEndpoint}&quot;</span>
                    {"\n"}bearer_token_env_var = <span className="text-star-300">&quot;SEOBASICS_TOKEN&quot;</span>
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="text-base/7 font-medium">Private by design</h3>
                <ul role="list" className="mt-4 flex flex-col gap-3">
                  {[
                    "Listens on 127.0.0.1 only; other devices on your network can't connect",
                    "Every request needs the access token, kept in your Keychain",
                    "Rejects requests from web pages in your browser",
                    "Off until you turn it on, with clear connection status",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">
                      <Check />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-title" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={container}>
            <div className="text-center">
              <h2 id="pricing-title" className="mx-auto max-w-[35ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                One price. Two places to buy.
              </h2>
              <p className="mx-auto mt-6 max-w-[48ch] text-base/7 text-pretty text-neutral-600 sm:text-lg/8 dark:text-neutral-400">
                The same app with the same features, MCP included. Pick the store you prefer.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  name: "Direct download",
                  blurb: "Buy from us with Stripe and get a license key by email.",
                  points: ["Use on up to 3 Macs", "Signed, notarized DMG", "Built-in signed updates", "All 1.x updates included"],
                  cta: "Buy direct",
                  href: links.checkout,
                },
                {
                  name: "Mac App Store",
                  blurb: "Buy with your Apple account. Nothing to activate.",
                  points: ["Installs on your Macs via the App Store", "Runs in the App Sandbox", "Updates through the App Store", "All 1.x updates included"],
                  cta: "View on Mac App Store",
                  href: links.appStore,
                },
              ].map((plan) => (
                <div key={plan.name} className="flex flex-col justify-between gap-8 rounded-2xl p-8 ring-1 ring-neutral-950/10 dark:bg-neutral-900 dark:ring-white/10">
                  <div>
                    <h3 className="text-lg/7 font-semibold">{plan.name}</h3>
                    <p className="mt-2 text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">{plan.blurb}</p>
                    <p className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tracking-tight tabular-nums">{site.price}</span>
                      <span className="text-base/7 text-neutral-500 sm:text-sm/6 dark:text-neutral-400">once</span>
                    </p>
                    <ul role="list" className="mt-6 flex flex-col gap-3">
                      {plan.points.map((point) => (
                        <li key={point} className="flex gap-3 text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">
                          <Check />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col">
                    <OutlineButton href={plan.href}>{plan.cta}</OutlineButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-20 max-w-4xl">
              <h3 className="text-lg/7 font-semibold">Direct or Mac App Store?</h3>
              <div className="mt-6 -mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
                  <table className="w-full text-left text-base/7 sm:text-sm/6">
                    <thead>
                      <tr className="border-b border-neutral-950/10 dark:border-white/10">
                        <th scope="col" className="py-3 pr-6 font-medium whitespace-nowrap">
                          <span className="sr-only">Feature</span>
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium whitespace-nowrap">
                          Direct download
                        </th>
                        <th scope="col" className="py-3 pl-6 font-medium whitespace-nowrap">
                          Mac App Store
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-950/5 dark:divide-white/10">
                      {comparison.map((row) => (
                        <tr key={row.feature}>
                          <th scope="row" className="py-3 pr-6 font-normal text-neutral-600 dark:text-neutral-400">
                            {row.feature}
                          </th>
                          <td className="px-6 py-3">
                            <div className="flex">
                              <Cell value={row.direct} />
                            </div>
                          </td>
                          <td className="py-3 pl-6">
                            <div className="flex">
                              <Cell value={row.store} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-6 text-base/7 text-pretty text-neutral-500 sm:text-sm/6 dark:text-neutral-400">
                Purchases are separate: a direct license doesn&apos;t unlock the App Store version, and an App Store purchase doesn&apos;t include a license key.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={`${container} grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-3`}>
            <h2 id="faq-title" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Questions
            </h2>
            <dl className="flex flex-col divide-y divide-neutral-950/5 lg:col-span-2 dark:divide-white/10">
              {faqs.map((faq, i) => (
                <div key={faq.q} className={i === 0 ? "pb-6" : i === faqs.length - 1 ? "pt-6" : "py-6"}>
                  <dt className="text-base/7 font-medium">{faq.q}</dt>
                  <dd className="mt-2 max-w-[64ch] text-base/7 text-pretty text-neutral-600 dark:text-neutral-400">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing CTA */}
        <section aria-labelledby="cta-title" className="border-t border-neutral-950/5 py-20 sm:py-28 dark:border-white/10">
          <div className={`${container} flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex items-center gap-5">
              <StarMark className="size-12 shrink-0 fill-star-500" />
              <h2 id="cta-title" className="max-w-[30ch] text-3xl font-semibold tracking-tight text-balance">
                Run your first audit in a minute.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <OutlineButton href={links.checkout}>Get SEO Basics — {site.price}</OutlineButton>
              <SecondaryLink href={links.appStore}>View on Mac App Store</SecondaryLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-950/5 py-12 dark:border-white/10">
        <div className={`${container} flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="flex items-center gap-2.5">
            <StarMark small className="size-6 shrink-0 fill-star-500" />
            <p className="text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">© 2026 SEO Basics</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-base/7 font-normal text-neutral-600 hover:text-neutral-950 sm:text-sm/6 dark:text-neutral-400 dark:hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
