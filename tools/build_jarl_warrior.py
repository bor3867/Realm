# The Hollow Jarl, Warrior (src/bosses/jarl_warrior.js): the user's own sprite (art/hollow_jarl_warrior.jpg, brought to
# native pixels by tools/import_boss_art.py), animated: heavy steel, a worn crown, glowing orange cracks, a tattered purple
# cloak and tabard, an enormous executioner's axe. Three looks:
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


# ---- the Jarl himself: the user's sprite (art/source/bosses/hollow_jarl_warrior.png, from art/hollow_jarl_warrior.jpg
# by tools/import_boss_art.py), animated here. Its pixels sorted by what they are (the fire in his cracks, his cloak, the
# crown's gold, his steel), and each frame a change of them: he breathes (all above his belt sinks a pixel), the fire in
# his cracks flickers, his cloak's tatters sway; II the cracks brighter, the crown cracked, ash drifting off him; III the
# cloak torn through, his eyes white-hot, the cracks blazing, embers; the strike, the great axe heaved up; the death, a
# fall to ash.
from reduce import read_png  # noqa: E402
SRC = read_png(os.path.join(root, 'art', 'source', 'bosses', 'hollow_jarl_warrior.png'))
SH, SW = len(SRC), len(SRC[0])
INK = (16, 10, 22, 255)


def kind(c):
    r, g, b, a = c
    if not a: return '.'
    if r > 190 and 50 < g < 170 and b < 90: return 'fire'
    if r > 140 and g > 100 and b < 100 and r - b > 60: return 'gold'
    if b > 60 and r > 50 and g < 0.75 * min(r, b): return 'cloth'
    return 'steel'


KIND = [[kind(c) for c in row] for row in SRC]
BELT = next(y for y in range(SH) if sum(1 for x in range(SW) if KIND[y][x] == 'gold') > 8 and y > SH // 2)   # (the belt's row: his waist)
CROWN = [(x, y) for y in range(SH // 3) for x in range(SW // 2 + 4) if KIND[y][x] == 'gold']               # (the crown: the gold up top, left of the axe)
CROWN_X = sum(x for x, _ in CROWN) / len(CROWN); CROWN_Y = max(y for _, y in CROWN)
AXE_X = 36                                                                                                   # (the axe and its haft: right of this)
HEAD_Y = (CROWN_Y + 1, CROWN_Y + 4)                                                                          # (his eyes' rows)


def mix(c, t, k):
    return (int(c[0] + (t[0] - c[0]) * k), int(c[1] + (t[1] - c[1]) * k), int(c[2] + (t[2] - c[2]) * k), 255)


def jarl(act=1, f=0, attack=False):
    g = [list(row) for row in SRC]
    # the fire in his cracks: brighter each look, flickering frame to frame; his eyes (fire in the helm) white-hot in III
    for y in range(SH):
        for x in range(SW):
            if KIND[y][x] != 'fire': continue
            k = {1: 0.0, 2: 0.3, 3: 0.55}[act] + (0.25 if (x + y * 2 + f * 3) % 7 < 2 else 0)
            eye = HEAD_Y[0] <= y <= HEAD_Y[1] and x < AXE_X
            g[y][x] = mix(g[y][x], (255, 250, 220) if (eye and act == 3) else (255, 214, 96), min(1, k + (0.5 if eye and act == 3 else 0)))
    if act >= 2:                                                                             # II: the crown cracked, a point dark
        cx = int(CROWN_X) + 3
        for y in range(CROWN_Y - 4, CROWN_Y + 1):
            if 0 <= y < SH and KIND[y][cx] == 'gold': g[y][cx] = INK
    if act == 3:                                                                             # III: the cloak torn through
        for y in range(SH * 2 // 3, SH):
            for x in range(SW):
                if KIND[y][x] == 'cloth' and ((x * 7 + y * 13) % 9 == 0 or (y > SH - 5 and (x * 3 + y) % 4 == 0)): g[y][x] = (0, 0, 0, 0)
    # the cloak's tatters sway: its lowest rows shift a pixel, turn about
    if f % 2:
        for y in range(SH - 6, SH):
            row = g[y][:]
            for x in range(SW):
                if KIND[y][x] == 'cloth' and x < AXE_X - 2:
                    nx = x + (1 if y % 2 else -1)
                    if 0 <= nx < SW and KIND[y][nx] in ('cloth', '.'): row[nx] = g[y][x]
            g[y] = row
    # he breathes: all above his belt sinks a pixel (not the axe: he holds it still)
    if f in (2, 3):
        for y in range(BELT, 0, -1):
            for x in range(AXE_X):
                g[y][x] = g[y - 1][x]
        for x in range(AXE_X): g[0][x] = (0, 0, 0, 0)
    # the strike: the great axe heaved up, three pixels, the haft drawn up with it
    if attack:
        for y in range(SH):
            for x in range(AXE_X, SW):
                g[y][x] = g[y + 3][x] if y + 3 < SH else (0, 0, 0, 0)
    # II, III: ash drifting off him; III: embers
    if act >= 2:
        for k in range(8 if act == 2 else 12):
            a = k * 2.399; x = int(SW / 2 - 6 + math.cos(a) * (8 + (k % 4) * 3)); y = int(SH * 0.4 + math.sin(a) * 10 - ((f * 3 + k * 2) % 10))
            if 0 <= x < SW and 0 <= y < SH and not g[y][x][3]: g[y][x] = (90, 85, 96, 255) if k % 2 else (138, 132, 144, 255)
    if act == 3:
        for k in range(7):
            a = k * 1.7 + f; x = int(SW / 2 - 6 + math.cos(a) * 15); y = int(SH * 0.4 + math.sin(a) * 13 - (f * 2 % 6))
            if 0 <= x < SW and 0 <= y < SH and not g[y][x][3]: g[y][x] = (255, 160, 40, 255) if k % 2 else (255, 220, 110, 255)
    return g


def fall(k):
    """three death frames: the plate cracks to ash, crumbles, slumps to a heap"""
    rnd = random.Random(30 + k); g = jarl(3, 0)
    for y in range(SH):
        for x in range(SW):
            if g[y][x][3] and rnd.random() < 0.25 + 0.3 * k: g[y][x] = (46, 40, 48, 255) if (x + y) % 2 else (74, 64, 72, 255)
    if k == 2:
        sh = [[(0, 0, 0, 0)] * SW for _ in range(SH)]
        for y in range(SH):
            for x in range(SW):
                if y + 14 < SH and g[y][x][3] and rnd.random() < 0.65: sh[y + 14][x] = g[y][x]
        return sh
    return g


# ---- his motion (2026-11-02, the user: "the Warrior should swing and reposition his axe... proper leg movement... charges
# that feel powerful... a meaningful phase change... a death of his own"): frames made from his own art a part at a time
# (tools/boss_motion.py), on a canvas with room above and beside him (his feet where they were):
#   walk     four steps: his left foot lifts, he rises over the passing step, his right lifts, he rises; the axe sways
#   attack   the wind-up (the axe hauled up and back, him straightening), the swing (the axe brought down across him, its
#            trail), the follow-through (the axe low, him bent into it)
#   charge   leaning in, the axe held out before him, his feet driving by turns, dust off his heels
#   hurt     a flinch: he sinks a pixel, the fire in his cracks flares (no white, no knockback)
#   enter    (II, III) he staggers, drops to a knee, the fire bursts through every crack, he rises in his new form
#   death    to a knee; the axe topples from his hand; he crumbles; ash
from boss_motion import pad, shift, arc, tint  # noqa: E402
PT, PS = 6, 4                                   # (the headroom above him, and the room either side)
LEG_Y, MIDX = 39, 24                            # (his legs: below this row; his left leg left of this column)
W2, H2 = SW + 2 * PS, SH + PT
O = lambda x, y: (x - PS, y - PT)               # (a canvas pixel's place on his own art)


def _in(x, y):
    X, Y = O(x, y); return 0 <= X < SW and 0 <= Y < SH


LEFT = lambda x, y, c: O(x, y)[1] >= LEG_Y and O(x, y)[0] < MIDX
RIGHT = lambda x, y, c: O(x, y)[1] >= LEG_Y and MIDX <= O(x, y)[0] < AXE_X
UPPER = lambda x, y, c: O(x, y)[1] < LEG_Y and O(x, y)[0] < AXE_X
ABOVE = lambda x, y, c: O(x, y)[1] < LEG_Y
AXE = lambda x, y, c: O(x, y)[0] >= AXE_X or (O(x, y)[0] >= AXE_X - 3 and O(x, y)[1] < 12)   # (the haft's top leans left of the rest)
FIRE = lambda x, y, c: _in(x, y) and KIND[O(x, y)[1]][O(x, y)[0]] == 'fire'
EMBER = [(255, 214, 120, 255), (255, 170, 60, 255), (255, 240, 200, 255)]


def walk(act, k):
    g = pad(jarl(act, k), PT, PS)
    if k == 0: g = shift(g, LEFT, 0, -2, fill=False); g = shift(g, AXE, 0, 1, fill=False)
    if k == 2: g = shift(g, RIGHT, 0, -2, fill=False); g = shift(g, AXE, 0, 1, fill=False)
    if k in (1, 3): g = shift(g, ABOVE, 0, -1, keep=True)
    return g


def strike(act, k):
    g = pad(jarl(act, 0), PT, PS)
    if k == 0: g = shift(g, AXE, -1, -5, fill=False); g = shift(g, UPPER, 0, -1, keep=True)
    if k == 1:
        g = shift(g, AXE, -7, 2, fill=False)
        g = arc(g, [(W2 - 4 - 22 * (1 - math.cos(t / 10 * 1.4)), PT + 2 + 26 * math.sin(t / 10 * 1.4)) for t in range(11)], EMBER)
        g = tint(g, FIRE, (255, 240, 180), 0.6)
    if k == 2: g = shift(g, AXE, -9, 5, fill=False); g = shift(g, UPPER, 0, 1)
    return g


def rush(act, k):
    g = pad(jarl(act, k * 2), PT, PS)
    g = shift(g, UPPER, 0, 1); g = shift(g, AXE, -4, 3, fill=False)
    g = shift(g, LEFT if k == 0 else RIGHT, 0, -2, fill=False)
    return arc(g, [(PS + 6 + i * 9 + k * 3, H2 - 1) for i in range(5)], [(120, 112, 124, 255)])   # (dust off his heels)


def flinch(act):
    g = pad(jarl(act, 1), PT, PS)
    return tint(shift(g, ABOVE, 0, 1), FIRE, (255, 236, 160), 0.8)


def enter(act, k):
    if k == 3: return pad(jarl(act, 0), PT, PS)
    g = pad(jarl(act - 1 if k < 2 else act, 1), PT, PS)
    if k == 0: g = shift(g, UPPER, 0, 2); g = shift(g, AXE, 0, 1, fill=False)
    if k >= 1: g = shift(g, UPPER, 0, 3); g = shift(g, AXE, 1, 3, fill=False)
    if k == 2: g = tint(g, FIRE, (255, 250, 220), 0.95); g = arc(g, [(PS + 6 + (i * 7) % 44, PT + (i * 11) % 30) for i in range(14)], EMBER)
    return g


def die(k):
    if k == 4: return pad(fall(2), PT, PS)                           # (a heap of ash)
    g = pad(jarl(3, 0) if k < 2 else fall(k - 2), PT, PS)          # (he crumbles where he knelt)
    g = shift(g, UPPER, 0, 3); g = shift(g, AXE, 1, 3, fill=False)
    if k >= 1: g = shift(g, AXE, 5, 7, fill=False)                  # (the axe slips from his hand)
    return g


def pack_rgba(name, entries, W, H, cols=6):
    rows = (len(entries) + cols - 1) // cols
    px = [[(0, 0, 0, 0)] * (cols * W) for _ in range(rows * H)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * W, (i // cols) * H
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c[3]: px[oy + y][ox + x] = c
        fr[key] = [ox, oy, W, H]
    write_png(os.path.join(out, name + '.png'), px)
    return fr, px


# ---- his shots (pointing right) and his vassals
SHOTS = {
    'crescent': ['..oo.', '.ohLo', 'ohHo.', 'ohHo.', '.ohLo', '..oo.'],                 # the axe's: dark silver, its edge orange
    'shard': ['.v...o.', 'vPoahHo', '.v.oAo.'],                                          # ash: a sharp grey shard, a trail of purple smoke
    'stone': ['.ooo.', 'oiIio', 'oILio', 'oiIio', '.ooo.'],                              # a fragment of stone, an ember at its core
    'sword': ['......o.', 'oovVVuWo', '......o.'],                                       # a spectral blade, narrow and purple
}
# his war banners (the Oathbreaker's): a pole, a tattered purple banner, a burning sigil; it stirs
BANNER = {'A': ['..hH....', '.oHHooo.', '.ohPVVPo', '.ohPLYPo', '.ohPVLPo', '.ohPVVPo', '.ohPPPPo', '.oho.P.o', '.oho....', '.oho....', '.oho....', '.oho....', 'oiiio...'],
          'B': ['..hH....', '.oHHooo.', '.ohPVVPo', '.ohPYLPo', '.ohPLVPo', '.ohPVVPo', '.ohPPPo.', '.ohoP...', '.oho....', '.oho....', '.oho....', '.oho....', 'oiiio...']}
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
        frames += [(f'i{act}_{k}', pad(jarl(act, k), PT, PS)) for k in range(4)] + [(f'a{act}_{k}', strike(act, k)) for k in range(3)]
        frames += [(f'w{act}_{k}', walk(act, k)) for k in range(4)] + [(f'c{act}_{k}', rush(act, k)) for k in range(2)] + [(f'h{act}', flinch(act))]
        if act > 1: frames += [(f'e{act}_{k}', enter(act, k)) for k in range(4)]
    frames += [(f'd{k}', die(k)) for k in range(5)]
    fr, px = pack_rgba(BID, frames, W2, H2)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}_0', f'a{act}_1', f'a{act}_2', f'a{act}_2'], 'fps': 8, 'loop': False}
        anims[f'walk{act}'] = {'frames': [f'w{act}_{k}' for k in range(4)], 'fps': 7, 'loop': True}
        anims[f'charge{act}'] = {'frames': [f'c{act}_0', f'c{act}_1'], 'fps': 10, 'loop': True}
        anims[f'hurt{act}'] = {'frames': [f'h{act}'], 'fps': 5, 'loop': False}
        if act > 1: anims[f'enter{act}'] = {'frames': [f'e{act}_{k}' for k in range(4)], 'fps': 4, 'loop': False}
    anims['death'] = {'frames': [f'd{k}' for k in range(5)], 'fps': 3, 'loop': False}
    sfr, _ = pack('jarl_shots', [(k, g) for k, g in SHOTS.items()], 8)
    vfr, _ = pack('jarl_kin', [('a', [r[::-1] for r in VASSAL['A']]), ('b', [r[::-1] for r in VASSAL['B']]), ('ba', BANNER['A']), ('bb', BANNER['B'])])   # (mirrored: the bundle's art faces right)
    sheets = {
        f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
                      'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}', 'walk': f'walk{a}', 'charge': f'charge{a}', 'hurt': f'hurt{a}', **({'enter': f'enter{a}'} if a > 1 else {})} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}},
        'jarl_shots': {'image': 'jarl_shots.png', 'kind': 'shot', 'sprites': {k: {'frames': {'0': v}, 'meta': {}} for k, v in sfr.items()}},
        'jarl_kin': {'image': 'jarl_kin.png', 'kind': 'enemy', 'sprites': {'vassal': {'frames': {'a': vfr['a'], 'b': vfr['b']}, 'anims': {'move': {'frames': ['a', 'b'], 'fps': 5, 'loop': True}, 'attack': {'frames': ['b'], 'fps': 4, 'loop': False}}, 'meta': {}},
                                                                          'banner': {'frames': {'ba': vfr['ba'], 'bb': vfr['bb']}, 'anims': {'move': {'frames': ['ba', 'bb'], 'fps': 3, 'loop': True}, 'attack': {'frames': ['bb'], 'fps': 4, 'loop': False}}, 'meta': {}}}},
    }
    json.dump({'rf': True, 'meta': {'name': 'The Hollow Jarl, Warrior (the Throne of Solkhar)', 'version': 1}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_jarl_warrior.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_jarl_warrior.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_jarl_warrior.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 4; G = [walk(1, k) for k in range(4)] + [strike(1, k) for k in range(3)] + [rush(1, 0), flinch(1)] + [enter(3, k) for k in range(4)] + [die(k) for k in range(5)]
    cols = 7; rowsN = (len(G) + cols - 1) // cols
    P = [[(36, 26, 40, 255)] * (cols * (W2 + 2) * S) for _ in range(rowsN * (H2 + 2) * S)]
    for gi, g in enumerate(G):
        ox, oy = (gi % cols) * (W2 + 2), (gi // cols) * (H2 + 2)
        for y, row in enumerate(g):
            for x, col in enumerate(row):
                if col[3]:
                    for dy in range(S): P[(oy + y + 1) * S + dy][(ox + x + 1) * S:(ox + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'jarl_warrior_preview.png'), P)
    print('the Warrior Jarl:', len(frames), 'frames')
