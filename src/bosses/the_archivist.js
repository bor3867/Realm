// The Archivist: the Frozen Scriptorium's boss on the boss framework (2026-10-22). "Every word ever spoken in the realm is
// kept here, frozen into pages. The Archivist keeps them." Its own mechanics:
//   The Index     - the room's aisles are labelled, numerals along the top and letters down the side. It calls a
//                   reference ("Volume C, shelf IV!") and that row and that column burst. More references as it goes.
//   Recitation    - it reads aloud, and the sentence crosses the room as a wall of frozen ink glyphs: the gaps are the
//                   spaces between the words
//   I   The Catalogue Opens - the index, recitations, pages flung at you
//   II  Errata              - "It copies everything, even itself. Strike the copy and the original laughs." A copy stands
//                             across the room; its name over it is written backwards. Hit the copy and the original laughs
//                             (and heals). Every so often they trade places: read again.
//   III The Final Chapter   - footnotes pin to the floor where you stand and burst into needles; three references a call
//   Last: The Last Chapter  - "Write your name in the margin. It is the only thing it will never be able to shelve."
//                             Gold quills appear in the margins, one after another: reach each one. Miss them: SHELVED.
// Art: tools/build_the_archivist.py ('bx_the_archivist', its copy 'bx_the_archivist/copy', shots 'archivist_shots/the_archivist.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 5, w: 24, h: 18 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const open = (m, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx]; };
const ICE = ['#bfe8ff', '#ffffff'], INK = ['#3a2a58', '#8a3ad8'];

// ---- the Index: the room in aisles, about three tiles wide; numerals across the top, letters down the side
const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], LET = 'ABCDEF';
function grid(e) { const A = arena(e), C = Math.max(4, Math.min(8, Math.floor(A.w / 3))), Rw = Math.max(3, Math.min(6, Math.floor(A.h / 3))); return { A, C, R: Rw, cw: A.w / C, rh: A.h / Rw }; }
function index(g, e, V) {
  const G = grid(e), n = V.refs || 1, refs = [], q = target(g, e);
  for (let k = 0; k < n; k++) {
    let c = Math.floor(R() * G.C), r = Math.floor(R() * G.R);
    if (k === 0 && V.yours) { c = Math.max(0, Math.min(G.C - 1, Math.floor((q.x - G.A.x) / G.cw))); r = Math.max(0, Math.min(G.R - 1, Math.floor((q.y - G.A.y) / G.rh))); }   // (it looks you up)
    refs.push([c, r]);
  }
  const delay = V.delay || 1.5;
  for (const [c, r] of refs) {
    const x = G.A.x + (c + 0.5) * G.cw, y = G.A.y + (r + 0.5) * G.rh;
    g.fx.push({ kind: 'lane', x, y: G.A.y, a: Math.PI / 2, len: G.A.h, w: G.cw / 2 - 0.15, delay, t: 0, life: delay + 0.55, dmg: g.bxDmg(e, V.dmg || 70), by: e.D.name, hitT: 0, cols: ICE });
    g.fx.push({ kind: 'lane', x: G.A.x, y, a: 0, len: G.A.w, w: G.rh / 2 - 0.15, delay, t: 0, life: delay + 0.55, dmg: g.bxDmg(e, V.dmg || 70), by: e.D.name, hitT: 0, cols: ICE });
  }
  e.arCall = refs.map(([c, r]) => c + ':' + r).join(','); e.arCallUntil = g.t + delay + 0.5;
  g.banner(refs.map(([c, r]) => `Volume ${LET[r]}, shelf ${NUM[c]}`).join('  ·  ') + '!', 1800);
}

// ---- Recitation: a sentence crosses the room as a wall of glyphs; the spaces between the words are the gaps
const LINES = ['the god fell and kept on falling', 'every word is kept', 'readers become footnotes', 'nothing leaves the catalogue', 'the first sentence is not finished',
  'all of it is filed', 'you are already written down', 'errata follow the reader'];
function recite(g, e, V) {
  const A = arena(e), vertical = V.across === 'down' || (V.across === 'any' && R() < 0.5), len = vertical ? A.w : A.h, sp = 0.72, gapSlots = 3;
  let words = LINES[Math.floor(R() * LINES.length)].split(' '), slots = [];
  const build = () => { slots = []; words.forEach((w, i) => { if (i) for (let k = 0; k < gapSlots; k++) slots.push(0); for (let k = 0; k < w.length; k++) slots.push(1); }); };
  build(); while (slots.length * sp > len - 1 && words.length > 2) { words = words.slice(0, -1); build(); }
  const off = (len - slots.length * sp) / 2, from = R() < 0.5;            // (centred; it reads in from one side or the other)
  g.banner(`"${words.join(' ')}"`, 1600);
  slots.forEach((on, i) => {
    if (!on) return;
    const s = off + (i + 0.5) * sp;
    if (vertical) g.bxShotAt(e, A.x + s, from ? A.y + 0.4 : A.y + A.h, 0.4, from ? Math.PI / 2 : -Math.PI / 2, { shot: 'glyph', speed: V.speed || 2.8, range: A.h - 0.6, dmg: V.dmg || 60 });
    else g.bxShot(e, from ? A.x + 0.4 : A.x + A.w - 0.4, A.y + s, from ? 0 : Math.PI, { shot: 'glyph', speed: V.speed || 2.8, range: A.w - 0.6, dmg: V.dmg || 60 });
  });
}

// ---- pages, ink, needles
function pages(g, e, V) {
  for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.25, V: { form: 'special', name: 'pageFan', w, dmg: V.dmg } });
}
function pageFan(g, e, V) { const [ox, oy] = g.bxOrigin(e), q = target(g, e), a = angleTo(ox, oy, q.x, q.y); for (let k = -2; k <= 2; k++) g.bxShot(e, ox, oy, a + k * 0.2 + (V.w % 2) * 0.1, { shot: 'page', speed: 6.5, range: 12, dmg: V.dmg || 55 }); }
// the pages turn (2026-10-31: it threw the fewest shots of any boss): two long arms of pages sweep round it like a book
// leafing itself, the near pages slow and the far ones fast, so each arm is a curved line to step through, not a wall
function turning(g, e, V) {
  const dir = R() < 0.5 ? 1 : -1, a0 = R() * TAU, n = Math.round((V.dur || 2.4) / 0.12);
  for (let k = 0; k < n; k++) e.bx.vol.push({ t: k * 0.12, V: { form: 'special', name: 'leaf', a: a0 + dir * k * 0.19, arms: V.arms || 2, dmg: V.dmg } });
}
function leaf(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let i = 0; i < V.arms; i++) for (const sp of [3.2, 5]) g.bxShot(e, ox, oy, V.a + (i / V.arms) * TAU, { shot: 'page', speed: sp, range: 12, dmg: V.dmg || 58 }); }
function needles(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (const q of players(g)) { const a = angleTo(ox, oy, q.x, q.y); for (let k = -1; k <= 1; k++) g.bxShot(e, ox, oy, a + k * 0.08, { shot: 'needle', speed: 9, range: 14, dmg: V.dmg || 65 }); } }

// ---- II: its copy. The same body; over it, its name written backwards. Strike it and the original laughs (and heals)
const COPY = 'archivist_copy';
if (!ENEMIES[COPY]) ENEMIES[COPY] = { name: 'The Archivist', biome: 'scriptorium', hp: 1e6, def: 0, speed: 0, xp: 0, r: 1.3, ai: 'rooted', aggro: 0, reg: 'bx_the_archivist/copy', scale: 1, noBar: true, contact: 0, attacks: [], loot: [] };
const copyOf = (g, e) => (e.arCopy && !e.arCopy.dead ? e.arCopy : g.enemies.find((q) => !q.dead && q.D && q.D.reg === 'bx_the_archivist/copy'));
function makeCopy(g, e) {
  if (e.arCopy && !e.arCopy.dead) return;
  const A = arena(e), far = Math.abs(e.x - (A.x + A.w * 0.25)) > Math.abs(e.x - (A.x + A.w * 0.75)) ? 0.25 : 0.75;   // (a quarter of the way across, on the side away from it)
  let x = A.x + A.w * far, y = e.y; for (let t = 0; t < 12 && !open(g.map, x, y); t++) y += 1;
  const m = g.addEnemy(COPY, x, y);
  m.seen = true; m.noLoot = true; m.arOf = e; m.hp = m.maxHp = 1e6; m.arLast = m.hp; e.arCopy = m;
  g.vx({ k: 'burst', x: m.x, y: m.y - 1.5, n: 24, colors: INK });
}
function copyStep(g, e, dt) {
  const m = e.arCopy; if (!m || m.dead) return;
  e.arLaughT = (e.arLaughT || 0) - dt;
  if (m.hp < m.arLast) {                                    // struck: the original laughs
    if (e.arLaughT <= 0) { e.arLaughT = 0.6; e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.006)); e.arLaughs = (e.arLaughs || 0) + 1;
      g.float(e.x, e.y - 3.2, 'HA HA HA', '#8a3ad8'); for (let i = 0; i < 10; i++) g.bxShotAt(e, e.x, e.y, 1.5, (i / 10) * TAU, { shot: 'ink', speed: 4, range: 9, dmg: 55 }); }
  }
  if (m.hp < 5e5) m.hp = m.maxHp;
  m.arLast = m.hp;
  if ((m.arFireT = (m.arFireT ?? 1.4) - dt) <= 0) {          // it reads too: ink at you
    m.arFireT = 1.6; const q = target(g, m), a = angleTo(m.x, m.y - 1.5, q.x, q.y);
    for (let k = -1; k <= 1; k++) g.bxShotAt(e, m.x, m.y, 1.5, a + k * 0.25, { shot: 'ink', speed: 5, range: 11, dmg: 50 });
  }
  if ((e.arSwapT = (e.arSwapT ?? 9) - dt) <= 0) {            // they trade places, in a flurry of pages
    e.arSwapT = 9; const x = e.x, y = e.y; e.x = m.x; e.y = m.y; m.x = x; m.y = y;
    for (const o of [e, m]) g.vx({ k: 'burst', x: o.x, y: o.y - 1.5, n: 20, colors: ['#f4f0e0', '#8a3ad8'] });
    g.banner('They trade places. Read the names again!', 1600);
  }
}
function dropCopy(e) { const m = e.arCopy; if (m && !m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; } e.arCopy = null; }

// ---- III: footnotes pinned where you stand; they burst into needles
function footnotes(g, e, V) {
  for (const q of players(g)) g.fx.push({ kind: 'zone', src: e, x: q.x, y: q.y, r: 1.2, t: 0, delay: V.delay || 1.3, life: (V.delay || 1.3) + 0.15, dmg: g.bxDmg(e, V.dmg || 60), by: e.D.name, done: false, colors: ICE, shards: 6, proj: 'archivist_shots/the_archivist.needle' });
}

// ---- last: THE LAST CHAPTER. Quills in the margins: reach each one and sign. Miss them, and it shelves you
const finale = {
  at: 0.1, dur: 13, name: 'The Last Chapter', say: 'write your name in the margin', after: 1.3,
  start(g, e) { e.arSigned = 0; e.arQuills = 0; e.arQOn = false; e.arQT = 0.8; e.arRecT = 1.5; dropCopy(e); },
  update(g, e, dt, T) {
    if ((e.arRecT -= dt) <= 0) { e.arRecT = 2.6; recite(g, e, { across: 'any', speed: 2.6, dmg: 60 }); }
    if (!e.arQOn && (e.arQT -= dt) <= 0 && e.arQuills < 3) {   // a quill appears somewhere in the margin
      const A = arena(e), m = g.map;
      for (let t = 0; t < 40; t++) { const side = Math.floor(R() * 4), u = 0.12 + R() * 0.76;
        const x = side < 2 ? A.x + u * A.w : side === 2 ? A.x + 1.4 : A.x + A.w - 1.4, y = side >= 2 ? A.y + u * A.h : side === 0 ? A.y + 1.4 : A.y + A.h - 1.4;
        if (open(m, x, y)) { e.arQx = x; e.arQy = y; break; } }
      e.arQOn = true; e.arQLeft = 3.6; e.arQuills++; g.banner(`A quill in the margin (${e.arQuills} of 3): sign your name!`, 1400);
    }
    if (e.arQOn) {
      e.arQLeft -= dt;
      if (players(g).some((q) => Math.hypot(q.x - e.arQx, q.y - e.arQy) < 1.3)) { e.arQOn = false; e.arSigned++; e.arQT = 0.6; g.vx({ k: 'burst', x: e.arQx, y: e.arQy - 0.5, n: 18, colors: ['#f2d070', '#ffffff'] }); g.float(e.arQx, e.arQy - 1.5, 'SIGNED', '#f2d070'); }
      else if (e.arQLeft <= 0) { e.arQOn = false; e.arQT = 0.6; g.float(e.arQx, e.arQy - 1.5, 'SHELVED', '#bfe8ff'); }
    }
    if (e.arQuills >= 3 && !e.arQOn && !e.arDone) {
      e.arDone = true;
      if (e.arSigned >= 3) { g.banner('Your name is in the margin. It can never shelve you.', 2400); e.bx.finT = Math.max(e.bx.finT, (e.bx.fin || e.bx.B.finale).dur - 0.1); }
      else { g.banner('SHELVED. The ice closes over the page.', 2200); for (const q of players(g)) g.fx.push({ kind: 'zone', src: e, x: q.x, y: q.y, r: 2.2, t: 0, delay: 0.9, life: 1.05, dmg: g.bxDmg(e, 160), by: e.D.name, done: false, colors: ICE, shards: 10, proj: 'archivist_shots/the_archivist.needle' }); }
    }
  },
  end(g, e) { e.arQOn = false; e.arDone = false; },
};

export default {
  id: 'the_archivist', art: 'the_archivist', shotSheet: 'archivist_shots', name: 'The Archivist', biome: 'scriptorium', hp: 136000, def: 24, xp: 9000,
  dmgScale: 1.7, r: 1.4, speed: 0.8, keep: 6, faces: true, tempo: 0.95, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'the index', windup: 0.6, recover: 0.6, special: 'index', refs: 1, dmg: 70 },
      { name: 'a recitation', windup: 0.6, recover: 1.0, special: 'recite', across: 'side', dmg: 60 },
      { name: 'pages', windup: 0.5, recover: 0.7, special: 'pages', waves: 3, dmg: 55 },
      { name: 'the index', windup: 0.5, recover: 0.6, special: 'index', refs: 1, yours: true, dmg: 70 },
      { name: 'the pages turn', windup: 0.6, recover: 0.6, special: 'turning', arms: 2, dur: 2.2, dmg: 58 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'the index', windup: 0.5, recover: 0.6, special: 'index', refs: 2, dmg: 70 },
      { name: 'a recitation', windup: 0.5, recover: 0.9, special: 'recite', across: 'any', dmg: 60 },
      { name: 'pages', windup: 0.5, recover: 0.6, special: 'pages', waves: 4, dmg: 55 },
      { name: 'the index', windup: 0.5, recover: 0.6, special: 'index', refs: 2, yours: true, dmg: 70 },
      { name: 'the pages turn', windup: 0.5, recover: 0.6, special: 'turning', arms: 3, dur: 2.4, dmg: 58 },
    ] },
    3: { move: 'pace', pressure: [{ every: 2.8, special: 'footnotes', dmg: 60 }], patterns: [
      { name: 'the index', windup: 0.5, recover: 0.6, special: 'index', refs: 3, yours: true, delay: 1.4, dmg: 72 },
      { name: 'a recitation', windup: 0.4, recover: 0.7, special: 'recite', across: 'any', speed: 3.2, dmg: 62 },
      { name: 'needles', windup: 0.4, recover: 0.6, special: 'needles', dmg: 65 },
      { name: 'a recitation', windup: 0.4, recover: 0.8, special: 'recite', across: 'down', speed: 3.2, dmg: 62 },
      { name: 'the pages turn', windup: 0.4, recover: 0.5, special: 'turning', arms: 3, dur: 2.8, dmg: 62 },
    ] },
  },
  specials: { index, recite, pages, pageFan, needles, footnotes, turning, leaf },
  onWake(g) { g.banner('THE ARCHIVIST · every word is kept', 3000); },
  onPhase(g, e, ph) {
    if (ph === 2) { makeCopy(g, e); e.arSwapT = 9; g.banner('ERRATA · it copies itself: read the names', 2800); }
    if (ph === 3) { dropCopy(e); g.banner('THE FINAL CHAPTER', 2600); }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro' || S.state === 'death' || S.state === 'deathhold') return;
    if (S.phase === 2) { if (!e.arCopy || e.arCopy.dead) makeCopy(g, e); copyStep(g, e, dt); }
  },
  onDeath(g, e) { dropCopy(e); e.arQOn = false; g.banner('THE CATALOGUE CLOSES. YOUR NAME STAYS IN THE MARGIN.', 3400); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2, r: 80, col: e.bx && e.bx.phase === 2 ? '#8a3ad8' : '#7ad0ff' }]; },
  drawGround(r, g, e) {
    const b = r.b, G = grid(e), called = new Set(e.arCallUntil > g.t ? (e.arCall || '').split(',') : []), cs = new Set(), rs = new Set();
    for (const s of called) { if (!s) continue; const [c, rr] = s.split(':').map(Number); cs.add(c); rs.add(rr); }
    b.textAlign = 'center';
    for (let c = 0; c < G.C; c++) for (let rr = 0; rr < G.R; rr++) {   // each aisle crossing wears its reference on the floor (you can always read your own); called ones in gold
      const hot = cs.has(c) || rs.has(rr), [x, y] = r.proj(G.A.x + (c + 0.5) * G.cw, G.A.y + (rr + 0.5) * G.rh + 0.25);
      b.globalAlpha = hot ? 1 : 0.45; r.plabel(b, LET[rr] + '·' + NUM[c], x, y, 16, hot ? '#f2d070' : '#7aa0d8'); b.globalAlpha = 1;
    }
    // the aisles: faint lines between them
    b.globalAlpha = 0.18; b.strokeStyle = '#bfe8ff'; b.lineWidth = 1;
    for (let c = 1; c < G.C; c++) { const [x0, y0] = r.proj(G.A.x + c * G.cw, G.A.y + 1.4), [x1, y1] = r.proj(G.A.x + c * G.cw, G.A.y + G.A.h); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
    for (let rr = 1; rr < G.R; rr++) { const [x0, y0] = r.proj(G.A.x + 1.4, G.A.y + rr * G.rh), [x1, y1] = r.proj(G.A.x + G.A.w, G.A.y + rr * G.rh); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
    b.globalAlpha = 1;
    // the last chapter: the quill to reach
    if (e.arQOn && e.arQx !== undefined) { const [x, y] = r.proj(e.arQx, e.arQy); b.globalAlpha = 0.4 + 0.3 * Math.sin(g.t * 8); b.fillStyle = '#f2d070'; b.beginPath(); b.ellipse(x, y + 2, 16, 7, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
      r.spriteAt(b, 'archivist_shots/the_archivist.quill', x, y - 4, 1.4); }
  },
  drawTop(r, g, e) {                                       // the names: its own, and its copy's, written backwards
    const m = copyOf(g, e); if (!m || e.bx.phase !== 2) return;
    const b = r.b; b.textAlign = 'center';
    const [x0, y0] = r.proj(e.x, e.y - 4.4), [x1, y1] = r.proj(m.x, m.y - 4.4);
    r.plabel(b, 'The Archivist', x0, y0, 16, '#e0f6ff'); r.plabel(b, 'tsivihcrA ehT', x1, y1, 16, '#e0f6ff');
  },
  get loot() { return DUNGEON_BOSSES.the_archivist.loot; },
  lootLuck: 1.8,
};
