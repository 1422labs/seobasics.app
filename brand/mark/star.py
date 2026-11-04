"""SEO Basics star mark geometry (direction A, refined).

A full five-point star with filleted tips and inner corners, and one thin
"light cut" across the upper-right arm: a glint that disappears at favicon
sizes, where the mark reads as a plain star. Everything is computed as flat
paths (arcs and lines, no masks or strokes), so the SVG is the master art.
"""
import math

def _sub(a, b): return (a[0] - b[0], a[1] - b[1])
def _add(a, b): return (a[0] + b[0], a[1] + b[1])
def _mul(a, k): return (a[0] * k, a[1] * k)
def _len(a): return math.hypot(*a)
def _unit(a): l = _len(a); return (a[0] / l, a[1] / l)
def _cross(a, b): return a[0] * b[1] - a[1] * b[0]

def _intersect(p, d, q, e):
    """Intersection of lines p + t·d and q + s·e."""
    t = _cross(_sub(q, p), e) / _cross(d, e)
    return _add(p, _mul(d, t))

def star_vertices(R, ratio, cx, cy):
    pts = []
    for i in range(10):
        rad = R if i % 2 == 0 else R * ratio
        a = math.radians(-90 + i * 36)
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts

def _fillet(prev, p, nxt, rad):
    u1, u2 = _unit(_sub(prev, p)), _unit(_sub(nxt, p))
    cos = max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))
    half = math.acos(cos) / 2
    d = rad / math.tan(half)
    t1, t2 = _add(p, _mul(u1, d)), _add(p, _mul(u2, d))
    # vertices run clockwise on screen: a right turn is convex (sweep 1)
    sweep = 1 if _cross(_sub(p, prev), _sub(nxt, p)) > 0 else 0
    return t1, t2, sweep

def _half_angle(v, i):
    n = len(v)
    u1, u2 = _unit(_sub(v[i - 1], v[i % n])), _unit(_sub(v[(i + 1) % n], v[i % n]))
    return math.acos(max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))) / 2

def f(n): return f"{n:.2f}".rstrip("0").rstrip(".")
def P(pt): return f"{f(pt[0])} {f(pt[1])}"

def star_path(R=46, ratio=0.47, cx=50, cy=52.5, tip_r=4.2, inner_r=2.6,
              cut_arm=1, cut_from_tip=0.34, cut_gap=3.6, cut_tilt=0.0):
    """Path data. `cut_arm` is the arm index clockwise from the top (1 = upper
    right); None draws the star without the cut. `cut_from_tip` is the cut's
    position as a fraction of the tip→centre distance; `cut_tilt` rotates the
    cut (degrees) away from perpendicular to the arm."""
    v = star_vertices(R, ratio, cx, cy)
    n = len(v)
    corners = []
    for i in range(n):
        rad = tip_r if i % 2 == 0 else inner_r
        corners.append(_fillet(v[i - 1], v[i], v[(i + 1) % n], rad))

    if cut_arm is None:
        d = f"M{P(corners[0][1])}"
        for i in range(1, n + 1):
            t1, t2, sw = corners[i % n]
            d += f" L{P(t1)} A{f(tip_r if i % 2 == 0 else inner_r)} {f(tip_r if i % 2 == 0 else inner_r)} 0 0 {sw} {P(t2)}"
        return d + " Z"

    k = cut_arm * 2                     # tip vertex index
    tip, centre = v[k], (cx, cy)
    axis = _unit(_sub(centre, tip))
    a = math.radians(90 + cut_tilt)
    cut_dir = (axis[0] * math.cos(a) - axis[1] * math.sin(a), axis[0] * math.sin(a) + axis[1] * math.cos(a))
    dist = _len(_sub(centre, tip)) * cut_from_tip
    near = _add(tip, _mul(axis, dist - cut_gap / 2))   # tip side of the gap
    far = _add(tip, _mul(axis, dist + cut_gap / 2))    # body side
    e_in = _sub(v[k], v[k - 1])          # edge inner(k-1) → tip
    e_out = _sub(v[(k + 1) % n], v[k])   # edge tip → inner(k+1)
    b1 = _intersect(v[k - 1], e_in, far, cut_dir)
    b2 = _intersect(v[k], e_out, far, cut_dir)
    s1 = _intersect(v[k - 1], e_in, near, cut_dir)
    s2 = _intersect(v[k], e_out, near, cut_dir)
    # every cut end must sit on the straight part of its edge, clear of both fillets
    for pt, start, edge in ((b1, v[k - 1], e_in), (s1, v[k - 1], e_in), (b2, v[k], e_out), (s2, v[k], e_out)):
        t = ((pt[0] - start[0]) * edge[0] + (pt[1] - start[1]) * edge[1]) / (_len(edge) ** 2)
        lo = (inner_r if edge is e_in else tip_r) / math.tan(_half_angle(v, k - 1 if edge is e_in else k)) / _len(edge)
        hi = 1 - (tip_r if edge is e_in else inner_r) / math.tan(_half_angle(v, k if edge is e_in else k + 1)) / _len(edge)
        if not lo + 0.02 < t < hi - 0.02:
            raise ValueError(f"cut end {pt} is inside a fillet (t={t:.3f}, allowed {lo:.3f}..{hi:.3f})")

    def rad_of(i): return tip_r if i % 2 == 0 else inner_r
    # body: start after the cut on the outgoing edge, run clockwise round to the incoming edge
    d = f"M{P(b2)}"
    i = (k + 1) % n
    while i != k:
        t1, t2, sw = corners[i]
        r = rad_of(i)
        d += f" L{P(t1)} A{f(r)} {f(r)} 0 0 {sw} {P(t2)}"
        i = (i + 1) % n
    d += f" L{P(b1)} Z"
    # glint: the cut-off tip
    t1, t2, sw = corners[k]
    d += f" M{P(s1)} L{P(t1)} A{f(tip_r)} {f(tip_r)} 0 0 {sw} {P(t2)} L{P(s2)} Z"
    return d
