# Star mark directions (for selection)

> Superseded. Lars chose A on 2026-11-04 with a refinement brief; the redesigned
> mark is in `../mark/`. These sketches stay for the record.

Four star-mark directions for SEO Basics, from the Brand and Design Brief.
Open `contact-sheet.png` (or `contact-sheet.html` in a browser).

Each direction shows:

- the macOS icon tile, dark and light, on the 824/1024 Big Sur grid;
- a 16, 20, 24, 32, 64 and 128 px ramp in brand gold `#F2A900` on light and dark;
- the same ramp in monochrome: ink `#17181B` on light, white on dark.

| Direction | Idea |
|---|---|
| **A · Notch** | A five-point star with its upper-right point cut off into a glint shard. It reads as a classic star at 16 px, and the cut shows from 32 px. |
| **B · Facet** | A five-point star with lit and shaded facets: depth from two flat tones, no gradient. It is a solid silhouette in monochrome. |
| **C · Meridian** | A tall four-point star with one small glint. It is closest to 🌟 and nearest the "AI sparkle" look the brief warns against. |
| **D · Split** | A four-point star cut by one diagonal channel. It is the most geometric, but at 16 px it reads more as a diamond than a star. |

Files:

- `<direction>-{gold,ink,white}.svg`: the mark in a 100×100 space.
- `<direction>-icon-{dark,light}.svg`: the 1024 icon tile.
- `generate.py`: regenerates every file: `python3 generate.py <outdir>`.
- `contact-sheet.png`: rendered with headless Chrome.

These are direction sketches drawn from code, not final art. The selected
direction then gets:

- optical refinement and a flattened master SVG (no masks);
- the full macOS `.appiconset`;
- favicon/web icons;
- clear-space and minimum-size rules;
- the full 16–1024 px test.

Process note: the installed `brand-kit` skill was loaded first (2026-11-03).
Its renderer (`imagegen`) is not installed on this host. Its output is also a
raster marketing-site board, and the brief needs an original vector mark. So
the directions were drawn as code-generated SVG instead.
