import paths from "@/brand/mark/paths.json";

/**
 * The SEO Basics brand icon (brand/mark): the Glint star on the light
 * continuous-corner tile, the default since SEO-14. In dark mode the tile
 * switches to the dark alternate, because a white tile would be the brightest
 * thing in a dark header. `small` is the optical variant for 16-24 px, with a
 * larger twinkle. Flat, without the app icon's glow (brand/mark/README.md).
 */
export function StarMark({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <svg viewBox={paths.viewBox} aria-hidden="true" className={className}>
      <path d={paths.tile.d} className="fill-white dark:fill-[#26272B]" />
      <path d={paths.tile.edge} fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-neutral-950/10 dark:stroke-white/10" />
      <path d={small ? paths.small : paths.full} transform={paths.tile.markTransform} className="fill-star-500" />
    </svg>
  );
}
