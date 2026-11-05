"""Shape helpers for the sparkle round of star-mark directions.

Shapes are built as segment lists in local coordinates, then fitted into the
100 x 100 mark space and written as flat SVG path data (lines, arcs, cubics).
"""
import math

def sub(a, b): return (a[0] - b[0], a[1] - b[1])
def add(a, b): return (a[0] + b[0], a[1] + b[1])
def mul(a, k): return (a[0] * k, a[1] * k)
def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
def length(a): return math.hypot(*a)
def unit(a): l = length(a); return (a[0] / l, a[1] / l)
def cross(a, b): return a[0] * b[1] - a[1] * b[0]
def polar(r, deg, c=(0, 0)):
    a = math.radians(deg)
    return (c[0] + r * math.cos(a), c[1] + r * math.sin(a))

def intersect(p, d, q, e):
    t = cross(sub(q, p), e) / cross(d, e)
    return add(p, mul(d, t))

def fillet(prev, p, nxt, rad):
    u1, u2 = unit(sub(prev, p)), unit(sub(nxt, p))
    c = max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))
    d = rad / math.tan(math.acos(c) / 2)
    sweep = 1 if cross(sub(p, prev), sub(nxt, p)) > 0 else 0
    return add(p, mul(u1, d)), add(p, mul(u2, d)), sweep

def rounded(pts, radii):
    """Closed polygon with per-vertex fillets (0 = sharp). Clockwise on screen."""
    n = len(pts)
    segs = []
    for i in range(n + 1):
        k = i % n
        r = radii[k]
        if r <= 0:
            segs.append(("M" if i == 0 else "L", pts[k]))
            continue
        t1, t2, sw = fillet(pts[k - 1], pts[k], pts[(k + 1) % n], r)
        if i == 0:
            segs.append(("M", t2))
        else:
            segs += [("L", t1), ("A", r, sw, t2)]
    segs.append(("Z",))
    return segs

def star_pts(R=1.0, ratio=0.47, n=5, rot=-90):
    return [polar(R if i % 2 == 0 else R * ratio, rot + i * 180 / n) for i in range(2 * n)]

def offset_polygon(pts, d):
    """Offsets a clockwise (screen) polygon outward by d (negative = inward)."""
    n = len(pts)
    lines = []
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        e = unit(sub(b, a))
        nrm = (e[1], -e[0])           # outward for a clockwise-on-screen polygon
        lines.append((add(a, mul(nrm, d)), e))
    return [intersect(*lines[i - 1], *lines[i]) for i in range(n)]

def reverse(segs_pts_radii):
    pts, radii = segs_pts_radii
    return list(reversed(pts)), list(reversed(radii))

def sparkle(tips, inner, pull):
    """Concave star through `tips` (clockwise). Each side is a cubic from tip to
    tip whose handles run `pull` of the way toward the inner point between them."""
    n = len(tips)
    segs = [("M", tips[0])]
    for i in range(n):
        a, b, c = tips[i], tips[(i + 1) % n], inner[i]
        segs.append(("C", lerp(a, c, pull), lerp(b, c, pull), b))
    segs.append(("Z",))
    return segs

def poly(pts):
    return [("M", pts[0])] + [("L", p) for p in pts[1:]] + [("Z",)]

# --- output -----------------------------------------------------------------

def bbox(shapes):
    xs, ys = [], []
    for segs in shapes:
        for s in segs:
            if s[0] in "ML":
                xs.append(s[1][0]); ys.append(s[1][1])
            elif s[0] == "A":
                xs.append(s[3][0]); ys.append(s[3][1])
            elif s[0] == "C":
                xs.append(s[3][0]); ys.append(s[3][1])
    return min(xs), min(ys), max(xs), max(ys)

def fit(shapes, size=92.0, box=100.0, dy=0.0):
    """Scale+translate so the bbox's longer side is `size`, centred in the box
    (dy nudges down for optical centring)."""
    x0, y0, x1, y1 = bbox(shapes)
    s = size / max(x1 - x0, y1 - y0)
    tx = box / 2 - (x0 + x1) / 2 * s
    ty = box / 2 - (y0 + y1) / 2 * s + dy
    return s, tx, ty

def fmt(n): return f"{n:.2f}".rstrip("0").rstrip(".").replace("-0", "-0") if abs(n) >= 0.005 else "0"

def path_d(shapes, s, tx, ty):
    def P(p): return f"{fmt(p[0] * s + tx)} {fmt(p[1] * s + ty)}"
    out = []
    for segs in shapes:
        for g in segs:
            k = g[0]
            if k in "ML": out.append(f"{k}{P(g[1])}")
            elif k == "A": out.append(f"A{fmt(g[1] * s)} {fmt(g[1] * s)} 0 0 {g[2]} {P(g[3])}")
            elif k == "C": out.append(f"C{P(g[1])} {P(g[2])} {P(g[3])}")
            else: out.append("Z")
    return " ".join(out)
