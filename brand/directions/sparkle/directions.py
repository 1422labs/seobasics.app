"""The four sparkle directions. Each returns shapes in local coordinates
(star centre at the origin, outer radius 1); generate.py fits them into 100x100."""
import math
from geom import (polar, star_pts, rounded, sparkle, offset_polygon, lerp, sub, add, mul, unit)

RATIO = 0.47
TIP, INNER = 0.09, 0.055          # fillet radii relative to R = 1

def base_star(R=1.0, ratio=RATIO, tip=TIP, inner=INNER, c=(0, 0)):
    pts = [add(p, c) for p in star_pts(R, ratio)]
    return rounded(pts, [tip * R if i % 2 == 0 else inner * R for i in range(10)])

CROOKS = [-54 + 72 * k for k in range(5)]   # angles of the inner corners

# E. Radiant: the star with five short rays of light in the crooks, the way 🌟 glows.
def radiant(small=False, r0=0.74, r1=0.98, w=0.105, rays=None):
    shapes = [base_star()]
    if small:                     # at 16-24 px the rays turn into specks: plain star
        return shapes
    for a in (rays or CROOKS):
        # a capsule of light: uniform width, rounded ends
        c0, c1 = polar(r0, a), polar(r1, a)
        nrm = polar(1, a + 90)
        pts = [add(c0, mul(nrm, -w / 2)), add(c0, mul(nrm, w / 2)), add(c1, mul(nrm, w / 2)), add(c1, mul(nrm, -w / 2))]
        shapes.append(rounded(pts, [w * 0.499] * 4))
    return shapes

# F. Twinkle: one silhouette; the star's sides draw in like a sparkle, tips stay crisp.
def twinkle(small=False):
    ri, pull = (0.24, 0.84) if not small else (0.34, 0.76)
    tips = [polar(1, -90 + 72 * k) for k in range(5)]
    inner = [polar(ri, -54 + 72 * k) for k in range(5)]
    return [sparkle(tips, inner, pull)]

# G. Aura: the star with an echo of its own outline along the lit upper-left side,
#    the flat-vector version of a glow.
def aura(small=False, gap=0.10, w=0.085, a0=150, a1=300):
    star = star_pts(1, RATIO)
    shapes = [base_star()]
    if small:
        return shapes
    outer = offset_polygon(star, gap + w)
    inner = offset_polygon(star, gap)
    shapes.append(_ring_sector(outer, inner, a0, a1, TIP + gap + w, TIP + gap))
    return shapes

def _sample_rounded(pts, radii, steps=10):
    """Dense polyline of a rounded polygon (for ring clipping)."""
    from geom import fillet
    out, n = [], len(pts)
    for k in range(n):
        r = radii[k]
        if r <= 0:
            out.append(pts[k]); continue
        t1, t2, sw = fillet(pts[k - 1], pts[k], pts[(k + 1) % n], r)
        # arc centre: along bisector
        u1, u2 = unit(sub(pts[k - 1], pts[k])), unit(sub(pts[(k + 1) % n], pts[k]))
        bis = unit(add(u1, u2))
        import math as m
        half = m.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2
        cen = add(pts[k], mul(bis, r / m.sin(half)))
        a1 = m.atan2(t1[1] - cen[1], t1[0] - cen[0]); a2 = m.atan2(t2[1] - cen[1], t2[0] - cen[0])
        da = a2 - a1
        while da > m.pi: da -= 2 * m.pi
        while da < -m.pi: da += 2 * m.pi
        for i in range(steps + 1):
            a = a1 + da * i / steps
            out.append((cen[0] + r * m.cos(a), cen[1] + r * m.sin(a)))
    return out

def _clip_angle(poly, a0, a1):
    """Part of a closed polyline whose polar angle (deg, 0..360) lies in [a0, a1]."""
    def ang(p): return math.degrees(math.atan2(p[1], p[0])) % 360
    n = len(poly)
    # start at a point outside the range
    start = next(i for i in range(n) if not (a0 <= ang(poly[i]) <= a1))
    seq = poly[start:] + poly[:start] + [poly[start]]
    out = []
    for p, q in zip(seq, seq[1:]):
        ip, iq = a0 <= ang(p) <= a1, a0 <= ang(q) <= a1
        if ip != iq:
            edge = a0 if (iq and abs(ang(q) - a0) < abs(ang(q) - a1)) or (ip and abs(ang(p) - a0) < abs(ang(p) - a1)) else a1
            d = polar(1, edge)
            # ray from origin at angle `edge` meets segment p-q
            e = sub(q, p)
            den = d[0] * e[1] - d[1] * e[0]
            t = (p[0] * e[1] - p[1] * e[0]) / den
            out.append(mul(d, t))
        if iq:
            out.append(q)
    return out

def _ring_sector(outer, inner, a0, a1, r_out, r_in):
    n = len(outer)
    ro = [r_out if i % 2 == 0 else 0.02 for i in range(n)]
    rin = [r_in if i % 2 == 0 else 0.02 for i in range(n)]
    o = _clip_angle(_sample_rounded(outer, ro), a0, a1)
    i = _clip_angle(_sample_rounded(inner, rin), a0, a1)
    pts = o + list(reversed(i))
    return [("M", pts[0])] + [("L", p) for p in pts[1:]] + [("Z",)]

# H. Glint: the star with one small four-point twinkle in its upper-right crook.
def glint(small=False, d=1.02, size=0.36, ang=-54):
    if small:
        size, d = 0.44, 1.04
    shapes = [base_star()]
    c = polar(d, ang)
    tips = [add(c, polar(size * (1 if k % 2 == 0 else 0.78), -90 + 90 * k)) for k in range(4)]
    inner = [add(c, polar(size * 0.16, -45 + 90 * k)) for k in range(4)]
    shapes.append(sparkle(tips, inner, 0.82))
    return shapes

# (key, name, builder, largest size that uses the small variant, what the small variant does, blurb)
DIRECTIONS = [
    ("E", "Radiant", radiant, 24, "16–24 px: plain star, no rays",
     "The full star with five short rays of light in its crooks: the glow of 🌟, drawn as flat geometry."),
    ("F", "Twinkle", twinkle, 24, "16–24 px: shallower curves, fuller arms",
     "One silhouette. The star's sides draw inward like a sparkle while it keeps five crisp points."),
    ("G", "Aura", aura, 32, "16–32 px: plain star, no echo",
     "The star with a thin echo of its outline along the lit upper-left side: a glow made of form, not blur."),
    ("H", "Glint", glint, 24, "16–24 px: larger twinkle, set slightly further out",
     "The full star with one small four-point twinkle in its upper-right crook: the sparkle of 🌟, kept to one accent."),
]
