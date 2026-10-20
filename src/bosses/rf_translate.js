// Realmforge bosses on our three-phase boss engine (src/bossx.js), part 2: their fights, translated at load time from
// their data (art/rf/data.json). Each of their phases becomes one of ours, at the Life their phase begins (their
// "75–55%"); in it the boss moves their way (mv) and runs their emitters (em) on their own clocks, as their engine did:
//   aim     n shots in a spread of sp degrees at you        ring    n round, turned rot degrees each time (from 12 up,
//   spiral  arms stepping step degrees each time                    a two-shot gap near you)
//   aoe     marked circles: where you stand, a line toward you, rings going out, a grid of lanes with a gap
//   minion  its own creatures (their art, their shot, a life span, a burst when they fall), up to a number
//   laser   a marked line that burns: at you, crossed through you, or swept
//   and the rest of their kinds as close as our shots and hazards allow (rain, walls, lines, implosions, converging,
//   flocks, novas, beams, drops, sprays, bolas, ahead-of-you marks, sequences, clouds, rifts, hedges, wildfire).
//   Still their engine's alone: chess boards, music staves, a worm's segments, beams that follow a laser, and the big
//   bespoke phases (Aion's puzzles, Vitrea's clones and panes, the twins, Gourdrick's allies, the shell game, rituals).
// Their arena-wide patterns use a box the size of their arena (B.room) round the place the boss rose.
// Their phase rules (specials, part 1): rage (it runs hotter: emitters a quarter faster, a red glow), len (a phase
// lasts so long, 60 s unless it says; then the next, and the last ends the fight, as their engine had it), invuln (it
// cannot be hurt that phase; its minions falling ends it early), shield (the hour shields it but for short openings:
// a stand-in for Aion's puzzle), heat (a checkerboard floor, its squares burning by turns after a warning), leash
// (stray too far from it and the oath burns).
// Their arena rules (specials, part 2), felt in each player's own browser (B.local; the server runs the boss and its
// shots, each browser the floor under its own player, on the phase's clock the boss carries): the lantern's cone, the
// dark and the sandstorm, the floor that strikes the still, the flood, the mesmer that turns you back, the moonlight
// pools, frostbite, the closing edge, the wind, updrafts lifting its shots, sunspots, the gavel that strikes the moving,
// the stopped clock (its shots hang in the air), gravity wells, fields and pulses (shots bend and are swallowed too),
// zero gravity, the spotlight, the encore, ink that slows, the fold that turns the far side's shots onto you. On the
// server: the burning trail, the egg and the cocoon (it can't be hurt), ink left where its marks land.
// Their art: tools/rf_build_bx.py (sheet 'bx_rf_<id>', shots 'rfx_shots/<boss>.<shot>'). Their numbers: their dungeon's
// band (src/rf/balance.js), as their own engine had them. Each becomes BX['rfx_<id>'].
import { BX } from './index.js';
import { bandOfBoss } from '../rf/balance.js';
import { ENEMIES } from '../data/enemies.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
// "100–75%" -> 1, "75–55%" -> 0.75 (the Life at which the phase begins)
const startOf = (s) => { const m = /(\d+)/.exec(String(s || '')); return m ? +m[1] / 100 : 1; };

// how they move (their mv.m): round the place it rose (its home) or round you
function moves() {
  const step = (g, e, tx, ty, sp, dt) => { const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d > 0.2) g.moveCircle(e, (dx / d) * Math.min(d, sp * dt), (dy / d) * Math.min(d, sp * dt), 0.8); };
  const home = homeOf;
  const spd = (e, k = 1) => (e.rfMv && e.rfMv.spd ? e.rfMv.spd : 1.2) * k;
  const M = {
    rf_center(g, e, dt) { const H = home(e); step(g, e, H.x, H.y, spd(e, 1.5), dt); },
    rf_chase(g, e, dt) { const p = g.player; if (Math.hypot(p.x - e.x, p.y - e.y) > 2.5) step(g, e, p.x, p.y, spd(e), dt); },
    rf_strafe(g, e, dt) { const p = g.player, a = Math.atan2(e.y - p.y, e.x - p.x) + dt * 0.6; step(g, e, p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, spd(e, 1.4), dt); },
    rf_orbit(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.5); step(g, e, H.x + Math.cos(a) * 4, H.y + Math.sin(a) * 4, spd(e, 1.6), dt); },
    rf_wander(g, e, dt) { const H = home(e); if (!e.rfT || Math.hypot(e.rfT.x - e.x, e.rfT.y - e.y) < 0.5 || (e.rfTT = (e.rfTT || 0) - dt) <= 0) { const a = Math.random() * TAU, r = 1 + Math.random() * 4; e.rfT = { x: H.x + Math.cos(a) * r, y: H.y + Math.sin(a) * r }; e.rfTT = 3; } step(g, e, e.rfT.x, e.rfT.y, spd(e), dt); },
    rf_fig8(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.6); step(g, e, H.x + Math.sin(a) * 5, H.y + Math.sin(a * 2) * 2.5, spd(e, 1.6), dt); },
  };
  M.rf_middle = M.rf_center;
  return M;
}
const MOVE_OF = { middle: 'rf_center', center: 'rf_center', chase: 'rf_chase', strafe: 'rf_strafe', orbit: 'rf_orbit', wander: 'rf_wander', fig8: 'rf_fig8',
  aisle: 'rf_strafe', mirror: 'rf_strafe', charge: 'rf_chase', dash: 'rf_chase', gravehop: 'rf_wander', worm: 'rf_wander', burrow: 'rf_wander', teleport: 'rf_wander', swap: 'rf_center', leap: 'rf_chase', dive: 'rf_chase' };

// where it rose: kept as plain numbers, so the browsers have it with the boss (a puppet: the server's, once it arrives)
function homeOf(e) {
  if (e.net) return { x: e.rfHx ?? e.x, y: e.rfHy ?? e.y };
  if (e.rfHx === undefined) { e.rfHx = e.x; e.rfHy = e.y; }
  return { x: e.rfHx, y: e.rfHy };
}
// the arena-sized box round the place it rose (their arena's columns and rows)
function box(e, B) {
  const H = homeOf(e), map = (B.room && B.room.map) || [];
  const w = Math.max(14, Math.min(26, (map[0] || '').length || 18)), h = Math.max(10, Math.min(20, map.length || 14));
  return { x0: H.x - w / 2, y0: H.y - h / 2, w, h };
}
const rnd = (a, b) => a + Math.random() * (b - a);
// their minions as our monsters: one kind per boss and shot, made the first time it is called for
function minionKind(B, bal, key, em) {
  const id = `rfm_${B.id}_${key}`, s = B.shots[key] || {};
  if (ENEMIES[id]) return id;
  const q = /\(([\d,]+) HP\)/.exec(s.how || ''), hp = Math.round((q ? +q[1].replace(/,/g, '') : 600) * bal.bossHp * 0.6);
  const sh = em.shoot && B.shots[em.shoot.s];
  ENEMIES[id] = { name: s.name || 'Minion', biome: 'dungeon', hp, def: 0, speed: em.behave === 'trap' ? 0 : Math.min(4, (em.spd || 1.2) * 1.4), xp: 0, r: 0.45,
    ai: em.behave === 'trap' ? 'rooted' : 'shamble', aggro: 40, reg: `rfx_shots/${B.id}.${key}`, scale: 2, contact: em.behave === 'chase' && !em.shoot ? Math.round(60 * bal.bossDmg) : 0,
    attacks: sh ? [{ pattern: 'aimed', proj: `rfx_shots/${B.id}.${em.shoot.s}`, count: em.shoot.n || 1, arc: 0.3, dmg: Math.round((sh.dmg || 50) * bal.bossDmg), speed: sh.speed || 5, range: sh.range || 7, cd: em.shoot.e || 2, tell: 300 }] : [],
    loot: [] };
  return id;
}

// one emitter firing: their shot, our projectile
function fire(g, e, B, bal, em, vol) {
  const s = B.shots[em.s] || {};
  if (em.t === 'seq') { const st = em.steps && em.steps[vol % em.steps.length]; if (st) fire(g, e, B, bal, st, vol); return; }   // their steps, one a beat
  if (!B.shots[em.s] && em.t !== 'minion') return;
  const p = g.player, [ox, oy] = g.bxOrigin(e), aim = Math.atan2(p.y - 0.4 - oy, p.x - ox), A = box(e, B), dmg = Math.round((s.dmg || 60) * bal.bossDmg);
  const shot = (a, x = ox, y = oy, sp = s.speed || 5, rg = s.range || 8) => g.shoot('e', x, y, a, sp, rg, dmg, `rfx_shots/${B.id}.${em.s}`, 0.35, false, e.D.name);
  const INK = em.ink && e.bx.B.phases[e.bx.phase] && e.bx.B.phases[e.bx.phase].rfP.ink;
  const zone = (x, y, r, delay) => {
    g.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: Math.round((s.dmg || 80) * bal.bossDmg), by: e.D.name, done: false, colors: [s.color || '#ff6a4a', '#ffffff'] });
    if (INK) g.fx.push({ kind: 'scorch', x, y, r: INK.r || 1.4, t: -delay, life: INK.life || 7, dps: 0, tick: 0, by: e.D.name, ink: INK.slow || 0.55, col: '#2a1840' });   // (a pool of ink where it lands)
  };
  const laser = (x0, y0, a, len, tele, act) => g.fx.push({ kind: 'laser', x0, y0, a, len, t: 0, tele, act, life: tele + act + 0.1, dmg: Math.round((s.dmg || 90) * bal.bossDmg), by: e.D.name, hit: false });
  if (em.t === 'aim') { const n = em.n || 1, sp = (em.sp || 0) * D2R; for (let i = 0; i < n; i++) shot(aim + (n > 1 ? -sp / 2 + (sp * i) / (n - 1) : 0)); }
  else if (em.t === 'ring') {
    const n = em.n || 8, off = vol * (em.rot || 0) * D2R;
    let g0 = -9;
    if (n >= 12 && !em.full) { const want = aim + (Math.random() * 2.2 - 1.1); g0 = Math.round(((((want - off) / (TAU / n)) % n) + n) % n); }
    for (let i = 0; i < n; i++) if (i !== g0 && i !== (g0 + 1) % n) shot(off + (i * TAU) / n);
  } else if (em.t === 'spiral') { const arms = em.arms || 1, off = vol * (em.step || 10) * D2R; for (let i = 0; i < arms; i++) shot(off + (i * TAU) / arms); }
  else if (em.t === 'aoe') {
    const r = em.r || 1.2, tele = em.tele || em.delay || 0.8;
    if (em.at === 'line') for (let k = 1; k <= (em.n || 6); k++) zone(e.x + Math.cos(aim) * k * 1.3, e.y + Math.sin(aim) * k * 1.3, r, tele + k * 0.12);
    else if (em.at === 'ringout') for (let k = 1; k <= (em.n || 3); k++) { const m = 4 + k * 2; for (let j = 0; j < m; j++) { const a = (j * TAU) / m + k * 0.5 + vol * 0.4; zone(e.x + Math.cos(a) * k * 2.8, e.y + Math.sin(a) * k * 2.5, r, tele + (k - 1) * 0.45); } }
    else if (em.at === 'trap') { const horiz = vol % 2 === 0, n = Math.ceil((horiz ? A.w : A.h) / 2), pc = Math.floor(((horiz ? p.x - A.x0 : p.y - A.y0)) / 2), g0 = Math.max(0, Math.min(n - 2, pc + Math.floor(Math.random() * 3) - 1));
      for (let k = 0; k < n; k++) { if (k === g0 || k === g0 + 1) continue; const c = k * 2 + 1; zone(horiz ? A.x0 + c : p.x, horiz ? p.y : A.y0 + c, 0.9, tele); } }
    else { const at = em.at === 'self' ? { x: e.x, y: e.y } : { x: p.x, y: p.y }; for (let k = 0; k < (em.n || 1); k++) zone(at.x + (k ? rnd(-2, 2) : 0), at.y + (k ? rnd(-2, 2) : 0), em.r || 2, tele); }
  }
  else if (em.t === 'minion') {                                  // their creatures
    const id = minionKind(B, bal, em.s, em), mine = (e.rfMins = (e.rfMins || []).filter((m) => !m.dead));
    if (em.max && mine.length >= em.max) return;
    for (let k = 0; k < (em.n || 1); k++) {
      const pl = em.place || 'boss', c = [[0.12, 0.15], [0.88, 0.15], [0.12, 0.85], [0.88, 0.85]][k % 4], d = [[0.06, 0.5], [0.94, 0.5], [0.5, 0.08], [0.5, 0.94]][k % 4];
      let x = e.x + rnd(-1.5, 1.5), y = e.y + rnd(-1.5, 1.5);
      if (pl === 'corners') { x = A.x0 + A.w * c[0]; y = A.y0 + A.h * c[1]; } else if (pl === 'edges') { x = A.x0 + A.w * d[0]; y = A.y0 + A.h * d[1]; }
      else if (pl === 'ring') { const a = (k * TAU) / (em.n || 1) + 0.4; x = A.x0 + A.w / 2 + Math.cos(a) * 6; y = A.y0 + A.h * 0.48 + Math.sin(a) * 4.2; }
      else if (pl === 'random') { x = A.x0 + rnd(0.15, 0.85) * A.w; y = A.y0 + rnd(0.2, 0.85) * A.h; } else if (pl === 'top') { x = A.x0 + A.w * (0.2 + 0.3 * k); y = A.y0 + A.h * 0.1; }
      const m = g.addEnemy(id, x, y);
      m.seen = true; m.aggro = true; m.noLoot = true; m.rfLife = em.life || 0; m.rfBurst = em.burst ? { s: em.burst.s, n: em.burst.n || 6 } : null; m.rfOf = e;
      mine.push(m);
    }
  }
  else if (em.t === 'laser') {
    const tele = em.tele || 0.8, act = Math.min(1.2, em.dur || 0.5), L = Math.max(A.w, A.h) + 6;
    if (em.at === 'cross') for (const sg of [-1, 1]) { const a = (Math.PI / 4) * sg + Math.PI / 2; laser(p.x - Math.cos(a) * L / 2, p.y - Math.sin(a) * L / 2, a, L, tele, act); }
    else if (em.at === 'sweep' || em.at === 'pendulum') for (let k = 0; k < 3; k++) laser(ox, oy, aim + (k - 1) * 0.35 + Math.sin(vol) * 0.4, L, tele + k * 0.35, act);
    else laser(ox, oy, aim, L, tele, act);
  }
  else if (em.t === 'rain') { const ang = (90 - (em.angle || 0)) * D2R; for (let k = 0; k < (em.n || 1); k++) shot(ang, A.x0 + rnd(0.05, 0.95) * A.w, A.y0 - 0.5, s.speed || 5, A.h + 2); }
  else if (em.t === 'wall') { const gap = em.gap || 3, gx = Math.max(A.x0 + 1, Math.min(A.x0 + A.w - gap - 1, p.x - gap / 2 + (vol % 2 ? 2 : -2) * (em.alt ? 1 : 0)));
    for (let x = A.x0 + 0.5; x < A.x0 + A.w; x += 0.85) { if (x > gx && x < gx + gap) continue; shot(Math.PI / 2, x, A.y0 - 0.5, s.speed || 4, A.h + 2); } }
  else if (em.t === 'lines') {
    if (em.at === 'grid') { const sp = em.sp || 2.4, vert = vol % 2 === 0, n = Math.floor((vert ? A.w : A.h) / sp), pc = Math.floor(((vert ? p.x - A.x0 : p.y - A.y0)) / sp);
      for (let k = 0; k <= n; k++) { if (k === pc) continue; const c = k * sp + sp / 2; if (vert) laser(A.x0 + c, A.y0, Math.PI / 2, A.h, em.tele || 1, 0.5); else laser(A.x0, A.y0 + c, 0, A.w, em.tele || 1, 0.5); } }
    else { const pts = Array.from({ length: em.n || 4 }, () => ({ x: A.x0 + rnd(0.1, 0.9) * A.w, y: A.y0 + rnd(0.1, 0.9) * A.h }));
      for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1]; laser(a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), Math.hypot(b.x - a.x, b.y - a.y), em.tele || 1, Math.min(1, em.dur || 0.6)); } }
  }
  else if (em.t === 'implode') { const n = em.n || 12, r = em.r || 9, off = vol * 7 * D2R; for (let i = 0; i < n; i++) { const a = off + (i * TAU) / n; shot(a + Math.PI, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, Math.max(2, s.speed || 5), r + 0.5); } }
  else if (em.t === 'converge') { const n = em.n || 6, r = em.r || 5; zone(p.x, p.y, 1.2, em.tele || 1.5); for (let i = 0; i < n; i++) { const a = (i * TAU) / n; shot(a + Math.PI, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, r / ((em.tele || 1.5) + 0.3), r + 1); } }
  else if (em.t === 'flock') { const n = em.n || 7, left = Math.random() < 0.5, y0 = Math.max(A.y0 + 2, Math.min(A.y0 + A.h - 2, p.y + rnd(-1.5, 1.5))), mid = (n - 1) / 2;
    for (let k = 0; k < n; k++) shot(left ? 0 : Math.PI, left ? A.x0 - Math.abs(k - mid) * 0.8 : A.x0 + A.w + Math.abs(k - mid) * 0.8, y0 + (k - mid) * 0.7, s.speed || 5, A.w + 4); }
  else if (em.t === 'nova') { const n = 28, gap = (em.gap || 40) * D2R, ga = aim + rnd(-0.3, 0.3); for (let i = 0; i < n; i++) { const a = (i * TAU) / n; if (Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))) < gap / 2) continue; shot(a, ox, oy, em.speed || 6); } }
  else if (em.t === 'beam') { const arms = em.arms || 1, off = g.t * (em.sweep || 30) * D2R; for (let i = 0; i < arms; i++) shot(off + (i * TAU) / arms); }
  else if (em.t === 'drop') shot(rnd(0, TAU), ox + rnd(-0.4, 0.4), oy + rnd(-0.4, 0.4));
  else if (em.t === 'spray') shot(aim + Math.sin(g.t * (em.w || 2.2)) * (em.arc || 60) * D2R);
  else if (em.t === 'bolas') { const n = em.n || 1; for (let k = 0; k < n; k++) shot(aim + (k - (n - 1) / 2) * 0.25); }
  else if (em.t === 'ahead') { const v = g.player.vel || { x: 0, y: 0 }, sp = Math.hypot(v.x || 0, v.y || 0); const ux = sp > 0.8 ? v.x / sp : Math.cos(aim), uy = sp > 0.8 ? v.y / sp : Math.sin(aim); for (let k = 1; k <= (em.n || 3); k++) zone(p.x + ux * k * 1.6, p.y + uy * k * 1.6, 1, (em.tele || 0.7) + k * 0.1); }
  else if (em.t === 'orbit') { const n = em.n || 4, r = em.r || 2; for (let i = 0; i < n; i++) { const a = g.t * 1.6 + (i * TAU) / n; shot(a + Math.PI / 2, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 3, 4); } }
  else if (em.t === 'cloud' || em.t === 'rift' || em.t === 'wildfire') { for (let k = 0; k < (em.n || 1); k++) { let x = p.x, y = p.y; for (let j = 0; j < 12; j++) { x = A.x0 + rnd(0.1, 0.9) * A.w; y = A.y0 + rnd(0.15, 0.9) * A.h; if (Math.hypot(x - p.x, y - p.y) > (em.t === 'wildfire' ? 0 : 2.2) && Math.hypot(x - p.x, y - p.y) < (em.t === 'wildfire' ? 5.5 : 99)) break; } zone(x, y, em.r || (em.t === 'rift' ? 2.5 : 1.6), em.t === 'rift' ? 1.4 : 1); } }
  else if (em.t === 'hedge') { for (let k = 0; k < (em.n || 2); k++) { const y = A.y0 + rnd(0.35, 0.92) * A.h, g0 = A.x0 + rnd(0.1, 0.7) * A.w;
    for (const [x, len] of [[A.x0, g0 - A.x0], [g0 + 3, A.x0 + A.w - g0 - 3]]) if (len > 0.5) g.fx.push({ kind: 'lane', x, y, a: 0, len, w: 0.45, delay: 0.8, t: 0, life: 0.8 + (em.life || 4), dmg: Math.round((s.dmg || 60) * bal.bossDmg), by: e.D.name, hitT: 0 }); } }
  else if (em.t === 'warp') { const n = em.n || 6; for (let k = 0; k < n; k++) { const a = (k * TAU) / n + rnd(-0.2, 0.2), r = 7; shot(a + Math.PI, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, s.speed || 5, r + 2); } }
}
// a phase's own rules, every frame: its time limit, its invulnerability, its shield's openings, the hot floor, the leash
function phaseRules(g, e, B, bal, dt) {
  const S = e.bx, ph = S.B.phases[S.phase];
  if (!ph || S.state === 'death' || S.state === 'deathhold' || S.state === 'sleep' || S.state === 'intro') return;
  if (e.rfPh !== S.phase) { e.rfPh = S.phase; e.rfPhT = 0; e.rfFreed = false; e.rfHadMins = false; e.rfOpen = 0; e.rfOpenNext = 6; e.rfHeatT = 0; }
  if (S.state === 'morph') return;
  e.rfPhT += dt;
  // invulnerable: its minions falling frees it
  const mins = (e.rfMins || []).filter((m) => !m.dead);
  if (mins.length) e.rfHadMins = true;
  if (ph.invuln && !e.rfFreed && e.rfHadMins && !mins.length) { e.rfFreed = true; g.banner(`${e.D.name} is exposed!`, 1800); }
  // the shield's openings: every 9 s for 4 s (until Aion's own puzzle is here)
  if (ph.shield && (e.rfOpenNext -= dt) <= 0) { e.rfOpenNext = 9; e.rfOpen = S.t + 4; g.banner('The shield falters!', 1600); }
  e.rfImm = (ph.invuln && !e.rfFreed) || (ph.shield && !(e.rfOpen > S.t)) || !!ph.rfP.egg || !!ph.rfP.cocoon;   // can it be hurt right now
  // the trail: it leaves fire where it goes
  if (ph.rfP.trail && (e.rfTrailT = (e.rfTrailT || 0) - dt) <= 0) { e.rfTrailT = 0.25; g.fx.push({ kind: 'scorch', x: e.x, y: e.y + 0.2, r: 0.7, t: 0, life: 2.5, dps: Math.round(100 * bal.bossDmg), tick: 0, by: e.D.name }); }
  // the time limit: on to the next phase (its Life set there), or, the last, the end of the fight
  if (e.rfPhT > ph.len && S.state !== 'death') {
    const th = S.B.thresholds[S.phase - 1];
    if (th !== undefined) { e.hp = Math.min(e.hp, Math.round(e.maxHp * th)); g.bxMorph(e); }
    else if (g.bxDie) g.bxDie(e);
    return;
  }
  // the hot floor: squares size x size by turns, a warning, then they burn
  if (ph.heat && (e.rfHeatT -= dt) <= 0) {
    const h = ph.heat, A = box(e, B), sz = h.size || 3, par = (e.rfHeatK = (e.rfHeatK || 0) + 1) % 2, s = B.shots[h.s] || {};
    e.rfHeatT = h.every || 2.6;
    for (let j = 0; j * sz < A.h; j++) for (let i = 0; i * sz < A.w; i++) if ((i + j) % 2 === par)
      g.fx.push({ kind: 'zone', x: A.x0 + i * sz + sz / 2, y: A.y0 + j * sz + sz / 2, r: sz * 0.5, t: 0, delay: h.warn || 1.2, life: (h.warn || 1.2) + 0.15, dmg: Math.round((h.dmg || 110) * bal.bossDmg), by: 'the hot floor', done: false, colors: [s.color || '#ff7a1a', '#ffd650'] });
  }
  // the leash: every player too far from it burns (each on their own clock)
  if (ph.leash) {
    const who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player], keep = g.player;
    for (const q of who) {
      if (q.dead || Math.hypot(q.x - e.x, q.y - e.y) <= ph.leash.len) continue;
      if ((q.rfLeashT = (q.rfLeashT || 0) - dt) > 0) continue;
      q.rfLeashT = 0.5; g.player = q; try { g.hurtPlayer(Math.round((ph.leash.dmg || 40) * bal.bossDmg), 'the oath'); } finally { g.player = keep; }
    }
  }
}
// ---- the arena's rules, in the browser, for its own player
const QUIET = new Set(['sleep', 'intro', 'morph', 'death', 'deathhold', 'finale']);
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const tri = (u, span) => { const m = ((u % (2 * span)) + 2 * span) % (2 * span); return span - Math.abs(m - span); };   // there and back
// where the phase's moving things are at time L (the same for every player: they follow the boss's phase clock)
const SPOTS = (A, t) => [0, 1, 2, 3].map((k) => ({ x: A.x0 + A.w * (0.2 + 0.6 * ((k * 0.27 + t * 0.04) % 1)), y: A.y0 + A.h * (0.35 + 0.5 * ((k * 0.41 + t * 0.03) % 1)), r: 1.6 + 0.3 * Math.sin(t * 3 + k) }));
const POOLS = (P, A, L) => Array.from({ length: P.pools.n || 3 }, (_, k) => ({ x: A.x0 + A.w * (0.5 + 0.3 * Math.sin(L * (P.pools.speed || 1.1) * 0.35 + k * 2.4)), y: A.y0 + A.h * (0.55 + 0.27 * Math.cos(L * (P.pools.speed || 1.1) * 0.29 + k * 1.7)), r: P.pools.r || 2.2 }));
const DRAFTS = (P, A, L) => Array.from({ length: P.updraft.n || 2 }, (_, k) => A.x0 + A.w * (0.5 + 0.36 * Math.sin(L * (P.updraft.speed || 0.5) + k * Math.PI * 0.95)));
const WELLS = (P, e, A, L) => (P.wells || []).map((w) => w.free
  ? { ...w, x: A.x0 + 1 + tri(L * (w.vx || 1), A.w - 2), y: A.y0 + 1 + tri(L * (w.vy || 1) + 3, A.h - 2) }
  : { ...w, x: e.x + Math.cos(L * (w.w || 0.6) + (w.ph || 0)) * (w.r || 0), y: e.y + Math.sin(L * (w.w || 0.6) + (w.ph || 0)) * (w.r || 0) * 0.8 });
const FIELD = (P, L) => { const f = P.field, k = Math.floor(L / f.every), dirs = f.dirs || [[0, 1], [-1, 0], [0, -1], [1, 0]], d = dirs[k % dirs.length]; return { x: d[0] * f.mag, y: d[1] * f.mag }; };
const EDGE = (P, L) => P.edge || (P.closing ? { w: P.closing.from + (P.closing.to - P.closing.from) * Math.min(1, Math.max(0, L - 2) / P.closing.over), dmg: P.closing.dmg } : null);
const FLOOD = (L) => 1 + Math.sin(L * 0.8) * 0.4 + Math.min(1.6, L * 0.2);
const CREASE = (e, A, n) => { const h = hash(n, e.nid || 7), a = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4][Math.floor(h * 4)]; return { cx: A.x0 + A.w / 2 + (hash(n, 3) - 0.5) * 4, cy: A.y0 + A.h / 2 + (hash(n, 5) - 0.5) * 3, nx: -Math.sin(a), ny: Math.cos(a), a }; };
// the phase's clock in this browser: the server's (it comes with the boss) run on between its updates
function clockOf(e, dt) {
  if (!e.net) return (e.rfL = e.rfPhT || 0);
  if (e.rfPhT !== e.rfSeen) { e.rfSeen = e.rfPhT; e.rfL = e.rfPhT || 0; } else e.rfL = (e.rfL || 0) + dt;
  return e.rfL;
}
function arenaRules(g, e, B, bal, dt) {
  const S = e.bx, ph = S && S.B.phases[S.phase], P = ph && ph.rfP, p = g.player;
  if (!P || e.dead || !p || p.dead || QUIET.has(S.state) || Math.abs(p.x - e.x) > 30 || Math.abs(p.y - e.y) > 30) return;
  const L = clockOf(e, dt), live = L > 2, A = box(e, B), dm = (x) => Math.round(x * bal.bossDmg), mine = (b) => b.from === 'e' && b.by === e.D.name;
  if (e.rfLPh !== S.phase || !g.rfZ || g.rfZ.e !== e) { e.rfLPh = S.phase; g.rfZ = { e }; }   // this player's state for the phase
  const Z = g.rfZ, tick = (k, per) => { Z[k] = (Z[k] || 0) - dt; if (Z[k] <= 0) { Z[k] = per; return true; } return false; };
  const hurt = (d, by) => g.hurtPlayer(dm(d), by);
  const mark = (x, y, r, tele, key) => { const s = B.shots[key] || {}; g.fx.push({ kind: 'zone', x, y, r, t: 0, delay: tele, life: tele + 0.15, dmg: dm(s.dmg || 80), by: e.D.name, done: false, colors: [s.color || '#ff6a4a', '#ffffff'] }); };
  const push = (dx, dy) => g.moveCircle(p, dx, dy, 0.32);
  const outside = (w) => p.x < A.x0 + w || p.x > A.x0 + A.w - w || p.y < A.y0 + w || p.y > A.y0 + A.h - w;
  // the dark, the sandstorm: you see only round yourself
  if (P.dark || P.sandstorm) { if (!(g.darkUntil > g.t)) g.darkStart = g.t; g.darkUntil = g.t + 0.7; g.darkR = P.dark ? 3.2 : 4.6; g.darkBy = e; }
  if (!live) return;
  // the lantern's cone sweeps the crypt
  if (P.cone) { const c = P.cone, a = Math.PI / 2 + (c.speed || 40) * D2R * L, dx = p.x - e.x, dy = p.y - e.y, da = Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a));
    if (Math.hypot(dx, dy) < c.len && Math.abs(da) < (c.half || 22) * D2R && tick('cone', 0.5)) hurt(c.dmg || 45, 'lantern light'); }
  // stand still too long and the floor strikes where you stand
  if (P.still) { Z.st = p.moving ? Math.max(0, (Z.st || 0) - dt * 3) : (Z.st || 0) + dt; if (Z.st >= P.still.after) { Z.st = -0.6; mark(p.x, p.y, P.still.r || 1, 0.55, P.still.s); } }
  // the flood rises from the walls
  if (P.flood && outside(FLOOD(L)) && tick('flood', 0.5)) hurt(40, 'the flood');
  // the mesmer: three seconds in four, a step toward it turns you away
  if (P.mesmer && L % 4 < 3 && p.moving && p.vel) { const bx = e.x - p.x, by = e.y - p.y, d = Math.hypot(bx, by) || 1, dot = (p.vel.x * bx + p.vel.y * by) / d; if (dot > 0) push((-2 * dot * bx / d) * dt, (-2 * dot * by / d) * dt); }
  // moonlight pools: outside them the dark bites
  if (P.pools && !POOLS(P, A, L).some((o) => Math.hypot(p.x - o.x, p.y - o.y) < o.r) && tick('pools', 0.5)) hurt(P.pools.dmg || 30, 'the dark');
  // frostbite: stand still a second and you freeze
  if (P.frostbite) { Z.fb = p.moving ? 0 : (Z.fb || 0) + dt; if (Z.fb > 1 && !(p.frozenUntil > g.t)) { Z.fb = 0; p.frozenUntil = g.t + 1; g.float(p.x, p.y - 1, 'FROZEN', '#9fd8ff'); } }
  // the edge of the arena: a drop, or light closing in
  const E = EDGE(P, L); if (E && outside(E.w) && tick('edge', 0.5)) hurt(E.dmg || 60, P.closing ? 'collapsing light' : 'the drop');
  // the wind turns round the room
  if (P.wind) { const dx = p.x - (A.x0 + A.w / 2), dy = p.y - (A.y0 + A.h / 2), d = Math.hypot(dx, dy) || 1; push((-dy / d) * 1.2 * dt, (dx / d) * 1.2 * dt); }
  // updrafts lift its shots
  if (P.updraft) { const xs = DRAFTS(P, A, L), w = (P.updraft.w || 2.4) / 2; for (const b of g.projectiles) if (mine(b) && !b.frozen && xs.some((x) => Math.abs(b.x - x) < w)) b.y -= (P.updraft.push || 3) * dt * 0.6; }
  // sunspots burn
  if (P.sunspots && SPOTS(A, g.t).some((o) => Math.hypot(p.x - o.x, p.y - o.y) < o.r) && tick('sun', 0.5)) hurt(50, 'a sunspot');
  // the gavel: whoever moves as it falls is struck down
  if (P.gavel) { const G = P.gavel, k = Math.floor(L / G.every);
    if (Z.gk !== undefined && k !== Z.gk) { if (p.moving) { hurt((B.shots[G.s] || {}).dmg || 90, 'the gavel'); p.frozenUntil = g.t + 0.5; g.float(p.x, p.y - 1, 'ORDER!', '#ff5a4a'); } else g.float(e.x, e.y - 2.5, 'ORDER!', '#ffd650'); }
    Z.gk = k; }
  // the stopped clock: its shots hang where they are, then go on
  if (P.timestop) { const T = P.timestop, c = L % T.every;
    if (L > T.every - T.dur && c >= T.every - T.dur) { if (!g.timeStop) { g.timeStop = { x: e.x, y: e.y, r: 40, t: T.every - c, rfx: true }; g.float(p.x, p.y - 1.4, 'TIME STOPS', '#fff0b0'); } }
    else if (c >= T.every - T.dur - T.warn && !Z.tsw) { Z.tsw = true; g.float(e.x, e.y - 2.5, 'tick... tock...', '#fff0b0'); }
    if (c < T.every - T.dur - T.warn) Z.tsw = false; }
  // gravity: wells pull (and swallow shots), fields lean one way by turns, pulses push and pull
  if (P.wells || P.field || P.pulse) {
    const W = WELLS(P, e, A, L), F = P.field ? FIELD(P, L) : null;
    const grav = (x, y) => { let gx = F ? F.x : 0, gy = F ? F.y : 0; for (const w of W) { const dx = w.x - x, dy = w.y - y, d = Math.hypot(dx, dy) || 1; if (d > w.R) continue; const k = w.str * (1 - d / w.R) * (d < 0.6 ? 0.3 : 1); gx += (dx / d) * k; gy += (dy / d) * k; } return [gx, gy]; };
    const [gx, gy] = grav(p.x, p.y); if (!P.zerog) push(gx * 0.55 * dt, gy * 0.55 * dt);
    for (const b of g.projectiles) { if (!mine(b) || b.frozen) continue;
      if (W.some((w) => w.str > 0 && Math.hypot(w.x - b.x, w.y - b.y) < 0.45)) { b.life = 0; continue; }
      const [bx, by] = grav(b.x, b.y); b.vx += bx * dt; b.vy += by * dt; b.a = Math.atan2(b.vy, b.vx); }
    if (P.pulse) { const pu = P.pulse, k = Math.floor(L / pu.every);
      if (Z.pk !== undefined && k !== Z.pk) { const mode = pu.alt ? (k % 2 ? 'push' : 'pull') : pu.mode || 'push', dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, s = (mode === 'push' ? 1 : -1) * pu.str;
        p.gust = { vx: (dx / d) * s, vy: (dy / d) * s, until: g.t + 0.3 }; g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 6, color: mode === 'push' ? '#c8a0ff' : '#5a3a9a' }); }
      Z.pk = k; }
  }
  // zero gravity: you drift, slow to start and slow to stop
  if (P.zerog && p.vel) { const v = (Z.zv = Z.zv || { x: 0, y: 0 }), k = Math.min(1, dt * 1.3); v.x += (p.vel.x - v.x) * k; v.y += (p.vel.y - v.y) * k; push((v.x - p.vel.x) * dt, (v.y - p.vel.y) * dt); }
  // the spotlight hunts you: hold still in it and the audience throws a bouquet
  if (P.spotlight) { const SP = P.spotlight, z = (Z.spot = Z.spot || { x: e.x, y: e.y, c: 0, cool: 0 });
    if (z.cool > 0) z.cool -= dt; else { const dx = p.x - z.x, dy = p.y - z.y, d = Math.hypot(dx, dy); if (d > 0.05) { const k = Math.min(d, SP.speed * dt); z.x += (dx / d) * k; z.y += (dy / d) * k; } }
    if (Math.hypot(p.x - z.x, p.y - z.y) < SP.r && z.cool <= 0) { z.c += dt; if (z.c >= SP.catch) { mark(p.x, p.y, 1.5, 0.75, SP.s); z.c = 0; z.cool = 1.4; g.float(p.x, p.y - 1, 'BRAVO!', '#ffd650'); } }
    else z.c = Math.max(0, z.c - dt * 1.5); }
  // the encore: where you have been erupts a moment later
  if (P.encore && tick('enc', P.encore.every)) { if (Z.ex === undefined || Math.hypot(p.x - Z.ex, p.y - Z.ey) > 0.55) { Z.ex = p.x; Z.ey = p.y; mark(p.x, p.y, 0.85, P.encore.delay, P.encore.s); } }
  // ink slows
  for (const f of g.fx) if (f.ink && f.t >= 0 && Math.hypot(p.x - f.x, p.y - f.y) < f.r) { p.dragUntil = g.t + 0.15; p.dragF = f.ink; break; }
  // the fold: a crease, then the far side's shots are folded over onto yours
  if (P.fold) { const F = P.fold, n = Math.floor(L / F.every);
    if (Z.fn !== undefined && n !== Z.fn && n > 0) { const C = CREASE(e, A, n), sp = (p.x - C.cx) * C.nx + (p.y - C.cy) * C.ny, flip = sp >= 0 ? -1 : 1;
      for (const b of g.projectiles) { if (!mine(b)) continue; const sd = (b.x - C.cx) * C.nx + (b.y - C.cy) * C.ny; if (sd * flip <= 0) continue;
        b.x -= 2 * sd * C.nx; b.y -= 2 * sd * C.ny; const dn = b.vx * C.nx + b.vy * C.ny; b.vx -= 2 * dn * C.nx; b.vy -= 2 * dn * C.ny; b.a = Math.atan2(b.vy, b.vx); }
      g.vx({ k: 'shake', amt: 3 }); }
    Z.fn = n; }
}
// the arena's rules, drawn on the ground (each the same for every player, but the spotlight: yours)
function drawArena(r, g, e, B) {
  const S = e.bx, ph = S && S.B.phases[S.phase], P = ph && ph.rfP;
  if (!P || QUIET.has(S.state)) return;
  const b = r.b, L = e.rfL || 0, A = box(e, B), [ox, oy] = r.proj(e.x, e.y), [ux, uy] = r.proj(e.x + 1, e.y), ts = Math.hypot(ux - ox, uy - oy);
  const circle = (x, y, rad, fill, a, stroke) => { const [sx, sy] = r.proj(x, y); b.globalAlpha = a; b.beginPath(); b.arc(sx, sy, rad * ts, 0, TAU); if (stroke) { b.strokeStyle = fill; b.lineWidth = 2; b.stroke(); } else { b.fillStyle = fill; b.fill(); } b.globalAlpha = 1; };
  const poly = (pts, fill, a) => { b.globalAlpha = a; b.fillStyle = fill; b.beginPath(); pts.forEach(([x, y], i) => { const [sx, sy] = r.proj(x, y); if (i) b.lineTo(sx, sy); else b.moveTo(sx, sy); }); b.closePath(); b.fill(); b.globalAlpha = 1; };
  const band = (w, fill, a) => { const x0 = A.x0, y0 = A.y0, x1 = A.x0 + A.w, y1 = A.y0 + A.h;
    for (const q of [[x0, y0, x1, y0 + w], [x0, y1 - w, x1, y1], [x0, y0 + w, x0 + w, y1 - w], [x1 - w, y0 + w, x1, y1 - w]]) poly([[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]], fill, a); };
  if (P.cone && L > 2) { const c = P.cone, a = Math.PI / 2 + (c.speed || 40) * D2R * L, h = (c.half || 22) * D2R, pts = [[e.x, e.y]]; for (let k = 0; k <= 8; k++) { const q = a - h + (2 * h * k) / 8; pts.push([e.x + Math.cos(q) * c.len, e.y + Math.sin(q) * c.len]); } poly(pts, '#ffe9a0', 0.22); }
  if (P.flood) band(FLOOD(L), '#3a7ac8', 0.35);
  const E = EDGE(P, L); if (E) band(E.w, P.closing ? '#fff6c8' : '#000000', P.closing ? 0.3 : 0.45);
  if (P.pools) for (const o of POOLS(P, A, L)) circle(o.x, o.y, o.r, '#cfe8ff', 0.2);
  if (P.sunspots) for (const o of SPOTS(A, g.t)) circle(o.x, o.y, o.r, '#ff9a2a', 0.3);
  if (P.updraft) for (const x of DRAFTS(P, A, L)) { const w = (P.updraft.w || 2.4) / 2; poly([[x - w, A.y0], [x + w, A.y0], [x + w, A.y0 + A.h], [x - w, A.y0 + A.h]], '#d6eeff', 0.12); }
  if (P.wells) for (const w of WELLS(P, e, A, L)) { circle(w.x, w.y, 0.6, '#1a0a2a', 0.8); circle(w.x, w.y, w.R, '#8a5ad0', 0.35, true); }
  if (P.fold) { const F = P.fold, c = L % F.every; if (c >= F.every - F.warn) { const C = CREASE(e, A, Math.floor(L / F.every) + 1), dx = Math.cos(C.a) * 20, dy = Math.sin(C.a) * 20, [x0, y0] = r.proj(C.cx - dx, C.cy - dy), [x1, y1] = r.proj(C.cx + dx, C.cy + dy);
    b.globalAlpha = 0.5 + 0.4 * Math.sin(g.t * 12); b.strokeStyle = '#ffffff'; b.lineWidth = 2; b.setLineDash([6, 5]); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); b.setLineDash([]); b.globalAlpha = 1; } }
  if (P.gavel) { const c = L % P.gavel.every; if (c >= P.gavel.every - P.gavel.warn) circle(e.x, e.y, 3 + Math.sin(g.t * 14) * 0.2, '#ff5a4a', 0.6, true); }
  if (P.timestop && g.timeStop && g.timeStop.rfx) circle(e.x, e.y, 3.2, '#fff0b0', 0.4, true);
  if (P.spotlight && g.rfZ && g.rfZ.e === e && g.rfZ.spot) circle(g.rfZ.spot.x, g.rfZ.spot.y, P.spotlight.r, '#fff6c8', 0.25);
}
// the kinds this translates (the rest wait for their boss's specials)
const KINDS = new Set(['aim', 'ring', 'spiral', 'aoe', 'minion', 'laser', 'rain', 'wall', 'lines', 'implode', 'converge', 'flock', 'nova', 'beam', 'drop', 'spray', 'bolas', 'ahead', 'orbit', 'cloud', 'rift', 'wildfire', 'hedge', 'warp', 'seq']);
// minions' own life: a life span, a burst when they fall (every frame, from the boss's update)
function tickMinions(g, e, B, bal, dt) {
  for (const m of e.rfMins || []) {
    if (!m.dead && m.rfLife > 0 && (m.rfLife -= dt) <= 0) { m.noLoot = true; g.damageEnemy(m, 1e9, m.x, m.y, true); }
    if (m.dead && m.rfBurst && !m.rfBurst.done) { m.rfBurst.done = true; const s = B.shots[m.rfBurst.s]; if (s) for (let k = 0; k < m.rfBurst.n; k++) g.shoot('e', m.x, m.y - 0.3, (k * TAU) / m.rfBurst.n, s.speed || 5, s.range || 6, Math.round((s.dmg || 50) * bal.bossDmg), `rfx_shots/${B.id}.${m.rfBurst.s}`, 0.35, false, e.D.name); }
  }
}

export function rfBossToBX(DATA, B) {
  const bal = bandOfBoss(DATA, B.id) || { bossHp: 2, bossDmg: 0.8, bossDef: B.def || 0, tiers: [5, 8] };
  const P = B.phases || [];
  const phases = {}, thresholds = [];
  P.forEach((ph, i) => {
    if (i) thresholds.push(Math.min(0.99, startOf(ph.hp)));
    phases[i + 1] = { move: MOVE_OF[ph.mv && ph.mv.m] || 'rf_center', rfMv: ph.mv, rfEm: (ph.em || []).filter((em) => KINDS.has(em.t)),
      rfP: ph, rage: !!ph.rage, len: ph.len || 60, invuln: !!ph.invuln, shield: !!ph.shield, heat: ph.heat || null, leash: ph.leash || null,
      patterns: [{ name: ph.name, windup: 0.4, recover: 5.5, volleys: [{ form: 'special', name: 'rfEmit' }] }] };
  });
  const T2 = [bal.tiers[0] + 1, bal.tiers[1] + 1];
  return {
    id: `rfx_${B.id}`, art: `rf_${B.id}`, name: B.name, hp: Math.round(B.hp * bal.bossHp), def: bal.bossDef ?? Math.min(B.def || 0, 30), xp: Math.round(B.hp / 40),
    r: 1.6, speed: 1.2, keep: 6, faces: false, thresholds, phases, rfData: B,
    moves: moves(),
    specials: {
      // a phase's emitters, each on its own clock, for the length of the pattern
      rfEmit(g, e) { const S = e.bx, ph = S.B.phases[S.phase]; e.rfMv = ph.rfMv; S.rfEm = { list: ph.rfEm.map((em) => ({ em, t: 0.3 + Math.random() * 0.4, vol: 0 })), until: S.t + 5.6 }; },
    },
    update(g, e, dt) {
      const S = e.bx, R = S.rfEm;
      tickMinions(g, e, B, bal, dt);
      phaseRules(g, e, B, bal, dt);
      if (S.state === 'death' || S.state === 'deathhold') for (const m of e.rfMins || []) if (!m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; }   // (its creatures go with it)
      if (!R || S.t > R.until || S.state === 'morph' || S.state === 'death' || S.state === 'deathhold') return;
      const hot = S.B.phases[S.phase] && S.B.phases[S.phase].rage ? 0.8 : 1;   // (rage: a quarter faster)
      for (const q of R.list) if ((q.t -= dt) <= 0) { q.t = (q.em.e || (q.em.t === 'minion' ? 1e9 : 1.5)) * hot; fire(g, e, B, bal, q.em, q.vol++); }
    },
    // the arena's rules, for the player in this browser
    local(g, e, dt) { arenaRules(g, e, B, bal, dt); },
    drawGround(r, g, e) { drawArena(r, g, e, B); },
    // can't be hurt: an invulnerable phase (until its time is up or its minions fall), or shielded outside its openings
    immune(g, e) { return !!e.rfImm; },                 // (worked out each frame where the fight runs: phaseRules; a shared boss brings it along)
    immuneText: 'INVULNERABLE',
    // what the phase looks like on it: rage's red glow, an invulnerable ring, the hour's gold shield, the leash's reach
    draw(r, g, e, sx, sy) {
      const ph = e.bx.B.phases[e.bx.phase], b = r.b;
      if (!ph || e.dead) return;
      const ring = (rad, col, a) => { b.globalAlpha = a; b.strokeStyle = col; b.lineWidth = 2; b.beginPath(); b.arc(sx, sy - 24, rad, 0, TAU); b.stroke(); b.globalAlpha = 1; };
      if (ph.rage) ring(40 + Math.sin(g.t * 6) * 3, '#ff3c50', 0.5);
      if (ph.invuln && e.rfImm) ring(34, '#9fd8ff', 0.55 + Math.sin(g.t * 6) * 0.25);
      if (ph.shield && e.rfImm) ring(36, '#ffd650', 0.6);
      if ((ph.rfP.egg || ph.rfP.cocoon) && e.rfImm) ring(32 + Math.sin(g.t * 6) * 2, ph.rfP.egg ? '#ffcc33' : '#f4ecd8', 0.7);
      if (ph.leash) { b.globalAlpha = 0.18; b.strokeStyle = '#7ac85a'; b.lineWidth = 1; b.beginPath(); b.arc(sx, sy, ph.leash.len * 16, 0, TAU); b.stroke(); b.globalAlpha = 1; }
    },
    loot: [...(B.drops || []).map((d) => ({ id: `rf_${d.id}`, p: d.rarity === 'mythic' ? 0.02 : d.rarity === 'legendary' ? 0.08 : 0.2 })),
      { slot: 'weapon', tiers: T2, p: 0.8 }, { slot: 'armor', tiers: T2, p: 0.8 }, { slot: 'ring', tiers: [1, 3], p: 0.5 }, { slot: 'ability', tiers: [3, 5], p: 0.5 }, { stat: true, p: 0.6 }, { id: 'pot_hp', p: 1 }],
  };
}
// every Realmforge boss, added to the engine's list (the browser after its data loads; the server at start)
export function addRfBosses(DATA) {
  for (const B of DATA.bosses || []) BX[`rfx_${B.id}`] = rfBossToBX(DATA, B);
  return Object.keys(BX).filter((k) => k.startsWith('rfx_')).length;
}
