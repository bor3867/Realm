// Is the Grand Orrery hard but fair? Three players fight every section of it (each phase for 30 s, the Singularity,
// the last stand, the Supernova), on the same seed:
//   expert   sees every shot's motion (its velocity this frame, steered formations included) and, ten times a second,
//            picks the move (16 directions or still, at 6.3 tiles/s, a little under a fast endgame character) that keeps
//            it clear of everything for the next 0.45 s, staying on the floor; it never shoots, so it never "cheeses"
//   strafer  circles the machine at a steady pace (a player who keeps moving but doesn't read the pattern)
//   still    stands where it is (a player who doesn't dodge)
// Fair: the expert gets through every section nearly untouched (there is always a way). Hard: the strafer and the
// still player are cut down. Reports hits per section for each.
//   node tools/check_orrery_fairness.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game, HITBOX } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const SPEED = 6.3, TAU = Math.PI * 2;

function setup(seed) {
  let s = seed; Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);   // the same fight every time
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.enter('astral');
  const m = g.map, L = m.rooms[m.rooms.length - 1], p = g.player;
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  const o = g.enemies.find((e) => e.D.bx === 'grand_orrery');
  let hits = 0;
  const hurt = g.hurtPlayer.bind(g);
  const tally = {};
  g.hurtPlayer = (d, by, x) => { if (by) { hits++; const S = o.bx || {}, k = (S.sing ? 'sing:' + S.sing.stage : S.nova2 ? 'nova:' + (S.nova2.kind || 'horizon') : S.pat ? S.pat.name : S.state) + ' / ' + by; tally[k] = (tally[k] || 0) + 1; } hurt(d, by, x); };
  p.x = L.cx + 0.5; p.y = L.cy + 8;
  for (let k = 0; k < 60 * 4; k++) { p.hp = 1e9; g.update(1 / 60); }
  return { g, o, L, p, tally, hits: () => hits, reset: () => { hits = 0; } };
}
// the three players' moves (called every frame; they move the player themselves)
function mover(kind, F) {
  const { g, o, L, p } = F, cx = L.cx + 0.5, cy = L.cy + 0.5;
  let t = 0, dir = [0, 0];
  const prev = new Map();
  return (dt) => {
    t += dt;
    if (kind === 'still') return;
    if (kind === 'strafer') { const a = Math.atan2(p.y - cy, p.x - cx) + (SPEED * 0.7 / 8) * dt, r = 8; p.x += (cx + Math.cos(a) * r - p.x) * 0.2; p.y += (cy + Math.sin(a) * r - p.y) * 0.2; return; }
    // the expert: every shot's velocity from its last two positions (steered shots too); pick the clearest move
    const vel = new Map();
    for (const b of g.projectiles) { if (b.from === 'p') continue; const q = prev.get(b); vel.set(b, q ? [(b.x - q[0]) / dt, (b.y - q[1]) / dt] : [b.vx, b.vy]); }
    prev.clear(); for (const b of g.projectiles) if (b.from !== 'p') prev.set(b, [b.x, b.y]);
    if (Math.round(t * 60) % 6 === 0) {
      const cands = [[0, 0]]; for (let k = 0; k < 16; k++) cands.push([Math.cos((k / 16) * TAU), Math.sin((k / 16) * TAU)]);
      let best = null, bs = 1e9;
      const near = g.projectiles.filter((b) => b.from !== 'p' && !b.harmless && !b.ghost && Math.abs(b.x - p.x) < 7 && Math.abs(b.y - p.y) < 7);
      for (const c of cands) {
        let score = 0;
        for (const T of [0.1, 0.2, 0.3, 0.45]) {
          const px = p.x + c[0] * SPEED * T, py = p.y - 0.45 + c[1] * SPEED * T;
          for (const b of near) { const v = vel.get(b) || [0, 0], bx = b.x + v[0] * T, by = b.y + v[1] * T, d = Math.hypot(bx - px, by - py); if (d < 1.1) score += (1.1 - d) * (T < 0.25 ? 3 : 1); }
          const dc = Math.hypot(px - cx, py + 0.45 - cy); if (dc > 14) score += (dc - 14) * 2;          // stay on the floor
          if (o.bx) { const db = Math.hypot(px - o.x, py + 0.45 - o.y); if (db < 2.5) score += 2.5 - db; }   // not in the machine
          for (const W of (o.bx && o.bx.wells) || []) { const dw = Math.hypot(px - W.x, py + 0.45 - W.y); if (dw < 1.6) score += 3; }
          const U = o.bx && o.bx.umbra; if (U && U.r > 1 && Math.hypot(px - U.x, py + 0.45 - U.y) < U.r) score += 2;
          const Z = o.bx && o.bx.sing; if (Z && Math.hypot(px - Z.x, py + 0.45 - Z.y) < Z.r + 0.6) score += 3;
          for (const f of g.fx) if (f.kind === 'laser' && !f.hit && f.t + T > f.tele - 0.1 && f.t + T < f.tele + f.act) {   // a marked beam: out of its line before it burns
            const dx = Math.cos(f.a), dy = Math.sin(f.a), u = Math.max(0, Math.min(f.len, (px - f.x0) * dx + (py - f.y0) * dy));
            if (Math.hypot(px - f.x0 - dx * u, py - f.y0 - dy * u) < 0.9) score += 4;
          }
        }
        score += Math.hypot(c[0], c[1]) * 0.02;                  // (a tie goes to standing still)
        if (score < bs) { bs = score; best = c; }
      }
      dir = best;
    }
    g.moveCircle(p, dir[0] * SPEED * dt, dir[1] * SPEED * dt, 0.32);
  };
}
// --nova: the Supernova alone, against every way of not really playing it: standing still (in the middle, half-way out,
// against the back wall), camping the rim, circling, and the expert, from several places and on two seeds
// --sing: the same, against the Singularity
if (process.argv.includes('--nova') || process.argv.includes('--sing')) {
  const FIN = process.argv.includes('--sing') ? 'finale' : 'finale2', LABEL = FIN === 'finale' ? 'Singularity' : 'Supernova';
  const rows = [];
  for (const seed of [4242, 917]) {
    const strategies = [
      ['still, centre', 'still', 0, 5], ['still, mid', 'still', 1.2, 10], ['still, back wall', 'still', Math.PI / 2, 15], ['still, left wall', 'still', Math.PI, 15],
      ['still, right wall', 'still', 0, 15], ['still, front wall', 'still', -Math.PI / 2, 15], ['camp rim (sidles)', 'camp', Math.PI / 2, 15.5],
      ['circle r13 slow', 'circle', 0, 13, 3], ['circle r13 fast', 'circle', 0, 13, 6], ['circle r8', 'circle', 0, 8, 5], ['expert', 'expert', Math.PI / 2, 10],
    ];
    for (const [name, kind, ang, rad, sp] of strategies) {
      const F = setup(seed), { g, o, L, p } = F, cx = L.cx + 0.5, cy = L.cy + 0.5;
      const toFight = () => { for (let k = 0; k < 60 * 12 && !['fight', 'windup', 'release', 'recover'].includes(o.bx.state); k++) { p.hp = 1e9; g.update(1 / 60); } };
      g.damageEnemy(o, Math.ceil(o.maxHp * 0.34) + 50, o.x, o.y, true); toFight();
      g.damageEnemy(o, Math.ceil(o.maxHp * 0.34) + 50, o.x, o.y, true); toFight();
      g.projectiles = []; if (FIN === 'finale2') o.bx.finaleDone = true; o.hp = o.maxHp * (FIN === 'finale' ? 0.11 : 0.035); g.bxStartFinale(o, o.bx.B[FIN]);
      p.x = cx + Math.cos(ang) * rad; p.y = cy + Math.sin(ang) * rad;
      const ex = kind === 'expert' ? mover('expert', F) : null;
      let a = ang, side = 1; F.reset();
      for (let k = 0; k < 60 * (o.bx.B[FIN].dur + 0.5); k++) {
        p.hp = 1e9; p.dead = false; p.status.invuln = 0;
        if (kind === 'circle') { a += (sp / rad) / 60; p.x += (cx + Math.cos(a) * rad - p.x) * 0.3; p.y += (cy + Math.sin(a) * rad - p.y) * 0.3; }
        if (kind === 'camp' && k % 120 === 0) side = -side;         // the camper shuffles along the wall a little, back and forth
        if (kind === 'camp') { a += side * 0.6 / 60 / rad * 3; p.x += (cx + Math.cos(a) * rad - p.x) * 0.3; p.y += (cy + Math.sin(a) * rad - p.y) * 0.3; }
        if (ex) ex(1 / 60);
        g.update(1 / 60);
      }
      rows.push([seed, name, F.hits()]);
      if ((kind === 'expert' || process.argv.includes('--whyall')) && process.argv.includes('--why')) console.log('  ' + name + ' (seed ' + seed + ') was hit in:', Object.entries(F.tally).sort((x, y) => y[1] - x[1]).map(([k2, v]) => k2.split(' / ')[0] + ' ' + v).join(', '));
    }
  }
  const by = {};
  for (const [, n, h] of rows) (by[n] = by[n] || []).push(h);
  console.log(LABEL + ' hits (seed 4242 / seed 917):');
  for (const [n, hs] of Object.entries(by)) console.log('  ' + n.padEnd(20) + hs.map((h) => String(h).padStart(5)).join(''));
  const exp = Math.max(...by.expert), lazy = Object.entries(by).filter(([n]) => n !== 'expert').map(([n, hs]) => [n, Math.min(...hs)]);
  const cheese = lazy.filter(([, h]) => h < Math.max(12, exp * 2));
  console.log(cheese.length ? 'CHEESABLE: ' + cheese.map(([n, h]) => `${n} (${h})`).join(', ') : `no cheese: every passive strategy takes at least ${Math.min(...lazy.map(([, h]) => h))} hits; the expert at most ${exp}`);
  process.exit(cheese.length ? 1 : 0);
}
const SECTIONS = ['phase 1', 'phase 2', 'phase 3', 'singularity', 'last stand', 'supernova'];
const results = {};
for (const kind of ['expert', 'strafer', 'still']) {
  const F = setup(4242), { g, o, p } = F, move = mover(kind, F), row = {};
  const run = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e9; p.dead = false; p.status.invuln = 0; move(1 / 60); g.update(1 / 60); } };
  const toFight = () => { for (let k = 0; k < 60 * 12 && !['fight', 'windup', 'release', 'recover'].includes(o.bx.state); k++) { p.hp = 1e9; move(1 / 60); g.update(1 / 60); } };
  const section = (name, sec, prep) => { if (prep) prep(); F.reset(); run(sec); row[name] = F.hits(); };
  section('phase 1', 30);
  g.damageEnemy(o, Math.ceil(o.maxHp * 0.34) + 50, o.x, o.y, true); toFight();
  section('phase 2', 30);
  g.damageEnemy(o, Math.ceil(o.maxHp * 0.34) + 50, o.x, o.y, true); toFight();
  section('phase 3', 30);
  g.damageEnemy(o, Math.max(1, o.hp - o.maxHp * 0.11), o.x, o.y, true);
  section('singularity', o.bx.B.finale.dur + 0.5);
  toFight(); section('last stand', 15);
  g.damageEnemy(o, Math.max(1, o.hp - o.maxHp * 0.03), o.x, o.y, true);
  section('supernova', o.bx.B.finale2.dur + 0.5);
  results[kind] = row;
  if (kind === 'expert' && process.argv.includes('--why')) console.log('expert was hit by:', Object.entries(F.tally).sort((x, y) => y[1] - x[1]).slice(0, 12));
}
console.log('hits per section (one hit = one shot or hazard that touched you)');
console.log('section'.padEnd(13) + ['expert', 'strafer', 'still'].map((k) => k.padStart(9)).join(''));
let unfair = [];
for (const s of SECTIONS) {
  console.log(s.padEnd(13) + ['expert', 'strafer', 'still'].map((k) => String(results[k][s]).padStart(9)).join(''));
  const E = results.expert[s], H = Math.max(results.strafer[s], results.still[s]);
  // fair: the reading player is hit at most about once every two seconds, and far less than a careless one (the
  // bot reads motion but not intent, so it takes a few hits a real expert who knows the patterns would not)
  const secs = { 'phase 1': 30, 'phase 2': 30, 'phase 3': 30, 'last stand': 15 }[s] || 25;
  if (E > secs / 2 || E > H * 0.3) unfair.push(`${s}: the expert was hit ${E} times`);
}
console.log(unfair.length ? 'TOO TIGHT (no reliable way through): ' + unfair.join('; ') : 'fair: the expert gets through every section');
process.exit(unfair.length ? 1 : 0);
