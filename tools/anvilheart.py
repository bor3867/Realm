"""THE ANVILHEART - Forge Knight, candidate A.

An oath-smith of the drowned forge-temples who swore to carry the temple anvil
until the god who first struck it returns. He has carried it so long it became
his helm. No face: just the hardy-hole slit glowing under the horn. His tongs
are longer than he is and never let go of the billet. When he opens the forge,
the anvil splits like a jaw and the fire inside him stands up.

All frames 16x16, pivot = (8, 15). Horn points to his right (screen-left in
the front view). Side frames face RIGHT; tongs are carried ahead of the body,
so mirroring for LEFT is geometrically valid.
"""
from pixlib import compose, flip, check

PAL = {
    'o': '#140F17',  # outline - warm black
    'k': '#3B3A4C',  # black iron
    'i': '#5C5F78',  # iron
    'I': '#A6ACC4',  # struck-face polish
    'm': '#8C2A12',  # molten deep
    'M': '#F2641A',  # molten orange
    'Y': '#FFC94A',  # molten hot
    'W': '#FFF6C8',  # white heat (sparingly)
    'c': '#4A1622',  # oxblood cloth dark
    'C': '#7A2433',  # oxblood cloth
}
HOT = {'I': 'W', 'i': 'Y', 'k': 'M'}
VEINS = {'k': 'm'}
DARK = {'Y': 'k', 'M': 'k', 'W': 'i'}
COOLED = {'W': 'Y', 'Y': 'M'}
COLD = {'W': 'i', 'Y': 'm', 'M': 'm'}

# --------------------------------------------------------------- front parts
ANV_TOP_F = [
    "...ooooooooooo",
    ".ooIIIIIIIIIIo",
    "oiiiiiiiiiikko",
    ".oooiiiiiikko.",
]
ANV_BASE_F = [
    "....okYMkko...",
    "...okkkkkkko..",
]
ANV_BASE_B = [
    "....okkkkko...",
    "...okkmkkkko..",
]
# the forge open: anvil split into two jaws, horn up-left, heel up-right
JAW_L = [
    "o......",
    "oIo....",
    ".oIIo..",
    ".oiiIo.",
    "..oiiko",
    "...okko",
]
JAW_R = [
    "....oo",
    "...oIo",
    "..oIio",
    ".oiiko",
    "okkko.",
    "oko...",
]
PILLAR = [".Y.", "YWY", "MWM", "YWY", "MYM", ".M."]
THROAT = ["....oYWWYo....", "...oMYWWYMo.."]   # replaces the base when split
THROAT = ["....oYWWYo....", "...oMYWWYMo..."]

TORSO_F = ["okiIiko", "oikMkio", "okkMkko", "okkkkko"]
TORSO_B = ["okiIiko", "okkmkko", "okkmkko", "okkkkko"]
TABARD = ["CC", "Cc", "Cc", "cC", "Cc", ".c"]

# legs: 7 wide x 6 tall, always stamped at (5, 10); feet on row 15
L_N = [".ok.ko."] * 5 + ["ooo.ooo"]
L_A = [".ok.ko.", ".ok.ko.", ".ok.ko.", ".ok.ooo", ".ok....", "ooo...."]
L_B = [".ok.ko.", ".ok.ko.", ".ok.ko.", "ooo.ko.", "....ko.", "....ooo"]
L_W = [".ok.ko.", ".ok.ko.", "ok...ko", "ok...ko", "ok...ko", "oo...oo"]
L_BUCKLE = [".ok.ko.", "ok...ko", "oo...oo"]

TONGS = [  # vertical, billet clamped at the bottom
    "..o..",
    ".oio.",
    ".oio.",
    ".oio.",
    ".oio.",
    ".oIo.",
    "oi.io",
    "oMYMo",
    "oYWYo",
    "omYmo",
    ".ooo.",
]
TONGS_H = [  # lying / swung flat, billet on the left
    ".ooo.......",
    "oMYMooooooo",
    "oYWYiiiIiio",
    "omYmooooooo",
    ".ooo.......",
]
TONGS_D = [  # diagonal slam, billet bottom-left, handles up-right
    "......oo",
    ".....oio",
    "....oio.",
    "...oio..",
    "oooio...",
    "oYWo....",
    "oMYo....",
    "oooo....",
]
ARM = ["k", "k"]

# --------------------------------------------------------------- side parts (facing right)
ANV_S = [  # end-on, horn tip pointing at the camera
    ".ooooooooo.",
    "oIIIIIIIIIo",
    "oiiiiiiiiko",
    ".ooiIIiiko.",
    "...okkYMo..",
    "..okkkkko..",
]
TORSO_S = ["okiko", "okMko", "okkko", "okkko"]
SL_N = ["..oko.."] * 5 + ["..oooo."]
SL_A = ["..oko..", "..okio.", ".ok.io.", ".ok..io", "ok...io", "oo...oo"]
SL_B = ["..oko..", "..oiko.", ".oi.ko.", ".oi..ko", "oi...ko", "oo...oo"]
TAB_S = ["C", "C", "c", "C", "c"]

for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)

SPARK = ["Y"]
EMBER = ["M"]


def clampy(y, part, floor=16):
    return min(y, floor - len(part))


# --------------------------------------------------------------- rigs
def front_layers(by=0, legs=L_N, ax=0, ay=0, arc=None, slit=None, tab=(0, 0),
                 tongs=TONGS, t=(0, 0), trc=None, t_under=False, top=None, base=None,
                 torso=TORSO_F, back=False):
    """Layer list for the front (or, with back=True, pre-mirror back) view."""
    top = top or ANV_TOP_F
    base = base or (ANV_BASE_B if back else ANV_BASE_F)
    tl = (tongs, 11 + t[0], clampy(4 + by + t[1], tongs) if tongs is TONGS else 4 + by + t[1], trc)
    L = [(legs, 5, 10)]
    if t_under:
        L.append(tl)
    L += [(torso, 5, by + 7),
          (TABARD, 7 + tab[0], by + 9 + tab[1]),
          (ARM, 12, by + 7)]
    if not t_under:
        L.append(tl)
    rc_base = dict(arc or {})
    if slit:
        rc_base.update(slit)
    L += [(base, 1 + ax, by + 5 + ay, rc_base or None),
          (top, 1 + ax, by + 1 + ay, arc)]
    return L


def front(extras=(), **kw):
    return compose(front_layers(**kw) + list(extras))


def back(extras=(), **kw):
    """Back view = the front rig with back parts, mirrored, then nudged 1px so
    the feet land on exactly the same pixels as every other view."""
    kw.setdefault('torso', TORSO_B)
    g = compose(front_layers(back=True, **kw) + list(extras))
    g = [list(reversed(r)) for r in g]
    return [['.'] + r[:-1] for r in g]


def side(by=0, legs=SL_N, ax=0, ay=0, arc=None, slit=None, tab=(0, 0),
         tongs=TONGS, t=(0, 0), trc=None, extras=()):
    rc = dict(arc or {})
    if slit:
        rc.update(slit)
    L = [(TAB_S, 5 + tab[0], by + 9 + tab[1]),
         (legs, 5, 10),
         (TORSO_S, 6, by + 7),
         (["kk"], 10, by + 8),
         (tongs, 11 + t[0], clampy(4 + by + t[1], tongs), trc),
         (ANV_S, 3 + ax, by + 1 + ay, rc or None)]
    return compose(L + list(extras))


# --------------------------------------------------------------- frames
def frames():
    F = {}
    BREATH = {'Y': 'M', 'M': 'Y'}
    # FRONT - heavy, top-heavy plod: the anvil rocks on his shoulders
    F['front_idle'] = [
        front(),
        front(by=1, slit=BREATH, trc={'W': 'Y'}, tab=(0, 0)),
    ]
    F['front_walk'] = [
        front(by=0, legs=L_A, ax=-1, tab=(-1, 0), t=(0, 0)),
        front(by=1, legs=L_N, ax=0, tab=(0, 0), extras=[(SPARK, 15, 15), (EMBER, 11, 14)]),
        front(by=0, legs=L_B, ax=1, tab=(1, 0), t=(0, -1)),
        front(by=-1, legs=L_N, ax=0, tab=(0, -1), t=(0, -1)),
    ]
    # SIDE (right)
    F['side_idle'] = [
        side(),
        side(by=1, slit=BREATH, trc={'W': 'Y'}, tab=(-1, 0)),
    ]
    F['side_walk'] = [
        side(by=0, legs=SL_A, ax=1, tab=(-1, 0), t=(1, 0)),
        side(by=1, legs=SL_N, tab=(0, 0), extras=[(SPARK, 15, 15)]),
        side(by=0, legs=SL_B, ax=-1, tab=(-1, -1), t=(0, -1)),
        side(by=-1, legs=SL_N, tab=(0, 0), t=(0, -1)),
    ]
    # BACK
    F['back_idle'] = [
        back(),
        back(by=1, trc={'W': 'Y'}),
    ]
    F['back_walk'] = [
        back(by=0, legs=L_B, ax=-1, tab=(-1, 0)),
        back(by=1, legs=L_N, extras=[(SPARK, 15, 15)]),
        back(by=0, legs=L_A, ax=1, tab=(1, 0), t=(0, -1)),
        back(by=-1, legs=L_N, tab=(0, -1), t=(0, -1)),
    ]

    # ATTACK - "Billet Strike": haul the billet out wide, smash it down,
    # sparks are the projectile spray.
    F['attack'] = [
        front(by=1, legs=L_W, ax=-1, tongs=flip(TONGS_H), t=(-6, 4), trc={'Y': 'W'}),
        front(by=1, legs=L_W, ax=1, ay=1, tongs=TONGS_D, t=(-6, 4), t_under=False,
              extras=[(SPARK, 4, 11), (["W"], 7, 11), (SPARK, 9, 14), (SPARK, 3, 15),
                      (EMBER, 10, 12), (SPARK, 1, 12), (EMBER, 0, 14)]),
        front(by=0, legs=L_W, tongs=TONGS, trc=COOLED,
              extras=[(EMBER, 3, 9), (EMBER, 9, 12), (["m"], 1, 6)]),
    ]

    # FORGE ABILITY - "Open the Oath": the anvil splits into jaws, the fire
    # inside him stands up as a pillar, he feeds it the billet, then slams it
    # shut and the shockwave rings out.
    F['ability'] = [
        # S0 crouch, the anvil's seams light up from inside
        front(by=1, legs=L_W, arc=VEINS, trc={'Y': 'W'}),
        # S1 the anvil cracks open: top lifts, throat glows through the gap
        front(by=0, legs=L_W, top=ANV_TOP_F, ay=-1, arc=VEINS, base=THROAT,
              extras=[(["oMYWYMo"], 5, 4), (SPARK, 1, 5), (SPARK, 14, 5)]),
        # S2 jaws thrown wide, pillar of fire, billet fed into his throat
        compose(front_layers(by=-1, legs=L_N, tongs=TONGS_D[::-1], t=(-6, -2),
                             base=THROAT, top=["."])
                + [(PILLAR, 6, -1), (JAW_L, 0, 0, VEINS), (JAW_R, 10, 0, VEINS),
                   (SPARK, 8, 0), (SPARK, 3, 7), (SPARK, 13, 7)]),
        # S3 SLAM shut - crouch, white-hot anvil, shockwave + ground cracks
        front(by=2, legs=L_W, arc=HOT, trc={'Y': 'W'},
              extras=[(["M.M.M.M.....M.M"], 0, 15), (SPARK, 0, 9), (EMBER, 1, 11),
                      (SPARK, 0, 13), (SPARK, 15, 9), (EMBER, 14, 11), (SPARK, 15, 13),
                      (["W"], 2, 7), (["W"], 13, 7)]),
        # S4 cooling: face still glowing, embers drift off
        front(by=0, legs=L_N, arc={'I': 'Y'}, trc=COOLED,
              extras=[(EMBER, 3, 0), (EMBER, 11, 0), (["m"], 14, 2), (["m"], 7, 0)]),
    ]

    # HIT - anvil knocked askew, slit goes dark, cloth flies, one foot leaves the ground
    F['hit'] = [
        front(by=-1, legs=L_A, ax=1, ay=-1, slit=DARK, tab=(-1, -1), t=(1, -1)),
    ]

    # DEATH - the oath outweighs him: the anvil crushes the knight into the floor
    F['death'] = [
        front(by=1, legs=L_W, ax=-1, ay=1, slit={'Y': 'm', 'M': 'm'}, t=(1, 1)),
        compose([(flip(TONGS_H), 5, 11, COOLED),
                 (L_BUCKLE, 5, 13),
                 (TORSO_F, 5, 10, {'M': 'm'}),
                 (ANV_BASE_F, 0, 8, DARK),
                 (ANV_TOP_F, 0, 4, None)]),
        compose([(flip(TONGS_H), 5, 11, COLD),
                 (TABARD, 2, 11), (["k"], 15, 12),
                 (ANV_BASE_F, 1, 12, DARK),
                 (ANV_TOP_F, 1, 8),
                 (["i.i"], 0, 14), (["i.i"], 13, 14), (["i"], 1, 12), (["i"], 14, 12)]),
        compose([(flip(TONGS_H), 5, 11, COLD),
                 (TABARD, 2, 12, {'C': 'c'}),
                 (ANV_BASE_F, 1, 13, DARK),
                 (ANV_TOP_F, 1, 9), (EMBER, 8, 3)]),
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
