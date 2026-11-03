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
       'p': (200, 60, 200), 'P': (255, 120, 240), 'W': (255, 220, 255), 'v': (110, 30, 120), 'c': (150, 30, 50), 'C2': None,
       'y': (220, 160, 60), 'Y': (255, 220, 120), 'a': (120, 60, 170), 'b': (70, 40, 110), 'n': (60, 36, 26), 'N2': None,
       'f': (255, 140, 40), 'F': (255, 210, 90), 'w': (255, 246, 200), 'e': (200, 60, 30), 'k': (28, 22, 32), 'i': (70, 62, 80), 'I': (96, 88, 108)}
T = {
  'keep_floor_a': ['msslsssm', 'slllllsm', 'slllllsm', 'mmmmmmmm', 'sssmllls', 'llsmllll', 'llsmllll', 'mmmmmmmm'],
  'keep_floor_b': ['lllmssss', 'lllmsssh', 'lllmssss', 'mmmmmmmm', 'ssslllll', 'sssllmll', 'ssslllll', 'mmmmmmmm'],
  'keep_floor_c': ['mssssssm', 'slldllsm', 'slldlllm', 'sldmllsm', 'mmmdmmmm', 'llslllsl', 'llsllsll', 'mmmmmmmm'],   # (cracked)
  'keep_wall_top': ['CCCmCCCC', 'CBBmBBBN', 'CBBmBBBN', 'NNNmNNNN', 'CCCCCmCC', 'CBBBBmBN', 'CBBBBmBN', 'NNNNNmNN'],
  'keep_wall_side': ['BBBBBBBB', 'SSQmSSSQ', 'SQQmSSQQ', 'mmmmmmmm', 'QmSSSQmS', 'QmSSQQmS', 'mmmmmmmm', 'kkkkkkkk'],
  # the four room types of the sheet: a raised dais and its stair (fortified halls), the bastion's stepped fire platform
  'keep_dais': ['BBBBBBBN', 'BhhhhhhN', 'BhllllhN', 'BhllllhN', 'BhllllhN', 'BhhhhhhN', 'BhhhhhhN', 'NNNNNNNN'],
  'keep_stair': ['BBBBBBBB', 'NNNNNNNN', 'mmmmmmmm', 'hhhhhhhh', 'llllllll', 'mmmmmmmm', 'ssssssss', 'dddddddd'],
  'keep_step': ['hhhhhhhh', 'hlllllll', 'hlllllll', 'mmmmmmmm', 'hlllllll', 'hlllllll', 'hlllllll', 'mmmmmmmm'],
  # the Drawbridge Engine's own floor: riveted iron plates, and grating over the works
  'keep_plate': ['IIIIIIIi', 'IhIIIIIi', 'IIIIIIIi', 'IIIIIIIi', 'IIIIIIIi', 'IIIIIhIi', 'IIIIIIIi', 'iiiiiiii'],
  'keep_grate': ['IIIIIIII', 'IkkIkkIk', 'IkkIkkIk', 'IIIIIIII', 'IkkIkkIk', 'IkkIkkIk', 'IIIIIIII', 'iiiiiiii'],
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
DECOR['keep_tree'] = ['.....cc.cc.....', '...cRRcRRcc....', '..cRRRRRRRRc...', '.cRRcRRRRcRRc..', '.cRRRRRRRRRRc..', 'cRRcRRRRcRRRRc.', 'cRRRRRRRRRRRc..', '.cRRRcRRRRRcc..',
                      '..ccRRRcRRc....', '....ccnnc......', '......nn.......', '......nn.......', '.....nnn.......', '......nn.......', '.....nnnn......', '....nn..nn.....']
DECOR['keep_window'] = ['...kkkkkk...', '..kgggggggk..'[:12], '.kgYyPPyYgk.', '.kgyPWWPygk.', '.kgPWYYWPgk.', '.kgyPWWPygk.', '.kgYyPPyYgk.', '.kgggggggggk'[:12], '.kgaabbaagk.', '.kgabYYbagk.', '.kgaabbaagk.', '.kgggggggk..'[:12], '.kkkkkkkkkk.']
for k in range(3):                                            # the bastion's great fire bowl, and the ritual brazier (magenta)
    fl = [['......F.......', '....fFFFf.....', '...fFwwFFf....', '..efFwwwFfe...', '..efFFwFFfe...', '.eefFFFFFfee..'],
          ['.......F......', '.....fFFf.....', '....fFwFFf....', '...efFwwFfe...', '..efFFwwFFfe..', '.eefFFFFFFfe..'],
          ['....F...F.....', '....fF.fFf....', '...fFwwFFf....', '..efFwwwFFe...', '..efFFwFFffe..', '.eefFFFFFFee..']][k]
    DECOR[f'keep_bowl{k}'] = fl + ['IIiiiiiiiiiII.', 'kIIIIIIIIIIIk.', '.kkiiiiiiiik..', '...kkiiiikk...', '...kiiiiiik...', '..kkkkkkkkkk..']
    mg = [['....P.....', '...pPp....', '..pPWPp...', '..pPWPpv..', '.vpPPPpv..'], ['.....P....', '....pPp...', '...pPWPp..', '..vpPWPp..', '..vpPPPpv.'], ['...P..P...', '...pPpP...', '..pPWPPp..', '..pPWPpv..', '.vpPPPPv..']][k]
    DECOR[f'keep_ritual{k}'] = mg + ['IiiiiiiiiI', '.iIIIIIIi.', '..kiiiik..', '...kiik...', '...kiik...', '..kkiikk..', '.kkkkkkkk.']
DECOR['keep_rail'] = ['.hhhhhh.', 'hllllllm', 'mddddddm', '..lsd...', '..lsd...', '..lsd...', '.hlllld.', 'mmmmmmmm']   # (a bridge's balustrade post)
DECOR['keep_pylon'] = ['...F..F...', '..fFwwFf..', '..efFFfe..', 'IIiiiiiiII', '.kIIIIIIk.', 'hhhhhhhhhh', 'hllllllllm', 'mddgGgdddm', '.lsgGGgdl.', '.lsdgGdsl.', '.lssdgsdl.', '.llsssdsl.', '.lssssddl.', '.llsssdsl.', '.lssssddl.', '.llsssdsl.', '.lssssddl.', 'hllllllllm', 'mddddddddm', 'mmmmmmmmmm']   # (a bridge's gateway pylon, a sun on it, a fire on top)
DECOR['keep_rack'] = ['.h..h..h..h.', '.I..I..I..I.', '.I..I..I..I.', 'nnnnnnnnnnnn', 'n.I..I..I..n', 'n.I..I..I..n', 'n.I..I..I..n', 'n.h..h..h..n', 'nnnnnnnnnnnn', 'n..........n', 'n..........n', 'nk........kn']   # (a weapon rack: spears and blades)
DECOR['keep_winch'] = ['..kkkkkkkkkkkkkk..', '.kIiIiIiIiIiIiIik.', 'kInnnnInnnnInnnnIk', 'kIhhhhIhhhhIhhhhIk', 'kInnnnInnnnInnnnIk', 'kIhhhhIhhhhIhhhhIk', 'kInnnnInnnnInnnnIk', '.kIiIiIiIiIiIiIik.', '..kkkkkkkkkkkkkk..', '...mllm....mllm...', '...mssm....mssm...', '..mlllm....mlllm..', '..mmmmm....mmmmm..']   # (a winch drum, the chain wound on it)
DECOR['keep_lever'] = ['.....RR.', '....RqR.', '....kk..', '...kI...', '...kI...', '..kI....', '..kI....', '.kI.....', 'hhhhhhh.', 'llllllm.', 'mddddmm.']   # (an operating lever)
DECOR['keep_stone_a'] = ['..kkkk..', '.kIhIIk.', '.kIhIIk.', 'kIIhIIik', 'kIIffIik', 'kIIfFIik', 'kIIffIik', 'kIhIIIik', 'kIhIIIik', 'kIIIIiik', 'kIIffiik', 'kIhIIiik', 'kIIIIiik', 'kkIIIikk', 'kkkkkkkk']   # (a standing stone, a rune burning in it)
DECOR['keep_stone_b'] = ['...kk...', '..kIhk..', '.kIhIIk.', '.kIhIIk.', '.kIIpIk.', '.kIpPpk.', '.kIIpIk.', 'kIhIIIik', 'kIhIIIik', 'kIIIIiik', 'kIhIIiik', 'kkIIIikk', 'kkkkkkkk']
for k in range(2):                                            # the engine's great gear-wheel, turning (two frames, half a tooth apart)
    g = [['.'] * 22 for _ in range(22)]
    for y in range(22):
        for x in range(22):
            dx, dy = x - 10.5, y - 10.5; r = math.hypot(dx, dy); a = math.atan2(dy, dx) + k * math.pi / 10
            tooth = math.cos(a * 10) > 0.25
            if r < 8.6 or (r < 10.6 and tooth): g[y][x] = 'k' if (r > 9.6 or (r > 7.8 and not tooth)) else ('h' if dy < -3 and r > 6 else 'I' if r > 4.5 else 'i')
            if 3 < r < 4.6 and int((a % (math.pi / 2)) * 4) == 0: g[y][x] = 'k'
            if r < 2: g[y][x] = 'y' if r < 1.2 else 'o'
    DECOR[f'keep_wheel{k}'] = [''.join(r) for r in g]
for k in range(3):                                            # the brazier: an iron bowl on a stand, its fire in three shapes
    fire = [['....F.....', '...fFf....', '..fFwFf...', '..fFwFfe..', '.efFFFfe..'],
            ['.....F....', '....fFf...', '...fFwFf..', '..efFwFf..', '..efFFFfe.'],
            ['...F..F...', '...fFfF...', '..fFwFFf..', '..fFwFfe..', '.efFFFFe..']][k]
    DECOR[f'keep_brazier{k}'] = fire + ['IiiiiiiiiI', '.iIIIIIIi.', '..kiiiik..', '...kiik...', '...kiik...', '..kkiikk..', '.kkkkkkkk.']

def ritual():                                               # a magenta ring of power: two rings, a five-pointed star, runes between
    base = [[None] * 40 for _ in range(40)]
    for y in range(40):
        for x in range(40): base[y][x] = PAL[T['keep_floor_a' if ((x // 8) + (y // 8)) % 2 == 0 else 'keep_floor_b'][y % 8][x % 8]]
    cx = cy = 19.5; pts = [(cx + math.cos(-math.pi / 2 + k * 4 * math.pi / 5) * 14, cy + math.sin(-math.pi / 2 + k * 4 * math.pi / 5) * 14) for k in range(6)]
    for y in range(40):
        for x in range(40):
            r = math.hypot(x - cx, y - cy)
            on = abs(r - 17) < 0.6 or abs(r - 14.2) < 0.5
            for k in range(5):
                (ax, ay), (bx, by) = pts[k], pts[k + 1]; vx, vy = bx - ax, by - ay; t = max(0, min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)))
                if math.hypot(ax + vx * t - x, ay + vy * t - y) < 0.55: on = True
            if on: base[y][x] = PAL['P'] if (x * 3 + y) % 7 else PAL['W']
            elif 14.8 < r < 16.4 and (int(math.atan2(y - cy, x - cx) * 9) % 3 == 0): base[y][x] = PAL['p']
            elif r < 2.2: base[y][x] = PAL['P']
    return [[(*c, 255) for c in row] for row in base]


if __name__ == '__main__':
    tiles = {**{k: grid(v) for k, v in T.items()}}
    sg = sigil()
    for j in range(5):
        for i in range(5): tiles[f'keep_sigil_{j * 5 + i}'] = [row[i * 8:i * 8 + 8] for row in sg[j * 8:j * 8 + 8]]
    rt = ritual()
    for j in range(5):
        for i in range(5): tiles[f'keep_ritual_{j * 5 + i}'] = [row[i * 8:i * 8 + 8] for row in rt[j * 8:j * 8 + 8]]
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
    for nm in ('keep_tree', 'keep_window', 'keep_stone_a', 'keep_stone_b', 'keep_rail', 'keep_pylon', 'keep_rack', 'keep_winch', 'keep_lever'): sp[nm] = {'frames': {'f0': fr[nm]}, 'anims': {'idle': {'frames': ['f0'], 'fps': 1, 'loop': True}}, 'meta': {}}
    sp['keep_wheel'] = {'frames': {f'f{k}': fr[f'keep_wheel{k}'] for k in range(2)}, 'anims': {'idle': {'frames': ['f0', 'f1'], 'fps': 3, 'loop': True}}, 'meta': {}}
    for nm in ('keep_bowl', 'keep_ritual'): sp[nm] = {'frames': {f'f{k}': fr[f'{nm}{k}'] for k in range(3)}, 'anims': {'idle': {'frames': ['f0', 'f1', 'f2'], 'fps': 7, 'loop': True}}, 'meta': {}}
    write_png(os.path.join(out, 'keep_decor.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's keep: its furnishings", 'version': 1}, 'sheets': {'keep_decor': {'image': 'keep_decor.png', 'kind': 'decor', 'sprites': sp}}},
              open(os.path.join(out, 'atlas_keep_decor.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    for a in ('throne/atlas_keep_tiles.json', 'throne/atlas_keep_decor.json'):
        if a not in idx['atlases']: idx['atlases'].append(a)
    json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('keep tiles', len(names), 'decor', len(DECOR))
