"""THE MIRROR-KNIGHT - Duelist class.

A duellist who has never lost, because her face is a mirror: every opponent
fights themselves. Plumed helm around a cracked looking-glass face, a cuirass
of silvered glass panels, a short crimson cape that never stops moving, a
needle-thin rapier with a gold basket hilt. The silhouette: a slim upright
figure with a plume and one long thin diagonal.

All frames 16x16, pivot (8, 15). Side frames face RIGHT and are mirror-safe.
"""
from drawkit import Cv, flip

PAL = {
    'o': '#0A0C14',  # outline
    'n': '#1E2A44',  # navy undersuit
    'N': '#34466E',  # navy light
    's': '#7AA4CC',  # silvered glass
    'S': '#CFE8FF',  # glass highlight
    'W': '#FFFFFF',  # glint
    'm': '#9ACCE8',  # mirror face
    'M': '#5A86B0',  # mirror face shade
    'c': '#7A1424',  # cape
    'C': '#C83444',  # cape light
    'g': '#E3B95A',  # gold
    'G': '#9A6A1A',  # gold shade
    'k': '#141018',  # boots
    'r': '#C8D4E0',  # blade
    'x': '#FF4A5A',  # pain
}


def helm(c, x, y, face=True, crack=True, glow=False):
    """dark steel helm framing a looking-glass face; a crimson crest on top"""
    c.rect(x, y, x + 3, y + 3, 'N'); c.p(x, y, 'n'); c.p(x + 3, y, 'n')
    if face:
        c.rect(x, y + 1, x + 3, y + 3, 'm'); c.rect(x + 2, y + 2, x + 3, y + 3, 'M')
        c.p(x, y + 1, 'W' if glow else 'S'); c.p(x + 1, y + 1, 'W' if glow else 'm')
        if crack:
            c.p(x + 2, y + 1, 'W'); c.p(x + 1, y + 2, 'W'); c.p(x + 2, y + 3, 'S')     # the crack
    c.rect(x, y + 4, x + 3, y + 4, 'n')                                          # gorget
    for k in range(5):
        c.p(x + k - 1, y - 1 + (1 if k in (0, 4) else 0), 'C' if k % 2 else 'c')     # crest


def body(c, by=0, step=0, cape=0, back=False):
    # cape behind, fluttering left
    cx = 3 - cape
    c.trap(5 + by, 12, 5, 6, cx, 6, 'c')
    c.ln(cx, 12, 5, 6 + by, 'C') if not back else None
    # cuirass of silvered glass panels
    c.rect(5, 6 + by, 10, 9 + by, 's')
    for x in (6, 8):
        c.rect(x, 6 + by, x, 9 + by, 'S')
    c.p(10, 6 + by, 'n'); c.p(10, 8 + by, 'n')
    c.rect(5, 10 + by, 10, 10 + by, 'g'); c.p(7, 10 + by, 'W')     # gold belt
    # legs + boots, in a duellist's stance
    lx, rx = (6, 9) if step == 0 else (5, 10) if step == 1 else (7, 9) if step == 2 else (6, 10)
    c.rect(lx, 11 + by, lx + 1, 13, 'n'); c.rect(rx, 11 + by, rx + 1, 13, 'N')
    c.rect(lx, 14, lx + 1, 15, 'k'); c.rect(rx, 14, rx + 1, 15, 'k')
    if back:
        c.trap(5 + by, 12, 5, 10, 4, 11, 'c')                       # from behind: all cape
        for y in range(6 + by, 12, 2):
            c.p(7, y, 'C')


def front(by=0, step=0, cape=0, blade='low', glow=False):
    c = Cv()
    body(c, by, step, cape)
    helm(c, 6, 1 + by, glow=glow)
    c.rect(4, 6 + by, 4, 9 + by, 'n'); c.p(4, 10 + by, 'S')         # left arm, hand on hip
    if blade == 'low':                                              # en garde: point down and out
        c.rect(11, 6 + by, 11, 7 + by, 'n'); c.p(12, 8 + by, 'g'); c.p(11, 8 + by, 'G'); c.p(12, 7 + by, 'G')
        c.ln(13, 9 + by, 15, 13 + by, 'r'); c.p(13, 9 + by, 'W')
    elif blade == 'up':                                             # drawn back over the shoulder
        c.rect(11, 5 + by, 11, 6 + by, 'n'); c.p(12, 4 + by, 'g'); c.p(11, 4 + by, 'G')
        c.ln(12, 3 + by, 15, 0, 'r'); c.p(13, 2, 'W')
    elif blade == 'thrust':                                         # the lunge, straight down the line
        c.rect(9, 9 + by, 10, 10 + by, 'n'); c.p(9, 11 + by, 'g'); c.p(10, 11 + by, 'G')
        c.ln(9, 12 + by, 9, 15, 'r'); c.ln(10, 12 + by, 10, 13 + by, 'S')
    return c


def side(by=0, step=0, cape=0):
    c = Cv()
    cx = 2 - cape
    c.trap(5 + by, 12, 4, 5, cx, 5, 'c'); c.ln(cx, 12, 4, 6 + by, 'C')
    c.rect(5, 6 + by, 9, 9 + by, 's'); c.rect(6, 6 + by, 6, 9 + by, 'S'); c.rect(9, 6 + by, 9, 9 + by, 'n')
    c.rect(5, 10 + by, 9, 10 + by, 'g')
    if step in (1, 3):
        c.rect(5 - (step == 3), 11 + by, 6 - (step == 3), 13, 'n'); c.rect(8 + (step == 1), 11 + by, 9 + (step == 1), 13, 'N')
        c.rect(5 - (step == 3), 14, 6 - (step == 3), 15, 'k'); c.rect(8 + (step == 1), 14, 10 + (step == 1), 15, 'k')
    else:
        c.rect(5, 11 + by, 6, 13, 'n'); c.rect(8, 11 + by, 9, 13, 'N'); c.rect(5, 14, 6, 15, 'k'); c.rect(8, 14, 10, 15, 'k')
    # profile helm: the mirror faces forward
    c.rect(5, 1 + by, 8, 4 + by, 'N'); c.rect(6, 0 + by, 7, 0 + by, 'N'); c.p(5, 1 + by, 'n')
    c.rect(8, 1 + by, 9, 4 + by, 'm'); c.p(9, 1 + by, 'W'); c.p(8, 3 + by, 'M'); c.p(9, 4 + by, 'M')
    c.rect(5, 5 + by, 8, 5 + by, 'n')
    c.p(4, 0 + by, 'c'); c.p(3, 0 + by, 'C'); c.p(3, 1 + by, 'c'); c.p(2, 2 + by, 'c')       # plume streams back
    c.rect(10, 6 + by, 11, 6 + by, 'n'); c.p(12, 6 + by, 'g'); c.p(12, 7 + by, 'G')         # arm extended, en garde
    c.ln(13, 6 + by, 15, 6 + by, 'r'); c.p(14, 6 + by, 'W')
    return c


def back(by=0, step=0, cape=0):
    c = Cv()
    body(c, by, step, cape, back=True)
    helm(c, 6, 1 + by, face=False)
    c.rect(11, 6 + by, 11, 7 + by, 'n'); c.p(12, 8 + by, 'g'); c.ln(13, 9 + by, 15, 13 + by, 'r')
    g = flip(c.done())
    return [('.' + r[:-1]) for r in g]


def frames():
    F = {}
    F['front_idle'] = [front(0, 0, 0).done(), front(-1, 0, 1).done()]
    F['front_walk'] = [front(0, 1, 1).done(), front(-1, 0, 0).done(), front(0, 3, 1).done(), front(-1, 2, 0).done()]
    F['side_idle'] = [side(0, 0, 0).done(), side(-1, 0, 1).done()]
    F['side_walk'] = [side(0, 1, 1).done(), side(-1, 0, 0).done(), side(0, 3, 1).done(), side(-1, 0, 0).done()]
    F['back_idle'] = [back(0, 0, 0), back(-1, 0, 1)]
    F['back_walk'] = [back(0, 1, 1), back(-1, 0, 0), back(0, 3, 1), back(-1, 2, 0)]

    # ATTACK - "Riposte": blade drawn back, the lunge, the flourish
    F['attack'] = [front(-1, 0, 1, 'up').done(late=[(14, 1, 'W')]),
                   front(1, 1, 2, 'thrust').done(late=[(8, 15, 'W'), (11, 14, 'S'), (7, 13, 'S')]),
                   front(0, 0, 1, 'low').done(late=[(15, 10, 'W')])]

    # ABILITY - "Mirror Step": the face flares, she breaks into glass, is gone, re-forms elsewhere
    def shards(c, pts):
        for x, y, ch in pts:
            c.p(x, y, ch)
    a0 = front(0, 0, 1, glow=True)
    a1 = Cv()
    shards(a1, [(5, 2, 'm'), (6, 1, 'S'), (9, 3, 'W'), (10, 2, 'm'), (4, 6, 's'), (11, 7, 'S'), (6, 8, 's'), (9, 9, 'S'), (5, 11, 'c'),
                (10, 12, 'c'), (7, 13, 'n'), (8, 5, 'W'), (3, 9, 'S'), (12, 4, 's'), (7, 3, 'm'), (8, 11, 'g')])
    a2 = Cv()
    shards(a2, [(2, 1, 'S'), (13, 0, 'W'), (1, 8, 's'), (14, 9, 'S'), (4, 14, 'm'), (12, 14, 's'), (8, 6, 'W'), (7, 9, 'S')])
    a3 = front(0, 0, 1, glow=True)
    a3.recolor({'n': 'S', 'N': 'S', 'c': 'S', 'C': 'W', 's': 'W', 'k': 'S', 'g': 'W', 'G': 'S'})   # re-forming out of pure light
    a4 = front(0, 0, 0)
    F['ability'] = [a0.done(late=[(3, 2, 'W'), (12, 2, 'W')]), a1.done(), a2.done(), a3.done(), a4.done(late=[(2, 4, 'S'), (13, 12, 'S')])]

    # HIT - the mirror cracks red
    h = front(1, 0, 2)
    h.p(7, 3, 'x'); h.p(8, 4, 'x'); h.p(6, 4, 'x')
    F['hit'] = [h.done()]

    # DEATH - she shatters; the mirror falls face-up and reflects the sky
    d0 = front(1, 0, 2, glow=True)
    d0.p(7, 3, 'x'); d0.p(8, 4, 'x')
    d1 = Cv()
    d1.trap(10, 15, 5, 9, 3, 11, 'c'); d1.rect(5, 11, 10, 13, 's'); d1.rect(6, 7, 9, 10, 'm'); d1.p(7, 8, 'W')
    d1.ln(10, 15, 15, 13, 'r')
    shards(d1, [(3, 6, 'S'), (12, 5, 'm'), (13, 9, 'W')])
    d2 = Cv()
    d2.trap(13, 15, 4, 11, 2, 13, 'c'); d2.rect(5, 12, 9, 13, 's'); d2.rect(6, 11, 9, 12, 'm'); d2.p(7, 11, 'W')
    d2.ln(9, 15, 15, 14, 'r')
    shards(d2, [(1, 14, 'S'), (14, 12, 'm'), (12, 15, 'S')])
    d3 = Cv()
    d3.trap(13, 15, 4, 11, 2, 13, 'c'); d3.rect(5, 12, 9, 13, 'M'); d3.rect(6, 11, 9, 12, 'M'); d3.p(7, 11, 'S')
    d3.ln(9, 15, 15, 14, 'r')
    F['death'] = [d0.done(), d1.done(), d2.done(late=[(7, 8, 'W')]), d3.done()]
    return F


LAYOUT = [
    ['front_idle', 'front_walk'],
    ['side_idle', 'side_walk'],
    ['back_idle', 'back_walk'],
    ['attack', 'hit'],
    ['ability'],
    ['death'],
]
