"""THE WRECK-WHALER - Harpooner class.

A diver who went down after the thing that sank the fleet and came back up
alone. A huge round brass bell-helm with a single porthole that glows
sea-green from inside - nobody has seen the face. Tarred oilskin coat,
brass buckles, a coil of line on the hip, heavy boots, and a barbed whale
harpoon slung over the shoulder that is longer than he is tall. The
silhouette: a round dome on a squat block, with a long diagonal spike.

All frames 16x16, pivot (8, 15). Side frames face RIGHT and are mirror-safe.
"""
from drawkit import Cv, flip

PAL = {
    'o': '#0A0E10',  # outline
    'a': '#6E3E14',  # brass dark
    'A': '#C8862A',  # brass
    'Y': '#FFD877',  # brass glint
    'g': '#14514A',  # porthole deep
    'G': '#4FE8C4',  # porthole glow
    'W': '#E6FFF6',  # glow core
    'k': '#16242A',  # oilskin dark
    'K': '#2A444C',  # oilskin
    'j': '#4F7A82',  # oilskin sheen
    'r': '#7A5A32',  # rope
    'R': '#C8A060',  # rope light
    'w': '#5A3A22',  # harpoon shaft
    's': '#6E7A8A',  # steel
    'S': '#D0DCE8',  # steel edge
    'b': '#24160E',  # boots
    'x': '#C02A3A',  # red barb paint / pain
    'u': '#2E6E9E',  # sea water
    'U': '#8AD0F0',  # spray
}


def harpoon_diag(c, x0, y0, x1, y1, head=True):
    """a two-tone shaft from (x0,y0) to the head end (x1,y1), with a barbed steel diamond head"""
    dx = 1 if x1 > x0 else -1
    dy = 1 if y1 > y0 else -1
    c.ln(x0, y0, x1 - dx * 2, y1 - dy * 2, 'R')
    c.ln(x0 + (0 if abs(y1 - y0) > abs(x1 - x0) else 0), y0 + 1, x1 - dx * 2, y1 - dy * 2 + 1, 'r')
    if head:
        c.p(x1, y1, 'S'); c.p(x1 - dx, y1, 's'); c.p(x1, y1 - dy, 's')
        c.p(x1 - dx, y1 - dy, 'S'); c.p(x1 - dx * 2, y1 - dy, 's'); c.p(x1 - dx, y1 - dy * 2, 's')
        c.p(x1 - dx * 2, y1 - dy * 2, 'x')                             # red paint behind the head


def helm(c, cx, cy, by=0, glow=1, back=False, side=False):
    c.ell(cx, cy + by, 3.6, 3.4, 'A')
    c.ell(cx - 1, cy - 1 + by, 2.0, 1.6, 'Y', only='A')                # glint on the dome
    c.ell(cx + 1, cy + 1.5 + by, 2.6, 1.6, 'a', only='A')
    for k, (dx, dy) in enumerate(((-3, 0), (3, 0), (0, -3), (-2, 2), (2, 2))):
        c.p(cx + dx, cy + dy + by, 'a' if k % 2 else 'Y')            # rivets
    if back:
        c.rect(cx - 1, cy + by, cx + 1, cy + 1 + by, 'a')             # the air-hose valve
        c.p(cx, cy + by, 's')
        return
    px = cx + (1 if side else 0)
    c.ell(px, cy + by, 1.7, 1.7, 'g')                                  # the porthole
    c.ring(px, cy + by, 2.2, 2.2, 'a', 0.8)
    if glow:                                                           # a round lens of sea-light
        c.rect(px - 1, cy - 1 + by, px, cy + by, 'G')
        c.p(px - 1, cy - 1 + by, 'W')
        if glow >= 2:
            c.p(px + 1, cy + by, 'G'); c.p(px, cy + 1 + by, 'G'); c.p(px - 1, cy + 1 + by, 'G'); c.p(px + 1, cy - 1 + by, 'G')


def torso(c, by=0, step=0, arm_l=0, arm_r=0, buckle=True):
    c.rect(4, 8 + by, 11, 12 + by, 'K')                               # broad oilskin coat
    c.rect(4, 8 + by, 4, 12 + by, 'j'); c.rect(5, 8 + by, 5, 9 + by, 'j')
    c.rect(10, 9 + by, 11, 12 + by, 'k')
    c.rect(4, 13, 11, 13, 'k')                                         # coat skirt
    c.p(4, 13, 'K'); c.p(7, 13, 'K')
    if buckle:
        c.rect(5, 11 + by, 10, 11 + by, 'b'); c.p(7, 11 + by, 'A'); c.p(8, 11 + by, 'Y')    # belt + brass buckle
    c.rect(3, 9 + by, 4, 9 + by, 'A')                                  # brass shoulder plates
    c.rect(11, 9 + by, 12, 9 + by, 'A')
    c.rect(2, 10 + by + arm_l, 3, 12 + by + arm_l, 'K'); c.rect(2, 13 + by + arm_l, 3, 13 + by + arm_l, 'b')   # heavy gloves
    c.rect(12, 10 + by + arm_r, 13, 12 + by + arm_r, 'k'); c.rect(12, 13 + by + arm_r, 13, 13 + by + arm_r, 'b')
    c.p(4, 12 + by, 'r'); c.p(3, 12 + by, 'R'); c.p(4, 13, 'R')         # coil of line on the hip
    # boots
    l, r = (14, 15) if step == 0 else (13, 15) if step == 1 else (14, 15)
    c.rect(5, l, 6, 15, 'b'); c.rect(9, 14 if step != 1 else 15, 10, 15, 'b')
    if step == 2:
        c.rect(9, 13, 10, 15, 'b'); c.rect(5, 15, 6, 15, 'b')


def front(by=0, step=0, glow=1, carry=True):
    c = Cv()
    torso(c, by, step)
    helm(c, 8, 4, by, glow)
    c.rect(6, 7 + by, 10, 7 + by, 'a')                                 # the helm's collar
    if carry:
        harpoon_diag(c, 2, 14, 14, 1)                                    # slung across the body, over the right shoulder
        c.p(11, 7 + by, 'b'); c.p(12, 7 + by, 'b')                     # fist on the shaft
    return c


def side(by=0, step=0, glow=1):
    c = Cv()
    harpoon_diag(c, 2, 13, 15, 2)
    c.rect(5, 8 + by, 10, 12 + by, 'K'); c.rect(5, 8 + by, 5, 12 + by, 'j'); c.rect(9, 9 + by, 10, 12 + by, 'k')
    c.rect(5, 13, 10, 13, 'k')
    c.rect(2, 8 + by, 4, 12 + by, 'a'); c.rect(2, 8 + by, 2, 12 + by, 'A'); c.p(3, 9 + by, 'Y')   # air tank on the back
    c.ln(3, 7 + by, 5, 5 + by, 'k')                                    # air hose
    c.rect(6, 11 + by, 10, 11 + by, 'b'); c.p(8, 11 + by, 'A')
    c.rect(9, 9 + by, 11, 10 + by, 'k'); c.rect(11, 9 + by, 12, 9 + by, 'b')   # arm forward, gripping the shaft
    helm(c, 8, 4, by, glow, side=True)
    c.rect(6, 7 + by, 10, 7 + by, 'a')
    if step == 1:
        c.rect(5, 14, 6, 15, 'b'); c.rect(9, 15, 11, 15, 'b')
    elif step == 3:
        c.rect(4, 15, 6, 15, 'b'); c.rect(9, 14, 10, 15, 'b')
    else:
        c.rect(5, 14, 6, 15, 'b'); c.rect(9, 14, 10, 15, 'b')
    return c


def back(by=0, step=0):
    c = Cv()
    torso(c, by, step, buckle=False)
    c.rect(5, 8 + by, 10, 11 + by, 'a'); c.rect(5, 8 + by, 6, 11 + by, 'A'); c.p(6, 9 + by, 'Y')   # air tank
    c.rect(7, 12 + by, 8, 12 + by, 's')
    helm(c, 8, 4, by, 0, back=True)
    c.rect(6, 7 + by, 10, 7 + by, 'a')
    harpoon_diag(c, 1, 14, 14, 1)                                       # in front of the back
    g = flip(c.done())
    return [('.' + r[:-1]) for r in g]


def frames():
    F = {}
    F['front_idle'] = [front(0, 0, 1).done(), front(1, 0, 2).done()]
    F['front_walk'] = [front(0, 1, 1).done(), front(-1, 0, 2).done(), front(0, 2, 1).done(), front(-1, 0, 2).done()]
    F['side_idle'] = [side(0, 0, 1).done(), side(1, 0, 2).done()]
    F['side_walk'] = [side(0, 1, 1).done(), side(-1, 0, 2).done(), side(0, 3, 1).done(), side(-1, 0, 2).done()]
    F['back_idle'] = [back(0, 0), back(1, 0)]
    F['back_walk'] = [back(0, 1), back(-1, 0), back(0, 2), back(-1, 0)]

    # ATTACK - "Throw": haul the harpoon back over the helm, drive it forward, empty-handed recoil
    a0 = front(0, 0, 2, carry=False)
    harpoon_diag(a0, 15, 6, 1, 0)                                       # cocked back, horizontal above the helm
    a0.p(12, 8, 'b'); a0.p(13, 7, 'b')
    a1 = front(1, 2, 2, carry=False)
    harpoon_diag(a1, 11, 4, 8, 15)                                      # driven down the line of fire
    a1.p(10, 10, 'b'); a1.p(11, 10, 'b')
    a2 = front(0, 0, 1, carry=False)
    F['attack'] = [a0.done(late=[(0, 1, 'U')]), a1.done(late=[(7, 15, 'U'), (9, 15, 'U'), (6, 14, 'U')]), a2.done(late=[(13, 12, 'r')])]

    # ABILITY - "Grapple Line": the hook whirls overhead, flies, and he braces and hauls
    def whirl(rad_x, k):
        c = front(0, 0, 2, carry=False)
        c.ring(8, 1, rad_x, 1.3, 'r', 0.9)
        c.p(round(8 + rad_x * (1 if k % 2 else -1)), 1, 's'); c.p(round(8 + rad_x * (1 if k % 2 else -1)), 0, 'S')
        c.ln(12, 9, 12, 2, 'r'); c.p(12, 8, 'b')
        return c
    t0 = whirl(4, 0)
    t1 = whirl(7, 1)
    t2 = front(-1, 2, 2, carry=False)
    t2.ln(12, 9, 15, 0, 'r'); t2.p(12, 8, 'b'); t2.p(15, 0, 'S')        # the line snaps out
    t3 = front(0, 1, 2, carry=False)
    t3.ln(13, 10, 15, 6, 'R'); t3.ln(2, 11, 0, 7, 'r'); t3.p(13, 10, 'b'); t3.p(2, 11, 'b')   # braced, hauling hand over hand
    t4 = front(0, 0, 1)
    F['ability'] = [t0.done(), t1.done(), t2.done(late=[(14, 1, 'U')]), t3.done(late=[(1, 15, 'U'), (14, 15, 'U')]), t4.done()]

    # HIT - knocked back, the glass flashes red
    h = front(1, 0, 0)
    h.p(8, 4, 'x'); h.p(7, 4, 'x')
    F['hit'] = [h.done(late=[(1, 2, 'U'), (14, 6, 'U')])]

    # DEATH - the glass cracks, the sea pours out of the helm, he goes down and the helm rolls free
    d0 = front(1, 0, 0)
    d0.p(7, 3, 'S'); d0.p(8, 4, 'S'); d0.p(9, 5, 'S')
    d1 = Cv()
    harpoon_diag(d1, 0, 15, 12, 12)
    d1.rect(3, 11, 12, 14, 'K'); d1.rect(3, 11, 3, 14, 'j'); d1.rect(2, 15, 5, 15, 'b'); d1.rect(10, 15, 13, 15, 'b')
    helm(d1, 8, 8, 0, 0); d1.p(8, 8, 'S')
    d2 = Cv()
    harpoon_diag(d2, 0, 15, 12, 13)
    d2.rect(2, 13, 11, 15, 'K'); d2.rect(2, 13, 2, 15, 'j'); d2.rect(0, 15, 1, 15, 'b')
    helm(d2, 12, 11, 0, 0); d2.p(12, 11, 'S')
    d3 = Cv()
    harpoon_diag(d3, 0, 15, 12, 13)
    d3.rect(2, 13, 11, 15, 'K'); d3.rect(2, 13, 2, 15, 'j'); d3.rect(0, 15, 1, 15, 'b')
    helm(d3, 12, 12, 0, 0)
    F['death'] = [d0.done(late=[(9, 8, 'u')]),
                  d1.done(late=[(9, 12, 'u'), (10, 13, 'u'), (11, 14, 'U')]),
                  d2.done(late=[(13, 15, 'u'), (14, 15, 'U'), (15, 14, 'u')]),
                  d3.done(late=[(15, 15, 'u')])]
    return F


LAYOUT = [
    ['front_idle', 'front_walk'],
    ['side_idle', 'side_walk'],
    ['back_idle', 'back_walk'],
    ['attack', 'hit'],
    ['ability'],
    ['death'],
]
