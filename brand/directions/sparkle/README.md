# Star mark: sparkle round (E–H, for selection)

Lars declined the refined Notch mark in `../../mark/` on 2026-11-05: "we need
something more sparkling, like the emoji and more professional". This round
moves toward the glow of 🌟 while keeping the Brand and Design Brief: an
original vector symbol, a star at 16–32 px, one colour when needed, light and
dark, and no AI-sparkle cluster.

Open `comparison-sheet.png`. Each direction shows the 512 px macOS icon, the
16/24/32/64/128 px ramp in gold and monochrome on light and dark at true pixel
size, the icon tile at 128/64/32/16 px (plus light at 128), sidebar rows and
the lockup.

| Direction | Idea | Small variant |
|---|---|---|
| **E · Radiant** | The full star with five short capsule rays of light in its crooks: the glow of 🌟 as flat geometry. | 16–24 px: plain star |
| **F · Twinkle** | One silhouette. The star's sides curve inward like a sparkle while it keeps five crisp points. | 16–24 px: shallower curves |
| **G · Aura** | The star with a thin echo of its outline along the lit upper-left side: glow made of form, not blur. | 16–32 px: plain star |
| **H · Glint** | The full star with one small four-point twinkle in its upper-right crook. | 16–24 px: larger twinkle |

Process: the `design` skill was loaded (SVG, colour, dark-mode and icon rules),
and the marks are drawn from geometry in code, as before.

Files:

- `geom.py`: rounded polygons, concave sparkle curves, outline offsets.
- `directions.py`: the four shape builders and their parameters.
- `generate.py`: `python3 -I brand/directions/sparkle/generate.py` from the
  repository root writes `<key>-<name>{,-small}-{gold,ink,white}.svg`,
  `<key>-<name>-icon-{dark,light}.svg`, `png/` and `comparison-sheet.{html,png}`.
- Rendering uses `../../mark/render.py` (headless Chrome; small sizes are drawn
  in a larger window and cropped, because Chrome on macOS won't paint tiny windows).

After Lars picks, the chosen direction replaces the mark in `../../mark/` and
`generate.py` there rebuilds the master SVGs, app icon set, favicons and `paths.json`.
