// Safe spots: is there anywhere a player can stand (or a lazy way to move) that a boss's attacks miss? Each modular boss
// but the Grand Orrery (it has its own: check_orrery_fairness) fights for 60 s, hit steadily so it goes through its
// phases, against: standing still in six places (its arena's middle, half-way out, its four edges), circling at the
// edge, and a reading player (sees every shot's motion, picks the clearest of 17 moves ten times a second).
// A passive way of playing that takes fewer than max(8, twice the reader's) hits is a safe spot.
//   node tools/check_boss_safespots.mjs [boss ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 41; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
let CLOCK = 1.7e12; Date.now = () => CLOCK;
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), SPEED = 6.3, TAU = Math.PI * 2;
function fight(id, strat) {
  RNG = 41; GR.seed(11); CLOCK = 1.7e12;
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.god = false; g.enter(BX[id].map || 'realm'); g.enemies.length = 0; g.command(`/bx ${id}`);
  const e = g.enemies.find((q) => q.D.bx === id), p = g.player;
  if (!e) return null;
  let hits = 0; const hurt = g.hurtPlayer.bind(g), why = (fight.why = {}); g.hurtPlayer = (d, by, x) => { if (by) { hits++; const k = (e.bx && e.bx.pat && e.bx.pat.name) || (e.bx && e.bx.state) || '?'; why[k] = (why[k] || 0) + 1; } return hurt(d, by, x); };
  const used = (fight.used = {});
  const A = e.room, cx = A ? A.x + A.w / 2 : e.x, cy = A ? A.y + A.h / 2 : e.y, Rr = A ? Math.min(A.w, A.h) / 2 - 1.5 : 9;
  const spots = { middle: [0, 0], half: [0.5, 0.3], north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  const prevPos = new Map(); let dir = [0, 0];
  const place = (x, y) => { p.x = x; p.y = y; g.unstick(p); };
  if (spots[strat]) place(cx + spots[strat][0] * Rr, cy + spots[strat][1] * Rr); else place(cx, cy + Rr * 0.6);
  let t = 0, a = 0;
  for (let f = 0; f < 60 * 60 && !e.dead; f++) {
    t += 1 / 60; p.hp = 1e9; p.dead = false; p.status.invuln = 0;
    if (strat === 'circle') { a += (4 / Rr) / 60; p.x += (cx + Math.cos(a) * Rr - p.x) * 0.3; p.y += (cy + Math.sin(a) * Rr - p.y) * 0.3; }
    if (strat === 'reader') {
      const vel = new Map();
      for (const b of g.projectiles) { if (b.from === 'p') continue; const q = prevPos.get(b); vel.set(b, q ? [(b.x - q[0]) * 60, (b.y - q[1]) * 60] : [b.vx, b.vy]); }
      prevPos.clear(); for (const b of g.projectiles) if (b.from !== 'p') prevPos.set(b, [b.x, b.y]);
      if (f % 6 === 0) {
        const near = g.projectiles.filter((b) => b.from !== 'p' && !b.harmless && !b.ghost && Math.abs(b.x - p.x) < 7 && Math.abs(b.y - p.y) < 7);
        let best = [0, 0], bs = 1e9;
        for (let k = -1; k < 16; k++) {
          const c = k < 0 ? [0, 0] : [Math.cos((k / 16) * TAU), Math.sin((k / 16) * TAU)];
          let sc = Math.hypot(c[0], c[1]) * 0.02;
          for (const T of [0.1, 0.2, 0.3, 0.45]) {
            const px = p.x + c[0] * SPEED * T, py = p.y - 0.45 + c[1] * SPEED * T;
            for (const b of near) { const v = vel.get(b) || [0, 0], d = Math.hypot(b.x + v[0] * T - px, b.y + v[1] * T - py); if (d < 1.1) sc += (1.1 - d) * (T < 0.25 ? 3 : 1); }
            const dc = Math.hypot(px - cx, py + 0.45 - cy); if (dc > Rr) sc += (dc - Rr) * 2;
            const db = Math.hypot(px - e.x, py + 0.45 - e.y); if (db < 2.5) sc += 2.5 - db;
            for (const fx of g.fx) if (fx.kind === 'laser' && !fx.hit && fx.t + T > fx.tele - 0.1 && fx.t + T < fx.tele + fx.act) { const dx = Math.cos(fx.a), dy = Math.sin(fx.a), u = Math.max(0, Math.min(fx.len, (px - fx.x0) * dx + (py - fx.y0) * dy)); if (Math.hypot(px - fx.x0 - dx * u, py - fx.y0 - dy * u) < 0.9) sc += 4; }
            for (const m of g.spMarks || []) if (m.kind === 'circle' && g.t + T > m.until - 0.3 && Math.hypot(px - m.x, py + 0.45 - m.y) < (m.r || 1) + 0.3) sc += 3;
          }
          if (sc < bs) { bs = sc; best = c; }
        }
        dir = best;
      }
      g.moveCircle(p, dir[0] * SPEED / 60, dir[1] * SPEED / 60, 0.32);
    }
    g.update(1 / 60);
    if (e.bx && e.bx.pat && e.bx.state === 'release') used[e.bx.pat.name] = (used[e.bx.pat.name] || 0) + 1;
    if (f % 10 === 0 && e.bx && !['death', 'morph', 'finale', 'deathhold'].includes(e.bx.state)) g.damageEnemy(e, Math.round(e.maxHp / 450), e.x, e.y, true);
  }
  return hits;
}
const STRATS = ['middle', 'half', 'north', 'south', 'east', 'west', 'circle', 'reader'];
let bad = 0;
for (const id of Object.keys(BX)) {
  if (id === 'grand_orrery' || id === 'framework_test' || (only.length && !only.includes(id))) continue;
  const r = {}, W = {}; for (const s of STRATS) { r[s] = fight(id, s); W[s] = fight.why; }
  if (process.argv.includes('--why')) { for (const s of STRATS) console.log('  ' + s.padEnd(7), JSON.stringify(W[s])); console.log('  attacks used:', JSON.stringify(fight.used)); }
  if (r.reader === null) { console.log(id, 'did not spawn'); continue; }
  const bar = Math.max(8, r.reader * 2), cheese = STRATS.filter((s) => s !== 'reader' && r[s] < bar);
  if (cheese.length) bad++;
  console.log(`${id.padEnd(21)} ${STRATS.map((s) => `${s} ${String(r[s]).padStart(3)}`).join('  ')}${cheese.length ? '   SAFE: ' + cheese.join(', ') : ''}`);
}
process.exit(bad ? 1 : 0);
