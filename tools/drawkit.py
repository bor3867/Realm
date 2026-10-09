"""A tiny procedural canvas for char-grid pixel art (any size).

Every primitive is hard-edged (no anti-aliasing). `done()` adds the 1px outline
and returns the grid as strings, ready for pixlib.render / buildkit.
"""
import math

from pixlib import outline


class Cv:
    def __init__(self, w=16, h=16):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]

    def p(self, x, y, ch):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = ch

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < self.w and 0 <= y < self.h else '.'

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.p(x, y, ch)

    def ell(self, cx, cy, rx, ry, ch, only=None):
        for y in range(self.h):
            for x in range(self.w):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and (only is None or self.g[y][x] in only):
                    self.g[y][x] = ch

    def ring(self, cx, cy, rx, ry, ch, t=1.0):
        for y in range(self.h):
            for x in range(self.w):
                d = math.hypot((x - cx) / rx, (y - cy) / ry)
                if 1 - t / max(rx, ry) < d <= 1.0:
                    self.g[y][x] = ch

    def ln(self, x0, y0, x1, y1, ch):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.p(x0, y0, ch)
            if x0 == x1 and y0 == y1:
                return
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def trap(self, y0, y1, xl0, xr0, xl1, xr1, ch):
        """filled trapezoid between rows y0..y1, edges interpolated"""
        for y in range(int(y0), int(y1) + 1):
            t = 0 if y1 == y0 else (y - y0) / (y1 - y0)
            self.rect(round(xl0 + (xl1 - xl0) * t), y, round(xr0 + (xr1 - xr0) * t), y, ch)

    def stamp(self, grid, x, y, recolor=None):
        for j, row in enumerate(grid):
            for i, ch in enumerate(row):
                if ch != '.':
                    self.p(x + i, y + j, (recolor or {}).get(ch, ch))

    def recolor(self, m):
        self.g = [[m.get(ch, ch) for ch in r] for r in self.g]

    def done(self, late=()):
        outline(self.g)
        for x, y, ch in late:
            self.p(x, y, ch)
        return [''.join(r) for r in self.g]


def flip(grid):
    return [r[::-1] for r in grid]


def shift(grid, dx):
    """move a finished frame sideways, keeping its width"""
    w = len(grid[0])
    out = []
    for r in grid:
        r = ('.' * dx + r)[:w] if dx >= 0 else (r[-dx:] + '.' * -dx)
        out.append(r)
    return out
