// The Sleeper, Who Dreams the Realm: the Sleeper's Dream's boss on the boss framework (2026-10-22). From pages found under
// a pillow: "Do not stand still. Stillness is sleep, and sleep is how it keeps you." "It cannot be woken. It must be
// woken. Ring every alarm you can find, and run."
//   Drowsiness (its signature, felt in your own browser) - stand still and you grow drowsy; drowsy enough and you fall
//     asleep where you stand. Its lullaby's Zs make you drowsier. Keep moving.
//   I   It Dreams of You     - flocks of sheep hopping across the room (one gap a row), lullabies, blinking stars,
//                              a tide of crescent moons from every side
//   II  The Dream Turns      - it sleeps, unhurt (DREAMING); its nightmare-self walks the room: every blow on the
//                              nightmare reaches the Sleeper
//   III The Nightmare Wakes  - dream logic: for a while your feet forget left from right
//   Last: It Will Not Wake   - three alarm clocks ring out round the room: break all three before it settles back to
//                              sleep, and it wakes (a heavy blow); fail, and the dream stampedes
// Art: tools/build_last_bosses.py ('bx_the_sleeper', alarms 'last_kin/alarm', shots 'last_shots/the_sleeper.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, arena, players, target, open, kill, running, ahead, heading } from './kit.js';

const box = (e) => arena(e, 26, 20);
function sheep(g, e, V) {
  const A = box(e), n = V.n || 7;
  for (let r0 = 0; r0 < (V.rows || 3); r0++) e.bx.vol.push({ t: r0 * 0.6, V: { form: 'special', name: 'sheepRow', r0, n, dmg: V.dmg } });
}
function sheepRow(g, e, V) {
  const A = box(e), dir = V.r0 % 2 ? -1 : 1, gap = Math.floor(R() * V.n);
  for (let k = 0; k < V.n; k++) { if (k === gap) continue; const y = A.y + 1.5 + ((k + 0.5) * (A.h - 3)) / V.n, x = dir > 0 ? A.x + 1 : A.x + A.w - 1;
    const b = g.bxShot(e, x, y, dir > 0 ? 0 : Math.PI, { shot: 'sheep', speed: 5.5, range: A.w, dmg: V.dmg || 120 }); if (b) b.mv = { d4: true, hop: 0.55 }; }
}
function lullaby(g, e, V) { for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.5, V: { form: 'special', name: 'zzz', dmg: V.dmg } }); }
function zzz(g, e, V) { const [ox, oy] = g.bxOrigin(e), base = R() * TAU; for (let k = 0; k < 12; k++) { const b = g.bxShot(e, ox, oy, base + (k * TAU) / 12, { shot: 'z', speed: 2.6, range: 11, dmg: V.dmg || 60 }); if (b) { b.drowsy = 0.35; b.mv = { d4: true, lull: 1 }; } } }
function stars(g, e, V) { const [ox, oy] = g.bxOrigin(e), base = R() * TAU; for (let k = 0; k < (V.n || 22); k++) { const b = g.bxShot(e, ox, oy, base + (k * TAU) / (V.n || 22), { shot: 'star', speed: 3.4 * (k % 2 ? 1 : 0.75), range: 12, dmg: V.dmg || 100 }); if (b) b.mv = { d4: true, blink: [0.5, 0.35] }; } }
function crescents(g, e, V) {
  const A = box(e), cx = A.x + A.w / 2, cy = A.y + A.h / 2, rot = R() * TAU, n = V.n || 16, r = Math.max(A.w, A.h) * 0.5;
  for (let k = 0; k < n; k++) { const a = rot + (k * TAU) / n, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * (A.h / A.w); g.bxShot(e, x, y, angleTo(x, y, cx, cy) + 0.25, { shot: 'moon', speed: 4.2, range: r * 2, dmg: V.dmg || 115 }); }
}
// it reaches for you: a fan of stars at each of you (its one aimed attack; the rest of the dream drifts)
function reach(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let w = 0; w < (V.waves || 2); w++) e.bx.vol.push({ t: w * 0.3, V: { form: 'special', name: 'reachFan', w, dmg: V.dmg } }); }
function reachFan(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (const q of players(g)) { const a = angleTo(ox, oy, q.x, q.y); for (let k = -2; k <= 2; k++) g.bxShot(e, ox, oy, a + k * 0.16 + (V.w % 2) * 0.08, { shot: 'star', speed: 6.5, range: 13, dmg: V.dmg || 100 }); } }
// ---- II: the dream turns. It sleeps unhurt; its nightmare-self walks, and blows on it reach the Sleeper
function dreamshift(g, e, V) {
  if (e.slNight && !e.slNight.dead) { e.slShiftUntil = g.t + (V.dur || 11); return; }
  const A = box(e), x = 2 * (A.x + A.w / 2) - e.x, y = 2 * (A.y + A.h / 2) - e.y, nm = g.addEnemy('sleepers_nightmare', open(g.map, x, y) ? x : e.x + 4, open(g.map, x, y) ? y : e.y);
  nm.seen = true; nm.aggro = true; nm.noLoot = true; nm.linkTo = e; e.slNight = nm; e.slShiftUntil = g.t + (V.dur || 11);
  g.banner('THE DREAM TURNS TO NIGHTMARE: strike its nightmare-self!', 2200);
}
function endShift(g, e) { if (e.slNight && !e.slNight.dead) { g.vx({ k: 'burst', x: e.slNight.x, y: e.slNight.y - 1, n: 30, colors: ['#ff7ab8', '#2a0a30', '#ffffff'] }); kill(e.slNight); } e.slNight = null; e.slShiftUntil = 0; }
function dreamlogic(g, e, V) { e.slInvUntil = g.t + (V.dur || 4.5); g.banner('DREAM LOGIC: your feet forget left from right!', 2000); }
// ---- last: it will not wake. Three alarms; break them all
const ALARM = 'sl_alarm';
if (!ENEMIES[ALARM]) ENEMIES[ALARM] = { name: 'An Alarm Clock', biome: 'dream', hp: 9000, def: 0, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 0, reg: 'last_kin/alarm', scale: 1.4, contact: 0, attacks: [], loot: [] };
const finale = {
  at: 0.1, dur: 14, name: 'It Will Not Wake', say: 'ring every alarm, and run', after: 1.4,
  start(g, e) {
    endShift(g, e); const A = box(e), m = g.map; e.slAlarms = [];
    for (let k = 0; k < 3; k++) { let x = 0, y = 0; for (let t = 0; t < 30; t++) { const a = (k / 3) * TAU + R() * 0.8, d = Math.min(A.w, A.h) * (0.3 + R() * 0.12); x = A.x + A.w / 2 + Math.cos(a) * d; y = A.y + A.h / 2 + Math.sin(a) * d; if (open(m, x, y)) break; }
      const c = g.addEnemy(ALARM, x, y); c.seen = true; c.noLoot = true; e.slAlarms.push(c); }
    e.slFinT = 1;
  },
  update(g, e, dt, T) {
    if ((e.slFinT -= dt) <= 0) { e.slFinT = 2.2; sheepRow(g, e, { r0: Math.floor(T), n: 7, dmg: 110 }); }
    const left = (e.slAlarms || []).filter((c) => !c.dead).length;
    if (!left && !e.slWoke) { e.slWoke = true; e.hp = Math.max(1, e.hp - Math.round(e.maxHp * 0.04)); g.banner('EVERY ALARM RINGS. IT WAKES, AND IT HURTS.', 2400); g.vx({ k: 'shake', amt: 9 }); e.bx.finT = Math.max(e.bx.finT, (e.bx.fin || e.bx.B.finale).dur - 0.1); }
    if (T > 13.3 && left && !e.slStamp) { e.slStamp = true; g.banner('It settles back to sleep... THE DREAM STAMPEDES.', 2200); for (let k = 0; k < 4; k++) e.bx.vol.push({ t: k * 0.35, V: { form: 'special', name: 'sheepRow', r0: k, n: 9, dmg: 140 } }); }
  },
  end(g, e) { for (const c of e.slAlarms || []) kill(c); },
};

// against a steady circle (check_boss_safespots, 2026-10-27): only when you run, at where you are running to
function flock(g, e, V) {                                 // a flock of sheep across your path, from one side and then the other (its finale's stampede is the whole dream's)
  if (!running(e)) return;
  for (let k = 0; k < 2; k++) g.fvLater(k * 0.3, () => flockSheep(g, e, { k, dmg: V.dmg }));   // (its own timers: a boss's volley queue plays only in its own attacks)
}
function flockSheep(g, e, V) {                         // three abreast, so the stampede covers your path either side of where you'll be
  const [x, y] = ahead(g, e, 0.8), [hx, hy] = heading(e), s = V.k % 2 ? 1 : -1;
  for (const o of [-0.8, 0, 0.8]) g.bxShot(e, x + hx * o - hy * s * 5.5, y + hy * o + hx * s * 5.5 - 0.4, Math.atan2(-hx * s, hy * s), { shot: 'sheep', speed: 7, range: 11, dmg: V.dmg || 110 });
}

export default {
  id: 'the_sleeper', art: 'the_sleeper', shotSheet: 'last_shots', name: 'The Sleeper, Who Dreams the Realm', biome: 'dream', hp: 520000, def: 40, xp: 22000,
  // dmgScale was 2.2: every hit took 46% (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs)
  dmgScale: 1.45, r: 1.7, speed: 1.0, keep: 7, faces: true, tempo: 0.9, finale,
  phases: {
    1: { move: 'pace', pressure: [{ every: 5, special: 'flock', delay: 4, dmg: 110 }], patterns: [
      { name: 'counting sheep', windup: 0.6, recover: 0.6, special: 'sheep', rows: 3, n: 7, dmg: 120 },
      { name: 'a lullaby', windup: 0.6, recover: 0.6, special: 'lullaby', waves: 3, dmg: 60 },
      { name: 'blinking stars', windup: 0.6, recover: 0.6, special: 'stars', n: 22, dmg: 100 },
      { name: 'a tide of moons', windup: 0.8, recover: 0.6, special: 'crescents', n: 16, dmg: 115 },
      { name: 'it reaches for you', windup: 0.5, recover: 0.6, special: 'reach', waves: 2, dmg: 100 },
    ] },
    2: { move: 'pace', pressure: [{ every: 4.5, special: 'flock', delay: 3.6, dmg: 110 }], patterns: [
      { name: 'the dream turns', windup: 1.0, recover: 0.5, special: 'dreamshift', dur: 11 },
      { name: 'counting sheep', windup: 0.5, recover: 0.6, special: 'sheep', rows: 3, n: 7, dmg: 120 },
      { name: 'blinking stars', windup: 0.5, recover: 0.6, special: 'stars', n: 24, dmg: 100 },
      { name: 'a tide of moons', windup: 0.6, recover: 0.6, special: 'crescents', n: 18, dmg: 115 },
      { name: 'a lullaby', windup: 0.5, recover: 0.6, special: 'lullaby', waves: 3, dmg: 60 },
      { name: 'it reaches for you', windup: 0.4, recover: 0.5, special: 'reach', waves: 3, dmg: 105 },
    ] },
    3: { move: 'pace', pressure: [{ every: 4, special: 'flock', delay: 3.2, dmg: 110 }], patterns: [
      { name: 'dream logic', windup: 1.0, recover: 0.6, special: 'dreamlogic', dur: 4.5 },
      { name: 'a tide of moons', windup: 0.5, recover: 0.5, special: 'crescents', n: 20, dmg: 118 },
      { name: 'the dream turns', windup: 0.8, recover: 0.5, special: 'dreamshift', dur: 9 },
      { name: 'blinking stars', windup: 0.5, recover: 0.5, special: 'stars', n: 26, dmg: 102 },
      { name: 'counting sheep', windup: 0.5, recover: 0.5, special: 'sheep', rows: 4, n: 8, dmg: 122 },
      { name: 'a lullaby', windup: 0.5, recover: 0.5, special: 'lullaby', waves: 4, dmg: 62 },
      { name: 'it reaches for you', windup: 0.4, recover: 0.4, special: 'reach', waves: 3, dmg: 110 },
    ] },
  },
  specials: { sheep, sheepRow, lullaby, zzz, stars, crescents, dreamshift, dreamlogic, reach, reachFan, flock, flockSheep },
  onWake(g) { g.banner('THE SLEEPER · it dreams of you. Keep moving: stillness is sleep.', 3200); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('THE DREAM TURNS', 2400); if (ph === 3) g.banner('THE NIGHTMARE WAKES', 2400); },
  update(g, e) { if (e.slShiftUntil > 0 && g.t >= e.slShiftUntil) endShift(g, e); if (e.slNight && e.slNight.dead) { e.slNight = null; e.slShiftUntil = 0; } },
  immune(g, e) { return e.slShiftUntil > g.t && !e.linkHit; },   // (its nightmare-self's wounds still reach it)
  immuneText: 'DREAMING',
  // in your own browser: stillness is sleep; dream logic turns you round
  local(g, e, dt) {
    const p = g.player; if (p.dead || e.bx.state === 'sleep') return;
    g.map.bxDrowsy = true;
    p.drowsy = Math.max(0, Math.min(1, (p.drowsy || 0) + (p.moving ? -0.22 : 0.3) * dt));
    if (p.drowsy >= 1) { p.drowsy = 0; p.status.asleep = 1.5; g.banner('You fall asleep!', 1400); g.float(p.x, p.y - 1.4, 'Zzz', '#c8b0ff'); }
    if (e.slInvUntil > g.t) g.invertUntil = Math.max(g.invertUntil || 0, Math.min(e.slInvUntil, g.t + 0.2));
  },
  onDeath(g, e) { endShift(g, e); for (const c of e.slAlarms || []) kill(c); g.banner('THE SLEEPER WAKES AT LAST, AND THE DREAM IS OVER.', 3600); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2, r: 110, col: e.slShiftUntil > g.t ? '#ff7ab8' : '#c8b0ff' }]; },
  get loot() { return DUNGEON_BOSSES.the_sleeper.loot; },
  lootLuck: 2.2,
};
