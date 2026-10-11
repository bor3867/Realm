"""Comet Hound (Astral Observatory mid-tier, 22x16, side view facing right). A lean star-dog of deep night
whose mane and tail burn like a comet's head and tail. Accent: icy cyan comet fire.
Ability - Comet Dash: crouches, then streaks across the room leaving a burning trail that lingers.
Shots - comet_spark (small comet with a tail), star_fang (bite crescent)."""
import math
from bosskit import *

W, H = 22, 16
COAT = ramp("#070514", "#120c2e", "#221a52", "#3a2e84", "#5a4cb4")
FIRE = ramp("#0e3a6a", "#2a9ad8", "#7af4ff", "#c8fcff", "#ffffff")
STAR = "#fff6d8"
INK = "#05030a"
FANG = "#f4ecf8"


def tail(c, flick, dy, stretch=0.0):
    """Comet tail sweeping back and up; two fixed shapes alternate (flick 0/1)."""
    L = 1 + stretch
    pts = [(5.5, 7.5 + dy), (3.6 - 1.2 * stretch, 6 + dy + stretch), (1.6 - 2 * stretch, 4.4 + dy + 2 * stretch + flick * .6)]
    c.part(path(pts, 1.8, 0.7), FIRE, depth=1, base=2, selout=False)
    c.paint(line_px(5, 7 + dy, 2.5 - stretch, 5 + dy + stretch), FIRE[3])
    c.paint({(int(1 - 2 * stretch), int(3 + dy + 2 * stretch + flick))}, FIRE[2])


def hound(c, frame=0, crouch=0.0, lunge=0.0, maw=False, hot=0):
    sw = [0, 1, 0, -1][frame % 4]
    dy = round(crouch * 2)
    tail(c, frame % 2, dy, stretch=lunge)
    # comet mane behind the neck (drawn before the body)
    mx, my = 13.4 + lunge * 2.6, 4.4 + dy
    for k, (dx, dy2, L) in enumerate(((0, -1.2, 3.6), (-1.4, 0.4, 3.8), (-2.6, 1.8, 3.0))):
        c.part(path([(mx + dx, my + dy2), (mx + dx - L * (1 + lunge * .5), my + dy2 - 1.6 + k * .4)], 1.2, 0.5), FIRE, depth=1, base=2 + (k == 0), selout=False)
    # far legs
    for x0, ph in ((6.5, 1), (13.5, 0)):
        s = sw * (1 if ph else -1) * (1 - crouch) * 1.3
        c.part(path([(x0, 9.5 + dy), (x0 + s - lunge * (2.5 if x0 < 10 else -2), 14.6)], 0.8, 0.6), shift_ramp(COAT, -1), depth=1)
    # lean body
    bx = 9.6 + lunge
    body = ellipse(bx, 8.6 + dy, 5.6 + lunge * 1.5, 2.6, rot=-0.06) | ellipse(bx + 3.6, 8 + dy, 3.0, 3.0)
    c.part(body, COAT, depth=3, base=2, bias=(0, 0.7))
    # constellation on the flank (static pattern, follows the body rigidly)
    sx, sy = int(bx), int(8 + dy)
    c.paint(line_px(sx - 3, sy, sx - 1, sy - 1) | line_px(sx - 1, sy - 1, sx + 1, sy + 1), COAT[3])
    c.paint({(sx - 3, sy), (sx - 1, sy - 1), (sx + 1, sy + 1)}, STAR)
    # near legs
    for x0, ph in ((8, 0), (15, 1)):
        s = sw * (1 if ph else -1) * (1 - crouch) * 1.3
        foot = (x0 + s - lunge * (3 if x0 < 10 else -3.5), 15)
        c.part(path([(x0, 10 + dy), foot], 1.0, 0.7), COAT, depth=1)
        c.paint({(int(round(foot[0])), 15)}, FIRE[1])
    # head (hand-stamped profile)
    hx, hy = int(round(12.6 + lunge * 1.4)), int(round(2 + dy * 0.8))
    HEAD = ["..hl.....",
            ".hlml....",
            "hllmEElll",
            "lmmmmmmmk",
            ".dmmmmdd.",
            "..dd....."]
    if maw:
        HEAD = ["..hl.....",
                ".hlml....",
                "hllmEElll",
                "lmmmmmmmk",
                ".dmkkkkk.",
                "..dmwkwk.",
                "...mmdd.."]
    c.stamp(HEAD, hx, hy, {"h": "#8a80d8", "l": COAT[4], "m": COAT[3], "d": COAT[1], "k": INK, "w": FANG,
                           "E": FIRE[min(4, 2 + hot)]})
    c.paint({(hx + 5, hy + 2)}, FIRE[4])


def walk(i):
    c = Canvas(W, H)
    hound(c, i)
    return c.image()


def attack(i):
    c = Canvas(W, H)
    hound(c, 0, crouch=[0.5, 0.0, 0.0][i], lunge=[0, 0.5, 0][i], maw=i == 1, hot=[1, 1, 0][i])
    if i == 1:
        c.stamp([".c.", "cwc", ".c."], 19, 7, {"c": FIRE[2], "w": FIRE[4]})
    return c.image()


def ability(i):
    """Comet Dash: crouch -> streak (afterimage trail) -> streak -> skid to a stop."""
    c = Canvas(W, H)
    if i == 0:
        hound(c, 0, crouch=1.0, hot=1)
        return c.image()
    if i in (1, 2):
        c = Canvas(W, H, -3, 0)
        hound(c, 2, lunge=1.0, hot=1)
        for k, y in enumerate((6, 9, 12)):
            for x in range(0, [9, 6][i - 1] - (k != 1) * 2):
                if (x, y) not in c.px:
                    c.px[(x, y)] = FIRE[1 + (k == 1) + (x > 3)]
        return c.image()
    hound(c, 0, crouch=0.4, lunge=0.2)
    c.paint({(3, 15), (5, 14), (6, 15), (8, 15)}, FIRE[2])
    return c.image()


ANIMS = {"walk": [walk(i) for i in range(4)], "attack": [attack(i) for i in range(3)], "ability": [ability(i) for i in range(4)]}


def comet_spark(f):
    c = Canvas(13, 7)
    c.paint(line_px(0, 3, 7, 3), FIRE[1])
    c.paint(line_px(2, 2 + f, 7, 2) | line_px(2, 4 - f, 7, 4), FIRE[1])
    c.paint(line_px(4, 3, 8, 3), FIRE[3])
    c.part(circle(9.5, 3.5, 2.4), FIRE, style="sphere", sphere=(9.5, 3.5, 2.4, 2.4), selout=False)
    c.paint({(9, 2)}, FIRE[4])
    return c.image()


def star_fang(f):
    c = Canvas(9, 11)
    arc = ring(2, 5.5, 6, 5, 1.6) & rect(4, 0, 8, 10)
    c.part(arc, FIRE, style="flat", base=2 + f, selout=False)
    c.paint({(6, 2), (6, 8)}, FANG)
    c.paint({(7, 5)}, FIRE[4])
    return c.image()


SHOTS = {"comet_spark": [comet_spark(0), comet_spark(1)], "star_fang": [star_fang(0), star_fang(1)]}
INFO = {"title": "Comet Hound", "biome": "astral_observatory", "tier": "mid", "ability": "Comet Dash",
        "ability_text": "Crouches, then streaks across the room in a straight line, leaving a burning trail that lingers for 2s.",
        "shots_text": {"comet_spark": "Quick homing-lite comet, fired in threes.", "star_fang": "Short-range bite crescent that slows."}}
FLOATS = False
