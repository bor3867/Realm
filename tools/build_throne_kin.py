# The volcano island's own monsters (2026-11-01, the user: "new and unique enemies similar to rotmg" for the Throne of
# Solkhar, the keep in the volcano, harder the further in). 8x8 RotMG-style bodies in the bestiary8 format (pal, A, A2,
# B; faces LEFT, mirrored here, as the bundle's art faces right), at their own size (a bundle's art pixel is drawn as two,
# like the sheet's doubled 8x8s: 2026-11-01, they were doubled twice over and stood twice the size of everything else),
# with bestiary8's three death frames. Two are bigger, 16x16 with the detail to match, drawn to the user's concept
# sheet: the Obsidian Sentinel, the Furnace Brute.
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

# ---- the two big ones, 16x16, drawn to the user's concept sheet (2026-11-01, "Volcanic Depths"): front-on, iron and
# obsidian plate over volcanic stone, the molten core showing through; drawn as left halves and mirrored. Four walking
# frames each: the step, and the lava in them pulsing (bright and dull swap from one pair of frames to the next)
VOLC = {'o': '#110d15', 'd': '#26222c', 'i': '#3a3542', 'I': '#565062', 'h': '#7a7388', 'H': '#a29bb0',
        'r': '#3e1416', 'R': '#6a2222', 'Q': '#8e3228',
        'l': '#d8461a', 'L': '#ff7a1e', 'y': '#ffb032', 'Y': '#ffe07a'}


def mirror(half):
    return [h + h[::-1] for h in half]


def pulse(g):
    """the lava's other beat: bright and dull swap"""
    return [r.translate(str.maketrans({'y': 'L', 'L': 'y', 'Y': 'y', 'l': 'L'})) for r in g]


# THE FURNACE BRUTE: a wide hulk, a small helmed head sunk between huge shoulders capped with glowing plates, a chest of
# volcanic stone with a three-barred furnace grille, arms hanging to fists of molten knuckles, short heavy legs
BRUTE = mirror([
    '.....ooo',
    '....oIhh',
    '..oooiyd',   # the eyes, burning in the helm
    '.oLyLoii',   # shoulder caps glowing
    'oLyLIoRR',
    'oIhIhoRQ',
    'oIhIoyry',   # the furnace grille: three bars
    'oIIioLrL',
    'oiIioLrL',
    '.oIioRRR',
    'oIhioiIh',   # the belt
    'oLyLooIh',   # the fists, molten knuckles
    'oyYLoiIi',
    '.ooo.oIo',   # the legs
    '....oIho',
    '....ooo.',
])
BRUTE2 = BRUTE[:13] + mirror(['.ooooIo.', '...oIho.', '...ooo..'])
BRUTE_HIT = mirror([
    'oLyLo.oo',   # the fists raised overhead, the furnace roaring
    'oyYLooIh',
    '.oIhoiyd',
    '.oIhoLyL',
    '..oIoyIo',
    '..oIhoRQ',
    '..oiIoYR',
    '...oioYR',
    '...ooiYR',
    '....oRRR',
    '....oiIh',
    '....oiIh',
    '....oiIi',
    '.....oIo',
    '....oIho',
    '....ooo.',
])
# THE OBSIDIAN SENTINEL: a tall horned knight of obsidian, a molten V for a visor, spiked pauldrons, lava running down
# the cracks of its plate and its arms, a tabard of volcanic stone with a burning point
SENT = mirror([
    '...o....',
    '..oIo...',   # the horns, curving up
    '..oIo.oo',
    '...oIoIh',
    '....oIhh',
    '..o.oLdd',   # the visor: a molten V; a spike on each pauldron
    '.oIooiLd',
    'oIhIooiy',   # the pauldrons
    'oIhIoIhI',
    '.oLioLIi',   # lava down the cracks, in the arms too
    '.oIooIRR',   # the tabard
    '.oLo.oRQ',
    '...oiIRQ',
    '...oiiRL',
    '...oIooL',
    '...ooo.o',
])
SENT2 = SENT[:13] + mirror(['..oiioRL', '..oIo.oL', '..ooo...'])
SENT_HIT = SENT[:5] + mirror(['..o.oYdd', '.oIooiYd', 'oIhIooiY']) + SENT[8:]

E16 = {
    'obsidian_sentinel': dict(pal=VOLC, walk=[SENT, SENT2, pulse(SENT), pulse(SENT2)], B=SENT_HIT),
    'furnace_brute': dict(pal=VOLC, walk=[BRUTE, BRUTE2, pulse(BRUTE), pulse(BRUTE2)], B=BRUTE_HIT),
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
