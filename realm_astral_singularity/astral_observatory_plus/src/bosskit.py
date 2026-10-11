"""
bosskit: a tiny pixel-art drawing toolkit for 32px bosses.

Shapes are built as pixel masks (sets of (x, y)), then painted as *parts* with a colour ramp
(dark -> light). Shading is banded (no gradients, no dithering), lit from the top-left, which is
how RotMG-style sprites read. When a part is painted over earlier parts, its overlapping edge gets
a darker contour ("selective outline") so limbs stay readable against the body behind them.
Hand-drawn stamps add faces, claws and ornaments on top.
"""
import math
from PIL import Image

# ------------------------------------------------------------------ colour helpers
def rgba(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) if len(h) == 8 else 255)


def ramp(*hexes):
    return [rgba(h) for h in hexes]


def mix(c1, c2, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c1, c2))


def shift_ramp(r, k):
    """Return a ramp shifted darker (k<0) or lighter (k>0) by k steps, clamped."""
    n = len(r)
    return [r[max(0, min(n - 1, i + k))] for i in range(n)]


# ------------------------------------------------------------------ masks
def ellipse(cx, cy, rx, ry, rot=0.0):
    m = set()
    cr, sr = math.cos(rot), math.sin(rot)
    R = int(max(rx, ry)) + 2
    for y in range(int(cy) - R, int(cy) + R + 2):
        for x in range(int(cx) - R, int(cx) + R + 2):
            dx, dy = x + .5 - cx, y + .5 - cy
            u, v = dx * cr + dy * sr, -dx * sr + dy * cr
            if (u / rx) ** 2 + (v / ry) ** 2 <= 1.0:
                m.add((x, y))
    return m


def circle(cx, cy, r):
    return ellipse(cx, cy, r, r)


def poly(pts):
    m = set()
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    for y in range(int(min(ys)) - 1, int(max(ys)) + 2):
        for x in range(int(min(xs)) - 1, int(max(xs)) + 2):
            px, py = x + .5, y + .5
            inside = False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]
                xj, yj = pts[j]
                if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi:
                    inside = not inside
                j = i
            if inside:
                m.add((x, y))
    return m


def rect(x0, y0, x1, y1):
    return {(x, y) for x in range(int(x0), int(x1) + 1) for y in range(int(y0), int(y1) + 1)}


def path(pts, r0, r1=None, steps=None):
    """Capsule along a polyline; radius interpolates r0 -> r1."""
    r1 = r0 if r1 is None else r1
    segs = list(zip(pts[:-1], pts[1:]))
    total = sum(math.dist(a, b) for a, b in segs) or 1
    m = set()
    acc = 0
    for a, b in segs:
        L = math.dist(a, b)
        n = max(2, int(L * 3))
        for i in range(n + 1):
            t = i / n
            x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            r = r0 + (r1 - r0) * ((acc + L * t) / total)
            m |= circle(x, y, max(0.5, r))
        acc += L
    return m


def bezier(p0, p1, p2, n=24):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]


def ring(cx, cy, rx, ry, thick=1.0, rot=0.0):
    return ellipse(cx, cy, rx, ry, rot) - ellipse(cx, cy, max(.1, rx - thick), max(.1, ry - thick), rot)


def mirror(m, axis):
    """Mirror a mask across vertical line x = axis (pixel-space, e.g. 15.5 for a 32 wide canvas)."""
    return {(int(round(2 * axis - x)), y) for x, y in m}


def translate(m, dx, dy):
    return {(x + dx, y + dy) for x, y in m}


def line_px(x0, y0, x1, y1):
    pts = []
    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(n + 1):
        t = i / max(1, n)
        pts.append((int(round(x0 + (x1 - x0) * t)), int(round(y0 + (y1 - y0) * t))))
    return set(pts)


# ------------------------------------------------------------------ canvas
class Canvas:
    def __init__(self, w, h, ox=0, oy=0):
        """ox/oy: offset applied to all model coordinates (lets a pose use headroom above y=0)."""
        self.w, self.h = w, h
        self.ox, self.oy = ox, oy
        self.px = {}       # (x,y) -> rgba
        self.owner = {}    # (x,y) -> part id

        self._pid = 0

    def inb(self, p):
        return 0 <= p[0] < self.w and 0 <= p[1] < self.h

    def part(self, mask, rmp, style="bevel", depth=2, base=None, light=(-1, -1), selout=True,
             stripes=None, sphere=None, bias=(0, 0), clip=None, shade_dark=1):
        """Paint a mask with banded shading.
        style: 'bevel' (edge-lit), 'sphere' (normal-lit, needs sphere=(cx,cy,rx,ry)), 'flat'.
        stripes: (fn(x,y)->ramp index into list, [ramps]) to alternate materials (e.g. nemes cloth).
        bias: (bx, by) adds a linear tone slope across the mask (e.g. darker toward the bottom)."""
        if clip is not None:
            mask = mask & clip
        ox, oy = self.ox, self.oy
        mask = {(x + ox, y + oy) for x, y in mask}
        mask = {p for p in mask if self.inb(p)}
        if not mask:
            return mask
        self._pid += 1
        pid = self._pid
        n = len(rmp)
        base = (n - 2) if base is None else base
        xs = [p[0] for p in mask]
        ys = [p[1] for p in mask]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        lx, ly = light
        out = {}
        for (x, y) in mask:
            if style == "flat":
                s = 0.0
            elif style == "sphere":
                cx, cy, rx, ry = sphere
                nx, ny = (x - ox + .5 - cx) / rx, (y - oy + .5 - cy) / ry
                nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
                L = (-0.55, -0.6, 0.58)
                d = nx * L[0] + ny * L[1] + nz * L[2]
                s = (d - 0.45) * 3.2
            else:
                s = 0.0
                w = [1.0, 0.55, 0.3][:depth]
                for k, wk in enumerate(w, 1):
                    if (x + lx * k, y) not in mask: s += wk
                    if (x, y + ly * k) not in mask: s += wk
                    if (x - lx * k, y) not in mask: s -= wk * shade_dark
                    if (x, y - ly * k) not in mask: s -= wk * shade_dark
            if bias != (0, 0):
                fx = (x - x0) / max(1, x1 - x0) - .5
                fy = (y - y0) / max(1, y1 - y0) - .5
                s += -(bias[0] * fx + bias[1] * fy)
            idx = max(0, min(n - 1, base + int(round(s))))
            r = rmp
            if stripes:
                fn, ramps = stripes
                r = ramps[int(fn(x - ox, y - oy)) % len(ramps)]
            out[(x, y)] = (idx, r)
        # selective outline where this part overlaps earlier parts
        for (x, y), (idx, r) in out.items():
            if selout:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    q = (x + dx, y + dy)
                    if q not in mask and q in self.px:
                        idx = 0 if (dx, dy) in ((1, 0), (0, 1)) else min(idx, 1)
                        break
            self.px[(x, y)] = r[idx]
            self.owner[(x, y)] = pid
        return mask

    def paint(self, mask, color):
        for p in mask:
            p = (p[0] + self.ox, p[1] + self.oy)
            if self.inb(p):
                self.px[p] = color if isinstance(color, tuple) else rgba(color)

    def erase(self, mask):
        for p in mask:
            self.px.pop((p[0] + self.ox, p[1] + self.oy), None)

    def stamp(self, grid, x, y, pal, flip=False):
        """Hand-drawn detail. grid rows of chars; '.' skipped; pal maps char -> hex/rgba."""
        for j, row in enumerate(grid):
            if flip:
                row = row[::-1]
            for i, ch in enumerate(row):
                if ch == "." or ch == " ":
                    continue
                c = pal[ch]
                p = (x + i + self.ox, y + j + self.oy)
                if self.inb(p):
                    self.px[p] = rgba(c) if isinstance(c, str) else c

    def glow(self, mask, color, alpha=0.5):
        """Tint existing pixels toward a colour (for magic light on surfaces)."""
        c = rgba(color) if isinstance(color, str) else color
        for p in mask:
            p = (p[0] + self.ox, p[1] + self.oy)
            if p in self.px:
                self.px[p] = mix(self.px[p], c, alpha)[:3] + (self.px[p][3],)

    def mask(self):
        return set(self.px)

    def image(self):
        img = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        pix = img.load()
        for (x, y), c in self.px.items():
            if self.inb((x, y)):
                pix[x, y] = c
        return img


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    return t * t * (3 - 2 * t)


def catmull(pts, n=8):
    """Smooth curve through control points (Catmull-Rom)."""
    if len(pts) < 3:
        return list(pts)
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
                                    (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(pts[-1])
    return out


def lerp_pts(a, b, t):
    return [(lerp(p[0], q[0], t), lerp(p[1], q[1], t)) for p, q in zip(a, b)]


def serpent(c, spine, radius, body_ramp, belly_ramp, spike_ramp=None, spike_every=3, spike_len=2.4,
            belly_side=1, pattern=None, start_spike=0.15, end_spike=0.9, spike_scale=None, belly_base=2):
    """Draw a serpent along a smooth spine. radius(t) gives thickness for t in 0..1 (tail -> head).
    The body is shaded as one surface (no banding); where a later coil crosses an earlier one, a dark
    contour is cast on the coil behind. Belly scales sit on the underside; crystal spikes on the back."""
    pts = catmull(spine, 10)
    N = len(pts)
    owner = {}
    belly = {}
    spikes = []
    ox, oy = c.ox, c.oy
    for j, (x, y) in enumerate(pts):
        t = j / (N - 1)
        r = radius(t)
        ci = j // 4
        for p in circle(x, y, r):
            owner[p] = ci
        a = pts[max(0, j - 1)]
        b = pts[min(N - 1, j + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L * belly_side, tx / L * belly_side   # consistent side: no flipping
        for p in circle(x + nx * r * 0.55, y + ny * r * 0.55, r * 0.5):
            belly[p] = ci
        if spike_ramp and j % spike_every == 0 and start_spike < t < end_spike:
            sl = spike_len * (spike_scale(t) if spike_scale else 1.0)
            spikes.append((ci, (x - nx * r * 0.75, y - ny * r * 0.75), (-nx, -ny), sl))
    U = set(owner)
    c.part(U, body_ramp, depth=2, stripes=pattern, selout=False)
    bm = {p for p, ci in belly.items() if owner.get(p) == ci}
    c.part(bm, belly_ramp, depth=1, selout=False, clip=U, base=belly_base)
    # contour where a front coil overlaps a coil further back
    dark = body_ramp[0]
    for (x, y), ci in owner.items():
        for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)):
            q = (x + dx, y + dy)
            cj = owner.get(q)
            if cj is not None and ci - cj > 3:
                c.px[(q[0] + ox, q[1] + oy)] = dark
    if spike_ramp:
        for ci, (x, y), (dx, dy), sl in spikes:
            tip = (x + dx * sl - dy * 0.9, y + dy * sl + dx * 0.9)
            base1 = (x - dy * 1.3, y + dx * 1.3)
            base2 = (x + dy * 1.3, y - dx * 1.3)
            m = poly([base1, tip, base2]) | {(int(round(tip[0])), int(round(tip[1])))}
            m = {p for p in m if owner.get(p, -1) <= ci + 2}
            c.part(m, spike_ramp, depth=1)
    return pts
