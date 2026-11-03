// The Drawbridge Technician (2026-11-02, the user's polish spec, 8; redone the same day, the user: "the worst boss design
// I've ever seen ... make this guy look cool"): the castle engineer who keeps the drawbridge, an elite miniboss in the
// Drawbridge Engine (area 23). A walking furnace with the bridge's great chain in his hand, and a bullet hell of his own:
//   Rivet Spray        (always, between everything) five rivets at you and two loose, every 1.2 s (0.9 in II), 90
//   Winch Sweep        his own: he hooks the drawbridge chain to himself and swings it round him like a clock's hand,
//                      0.8 s marked, then 300 degrees in 2.6 s (160 to stand in it); gears fly off its tip as it turns.
//                      In II two chains, opposite each other
//   Steam Valves       his boiler's four valves open: four streams of scalding steam turning round him for 3 s (95); in II
//                      a second four turning the other way
//   Cog Barrage        three fans of eight spinning gears 0.35 s apart, each fan offset to fill the last one's gaps (100);
//                      the gears slow, then come on again
//   Counterweights     four of the bridge's counterweights marked about you (1.1 s); each crashes down (170) and throws a
//                      ring of ten rivets (90)
//   Furnace Vents      the floor's vents blow under you five times, 0.45 s apart, each marked 0.9 s (140), a molten pool left
// At half his Life the drawbridge's mechanism goes unstable (his change): everything a quarter quicker, the doubled chain
// and valves, and the chamber's great gears sweep a lane across it every 4 s (marked 0.9 s, 120). He falls; then his two
// winch clamps are to be turned (src/world/castle_plan.js MECHS), and the drawbridge comes down a plank at a time
// (src/castle.js). Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// Art: tools/build_technician.py (44x44, no outline).
import { TAU, angleTo, target, scheduler } from './kit.js';

const D = (n) => n + 4, deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const GEAR = { sprite: 'castle_shots/gear', size: 0.42 }, RIVET = { sprite: 'castle_shots/stone', size: 0.32 }, STEAM = { sprite: 'castle_shots/pember', size: 0.36 };
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'], STEEL = ['#a8a0b0', '#c8c0d8', '#5a5560', '#ffffff'];
const lane = (g, e, x, y, a, len, delay, dmg, w = 0.9, cols = RED, more = {}) => g.fx.push({ kind: 'lane', x, y, a, a0: a, len, w, delay, t: 0, life: delay + (dmg ? 0.35 : 0.02), every: 0.5, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0, cols, ...more });
const zone = (g, e, x, y, r, delay, dmg, pool) => g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.7, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: ['#ff5a1a', '#ffd650'], ...(pool ? { pool: { life: 2.5, dmg: g.bxDmg(e, D(45)), kind: 'fire' } } : {}) });
const room = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 16, w: 28, h: 32 };
const aim = (g, e) => { const q = target(g, e); return angleTo(e.x, e.y, q.x, q.y); };
const two = (e) => (e.bx.phase || 1) >= 2;

// the pressure: rivets, always
function rivets(g, e) {
  const a = aim(g, e);
  for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, a + (k / 4 - 0.5) * deg(40), { ...RIVET, speed: 6.4, range: 12, dmg: D(90) });
  for (let k = 0; k < 2; k++) shot(g, e, e.x, e.y, Math.random() * TAU, { ...RIVET, speed: 5, range: 11, dmg: D(90) });
}
// Winch Sweep: the chain swung round him
const SWEEP_T = 2.6, SWEEP_ARC = deg(300);
function winch(g, e) {
  const S = e.bx, a = aim(g, e) - (S.tcDir = -(S.tcDir || 1)) * deg(150), C = room(e), L = Math.max(C.w, C.h);
  const n = two(e) ? 2 : 1, spin = (S.tcDir * SWEEP_ARC) / SWEEP_T;
  for (let k = 0; k < n; k++) lane(g, e, e.x, e.y, a + k * Math.PI, L, 0.8, D(160), 1.0, STEEL, { spin, life: 0.8 + SWEEP_T, every: 0.6 });
  S.tcSweep = { a, spin, n, t0: g.t + 0.8, t1: g.t + 0.8 + SWEEP_T, next: g.t + 0.8 };
  S.tcHold = g.t + 0.8 + SWEEP_T; g.sfx('chain');
  if (g.banner) g.banner('THE CHAIN SWINGS', 1000);
}
// Steam Valves: four (eight) turning streams
function valves(g, e) {
  const S = e.bx; S.tcValve = { a: aim(g, e), until: g.t + 3, next: g.t, k: 0 }; S.tcHold = g.t + 3; g.sfx('bellows');
}
// Cog Barrage
function cogs(g, e) { const a = aim(g, e); for (let k = 0; k < 3; k++) later(e, k * 0.35, 'cogFan', { a: a + (k % 2) * deg(5.6) }); }
function cogFan(g, e, V) {
  for (let k = 0; k < 8; k++) { const b = shot(g, e, e.x, e.y, V.a + (k / 7 - 0.5) * deg(90), { ...GEAR, speed: 6, range: 15, dmg: D(100), mv: { brake: 0.7, re: 7 } }); if (b) b.spin = 9; }
  g.sfx('hammer');
}
// Counterweights
function weights(g, e) {
  const q = target(g, e), o = Math.random() * TAU;
  for (let k = 0; k < 4; k++) {
    const r = k === 0 ? 0 : 3.2, x = q.x + Math.cos(o + k * TAU / 3) * r, y = q.y + Math.sin(o + k * TAU / 3) * r;
    if (g.blockedAt(x, y, 0.4)) continue;
    zone(g, e, x, y, 1.5, 1.1 + k * 0.15, D(170));
    later(e, 1.1 + k * 0.15, 'weightFall', { x, y });
  }
  if (g.banner) g.banner('COUNTERWEIGHTS', 900);
}
function weightFall(g, e, V) {
  for (let k = 0; k < 10; k++) shot(g, e, V.x, V.y, (k / 10) * TAU + 0.15, { ...RIVET, speed: 4.6, range: 9, dmg: D(90), free: true });
  g.vx({ k: 'shake', amt: 5 }); g.vx({ k: 'burst', x: V.x, y: V.y, n: 14, colors: ['#5a5560', '#a8a0b0', '#ff8a1f'] }); g.sfx('hammer');
}
// Furnace Vents: five under you, in turn
function vents(g, e) { for (let k = 0; k < 5; k++) later(e, k * 0.45, 'vent'); g.sfx('bellows'); }
function vent(g, e) { const q = target(g, e); zone(g, e, q.x, q.y, 1.4, 0.9, D(140), true); }

const P = {
  winch: { name: 'Winch Sweep', special: 'winch', windup: 0.3, dur: 3.6, cd: 7, w: 1.4 },
  valves: { name: 'Steam Valves', special: 'valves', windup: 0.4, dur: 3.1, cd: 7 },
  cogs: { name: 'Cog Barrage', special: 'cogs', windup: 0.5, dur: 1.0, cd: 4 },
  weights: { name: 'Counterweights', special: 'weights', windup: 0.3, dur: 1.6, cd: 6 },
  vents: { name: 'Furnace Vents', special: 'vents', windup: 0.3, dur: 2.4, cd: 8 },
};
const sched = scheduler([[1.3, 1.8], [0.9, 1.3]]);

export default {
  id: 'drawbridge_technician', art: 'drawbridge_technician', name: 'The Drawbridge Technician', biome: 'dungeon', hp: 120000, def: 24, xp: 7000,
  r: 1.2, speed: 2.5, keep: 4, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.5], morphGrace: 1.2,
  choose: (g, e, list) => (e.bx.tcHold > g.t ? null : sched(g, e, list)),
  walkPace: 2.5,
  phases: {
    1: { move: 'engine', pressure: [{ every: 1.7, special: 'rivets', delay: 2 }], patterns: Object.values(P) },
    2: { move: 'engine', pressure: [{ every: 1.25, special: 'rivets', delay: 1 }], patterns: Object.values(P) },   // (gentler, 2026-11-02: the playtest had him at twice the Jarls' hurt a second)
  },
  specials: { rivets, winch, valves, cogs, cogFan, weights, weightFall, vents, vent },
  moves: {
    engine(g, e, dt) {                                      // four tiles off you, round the chamber's middle; planted while his chain swings or his valves blow
      if (e.bx.tcHold > g.t) return;
      const C = room(e), q = target(g, e), mx = C.x + C.w / 2, my = C.y + C.h / 2, a = angleTo(q.x, q.y, e.x, e.y), tx = Math.max(C.x + 3, Math.min(C.x + C.w - 3, q.x + Math.cos(a) * 4)), ty = Math.max(C.y + 3, Math.min(C.y + C.h - 3, q.y + Math.sin(a) * 4));
      const gx = (tx + mx) / 2, gy = (ty + my) / 2, L = Math.hypot(gx - e.x, gy - e.y);
      if (L > 0.3) g.moveCircle(e, ((gx - e.x) / L) * Math.min(L, 2.5 * dt), ((gy - e.y) / L) * Math.min(L, 2.5 * dt), 0.8);
    },
  },
  onWake(g) { if (g.banner) g.banner('THE DRAWBRIDGE TECHNICIAN', 2400); },
  onPhase(g, e, ph) {
    if (ph === 2) { e.bx.tempoK = 0.75; e.bx.tcGear = g.t + 2; if (g.banner) g.banner('THE MECHANISM IS UNSTABLE', 2400); g.vx({ k: 'shake', amt: 8 }); g.sfx('roar'); }
  },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro' || S.state === 'death' || S.state === 'deathhold' || S.state === 'gone') return;
    const W = S.tcSweep;                                    // gears off the swinging chain's tip
    if (W && g.t >= W.next && g.t < W.t1) {
      W.next = g.t + 0.16; const a0 = W.a + W.spin * (g.t - W.t0);
      for (let k = 0; k < W.n; k++) { const a = a0 + k * Math.PI, R = 5 + (W.k = (W.k || 0) + 1) % 3 * 2; const b = shot(g, e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, a + Math.sign(W.spin) * Math.PI / 2, { ...GEAR, speed: 4.2, range: 9, dmg: D(95), free: true }); if (b) b.spin = 9; }
    }
    if (W && g.t >= W.t1) S.tcSweep = null;
    const V = S.tcValve;                                    // the valves' streams, turning
    if (V && g.t >= V.next && g.t < V.until) {
      V.next = g.t + 0.2; V.k++;
      const turn = V.k * deg(9);
      for (let j = 0; j < 4; j++) shot(g, e, e.x, e.y, V.a + turn + j * TAU / 4, { ...STEAM, speed: 5.2, range: 12, dmg: D(95) });
      if (two(e)) for (let j = 0; j < 4; j++) shot(g, e, e.x, e.y, V.a - turn + j * TAU / 4 + deg(45), { ...STEAM, speed: 4.6, range: 12, dmg: D(95) });
    }
    if (V && g.t >= V.until) S.tcValve = null;
    if (S.phase >= 2 && S.tcGear && g.t >= S.tcGear) {     // the great gears' sweep, unstable
      S.tcGear = g.t + 4; const C = room(e), horiz = (S.tcGk = (S.tcGk || 0) + 1) % 2, y = C.y + 3 + Math.random() * (C.h - 6), x = C.x + 3 + Math.random() * (C.w - 6);
      lane(g, e, horiz ? C.x + 1 : x, horiz ? y : C.y + 1, horiz ? 0 : Math.PI / 2, horiz ? C.w - 2 : C.h - 2, 0.9, D(120), 1.2);
    }
  },
  onDeath(g, e) { e.bx.tcSweep = e.bx.tcValve = null; if (g.banner) g.banner('THE ENGINE FALLS SILENT · TURN THE WINCH CLAMPS', 3000); },
  loot: [], lootLuck: 1.2,
};
