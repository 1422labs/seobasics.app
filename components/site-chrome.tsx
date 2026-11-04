import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { StarMark } from "@/components/star-mark";
import { container } from "@/components/ui";
import { purchaseLinks, site } from "@/lib/site";

// Absolute paths, so the same header works on the landing page and on every content page.
const nav = [
  { href: "/#checks", label: "What it checks" },
  { href: "/docs/mcp", label: "MCP setup" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

const footerNav = [
  {
    title: "Product",
    links: [
      { href: "/#checks", label: "What it checks" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/docs/mcp", label: "MCP setup" },
      { href: "/support", label: "Support" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/licensing", label: "Licensing" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

function Logo() {
  return (
    <Link href="/" aria-label="Homepage" className="flex items-center gap-2.5">
      <StarMark className="size-7 shrink-0 fill-star-500" />
      <span className="text-[1.0625rem] font-semibold tracking-tight">SEO Basics</span>
    </Link>
  );
}

export function SiteHeader() {
  const links = purchaseLinks();
  return (
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
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-950/5 py-12 sm:py-16 dark:border-white/10">
      <div className={`${container} grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-4`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <StarMark small className="size-6 shrink-0 fill-star-500" />
            <span className="font-semibold tracking-tight">SEO Basics</span>
          </div>
          <p className="max-w-[32ch] text-base/7 text-neutral-600 sm:text-sm/6 dark:text-neutral-400">The simple SEO crawler for Mac, with MCP built in.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-3">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="text-base/7 font-medium sm:text-sm/6">{group.title}</h2>
              <ul role="list" className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-base/7 text-neutral-600 hover:text-neutral-950 sm:text-sm/6 dark:text-neutral-400 dark:hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="text-base/7 text-neutral-500 sm:text-sm/6 lg:col-span-4 dark:text-neutral-400">© 2026 SEO Basics</p>
      </div>
    </footer>
  );
}
