import { ContentPage, formatDate, List, Note, P, Section, TextLink } from "@/components/content-page";
import { releases } from "@/lib/changelog";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "/changelog",
  "Changelog and release notes",
  "What's new in each version of SEO Basics, the SEO crawler for Mac: new checks, MCP tools, fixes and the macOS versions each release supports.",
);

export default function Changelog() {
  return (
    <ContentPage eyebrow="Changelog" title="Release notes" lead="What changed in each version of SEO Basics. Both editions get the same releases.">
      {releases.length === 0 ? (
        <Section id="upcoming" title="SEO Basics 1.0 is on its way">
          <Note>No version has been released yet. The first release will be listed here with everything it includes.</Note>
          <P>
            Until then, <TextLink href="/#checks">what it checks</TextLink> and <TextLink href="/docs/mcp">MCP setup</TextLink> describe what 1.0 does.
          </P>
        </Section>
      ) : (
        releases.map((release) => (
          <Section key={release.version} id={`v${release.version}`} title={`Version ${release.version}`}>
            <p className="text-base/7 text-neutral-500 sm:text-sm/6 dark:text-neutral-400">
              <time dateTime={release.date}>{formatDate(release.date)}</time> · {release.requirements}
            </p>
            {release.groups.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-base/7 font-medium">{group.title}</h3>
                <List items={group.items} />
              </div>
            ))}
          </Section>
        ))
      )}
    </ContentPage>
  );
}
