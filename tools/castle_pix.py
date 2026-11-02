# Sunthief's Castle's defenders as hand-editable pixel art (2026-11-02, the user: "COMPLETE ENEMY ANIMATION CORRECTION —
# TRUE PIXEL ART ... Every animation must use individually drawn pixel-art frames ... Draw actual pixel changes between
# frames"). Each defender is a text file, art/source/castle2/pix/<id>.txt, edited by hand like a pixel editor:
#   palette lines   'K #rrggbb'                 one symbol a colour ('.' is clear)
#   'frame NAME [from OTHER]'                    a frame: the rows of its whole picture, symbol by symbol; or 'from' another
#                                               frame with only these changes:
#   'at X Y' then rows                           a block of pixels redrawn at X,Y ('?' leaves the pixel below as it was)
#   'clear X0 Y0 X1 Y1'                          a box of it rubbed out (the old pose's limb), then drawn again:
#   'row Y X PIXELS'                             a run of pixels drawn at X,Y (one line of the new pose)
#   'grow N'                                     N clear rows added above (a weapon raised over its head): its feet stay on the ground line
#   'nudge DX DY'                                (rarely) the frame as a whole moved on its canvas, the ground anchor kept by its feet
# Clips: 'clip NAME FPS frame frame ...'. Every frame is drawn, pixel by pixel: nothing is turned, stretched or slid apart.
#   py -I tools/castle_pix.py dump <id>      writes the base frame from art/source/castle2/native/<id>.png (palette to ~22)
#   py -I tools/castle_pix.py build [preview.png]   every pix file into art/bundle/throne/castle_user.png + its atlas
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402
SRC = os.path.join(root, 'art', 'source', 'castle2'); PIX = os.path.join(SRC, 'pix'); OUT = os.path.join(root, 'art', 'bundle', 'throne')
SYM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=@$'
IDS = ['infernal_hound', 'cinder_archer', 'sunbound_knight', 'solar_acolyte', 'cinder_elemental', 'lava_slime', 'lava_guard', 'sun_cultist', 'cinder_bat']


def quantize(cols, n):
    # median cut: the box of colours split along its widest channel until there are n
    boxes = [list(cols)]
    while len(boxes) < n:
        boxes.sort(key=lambda b: -max(max(c[i] for c in b) - min(c[i] for c in b) for i in range(3)) * (len(b) > 1))
        b = boxes.pop(0)
        if len(b) < 2: boxes.append(b); break
        ch = max(range(3), key=lambda i: max(c[i] for c in b) - min(c[i] for c in b))
        b.sort(key=lambda c: c[ch]); m = len(b) // 2; boxes += [b[:m], b[m:]]
    return [tuple(sum(c[i] for c in b) // len(b) for i in range(3)) for b in boxes if b]


def dump(id_, n=22):
    px = read_png(os.path.join(SRC, 'native', id_ + '.png')); H, W = len(px), len(px[0])
    allc = [c[:3] for r in px for c in r if c[3]]
    fixed = [(30, 20, 38), (26, 18, 32)]                     # (its outline and its ink: kept exact)
    pal = fixed + [c for c in quantize([c for c in allc if c not in fixed], n - 2)]
    near = lambda c: min(range(len(pal)), key=lambda i: sum((c[k] - pal[i][k]) ** 2 for k in range(3)))
    rows = [''.join('.' if not c[3] else SYM[near(c[:3])] for c in r) for r in px]
    while rows and set(rows[0]) == {'.'}: rows.pop(0)        # (trimmed of empty rows above; the feet row kept as the anchor)
    os.makedirs(PIX, exist_ok=True)
    with open(os.path.join(PIX, id_ + '.txt'), 'w', encoding='utf8', newline='\n') as f:
        f.write(f'# {id_}: {W}x{len(rows)}, hand-drawn frames below the base\n')
        for i, c in enumerate(pal): f.write(f'{SYM[i]} #{c[0]:02x}{c[1]:02x}{c[2]:02x}\n')
        f.write('frame base\n'); f.write('\n'.join(rows) + '\n')
    print(id_, W, 'x', len(rows), len(pal), 'colours')


def parse(id_):
    pal, frames, clips, cur, block = {'.': None, '?': 'keep'}, {}, {}, None, None
    for line in open(os.path.join(PIX, id_ + '.txt'), encoding='utf8').read().split('\n'):
        if not line.strip() or line.startswith('#'): continue
        t = line.split()
        if len(t) == 2 and len(t[0]) == 1 and t[1].startswith('#') and cur is None:
            h = t[1][1:]; pal[t[0]] = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255); continue
        if t[0] == 'frame':
            cur = {'name': t[1], 'from': t[3] if len(t) > 3 and t[2] == 'from' else None, 'rows': [], 'patches': [], 'nudge': (0, 0)}; frames[t[1]] = cur; block = None; continue
        if t[0] == 'clip': clips[t[1]] = (float(t[2]), t[3:]); continue
        if t[0] == 'at': block = (int(t[1]), int(t[2]), []); cur['patches'].append(block); continue
        if t[0] == 'nudge': cur['nudge'] = (int(t[1]), int(t[2])); continue
        if t[0] == 'grow': cur['grow'] = int(t[1]); continue
        if t[0] == 'clear': cur['patches'].append(('clear', int(t[1]), int(t[2]), int(t[3]), int(t[4]))); block = None; continue
        if t[0] == 'row': cur['patches'].append((int(t[2]), int(t[1]), [t[3]])); block = None; continue
        if block is not None: block[2].append(line.rstrip('\n'))
        else: cur['rows'].append(line.rstrip('\n'))
    return pal, frames, clips


def render(pal, frames, name, memo):
    if name in memo: return memo[name]
    F = frames[name]
    if F['from']: g = [row[:] for row in render(pal, frames, F['from'], memo)]
    else: g = [[pal.get(ch) for ch in row] for row in F['rows']]
    if F.get('grow'): g = [[None] * max(len(r) for r in g) for _ in range(F['grow'])] + g
    W = max([len(r) for r in g] + [P_[0] + max(len(q) for q in P_[2]) for P_ in F['patches'] if P_[0] != 'clear'])   # (a pose may reach past the art: its canvas grows)
    g = [r + [None] * (W - len(r)) for r in g]
    for P_ in F['patches']:
        if P_[0] == 'clear':
            for y in range(P_[2], P_[4] + 1):
                for x in range(P_[1], P_[3] + 1):
                    if 0 <= y < len(g) and 0 <= x < W: g[y][x] = None
            continue
        x0, y0, rows = P_
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch == '?' or ch == ' ': continue
                y, x = y0 + j, x0 + i
                if 0 <= y < len(g) and 0 <= x < W: g[y][x] = pal[ch]
    dx, dy = F['nudge']
    if dx or dy:
        o = [[None] * W for _ in g]
        for y, r in enumerate(g):
            for x, c in enumerate(r):
                if c and 0 <= x + dx < W and 0 <= y + dy < len(g): o[y + dy][x + dx] = c
        g = o
    memo[name] = g
    return g


def build(prev=None):
    BL = (0, 0, 0, 0); blocks = []; y0 = 0; sheetW = 0
    for id_ in IDS:
        if not os.path.exists(os.path.join(PIX, id_ + '.txt')): continue
        pal, frames, clips = parse(id_); memo = {}
        names = [n for n in frames]; imgs = [render(pal, frames, n, memo) for n in names]
        P = 8; H = max(len(g) for g in imgs) + P; W = max(len(g[0]) for g in imgs) + 2 * P
        cells = []
        for n, g in zip(names, imgs):                       # (each frame on one canvas, its feet on the same row: the ground anchor)
            c = [[BL] * W for _ in range(H)]; oy = H - len(g); ox = P
            for y, r in enumerate(g):
                for x, col in enumerate(r):
                    if col and col != 'keep': c[oy + y][ox + x] = col
            cells.append((n, c))
        blocks.append((id_, cells, W, H, y0, clips)); y0 += H; sheetW = max(sheetW, W * len(cells))
    sheet = [[BL] * sheetW for _ in range(y0)]; sprites = {}
    for id_, cells, W, H, oy, clips in blocks:
        fr = {}
        for k, (n, c) in enumerate(cells):
            for y in range(H):
                for x in range(W): sheet[oy + y][k * W + x] = c[y][x]
            fr[f'{id_}_{n}'] = [k * W, oy, W, H]
        A = {c: {'frames': [f'{id_}_{n}' for n in L], 'fps': fps, 'loop': c in ('move', 'idle')} for c, (fps, L) in clips.items()}
        A.setdefault('move', {'frames': [f'{id_}_base'], 'fps': 1, 'loop': True})
        if 'shoot' in A: A.setdefault('attack', {'frames': [A['shoot']['frames'][len(A['shoot']['frames']) // 2]], 'fps': 1, 'loop': False})
        A.setdefault('hurt', {'frames': [A['move']['frames'][0]], 'fps': 1, 'loop': False})
        sprites[id_] = {'frames': fr, 'anims': A, 'meta': {}}
    write_png(os.path.join(OUT, 'castle_user.png'), sheet)
    if prev:
        S = 4; write_png(prev, [[sheet[y // S][x // S] if sheet[y // S][x // S][3] else (70, 66, 80, 255) for x in range(sheetW * S)] for y in range(y0 * S)])
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's defenders, the user's art, hand-animated", 'version': 2}, 'sheets': {'castle_user': {'image': 'castle_user.png', 'kind': 'enemy', 'sprites': sprites}}},
              open(os.path.join(OUT, 'atlas_castle_user.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle_user:', len(blocks), 'defenders')


if __name__ == '__main__':
    if sys.argv[1] == 'dump': [dump(i) for i in (sys.argv[2:] or IDS)]
    elif sys.argv[1] == 'build': build(sys.argv[2] if len(sys.argv) > 2 else None)
