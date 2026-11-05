"""SEO Basics star mark geometry: direction H, "Glint" (approved 2026-11-05).

A full five-point star with filleted tips and inner corners, plus one small
four-point twinkle in its upper-right crook. Both are flat paths (lines, arcs
and cubics, no masks, strokes or transforms) in a 100 x 100 space. The small
optical variant (16-24 px) sets a larger twinkle slightly further out so it
survives at favicon size.
"""
from geom import add, fit, path_d, polar, rounded, sparkle, star_pts

GEOMETRY = dict(
    ratio=0.47,              # inner / outer radius of the star
    tip_r=0.09, inner_r=0.055,   # fillets, relative to the outer radius
    glint_angle=-54,         # the upper-right crook
    glint_distance=1.02, glint_size=0.36,        # full mark
    small_glint_distance=1.04, small_glint_size=0.44,  # 16-24 px
    glint_aspect=0.78,       # horizontal arms / vertical arms
    glint_waist=0.16, glint_pull=0.82,           # how far the twinkle's sides draw in
    fit_full=92, fit_small=94, optical_dy=1.5,   # size in the 100 box, nudge down
)

def shapes(small=False, g=GEOMETRY):
    star = rounded(star_pts(1.0, g["ratio"]),
                   [g["tip_r"] if i % 2 == 0 else g["inner_r"] for i in range(10)])
    dist = g["small_glint_distance"] if small else g["glint_distance"]
    size = g["small_glint_size"] if small else g["glint_size"]
    c = polar(dist, g["glint_angle"])
    tips = [add(c, polar(size * (1 if k % 2 == 0 else g["glint_aspect"]), -90 + 90 * k)) for k in range(4)]
    inner = [add(c, polar(size * g["glint_waist"], -45 + 90 * k)) for k in range(4)]
    return [star, sparkle(tips, inner, g["glint_pull"])]

def mark_paths(g=GEOMETRY):
    """(full path, small path, star centre in mark space)."""
    full = shapes(False, g)
    s, tx, ty = fit(full, g["fit_full"], dy=g["optical_dy"])
    small = shapes(True, g)
    s2, tx2, ty2 = fit(small, g["fit_small"], dy=g["optical_dy"])
    return path_d(full, s, tx, ty), path_d(small, s2, tx2, ty2), (tx, ty)
