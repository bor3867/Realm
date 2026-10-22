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
//   Still their engine's alone: beams that follow a laser, and the big
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
    rf_center(g, e, dt) { if (e.rfSlotX !== undefined) { e.x = e.rfSlotX; e.y = e.rfSlotY; return; } const H = home(e); step(g, e, H.x, H.y, spd(e, 1.5), dt); },   // (in the Thousandfold: at her place in the ring)
    rf_chase(g, e, dt) { const p = g.player; if (Math.hypot(p.x - e.x, p.y - e.y) > 2.5) step(g, e, p.x, p.y, spd(e), dt); },
    rf_strafe(g, e, dt) { const p = g.player, a = Math.atan2(e.y - p.y, e.x - p.x) + dt * 0.6; step(g, e, p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, spd(e, 1.4), dt); },
    rf_orbit(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.5); step(g, e, H.x + Math.cos(a) * 4, H.y + Math.sin(a) * 4, spd(e, 1.6), dt); },
    rf_wander(g, e, dt) { const H = home(e); if (!e.rfT || Math.hypot(e.rfT.x - e.x, e.rfT.y - e.y) < 0.5 || (e.rfTT = (e.rfTT || 0) - dt) <= 0) { const a = Math.random() * TAU, r = 1 + Math.random() * 4; e.rfT = { x: H.x + Math.cos(a) * r, y: H.y + Math.sin(a) * r }; e.rfTT = 3; } step(g, e, e.rfT.x, e.rfT.y, spd(e), dt); },
    // swapping places among three spots, every so often (the other two hold its decoys)
    rf_swap(g, e, dt) { if ((e.rfSwT = (e.rfSwT || 0) + dt) >= ((e.rfMv && e.rfMv.every) || 2.5)) { e.rfSwT = 0; e.rfSw = ((e.rfSw || 0) + 1) % 3; g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 12, colors: ['#7ac85a', '#2a4a1a'] }); }
      const q = swapAt(box(e, e.bx.B.rfData), e.rfSw || 0); e.x = q.x; e.y = q.y; },
    // Sarrukh: the head steers (a turn at a time) after you, round the room's rim, or in a tight coil; the body follows
    rf_worm(g, e, dt) { const A = box(e, e.bx.B.rfData), mv = e.rfMv || {}, t = e.rfPhT || 0, p = g.player; let tx = p.x, ty = p.y, turn = 2.2;
      if (mv.aim === 'circuit') { const a = t * 0.42; tx = A.x0 + A.w / 2 + Math.cos(a) * A.w * 0.36; ty = A.y0 + A.h / 2 + Math.sin(a) * A.h * 0.36; turn = 2.6; }
      else if (mv.aim === 'coil') { const a = t * 1.6; tx = A.x0 + A.w / 2 + Math.cos(a) * 2.7; ty = A.y0 + A.h / 2 + Math.sin(a) * 2.7; turn = 5; }
      wormSteer(e, A, tx, ty, mv.spd || 3, turn, dt); },
    // Sarrukh's burrow: surface, dive, a ripple that follows you, it locks (marked), and it erupts there
    rf_burrow(g, e, dt) { const A = box(e, e.bx.B.rfData), p = g.player; e.rfBt = (e.rfBt || 0) + dt; e.rfBst = e.rfBst || 'surface';
      if (e.rfBst === 'surface') { wormSteer(e, A, p.x, p.y, 1.6, 2, dt); if (e.rfBt > 1.4) { e.rfBst = 'dive'; e.rfBt = 0; } }
      else if (e.rfBst === 'dive') { wormSteer(e, A, p.x, p.y, 2, 2, dt); if (e.rfBt > 0.4) { e.rfBst = 'follow'; e.rfBt = 0; e.rfDig = e.hidden = e.under = true; } }
      else if (e.rfBst === 'follow') { const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > 0.1) { const k = Math.min(d, 6 * dt); e.x += (dx / d) * k; e.y += (dy / d) * k; }
        if (e.rfBt > 1) { e.rfBst = 'lock'; e.rfBt = 0; const s = e.bx.B.rfData.shots.erupt || {}; g.fx.push({ kind: 'zone', x: e.x, y: e.y, r: 1.7, t: 0, delay: 0.7, life: 0.85, dmg: Math.round((s.dmg || 140) * (e.bx.B.rfBal ? e.bx.B.rfBal.bossDmg : 1)), by: e.D.name, done: false, colors: ['#e0a85e', '#fff0c0'] }); } }
      else if (e.rfBst === 'lock') { if (e.rfBt > 0.7) { e.rfBst = 'surface'; e.rfBt = 0; e.rfDig = e.hidden = e.under = false; e.rfWa = -Math.PI / 2;   // up it comes, its body out of the sand below it
        e.rfHist = []; for (let k = 12; k >= 0; k--) e.rfHist.push({ x: e.x, y: e.y + k * 0.5 }); g.vx({ k: 'burst', x: e.x, y: e.y, n: 20, colors: ['#e0a85e', '#fff0c0', '#8a6a3a'] }); g.vx({ k: 'shake', amt: 5 }); e.rfErupt = (e.rfErupt || 0) + 1; } }
      wormBody(e, (e.rfMv && e.rfMv.segs) || 9); },
    rf_fig8(g, e, dt) { const H = home(e), a = (e.rfA = (e.rfA || 0) + dt * 0.6); step(g, e, H.x + Math.sin(a) * 5, H.y + Math.sin(a * 2) * 2.5, spd(e, 1.6), dt); },
  };
  M.rf_middle = M.rf_center;
  return M;
}
const MOVE_OF = { middle: 'rf_center', center: 'rf_center', chase: 'rf_chase', strafe: 'rf_strafe', orbit: 'rf_orbit', wander: 'rf_wander', fig8: 'rf_fig8',
  aisle: 'rf_strafe', mirror: 'rf_strafe', charge: 'rf_chase', dash: 'rf_chase', gravehop: 'rf_wander', worm: 'rf_worm', burrow: 'rf_burrow', teleport: 'rf_wander', swap: 'rf_swap', leap: 'rf_chase', dive: 'rf_chase' };

// where it rose: kept as plain numbers, so the browsers have it with the boss (a puppet: the server's, once it arrives)
function homeOf(e) {
  if (e.net) return { x: e.rfHx ?? e.x, y: e.rfHy ?? e.y };
  if (e.rfHx === undefined) { e.rfHx = e.x; e.rfHy = e.y; }
  return { x: e.rfHx, y: e.rfHy };
}
// the three places a swapper stands (its decoys at the other two); where shots come from besides its body
const SWAP = [[0.2, 0.24], [0.8, 0.24], [0.5, 0.42]];
const swapAt = (A, i) => ({ x: A.x0 + SWAP[i % 3][0] * A.w, y: A.y0 + SWAP[i % 3][1] * A.h });
const decoysOf = (e, B, P) => Array.from({ length: P.decoys || 0 }, (_, k) => swapAt(box(e, B), (e.rfSw || 0) + k + 1));
const crownAt = (e, B, c) => { const A = box(e, B), a = (e.rfL ?? e.rfPhT ?? 0) * (c.w || 0.9); return { x: A.x0 + A.w / 2 + Math.cos(a) * c.r, y: A.y0 + A.h * 0.5 + Math.sin(a) * c.r * 0.62 }; };
function originsOf(e, B, src) {
  const P = e.bx.B.phases[e.bx.phase] && e.bx.B.phases[e.bx.phase].rfP;
  if (!P || !src) return null;
  if (src === 'decoys' && P.decoys) return decoysOf(e, B, P);
  if (src === 'corners') { const A = box(e, B); return [[1.5, 1.5], [A.w - 1.5, 1.5], [1.5, A.h - 1.5], [A.w - 1.5, A.h - 1.5]].map(([x, y]) => ({ x: A.x0 + x, y: A.y0 + y })); }
  if (src === 'crown' && P.crownOrbit) return [crownAt(e, B, P.crownOrbit)];
  if (src === 'ring' && P.thousand) return Array.from({ length: P.thousand.n || 8 }, (_, i) => slotAt(e, B, P, i));   // the Thousandfold: every one of them
  if (src === 'b2') { const n = e.rfNoct && !e.rfNoct.dead ? e.rfNoct : null; return n ? [{ x: n.x, y: n.y - 1 }] : null; }   // Noct
  return null;                                                   // (its body: b1, and for now b2 and the ring of mirrors too)
}
// the arena-sized box round the place it rose (their arena's columns and rows)
function box(e, B) {
  if (e.rfAw) return { x0: e.rfAx0, y0: e.rfAy0, w: e.rfAw, h: e.rfAh };   // in its own room: the room
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
function fire(g, e, B, bal, em, vol, org) {
  const PH0 = e.bx.B.phases[e.bx.phase];
  const s = B.shots[em.s] || {};
  if (em.t === 'seq') { const st = em.steps && em.steps[vol % em.steps.length]; if (st) fire(g, e, B, bal, st, vol, org); return; }   // their steps, one a beat
  if (!B.shots[em.s] && em.t !== 'minion') return;
  const p = g.player, [ox, oy] = org ? [org.x, org.y] : g.bxOrigin(e), aim = Math.atan2(p.y - 0.4 - oy, p.x - ox), A = box(e, B), dmg = Math.round((s.dmg || 60) * bal.bossDmg);
  const SIDE = e.bx.B.phases[e.bx.phase] && e.bx.B.phases[e.bx.phase].rfP.halves ? (em.src === 'b2' ? 'night' : 'day') : null;   // (Day and Night: whose side it hurts on)
  const shot = (a, x = ox, y = oy, sp = s.speed || 5, rg = s.range || 8) => { const b = g.shoot('e', x, y, a, sp, rg, dmg, `rfx_shots/${B.id}.${em.s}`, 0.35, false, e.D.name); if (SIDE && b) b.rfSide = SIDE; return b; };
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
    else if (em.at === 'track' || em.at === 'sweep' || em.at === 'pendulum') {   // a beam that lasts: it follows you, turns, or swings
      if (em.at !== 'track' && e.rfBeam && e.rfBeamPh === e.bx.phase) return;      // (a lasting one is already turning)
      Object.assign(e, { rfBeam: em.at, rfBeamPh: e.bx.phase, rfBeamS: em.s, rfBeamN: em.arms || 1, rfBeamL: em.len || Math.max(A.w, A.h), rfBeamTele: em.tele || 1,
        rfBeamLeft: em.at === 'track' ? em.dur || 2 : 1e9, rfBeamA: em.at === 'pendulum' ? Math.PI / 2 : aim, rfBeamW: ((em.at === 'track' ? em.turn : em.sweep) || 30) * D2R,
        rfBeamArc: (em.arc || 120) * D2R, rfBeamPer: em.period || 4, rfBeamT: 0 }); }
    else if (em.reflect && PH0 && PH0.rfP.panes) { let x = ox, y = oy, a = aim, left = L, last = null;   // the Lightray: its bounces, one marked line each
      for (let k = 0; k < 4 && left > 0.5; k++) { const ex = x + Math.cos(a) * left, ey = y + Math.sin(a) * left; let best = null, bp = null;
        for (const P of PANES(e, B, PH0.rfP)) { if (P === last) continue; const h = segX(x, y, ex, ey, P); if (h && (!best || h.t < best.t)) { best = h; bp = P; } }
        if (!best) { laser(x, y, a, left, tele, act); break; }
        const seg = Math.hypot(best.x - x, best.y - y); laser(x, y, a, seg, tele, act); left -= seg; const [vx, vy] = reflectV(Math.cos(a), Math.sin(a), bp); a = Math.atan2(vy, vx); x = best.x + Math.cos(a) * 0.05; y = best.y + Math.sin(a) * 0.05; last = bp; } }
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
  else if (em.t === 'segside' || em.t === 'segout') {            // grit off the body: sideways (every other segment, turn about), or straight out of the coil
    const S = segsOf(e), C = { x: A.x0 + A.w / 2, y: A.y0 + A.h / 2 }, par = vol % 2;
    S.forEach((q, i) => { const prev = i ? S[i - 1] : { x: e.x, y: e.y }, a = Math.atan2(prev.y - q.y, prev.x - q.x);
      if (em.t === 'segout') shot(Math.atan2(q.y - C.y, q.x - C.x), q.x, q.y - 0.4); else if (q.k % 2 === par) { shot(a + Math.PI / 2, q.x, q.y - 0.4); shot(a - Math.PI / 2, q.x, q.y - 0.4); } });
  }
  else if (em.t === 'staff') {                                    // the Cantor's stave: a line lights, then a note slides along it from the arrow's side
    const n = (PH0 && PH0.rfP.staff && PH0.rfP.staff.lines) || 5, used = new Set(), lead = em.lead || 0.7;
    for (let k = 0; k < (em.n || 2); k++) { let i = 0; for (let j = 0; j < 8; j++) { i = Math.floor(Math.random() * n); if (!used.has(i) && i !== e.rfStaffLast) break; }
      used.add(i); e.rfStaffLast = i; const dir = Math.random() < 0.5 ? 1 : -1, y = staffY(A, i, n);
      g.fx.push({ kind: 'staffhint', x0: A.x0, y, len: A.w, dir, t: 0, life: lead });
      (e.rfStaffQ = e.rfStaffQ || []).push({ left: lead, y, dir, s: em.s }); }
  }
  else if (em.t === 'along') {                                    // pearls rolling along the walls
    const side = vol % 4, inset = 0.6, x = side === 0 || side === 2 ? (side === 0 ? A.x0 : A.x0 + A.w) : side === 1 ? A.x0 + inset : A.x0 + A.w - inset, y = side === 1 || side === 3 ? (side === 1 ? A.y0 + A.h : A.y0) : side === 0 ? A.y0 + inset : A.y0 + A.h - inset;
    shot([0, -Math.PI / 2, Math.PI, Math.PI / 2][side], x, y, s.speed || 5, side % 2 ? A.h : A.w);
  }
  else if (em.t === 'chess') {                                    // King Morvane's pieces: near you, each striking its own way
    const BD = BOARD(e, B), kinds = em.kinds || ['rook', 'bishop', 'queen'], L = A.w * 1.5, ks = B.shots[em.ks] ? em.ks : em.s, kd = Math.round(((B.shots[ks] || s).dmg || 80) * bal.bossDmg);
    for (let k = 0; k < (em.n || 1); k++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)], cl = (v, hi) => Math.max(0, Math.min(hi, v));
      const c0 = cl(Math.floor((p.x - BD.x0) / BD.S) + Math.floor(Math.random() * 5) - 2, 7), r0 = cl(Math.floor((p.y - BD.y0) / BD.S) + Math.floor(Math.random() * 5) - 2, BD.rows - 1);
      const x = BD.x0 + (c0 + 0.5) * BD.S, y = BD.y0 + (r0 + 0.5) * BD.S, tl = (em.tele || 1.4) + k * 0.35, du = Math.min(1, em.dur || 0.45);
      if (kind === 'knight') { for (const [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const nx = c0 + dx, ny = r0 + dy; if (nx < 0 || nx > 7 || ny < 0 || ny >= BD.rows) continue;
        g.fx.push({ kind: 'zone', x: BD.x0 + (nx + 0.5) * BD.S, y: BD.y0 + (ny + 0.5) * BD.S, r: BD.S * 0.48, t: 0, delay: tl, life: tl + 0.15, dmg: kd, by: e.D.name, done: false, colors: [(B.shots[ks] || s).color || '#ff3040', '#ffffff'] }); } }
      else { const dirs = []; if (kind !== 'bishop') dirs.push([1, 0], [0, 1]); if (kind !== 'rook') dirs.push([1, 1], [1, -1]);
        for (const [dx, dy] of dirs) { const a = Math.atan2(dy, dx); laser(x - Math.cos(a) * L, y - Math.sin(a) * L, a, L * 2, tl, du); } }
      g.fx.push({ kind: 'rfpiece', x, y, key: `rfx_shots/${B.id}.${kind}`, sz: BD.S * 0.9, t: 0, life: tl + du });   // the piece itself, standing on its square
    }
  }
  else if (em.t === 'warp') {                                    // Starflight: stars stream out of the middle (see-through, harmless, till they're near)
    const star = (a, key = em.s) => { const q = B.shots[key] || s, b = g.shoot('e', ox, oy, a, q.speed || 5, q.range || 14, Math.round((q.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.${key}`, 0.35, false, e.D.name); if (b) { b.rfWarp = true; b.wox = ox; b.woy = oy; b.k = 0.3; b.harmless = b.ghost = true; } return b; };
    const n = em.n || 6, mode = em.mode || 'scatter';
    if (mode === 'gate') {                                           // a star gate: a gold wedge shows its gap, then the ring comes
      e.rfGateA = e.rfGateA === undefined ? aim : e.rfGateA + (Math.random() < 0.5 ? 1 : -1) * rnd(0.35, 0.7);
      e.rfGateGap = (em.gap || 60) * D2R; e.rfGateLeft = em.lead || 1.1; e.rfGateQ = { n, s: em.s, post: em.post, rot: vol * 0.07, ox, oy, star };
    } else if (mode === 'aim') for (let k = 0; k < n; k++) star(aim + (k - (n - 1) / 2) * (em.sp || 8) * D2R);
    else if (mode === 'spiral') for (let k = 0; k < (em.arms || 3); k++) star(vol * (em.step || 17) * D2R + (k * TAU) / (em.arms || 3));
    else for (let k = 0; k < n; k++) star(rnd(0, TAU));
  }
}
// a phase's own rules, every frame: its time limit, its invulnerability, its shield's openings, the hot floor, the leash
function phaseRules(g, e, B, bal, dt) {
  const S = e.bx, ph = S.B.phases[S.phase];
  if (!ph || S.state === 'death' || S.state === 'deathhold' || S.state === 'gone' || e.dead || S.state === 'sleep' || S.state === 'intro') return;
  if (e.rfPh !== S.phase) { e.rfPh = S.phase; e.rfPhT = 0; e.rfFreed = false; e.rfHadMins = false; e.rfOpen = 0; e.rfOpenNext = 6; e.rfHeatT = 0; e.rfPz = 'combat'; e.rfPzT = 0; e.rfPzR = 0; e.rfExpT = 0; e.rfPlN = 0; e.rfSock = 0; e.rfTx = 0; endPieces(e);
    e.rfRit = ''; e.rfRitT = ph.rfP.ritual ? ph.rfP.ritual.every - 3 : 0; e.rfStagT = 0; }
  if (S.state === 'morph') return;
  e.rfPhT += dt;
  // invulnerable: its minions falling frees it
  const mins = (e.rfMins || []).filter((m) => !m.dead);
  if (mins.length) e.rfHadMins = true;
  if (ph.invuln && !e.rfFreed && e.rfHadMins && !mins.length) { e.rfFreed = true; g.banner(`${e.D.name} is exposed!`, 1800); }
  // the Eclipse Twins: Noct, his movement, his own life at the end
  if (B.twin) twinStep(g, e, B, bal, dt, ph);
  if (e.rfDig && (!ph.rfMv || ph.rfMv.m !== 'burrow')) { e.rfDig = e.hidden = e.under = false; e.rfBst = 'surface'; e.rfBt = 0; }   // (a new phase: it comes up)
  if (e.rfSgN && (!ph.rfMv || (ph.rfMv.m !== 'worm' && ph.rfMv.m !== 'burrow'))) e.rfSgN = 0;
  if (e.rfStaffQ && e.rfStaffQ.length) { const A = box(e, B); for (const q of e.rfStaffQ) if ((q.left -= dt) <= 0) { const s = B.shots[q.s] || {}; g.shoot('e', q.dir > 0 ? A.x0 - 1 : A.x0 + A.w + 1, q.y, q.dir > 0 ? 0 : Math.PI, s.speed || 7, A.w + 3, Math.round((s.dmg || 80) * bal.bossDmg), `rfx_shots/${B.id}.${q.s}`, 0.35, false, e.D.name); }
    e.rfStaffQ = e.rfStaffQ.filter((q) => q.left > 0); }
  if (e.rfGateQ && (e.rfGateLeft -= dt) <= 0) { const q = e.rfGateQ, stp = TAU / q.n; e.rfGateQ = null; e.rfGateShow = 1.4;   // the star gate: a ring with its gap where the wedge was, the gap's edges gold
    for (let k = 0; k < q.n; k++) { const a = k * stp + q.rot, dd = Math.atan2(Math.sin(a - e.rfGateA), Math.cos(a - e.rfGateA)); if (Math.abs(dd) < e.rfGateGap / 2) continue;
      q.star(a, Math.abs(dd) < e.rfGateGap / 2 + stp && B.shots[q.post] ? q.post : q.s); } }
  if (e.rfGateShow > 0) e.rfGateShow -= dt;
  if (e.rfBeam) beamStep(g, e, dt);
  if (!ph.rfP.warp && (e.rfGateQ || e.rfGateA !== undefined)) { e.rfGateQ = null; e.rfGateA = undefined; e.rfGateShow = 0; }
  // Vitrea: her reflections, her echoes' shots, the Thousandfold
  if (B.phases.some((q) => q.clones || q.thousand)) vitreaStep(g, e, B, bal, dt, ph);
  // Lord Gourdrick's friends: Sir Rindley and Sister Honeydew
  if (B.allies) allyStep(g, e, B, bal, dt, ph);
  // Mother Mire's ritual: step on every rune before the brew boils
  if (ph.rfP.ritual) ritualStep(g, e, B, bal, dt, ph.rfP.ritual);
  if (ph.rfP.chesspuzzle) chessStep(g, e, B, bal, dt, ph.rfP.chesspuzzle); else if (e.rfCzSt) e.rfCzSt = '';
  if (ph.rfP.shell) shellStep(g, e, B, bal, dt, ph.rfP.shell); else if (e.rfShSt) shellEnd(e);
  // Aion's still hour: the puzzle that brings the shield down
  if (ph.rfP.puzzle) puzzleStep(g, e, B, bal, dt, ph.rfP);
  // a shield with no puzzle: openings every 9 s for 4 s
  else if (ph.shield && (e.rfOpenNext -= dt) <= 0) { e.rfOpenNext = 9; e.rfOpen = S.t + 4; g.banner('The shield falters!', 1600); }
  e.rfImm = (ph.invuln && !e.rfFreed) || (ph.shield && !(ph.rfP.puzzle ? e.rfExpT > 0 : e.rfOpen > S.t)) || (B.twin && S.phase === B.phases.length && e.rfNoct && !e.rfNoct.dead && e.hp <= e.maxHp * 0.05) || !!ph.rfP.egg || !!ph.rfP.cocoon
    || !!e.rfHide || !!e.rfDig || (!!ph.rfP.downbeat && beatOf(e) !== 3);   // (Mirabeau in his cabinet; the Cantor off the downbeat)   // can it be hurt right now
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
const DIVX = (e, B, P, L) => { const A = box(e, B); return A.x0 + A.w / 2 + Math.sin(L * (P.halves.speed || 0.35)) * A.w * 0.28; };
const noctOf = (g, e) => (e.rfNoct && !e.rfNoct.gone ? e.rfNoct : e.rfNoctNid && g.net && g.net.byId ? g.net.byId.get(e.rfNoctNid) || null : null);
const allyOf = (g, e, key) => (e[key] && !e[key].gone ? e[key] : e[key + 'Nid'] && g.net && g.net.byId ? g.net.byId.get(e[key + 'Nid']) || null : null);
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
  // the still hour: its shots hang in the air; the lances, turned by the mirror, end there
  if (e.rfPz === 'still') { if (!g.timeStop || g.timeStop.rfx) g.timeStop = { x: e.x, y: e.y, r: 40, t: 0.3, rfx: true }; }
  if (!('lw' in Z) || e.rfLanceWin !== Z.lw) { if ('lw' in Z) for (const b of g.projectiles) if (b.rfLance) { b.life = 0; g.fx.push({ kind: 'ring', x: b.x, y: b.y, t: 0, max: 1.2, color: '#ffd650' }); } Z.lw = e.rfLanceWin; }
  // a lasting beam: touch it live and it burns
  if (e.rfBeam && !(e.rfBeamTele > 0)) for (const a of beamArms(e)) { const ux = Math.cos(a), uy = Math.sin(a), t = Math.max(0, Math.min(beamReach(g.map, e, a), (p.x - e.x) * ux + (p.y - e.y) * uy));
    if (Math.hypot(p.x - e.x - ux * t, p.y - e.y - uy * t) < 0.55) { if (tick('beam', 0.35)) hurt((B.shots[e.rfBeamS] && B.shots[e.rfBeamS].dmg) || 90, `${e.D.name}'s ${(B.shots[e.rfBeamS] && B.shots[e.rfBeamS].name) || 'beam'}`); break; } }
  // Sarrukh's body: touch a segment and it hurts
  if (e.rfSgN) for (const q of segsOf(e)) if (Math.hypot(p.x - q.x, p.y - q.y) < 0.85) { if (tick('seg', 0.8)) hurt((B.shots.seg && B.shots.seg.dmg) || 100, `${e.D.name}'s body`); break; }
  // Starflight: a star is see-through and harmless till it's 2.25 tiles out, and grows as it comes
  if (P.warp) for (const b of g.projectiles) if (b.rfWarp && b.wox !== undefined) { const d = Math.hypot(b.x - b.wox, b.y - b.woy); b.k = Math.min(1.7, 0.3 + d / 4.5); b.harmless = b.ghost = b.k < 0.8; }
  // Day and Night: Lumen's shots hurt only on the day side of the drifting line, Noct's only on the night side (the
  // others go see-through); the tether between them burns
  if (P.halves) { const dx = DIVX(e, B, P, L);
    for (const b of g.projectiles) if (b.rfSide && b.by === e.D.name) { const hurts = b.rfSide === 'day' ? p.x < dx : p.x >= dx; b.harmless = !hurts; b.ghost = !hurts; } }
  if (P.tether) { const n = noctOf(g, e);
    if (n && !n.dead) { const ax = e.x, ay = e.y, bx = n.x - ax, by = n.y - ay, L2 = bx * bx + by * by || 1, k = Math.max(0, Math.min(1, ((p.x - ax) * bx + (p.y - ay) * by) / L2));
      if (Math.hypot(p.x - (ax + bx * k), p.y - (ay + by * k)) < 0.55 && tick('tether', 0.5)) hurt(P.tether.dmg || 100, 'the eclipse beam'); } }
  // Gourdrick's friends, for you: the Rind Shield circling you stops shots; Honeydew's heals; the dome's verdict; the curse broken
  if (B.allies) {
    if (e.rfShieldUntil > g.t) { const a = g.t * 3.4, sx = p.x + Math.cos(a) * 1.25, sy = p.y + Math.sin(a) * 1.25;
      for (const b of g.projectiles) if (b.from === 'e' && !b.harmless && Math.hypot(b.x - sx, b.y - sy) < 0.6) { b.life = 0; g.vx({ k: 'burst', x: b.x, y: b.y, n: 4, colors: ['#ffd650', '#7ac85a'] }); } }
    const pr = allyOf(g, e, 'rfPriest');
    if ('hk' in Z && Z.hk !== e.rfHealK && pr && !(pr.rfDownUntil > g.t) && Math.hypot(p.x - e.x, p.y - e.y) < 22) { const amt = 110; p.hp = Math.min(g.stat('hp'), p.hp + amt); g.float(p.x, p.y - 1, `+${amt}`, '#7ae07a'); Z.healFx = g.t + 0.45; }
    Z.hk = e.rfHealK;
    if ('dk' in Z && Z.dk !== e.rfDomeK) {
      const inside = Math.hypot(p.x - e.rfDomeX, p.y - e.rfDomeY) <= (e.rfDomeR || 2.3);
      if (!inside && Math.hypot(p.x - e.x, p.y - e.y) < 22) hurt(380, 'the Harvest Moon'); else if (inside) g.float(p.x, p.y - 1, 'SAFE', '#ffd650');
      for (const b of g.projectiles) if (b.from === 'e' && Math.hypot(b.x - e.rfDomeX, b.y - e.rfDomeY) < (e.rfDomeR || 2.3)) b.life = 0;
    }
    Z.dk = e.rfDomeK;
    if ('ck' in Z && Z.ck !== e.rfCurseK && pr && Math.hypot(p.x - pr.x, p.y - pr.y) < 6) { p.hp = Math.min(g.stat('hp'), p.hp + 250); g.float(p.x, p.y - 1, '+250', '#7ae07a'); }
    Z.ck = e.rfCurseK;
  }
  // the panes: her shots bounce off them (three times at most)
  if (P.panes) { const PN = PANES(e, B, P);
    for (const b of g.projectiles) { if (!mine(b)) continue; const px = b.rfPx ?? b.x, py = b.rfPy ?? b.y; b.rfPx = b.x; b.rfPy = b.y;
      if ((b.rfRefl || 0) >= 3) continue;
      for (const P2 of PN) { const h = segX(px, py, b.x, b.y, P2); if (!h) continue; const [vx, vy] = reflectV(b.vx, b.vy, P2); b.vx = vx; b.vy = vy; b.a = Math.atan2(vy, vx); b.x = h.x + vx * 0.02; b.y = h.y + vy * 0.02; b.rfPx = b.x; b.rfPy = b.y; b.rfRefl = (b.rfRefl || 0) + 1; break; } } }
  // the brew boiled over: those near are confused (keys turned about) for a while
  if (!('rit' in Z) || e.rfRitFail !== Z.rit) { const I = P.ritual && P.ritual.inflict; if ('rit' in Z && I && Math.hypot(p.x - e.x, p.y - e.y) < 16) { g.invertUntil = g.t + (I.t || 2.5); g.float(p.x, p.y - 1.2, 'CONFUSED', '#c8a0ff'); } Z.rit = e.rfRitFail; }
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
  // Aion's still hour: the runes (numbered in order, lit when stepped on), the sundial's socket, the mirror's mark
  if (e.rfPlN) { const ord = String(e.rfOrd || '').split('').map(Number);
    for (let i = 0; i < e.rfPlN; i++) { const pl = plateAt(A, i), lit = ord.indexOf(i) < (e.rfNext || 0), [sx, sy] = r.proj(pl.x, pl.y);
      circle(pl.x, pl.y, 0.7, lit ? '#ffd650' : '#8a7ad0', lit ? 0.6 : 0.35); circle(pl.x, pl.y, 0.7, '#fff6c8', 0.7, true);
      b.fillStyle = '#ffffff'; b.font = '12px monospace'; b.textAlign = 'center'; b.fillText(['I', 'II', 'III', 'IV', 'V'][ord.indexOf(i)] || '', sx, sy + 4); } }
  if (P.halves) { const dx = DIVX(e, B, P, L), [x0, y0] = r.proj(dx, A.y0), [x1, y1] = r.proj(dx, A.y0 + A.h);
    poly([[A.x0, A.y0], [dx, A.y0], [dx, A.y0 + A.h], [A.x0, A.y0 + A.h]], '#ffe9a0', 0.08); poly([[dx, A.y0], [A.x0 + A.w, A.y0], [A.x0 + A.w, A.y0 + A.h], [dx, A.y0 + A.h]], '#1a0a3a', 0.25);
    b.globalAlpha = 0.8; b.strokeStyle = '#ffffff'; b.lineWidth = 2; b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); b.globalAlpha = 1; }
  if (P.tether) { const n = noctOf(g, e); if (n && !n.dead) { const [ax, ay] = r.proj(e.x, e.y), [nx, ny] = r.proj(n.x, n.y);
    b.globalAlpha = 0.85; b.lineWidth = 5; b.strokeStyle = '#ffe9a0'; b.beginPath(); b.moveTo(ax, ay - 20); b.lineTo(nx, ny - 20); b.stroke();
    b.lineWidth = 2; b.strokeStyle = '#3a1a6a'; b.beginPath(); b.moveTo(ax, ay - 20); b.lineTo(nx, ny - 20); b.stroke(); b.globalAlpha = 1; } }
  if (B.allies) {                                     // the shield round you, the dome, the snare, the curse, the heal beam
    if (e.rfShieldUntil > g.t) { const a = g.t * 3.4; circle(g.player.x + Math.cos(a) * 1.25, g.player.y + Math.sin(a) * 1.25, 0.45, '#c8a040', 0.9); circle(g.player.x + Math.cos(a) * 1.25, g.player.y + Math.sin(a) * 1.25, 0.45, '#7ac85a', 0.9, true); }
    if (e.rfDomeUntil > g.t) { const left = e.rfDomeUntil - g.t;
      poly([[A.x0, A.y0], [A.x0 + A.w, A.y0], [A.x0 + A.w, A.y0 + A.h], [A.x0, A.y0 + A.h]], '#ff7a1a', 0.08 + 0.12 * (1 - Math.min(1, left / 3)));
      circle(e.rfDomeX, e.rfDomeY, e.rfDomeR || 2.3, '#fff6c8', 0.22); circle(e.rfDomeX, e.rfDomeY, e.rfDomeR || 2.3, '#ffd650', 0.9, true);
      const [dx, dy] = r.proj(e.rfDomeX, e.rfDomeY); b.fillStyle = '#ffffff'; b.font = '10px monospace'; b.textAlign = 'center'; b.fillText(String(Math.ceil(left)), dx, dy - 2); }
    const kn = allyOf(g, e, 'rfKnight'), pr = allyOf(g, e, 'rfPriest');
    if (kn && kn.rfSnareHp > 0) { circle(kn.x, kn.y, 1, '#2a6a2a', 0.5); circle(kn.x, kn.y, 1, '#7ac85a', 0.9, true); const [kx, ky] = r.proj(kn.x, kn.y); b.fillStyle = '#c8ff9a'; b.font = '10px monospace'; b.textAlign = 'center'; b.fillText(`vines ${kn.rfSnareHp}`, kx, ky - 36); }
    if (pr && pr.rfCurseUntil > g.t) { circle(pr.x, pr.y, 1.6, '#6a2a8a', 0.3); circle(pr.x, pr.y, 1.6, '#c8a0ff', 0.9, true); }
    if (pr && g.rfZ && g.rfZ.healFx > g.t) { const [ax, ay] = r.proj(pr.x, pr.y), [px2, py2] = r.proj(g.player.x, g.player.y); b.globalAlpha = 0.8; b.strokeStyle = '#9fffb0'; b.lineWidth = 3; b.beginPath(); b.moveTo(ax, ay - 16); b.lineTo(px2, py2 - 10); b.stroke(); b.globalAlpha = 1; }
  }
  if (e.rfBeam) { const live = !(e.rfBeamTele > 0), col = (B.shots[e.rfBeamS] && B.shots[e.rfBeamS].color) || '#ffe9a0', [sx, sy] = r.proj(e.x, e.y - 0.6);
    for (const a of beamArms(e)) { const RL = beamReach(g.map, e, a), [tx, ty] = r.proj(e.x + Math.cos(a) * RL, e.y - 0.6 + Math.sin(a) * RL);
      b.lineCap = 'round';
      if (!live) { if (Math.floor(g.t * 14) % 2) { b.globalAlpha = 0.8; b.strokeStyle = '#ff4a5a'; b.lineWidth = 2; b.setLineDash([6, 5]); b.beginPath(); b.moveTo(sx, sy); b.lineTo(tx, ty); b.stroke(); b.setLineDash([]); } }
      else { b.globalAlpha = 0.35; b.strokeStyle = col; b.lineWidth = 14; b.beginPath(); b.moveTo(sx, sy); b.lineTo(tx, ty); b.stroke();
        b.globalAlpha = 0.9; b.lineWidth = 6; b.beginPath(); b.moveTo(sx, sy); b.lineTo(tx, ty); b.stroke();
        b.strokeStyle = '#ffffff'; b.lineWidth = 2; b.beginPath(); b.moveTo(sx, sy); b.lineTo(tx, ty); b.stroke(); }
      b.globalAlpha = 1; b.lineCap = 'butt'; } }
  if (e.rfDig) { const k = e.rfBst === 'lock' ? 1 : 0.6 + 0.4 * Math.sin(g.t * 14);   // under the sand: a ripple (still, once it's locked)
    for (let j = 0; j < 3; j++) circle(e.x, e.y, 0.5 + j * 0.45 + (e.rfBst === 'lock' ? 0 : ((g.t * 2) % 1) * 0.4), '#8a6a3a', 0.55 * k * (1 - j * 0.25), true); }
  if (e.rfSgN) { const S = segsOf(e);
    for (let i = S.length - 1; i >= 0; i--) { const q = S[i], sc = i >= S.length - 3 ? 0.82 - 0.12 * (i - (S.length - 3)) : 1; circle(q.x, q.y + 0.35, 0.55 * sc, '#000000', 0.3);
      const [sx, sy] = r.proj(q.x, q.y + Math.sin(g.t * 3 + i) * 0.06); r.spriteAt(b, `rfx_shots/${B.id}.seg`, sx, sy, 2.2 * sc, ts); } }
  if (P.staff) for (let i = 0, n = P.staff.lines || 5; i < n; i++) {   // the stave: glowing grooves wall to wall
    const y = staffY(A, i, n), [x0, sy] = r.proj(A.x0, y), [x1] = r.proj(A.x0 + A.w, y);
    b.strokeStyle = '#05040a'; b.lineWidth = 4; b.globalAlpha = 0.5; b.beginPath(); b.moveTo(x0, sy); b.lineTo(x1, sy); b.stroke();
    b.strokeStyle = '#5ac8e8'; b.lineWidth = 2; b.globalAlpha = 0.45; b.beginPath(); b.moveTo(x0, sy); b.lineTo(x1, sy); b.stroke(); b.globalAlpha = 1; }
  if (ph.beat || P.beat) { const bt = beatOf(e), [cx, cy] = r.proj(e.x, e.y);      // the bar: four pips under him, the lit one the beat
    for (let k = 0; k < 4; k++) { b.fillStyle = '#05040a'; b.fillRect(cx - 29 + k * 15, cy + 22, 12, 8); b.fillStyle = k === bt ? (k === 3 && P.downbeat ? '#fff6a8' : '#8afcff') : 'rgba(255,255,255,.22)'; b.fillRect(cx - 28 + k * 15, cy + 23, 10, 6); } }
  if (P.downbeat && beatOf(e) === 3) { circle(e.x, e.y - 1, 2.6, '#fff6a8', 0.28); circle(e.x, e.y - 1, 2.6, '#fff6a8', 0.8, true); }   // the downbeat: he glows, and can be hurt
  if (P.warp) {                                      // Starflight: the floor falls away; stars and far worlds stream out of the middle
    const sp = P.warp.speed || 1, V = { x: e.x, y: e.y }, R0 = 0.3, R1 = Math.max(A.w, A.h) * 0.75;
    poly([[A.x0, A.y0], [A.x0 + A.w, A.y0], [A.x0 + A.w, A.y0 + A.h], [A.x0, A.y0 + A.h]], '#03020e', 0.92);
    circle(V.x, V.y, R1 * 0.6, '#5a3cb4', 0.14); circle(V.x, V.y, R1 * 0.3, '#7a5cd4', 0.12);
    b.lineCap = 'round';
    for (let k = 0; k < 55; k++) { const h = Math.sin(k * 12.9898) * 43758.5453, a = (h - Math.floor(h)) * TAU, u = (g.t * 0.32 * sp + k / 55) % 1, rr = R0 * Math.pow(R1 / R0, u), Ls = Math.min(1.4, rr * 0.18);
      const [x1, y1] = r.proj(V.x + Math.cos(a) * rr, V.y + Math.sin(a) * rr), [x0, y0] = r.proj(V.x + Math.cos(a) * (rr - Ls), V.y + Math.sin(a) * (rr - Ls)), al = Math.min(1, rr / (R1 * 0.45)) * 0.55;
      b.globalAlpha = al; b.strokeStyle = k % 5 === 0 ? '#ffd68c' : k % 5 === 1 ? '#a0c8ff' : '#f0f0ff'; b.lineWidth = 1 + al * 2; b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
    b.globalAlpha = 1; b.lineCap = 'butt';
    if (e.rfGateLeft > 0 || e.rfGateShow > 0) {     // the next gate's gap: a gold wedge, brighter as the ring comes
      const k = e.rfGateLeft > 0 ? 0.1 + 0.16 * Math.max(0, 1 - e.rfGateLeft / 1.3) : 0.22 * Math.max(0, e.rfGateShow / 1.4), pts = [[V.x, V.y]];
      for (let j = 0; j <= 10; j++) { const q = e.rfGateA - e.rfGateGap / 2 + (e.rfGateGap * j) / 10; pts.push([V.x + Math.cos(q) * R1, V.y + Math.sin(q) * R1]); }
      poly(pts, '#ffe066', k); } }
  if (P.chess) { const BD = BOARD(e, B);             // the hall a chessboard: its dark squares dimmed, gold lines between
    for (let y = 0; y < BD.rows; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) poly([[BD.x0 + x * BD.S, BD.y0 + y * BD.S], [BD.x0 + (x + 1) * BD.S, BD.y0 + y * BD.S], [BD.x0 + (x + 1) * BD.S, BD.y0 + (y + 1) * BD.S], [BD.x0 + x * BD.S, BD.y0 + (y + 1) * BD.S]], '#3c2058', 0.3); }
  if (e.rfShSt && e.rfShSt !== 'rest') {              // Find the Lady: three cabinets, a ring round each when it's time to choose
    for (let i = 0; i < 3; i++) { const x = e['rfSh' + i + 'x'], y = e['rfSh' + i + 'y']; if (x === undefined) continue;
      if (e.rfShSt === 'choose') { circle(x, y + 0.4, 1.3, '#ffe066', 0.16 + 0.08 * Math.sin(g.t * 6 + i)); circle(x, y + 0.4, 1.3, '#ffe066', 0.7 + 0.25 * Math.sin(g.t * 6 + i), true);
        if (i === e.rfShOn) { const [sx, sy] = r.proj(x, y + 0.4); b.strokeStyle = '#ffffff'; b.lineWidth = 4; b.beginPath(); b.arc(sx, sy, 1.3 * ts, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, (e.rfShHold || 0) / 0.5)); b.stroke(); } }
      circle(x, y + 1.3, 1.1, '#000000', 0.4);
      const [sx, sy] = r.proj(x, y); r.spriteAt(b, `rfx_shots/${B.id}.cabinet`, sx, sy, 2.9, ts);
      if (e['rfShO' + i]) circle(x, y - 0.4, 1.4, i === e.rfShRev ? '#8cffe6' : '#ffc878', 0.45); }
    if (e.rfShSt === 'choose') { b.textAlign = 'center'; const [sx, sy] = r.proj(e.rfSh1x, e.rfSh1y - 2.4); r.plabel(b, `Find the lady · ${(e.rfShLeft ?? 0).toFixed(1)}s`, sx, sy, 16, '#ffe066'); } }
  if (e.rfCzSt && e.rfCzSt !== 'rest' && e.rfCzI >= 0) {                     // the King's Gambit: the problem, in the middle of the hall
    const z = CHESS_PUZZLES[e.rfCzI], bd = czBoard(e, B), fade = e.rfCzSt === 'done' ? Math.max(0, 1 - (e.rfCzT || 0) / 1.4) : 1, sq = (c, rr) => czSq(e, B, c, rr);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) poly([[bd.ox + x * bd.S, bd.oy + y * bd.S], [bd.ox + (x + 1) * bd.S, bd.oy + y * bd.S], [bd.ox + (x + 1) * bd.S, bd.oy + (y + 1) * bd.S], [bd.ox + x * bd.S, bd.oy + (y + 1) * bd.S]], (x + y) % 2 ? '#28100c' : '#d6a03c', ((x + y) % 2 ? 0.62 : 0.42) * fade);
    const [bx0, by0] = r.proj(bd.ox, bd.oy), [bx1, by1] = r.proj(bd.ox + bd.S * 8, bd.oy + bd.S * 6);
    b.globalAlpha = fade; b.strokeStyle = '#05040a'; b.lineWidth = 4; b.strokeRect(bx0 - 2, by0 - 2, bx1 - bx0 + 4, by1 - by0 + 4); b.strokeStyle = '#f0c058'; b.lineWidth = 2; b.strokeRect(bx0 - 1, by0 - 1, bx1 - bx0 + 2, by1 - by0 + 2);
    const mc = sq(z.from[0], z.from[1]), [mx, my] = r.proj(mc.x, mc.y), px = bd.S * ts;
    z.opts.forEach((q, k) => { const o = sq(q[0], q[1]), [qx, qy] = r.proj(o.x, o.y);
      let col = `rgba(255,224,102,${0.55 + 0.35 * Math.sin(g.t * 6)})`;
      if (e.rfCzSt === 'done' && k === e.rfCzPick) col = e.rfCzOk ? '#78ff8c' : '#ff3c46'; else if (e.rfCzSt === 'done' && !e.rfCzOk && k === z.ans) col = 'rgba(120,255,140,.7)';
      b.fillStyle = col; b.globalAlpha = 0.28 * fade; b.fillRect(qx - px * 0.42, qy - px * 0.42, px * 0.84, px * 0.84); b.globalAlpha = fade;   // (a gold square you can stand on)
      b.strokeStyle = col; b.lineWidth = 4; b.strokeRect(qx - px * 0.42, qy - px * 0.42, px * 0.84, px * 0.84);
      b.setLineDash([4, 5]); b.lineWidth = 1.5; b.strokeStyle = 'rgba(255,224,102,.4)'; b.beginPath(); b.moveTo(mx, my); b.lineTo(qx, qy); b.stroke(); b.setLineDash([]);
      if (e.rfCzSt === 'show' && k === e.rfCzOn) { b.strokeStyle = '#ffffff'; b.lineWidth = 4; b.beginPath(); b.arc(qx, qy, px * 0.34, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, (e.rfCzHold || 0) / 0.6)); b.stroke(); } });
    for (const q of z.pieces) { if (e.rfCzSt === 'done' && e.rfCzOk && q[0] === 'bking') continue;
      const o = sq(q[1], q[2]); let x = o.x, y = o.y;
      if (e.rfCzSt === 'done' && q[1] === z.from[0] && q[2] === z.from[1] && e.rfCzPick >= 0) { const d = sq(...z.opts[e.rfCzPick]), k = Math.min(1, (e.rfCzT || 0) * 4); x += (d.x - x) * k; y += (d.y - y) * k; }
      if (q[1] === z.from[0] && q[2] === z.from[1]) circle(x, y, bd.S * 0.55, '#ffe066', 0.3 * fade);
      r.spriteAt(b, `rfx_shots/${B.id}.${q[0]}`, x, y, bd.S * 0.86); }
    if (e.rfCzSt === 'show') { b.textAlign = 'center'; r.plabel(b, `Mate in one · ${z.name} · ${(e.rfCzLeft ?? 0).toFixed(1)}s`, (bx0 + bx1) / 2, by0 - 10, 16, '#ffe066'); }
    b.globalAlpha = 1; }
  if (P.panes) for (const P2 of PANES(e, B, P)) {     // the panes: tall glass (a prism in its colours)
    const [x1, y1] = r.proj(P2.x1, P2.y1), [x2, y2] = r.proj(P2.x2, P2.y2);
    b.lineCap = 'round'; b.strokeStyle = '#05040a'; b.lineWidth = 7; b.beginPath(); b.moveTo(x1, y1 - 8); b.lineTo(x2, y2 - 8); b.stroke();
    b.strokeStyle = P2.kind === 'prism' ? `hsl(${(g.t * 120) % 360},90%,70%)` : '#bfe6ff'; b.lineWidth = 4; b.beginPath(); b.moveTo(x1, y1 - 8); b.lineTo(x2, y2 - 8); b.stroke();
    b.strokeStyle = '#ffffff'; b.lineWidth = 1; b.beginPath(); b.moveTo(x1, y1 - 9); b.lineTo(x2, y2 - 9); b.stroke(); b.lineCap = 'butt'; }
  if (e.rfRit) for (const q of runesOf(e.rfRit)) { circle(q.x, q.y, 0.85, q.done ? '#ffd650' : '#7a3ac8', q.done ? 0.55 : 0.35 + 0.2 * Math.sin(g.t * 8)); circle(q.x, q.y, 0.85, '#e8d0ff', 0.7, true); }
  if (P.crownOrbit) { const c = crownAt(e, B, P.crownOrbit); circle(c.x, c.y, 0.6, '#ffd650', 0.8); circle(c.x, c.y, 0.9, '#fff6c8', 0.5, true); }
  if (e.rfSock) { const S0 = socketAt(A); circle(S0.x, S0.y, 0.8, '#ffd650', 0.8, true); circle(S0.x, S0.y, 0.5, '#3a2a10', 0.5); }
  if (e.rfTx) { circle(e.rfTx, e.rfTy, 0.7, '#ffd650', 0.5); circle(e.rfTx, e.rfTy, 0.7, '#ffffff', 0.8, true); }
  if (P.spotlight && g.rfZ && g.rfZ.e === e && g.rfZ.spot) circle(g.rfZ.spot.x, g.rfZ.spot.y, P.spotlight.r, '#fff6c8', 0.25);
}
// ---- the Eclipse Twins (Lumen, the boss; Noct, a second body the server owns): Noct's hits go to Lumen until the last
// phase, when he has his own Life; he chases, orbits opposite Lumen, merges with him, then charges along marked lines. In
// the last phase Lumen will not fall while Noct stands, and a Noct who falls more than 10 s before Lumen comes back.
function twinKind(B, bal) {
  const id = `rfz_${B.id}_2`;
  if (!ENEMIES[id]) ENEMIES[id] = { name: String(B.title || '').split(' and ')[1] || 'the Twin', biome: 'dungeon', hp: Math.round(B.hp * bal.bossHp * 0.25), def: bal.bossDef ?? 0, speed: 0, xp: 0, r: 1.2,
    ai: 'rooted', aggro: 0, reg: `bx_rf_${B.id}/rf_${B.id}_2`, scale: 2, contact: 0, attacks: [], loot: [] };
  return id;
}
function twinStep(g, e, B, bal, dt, ph) {
  const S = e.bx, P = ph.rfP, last = S.phase === B.phases.length, q = g.player;
  let n = e.rfNoct;
  if (!n || (n.dead && !last)) {                        // Noct rises (and, but in the last phase, never stays down)
    n = e.rfNoct = g.addEnemy(twinKind(B, bal), e.x + 3, e.y); n.seen = true; n.noLoot = true; n.rfTwinOf = e;
    if (last) n.hp = Math.round(n.maxHp * 0.5);
  }
  if (n.nid) e.rfNoctNid = n.nid;
  n.linkTo = last ? null : e;                           // his hits are Lumen's, till the end
  if (last && !e.rfLastSeen) { e.rfLastSeen = true; n.hp = n.maxHp; g.banner(`${B.title || 'The twins'} split apart: kill them both, close together`, 2600); }
  if (last && n.dead) {
    e.rfNoctDown = e.rfNoctDown ?? S.t;
    if (S.t - e.rfNoctDown > 10 && !e.dead) { e.rfNoctDown = undefined; n = e.rfNoct = g.addEnemy(twinKind(B, bal), e.x + 3, e.y); n.seen = true; n.noLoot = true; n.hp = Math.round(n.maxHp * 0.5); g.banner(`${String(B.title || '').split(' and ')[0] || 'Lumen'} calls ${n.D.name} back!`, 2400); }
    return;
  }
  e.rfNoctDown = undefined;
  const M = P.mv2 || { m: 'center' }, A = box(e, B), H = homeOf(e);
  const step = (tx, ty, sp) => { const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy); if (d > 0.15) g.moveCircle(n, (dx / d) * Math.min(d, sp * dt), (dy / d) * Math.min(d, sp * dt), 0.8); };
  if (M.m === 'chase') { const d = Math.hypot(q.x - n.x, q.y - n.y); if (d > (M.keep || 5)) step(q.x, q.y, M.spd || 2.4); }
  else if (M.m === 'orbit') step(2 * H.x - e.x, 2 * H.y - e.y, 4);           // opposite Lumen round the middle
  else if (M.m === 'center') step(e.x + 1.2, e.y, 6);                         // merged: at his side
  else if (M.m === 'charge') {                                               // a marked line, then the charge
    const C = e.rfCharge;
    if (C && g.t >= C.at) { const k = Math.min(1, (g.t - C.at) / C.T); n.x = C.x0 + (C.x1 - C.x0) * k; n.y = C.y0 + (C.y1 - C.y0) * k; if (k >= 1) e.rfCharge = null; }
    else if (!C && (e.rfChargeT = (e.rfChargeT ?? M.every ?? 2.2) - dt) <= 0) {
      e.rfChargeT = M.every || 2.2;
      const a = Math.atan2(q.y - n.y, q.x - n.x), L = Math.min(12, Math.hypot(q.x - n.x, q.y - n.y) + 3);
      const x1 = Math.max(A.x0 + 1, Math.min(A.x0 + A.w - 1, n.x + Math.cos(a) * L)), y1 = Math.max(A.y0 + 1, Math.min(A.y0 + A.h - 1, n.y + Math.sin(a) * L)), len = Math.hypot(x1 - n.x, y1 - n.y);
      g.fx.push({ kind: 'lane', x: n.x, y: n.y, a, len, w: 0.9, delay: M.warn || 0.7, t: 0, life: (M.warn || 0.7) + len / (M.spd || 16) + 0.1, dmg: Math.round(140 * bal.bossDmg), by: n.D.name, hitT: 0, cols: ['#8a5ad0', '#c8a0ff', '#3a1a6a', '#ffffff'] });
      e.rfCharge = { x0: n.x, y0: n.y, x1, y1, at: g.t + (M.warn || 0.7), T: Math.max(0.1, len / (M.spd || 16)) };
    }
  }
}
// ---- Lord Gourdrick's friends (the server's creatures, friendly: your shots pass through them, but for the knight's
// vines). Sir Rindley holds the left edge: he charges the Lord now and then, and hurls his Rind Shield to you (it circles
// you 3.5 s and stops the shots it touches). Sister Honeydew holds the right edge: a beam of healing to you every 6 s.
// Snare: the knight caught in vines (shoot them free: the Lord staggers; too slow and he goes down a while). Harvest
// Moon: a dome near you, then the sky outside it burns. Rotten Harvest: the priest cursed (stand beside her to break it:
// she heals you and the Lord staggers; too slow and rot bursts out of her). The rest happens where you play (arenaRules).
function allyKind(B, al) {
  const id = `rfz_${B.id}_${al.id}`;
  if (!ENEMIES[id]) ENEMIES[id] = { name: al.name, biome: 'dungeon', hp: al.hp, def: 0, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 0, reg: `bx_rf_${B.id}/rf_${B.id}_${al.id}`, scale: 2, contact: 0, attacks: [], loot: [] };
  return id;
}
function allyStep(g, e, B, bal, dt, ph) {
  const S = e.bx, P = ph.rfP, A = box(e, B), who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player], near = who.reduce((a, q) => (Math.hypot(q.x - e.x, q.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? q : a), who[0]);
  const make = (al, x) => { const m = g.addEnemy(allyKind(B, al), x, A.y0 + A.h / 2); m.friendly = true; m.seen = true; m.noLoot = true; m.invulnT = 0; return m; };
  for (const al of B.allies) {
    const key = al.role === 'knight' ? 'rfKnight' : 'rfPriest';
    if (!e[key] || e[key].dead) e[key] = make(al, al.role === 'knight' ? A.x0 + 1.5 : A.x0 + A.w - 1.5);
    const m = e[key]; if (m.nid) e[key + 'Nid'] = m.nid;
    const down = m.rfDownUntil > g.t;
    // hold the sideline, level with the nearest player
    if (!m.rfDash) { const ty = Math.max(A.y0 + 2, Math.min(A.y0 + A.h - 2, near.y)), tx = al.role === 'knight' ? A.x0 + 1.5 : A.x0 + A.w - 1.5, d = Math.hypot(tx - m.x, ty - m.y); if (d > 0.2 && !(m.rfSnareHp > 0) && !(m.rfCurseUntil > g.t)) g.moveCircle(m, ((tx - m.x) / d) * Math.min(d, 3 * dt), ((ty - m.y) / d) * Math.min(d, 3 * dt), 0.5); }
    if (down || S.state === 'morph') continue;
    if (al.role === 'knight') {
      if (m.rfSnareHp > 0) {                               // snared: shoot the vines
        if (g.t > m.rfSnareUntil) { m.rfSnareHp = 0; m.rfDownUntil = g.t + 6; g.banner('The vines take Sir Rindley down!', 1800); const s = B.shots.seed || {}; for (let k = 0; k < 12; k++) g.shoot('e', m.x, m.y - 0.5, (k / 12) * TAU, s.speed || 5, s.range || 7, Math.round((s.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.seed`, 0.35, false, e.D.name); }
        continue;
      }
      if (m.rfWasSnared) { m.rfWasSnared = false; e.rfStagT = 3; g.banner('Free! Now, together! (the Lord staggers)', 1800); m.rfChg = 0; }
      if (m.rfDash) {                                     // the charge: to the Lord and back, a blow on the way
        const D = m.rfDash; D.t += dt; const k = D.t < 0.45 ? D.t / 0.45 : D.t < 0.9 ? 1 - (D.t - 0.45) / 0.45 : 0;
        m.x = D.x0 + (e.x - D.x0) * k; m.y = D.y0 + (e.y - D.y0) * k;
        if (D.t >= 0.45 && !D.hit) { D.hit = true; e.netRawHit = true; try { g.damageEnemy(e, Math.round(e.maxHp * 0.01), e.x, e.y, true); } finally { e.netRawHit = false; } g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 14, colors: ['#7ac85a', '#ffd650'] }); }
        if (D.t >= 0.9) m.rfDash = null;
      } else if ((m.rfChg = (m.rfChg ?? 3) - dt) <= 0) { m.rfChg = 6 + Math.random() * 2; m.rfDash = { t: 0, x0: m.x, y0: m.y }; }
      if ((m.rfSh = (m.rfSh ?? 3) - dt) <= 0) { m.rfSh = P.shieldEvery || 8; e.rfShieldUntil = g.t + 3.5; }   // the Rind Shield, to you
      if (P.snare && (e.rfSnT = (e.rfSnT || 0) + dt) >= P.snare.every) { e.rfSnT = 0; m.rfSnareHp = P.snare.hp; m.rfSnareUntil = g.t + P.snare.time; m.rfWasSnared = true; m.rfDash = null; g.banner(`"${P.snare.say || 'Caught you, little melon.'}" Sir Rindley is snared: shoot the vines!`, 2400); }
    } else {
      if (m.rfCurseUntil > g.t) {                          // cursed: stand beside her
        if (who.some((q) => !q.dead && Math.hypot(q.x - m.x, q.y - m.y) < 1.6)) e.rfCurseProg = (e.rfCurseProg || 0) + dt;
        if (e.rfCurseProg >= P.curse.need) { m.rfCurseUntil = 0; e.rfCurseK = (e.rfCurseK || 0) + 1; e.rfStagT = 2.5; g.banner('You broke the curse! Bless you! (the Lord staggers)', 2000); }
        continue;
      }
      if (m.rfCursed) { m.rfCursed = false; if (!(e.rfCurseProg >= (P.curse ? P.curse.need : 0))) { m.rfDownUntil = g.t + 5; const s = B.shots.rot || {}; for (let k = 0; k < 14; k++) g.shoot('e', m.x, m.y - 0.5, (k / 14) * TAU, s.speed || 5, s.range || 7, Math.round((s.dmg || 80) * bal.bossDmg), `rfx_shots/${B.id}.rot`, 0.35, false, e.D.name); g.banner('The curse bursts out of her as rot!', 1800); } }
      if ((m.rfHeal = (m.rfHeal ?? 2) - dt) <= 0) { m.rfHeal = P.healEvery || 6; e.rfHealK = (e.rfHealK || 0) + 1; }   // a beam of healing (each player's browser heals its own)
      if (P.curse && (e.rfCuT = (e.rfCuT || 0) + dt) >= P.curse.every) { e.rfCuT = 0; m.rfCurseUntil = g.t + P.curse.time; m.rfCursed = true; e.rfCurseProg = 0; g.banner(`"${P.curse.say || 'Sleep, little priest.'}" Sister Honeydew is cursed: stand beside her!`, 2400); }
      if (P.dome) {                                      // the Harvest Moon: her dome near the nearest player, then the sky burns
        const c = (e.rfPhT || 0) % P.dome.every;
        if (c >= P.dome.every - P.dome.warn && !(e.rfDomeUntil > g.t) && (e.rfPhT || 0) > P.dome.warn) {
          const cx = A.x0 + A.w / 2, cy = A.y0 + A.h * 0.55, dx = cx - near.x, dy = cy - near.y, dl = Math.hypot(dx, dy) || 1, k = Math.min(dl, 2.5);
          e.rfDomeX = near.x + (dx / dl) * k; e.rfDomeY = near.y + (dy / dl) * k; e.rfDomeUntil = g.t + (P.dome.every - c); e.rfDomeR = P.dome.r || 2.3; e.rfDomeLit = true;
        }
        if (e.rfDomeLit && g.t >= e.rfDomeUntil) { e.rfDomeLit = false; e.rfDomeK = (e.rfDomeK || 0) + 1; g.vx({ k: 'shake', amt: 6 }); }   // it falls (each browser: in or out)
      }
    }
  }
}
// ---- Vitrea, the Thousandfold. Her reflections are the server's creatures in her own art (flipped, casting no shadow).
// Mirror Image and Echoes: they stand where her mirror would put her (across the hall, or turned), some a moment late,
// and fire what she fires (the late ones late); one spins its own spiral. The panes on the walls bounce her shots (in
// your browser) and her Lightray, which marks every bounce. The Thousandfold: eight of her round the hall, one real;
// a reflection you shoot shatters and fires back; 16 blows on the real one shatter them all, and they shuffle.
const PANES = (e, B, P) => { const A = box(e, B); return (P.panes || []).map(([x1, y1, x2, y2, kind]) => ({ x1: A.x0 + x1 * A.w, y1: A.y0 + y1 * A.h, x2: A.x0 + x2 * A.w, y2: A.y0 + y2 * A.h, kind: kind || 'mirror' })); };
function segX(ax, ay, bx, by, p) {
  const dx = bx - ax, dy = by - ay, ex = p.x2 - p.x1, ey = p.y2 - p.y1, den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p.x1 - ax) * ey - (p.y1 - ay) * ex) / den, u = ((p.x1 - ax) * dy - (p.y1 - ay) * dx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, x: ax + dx * t, y: ay + dy * t } : null;
}
function reflectV(vx, vy, p) { const ex = p.x2 - p.x1, ey = p.y2 - p.y1, L = Math.hypot(ex, ey) || 1, nx = -ey / L, ny = ex / L, d = vx * nx + vy * ny; return [vx - 2 * d * nx, vy - 2 * d * ny]; }
function echoKind(B, hp) {
  const id = `rfz_${B.id}_echo`;
  if (!ENEMIES[id]) ENEMIES[id] = { name: 'a Reflection', biome: 'dungeon', hp, def: 0, speed: 0, xp: 0, r: 1.1, ai: 'rooted', aggro: 0, reg: `bx_rf_${B.id}/rf_${B.id}_echo`, scale: 2, contact: 0, attacks: [], loot: [] };
  return id;
}
const slotAt = (e, B, P, i) => { const A = box(e, B), n = P.thousand.n || 8, r = P.thousand.r || 4.6, a = (e.rfPhT || 0) * 0.25 + (i * TAU) / n; return { x: A.x0 + A.w / 2 + Math.cos(a) * r, y: A.y0 + A.h / 2 + Math.sin(a) * r * 0.62 }; };
function clonePos(e, B, c, S) {
  const A = box(e, B), cx = A.x0 + A.w / 2, cy = A.y0 + A.h / 2, H = e.rfHist || [], tb = S.t - (c.delay || 0);
  let q = { x: e.x, y: e.y }; for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= tb) { q = H[i]; break; }
  if (c.mode === 'mx') return { x: 2 * cx - q.x, y: q.y };
  if (c.mode === 'my') return { x: q.x, y: 2 * cy - q.y };
  if (c.mode === 'pt') return { x: 2 * cx - q.x, y: 2 * cy - q.y };
  const a = (c.rot || 90) * D2R, dx = q.x - cx, dy = q.y - cy; return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
}
function vitreaStep(g, e, B, bal, dt, ph) {
  const S = e.bx, P = ph.rfP, who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player];
  const H = (e.rfHist = e.rfHist || []); H.push({ t: S.t, x: e.x, y: e.y }); while (H.length && H[0].t < S.t - 3) H.shift();
  const mk = (x, y, friendly) => { const m = g.addEnemy(echoKind(B, 1), x, y); m.seen = true; m.noLoot = true; m.noShadow = true; m.flipArt = true; m.friendly = !!friendly; m.rfOf = e; return m; };
  // Mirror Image, Echoes: her reflections where her mirrors put her (shots pass through them)
  const CL = P.clones || [];
  e.rfEchoes = (e.rfEchoes || []).filter((m) => !m.dead);
  while (e.rfEchoes.length > CL.length) { const m = e.rfEchoes.pop(); m.noLoot = true; m.dead = true; m.deadT = 0; }
  CL.forEach((c, i) => { const at = clonePos(e, B, c, S); let m = e.rfEchoes[i]; if (!m) m = e.rfEchoes[i] = mk(at.x, at.y, true); m.x = at.x; m.y = at.y; m.face = at.x < e.x;
    if (c.em) for (const [k, em] of c.em.entries()) { const key = 'rfCe' + i + k; if ((m[key] = (m[key] ?? 0.6) - dt) <= 0) { m[key] = em.e || 1; m.rfCv = (m.rfCv || 0) + 1; fire(g, e, B, bal, em, m.rfCv, { x: m.x, y: m.y - 1 }); } } });
  // their shots, late
  if (e.rfEchoQ && e.rfEchoQ.length) { const now = e.rfEchoQ.filter((q) => q.at <= S.t); e.rfEchoQ = e.rfEchoQ.filter((q) => q.at > S.t); for (const q of now) { const at = clonePos(e, B, q.c, { t: S.t }); fire(g, e, B, bal, q.em, q.v, { x: at.x, y: at.y - 1 }); } }
  if (!CL.length) e.rfEchoQ = [];
  // the Thousandfold
  const T = P.thousand;
  e.rfMirrors = e.rfMirrors || [];
  if (!T) { for (const m of e.rfMirrors) if (!m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; } e.rfMirrors = []; e.rfSlotX = undefined; e.rfSlotY = undefined; return; }
  const n = T.n || 8;
  if (e.rfTrue === undefined) { e.rfTrue = Math.floor(Math.random() * n); e.rfThHits = 0; e.rfLastHp = e.hp; g.banner('Eight of her. Only one is real: find the one with a shadow', 2600); }
  const me = slotAt(e, B, P, e.rfTrue); e.rfSlotX = me.x; e.rfSlotY = me.y; e.x = me.x; e.y = me.y;
  e.rfBroke = e.rfBroke || {};
  for (let i = 0, k = 0; i < n; i++) {
    if (i === e.rfTrue) continue;
    const at = slotAt(e, B, P, i); let m = e.rfMirrors[k];
    if (m && m.dead && !m.rfShattered) {                 // shot: it shatters and fires back
      m.rfShattered = true; e.rfBroke[k] = S.t + 2.5;
      const q = who.reduce((a, b) => (Math.hypot(b.x - m.x, b.y - m.y) < Math.hypot(a.x - m.x, a.y - m.y) ? b : a), who[0]), a = Math.atan2(q.y - m.y, q.x - m.x), s = B.shots.sliver || {};
      for (let j = -1; j <= 1; j++) g.shoot('e', m.x, m.y - 1, a + j * 0.2, s.speed || 7, s.range || 9, Math.round((s.dmg || 90) * bal.bossDmg), `rfx_shots/${B.id}.sliver`, 0.35, false, e.D.name);
    }
    if ((!m || m.dead) && !(e.rfBroke[k] > S.t)) m = e.rfMirrors[k] = mk(at.x, at.y, false);
    if (m && !m.dead) { m.x = at.x; m.y = at.y; }
    k++;
  }
  // blows on the real one (each frame she lost Life counts one): at 16 every reflection shatters, and they shuffle
  if (e.hp < e.rfLastHp) e.rfThHits++;
  e.rfLastHp = e.hp;
  if (T.shuffle && (e.rfShufT = (e.rfShufT ?? T.shuffle) - dt) <= 0) { e.rfShufT = T.shuffle; const was = e.rfTrue; while (n > 1 && e.rfTrue === was) e.rfTrue = Math.floor(Math.random() * n); g.banner('The reflections shuffle', 1400); }   // (every few seconds she trades places)
  if (e.rfThHits >= (T.hits || 16)) {
    e.rfThHits = 0; e.rfShufT = T.shuffle; g.banner('The true Vitrea cracks! Every reflection shatters', 2000);
    const s = B.shots.shard || B.shots.sliver || {};
    for (const m of e.rfMirrors) if (m && !m.dead) { for (let j = 0; j < 8; j++) g.shoot('e', m.x, m.y - 1, (j * TAU) / 8, s.speed || 6, s.range || 7, Math.round((s.dmg || 80) * bal.bossDmg), `rfx_shots/${B.id}.${B.shots.shard ? 'shard' : 'sliver'}`, 0.35, false, e.D.name); m.noLoot = true; m.dead = true; m.deadT = 0; m.rfShattered = true; }
    e.rfMirrors = []; e.rfBroke = {}; for (let k = 0; k < n - 1; k++) e.rfBroke[k] = S.t + 2.5; e.rfTrue = Math.floor(Math.random() * n);   // (back in a moment)
  }
}
// ---- Sarrukh, the Dunesea Wyrm: a head that steers and a body of segments that follows its path. The segments are
// plain numbers on it (rfSg<i>x/y, rfSgN of them), so every player sees the same body; touching one hurts (in your
// browser), and each throws grit off its sides (or, in the Coil, straight out from the middle). Underground, it's none.
function wormSteer(e, A, tx, ty, sp, turn, dt) {
  const want = Math.atan2(ty - e.y, tx - e.x); let wa = e.rfWa ?? want, d = Math.atan2(Math.sin(want - wa), Math.cos(want - wa));
  wa += Math.max(-turn * dt, Math.min(turn * dt, d)); e.rfWa = wa;
  e.x = Math.max(A.x0 + 1, Math.min(A.x0 + A.w - 1, e.x + Math.cos(wa) * sp * dt)); e.y = Math.max(A.y0 + 1, Math.min(A.y0 + A.h - 1, e.y + Math.sin(wa) * sp * dt));
  wormBody(e, (e.rfMv && e.rfMv.segs) || 9);
}
function wormBody(e, n) {
  const h = (e.rfHist = e.rfHist || []), last = h[h.length - 1];
  if (!last || Math.hypot(last.x - e.x, last.y - e.y) > 0.12) h.push({ x: e.x, y: e.y });
  const gap = 0.95, need = (n + 2) * gap; let L = 0;
  for (let i = h.length - 1; i > 0; i--) { L += Math.hypot(h[i].x - h[i - 1].x, h[i].y - h[i - 1].y); if (L > need) { h.splice(0, i - 1); break; } }
  if (e.rfDig) { e.rfSgN = 0; return; }
  let acc = 0, j = h.length - 1, px = e.x, py = e.y, k = 0;
  for (k = 1; k <= n; k++) { const target = k * gap; let ok = false;
    while (j > 0) { const q = h[j - 1], dd = Math.hypot(q.x - px, q.y - py); if (acc + dd >= target) { const t = (target - acc) / (dd || 1); px += (q.x - px) * t; py += (q.y - py) * t; acc = target; ok = true; break; } acc += dd; px = q.x; py = q.y; j--; }
    if (!ok) break; e['rfSg' + (k - 1) + 'x'] = px; e['rfSg' + (k - 1) + 'y'] = py; }
  e.rfSgN = k - 1;
}
const segsOf = (e) => Array.from({ length: e.rfSgN || 0 }, (_, i) => ({ x: e['rfSg' + i + 'x'], y: e['rfSg' + i + 'y'], k: i }));
// ---- Beams that last: Mother Mire's ray turns after you (so many degrees a second, for its two seconds), the Cantor's
// light and Elderbark's lashes sweep round him, the Magistrate's pendulum swings below him. Marked first, then live.
// The angle is a plain number on the boss (rfBeamA), so all see the same beam; each browser feels its own player's touch.
function beamStep(g, e, dt) {
  if (e.rfBeamPh !== e.bx.phase || e.bx.state === 'morph' || e.bx.state === 'death' || e.bx.state === 'deathhold') { e.rfBeam = ''; return; }
  e.rfBeamT += dt;
  if (e.rfBeamTele > 0) { e.rfBeamTele -= dt; if (e.rfBeam !== 'track') return; }
  if (e.rfBeam === 'track') { const who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player], q = who.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a), who[0]);
    const want = Math.atan2(q.y - e.y, q.x - e.x), d = Math.atan2(Math.sin(want - e.rfBeamA), Math.cos(want - e.rfBeamA)), k = e.rfBeamTele > 0 ? 3 : 1;   // (marked: it settles on you; live: it chases slower)
    e.rfBeamA += Math.max(-e.rfBeamW * k * dt, Math.min(e.rfBeamW * k * dt, d));
    if (e.rfBeamTele <= 0 && (e.rfBeamLeft -= dt) <= 0) e.rfBeam = ''; }
  else if (e.rfBeam === 'sweep') e.rfBeamA += e.rfBeamW * dt;
  else e.rfBeamA = Math.PI / 2 + (e.rfBeamArc / 2) * Math.sin((TAU * e.rfBeamT) / e.rfBeamPer);
}
const beamArms = (e) => Array.from({ length: e.rfBeamN || 1 }, (_, k) => e.rfBeamA + (k * TAU) / (e.rfBeamN || 1));
function beamReach(m, e, a) {                                     // as far as the first wall (pillars let it by)
  const L = e.rfBeamL || 10; if (!m || !m.solid) return L;
  for (let d = 0.5; d < L; d += 0.25) { const x = Math.floor(e.x + Math.cos(a) * d), y = Math.floor(e.y + Math.sin(a) * d), i = y * m.w + x;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return d; if (m.solid[i] && !(m.shotPass && m.shotPass.has(i)) && !m.rfSolid) return d; }
  return L;
}
// ---- The Cantor: his stave's five lines across the chapel, the beat (four to a bar, 0.75s each) on the phase clock
const staffY = (A, i, n) => A.y0 + A.h * (0.24 + (0.62 * i) / (n - 1));
const beatOf = (e) => Math.floor((e.rfPhT || 0) / 0.75) % 4;
// ---- King Morvane's board. In Checkmate and the Hollow Crown the hall is a chessboard eight squares wide: pieces appear
// near you and strike their own ways (rook: row and column; bishop: diagonals; queen: both; knight: every L-jump away).
// In the King's Gambit he sets a problem in the middle of the hall: white to move, mate in one. Stand on the square you
// want to play for a moment. The mate shatters the Black King and staggers him; a wrong move, or none, and every black
// piece strikes along its lines. The state is plain values on him, so every player sees the same problem.
const BOARD = (e, B) => { const A = box(e, B), S = A.w / 8; return { S, x0: A.x0, y0: A.y0, rows: Math.max(1, Math.floor(A.h / S)) }; };
const CHESS_PUZZLES = [
  { name: 'Back-rank mate', mover: 'rook', pieces: [['bking', 6, 0], ['bpawn', 5, 1], ['bpawn', 6, 1], ['bpawn', 7, 1], ['wrook', 0, 4]], from: [0, 4], opts: [[0, 0], [0, 2], [3, 4], [6, 4]], ans: 0,
    why: "the rook takes the back rank, and the king's own pawns keep it there" },
  { name: "The queen's kiss", mover: 'queen', pieces: [['bking', 4, 0], ['wking', 4, 2], ['wqueen', 7, 4]], from: [7, 4], opts: [[7, 0], [4, 1], [7, 1], [4, 4]], ans: 1,
    why: 'the queen lands right in front of the king, and your king guards her' },
  { name: 'Smothered mate', mover: 'knight', pieces: [['bking', 7, 0], ['brook', 6, 0], ['bpawn', 6, 1], ['bpawn', 7, 1], ['wknight', 4, 3]], from: [4, 3], opts: [[6, 2], [2, 2], [5, 1], [3, 1]], ans: 2,
    why: 'boxed in by its own pieces, the king has nowhere to go' },
  { name: 'The rook ladder', mover: 'rook', pieces: [['bking', 3, 0], ['wrook', 0, 1], ['wrook', 7, 4]], from: [7, 4], opts: [[3, 4], [7, 1], [7, 0], [5, 4]], ans: 2,
    why: 'one rook holds the second rank, the other checks along the first' },
  { name: 'Opposition', mover: 'rook', pieces: [['bking', 2, 0], ['wking', 2, 2], ['wrook', 7, 3]], from: [7, 3], opts: [[7, 1], [2, 3], [7, 5], [7, 0]], ans: 3,
    why: 'your king takes every square in front; the rook checks along the edge' },
];
const czBoard = (e, B) => { const A = box(e, B), S = Math.min((A.w * 0.8) / 8, (A.h * 0.6) / 6); return { S, ox: A.x0 + A.w / 2 - 4 * S, oy: A.y0 + A.h * 0.6 - 3 * S }; };
const czSq = (e, B, c, r) => { const b = czBoard(e, B); return { x: b.ox + (c + 0.5) * b.S, y: b.oy + (r + 0.5) * b.S, S: b.S }; };
function chessStep(g, e, B, bal, dt, C) {
  const who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player];
  if (!e.rfCzSt) { e.rfCzSt = 'rest'; e.rfCzT = C.rest - 1; e.rfCzI = -1; }
  e.rfCzT += dt;
  if (e.rfCzSt === 'rest') { if (e.rfCzT >= C.rest) { let i; do i = Math.floor(Math.random() * CHESS_PUZZLES.length); while (i === e.rfCzI && CHESS_PUZZLES.length > 1);
      e.rfCzI = i; e.rfCzSt = 'show'; e.rfCzT = 0; e.rfCzOn = -1; e.rfCzHold = 0; e.rfCzPick = -1; e.rfCzOk = false;
      g.banner(`Checkmate in one: move the white ${CHESS_PUZZLES[i].mover}. Stand on a gold square to play it`, 3000); }
    return; }
  const z = CHESS_PUZZLES[e.rfCzI];
  if (e.rfCzSt === 'show') {
    let on = -1; z.opts.forEach((q, k) => { const c = czSq(e, B, q[0], q[1]); if (who.some((p) => !p.dead && Math.abs(p.x - c.x) < c.S * 0.42 && Math.abs(p.y - c.y) < c.S * 0.42)) on = k; });
    if (on !== e.rfCzOn) { e.rfCzOn = on; e.rfCzHold = 0; }
    if (on >= 0) e.rfCzHold += dt;
    e.rfCzLeft = Math.max(0, C.time - e.rfCzT);
    if (on >= 0 && e.rfCzHold >= 0.6) return czResolve(g, e, B, bal, on === z.ans, on);
    if (e.rfCzT >= C.time) return czResolve(g, e, B, bal, false, -1);
    return; }
  if (e.rfCzSt === 'done' && e.rfCzT >= 1.4) { e.rfCzSt = 'rest'; e.rfCzT = 0; }
}
function czResolve(g, e, B, bal, ok, pick) {
  const z = CHESS_PUZZLES[e.rfCzI]; e.rfCzSt = 'done'; e.rfCzT = 0; e.rfCzOk = ok; e.rfCzPick = pick;
  if (ok) { const k = z.pieces.find((q) => q[0] === 'bking'), c = czSq(e, B, k[1], k[2]);
    e.rfStagT = 3.5; e.rfCzWon = (e.rfCzWon || 0) + 1;
    g.vx({ k: 'burst', x: c.x, y: c.y, n: 24, colors: ['#ffffff', '#ffe066', '#c8a0ff'] }); g.float(e.x, e.y - 3, 'CHECKMATE!', '#ffe066');
    g.banner(`Checkmate! ${z.why[0].toUpperCase() + z.why.slice(1)}. (Morvane staggers)`, 2600); return; }
  g.banner(pick < 0 ? '"Too slow. My move."' : '"A poor move. My move."', 2000);
  const s = B.shots.royal || {}, L = box(e, B).w * 1.5, dmg = Math.round((s.dmg || 90) * bal.bossDmg);
  for (const q of z.pieces) { if (q[0][0] !== 'b') continue; const c = czSq(e, B, q[1], q[2]);   // every black piece strikes along its lines
    const dirs = q[0] === 'bpawn' ? [[1, 1], [-1, 1]] : q[0] === 'bking' ? [[1, 0], [0, 1], [1, 1], [1, -1]] : [[1, 0], [0, 1]];
    for (const [dx, dy] of dirs) { const a = Math.atan2(dy, dx), pawn = q[0] === 'bpawn';
      g.fx.push({ kind: 'laser', x0: pawn ? c.x : c.x - Math.cos(a) * L, y0: pawn ? c.y : c.y - Math.sin(a) * L, a, len: pawn ? c.S * 2.2 : L * 2, t: 0, tele: 0.9, act: 0.45, life: 1.45, dmg, by: e.D.name, hit: false }); } }
}
// ---- Mirabeau's Find the Lady. He steps into one of three cabinets, the doors close, and they shuffle (a swap at a
// time, lifting over each other, each round a little faster). While hidden he is out of reach, and the cabinets throw
// cards of their own. Then stand beside a cabinet for half a second to open it: his, and he stumbles out staggered;
// the wrong one bursts into cards and doves; too slow, and both empties burst. Cabinets are plain values on him, so
// every player watches the same shuffle (which one is his stays on the server till it opens).
const shHome = (e, B, i) => { const A = box(e, B); return { x: A.x0 + A.w * (0.25 + 0.25 * i), y: A.y0 + A.h * 0.46 }; };
function shellEnd(e) { e.rfShSt = ''; e.rfHide = false; e.hidden = false; e.under = false; e.rfSlotX = undefined; e.rfSlotY = undefined; }
function shellStep(g, e, B, bal, dt, C) {
  const who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player], Z = (e.rfShZ = e.rfShZ || { round: 0 });
  const cup = (i) => ({ x: e['rfSh' + i + 'x'], y: e['rfSh' + i + 'y'] }), put = (i, x, y) => { e['rfSh' + i + 'x'] = x; e['rfSh' + i + 'y'] = y; };
  if (!e.rfShSt) { e.rfShSt = 'rest'; e.rfShT = C.rest - 1; for (let i = 0; i < 3; i++) { const h = shHome(e, B, i); put(i, h.x, h.y); } }
  e.rfShT += dt;
  if (e.rfShSt === 'rest') { if (e.rfShT >= C.rest) { Z.hid = Math.floor(Math.random() * 3); Z.round++; e.rfShSt = 'enter'; e.rfShT = 0; e.rfShOn = -1; e.rfShHold = 0; e.rfShRev = -1;
      for (let i = 0; i < 3; i++) { const h = shHome(e, B, i); put(i, h.x, h.y); e['rfShO' + i] = false; }
      g.banner(['"Find the lady!"', '"Keep your eye on the cabinet!"', '"Which one, which one?"'][(Z.round - 1) % 3], 2000); }
    return; }
  const mine = cup(Z.hid);
  if (e.rfShSt === 'enter') {                         // he walks into his cabinet, and the doors close
    e.rfSlotX = e.x + (mine.x - e.x) * Math.min(1, dt * 6); e.rfSlotY = e.y + (mine.y - e.y) * Math.min(1, dt * 6); e.x = e.rfSlotX; e.y = e.rfSlotY;
    if (e.rfShT >= 1) { e.rfHide = e.hidden = e.under = true; e.rfShSt = 'shuffle'; e.rfShT = 0; Z.k = 0; Z.ct = 0; Z.from = null; Z.swaps = [];
      for (let i = 0; i < C.swaps + Math.min(4, Z.round - 1); i++) { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 3); if (b === a) b = (a + 1) % 3; Z.swaps.push([a, b]); }
      Z.dur = Math.max(0.3, 0.55 - 0.06 * (Z.round - 1)); }
    return; }
  if (e.rfShSt !== 'done') { e.rfSlotX = mine.x; e.rfSlotY = mine.y; e.x = mine.x; e.y = mine.y; }
  if (e.rfShSt === 'shuffle' || e.rfShSt === 'choose') if ((Z.ct += dt) >= 1) { Z.ct = 0; const s = B.shots.card || {};   // the cabinets throw cards
    for (let i = 0; i < 3; i++) { const c = cup(i), q = who.reduce((a, b) => (Math.hypot(b.x - c.x, b.y - c.y) < Math.hypot(a.x - c.x, a.y - c.y) ? b : a), who[0]), a0 = Math.atan2(q.y - c.y, q.x - c.x);
      for (const d of [-0.18, 0.18]) g.shoot('e', c.x, c.y - 1, a0 + d, s.speed || 6, s.range || 9, Math.round((s.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.card`, 0.35, false, e.D.name); } }
  if (e.rfShSt === 'shuffle') {
    const sw = Z.swaps[Z.k]; if (!sw) { e.rfShSt = 'choose'; e.rfShT = 0; return; }
    const q = Math.min(1, e.rfShT / Z.dur), k = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
    if (!Z.from) Z.from = [cup(sw[0]), cup(sw[1])];
    const f = Z.from, lift = 1.4 * Math.sin(Math.PI * q);
    put(sw[0], f[0].x + (f[1].x - f[0].x) * k, f[0].y + (f[1].y - f[0].y) * k - lift); put(sw[1], f[1].x + (f[0].x - f[1].x) * k, f[1].y + (f[0].y - f[1].y) * k + lift);
    if (q >= 1) { put(sw[0], f[1].x, f[1].y); put(sw[1], f[0].x, f[0].y); Z.from = null; Z.k++; e.rfShT = 0; }
    return; }
  const open = (i) => { const c = cup(i); e['rfShO' + i] = true; if (i === Z.hid) return;
    const cs = B.shots.card || {}, ds = B.shots.dove || cs;
    for (let j = 0; j < 10; j++) g.shoot('e', c.x, c.y - 1, (j * TAU) / 10 + 0.2, cs.speed || 6, cs.range || 8, Math.round((cs.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.card`, 0.35, false, e.D.name);
    for (let j = 0; j < 6; j++) g.shoot('e', c.x, c.y - 1, (j * TAU) / 6, ds.speed || 4, ds.range || 8, Math.round((ds.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.${B.shots.dove ? 'dove' : 'card'}`, 0.35, false, e.D.name);
    g.vx({ k: 'burst', x: c.x, y: c.y - 1, n: 16, colors: ['#ffffff', '#ffd690', '#ff6a8a'] }); };
  if (e.rfShSt === 'choose') {
    let on = -1; for (let i = 0; i < 3; i++) { const c = cup(i); if (who.some((p) => !p.dead && Math.hypot(p.x - c.x, p.y - (c.y + 0.4)) < 1.3)) on = i; }
    if (on !== e.rfShOn) { e.rfShOn = on; e.rfShHold = 0; }
    if (on >= 0) e.rfShHold += dt;
    e.rfShLeft = Math.max(0, C.time - e.rfShT);
    const reveal = () => { e.rfShRev = Z.hid; e.rfShSt = 'done'; e.rfShT = 0; e.rfHide = e.hidden = e.under = false; };
    if (on >= 0 && e.rfShHold >= 0.5) { open(on);
      if (on === Z.hid) { e.rfStagT = 3.5; e.rfShWon = (e.rfShWon || 0) + 1; g.float(mine.x, mine.y - 3, 'TA-DA! STAGGERED', '#ffe066'); g.vx({ k: 'burst', x: mine.x, y: mine.y - 1, n: 24, colors: ['#8cffe6', '#ffffff', '#c8a0ff'] });
        g.banner(['"You found me!"', '"Bravo, bravo!"', '"How did you...?"'][Math.floor(Math.random() * 3)] + ' (Mirabeau staggers)', 2200); }
      else g.banner('"Wrong cabinet!"', 1600);
      return reveal(); }
    if (e.rfShT >= C.time) { for (let i = 0; i < 3; i++) if (i !== Z.hid) open(i); g.banner('"Too slow!"', 1600); return reveal(); }
    return; }
  if (e.rfShSt === 'done' && e.rfShT >= 1.2) { e.rfShSt = 'rest'; e.rfShT = 0; e.rfSlotX = undefined; e.rfSlotY = undefined; for (let i = 0; i < 3; i++) e['rfShO' + i] = false; }
}
// ---- Mother Mire's ritual, on the server: runes appear; if the players between them step on every one before the cast
// ends it is broken (she staggers, three seconds without attacking); if not, the brew boils over (a ring of shots, and
// each player near is confused for a while: their browser sees the count go up). The runes go out as one word: x:y:done|...
const runesOf = (s) => (s ? s.split('|').map((q) => { const [x, y, d] = q.split(':'); return { x: +x, y: +y, done: d === '1' }; }) : []);
const runesWord = (L) => L.map((q) => `${q.x.toFixed(2)}:${q.y.toFixed(2)}:${q.done ? 1 : 0}`).join('|');
function ritualStep(g, e, B, bal, dt, R) {
  const A = box(e, B), who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player];
  e.rfRitT = (e.rfRitT || 0) + dt;
  if (!e.rfRit) {
    if (e.rfRitT < R.every) return;
    const L = [];
    for (let k = 0; k < (R.runes || 3); k++) { let x = 0, y = 0; for (let j = 0; j < 30; j++) { x = A.x0 + rnd(0.12, 0.88) * A.w; y = A.y0 + rnd(0.18, 0.88) * A.h; if (L.every((q) => Math.hypot(q.x - x, q.y - y) > 3.5) && Math.hypot(x - e.x, y - e.y) > 2.5) break; } L.push({ x, y, done: false }); }
    e.rfRit = runesWord(L); e.rfRitT = 0; g.banner(R.say || 'A ritual begins! Step on every rune before it completes.', 2800);
    return;
  }
  const L = runesOf(e.rfRit);
  let changed = false;
  for (const q of who) for (const r of L) if (!r.done && Math.hypot(q.x - r.x, q.y - r.y) < 0.85) { r.done = true; changed = true; g.fx.push({ kind: 'ring', x: r.x, y: r.y, t: 0, max: 1.6, color: '#c8a0ff' }); }
  if (changed) e.rfRit = runesWord(L);
  if (L.every((r) => r.done)) { e.rfRit = ''; e.rfRitT = 0; e.rfStagT = 3; g.float(e.x, e.y - 3, 'INTERRUPTED!', '#ffd650'); g.banner('The ritual is broken!', 1800); }
  else if (e.rfRitT >= R.cast) {
    e.rfRit = ''; e.rfRitT = 0; e.rfRitFail = (e.rfRitFail || 0) + 1;
    const s = B.shots[R.s] || {}, n = R.n || 28;
    for (let i = 0; i < n; i++) g.shoot('e', e.x, e.y - 0.5, (i * TAU) / n + 0.1, s.speed || 5, s.range || 9, Math.round((s.dmg || 70) * bal.bossDmg), `rfx_shots/${B.id}.${R.s}`, 0.35, false, e.D.name);
    g.banner(R.done || 'It is done!', 2200);
  }
}
// ---- Aion's still hour (puzzle phases), on the server: time stops for everyone; the pieces are creatures the server
// owns (crystals to shatter, the Sun Disc and the Hand Mirror to push: any player walking into them moves them), the
// runes are places on the floor; solved, the shield falls for a while and the hour bites its Life; failed, it bursts
function objKind(B, key, hp) {
  const id = `rfz_${B.id}_${key}`, s = B.shots[key] || {};
  if (!ENEMIES[id]) ENEMIES[id] = { name: s.name || key, biome: 'dungeon', hp, def: 0, speed: 0, xp: 0, r: 0.5, ai: 'rooted', aggro: 0, reg: `rfx_shots/${B.id}.${key}`, scale: 2.5, contact: 0, attacks: [], loot: [] };
  return id;
}
const PLATES = [[0.27, 0.46], [0.73, 0.46], [0.27, 0.84], [0.73, 0.84], [0.5, 0.66]];
const plateAt = (A, i) => ({ x: A.x0 + PLATES[i][0] * A.w, y: A.y0 + PLATES[i][1] * A.h });
const socketAt = (A) => ({ x: A.x0 + A.w / 2, y: A.y0 + A.h * 0.66 });
function puzzleStep(g, e, B, bal, dt, P) {
  const Z = P.puzzle, A = box(e, B), who = g.netTargets && g.netTargets.length ? g.netTargets : [g.player];
  const O = e.rfPzO, sand = (x, y, n) => { const s = B.shots.sand || {}; for (let k = 0; k < n; k++) g.shoot('e', x, y, (k * TAU) / n, s.speed || 5, s.range || 7, Math.round((s.dmg || 60) * bal.bossDmg), `rfx_shots/${B.id}.sand`, 0.35, false, e.D.name); };
  const piece = (key, x, y, hp, hard) => { const m = g.addEnemy(objKind(B, key, hp), x, y); m.seen = true; m.noLoot = true; m.rfPiece = true; if (hard) m.invulnT = 99; e.rfPzO.objs.push(m); return m; };
  const spot = (minP, minB) => { let x = 0, y = 0; for (let k = 0; k < 30; k++) { x = A.x0 + rnd(0.1, 0.9) * A.w; y = A.y0 + rnd(0.2, 0.88) * A.h; if (who.every((q) => Math.hypot(x - q.x, y - q.y) > minP) && Math.hypot(x - e.x, y - e.y) > minB && !(g.map && g.blocked && g.blocked(x, y))) break; } return { x, y }; };
  e.rfPzT = (e.rfPzT || 0) + dt;
  if (e.rfExpT > 0) e.rfExpT -= dt;
  if (e.rfPz !== 'still') {
    if (e.rfPzT < Z.combat) return;
    // time stops
    const r = e.rfPzR || 0, kind = Z.kind, want = (k) => kind === k || (kind === 'combo' && (k === 'crystals' || k === 'sequence'));
    const o = (e.rfPzO = { kind, objs: [] });
    e.rfPz = 'still'; e.rfPzT = 0; e.rfPlN = 0; e.rfSock = 0; e.rfTx = 0; e.rfTy = 0;
    if (want('crystals')) { o.crystals = []; for (let k = 0; k < Math.min(5, (Z.n || 3) + r); k++) { const s = spot(4, 3); o.crystals.push(piece('crystal', s.x, s.y, Math.round(480 * Math.max(1, bal.bossHp / 3)))); } }
    if (want('sequence')) { const n = Math.min(5, (Z.n || 3) + r), ord = [...Array(n).keys()].sort(() => Math.random() - 0.5); e.rfPlN = n; e.rfOrd = ord.join(''); e.rfNext = 0; o.fail = false; }
    if (kind === 'sundial') { const S0 = socketAt(A); e.rfSock = 1; let s = spot(2, 4); for (let k = 0; k < 20 && Math.hypot(s.x - S0.x, s.y - S0.y) < 4 + r; k++) s = spot(2, 4); o.disc = piece('sundisc', s.x, s.y, 9999, true); }
    if (kind === 'redirect') {
      const q = who.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)), a = Math.atan2(q.y - e.y, q.x - e.x), s = B.shots.lance || {};
      o.lance = true;
      for (let k = 0; k < 5; k++) { const d = 2 + k * 0.9, b = g.shoot('e', e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, a, s.speed || 7, s.range || 14, Math.round((s.dmg || 110) * bal.bossDmg), `rfx_shots/${B.id}.lance`, 0.4, false, e.D.name); if (b) b.rfLance = 1; }
      const far = 2 + 5 * 0.9 + 1.6; e.rfTx = e.x + Math.cos(a) * far; e.rfTy = e.y + Math.sin(a) * far;
      const m = spot(2.5, 3); o.mirror = piece('tmirror', m.x, m.y, 9999, true);
    }
    g.banner(Z.say || 'TIME STOPS.', 3000);
    return;
  }
  // the still hour: the runes underfoot, the pieces pushed
  if (e.rfPlN && !o_fail(O)) {
    const ord = e.rfOrd.split('').map(Number);
    for (const q of who) for (let i = 0; i < e.rfPlN; i++) {
      if (ord.indexOf(i) < e.rfNext) continue;
      const pl = plateAt(A, i); if (Math.hypot(q.x - pl.x, q.y - pl.y) > 0.7) continue;
      if (i === ord[e.rfNext]) { e.rfNext++; g.fx.push({ kind: 'ring', x: pl.x, y: pl.y, t: 0, max: 1.6, color: '#ffd650' }); }
      else { O.fail = true; g.banner('Wrong rune. The sequence breaks.', 2000); }
      break;
    }
  }
  for (const m of [O.disc, O.mirror]) {
    if (!m || m.dead || m.rfDocked) continue;
    m.invulnT = 99;
    for (const q of who) { const dx = m.x - q.x, dy = m.y - q.y, d = Math.hypot(dx, dy); if (d < 0.95 && d > 0.01) g.moveCircle(m, (dx / d) * (0.95 - d), (dy / d) * (0.95 - d), 0.4); }
    m.x = Math.max(A.x0 + 1, Math.min(A.x0 + A.w - 1, m.x)); m.y = Math.max(A.y0 + 1, Math.min(A.y0 + A.h - 1, m.y));
  }
  if (O.disc && !O.disc.rfDocked) { const S0 = socketAt(A); if (Math.hypot(O.disc.x - S0.x, O.disc.y - S0.y) < 0.8) { O.disc.rfDocked = true; O.disc.x = S0.x; O.disc.y = S0.y; } }
  const done = (!O.crystals || O.crystals.every((c) => c.dead)) && (!e.rfPlN || e.rfNext >= e.rfPlN) && (!O.disc || O.disc.rfDocked) && (!O.mirror || Math.hypot(O.mirror.x - e.rfTx, O.mirror.y - e.rfTy) < 0.7);
  const failed = e.rfPlN && O.fail;
  if (!(e.rfPzT >= Z.still || (done && e.rfPzT > 0.6) || (failed && !O.crystals))) return;
  // time resumes
  const ok = done && !failed, r = e.rfPzR || 0;
  e.rfPz = 'combat'; e.rfPzT = 0; e.rfPzR = r + 1;
  if (ok) {
    e.rfExpT = 5; e.rfImm = false;
    if (O.mirror) e.rfLanceWin = (e.rfLanceWin || 0) + 1;      // (the lances turn on their maker: each browser ends them at the mirror)
    if (O.disc) g.fx.push({ kind: 'laser', x0: O.disc.x, y0: O.disc.y, a: Math.atan2(e.y - O.disc.y, e.x - O.disc.x), len: Math.hypot(e.x - O.disc.x, e.y - O.disc.y), t: 0, tele: 0.05, act: 0.6, life: 0.7, dmg: 0, by: 'the sun', hit: true });
    g.banner(Z.win || 'Solved. Aion is exposed!', 2600);
    e.netRawHit = true; try { g.damageEnemy(e, Math.round(e.maxHp * (5 + r) / 100), e.x, e.y, true); } finally { e.netRawHit = false; }
  } else {
    g.banner(Z.lose || 'The hour turns against you.', 2600);
    for (const c of O.crystals || []) if (!c.dead) sand(c.x, c.y, 12);
    if (e.rfPlN) { const s = B.shots.rune || {}; for (let i = 0; i < e.rfPlN; i++) { const pl = plateAt(A, i); g.fx.push({ kind: 'zone', x: pl.x, y: pl.y, r: 1.4, t: 0, delay: 0.8, life: 0.95, dmg: Math.round((s.dmg || 100) * bal.bossDmg), by: e.D.name, done: false, colors: ['#ffd650', '#ffffff'] }); } }
    if (O.disc && !O.disc.rfDocked) sand(O.disc.x, O.disc.y, 16);
  }
  endPieces(e);
  e.rfPlN = 0; e.rfSock = 0; e.rfTx = 0; e.rfTy = 0;
}
const o_fail = (O) => !!(O && O.fail);
function endPieces(e) { for (const m of (e.rfPzO && e.rfPzO.objs) || []) if (!m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; } e.rfPzO = null; }
// the kinds this translates (the rest wait for their boss's specials)
const KINDS = new Set(['segside', 'segout', 'staff', 'along', 'chess', 'aim', 'ring', 'spiral', 'aoe', 'minion', 'laser', 'rain', 'wall', 'lines', 'implode', 'converge', 'flock', 'nova', 'beam', 'drop', 'spray', 'bolas', 'ahead', 'orbit', 'cloud', 'rift', 'wildfire', 'hedge', 'warp', 'seq']);
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
    r: 1.6, speed: 1.2, keep: 6, faces: false, thresholds, phases, rfData: B, rfBal: bal,
    moves: moves(),
    specials: {
      // a phase's emitters, each on its own clock, for the length of the pattern
      rfEmit(g, e) { const S = e.bx, ph = S.B.phases[S.phase]; e.rfMv = ph.rfMv; S.rfEm = { list: ph.rfEm.map((em) => ({ em, t: 0.3 + Math.random() * 0.4, vol: 0 })), until: S.t + 5.6 }; },
    },
    update(g, e, dt) {
      const S = e.bx, R = S.rfEm;
      tickMinions(g, e, B, bal, dt);
      phaseRules(g, e, B, bal, dt);
      if ((S.state === 'death' || S.state === 'deathhold') && e.rfShSt) shellEnd(e);
      if ((S.state === 'death' || S.state === 'deathhold') && e.rfDig) { e.rfDig = e.hidden = e.under = false; }
      if (S.state === 'death' || S.state === 'deathhold') { for (const m of [...(e.rfMins || []), ...(e.rfEchoes || []), ...(e.rfMirrors || []), e.rfNoct, e.rfKnight, e.rfPriest]) if (m && !m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; } endPieces(e); }   // (its creatures go with it)
      if (e.rfPz === 'still') return;                              // (time stopped: it waits too)
      if (e.rfStagT > 0) { e.rfStagT -= dt; return; }              // (staggered: a ritual broken)
      if (e.rfHide) return;                                        // (in a cabinet: only the cabinets throw)
      if (!R || S.t > R.until || S.state === 'morph' || S.state === 'death' || S.state === 'deathhold') return;
      const hot = S.B.phases[S.phase] && S.B.phases[S.phase].rage ? 0.8 : 1;   // (rage: a quarter faster)
      for (const q of R.list) if ((q.t -= dt) <= 0) { q.t = (q.em.e || (q.em.t === 'minion' ? 1e9 : 1.5)) * hot; const O = originsOf(e, B, q.em.src), v = q.vol++; if (O) for (const o of O) fire(g, e, B, bal, q.em, v, o); else fire(g, e, B, bal, q.em, v);
        const CL = S.B.phases[S.phase].rfP.clones; if (CL && !q.em.src && q.em.t !== 'minion') for (const c of CL) if (c.mimic !== false) (e.rfEchoQ = e.rfEchoQ || []).push({ at: S.t + (c.delay || 0), em: q.em, v, c }); }   // (her reflections fire it too, late or not)
    },
    // the arena's rules, for the player in this browser
    local(g, e, dt) { arenaRules(g, e, B, bal, dt); },
    drawGround(r, g, e) { drawArena(r, g, e, B); },
    // can't be hurt: an invulnerable phase (until its time is up or its minions fall), or shielded outside its openings
    immune(g, e) {
      if (e.rfImm) return true;
      const ph = e.bx.B.phases[e.bx.phase];
      if (ph && ph.rfP.halflit) { const a0 = (e.rfL ?? e.rfPhT ?? 0) * 0.6, q = g.player, a = Math.atan2(q.y - e.y, q.x - e.x); return Math.cos(a - a0) < 0; }   // (Totality: struck from the dark side, nothing)
      return false;
    },                 // (worked out each frame where the fight runs: phaseRules; a shared boss brings it along)
    immuneText: 'INVULNERABLE',
    // what the phase looks like on it: rage's red glow, an invulnerable ring, the hour's gold shield, the leash's reach
    draw(r, g, e, sx, sy) {
      const ph = e.bx.B.phases[e.bx.phase], b = r.b;
      if (!ph || e.dead) return;
      const ring = (rad, col, a) => { b.globalAlpha = a; b.strokeStyle = col; b.lineWidth = 2; b.beginPath(); b.arc(sx, sy - 24, rad, 0, TAU); b.stroke(); b.globalAlpha = 1; };
      if (ph.rage) ring(40 + Math.sin(g.t * 6) * 3, '#ff3c50', 0.5);
      if (ph.invuln && e.rfImm) ring(34, '#9fd8ff', 0.55 + Math.sin(g.t * 6) * 0.25);
      if (ph.shield && e.rfImm) ring(36, '#ffd650', 0.6);
      if (ph.rfP.decoys && e.bx.def && e.bx.anim) for (const d of decoysOf(e, B, ph.rfP)) { const [dx, dy] = r.proj(d.x, d.y); b.globalAlpha = 0.45; r.drawDef(e.bx.def, e.bx.anim.frame, dx, dy, { scale: 1 }); b.globalAlpha = 1; }   // her decoys
      if (ph.rfP.halflit) {                               // Totality: the bright half turns (only blows from that side land)
        const a0 = (e.rfL ?? e.rfPhT ?? 0) * 0.6; b.globalAlpha = 0.3; b.fillStyle = '#ffe066'; b.beginPath(); b.arc(sx, sy - 24, 44, a0 - Math.PI / 2, a0 + Math.PI / 2); b.lineTo(sx, sy - 24); b.fill();
        b.fillStyle = '#0a0418'; b.globalAlpha = 0.45; b.beginPath(); b.arc(sx, sy - 24, 44, a0 + Math.PI / 2, a0 + Math.PI * 1.5); b.lineTo(sx, sy - 24); b.fill(); b.globalAlpha = 1; }
      if (e.rfStagT > 0) { b.fillStyle = '#ffe066'; b.font = '10px monospace'; b.textAlign = 'center'; b.fillText('STAGGERED', sx, sy - 60); }
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
export { plateAt as rfPlateAt, socketAt as rfSocketAt, box as rfBox };   // (for tests)
