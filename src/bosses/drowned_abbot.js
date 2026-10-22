// Abbot Morrow, the Drowned Abbot: the Sunken Chapel's boss on the boss framework (2026-10-21). "The tide came in during
// Mass and never went out again. Abbot Morrow told us to keep singing." His own mechanics, no one else's:
//   The Sermon - every so often he begins a verse (a bar over his head fills). Four drowned bells hang in the corners of
//     the nave; he never could stand the noise. Ring enough of them (shoot them) before the verse ends and the bells
//     drown him out: SILENCED, he staggers. Let him finish and the AMEN brings the tide in from every wall.
//   I   The Sermon Begins     - the censer swung in an arc of embers, the crozier's rings of bell-pearls, the reading
//   II  The Water Rises       - the nave floods from the back (the water slows you, in your own browser), it surges,
//                               and he baptises where you stand
//   III Mass for the Drowned  - he floats; light falls through the stained glass in coloured lanes; the bells toll on
//                               their own; the verses come faster and want three bells
//   Last: The Last Verse      - ring all four before he finishes it
// Art: tools/build_drowned_abbot.py ('bx_drowned_abbot', the bells 'abbot_bell/bell', shots 'abbot_shots/drowned_abbot.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 11, y: e.y - 4, w: 22, h: 18 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const BRINE = ['#2a7ac8', '#7ad0ff'], GLASS = [['#ff6a8a', '#ffd0e0'], ['#7ad0ff', '#e0f6ff'], ['#ffd650', '#fff6c8'], ['#7aff9a', '#e0ffe8']];
function mark(g, e, x, y, r, delay, dmg, colors, shards, shot) {
  g.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false, colors, shards: shards || 0, proj: shot ? `abbot_shots/drowned_abbot.${shot}` : undefined });
}

// ---- the bells: four, hung in the corners of the nave. Rooted, harmless, never broken: a blow on one rings it
const BELL = 'abbot_bell', RING = 520;
if (!ENEMIES[BELL]) ENEMIES[BELL] = { name: 'a Drowned Bell', biome: 'chapel', hp: 1e6, def: 0, speed: 0, xp: 0, r: 0.8, ai: 'rooted', aggro: 0, reg: 'abbot_bell/bell', scale: 1.2, noBar: true, contact: 0, attacks: [], loot: [] };
const bellSpots = (e) => { const A = arena(e), i = 2.6; return [[A.x + i, A.y + i], [A.x + A.w - i, A.y + i], [A.x + i, A.y + A.h - i], [A.x + A.w - i, A.y + A.h - i]]; };
function hangBells(g, e) {
  e.abBells = (e.abBells || []).filter((b) => !b.dead);
  if (e.abBells.length === 4) return;
  for (const m of e.abBells) { m.noLoot = true; m.dead = true; m.deadT = 0; }
  const m0 = g.map, A = arena(e), open = (x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const tx = Math.floor(x + dx), ty = Math.floor(y + dy); if (tx < 0 || ty < 0 || tx >= m0.w || ty >= m0.h || m0.solid[ty * m0.w + tx]) return false; } return true; };
  const inward = ([x, y]) => { const cx = A.x + A.w / 2, cy = A.y + A.h / 2; for (let t = 0; t <= 0.9; t += 0.04) { const px = x + (cx - x) * t, py = y + (cy - y) * t; if (open(px, py)) return [px, py]; } return [x, y]; };   // (in a cave-shaped nave: the nearest open floor toward the middle)
  e.abBells = bellSpots(e).map(inward).map(([x, y]) => { const m = g.addEnemy(BELL, x, y); m.seen = true; m.noLoot = true; m.abOf = e; m.hp = m.maxHp = 1e6; return m; });
}
const bellsOf = (g, e) => e.abBells || g.enemies.filter((q) => !q.dead && q.D && q.D.reg === 'abbot_bell/bell');   // (in a browser: the server's bells, as puppets)
const rungCount = (e) => (e.abBells || []).filter((b) => b.abRung).length;

// ---- the Sermon: a verse, its bells, and its Amen
const VERSES = ['"And the sea said: be still."', '"Sing, my children. The water is listening."', '"Blessed are the drowned, for they shall not thirst."',
  '"Keep singing. Keep singing."', '"The bells will ring for you, as they rang for me."', '"Kneel, and let the tide take your breath."'];
function beginVerse(g, e, need, dur) {
  hangBells(g, e);
  for (const b of e.abBells) { b.abRung = false; b.abBase = b.hp; }
  Object.assign(e, { abVerse: 0, abVerseDur: dur, abNeed: need, abRung: 0, abVerseOn: true });
  g.banner(`${VERSES[Math.floor(R() * VERSES.length)]}  Ring ${need} bells before he finishes!`, 2600);
  g.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 14, colors: ['#bff8f0', '#ffffff'] });
}
function verseStep(g, e, dt) {
  if (!e.abVerseOn) return;
  for (const b of e.abBells || []) if (!b.dead && !b.abRung && b.abBase - b.hp >= RING) {
    b.abRung = true; b.abRingUntil = g.t + 1.2;                        // rung: it swings, the sound goes out
    g.vx({ k: 'burst', x: b.x, y: b.y - 1, n: 16, colors: ['#f2d070', '#ffffff'] }); g.fx.push({ kind: 'ring', x: b.x, y: b.y - 1, t: 0, max: 3, color: '#f2d070' });
  }
  for (const b of e.abBells || []) if (b.hp < 5e5) b.hp = b.maxHp;    // (never broken)
  e.abRung = rungCount(e);
  e.abVerse += dt / e.abVerseDur;
  if (e.abRung >= e.abNeed) return silenced(g, e);
  if (e.abVerse >= 1) amen(g, e);
}
function silenced(g, e) {
  e.abVerseOn = false; e.abVerse = 0; e.abSilenced = (e.abSilenced || 0) + 1;
  g.float(e.x, e.y - 3.5, 'SILENCED', '#f2d070'); g.banner('The bells drown him out! The Abbot staggers.', 2200);
  const S = e.bx; if (S.state === 'fight' || S.state === 'windup' || S.state === 'recover') { S.state = 'grace'; S.wait = 3.2; S.vol = []; }
  e.abStagUntil = g.t + 3.2;
}
function amen(g, e) {                                       // the tide comes in from every wall: three waves, each with gaps
  e.abVerseOn = false; e.abVerse = 0;
  g.banner('"AMEN."  The tide comes in!', 2200); g.vx({ k: 'shake', amt: 7 });
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: 0.4 + k * 0.9, V: { form: 'special', name: 'tideWave', k, dmg: 70 } });
}
function tideWave(g, e, V) {
  const A = arena(e), step = 1.15, gap = 2.8;
  for (const side of [0, 1, 2, 3]) {
    const horiz = side < 2, len = horiz ? A.w : A.h, g0 = 1 + R() * (len - gap - 2);
    for (let s = 0.5; s < len; s += step) {
      if (s > g0 && s < g0 + gap) continue;
      const x = horiz ? A.x + s : side === 2 ? A.x + 0.3 : A.x + A.w - 0.3, y = horiz ? (side === 0 ? A.y + 0.3 : A.y + A.h - 0.3) : A.y + s;
      const a = horiz ? (side === 0 ? Math.PI / 2 : -Math.PI / 2) : side === 2 ? 0 : Math.PI;
      g.bxShot(e, x, y, a, { shot: 'tidebolt', speed: 3.4 + V.k * 0.3, range: (horiz ? A.h : A.w) * 0.55, dmg: V.dmg });
    }
  }
}

// ---- I: the censer, the crozier, the reading
function censer(g, e, V) {                                  // swung: embers out in an arc, one after another across it
  const q = target(g, e), [ox, oy] = g.bxOrigin(e), a0 = angleTo(ox, oy, q.x, q.y), n = V.n || 9, arc = V.arc || 1.6, dir = R() < 0.5 ? 1 : -1;
  for (let k = 0; k < n; k++) e.bx.vol.push({ t: k * 0.07, V: { form: 'special', name: 'ember', a: a0 + dir * (k / (n - 1) - 0.5) * arc, dmg: V.dmg } });
}
function ember(g, e, V) { const [ox, oy] = g.bxOrigin(e); g.bxShot(e, ox, oy, V.a, { shot: 'ember', speed: 5.5, range: 11, dmg: V.dmg || 50 }); g.bxShot(e, ox, oy, V.a, { shot: 'ember', speed: 3.5, range: 9, dmg: V.dmg || 50 }); }
function crozier(g, e, V) {                                 // rings of bell-pearls from the crozier, each turned half a step
  for (let k = 0; k < (V.rings || 2); k++) e.bx.vol.push({ t: k * 0.35, V: { form: 'special', name: 'pearlRing', k, dmg: V.dmg } });
}
function pearlRing(g, e, V) { const [ox, oy] = g.bxOrigin(e), n = 18, off = (V.k % 2) * (Math.PI / n); for (let i = 0; i < n; i++) g.bxShot(e, ox, oy, off + (i / n) * TAU, { shot: 'bellpearl', speed: 3.6, range: 11, dmg: V.dmg || 48 }); }
function reading(g, e, V) {                                 // the reading: pages, at you, three at a time
  for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.3, V: { form: 'special', name: 'pages', dmg: V.dmg } });
}
function pages(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, q.x, q.y); for (const d of [-0.22, 0, 0.22]) g.bxShot(e, ox, oy, a + d, { shot: 'page', speed: 7, range: 12, dmg: V.dmg || 52 }); }

// ---- II: the water rises (the line is a plain number on him: everyone's water is the same), surges, baptism
function surge(g, e, V) {                                   // a wave from the flood's edge, up the nave, with one gap
  const A = arena(e), y = e.abWater > 0 ? e.abWater : A.y + A.h, gap = 3, g0 = A.x + 1 + R() * (A.w - gap - 2);
  for (let x = A.x + 0.5; x < A.x + A.w; x += 0.85) { if (x > g0 && x < g0 + gap) continue; g.bxShot(e, x, y, -Math.PI / 2, { shot: 'tidebolt', speed: 3.8, range: A.h, dmg: V.dmg || 60 }); }
  e.abSurgeUntil = g.t + 1.2;
}
function baptism(g, e, V) {                                 // where each of you stands, and round it: marked, then the water bursts up
  for (const q of players(g)) { mark(g, e, q.x, q.y, 1.5, V.delay || 1.0, V.dmg || 65, BRINE, 6, 'bubble');
    for (let k = 0; k < (V.n || 3); k++) { const a = R() * TAU, d = 2 + R() * 2.5; mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.3, (V.delay || 1.0) + 0.2 + k * 0.12, V.dmg || 65, BRINE, 0); } }
}
function bubbles(g, e, V) {                                 // bubbles rising off the flood
  const A = arena(e), y = e.abWater > 0 ? e.abWater : A.y + A.h;
  for (let k = 0; k < (V.n || 2); k++) g.bxShot(e, A.x + 1 + R() * (A.w - 2), y, -Math.PI / 2 + (R() - 0.5) * 0.3, { shot: 'bubble', speed: 2.4, range: 9, dmg: V.dmg || 44 });
}

// ---- III: the stained glass, the bells tolling
function glass(g, e, V) {                                   // light falls through the windows: coloured lanes down the nave, marked, then burning
  const A = arena(e), n = Math.floor(A.w / 2), safe = Math.floor(R() * (n - 1)), q = target(g, e), mine = Math.floor((q.x - A.x) / 2);
  for (let i = 0; i < n; i++) {
    if (i === safe || i === safe + 1 || (V.spare && Math.abs(i - mine) > 2 && i % 2)) continue;
    const C = GLASS[i % GLASS.length];
    g.fx.push({ kind: 'lane', x: A.x + i * 2 + 1, y: A.y, a: Math.PI / 2, len: A.h, w: 0.8, delay: V.delay || 1.2, t: 0, life: (V.delay || 1.2) + 0.9, dmg: g.bxDmg(e, V.dmg || 70), by: e.D.name, hitT: 0, cols: C });
  }
}
function toll(g, e, V) {                                    // a bell tolls by itself: a ring of sound out of it, with a gap
  hangBells(g, e);
  const B = e.abBells[Math.floor(R() * e.abBells.length)]; if (!B) return;
  B.abRingUntil = g.t + 1; const n = 20, gap = Math.floor(R() * n);
  for (let i = 0; i < n; i++) { if (((i - gap + n) % n) < 3) continue; g.bxShot(e, B.x, B.y - 1, (i / n) * TAU, { shot: 'toll', speed: 3.2, range: 13, dmg: V.dmg || 55 }); }
}

// ---- last: THE LAST VERSE. Ring all four before he finishes it
const finale = {
  at: 0.1, dur: 10, name: 'The Last Verse', say: 'he begins the last verse: ring every bell!', after: 1.2,
  start(g, e) { beginVerse(g, e, 4, 9.5); e.abFinT = 0.6; },
  update(g, e, dt) {
    verseStep(g, e, dt);
    if ((e.abFinT -= dt) <= 0) { e.abFinT = 0.6; bubbles(g, e, { n: 3, dmg: 46 }); }
  },
  end(g, e) { e.abVerseOn = false; e.abVerse = 0; },
};

export default {
  id: 'drowned_abbot', art: 'drowned_abbot', shotSheet: 'abbot_shots', name: 'Abbot Morrow, the Drowned', biome: 'chapel', hp: 16000, def: 8, xp: 2600,
  r: 1.4, speed: 0.9, keep: 6, faces: true, tempo: 0.95, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'the censer swung', windup: 0.6, recover: 0.7, special: 'censer', n: 9, arc: 1.6, dmg: 48 },
      { name: 'the crozier', windup: 0.7, recover: 0.8, special: 'crozier', rings: 2, dmg: 46 },
      { name: 'the reading', windup: 0.5, recover: 0.7, special: 'reading', waves: 3, dmg: 50 },
      { name: 'the censer swung', windup: 0.5, recover: 0.7, special: 'censer', n: 11, arc: 2.2, dmg: 48 },
    ] },
    2: { move: 'pace', pressure: [{ every: 1.4, special: 'bubbles', n: 2, dmg: 44 }], patterns: [
      { name: 'the baptism', windup: 0.6, recover: 0.7, special: 'baptism', n: 3, dmg: 62 },
      { name: 'the surge', windup: 0.7, recover: 0.8, special: 'surge', dmg: 58 },
      { name: 'the crozier', windup: 0.6, recover: 0.7, special: 'crozier', rings: 3, dmg: 46 },
      { name: 'the censer swung', windup: 0.5, recover: 0.6, special: 'censer', n: 11, arc: 2.2, dmg: 48 },
      { name: 'the surge', windup: 0.6, recover: 0.8, special: 'surge', dmg: 58 },
    ] },
    3: { move: 'center', pressure: [{ every: 2.6, special: 'toll', dmg: 54 }, { every: 1.6, special: 'bubbles', n: 2, dmg: 44 }], patterns: [
      { name: 'the stained glass', windup: 0.6, recover: 0.8, special: 'glass', dmg: 70 },
      { name: 'the crozier', windup: 0.5, recover: 0.6, special: 'crozier', rings: 3, dmg: 48 },
      { name: 'the baptism', windup: 0.5, recover: 0.6, special: 'baptism', n: 4, delay: 0.9, dmg: 64 },
      { name: 'the stained glass', windup: 0.5, recover: 0.8, special: 'glass', delay: 1.0, dmg: 72 },
      { name: 'the reading', windup: 0.4, recover: 0.6, special: 'reading', waves: 4, dmg: 52 },
    ] },
  },
  specials: { censer, ember, crozier, pearlRing, reading, pages, surge, baptism, bubbles, glass, toll, tideWave },
  onWake(g, e) { hangBells(g, e); e.abSerT = 8; g.banner('ABBOT MORROW · he is still preaching', 3000); },
  onPhase(g, e, ph) {
    if (ph === 2) { g.banner('THE WATER RISES', 2600); e.abWater = arena(e).y + arena(e).h; }
    if (ph === 3) g.banner('MASS FOR THE DROWNED · the bells ring on their own', 2800);
  },
  update(g, e, dt) {
    const S = e.bx, A = arena(e);
    if (S.state === 'sleep' || S.state === 'intro' || S.state === 'death' || S.state === 'deathhold') return;
    // the sermon: a verse every so often, faster as the Mass goes on
    if (e.abVerseOn) verseStep(g, e, dt);
    else if (S.state !== 'morph' && (e.abSerT = (e.abSerT ?? 8) - dt) <= 0) {
      const ph = S.phase; e.abSerT = ph === 1 ? 20 : ph === 2 ? 17 : 14;
      beginVerse(g, e, ph === 3 ? 3 : 2, ph === 1 ? 7.5 : ph === 2 ? 7 : 6.5);
    }
    // the flood: in II and III the water rises up the nave to just short of the middle, falls back, rises again
    if (S.phase >= 2) { const lo = A.y + A.h, hi = A.y + A.h * 0.58, k = (Math.sin(S.t * 0.35) + 1) / 2; e.abWater = lo - (lo - hi) * (0.35 + 0.65 * k); }
    else e.abWater = -1;                                       // (none: a number still, so it reaches the browsers)
  },
  // in your own browser: the water drags at you
  local(g, e) { const p = g.player; if (e.abWater > 0 && p.y > e.abWater && !p.dead) { p.dragUntil = g.t + 0.15; p.dragF = 0.6; } },
  onDeath(g, e) {
    for (const b of e.abBells || []) if (!b.dead) { b.noLoot = true; b.dead = true; b.deadT = 0; }
    e.abVerseOn = false; g.banner('THE SERMON ENDS. FOR THE FIRST TIME, THE CHAPEL IS QUIET.', 3400);
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2, r: 90, col: '#bff8f0' }]; },
  drawGround(r, g, e) {
    const b = r.b, A = arena(e);
    // the flood: everything below the line under water, its edge foaming
    if (e.abWater > 0) {
      const m = g.map, W = e.abWater, ty0 = Math.floor(W);
      const floor = (tx, ty) => tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx];   // (only over the floor: the walls and the dark stay dry)
      const quad = (x0, y0, x1, y1) => { const P = [r.proj(x0, y0), r.proj(x1, y0), r.proj(x1, y1), r.proj(x0, y1)]; b.moveTo(P[0][0], P[0][1]); for (let k = 1; k < 4; k++) b.lineTo(P[k][0], P[k][1]); b.closePath(); };
      b.globalAlpha = 0.38; b.fillStyle = '#2a6aa8'; b.beginPath();
      for (let ty = ty0; ty <= A.y + A.h; ty++) for (let tx = Math.floor(A.x); tx <= A.x + A.w; tx++) if (floor(tx, ty)) quad(tx, Math.max(ty, W), tx + 1, ty + 1);
      b.fill();
      b.globalAlpha = 0.8; b.fillStyle = e.abSurgeUntil > g.t ? '#ffffff' : '#9ae0ff';   // its edge, foaming
      for (let tx = Math.floor(A.x); tx <= A.x + A.w; tx++) if (floor(tx, ty0)) for (let k = 0; k < 3; k++) { const [sx, sy] = r.proj(tx + k / 3, W + Math.sin(g.t * 3 + tx + k) * 0.08); b.fillRect(Math.round(sx), Math.round(sy), 4, 2); }
      b.globalAlpha = 1;
    }
    // the bells: a ring of gold round those already rung this verse
    for (const bl of bellsOf(g, e)) {
      if (bl.dead) continue;
      const [x, y] = r.proj(bl.x, bl.y);
      if (e.abVerseOn) { b.strokeStyle = bl.abRung ? '#f2d070' : 'rgba(242,208,112,0.35)'; b.lineWidth = bl.abRung ? 3 : 1; b.beginPath(); b.ellipse(x, y + 2, 14, 6, 0, 0, TAU); b.stroke(); }
    }
  },
  drawTop(r, g, e) {                                       // the verse: a bar over his head, and how many bells it wants
    if (!e.abVerseOn) return;
    const b = r.b, [x, y] = r.proj(e.x, e.y - 6), w = 48, f = Math.min(1, e.abVerse || 0);
    b.fillStyle = '#05040a'; b.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 1), w + 2, 7);
    b.fillStyle = '#1a3a3a'; b.fillRect(Math.round(x - w / 2), Math.round(y), w, 5);
    b.fillStyle = f > 0.75 ? '#ff6a6a' : '#bff8f0'; b.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w * f), 5);
    for (let k = 0; k < (e.abNeed || 2); k++) { b.fillStyle = k < (e.abRung || 0) ? '#f2d070' : '#3a3424'; b.fillStyle = '#05040a'; b.fillRect(Math.round(x - (e.abNeed * 7) / 2 + k * 7) - 1, Math.round(y - 9), 7, 7); b.fillStyle = k < (e.abRung || 0) ? '#f2d070' : '#3a3424'; b.fillRect(Math.round(x - (e.abNeed * 7) / 2 + k * 7), Math.round(y - 8), 5, 5); }   // (the bells it wants, over the bar)
  },
  get loot() { return DUNGEON_BOSSES.drowned_abbot.loot; },
  lootLuck: 1.5,
};
