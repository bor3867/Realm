// An audit of Sunthief's Castle as the game builds it (2026-11-06, the user's polish pass: "Inspect the actual generated
// map ... Check for: misaligned or missing tiles, incomplete walls and windows, broken carpets, clipping decorations,
// unnatural room connections, ... empty, unfinished-looking areas, incorrect collision and blocked paths"). Per room of the
// fixed footprint (and the walks between): broken runners (an end with no cap, runners crossing with no junction piece),
// things standing in walls, water or lava, two things on one tile, a hanging banner with no wall behind it, anything solid
// in a doorway, floor shut off by the things in a room, and how bare each room and walk is.
//   node tools/audit_castle.mjs [--list]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const root = new URL('../', import.meta.url);
const { buildRegistry } = await import(new URL('src/registry.js', root));
const { Game } = await import(new URL('src/game.js', root));
const { TID, SK, TILE_NAMES } = await import(new URL('src/world/maps.js', root));
const B0 = new URL('art/bundle/', root), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((q) => ({ pack: q.split('/')[0], json: J(q) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.mode = 'play'; g.enter('throne', { seed: 4 });
const m = g.map, W = m.w, C = m.castle, LIST = process.argv.includes('--list');
const NAME = Object.fromEntries(Object.entries(SK).map(([k, v]) => [v, k]));
const own = (x, y) => (m.masterOwn ? m.masterOwn(x, y) : null) || 'walk';
const floorT = new Set([TID.kpfloor, TID.kpcarpet, TID.grass, TID.stageboards, TID.emberfloor, TID.forge, TID.cobble]);
const isFloor = (x, y) => floorT.has(m.tiles[y * W + x]);
const R = {}; const add = (room, kind, x, y, what = '') => { const r = R[room] || (R[room] = {}); (r[kind] || (r[kind] = [])).push([x, y, what]); };
const box = Object.values(C.rooms).filter((n) => n.master);
const X0 = Math.min(...box.map((n) => n.x)) - 2, Y0 = Math.min(...box.map((n) => n.y)) - 2, X1 = Math.max(...box.map((n) => n.x + n.w)) + 2, Y1 = Math.max(...box.map((n) => n.y + n.h)) + 2;
// ---- carpets
const sk = (x, y) => (m.tiles[y * W + x] === TID.kpcarpet ? NAME[m.skin[y * W + x]] || 'keep_carpet' : null);
for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
  const s = sk(x, y); if (!s) continue;
  const q = /^([a-z]+)_(ns|ew)_(top|bot|mid\d)_(\d)/.exec(s);
  if (!q) continue;
  const [, , d, part] = q, ns = d === 'ns';
  const ahead = ns ? [[0, -1, 'top'], [0, 1, 'bot']] : [[1, 0, 'top'], [-1, 0, 'bot']];
  for (const [dx, dy, cap] of ahead) if (part !== cap && !sk(x + dx, y + dy) && isFloor(x + dx, y + dy) && !m.solid[(y + dy) * W + x + dx]) add(own(x, y), 'carpet end with no cap', x, y, s);
  const side = ns ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [dx, dy] of side) { const t = sk(x + dx, y + dy); if (t && new RegExp('_' + (ns ? 'ew' : 'ns') + '_').test(t)) add(own(x, y), 'runners crossing with no junction', x, y, s + ' | ' + t); }
}
// ---- things
const at = new Map(); const hangs = (sp) => /banner|pennant|garland/.test(sp);
for (const o of m.objects) {
  if (o.castleGate || o.gateLook || o.interact === 'weak' || o.enemy || o.castleMech || o.hidden || o.arch) continue;   // (an arch's pillar stands in the wall by design)
  const x = Math.floor(o.x), y = Math.floor(o.y); if (x < X0 || y < Y0 || x >= X1 || y >= Y1) continue;
  const t = m.tiles[y * W + x], room = own(x, y), key = y * W + x;
  if (at.has(key)) add(room, 'two things on one tile', x, y, o.sprite + ' + ' + at.get(key)); at.set(key, o.sprite);
  if (t === TID.kpwall || t === TID.kpwin || t === TID.kpwin2 || t === TID.void || t === TID.deep || t === TID.lava) add(room, 'a thing in a wall, water or lava', x, y, o.sprite);
  if (hangs(o.sprite)) { const a = m.tiles[(y - 1) * W + x]; if (a !== TID.kpwall && a !== TID.kpwin && a !== TID.kpwin2 && !/wall/.test(TILE_NAMES[a])) add(room, 'a hanging banner with no wall behind it', x, y, o.sprite); }
  if (o.solid && m.masterDoor && m.masterDoor(x, y)) add(room, 'a solid thing in a doorway', x, y, o.sprite);
}
// ---- floor shut off (every lock open; reached on foot from the West Entrance)
for (const L of C.locks) for (const o of C.gates[L.name] || []) { o.solid = false; m.solid[Math.floor(o.y) * W + Math.floor(o.x)] = 0; }
{
  const s = C.rooms.a24, seen = new Uint8Array(W * m.h); let st = -1; for (let y = s.y; y < s.y + s.h && st < 0; y++) for (let x = s.x; x < s.x + s.w; x++) if (!m.solid[y * W + x] && m.masterOwn(x, y) === 'entrance') { st = y * W + x; break; }
  const Q = [st]; seen[st] = 1; while (Q.length) { const i = Q.pop(); for (const j of [i + 1, i - 1, i + W, i - W]) if (!seen[j] && !m.solid[j]) { seen[j] = 1; Q.push(j); } }
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const i = y * W + x, r = m.masterOwn(x, y); if (r && !/^sec/.test(r) && isFloor(x, y) && !m.solid[i] && !seen[i]) add(r, 'floor shut off by things', x, y); }
}
// ---- bareness: things per hundred tiles of floor
const fl = {}, th = {};
for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) if (isFloor(x, y)) fl[own(x, y)] = (fl[own(x, y)] || 0) + 1;
for (const o of m.objects) { if (o.castleGate || o.gateLook || o.enemy || o.hidden) continue; const x = Math.floor(o.x), y = Math.floor(o.y); if (x < X0 || y < Y0 || x >= X1 || y >= Y1) continue; th[own(x, y)] = (th[own(x, y)] || 0) + 1; }
let total = 0;
const rows = Object.keys({ ...fl, ...R }).sort().map((r) => {
  const issues = Object.entries(R[r] || {}).map(([k, v]) => { total += v.length; return k + ' ' + v.length; });
  const dens = fl[r] ? (100 * (th[r] || 0)) / fl[r] : 0;
  return r.padEnd(12) + String(fl[r] || 0).padStart(6) + ' floor  ' + dens.toFixed(1).padStart(5) + ' things/100' + (dens < 1.2 && fl[r] > 60 ? '  BARE' : '') + (issues.length ? '  | ' + issues.join(', ') : '');
});
console.log(rows.join('\n'));
console.log('issues:', total);
if (LIST) for (const [r, K] of Object.entries(R)) for (const [k, v] of Object.entries(K)) console.log(r, k, v.slice(0, 6).map((q) => q.join(',')).join(' ; '));
