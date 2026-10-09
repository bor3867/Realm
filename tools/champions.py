"""Champions - 24x24. Parent mobs (small mobs gather around them and are
re-spawned by them) and event heralds (kill three heralds in a biome to
summon its realm boss).

Row per champion: M0 M1 | T0 | A0 | D0 D1 D2   (same layout as the 16px bestiary)
Pivot (12, 23).
"""
import math
from pixlib import blank, line, outline, rows, compose

S = 24
C = {}


def register(name, pal, frames, **meta):
    out = []
    for f in frames:
        f = [''.join(r) for r in f]
        assert len(f) == S and all(len(r) == S for r in f), name
        out.append(f)
    assert len(out) == 7, name
    C[name] = dict(pal=pal, frames=out, meta=meta)


def P(c, x, y, ch):
    if 0 <= x < S and 0 <= y < S:
        c[y][x] = ch


def rect(c, x0, y0, x1, y1, ch):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            P(c, x, y, ch)


def ell(c, cx, cy, rx, ry, ch):
    for y in range(S):
        for x in range(S):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                c[y][x] = ch


def thick(c, x0, y0, x1, y1, w, ch):
    for k in range(-(w // 2), w - w // 2):
        if abs(x1 - x0) > abs(y1 - y0):
            line(c, x0, y0 + k, x1, y1 + k, ch)
        else:
            line(c, x0 + k, y0, x1 + k, y1, ch)


def fin(c, rc=None, late=()):
    outline(c)
    for x, y, ch in late:
        P(c, x, y, ch)
    if rc:
        c = [[rc.get(ch, ch) for ch in r] for r in c]
    return c


def squash(g, n):
    g = [''.join(r) for r in g]
    body = [r for r in g if r.strip('.')]
    kept = body[::-1][::n][::-1]
    return ['.' * S] * (S - len(kept)) + kept


def deaths(dead):
    return [dead, squash(dead, 2), squash(dead, 4)]


def sparks(ch, pts):
    return [(x, y, ch) for x, y in pts]


# ================================================================= PARENTS
# PILGRIM ELDER - the first pilgrim to walk into the sea. Still leading the
# procession, crook in hand, a reliquary lantern swinging from its hook.
PE = {'o': '#102226', 't': '#2B6E6A', 'T': '#5FB3A1', 'b': '#E8DCC0', 'B': '#A89A7C', 'p': '#FF8FBF',
      'P': '#FFE3F0', 'g': '#2F5A3A', 'G': '#4C8550', 'w': '#6A4A30', 'h': '#C98A22', 'H': '#F2C14E'}


def elder(sway=0, glow='p', lift=0, bob=0):
    c = blank(S, S)
    rect(c, 6, 11 + bob, 15, 22, 'G')                                   # robe
    for y in range(11 + bob, 23):
        P(c, 6, y, 'g'); P(c, 15, y, 'g'); P(c, 10 + (y % 3 == 0), y, 'g')
    for x in range(5, 17):
        P(c, x, 22, 'g' if x % 2 else 'G')
    ell(c, 10.5, 9 + bob, 7, 4, 'B')                                    # ornate clam hood
    ell(c, 10.5, 8 + bob, 6, 3, 'b')
    for x in range(5, 17, 2):
        line(c, 10, 5 + bob, x, 11 + bob, 'B')                          # shell ridges
    rect(c, 8, 10 + bob, 13, 11 + bob, 'o'); P(c, 10, 10 + bob, glow); P(c, 11, 10 + bob, glow)   # the face is a pearl
    for x, y in ((5, 8), (6, 7), (15, 7)):
        P(c, x, y + bob, 'T')                                           # barnacles
    sx = 18 + sway                                                      # crook staff
    thick(c, sx, 4 - lift, sx - sway, 23, 2, 'w')
    line(c, sx, 4 - lift, sx + 3, 2 - lift, 'w'); line(c, sx + 3, 2 - lift, sx + 4, 4 - lift, 'w')
    rect(c, sx + 3, 5 - lift, sx + 5, 8 - lift, 'h')                    # reliquary lantern
    P(c, sx + 4, 6 - lift, glow); P(c, sx + 4, 7 - lift, glow)
    line(c, 15, 14 + bob, sx - sway, 14, 'b')                           # arm on the staff
    return c


def pilgrim_elder():
    f = [fin(elder()), fin(elder(sway=-1, bob=1)), fin(elder(glow='P', lift=2), late=sparks('P', [(22, 1), (19, 0)])),
         fin(elder(glow='P', lift=1, sway=1), late=sparks('P', [(23, 4), (20, 0), (16, 2), (23, 9)]))]
    f += deaths(fin(elder(glow='o', sway=-2, bob=2)))
    register('pilgrim_elder', PE, f, biome='shore', parent=True)


# BOG ABBESS - abbess of the drowned convent. Her wimple was woven from reeds
# so it would float; it didn't. The bell in her hand calls the faithful home.
BA = {'o': '#10180E', 'r': '#4A5A3A', 'R': '#6E8450', 'k': '#1E2A18', 'K': '#2E3A24', 'f': '#D8D0B8',
      'g': '#8DB03A', 'y': '#D4FF5A', 'Y': '#F4FFC8', 'h': '#A8792A', 'H': '#E3B95A'}


def abbess(bell=0, glow='y', bob=0, smoke=0):
    c = blank(S, S)
    for y in range(9 + bob, 23):                                        # robe, widening
        w = 3 + (y - 9) // 2
        rect(c, 12 - w, y, 11 + w, y, 'K' if y % 4 else 'k')
    for k in range(9):                                                  # the great reed wimple
        rect(c, 12 - (2 + k), 1 + k + bob, 11 + (2 + k), 1 + k + bob, 'R' if k % 2 else 'r')
    for x in range(3, 21, 2):
        P(c, x, 9 + bob, 'r')
    rect(c, 9, 4 + bob, 14, 8 + bob, 'f')                               # pale face in the hood
    P(c, 10, 6 + bob, glow); P(c, 13, 6 + bob, glow)                    # corpse-light eyes
    P(c, 11, 8 + bob, 'k'); P(c, 12, 8 + bob, 'k')
    bx, by = 2 - bell, 14 - bell                                        # hand-bell, raised to ring
    ell(c, bx + 1.5, by + 1, 2, 2, 'H'); P(c, bx + 1, by + 3, 'h'); P(c, bx + 2, by + 3, 'h')
    line(c, bx + 2, by - 1, 6, 13 + bob, 'f')
    line(c, 17, 13 + bob, 20, 16, 'f')                                  # reed censer on a chain
    ell(c, 20.5, 17.5, 1.6, 1.6, 'h')
    for k in range(smoke + 1):
        P(c, 21 + (k % 2), 15 - k * 2, 'g')
    return c


def bog_abbess():
    f = [fin(abbess()), fin(abbess(bob=1, smoke=1)), fin(abbess(bell=2, glow='Y', smoke=2), late=sparks('y', [(0, 9), (3, 8)])),
         fin(abbess(bell=3, glow='Y', smoke=3), late=sparks('Y', [(0, 7), (5, 7), (0, 15), (23, 10)]))]
    f += deaths(fin(abbess(glow='k', bob=2)))
    register('bog_abbess', BA, f, biome='fen', parent=True)


# RUNE-WARDEN - the cairn the crawlers were built from. It stands where a
# border used to be and has not been told the kingdom is gone.
RW = {'o': '#16122A', 's': '#726D8E', 'S': '#B2ACCA', 'n': '#4A4466', 'c': '#3BEFFF', 'C': '#CFFFFF', 'A': '#F0FCFF'}


def warden(step=0, eye='c', arm=0):
    c = blank(S, S)
    rect(c, 7, 9, 16, 18, 'S'); rect(c, 12, 9, 16, 18, 's')            # slab torso
    for y in (12, 15):
        for x in range(7, 17):
            P(c, x, y, 'n')
    for x, y in ((10, 11), (11, 12), (10, 13), (11, 14), (10, 15)):
        P(c, x, y, eye)                                                 # chest rune
    rect(c, 9, 3, 14, 8, 'S'); rect(c, 12, 3, 14, 8, 's')               # head stone
    rect(c, 9, 2, 14, 2, 'A')                                           # snow cap
    P(c, 11, 5, eye); P(c, 12, 5, eye)
    for k in range(4):                                                  # big right arm of stacked stones
        rect(c, 17 + k % 2, 9 + k * 3 - arm * k, 20 + k % 2, 11 + k * 3 - arm * k, 'S' if k % 2 else 's')
    for k in range(3):                                                  # smaller left arm
        rect(c, 4, 10 + k * 3, 6, 12 + k * 3, 's')
    rect(c, 8 - step, 19, 10 - step, 23, 's'); rect(c, 13 + step, 19, 15 + step, 23, 's')   # legs
    rect(c, 8 - step, 19, 10 - step, 19, 'n'); rect(c, 13 + step, 19, 15 + step, 19, 'n')
    return c


def rune_warden():
    f = [fin(warden()), fin(warden(step=1)), fin(warden(eye='C', arm=1), late=sparks('C', [(21, 1), (2, 6)])),
         fin(warden(eye='A', arm=2), late=sparks('c', [(23, 5), (0, 9), (22, 0), (1, 20)]))]
    f += deaths(fin(warden(eye='n')))
    register('rune_warden', RW, f, biome='runeholt', parent=True)


# THE FALLEN CHOIRMASTER - he still conducts. The organ-pipe crown floating
# over his head is the last of the cathedral organ; the choir follows the beat.
FC = {'o': '#0E0A0E', 'k': '#1E1A24', 'K': '#3A3446', 'g': '#A8792A', 'G': '#E3B95A', 'r': '#6A1028',
      'R': '#B0213F', 'f': '#E4DEEC', 'Y': '#FFEB8F'}


def choirmaster(baton=0, crown=0, glow='R', bob=0):
    c = blank(S, S)
    for y in range(10 + bob, 23):                                       # long tattered robe
        w = 2 + (y - 10) // 3
        rect(c, 12 - w, y, 11 + w, y, 'K' if (y + 1) % 3 else 'k')
    for x in range(8, 16, 2):
        P(c, x, 22, '.')                                                # tatters
    rect(c, 11, 10 + bob, 12, 21, 'G')                                  # gold stole
    rect(c, 10, 6 + bob, 13, 9 + bob, 'f')                              # gaunt mask
    P(c, 10, 7 + bob, glow); P(c, 13, 7 + bob, glow)
    for n, x in enumerate((8, 10, 12, 14, 16)):                         # floating organ-pipe crown
        top = 1 + (2, 0, 1, 0, 3)[n] - crown
        rect(c, x, top, x, 4 - crown, 'G' if n % 2 else 'g')
        P(c, x, top, 'Y')
    thick(c, 15, 12 + bob, 20, 8 - baton * 3, 1, 'K')                   # conducting arm
    line(c, 20, 8 - baton * 3, 23, 5 - baton * 4, 'f')                  # baton
    line(c, 8, 12 + bob, 5, 16, 'K')
    return c


def fallen_choirmaster():
    f = [fin(choirmaster()), fin(choirmaster(baton=1, bob=1)), fin(choirmaster(baton=2, crown=1, glow='Y'), late=sparks('Y', [(23, 0), (9, 0)])),
         fin(choirmaster(baton=0, crown=2, glow='Y', bob=-1), late=sparks('G', [(0, 3), (23, 10), (2, 18), (21, 20)]))]
    f += deaths(fin(choirmaster(glow='k', crown=-3, bob=2)))
    register('fallen_choirmaster', FC, f, biome='godfall', parent=True)


# ================================================================= HERALDS (mini-events)
# THE TIDE HERALD - it blows the conch that calls the Brine Cathedral ashore.
TH = {'o': '#102226', 't': '#2B6E6A', 'T': '#5FB3A1', 'b': '#E8DCC0', 'p': '#FF8FBF', 'P': '#FFE3F0',
      'q': '#C8508A', 'g': '#2F5A3A', 'G': '#4C8550', 'w': '#E2C9A0'}


def tide_herald(blow=0, step=0):
    c = blank(S, S)
    for y in range(8, 22):                                              # kelp cloak
        w = 3 + (y - 8) // 3
        rect(c, 11 - w, y, 10 + w, y, 'G' if (y + step) % 3 else 'g')
    rect(c, 8 - step, 22, 9 - step, 23, 'b'); rect(c, 12 + step, 22, 13 + step, 23, 'b')
    ell(c, 10.5, 6, 3, 3, 'T'); P(c, 9, 6, 'P'); P(c, 12, 6, 'P')     # drowned face
    for k in range(9):                                                  # the enormous conch
        r = 1.2 + k * 0.45 + blow * 0.1
        ell(c, 14 + k, 5 - k * 0.3 - blow, r, r * 0.8, 'w' if k % 2 else 'p')
    ell(c, 21.5, 2.5 - blow, 1.5, 1.5, 'q')                             # bell of the conch
    P(c, 21, 2 - blow, 'P')
    line(c, 8, 12, 14, 7, 'T')                                          # arms holding it up
    return c


def tide_herald_fn():
    f = [fin(tide_herald()), fin(tide_herald(step=1)), fin(tide_herald(blow=1), late=sparks('P', [(23, 0), (20, 0)])),
         fin(tide_herald(blow=2), late=sparks('T', [(23, 1), (23, 6), (19, 0), (0, 10), (2, 4)]))]
    f += deaths(fin(tide_herald(step=1), rc={'P': 'o'}))
    register('tide_herald', TH, f, biome='shore', herald=True)


# THE BOG BELLRINGER - carries the convent's bell-frame on his back so the
# bell can be rung anywhere. Three peals wake the Wick-Mother.
BB = {'o': '#10180E', 'w': '#5A4030', 'W': '#8A6A48', 'h': '#8A5A1E', 'H': '#E3B95A', 'k': '#1E2A18',
      'K': '#3A4A2E', 'f': '#D8D0B8', 'y': '#D4FF5A', 'Y': '#F4FFC8'}


def bellringer(swing=0, step=0, glow='y'):
    c = blank(S, S)
    rect(c, 5, 2, 6, 15, 'w'); rect(c, 17, 2, 18, 15, 'W')             # bell frame on his back
    rect(c, 5, 1, 18, 2, 'W')
    ell(c, 11.5 + swing, 6.5, 4, 4, 'H')                                # the bell, swinging
    rect(c, 8 + swing, 9, 15 + swing, 10, 'h')
    P(c, 11 + swing, 11, 'k'); P(c, 12 + swing, 11, 'k')                # clapper
    for y in range(11, 21):                                             # hunched body
        rect(c, 7, y, 16, y, 'K' if y % 3 else 'k')
    ell(c, 11.5, 13, 2.5, 2, 'f'); P(c, 10, 13, glow); P(c, 13, 13, glow)
    line(c, 16, 14, 20, 9 - swing, 'W')                                 # the rope
    rect(c, 8 - step, 21, 9 - step, 23, 'k'); rect(c, 14 + step, 21, 15 + step, 23, 'k')
    return c


def bellringer_fn():
    f = [fin(bellringer()), fin(bellringer(swing=1, step=1)), fin(bellringer(swing=-2, glow='Y')),
         fin(bellringer(swing=2, glow='Y'), late=sparks('y', [(1, 6), (22, 6), (0, 1), (23, 1), (11, 0)]))]
    f += deaths(fin(bellringer(swing=3, glow='k')))
    register('bog_bellringer', BB, f, biome='fen', herald=True)


# THE RIME HERALD - standard-bearer of an army that froze on the march.
RH = {'o': '#0E1830', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF', 'k': '#39475E', 'K': '#8794AC',
      'c': '#3BEFFF', 'b': '#DCD6C4'}


def rime_herald(wave=0, step=0, raise_=0):
    c = blank(S, S)
    px = 6
    rect(c, px, 1 - raise_, px, 23, 'K')                               # banner pole
    for k in range(10):                                                 # frozen banner streaming right
        y0 = 2 - raise_ + (k * wave) // 6
        for y in range(y0, y0 + 7 - k // 3):
            P(c, px + 1 + k, y, 'A' if (k + y) % 4 else 'a')
    P(c, px + 4, 4 - raise_, 'c'); P(c, px + 5, 5 - raise_, 'c'); P(c, px + 4, 6 - raise_, 'c')   # rune
    for k in range(0, 10, 3):
        P(c, px + 1 + k, 9 - raise_, 'W')                               # icicles off the hem
    rect(c, 9, 11, 16, 19, 'k'); rect(c, 9, 11, 11, 19, 'K')            # armoured body
    rect(c, 10, 7, 15, 10, 'K'); rect(c, 11, 9, 14, 9, 'a')            # helm with frozen visor
    P(c, 12, 8, 'W'); P(c, 13, 8, 'W')
    line(c, 9, 13, px, 12, 'K')
    rect(c, 10 - step, 20, 11 - step, 23, 'k'); rect(c, 14 + step, 20, 15 + step, 23, 'k')
    return c


def rime_herald_fn():
    f = [fin(rime_herald()), fin(rime_herald(wave=2, step=1)), fin(rime_herald(wave=1, raise_=1), late=sparks('c', [(3, 0), (17, 0)])),
         fin(rime_herald(wave=3, raise_=1), late=sparks('W', [(22, 2), (22, 8), (0, 5), (18, 22)]))]
    f += deaths(fin(rime_herald(wave=4), rc={'c': 'a'}))
    register('rime_herald', RH, f, biome='runeholt', herald=True)


# THE GILDED PENITENT - walks the ash with a gold mask and gold chains,
# scourging itself toward the fallen statue. The Colossus answers.
GP = {'o': '#0E0A0E', 'f': '#E4DEEC', 'F': '#A8A0B8', 'r': '#B0213F', 'g': '#C98A22', 'G': '#F2C14E',
      'Y': '#FFEB8F', 'k': '#4A4458'}


def penitent(arc=0, step=0, glow='r'):
    c = blank(S, S)
    for y in range(8, 22):                                              # white robe, bloodied
        w = 3 + (y - 8) // 4
        rect(c, 12 - w, y, 11 + w, y, 'f' if (y // 3) % 2 else 'F')
    for x, y in ((10, 15), (14, 18), (11, 20), (13, 12)):
        P(c, x, y, 'r')
    ell(c, 11.5, 5, 3, 3, 'G'); rect(c, 10, 5, 13, 5, 'o'); P(c, 10, 5, glow); P(c, 13, 5, glow)   # gold mask
    P(c, 11, 2, 'Y'); P(c, 12, 1, 'Y')
    for side, base in ((-1, 8), (1, 15)):                               # two scourge chains in arcs
        for k in range(8):
            a = (0.6 + arc * 0.5) + k * 0.28
            x = round(base + side * math.cos(a) * (2 + k))
            y = round(11 - math.sin(a) * (2 + k) * (1 if side > 0 else 0.8))
            P(c, x, y, 'G' if k % 2 else 'g')
    rect(c, 9 - step, 22, 10 - step, 23, 'k'); rect(c, 13 + step, 22, 14 + step, 23, 'k')
    return c


def penitent_fn():
    f = [fin(penitent()), fin(penitent(arc=1, step=1)), fin(penitent(arc=2, glow='Y')),
         fin(penitent(arc=-1, glow='Y'), late=sparks('Y', [(0, 2), (23, 2), (1, 14), (22, 14)]))]
    f += deaths(fin(penitent(arc=3, glow='k')))
    register('gilded_penitent', GP, f, biome='godfall', herald=True)


for fn in (pilgrim_elder, bog_abbess, rune_warden, fallen_choirmaster, tide_herald_fn, bellringer_fn, rime_herald_fn, penitent_fn):
    fn()
