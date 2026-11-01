// The Hollow Jarl, Warrior (2026-11-01, the user's design and concept sheet): an ancient hollowed warlord who holds one
// of the Throne's champion courts and its seal. He hunts you: the danger is his movement and his reach, not a screen
// full of bullets. Every blow is marked before it lands and locked when it is marked.
//   I   The Fallen King (100-65%) - he walks you down, measured and heavy:
//       Royal Cleave      a 120-degree wedge marked 0.8 s, then the axe through it, and seven crescents fanned beyond it
//                         (from past its rim: one swing never strikes you twice)
//       Gravebound Lunge  its line shown 0.85 s, then he charges along it (locked) up to five tiles; six ash shards
//                         thrown back and to the sides where he stops
//       Crownquake        the axe to the ground, 0.9 s marked: two rings of stone, each with two gaps, the second's
//                         turned a quarter from the first's
//   II  The Oathbreaker (65-30%) - the crown cracked, ash leaking from him, quicker on his feet:
//       Vassals of the Dead  two spectral warriors at either side of the court (never more than two; 12 s, or killed)
//       The King's Execution a broad wedge marked 1.1 s, the axe into it, eight stone fragments out of the blow; then a
//                         clear breath for you to strike
//   III The Last Oath (30-0%) - the cloak torn, the plate split, a berserker:
//       Crownfall         a marked charge; a marked sweep throwing two crossing fans of crescents; a marked slam
//                         sending walls of shot out four ways, then four more turned between them. Then he is spent
//                         (1.6 s): your opening.
// Damage: the user's numbers are what a player takes after Defense; each is set ~9 above (a Throne-geared character's
// Defense against them, tools/bench_boss_hits.mjs). Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>').
import { TAU, angleTo, target, mark } from './kit.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const D = (n) => n + 4;                                    // (an effective number, set above Defense: a Throne-geared character's, measured)
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', name, ...V } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, SHARD = { sprite: 'jarl_shots/shard', size: 0.35 }, STONE = { sprite: 'jarl_shots/stone', size: 0.4 };
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false });
const lane = (g, e, x, y, a, len, delay, dmg, w = 1.3) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + 0.35, dmg: g.bxDmg(e, dmg), by: e.D.name, hitT: 0 });
function reach(e, a, want) {                               // how far he can go that way and stay in his court
  const H = e.room; let L = want;
  if (H) while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) break; L -= 0.5; }
  return L;
}

// ================================================================ I
function royalCleave(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  cleave(g, e, a, 3.2, TAU / 3, 0.8, D(145));
  later(e, 0.8, 'crescents', { a, n: 7, spread: Math.PI / 2, dmg: D(70) });
  later(e, 0.8, 'swish', {});
}
function crescents(g, e, V) {                              // from past the swing's rim: one blow never strikes you twice
  for (let k = 0; k < V.n; k++) { const b = V.a + (k / (V.n - 1) - 0.5) * V.spread; shot(g, e, e.x + Math.cos(b) * 3.4, e.y + Math.sin(b) * 3.4, b, { ...CRESCENT, speed: 5.2, range: 7, dmg: V.dmg }); }
}
function swish(g) { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); }
function lunge(g, e, V) {                                  // the line shown, then the charge along it, locked
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = reach(e, a, Math.min(V.len || 5, Math.hypot(q.x - e.x, q.y - e.y) + 1)), d = V.delay || 0.85;
  lane(g, e, e.x, e.y, a, L, d, V.dmg || D(150));
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.3 };
  if (!V.quiet) later(e, d + 0.3, 'shardsBack', { a, dmg: D(65) });
}
function shardsBack(g, e, V) {                             // where he stops: ash thrown back and to the sides
  for (const d of [Math.PI - 0.6, Math.PI - 0.2, Math.PI + 0.2, Math.PI + 0.6, Math.PI / 2, -Math.PI / 2]) shot(g, e, e.x, e.y, V.a + d, { ...SHARD, speed: 4.5, range: 7, dmg: V.dmg });
  g.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ASH });
}
function crownquake(g, e, V) {                             // the axe to the ground: two rings of stone, each with two gaps
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  mark(g, e, e.x, e.y, 2.4, 0.9, D(100), FIRE, 0);
  later(e, 0.9, 'quakeRing', { gap: a, dmg: D(75) });
  later(e, 1.45, 'quakeRing', { gap: a + Math.PI / 2, dmg: D(75) });
}
function quakeRing(g, e, V) {
  const n = 14, s = TAU / n;
  for (let i = 0; i < n; i++) {
    const b = V.gap + (i + 0.5) * s;                       // (the slots either side of each gap's line are left out)
    if (i === 0 || i === n - 1 || i === n / 2 - 1 || i === n / 2) continue;
    shot(g, e, e.x, e.y, b, { ...STONE, speed: 4, range: 9, dmg: V.dmg });
  }
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
}

// ================================================================ II
function vassals(g, e, V) {                                // two spectral warriors at either side of the court (never more than two)
  const S = e.bx, H = e.room || { x: e.x - 13, y: e.y - 10, w: 26, h: 20 };
  S.jwVassals = (S.jwVassals || []).filter((q) => !q.dead);
  for (const s of [-1, 1]) {
    if (S.jwVassals.length >= 2) break;
    const x = s < 0 ? H.x + 2.5 : H.x + H.w - 2.5, y = H.y + H.h / 2;
    if (S.jwVassals.some((q) => Math.abs(q.x - x) < 4)) continue;
    const q = g.addEnemy('jarl_vassal', x, y); q.noLoot = true; q.seen = true; q.jwUntil = g.t + 12; g.unstick(q, 0.6);
    g.vx({ k: 'burst', x, y, n: 18, colors: ['#8e4ca8', '#b884cc', '#d8d4e4'] });
    S.jwVassals.push(q);
  }
  g.sfx('roar');
}
function execution(g, e, V) {                              // a broad wedge marked; the axe into it; stone out of the blow
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  cleave(g, e, a, 5.2, 1.25, 1.1, D(165));
  later(e, 1.1, 'blowStone', { x: e.x + Math.cos(a) * 3.2, y: e.y + Math.sin(a) * 3.2, n: 8, dmg: D(80), speed: 5.8 });
}
function blowStone(g, e, V) {
  for (let i = 0; i < V.n; i++) shot(g, e, V.x, V.y, (i / V.n) * TAU + 0.2, { ...STONE, speed: V.speed, range: 7, dmg: V.dmg });
  g.vx({ k: 'shake', amt: 7 }); g.vx({ k: 'burst', x: V.x, y: V.y, n: 24, colors: FIRE }); g.sfx('hammer');
}

// ================================================================ III: Crownfall
function crownfall(g, e, V) {
  lunge(g, e, { len: 6, delay: 0.85, dmg: D(145), quiet: true });                 // 1. the charge, marked and locked
  later(e, 1.3, 'fallSweep', { dmg: D(75) });                                       // 2. the sweep
  later(e, 2.5, 'fallSlam', { dmg: D(175), wall: D(85) });                          // 3. the slam
}
function fallSweep(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  cleave(g, e, a, 3.2, 2.4, 0.5, D(145));
  later(e, 0.5, 'crossFans', { a, dmg: V.dmg });
}
function crossFans(g, e, V) {                              // two fans from either end of the swing, crossing in front of him
  for (const s of [-1, 1]) {
    const o = V.a + s * 1.0, x = e.x + Math.cos(o) * 3.3, y = e.y + Math.sin(o) * 3.3;
    for (let k = 0; k < 5; k++) shot(g, e, x, y, V.a - s * 0.35 + (k / 4 - 0.5) * 0.7, { ...CRESCENT, speed: 5.4, range: 8, dmg: V.dmg });
  }
  swish(g);
}
function fallSlam(g, e, V) {
  mark(g, e, e.x, e.y, 2.6, 0.8, V.dmg, FIRE, 0);
  const a = angleTo(e.x, e.y, target(g, e).x, target(g, e).y);
  later(e, 0.8, 'walls', { a, dmg: V.wall });
  later(e, 1.25, 'walls', { a: a + Math.PI / 4, dmg: V.wall });
}
function walls(g, e, V) {                                  // walls of shot out four ways, their ends open
  for (let w = 0; w < 4; w++) {
    const b = V.a + (w * TAU) / 4, nx = -Math.sin(b), ny = Math.cos(b);
    for (let k = -2; k <= 2; k++) shot(g, e, e.x + Math.cos(b) * 1.2 + nx * k * 0.65, e.y + Math.sin(b) * 1.2 + ny * k * 0.65, b, { ...STONE, speed: 4.5, range: 9, dmg: V.dmg });
  }
  g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer');
}

export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 260000,   // (asked 230,000: a Throne-geared Priest killed him in 2:17, tools/sim_realm_fights.mjs; 260,000 ~ 2:35)
  def: 26, xp: 9000,
  r: 1.5, speed: 1.4, keep: 2.4, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.65, 0.30],
  phases: {
    1: { move: 'hunt', patterns: [
      { name: 'Royal Cleave', windup: 0.2, recover: 3.0, special: 'royalCleave' },
      { name: 'Gravebound Lunge', windup: 0.2, recover: 2.2, special: 'lunge' },
      { name: 'Crownquake', windup: 0.2, recover: 2.4, special: 'crownquake' },
      { name: 'Royal Cleave', windup: 0.2, recover: 3.0, special: 'royalCleave' },
    ] },
    2: { move: 'hunt', patterns: [
      { name: 'Vassals of the Dead', windup: 0.4, recover: 1.2, special: 'vassals' },
      { name: 'Royal Cleave', windup: 0.2, recover: 2.4, special: 'royalCleave' },
      { name: "The King's Execution", windup: 0.2, recover: 2.4, special: 'execution' },
      { name: 'Gravebound Lunge', windup: 0.2, recover: 1.8, special: 'lunge' },
      { name: 'Crownquake', windup: 0.2, recover: 2.0, special: 'crownquake' },
    ] },
    3: { move: 'hunt', patterns: [
      { name: 'Crownfall', windup: 0.3, recover: 1.6, special: 'crownfall' },
      { name: 'Royal Cleave', windup: 0.2, recover: 1.8, special: 'royalCleave' },
      { name: "The King's Execution", windup: 0.2, recover: 2.0, special: 'execution' },
      { name: 'Crownfall', windup: 0.3, recover: 1.6, special: 'crownfall' },
      { name: 'Crownquake', windup: 0.2, recover: 1.6, special: 'crownquake' },
    ] },
  },
  specials: { royalCleave, crescents, swish, lunge, shardsBack, crownquake, quakeRing, vassals, execution, blowStone, crownfall, fallSweep, crossFans, fallSlam, walls },
  moves: {
    hunt(g, e, dt) {                                        // he walks you down, quicker as he breaks
      if (e.jwDash) return;
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y), sp = [1.4, 1.75, 2.15][(e.bx.phase || 1) - 1];
      if (d > (e.D.keep || 2.4)) g.moveCircle(e, ((q.x - e.x) / d) * sp * dt, ((q.y - e.y) / d) * sp * dt, 0.8);
    },
  },
  onWake(g) { if (g.banner) g.banner('The Hollow Jarl rises from his throne.', 2600); },
  onPhase(g, e, ph) {
    if (ph === 2) { if (g.banner) g.banner('His crown cracks. The Oathbreaker!', 2400); g.vx({ k: 'shake', amt: 6 }); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ASH }); g.sfx('roar'); }
    if (ph === 3) { if (g.banner) g.banner('The Last Oath: the Jarl goes berserk!', 2600); g.vx({ k: 'shake', amt: 9 }); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 40, colors: [...ASH, ...FIRE] }); g.sfx('roar'); }
  },
  update(g, e) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const C = e.jwDash;                                     // a charge in flight
    if (C && g.t >= C.at) { if (g.t >= C.until) e.jwDash = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; } }
    for (const q of S.jwVassals || []) if (!q.dead && g.t > q.jwUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; g.vx({ k: 'burst', x: q.x, y: q.y, n: 12, colors: ['#8e4ca8', '#b884cc'] }); }   // (12 s, and gone)
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });   // the ash leaking out of him
  },
  onDeath(g, e) { for (const q of e.bx.jwVassals || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.jwDash = null; g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
