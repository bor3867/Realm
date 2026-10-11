"""Astrolabe Sentinel (Astral Observatory mid-tier, 20x22, front view). A brass knight of the observatory guard,
an astrolabe for a shield and a star-tipped lance. Accent: cyan (visor, shield gem, lance star).
Ability - Alignment: spins the astrolabe shield up into a ring ward that blocks shots, then releases it as a shockwave.
Shots - star_lance (thrown lance of light), astro_disc (spinning astrolabe ring)."""
import math
from bosskit import *

W, H = 20, 22
BRASS = ramp("#3a2008", "#6a4414", "#a8742a", "#e0b048", "#fff0a8")
NAVY = ramp("#0a0720", "#161040", "#241a52", "#3e2e88", "#6050c0")
CYAN = ramp("#0e3a6a", "#2a9ad8", "#7af4ff", "#c8fcff", "#ffffff")
INK = "#140f1c"


def sentinel(c, step=0, lance=0.0, shield_up=0.0, glow=0, dip=0):
    """step: walk phase (-1, 0, 1) leg lift; lance: 0 rest .. 1 raised .. 2 thrust; shield_up 0..1."""
    by = dip
    # legs (greaves); one lifts on a step
    for x0, s in ((8, step), (12, -step)):
        lift = 1 if s > 0 else 0
        c.part(rect(x0 - 1, 15 + by - lift, x0 + 1, 20 - lift), NAVY, depth=1, base=2)
        c.part(rect(x0 - 1, 18 - lift, x0 + 1, 20 - lift), BRASS, depth=1, base=2)
        c.paint({(x0 - 1, 20 - lift), (x0, 20 - lift), (x0 + 1, 20 - lift)}, BRASS[1])
    # tabard skirt
    c.part(poly([(6.5, 13 + by), (13.5, 13 + by), (14.5, 17.5 + by), (5.5, 17.5 + by)]), NAVY, depth=2, base=2, bias=(0, .6))
    c.paint(line_px(10, 13 + by, 10, 17 + by), BRASS[3])
    # breastplate
    c.part(poly([(6, 7.5 + by), (14, 7.5 + by), (13.3, 13.5 + by), (6.7, 13.5 + by)]), BRASS, depth=3, base=2, bias=(.5, .4))
    c.paint(line_px(7, 13 + by, 13, 13 + by), BRASS[1])
    c.stamp([".a.", "aba", ".a."], 9, 9 + by, {"a": BRASS[4], "b": CYAN[2 + glow]})
    # pauldrons
    for cx in (5.6, 14.4):
        c.part(ellipse(cx, 8.6 + by, 2.4, 1.8), BRASS, depth=2, base=3)
    # helm with a crest ring
    c.part(ellipse(10, 4.6 + by, 3.1, 3.3), BRASS, depth=2, base=2, bias=(.4, .3))
    c.part(ring(10, 1.6 + by, 2.2, 1.3, 1.0), BRASS, style="flat", base=3, selout=False)
    c.paint(line_px(8, 5 + by, 12, 5 + by), INK)
    c.paint(line_px(8, 5 + by, 11, 5 + by), CYAN[2 + glow])
    c.paint({(9, 5 + by)}, CYAN[4])
    # right arm + lance (viewer's right)
    if lance < 1.5:
        ly = -round(lance)
        c.part(path([(15, 9 + by), (16, 12 + by + ly)], 1.1), NAVY, depth=1, base=3)
        c.part(rect(16, 2 + by + ly, 16, 19 + by + ly), BRASS, style="flat", base=3, selout=False)
        c.paint(line_px(17, 3 + by + ly, 17, 19 + by + ly), BRASS[1])
        tip = (16, 1 + by + ly)
        c.stamp([".s.", "sws", ".s."], tip[0] - 1, tip[1] - 1, {"s": CYAN[min(4, 1 + glow)], "w": CYAN[4]})
        c.part(circle(16.5, 12.5 + by + ly, 1.1), BRASS, depth=1, base=3)
    else:  # thrust: lance levelled diagonally forward
        c.part(path([(15, 9 + by), (16.5, 11.5 + by)], 1.1), NAVY, depth=1, base=3)
        c.paint(line_px(11, 17 + by, 18, 4 + by), BRASS[3])
        c.paint(line_px(12, 17 + by, 19, 4 + by), BRASS[1])
        c.stamp(["..s..", ".scs.", "scwcs", ".scs.", "..s.."], 15, 0 + by, {"s": CYAN[1], "c": CYAN[3], "w": CYAN[4]})
        c.part(circle(16.5, 11.5 + by, 1.1), BRASS, depth=1, base=3)
    # astrolabe shield (viewer's left)
    sy = 12.5 - shield_up * 3 + by
    sx = 4.4 + shield_up * 1.2
    r = 4.0
    c.part(circle(sx, sy, r), NAVY, style="sphere", sphere=(sx, sy, r, r))
    rim = ring(sx, sy, r, r, 1.0)
    c.part(rim, BRASS, style="flat", base=3)
    c.paint({p for p in rim if (p[0] + .5 - sx) + (p[1] + .5 - sy) < -2}, BRASS[4])
    c.paint({p for p in rim if (p[0] + .5 - sx) + (p[1] + .5 - sy) > 2.5}, BRASS[1])
    c.paint(line_px(sx - 2, sy - 2, sx + 2, sy + 2) | line_px(sx - 2, sy + 2, sx + 2, sy - 2), BRASS[2])
    gx, gy = int(sx), int(sy)
    c.stamp([".c.", "cwc", ".c."], gx - 1, gy - 1, {"c": CYAN[min(4, 1 + glow)], "w": CYAN[min(4, 3 + glow)]})


def walk(i):
    c = Canvas(W, H)
    sentinel(c, step=[1, 0, -1, 0][i], dip=[0, 0, 0, 0][i])
    return c.image()


def attack(i):
    c = Canvas(W, H)
    sentinel(c, lance=[1.0, 2.0, 0.3][i], glow=[1, 2, 0][i])
    if i == 1:
        c.paint(line_px(18, 5, 19, 4) | {(19, 7)}, CYAN[3])
    return c.image()


def ability(i):
    """Alignment: shield up -> ring ward expands -> full ward -> releases as a shock ring."""
    c = Canvas(W, H)
    if i == 0:
        sentinel(c, shield_up=1.0, glow=1)
    elif i in (1, 2):
        rr = [0, 7.5, 9.2][i]
        c.part(ring(10, 11, rr, rr * 1.05, 1.0), CYAN, style="flat", base=1, selout=False)
        sentinel(c, shield_up=1.0, glow=2)
        for k in range(4):
            a = k * math.pi / 2 + (i - 1) * math.pi / 4
            c.paint({(int(10 + math.cos(a) * rr), int(11 + math.sin(a) * rr * 1.05))}, CYAN[4])
    else:
        sentinel(c, shield_up=0.3, glow=0)
        c.part(ring(10, 11, 9.6, 10.4, 0.8), CYAN, style="flat", base=3, selout=False)
    return c.image()


ANIMS = {"walk": [walk(i) for i in range(4)], "attack": [attack(i) for i in range(3)], "ability": [ability(i) for i in range(4)]}


def star_lance(f):
    c = Canvas(14, 7)
    c.paint(line_px(0, 3, 9, 3), BRASS[3])
    c.paint(line_px(1, 4, 9, 4), BRASS[1])
    c.stamp(["..s..", ".scs.", "scwcs", ".scs.", "..s.."], 9, 1, {"s": CYAN[1], "c": CYAN[2], "w": CYAN[4]})
    if f:
        c.paint({(0, 2), (3, 5)}, CYAN[2])
    else:
        c.paint({(1, 5), (4, 2)}, CYAN[2])
    return c.image()


def astro_disc(f):
    c = Canvas(11, 11)
    c.part(circle(5.5, 5.5, 4.6), NAVY, style="sphere", sphere=(5.5, 5.5, 4.6, 4.6))
    c.part(ring(5.5, 5.5, 4.6, 4.6, 1.0), BRASS, depth=1, base=3)
    a = f * math.pi / 4
    for k in range(2):
        b = a + k * math.pi / 2
        c.paint(line_px(5.5 + math.cos(b) * 3.4, 5.5 + math.sin(b) * 3.4, 5.5 - math.cos(b) * 3.4, 5.5 - math.sin(b) * 3.4), BRASS[2])
    c.paint({(5, 5)}, CYAN[3])
    return c.image()


SHOTS = {"star_lance": [star_lance(0), star_lance(1)], "astro_disc": [astro_disc(0), astro_disc(1)]}
INFO = {"title": "Astrolabe Sentinel", "biome": "astral_observatory", "tier": "mid", "ability": "Alignment",
        "ability_text": "Raises the astrolabe shield into a ring ward that blocks shots for 2s, then releases it as a shockwave.",
        "shots_text": {"star_lance": "Fast straight lance of light, pierces.", "astro_disc": "Slow spinning ring that boomerangs back."}}
FLOATS = False
