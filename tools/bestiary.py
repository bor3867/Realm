"""Realm bestiary - 16x16 enemies, front-facing (enemies always face the camera).

Every enemy row: M0 M1 (move/idle) | T0 (attack tell) | A0 (attack) | D0 D1 D2 (death)
Pivot (8, 15). Design rule: creature + history + mechanic + silhouette hook.
"""
from pixlib import compose, flip, check, blank, line, rows
import candidates as vc
import forge_candidates as fc
import priest_candidates as pc

E = {}   # name -> dict(pal=..., frames=[7 grids], meta=...)


def register(name, pal, frames, **meta):
    assert len(frames) == 7, name
    E[name] = dict(pal=pal, frames=frames, meta=meta)


def split_cols(part, col):
    """-> (left, right) halves of a part, cut before column `col`."""
    L = [r[:col] + '.' * (len(r) - col) for r in part]
    R = ['.' * col + r[col:] for r in part]
    return L, R


# =========================================================== DROWNED SHORE
# BRINE PILGRIM - pilgrims who walked into the sea to reach a drowned shrine.
# The sea answered by giving each of them a clam for a head. Before it fires,
# the shell yawns open and the pearl inside lights up.
BP = {'o': '#102226', 't': '#2B6E6A', 'T': '#5FB3A1', 'b': '#E8DCC0', 'B': '#A89A7C',
      'p': '#FF8FBF', 'P': '#FFE3F0', 'g': '#2F5A3A', 'G': '#4C8550'}
SHELL_TOP = ["...ooooo...", ".oobBbBboo.", "obBbBbBbBbo", "obBbBbBbBbo", "oooooPooooo"]
SHELL_BOT = ["obBbBbBbBbo", ".oobBbBboo.", "...ooooo..."]
BARN = ["tT", "Tt"]
OPEN_GLOW = ["..pPPPPPp..", "...pPPPp..."]
P_ROBE = [".oGGgo.", "oGGgggo", "oGgGggo", "ogGggGo", "oGggGgo", "ogGgggo", ".oGggo."]
P_FEET0, P_FEET1 = [".ob.bo."], [".bo.ob."]
P_PILE = ["..oGGgo..", ".oGgGggo.", "oGgggGggo"]


def brine_pilgrim():
    def body(feet, dx=0, dy=0, arm_dy=0):
        return [(P_ROBE, 4, 8 + dy), (["b", "b", "B"], 3, 9 + arm_dy), (feet, 4, 15)]
    f = [
        compose(body(P_FEET0) + [(SHELL_BOT, 2, 6), (SHELL_TOP, 2, 1), (BARN, 3, 3)]),
        compose(body(P_FEET1, arm_dy=1) + [(SHELL_BOT, 3, 7), (SHELL_TOP, 3, 2), (BARN, 4, 4)]),
        compose(body(P_FEET0) + [(SHELL_BOT, 2, 6), (OPEN_GLOW, 2, 4), (SHELL_TOP, 2, -1), (BARN, 3, 1)]),
        compose(body(P_FEET0, arm_dy=-1) + [(SHELL_BOT, 2, 6), (["oPPPPPPPPPo"], 2, 5),
                                            (SHELL_TOP, 2, 1, {'B': 'P', 'b': 'p'}), (["P"], 0, 4), (["P"], 14, 3)]),
        compose([(P_ROBE, 4, 9), (P_FEET0, 4, 15), (SHELL_BOT, 1, 7), (SHELL_TOP, 4, 1, {'P': 'o'})]),
        compose([(P_PILE, 4, 13), (SHELL_TOP, 0, 11, {'P': 'o'}), (SHELL_BOT, 9, 9)]),
        compose([(P_PILE, 4, 13, {'G': 'g'}), (SHELL_TOP, 0, 12, {'P': 'o', 'b': 'B'}), (["pP"], 13, 14)]),
    ]
    register('brine_pilgrim', BP, f, biome='shore')


# LANTERN JELLY - a drowned lighthouse lantern that learned to swim. Its glass
# still holds the light; the chains became tentacles. Flares, then spits a fan.
LJ = {'o': '#1A1418', 'r': '#6E3320', 'R': '#B5652F', 'c': '#1FCFB8', 'C': '#B8FFF2',
      'k': '#3D2F33', 'K': '#8A7A7E'}
LANTERN = ["...ooo...", "...oKo...", "..ooooo..", ".oRrRrRo.", "orCkCkCro",
           "oRcCkCcRo", "orCkCkCro", ".oRrRrRo.", "..ooooo.."]


def tentacles(phase, spread=0, length=7, y0=9):
    g = blank(16, 16)
    for n, bx in enumerate((5, 8, 11)):
        prev = None
        for k in range(length):
            off = [0, 0, 1, 1, 0, 0, -1, -1][(k + phase + n * 3) % 8]
            sx = (bx - 8) * k * spread // 8
            x, y = bx + off + sx, y0 + k
            if 0 <= x < 16 and y < 16:
                g[y][x] = 'c' if k == length - 1 else 'R'
                if prev is not None and abs(prev - x) > 0 and k > 0:
                    g[y - 1][x] = 'r'          # keep the chain connected
                prev = x
    return rows(g)


def lantern_jelly():
    ring = [(["C"], x, y) for x, y in ((1, 4), (14, 4), (0, 9), (15, 9), (3, 14), (12, 14), (8, 0), (2, 1))]
    f = [
        compose([(tentacles(0), 0, 0), (LANTERN, 3, 0)]),
        compose([(tentacles(2), 0, 1), (LANTERN, 3, 1)]),
        compose([(tentacles(4, spread=2), 0, 0), (LANTERN, 3, 0, {'c': 'C', 'k': 'c'})]),
        compose([(tentacles(1, spread=3), 0, 0), (LANTERN, 3, 0, {'c': 'C', 'k': 'C', 'r': 'R'})] + ring),
        compose([(tentacles(0, length=5), 0, 2), (LANTERN, 3, 2, {'C': 'c'}), (["C"], 2, 3), (["c"], 13, 5)]),
        compose([(tentacles(3, length=3), 0, 6), (LANTERN, 3, 5, {'C': 'k', 'c': 'k'})]),
        compose([(["oooooooo", "rcrcrcrc"], 4, 14), (LANTERN, 3, 6, {'C': 'k', 'c': 'k'}),
                 (["c"], 2, 15), (["C"], 13, 15)]),
    ]
    register('lantern_jelly', LJ, f, biome='shore')


# =========================================================== ASHFEN
# THE BELL-TAKEN - temple guards whose upper bodies grew inside their own
# bronze alarm bells. They shuffle. Before attacking the bell rises and you
# can see the dark inside; then it rings - a full radial ring of sound.
BT = {'o': '#13201E', 'v': '#2E6B55', 'V': '#4FA37E', 'L': '#A6E8C4', 'x': '#0A0B0E',
      'b': '#E6DCC3', 'B': '#9E9278', 'c': '#5EF0FF'}
BELL = ["....ooo....", "....oVo....", "...ooVoo...", "..oVLVVvo..", "..oLVVcvo..",
        ".oVLVVvcvo.", ".oLVVVVvvo.", "oVLVVVVvcvo", "oVVVVcVVvvo", "ooooooooooo"]
MOUTH = [".oxxxxxxxo."]
B_LEG_A = ["...b...b...", "...b...b...", "..oB...Bo.."]
B_LEG_B = ["...b...b...", "..b.....b..", ".oB.....Bo."]
B_LEG_LONG = ["...b...b..."] * 4 + ["..oB...Bo.."]


def bell_taken():
    bl, br = split_cols(BELL, 6)
    f = [
        compose([(B_LEG_A, 2, 13), (MOUTH, 2, 12), (BELL, 2, 2)]),
        compose([(B_LEG_B, 2, 13), (MOUTH, 2, 13), (BELL, 2, 3)]),
        compose([(B_LEG_LONG, 2, 11), (MOUTH, 2, 10), (["..oxcxxco.."], 2, 11), (BELL, 2, 0, {'c': 'L'})]),
        compose([(B_LEG_B, 2, 13), (MOUTH, 2, 13), (BELL, 2, 3, {'c': 'L', 'v': 'V'})]
                + [(["c"], x, y) for x, y in ((0, 6), (15, 6), (1, 3), (14, 3), (0, 10), (15, 10))]
                + [(["c", "c"], 0, 7), (["c", "c"], 15, 7)]),
        compose([(B_LEG_A, 2, 13), (MOUTH, 2, 12), (bl, 1, 2), (br, 3, 2), (["c", "c", "c"], 8, 5)]),
        compose([(["..bB..Bb..."], 2, 14), (bl, -1, 5), (br, 5, 5)]),
        compose([(["..bB..Bb..."], 2, 15), (bl, -2, 6, {'c': 'v'}), (br, 6, 6, {'c': 'v'})]),
    ]
    register('bell_taken', BT, f, biome='fen')


# PEAT SAINT - a bog-martyr who carries his own gravestone on his back so
# no one can bury him again. The rune on the stone wakes before he spits.
PS = {'o': '#151A12', 's': '#5E6470', 'S': '#9AA0AE', 'g': '#4D6B2A', 'G': '#8DB03A',
      'i': '#E8E0C8', 'I': '#B2A88C', 'y': '#D4FF5A', 'm': '#2C3A1E'}
STONE = ["..oooo..", ".oSSSso.", "oSSSSsso", "oSSySsso", "oSyyySso", "oSSySsso",
         "oSSSSsso", "oSsSSsso", "oSSSsSso", "oSSSSsso", "oooooooo"]
STONE_FLAT = ["oooooooooo.", "oSSsSySSsso", "ooooooooooo"]
PS_HEAD = [".ooo.", "oiIio", "oyiyo", ".oio."]
PS_BODY = ["oiIiIo", "oIgiIo", "oiIGio", "oIiigo", "ogIiio", ".oiIo."]
PS_LEGS0, PS_LEGS1 = [".o..o."], ["o..o.."]
PUDDLE = ["..mgGgGgm..", ".mgGgggGgm."]


def peat_saint():
    def saint(dy=0, sx=0, legs=PS_LEGS0, hrc=None, src=None, arm=None):
        L = [(STONE, 7 + sx, 1 + dy, src), (PS_BODY, 3, 9 + dy), (legs, 3, 15), (PS_HEAD, 3, 5 + dy, hrc)]
        if arm:
            L.append(arm)
        return L
    bright = {'S': 'y', 's': 'G'}
    f = [
        compose(saint()),
        compose(saint(dy=1, legs=PS_LEGS1)),
        compose(saint(dy=1, sx=-1, src={'S': 'G'})),
        compose(saint(dy=0, src=bright, arm=(["iIy"], 0, 10)) + [(["y"], 0, 12), (["G"], 1, 8)]),
        compose(saint(dy=2, hrc={'y': 'i'}) + [(PUDDLE, 1, 14)]),
        compose([(STONE, 8, 4), (PS_BODY[:3], 3, 12), (PS_HEAD, 3, 9, {'y': 'g'}), (PUDDLE, 1, 14)]),
        compose([(PUDDLE, 1, 14), (STONE_FLAT, 4, 12, {'y': 's'}), (["y"], 3, 13)]),
    ]
    register('peat_saint', PS, f, biome='fen')


# =========================================================== RUNEHOLT
# FROZEN EXECUTIONER - a headsman frozen mid-swing into a hanging block of
# old ice, axe and all. Only his legs got out. Cracks run through the ice
# before it bursts into shards.
FE = {'o': '#0E1830', 'c': '#2A6FB0', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF',
      'k': '#39475E', 'K': '#8794AC', 'b': '#DCD6C4', 'B': '#9A947F'}
ICE = ["oooooooooo", "oAWAAAaaao", "oAaacccaao", "oAacocoaao", "oaacccccao",
       "oaaacccaao", "oaaacacaao", "oaaaaaaaco", "oaaaaaacco", "oooooooooo"]
CRACKS = ["..W.....", "...W..W.", "....WW..", ".W..W...", "..WW....", "....W..W"]
AXE_HEAD = [".oKKo", "oKKKo", "oKKo."]
E_LEGS0 = ["..b...b..", "..b...b..", ".bB...Bb.", ".o.....o."]
E_LEGS1 = ["..b...b..", ".b.....b.", ".B.....B.", "oo.....oo"]


def axe(x, y):
    return [(AXE_HEAD, x + 9, y - 2), (["k"], x + 9, y + 1), (["k"], x + 8, y + 2), (["k"], x + 7, y + 3),
            (["k"], x + 2, y + 8), (["k"], x + 1, y + 9), (["k"], x, y + 10)]


def frozen_executioner():
    q = [[r[:5] + '.....' for r in ICE[:5]] + ['.' * 10] * 5,
         ['.....' + r[5:] for r in ICE[:5]] + ['.' * 10] * 5,
         ['.' * 10] * 5 + [r[:5] + '.....' for r in ICE[5:]],
         ['.' * 10] * 5 + ['.....' + r[5:] for r in ICE[5:]]]
    f = [
        compose([(E_LEGS0, 3, 12), (ICE, 3, 2)] + axe(3, 2)),
        compose([(E_LEGS1, 3, 12), (ICE, 3, 3)] + axe(3, 3)),
        compose([(E_LEGS0, 3, 12), (ICE, 3, 1), (CRACKS, 4, 3)] + axe(3, 1)),
        compose([(E_LEGS1, 3, 12), (ICE, 3, 2, {'a': 'A', 'c': 'a'}), (CRACKS, 4, 4)] + axe(3, 2)
                + [(["W"], x, y) for x, y in ((0, 2), (15, 4), (1, 12), (14, 11), (7, 0))]),
        compose([(E_LEGS0, 3, 12), (ICE, 3, 2), (CRACKS, 3, 3), (CRACKS, 5, 5)] + axe(3, 2)),
        compose([(["..bB..Bb.."], 3, 14), (q[0], 1, 0), (q[1], 5, 0), (q[2], 1, 5), (q[3], 5, 5),
                 (["W"], 0, 9), (["A"], 15, 6)]),
        compose([(["..bB..Bb.."], 3, 15), (["oAo", "ooo"], 1, 14), (["oaAo"], 11, 14), (["Ao"], 8, 15),
                 (["obbo", "obob"], 6, 12), (["oKKo", "kkk."], 11, 12)]),
    ]
    register('frozen_executioner', FE, f, biome='runeholt')


# CAIRN CRAWLER - a grave marker that went looking for the body it was meant
# for. Six spider legs, a runestone body. Its rune ignites, it crouches, it
# lunges in a straight line.
CC = {'o': '#16122A', 's': '#726D8E', 'S': '#B2ACCA', 'c': '#3BEFFF', 'C': '#CFFFFF',
      'k': '#4A4466', 'K': '#8A82B0'}
SLAB = [".ooo.", "oSSso", "oScso", "oSCso", "oScso", "oSsso", "oSsso", "ooooo"]


def crawler(legs, body_y=3, rc=None, slab=SLAB):
    g = blank(16, 16)
    for (ax, ay), (kx, ky), (fx, fy) in legs:
        line(g, 5, body_y + ay, kx, body_y + ky, 'k')
        line(g, kx, body_y + ky, fx, fy, 'k')
        g[max(0, min(15, body_y + ky))][max(0, min(15, kx))] = 'K'
        # mirrored right leg
        line(g, 10, body_y + ay, 15 - kx, body_y + ky, 'k')
        line(g, 15 - kx, body_y + ky, 15 - fx, fy, 'k')
        g[max(0, min(15, body_y + ky))][max(0, min(15, 15 - kx))] = 'K'
    for y in range(16):
        for x in range(16):
            if g[y][x] == 'k' and y < body_y + 4:
                g[y][x] = 'K'
    from pixlib import outline
    outline(g)
    return compose([(rows(g), 0, 0), (slab, 5, body_y, rc)])


def cairn_crawler():
    walk0 = [((5, 2), (2, 0), (0, 9)), ((5, 4), (1, 5), (1, 13)), ((5, 6), (3, 8), (2, 15))]
    walk1 = [((5, 2), (2, 1), (1, 10)), ((5, 4), (1, 4), (0, 12)), ((5, 6), (2, 8), (3, 15))]
    crouch = [((5, 2), (1, 1), (0, 11)), ((5, 4), (0, 5), (1, 14)), ((5, 6), (2, 8), (3, 15))]
    lunge = [((5, 2), (3, -1), (1, 3)), ((5, 4), (1, 2), (0, 7)), ((5, 6), (2, 7), (1, 11))]
    curl = [((5, 2), (4, 1), (5, 5)), ((5, 4), (3, 4), (4, 7)), ((5, 6), (3, 7), (4, 9))]
    flat = ["oooooooo", "oSScCsso", "oooooooo"]
    f = [
        crawler(walk0, 3),
        crawler(walk1, 4),
        crawler(crouch, 6, {'c': 'C', 's': 'S'}),
        crawler(lunge, 7, {'c': 'C', 'S': 'C'}),
        crawler(curl, 5, {'C': 'c'}),
        crawler(curl, 7, {'C': 's', 'c': 's'}),
        compose([(["k.kk.kk.k"], 3, 15), (flat, 4, 12, {'c': 's', 'C': 's'})]),
    ]
    register('cairn_crawler', CC, f, biome='runeholt')


# =========================================================== GODFALL
# HOLLOW THANE - the headless jarl from the Vanguard trials, demoted to a
# regular horror of Godfall. His chained sword hurls itself at you.
def hollow_thane():
    c = vc
    base = [(c.ROBE, 4, 9), (c.MANTLE, 3, 7)]
    f = c.hollow_thane()[:2] + [
        compose(base + [(c.FLAME_T, 6, 3), (c.CROWN, 5, 0, {'g': 'G'}), (c.SWORD, 12, 0),
                        (c.DOT, 11, 8), (c.DOT, 11, 5)]),
        c.hollow_thane()[2],
        compose(base + [([".p.", "pPp"], 6, 5), (c.CROWN, 6, 2), (c.SWORD, 12, 5)]),
        compose([(c.ROBE[2:], 4, 11), (c.MANTLE, 3, 9), (c.CROWN, 7, 8), (c.SWORD_H, 2, 13)]),
        compose([(["..onNno...", ".onnnnnno.", "oonNNNnnoo"], 3, 13), (c.CROWN, 9, 12, {'G': 'g'}),
                 (c.SWORD_H, 1, 12, {'P': 'm'})]),
    ]
    register('hollow_thane', c.PAL_B, f, biome='godfall')


# CENSER-MAGISTRATE - the priest candidate that judged too much. Elite.
def censer_magistrate():
    p = pc
    body = [(p.BODY_B, 4, 8), (p.HEAD_B, 5, 3)]
    idle, swing = p.censer_magistrate()
    f = [
        idle,
        compose(body + [(p.SHRINE, 0, 1), (["oGo"], 9, 7), (p.CENSER, 10, 8), (["P"], 13, 6)]),
        swing,
        compose(body + [(p.SHRINE, 0, 0, {'P': 'G'}), (["oGo"], 9, 7), (p.CENSER, 10, 9, {'S': 'P'}),
                        (["P.P"], 8, 15), (["p"], 15, 12), (["P"], 13, 6), (["P"], 3, 10)]),
        compose([(p.BODY_B, 4, 9), (p.HEAD_B, 5, 5, {'P': 's'}), (p.SHRINE, 0, 2, {'P': 's', 'p': 's'}),
                 (p.CENSER, 11, 9)]),
        compose([(p.BODY_B[3:], 4, 12), (p.HEAD_B, 5, 9, {'P': 's'}), (p.SHRINE, -1, 8, {'P': 's', 'p': 's'}),
                 (p.CENSER, 11, 9)]),
        compose([(["..oRrRRo..", ".oRrRrRRo.", "oSLSLSLSLo"], 3, 13), (p.SHRINE[1:], 0, 9, {'P': 's', 'p': 's'}),
                 (p.CENSER[2:], 11, 11, {'P': 'p'}), (["p"], 13, 9)]),
    ]
    register('censer_magistrate', p.PAL_B, f, biome='godfall', elite=True)


# =========================================================== THE DROWNED FORGE (dungeon)
def bellows_bound():
    c = fc
    def bb(dy=0, rake_dy=0, b=None, nozzle_dy=0, extra=()):
        return compose([(c.RAKE, 13, 2 + rake_dy), (c.LEGS_C, 5, 13),
                        (b or c.BELLOWS, 2, 4 + dy), (c.NOZZLE, 4, 0 + dy + nozzle_dy)] + list(extra))
    flat = [".ooooooooo.", "opPpPpPpPpo", "okkkkkkkkko"]
    f = [
        bb(),
        bb(dy=1, rake_dy=1),
        c.bellows_bound()[1],
        bb(dy=1, extra=[(["MYM", "YMY"], 0, 0), (["M"], 2, 3), (["Y"], 0, 4)]),
        bb(dy=1, b=[r.replace('P', 'p') for r in c.BELLOWS], extra=[(["M"], 6, 8)]),
        compose([(c.LEGS_C, 5, 13), (flat, 2, 10), (c.NOZZLE, 4, 5), (c.RAKE[4:], 13, 6)]),
        compose([(flat, 2, 13), (c.NOZZLE, 9, 10, {'Y': 'k'}), (["oooooooooooo"], 2, 15)]),
    ]
    register('bellows_bound', c.PAL_C, f, biome='forge')


def mold_wrought():
    c = fc
    def mw(ly=5, ry=3, seam=None, funnel_y=0, rc=None):
        return compose([(c.LEGS_B, 5, 14), (seam or c.SEAM, 8, 5), (c.LHALF, 3, ly, rc), (c.RHALF, 9, ry, rc),
                        (c.FUNNEL, 4, funnel_y), (c.SLAB, 0, 3)])
    puddle = [".mMYMm.", "mMmMmMm"]
    f = [
        mw(),
        mw(ly=6, ry=3),
        mw(seam=["W"] * 9, funnel_y=-1),
        c.mold_wrought()[1],
        mw(seam=["m"] * 9, rc={'M': 'm'}),
        compose([(puddle, 5, 14), (c.LHALF, 0, 7), (c.RHALF, 12, 7), (c.FUNNEL, 4, 4, {'W': 'M', 'Y': 'M'})]),
        compose([(["mmmmmmm"], 5, 15), (c.LHALF[1:], -1, 9, {'M': 'k'}), (c.RHALF[1:], 13, 9, {'M': 'k'}),
                 (c.FUNNEL[:2], 4, 12, {'W': 'm', 'Y': 'm', 'M': 'm'})]),
    ]
    register('mold_wrought', c.PAL_B, f, biome='forge')


for fn in (brine_pilgrim, lantern_jelly, bell_taken, peat_saint, frozen_executioner,
           cairn_crawler, hollow_thane, censer_magistrate, bellows_bound, mold_wrought):
    fn()

for _n, _p in list(globals().items()):
    if isinstance(_p, list) and _p and isinstance(_p[0], str):
        check(_n, _p)
