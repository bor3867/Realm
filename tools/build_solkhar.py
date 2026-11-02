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


# ---- his motion (2026-11-02, the user: "Solkhar should manipulate his arms, halo, and solar energy during attacks... his
# halo and armour should gradually shatter as his stolen solar power becomes unstable"): frames from his own art a part at
# a time (tools/boss_motion.py), with room above and beside him:
#   walk     he glides: hovering up and down, his robe trailing, the loose shards bobbing against him
#   attack   his arms raised, the halo and the sun brightening; thrust out, a ring of light bursting from the sun; settling
#   charge   leaning into a dash, a stream of sparks behind him
#   hurt     a flinch: he sinks a pixel, the sun and his gold flare (no white, no knockback)
#   enter    II: the sun pulses, the halo shatters in sparks, light cracks through his armour; III: the sun erupts from
#            his chest, a burst of light, and he is unbound
#   death    (the spec's four seconds) the core lifts out of him and flickers, implodes, his crown and halo burn to embers; ash
from boss_motion import pad, shift, arc, tint  # noqa: E402
PT, PS = 6, 6
W2, H2 = SW + 2 * PS, SH + PT
O = lambda x, y: (x - PS, y - PT)


def _k(x, y):
    X, Y = O(x, y)
    return KIND[Y][X] if 0 <= X < SW and 0 <= Y < SH else '.'


ALL = lambda x, y, c: True
ARM_L = lambda x, y, c: O(x, y)[0] < 16 and 15 <= O(x, y)[1] < 37
ARM_R = lambda x, y, c: O(x, y)[0] >= SW - 16 and 15 <= O(x, y)[1] < 37
HEM = lambda x, y, c: O(x, y)[1] >= SH - 9
SHARDS = lambda x, y, c: SIDE(O(x, y)[0]) and O(x, y)[1] < 15
SUN = lambda x, y, c: math.hypot(O(x, y)[0] - CX, O(x, y)[1] - CY) < 6
LIGHT = lambda x, y, c: _k(x, y) in ('sun', 'gold')
HALO = lambda x, y, c: O(x, y)[1] < HALO_Y and _k(x, y) == 'gold'
SOL = [(255, 230, 120, 255), (255, 170, 60, 255), (255, 246, 200, 255)]
ring = lambda r, n, ph=0: [(PS + CX + math.cos(ph + i * 2 * math.pi / n) * r, PT + CY + math.sin(ph + i * 2 * math.pi / n) * r) for i in range(n)]


def base(act, f=0, s=False): return pad(solkhar(act, f, s), PT, PS)


def walk(act, k):
    g = shift(base(act, k), ALL, 0, [-1, -2, -1, 0][k], fill=False)
    g = shift(g, HEM, -1 if k < 2 else 1, 0, fill=False)
    return shift(g, SHARDS, 0, 1 if k in (1, 2) else 0, fill=False)


def strike(act, k):
    if k == 0:
        g = shift(shift(base(act, 0, True), ARM_L, -1, -2, fill=False), ARM_R, 1, -2, fill=False)
        return tint(g, HALO, (255, 246, 200), 0.5)
    if k == 1:
        g = shift(shift(base(act, 0, True), ARM_L, -3, -1, fill=False), ARM_R, 3, -1, fill=False)
        return arc(tint(g, LIGHT, (255, 236, 170), 0.5), ring(9, 14) + ring(12, 10, 0.3), SOL)
    return shift(shift(base(act, 2), ARM_L, -1, 0, fill=False), ARM_R, 1, 0, fill=False)


def rush(act, k):
    g = shift(base(act, k * 2), ALL, 0, 1, fill=False)
    g = shift(g, HEM, 2 if k else -2, -1, fill=False)
    return arc(g, [(PS + CX + (i % 5 - 2) * 3, H2 - 2 - i) for i in range(8)], SOL)


def flinch(act): return tint(shift(base(act, 1), ALL, 0, 1, fill=False), LIGHT, (255, 220, 120), 0.7)


def enter(act, k):
    if k == 3: return base(act)
    g = base(act - 1 if k < 2 else act, 1)
    if k == 0: return tint(g, SUN, (255, 246, 200), 0.9)
    if k == 1: return arc(tint(g, HALO, (255, 236, 170), 0.8), ring(16, 16), SOL)          # (the halo shattering)
    return arc(tint(g, LIGHT, (255, 240, 190), 0.8), ring(7, 12) + ring(13, 16, 0.2) + ring(19, 20), SOL)   # (the sun bursting out)


def die(k):
    if k >= 3: return pad(fall(k - 2), PT, PS)
    g = base(3)
    if k == 0: return shift(g, SUN, 0, -3, fill=True)                                        # (the core lifts out of him)
    if k == 1: return tint(shift(g, SUN, 0, -3, fill=True), SUN, (90, 50, 30), 0.6)           # (and flickers)
    g = tint(g, SUN, (20, 10, 24), 0.9)                                                         # (it implodes)
    return arc(g, ring(5, 10) + [(PS + CX + math.cos(i) * 18, PT + 4 + (i * 3) % 10) for i in range(10)], SOL)   # (crown and halo to embers)


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
        frames += [(f'i{act}_{k}', base(act, k)) for k in range(4)] + [(f'a{act}_{k}', strike(act, k)) for k in range(3)]
        frames += [(f'w{act}_{k}', walk(act, k)) for k in range(4)] + [(f'c{act}_{k}', rush(act, k)) for k in range(2)] + [(f'h{act}', flinch(act))]
        if act > 1: frames += [(f'e{act}_{k}', enter(act, k)) for k in range(4)]
    frames += [(f'd{k}', die(k)) for k in range(5)]
    fr, px = pack(BID, frames, W2, H2)
    anims = {}
    for act in (1, 2, 3):
        anims[f'idle{act}'] = {'frames': [f'i{act}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        anims[f'attack{act}'] = {'frames': [f'a{act}_0', f'a{act}_1', f'a{act}_2', f'a{act}_2'], 'fps': 8, 'loop': False}
        anims[f'walk{act}'] = {'frames': [f'w{act}_{k}' for k in range(4)], 'fps': 5, 'loop': True}
        anims[f'charge{act}'] = {'frames': [f'c{act}_0', f'c{act}_1'], 'fps': 10, 'loop': True}
        anims[f'hurt{act}'] = {'frames': [f'h{act}'], 'fps': 5, 'loop': False}
        if act > 1: anims[f'enter{act}'] = {'frames': [f'e{act}_{k}' for k in range(4)], 'fps': 3, 'loop': False}
    anims['death'] = {'frames': [f'd{k}' for k in range(5)], 'fps': 1.6, 'loop': False}
    sfr, _ = pack('sol_shots', [(k, [list(r) for r in g]) for k, g in SHOTS.items()], 9, 9)
    sheets = {
        f'bx_{BID}': {'image': f'{BID}.png', 'kind': 'boss', 'sprites': {BID: {'frames': fr, 'anims': anims,
                      'phases': {str(a): {'name': NAMES[a], 'idle': f'idle{a}', 'attack': f'attack{a}', 'walk': f'walk{a}', 'charge': f'charge{a}', 'hurt': f'hurt{a}', **({'enter': f'enter{a}'} if a > 1 else {})} for a in (1, 2, 3)}, 'death': 'death', 'meta': {}}}},
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
