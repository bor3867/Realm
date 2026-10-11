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
// an eclipse transit: the path is marked across the floor (through `through`, or near the middle), then the umbra
// slides along it from beyond one rim to beyond the other
function transit(g, e, through) {
  const S = e.bx, [cx, cy] = centre(e), U0 = UMBRA[S.phase] || UMBRA[3], a = R() * TAU;
  const [px, py] = through || [cx + (R() - 0.5) * 6, cy + (R() - 0.5) * 6], L = 15;
  const x0 = px - Math.cos(a) * L, y0 = py - Math.sin(a) * L, x1 = px + Math.cos(a) * L, y1 = py + Math.sin(a) * L;
  S.umbra = { x: x0, y: y0, r: U0.r, path: { x0, y0, x1, y1, t: -1.2, T: U0.T } };
  g.spMark({ kind: 'line', x: x0, y: y0, a, len: 2 * L, life: 1.2, color: '#ffb040' });
  return S.umbra;
}
// the umbra turns: from where it is, through (x, y), on to beyond the rim, quickly (marked first)
function redirect(g, e, x, y, speed = 4) {
  const U = e.bx.umbra;
  if (!U) { transit(g, e, [x, y]); return; }
  const a = angleTo(U.x, U.y, x, y), L = Math.hypot(x - U.x, y - U.y) + 15;
  U.path = { x0: U.x, y0: U.y, x1: U.x + Math.cos(a) * L, y1: U.y + Math.sin(a) * L, t: -0.6, T: L / speed };
  U.lunge = true;
  g.spMark({ kind: 'line', x: U.x, y: U.y, a, len: L, life: 0.6, color: '#c8a0ff' });
}

// ---------------------------------------------------------------- phase 1: Aligned
// meridian: three aimed fans in quick succession, the middle one threaded between the others
function meridian(g, e, V) {
  [[0, 5, 0.62], [0.22, 4, 0.46], [0.44, 5, 0.62]].forEach(([t, count, spread]) => e.bx.vol.push({ t, V: { form: 'fan', shot: 'moon_shard', count, spread, speed: 7.5, range: 15, dmg: V.dmg || 120 } }));
}
// precession: three rings, each turned half a step from the last
function precession(g, e, V) {
  const a0 = R() * TAU, n = 20;
  [0, 0.4, 0.8].forEach((t, k) => e.bx.vol.push({ t, V: { form: 'ring', shot: 'eclipse_ring', count: n, spiralAt: a0 + (k % 2) * (Math.PI / n), speed: 4.6, range: 18, dmg: V.dmg || 120 } }));
}
// armillary: a four-arm spiral from the machine, turning
function armillary(g, e, V) { g.bxVolley(e, { form: 'spiral', shot: 'star_bolt', arms: V.arms || 4, dur: V.dur || 2.2, every: 0.11, turn: V.turn || 0.17, speed: 5.5, range: 16, dmg: V.dmg || 115 }); }
// orbits: three rings wheeling round it, each its own way, each with two gaps; after a while they fly off on tangents
function orbits(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), fast = V.fast || 1;
  [[3, 'moon_shard', 10, 1.1], [5, 'star_bolt', 14, -0.8], [7, 'moon_shard', 18, 0.6]].forEach(([r, shot, n, w], ring) => {
    const gap = Math.floor(R() * n);
    for (let k = 0; k < n; k++) {
      if (k === gap || k === (gap + 1) % n) continue;
      const a = (k / n) * TAU;
      const b = g.bxShot(e, ox + Math.cos(a) * r, oy + Math.sin(a) * r, a, { shot, speed: 0.01, range: 99, dmg: V.dmg || 120 });
      b.asOrb = { cx: ox, cy: oy, r, a, w: w * fast, t: 3, ring };
    }
  });
}
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
// planets: two planets wheel round the machine, opposite ways; each throws three bolts at you as it passes
function planetVolley(g, e, V) {
  const p = g.player;
  for (const P of e.bx.planets || []) {
    const a = angleTo(P.x, P.y, p.x, p.y);
    for (const off of [-0.16, 0, 0.16]) g.bxShot(e, P.x, P.y, a + off, { shot: 'star_bolt', speed: 7, range: 16, dmg: V.dmg || 115 });
  }
}
// ---------------------------------------------------------------- the eclipse, all fight long
// corona flares: from the rim of the umbra, not from the machine
function flares(g, e, V) {
  const U = e.bx.umbra;
  if (!U) return;
  const n = V.n || 8, a0 = R() * TAU;
  for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU; g.bxShot(e, U.x + Math.cos(a) * U.r, U.y + Math.sin(a) * U.r, a, { shot: 'corona_flare', speed: 5.5, range: 10, dmg: V.dmg || 120 }); }
}
// corona burst (P2): two rings from the umbra's rim, the second between the first
function coronaBurst(g, e, V) {
  const U = e.bx.umbra;
  if (!U) { transit(g, e); g.fvLater(2, () => { if (e.bx.umbra) coronaBurst(g, e, V); }); return; }   // none up: one rises, then bursts
  const a0 = R() * TAU, n = 22;
  [0, 0.35, 0.7].forEach((t, j) => g.fvLater(t, () => {
    if (!e.bx.umbra || e.dead) return;
    for (let k = 0; k < n; k++) { const a = a0 + ((k + (j % 2) * 0.5) / n) * TAU; g.bxShot(e, U.x + Math.cos(a) * U.r, U.y + Math.sin(a) * U.r, a, { shot: 'corona_flare', speed: 4.6, range: 14, dmg: V.dmg || 125 }); }
  }));
}
// umbral lunge (P2): the eclipse turns and runs through where you stand (or, if none is up, one rises on that line)
function lunge(g, e) {
  const p = g.player;
  redirect(g, e, p.x, p.y, 4.5);
  g.spMark({ kind: 'circle', x: p.x, y: p.y, r: (e.bx.umbra && e.bx.umbra.r) || 4, life: 0.8, color: '#c8a0ff' });
}
// eclipse rings: two expanding rings, the second's gaps between the first's
function eclipseRings(g, e, V) {
  const n = 24, g0 = Math.floor(R() * n), gaps = (off) => new Set([0, 1, 8, 9, 16, 17].map((q) => (g0 + q + off) % n));
  [[0, 0], [0.5, 4], [1, 0]].forEach(([t, off]) => e.bx.vol.push({ t, V: { form: 'special', name: 'ringOf', skip: gaps(off), n, dmg: V.dmg || 125 } }));
}
function ringOf(g, e, V) {
  const [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < V.n; k++) if (!V.skip.has(k)) g.bxShot(e, ox, oy, (k / V.n) * TAU, { shot: 'eclipse_ring', speed: 4, range: 18, dmg: V.dmg });
}
// syzygy (P2): the umbra slides onto the line between the machine and you, then a dense stream fires down that line
function syzygy(g, e, V) {
  const S = e.bx, p = g.player, [ox, oy] = g.bxOrigin(e);
  if (S.umbra) redirect(g, e, (ox + p.x) / 2, (oy + p.y) / 2, 6);
  const a = angleTo(ox, oy, p.x, p.y);
  g.spMark({ kind: 'line', x: ox, y: oy, a, len: 16, life: 0.45, color: '#ffd690' });
  for (let k = 0; k < 14; k++) S.vol.push({ t: 0.45 + k * 0.06, V: { form: 'fan', shot: 'eclipse_ring', count: 3, spread: 0.3, angle: a + Math.sin(k * 0.9) * 0.08, speed: 9.5, range: 20, dmg: V.dmg || 125 } });
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
// accretion: a disk of shots round each black hole, winding in until it is swallowed
function accretion(g, e, V) {
  const S = e.bx;
  if (!(S.wells || []).length) well(g, e);
  for (const W of S.wells || []) for (const [r, n, w] of [[4.2, 16, 1.1], [2.8, 11, -1.5]]) {
    const a0 = R() * TAU;
    for (let k = 0; k < n; k++) { const a = a0 + (k / n) * TAU, b = g.bxShot(e, W.x + Math.cos(a) * r, W.y + Math.sin(a) * r, a, { shot: k % 2 ? 'star_bolt' : 'brass_shard', speed: 0.01, range: 99, dmg: V.dmg || 120 }); b.asSpiral = { cx: W.x, cy: W.y, r, a, w, shrink: 0.75, W }; }
  }
}
// spaghettification: rings whose shots bend toward the nearest black hole
function spaghetti(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
  for (let k = 0; k < 24; k++) { const b = g.bxShot(e, ox, oy, a0 + (k / 24) * TAU, { shot: 'star_bolt', speed: 4.6, range: 20, dmg: V.dmg || 125 }); b.toWell = 2.2; b.life = 4.5; }
}
// infall: matter streams in from the rim of the floor toward the black holes
function infall(g, e, V) {
  const S = e.bx, [cx, cy] = centre(e), a0 = R() * TAU;
  if (!(S.wells || []).length) return;
  for (let k = 0; k < 12; k++) {
    const a = a0 + (k / 12) * TAU, x = cx + Math.cos(a) * 15, y = cy + Math.sin(a) * 15;
    let W = S.wells[0];
    for (const q of S.wells) if (Math.hypot(q.x - x, q.y - y) < Math.hypot(W.x - x, W.y - y)) W = q;
    for (let j = 0; j < 3; j++) S.vol.push({ t: j * 0.18, V: { form: 'special', name: 'infallShot', x, y, W, dmg: V.dmg || 115 } });
  }
}
function infallShot(g, e, V) { const b = g.bxShot(e, V.x, V.y, angleTo(V.x, V.y, V.W.x, V.W.y), { shot: 'brass_shard', speed: 5, range: 18, dmg: V.dmg }); b.intoWell = V.W; }
// debris: shadows grow under where the shards will land, then they land and skitter outward
function debris(g, e) {
  const p = g.player, S = e.bx;
  S.debris = S.debris || [];
  for (let k = 0; k < 6; k++) { const a = R() * TAU, d = k ? 1.2 + R() * 3.4 : 0; S.debris.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, at: g.t + 1, born: g.t }); }
  g.vx({ k: 'shake', amt: 4 });
}

// ---------------------------------------------------------------- what runs every frame, in the fight and in the finale
function tick(g, e, dt) {
  const S = e.bx, p = g.player, [cx, cy] = centre(e);
  if (S.planets) {                                           // the planets wheel round the machine
    const [ox, oy] = g.bxOrigin(e);
    for (const P of S.planets) { P.a += P.w * dt; P.x = ox + Math.cos(P.a) * P.r; P.y = oy + Math.sin(P.a) * P.r * 0.85; }
  }
  if (!S.umbra && !S.sing && !S.nova2 && S.transitT !== undefined && (S.transitT -= dt) <= 0) transit(g, e);   // the next eclipse
  const U = S.umbra;
  if (U) {                                                   // the eclipse crosses on its path; burns whoever is in it
    if (S.sing) {                                            // the finale: the singularity swallows it
      U.x += (S.sing.x - U.x) * Math.min(1, dt * 1.5); U.y += (S.sing.y - U.y) * Math.min(1, dt * 1.5); U.r = Math.max(0, U.r - dt * 2.2);
      if (U.r <= 0.1) S.umbra = null;
    } else if (U.path) {
      const P = U.path; P.t += dt;
      const k = Math.max(0, Math.min(1, P.t / P.T));
      U.x = P.x0 + (P.x1 - P.x0) * k; U.y = P.y0 + (P.y1 - P.y0) * k;
      if (k >= 1) { S.umbra = null; S.transitT = (UMBRA[S.phase] || UMBRA[3]).every; }
    }
    const live = S.umbra && (!U.path || U.path.t >= 0) && !S.sing;
    if (live && !p.dead && Math.hypot(p.x - U.x, p.y - U.y) < U.r * 0.92 && (S.umbraT = (S.umbraT || 0) - dt) <= 0) { S.umbraT = 0.4; g.hurtPlayer(g.bxDmg(e, 70), 'the eclipse'); }
  }
  for (const b of g.projectiles) {
    if (b.bxOf !== e) continue;
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
      if (P.r <= 0.35) b.life = 0;
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
    W.x += (W.vx || 0) * dt; W.y += (W.vy || 0) * dt;
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
      const a0 = R() * TAU;
      for (let k = 0; k < 6; k++) g.bxShot(e, M.x, M.y, a0 + (k / 6) * TAU, { shot: 'brass_shard', speed: 4.8, range: 4, dmg: 110 });
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
const EH = 3, NOVA_DUR = 30;
const CYCLE = [['storm', 4], ['planets', 3], ['comets', 3], ['gamma', 3]];
const finale2 = {
  at: 0.04, dur: NOVA_DUR, name: 'Supernova', say: 'the event horizon',
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
    N.flash = Math.max(0, N.flash - dt);
    if ((N.patT -= dt) <= 0) {                                    // the next of the four
      if (N.pat >= 0 && N.pat % 4 === 3) shockArc(g, e);          // every cycle ends with a shock ring
      N.pat++; const [kind, len] = CYCLE[N.pat % 4]; N.kind = kind; N.patT = len; N.sub = 0; N.sub2 = 0;
      if (kind === 'storm') N.dir = -N.dir;
      if (kind === 'gamma') gammaStart(g, e);
    }
    if (N.kind === 'storm') {
      if ((N.sub -= dt) <= 0) { N.sub = 1 / 6; N.a += (11 * Math.PI / 180) * N.dir; for (let k = 0; k < 4; k++) g.bxShot(e, ox, oy, N.a + (k / 4) * TAU, { sprite: SN('nova_spiral'), speed: 5, range: 18, dmg: 120 }); }
      if ((N.sub2 -= dt) <= 0) { N.sub2 = 0.8; const a0 = R() * TAU; for (let k = 0; k < 8; k++) g.bxShot(e, ox, oy, a0 + (k / 8) * TAU, { sprite: SN('helix_pair'), speed: 4, range: 18, dmg: 120, mv: { wave: { amp: 0.5, freq: 7 } } }); }
    } else if (N.kind === 'planets') {
      if ((N.sub -= dt) <= 0) {
        N.sub = 0.6; N.chunk = (N.chunk + 1) % 3;
        const kind = ['planet_chunk_ice', 'planet_chunk_rock', 'planet_chunk_violet'][N.chunk], a0 = R() * TAU;
        for (let k = 0; k < 10; k++) { const b = g.bxShot(e, ox, oy, a0 + (k / 10) * TAU, { sprite: SN(kind), speed: N.chunk === 1 ? 4.5 : 6, range: 30, dmg: N.chunk === 1 ? 150 : 120, size: N.chunk === 1 ? 0.55 : 0.45 }); b.snHang = { slow: 0.9, hang: 0.5, split: N.chunk === 2 }; }
      }
    } else if (N.kind === 'comets') {
      if (N.sub === 0) { N.sub = 99; const a0 = R() * TAU; for (let k = 0; k < 6; k++) { const b = g.bxShot(e, ox, oy, a0 + (k / 6) * TAU, { sprite: SN('plasma_comet'), speed: 4.5, range: 20, dmg: 140, size: 0.55, mv: { curve: 1.05 } }); b.snEmber = 0.2; } }
      if ((N.sub2 -= dt) <= 0) { N.sub2 = 1.1; const a0 = R() * TAU; for (let k = 0; k < 24; k++) g.bxShot(e, ox, oy, a0 + (k / 24) * TAU, { sprite: SN('stellar_ember'), speed: 3.2, range: 16, dmg: 100, size: 0.35 }); }
    } else if (N.kind === 'gamma') gammaTick(g, e, dt, ox, oy);
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
  x.fillStyle = `rgba(2,1,6,${0.82 * N.dark})`; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const hole = (cx, cy, R0) => { const gr = x.createRadialGradient(cx, cy, R0 * 0.35, cx, cy, R0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, R0, 0, TAU); x.fill(); };
  hole(px, py, 3.6 * 16);                                           // your light, fading at its edge
  hole(bx, by, 2.4 * 16 * ((e.bx.drawK) || 1));                     // the star burns through the dark
  b.drawImage(c, 0, 0);
  if (N.flash > 0) { b.globalAlpha = Math.min(1, N.flash / 0.15); b.fillStyle = '#ffffff'; b.fillRect(0, 0, W, H); b.globalAlpha = 1; }
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
const CONSUME = 20, COLLAPSE = 22.5, DUR = 36;
const finale = {
  at: 0.12, dur: DUR, name: 'Singularity', say: 'it swallows everything',
  start(g, e) {
    const [cx, cy] = centre(e), S = e.bx;
    e.x = cx; e.y = cy + e.hitUp;                                 // it takes the middle of its floor: everything comes from it
    S.sing = { x: e.x, y: e.y - e.hitUp, r: 1.2, phase: 'consume', arm: 0, debris: 2, small: 6, nova: 0, wave: 0, burn: 0, spin: 0, born: g.t, pulse: 3, rim: 4.5 };
    S.wells = []; S.debris = []; S.meteors = [];
    g.vx({ k: 'shake', amt: 8 });
  },
  update(g, e, dt, t) {
    const S = e.bx, Z = S.sing, p = g.player;
    tick(g, e, dt);
    const d = Math.hypot(p.x - Z.x, p.y - Z.y);
    if (t < CONSUME) {                                       // it swallows: matter spirals in on arms that wind tighter, and it pulls you
      Z.r = 1.2 + (t / CONSUME) * 2.4;
      if ((Z.small -= dt) <= 0) { Z.small = 5.5; well(g, e, { n: t > 10 ? 3 : 2, max: 3, life: 6 }); }   // small singularities break off it
      if (!p.dead && d > 0.2) g.moveCircle(p, ((Z.x - p.x) / d) * 1.7 * dt, ((Z.y - p.y) / d) * 1.7 * dt, 0.32);
      if ((Z.arm -= dt) <= 0) {
        Z.arm = 0.2; Z.armN = (Z.armN || 0) + 1;
        const turn = t * 0.35;
        // every strand has openings: two shots left out of every eight, at a different place on each arm
        for (let k = 0; k < 3; k++) { if ((Z.armN + k * 3) % 10 >= 8) continue; const a = turn + (k / 3) * TAU, b = g.bxShot(e, Z.x + Math.cos(a) * 15, Z.y + Math.sin(a) * 15, a, { shot: k % 2 ? 'brass_shard' : 'star_bolt', speed: 0.01, range: 99, dmg: 120 }); b.asSpiral = { cx: Z.x, cy: Z.y, r: 15, a, w: 0.55, shrink: 2.4 }; }
        if (t > 6) for (let k = 0; k < 2; k++) { if ((Z.armN + k * 4) % 9 >= 7) continue; const a = -turn * 1.3 + (k / 2) * TAU + 0.7, b = g.bxShot(e, Z.x + Math.cos(a) * 15, Z.y + Math.sin(a) * 15, a, { shot: 'moon_shard', speed: 0.01, range: 99, dmg: 120 }); b.asSpiral = { cx: Z.x, cy: Z.y, r: 15, a, w: -0.45, shrink: 2.1 }; }
      }
      if ((Z.debris -= dt) <= 0) { Z.debris = 2.6; debris(g, e); }
      if (t > 3 && (Z.pulse -= dt) <= 0) {                       // tidal pulse: a ring thrown out of the hole, one narrow opening at you
        Z.pulse = 3.2; const n = 22, aim = angleTo(Z.x, Z.y, p.x, p.y), a0 = aim + Math.PI / n;
        for (let k = 1; k < n - 1; k++) g.bxShot(e, Z.x, Z.y, a0 + (k / n) * TAU, { shot: 'brass_shard', speed: 4.2, range: 16, dmg: 120 });
      }
      if (t > 8 && (Z.rim -= dt) <= 0) {                         // crossfire: lasers from the rim of the floor, across where you stand
        Z.rim = 4; const [ax, ay] = centre(e), a0 = R() * TAU;
        for (let k = 0; k < 6; k++) { const a = a0 + (k / 6) * TAU, x = ax + Math.cos(a) * 15, y = ay + Math.sin(a) * 15, tgt = angleTo(x, y, p.x + (R() - 0.5) * 3, p.y + (R() - 0.5) * 3);
          g.spMark({ kind: 'line', x, y, a: tgt, len: 20, life: 0.6, color: '#ff8af0' }); g.fvLater(0.6, () => { if (e.bx.sing) for (let j = 0; j < 3; j++) g.fvLater(j * 0.12, () => g.bxShot(e, x, y, tgt, { shot: 'star_bolt', speed: 9, range: 26, dmg: 125 })); }); }
      }
    } else if (t < COLLAPSE) {                               // it collapses: everything falls in at once; the light gathers
      if (Z.phase !== 'collapse') { Z.phase = 'collapse'; S.wells = []; g.banner('SUPERNOVA', 2000); g.vx({ k: 'shake', amt: 6 }); for (const b of g.projectiles) if (b.asSpiral && b.bxOf === e) b.asSpiral.shrink = 9; }
      Z.r = Math.max(0.3, Z.r - dt * 1.6);
      g.spMark({ kind: 'ring', x: Z.x, y: Z.y, r: 3 + (t - CONSUME) * 6, life: 0.15, color: '#ffffff' });
    } else {                                                 // SUPERNOVA: ring after ring, each with its gaps, spirals between; it pushes you out
      if (Z.phase !== 'nova') { Z.phase = 'nova'; g.vx({ k: 'shake', amt: 12 }); g.vx({ k: 'burst', x: Z.x, y: Z.y, n: 60, colors: ['#ffffff', '#ffd690', '#ff8a1f', '#c8a0ff'] }); }
      if (!p.dead && d > 0.2) g.moveCircle(p, ((p.x - Z.x) / d) * 0.8 * dt, ((p.y - Z.y) / d) * 0.8 * dt, 0.32);
      const nt = t - COLLAPSE;
      if (nt > 4.5 && (Z.spin -= dt) <= 0) {                 // from its middle on, a four-arm spiral turns out between the rings
        Z.spin = 0.16; Z.spinN = (Z.spinN || 0) + 1; Z.spinA = (Z.spinA || 0) + 0.15;
        for (let k = 0; k < 4; k++) if ((Z.spinN + k * 2) % 10 < 8) g.bxShot(e, Z.x, Z.y, Z.spinA + (k / 4) * TAU, { shot: 'moon_shard', speed: 4.2, range: 18, dmg: 115 });   // gaps in each arm
      }
      if ((Z.nova -= dt) <= 0) {
        Z.nova = nt > 4.5 ? 0.62 : 0.46; Z.wave++;
        const n = 36, a0 = R() * TAU, gaps = new Set();
        for (let q = 0; q < 3; q++) { const at = Math.floor(R() * n); for (let j = 0; j < 3; j++) gaps.add((at + j) % n); }
        for (let k = 0; k < n; k++) if (!gaps.has(k)) g.bxShot(e, Z.x, Z.y, a0 + (k / n) * TAU, { shot: Z.wave % 2 ? 'corona_flare' : 'eclipse_ring', speed: 4.8, range: 18, dmg: 125 });
        for (let k = 0; k < 5; k++) g.bxShot(e, Z.x, Z.y, Z.wave * 0.33 + (k / 5) * TAU, { shot: 'star_bolt', speed: 7.5, range: 18, dmg: 115 });
      }
    }
    if (!p.dead && d < Z.r && (Z.burn -= dt) <= 0) { Z.burn = 0.3; g.hurtPlayer(g.bxDmg(e, 90), 'the singularity'); }
  },
  end(g, e) { e.bx.sing = null; },
};

export default {
  id: 'grand_orrery', name: 'The Grand Orrery', biome: 'dungeon', hp: 400000, def: 30, xp: 17000, r: 2.2, speed: 1.2, keep: 8, faces: false, spawnCentre: true,
  tempo: 0.68, dmgScale: 1.45, finale,
  scaleFor: (g, e) => (e.bx.phase >= 3 ? 1.75 : 1),            // in its Collapse the machine swells to nearly twice its size
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
  phases: {
    1: { move: 'stations', pressure: [{ every: 1.3, special: 'planetVolley', delay: 1.2, dmg: 115 }, { every: 3.4, special: 'flares', delay: 2, n: 8 }], patterns: [
      { name: 'meridian', windup: 0.6, recover: 0.5, special: 'meridian', dmg: 120 },
      { name: 'precession', windup: 0.6, recover: 0.6, special: 'precession', dmg: 120 },
      { name: 'armillary', windup: 0.5, recover: 2, special: 'armillary', dmg: 115 },
      { name: 'meteors', windup: 0.5, recover: 0.4, special: 'meteors', n: 7 },
      { name: 'meridian', windup: 0.5, recover: 0.4, special: 'meridian', dmg: 120 },
      { name: 'orbits', windup: 0.6, recover: 0.6, special: 'orbits', dmg: 120 },
    ] },
    2: { move: 'stations', pressure: [{ every: 2, special: 'flares', n: 10 }, { every: 1.8, special: 'planetVolley', dmg: 115 }], patterns: [
      { name: 'eclipse rings', windup: 0.7, recover: 0.6, special: 'eclipseRings', dmg: 125 },
      { name: 'umbral lunge', windup: 0.5, recover: 0.3, special: 'lunge' },
      { name: 'corona burst', windup: 0.6, recover: 0.8, special: 'coronaBurst', dmg: 125 },
      { name: 'syzygy', windup: 0.7, recover: 0.6, special: 'syzygy', dmg: 125 },
      { name: 'meteors', windup: 0.5, recover: 0.3, special: 'meteors', n: 9 },
      { name: 'umbral lunge', windup: 0.5, recover: 0.3, special: 'lunge' },
      { name: 'orbits', windup: 0.6, recover: 0.4, special: 'orbits', dmg: 120, fast: 1.2 },
    ] },
    3: { move: 'center', pressure: [{ every: 2.2, special: 'debris' }, { every: 4.2, special: 'well', delay: 0.3 }, { every: 2.4, special: 'flares', n: 10 }, { every: 1.6, special: 'planetVolley', dmg: 120 }], patterns: [
      { name: 'accretion', windup: 0.6, recover: 1.2, special: 'accretion', dmg: 120 },
      { name: 'spaghettification', windup: 0.6, recover: 0.5, special: 'spaghetti', dmg: 125 },
      { name: 'infall', windup: 0.5, recover: 0.6, special: 'infall', dmg: 115 },
      { name: 'orbits', windup: 0.5, recover: 0.4, special: 'orbits', dmg: 130, fast: 1.5 },
      { name: 'armillary', windup: 0.5, recover: 1.4, special: 'armillary', dmg: 120, arms: 5, dur: 1.8, turn: -0.21 },
      { name: 'meteors', windup: 0.5, recover: 0.3, special: 'meteors', n: 9 },
      { name: 'spaghettification', windup: 0.5, recover: 0.5, special: 'spaghetti', dmg: 125 },
    ] },
  },
  specials: { meridian, precession, armillary, orbits, meteors, planetVolley, flares, coronaBurst, lunge, eclipseRings, ringOf, syzygy, well, accretion, spaghetti, infall, infallShot, debris },
  moves: {
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
    e.bx.transitT = 5;                                       // the first eclipse crosses a few seconds in
  },
  update(g, e, dt) { tick(g, e, dt); },
  onPhase(g, e, ph) {
    for (const b of g.projectiles) if (b.asOrb) b.asOrb = null;
    if (ph === 3 && !e.bx.grown) { e.bx.grown = true; e.D = { ...e.D, r: e.D.r * 1.6 }; e.hitUp *= 1.75; }   // bigger body, bigger target
  },
  onDeath(g, e) { const S = e.bx; if (S.alt) S.alt.anim.play('p4_death', { speed: 0.4 }); S.umbra = null; S.wells = []; S.debris = []; S.meteors = []; S.planets = null; S.sing = null; },
  // under the bullets: the black holes, the meteors' rune circles, the debris shadows
  drawGround(r, g, e) {
    const S = e.bx, b = r.b;
    for (const W of S.wells || []) {                           // the small singularities: their own sprite, a faint ring where their pull reaches
      const [x, y] = r.proj(W.x, W.y);
      b.globalAlpha = 0.18; b.strokeStyle = '#c8a0ff'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 3.5 * 16, 3.5 * 12, 0, 0, TAU); b.stroke(); b.globalAlpha = 1;
      r.singularity(g, W.x, W.y, 1, 2.4, W.born, W.until);
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
    if (S.sing) { const Z = S.sing; if (Z.phase === 'consume') r.singularity(g, Z.x, Z.y, 1, 1 + Z.r * 1.5, Z.born || 0); }   // the big singularity: its own sprite, growing
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
      b.globalAlpha = rising ? 0.35 : 0.78; b.fillStyle = '#04030a';                  // dark, but the shots inside still show through b.beginPath(); b.arc(Math.round(x), Math.round(y), R0, 0, TAU); b.fill();
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
