import { CheckIcon } from "lucide-react";

/** Shared page width: every section, header and footer lines up on it. */
export const container = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

export function Check() {
  return <CheckIcon className="size-4 h-lh shrink-0 stroke-star-600 dark:stroke-star-400" aria-hidden="true" />;
}

/** A text link with an arrow, for the secondary action next to a button. */
export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-base/7 font-semibold text-neutral-950 hover:text-neutral-700 sm:text-sm/6 dark:text-white dark:hover:text-neutral-300">
      {children} <span aria-hidden="true">→</span>
    </a>
  );
}

/** Every button except the page's one primary action. */
export function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-lg px-4 py-2.5 text-base/6 font-semibold text-neutral-950 ring-1 ring-neutral-950/15 hover:bg-neutral-950/[0.03] sm:py-2 sm:text-sm/6 dark:text-white dark:ring-white/20 dark:hover:bg-white/5"
    >
      {children}
    </a>
  );
}
