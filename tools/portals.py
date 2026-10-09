"""Portals - every destination has its own silhouette, 16x16, 3 animation frames."""
import math
from pixlib import blank, outline

PAL = {'o': '#140F14', 's': '#6E6A86', 'S': '#B2ACCA', 'c': '#3BEFFF', 'C': '#CFFFFF', 'v': '#6A34C0', 'V': '#B888FF',
       'k': '#2E2A38', 'i': '#4F4B60', 'I': '#8E8AA6', 'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8',
       't': '#4E6670', 'T': '#8AB4BE', 'p': '#FF8FBF', 'P': '#FFE3F0', 'w': '#1E5078', 'b': '#C8C0B0', 'B': '#EDE6D2',
       'r': '#6A0A1A', 'R': '#FF4A5A', 'g': '#A8792A', 'G': '#F2C14E', 'q': '#3A1A6A', 'Q': '#F4EDFF'}


class Cv:
    def __init__(self):
        self.g = blank(16, 16)

    def p(self, x, y, ch):
        if 0 <= x < 16 and 0 <= y < 16:
            self.g[y][x] = ch

    def swirl(self, cx, cy, rx, ry, cols, f, arms=3):
        """an animated vortex: spiral arms rotate with the frame"""
        for y in range(16):
            for x in range(16):
                dx, dy = (x - cx) / rx, (y - cy) / ry
                d = math.hypot(dx, dy)
                if d > 1:
                    continue
                a = math.atan2(dy, dx)
                band = (a * arms / math.tau + d * 2.2 - f * 0.34) % 1
                self.g[y][x] = cols[0] if d < 0.28 else cols[1] if band < 0.33 else cols[2] if band < 0.66 else cols[3]

    def done(self):
        outline(self.g)
        return [''.join(r) for r in self.g]


def realm(f):
    c = Cv()
    c.swirl(8, 8, 5, 6, ['C', 'c', 'v', 'V'], f)                       # cyan-violet vortex
    for x0 in (1, 13):                                                   # flanking runestones
        for y in range(3, 15):
            c.p(x0, y, 'S'); c.p(x0 + 1, y, 's')
        c.p(x0, 2, 'S'); c.p(x0 + (1 if x0 == 1 else 0), 6 + f, 'c'); c.p(x0 + (1 if x0 == 1 else 0), 10 - f, 'c')
    for x in range(1, 15):
        c.p(x, 15, 's')
    return c.done()


def forge(f):
    c = Cv()
    for y in range(2, 16):                                               # iron hatch
        for x in range(2, 14):
            c.p(x, y, 'i' if x in (2, 13) or y in (2, 15) else 'k')
    c.swirl(8, 9, 4, 4.5, ['W', 'Y', 'M', 'm'], f)                        # molten swirl through the grate
    for x, y in ((3, 3), (12, 3), (3, 14), (12, 14), (3, 8), (12, 8)):
        c.p(x, y, 'I')                                                   # rivets
    for x in range(5, 11):
        c.p(x, 1, 'i'); c.p(x, 0, 'k' if x % 2 else 'i')                  # hood
    c.p(7 + f % 2, 0, 'Y')
    return c.done()


def chapel(f):
    c = Cv()
    for y in range(1, 16):                                               # gothic pointed arch
        half = 6 if y > 5 else max(1, round(6 * math.sin((y / 5) * math.pi / 2)))
        for x in range(8 - half, 8 + half):
            edge = x in (8 - half, 8 + half - 1) or y == 1
            c.p(x, y, 'T' if edge else '.')
    c.swirl(8, 9.5, 4, 5.5, ['P', 'p', 'c', 't'], f, arms=4)             # stained-glass swirl
    for y in range(4, 16):
        c.p(8 - 6 if y > 5 else 3, y, 'T')
    for k in range(3):
        c.p(5 + k * 3, 15 - ((f + k) % 3), 'w')                          # seawater dripping
    return c.done()


def heart(f):
    c = Cv()
    c.swirl(8, 9, 3.6 + (f == 1) * 0.5, 4.2 + (f == 1) * 0.5, ['W', 'R', 'r', 'G'], f, arms=2)   # pulsing heart-light
    for side in (-1, 1):                                                 # ribs arching over it
        for k in range(4):
            r0 = 4 + k * 1.2
            for t in range(12):
                a = math.pi / 2 + side * (t / 11) * math.pi * 0.55
                x = round(8 + math.cos(a) * r0 * 1.15 * -side * -1 * side + side * 0)
                x = round(8 - side * math.cos(math.pi / 2 - (t / 11) * math.pi * 0.55) * r0)
                y = round(15 - math.sin(math.pi / 2 - (t / 11) * math.pi * 0.55) * (r0 + 3))
                c.p(x, y, 'B' if k % 2 else 'b')
    for y in range(3, 16):
        c.p(8, y, 'g') if y % 3 == 0 else None                           # spine, gold-banded
    return c.done()


def vault(f):
    c = Cv()
    for y in range(16):                                                  # round vault door
        for x in range(16):
            d = math.hypot(x - 7.5, y - 8)
            if d <= 7.2:
                c.p(x, y, 'i' if d > 6 else 'q' if d > 4.6 else 'v')
    for k in range(8):                                                   # bolts turning with the frame
        a = k / 8 * math.tau + f * 0.25
        c.p(round(7.5 + math.cos(a) * 6.5), round(8 + math.sin(a) * 6.5), 'I')
    c.swirl(7.5, 8, 4, 4, ['Q', 'V', 'v', 'q'], f, arms=2)
    for y in range(6, 11):                                               # keyhole
        c.p(7, y, 'o'); c.p(8, y, 'o')
    c.p(7, 6, 'Q'); c.p(8, 6, 'Q')
    return c.done()


def nexus(f):
    c = Cv()
    c.swirl(8, 8, 4.5, 4.5, ['W', 'Y', 'G', 'g'], f, arms=4)              # gold sun-ring
    for k in range(12):
        a = k / 12 * math.tau + f * 0.13
        L = 7 if k % 2 else 6
        c.p(round(8 + math.cos(a) * L), round(8 + math.sin(a) * L), 'G' if k % 2 else 'W')
    return c.done()


def closed(f):
    g = forge(0)
    return [r.replace('Y', 'I').replace('M', 'i').replace('W', 'I').replace('m', 'k') for r in g]


def scriptorium(f):
    c = Cv()
    c.swirl(8, 9, 4.2, 5, ['C', 'c', 'w', 'V'], f, arms=3)                # a cold vortex
    cols = ['m', 'R', 'g', 'v', 'w', 't']
    for k in range(9):                                                   # an arch built of stacked books
        a = math.pi + k / 8 * math.pi
        x, y = round(8 + math.cos(a) * 6.2), round(9 + math.sin(a) * 7.2)
        c.p(x, y, cols[k % len(cols)]); c.p(x + (1 if k < 4 else -1), y, cols[(k + 2) % len(cols)])
    for y in range(9, 16):
        c.p(1, y, 'm' if y % 2 else 'g'); c.p(14, y, 'R' if y % 2 else 'v')
    c.p(8, 1, 'C' if f == 1 else 'c')                                    # a frost-light at the keystone
    return c.done()


def crypt(f):
    """a sunken tomb door: a squat stone lintel over drowned green soul-light"""
    c = Cv()
    for y in range(3, 16):
        for x in range(3, 13):
            c.p(x, y, 'i' if x in (3, 12) or y == 3 else '.')
    for x in range(2, 14):
        c.p(x, 2, 'I'); c.p(x, 3, 'i')
    c.swirl(8, 10, 3.8, 5.2, ['Q', 'T', 'c', 'w'], f, arms=2)
    for k in range(3):
        c.p(4 + k * 3, 4 + ((f + k) % 3), 'B')                             # a candle stub flickering on the lintel
    return c.done()


def ember(f):
    """a forge mouth: an iron frame around a churning pit of molten light"""
    c = Cv()
    for y in range(2, 16):
        for x in range(2, 14):
            c.p(x, y, 'k' if x in (2, 13) or y == 2 else '.')
    for x in range(1, 15):
        c.p(x, 1, 'I'); c.p(x, 2, 'i')
    c.swirl(8, 9.5, 4.4, 5.6, ['W', 'Y', 'M', 'm'], f, arms=3)
    for k in range(3):
        c.p(4 + k * 4, 15 - ((f + 2 * k) % 3), 'Y')                         # sparks spitting out
    return c.done()


KINDS = {'scriptorium': scriptorium, 'realm': realm, 'dungeon': forge, 'nexus': nexus, 'closed': closed, 'chapel': chapel, 'heart': heart, 'vault': vault, 'crypt': crypt, 'ember': ember}
