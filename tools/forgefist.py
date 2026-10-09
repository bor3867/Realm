"""THE FORGEFIST - Brawler class.

A runaway forge-thrall whose right arm was fused into the furnace-gauntlet of a
dead smith-god. The gauntlet is the furnace; he is its fuel. A chimney grafted
onto his left shoulder vents whatever is burning inside him.

All frames 16x16, pivot = (8, 15) bottom-center between the boots.
Screen 'front' = character facing down (toward camera).
"""
from pixlib import compose, flip, check

PAL = {
    'o': '#1E0F14',  # outline - soot black
    'k': '#6B2318',  # oxidised copper dark
    'i': '#B4472A',  # copper
    'I': '#F0915A',  # copper highlight
    'e': '#D8341A',  # ember deep
    'E': '#FF8A1F',  # ember
    'y': '#FFE45C',  # ember hot
    'r': '#2E2433',  # soot cloth dark
    'R': '#4E3D58',  # soot cloth
    'f': '#F2E6C2',  # bone-fur light
    'F': '#B39A6A',  # fur shade
}

HOT = {'I': 'y', 'i': 'E', 'k': 'e'}          # white-hot gauntlet (ability)
COOL = {'y': 'E', 'E': 'e'}                   # vents cooling (recovery)
COLD = {'y': 'k', 'E': 'i', 'e': 'k', 'R': 'r'}  # fire gone out (death)
DARKEYE = {'y': 'k', 'E': 'k'}

# ---------------------------------------------------------------- parts
HEAD_F = [
    ".ooo.",
    "oIIio",
    "oEyyo",
    "okkko",
]
HEAD_B = [
    ".ooo.",
    "oIIio",
    "oiiio",
    "okkko",
]
HEAD_S = [  # facing right, visor slit leaks light past the outline
    ".ooo.",
    "oIIio",
    "okiyy",
    "okkko",
]
CHIM = [
    "ooooo",
    "oyEyo",
    "okIko",
    "okiko",
    "oeiko",
    "okiko",
    ".ooo.",
]
CHIM_H = [  # fallen over (death)
    ".ooooo.",
    "oiiiikk",
    ".ooooo.",
]
COLLAR_F = [
    "oofffffo.",
    "offFffFfo",
    ".oFFoFFo.",
]
COLLAR_FLARE = [  # bristles up during the ability
    "f.f.f.f.f",
    "offfffffo",
    "offFffFfo",
    ".oFFoFFo.",
]
COLLAR_S = [
    ".offffo",
    "ofFfFfo",
    ".oFFFo.",
]
TORSO_F = [
    "oRRRRro",
    "orRRRro",
    "okkyEko",
    ".oRrRo.",
]
TORSO_B = [
    "oRkRkRo",
    "orRkRro",
    "okkkkko",
    ".oRrRo.",
]
TORSO_S = [
    "oRRro",
    "oRRro",
    "okyko",
    ".oro.",
]
ARM = [  # the small, ordinary left arm - crimson-wrapped
    "Ro",
    "Ro",
    "Fo",
]
ARM_UP = [
    "Fo",
    "Ro",
    "Ro",
]
# The furnace gauntlet - the whole point of the character.
GAUNT_F = [
    "..oooo..",
    ".oiIIio.",
    "oiIIIiko",
    "oIiiiiko",
    "oyEyEyEo",
    "okkkkkko",
    "oIioIiko",
    ".oooooo.",
]
GAUNT_B = [  # back of the hand: vents on the plates, no knuckle glow
    "..oooo..",
    ".oiIIio.",
    "okiIIIio",
    "okiiiiIo",
    "oyEyEyEo",
    "okiiiiio",
    "okkkkkko",
    ".oooooo.",
]
GAUNT_S = [  # side: knuckles face right
    "..ooo...",
    ".oiIIo..",
    "oiIIiio.",
    "oIiiiiko",
    "oyEyEyIo",
    "okkkkkoo",
    "okkkkkIo",
    ".oooooo.",
]
PUNCH_F = [  # foreshortened fist rushing at the camera
    ".oooooo.",
    "oiIIIIio",
    "oyEyEyEo",
    "oIiIiIko",
    "oEyEyEyo",
    ".oooooo.",
]
PUNCH_S = [  # fully extended, forearm + fist, knuckles forward
    "....ooooo.",
    "ooooiIIiko",
    "kiiIIiiEyo",
    "ooookiiyEo",
    "....oooooo",
]
PUNCH_B = flip(PUNCH_F[::-1])  # fist driven upward/away
PUNCH_B = [r.replace('y', 'i').replace('E', 'k') if n < 3 else r for n, r in enumerate(PUNCH_B)]

# legs: 7 wide, stamped at (5, 13); feet never leave row 15 except a lifted step
L_N = ["okkokko", "okkokko", "ooo.ooo"]
L_A = ["okkokko", "okkoooo", "ooo...."]   # screen-left boot planted, right lifted
L_B = ["okkokko", "ooookko", "....ooo"]   # mirror
L_W = ["okkokko", "okk.kko", "oo...oo"]   # wide brace
L_KNEEL = ["ooo.ooo"]
L_SN = ["..okko.", "..okko.", "..oooo."]  # side neutral
L_SA = [".oikko.", "oii.kko", "oo...oo"]  # side stride, near leg (light) forward
L_SB = [".okiio.", "okk.iio", "oo...oo"]  # side stride, near leg back

for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)

SPARK = ["y"]
EMBER = ["E"]
PUFF1 = ["yE"]
PUFF2 = [".e", "E."]
BLAST = ["y.y", ".E.", "EyE"]


# ---------------------------------------------------------------- rigs
def front(by=0, legs=L_N, legs_y=13, g=(0, 0), gpart=GAUNT_F, grc=None, g_top=False,
          head=HEAD_F, h=(0, 0), hrc=None, arm=ARM, arm_dy=0, chim=(0, 0), crc=None,
          collar=COLLAR_F, collar_dy=0, extras=()):
    L = [(CHIM, 10 + chim[0], by + 1 + chim[1], crc),
         (legs, 5, legs_y),
         (TORSO_F, 5, by + 10)]
    gl = (gpart, g[0], 8 + g[1], grc)
    if not g_top:
        L.append(gl)
    L += [(arm, 12, by + 10 + arm_dy),
          (collar, 4, by + 7 + collar_dy - (len(collar) - 3)),
          (head, 6 + h[0], by + 4 + h[1], hrc)]
    if g_top:
        L.append(gl)
    L += list(extras)
    return compose(L)


def back(by=0, legs=L_N, legs_y=13, g=(0, 0), gpart=GAUNT_B, grc=None, g_top=False,
         h=(0, 0), arm=ARM, arm_dy=0, extras=()):
    L = [(legs, 5, legs_y),
         (TORSO_B, 5, by + 10),
         (flip(arm), 3, by + 10 + arm_dy)]
    gl = (flip(gpart), 8 + g[0], 8 + g[1], grc)
    if not g_top:
        L.append(gl)
    L += [(flip(COLLAR_F), 3, by + 7),
          (HEAD_B, 6 + h[0], by + 4 + h[1]),
          (flip(CHIM), 1, by + 1)]  # chimney seen on the back, in front of collar
    if g_top:
        L.append(gl)
    L += list(extras)
    return compose(L)


def side(by=0, legs=L_SN, g=(0, 0), gpart=GAUNT_S, grc=None, g_behind=False,
         h=(0, 0), hrc=None, arm_dy=0, extras=(), pre=()):
    """Facing RIGHT. Gauntlet is the near-side arm, so it's drawn on top."""
    L = list(pre)
    L += [(CHIM, 3, by + 1),
          (ARM, 5, by + 10 + arm_dy),     # far arm, behind torso
          (legs, 5, 13)]
    gl = (gpart, 6 + g[0], 9 + g[1], grc)
    if g_behind:
        L.append(gl)
    L += [(TORSO_S, 6, by + 10),
          (COLLAR_S, 5, by + 7),
          (HEAD_S, 7 + h[0], by + 4 + h[1], hrc)]
    if not g_behind:
        L.append(gl)
    L += list(extras)
    return L


def right(**kw):
    return compose(side(**kw))


def left(**kw):
    """Facing LEFT: mirror the rig, but the gauntlet is now the FAR arm, so
    it is drawn behind the body instead of naively mirrored on top."""
    kw = dict(kw)
    kw['g_behind'] = not kw.get('g_behind', False)
    if kw['g_behind'] and kw.get('gpart', GAUNT_S) is GAUNT_S:
        gx, gy = kw.get('g', (0, 0))
        kw['g'] = (gx + 3, gy)   # pushed toward the facing so it peeks past the chest
    return [list(reversed(r)) for r in compose(side(**kw))]


# ---------------------------------------------------------------- frames
def frames():
    F = {}
    # ---- FRONT
    F['front_idle'] = [
        front(),
        front(by=1, gpart=GAUNT_F, grc={'y': 'E', 'E': 'y'}, arm_dy=0,
              extras=[(PUFF1, 12, 0)]),
    ]
    F['front_walk'] = [
        front(by=0, legs=L_A, g=(-1, 0), arm_dy=-1, extras=[(EMBER, 13, 0)]),
        front(by=1, legs=L_N, g=(0, 0), extras=[(SPARK, 0, 15), (SPARK, 6, 14)]),
        front(by=0, legs=L_B, g=(0, -1), arm_dy=1, extras=[(EMBER, 12, 0)]),
        front(by=-1, legs=L_N, g=(0, -1), extras=[(PUFF2, 12, -1)]),
    ]
    # ---- RIGHT
    F['right_idle'] = [
        right(),
        right(by=1, g=(0, 0), grc={'y': 'E', 'E': 'y'}, extras=[(PUFF1, 4, 0)]),
    ]
    F['right_walk'] = [
        right(by=0, legs=L_SA, g=(1, 0), arm_dy=-1, extras=[(EMBER, 5, 0)]),
        right(by=1, legs=L_SN, g=(0, 0), extras=[(SPARK, 13, 15)]),
        right(by=0, legs=L_SB, g=(-1, -1), arm_dy=1, extras=[(EMBER, 4, 0)]),
        right(by=-1, legs=L_SN, g=(0, -1), extras=[(PUFF2, 4, -1)]),
    ]
    # ---- BACK
    F['back_idle'] = [
        back(),
        back(by=1, grc={'y': 'E'}, extras=[(PUFF1, 2, 0)]),
    ]
    F['back_walk'] = [
        back(by=0, legs=L_B, g=(1, 0), arm_dy=-1, extras=[(EMBER, 2, 0)]),
        back(by=1, legs=L_N, extras=[(SPARK, 15, 15)]),
        back(by=0, legs=L_A, g=(0, -1), arm_dy=1, extras=[(EMBER, 3, 0)]),
        back(by=-1, legs=L_N, g=(0, -1), extras=[(PUFF2, 2, -1)]),
    ]

    # ---- ATTACK (each shot = one punch that throws an ember bolt)
    F['front_attack'] = [
        # anticipation: rears back, fist hauled up beside the head, glowing
        front(by=-1, legs=L_W, g=(0, -6), grc={'E': 'y'}, g_top=True,
              arm=ARM_UP, arm_dy=-1, h=(1, 0), extras=[(PUFF1, 12, -1)]),
        # contact: lunges down, fist slams toward the camera, burst
        front(by=1, legs=L_W, g=(1, 4), gpart=PUNCH_F, g_top=True, h=(0, 1),
              extras=[(SPARK, 0, 14), (SPARK, 10, 15), (EMBER, 9, 12),
                      (SPARK, 0, 10), (BLAST, 11, -1)]),
        # recovery: fist back down, vents cooling, chimney exhales
        front(by=0, legs=L_W, g=(0, 0), grc=COOL,
              extras=[(PUFF2, 12, -1), (["e"], 14, 0)]),
    ]
    F['right_attack'] = [
        right(by=-1, legs=L_SB, g=(-5, -4), g_behind=True, grc={'E': 'y'},
              h=(-1, 0)),
        right(by=1, legs=L_SA, g=(0, -1), gpart=PUNCH_S, h=(1, 0),
              extras=[(SPARK, 15, 8), (EMBER, 15, 12), (SPARK, 14, 13), (BLAST, 4, -1)]),
        right(by=0, legs=L_SN, g=(1, 0), grc=COOL, extras=[(PUFF2, 4, -1)]),
    ]
    F['back_attack'] = [
        back(by=1, legs=L_W, g=(0, 1), grc={'y': 'E'}),           # wind-up: crouch
        back(by=-1, legs=L_W, g=(-2, -8), gpart=PUNCH_B, g_top=True,
             h=(0, 1), extras=[(SPARK, 15, 0), (SPARK, 6, 0), (EMBER, 15, 3)]),
        back(by=0, legs=L_W, g=(0, -1), grc=COOL, extras=[(PUFF2, 2, -1)]),
    ]

    # ---- ABILITY: BELLOWS BREAK - overheat, raise, slam, vent
    F['ability'] = [
        front(by=1, legs=L_W, grc={'E': 'y', 'k': 'e'},
              extras=[(["yy"], 12, 1)]),                                       # S0 crouch, stoke
        front(by=0, legs=L_W, g=(0, -5), grc=HOT, g_top=True, arm=ARM_UP,
              collar=COLLAR_FLARE, extras=[(["y", "E", "E"], 13, -1), (["y"], 12, 0)]),  # S1 chimney erupts
        front(by=-1, legs=L_N, g=(4, -9), grc=HOT, g_top=True, arm=ARM_UP, arm_dy=-1,
              collar=COLLAR_FLARE, extras=[(SPARK, 1, 4), (SPARK, 14, 5), (EMBER, 2, 9),
                                           (["E", "y"], 12, -1)]),            # S2 overhead
        front(by=2, legs=L_KNEEL, legs_y=15, g=(4, 2), gpart=PUNCH_F, grc=HOT, g_top=True,
              extras=[(["yE.Ey"], 0, 15), (["Ey"], 14, 15), (SPARK, 0, 12),
                      (SPARK, 15, 12), (EMBER, 1, 9), (EMBER, 14, 9), (SPARK, 15, 15)]),  # S3 slam
        front(by=0, legs=L_W, grc=COOL,
              extras=[(["F.F"], 11, 0), (["e"], 13, 0), (["F"], 0, 7)]),       # S4 vent steam
    ]

    # ---- HIT (posture recoil, not a tint)
    F['hit'] = [
        front(by=-1, legs=L_A, g=(-1, -2), arm=ARM_UP, h=(1, -1), hrc=DARKEYE,
              chim=(1, 0)),
        right(by=-1, legs=L_SB, g=(-2, -2), h=(-1, -1), hrc=DARKEYE),
        left(by=-1, legs=L_SB, g=(-2, -2), h=(-1, -1), hrc=DARKEYE),
        back(by=-1, legs=L_B, g=(1, -2), h=(-1, 1)),
    ]

    # ---- DEATH: the furnace goes out; the body was only ever its fuel
    F['death'] = [
        front(by=1, g=(0, 0), h=(-1, 1), hrc={'y': 'e', 'E': 'k'}, chim=(1, 1)),   # stagger
        front(by=3, legs=L_KNEEL, legs_y=15, g=(0, 0), grc={'y': 'E'}, h=(-1, 1),
              hrc=DARKEYE, chim=(1, 2), crc=COLD),                                 # knees go
        compose([(CHIM_H, 9, 13, COLD),
                 (L_KNEEL, 5, 15),
                 (TORSO_F, 5, 12, COLD),
                 (GAUNT_F, 0, 8, {'y': 'e', 'E': 'e'}),
                 (COLLAR_F, 4, 10),
                 (HEAD_F, 9, 9, DARKEYE)]),                                       # collapse
        compose([(CHIM_H, 9, 13, COLD),
                 (TORSO_F, 5, 13, COLD),
                 (GAUNT_F, 0, 8, COLD),
                 (COLLAR_F, 4, 12),
                 (HEAD_F, 10, 11, DARKEYE),
                 (["E"], 8, 9), (["e"], 4, 12)]),                                 # pile, last ember
        compose([(CHIM_H, 9, 13, COLD),
                 (TORSO_F, 5, 13, COLD),
                 (GAUNT_F, 0, 8, COLD),
                 (COLLAR_F, 4, 12),
                 (HEAD_F, 10, 11, DARKEYE),
                 (["y"], 8, 4)]),                                                 # ember rises away
    ]

    # derive left-facing from the rig (gauntlet becomes the far arm)
    def as_left(fn_kwargs_list):
        return [left(**kw) for kw in fn_kwargs_list]

    F['left_idle'] = as_left([{}, dict(by=1, grc={'y': 'E', 'E': 'y'}, extras=[(PUFF1, 4, 0)])])
    F['left_walk'] = as_left([
        dict(by=0, legs=L_SA, g=(1, 0), arm_dy=-1, extras=[(EMBER, 5, 0)]),
        dict(by=1, legs=L_SN),
        dict(by=0, legs=L_SB, g=(-1, -1), arm_dy=1, extras=[(EMBER, 4, 0)]),
        dict(by=-1, legs=L_SN, g=(0, -1), extras=[(PUFF2, 4, -1)]),
    ])
    F['left_attack'] = as_left([
        dict(by=-1, legs=L_SB, g=(-5, -4), g_behind=False, grc={'E': 'y'}, h=(-1, 0)),
        dict(by=1, legs=L_SA, g=(0, -1), gpart=PUNCH_S, g_behind=True, h=(1, 0),
             extras=[(SPARK, 15, 8), (EMBER, 15, 12), (SPARK, 14, 13), (BLAST, 4, -1)]),
        dict(by=0, legs=L_SN, g=(1, 0), grc=COOL, extras=[(PUFF2, 4, -1)]),
    ])
    return F


# Sheet layout: (row label, [animation keys concatenated across the row])
LAYOUT = [
    ('front', ['front_idle', 'front_walk']),
    ('right', ['right_idle', 'right_walk']),
    ('left', ['left_idle', 'left_walk']),
    ('back', ['back_idle', 'back_walk']),
    ('attack_fr', ['front_attack', 'right_attack']),
    ('attack_lb', ['left_attack', 'back_attack']),
    ('ability', ['ability']),
    ('hit', ['hit']),
    ('death', ['death']),
]
