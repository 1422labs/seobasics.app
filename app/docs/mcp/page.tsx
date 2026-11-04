import { C, CodeBlock, ContentPage, DefinitionList, H3, List, Note, P, Section, TextLink } from "@/components/content-page";
import { pageMetadata, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "/docs/mcp",
  "MCP setup for Claude Code and Codex",
  "Connect Claude Code, Codex or another MCP client to SEO Basics' local MCP server: turn it on, copy the configuration, and let your agent read findings and verify fixes.",
);

// The v1 tool surface of the app (1422labs/seobasics, SEOBasicsMCP/MCPToolCatalog.swift).
// Tool and argument names are a stable contract; keep this list in step with it.
const tools: { name: string; required: string[]; optional: string[]; body: string }[] = [
  {
    name: "scan_website",
    required: ["url"],
    optional: ["max_pages", "scope", "render_javascript"],
    body: "Starts a crawl of a public site or a local dev server and returns the scan id at once. scope is host, subdomains or path. Poll get_scan_summary for progress.",
  },
  { name: "list_scans", required: [], optional: ["website", "limit"], body: "Saved scans, newest first, optionally for one host." },
  { name: "get_scan_summary", required: ["scan_id"], optional: [], body: "Status, progress and the critical, warning and info counts of one scan." },
  {
    name: "get_seo_issues",
    required: ["scan_id"],
    optional: ["severity", "issue_code", "url_contains", "limit", "cursor"],
    body: "Findings with an explanation and a suggested fix, filtered and paged. Pass the cursor from the previous response for the next page.",
  },
  {
    name: "inspect_page",
    required: ["url"],
    optional: ["scan_id", "render_javascript"],
    body: "The extracted SEO data and findings of one URL. With scan_id it reads the stored result; without it, it fetches the page now.",
  },
  {
    name: "verify_urls",
    required: ["urls"],
    optional: ["scan_id", "render_javascript"],
    body: "Fetches up to 50 URLs again after a fix. With scan_id it reports which of that scan's findings are resolved, which remain and which are new.",
  },
  {
    name: "compare_scans",
    required: ["base_scan_id", "head_scan_id"],
    optional: [],
    body: "Findings resolved, introduced and still open between an earlier and a later scan of the same site.",
  },
];

const claudeCode = `claude mcp add --transport http seobasics \\
  ${site.mcpEndpoint} \\
  --header "Authorization: Bearer $SEOBASICS_TOKEN"`;

const codex = `# ~/.codex/config.toml
[mcp_servers.seobasics]
url = "${site.mcpEndpoint}"
bearer_token_env_var = "SEOBASICS_TOKEN"`;

const generic = `{
  "mcpServers": {
    "seobasics": {
      "type": "http",
      "url": "${site.mcpEndpoint}",
      "headers": { "Authorization": "Bearer <token from Settings → MCP>" }
    }
  }
}`;

export default function McpDocs() {
  return (
    <ContentPage
      eyebrow="Docs"
      title="Connect your coding agent"
      lead={
        <>
          SEO Basics runs a local MCP server while the app is open. Your agent uses it to start scans, read findings, change your code and check that the
          fix worked. There is no CLI or helper to install.
        </>
      }
    >
      <Section id="before" title="Before you start">
        <List
          items={[
            "SEO Basics on your Mac, activated (direct download) or installed from the Mac App Store. Both editions include MCP.",
            "An MCP client that supports the Streamable HTTP transport with a bearer token, such as Claude Code or Codex, on the same Mac.",
            "The app has to be open: the server stops when you quit it.",
          ]}
        />
      </Section>

      <Section id="turn-on" title="1. Turn on the server">
        <List
          ordered
          items={[
            <>
              Open SEO Basics and go to <strong className="font-medium text-neutral-950 dark:text-white">Settings → MCP</strong>.
            </>,
            <>
              Turn on <strong className="font-medium text-neutral-950 dark:text-white">Enable MCP Server</strong>. The status changes to running and shows
              the endpoint, <C>{site.mcpEndpoint}</C>.
            </>,
            <>
              Click <strong className="font-medium text-neutral-950 dark:text-white">Copy Configuration</strong> for your client. The copied text includes
              your access token.
            </>,
          ]}
        />
        <Note>
          The access token works like a password for the server. Keep it out of repositories and shared dotfiles. Codex reads it from the{" "}
          <C>SEOBASICS_TOKEN</C> environment variable each time it starts. <C>claude mcp add</C> expands the variable once and saves the token itself
          in Claude Code&apos;s configuration, so run Regenerate and add the server again if that file is ever shared. If it leaks, click Regenerate in Settings → MCP; the old token stops working at once.
        </Note>
      </Section>

      <Section id="clients" title="2. Add it to your client">
        <H3>Claude Code</H3>
        <CodeBlock>{claudeCode}</CodeBlock>
        <P>
          Then run <C>/mcp</C> in Claude Code to check that <C>seobasics</C> is connected.
        </P>

        <H3>Codex</H3>
        <CodeBlock>{codex}</CodeBlock>

        <H3>Other MCP clients</H3>
        <P>Any client that speaks Streamable HTTP and can send a header works. Most use a JSON file like this one:</P>
        <CodeBlock>{generic}</CodeBlock>
        <P>
          Clients that only launch local commands over stdio can&apos;t connect: SEO Basics has no stdio helper in version 1.
        </P>
      </Section>

      <Section id="use" title="3. Ask your agent">
        <P>Your agent picks the tools itself. Prompts that work well:</P>
        <List
          items={[
            <>
              <q>Scan http://localhost:3000 with SEO Basics and fix the critical issues.</q>
            </>,
            <>
              <q>Which pages on example.com have duplicate meta descriptions?</q>
            </>,
            <>
              <q>I fixed the canonical tags. Verify those pages against the last scan.</q>
            </>,
            <>
              <q>Compare this scan with last week&apos;s and tell me what regressed.</q>
            </>,
          ]}
        />
        <P>
          A typical session runs <C>scan_website</C>, then <C>get_seo_issues</C>, edits your code, and ends with <C>verify_urls</C>, which reports what is
          resolved, what remains and anything new. SEO Basics never changes your code itself; your agent does.
        </P>
      </Section>

      <Section id="tools" title="Tools">
        <P>
          Seven tools, the same analysis the app shows. Names and arguments are stable within version 1: new optional arguments can be added, nothing is
          renamed.
        </P>
        <DefinitionList
          items={tools.map((tool) => ({
            term: <span className="font-mono">{tool.name}</span>,
            detail: (
              <div className="flex flex-col gap-2">
                <p>{tool.body}</p>
                <p className="font-mono text-[0.8125rem]/6 text-neutral-500 dark:text-neutral-400">
                  {tool.required.map((arg) => (
                    <span key={arg} className="mr-3 inline-block text-neutral-950 dark:text-white">
                      {arg}
                    </span>
                  ))}
                  {tool.optional.map((arg) => (
                    <span key={arg} className="mr-3 inline-block">
                      {arg}?
                    </span>
                  ))}
                </p>
              </div>
            ),
          }))}
        />
        <P>
          Arguments marked <C>?</C> are optional. <C>scan_website</C> starts a crawl of the site you name. <C>inspect_page</C> without a{" "}
          <C>scan_id</C> and <C>verify_urls</C> fetch the URLs you pass. The other tools only read scans already on your Mac.
        </P>
      </Section>

      <Section id="security" title="Security">
        <List
          items={[
            "The server listens on 127.0.0.1 only. Other devices on your network can't reach it.",
            "Every request needs the access token. The app keeps it in your Keychain, never in preferences or logs.",
            "Requests with a browser Origin are refused, and so are Host headers other than 127.0.0.1, localhost or [::1], so a web page you visit can't talk to the server.",
            "The server is off until you turn it on, and Settings → MCP shows whether it is running.",
          ]}
        />
      </Section>

      <Section id="troubleshooting" title="Troubleshooting">
        <DefinitionList
          items={[
            { term: "Connection refused", detail: "SEO Basics isn't open, or the server is off. Open the app and check Settings → MCP." },
            {
              term: "401 Unauthorized",
              detail: "The token is missing or out of date. Copy the configuration again; a new token replaces the old one.",
            },
            {
              term: "403 Origin not allowed",
              detail: "The request came from a browser or a client that sends an Origin header. Use a command-line or desktop MCP client.",
            },
          ]}
        />
        <P>
          Still stuck? See <TextLink href="/support">Support</TextLink>.
        </P>
      </Section>
    </ContentPage>
  );
}
