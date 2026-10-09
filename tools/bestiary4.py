"""Realm bestiary, wave 4: monsters built around a mechanic you can SEE.

brine_slime / brine_slimelet - a sloshing blob with pearls inside; it splits when it dies
gas_bloat     - a stitched balloon of swamp gas with tiny wings; it swells, then bursts
cairn_mender  - a walking cairn with a green mending-rune; it heals its friends
gilded_lancer - a gold knight behind a tower shield; shots from the front glance off
golden_duck   - an easter egg. Quack.

Row format as bestiary.py: M0 M1 | T0 | A0 | D0 D1 D2.
"""
from drawkit import Cv
from bestiary import register
from bestiary2 import death3


# ---------------------------------------------------------------- BRINE SLIME
SL = {'o': '#0A1A1E', 't': '#1E6A70', 'T': '#3FB3B0', 'U': '#8AF0E0', 'W': '#E8FFFA', 'p': '#FFE3F0', 'k': '#0A1A1E'}


def slime(w=6.0, h=4.6, cy=10.5, eyes=True, pearls=True, small=False):
    c = Cv()
    if small:
        w, h, cy = w * 0.6, h * 0.6, 12.5
    c.ell(7.5, cy, w, h, 'T'); c.rect(int(7.5 - w) + 1, int(cy + h) - 1, int(7.5 + w) - 1, int(cy + h), 'T')
    c.ell(6, cy - h * 0.35, w * 0.45, h * 0.35, 'U', only='T'); c.p(5, int(cy - h * 0.55), 'W')     # wet highlight
    c.ell(9, cy + h * 0.3, w * 0.5, h * 0.4, 't', only='T')
    if pearls and not small:
        c.p(9, int(cy) + 1, 'p'); c.p(6, int(cy) + 2, 'p')
    if eyes:
        y = int(cy - (1 if small else 1.5))
        c.p(6, y, 'k'); c.p(9, y, 'k'); c.p(6, y - 1, 'W'); c.p(9, y - 1, 'W')
    return c.done()


register('brine_slime', SL, [slime(6, 4.6), slime(6.6, 4.0, 11), slime(5.4, 5.4, 10), slime(7, 3.6, 11.4)]
         + death3(slime(6, 4.6), {'U': 'T'}), biome='shore')
register('brine_slimelet', SL, [slime(small=True), slime(6.6, 4.0, 11, small=True), slime(5.4, 5.4, 10, small=True), slime(7, 3.6, 11.4, small=True)]
         + death3(slime(small=True), {'U': 'T'}), biome='shore')


# ---------------------------------------------------------------- GAS-BLOAT
GB = {'o': '#10140A', 'g': '#5A7A22', 'G': '#8DB03A', 'K': '#C8E86A', 'y': '#E8FF9A', 'r': '#6A1A1E', 'w': '#E8E0C8', 'b': '#3A2A2E', 'B': '#7A5A6A'}


def bloat(r0=4.6, wing=0, mouth=False, glow=False):
    c = Cv()
    c.ell(7.5, 8, r0, r0 * 0.95, 'G'); c.ell(6, 6.5, r0 * 0.5, r0 * 0.45, 'K', only='G'); c.p(5, 5, 'y')
    c.ell(9, 10, r0 * 0.5, r0 * 0.4, 'g', only='G')
    for x, y in ((4, 9), (11, 7), (8, 12), (5, 4)):
        c.p(x, y, 'g')                                                        # blotches
    c.ln(5, 10, 10, 10, 'b'); c.p(6, 11, 'b'); c.p(8, 11, 'b')               # stitched mouth
    if mouth:
        c.rect(6, 10, 9, 11, 'r'); c.p(6, 10, 'w'); c.p(9, 10, 'w')
    c.p(6, 7, 'r' if glow else 'b'); c.p(9, 7, 'r' if glow else 'b')
    wy = [3, 5][wing]
    c.ln(2, 7, 0, wy, 'B'); c.p(1, wy + 1, 'w'); c.ln(13, 7, 15, wy, 'B'); c.p(14, wy + 1, 'w')   # tiny wings
    return c.done(late=[(7, 0, 'y'), (3, 1, 'y'), (12, 1, 'y')] if glow else [])


register('gas_bloat', GB, [bloat(4.6, 0), bloat(4.6, 1), bloat(5.4, 0, False, True), bloat(6, 1, True, True)]
         + death3(bloat(4, 1, True), {'K': 'G', 'y': 'G'}), biome='fen')


# ---------------------------------------------------------------- CAIRN MENDER
CM = {'o': '#0C0E14', 's': '#4E4A5A', 'S': '#7E7A8C', 'T': '#B4B0C2', 'g': '#2E8A5A', 'G': '#7AFFB0', 'W': '#E8FFF0', 'w': '#5A3A22', 'm': '#4E7E34'}


def cairn(bob=0, glow=False, staff_up=False):
    c = Cv()
    c.ell(7.5, 13, 4.2, 2.2, 's'); c.ell(7, 12.4, 2.6, 1, 'S', only='s')       # base stone
    c.ell(7.5, 9.5 - bob, 3.2, 2, 'S'); c.ell(7, 9 - bob, 2, 0.8, 'T', only='S')   # body stone, with the rune
    c.p(7, 9 - bob, 'G' if glow else 'g'); c.p(8, 10 - bob, 'G' if glow else 'g'); c.p(6, 10 - bob, 'g')
    c.ell(7.5, 6.5 - bob, 2.2, 1.4, 's'); c.p(7, 6 - bob, 'S')               # shoulder stone
    c.ell(7.5, 4 - bob, 1.6, 1.4, 'S'); c.p(6, 4 - bob, 'G'); c.p(9, 4 - bob, 'G')   # head stone, two green eyes
    c.p(5, 12, 'm'); c.p(10, 13, 'm'); c.p(8, 6 - bob, 'm')                  # moss
    if staff_up:
        c.ln(12, 1, 12, 11, 'w'); c.ell(12, 1, 1.2, 1.2, 'G'); c.p(12, 1, 'W')
    else:
        c.ln(12, 4, 12, 14, 'w'); c.p(12, 3, 'G')
    c.p(11, 8 - bob, 'S'); c.p(10, 8 - bob, 's')                              # stone hand on the staff
    return c.done(late=[(2, 3, 'G'), (14, 6, 'W'), (4, 1, 'G')] if glow else [])


register('cairn_mender', CM, [cairn(0), cairn(1), cairn(0, True, True), cairn(1, True, True)] + death3(cairn(0), {'G': 'g'}), biome='runeholt')


# ---------------------------------------------------------------- GILDED LANCER
GL = {'o': '#140C04', 'g': '#8A5A12', 'G': '#E3B95A', 'Y': '#FFEB8F', 'W': '#FFFFFF', 'r': '#7A1424', 'R': '#C83444', 'k': '#2A2024', 's': '#C8D4E0'}


def lancer(step=0, lance=0, shield=True):
    c = Cv()
    c.rect(6, 4, 9, 11, 'G'); c.rect(6, 4, 6, 11, 'Y'); c.rect(9, 5, 9, 11, 'g')   # gold body
    c.rect(6, 1, 9, 4, 'G'); c.rect(7, 2, 8, 3, 'k'); c.p(7, 2, 'Y')                 # helm, visor slit
    c.p(7, 0, 'R'); c.p(8, 0, 'R'); c.p(9, 0, 'r')                                   # crest
    l, r = (6, 9) if step == 0 else (5, 9) if step == 1 else (6, 10)
    c.rect(l, 12, l, 15, 'g'); c.rect(r, 12, r, 15, 'g')
    lx = [11, 12, 13][lance]
    c.ln(lx, 1 + lance, lx, 13, 's'); c.p(lx, 0 + lance, 'W'); c.p(lx - 1, 9, 'G'); c.p(lx + 1, 9, 'G')   # lance + pennant
    c.p(lx + 1, 2 + lance, 'R'); c.p(lx + 2, 3 + lance, 'R')
    if shield:
        c.rect(2, 4, 5, 11, 'G'); c.rect(2, 4, 2, 11, 'Y'); c.rect(3, 6, 4, 9, 'R'); c.rect(3, 7, 4, 8, 'r'); c.p(3, 5, 'W')   # tower shield
    else:
        c.rect(1, 6, 3, 12, 'g'); c.p(2, 8, 'R')                             # shield lowered while attacking
    return c.done()


register('gilded_lancer', GL, [lancer(0, 0), lancer(1, 0), lancer(0, 1, False), lancer(2, 2, False)] + death3(lancer(0, 0), {'Y': 'G'}), biome='godfall')


# ---------------------------------------------------------------- THE GOLDEN DUCK
DK = {'o': '#2A1A04', 'y': '#C8962A', 'Y': '#FFD650', 'W': '#FFF6C8', 'k': '#120A04', 'r': '#E8601A'}


def duck(step=0):
    c = Cv()
    c.ell(7.5, 11, 4.4, 3, 'Y'); c.ell(6, 10, 2.4, 1.4, 'W', only='Y'); c.ell(9, 12, 2.4, 1.4, 'y', only='Y')
    c.ell(5.5, 6.5 - (step == 1), 2.4, 2.2, 'Y'); c.p(4, 6 - (step == 1), 'W')   # head
    c.p(5, 6 - (step == 1), 'k')
    c.rect(1, 7 - (step == 1), 3, 7 - (step == 1), 'r'); c.p(2, 8 - (step == 1), 'r')   # beak
    c.p(11, 9, 'Y'); c.p(12, 8, 'Y')                                          # tail
    c.p(6 + step, 14, 'r'); c.p(9 - step, 14, 'r')
    return c.done(late=[(13, 4, 'W'), (2, 2, 'W')] if step == 1 else [(12, 3, 'W')])


register('golden_duck', DK, [duck(0), duck(1), duck(1), duck(0)] + death3(duck(0), {'W': 'Y'}), biome='shore')
