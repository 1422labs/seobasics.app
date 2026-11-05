"""Sparkle round: renders the candidate star marks and their comparison sheet.

    python3 -I brand/directions/sparkle/generate.py     # from the repository root

Writes <key>-<name>-{gold,ink,white}.svg, the small optical variants, the
1024 icon tiles (dark, light), their PNG renders and comparison-sheet.{html,png}.
Needs Python 3 and Google Chrome (CHROME env var, PATH, or /Applications).
"""
import math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "..", "mark"))
from render import render  # noqa: E402
from geom import fit, path_d, polar  # noqa: E402
from directions import DIRECTIONS    # noqa: E402

GOLD, GOLD_GLOW, INK, PAPER = "#F2A900", "#FFC531", "#17181B", "#FFFFFF"
TILE_DARK, TILE_LIGHT = ("#26272B", "#121316"), ("#FFFFFF", "#F2F0EA")

def write(path, text):
    with open(path, "w") as fh:
        fh.write(text)

def squircle(cx, cy, half, n=5.0, steps=360):
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        pts.append(f"{cx + half * math.copysign(abs(c) ** (2 / n), c):.1f} {cy + half * math.copysign(abs(s) ** (2 / n), s):.1f}")
    return "M" + " L".join(pts) + " Z"

def mark(shapes_fn, small=False):
    full = shapes_fn()
    s, tx, ty = fit(full, 92, dy=1.5)       # fit on the full drawing so both sizes share a frame
    shapes = shapes_fn(small=True) if small else full
    if small:
        s2, tx2, ty2 = fit(shapes, 94, dy=1.5)
        return path_d(shapes, s2, tx2, ty2), (tx2, ty2, s2)
    return path_d(shapes, s, tx, ty), (tx, ty, s)

def mark_svg(d, fill):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="SEO Basics">'
            f'<path d="{d}" fill="{fill}"/></svg>\n')

def icon_svg(d, frame, dark=True):
    tx, ty, s = frame
    cx, cy = tx, ty                         # star centre (origin) in mark space
    top, bottom = TILE_DARK if dark else TILE_LIGHT
    edge, edge_op = ("#FFFFFF", 0.09) if dark else ("#17181B", 0.07)
    k = 5.0                                 # mark space -> 1024 tile
    off = 512 - 50 * k
    gx, gy = off + cx * k, off + cy * k
    a1, a2 = (0.42, 0.30) if dark else (0.30, 0.20)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs>
<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>
<radialGradient id="halo" cx="{gx:.1f}" cy="{gy:.1f}" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{GOLD_GLOW}" stop-opacity="{a1}"/><stop offset="0.35" stop-color="{GOLD_GLOW}" stop-opacity="{a2 / 2:.3f}"/><stop offset="1" stop-color="{GOLD_GLOW}" stop-opacity="0"/></radialGradient>
<radialGradient id="core" cx="{gx:.1f}" cy="{gy:.1f}" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFE7A3" stop-opacity="{a2}"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient>
<linearGradient id="star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC21A"/><stop offset="1" stop-color="#F0A200"/></linearGradient>
<clipPath id="clip"><path d="{squircle(512, 512, 412)}"/></clipPath>
</defs>
<path d="{squircle(512, 512, 412)}" fill="url(#tile)"/>
<g clip-path="url(#clip)"><rect width="1024" height="1024" fill="url(#halo)"/><rect width="1024" height="1024" fill="url(#core)"/></g>
<path d="{squircle(512, 512, 411)}" fill="none" stroke="{edge}" stroke-opacity="{edge_op}" stroke-width="2"/>
<g transform="translate({off:.1f} {off:.1f}) scale({k})"><path d="{d}" fill="url(#star)"/></g>
</svg>
'''

def main():
    out = HERE
    rows = []
    for key, name, fn, upto, smallnote, blurb in DIRECTIONS:
        slug = f"{key.lower()}-{name.lower()}"
        d, frame = mark(fn)
        ds, _ = mark(fn, small=True)
        for suffix, fill in (("gold", GOLD), ("ink", INK), ("white", PAPER)):
            write(f"{out}/{slug}-{suffix}.svg", mark_svg(d, fill))
            write(f"{out}/{slug}-small-{suffix}.svg", mark_svg(ds, fill))
        for mode in ("dark", "light"):
            write(f"{out}/{slug}-icon-{mode}.svg", icon_svg(d, frame, mode == "dark"))
            for px in (512, 128, 64, 32, 16):
                os.makedirs(f"{out}/png", exist_ok=True)
                # small tiles use the small mark, as the .appiconset will
                src = f"{out}/{slug}-icon-{mode}.svg"
                if px <= max(upto, 32):
                    write(f"{out}/png/tmp.svg", icon_svg(ds, frame, mode == "dark"))
                    src = f"{out}/png/tmp.svg"
                render(src, f"{out}/png/{slug}-icon-{mode}-{px}.png", px)
        rows.append((key, name, slug, blurb, d, ds, upto, smallnote))
    if os.path.exists(f"{out}/png/tmp.svg"):
        os.remove(f"{out}/png/tmp.svg")
    write(f"{out}/comparison-sheet.html", sheet(rows))
    render(f"{out}/comparison-sheet.html", f"{out}/comparison-sheet.png", 2200, SHEET_H)
    print("ok")

SHEET_H = 3080

def sheet(rows):
    def m(d, fill, px):
        return f'<svg viewBox="0 0 100 100" width="{px}" height="{px}"><path d="{d}" fill="{fill}"/></svg>'

    def ramp(d, ds, fill, bg, label, upto):
        cells = "".join(f'<figure>{m(ds if s <= upto else d, fill, s)}<figcaption>{s}</figcaption></figure>'
                        for s in (16, 24, 32, 64, 128))
        return f'<div class="ramp" style="background:{bg}"><span class="tag">{label}</span>{cells}</div>'

    blocks = []
    for key, name, slug, blurb, d, ds, upto, smallnote in rows:
        tiles = "".join(f'<figure><img src="png/{slug}-icon-dark-{px}.png" width="{px}" height="{px}" alt=""><figcaption>{px}</figcaption></figure>'
                        for px in (128, 64, 32, 16))
        tiles += f'<figure><img src="png/{slug}-icon-light-128.png" width="128" height="128" alt=""><figcaption>128 light</figcaption></figure>'
        side = (f'<div class="side"><div class="bar">{m(ds, INK, 16)}<span>SEO Basics</span></div>'
                f'<div class="bar dk">{m(ds, GOLD, 16)}<span>SEO Basics</span></div>'
                f'<div class="lock">{m(d, GOLD, 44)}<span>SEO Basics</span></div></div>')
        blocks.append(f'''<section>
<header><h2>{key} · {name}</h2><p>{blurb} <span class="note">Small variant, {smallnote}.</span></p></header>
<div class="grid">
<figure class="big"><img src="png/{slug}-icon-dark-512.png" width="512" height="512" alt=""><figcaption>512 · macOS icon</figcaption></figure>
<div class="right">
<div class="ramps">{ramp(d, ds, GOLD, "#FFFFFF", "gold on white", upto)}{ramp(d, ds, GOLD, "#17181B", "gold on ink", upto)}
{ramp(d, ds, INK, "#FFFFFF", "ink on white", upto)}{ramp(d, ds, PAPER, "#17181B", "white on ink", upto)}</div>
<div class="tiles">{tiles}{side}</div>
</div></div></section>''')
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>Star mark: sparkle round</title>
<style>
@font-face{{font-family:InterVariable;font-weight:100 900;src:url("../../../public/fonts/InterVariable.woff2") format("woff2")}}
body{{margin:0;background:#F4F3EF;color:#17181B;font:15px/1.5 InterVariable,system-ui,sans-serif;font-feature-settings:"cv11","ss01"}}
main{{padding:48px 56px}} h1{{font-size:28px;font-weight:600;letter-spacing:-.01em;margin:0}}
.lede{{color:#55575E;margin:6px 0 28px;max-width:120ch}}
section{{background:#fff;border-radius:18px;outline:1px solid rgb(23 24 27/.07);padding:22px 26px 26px;margin-bottom:22px}}
header{{display:flex;gap:18px;align-items:baseline;margin-bottom:14px}} h2{{font-size:20px;font-weight:600;margin:0;white-space:nowrap}} header p{{margin:0;color:#3A3C42}} .note{{color:#8A8C93}}
.grid{{display:flex;gap:30px;align-items:flex-start}}
figure{{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}}
figcaption{{font-size:11px;color:#8A8C93;font-variant-numeric:tabular-nums}}
.big{{background:#ECEAE4;border-radius:14px;padding:6px 6px 10px}}
.right{{flex:1;display:flex;flex-direction:column;gap:14px}}
.ramps{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
.ramp{{display:flex;align-items:flex-end;gap:26px;padding:18px 22px 12px;border-radius:12px;outline:1px solid rgb(23 24 27/.08);position:relative;min-height:170px}}
.ramp .tag{{position:absolute;top:10px;right:14px;font-size:11px;color:#8A8C93}}
.tiles{{display:flex;gap:22px;align-items:flex-end;background:#ECEAE4;border-radius:12px;padding:16px 20px 10px}}
.side{{margin-left:auto;display:flex;flex-direction:column;gap:8px;align-self:center}}
.bar{{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:500;background:#fff;padding:5px 10px;border-radius:6px}}
.bar.dk{{background:#1E1F23;color:#fff}}
.lock{{display:flex;align-items:center;gap:14px;font-size:32px;font-weight:600;letter-spacing:-.02em;padding-top:6px}}
</style></head><body><main>
<h1>SEO Basics: star mark, sparkle round</h1>
<p class="lede">Four new directions after the refined Notch was declined ("more sparkling, like the emoji, and more professional"). Every mark is one flat path in a 100 × 100 space, rendered here at true pixel size (no scaling). The smallest sizes use each direction's optical variant. The macOS tile (dark; light at 128) adds a soft gold glow and a gentle top-lit fill to the star; the marks themselves stay flat, one colour. Lettered E–H to follow the first round (A–D).</p>
{"".join(blocks)}
</main></body></html>
'''

if __name__ == "__main__":
    main()
