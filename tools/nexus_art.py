"""Nexus props and NPCs (16x16, each with its own palette).

merchant  - the Salt-Peddler: a hunched trader under a towering pack of wares
smith     - the Ashwright: a one-armed smith with a hammer bigger than his torso
stall     - the peddler's awning and crates
furnace   - the forge's furnace mouth, glowing
banner    - a wine-and-gold hanging banner on a pole
statue    - a gilded class statue on a plinth (anvil, fist, sun)
"""
from pixlib import blank, line, outline


class Cv:
    def __init__(self):
        self.g = blank(16, 16)

    def p(self, x, y, ch):
        if 0 <= x < 16 and 0 <= y < 16:
            self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.p(x, y, ch)

    def ell(self, cx, cy, rx, ry, ch):
        for y in range(16):
            for x in range(16):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                    self.g[y][x] = ch

    def done(self):
        outline(self.g)
        return [''.join(r) for r in self.g]


def merchant():
    c = Cv()
    c.rect(4, 1, 12, 9, 'w'); c.rect(4, 1, 6, 9, 'W')                   # towering pack of wares
    for x, y, ch in ((7, 2, 'g'), (9, 3, 'r'), (11, 2, 'b'), (8, 6, 'y'), (10, 7, 'g'), (5, 5, 'r')):
        c.p(x, y, ch)
    c.rect(12, 0, 13, 4, 'k'); c.p(13, 5, 'y')                           # hanging lantern
    c.rect(4, 9, 9, 14, 'c'); c.rect(4, 9, 5, 14, 'C')                   # hooded cloak
    c.ell(7, 9, 2, 1.6, 'f'); c.p(6, 9, 'o'); c.p(8, 9, 'o')
    c.rect(5, 15, 6, 15, 'k'); c.rect(8, 15, 9, 15, 'k')
    c.p(10, 11, 'f'); c.p(11, 10, 'y')                                   # holding out a coin
    return c.done()


def smith():
    c = Cv()
    c.rect(4, 6, 10, 13, 'l'); c.rect(4, 6, 6, 13, 'L')                  # leather apron over a broad body
    c.rect(5, 8, 9, 8, 'k')
    c.ell(7, 4, 2.4, 2.2, 'f'); c.rect(5, 2, 9, 2, 'k')                  # soot cap
    c.p(6, 4, 'o'); c.p(8, 4, 'y')                                       # one eye catches the fire
    c.rect(5, 14, 6, 15, 'k'); c.rect(8, 14, 9, 15, 'k')
    c.p(3, 8, 'f'); c.p(3, 9, 'L')                                       # the stump of his left arm
    for k in range(7):                                                   # a hammer bigger than his torso
        c.p(11, 13 - k, 'w')
    c.rect(10, 2, 15, 5, 'i'); c.rect(10, 2, 15, 2, 'I'); c.p(15, 5, 'k')
    return c.done()


def stall():
    c = Cv()
    for x in range(1, 15):                                               # striped awning
        for y in range(2, 5):
            c.p(x, y, 'r' if (x // 2) % 2 else 'f')
    c.rect(1, 5, 14, 5, 'R')
    for x in (2, 13):
        c.rect(x, 5, x, 13, 'w')
    c.rect(3, 10, 12, 13, 'W'); c.rect(3, 10, 12, 10, 'w')               # counter + crates
    for x, ch in ((4, 'p'), (6, 'b'), (8, 'g'), (10, 'y')):
        c.p(x, 9, ch); c.p(x, 8, ch)                                     # potions on display
    return c.done()


def furnace():
    c = Cv()
    c.rect(2, 3, 13, 14, 'i'); c.rect(2, 3, 4, 14, 'I')                  # brick furnace
    for y in range(4, 14, 3):
        for x in range(2, 14):
            c.p(x, y, 'k')
    c.ell(8, 10, 3.5, 3, 'm'); c.ell(8, 10.5, 2.5, 2, 'M'); c.ell(8, 11, 1.2, 1, 'Y')   # the mouth
    c.rect(6, 0, 9, 3, 'k'); c.p(7, 0, 'M'); c.p(8, 1, 'Y')              # chimney spark
    return c.done()


def banner():
    c = Cv()
    c.rect(7, 0, 7, 15, 'w'); c.rect(4, 1, 11, 1, 'g')
    for y in range(2, 12):
        c.rect(4, y, 11, y, 'R' if y % 4 else 'r')
    c.p(4, 12, 'R'); c.p(5, 13, 'R'); c.p(10, 12, 'R'); c.p(11, 13, 'R')   # swallowtail
    c.rect(6, 5, 9, 8, 'g'); c.rect(7, 6, 8, 7, 'G')                     # gold sigil
    return c.done()


def statue(kind):
    c = Cv()
    c.rect(3, 12, 12, 15, 'i'); c.rect(3, 12, 12, 12, 'I')               # plinth
    if kind == 'anvil':
        c.rect(3, 4, 12, 5, 'G'); c.rect(1, 5, 4, 6, 'g'); c.rect(5, 6, 10, 7, 'g'); c.rect(6, 8, 9, 11, 'G')
        c.p(8, 4, 'Y')
    elif kind == 'fist':
        c.rect(4, 3, 11, 9, 'G'); c.rect(4, 3, 5, 9, 'Y')
        for x in (6, 8, 10):
            c.p(x, 4, 'g')
        c.rect(6, 10, 9, 11, 'g')
    else:                                                                # sun disc
        for y in range(16):
            for x in range(16):
                d = ((x - 7.5) ** 2 + (y - 6) ** 2) ** 0.5
                if 3 <= d <= 5:
                    c.p(x, y, 'G')
        c.rect(7, 9, 8, 11, 'g'); c.p(7, 6, 'Y'); c.p(8, 6, 'Y')
    return c.done()


PAL = {'o': '#160F14', 'w': '#5A3A22', 'W': '#8A5A34', 'g': '#4C8A50', 'r': '#9A2040', 'R': '#B0213F',
       'b': '#2E5AE8', 'y': '#FFE45C', 'k': '#2E2A38', 'c': '#3A4E58', 'C': '#5E7A86', 'f': '#E8DCC0',
       'l': '#4A2E22', 'L': '#7A4A30', 'i': '#4F4B60', 'I': '#8E8AA6', 'm': '#8C2A12', 'M': '#F2641A',
       'Y': '#FFF6C8', 'p': '#D8283C', 'G': '#F2C14E'}
PAL_GOLD = dict(PAL, g='#A8792A', G='#F2C14E', Y='#FFF4C2')

PROPS = {
    'merchant': (merchant(), PAL), 'smith': (smith(), PAL), 'stall': (stall(), PAL),
    'furnace': (furnace(), PAL), 'banner': (banner(), dict(PAL, g='#A8792A', G='#F2C14E')),
    'statue_anvil': (statue('anvil'), PAL_GOLD), 'statue_fist': (statue('fist'), PAL_GOLD), 'statue_sun': (statue('sun'), PAL_GOLD),
}
