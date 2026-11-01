# The Hollow Jarl, Warrior (src/bosses/jarl_warrior.js), to the user's boss concept sheet (2026-11-01): an ancient
# hollowed warlord in heavy steel, a worn crown on his helm, glowing orange cracks in the plate, a tattered purple cloak
# and tabard, an enormous executioner's axe. Sculpted (tools/sculpt.py). Three looks:
#   I   The Fallen King   - the crown whole, the plate dark, its cracks dull
#   II  The Oathbreaker   - the crown cracked, ash leaking from the plate, the cracks brighter
#   III The Last Oath     - the cloak in tatters, the plate split, the eyes and every crack blazing
# Four idle frames a look (he breathes; the embers and the ash drift), the strike (the axe raised overhead), a death.
# His shots ('jarl_shots/<name>', pointing right): crescent (the axe's), shard (ash, trailing purple smoke), stone (a
# fragment with an ember core), sword (his vassals'); and his vassals ('jarl_kin/vassal', 8x8).
#   art/bundle/throne/jarl_warrior.png, jarl_shots.png, jarl_kin.png + atlas_jarl_warrior.json
#   py -I tools/build_jarl_warrior.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from sculpt import Sculpt  # noqa: E402

PAL = {
    'o': '#0c0a10', 'd': '#1c1822', 'i': '#2e2a36', 'I': '#4a4456', 'h': '#6e687c', 'H': '#a09ab0', 'W': '#d8d4e4',   # steel
    'p': '#24102e', 'P': '#42205a', 'v': '#64307e', 'V': '#8e4ca8', 'u': '#b884cc',                                   # purple cloth
    'g': '#5e4018', 'G': '#a07428', 'y': '#e8b84a',                                                                   # the crown's gold
    'l': '#b8361a', 'L': '#ff6a1c', 'Y': '#ffc24a', 'w': '#fff2c0',                                                   # the cracks' fire
    'a': '#5a5560', 'A': '#8a8490',                                                                                   # ash
    'z': '#2e2830', 'Z': '#4a4048',
}
STEEL = ['d', 'i', 'I', 'h', 'H']; PALE = ['i', 'I', 'h', 'H', 'W']; CLOTH = ['p', 'P', 'v', 'V']; GOLD = ['g', 'G', 'y']
FIRE = ['l', 'L', 'Y', 'w']
N = 48
CX = 24


def hot(c, x, y, k, f):
    k = k + (1 if (x + y * 2 + f * 3) % 7 < 2 else 0)
    c.p(x, y, FIRE[max(0, min(3, int(k)))])


def crack(c, pts, k, f):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / n; hot(c, round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), k, f)


def jarl(act=1, f=0, attack=False):
    c = Sculpt(N, N, {'steel': STEEL, 'pale': PALE, 'cloth': CLOTH, 'gold': GOLD}, amb=0.3)
    by = 0 if attack else (0, 0, 1, 1)[f % 4]
    heat = {1: 0, 2: 1, 3: 2}[act]
    # ---- the cloak, behind him; its hem in tatters (III: torn through)
    c.poly([(CX - 10, 13 + by), (CX + 10, 13 + by), (CX + 15, 45), (CX - 15, 45)], 'cloth')
    rnd = random.Random(5)
    for x in range(CX - 15, CX + 16):                                                    # the ragged hem
        cut = rnd.randint(0, 3 if act < 3 else 6)
        for y in range(46 - cut, 47): c.p(x, y, '.')
    if act == 3:
        for (hx, hy, r) in ((CX - 11, 36, 2), (CX + 10, 31, 1.6), (CX + 12, 40, 2.2)):
            for y in range(int(hy - r), int(hy + r) + 1):
                for x in range(int(hx - r), int(hx + r) + 1):
                    if math.hypot(x - hx, y - hy) <= r: c.p(x, y, '.')
    # ---- the axe at rest: its haft in his right hand (the left of the picture), the great blade low by his side
    if not attack:
        c.line(CX - 15, 7, CX - 14, 44, 'steel', 2.2)                                   # the haft
        c.poly([(CX - 15, 26), (CX - 19, 21.5), (CX - 23, 23.5), (CX - 25, 30), (CX - 24.6, 36), (CX - 21.5, 42), (CX - 16.5, 42.5), (CX - 15, 38), (CX - 18, 35.5), (CX - 18.8, 31.5), (CX - 18, 28)], 'steel')   # the blade: a great crescent, horned top and bottom
        for t in range(16):                                                             # its edge, catching fire
            a = math.pi * (0.62 + 0.76 * t / 15); x = CX - 17 + math.cos(a) * 7.4; y = 32.5 + math.sin(a) * 9.6
            c.p(x, y, 'L' if (t + f) % 4 else 'Y')
        c.p(CX - 14.5, 5, 'H'); c.p(CX - 14.5, 6, 'h')                                  # the haft's spike
    # ---- the legs
    for s in (-1, 1):
        c.line(CX + s * 4.5, 31 + by, CX + s * 5.5, 43, 'steel', 5.2)
        c.ell(CX + s * 5.2, 37 + by * 0.5, 2.8, 2.2, 'pale')                            # knee-plates
        c.ell(CX + s * 6.4, 44.6, 3.8, 2.0, 'steel')
    # ---- the body: the breastplate, the tabard, the belt
    c.poly([(CX - 9, 14 + by), (CX + 9, 14 + by), (CX + 8, 31 + by), (CX - 8, 31 + by)], 'steel')
    c.poly([(CX - 4, 21 + by), (CX + 4, 21 + by), (CX + 4, 40 + by), (CX, 42.4 + by), (CX - 4, 40 + by)], 'cloth')   # the tabard
    for y in range(24 + by, 39 + by, 3):                                                # its embroidery: a column of runes
        c.p(CX, y, 'u'); c.p(CX - 1, y + 1, 'V'); c.p(CX + 1, y + 1, 'V')
    for x in range(CX - 8, CX + 9): c.p(x, 30 + by, 'G' if x % 3 else 'y')              # the belt
    # the cracks in the plate, glowing
    C = [[(CX - 7, 16), (CX - 5, 19), (CX - 6, 23)], [(CX + 6, 16), (CX + 4, 20)], [(CX - 8, 25), (CX - 6, 28)]]
    if act >= 2: C += [[(CX + 7, 22), (CX + 5, 26), (CX + 6, 29)], [(CX - 3, 15), (CX - 2, 19)], [(CX - 5, 33), (CX - 6, 38)]]
    if act == 3: C += [[(CX + 3, 15), (CX + 2, 20), (CX + 3, 21)], [(CX + 5, 34), (CX + 6, 40)], [(CX - 9, 17), (CX - 8, 20)]]
    for pts in C: crack(c, [(x, y + by) for x, y in pts], heat, f)
    # ---- the arms
    if attack:                                                                          # the axe raised overhead in both hands
        for s in (-1, 1):
            c.line(CX + s * 10, 16, CX + s * 7, 7, 'steel', 4.8); c.ell(CX + s * 4, 5.5, 2.8, 2.4, 'steel')
        c.line(CX, 9, CX, -2, 'steel', 2.2)
        c.poly([(CX - 2, 0), (CX - 6, -1), (CX - 13, -1.5), (CX - 16, 3), (CX - 13, 8.5), (CX - 6, 8), (CX - 2, 6), (CX - 7, 5), (CX - 8, 3), (CX - 7, 1.5)], 'steel')   # the blade, high
        for t in range(12): a = math.pi * (0.75 + 0.6 * t / 11); c.p(CX - 7 + math.cos(a) * 7, 3 + math.sin(a) * 6, 'Y' if t % 3 else 'w')
    else:
        c.line(CX - 11, 17 + by, CX - 14, 26 + by, 'steel', 5); c.ell(CX - 14.5, 27.5 + by, 2.8, 2.6, 'steel')   # gripping the haft
        c.line(CX + 11, 17 + by, CX + 13, 27 + by, 'steel', 5); c.ell(CX + 13.2, 29 + by, 2.8, 2.6, 'steel')    # the other, a fist
    # ---- the pauldrons: great plates edged with grey fur
    for s in (-1, 1):
        c.ell(CX + s * 11, 14 + by, 7.2, 5.2, 'steel')
        for k in range(-6, 7, 2): c.p(CX + s * 11 + k, 9 + by + (k % 4 == 0), 'W' if k % 4 else 'H')   # the fur's ragged top
        c.ell(CX + s * 11, 15.5 + by, 5, 2.4, 'steel', seam=False)
        if act == 3 and s > 0: c.poly([(CX + 14, 9 + by), (CX + 18, 11 + by), (CX + 16, 13 + by)], 'steel')   # III: a plate split off
    # ---- the head: a helm, a slit with eyes of fire, the crown
    hy = 9 + by
    c.ell(CX, hy + 1, 5, 5.4, 'steel')
    for x in range(CX - 3, CX + 4): c.p(x, hy + 1, 'd')
    eye = 'w' if act == 3 else 'Y' if act == 2 else 'L'
    c.p(CX - 2, hy + 1, eye); c.p(CX + 2, hy + 1, eye)
    for y in range(hy + 2, hy + 5): c.p(CX, y, 'd')
    for x in range(CX - 5, CX + 6): c.p(x, hy - 3, 'G' if x % 2 else 'y')                  # the crown's band
    pts = [CX - 4, CX - 2, CX, CX + 2, CX + 4]
    for i, x in enumerate(pts):
        if act >= 2 and i == 3: continue                                                 # II: a point broken off
        ht = 3 if i == 2 else 2
        for j in range(ht): c.p(x, hy - 4 - j, 'y' if j == ht - 1 else 'G')
    if act >= 2: c.p(CX + 1, hy - 3, 'd'); c.p(CX + 1, hy - 4, 'd')                     # its crack
    # ---- II, III: ash leaking from the plate, drifting up; III: embers off him
    if act >= 2:
        for k in range(7 if act == 2 else 11):
            a = k * 2.399; x = CX + math.cos(a) * (6 + (k % 4) * 3); y = 20 + math.sin(a) * 9 - ((f * 3 + k * 2) % 10)
            c.p(x, y, 'A' if k % 2 else 'a')
    if act == 3:
        for k in range(6):
            a = k * 1.7 + f; x = CX + math.cos(a) * 14; y = 18 + math.sin(a) * 12 - (f * 2 % 6)
            hot(c, x, y, 2, f)
    return c.outline('o').rows()


def fall(k):
    rnd = random.Random(30 + k); g = [list(r) for r in jarl(3, 0)]
    for y in range(N):
        for x in range(N):
            if g[y][x] not in ('.', 'o') and rnd.random() < 0.25 + 0.3 * k: g[y][x] = 'z' if (x + y) % 2 else 'Z'
    if k == 2:
        sh = [['.'] * N for _ in range(N)]
        for y in range(N):
            for x in range(N):
                if y + 14 < N and g[y][x] != '.' and rnd.random() < 0.65: sh[y + 14][x] = g[y][x]
        return [''.join(r) for r in sh]
    return [''.join(r) for r in g]


# ---- his shots (pointing right) and his vassals
SHOTS = {
    'crescent': ['..oo.', '.ohLo', 'ohHo.', 'ohHo.', '.ohLo', '..oo.'],                 # the axe's: dark silver, its edge orange
    'shard': ['.v...o.', 'vPoahHo', '.v.oAo.'],                                          # ash: a sharp grey shard, a trail of purple smoke
    'stone': ['.ooo.', 'oiIio', 'oILio', 'oiIio', '.ooo.'],                              # a fragment of stone, an ember at its core
    'sword': ['......o.', 'oovVVuWo', '......o.'],                                       # a spectral blade, narrow and purple
}
VASSAL = {'A': ['..vVv...', '.vuWuv..', '..vVv...', '.PvVvP..', 'PvVuVvP.', '.vPVPv..', '.v...v..', 'v.....v.'],
          'B': ['..vVv...', '.vuWuv..', '..vVv...', 'WPvVvP..', 'WvVuVvP.', '.vPVPv..', '..v.v...', '.v...v..']}


def pack(name, entries, cell=None):
    cell = cell or max(max(len(g), len(g[0])) for _, g in entries)
    cols = min(8, len(entries)); rows = (len(entries) + cols - 1) // cols
    px = [[(0, 0, 0, 0)] * (cols * cell) for _ in range(rows * cell)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                if ch in PAL: h = PAL[ch]; px[oy + y][ox + x] = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
        fr[key] = [ox, oy, len(grid[0]), len(grid)]
    write_png(os.path.join(out, name + '.png'), px)
    return fr, px


if __name__ == '__main__':
    BID, NAMES = 'jarl_warrior', {1: 'The Fallen King', 2: 'The Oathbreaker', 3: 'The Last Oath'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', jarl(act, k)) for k in range(4)] + [(f'a{act}', jarl(act, 0, True)), (f'a{act}b', jarl(act, 2, True))]
    frames += [(f'd{k}', fall(k)) for k in range(3)]
    fr, px = pack(BID, frames, 48)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}b', f'a{act}'], 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    sfr, _ = pack('jarl_shots', [(k, g) for k, g in SHOTS.items()], 8)
    vfr, _ = pack('jarl_kin', [('a', [r[::-1] for r in VASSAL['A']]), ('b', [r[::-1] for r in VASSAL['B']])], 8)   # (mirrored: the bundle's art faces right)
    sheets = {
        f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
                      'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}},
        'jarl_shots': {'image': 'jarl_shots.png', 'kind': 'shot', 'sprites': {k: {'frames': {'0': v}, 'meta': {}} for k, v in sfr.items()}},
        'jarl_kin': {'image': 'jarl_kin.png', 'kind': 'enemy', 'sprites': {'vassal': {'frames': vfr, 'anims': {'move': {'frames': ['a', 'b'], 'fps': 5, 'loop': True}, 'attack': {'frames': ['b'], 'fps': 4, 'loop': False}}, 'meta': {}}}},
    }
    json.dump({'rf': True, 'meta': {'name': 'The Hollow Jarl, Warrior (the Throne of Solkhar)', 'version': 1}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_jarl_warrior.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_jarl_warrior.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_jarl_warrior.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 6; G = [jarl(1, 0), jarl(2, 1), jarl(3, 2), jarl(1, 0, True)]
    P = [[(36, 26, 40, 255)] * (len(G) * (N + 2) * S) for _ in range((N + 2) * S)]
    for gi, g in enumerate(G):
        for y, row in enumerate(g):
            for x, ch in enumerate(row):
                if ch in PAL:
                    h = PAL[ch]; col = (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), 255)
                    for dy in range(S): P[(y + 1) * S + dy][(gi * (N + 2) + x + 1) * S:(gi * (N + 2) + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'jarl_warrior_preview.png'), P)
    print('the Warrior Jarl:', len(frames), 'frames')
