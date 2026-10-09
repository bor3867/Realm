"""THE RELIQUARIAN - Summoner class.

A grave-keeper who never buried anyone. She keeps the dead in a birdcage
lantern on a crooked staff, and they are glad of the company. Tall drooping
hood, a cracked bone mask with two cold-fire eyes, a funeral shroud that
frays into tatters at the hem, a violet mourning sash. The silhouette is a
tall dark spike with a glowing cage hung off one side - you always know
where the lantern is.

All frames 16x16, pivot (8, 15). Side frames face RIGHT and are mirror-safe.
"""
from drawkit import Cv, flip

PAL = {
    'o': '#0E0A12',  # outline
    'k': '#1E1A2A',  # shroud dark
    'K': '#342E48',  # shroud mid
    'j': '#5A5274',  # shroud rim light
    'd': '#07050A',  # hood shadow
    'b': '#ECE4CC',  # bone
    'B': '#B0A68C',  # bone shade
    'c': '#5EF0C8',  # soul-fire
    'C': '#E0FFF6',  # soul-fire core
    'q': '#1F7A6A',  # soul-fire dark
    'v': '#6A34C0',  # mourning sash
    'V': '#B888FF',  # sash light
    'w': '#4A3424',  # staff
    'W': '#7A5A3A',  # staff light
    'i': '#4F4B60',  # cage iron
    'I': '#9A96B4',  # cage iron light
    'x': '#FF4A5A',  # pain
}
TATTER = [(3, 5, 8, 11), (4, 7, 10, 12), (3, 6, 9, 12), (4, 6, 8, 11)]


def cage(c, x, y, glow=0, open_=False):
    """birdcage lantern, 3x5, top-left at (x, y); glow 0..2"""
    c.rect(x, y + 1, x + 2, y + 4, 'q' if glow == 0 else 'c')
    c.p(x + 1, y + 2 + (glow % 2), 'C' if glow else 'c')
    if glow >= 2:
        c.p(x + 1, y + 1, 'C'); c.p(x + 1, y + 3, 'C')
    for yy in range(y + 1, y + 5):
        c.p(x, yy, 'i'); c.p(x + 2, yy, 'I' if not open_ else 'c')
    c.rect(x, y, x + 2, y, 'I'); c.rect(x, y + 5, x + 2, y + 5, 'i')
    c.p(x + 1, y - 1, 'I'); c.p(x + 1, y + 6, 'i')                 # dome + finial: a lantern, not a box


def staff(c, x, y0, y1, hook=True):
    c.ln(x, y1, x, y0, 'w')
    for yy in range(y0, y1 + 1, 3):
        c.p(x, yy, 'W')
    if hook:
        c.p(x + 1, y0 - 1, 'w'); c.p(x + 2, y0 - 1, 'W')


def body(c, by=0, phase=0, face=True, sash=True, sleeve_up=False, lean=0):
    top = 6 + by
    c.trap(top, 14, 5 + lean, 10 + lean, 3, 12, 'k')                 # the shroud
    for y in range(top + 1, 15):
        c.p(5 + lean - (y - top) // 3, y, 'j' if y < 11 else 'K')    # rim light down the left edge
    for x in (6, 9):
        for y in range(top + 3, 15):
            if c.get(x, y) == 'k':
                c.p(x, y, 'K')                                       # fold lines
    for x in TATTER[phase % 4]:                                      # frayed hem drags on the ground
        c.p(x, 15, 'K')
    for x in (4, 7, 10, 12):
        if (x + phase) % 3 == 0:
            c.p(x, 14, '.')
    # hood, tip drooping to the right
    c.p(9, 0 + by, 'K')
    c.rect(8, 1 + by, 9, 1 + by, 'K')
    c.rect(7, 2 + by, 10, 2 + by, 'K')
    c.rect(6, 3 + by, 10, 3 + by, 'K')
    c.rect(5, 4 + by, 10, 6 + by, 'K')
    c.p(7, 2 + by, 'j'); c.p(6, 3 + by, 'j'); c.p(5, 4 + by, 'j'); c.p(5, 5 + by, 'j')
    if face:
        c.rect(6, 3 + by, 9, 5 + by, 'b')                            # cracked bone skull-mask
        c.p(9, 3 + by, 'B'); c.p(6, 3 + by, 'B')
        c.p(6, 4 + by, 'c'); c.p(8, 4 + by, 'c')                     # cold-fire eyes in dark sockets
        c.p(7, 4 + by, 'd'); c.p(9, 4 + by, 'B')
        c.p(6, 5 + by, 'q'); c.p(7, 5 + by, 'B'); c.p(8, 5 + by, 'd'); c.p(9, 5 + by, 'B')   # a soul-fire tear, the jaw
    else:
        for y in range(8 + by, 12 + by):
            c.p(8, y, 'B')                                           # a bone sigil stitched on the back
        c.p(7, 9 + by, 'B'); c.p(9, 9 + by, 'B')
    for x in range(5, 11):                                           # bead collar
        c.p(x, 6 + by, 'b' if x % 2 else 'B')
    if sash:
        for k, (x, y) in enumerate(((5, 8), (6, 9), (7, 10), (8, 11), (9, 12), (10, 13))):
            c.p(x, y + by, 'v'); c.p(x, y + by - 1, 'V' if k < 3 else 'v')
    # left sleeve + bony hand
    if sleeve_up:
        c.rect(3, 3 + by, 4, 7 + by, 'K'); c.p(3, 2 + by, 'b'); c.p(4, 2 + by, 'b'); c.p(2, 2 + by, 'B')
    else:
        c.rect(4, 7 + by, 4, 10 + by, 'K'); c.rect(3, 9 + by, 4, 10 + by, 'K')
        c.p(3, 11 + by, 'b'); c.p(4, 11 + by, 'B')


def front(by=0, phase=0, swing=0, glow=1, attack=None):
    c = Cv()
    body(c, by, phase)
    if attack == 'raise':
        staff(c, 11, 0, 12)
        c.p(11, 7 + by, 'b')
        cage(c, 12 + swing, 1, 2)
    elif attack == 'thrust':
        c.ln(12, 4, 8, 12, 'w'); c.p(12, 4, 'W')                     # staff swung down across the body
        cage(c, 6, 9, 2)
        c.p(10, 8 + by, 'b')
    else:
        staff(c, 11, 2 + by, 14)
        c.p(11, 8 + by, 'b')                                         # knuckles on the staff
        cage(c, 12 + swing, 4 + by + (1 if swing else 0), glow)
    return c


def side(by=0, phase=0, swing=0, glow=1):
    c = Cv()
    c.trap(6 + by, 14, 5, 9, 4, 11, 'k')
    for y in range(7 + by, 15):
        c.p(5 - (y - 6 - by) // 6, y, 'j' if y < 11 else 'K')
    for y in range(9 + by, 15):
        c.p(8, y, 'K')
    for x in TATTER[phase % 4][:3]:
        c.p(x + 1, 15, 'K')
    # hood profile, leaning forward, the tip hanging past the face
    c.rect(5, 2 + by, 9, 6 + by, 'K'); c.rect(6, 1 + by, 8, 1 + by, 'K'); c.p(9, 1 + by, 'K'); c.p(10, 2 + by, 'K')
    c.p(5, 3 + by, 'j'); c.p(6, 1 + by, 'j'); c.p(5, 2 + by, 'j')
    c.rect(9, 3 + by, 9, 5 + by, 'd'); c.p(10, 4 + by, 'b'); c.p(10, 5 + by, 'B'); c.p(9, 4 + by, 'c')
    for x in range(6, 10):
        c.p(x, 6 + by, 'b' if x % 2 else 'B')
    c.p(6, 8 + by, 'v'); c.p(7, 9 + by, 'v'); c.p(7, 8 + by, 'V')
    c.rect(9, 7 + by, 10, 8 + by, 'K'); c.p(11, 8 + by, 'b')        # arm reaching to the staff
    staff(c, 12, 2 + by, 14)
    cage(c, 13 + min(0, swing), 4 + by + abs(swing), glow)
    return c


def back(by=0, phase=0, swing=0, glow=1):
    c = Cv()
    body(c, by, phase, face=False, sash=False)
    staff(c, 11, 2 + by, 14)
    c.p(11, 8 + by, 'B')
    cage(c, 12 + swing, 4 + by + (1 if swing else 0), glow)
    g = flip(c.done())
    return [('.' + r[:-1]) for r in g]                               # keep the pivot pixel


def skull(c, x, y, eye='c'):
    c.rect(x, y, x + 2, y + 1, 'b'); c.p(x, y + 2, 'B'); c.p(x + 2, y + 2, 'B')
    c.p(x, y + 1, eye); c.p(x + 2, y + 1, eye)


def frames():
    F = {}
    F['front_idle'] = [front(0, 0, 0, 1).done(), front(-1, 1, 0, 2).done()]
    F['front_walk'] = [front(0, 0, 1, 1).done(), front(-1, 1, 0, 2).done(), front(0, 2, -1, 1).done(), front(-1, 3, 0, 2).done()]
    F['side_idle'] = [side(0, 0, 0, 1).done(), side(-1, 1, 0, 2).done()]
    F['side_walk'] = [side(0, 0, -1, 1).done(), side(-1, 1, 0, 2).done(), side(0, 2, 1, 1).done(), side(-1, 3, 0, 2).done()]
    F['back_idle'] = [back(0, 0, 0, 1), back(-1, 1, 0, 2)]
    F['back_walk'] = [back(0, 0, 1, 1), back(-1, 1, 0, 2), back(0, 2, -1, 1), back(-1, 3, 0, 2)]

    # ATTACK - "Let One Out": the lantern is raised, then swung down at the target as a soul tears free
    a0 = front(-1, 0, 0, 2, attack='raise')
    a1 = front(0, 1, 0, 2, attack='thrust')
    a2 = front(0, 2, 0, 1)
    F['attack'] = [a0.done(late=[(14, 0, 'c'), (11, 0, 'c')]),
                   a1.done(late=[(5, 8, 'C'), (9, 8, 'c'), (7, 15, 'c'), (4, 11, 'c'), (10, 12, 'C'), (7, 7, 'c')]),
                   a2.done(late=[(13, 2, 'c'), (15, 6, 'q')])]

    # ABILITY - "Open the Reliquary": she kneels, sets the cage on the earth and lets it open;
    # a sigil burns in the ground, bone hands claw up out of it, the thralls rise
    def kneel(by, glow, extra=None, arms=False):
        c = Cv()
        body(c, by, 0, sleeve_up=arms)
        c.p(11, 9 + by, 'b')
        cage(c, 11, 10, glow, open_=glow >= 2)
        if extra:
            extra(c)
        return c
    sig = [(x, 15, 'c') for x in (1, 3, 5, 11, 13, 15)]
    F['ability'] = [
        kneel(1, 1).done(late=[(12, 9, 'c')]),
        kneel(1, 2).done(late=sig + [(12, 7, 'C'), (12, 8, 'c'), (12, 6, 'c')]),
        kneel(0, 2, lambda c: (c.ln(1, 15, 2, 12, 'b'), c.p(1, 12, 'B'), c.p(3, 12, 'b'), c.ln(14, 15, 14, 12, 'b'), c.p(13, 12, 'b'), c.p(15, 12, 'B'))).done(
            late=sig + [(12, 5, 'C'), (12, 4, 'c')]),
        kneel(-1, 2, lambda c: (skull(c, 0, 4, 'C'), skull(c, 13, 3, 'C')), arms=True).done(
            late=sig + [(1, 8, 'c'), (14, 7, 'c'), (1, 9, 'q'), (14, 8, 'q'), (8, 0, 'C')]),
        kneel(0, 1, lambda c: (skull(c, 0, 1), skull(c, 13, 0))).done(late=[(1, 15, 'q'), (13, 15, 'q')]),
    ]

    # HIT - knocked back, the eyes flash, the cage swings wide
    h = front(0, 1, 1, 0)
    h.p(6, 4, 'x'); h.p(8, 4, 'x')
    F['hit'] = [h.done()]

    # DEATH - she folds into her shroud; the cage hits the ground and the soul inside goes home
    d0 = front(1, 0, 0, 0)
    d0.p(6, 4, 'q'); d0.p(8, 4, 'q')
    d1 = Cv()
    d1.trap(9, 15, 5, 10, 2, 13, 'k'); d1.rect(5, 7, 10, 10, 'K'); d1.rect(6, 8, 9, 9, 'b'); d1.p(6, 8, 'q'); d1.p(8, 8, 'q')
    d1.ln(9, 15, 15, 12, 'w'); cage(d1, 12, 10, 0)
    d2 = Cv()
    d2.trap(12, 15, 4, 11, 1, 14, 'k'); d2.rect(4, 13, 11, 13, 'K'); d2.rect(6, 12, 8, 12, 'b'); d2.p(6, 12, 'B')
    d2.ln(0, 15, 9, 15, 'w'); cage(d2, 12, 10, 0)
    d3 = Cv()
    d3.trap(12, 15, 4, 11, 1, 14, 'k'); d3.rect(4, 13, 11, 13, 'K'); d3.rect(6, 12, 8, 12, 'B')
    d3.ln(0, 15, 9, 15, 'w'); cage(d3, 12, 10, 0)
    F['death'] = [d0.done(), d1.done(late=[(13, 6, 'c'), (13, 4, 'C')]), d2.done(late=[(13, 2, 'c'), (13, 0, 'C')]), d3.done()]
    return F


LAYOUT = [
    ['front_idle', 'front_walk'],
    ['side_idle', 'side_walk'],
    ['back_idle', 'back_walk'],
    ['attack', 'hit'],
    ['ability'],
    ['death'],
]
