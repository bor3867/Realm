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
    cnt = Counter(ch for r in g for ch in r if ch != '.')
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

E16 = {
    'obsidian_sentinel': dict(pal={'o': '#3a3348', 'O': '#5e5678', 's': '#9a8eba', 'e': '#ff8a1f', 'E': '#ffd650'},
        A=['.....oooooo.....', '....oOOOOOOo....', '....oeeeeeeo....', '....oOOOOOOo....', '.....oooooo.....', '..ooooOOOOoooo..',
           '.oOOOOOOOOOOOOo.', '.oOsOOOOOOOOsOo.', '.oOOOOseesOOOOo.', '.oOOOOseesOOOOo.', '.oOsOOOOOOOOsOo.', '.oo.oOOOOOOo.oo.',
           '....oOOOOOOo....', '....oOOo.oOOo...', '....oOo...oOo...', '...ooo....ooo...'],
        A2=['.....oooooo.....', '....oOOOOOOo....', '....oeeeeeeo....', '....oOOOOOOo....', '.....oooooo.....', '..ooooOOOOoooo..',
            '.oOOOOOOOOOOOOo.', '.oOsOOOOOOOOsOo.', '.oOOOOseesOOOOo.', '.oOOOOseesOOOOo.', '.oOsOOOOOOOOsOo.', '.oo.oOOOOOOo.oo.',
            '....oOOOOOOo....', '....oOOooOOo....', '.....oOooOo.....', '....ooo..ooo....'],
        B=['.....oooooo.....', '....oOOOOOOo....', '....oEEEEEEo....', '....oOOOOOOo....', '.....oooooo.....', '..ooooOOOOoooo..',
           'eoOOOOOOOOOOOOoe', 'EoOsOOOOOOOOsOoE', '.oOOOOsEEsOOOOo.', '.oOOOOsEEsOOOOo.', '.oOsOOOOOOOOsOo.', '.oo.oOOOOOOo.oo.',
           '....oOOOOOOo....', '....oOOo.oOOo...', '....oOo...oOo...', '...ooo....ooo...']),
    'furnace_brute': dict(pal={'i': '#4a4a56', 'I': '#7a7a86', 'h': '#a8a8b4', 'k': '#1a1418', 'f': '#ff8a1f', 'F': '#ffd650'},
        A=['......iiii......', '.....iIIIIi.....', '.....iFiiFi.....', '.....iIIIIi.....', '...iiiiiiiiii...', '..iIIIIIIIIIIi..',
           '.iIIikkkkkkiIIi.', '.iIikfFfFfFkiIi.', '.iIikFfFfFfkiIi.', '.iIikfFfFfFkiIi.', '.iIIikkkkkkiIIi.', '.ii.iIIIIIIi.ii.',
           '.hh.iiiiiiii.hh.', '....ii....ii....', '...iii....iii...', '..iiii....iiii..'],
        A2=['......iiii......', '.....iIIIIi.....', '.....iFiiFi.....', '.....iIIIIi.....', '...iiiiiiiiii...', '..iIIIIIIIIIIi..',
            '.iIIikkkkkkiIIi.', '.iIikfFfFfFkiIi.', '.iIikFfFfFfkiIi.', '.iIikfFfFfFkiIi.', '.iIIikkkkkkiIIi.', '.ii.iIIIIIIi.ii.',
            '.hh.iiiiiiii.hh.', '.....ii..ii.....', '....iii..iii....', '...iiii..iiii...'],
        B=['.hh...iiii...hh.', '.ii..iIIIIi..ii.', '.ii..iFFFFi..ii.', '.ii..iIIIIi..ii.', '..iiiiiiiiiiii..', '...iIIIIIIIIi...',
           '...ikkkkkkkki...', '...ikFFFFFFki...', '...ikFFFFFFki...', '...ikFfFfFfki...', '...ikkkkkkkki...', '....iIIIIIIi....',
           '....iiiiiiii....', '....ii....ii....', '...iii....iii...', '..iiii....iiii..']),
}
E8.update(E16)

CELL, COLS = 16, 6
names = list(E8)
W, H = COLS * CELL, len(names) * CELL
px = [[(0, 0, 0, 0)] * W for _ in range(H)]
sprites = {}
for r, name in enumerate(names):
    e = E8[name]
    A = e['A']; A2 = e.get('A2') or legs_shift(A); B = e.get('B') or A
    grids = [A, A2, B] + deaths(A)
    keys = ['a', 'b', 'atk', 'd1', 'd2', 'd3']
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
    sprites[name] = {'frames': fr, 'anims': {'move': {'frames': ['a', 'b'], 'fps': 5, 'loop': True}, 'attack': {'frames': ['atk'], 'fps': 4, 'loop': False},
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
