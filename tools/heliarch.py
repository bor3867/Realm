"""THE HELIARCH - Priest class, candidate A.

The last priest of a sun that died. He did not mourn it; he took what was left.
A jagged sun-disc is bolted to his spine like the back of a throne, and it
still burns. His face is a gold plate with one vertical slit of noon light,
and his vestments hang in a rigid cathedral triangle that never touches the
ground. He doesn't heal you. He decides you are not allowed to die.

All frames 16x16, pivot = (8, 15). He levitates: the hem rides 1-2px above a
ground sigil at row 15. Side frames face RIGHT and are mirror-safe.
"""
from pixlib import compose, flip, check

PAL = {
    'o': '#2B1218',  # outline - wine-bronze black
    'b': '#6E4A22',  # bronze (back of the disc)
    'g': '#C98A22',  # sun-gold dark
    'G': '#F2C14E',  # sun-gold
    'Y': '#FFEB8F',  # radiance
    'W': '#FFFDF0',  # blinding core (sparingly)
    'v': '#EDE3CF',  # ivory vestment
    'V': '#B9A78C',  # ivory shade
    'r': '#6A1028',  # wine
    'R': '#B0213F',  # crimson scripture
}
BRIGHT = {'g': 'G', 'G': 'Y'}
BLAZE = {'o': 'Y', 'g': 'Y', 'G': 'W'}
DIM = {'W': 'G', 'Y': 'G'}
DEAD = {'W': 'g', 'Y': 'g', 'G': 'g', 'R': 'r'}

# --------------------------------------------------------------- the sun-disc
HALO = [
    "....ooooo....",
    "..ooGGGGGoo..",
    ".oGGgggggGGo.",
    ".oGgo...ogGo.",
    "oGgo.....ogGo",
    "oGgo.....ogGo",
    "oGgo.....ogGo",
    "oGgo.....ogGo",
    "oGgo.....ogGo",
    ".oGgo...ogGo.",
    ".oGGgggggGGo.",
    "..ooGGGGGoo..",
    "....ooooo....",
]
# where the travelling glint sits on the ring (relative to HALO)
GLINT = {
    'tl': [(4, 1), (2, 2), (3, 1)],
    'tr': [(8, 1), (10, 2), (9, 1)],
    'r': [(11, 5), (11, 6), (11, 7)],
    'l': [(1, 4), (1, 5), (1, 6)],
}
HALO_SMALL = [
    "..ooooo..",
    ".oYYYYYo.",
    "oYGoooGYo",
    "oYo...oYo",
    "oYo...oYo",
    "oYo...oYo",
    "oYGoooGYo",
    ".oYYYYYo.",
    "..ooooo..",
]
BIG_RING = [
    ".....oooooo.....",
    "...ooYGGGGYoo...",
    "..oGGo....oGGo..",
    ".oGo........oGo.",
    ".oGo........oGo.",
    "oGo..........oGo",
    "oYo..........oYo",
    "oGo..........oGo",
    "oGo..........oGo",
    "oYo..........oYo",
    "oGo..........oGo",
    ".oGo........oGo.",
    ".oGo........oGo.",
    "..oGGo....oGGo..",
    "...ooYGGGGYoo...",
    ".....oooooo.....",
]
HALO_S = (["..ooooo..", ".oGGGGGo.", "oGgo.ogGo"] + ["oGo...oGo"] * 7
          + ["oGgo.ogGo", ".oGGGGGo.", "..ooooo.."])

# --------------------------------------------------------------- body
HEAD_F = [".Y.", "oGo", "oWo", "oWo", "oro", "oro"]  # a severe slit of noon
HEAD_B = [".Y.", "oGo", "oro", "oRo", "oro", "oro"]
HEAD_S = [".Y.", "oGo", "orW", "orW", "oro", "oro"]
SHOULDERS = ["oYGorrrogGo"]
SHOULDERS_S = ["oYrGo"]
ROBE = [
    "..ovvWvvo..",
    "..ovRvvVo..",
    ".ovvRvvvVo.",
    ".ovvRvvvVo.",
    "ovvvRvvvvVo",
    "oGgGRGgGgGo",
    ".ooooooooo.",
]
ROBE_B = [
    "..ovvRvvo..",
    "..ovvRvVo..",
    ".ovvvRvvVo.",
    ".ovvvRvvVo.",
    "ovvvvRvvvVo",
    "oGgGgRgGgGo",
    ".ooooooooo.",
]
ROBE_S = [
    "...ovWo..",
    "...ovRVo.",
    "..ovvRvo.",
    ".ovvvRvVo",
    "ovvvvRvVo",
    "oGgGgRgGo",
    ".oooooooo",
]
ROBE_FLARE = [
    "....ovvWvvo....",
    "...ovvRvvvVo...",
    "..ovvvRvvvvVo..",
    ".ovvvvRvvvvvVo.",
    "ovvvvvRvvvvvvVo",
    "oGgGgGRGgGgGgGo",
    ".ooooooooooooo.",
]
BANNER = ["Ro", "GR", "Rr", "RG", "rR", "R.", "r."]
BANNER_W = ["Ro.", "GR.", "RrR", ".RG", ".rR", "..R", "..r"]
ARM_UP = ["oWo..", "oGvo.", "..ovo"]
ARM_OUT = ["WGvvo", ".ooo."]
SIGIL = ["g.G.g"]
SIGIL_BIG = ["G.Y.G.Y.G"]
VEST_PILE = ["..ooRoooo..", ".ovvRvvvVo.", "ovvvRvvvvVo", "oGgGRGgGgGo"]
MASK_FLAT = ["oGWGo"]
SHARDS = [["oG", "Go"], ["GG"], ["oGo"], ["G", "o"], ["oY"], ["Go", ".G"]]

for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)


def halo(glint='tl', part=None):
    """Ring with the travelling glint painted on."""
    rows = [list(r) for r in (part or HALO)]
    for x, y in GLINT[glint]:
        if rows[y][x] != '.':
            rows[y][x] = 'Y'
    return [''.join(r) for r in rows]


def quarters(part, spread):
    """Split a ring into 4 quadrant pieces pushed outward by `spread` px."""
    h, w = len(part), len(part[0])
    cx, cy = w // 2, h // 2
    out = []
    for qx, qy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        q = [''.join(ch if ((x < cx) == (qx < 0) and (y < cy) == (qy < 0)) else '.'
                     for x, ch in enumerate(row)) for y, row in enumerate(part)]
        out.append((q, qx * spread, qy * spread))
    return out


def rays(hx=0, hy=0, rc=None, long=False):
    L = [(["YG"], 0 + hx, 6 + hy, rc), (["Y"], 15 + hx, 6 + hy, rc),
         (["G"], 13 + hx, 1 + hy, rc), (["Y"], 14 + hx, 0 + hy, rc),
         (["G"], 1 + hx, 10 + hy, rc), (["Y"], 0 + hx, 11 + hy, rc),
         (["G"], 14 + hx, 10 + hy, rc), (["Y"], 15 + hx, 11 + hy, rc),
         (["g"], 2 + hx, 1 + hy, rc)]  # top-left ray snapped off
    if long:
        L += [(["Y"], 0, 5 + hy), (["Y"], 15, 5 + hy), (["Y"], 15, 7 + hy), (["Y"], 0, 7 + hy)]
    return L


# --------------------------------------------------------------- rigs
def front_layers(by=0, hy=0, hx=0, glint='tl', hrc=None, halo_part=None, ray=True,
                 robe=None, robe_x=3, rrc=None, head=None, hd=(0, 0), headrc=None,
                 banner=BANNER, bn=(0, 0), sigil=SIGIL, back=False, extras_under=()):
    head = head or (HEAD_B if back else HEAD_F)
    robe = robe or (ROBE_B if back else ROBE)
    L = []
    if halo_part is not False:
        hp = halo_part or halo(glint)
        if back:
            hrc = dict({'g': 'b'}, **(hrc or {}))
        L.append((hp, 2 + hx, hy, hrc))
        if ray:
            L += rays(hx, hy, hrc)
    L += list(extras_under)
    if sigil:
        L.append((sigil, 8 - len(sigil[0]) // 2, 15))
    L += [(robe, robe_x, by + 8, rrc),
          (SHOULDERS, 3, by + 7),
          (banner, 12 + bn[0], by + 7 + bn[1]),
          (head, 7 + hd[0], by + 1 + hd[1], headrc)]
    return L


def front(extras=(), **kw):
    return compose(front_layers(**kw) + list(extras))


def back(extras=(), **kw):
    g = compose(front_layers(back=True, **kw) + list(extras))
    g = [list(reversed(r)) for r in g]
    return [['.'] + r[:-1] for r in g]   # re-centre on the same pivot pixel


def side(by=0, hy=0, hx=0, hrc=None, robe=ROBE_S, rrc=None, hd=(0, 0), headrc=None,
         banner=BANNER_W, bn=(0, 0), sigil=SIGIL, lean=0, extras=()):
    L = [(HALO_S, 0 + hx, hy, hrc),
         (flip(banner), 1 + bn[0], by + 7 + bn[1])]
    if sigil:
        L.append((sigil, 6, 15))
    L += [(robe, 4 + lean, by + 8, rrc),
          (SHOULDERS_S, 6 + lean, by + 7),
          (HEAD_S, 7 + lean + hd[0], by + 1 + hd[1], headrc)]
    return compose(L + list(extras))


# --------------------------------------------------------------- frames
def frames():
    F = {}
    # He never walks. The vestments drift, the disc turns, the sigil follows.
    F['front_idle'] = [
        front(by=0, hy=0, glint='tl'),
        front(by=-1, hy=1, glint='tr', banner=BANNER_W, sigil=["G.Y.G"]),
    ]
    F['front_walk'] = [
        front(by=0, glint='tl', robe_x=2, banner=BANNER_W, bn=(0, 0)),
        front(by=-1, hy=1, glint='tr', sigil=["G.g.G"]),
        front(by=0, glint='r', robe_x=4, bn=(1, 0)),
        front(by=-1, hy=0, glint='l', banner=BANNER_W, bn=(1, 0), sigil=["g.G.g"]),
    ]
    F['side_idle'] = [
        side(by=0),
        side(by=-1, hy=1, hrc={'g': 'G'}, bn=(0, 1), sigil=["G.Y.G"]),
    ]
    F['side_walk'] = [
        side(by=0, lean=1, bn=(-1, 0)),
        side(by=-1, hy=1, lean=1, bn=(-1, 1), sigil=["G.g.G"]),
        side(by=0, lean=0, banner=BANNER, bn=(0, 0), hrc={'g': 'G'}),
        side(by=-1, hy=0, lean=0, bn=(-1, 1), sigil=["g.G.g"]),
    ]
    F['back_idle'] = [
        back(by=0, glint='tl'),
        back(by=-1, hy=1, glint='tr', banner=BANNER_W, sigil=["G.Y.G"]),
    ]
    F['back_walk'] = [
        back(by=0, glint='tl', robe_x=2, banner=BANNER_W),
        back(by=-1, hy=1, glint='tr', sigil=["G.g.G"]),
        back(by=0, glint='r', robe_x=4, bn=(1, 0)),
        back(by=-1, glint='l', banner=BANNER_W, bn=(1, 0), sigil=["g.G.g"]),
    ]

    # ATTACK - "Sentence": the disc flares, the core opens, a lance of noon
    # is driven straight down the line of fire.
    beam = [(["YWY"], 7, y) for y in range(8, 14)] + [(["YWWWY"], 6, 14), (["Y.W.Y"], 6, 15)]
    F['attack'] = [
        front(by=-1, hrc=BRIGHT, glint='tl', banner=BANNER_W,
              extras=[(["YWY"], 7, 7), (["Y"], 8, 6)] + rays(long=True)),
        front(by=-2, hrc=BLAZE, ray=True, banner=BANNER_W, bn=(1, 0), sigil=False,
              extras=beam + rays(long=True) + [(["Y"], 1, 1), (["Y"], 8, 0)]),
        front(by=0, hrc={'G': 'Y'}, glint='tr',
              extras=[(["Y"], 8, 13), (["G"], 6, 15), (["Y"], 10, 14), (["g"], 3, 11)]),
    ]

    # ABILITY - "Noon Absolute": the disc contracts, splits, and is thrown open
    # to the edges of the world; the vestments flare into a full cathedral and
    # everything inside the ring is his.
    F['ability'] = [
        # S0 the sun gathers: disc contracts, core whitens, he sinks
        front(by=1, halo_part=HALO_SMALL, hx=2, ray=False, sigil=False,
              extras=[(["Y"], 7, 9), (["Y"], 9, 9), (["W"], 8, 10)]),
        # S1 the disc cracks into four and pushes outward, he rises
        compose([(q, 2 + dx, 0 + dy, BRIGHT) for q, dx, dy in quarters(halo('tl'), 1)]
                + front_layers(by=-1, halo_part=False, banner=BANNER_W, sigil=["G.Y.G"])
                + [(ARM_UP, 0, 3), (flip(ARM_UP), 11, 3)]),
        # S2 thrown open: ring to the frame edge, cathedral flare, arms raised
        compose([(BIG_RING, 0, 0, BRIGHT)]
                + front_layers(by=-2, halo_part=False, robe=ROBE_FLARE, robe_x=1,
                               banner=BANNER_W, bn=(2, 0), sigil=SIGIL_BIG)
                + [(ARM_UP, 0, 2), (flip(ARM_UP), 11, 2), (["Y"], 8, 0), (["W"], 8, 1)]),
        # S3 NOON: the ring detonates white, eight spokes of judgement
        compose([(BIG_RING, 0, 0, BLAZE)]
                + front_layers(by=-2, halo_part=False, robe=ROBE_FLARE, robe_x=1,
                               rrc={'v': 'Y', 'V': 'G'}, banner=BANNER_W, bn=(2, 0),
                               sigil=["Y.W.Y.W.Y"])
                + [(ARM_OUT, 0, 6), (flip(ARM_OUT), 11, 6),
                   (["W"], 8, 0), (["Y"], 2, 2), (["Y"], 3, 3), (["Y"], 13, 2), (["Y"], 12, 3),
                   (["Y"], 2, 13), (["Y"], 13, 13), (["W"], 8, 9)]),
        # S4 the sun reassembles behind him, light falls like ash
        compose([(q, 2 + dx, 0 + dy) for q, dx, dy in quarters(halo('r'), 1)]
                + front_layers(by=0, halo_part=False, sigil=SIGIL)
                + [(["Y"], 1, 12), (["G"], 14, 10), (["Y"], 4, 2), (["g"], 12, 1)]),
    ]

    # HIT - disc knocked off its axis, slit goes dark, he is pushed down to the sigil
    F['hit'] = [
        front(by=1, hx=-1, hy=1, ray=False, hd=(1, 0), headrc={'W': 'r'},
              rrc={'W': 'G'}, banner=BANNER_W, bn=(1, -1), sigil=False),
    ]

    # DEATH - the disc cracks, shatters, the light leaves upward, and the
    # vestments fall empty to the floor
    cracked = [r[:] for r in halo('tl')]
    cracked = [''.join('.' if (x >= 8 and y <= 4) else ch for x, ch in enumerate(row))
               for y, row in enumerate(cracked)]
    F['death'] = [
        front(by=1, halo_part=cracked, ray=False, headrc=DIM, rrc=DIM, sigil=False,
              extras=[(["oG", "Go"], 12, 0), (["G"], 15, 2)]),
        compose(front_layers(by=2, halo_part=False, hd=(-1, 1), headrc=DIM, sigil=False,
                             banner=BANNER_W)
                + [(SHARDS[0], 1, 2), (SHARDS[1], 12, 1), (SHARDS[2], 0, 8), (SHARDS[3], 14, 6),
                   (SHARDS[4], 3, 11), (SHARDS[5], 12, 10),
                   (["Y"], 8, 6), (["W"], 8, 5), (["Y"], 8, 3)]),
        compose([(VEST_PILE, 3, 12), (MASK_FLAT, 6, 11, DIM),
                 (["oG"], 1, 14), (["Go"], 13, 14), (["G"], 2, 12), (["oGo"], 11, 13),
                 (["W"], 8, 0), (["Y"], 8, 1), (["Y"], 8, 3), (["Y"], 8, 4), (["Y"], 8, 6),
                 (["Y"], 7, 2), (["Y"], 9, 2)]),
        compose([(VEST_PILE, 3, 12, DEAD), (MASK_FLAT, 6, 11, DEAD),
                 (["og"], 1, 14), (["go"], 13, 14), (["g"], 2, 12), (["ogo"], 11, 13),
                 (["Y"], 8, 1)]),
    ]
    return F


LAYOUT = [
    ['front_idle', 'front_walk'],
    ['side_idle', 'side_walk'],
    ['back_idle', 'back_walk'],
    ['attack', 'hit'],
    ['ability'],
    ['death'],
]
