import { ContactLine } from "@/components/contact";
import { ContentPage, DefinitionList, List, P, Section, TextLink } from "@/components/content-page";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "/support",
  "Support",
  "Get help with SEO Basics: activating and moving your license, recovering a lost key, connecting your coding agent, refunds and how to contact us.",
);

export default function Support() {
  return (
    <ContentPage eyebrow="Support" title="How can we help?" lead="Answers to the common questions first. If yours isn't here, write to us.">
      <Section id="contact" title="Contact">
        <ContactLine />
      </Section>

      <Section id="license" title="License and activation">
        <P>These apply to the direct download. Mac App Store copies are covered by your Apple ID and have nothing to activate.</P>
        <DefinitionList
          items={[
            {
              term: "Activate",
              detail: "Paste the license key from your receipt email when SEO Basics asks for it. Activation needs an internet connection once.",
            },
            {
              term: "Move to a new Mac",
              detail: "A license works on up to 3 Macs at once. On the old Mac, deactivate it in Settings → License to free its seat, then activate the new one.",
            },
            {
              term: "Old Mac is gone",
              detail: "Use the reset link we email to your purchase address. It deactivates every Mac, and you activate the ones you still use again.",
            },
            {
              term: "Lost your key",
              detail: "We can email it again to the address you bought with. Your key is only ever sent to that address.",
            },
            {
              term: "Working offline",
              detail: "SEO Basics keeps working offline for 30 days after it last reached the license server. It checks quietly about once a week while you're online.",
            },
            {
              term: "Bought on the App Store",
              detail: "A Mac App Store purchase doesn't include a license key for the direct download, and a direct license doesn't unlock the App Store version.",
            },
          ]}
        />
        <P>
          The full rules are on <TextLink href="/licensing">Licensing</TextLink>.
        </P>
      </Section>

      <Section id="mcp" title="Coding agents and MCP">
        <P>
          Setup, the tool list and fixes for common connection errors are in <TextLink href="/docs/mcp">MCP setup</TextLink>. The quick checks:
        </P>
        <List
          items={[
            "SEO Basics is open and Settings → MCP shows the server as running.",
            "Your client uses http://127.0.0.1:18472/mcp and sends the current token.",
            "After clicking Regenerate, copy the configuration into your client again.",
          ]}
        />
      </Section>

      <Section id="scans" title="Scans">
        <DefinitionList
          items={[
            {
              term: "Pages are missing",
              detail: "SEO Basics follows internal links and sitemaps and respects robots.txt. Check the crawl scope and page limit in the scan's advanced options.",
            },
            {
              term: "Content built with JavaScript",
              detail: "Turn on JavaScript rendering in the scan's advanced options, so pages are rendered with WebKit before they are analyzed.",
            },
            {
              term: "A finding looks wrong",
              detail: "Write to us with the URL and the issue code shown on the finding. Export the scan as JSON if you can share it.",
            },
          ]}
        />
      </Section>

      <Section id="refunds" title="Refunds">
        <P>
          Mac App Store purchases are refunded by Apple: request one at{" "}
          <TextLink href="https://reportaproblem.apple.com">reportaproblem.apple.com</TextLink>. For a direct purchase, write to us from the address you
          bought with. A refunded direct license stops working the next time the app checks it.
        </P>
      </Section>
    </ContentPage>
  );
}
