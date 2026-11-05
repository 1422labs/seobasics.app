import type { Metadata } from "next";
import { ContentPage, P, Section, TextLink } from "@/components/content-page";

// Prerendered at build time, when APP_URL is the build's: so no canonical (the root layout's
// would point at the build host) and never indexable, whatever host serves it.
export const metadata: Metadata = {
  title: "Page not found",
  alternates: {},
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ContentPage eyebrow="404" title="Page not found" lead="There is no page at this address.">
      <Section id="next" title="Where to go from here">
        <P>
          Start at the <TextLink href="/">home page</TextLink>, read the <TextLink href="/docs/mcp">MCP setup guide</TextLink> or get{" "}
          <TextLink href="/support">support</TextLink>.
        </P>
      </Section>
    </ContentPage>
  );
}
