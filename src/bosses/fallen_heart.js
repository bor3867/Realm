// The Fallen Heart: the Heart of Godfall's boss on the boss framework (2026-10-21). "When the god fell, its heart rolled
// down into the earth, and it kept beating. Gold grew around it like scar tissue. Saints came to pray. The heart drank
// their prayers. Every beat sends a shiver through Godfall. Count them: they are getting faster." Its own mechanics:
//   The Heartbeat - gold veins run out from it across the floor. Lub: the odd veins burst. Dub: the even ones. Step
//     between them in time; they creep round as it beats, and it beats faster as it weakens (and as it drinks prayers).
//   I   It Still Beats            - the veins; its blood in rings; gold shards off its scars
//   II  The Saints Pray           - ghostly saints kneel round the room, each sending a beam of prayer into it. A prayer
//                                   that reaches it heals it and quickens the beat. Stand in a beam to intercept it.
//   III It Remembers Being a God  - the room breathes: a boundary closes in on each beat and opens again (outside it you
//                                   burn, in your own browser); its eye opens and looks at you
//   Last: The Last Beat           - the beats race, then stop. Gold scars glow on the floor: only they are safe when it lands
// Art: tools/build_fallen_heart.py ('bx_fallen_heart', the saints 'heart_saint/saint', shots 'heart_shots/fallen_heart.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 12, y: e.y - 10, w: 24, h: 20 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const open = (m, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx]; };

// ---- the heartbeat: eight veins, half of them burst on each beat
const VEINS = 8;
const reach = (e) => { const A = arena(e); return Math.hypot(A.w, A.h) / 2 + 1; };
function beat(g, e) {
  const par = (e.fhBeat = (e.fhBeat || 0) + 1) % 2, per = 60 / e.fhBpm, tele = Math.max(0.38, per * 0.6), L = reach(e);
  for (let k = 0; k < VEINS; k++) {
    if (k % 2 !== par) continue;
    const a = (e.fhSpoke || 0) + (k * TAU) / VEINS;
    g.fx.push({ kind: 'lane', x: e.x + Math.cos(a) * 1.8, y: e.y + Math.sin(a) * 1.8, a, len: L, w: 0.75, delay: tele, t: 0, life: tele + 0.28, dmg: g.bxDmg(e, 110), by: e.D.name, hitT: 0, cols: ['#f2d070', '#fff6c8'] });
  }
  e.fhSpoke = (e.fhSpoke || 0) + 0.07;                     // the veins creep round
  e.fhBeatUntil = g.t + 0.18;
  g.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: par ? 2.4 : 3.2, color: par ? '#ff6a6a' : '#f2d070' });
  if (e.bx.phase === 3) e.fhRingGoal = par ? e.fhRingMin : e.fhRingMax;   // (III: lub, the room closes in; dub, it opens)
}

// ---- I: its blood, its gold
function arteries(g, e, V) {                               // rings of blood, each turned half a step
  for (let k = 0; k < (V.rings || 2); k++) e.bx.vol.push({ t: k * 0.3, V: { form: 'special', name: 'bloodRing', k, dmg: V.dmg } });
}
function bloodRing(g, e, V) { const n = 24, off = (V.k % 2) * (Math.PI / n); for (let i = 0; i < n; i++) g.bxShot(e, e.x, e.y - 1, off + (i / n) * TAU, { shot: 'blood', speed: 3.8, range: 12, dmg: V.dmg || 120 }); }
function shards(g, e, V) {                                 // gold shards off its scars, at you, in waves
  for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.22, V: { form: 'special', name: 'shardFan', w, dmg: V.dmg } });
}
function shardFan(g, e, V) { const q = target(g, e), a = angleTo(e.x, e.y - 1, q.x, q.y); for (let k = -3; k <= 3; k++) g.bxShot(e, e.x, e.y - 1, a + k * 0.16 + (V.w % 2) * 0.08, { shot: 'kintsugi', speed: 8, range: 12, dmg: V.dmg || 130 }); }

// ---- II: the saints, and their prayers
const SAINT = 'fh_saint';
if (!ENEMIES[SAINT]) ENEMIES[SAINT] = { name: 'a Praying Saint', biome: 'heart', hp: 1e6, def: 0, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 0, reg: 'heart_saint/saint', scale: 1.4, noBar: true, contact: 0, attacks: [], loot: [] };
const saintsOf = (g, e) => e.fhSaints || g.enemies.filter((q) => !q.dead && q.D && q.D.reg === 'heart_saint/saint');
function kneel(g, e, n) {                                  // saints kneel round the room, each a beam of prayer to it
  const A = arena(e), m = g.map;
  e.fhSaints = (e.fhSaints || []).filter((s) => !s.dead);
  for (let k = 0; k < n; k++) {
    let x = e.x, y = e.y;
    for (let t = 0; t < 30; t++) { const a = R() * TAU, d = Math.min(A.w, A.h) * (0.32 + R() * 0.12); x = e.x + Math.cos(a) * d; y = e.y + Math.sin(a) * d; if (open(m, x, y) && open(m, x + 1, y) && open(m, x - 1, y)) break; }
    const s = g.addEnemy(SAINT, x, y); s.seen = true; s.noLoot = true; s.friendly = true; s.fhOf = e; s.fhHold = 0; s.fhLeft = 13; s.hp = s.maxHp = 1e6;
    e.fhSaints.push(s);
  }
  g.banner('Saints kneel and pray to it. Stand in a prayer to stop it reaching the heart!', 2600);
}
function prayers(g, e, dt) {
  for (const s of e.fhSaints || []) {
    if (s.dead) continue;
    // anyone standing in the beam, between the saint and the heart, holds it back
    const dx = e.x - s.x, dy = e.y - 1 - s.y, L2 = dx * dx + dy * dy || 1;
    const inBeam = players(g).some((q) => { const k = ((q.x - s.x) * dx + (q.y - s.y) * dy) / L2; return k > 0.08 && k < 0.85 && Math.hypot(q.x - (s.x + dx * k), q.y - (s.y + dy * k)) < 0.7; });
    s.fhHold = inBeam ? s.fhHold + dt : Math.max(0, s.fhHold - dt * 0.5);
    s.fhBlocked = inBeam;
    if (s.fhHold >= 1.2) {                                  // intercepted: the saint fades, its prayer unheard
      s.noLoot = true; s.dead = true; s.deadT = 0; g.vx({ k: 'burst', x: s.x, y: s.y - 1, n: 16, colors: ['#e8e0f8', '#ffffff'] }); g.float(s.x, s.y - 2, 'INTERCEPTED', '#e8e0f8');
      e.fhIntercepted = (e.fhIntercepted || 0) + 1; continue;
    }
    if (!inBeam) { e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.0005 * dt); e.fhDrinking = true; }   // it drinks the prayer
    if ((s.fhLeft -= dt) <= 0) { s.noLoot = true; s.dead = true; s.deadT = 0; g.float(e.x, e.y - 3, 'AMEN', '#ffd650'); }   // (its prayer said; it goes)
  }
  e.fhSaints = (e.fhSaints || []).filter((s) => !s.dead);
  e.fhPraying = e.fhSaints.filter((s) => !s.fhBlocked).length;
}
function choir(g, e, V) {                                  // prayer-light, out of it in a turning spiral
  for (let k = 0; k < 14; k++) e.bx.vol.push({ t: k * 0.12, V: { form: 'special', name: 'choirArm', k, dmg: V.dmg } });
}
function choirArm(g, e, V) { for (let i = 0; i < 4; i++) g.bxShot(e, e.x, e.y - 1, V.k * 0.21 + (i * TAU) / 4, { shot: 'prayer', speed: 3.6, range: 12, dmg: V.dmg || 110 }); }

// ---- III: the eye, and the breathing room
function gaze(g, e, V) {                                   // the eye looks at each of you: a marked line, then it burns
  for (const q of players(g)) { const a = angleTo(e.x, e.y - 1, q.x, q.y), L = reach(e) * 1.4;
    g.fx.push({ kind: 'laser', x0: e.x, y0: e.y - 1, a, len: L, t: 0, tele: V.tele || 0.9, act: 0.45, life: (V.tele || 0.9) + 0.55, dmg: g.bxDmg(e, V.dmg || 150), by: e.D.name, hit: false });
    g.bxShot(e, e.x, e.y - 1, a + 0.35, { shot: 'gaze', speed: 5, range: 12, dmg: 110 }); g.bxShot(e, e.x, e.y - 1, a - 0.35, { shot: 'gaze', speed: 5, range: 12, dmg: 110 }); }
}

// ---- last: THE LAST BEAT. It races, it stops, and in the silence the gold scars glow: stand in one
const finale = {
  at: 0.08, dur: 11, name: 'The Last Beat', say: 'it races... then stops', after: 1.4, keepShots: false,
  start(g, e) {
    e.fhBpm = 132; e.fhBeatT = 0; e.fhLastDone = false;
    const A = arena(e), m = g.map; let n = 0;
    for (let k = 0; k < 40 && n < 4; k++) { const a = (n / 4) * TAU + R() * 0.6, d = Math.min(A.w, A.h) * (0.22 + R() * 0.15), x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d;
      if (open(m, x, y) && open(m, x + 1, y + 1) && open(m, x - 1, y - 1)) { e['fhS' + n + 'x'] = x; e['fhS' + n + 'y'] = y; n++; } }
    e.fhScars = n;
  },
  update(g, e, dt, T) {
    if (T < 5.5) { if ((e.fhBeatT = (e.fhBeatT || 0) + dt) >= 60 / e.fhBpm) { e.fhBeatT = 0; beat(g, e); } return; }   // racing
    if (!e.fhLastUntil || e.fhLastUntil < g.t - 5) { e.fhLastUntil = g.t + 2.8; g.banner('...it stops. STAND IN THE GOLD.', 2400); }   // the silence
    if (!e.fhLastDone && g.t >= e.fhLastUntil) {           // THE LAST BEAT: a blast over everything but the scars (the browsers feel it)
      e.fhLastDone = true; g.vx({ k: 'shake', amt: 12 }); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: reach(e) * 1.2, color: '#ff3a1a' });
      if (!g.netTargets) lastBeatHits(g, e);               // (offline: you here; online each browser checks its own player)
    }
  },
  end(g, e) { e.fhScars = 0; e.fhLastUntil = 0; e.fhBpm = 120; },
};
function lastBeatHits(g, e) {
  const p = g.player; if (p.dead) return;
  for (let k = 0; k < (e.fhScars || 0); k++) if (Math.hypot(p.x - e['fhS' + k + 'x'], p.y - e['fhS' + k + 'y']) < 1.7) return;
  g.hurtPlayer(g.bxDmg(e, 420), `${e.D.name}'s last beat`);
}

export default {
  id: 'fallen_heart', art: 'fallen_heart', shotSheet: 'heart_shots', name: 'The Fallen Heart', biome: 'heart', hp: 400000, def: 40, xp: 16000,
  r: 2.2, speed: 0, keep: 0, faces: false, spawnCentre: true, tempo: 0.9, finale,
  phases: {
    1: { move: 'hold', patterns: [
      { name: 'its blood', windup: 0.6, recover: 0.9, special: 'arteries', rings: 2, dmg: 120 },
      { name: 'gold off its scars', windup: 0.5, recover: 0.9, special: 'shards', waves: 3, dmg: 130 },
      { name: 'its blood', windup: 0.5, recover: 0.8, special: 'arteries', rings: 3, dmg: 120 },
    ] },
    2: { move: 'hold', patterns: [
      { name: 'the choir', windup: 0.6, recover: 0.9, special: 'choir', dmg: 110 },
      { name: 'gold off its scars', windup: 0.5, recover: 0.8, special: 'shards', waves: 4, dmg: 130 },
      { name: 'its blood', windup: 0.5, recover: 0.8, special: 'arteries', rings: 2, dmg: 120 },
    ] },
    3: { move: 'hold', patterns: [
      { name: 'its eye', windup: 0.6, recover: 0.8, special: 'gaze', dmg: 150 },
      { name: 'its blood', windup: 0.5, recover: 0.8, special: 'arteries', rings: 3, dmg: 125 },
      { name: 'the choir', windup: 0.5, recover: 0.8, special: 'choir', dmg: 115 },
      { name: 'its eye', windup: 0.5, recover: 0.7, special: 'gaze', tele: 0.8, dmg: 150 },
    ] },
  },
  specials: { arteries, bloodRing, shards, shardFan, choir, choirArm, gaze },
  onWake(g, e) { e.fhBpm = 46; e.fhBeatT = 0; e.fhRing = 0; g.banner('THE FALLEN HEART · count the beats', 3000); },
  onPhase(g, e, ph) {
    if (ph === 2) { g.banner('THE SAINTS PRAY · stand in their prayers', 2800); e.fhPrayT = 2; }
    if (ph === 3) { const A = arena(e); e.fhRingMax = Math.min(A.w, A.h) / 2 - 0.5; e.fhRingMin = Math.max(5, e.fhRingMax * 0.55); e.fhRing = e.fhRingMax; e.fhRingGoal = e.fhRingMax;
      g.banner('IT REMEMBERS BEING A GOD · the room breathes with it', 2800); }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro' || S.state === 'death' || S.state === 'deathhold') return;
    // the beat quickens as it weakens, and with every prayer it drinks
    e.fhBpm = 46 + 44 * (1 - e.hp / e.maxHp) + 7 * (e.fhPraying || 0);
    if (S.state !== 'morph' && (e.fhBeatT = (e.fhBeatT || 0) + dt) >= 60 / e.fhBpm) { e.fhBeatT = 0; beat(g, e); }
    if (S.phase >= 2) { prayers(g, e, dt); if ((e.fhPrayT = (e.fhPrayT ?? 2) - dt) <= 0) { e.fhPrayT = S.phase === 2 ? 15 : 19; kneel(g, e, S.phase === 2 ? 3 : 2); } }
    if (S.phase === 3 && e.fhRingGoal) e.fhRing += Math.sign(e.fhRingGoal - e.fhRing) * Math.min(Math.abs(e.fhRingGoal - e.fhRing), dt * 9);
    else e.fhRing = 0;
  },
  // in your own browser: outside the breathing room you burn; the last beat finds you unless you stand in the gold
  local(g, e, dt) {
    const p = g.player; if (p.dead) return;
    if (e.fhRing > 0 && Math.hypot(p.x - e.x, p.y - e.y) > e.fhRing && (e.fhRingHitT = (e.fhRingHitT || 0) - dt) <= 0) { e.fhRingHitT = 0.5; g.hurtPlayer(g.bxDmg(e, 90), `${e.D.name}'s heartbeat`); }
    if (e.fhLastUntil > 0 && g.t >= e.fhLastUntil && e.fhLastSeen !== e.fhLastUntil && e.net) { e.fhLastSeen = e.fhLastUntil; lastBeatHits(g, e); }
  },
  onDeath(g, e) {
    for (const s of e.fhSaints || []) if (!s.dead) { s.noLoot = true; s.dead = true; s.deadT = 0; }
    e.fhRing = 0; e.fhScars = 0; g.banner('THE HEART STOPS. FOR THE FIRST TIME SINCE THE FALL, GODFALL IS STILL.', 3600);
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.4, r: e.fhBeatUntil > g.t ? 150 : 110, col: '#ff5a4a' }]; },
  drawGround(r, g, e) {
    const b = r.b, A = arena(e), L = reach(e);
    // the veins: gold lines out across the floor; the set about to burst glows (lub odd, dub even)
    const next = ((e.fhBeat || 0) + 1) % 2;
    b.lineCap = 'round';
    for (let k = 0; k < VEINS; k++) {
      const a = (e.fhSpoke || 0) + (k * TAU) / VEINS, [x0, y0] = r.proj(e.x + Math.cos(a) * 1.8, e.y + Math.sin(a) * 1.8), [x1, y1] = r.proj(e.x + Math.cos(a) * L, e.y + Math.sin(a) * L);
      b.globalAlpha = k % 2 === next ? 0.5 : 0.22; b.strokeStyle = '#a8822e'; b.lineWidth = 3; b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke();
    }
    b.globalAlpha = 1; b.lineCap = 'butt';
    // the prayers: a beam from each saint to it (white; red where someone stands in it, holding it back)
    for (const s of saintsOf(g, e)) {
      const [sx, sy] = r.proj(s.x, s.y - 0.8), [hx, hy] = r.proj(e.x, e.y - 1.2);
      b.globalAlpha = 0.35; b.strokeStyle = s.fhBlocked ? '#ff6a6a' : '#e8e0f8'; b.lineWidth = 6; b.beginPath(); b.moveTo(sx, sy); b.lineTo(hx, hy); b.stroke();
      b.globalAlpha = 0.9; b.lineWidth = 2; b.beginPath(); b.moveTo(sx, sy); b.lineTo(hx, hy); b.stroke(); b.globalAlpha = 1;
      if (s.fhHold > 0) { b.strokeStyle = '#ffffff'; b.lineWidth = 3; b.beginPath(); b.arc(sx, sy - 6, 9, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, s.fhHold / 1.2)); b.stroke(); }
    }
    // the breathing room: its edge, and the burning outside it
    if (e.fhRing > 0) {
      b.strokeStyle = '#ff3a1a'; b.globalAlpha = 0.8; b.lineWidth = 3; b.beginPath();
      for (let k = 0; k <= 48; k++) { const a = (k / 48) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * e.fhRing, e.y + Math.sin(a) * e.fhRing); if (k) b.lineTo(x, y); else b.moveTo(x, y); }
      b.stroke(); b.globalAlpha = 1;
    }
    // the last beat: the gold scars to stand in
    for (let k = 0; k < (e.fhScars || 0); k++) {
      const x = e['fhS' + k + 'x'], y = e['fhS' + k + 'y']; if (x === undefined) continue;
      b.globalAlpha = 0.35 + 0.25 * Math.sin(g.t * 6 + k); b.fillStyle = '#f2d070'; b.beginPath();
      for (let j = 0; j <= 24; j++) { const a = (j / 24) * TAU, [px, py] = r.proj(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6); if (j) b.lineTo(px, py); else b.moveTo(px, py); }
      b.fill(); b.globalAlpha = 1;
    }
  },
  drawTop(r, g, e) {                                       // its pulse: the beats a minute, over it
    if (!e.fhBpm || e.bx.state === 'sleep') return;
    const [x, y] = r.proj(e.x, e.y - 4.6); r.b.textAlign = 'center';
    r.plabel(r.b, `${Math.round(e.fhBpm)} BPM`, x, y, 16, e.fhBeatUntil > g.t ? '#ff6a6a' : e.fhPraying ? '#e8e0f8' : '#f2d070');
  },
  get loot() { return DUNGEON_BOSSES.fallen_heart.loot; },
  lootLuck: 2,
};
