import { ContactLine } from "@/components/contact";
import { ContentPage, DefinitionList, List, Note, P, Section, TextLink } from "@/components/content-page";
import { pageMetadata, publisher } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "/privacy",
  "Privacy policy",
  "SEO Basics keeps your scans on your Mac. What the website, the license server and the app process, why, for how long, and your rights.",
);

// Facts this page states, and where they are enforced: no cookies or analytics (no such
// code in this repository), self-hosted fonts (app/globals.css), hashed keys and device ids
// (prisma/schema.prisma, lib/license), local-only scans and MCP (1422labs/seobasics).
// Change the page whenever one of them changes.
export default function Privacy() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="2026-11-04"
      lead="SEO Basics is built to keep your data on your Mac. This policy explains the little that isn't, and why."
    >
      <Section id="summary" title="In short">
        <List
          items={[
            "Your scans, pages and findings are stored on your Mac and never uploaded to us.",
            "This website sets no cookies and has no analytics, ads or third-party scripts.",
            "No account is needed. For a direct purchase we keep your email address and a hash of your license key, so we can deliver, recover and revoke the license.",
            "Mac App Store purchases are handled by Apple; we receive no personal data from them.",
          ]}
        />
      </Section>

      <Section id="controller" title="Who is responsible">
        {publisher.name ? (
          <P>{publisher.name} is responsible for the processing described here.</P>
        ) : (
          <Note>The name and address of the company responsible will be published here before SEO Basics is released.</Note>
        )}
        <ContactLine />
      </Section>

      <Section id="app" title="The Mac app">
        <P>
          SEO Basics crawls the websites you choose from your Mac. It sends requests to those sites, as a browser would, and stores the results in a
          local database on your Mac. You can delete scans in the app at any time.
        </P>
        <P>
          The MCP server listens only on your Mac (127.0.0.1). What it gives your coding agent stays between the app and that agent; it is not sent to us.
          Your agent&apos;s own provider may process what the agent reads, under that provider&apos;s policy.
        </P>
        <P>The app contains no analytics, advertising or tracking. Beyond the websites you scan, it connects only to:</P>
        <DefinitionList
          items={[
            { term: "Mac App Store edition", detail: "Apple, for purchase and updates, as for every App Store app. It doesn't contact our servers." },
            {
              term: "Direct edition",
              detail: "seobasics.app, to activate and renew your license (see below) and to check for updates.",
            },
          ]}
        />
      </Section>

      <Section id="license" title="Purchases and licenses (direct edition)">
        <P>
          Payment is handled by Stripe. We never see your full card details. Stripe processes your payment under{" "}
          <TextLink href="https://stripe.com/privacy">its own privacy policy</TextLink>. After a purchase we store:
        </P>
        <DefinitionList
          items={[
            { term: "Purchase", detail: "Your email address, Stripe's identifiers for the checkout and payment, and the purchase date." },
            {
              term: "License",
              detail: "A SHA-256 hash of your license key, its last four characters (so support can recognize it), and whether it is active or revoked.",
            },
            {
              term: "Activations",
              detail:
                "For each Mac: a hash of a random identifier the app creates, the app version, optionally the Mac's name, when it was activated and last checked, and when it was deactivated. A deactivated Mac's record is kept, so the license's history stays complete.",
            },
          ]}
        />
        <P>
          We use this to send your key and download link, to let you activate, move and deactivate Macs, to recover a lost key, and to revoke a license
          after a refund or chargeback. That is necessary to perform our contract with you. We don&apos;t store your key itself, hardware serial numbers
          or MAC addresses, and we don&apos;t use any of this for marketing.
        </P>
        <P>
          We email you only about your purchase: the key, a key you asked to recover, or a reset link you requested. We keep purchase and license records
          for as long as the license exists and as long as tax and accounting law requires.
        </P>
      </Section>

      <Section id="website" title="This website">
        <P>
          Like every web server, ours receives your IP address, browser user agent and the page requested. We use them only to deliver the site, keep it
          secure and fix errors, and keep server logs only briefly. Fonts are served from this site, so visiting it makes no requests to third parties.
        </P>
      </Section>

      <Section id="processors" title="Service providers">
        <P>
          Stripe processes payments. Our servers are run on infrastructure we operate, and email about your purchase is sent through an email delivery
          service. Each processes data only on our behalf, to provide its service.
        </P>
      </Section>

      <Section id="rights" title="Your rights">
        <P>
          You can ask for a copy of the data we hold about you, have it corrected or deleted, restrict or object to its processing, and receive it in a
          portable format. Deleting your license data means we can no longer recover or verify your license. You can also complain to a data protection
          authority.
        </P>
      </Section>

      <Section id="changes" title="Changes">
        <P>When this policy changes, we update it here and change the date at the top.</P>
      </Section>
    </ContentPage>
  );
}
