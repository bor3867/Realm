// The Hollow Jarl, Warrior: to the user's castle spec (art/sunthiefs_castle_complete_encounter_spec.txt, 2). He fights in
// the Hollow Court beside the Wizard, on the court's shared script (src/bosses/jarl_court.js), walking you down at 4.4
// tiles a second between his attacks:
//   W1 Ninefold Cleave   a red 100-degree wedge 0.75 s, its aim locked at 0.55 s; the axe (185, 2.1 tiles, only as it
//                        swings); nine crescents across 100 degrees (105, 6.5 t/s), nine more offset 5 degrees 0.4 s on
//   W2 Huntsman Charge   a 1.2-tile red line 1.05 s, locked at 0.75 s; a lunge up to 6 tiles in 0.55 s (195); seven
//                        crescents over 140 degrees on the way he went (100); then a second, marked 0.8 s
//   W3 King's Anvil      1.0 s; three rings of 18 slag 0.55 s apart, turned 10 degrees each, three slots out of each (a
//                        gap that moves), 95, 4.1 t/s
//   W4 Execution Cross   'EXECUTION!': a 3-tile lane from him to the wall, locked at 0.8 s, the axe down it at 1.2 s
//                        (220); spectral blades from the walls across it at 1.45 and 2.0 s, seven each with two missing (110)
//   W5 Death Hunt (II+)  'YOU CANNOT RUN.': 1.05 s, then eight seconds after you at 5.5 t/s (he turns, not snaps);
//                        every 1.2 s five crescents over 60 degrees (105); two short dashes, each marked 0.8 s (195)
//   W6 Thronebreaker (alone)  0.95 s; three swings, fans of eleven left, at you, right (105, 6.2 t/s); a slam (215)
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>').
import { TAU, angleTo, target } from './kit.js';
import { courtChoose, courtTick, partner, mirrored } from './jarl_court.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'];
const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, e.jcSurv ? { ...V, speed: V.speed * 1.1 } : V);   // (one crown left: its shots a tenth quicker)
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, STONE = { sprite: 'jarl_shots/stone', size: 0.45 };
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg });
const lane = (g, e, x, y, a, len, delay, dmg, w = 1.2, live = 0.35) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? live : 0.02), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0, cols: RED });
// the court, in the spec's own 40x34 tiles, fitted to the room
const court = (e) => e.room || { x: Math.floor(e.x) - 13, y: Math.floor(e.y) - 16, w: 40, h: 34 };
function reach(e, a, want) {                               // how far he can go that way and stay in the court
  const H = court(e); let L = want;
  while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) break; L -= 0.5; }
  return L;
}
const bearing = (g, e) => { const q = target(g, e); return angleTo(e.x, e.y, q.x, q.y); };

// ================================================================ W1 Ninefold Cleave
function cleave1(g, e) {
  cleave(g, e, bearing(g, e), 2.1, deg(100), 0.55, 0);        // the wedge, following you...
  later(e, 0.55, 'cleaveLock');
}
function cleaveLock(g, e) {                                    // ...locked: 0.2 s to the swing
  const a = bearing(g, e) + (mirrored(e) ? deg(4) : 0);
  cleave(g, e, a, 2.1, deg(100), 0.2, D(185));
  later(e, 0.2, 'crescents', { a, off: 0 }); later(e, 0.6, 'crescents', { a, off: deg(5) });
  later(e, 0.2, 'swish');
}
function crescents(g, e, V) {
  for (let k = 0; k < 9; k++) { const b = V.a + V.off + (k / 8 - 0.5) * deg(100); shot(g, e, e.x, e.y, b, { ...CRESCENT, speed: 6.5, range: 12, dmg: D(105) }); }   // (from his feet: the user's rule for every boss shot)
}
function swish(g) { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); }

// ================================================================ W2 Huntsman Charge
function charge(g, e) { later(e, 0, 'lungeMark', { warn: 1.05, lock: 0.75 }); later(e, 1.6, 'lungeMark', { warn: 0.8, lock: 0.55 }); }
function lungeMark(g, e, V) {
  const a = bearing(g, e), len = V.short ? 3 : 6;
  lane(g, e, e.x, e.y, a, reach(e, a, len), V.lock, 0, 1.2);  // the line, following...
  later(e, V.lock, 'lungeLock', { rest: V.warn - V.lock, len, fan: !V.short });
}
function lungeLock(g, e, V) {                                  // ...locked; then the lunge
  const a = bearing(g, e), L = reach(e, a, V.len || 6);
  lane(g, e, e.x, e.y, a, L, V.rest, 0, 1.2);
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + V.rest, until: g.t + V.rest + (V.len === 3 ? 0.3 : 0.55), a, dmg: D(195), hit: false, fan: V.fan };
}
function arrivalFan(g, e, a) { for (let k = 0; k < 7; k++) shot(g, e, e.x, e.y, a + (k / 6 - 0.5) * deg(140), { ...CRESCENT, speed: 5.8, range: 10, dmg: D(100) }); g.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ASH }); }

// ================================================================ W3 King's Anvil
function anvil(g, e) {
  g.fx.push({ kind: 'zone', src: e, x: e.x, y: e.y, r: 1.6, t: 0, delay: 1.0, life: 1.0, dmg: 0, by: e.D.name, done: true, colors: FIRE });
  const a = bearing(g, e) + (mirrored(e) ? Math.PI : 0);
  for (let k = 0; k < 3; k++) later(e, 1.0 + k * 0.55, 'anvilRing', { k, gap: a + k * deg(40) });
}
function anvilRing(g, e, V) {
  const s = TAU / 18, off = V.k * deg(10), g0 = Math.round((V.gap - off) / s);
  for (let i = 0; i < 18; i++) { if ([g0 - 1, g0, g0 + 1].some((j) => ((j % 18) + 18) % 18 === i)) continue; shot(g, e, e.x, e.y, off + i * s, { ...STONE, speed: 4.1, range: 12, dmg: D(95) }); }
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
}

// ================================================================ W4 Execution Cross
function execution(g, e) {
  if (g.banner) g.banner('EXECUTION!', 1400);
  const a = bearing(g, e);
  lane(g, e, e.x, e.y, a, reach(e, a, 40), 0.8, 0, 3);
  later(e, 0.8, 'execLock');
}
function execLock(g, e) {
  const a = bearing(g, e), L = reach(e, a, 40);
  lane(g, e, e.x, e.y, a, L, 0.4, D(220), 3, 0.35);
  for (const [t, s] of [[0.65, 1], [1.2, -1]]) later(e, t, 'blades', { a, L, s, x: e.x, y: e.y });
  later(e, 0.4, 'swish');
}
function blades(g, e, V) {                                     // from the wall, across the line: seven, two missing
  const C = court(e), nx = -Math.sin(V.a) * V.s, ny = Math.cos(V.a) * V.s, mx = V.x + Math.cos(V.a) * V.L * 0.5, my = V.y + Math.sin(V.a) * V.L * 0.5;
  let d = 0; while (d < 30) { const x = mx + nx * d, y = my + ny * d; if (x < C.x + 1 || x > C.x + C.w - 1 || y < C.y + 1 || y > C.y + C.h - 1) break; d += 0.5; }
  const ox = mx + nx * (d - 0.5), oy = my + ny * (d - 0.5), miss = 1 + Math.floor(Math.random() * 4);
  for (let k = 0; k < 7; k++) { if (k === miss || k === miss + 1) continue; const o = (k - 3) * 1.6; shot(g, e, ox + Math.cos(V.a) * o, oy + Math.sin(V.a) * o, Math.atan2(-ny, -nx), { ...CRESCENT, speed: 5.4, range: 30, dmg: D(110) }); }
}

// ================================================================ W5 Death Hunt
function deathHunt(g, e) {
  const S = e.bx;
  if (g.banner) g.banner('YOU CANNOT RUN.', 1600); g.sfx('roar');
  S.jwHunt = { at: g.t + 1.05, until: g.t + 9.05, a: bearing(g, e) };
  for (let t = 1.05 + 1.2; t < 9.05; t += 1.2) later(e, t - 0.35, 'huntAim');
  for (const t of [2.6, 5.3]) later(e, 1.05 + t - 0.8, 'lungeMark', { warn: 0.8, lock: 0.5, short: true });
}
function huntAim(g, e) { const a = bearing(g, e); later(e, 0.35, 'huntFan', { a }); }
function huntFan(g, e, V) { for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, V.a + (k / 4 - 0.5) * deg(60), { ...CRESCENT, speed: 6, range: 10, dmg: D(105) }); }

// ================================================================ W6 Thronebreaker (the last crown)
function thronebreaker(g, e) {
  g.sfx('roar');
  [[0.95, -35], [1.7, 0], [2.45, 35]].forEach(([t, s]) => later(e, t, 'breakSwing', { s }));
  later(e, 2.45, 'breakSlamMark');
}
function breakSwing(g, e, V) { const a = bearing(g, e) + deg(V.s); for (let k = 0; k < 11; k++) shot(g, e, e.x, e.y, a + (k / 10 - 0.5) * deg(110), { ...CRESCENT, speed: 6.2, range: 11, dmg: D(105) }); swish(g); }
function breakSlamMark(g, e) { g.fx.push({ kind: 'zone', src: e, x: e.x, y: e.y, r: 2, t: 0, delay: 0.8, life: 0.95, dmg: g.bxDmg(e, D(215)), by: e.D.name, done: false, colors: FIRE }); later(e, 0.8, 'slamThud'); }
function slamThud(g, e) { g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer'); }

const P = (name, special, recover) => ({ name, special, windup: 0.45, recover });
const AT = {
  W1: P('Ninefold Cleave', 'cleave1', 1.4), W2: P('Huntsman Charge', 'charge', 3.2), W3: P("King's Anvil", 'anvil', 2.35),
  W4: P('Execution Cross', 'execution', 2.7), W5: { ...P('Death Hunt', 'deathHunt', 10.25), move: 'chase' }, W6: P('Thronebreaker', 'thronebreaker', 4.5),
};

export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 245000, def: 26, xp: 9000,
  r: 1.5, speed: 4.4, keep: 2, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.66, 0.30],
  choose: (g, e) => courtChoose(g, e, AT),
  phases: { 1: { move: 'walk', patterns: Object.values(AT) }, 2: { move: 'walk', patterns: Object.values(AT) }, 3: { move: 'walk', patterns: Object.values(AT) } },
  specials: { cleave1, cleaveLock, crescents, swish, charge, lungeMark, lungeLock, anvil, anvilRing, execution, execLock, blades, deathHunt, huntAim, huntFan,
    thronebreaker, breakSwing, breakSlamMark, slamThud },
  moves: {
    walk(g, e, dt) {                                        // after you, 4.4 tiles a second (a tenth more with one crown left)
      if (e.jwDash) return;
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y), sp = 4.4 * (e.jcSurv ? 1.12 : 1);
      if (d > (e.D.keep || 2)) g.moveCircle(e, ((q.x - e.x) / d) * sp * dt, ((q.y - e.y) / d) * sp * dt, 0.8);
    },
    chase(g, e, dt) {                                       // the Death Hunt: 5.5 t/s, turning at most 2.4 radians a second
      const H = e.bx.jwHunt;
      if (e.jwDash || !H || g.t < H.at || g.t > H.until) return;
      const q = target(g, e), want = angleTo(e.x, e.y, q.x, q.y), da = Math.atan2(Math.sin(want - H.a), Math.cos(want - H.a));
      H.a += Math.max(-2.4 * dt, Math.min(2.4 * dt, da));
      if (Math.hypot(q.x - e.x, q.y - e.y) > 1.6) g.moveCircle(e, Math.cos(H.a) * 5.5 * (e.jcSurv ? 1.12 : 1) * dt, Math.sin(H.a) * 5.5 * (e.jcSurv ? 1.12 : 1) * dt, 0.8);
    },
  },
  onWake(g, e) { if (g.banner) g.banner(partner(e) ? 'THE HOLLOW COURT · "BEND THE KNEE."' : '"BEND THE KNEE."', 2600); },
  onPhase(g, e) { e.jwDash = null; e.bx.jwHunt = null; e.bx.wait = Math.min(e.bx.wait || 0, 1.5); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ASH }); g.sfx('roar'); },
  update(g, e) {
    const S = e.bx;
    courtTick(g, e);
    if (S.state === 'sleep' || S.state === 'intro') return;
    const C = e.jwDash;                                     // a lunge: it strikes you once if it runs into you; the fan on arrival
    if (C && g.t >= C.at) {
      if (g.t >= C.until) { e.jwDash = null; if (C.fan) arrivalFan(g, e, C.a); }
      else {
        const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k;
        const p = g.player; if (!C.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.4) { C.hit = true; g.hurtPlayer(g.bxDmg(e, C.dmg), e.D.name); }
      }
    }
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });
  },
  onDeath(g, e) { e.jwDash = null; g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
