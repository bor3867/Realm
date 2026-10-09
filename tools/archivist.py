"""THE ARCHIVIST - master of the Frozen Scriptorium (48x48, realm-boss sheet row).

It catalogued the god's death and then refused to let anyone read it. A towering
robe of packed ice that ends in a lectern instead of feet, one enormous frozen
eye under a crown of icicles, four thin arms (two quills, two books), and the
Great Ledger hanging open before its chest, pages crawling with cyan script.
Lesser books orbit it like moons.

Frames: I0 I1 | T0 (arms raised, the eye wakes) | A0 (the ledger flares, pages fly)
        | S0 (it splits: three ghost-eyes) | D0 D1 D2 (the ledger shuts, it falls to ice and paper)
"""
import math

from drawkit import Cv

PAL = {
    'o': '#06080E', 'k': '#101828', 'i': '#2E4A7A', 'I': '#5A86C0', 'j': '#9AC8F0', 'W': '#F0F8FF',
    'c': '#3BEFFF', 'C': '#CFFFFF', 'b': '#5A2A1A', 'B': '#9A4A2A', 'g': '#C98A22', 'G': '#F2C14E',
    'p': '#E8E0C8', 'P': '#FFFFFF', 'r': '#B0213F',
}


def tome(c, x, y, col='b'):
    c.rect(x, y, x + 4, y + 3, col); c.rect(x, y, x + 4, y, 'B'); c.rect(x + 2, y, x + 2, y + 3, 'g'); c.p(x + 1, y + 1, 'p')


def archivist(f=0, mode='idle'):
    c = Cv(48, 48)
    by = [0, -1][f % 2] if mode == 'idle' else -2 if mode in ('tell', 'attack') else 0
    # the lectern it stands on instead of feet
    c.trap(38, 46, 18, 29, 14, 33, 'i'); c.rect(14, 46, 33, 46, 'k'); c.rect(14, 38, 15, 46, 'I')
    # the robe of packed ice, flaring to the floor in hanging folds
    c.trap(14 + by, 40, 18, 29, 9, 38, 'I')
    c.rect(9, 30, 11, 40, 'j'); c.rect(35, 28, 38, 40, 'i')
    for x in (13, 19, 26, 32):
        c.ln(x, 24 + by, x - (2 if x < 24 else -2), 40, 'i')                 # folds
    for x in range(9, 39, 3):
        c.p(x, 41, 'j' if x % 2 else 'W')                                    # a ragged frozen hem
    # a mantle of ice with spiked shoulders
    c.ell(23.5, 18 + by, 13, 4, 'j'); c.ell(23.5, 19 + by, 11, 3, 'I', only='j')
    for x, h in ((10, 5), (13, 3), (34, 3), (37, 5)):
        c.ln(x, 17 + by, x + (-1 if x < 24 else 1), 17 + by - h, 'W')
    for y in range(18 + by, 38, 4):
        c.p(16 + (y % 3), y, 'W'); c.p(30 - (y % 3), y + 2, 'i')            # frost cracks
    # hood + the great eye + icicle crown
    c.ell(23.5, 10 + by, 7.4, 7, 'i'); c.ell(22, 8 + by, 4, 3.5, 'I', only='i')
    c.ln(23, 1 + by, 18, 8 + by, 'i'); c.ln(24, 1 + by, 29, 8 + by, 'i')        # the hood draws to a point
    c.ell(23.5, 11 + by, 4.6, 4, 'k')
    eye = 'C' if mode in ('tell', 'attack', 'special') else 'c'
    if mode == 'special':
        for ex in (19, 23, 28):
            c.ell(ex, 11 + by, 1.6, 1.6, eye); c.p(ex, 11 + by, 'k')
    elif mode != 'dead':
        c.ell(23.5, 11 + by, 3, 2.6, 'W'); c.ell(23.5, 11 + by, 1.8, 1.8, eye); c.p(23, 11 + by, 'k'); c.p(24, 10 + by, 'P')
    for k, x in enumerate((15, 18, 21, 24, 27, 30)):
        h = [5, 7, 9, 9, 7, 5][k]
        c.ln(x, 3 + by, x, 3 + by - h // 2, 'W' if k % 2 else 'j')          # icicle crown
    # four arms
    up = mode in ('tell', 'attack')
    for side in (-1, 1):
        sx = 24 + side * 9
        if up:
            c.ln(sx, 20 + by, sx + side * 8, 8 + by, 'I'); c.ln(sx + side * 2, 26 + by, sx + side * 12, 18 + by, 'j')
            c.ln(sx + side * 8, 8 + by, sx + side * 10, 3 + by, 'p'); c.p(sx + side * 10, 2 + by, 'c')   # quills raised
            tome(c, sx + side * 12 - 2, 15 + by)
        else:
            c.ln(sx, 20 + by, sx + side * 6, 30 + by, 'I'); c.ln(sx + side * 2, 24 + by, sx + side * 10, 32 + by, 'j')
            c.ln(sx + side * 6, 30 + by, sx + side * 7, 36 + by, 'p')
            tome(c, sx + side * 10 - 2, 31 + by)
    # the Great Ledger, open before its chest
    if mode != 'dead':
        lx, ly = 15, 21 + by
        c.rect(lx, ly, lx + 17, ly + 9, 'B'); c.rect(lx + 1, ly + 1, lx + 7, ly + 8, 'p'); c.rect(lx + 10, ly + 1, lx + 16, ly + 8, 'p')
        c.rect(lx + 8, ly, lx + 9, ly + 9, 'g')
        glow = 'C' if mode in ('attack', 'special') else 'j'
        for k in range(4):
            c.rect(lx + 2, ly + 2 + k * 2, lx + 6 - (k % 2), ly + 2 + k * 2, glow)
            c.rect(lx + 11, ly + 2 + k * 2, lx + 15 - (k % 3 == 0), ly + 2 + k * 2, glow)
    # lesser books in orbit
    n = 3 if mode != 'special' else 5
    for k in range(n):
        a = (k / n) * math.tau + f * 0.5 + (0.8 if mode == 'attack' else 0)
        tome(c, round(22 + math.cos(a) * 19), round(22 + math.sin(a) * 9 + by), 'b' if k % 2 else 'i')
    late = []
    if mode == 'attack':
        late = [(x, y, 'p') for x, y in ((6, 10), (40, 8), (3, 26), (44, 24), (10, 4), (37, 2))]   # pages flung out
    if mode == 'special':
        late = [(x, y, 'c') for x, y in ((8, 14), (39, 14), (23, 0), (4, 34), (43, 34))]
    return c.done(late=late)


def ruin(stage):
    c = Cv(48, 48)
    if stage == 0:
        g = archivist(0, 'tell')
        return [r.replace('c', 'j').replace('C', 'W') for r in g]
    c.trap(46 - stage * 4, 47, 18, 29, 8, 40, 'I'); c.rect(8, 47, 40, 47, 'i')
    for k in range(6 + stage * 3):
        tome(c, 8 + (k * 7) % 30, 45 - stage * 3 - (k % 3) * 2, 'b' if k % 2 else 'B')
    if stage == 1:
        c.ell(24, 34, 3, 2.4, 'W'); c.ell(24, 34, 1.6, 1.4, 'j')             # the eye, dimming on the floor
    for x in range(10, 40, 5):
        c.ln(x, 46, x + 2, 41 - stage, 'W')                                  # shards of ice
    return c.done()


FRAMES = [archivist(0), archivist(1), archivist(0, 'tell'), archivist(1, 'attack'), archivist(0, 'special'), ruin(0), ruin(1), ruin(2)]
