"""Equipment icons, 16x16, three FORMS per type so tier reads in the shape too:
form 0 = T0-3 (plain), form 1 = T4-7 (adorned), form 2 = T8+ (ornate).

Palette letters: a/b/c = tier metal dark/mid/light, d = tier gem/glow,
w/W wood, l/L leather, f/F ivory cloth/fur, k dark iron. 'o' outline is added
automatically. Weapons point up-right on a diagonal, like a held item.
"""
import math

from pixlib import blank, line, outline, rows

MAT = {'w': '#5A3A22', 'W': '#9A6A3E', 'l': '#4A2E22', 'L': '#8A5436', 'f': '#F4ECD6', 'F': '#B8A888', 'k': '#2A2434', 'q': '#07050B',
       'g': '#CFE8FF', 'G': '#7AA4CC'}


def P(c, x, y, ch):
    if 0 <= x < 16 and 0 <= y < 16:
        c[y][x] = ch


def disc(c, cx, cy, r, ch):
    for y in range(16):
        for x in range(16):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                c[y][x] = ch


def ring(c, cx, cy, r, ch, t=1.0):
    for y in range(16):
        for x in range(16):
            d = math.hypot(x - cx, y - cy)
            if r - t < d <= r + 0.35:
                c[y][x] = ch


UP = {'a': 'b', 'b': 'c', 'c': 'h', 'w': 'W', 'l': 'L', 'F': 'f'}
DOWN = {'h': 'c', 'c': 'b', 'b': 'a', 'W': 'w', 'L': 'l', 'f': 'F'}


def shade(c):
    """Pixel-art lighting from the top-left: rim-light the edges facing the light,
    darken the edges facing away. Works on every material letter."""
    H, W = len(c), len(c[0])
    out = [r[:] for r in c]

    def edge(x, y):
        return not (0 <= x < W and 0 <= y < H) or c[y][x] in '.o'
    for y in range(H):
        for x in range(W):
            ch = c[y][x]
            if ch in '.ok':
                continue
            if (edge(x, y - 1) or edge(x - 1, y)) and ch in UP:
                out[y][x] = UP[ch]
            elif (edge(x, y + 1) or edge(x + 1, y)) and ch in DOWN:
                out[y][x] = DOWN[ch]
    return out


def drop_shadow(c):
    """A hard 1px shadow down-right so icons sit up off the slot."""
    H, W = len(c), len(c[0])
    out = [r[:] for r in c]
    for y in range(H - 1):
        for x in range(W - 1):
            if c[y][x] != '.' and c[y + 1][x + 1] == '.':
                out[y + 1][x + 1] = 'q'
    return out


def done(c, late=()):
    c = shade(c)
    outline(c)
    for x, y, ch in late:                  # pixels drawn after the outline (rays, sparkles)
        P(c, x, y, ch)
    return rows(drop_shadow(c))


# ---------------------------------------------------------------- weapons
def gauntlet(form):
    g = ["................", "................", "...ooooooooooo..", "...obcbacbacbo..", "...obbbabbabbo..",
         "..oobbbbbbbbbo..", "..obobbbbbbbbo..", "..obbobbbbbbao..", "...oabbbbbbaao..", "....oaaaaaaao...",
         "....olLLLLLlo...", "....ollllllLo...", "....ooooooooo...", "................", "................", "................"]
    c = [list(r) for r in g]
    if form >= 1:
        for x in (5, 8, 11):
            P(c, x, 3, 'd')                         # knuckle studs
            P(c, x, 1, 'c'); P(c, x, 0, 'c') if form == 2 else None   # knuckle spikes
            P(c, x, 2, 'b')
        for x in range(5, 12):
            P(c, x, 10, 'b')                        # metal cuff band
    if form == 2:
        for x in range(5, 12, 2):
            P(c, x, 7, 'd')                         # furnace grate on the back of the hand
        P(c, 4, 11, 'f'); P(c, 12, 11, 'f'); P(c, 3, 12, 'f'); P(c, 13, 12, 'F')   # fur at the cuff
    c = [[ch if ch != 'o' else '.' for ch in r] for r in c]      # re-outline after shading
    return done(c)


def tongs(form):
    """Smithing tongs: a clear scissor-X, jaws biting a glowing billet."""
    c = blank(16, 16)
    line(c, 6, 10, 10, 2, 'c'); line(c, 7, 10, 11, 2, 'b')        # jaw A
    line(c, 6, 10, 14, 6, 'b'); line(c, 6, 11, 14, 7, 'a')        # jaw B
    line(c, 6, 10, 0, 13, 'b'); line(c, 6, 11, 1, 14, 'a')        # handle A
    line(c, 6, 10, 3, 15, 'b')                                    # handle B
    for x, y in ((0, 13), (1, 13), (1, 14), (2, 15), (3, 15)):
        P(c, x, y, 'W')                                           # wooden grips
    s = 2 if form == 0 else 3
    for y in range(3, 3 + s):                                     # the billet between the jaws
        for x in range(11, 11 + s):
            P(c, x, y, 'd')
    P(c, 11, 3, 'c')
    P(c, 6, 10, 'd' if form else 'c')                             # rivet
    if form == 2:
        P(c, 1, 13, 'd'); P(c, 3, 15, 'd')                        # wrapped grips
    late = [(15, 1, 'c'), (13, 1, 'c'), (15, 3, 'd')] if form == 2 else [(14, 2, 'c')] if form == 1 else []
    return done(c, late)


def sunrod(form):
    """The Priest's wand: a shaft topped by a sun-disc. Rays and a halo grow with tier."""
    c = blank(16, 16)
    mat = ('W', 'w') if form == 0 else ('c', 'b')
    line(c, 2, 14, 9, 7, mat[0]); line(c, 3, 14, 10, 7, mat[1])       # shaft, 2px
    if form >= 1:
        for k in range(3, 9, 2):
            P(c, k, 15 - k, 'd'); P(c, k + 1, 15 - k, 'd')             # gilded wraps
    P(c, 1, 15, 'b'); P(c, 2, 15, 'b')                                # pommel
    cx, cy = 11, 4
    disc(c, cx, cy, 2.6, 'c')
    disc(c, cx, cy, 1.2, 'd')
    ring(c, cx, cy, 2.6, 'b', 0.8)
    late = []
    rays = [(0, -1), (1, 0), (0, 1), (-1, 0)] + ([(1, -1), (1, 1), (-1, -1), (-1, 1)] if form >= 1 else [])
    for dx, dy in rays:
        L = 4 if dx and dy else 4
        late.append((cx + dx * L, cy + dy * L, 'c'))
        if form == 2 and not (dx and dy):
            late.append((cx + dx * 5, cy + dy * 5, 'd'))
    if form == 2:
        late += [(cx + 3, cy - 3, 'd'), (cx - 3, cy - 3, 'd')]
    return done(c, late)


# ---------------------------------------------------------------- abilities
def bellows(form):
    """Hand bellows in side view: two boards, a zig-zag leather pleat, a nozzle pointing right."""
    c = blank(16, 16)
    for k, (y, x0, x1) in enumerate(((4, 2, 8), (5, 2, 10), (9, 2, 10), (10, 2, 8))):
        for x in range(x0, x1 + 1):
            P(c, x, y, 'b' if y in (4, 10) else 'w')               # boards, tier-metal rims
    for x in range(3, 11):                                         # pleats
        P(c, x, 6, 'L' if x % 2 else 'l'); P(c, x, 7, 'l' if x % 2 else 'L'); P(c, x, 8, 'L' if x % 2 else 'l')
    for y in (3, 11):                                              # handles
        P(c, 1, y, 'W'); P(c, 2, y, 'W')
    P(c, 0, 2, 'w'); P(c, 0, 12, 'w')
    for x in range(11, 15):                                        # brass nozzle
        P(c, x, 6, 'c' if x < 13 else 'b'); P(c, x, 7, 'b'); P(c, x, 8, 'a' if x < 13 else '.')
    P(c, 15, 7, 'b')
    P(c, 6, 5, 'd')                                                # emblem
    if form >= 1:
        P(c, 4, 5, 'c'); P(c, 8, 5, 'c'); P(c, 4, 9, 'c'); P(c, 8, 9, 'c')   # studs
        P(c, 5, 5, 'd'); P(c, 7, 5, 'd')
    late = [(15, 5, 'd'), (15, 6, 'c'), (14, 4, 'd'), (15, 9, 'd')] if form == 2 else []
    return done(c, late)


def seal(form):
    """The Forge Knight's oath-seal: unmistakably an anvil."""
    c = blank(16, 16)
    for x in range(2, 14):
        P(c, x, 5, 'c')                                               # struck face
    for x in range(0, 14):
        P(c, x, 6, 'b')
    for x in range(2, 13):
        P(c, x, 7, 'b')
    for x in range(4, 12):
        P(c, x, 8, 'a')
    for y in range(9, 11):                                            # waist
        for x in range(6, 10):
            P(c, x, y, 'a')
    for y in range(11, 14):                                           # foot
        for x in range(4 - (y - 11), 12 + (y - 11)):
            P(c, x, y, 'b' if y < 13 else 'a')
    if form >= 1:
        P(c, 8, 12, 'd'); P(c, 7, 11, 'd'); P(c, 8, 11, 'd')          # oath rune
    if form == 2:
        for x in range(5, 11):
            P(c, x, 6 + (x % 2), 'd')                                 # molten crack across the face
    late = [(10, 3, 'c'), (11, 2, 'c')] if form == 2 else []
    return done(c, late)


def halo(form):
    c = blank(16, 16)
    ring(c, 8, 8, 5, 'b', 2)                                          # the ring itself
    ring(c, 8, 8, 5, 'c', 0.8)
    for x, y in ((4, 4), (5, 3)):
        P(c, x, y, 'd')
    late = []
    n = 4 if form == 0 else 8
    for k in range(n):
        a = k / n * math.tau - math.pi / 2
        late.append((round(8 + math.cos(a) * 7), round(8 + math.sin(a) * 7), 'c'))
        if form == 2:
            late.append((round(8 + math.cos(a) * 6.2), round(8 + math.sin(a) * 6.2), 'd'))
    if form >= 1:
        disc(c, 8, 8, 1.2, 'd')                                       # a floating gem inside
    return done(c, late)


# ---------------------------------------------------------------- armour
def plate(form):
    """Forgeplate: unmistakably METAL - a heavy cuirass, gorget, huge riveted pauldrons, specular glints."""
    c = blank(16, 16)
    for y in range(4, 14):                                            # cuirass, tapering to the waist
        w = 4 if y < 10 else 4 - (y - 9) // 2
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'c' if x < 6 else 'b' if x < 9 else 'a')
    for y in range(5, 11):
        P(c, 7, y, 'h'); P(c, 8, y, 'a')                              # centre ridge: bright edge, dark side
    for x in range(5, 11):
        P(c, x, 3, 'k')                                               # gorget
    P(c, 6, 2, 'b'); P(c, 9, 2, 'b')
    big = 1 if form >= 1 else 0
    disc(c, 3, 5, 2.6, 'b'); disc(c, 2.5, 4.5, 1.3, 'c'); P(c, 2, 4, 'h')
    disc(c, 12.5, 5, 2.6 + big, 'b'); disc(c, 12, 4.5, 1.4 + big * 0.5, 'c'); P(c, 12, 4, 'h')
    for x, y in ((3, 7), (13, 7), (5, 9), (10, 9)):
        P(c, x, y, 'k')                                               # rivets
    for x in range(5, 11):
        P(c, x, 11, 'L')                                              # belt
    P(c, 7, 11, 'd'); P(c, 8, 11, 'd')
    for x in (5, 7, 9):
        P(c, x, 12, 'b'); P(c, x, 13, 'a')                            # tasset plates
    if form == 2:
        P(c, 7, 7, 'd'); P(c, 6, 8, 'd'); P(c, 8, 8, 'd'); P(c, 7, 9, 'd')
    late = [(14, 1, 'c'), (15, 0, 'h')] if form == 2 else []
    return done(c, late)


def coat(form):
    """The Brawler's soot-coat: fur collar, hanging sleeves, belted, flared hem."""
    c = blank(16, 16)
    for y in range(4, 14):                                         # body
        w = 4 if y < 11 else 4 + (y - 10)
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'b' if x < 8 else 'a')
    for k in range(7):                                             # sleeves hang down and out
        for d in (0, 1):
            P(c, 3 - k // 3 - d, 5 + k, 'b'); P(c, 12 + k // 3 + d, 5 + k, 'a')
    P(c, 1, 12, 'l'); P(c, 2, 12, 'l'); P(c, 13, 12, 'l'); P(c, 14, 12, 'l')   # wraps at the cuffs
    for y in range(5, 14):
        P(c, 8, y, 'k')                                            # front opening
    for x in range(4, 12):
        P(c, x, 9, 'L')                                            # belt
    P(c, 8, 9, 'd')
    for x in range(3, 13):                                         # fur collar
        P(c, x, 3, 'f'); P(c, x, 4, 'F' if x % 2 else 'f')
    for x in (4, 7, 10):
        P(c, x, 2, 'f')
    if form >= 1:
        for x in range(11, 15):
            P(c, x, 4, 'c'); P(c, x, 5, 'b')                       # one heavy shoulder plate
        P(c, 13, 4, 'd')
    if form == 2:
        for x in range(3, 13, 2):
            P(c, x, 13, 'd')                                       # ember-stitched hem
    return done(c)


def vestment(form):
    """The Priest's robe: unmistakably CLOTH - deep hood, bell sleeves, flowing folds, dyed in the tier colour."""
    c = blank(16, 16)
    disc(c, 7.5, 3, 3, 'b'); disc(c, 7.5, 3.6, 1.8, 'k')               # deep hood, shadowed opening
    for y in range(5, 15):                                            # robe flaring to the hem
        w = 3 + (y - 5) * 0.55
        for x in range(round(8 - w), round(8 + w)):
            P(c, x, y, 'c' if x < 6 else 'b')
    for k in range(6):                                                # wide bell sleeves, drooping
        P(c, 4 - k // 2, 6 + k, 'b'); P(c, 3 - k // 2, 7 + k, 'a')
        P(c, 11 + k // 2, 6 + k, 'b'); P(c, 12 + k // 2, 7 + k, 'a')
    for x in (5, 10):
        for y in range(8, 15):
            if c[y][x] != '.':
                c[y][x] = 'a'                                         # fold lines
    for y in range(5, 15):
        P(c, 7, y, 'f'); P(c, 8, y, 'F')                              # ivory stole down the front
    for x in range(2, 14):
        if c[14][x] != '.':
            c[14][x] = 'd'                                            # embroidered hem
    if form >= 1:
        disc(c, 7.5, 9, 1.2, 'd')                                     # sun emblem on the stole
    if form == 2:
        P(c, 4, 1, 'd'); P(c, 11, 1, 'd'); P(c, 7, 0, 'd')
        for x in range(4, 12, 2):
            P(c, x, 5, 'd')
    return done(c)


def ring_icon(form):
    c = blank(16, 16)
    ring(c, 8, 10, 4, 'b', 1.6)
    ring(c, 8, 10, 4, 'c', 0.6)
    for y in (12, 13):
        for x in range(6, 11):
            if c[y][x] == 'b':
                c[y][x] = 'a'
    if form == 0:
        disc(c, 8, 5.5, 1.2, 'd')
    elif form == 1:
        disc(c, 8, 5, 1.8, 'd'); P(c, 6, 6, 'c'); P(c, 10, 6, 'c')    # set stone in prongs
    else:
        disc(c, 8, 4.5, 2.6, 'd'); P(c, 7, 3, 'c'); P(c, 5, 6, 'c'); P(c, 11, 6, 'c')
    late = [(12, 1, 'c'), (13, 2, 'c'), (11, 2, 'c'), (12, 3, 'c')] if form == 2 else []
    return done(c, late)


# ---------------------------------------------------------------- Summoner
def lantern(form):
    """Soul-lantern: a domed birdcage on a hook, a soul burning inside in the tier's colour."""
    c = blank(16, 16)
    for y in range(5, 13):                                            # cage bars
        for x in (4, 7, 10) if form < 2 else (4, 6, 8, 10):
            P(c, x, y, 'b')
    for x in range(4, 11):
        P(c, x, 4, 'c'); P(c, x, 13, 'a')                             # rims
    disc(c, 7, 4, 2.3, 'c'); P(c, 7, 2, 'h')                          # dome
    P(c, 7, 1, 'b'); P(c, 8, 0, 'b'); P(c, 9, 0, 'b'); P(c, 10, 1, 'b')   # hook
    for y in range(6, 12):
        for x in (5, 6, 8, 9) if form < 2 else (5, 7, 9):
            P(c, x, y, 'd')                                           # the soul inside
    P(c, 6, 8, 'f'); P(c, 7, 9, 'f') if form else None
    P(c, 7, 14, 'b')                                                  # finial
    late = []
    if form >= 1:
        late += [(12, 6, 'd'), (13, 4, 'd'), (2, 9, 'd')]             # wisps escaping
    if form == 2:
        late += [(14, 3, 'f'), (1, 7, 'f'), (12, 11, 'd')]
    return done(c, late)


def reliquary(form):
    """A bone reliquary: a little coffin bound in the tier's metal, a skull set in the lid."""
    c = blank(16, 16)
    for y in range(3, 14):
        w = 4 if y < 6 else 5 if y < 10 else 4
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'f' if x < 8 else 'F')
    for x in range(3, 13):
        P(c, x, 3, 'b'); P(c, x, 13, 'a')                             # metal bands
    for y in range(3, 14):
        P(c, 3 if y < 6 or y >= 10 else 2, y, 'b')
    disc(c, 7.5, 7.5, 1.9, 'F'); P(c, 6, 7, 'd'); P(c, 9, 7, 'd'); P(c, 7, 9, 'k'); P(c, 8, 9, 'k')   # skull, glowing eyes
    if form >= 1:
        for x, y in ((4, 4), (11, 4), (4, 12), (11, 12)):
            P(c, x, y, 'c')                                           # corner studs
    late = []
    if form == 2:
        late += [(4, 1, 'd'), (4, 2, 'f'), (11, 1, 'd'), (11, 2, 'f'), (7, 0, 'd')]   # grave candles on the lid
    return done(c, late)


def shroud(form):
    """Funeral shroud: a tall pointed hood, a heavy drape, a bead collar and a frayed hem. No sleeves."""
    c = blank(16, 16)
    for y in range(1, 15):
        w = 1 if y < 3 else 2 if y < 5 else 3 + (y - 5) * 0.45
        for x in range(round(8 - w), round(8 + w)):
            P(c, x, y, 'b' if x < 8 else 'a')
    P(c, 9, 0, 'a')                                                   # the hood tip droops
    disc(c, 7.5, 5, 1.4, 'k')                                         # empty hood
    P(c, 7, 5, 'd')
    for x in range(5, 11):
        P(c, x, 7, 'f' if x % 2 else 'F')                             # bone-bead collar
    for x in range(3, 14, 2):
        P(c, x, 14, '.')                                              # tatters
    for y in range(8, 14):
        P(c, 6, y, 'a')
    if form >= 1:
        for k in range(5):
            P(c, 5 + k, 9 + k, 'd')                                   # mourning sash
    if form == 2:
        P(c, 4, 2, 'd'); P(c, 11, 3, 'd'); P(c, 3, 9, 'f')
    return done(c)


# ---------------------------------------------------------------- Harpooner
def harpoon(form):
    """A whale harpoon on the diagonal: wooden shaft, rope-bound grip, barbed steel head."""
    c = blank(16, 16)
    line(c, 1, 15, 11, 5, 'W'); line(c, 2, 15, 12, 5, 'w')
    for k in (3, 5):
        P(c, k, 13 - k + 2, 'L'); P(c, k + 1, 13 - k + 2, 'l')        # rope binding
    # head: a broad barbed diamond
    for x, y, ch in ((14, 1, 'h'), (13, 2, 'c'), (12, 3, 'c'), (14, 2, 'b'), (13, 1, 'c'), (12, 2, 'b'), (13, 3, 'b'),
                     (11, 4, 'b'), (15, 0, 'h'), (11, 2, 'a'), (13, 4, 'a')):
        P(c, x, y, ch)
    late = []
    if form >= 1:
        P(c, 10, 6, 'd'); P(c, 10, 2, 'c'); P(c, 14, 6, 'c')          # second pair of barbs + paint
    if form == 2:
        P(c, 9, 7, 'd'); late += [(9, 1, 'c'), (15, 7, 'c'), (0, 15, 'd')]
    return done(c, late)


def hookline(form):
    """A coiled line with a three-tined grapple on top."""
    c = blank(16, 16)
    for r0 in (5.2, 3.6):
        ring(c, 8, 10.5, r0, 'L', 1.2)
    ring(c, 8, 10.5, 2.2, 'l', 1)
    line(c, 8, 6, 8, 2, 'b')                                          # shank
    for x, y in ((5, 2), (6, 1), (11, 2), (10, 1), (8, 0)):
        P(c, x, y, 'c')                                               # tines
    P(c, 7, 2, 'c'); P(c, 9, 2, 'c'); P(c, 8, 1, 'h')
    if form >= 1:
        P(c, 8, 4, 'd')
    late = [(4, 1, 'c'), (12, 1, 'c')] if form == 2 else []
    return done(c, late)


def oilskin(form):
    """Oilskin diving coat: tarred and glossy, high collar, brass buckles down the front."""
    c = blank(16, 16)
    for y in range(3, 15):
        w = 4 if y < 12 else 5
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'l' if x < 9 else 'k')
    for y in range(4, 12):
        P(c, 5, y, 'L')                                               # glossy sheen
    for x in range(5, 11):
        P(c, x, 2, 'b'); P(c, x, 3, 'a')                              # high collar in the tier metal
    for k in range(3):
        for y in range(6, 14, 3):
            P(c, 8, y, 'c'); P(c, 7, y, 'b')                          # buckles
    for y in range(4, 12):                                            # sleeves
        P(c, 3, y + 1, 'l'); P(c, 12, y + 1, 'k')
    P(c, 3, 13, 'W'); P(c, 12, 13, 'W')                               # gloves
    if form >= 1:
        for x in range(4, 12):
            P(c, x, 10, 'L')                                          # rope belt
        P(c, 4, 10, 'd')
    if form == 2:
        P(c, 11, 4, 'd'); P(c, 4, 4, 'd')
        for x in range(4, 12, 2):
            P(c, x, 14, 'c')
    return done(c)


# ---------------------------------------------------------------- Duelist
def rapier(form):
    """A needle-thin blade on the diagonal with a gold swept basket hilt."""
    c = blank(16, 16)
    line(c, 5, 10, 14, 1, 'h'); line(c, 6, 10, 15, 1, 'c')            # the blade: bright edge, tier steel
    for x, y in ((2, 11), (3, 10), (4, 9), (5, 10), (5, 12), (4, 13), (3, 13)):
        P(c, x, y, 'd')                                               # swept basket hilt
    P(c, 4, 11, 'W'); P(c, 3, 12, 'W'); P(c, 2, 13, 'w'); P(c, 1, 14, 'w')   # grip + pommel
    P(c, 0, 15, 'd')
    if form >= 1:
        P(c, 6, 9, 'd'); P(c, 6, 11, 'd')                             # quillons
    late = [(15, 0, 'h'), (13, 1, 'f')] if form == 2 else []
    return done(c, late)


def mirror(form):
    """A hand mirror: an oval of silvered glass in a tier-metal frame, cracked across."""
    c = blank(16, 16)
    disc(c, 8, 6, 5.2, 'b'); disc(c, 8, 6, 4.0, 'f'); disc(c, 9, 7, 2.6, 'F')
    line(c, 6, 3, 10, 9, 'h')                                         # the crack
    P(c, 6, 4, 'f'); P(c, 5, 5, 'h')
    line(c, 8, 11, 8, 15, 'b'); line(c, 9, 11, 9, 15, 'a')            # handle
    if form >= 1:
        P(c, 8, 1, 'd'); P(c, 3, 6, 'd'); P(c, 13, 6, 'd')            # set gems
    late = [(1, 1, 'h'), (14, 2, 'h'), (2, 12, 'f')] if form == 2 else []
    return done(c, late)


def glassmail(form):
    """Glassmail: a slim cuirass of silvered panels, a crimson half-cape at one shoulder."""
    c = blank(16, 16)
    for y in range(3, 13):
        w = 4 if y < 9 else 3
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'f' if (x % 2 == 0) else 'b')                  # alternating glass panels
    for x in range(5, 11):
        P(c, x, 2, 'k'); P(c, x, 12, 'c')
    P(c, 7, 13, 'd'); P(c, 8, 13, 'd')
    for y in range(3, 12):
        P(c, 12 + (y > 6), y, 'l' if y % 2 else 'L')                  # the half-cape
    if form >= 1:
        for x, y in ((6, 5), (9, 7), (7, 9)):
            P(c, x, y, 'h')                                           # glints
    if form == 2:
        disc(c, 8, 6, 1.1, 'd')
    return done(c)


# ---------------------------------------------------------------- Stormwright
def coil(form):
    """A copper coil on a short rod, crackling at the tip."""
    c = blank(16, 16)
    line(c, 2, 14, 7, 9, 'w'); line(c, 3, 14, 8, 9, 'W')
    for k in range(5):                                                # the winding
        x, y = 7 + k, 8 - k
        P(c, x, y, 'c'); P(c, x + 1, y, 'a'); P(c, x, y - 1, 'b')
    disc(c, 12.5, 3.5, 1.6, 'd'); P(c, 12, 3, 'h')
    late = [(15, 0, 'd'), (14, 6, 'h'), (10, 1, 'd')] if form >= 1 else [(15, 1, 'd')]
    if form == 2:
        late += [(15, 3, 'h'), (13, 0, 'h'), (11, 6, 'd')]
    return done(c, late)


def kite_icon(form):
    """A diamond storm kite with a ribbon tail, dyed in the tier colour."""
    c = blank(16, 16)
    for y in range(1, 11):
        w = y if y <= 4 else 10 - y
        for x in range(8 - w, 9 + w):
            P(c, x, y, 'c' if x < 8 else 'b')
    line(c, 8, 1, 8, 10, 'f'); line(c, 4, 4, 12, 4, 'F')              # the spars
    for x, y in ((8, 11), (7, 12), (8, 13), (9, 14), (8, 15)):
        P(c, x, y, 'd' if (x + y) % 2 else 'f')                       # ribbon tail
    late = [(2, 1, 'h'), (14, 2, 'd')] if form >= 1 else []
    if form == 2:
        late += [(1, 6, 'd'), (15, 7, 'h'), (12, 11, 'd')]
    return done(c, late)


def stormcloak(form):
    """A storm-grey hooded cloak with a lightning bolt stitched in copper."""
    c = blank(16, 16)
    disc(c, 8, 3.5, 3, 'b'); disc(c, 8, 4, 1.6, 'k')
    for y in range(5, 15):
        w = 3 + (y - 5) * 0.5
        for x in range(round(8 - w), round(8 + w)):
            P(c, x, y, 'b' if x < 8 else 'a')
    for x, y in ((9, 6), (8, 7), (9, 8), (8, 9), (7, 10), (8, 11)):
        P(c, x, y, 'd')                                               # the stitched bolt
    for x in range(3, 13, 2):
        P(c, x, 14, 'c')
    if form == 2:
        P(c, 3, 2, 'h'); P(c, 13, 3, 'h')
    return done(c)


# ---------------------------------------------------------------- Clockmaker
def pendulum_icon(form):
    """A pendulum: a rod from a brass pivot to a heavy disc bob."""
    c = blank(16, 16)
    disc(c, 4, 2, 1.5, 'c')
    line(c, 4, 3, 10, 9, 'k'); line(c, 5, 3, 11, 9, 'b')
    disc(c, 11, 11, 3.6, 'b'); disc(c, 10.5, 10.5, 2.2, 'c'); P(c, 10, 10, 'h')
    if form >= 1:
        ring(c, 11, 11, 3.6, 'a', 0.8); P(c, 11, 11, 'd')
    late = [(15, 14, 'd'), (14, 6, 'h')] if form == 2 else []
    return done(c, late)


def stopwatch(form):
    """A pocket stopwatch, crown and all."""
    c = blank(16, 16)
    disc(c, 8, 9, 5.8, 'b'); disc(c, 8, 9, 4.4, 'f'); disc(c, 9, 10, 3, 'F')
    line(c, 8, 9, 8, 5, 'k'); line(c, 8, 9, 11, 10, 'k')
    for x, y in ((8, 5), (12, 9), (8, 13), (4, 9)):
        P(c, x, y, 'k')
    P(c, 8, 9, 'd')
    line(c, 7, 2, 9, 2, 'c'); P(c, 8, 1, 'h'); P(c, 8, 3, 'b')        # crown + stem
    if form >= 1:
        P(c, 3, 4, 'c'); P(c, 13, 4, 'c')                             # pushers
    late = [(1, 9, 'd'), (15, 9, 'd'), (8, 15, 'h')] if form == 2 else []
    return done(c, late)


def brasscoat(form):
    """A frock-coat with brass gear epaulettes and a ticking clock-face plate on the chest."""
    c = blank(16, 16)
    for y in range(3, 15):
        w = 4 if y < 11 else 4 + (y - 10) // 2
        for x in range(8 - w, 8 + w):
            P(c, x, y, 'l' if x < 8 else 'k')
    disc(c, 3, 4, 2, 'c'); P(c, 3, 4, 'a'); disc(c, 12.5, 4, 2, 'b'); P(c, 12, 4, 'a')   # gear epaulettes
    disc(c, 8, 8, 2.4, 'f'); P(c, 8, 7, 'k'); P(c, 9, 8, 'k'); P(c, 8, 8, 'd')          # the chest clock
    for y in range(11, 15):
        P(c, 8, y, 'c')
    if form >= 1:
        for x in range(4, 12, 2):
            P(c, x, 14, 'c')
    if form == 2:
        P(c, 1, 2, 'h'); P(c, 14, 2, 'h')
    return done(c)


# ---------------------------------------------------------------- admin + misc
def godweapon(form):
    c = blank(16, 16)
    line(c, 2, 14, 10, 6, 'b'); line(c, 3, 14, 11, 6, 'a')
    for y in range(1, 8):
        for x in range(8, 15):
            if abs(x - 11) + abs(y - 4) <= 3:
                P(c, x, y, 'c')
    disc(c, 11, 4, 1.4, 'd'); P(c, 11, 4, 'h')
    return done(c, [(15, 0, 'd'), (7, 1, 'd'), (15, 8, 'd'), (0, 15, 'h')])


def godability(form):
    c = blank(16, 16)
    for y in range(3, 13):
        for x in range(2, 14):
            P(c, x, y, 'a' if y > 9 else 'b')
    for x in range(3, 13):
        P(c, x, 3, 'c')
    for x, y in ((5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6), (6, 7), (9, 7), (6, 8), (7, 8), (8, 8), (9, 8)):
        P(c, x, y, 'd')                                               # the DEL glyph
    return done(c, [(1, 1, 'h'), (14, 1, 'd'), (14, 14, 'h')])


def godarmor(form):
    c = plate(2)
    return [r.replace('k', 'd') for r in c]


def godring(form):
    c = ring_icon(2)
    return [r.replace('b', 'c') for r in c]


def backpack(form):
    c = blank(16, 16)
    for y in range(4, 15):
        for x in range(3, 13):
            P(c, x, y, 'L' if x < 8 else 'l')
    for x in range(3, 13):
        P(c, x, 4, 'W'); P(c, x, 8, 'W')                              # flap
    for x in range(5, 11):
        P(c, x, 2, 'l'); P(c, x, 3, 'l')
    P(c, 5, 1, 'L'); P(c, 10, 1, 'L')                                 # strap loop
    P(c, 7, 9, 'c'); P(c, 8, 9, 'c'); P(c, 7, 10, 'b')                # buckle
    for y in range(10, 14):
        P(c, 4, y, 'W')                                               # bedroll
    return done(c, [(13, 6, 'd'), (14, 5, 'd')])


GEN = {'gauntlet': gauntlet, 'tongs': tongs, 'sunrod': sunrod, 'bellows': bellows, 'seal': seal,
       'halo': halo, 'plate': plate, 'coat': coat, 'vestment': vestment, 'ring': ring_icon,
       'lantern': lantern, 'reliquary': reliquary, 'shroud': shroud, 'harpoon': harpoon, 'hookline': hookline,
       'oilskin': oilskin, 'godweapon': godweapon, 'godability': godability, 'godarmor': godarmor, 'godring': godring,
       'backpack': backpack, 'rapier': rapier, 'mirror': mirror, 'glassmail': glassmail, 'coil': coil, 'kite': kite_icon,
       'stormcloak': stormcloak, 'pendulum': pendulum_icon, 'stopwatch': stopwatch, 'brasscoat': brasscoat}


def _late_gens():
    import quirk_art
    GEN.update(quirk_art.ICON_GEN)


def form_for(typ, tier):
    if typ in ('bellows', 'seal', 'halo', 'ring', 'reliquary', 'hookline', 'mirror', 'kite', 'stopwatch'):          # T0-5 lines
        return 0 if tier <= 1 else 1 if tier <= 3 else 2
    return 0 if tier <= 3 else 1 if tier <= 7 else 2


def icon(typ, tier):
    if typ not in GEN:
        _late_gens()
    g = GEN[typ](form_for(typ, tier))
    return [''.join(r) for r in g]


# odd items (rubber duck, boot, fish, mystery box) live with the quirk art
import quirk_art  # noqa: E402
GEN.update(quirk_art.ICON_GEN)


# the simple, readable set replaces the old detailed icons for every gear type
import icons_simple  # noqa: E402
GEN.update(icons_simple.GEN)


# the old-school 8x8 set (each pixel doubled) is the final word for gear icons
import icons_rotmg  # noqa: E402
GEN.update(icons_rotmg.GEN)
