import paths from "@/brand/mark/paths.json";

/**
 * The SEO Basics star (brand/mark). `small` is the optical variant for 16-24 px
 * without the light cut. Colour comes from the `fill-*` class.
 */
export function StarMark({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <svg viewBox={paths.viewBox} aria-hidden="true" className={className}>
      <path d={small ? paths.small : paths.full} />
    </svg>
  );
}
