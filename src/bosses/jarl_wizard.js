// The Hollow Jarl, Wizard (2026-11-02 redesign, the user: "a coordinated two-stage fight"; src/bosses/jarl_court.js).
// STAGE 1, 'THE WARRIOR'S HUNT': he sits a warded throne at the court's north end (nothing touches him: WARDED) and keeps
// two to four spectral portals about the court, by sequences (each portal can be broken but the four corners'; a broken
// one stops firing, and the court opens up):
//   T1 Staggered Spreads   east and west: five bolts in a 40-degree fan by turns every 0.7 s for 6 s, at you and where
//                          you are going (85)
//   T2 Crossing Volleys    the four corners, by diagonal pairs every 1.0 s for 6 s: a dashed line of four across the
//                          court, between its middle and you (90); the lines cross
//   T3 Rotating Streams    north-left, north-right, south: a bolt every 0.15 s from each for 5 s, their aims turning 70
//                          degrees a second, the north two against each other (80)
//   T4 Judgement           two portals by turns, three times: a lane to you 0.7 s (locked at 0.45), then a heavy lance
//                          down it (140) and a bolt either side (85)
// STAGE 2, 'THE MAGE UNBOUND': the Warrior dead, the throne shatters and he comes down (his change of form). He steps by
// blinking between five marks on the court's floor (where he will be shown 0.5 s first), and fights:
//   M1 Runic Wheel         four arms of bolts from him (five in III), a bolt an arm every 0.14 s for 4.2 s, the wheel
//                          turning 45 degrees a second (55 in III), the way alternating: the openings move (90)
//   M2 Crossfire           east and west portals by turns, six times 0.6 s apart: thirteen bolts over 100 degrees with a
//                          three-bolt opening that moves one along each time (95); in III north and south join, across
//   M3 Converging Sigils   a ring of 22 runes 7.5 tiles round you, three dark (the way out), 0.8 s; each fires inward
//                          (100); a second ring 1.2 s on, 8.5 tiles, its opening elsewhere
//   M4 Returning Royalty   a ring of twelve lances, two slots empty (115); 1.55 s on they stop and flash, then fly back
//   M5 Lance Inquisition   six waves of five lances, at you and where you will be by turns (105)
//   M6 Ritual Anchors      'BREAK THE ANCHORS.': three anchors (9,000 Life) on marks, tethered to him, each a ring of six
//                          every 1.5 s (80); all broken inside 9 s and he FALTERS 3.5 s (taking a third more); else they
//                          burst, sixteen bolts each (120)
// In III (40%) his rests are shorter and the wheel runs under what comes next (overlaps by design, not spam).
// Damage numbers are effective ones (D(n): set above a Throne-geared character's Defense).
// (2026-11-02, the user's polish spec, 10: "the Mage should feel like a terrifying master of battlefield control".) On the
// throne: Hollow Gateways (three portals, a six-fan from each by turns, a volley every 1.1 s from each, 85, 8 s), Spectral
// Crossfire (west and east, walls of nine crossing, a corridor always left, 95; the Warrior charges with it), Royal
// Condemnation (three marked bands across the court, 1.1 s, lances down them, 125; again across), and his Rotating Streams.
// Unbound: Runic Cataclysm (four runes turning round him, each a volley every 0.6 s by turns, 100, 6 s), Hollow
// Convergence (four portals' rotating streams, 95, and his own aimed lances every second, 125; 7 s), Spectral Prison
// (eight runes round you closing over 2.5 s, three gone dark as the way out, the rest firing inward, 110), the Converging
// Sigils, Returning Royalty, Lance Inquisition, the Ritual Anchors (broken in time: he falters 1.8 s); in III his own:
// The Unmaking (about 9 s: returning lances, the runes' turning walls, portal crossfire, a converging ring; 1.3 s
// recovery, then he falters 1.8 s). His every step a teleport in full (src below: blink).
// Art: tools/build_jarl_wizard.py ('bx_jarl_wizard', 'wiz_shots/<name>', 'wiz_kin/portal').
import { TAU, angleTo, target, ahead } from './kit.js';
import { courtOf, courtTick, partner, enthroned } from './jarl_court.js';

const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const BOLT = { sprite: 'wiz_shots/bolt', size: 0.34 }, LANCE = { sprite: 'wiz_shots/lance', size: 0.4 }, HEAVY = { sprite: 'wiz_shots/lance', size: 0.6 };
const SPIRIT = ['#b884cc', '#e6c8ff', '#8e4ca8'], VIOLET = ['#b884cc', '#b884cc', '#b884cc', '#ffffff'];
const show = (g, e, x, y, a, len, delay, w = 0.6) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols: VIOLET });
const circle = (g, e, x, y, r, delay, dmg) => g.fx.push({ kind: 'zone', src: e, x, y, r, t: 0, delay, life: delay + 0.15, dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, done: !dmg, colors: SPIRIT });
// the court, in the spec's own 40x34 tiles, fitted to the room
const court = (e) => e.room || { x: Math.floor(e.x) - 20, y: Math.floor(e.y) - 4, w: 40, h: 34 };
const at40 = (e, sx, sy) => { const C = court(e); return { x: C.x + (sx / 40) * C.w, y: C.y + (sy / 34) * C.h }; };
const THRONE = (e) => at40(e, 20, 4.5);
const SPOT = { W: [4, 17], E: [36, 17], NW: [5, 5], NE: [35, 5], SE: [35, 29], SW: [5, 29], NL: [11, 8], NR: [29, 8], N: [20, 9], S: [20, 30] };
const MARKS = (e) => [[10, 9], [30, 9], [30, 25], [10, 25], [20, 17]].map(([x, y]) => at40(e, x, y));
const FEET = (g, e) => [e.x, e.y];                         // (every boss shot from its feet: the user's rule)

// a portal: it hangs in the air, can be broken, and closes by itself; never opened on top of you (pushed off 3 tiles)
function portal(g, e, key, life, hp) {
  let { x, y } = at40(e, ...SPOT[key]);
  const p = g.player, C = court(e);
  if (p && !p.dead && Math.hypot(p.x - x, p.y - y) < 3) { const d = Math.hypot(x - p.x, y - p.y) || 1; x += ((x - p.x) / d) * 3; y += ((y - p.y) / d) * 3; }
  x = Math.max(C.x + 1.5, Math.min(C.x + C.w - 1.5, x)); y = Math.max(C.y + 1.5, Math.min(C.y + C.h - 1.5, y));
  const q = g.addEnemy('wiz_portal', x, y);
  q.noLoot = true; q.seen = true; q.jzUntil = g.t + life; if (hp) q.hp = q.maxHp = hp;
  g.vx({ k: 'burst', x, y, n: 14, colors: SPIRIT });
  (e.bx.jzPortals = e.bx.jzPortals || []).push(q);
  return q;
}
// a portal anywhere, its colour what it does (2026-11-04, the user: "Use different portal colors ... to distinguish
// behavior/patterns"): violet his old gateways, gold the Revolving Gate, cyan the Portal Tide, crimson the Pentagram
const GOLD = '#ffd650', CYAN = '#5ad8ff', CRIM = '#ff5a7a';
function portalAt(g, e, x, y, life, hp, col) {
  const p = g.player, C = court(e);
  if (p && !p.dead && Math.hypot(p.x - x, p.y - y) < 2.5) { const d = Math.hypot(x - p.x, y - p.y) || 1; x += ((x - p.x) / d) * 2.5; y += ((y - p.y) / d) * 2.5; }
  x = Math.max(C.x + 1.5, Math.min(C.x + C.w - 1.5, x)); y = Math.max(C.y + 1.5, Math.min(C.y + C.h - 1.5, y));
  const q = g.addEnemy('wiz_portal', x, y);
  q.noLoot = true; q.seen = true; q.jzUntil = g.t + life; q.jzCol = col; if (hp) q.hp = q.maxHp = hp;
  g.vx({ k: 'burst', x, y, n: 14, colors: [col, '#ffffff', col] });
  (e.bx.jzPortals = e.bx.jzPortals || []).push(q);
  return q;
}
const callWarrior = (e) => { const W = partner(e); if (W && W.bx && !W.dead) W.bx.jwCall = true; };   // (the Warrior charges with it)
const closePortals = (e) => { for (const q of e.bx.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.bx.jzPortals = []; };
const live = (q) => q && !q.dead;
const opening = (g, e, keys, delay) => { for (const k of keys) { const s = at40(e, ...SPOT[k]); circle(g, e, s.x, s.y, 1.1, delay, 0); } g.sfx('portal'); };

// ================================================================ stage 1: the throne's sequences (S.jzSeq, run in update)
function spreads(g, e) { opening(g, e, ['NW', 'NE', 'SE', 'SW'], 0.9); later(e, 0.9, 'seqOpen', { kind: 'spread', keys: ['NW', 'NE', 'SE', 'SW'], dur: 8, hp: 7000, every: 1.1 / 4 }); }   // (Hollow Gateways: four)
function crossing(g, e) { opening(g, e, ['W', 'E'], 0.8); later(e, 0.8, 'seqOpen', { kind: 'cross', keys: ['W', 'E'], dur: 6, hp: 9000, every: 1.0 }); const W = partner(e); if (W && W.bx) W.bx.jwCall = true; }   // (Spectral Crossfire: the Warrior charges with it)
function condemn(g, e) { later(e, 0, 'condemnSet', { k: 0 }); later(e, 2.2, 'condemnSet', { k: 1 }); }   // (Royal Condemnation: no portals; marked bands, then lances)
function condemnSet(g, e, V) {
  const C = court(e), q = target(g, e), vert = (V.k + (e.bx.jzCk = (e.bx.jzCk || 0) + 1)) % 2, span = vert ? C.w : C.h, n = 3, safe = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) { if (i === safe) continue; const o = (i + 0.5) / 4 * span + (Math.random() - 0.5) * 2, x = vert ? C.x + o : C.x + 1, y = vert ? C.y + 1 : C.y + o;
    g.fx.push({ kind: 'lane', x, y, a: vert ? Math.PI / 2 : 0, len: (vert ? C.h : C.w) - 2, w: 2.6, delay: 1.1, t: 0, life: 1.45, every: 0.5, dmg: g.bxDmg(e, D(125)), by: e.D.name, hitT: 0, cols: VIOLET }); }
  g.sfx('zap'); void n; void q;
}
function streams(g, e) { opening(g, e, ['NL', 'NR', 'S'], 0.8); later(e, 0.8, 'seqOpen', { kind: 'stream', keys: ['NL', 'NR', 'S'], dur: 5, hp: 7000, every: 0.15 }); }
function judgement(g, e) { opening(g, e, ['NL', 'NR'], 0.7); later(e, 0.7, 'seqOpen', { kind: 'judge', keys: ['NL', 'NR'], dur: 4.2, hp: 7000, every: 1.3 }); }
function seqOpen(g, e, V) { e.bx.jzSeq = { kind: V.kind, ps: V.keys.map((k) => portal(g, e, k, V.dur + 0.4, V.hp)), every: V.every, t: V.kind === 'stream' ? 0 : 0.3, k: 0, t0: g.t, until: g.t + V.dur }; }
function seqTick(g, e, Q, dt) {
  if ((Q.t -= dt) > 0) return;
  Q.t += Q.every;
  const p = target(g, e), C = court(e), k = Q.k++;
  if (Q.kind === 'spread') {                                // Hollow Gateways: a six-fan from each by turns
    const q = Q.ps[k % Q.ps.length]; if (!live(q)) return;
    const [tx, ty] = k % 6 >= 3 ? ahead(g, e, 0.6) : [p.x, p.y], a = angleTo(q.x, q.y, tx, ty);
    for (let i = 0; i < 8; i++) shot(g, e, q.x, q.y, a + (i / 7 - 0.5) * deg(64), { ...BOLT, speed: 5.6, range: 30, dmg: D(85) });
  } else if (Q.kind === 'cross') {                         // Spectral Crossfire: a wall of nine from each, crossing; a corridor always left in each (it moves)
    const gap = k % 7;
    Q.ps.forEach((q, i) => { if (!live(q)) return; const a = angleTo(q.x, q.y, p.x, p.y) + (i ? 1 : -1) * deg(12);
      for (let j = 0; j < 9; j++) { if (j === gap || j === gap + 1) continue; shot(g, e, q.x, q.y, a + (j / 8 - 0.5) * deg(110), { ...BOLT, speed: 4.8, range: 34, dmg: D(95) }); } });
  } else if (Q.kind === 'stream') {
    const T = g.t - Q.t0, mid = { x: C.x + C.w / 2, y: C.y + C.h / 2 };
    Q.ps.forEach((q, i) => { if (!live(q)) return; const turn = (i === 0 ? 1 : i === 1 ? -1 : Math.sin(T * 1.3)) * deg(70) * T, a = angleTo(q.x, q.y, mid.x, mid.y) + turn; for (const o of [0, Math.PI]) shot(g, e, q.x, q.y, a + o, { ...BOLT, speed: 4.6, range: 30, dmg: D(80) }); });
  } else if (Q.kind === 'judge') {
    const q = Q.ps[k % 2]; if (!live(q) || g.t > Q.until - 1) return;
    const a = angleTo(q.x, q.y, p.x, p.y);
    show(g, e, q.x, q.y, a, 24, 0.45, 0.8);
    later(e, 0.45, 'judgeLock', { i: k % 2 });
  }
}
function judgeLock(g, e, V) {                              // the lane locked; 0.25 s on, the heavy lance down it
  const Q = e.bx.jzSeq; if (!Q || Q.kind !== 'judge') return; const q = Q.ps[V.i]; if (!live(q)) return;
  const p = target(g, e), a = angleTo(q.x, q.y, p.x, p.y);
  show(g, e, q.x, q.y, a, 24, 0.25, 1.1);
  later(e, 0.25, 'judgeFire', { i: V.i, a });
}
function judgeFire(g, e, V) {
  const Q = e.bx.jzSeq; if (!Q) return; const q = Q.ps[V.i]; if (!live(q)) return;
  shot(g, e, q.x, q.y, V.a, { ...HEAVY, speed: 7.5, range: 26, dmg: D(140) });
  for (const o of [-1, 1]) shot(g, e, q.x, q.y, V.a + o * deg(16), { ...BOLT, speed: 6, range: 22, dmg: D(85) });
  g.sfx('zap');
}

// ================================================================ the portals' new patterns (2026-11-04, the user: "rotating portal
// patterns, staggered crossfire, portal waves, temporary portal formations, different firing rhythms")
// REVOLVING GATE (gold): four portals (five in III) round the court's middle, turning about it for 7 s, each throwing two
// bolts in across the court every 0.24 s (the spokes turn with them: 85) and a lance at you every 1.3 s (110)
function orbit(g, e) {
  const C = court(e), cx = C.x + C.w / 2, cy = C.y + C.h / 2, R = Math.min(C.w, C.h) * 0.34, a0 = Math.random() * TAU, n = (e.bx.phase || 1) >= 3 ? 5 : 4;
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; circle(g, e, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1.1, 0.8, 0); }
  g.sfx('portal'); if (g.banner) g.banner('THE GATE TURNS.', 1100);
  later(e, 0.8, 'orbitOpen', { cx, cy, R, a0, n }); e.bx.jzBusy = g.t + 8.2; callWarrior(e);
}
function orbitOpen(g, e, V) {
  const S = e.bx, dir = (S.jzOd = -(S.jzOd || 1));
  S.jzOrbit = { ps: Array.from({ length: V.n }, (_, i) => { const a = V.a0 + (i / V.n) * TAU; return portalAt(g, e, V.cx + Math.cos(a) * V.R, V.cy + Math.sin(a) * V.R, 7.4, 7000, GOLD); }),
    cx: V.cx, cy: V.cy, R: V.R, a0: V.a0, dir, t0: g.t, until: g.t + 7, next: g.t + 0.3, aim: g.t + 1.2 };
}
function orbitTick(g, e, O) {
  const T = g.t - O.t0, n = O.ps.length, at = (i) => O.a0 + O.dir * 0.55 * T + (i / n) * TAU;
  O.ps.forEach((q, i) => { if (live(q)) { q.x = O.cx + Math.cos(at(i)) * O.R; q.y = O.cy + Math.sin(at(i)) * O.R; } });
  if (g.t >= O.next) { O.next += 0.24; O.ps.forEach((q, i) => { if (!live(q)) return; const a = at(i) + Math.PI + O.dir * deg(20); for (const o of [-deg(24), deg(24)]) shot(g, e, q.x, q.y, a + o, { ...BOLT, speed: 4.2, range: 2 * O.R + 2, dmg: D(85), free: true }); }); }
  if (g.t >= O.aim) { O.aim += 1.3; const p = target(g, e); O.ps.forEach((q) => { if (live(q)) shot(g, e, q.x, q.y, angleTo(q.x, q.y, p.x, p.y), { ...LANCE, speed: 6.5, range: 26, dmg: D(110), free: true }); }); g.sfx('zap'); }
}
// PORTAL TIDE (cyan): five portals open along one wall one after another, each firing three across the court every
// 0.45 s, one of them silent each time (the opening walks along the wall: 90); 3.2 s on the far wall opens the same,
// the two tides crossing for a moment
function tide(g, e) { const side = Math.floor(Math.random() * 4); later(e, 0, 'tideSide', { side }); later(e, 3.2, 'tideSide', { side: (side + 2) % 4 }); e.bx.jzBusy = g.t + 7.4; callWarrior(e); if (g.banner) g.banner('THE TIDE RISES.', 1100); }
function tideSide(g, e, V) {
  const C = court(e), pts = [];
  for (let i = 0; i < 5; i++) {
    const f = (i + 0.5) / 5, P0 = V.side === 0 ? [C.x + C.w * f, C.y + 2, Math.PI / 2] : V.side === 1 ? [C.x + C.w - 2, C.y + C.h * f, Math.PI] : V.side === 2 ? [C.x + C.w * f, C.y + C.h - 2, -Math.PI / 2] : [C.x + 2, C.y + C.h * f, 0];
    pts.push(P0); circle(g, e, P0[0], P0[1], 1.0, 0.5 + i * 0.18, 0);
  }
  g.sfx('portal'); later(e, 0.5, 'tideOpen', { pts });
}
function tideOpen(g, e, V) {
  const T = { ps: V.pts.map(([x, y, a], i) => { const q = portalAt(g, e, x, y, 4.4, 6000, CYAN); q.jzA = a; q.jzT = g.t + i * 0.18; return q; }), k: 0, next: g.t + 0.25 };
  (e.bx.jzTides = e.bx.jzTides || []).push(T);
}
function tideTick(g, e, T) {
  if (g.t < T.next) return; T.next += 0.45;
  const gap = T.k++ % T.ps.length;
  T.ps.forEach((q, i) => { if (!live(q) || i === gap || g.t < q.jzT) return; for (const o of [-deg(10), 0, deg(10)]) shot(g, e, q.x, q.y, q.jzA + o, { ...BOLT, speed: 5, range: 34, dmg: D(90), free: true }); });
}
// PENTAGRAM (crimson): five portals in a star round you, its lines shown 0.9 s, then lances down every line three times
// 0.35 s apart (115): step out of the star, or into one of its points
function star(g, e) {
  const p = target(g, e), a0 = Math.random() * TAU, pts = [];
  for (let i = 0; i < 5; i++) { const a = a0 + (i / 5) * TAU; pts.push([p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6]); circle(g, e, pts[i][0], pts[i][1], 0.9, 0.6, 0); }
  later(e, 0.6, 'starOpen', { pts }); e.bx.jzBusy = g.t + 4.4; g.sfx('portal');
}
function starOpen(g, e, V) {
  const ps = V.pts.map(([x, y]) => portalAt(g, e, x, y, 3.4, 6000, CRIM));
  ps.forEach((q, i) => { const r = ps[(i + 2) % 5]; show(g, e, q.x, q.y, angleTo(q.x, q.y, r.x, r.y), Math.hypot(r.x - q.x, r.y - q.y), 0.9, 0.7); });
  e.bx.jzStar = { ps, fire: g.t + 0.9, n: 0 }; g.sfx('zap');
}
function starTick(g, e, Z) {
  if (g.t < Z.fire || Z.n >= 3) return; Z.fire += 0.35; Z.n++;
  Z.ps.forEach((q, i) => { const r = Z.ps[(i + 2) % 5]; if (live(q) && live(r)) shot(g, e, q.x, q.y, angleTo(q.x, q.y, r.x, r.y), { ...LANCE, speed: 8, range: Math.hypot(r.x - q.x, r.y - q.y), dmg: D(115), free: true }); });
  g.sfx('zap');
}

// ================================================================ stage 2
// the throne shatters (from the court, when the Warrior falls; or at once, a Wizard on his own)
function unbind(g, e) {
  const S = e.bx, T = THRONE(e);
  S.jzSeq = null; closePortals(e); S.jzBroke = g.t;
  for (let k = 0; k < 4; k++) g.vx({ k: 'burst', x: T.x + (k - 1.5) * 1.2, y: T.y + 0.5, n: 22, colors: [...SPIRIT, '#5a5560', '#8a8490'] });
  g.vx({ k: 'shake', amt: 10 }); g.sfx('shatter');
  g.fx.push({ kind: 'ring', x: T.x, y: T.y, t: 0, max: 7, color: '#e6c8ff' });
  if (S.phase === 1 && S.state !== 'death') g.bxMorph(e);
}
// His step, in full (2026-11-02, the user): 0.4 s gathering (the windup); then his body breaks into violet runes and smoke,
// an afterimage of him lingering where he stood; his sigil burns at the mark 0.8 s; he re-forms there out of swirling
// runes, his robes settling. Nothing touches him, and he touches nothing, while he is between
function blink(g, e) {
  const q = target(g, e), L = MARKS(e).filter((m) => Math.hypot(m.x - e.x, m.y - e.y) > 3 && Math.hypot(m.x - q.x, m.y - q.y) > 5);
  const m = (L.length ? L : MARKS(e))[Math.floor(Math.random() * (L.length || 5))];
  circle(g, e, m.x, m.y, 1.3, 0.8, 0); e.bx.jzTo = m;
  e.bx.jzTravel = { fx: e.x, fy: e.y, x: m.x, y: m.y, t0: g.t, t1: g.t + 0.8, fr: e.bx.anim && e.bx.anim.frame };
  for (let k = 0; k < 5; k++) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 1.2, y: e.y - 0.4 - k * 0.7, n: 14, colors: SPIRIT });   // (a column of runes and smoke where he breaks apart)
  g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 3, color: '#c88aff' });
  for (let k = 1; k <= 8; k++) { const f = k / 9; g.vx({ k: 'burst', x: e.x + (m.x - e.x) * f, y: e.y + (m.y - e.y) * f - 1, n: 4, colors: ['#e6c8ff', '#8e4ca8'] }); }   // (a streak of runes to where he goes)
  g.sfx('portal');
  later(e, 0.8, 'blinkGo', { x: m.x, y: m.y });
}
function blinkGo(g, e, V) {
  e.x = V.x; e.y = V.y; e.bx.jzFormed = g.t;
  g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 2.6, color: '#e6c8ff' });
  const n = (e.bx.phase || 1) >= 3 ? 14 : 10, a0 = Math.random() * TAU;   // (2026-11-04, the user: "Do not make it feel like he just disappears and reappears with no weight": he comes out of the rift in a nova)
  for (let k = 0; k < n; k++) shot(g, e, e.x, e.y, a0 + (k / n) * TAU, { ...BOLT, speed: 3.4, range: 9, dmg: D(85) });
  g.vx({ k: 'shake', amt: 3 });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; g.vx({ k: 'burst', x: e.x + Math.cos(a) * 1.6, y: e.y - 1 + Math.sin(a) * 1.2, n: 3, colors: SPIRIT }); }
  g.sfx('portal'); e.bx.jzTravel = null;
}

// M1 Runic Wheel
function wheel(g, e) {                                    // Runic Cataclysm: four runes turning round him, each a volley every 0.6 s by turns (100), 6 s
  const S = e.bx, n = 4, a0 = Math.random() * TAU, dir = (S.jzDir = -(S.jzDir || 1));
  for (let i = 0; i < n; i++) show(g, e, e.x, e.y, a0 + (i / n) * TAU, 8, 0.7, 0.5);
  S.jzWheel = { n, a0, dir, w: deg(S.phase >= 3 ? 55 : 45), t0: g.t + 0.7, until: g.t + 6.7, next: g.t + 0.7, k: 0, runes: true };
}
// M2 Crossfire
function crossfire(g, e) {                                 // Hollow Convergence: four portals' rotating streams (95), his own aimed lances every second (125), 7 s
  const keys = ['W', 'E', 'N', 'S'];
  opening(g, e, keys, 0.7);
  later(e, 0.7, 'crossOpen', { keys });
}
function crossOpen(g, e, V) { e.bx.jzCross = { ps: V.keys.map((k) => portal(g, e, k, 7.4, 8000)), k: 0, gap: Math.floor(Math.random() * 10), t: 0, until: g.t + 7, lance: g.t + 1, sa: Math.random() * TAU }; }
function crossTick(g, e, X) {
  const p = target(g, e), i = X.k % 2, k = X.k++;
  for (const q of [X.ps[i], X.ps[i + 2]]) {                // (east or west; in III north or south with it)
    if (!live(q)) continue;
    const a = angleTo(q.x, q.y, p.x, p.y), gap = (X.gap + k) % 11;
    for (let j = 0; j < 13; j++) { if (j >= gap && j < gap + 3) continue; shot(g, e, q.x, q.y, a + (j / 12 - 0.5) * deg(100), { ...BOLT, speed: 5, range: 30, dmg: D(95) }); }
  }
}
// M3 Converging Sigils
function converge(g, e) { convRing(g, e, { r: 7.5, at: 0.8 }); later(e, 1.2, 'convRing', { r: 8.5, at: 0.8 }); }
function convRing(g, e, V) {
  const q = target(g, e), gap = Math.floor(Math.random() * 22), runes = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; runes.push({ x: q.x + Math.cos(a) * V.r, y: q.y + Math.sin(a) * V.r, a, dark: ((i - gap + 22) % 22) < 3 }); }
  (e.bx.jzConv = e.bx.jzConv || []).push({ runes, fire: g.t + V.at, gone: g.t + V.at + 0.3, cx: q.x, cy: q.y });
  later(e, V.at, 'convFire', { i: e.bx.jzConv.length - 1 });
}
function convFire(g, e, V) {
  const R = (e.bx.jzConv || [])[V.i]; if (!R) return;
  for (const u of R.runes) if (!u.dark) shot(g, e, u.x, u.y, u.a + Math.PI, { ...BOLT, speed: 3.8, range: 16, dmg: D(100) });
  g.sfx('zap');
}
// Spectral Prison: eight runes 5 tiles round you, shown 1 s; they close to 2.2 over 2.5 s; three side by side go dark (the
// way out) as they start; the rest fire inward as they close and when they've closed (110)
function prison(g, e) {
  const q = target(g, e), d0 = Math.floor(Math.random() * 8);
  e.bx.jzPrison = { x: q.x, y: q.y, a0: Math.random() * TAU, r0: 5, r1: 2.2, t0: g.t + 1.0, dur: 2.5, dark: [d0, (d0 + 1) % 8, (d0 + 2) % 8], darkAt: g.t + 1.0 };
  for (const t of [2.2, 3.5]) later(e, t, 'prisonFire');
  if (g.banner) g.banner('THE CAGE CLOSES.', 1200);
}
function prisonFire(g, e) {
  const P = e.bx.jzPrison; if (!P) return;
  const k = Math.max(0, Math.min(1, (g.t - P.t0) / P.dur)), rr = P.r0 + (P.r1 - P.r0) * k;
  for (let i = 0; i < 8; i++) { if (P.dark.includes(i)) continue; const a = P.a0 + (i / 8) * TAU, x = P.x + Math.cos(a) * rr, y = P.y + Math.sin(a) * rr; for (const o of [-0.12, 0.12]) shot(g, e, x, y, a + Math.PI + o, { ...BOLT, speed: 4.4, range: rr * 2 + 1, dmg: D(110), free: true }); }
  g.sfx('zap');
}
// The Unmaking (III, his own): about 9 s of everything he has, in order: returning lances; the runes' turning walls; the
// portals' crossfire; a converging ring round you; 1.3 s recovery, then he falters 1.8 s (an opening, earned)
function unmaking(g, e) {
  if (g.banner) g.banner('THE UNMAKING', 1600); g.sfx('roar');
  later(e, 0, 'royalty'); later(e, 1.6, 'wheel'); later(e, 3.4, 'crossfire'); later(e, 5.6, 'convRing', { r: 8, at: 0.9 }); later(e, 9.3, 'unmakingSpent');
  e.bx.jzBusy = g.t + 9.3;
}
function unmakingSpent(g, e) { const S = e.bx; S.jzWheel = null; S.jzCross = null; S.jzStag = g.t + 1.8; S.flinch = g.t + 1.8; S.flinchNext = g.t + 2.4; if (g.banner) g.banner('THE MAGE FALTERS', 1300); g.float(e.x, e.y - 3, 'STAGGERED', '#ffd650', e); }

// M4 Returning Royalty
function royalty(g, e) { circle(g, e, e.x, e.y, 2.2, 0.8, 0); later(e, 0.8, 'royalOut'); }
function royalOut(g, e) {
  const q = target(g, e), a0 = angleTo(e.x, e.y, q.x, q.y), s = TAU / 12, gap = Math.floor(Math.random() * 12), x = e.x, y = e.y;
  e.bx.jzRoyal = [];
  for (let i = 0; i < 12; i++) { if (i === gap || i === (gap + 1) % 12) continue; const b = shot(g, e, x, y, a0 + i * s + s / 2, { ...LANCE, speed: 4.6, range: 16, dmg: D(115) }); b.jzFrom = [x, y]; b.life = 5; e.bx.jzRoyal.push(b); }
  later(e, 1.55, 'royalHold'); later(e, 2.0, 'royalBack');
}
function royalHold(g, e) { for (const b of e.bx.jzRoyal || []) if (b.life > 0) { b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1); g.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#ffffff'] }); } }
function royalBack(g, e) {
  for (const b of e.bx.jzRoyal || []) {
    if (!(b.life > 0)) continue;
    const [fx, fy] = b.jzFrom, d = Math.hypot(fx - b.x, fy - b.y), a = Math.atan2(fy - b.y, fx - b.x);
    b.vx = Math.cos(a) * 5.4; b.vy = Math.sin(a) * 5.4; b.a = a; b.life = Math.max(0.05, d / 5.4);
  }
  e.bx.jzRoyal = null;
}
// M5 Lance Inquisition
function inquisition(g, e) { for (let w = 0; w < 6; w++) later(e, 0.6 + w * 0.42 - 0.23, 'lanceAim', { lead: w % 2 }); }
function lanceAim(g, e, V) {
  const [ox, oy] = FEET(g, e), q = target(g, e), [tx, ty] = V.lead ? ahead(g, e, 0.23 + Math.hypot(q.x - ox, q.y - oy) / 7.4) : [q.x, q.y], a = angleTo(ox, oy, tx, ty);
  show(g, e, ox, oy, a, 9, 0.23, 0.4);
  later(e, 0.23, 'lanceFire', { a });
}
function lanceFire(g, e, V) { const [ox, oy] = FEET(g, e); for (let k = 0; k < 5; k++) shot(g, e, ox, oy, V.a + (k / 4 - 0.5) * deg(18), { ...LANCE, speed: 7.4, range: 14, dmg: D(105) }); }
// M6 Ritual Anchors
function anchors(g, e) {
  if (g.banner) g.banner('BREAK THE ANCHORS.', 1600);
  const q = target(g, e), L = MARKS(e).filter((m) => Math.hypot(m.x - e.x, m.y - e.y) > 2 && Math.hypot(m.x - q.x, m.y - q.y) > 3).slice(0, 3);
  e.bx.jzAnch = { ps: L.map((m) => { const a = g.addEnemy('wiz_portal', m.x, m.y); a.noLoot = true; a.seen = true; a.jzUntil = g.t + 10; a.hp = a.maxHp = 9000; a.jzAnchor = true; g.vx({ k: 'burst', x: m.x, y: m.y, n: 16, colors: SPIRIT }); (e.bx.jzPortals = e.bx.jzPortals || []).push(a); return a; }), until: g.t + 9, next: g.t + 1.5 };
  g.sfx('portal');
}
function anchorsTick(g, e, A) {
  const S = e.bx, up = A.ps.filter(live);
  if (!up.length) {                                        // all broken in time: he falters
    S.jzAnch = null; S.jzWheel = null; S.vol = []; S.jzStag = g.t + 1.8; S.flinch = g.t + 1.8; S.flinchNext = g.t + 2.4;
    S.state = 'recover'; S.wait = 1.8; S.pat = null;
    if (g.banner) g.banner('THE MAGE FALTERS', 1600); g.float(e.x, e.y - 3, 'STAGGERED', '#ffd650', e); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT });
    return;
  }
  if (g.t > A.until) {                                     // too slow: they burst
    for (const q of up) { for (let k = 0; k < 16; k++) shot(g, e, q.x, q.y, (k / 16) * TAU, { ...BOLT, speed: 4.4, range: 16, dmg: D(120) }); q.noLoot = true; q.dead = true; q.deadT = 0; g.vx({ k: 'burst', x: q.x, y: q.y, n: 20, colors: SPIRIT }); }
    S.jzAnch = null; g.vx({ k: 'shake', amt: 6 }); return;
  }
  if (g.t >= A.next) { A.next += 1.5; for (const q of up) for (let k = 0; k < 6; k++) shot(g, e, q.x, q.y, (k / 6) * TAU + g.t, { ...BOLT, speed: 4.2, range: 14, dmg: D(80) }); }
}

// his own fire, under all of it (2026-11-02, the user: "the Mage should not simply stand idle... we need BULLET HELL"):
// on his throne a five-bolt fan every 1.3 s at you and where you're going (85); unbound seven every 1.1 s (95), 0.9 in III
function mageVolley(g, e) {
  const S = e.bx; if (S.jzTravel || S.jzStag > g.t) return;
  const q = target(g, e), lead = (S.jzVk = (S.jzVk || 0) + 1) % 2, tx = lead ? q.x + (S.pvx || 0) * 0.7 : q.x, ty = lead ? q.y + (S.pvy || 0) * 0.7 : q.y, a = angleTo(e.x, e.y, tx, ty), n = enthroned(e) ? 5 : 7;
  for (let k = 0; k < n; k++) shot(g, e, e.x, e.y, a + (k / (n - 1) - 0.5) * deg(enthroned(e) ? 40 : 60), { ...BOLT, speed: 6, range: 26, dmg: D(enthroned(e) ? 85 : 95) });
}
const P = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  spreads: P('Hollow Gateways', 'spreads', 1.4), crossing: P('Spectral Crossfire', 'crossing', 1.4), condemn: P('Royal Condemnation', 'condemn', 3.8), streams: P('Rotating Streams', 'streams', 1.4), judgement: P('Judgement', 'judgement', 1.4),   // (each runs while its portals do: choose waits on it)
  blink: P('Blink', 'blink', 0.7, { windup: 0.3 }), wheel: P('Runic Wheel', 'wheel', 5.0), wheelUnder: P('Runic Wheel', 'wheel', 1.6), crossfire: P('Crossfire', 'crossfire', 4.4),
  converge: P('Converging Sigils', 'converge', 2.6), royalty: P('Returning Royalty', 'royalty', 3.6), inquisition: P('Lance Inquisition', 'inquisition', 2.9),
  anchors: P('Ritual Anchors', 'anchors', 1.4), prison: P('Spectral Prison', 'prison', 3.2), unmaking: P('The Unmaking', 'unmaking', 1.3, { move: 'hold' }),
  orbit: P('Revolving Gate', 'orbit', 1.0), tide: P('Portal Tide', 'tide', 1.0), star: P('Pentagram', 'star', 1.2),
};
const ORDER = {   // (2026-11-04, the user: "too repetitive ... teleport, shoot": portals worked into every stretch, a step every three, each step its own attack)
  1: ['spreads', 'orbit', 'condemn', 'crossing', 'tide', 'streams', 'star'],   // (on his throne)
  2: ['blink', 'wheel', 'orbit', 'blink', 'prison', 'tide', 'blink', 'crossfire', 'star', 'inquisition', 'blink', 'converge', 'royalty', 'blink', 'anchors'],
  3: ['blink', 'unmaking', 'orbit', 'blink', 'tide', 'prison', 'blink', 'star', 'wheelUnder', 'crossfire', 'blink', 'anchors', 'converge', 'royalty'],
};
function choose(g, e) {
  const S = e.bx, C = courtTick(g, e);
  if (S.phase === 1 && !enthroned(e)) { if (C.act === 2) unbind(g, e); return null; }   // (a Wizard on his own: down at once)
  if (S.jzAnch || S.jzSeq || S.jzBusy > g.t || S.jzTravel) return null;   // (his anchors, a throne sequence, the Unmaking or a step still under way)
  if (S.jzPh !== S.phase) { S.jzPh = S.phase; S.jzK = 0; }
  const L = ORDER[S.phase] || ORDER[3];
  return AT[L[S.jzK++ % L.length]];
}

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 265000, def: 22, xp: 9500,
  r: 1.5, speed: 3.6, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.999, 0.40],
  choose, unbind,
  walkPace: 3.6,                                            // (his glide clip at the pace he moves)
  immune: (g, e) => enthroned(e) || !!e.bx.jzTravel, immuneText: 'WARDED',
  alpha: (g, e) => {                                        // (between marks: unseen; re-forming over 0.35 s. Timed by this copy's own clock: online the step's times are the server's)
    const S = e.bx;
    if (S.jzTravel) { if (!S.jzSeenGo || S.jzSeenGo.of !== S.jzTravel.t0) S.jzSeenGo = { t: g.t, of: S.jzTravel.t0, fx: S.jzTravel.fx, fy: S.jzTravel.fy, fr: S.jzTravel.fr }; S.jzSeenBack = 0; return 0; }
    if (S.jzSeenGo) { S.jzSeenBack = g.t; S.jzLast = S.jzSeenGo; S.jzSeenGo = null; }
    return S.jzSeenBack && g.t - S.jzSeenBack < 0.35 ? (g.t - S.jzSeenBack) / 0.35 : 1;
  },
  dmgMult: (g, e) => (e.bx.jzStag > g.t ? 1.33 : 1),        // (faltering: open to you)
  morphGrace: 1.2,
  phases: { 1: { move: 'throne', pressure: [{ every: 1.3, special: 'mageVolley', delay: 3 }], patterns: Object.values(AT) }, 2: { move: 'hover', pressure: [{ every: 1.1, special: 'mageVolley', delay: 2 }], patterns: Object.values(AT) }, 3: { move: 'hover', pressure: [{ every: 0.9, special: 'mageVolley', delay: 1 }], patterns: Object.values(AT) } },
  specials: { mageVolley, spreads, crossing, streams, judgement, seqOpen, judgeLock, judgeFire, blink, blinkGo, wheel, crossfire, crossOpen, converge, convRing, convFire,
    royalty, royalOut, royalHold, royalBack, inquisition, lanceAim, lanceFire, anchors, condemn, condemnSet, prison, prisonFire, unmaking, unmakingSpent,
    orbit, orbitOpen, tide, tideSide, tideOpen, star, starOpen },
  moves: {
    throne(g, e, dt) {                                      // to his throne, and there
      const T = THRONE(e), d = Math.hypot(T.x - e.x, T.y - e.y), sp = 4 * dt;
      if (d > 0.05) g.moveCircle(e, ((T.x - e.x) / d) * Math.min(d, sp), ((T.y - e.y) / d) * Math.min(d, sp), 0.8);
    },
    hover(g, e, dt) {                                       // drifting a little about his mark
      const m = e.bx.jzTo || { x: e.x, y: e.y }, tx = m.x + Math.sin(g.t * 0.9) * 1.2, ty = m.y + Math.cos(g.t * 0.7) * 0.8, d = Math.hypot(tx - e.x, ty - e.y), sp = 1.6 * dt;
      if (!e.bx.jzTo) e.bx.jzTo = m;
      if (d > 0.1 && !(e.bx.jzStag > g.t)) g.moveCircle(e, ((tx - e.x) / d) * Math.min(d, sp), ((ty - e.y) / d) * Math.min(d, sp), 0.8);
    },
  },
  onWake(g, e) { courtOf(e); if (g.banner) g.banner(partner(e) ? 'THE HOLLOW COURT · "BEND THE KNEE."' : '"THEN BURN THE SOUL."', 2600); },
  onPhase(g, e, ph) {
    const S = e.bx; S.jzSeq = S.jzCross = S.jzWheel = S.jzOrbit = S.jzStar = null; S.jzTides = []; S.jzConv = []; S.jzStag = 0;
    if (S.jzAnch) { for (const q of S.jzAnch.ps) if (live(q)) { q.noLoot = true; q.dead = true; q.deadT = 0; } S.jzAnch = null; }
    closePortals(e); S.wait = Math.min(S.wait || 0, 1.2);
    if (ph === 3) S.tempoK = 0.8;                           // (III: shorter rests)
    g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 30, colors: SPIRIT }); g.sfx('portal');
  },
  update(g, e, dt) {
    const S = e.bx;
    courtTick(g, e);
    if (S.state === 'sleep' || S.state === 'intro') return;
    for (const q of S.jzPortals || []) if (!q.dead && g.t > q.jzUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.jzPortals = (S.jzPortals || []).filter((q) => !q.dead);
    if (S.state === 'morph' || S.state === 'death' || S.state === 'deathhold' || S.state === 'gone' || e.dead) return;   // (dying: nothing more of his runs, or sets him fighting again)
    if (S.jzSeq) { if (g.t > S.jzSeq.until) S.jzSeq = null; else seqTick(g, e, S.jzSeq, dt); }
    const X = S.jzCross;
    if (X) { if (g.t > X.until) S.jzCross = null; else {
      if ((X.t -= dt) <= 0) { X.t = 0.2; X.sa += deg(16); X.ps.forEach((q, i) => { if (live(q)) for (const o of [0, Math.PI]) shot(g, e, q.x, q.y, X.sa + (i * Math.PI) / 2 + o, { ...BOLT, speed: 4.6, range: 30, dmg: D(95) }); }); }   // (the streams, turning, two from each)
      if (g.t >= X.lance) { X.lance += 1; const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y); for (const o of [-1, 0, 1]) shot(g, e, e.x, e.y, a + o * deg(8), { ...LANCE, speed: 7, range: 16, dmg: D(125) }); }
    } }
    const Wh = S.jzWheel;                                   // the wheel: a bolt an arm every 0.14 s
    if (Wh && g.t >= Wh.t0) {
      if (g.t > Wh.until || S.jzStag > g.t) S.jzWheel = null;
      else if (g.t >= Wh.next) {                            // each rune in turn (0.15 s apart): three out from it and one at you
        Wh.next += 0.15; const i = Wh.k++ % Wh.n, a = Wh.a0 + Wh.dir * Wh.w * (g.t - Wh.t0) + (i / Wh.n) * TAU, rx = e.x + Math.cos(a) * 3.5, ry = e.y + Math.sin(a) * 3.5, q = target(g, e);
        for (const o of [-0.5, -0.25, 0, 0.25, 0.5]) shot(g, e, rx, ry, a + o, { ...BOLT, speed: 4.6, range: 16, dmg: D(100), free: true });
        shot(g, e, rx, ry, angleTo(rx, ry, q.x, q.y), { ...BOLT, speed: 5.4, range: 14, dmg: D(100), free: true });
      }
    }
    if (S.jzAnch) anchorsTick(g, e, S.jzAnch);
    if (S.jzOrbit) { if (g.t > S.jzOrbit.until) S.jzOrbit = null; else orbitTick(g, e, S.jzOrbit); }
    if (S.jzTides && S.jzTides.length) { S.jzTides = S.jzTides.filter((T) => T.ps.some(live)); for (const T of S.jzTides) tideTick(g, e, T); }
    if (S.jzStar) { if (S.jzStar.n >= 3 || !S.jzStar.ps.some(live)) S.jzStar = null; else starTick(g, e, S.jzStar); }
    if (S.jzConv && S.jzConv.length && S.jzConv.every((R) => g.t > R.gone)) S.jzConv = [];
    if (S.jzPrison && g.t > S.jzPrison.t0 + S.jzPrison.dur + 1.5) S.jzPrison = null;
    if (S.jzTravel && g.t > S.jzTravel.t1 + 0.05) blinkGo(g, e, S.jzTravel);   // (a step is always finished, whatever cleared his queue: a falter, a change of form)
  },
  onDeath(g, e) { const S = e.bx; S.jzSeq = S.jzCross = S.jzWheel = S.jzAnch = S.jzOrbit = S.jzStar = null; S.jzTides = []; S.jzConv = []; closePortals(e); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
  // his afterimage, where he stood as he broke apart, fading
  draw(r, g, e) {
    const T = e.bx.jzSeenGo; if (!T || !T.fr || !e.bx.def) return;
    const k = 1 - (g.t - T.t) / 0.7; if (k <= 0) return;   // (his afterimage where he stood, fading; violet-tinged)
    const [x, y] = r.proj(T.fx, T.fy); r.drawDef(e.bx.def, T.fr, Math.round(x), Math.round(y) - Math.round((1 - k) * 6), { alpha: 0.5 * k, scale: e.bx.drawK || 1 });
  },
  // drawn on the floor: his throne's dais (a ward over him while it stands; rubble once it breaks), the five marks he
  // steps between, the converging runes, the anchors' tethers to him
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, T = THRONE(e), [tx, ty] = r.proj(T.x, T.y);
    if (!S.jzBroke) {
      b.fillStyle = '#0e0a14'; b.fillRect(Math.round(tx) - 30, Math.round(ty) - 8, 60, 22);
      b.fillStyle = '#2e2838'; b.fillRect(Math.round(tx) - 28, Math.round(ty) - 6, 56, 18);
      b.fillStyle = '#433a52'; b.fillRect(Math.round(tx) - 28, Math.round(ty) - 6, 56, 3);
      for (let k = 0; k < 5; k++) { b.fillStyle = (k + Math.floor(g.t * 3)) % 5 === 0 ? '#e6c8ff' : '#8e4ca8'; b.fillRect(Math.round(tx) - 22 + k * 11, Math.round(ty) + 4, 4, 3); }   // (its runes, a light running along them)
      if (enthroned(e)) {                                   // the ward
        const [ex, ey] = r.proj(e.x, e.y), R = 26 + Math.sin(g.t * 4) * 2;
        b.save(); b.globalAlpha = 0.35 + Math.sin(g.t * 4) * 0.1; b.strokeStyle = '#c88aff'; b.lineWidth = 2;
        b.beginPath(); b.ellipse(Math.round(ex), Math.round(ey) - 18, R, R * 1.15, 0, 0, TAU); b.stroke(); b.restore();
      }
    } else {
      b.fillStyle = '#1c1824';
      for (let k = 0; k < 9; k++) { const x = tx - 28 + ((k * 23) % 56), y = ty - 6 + ((k * 13) % 18); b.fillRect(Math.round(x), Math.round(y), 6 + (k % 3) * 2, 4 + (k % 2) * 2); }
      b.fillStyle = '#433a52';
      for (let k = 0; k < 9; k++) { const x = tx - 28 + ((k * 23) % 56), y = ty - 6 + ((k * 13) % 18); b.fillRect(Math.round(x), Math.round(y), 5 + (k % 3) * 2, 2); }
      for (const m of MARKS(e)) {                           // his marks
        const [mx, my] = r.proj(m.x, m.y), here = S.jzTo === m || (S.jzTo && Math.hypot(S.jzTo.x - m.x, S.jzTo.y - m.y) < 0.1);
        b.save(); b.globalAlpha = here ? 0.6 : 0.25; b.strokeStyle = '#b884cc'; b.lineWidth = 2;
        b.beginPath(); b.ellipse(Math.round(mx), Math.round(my), 14, 7, 0, 0, TAU); b.stroke(); b.restore();
      }
    }
    for (const q of g.enemies) if (!q.dead && q.id === 'wiz_portal' && Math.hypot(q.x - e.x, q.y - e.y) < 40) {   // each portal's ring on the floor, in its colour
      const [px, py] = r.proj(q.x, q.y), R = 11 + Math.sin(g.t * 6 + q.x) * 1.5;
      b.save(); b.globalAlpha = 0.55; b.strokeStyle = q.jzCol || '#b884cc'; b.lineWidth = 2; b.beginPath(); b.ellipse(Math.round(px), Math.round(py), R, R * 0.5, 0, 0, TAU); b.stroke();
      b.globalAlpha = 0.2; b.fillStyle = q.jzCol || '#b884cc'; b.beginPath(); b.ellipse(Math.round(px), Math.round(py), R - 3, (R - 3) * 0.5, 0, 0, TAU); b.fill(); b.restore();
    }
    const TV = S.jzTravel;
    if (TV && (!S.jzRift || S.jzRift.of !== TV.t0)) S.jzRift = { of: TV.t0, t: g.t };   // (timed by this copy's own clock: online the step's times are the server's)
    if (TV && g.t - S.jzRift.t < 0.9) {                       // the rift he will come out of: opening, its runes turning, brighter as he comes
      const k = Math.max(0, Math.min(1, (g.t - S.jzRift.t) / 0.8)), [rx, ry] = r.proj(TV.x, TV.y), R = 6 + 14 * k;
      b.save(); b.globalAlpha = 0.35 + 0.5 * k; b.strokeStyle = '#e6c8ff'; b.lineWidth = 2; b.beginPath(); b.ellipse(Math.round(rx), Math.round(ry), R, R * 0.5, 0, 0, TAU); b.stroke();
      b.strokeStyle = '#8e4ca8'; b.beginPath(); b.ellipse(Math.round(rx), Math.round(ry), R * 0.6, R * 0.3, 0, 0, TAU); b.stroke();
      for (let i = 0; i < 6; i++) { const a = g.t * 3 + (i / 6) * TAU; b.fillStyle = i % 2 ? '#e6c8ff' : '#c88aff'; b.fillRect(Math.round(rx + Math.cos(a) * R) - 2, Math.round(ry + Math.sin(a) * R * 0.5) - 2, 4, 4); }
      b.globalAlpha = 0.25 * k; b.fillStyle = '#c88aff'; b.fillRect(Math.round(rx) - 3, Math.round(ry) - 40 * k, 6, 40 * k);   // (a shaft of light rising from it)
      b.restore();
    }
    const PR = S.jzPrison;
    if (PR && g.t < PR.t0 + PR.dur + 1.5) {                 // the prison's runes, closing
      const k = Math.max(0, Math.min(1, (g.t - PR.t0) / PR.dur)), rr = PR.r0 + (PR.r1 - PR.r0) * k;
      for (let i = 0; i < 8; i++) { const a = PR.a0 + (i / 8) * TAU, [x, y] = r.proj(PR.x + Math.cos(a) * rr, PR.y + Math.sin(a) * rr), dk = PR.dark.includes(i) && g.t >= PR.darkAt;
        b.fillStyle = dk ? 'rgba(40,24,52,0.5)' : g.t < PR.t0 ? 'rgba(200,138,255,0.6)' : '#e6c8ff'; b.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 8); b.fillStyle = '#8e4ca8'; if (!dk) b.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); }
    }
    const WH = S.jzWheel;
    if (WH && WH.runes && g.t >= WH.t0) for (let i = 0; i < WH.n; i++) {   // the Cataclysm's four runes turning round him
      const a = WH.a0 + WH.dir * WH.w * (g.t - WH.t0) + (i / WH.n) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * 3.5, e.y + Math.sin(a) * 3.5);
      b.fillStyle = '#e6c8ff'; b.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 8); b.fillStyle = '#8e4ca8'; b.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
    }
    for (const R of S.jzConv || []) {                       // converging runes: dim while they gather, bright as they fire
      if (g.t > R.gone) continue;
      const k = Math.min(1, 1 - (R.fire - g.t) / 0.8);
      for (const u of R.runes) {
        const [x, y] = r.proj(u.x, u.y);
        b.fillStyle = u.dark ? 'rgba(40,24,52,0.5)' : k >= 1 ? '#ffffff' : `rgba(200,138,255,${0.3 + 0.6 * k})`;
        b.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
      }
    }
    if (S.jzAnch) {                                         // the anchors' tethers to him
      const [ex, ey] = r.proj(e.x, e.y);
      b.save(); b.strokeStyle = '#c88aff'; b.lineWidth = 2; b.globalAlpha = 0.45 + Math.sin(g.t * 8) * 0.15;
      for (const q of S.jzAnch.ps) if (live(q)) { const [qx, qy] = r.proj(q.x, q.y); b.beginPath(); b.moveTo(Math.round(qx), Math.round(qy) - 10); b.lineTo(Math.round(ex), Math.round(ey) - 16); b.stroke(); }
      b.restore();
    }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 4.5, r: 70, col: '#c88aff' }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
