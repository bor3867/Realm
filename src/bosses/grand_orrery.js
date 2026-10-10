// The Grand Orrery: the machine at the heart of the Astral Observatory (docs/design/boss_grand_orrery.md).
// Its floor is a round marble platform over the void. Its own mechanics: rings of shots that wheel in orbits and fly
// off on tangents; a conjunction that freezes every shot and looses them all at you; an umbra that slides across
// the floor and blacks it out, with flares from its rim; expanding rings with staggered gaps; a gravity well; debris
// that rains on marked spots.
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/grand_orrery.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const centre = (e) => { const A = e.bx.arena; return A ? [A.x + A.w / 2, A.y + A.h / 2] : [e.x, e.y]; };

// orbits: three rings wheeling round it, each its own way, each with two gaps; after a while they fly off
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
// conjunction: every shot it has in the air stops, chimes, and then all of them fly at you
function conjunction(g, e) {
  const p = g.player;
  for (const b of g.projectiles) {
    if (b.bxOf !== e) continue;
    b.asOrb = null;
    b.ha = angleTo(b.x, b.y, p.x, p.y - 0.4); b.hs = 6.5; b.s0 = 6.5; b.t = 0; b.mv = { hold: 0.6 }; b.life = 4;
  }
  g.vx({ k: 'burst', x: e.x, y: e.y - e.hitUp, n: 14, colors: ['#ffffff', '#ffd690'] });
}
// corona flares: from the rim of the umbra, not from the machine
function flares(g, e) {
  const U = e.bx.umbra;
  if (!U) return;
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + R() * 0.3; g.bxShot(e, U.x + Math.cos(a) * U.r, U.y + Math.sin(a) * U.r, a, { shot: 'corona_flare', speed: 5.5, range: 10, dmg: 120 }); }
}
// eclipse rings: two expanding rings, the second's gaps between the first's
function eclipseRings(g, e, V) {
  const n = 24, g0 = Math.floor(R() * n), gaps = (off) => new Set([0, 1, 8, 9, 16, 17].map((q) => (g0 + q + off) % n));
  [[0, 0], [0.5, 4]].forEach(([t, off]) => e.bx.vol.push({ t, V: { form: 'special', name: 'ringOf', skip: gaps(off), n, dmg: V.dmg || 125 } }));
}
function ringOf(g, e, V) {
  const [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < V.n; k++) if (!V.skip.has(k)) g.bxShot(e, ox, oy, (k / V.n) * TAU, { shot: 'eclipse_ring', speed: 4, range: 18, dmg: V.dmg });
}
// gravity wells: one settles on the floor and pulls you for a while; in the last phase two can be down at once
function well(g, e) {
  const [cx, cy] = centre(e), p = g.player, S = e.bx;
  S.wells = (S.wells || []).filter((W) => g.t <= W.until);
  if (S.wells.length >= 2) return;
  for (let t = 0; t < 20; t++) {
    const a = R() * TAU, d = 3 + R() * 8, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (Math.hypot(x - p.x, y - p.y) < 3.5 || S.wells.some((W) => Math.hypot(W.x - x, W.y - y) < 5)) continue;
    S.wells.push({ x, y, until: g.t + 5, tick: 0 }); break;
  }
}
// planets (P1 pressure): two planets wheel round the machine, opposite ways; each throws three bolts at you as it passes
function planetVolley(g, e, V) {
  const p = g.player;
  for (const P of e.bx.planets || []) {
    const a = angleTo(P.x, P.y, p.x, p.y);
    for (const off of [-0.16, 0, 0.16]) g.bxShot(e, P.x, P.y, a + off, { shot: 'star_bolt', speed: 7, range: 16, dmg: V.dmg || 115 });
  }
}
// syzygy (P2): the umbra slides onto the line between the machine and you, then a dense stream fires down that line,
// through the dark
function syzygy(g, e, V) {
  const S = e.bx, p = g.player, [ox, oy] = g.bxOrigin(e);
  if (S.umbra) { S.umbra.x = (ox + p.x) / 2; S.umbra.y = (oy + p.y) / 2; }
  const a = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 12; k++) S.vol.push({ t: 0.45 + k * 0.06, V: { form: 'fan', shot: 'eclipse_ring', count: 3, spread: 0.3, angle: a + Math.sin(k * 0.9) * 0.06, speed: 9.5, range: 20, dmg: V.dmg || 125 } });
}
// spaghettification (P3): rings whose shots bend toward the nearest well
function spaghetti(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), a0 = R() * TAU;
  for (let k = 0; k < 22; k++) { const b = g.bxShot(e, ox, oy, a0 + (k / 22) * TAU, { shot: 'star_bolt', speed: 4.6, range: 20, dmg: V.dmg || 125 }); b.toWell = 2.2; b.life = 4.5; }
}
// debris: shadows grow under where the shards will land, then they land and skitter outward
function debris(g, e) {
  const p = g.player, S = e.bx;
  S.debris = S.debris || [];
  for (let k = 0; k < 6; k++) { const a = R() * TAU, d = k ? 1.2 + R() * 3.4 : 0; S.debris.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, at: g.t + 0.8 }); }
  g.vx({ k: 'shake', amt: 4 });
}

// the finale, COLLAPSE: the floor's safe circle shrinks from the rim inward (outside it, the void burns) while the
// orbits keep coming, each pair of them called home by a conjunction
const finale = {
  at: 0.12, dur: 12, name: 'Collapse', say: 'stay inside the light',
  start(g, e) { e.bx.col = { r: 13, orb: 0.6, conj: 0, burn: 0 }; },
  update(g, e, dt, t) {
    const C = e.bx.col, p = g.player, [cx, cy] = centre(e);
    C.r = Math.max(4.5, 13 - (t / 12) * 9);
    if ((C.orb -= dt) <= 0) { C.orb = 3; orbits(g, e, { dmg: 125, fast: 1.3 }); C.conj = 2.1; }
    if (C.conj > 0 && (C.conj -= dt) <= 0) conjunction(g, e);
    if (!p.dead && Math.hypot(p.x - cx, p.y - cy) > C.r && (C.burn -= dt) <= 0) { C.burn = 0.4; g.hurtPlayer(g.bxDmg(e, 60), 'the collapsing void'); }
  },
  end(g, e) { e.bx.col = null; },
};

export default {
  id: 'grand_orrery', name: 'The Grand Orrery', biome: 'dungeon', hp: 380000, def: 30, xp: 17000, r: 2.2, speed: 1.0, keep: 8, faces: false, spawnCentre: true,
  tempo: 0.68, dmgScale: 1.45, finale,
  phases: {
    1: { move: 'hold', pressure: [{ every: 1.3, special: 'planetVolley', delay: 1.2, dmg: 115 }], patterns: [
      { name: 'orbits', windup: 0.6, recover: 0.5, special: 'orbits', dmg: 120 },
      { name: 'orbits', windup: 0.5, recover: 0.3, special: 'orbits', dmg: 120 },
      { name: 'conjunction', windup: 0.6, recover: 0.8, special: 'conjunction' },
    ] },
    2: { move: 'hold', pressure: [{ every: 2.1, special: 'flares' }], patterns: [
      { name: 'eclipse rings', windup: 0.7, recover: 0.5, special: 'eclipseRings', dmg: 125 },
      { name: 'syzygy', windup: 0.7, recover: 0.6, special: 'syzygy', dmg: 125 },
      { name: 'eclipse rings', windup: 0.6, recover: 0.5, special: 'eclipseRings', dmg: 125 },
      { name: 'orbits', windup: 0.6, recover: 0.4, special: 'orbits', dmg: 120 },
    ] },
    3: { move: 'hold', pressure: [{ every: 2.4, special: 'debris' }, { every: 4.5, special: 'well', delay: 0.5 }], patterns: [
      { name: 'spaghettification', windup: 0.6, recover: 0.5, special: 'spaghetti', dmg: 125 },
      { name: 'orbits', windup: 0.5, recover: 0.4, special: 'orbits', dmg: 130, fast: 1.5 },
      { name: 'conjunction', windup: 0.5, recover: 0.6, special: 'conjunction' },
      { name: 'spaghettification', windup: 0.5, recover: 0.5, special: 'spaghetti', dmg: 125 },
    ] },
  },
  specials: { orbits, conjunction, flares, eclipseRings, ringOf, well, debris, planetVolley, syzygy, spaghetti },
  onWake(g, e) { const [cx, cy] = centre(e); e.bx.planets = [{ a: 0, w: 0.9, r: 6, x: cx, y: cy }, { a: Math.PI, w: -0.7, r: 7.5, x: cx, y: cy }]; },
  update(g, e, dt) {
    const S = e.bx, p = g.player;
    if (S.planets) {                                           // the planets wheel round the machine
      const [ox, oy] = g.bxOrigin(e);
      for (const P of S.planets) { P.a += P.w * dt; P.x = ox + Math.cos(P.a) * P.r; P.y = oy + Math.sin(P.a) * P.r * 0.85; }
    }
    if (S.wells && S.wells.length) {                           // shots that feel the wells bend toward the nearest one
      for (const b of g.projectiles) {
        if (!b.toWell || b.bxOf !== e) continue;
        let W = null, wd = 1e9;
        for (const q of S.wells) { const d = Math.hypot(q.x - b.x, q.y - b.y); if (d < wd) { wd = d; W = q; } }
        if (!W || wd < 0.6) continue;
        const cur = Math.atan2(b.vy, b.vx), want = angleTo(b.x, b.y, W.x, W.y), s = Math.hypot(b.vx, b.vy);
        let da = ((want - cur + Math.PI * 3) % TAU) - Math.PI; da = Math.max(-b.toWell * dt, Math.min(b.toWell * dt, da));
        b.vx = Math.cos(cur + da) * s; b.vy = Math.sin(cur + da) * s; b.a = cur + da;
      }
    }
    for (const b of g.projectiles) {                          // shots in orbit wheel round; when their time is up they fly off on the tangent
      const O = b.asOrb;
      if (!O) continue;
      O.a += O.w * dt; O.t -= dt;
      b.x = O.cx + Math.cos(O.a) * O.r; b.y = O.cy + Math.sin(O.a) * O.r; b.a = O.a + (O.w > 0 ? Math.PI / 2 : -Math.PI / 2); b.life = 99;
      if (O.t <= 0) { b.asOrb = null; b.vx = Math.cos(b.a) * 5; b.vy = Math.sin(b.a) * 5; b.life = 2.6; }
    }
    const U = S.umbra;                                         // the umbra slides across the floor, bouncing off the rim
    if (U) {
      const [cx, cy] = centre(e);
      U.x += U.vx * dt; U.y += U.vy * dt;
      if (Math.hypot(U.x - cx, U.y - cy) > 11) { const a = angleTo(cx, cy, U.x, U.y); U.vx = -Math.cos(a + (R() - 0.5) * 0.8) * 2.2; U.vy = -Math.sin(a + (R() - 0.5) * 0.8) * 2.2; }
    }
    if (S.wells) S.wells = S.wells.filter((W) => g.t <= W.until);
    for (const W of S.wells || []) {                           // each well pulls; touching one burns
      if (p.dead) break;
      const d = Math.hypot(W.x - p.x, W.y - p.y);
      if (d > 0.2) g.moveCircle(p, ((W.x - p.x) / d) * 2.2 * dt, ((W.y - p.y) / d) * 2.2 * dt, 0.32);
      if (d < 1 && (W.tick -= dt) <= 0) { W.tick = 0.5; g.hurtPlayer(g.bxDmg(e, 120), 'the gravity well'); }
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
  },
  onPhase(g, e, ph) {
    const S = e.bx, [cx, cy] = centre(e);
    for (const b of g.projectiles) if (b.asOrb) b.asOrb = null;
    if (ph === 2) { const a = R() * TAU; S.umbra = { x: cx + 6, y: cy, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, r: 6 }; }
    if (ph === 3) S.umbra = null;
  },
  onDeath(g, e) { const S = e.bx; S.umbra = null; S.wells = []; S.debris = []; S.planets = null; S.col = null; },
  // under the bullets: the wells, the debris shadows, the collapse's edge
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, Wd = r.R && r.R.resolve(SHOT('gravity_well'));
    for (const W of S.wells || []) {
      if (!Wd) break;
      const [x, y] = r.proj(W.x, W.y);
      for (let k = 3; k >= 1; k--) { b.globalAlpha = 0.18; b.strokeStyle = '#c8a0ff'; b.beginPath(); b.arc(Math.round(x), Math.round(y), k * 9 + ((g.t * 18) % 9), 0, TAU); b.stroke(); }
      b.globalAlpha = 1;
      r.drawDef(Wd, Object.keys(Wd.frames)[0], Math.round(x), Math.round(y), { rot: g.t * 4, scale: 2.4 });
    }
    if (S.col) {                                               // the collapse: outside the circle the floor is gone to the void
      const [cx, cy] = centre(e), n = 64;
      b.globalAlpha = 0.85; b.fillStyle = Math.floor(g.t * 6) % 2 ? '#ffd690' : '#c8a0ff';
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU + g.t * 0.4, [x, y] = r.proj(cx + Math.cos(a) * S.col.r, cy + Math.sin(a) * S.col.r); b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
      b.globalAlpha = 1;
    }
    for (const D of S.debris || []) {
      const [x, y] = r.proj(D.x, D.y), k = Math.max(0, Math.min(1, 1 - (D.at - g.t) / 0.8));
      b.globalAlpha = 0.25 + 0.4 * k; b.fillStyle = '#05040a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 3 + 7 * k, 2 + 4 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
    }
  },
  // over everything: the umbra blacks out its part of the floor, shots and all; its rim burns
  drawTop(r, g, e) {
    const U = e.bx.umbra, b = r.b, Pd = r.R && r.R.resolve(SHOT('moon_shard'));
    if (Pd && e.bx.state !== 'death') for (const P of e.bx.planets || []) {   // the planets: big moons with a faint orbit glow
      const [x, y] = r.proj(P.x, P.y);
      b.globalAlpha = 0.25; b.fillStyle = '#ffd690'; b.beginPath(); b.arc(Math.round(x), Math.round(y), 9, 0, TAU); b.fill(); b.globalAlpha = 1;
      r.drawDef(Pd, Object.keys(Pd.frames)[0], Math.round(x), Math.round(y), { center: true, rot: g.t * 1.5, scale: 2.6 });
    }
    if (!U) return;
    const [x, y] = r.proj(U.x, U.y), R0 = U.r * 16;
    b.globalAlpha = 0.94; b.fillStyle = '#04030a'; b.beginPath(); b.arc(Math.round(x), Math.round(y), R0, 0, TAU); b.fill();
    b.globalAlpha = 0.35; b.strokeStyle = '#ffb040'; b.lineWidth = 5; b.beginPath(); b.arc(Math.round(x), Math.round(y), R0 + 2, 0, TAU); b.stroke();   // the corona
    b.globalAlpha = 0.95; b.strokeStyle = '#ffd690'; b.lineWidth = 2; b.beginPath(); b.arc(Math.round(x), Math.round(y), R0, 0, TAU); b.stroke(); b.lineWidth = 1;
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU + g.t * 0.6, w = (k + Math.floor(g.t * 8)) % 4 === 0 ? 3 : 2; b.fillStyle = '#ffffff'; b.fillRect(Math.round(x + Math.cos(a) * (R0 + 1)) - 1, Math.round(y + Math.sin(a) * (R0 + 1)) - 1, w, w); }
    b.globalAlpha = 1;
  },
  loot: [{ id: 'starforged_katana', p: 0.1 }, { id: 'comet_bow', p: 0.1 }, { id: 'nebula_robe', p: 0.1 }, { id: 'astral_signet', p: 0.1 }, { id: 'orrery_orb', p: 0.1 },
    { id: 'event_horizon', p: 0.02 }, { id: 'key_astral', p: 0.06 },
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }],
  lootLuck: 2,
};
