# Sunthief's Castle's keep, after the user's sheet "CASTLE APPROACH — ROOM LAYOUT VARIANTS" (2026-11-02: "I want rooms to
# look like this"): purple-grey flagstones, thick stone walls (a pale cap, coursed faces), a red runner edged in gold, a
# gold sun inlaid in the floor of the great halls, red banners with the gold sun, braziers, pillars. Drawn here pixel by
# pixel (8x8 tiles, drawn at twice their size like every tile; the decor at the creatures' scale).
#   'kp_tiles/<name>'   art/bundle/throne/keep_tiles.png + atlas_keep_tiles.json    (ground skins: src/world/maps.js SKINS)
#   'keep_decor/<name>' art/bundle/throne/keep_decor.png + atlas_keep_decor.json    (objects)
#   py -I tools/build_keep_tiles.py
import json, math, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
from pixlib import write_png  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'throne')
PAL = {'.': None, 'm': (32, 25, 40), 'd': (52, 42, 63), 's': (64, 53, 77), 'l': (77, 65, 92), 'h': (96, 82, 110),
       'C': (168, 154, 182), 'B': (138, 124, 154), 'N': (104, 90, 120), 'S': (96, 82, 112), 'Q': (72, 60, 86),   # (the walls: a pale cap, coursed faces)   # mortar, stone dark..light, highlight
       'r': (122, 24, 38), 'R': (156, 34, 48), 'q': (90, 16, 28), 'g': (200, 150, 58), 'G': (240, 196, 92), 'o': (150, 104, 36),   # cloth reds, golds
       'f': (255, 140, 40), 'F': (255, 210, 90), 'w': (255, 246, 200), 'e': (200, 60, 30), 'k': (28, 22, 32), 'i': (70, 62, 80), 'I': (96, 88, 108)}
T = {
  'keep_floor_a': ['msslsssm', 'slllllsm', 'slllllsm', 'mmmmmmmm', 'sssmllls', 'llsmllll', 'llsmllll', 'mmmmmmmm'],
  'keep_floor_b': ['lllmssss', 'lllmsssh', 'lllmssss', 'mmmmmmmm', 'ssslllll', 'sssllmll', 'ssslllll', 'mmmmmmmm'],
  'keep_floor_c': ['mssssssm', 'slldllsm', 'slldlllm', 'sldmllsm', 'mmmdmmmm', 'llslllsl', 'llsllsll', 'mmmmmmmm'],   # (cracked)
  'keep_wall_top': ['CCCmCCCC', 'CBBmBBBN', 'CBBmBBBN', 'NNNmNNNN', 'CCCCCmCC', 'CBBBBmBN', 'CBBBBmBN', 'NNNNNmNN'],
  'keep_wall_side': ['BBBBBBBB', 'SSQmSSSQ', 'SQQmSSQQ', 'mmmmmmmm', 'QmSSSQmS', 'QmSSQQmS', 'mmmmmmmm', 'kkkkkkkk'],
  'keep_carpet': ['gRrrrrRg', 'gRrqrrRg', 'gRrrrrRg', 'gRrrqrRg', 'gRrrrrRg', 'gRqrrrRg', 'gRrrrrRg', 'gRrrrqRg'],
}
grid = lambda rows: [[(*PAL[c], 255) if PAL[c] else (0, 0, 0, 0) for c in r] for r in rows]


def sigil():                                                # a 40x40 gold sun inlaid in the flagstones: a ring, a core, twelve rays
    base = [[None] * 40 for _ in range(40)]
    for y in range(40):
        for x in range(40):
            t = T['keep_floor_a' if ((x // 8) + (y // 8)) % 2 == 0 else 'keep_floor_b'][y % 8][x % 8]; base[y][x] = PAL[t]
    cx = cy = 19.5
    for y in range(40):
        for x in range(40):
            dx, dy = x - cx, y - cy; r = math.hypot(dx, dy); a = math.atan2(dy, dx)
            ray = r > 9 and r < 19 and abs(((a * 12 / (2 * math.pi)) % 1) - 0.5) > 0.5 - (0.07 if r < 15 else 0.035)
            if abs(r - 7.5) < 0.6 or (r < 3.2) or ray: base[y][x] = PAL['G'] if (r < 2 or (x + y) % 5) else PAL['g']
            elif abs(r - 8.7) < 0.5: base[y][x] = PAL['o']
    return [[(*c, 255) for c in row] for row in base]


DECOR = {
  'keep_banner': ['.kkkkkkkkkk.', '.gggggggggg.', '.qRRRRRRRRq.', '.qRRRRRRRRq.', '.qRRRgGRRRq.', '.qRRgGGgRRq.', '.qRgGwGGgRq.', '.qRRgGGgRRq.', '.qRRRgGRRRq.',
                  '.qRRRRRRRRq.', '.qRRRRRRRRq.', '.qRRRRRRRRq.', '.qRRrRRrRRq.', '.qRr.qq.rRq.', '.qr..qq..rq.', '.q........q.'],
  'keep_pillar': ['.hhhhhhhh.', 'hllllllllh', 'mddddddddm', '.lllsssll.', '.llsssdl..', '.lllssdl..', '.llsssdl..', '.lllssdl..', '.llsssdl..', '.lllssdl..',
                  '.llsssdl..', '.lllssdl..', '.llsssdl..', '.lllssdl..', '.llsssdl..', '.lllssdl..', 'hllllllllh', 'mddddddddm', 'mmmmmmmmmm'],
}
for k in range(3):                                            # the brazier: an iron bowl on a stand, its fire in three shapes
    fire = [['....F.....', '...fFf....', '..fFwFf...', '..fFwFfe..', '.efFFFfe..'],
            ['.....F....', '....fFf...', '...fFwFf..', '..efFwFf..', '..efFFFfe.'],
            ['...F..F...', '...fFfF...', '..fFwFFf..', '..fFwFfe..', '.efFFFFe..']][k]
    DECOR[f'keep_brazier{k}'] = fire + ['IiiiiiiiiI', '.iIIIIIIi.', '..kiiiik..', '...kiik...', '...kiik...', '..kkiikk..', '.kkkkkkkk.']

if __name__ == '__main__':
    tiles = {**{k: grid(v) for k, v in T.items()}}
    sg = sigil()
    for j in range(5):
        for i in range(5): tiles[f'keep_sigil_{j * 5 + i}'] = [row[i * 8:i * 8 + 8] for row in sg[j * 8:j * 8 + 8]]
    names = list(tiles); cols = 8; rows = (len(names) + cols - 1) // cols
    sheet = [[(0, 0, 0, 0)] * (cols * 8) for _ in range(rows * 8)]; sp = {}
    for n, k in enumerate(names):
        ox, oy = (n % cols) * 8, (n // cols) * 8
        for y in range(8):
            for x in range(8): sheet[oy + y][ox + x] = tiles[k][y][x]
        sp[k] = {'frames': {'f0': [ox, oy, 8, 8]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'keep_tiles.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's keep: its ground", 'version': 1}, 'sheets': {'kp_tiles': {'image': 'keep_tiles.png', 'kind': 'tile', 'sprites': sp}}},
              open(os.path.join(out, 'atlas_keep_tiles.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    # the decor sheet
    D = {k: grid(v) for k, v in DECOR.items()}; W = sum(len(g[0]) + 1 for g in D.values()); H = max(len(g) for g in D.values())
    sheet = [[(0, 0, 0, 0)] * W for _ in range(H)]; sp = {}; x0 = 0; fr = {}
    for k, g in D.items():
        oy = H - len(g)
        for y, r in enumerate(g):
            for x, c in enumerate(r): sheet[oy + y][x0 + x] = c
        fr[k] = [x0, oy, len(g[0]), len(g)]; x0 += len(g[0]) + 1
    sp['keep_banner'] = {'frames': {'f0': fr['keep_banner']}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    sp['keep_pillar'] = {'frames': {'f0': fr['keep_pillar']}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    sp['keep_brazier'] = {'frames': {f'f{k}': fr[f'keep_brazier{k}'] for k in range(3)}, 'anims': {'idle': {'frames': ['f0', 'f1', 'f2'], 'fps': 7, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'keep_decor.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's keep: its furnishings", 'version': 1}, 'sheets': {'keep_decor': {'image': 'keep_decor.png', 'kind': 'decor', 'sprites': sp}}},
              open(os.path.join(out, 'atlas_keep_decor.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    for a in ('throne/atlas_keep_tiles.json', 'throne/atlas_keep_decor.json'):
        if a not in idx['atlases']: idx['atlases'].append(a)
    json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('keep tiles', len(names), 'decor', len(DECOR))
