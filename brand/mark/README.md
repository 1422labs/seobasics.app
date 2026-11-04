# SEO Basics star mark

Direction A ("Notch"), redesigned after Lars picked it (Q2, 2026-11-04) with
the brief to feel closer to 🌟 while staying bespoke and restrained. Open
`test-sheet.png`. **Status: redesign for owner review.** The site already uses
it, but it isn't final until Lars approves.

## What changed from the A sketch

| A sketch (`../directions/a-notch-*`) | Refined mark |
|---|---|
| Sharp, textbook star (inner/outer radius 0.447) | Fuller star (0.47) with filleted tips (r 4.2) and inner corners (r 2.6): the warm, soft proportions of 🌟, without cartoon roundness |
| Tip chopped off and pushed outward as a loose shard | The silhouette stays whole; one 3.2-unit light cut crosses the upper-right arm at 42%, tilted 20° off perpendicular, so it reads as a glint, not a broken point |
| One drawing at every size | Optical sizes: the full mark from 32 px, and a small mark with no cut and slightly smaller fillets for 16 to 24 px |
| Masks and strokes | Flat paths only (lines and arcs), no masks, strokes or transforms |
| Icon tile with rounded rect | Continuous-corner (superellipse) tile on the 824/1024 macOS grid; a soft gold halo inside the tile is the only nod to 🌟's glow |

Process: the `brand-kit` skill was loaded and its board spec used for the
art direction (type and colour hierarchy). Its `imagegen` renderer is still not
installed, and a generated raster would bring back the "AI-made" look Lars
rejected, so the mark is drawn from geometry in code. The `design` skill rules
apply to the website use (`components/star-mark.tsx`).

## Files

- `star.py`: the geometry. It refuses parameters that would put the cut inside a fillet.
- `generate.py`: run `python3 -I brand/mark/generate.py` from the repository root. It needs only Python 3 and `google-chrome`, and rewrites everything below.
- `seobasics-mark{,-ink,-white}.svg`: master mark in gold, ink and white.
- `seobasics-mark-small{,-ink,-white}.svg`: 16 to 24 px variant.
- `seobasics-icon.svg`: the app icon master, dark tile with halo. `seobasics-icon-light.svg` and `seobasics-icon-flat.svg` (no halo) are alternates.
- `AppIcon.appiconset/`: Xcode asset catalog, 16 to 512 pt at 1x and 2x, plus `Contents.json`. For the app repository once Lars approves.
- `paths.json`: the path data `components/star-mark.tsx` renders.
- `test-sheet.{html,png}`: rendered PNG icons, 16 to 256 px ramps in gold and mono on light and dark, lockups, clear space.
- Web outputs: `app/icon.svg` (small mark), `app/favicon.ico` (16/32/48), `app/apple-icon.png` (180), `public/brand/*.svg`.

## Usage rules

- Clear space: a quarter of the mark's height on every side.
- Full mark from 32 px; small mark from 16 to 24 px; never below 16 px (6 mm in print).
- Colour: gold `#F2A900` on light or dark backgrounds; ink `#17181B` or white for one-colour use.
- Don't recolour, outline, rotate, add effects or rebuild the star from an emoji or icon font.
- The halo belongs to the app icon only; the mark itself is always flat.
- Wordmark: "SEO Basics" in Inter semibold, tracking −2%, set beside the mark with a gap of 0.35 × mark height.

## Still open for the app

- Owner approval of this redesign.
- macOS 26 icon layers (Icon Composer: dark/tinted/clear appearances) need Xcode on a Mac.
