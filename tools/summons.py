"""The Summoner's other summons (4 frames each: 0/1 moving, 2 rearing up, 3 the strike).

thrall_hound  (T2-3 reliquaries)  - a skeletal hound, low and fast, soul-fire in its sockets
thrall_knight (T4-5 reliquaries)  - an armoured bone knight with a notched sword and a round shield
thrall_choir  (The Choir of Bones) - a skeleton choirboy in a white collar, carrying a lit candle
thrall_gilded (The Hollow Psalm)   - a gold-crowned skeleton with gilded ribs and a halo
"""
from drawkit import Cv
from town_art import PAL

BONE = dict(PAL, c='#5EF0C8', C='#E0FFF6', q='#1F7A6A', b='#ECE4CC', B='#9A9078', k='#0A0A0E',
            i='#4F4B60', I='#8E8AA6', g='#C98A22', G='#F2C14E', Y='#FFEB8F', w='#F0F0F0', r='#B0213F', f='#FFC94A')


def hound(f):
    c = Cv()
    by = -1 if f == 1 else 0
    lunge = 2 if f == 3 else 0
    c.rect(4 + lunge, 8 + by, 10 + lunge, 8 + by, 'b')                        # spine
    for x in range(5 + lunge, 10 + lunge, 2):
        c.p(x, 9 + by, 'B'); c.p(x, 10 + by, 'B')                              # ribs
    hx = 10 + lunge; hy = 5 + by - (2 if f == 2 else 0)
    c.rect(hx, hy, hx + 3, hy + 2, 'b'); c.p(hx + 4, hy + 1, 'b'); c.p(hx + 4, hy + 2, 'B')   # long skull, snout
    c.p(hx + 1, hy, 'c' if f < 2 else 'C'); c.rect(hx + 2, hy + 3, hx + 4, hy + 3, 'B' if f != 3 else 'k')   # eye, jaw
    if f == 3:
        c.p(hx + 3, hy + 4, 'b'); c.p(hx + 4, hy + 3, 'w')                     # the bite
    c.ln(3 + lunge, 8 + by, 1 + lunge, 6 + by, 'B')                            # tail
    legs = [((5, 11), (4, 15)), ((9, 11), (10, 15))] if f in (0, 3) else [((5, 11), (6, 15)), ((9, 11), (8, 15))]
    for (x0, y0), (x1, y1) in legs:
        c.ln(x0 + lunge, y0 + by, x1 + lunge, y1, 'b')
    return c.done(late=[(1 + lunge, 5, 'q')] if f < 2 else [(hx + 5, hy - 1, 'C')]), BONE


def skeleton(f, kind):
    c = Cv()
    by = -1 if f == 1 else 0
    lean = 1 if f == 3 else 0
    hx = 5 + lean
    c.rect(hx, 1 + by, hx + 4, 4 + by, 'b'); c.rect(hx + 1, 0 + by, hx + 3, 0 + by, 'b'); c.rect(hx + 3, 2 + by, hx + 4, 4 + by, 'B')
    eye = 'C' if f >= 2 else 'c'
    c.p(hx + 1, 2 + by, eye); c.p(hx + 3, 2 + by, eye); c.p(hx + 1, 3 + by, 'k'); c.p(hx + 3, 3 + by, 'k')
    c.rect(hx + 1, 5 + by, hx + 3, 5 + by, 'B')
    rib = 'G' if kind == 'gilded' else 'b'
    c.rect(7 + lean, 6 + by, 7 + lean, 11, 'B')
    for y in (7, 9):
        c.rect(5 + lean, y + by, 9 + lean, y + by, rib)
    c.rect(5, 11, 9, 11, 'b')
    if f == 0:
        c.ln(6, 12, 4, 15, 'b'); c.ln(8, 12, 10, 15, 'B')
    elif f == 1:
        c.ln(6, 12, 6, 15, 'b'); c.ln(8, 12, 8, 15, 'B')
    else:
        c.ln(6, 12, 4, 15, 'b'); c.ln(8, 12, 9, 15, 'B')
    late = []
    if kind == 'knight':
        c.rect(hx, 0 + by, hx + 4, 1 + by, 'I'); c.p(hx + 2, -1 + by, 'I'); c.rect(hx + 1, 2 + by, hx + 3, 2 + by, 'k'); c.p(hx + 1, 2 + by, eye); c.p(hx + 3, 2 + by, eye)   # helm, visor
        c.rect(5 + lean, 7 + by, 9 + lean, 10 + by, 'i'); c.rect(5 + lean, 7 + by, 5 + lean, 10 + by, 'I')   # a rusted breastplate
        c.ell(3, 9 + by, 2.2, 2.4, 'I'); c.p(3, 9 + by, 'r')                                        # round shield
        if f == 2:
            c.ln(11, 7, 13, 0, 'I'); c.p(12, 1, 'w')                                                # sword raised
        elif f == 3:
            c.ln(10, 7, 15, 11, 'I'); c.p(14, 10, 'w')                                              # the cut
        else:
            c.ln(11, 7, 12, 13, 'I')
    elif kind == 'choir':
        c.rect(5 + lean, 6 + by, 9 + lean, 6 + by, 'w'); c.p(4 + lean, 7 + by, 'w'); c.p(10 + lean, 7 + by, 'w')   # a white choir collar
        cx, cy = (11, 6 + by) if f < 2 else (11, 2) if f == 2 else (13, 8)
        c.rect(cx, cy, cx, cy + 3, 'w'); c.p(cx, cy - 1, 'f')                                       # its candle
        late += [(cx, cy - 2, 'Y')]
        c.ln(9 + lean, 8 + by, cx - 1, cy + 2, 'b')
        c.ln(5, 8 + by, 3, 10 + by, 'b')
    elif kind == 'gilded':
        c.rect(hx, -1 + by, hx + 4, 0 + by, 'G'); c.p(hx, -2 + by, 'G'); c.p(hx + 2, -2 + by, 'Y'); c.p(hx + 4, -2 + by, 'G')   # crown
        c.p(hx + 2, 4 + by, 'g')                                                                    # a gold tooth
        if f == 2:
            c.ln(5, 7, 2, 2, 'b'); c.ln(10, 7, 13, 2, 'B')
        elif f == 3:
            c.ln(6, 7, 11, 11, 'b'); c.ln(10, 7, 13, 12, 'B')
        else:
            c.ln(5, 7 + by, 3, 10 + by, 'b'); c.ln(10, 7 + by, 12, 10 + by, 'B')
        late += [(hx - 1, -1, 'Y'), (hx + 5, -1, 'Y')] if f % 2 else [(hx + 2, -3, 'Y')]
    return c.done(late=late), BONE


SUMMONS = {
    'thrall_hound': [hound(k) for k in range(4)],
    'thrall_knight': [skeleton(k, 'knight') for k in range(4)],
    'thrall_choir': [skeleton(k, 'choir') for k in range(4)],
    'thrall_gilded': [skeleton(k, 'gilded') for k in range(4)],
}
