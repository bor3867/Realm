"""EMILY, THE YAPPER - a very large, very talkative emperor penguin (48x48, realm-boss sheet row).

She waddled out of the Runeholt snow and has not stopped talking since. A round black
body, a huge white belly, a bright orange beak that is almost always open, a pink knitted
scarf with a bobble and a little pink bow on her head. Big shiny eyes.

Frames: I0 I1 (waddle) | T0 (flippers up, a big breath) | A0 (beak WIDE open, yapping)
        | S0 (belly slide, flat on her front) | D0 (dizzy) D1 (flopped over) D2 (a snow pile, a scarf, a bow)

The penguin chick minion (16x16, enemy sheet) lives here too: CHICK frames.
"""
from drawkit import Cv

PAL = {
    'o': '#06080E', 'k': '#1A1E2E', 'K': '#34405E', 'n': '#4E5E86',
    'w': '#E8EEF6', 'W': '#FFFFFF', 's': '#A8B8D0',
    'b': '#E0701A', 'B': '#FFB03A', 'm': '#7A1A2A',
    'r': '#D8457A', 'R': '#FF8AB8', 'e': '#101018', 'E': '#FFFFFF', 'c': '#8AE6FF',
}


def body(c, cx, by, lean=0, belly=True):
    c.ell(cx + lean, 27 + by, 14, 17, 'k')                       # the round black body
    c.ell(cx + lean - 5, 20 + by, 6, 9, 'K', only='k')           # a cold blue sheen
    if belly:
        c.ell(cx + lean, 31 + by, 10, 13, 'w')                   # the huge white belly
        c.ell(cx + lean - 3, 28 + by, 5, 8, 'W', only='w')
        c.ell(cx + lean + 5, 37 + by, 5, 6, 's', only='w')        # shadow under the belly curve


def head(c, cx, hy, mouth=0, eyes='open'):
    c.ell(cx, hy, 9, 8, 'k'); c.ell(cx - 3, hy - 3, 4, 3, 'K', only='k')
    c.ell(cx, hy + 2, 7, 5, 'w', only='k')                        # white face patch
    for ex in (cx - 4, cx + 4):                                   # big shiny eyes
        if eyes == 'x':
            c.ln(ex - 1, hy - 2, ex + 1, hy, 'e'); c.ln(ex + 1, hy - 2, ex - 1, hy, 'e')
        elif eyes == 'shut':
            c.rect(ex - 1, hy - 1, ex + 1, hy - 1, 'e')
        else:
            c.ell(ex, hy - 1, 1.8, 2.2, 'e'); c.p(ex - 1, hy - 2, 'E'); c.p(ex, hy, 'c')
    # the beak, open by `mouth` px
    c.trap(hy + 1, hy + 2, cx - 3, cx + 3, cx - 2, cx + 2, 'B')
    c.rect(cx - 1, hy + 3, cx + 1, hy + 3, 'b')
    if mouth:
        c.rect(cx - 2, hy + 3, cx + 2, hy + 3 + mouth, 'm')
        c.trap(hy + 4 + mouth, hy + 5 + mouth, cx - 3, cx + 3, cx - 1, cx + 1, 'b')
        c.p(cx, hy + 3 + mouth // 2, 'R')                         # a little tongue
    # the pink bow on her head
    c.ell(cx + 4, hy - 8, 2.4, 1.8, 'r'); c.ell(cx + 9, hy - 8, 2.4, 1.8, 'r'); c.p(cx + 6, hy - 8, 'R'); c.p(cx + 3, hy - 9, 'R')


def scarf(c, cx, sy, flap=0):
    c.trap(sy, sy + 3, cx - 9, cx + 9, cx - 10, cx + 10, 'r')
    for x in range(cx - 9, cx + 10, 3):
        c.p(x, sy + 1, 'R')                                       # knit stripes
    c.rect(cx + 5, sy + 3, cx + 8, sy + 10 + flap, 'r')           # the tail hanging down
    c.rect(cx + 5, sy + 5, cx + 8, sy + 5, 'R'); c.rect(cx + 5, sy + 8, cx + 8, sy + 8, 'R')
    c.ell(cx + 6.5, sy + 11 + flap, 1.8, 1.4, 'R')                # bobble


def feet(c, cx, lift=0):
    c.ell(cx - 6, 44 - (lift == -1) * 2, 4, 1.6, 'b'); c.ell(cx + 6, 44 - (lift == 1) * 2, 4, 1.6, 'b')
    c.p(cx - 8, 44 - (lift == -1) * 2, 'B'); c.p(cx + 4, 44 - (lift == 1) * 2, 'B')


def flippers(c, cx, by, up=False, flap=0):
    for side in (-1, 1):
        sx = cx + side * 13
        if up:
            c.ln(sx, 26 + by, sx + side * 6, 12 + by, 'k'); c.ln(sx + side, 26 + by, sx + side * 7, 13 + by, 'k')
            c.ln(sx + side * 2, 26 + by, sx + side * 7, 15 + by, 'K')
        else:
            c.ln(sx, 22 + by, sx + side * (4 + flap), 34 + by, 'k'); c.ln(sx + side, 22 + by, sx + side * (5 + flap), 33 + by, 'k')
            c.ln(sx, 24 + by, sx + side * (3 + flap), 33 + by, 'K')


def emily(f=0, mode='idle'):
    c = Cv(48, 48)
    cx = 24
    lean = (-1 if f % 2 == 0 else 1) if mode == 'idle' else 0
    by = -2 if mode in ('tell', 'attack') else 0
    feet(c, cx + lean, lift=lean if mode == 'idle' else 0)
    flippers(c, cx + lean, by, up=mode in ('tell', 'attack'), flap=1 if mode == 'attack' else 0)
    body(c, cx, by, lean)
    scarf(c, cx + lean, 18 + by, flap=f % 2)
    head(c, cx + lean, 11 + by, mouth={'idle': 1 + f % 2, 'tell': 1, 'attack': 4}[mode])
    late = []
    if mode == 'attack':                                          # yap lines bursting from the beak
        late = [(x, y, 'W') for x, y in ((14, 14), (13, 16), (33, 14), (34, 16), (12, 19), (35, 19))]
    if mode == 'tell':
        late = [(x, y, 'c') for x, y in ((9, 6), (38, 6), (24, 0))]
    return c.done(late=late)


def slide():
    """flat on her belly, sliding at you face-first"""
    c = Cv(48, 48)
    c.ell(24, 34, 20, 9, 'k'); c.ell(20, 30, 10, 3, 'K', only='k')
    c.ell(24, 38, 17, 5, 'w', only='k'); c.ell(20, 37, 8, 2, 'W', only='w')
    for side in (-1, 1):                                          # flippers swept back
        c.ln(24 + side * 6, 33, 24 + side * 20, 40, 'k'); c.ln(24 + side * 6, 34, 24 + side * 19, 41, 'K')
    head(c, 24, 24, mouth=3)
    c.trap(31, 33, 14, 34, 13, 35, 'r'); c.rect(32, 33, 40, 35, 'r'); c.ell(42, 34, 1.8, 1.6, 'R')   # scarf streaming behind
    late = [(x, 45, 'W') for x in (6, 10, 14, 34, 38, 42)] + [(x, 46, 's') for x in (8, 12, 36, 40)]   # spray of snow
    return c.done(late=late)


def death(stage):
    c = Cv(48, 48)
    if stage == 0:
        feet(c, 24); flippers(c, 24, 2, flap=2); body(c, 24, 2); scarf(c, 24, 20); head(c, 24, 13, mouth=2, eyes='x')
        return c.done(late=[(x, y, 'B') for x, y in ((14, 2), (24, 0), (34, 2))])           # little stars of dizziness
    if stage == 1:                                                # flopped over on her back, feet up
        c.ell(24, 38, 18, 8, 'k'); c.ell(24, 36, 14, 5, 'w', only='k')
        c.ell(10, 34, 6, 6, 'k'); c.ell(10, 35, 4, 3.4, 'w', only='k'); c.rect(4, 34, 6, 35, 'B')
        c.ell(10, 31, 1.4, 1, 'e'); c.ln(30, 30, 33, 26, 'b'); c.ln(36, 30, 39, 26, 'b')
        c.trap(31, 33, 14, 22, 14, 24, 'r')
        return c.done()
    c.ell(24, 42, 16, 5, 's'); c.ell(22, 41, 12, 3.4, 'w', only='s'); c.ell(20, 40, 6, 2, 'W', only='w')
    c.rect(28, 38, 36, 40, 'r'); c.rect(28, 39, 36, 39, 'R'); c.ell(37, 39, 1.6, 1.4, 'R')   # her scarf on the snow
    c.ell(14, 38, 2.4, 1.8, 'r'); c.ell(19, 38, 2.4, 1.8, 'r'); c.p(16, 38, 'R')             # and her bow
    return c.done()


FRAMES = [emily(0), emily(1), emily(0, 'tell'), emily(1, 'attack'), slide(), death(0), death(1), death(2)]


# ---------------------------------------------------------------- her chicks (16x16, enemy sheet: move 0-3, tell, attack, death 0-2)
def chick(f=0, mode='move'):
    c = Cv()
    by = -1 if (mode == 'move' and f % 2) else 0
    lean = [0, 1, 0, -1][f % 4] if mode == 'move' else 0
    c.ell(8 + lean, 9 + by, 5, 5.4, 's'); c.ell(7 + lean, 8 + by, 3, 3, 'w', only='s')       # fluffy grey down
    c.ell(8 + lean, 5 + by, 3.6, 3.2, 'k'); c.ell(8 + lean, 6 + by, 2.4, 1.6, 'w', only='k')  # little black cap, white face
    c.p(7 + lean, 5 + by, 'e'); c.p(9 + lean, 5 + by, 'e'); c.p(7 + lean, 4 + by, 'E')
    beak = 2 if mode == 'attack' else 1
    c.rect(8 + lean, 7 + by, 8 + lean, 6 + by + beak, 'b'); c.p(9 + lean, 7 + by, 'B')
    c.p(4 + lean, 9 + by - (mode == 'tell') * 3, 's'); c.p(12 + lean, 9 + by - (mode == 'tell') * 3, 's')   # stubby flippers
    c.p(6, 14, 'b'); c.p(10, 14, 'b')
    late = [(13, 3, 'W'), (14, 2, 'W')] if mode == 'attack' else []
    return c.done(late=late)


def chick_dead(k):
    c = Cv()
    if k == 0:
        c.ell(8, 10, 5, 4.4, 's'); c.ell(8, 6, 3.4, 3, 'k'); c.p(7, 6, 'e'); c.p(9, 6, 'e'); c.p(8, 8, 'b')
    elif k == 1:
        c.ell(8, 12, 6, 2.6, 's'); c.ell(4, 11, 2.4, 2, 'k'); c.p(9, 10, 'b'); c.p(11, 10, 'b')
    else:
        c.ell(8, 13, 5, 1.6, 'w'); c.p(6, 12, 's'); c.p(10, 12, 'W')
    return c.done()


CHICK = [chick(0), chick(1), chick(0, 'tell'), chick(0, 'attack')] + [chick_dead(k) for k in range(3)]
