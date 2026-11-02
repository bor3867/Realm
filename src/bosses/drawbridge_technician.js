// The Drawbridge Technician (2026-11-02, the user's polish spec, 8): the castle engineer who keeps the drawbridge, an elite
// miniboss in the Drawbridge Engine (area 23). He keeps to the middle of his machinery, four tiles off you, and works it:
//   Gear Barrage        0.7 s; two six-gear fans 0.45 s apart, the gears turning as they fly (95). Every 5 s
//   Winch Snap          1.0 s, its lane marked wall to wall through you; the great chain lashes down it (165) and six
//                       metal fragments fly off its middle (85). Every 8 s
//   Furnace Pressure    1.2 s; two lava geysers erupt in turn, the first where you stand, the second where you went (140,
//                       each leaving a molten pool). Every 10 s
//   Siege Reinforcements  two defenders out of the engine's side alcoves (a Lava Guard, a Cinder Archer), three of his at
//                       most. Every 14 s
// At half his Life the drawbridge's mechanism goes unstable (his change): everything a quarter quicker, and the engine's
// great gears sweep a lane across the chamber every 4 s (marked 0.9 s, 120). He falls; then his two winch clamps are to be
// turned (src/world/castle_plan.js MECHS), and the drawbridge comes down a plank at a time (src/castle.js).
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense). Art: tools/build_technician.py.
import { TAU, angleTo, target, scheduler } from './kit.js';

const D = (n) => n + 4, deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const GEAR = { sprite: 'castle_shots/gear', size: 0.42 }, STONE = { sprite: 'castle_shots/stone', size: 0.38 };
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'], STEEL = ['#a8a0b0', '#a8a0b0', '#5a5560', '#ffffff'];
const lane = (g, e, x, y, a, len, delay, dmg, w = 0.9, cols = RED) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? 0.35 : 0.02), every: 0.5, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0, cols });
const zone = (g, e, x, y, r, delay, dmg, pool) => g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.7, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: ['#ff5a1a', '#ffd650'], ...(pool ? { pool: { life: 2.5, dmg: g.bxDmg(e, D(45)), kind: 'fire' } } : {}) });
const room = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 16, w: 28, h: 32 };
const reachWall = (g, x, y, a) => { let L = 0; while (L < 40 && !g.blockedAt(x + Math.cos(a) * L, y + Math.sin(a) * L, 0.3)) L += 0.5; return L; };

function barrage(g, e) {
  const a = angleTo(e.x, e.y, target(g, e).x, target(g, e).y);
  for (const [t, o] of [[0, 0], [0.45, deg(15)]]) later(e, t, 'gearFan', { a: a + o });
}
function gearFan(g, e, V) { for (let k = 0; k < 6; k++) { const b = shot(g, e, e.x, e.y, V.a + (k / 5 - 0.5) * deg(75), { ...GEAR, speed: 5.4, range: 13, dmg: D(95) }); if (b) b.spin = 9; } g.sfx('hammer'); }
function winch(g, e) {
  const q = target(g, e), a = Math.random() < 0.5 ? 0 : Math.PI / 2, back = reachWall(g, q.x, q.y, a + Math.PI), x0 = q.x - Math.cos(a) * back, y0 = q.y - Math.sin(a) * back, L = back + reachWall(g, q.x, q.y, a);
  lane(g, e, x0, y0, a, L, 1.0, 0, 1.4, STEEL);
  later(e, 1.0, 'winchLash', { x0, y0, a, L });
}
function winchLash(g, e, V) {
  lane(g, e, V.x0, V.y0, V.a, V.L, 0.02, D(165), 1.4, STEEL);
  const mx = V.x0 + Math.cos(V.a) * V.L / 2, my = V.y0 + Math.sin(V.a) * V.L / 2;
  for (let k = 0; k < 6; k++) shot(g, e, mx, my, (k / 6) * TAU + Math.random() * 0.3, { ...STONE, speed: 5, range: 10, dmg: D(85), free: true });
  g.vx({ k: 'shake', amt: 6 }); g.sfx('chain');
}
function furnace(g, e) { const q = target(g, e); zone(g, e, q.x, q.y, 1.6, 1.2, D(140), true); later(e, 0.7, 'furnace2'); g.sfx('bellows'); }
function furnace2(g, e) { const q = target(g, e); zone(g, e, q.x, q.y, 1.6, 1.2, D(140), true); }
function reinforce(g, e) {
  const S = e.bx, C = room(e), live = (S.tcAdds || []).filter((q) => !q.dead);
  if (live.length >= 3) return;
  const doors = [[C.x + 2, C.y + C.h * 0.5], [C.x + C.w - 3, C.y + C.h * 0.5]];
  ['lava_guard', 'cinder_archer'].slice(0, 3 - live.length).forEach((id, k) => {
    const [x, y] = doors[k % 2]; g.fx.push({ kind: 'zone', x, y, r: 1.0, t: 0, delay: 0.8, life: 0.8, dmg: 0, by: '', done: true, colors: ['#ff8a1f', '#ffd650'] });
    later(e, 0.8, 'reinforceIn', { id, x, y });
  });
  if (g.banner) g.banner('REINFORCEMENTS', 1200);
}
function reinforceIn(g, e, V) { const q = g.addEnemy(V.id, V.x, V.y); q.seen = true; (e.bx.tcAdds = e.bx.tcAdds || []).push(q); g.vx({ k: 'burst', x: V.x, y: V.y, n: 12, colors: ['#ff8a1f', '#5a5560'] }); }

const P = {
  barrage: { name: 'Gear Barrage', special: 'barrage', windup: 0.7, dur: 1.0, cd: 5 },
  winch: { name: 'Winch Snap', special: 'winch', windup: 0.3, dur: 1.4, cd: 8 },
  furnace: { name: 'Furnace Pressure', special: 'furnace', windup: 0.3, dur: 2.0, cd: 10 },
  reinforce: { name: 'Siege Reinforcements', special: 'reinforce', windup: 0.4, dur: 1.0, cd: 14 },
};
const sched = scheduler([[1.6, 2.2], [1.1, 1.6]]);

export default {
  id: 'drawbridge_technician', art: 'drawbridge_technician', drawScale: 1.5, name: 'The Drawbridge Technician', biome: 'dungeon', hp: 105000, def: 24, xp: 7000,
  r: 0.9, speed: 2.5, keep: 4, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.5], morphGrace: 1.2,
  choose: (g, e, list) => sched(g, e, list),
  walkPace: 2.5,
  phases: {
    1: { move: 'engine', patterns: [P.barrage, P.winch, P.furnace, P.reinforce] },
    2: { move: 'engine', patterns: [P.barrage, P.winch, P.furnace, P.reinforce] },
  },
  specials: { barrage, gearFan, winch, winchLash, furnace, furnace2, reinforce, reinforceIn },
  moves: {
    engine(g, e, dt) {                                      // in among his machinery: four tiles off you, round the chamber's middle
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
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    if (S.phase >= 2 && S.tcGear && g.t >= S.tcGear) {     // the great gears' sweep, unstable
      S.tcGear = g.t + 4; const C = room(e), horiz = (S.tcGk = (S.tcGk || 0) + 1) % 2, y = C.y + 3 + Math.random() * (C.h - 6), x = C.x + 3 + Math.random() * (C.w - 6);
      lane(g, e, horiz ? C.x + 1 : x, horiz ? y : C.y + 1, horiz ? 0 : Math.PI / 2, horiz ? C.w - 2 : C.h - 2, 0.9, D(120), 1.2);
    }
  },
  onDeath(g, e) { for (const q of e.bx.tcAdds || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } if (g.banner) g.banner('THE ENGINE FALLS SILENT · TURN THE WINCH CLAMPS', 3000); },
  loot: [], lootLuck: 1.2,
};
