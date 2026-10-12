// The Grand Orrery: the machine at the heart of the Astral Observatory (docs/design/boss_grand_orrery.md).
// Its floor is a round marble platform over the void. Its own mechanics:
//   the eclipse   an umbra that crosses the floor now and then (a transit: its path is marked first, it slides along
//                 it and is gone), most often in the Eclipse phase: it darkens its part of the floor, burns whoever
//                 stands in it, throws corona flares from its rim, and in the Eclipse phase turns to run you down
//   ALIGNED (P1)  RotMG-style: it moves between stations and fires readable volleys: aimed meridian fans, precessing
//                 double rings, a four-arm armillary spiral, orbits that fly off on tangents, meteors on marked tiles;
//                 two planets wheel round it and throw bolts at you
//   ECLIPSE (P2)  the umbra grows and lunges at where you stand; its corona bursts; syzygy streams through the dark
//   COLLAPSE (P3) black holes open on the floor (pull, burn at the horizon); their accretion disks of shots wind in
//                 and are swallowed; shots bend toward them; matter falls in from the rim; debris rains
//   SINGULARITY   the finale: one black hole at the centre swallows everything, the floor's matter spiralling in on
//                 arms that wind tighter, then it collapses and goes SUPERNOVA: ring after ring, each with its gaps
import { Anim } from '../anim.js';
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/grand_orrery.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };
// the eclipse's transits, per phase: its size, how long a crossing takes, the wait between crossings
const UMBRA = { 1: { r: 3.2, T: 6.5, every: 15 }, 2: { r: 4.5, T: 7, every: 7 }, 3: { r: 4, T: 6, every: 11 } };

// meteors: rune circles open on and round you; a second later the meteors land on them and burst into shards
function meteors(g, e, V) {
  const p = g.player, S = e.bx, n = V.n || 7, [cx, cy] = centre(e);
  S.meteors = S.meteors || [];
  for (let k = 0; k < n; k++) {
    const a = R() * TAU, d = k ? 1.6 + R() * 3.6 : 0, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (Math.hypot(x - cx, y - cy) > 16) continue;
    S.meteors.push({ x, y, born: g.t, at: g.t + 1 + k * 0.08 });
  }
}
// ---------------------------------------------------------------- phase 3: Collapse
// small singularities open on the floor away from you (two or three at a time, three at most): they drift, pull you
// in from 3.5 tiles, burn at the core, and collapse after 6 s
function well(g, e, V = {}) {
  const [cx, cy] = centre(e), p = g.player, S = e.bx;
  S.wells = (S.wells || []).filter((W) => g.t <= W.until);
  for (let n = V.n || (R() < 0.5 ? 2 : 3), t = 0; n > 0 && S.wells.length < (V.max || 3) && t < 40; t++) {
    const a = R() * TAU, d = 3 + R() * 9, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, va = R() * TAU;
    if (Math.hypot(x - p.x, y - p.y) < 3.5 || S.wells.some((W) => Math.hypot(W.x - x, W.y - y) < 4.5)) continue;
    S.wells.push({ x, y, vx: Math.cos(va) * 0.5, vy: Math.sin(va) * 0.5, until: g.t + (V.life || 6), born: g.t, tick: 0, r: 1 }); n--;
  }
}
// debris: shadows grow under where the shards will land, then they land and skitter outward
function debris(g, e) {
  const p = g.player, S = e.bx;
  S.debris = S.debris || [];
  for (let k = 0; k < 6; k++) { const a = R() * TAU, d = k ? 1.2 + R() * 3.4 : 0; S.debris.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, at: g.t + 1, born: g.t }); }
  g.vx({ k: 'shake', amt: 4 });
}

// ================================================================ PHASES 1-3, CHOREOGRAPHED
// One attack at a time, each a formation with its own lanes: no background barrage under it. The planets and the
// eclipse are instruments the attacks play, not timers. Every attack's recover covers its whole duration, so the next
// begins as this one's last shots clear.
const shotAt = (g, e, x, y, a, shot, speed, dmg, o = {}) => g.bxShot(e, x, y, a, { shot, speed, range: o.range || 20, dmg, ...o });
const held = (g, e, x, y, a, shot, dmg) => { const b = g.bxShot(e, x, y, a, { shot, speed: 0.01, range: 99, dmg }); b.vx = 0; b.vy = 0; b.life = 99; return b; };
const launch = (b, a, sp, life = 4) => { b.orc = null; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; b.a = a; b.life = life; };
const later = (e, t, fn) => e.bx.vol.push({ t, V: { form: 'special', name: 'later', fn } });
const aimAt = (g, x, y) => angleTo(x, y, g.player.x, g.player.y - 0.4);
// the planets: where an attack wants them (P.goal), else wheeling round the machine
function planetsTick(g, e, dt) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e);
  for (const P of S.planets || []) {
    if (P.goal) { const [tx, ty] = P.goal(g, e, P); const k = Math.min(1, dt * (P.ease || 5)); P.x += (tx - P.x) * k; P.y += (ty - P.y) * k; continue; }
    P.a += P.w * (S.spin || 1) * dt; const r = P.rr || P.r;
    const tx = ox + Math.cos(P.a) * r, ty = oy + Math.sin(P.a) * r * 0.85, k = Math.min(1, dt * 6);
    P.x += (tx - P.x) * k; P.y += (ty - P.y) * k;
  }
}
function planetsHome(S) { for (const P of S.planets || []) { P.goal = null; P.rr = null; } S.spin = 1; }

// ---------------------------------------------------------------- PHASE 1: THE CELESTIAL DANCE (precise, symmetrical)
// Four long sequences, each one formation that evolves; the shape one leaves is where the next begins.
// [purpose of each piece in brackets]

// CLOCKWORK OVERTURE (10.5 s): the waltz (zigzag fans, the last two curving to cut off the way you went) [sets the
// rhythm: dodge side to side] -> its last fan's line becomes the first arm of a four-arm spiral that tightens (turns
// faster, fires faster) [forces circling] -> the arms split into two counter-turning pairs [the lanes now open and close:
// time your crossings] -> they stop turning and become four slow-drifting corridors, the planets lobbing triplets into
// them that start slow and then rush [you hold a corridor and step out of the triplets' line]
function overture(g, e, V) {
  const S = e.bx, dmg = V.dmg || 125;
  [[0, 0.2], [0.32, -0.2], [0.64, 0.2], [0.96, -0.1]].forEach(([t, off], k) => later(e, t, () => {
    const [ox, oy] = g.bxOrigin(e), aim = aimAt(g, ox, oy) + off, p = g.player;
    const side = k >= 2 ? Math.sign(Math.cos(aim) * (p.vel ? p.vel.y : 0) - Math.sin(aim) * (p.vel ? p.vel.x : 0)) || 1 : 0;
    for (let j = 0; j < 7; j++) shotAt(g, e, ox, oy, aim + (j - 3) * 0.12, 'moon_shard', 8.4, dmg, side ? { mv: { curve: 0.55 * side } } : {});
    if (k === 3) S.ov = { a: aim, pair: [1, 1, 1, 1] };
  }));
  let t = 1.4;
  while (t < 9.4) {
    const tt = t, step = tt < 4.4 ? 0.12 - (tt - 1.4) * 0.013 : 0.09;
    later(e, tt, () => {
      const O = S.ov, [ox, oy] = g.bxOrigin(e);
      if (!O) return;
      const u = tt - 1.4, w = u < 3 ? 0.7 + u * 0.45 : u < 3.5 ? 2.05 : u < 5.5 ? 1.7 : 0.15;   // tighten, hold, split, open
      O.a += w * step;
      if (u >= 3 && O.ref === undefined) O.ref = O.a;            // the moment of the split
      for (let j = 0; j < 4; j++) {
        const counter = u >= 3 && u < 5.5 && j % 2 ? -1 : 1, ang = (counter < 0 ? -O.a + 2 * O.ref : O.a) + (j / 4) * TAU;
        shotAt(g, e, ox, oy, ang, 'star_bolt', u < 5.5 ? 5.2 : 4.6, dmg);
      }
      if (u >= 5.5 && Math.round(u / step) % 7 === 0) for (const P of S.planets || []) { const aim = aimAt(g, P.x, P.y); for (let q = -1; q <= 1; q++) shotAt(g, e, P.x, P.y, aim + q * 0.2, 'moon_shard', 2.5, dmg, { mv: { accel: 7, max: 3 } }); }
    });
    t += step;
  }
}
// THE ALIGNMENT (10 s): the planets stop either side of it and stream a corridor down the line to you, swinging slowly,
// the machine lobbing shots down it led ahead of you [stay in the corridor, keep adjusting] -> the planets swing round
// it half a turn, still streaming: two walls sweep the floor, each with a pulse-gap every fifth shot [cross a wall
// through its gap as it reaches you] -> where the corridor ended, three precession rings begin with their openings on
// that line and step round [follow the openings round]
function alignmentSweep(g, e, V) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), A = { a: aimAt(g, ox, oy), swap: 0 }, dmg = V.dmg || 120;
  (S.planets || []).forEach((P, k) => { P.ease = 4; P.goal = (g2, e2) => { const [x, y] = g2.bxOrigin(e2), n = A.a + (k ? -1 : 1) * Math.PI / 2 + A.swap; return [x + Math.cos(n) * 4.2, y + Math.sin(n) * 4.2]; }; });
  g.spMark({ kind: 'line', x: ox, y: oy, a: A.a, len: 16, life: 0.6, color: '#ffd690' });
  for (let i = 0; i < 70; i++) later(e, 0.6 + i * 0.095, () => {
    const t = 0.6 + i * 0.095;
    if (t < 4.6) { A.a += 0.028; for (const P of S.planets) shotAt(g, e, P.x, P.y, A.a, 'moon_shard', 7, dmg); if (i % 3 === 0) { const [x, y] = g.bxOrigin(e), lead = aimAt(g, x, y) + (g.player.vel ? Math.sign(g.player.vel.x + g.player.vel.y) * 0.08 : 0); shotAt(g, e, x, y, lead, 'eclipse_ring', 3.6, dmg); } }
    else if (t < 7) { A.swap = Math.min(Math.PI, (t - 4.6) / 2.4 * Math.PI); if (i % 5) for (const [k, P] of S.planets.entries()) { const [x, y] = g.bxOrigin(e), out = angleTo(x, y, P.x, P.y); shotAt(g, e, P.x, P.y, out + (k ? 1 : -1) * Math.PI / 2, 'moon_shard', 5.6, dmg); } }
  });
  [0, 0.4, 0.8].forEach((t, k) => later(e, 7.2 + t, () => {
    const [x, y] = g.bxOrigin(e), n = 30, open = A.a + A.swap + k * 0.5, gaps = [open, open + Math.PI];
    for (let j = 0; j < n; j++) { const a = (j / n) * TAU; if (gaps.some((q) => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q))) < 0.27)) continue; shotAt(g, e, x, y, a, 'eclipse_ring', 4.8, 125); }
    if (k === 2) planetsHome(S);
  }));
}
// STARFALL PROCESSION (9 s): meteors land one by one along an arc through where you stand, their shards thrown along the
// arc so a wave walks round [circle ahead of the wave] -> a slow ring with two openings rolls through it [find an
// opening while circling] -> a second procession the other way, two tiles further out [cut back across] -> two closing
// fans [punish standing in the last landing spot]
function procession(g, e, V) {
  const S = e.bx, dmg = V.dmg || 125;
  const arc = (dir, extra) => {
    const [ox, oy] = g.bxOrigin(e), p = g.player, d = Math.max(4, Math.hypot(p.x - ox, p.y - oy) + extra), a0 = angleTo(ox, oy, p.x, p.y);
    S.meteors = S.meteors || [];
    for (let k = 0; k < 8; k++) { const a = a0 + dir * (k - 1) * 0.28, at = g.t + 0.9 + k * 0.22; S.meteors.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, born: g.t, at, along: a + dir * Math.PI / 2 }); }
  };
  const ring = () => { const [x, y] = g.bxOrigin(e), b0 = aimAt(g, x, y); for (let j = 0; j < 22; j++) if (j % 11 > 1) shotAt(g, e, x, y, b0 + ((j + 0.5) / 22) * TAU, 'eclipse_ring', 3.2, dmg); };
  const dir = R() < 0.5 ? 1 : -1;
  later(e, 0, () => arc(dir, 0)); later(e, 1.3, ring);
  later(e, 3.6, () => arc(-dir, 2)); later(e, 4.9, ring);
  [6.6, 6.95].forEach((t, k) => later(e, t, () => { const [x, y] = g.bxOrigin(e), aim = aimAt(g, x, y) + (k ? 0.18 : -0.18); for (let j = 0; j < 7; j++) shotAt(g, e, x, y, aim + (j - 3) * 0.12, 'moon_shard', 8, dmg); }));
}
// GRAND ROTATION (11 s): it anchors; the planets close in and spin, streaming a widening double helix [weave between
// the arms] -> the spin slows to a stop and reverses [the arms you were riding now come back across you] -> the planets
// fling out and stop, and the helix's last gap opens into two precession rings aligned with it [read the gap, take it]
function rotation(g, e, V) {
  const S = e.bx, dmg = V.dmg || 125;
  S.anchor = true; S.spin = 3.8;
  for (const P of S.planets) P.rr = 2.6;
  for (let i = 0; i < 82; i++) later(e, i * 0.08, () => {
    const t = i * 0.08;
    S.spin = t < 3.6 ? 3.8 : t < 4.6 ? 3.8 * (1 - (t - 3.6) * 2) : -3.8;      // slow, stop, back
    for (const [k, P] of S.planets.entries()) { P.rr = Math.min(6.4, 2.6 + t * 0.6); const [ox, oy] = g.bxOrigin(e), out = angleTo(ox, oy, P.x, P.y); shotAt(g, e, P.x, P.y, out + (i % 2 ? 0.2 : -0.2) * (k ? 1 : -1), 'moon_shard', 5, dmg); }
  });
  later(e, 6.7, () => { S.spin = 0; for (const P of S.planets) P.rr = 7.5; });
  [7.1, 7.5].forEach((t) => later(e, t, () => {
    const [x, y] = g.bxOrigin(e), P = S.planets[0], open = P ? angleTo(x, y, P.x, P.y) + Math.PI / 2 : 0, n = 30;
    for (let j = 0; j < n; j++) { const a = (j / n) * TAU; if ([open, open + Math.PI].some((q) => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q))) < 0.27)) continue; shotAt(g, e, x, y, a, 'eclipse_ring', 4.6, dmg); }
  }));
  later(e, 8.6, () => { S.anchor = false; planetsHome(S); });
}
// THE ALIGNMENT OF ALL (the change to the Eclipse; ~8 s, you can still hurt it once the rings lock): the planets line up
// with the machine and a gold beam runs out of it both ways and sweeps round; a gap travels out along the beam [cross
// the beam through the gap as it passes you, or outrun it round the rim] -> the beam goes out; three rings of brass lock
// round the machine, a beat, then fly out with their openings staggered [thread them] -> the eclipse begins to rise
function finaleAligned(g, e) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), a0 = aimAt(g, ox, oy) + Math.PI / 2, t0 = g.t;
  (S.planets || []).forEach((P, k) => { P.ease = 3; P.goal = (g2, e2) => { const [x, y] = g2.bxOrigin(e2), a = a0 + (g2.t - t0 > 1.2 ? (g2.t - t0 - 1.2) * 0.55 : 0); return [x + Math.cos(a) * (k ? -7 : 7), y + Math.sin(a) * (k ? -7 : 7)]; }; });
  for (const s of [0, Math.PI]) g.spMark({ kind: 'line', x: ox, y: oy, a: a0 + s, len: 16, life: 1.2, color: '#ffd690' });
  for (const s of [0, Math.PI]) for (let k = 0; k < 15; k++) {                   // the beam: segments out from the machine
    const r = 1.6 + k, b = held(g, e, ox, oy, 0, 'star_bolt', 150);
    b.orc = (b2) => {
      const t = g.t - t0, [x, y] = g.bxOrigin(e), a = a0 + s + Math.max(0, t - 1.2) * 0.55, gapR = 1.5 + Math.max(0, t - 1.2) * 3;
      b2.x = x + Math.cos(a) * r; b2.y = y + Math.sin(a) * r; b2.a = a; b2.life = 99;
      const open = t < 1.2 || Math.abs(r - gapR) < 1.3; b2.hidden = open; b2.ghost = open;   // not yet lit, or the travelling gap
      if (t > 5.8) { b2.life = 0; return true; }
      return false;
    };
  }
  later(e, 6, () => {                                                               // the rings lock, a beat, and fly
    const [x, y] = g.bxOrigin(e), t1 = g.t;
    [[2.6, 14, 0], [4.2, 20, 0.5], [5.8, 26, 1]].forEach(([r, n, off]) => {
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU; if (Math.abs(Math.atan2(Math.sin(a - off), Math.cos(a - off))) < (TAU / n) * 1.6) continue;
        const b = held(g, e, x + Math.cos(a) * r, y + Math.sin(a) * r, a, 'brass_shard', 130);
        b.orc = (b2) => { if (g.t - t1 > 0.9) { launch(b2, a, 4.4, 5); return true; } return false; };
      }
    });
    g.vx({ k: 'shake', amt: 6 });
  });
  later(e, 7.4, () => planetsHome(S));
}

// ---------------------------------------------------------------- PHASE 2: THE GREAT ECLIPSE (light, shadow, space)
// the eclipse as an instrument: risen where an attack needs it, moved by it, set when it ends
function eclipseAt(g, e, x, y, r) {
  const S = e.bx;
  if (!S.umbra) S.umbra = { x, y, r: 0.5, rise: true };
  S.umbra.goal = { x, y }; S.umbra.want = r; S.umbra.path = null; S.umbra.setting = false; S.umbra.chase = null;
  return S.umbra;
}
function eclipseSet(e) { if (e.bx.umbra) e.bx.umbra.setting = true; }
// ECLIPSE RISING (11 s): the eclipse rises at the machine and follows where you were a second ago, turning slowly, while
// the machine's fans alternate side to side [lead the eclipse away while you dodge] -> it halts where it caught up, and
// ten arms of flame spiral off its rim, every other one turning the other way [the gaps move: weave] -> it sets
function eclipseRising(g, e, V) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), dmg = V.dmg || 125;
  const U = eclipseAt(g, e, ox, oy, 3.8); U.chase = { v: 3, a: aimAt(g, ox, oy) };
  for (let k = 0; k < 8; k++) later(e, 0.5 + k * 0.62, () => { const [x, y] = g.bxOrigin(e), aim = aimAt(g, x, y) + (k % 2 ? 0.26 : -0.26); for (let j = 0; j < 5; j++) shotAt(g, e, x, y, aim + (j - 2) * 0.14, 'moon_shard', 7.6, dmg); });
  later(e, 5.6, () => { if (S.umbra) { S.umbra.chase = null; S.umbra.goal = { x: S.umbra.x, y: S.umbra.y }; S.umbra.want = 3.2; } });   // it halts
  const a0 = R() * TAU;
  for (let i = 0; i < 34; i++) later(e, 6 + i * 0.12, () => {
    const W = S.umbra; if (!W) return;
    for (let k = 0; k < 10; k++) { const a = a0 + (k / 10) * TAU + (k % 2 ? 1 : -1) * i * 0.085; shotAt(g, e, W.x + Math.cos(a) * W.r, W.y + Math.sin(a) * W.r, a, 'corona_flare', 5, dmg); }
  });
  later(e, 10.2, () => eclipseSet(e));
}
// SYZYGY (10 s): machine and planets fall in line with you; a wide beam is marked and burns down the line while the
// planets sweep shots across it and the machine fans at you [no standing still beside the beam] -> as the beam dies the
// eclipse rises on the line and slides along it toward you, crescents rolling off its leading edge [move along the curves,
// out of its path]
function syzygyLine(g, e, V) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), a = aimAt(g, ox, oy), nx = -Math.sin(a), ny = Math.cos(a), dmg = V.dmg || 125;
  (S.planets || []).forEach((P, k) => { P.ease = 4; P.goal = (g2, e2) => { const [x, y] = g2.bxOrigin(e2), d = k ? 3 : 7; return [x + Math.cos(a) * d, y + Math.sin(a) * d]; }; });
  for (const o of [-0.55, 0, 0.55]) g.fx.push({ kind: 'laser', x0: ox + nx * o, y0: oy + ny * o, a, len: 26, t: 0, tele: 1.3, act: 1.6, life: 3.1, dmg: g.bxDmg(e, 160), by: e.D.name, hit: false, col: '#ffd690' });
  for (let i = 0; i < 12; i++) later(e, 1.3 + i * 0.15, () => {
    for (const P of S.planets) for (const s of [1, -1]) shotAt(g, e, P.x, P.y, a + s * Math.PI / 2 + (i % 2 ? 0.1 : -0.1), 'star_bolt', 6, dmg);
    if (i % 4 === 2) { const [x, y] = g.bxOrigin(e), aim = aimAt(g, x, y); for (let j = -2; j <= 2; j++) shotAt(g, e, x, y, aim + j * 0.18, 'moon_shard', 6.4, dmg); }
  });
  later(e, 3.3, () => { planetsHome(S); const [x, y] = g.bxOrigin(e); eclipseAt(g, e, x, y, 3.2); });
  for (let k = 0; k < 9; k++) later(e, 3.6 + k * 0.5, () => {
    const U = S.umbra; if (!U) return;
    const [x, y] = g.bxOrigin(e); U.goal = { x: x + Math.cos(a) * Math.min(11, 2 + k * 1.1), y: y + Math.sin(a) * Math.min(11, 2 + k * 1.1) };   // sliding along the line
    const c = aimAt(g, U.x, U.y) + [0, 0.6, -0.6][k % 3];
    for (let j = -6; j <= 6; j++) { const b = c + j * 0.1; shotAt(g, e, U.x + Math.cos(b) * U.r, U.y + Math.sin(b) * U.r, b, 'eclipse_ring', 5, dmg); }
  });
  later(e, 8.4, () => eclipseSet(e));
}
// TWILIGHT TO TOTALITY (11 s): the planets wheel round YOU, firing five-shot fans in step, the machine sending slow rings
// with two openings [turn with them, through the openings] -> the planets return; the eclipse settles over the machine;
// four rings form round it, each with one opening, turning so the openings line up into one passage at you (shown), part
// again, and the rings let go [be at the passage when they go]
function twilightTotality(g, e, V) {
  const S = e.bx, a0 = R() * TAU, dmg = V.dmg || 125;
  (S.planets || []).forEach((P, k) => { P.ease = 3; P.t0 = g.t; P.goal = (g2) => { const a = a0 + k * Math.PI + (g2.t - P.t0) * 0.9; return [g2.player.x + Math.cos(a) * 5.5, g2.player.y + Math.sin(a) * 5.5]; }; });
  for (let k = 0; k < 7; k++) later(e, 0.8 + k * 0.6, () => { for (const P of S.planets) { const aim = aimAt(g, P.x, P.y); for (let j = -2; j <= 2; j++) shotAt(g, e, P.x, P.y, aim + j * 0.2, 'moon_shard', 6.6, dmg); } });
  for (let k = 0; k < 3; k++) later(e, 0.6 + k * 1.5, () => { const [x, y] = g.bxOrigin(e), a = R() * TAU; for (let j = 0; j < 18; j++) if (j % 9) shotAt(g, e, x, y, a + (j / 18) * TAU, 'eclipse_ring', 2.8, dmg); });
  later(e, 5, () => planetsHome(S));
  later(e, 5.4, () => {
    const [ox, oy] = g.bxOrigin(e), star = aimAt(g, ox, oy), t0 = g.t;
    eclipseAt(g, e, ox, oy, 2.2);
    [[2.6, 14, 1.1], [4.1, 18, -0.75], [5.6, 22, 0.55], [7.1, 26, -0.4]].forEach(([r, n, w]) => {
      for (let j = 0; j < n; j++) {
        const rel = (j / n) * TAU; if (Math.abs(Math.atan2(Math.sin(rel), Math.cos(rel))) < (TAU / n) * 0.75) continue;
        const b = held(g, e, ox, oy, 0, 'moon_shard', 130);
        b.orc = (b2) => { const t = g.t - t0, open = star + w * (t - 2.4), aa = open + rel, [x, y] = g.bxOrigin(e); b2.x = x + Math.cos(aa) * r; b2.y = y + Math.sin(aa) * r; b2.a = aa + Math.PI / 2; b2.life = 99; if (t > 4.3) { launch(b2, aa, 4.4, 4); return true; } return false; };
      }
    });
    later(e, 2.4, () => g.spMark({ kind: 'line', x: ox, y: oy, a: star, len: 8, life: 0.6, color: '#5ef08a' }));
    later(e, 4.6, () => eclipseSet(e));
  });
}
// (the change to the Collapse, 6 s: the eclipse swallows the machine and bursts; two black holes tear open and drink
// its debris; a shockwave with four openings)
function finaleEclipse(g, e) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), [cx, cy] = centre(e);
  eclipseAt(g, e, ox, oy, 6); S.spin = 5; g.banner('GRAVITATIONAL COLLAPSE', 1800);
  later(e, 1.2, () => { const [x, y] = g.bxOrigin(e), a0 = R() * TAU; for (let j = 0; j < 14; j++) shotAt(g, e, x, y, a0 + (j / 14) * TAU, 'brass_shard', 2.4, 120, { range: 8 }); });
  later(e, 2, () => { const [x, y] = g.bxOrigin(e), n = 40, a0 = R() * TAU; for (let j = 0; j < n; j++) if (j % 20 > 2) shotAt(g, e, x, y, a0 + (j / n) * TAU, 'eclipse_ring', 5, 130); g.vx({ k: 'shake', amt: 9 }); eclipseSet(e); S.spin = 1; });
  later(e, 3, () => {                                        // two black holes tear open; the eclipse's debris spirals into them
    const a = R() * TAU, W = [1, -1].map((s) => wellAt(g, e, cx + Math.cos(a) * 9 * s, cy + Math.sin(a) * 9 * s, 3.2));
    for (let i = 0; i < 14; i++) later(e, i * 0.12, () => W.forEach((w, k) => { const s = i * 0.7 + k * Math.PI, b = held(g, e, w.x + Math.cos(s) * 5, w.y + Math.sin(s) * 5, s, 'brass_shard', 120); b.asSpiral = { cx: w.x, cy: w.y, r: 5, a: s, w: k ? 1.2 : -1.2, shrink: 1.6, W: w }; }));
  });
  later(e, 5.6, () => { const [x, y] = g.bxOrigin(e), n = 40, a0 = R() * TAU; for (let j = 0; j < n; j++) if (j % 10 > 1) shotAt(g, e, x, y, a0 + (j / n) * TAU, 'corona_flare', 4.4, 130); g.vx({ k: 'shake', amt: 8 }); });
}

// ---------------------------------------------------------------- PHASE 3: GRAVITATIONAL COLLAPSE (failing, unstable)
// Three long sequences, each bringing the danger to every part of the floor (the edge included):
//   Binary Collapse   two black holes orbit the machine, winding arms of shots into themselves [move with them, or
//                     between] -> the machine's streams bend toward them [the straight lanes curve] -> three times the
//                     edge breaks off, a ring falling in toward them with three openings [the rim is no refuge] -> they spiral into the machine, which
//                     answers with a ring and a fan
//   Tidal Curtains    walls roll in from beyond opposite edges, their gaps lined up into one lane that opens five slots
//                     from where you stand [go to it] ->
//                     the same across the other axis [turn ninety degrees] -> all the while the planets sweep the
//                     floor's edge leaving trails -> they come home and burst
//   Decaying Orbits   three rings orbit and close in, then fly off on their tangents -> a ring gathers from beyond
//                     the edge and closes in while you are drawn in -> it bursts outward, a second ring between
const wellAt = (g, e, x, y, life = 7) => { const S = e.bx; S.wells = (S.wells || []).filter((W) => g.t <= W.until); const W = { x, y, vx: 0, vy: 0, until: g.t + life, born: g.t, tick: 0, r: 1 }; S.wells.push(W); return W; };
function binaryCollapse(g, e, V) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), [cx, cy] = centre(e), a = aimAt(g, ox, oy) + Math.PI / 2, dir = R() < 0.5 ? 1 : -1;
  const W = [0, Math.PI].map((q) => { const w = wellAt(g, e, ox + Math.cos(a + q) * 7, oy + Math.sin(a + q) * 7, 7.3); w.orbit = { a: a + q, r: 7, w: 0.32 * dir }; return w; });
  for (let i = 0; i < 32; i++) later(e, 0.4 + i * 0.17, () => W.forEach((w, k) => {   // each winds two arms into itself
    for (const q of [0, Math.PI]) { const s = i * 0.5 + q + k, b = held(g, e, w.x + Math.cos(s) * 6, w.y + Math.sin(s) * 6, s, k ? 'brass_shard' : 'star_bolt', V.dmg || 125); b.asSpiral = { cx: w.x, cy: w.y, r: 6, a: s, w: k ? 1.3 : -1.3, shrink: 1.5, W: w }; }
  }));
  const a0 = R() * Math.PI / 2;                              // the machine's four triple streams, bending toward the holes
  for (let i = 0; i < 24; i++) later(e, 2.4 + i * 0.09, () => { const [x, y] = g.bxOrigin(e); for (let k = 0; k < 4; k++) for (const o of [-0.09, 0, 0.09]) { const b = shotAt(g, e, x, y, a0 + i * 0.012 + (k / 4) * TAU + o, 'moon_shard', 6, V.dmg || 125); b.toWell = 1.15; b.life = 4; } });
  for (const T of [1.2, 3.2, 5.2]) later(e, T, () => {      // the edge breaks off: a ring from beyond the floor falls in toward the holes, three openings
    const c = R() * TAU, n = 44;
    for (let j = 0; j < n; j++) { if (j % 15 < 2) continue; const q = c + (j / n) * TAU, b = shotAt(g, e, cx + Math.cos(q) * 17.5, cy + Math.sin(q) * 17.5, q + Math.PI, 'brass_shard', 3.4, V.dmg || 120, { range: 24 }); b.toWell = 0.5; b.life = 6; }
  });
  later(e, 5.8, () => W.forEach((w) => { w.orbit.collapse = true; w.until = g.t + 1.3; }));   // they spiral into the machine
  later(e, 7.1, () => {
    const [x, y] = g.bxOrigin(e), n = 32, b0 = R() * TAU, aim = aimAt(g, x, y);
    for (let j = 0; j < n; j++) if (j % 16 > 2) shotAt(g, e, x, y, b0 + (j / n) * TAU, 'eclipse_ring', 4.6, V.dmg || 130);
    for (let j = -2; j <= 2; j++) shotAt(g, e, x, y, aim + j * 0.14, 'star_bolt', 7.5, V.dmg || 125);
    g.vx({ k: 'shake', amt: 7 }); g.vx({ k: 'burst', x, y, n: 30, colors: ['#c8a0ff', '#ffffff'] });
  });
}
function tidalCurtains(g, e, V) {
  const S = e.bx, [cx, cy] = centre(e), a = R() * Math.PI;
  const curtain = (ang, t0, rows) => {                       // rows from both ends of an axis, one shared gap
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, C = {}, SL = 1.15;   // (a slot: 1.15 tiles; the lane three slots)
    for (let i = 0; i < rows; i++) later(e, t0 + i * 0.38, () => {
      const jp = Math.round(((g.player.x - cx) * nx + (g.player.y - cy) * ny) / SL);   // your slot across the axis
      if (C.G === undefined) {                               // the lane opens at least five slots from where you stand: you go to it
        const ok = []; for (let q = -11; q <= 9; q++) if (q - jp >= 5 || jp - (q + 2) >= 5) ok.push(q);
        C.G = ok[Math.floor(R() * ok.length)];
        const off = (C.G + 1) * SL;                          // the lane marked on the floor, steady green, until the last row has passed
        g.spMark({ kind: 'line', x: cx - ux * 17.5 + nx * off, y: cy - uy * 17.5 + ny * off, a: ang, len: 35, life: (rows - i) * 0.38 + 3.6, color: '#5ef08a', steady: true, lane: true });
      }                                                      // (it holds: both ends' gaps line up into one straight lane)
      const gap = C.G;
      for (const s of [1, -1]) for (let j = -14; j <= 14; j++) {          // (wide as the floor, the shots close enough that only the lane is a way through)
        if (j >= gap && j <= gap + 2) continue;
        const b = shotAt(g, e, cx - ux * 17.5 * s + nx * j * SL, cy - uy * 17.5 * s + ny * j * SL, s > 0 ? ang : ang + Math.PI, 'star_bolt', 4.6, V.dmg || 125, { range: 36 });
        b.life = 8; b.curtain = true;
      }
    });
  };
  curtain(a, 0.3, 10); curtain(a + Math.PI / 2, 4.7, 10);
  (S.planets || []).forEach((P, k) => { P.ease = 2.5; P.t0 = g.t; P.goal = (g2) => { const q = (k ? Math.PI : 0) + (k ? -1 : 1) * (g2.t - P.t0) * 1.1; return [cx + Math.cos(q) * 14, cy + Math.sin(q) * 14]; }; });   // the planets sweep the edge
  for (let i = 0; i < 70; i++) later(e, 0.6 + i * 0.11, () => { for (const P of S.planets || []) { const b = shotAt(g, e, P.x, P.y, angleTo(cx, cy, P.x, P.y) + Math.PI, 'brass_shard', 0.9, V.dmg || 120, { range: 3 }); b.life = 3.2; } });
  later(e, 8.6, () => planetsHome(S));
  later(e, 9.3, () => { for (const P of S.planets || []) { const a1 = R() * TAU; for (let j = 0; j < 12; j++) shotAt(g, e, P.x, P.y, a1 + (j / 12) * TAU, 'moon_shard', 4.5, V.dmg || 125); } g.vx({ k: 'shake', amt: 4 }); });
}
function decayingOrbits(g, e, V) {
  orbitalDecay(g, e, V);
  later(e, 5, () => eventHorizon(g, e, V));
}
// (its parts) three rings orbit at different speeds and slowly close in; a ring of warning, then they fly off on their tangents
function orbitalDecay(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), t0 = g.t;
  [[3.6, 14, 1.1], [5.6, 20, -0.8], [7.6, 26, 0.6]].forEach(([r0, n, w]) => {
    const gap = Math.floor(R() * n);
    for (let j = 0; j < n; j++) {
      if (j === gap || j === (gap + 1) % n) continue;
      const a0 = (j / n) * TAU, b = held(g, e, ox, oy, 0, 'moon_shard', V.dmg || 130);
      b.orc = (b2) => { const t = g.t - t0, r = r0 - t * 0.55, a = a0 + w * 1.25 * t, [x, y] = g.bxOrigin(e); b2.x = x + Math.cos(a) * r; b2.y = y + Math.sin(a) * r; b2.a = a + Math.sign(w) * Math.PI / 2; if (t > 4.4) { launch(b2, b2.a, 5.6, 4); return true; } return false; };
    }
  });
  later(e, 3.6, () => { const [x, y] = g.bxOrigin(e); g.spMark({ kind: 'ring', x, y, r: 6, life: 0.8, color: '#ffffff' }); });
}
// a ring gathers from beyond the floor's edge and closes in (two openings) while you are drawn in; it lets go as a spaced
// burst outward, a second ring between its shots
function eventHorizon(g, e, V) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), n = 40, a0 = R() * TAU, t0 = g.t;
  S.draw = { until: g.t + 3.9, f: 1.3 };
  for (let j = 0; j < n; j++) {
    if (j % 20 < 2) continue;
    const a = a0 + (j / n) * TAU, b = held(g, e, ox + Math.cos(a) * 18, oy + Math.sin(a) * 18, a, 'eclipse_ring', V.dmg || 130);
    b.orc = (b2) => { const t = g.t - t0, r = Math.max(2.6, 18 - t * 3.9), aa = a + t * 0.3, [x, y] = g.bxOrigin(e); b2.x = x + Math.cos(aa) * r; b2.y = y + Math.sin(aa) * r; b2.a = aa; if (t > 4.1) { launch(b2, aa, 4.6, 4); return true; } return false; };
  }
  g.spMark({ kind: 'ring', x: ox, y: oy, r: 15, life: 3.9, color: '#c8a0ff' });
  later(e, 4.4, () => { const [x, y] = g.bxOrigin(e); for (let j = 0; j < n; j++) if (j % 20 > 1) shotAt(g, e, x, y, a0 + 4.1 * 0.3 + ((j + 0.5) / n) * TAU, 'moon_shard', 3.4, V.dmg || 125); g.vx({ k: 'shake', amt: 5 }); });
}

// ---------------------------------------------------------------- what runs every frame, in the fight and in the finale
function tick(g, e, dt) {
  const S = e.bx, p = g.player, [cx, cy] = centre(e);
  planetsTick(g, e, dt);                                     // the planets: wheeling round it, or where an attack puts them
  S.trail = S.trail || []; S.trail.push([g.t, p.x, p.y]); while (S.trail.length && g.t - S.trail[0][0] > 1.2) S.trail.shift();   // where you were
  if (S.draw && g.t < S.draw.until && !p.dead) { const [ox, oy] = g.bxOrigin(e), d = Math.hypot(ox - p.x, oy - p.y) || 1; g.moveCircle(p, ((ox - p.x) / d) * S.draw.f * dt, ((oy - p.y) / d) * S.draw.f * dt, 0.32); }
  // (the eclipse rises only when an attack calls it)
  const U = S.umbra;
  if (U) {                                                   // the eclipse crosses on its path; burns whoever is in it
    if (S.sing) {                                            // the finale: the singularity swallows it
      U.x += (S.sing.x - U.x) * Math.min(1, dt * 1.5); U.y += (S.sing.y - U.y) * Math.min(1, dt * 1.5); U.r = Math.max(0, U.r - dt * 2.2);
      if (U.r <= 0.1) S.umbra = null;
    } else if (U.setting) {                                  // it sets
      U.r = Math.max(0, U.r - dt * 3); if (U.r <= 0.1) S.umbra = null;
    } else if (U.chase) {                                    // it follows where you were a second ago, turning slowly
      const tr = S.trail && S.trail[0], tx = tr ? tr[1] : p.x, ty = tr ? tr[2] : p.y, want = angleTo(U.x, U.y, tx, ty);
      let da = ((want - U.chase.a + Math.PI * 3) % TAU) - Math.PI; U.chase.a += Math.max(-2 * dt, Math.min(2 * dt, da));
      if (Math.hypot(tx - U.x, ty - U.y) > 0.4) { U.x += Math.cos(U.chase.a) * U.chase.v * dt; U.y += Math.sin(U.chase.a) * U.chase.v * dt; }
      U.r += ((U.want || 3.5) - U.r) * Math.min(1, dt * 2);
    } else if (U.goal) {                                     // it glides to where the attack wants it
      const k = Math.min(1, dt * 2.5); U.x += (U.goal.x - U.x) * k; U.y += (U.goal.y - U.y) * k; U.r += ((U.want || 3.5) - U.r) * Math.min(1, dt * 2);
    } else if (U.path) {
      const P = U.path; P.t += dt;
      const k = Math.max(0, Math.min(1, P.t / P.T));
      U.x = P.x0 + (P.x1 - P.x0) * k; U.y = P.y0 + (P.y1 - P.y0) * k;
      if (k >= 1) { S.umbra = null; S.transitT = (UMBRA[S.phase] || UMBRA[3]).every; }
    }
    const live = S.umbra && (!U.path || U.path.t >= 0) && !S.sing && !U.setting && U.r > 1;
    if (live && !p.dead && Math.hypot(p.x - U.x, p.y - U.y) < U.r * 0.92 && (S.umbraT = (S.umbraT || 0) - dt) <= 0) { S.umbraT = 0.4; g.hurtPlayer(g.bxDmg(e, 70), 'the eclipse'); }
  }
  for (const b of g.projectiles) {
    if (b.bxOf !== e) continue;
    if (b.fair === undefined) { b.fair = Math.hypot(b.x - p.x, b.y - (p.y - 0.45)) < 1.3; if (b.fair) b.ghost = true; }   // born on top of you: harmless (faint) until it has left you
    else if (b.fair && Math.hypot(b.x - p.x, b.y - (p.y - 0.45)) > 1.9) { b.fair = false; b.ghost = false; }
    if (b.orc && b.orc(b, dt)) b.orc = null;                 // a shot an attack steers (a formation), until it lets go
    if (b.toBoss) {                                          // a curtain bending in toward the machine
      const [ox, oy] = g.bxOrigin(e), cur = Math.atan2(b.vy, b.vx), want = angleTo(b.x, b.y, ox, oy), sp = Math.hypot(b.vx, b.vy);
      let da = ((want - cur + Math.PI * 3) % TAU) - Math.PI; da = Math.max(-b.toBoss * dt, Math.min(b.toBoss * dt, da));
      b.vx = Math.cos(cur + da) * sp; b.vy = Math.sin(cur + da) * sp; b.a = cur + da;
      if (Math.hypot(b.x - ox, b.y - oy) < 1.2) b.life = 0;
    }
    const O = b.asOrb;                                       // shots in orbit wheel round; when their time is up they fly off on the tangent
    if (O) {
      O.a += O.w * dt; O.t -= dt;
      b.x = O.cx + Math.cos(O.a) * O.r; b.y = O.cy + Math.sin(O.a) * O.r; b.a = O.a + (O.w > 0 ? Math.PI / 2 : -Math.PI / 2); b.life = 99;
      if (O.t <= 0) { b.asOrb = null; b.vx = Math.cos(b.a) * 5; b.vy = Math.sin(b.a) * 5; b.life = 2.6; }
    }
    const P = b.asSpiral;                                    // shots winding into a black hole: swallowed at its heart
    if (P) {
      if (P.W) { P.cx = P.W.x; P.cy = P.W.y; }               // a disk travels with its singularity
      P.a += (P.w * 3 / Math.max(1.2, P.r)) * dt; P.r -= P.shrink * dt;
      b.x = P.cx + Math.cos(P.a) * P.r; b.y = P.cy + Math.sin(P.a) * P.r; b.a = P.a + (P.w > 0 ? Math.PI / 2 : -Math.PI / 2) - 0.3 * Math.sign(P.w); b.vx = 0; b.vy = 0; b.life = 99;
      if (P.r <= 0.35 || (P.out && P.r > P.out) || (P.until && g.t > P.until)) b.life = 0;
    }
    if (b.intoWell && Math.hypot(b.x - b.intoWell.x, b.y - b.intoWell.y) < 0.6) b.life = 0;
  }
  if (S.wells && S.wells.length) {                           // shots that feel the black holes bend toward the nearest
    for (const b of g.projectiles) {
      if (!b.toWell || b.bxOf !== e) continue;
      let W = null, wd = 1e9;
      for (const q of S.wells) { const d = Math.hypot(q.x - b.x, q.y - b.y); if (d < wd) { wd = d; W = q; } }
      if (!W) continue;
      if (wd < 0.6) { b.life = 0; continue; }
      const cur = Math.atan2(b.vy, b.vx), want = angleTo(b.x, b.y, W.x, W.y), s = Math.hypot(b.vx, b.vy);
      let da = ((want - cur + Math.PI * 3) % TAU) - Math.PI; da = Math.max(-b.toWell * dt, Math.min(b.toWell * dt, da));
      b.vx = Math.cos(cur + da) * s; b.vy = Math.sin(cur + da) * s; b.a = cur + da;
    }
  }
  if (S.wells) S.wells = S.wells.filter((W) => g.t <= W.until);
  for (const W of S.wells || []) {                           // each singularity drifts (off the rim), pulls, and burns at its core
    if (W.seed && !p.dead) { const q = Math.hypot(p.x - W.x, p.y - W.y) || 1; W.vx = ((p.x - W.x) / q) * 1; W.vy = ((p.y - W.y) / q) * 1; }   // a seed drifts after you, slowly
    if (W.orbit) {                                           // a black hole in orbit round the machine (closing in when it collapses)
      const O = W.orbit, [bx, by] = g.bxOrigin(e); O.a += O.w * dt; if (O.collapse) O.r = Math.max(0, O.r - 6 * dt);
      W.x = bx + Math.cos(O.a) * O.r; W.y = by + Math.sin(O.a) * O.r;
    } else { W.x += (W.vx || 0) * dt; W.y += (W.vy || 0) * dt; }
    if (Math.hypot(W.x - cx, W.y - cy) > 13) { W.vx = -W.vx; W.vy = -W.vy; }
    if (p.dead) continue;
    const d = Math.hypot(W.x - p.x, W.y - p.y), k = Math.max(0, 1 - d / 3.5);
    if (d > 0.2 && k > 0) g.moveCircle(p, ((W.x - p.x) / d) * (1.2 + 2.6 * k) * dt, ((W.y - p.y) / d) * (1.2 + 2.6 * k) * dt, 0.32);
    if (d < 1 && (W.tick -= dt) <= 0) { W.tick = 0.4; g.hurtPlayer(g.bxDmg(e, 150), 'a singularity'); }
  }
  if (S.debris) {                                            // the shards land where the shadows were
    for (const D of S.debris) if (g.t >= D.at && !D.done) {
      D.done = true;
      if (!p.dead && Math.hypot(p.x - D.x, p.y - D.y) < 0.9) g.hurtPlayer(g.bxDmg(e, 130), 'falling brass');
      const a0 = R() * TAU;
      for (let k = 0; k < 4; k++) g.bxShot(e, D.x, D.y, a0 + (k / 4) * TAU, { shot: 'brass_shard', speed: 4.5, range: 3.5, dmg: 110 });
      g.vx({ k: 'burst', x: D.x, y: D.y, n: 8, colors: ['#ffd690', '#a87a3a', '#ffffff'] });
    }
    S.debris = S.debris.filter((D) => !D.done);
  }
  if (S.meteors) {                                           // meteors land on their rune circles
    for (const M of S.meteors) if (g.t >= M.at && !M.done) {
      M.done = true;
      if (!p.dead && Math.hypot(p.x - M.x, p.y - M.y) < 1) g.hurtPlayer(g.bxDmg(e, 140), 'a falling meteor');
      if (M.along !== undefined) for (const s0 of [0, Math.PI]) for (const q of [-0.25, 0, 0.25]) g.bxShot(e, M.x, M.y, M.along + s0 + q, { shot: 'brass_shard', speed: 4.8, range: 4.5, dmg: 110 });   // along the arc: a wave that walks
      else { const a0 = R() * TAU; for (let k = 0; k < 6; k++) g.bxShot(e, M.x, M.y, a0 + (k / 6) * TAU, { shot: 'brass_shard', speed: 4.8, range: 4, dmg: 110 }); }
      g.vx({ k: 'burst', x: M.x, y: M.y, n: 12, colors: ['#ff8a1f', '#ffd690', '#ffffff'] }); g.vx({ k: 'shake', amt: 2 });
    }
    S.meteors = S.meteors.filter((M) => !M.done);
  }
}

// ---------------------------------------------------------------- the second survival: SUPERNOVA (at 4%; realm_astral_supernova)
// EVENT HORIZON (3 s): it plays p3_to_p4; the hole swells and pulls you in, the void creeps in from the walls and the
// floor's debris spirals into it; everything goes black; it detonates (a white flash, a ring that throws you out); the
// nova unfolds. Then the Orrery is reborn as a supernova and its four patterns turn, each cycle ending in a shock ring:
//   Spiral Storm  four arms of nova_spiral, 6 volleys a second, turning 11 degrees a volley (reversing each cycle);
//                 helix pairs in 8 directions every 0.8 s
//   Planetfall    bursts of 10 shattered-planet chunks every 0.6 s (ice, rock, violet): they slow and hang; violet
//                 ones split into embers
//   Comet Wheel   6 plasma comets curving clockwise, dropping embers; ember rings of 24
//   Gamma Burst   both polar jets marked for 1 s, then gamma rays sweep 90 degrees; 2 singularity seeds drift at you
// The floor is a starfield in the dark; only a pool of light round you (soft at its edge) and the burning star show,
// and shots out in the dark are dim.
const SN = (n) => `sn_shots/${n}`;
const EH = 3;
// the Supernova's six movements, one after another (s): each one's own formation, nothing piled on it
// THE SUPERNOVA (after the Event Horizon): the whole floor matters. The attacks come from the star AND from the rim,
// cross the floor, and change shape far out, so neither the middle, the back wall nor a steady circle is safe. Three
// positioning demands alternate, under telegraphed strikes on wherever you stand:
//   THE CROWN (outer)      rotating spokes fired inward from emitters on the rim; slow rings from the star: live in the
//                          outer band between the spokes and turn with them
//   STELLAR WIND (lateral) walls cross the whole floor from its edge, alternating sides, each with a gap that shifts:
//                          move sideways to the gap, then back for the next
//   IMPLOSION (inward)     rings form at the rim (faint for half a second), then close on the star and dissolve near it:
//                          push in to the inner band, where the star's aimed fans keep you moving
//   CROSSFIRE              two beams turn from the star while comets are fired from the rim straight through where you
//                          stand (each line shown first): step off every line
//   FLARE STRIKES          throughout: a red circle where you stand fills for a second, then bursts
// THE FINAL RADIANCE mixes all of them, faster, and ends in the detonation.
const NOVA = [['ignition', 4], ['crown', 8], ['wind', 8], ['implosion', 8], ['crossfire', 8], ['crown2', 7], ['radiance', 10]];
const NOVA_LEN = NOVA.reduce((s, [, d]) => s + d, 0), NOVA_DUR = EH + NOVA_LEN + 0.5;
const ARENA_R = 16.5;                                              // the floor's rim (36x36, round)
function novaSequence(g, e, dt, tt, ox, oy) {
  const S = e.bx, N = S.nova2, p = g.player, [cx, cy] = centre(e);
  let at = 0, k = 0;
  while (k < NOVA.length - 1 && tt >= at + NOVA[k][1]) { at += NOVA[k][1]; k++; }
  if (N.k !== k) { N.k = k; N.kind = NOVA[k][0]; N.L = {}; if (k) { shockArc(g, e); g.banner({ crown: 'THE CROWN', crown2: 'THE CROWN', wind: 'STELLAR WIND', implosion: 'IMPLOSION', crossfire: 'CROSSFIRE', radiance: 'THE FINAL RADIANCE' }[N.kind] || '', 1300); } }
  const lt = tt - at, L = N.L, kind = N.kind;
  const fire = (x, y, a, name, speed, dmg, o = {}) => g.bxShot(e, x, y, a, { sprite: SN(name), speed, range: o.range || 24, dmg, ...o });
  // ---- flare strikes: on wherever you stand (all but the ignition), faster as it burns on
  if (kind !== 'ignition' && (N.strike = (N.strike === undefined ? 1 : N.strike) - dt) <= 0) {
    N.strike = kind === 'radiance' ? 2 : 2.4;
    const x = p.x, y = p.y;
    g.spMark({ kind: 'circle', x, y, r: 1.4, life: 1, color: '#ff4a5a' });
    later(e, 1, () => {
      if (!p.dead && Math.hypot(p.x - x, p.y - y) < 1.4) g.hurtPlayer(g.bxDmg(e, 140), 'a solar flare');
      const a0 = R() * TAU; for (let j = 0; j < 8; j++) fire(x, y - 0.4, a0 + (j / 8) * TAU, 'stellar_ember', 3.4, 115, { size: 0.35, range: 5 });
      g.vx({ k: 'burst', x, y, n: 14, colors: ['#ff8a1f', '#ffd690', '#ffffff'] });
    });
  }
  const crown = (lt2, fast) => {                                  // rim emitters firing inward spokes, turning; slow rings from the star
    if (L.c0 === undefined) L.c0 = R() * TAU;
    const n = 6, turn = L.c0 + lt2 * (0.42 * fast);
    if ((L.sp = (L.sp || 0) - dt) <= 0) {
      L.sp = 0.11;
      for (let j = 0; j < n; j++) { const a = turn + (j / n) * TAU, x = cx + Math.cos(a) * ARENA_R, y = cy + Math.sin(a) * ARENA_R; fire(x, y, a + Math.PI, 'nova_spiral', 6, 140, { range: 9.5 }); }
    }
    if ((L.ring = (L.ring === undefined ? 1 : L.ring) - dt) <= 0) {
      L.ring = 2.1; const a0 = R() * TAU;
      for (let j = 0; j < 20; j++) if (j % 10 > 1) fire(ox, oy, a0 + (j / 20) * TAU, 'helix_pair', 2.8, 130);
    }
  };
  const wind = (every) => {                                       // walls across the whole floor from its edge, alternating sides, the gap shifting
    if ((L.w = (L.w === undefined ? 0.3 : L.w) - dt) <= 0) {
      L.w = every; L.wn = (L.wn || 0) + 1;
      if (L.base === undefined) { L.base = R() * Math.PI; L.gap = (R() - 0.5) * 8; }
      if (L.wn % 4 === 1 && L.wn > 1) L.base += Math.PI / 6;     // every other pair, the wind veers
      const d = L.base + (L.wn % 2 ? 0 : Math.PI), ux = Math.cos(d), uy = Math.sin(d), nx = -uy, ny = ux;
      L.gap += (L.wn % 2 ? 2.6 : -1.4); if (Math.abs(L.gap) > 9) L.gap = -Math.sign(L.gap) * 6;
      for (let o = -16; o <= 16; o += 1.05) {
        if (Math.abs(o - L.gap) < 1.45) continue;                  // the gap: a little under three tiles
        const x = cx - ux * 17 + nx * o, y = cy - uy * 17 + ny * o;
        if (Math.hypot(x - cx, y - cy) > 24) continue;
        fire(x, y, d, ['planet_chunk_ice', 'planet_chunk_rock', 'planet_chunk_violet'][L.wn % 3], 5.2, 145, { range: 36 });
      }
      g.spMark({ kind: 'line', x: cx - ux * 17 + nx * L.gap, y: cy - uy * 17 + ny * L.gap, a: d, len: 6, life: 0.5, color: '#5ef08a' });   // where the gap enters
    }
  };
  const implosion = (every) => {                                  // rings form at the rim, close on the star, dissolve near it
    if ((L.im = (L.im === undefined ? 0.2 : L.im) - dt) <= 0) {
      L.im = every; L.ia = (L.ia === undefined ? R() * TAU : L.ia + 0.55);
      const n = 60, t0 = g.t, gap = L.ia;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU; if ([gap, gap + Math.PI].some((q) => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q))) < 0.15)) continue;
        const b = g.bxShot(e, cx + Math.cos(a) * ARENA_R, cy + Math.sin(a) * ARENA_R, a + Math.PI, { sprite: SN('shock_arc'), speed: 0.01, range: 99, dmg: 145 });
        b.vx = 0; b.vy = 0; b.life = 99; b.ghost = true;
        b.orc = (b2) => {
          const t = g.t - t0, r = t < 0.5 ? ARENA_R : ARENA_R - (t - 0.5) * 3.6;
          b2.ghost = t < 0.5; b2.x = cx + Math.cos(a) * r; b2.y = cy + Math.sin(a) * r; b2.a = a + Math.PI; b2.life = 99;
          if (r < 6.5) { b2.life = 0; return true; }              // they dissolve short of the star: the inner band is the way through
          return false;
        };
      }
    }
    if ((L.af = (L.af === undefined ? 1 : L.af) - dt) <= 0) {     // the star's aimed fans: the inner band is no rest
      L.af = 1.1; const aim = aimAt(g, ox, oy);
      for (let j = -1; j <= 1; j++) fire(ox, oy, aim + j * 0.24, 'nova_spiral', 6, 140, { range: 7.5 });
    }
  };
  const crossfire = (lt2) => {                                    // turning beams from the star; comets from the rim through where you stand
    if (L.ga === undefined) { L.ga = aimAt(g, ox, oy) + Math.PI / 2; L.rays = []; for (const s of [0, Math.PI]) g.spMark({ kind: 'line', x: ox, y: oy, a: L.ga + s, len: 13, life: 1, color: '#8af6ff' }); }
    const a = L.ga + Math.max(0, lt2 - 1) * 0.5;
    if (lt2 >= 1 && !L.rays.length) for (const s of [0, Math.PI]) for (let j = 0; j < 12; j++) { const b = g.bxShot(e, ox, oy, 0, { sprite: SN('gamma_ray'), speed: 0.01, range: 99, dmg: 165 }); b.gamma = { s, k: j }; L.rays.push(b); }
    for (const b of L.rays) { const r = 1.2 + b.gamma.k * 0.95, aa = a + b.gamma.s; b.x = ox + Math.cos(aa) * r; b.y = oy + Math.sin(aa) * r; b.a = aa; b.vx = 0; b.vy = 0; b.life = lt2 < 7.6 ? 99 : 0; }
    if (lt2 >= 7.6) L.rays = [];
    if (lt2 > 1.5 && (L.cm = (L.cm || 0) - dt) <= 0) {
      L.cm = 1.3; const pa = angleTo(cx, cy, p.x, p.y), tx = p.x, ty = p.y - 0.4;
      for (const s of [1, -1]) {
        const ra = pa + s * (1.1 + R() * 0.4), x = cx + Math.cos(ra) * ARENA_R, y = cy + Math.sin(ra) * ARENA_R, d = angleTo(x, y, tx, ty);
        g.spMark({ kind: 'line', x, y, a: d, len: 30, life: 0.8, color: '#ff8a1f' });
        for (let j = 0; j < 3; j++) later(e, 0.8 + j * 0.12, () => fire(x, y, d, 'plasma_comet', 9, 155, { size: 0.55, range: 34 }));
      }
    }
  };
  if (kind === 'ignition') {                                      // the star kindles: rings whose openings walk round (learn the rhythm)
    if (L.a0 === undefined) { L.a0 = aimAt(g, ox, oy); L.n = 0; N.flash = 0.2; g.vx({ k: 'shake', amt: 12 }); }
    if (L.n < 8 && lt >= L.n * 0.42) {
      const n = 48, open = L.a0 + L.n * 0.38;
      for (let j = 0; j < n; j++) { const a = (j / n) * TAU; if ([open, open + Math.PI].some((q) => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q))) < 0.21)) continue; fire(ox, oy, a, L.n % 2 ? 'nova_spiral' : 'shock_arc', 5.2, 145); }
      L.n++; N.soft = 0.1; g.vx({ k: 'shake', amt: 4 });
    }
  } else if (kind === 'crown') crown(lt, 1);
  else if (kind === 'wind') { wind(1.05); if ((L.sp = (L.sp || 0) - dt) <= 0) { L.sp = 0.16; L.sa = (L.sa || 0) + 0.21; for (let j = 0; j < 3; j++) fire(ox, oy, L.sa + (j / 3) * TAU, 'stellar_ember', 3, 115, { size: 0.35, range: 10 }); } }
  else if (kind === 'implosion') implosion(1.25);
  else if (kind === 'crossfire') crossfire(lt);
  else if (kind === 'crown2') { crown(lt, -1.3); if (lt > 2) implosion(2.4); }   // the crown turns the other way, faster; rings close through it
  else if (kind === 'radiance') {                                 // everything learned, at once and faster; then it blows
    if (S.alt) S.alt.scale = 0.8 + Math.min(1, lt / 9) * 0.4;
    if (lt < 3.3) wind(0.95); else if (lt < 6.6) implosion(1.15); else crown(lt, 1.5);
    if ((L.sp = (L.sp || 0) - dt) <= 0) { L.sp = 0.1; L.sa = (L.sa || R() * TAU) + 0.12; L.sn = (L.sn || 0) + 1; for (let j = 0; j < 4; j++) if ((L.sn + j * 2) % 10 < 8) fire(ox, oy, L.sa + (j / 4) * TAU, 'nova_spiral', 4.4, 145, { range: 9 }); }
    if ((L.pulse = (L.pulse || 0) - dt) <= 0) { L.pulse = 1.2; N.soft = 0.1; g.vx({ k: 'shake', amt: 3 + lt }); }
    if (lt > 9.6 && !N.blown) { N.blown = true; N.flash = 0.5; g.vx({ k: 'shake', amt: 18 }); g.vx({ k: 'burst', x: ox, y: oy, n: 120, colors: ['#ffffff', '#ffd690', '#ff8a1f', '#8af6ff', '#c8a0ff'] }); }
  }
}
const finale2 = {
  at: 0.04, dur: NOVA_DUR, name: 'Supernova', say: 'the event horizon', after: 3.5,
  start(g, e) {
    const S = e.bx, def = g.A.reg && g.A.reg.resolve('bx_orrery_supernova/grand_orrery');
    S.umbra = null; S.wells = []; S.meteors = []; S.debris = [];
    S.nova2 = { dark: 0, creep: 0, flash: 0, boom: false, pat: -1, patT: 0, n: 0, dir: 1, sub: 0, sub2: 0, chunk: 0, a: R() * TAU, bits: [] };
    if (def) { S.alt = { def, anim: new Anim(def, 'p3_to_p4'), scale: 0.8 }; S.alt.anim.speed = (def.anims.p3_to_p4.frames.length / def.anims.p3_to_p4.fps) / EH; }
    const [cx, cy] = centre(e);
    for (let k = 0; k < 40; k++) { const a = R() * TAU, d = 6 + R() * 10; S.nova2.bits.push({ a, d, w: 1.5 + R(), sprite: k % 2 ? 'sn_fx/debris_marble' : 'sn_fx/debris_brass', cx, cy }); }
  },
  update(g, e, dt, t) {
    const S = e.bx, N = S.nova2, p = g.player, [cx, cy] = centre(e);
    const dd = Math.hypot(cx - e.x, cy - e.y); if (dd > 0.1) g.moveCircle(e, ((cx - e.x) / dd) * Math.min(dd, 4 * dt), ((cy - e.y) / dd) * Math.min(dd, 4 * dt), 0.8);   // to the middle
    const [ox, oy] = g.bxOrigin(e);
    tick(g, e, dt);
    if (t < EH) {                                                 // the Event Horizon
      N.creep = Math.min(1, t / (EH * 0.5));
      for (const B of N.bits) B.d = Math.max(0, B.d - dt * B.w * 3);
      const d = Math.hypot(ox - p.x, oy - p.y);
      if (t < EH * 0.5 && !p.dead && d > 0.5) g.moveCircle(p, ((ox - p.x) / d) * 1.5 * dt, ((oy - p.y) / d) * 1.5 * dt, 0.32);
      N.dark = Math.min(1, t / (EH * 0.55));
      if (!N.boom && t >= EH * 0.65) {                           // detonation: a flash, and a ring that throws you out 3 tiles
        N.boom = true; N.flash = 0.25; g.vx({ k: 'shake', amt: 14 });
        if (!p.dead && d > 0.2) for (let k = 0; k < 12; k++) g.moveCircle(p, ((p.x - ox) / d) * 0.25, ((p.y - oy) / d) * 0.25, 0.32);
        g.spMark({ kind: 'ring', x: ox, y: oy, r: 9, life: 0.6, color: '#ffffff' });
      }
      return;
    }
    if (S.alt && S.alt.anim.clip === 'p3_to_p4') { S.alt.anim.play('p4_idle', { speed: 1 }); g.banner('SUPERNOVA', 1800); }
    N.flash = Math.max(0, N.flash - dt); N.soft = Math.max(0, (N.soft || 0) - dt);
    novaSequence(g, e, dt, t - EH, ox, oy);
    for (const b of g.projectiles) {                              // chunks that slow and hang (violet ones split), comets that drop embers
      if (b.bxOf !== e) continue;
      if (b.snHang) {
        const H = b.snHang, s = Math.hypot(b.vx, b.vy);
        if (!H.hold && s > 0.25) { b.vx *= 1 - H.slow * dt; b.vy *= 1 - H.slow * dt; if (s < 1.2) { H.hold = H.hang; } }
        else if (H.hold !== undefined && (H.hold -= dt) <= 0 && !H.done) {
          H.done = true; b.life = 0;
          if (H.split) for (let k = 0; k < 3; k++) g.bxShot(e, b.x, b.y, R() * TAU, { sprite: SN('stellar_ember'), speed: 3.5, range: 6, dmg: 100, size: 0.35 });
        } else if (H.hold !== undefined) { b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1); }
      }
      if (b.snEmit !== undefined && (b.snEmit -= dt) <= 0) {   // a seed sheds five embers away from the star
        b.snEmit = 0.45; const out = angleTo(ox, oy, b.x, b.y);
        for (let k = -2; k <= 2; k++) g.bxShot(e, b.x, b.y, out + k * 0.3, { sprite: SN('stellar_ember'), speed: 3.6, range: 26, dmg: 115, size: 0.35 });
      }
      if (b.snEmber !== undefined && (b.snEmber -= dt) <= 0) { b.snEmber = 0.2; g.bxShot(e, b.x, b.y, R() * TAU, { sprite: SN('stellar_ember'), speed: 0.6, range: 1.2, dmg: 90, size: 0.35 }); }
    }
  },
  end(g, e) { const S = e.bx; S.nova2 = null; if (S.alt) S.alt.anim.play('p4_idle'); },
};
// a shock ring: 36 arcs, two openings (one aimed at you, one anywhere); the reborn star's attack clip throws it
function shockArc(g, e) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), p = g.player, aim = angleTo(ox, oy, p.x, p.y - 0.4), n = 36, rnd = Math.floor(R() * n), at = Math.round(((aim % TAU) + TAU) % TAU / TAU * n);
  if (S.alt) { S.alt.anim.play('p4_attack', { speed: 1 }); S.alt.anim.queue('p4_idle'); }
  for (let k = 0; k < n; k++) {
    const near = (q) => Math.min((k - q + n) % n, (q - k + n) % n) <= 1;
    if (near(at) || near(rnd)) continue;
    g.bxShot(e, ox, oy, (k / n) * TAU, { sprite: SN('shock_arc'), speed: 5.5, range: 20, dmg: 140 });
  }
  g.vx({ k: 'shake', amt: 5 });
}
// gamma burst: the two polar jets are marked for a second, then rays of twelve beam segments sweep a quarter turn
function gammaStart(g, e) {
  const N = e.bx.nova2, p = g.player, [ox, oy] = g.bxOrigin(e);
  N.gA = angleTo(ox, oy, p.x, p.y) - Math.PI / 4; N.gT = 0; N.rays = [];
  for (const s of [0, Math.PI]) g.spMark({ kind: 'line', x: ox, y: oy, a: N.gA + s, len: 14, life: 1, color: '#8af6ff' });
  well(g, e, { n: 2, max: 2, life: 6 });                          // two singularity seeds
  for (const W of e.bx.wells) { W.seed = true; W.born = g.t; }
}
function gammaTick(g, e, dt, ox, oy) {
  const N = e.bx.nova2;
  N.gT += dt;
  if (N.gT < 1) return;
  if (!N.rays.length) for (const s of [0, Math.PI]) for (let k = 0; k < 12; k++) {
    const b = g.bxShot(e, ox, oy, 0, { sprite: SN('gamma_ray'), speed: 0.01, range: 99, dmg: 160 });
    b.gamma = { s, k }; N.rays.push(b);
  }
  const a = N.gA + Math.min(1, (N.gT - 1) / 2) * (Math.PI / 2);
  for (const b of N.rays) { const r = 1.2 + b.gamma.k * 0.95, aa = a + b.gamma.s; b.x = ox + Math.cos(aa) * r; b.y = oy + Math.sin(aa) * r; b.a = aa; b.vx = 0; b.vy = 0; b.life = N.gT < 3 ? 99 : 0; }
  if (N.gT >= 3) N.rays = [];
}
// the singularity seeds drift slowly toward you (in tick)
// the dark of the Supernova, drawn over everything: a pool of light round you with a soft edge, the star's own glare;
// out in the dark the floor is gone and shots are dim
function supernovaDark(r, g, e) {
  const N = e.bx.nova2, b = r.b, W = r.buf.width, H = r.buf.height;
  if (!N || N.dark <= 0) return;
  const c = r.snDark || (r.snDark = document.createElement('canvas'));
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  const x = c.getContext('2d'), [px, py] = r.proj(g.player.x, g.player.y - 0.4), [bx, by] = r.proj(e.x, e.y - e.hitUp);
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
  x.fillStyle = `rgba(2,1,6,${0.7 * N.dark})`; x.fillRect(0, 0, W, H);   // (dark, but what comes from the rim must still read)
  x.globalCompositeOperation = 'destination-out';
  const hole = (cx, cy, R0) => { const gr = x.createRadialGradient(cx, cy, R0 * 0.35, cx, cy, R0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R0, 0, TAU); x.fill(); };
  hole(px, py, 3.6 * 16);                                           // your light, fading at its edge
  hole(bx, by, 2.4 * 16 * ((e.bx.drawK) || 1));                     // the star burns through the dark
  b.drawImage(c, 0, 0);
  if (N.flash > 0) { b.globalAlpha = Math.min(1, N.flash / 0.15); b.fillStyle = '#ffffff'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
  else if (N.soft > 0) { b.globalAlpha = 0.14 * (N.soft / 0.1); b.fillStyle = '#ffe8c0'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
}
// under everything: the void creeping in from the walls, the floor's debris spiralling into the hole; then a starfield
function supernovaGround(r, g, e) {
  const N = e.bx.nova2, b = r.b, A = e.bx.arena, vc = r.R && r.R.resolve('sn_fx/void_creep');
  if (!N || !A) return;
  const [cx, cy] = centre(e), R0 = Math.max(A.w, A.h) / 2, reach = R0 * (1 - N.creep);
  if (vc) {
    const F = Object.keys(vc.frames);
    for (let y = A.y; y < A.y + A.h; y++) for (let x = A.x; x < A.x + A.w; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > R0 || d < reach) continue;
      const k = Math.min(F.length - 1, Math.floor((d - reach) * 1.5));
      const [sx, sy] = r.proj(x + 0.5, y + 0.5); r.drawDef(vc, F[k], Math.round(sx), Math.round(sy), { center: true, scale: 1 });
    }
  }
  if (N.boom) {                                                      // a starfield where the floor was
    for (let k = 0; k < 90; k++) { const a = k * 2.399, d = (k * 37 % 100) / 100 * R0, [sx, sy] = r.proj(cx + Math.cos(a) * d, cy + Math.sin(a) * d); b.fillStyle = (k + Math.floor(g.t * 3)) % 5 ? '#c8c0ff' : '#ffffff'; b.fillRect(Math.round(sx), Math.round(sy), 1, 1); }
  }
  for (const B of N.bits) if (B.d > 0.3) {                           // debris spiralling in
    const d = r.R && r.R.resolve(B.sprite); if (!d) break;
    const a = B.a + (8 - B.d) * 0.6, [sx, sy] = r.proj(B.cx + Math.cos(a) * B.d, B.cy + Math.sin(a) * B.d);
    r.drawDef(d, Object.keys(d.frames)[0], Math.round(sx), Math.round(sy), { center: true, rot: a, scale: 0.8 });
  }
}


// ---------------------------------------------------------------- the finale: SINGULARITY, then SUPERNOVA
// ---------------------------------------------------------------- the finale: THE SINGULARITY (at 12%, 24 s)
// The Collapse ends: every shot curves into the machine, the planets shatter, and it crushes down into a singularity
// that pulls you in, harder as it goes. Everything in it obeys gravity, and each colour has one job:
//   GOLD falls in: arms of star bolts spiralling into the hole (the whole disk turns one way)
//   BLUE holds orbit: the shattered planets' debris, rings at fixed distances with openings, the inner ones faster
//   BRASS is thrown out: tidal surges, rings that burst outward with openings
// The struggle: the pull drags you in toward the burning core; you walk against it, threading the gold arms as they
// sweep round and crossing the blue rings only through their openings.
//   Accretion (1.5-8)        four double gold arms with breaks in them, swinging ahead and back; the pull starts gently
//   Tidal Debris (8-14)      the planets' debris bursts out into four orbit rings (the last on the floor's edge) that
//                            breathe in and out, neighbours out of step, so the channels between them squeeze shut in turn;
//                            three gold arms keep falling; a tidal surge every 1.6 s
//   Terminal Infall (14-20)  the rings decay inward, the pull strengthens, four double arms turning faster, a surge every 1.25 s
//   The Silence (20-24)      everything is swallowed; stillness; a white ring shrinks in; a great pressure wave
const SING = 24;
const angOff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const finale = {
  at: 0.12, dur: SING, name: 'Singularity', say: 'the machine collapses', keepShots: true, after: 3.5,
  start(g, e) {
    const [cx, cy] = centre(e), S = e.bx;
    e.x = cx; e.y = cy + e.hitUp;
    S.sing = { x: e.x, y: e.y - e.hitUp, r: 1.4, phase: 'consume', stage: 'collapse', born: g.t, arm: R() * TAU, fall: 0, surge: 1, burn: 0, pull: 0.8, bands: [] };
    S.wells = []; S.debris = []; S.meteors = []; S.umbra = null;
    for (const b of g.projectiles) if (b.bxOf === e) { b.orc = null; b.asSpiral = null; b.asOrb = null; b.toBoss = 2.6; b.life = Math.min(b.life, 3); }   // every shot curves into it
    for (const P of S.planets || []) g.vx({ k: 'burst', x: P.x, y: P.y, n: 26, colors: ['#ffd690', '#8af6ff', '#ffffff'] });   // the planets shatter
    S.planetsSaved = S.planets; S.planets = null;
    g.vx({ k: 'shake', amt: 10 });
  },
  update(g, e, dt, t) {
    const S = e.bx, Z = S.sing, p = g.player;
    tick(g, e, dt);
    const d = Math.hypot(p.x - Z.x, p.y - Z.y);
    // gold: one shot of a falling arm, born at the floor's edge, winding in (faster as it nears the hole)
    const fall = (a, shrink) => { const b = held(g, e, Z.x + Math.cos(a) * 17.5, Z.y + Math.sin(a) * 17.5, a, 'star_bolt', 130); b.asSpiral = { cx: Z.x, cy: Z.y, r: 17.5, a, w: 0.5, shrink }; return b; };   // (from beyond the floor's edge: the rim is where they arrive)
    // blue: a ring of debris that bursts out of the hole and settles into orbit at R, with openings (1.3 tiles either side)
    const band = (rad) => {
      const B = { R: rad, R0: rad, r: 0.8, a: R() * TAU, w: 2.4 * Math.sqrt(6 / rad) / rad, k: Z.bands.length, born: t }; Z.bands.push(B);   // (an orbit: the inner rings faster, 3.5 tiles/s at 4.5 out, 1.5 at the edge)
      const gaps = [R() * TAU]; gaps.push(gaps[0] + Math.PI * (0.7 + R() * 0.6)); const m = Math.round((TAU * rad) / 0.85);
      for (let j = 0; j < m; j++) {
        const off = (j / m) * TAU; if (gaps.some((q) => Math.abs(angOff(off, q)) * rad < 1.3)) continue;
        const b = held(g, e, Z.x, Z.y, off, 'moon_shard', 125);
        b.orc = (b2) => { if (B.dead) { b2.life = 0; return true; } const a = B.a + off; b2.x = Z.x + Math.cos(a) * B.r; b2.y = Z.y + Math.sin(a) * B.r; b2.a = a + Math.PI / 2; b2.life = 99; return false; };
      }
      g.vx({ k: 'burst', x: Z.x, y: Z.y, n: 18, colors: ['#8af6ff', '#ffffff'] });
    };
    for (const B of Z.bands) {                                   // the rings: out to their orbit, round, and (later) decaying in
      B.r += (B.R - B.r) * Math.min(1, dt * 2.4); B.a += B.w * dt;
      if (B.decay) { B.R = Math.max(0, B.R - B.decay * dt); const rr = Math.max(1.5, B.r); B.w = 2.4 * Math.sqrt(6 / rr) / rr; }   // (faster as they fall)
      else if (t - B.born > 1.2) B.R = B.R0 + 1.6 * Math.sin((t - B.born - 1.2) * 1.4) * (B.k % 2 ? -1 : 1) * Math.min(1, B.R0 / 6);   // they breathe, neighbours out of step: the channels between squeeze shut in turn
      if (B.decay && B.r < 1.3) B.dead = true;                  // (swallowed once it has fallen in)
    }
    Z.bands = Z.bands.filter((B) => !B.dead);
    // the pull: gentle, then stronger as the end nears; the core burns
    Z.pull = t < 8 ? 0.9 : t < 14 ? 1.2 : 1.2 + Math.min(0.7, (t - 14) * 0.15);
    if (!p.dead && d > 0.3 && t < 20) g.moveCircle(p, ((Z.x - p.x) / d) * Z.pull * dt, ((Z.y - p.y) / d) * Z.pull * dt, 0.32);
    if (!p.dead && d < Z.r && (Z.burn -= dt) <= 0) { Z.burn = 0.3; g.hurtPlayer(g.bxDmg(e, 90), 'the singularity'); }
    if (t < 1.5) return;
    const surge = (next) => {                                    // a tidal surge: brass thrown outward, three openings
      Z.surge = next; const n = 30, a0 = R() * TAU;
      for (let j = 0; j < n; j++) if (j % 10 > 2) g.bxShot(e, Z.x, Z.y, a0 + ((j + 0.5) / n) * TAU, { shot: 'brass_shard', speed: 4.2, range: 19, dmg: 125 });
    };
    const arms = (n, every, turn, shrink, pair = 0) => {         // gold arms, turning; two shots in seven missing (a break to step through); a pair: a double line
      Z.arm += turn * dt;
      if ((Z.fall -= dt) <= 0) { Z.fall = every; Z.fn = (Z.fn || 0) + 1; if (Z.fn % 7 < 2) return; for (let k = 0; k < n; k++) { fall(Z.arm + (k / n) * TAU, shrink); if (pair) fall(Z.arm + (k / n) * TAU - pair, shrink); } }
    };
    if (t < 8) {                                                 // Accretion
      if (Z.stage !== 'accretion') { Z.stage = 'accretion'; g.banner('ACCRETION', 1400); }
      if (t < 7.4) arms(4, 0.2, 0.45 * (0.4 + 1.5 * Math.cos((t - 1.5) * 1.05)), 2.2, 0.06);   // the disk surges ahead, falls back, surges again: the arms swing
    } else if (t < 14) {                                         // Tidal Debris
      if (Z.stage !== 'debris') { Z.stage = 'debris'; g.banner('TIDAL DEBRIS', 1400); }
      for (const [T, R0] of [[8, 4.5], [8.6, 8], [9.2, 11.5], [9.8, 15.3]]) if (t >= T && !Z['b' + R0]) { Z['b' + R0] = true; band(R0); }
      if (t > 9.6 && t < 13.4) arms(3, 0.22, 0.4, 2);
      if (t > 10 && t < 13.4 && (Z.surge -= dt) <= 0) surge(1.6);
    } else if (t < 20) {                                         // Terminal Infall
      if (Z.stage !== 'infall') { Z.stage = 'infall'; g.banner('TERMINAL INFALL', 1400); for (const B of Z.bands) B.decay = 0.55; }
      if (t < 19.4) arms(4, 0.17, 0.65, 2.6, 0.06);
      if (t > 14.6 && t < 19.2 && (Z.surge -= dt) <= 0) surge(1.25);
    } else {                                                     // The Silence, then the pressure wave
      if (Z.stage !== 'silence') { Z.stage = 'silence'; for (const b of g.projectiles) if (b.asSpiral && b.bxOf === e) b.asSpiral.shrink = 9; for (const B of Z.bands) B.decay = 6; g.vx({ k: 'shake', amt: 4 }); }
      Z.warn = t >= 21 && t < 23.3 ? 14 - ((t - 21) / 2.3) * 12 : 0;   // a white ring shrinking in: the wave is coming
      if (t >= 23.3 && !Z.waved) {
        Z.waved = true; const o = R() * TAU;
        [[5, 'corona_flare', 0], [4.3, 'eclipse_ring', 0.18], [3.6, 'corona_flare', 0.36], [3, 'eclipse_ring', 0.54]].forEach(([sp, shot, dl], ring) => g.fvLater(dl, () => {
          if (!e.bx) return; const n = 48;
          for (let j = 0; j < n; j++) { const a = (j / n) * TAU; if ([0, 1, 2, 3].some((q) => { const c = o + ring * 0.09 + q * Math.PI / 2; return Math.abs(angOff(a, c)) < 0.21; })) continue; g.bxShot(e, Z.x, Z.y, a, { shot, speed: sp, range: 20, dmg: 135 }); }
        }));
        g.vx({ k: 'shake', amt: 14 }); g.vx({ k: 'burst', x: Z.x, y: Z.y, n: 60, colors: ['#ffffff', '#c8a0ff', '#ffd690'] });
      }
    }
  },
  end(g, e) { const S = e.bx; S.sing = null; S.planets = S.planetsSaved || S.planets; S.tempoK = 0.72; },   // then a short, fast last stand to 4%
};

export default {
  id: 'grand_orrery', name: 'The Grand Orrery', biome: 'dungeon', hp: 520000, def: 30, xp: 17000, r: 2.2, speed: 1.2, keep: 8, faces: false, spawnCentre: true,
  tempo: 0.68, dmgScale: 1.6, finale, morphSpeed: 0.4, morphGrace: 6.5,
  scaleFor: (g, e) => (e.bx.sing ? 1.1 : e.bx.phase >= 3 ? 1.75 : 1),   // swollen in its Collapse; crushed small as a singularity            // in its Collapse the machine swells to nearly twice its size
  finale2,
  // its death: the clip at less than half speed, then it hangs on its last frame, shaking, and bursts in rings of light
  death: { speed: 0.4, hold: 3.2, burst(g, e) {
    const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
    const ring = (n, shot, speed, off) => { for (let k = 0; k < n; k++) g.bxShot(e, ox, oy, a0 + off + (k / n) * TAU, { shot, speed, range: 22, dmg: 1 }).harmless = true; };
    ring(40, 'corona_flare', 6.5, 0);
    g.fvLater(0.25, () => ring(28, 'eclipse_ring', 4.8, Math.PI / 28));
    g.fvLater(0.5, () => ring(52, 'star_bolt', 9, 0));
    g.fvLater(0.8, () => ring(20, 'moon_shard', 3.6, Math.PI / 20));
    g.vx({ k: 'burst', x: ox, y: oy, n: 90, colors: ['#ffffff', '#ffd690', '#ff8a1f', '#c8a0ff', '#ff4af0'] }); g.vx({ k: 'shake', amt: 14 });
  } },
  // one attack at a time; each recover covers its whole formation (so they flow into each other, never pile up)
  phases: {
    1: { move: 'glide', patterns: [                          // four long sequences, each one evolving formation
      { name: 'clockwork overture', windup: 0.6, recover: 8.6, special: 'overture', dmg: 125 },
      { name: 'the alignment', windup: 0.7, recover: 8.8, special: 'alignmentSweep', dmg: 120 },
      { name: 'starfall procession', windup: 0.5, recover: 7.4, special: 'procession', dmg: 125 },
      { name: 'grand rotation', windup: 0.7, recover: 8, special: 'rotation', dmg: 125, move: 'hold' },
    ] },
    2: { move: 'stations', patterns: [                        // three, the eclipse carried through each
      { name: 'eclipse rising', windup: 0.6, recover: 9.6, special: 'eclipseRising', dmg: 125 },
      { name: 'syzygy', windup: 0.7, recover: 8.2, special: 'syzygyLine', dmg: 125, move: 'hold' },
      { name: 'twilight to totality', windup: 0.6, recover: 9.6, special: 'twilightTotality', dmg: 125 },
    ] },
    3: { move: 'center', patterns: [                          // three, each bringing the danger to the whole floor
      { name: 'binary collapse', windup: 0.6, recover: 12, special: 'binaryCollapse', dmg: 125 },
      { name: 'tidal curtains', windup: 0.6, recover: 14.5, special: 'tidalCurtains', dmg: 125 },
      { name: 'decaying orbits', windup: 0.7, recover: 14, special: 'decayingOrbits', dmg: 130 },
    ] },
  },
  specials: { later: (g, e, V) => V.fn(g, e), overture, alignmentSweep, procession, rotation, eclipseRising, syzygyLine, twilightTotality, binaryCollapse, tidalCurtains, decayingOrbits, meteors, well, debris },
  moves: {
    glide(g, e, dt) {                                        // phase 1: a slow, smooth circle round the middle of its floor
      const S = e.bx, [cx, cy] = centre(e);
      if (S.anchor) return;
      S.ga = (S.ga === undefined ? 0 : S.ga) + dt * 0.28;
      const tx = cx + Math.cos(S.ga) * 3, ty = cy + 2 + Math.sin(S.ga) * 2.2, d = Math.hypot(tx - e.x, ty - e.y);
      if (d > 0.05) g.moveCircle(e, ((tx - e.x) / d) * Math.min(d, 1.4 * dt), ((ty - e.y) / d) * Math.min(d, 1.4 * dt), 0.8);
    },
    stations(g, e, dt) {                                     // between volleys it glides from one station to the next round its floor
      const S = e.bx, [cx, cy] = centre(e);
      if (!S.station || Math.hypot(S.station[0] - e.x, S.station[1] - e.y) < 0.4) {
        const a = R() * TAU, d = 2 + R() * 4; S.station = [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
      }
      const [tx, ty] = S.station, dd = Math.hypot(tx - e.x, ty - e.y), sp = (e.D.speed || 1.2) * dt;
      g.moveCircle(e, ((tx - e.x) / dd) * Math.min(dd, sp), ((ty - e.y) / dd) * Math.min(dd, sp), 0.8);
    },
  },
  onWake(g, e) {
    const [cx, cy] = centre(e);
    e.bx.planets = [{ a: 0, w: 0.9, r: 6, x: cx, y: cy }, { a: Math.PI, w: -0.7, r: 7.5, x: cx, y: cy }];
    e.bx.planets.forEach((P) => { P.x = cx; P.y = cy; });
  },
  update(g, e, dt) { tick(g, e, dt); },
  onPhase(g, e, ph) {
    for (const b of g.projectiles) if (b.asOrb) b.asOrb = null;
    const S = e.bx; S.anchor = false; S.draw = null; S.umbraDim = false; planetsHome(S);
    if (ph === 2) finaleAligned(g, e);                        // the planets align, a gold beam, a great ring: the eclipse is coming
    if (ph === 3) finaleEclipse(g, e);                        // the eclipse swallows it, the planets spin wild, a shockwave
    if (ph === 3 && !e.bx.grown) { e.bx.grown = true; e.D = { ...e.D, r: e.D.r * 1.6 }; e.hitUp *= 1.75; }   // bigger body, bigger target
  },
  onDeath(g, e) { const S = e.bx; if (S.alt) S.alt.anim.play('p4_death', { speed: 0.4 }); S.umbra = null; S.wells = []; S.debris = []; S.meteors = []; S.planets = null; S.sing = null; },
  // under the bullets: the black holes, the meteors' rune circles, the debris shadows
  drawGround(r, g, e) {
    const S = e.bx, b = r.b;
    for (const W of S.wells || []) {                           // the small singularities: their own sprite, a faint ring where their pull reaches
      const [x, y] = r.proj(W.x, W.y);
      b.globalAlpha = 0.18; b.strokeStyle = '#c8a0ff'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 3.5 * 16, 3.5 * 12, 0, 0, TAU); b.stroke(); b.globalAlpha = 1;
      const Sd = W.seed && r.R && r.R.resolve('sn_shots/singularity_seed');
      if (Sd) r.drawDef(Sd, Object.keys(Sd.frames)[Math.floor(g.t * 8) % Object.keys(Sd.frames).length], Math.round(x), Math.round(y), { center: true, scale: 1.6 });
      else r.singularity(g, W.x, W.y, 1, 2.4, W.born, W.until);
    }
    const Rc = r.R && r.R.resolve('ex_decor/astral_rune_circle'), Md = r.R && r.R.resolve('ap_shots/grand_orrery.meteor');
    for (const M of S.meteors || []) {
      const [x, y] = r.proj(M.x, M.y), k = Math.max(0, Math.min(1, (g.t - M.born) / (M.at - M.born)));
      if (Rc) r.drawDef(Rc, Object.keys(Rc.frames)[Math.floor(g.t * 8) % Object.keys(Rc.frames).length], Math.round(x), Math.round(y), { center: true, alpha: 0.5 + 0.5 * k, scale: 1 + 0.4 * k });
      b.globalAlpha = 0.25 + 0.35 * k; b.fillStyle = '#ff4a5a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 16 * k, 12 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
      if (Md) r.drawDef(Md, Object.keys(Md.frames)[Math.floor(g.t * 10) % 2], Math.round(x + (1 - k) * 60), Math.round(y - (1 - k) * 140), { center: true, scale: 2, rot: Math.atan2(140, -60) });   // falling in from the sky
    }
    for (const D of S.debris || []) {                          // where the brass will land: a red circle that fills as it comes
      const [x, y] = r.proj(D.x, D.y), k = Math.max(0, Math.min(1, (g.t - (D.born || D.at - 1)) / Math.max(0.1, D.at - (D.born || D.at - 1)))), R0 = 0.9 * 16;
      b.globalAlpha = 0.15 + 0.3 * k; b.fillStyle = '#ff2a3a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), R0 * k, R0 * 0.75 * k, 0, 0, TAU); b.fill();
      b.globalAlpha = 0.9; b.fillStyle = Math.floor(g.t * 10) % 2 ? '#ffffff' : '#ff4a5a';
      for (let j = 0; j < 14; j++) { const a = (j / 14) * TAU; b.fillRect(Math.round(x + Math.cos(a) * R0) - 1, Math.round(y + Math.sin(a) * R0 * 0.75) - 1, 2, 2); }
      b.globalAlpha = 1;
    }
    if (S.sing) { const Z = S.sing; if (Z.phase === 'consume') r.singularity(g, Z.x, Z.y, 1, 1 + Z.r * 1.5, Z.born || 0);
      for (const B of Z.bands || []) { const [x, y] = r.proj(Z.x, Z.y); b.globalAlpha = 0.18; b.strokeStyle = '#8af6ff'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), B.r * 16, B.r * 12, 0, 0, TAU); b.stroke(); b.globalAlpha = 1; }   // the debris rings' orbits, faint
      if (Z.warn > 0) { const [x, y] = r.proj(Z.x, Z.y); b.globalAlpha = 0.85; b.strokeStyle = '#ffffff'; b.lineWidth = 2; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), Z.warn * 16, Z.warn * 12, 0, 0, TAU); b.stroke(); b.lineWidth = 1; b.globalAlpha = 1; } }   // the big singularity: its own sprite, growing
    if (S.nova2) supernovaGround(r, g, e);                      // the second survival: the floor goes dark round the burning star
  },
  // over everything: the umbra blacks out its part of the floor, shots and all; its rim burns. The planets. The singularity's collapse and nova.
  drawTop(r, g, e) {
    const S = e.bx, U = S.umbra, b = r.b, Pd = r.R && r.R.resolve(SHOT('moon_shard'));
    if (Pd && S.state !== 'death') for (const P of S.planets || []) {   // the planets: big moons with a faint glow
      const [x, y] = r.proj(P.x, P.y);
      b.globalAlpha = 0.25; b.fillStyle = '#ffd690'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 9, 0, TAU); b.fill(); b.globalAlpha = 1;
      r.drawDef(Pd, Object.keys(Pd.frames)[0], Math.round(x), Math.round(y), { center: true, rot: g.t * 1.5, scale: 2.6 });
    }
    if (U) {
      const [x, y] = r.proj(U.x, U.y), R0 = U.r * 16, pulse = Math.sin(g.t * 3) * 1.5, rising = U.path && U.path.t < 0;
      b.globalAlpha = rising || S.umbraDim ? 0.4 : 0.7; b.fillStyle = '#04030a';                  // dark, but the shots inside still show through b.beginPath(); b.arc(Math.round(x), Math.round(y), R0, 0, TAU); b.fill();
      b.globalAlpha = 0.3; b.strokeStyle = '#ffb040'; b.lineWidth = 6; b.beginPath(); b.arc(Math.round(x), Math.round(y), R0 + 3 + pulse, 0, TAU); b.stroke();   // the corona
      b.globalAlpha = 0.95; b.strokeStyle = '#ffd690'; b.lineWidth = 2; b.beginPath(); b.arc(Math.round(x), Math.round(y), R0, 0, TAU); b.stroke(); b.lineWidth = 1;
      for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU + g.t * 0.6, w = (k + Math.floor(g.t * 8)) % 4 === 0 ? 3 : 2, out = 1 + ((k * 7 + Math.floor(g.t * 10)) % 5); b.fillStyle = k % 3 ? '#ffd690' : '#ffffff'; b.fillRect(Math.round(x + Math.cos(a) * (R0 + out)) - 1, Math.round(y + Math.sin(a) * (R0 + out)) - 1, w, w); }
      b.globalAlpha = 1;
    }
    const Z = S.sing;
    if (Z && Z.phase === 'collapse') {                         // the core gathers into a blinding point
      const [x, y] = r.proj(Z.x, Z.y), k = Math.floor(g.t * 16) % 2;
      b.globalAlpha = 0.9; b.fillStyle = k ? '#ffffff' : '#ffd690'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 3 + Z.r * 8, 0, TAU); b.fill();
      b.globalAlpha = 0.25; b.fillStyle = '#ffffff'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 22 + Math.sin(g.t * 30) * 4, 0, TAU); b.fill(); b.globalAlpha = 1;
    } else if (Z && Z.phase === 'nova') {                      // the remnant: a white star, flaring
      const [x, y] = r.proj(Z.x, Z.y);
      b.globalAlpha = 0.35; b.fillStyle = '#ffd690'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 14 + Math.sin(g.t * 12) * 3, 0, TAU); b.fill();
      b.globalAlpha = 1; b.fillStyle = '#ffffff'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 6, 0, TAU); b.fill();
    }
    if (S.nova2) supernovaDark(r, g, e);                       // the Supernova's dark, over everything
  },
  loot: [{ id: 'starforged_katana', p: 0.1 }, { id: 'comet_bow', p: 0.1 }, { id: 'nebula_robe', p: 0.1 }, { id: 'astral_signet', p: 0.1 }, { id: 'orrery_orb', p: 0.1 },
    { id: 'event_horizon', p: 0.02 }, { id: 'key_astral', p: 0.06 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }],
  lootLuck: 2,
};

// a black hole, drawn as one: a black core, a photon ring that breathes, a tilted accretion disk whose matter runs
// faster the closer in it is (the far side behind the core, the near side in front of it), and matter falling in
export function blackHole(r, g, wx, wy, fade, size) {
  const b = r.b, [x0, y0] = r.proj(wx, wy), x = Math.round(x0), y = Math.round(y0), K = 16 * size, t = g.t;
  const disk = (front) => {
    for (let j = 0; j < 42; j++) {
      const ring = 1.25 + (j % 6) * 0.22, a = (j * 2.39996) + t * (2.6 / ring), sa = Math.sin(a);
      if ((sa > 0) !== front) continue;
      const px = x + Math.cos(a) * K * ring * 1.25, py = y + sa * K * ring * 0.36;
      b.globalAlpha = fade * (0.55 + 0.45 * Math.sin(t * 5 + j)); b.fillStyle = ring < 1.5 ? '#ffffff' : ring < 1.9 ? '#ffd690' : j % 2 ? '#ff8a1f' : '#c8a0ff';
      b.fillRect(Math.round(px) - 1, Math.round(py), ring < 1.6 ? 3 : 2, 1);
    }
  };
  b.globalAlpha = 0.55 * fade; b.fillStyle = '#12081e'; b.beginPath(); b.ellipse(x, y, K * 2.2, K * 1.7, 0, 0, TAU); b.fill();   // the dark it bends round itself
  b.globalAlpha = 0.3 * fade; b.fillStyle = '#5a2a8a'; b.beginPath(); b.ellipse(x, y, K * 3.1, K * 1.3, 0, 0, TAU); b.fill();   // the glow of the disk
  const band = (front) => {                                     // the disk itself: hot bands, the far half behind the core, the near half in front
    for (const [s, col, w] of [[2.35, '#ff8a1f', 4], [1.85, '#ffd690', 3], [1.45, '#ffffff', 2]]) {
      b.globalAlpha = fade * (0.75 + 0.25 * Math.sin(t * 6 + s * 3)); b.strokeStyle = col; b.lineWidth = w;
      b.beginPath(); b.ellipse(x, y, K * s * 1.1, K * s * 0.36, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); b.stroke();
    }
    b.lineWidth = 1;
  };
  band(false); disk(false);
  const breathe = 1 + Math.sin(t * 4) * 0.06;
  b.globalAlpha = 0.9 * fade; b.strokeStyle = '#ffd690'; b.lineWidth = 2; b.beginPath(); b.arc(x, y, K * 1.08 * breathe, 0, TAU); b.stroke(); b.lineWidth = 1;   // the photon ring
  b.globalAlpha = fade; b.fillStyle = '#000000'; b.beginPath(); b.arc(x, y, K * breathe, 0, TAU); b.fill();
  b.globalAlpha = 0.5 * fade; b.strokeStyle = '#ffffff'; b.beginPath(); b.arc(x, y, K * 1.16 * breathe, Math.PI * 1.1, Math.PI * 1.9); b.stroke();   // the lensed far side, bent over the top
  band(true); disk(true);
  for (let j = 0; j < 8; j++) {                                 // matter falling in
    const k = ((t * 0.7 + j / 8) % 1), a = j * 0.79 + k * 2.4, d = K * (3.2 - k * 2.2);
    b.globalAlpha = fade * k; b.fillStyle = j % 2 ? '#c8a0ff' : '#ffd690';
    b.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.5), 1, 1);
  }
  b.globalAlpha = 1;
}
