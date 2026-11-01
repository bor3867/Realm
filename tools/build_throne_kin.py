# The volcano island's own monsters (2026-11-01, the user: "new and unique enemies similar to rotmg" for the Throne of
# Solkhar, the keep in the volcano, harder the further in). 8x8 RotMG-style bodies in the bestiary8 format (pal, A, A2,
# B; faces LEFT, mirrored here, as the bundle's art faces right), at their own size (a bundle's art pixel is drawn as two,
# like the sheet's doubled 8x8s: 2026-11-01, they were doubled twice over and stood twice the size of everything else),
# with bestiary8's three death frames. Two are bigger, 16x16 with the detail to match: the Obsidian Sentinel, the
# Furnace Brute.
#   The shore and the gatehouses: the Ash Wretch, the Cinder Hound
#   The wings and the courts:     the Magma Slinger, the Obsidian Sentinel
#   The ramparts and the yard:    the Brimstone Acolyte, the Caldera Serpent, the Furnace Brute
#   The causeway and the hall:    the Stolen Ray (a splinter of the sun Solkhar took)
#   art/bundle/throne/throne_kin.png + atlas_throne.json          py -I tools/build_throne_kin.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
os.makedirs(out, exist_ok=True)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from bestiary8 import legs_shift  # noqa: E402


def deaths(g):
    """bestiary8's three death frames at any size: it slumps, it crumples, it's a puddle in its own main colour"""
    from collections import Counter
    n = len(g); w = len(g[0])
    cnt = Counter(ch for r in g for ch in r if ch not in '.o')
    main = cnt.most_common(1)[0][0]; second = cnt.most_common(2)[-1][0]
    slump = ['.' * w] + g[:-1]
    keep = [r for i, r in enumerate(g) if i % 2 == 1]
    crumple = ['.' * w] * (n - len(keep)) + keep
    q = w // 4
    pud = [('.' * q + second * (w - 2 * q - 1) + main + '.' * q)] if n == 8 else ['.' * (q + 1) + second * (w - 2 * q - 3) + main * 1 + '.' * (q + 1), '.' * q + second * (w - 2 * q - 1) + main + '.' * q]
    puddle = ['.' * w] * (n - len(pud) - 1) + pud + ['.' + main * (w - 2) + '.']
    return [slump, crumple, puddle]

E8 = {
    'ash_wretch': dict(pal={'a': '#6a6470', 'A': '#9a94a0', 'e': '#ff8a1f', 'E': '#ffd650'},
        A=['........', '.aaa....', 'aEaEa...', '.aaaaa..', '..aAeaa.', '..aaAaa.', '..a..a..', '.aa..aa.'],
        A2=['........', '.aaa....', 'aEaEa...', '.aaaaa..', '..aAeaa.', '..aaAaa.', '...a.a..', '..aa.aa.'],
        B=['........', 'aaa.....', 'EaEaa...', 'aaaaaa..', 'e.aAeaa.', '..aaAaa.', '..a..a..', '.aa..aa.']),
    'cinder_hound': dict(pal={'b': '#3e3238', 'B': '#7a6470', 'e': '#ff6a1a', 'E': '#ffd650'},
        A=['........', '.b.b....', 'bBbEb...', 'b.bbbbbe', 'bbbebbbe', '..bbbbb.', '..b..b..', '.bb..bb.'],
        A2=['........', '.b.b....', 'bBbEb...', 'b.bbbbbe', 'bbbebbbe', '..bbbbb.', '...b.b..', '..bb.bb.'],
        B=['........', '.b.b....', 'bBbEb...', 'e.bbbbbe', 'Eebebbbe', '..bbbbb.', '..b..b..', '.bb..bb.']),
    'magma_slinger': dict(pal={'r': '#8a3a2a', 'R': '#c85a3a', 'k': '#2a1a14', 'p': '#5a4a42', 'e': '#ff8a1f', 'E': '#ffd650'},
        A=['.eEEe...', '.ppppp..', 'r.rrr.r.', 'rrkRkrr.', '..rrr...', '.rRRRr..', '..r.r...', '.rr.rr..'],
        A2=['.eEEe...', '.ppppp..', 'r.rrr.r.', 'rrkRkrr.', '..rrr...', '.rRRRr..', '...rr...', '..rr.r..'],
        B=['........', 'eEEe....', 'ppppprr.', '.rkRkrr.', '..rrr...', '.rRRRr..', '..r.r...', '.rr.rr..']),
    'brimstone_acolyte': dict(pal={'c': '#4a1a20', 'C': '#7a2a2a', 'k': '#140e18', 'y': '#ffd650', 'Y': '#ff8a1f'},
        A=['...cc...', '..cCCc..', '..ckkc..', '.cCyYCc.', '.cCYyCc.', 'cCCCCCCc', 'cCCCCCCc', '.cc..cc.'],
        A2=['...cc...', '..cCCc..', '..ckkc..', '.cCyYCc.', '.cCYyCc.', 'cCCCCCCc', 'cCCCCCCc', 'cc....cc'],
        B=['y..cc..y', 'Y.cCCc.Y', '.cckkcc.', '.cCyYCc.', '.cCYyCc.', 'cCCCCCCc', 'cCCCCCCc', '.cc..cc.']),
    'caldera_serpent': dict(pal={'s': '#c84a1a', 'S': '#ff8a3a', 'y': '#ffd650'},
        A=['..ss....', '.sysS...', '.sssS...', '..sS....', '...ss...', '....ss..', '...sSs..', '..sssss.'],
        A2=['...ss...', '..sysS..', '..sssS..', '...sS...', '...ss...', '..ss....', '..sSs...', '.sssss..'],
        B=['.ss.....', 'sysS....', 's..S....', 'sssS....', '..sS....', '...ss...', '...sSs..', '..sssss.']),
    'stolen_ray': dict(pal={'y': '#ffd650', 'Y': '#fff6c8', 'o': '#ff8a1f', 'w': '#ffffff'},
        A=['...y....', '..yYy...', '.yYwYy..', 'yYwwwYy.', '.yYwYy..', '..yYy...', '...o....', '..o.o...'],
        A2=['y..y..y.', '..yYy...', '.yYwYy..', 'yYwwwYy.', '.yYwYy..', '..yYy...', 'o..o..o.', '........'],
        B=['y..y..y.', '.yyYyy..', 'yYwwwYy.', 'YwwwwwY.', 'yYwwwYy.', '.yyYyy..', 'y..y..y.', '........']),
}

# ---- the two big ones, sculpted (tools/sculpt.py: shapes lit from the upper left, seams where one lies on another),
# 16x16 with four walking frames each so the lava in them pulses as they come (2026-11-01, the user: "a few of the big
# enemies look too blocky ... I want them to have the rotmg feel")
from sculpt import Sculpt  # noqa: E402

BRUTE_PAL = {'k': '#24202c', 'i': '#3e3c4a', 'I': '#5e5c6c', 'h': '#8a8898', 'H': '#bcbac8',
             'r': '#6a200c', 'R': '#b23e14', 'f': '#ff6a12', 'F': '#ffb43a', 'y': '#ffe27a', 'w': '#fff6d8',
             'b': '#5a4a3a', 'B': '#9a8466', 'e': '#ff3a1a', 's': '#4c4652', 'S': '#7a7486', 'o': '#0c0a10'}


def brute(f=0, strike=False):
    """the Furnace Brute: a hunched iron ogre, a furnace for a belly, a smoke-stack on its back, fists like anvils"""
    c = Sculpt(16, 16, {'iron': ['k', 'i', 'I', 'h', 'H'], 'horn': ['b', 'B', 'H']}, amb=0.35)
    c.line(12.6, 5.0, 12.8, 1.4, 'iron', 2.4)                                  # the smoke-stack on its back
    if strike: c.line(13.2, 6.5, 12.4, 2.6, 'iron', 2.6)                       # the far arm, up or down
    else: c.line(13.4, 7.5, 13.8, 11.0, 'iron', 2.6)
    c.ell(9.4, 8.8, 5.4, 4.8, 'iron')                                          # the barrel of its body
    c.line(11.3, 12.0, 11.8, 14.4 - (f % 2) * 0.7, 'iron', 2.8)               # legs, stepping
    c.line(7.0, 12.0, 6.6, 14.4 - ((f + 1) % 2) * 0.7, 'iron', 2.8)
    c.ell(4.4, 5.2, 3.4, 3.0, 'iron')                                          # the head, low and thrust forward
    c.line(2.6, 3.0, 0.9, 0.8, 'horn', 1.5); c.line(5.6, 2.6, 6.6, 0.6, 'horn', 1.4)
    if strike: c.line(6.6, 6.4, 4.8, 2.6, 'iron', 3.0); c.ell(4.4, 1.8, 2.5, 1.8, 'iron')   # the near fist raised
    else: c.ell(2.8, 11.6, 2.7, 2.4, 'iron'); c.line(6.0, 7.4, 3.6, 10.4, 'iron', 3.0)       # the near fist, an anvil of a fist
    c.p(2.0, 5.4, 'e'); c.p(4.0, 5.4, 'e'); c.p(3.0, 5.0, 'i'); c.p(1.6, 7.2, 'H'); c.p(4.2, 7.4, 'H')   # burning eyes under the brow, tusks
    fire = [['r', 'R', 'f', 'R'], ['R', 'f', 'F', 'f'], ['f', 'F', 'y', 'F'], ['R', 'f', 'F', 'f']]
    for j in range(4):                                                          # the furnace in its belly, shifting frame to frame
        for i in range(5):
            if (i, j) in ((0, 0), (4, 0), (0, 3), (4, 3)): continue
            k = fire[(j + f) % 4][(i + f * 2) % 4]
            c.p(8 + i, 8 + j, ('w' if k in ('y', 'F') else 'y') if strike else k)
    for i in (1, 3): c.p(8 + i, 8, 'k'); c.p(8 + i, 11, 'k')                    # the grate's bars
    sm = ('F', 'f') if strike else ('S', 's')
    c.p(12 + (f % 2), 0, sm[0]); c.p(13, 0 if f % 2 else 1, sm[1])            # smoke (flame when it strikes)
    return c.outline('o').rows()


SENT_PAL = {'k': '#1c1826', 'b': '#2e2840', 'B': '#4a4062', 's': '#72668e', 'S': '#a89cd0', 'W': '#e6deff',
            'r': '#8e2a0c', 'f': '#ff6a12', 'F': '#ffc040', 'y': '#fff0a0', 'g': '#3e3a46', 'G': '#6e6a78', 'o': '#0c0a10'}


def sentinel(f=0, strike=False):
    """the Obsidian Sentinel: a knight of volcanic glass, shard pauldrons, a burning visor slit, a glaive with a molten blade"""
    c = Sculpt(16, 16, {'glass': ['k', 'b', 'B', 's', 'S'], 'pole': ['k', 'g', 'G']}, amb=0.32)
    if not strike: c.line(2.4, 1.6, 2.8, 15.2, 'pole', 1.2)                 # the glaive, upright beside it
    c.line(10.2, 11.0, 10.8, 15.0 - (f % 2) * 0.6, 'glass', 2.6)            # legs
    c.line(7.0, 11.0, 6.4, 15.0 - ((f + 1) % 2) * 0.6, 'glass', 2.6)
    c.poly([(5.0, 6.0), (12.6, 6.0), (11.4, 12.4), (6.0, 12.4)], 'glass')    # the breastplate
    c.poly([(10.2, 5.0), (14.6, 4.2), (15.4, 2.2), (14.0, 8.4), (11.0, 8.6)], 'glass')    # the far pauldron, a shard
    c.ell(8.8, 3.6, 2.7, 3.0, 'glass')                                       # the helm
    c.line(8.8, 1.2, 9.6, -0.6, 'glass', 1.2)                                # its crest-spike
    c.poly([(2.4, 3.6), (4.2, 5.4), (7.6, 5.0), (6.8, 8.8), (3.8, 8.4)], 'glass')    # the near pauldron, a shard
    if strike:                                                               # the glaive swung down and forward
        c.line(4.4, 8.0, 0.6, 8.4, 'pole', 1.2); c.line(5.6, 7.6, 3.4, 8.4, 'glass', 2.2)
        for (x, y, ch) in ((0, 6, 'F'), (0, 7, 'y'), (1, 7, 'F'), (0, 8, 'y'), (0, 9, 'F'), (1, 9, 'f'), (0, 10, 'f')): c.p(x, y, ch)
    else:
        c.line(5.4, 7.8, 3.4, 9.6, 'glass', 2.2)                             # the near arm, gripping the glaive
        for (x, y, ch) in ((1, 0, 'f'), (2, 0, 'F'), (3, 0, 'f'), (1, 1, 'F'), (2, 1, 'y'), (3, 1, 'r'), (1, 2, 'f'), (2, 2, 'F')): c.p(x, y, ch)   # its molten blade
    vis = ('y', 'y', 'F') if strike else (('F', 'f', 'F') if f % 2 else ('f', 'F', 'f'))
    for i, ch in enumerate(vis): c.p(7.6 + i, 3.5, ch)                       # the visor slit, flickering
    crack = [(9, 7), (8, 8), (8, 9), (9, 10), (10, 11)]                       # a crack of magma down the glass, the glow running along it
    for k, (x, y) in enumerate(crack): c.p(x, y, 'F' if (k + f) % 4 == 0 else 'f')
    for (x, y) in ((7, 9), (10, 9), (11, 8)): c.p(x, y, 'r')                  # (its branches, dull)
    c.p(4.0, 5.6, 'W'); c.p(13.6, 4.6, 'W'); c.p(7.8, 2.0, 'W')               # glints on the glass
    return c.outline('o').rows()


E16 = {
    'obsidian_sentinel': dict(pal=SENT_PAL, walk=[sentinel(f) for f in range(4)], B=sentinel(0, True)),
    'furnace_brute': dict(pal=BRUTE_PAL, walk=[brute(f) for f in range(4)], B=brute(0, True)),
}

E8.update(E16)

CELL, COLS = 16, 8
names = list(E8)
W, H = COLS * CELL, len(names) * CELL
px = [[(0, 0, 0, 0)] * W for _ in range(H)]
sprites = {}
for r, name in enumerate(names):
    e = E8[name]
    if 'walk' in e: grids = e['walk'] + [e['B']] + deaths(e['walk'][0]); keys = ['a', 'b', 'c', 'd', 'atk', 'd1', 'd2', 'd3']
    else:
        A = e['A']; A2 = e.get('A2') or legs_shift(A); B = e.get('B') or A
        grids = [A, A2, B] + deaths(A); keys = ['a', 'b', 'atk', 'd1', 'd2', 'd3']
    fr = {}
    for c, g in enumerate(grids):
        n = len(g)
        assert n in (8, 16) and all(len(row) == n for row in g), (name, g)
        ox, oy = c * CELL, r * CELL
        for y, row in enumerate(g):
            for x, ch in enumerate(row[::-1]):                    # (mirrored: the bundle's art faces right)
                if ch == '.': continue
                h = e['pal'][ch]; px[oy + y][ox + x] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        fr[keys[c]] = [ox, oy, n, n]
    sprites[name] = {'frames': fr, 'anims': {'move': {'frames': ['a', 'b', 'c', 'd'] if 'walk' in e else ['a', 'b'], 'fps': 6 if 'walk' in e else 5, 'loop': True}, 'attack': {'frames': ['atk'], 'fps': 4, 'loop': False},
                                             'hurt': {'frames': ['a'], 'fps': 4, 'loop': False}, 'death': {'frames': ['d1', 'd2', 'd3'], 'fps': 8, 'loop': False}}, 'meta': {}}
write_png(os.path.join(out, 'throne_kin.png'), px)
json.dump({'rf': True, 'meta': {'name': "The volcano island's monsters (the Throne of Solkhar)", 'version': 1},
           'sheets': {'throne_kin': {'image': 'throne_kin.png', 'kind': 'enemy', 'sprites': sprites}}},
          open(os.path.join(out, 'atlas_throne.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'throne/atlas_throne.json' not in idx['atlases']:
    idx['atlases'].append('throne/atlas_throne.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
# a preview, 6x: each monster's walk, strike and death
S = 8; P = [[(42, 40, 51, 255)] * (W * S) for _ in range(H * S)]
for y in range(H):
    for x in range(W):
        if px[y][x][3]:
            for dy in range(S): P[y * S + dy][x * S:(x + 1) * S] = [px[y][x]] * S
write_png(os.path.join(root, 'art', '_proto', 'throne_kin_preview.png'), P)
print('throne kin:', len(names))
