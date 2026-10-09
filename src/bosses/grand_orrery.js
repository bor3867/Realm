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
// gravity well: it settles on the floor and pulls you for a while
function well(g, e) {
  const [cx, cy] = centre(e), p = g.player;
  for (let t = 0; t < 20; t++) {
    const a = R() * TAU, d = 3 + R() * 8, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (Math.hypot(x - p.x, y - p.y) < 3.5) continue;
    e.bx.well = { x, y, until: g.t + 4, tick: 0 }; break;
  }
}
// debris: shadows grow under where the shards will land, then they land and skitter outward
function debris(g, e) {
  const p = g.player, S = e.bx;
  S.debris = S.debris || [];
  for (let k = 0; k < 6; k++) { const a = R() * TAU, d = k ? 1.2 + R() * 3.4 : 0; S.debris.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, at: g.t + 0.8 }); }
  g.vx({ k: 'shake', amt: 4 });
}

export default {
  id: 'grand_orrery', name: 'The Grand Orrery', biome: 'dungeon', hp: 240000, def: 30, xp: 13000, r: 2.2, speed: 1.0, keep: 8, faces: false, spawnCentre: true,
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'orbits', windup: 0.6, recover: 0.6, special: 'orbits', dmg: 120 },
      { name: 'orbits', windup: 0.5, recover: 0.4, special: 'orbits', dmg: 120 },
      { name: 'conjunction', windup: 0.6, recover: 1.0, special: 'conjunction' },
    ] },
    2: { move: 'hold', patterns: [
      { name: 'corona flares', windup: 0.6, recover: 0.6, special: 'flares' },
      { name: 'eclipse rings', windup: 0.7, recover: 0.6, special: 'eclipseRings', dmg: 125 },
    ] },
    3: { move: 'hold', patterns: [
      { name: 'gravity well', windup: 0.6, recover: 0.5, special: 'well' },
      { name: 'debris', windup: 0.6, recover: 0.7, special: 'debris' },
      { name: 'orbits', windup: 0.5, recover: 0.5, special: 'orbits', dmg: 130, fast: 1.5 },
    ] },
  },
  specials: { orbits, conjunction, flares, eclipseRings, ringOf, well, debris },
  update(g, e, dt) {
    const S = e.bx, p = g.player;
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
    const W = S.well;                                          // the well pulls; touching it burns
    if (W) {
      if (g.t > W.until) S.well = null;
      else if (!p.dead) {
        const d = Math.hypot(W.x - p.x, W.y - p.y);
        if (d > 0.2) g.moveCircle(p, ((W.x - p.x) / d) * 2.2 * dt, ((W.y - p.y) / d) * 2.2 * dt, 0.32);
        if (d < 1 && (W.tick -= dt) <= 0) { W.tick = 0.5; g.hurtPlayer(120, 'the gravity well'); }
      }
    }
    if (S.debris) {                                            // the shards land where the shadows were
      for (const D of S.debris) if (g.t >= D.at && !D.done) {
        D.done = true;
        if (!p.dead && Math.hypot(p.x - D.x, p.y - D.y) < 0.9) g.hurtPlayer(130, 'falling brass');
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
  onDeath(g, e) { const S = e.bx; S.umbra = null; S.well = null; S.debris = []; },
  // under the bullets: the well, the debris shadows
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, Wd = r.R && r.R.resolve(SHOT('gravity_well'));
    if (S.well && Wd) {
      const [x, y] = r.proj(S.well.x, S.well.y);
      for (let k = 3; k >= 1; k--) { b.globalAlpha = 0.18; b.strokeStyle = '#c8a0ff'; b.beginPath(); b.arc(Math.round(x), Math.round(y), k * 9 + ((g.t * 18) % 9), 0, TAU); b.stroke(); }
      b.globalAlpha = 1;
      r.drawDef(Wd, Object.keys(Wd.frames)[0], Math.round(x), Math.round(y), { rot: g.t * 4, scale: 2.4 });
    }
    for (const D of S.debris || []) {
      const [x, y] = r.proj(D.x, D.y), k = Math.max(0, Math.min(1, 1 - (D.at - g.t) / 0.8));
      b.globalAlpha = 0.25 + 0.4 * k; b.fillStyle = '#05040a'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 3 + 7 * k, 2 + 4 * k, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
    }
  },
  // over everything: the umbra blacks out its part of the floor, shots and all; its rim burns
  drawTop(r, g, e) {
    const U = e.bx.umbra, b = r.b;
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
