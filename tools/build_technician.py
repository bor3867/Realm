# The Drawbridge Technician (2026-11-02, the user's polish spec, 8): the castle engineer who keeps the drawbridge, an
# elite miniboss. Drawn here, 16x16 at native pixels: an armoured engineer, a visor glowing, a heavy forge apron riveted
# with embers, reinforced gauntlets, a brass gear rig on his back. Rimmed in its own darker colours, never black.
# Frames (from the drawing, a part at a time): idle a breath; walk a step each side; the strike in three (the gear rig
# spinning bright, the gauntlets thrown out with sparks, settling); a flinch; II's change (the rig overloading, sparks);
# a death (the rig seizing, him to a knee, to ash).
#   'bx_drawbridge_technician/drawbridge_technician'  art/bundle/throne/technician.png + atlas_technician.json
import json, math, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
from pixlib import write_png  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'throne')
BLANK = (0, 0, 0, 0)
PAL = {'k': (34, 24, 40), 'D': (70, 64, 80), 's': (130, 124, 140), 'y': (255, 200, 80), 'b': (70, 44, 28), 'B': (110, 72, 44), 'o': (255, 140, 40),
       'I': (150, 150, 160), 'G': (230, 180, 60), 'W': (255, 240, 190)}
ART = ['.....kkkkk..kkk.', '....kDsssDk.kGGk', '....kskyykskGkGk', '....kDsssDk.kGGk', '...kkkDDDkkk.kk.', '..kssDbbbDssk...', '.kssDbBBBbDssk..', '.kDkbBoBoBbkDk..',
       'kIIkbBBBBBbkIIk.', 'kIIkbBoBoBbkIIk.', '.kk.bBBBBBb.kk..', '....kbBBBbk.....', '....kDk.kDk.....', '....kDk.kDk.....', '...kkDk.kDkk....', '...kkkk.kkkk....']
PT, PS = 3, 2
W, H = 16 + 2 * PS, 16 + PT
def base():
    g = [[BLANK] * W for _ in range(H)]
    for y, row in enumerate(ART):
        for x, c in enumerate(row):
            if c != '.': g[y + PT][x + PS] = (*PAL[c], 255)
    return g
def moved(g, mask, dx, dy):
    o = [row[:] for row in g]; pts = [(x, y, g[y][x]) for y in range(H) for x in range(W) if g[y][x][3] and mask(x - PS, y - PT)]
    for x, y, c in pts: o[y][x] = BLANK
    for x, y, c in pts:
        if 0 <= x + dx < W and 0 <= y + dy < H: o[y + dy][x + dx] = c
    return o
def recol(g, frm, to):
    return [[(*to, 255) if c[3] and c[:3] == frm else c for c in row] for row in g]
def tint(g, mask, col, k):
    return [[((int(c[0] + (col[0] - c[0]) * k), int(c[1] + (col[1] - c[1]) * k), int(c[2] + (col[2] - c[2]) * k), 255) if c[3] and mask(x - PS, y - PT) else c) for x, c in enumerate(row)] for y, row in enumerate(g)]
def dots(g, pts, col):
    g = [row[:] for row in g]
    for x, y in pts:
        x, y = int(x), int(y)
        if 0 <= x < W and 0 <= y < H and not g[y][x][3]: g[y][x] = (*col, 255)
    return g
UP = lambda x, y: y < 12
LEGL = lambda x, y: y >= 12 and x < 8
LEGR = lambda x, y: y >= 12 and x >= 8
ARMS = lambda x, y: 8 <= y <= 10 and (x <= 3 or x >= 11)
RIG = lambda x, y: x >= 12 and y <= 4
ALL = lambda x, y: True
GOLD, SPARK = PAL['G'], (255, 214, 96)
def idle(k): return moved(base(), UP, 0, -1) if k in (1, 2) else base()
def walk(k):
    g = base()
    if k == 0: g = moved(g, LEGL, 0, -1)
    if k == 2: g = moved(g, LEGR, 0, -1)
    if k in (1, 3): g = moved(g, UP, 0, -1)
    return g
def attack(k):
    g = base()
    if k == 0: return tint(recol(g, GOLD, PAL['W']), lambda x, y: (x, y) in ((6, 2), (7, 2), (8, 2)), (255, 255, 220), 0.8)
    if k == 1:
        g = moved(moved(g, lambda x, y: ARMS(x, y) and x <= 3, -1, 0), lambda x, y: ARMS(x, y) and x >= 11, 1, 0)
        return dots(recol(g, GOLD, (255, 214, 96)), [(PS + 15, PT + 2), (PS + 16, PT + 4), (PS + 14, PT - 1), (PS - 1, PT + 9), (PS + 17, PT + 9)], SPARK)
    return moved(g, UP, 0, 1) if False else g
def hurt(): return tint(moved(base(), UP, 0, 1), lambda x, y: True, (255, 160, 80), 0.25)
def enter(k):
    if k == 3: return base()
    g = recol(base(), GOLD, PAL['W'] if k else (255, 214, 96))
    if k == 2: g = dots(g, [(PS + 8 + math.cos(i * 0.8) * 9, PT + 7 + math.sin(i * 0.8) * 8) for i in range(8)], SPARK)
    return g
def death(k):
    g = recol(base(), GOLD, (90, 80, 70))
    if k >= 1: g = moved(g, UP, 0, 2)
    if k >= 2: g = [[(((60 + c[0]) // 2, (54 + c[1]) // 2, (60 + c[2]) // 2, 255) if c[3] and (x + y + k) % (5 - k) else (BLANK if k == 4 and c[3] and (x * 3 + y) % 2 else c)) for x, c in enumerate(row)] for y, row in enumerate(g)]
    return g
if __name__ == '__main__':
    fr = [(f'i_{k}', idle(k)) for k in range(4)] + [(f'w_{k}', walk(k)) for k in range(4)] + [(f'a_{k}', attack(k)) for k in range(3)] + [('h', hurt())] + [(f'e_{k}', enter(k)) for k in range(4)] + [(f'd_{k}', death(k)) for k in range(5)]
    cols = 6; rows = (len(fr) + cols - 1) // cols
    sheet = [[BLANK] * (W * cols) for _ in range(H * rows)]; frames = {}
    for n, (key, g) in enumerate(fr):
        ox, oy = (n % cols) * W, (n // cols) * H
        for y in range(H):
            for x in range(W): sheet[oy + y][ox + x] = g[y][x]
        frames[key] = [ox, oy, W, H]
    write_png(os.path.join(out, 'technician.png'), sheet)
    A = {}
    for a in (1, 2):
        A[f'idle{a}'] = {'frames': [f'i_{k}' for k in range(4)], 'fps': 4, 'loop': True}
        A[f'walk{a}'] = {'frames': [f'w_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        A[f'attack{a}'] = {'frames': ['a_0', 'a_1', 'a_2', 'a_2'], 'fps': 7 if a == 1 else 9, 'loop': False}
        A[f'hurt{a}'] = {'frames': ['h'], 'fps': 5, 'loop': False}
    A['enter2'] = {'frames': [f'e_{k}' for k in range(4)], 'fps': 3.5, 'loop': False}
    A['death'] = {'frames': [f'd_{k}' for k in range(5)], 'fps': 2.2, 'loop': False}
    ph = {'1': {'name': 'The Engineer', 'idle': 'idle1', 'attack': 'attack1', 'walk': 'walk1', 'hurt': 'hurt1'}, '2': {'name': 'The Mechanism Unstable', 'idle': 'idle2', 'attack': 'attack2', 'walk': 'walk2', 'hurt': 'hurt2', 'enter': 'enter2'}}
    boss = {'image': 'technician.png', 'kind': 'boss', 'sprites': {'drawbridge_technician': {'frames': frames, 'anims': A, 'death': 'death', 'meta': {}, 'phases': ph}}}
    json.dump({'rf': True, 'meta': {'name': 'The Drawbridge Technician', 'version': 1}, 'sheets': {'bx_drawbridge_technician': boss}}, open(os.path.join(out, 'atlas_technician.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_technician.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_technician.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('technician:', len(fr), 'frames')
