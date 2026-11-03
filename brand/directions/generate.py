"""Generates SEO Basics star-mark directions as SVG (100x100 mark space)."""
import math, os, sys
OUT = sys.argv[1]

GOLD = "#F2A900"; GOLD_DEEP = "#C98500"; INK = "#17181B"; PAPER = "#FFFFFF"

def star_points(n, R, r, cx, cy, rot=-90):
    pts = []
    for i in range(2 * n):
        rad = R if i % 2 == 0 else r
        a = math.radians(rot + i * 180 / n)
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts

def poly(pts):
    return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z"

def four_point(cx, cy, rv, rh, waist, bow):
    """Four-point star, vertical arm rv, horizontal rh; concave sides drawn as
    quadratic curves whose control sits `waist` from the centre (bow pulls it
    outward to keep the arms full enough for 16 px)."""
    top, right, bottom, left = (cx, cy - rv), (cx + rh, cy), (cx, cy + rv), (cx - rh, cy)
    c = waist * bow
    ctrl = [(cx + c, cy - c), (cx + c, cy + c), (cx - c, cy + c), (cx - c, cy - c)]
    p = [top, right, bottom, left]
    d = f"M{p[0][0]:.2f} {p[0][1]:.2f}"
    for i in range(4):
        q, e = ctrl[i], p[(i + 1) % 4]
        d += f" Q{q[0]:.2f} {q[1]:.2f} {e[0]:.2f} {e[1]:.2f}"
    return d + " Z"

# --- Direction A: Notch — five-point star, upper-right tip cut off as a glint shard.
def dir_a(fill, bg):
    pts = star_points(5, 47, 21, 50, 53)  # optical: centre a little low
    tip = pts[2]  # upper-right outer point
    # cut perpendicular to the arm, 38% of the way from tip to centre
    cx, cy = 50, 53
    t = 0.40
    mx, my = tip[0] + (cx - tip[0]) * t, tip[1] + (cy - tip[1]) * t
    ax, ay = cx - tip[0], cy - tip[1]
    L = math.hypot(ax, ay); px, py = -ay / L * 30, ax / L * 30
    gap = 5.5
    return f'''<defs><mask id="m{id(fill)}{bg}"><rect width="100" height="100" fill="#fff"/>
<line x1="{mx-px:.2f}" y1="{my-py:.2f}" x2="{mx+px:.2f}" y2="{my+py:.2f}" stroke="#000" stroke-width="{gap}"/></mask></defs>
<path d="{poly(pts)}" fill="{fill}" stroke="{fill}" stroke-width="2.5" stroke-linejoin="round" mask="url(#m{id(fill)}{bg})"/>'''

# --- Direction B: Facet — five-point star, each arm split light/shade (two tones, no gradient).
def dir_b(fill, bg, mono=False):
    cx, cy = 50, 53
    pts = star_points(5, 47, 20, cx, cy)
    if mono:
        return f'<path d="{poly(pts)}" fill="{fill}" stroke="{fill}" stroke-width="2" stroke-linejoin="round"/>'
    shade = GOLD_DEEP if fill == GOLD else fill
    light = GOLD if fill == GOLD else fill
    out = [f'<path d="{poly(pts)}" fill="{light}" stroke="{light}" stroke-width="2" stroke-linejoin="round"/>']
    for i in range(0, 10, 2):
        tip, inner = pts[i], pts[(i + 1) % 10]
        out.append(f'<path d="M{cx} {cy} L{tip[0]:.2f} {tip[1]:.2f} L{inner[0]:.2f} {inner[1]:.2f} Z" fill="{shade}"/>')
    return "\n".join(out)

# --- Direction C: Meridian — tall four-point star plus one small glint upper right.
def dir_c(fill, bg):
    main = four_point(44, 56, 42, 32, 9.5, 1.0)
    glint = four_point(80, 19, 13, 10, 3.2, 1.0)
    return f'<path d="{main}" fill="{fill}"/>\n<path d="{glint}" fill="{fill}"/>'

# --- Direction D: Split — four-point star sliced by one diagonal channel (an audit "cut").
def dir_d(fill, bg):
    main = four_point(50, 50, 46, 46, 13, 1.0)
    return f'''<defs><mask id="d{id(fill)}{bg}"><rect width="100" height="100" fill="#fff"/>
<line x1="20" y1="80" x2="80" y2="20" stroke="#000" stroke-width="6"/></mask></defs>
<path d="{main}" fill="{fill}" mask="url(#d{id(fill)}{bg})"/>'''

DIRS = {
    "a-notch": ("A · Notch", "Five-point star; the upper-right point is cut off into a separate glint shard. Most distinctive silhouette, still reads as a classic star.", dir_a),
    "b-facet": ("B · Facet", "Five-point star with each arm split into a lit and a shaded facet — depth from form, not from a gradient. Solid silhouette in monochrome.", dir_b),
    "c-meridian": ("C · Meridian", "Tall four-point star (vertical arms longer, optically centred low-left) with a single controlled glint. Closest to the 🌟 reference.", dir_c),
    "d-split": ("D · Split", "Four-point star divided by one diagonal channel — a precise “cut”, reads as analysis/clarity. Geometric and quiet.", dir_d),
}

def mark(key, fill, bg="x", mono=False):
    f = DIRS[key][2]
    body = f(fill, bg, mono) if key == "b-facet" else f(fill, bg)
    return body

def svg(body, size=None, view="0 0 100 100"):
    s = f' width="{size}" height="{size}"' if size else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"{s}>{body}</svg>'

def icon(key, dark=True):
    """macOS icon tile: 1024 canvas, 824 squircle-ish rounded rect (Big Sur grid), mark at ~56%."""
    tile = "#1B1D22" if dark else "#FBFAF7"
    edge = "#2A2D33" if dark else "#E6E2D8"
    body = mark(key, GOLD, "i" + ("d" if dark else "l"))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<rect x="100" y="100" width="824" height="824" rx="185" fill="{tile}" stroke="{edge}" stroke-width="4"/>
<g transform="translate(232 232) scale(5.6)">{body}</g></svg>'''

os.makedirs(OUT, exist_ok=True)
for key in DIRS:
    for name, fill in [("gold", GOLD), ("ink", INK), ("white", PAPER)]:
        open(f"{OUT}/{key}-{name}.svg", "w").write(svg(mark(key, fill, name, mono=(name != "gold"))))
    open(f"{OUT}/{key}-icon-dark.svg", "w").write(icon(key, True))
    open(f"{OUT}/{key}-icon-light.svg", "w").write(icon(key, False))

# Contact sheet
sizes = [16, 20, 24, 32, 64, 128]
rows = []
for key, (title, blurb, _) in DIRS.items():
    def ramp(fill, bgc, tag, mono):
        cells = "".join(f'<div class="cell"><div style="width:{s}px;height:{s}px">{svg(mark(key, fill, tag+str(s), mono))}</div><span>{s}</span></div>' for s in sizes)
        return f'<div class="ramp" style="background:{bgc}">{cells}</div>'
    rows.append(f'''<section><header><h2>{title}</h2><p>{blurb}</p></header>
<div class="row">
 <div class="icons"><div class="ic">{icon(key, True)}</div><div class="ic">{icon(key, False)}</div></div>
 <div class="ramps">
  {ramp(GOLD, "#FFFFFF", "gl", False)}
  {ramp(GOLD, "#17181B", "gd", False)}
  {ramp(INK, "#FFFFFF", "il", True)}
  {ramp(PAPER, "#17181B", "wd", True)}
 </div></div></section>''')

html = f'''<!doctype html><html><head><meta charset="utf-8"><title>SEO Basics star directions</title>
<style>
body{{margin:0;background:#EEECE7;font:14px/1.45 -apple-system,"SF Pro Text","Inter",system-ui,sans-serif;color:#17181B}}
main{{padding:40px 48px;max-width:1700px}}
h1{{font-size:26px;margin:0 0 4px}} .sub{{color:#5B5E66;margin:0 0 28px}}
section{{background:#fff;border:1px solid #DDD9CF;border-radius:14px;padding:22px 26px;margin-bottom:22px}}
header h2{{font-size:19px;margin:0}} header p{{margin:4px 0 16px;color:#4A4D55;max-width:900px}}
.row{{display:flex;gap:28px;align-items:center}}
.icons{{display:flex;gap:12px}} .ic svg{{width:200px;height:200px;display:block}}
.ramps{{display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1}}
.ramp{{display:flex;align-items:flex-end;gap:18px;padding:14px 16px;border-radius:10px;border:1px solid #DDD9CF}}
.cell{{display:flex;flex-direction:column;align-items:center;gap:6px}}
.cell svg{{width:100%;height:100%;display:block}}
.cell span{{font-size:10px;color:#8A8D95;font-variant-numeric:tabular-nums}}
</style></head><body><main>
<h1>SEO Basics — star mark directions</h1>
<p class="sub">Four directions for selection. Each: macOS icon tile (dark, light), then 16–128 px on light and dark in the brand gold and in monochrome. Vectors are drawn from code; the chosen direction gets hand refinement, the full .appiconset, favicon set and clear-space rules.</p>
{"".join(rows)}
</main></body></html>'''
open(f"{OUT}/contact-sheet.html", "w").write(html)
print("ok", len(os.listdir(OUT)))
