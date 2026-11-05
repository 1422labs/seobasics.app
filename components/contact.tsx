import { Note, P, TextLink } from "@/components/content-page";
import { publisher } from "@/lib/site";

/** How to reach us, or a placeholder while the owner hasn't published an address (lib/site.ts). */
export function ContactLine() {
  return publisher.email ? (
    <P>
      Email <TextLink href={`mailto:${publisher.email}`}>{publisher.email}</TextLink>. Include your app version (SEO Basics → About) and, for a direct
      purchase, the last four characters of your license key. Never send the whole key or your MCP token.
    </P>
  ) : (
    <Note>The support email address will be published here before SEO Basics is released.</Note>
  );
}
