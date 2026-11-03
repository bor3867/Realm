# The Forge Overseer in the user's redesign (2026-11-02: "Replace the old Forge Overseer appearance with the new provided
# design ... crown, furnace core, heavy armor, and massive forge hammer ... frame-by-frame idle, walking, hammer attack,
# casting, damage, and death animations"). His frames are hand-drawn in art/source/castle2/pix/overseer_boss.txt (made with
# tools/castle_pix.py's format); this lays them out as the boss engine's clips:
#   idle1-3 (his core breathing; flaring in his later phases), walk1-3, attack1-3 (the hammer up and smashed down),
#   hurt1-3, enter2/enter3 (casting: the core white-hot), death
#   'bx_forge_overseer/forge_overseer'   art/bundle/throne/forge_overseer.png + atlas_forge_overseer.json
#   py -I tools/build_overseer.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from pixlib import write_png  # noqa: E402
import castle_pix as C  # noqa: E402
out = os.path.join(root, 'art', 'bundle', 'throne')
pal, frames, clips = C.parse('overseer_boss'); memo = {}
names = [n for n in frames if n != 'base']
imgs = {n: C.render(pal, frames, n, memo) for n in names}
W = max(len(g[0]) for g in imgs.values()) + 4; H = max(len(g) for g in imgs.values()) + 2
BL = (0, 0, 0, 0); cols = 8; rows = (len(names) + cols - 1) // cols
sheet = [[BL] * (W * cols) for _ in range(H * rows)]; fr = {}
for k, n in enumerate(names):
    g = imgs[n]; ox, oy = (k % cols) * W + 2, (k // cols) * H + (H - len(g))   # (every frame on the same ground line)
    for y, r in enumerate(g):
        for x, c in enumerate(r):
            if c and c != 'keep': sheet[oy + y][ox + x] = c
    fr[n] = [(k % cols) * W, (k // cols) * H, W, H]
write_png(os.path.join(out, 'forge_overseer.png'), sheet)
A = {}
for ph in (1, 2, 3):
    A[f'idle{ph}'] = {'frames': ['idle0', 'idle1'] if ph == 1 else ['idle1', 'cast0'], 'fps': 2.5 if ph == 1 else 4, 'loop': True}
    A[f'walk{ph}'] = {'frames': ['walk0', 'walk1', 'walk2', 'walk3'], 'fps': 5 + ph, 'loop': True}
    A[f'attack{ph}'] = {'frames': ['smash0', 'smash1', 'smash2', 'smash3'], 'fps': 6 + ph, 'loop': False}
    A[f'hurt{ph}'] = {'frames': ['hurt'], 'fps': 5, 'loop': False}
A['enter2'] = {'frames': ['cast0', 'cast1', 'cast2', 'cast1'], 'fps': 3.5, 'loop': False}
A['enter3'] = {'frames': ['cast0', 'cast1', 'cast2', 'cast1', 'cast2'], 'fps': 4, 'loop': False}
A['death'] = {'frames': ['die0', 'die1', 'die2', 'die3', 'die4'], 'fps': 2.4, 'loop': False}
ph = {'1': {'name': 'The Taskmaster', 'idle': 'idle1', 'attack': 'attack1', 'walk': 'walk1', 'hurt': 'hurt1'},
      '2': {'name': 'The Furnace Master', 'idle': 'idle2', 'attack': 'attack2', 'walk': 'walk2', 'hurt': 'hurt2', 'enter': 'enter2'},
      '3': {'name': 'The Final Forging', 'idle': 'idle3', 'attack': 'attack3', 'walk': 'walk3', 'hurt': 'hurt3', 'enter': 'enter3'}}
boss = {'image': 'forge_overseer.png', 'kind': 'boss', 'sprites': {'forge_overseer': {'frames': fr, 'anims': A, 'death': 'death', 'meta': {}, 'phases': ph}}}
json.dump({'rf': True, 'meta': {'name': 'The Forge Overseer (the user\'s redesign, hand-animated)', 'version': 2}, 'sheets': {'bx_forge_overseer': boss}},
          open(os.path.join(out, 'atlas_forge_overseer.json'), 'w', encoding='utf8', newline='\n'), indent=1)
# his old copy out of the defenders' atlas (tools/build_castle_kin.py no longer writes it)
kp = os.path.join(out, 'atlas_castle_kin.json'); K = json.load(open(kp, encoding='utf8'))
if K['sheets'].pop('bx_forge_overseer', None): json.dump(K, open(kp, 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'throne/atlas_forge_overseer.json' not in idx['atlases']: idx['atlases'].append('throne/atlas_forge_overseer.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
print('overseer:', len(names), 'frames')
