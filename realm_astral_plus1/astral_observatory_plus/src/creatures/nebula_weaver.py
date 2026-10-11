"""Nebula Weaver (Astral Observatory mid-tier, 22x18, floating, front view). A great star-moth whose wings hold a
nebula; it spins starlight into threads. Accent: magenta nebula. Floats: the engine adds hover (see FLOATS).
Ability - Star Veil: spreads its wings and sheds a cloud of glittering dust that hides it and slows players inside.
Shots - nebula_thread (wavy magenta thread), dust_mote (glittering cluster that splits into 3)."""
import math
from bosskit import *

W, H = 22, 18
BODY = ramp("#0a0614", "#1a1030", "#2e1e54", "#4a3480", "#7058b0")
NEB = ramp("#3a0a3a", "#7a1a78", "#c03ab0", "#ff6ad8", "#ffc8f4")
DEEP = ramp("#0a0720", "#161040", "#241a52", "#3e2e88", "#6050c0")
FUR = ramp("#3a2a58", "#6a5a90", "#a898c8", "#d8d0ec", "#ffffff")
STAR = "#fff6d8"
INK = "#140f1c"


def wing(c, side, lift, spread=0.0):
    """side -1 = left, 1 = right. lift: -1 down, 0 mid, 1 up (rigid poses, no re-rasterised pattern drift)."""
    cx = 11
    sx = lambda x: cx + side * x
    up = lift * 1.6
    fore = [(sx(1.5), 7), (sx(6 + spread), 2.4 - up), (sx(9.8 + spread), 3.2 - up), (sx(10.4 + spread), 6.8 - up * .5), (sx(2), 10)]
    hind = [(sx(1.5), 9.5), (sx(7.4 + spread), 10.4 - up * .3), (sx(8 + spread), 13.6 - up * .2), (sx(4.6), 15.4), (sx(1.4), 12)]
    c.part(poly(hind), DEEP, depth=2, base=3, bias=(0, .5))
    c.part(poly(fore), DEEP, depth=2, base=3, bias=(0, .5))
    # nebula band: an inner shape inset from the fore wing, plus an eye-spot on the hind wing
    band = poly([(sx(3), 6.8), (sx(6.4 + spread), 3.8 - up), (sx(9 + spread), 4.4 - up), (sx(9.2 + spread), 6.4 - up * .5), (sx(3.4), 8.6)])
    c.part(band, NEB, depth=1, base=2, selout=False)
    c.paint({p for p in band if (p[1] < 5.4 - up)}, NEB[3])
    ex, ey = sx(5.4 + spread * .6), 12.4 - up * .2
    c.part(circle(ex, ey, 1.6), NEB, style="flat", base=2, selout=False)
    c.paint({(int(ex), int(ey))}, NEB[4])
    # fixed stars on the wing (move rigidly with the pose)
    for (x, y) in ((7.6, 5.2), (5, 9), (9, 6)):
        c.paint({(int(sx(x + spread * .7)), int(y - up * (.8 if y < 8 else .3)))}, STAR)


def weaver(c, lift=0, spread=0.0, glow=0):
    for side in (-1, 1):
        wing(c, side, lift, spread)
    # abdomen
    c.part(ellipse(11, 12.6, 1.8, 3.2), BODY, depth=2, base=2,
           stripes=(lambda x, y: (y // 2) % 2, [BODY, shift_ramp(BODY, 1)]))
    c.paint({(11, 15), (10, 16)}, NEB[2])
    # fluffy thorax + head
    c.part(ellipse(11, 7.8, 2.4, 2.2), FUR, depth=2, base=2)
    c.part(ellipse(11, 4.9, 2.0, 1.8), BODY, depth=2, base=3)
    c.paint({(10, 4), (12, 4)}, NEB[min(4, 3 + glow)])
    # antennae
    c.paint(line_px(10, 3, 8, 0) | line_px(12, 3, 14, 0), BODY[3])
    c.paint({(7, 0), (15, 0)}, NEB[3])


def walk(i):
    c = Canvas(W, H)
    weaver(c, lift=[1, 0, -1, 0][i])
    return c.image()


def attack(i):
    c = Canvas(W, H)
    weaver(c, lift=[1, -1, 0][i], glow=[1, 1, 0][i])
    if i == 1:
        c.part(circle(11, 2, 1.4), NEB, style="flat", base=3, selout=False)
        c.paint({(11, 2)}, "#ffffff")
    return c.image()


DUST = [(3, 2), (18, 3), (1, 9), (20, 10), (5, 15), (16, 16), (8, 1), (14, 2), (2, 13), (19, 14)]


def ability(i):
    """Star Veil: wings spread wide -> dust ring sheds -> veil thick -> settle."""
    c = Canvas(W, H)
    weaver(c, lift=[1, 1, 0, 0][i], spread=[0.6, 0.8, 0.8, 0][i], glow=1 if i < 3 else 0)
    n = [3, 7, 10, 4][i]
    for k, (x, y) in enumerate(DUST[:n]):
        big = (k + i) % 3 == 0
        c.stamp([".s.", "sws", ".s."] if big else ["w"], x - big, y - big, {"s": NEB[3], "w": STAR})
    return c.image()


ANIMS = {"walk": [walk(i) for i in range(4)], "attack": [attack(i) for i in range(3)], "ability": [ability(i) for i in range(4)]}


def nebula_thread(f):
    c = Canvas(14, 7)
    pts = [(x, 3.5 + math.sin(x * .9 + f * math.pi) * 1.6) for x in range(0, 10)]
    for (x, y) in pts:
        c.paint({(int(x), int(y))}, NEB[2 + (x > 5)])
    c.part(circle(11, 3.5, 2.2), NEB, style="sphere", sphere=(11, 3.5, 2.2, 2.2), selout=False)
    c.paint({(11, 3)}, "#ffffff")
    return c.image()


def dust_mote(f):
    c = Canvas(10, 10)
    for k in range(3):
        a = k * 2 * math.pi / 3 + f * math.pi / 3
        x, y = 5 + math.cos(a) * 2.6, 5 + math.sin(a) * 2.6
        c.stamp([".s.", "sws", ".s."], int(x) - 1, int(y) - 1, {"s": NEB[2], "w": STAR})
    c.paint({(5, 5)}, NEB[4])
    return c.image()


SHOTS = {"nebula_thread": [nebula_thread(0), nebula_thread(1)], "dust_mote": [dust_mote(0), dust_mote(1)]}
INFO = {"title": "Nebula Weaver", "biome": "astral_observatory", "tier": "mid", "ability": "Star Veil",
        "ability_text": "Spreads its wings and sheds a cloud of star-dust (radius 3) that hides it and slows players inside for 3s.",
        "shots_text": {"nebula_thread": "Wavy thread fired in a fan of 5.", "dust_mote": "Slow cluster that splits into 3 motes."}}
FLOATS = True
