# SEO Basics star mark

Direction H, "Glint", from the sparkle round (`../directions/sparkle/`).
**Status: approved by Lars on 2026-11-05.** Open `test-sheet.png`.

A full five-point star with filleted tips and inner corners, and one small
four-point twinkle in its upper-right crook: the sparkle of 🌟 in one restrained
accent, an original vector rather than the emoji.

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
- `seobasics-icon.svg`: the app icon master: dark tile, gold glow, top-lit star.
  `seobasics-icon-small.svg` carries the small mark (16 and 32 px tiles);
  `seobasics-icon-light.svg` and `seobasics-icon-flat.svg` (no glow) are alternates.
- `AppIcon.appiconset/`: Xcode asset catalog, 16 to 512 pt at 1x and 2x, plus
  `Contents.json`. Ready to copy into the app repository.
- `paths.json`: the path data `components/star-mark.tsx` renders.
- `test-sheet.{html,png}`: rendered app icons at 16 to 1024 px, 16 to 256 px
  ramps in gold and mono on light and dark, lockups, clear space.
- Web outputs: `app/icon.svg` (small mark), `app/favicon.ico` (16/32/48),
  `app/apple-icon.png` (180), `public/brand/*.svg`.

## Usage rules

- Clear space: a quarter of the mark's height on every side.
- Full mark from 32 px; small mark from 16 to 24 px; never below 16 px (6 mm in print).
- Colour: gold `#F2A900` on light or dark backgrounds; ink `#17181B` or white for one-colour use.
- Star and twinkle always share one colour. Never recolour, outline, rotate,
  add effects, move or drop the twinkle, or rebuild the star from an emoji or icon font.
- The glow and top-lit fill belong to the app icon only; the mark itself is always flat.
- Wordmark: "SEO Basics" in Inter semibold, tracking −2%, set beside the mark with a gap of 0.35 × mark height.

## Still open for the app

- macOS 26 icon layers (Icon Composer: dark/tinted/clear appearances) need Xcode on a Mac.
