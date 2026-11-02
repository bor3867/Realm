// Solkhar, the Sunthief (2026-11-01, the user's design, attack timings and cooldowns; the user's sprite): the fallen solar
// king at the top of the volcano, the stolen sun burning in his chest; the last fight of the game. Orbiting solar
// weapons, an arena that changes under you, relentless formations. His attacks keep their own schedule (kit.scheduler):
// each its own cooldown from when it ends, a new one every 2.2-3 s (I), 1.8-2.5 s (II), 1.6-2.3 s (III), never the same
// twice running; his chases and the Last Light hold the next until they're done. A volley of solar spears runs under it
// all, where you're going if you run.
//   I   The Golden Tyrant (100-70%), hovering over his throne room's middle:
//       Sundial Spears    eight spears turn about him (0.8 s); four fly, the other four 0.55 s after (115, 6 t/s). cd 5
//       Corona Collapse   two rings shown (1.0 s); the outer closes in as the inner opens out, both with gaps (85). cd 8
//       Solar Judgment    three wide strips lit (1.1 s), struck by beams 0.7 s apart (185); the last throws embers (65). cd 11
//       Solar Harbingers  two small suns (0.95 s) at the room's sides; seven seconds firing in turn every 1.3 s (90). cd 16
//   II  The Broken Sun (70-35%):
//       Eclipse Inversion every 12 s the floor's two halves trade: a 1.4 s warning, nine seconds of one half burning
//                         (gold suns, then purple moons; 35 a half-second), a clear moment between
//       Halo Fracture     six pieces of his halo about him (0.7 s), each loosing a fan in turn, 0.45 s apart (100). cd 7
//       The Stolen Hour   four black suns (0.8 s), each firing a wave of dark crescents in turn 0.65 s apart (110). cd 12
//       Sundering Dawn    a wall of light marked (1.25 s), advancing across the room over 3.2 s, its gap sliding along it
//                         (100); the burning floor goes out while it comes. cd 12
//       Solar Pursuit     0.8 s; six seconds of lunges at you every 1.7 s (each marked), the halo's pieces firing (100-120);
//                         a second to breathe. cd 19
//   III The Sunthief Unbound (35-0%), the room darker:
//       Crown of the Dying Sun  twelve spears in a turning ring (1.0 s); four break (the ways out); the rest fly 0.8 s
//                         on; a second ring 1.2 s after, its ways out moved (130). cd 8
//       Black Sun Implosion  a dark sphere (0.9 s); three seconds of shot drawn in to it, quickening; a flash (0.8 s),
//                         and eight great fragments out (95 in, 160 out). cd 12
//       Eclipse Engine    the room in four quarters (1.0 s); three times, 1.2 s apart, two quarters erupt in rows of
//                         bolts (95). cd 10
//       Solar Pursuit, Unbound  0.7 s; seven seconds of lunges every 1.6 s, the halo firing every 1.1 s (105-130); 1.2 s
//                         to breathe. cd 16
//   The Last Light (15%): his attacks stop for the one sequence, over and over, 2 s apart, its angles new each time:
//       the Gathering (2.5 s: six shards about him firing every 0.65 s, 75), the Sundering (2.8 s: rings out and in,
//       their openings moving, 110), the Final Judgment (3.1 s: three beams, each marked 1.2 s, 200), the Dying Star
//       (2.6 s: the light drawn in, then twenty in five groups of four, wide lanes between, 115), and 1.5 s spent.
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_solkhar.py ('bx_solkhar', 'sol_shots/<name>'); his spears and beams 'ug_shots/unstruck_god.<name>'.
import { DUNGEON_BOSSES } from '../data/enemies.js';
import { TAU, angleTo, target, mark, ahead, running, scheduler } from './kit.js';

const D = (n) => n + 4;
const SUNC = ['#ffd650', '#fff6c8', '#ff9a2a'], VOID = ['#3a1a4a', '#8a5ad8', '#ffd650'];
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const SPEAR = { sprite: 'ug_shots/unstruck_god.spear', size: 0.45 }, ORB = { sprite: 'sol_shots/orb', size: 0.4 }, CRES = { sprite: 'sol_shots/crescent', size: 0.4 };
const FRAG = { sprite: 'sol_shots/fragment', size: 0.55 }, EMBER = { sprite: 'ug_shots/unstruck_god.ember', size: 0.35 }, BOLT = { sprite: 'ug_shots/unstruck_god.star', size: 0.35 };
const show = (g, e, x, y, a, len, delay, col = '#ffd650') => g.fx.push({ kind: 'lane', x, y, a, len, w: 0.6, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: [col, col, col, '#ffffff'] });
const beam = (g, e, x, y, a, len, delay, dmg, w) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + 0.35, dmg: g.bxDmg(e, dmg), by: e.D.name, hitT: 0, cols: ['#ffd650', '#fff6c8', '#ffd650', '#ffffff'] });
const room = (e) => e.room || { x: Math.floor(e.x) - 21, y: Math.floor(e.y) - 17, w: 43, h: 35 };
const clampR = (e, x, y, m = 2) => { const C = room(e); return [Math.max(C.x + m, Math.min(C.x + C.w - m, x)), Math.max(C.y + m, Math.min(C.y + C.h - m, y))]; };
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const CORE = (g, e) => at(g, e, 0, 4.2);
const toward = (g, e, T) => { const q = target(g, e); return running(e) ? ahead(g, e, T) : [q.x, q.y]; };

// ================================================================ under it all
function solarVolley(g, e, V) {                            // three spears from his sun, where you're going if you run
  const [ox, oy] = CORE(g, e), q = target(g, e), [x, y] = toward(g, e, Math.hypot(q.x - ox, q.y - oy) / 7), a = angleTo(ox, oy, x, y);
  for (const o of running(e) ? [-0.32, -0.11, 0.11, 0.32] : [-0.24, -0.12, 0, 0.12, 0.24]) shot(g, e, ox, oy, a + o, { ...SPEAR, speed: 7, range: 16, dmg: D(100) });   // (standing still: a tight fan of five at you)
}

// ================================================================ I
function sundial(g, e, V) {                                // eight spears turn about him; four fly; the rest 0.55 s after
  const q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y);
  e.bx.slSpears = { t0: g.t, n: 8, r: 3, a0, w: 0.9, until: g.t + 1.4, gone: [] };
  later(e, 0.8, 'sundialFly', { set: 0 }); later(e, 1.35, 'sundialFly', { set: 1 });
}
function sundialFly(g, e, V) {
  const Q = e.bx.slSpears; if (!Q) return;
  for (let i = V.set; i < Q.n; i += 2) { const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / Q.n) * TAU; shot(g, e, e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r, a, { ...SPEAR, speed: 6, range: 15, dmg: D(115) }); Q.gone.push(i); }
  g.sfx('zap');
}
function corona(g, e, V) {                                 // two rings shown; the outer closes as the inner opens; gaps in both
  const g1 = Math.random() * TAU, g2 = g1 + Math.PI / 2;
  e.bx.slCorona = { t0: g.t, g1, g2 };
  later(e, 1.0, 'coronaGo', { g1, g2, dmg: D(85) });
}
function coronaGo(g, e, V) {
  const n = 16, R = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, skip1 = [V.g1, V.g1 + Math.PI].some((G) => Math.abs(Math.atan2(Math.sin(a - G), Math.cos(a - G))) < 0.42), skip2 = [V.g2, V.g2 + Math.PI].some((G) => Math.abs(Math.atan2(Math.sin(a - G), Math.cos(a - G))) < 0.42);
    if (!skip1) shot(g, e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, a + Math.PI, { ...ORB, speed: 3.5, range: R - 0.5, dmg: V.dmg });
    if (!skip2) shot(g, e, e.x + Math.cos(a) * 1.2, e.y + Math.sin(a) * 1.2, a, { ...ORB, speed: 3.5, range: 12, dmg: V.dmg });
  }
  e.bx.slCorona = null;
}
function judgment(g, e, V) {                               // three wide strips lit 1.1 s; beams 0.7 s apart; embers from the last
  const C = room(e), q = target(g, e), across = Math.random() < 0.5, a = across ? 0 : Math.PI / 2;
  const base = across ? q.y : q.x, offs = [0, -4.5, 4.5].sort(() => Math.random() - 0.5);
  offs.forEach((o, k) => {
    const c = base + o, x0 = across ? C.x + 0.5 : c, y0 = across ? c : C.y + 0.5, len = across ? C.w - 1 : C.h - 1;
    beam(g, e, x0, y0, a, len, 1.1 + k * 0.7, D(185), 1.6);
    if (k === 2) later(e, 1.1 + k * 0.7, 'embers', { x: across ? q.x : c, y: across ? c : q.y, dmg: D(65) });
  });
}
function embers(g, e, V) { for (let i = 0; i < 6; i++) shot(g, e, V.x, V.y, (i / 6) * TAU + 0.3, { ...EMBER, speed: 4.5, range: 9, dmg: V.dmg }); g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer'); }
function harbingers(g, e, V) {                             // two small suns at the room's sides, seven seconds firing in turn
  const C = room(e), spots = [{ x: C.x + 3.5, y: C.y + C.h / 2 }, { x: C.x + C.w - 3.5, y: C.y + C.h / 2 }];
  for (const s of spots) mark(g, e, s.x, s.y, 1.2, 0.95, 0, SUNC, 0);
  e.bx.slSuns = { at: spots, from: g.t + 0.95, until: g.t + 7.95, t: 0, k: 0 };
}

// ================================================================ II
function eclipseTick(g, e, dt) {                           // every 12 s the floor's two halves trade: 1.4 s warned, 9 s burning, a clear moment
  const S = e.bx, C = room(e);
  if (S.slDawnUntil > g.t) return;                         // (the burning floor goes out while the Dawn comes)
  if ((S.slEclT = (S.slEclT ?? 1.5) - dt) > 0) return;
  S.slEclT = 12; S.slEcl = (S.slEcl || 0) + 1;
  const solar = S.slEcl % 2 === 1, col = solar ? '#ffd650' : '#9a5ad8', spots = [];
  for (let gy = 0; gy < 9; gy++) for (let gx = 0; gx < 11; gx++) if ((gx + gy) % 2 === (solar ? 0 : 1)) spots.push([C.x + 2.2 + gx * (C.w - 4.4) / 10, C.y + 2.2 + gy * (C.h - 4.4) / 8]);
  for (const [x, y] of spots) g.fx.push({ kind: 'zone', src: e, x, y, r: 1.75, t: 0, delay: 1.4, life: 1.4, dmg: 0, by: e.D.name, done: true, colors: [col, '#ffffff'] });
  later(e, 1.4, 'eclipseOn', { spots, col, solar });
  if (g.banner) g.banner(solar ? 'The sun burns the floor: stand in the shadow!' : 'The eclipse falls: stand in the light!', 1800);
}
function eclipseOn(g, e, V) { e.bx.slPools = V.spots.map(([x, y]) => { const f = { kind: 'pool', x, y, r: 1.75, t: 0, life: 9, dmg: g.bxDmg(e, D(35)), by: e.D.name, col: V.col, eclipse: V.solar ? 'sun' : 'moon' }; g.fx.push(f); return f; }); }
function halo(g, e, V) {                                   // six pieces of his halo about him; each a fan in turn
  const S = e.bx; S.slHalo = { t0: g.t, r: 3.4, w: 1.4, until: g.t + 3.6 };
  for (let k = 0; k < 6; k++) later(e, 0.7 + k * 0.45, 'haloFan', { k, dmg: D(100) });
}
function haloFan(g, e, V) {
  const Q = e.bx.slHalo; if (!Q) return;
  const a = Q.w * (g.t - Q.t0) + (V.k / 6) * TAU, x = e.x + Math.cos(a) * Q.r, y = e.y + Math.sin(a) * Q.r, [tx, ty] = toward(g, e, 0.6), b = angleTo(x, y, tx, ty);
  for (const o of [-0.2, 0, 0.2]) shot(g, e, x, y, b + o, { ...BOLT, speed: 5.5, range: 13, dmg: V.dmg });
}
function stolenHour(g, e, V) {                             // four black suns; each a wave of dark crescents, in turn 0.65 s apart
  const C = room(e), at4 = [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }));
  e.bx.slBlack = { at: at4, until: g.t + 4.8, flash: [] };
  for (let k = 0; k < 4; k++) later(e, 0.8 + k * 0.65, 'blackFire', { k, dmg: D(110) });
}
function blackFire(g, e, V) {
  const B = e.bx.slBlack; if (!B) return;
  const s = B.at[V.k], q = target(g, e), a = angleTo(s.x, s.y, q.x, q.y);
  B.flash[V.k] = g.t;
  for (let i = 0; i < 5; i++) shot(g, e, s.x, s.y, a + (i / 4 - 0.5) * 0.8, { ...CRES, speed: 4.8, range: 18, dmg: V.dmg });
}
function dawn(g, e, V) {                                   // a wall of light marked, then rows of it across the room, the gap sliding along
  const S = e.bx, C = room(e), q = target(g, e), fromLeft = q.x > C.x + C.w / 2;
  S.slDawnUntil = g.t + 4.6; for (const f of S.slPools || []) f.life = 0;
  const x0 = fromLeft ? C.x + 0.6 : C.x + C.w - 0.6, a = fromLeft ? 0 : Math.PI;
  show(g, e, x0, C.y + 0.6, Math.PI / 2, C.h - 1.2, 1.25, '#fff6c8');
  const g0 = C.y + 3 + Math.random() * (C.h - 12), drift = (Math.random() < 0.5 ? 1 : -1) * 0.7;
  for (let k = 0; k < 4; k++) later(e, 1.25 + k * 0.32, 'dawnRow', { x0, a, gap: Math.max(C.y + 2.5, Math.min(C.y + C.h - 2.5, g0 + drift * k * 2.2)), dmg: D(100) });   // (a wall four rows deep, its gap sliding as it goes)
}
function dawnRow(g, e, V) {
  const C = room(e);
  for (let y = C.y + 0.9; y < C.y + C.h - 0.5; y += 1.05) if (Math.abs(y - V.gap) > 1.4) shot(g, e, V.x0, y, V.a, { ...ORB, speed: 3.2, range: C.w, dmg: V.dmg });
}
function pursuit(g, e, V) {                                // lunges at you every 1.7 s (1.6 unbound), each marked; the halo firing
  const S = e.bx, unbound = S.phase === 3, n = unbound ? 4 : 3, every = unbound ? 1.6 : 1.7, warn = unbound ? 0.7 : 0.8;
  if (g.banner) g.banner(unbound ? 'The Sunthief hunts you!' : 'Solkhar descends on you!', 1400);
  S.slHalo = { t0: g.t, r: 3.2, w: 1.8, until: g.t + warn + n * every + 0.4 };
  for (let k = 0; k < n; k++) later(e, warn + k * every, 'lunge', { dmg: D(unbound ? 130 : 120) });
  for (let t = warn + 0.5; t < warn + n * every; t += unbound ? 1.1 : 1.4) later(e, t, 'haloVolley', { dmg: D(unbound ? 105 : 100) });
}
function lunge(g, e, V) {
  const C = room(e), [tx, ty] = toward(g, e, 0.6), a = angleTo(e.x, e.y, tx, ty);
  let L = Math.min(7, Math.hypot(tx - e.x, ty - e.y) + 1.5);
  while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > C.x + 2.2 && x < C.x + C.w - 2.2 && y > C.y + 2.2 && y < C.y + C.h - 2.2) break; L -= 0.5; }
  beam(g, e, e.x, e.y, a, L, 0.5, V.dmg, 1.4);
  e.slDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + 0.5, until: g.t + 0.8 };
  later(e, 0.8, 'trail', {});
}
function trail(g, e) { g.fx.push({ kind: 'pool', x: e.x, y: e.y, r: 1.1, t: 0, life: 2.5, dmg: g.bxDmg(e, D(40)), by: e.D.name, col: '#ffb030' }); g.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: SUNC }); }
function haloVolley(g, e, V) {
  const Q = e.bx.slHalo; if (!Q) return;
  for (let k = 0; k < 6; k += 2) { const a = Q.w * (g.t - Q.t0) + (k / 6) * TAU, x = e.x + Math.cos(a) * Q.r, y = e.y + Math.sin(a) * Q.r; for (const o of [-0.15, 0.15]) shot(g, e, x, y, a + o, { ...BOLT, speed: 5.5, range: 12, dmg: V.dmg }); }
}

// ================================================================ III
function crown(g, e, V) {                                  // twelve spears in a turning ring; four break; the rest fly; a second ring, its ways out moved
  for (let r = 0; r < 2; r++) later(e, r * 2.0, 'crownRing', { r, dmg: D(130) });
}
function crownRing(g, e, V) {
  const q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y) + (V.r ? Math.PI / 6 : 0), br = Math.floor(Math.random() * 3);
  const broken = [br, br + 3, br + 6, br + 9].map((i) => i % 12);
  e.bx.slCrown = { t0: g.t, n: 12, r: 4, a0, w: 0.785 / 1.0, broken, breakAt: g.t + 1.0, until: g.t + 1.8 };   // (it turns ~45 degrees as it forms)
  later(e, 1.8, 'crownFly', { dmg: V.dmg });
}
function crownFly(g, e, V) {
  const Q = e.bx.slCrown; if (!Q) return;
  for (let i = 0; i < Q.n; i++) { if (Q.broken.includes(i)) continue; const a = Q.a0 + Q.w * Math.min(1.0, g.t - Q.t0) + (i / Q.n) * TAU; shot(g, e, e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r, a, { ...SPEAR, speed: 6.5, range: 16, dmg: V.dmg }); }
  e.bx.slCrown = null; g.sfx('zap');
}
function implosion(g, e, V) {                              // a dark sphere; shot drawn in to it, quickening; a flash; eight fragments out
  const S = e.bx; S.slSphere = { t0: g.t, until: g.t + 5.2, flashAt: g.t + 3.9 };
  for (let w = 0; w < 6; w++) later(e, 0.9 + w * 0.5, 'drawIn', { w, dmg: D(95) });
  later(e, 4.7, 'erupt', { dmg: D(160) });
}
function drawIn(g, e, V) {
  const n = 10, off = V.w * 0.31, R = 10;
  for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU; shot(g, e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, a + Math.PI, { ...ORB, speed: 2.5, range: R - 0.8, dmg: V.dmg, mv: { accel: 1.5, max: 4.5 } }); }
}
function erupt(g, e, V) {
  const off = Math.random() * TAU;
  for (let i = 0; i < 8; i++) shot(g, e, e.x, e.y, off + (i / 8) * TAU, { ...FRAG, speed: 5, range: 16, dmg: V.dmg });
  g.vx({ k: 'shake', amt: 10 }); g.sfx('hammer'); e.bx.slSphere = null;
}
function engine(g, e, V) {                                 // the room in four quarters; three times two of them erupt in rows of bolts
  const pairs = [[0, 2], [1, 3], [0, 1], [2, 3], [1, 2], [0, 3]].sort(() => Math.random() - 0.5).slice(0, 3);
  e.bx.slEngine = { pairs, t0: g.t, until: g.t + 4.0 };
  pairs.forEach((p, k) => later(e, 1.0 + k * 1.2, 'engineFire', { p, dmg: D(95) }));
}
function engineFire(g, e, V) {                             // each quarter erupts: rows of bolts running out across it, in order
  const C = room(e);
  for (const q of V.p) {
    const left = q === 0 || q === 3, top = q === 0 || q === 1, ax = left ? -1 : 1, ay = top ? -1 : 1;
    for (let k = 0; k < 6; k++) { const o = 1 + k * 1.6; shot(g, e, e.x + ax * 1.2, e.y + ay * o, left ? Math.PI : 0, { ...BOLT, speed: 5, range: C.w / 2, dmg: V.dmg }); shot(g, e, e.x + ax * o, e.y + ay * 1.2, top ? -Math.PI / 2 : Math.PI / 2, { ...BOLT, speed: 5, range: C.h / 2, dmg: V.dmg }); }
  }
}

// ================================================================ The Last Light
function lastLight(g, e, V) {
  const S = e.bx, k = (S.slLL = (S.slLL || 0) + 1), twist = k * 0.7;
  if (g.banner && k === 1) g.banner('THE LAST LIGHT', 2600);
  S.slHalo = { t0: g.t, r: 3, w: 1.3 * (k % 2 ? 1 : -1), until: g.t + 2.5 };            // the Gathering
  for (let i = 0; i < 4; i++) later(e, 0.2 + i * 0.65, 'gather', { dmg: D(75) });
  for (let i = 0; i < 2; i++) later(e, 2.5 + i * 1.2, 'sunder', { twist: twist + i * 0.9, dmg: D(110) });   // the Sundering
  [0, 1, 2].forEach((i) => later(e, 5.3 + i * 0.95, 'judgeBeam', { i, twist, dmg: D(200) }));            // the Final Judgment
  later(e, 8.4, 'dyingIn', {}); later(e, 9.9, 'dyingStar', { twist, dmg: D(115) });                       // the Dying Star
}
function gather(g, e, V) { const Q = e.bx.slHalo; if (!Q) return; for (let k = 0; k < 6; k++) { const a = Q.w * (g.t - Q.t0) + (k / 6) * TAU; shot(g, e, e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r, a, { ...BOLT, speed: 4.5, range: 12, dmg: V.dmg }); } }
function sunder(g, e, V) {                                 // a ring out from him and one in to him, their openings opposite and moving
  const n = 22, R = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, d1 = Math.abs(Math.atan2(Math.sin(a - V.twist), Math.cos(a - V.twist))), d2 = Math.abs(Math.atan2(Math.sin(a - V.twist - Math.PI), Math.cos(a - V.twist - Math.PI)));
    if (d1 > 0.5) shot(g, e, e.x, e.y, a, { ...ORB, speed: 4, range: 12, dmg: V.dmg });
    if (d2 > 0.5) shot(g, e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, a + Math.PI, { ...ORB, speed: 4, range: R - 0.6, dmg: V.dmg });
  }
}
function judgeBeam(g, e, V) {                              // three great beams, each marked 1.2 s, through where you are
  const C = room(e), q = target(g, e), a = V.twist + V.i * (Math.PI / 3);
  const L = Math.hypot(C.w, C.h), x0 = q.x - Math.cos(a) * L / 2, y0 = q.y - Math.sin(a) * L / 2;
  beam(g, e, x0, y0, a, L, 1.2, V.dmg, 1.8);
}
function dyingIn(g, e) { e.bx.slSphere = { t0: g.t, until: g.t + 1.6, flashAt: g.t + 1.0 }; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.vx({ k: 'burst', x: e.x + Math.cos(a) * 6, y: e.y + Math.sin(a) * 6, n: 3, colors: SUNC }); } }
function dyingStar(g, e, V) {                              // twenty in five groups of four, wide lanes between
  for (let grp = 0; grp < 5; grp++) for (let i = 0; i < 4; i++) shot(g, e, e.x, e.y, V.twist + (grp / 5) * TAU + (i - 1.5) * 0.12, { ...FRAG, speed: 5, range: 16, dmg: V.dmg });
  g.vx({ k: 'shake', amt: 12 }); g.sfx('hammer'); e.bx.slSphere = null;
}

const P = {
  sundial: { name: 'Sundial Spears', special: 'sundial', windup: 0.2, dur: 1.5, cd: 5 },
  corona: { name: 'Corona Collapse', special: 'corona', windup: 0.2, dur: 4.5, cd: 8 },
  judgment: { name: 'Solar Judgment', special: 'judgment', windup: 0.2, dur: 2.9, cd: 11 },
  harbingers: { name: 'Solar Harbingers', special: 'harbingers', windup: 0.2, dur: 8.0, cd: 16 },
  halo: { name: 'Halo Fracture', special: 'halo', windup: 0.2, dur: 3.4, cd: 7 },
  hour: { name: 'The Stolen Hour', special: 'stolenHour', windup: 0.2, dur: 4.8, cd: 12 },
  dawn: { name: 'Sundering Dawn', special: 'dawn', windup: 0.2, dur: 4.6, cd: 12, block: true },
  pursuit: { name: 'Solar Pursuit', special: 'pursuit', windup: 0.2, dur: 6.0, cd: 19, block: true, after: 1.0, w: 1.5 },
  crown: { name: 'Crown of the Dying Sun', special: 'crown', windup: 0.2, dur: 3.8, cd: 8 },
  implosion: { name: 'Black Sun Implosion', special: 'implosion', windup: 0.2, dur: 5.2, cd: 12, block: true },
  engine: { name: 'Eclipse Engine', special: 'engine', windup: 0.2, dur: 3.9, cd: 10 },
  unbound: { name: 'Solar Pursuit, Unbound', special: 'pursuit', windup: 0.2, dur: 7.1, cd: 16, block: true, after: 1.2, w: 1.5 },
  lastLight: { name: 'The Last Light', special: 'lastLight', windup: 0.2, dur: 11.0, cd: 0, block: true, after: 1.5 + 2.0 },
};
const plain = scheduler([[2.2, 3.0], [1.8, 2.5], [1.6, 2.3]]);

export default {
  id: 'unstruck_god', art: 'solkhar', shotSheet: 'ug_shots', name: 'Solkhar, the Sunthief', biome: 'dungeon', hp: 650000, def: 34, xp: 30000,
  r: 2.2, speed: 1.4, keep: 6, faces: false, spawnCentre: true, tempo: 1, dmgScale: 1, thresholds: [0.70, 0.35],
  // his schedule; at 15% only the Last Light, over and over (his other attacks stop for it)
  choose(g, e, list) {
    if (e.hp / e.maxHp > 0.15) return plain(g, e, list);
    const C = e.bx.sch || (e.bx.sch = { ready: {}, next: 0, last: null });
    if (g.t < C.next) return null;
    C.next = g.t + P.lastLight.windup + P.lastLight.dur + P.lastLight.after; C.last = P.lastLight.name;
    return { recover: 0.05, ...P.lastLight };
  },
  phases: {
    1: { move: 'center', pressure: [{ every: 1.8, special: 'solarVolley' }], patterns: [P.sundial, P.corona, P.judgment, P.harbingers] },
    2: { move: 'center', pressure: [{ every: 1.5, special: 'solarVolley' }], patterns: [P.halo, P.hour, P.dawn, P.pursuit, P.sundial, P.judgment] },
    3: { move: 'center', pressure: [{ every: 1.25, special: 'solarVolley' }], patterns: [P.crown, P.implosion, P.engine, P.unbound, P.halo] },
  },
  specials: { solarVolley, sundial, sundialFly, corona, coronaGo, judgment, embers, harbingers, eclipseOn, halo, haloFan, stolenHour, blackFire, dawn, dawnRow,
    pursuit, lunge, trail, haloVolley, crown, crownRing, crownFly, implosion, drawIn, erupt, engine, engineFire, lastLight, gather, sunder, judgeBeam, dyingIn, dyingStar },
  onWake(g) { if (g.banner) g.banner('Solkhar, the Sunthief, rises from his throne.', 2800); },
  onPhase(g, e, ph) {
    const S = e.bx; S.slSpears = S.slCorona = S.slHalo = S.slBlack = S.slCrown = S.slSphere = S.slEngine = null; S.slSuns = null; e.slDash = null;
    for (const f of S.slPools || []) f.life = 0;
    if (ph === 2) { if (g.banner) g.banner('His halo breaks: the Broken Sun!', 2600); g.vx({ k: 'shake', amt: 8 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 40, colors: SUNC }); g.sfx('shatter'); S.slEclT = 2.5; }
    if (ph === 3) { if (g.banner) g.banner('The Sunthief Unbound!', 2800); g.vx({ k: 'shake', amt: 12 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 60, colors: [...SUNC, '#ff3a1a'] }); g.sfx('roar'); if (g.map) g.map.ambient = 'rgba(14,4,10,0.62)'; }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const C = e.slDash;                                     // a lunge in flight
    if (C && g.t >= C.at) { if (g.t >= C.until) e.slDash = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; } }
    if (S.phase === 2 && S.state !== 'morph' && e.hp / e.maxHp > 0.15) eclipseTick(g, e, dt);   // (the floor turns only in II)
    const U = S.slSuns;                                     // the harbingers: in turn, a fan each every 1.3 s
    if (U && g.t > U.from && S.state !== 'morph') {
      if (g.t > U.until) S.slSuns = null;
      else if ((U.t -= dt) <= 0) { U.t = 0.65; const s = U.at[U.k++ % 2], [tx, ty] = toward(g, e, 0.8), a = angleTo(s.x, s.y, tx, ty); for (let i = 0; i < 5; i++) shot(g, e, s.x, s.y, a + (i / 4 - 0.5) * 0.7, { ...ORB, speed: 5, range: 16, dmg: D(90) }); }
    }
    for (const k of ['slSpears', 'slHalo', 'slBlack', 'slSphere', 'slEngine']) if (S[k] && g.t > S[k].until) S[k] = null;
  },
  onDeath(g, e) { const S = e.bx; S.slSpears = S.slCorona = S.slHalo = S.slBlack = S.slCrown = S.slSphere = S.slEngine = S.slSuns = null; for (const f of S.slPools || []) f.life = 0; g.vx({ k: 'shake', amt: 14 }); if (g.banner) g.banner('SOLKHAR IS STRUCK DOWN. THE SUN IS FREE.', 3600); },
  // what he holds about him and the room's marks: drawn on the floor and in the air
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, C = room(e);
    if (S.slEngine) {                                       // the four quarters: the next pair to erupt glowing
      const k = Math.min(2, Math.floor(Math.max(0, g.t - S.slEngine.t0) / 1.2)), next = S.slEngine.pairs[k];
      for (let q = 0; q < 4; q++) {
        const left = q === 0 || q === 3, top = q === 0 || q === 1, x0 = left ? C.x : e.x, y0 = top ? C.y : e.y, x1 = left ? e.x : C.x + C.w, y1 = top ? e.y : C.y + C.h;
        const [ax, ay] = r.proj(x0, y0), [bx, by] = r.proj(x1, y1), hot = next && next.includes(q);
        b.globalAlpha = hot ? 0.16 + 0.1 * Math.sin(g.t * 14) : 0.05; b.fillStyle = hot ? '#ffd650' : '#9a5ad8';
        b.fillRect(Math.round(Math.min(ax, bx)), Math.round(Math.min(ay, by)), Math.round(Math.abs(bx - ax)), Math.round(Math.abs(by - ay)));
      }
      b.globalAlpha = 1;
    }
    const Co = S.slCorona;                                  // the corona's two rings, shown before they move
    if (Co) { b.fillStyle = '#ffd650'; for (let i = 0; i < 16; i++) for (const R of [10, 1.2]) { const a = (i / 16) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R); b.globalAlpha = 0.5; b.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); } b.globalAlpha = 1; }
  },
  draw(r, g, e) {
    const S = e.bx, R = r.R; if (!R) return;
    const get = (k) => { const M = r.objDefs || (r.objDefs = new Map()); let d = M.get(k); if (d === undefined) M.set(k, (d = R.resolve(k) || null)); return d; };
    const spear = get('ug_shots/unstruck_god.spear'), blade = get('ug_shots/unstruck_god.blade'), sun = get('sol_shots/sun'), black = get('sol_shots/blacksun');
    const put = (def, x, y, o) => { if (def) { const [sx, sy] = r.proj(x, y); r.drawDef(def, Object.keys(def.frames)[0], Math.round(sx), Math.round(sy) - 24, { center: true, ...o }); } };
    const Q = S.slSpears;                                   // the sundial's spears, turning about him
    if (Q) for (let i = 0; i < Q.n; i++) { if (Q.gone.includes(i)) continue; const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / Q.n) * TAU; put(spear, e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r, { rot: a }); }
    const Cr = S.slCrown;                                   // the crown's twelve, the broken four gone once they break
    if (Cr) for (let i = 0; i < Cr.n; i++) { if (Cr.broken.includes(i) && g.t > Cr.breakAt) continue; const a = Cr.a0 + Cr.w * Math.min(1.0, g.t - Cr.t0) + (i / Cr.n) * TAU; put(spear, e.x + Math.cos(a) * Cr.r, e.y + Math.sin(a) * Cr.r, { rot: a, alpha: Cr.broken.includes(i) ? 0.5 : 1 }); }
    const H = S.slHalo;                                     // the halo's pieces
    if (H) for (let k = 0; k < 6; k++) { const a = H.w * (g.t - H.t0) + (k / 6) * TAU; put(blade, e.x + Math.cos(a) * H.r, e.y + Math.sin(a) * H.r, { rot: a }); }
    if (S.slSuns && g.t > S.slSuns.from) for (const s of S.slSuns.at) put(sun, s.x, s.y + 1.4, { scale: 1 + 0.1 * Math.sin(g.t * 8) });
    const B = S.slBlack;                                    // the black suns, each flashing as it fires
    if (B) B.at.forEach((s, k) => put(black, s.x, s.y + 1.4, { scale: g.t - (B.flash[k] || -9) < 0.25 ? 1.3 : 1 }));
    const Sp = S.slSphere;                                  // the dark sphere over his chest; a flash before it bursts
    if (Sp) put(g.t > Sp.flashAt && Math.floor(g.t * 12) % 2 ? sun : black, e.x, e.y - 0.4, { scale: 1.6 });
  },
  lights(g, e) { const ph = e.bx.phase || 1; return [{ x: e.x, y: e.y, h: 4.2, r: ph === 3 ? 140 : 110, col: '#ffd650', fire: true }]; },
  get loot() { return DUNGEON_BOSSES.the_unstruck_god.loot; },
  lootLuck: 2,
};
