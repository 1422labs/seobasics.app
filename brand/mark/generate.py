"""Builds the SEO Basics brand mark set from star.py.

    python3 -I brand/mark/generate.py            # from the repository root

Writes the vector masters to brand/mark/, the macOS AppIcon.appiconset and the
test sheet (both PNG, rendered with headless Chrome), and the web icons used by
the site (app/icon.svg, app/apple-icon.png, app/favicon.ico, public/brand/).
Needs only Python 3 and Google Chrome (found by render.py; set CHROME to override).
"""
import json, math, os, struct, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from star import GEOMETRY, mark_paths  # noqa: E402
from render import render  # noqa: E402

# Palette. Gold is the only brand colour; everything else is warm neutral.
GOLD = "#F2A900"        # star
GOLD_GLOW = "#FFC531"   # icon halo only
GOLD_CORE = "#FFE7A3"   # icon: inner glow
GOLD_TOP, GOLD_BOTTOM = "#FFC21A", "#F0A200"  # icon: top-lit star fill
INK = "#17181B"         # monochrome on light
PAPER = "#FFFFFF"       # monochrome on dark
TILE_DARK = ("#26272B", "#121316")
TILE_LIGHT = ("#FFFFFF", "#F2F0EA")

# Master geometry (100 x 100), from star.py. FULL is used from 32 px up; SMALL
# (larger twinkle) from 16 to 24 px.
FULL, SMALL, CENTRE = mark_paths()


def mark_svg(d, fill, title="SEO Basics"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="{title}">'
            f'<path d="{d}" fill="{fill}"/></svg>\n')


def squircle(cx, cy, half, n=5.0, steps=360, prec=1):
    """Continuous-corner tile (superellipse, exponent 5), as on the macOS grid."""
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        x = cx + half * math.copysign(abs(c) ** (2 / n), c)
        y = cy + half * math.copysign(abs(s) ** (2 / n), s)
        pts.append(f"{x:.{prec}f} {y:.{prec}f}")
    return "M" + " L".join(pts) + " Z"


def icon_svg(dark=False, glow=True, mark=None, square=False):
    """1024 macOS icon: 824 tile on the Big Sur grid, gold glow centred on the star.

    Light is the default (SEO-14, Lars 2026-11-05); dark stays an alternate for
    surfaces where a white tile would be the brightest thing on screen.
    `square` fills the whole 824 area (for the opaque Apple touch icon)."""
    d = mark or FULL
    top, bottom = TILE_DARK if dark else TILE_LIGHT
    edge, edge_op = ("#FFFFFF", 0.09) if dark else ("#17181B", 0.07)
    k = 5.0                                  # mark space -> 1024 tile
    off = 512 - 50 * k
    gx, gy = off + CENTRE[0] * k, off + CENTRE[1] * k
    a1, a2 = (0.42, 0.30) if dark else (0.30, 0.20)
    tile = (f'<rect x="100" y="100" width="824" height="824" fill="url(#tile)"/>' if square
            else f'<path d="{squircle(512, 512, 412)}" fill="url(#tile)"/>')
    edge_path = "" if square else (f'<path d="{squircle(512, 512, 411)}" fill="none" stroke="{edge}" '
                                   f'stroke-opacity="{edge_op}" stroke-width="2"/>')
    clip = '<rect x="100" y="100" width="824" height="824"/>' if square else f'<path d="{squircle(512, 512, 412)}"/>'
    halo = (f'<g clip-path="url(#clip)"><rect width="1024" height="1024" fill="url(#halo)"/>'
            f'<rect width="1024" height="1024" fill="url(#core)"/></g>') if glow else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<defs>
<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>
<radialGradient id="halo" cx="{gx:.1f}" cy="{gy:.1f}" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{GOLD_GLOW}" stop-opacity="{a1}"/><stop offset="0.35" stop-color="{GOLD_GLOW}" stop-opacity="{a2 / 2:.3f}"/><stop offset="1" stop-color="{GOLD_GLOW}" stop-opacity="0"/></radialGradient>
<radialGradient id="core" cx="{gx:.1f}" cy="{gy:.1f}" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{GOLD_CORE}" stop-opacity="{a2}"/><stop offset="1" stop-color="{GOLD_CORE}" stop-opacity="0"/></radialGradient>
<linearGradient id="star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{GOLD_TOP}"/><stop offset="1" stop-color="{GOLD_BOTTOM}"/></linearGradient>
<clipPath id="clip">{clip}</clipPath>
</defs>
{tile}
{halo}
{edge_path}
<g transform="translate({off:.1f} {off:.1f}) scale({k})"><path d="{d}" fill="url(#star)"/></g>
</svg>
'''


def web_tile():
    """Flat tile for the site's StarMark, in the 100 x 100 mark box: the same
    continuous-corner tile and star placement as the app icon, without glow."""
    k = 100 / 824                            # 1024 icon space (tile 100..924) -> 100 box
    scale = 5 * k
    off = (512 - 250 - 100) * k
    return {"d": squircle(50, 50, 50, steps=120, prec=2), "edge": squircle(50, 50, 49.8, steps=120, prec=2),
            "markTransform": f"translate({off:.3f} {off:.3f}) scale({scale:.4f})"}


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(text)


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
    # Light is the default icon (SEO-14); the dark tile is kept as an alternate.
    write(f"{out}/seobasics-icon-light.svg", icon_svg(dark=False))
    write(f"{out}/seobasics-icon-light-small.svg", icon_svg(dark=False, mark=SMALL))
    write(f"{out}/seobasics-icon.svg", icon_svg(dark=True))
    write(f"{out}/seobasics-icon-small.svg", icon_svg(dark=True, mark=SMALL))
    write(f"{out}/seobasics-icon-flat.svg", icon_svg(dark=True, glow=False))
    with open(f"{out}/paths.json", "w") as fh:
        json.dump({"viewBox": "0 0 100 100", "full": FULL, "small": SMALL, "tile": web_tile(), "geometry": GEOMETRY},
                  fh, indent=2)
        fh.write("\n")

    # macOS AppIcon.appiconset (Xcode asset catalog)
    iconset = f"{out}/AppIcon.appiconset"
    os.makedirs(iconset, exist_ok=True)
    images = []
    for pt in (16, 32, 128, 256, 512):
        for scale in (1, 2):
            px = pt * scale
            name = f"icon_{pt}x{pt}{'@2x' if scale == 2 else ''}.png"
            # 16 and 32 px tiles carry the small mark, whose twinkle survives at that size
            master = "seobasics-icon-light-small.svg" if px <= 32 else "seobasics-icon-light.svg"
            render(f"{out}/{master}", f"{iconset}/{name}", px)
            images.append({"filename": name, "idiom": "mac", "scale": f"{scale}x", "size": f"{pt}x{pt}"})
    with open(f"{iconset}/Contents.json", "w") as fh:
        json.dump({"images": images, "info": {"author": "xcode", "version": 1}}, fh, indent=2)
        fh.write("\n")

    # In-app brand icon (BrandMark in the macOS app): light tile, with the dark
    # tile as the Dark appearance, where a white tile would glare.
    brandset = f"{out}/BrandIcon.imageset"
    os.makedirs(brandset, exist_ok=True)
    brand_images = []
    for appearance, master in ((None, "seobasics-icon-light.svg"), ("dark", "seobasics-icon.svg")):
        for scale, px in ((1, 128), (2, 256)):
            name = f"brand-icon{'-dark' if appearance else ''}{'@2x' if scale == 2 else ''}.png"
            render(f"{out}/{master}", f"{brandset}/{name}", px)
            entry = {"filename": name, "idiom": "mac", "scale": f"{scale}x"}
            if appearance:
                entry["appearances"] = [{"appearance": "luminosity", "value": appearance}]
            brand_images.append(entry)
    with open(f"{brandset}/Contents.json", "w") as fh:
        json.dump({"images": brand_images, "info": {"author": "xcode", "version": 1}}, fh, indent=2)
        fh.write("\n")

    # Web icons for the Next.js app (file conventions in app/)
    app_dir, pub = f"{ROOT}/app", f"{ROOT}/public/brand"
    os.makedirs(pub, exist_ok=True)
    # Browser icon: the light small tile, cropped to the tile (no grid margin).
    tab_icon = icon_svg(dark=False, mark=SMALL).replace('viewBox="0 0 1024 1024"', 'viewBox="100 100 824 824"')
    write(f"{app_dir}/icon.svg", tab_icon)
    for name in ("seobasics-mark.svg", "seobasics-mark-ink.svg", "seobasics-mark-white.svg"):
        with open(f"{out}/{name}") as src:
            write(f"{pub}/{name}", src.read())
    with tempfile.TemporaryDirectory() as tmp:
        # apple-icon: opaque, full-bleed light tile (iOS masks it itself)
        full_bleed = icon_svg(dark=False, square=True).replace('viewBox="0 0 1024 1024"', 'viewBox="100 100 824 824"')
        write(f"{tmp}/apple.svg", full_bleed)
        render(f"{tmp}/apple.svg", f"{app_dir}/apple-icon.png", 180)
        write(f"{tmp}/small.svg", tab_icon)
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
    docks = [("light Dock", "rgb(246 246 246 / .8)", "#E9E6DF"), ("dark Dock", "rgb(40 40 40 / .8)", "#1C1C1E"),
             ("tinted wallpaper", "rgb(60 90 140 / .55)", "linear-gradient(135deg,#2B4C7E,#7A4E8C)")]
    dock_rows = "".join(
        f'<div class="dock" style="background:{wall}"><div class="bar" style="background:{bar}">'
        + "".join(f'<img src="AppIcon.appiconset/{n}" width="{w}" height="{w}" alt="">' for n, w in
                  [("icon_16x16.png", 16), ("icon_32x32.png", 32), ("icon_128x128.png", 64), ("icon_256x256.png", 128)])
        + f'</div><span class="tag">{label}</span></div>' for label, bar, wall in docks)
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
.dock{{position:relative;padding:22px 26px;border-radius:14px;margin-bottom:12px}}
.dock .bar{{display:inline-flex;align-items:flex-end;gap:18px;padding:10px 14px;border-radius:18px;backdrop-filter:blur(20px)}}
.dock .tag{{position:absolute;top:12px;right:16px;font-size:11px;color:#8A8C93}}
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
<p class="lede">Direction H, "Glint", approved by Lars on 2026-11-05. A full five-point star with filleted tips and inner corners, and one small four-point twinkle in its upper-right crook: the sparkle of the 🌟 reference, kept to a single accent. From 32 px up it is the full mark; at 16 to 24 px the small variant sets a larger twinkle slightly further out so it survives.</p>

<h2>macOS app icon, light (rendered AppIcon.appiconset PNGs, the default since SEO-14)</h2>
<div class="tiles">{icon_cells}</div>

<h2>Dock simulation (not a Mac screenshot): light, dark and tinted backgrounds</h2>
{dock_rows}

<h2>Dark alternate (in-app brand icon in Dark appearance only)</h2>
<div class="tiles"><figure><img src="BrandIcon.imageset/brand-icon-dark@2x.png" width="128" height="128" alt=""><figcaption>dark, 128</figcaption></figure>
<figure><img src="BrandIcon.imageset/brand-icon@2x.png" width="128" height="128" alt=""><figcaption>light, 128</figcaption></figure></div>

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
<li>Full mark: 32 px and larger.</li>
<li>Small mark (larger twinkle): 16 to 24 px: favicon, sidebar, menu bar, toolbar, and the 16/32 px app icon tiles.</li>
<li>Minimum size: 16 px on screen, 6 mm in print.</li>
<li>Colour: gold #F2A900 on light or dark; ink #17181B or white when one colour is required. Star and twinkle always share one colour. Never recolour, outline, rotate, add effects, or move or drop the twinkle.</li>
<li>The glow and the top-lit fill exist only inside the app icon tile. The mark itself is always flat, one colour.</li>
<li>Icon tile: light by default (app icon, favicon, Apple touch icon, site and in-app brand icon). The dark tile is used only in dark appearance (site dark mode, macOS Dark appearance), where a white tile would be the brightest element on screen.</li>
</ul>
</div>
</main></body></html>
'''


if __name__ == "__main__":
    main()
