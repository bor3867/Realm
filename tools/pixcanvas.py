# A little pixel canvas for the boss art tools (tools/build_<boss>.py): rectangles, ellipses, lines, a robe-shaped
# trapezoid, and a one-pixel dark outline round whatever was drawn. Rows come out as palette letters ('.' is empty).

N = 48


class Cv:
    def __init__(self, n=N): self.n = n; self.g = [['.'] * n for _ in range(n)]
    def p(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.n and 0 <= y < self.n: self.g[y][x] = c
    def rect(self, x0, y0, x1, y1, c):
        x0, x1 = min(x0, x1), max(x0, x1); y0, y1 = min(y0, y1), max(y0, y1)
        for y in range(int(round(y0)), int(round(y1)) + 1):
            for x in range(int(round(x0)), int(round(x1)) + 1): self.p(x, y, c)
    def ell(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1: self.p(x, y, c)
    def line(self, x0, y0, x1, y1, c, w=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / n; x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            self.rect(x - (w - 1) / 2, y - (w - 1) / 2, x + (w - 1) / 2, y + (w - 1) / 2, c)
    def trap(self, cx, y0, y1, w0, w1, c):                       # a robe: narrow at the top, wide at the hem
        for y in range(int(y0), int(y1) + 1):
            t = (y - y0) / max(1, y1 - y0); w = w0 + (w1 - w0) * t
            self.rect(cx - w / 2, y, cx + w / 2, y, c)
    def outline(self):
        g = self.g; n = self.n; o = [row[:] for row in g]
        for y in range(n):
            for x in range(n):
                if g[y][x] != '.': continue
                if any(0 <= x + dx < n and 0 <= y + dy < n and g[y + dy][x + dx] not in ('.', 'o') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[y][x] = 'o'
        self.g = o
        return self
    def rows(self): return [''.join(r) for r in self.g]
