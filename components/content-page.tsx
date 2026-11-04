import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { container } from "@/components/ui";

/**
 * Layout and typography for the text pages (docs, changelog, support, privacy, licensing).
 * There is no typography plugin: the few elements these pages use are styled here, so every
 * page reads the same.
 */
export function ContentPage({
  eyebrow,
  title,
  lead,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
  /** ISO date shown under the title, for policies. */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="pt-16 pb-24 sm:pt-20 sm:pb-32">
        <div className={container}>
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
            <div className="mt-6 text-lg/8 text-pretty text-neutral-600 dark:text-neutral-400">{lead}</div>
            {updated && (
              <p className="mt-4 text-base/7 text-neutral-500 sm:text-sm/6 dark:text-neutral-400">
                Last updated <time dateTime={updated}>{formatDate(updated)}</time>
              </p>
            )}
          </div>
          <div className="mt-14 flex max-w-3xl flex-col gap-14 sm:mt-16">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** One titled section; `id` makes it linkable. */
export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-5 border-t border-neutral-950/10 pt-10 dark:border-white/10">
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-3 text-base/7 font-medium">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[68ch] text-base/7 text-pretty text-neutral-600 dark:text-neutral-400">{children}</p>;
}

export function List({ items, ordered = false }: { items: React.ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag role="list" className="flex max-w-[68ch] flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-base/7 text-pretty text-neutral-600 dark:text-neutral-400">
          {ordered ? (
            <span className="w-5 shrink-0 font-mono text-sm/7 text-star-600 tabular-nums dark:text-star-400">{i + 1}</span>
          ) : (
            <span aria-hidden="true" className="mt-[0.6875rem] size-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          )}
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </Tag>
  );
}

/** Inline code. */
export function C({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-neutral-950/[0.04] px-1 py-0.5 font-mono text-[0.875em] text-neutral-950 dark:bg-white/10 dark:text-white">{children}</code>;
}

/** A code block. Always dark, like the terminal it is pasted into. */
export function CodeBlock({ label, children }: { label?: string; children: string }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      {label && <figcaption className="text-base/7 text-neutral-500 sm:text-sm/6 dark:text-neutral-400">{label}</figcaption>}
      <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-5 font-mono text-[0.8125rem]/6 text-neutral-200 ring-1 ring-black/10 dark:ring-white/10">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-medium text-neutral-950 underline decoration-neutral-950/20 underline-offset-4 hover:decoration-neutral-950/60 dark:text-white dark:decoration-white/30 dark:hover:decoration-white/70">
      {children}
    </a>
  );
}

/** Term/definition rows, for reference data (tools, codes, data items). */
export function DefinitionList({ items }: { items: { term: React.ReactNode; detail: React.ReactNode }[] }) {
  return (
    <dl className="flex flex-col divide-y divide-neutral-950/5 border-y border-neutral-950/5 dark:divide-white/10 dark:border-white/10">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
          <dt className="shrink-0 text-base/7 font-medium sm:w-48 sm:text-sm/6">{item.term}</dt>
          <dd className="min-w-0 text-base/7 text-pretty text-neutral-600 sm:text-sm/6 dark:text-neutral-400">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A plain callout for something the reader must not miss. */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[68ch] rounded-xl bg-neutral-950/[0.03] p-5 text-base/7 text-pretty text-neutral-700 ring-1 ring-neutral-950/5 dark:bg-white/5 dark:text-neutral-300 dark:ring-white/10">
      {children}
    </div>
  );
}
