# Sunthief's Castle's defenders (2026-11-02, the user's own sprites: art/source/castle/<id>.png, true native 16x16, the
# anchor bottom-centre). Their art is kept as drawn; this only animates it lightly: a breath (the body a pixel up on the
# second frame; a bat's or a wraith's whole self, as it hovers), the strike (the sprite's bright pixels flare), the hurt
# (the same, its dark pixels a shade redder).
#   'castle_kin/<id>'  frames move1 move2 attack hurt      art/bundle/throne/castle_kin.png + atlas_castle_kin.json
#   py -I tools/build_castle_kin.py
import math
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


EDGE = (38, 26, 48, 255)                                    # (their rim: a deep charcoal-purple, not black; the user, 2026-11-02)


def soften(px):
    # the near-black pixels on a sprite's silhouette (touching the outside) turn to the rim colour; the inside is as drawn
    H, W = len(px), len(px[0]); out = [row[:] for row in px]
    for y in range(H):
        for x in range(W):
            c = px[y][x]
            if not c[3] or lum(c) > 30: continue
            if any(not (0 <= X < W and 0 <= Y < H) or not px[Y][X][3] for X, Y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))): out[y][x] = EDGE
    return out


def frames(px, hover):
    px = soften(px)
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


# their shots, drawn here at their native size, pointing right ('castle_shots/<name>', 8x8 cells): the spec's shapes
SPAL = {'k': (14, 8, 12), 'o': (255, 140, 40), 'O': (255, 200, 90), 'y': (255, 230, 120), 'w': (255, 250, 220), 'r': (190, 50, 30), 'p': (150, 70, 210), 'P': (210, 150, 255),
        'v': (90, 40, 140), 'g': (230, 180, 60), 'G': (255, 225, 120), 'd': (40, 30, 48), 'D': (80, 64, 90), 's': (120, 110, 130)}
SHOTS = {
    'ember': ['.o.', 'oyo', '.o.'],                                   # a 2x2 fire diamond (with its rim)
    'pember': ['.p.', 'pPp', '.p.'],                                  # a purple ember
    'blob': ['.rr.', 'royr', 'royr', '.rr.'],                         # a 3x3 molten blob
    'arrow': ['....kk', 'ssssOw', '....kk'],                          # a thin 2x4 arrow
    'darrow': ['.....k.', 'ddddoOw', '.....k.'],                      # the marked arrow, black and orange
    'ghost': ['.v.', 'vPp', 'pPv', '.v.'],                            # a 2x3 ghostly diamond
    'flame': ['..o.', '.oyo', 'oyww', '.oyo', '..o.'],               # a flame
    'tear': ['.g..', 'gGGw', '.g..'],                                 # a 2x3 golden tear-drop
    'lance': ['......g.', 'gGGGGGGw', '......g.'],                    # a narrow solar lance
    'gear': ['.s.s.', 'sDDDs', '.DoD.', 'sDDDs', '.s.s.'],             # a gear of the forge
    'crescent': ['.vv.', 'vd..', 'vd..', '.vv.'],                     # a dark crescent
    'gorb': ['.gg.', 'gGwg', 'gGGg', '.gg.'],                         # a golden orb
    'porb': ['.vv.', 'vPpv', 'vppv', '.vv.'],                         # a purple orb
    'stone': ['.rr.', 'rDor', 'rooD', '.rr.'],                        # molten stone
    'spear': ['......G', 'gggGGGw', '......G'],                       # a golden spear
}


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
    shots = [[BLANK] * (8 * len(SHOTS)) for _ in range(8)]; sfr = {}
    for k, (name, grid) in enumerate(SHOTS.items()):
        oy, ox = (8 - len(grid)) // 2, (8 - len(grid[0])) // 2
        for y, row in enumerate(grid):
            for x, c in enumerate(row):
                if c != '.': shots[oy + y][k * 8 + ox + x] = (*SPAL[c], 255)
        sfr[name] = {'frames': {'0': [k * 8, 0, 8, 8]}, 'meta': {}}
    write_png(os.path.join(out, 'castle_shots.png'), shots)
    # the Forge Overseer, the miniboss, on the boss engine ('bx_forge_overseer/forge_overseer'): its sprite as drawn, each
    # phase its bright parts hotter (I as drawn, II orange, III white-hot). Alive (2026-11-02, the user: "finish all boss
    # animations"): frames from its own art a part at a time (tools/boss_motion.py), with room above and beside it:
    #   idle     a breath (the body up a pixel by turns)
    #   walk     a step: one foot lifted, the body over it, then the other; the hammer swinging the other way
    #   attack   the hammer hauled up over his crown (his eyes and core flaring); brought down before him, sparks thrown up
    #            where it lands; drawn back
    #   hurt     a flinch: sinking a pixel, his fire flaring (no white, no knockback)
    #   enter    II, III: he staggers, his forge-fire roars up through him, a ring of sparks, the hotter form
    #   death    the hammer drops from his hand, he sinks to a knee, then to ash
    from boss_motion import pad, shift, arc, tint
    PT, PS = 3, 2
    OW, OH = 16 + 2 * PS, 16 + PT
    O = lambda x, y: (x - PS, y - PT)
    HAM = lambda x, y, c: O(x, y)[0] <= 2 or (O(x, y)[0] <= 4 and O(x, y)[1] <= 5)
    LEGL = lambda x, y, c: O(x, y)[1] >= 14 and 2 < O(x, y)[0] < 8
    LEGR = lambda x, y, c: O(x, y)[1] >= 14 and O(x, y)[0] >= 8
    ABOVE = lambda x, y, c: O(x, y)[1] < 14 and O(x, y)[0] > 2
    HOT = lambda x, y, c: lum(c) > 110
    ALL = lambda x, y, c: True
    SPARK = [(255, 214, 96, 255), (255, 140, 40, 255), (255, 240, 190, 255)]
    ov = soften(read_png(os.path.join(src, 'forge_overseer.png')))
    heat = lambda g, k: [[(min(255, c[0] + 30 * k), max(0, c[1] - 8 * k) if k < 2 else min(255, c[1] + 25), c[2], c[3]) if c[3] and lum(c) > 110 else c for c in row] for row in g]
    base = lambda a: pad(heat(ov, a - 1), PT, PS)

    def o_idle(a, k): return shift(base(a), ABOVE, 0, -1, keep=True) if k in (1, 2) else base(a)

    def o_walk(a, k):
        g = base(a)
        if k == 0: g = shift(g, LEGL, 0, -1, fill=False)
        if k == 2: g = shift(g, LEGR, 0, -1, fill=False)
        if k in (1, 3): g = shift(g, ABOVE, 0, -1, keep=True)
        return shift(g, HAM, 1 if k < 2 else -1, 0, fill=False)

    def o_attack(a, k):
        if k == 0: return tint(shift(shift(base(a), HAM, 1, -3, fill=False), ABOVE, 0, -1, keep=True), HOT, (255, 240, 190), 0.5)
        if k == 1:
            g = tint(shift(base(a), HAM, 3, 2, fill=False), HOT, (255, 236, 170), 0.6)
            return arc(g, [(PS + 5 + i, OH - 2 - (i % 3)) for i in range(7)], SPARK)
        return shift(base(a), HAM, 1, 1, fill=False)

    def o_hurt(a): return tint(shift(base(a), ABOVE, 0, 1, keep=True), HOT, (255, 210, 120), 0.7)

    def o_enter(a, k):
        if k == 3: return base(a)
        g = shift(base(a - 1 if k < 2 else a), ABOVE, 0, 1 if k == 0 else 0, keep=True)
        if k >= 1: g = tint(g, HOT, (255, 240, 190), 0.8)
        if k == 2: g = arc(g, [(PS + 8 + math.cos(i * 0.7) * 8, PT + 8 + math.sin(i * 0.7) * 8) for i in range(9)], SPARK)
        return g

    def o_die(k):
        if k >= 3: return pad(ash(ov, k - 2), PT, PS)
        g = shift(base(3), HAM, -1, 3, fill=False)                                 # (the hammer drops from his hand)
        if k >= 1: g = shift(g, ABOVE, 0, 2)                                       # (to a knee)
        if k == 2: g = tint(g, HOT, (90, 40, 30), 0.7)                             # (his fire dying)
        return g

    ash = lambda g, k: [[((70 + c[0]) // 2, (60 + c[1]) // 2, (66 + c[2]) // 2, c[3]) if c[3] and (x * 3 + y * 5 + k) % (4 - k) else (BLANK if k == 2 and c[3] and (x + y) % 2 else c) for x, c in enumerate(row)] for y, row in enumerate(g)]
    ofr = []
    for a in (1, 2, 3):
        ofr += [(f'i{a}_{k}', o_idle(a, k)) for k in range(4)] + [(f'a{a}_{k}', o_attack(a, k)) for k in range(3)]
        ofr += [(f'w{a}_{k}', o_walk(a, k)) for k in range(4)] + [(f'h{a}', o_hurt(a))]
        if a > 1: ofr += [(f'e{a}_{k}', o_enter(a, k)) for k in range(4)]
    ofr += [(f'd{k}', o_die(k)) for k in range(5)]
    rows = (len(ofr) + 5) // 6
    osheet = [[BLANK] * (OW * 6) for _ in range(OH * rows)]; ofrm = {}
    for n, (key, g2) in enumerate(ofr):
        ox, oy = (n % 6) * OW, (n // 6) * OH
        for y in range(OH):
            for x in range(OW): osheet[oy + y][ox + x] = g2[y][x] if g2[y][x] is not None else BLANK
        ofrm[key] = [ox, oy, OW, OH]
    pass   # (his image is tools/build_overseer.py's now: the user's redesign)
    oanims = {}
    for a in (1, 2, 3):
        oanims[f'idle{a}'] = {'frames': [f'i{a}_{k}' for k in range(4)], 'fps': 4, 'loop': True}
        oanims[f'attack{a}'] = {'frames': [f'a{a}_0', f'a{a}_1', f'a{a}_2', f'a{a}_2'], 'fps': 7, 'loop': False}
        oanims[f'walk{a}'] = {'frames': [f'w{a}_{k}' for k in range(4)], 'fps': 6, 'loop': True}
        oanims[f'hurt{a}'] = {'frames': [f'h{a}'], 'fps': 5, 'loop': False}
        if a > 1: oanims[f'enter{a}'] = {'frames': [f'e{a}_{k}' for k in range(4)], 'fps': 3.5, 'loop': False}
    oanims['death'] = {'frames': [f'd{k}' for k in range(5)], 'fps': 2.2, 'loop': False}
    NM = {1: 'The Taskmaster', 2: 'The Furnace Master', 3: 'The Final Forging'}
    oboss = {'image': 'forge_overseer.png', 'kind': 'boss', 'sprites': {'forge_overseer': {'frames': ofrm, 'anims': oanims, 'death': 'death', 'meta': {},
             'phases': {str(a): {'name': NM[a], 'idle': f'idle{a}', 'attack': f'attack{a}', 'walk': f'walk{a}', 'hurt': f'hurt{a}', **({'enter': f'enter{a}'} if a > 1 else {})} for a in (1, 2, 3)}}}}
    json.dump({'rf': True, 'meta': {'name': "Sunthief's Castle's defenders (the user's sprites)", 'version': 1}, 'sheets': {'castle_kin': {'image': 'castle_kin.png', 'kind': 'enemy', 'sprites': sprites}, 'castle_shots': {'image': 'castle_shots.png', 'kind': 'shot', 'sprites': sfr}}}   # (the Forge Overseer: his own atlas now, tools/build_overseer.py),
              open(os.path.join(out, 'atlas_castle_kin.json'), 'w', encoding='utf8', newline='\n'), indent=1)
    ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
    if 'throne/atlas_castle_kin.json' not in idx['atlases']:
        idx['atlases'].append('throne/atlas_castle_kin.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
    print('castle kin:', len(IDS), 'sprites')
