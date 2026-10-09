// The Thornheart Treant: a realm event deep in the Thornwood (docs/design/boss_thornheart_treant.md).
// It wakes in a clearing ringed by elder trees (src/realmevents.js carves it). Its own mechanics: seeds that mark
// the ground and burst, burning leaves that sway as they fall, acorn bombs that burst into embers, thorn walls
// closing from both sides at once, and wisps born from the trees around you.
const TAU = Math.PI * 2, R = Math.random;
const SHOT = (n) => `bx_shots/thornheart_treant.${n}`;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);

// seedfall: seeds drop where you stand and around you; the marks show where, then each bursts into a ring
function seedfall(g, e, V) {
  const S = e.bx, p = g.player;
  S.marks = S.marks || [];
  for (let k = 0; k < (V.n || 3); k++) {
    const a = R() * TAU, d = k ? 1.6 + R() * 1.6 : 0;
    S.marks.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, at: g.t + 0.8 });
  }
}
// acorn bombs: lobbed at you, marked as they arc; each bursts into burning embers where it lands
function acorns(g, e, V) {
  const p = g.player, [ox, oy] = g.bxOrigin(e);
  for (let k = 0; k < (V.n || 3); k++) {
    const a = R() * TAU, d = k ? 1.4 + R() * 1.6 : 0, x1 = p.x + Math.cos(a) * d, y1 = p.y + Math.sin(a) * d;
    const T = Math.max(0.7, Math.min(1.3, Math.hypot(x1 - ox, y1 - oy) / 6));
    const b = g.shoot('e', ox, oy, angleTo(ox, oy, x1, y1), 6, 99, V.dmg || 50, SHOT('acorn_bomb'), 0.45, false, e.D.name);
    b.bxOf = e;
    b.lob = { x0: ox, y0: oy, x1, y1, t: 0, T, h: 30, n: 6, r: 1.0, ss: 3.5, sprite: SHOT('burning_leaf'), bxOf: e };
  }
}
// blight wisps: they come out of the ring of trees, not the Treant, and hunt you for a few seconds
function wisps(g, e, V) {
  const A = e.bx.arena, p = g.player, cx = A ? A.x + A.w / 2 : e.x, cy = A ? A.y + A.h / 2 : e.y;
  for (let k = 0; k < (V.n || 5); k++) {
    const a = R() * TAU, x = cx + Math.cos(a) * 11.5, y = cy + Math.sin(a) * 11.5;
    g.bxShot(e, x, y, angleTo(x, y, p.x, p.y), { shot: 'blight_wisp', speed: 3.2, range: 9.6, dmg: 50, mv: { seek: 1.6 } });
    g.vx({ k: 'burst', x, y, n: 6, colors: ['#6a3a8a', '#a0e060', '#2a1a2a'] });
  }
}

export default {
  id: 'thornheart_treant', name: 'The Thornheart Treant', biome: 'thornwood', hp: 26000, def: 16, xp: 2800, r: 1.8, speed: 1.0, keep: 5, faces: true,
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'seedfall', windup: 0.6, recover: 0.6, special: 'seedfall', n: 3 },
      { name: 'leaf spiral', windup: 0.7, recover: 0.6, volleys: [{ form: 'spiral', shot: 'leaf_blade', arms: 4, every: 0.13, dur: 1.8, turn: 0.22, speed: 3.5, dmg: 45, mv: { curve: 0.8 } }] },
      { name: 'bark fan', windup: 0.6, recover: 0.5, volleys: [
        { form: 'fan', shot: 'thorn_seed', count: 7, spread: 1.2, speed: 6, dmg: 45 },
        { form: 'fan', shot: 'thorn_seed', count: 7, spread: 1.2, speed: 6, dmg: 45, offset: 0.1, t: 0.3 }] },
    ] },
    2: { move: 'stalk', patterns: [
      { name: 'falling fire', windup: 0.8, recover: 0.6, volleys: [{ form: 'curtain', from_side: 'n', shot: 'burning_leaf', count: 14, gaps: 3, speed: 2.2, dmg: 50, mv: { wave: { amp: 0.8, freq: 3 } } }] },
      { name: 'acorn bombs', windup: 0.7, recover: 0.6, special: 'acorns', n: 3, dmg: 55 },
      { name: 'seedfall', windup: 0.6, recover: 0.5, special: 'seedfall', n: 4 },
    ] },
    3: { move: 'center', patterns: [
      { name: 'pincer', windup: 0.9, recover: 0.8, volleys: [
        { form: 'curtain', from_side: 'e', shot: 'corrupted_thorn', count: 14, gaps: 3, speed: 2.8, dmg: 55 },
        { form: 'curtain', from_side: 'w', shot: 'corrupted_thorn', count: 14, gaps: 3, speed: 2.8, dmg: 55 }] },
      { name: 'blight wisps', windup: 0.7, recover: 0.8, special: 'wisps', n: 5 },
      { name: 'leaf spiral', windup: 0.6, recover: 0.5, volleys: [{ form: 'spiral', shot: 'leaf_blade', arms: 5, every: 0.11, dur: 1.8, turn: 0.26, speed: 4, dmg: 50, mv: { curve: 0.9 } }] },
    ] },
  },
  specials: { seedfall, acorns, wisps },
  moves: {
    stalk(g, e, dt) {                               // it walks slowly after you, but never out of its clearing
      const p = g.player, A = e.bx.arena, cx = A ? A.x + A.w / 2 : e.x, cy = A ? A.y + A.h / 2 : e.y;
      let tx = p.x, ty = p.y;
      const dc = Math.hypot(tx - cx, ty - cy);
      if (dc > 6) { tx = cx + ((tx - cx) / dc) * 6; ty = cy + ((ty - cy) / dc) * 6; }
      const dd = Math.hypot(tx - e.x, ty - e.y);
      if (dd > 2.5) g.moveCircle(e, ((tx - e.x) / dd) * 0.9 * dt, ((ty - e.y) / dd) * 0.9 * dt, 0.8);
    },
  },
  update(g, e) {
    const S = e.bx;
    if (!S.marks || !S.marks.length) return;
    for (const m of S.marks) if (g.t >= m.at && !m.done) {
      m.done = true;
      const a0 = R() * TAU;
      for (let k = 0; k < 8; k++) g.bxShot(e, m.x, m.y, a0 + (k / 8) * TAU, { shot: 'thorn_seed', speed: 4.5, range: 5, dmg: 45 });
      g.vx({ k: 'burst', x: m.x, y: m.y, n: 8, colors: ['#5a8a2a', '#a0e060', '#3a2a1a'] });
    }
    S.marks = S.marks.filter((m) => !m.done);
  },
  onPhase(g, e) { e.bx.marks = []; },
  onDeath(g, e) { e.bx.marks = []; },
  drawGround(r, g, e) {                             // the seed marks: green rings that tighten as the burst comes
    const b = r.b;
    for (const m of e.bx.marks || []) {
      const [x, y] = r.proj(m.x, m.y), k = Math.max(0, (m.at - g.t) / 0.8), rr = Math.round(8 + k * 8);
      b.globalAlpha = 0.25; b.fillStyle = '#c8ff6a';                 // the patch of ground it will burst from
      b.beginPath(); b.ellipse(Math.round(x), Math.round(y), 9, 6, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
      b.fillStyle = Math.floor(g.t * 12) % 2 ? '#e8ffb0' : '#7ac83a';   // and a ring tightening onto it
      for (let a = 0; a < 24; a++) b.fillRect(Math.round(x + Math.cos((a / 24) * TAU) * rr) - 1, Math.round(y + Math.sin((a / 24) * TAU) * rr * 0.65) - 1, 2, 2);
      b.fillStyle = '#3a6a1a'; b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); b.fillStyle = '#e8ffb0'; b.fillRect(Math.round(x), Math.round(y) - 1, 1, 1);
    }
  },
  loot: [{ id: 'heartwood_bow', p: 0.12 }, { id: 'seed_of_renewal', p: 0.12 }, { id: 'blight_heart', p: 0.015 },
    { slot: 'weapon', tiers: [4, 7], p: 1 }, { slot: 'armor', tiers: [4, 7], p: 1 }, { slot: 'ability', tiers: [2, 4], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }],
  lootLuck: 2,
};
