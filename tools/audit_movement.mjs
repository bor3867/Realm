// How every monster moves, measured: each type is set on you in the open while you circle it (12 s), and a group of 8
// of it is set on you too. Per type:
//   turn     how fast its heading swings (rad/s, averaged while it moves): high = twitchy
//   flips    sharp reversals (>100 degrees in a frame) per second: jitter
//   inout    switches between closing and backing off per second (radial speed changing sign): approach/retreat wobble
//   speed    its top speed over its listed speed (bursts like dives and charges are expected to exceed 1)
//   stuck    share of the time it wanted to reach you but made no progress over 1.5 s (walls, crowding; a hopper's or
//            skitterer's designed pauses don't count, since it still gets somewhere within 1.5 s)
//   (teleports, a jump of over 1.5 tiles in one frame, are left out of its speed)
//   stack    share of group frames with two of them overlapping by more than half their size
//   node tools/audit_movement.mjs [id ...]   --all to list every type, not only the outliers
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 9; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const { isSolid } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter('realm');
const p = g.player;
// an open patch of ground to test on (no walls within 10 tiles)
let home = null;
for (let k = 0; k < 20000 && !home; k++) {
  const x = 40 + Math.floor(Math.random() * (g.map.w - 80)), y = 40 + Math.floor(Math.random() * (g.map.h - 80));
  let ok = true; for (let dy = -10; dy <= 10 && ok; dy++) for (let dx = -10; dx <= 10 && ok; dx++) if (isSolid(g.map, x + dx + 0.5, y + dy + 0.5)) ok = false;
  if (ok) home = [x + 0.5, y + 0.5];
}
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), all = process.argv.includes('--all');
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function run(id, n) {
  g.enemies = g.map.enemies = []; g.projectiles = [];
  const [cx, cy] = home; p.x = cx; p.y = cy;
  const es = [];
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, e = g.addEnemy(id, cx + 7 + Math.cos(a) * 1.2, cy + Math.sin(a) * 1.2); if (e) { e.seen = true; es.push(e); } }
  if (!es.length) return null;
  const e = es[0], D = e.D, M = { turn: 0, flips: 0, inout: 0, top: 0, stuck: 0, moving: 0, stack: 0, frames: 0 };
  let prev = null, prevVr = 0, t = 0; const trail = [];
  for (let f = 0; f < 12 * 60; f++) {
    t += 1 / 60;
    const pa = t * 0.55; p.x = cx + Math.cos(pa) * 5; p.y = cy + Math.sin(pa) * 5; p.moving = true; p.hp = 1e9; p.dead = false;   // you circle at ~2.8 tiles/s
    g.enemies = g.map.enemies = g.enemies.filter((q) => es.includes(q) || q.parent);
    const x0 = e.x, y0 = e.y;
    g.update(1 / 60);
    if (e.dead) break;
    const vx = (e.x - x0) * 60, vy = (e.y - y0) * 60, v = Math.hypot(vx, vy);
    M.frames++; if (v < 1.5 * 60) M.top = Math.max(M.top, v);
    if (v > 0.3) {
      M.moving++;
      const h = Math.atan2(vy, vx);
      if (prev !== null) { const dh = Math.abs(ang(h - prev)); M.turn += dh * 60; if (dh > (100 * Math.PI) / 180) M.flips++; }
      prev = h;
      const rx = p.x - e.x, ry = p.y - e.y, rl = Math.hypot(rx, ry) || 1, vr = (vx * rx + vy * ry) / rl;
      if (Math.abs(vr) > 0.3) { if (prevVr && Math.sign(vr) !== Math.sign(prevVr)) M.inout++; prevVr = vr; }
    } else prev = null;
    const wants = D.speed > 0 && D.ai !== 'rooted' && Math.hypot(p.x - e.x, p.y - e.y) > (D.keep || 1.2) + 1.5 && e.state === 'move' && !e.under;
    trail.push([e.x, e.y]); if (trail.length > 90) trail.shift();
    if (wants && trail.length === 90 && Math.hypot(e.x - trail[0][0], e.y - trail[0][1]) < D.speed * 0.25) M.stuck++;
    if (n > 1) { let hit = false; for (let i = 0; i < es.length && !hit; i++) for (let j = i + 1; j < es.length && !hit; j++) { const a = es[i], b = es[j]; if (!a.dead && !b.dead && Math.hypot(a.x - b.x, a.y - b.y) < (a.D.r + b.D.r) * 0.5) hit = true; } if (hit) M.stack++; }
  }
  const s = M.frames / 60;
  return { id, ai: D.ai, speed: D.speed, turn: M.moving ? M.turn / M.moving : 0, flips: M.flips / s, inout: M.inout / s, over: D.speed ? M.top / D.speed : 0, stuck: M.frames ? M.stuck / M.frames : 0, stack: M.frames ? M.stack / M.frames : 0 };
}
const rows = [];
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.bx || D.rb || D.dummy || !(D.speed > 0) || (only.length && !only.includes(id))) continue;
  const one = run(id, 1), grp = run(id, 8);
  if (!one) continue;
  rows.push({ ...one, stack: grp ? grp.stack : 0, stuck: Math.max(one.stuck, grp ? grp.stuck : 0) });
}
const BURSTS = new Set(['swoop', 'charge', 'hop', 'skitter', 'burrow', 'blink']);
const flag = (r) => [r.turn > 6 ? 'twitchy' : '', r.flips > 0.6 ? 'jitters' : '', r.inout > 0.8 ? 'wobbles in/out' : '', r.over > (BURSTS.has(r.ai) ? 4 : 1.6) ? 'too fast' : '', r.stuck > 0.15 ? 'gets stuck' : '', r.stack > 0.25 ? 'stacks' : ''].filter(Boolean);
console.log('id'.padEnd(22) + 'ai'.padEnd(10) + 'turn  flips inout  speed stuck stack');
const byAi = {};
for (const r of rows) {
  const f = flag(r); (byAi[r.ai] = byAi[r.ai] || []).push(f);
  if (all || f.length) console.log(r.id.padEnd(22) + r.ai.padEnd(10) + [r.turn.toFixed(1).padStart(4), r.flips.toFixed(2).padStart(5), r.inout.toFixed(2).padStart(5), r.over.toFixed(1).padStart(6), (r.stuck * 100).toFixed(0).padStart(4) + '%', (r.stack * 100).toFixed(0).padStart(4) + '%'].join(' ') + (f.length ? '   ' + f.join(', ') : ''));
}
console.log(`\n${rows.length} monster types measured; by movement style (types flagged / total):`);
for (const [ai, L] of Object.entries(byAi)) {
  const c = {}; for (const f of L) for (const x of f) c[x] = (c[x] || 0) + 1;
  console.log(`  ${ai.padEnd(10)} ${String(L.filter((f) => f.length).length).padStart(2)}/${String(L.length).padEnd(3)} ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
