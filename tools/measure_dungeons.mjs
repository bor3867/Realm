// How each dungeon plays out on the ground, over a few seeds (2026-10-31, the polish audit: "eliminate empty stretches,
// repetitive rooms and excessive backtracking"). For each: its floor, monsters and things to look at per 100 floor
// tiles; the walk from the entrance to the boss (and how much longer it is than the straight line); the longest stretch
// of that walk with no monster within 5 tiles; how much of the floor is dead-end corridor; and how alike two of its
// seeds are (the share of floor tiles they have in common: near 100% means it is the same map every time).
//   node tools/measure_dungeons.mjs [dungeon ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Date.now = () => 1.7e12;
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const { R: GR } = await import('../src/util.js');
const { TID } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2);
const SEEDS = [11, 222, 3333];

function look(id, seed) {
  RNG = seed; GR.seed(seed);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {};
  g.enter(id, { seed });
  const m = g.map, W = m.w, H = m.h, solid = (i) => (m.solid ? m.solid[i] : 0) || (m.hasVoid && m.tiles[i] === TID.asvoid);   // (the Observatory's void sends you back: no road)
  const floor = new Uint8Array(W * H);
  let nf = 0;
  for (let i = 0; i < W * H; i++) if (!solid(i) && m.tiles[i] !== undefined && m.tiles[i] !== 0) { floor[i] = 1; nf++; }
  const p = g.player, start = Math.floor(p.y) * W + Math.floor(p.x);
  const boss = g.enemies.find((e) => e.rb || (e.D && e.D.bx));
  // walk: breadth-first from the entrance
  const dist = new Int32Array(W * H).fill(-1), prev = new Int32Array(W * H).fill(-1), q = [start];
  dist[start] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, j = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || dist[j] >= 0 || solid(j)) continue;
      dist[j] = dist[i] + 1; prev[j] = i; q.push(j);
    }
  }
  const reach = q.length;
  let walk = null, ratio = null, gap = null;
  if (boss) {
    let bi = Math.floor(boss.y) * W + Math.floor(boss.x);
    if (dist[bi] < 0) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2]]) { const j = bi + dy * W + dx; if (dist[j] >= 0) { bi = j; break; } }
    if (dist[bi] >= 0) {
      walk = dist[bi]; ratio = walk / Math.max(1, Math.hypot(boss.x - p.x, boss.y - p.y));
      // the longest run of the path with nothing within 5 tiles (the boss's own room excepted)
      const foes = [...g.enemies.filter((e) => e !== boss && !e.dead), ...(m.rooms || []).flatMap((rm) => (rm.pending || []).map(([, x, y]) => ({ x, y })))];   // (an ambush room's band counts: it waits for you there)
      let run = 0; gap = 0;
      for (let i = prev[bi]; i >= 0; i = prev[i]) {
        const x = i % W, y = (i / W) | 0;
        if (foes.some((e) => (e.x - x) ** 2 + (e.y - y) ** 2 < 25)) run = 0; else gap = Math.max(gap, ++run);
      }
    }
  }
  // dead ends: floor tiles with only one open neighbour, followed back while the corridor stays one wide
  let dead = 0;
  const open = (i) => i >= 0 && i < W * H && dist[i] >= 0;
  const nb = (i) => [i + 1, i - 1, i + W, i - W].filter(open);
  const seenDead = new Uint8Array(W * H);
  for (const i of q) {
    if (nb(i).length !== 1 || seenDead[i]) continue;
    let c = i, from = -1;
    while (!seenDead[c]) { seenDead[c] = 1; dead++; const n = nb(c).filter((j) => j !== from); if (n.length !== 1 || nb(c).length > 2) break; from = c; c = n[0]; }
  }
  const decor = (m.decor || []).length + (m.objects || []).length;
  return { W, H, nf: reach, mon: g.enemies.filter((e) => !e.dead && e !== boss).length, decor, walk, ratio, gap, dead, floor, boss: !!boss };
}

const rows = [];
for (const id of Object.keys(DUNGEONS)) {
  if (only.length && !only.includes(id)) continue;
  let L;
  try { L = SEEDS.map((s) => look(id, s)); } catch (err) { rows.push(`${id.padEnd(12)} could not be built: ${err.message}`); continue; }
  const a = L[0], b = L[1];
  let both = 0, either = 0;
  if (a.W === b.W && a.H === b.H) for (let i = 0; i < a.floor.length; i++) { if (a.floor[i] && b.floor[i]) both++; if (a.floor[i] || b.floor[i]) either++; }
  const same = either ? Math.round((100 * both) / either) + '%' : 'n/a';
  const avg = (k) => { const v = L.map((r) => r[k]).filter((x) => x !== null && x !== undefined); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN; };
  const per = (k) => ((100 * avg(k)) / avg('nf')).toFixed(1);
  rows.push(`${id.padEnd(12)} floor ${String(Math.round(avg('nf'))).padStart(5)}  monsters/100 ${per('mon').padStart(5)}  things/100 ${per('decor').padStart(5)}  walk ${String(Math.round(avg('walk'))).padStart(4)} (x${avg('ratio').toFixed(1)})  empty run ${String(Math.round(avg('gap'))).padStart(3)}  dead-end ${String(Math.round((100 * avg('dead')) / avg('nf'))).padStart(2)}%  seeds alike ${same}${a.boss ? '' : '  (no boss on the map at the start)'}`);
}
console.log(rows.join('\n'));
