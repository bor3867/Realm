"""Vault Keeper (Astral Observatory treasure-room guardian, 22x22, front view). A squat brass automaton built
around a vault lock; its keyhole is its eye and it carries a great star-key. It sits dormant beside the Star
Vault chest and wakes when a player opens it (or deals damage). Accent: amber keyhole glow.
Ability - Lockdown: rams the key into the floor; seal glyphs ring the room and the doors lock until it dies.
Shots - key_bolt (spinning key), seal_glyph (lock rune that pauses, then flies)."""
import math
from bosskit import *

W, H = 22, 22
BRASS = ramp("#3a2008", "#6a4414", "#a8742a", "#e0b048", "#fff0a8")
DARK = ramp("#1a1008", "#2e1e0c", "#4a3214", "#6a4a1e", "#8a6a2e")
NAVY = ramp("#0a0720", "#161040", "#241a52", "#3e2e88", "#6050c0")
AMBER = ramp("#6a2a06", "#b0501a", "#ff9a3a", "#ffd27a", "#fff6d8")
INK = "#140f1c"


def keeper(c, step=0, key=0.0, eye=2, slump=0, raise_arm=0.0):
    """step -1/0/1 stomp; key: 0 held, 1 raised overhead, 2 slammed down; eye: 0 dark .. 4 blazing; slump: dormant."""
    by = slump
    # stubby legs
    for x0, s in ((7.5, step), (14.5, -step)):
        lift = 1 if s > 0 else 0
        c.part(rect(x0 - 1.5, 16 - lift, x0 + 1.5, 20 - lift), DARK, depth=1, base=3)
        c.part(rect(x0 - 2, 19 - lift, x0 + 2, 20 - lift), BRASS, depth=1, base=2)
    # vault body: a round-shouldered drum
    body = ellipse(11, 11.4 + by, 7.2, 6.4) | rect(4, 11 + by, 18, 16 + by)
    c.part(body, NAVY, depth=3, base=2, bias=(.5, .4))
    c.part(rect(4, 14 + by, 18, 16 + by) & body, BRASS, depth=1, base=2)
    # rivet band and door seam
    c.paint(line_px(5, 16 + by, 17, 16 + by), BRASS[1])
    for x in (5, 8, 14, 17):
        c.paint({(x, 15 + by)}, BRASS[4])
    # lock dial (face)
    c.part(circle(11, 10.4 + by, 3.6), DARK, style="sphere", sphere=(11, 10.4 + by, 3.6, 3.6))
    dial = ring(11, 10.4 + by, 3.6, 3.6, 1.0)
    c.part(dial, BRASS, style="flat", base=3, selout=False)
    c.paint({p for p in dial if (p[0] + .5 - 11) + (p[1] + .5 - 10.4 - by) > 2}, BRASS[1])
    for k in range(8):  # dial ticks
        a = k * math.pi / 4
        c.paint({(int(11 + math.cos(a) * 3.1), int(10.4 + by + math.sin(a) * 3.1))}, BRASS[4] if k % 2 else BRASS[2])
    # keyhole eye
    kc = AMBER[eye] if eye else NAVY[0]
    c.paint({(10, 9 + by), (11, 9 + by), (10, 10 + by), (11, 10 + by), (10, 11 + by), (11, 11 + by)}, kc)
    if eye:
        c.paint({(10, 9 + by)}, AMBER[min(4, eye + 2)])
        c.paint({(10, 12 + by), (11, 12 + by)}, AMBER[max(1, eye - 1)])
    # cap with a little observatory dome + star finial
    c.part(ellipse(11, 4.6 + by, 3.6, 2.2) & rect(0, 0, 21, 4.6 + by), BRASS, depth=2, base=3)
    c.paint({(11, 1 + by)}, AMBER[2] if eye else BRASS[2])
    c.paint({(11, 2 + by)}, BRASS[3])
    # left arm (viewer's left): heavy fist
    ay = 12 + by - raise_arm * 3
    c.part(path([(4.4, 10 + by), (2.6, ay + 2)], 1.6), DARK, depth=1, base=3)
    c.part(circle(2.6, ay + 3, 1.9), BRASS, depth=2, base=3)
    # right arm with the star-key
    if key < 1.5:
        ky = 0
        c.part(path([(17.6, 10 + by), (19, 12 + by + ky * .3)], 1.6), DARK, depth=1, base=3)
        # shaft
        c.part(rect(19, 4 + by + ky, 20, 18 + by + ky), BRASS, style="flat", base=3, selout=False)
        c.paint(line_px(20, 4 + by + ky, 20, 18 + by + ky), BRASS[1])
        # bit (teeth) at the bottom, star bow at the top
        c.paint({(18, 17 + by + ky), (18, 15 + by + ky)}, BRASS[2])
        c.stamp(["..a..", ".aba.", "abcba", ".aba.", "..a.."], 17, 0 + by + ky, {"a": AMBER[3] if key > .5 else BRASS[3], "b": AMBER[2] if key > .5 else BRASS[2], "c": AMBER[4] if key > .5 else AMBER[eye or 1]})
        c.part(circle(19.2, 12.2 + by + ky * .3, 1.6), BRASS, depth=2, base=3)
    else:  # slammed: key driven point-down into the floor in front
        c.part(path([(17.6, 10 + by), (19, 13 + by)], 1.6), DARK, depth=1, base=3)
        c.part(rect(19, 13 + by, 20, 21), BRASS, style="flat", base=3, selout=False)
        c.paint(line_px(20, 13 + by, 20, 21), BRASS[1])
        c.stamp(["..a..", ".aba.", "abcba", ".aba.", "..a.."], 17, 8 + by, {"a": BRASS[3], "b": BRASS[2], "c": AMBER[4]})
        c.part(circle(19.2, 13.2 + by, 1.6), BRASS, depth=2, base=3)


def walk(i):
    c = Canvas(W, H)
    keeper(c, step=[1, 0, -1, 0][i])
    return c.image()


def attack(i):
    c = Canvas(W, H)
    keeper(c, key=[0.3, 0, 0][i], eye=[3, 4, 2][i], raise_arm=[0, 1, 0][i])
    if i == 1:  # the dial flares as it fires
        c.stamp(["..s..", ".sws.", "swwws", ".sws.", "..s.."], 0, 4, {"s": AMBER[2], "w": AMBER[4]})
    return c.image()


def ability(i):
    """Lockdown: key overhead -> slam -> seal ring spreads -> glyphs locked."""
    c = Canvas(W, H)
    if i == 0:
        keeper(c, key=1.0, eye=3)
    elif i == 1:
        keeper(c, key=2.0, eye=4)
        c.paint(line_px(14, 21, 21, 21) | {(15, 20), (21, 20)}, AMBER[3])
    else:
        rr = [0, 0, 9.4, 10.2][i]
        c.part(ring(11, 15, rr, rr * .55, 1.0), AMBER, style="flat", base=[0, 0, 2, 1][i], selout=False)
        keeper(c, key=2.0, eye=[0, 0, 4, 3][i])
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            x, y = int(11 + math.cos(a) * rr), int(15 + math.sin(a) * rr * .55)
            c.stamp(["a.a", ".w.", "a.a"], x - 1, y - 1, {"a": AMBER[2], "w": AMBER[4]})
    return c.image()


def dormant(i):
    """Dormant (sitting, eye dark) and the 3-frame wake-up."""
    c = Canvas(W, H)
    keeper(c, slump=[2, 2, 1, 0][i], eye=[0, 1, 3, 4][i])
    if i == 3:
        c.paint({(6, 3), (16, 3), (3, 7), (19, 7)}, AMBER[3])
    return c.image()


ANIMS = {"walk": [walk(i) for i in range(4)], "attack": [attack(i) for i in range(3)],
         "ability": [ability(i) for i in range(4)], "wake": [dormant(i) for i in range(4)]}


def key_bolt(f):
    c = Canvas(12, 9)
    if f == 0:
        c.paint(line_px(2, 4, 9, 4), BRASS[3]); c.paint(line_px(2, 5, 9, 5), BRASS[1])
        c.paint({(3, 6), (5, 6)}, BRASS[2])
        c.stamp([".a.", "aca", ".a."], 9, 3, {"a": BRASS[3], "c": AMBER[3]})
    else:
        c.paint(line_px(3, 7, 8, 2), BRASS[3]); c.paint(line_px(4, 7, 9, 2), BRASS[1])
        c.paint({(3, 5), (5, 8)}, BRASS[2])
        c.stamp([".a.", "aca", ".a."], 8, 0, {"a": BRASS[3], "c": AMBER[3]})
    return c.image()


def seal_glyph(f):
    c = Canvas(11, 11)
    c.part(ring(5.5, 5.5, 4.8, 4.8, 1.0), AMBER, style="flat", base=2 + f, selout=False)
    c.stamp(["..w..", ".w.w.", "..w..", "..w..", ".www."], 3, 3, {"w": AMBER[4]})
    return c.image()


SHOTS = {"key_bolt": [key_bolt(0), key_bolt(1)], "seal_glyph": [seal_glyph(0), seal_glyph(1)]}
INFO = {"title": "Vault Keeper", "biome": "astral_observatory", "tier": "mid (treasure guardian)", "ability": "Lockdown",
        "ability_text": "Rams its key into the floor: seal glyphs ring the treasure room and the doors lock until it dies. "
                        "Spawns dormant ('wake' frame 0) beside the Star Vault; plays 'wake' when the chest is opened or it is hit.",
        "shots_text": {"key_bolt": "Spinning key, medium speed, armor-piercing.", "seal_glyph": "Rune that hangs in place 0.5s, then flies at the nearest player."}}
FLOATS = False
