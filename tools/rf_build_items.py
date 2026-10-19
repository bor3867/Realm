# Realmforge import, items: from art/rf/data.json (tools/rf_extract.py) build
#   art/bundle/realmforge/rf_items.png + rf_shots.png + atlas_rf.json   the item icons and their shots, as a registry pack
#   src/data/rf_items_data.js                                            the ladders' names, descriptions and numbers
# The ladders replace our tiered weapons, armour and rings (docs/realmforge_port.md). Their 'light' armour is our leather.
#   py -I tools/rf_build_items.py
import json, os, re, struct, zlib
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
D = json.load(open(os.path.join(root, 'art', 'rf', 'data.json'), encoding='utf8'))

def hexrgb(h):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
def write_png(path, w, h, px):                  # px: bytearray w*h*4
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

class Sheet:                                    # a simple shelf packer for small pixel grids
    def __init__(self, name, kind, cols=16, cell=16):
        self.name, self.kind, self.cols, self.cell, self.items = name, kind, cols, cell, []
    def add(self, key, grid, pal, meta=None):
        self.items.append((key, grid, pal, meta or {}))
    def build(self, outdir):
        n = len(self.items); rows = (n + self.cols - 1) // self.cols; W, H = self.cols * self.cell, max(1, rows) * self.cell
        px = bytearray(W * H * 4); sprites = {}
        for i, (key, grid, pal, meta) in enumerate(self.items):
            ox, oy = (i % self.cols) * self.cell, (i // self.cols) * self.cell
            h, w = len(grid), max(len(r) for r in grid)
            for y, row in enumerate(grid):
                for x, ch in enumerate(row):
                    if ch == '.' or ch not in pal: continue
                    r, g, b = hexrgb(pal[ch]); q = ((oy + y) * W + ox + x) * 4
                    px[q:q + 4] = bytes((r, g, b, 255))
            sprites[key] = {'frames': {'0': [ox, oy, w, h]}, 'meta': meta}
        write_png(os.path.join(outdir, self.name + '.png'), W, H, px)
        return {'image': self.name + '.png', 'kind': self.kind, 'sprites': sprites}

num = lambda s: [int(v) for v in re.findall(r'\d+', str(s))]
fl = lambda s: float(re.findall(r'[\d.]+', str(s))[0])
def stats(cell):
    return {k: v for k, v in [(a, b) for a, b in cell['stats']]} if cell.get('stats') else {}
def onequip(cell):
    out = {}
    for a, b in cell['stats']:
        if a in ('On Equip', 'Defense'):
            m = re.match(r'\+?(-?\d+)\s*([A-Z]+)?', str(b).strip())
            if m: out[(m.group(2) or 'DEF').lower()] = int(m.group(1))
    return out

items = Sheet('rf_items', 'item'); shots = Sheet('rf_shots', 'shot')
WT = ['sword', 'dagger', 'wand', 'staff', 'bow']; AT = {'Heavy': 'heavy', 'Light': 'leather', 'Robe': 'robe'}
RW = {t: [] for t in WT}; RA = {t: [] for t in AT.values()}; RR = {}
L = D['ladders']
for ti, row in enumerate(L['weapons']['rows']):
    for ci, cell in enumerate(row['cells']):
        t = WT[ci]; S = stats(cell); key = f'{t}_t{ti}'
        items.add(key, cell['grid'], cell['pal'], {'name': cell['name']})
        sh = cell.get('shot') or D['tierShots'][t][ti]
        shots.add(key, sh['grid'], sh['pal'])
        RW[t].append({'name': cell['name'], 'desc': cell['desc'], 'dmg': num(S['Damage'])[:2], 'count': int(S['Shots']), 'range': fl(S['Range']), 'speed': fl(S['Shot Speed']), 'feed': int(S.get('Feed Power', 0))})
for ti, row in enumerate(L['armor']['rows']):
    for ci, cell in enumerate(row['cells']):
        t = AT[L['armor']['cols'][ci]]; key = f'{t}_t{ti}'
        items.add(key, cell['grid'], cell['pal'], {'name': cell['name']})
        RA[t].append({'name': cell['name'], 'desc': cell['desc'], 'bonus': onequip(cell), 'feed': int(stats(cell).get('Feed Power', 0))})
for ti, row in enumerate(L['rings']['rows']):
    for ci, cell in enumerate(row['cells']):
        s = L['rings']['cols'][ci].lower(); key = f'ring_{s}_t{ti}'
        items.add(key, cell['grid'], cell['pal'], {'name': cell['name']})
        RR.setdefault(s, []).append({'name': cell['name'], 'desc': cell['desc'], 'bonus': onequip(cell), 'feed': int(stats(cell).get('Feed Power', 0))})

# the uniques (UT, Legendary, Mythic): art, shot, numbers, stat lines, and the effects our engine already has.
# Their other named effects are listed as 'pending' and arrive with their dungeon (docs/realmforge_port.md).
# Seeking effects never go in: no item may seek.
uitems = Sheet('rf_uniq', 'item'); ushots = Sheet('rf_uniq_shots', 'shot'); RU = []
STAT = {'HP': 'hp', 'MP': 'mp', 'ATT': 'att', 'DEF': 'def', 'SPD': 'spd', 'DEX': 'dex', 'VIT': 'vit', 'WIS': 'wis'}
def effect(line, avg, sp):                      # one fx line -> our weapon special; False if it waits for its dungeon
    l = line.replace('−', '-'); n = [float(v) for v in re.findall(r'\d+(?:\.\d+)?', l)]
    if re.fullmatch(r'(Shots|Arrows) pierce( enemies)?', l): sp['pierce'] = True; return True
    if l.startswith('Shots inflict Slowed for'): sp['slow'] = {'f': 0.5, 't': n[0]}; return True
    m = re.match(r'Shots inflict (Burning|Poison): (\d+) damage over ([\d.]+)s', l)
    if m: sp['burn'] = {'dps': round(int(m.group(2)) / float(m.group(3))), 't': float(m.group(3))}; return True
    if re.match(r'(Shots|Arrows) inflict (Burning|Bleeding) for', l): sp['burn'] = {'dps': round(avg * 0.2), 't': n[0]}; return True
    if l.startswith('Shots inflict Cursed'): sp['curse'] = {'f': n[0] / 100, 't': n[1]}; return True
    if l.startswith('Hits mark the target'): sp['curse'] = {'f': n[0] / 100, 't': 3}; return True
    if l.startswith('Heals you for'): sp['lifesteal'] = n[0] / 100; return True
    if l.startswith('Shots burst into'): sp['split'] = {'n': int(n[0]) if n else 3, 'f': 0.3}; return True
    if l.startswith('Shots that miss swing around'): sp['boomerang'] = True; return True
    if l in ('Shots weave like a pendulum', 'Shots travel in a rolling wave'): sp['weave'] = {'amp': 0.35, 'freq': 9}; return True
    return False
for u in D['uniques']:
    t = 'leather' if u['type'] == 'light' else u['type']; key = u['id']; S = stats(u)
    uitems.add(key, u['grid'], u['pal'], {'name': u['name']})
    bonus, sp, pend = {}, {}, []
    if 'Defense' in S: bonus['def'] = int(num(S['Defense'])[0])
    W = None
    if 'Damage' in S:
        d = num(S['Damage'])[:2]; sh = u.get('shot') or {}
        W = {'dmg': d, 'count': int(S['Shots']), 'range': fl(S['Range']), 'speed': fl(S['Shot Speed'])}
        if sh.get('grid'): ushots.add(key, sh['grid'], sh['pal'])
        if sh.get('motion') == 'helix': sp['weave'] = {'amp': 0.45, 'freq': 11}
        if sh.get('motion') == 'wave': sp['weave'] = {'amp': 0.35, 'freq': 9}
    lines = []
    for line in u['fx']:
        parts = [x.strip() for x in line.replace('−', '-').split('  ') if x.strip()]
        if all(re.fullmatch(r'[+-]\d+ [A-Z]+', x) and x.split()[1] in STAT for x in parts):
            for x in parts: v, s = x.split(); bonus[STAT[s]] = bonus.get(STAT[s], 0) + int(v)
        else:
            lines.append(line.replace('−', '-'))
            if not (W and effect(line, sum(W['dmg']) / 2, sp)): pend.append(line)
    if 'pierce' in sp: W['pierce'] = sp.pop('pierce')
    RU.append({'id': key, 'type': t, 'rarity': u['rarity'], 'name': u['name'], 'desc': u['desc'], 'boss': u.get('boss'), 'set': u.get('set'),
               'bonus': bonus, 'weapon': W, 'special': sp, 'shot': bool(W and (u.get('shot') or {}).get('grid')), 'pending': pend, 'lines': lines,
               'effects': [{'name': e['name'], 'desc': e['desc']} for e in u.get('effects', [])]})

out = os.path.join(root, 'art', 'bundle', 'realmforge'); os.makedirs(out, exist_ok=True)
atlas = {'meta': {'name': 'Realmforge', 'version': 1, 'notes': 'The user\'s Realmforge project (tools/rf_build_items.py). Native 1px = 1 art pixel; shots point right.'},
         'rf': True, 'sheets': {'rf_items': items.build(out), 'rf_shots': shots.build(out), 'rf_uniq': uitems.build(out), 'rf_uniq_shots': ushots.build(out)}}
json.dump(atlas, open(os.path.join(out, 'atlas_rf.json'), 'w', encoding='utf8', newline='\n'), indent=1)
js = ('// Generated by tools/rf_build_items.py from the user\'s Realmforge project (art/rf/data.json). Do not edit by hand.\n'
      '// The tiered ladders that replace ours: names, descriptions and numbers per tier (art: art/bundle/realmforge).\n'
      f'export const RF_WEAPONS = {json.dumps(RW, ensure_ascii=False)};\n'
      f'export const RF_ARMOR = {json.dumps(RA, ensure_ascii=False)};\n'
      f'export const RF_RINGS = {json.dumps(RR, ensure_ascii=False)};\n'
      '// the uniques: pending = named effects that arrive with their dungeon\n'
      f'export const RF_UNIQUES = {json.dumps(RU, ensure_ascii=False)};\n')
open(os.path.join(root, 'src', 'data', 'rf_items_data.js'), 'w', encoding='utf8', newline='\n').write(js)
print(f"uniques {len(RU)} ({sum(1 for u in RU if u['weapon'])} weapons, shots {len(ushots.items)}), effects now {sum(len(u['special']) for u in RU)}, pending {sum(len(u['pending']) for u in RU)}")
print(f"items {len(items.items)} | shots {len(shots.items)} | weapons {', '.join(f'{k} {len(v)}' for k, v in RW.items())} | armour {', '.join(f'{k} {len(v)}' for k, v in RA.items())} | rings {', '.join(f'{k} {len(v)}' for k, v in RR.items())}")
