// The Tidebound Lich: the Sunken Crypt's boss on the boss framework (docs/design/boss_tidebound_lich.md).
// The Crypt keeps its ossuary hall as his arena. He keeps his own old tricks (the swap, the dark, the grave call:
// the game's 'soulswap' and 'echo' fx and its darkness), and gains the brief's three phases: bolts that bend with the
// current, coral that splinters, lost souls that chase you and fly home, a turning cage of souls round you, the tide
// coming in from every wall, and a pendulum spiral of skulls.
const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);

function bolts(g, e, V) {                           // volleys of five, every bolt bending the same way with the current
  const dir = R() < 0.5 ? 1 : -1;
  for (let k = 0; k < 4; k++) e.bx.vol.push({ t: k * 0.35, V: { form: 'fan', shot: 'soul_bolt', count: 5, spread: 0.45, speed: 6.5, range: 12, dmg: V.dmg || 80, mv: { curve: 0.55 * dir } } });
}
function coral(g, e, V) {                           // three coral chunks that splinter into six
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (const off of [-0.8, -0.4, 0, 0.4, 0.8]) g.bxShot(e, ox, oy, a + off, { shot: 'coral_shard', speed: 6, range: 12, dmg: V.dmg || 85, size: 0.55, mv: { split: { at: 0.6, n: 6, speed: 4.5, range: 4 } } });
}
function swap(g, e) {                               // his own: you trade places
  g.fx.push({ kind: 'soulswap', e, t: 0, delay: 0.6, life: 0.9, dmg: 75, proj: 'bx_shots/tidebound_lich.lost_soul', by: e.D.name });
  g.banner('The Lich reaches for your soul...', 1600);
}
function lightsOut(g, e) {                          // his own: the candles gutter
  g.darkStart = g.t; g.darkUntil = g.t + 9; g.darkR = 3.4; g.darkBy = e;
  g.banner('The candles gutter out.', 1800);
}
function souls(g, e, V) {                           // lost souls: they chase you, then fly home to him
  const p = g.player, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 5; k++) { const b = g.bxShot(e, ox, oy, a + (k / 4 - 0.5) * 2, { shot: 'lost_soul', speed: 4.5, range: 99, dmg: V.dmg || 80, mv: { seek: 2.4 } }); b.tether = { home: e, out: 1.6 }; b.life = 5; }
}
function cage(g, e, V) {                            // a ring of souls forms round you, turning, tightening, then flung out
  const p = g.player, n = 14, gap = Math.floor(R() * n), cx = p.x, cy = p.y, dir = R() < 0.5 ? 1 : -1;
  for (let k = 0; k < n; k++) {
    if (k === gap) continue;
    const a = (k / n) * TAU, b = g.bxShot(e, cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 4.5, a, { shot: 'soul_ring', speed: 0.01, range: 99, dmg: V.dmg || 85 });
    b.cage = { cx, cy, a, r: 4.5, w: 0.8 * dir, t: 2 }; b.life = 99;
  }
}
function tide(g, e, V) {                            // the tide comes in from all four walls at once, each with a gap
  const A = e.bx.arena || { x: e.x - 16, y: e.y - 18, w: 32, h: 36 };
  for (const side of ['n', 's', 'e', 'w']) e.bx.vol.push({ t: 0, V: { form: 'curtain', from_side: side, shot: 'tide_crescent', count: side === 'n' || side === 's' ? 16 : 18, gaps: 3, speed: 2.6, dmg: V.dmg || 85, range: Math.max(A.w, A.h) / 2 + 1 } });
}
function skulls(g, e, V) {                          // a spiral that swings one way, then back: a pendulum
  const steps = 18, base = R() * TAU;
  for (let k = 0; k < steps; k++) {
    const swing = Math.sin((k / steps) * Math.PI * 2) * 1.1;
    e.bx.vol.push({ t: k * 0.12, V: { form: 'ring', shot: 'drowned_skull', count: 3, rot: 0, spiralAt: base + swing, gaps: 0, aimed: false, speed: 4.2, range: 13, dmg: V.dmg || 90 } });
  }
}
function gravecall(g, e) {                          // his own: the dead rise where you walked
  g.fx.push({ kind: 'echo', e, t: 0, life: 7, hist: [], acc: 0, dur: 6, delay: 1.0, every: 0.32, n: 6, speed: 3.5, dmg: 82, proj: 'bx_shots/tidebound_lich.drowned_skull', by: e.D.name });
  g.banner('The dead walk where you walked.', 1800);
}

// a single soul bolt bent by the current (P1 pressure): the current changes direction now and then
function driftBolt(g, e, V) {
  const S = e.bx, p = g.player, [ox, oy] = g.bxOrigin(e);
  if (!S.current || R() < 0.15) S.current = R() < 0.5 ? 1 : -1;
  g.bxShot(e, ox, oy, angleTo(ox, oy, p.x, p.y) - S.current * 0.35, { shot: 'soul_bolt', speed: 7, range: 14, dmg: V.dmg || 80, mv: { curve: 0.55 * S.current } });
}
// the second wave of lost souls (P2): they come from the walls behind you, not from him
function soulsBehind(g, e, V) {
  const p = g.player, A = e.bx.arena, [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, p.x, p.y);
  for (let k = 0; k < 4; k++) {
    const aa = a + (k / 3 - 0.5) * 1.4, x = p.x + Math.cos(aa) * 8, y = p.y + Math.sin(aa) * 8;
    const cx = A ? Math.max(A.x + 1, Math.min(A.x + A.w - 1, x)) : x, cy = A ? Math.max(A.y + 1, Math.min(A.y + A.h - 1, y)) : y;
    const b = g.bxShot(e, cx, cy, angleTo(cx, cy, p.x, p.y), { shot: 'lost_soul', speed: 4, range: 99, dmg: V.dmg || 80, mv: { seek: 2 } });
    b.tether = { home: e, out: 1.8 }; b.life = 5;
  }
}
function soulsTwice(g, e, V) { souls(g, e, V); e.bx.vol.push({ t: 0.9, V: { form: 'special', name: 'soulsBehind', dmg: V.dmg } }); }
// undertow (P3 pressure): drowned skulls rise at the hall's edge and drift in toward its middle
function undertow(g, e, V) {
  const A = e.bx.arena || { x: e.x - 16, y: e.y - 18, w: 32, h: 36 }, cx = A.x + A.w / 2, cy = A.y + A.h / 2;
  for (let k = 0; k < 3; k++) {
    const side = Math.floor(R() * 4), u = R(), x = side < 2 ? A.x + 1 + u * (A.w - 2) : side === 2 ? A.x + 1 : A.x + A.w - 1, y = side < 2 ? (side ? A.y + A.h - 1 : A.y + 1) : A.y + 1 + u * (A.h - 2);
    g.bxShot(e, x, y, angleTo(x, y, cx, cy) + (R() - 0.5) * 0.5, { shot: 'drowned_skull', speed: 2.4, range: Math.max(A.w, A.h), dmg: V.dmg || 85 });
  }
}

export default {
  id: 'tidebound_lich', name: 'The Tidebound Lich', biome: 'dungeon', hp: 180000, def: 26, xp: 10000, r: 2, speed: 1.3, keep: 7, faces: true,
  tempo: 0.75, dmgScale: 0.85,   // (was 1.2: a two-star dungeon's boss killed a player standing still in 1s (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs))
  phases: {
    1: { move: 'pace', pressure: [{ every: 0.75, special: 'driftBolt', delay: 1.2, dmg: 80 }], patterns: [
      { name: 'soul bolts', windup: 0.6, recover: 0.5, special: 'bolts', dmg: 80 },
      { name: 'coral', windup: 0.6, recover: 0.5, special: 'coral', dmg: 85 },
      { name: 'soul bolts', windup: 0.5, recover: 0.5, special: 'bolts', dmg: 80 },
      { name: 'the swap', windup: 0.9, recover: 0.6, special: 'swap' },
    ] },
    2: { move: 'pace', pressure: [{ every: 1.0, special: 'driftBolt', dmg: 80 }], patterns: [
      { name: 'lost souls', windup: 0.6, recover: 0.6, special: 'soulsTwice', dmg: 80 },
      { name: 'soul cage', windup: 0.7, recover: 0.7, special: 'cage', dmg: 85 },
      { name: 'coral', windup: 0.5, recover: 0.5, special: 'coral', dmg: 85 },
      { name: 'lights out', windup: 0.9, recover: 0.5, special: 'lightsOut' },
    ] },
    3: { move: 'center', pressure: [{ every: 3.4, special: 'undertow', dmg: 80 }], patterns: [
      { name: 'the tide comes in', windup: 0.8, recover: 1.5, special: 'tide', dmg: 85 },
      { name: 'drowned skulls', windup: 0.6, recover: 0.7, special: 'skulls', dmg: 85 },
      { name: 'grave call', windup: 0.7, recover: 0.6, special: 'gravecall' },
    ] },
  },
  specials: { bolts, coral, swap, lightsOut, souls, cage, tide, skulls, gravecall, driftBolt, soulsBehind, soulsTwice, undertow },
  update(g, e, dt) {
    for (const b of g.projectiles) {
      if (b.bxOf !== e) continue;
      if (b.tether) {                                 // lost souls: chase, then turn for home
        const T = b.tether;
        T.out -= dt;
        if (T.out <= 0 && !T.back) { T.back = true; b.mv = null; }
        if (T.back) { const a = angleTo(b.x, b.y, e.x, e.y - e.hitUp); b.vx = Math.cos(a) * 6; b.vy = Math.sin(a) * 6; b.a = a; if (Math.hypot(b.x - e.x, b.y - e.y + e.hitUp) < 0.8) b.life = 0; }
      }
      if (b.cage) {                                   // the cage turns and tightens; then it flies apart
        const C = b.cage;
        C.t -= dt;
        if (C.t > 0) { C.a += C.w * dt; C.r = Math.max(1.6, C.r - 1.2 * dt); b.x = C.cx + Math.cos(C.a) * C.r; b.y = C.cy + Math.sin(C.a) * C.r; b.a = C.a + Math.PI / 2; }
        else { b.cage = null; b.vx = Math.cos(C.a) * 5; b.vy = Math.sin(C.a) * 5; b.a = C.a; b.life = 2.5; }
      }
    }
  },
  onPhase(g, e, ph) { if (ph === 2) lightsOut(g, e); },
  onDeath(g, e) { g.darkUntil = 0; },
  loot: [{ id: 'tidecaller_blade', p: 0.1 }, { id: 'staff_of_drowned_stars', p: 0.1 }, { id: 'hexsilk_robe', p: 0.1 }, { id: 'ring_of_tides', p: 0.1 }, { id: 'soul_lantern', p: 0.08 },
    { id: 'grimoire_of_ash', p: 0.06 }, { id: 'tidewraith_staff', p: 0.02 }, { id: 'key_crypt', p: 0.06 },
    { slot: 'weapon', tiers: [7, 9], p: 1 }, { slot: 'armor', tiers: [8, 10], p: 1 }, { slot: 'ability', tiers: [3, 5], p: 0.7 }, { slot: 'ring', tiers: [3, 5], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.6 }],
  lootLuck: 2,
};
