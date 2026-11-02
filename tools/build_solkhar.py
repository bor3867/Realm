# Solkhar, the Sunthief (src/bosses/unstruck_god.js): the user's own sprite (art/solkhar_the_sunthief.jpg, brought to
# native pixels by tools/import_boss_art.py), animated: fractured dark-gold armour, a solar crown, a broken halo of
# blades, flowing crimson robes, and the sun he stole burning in his chest. Three looks:
#   I   The Golden Tyrant   - the halo whole, the stolen sun pulsing in its cage of gold
#   II  The Broken Sun      - the halo broken apart, cracks of light through the armour, the sun brighter
#   III The Sunthief Unbound - the halo in floating pieces, the armour shattered, the sun blazing out of him, embers
# Four idle frames a look (the sun pulses; the loose shards about him bob; the robe's tatters sway), the strike (the sun
# and the halo flare), a death (he burns down to ash).
# His new shots ('sol_shots/<name>', pointing right): orb (a solar orb), crescent (a dark-red crescent), fragment (a
# great jagged solar shard), and, drawn rather than shot, sun (a miniature sun) and blacksun (a black sun).
#   art/bundle/unstruck/solkhar.png, sol_shots.png + atlas_solkhar.json          py -I tools/build_solkhar.py
import json, math, os, random, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
out = os.path.join(root, 'art', 'bundle', 'unstruck')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

SRC = read_png(os.path.join(root, 'art', 'source', 'bosses', 'solkhar_the_sunthief.png'))
SH, SW = len(SRC), len(SRC[0])
BLANK = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
hot_px = [(x, y) for y in range(int(SH * 0.34), int(SH * 0.62)) for x in range(SW) if SRC[y][x][3] and lum(SRC[y][x]) > 215]   # (his chest: the helm has its own highlights)
CX = sum(x for x, _ in hot_px) / len(hot_px); CY = sum(y for _, y in hot_px) / len(hot_px)   # (the stolen sun: his chest's white heart)
HALO_Y = int(CY) - 9                                          # (the halo and the crown: above this)


def kind(x, y, c):
    r, g, b, a = c
    if not a: return '.'
    if math.hypot(x - CX, y - CY) < 5 and lum(c) > 150: return 'sun'
    if r > 170 and g > 110 and b < 110: return 'gold'
    if r > 110 and g < 70 and b < 80: return 'robe'
    return 'dark'


KIND = [[kind(x, y, SRC[y][x]) for x in range(SW)] for y in range(SH)]
SIDE = lambda x: x < 9 or x > SW - 10                         # (the loose shards about him, either side)


def mix(c, t, k):
    k = max(0, min(1, k)); return (int(c[0] + (t[0] - c[0]) * k), int(c[1] + (t[1] - c[1]) * k), int(c[2] + (t[2] - c[2]) * k), 255)


def solkhar(act=1, f=0, strike=False):
    g = [list(row) for row in SRC]
    put = lambda x, y, c: (0 <= x < SW and 0 <= y < SH) and g[y].__setitem__(x, c)
    # the stolen sun: pulsing, wider each look, white-hot when he strikes
    rad = {1: 3.0, 2: 3.8, 3: 4.8}[act] + (0.6 if f in (1, 2) else 0) + (1.2 if strike else 0)
    for y in range(int(CY - rad - 1), int(CY + rad + 2)):
        for x in range(int(CX - rad - 1), int(CX + rad + 2)):
            if not (0 <= x < SW and 0 <= y < SH): continue
            d = math.hypot(x - CX, y - CY)
            if d <= rad and (g[y][x][3] or d < rad - 1): put(x, y, mix(g[y][x] if g[y][x][3] else (255, 140, 40, 255), (255, 250, 220), 1 - d / (rad + 0.5)))
    # II, III: the halo broken (arcs of it gone), cracks of light through the armour
    if act >= 2:
        for y in range(0, HALO_Y):
            for x in range(SW):
                if KIND[y][x] == 'gold':
                    a = math.atan2(y - CY, x - CX)
                    if (act == 2 and int((a + math.pi) * 3) % 2) or (act == 3 and int((a + math.pi) * 4) % 3 != 0): put(x, y, BLANK)
        rnd = random.Random(7)
        for k in range(10 if act == 2 else 18):                 # cracks: short runs of light out from the sun
            a = rnd.random() * math.tau; L = rnd.randint(4, 9)
            for t in range(int(rad) + 1, int(rad) + L):
                x, y = int(CX + math.cos(a) * t), int(CY + math.sin(a) * t * 1.1)
                if 0 <= x < SW and 0 <= y < SH and KIND[y][x] in ('dark', 'gold'): put(x, y, (255, 200, 90, 255) if (t + f) % 3 else (255, 240, 180, 255))
    if act == 3:                                                 # III: the armour shattered (gaps in it), the halo's pieces afloat
        for y in range(SH):
            for x in range(SW):
                if KIND[y][x] == 'dark' and 4 < math.hypot(x - CX, y - CY) < 14 and (x * 7 + y * 11) % 13 == 0: put(x, y, (40, 14, 20, 255))
    # the loose shards about him bob, a pixel, turn about
    if f % 2:
        snap = [row[:] for row in g]
        for y in range(1, SH):
            for x in range(SW):
                if SIDE(x) and KIND[y][x] == 'gold': g[y - 1][x] = snap[y][x]; g[y][x] = BLANK if not (y + 1 < SH and KIND[y + 1][x] == 'gold') else snap[y + 1][x]
    # the robe's tatters sway
    if f in (1, 3):
        for y in range(SH - 7, SH):
            row = g[y][:]
            for x in range(SW):
                if KIND[y][x] == 'robe':
                    nx = x + (1 if (y + f) % 2 else -1)
                    if 0 <= nx < SW and KIND[y][nx] in ('robe', '.'): row[nx] = g[y][x]
            g[y] = row
    if strike:                                                   # the strike: the halo flares
        for y in range(0, HALO_Y):
            for x in range(SW):
                if g[y][x][3] and KIND[y][x] == 'gold': g[y][x] = mix(g[y][x], (255, 250, 210), 0.6)
    if act == 3:                                                 # III: embers off him
        for k in range(9):
            a = k * 2.399 + f * 0.4; x = int(CX + math.cos(a) * (14 + k % 4 * 3)); y = int(CY + math.sin(a) * 16 - (f * 3 + k) % 8)
            if 0 <= x < SW and 0 <= y < SH and not g[y][x][3]: put(x, y, (255, 170, 50, 255) if k % 2 else (255, 230, 140, 255))
    return g


def fall(k):
    rnd = random.Random(90 + k); g = solkhar(3, 0)
    for y in range(SH):
        for x in range(SW):
            if g[y][x][3] and rnd.random() < 0.3 + 0.3 * k: g[y][x] = (60, 30, 30, 255) if (x + y) % 2 else (110, 60, 40, 255)
    if k == 2:
        sh = [[BLANK] * SW for _ in range(SH)]
        for y in range(SH):
            for x in range(SW):
                if y + 16 < SH and g[y][x][3] and rnd.random() < 0.55: sh[y + 16][x] = g[y][x]
        return sh
    return g


SPAL = {'o': (14, 8, 10), 'y': (255, 214, 80), 'Y': (255, 246, 200), 'L': (255, 150, 40), 'r': (140, 20, 30), 'R': (200, 40, 50), 'k': (20, 10, 24), 'K': (60, 30, 70), 'w': (255, 255, 255)}
SHOTS = {
    'orb': ['.ooo.', 'oyYyo', 'oYwYo', 'oyYyo', '.ooo.'],                                   # a solar orb
    'crescent': ['..oo.', '.oRro', 'oRro.', 'oRro.', '.oRro', '..oo.'],                     # a dark-red crescent
    'fragment': ['..o....', '.oyo...', 'oyYYoo.', 'oYwwYYo', 'oyYYoo.', '.oyo...', '..o....'],   # a great jagged solar shard
    'sun': ['..ooooo..', '.oLyyyLo.', 'oLyYYYyLo', 'oyYwwwYyo', 'oyYwwwYyo', 'oyYwwwYyo', 'oLyYYYyLo', '.oLyyyLo.', '..ooooo..'],   # a miniature sun
    'blacksun': ['..ooooo..', '.oLkkkLo.', 'oLkKKKkLo', 'okKkkkKko', 'okKkokKko', 'okKkkkKko', 'oLkKKKkLo', '.oLkkkLo.', '..ooooo..'],   # a black sun, a rim of fire
}


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
    BID, NAMES = 'solkhar', {1: 'The Golden Tyrant', 2: 'The Broken Sun', 3: 'The Sunthief Unbound'}
    frames = []
    for act in (1, 2, 3):
        frames += [(f'i{act}_{k}', solkhar(act, k)) for k in range(4)] + [(f'a{act}', solkhar(act, 0, True)), (f'a{act}b', solkhar(act, 2, True))]
    frames += [(f'd{k}', fall(k)) for k in range(3)]
    fr, px = pack(BID, frames, SW, SH)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}', f'a{act}b', f'a{act}'], 'fps': 6, 'loop': False}
    anims['death'] = {'frames': ['d0', 'd1', 'd2'], 'fps': 3, 'loop': False}
    sfr, _ = pack('sol_shots', [(k, [list(r) for r in g]) for k, g in SHOTS.items()], 9, 9)
    sheets = {
        f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
                      'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}'} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}},
        'sol_shots': {'image': 'sol_shots.png', 'kind': 'shot', 'sprites': {k: {'frames': {'0': v}, 'meta': {}} for k, v in sfr.items()}},
    }
    json.dump({'rf': True, 'meta': {'name': 'Solkhar, the Sunthief (the user\'s sprite)', 'version': 1}, 'sheets': sheets},
              open(os.path.join(out, 'atlas_solkhar.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'unstruck/atlas_solkhar.json' not in idx['atlases']:
        idx['atlases'].append('unstruck/atlas_solkhar.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    S = 5; G = [solkhar(1, 0), solkhar(1, 1), solkhar(2, 2), solkhar(3, 1), solkhar(1, 0, True), fall(1)]
    P = [[(30, 22, 34, 255)] * (len(G) * (SW + 2) * S) for _ in range((SH + 2) * S)]
    for gi, g in enumerate(G):
        for y, row in enumerate(g):
            for x, col in enumerate(row):
                if col[3]:
                    for dy in range(S): P[(y + 1) * S + dy][(gi * (SW + 2) + x + 1) * S:(gi * (SW + 2) + x + 2) * S] = [col] * S
    write_png(os.path.join(root, 'art', '_proto', 'solkhar_preview.png'), P)
    print('Solkhar:', len(frames), 'frames; the sun at', round(CX, 1), round(CY, 1))
