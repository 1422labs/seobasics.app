"""Builds the SEO Basics brand mark set from star.py.

    python3 -I brand/mark/generate.py            # from the repository root

Writes the vector masters to brand/mark/, the macOS AppIcon.appiconset and the
test sheet (both PNG, rendered with headless Chrome), and the web icons used by
the site (app/icon.svg, app/apple-icon.png, app/favicon.ico, public/brand/).
Needs only Python 3 and google-chrome.
"""
import json, math, os, struct, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from star import star_path  # noqa: E402

# Palette. Gold is the only brand colour; everything else is warm neutral.
GOLD = "#F2A900"        # star
GOLD_GLOW = "#FFC531"   # icon halo only
INK = "#17181B"         # monochrome on light
PAPER = "#FFFFFF"       # monochrome on dark
TILE_DARK = ("#232428", "#141518")
TILE_LIGHT = ("#FFFFFF", "#F3F1EC")

# Master geometry (100 x 100). FULL is used from 32 px up; SMALL drops the
# light cut, which would only blur at 16-24 px.
GEOMETRY = dict(R=46, ratio=0.47, cx=50, cy=52.5, tip_r=4.2, inner_r=2.6,
                cut_arm=1, cut_from_tip=0.42, cut_gap=3.2, cut_tilt=-20)
FULL = star_path(**GEOMETRY)
SMALL = star_path(**{**GEOMETRY, "cut_arm": None, "tip_r": 3.6, "inner_r": 2.2})


def mark_svg(d, fill, title="SEO Basics"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="{title}">'
            f'<path d="{d}" fill="{fill}"/></svg>\n')


def squircle(cx, cy, half, n=5.0, steps=360):
    """Continuous-corner tile (superellipse, exponent 5), as on the macOS grid."""
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        x = cx + half * math.copysign(abs(c) ** (2 / n), c)
        y = cy + half * math.copysign(abs(s) ** (2 / n), s)
        pts.append(f"{x:.1f} {y:.1f}")
    return "M" + " L".join(pts) + " Z"


def icon_svg(dark=True, glow=True):
    """1024 macOS icon: 824 tile on the Big Sur grid, star at ~56% of the tile."""
    top, bottom = TILE_DARK if dark else TILE_LIGHT
    edge = "#FFFFFF" if dark else "#17181B"
    edge_op = 0.08 if dark else 0.07
    halo = (f'<circle cx="512" cy="520" r="330" fill="url(#halo)"/>' if glow else "")
    halo_op = 0.30 if dark else 0.22
    scale = 5.3
    off = 512 - 50 * scale
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs>
<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="{GOLD_GLOW}" stop-opacity="{halo_op}"/><stop offset="0.55" stop-color="{GOLD_GLOW}" stop-opacity="{halo_op / 3:.3f}"/><stop offset="1" stop-color="{GOLD_GLOW}" stop-opacity="0"/></radialGradient>
<clipPath id="clip"><path d="{squircle(512, 512, 412)}"/></clipPath>
</defs>
<path d="{squircle(512, 512, 412)}" fill="url(#tile)"/>
<g clip-path="url(#clip)">{halo}</g>
<path d="{squircle(512, 512, 411)}" fill="none" stroke="{edge}" stroke-opacity="{edge_op}" stroke-width="2"/>
<g transform="translate({off:.1f} {off:.1f}) scale({scale})"><path d="{FULL}" fill="{GOLD}"/></g>
</svg>
'''


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(text)


def render(svg_path, png_path, w, h=None):
    h = h or w
    subprocess.run(["google-chrome", "--headless=new", "--hide-scrollbars", "--disable-gpu",
                    "--default-background-color=00000000", f"--window-size={w},{h}",
                    f"--screenshot={png_path}", "file://" + svg_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with open(png_path, "rb") as fh:
        head = fh.read(24)
    assert struct.unpack(">II", head[16:24]) == (w, h), f"{png_path}: wrong size"


def ico(pngs, path):
    """ICO with embedded PNG images (supported by every current browser)."""
    header = struct.pack("<HHH", 0, 1, len(pngs))
    entries, blobs, offset = b"", b"", 6 + 16 * len(pngs)
    for size, data in pngs:
        entries += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset)
        blobs += data
        offset += len(data)
    with open(path, "wb") as fh:
        fh.write(header + entries + blobs)


def main():
    out = HERE
    # Vector masters
    write(f"{out}/seobasics-mark.svg", mark_svg(FULL, GOLD))
    write(f"{out}/seobasics-mark-ink.svg", mark_svg(FULL, INK))
    write(f"{out}/seobasics-mark-white.svg", mark_svg(FULL, PAPER))
    write(f"{out}/seobasics-mark-small.svg", mark_svg(SMALL, GOLD))
    write(f"{out}/seobasics-mark-small-ink.svg", mark_svg(SMALL, INK))
    write(f"{out}/seobasics-mark-small-white.svg", mark_svg(SMALL, PAPER))
    write(f"{out}/seobasics-icon.svg", icon_svg(dark=True))
    write(f"{out}/seobasics-icon-light.svg", icon_svg(dark=False))
    write(f"{out}/seobasics-icon-flat.svg", icon_svg(dark=True, glow=False))
    with open(f"{out}/paths.json", "w") as fh:
        json.dump({"viewBox": "0 0 100 100", "full": FULL, "small": SMALL, "geometry": GEOMETRY}, fh, indent=2)
        fh.write("\n")

    # macOS AppIcon.appiconset (Xcode asset catalog)
    iconset = f"{out}/AppIcon.appiconset"
    os.makedirs(iconset, exist_ok=True)
    images = []
    for pt in (16, 32, 128, 256, 512):
        for scale in (1, 2):
            px = pt * scale
            name = f"icon_{pt}x{pt}{'@2x' if scale == 2 else ''}.png"
            render(f"{out}/seobasics-icon.svg", f"{iconset}/{name}", px)
            images.append({"filename": name, "idiom": "mac", "scale": f"{scale}x", "size": f"{pt}x{pt}"})
    with open(f"{iconset}/Contents.json", "w") as fh:
        json.dump({"images": images, "info": {"author": "xcode", "version": 1}}, fh, indent=2)
        fh.write("\n")

    # Web icons for the Next.js app (file conventions in app/)
    app_dir, pub = f"{ROOT}/app", f"{ROOT}/public/brand"
    os.makedirs(pub, exist_ok=True)
    write(f"{app_dir}/icon.svg", mark_svg(SMALL, GOLD))
    for name in ("seobasics-mark.svg", "seobasics-mark-ink.svg", "seobasics-mark-white.svg"):
        with open(f"{out}/{name}") as src:
            write(f"{pub}/{name}", src.read())
    with tempfile.TemporaryDirectory() as tmp:
        # apple-icon: opaque, full-bleed tile (iOS masks it itself)
        full_bleed = icon_svg(dark=True).replace('viewBox="0 0 1024 1024"', 'viewBox="100 100 824 824"')
        write(f"{tmp}/apple.svg", full_bleed)
        render(f"{tmp}/apple.svg", f"{app_dir}/apple-icon.png", 180)
        small_tile = mark_svg(SMALL, GOLD)
        write(f"{tmp}/small.svg", small_tile)
        pngs = []
        for px in (16, 32, 48):
            render(f"{tmp}/small.svg", f"{tmp}/f{px}.png", px)
            with open(f"{tmp}/f{px}.png", "rb") as fh:
                pngs.append((px, fh.read()))
        ico(pngs, f"{app_dir}/favicon.ico")

    # Test sheet
    write(f"{out}/test-sheet.html", test_sheet())
    render(f"{out}/test-sheet.html", f"{out}/test-sheet.png", 1800, 2700)
    print("ok")


def test_sheet():
    sizes = [16, 20, 24, 32, 64, 128, 256]

    def m(d, fill, px):
        return f'<svg viewBox="0 0 100 100" width="{px}" height="{px}"><path d="{d}" fill="{fill}"/></svg>'

    def ramp(fill, bg, label):
        cells = "".join(
            f'<figure>{m(SMALL if s <= 24 else FULL, fill, s)}<figcaption>{s}</figcaption></figure>' for s in sizes)
        return f'<div class="ramp" style="background:{bg}"><span class="tag">{label}</span>{cells}</div>'

    icon_cells = "".join(
        f'<figure><img src="AppIcon.appiconset/{n}" width="{w}" height="{w}" alt=""><figcaption>{c}</figcaption></figure>'
        for n, w, c in [("icon_512x512@2x.png", 300, "1024"), ("icon_256x256@2x.png", 160, "512"),
                        ("icon_128x128@2x.png", 128, "256"), ("icon_128x128.png", 64, "128"),
                        ("icon_32x32@2x.png", 64, "64 @1x"), ("icon_32x32.png", 32, "32"),
                        ("icon_16x16@2x.png", 32, "32"), ("icon_16x16.png", 16, "16")])
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>SEO Basics mark test sheet</title>
<style>
@font-face{{font-family:InterVariable;font-style:normal;font-weight:100 900;font-display:swap;src:url("../../public/fonts/InterVariable.woff2") format("woff2")}}
body{{margin:0;background:#F4F3EF;color:#17181B;font:15px/1.5 InterVariable,-apple-system,system-ui,sans-serif;font-feature-settings:"cv11","ss01"}}
main{{padding:56px 64px}} h1{{font-size:28px;font-weight:600;letter-spacing:-.01em;margin:0}}
.lede{{color:#55575E;margin:6px 0 40px;max-width:110ch}}
h2{{font-size:15px;font-weight:600;margin:40px 0 14px}}
.row{{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}}
figure{{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}}
figcaption{{font-size:11px;color:#8A8C93;font-variant-numeric:tabular-nums}}
.ramp{{display:flex;align-items:flex-end;gap:30px;padding:22px 26px;border-radius:14px;outline:1px solid rgb(23 24 27 / .08);margin-bottom:12px;position:relative}}
.ramp .tag{{position:absolute;top:12px;right:16px;font-size:11px;color:#8A8C93}}
.tiles{{display:flex;gap:28px;align-items:center}}
.tiles img{{display:block}}
.space{{display:flex;gap:40px;align-items:flex-start}}
.cs{{position:relative;width:300px;height:300px;background:#fff;outline:1px solid rgb(23 24 27 / .08);border-radius:14px}}
.cs .box{{position:absolute;inset:50px;outline:1px dashed #C9A23A}}
.cs svg{{position:absolute;inset:50px;width:200px;height:200px}}
.notes{{max-width:70ch;color:#3A3C42}} .notes li{{margin-bottom:6px}}
.lock{{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:600;letter-spacing:-.02em}}
.lock.dk{{background:#17181B;color:#fff;padding:26px 30px;border-radius:14px}}
.lock.lt{{background:#fff;padding:26px 30px;border-radius:14px;outline:1px solid rgb(23 24 27 / .08)}}
</style></head><body><main>
<h1>SEO Basics: star mark</h1>
<p class="lede">Direction A, refined. A full five-point star with filleted tips and inner corners, in the warm proportions of the 🌟 reference. One thin diagonal light cut crosses the upper-right arm as a glint. From 32 px up the mark is the full star; at 16 to 24 px the small variant drops the cut so the silhouette stays clean.</p>

<h2>macOS app icon (rendered AppIcon.appiconset PNGs)</h2>
<div class="tiles">{icon_cells}</div>

<h2>Size ramp: gold, light and dark</h2>
{ramp(GOLD, "#FFFFFF", "gold on white")}
{ramp(GOLD, "#17181B", "gold on ink")}
<h2>Size ramp: monochrome</h2>
{ramp(INK, "#FFFFFF", "ink on white")}
{ramp(PAPER, "#17181B", "white on ink")}

<h2>Lockup (wordmark set in Inter, semibold, tracking −2%)</h2>
<div class="row">
<div class="lock lt">{m(FULL, GOLD, 40)}SEO Basics</div>
<div class="lock dk">{m(FULL, GOLD, 40)}SEO Basics</div>
<div class="lock lt">{m(FULL, INK, 40)}SEO Basics</div>
</div>

<h2>Clear space and minimum size</h2>
<div class="space">
<div class="cs"><div class="box"></div>{m(FULL, GOLD, 200)}</div>
<ul class="notes">
<li>Clear space on every side: one quarter of the mark's height (dashed box = mark bounds, outer square = minimum clear area).</li>
<li>Full mark (with the light cut): 32 px and larger.</li>
<li>Small mark (no cut): 16 to 24 px: favicon, sidebar, menu bar, toolbar.</li>
<li>Minimum size: 16 px on screen, 6 mm in print.</li>
<li>Colour: gold #F2A900 on light or dark; ink #17181B or white when one colour is required. Never recolour the star in other hues, outline it, add effects or rotate it.</li>
<li>The halo exists only inside the app icon tile. The mark itself is always flat.</li>
</ul>
</div>
</main></body></html>
'''


if __name__ == "__main__":
    main()
