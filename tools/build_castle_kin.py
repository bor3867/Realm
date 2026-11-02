# Sunthief's Castle's defenders (2026-11-02, the user's own sprites: art/source/castle/<id>.png, true native 16x16, the
# anchor bottom-centre). Their art is kept as drawn; this only animates it lightly: a breath (the body a pixel up on the
# second frame; a bat's or a wraith's whole self, as it hovers), the strike (the sprite's bright pixels flare), the hurt
# (the same, its dark pixels a shade redder).
#   'castle_kin/<id>'  frames move1 move2 attack hurt      art/bundle/throne/castle_kin.png + atlas_castle_kin.json
#   py -I tools/build_castle_kin.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = os.path.join(root, 'art', 'source', 'castle'); out = os.path.join(root, 'art', 'bundle', 'throne')
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
from reduce import read_png  # noqa: E402

IDS = ['cinder_bat', 'lava_slime', 'cinder_archer', 'hollow_wraith', 'infernal_hound', 'solar_acolyte', 'lava_guard', 'sun_cultist',
       'sunbound_knight', 'cinder_elemental', 'eclipse_shade', 'forge_golem', 'sunbound_construct', 'forge_overseer']
HOVER = {'cinder_bat', 'hollow_wraith', 'eclipse_shade', 'cinder_elemental', 'sunbound_construct'}   # (they float: the whole of them bobs)
BLANK = (0, 0, 0, 0)
lum = lambda c: c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11


def frames(px, hover):
    H, W = len(px), len(px[0])
    m1 = [row[:] for row in px]
    m2 = [[BLANK] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            c = px[y][x]
            if not c[3]: continue
            up = 1 if (hover or y < H - 3) else 0               # (a walker's feet stay put; the rest of it breathes up a pixel)
            if y - up >= 0: m2[y - up][x] = c
    for y in range(H - 3, H):                                   # (the feet, where nothing moved over them)
        for x in range(W):
            if not hover and px[y][x][3] and not m2[y][x][3]: m2[y][x] = px[y][x]
    flare = lambda c: (min(255, c[0] + 60), min(255, c[1] + 50), min(255, c[2] + 30), c[3]) if c[3] and lum(c) > 120 else c
    hurt = lambda c: (min(255, c[0] + 50), c[1], c[2], c[3]) if c[3] and lum(c) <= 120 else c
    return {'move1': m1, 'move2': m2, 'attack': [[flare(c) for c in row] for row in px], 'hurt': [[hurt(c) for c in row] for row in px]}


if __name__ == '__main__':
    keys = ['move1', 'move2', 'attack', 'hurt']
    sheet = [[BLANK] * (16 * len(keys)) for _ in range(16 * len(IDS))]; sprites = {}
    for r, i in enumerate(IDS):
        px = read_png(os.path.join(src, i + '.png')); F = frames(px, i in HOVER); fr = {}
        for k, key in enumerate(keys):
            for y in range(16):
                for x in range(16): sheet[r * 16 + y][k * 16 + x] = F[key][y][x]
            fr[key] = [k * 16, r * 16, 16, 16]
        sprites[i] = {'frames': fr, 'anims': {'move': {'frames': ['move1', 'move2'], 'fps': 4, 'loop': True}, 'attack': {'frames': ['move1', 'attack'], 'fps': 6, 'loop': False},
                      'hurt': {'frames': ['hurt', 'move1'], 'fps': 8, 'loop': False}}}
    write_png(os.path.join(out, 'castle_kin.png'), sheet)
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's defenders (the user's sprites)", 'version': 1}, 'sheets': {'castle_kin': {'image': 'castle_kin.png', 'kind': 'enemy', 'outline': True, 'sprites': sprites}}},
              open(os.path.join(out, 'atlas_castle_kin.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_castle_kin.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_castle_kin.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle kin:', len(IDS), 'sprites')
