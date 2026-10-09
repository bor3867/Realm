"""THE KITE-HERMIT - Stormwright class.

A hermit who lived on a mountain long enough to learn how to talk to storms.
A huge flat straw hat with a face lost in its shadow (two lamp-yellow eyes),
a storm-grey robe patched with copper, wooden stilts for crossing flood
country, and always - always - a little diamond storm kite riding the wind
above, tied to her wrist by a copper wire. The silhouette: a wide flat
cone on a thin column, with a kite at the end of a line.

All frames 16x16, pivot (8, 15). Side frames face RIGHT and are mirror-safe.
"""
from drawkit import Cv, flip

PAL = {
    'o': '#0C0E14',  # outline
    'h': '#7A6A3A',  # hat dark
    'H': '#C8B070',  # hat
    'J': '#ECDCA0',  # hat light
    'd': '#08060A',  # face shadow
    'y': '#FFE45C',  # eyes
    'g': '#3A4458',  # robe dark
    'G': '#5A6A88',  # robe
    'j': '#8A9AB8',  # robe light
    'c': '#B8682A',  # copper
    'C': '#F0A050',  # copper light
    'k': '#2E5A8A',  # kite
    'K': '#8AC8FF',  # kite light
    'e': '#E8E0C8',  # kite stripe / ribbon
    'w': '#5A3A22',  # stilts
    'L': '#FFFFFF',  # lightning
    'l': '#8AF6FF',  # lightning blue
    'x': '#FF4A5A',  # pain
}


def hat(c, by, tilt=0, brim=True):
    c.rect(7, 1 + by, 8, 1 + by, 'H'); c.p(7, 1 + by, 'J')
    c.rect(5, 2 + by, 10, 2 + by, 'H'); c.p(5, 2 + by, 'J'); c.p(6, 2 + by, 'J')
    c.rect(3 + tilt, 3 + by, 12 + tilt, 3 + by, 'H'); c.p(3 + tilt, 3 + by, 'J')
    if brim:
        c.rect(1 + tilt, 4 + by, 14 + tilt, 4 + by, 'h'); c.p(2 + tilt, 4 + by, 'H')
    for x in (6, 9):
        c.p(x, 2 + by, 'h')                                           # woven bands
    c.p(8, 0 + by, 'c')                                               # copper finial: it attracts the storm


def kite(c, x, y, glow=False):
    c.p(x + 1, y, 'K'); c.rect(x, y + 1, x + 2, y + 1, 'k'); c.p(x + 1, y + 1, 'e'); c.p(x + 1, y + 2, 'k')
    if glow:
        c.p(x + 1, y + 1, 'L'); c.p(x, y + 1, 'l'); c.p(x + 2, y + 1, 'l')
    c.p(x + 1, y + 3, 'e'); c.p(x, y + 4, 'e')                        # ribbon tail


def front(by=0, step=0, kx=12, ky=0, glow=False, arm='wire'):
    c = Cv()
    # robe: a thin storm-grey column, copper patches
    c.trap(5 + by, 12, 6, 9, 5, 10, 'G')
    c.rect(5, 6 + by, 5, 12, 'j'); c.rect(9, 7 + by, 10, 12, 'g')
    c.rect(6, 11 + by, 9, 11 + by, 'c')                                # copper sash
    for x, y in ((8, 6), (7, 7), (8, 8), (7, 9)):
        c.p(x, y + by, 'C' if y % 2 else 'c')                         # a copper lightning bolt stitched down the front
    # stilts
    l, r = (6, 9) if step in (0, 2) else (5, 10) if step == 1 else (7, 8)
    c.rect(l, 13, l, 15, 'w'); c.rect(r, 13, r, 15, 'w')
    c.p(l, 12, 'g'); c.p(r, 12, 'g')
    # face in shadow, eyes
    c.rect(6, 5 + by, 9, 6 + by, 'd'); c.p(6, 5 + by, 'y'); c.p(9, 5 + by, 'y')
    hat(c, by)
    # arms
    c.p(4, 8 + by, 'G'); c.p(4, 9 + by, 'j')
    if arm == 'wire':
        c.p(11, 7 + by, 'G'); c.p(12, 6 + by, 'j')
        c.ln(12, 5 + by, kx + 1, ky + 3, 'c')                         # the copper wire up to the kite
    elif arm == 'up':
        c.rect(11, 3 + by, 11, 6 + by, 'G'); c.p(11, 2 + by, 'j')
        c.ln(11, 1 + by, kx + 1, ky + 3, 'c')
    kite(c, kx, ky, glow)
    return c


def side(by=0, step=0, kx=12, ky=0, glow=False):
    c = Cv()
    c.trap(5 + by, 12, 6, 9, 5, 10, 'G'); c.rect(5, 6 + by, 5, 12, 'j'); c.rect(9, 7 + by, 10, 12, 'g')
    c.rect(6, 11 + by, 9, 11 + by, 'c')
    if step in (1, 3):
        c.ln(6, 12, 5 - (step == 3), 15, 'w'); c.ln(9, 12, 10 + (step == 1), 15, 'w')
    else:
        c.rect(6, 13, 6, 15, 'w'); c.rect(9, 13, 9, 15, 'w')
    c.rect(8, 5 + by, 10, 6 + by, 'd'); c.p(10, 5 + by, 'y')
    hat(c, by, tilt=1)
    c.rect(10, 7 + by, 11, 7 + by, 'G'); c.p(12, 6 + by, 'j')
    c.ln(12, 5 + by, kx + 1, ky + 3, 'c')
    kite(c, kx, ky, glow)
    return c


def back(by=0, step=0, kx=12, ky=0):
    c = Cv()
    c.trap(5 + by, 12, 6, 9, 5, 10, 'G'); c.rect(5, 6 + by, 5, 12, 'j'); c.rect(9, 7 + by, 10, 12, 'g')
    c.rect(6, 6 + by, 9, 10 + by, 'g'); c.p(7, 7 + by, 'c'); c.p(8, 8 + by, 'c'); c.p(7, 9 + by, 'C')   # a copper lightning-mark on the back
    l, r = (6, 9) if step in (0, 2) else (5, 10) if step == 1 else (7, 8)
    c.rect(l, 13, l, 15, 'w'); c.rect(r, 13, r, 15, 'w')
    hat(c, by)
    c.p(11, 7 + by, 'G'); c.ln(12, 5 + by, kx + 1, ky + 3, 'c')
    kite(c, kx, ky)
    g = flip(c.done())
    return [('.' + r[:-1]) for r in g]


def frames():
    F = {}
    F['front_idle'] = [front(0, 0, 12, 0).done(), front(-1, 0, 12, 1).done()]
    F['front_walk'] = [front(0, 1, 12, 0).done(), front(-1, 0, 13, 1).done(), front(0, 3, 12, 0).done(), front(-1, 2, 11, 1).done()]
    F['side_idle'] = [side(0, 0, 12, 0).done(), side(-1, 0, 12, 1).done()]
    F['side_walk'] = [side(0, 1, 12, 0).done(), side(-1, 0, 13, 1).done(), side(0, 3, 12, 0).done(), side(-1, 0, 11, 1).done()]
    F['back_idle'] = [back(0, 0, 12, 0), back(-1, 0, 12, 1)]
    F['back_walk'] = [back(0, 1, 12, 0), back(-1, 0, 13, 1), back(0, 3, 12, 0), back(-1, 2, 11, 1)]

    # ATTACK - "Call It Down": hand up, the kite flashes, lightning runs down the wire and out
    a0 = front(-1, 0, 12, 0, glow=True, arm='up')
    a1 = front(0, 0, 12, 0, glow=True, arm='up')
    a1.ln(13, 3, 9, 8, 'L'); a1.ln(9, 8, 10, 15, 'l')
    a2 = front(0, 0, 12, 1)
    F['attack'] = [a0.done(late=[(8, 0, 'L'), (14, 0, 'l')]), a1.done(late=[(12, 14, 'L'), (7, 15, 'l'), (8, 0, 'L')]), a2.done(late=[(15, 3, 'l')])]

    # ABILITY - "Let Out the Line": the kite climbs, swells with charge, and the sky answers
    t0 = front(0, 0, 12, 0, arm='up')
    t1 = front(-1, 0, 13, 0, glow=True, arm='up')
    t2 = front(-1, 0, 13, 0, glow=True, arm='up')
    t2.ln(14, 0, 14, 15, 'L'); t2.ln(15, 4, 15, 12, 'l')
    t3 = front(0, 0, 13, 0, glow=True, arm='up')
    t4 = front(0, 0, 12, 0)
    F['ability'] = [t0.done(), t1.done(late=[(12, 0, 'l'), (15, 2, 'l')]), t2.done(late=[(1, 2, 'l'), (13, 13, 'L')]),
                    t3.done(late=[(1, 6, 'l'), (3, 11, 'L'), (12, 9, 'l'), (8, 0, 'L')]), t4.done()]

    # HIT
    h = front(1, 0, 11, 1)
    h.p(6, 5, 'x'); h.p(9, 5, 'x')
    F['hit'] = [h.done()]

    # DEATH - struck by her own storm: the hat flies off, the robe falls, the kite drifts away
    d0 = front(0, 0, 12, 0, glow=True)
    d0.ln(8, 0, 7, 12, 'L')
    d1 = Cv()
    d1.trap(9, 14, 6, 9, 4, 11, 'G'); d1.ln(4, 15, 11, 12, 'w'); hat(d1, 6, brim=True); d1.rect(6, 11, 9, 11, 'c')
    kite(d1, 13, 0)
    d2 = Cv()
    d2.trap(12, 15, 4, 11, 2, 13, 'G'); d2.ln(0, 15, 9, 14, 'w'); d2.rect(5, 13, 10, 13, 'c')
    hat(d2, 9, brim=True)
    kite(d2, 13, 0); d2.p(12, 4, 'e')
    d3 = Cv()
    d3.trap(12, 15, 4, 11, 2, 13, 'g'); d3.ln(0, 15, 9, 14, 'w'); hat(d3, 9, brim=True)
    F['death'] = [d0.done(), d1.done(), d2.done(), d3.done()]
    return F


LAYOUT = [
    ['front_idle', 'front_walk'],
    ['side_idle', 'side_walk'],
    ['back_idle', 'back_walk'],
    ['attack', 'hit'],
    ['ability'],
    ['death'],
]
