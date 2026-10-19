# Realmforge import, the overworld: the foes each dungeon's portal names ("Dropped by Gravekeepers in the Haunted
# Hills") become realm enemies that drop that portal. Realmforge has no art for them, so each one wears the art of the
# closest creature in its own dungeon (by name, else by role: the first a brawler, the second a shooter), keeps the
# name the user gave it, fights like that creature (its move, its attacks, its dungeon's shot art) at its land's
# strength, and lives in the closest of our lands.
#   art/bundle/realmforge/rf_foes.png + atlas_rf_foes.json   foes, their shots, the 24 portals (a registry pack)
#   src/data/rf_foes.js                                       RF_FOES (our ENEMIES format), RF_FOE_LANDS
#   py -I tools/rf_build_foes.py
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
from rf_build_items import Sheet, write_png  # noqa: E402  (the same PNG writer and packer; importing it rebuilds the item pack too, identically)
D = json.load(open(os.path.join(root, 'art', 'rf', 'data.json'), encoding='utf8'))
X = D['explore']['dungeons']; BOSS = {b['id']: b for b in D['bosses']}

# their places -> our lands
LAND = {'Haunted Hills': 'fen', 'Lowlands': 'lowlands', 'Midlands': 'fen', 'Highlands': 'runeholt', 'Forest Edge': 'thornwood',
        'Snow Peaks': 'runeholt', 'Godlands': 'godfall', 'Shoreline': 'shore', 'Forest': 'thornwood', 'Mountaintops': 'steppe',
        'Volcanic Wastes': 'godfall', 'Ruins': 'runeholt', 'Desert': 'dunes', 'Mountains': 'steppe', 'Old Quarter': 'lowlands',
        "Scholars' Hills": 'steppe'}
# a land's strength: hp and damage of an ordinary foe there
POWER = {'shore': (160, 22), 'dunes': (300, 34), 'lowlands': (260, 30), 'fen': (320, 36), 'thornwood': (420, 42),
         'runeholt': (620, 55), 'steppe': (700, 60), 'godfall': (1100, 85)}
MOVE = {'chase': 'shamble', 'kite': 'kite', 'orbit': 'orbit', 'drift': 'drift', 'hop': 'hop', 'swoop': 'swoop', 'blink': 'blink',
        'burrow': 'burrow', 'still': 'rooted', 'patrol': 'shamble', 'leader': 'shamble', 'formation': 'orbit', 'mirror': 'flank', 'chess': 'hop'}

def singular(w):
    w = w.strip()
    for a, b in (('Witches', 'Witch'), ('Harpies', 'Harpy'), ('Wolves', 'Wolf')):
        if w.endswith(a): return w[:-len(a)] + b
    return w[:-1] if w.endswith('s') else w

foes = Sheet('rf_foes', 'enemy', cols=16, cell=24); shots = Sheet('rf_foeshots', 'shot'); portals = Sheet('rf_portals', 'decor', cols=8, cell=24)
OUT, LANDS = {}, {}
for dg in D['dungeons']:
    did = dg['id']; cfg = X[did]; B = BOSS[dg['boss']]
    # the portal: its art (four frames: an animated sprite)
    pf = dg['portal']['frames']
    for i, g in enumerate(pf): portals.add(f'{did}#{i}', g, dg['portal']['pal'])
    src = dg['portal_from']
    m = re.match(r'(?:Dropped|Served) by (.+?) (?:in|on) (?:the )?(.+)$', src)
    if not m:                                       # the Rift: opened by a rare event, the Unmaker's Eye
        names, place = ["The Unmaker's Eye"], 'Godlands'
    else:
        names, place = [singular(n) for n in re.split(r' and |, ', m.group(1))], m.group(2)
    land = LAND.get(place, 'runeholt'); hp0, dmg0 = POWER[land]
    roster = {k: e for k, e in cfg['enemies'].items() if (not e.get('boss') or k == cfg.get('miniboss')) and not e.get('rare') and e.get('art')}
    used = set()
    for i, nm in enumerate(names):
        words = set(re.findall(r'[a-z]+', nm.lower())) - {'the', 'of'}; noun = re.findall(r'[a-z]+', nm.lower())[-1]
        def score(kv):
            k, e = kv; n = set(re.findall(r'[a-z]+', (e.get('name', '') + ' ' + k).lower()))
            ranged = any(a.get('k') in ('aim', 'ring', 'fan', 'spiral', 'line', 'lob', 'snipe') for a in e.get('atk', []))
            return (20 if any(noun[:5] in w for w in n) else 0) + (len(words & n) * 6) + (2 if (ranged if i % 2 else not ranged) else 0) - (5 if k in used else 0) + (1 if e.get('size', 8) >= 16 else 0)
        k, e = max(roster.items(), key=score); used.add(k)
        fid = 'rf_' + re.sub(r'[^a-z]+', '_', nm.lower()).strip('_')
        frames = e['art']['frames']
        for j, g in enumerate(frames): foes.add(f'{fid}#{j}', g, e['art']['pal'])
        # its shot: the dungeon's own shot art when it names one, drawn from the boss's shot sheet
        atk = [a for a in e.get('atk', []) if a.get('k') not in ('contact', 'shield', 'chain', 'heal', 'raise', 'summon', 'trail', 'pulse')]
        skey = next((a.get('shot') for a in atk if a.get('shot')), None) or e.get('shot')
        sh = B['shots'].get(skey) if skey else None
        if not (sh and sh.get('grid') and len(sh['grid']) <= 8): sh = next((s for s in B['shots'].values() if s.get('grid') and len(s['grid']) <= 8 and not s.get('minion')), None)
        proj = None
        if sh: shots.add(fid, sh['grid'], sh['pal']); proj = f'rf_foeshots/{fid}'
        eye = nm == "The Unmaker's Eye"
        k_hp = (e['hp'] / 400) ** 0.5; hp = int(hp0 * max(0.6, min(2.2, k_hp)) * (6 if eye else 1))
        dmg = int(dmg0 * max(0.7, min(1.5, e['dmg'] / 60)))
        attacks = []
        for a in atk[:2]:
            kk = a['k']; cd = round(max(0.9, a.get('cd', 1.6)), 2)
            if kk in ('ring', 'wave', 'spiral'): attacks.append({'pattern': 'radial', 'proj': proj, 'count': int(a.get('n', 8)), 'dmg': int(dmg * 0.8), 'speed': round(a.get('v', 5), 1), 'range': 6, 'cd': max(cd, 1.8), 'tell': 450})
            elif kk == 'slam': attacks.append({'pattern': 'radial', 'proj': proj, 'count': int(a.get('ring', 8) or 8), 'dmg': int(dmg * 0.9), 'speed': 5, 'range': 4, 'cd': max(cd, 2.4), 'tell': 600})
            else: attacks.append({'pattern': 'aimed', 'proj': proj, 'count': int(a.get('n', 1)), 'arc': round(a.get('sp', 0.2) * max(0, a.get('n', 1) - 1), 2), 'dmg': dmg, 'speed': round(a.get('v', 7) if kk != 'lob' else 6, 1), 'range': 7, 'cd': cd, 'tell': 350})
        if eye: attacks = [{'pattern': 'radial', 'proj': proj, 'count': 16, 'dmg': dmg, 'speed': 5, 'range': 8, 'cd': 2.2, 'tell': 600}, {'pattern': 'aimed', 'proj': proj, 'count': 5, 'arc': 0.6, 'dmg': dmg, 'speed': 8, 'range': 8, 'cd': 1.4, 'tell': 400}]
        contact = any(a.get('k') == 'contact' for a in e.get('atk', []))
        big = len(frames[0]) > 10                      # (drawn at 2x times scale: 8px art a tile tall, bigger art a little over)
        OUT[fid] = {'name': nm, 'biome': land, 'hp': hp, 'def': {'shore': 0, 'dunes': 2, 'lowlands': 1, 'fen': 3, 'thornwood': 5, 'runeholt': 9, 'steppe': 10, 'godfall': 16}[land] + (10 if eye else 0),
                    'speed': round(min(3.6, max(0.9, e.get('spd', 2) * 0.68)), 2), 'xp': max(8, hp // 14), 'r': 0.55 if big else 0.42,
                    'ai': 'rooted' if eye else MOVE.get(e.get('move', 'chase'), 'shamble'), 'aggro': 10, 'reg': f'rf_foes/{fid}',
                    'scale': round(max(0.5, min(1, 12 / len(frames[0]))), 2), 'attacks': attacks or [{'pattern': 'aimed', 'proj': proj, 'count': 1, 'dmg': dmg, 'speed': 6, 'range': 6, 'cd': 1.8, 'tell': 350}],
                    'rfPortal': did, 'rfFrom': k, 'portalP': 1 if eye else 0.035, 'eye': eye}
        if contact: OUT[fid]['contact'] = int(dmg * 0.9)
        LANDS.setdefault(land, []).append(fid)

out = os.path.join(root, 'art', 'bundle', 'realmforge')
def anim(sheet, fps):                                # 'name#i' sprites -> one sprite with its frames as a loop
    S = sheet.build(out); merged = {}
    for key, sp in S['sprites'].items():
        name, i = key.split('#') if '#' in key else (key, '0')
        M = merged.setdefault(name, {'frames': {}, 'meta': {}}); M['frames'][i] = sp['frames']['0']
    for M in merged.values(): M['anims'] = {'move': {'frames': sorted(M['frames'], key=int), 'fps': fps, 'loop': True}, 'loop': {'frames': sorted(M['frames'], key=int), 'fps': fps, 'loop': True}}
    S['sprites'] = merged; return S
atlas = {'meta': {'name': 'Realmforge overworld', 'version': 1, 'notes': "The user's Realmforge project (tools/rf_build_foes.py): its portals, and overworld foes wearing their dungeons' art."},
         'rf': True, 'sheets': {'rf_foes': anim(foes, 4), 'rf_foeshots': shots.build(out), 'rf_portals': anim(portals, 6)}}
json.dump(atlas, open(os.path.join(out, 'atlas_rf_foes.json'), 'w', encoding='utf8', newline='\n'), indent=1)
idx = json.load(open(os.path.join(root, 'art', 'bundle', 'index.json'), encoding='utf8'))
if 'realmforge/atlas_rf_foes.json' not in idx['atlases']: idx['atlases'].append('realmforge/atlas_rf_foes.json'); json.dump(idx, open(os.path.join(root, 'art', 'bundle', 'index.json'), 'w', encoding='utf8', newline='\n'), indent=1)
js = ("// Generated by tools/rf_build_foes.py from the user's Realmforge project. Do not edit by hand.\n"
      "// The overworld foes that drop the Realmforge portals (rfPortal), in our ENEMIES format; RF_FOE_LANDS: who lives where.\n"
      f"export const RF_FOES = {json.dumps(OUT, ensure_ascii=False)};\n"
      f"export const RF_FOE_LANDS = {json.dumps(LANDS, ensure_ascii=False)};\n")
open(os.path.join(root, 'src', 'data', 'rf_foes.js'), 'w', encoding='utf8', newline='\n').write(js)
for fid, F in OUT.items(): print(f"{fid:28} {F['biome']:9} from {F['rfPortal']}/{F['rfFrom']:10} hp {F['hp']:5} {F['ai']:8} {[a['pattern'] for a in F['attacks']]}")
print(len(OUT), 'foes')
