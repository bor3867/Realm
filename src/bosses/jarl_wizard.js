// The Hollow Jarl, Wizard (2026-11-01, the user's design and sprite): a corrupted royal sorcerer holding the Throne's
// second champion court and its seal. A dangerous puzzle to dodge through: lances, runes, delayed blasts, shot that comes
// back. Every volley locks its aim before it flies; every blast is marked before it bursts.
//   I   The Runecaller (100-70%) - slow, keeping his distance:
//       Runic Dial        eight runes turn about him for six seconds; every other rune fires, the two sets in turn
//       Spectral Constellation  three volleys of five lances, each aimed where you are, shown, then locked and loosed
//       Sigils of Ruin    three great sigils where you have just been (never all on one spot): 1.2 s, then they burst
//   II  The Unwoven Court (70-35%) - brighter, and slippery:
//       Phantom Reflections  he steps to another corner of his court (never onto you); two reflections stand at two
//                         others (fainter: the real one is the bright one); all three loose fans of five, twice, then the reflections go
//       Arcane Lattice    four anchors at the court's sides; lines shown between two pairs of them, then rune bolts run
//                         along them; the pairs change twice, each change shown first
//   III The Unmaking (35-0%) - the staff in pieces, the crown afloat:
//       The Returning Curse  twelve daggers flung out; they stop, flash, and come back the way they went
//       The Hollow Testament  three formations, one after the other, never together: runes in three groups with
//                         three wide openings; lances across the court in two waves (shown first); a ring of runes
//                         closing in on you, its one opening marked. Then he stops while his staff mends.
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_jarl_wizard.py ('bx_jarl_wizard', 'wiz_shots/<name>').
import { TAU, angleTo, target, players, mark } from './kit.js';

const D = (n) => n + 4;
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', name, ...V } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const BOLT = { sprite: 'wiz_shots/bolt', size: 0.35 }, LANCE = { sprite: 'wiz_shots/lance', size: 0.4 }, DAGGER = { sprite: 'wiz_shots/dagger', size: 0.35 }, SHARD = { sprite: 'wiz_shots/shard', size: 0.3 };
const SPIRIT = ['#b884cc', '#e6c8ff', '#8e4ca8'];
const show = (g, e, x, y, a, len, delay) => g.fx.push({ kind: 'lane', x, y, a, len, w: 0.6, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: ['#b884cc', '#b884cc', '#b884cc', '#ffffff'] });
const court = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 10, w: 29, h: 23 };
// where his staff's flame and his hand of runes are (dx tiles to the right on the screen, h up it)
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const HAND = (g, e) => at(g, e, 2.2, 4.4), STAFF = (g, e) => at(g, e, -2.5, 5.6);

// ================================================================ I
function dial(g, e, V) {                                   // eight runes turn about him; every other one fires, the sets in turn
  const S = e.bx; S.jzDial = { t0: g.t, dur: 6, r: 2.6, w: 0.55, a0: Math.random() * TAU };
  for (let k = 0; k < 12; k++) later(e, 0.5 + k * 0.5, 'dialFire', { set: k % 2, dmg: D(65) });
}
function dialFire(g, e, V) {
  const Q = e.bx.jzDial; if (!Q) return;
  for (let i = V.set; i < 8; i += 2) {
    const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / 8) * TAU, x = e.x + Math.cos(a) * Q.r, y = e.y + Math.sin(a) * Q.r;
    shot(g, e, x, y, a, { ...BOLT, speed: 4.5, range: 10, dmg: V.dmg });
  }
}
function constellation(g, e, V) {                          // three volleys of lances: each shown (0.7 s, then 0.4), locked, loosed
  for (let k = 0; k < 3; k++) later(e, k * 0.55, 'lanceShow', { delay: k ? 0.4 : 0.7, dmg: D(105) });
}
function lanceShow(g, e, V) {
  const q = target(g, e), [ox, oy] = STAFF(g, e), a = angleTo(ox, oy, q.x, q.y);
  for (let i = 0; i < 5; i++) show(g, e, ox, oy, a + (i / 4 - 0.5) * 0.5, 9, V.delay);
  later(e, V.delay, 'lances', { ox, oy, a, dmg: V.dmg });
}
function lances(g, e, V) { for (let i = 0; i < 5; i++) shot(g, e, V.ox, V.oy, V.a + (i / 4 - 0.5) * 0.5, { ...LANCE, speed: 6, range: 12, dmg: V.dmg }); g.sfx('zap'); }
function sigils(g, e, V) {                                 // three sigils where you have just been: never two on one spot
  const S = e.bx, q = target(g, e), H = S.jzTrail || [], spots = [];
  for (const back of [0, 4, 8]) {
    let p = H[Math.max(0, H.length - 1 - back)] || q, x = p.x, y = p.y;
    for (let k = 0; k < 6 && spots.some((s) => Math.hypot(s[0] - x, s[1] - y) < 3); k++) { const a = Math.random() * TAU; x = p.x + Math.cos(a) * 3; y = p.y + Math.sin(a) * 3; }
    spots.push([x, y]);
  }
  for (const [x, y] of spots) mark(g, e, x, y, 1.8, 1.2, D(145), SPIRIT, 4, 'wiz_shots/shard');
}

// ================================================================ II
function reflections(g, e, V) {                            // to another corner (never onto you); two reflections at two others
  const C = court(e), q = target(g, e);
  const spots = [[0.22, 0.25], [0.78, 0.25], [0.22, 0.75], [0.78, 0.75], [0.5, 0.2]].map(([u, v]) => ({ x: C.x + C.w * u, y: C.y + C.h * v }))
    .filter((s) => Math.hypot(s.x - q.x, s.y - q.y) > 5).sort(() => Math.random() - 0.5);
  if (spots.length < 3) return;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT });
  e.x = spots[0].x; e.y = spots[0].y;
  g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: SPIRIT }); g.sfx('portal');
  e.bx.jzEchoes = { at: [spots[1], spots[2]], until: g.t + 2.2 };
  for (let k = 0; k < 2; k++) later(e, 0.7 + k * 0.9, 'echoFans', { dmg: D(75) });
}
function echoFans(g, e, V) {
  const q = target(g, e), from = [{ x: e.x, y: e.y }, ...((e.bx.jzEchoes && e.bx.jzEchoes.at) || [])];
  for (const s of from) { const a = angleTo(s.x, s.y, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, s.x, s.y, a + (i / 4 - 0.5) * 0.9, { ...BOLT, speed: 5, range: 11, dmg: V.dmg }); }
}
const LATTICE = [[[0, 2], [1, 3]], [[0, 1], [2, 3]], [[0, 3], [1, 2]]];   // the pairs of anchors joined: across; round one way; round the other
function lattice(g, e, V) {                                // four anchors; lines shown; bolts run along them; the pairs change twice
  const C = court(e), A = [{ x: C.x + C.w / 2, y: C.y + 1.6 }, { x: C.x + C.w - 1.6, y: C.y + C.h / 2 }, { x: C.x + C.w / 2, y: C.y + C.h - 1.6 }, { x: C.x + 1.6, y: C.y + C.h / 2 }];
  e.bx.jzAnchors = { at: A, until: g.t + 7.5 };
  LATTICE.forEach((pairs, k) => {
    const t0 = k * 2.4;
    later(e, t0, 'latticeShow', { pairs, A, delay: k ? 0.8 : 1.0 });
    for (let j = 0; j < 4; j++) later(e, t0 + (k ? 0.8 : 1.0) + j * 0.35, 'latticeRun', { pairs, A, dmg: D(90) });
  });
}
function latticeShow(g, e, V) { for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; show(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), Math.hypot(b.x - a.x, b.y - a.y), V.delay); } }
function latticeRun(g, e, V) {
  for (const [i, j] of V.pairs) { const a = V.A[i], b = V.A[j]; shot(g, e, a.x, a.y, angleTo(a.x, a.y, b.x, b.y), { ...BOLT, speed: 5, range: Math.hypot(b.x - a.x, b.y - a.y), dmg: V.dmg }); }
}

// ================================================================ III
function curse(g, e, V) {                                  // twelve daggers out; they stop, flash; back the way they went
  const off = Math.random() * TAU, L = 7.5;
  for (let i = 0; i < 12; i++) { const a = off + (i / 12) * TAU; shot(g, e, e.x, e.y, a, { ...DAGGER, speed: 5, range: L, dmg: D(90) }); }
  later(e, 1.5, 'curseFlash', { off, L });
  later(e, 1.95, 'curseBack', { off, L, ox: e.x, oy: e.y, dmg: D(90) });
}
function curseFlash(g, e, V) { for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; g.vx({ k: 'burst', x: e.x + Math.cos(a) * V.L, y: e.y + Math.sin(a) * V.L, n: 5, colors: ['#ffffff', '#e6c8ff'] }); } }
function curseBack(g, e, V) {
  for (let i = 0; i < 12; i++) { const a = V.off + (i / 12) * TAU; shot(g, e, V.ox + Math.cos(a) * V.L, V.oy + Math.sin(a) * V.L, a + Math.PI, { ...DAGGER, speed: 5, range: V.L, dmg: V.dmg }); }
}
function testament(g, e, V) {                              // three formations in turn (never two at once), then he stops
  later(e, 0, 'runeGroups', { dmg: D(70) });
  later(e, 2.0, 'lanceWaves', { dmg: D(110) });
  later(e, 4.6, 'closingRing', { dmg: D(95) });
}
function runeGroups(g, e, V) {                             // runes in three groups, three wide openings between them
  const off = Math.random() * TAU;
  for (let grp = 0; grp < 3; grp++) for (let i = 0; i < (grp < 2 ? 3 : 2); i++) { const a = off + (grp / 3) * TAU + (i - 1) * 0.28; shot(g, e, e.x, e.y, a, { ...BOLT, speed: 4, range: 12, dmg: V.dmg }); }
}
function lanceWaves(g, e, V) {                             // lances across the court in two waves, from two sides, shown first
  const C = court(e), q = target(g, e);
  const gapA = Math.max(C.y + 3, Math.min(C.y + C.h - 3, q.y)), gapB = Math.max(C.x + 3, Math.min(C.x + C.w - 3, q.x + 3));
  for (let y = C.y + 1.5; y < C.y + C.h - 1; y += 2.2) if (Math.abs(y - gapA) > 1.6) { show(g, e, C.x + 0.6, y, 0, C.w - 1, 0.6); later(e, 0.6, 'waveLance', { x: C.x + 0.6, y, a: 0, L: C.w - 1, dmg: V.dmg }); }
  for (let x = C.x + 1.5; x < C.x + C.w - 1; x += 2.2) if (Math.abs(x - gapB) > 1.6) { show(g, e, x, C.y + 0.6, Math.PI / 2, C.h - 1, 1.4); later(e, 1.4, 'waveLance', { x, y: C.y + 0.6, a: Math.PI / 2, L: C.h - 1, dmg: V.dmg }); }
}
function waveLance(g, e, V) { shot(g, e, V.x, V.y, V.a, { ...LANCE, speed: 6, range: V.L, dmg: V.dmg }); }
function closingRing(g, e, V) {                            // a ring of runes closing in on you; its one opening marked
  const q = target(g, e), R = 7.5, n = 22, gap = Math.random() * TAU;
  show(g, e, q.x + Math.cos(gap) * R, q.y + Math.sin(gap) * R, gap + Math.PI, R, 0.9);
  later(e, 0.9, 'ringIn', { x: q.x, y: q.y, R, n, gap, dmg: V.dmg });
}
function ringIn(g, e, V) {
  for (let i = 0; i < V.n; i++) {
    const a = V.gap + ((i + 0.5) / V.n) * TAU;
    if (i === 0 || i === V.n - 1 || i === 1 || i === V.n - 2) continue;   // (the four nearest the marked line: the way out)
    shot(g, e, V.x + Math.cos(a) * V.R, V.y + Math.sin(a) * V.R, a + Math.PI, { ...BOLT, speed: 3, range: V.R - 0.6, dmg: V.dmg });
  }
}

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 250000,   // (asked 270,000: a Throne-geared Priest took 3:00, tools/sim_realm_fights.mjs; 250,000 ~ 2:45)
  def: 22, xp: 9500,
  r: 1.5, speed: 0.9, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.70, 0.35],
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'Runic Dial', windup: 0.5, recover: 6.4, special: 'dial' },
      { name: 'Spectral Constellation', windup: 0.4, recover: 1.3, special: 'constellation' },
      { name: 'Sigils of Ruin', windup: 0.4, recover: 1.3, special: 'sigils' },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'Phantom Reflections', windup: 0.4, recover: 2.2, special: 'reflections' },
      { name: 'Arcane Lattice', windup: 0.4, recover: 7.6, special: 'lattice' },
      { name: 'Spectral Constellation', windup: 0.3, recover: 1.1, special: 'constellation' },
      { name: 'Sigils of Ruin', windup: 0.3, recover: 1.1, special: 'sigils' },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'The Returning Curse', windup: 0.4, recover: 2.8, special: 'curse' },
      { name: 'The Hollow Testament', windup: 0.5, recover: 7.4, special: 'testament' },
      { name: 'Sigils of Ruin', windup: 0.3, recover: 1.0, special: 'sigils' },
      { name: 'Spectral Constellation', windup: 0.3, recover: 1.0, special: 'constellation' },
    ] },
  },
  specials: { dial, dialFire, constellation, lanceShow, lances, sigils, reflections, echoFans, lattice, latticeShow, latticeRun, curse, curseFlash, curseBack,
    testament, runeGroups, lanceWaves, waveLance, closingRing, ringIn },
  onWake(g) { if (g.banner) g.banner('The Hollow Jarl raises his staff.', 2600); },
  onPhase(g, e, ph) {
    e.bx.jzDial = null; e.bx.jzEchoes = null; e.bx.jzAnchors = null;
    if (ph === 2) { if (g.banner) g.banner('The Unwoven Court: his magic burns brighter.', 2400); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 30, colors: SPIRIT }); g.sfx('portal'); }
    if (ph === 3) { if (g.banner) g.banner('The Unmaking: his staff shatters!', 2600); g.vx({ k: 'shake', amt: 6 }); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: [...SPIRIT, '#ffffff'] }); g.sfx('shatter'); }
  },
  update(g, e) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    S.jzTrailT = (S.jzTrailT || 0) - 1;                    // where you have been, for his sigils (every ~0.1 s)
    if (S.jzTrailT <= 0) { S.jzTrailT = 6; const q = target(g, e); (S.jzTrail = S.jzTrail || []).push({ x: q.x, y: q.y }); if (S.jzTrail.length > 12) S.jzTrail.shift(); }
    if (S.jzDial && g.t > S.jzDial.t0 + S.jzDial.dur) S.jzDial = null;
    if (S.jzEchoes && g.t > S.jzEchoes.until) S.jzEchoes = null;
    if (S.jzAnchors && g.t > S.jzAnchors.until) S.jzAnchors = null;
  },
  onDeath(g, e) { const S = e.bx; S.jzDial = S.jzEchoes = S.jzAnchors = null; g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
  // drawn on the floor: his dial's runes turning, the lattice's anchors
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, D0 = (r.objDefs || (r.objDefs = new Map()));
    let rune = D0.get('wiz_shots/rune'); if (rune === undefined) D0.set('wiz_shots/rune', (rune = (r.R && r.R.resolve('wiz_shots/rune')) || null));
    const Q = S.jzDial;
    if (Q && rune) for (let i = 0; i < 8; i++) {
      const a = Q.a0 + Q.w * (g.t - Q.t0) + (i / 8) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * Q.r, e.y + Math.sin(a) * Q.r);
      r.drawDef(rune, Object.keys(rune.frames)[0], Math.round(x), Math.round(y), { center: true, alpha: i % 2 === (Math.floor((g.t - Q.t0) / 0.5) % 2) ? 1 : 0.55 });
    }
    if (S.jzAnchors && rune) for (const A of S.jzAnchors.at) { const [x, y] = r.proj(A.x, A.y); r.drawDef(rune, Object.keys(rune.frames)[0], Math.round(x), Math.round(y), { center: true, scale: 1.6 }); }
    void b;
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
