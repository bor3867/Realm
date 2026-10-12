// Monsters find their way round walls to you. In every dungeon: pairs of open spots 5-9 tiles apart with a wall
// between them (no straight line through), but a walkable way round of at most 30 tiles. A monster that has seen you
// (one whose aggro reaches that far) stands at one, you at the other, standing still. It should come round and reach you (get within its fighting
// distance) and never stand stalled for long. Walkers that chase are used (shamble, flank, zigzag, kite, swoop,
// orbit), since flyers and burrowers go their own way.
//   node tools/check_navigation.mjs [dungeon ...]    --verbose for every chase
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let CLOCK = 1.7e12; Date.now = () => CLOCK;                      // (dungeons are generated from the clock: pinned, so a run repeats)
let RNG = 13; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES, DUNGEONS } = await import('../src/data/enemies.js');
const { isSolid, TID } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const WALKERS = ['shamble', 'flank', 'zigzag', 'kite', 'swoop', 'orbit'];
const pool = Object.entries(ENEMIES).filter(([, D]) => WALKERS.includes(D.ai) && !D.fly && !D.noclip && !D.bx && !D.rb && !D.dummy && D.speed > 0 && !D.leash).map(([id]) => id);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), verbose = process.argv.includes('--verbose');
// the length of the walkable route (4-connected tiles) between two points, or -1
function route(m, a, b, max = 30) {
  const dist = new Int16Array(m.w * m.h).fill(-1), q = [Math.floor(a[1]) * m.w + Math.floor(a[0])], goal = Math.floor(b[1]) * m.w + Math.floor(b[0]);
  dist[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h]; if (i === goal) return dist[i];
    if (dist[i] >= max) continue;
    const x = i % m.w, y = (i / m.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = ny * m.w + nx; if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && dist[j] < 0 && !isSolid(m, nx + 0.5, ny + 0.5) && !(m.hasVoid && m.tiles[j] === TID.asvoid)) { dist[j] = dist[i] + 1; q.push(j); } }
  }
  return -1;
}
const sight = (m, a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s2 = 0; s2 <= d; s2 += 0.25) if (isSolid(m, a[0] + ((b[0] - a[0]) * s2) / d, a[1] + ((b[1] - a[1]) * s2) / d)) return false; return true; };
const open = (m, x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isSolid(m, x + dx, y + dy) || (m.hasVoid && m.tiles[Math.floor(y + dy) * m.w + Math.floor(x + dx)] === TID.asvoid)) return false; return true; };   // (floor, not the void)
const rows = [];
for (const where of Object.keys(DUNGEONS)) {
  if (only.length && !only.includes(where)) continue;
  RNG = 13 + Object.keys(DUNGEONS).indexOf(where) * 101; CLOCK = 1.7e12 + Object.keys(DUNGEONS).indexOf(where) * 1000;           // (each dungeon its own seed: run one alone and it is the same chase)
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter(where);
  const m = g.map, p = g.player, pairs = [];
  for (let k = 0; k < 40000 && pairs.length < 4; k++) {
    const ax = 2 + Math.floor(Math.random() * (m.w - 4)) + 0.5, ay = 2 + Math.floor(Math.random() * (m.h - 4)) + 0.5;
    if (!open(m, ax, ay)) continue;
    const an = Math.random() * Math.PI * 2, dd = 5 + Math.random() * 4, bx = Math.floor(ax + Math.cos(an) * dd) + 0.5, by = Math.floor(ay + Math.sin(an) * dd) + 0.5;
    if (!open(m, bx, by) || sight(m, [ax, ay], [bx, by])) continue;
    const L = route(m, [ax, ay], [bx, by]); if (L < 0) continue;
    pairs.push([[ax, ay], [bx, by], L]);
  }
  for (const [A, Bp, L] of pairs) {
    const dAB = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
    let id = pool[(rows.length * 7) % pool.length];                 // a monster whose aggro reaches you (it would notice you)
    for (let k = 1; ENEMIES[id].aggro < dAB + 1 && k < pool.length; k++) id = pool[(rows.length * 7 + k) % pool.length];
    const D = ENEMIES[id];
    g.enemies = g.map.enemies = []; g.projectiles = [];
    p.x = Bp[0]; p.y = Bp[1];
    const e = g.addEnemy(id, A[0], A[1]); if (!e) continue; e.seen = true;
    const reach = (D.keep || 1.2) + 2.5, start = Math.hypot(e.x - p.x, e.y - p.y);
    let t = 0, got = null, stall = 0, worstStall = 0, last = [e.x, e.y], lastT = 0;
    for (let f = 0; f < 60 * 25 && got === null; f++) {
      t += 1 / 60; p.hp = 1e9; p.dead = false;
      g.enemies = g.map.enemies = g.enemies.filter((q) => q === e);
      g.update(1 / 60);
      if (e.dead) break;
      if (Math.hypot(e.x - p.x, e.y - p.y) < reach) got = t;
      if ((process.env.TRACE === id || process.env.TRACE === '*') && f % 60 === 0) console.log(t.toFixed(1), e.state, 'sees', g.seesFoe(e, p), 'step', JSON.stringify(g.flowStep(e)), 'at', e.x.toFixed(1), e.y.toFixed(1), 'cd', (e.cds || []).map((c) => c.toFixed(1)).join('/'));
      if (t - lastT >= 1) { const moved = Math.hypot(e.x - last[0], e.y - last[1]); if (moved < 0.3) stall += 1; else stall = 0; worstStall = Math.max(worstStall, stall); last = [e.x, e.y]; lastT = t; }
    }
    rows.push({ where, id, ai: D.ai, start, path: L, got, worstStall });
  }
}
const bad = rows.filter((r) => r.got === null || r.worstStall >= 3);
for (const r of verbose ? rows : bad) console.log(`${r.where.padEnd(11)} ${r.id.padEnd(22)} ${r.ai.padEnd(8)} ${r.start.toFixed(0)} tiles away, ${r.path} round: ${r.got === null ? 'NEVER reached you in 25 s' : `reached you in ${r.got.toFixed(1)} s`}${r.worstStall >= 2 ? `, stalled ${r.worstStall} s` : ''}`);
const ok = rows.filter((r) => r.got !== null);
console.log(`${rows.length} chases round a wall in ${new Set(rows.map((r) => r.where)).size} dungeons: ${ok.length} reached you (median ${(ok.map((r) => r.got).sort((a, b) => a - b)[ok.length >> 1] || 0).toFixed(1)} s); ${bad.length} failed or stalled 3 s or more`);
process.exit(bad.length ? 1 : 0);
