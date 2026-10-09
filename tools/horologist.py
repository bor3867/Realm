"""THE HOROLOGIST - Clockmaker class.

A clockmaker who repaired the cathedral clock from the inside and never came
back out. The clock face grew into her spine: it towers over a hunched body in
a plum frock-coat with brass gears at the shoulders. A porcelain mask, a green
monocle, and a pendulum staff whose brass bob is always swinging. Its hands
TICK across every frame. The silhouette: a big round disc over a small hunched
figure, with a swinging weight on a rod.

All frames 16x16, pivot (8, 15). Side frames face RIGHT and are mirror-safe.
"""
import math

from drawkit import Cv, flip

PAL = {
    'o': '#120C08',  # outline
    'a': '#6E4A14',  # brass dark
    'B': '#C8962A',  # brass
    'Y': '#FFE08A',  # brass light
    'f': '#EDE6D2',  # clock face
    'F': '#B8AE94',  # clock face shade
    'k': '#1A1418',  # clock hands / numerals
    'v': '#4A2E3A',  # coat
    'V': '#7A4A5A',  # coat light
    'p': '#E8DCC8',  # porcelain mask
    'P': '#A89A88',  # mask shade
    'g': '#7AF0C0',  # monocle glow
    'r': '#8E8AA6',  # pendulum rod
    'b': '#241A14',  # boots
    'W': '#FFFFFF',  # flash
    'x': '#FF4A5A',  # pain
    's': '#8D88A0',  # frozen grey
}


def clock(c, cx, cy, tick=0, R=4.6, glow=False, back=False):
    c.ell(cx, cy, R, R, 'B')
    c.ring(cx, cy, R, R, 'a', 1.0)
    if back:                                                          # from behind: the gears
        c.ell(cx, cy, R - 1.3, R - 1.3, 'a')
        for k in range(6):
            a = k / 6 * math.tau
            c.p(cx + math.cos(a) * 2.2, cy + math.sin(a) * 2.2, 'Y')
        c.p(cx, cy, 'B')
        return
    c.ell(cx, cy, R - 1.2, R - 1.2, 'W' if glow else 'f')
    c.ell(cx + 0.8, cy + 0.8, R - 1.8, R - 1.8, 'f' if glow else 'F', only='f')
    for k in range(4):                                                # XII / III / VI / IX
        a = k / 4 * math.tau
        c.p(cx + math.cos(a) * (R - 1.6), cy + math.sin(a) * (R - 1.6), 'k')
    # the hands: minute hand sweeps a full turn across the cycle, hour hand creeps
    am = tick / 8 * math.tau - math.pi / 2
    ah = tick / 32 * math.tau - math.pi / 2 + 2.1
    c.ln(cx, cy, cx + round(math.cos(am) * (R - 1.8)), cy + round(math.sin(am) * (R - 1.8)), 'k')
    c.ln(cx, cy, cx + round(math.cos(ah) * (R - 2.6)), cy + round(math.sin(ah) * (R - 2.6)), 'k')
    c.p(cx, cy, 'Y')


def figure(c, by=0, step=0, mask=True, monocle='g'):
    # hunched plum coat
    c.trap(8 + by, 13, 6, 10, 4, 11, 'v')
    c.rect(4, 9 + by, 4, 13, 'V'); c.rect(5, 8 + by, 5, 10 + by, 'V')
    c.rect(4, 8 + by, 5, 8 + by, 'B'); c.p(4, 8 + by, 'Y'); c.rect(10, 8 + by, 11, 8 + by, 'B')   # brass gear-shoulders
    c.p(7, 10 + by, 'B'); c.p(8, 12 + by, 'B')                        # buttons
    # boots
    l, r = (5, 9) if step in (0, 2) else (4, 10) if step == 1 else (6, 8)
    c.rect(l, 14, l + 1, 15, 'b'); c.rect(r, 14, r + 1, 15, 'b')
    # head, pushed forward and low: porcelain mask, monocle
    if mask:
        c.rect(5, 6 + by, 10, 9 + by, 'v'); c.rect(5, 6 + by, 10, 6 + by, 'V')    # a deep plum hood
        c.rect(6, 7 + by, 9, 9 + by, 'k')                             # shadow inside it
        c.rect(7, 7 + by, 8, 8 + by, 'p'); c.p(8, 8 + by, 'P')        # the small porcelain face
        c.p(8, 7 + by, monocle); c.p(9, 7 + by, 'B')                  # monocle + its brass rim


def pendulum(c, x, top, swing, glow=False):
    bx = x + swing
    c.ln(x, top, bx, top + 8, 'r')
    c.ell(bx, top + 9, 1.6, 1.6, 'B'); c.p(bx - 1, top + 8, 'Y')
    if glow:
        c.p(bx, top + 9, 'W')


SW = [0, 1, 0, -1]


def front(by=0, step=0, tick=0, swing=0, glow=False):
    c = Cv()
    clock(c, 8, 4 + by, tick, glow=glow)
    figure(c, by, step)
    c.rect(11, 9 + by, 12, 10 + by, 'v')                              # arm to the staff
    pendulum(c, 13, 3 + by, swing, glow)
    c.p(4, 11 + by, 'p')                                              # a porcelain hand
    return c


def side(by=0, step=0, tick=0, swing=0):
    c = Cv()
    clock(c, 6, 4 + by, tick)
    c.trap(8 + by, 13, 6, 10, 5, 11, 'v'); c.rect(5, 9 + by, 5, 13, 'V'); c.rect(10, 8 + by, 11, 8 + by, 'B')
    c.rect(7, 6 + by, 11, 9 + by, 'v'); c.rect(7, 6 + by, 11, 6 + by, 'V'); c.rect(10, 7 + by, 11, 8 + by, 'p'); c.p(10, 7 + by, 'g'); c.p(11, 8 + by, 'P')
    if step in (1, 3):
        c.rect(5 - (step == 3), 14, 6 - (step == 3), 15, 'b'); c.rect(9 + (step == 1), 14, 10 + (step == 1), 15, 'b')
    else:
        c.rect(6, 14, 7, 15, 'b'); c.rect(9, 14, 10, 15, 'b')
    c.rect(11, 10 + by, 12, 10 + by, 'v')
    pendulum(c, 13, 3 + by, swing)
    return c


def back(by=0, step=0, swing=0):
    c = Cv()
    figure(c, by, step, mask=False)
    clock(c, 8, 5 + by, back=True)
    c.rect(11, 9 + by, 12, 10 + by, 'v')
    pendulum(c, 13, 3 + by, swing)
    g = flip(c.done())
    return [('.' + r[:-1]) for r in g]


def frames():
    F = {}
    F['front_idle'] = [front(0, 0, 0, 0).done(), front(-1, 0, 1, 1).done()]
    F['front_walk'] = [front(0, 1, 0, SW[0]).done(), front(-1, 0, 2, SW[1]).done(), front(0, 3, 4, SW[2]).done(), front(-1, 2, 6, SW[3]).done()]
    F['side_idle'] = [side(0, 0, 0, 0).done(), side(-1, 0, 1, 1).done()]
    F['side_walk'] = [side(0, 1, 0, SW[0]).done(), side(-1, 0, 2, SW[1]).done(), side(0, 3, 4, SW[2]).done(), side(-1, 0, 6, SW[3]).done()]
    F['back_idle'] = [back(0, 0, 0), back(-1, 0, 1)]
    F['back_walk'] = [back(0, 1, SW[0]), back(-1, 0, SW[1]), back(0, 3, SW[2]), back(-1, 2, SW[3])]

    # ATTACK - "Release": the weight swung high, flung down the line, the rod recovering
    a0 = front(-1, 0, 2, 0)
    a0 = Cv()
    clock(a0, 8, 3, 2); figure(a0, -1, 0); a0.rect(11, 6, 12, 7, 'v')
    a0.ln(12, 6, 15, 1, 'r'); a0.ell(15, 1, 1.4, 1.4, 'B')             # weight raised over the shoulder
    a1 = Cv()
    clock(a1, 8, 4, 3); figure(a1, 0, 1); a1.rect(10, 10, 11, 11, 'v')
    a1.ln(11, 10, 9, 14, 'r'); a1.ell(9, 14, 1.6, 1.4, 'B'); a1.p(9, 14, 'W')
    a2 = front(0, 0, 4, -1)
    F['attack'] = [a0.done(late=[(14, 3, 'Y')]), a1.done(late=[(10, 12, 'Y'), (12, 13, 'Y'), (8, 15, 'W')]), a2.done()]

    # ABILITY - "Stop": the hands spin, the face flares white, the world goes grey, then ticks on
    t0 = front(0, 0, 0, 0)
    t1 = front(-1, 0, 4, 0)
    t2 = front(-1, 0, 0, 0, glow=True)
    t3 = front(-1, 0, 0, 0, glow=True)
    t3.recolor({'v': 's', 'V': 's', 'B': 's', 'a': 'k', 'p': 's', 'P': 's', 'Y': 's', 'r': 's', 'b': 'k', 'g': 'W'})
    t4 = front(0, 0, 1, 1)
    ring = [(round(8 + math.cos(k / 12 * math.tau) * 7.4), round(7 + math.sin(k / 12 * math.tau) * 7.4), 'Y') for k in range(12)]
    F['ability'] = [t0.done(), t1.done(late=[(8, 0, 'W')]), t2.done(late=ring), t3.done(late=[(x, y, 'W') for x, y, _ in ring]), t4.done()]

    # HIT - the monocle cracks red
    h = front(1, 0, 5, 1)
    h.p(8, 8, 'x'); h.p(9, 7, 'x')
    F['hit'] = [h.done()]

    # DEATH - the face cracks, the springs let go, the gears roll away
    d0 = front(1, 0, 7, 0)
    d0.ln(6, 1, 10, 7, 'k')
    d1 = Cv()
    clock(d1, 8, 9, 7); d1.ln(5, 6, 11, 12, 'k'); figure(d1, 4, 0); d1.ln(9, 15, 15, 13, 'r')
    d2 = Cv()
    d2.trap(12, 15, 4, 11, 2, 13, 'v'); clock(d2, 9, 11, 7, R=4); d2.ln(6, 9, 12, 13, 'k')
    for x, y in ((1, 13), (14, 14), (12, 10)):
        d2.p(x, y, 'B'); d2.p(x + 1, y, 'Y')
    d3 = Cv()
    d3.trap(12, 15, 4, 11, 2, 13, 'v'); clock(d3, 9, 11, 7, R=4); d3.ln(6, 9, 12, 13, 'k')
    for x, y in ((0, 14), (15, 15)):
        d3.p(x, y, 'B')
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
