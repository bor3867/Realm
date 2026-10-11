"""Astral Observatory: a brass observatory adrift in the void. Accent: magenta nebula + brass gold."""
import math
from pixlib import recolor, edit, shift

PAL = {
    "k": "#140f1c", "w": "#ffffff",
    "n": "#241a52", "N": "#110c2c", "u": "#3e2e88", "U": "#6050c0",
    "y": "#f4c64a", "Y": "#a8742a", "z": "#6a4418",
    "s": "#fff6d8",
    "m": "#ff5ad0", "M": "#a02a8a",
    "c": "#7af4ff", "C": "#2a9ad8",
    "a": "#ece8f6", "A": "#b8b2d0", "b": "#857fa4",
    "o": "#ff9a3a", "O": "#b0501a",
}

STAR_EYE = {
    "float1": [
        "........",
        "..aaaa..",
        ".aammaA.",
        "yamkkmAy",
        "yaammAAy",
        ".yyYYyy.",
        "........",
        "...s....",
    ],
    "float2": [
        "....s...",
        "........",
        "..aaaa..",
        ".aammaA.",
        "yamkkmAy",
        "yaammAAy",
        ".yyYYyy.",
        "........",
    ],
    "attack": [
        "m......m",
        "..aaaa..",
        ".ammmmA.",
        "wamwwmAw",
        "wammmmAw",
        ".wwyywy.",
        "........",
        "m......m",
    ],
}

VOID_ACOLYTE = {
    "walk1": [
        "...uu...",
        "..uUUu..",
        ".uyyyyu.",
        ".ukyykU.",
        "nuUyyUun",
        "muUUsUum",
        ".uUsUUu.",
        ".nnuunn.",
    ],
    "walk2": [
        "...uu...",
        "..uUUu..",
        ".uyyyyu.",
        ".ukyykU.",
        ".uUyyUu.",
        "nuUUsUun",
        "muUsUUum",
        "..nuunn.",
    ],
    "attack": [
        "w..uu..w",
        "m.uUUu.m",
        "nuyyyyun",
        ".umyymU.",
        ".uUyyUu.",
        ".uUUsUu.",
        ".uUsUUu.",
        ".nnuunn.",
    ],
}

ORRERY_DRONE = {
    "hover1": [
        "..y..y..",
        "..YyyY..",
        ".YyyyyY.",
        "zYycCyYz",
        ".YyCcyY.",
        "zYyyyyYz",
        "..YzzY..",
        "...mM...",
    ],
    "hover2": [
        "..y..y..",
        "..YyyY..",
        "zYyyyyYz",
        ".YycCyY.",
        "zYyCcyYz",
        ".YyyyyY.",
        "..YzzY..",
        "...Mm...",
    ],
    "attack": [
        ".y....y.",
        "..YyyY..",
        "zYyyyyYz",
        "YyywwyyY",
        "YyywwyyY",
        "zYyyyyYz",
        "..YzzY..",
        "..mMMm..",
    ],
}

CONSTELLATION_STALKER = {  # side view, faces right
    "prowl1": [
        "........",
        "s.....nn",
        "n....nUc",
        "nUUsUnnn",
        ".nnnnsnN",
        ".nN..nN.",
        "n......n",
        "N......N",
    ],
    "prowl2": [
        "s.....nn",
        "n....nUc",
        "nUUsUnnn",
        ".nnnnsnN",
        "..nNnN..",
        "..n..n..",
        "..N..N..",
        "........",
    ],
    "attack": [
        "s.....nn",
        "n...nnUc",
        ".nUUsUnn",
        "..nnnsnw",
        "..nn...w",
        ".n..nnw.",
        "n.......",
        "N.......",
    ],
}


# ------------------------------------------------------------- boss: The Grand Orrery (procedural, 16x16)
def _orrery(phase, attack=0):
    W = 16
    g = [["."] * W for _ in range(W)]
    cx = cy = 7.5

    def put(x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < W:
            g[y][x] = c

    def ellipse(rx, ry, col_back, col_front, layer):
        for i in range(160):
            t = 2 * math.pi * i / 160
            x, y = cx + rx * math.cos(t), cy + ry * math.sin(t)
            front = math.sin(t) >= 0
            if layer == "back" and not front:
                put(x, y, col_back)
            if layer == "front" and front:
                put(x, y, col_front)

    def in_sphere(x, y, r=5.1):
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

    # inclined ring (back half) and equator ring (back half)
    def ring(rx, ry, rot, back_col, front_col, layer):
        cr, sr = math.cos(rot), math.sin(rot)
        for i in range(200):
            t = 2 * math.pi * i / 200
            ex, ey = rx * math.cos(t), ry * math.sin(t)
            x, y = cx + ex * cr - ey * sr, cy + ex * sr + ey * cr
            front = math.sin(t) >= 0
            if (layer == "back") != front:
                put(x, y, back_col if layer == "back" else front_col)
    ring(7.2, 1.9, -0.75, "Y", "y", "back")
    ellipse(7.4, 2.2, "Y", "y", "back")
    # planets behind the sphere
    planets = [(0.0, "c", 2), (2.2, "o", 2), (4.1, "m", 1)]
    pos = []
    for off, col, size in planets:
        t = phase + off
        px, py = cx + 7.2 * math.cos(t), cy + 2.2 * math.sin(t)
        pos.append((px, py, col, size, math.sin(t) >= 0))
    for px, py, col, size, front in pos:
        if not front:
            for dx in range(size):
                for dy in range(size):
                    put(px + dx - size / 2 + .5, py + dy - size / 2 + .5, col)
    # the void sphere with its eye
    iris = 2.9 + 0.5 * attack
    for y in range(W):
        for x in range(W):
            X, Y = x + .5 - 8 + cx, y + .5 - 8 + cy
            if in_sphere(x, y):
                d = math.hypot(x - cx, y - cy)
                lx, ly = (x - cx) / 5.1, (y - cy) / 5.1
                c = "n"
                if lx + ly > 0.55:
                    c = "N"
                if lx + ly < -0.75:
                    c = "u"
                if d <= iris:
                    c = "m" if d > iris - 1.0 else "M"
                if d <= 0.8:
                    c = "w" if attack else "k"
                g[y][x] = c
    g[5][5] = "U" if not attack else "w"
    # front half of the equator ring, then front planets
    ellipse(7.4, 2.4, "Y", "y", "front")
    for px, py, col, size, front in pos:
        if front:
            for dx in range(size):
                for dy in range(size):
                    put(px + dx - size / 2 + .5, py + dy - size / 2 + .5, col)
    if attack == 2:
        for (x, y) in [(0, 0), (15, 0), (0, 15), (15, 15), (1, 7), (14, 8), (7, 1), (8, 14)]:
            g[y][x] = "m"
        for (x, y) in [(2, 2), (13, 2), (2, 13), (13, 13)]:
            g[y][x] = "s"
    return ["".join(r) for r in g]


ORRERY_IDLE = [_orrery(i * math.pi / 2) for i in range(4)]
ORRERY_ATTACK = [_orrery(0.4, 1), _orrery(0.8, 2)]

TILES = {
    "void1": [
        "NNNNNNNN",
        "NNNNNsNN",
        "NNnNNNNN",
        "NNNNNNNN",
        "NsNNNNnN",
        "NNNNNNNN",
        "NNNNuNNN",
        "NNNNNNNN",
    ],
    "void2": [
        "NNNNNNNN",
        "NNNNNuNN",
        "NNnNNNNN",
        "NNNNNNNN",
        "NuNNNNnN",
        "NNNNNNNs",
        "NNNNsNNN",
        "NNNNNNNN",
    ],
    "void3": [
        "NNNNNNNN",
        "NNNNNNNN",
        "NNsNNNNN",
        "NNNNNNNN",
        "NNNNNNnN",
        "NNNNNNNu",
        "NNNNuNNN",
        "sNNNNNNN",
    ],
    "marble": [
        "aaaaAaab",
        "aAaaaaab",
        "aaaabaab",
        "aaaaaAab",
        "aabaaaab",
        "aaaaaaab",
        "Aaaaabab",
        "bbbbbbbY",
    ],
    "brass_grate": [
        "YyYYYyYY",
        "yzzyzzyz",
        "YzzYzzYz",
        "YyYYYyYY",
        "yzzyzzyz",
        "YzzYzzYz",
        "YyYYYyYY",
        "zzzzzzzz",
    ],
    "wall_top": [
        "uuuuuuuu",
        "unnnnnnu",
        "unUnnnnu",
        "unnnnnnu",
        "unnnnUnu",
        "unnnnnnu",
        "uuuuuuuu",
        "yYyYyYyY",
    ],
    "wall_side": [
        "nnnunnnu",
        "nnnunnnu",
        "uuuuuuuu",
        "nunnnunn",
        "nunsnunn",
        "uuuuuuuu",
        "nnnunnnu",
        "NNNNNNNN",
    ],
}

DECOR = {
    "telescope": [[  # 8x16
        "......aA",
        ".....yYa",
        "....yYY.",
        "...yzY..",
        "..yYYz..",
        ".yYzz...",
        "zYY.....",
        ".z.Y....",
        "...z....",
        "...Y....",
        "..zYz...",
        ".z.Y.z..",
        ".z.Y.z..",
        "z..Y..z.",
        "z..z..z.",
        "Y..Y..Y.",
    ]],
    "brass_pillar": [[  # 8x16
        "yyyyyyyy",
        "YyyyyyyY",
        ".zYYYYz.",
        "..aaAb..",
        "..aaAb..",
        "..aAAb..",
        "..aaAb..",
        "..aaAb..",
        "..aAAb..",
        "..aaAb..",
        "..aaAb..",
        "..aAAb..",
        "..aaAb..",
        ".zYYYYz.",
        "YyyyyyyY",
        "yyyyyyyy",
    ]],
    "star_globe": [[
        "..uUUu..",
        ".uNnsNU.",
        "uNsNNnNu",
        "nNNNsNNn",
        ".nsNNNn.",
        "..nNNn..",
        "..zYYz..",
        ".YyyyyY.",
    ], [
        "..uUUu..",
        ".uNNnsU.",
        "uNNsNNnu",
        "nsNNNsNn",
        ".nNsNNn.",
        "..nNNn..",
        "..zYYz..",
        ".YyyyyY.",
    ], [
        "..uUUu..",
        ".usNNnU.",
        "unNNsNNu",
        "nNsNNNsn",
        ".nNNsNn.",
        "..nNNn..",
        "..zYYz..",
        ".YyyyyY.",
    ]],
    "floating_crystal": [[
        "...m....",
        "..mMm...",
        "..mwMm..",
        ".mmMMM..",
        "..MMM...",
        "...M....",
        "........",
        "..MmmM..",
    ], [
        "........",
        "...m....",
        "..mMm...",
        "..mwMm..",
        ".mmMMM..",
        "..MMM...",
        "...M....",
        "..MMMM..",
    ]],
}
DECALS = {  # flat floor overlays, not outlined
    "rune_circle": [[
        "..mMMm..",
        ".M....M.",
        "m..s...m",
        "M.s.s..M",
        "M..s.s.M",
        "m...s..m",
        ".M....M.",
        "..mMMm..",
    ], [
        "..MmmM..",
        ".m....m.",
        "M...s..M",
        "m.s.s..m",
        "m..s.s.m",
        "M..s...M",
        ".m....m.",
        "..MmmM..",
    ]],
}
