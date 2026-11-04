import { ContentPage, DefinitionList, List, P, Section, TextLink } from "@/components/content-page";
import { pageMetadata, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "/licensing",
  "Licensing",
  "How SEO Basics is licensed: a $39 one-time purchase, use on up to 3 Macs, all 1.x updates included, offline use, and how the direct and Mac App Store editions differ.",
);

// The Balanced policy (owner decision 2026-11-04), as implemented in lib/license/policy.ts.
export default function Licensing() {
  return (
    <ContentPage
      eyebrow="Licensing"
      title="One purchase, no subscription"
      lead={
        <>
          SEO Basics costs <span className="tabular-nums">{site.price}</span> once. There is no trial, no free tier and no subscription, and both editions
          have the same features, MCP included.
        </>
      }
    >
      <Section id="editions" title="Two editions">
        <DefinitionList
          items={[
            {
              term: "Direct download",
              detail: "Bought on seobasics.app with Stripe. You get a license key by email and activate the app with it. Updates are built in and signed.",
            },
            {
              term: "Mac App Store",
              detail: "Bought with your Apple ID. Apple handles payment, installation and updates; there is no key and nothing to activate.",
            },
          ]}
        />
        <P>
          Purchases belong to the store you used. A direct license doesn&apos;t unlock the Mac App Store version, and an App Store purchase doesn&apos;t
          include a license key. The two can&apos;t be exchanged or combined.
        </P>
      </Section>

      <Section id="direct" title="The direct license">
        <List
          items={[
            "Use it on up to 3 of your Macs at once.",
            "Deactivate a Mac in Settings → License to free its seat for another one.",
            "If you no longer have a Mac, the reset link we email to your purchase address deactivates all of them at once.",
            "Activation needs the internet once. After that SEO Basics works offline for up to 30 days at a time, and renews quietly about once a week while you're online.",
            "A refunded or disputed purchase revokes the license. The app stops working the next time it checks the license.",
            "Lost keys are sent again only to the purchase address.",
          ]}
        />
      </Section>

      <Section id="updates" title="Updates">
        <P>
          Your purchase includes every 1.x release, in both editions. Whether a future 2.0 is a paid upgrade hasn&apos;t been decided; this page will say
          so before any 2.0 is released.
        </P>
      </Section>

      <Section id="activation-data" title="What activation sends">
        <P>
          Activating sends your license key, a random identifier the app creates for your Mac, the app version and, optionally, your Mac&apos;s name, so you
          can tell your Macs apart. We store a hash of the key and its last four characters, so support can recognize it, and only a hash of the identifier, never the key or the identifier itself. No hardware serial numbers or MAC addresses are used.
          Details are in the <TextLink href="/privacy">privacy policy</TextLink>.
        </P>
      </Section>

      <Section id="questions" title="Questions">
        <P>
          See <TextLink href="/support">Support</TextLink> for moving a license, recovering a key and refunds.
        </P>
      </Section>
    </ContentPage>
  );
}
