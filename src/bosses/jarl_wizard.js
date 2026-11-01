// The Hollow Jarl, Wizard (2026-11-01, the user's design, then its overhaul: "a true bullet-hell encounter built around
// magical formations, multiple projectile origins, portals, and precise dodging"). He holds the Throne's second
// champion court and its seal. He never stands still: he slides to a new place every couple of seconds, keeping his
// distance; a leading volley of bolts runs under everything; his portals give him more places to shoot from (the long
// ones can be broken). Every volley locks its aim before it flies; every blast is marked before it bursts.
//   I   The Runecaller (100-70%):
//       Runic Dial        eight runes turn about him, firing in sequence: streams that sweep round as they turn
//       Spectral Constellation  four volleys of five fast lances, each shown (briefly) and locked; at you, then ahead of you
//       Sigils of Ruin    four sigils: three where you've just been, one where you're going (145; shards 55)
//   II  The Unwoven Court (70-35%):
//       Hollow Convergence  four portals at the court's corners (they can be broken): each turns a stream of bolts,
//                         two one way and two the other, for fourteen seconds
//       Arcane Crossfire  two portals open either side of you and cross their fans; he fires a third volley into the gaps
//       Runic Prison      eight runes ring you and close in; three go dark (the way out); the rest fire inward
//       Phantom Reflections  he steps to another corner (never onto you); two faint reflections; all three fire together
//   III The Unmaking (35-0%):
//       Spectral Pursuit  he blinks from place to place four times, leaving a firing portal where he was each time
//       The Returning Curse  two waves of daggers: out, a stop and a flash, back along the same paths
//       Arcane Lattice    lines between four anchors, shown, then bolts run along them; the pattern changes twice
//       The Hollow Testament  turning walls of runes; a portal crossfire; daggers that come back; a ring closing on you
//                         (its opening marked); one after another, overlapping only where a way stays open; then he
//                         stops while his staff mends: your opening
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_jarl_wizard.py ('bx_jarl_wizard', 'wiz_shots/<name>', 'wiz_kin/portal').
import { TAU, angleTo, target, mark, ahead, running } from './kit.js';

const D = (n) => n + 4;
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', name, ...V } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const BOLT = { sprite: 'wiz_shots/bolt', size: 0.35 }, LANCE = { sprite: 'wiz_shots/lance', size: 0.4 }, DAGGER = { sprite: 'wiz_shots/dagger', size: 0.35 };
const SPIRIT = ['#b884cc', '#e6c8ff', '#8e4ca8'];
const show = (g, e, x, y, a, len, delay) => g.fx.push({ kind: 'lane', x, y, a, len, w: 0.6, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: ['#b884cc', '#b884cc', '#b884cc', '#ffffff'] });
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

// ================================================================ under it all: a leading volley
function spark(g, e, V) {
  const [ox, oy] = STAFF(g, e), d = Math.hypot(target(g, e).x - e.x, target(g, e).y - e.y), a = aimAt(g, e, ox, oy, d / 6.5);
  for (const o of [-0.16, 0, 0.16]) shot(g, e, ox, oy, a + o, { ...BOLT, speed: 6.5, range: 13, dmg: D(70) });
}

// ================================================================ I
function dial(g, e, V) {                                   // eight runes turn about him, firing one after another
  const S = e.bx; S.jzDial = { t0: g.t, dur: 5, r: 2.6, w: 0.7 * (Math.random() < 0.5 ? 1 : -1), a0: Math.random() * TAU };
  for (let k = 0; k < 32; k++) later(e, 0.4 + k * 0.145, 'dialFire', { i: k % 8, dmg: D(72) });
}
function dialFire(g, e, V) {
  const Q = e.bx.jzDial; if (!Q) return;
  const a = Q.a0 + Q.w * (g.t - Q.t0) + (V.i / 8) * TAU, x = e.x + Math.cos(a) * Q.r, y = e.y + Math.sin(a) * Q.r;
  shot(g, e, x, y, a, { ...BOLT, speed: 4.8, range: 11, dmg: V.dmg });
}
function constellation(g, e, V) {                          // four volleys of lances: each shown briefly, locked, loosed; at you, then ahead
  for (let k = 0; k < 4; k++) later(e, k * 0.5, 'lanceShow', { delay: k ? 0.32 : 0.55, lead: k % 2 === 1, dmg: D(105) });
}
function lanceShow(g, e, V) {
  const [ox, oy] = STAFF(g, e), q = target(g, e), a = V.lead ? aimAt(g, e, ox, oy, Math.hypot(q.x - ox, q.y - oy) / 8) : angleTo(ox, oy, q.x, q.y);
  for (let i = 0; i < 5; i++) show(g, e, ox, oy, a + (i / 4 - 0.5) * 0.46, 9, V.delay);
  later(e, V.delay, 'lances', { ox, oy, a, dmg: V.dmg });
}
function lances(g, e, V) { for (let i = 0; i < 5; i++) shot(g, e, V.ox, V.oy, V.a + (i / 4 - 0.5) * 0.46, { ...LANCE, speed: 8, range: 13, dmg: V.dmg }); g.sfx('zap'); }
function sigils(g, e, V) {                                 // three where you have just been, one where you're going: never two on one spot
  const S = e.bx, q = target(g, e), H = S.jzTrail || [], spots = [];
  const want = [0, 4, 8].map((b) => H[Math.max(0, H.length - 1 - b)] || q);
  if (running(e)) { const [x, y] = ahead(g, e, 1.2); want.push({ x, y }); }
  for (const p of want) {
    let x = p.x, y = p.y;
    for (let k = 0; k < 6 && spots.some((s) => Math.hypot(s[0] - x, s[1] - y) < 3); k++) { const a = Math.random() * TAU; x = p.x + Math.cos(a) * 3; y = p.y + Math.sin(a) * 3; }
    spots.push([x, y]);
  }
  for (const [x, y] of spots) mark(g, e, x, y, 1.8, 1.1, D(145), SPIRIT, 5, 'wiz_shots/shard');
}

// ================================================================ II
function convergence(g, e, V) {                            // four portals at the corners, each turning a stream of bolts
  const C = court(e), S = e.bx;
  S.jzConv = [[0.18, 0.2], [0.82, 0.2], [0.18, 0.8], [0.82, 0.8]].map(([u, v], i) => ({ p: portal(g, e, C.x + C.w * u, C.y + C.h * v, 14, 6000), a: (i * TAU) / 4, w: i % 2 ? 1.1 : -1.1 }));
  S.jzConvT = 0.5; g.sfx('portal');
}
function crossfire(g, e, V) {                              // two portals either side of you cross their fans; a third volley into the gaps
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), nx = -Math.sin(a), ny = Math.cos(a);
  const P = [-1, 1].map((s) => portal(g, e, q.x + nx * s * 6, q.y + ny * s * 6, 3.4, 3000));
  for (let k = 0; k < 2; k++) later(e, 0.6 + k * 0.7, 'crossFans', { P, dmg: D(95) });
  later(e, 1.0, 'gapVolley', { dmg: D(100) });
  g.sfx('portal');
}
function crossFans(g, e, V) {
  const q = target(g, e);
  for (const p of V.P) { if (p.dead) continue; const a = angleTo(p.x, p.y, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, p.x, p.y, a + (i / 4 - 0.5) * 0.9, { ...BOLT, speed: 5.2, range: 12, dmg: V.dmg }); }
}
function gapVolley(g, e, V) { const [ox, oy] = STAFF(g, e), a = aimAt(g, e, ox, oy, 0.7); for (const o of [-0.1, 0.1]) shot(g, e, ox, oy, a + o, { ...LANCE, speed: 7, range: 13, dmg: V.dmg }); }
function prison(g, e, V) {                                 // eight runes ring you and close in; three go dark; the rest fire inward
  const q = target(g, e), dark = Math.floor(Math.random() * 8), S = e.bx;
  S.jzPrison = { x: q.x, y: q.y, t0: g.t, dur: 1.6, r0: 5.2, r1: 2.4, a0: Math.random() * TAU, dark: [dark, (dark + 1) % 8, (dark + 2) % 8] };
  for (let k = 0; k < 4; k++) later(e, 0.8 + k * 0.32, 'prisonFire', { dmg: D(95) });
}
function prisonFire(g, e, V) {
  const P = e.bx.jzPrison; if (!P) return;
  const k = Math.min(1, (g.t - P.t0) / P.dur), r = P.r0 + (P.r1 - P.r0) * k;
  for (let i = 0; i < 8; i++) {
    if (P.dark.includes(i)) continue;
    const a = P.a0 + (i / 8) * TAU; shot(g, e, P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, a + Math.PI, { ...BOLT, speed: 4.4, range: r * 2, dmg: V.dmg });
  }
}
function reflections(g, e, V) {                            // to another corner (never onto you); two reflections; all three fire together
  const C = court(e), q = target(g, e);
  const spots = [[0.22, 0.25], [0.78, 0.25], [0.22, 0.75], [0.78, 0.75], [0.5, 0.2], [0.5, 0.8]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }))
    .filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5).sort(() => Math.random() - 0.5);
  if (spots.length < 3) return;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT });
  e.x = spots[0].x; e.y = spots[0].y;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT }); g.sfx('portal');
  e.bx.jzEchoes = { at: [spots[1], spots[2]], until: g.t + 2.4 };
  for (let k = 0; k < 3; k++) later(e, 0.6 + k * 0.6, 'echoFans', { lead: k === 1, dmg: D(75) });
}
function echoFans(g, e, V) {
  const q = target(g, e), from = [{ x: e.x, y: e.y }, ...((e.bx.jzEchoes && e.bx.jzEchoes.at) || [])];
  for (const s of from) { const a = V.lead ? aimAt(g, e, s.x, s.y, Math.hypot(q.x - s.x, q.y - s.y) / 5.5) : angleTo(s.x, s.y, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, s.x, s.y, a + (i / 4 - 0.5) * 0.8, { ...BOLT, speed: 5.5, range: 12, dmg: V.dmg }); }
}

// ================================================================ III
function pursuit(g, e, V) {                                // four blinks; a firing portal left where he was each time
  for (let k = 0; k < 4; k++) later(e, k * 1.2, 'blink', { dmg: D(85) });
}
function blink(g, e, V) {
  const C = court(e), q = target(g, e);
  const spots = [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78], [0.5, 0.18], [0.5, 0.82], [0.15, 0.5], [0.85, 0.5]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }))
    .filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5 && Math.hypot(s.x - e.x, s.y - e.y) > 3);
  if (!spots.length) return;
  portal(g, e, e.x, e.y, 6, 2500).jzFire = { every: 1.1, t: 0.5, dmg: V.dmg };
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT });
  const s = spots[Math.floor(Math.random() * spots.length)]; e.x = s.x; e.y = s.y;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 16, colors: SPIRIT }); g.sfx('portal');
}
function curse(g, e, V) {                                  // two waves of daggers: out, a stop and a flash, back the way they went
  for (let w = 0; w < 2; w++) {
    const off = Math.random() * TAU, L = 7.5, t0 = w * 0.9;
    later(e, t0, 'curseOut', { off, L, dmg: D(90) });
    later(e, t0 + 1.5, 'curseFlash', { off, L });
    later(e, t0 + 1.95, 'curseBack', { off, L, dmg: D(90) });
  }
}
function curseOut(g, e, V) { V.ox = e.x; V.oy = e.y; e.bx.jzCurseO = e.bx.jzCurseO || {}; e.bx.jzCurseO[V.off] = [e.x, e.y]; for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; shot(g, e, e.x, e.y, a, { ...DAGGER, speed: 5, range: V.L, dmg: V.dmg }); } }
function curseFlash(g, e, V) { const [ox, oy] = (e.bx.jzCurseO || {})[V.off] || [e.x, e.y]; for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; g.vx({ k: 'burst', x: ox + Math.cos(a) * V.L, y: oy + Math.sin(a) * V.L, n: 5, colors: ['#ffffff', '#e6c8ff'] }); } }
function curseBack(g, e, V) {
  const [ox, oy] = (e.bx.jzCurseO || {})[V.off] || [e.x, e.y];
  for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; shot(g, e, ox + Math.cos(a) * V.L, oy + Math.sin(a) * V.L, a + Math.PI, { ...DAGGER, speed: 5, range: V.L, dmg: V.dmg }); }
}
const LATTICE = [[[0, 2], [1, 3]], [[0, 1], [2, 3]], [[0, 3], [1, 2]]];   // the pairs of anchors joined: across; round one way; round the other
function lattice(g, e, V) {                                // four anchors; lines shown; bolts run along them; the pairs change twice
  const C = court(e), A = [{ x: C.x + C.w / 2, y: C.y + 1.6 }, { x: C.x + C.w - 1.6, y: C.y + C.h / 2 }, { x: C.x + C.w / 2, y: C.y + C.h - 1.6 }, { x: C.x + 1.6, y: C.y + C.h / 2 }];
  e.bx.jzAnchors = { at: A, until: g.t + 6.5 };
  LATTICE.forEach((pairs, k) => {
    const t0 = k * 2.0;
    later(e, t0, 'latticeShow', { pairs, A, delay: k ? 0.8 : 1.0 });
    for (let j = 0; j < 5; j++) later(e, t0 + (k ? 0.8 : 1.0) + j * 0.24, 'latticeRun', { pairs, A, dmg: D(90) });
  });
}
function latticeShow(g, e, V) { for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; show(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), Math.hypot(b.x - a.x, b.y - a.y), V.delay); } }
function latticeRun(g, e, V) { for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; shot(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), { ...BOLT, speed: 5.5, range: Math.hypot(b.x - a.x, b.y - a.y), dmg: V.dmg }); } }
function testament(g, e, V) {                              // turning rune walls; a portal crossfire; returning daggers; a closing ring
  for (let k = 0; k < 4; k++) later(e, k * 0.5, 'runeWall', { k, dmg: D(70) });
  later(e, 1.8, 'crossfire', {});
  later(e, 3.6, 'curseOut', { off: Math.random() * TAU, L: 6.5, dmg: D(90) });
  later(e, 5.4, 'closingRing', { dmg: D(95) });
}
function runeWall(g, e, V) {                               // a wall of runes turning: three groups, three openings, each wall turned on from the last
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

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 240000,   // (asked 270,000: a Throne-geared Priest took 3:15; the danger is his patterns, not his Life)
  def: 22, xp: 9500,
  r: 1.5, speed: 2.4, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.70, 0.35],
  phases: {
    1: { move: 'drift', pressure: [{ every: 1.7, special: 'spark' }], patterns: [
      { name: 'Runic Dial', windup: 0.4, recover: 1.0, special: 'dial' },
      { name: 'Spectral Constellation', windup: 0.3, recover: 0.9, special: 'constellation' },
      { name: 'Sigils of Ruin', windup: 0.3, recover: 0.8, special: 'sigils' },
      { name: 'Spectral Constellation', windup: 0.3, recover: 0.9, special: 'constellation' },
    ] },
    2: { move: 'drift', pressure: [{ every: 1.6, special: 'spark' }], patterns: [
      { name: 'Hollow Convergence', windup: 0.4, recover: 1.0, special: 'convergence' },
      { name: 'Runic Prison', windup: 0.3, recover: 1.6, special: 'prison' },
      { name: 'Arcane Crossfire', windup: 0.3, recover: 1.6, special: 'crossfire' },
      { name: 'Phantom Reflections', windup: 0.3, recover: 2.2, special: 'reflections' },
      { name: 'Sigils of Ruin', windup: 0.3, recover: 0.8, special: 'sigils' },
    ] },
    3: { move: 'drift', pressure: [{ every: 1.4, special: 'spark' }], patterns: [
      { name: 'Spectral Pursuit', windup: 0.3, recover: 3.6, special: 'pursuit' },
      { name: 'The Returning Curse', windup: 0.3, recover: 1.6, special: 'curse' },
      { name: 'Arcane Lattice', windup: 0.3, recover: 4.8, special: 'lattice' },
      { name: 'The Hollow Testament', windup: 0.4, recover: 7.6, special: 'testament' },
      { name: 'Sigils of Ruin', windup: 0.3, recover: 0.8, special: 'sigils' },
    ] },
  },
  specials: { spark, dial, dialFire, constellation, lanceShow, lances, sigils, convergence, crossfire, crossFans, gapVolley, prison, prisonFire, reflections, echoFans,
    pursuit, blink, curse, curseOut, curseFlash, curseBack, lattice, latticeShow, latticeRun, testament, runeWall, closingRing, ringIn },
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
    if (S.jzPrison && g.t > S.jzPrison.t0 + S.jzPrison.dur + 0.3) S.jzPrison = null;
    for (const q of S.jzPortals || []) {                   // portals close by themselves; the pursuit's fire as they hang there
      if (q.dead) continue;
      if (g.t > q.jzUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; continue; }
      if (q.jzFire && S.state !== 'morph' && (q.jzFire.t -= dt) <= 0) {
        q.jzFire.t = q.jzFire.every; const a = aimAt(g, e, q.x, q.y, 0.5);
        for (let i = 0; i < 3; i++) shot(g, e, q.x, q.y, a + (i - 1) * 0.3, { ...BOLT, speed: 5.4, range: 12, dmg: q.jzFire.dmg });
      }
    }
    S.jzPortals = (S.jzPortals || []).filter((q) => !q.dead);
    if (S.jzConv && S.state !== 'morph' && (S.jzConvT = (S.jzConvT || 0.5) - dt) <= 0) {   // the convergence: each living portal turns its stream
      S.jzConvT = 0.26; let any = false;
      for (const c of S.jzConv) { if (c.p.dead) continue; any = true; c.a += c.w * 0.26; shot(g, e, c.p.x, c.p.y, c.a, { ...BOLT, speed: 4.4, range: 13, dmg: D(82) }); }
      if (!any) S.jzConv = null;
    }
  },
  onDeath(g, e) { const S = e.bx; S.jzDial = S.jzEchoes = S.jzAnchors = S.jzPrison = S.jzConv = null; for (const q of S.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
  // drawn on the floor: his dial's runes turning, the lattice's anchors, the prison's runes closing in (the dark ones dim)
  drawGround(r, g, e) {
    const S = e.bx, D0 = (r.objDefs || (r.objDefs = new Map()));
    let rune = D0.get('wiz_shots/rune'); if (rune === undefined) D0.set('wiz_shots/rune', (rune = (r.R && r.R.resolve('wiz_shots/rune')) || null));
    if (!rune) return;
    const fr = Object.keys(rune.frames)[0], Q = S.jzDial;
    if (Q) for (let i = 0; i < 8; i++) { const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / 8) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true }); }
    if (S.jzAnchors) for (const A of S.jzAnchors.at) { const [x, y] = r.proj(A.x, A.y); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, scale: 1.6 }); }
    const P = S.jzPrison;
    if (P) { const k = Math.min(1, (g.t - P.t0) / P.dur), rr = P.r0 + (P.r1 - P.r0) * k; for (let i = 0; i < 8; i++) { const a = P.a0 + (i / 8) * TAU, [x, y] = r.proj(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr); r.drawDef(rune, fr, Math.round(x), Math.round(y), { center: true, scale: 1.3, alpha: P.dark.includes(i) ? 0.22 : 1 }); } }
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
