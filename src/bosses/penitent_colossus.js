// The Penitent Colossus: Godfall's realm boss on the boss framework (2026-10-22). A kneeling giant of stone, mended with
// gold. "I REMEMBER EVERY SIN. KNEEL. Penance is owed. My hands broke a god." Its own mechanic:
//   KNEEL - it calls on you to kneel, and prays: while it prays, anyone who moves is lashed (in your own browser: a
//     warning, then the prayer; stand still through it). It never lets a prayer pass unanswered.
//   I   It Kneels                - the gaze (gold shards at you), the seams (gold cracks across the ground, marked
//                                  then burning), the slam (marked where you stand)
//   II  It Remembers Its Crimes  - longer prayers, more seams
//   III Penance                  - it rises; prayers come more often
//   Last: The Hands That Broke a God - its two great hands fall again and again, each following one of you
// Art: tools/build_last_bosses.py ('bx_penitent_colossus', shots 'last_shots/penitent_colossus.<name>').
import { REALM_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, players, target, fan, mark, running, ahead } from './kit.js';

const GOLD = ['#f2d070', '#ffffff'];
function kneel(g, e, V) {                                  // KNEEL: a warning, then the prayer (plain times: every browser judges its own player)
  e.pcWarnUntil = g.t + (V.warn || 1.2); e.pcPrayUntil = e.pcWarnUntil + (V.dur || 2);
  g.banner('"KNEEL." Stand still while it prays!', 1800);
}
function gaze(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e); for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.22, V: { form: 'special', name: 'gazeFan', a: angleTo(ox, oy, q.x, q.y), w, dmg: V.dmg } }); }
function gazeFan(g, e, V) { const [ox, oy] = g.bxOrigin(e); fan(g, e, ox, oy, V.a + (V.w % 2) * 0.1, 5, 0.6, { shot: 'shard', speed: 7.5, range: 12, dmg: V.dmg || 60 }); }
function seams(g, e, V) {                                  // gold cracks across the ground: marked, then burning
  const q = target(g, e);
  for (let k = 0; k < (V.n || 3); k++) { const a = R() * Math.PI, cx = k ? e.x + (R() - 0.5) * 14 : q.x, cy = k ? e.y + (R() - 0.5) * 10 : q.y, L = 18;
    g.fx.push({ kind: 'lane', x: cx - Math.cos(a) * L / 2, y: cy - Math.sin(a) * L / 2, a, len: L, w: 0.55, delay: V.delay || 1.2, t: 0, life: (V.delay || 1.2) + 1.4, dmg: g.bxDmg(e, V.dmg || 70), by: e.D.name, hitT: 0, cols: GOLD }); }
}
function slam(g, e, V) { for (const q of players(g)) { mark(g, e, q.x, q.y, 2, V.delay || 1.1, V.dmg || 90, GOLD, 8, 'last_shots/penitent_colossus.shard'); } g.vx({ k: 'shake', amt: 4 }); }
const finale = {
  at: 0.1, dur: 11, name: 'The Hands That Broke a God', say: 'its hands fall', after: 1.3,
  start(g, e) { e.pcHandT = 1; },
  update(g, e, dt) {
    if ((e.pcHandT -= dt) > 0) return; e.pcHandT = 1.6;
    const L = players(g); for (let k = 0; k < 2; k++) { const q = L[k % L.length] || g.player; mark(g, e, q.x + (R() - 0.5), q.y + (R() - 0.5), 3, 1.1, 130, GOLD, 10, 'last_shots/penitent_colossus.shard'); }
  },
};

// against a steady circle (check_boss_safespots, 2026-10-27): only when you run, at where you are running to
function gazeFollows(g, e, V) {                           // its gaze follows you: a fast, tight fan of shards thrown to where you will be
  if (!running(e)) return;
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), T = Math.min(1.2, Math.hypot(q.x - ox, q.y - oy) / 9), [x, y] = ahead(g, e, T);
  fan(g, e, ox, oy, angleTo(ox, oy, x, y - 0.4), 3, 0.22, { shot: 'shard', speed: 9, range: 13, dmg: V.dmg || 64 });
}

export default {
  id: 'penitent_colossus', art: 'penitent_colossus', shotSheet: 'last_shots', name: 'The Penitent Colossus', biome: 'godfall', hp: 168000, def: 26, xp: 7000,
  dmgScale: 1.6, r: 1.7, speed: 0.4, keep: 6, faces: false, tempo: 1, finale,
  phases: {
    1: { move: 'pace', pressure: [{ every: 3.6, special: 'gazeFollows', delay: 2.9, dmg: 64 }, { every: 14, special: 'kneel', warn: 1.4, dur: 2 }], patterns: [
      { name: 'its gaze', windup: 0.6, recover: 0.7, special: 'gaze', waves: 3, dmg: 60 },
      { name: 'the seams', windup: 0.6, recover: 0.7, special: 'seams', n: 3, dmg: 70 },
      { name: 'the slam', windup: 0.7, recover: 0.8, special: 'slam', dmg: 90 },
    ] },
    2: { move: 'pace', pressure: [{ every: 3.2, special: 'gazeFollows', delay: 2.6, dmg: 64 }, { every: 12, special: 'kneel', warn: 1.2, dur: 2.6 }], patterns: [
      { name: 'the seams', windup: 0.5, recover: 0.6, special: 'seams', n: 4, dmg: 72 },
      { name: 'its gaze', windup: 0.5, recover: 0.6, special: 'gaze', waves: 4, dmg: 60 },
      { name: 'the slam', windup: 0.6, recover: 0.7, special: 'slam', dmg: 92 },
    ] },
    3: { move: 'pace', pressure: [{ every: 2.8, special: 'gazeFollows', delay: 2.2, dmg: 64 }, { every: 9, special: 'kneel', warn: 1.1, dur: 2.4 }], patterns: [
      { name: 'the slam', windup: 0.5, recover: 0.6, special: 'slam', dmg: 95 },
      { name: 'the seams', windup: 0.4, recover: 0.5, special: 'seams', n: 5, dmg: 74 },
      { name: 'its gaze', windup: 0.4, recover: 0.5, special: 'gaze', waves: 4, dmg: 62 },
    ] },
  },
  specials: { kneel, gaze, gazeFan, seams, slam, gazeFollows },
  onWake(g) { g.banner('THE PENITENT COLOSSUS · when it says KNEEL, be still', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('IT REMEMBERS ITS CRIMES', 2400); if (ph === 3) g.banner('PENANCE', 2400); },
  // in your own browser: move while it prays and you're lashed
  local(g, e, dt) {
    const p = g.player; if (p.dead) return;
    if (e.pcPrayUntil > g.t && g.t >= e.pcWarnUntil && p.moving && Math.hypot(p.x - e.x, p.y - e.y) < 22 && (e.pcLashT = (e.pcLashT || 0) - dt) <= 0) { e.pcLashT = 0.45; g.hurtPlayer(g.bxDmg(e, 70), `${e.D.name}'s lash`); g.float(p.x, p.y - 1.5, 'KNEEL', '#f2d070'); }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: 90, col: '#f2d070' }]; },
  drawTop(r, g, e) {                                       // the prayer: a warning, then KNEEL over it
    if (!(e.pcPrayUntil > g.t)) return;
    const [x, y] = r.proj(e.x, e.y - 4.6); r.b.textAlign = 'center';
    r.plabel(r.b, g.t < e.pcWarnUntil ? 'it begins to pray...' : 'KNEEL', x, y, g.t < e.pcWarnUntil ? 16 : 24, g.t < e.pcWarnUntil ? '#e8e4f0' : '#f2d070');
  },
  get loot() { return REALM_BOSSES.penitent_colossus.loot; },
  lootLuck: 1.4,
};
