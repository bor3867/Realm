# Realmforge bosses onto our three-phase boss engine (src/bossx.js), part 1: their art, as a registry pack.
# Each boss: its four move frames and its attack frame (32x32) in one sheet 'bx_rf_<id>' (sprite 'rf_<id>'), with an
# idle clip, an attack clip and a death clip, and the same clips for each of its phases (so the engine's per-phase art
# lookups find them). Their shots: 'rfx_shots/<boss>.<shot>'. The fights themselves are translated at load time
# (src/bosses/rf_translate.js).
#   art/bundle/realmforge/rf_bx.png, rfx_shots.png + atlas_rf_bx.json
#   py -I tools/rf_build_bx.py
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from rf_build_items import Sheet  # noqa: E402
D = json.load(open(os.path.join(root, 'art', 'rf', 'data.json'), encoding='utf8'))
out = os.path.join(root, 'art', 'bundle', 'realmforge')

bosses = Sheet('rf_bx', 'boss', cols=8, cell=34)
shots = Sheet('rfx_shots', 'shot', cols=16, cell=16)
plan = {}
plan2 = {}
for B in D['bosses']:
    bid = B['id']
    keys = []
    for i, g in enumerate(B['frames']): k = f'{bid}#f{i}'; bosses.add(k, g, B['pal']); keys.append(('f%d' % i, k))
    if B.get('atk'): bosses.add(f'{bid}#atk', B['atk'], B['pal']); keys.append(('atk', f'{bid}#atk'))
    keys2 = []                                        # a twin's second body (the Eclipse Twins' Noct): its own frames
    for i, g in enumerate(B.get('frames2') or []): k = f'{bid}#g{i}'; bosses.add(k, g, B['pal2']); keys2.append(('f%d' % i, k))
    if B.get('atk2'): bosses.add(f'{bid}#atk2', B['atk2'], B['pal2']); keys2.append(('atk', f'{bid}#atk2'))
    if keys2: plan2[bid] = keys2
    plan[bid] = (keys, [ph.get('name') or f'Phase {i + 1}' for i, ph in enumerate(B['phases'])])
    for sk, S in (B.get('shots') or {}).items():
        if S.get('grid'): shots.add(f'{bid}.{sk}', S['grid'], S['pal'])
built = bosses.build(out)
sheets = {}
for bid, (keys, nph) in plan.items():
    frames = {name: built['sprites'][k]['frames']['0'] for name, k in keys}
    move = [n for n, _ in keys if n.startswith('f')]
    anims = {'idle': {'frames': move, 'fps': 6, 'loop': True}, 'attack': {'frames': ['atk'] if 'atk' in frames else move[:1], 'fps': 6, 'loop': False},
             'death': {'frames': move[:1], 'fps': 4, 'loop': False}}
    phases = {str(i + 1): {'name': nm, 'idle': 'idle', 'attack': 'attack'} for i, nm in enumerate(nph or ['Phase 1'])}   # (each phase announced by its own name)
    sheets[f'bx_rf_{bid}'] = {'image': built['image'], 'kind': 'boss', 'sprites': {f'rf_{bid}': {'frames': frames, 'anims': anims, 'phases': phases, 'death': 'death', 'meta': {}}}}
    if bid in plan2:                                  # the second body, drawn as a monster ('move' and 'attack' clips)
        f2 = {name: built['sprites'][k]['frames']['0'] for name, k in plan2[bid]}; m2 = [n for n in f2 if n.startswith('f')]
        sheets[f'bx_rf_{bid}']['sprites'][f'rf_{bid}_2'] = {'frames': f2, 'anims': {'move': {'frames': m2, 'fps': 6, 'loop': True}, 'attack': {'frames': ['atk'] if 'atk' in f2 else m2[:1], 'fps': 6, 'loop': False}}, 'meta': {}}
sheets['rfx_shots'] = shots.build(out)
atlas = {'rf': True, 'meta': {'name': 'Realmforge bosses for the three-phase engine', 'version': 1}, 'sheets': sheets}
json.dump(atlas, open(os.path.join(out, 'atlas_rf_bx.json'), 'w', encoding='utf8', newline='\n'), indent=1)
ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
if 'realmforge/atlas_rf_bx.json' not in idx['atlases']: idx['atlases'].append('realmforge/atlas_rf_bx.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
print(f'{len(plan)} bosses, {len(shots.items)} shots -> art/bundle/realmforge/atlas_rf_bx.json')
