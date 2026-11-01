// The Hollow Jarl, Warrior (2026-11-01, the user's design, then its overhaul: "too passive, predictable, and easy ... it
// should feel like being relentlessly hunted by an undead executioner"). He holds one of the Throne's champion courts
// and its seal. He is always coming: he walks you down, quicker each phase; a layer of thrown ash runs under his blows the
// whole fight (at you if you stand far off, where you're going if you run); every blow is marked before it lands and
// locked once marked, and the big combinations end in a breath for you to strike back.
//   I   The Fallen King (100-65%):
//       Royal Cleave      a 120-degree wedge marked 0.7 s, the axe through it (160); nine crescents in two staggered fans
//                         from past its rim (85; one swing never strikes twice)
//       Gravebound Lunge  its line shown 0.75 s, a locked charge up to six tiles (150), at you or where you're running
//                         (in turn); a burst of ash where he stops, two gaps in it (75)
//       Crownquake        the axe to the ground, marked: three rings of stone, each opening turned a third from the last (85)
//   II  The Oathbreaker (65-30%):
//       Berserker Hunt    ten seconds of chase: faster than ever, a short marked sweep every 1.4 s, a marked lunge every 3 s
//       War Banners       two spectral banners at the court's two sides (destructible); in turn they throw volleys of
//                         ash at you, a crossfire under everything he does (70)
//       Executioner's Crossing  a lane marked right across the court through you; he charges down it (165) while
//                         spectral axes sweep across it from both sides in walls with a gap (90)
//   III The Last Oath (30-0%):
//       Crownfall         a marked charge; a marked sweep throwing two crossing fans; a marked slam sending walls of
//                         stone four ways, and four more between; then he is spent (1.3 s): your opening
//       Death March       six seconds walking you down, a wall of crescents every 0.55 s with its gap swapping sides:
//                         weave through, you can't just back away forever
//       the banners come back if they're down, and fire faster
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>', 'jarl_kin/banner').
import { TAU, angleTo, target, mark, ahead, running } from './kit.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const D = (n) => n + 4;                                    // (an effective number, set above Defense: a Throne-geared character's, measured)
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', name, ...V } });
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, SHARD = { sprite: 'jarl_shots/shard', size: 0.35 }, STONE = { sprite: 'jarl_shots/stone', size: 0.4 };
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false });
const lane = (g, e, x, y, a, len, delay, dmg, w = 1.3) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? 0.35 : 0), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0 });
const court = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 10, w: 29, h: 23 };
function reach(e, a, want) {                               // how far he can go that way and stay in his court
  const H = e.room; let L = want;
  if (H) while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) break; L -= 0.5; }
  return L;
}

// ================================================================ the ash he throws under it all (a pressure layer)
function reachAsh(g, e, V) {                               // far off: crescents flung at you; near: shards where you're going
  const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
  if (d > 6.5) { const [lx, ly] = running(e) ? ahead(g, e, d / 7.5) : [q.x, q.y], a = angleTo(e.x, e.y, lx, ly); for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, a + (k / 4 - 0.5) * 0.5, { ...CRESCENT, speed: 7.5, range: 14, dmg: D(80) }); return; }
  const [x, y] = running(e) ? ahead(g, e, d / 6.5) : [q.x, q.y], a = angleTo(e.x, e.y, x, y);
  for (const o of [-0.22, 0, 0.22]) shot(g, e, e.x, e.y, a + o, { ...SHARD, speed: 6.5, range: 10, dmg: D(70) });
}

// ================================================================ I
function royalCleave(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), d = V.delay || 0.7;
  cleave(g, e, a, 3.2, TAU / 3, d, D(160));
  later(e, d, 'crescents', { a, n: V.small ? 5 : 5, off: 0, dmg: D(85) });
  if (!V.small) later(e, d + 0.18, 'crescents', { a, n: 4, off: 0.5, dmg: D(85) });
  later(e, d, 'swish', {});
}
function crescents(g, e, V) {                              // a fan from past the swing's rim; the second fan fills the first's gaps
  const spread = Math.PI / 2;
  for (let k = 0; k < V.n; k++) { const b = V.a + ((k + V.off) / (V.n - 1 + V.off * 2) - 0.5) * spread; shot(g, e, e.x + Math.cos(b) * 3.4, e.y + Math.sin(b) * 3.4, b, { ...CRESCENT, speed: 6.5, range: 9, dmg: V.dmg }); }
}
function swish(g) { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); }
function lunge(g, e, V) {                                  // the line shown, then the charge along it, locked
  const q = target(g, e), [tx, ty] = running(e) ? ahead(g, e, 0.95) : [q.x, q.y];   // (where you're running: circling is no escape)
  const a = angleTo(e.x, e.y, tx, ty), L = reach(e, a, Math.min(V.len || 6, Math.hypot(tx - e.x, ty - e.y) + 1.2)), d = V.delay || 0.75;
  lane(g, e, e.x, e.y, a, L, d, V.dmg || D(150));
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.28 };
  if (!V.quiet) later(e, d + 0.28, 'ashBurst', { a, dmg: D(75) });
}
function ashBurst(g, e, V) {                               // where he stops: a burst of ash, two gaps in it
  const n = 12;
  for (let i = 0; i < n; i++) { if (i === 0 || i === n / 2) continue; shot(g, e, e.x, e.y, V.a + Math.PI / 2 + (i / n) * TAU, { ...SHARD, speed: 5, range: 8, dmg: V.dmg }); }
  g.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ASH });
}
function crownquake(g, e, V) {                             // three rings of stone, each opening turned a third from the last
  const q = target(g, e), [bx, by] = running(e) ? ahead(g, e, -0.9) : [q.x, q.y], a = angleTo(e.x, e.y, bx, by);   // (the first opening behind you, where you came from: a runner must turn back)
  mark(g, e, e.x, e.y, 2.4, 0.75, D(110), FIRE, 0);
  for (let k = 0; k < 3; k++) later(e, 0.75 + k * 0.45, 'quakeRing', { gap: a + k * (TAU / 3), dmg: D(85) });
}
function quakeRing(g, e, V) {
  const n = 22, s = TAU / n;
  for (let i = 0; i < n; i++) { if (i < 2 || i > n - 2) continue; shot(g, e, e.x, e.y, V.gap + (i - 1) * s, { ...STONE, speed: 5, range: 11, dmg: V.dmg }); }   // (the three slots round its opening's line left out)
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
}

// ================================================================ II
function hunt(g, e, V) {                                   // ten seconds of chase: sweeps and lunges while he runs you down
  e.bx.jwHuntUntil = g.t + 10;
  for (let t = 0.6; t < 10; t += 1.4) later(e, t, 'huntSweep', {});
  for (const t of [2.2, 5.2, 8.2]) later(e, t, 'lunge', { len: 5, delay: 0.6, quiet: true });
  g.sfx('roar'); if (g.banner) g.banner('The Jarl hunts you!', 1400);
}
function huntSweep(g, e) { if (!e.jwDash) royalCleave(g, e, { delay: 0.55, small: true }); }
function banners(g, e, V) {                                // two spectral war banners at the court's two sides
  const S = e.bx, C = court(e);
  S.jwBanners = (S.jwBanners || []).filter((q) => !q.dead);
  for (const s of [-1, 1]) {
    if (S.jwBanners.length >= 2) break;
    const x = s < 0 ? C.x + 2.5 : C.x + C.w - 2.5, y = C.y + C.h / 2;
    if (S.jwBanners.some((q) => Math.abs(q.x - x) < 4)) continue;
    const q = g.addEnemy('jarl_banner', x, y); q.noLoot = true; q.seen = true; g.unstick(q, 0.6);
    g.vx({ k: 'burst', x, y, n: 18, colors: ['#8e4ca8', '#b884cc', '#ff8a1f'] });
    S.jwBanners.push(q);
  }
  S.jwBannerT = 1.2; g.sfx('roar');
}
function crossing(g, e, V) {                               // a lane right across the court through you; he charges it; axes sweep across it
  const C = court(e), q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = reach(e, a, 30), d = 0.9;
  lane(g, e, e.x, e.y, a, L, d, D(165), 1.4);
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.5 };
  const nx = -Math.sin(a), ny = Math.cos(a);                 // the spectral axes: walls from either side, square across his lane
  for (const s of [-1, 1]) {
    const ox = q.x + nx * s * 9, oy = q.y + ny * s * 9, b = Math.atan2(-ny * s, -nx * s), gap = (s < 0 ? 1 : -1) * 1.6;
    later(e, 0.5, 'axeWall', { ox, oy, b, gap, dmg: D(90) });
  }
}
function axeWall(g, e, V) {
  const tx = -Math.sin(V.b), ty = Math.cos(V.b);
  for (let k = -6; k <= 6; k++) { const o = k * 0.75; if (Math.abs(o - V.gap) < 1.0) continue; shot(g, e, V.ox + tx * o, V.oy + ty * o, V.b, { ...CRESCENT, speed: 4.6, range: 17, dmg: V.dmg }); }
}

// ================================================================ III
function crownfall(g, e, V) {
  lunge(g, e, { len: 6, delay: 0.7, dmg: D(145), quiet: true });                  // 1. the charge, marked and locked
  later(e, 1.05, 'fallSweep', { dmg: D(80) });                                      // 2. the sweep
  later(e, 2.05, 'fallSlam', { dmg: D(175), wall: D(85) });                         // 3. the slam
}
function fallSweep(g, e, V) {
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  cleave(g, e, a, 3.2, 2.4, 0.45, D(150));
  later(e, 0.45, 'crossFans', { a, dmg: V.dmg });
}
function crossFans(g, e, V) {                              // two fans from either end of the swing, crossing in front of him
  for (const s of [-1, 1]) {
    const o = V.a + s * 1.0, x = e.x + Math.cos(o) * 3.3, y = e.y + Math.sin(o) * 3.3;
    for (let k = 0; k < 6; k++) shot(g, e, x, y, V.a - s * 0.35 + (k / 5 - 0.5) * 0.8, { ...CRESCENT, speed: 6, range: 9, dmg: V.dmg });
  }
  swish(g);
}
function fallSlam(g, e, V) {
  mark(g, e, e.x, e.y, 2.6, 0.7, V.dmg, FIRE, 0);
  const a = angleTo(e.x, e.y, target(g, e).x, target(g, e).y);
  later(e, 0.7, 'walls', { a, dmg: V.wall });
  later(e, 1.1, 'walls', { a: a + Math.PI / 4, dmg: V.wall });
}
function walls(g, e, V) {                                  // walls of stone out four ways, their ends open
  for (let w = 0; w < 4; w++) {
    const b = V.a + (w * TAU) / 4, nx = -Math.sin(b), ny = Math.cos(b);
    for (let k = -2; k <= 2; k++) shot(g, e, e.x + Math.cos(b) * 1.2 + nx * k * 0.65, e.y + Math.sin(b) * 1.2 + ny * k * 0.65, b, { ...STONE, speed: 5, range: 10, dmg: V.dmg });
  }
  g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer');
}
function march(g, e, V) {                                  // six seconds walking you down behind walls of crescents, the gap swapping sides
  e.bx.jwMarchUntil = g.t + 6;
  for (let k = 0; k < 11; k++) later(e, 0.3 + k * 0.55, 'marchWall', { side: k % 2 ? 1 : -1, dmg: D(80) });
  if (!(e.bx.jwBanners || []).some((q) => !q.dead)) banners(g, e, {});
}
function marchWall(g, e, V) {
  const q = target(g, e), [lx, ly] = running(e) ? ahead(g, e, 0.5) : [q.x, q.y], a = angleTo(e.x, e.y, lx, ly), nx = -Math.sin(a), ny = Math.cos(a);
  for (let k = -4; k <= 4; k++) { if (k === V.side * 2 || k === V.side * 3) continue; shot(g, e, e.x + nx * k * 0.6, e.y + ny * k * 0.6, a, { ...CRESCENT, speed: 5.2, range: 11, dmg: V.dmg }); }
}

export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 230000, def: 26, xp: 9000,
  r: 1.5, speed: 2.0, keep: 1.8, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.65, 0.30],
  phases: {
    1: { move: 'hunt', pressure: [{ every: 1.9, special: 'reachAsh' }], patterns: [
      { name: 'Royal Cleave', windup: 0.15, recover: 1.0, special: 'royalCleave' },
      { name: 'Gravebound Lunge', windup: 0.15, recover: 1.0, special: 'lunge' },
      { name: 'Crownquake', windup: 0.15, recover: 1.2, special: 'crownquake' },
      { name: 'Gravebound Lunge', windup: 0.15, recover: 0.9, special: 'lunge' },
    ] },
    2: { move: 'hunt', pressure: [{ every: 2.0, special: 'reachAsh' }], patterns: [
      { name: 'War Banners', windup: 0.3, recover: 0.6, special: 'banners' },
      { name: 'Berserker Hunt', windup: 0.3, recover: 10.6, special: 'hunt' },
      { name: "Executioner's Crossing", windup: 0.2, recover: 1.8, special: 'crossing' },
      { name: 'Royal Cleave', windup: 0.15, recover: 0.8, special: 'royalCleave' },
      { name: 'Crownquake', windup: 0.15, recover: 1.0, special: 'crownquake' },
    ] },
    3: { move: 'hunt', pressure: [{ every: 1.7, special: 'reachAsh' }], patterns: [
      { name: 'Crownfall', windup: 0.25, recover: 1.3, special: 'crownfall' },
      { name: 'Death March', windup: 0.3, recover: 6.6, special: 'march' },
      { name: "Executioner's Crossing", windup: 0.2, recover: 1.4, special: 'crossing' },
      { name: 'Crownfall', windup: 0.25, recover: 1.3, special: 'crownfall' },
      { name: 'Royal Cleave', windup: 0.15, recover: 0.7, special: 'royalCleave' },
    ] },
  },
  specials: { reachAsh, royalCleave, crescents, swish, lunge, ashBurst, crownquake, quakeRing, hunt, huntSweep, banners, crossing, axeWall, crownfall, fallSweep, crossFans, fallSlam, walls, march, marchWall },
  moves: {
    hunt(g, e, dt) {                                        // he walks you down, quicker as he breaks (and in a hunt or a march quicker still)
      if (e.jwDash) return;
      const S = e.bx, q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      let sp = [2.0, 2.5, 2.9][(S.phase || 1) - 1];
      if (S.jwHuntUntil > g.t) sp = 3.4; else if (S.jwMarchUntil > g.t) sp = 2.2;
      if (d > (e.D.keep || 1.8)) g.moveCircle(e, ((q.x - e.x) / d) * sp * dt, ((q.y - e.y) / d) * sp * dt, 0.8);
    },
  },
  onWake(g) { if (g.banner) g.banner('The Hollow Jarl rises from his throne.', 2600); },
  onPhase(g, e, ph) {
    e.jwDash = null; e.bx.jwHuntUntil = 0; e.bx.jwMarchUntil = 0;
    if (ph === 2) { if (g.banner) g.banner('His crown cracks. The Oathbreaker!', 2400); g.vx({ k: 'shake', amt: 6 }); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 30, colors: ASH }); g.sfx('roar'); }
    if (ph === 3) { if (g.banner) g.banner('The Last Oath: the Jarl goes berserk!', 2600); g.vx({ k: 'shake', amt: 9 }); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 40, colors: [...ASH, ...FIRE] }); g.sfx('roar'); }
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const C = e.jwDash;                                     // a charge in flight
    if (C && g.t >= C.at) { if (g.t >= C.until) e.jwDash = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; } }
    // the banners: in turn, a volley of ash at you from each (a crossfire under it all; quicker in III)
    const B = (S.jwBanners || []).filter((q) => !q.dead);
    if (B.length && S.state !== 'morph' && (S.jwBannerT = (S.jwBannerT || 1) - dt) <= 0) {
      S.jwBannerT = S.phase === 3 ? 0.85 : 1.15; S.jwBannerK = (S.jwBannerK || 0) + 1;
      const b = B[S.jwBannerK % B.length], q = target(g, e), [lx, ly] = running(e) ? ahead(g, e, Math.hypot(q.x - b.x, q.y - b.y) / 5.5) : [q.x, q.y], a = angleTo(b.x, b.y, lx, ly);
      for (let k = 0; k < 4; k++) shot(g, e, b.x, b.y - 0.6, a + (k / 3 - 0.5) * 0.6, { ...SHARD, speed: 5.5, range: 13, dmg: D(70) });
    }
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });   // the ash leaking out of him
  },
  onDeath(g, e) { for (const q of e.bx.jwBanners || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.jwDash = null; g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
