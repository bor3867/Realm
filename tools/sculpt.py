# A tiny sculpting canvas for monster and boss art (tools/build_throne_kin.py, tools/build_gatekeeper.py): parts are
# shapes (ellipses, polygons, thick lines) each with a material, a ramp of colours from shadow to highlight. Every
# pixel of a part is lit by its own shape's curve (an ellipse as a dome, a polygon or a line bevelled from its edges),
# light from the upper left; a part laid over another is cut from it by a seam of the lower part's shadow, so the forms
# read as forms. Then details go on by hand (p, put) and the outline last. Rows come out as palette keys.
import math

LIGHT = (-0.55, -0.65, 0.52)
_l = math.sqrt(sum(v * v for v in LIGHT)); LIGHT = tuple(v / _l for v in LIGHT)


class Sculpt:
    def __init__(self, w, h=None, ramps=None, amb=0.3):
        self.amb = amb                               # (ambient: how lit a side turned from the light still is)
        self.w, self.h = w, h or w
        self.ramps = ramps or {}                     # material -> [shadow, ..., highlight] palette keys
        self.g = [['.'] * self.w for _ in range(self.h)]
        self.part = [[-1] * self.w for _ in range(self.h)]
        self.n = 0

    def _shade(self, mat, k):                        # k in 0..1: how lit
        R = self.ramps[mat]; return R[max(0, min(len(R) - 1, int(k * len(R) - 1e-9)))]

    def _lay(self, x, y, mat, k):
        if 0 <= x < self.w and 0 <= y < self.h: self.g[y][x] = self._shade(mat, k); self.part[y][x] = self.n

    def _seam(self, mat):                            # where this part lies over another, the one below falls into its shadow
        me = self.n
        for y in range(self.h):
            for x in range(self.w):
                if self.part[y][x] != me: continue
                for dx, dy in ((1, 0), (0, 1), (1, 1)):    # (the light is upper left: the shadow falls right and down)
                    X, Y = x + dx, y + dy
                    if 0 <= X < self.w and 0 <= Y < self.h and 0 <= self.part[Y][X] < me: self.g[Y][X] = self._dark_of(Y, X)

    def _dark_of(self, y, x):
        ch = self.g[y][x]
        for R in self.ramps.values():
            if ch in R: return R[0]
        return ch

    def ell(self, cx, cy, rx, ry, mat, flat=0.0, seam=True):
        """a dome: lit by its curve (flat: 0 round .. 1 evenly lit)"""
        self.n += 1
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                d = nx * nx + ny * ny
                if d > 1: continue
                nz = math.sqrt(max(0.0, 1 - d))
                k = self.amb + (1 - self.amb) * max(0.0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2])
                self._lay(x, y, mat, k * (1 - flat) + 0.6 * flat)
        if seam: self._seam(mat)
        return self

    def poly(self, pts, mat, bevel=2.0, tilt=0.35, seam=True):
        """a plate: lit across it (upper left lighter) and bevelled at its edges"""
        self.n += 1
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        x0, x1, y0, y1 = int(min(xs)) - 1, int(max(xs)) + 1, int(min(ys)) - 1, int(max(ys)) + 1
        def inside(px, py):
            c = False
            for i in range(len(pts)):
                ax, ay = pts[i]; bx, by = pts[i - 1]
                if (ay > py) != (by > py) and px < (bx - ax) * (py - ay) / (by - ay) + ax: c = not c
            return c
        cells = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if inside(x + 0.5, y + 0.5)]
        S = set(cells)
        for x, y in cells:
            ul = ((x - 1, y) not in S) + ((x, y - 1) not in S)
            dr = ((x + 1, y) not in S) + ((x, y + 1) not in S)
            t = ((x - x0) / max(1, x1 - x0) + (y - y0) / max(1, y1 - y0)) / 2
            k = 0.62 - tilt * (t - 0.5)
            if ul: k = 0.95
            if dr: k = 0.12
            self._lay(x, y, mat, k)
        if seam: self._seam(mat)
        return self

    def line(self, x0, y0, x1, y1, mat, w=1.0, seam=True):
        """a limb or a horn or a chain: a tube, lit along its upper-left side"""
        self.n += 1
        L = max(1e-6, math.hypot(x1 - x0, y1 - y0)); ux, uy = (x1 - x0) / L, (y1 - y0) / L; nx, ny = -uy, ux
        if nx * LIGHT[0] + ny * LIGHT[1] < 0: nx, ny = -nx, -ny     # (the side toward the light)
        r = w / 2
        for y in range(int(min(y0, y1) - r) - 1, int(max(y0, y1) + r) + 2):
            for x in range(int(min(x0, x1) - r) - 1, int(max(x0, x1) + r) + 2):
                px, py = x + 0.5 - x0, y + 0.5 - y0
                t = max(0, min(L, px * ux + py * uy)); dx, dy = px - ux * t, py - uy * t
                if dx * dx + dy * dy > r * r + 0.15: continue
                s = (dx * nx + dy * ny) / max(0.5, r)              # -1 shadow side .. 1 lit side
                self._lay(x, y, mat, 0.5 + 0.45 * s)
        if seam: self._seam(mat)
        return self

    def p(self, x, y, ch):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h: self.g[y][x] = ch
        return self

    def put(self, x, y, rows):                       # a hand-drawn stamp ('.' leaves what is there)
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != '.': self.p(x + i, y + j, ch)
        return self

    def outline(self, ch='o', inner=None):
        g = self.g; o = [row[:] for row in g]
        for y in range(self.h):
            for x in range(self.w):
                if g[y][x] != '.': continue
                if any(0 <= x + dx < self.w and 0 <= y + dy < self.h and g[y + dy][x + dx] not in ('.', ch) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = ch
        self.g = o
        return self

    def rows(self): return [''.join(r) for r in self.g]
