import { CheckIcon } from "lucide-react";

/**
 * An illustrative coding-agent session against the built-in MCP server. Tool
 * names, issue codes and fields are the real v1 contract
 * (1422labs/seobasics, SEOBasicsMCP/MCPToolCatalog.swift); the site and
 * numbers are an example. Always dark: it depicts a terminal.
 */

function ToolCall({ name, args }: { name: string; args: string }) {
  return (
    <p className="flex min-w-0 gap-2">
      <span aria-hidden="true" className="text-star-400">
        ●
      </span>
      <span className="min-w-0">
        <span className="text-white">seobasics</span>
        <span className="text-neutral-500"> · </span>
        <span className="text-star-300">{name}</span>
        <span className="text-neutral-400"> {args}</span>
      </span>
    </p>
  );
}

const findings = [
  { severity: "critical", code: "broken_internal_link", url: "/pricing → /docs/setup (404)" },
  { severity: "critical", code: "title_missing", url: "/blog/launch" },
  { severity: "warning", code: "meta_description_duplicate", url: "/blog, /blog/page/2" },
  { severity: "warning", code: "image_alt_missing", url: "/ (3 images)" },
];

export function AgentSession() {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <p className="ml-2 font-mono text-xs text-neutral-500">~/projects/my-site · coding agent</p>
        </div>
        <div className="flex flex-col gap-4 overflow-x-auto p-5 font-mono text-[0.8125rem]/6 text-neutral-300">
          <p className="text-white">
            <span className="text-neutral-500">› </span>Find and fix the SEO issues on localhost:3000
          </p>

          <div className="flex flex-col gap-1">
            <ToolCall name="scan_website" args='url: "http://localhost:3000"' />
            <p className="pl-5 text-neutral-400 tabular-nums">completed · 48 pages · 2 critical · 9 warnings · 4 info</p>
          </div>

          <div className="flex flex-col gap-1">
            <ToolCall name="get_seo_issues" args='scan_id: "s_7f3c", limit: 4' />
            <ul role="list" className="flex flex-col pl-5">
              {findings.map((f) => (
                <li key={f.code} className="flex gap-3 whitespace-nowrap">
                  <span className={f.severity === "critical" ? "w-16 text-red-400" : "w-16 text-star-400"}>
                    {f.severity}
                  </span>
                  <span className="text-white">{f.code}</span>
                  <span className="text-neutral-500">{f.url}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-neutral-400">
            <span className="text-neutral-500">› </span>Edited 4 files in app/
          </p>

          <div className="flex flex-col gap-1">
            <ToolCall name="verify_urls" args='urls: [4 pages], scan_id: "s_7f3c"' />
            <p className="flex items-center gap-2 pl-5 text-emerald-400 tabular-nums">
              <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
              4 findings resolved · 0 remaining · 0 introduced
            </p>
          </div>
        </div>
      </div>
      <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
        Example session. The tools, issue codes and fields are the real MCP interface.
      </figcaption>
    </figure>
  );
}
