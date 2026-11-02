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
const closePortals = (e) => { for (const q of e.bx.jzPortals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.bx.jzPortals = []; };
const live = (q) => q && !q.dead;
const opening = (g, e, keys, delay) => { for (const k of keys) { const s = at40(e, ...SPOT[k]); circle(g, e, s.x, s.y, 1.1, delay, 0); } g.sfx('portal'); };

// ================================================================ stage 1: the throne's sequences (S.jzSeq, run in update)
function spreads(g, e) { opening(g, e, ['W', 'E'], 0.8); later(e, 0.8, 'seqOpen', { kind: 'spread', keys: ['W', 'E'], dur: 6, hp: 7000, every: 0.7 }); }
function crossing(g, e) { opening(g, e, ['NW', 'NE', 'SE', 'SW'], 0.8); later(e, 0.8, 'seqOpen', { kind: 'cross', keys: ['NW', 'NE', 'SE', 'SW'], dur: 6, hp: 60000, every: 1.0 }); }
function streams(g, e) { opening(g, e, ['NL', 'NR', 'S'], 0.8); later(e, 0.8, 'seqOpen', { kind: 'stream', keys: ['NL', 'NR', 'S'], dur: 5, hp: 7000, every: 0.15 }); }
function judgement(g, e) { opening(g, e, ['NL', 'NR'], 0.7); later(e, 0.7, 'seqOpen', { kind: 'judge', keys: ['NL', 'NR'], dur: 4.2, hp: 7000, every: 1.3 }); }
function seqOpen(g, e, V) { e.bx.jzSeq = { kind: V.kind, ps: V.keys.map((k) => portal(g, e, k, V.dur + 0.4, V.hp)), every: V.every, t: V.kind === 'stream' ? 0 : 0.3, k: 0, t0: g.t, until: g.t + V.dur }; }
function seqTick(g, e, Q, dt) {
  if ((Q.t -= dt) > 0) return;
  Q.t += Q.every;
  const p = target(g, e), C = court(e), k = Q.k++;
  if (Q.kind === 'spread') {
    const q = Q.ps[k % 2]; if (!live(q)) return;
    const [tx, ty] = k % 4 >= 2 ? ahead(g, e, 0.6) : [p.x, p.y], a = angleTo(q.x, q.y, tx, ty);
    for (let i = 0; i < 5; i++) shot(g, e, q.x, q.y, a + (i / 4 - 0.5) * deg(40), { ...BOLT, speed: 5.6, range: 22, dmg: D(85) });
  } else if (Q.kind === 'cross') {
    const tx = (C.x + C.w / 2 + p.x) / 2, ty = (C.y + C.h / 2 + p.y) / 2;
    for (const i of k % 2 ? [1, 3] : [0, 2]) {
      const q = Q.ps[i]; if (!live(q)) continue;
      const a = angleTo(q.x, q.y, tx, ty);
      for (let j = 0; j < 4; j++) shot(g, e, q.x, q.y, a, { ...BOLT, speed: 4.6 + j * 0.6, range: 34, dmg: D(90) });
    }
  } else if (Q.kind === 'stream') {
    const T = g.t - Q.t0, mid = { x: C.x + C.w / 2, y: C.y + C.h / 2 };
    Q.ps.forEach((q, i) => { if (!live(q)) return; const turn = (i === 0 ? 1 : i === 1 ? -1 : Math.sin(T * 1.3)) * deg(70) * T, a = angleTo(q.x, q.y, mid.x, mid.y) + turn; shot(g, e, q.x, q.y, a, { ...BOLT, speed: 4.6, range: 30, dmg: D(80) }); });
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
function blink(g, e) {                                     // to a mark away from you (and from where he is), shown 0.5 s first
  const q = target(g, e), L = MARKS(e).filter((m) => Math.hypot(m.x - e.x, m.y - e.y) > 3 && Math.hypot(m.x - q.x, m.y - q.y) > 5);
  const m = (L.length ? L : MARKS(e))[Math.floor(Math.random() * (L.length || 5))];
  circle(g, e, m.x, m.y, 1.3, 0.5, 0); e.bx.jzTo = m;
  later(e, 0.5, 'blinkGo', { x: m.x, y: m.y });
}
function blinkGo(g, e, V) { g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 18, colors: SPIRIT }); e.x = V.x; e.y = V.y; g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 18, colors: SPIRIT }); g.sfx('portal'); }

// M1 Runic Wheel
function wheel(g, e) {
  const S = e.bx, n = S.phase >= 3 ? 5 : 4, a0 = Math.random() * TAU, dir = (S.jzDir = -(S.jzDir || 1));
  for (let i = 0; i < n; i++) show(g, e, e.x, e.y, a0 + (i / n) * TAU, 8, 0.7, 0.5);
  S.jzWheel = { n, a0, dir, w: deg(S.phase >= 3 ? 55 : 45), t0: g.t + 0.7, until: g.t + 4.9, next: g.t + 0.7 };
}
// M2 Crossfire
function crossfire(g, e) {
  const keys = e.bx.phase >= 3 ? ['W', 'E', 'N', 'S'] : ['W', 'E'];
  opening(g, e, keys, 0.7);
  later(e, 0.7, 'crossOpen', { keys });
}
function crossOpen(g, e, V) { e.bx.jzCross = { ps: V.keys.map((k) => portal(g, e, k, 4.4, 8000)), k: 0, gap: Math.floor(Math.random() * 10), t: 0, until: g.t + 3.8 }; }
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
    S.jzAnch = null; S.jzWheel = null; S.vol = []; S.jzStag = g.t + 3.5; S.flinch = g.t + 3.5; S.flinchNext = g.t + 4.1;
    S.state = 'recover'; S.wait = 3.5; S.pat = null;
    if (g.banner) g.banner('THE MAGE FALTERS', 1600); g.float(e.x, e.y - 3, 'STAGGERED', '#ffd650', e); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT });
    return;
  }
  if (g.t > A.until) {                                     // too slow: they burst
    for (const q of up) { for (let k = 0; k < 16; k++) shot(g, e, q.x, q.y, (k / 16) * TAU, { ...BOLT, speed: 4.4, range: 16, dmg: D(120) }); q.noLoot = true; q.dead = true; q.deadT = 0; g.vx({ k: 'burst', x: q.x, y: q.y, n: 20, colors: SPIRIT }); }
    S.jzAnch = null; g.vx({ k: 'shake', amt: 6 }); return;
  }
  if (g.t >= A.next) { A.next += 1.5; for (const q of up) for (let k = 0; k < 6; k++) shot(g, e, q.x, q.y, (k / 6) * TAU + g.t, { ...BOLT, speed: 4.2, range: 14, dmg: D(80) }); }
}

const P = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  spreads: P('Staggered Spreads', 'spreads', 1.4), crossing: P('Crossing Volleys', 'crossing', 1.4), streams: P('Rotating Streams', 'streams', 1.4), judgement: P('Judgement', 'judgement', 1.4),   // (each runs while its portals do: choose waits on it)
  blink: P('Blink', 'blink', 0.7, { windup: 0.3 }), wheel: P('Runic Wheel', 'wheel', 5.0), wheelUnder: P('Runic Wheel', 'wheel', 1.6), crossfire: P('Crossfire', 'crossfire', 4.4),
  converge: P('Converging Sigils', 'converge', 2.6), royalty: P('Returning Royalty', 'royalty', 3.6), inquisition: P('Lance Inquisition', 'inquisition', 2.9),
  anchors: P('Ritual Anchors', 'anchors', 1.4),
};
const ORDER = {
  1: ['spreads', 'crossing', 'judgement', 'streams'],      // (on his throne)
  2: ['blink', 'inquisition', 'wheel', 'blink', 'converge', 'crossfire', 'blink', 'royalty', 'anchors'],
  3: ['blink', 'wheelUnder', 'converge', 'crossfire', 'blink', 'anchors', 'royalty', 'wheelUnder', 'inquisition', 'blink', 'crossfire'],
};
function choose(g, e) {
  const S = e.bx, C = courtTick(g, e);
  if (S.phase === 1 && !enthroned(e)) { if (C.act === 2) unbind(g, e); return null; }   // (a Wizard on his own: down at once)
  if (S.jzAnch || S.jzSeq) return null;                    // (his anchors or a throne sequence still out)
  if (S.jzPh !== S.phase) { S.jzPh = S.phase; S.jzK = 0; }
  const L = ORDER[S.phase] || ORDER[3];
  return AT[L[S.jzK++ % L.length]];
}

export default {
  id: 'jarl_wizard', art: 'jarl_wizard', name: 'The Hollow Jarl, Wizard', biome: 'dungeon', hp: 265000, def: 22, xp: 9500,
  r: 1.5, speed: 3.6, keep: 7, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.999, 0.40],
  choose, unbind,
  walkPace: 3.6,                                            // (his glide clip at the pace he moves)
  immune: (g, e) => enthroned(e), immuneText: 'WARDED',
  dmgMult: (g, e) => (e.bx.jzStag > g.t ? 1.33 : 1),        // (faltering: open to you)
  morphGrace: 1.2,
  phases: { 1: { move: 'throne', patterns: Object.values(AT) }, 2: { move: 'hover', patterns: Object.values(AT) }, 3: { move: 'hover', patterns: Object.values(AT) } },
  specials: { spreads, crossing, streams, judgement, seqOpen, judgeLock, judgeFire, blink, blinkGo, wheel, crossfire, crossOpen, converge, convRing, convFire,
    royalty, royalOut, royalHold, royalBack, inquisition, lanceAim, lanceFire, anchors },
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
    const S = e.bx; S.jzSeq = S.jzCross = S.jzWheel = null; S.jzConv = []; S.jzStag = 0;
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
    if (S.state === 'morph' || S.state === 'death') return;
    if (S.jzSeq) { if (g.t > S.jzSeq.until) S.jzSeq = null; else seqTick(g, e, S.jzSeq, dt); }
    const X = S.jzCross;
    if (X) { if (g.t > X.until) S.jzCross = null; else if ((X.t -= dt) <= 0) { X.t = 0.6; crossTick(g, e, X); } }
    const Wh = S.jzWheel;                                   // the wheel: a bolt an arm every 0.14 s
    if (Wh && g.t >= Wh.t0) {
      if (g.t > Wh.until || S.jzStag > g.t) S.jzWheel = null;
      else if (g.t >= Wh.next) {
        Wh.next += 0.14; const a = Wh.a0 + Wh.dir * Wh.w * (g.t - Wh.t0);
        for (let i = 0; i < Wh.n; i++) shot(g, e, e.x, e.y, a + (i / Wh.n) * TAU, { ...BOLT, speed: 4.4, range: 13, dmg: D(90) });
      }
    }
    if (S.jzAnch) anchorsTick(g, e, S.jzAnch);
    if (S.jzConv && S.jzConv.length && S.jzConv.every((R) => g.t > R.gone)) S.jzConv = [];
  },
  onDeath(g, e) { const S = e.bx; S.jzSeq = S.jzCross = S.jzWheel = S.jzAnch = null; S.jzConv = []; closePortals(e); g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 40, colors: SPIRIT }); },
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
