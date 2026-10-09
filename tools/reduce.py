"""RotMG-style art reduction: halve a sprite sheet's pixel density (16px art -> 8px art, each new pixel
stored doubled so frame sizes and engine coordinates stay the same), and strip the baked outline so the
game's own thin outline (render.js spr()) can draw it instead.

    py tools/reduce.py <sheet.png> <frameW> <frameH> [out.png]

Rules, per frame:
  1. the baked outline goes: dark pixels that touch the transparent outside are cleared (repeatedly, once per ring)
  2. 2x2 blocks collapse to one art pixel: at least 2 coloured pixels -> the most common colour
     (ties go to the more saturated / brighter one, so eyes and glows survive); 1 bright accent pixel also survives
  3. the block grid's phase (0/1 in x and y) is chosen per sheet row to keep the most of the silhouette
"""
import struct
import sys
import zlib
from collections import Counter

from pixlib import write_png


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    pos, idat, w = 8, b'', 0
    while pos < len(data):
        n, typ = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', body[:10])
            assert depth == 8 and ctype in (2, 6), (depth, ctype)
            bpp = 4 if ctype == 6 else 3
        elif typ == b'IDAT':
            idat += body
        pos += 12 + n
    raw = zlib.decompress(idat)
    stride = w * bpp
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append([tuple(line[x:x + bpp]) + ((255,) if bpp == 3 else ()) for x in range(0, stride, bpp)])
        prev = line
    return rows


T = (0, 0, 0, 0)
lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
sat = lambda c: max(c[:3]) - min(c[:3])


def strip_outline(fr, dark=70, rings=1):
    H, W = len(fr), len(fr[0])
    g = [r[:] for r in fr]
    for _ in range(rings):
        kill = []
        for y in range(H):
            for x in range(W):
                c = g[y][x]
                if c[3] == 0 or lum(c) > dark:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < W and 0 <= ny < H) or g[ny][nx][3] == 0:
                        kill.append((x, y)); break
        for x, y in kill:
            g[y][x] = T
    return g


def collapse(fr, ox, oy):
    H, W = len(fr), len(fr[0])
    out = []
    for by in range(0, H, 2):
        row = []
        for bx in range(0, W, 2):
            px = []
            for dy in (0, 1):
                for dx in (0, 1):
                    x, y = bx + dx - ox, by + dy - oy
                    if 0 <= x < W and 0 <= y < H and fr[y][x][3] > 0:
                        px.append(fr[y][x][:3])
            if len(px) >= 2:
                cnt = Counter(px)
                best = max(cnt.items(), key=lambda kv: (kv[1], sat(kv[0]) + lum(kv[0]) * 0.5))[0]
                row.append(best + (255,))
            elif len(px) == 1 and (sat(px[0]) > 120 or lum(px[0]) > 200):
                row.append(px[0] + (255,))            # a lone glowing pixel (an eye, a spark) survives
            else:
                row.append(T)
        out.append(row)
    return out


def double(small):
    out = []
    for r in small:
        big = [c for c in r for _ in (0, 1)]
        out += [big, list(big)]
    return out


def reduce_frame(fr, ox, oy):
    return double(collapse(strip_outline(fr), ox, oy))


def score(fr, ox, oy):
    s = collapse(strip_outline(fr), ox, oy)
    return sum(1 for r in s for c in r if c[3])


def reduce_sheet(px, fw, fh):
    H, W = len(px), len(px[0])
    out = [[T] * W for _ in range(H)]
    for ry in range(0, H, fh):
        frames = [[r[cx:cx + fw] for r in px[ry:ry + fh]] for cx in range(0, W, fw)]
        best = max(((ox, oy) for ox in (0, 1) for oy in (0, 1)), key=lambda o: sum(score(f, *o) for f in frames[:4]))
        for k, f in enumerate(frames):
            if not any(c[3] for r in f for c in r):
                continue
            nf = reduce_frame(f, *best)
            for y in range(fh):
                for x in range(fw):
                    out[ry + y][k * fw + x] = nf[y][x]
    return out


if __name__ == '__main__':
    src, fw, fh = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    dst = sys.argv[4] if len(sys.argv) > 4 else src.replace('.png', '_r.png')
    write_png(dst, reduce_sheet(read_png(src), fw, fh))
    print('wrote', dst)
