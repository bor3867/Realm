# The Hollow Jarl, Wizard (src/bosses/jarl_wizard.js): the user's own sprite (art/hollow_jarl_wizard.jpg, brought to
# native pixels by tools/import_boss_art.py), animated: a hollow crown, dark-purple ceremonial robes, a staff crowned
# with spectral flame, a hand of turning runes. Three looks:
#   I   The Runecaller    - the staff's flame licking up, the runes in his hand pulsing, the robe's tatters swaying
#   II  The Unwoven Court - all of it brighter; wisps of spectral energy about him
#   III The Unmaking      - the staff shattered into floating pieces, the crown lifted off his head, his magic flickering
# Four idle frames a look, the cast (the staff's flame flaring white), a death (he comes apart into purple dust).
# His shots ('wiz_shots/<name>', pointing right): bolt (a rune bolt, an orange heart), lance (a spectral spear, a silver
# tip), dagger (a spectral dagger), shard (a sigil's), and rune (a glyph of his dial, drawn, not shot).
#   art/bundle/throne/jarl_wizard.png, wiz_shots.png + atlas_jarl_wizard.json          py -I tools/build_jarl_wizard.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

SRC = read_png(os.path.join(root, 'art', 'source', 'bosses', 'hollow_jarl_wizard.png'))
SH, SW = len(SRC), len(SRC[0])
PAD = 4                                                        # (room above him: the lifted crown, the flaring flame)
FH = SH + PAD
STAFF_X = 13                                                   # (the staff: left of this)
CROWN = (5, 11, 20, 36)                                        # (the crown: its rows and columns)
ORB = (38, 0, 30)                                              # (the hand of runes: right of x, between rows)
BLANK = (0, 0, 0, 0)


def kind(c):
    r, g, b, a = c
    if not a: return '.'
    if r > 150 and b > 150 and g < 130: return 'spirit'
    if r > 190 and 50 < g < 170 and b < 90: return 'fire'
    if r > 140 and g > 100 and b < 110 and r - b > 50: return 'gold'
    if b > 50 and r > 40 and g < 0.8 * min(r, b): return 'cloth'
    return 'dark'


KIND = [[kind(c) for c in row] for row in SRC]


def mix(c, t, k):
    k = max(0, min(1, k)); return (int(c[0] + (t[0] - c[0]) * k), int(c[1] + (t[1] - c[1]) * k), int(c[2] + (t[2] - c[2]) * k), 255)


def wizard(act=1, f=0, cast=False):
    g = [[BLANK] * SW for _ in range(FH)]
    for y in range(SH):
        for x in range(SW): g[y + PAD][x] = SRC[y][x]
    K = [['.'] * SW for _ in range(PAD)] + [row[:] for row in KIND]
    put = lambda x, y, c: (0 <= x < SW and 0 <= y < FH) and g[y].__setitem__(x, c)
    glow = {1: 0.0, 2: 0.3, 3: 0.45}[act]
    for y in range(FH):                                        # the spectral fire everywhere on him, pulsing; brighter each look
        for x in range(SW):
            if K[y][x] == 'spirit':
                k = glow + (0.35 if (x + y * 2 + f * 3) % 6 < 2 else 0) + (0.5 if cast and x < STAFF_X else 0)
                g[y][x] = mix(g[y][x], (255, 210, 255), k)
            elif K[y][x] == 'fire':
                g[y][x] = mix(g[y][x], (255, 230, 150), glow + (0.3 if (x * 3 + y + f) % 5 == 0 else 0))
    # the staff's flame licks up, a pixel, turn about (and flares when he casts)
    if f % 2 or cast:
        for y in range(PAD, PAD + 16):
            for x in range(STAFF_X):
                if K[y][x] == 'spirit' and g[y - 1][x][3] == 0: put(x, y - 1, mix(g[y][x], (255, 230, 255), 0.4 if cast else 0.15))
    if cast:
        for k in range(6): put(4 + (k * 3) % 7, PAD - 1 - k % 3, (255, 240, 255, 255) if k % 2 else (230, 140, 255, 255))
    # the robe's tatters sway
    if f % 2:
        for y in range(FH - 6, FH):
            row = g[y][:]
            for x in range(STAFF_X, SW):
                if K[y][x] == 'cloth':
                    nx = x + (1 if y % 2 else -1)
                    if 0 <= nx < SW and K[y][nx] in ('cloth', '.'): row[nx] = g[y][x]
            g[y] = row
    # II: wisps of spectral energy about him
    if act >= 2:
        for k in range(8 if act == 2 else 12):
            a = k * 2.399 + f * 0.3; x = int(SW / 2 + 2 + math.cos(a) * (14 + (k % 3) * 3)); y = int(FH * 0.45 + math.sin(a) * 16 - (f * 2 + k) % 6)
            if 0 <= x < SW and 0 <= y < FH and not g[y][x][3]: put(x, y, (200, 90, 240, 255) if k % 2 else (240, 170, 255, 255))
    # III: the crown lifted off his head (it bobs); the staff in floating pieces; his magic flickering
    if act == 3:
        y0, y1, x0, x1 = CROWN; lift = 3 + (1 if f in (1, 2) else 0)
        crown = [(x, y + PAD, g[y + PAD][x]) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if K[y + PAD][x] in ('gold', 'fire')]
        for x, y, _ in crown: g[y][x] = (24, 14, 30, 255) if y >= y1 + PAD - 1 else BLANK
        for x, y, c in crown: put(x, y - lift, c)
        bands = [(PAD + 14, PAD + 24), (PAD + 26, PAD + 36), (PAD + 38, PAD + 48), (PAD + 50, FH)]
        staff = [[g[y][x] for x in range(STAFF_X)] for y in range(FH)]
        for y in range(PAD + 14, FH):
            for x in range(STAFF_X): g[y][x] = BLANK if K[y][x] != 'cloth' else g[y][x]
        for i, (a, b) in enumerate(bands):                     # each piece of the staff afloat, drifting
            dx = (1 if i % 2 else -1) * (1 + (f + i) % 2); dy = -1 - (f + i) % 2
            for y in range(a, min(b, FH)):
                for x in range(STAFF_X):
                    c = staff[y][x]
                    if c[3] and K[y][x] != 'cloth': put(x + dx, y + dy, c)
        if f % 2:                                              # flickering: a scatter of his own pixels gone pale
            for y in range(FH):
                for x in range(SW):
                    if K[y][x] == 'cloth' and (x * 5 + y * 3 + f) % 23 == 0: g[y][x] = (210, 150, 240, 255)
    return g


def fall(k):
    rnd = random.Random(60 + k); g = wizard(3, 0)
    for y in range(FH):
        for x in range(SW):
            if g[y][x][3] and rnd.random() < 0.3 + 0.3 * k: g[y][x] = (120, 60, 150, 255) if (x + y) % 2 else (70, 36, 90, 255)
    if k == 2:
        sh = [[BLANK] * SW for _ in range(FH)]
        for y in range(FH):
            for x in range(SW):
                if y + 16 < FH and g[y][x][3] and rnd.random() < 0.5: sh[y + 16][x] = g[y][x]
        return sh
    return g


# his shots (pointing right)
SPAL = {'o': (12, 8, 18), 'v': (110, 40, 150), 'V': (170, 80, 220), 'u': (220, 150, 255), 'W': (240, 236, 250), 'L': (255, 140, 40), 'Y': (255, 210, 110)}
SHOTS = {
    'bolt': ['.ooo.', 'oVLVo', 'oVYVo', '.ooo.'],                                 # a rune bolt, an orange heart
    'lance': ['.ooooo...', 'ovVVVuuWo', '.ooooo...'],                             # a spectral spear, a silver tip
    'dagger': ['..oo..', 'ovVuWo', '..oo..'],                                    # a spectral dagger
    'shard': ['.o.', 'oVo', '.o.'],                                              # a shard of a sigil
    'rune': ['.ooo.', 'oVuVo', 'ouLuo', 'oVuVo', '.ooo.'],                         # a glyph of his dial
}


# his portals: a ring of spectral fire turning about a dark heart (two frames: it turns)
PORTAL = {'a': ['...oooo...', '..oVuVVo..', '.oVo..oVo.', 'oVo.oo.uVo', 'ouo.ov.oVo', 'oVo.vo.ouo', 'oVu.oo.oVo', '.oVo..oVo.', '..oVVuVo..', '...oooo...'],
          'b': ['...oooo...', '..oVVuVo..', '.oVo..oVo.', 'oVu.oo.oVo', 'oVo.vo.ouo', 'ouo.ov.oVo', 'oVo.oo.uVo', '.oVo..oVo.', '..oVuVVo..', '...oooo...']}


def pack(name, entries, W, H, cols=6):
    rows = (len(entries) + cols - 1) // cols
    px = [[BLANK] * (cols * W) for _ in range(rows * H)]; fr = {}
    for i, (key, grid) in enumerate(entries):
        ox, oy = (i % cols) * W, (i // cols) * H
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if isinstance(c, str):
                    if c in SPAL: px[oy + y][ox + x] = (*SPAL[c], 255)
                elif c[3]: px[oy + y][ox + x] = c
        fr[key] = [ox, oy, len(grid[0]), len(grid)]
    write_png(os.path.join(out, name + '.png'), px)
    return fr, px


if __name__ == '__main__':
    BID, NAMES = 'jarl_wizard', {1: 'The Runecaller', 2: 'The Unwoven Court', 3: 'The Unmaking'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', wizard(act, k)) for k in range(4)] + [(f'a{act}', wizard(act, 0, True)), (f'a{act}b', wizard(act, 1, True))]
    frames += [(f'd{k}', fall(k)) for k in range(3)]
    fr, px = pack(BID, frames, SW, FH)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}b', f'a{act}'], 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    sfr, _ = pack('wiz_shots', [(k, [list(r) for r in g]) for k, g in SHOTS.items()], 9, 5)
    pfr, _ = pack('wiz_kin', [(k, [list(r) for r in g]) for k, g in PORTAL.items()], 10, 10)
    sheets = {
        f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
                      'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}},
        'wiz_shots': {'image': 'wiz_shots.png', 'kind': 'shot', 'sprites': {k: {'frames': {'0': v}, 'meta': {}} for k, v in sfr.items()}},
        'wiz_kin': {'image': 'wiz_kin.png', 'kind': 'enemy', 'sprites': {'portal': {'frames': pfr, 'anims': {'move': {'frames': ['a', 'b'], 'fps': 6, 'loop': True}, 'attack': {'frames': ['b'], 'fps': 4, 'loop': False}}, 'meta': {}}}},
    }
    json.dump({'rf': True, 'meta': {'name': 'The Hollow Jarl, Wizard (the Throne of Solkhar)', 'version': 1}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_jarl_wizard.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_jarl_wizard.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_jarl_wizard.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 5; G = [wizard(1, 0), wizard(1, 1), wizard(2, 2), wizard(3, 1), wizard(1, 0, True), fall(1)]
    P = [[(36, 26, 40, 255)] * (len(G) * (SW + 2) * S) for _ in range((FH + 2) * S)]
    for gi, g in enumerate(G):
        for y, row in enumerate(g):
            for x, col in enumerate(row):
                if col[3]:
                    for dy in range(S): P[(y + 1) * S + dy][(gi * (SW + 2) + x + 1) * S:(gi * (SW + 2) + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'jarl_wizard_preview.png'), P)
    print('the Wizard Jarl:', len(frames), 'frames')
