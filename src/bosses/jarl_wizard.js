// The Hollow Jarl, Wizard (2026-11-01, the user's design; its overhaul; then the user's attack timings and cooldowns).
// He holds the Throne's second champion court and its seal. Formations, many firing points, portals, precise dodging:
// he never stands still (he slides to a new place every couple of seconds, keeping his distance), a leading volley of
// bolts runs under everything, and his attacks keep their own schedule (kit.scheduler): each its own cooldown from when
// it ends, a new one every 2.2-3 s (I), 1.8-2.5 s (II), 1.6-2.3 s (III), never the same twice running; his signatures
// (the Pursuit, the Testament) never overlap. Every volley locks its aim before it flies; every blast is marked first.
//   I   The Runecaller (100-70%):
//       Runic Dial        0.9 s to form; eight runes turn about him six seconds, the alternate four firing every
//                         0.75 s (75, 4.5 t/s). cd 9
//       Spectral Constellation  shown 0.55 s; three volleys of five lances 0.5 s apart, each shown and locked (105, 6 t/s). cd 3
//       Sigils of Ruin    three sigils 0.4 s apart where you've been (and where you're going), each 1.1 s to burst (145;
//                         four shards, 55). cd 6.5
//   II  The Unwoven Court (70-35%), and the lances and sigils still:
//       Hollow Convergence  four portals (they can be broken) after 1.0 s; seven seconds of turning crosses of bolts, each
//                         portal every 1.1 s, in turn (85). cd 16
//       Arcane Crossfire  two portals either side of you (0.8 s); their fans cross; he fires a third volley 0.65 s on and
//                         a last, offset, 0.65 s after (95). cd 8
//       Runic Prison      eight runes form round you (1.0 s) and close in over 2.2 s; three go dark (the way out); the
//                         rest fire inward near the end (95). cd 12
//       Phantom Reflections  0.65 s; he steps to another corner (never onto you), two reflections with him; they fire
//                         together 0.7 s on and 0.85 s after that, then fade (75). cd 11
//   III The Unmaking (35-0%), and the sigils and lances:
//       Spectral Pursuit  0.7 s; seven seconds blinking from place to place every 2.25 s (each place marked 0.5 s first),
//                         a portal opening where he was, firing short bursts (85). cd 15
//       The Returning Curse  0.7 s; daggers out 1.4 s, a stop and a flash 0.45 s, back along the same paths (90). cd 7.5
//       Arcane Lattice    0.9 s; lines between four anchors, three patterns 1.6 s each, each change shown 0.65 s first,
//                         bolts running along them (100). cd 12
//       The Hollow Testament  0.9 s; two seconds of turning rune walls, 2.5 s of portal crossfire, 2.5 s of a ring
//                         closing on you (its opening marked); 1.3 s while his staff mends: your opening (85-115). cd 18
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_jarl_wizard.py ('bx_jarl_wizard', 'wiz_shots/<name>', 'wiz_kin/portal').
import { TAU, angleTo, target, mark, ahead, running, scheduler } from './kit.js';

const D = (n) => n + 4;
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last: a V passed on whole keeps the step it's for)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const BOLT = { sprite: 'wiz_shots/bolt', size: 0.35 }, LANCE = { sprite: 'wiz_shots/lance', size: 0.4 }, DAGGER = { sprite: 'wiz_shots/dagger', size: 0.35 };
const SPIRIT = ['#b884cc', '#e6c8ff', '#8e4ca8'];
const show = (g, e, x, y, a, len, delay) => g.fx.push({ kind: 'lane', x, y, a, len, w: 0.6, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: ['#b884cc', '#b884cc', '#b884cc', '#ffffff'] });
const spot = (g, e, x, y, t) => mark(g, e, x, y, 0.9, t, 0, SPIRIT, 0);                        // (a place marked: something comes here)
const court = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 10, w: 29, h: 23 };
const clampC = (e, x, y, m = 1.8) => { const C = court(e); return [Math.max(C.x + m, Math.min(C.x + C.w - m, x)), Math.max(C.y + m, Math.min(C.y + C.h - m, y))]; };
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const STAFF = (g, e) => at(g, e, -2.5, 5.6);
const aimAt = (g, e, ox, oy, T) => { const q = target(g, e); const [x, y] = running(e) ? ahead(g, e, T) : [q.x, q.y]; return angleTo(ox, oy, x, y); };
function portal(g, e, x, y, life, hp) {                    // a portal: it hangs in the air; it can be broken; it closes by itself
  const [px, py] = clampC(e, x, y, 1.5), q = g.addEnemy('wiz_portal', px, py);
  q.noLoot = true; q.seen = true; q.jzUntil = g.t + life; if (hp) q.hp = q.maxHp = hp;
  g.vx({ k: 'burst', x: px, y: py, n: 14, colors: SPIRIT });
  (e.bx.jzPortals = e.bx.jzPortals || []).push(q);
  return q;
}
function corners(e) { const C = court(e); return [[0.18, 0.2], [0.82, 0.2], [0.82, 0.8], [0.18, 0.8]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v })); }

// ================================================================ under it all: a leading volley
function spark(g, e, V) {
  const [ox, oy] = STAFF(g, e), d = Math.hypot(target(g, e).x - e.x, target(g, e).y - e.y), a = aimAt(g, e, ox, oy, d / 6.5);
  for (const o of running(e) ? [-0.3, -0.15, 0, 0.15, 0.3] : [-0.16, 0, 0.16]) shot(g, e, ox, oy, a + o, { ...BOLT, speed: 6.5, range: 13, dmg: D(70) });
}

// ================================================================ I
function dial(g, e, V) {                                   // 0.9 s to form; six seconds of the alternate four firing every 0.75 s
  const S = e.bx; S.jzDial = { t0: g.t, dur: 6.9, r: 2.6, w: 0.7 * (Math.random() < 0.5 ? 1 : -1), a0: Math.random() * TAU };
  for (let k = 0; k < 8; k++) later(e, 0.9 + k * 0.75, 'dialFire', { set: k % 2, dmg: D(75) });
}
function dialFire(g, e, V) {
  const Q = e.bx.jzDial; if (!Q) return;
  for (let i = V.set; i < 8; i += 2) {
    const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / 8) * TAU, x = e.x + Math.cos(a) * Q.r, y = e.y + Math.sin(a) * Q.r;
    for (const o of [-0.12, 0.12]) shot(g, e, x, y, a + o, { ...BOLT, speed: 4.5, range: 11, dmg: V.dmg });
  }
}
function constellation(g, e, V) {                          // shown 0.55 s; three volleys 0.5 s apart, each shown and locked
  [[0, 0.55, false], [0.75, 0.3, true], [1.25, 0.3, true]].forEach(([t, delay, lead]) => later(e, t, 'lanceShow', { delay, lead, dmg: D(105) }));
}
function lanceShow(g, e, V) {
  const [ox, oy] = STAFF(g, e), q = target(g, e), a = V.lead ? aimAt(g, e, ox, oy, Math.hypot(q.x - ox, q.y - oy) / 6) : angleTo(ox, oy, q.x, q.y);
  for (let i = 0; i < 5; i++) show(g, e, ox, oy, a + (i / 4 - 0.5) * 0.46, 9, V.delay);
  later(e, V.delay, 'lances', { ox, oy, a, dmg: V.dmg });
}
function lances(g, e, V) { for (let i = 0; i < 5; i++) shot(g, e, V.ox, V.oy, V.a + (i / 4 - 0.5) * 0.46, { ...LANCE, speed: 6, range: 13, dmg: V.dmg }); g.sfx('zap'); }
function sigils(g, e, V) {                                 // three sigils 0.4 s apart: where you've been, and where you're going
  for (let k = 0; k < 3; k++) later(e, k * 0.4, 'sigil', { k, dmg: D(145) });
}
function sigil(g, e, V) {
  const S = e.bx, q = target(g, e), H = S.jzTrail || [], placed = S.jzSigils = (V.k === 0 ? [] : S.jzSigils || []);
  let p = V.k >= 1 && running(e) ? (([x, y]) => ({ x, y }))(ahead(g, e, 0.9 + V.k * 0.3)) : (H[Math.max(0, H.length - 1 - V.k * 3)] || q), x = p.x, y = p.y;
  for (let k = 0; k < 6 && placed.some((s) => Math.hypot(s[0] - x, s[1] - y) < 3); k++) { const a = Math.random() * TAU; x = p.x + Math.cos(a) * 3; y = p.y + Math.sin(a) * 3; }
  placed.push([x, y]);
  mark(g, e, x, y, 1.8, 1.1, V.dmg, SPIRIT, 4, 'wiz_shots/shard');
}

// ================================================================ II
function convergence(g, e, V) {                            // 1.0 s marked; four portals; seven seconds of turning crosses, in turn
  const P = corners(e); for (const p of P) spot(g, e, p.x, p.y, 1.0);
  later(e, 1.0, 'openConvergence', { P });
}
function openConvergence(g, e, V) {
  const S = e.bx;
  S.jzConv = V.P.map((p, i) => ({ p: portal(g, e, p.x, p.y, 7, 6000), a: (i * TAU) / 8, w: i % 2 ? 0.35 : -0.35, t: 0.3 + i * 0.275 }));
  g.sfx('portal');
}
function crossfire(g, e, V) {                              // two portals either side of you; crossing fans; his volley; a last offset one
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), nx = -Math.sin(a), ny = Math.cos(a);
  const at2 = [-1, 1].map((s) => clampC(e, q.x + nx * s * 6, q.y + ny * s * 6, 1.5));
  for (const [x, y] of at2) spot(g, e, x, y, 0.8);
  later(e, 0.8, 'openCross', { at2, dmg: D(95) });
  later(e, 1.45, 'gapVolley', { off: 0, dmg: D(95) });
  later(e, 2.1, 'gapVolley', { off: 0.22, dmg: D(95) });
}
function openCross(g, e, V) {
  const q = target(g, e), P = V.at2.map(([x, y]) => portal(g, e, x, y, 2.4, 3000));
  for (const p of P) { const a = angleTo(p.x, p.y, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, p.x, p.y, a + (i / 4 - 0.5) * 0.9, { ...BOLT, speed: 5.2, range: 12, dmg: V.dmg }); }
  g.sfx('portal');
}
function gapVolley(g, e, V) { const [ox, oy] = STAFF(g, e), a = aimAt(g, e, ox, oy, 0.7) + V.off; for (const o of [-0.18, 0, 0.18]) shot(g, e, ox, oy, a + o, { ...LANCE, speed: 6.5, range: 13, dmg: V.dmg }); }
function prison(g, e, V) {                                 // eight runes form round you (1.0 s), close in over 2.2 s; three dark; the rest fire inward
  const q = target(g, e), dark = Math.floor(Math.random() * 8), S = e.bx;
  S.jzPrison = { x: q.x, y: q.y, t0: g.t + 1.0, form: g.t, dur: 2.2, r0: 5.4, r1: 2.2, a0: Math.random() * TAU, dark: [dark, (dark + 1) % 8, (dark + 2) % 8] };
  for (let k = 0; k < 3; k++) later(e, 2.4 + k * 0.3, 'prisonFire', { dmg: D(95) });
}
function prisonFire(g, e, V) {
  const P = e.bx.jzPrison; if (!P) return;
  const k = Math.max(0, Math.min(1, (g.t - P.t0) / P.dur)), r = P.r0 + (P.r1 - P.r0) * k;
  for (let i = 0; i < 8; i++) {
    if (P.dark.includes(i)) continue;
    const a = P.a0 + (i / 8) * TAU; shot(g, e, P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, a + Math.PI, { ...BOLT, speed: 4.4, range: r * 2, dmg: V.dmg });
  }
}
function reflections(g, e, V) {                            // 0.65 s; to another corner (never onto you), two reflections; two volleys; then gone
  const C = court(e), q = target(g, e);
  const spots = [[0.22, 0.25], [0.78, 0.25], [0.22, 0.75], [0.78, 0.75], [0.5, 0.2], [0.5, 0.8]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }))
    .filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5).sort(() => Math.random() - 0.5);
  if (spots.length < 3) return;
  for (const s of spots.slice(0, 3)) spot(g, e, s.x, s.y, 0.65);
  later(e, 0.65, 'reflect', { spots: spots.slice(0, 3) });
}
function reflect(g, e, V) {
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT });
  e.x = V.spots[0].x; e.y = V.spots[0].y;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT }); g.sfx('portal');
  e.bx.jzEchoes = { at: [V.spots[1], V.spots[2]], until: g.t + 3.5 };
  later(e, 0.7, 'echoFans', { lead: true, dmg: D(75) }); later(e, 1.55, 'echoFans', { lead: true, dmg: D(75) });
}
function echoFans(g, e, V) {
  const q = target(g, e), from = [{ x: e.x, y: e.y }, ...((e.bx.jzEchoes && e.bx.jzEchoes.at) || [])];
  for (const s of from) { const a = V.lead ? aimAt(g, e, s.x, s.y, Math.hypot(q.x - s.x, q.y - s.y) / 5.5) : angleTo(s.x, s.y, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, s.x, s.y, a + (i / 4 - 0.5) * 0.8, { ...BOLT, speed: 5.5, range: 12, dmg: V.dmg }); }
}

// ================================================================ III
function pursuit(g, e, V) {                                // 0.7 s; seven seconds blinking every 2.25 s (each place marked 0.5 s), portals where he was
  for (let k = 0; k < 3; k++) later(e, 0.7 + k * 2.25, 'blinkMark', { dmg: D(85) });
}
function blinkMark(g, e, V) {
  const C = court(e), q = target(g, e);
  const spots = [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78], [0.5, 0.18], [0.5, 0.82], [0.15, 0.5], [0.85, 0.5]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }))
    .filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5 && Math.hypot(s.x - e.x, s.y - e.y) > 3);
  if (!spots.length) return;
  const s = spots[Math.floor(Math.random() * spots.length)];
  spot(g, e, s.x, s.y, 0.5); later(e, 0.5, 'blink', { s, dmg: V.dmg });
}
function blink(g, e, V) {
  portal(g, e, e.x, e.y, 4.5, 2500).jzFire = { every: 0.9, t: 0.3, n: 0, dmg: V.dmg };
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT });
  e.x = V.s.x; e.y = V.s.y;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT }); g.sfx('portal');
}
function curse(g, e, V) {                                  // 0.7 s; out 1.4 s; a stop and a flash 0.45 s; back along the same paths
  g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 18, colors: ['#ffffff', '#e6c8ff'] });
  later(e, 0.7, 'curseOut', { off: Math.random() * TAU, L: 7, dmg: D(90) });
}
function curseOut(g, e, V) {
  const ox = e.x, oy = e.y;
  for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; shot(g, e, ox, oy, a, { ...DAGGER, speed: 5, range: V.L, dmg: V.dmg }); }
  later(e, 1.4, 'curseFlash', { ...V, ox, oy });
  later(e, 1.85, 'curseBack', { ...V, ox, oy });
}
function curseFlash(g, e, V) { for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; g.vx({ k: 'burst', x: V.ox + Math.cos(a) * V.L, y: V.oy + Math.sin(a) * V.L, n: 5, colors: ['#ffffff', '#e6c8ff'] }); } }
function curseBack(g, e, V) { for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; shot(g, e, V.ox + Math.cos(a) * V.L, V.oy + Math.sin(a) * V.L, a + Math.PI, { ...DAGGER, speed: 5, range: V.L, dmg: V.dmg }); } }
const LATTICE = [[[0, 2], [1, 3]], [[0, 1], [2, 3]], [[0, 3], [1, 2]]];   // the pairs of anchors joined: across; round one way; round the other
function lattice(g, e, V) {                                // 0.9 s; three patterns 1.6 s each, each change shown 0.65 s first
  const C = court(e), A = [{ x: C.x + C.w / 2, y: C.y + 1.6 }, { x: C.x + C.w - 1.6, y: C.y + C.h / 2 }, { x: C.x + C.w / 2, y: C.y + C.h - 1.6 }, { x: C.x + 1.6, y: C.y + C.h / 2 }];
  e.bx.jzAnchors = { at: A, until: g.t + 5.8 };
  LATTICE.forEach((pairs, k) => {
    const live = 0.9 + k * 1.6;                            // (each pattern shown 0.9 / 0.65 s before it runs)
    later(e, live - (k ? 0.65 : 0.9), 'latticeShow', { pairs, A, delay: k ? 0.65 : 0.9 });
    for (let j = 0; j < 5; j++) later(e, live + j * 0.3, 'latticeRun', { pairs, A, dmg: D(100) });
  });
}
function latticeShow(g, e, V) { for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; show(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), Math.hypot(b.x - a.x, b.y - a.y), V.delay); } }
function latticeRun(g, e, V) { for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; shot(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), { ...BOLT, speed: 5, range: Math.hypot(b.x - a.x, b.y - a.y), dmg: V.dmg }); } }
function testament(g, e, V) {                              // 0.9 s; 2 s of turning rune walls; 2.5 s of portal crossfire; 2.5 s of a closing ring
  g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 24, colors: SPIRIT }); if (g.banner) g.banner('The Hollow Testament!', 1400);
  for (let k = 0; k < 4; k++) later(e, 0.9 + k * 0.5, 'runeWall', { k, dmg: D(85) });
  later(e, 2.9, 'crossfire', {});
  later(e, 5.4, 'closingRing', { dmg: D(100) });
}
function runeWall(g, e, V) {                               // three groups of runes, three openings, each wall turned on from the last
  const off = (V.k * TAU) / 9;
  for (let grp = 0; grp < 3; grp++) for (let i = 0; i < 4; i++) { const a = off + (grp / 3) * TAU + (i - 1.5) * 0.22; shot(g, e, e.x, e.y, a, { ...BOLT, speed: 4.2, range: 12, dmg: V.dmg, mv: { curve: 0.35 } }); }
}
function closingRing(g, e, V) {                            // a ring of runes closing in on you; its opening marked
  const q = target(g, e), R = 7.5, n = 22, gap = Math.random() * TAU;
  show(g, e, q.x + Math.cos(gap) * R, q.y + Math.sin(gap) * R, gap + Math.PI, R, 0.85);
  later(e, 0.85, 'ringIn', { x: q.x, y: q.y, R, n, gap, dmg: V.dmg });
}
function ringIn(g, e, V) {
  for (let i = 0; i < V.n; i++) {
    const a = V.gap + ((i + 0.5) / V.n) * TAU;
    if (i === 0 || i === V.n - 1 || i === 1 || i === V.n - 2) continue;   // (the four nearest the marked line: the way out)
    shot(g, e, V.x + Math.cos(a) * V.R, V.y + Math.sin(a) * V.R, a + Math.PI, { ...BOLT, speed: 3.4, range: V.R - 0.6, dmg: V.dmg });
  }
}

const P = {
  dial: { name: 'Runic Dial', special: 'dial', windup: 0.2, dur: 6.9, cd: 9 },
  lances: { name: 'Spectral Constellation', special: 'constellation', windup: 0.2, dur: 1.6, cd: 3 },
  sigils: { name: 'Sigils of Ruin', special: 'sigils', windup: 0.2, dur: 1.9, cd: 6.5 },
  conv: { name: 'Hollow Convergence', special: 'convergence', windup: 0.2, dur: 8.0, cd: 16, w: 2 },
  cross: { name: 'Arcane Crossfire', special: 'crossfire', windup: 0.2, dur: 2.3, cd: 8 },
  prison: { name: 'Runic Prison', special: 'prison', windup: 0.2, dur: 3.4, cd: 12, w: 1.5 },
  refl: { name: 'Phantom Reflections', special: 'reflections', windup: 0.2, dur: 4.2, cd: 11 },
  pursuit: { name: 'Spectral Pursuit', special: 'pursuit', windup: 0.2, dur: 7.7, cd: 15, block: true, w: 2 },
  curse: { name: 'The Returning Curse', special: 'curse', windup: 0.2, dur: 4.0, cd: 7.5 },
  lattice: { name: 'Arcane Lattice', special: 'lattice', windup: 0.2, dur: 5.7, cd: 12 },
  testament: { name: 'The Hollow Testament', special: 'testament', windup: 0.2, dur: 7.9, cd: 18, block: true, after: 1.3, w: 2 },
};

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 240000, def: 22, xp: 9500,   // (asked 270,000: a Throne-geared Priest took 3:15; the danger is his patterns, not his Life)
  r: 1.5, speed: 2.4, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.70, 0.35],
  choose: scheduler([[2.2, 3.0], [1.8, 2.5], [1.6, 2.3]]),
  phases: {
    1: { move: 'drift', pressure: [{ every: 1.5, special: 'spark' }], patterns: [P.dial, P.lances, P.sigils] },
    2: { move: 'drift', pressure: [{ every: 1.4, special: 'spark' }], patterns: [P.conv, P.cross, P.prison, P.refl, P.lances, P.sigils] },
    3: { move: 'drift', pressure: [{ every: 1.25, special: 'spark' }], patterns: [P.pursuit, P.curse, P.lattice, P.testament, P.sigils, P.lances] },
  },
  specials: { spark, dial, dialFire, constellation, lanceShow, lances, sigils, sigil, convergence, openConvergence, crossfire, openCross, gapVolley, prison, prisonFire,
    reflections, reflect, echoFans, pursuit, blinkMark, blink, curse, curseOut, curseFlash, curseBack, lattice, latticeShow, latticeRun, testament, runeWall, closingRing, ringIn },
  moves: {
    drift(g, e, dt) {                                       // he slides to a new place every couple of seconds, keeping his distance
      const S = e.bx, q = target(g, e);
      if (!S.jzTo || g.t > S.jzToT) {
        const a = angleTo(q.x, q.y, e.x, e.y) + (Math.random() - 0.5) * 2.2, r = 6 + Math.random() * 2;
        S.jzTo = clampC(e, q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 2.2); S.jzToT = g.t + 1.8 + Math.random();
      }
      const [tx, ty] = S.jzTo, d = Math.hypot(tx - e.x, ty - e.y), sp = (e.D.speed || 2.4) * dt;
      if (d > 0.2) g.moveCircle(e, ((tx - e.x) / d) * Math.min(d, sp), ((ty - e.y) / d) * Math.min(d, sp), 0.8);
    },
  },
  onWake(g) { if (g.banner) g.banner('The Hollow Jarl raises his staff.', 2600); },
  onPhase(g, e, ph) {
    const S = e.bx; S.jzDial = S.jzEchoes = S.jzAnchors = S.jzPrison = S.jzConv = null;
    for (const q of S.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    if (ph === 2) { if (g.banner) g.banner('The Unwoven Court: his magic burns brighter.', 2400); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 30, colors: SPIRIT }); g.sfx('portal'); }
    if (ph === 3) { if (g.banner) g.banner('The Unmaking: his staff shatters!', 2600); g.vx({ k: 'shake', amt: 6 }); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: [...SPIRIT, '#ffffff'] }); g.sfx('shatter'); }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    S.jzTrailT = (S.jzTrailT || 0) - 1;                    // where you have been, for his sigils
    if (S.jzTrailT <= 0) { S.jzTrailT = 6; const q = target(g, e); (S.jzTrail = S.jzTrail || []).push({ x: q.x, y: q.y }); if (S.jzTrail.length > 12) S.jzTrail.shift(); }
    if (S.jzDial && g.t > S.jzDial.t0 + S.jzDial.dur) S.jzDial = null;
    if (S.jzEchoes && g.t > S.jzEchoes.until) S.jzEchoes = null;
    if (S.jzAnchors && g.t > S.jzAnchors.until) S.jzAnchors = null;
    if (S.jzPrison && g.t > S.jzPrison.t0 + S.jzPrison.dur + 0.4) S.jzPrison = null;
    const live = S.state !== 'morph';
    for (const q of S.jzPortals || []) {                   // portals close by themselves; the pursuit's portals fire short bursts
      if (q.dead) continue;
      if (g.t > q.jzUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; continue; }
      if (q.jzFire && live && (q.jzFire.t -= dt) <= 0) {
        q.jzFire.t = q.jzFire.every; const a = aimAt(g, e, q.x, q.y, 0.5);
        for (let i = 0; i < 3; i++) shot(g, e, q.x, q.y, a + (i - 1) * 0.3, { ...BOLT, speed: 5.4, range: 12, dmg: q.jzFire.dmg });
      }
    }
    S.jzPortals = (S.jzPortals || []).filter((q) => !q.dead);
    if (S.jzConv && live) {                                 // the convergence: each living portal, in turn, every 1.1 s, a turning cross of bolts
      let any = false;
      for (const c of S.jzConv) {
        if (c.p.dead) continue; any = true;
        if ((c.t -= dt) > 0) continue;
        c.t = 1.1; c.a += c.w;
        for (let k = 0; k < 4; k++) shot(g, e, c.p.x, c.p.y, c.a + (k * TAU) / 4, { ...BOLT, speed: 4.4, range: 13, dmg: D(85) });
      }
      if (!any) S.jzConv = null;
    }
  },
  onDeath(g, e) { const S = e.bx; S.jzDial = S.jzEchoes = S.jzAnchors = S.jzPrison = S.jzConv = null; for (const q of S.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
  // drawn on the floor: his dial's runes turning, the lattice's anchors, the prison's runes forming and closing in (the dark ones dim)
  drawGround(r, g, e) {
    const S = e.bx, D0 = (r.objDefs || (r.objDefs = new Map()));
    let rune = D0.get('wiz_shots/rune'); if (rune === undefined) D0.set('wiz_shots/rune', (rune = (r.R && r.R.resolve('wiz_shots/rune')) || null));
    if (!rune) return;
    const fr = Object.keys(rune.frames)[0], Q = S.jzDial;
    if (Q) for (let i = 0; i < 8; i++) { const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / 8) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, alpha: g.t - Q.t0 < 0.9 ? 0.4 : 1 }); }
    if (S.jzAnchors) for (const A of S.jzAnchors.at) { const [x, y] = r.proj(A.x, A.y); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, scale: 1.6 }); }
    const P = S.jzPrison;
    if (P) {
      const k = Math.max(0, Math.min(1, (g.t - P.t0) / P.dur)), rr = P.r0 + (P.r1 - P.r0) * k, forming = g.t < P.t0;
      for (let i = 0; i < 8; i++) { const a = P.a0 + (i / 8) * TAU, [x, y] = r.proj(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, scale: 1.3, alpha: P.dark.includes(i) && !forming ? 0.2 : forming ? 0.5 : 1 }); }
    }
  },
  // his reflections: himself again, fainter (the real one is the bright one)
  draw(r, g, e) {
    const E = e.bx.jzEchoes; if (!E || !r.R) return;
    const def = r.R.resolve('bx_jarl_wizard/jarl_wizard'); if (!def) return;
    for (const s of E.at) { const [x, y] = r.proj(s.x, s.y); r.drawDef(def, 'i2_' + (Math.floor(g.t * 6) % 4), Math.round(x), Math.round(y), { alpha: 0.45 }); }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 4.5, r: 70, col: '#c88aff' }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
