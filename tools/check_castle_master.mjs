// Sunthief's Castle as the game builds it from its fixed footprint (2026-11-05 rebuild, stage B: "Run pathfinding tests.
// Verify that the mandatory route works in the exact intended order"). Builds the real map, then walks it on foot (the
// game's own solid tiles, its gates shut) one lock at a time, in the route's order, and checks at each stage exactly
// which rooms can be reached; that no secret chamber can be reached until its cracked wall breaks, and each can after;
// that every open tile of the castle is reachable in the end; that every lock's gate fills its doorway; that the eclipse
// is reached by its portal only.
//   node tools/check_castle_master.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const root = new URL('../', import.meta.url);
const { buildRegistry } = await import(new URL('src/registry.js', root));
const { Game } = await import(new URL('src/game.js', root));
const { WORLD } = await import(new URL('src/world/castle_master.js', root));
const B0 = new URL('art/bundle/', root), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((q) => ({ pack: q.split('/')[0], json: J(q) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.mode = 'play'; g.enter('throne', { seed: 4 });
const m = g.map, C = m.castle, W = m.w, M = m.master, R = C.rooms;
let fails = 0; const ok = (cond, what) => { console.log((cond ? 'ok   ' : 'FAIL ') + what); if (!cond) fails++; };
// which master room each tile is (by the footprint's own owner map)
const roomAt = (i) => { const x = (i % W) - WORLD[0], y = Math.floor(i / W) - WORLD[1]; if (x < 0 || y < 0 || x >= M.w || y >= M.h) return null; const k = M.owner[y * M.w + x]; return k < 0 ? null : M.parts[k]; };
const numOf = Object.fromEntries(Object.values(R).filter((n) => n.master).map((n) => [n.master, n.num]));
const flood = () => { const s = R.a19, seen = new Uint8Array(W * m.h); let st = -1; for (let y = s.y; y < s.y + s.h && st < 0; y++) for (let x = s.x; x < s.x + s.w; x++) if (!m.solid[y * W + x]) { st = y * W + x; break; } const Q = [st]; seen[st] = 1; while (Q.length) { const i = Q.pop(); for (const j of [i + 1, i - 1, i + W, i - W]) if (!seen[j] && !m.solid[j]) { seen[j] = 1; Q.push(j); } } return seen; };
const reached = (seen) => { const set = new Set(); for (let i = 0; i < seen.length; i++) if (seen[i]) { const p = roomAt(i); if (p) set.add(p.kind === 'secret' ? p.id : numOf[p.id]); } return set; };
const open = (name) => { const L = C.locks.find((q) => q.name === name); L.open = true; for (const o of C.gates[name] || []) { o.solid = false; m.solid[Math.floor(o.y) * W + Math.floor(o.x)] = 0; } };
const sorted = (s) => [...s].filter((q) => typeof q === 'number').sort((a, b) => a - b).join(' ');
const WEST = [24, 23, 53, 70, 71, 33], MID = [25, 27, 62, 72, 37, 60, 20, 30, 78, 28, 64, 77, 61, 21, 63, 43, 73, 29, 74, 31, 76, 26, 75], NORTH1 = [42, 45], NORTH2 = [46], NORTH3 = [47];
const stage = (name, want) => { const got = reached(flood()), w = new Set(want); ok(sorted(got) === sorted(w), name + ': the rooms reached are exactly ' + sorted(w) + (sorted(got) === sorted(w) ? '' : '  (got ' + sorted(got) + ')')); ok(![...got].some((q) => typeof q === 'string'), name + ': no secret chamber reached'); };
console.log('locks:', C.locks.map((L) => L.name + ' (' + (C.gates[L.name] || []).length + ' gate tiles)').join(', '));
for (const L of C.locks) ok((C.gates[L.name] || []).length > 0, 'the lock ' + L.name + ' has a gate across its doorway');
open('7-8'); open('19-24');
stage('the way in (the West Entrance and the Drawbridge Guard; the guard\'s doors shut)', WEST);
open('23-60'); open('23-25'); open('23-30'); stage('the Drawbridge Guard beaten (all three of its doors open): the castle to the Jarls, the north gate shut', [...WEST, ...MID]);
open('28-42'); stage('the Jarls fallen: the chain hall and the forge antechamber, Ashkar\'s seal shut', [...WEST, ...MID, ...NORTH1]);
open('45-46'); stage('the seal opened: Ashkar\'s arena, the keep shut', [...WEST, ...MID, ...NORTH1, ...NORTH2]);
open('46-47'); stage('Ashkar fallen: the North Keep', [...WEST, ...MID, ...NORTH1, ...NORTH2, ...NORTH3]);
// every open tile of the castle reached in the end (the secret chambers aside)
{ const seen = flood(); let bad = 0, where = null; for (let i = 0; i < seen.length; i++) { const p = roomAt(i); if (p && p.kind !== 'secret' && !m.solid[i] && !seen[i] && m.tiles[i] !== 38) { bad++; where = where || [i % W, Math.floor(i / W), p.id]; } } ok(bad === 0, 'every open tile of the castle\'s rooms reachable at the end' + (bad ? ' (' + bad + ' not, e.g. ' + where + ')' : '')); }
// the secret chambers: shut until each cracked wall breaks, open after
for (const s of m.secrets) {
  const wk = m.objects.find((o) => o.interact === 'weak' && Math.floor(o.x) === s.plug.x && Math.floor(o.y) === s.plug.y);
  ok(!!wk, s.title + ': a cracked wall at its door (' + s.plug.x + ',' + s.plug.y + ')');
  if (!wk) continue; wk.solid = false; m.solid[s.plug.y * W + s.plug.x] = 0;
  const got = reached(flood()), id = roomAt(s.y * W + s.x + 1) || roomAt((s.y + 1) * W + s.x + 1);
  ok(id && got.has(id.id), s.title + ': reached once its wall breaks (off ' + (s.from && s.from.title) + ')');
  wk.solid = true; m.solid[s.plug.y * W + s.plug.x] = 1;
  ok(s.veilIdx && s.veilIdx.length > 20, s.title + ': veiled until found (' + (s.veilIdx || []).length + ' tiles)');
}
// the eclipse by its portal only
{ const seen = flood(); ok(!['a48', 'a49', 'a50', 'a51', 'a52'].some((k) => { const n = R[k]; return seen[n.cy * W + n.cx]; }), 'the eclipse is not walkable from the castle (the Sun Gate\'s portal only)'); }
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
