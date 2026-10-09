"""The Nexus as a quaint hamlet at dusk: a firepit at the heart of town,
cottages with lit windows, a smithy, an inn, oaks, lamp posts and a training yard.

SMALL: 16x16 props (some animated: name -> list of frames)
BIG:   32x32 buildings/trees (drawn bottom-centred, 2-tile solid base)
"""
from drawkit import Cv

PAL = {
    'o': '#1A1218', 'd': '#0C080E',
    'w': '#4A3020', 'W': '#7A5232', 'v': '#B07A44',          # wood dark / mid / light
    's': '#4E4A5A', 'S': '#7E7A8C', 'T': '#B4B0C2',          # stone
    'r': '#5A1A1E', 'R': '#9A3028', 'Q': '#D05A38',          # roof shingles
    'h': '#7A5A24', 'H': '#B8903E', 'J': '#E4C46A',          # thatch / hay
    'p': '#B8A688', 'P': '#E4D6B6',                          # plaster
    'y': '#E89A2A', 'Y': '#FFD86A', 'X': '#FFF6D0',          # warm light
    'f': '#B0300C', 'F': '#F2641A',                          # fire
    'l': '#1E3A1C', 'L': '#2E5426', 'g': '#4E7E34', 'G': '#7EAE48', 'K': '#A8D060',   # leaves
    'i': '#2A2632', 'I': '#4F4B60', 'k': '#8E8AA6',          # iron
    'x': '#C0283A', 'e': '#F0E6D0',                          # target paint
    'm': '#E05A8A', 'n': '#F0D04A', 'b': '#8A6AE0', 'c': '#2E5A8A', 'C': '#5A8AC8',   # flowers, cloth
    'u': '#1E5078', 'U': '#5EA8D8',                          # water
}


# ---------------------------------------------------------------- 16x16 props
def campfire(f):
    c = Cv()
    for k, (x, y) in enumerate(((3, 13), (5, 14), (8, 14), (11, 14), (12, 12), (4, 11), (12, 10), (3, 9))):
        c.rect(x, y, x + 1, y, 'S' if k % 2 else 's')               # ring of stones
    c.ln(4, 13, 11, 10, 'w'); c.ln(4, 10, 11, 13, 'W')               # crossed logs
    c.ln(5, 12, 10, 12, 'v')
    flames = [[(7, 3), (8, 4), (6, 5)], [(8, 2), (7, 4), (9, 5)], [(7, 2), (8, 3), (6, 4)]][f]
    c.trap(5, 11, 7, 8, 5, 10, 'f')
    c.trap(6, 11, 7, 8, 6, 9, 'F')
    c.trap(8, 11, 7, 8, 7, 8, 'Y')
    c.p(7 + (f == 1), 10, 'X')
    for x, y in flames:
        c.p(x, y, 'F')
    c.p(flames[0][0], flames[0][1] - 1, 'Y')
    return c.done(late=[(4 + f * 3, 1 - (f == 2), 'Y'), (11 - f * 2, 3, 'F')])


def lamppost(f):
    c = Cv()
    c.rect(7, 5, 8, 14, 'i'); c.rect(7, 5, 7, 14, 'I')
    c.rect(5, 15, 10, 15, 'i')
    c.rect(5, 1, 10, 1, 'i'); c.p(7, 0, 'I')                          # cap
    c.rect(5, 2, 10, 4, 'Y' if f else 'y'); c.rect(6, 2, 9, 3, 'X' if f else 'Y')
    c.p(5, 2, 'i'); c.p(10, 2, 'i'); c.p(5, 4, 'i'); c.p(10, 4, 'i')
    c.rect(4, 7, 11, 7, 'i')                                          # cross-arm
    c.p(11, 8, 'm'); c.p(4, 8, 'G'); c.p(11, 9, 'G')                  # hanging flower basket
    return c.done()


def bench_h():
    c = Cv()
    c.rect(1, 9, 14, 12, 'W'); c.rect(1, 9, 14, 9, 'v'); c.rect(1, 12, 14, 12, 'w')
    for x in (3, 7, 11):
        c.p(x, 10, 'w'); c.p(x + 1, 11, 'w')                          # bark
    c.ell(1, 10.5, 1, 1.6, 'v'); c.p(1, 10, 'h'); c.ell(14, 10.5, 1, 1.6, 'v'); c.p(14, 11, 'h')   # ring-cut ends
    c.rect(2, 13, 3, 14, 'w'); c.rect(12, 13, 13, 14, 'w')
    return c.done()


def bench_v():
    c = Cv()
    c.rect(6, 1, 9, 14, 'W'); c.rect(6, 1, 6, 14, 'v'); c.rect(9, 1, 9, 14, 'w')
    for y in (3, 7, 11):
        c.p(7, y, 'w'); c.p(8, y + 1, 'w')
    c.ell(7.5, 1, 1.8, 1, 'v'); c.p(7, 1, 'h')
    return c.done()


def fence_h():
    c = Cv()
    for x in (1, 7, 13):
        c.rect(x, 6, x + 1, 13, 'W'); c.p(x, 6, 'v'); c.p(x, 5, 'v')
    c.rect(0, 8, 15, 8, 'v'); c.rect(0, 11, 15, 11, 'W')
    return c.done()


def fence_v():
    c = Cv()
    c.rect(7, 0, 8, 15, 'W'); c.rect(7, 0, 7, 15, 'v')
    for y in (2, 9):
        c.rect(6, y, 9, y + 1, 'w')
    return c.done()


def barrel():
    c = Cv()
    c.trap(4, 14, 5, 10, 4, 11, 'W'); c.ell(7.5, 4, 3, 1.4, 'w'); c.ell(7.5, 4, 2, 0.8, 'v')
    for y in (6, 11):
        c.rect(4, y, 11, y, 'I')
    c.rect(4, 5, 4, 13, 'v'); c.rect(10, 5, 11, 13, 'w')
    return c.done()


def crate():
    c = Cv()
    c.rect(3, 5, 12, 14, 'W'); c.rect(3, 5, 12, 5, 'v'); c.rect(3, 5, 3, 14, 'v'); c.rect(12, 6, 12, 14, 'w')
    c.ln(4, 6, 11, 13, 'w'); c.ln(4, 13, 11, 6, 'w')
    c.rect(3, 9, 12, 9, 'w')
    c.p(5, 3, 'G'); c.p(6, 4, 'm'); c.p(9, 4, 'n'); c.p(10, 3, 'G')    # vegetables poking out
    return c.done()


def haybale():
    c = Cv()
    c.ell(7.5, 10, 6, 4, 'H'); c.ell(6, 9, 3.5, 2, 'J', only='H')
    for x in (3, 6, 9, 12):
        c.p(x, 12, 'h'); c.p(x + 1, 11, 'h')
    c.rect(2, 10, 13, 10, 'w')
    c.p(4, 5, 'J'); c.p(10, 5, 'J')
    return c.done()


def signpost():
    c = Cv()
    c.rect(7, 4, 8, 15, 'W'); c.rect(7, 4, 7, 15, 'v')
    c.rect(2, 3, 12, 6, 'W'); c.rect(2, 3, 12, 3, 'v'); c.p(13, 4, 'W'); c.p(14, 5, 'W'); c.p(13, 5, 'W')   # arrow board
    c.rect(4, 4, 10, 4, 'w'); c.rect(4, 5, 8, 5, 'w')                # carved letters
    c.rect(1, 9, 9, 11, 'W'); c.p(0, 10, 'W'); c.rect(2, 9, 9, 9, 'v'); c.rect(3, 10, 7, 10, 'w')
    return c.done()


def pine():
    c = Cv()
    c.rect(7, 12, 8, 15, 'w')
    for k, (y, w) in enumerate(((1, 1), (3, 2), (5, 3), (7, 4), (9, 5), (11, 6))):
        c.rect(8 - w, y, 7 + w, y + 1, 'L' if k % 2 else 'g')
        c.p(8 - w, y + 1, 'G'); c.p(7 + w, y + 1, 'l')
    c.p(7, 0, 'G')
    return c.done()


def bush():
    c = Cv()
    c.ell(7.5, 10, 6.5, 4.5, 'L'); c.ell(6, 9, 4, 3, 'g', only='L'); c.ell(5, 8, 2, 1.5, 'G', only='g')
    for x, y in ((4, 11), (9, 9), (11, 12), (6, 13)):
        c.p(x, y, 'm' if x % 2 else 'n')                              # berries / blossoms
    return c.done()


def stump():
    c = Cv()
    c.ell(7.5, 10, 4, 2, 'W'); c.rect(4, 10, 11, 13, 'W'); c.ell(7.5, 10, 4, 2, 'v'); c.ell(7.5, 10, 2, 1, 'h')
    c.rect(4, 10, 4, 13, 'w'); c.p(3, 13, 'w'); c.p(12, 13, 'w')
    c.p(11, 9, 'b'); c.p(12, 8, 'b')                                  # a mushroom
    return c.done()


def well():
    c = Cv()
    c.ell(7.5, 11, 6, 3.5, 'S'); c.ell(7.5, 10.5, 4.2, 2, 'u'); c.ell(6.5, 10, 2, 0.8, 'U', only='u')
    for x in (2, 5, 8, 11, 13):
        c.p(x, 13, 's'); c.p(x + 1, 14, 's')                          # stone courses
    c.rect(2, 3, 2, 11, 'W'); c.rect(13, 3, 13, 11, 'W')               # posts
    c.trap(0, 3, 7, 8, 0, 15, 'R'); c.rect(1, 2, 14, 2, 'Q'); c.rect(0, 3, 15, 3, 'r')   # little roof
    c.ln(3, 5, 12, 5, 'w')                                            # winch
    c.rect(7, 6, 8, 8, 'I'); c.rect(6, 8, 9, 9, 'W')                  # bucket on the rope
    return c.done()


def thrall(f):
    """a bone thrall: a little skeleton with soul-fire in its eyes and claws for hands.
    frames: 0/1 scuttling, 2 claws raised, 3 the slash"""
    p2 = dict(PAL, c='#5EF0C8', C='#E0FFF6', q='#1F7A6A', b='#ECE4CC', B='#9A9078', k='#0A0A0E')
    c = Cv()
    by = -1 if f == 1 else 0
    lean = 1 if f == 3 else 0
    # skull: big, cracked, two burning sockets
    hx = 5 + lean
    c.rect(hx, 1 + by, hx + 4, 4 + by, 'b'); c.rect(hx + 1, 0 + by, hx + 3, 0 + by, 'b')
    c.rect(hx + 3, 2 + by, hx + 4, 4 + by, 'B')
    c.p(hx + 1, 2 + by, 'C' if f >= 2 else 'c'); c.p(hx + 3, 2 + by, 'C' if f >= 2 else 'c')   # eyes
    c.p(hx + 1, 3 + by, 'k'); c.p(hx + 3, 3 + by, 'k'); c.p(hx + 2, 3 + by, 'B')
    c.rect(hx + 1, 5 + by, hx + 3, 5 + by, 'B'); c.p(hx + 2, 5 + by, 'k')                        # jaw, gaping
    c.p(hx + 4, 1 + by, 'k')                                                                    # a crack
    # spine + ribs + pelvis
    c.rect(7 + lean, 6 + by, 7 + lean, 11, 'B')
    for y in (7, 9):
        c.rect(5 + lean, y + by, 9 + lean, y + by, 'b'); c.p(7 + lean, y + by, 'B')
    c.rect(6 + lean, 8 + by, 8 + lean, 8 + by, 'k')
    c.rect(5, 11, 9, 11, 'b')
    # legs
    if f == 0:
        c.ln(6, 12, 4, 15, 'b'); c.ln(8, 12, 10, 15, 'B'); c.p(3, 15, 'b'); c.p(11, 15, 'B')
    elif f == 1:
        c.ln(6, 12, 6, 15, 'b'); c.ln(8, 12, 8, 15, 'B'); c.p(5, 15, 'b'); c.p(9, 15, 'B')
    else:
        c.ln(6, 12, 4, 15, 'b'); c.ln(8, 12, 9, 15, 'B'); c.p(3, 15, 'b'); c.p(10, 15, 'B')
    # arms + claws
    if f in (0, 1):
        sw = 1 if f == 0 else -1
        c.ln(5, 7 + by, 3, 10 + by + sw, 'b'); c.ln(10, 7 + by, 12, 10 + by - sw, 'B')
        for dx in (-1, 0, 1):
            c.p(3 + dx, 11 + by + sw, 'b'); c.p(12 + dx, 11 + by - sw, 'B')
    elif f == 2:                                                        # claws raised over the skull
        c.ln(5, 7, 2, 2, 'b'); c.ln(10, 7, 13, 2, 'B')
        for dx in (-1, 0, 1):
            c.p(2 + dx, 1, 'b'); c.p(13 + dx, 1, 'B')
    else:                                                               # the slash, forward and down
        c.ln(6, 7, 11, 11, 'b'); c.ln(10, 7, 13, 12, 'B')
        for dx in (0, 1, 2):
            c.p(11 + dx, 12, 'b'); c.p(13, 11 + dx, 'B')
    # the soul trailing off it
    late = [(2, 9 - f % 2, 'q'), (1, 7, 'c')] if f < 2 else [(1, 4, 'c'), (14, 5, 'C')] if f == 2 else [(14, 9, 'C'), (15, 11, 'c'), (12, 14, 'C'), (14, 13, 'c')]
    return c.done(late=late), p2


def chest(open_=False):
    c = Cv()
    c.rect(2, 8, 13, 14, 'W'); c.rect(2, 8, 13, 8, 'v'); c.rect(2, 14, 13, 14, 'w')
    for x in (2, 7, 13):
        c.rect(x, 8, x, 14, 'H')                                      # gold bands
    c.rect(2, 11, 13, 11, 'H'); c.rect(7, 10, 8, 12, 'Y'); c.p(7, 11, 'd')   # lock
    if open_:
        c.rect(2, 2, 13, 5, 'w'); c.rect(2, 2, 13, 2, 'W'); c.rect(2, 5, 13, 5, 'H')   # lid thrown back
        c.rect(3, 6, 12, 7, 'Y'); c.p(5, 6, 'X'); c.p(9, 7, 'X'); c.p(11, 6, 'J')       # gold inside, glowing
    else:
        c.trap(4, 7, 3, 12, 2, 13, 'W'); c.rect(3, 4, 12, 4, 'v'); c.rect(2, 7, 13, 7, 'H')
        for x in (2, 7, 13):
            c.rect(x, 5, x, 7, 'H')
    return c.done(late=[(6, 0, 'Y'), (10, 1, 'X')] if open_ else [])


SMALL = {
    'chest': [chest()], 'chest_open': [chest(True)],
    'campfire': [campfire(0), campfire(1), campfire(2)],
    'lamppost': [lamppost(0), lamppost(1)],
    'bench_h': [bench_h()], 'bench_v': [bench_v()], 'fence_h': [fence_h()], 'fence_v': [fence_v()],
    'barrel': [barrel()], 'crate': [crate()], 'haybale': [haybale()], 'signpost': [signpost()],
    'pine': [pine()], 'bush': [bush()], 'stump': [stump()], 'well': [well()],
}
THRALL = [thrall(0), thrall(1), thrall(2), thrall(3)]


def storm_kite(f):
    """the Stormwright's kite turret: a diamond kite crackling with stored lightning"""
    p2 = dict(PAL, k='#2E5A8A', K='#8AC8FF', L='#FFFFFF', l='#8AF6FF')
    c = Cv()
    for y in range(1, 11):
        w = y if y <= 4 else 10 - y
        c.rect(8 - w, y, 7 + w, y, 'k' if (y + f) % 3 else 'K')
    c.ln(8, 1, 8, 10, 'e'); c.ln(4, 4, 11, 4, 'e')
    for x, y in ((8, 11), (7 + f, 12), (8, 13), (9 - f, 14)):
        c.p(x, y, 'e' if (x + y) % 2 else 'x')
    late = [(2 + f * 10, 2, 'l'), (13 - f * 10, 7, 'L'), (8, 0, 'L' if f else 'l')]
    return c.done(late=late), p2


KITE = [storm_kite(0), storm_kite(1)]


def shrine(f, gem, glow):
    """a wayside shrine: a carved standing stone, a gem in its face, offerings at its foot"""
    p2 = dict(PAL, q=gem, Q=glow)
    c = Cv()
    c.trap(2, 13, 5, 10, 4, 11, 'S'); c.rect(4, 2, 4, 13, 'T'); c.rect(10, 4, 11, 13, 's')
    c.rect(6, 1, 9, 1, 'S'); c.p(7, 0, 'T')
    c.ell(7.5, 6, 1.6, 2, 'q'); c.p(7, 5, 'Q' if f else 'q'); c.p(8, 6, 'Q')
    for x in (6, 9):
        c.p(x, 9, 's'); c.p(x, 10, 's')                                # carved runes
    c.rect(2, 14, 13, 15, 's'); c.rect(3, 14, 12, 14, 'S')               # plinth
    c.p(3, 13, 'y'); c.p(12, 13, 'm'); c.p(11, 12, 'n')                  # candles, flowers
    return c.done(late=[(7, 3, 'Q'), (3, 12, 'Y')] if f else [(3, 12, 'y')]), p2


SHRINES = {'shore': ('#3BC8E8', '#CFFFFF'), 'fen': ('#8DB03A', '#E8FF9A'), 'runeholt': ('#B888FF', '#F4EDFF'), 'godfall': ('#F2641A', '#FFE45C')}
SHRINE_ART = {b: [shrine(f, *cols) for f in (0, 1)] for b, cols in SHRINES.items()}


# ---------------------------------------------------------------- 32x32 buildings + trees
def cottage(kind='shop'):
    c = Cv(32, 32)
    # walls: plaster between dark timber
    c.rect(4, 15, 27, 30, 'p'); c.rect(4, 15, 27, 16, 'P')
    for x in (4, 11, 20, 27):
        c.rect(x, 15, x, 30, 'w')
    c.rect(4, 22, 27, 22, 'w'); c.ln(4, 30, 11, 22, 'w'); c.ln(27, 30, 20, 22, 'w')
    c.rect(3, 31, 28, 31, 's')                                        # stone footing
    # roof: steep, red shingles, overhanging
    c.trap(2, 15, 15, 16, 1, 30, 'R')
    for y in range(4, 16, 2):
        for x in range(1, 31):
            if c.get(x, y) == 'R' and (x + y // 2) % 3 == 0:
                c.p(x, y, 'r')
    c.ln(15, 2, 1, 15, 'Q'); c.ln(16, 2, 30, 15, 'r')
    c.rect(0, 15, 31, 15, 'r')
    c.rect(22, 0, 24, 8, 's'); c.rect(22, 0, 22, 8, 'S'); c.rect(21, 0, 25, 0, 'S')   # chimney
    # door + windows
    c.rect(14, 22, 17, 30, 'w'); c.rect(15, 23, 16, 30, 'y'); c.p(15, 23, 'Y'); c.p(17, 26, 'n')
    c.rect(13, 21, 18, 21, 'w')
    for x0 in (6, 22):
        c.rect(x0, 17, x0 + 3, 20, 'y'); c.rect(x0, 17, x0 + 1, 18, 'Y'); c.p(x0, 17, 'X')
        c.rect(x0 + 1, 17, x0 + 1, 20, 'w'); c.rect(x0, 18, x0 + 3, 18, 'w')
        c.rect(x0 - 1, 21, x0 + 4, 21, 'W')                           # flower box
        c.p(x0, 20, 'm'); c.p(x0 + 2, 20, 'n'); c.p(x0 + 3, 20, 'b')
    if kind == 'shop':                                                 # hanging coin sign
        c.rect(25, 23, 30, 23, 'w'); c.rect(27, 24, 30, 27, 'W'); c.rect(28, 25, 29, 26, 'Y')
    if kind == 'inn':                                                  # a mug on the sign, thatched instead of shingled
        c.recolor({'R': 'H', 'r': 'h', 'Q': 'J'})
        c.rect(0, 23, 4, 23, 'w'); c.rect(0, 24, 3, 28, 'W'); c.rect(1, 25, 2, 27, 'n'); c.p(3, 26, 'P')
    return c.done()


def smithy():
    c = Cv(32, 32)
    c.rect(3, 14, 28, 30, 's')                                        # stone walls
    for y in range(15, 31, 3):
        for x in range(3, 29, 5):
            c.p(x + (y // 3) % 2 * 2, y, 'S')
    c.rect(3, 14, 28, 14, 'T')
    c.trap(4, 14, 14, 26, 1, 30, 'i')                                 # slate roof, lop-sided
    for y in range(5, 14, 2):
        for x in range(1, 31, 3):
            if c.get(x, y) == 'i':
                c.p(x, y, 'I')
    c.ln(14, 4, 1, 14, 'k')
    c.rect(22, 0, 26, 12, 's'); c.rect(22, 0, 22, 12, 'S'); c.rect(21, 0, 27, 1, 'S')   # big chimney
    c.rect(23, 0, 25, 0, 'F')                                          # glowing chimney mouth
    # open forge mouth
    c.rect(7, 18, 18, 30, 'd'); c.rect(8, 22, 17, 30, 'f'); c.rect(9, 24, 16, 30, 'F'); c.rect(11, 26, 14, 30, 'Y')
    c.rect(7, 18, 18, 18, 'w'); c.rect(7, 18, 7, 30, 'w'); c.rect(18, 18, 18, 30, 'w')
    # an anvil outside
    c.rect(21, 25, 27, 26, 'I'); c.rect(20, 25, 21, 25, 'I'); c.rect(23, 27, 25, 29, 'i'); c.rect(22, 30, 26, 30, 'i'); c.rect(21, 25, 26, 25, 'k')
    c.rect(22, 18, 26, 21, 'W'); c.rect(23, 19, 25, 20, 'i')           # sign: hammer
    return c.done()


def oak():
    c = Cv(32, 32)
    c.trap(18, 30, 13, 18, 11, 20, 'w'); c.rect(14, 18, 15, 30, 'W')   # trunk + roots
    c.p(10, 31, 'w'); c.p(21, 31, 'w'); c.rect(11, 30, 20, 30, 'w')
    for cx, cy, r in ((9, 12, 7), (22, 12, 7), (15, 7, 8), (16, 15, 8), (7, 17, 5), (25, 17, 5)):
        c.ell(cx, cy, r, r * 0.85, 'L')
    for cx, cy, r in ((8, 10, 4), (14, 5, 5), (21, 9, 4)):
        c.ell(cx, cy, r, r * 0.8, 'g', only='L')
    for cx, cy, r in ((7, 9, 2), (13, 4, 2.5), (20, 7, 2)):
        c.ell(cx, cy, r, r * 0.8, 'G', only='g')
    for x, y in ((10, 19), (19, 20), (25, 14), (5, 15), (17, 18), (22, 18)):
        c.p(x, y, 'l')
    for x, y in ((12, 10), (19, 13), (8, 15), (24, 11)):
        c.p(x, y, 'K')
    return c.done()


def market():
    """the Salt-Peddler's market stall: striped awning, crates of wares"""
    c = Cv(32, 32)
    c.rect(3, 12, 4, 30, 'W'); c.rect(27, 12, 28, 30, 'W')             # posts
    c.trap(6, 12, 3, 28, 1, 30, 'C')
    for x in range(1, 31):
        for y in range(6, 13):
            if c.get(x, y) == 'C' and (x // 3) % 2:
                c.p(x, y, 'e')
    for x in range(1, 31, 3):
        c.p(x, 13, 'C'); c.p(x + 1, 13, 'C')                          # scalloped edge
    c.rect(2, 21, 29, 23, 'W'); c.rect(2, 21, 29, 21, 'v')             # counter
    c.rect(5, 18, 9, 20, 'n'); c.rect(12, 18, 15, 20, 'm'); c.rect(18, 19, 21, 20, 'G'); c.rect(23, 18, 26, 20, 'U')
    c.p(6, 17, 'Y'); c.p(13, 17, 'x'); c.p(24, 17, 'e')
    c.rect(3, 24, 28, 30, 'w')
    for x in range(4, 28, 6):
        c.rect(x, 25, x + 4, 29, 'W'); c.ln(x, 25, x + 4, 29, 'w')
    c.rect(14, 0, 17, 5, 'w'); c.rect(15, 1, 16, 4, 'Y')               # a lantern hung at the peak
    return c.done()


BIG = {'cottage': cottage('shop'), 'inn': cottage('inn'), 'house': cottage('house'), 'smithy': smithy(), 'oak': oak(), 'market': market()}


# ---------------------------------------------------------------- the training dummy (enemy sheet row: 7 frames)
def dummy(lean=0, hit=False):
    c = Cv()
    c.rect(7, 9, 8, 15, 'w'); c.rect(7, 9, 7, 15, 'W'); c.rect(5, 15, 10, 15, 'w')   # post on a little base
    c.ln(2 + lean, 6, 13 + lean, 6, 'W')                              # cross-arm
    c.p(1 + lean, 6, 'J'); c.p(14 + lean, 6, 'J'); c.p(1 + lean, 7, 'H'); c.p(14 + lean, 5, 'H')   # straw hands
    c.ell(7.5 + lean, 8, 3.5, 3.2, 'H'); c.ell(6.5 + lean, 7, 2, 1.6, 'J', only='H')   # straw sack body
    c.ell(7.5 + lean, 8.5, 2.1, 2.1, 'e'); c.ell(7.5 + lean, 8.5, 1.2, 1.2, 'x'); c.p(7 + lean, 8, 'e')   # target
    c.rect(5 + lean, 1, 10 + lean, 4, 'I'); c.rect(5 + lean, 1, 10 + lean, 1, 'k'); c.rect(4 + lean, 4, 11 + lean, 4, 'i')   # bucket helm
    c.p(6 + lean, 3, 'd'); c.p(9 + lean, 3, 'd')
    for x, y in ((4, 10), (11, 11), (5, 12)):
        c.p(x + lean, y, 'J')                                         # straw sticking out
    return c.done(late=[(12, 1, 'X'), (3, 2, 'X')] if hit else [])


DUMMY = [dummy(0), dummy(0), dummy(-1, True), dummy(1, True), dummy(0), dummy(1), dummy(-1)]
