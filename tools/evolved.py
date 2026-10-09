"""Wave 3: eight new small realm mobs (16x16) and an EVOLVED 24x24 parent for every
small mob. Groups are a parent plus several of its own small kind.

Every sprite is a draw(state) function; state in m0 m1 (move), t (tell), a (attack), d (dead).
Rows follow the bestiary layout: M0 M1 | T0 | A0 | D0 D1 D2.
"""
import math
from pixlib import blank, line, outline
import bestiary as b1
import bestiary2 as b2
import candidates as vc

SMALL, BIG = {}, {}


class Cv:
    def __init__(self, n):
        self.n = n
        self.g = blank(n, n)

    def p(self, x, y, ch):
        if 0 <= x < self.n and 0 <= y < self.n:
            self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.p(x, y, ch)

    def ell(self, cx, cy, rx, ry, ch):
        for y in range(self.n):
            for x in range(self.n):
                if ((x - cx) / max(rx, .1)) ** 2 + ((y - cy) / max(ry, .1)) ** 2 <= 1:
                    self.g[y][x] = ch

    def ln(self, x0, y0, x1, y1, ch, w=1):
        for k in range(-(w // 2), w - w // 2):
            if abs(x1 - x0) > abs(y1 - y0):
                line(self.g, x0, y0 + k, x1, y1 + k, ch)
            else:
                line(self.g, x0 + k, y0, x1 + k, y1, ch)

    def done(self, late=()):
        outline(self.g)
        for x, y, ch in late:
            self.p(x, y, ch)
        return [''.join(r) for r in self.g]


def squash(g, k):
    body = [r for r in g if r.strip('.')]
    kept = body[::-1][::k][::-1]
    return ['.' * len(g[0])] * (len(g) - len(kept)) + kept


def make(store, name, pal, n, draw, **meta):
    fr = [draw(st) for st in ('m0', 'm1', 't', 'a')]
    dead = draw('d')
    fr += [dead, squash(dead, 2), squash(dead, 4)]
    for f in fr:
        assert len(f) == n and all(len(r) == n for r in f), name
    store[name] = dict(pal=pal, frames=fr, meta=meta)


def sp(ch, pts):
    return [(x, y, ch) for x, y in pts]


def S(st):
    """common animation knobs: bob, step, glowing, attacking, dead"""
    return (1 if st == 'm1' else 0), (1 if st == 'm1' else -1 if st == 'a' else 0), st in ('t', 'a'), st == 'a', st == 'd'


# ============================================================ new SMALL mobs (16x16)
# ANCHOR-BEARER - a sailor who went down with the anchor chained to his waist.
AB = {'o': '#101820', 'k': '#2E3A48', 'K': '#5E7088', 'r': '#8A3A22', 'R': '#C0603A', 'b': '#C8C4B8', 't': '#2B6E6A', 'c': '#7EC0E4'}


def anchor_bearer(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    c.rect(5, 6 + bob, 9, 12, 't'); c.rect(5, 6 + bob, 6, 12, 'K')               # drowned sailor
    c.ell(7, 4 + bob, 2, 2, 'b'); c.p(6, 4 + bob, 'c' if glow else 'o'); c.p(8, 4 + bob, 'c' if glow else 'o')
    c.rect(5 - step, 13, 6 - step, 15, 'k'); c.rect(8 + step, 13, 9 + step, 15, 'k')
    ax, ay = (12, 3) if glow else (12, 7)                                         # the anchor, raised to swing
    c.ln(9, 9 + bob, ax, ay, 'K')                                                 # chain
    c.rect(ax, ay, ax, ay + 6, 'r'); c.rect(ax - 2, ay + 1, ax + 2, ay + 1, 'R')
    c.ln(ax - 3, ay + 4, ax, ay + 7, 'R'); c.ln(ax + 3, ay + 4, ax, ay + 7, 'R')
    return c.done(sp('c', [(15, 2), (14, 0), (10, 1)]) if atk else ())


# LENS MOTH - its wings grew from the lighthouse's shattered lenses.
LM = {'o': '#14141E', 'w': '#C8E8F0', 'W': '#F4FCFF', 'b': '#5A4A3A', 'y': '#FFE45C', 'Y': '#FFFDF0', 'g': '#8AA0B4'}


def lens_moth(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    flap = 0 if bob else 1
    for side in (-1, 1):                                                          # four lens wings
        c.ell(8 + side * 4, 6 - flap, 3.4, 2.6 + flap * 0.4, 'w')
        c.ell(8 + side * 3.5, 10, 2.4, 1.8, 'g')
        c.p(8 + side * 4, 6 - flap, 'Y' if glow else 'W')
    c.rect(7, 4, 8, 12, 'b')                                                      # body
    c.p(7, 3, 'y' if glow else 'b'); c.p(8, 3, 'y' if glow else 'b')
    c.ln(7, 2, 5, 0, 'b'); c.ln(8, 2, 10, 0, 'b')
    return c.done(sp('Y', [(1, 3), (14, 3), (8, 15), (0, 9)]) if atk else ())


# MOURNING WILLOW - a sapling grown from a mourner's grave, still weeping.
MW = {'o': '#10180E', 'w': '#4A3A2A', 'W': '#6A5A3A', 'g': '#4C7A2E', 'G': '#7AA44A', 'y': '#D4FF5A', 'r': '#C8C0A8'}


def mourning_willow(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    c.rect(7, 7, 8, 14, 'w'); c.p(7, 9, 'W'); c.p(8, 12, 'W')                    # trunk
    c.rect(6 - step, 15, 9 + step, 15, 'w')
    c.ell(7.5, 5 + bob, 6, 4, 'g')                                                # crown
    for x in range(2, 14, 2):                                                     # weeping strands + rosaries
        c.ln(x, 6 + bob, x + (x % 4 == 0), 11 + (x % 3), 'G')
        c.p(x + (x % 4 == 0), 12 + (x % 3), 'r')
    c.p(6, 5 + bob, 'y' if glow else 'o'); c.p(9, 5 + bob, 'y' if glow else 'o')  # eyes in the leaves
    return c.done(sp('y', [(1, 13), (14, 13), (7, 0)]) if atk else ())


# GRAVE LEECH - fat on the fen-churchyard; it still wears the gravedigger's hat.
GL = {'o': '#14100E', 'l': '#4A2A3A', 'L': '#7A4A5E', 'p': '#C87A9A', 'k': '#2A2420', 's': '#8A8A92', 'w': '#5A4A3A', 'y': '#D4FF5A'}


def grave_leech(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    for k in range(5):                                                            # segmented body
        c.ell(4 + k * 2 + step * (k % 2), 11 - (k == 4) * 2, 2.6, 2.4, 'L' if k % 2 else 'l')
    c.ell(13, 8 + bob, 2.4, 2.2, 'L')
    c.p(14, 8 + bob, 'p' if glow else 'o')                                        # sucker mouth
    c.rect(11, 4 + bob, 15, 4 + bob, 'k'); c.rect(12, 2 + bob, 14, 3 + bob, 'k')   # gravedigger hat
    c.ln(2, 12, 0, 5, 'w'); c.rect(0, 3, 1, 5, 's')                               # shovel
    return c.done(sp('p', [(15, 6), (15, 10), (10, 3)]) if atk else ())


# FROST SKALD - sang the saga of a war nobody survived. The harp is all icicles.
FS = {'o': '#0E1830', 'k': '#39475E', 'K': '#5A6A86', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF', 'b': '#DCD6C4', 'c': '#3BEFFF'}


def frost_skald(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    c.rect(4, 6 + bob, 9, 13, 'k'); c.rect(4, 6 + bob, 5, 13, 'K')               # cloaked singer
    c.ell(6.5, 4 + bob, 2, 2, 'b'); c.rect(5, 2 + bob, 8, 2 + bob, 'A')          # frost-rimed hood
    c.p(6, 4 + bob, 'c' if glow else 'o'); c.p(7, 4 + bob, 'c' if glow else 'o')
    c.rect(4 - step, 14, 5 - step, 15, 'k'); c.rect(8 + step, 14, 9 + step, 15, 'k')
    c.ln(10, 3, 14, 3, 'a'); c.ln(10, 3, 10, 12, 'a'); c.ln(14, 3, 10, 12, 'a')  # icicle harp
    for k in range(3):
        c.ln(11 + k, 4, 11, 4 + k * 2 + 3, 'A')
    return c.done(sp('W', [(15, 1), (13, 0), (15, 8)]) if atk else ())


# WOLF-SHIELD - a round shield from a shieldwall that kept fighting. It grew legs.
WS = {'o': '#14101E', 'w': '#6A4A30', 'W': '#9A7048', 'm': '#8A8A92', 'M': '#C8C8D0', 'r': '#8A1A2A', 'f': '#B8A888', 'c': '#3BEFFF'}


def wolf_shield(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    c.ell(7.5, 7 + bob - (1 if glow else 0), 6, 6, 'W')                         # round shield
    c.ell(7.5, 7 + bob - (1 if glow else 0), 6, 6, 'W')
    for k in range(-5, 6, 2):
        c.ln(7 + k, 2 + bob, 7 + k, 12 + bob, 'w')                                # planks
    c.ell(7.5, 7 + bob, 1.6, 1.6, 'M'); c.p(7, 7 + bob, 'c' if glow else 'm')     # boss
    c.ln(2, 7 + bob, 13, 7 + bob, 'r')                                            # painted stripe
    c.ell(13, 4 + bob, 2, 1.5, 'f'); c.p(14, 4 + bob, 'o'); c.p(15, 5 + bob, 'M')  # wolf head peeking
    for k, x in enumerate((3, 6, 9, 12)):                                         # four legs
        c.ln(x, 12 + bob, x + (step if k % 2 else -step), 15, 'f')
    return c.done(sp('c', [(0, 3), (15, 1), (7, 0)]) if atk else ())


# CHERUB HUSK - a gilded cherub from the god's tomb, cracked open and empty.
CH = {'o': '#140E08', 'g': '#A8792A', 'G': '#F2C14E', 'Y': '#FFF4C2', 'k': '#2A2430', 'v': '#E4DEEC', 'r': '#B0213F'}


def cherub_husk(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    c.ell(8, 9 + bob, 3.5, 3.5, 'G'); c.ell(7, 8 + bob, 1.5, 1.5, 'Y')           # round gilded body
    c.ln(6, 10 + bob, 10, 12 + bob, 'k')                                          # the crack
    c.ell(8, 5 + bob, 2.5, 2.2, 'G'); c.p(7, 5 + bob, 'r' if glow else 'k'); c.p(9, 5 + bob, 'r' if glow else 'k')
    for k in range(4):                                                            # one wing, the other a stump
        c.ln(11, 7 + bob, 15, 3 + k - (bob * 2), 'v')
    c.ln(4, 7 + bob, 2, 8 + bob, 'g')
    c.ell(8, 2 + bob, 2.5, 0.8, 'Y')                                              # halo, askew
    return c.done(sp('Y', [(0, 12), (15, 12), (8, 15), (1, 3)]) if atk else ())


# RELIQUARY SPIDER - a saint's reliquary that learned to walk on gold filigree legs.
RS = {'o': '#140E08', 'g': '#A8792A', 'G': '#F2C14E', 'Y': '#FFF4C2', 'k': '#2A2430', 'b': '#E8E4D8', 'p': '#B57CFF'}


def reliquary_spider(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(16)
    for side in (-1, 1):                                                          # filigree legs
        for k in range(3):
            kx = 8 + side * (4 + k)
            c.ln(8 + side * 2, 8 + bob, kx, 5 + k + step * side, 'g')
            c.ln(kx, 5 + k + step * side, kx + side * 2, 13 + k // 2, 'G')
    c.rect(5, 6 + bob, 10, 11 + bob, 'G'); c.rect(5, 6 + bob, 6, 11 + bob, 'Y')   # reliquary box
    c.rect(7, 7 + bob, 9, 9 + bob, 'p' if glow else 'k')                          # the window: a saint's bone glows
    c.p(8, 8 + bob, 'b')
    c.rect(6, 4 + bob, 9, 5 + bob, 'g'); c.p(7, 3 + bob, 'G'); c.p(8, 3 + bob, 'G')
    return c.done(sp('p', [(8, 0), (0, 4), (15, 4)]) if atk else ())


# ============================================================ EVOLVED parents (24x24)
def lighthouse_jelly(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.ell(12, 3 + bob, 5, 2, 'r')                                                 # lamp-room dome
    c.rect(11, 0 + bob, 12, 1 + bob, 'K')
    c.rect(6, 5 + bob, 17, 11 + bob, 'C' if glow else 'c')                         # lens band
    for x in range(6, 18, 3):
        c.ln(x, 5 + bob, x, 11 + bob, 'k')
    c.rect(6, 12 + bob, 17, 13 + bob, 'R'); c.rect(7, 4 + bob, 16, 4 + bob, 'R')
    if dead:
        c.rect(6, 5, 17, 11, 'k')
    for n, x in enumerate(range(6, 19, 2)):                                       # six chain tentacles
        for k in range(9 - (n % 3)):
            off = round(math.sin((k + n + bob * 2) * 0.9))
            c.p(x + off, 14 + bob + k, 'R' if k % 2 else 'r')
        c.p(x + round(math.sin((8 + n) * 0.9)), 22 - (n % 3), 'c')
    return c.done(sp('C', [(2, 2), (21, 2), (0, 8), (23, 8), (12, 23)]) if atk else ())


def salt_matriarch(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for y in range(5, 23):                                                        # tall salt column, widening
        w = 3 + (y - 5) // 4
        c.rect(11 - w, y, 11 + w, y, 's' if (y + 1) % 4 else 'S')
        c.p(11 - w, y, 'S')
    c.ell(11, 4 + bob, 3, 3, 'S'); c.ell(11, 4 + bob, 2, 2, 's')                  # bowed head
    for x, y in ((7, 1), (9, 0), (11, -1), (13, 0), (15, 1)):                     # salt-crystal crown
        c.ln(x, y + 3 + bob, x, y + 1 + bob - (1 if glow else 0), 'c')
    for y in range(6, 20):                                                        # kelp veil, one side
        c.p(6 + (y % 3 == 0) - (y // 6), y, 'K' if y % 2 else 'k')
        c.p(7 - (y // 6), y, 'k')
    c.ln(17, 6, 19, 22, 'S'); c.ell(17, 5, 1.6, 1.6, 'c')                         # crystal staff
    return c.done(sp('c', [(2, 4), (21, 3), (1, 14), (22, 12)]) if atk else ())


def trap_hound_alpha(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(6, 9 + bob, 21, 15 + bob, 'w')                                         # long driftwood body
    for x in range(7, 21, 4):                                                     # two lobster-trap ribcages
        c.rect(x, 10 + bob, x + 2, 14 + bob, 'n')
        c.rect(x + 1, 11 + bob, x + 1, 13 + bob, 'o')
    c.rect(6, 9 + bob, 21, 9 + bob, 'W')
    c.ell(4, 9 + bob - (1 if glow else 0), 3.5, 3, 'b')                           # skull head, raised to howl
    c.p(3, 8 + bob, 'C' if glow else 'c'); c.p(5, 8 + bob, 'C' if glow else 'c')
    c.rect(1, 11 + bob, 3, 12 + bob, 'b')
    for x in (7, 10, 17, 20):                                                     # legs
        c.ln(x, 16 + bob, x + (step if x % 2 else -step), 23, 'W')
    c.ln(21, 10 + bob, 23, 5, 'W')                                                # tail
    for x in range(6, 10):
        c.p(x, 12 + bob, 'K')                                                     # anchor-chain collar
    return c.done(sp('C', [(0, 5), (2, 3), (0, 15)]) if atk else ())


def anchor_titan(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(5, 6 + bob, 13, 17, 't'); c.rect(5, 6 + bob, 7, 17, 'K')               # drowned bosun, barnacled
    for x, y in ((9, 8), (11, 12), (6, 14)):
        c.p(x, y + bob, 'c')
    c.ell(9, 4 + bob, 3, 3, 'b'); c.p(8, 4 + bob, 'c' if glow else 'o'); c.p(10, 4 + bob, 'c' if glow else 'o')
    c.rect(6 - step, 18, 8 - step, 23, 'k'); c.rect(11 + step, 18, 13 + step, 23, 'k')
    ax, ay = (17, 1) if glow else (17, 8)                                         # a ship's anchor
    c.ln(13, 10 + bob, ax, ay, 'K', 2)
    c.rect(ax, ay, ax + 1, ay + 11, 'r'); c.rect(ax - 3, ay + 2, ax + 4, ay + 2, 'R')
    c.ln(ax - 4, ay + 7, ax, ay + 12, 'R', 2); c.ln(ax + 5, ay + 7, ax + 1, ay + 12, 'R', 2)
    c.ell(ax + 0.5, ay - 1, 1.5, 1.5, 'R')
    return c.done(sp('c', [(23, 0), (20, 0), (23, 6)]) if atk else ())


def moth_queen(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    flap = 0 if bob else 1
    for side in (-1, 1):
        c.ell(12 + side * 6, 7 - flap, 5.4, 4 + flap * 0.5, 'w')
        c.ell(12 + side * 5, 14, 3.6, 2.6, 'g')
        c.ell(12 + side * 6, 7 - flap, 2, 1.6, 'W')
        c.p(12 + side * 6, 7 - flap, 'Y' if glow else 'y')
    c.rect(11, 4, 12, 18, 'b'); c.rect(10, 8, 13, 13, 'b')
    c.p(11, 3, 'Y'); c.p(12, 3, 'Y')
    c.ln(11, 2, 8, 0, 'b'); c.ln(12, 2, 15, 0, 'b')
    c.ln(10, 6, 14, 6, 'y'); c.ln(10, 10, 14, 10, 'y')                           # lighthouse bands on the abdomen
    return c.done(sp('Y', [(0, 4), (23, 4), (12, 23), (1, 18), (22, 18)]) if atk else ())


def great_bell(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    lift = 2 if glow else 0
    for y in range(2, 17):                                                        # enormous trapezoid bell
        w = 2 + (y - 2) * 0.62
        c.rect(round(12 - w), y - lift + bob, round(11 + w), y - lift + bob, 'V' if y % 5 else 'v')
        c.p(round(12 - w), y - lift + bob, 'L')
    c.rect(10, 0 - lift + bob, 13, 1 - lift + bob, 'v')
    c.rect(2, 17 - lift + bob, 21, 17 - lift + bob, 'v')
    for y, x in ((6, 13), (8, 12), (10, 14), (12, 13), (14, 15)):
        c.p(x, y - lift + bob, 'c')                                               # glowing cracks
    c.rect(3, 18 - lift + bob, 20, 18 - lift + bob, 'x')
    for x in (5, 9, 14, 18):                                                      # four bone legs
        c.ln(x, 19 - lift + bob, x + (step if x % 2 else -step), 23, 'b')
    return c.done(sp('c', [(0, 6), (23, 6), (1, 2), (22, 2), (0, 12), (23, 12)]) if atk else ())


def peat_martyr(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(9, 1 + bob, 21, 18 + bob, 'S'); c.rect(16, 1 + bob, 21, 18 + bob, 's')  # whole stone tomb on his back
    c.rect(9, 1 + bob, 21, 2 + bob, 'S')
    for y, xs in ((6, (14, 15, 16)), (5, (15,)), (7, (15,)), (8, (15,))):
        for x in xs:
            c.p(x, y + bob, 'y' if glow else 'G')                                  # rune cross
    c.ell(7, 9 + bob, 3, 3, 'i'); c.p(6, 9 + bob, 'y'); c.p(8, 9 + bob, 'y')      # mummified saint, hunched
    c.rect(4, 12 + bob, 10, 19, 'i'); c.rect(4, 12 + bob, 5, 19, 'I')
    for x, y in ((6, 14), (8, 17), (5, 16)):
        c.p(x, y, 'g')
    c.rect(4 - step, 20, 5 - step, 23, 'I'); c.rect(8 + step, 20, 9 + step, 23, 'I')
    c.ln(3, 13, 1, 17 - (3 if atk else 0), 'i')
    return c.done(sp('y', [(0, 12), (1, 9), (2, 15)]) if atk else ())


def mire_chorus(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for y in range(13, 23):                                                       # one drowned robe
        w = 5 + (y - 13) // 2
        c.rect(12 - w, y, 11 + w, y, 'R' if y % 3 else 'r')
    heads = ((2, 6), (6, 2), (12, 0), (17, 3), (21, 7))
    for k, (hx, hy) in enumerate(heads):                                          # five heads on long necks
        yy = hy + ((bob + k) % 2) - (1 if glow else 0)
        c.ln(12 + (hx - 12) // 3, 13, hx, yy + 3, 'r')
        c.ell(hx, yy + 1, 2, 2, 'R'); c.p(hx, yy + 1, 'h')
        c.p(hx, yy + 2, 'Y' if glow else 'y')
    return c.done(sp('y', [(0, 2), (23, 2), (12, 23), (0, 14), (23, 14)]) if atk else ())


def twin_lamp_heron(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.ell(11, 13 + bob, 5, 3, 'f'); c.ell(9, 12 + bob, 3, 2, 'F')                 # body
    c.ln(8, 16 + bob, 7 - step, 23, 'l'); c.ln(13, 16 + bob, 14 + step, 23, 'l')  # stilts
    for k, (hx, hy) in enumerate(((16, 2), (21, 6))):                             # two necks, two lanterns
        c.ln(13, 11 + bob, hx, hy + 3 + (bob if k else 0), 'F')
        c.ell(hx, hy + 2 + (bob if k else 0) - (1 if glow else 0), 2, 2, 'k')
        c.p(hx, hy + 2 + (bob if k else 0) - (1 if glow else 0), 'y' if glow else 'g')
    c.ln(6, 12 + bob, 2, 9 + bob, 'F')                                            # tail plumes
    return c.done(sp('y', [(19, 0), (23, 4), (14, 0), (23, 10)]) if atk else ())


def tallow_matron(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(7, 8 + bob, 16, 19, 'w'); c.rect(7, 8 + bob, 9, 19, 'W')               # fat candle stub
    for x, ln in ((8, 5), (11, 8), (14, 4), (16, 7)):
        c.rect(x, 8 + bob, x, 8 + bob + ln, 'W')
    for x in (9, 12, 15):                                                         # three wicks, three flames
        c.p(x, 7 + bob, 'k')
        c.ell(x, 5 + bob - (1 if glow else 0), 1, 1.6, 'G'); c.p(x, 5 + bob - (1 if glow else 0), 'Y' if glow else 'y')
    c.p(10, 12 + bob, 'k'); c.p(13, 12 + bob, 'k')
    for x in (8, 11, 14):                                                         # stubby wax legs
        c.rect(x + (step if x % 2 else -step), 20, x + 1 + (step if x % 2 else -step), 23, 'W')
    return c.done(sp('y', [(5, 1), (18, 1), (12, 0), (2, 8), (21, 8)]) if atk else ())


def elder_willow(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(10, 10, 13, 21, 'w'); c.rect(10, 10, 11, 21, 'W')                       # gnarled trunk
    c.ln(10, 21, 7 - step, 23, 'w'); c.ln(13, 21, 16 + step, 23, 'w')
    c.ell(11.5, 7 + bob, 10, 6, 'g'); c.ell(9, 5 + bob, 6, 3, 'G')
    for x in range(2, 23, 2):
        c.ln(x, 9 + bob, x + (x % 4 == 0), 15 + (x % 5), 'G')
        c.p(x + (x % 4 == 0), 16 + (x % 5), 'r')
    c.ell(11.5, 12, 1.5, 2, 'o')                                                  # a hollow face
    c.p(9, 8 + bob, 'y' if glow else 'o'); c.p(14, 8 + bob, 'y' if glow else 'o')
    return c.done(sp('y', [(0, 18), (23, 18), (11, 0), (2, 2), (21, 2)]) if atk else ())


def leech_prime(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for k in range(6):
        c.ell(4 + k * 3 + step * (k % 2), 16 - (k == 5) * 3, 3.6, 3.4, 'L' if k % 2 else 'l')
    c.ell(20, 11 + bob, 3.4, 3.2, 'L')
    c.ell(21, 11 + bob, 1.4, 1.4, 'p' if glow else 'o')
    c.rect(16, 6 + bob, 23, 6 + bob, 'k'); c.rect(17, 3 + bob, 22, 5 + bob, 'k')
    c.p(19, 2 + bob, 'y'); c.p(20, 1 + bob, 'y')                                  # a candle on the hat brim
    c.ln(3, 15, 0, 5, 'w'); c.rect(0, 2, 2, 5, 's')                               # shovel
    for x in range(4, 18, 4):
        c.p(x, 13, 'p')                                                           # bloated, glistening
    return c.done(sp('p', [(23, 9), (23, 14), (14, 2)]) if atk else ())


def glacier_headsman(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(4, 3 + bob, 18, 17 + bob, 'a'); c.rect(4, 3 + bob, 8, 17 + bob, 'A')   # vast block of old ice
    c.rect(4, 3 + bob, 18, 3 + bob, 'W')
    c.ell(11, 9 + bob, 3, 3.4, 'c'); c.p(10, 8 + bob, 'o'); c.p(12, 8 + bob, 'o')  # the headsman, frozen inside
    c.rect(9, 13 + bob, 13, 16 + bob, 'c')
    if glow:
        for k in range(6):
            c.p(5 + k * 2, 5 + (k * 3) % 10 + bob, 'W')                            # cracks spreading
    for sx, d in ((20, 1), (2, -1)):                                              # two axes frozen through it
        c.ln(sx, 1, sx - d * 6, 19, 'k')
        c.rect(sx - 1, 0, sx + 1, 3, 'K')
    for x in (7, 15):
        c.ln(x, 18 + bob, x + (step if x > 10 else -step), 23, 'b')
    return c.done(sp('W', [(0, 2), (23, 4), (1, 18), (22, 16), (11, 0)]) if atk else ())


def wheel_abbot(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    ph = 1 if bob else 0
    for wx in (4, 14):                                                            # two prayer wheels on a yoke
        c.rect(wx, 1, wx + 6, 14, 'S')
        for y in range(1, 15):
            for x in range(wx, wx + 7):
                if (x + y + ph) % 4 < 2:
                    c.p(x, y, 's')
        for y in (4, 10):
            c.rect(wx, y, wx + 6, y, 'C' if glow else 'c')
    c.rect(3, 15, 21, 15, 'M')                                                    # yoke
    c.rect(8, 13 + bob, 15, 21, 'm'); c.rect(8, 13 + bob, 9, 21, 'M')
    c.ell(11.5, 12 + bob, 2, 2, 'b')
    c.rect(9 - step, 22, 10 - step, 23, 'm'); c.rect(13 + step, 22, 14 + step, 23, 'm')
    return c.done(sp('C', [(0, 3), (23, 3), (11, 0), (0, 12), (23, 12)]) if atk else ())


def elder_hush(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for side in (-1, 1):                                                          # antlers wider than the frame
        bx = 12 + side
        c.ln(bx, 8, bx + side * 6, 3, 'A')
        c.ln(bx + side * 6, 3, bx + side * 11, 0, 'a')
        c.ln(bx + side * 3, 6, bx + side * 3, 1, 'a')
        c.ln(bx + side * 8, 2, bx + side * 10, 5, 'a')
        c.ln(bx + side * 5, 4, bx + side * 6, 0, 'a')
        c.p(bx + side * 10, 6, 'c' if glow else 's')                              # runes hang from the tines
        c.p(bx + side * 3, 2, 'c' if glow else 's')
    c.ell(12, 10 + bob, 3, 3.4, 'b'); c.p(11, 10 + bob, 'c'); c.p(13, 10 + bob, 'c')
    for y in range(13, 23):                                                       # long tattered shroud
        w = 4 + (y - 13) // 3
        c.rect(12 - w, y + bob, 11 + w, y + bob, 'S' if (y + bob) % 2 else 's')
    for x in range(8, 17, 2):
        c.p(x, 22 + bob, '.')
    return c.done(sp('c', [(0, 10), (23, 10), (12, 23), (3, 18), (20, 18)]) if atk else ())


def saga_singer(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.rect(5, 8 + bob, 13, 20, 'k'); c.rect(5, 8 + bob, 7, 20, 'K')
    c.ell(9, 5 + bob, 3, 3, 'b'); c.rect(6, 2 + bob, 12, 3 + bob, 'A')
    c.p(8, 5 + bob, 'c' if glow else 'o'); c.p(10, 5 + bob, 'c' if glow else 'o')
    c.ln(9, 6 + bob, 9, 9 + bob, 'W')                                             # frozen beard
    c.rect(6 - step, 21, 7 - step, 23, 'k'); c.rect(11 + step, 21, 12 + step, 23, 'k')
    c.ln(14, 2, 22, 2, 'a', 2); c.ln(14, 2, 14, 19, 'a', 2); c.ln(22, 2, 14, 19, 'a', 2)   # great ice harp
    for k in range(5):
        c.ln(15 + k, 4, 15, 6 + k * 2 + 3, 'A')
    return c.done(sp('W', [(23, 0), (19, 0), (23, 10), (0, 4)]) if atk else ())


def shieldwall_pack(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for k, (cx, cy) in enumerate(((5, 10), (12, 8), (19, 10))):                   # three shields, one pack
        yy = cy + ((bob + k) % 2) - (1 if glow and k == 1 else 0)
        c.ell(cx, yy, 4.6, 4.6, 'W')
        for dx in range(-3, 4, 2):
            c.ln(cx + dx, yy - 4, cx + dx, yy + 4, 'w')
        c.ln(cx - 4, yy, cx + 4, yy, 'r')
        c.ell(cx, yy, 1.2, 1.2, 'M'); c.p(cx, yy, 'c' if glow else 'm')
        for x in (cx - 2, cx + 2):
            c.ln(x, yy + 4, x + (step if (x + k) % 2 else -step), 23, 'f')
    c.ell(21, 4, 2.4, 1.8, 'f'); c.p(22, 4, 'o'); c.p(23, 5, 'M')                 # wolf head on the leader
    return c.done(sp('c', [(0, 3), (12, 0), (23, 1), (0, 17)]) if atk else ())


def hollow_jarl(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for y in range(11, 23):                                                       # heavy mantle and robe
        w = 5 + (y - 11) // 3
        c.rect(12 - w, y, 11 + w, y, 'N' if y % 4 else 'n')
    c.rect(11, 12, 12, 22, 'P')
    c.rect(5, 11, 18, 12, 'g'); c.p(11, 11, 'o'); c.p(12, 11, 'o')
    for k in range(6):                                                            # tall violet soul-flame
        w = max(1, 3 - abs(k - 2))
        c.rect(12 - w, 10 - k * 1 - (1 if glow else 0), 11 + w, 10 - k * 1 - (1 if glow else 0), 'P' if k % 2 else 'p')
    c.p(11, 7, 'w'); c.p(12, 6, 'w')
    c.rect(8, 0 + bob, 15, 1 + bob, 'G')                                          # burning crown
    for x in (8, 10, 13, 15):
        c.p(x, -1 + bob + 1 if x % 2 else bob, 'G')
    for sx, sy in ((2, 4 + bob), (20, 5 - bob)):                                  # two floating swords
        c.rect(sx, sy, sx, sy + 12, 'M'); c.rect(sx - 1, sy + 2, sx + 1, sy + 2, 'g')
        c.p(sx, sy, 'G')
    return c.done(sp('P', [(0, 18), (23, 18), (12, 23), (5, 2), (18, 2)]) if atk else ())


def halo_glutton(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    c.ell(12, 13 + bob, 7, 7, 'k'); c.ell(10, 11 + bob, 4, 4, 'i')               # bloated black-iron gut
    c.ell(12, 5 + bob, 3, 3, 'k'); c.p(11, 5 + bob, 'r'); c.p(13, 5 + bob, 'r')
    c.rect(10, 7 + bob, 14, 7 + bob, 'Y' if glow else 'i')                         # a mouth full of light
    for k, (rx, ry, yy) in enumerate(((9, 2.5, 10), (10, 3, 14), (8, 2.2, 18))):  # three halos stuck through it
        for t in range(60):
            a = t / 60 * math.tau
            if math.sin(a) < -0.3 and k != 1:
                continue
            c.p(round(12 + math.cos(a) * rx), round(yy + bob + math.sin(a) * ry), 'G' if t % 6 else 'Y')
    for x in (6, 17):
        c.ln(x, 17 + bob, x + (step if x > 10 else -step), 23, 'k')
    return c.done(sp('Y', [(0, 6), (23, 6), (2, 22), (21, 22)]) if atk else ())


def cathedral_engine(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    heights = (10, 6, 3, 1, 4, 7, 11)
    for n, x in enumerate(range(3, 21, 3)):                                       # seven organ pipes
        top = heights[n] - (1 if glow else 0) + bob
        c.rect(x, top, x + 1, 13, 'g'); c.p(x, top, 'G'); c.p(x + 1, top, 'G')
        if atk:
            c.p(x, top - 1, 'Y')
    c.rect(2, 13, 21, 19 + bob, 'i'); c.rect(2, 13, 21, 13, 'k')                  # console body
    c.rect(5, 15, 18, 16, 'r' if not glow else 'Y')                               # glowing keyboard
    for x in range(5, 19, 2):
        c.p(x, 15, 'k')
    c.rect(1, 17 + bob, 3, 20, 'k'); c.rect(20, 17 + bob, 22, 20, 'k')            # bellows feet
    for x in (5, 17):
        c.rect(x + (step if x > 10 else -step), 20, x + 1 + (step if x > 10 else -step), 23, 'k')
    return c.done()


def seraph_husk(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for side in (-1, 1):                                                          # six broken wings
        for k in range(3):
            c.ln(12, 9 + bob, 12 + side * (10 - k * 2), 2 + k * 5 - (bob * side), 'v')
            c.ln(12, 10 + bob, 12 + side * (9 - k * 2), 3 + k * 5 - (bob * side), 'V')
    c.ell(12, 11 + bob, 4, 5, 'G'); c.ell(11, 9 + bob, 2, 2, 'Y')
    c.ln(10, 12 + bob, 14, 15 + bob, 'k')
    c.ell(12, 5 + bob, 3, 2.6, 'G'); c.p(11, 5 + bob, 'r' if glow else 'k'); c.p(13, 5 + bob, 'r' if glow else 'k')
    c.ell(12, 1 + bob, 3.5, 1, 'Y')
    c.ln(12, 16 + bob, 12, 21, 'g')
    return c.done(sp('Y', [(0, 14), (23, 14), (12, 23), (3, 0), (20, 0)]) if atk else ())


def broodmother(st):
    bob, step, glow, atk, dead = S(st)
    c = Cv(24)
    for side in (-1, 1):
        for k in range(4):
            kx = 12 + side * (6 + k * 1.5)
            c.ln(12 + side * 4, 12 + bob, round(kx), 6 + k * 2 + step * side, 'g')
            c.ln(round(kx), 6 + k * 2 + step * side, round(kx + side * 3), 21 + k % 2, 'G')
    c.rect(7, 8 + bob, 16, 16 + bob, 'G'); c.rect(7, 8 + bob, 9, 16 + bob, 'Y')   # great reliquary
    c.rect(10, 10 + bob, 14, 14 + bob, 'p' if glow else 'k')
    c.rect(11, 11 + bob, 13, 13 + bob, 'b')
    c.rect(8, 5 + bob, 15, 7 + bob, 'g'); c.rect(10, 3 + bob, 13, 4 + bob, 'G'); c.p(11, 2 + bob, 'Y')
    for x in (8, 15):
        c.ell(x, 18 + bob, 1.3, 1.3, 'b')                                         # egg-sacs of bone
    return c.done(sp('p', [(12, 0), (0, 4), (23, 4), (2, 23), (21, 23)]) if atk else ())


# ------------------------------------------------------------ registration
make(SMALL, 'anchor_bearer', AB, 16, anchor_bearer, biome='shore')
make(SMALL, 'lens_moth', LM, 16, lens_moth, biome='shore')
make(SMALL, 'mourning_willow', MW, 16, mourning_willow, biome='fen')
make(SMALL, 'grave_leech', GL, 16, grave_leech, biome='fen')
make(SMALL, 'frost_skald', FS, 16, frost_skald, biome='runeholt')
make(SMALL, 'wolf_shield', WS, 16, wolf_shield, biome='runeholt')
make(SMALL, 'cherub_husk', CH, 16, cherub_husk, biome='godfall')
make(SMALL, 'reliquary_spider', RS, 16, reliquary_spider, biome='godfall')

make(BIG, 'lighthouse_jelly', b1.LJ, 24, lighthouse_jelly, biome='shore', of='lantern_jelly')
make(BIG, 'salt_matriarch', dict(b2.SW, K=b2.SW['K']), 24, salt_matriarch, biome='shore', of='salt_widow')
make(BIG, 'trap_hound_alpha', dict(b2.TH, K='#5E7088'), 24, trap_hound_alpha, biome='shore', of='trap_hound')
make(BIG, 'anchor_titan', AB, 24, anchor_titan, biome='shore', of='anchor_bearer')
make(BIG, 'moth_queen', LM, 24, moth_queen, biome='shore', of='lens_moth')
make(BIG, 'great_bell', b1.BT, 24, great_bell, biome='fen', of='bell_taken')
make(BIG, 'peat_martyr', b1.PS, 24, peat_martyr, biome='fen', of='peat_saint')
make(BIG, 'mire_chorus', b2.MC, 24, mire_chorus, biome='fen', of='mire_choir')
make(BIG, 'twin_lamp_heron', b2.LH, 24, twin_lamp_heron, biome='fen', of='lantern_heron')
make(BIG, 'tallow_matron', dict(b2.CM, G='#8DB03A', Y='#F4FFC8'), 24, tallow_matron, biome='fen', of='candle_mite')
make(BIG, 'elder_willow', MW, 24, elder_willow, biome='fen', of='mourning_willow')
make(BIG, 'leech_prime', GL, 24, leech_prime, biome='fen', of='grave_leech')
make(BIG, 'glacier_headsman', b1.FE, 24, glacier_headsman, biome='runeholt', of='frozen_executioner')
make(BIG, 'wheel_abbot', b2.PM, 24, wheel_abbot, biome='runeholt', of='prayer_monk')
make(BIG, 'elder_hush', b2.AH, 24, elder_hush, biome='runeholt', of='antlered_hush')
make(BIG, 'saga_singer', FS, 24, saga_singer, biome='runeholt', of='frost_skald')
make(BIG, 'shieldwall_pack', WS, 24, shieldwall_pack, biome='runeholt', of='wolf_shield')
make(BIG, 'hollow_jarl', vc.PAL_B, 24, hollow_jarl, biome='godfall', of='hollow_thane')
make(BIG, 'halo_glutton', b2.HE, 24, halo_glutton, biome='godfall', of='halo_eater')
make(BIG, 'cathedral_engine', b2.CE, 24, cathedral_engine, biome='godfall', of='choir_engine')
make(BIG, 'seraph_husk', dict(CH, V='#B8B0C8'), 24, seraph_husk, biome='godfall', of='cherub_husk')
make(BIG, 'broodmother', RS, 24, broodmother, biome='godfall', of='reliquary_spider')
