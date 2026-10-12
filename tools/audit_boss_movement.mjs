// How the modular bosses move (every one but the Grand Orrery, which is left as it is): each fights you for 90 s while
// you circle it and hit it steadily (so it goes through its phases).
//   jerks    instant starts, stops and turns per minute (acceleration over 40 tiles/s^2 in a frame)
//   top      its top speed (tiles/s)
//   flips    hard reversals per minute (its heading turning over 120 degrees in one frame while it moves)
//   snaps    jumps of over a tile in one frame (teleports; fine only where they are part of a move)
//   still    share of the time it stands still
//   node tools/audit_boss_movement.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 31; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
for (const id of Object.keys(BX)) {
  if (id === 'grand_orrery' || id === 'framework_test' || (only.length && !only.includes(id))) continue;
  RNG = 31; GR.seed(9);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter(BX[id].map || 'realm'); g.enemies.length = 0; g.command(`/bx ${id}`);
  const e = g.enemies.find((q) => q.D.bx === id), p = g.player;
  if (!e) { console.log(id, 'did not spawn'); continue; }
  const acc = []; let top = 0, prev = null, flips = 0, snaps = 0, still = 0, n = 0, t = 0, prevH = null;
  for (let f = 0; f < 90 * 60 && !e.dead; f++) {
    t += 1 / 60; p.hp = 1e9; p.dead = false;
    p.x = e.x + Math.cos(t * 0.6) * 7; p.y = e.y + Math.sin(t * 0.6) * 6;
    const x0 = e.x, y0 = e.y;
    g.update(1 / 60);
    if (f % 10 === 0 && e.bx && !['death', 'morph', 'finale', 'deathhold'].includes(e.bx.state)) g.damageEnemy(e, Math.round(e.maxHp / 700), e.x, e.y, true);
    const dx = e.x - x0, dy = e.y - y0, jump = Math.hypot(dx, dy);
    if (jump > 1) { snaps++; prev = null; prevH = null; continue; }
    const vx = dx * 60, vy = dy * 60, v = Math.hypot(vx, vy);
    if (prev) acc.push(Math.hypot(vx - prev[0], vy - prev[1]) * 60);
    prev = [vx, vy]; n++; top = Math.max(top, v);
    if (v < 0.05) still++;
    if (v > 0.5) { const h = Math.atan2(vy, vx); if (prevH !== null && Math.abs(ang(h - prevH)) > (120 * Math.PI) / 180) flips++; prevH = h; } else prevH = null;
  }
  acc.sort((a, b) => a - b);
  const mins = n / 3600;
  console.log(`${id.padEnd(22)} jerks/min ${(acc.filter((a) => a > 40).length / mins).toFixed(1).padStart(5)}  top ${top.toFixed(1).padStart(4)}  flips/min ${(flips / mins).toFixed(1).padStart(5)}  snaps ${String(snaps).padStart(3)}  still ${((still / n) * 100).toFixed(0).padStart(3)}%`);
}
