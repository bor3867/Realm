// Ashkar, the Chained Forge-Giant: to the user's castle spec (art/sunthiefs_castle_complete_encounter_spec.txt, 3).
// Chained before the Grand Sun Door to four great anchors; his chains, his hammer, his armour and his furnace core make
// every attack. A director keeps the spec's scripted cycles (each attack at its own offset in the phase's cycle; the next
// never starts before the last one's active window has run out), not a random pick:
//   I   The Bound Giant (100-70%), held at his chains; 20 s: Red-Hot Chains, Anvil's Sentence, Furnace Teeth, The Press
//   II  The Furnace Fractures (70-35%), prowling within 7 tiles of the middle; 23 s: Molten Faultlines, Anvil's
//       Sentence, Armor Shatter, Furnace Teeth, Red-Hot Chains, The Press
//   III The Unchained (35-0%), hunting; 24 s: Scything Links, Forge Hunt, Inverted Anvil, Anvil's Sentence
//   below 15%: The Gatebreaker (an 11.5 s choreography: corridors, inward chains, three hammer cones, eight fissures),
//       then Anvil's Sentence and Forge Hunt, then again. He can be struck all the while (no immune finale).
// Under the cycle, in I and II, the anchors throw chain links at you now and then. The vents of Furnace Teeth can be
// broken (16,000 Life): a broken one is out for 6 s. Damage numbers are effective ones (D(n): set above a Throne-geared
// character's Defense). No falling lava while he fights (game.dungeonTick).
// Art: tools/build_ashkar.py (the user's sprite, drawn at half scale; 'ash_kin/vent').
import { TAU, angleTo, target, ahead } from './kit.js';

const D = (n) => n + 4;
const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], GLASS = ['#433d4e', '#8c84a2'];
const LINK = { sprite: 'rf_shot/forge_chain', size: 0.5 }, SLAG = { sprite: 'slag_shard', size: 0.5 }, WAVE = { sprite: 'slag', size: 0.55 }, CHUNK = { sprite: 'slag', size: 0.95 };
// the hall, in the spec's own 38x34 tiles, fitted to whatever room he holds (his own, or round him: /bx)
function hall(e) {
  if (!e.akHall) {
    const A = e.room || (e.bx && e.bx.arena) || { x: e.x - 19, y: e.y - 11, w: 38, h: 34 };
    e.akHall = { A, P: (sx, sy) => ({ x: A.x + (sx / 38) * A.w, y: A.y + (sy / 34) * A.h }) };
  }
  return e.akHall;
}
const mid = (e) => hall(e).P(19, 17);
const anchor = (e, i) => hall(e).P(...[[5, 5], [33, 5], [5, 29], [33, 29]][i]);
const vent = (e, i) => hall(e).P(...[[10, 17], [28, 17]][i]);
// a point on his body: dx tiles right of him on the screen, h tiles up (whatever the camera's turn); his core, his wrists
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const CORE = (g, e) => at(g, e, 0, 4.4);
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last: a spread V may carry the caller's)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const lane = (g, e, x, y, a, len, delay, dmg = 0, w = 1, cols) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? 0.35 : 0.02), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0, ...(cols ? { cols } : {}) });
const cleave = (g, e, x, y, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x, y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg });
const CYAN = ['#8af0ff', '#8af0ff', '#8af0ff', '#ffffff'];
const deg = (d) => (d * Math.PI) / 180;
function thud(g, e, x, y) { g.vx({ k: 'shake', amt: 7 }); g.vx({ k: 'burst', x, y, n: 26, colors: FIRE }); g.sfx('hammer'); }

// ================================================================ A1 Anvil's Sentence (all phases)
// a red 110-degree wedge 5 tiles out, 1.15 s; it follows you till 0.30 s before the blow, then locks. The blow (230), and
// out of it a fan of 11 hammer waves (120); 0.6 s on, nine more offset 7 degrees (110)
function sentence(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  cleave(g, e, e.x, e.y, a, 5, deg(110), 0.85, 0);
  later(e, 0.85, 'sentenceLock', { big: V.big, side: V.side || 0 });
  g.sfx('hammer');
}
function sentenceLock(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y) + deg(V.side || 0);
  cleave(g, e, e.x, e.y, a, 5, deg(110), 0.3, D(V.big || 230));
  later(e, 0.3, 'sentenceWave', { a, n: 11, dmg: V.wave || 120, off: 0 });
  if (!V.one) later(e, 0.9, 'sentenceWave', { a, n: 9, dmg: 110, off: deg(7) });
}
function sentenceWave(g, e, V) {
  const x = e.x + Math.cos(V.a) * 2, y = e.y + Math.sin(V.a) * 2;
  if (!V.off) thud(g, e, x, y);
  for (let k = 0; k < V.n; k++) shot(g, e, x, y, V.a + V.off + (k / (V.n - 1) - 0.5) * deg(110), { ...WAVE, speed: 5.6, range: 12, dmg: D(V.dmg) });
}

// ================================================================ A2 Red-Hot Chains (I, II)
// two opposite anchors light up (they alternate each time); 1.0 s, the bands they will sweep marked; then each chain sweeps
// across its band, 4.5 tiles a second for 2.2 s (170 if it catches you), shedding five links behind it every 0.55 s (100)
function chains(g, e) {
  const S = e.bx, pair = (S.akPair = ((S.akPair ?? 1) + 1) % 2) ? [0, 3] : [1, 2], { A } = hall(e);
  S.akHot = { ids: pair, until: g.t + 3.4 }; g.sfx('chain');
  for (const i of pair) {
    const P = anchor(e, i), dir = i < 2 ? 1 : -1, sx = i % 2 ? -1 : 1, L = A.w * 0.6, sweep = Math.min(9.9, A.h * 0.4);
    // the band: from the chain where it lies to where it stops
    lane(g, e, P.x + sx * L / 2, P.y, dir > 0 ? Math.PI / 2 : -Math.PI / 2, sweep, 1.0, 0, L, ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff']);
    later(e, 1.0, 'chainSweep', { i, dir, sx, L, sweep });
  }
}
function chainSweep(g, e, V) {
  const P = anchor(e, V.i), links = [], a = V.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  for (let d = 0.6; d <= V.L; d += 0.55) links.push(shot(g, e, P.x + V.sx * d, P.y, a, { ...LINK, speed: 4.5, range: V.sweep, dmg: D(170) }));
  (e.bx.akChains = e.bx.akChains || []).push({ links, a: a + Math.PI, next: g.t + 0.55, until: g.t + 2.2 });
  g.sfx('chain'); g.vx({ k: 'shake', amt: 3 });
}

// ================================================================ A3 Furnace Teeth (all phases)
// the vents warn 0.85 s, then fire in turn, five 9-shot 120-degree cones 0.65 s apart (95); a cone's gap in its middle,
// then at its sides, by turns. A vent can be broken (16,000 Life): out for 6 s
function teeth(g, e) {
  const S = e.bx; S.akVents = [];
  for (let i = 0; i < 2; i++) {
    if ((S.akVentDown || [])[i] > g.t) { S.akVents.push(null); continue; }
    const P = vent(e, i), q = g.addEnemy('forge_vent', P.x, P.y);
    q.noLoot = true; q.seen = true; q.akVent = i; S.akVents.push(q);
    g.fx.push({ kind: 'ring', x: P.x, y: P.y, t: 0, max: 1.6, color: '#ff6a1c' });
  }
  for (let k = 0; k < 5; k++) later(e, 0.85 + k * 0.65, 'tooth', { k });
  later(e, 4.3, 'teethDone');
  g.sfx('bellows');
}
function tooth(g, e, V) {
  const S = e.bx, i = V.k % 2, q = (S.akVents || [])[i];
  if (!q || q.dead) return;
  const p = target(g, e), a = angleTo(q.x, q.y, p.x, p.y), skip = V.k % 2 ? [1, 7] : [4];
  for (let k = 0; k < 9; k++) if (!skip.includes(k)) shot(g, e, q.x, q.y, a + (k / 8 - 0.5) * deg(120), { ...SLAG, speed: 5.1, range: 13, dmg: D(95) });
  g.vx({ k: 'burst', x: q.x, y: q.y - 0.4, n: 8, colors: FIRE });
}
function teethDone(g, e) { const S = e.bx; for (const q of S.akVents || []) if (q && !q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } S.akVents = null; }

// ================================================================ A4 The Press (I, II)
// 1.25 s; three walls across the hall, from the north and the south by turns, at 1.25, 2.2 and 3.15 s (3.9 tiles a second,
// 110), each with two gaps 3 tiles wide that move 5 tiles between walls
function press(g, e) {
  const { A } = hall(e), S = e.bx, flip = (S.akPress = !S.akPress);
  if (g.banner) g.banner('THE FORGE DESCENDS.', 1600);
  let g1 = A.w * (0.25 + Math.random() * 0.15), g2 = A.w * (0.62 + Math.random() * 0.15);
  for (let w = 0; w < 3; w++) {
    const north = (w % 2 === 0) === flip, y = north ? A.y + 1 : A.y + A.h - 1, gaps = [g1, g2];
    const t = 1.25 + w * 0.95;
    // the wall's line marked where it starts, its gaps left out (the first from the beginning, the rest 0.9 s ahead)
    for (const [s0, s1] of segments(A, gaps)) later(e, Math.max(0, t - (w ? 0.9 : 1.25)), 'pressMark', { x: A.x + s0, y, len: s1 - s0, wait: w ? 0.9 : 1.25 });
    later(e, t, 'pressWall', { y, north, gaps });
    g1 = A.w * 0.12 + ((g1 + 5 - A.w * 0.12) % (A.w * 0.76)); g2 = A.w * 0.12 + ((g2 + 5 - A.w * 0.12) % (A.w * 0.76));
  }
}
function segments(A, gaps) {                                // the solid stretches of a wall, between its gaps
  const out = []; let s = 0.6;
  for (const c of [...gaps].sort((a, b) => a - b)) { if (c - 1.6 > s) out.push([s, c - 1.6]); s = c + 1.6; }
  if (A.w - 0.6 > s) out.push([s, A.w - 0.6]);
  return out;
}
function pressMark(g, e, V) { lane(g, e, V.x, V.y, 0, V.len, V.wait, 0, 0.7, ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff']); }
function pressWall(g, e, V) {
  const { A } = hall(e);
  for (const [s0, s1] of segments(A, V.gaps)) for (let x = s0; x <= s1; x += 0.6) shot(g, e, A.x + x, V.y, V.north ? Math.PI / 2 : -Math.PI / 2, { ...SLAG, speed: 3.9, range: A.h - 1.5, dmg: D(110) });
  g.sfx('hammer'); g.vx({ k: 'shake', amt: 3 });
}

// ================================================================ A5 Molten Faultlines (II, III)
// four jagged fissures across the hall at 45 and 135 degrees, 0.9 s marked; 0.35 s on they spit seven shards along their
// length at 1.25, 2.0 and 2.75 s, out to either side by turns (110)
function faults(g, e, V) {
  const C = mid(e), { A } = hall(e), L = Math.hypot(A.w, A.h) * 0.8, rot = (e.bx.akRot = ((e.bx.akRot || 0) + 1) % 2) ? deg(10) : 0;
  const lines = V.lines || [[deg(45), -4], [deg(45), 4], [deg(135), -4], [deg(135), 4]].map(([a, o]) => [a + rot, o]);
  thud(g, e, e.x, e.y + 0.5);
  for (const [a, o] of lines) {
    const x0 = C.x - Math.sin(a) * o - Math.cos(a) * L / 2, y0 = C.y + Math.cos(a) * o - Math.sin(a) * L / 2;
    lane(g, e, x0, y0, a, L, 1.25, 0, 1);
    for (let k = 0; k < (V.pulses || 3); k++) later(e, (V.first || 1.25) + k * 0.75, 'fault', { x0, y0, a, L, k });
  }
}
function fault(g, e, V) {
  for (let i = 0; i < 7; i++) {
    const d = (i + 0.5) / 7 * V.L, x = V.x0 + Math.cos(V.a) * d, y = V.y0 + Math.sin(V.a) * d, s = (i + V.k) % 2 ? 1 : -1;
    shot(g, e, x, y, V.a + s * Math.PI / 2, { ...SLAG, speed: 5.5, range: 9, dmg: D(110) });
  }
}

// ================================================================ A6 Armor Shatter (II)
// 1.0 s of bright cracks; he tears off four plates and hurls them (3.8, 155), one at you and the rest about him; at 2.0 s
// (a 0.35 s sparkle first) each breaks into five shards (85)
function shatter(g, e) {
  const [cx, cy] = CORE(g, e);
  for (let k = 0; k < 8; k++) g.vx({ k: 'burst', x: cx + Math.cos(k) * 0.8, y: cy + Math.sin(k) * 0.6, n: 3, colors: ['#ff8a1f', '#fff4c4'] });
  later(e, 1.0, 'plates');
}
function plates(g, e) {
  const [ox, oy] = CORE(g, e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y);
  e.bx.akPlates = [0, 1, 2, 3].map((k) => shot(g, e, ox, oy, a + k * Math.PI / 2, { ...CHUNK, speed: 3.8, range: 12, dmg: D(155), mv: { split: { at: 1.0, n: 5, speed: 5.0, range: 6, proj: 'slag_shard' } } }));
  later(e, 0.65, 'sparkle');
  g.vx({ k: 'burst', x: ox, y: oy, n: 18, colors: GLASS }); g.sfx('shatter');
}
function sparkle(g, e) { for (const b of e.bx.akPlates || []) if (b.life > 0) g.vx({ k: 'burst', x: b.x, y: b.y, n: 6, colors: ['#ffffff', '#ffd650'] }); }

// ================================================================ A7 Scything Links (III)
// two broken chains swing round him on opposite sides, each a 90-degree arc 5 tiles out, 95 degrees a second for 5.5 s
// (110), their path shown 0.6 s ahead; at 2.0 and 4.0 s each throws four links off its leading end (105)
function scythe(g, e) {
  if (g.banner) g.banner('THE CHAINS WILL FOLLOW YOU.', 1800);
  const q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y) + Math.PI / 2, s = (e.bx.akSc = -(e.bx.akSc || 1));
  e.bx.akScythe = { a0, s, w: deg(95), t0: g.t + 1.0, until: g.t + 6.5, links: null, cx: e.x, cy: e.y };
  later(e, 1.0, 'scytheGo'); later(e, 3.0, 'scytheFan'); later(e, 5.0, 'scytheFan');
  g.sfx('chain');
}
const scytheAt = (Q, t, arc, j) => Q.a0 + arc * Math.PI + Q.s * Q.w * Math.max(0, t - Q.t0) + (j / 7 - 0.5) * (Math.PI / 2);
function scytheGo(g, e) {
  const Q = e.bx.akScythe; if (!Q) return;
  Q.links = [];
  for (let arc = 0; arc < 2; arc++) for (let j = 0; j < 8; j++) {
    const a = scytheAt(Q, g.t, arc, j), b = shot(g, e, Q.cx + Math.cos(a) * 5, Q.cy + Math.sin(a) * 5, a + Q.s * Math.PI / 2, { ...LINK, speed: 0.01, range: 1, dmg: D(110) });
    b.life = 6; b.akArc = arc; b.akJ = j; Q.links.push(b);
  }
}
function scytheFan(g, e) {
  const Q = e.bx.akScythe; if (!Q) return;
  for (let arc = 0; arc < 2; arc++) {
    const a = scytheAt(Q, g.t, arc, Q.s > 0 ? 7 : 0), x = Q.cx + Math.cos(a) * 5, y = Q.cy + Math.sin(a) * 5, t = a + Q.s * Math.PI / 2;
    for (let k = 0; k < 4; k++) shot(g, e, x, y, t + (k / 3 - 0.5) * deg(40), { ...LINK, speed: 5.5, range: 11, dmg: D(105) });
  }
  g.sfx('chain');
}

// ================================================================ A8 Forge Hunt (III)
// three charges at you, each marked 0.85 s (the line locked), up to 5 tiles in 0.65 s (210); at the end of each, seven slow
// wide cinders on the way he went (90)
function hunt(g, e, V) { for (let k = 0; k < (V.n || 3); k++) later(e, k * 1.9, 'charge'); }
function charge(g, e) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), { A } = hall(e);
  let L = Math.min(5, Math.hypot(q.x - e.x, q.y - e.y) + 1);
  while (L > 0.5) {                                        // (never through a wall or out of his hall)
    const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L;
    if (x > A.x + 1.8 && x < A.x + A.w - 1.8 && y > A.y + 1.8 && y < A.y + A.h - 1.8) break;
    L -= 0.5;
  }
  lane(g, e, e.x, e.y, a, L + 1, 0.85, 0, 2.2, ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff']);
  e.akDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + 0.85, until: g.t + 1.5, a, hit: false };
}

// ================================================================ A9 Inverted Anvil (III)
// 0.9 s; two rings of sixteen shards out from him 0.55 s apart (105, 4.0); at 2.8 s every one still flying flashes for
// 0.55 s, then comes back the way it went, to where it began, and stops there (5.2, 115)
function inverted(g, e) {
  g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 3, color: '#ffd650' });
  e.bx.akInv = [];
  for (let w = 0; w < 2; w++) later(e, 0.9 + w * 0.55, 'invRing', { w });
  later(e, 2.8, 'invHold'); later(e, 3.35, 'invBack');
}
function invRing(g, e, V) {
  const off = (V.w * Math.PI) / 16, x = e.x, y = e.y;
  for (let k = 0; k < 16; k++) { const b = shot(g, e, x, y, off + (k / 16) * TAU, { ...SLAG, speed: 4.0, range: 14, dmg: D(105) }); b.akFrom = [x, y]; b.life = 5; e.bx.akInv.push(b); }
  thud(g, e, x, y);
}
function invHold(g, e) { for (const b of e.bx.akInv || []) if (b.life > 0) { b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1); g.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#ffffff'] }); } g.sfx('zap'); }
function invBack(g, e) {
  for (const b of e.bx.akInv || []) {
    if (!(b.life > 0)) continue;
    const [fx, fy] = b.akFrom, d = Math.hypot(fx - b.x, fy - b.y), a = Math.atan2(fy - b.y, fx - b.x);
    b.vx = Math.cos(a) * 5.2; b.vy = Math.sin(a) * 5.2; b.a = a; b.dmg = g.bxDmg(e, D(115)); b.life = Math.max(0.05, (d - 0.6) / 5.2);   // (gone short of where it began: nothing bursts there)
  }
  e.bx.akInv = null;
}

// ================================================================ A10 The Gatebreaker (III, below 15%)
function gatebreaker(g, e) {
  const S = e.bx, q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y) + Math.PI / 2;
  if (!S.akGateSaid) { S.akGateSaid = true; if (g.banner) g.banner('NO CHAIN CAN HOLD ME.', 2400); g.sfx('roar'); g.vx({ k: 'shake', amt: 10 }); }
  for (const a of [a0, a0 + Math.PI]) lane(g, e, e.x, e.y, a, 13, 3.4, 0, 3, CYAN);          // t 0-1.2: two safe corridors, kept to 3.4 s
  for (let w = 0; w < 2; w++) later(e, 1.2 + w * 1.1, 'gateLinks', { a0, w });             // t 1.2-3.4: two sweeps of 12 links, curling in
  [-40, 40, 0].forEach((s, k) => later(e, 3.7 + k * 0.8, 'gateCone', { side: s }));         // t 3.7-6.1: three hammer cones, left, right, middle
  for (let gr = 0; gr < 2; gr++) later(e, 6.2 + gr * 1.55, 'gateFaults', { gr });           // t 6.2-9.3: eight fissures, two groups of four
}
function gateLinks(g, e, V) {
  for (let k = 0; k < 12; k++) {
    const a = V.a0 + (V.w ? Math.PI / 12 : 0) + (k / 12) * TAU;
    const off = (d) => Math.abs(Math.atan2(Math.sin(a - d), Math.cos(a - d)));
    if (off(V.a0) < 0.22 || off(V.a0 + Math.PI) < 0.22) continue;   // (the corridors stay clear)
    shot(g, e, e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12, a + Math.PI, { ...LINK, speed: 4.6, range: 11.4, dmg: D(105), mv: { curve: V.w ? -0.18 : 0.18 } });
  }
  g.sfx('chain');
}
function gateCone(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y) + deg(V.side);
  cleave(g, e, e.x, e.y, a, 5, deg(110), 0.7, D(235));
  later(e, 0.7, 'sentenceWave', { a, n: 11, dmg: 125, off: 0 });
}
function gateFaults(g, e, V) {
  const lines = V.gr ? [[0, -5], [0, 5], [Math.PI / 2, -6], [Math.PI / 2, 6]] : [[deg(45), -3], [deg(45), 5], [deg(135), -3], [deg(135), 5]];
  faults(g, e, { lines, first: 1.0, pulses: 1 });
}

// ================================================================ under the cycle: the anchors (I, II), his core (III)
// by turns at you and where you are going (a steady circle is no way through)
function anchorShot(g, e) {
  const S = e.bx, ids = S.phase === 1 ? [0, 1, 2, 3] : [0, 1], n = (S.akAn = (S.akAn || 0) + 1);
  const i = ids[n % ids.length], P = anchor(e, i), q = target(g, e), [tx, ty] = n % 2 ? ahead(g, e, 0.9) : [q.x, q.y], a = angleTo(P.x, P.y, tx, ty);
  for (let k = 0; k < 4; k++) shot(g, e, P.x, P.y, a + (k - 1.5) * deg(11), { ...LINK, speed: 5, range: 16, dmg: D(85) });
  g.vx({ k: 'burst', x: P.x, y: P.y, n: 6, colors: FIRE });
}
function coreShot(g, e) {
  const S = e.bx, n = (S.akCo = (S.akCo || 0) + 1), [cx, cy] = CORE(g, e), q = target(g, e), [tx, ty] = n % 2 ? ahead(g, e, 0.8) : [q.x, q.y], a = angleTo(cx, cy, tx, ty);
  for (let k = 0; k < 4; k++) shot(g, e, cx, cy, a + (k - 1.5) * deg(11), { sprite: 'cinder', size: 0.5, speed: 6, range: 14, dmg: D(90) });
}

// ================================================================ the director: the spec's cycles
const P = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  sentence: P("Anvil's Sentence", 'sentence', 2.1), chains: P('Red-Hot Chains', 'chains', 3.3), teeth: P('Furnace Teeth', 'teeth', 4.3),
  press: P('The Press', 'press', 4.2), faults: P('Molten Faultlines', 'faults', 3.0), shatter: P('Armor Shatter', 'shatter', 2.4),
  scythe: P('Scything Links', 'scythe', 6.5, { move: 'hold' }), hunt: P('Forge Hunt', 'hunt', 6.4, { move: 'hold' }),
  inverted: P('Inverted Anvil', 'inverted', 5.6, { move: 'hold' }), gate: P('The Gatebreaker', 'gatebreaker', 11.5, { move: 'hold' }),
};
const CYCLE = {
  1: { len: 20, list: [[0, 'chains'], [3.8, 'sentence'], [7.5, 'teeth'], [12.5, 'press']] },
  2: { len: 23, list: [[0, 'faults'], [3.3, 'sentence'], [6.8, 'shatter'], [11.4, 'teeth'], [15.2, 'chains'], [19.5, 'press']] },
  3: { len: 24, list: [[0, 'scythe'], [6.7, 'hunt'], [13.0, 'inverted'], [18.0, 'sentence']] },
};
const LAST = ['gate', 'sentence', 'hunt'];                 // below 15%
function choose(g, e) {
  const S = e.bx, C = S.akDir && S.akDir.ph === S.phase ? S.akDir : (S.akDir = { ph: S.phase, t0: g.t, i: 0, last: 0 });
  if (S.phase === 3 && e.hp / e.maxHp <= 0.15) return AT[LAST[C.last++ % LAST.length]];   // (each starts once the last has run its course)
  const Y = CYCLE[S.phase] || CYCLE[3];
  if (C.i >= Y.list.length) { if (g.t < C.t0 + Y.len) return null; C.t0 = g.t; C.i = 0; }
  const [off, k] = Y.list[C.i];
  if (g.t < C.t0 + off) return null;
  C.i++;
  return AT[k];
}

export default {
  id: 'ashkar_gatekeeper', art: 'ashkar_gatekeeper', drawScale: 0.5, name: 'Ashkar, the Chained Forge-Giant', biome: 'dungeon', hp: 540000, def: 30, xp: 16000,
  r: 1.2, speed: 3.3, keep: 4, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.70, 0.35], morphGrace: 1.4,
  phases: {
    1: { move: 'bound', patterns: Object.values(AT), pressure: [{ special: 'anchorShot', every: 1.35, delay: 1.5 }] },
    2: { move: 'prowl', patterns: Object.values(AT), pressure: [{ special: 'anchorShot', every: 1.35, delay: 1.5 }] },
    3: { move: 'hunt', patterns: Object.values(AT), pressure: [{ special: 'coreShot', every: 1.15, delay: 1.5 }] },
  },
  choose,
  specials: { sentence, sentenceLock, sentenceWave, chains, chainSweep, teeth, tooth, teethDone, press, pressMark, pressWall, faults, fault, shatter, plates, sparkle,
    scythe, scytheGo, scytheFan, hunt, charge, inverted, invRing, invHold, invBack, gatebreaker, gateLinks, gateCone, gateFaults, anchorShot, coreShot },
  moves: {
    bound(g, e) { const H = e.akHome || (e.akHome = { x: e.x, y: e.y }); e.x = H.x; e.y = H.y; },   // I: held at his chains
    prowl(g, e, dt) {                                      // II: 3.3 tiles a second, never more than 7 from the middle
      const p = target(g, e), C = mid(e), a = angleTo(p.x, p.y, e.x, e.y) + Math.sin(e.bx.t * 0.5) * 0.6;
      let tx = p.x + Math.cos(a) * 4, ty = p.y + Math.sin(a) * 4; const d = Math.hypot(tx - C.x, ty - C.y);
      if (d > 7) { tx = C.x + (tx - C.x) * 7 / d; ty = C.y + (ty - C.y) * 7 / d; }
      const dd = Math.hypot(tx - e.x, ty - e.y); if (dd > 0.2) g.moveCircle(e, ((tx - e.x) / dd) * Math.min(dd, 3.3 * dt), ((ty - e.y) / dd) * Math.min(dd, 3.3 * dt), 0.8);
    },
    hunt(g, e, dt) {                                       // III: after you, steadily (his charges are the quick part)
      const p = target(g, e), d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d > 3) g.moveCircle(e, ((p.x - e.x) / d) * 2.6 * dt, ((p.y - e.y) / d) * 2.6 * dt, 0.8);
    },
  },
  onWake(g) { if (g.banner) g.banner('THE CHAINED FORGE-GIANT', 2800); },
  onPhase(g, e, ph) {
    const S = e.bx, [cx, cy] = CORE(g, e);
    S.akScythe = null; S.akChains = null; e.akDash = null;
    if (ph === 2) {                                        // the armour cracks; two chains break; ash, but no harm
      if (g.banner) g.banner('THE FURNACE FRACTURES', 2400);
      g.vx({ k: 'shake', amt: 8 }); g.vx({ k: 'burst', x: cx, y: cy, n: 40, colors: [...GLASS, ...FIRE] }); g.sfx('shatter');
    }
    if (ph === 3) {                                        // he breaks free: the anchors scatter
      if (g.banner) g.banner('THE CHAINS BREAK', 3000);
      S.akUnchained = g.t; g.vx({ k: 'shake', amt: 12 }); g.sfx('roar');
      g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 9, color: '#ffd650' });
      for (let i = 0; i < 4; i++) { const A = anchor(e, i); g.vx({ k: 'burst', x: A.x, y: A.y, n: 18, colors: ['#a39bb2', '#766e84', ...FIRE] }); }
    }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const Dh = e.akDash;                                   // a charge in flight: it strikes you once, then cinders where it ends
    if (Dh && g.t >= Dh.at) {
      if (g.t >= Dh.until) {
        e.akDash = null;
        for (let k = 0; k < 7; k++) shot(g, e, e.x, e.y, Dh.a + (k / 6 - 0.5) * deg(100), { sprite: 'cinder', size: 0.55, speed: 4.8, range: 9, dmg: D(90) });
        thud(g, e, e.x, e.y);
      } else {
        const k = (g.t - Dh.at) / (Dh.until - Dh.at); e.x = Dh.x0 + (Dh.x1 - Dh.x0) * k; e.y = Dh.y0 + (Dh.y1 - Dh.y0) * k;
        const p = g.player; if (!Dh.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.5) { Dh.hit = true; g.hurtPlayer(g.bxDmg(e, D(210)), e.D.name); }
      }
    }
    for (const C of S.akChains || []) {                    // the sweeping chains shed links behind them
      if (g.t > C.until) continue;
      if (g.t >= C.next) {
        C.next += 0.55; const live = C.links.filter((b) => b.life > 0);
        for (let k = 0; k < 5 && live.length; k++) { const b = live[Math.floor(((k + 0.5) / 5) * live.length)]; shot(g, e, b.x, b.y, C.a, { ...LINK, speed: 4.8, range: 8, dmg: D(100) }); }
      }
    }
    if (S.akChains) S.akChains = S.akChains.filter((C) => g.t <= C.until);
    const Q = S.akScythe;                                  // the scything links, turning about where he stands
    if (Q) {
      if (g.t > Q.until) { for (const b of Q.links || []) b.life = 0; S.akScythe = null; }
      else for (const b of Q.links || []) if (b.life > 0) { const a = scytheAt(Q, g.t, b.akArc, b.akJ); b.x = Q.cx + Math.cos(a) * 5; b.y = Q.cy + Math.sin(a) * 5; b.vx = 0; b.vy = 0; b.a = a + Q.s * Math.PI / 2; }
    }
    for (const q of S.akVents || []) if (q && q.dead && !(S.akVentDown || [])[q.akVent]) { (S.akVentDown = S.akVentDown || [])[q.akVent] = g.t + 6; }
    if (S.akVentDown) S.akVentDown = S.akVentDown.map((t) => (t > g.t ? t : 0));
    if (S.akHot && g.t > S.akHot.until) S.akHot = null;
    if (S.phase === 3 && Math.random() < 0.3) { const [cx, cy] = CORE(g, e); g.vx({ k: 'burst', x: cx + (Math.random() - 0.5), y: cy + (Math.random() - 0.5), n: 2, colors: FIRE }); }
  },
  onDeath(g, e) {                                          // the hammer falls, the core implodes, the chains fall silent
    const S = e.bx, [cx, cy] = CORE(g, e);
    teethDone(g, e); e.akDash = null; S.akHot = null; S.akScythe = null; S.akChains = null; S.akDead = true;
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; g.vx({ k: 'burst', x: cx + Math.cos(a) * 3, y: cy + Math.sin(a) * 3, n: 6, colors: FIRE }); }
    g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 5, color: '#fff4c4' }); g.vx({ k: 'shake', amt: 10 }); g.sfx('hammer');
    if (g.banner) g.banner('THE GREAT SUN DOOR IS UNSEALED.', 3200);
    const m = g.map; if (m.lights) m.lights = m.lights.filter((L) => !L.gate);
  },
  // under him: the four anchors and their chains to his wrists (I all four; II the south two broken; III all snapped, the
  // anchors' stubs left; red-hot when he works them; dark on the floor once he falls), and the scything links' path ahead
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, ph = S.phase || 1, [sx, sy] = r.proj(e.x, e.y), hot = S.akHot && g.t < S.akHot.until ? S.akHot.ids : [];
    for (let i = 0; i < 4; i++) {
      const A = anchor(e, i), [ax, ay] = r.proj(A.x, A.y), side = A.x < e.x ? -1 : 1, wx = sx + (side < 0 ? -26 : 40), wy = sy - (side < 0 ? 57 : 40);   // (his wrists, on the user's sprite)
      b.fillStyle = '#0e0a12'; b.fillRect(Math.round(ax) - 6, Math.round(ay) - 6, 12, 12);   // the anchor: an iron block, a ring
      b.fillStyle = '#433d4e'; b.fillRect(Math.round(ax) - 5, Math.round(ay) - 5, 10, 10);
      b.fillStyle = '#615a70'; b.fillRect(Math.round(ax) - 5, Math.round(ay) - 5, 10, 2);
      b.fillStyle = hot.includes(i) ? '#ff6a1c' : '#1c1822'; b.fillRect(Math.round(ax) - 2, Math.round(ay) - 2, 4, 4);
      if (ph === 3 && !S.akDead) continue;                 // (III: scattered: only the anchor blocks remain)
      const broken = ph === 2 && i >= 2, L = Math.hypot(wx - ax, wy - ay), n = Math.max(2, Math.floor(L / 5));
      const red = hot.includes(i), sag = S.akDead ? 18 : ph === 2 ? 10 : 2;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        if (broken && !S.akDead && t > 0.3) continue;      // broken: a stub at the anchor
        const x = ax + (wx - ax) * t, y = ay + (wy - ay) * t + Math.sin(t * Math.PI) * sag;
        b.fillStyle = '#0e0a12'; b.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        b.fillStyle = S.akDead ? '#2c2834' : red ? ((k + Math.floor(g.t * 14)) % 2 ? '#ffd650' : '#ff6a1c') : k % 2 ? '#8c84a2' : '#615a70';
        b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2);
      }
    }
    const Q = S.akScythe;                                  // the scything links' path, 0.6 s ahead of them
    if (Q && g.t < Q.until) {
      b.fillStyle = '#ff6a1c'; b.globalAlpha = 0.45;
      for (let arc = 0; arc < 2; arc++) for (let j = 0; j < 8; j++) { const a = scytheAt(Q, g.t + 0.6, arc, j), [x, y] = r.proj(Q.cx + Math.cos(a) * 5, Q.cy + Math.sin(a) * 5); b.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 2); }
      b.globalAlpha = 1;
    }
  },
  lights(g, e) { const ph = e.bx.phase || 1; return [{ x: e.x, y: e.y, h: 4.4, r: ph === 3 ? 110 : ph === 2 ? 90 : 60, col: '#ff8a1f', fire: true }]; },
  // his relics (boss_loot.js gives them their real, rare chances), and every class's gear in his band
  loot: [{ id: 'fetterbreaker', p: 0.1 }, { id: 'slagplate', p: 0.1 }, { id: 'the_last_link', p: 0.1 }, { id: 'gatekeepers_chain', p: 0.1 }], lootLuck: 1.3,
};
