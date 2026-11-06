# SEO Basics star mark

Direction H, "Glint", from the sparkle round (`../directions/sparkle/`).
**Status: approved by Lars on 2026-11-05.** Open `test-sheet.png`.

A full five-point star with filleted tips and inner corners, and one small
four-point twinkle in its upper-right crook: the sparkle of 🌟 in one restrained
accent, an original vector rather than the emoji.

## Light icon is the default (SEO-14, 2026-11-06)

Lars prefers the light variant (Kaneo SEO-14). The light tile (`seobasics-icon-light.svg`,
white to warm-paper gradient, gold glow, top-lit star) is now the icon everywhere:

| Surface | Source |
|---|---|
| macOS `AppIcon.appiconset` (16 to 512 pt, 1x and 2x) | `seobasics-icon-light-small.svg` at 16 and 32 px, `seobasics-icon-light.svg` above |
| In-app brand icon (`BrandIcon.imageset`, the app's `BrandMark`) | light tile; Dark appearance uses the dark tile |
| Favicon `app/favicon.ico` (16/32/48) and `app/icon.svg` | light small tile, cropped to the tile |
| Apple touch icon `app/apple-icon.png` (180) | light tile, opaque and full bleed (iOS masks it) |
| Site mark (`components/star-mark.tsx`, `paths.json` `tile`) | flat light tile with the gold mark; dark tile in dark mode |

**Where the dark tile stays, and why.** Only in dark appearance: the site in
dark mode and the in-app brand icon in macOS Dark appearance. On a dark surface
the white tile is the brightest element on screen and pulls focus from the
content; the dark tile keeps the gold star as the bright accent. Everywhere else
(Dock, Finder, browser tabs, home screens) the light tile is used, as the
system draws those on surfaces we don't control and the light tile reads on both.

**Not done here (Mac gate):** the Dock at 16, 32, 128 and 512 px on a light,
dark and tinted Dock needs real Mac screenshots (the test sheet's Dock rows are
a browser simulation, not a Mac capture), and macOS 26 Icon Composer layers
(dark, tinted and clear appearances) need Xcode on a Mac.

## History

- 2026-11-04: Lars picked direction A ("Notch") from the first round
  (`../directions/`) and asked for a refinement closer to 🌟.
- 2026-11-05: Lars declined the refined Notch ("we need something more
  sparkling, like the emoji and more professional, designed with /design
  skill"). The `design` skill was loaded for the sparkle round (E Radiant,
  F Twinkle, G Aura, H Glint), and Lars chose H.

## Files

- `geom.py`: shape helpers (filleted polygons, concave sparkle curves, fitting to the 100 × 100 box).
- `star.py`: the Glint geometry and its parameters (`GEOMETRY`, also written to `paths.json`).
- `render.py`: headless Chrome rendering. Small sizes are drawn in a larger
  window and cropped, because Chrome on macOS won't paint tiny windows.
- `generate.py`: run `python3 -I brand/mark/generate.py` from the repository
  root. It needs only Python 3 and Google Chrome (set `CHROME` to override the
  binary), and rewrites everything below.
- `seobasics-mark{,-ink,-white}.svg`: master mark in gold, ink and white.
- `seobasics-mark-small{,-ink,-white}.svg`: 16 to 24 px variant, with a larger twinkle set slightly further out.
- `seobasics-icon-light.svg`: the app icon master (default): light tile, gold
  glow, top-lit star. `seobasics-icon-light-small.svg` carries the small mark
  (16 and 32 px tiles).
- `seobasics-icon.svg` and `seobasics-icon-small.svg`: the dark-tile alternate;
  `seobasics-icon-flat.svg` is the dark tile without glow.
- `AppIcon.appiconset/`: Xcode asset catalog, 16 to 512 pt at 1x and 2x, plus
  `Contents.json`, from the light master. Copy into the app repository's
  `SEOBasics/Assets.xcassets/`.
- `BrandIcon.imageset/`: the in-app brand icon (128 and 256 px), light, with a
  Dark-appearance dark tile. Copy into the app repository too.
- `paths.json`: the path data `components/star-mark.tsx` renders, including
  `tile` (the continuous-corner tile in the 100 × 100 box and the mark's
  placement on it).
- `test-sheet.{html,png}`: rendered app icons at 16 to 1024 px, 16 to 256 px
  ramps in gold and mono on light and dark, lockups, clear space.
- Web outputs: `app/icon.svg` and `app/favicon.ico` (16/32/48, light small
  tile), `app/apple-icon.png` (180, light tile), `public/brand/*.svg` (flat marks).

## Usage rules

- Clear space: a quarter of the mark's height on every side.
- Full mark from 32 px; small mark from 16 to 24 px; never below 16 px (6 mm in print).
- Colour: gold `#F2A900` on light or dark backgrounds; ink `#17181B` or white for one-colour use.
- Star and twinkle always share one colour. Never recolour, outline, rotate,
  add effects, move or drop the twinkle, or rebuild the star from an emoji or icon font.
- The glow and top-lit fill belong to the app icon only; the mark itself is always flat.
- Wordmark: "SEO Basics" in Inter semibold, tracking −2%, set beside the mark with a gap of 0.35 × mark height.

## Still open for the app

- Real Mac Dock screenshots at 16, 32, 128 and 512 px (light, dark and tinted Dock).
- macOS 26 icon layers (Icon Composer: dark/tinted/clear appearances) need Xcode on a Mac.
