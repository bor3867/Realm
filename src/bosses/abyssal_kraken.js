// The Abyssal Kraken: a realm event off the Drowned Shore (docs/design/boss_abyssal_kraken.md).
// It lives in the deep pool at the middle of its reef (src/realmevents.js carves it) and never leaves it; you fight
// from the ring of shallows. Its own mechanics: ink that blots your view, tentacle arms of hooks that bend as they
// fly, a drifting whirlpool that drags and sprays, glowing lures joined by chain lightning.
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/abyssal_kraken.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);

// ink: blobs arc to you and around you; one that lands on you blots your view for a moment
function ink(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < (V.n || 3); k++) {
    const a = R() * TAU, d = k ? 1.2 + R() * 1.4 : 0, x1 = p.x + Math.cos(a) * d, y1 = p.y + Math.sin(a) * d;
    const T = Math.max(0.6, Math.min(1.3, Math.hypot(x1 - ox, y1 - oy) / 7));
    const b = g.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), 7, 99, g.bxDmg(e, V.dmg || 50), SHOT('ink_blob'), 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T, h: 34, n: 0, r: 1.0, ss: 0,
      onLand: (G) => {
        G.vx({ k: 'burst', x: x1, y: y1, n: 14, colors: ['#0a0a18', '#1a1a3a', '#3a3a6a'] });
        if (Math.hypot(G.player.x - x1, G.player.y - y1) < 1.6) { G.inkUntil = G.t + 1.6; G.inkSeed = R(); }
      } };
  }
}
// barbed tentacles: each arm is six hooks on one heading at six speeds, all bending the same way
function tentacles(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e), a0 = angleTo(ox, oy, p.x, p.y) + TAU / (V.arms * 2), dir = R() < 0.5 ? 1 : -1;
  for (let k = 0; k < V.arms; k++) {
    const a = a0 + (k / V.arms) * TAU;
    for (let j = 0; j < 6; j++) g.bxShot(e, ox, oy, a, { shot: 'barbed_hook', speed: V.s0 + ((V.s1 - V.s0) * j) / 5, dmg: V.dmg, range: 13, mv: { curve: V.curve * dir } });
  }
}
// a whirlpool leaves the pool and drifts after you: inside it the current drags at you, and it throws spray
function whirl(g, e) {
  const S = e.bx;
  S.whirls = (S.whirls || []).filter((w) => w.life > 0);
  if (S.whirls.length >= 2) return;
  const [ox, oy] = g.bxOrigin(e);
  S.whirls.push({ x: ox, y: oy + 0.5, life: 7, spray: 0.6, spin: R() * TAU });
}
// lures: four lights hang in the shallows around you, joined by a flickering line; then lightning runs every link
function lures(g, e) {
  const S = e.bx, p = g.player, a0 = R() * TAU;
  S.lures = [];
  for (let k = 0; k < 4; k++) { const a = a0 + k * 1.35 + (R() - 0.5) * 0.4, d = 2.4 + R() * 1.8; S.lures.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }); }
  S.chainAt = g.t + 0.9;
}
function chain(g, e) {
  const S = e.bx, [ox, oy] = g.bxOrigin(e), pts = [{ x: ox, y: oy }, ...S.lures];
  for (let k = 0; k + 1 < pts.length; k++) {
    const A = pts[k], B = pts[k + 1], L = Math.hypot(B.x - A.x, B.y - A.y), a = angleTo(A.x, A.y, B.x, B.y);
    for (let u = 0; u < L; u += 0.75) g.bxShot(e, A.x + Math.cos(a) * u, A.y + Math.sin(a) * u, a, { shot: 'abyss_lightning', speed: 9, range: 1.1, dmg: 55 });
  }
  for (const l of S.lures) for (let k = 0; k < 6; k++) g.bxShot(e, l.x, l.y, (k / 6) * TAU, { shot: 'glow_orb', speed: 3.5, range: 3, dmg: 45 });
  g.vx({ k: 'shake', amt: 3 });
  S.lures = []; S.chainAt = 0;
}

// spouts (P2-P3 pressure): the shallows near you bubble, then a column of water bursts up and sprays a fan away
// from the pool (the way the water runs)
function spout(g, e, V) {
  const p = g.player, a = R() * TAU, d = 1.5 + R() * 2, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d, h = e.home || e;
  g.vx({ k: 'burst', x, y, n: 6, colors: ['#c8eeff', '#ffffff'] });
  g.fvLater(0.6, () => {
    if (e.dead || e.bx.state === 'death') return;
    const out = angleTo(h.x, h.y, x, y);
    for (let k = 0; k < 6; k++) g.bxShot(e, x, y, out + (k / 5 - 0.5) * 1.6, { shot: 'water_bolt', speed: 5, range: 6, dmg: V.dmg || 50 });
    g.vx({ k: 'burst', x, y: y - 0.6, n: 14, colors: ['#c8eeff', '#7ec0e4', '#ffffff'] });
  });
}

export default {
  id: 'abyssal_kraken', name: 'The Abyssal Kraken', biome: 'shore', hp: 36000, def: 18, xp: 3600, r: 2.2, speed: 0.8, keep: 6, faces: false, noShadow: true,
  tempo: 0.85, dmgScale: 1.15,
  phases: {
    1: { move: 'lurk', patterns: [
      { name: 'ink lob', windup: 0.7, recover: 0.7, special: 'ink', n: 3, dmg: 50 },
      { name: 'twin streams', windup: 0.6, recover: 0.6, volleys: [
        { form: 'stream', shot: 'water_bolt', n: 10, every: 0.08, wobble: 0.25, speed: 7, dmg: 45, from: (g, e) => [e.x - 1.2, e.y - e.hitUp] },
        { form: 'stream', shot: 'water_bolt', n: 10, every: 0.08, wobble: 0.25, speed: 7, dmg: 45, from: (g, e) => [e.x + 1.2, e.y - e.hitUp], t: 0.04 }] },
      { name: 'breach', windup: 0.8, recover: 0.6, volleys: [{ form: 'ring', shot: 'water_bolt', count: 20, gaps: 3, rot: 0.13, speed: 4.5, dmg: 50 }] },
    ] },
    2: { move: 'lurk', pressure: [{ every: 2.2, special: 'spout', delay: 1.5, dmg: 50 }], patterns: [
      { name: 'barbed tentacles', windup: 0.7, recover: 0.6, special: 'tentacles', arms: 4, s0: 3, s1: 7, curve: 0.7, dmg: 55 },
      { name: 'whirlpool', windup: 0.6, recover: 0.5, special: 'whirl' },
      { name: 'ink lob', windup: 0.6, recover: 0.6, special: 'ink', n: 4, dmg: 55 },
    ] },
    3: { move: 'lurk', pressure: [{ every: 1.7, special: 'spout', dmg: 55 }], patterns: [
      { name: 'lures', windup: 0.7, recover: 1.4, special: 'lures' },
      { name: 'barbed tentacles', windup: 0.6, recover: 0.5, special: 'tentacles', arms: 6, s0: 3.5, s1: 8, curve: 0.9, dmg: 60 },
      { name: 'deep breach', windup: 0.8, recover: 0.6, volleys: [
        { form: 'ring', shot: 'water_bolt', count: 22, gaps: 3, rot: 0.11, speed: 4.5, dmg: 55 },
        { form: 'ring', shot: 'water_bolt', count: 22, gaps: 3, rot: 0.14, speed: 4.5, dmg: 55, t: 0.25 }] },
    ] },
  },
  specials: { ink, tentacles, whirl, lures, spout },
  moves: {
    lurk(g, e) {                                    // it sways about the middle of its pool and never leaves it
      const h = e.home || (e.home = { x: e.x, y: e.y }), t = e.bx.t;
      e.x = h.x + Math.cos(t * 0.35) * 1.1; e.y = h.y + Math.sin(t * 0.5) * 0.6;
    },
  },
  update(g, e, dt) {
    const S = e.bx, p = g.player;
    for (const w of S.whirls || []) {               // the whirlpools drift after you, drag at you, and spray
      if (w.life <= 0) continue;
      w.life -= dt; w.spin += dt * 4;
      const dd = Math.hypot(p.x - w.x, p.y - w.y) || 1;
      w.x += ((p.x - w.x) / dd) * 1.9 * dt; w.y += ((p.y - w.y) / dd) * 1.9 * dt;
      if (dd < 1.8 && !p.dead) { p.dragUntil = g.t + 0.1; p.dragF = 0.55; }
      if ((w.spray -= dt) <= 0) {
        w.spray = 0.6;
        for (let k = 0; k < 4; k++) g.bxShot(e, w.x, w.y, w.spin + (k / 4) * TAU, { shot: 'water_bolt', speed: 4, range: 6, dmg: 45, mv: { curve: 1.2 } });
      }
      if (w.life <= 0) g.vx({ k: 'burst', x: w.x, y: w.y, n: 10, colors: ['#c8eeff', '#7ec0e4', '#ffffff'] });
    }
    if (S.chainAt && g.t >= S.chainAt) chain(g, e);
  },
  onPhase(g, e) { const S = e.bx; S.whirls = []; S.lures = []; S.chainAt = 0; },
  onDeath(g, e) { const S = e.bx; S.whirls = []; S.lures = []; S.chainAt = 0; if (g.krakenDrain) g.krakenDrain(); },   // its pool drains so you can reach the loot
  // drawn on the water, under the bullets: the whirlpools, the lures and their flickering links
  drawGround(r, g, e) {
    const S = e.bx, b = r.b;
    const W = r.R && r.R.resolve(SHOT('whirlpool')), O = r.R && r.R.resolve(SHOT('glow_orb'));
    for (const w of S.whirls || []) {
      if (w.life <= 0 || !W) continue;
      const [x, y] = r.proj(w.x, w.y), fa = Math.min(1, w.life / 0.6, (7 - w.life) / 0.4);
      r.drawDef(W, Object.keys(W.frames)[Math.floor(g.t * 8) % Object.keys(W.frames).length], Math.round(x), Math.round(y), { rot: w.spin, scale: 2.6, alpha: 0.8 * fa });
    }
    if (S.lures && S.lures.length) {
      const [ox, oy] = g.bxOrigin(e), pts = [{ x: ox, y: oy }, ...S.lures];
      if (Math.floor(g.t * 18) % 3) {               // the links, flickering: where the lightning will run
        b.fillStyle = '#9af0ff'; b.globalAlpha = 0.55;
        for (let k = 0; k + 1 < pts.length; k++) {
          const [x0, y0] = r.proj(pts[k].x, pts[k].y), [x1, y1] = r.proj(pts[k + 1].x, pts[k + 1].y), L = Math.hypot(x1 - x0, y1 - y0);
          for (let u = 0; u < L; u += 2) b.fillRect(Math.round(x0 + ((x1 - x0) * u) / L), Math.round(y0 + ((y1 - y0) * u) / L), 1, 1);
        }
        b.globalAlpha = 1;
      }
      if (O) for (const l of S.lures) { const [x, y] = r.proj(l.x, l.y); r.drawDef(O, Object.keys(O.frames)[Math.floor(g.t * 6) % Object.keys(O.frames).length], Math.round(x), Math.round(y - 6 + Math.sin(g.t * 4 + l.x) * 2), { center: true, scale: 1.4 }); }
    }
  },
  loot: [{ id: 'tidebreaker_trident', p: 0.12 }, { id: 'abyssal_pearl', p: 0.12 }, { id: 'leviathan_eye', p: 0.015 },
    { slot: 'weapon', tiers: [5, 8], p: 1 }, { slot: 'armor', tiers: [5, 8], p: 1 }, { slot: 'ring', tiers: [2, 4], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.6 }],
  lootLuck: 2,
};
