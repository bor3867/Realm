// The Hollow Jarl, Warrior: stage 1 of the Hollow Court, 'THE WARRIOR'S HUNT' (src/bosses/jarl_court.js).
//
// REBUILT 2026-11-04 (the user's boss overhaul: "Each boss needs a proper combat state machine ... Movement must be an
// integral part of combat ... Phases must be mechanically different ... Build encounter-specific attack directors").
// The audit found him on the engine's one generic loop (pick the next of five attacks from a fixed list, freeze for its
// windup, fire, freeze for its recovery): standing two thirds of the time, the same five attacks in every phase, and a
// player circling at range taking a tenth of the damage of one standing still. He now runs his own DIRECTOR, a state
// machine over his movement and his combinations, choosing by phase, distance, what you are doing and what he last did:
//
//   states   PURSUE (between combinations: his phase's own movement, still dangerous) > COMBO (an authored sequence,
//            moving through it) > RECOVER (a short breath) > PURSUE ...; STAGGER (earned: a charge into a wall, the end
//            of a Death Hunt, the end of the Execution); the engine's change of form between phases
//   choice   a combination is chosen by weight from his phase's pool, never the last two again; close or far shifts the
//            weights; you standing still is punished (a POUNCE: he leaps onto you); you hanging far off is closed down
//            (a charge or a leap at you); the Mage's Spectral Crossfire calls a charge with it
//
//   PHASE I    THE HUNT          he chases (4.2 t/s), throwing nothing as he comes; CHARGE & SLAM (one long tell, the
//                                charge, a slam where it ends, a ring of stone with its opening off to your side);
//                                REAPING ADVANCE (three sweeps as he walks you down, crescent arcs off each); GROUNDBREAKER
//                                (a slam, three rings of stone, their openings turning); AXE TOSS (axes thrown as he
//                                chases, each turning back to him at the end of its flight)
//   PHASE II   THE EXECUTIONER   he stalks: closes to 4.5 and circles you, a crescent fan every 1.8 s, embers left where
//                                he treads (they burst behind him); CHAINED CHARGES (two, a breath between, a slam at the
//                                end; a wall stops him and he reels); EXECUTIONER'S LEAP (he leaps onto where you will be,
//                                a crushing landing, a spiral of crescents out of it, embers round it); REAPING ADVANCE
//                                aflame (each sweep's arc of embers bursts behind it); AXE STORM, walking you down
//   PHASE III  THE DEATH HUNT    he hunts (5 t/s, turning hard but not snapping); chains fall across the court every
//                                6.5 s (marked lanes); DEATH HUNT (7 s of the hunt at 5.6, an axe fan every 1.2 s, two
//                                short charges; then spent: STAGGERED); THE EXECUTION (his signature: three leaps onto you,
//                                each landing a ring of stone, then a great slam and its rings; then spent: STAGGERED);
//                                CHAINED CHARGES (three); the walking AXE STORM (four arms); EXECUTIONER'S LEAP
//
// Every attack is told once and readably (the user, 2026-11-04: "a long charge up with notification and then he should
// charge"): a charge's one lane following you then held; a leap's landing ring; a slam's circle; a sweep's wedge.
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// Debug: /bossdebug shows his state, combination, movement and timers over him (e.bx.dbg) and logs his choices.
// Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>').
import { TAU, angleTo, target } from './kit.js';
import { isSolid } from '../world/maps.js';
import { courtTick, partner } from './jarl_court.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'], EMBER = ['#ff8a1f', '#ff8a1f', '#ffd650', '#ffffff'], CHAIN = ['#8a8490', '#8a8490', '#c8c0d8', '#ffffff'];
const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const CHARGE_V = 11, TELL = 1.1, TRACK = 0.7;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, STONE = { sprite: 'jarl_shots/stone', size: 0.4 }, AXE = { sprite: 'jarl_shots/sword', size: 0.45 };
const zone = (g, e, x, y, r, delay, dmg, cols = FIRE) => g.fx.push({ kind: 'zone', src: null, x, y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: cols });
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg });
const court = (e) => e.room || { x: Math.floor(e.x) - 20, y: Math.floor(e.y) - 20, w: 40, h: 34 };
const bearing = (g, e) => { const q = target(g, e); return angleTo(e.x, e.y, q.x, q.y); };
const range = (g, e) => { const q = target(g, e); return Math.hypot(q.x - e.x, q.y - e.y); };
const swish = (g) => { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); };
function reach(g, e, a, want) {                            // how far he can go that way: in the court and short of its walls
  const H = court(e), M = g.map, solid = (x, y) => isSolid(M, x, y) || isSolid(M, x + 0.9, y) || isSolid(M, x - 0.9, y) || isSolid(M, x, y + 0.9) || isSolid(M, x, y - 0.9);
  let L = 0;
  while (L + 0.25 <= want) { const x = e.x + Math.cos(a) * (L + 0.25), y = e.y + Math.sin(a) * (L + 0.25); if (!(x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) || solid(x, y)) break; L += 0.25; }
  return Math.max(0.5, L);
}
function landing(g, e, x, y) {                             // a place he can land: on the floor, in the court (drawn in toward him till it is)
  const H = court(e); x = Math.max(H.x + 2, Math.min(H.x + H.w - 2, x)); y = Math.max(H.y + 2, Math.min(H.y + H.h - 2, y));
  for (let k = 0; k < 20 && (isSolid(g.map, x, y) || isSolid(g.map, x + 1, y) || isSolid(g.map, x - 1, y) || isSolid(g.map, x, y + 1) || isSolid(g.map, x, y - 1)); k++) { x += (e.x - x) * 0.15; y += (e.y - y) * 0.15; }
  return [x, y];
}
const lead = (g, e, T) => { const q = target(g, e); return [q.x + (e.bx.pvx || 0) * T, q.y + (e.bx.pvy || 0) * T]; };

// ================================================================ the phases (each its own movement, pool and mechanics)
const PHASE = {
  1: { title: 'THE HUNT', walk: 4.2, move: 'chase', breath: 1.0, pool: { chargeSlam: 3, reap: 2, ground: 2, axes: 2 }, closer: 'chargeSlam' },
  2: { title: 'THE EXECUTIONER', walk: 4.4, move: 'stalk', breath: 0.8, pool: { chain: 3, leap: 3, reapFire: 2, stormWalk: 2, axes: 1 }, closer: 'leap', fan: 1.8, embers: true },
  3: { title: 'THE DEATH HUNT', walk: 5.0, move: 'hunt', breath: 0.55, pool: { hunt: 3, execution: 2, chain: 2, stormWalk: 1, leap: 2 }, closer: 'chain', embers: true, chains: 6.5 },
};
const NEAR = { reap: 1, reapFire: 1, ground: 1, stormWalk: 1 }, FAR = { chargeSlam: 1, chain: 1, leap: 1, hunt: 1 };

// ================================================================ the director
const W0 = (g) => ({ st: 'pursue', until: g.t + 1.2, combo: null, hist: [], still: 0, far: 0, mv: null, mvUntil: 0, fanAt: g.t + 2, emberAt: 0, chainAt: g.t + 4, poseUntil: 0 });
const W = (g, e) => e.bx.wd || (e.bx.wd = W0(g));
function setMove(g, e, mode, t) { const w = W(g, e); w.mv = mode; w.mvUntil = g.t + t; }
function done(g, e, rec = 0.6, recMove = 'hold') {           // a combination finished: a breath, then the hunt again
  const w = W(g, e); w.st = 'recover'; w.until = g.t + rec; setMove(g, e, recMove, rec); log(g, e, 'recover', rec);
}
function stagger(g, e, t, say) {                              // he reels (earned): open to you a third more
  const S = e.bx, w = W(g, e);
  S.vol = []; w.dash = null; w.tell = null; w.hunt = null; w.storm = null; S.leapZ = 0;
  w.st = 'stagger'; w.until = g.t + t; setMove(g, e, 'hold', t); S.jwStag = g.t + t; S.flinch = g.t + t; S.flinchNext = g.t + t + 0.6;
  if (say) { if (g.banner) g.banner(say, 1400); g.float(e.x, e.y - 3, 'STAGGERED', '#ffd650', e); }
  log(g, e, 'stagger', t);
}
function log(g, e, ev, info) { if (g.bxLog) g.bxLog(e, ev, info); }
function pick(g, e) {
  const S = e.bx, w = W(g, e), P = PHASE[S.phase] || PHASE[3], d = range(g, e);
  if (S.jwCall) { S.jwCall = false; return P.pool.chain ? 'chain' : 'chargeSlam'; }   // (the Mage's Spectral Crossfire: a charge with it)
  if (w.still > 1.8) { w.still = 0; return 'pounce'; }         // (you stood still: he leaps onto you)
  if (w.far > 2) { w.far = 0; return P.closer; }               // (you hung far off: he closes)
  const L = Object.entries(P.pool).filter(([k]) => !w.hist.slice(-2).includes(k));
  const wt = L.map(([k, v]) => v * (d < 6 && NEAR[k] ? 1.8 : d > 8 && FAR[k] ? 1.8 : d > 8 && NEAR[k] ? 0.35 : 1));
  let r = Math.random() * wt.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) if ((r -= wt[i]) <= 0) return L[i][0];
  return L.length ? L[L.length - 1][0] : 'chargeSlam';
}
function director(g, e, dt) {
  const S = e.bx, w = W(g, e), P = PHASE[S.phase] || PHASE[3], q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
  // what you are doing: standing still, hanging far off
  w.still = Math.hypot(S.pvx || 0, S.pvy || 0) < 0.6 ? w.still + dt : Math.max(0, w.still - dt * 2);
  w.far = d > 7 ? w.far + dt : Math.max(0, w.far - dt);
  if (w.st === 'combo' && g.t >= w.until) done(g, e);           // (a combination that ran past its own end)
  if ((w.st === 'recover' || w.st === 'stagger') && g.t >= w.until) { w.st = 'pursue'; w.until = g.t + P.breath; w.combo = null; S.jwStag = 0; log(g, e, 'pursue', P.move); }
  if (w.st === 'pursue') {
    if (P.fan && g.t >= w.fanAt) { w.fanAt = g.t + P.fan; stalkFan(g, e); }
    if (d > 7 && g.t >= (w.axeAt || 0)) { w.axeAt = g.t + 2.2; axeThrow(g, e, { last: false }); }   // (you kite him at range: his axe after you, turning back to him)
    if (g.t >= w.until) {
      const c = pick(g, e); w.combo = c; w.hist.push(c); if (w.hist.length > 6) w.hist.shift();
      w.st = 'combo'; w.until = g.t + 30; log(g, e, 'combo', c); COMBO[c](g, e);
    }
  }
  if (P.embers && (w.st === 'pursue' || w.mv === 'hunt' || w.mv === 'advance') && g.t >= w.emberAt && Math.hypot(S.mvx || 0, S.mvy || 0) > 1.5) { w.emberAt = g.t + 0.45; zone(g, e, e.x, e.y, 0.9, 0.7, D(90), EMBER); }   // (embers where he treads: they burst behind him)
  if (P.chains && g.t >= w.chainAt) { w.chainAt = g.t + P.chains; fallingChains(g, e); }
  S.dbg = { st: w.st, combo: w.combo, move: mode(g, e), next: Math.max(0, w.until - g.t).toFixed(1), still: w.still.toFixed(1), far: w.far.toFixed(1), phase: P.title };
}
const mode = (g, e) => {                                      // how he moves this moment: a dash's own; planted through a tell; a combination's; the hunt; his phase's pursuit
  const w = W(g, e); if (w.dash) return w.dash.kind; if (w.tell || w.prep > g.t) return 'hold';
  if (w.mvUntil > g.t && w.mv) return w.mv; if (w.hunt && g.t < w.hunt.until) return 'hunt';
  return w.st === 'pursue' ? (PHASE[e.bx.phase] || PHASE[3]).move : 'hold';
};

// ================================================================ the combinations
// a charge: ONE tell (the '!', his roar, his stance; one lane following you, then held), then the charge
function chargeMark(g, e, V) {
  const w = W(g, e), a = bearing(g, e), T = V.tell || ((e.bx.phase || 1) >= 3 ? 0.9 : TELL);   // (III: shorter, still one and readable)
  g.float(e.x, e.y - 3.2, '!', '#ff3a1a', e); g.sfx('roar'); g.vx({ k: 'shake', amt: 2 });
  g.vx({ k: 'burst', x: e.x, y: e.y - 0.4, n: 12, colors: ['#ff3a1a', '#ff8a1f', '#5a5560'] });
  w.tell = { a, len: reach(g, e, a, 10), k: 0, held: false, t0: g.t, T };
  e.bx.jwTell = w.tell; w.mvUntil = 0;
  later(e, T, 'chargeGo', V);
}
function tellTick(g, e) {
  const w = W(g, e), T = w.tell; if (!T) return;
  const k = Math.min(1, (g.t - T.t0) / T.T); T.k = Math.round(k * 20) / 20;
  if (g.t - T.t0 < T.T * (TRACK / TELL)) { const [lx, ly] = lead(g, e, 0.35), want = Math.min(10, Math.hypot(lx - e.x, ly - e.y) + 2.5); T.a = angleTo(e.x, e.y, lx, ly); T.len = reach(g, e, T.a, want); } else T.held = true;   // (at where you will be: the lane shows it)
}
function chargeGo(g, e, V) {
  const w = W(g, e), T = w.tell; w.tell = null; e.bx.jwTell = null;
  const [lx, ly] = lead(g, e, 0.2), a = T ? T.a : bearing(g, e), want = V.short ? 4 : Math.min(10, Math.hypot(lx - e.x, ly - e.y) + 2.5), L = reach(g, e, a, want);
  w.dash = { kind: 'charge', x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t, until: g.t + L / CHARGE_V, a, dmg: D(175), hit: false, crash: L < want - 2, V, next: g.t };   // (a wall stops him only if it cut his charge well short: baited into it, earned)
  g.vx({ k: 'shake', amt: 3 });
}
function chargeEnd(g, e, C) {
  const L = Math.hypot(C.x1 - C.x0, C.y1 - C.y0);
  if (L > 1) g.fx.push({ kind: 'lane', x: C.x0, y: C.y0, a: C.a, len: L, w: 1.3, delay: 0.55, t: 0, life: 0.8, dmg: g.bxDmg(e, D(120)), by: e.D.name, hitT: 0, cols: EMBER });   // (the ground he tore up erupts behind him)
  if (C.crash) { stagger(g, e, 1.6, 'THE JARL STAGGERS'); g.vx({ k: 'shake', amt: 9 }); g.vx({ k: 'burst', x: e.x, y: e.y, n: 30, colors: ASH }); g.sfx('hammer'); return; }
  const V = C.V;
  if (V.left > 0) { stoneBurst(g, e, 8); later(e, 0.7, 'chargeMark', { ...V, left: V.left - 1 }); setMove(g, e, 'hold', 0.7); return; }   // (a burst of stone where each stops; a breath; the next)
  if (V.then === 'slam') { slamMark(g, e, { r: 2.6, delay: 0.55, dmg: 190, rings: 1, rec: V.rec }); return; }
  if (V.then === 'none') { if (V.done !== false) done(g, e, 0.4, 'chase'); return; }
  done(g, e, 0.5);
}
const stoneBurst = (g, e, n) => { for (let k = 0; k < n; k++) shot(g, e, e.x, e.y, bearing(g, e) + (k / n) * TAU, { ...STONE, speed: 4.4, range: 9, dmg: D(90) }); g.vx({ k: 'shake', amt: 4 }); };
// a slam: its circle told, then the blow, rings of stone out of it (their opening off to your side, turning ring by ring)
function slamMark(g, e, V) {
  const w = W(g, e); setMove(g, e, 'hold', V.delay + 0.25);
  zone(g, e, e.x, e.y, V.r, V.delay, D(V.dmg));
  w.poseUntil = g.t + V.delay + 0.3; e.bx.anim && e.bx.anim.play(e.bx.def.phases[e.bx.phase].attack);
  later(e, V.delay, 'slamHit', V);
}
function slamHit(g, e, V) {
  g.vx({ k: 'shake', amt: 7 }); g.sfx('hammer'); g.vx({ k: 'burst', x: e.x, y: e.y, n: 24, colors: ASH });
  const gap0 = bearing(g, e) + deg(90) * (Math.random() < 0.5 ? 1 : -1);
  for (let r = 0; r < (V.rings || 1); r++) later(e, r * 0.4, 'stoneRing', { gap: gap0 + r * deg(40), n: 18, speed: 4.6 });
  if (V.spiral) for (let k = 0; k < V.spiral; k++) later(e, k * 0.05, 'spiralOut', { a: bearing(g, e) + k * deg(29), k });
  if (V.stagger) { later(e, 0.2 + (V.rings || 1) * 0.4, 'staggerAfter', { t: V.stagger }); return; }
  done(g, e, V.rec ?? 0.6, 'hold');
}
function stoneRing(g, e, V) {
  const s = TAU / V.n, g0 = Math.round(V.gap / s);
  for (let i = 0; i < V.n; i++) { if ([g0 - 1, g0, g0 + 1].some((j) => ((j % V.n) + V.n) % V.n === i)) continue; shot(g, e, e.x, e.y, i * s, { ...STONE, speed: V.speed, range: 15, dmg: D(105) }); }
  g.vx({ k: 'shake', amt: 4 });
}
function spiralOut(g, e, V) { for (const o of [0, Math.PI]) shot(g, e, e.x, e.y, V.a + o, { ...CRESCENT, speed: 5.2, range: 12, dmg: D(95) }); }
function staggerAfter(g, e, V) { stagger(g, e, V.t, 'THE JARL IS SPENT'); }

const COMBO = {
  // CHARGE & SLAM (I): one charge, a slam where it ends
  chargeSlam(g, e) { chargeMark(g, e, { left: 0, then: 'slam', rec: 0.7 }); },
  // CHAINED CHARGES (II two, III three): a breath between, a slam at the end
  chain(g, e) { chargeMark(g, e, { left: (e.bx.phase || 1) >= 3 ? 2 : 1, then: 'slam', rec: 0.6 }); },
  // REAPING ADVANCE (I): three sweeps as he walks you down, left of you, right of you, through you
  reap(g, e) { setMove(g, e, 'advance', 2.4); for (let i = 0; i < 3; i++) later(e, i * 0.75, 'reapMark', { s: [-28, 28, 0][i], fire: false, last: i === 2 }); },
  reapFire(g, e) { setMove(g, e, 'advance', 2.4); for (let i = 0; i < 3; i++) later(e, i * 0.75, 'reapMark', { s: [-28, 28, 0][i], fire: true, last: i === 2 }); },
  // GROUNDBREAKER (I): a slam, three rings, their openings turning
  ground(g, e) { slamMark(g, e, { r: 2.4, delay: 0.9, dmg: 200, rings: 3, rec: 0.6 }); },
  // AXE TOSS (I, II): axes thrown as he chases, each turning back to him at the end of its flight
  axes(g, e) { setMove(g, e, 'chase-slow', 2.4); for (let i = 0; i < 3; i++) later(e, 0.3 + i * 0.6, 'axeThrow', { last: i === 2 }); },
  // EXECUTIONER'S LEAP (II, III; a POUNCE when you stand still): onto where you will be
  leap(g, e) { leapMark(g, e, { ...lead(g, e, 0.9), spiral: 16, embers: (e.bx.phase || 1) >= 2, rec: 0.7 }); },
  pounce(g, e) { const q = target(g, e); if (g.banner) g.banner('DO NOT STAND STILL.', 1000); leapMark(g, e, { 0: q.x, 1: q.y, spiral: 8, embers: false, rec: 0.6, tell: 0.9 }); },
  // AXE STORM, walking (II three arms, III four): he turns his axe round him, walking you down; a ring as he stops
  stormWalk(g, e) {
    const w = W(g, e), n = (e.bx.phase || 1) >= 3 ? 4 : 3;
    zone(g, e, e.x, e.y, 2.2, 0.6, 0); if (g.banner) g.banner('THE AXE STORM', 1000); g.sfx('roar');
    w.storm = { a0: Math.random() * TAU, dir: (w.sd = -(w.sd || 1)), n, t0: g.t + 0.6, until: g.t + 4.2, next: g.t + 0.6 };
    setMove(g, e, 'hold', 0.6); later(e, 0.6, 'moveSet', { mv: 'advance-slow', t: 3.6 });
  },
  // DEATH HUNT (III): 7 s hunting you, an axe fan every 1.2 s, two short charges; then spent
  hunt(g, e) {
    const w = W(g, e); if (g.banner) g.banner('YOU CANNOT RUN.', 1400); g.sfx('roar');
    w.hunt = { at: g.t + 0.5, until: g.t + 7.5, a: bearing(g, e) }; setMove(g, e, 'hunt', 7.5);
    for (let t = 1.7; t < 7.5; t += 1.2) later(e, t, 'huntFan');
    for (const t of [2.4, 5.0]) later(e, t, 'chargeMark', { left: 0, then: 'none', short: true, tell: 0.8, done: false });
    later(e, 7.6, 'huntSpent');
  },
  // THE EXECUTION (III, his signature): three leaps onto you, then a great slam; then spent
  execution(g, e) {
    if (g.banner) g.banner('THE EXECUTION', 1800); g.sfx('roar'); g.vx({ k: 'shake', amt: 5 });
    later(e, 0.4, 'execLeap', { k: 0 });
  },
};
// a sweep: its wedge told 0.55 s; then the cut close (170) and an arc of nine crescents (95); aflame, embers along the arc
function reapMark(g, e, V) { const a = bearing(g, e) + deg(V.s); cleave(g, e, a, 2.6, deg(150), 0.55, D(170)); later(e, 0.55, 'reapCut', { ...V, a }); }
function reapCut(g, e, V) {
  for (let k = 0; k < 9; k++) shot(g, e, e.x, e.y, V.a + (k / 8 - 0.5) * deg(110), { ...CRESCENT, speed: 6, range: 11, dmg: D(95) });
  if (V.fire) for (const o of [-0.7, 0, 0.7]) zone(g, e, e.x + Math.cos(V.a + o) * 3, e.y + Math.sin(V.a + o) * 3, 1.1, 0.9, D(120), EMBER);
  swish(g); w0pose(g, e, 0.3);
  if (V.last) done(g, e, 0.5, 'hold');
}
const w0pose = (g, e, t) => { W(g, e).poseUntil = g.t + t; e.bx.anim && e.bx.anim.play(e.bx.def.phases[e.bx.phase].attack); };
// an axe: out to where you will be, and at the end of its flight, back to him (two shots: the turn made where it is)
function axeThrow(g, e, V) {
  const [tx, ty] = lead(g, e, 0.5), a = angleTo(e.x, e.y, tx, ty), d = Math.min(10, Math.max(5, Math.hypot(tx - e.x, ty - e.y) + 2));
  shot(g, e, e.x, e.y, a, { ...AXE, speed: 8, range: d, dmg: D(110) });
  for (const o of [-1, 1]) shot(g, e, e.x, e.y, a + o * deg(14), { ...CRESCENT, speed: 6, range: 8, dmg: D(90) });
  later(e, d / 8, 'axeBack', { x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d });
  swish(g); w0pose(g, e, 0.25);
  if (V.last) later(e, 0.6, 'comboDone', { rec: 0.3, mv: 'chase' });
}
function axeBack(g, e, V) { shot(g, e, V.x, V.y, angleTo(V.x, V.y, e.x, e.y), { ...AXE, speed: 7, range: Math.hypot(e.x - V.x, e.y - V.y) + 1, dmg: D(110) }); }
function comboDone(g, e, V) { done(g, e, V.rec, V.mv); }
function moveSet(g, e, V) { setMove(g, e, V.mv, V.t); }
// a leap: its landing ring told (he crouches), then he leaps, lands crushing; a spiral out of it; embers round it
function leapMark(g, e, V) {
  const [x, y] = landing(g, e, V[0], V[1]), T = V.tell || 1.0, w = W(g, e);
  zone(g, e, x, y, 2.8, T + 0.6, 0, ['#ff3a1a', '#ff8a1f']);
  w.prep = g.t + T; setMove(g, e, 'hold', T);
  g.float(e.x, e.y - 3.2, '!', '#ff3a1a', e); g.sfx('roar');
  later(e, T, 'leapGo', { ...V, x, y });
}
function leapGo(g, e, V) { W(g, e).dash = { kind: 'leap', x0: e.x, y0: e.y, x1: V.x, y1: V.y, at: g.t, until: g.t + 0.6, V }; }
function leapLand(g, e, V) {
  e.bx.leapZ = 0; zone(g, e, e.x, e.y, 2.8, 0.05, D(190)); g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer'); g.vx({ k: 'burst', x: e.x, y: e.y, n: 26, colors: ASH });
  if (V.spiral) for (let k = 0; k < V.spiral / 2; k++) later(e, k * 0.05, 'spiralOut', { a: bearing(g, e) + k * deg(23), k });
  if (V.embers) for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + deg(45); zone(g, e, e.x + Math.cos(a) * 3.6, e.y + Math.sin(a) * 3.6, 1.2, 0.8, D(110), EMBER); }
  if (V.next) { later(e, 0.35, V.next, V.nextV || {}); return; }
  done(g, e, V.rec ?? 0.6, 'hold');
}
function execLeap(g, e, V) {
  if (V.k < 3) { const q = target(g, e); leapMark(g, e, { 0: q.x, 1: q.y, tell: 0.75, spiral: 0, embers: false, ring: true, next: 'execLeap', nextV: { k: V.k + 1 } }); return; }
  slamMark(g, e, { r: 3.6, delay: 0.9, dmg: 230, rings: 3, spiral: 12, stagger: 2.5 });
}
function huntFan(g, e) { const w = W(g, e); if (w.dash || w.tell) return; const a = bearing(g, e); for (let k = 0; k < 7; k++) shot(g, e, e.x, e.y, a + (k / 6 - 0.5) * deg(80), { ...CRESCENT, speed: 6.2, range: 10, dmg: D(100) }); swish(g); }
function huntSpent(g, e) { W(g, e).hunt = null; stagger(g, e, 1.4, 'THE JARL STAGGERS'); }
// (II) while he stalks: a fan of five at you and where you are going, by turns
function stalkFan(g, e) {
  const S = e.bx, w = W(g, e); if (w.dash || w.tell || S.jwStag > g.t) return;
  const [tx, ty] = (w.fk = (w.fk || 0) + 1) % 2 ? lead(g, e, 0.6) : [target(g, e).x, target(g, e).y], a = angleTo(e.x, e.y, tx, ty);
  for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, a + (k / 4 - 0.5) * deg(48), { ...CRESCENT, speed: 6.2, range: 12, dmg: D(95) });
}
// (III) the court's chains fall: two lanes across it, marked 1.1 s, struck (140)
function fallingChains(g, e) {
  const H = court(e), q = target(g, e);
  for (let k = 0; k < 2; k++) {
    const vert = (k + Math.floor(g.t)) % 2 === 0, o = vert ? q.x + (Math.random() - 0.5) * 6 : q.y + (Math.random() - 0.5) * 6;
    g.fx.push({ kind: 'lane', x: vert ? o : H.x + 1, y: vert ? H.y + 1 : o, a: vert ? Math.PI / 2 : 0, len: (vert ? H.h : H.w) - 2, w: 1.6, delay: 1.1, t: 0, life: 1.35, dmg: g.bxDmg(e, D(140)), by: e.D.name, hitT: 0, cols: CHAIN, tell: true });
  }
  g.sfx('chain');
}

// ================================================================ the boss
export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 245000, def: 26, xp: 9000,
  r: 1.5, speed: 4.6, keep: 1.6, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.66, 0.30],
  choose: (g, e) => { courtTick(g, e); return null; },        // (the engine's own cycle never picks for him: his director does)
  walkPace: 4.4,
  posing: (g, e) => W(g, e).poseUntil > g.t,                 // (his own clips: a slam's, a sweep's)
  charging: (g, e) => { const w = W(g, e); return !!(w.dash || w.tell || w.prep > g.t || (w.hunt && g.t > w.hunt.at)); },
  dmgMult: (g, e) => (e.bx.jwStag > g.t ? 1.33 : 1),
  phases: { 1: { move: 'director', patterns: [] }, 2: { move: 'director', patterns: [] }, 3: { move: 'director', patterns: [] } },
  specials: { chargeMark, chargeGo, slamHit, stoneRing, spiralOut, staggerAfter, reapMark, reapCut, axeThrow, axeBack, comboDone, moveSet, leapGo, execLeap, huntFan, huntSpent },
  moves: {
    director(g, e, dt) {
      const w = W(g, e), m = mode(g, e), q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y), P = PHASE[e.bx.phase] || PHASE[3];
      const go = (ux, uy, sp) => g.moveCircle(e, ux * sp * dt, uy * sp * dt, 0.8);
      if (m === 'hold' || m === 'charge' || m === 'leap' || w.prep > g.t) return;
      if (m === 'chase' || m === 'chase-slow') { if (d > 1.8) go((q.x - e.x) / d, (q.y - e.y) / d, m === 'chase' ? P.walk : 3.0); return; }
      if (m === 'advance' || m === 'advance-slow') { if (d > 1.6) go((q.x - e.x) / d, (q.y - e.y) / d, m === 'advance' ? 2.4 : 1.8); return; }
      if (m === 'stalk') {                                    // close to 4.5 and circle you, the way he circles changing
        const rx = (e.x - q.x) / (d || 1), ry = (e.y - q.y) / (d || 1), s = Math.sin(g.t * 0.5) > 0 ? 1 : -1, pull = (d - 4.5) * 0.6;
        const ux = -rx * pull - ry * s, uy = -ry * pull + rx * s, L = Math.hypot(ux, uy) || 1; go(ux / L, uy / L, P.walk); return;
      }
      if (m === 'hunt') {                                     // turning hard, never snapping
        const H = w.hunt || (w.hunt0 = w.hunt0 || { a: bearing(g, e) }), want = angleTo(e.x, e.y, q.x, q.y), da = Math.atan2(Math.sin(want - H.a), Math.cos(want - H.a));
        H.a += Math.max(-2.6 * dt, Math.min(2.6 * dt, da));
        if (d > 1.6) go(Math.cos(H.a), Math.sin(H.a), w.hunt ? 5.6 : P.walk);
      }
    },
  },
  onWake(g, e) { e.bx.wd = W0(g); if (g.banner) g.banner(partner(e) ? 'THE HOLLOW COURT · "BEND THE KNEE."' : '"BEND THE KNEE."', 2600); },
  onPhase(g, e, ph) {                                          // a real change: everything of the last phase ended; his new movement, pool and mechanics
    const S = e.bx, w = W(g, e);
    S.vol = []; w.dash = null; w.tell = null; w.hunt = null; w.storm = null; w.prep = 0; S.leapZ = 0; S.jwTell = null; S.jwStag = 0;
    w.st = 'pursue'; w.until = g.t + 2.2; w.hist = []; w.combo = null; w.fanAt = g.t + 2.5; w.chainAt = g.t + 3.5; setMove(g, e, 'hold', 1.2);
    const P = PHASE[ph] || PHASE[3]; if (g.banner) g.banner(P.title, 2000);
    g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ASH }); g.sfx('roar');
    log(g, e, 'phase', ph + ' ' + P.title);
  },
  update(g, e, dt) {
    const S = e.bx;
    courtTick(g, e);
    if (['sleep', 'intro', 'morph', 'grace', 'death', 'deathhold', 'gone'].includes(S.state) || e.dead) { if (S.state === 'grace' || S.state === 'morph') { const w = W(g, e); w.dash = null; S.leapZ = 0; } return; }
    const w = W(g, e);
    director(g, e, dt);
    tellTick(g, e);
    const C = w.dash;                                         // a charge or a leap under way
    if (C && g.t >= C.at) {
      if (g.t >= C.until) { e.x = C.x1; e.y = C.y1; w.dash = null; S.leapZ = 0; if (C.kind === 'charge') chargeEnd(g, e, C); else leapLand(g, e, C.V); }
      else {
        const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k;
        if (C.kind === 'leap') S.leapZ = Math.round(Math.sin(Math.PI * k) * 30);
        else {
          const p = g.player; if (!C.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.5) { C.hit = true; g.hurtPlayer(g.bxDmg(e, C.dmg), e.D.name); }
          if (g.t >= C.next) { C.next += 0.2; for (const o of [-1, 1]) shot(g, e, e.x, e.y, C.a + o * deg(90), { ...CRESCENT, speed: 4.2, range: 6, dmg: D(90) }); }   // (crescents off both flanks as he runs)
          if (Math.random() < 0.6) g.vx({ k: 'burst', x: e.x - Math.cos(C.a), y: e.y - Math.sin(C.a), n: 2, colors: ASH });
        }
      }
    }
    const ST = w.storm;                                       // the storm turning round him as he walks
    if (ST && g.t >= ST.t0) {
      if (g.t > ST.until) { w.storm = null; for (let k = 0; k < 18; k++) shot(g, e, e.x, e.y, (k / 18) * TAU, { ...CRESCENT, speed: 5, range: 13, dmg: D(105) }); swish(g); done(g, e, 0.8, 'hold'); }
      else if (g.t >= ST.next) { ST.next += 0.14; const a = ST.a0 + ST.dir * deg(150) * (g.t - ST.t0); for (let i = 0; i < ST.n; i++) shot(g, e, e.x, e.y, a + (i / ST.n) * TAU, { ...CRESCENT, speed: 5.2, range: 12, dmg: D(95) }); }
    }
    if (S.jwStag > g.t && Math.random() < 0.25) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 1.5, y: e.y - 2.5, n: 1, colors: ['#ffd650', '#fff4c4'] });
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });
  },
  onDeath(g, e) { const w = W(g, e); w.dash = null; w.tell = null; w.storm = null; w.hunt = null; e.bx.jwStag = 0; e.bx.jwTell = null; e.bx.leapZ = 0; g.vx({ k: 'shake', amt: 8 }); },
  drawGround(r, g, e) {                                       // a charge's one lane: following you, then held
    const T = e.bx.jwTell; if (!T || e.dead) return;
    r.laneFx({ kind: 'lane', x: e.x, y: e.y, a: T.a, len: T.len, w: T.held ? 1.9 : 1.3, delay: 1, t: Math.min(0.98, T.k), tell: true, cols: RED }, g);
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                    // (every class's gear in its band: src/bosses/boss_loot.js)
};
