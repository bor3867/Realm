"""Realm bestiary, wave 2: nine more mobs so every biome has 4-5 kinds.

Same row format as bestiary.py: M0 M1 | T0 | A0 | D0 D1 D2.
"""
from pixlib import compose, flip, check, blank, line, rows, outline
from bestiary import register


def settle(grid, steps):
    """Gravity collapse: every pixel falls up to `steps` rows, stacking."""
    g = [list(r) for r in grid]
    H, W = len(g), len(g[0])
    for x in range(W):
        col = [g[y][x] for y in range(H)]
        for _ in range(steps):
            for y in range(H - 2, -1, -1):
                if col[y] != '.' and col[y + 1] == '.':
                    col[y + 1], col[y] = col[y], '.'
        for y in range(H):
            g[y][x] = col[y]
    return [''.join(r) for r in g]


def dots(ch, pts):
    return [([ch], x, y) for x, y in pts]


def squash(grid, keep_every):
    """Collapse a sprite onto the floor by keeping every n-th row, bottom-aligned."""
    grid = [''.join(r) for r in grid]
    body = [r for r in grid if r.strip('.')]
    kept = body[::-1][::keep_every][::-1]
    return ['.' * len(grid[0])] * (len(grid) - len(kept)) + kept


def death3(base, rc=None, extra0=(), extra2=()):
    """Generic: crack -> buckle to half height -> flattened heap."""
    d0 = compose([(base, 0, 0, rc)] + list(extra0))
    return [d0, squash(d0, 2), compose([(squash(d0, 4), 0, 0)] + list(extra2))]


# =========================================================== DROWNED SHORE
# SALT WIDOW - a widow who waited on the shore so long she became the salt
# pillar people point at. Her kelp shawl still moves. Crystals bloom on her
# shoulders before she weeps a fan of salt.
SW = {'o': '#1C2430', 's': '#E8F0F4', 'S': '#B8C8D4', 'd': '#8AA0B4', 'k': '#2E5A3A', 'K': '#4C8A50', 'c': '#9AF0FF'}
WIDOW = ["................", "......ooo.......", ".....oSsso......", ".....osSSo......", "....oKosSso.....",
         "...oKKosssSo....", "...oKkossSSo....", "...okKosssSo....", "....oKosssSo....", "....okossSSo....",
         "....oKosssSo....", "....ookosssSo...", ".....oossssSo...", ".....osssSSSo...", "....ossSsssSSo..",
         "....oooooooooo.."]


def salt_widow():
    sway = {'k': 'K', 'K': 'k'}
    spikes = dots('c', [(4, 3), (11, 4), (12, 3), (3, 4), (10, 1), (11, 9)])
    f = [
        compose([(WIDOW, 0, 0)]),
        compose([(WIDOW, 0, 0, sway), (["S"], 3, 15), (["s"], 13, 14)]),
        compose([(WIDOW, 0, 0, {'S': 'c'})] + spikes),
        compose([(WIDOW, 0, 0, {'S': 's', 'd': 'c'})] + spikes + dots('s', [(1, 5), (14, 6), (2, 10), (14, 12)])),
    ] + death3(WIDOW, {'S': 'd'}, extra0=dots('o', [(7, 6), (8, 7), (7, 8), (9, 10), (8, 11)]))
    register('salt_widow', SW, f, biome='shore')


# TRAP-HOUND - a drowned dog rebuilt by the tide out of driftwood, with a
# lobster trap for a ribcage. Whatever it catches stays inside.
TH = {'o': '#1A1410', 'w': '#6A4A30', 'W': '#9A7048', 'n': '#C8B890', 'b': '#E8DCC0', 'c': '#2FE0C8', 'C': '#B8FFF2'}
HOUND_TOP = ["................", "................", "..............o.", ".............oWo", ".oo.........oWo.",
             "obbo........oWo.", "obcbo.oooooooWo.", "obbbbowWnWnWnWo.", ".obbbownononowo.", "..oboownononowo.",
             "...o.ownWnWnWwo.", ".....owwwwwwwwo."]
LEGS_A = [".....owo..owo.owo", ".....owo..owo.owo", "....oWo...oWo.oWo", "....oo....oo..oo."]
LEGS_B = ["......owoowo.owo.", ".....owo..owoowo.", ".....oWo..oWooWo.", ".....oo...oo..oo."]


def hound(legs, dx=0, dy=0, rc=None, tail=0):
    top = HOUND_TOP if not tail else [r[:12] + r[13:] + '.' for r in HOUND_TOP]
    return compose([([r[:16] for r in legs], 0 + dx, 12 + dy), (top, dx, dy, rc)])


def trap_hound():
    f = [
        hound(LEGS_A),
        hound(LEGS_B, tail=1),
        hound(LEGS_A, dy=1, rc={'c': 'C'}),
        hound(LEGS_B, dx=-1, rc={'c': 'C', 'b': 'C'}) if False else compose([(hound(LEGS_B, dx=-1, rc={'c': 'C'}), 0, 0)] + dots('C', [(0, 7), (0, 9)])),
    ] + death3(rows([list(r) for r in hound(LEGS_A)]), {'c': 'w'}, extra2=dots('n', [(2, 14), (12, 15)]))
    register('trap_hound', TH, f, biome='shore')


# =========================================================== ASHFEN
# MIRE CHOIR - three choristers drowned in the same robe. Their hymn never
# ended; their necks just kept growing toward the surface.
MC = {'o': '#10180E', 'R': '#4A5A3A', 'r': '#2A3324', 'h': '#D8D0B8', 'g': '#8DB03A', 'y': '#D4FF5A', 'Y': '#F4FFC8'}
CHOIR_HEAD = [".ooo.", "oRRRo", "oRhRo", "oRyRo", ".oRo."]
CHOIR_ROBE = ["...oooooo...", "..oRrRRrRo..", ".oRrRRrRRro.", ".oRRrRRrRRo.", "oRrRRrRRrRRo", "oRRrRRrRRrRo", "oooooooooooo"]


def choir(hy=(3, 0, 2), rc=None):
    c = blank(16, 16)
    for (hx, y) in ((2, hy[0]), (7, hy[1]), (13, hy[2])):
        line(c, hx, y + 4, hx + (1 if hx < 7 else -1 if hx > 7 else 0), 9, 'r')
    L = [(rows(c), 0, 0), (CHOIR_ROBE, 2, 9)]
    for (hx, y) in ((0, hy[0]), (5, hy[1]), (11, hy[2])):
        L.append((CHOIR_HEAD, hx, y, rc))
    return compose(L)


def mire_choir():
    f = [
        choir((3, 0, 2)),
        choir((2, 1, 3)),
        choir((2, -1, 1), {'y': 'Y', 'R': 'g'}),
        compose([(choir((4, 1, 3), {'y': 'Y'}), 0, 0)] + dots('y', [(2, 9), (7, 6), (13, 8), (1, 12), (14, 11)])),
    ] + death3(choir((5, 3, 6)), {'y': 'r'})
    register('mire_choir', MC, f, biome='fen')


# LANTERN HERON - a marsh heron that swallowed a bog-lantern and kept walking.
# It stalks on stilts; its head is the light that lures you into the mud.
LH = {'o': '#121410', 'f': '#C8C4B4', 'F': '#8A8676', 'l': '#3A3A2E', 'k': '#5A4A3A', 'g': '#8DB03A', 'y': '#E8FF8A'}
HERON_HEAD = [".ooo.", "okgko", "ogygo", "okgko", ".ooo."]
HERON_BODY = [".oooo...", "offFfo..", "offFFfoo", ".oFFffFo", "..ooooo."]


def heron(step=0, hd=(0, 0), rc=None, crouch=0):
    c = blank(16, 16)
    k1, k2 = (12 - crouch, 12 - crouch)
    line(c, 6, 11, 5 + (step == 1), k1, 'l'); line(c, 5 + (step == 1), k1, 6 - step, 15, 'l')
    line(c, 8, 11, 9, k2, 'l'); line(c, 9, k2, 8 + step, 15 - step, 'l')
    line(c, 9, 7 + crouch, 10 + hd[0], 4 + hd[1], 'F')      # neck
    line(c, 10, 7 + crouch, 11 + hd[0], 4 + hd[1], 'f')
    return compose([(rows(c), 0, 0), (HERON_BODY, 3, 7 + crouch), (HERON_HEAD, 9 + hd[0], 0 + hd[1], rc)])


def lantern_heron():
    f = [
        heron(0),
        heron(1, hd=(0, 1)),
        heron(0, hd=(1, -1), rc={'g': 'y'}, crouch=1),
        compose([(heron(1, hd=(-2, 3), rc={'g': 'y', 'k': 'g'}), 0, 0)] + dots('y', [(5, 4), (7, 7), (4, 6)])),
    ] + death3(heron(0, hd=(1, 4), crouch=2), {'y': 'k'})
    register('lantern_heron', LH, f, biome='fen')


# CANDLE MITE - drips from the Wick-Mother that learned to walk. Minion.
CM = {'o': '#10180E', 'w': '#E8E0C8', 'W': '#B8AE94', 'k': '#1A1A12', 'g': '#8DB03A', 'y': '#D4FF5A'}
MITE = ["......y.....", ".....ygy....", ".....gyg....", "......k.....", "....ooooo...", "...owwwWwo..",
        "...owwWwwo..", "...owwwwWo..", "..oowwwwWoo.", "...oooooo..."]


def candle_mite():
    f = [
        compose([(MITE, 2, 4), (["ok.ko"], 5, 14)]),
        compose([(MITE, 2, 5), (["k.ok."], 5, 15)]),
        compose([(MITE, 2, 4, {'g': 'y'}), (["ok.ko"], 5, 14), (["y"], 8, 3)]),
        compose([(MITE, 2, 3, {'g': 'y', 'w': 'y'}), (["ok.ko"], 5, 13)]),
    ] + death3(compose([(MITE, 2, 6, {'y': 'k', 'g': 'k'})]))
    register('candle_mite', CM, f, biome='fen', minion=True)


# =========================================================== RUNEHOLT
# PRAYER-WHEEL MONK - a hermit who carries the monastery's prayer wheel on his
# back. Every turn of it is a verse; every verse comes out as a rune.
PM = {'o': '#10162A', 'm': '#3A3A6A', 'M': '#5A5A9A', 's': '#8C8FA3', 'S': '#C9CCD8', 'c': '#3BEFFF', 'C': '#CFFFFF', 'b': '#DCD6C4'}


def wheel(phase, rc=None):
    g = [list(".oooooooo.")]
    for y in range(11):
        row = ['o'] + [('S' if (x + phase) % 4 < 2 else 's') for x in range(8)] + ['o']
        if y in (2, 6):
            row = ['o'] + [('c' if (x + phase + y) % 3 == 0 else 's') for x in range(8)] + ['o']
        g.append(row)
    g.append(list(".oooooooo."))
    return [''.join((rc or {}).get(ch, ch) for ch in r) for r in g]


MONK = ["..ooo....", ".omMmo...", "obMbMmo..", "omMmMMmo.", "omMMmMMo.", ".omMmMmo.", "..oMmMmo.", "..ombmbo.", "..oo.oo.."]


def prayer_monk():
    f = [
        compose([(wheel(0), 6, 1), (MONK, 1, 7)]),
        compose([(wheel(1), 6, 2), (MONK, 1, 7)]),
        compose([(wheel(2, {'c': 'C'}), 6, 0), (MONK, 1, 8)]),
        compose([(wheel(3, {'c': 'C', 's': 'c'}), 6, 0), (MONK, 1, 7)] + dots('C', [(15, 3), (5, 2), (15, 10)])),
    ]
    fallen = [r for r in zip(*wheel(0)[::-1])]
    fallen = [''.join(r) for r in fallen]
    f += [compose([(wheel(0, {'c': 's'}), 7, 3), (MONK, 1, 8)]),
          compose([(fallen, 3, 10), (settle(compose([(MONK, 1, 7)]), 4), 0, 0)]),
          compose([(fallen, 3, 11), (settle(compose([(MONK, 1, 7)]), 16), 0, 0)])]
    register('prayer_monk', PM, f, biome='runeholt')


# ANTLERED HUSH - the ghost of the first stag ever sacrificed on a runestone.
# The antlers are wider than it is tall. It never makes a sound.
AH = {'o': '#12102A', 'b': '#E8E4D8', 'B': '#A8A294', 'a': '#8A7A6A', 'A': '#C8B89A', 's': '#B8C8D8', 'S': '#DDE8F2', 'c': '#3BEFFF'}
SKULL = [".ooo.", "obbbo", "ocBco", "obbbo", ".oBo."]
SHROUD = [".ooooo.", "oSsSsSo", "osSsSso", "oSsSsSo", "osS.sSo", "o.s.o.o"]


def antlers(spread=0, rc=None, broken=False):
    c = blank(16, 16)
    for side in (-1, 1):
        if broken and side == 1:
            continue
        bx = 7 + side * 1
        tip = 0 if side < 0 else 1                       # asymmetric: right antler sits lower
        line(c, bx, 5, bx + side * 4, 2 + tip, 'A')
        line(c, bx + side * 4, 2 + tip, bx + side * (7 + spread), 0 + tip, 'a')
        line(c, bx + side * 2, 4, bx + side * 2, 1 + tip, 'a')
        line(c, bx + side * 5, 2 + tip, bx + side * 6, 4 + tip, 'a')
    outline(c)
    return [''.join((rc or {}).get(ch, ch) for ch in r) for r in rows(c)]


def antlered_hush():
    f = [
        compose([(antlers(0), 0, 2), (SHROUD, 4, 9), (SKULL, 5, 5)]),
        compose([(antlers(0), 0, 1), (SHROUD, 4, 8, {'s': 'S', 'S': 's'}), (SKULL, 5, 4)]),
        compose([(antlers(1, {'a': 'c', 'A': 'c'}), 0, 1), (SHROUD, 4, 9), (SKULL, 5, 4)]),
        compose([(antlers(1, {'a': 'c', 'A': 'S'}), 0, 0), (SHROUD, 4, 9), (SKULL, 5, 4, {'c': 'S'})] + dots('c', [(1, 12), (14, 12), (7, 15)])),
        compose([(antlers(0, broken=True), 0, 3), (SHROUD, 4, 9), (SKULL, 5, 6, {'c': 'o'})]),
        compose([(settle(antlers(0, broken=True), 6), 0, 3), (settle(compose([(SHROUD, 4, 9)]), 3), 0, 0), (SKULL, 5, 10, {'c': 'o'})]),
        compose([(["oAaaAo..oaA"], 2, 14), (["oooooooo"], 4, 15), (SKULL, 7, 11, {'c': 'o'})]),
    ]
    register('antlered_hush', AH, f, biome='runeholt')


# =========================================================== GODFALL
# HALO-EATER - something that crawled out of the fallen god and has been
# eating saints ever since. The last one's halo is still stuck through it.
HE = {'o': '#0E0A0E', 'k': '#2A2430', 'i': '#4A4254', 'g': '#C98A22', 'G': '#F2C14E', 'r': '#E2343F', 'Y': '#FFEB8F'}
EATER = ["................", "................", "......ooo.......", ".....okiko......", ".....orkro......",
         "....ookiko......", "...okiikkioo....", "..okikkikkiko...", "..okiokkkoiko...", ".oko.okikko.oko.",
         "oko..okkiko..oko", "ok...oikkio...ko", "o....okoko.....o", ".....oko.oko....", "....okko.okko...",
         "....ooo...ooo..."]


def halo_ring(c, cx, cy, rx, ry, ch='G', gap=None):
    import math
    for k in range(40):
        a = k / 40 * 6.283
        if gap and gap[0] < a < gap[1]:
            continue
        x, y = round(cx + math.cos(a) * rx), round(cy + math.sin(a) * ry)
        if 0 <= x < 16 and 0 <= y < 16:
            c[y][x] = ch if k % 5 else 'Y'


def eater(dy=0, rc=None, halo=True, gap=(1.0, 1.6)):
    c = blank(16, 16)
    if halo:
        halo_ring(c, 7, 8 + dy, 6, 3, 'G', gap)
    back = [r[:] for r in c]
    return compose([(EATER, 0, dy, rc), (rows(c), 0, 0)])


def halo_eater():
    f = [
        eater(0),
        eater(1, gap=(1.4, 2.0)),
        eater(1, {'r': 'Y'}, gap=(2.0, 2.6)),
        compose([(eater(0, {'r': 'Y', 'i': 'g'}, gap=(0.2, 0.8)), 0, 0)] + dots('Y', [(0, 4), (15, 5), (1, 14), (14, 13)])),
    ] + death3(eater(2, {'r': 'k'}, halo=False), extra0=[(["oG", "Go"], 1, 6), (["GG"], 12, 4)],
               extra2=[(["oGGo"], 1, 15), (["GY"], 12, 15)])
    register('halo_eater', HE, f, biome='godfall')


# CHOIR ENGINE - the cathedral organ, walking. Every pipe is a throat that
# used to belong to someone in the choir. It plays one chord: the radial kind.
CE = {'o': '#120C10', 'k': '#2E2A38', 'i': '#4F4B60', 'g': '#A8792A', 'G': '#E3B95A', 'r': '#6A1028', 'Y': '#FFEB8F'}


def engine(lift=(0, 0, 0, 0, 0), dy=0, rc=None, legs=0, vent=False):
    c = blank(16, 16)
    heights = (7, 3, 1, 4, 6)                         # asymmetric organ pipes
    for n, x in enumerate((3, 5, 7, 9, 11)):
        top = heights[n] - lift[n] + dy
        for y in range(top, 9 + dy):
            if 0 <= y < 16:
                c[y][x] = 'G' if y == top else 'g'
                c[y][x + 1] = 'g' if y == top else 'k'
        if vent and 0 <= top - 1 < 16:
            c[top - 1][x] = 'Y'
    body = ["oooooooooooo", "oikiiiiikiio", "oirrkiikrrio", "oikiiiiiikio", "okkkkkkkkkko", ".okko..okko."]
    L = [(rows(c), 0, 0), (body, 2, 9 + dy), (["ok", "oo"][:2], 3 + legs, 14), (["ko", "oo"], 11 - legs, 14)]
    g = compose(L)
    g = [list(r) for r in g]
    outline(g)
    return [''.join((rc or {}).get(ch, ch) for ch in r) for r in g]


def choir_engine():
    f = [
        engine(),
        engine(lift=(1, 0, 0, 1, 0), dy=1, legs=1),
        engine(lift=(1, 1, 1, 1, 1), dy=-1, rc={'r': 'Y'}),
        engine(lift=(2, 2, 2, 2, 2), dy=0, rc={'r': 'Y', 'g': 'G'}, vent=True),
    ] + death3(engine(dy=1, rc={'r': 'k'}), extra2=[(["GgG"], 2, 15)])
    register('choir_engine', CE, f, biome='godfall')


for fn in (salt_widow, trap_hound, mire_choir, lantern_heron, candle_mite, prayer_monk, antlered_hush, halo_eater, choir_engine):
    fn()
