// The Hollow Jarl, Warrior (2026-11-01, the user's design; its overhaul; then the user's attack timings and cooldowns).
// He holds one of the Throne's champion courts and its seal. Relentless pursuit, crushing axe strikes, crossfire: he is
// always coming (quicker each phase), a layer of thrown ash runs under his attacks (crescents at you if you hang back,
// shards where you're running if you don't), and his attacks keep their own schedule (kit.scheduler): each its own
// cooldown from when it ends, a new one every 2.5-3.5 s (I), 2-3 s (II), 1.8-2.5 s (III), never the same twice running
// while another is ready, the chases and combinations holding the next until they're done and rested.
//   I   The Fallen King (100-65%):
//       Royal Cleave      marked 0.65 s, the swing (160); nine crescents across 100 degrees, a second volley between
//                         them 0.45 s on (85, 5.5 t/s). cd 3.5
//       Gravebound Lunge  its line shown 0.8 s, locked; a 0.45 s charge up to five tiles (150), where you're running if
//                         you are; eight ash on arrival, one at you (75). cd 5.5
//       Crownquake        marked 1.0 s: three rings of fourteen, 0.55 s apart, each opening turned on from the last, the
//                         first behind a runner (85, 4.2 t/s). cd 7.5
//   II  The Oathbreaker (65-30%), and I's attacks still:
//       Berserker Hunt    warned 0.8 s; nine seconds of chase a quarter quicker, a sweep of crescents every 1.8 s (85), a
//                         marked lunge every 3 s (155); a shockwave to end it; 1.2 s to breathe. cd 18
//       Gravebound War Banners  their places marked 0.9 s; two banners at the court's two sides (they can be cut down);
//                         0.8 s on they throw fans of ash at you in turn every 1.25 s, for eight seconds (75). cd 15
//       Executioner's Crossing  a lane marked 0.85 s right across the court through you; he charges it in 0.55 s
//                         (165); three walls of spectral axes sweep across it from the sides, 0.45 s apart (90). cd 8
//   III The Last Oath (30-0%), and the banners, the crossing and the cleave:
//       Crownfall         warned 0.75 s; a 0.5 s charge (155); crescents 0.45 s after (90); a shockwave 0.65 s after
//                         those (110); 1.1 s spent: your opening. cd 9
//       Death March       warned 0.8 s; six seconds walking you down, a wall of crescents every 0.85 s, its gap swapping
//                         sides (90); a heavy slam to end it (175); 1.2 s to breathe. cd 15
// Damage: the user's numbers are what a player takes; each set ~4 above (a Throne-geared character's Defense).
// Art: tools/build_jarl_warrior.py ('bx_jarl_warrior', 'jarl_shots/<name>', 'jarl_kin/banner').
import { TAU, angleTo, target, mark, ahead, running, scheduler } from './kit.js';

const FIRE = ['#ff8a1f', '#ffd650', '#ff3a1a'], ASH = ['#5a5560', '#8a8490', '#b884cc'];
const D = (n) => n + 4;                                    // (an effective number, set above Defense: a Throne-geared character's, measured)
const later = (e, t, name, V) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last: a V passed on whole keeps the step it's for)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const CRESCENT = { sprite: 'jarl_shots/crescent', size: 0.4 }, SHARD = { sprite: 'jarl_shots/shard', size: 0.35 }, STONE = { sprite: 'jarl_shots/stone', size: 0.4 };
const cleave = (g, e, a, r, spread, delay, dmg) => g.fx.push({ kind: 'cleave', x: e.x, y: e.y, a, r, spread, delay, t: 0, life: delay + 0.3, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false });
const lane = (g, e, x, y, a, len, delay, dmg, w = 1.3, live = 0.35) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + (dmg ? live : 0), dmg: dmg ? g.bxDmg(e, dmg) : 0, by: e.D.name, hitT: 0 });
const court = (e) => e.room || { x: Math.floor(e.x) - 14, y: Math.floor(e.y) - 10, w: 29, h: 23 };
function reach(e, a, want) {                               // how far he can go that way and stay in his court
  const H = e.room; let L = want;
  if (H) while (L > 0.5) { const x = e.x + Math.cos(a) * L, y = e.y + Math.sin(a) * L; if (x > H.x + 1.6 && x < H.x + H.w - 1.6 && y > H.y + 1.6 && y < H.y + H.h - 1.6) break; L -= 0.5; }
  return L;
}
const toward = (g, e, T) => { const q = target(g, e); return running(e) ? ahead(g, e, T) : [q.x, q.y]; };

// ================================================================ under it all: the ash he throws (independent of his attacks)
function reachAsh(g, e, V) {                               // far off: crescents flung where you'll be; near: shards where you're going
  const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
  if (d > 6.5) { const [lx, ly] = toward(g, e, d / 7.5), a = angleTo(e.x, e.y, lx, ly); for (let k = 0; k < 5; k++) shot(g, e, e.x, e.y, a + (k / 4 - 0.5) * 0.5, { ...CRESCENT, speed: 7.5, range: 14, dmg: D(80) }); return; }
  const [x, y] = toward(g, e, d / 6.5), a = angleTo(e.x, e.y, x, y);
  for (const o of [-0.22, 0, 0.22]) shot(g, e, e.x, e.y, a + o, { ...SHARD, speed: 6.5, range: 10, dmg: D(70) });
}

// ================================================================ I
function royalCleave(g, e, V) {                            // marked 0.65 s; the swing; nine crescents; nine more between them 0.45 s on
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), d = V.delay || 0.65, n = V.n || 9;
  cleave(g, e, a, 3.2, TAU / 3, d, D(160));
  later(e, d, 'crescents', { a, n, off: 0, dmg: D(85) });
  if (!V.single) later(e, d + 0.45, 'crescents', { a, n: n - 1, off: 0.5, dmg: D(85) });
  later(e, d, 'swish', {});
}
function crescents(g, e, V) {                              // across 100 degrees, from past the swing's rim (one swing never strikes twice)
  const spread = (100 * Math.PI) / 180, m = V.n - 1 + V.off * 2;
  for (let k = 0; k < V.n; k++) { const b = V.a + ((k + V.off) / m - 0.5) * spread; shot(g, e, e.x + Math.cos(b) * 3.4, e.y + Math.sin(b) * 3.4, b, { ...CRESCENT, speed: 5.5, range: 9, dmg: V.dmg }); }
}
function swish(g) { g.sfx('shatter'); g.vx({ k: 'shake', amt: 3 }); }
function lunge(g, e, V) {                                  // the line shown, locked; the charge; ash on arrival
  const [tx, ty] = toward(g, e, (V.delay || 0.8) + 0.2), a = angleTo(e.x, e.y, tx, ty), d = V.delay || 0.8, dur = V.dur || 0.45;
  const L = reach(e, a, Math.min(V.len || 5, Math.hypot(tx - e.x, ty - e.y) + 1));
  lane(g, e, e.x, e.y, a, L, d, V.dmg || D(150), 1.3, dur);
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + dur };
  if (!V.quiet) later(e, d + dur, 'ashBurst', { dmg: D(75) });
}
function ashBurst(g, e, V) {                               // eight ash, one of them at you
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  for (let i = 0; i < 8; i++) shot(g, e, e.x, e.y, a + (i / 8) * TAU, { ...SHARD, speed: 5, range: 8, dmg: V.dmg });
  g.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ASH });
}
function crownquake(g, e, V) {                             // marked 1.0 s; three rings of fourteen, 0.55 s apart, the openings turning
  const [bx, by] = running(e) ? ahead(g, e, -0.9) : [target(g, e).x, target(g, e).y], a = angleTo(e.x, e.y, bx, by);   // (the first opening behind a runner: he must turn back)
  mark(g, e, e.x, e.y, 2.4, 1.0, D(110), FIRE, 0);
  for (let k = 0; k < 3; k++) later(e, 1.0 + k * 0.55, 'quakeRing', { gap: a + k * (TAU / 3), n: 14, speed: 4.2, dmg: D(85) });
}
function quakeRing(g, e, V) {                              // (the two slots either side of the opening's line left out)
  const n = V.n, s = TAU / n;
  for (let i = 0; i < n; i++) { if (i === 0 || i === n - 1) continue; shot(g, e, e.x, e.y, V.gap + (i + 0.5) * s, { ...STONE, speed: V.speed, range: 11, dmg: V.dmg }); }
  g.vx({ k: 'shake', amt: 5 }); g.sfx('hammer');
}

// ================================================================ II
function hunt(g, e, V) {                                   // warned 0.8 s; nine seconds of chase; sweeps every 1.8 s, a lunge every 3 s; a shockwave
  const S = e.bx;
  if (g.banner) g.banner('The Jarl hunts you!', 1400); g.sfx('roar'); g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 20, colors: [...ASH, ...FIRE] });
  S.jwHuntAt = g.t + 0.8; S.jwHuntUntil = g.t + 9.8;
  for (let t = 0.8 + 1.0; t < 9.6; t += 1.8) later(e, t, 'huntSweep', {});
  for (const t of [0.8 + 2.4, 0.8 + 5.4, 0.8 + 8.0]) later(e, t, 'lunge', { len: 5, delay: 0.6, quiet: true, dmg: D(155) });
  later(e, 9.8, 'shockwave', { dmg: D(110), wave: D(85) });
}
function huntSweep(g, e) { if (!e.jwDash) royalCleave(g, e, { delay: 0.5, single: true, n: 8 }); }
function shockwave(g, e, V) {                              // the hunt's end: the axe to the ground, a ring of stone with an opening behind you
  mark(g, e, e.x, e.y, 2.4, 0.6, V.dmg, FIRE, 0);
  const [bx, by] = running(e) ? ahead(g, e, -0.8) : [target(g, e).x, target(g, e).y];
  later(e, 0.6, 'quakeRing', { gap: angleTo(e.x, e.y, bx, by), n: 18, speed: 4.6, dmg: V.wave });
}
function banners(g, e, V) {                                // their places marked 0.9 s; two banners; fans of ash in turn for eight seconds
  const C = court(e), spots = [-1, 1].map((s) => ({ x: s < 0 ? C.x + 2.5 : C.x + C.w - 2.5, y: C.y + C.h / 2 }));
  for (const p of spots) mark(g, e, p.x, p.y, 1.2, 0.9, 0, ['#8e4ca8', '#b884cc'], 0);
  later(e, 0.9, 'raiseBanners', { spots });
}
function raiseBanners(g, e, V) {
  const S = e.bx; S.jwBanners = (S.jwBanners || []).filter((q) => !q.dead);
  for (const p of V.spots) {
    if (S.jwBanners.length >= 2 || S.jwBanners.some((q) => Math.abs(q.x - p.x) < 4)) continue;
    const q = g.addEnemy('jarl_banner', p.x, p.y); q.noLoot = true; q.seen = true; q.jwUntil = g.t + 8; g.unstick(q, 0.6);
    g.vx({ k: 'burst', x: p.x, y: p.y, n: 18, colors: ['#8e4ca8', '#b884cc', '#ff8a1f'] });
    S.jwBanners.push(q);
  }
  S.jwBannerT = 0.8; g.sfx('roar');
}
function crossing(g, e, V) {                               // a lane marked 0.85 s through you; a 0.55 s charge; three walls of axes across it
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = reach(e, a, 30), d = 0.85;
  lane(g, e, e.x, e.y, a, L, d, D(165), 1.4, 0.55);
  e.jwDash = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.55 };
  const nx = -Math.sin(a), ny = Math.cos(a);
  for (let k = 0; k < 3; k++) {                            // from alternate sides, each gap somewhere new
    const s = k % 2 ? 1 : -1, along = (k - 1) * 3, cx = q.x + Math.cos(a) * along, cy = q.y + Math.sin(a) * along;
    later(e, 0.55 + k * 0.45, 'axeWall', { ox: cx + nx * s * 9, oy: cy + ny * s * 9, b: Math.atan2(-ny * s, -nx * s), gap: [1.6, -1.2, 0.4][k], dmg: D(90) });
  }
}
function axeWall(g, e, V) {
  const tx = -Math.sin(V.b), ty = Math.cos(V.b);
  for (let k = -6; k <= 6; k++) { const o = k * 0.75; if (Math.abs(o - V.gap) < 1.0) continue; shot(g, e, V.ox + tx * o, V.oy + ty * o, V.b, { ...CRESCENT, speed: 4.6, range: 17, dmg: V.dmg }); }
}

// ================================================================ III
function crownfall(g, e, V) {                              // warned 0.75; a 0.5 s charge; crescents 0.45 after; a shockwave 0.65 after those
  lunge(g, e, { len: 6, delay: 0.75, dur: 0.5, dmg: D(155), quiet: true });
  later(e, 1.7, 'fallSweep', { dmg: D(90) });
  later(e, 2.35, 'fallSlam', { dmg: D(110) });
}
function fallSweep(g, e, V) {                              // two fans from either end of the swing, crossing in front of him
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  for (const s of [-1, 1]) {
    const o = a + s * 1.0, x = e.x + Math.cos(o) * 3.3, y = e.y + Math.sin(o) * 3.3;
    for (let k = 0; k < 6; k++) shot(g, e, x, y, a - s * 0.35 + (k / 5 - 0.5) * 0.8, { ...CRESCENT, speed: 6, range: 9, dmg: V.dmg });
  }
  swish(g);
}
function fallSlam(g, e, V) {                               // the slam: walls of stone four ways, then four more between them
  mark(g, e, e.x, e.y, 2.6, 0.01, V.dmg, FIRE, 0);
  const a = angleTo(e.x, e.y, target(g, e).x, target(g, e).y);
  walls(g, e, { a, dmg: V.dmg }); later(e, 0.4, 'walls', { a: a + Math.PI / 4, dmg: V.dmg });
}
function walls(g, e, V) {                                  // walls out four ways, their ends open
  for (let w = 0; w < 4; w++) {
    const b = V.a + (w * TAU) / 4, nx = -Math.sin(b), ny = Math.cos(b);
    for (let k = -2; k <= 2; k++) shot(g, e, e.x + Math.cos(b) * 1.2 + nx * k * 0.65, e.y + Math.sin(b) * 1.2 + ny * k * 0.65, b, { ...STONE, speed: 5, range: 10, dmg: V.dmg });
  }
  g.vx({ k: 'shake', amt: 8 }); g.sfx('hammer');
}
function march(g, e, V) {                                  // warned 0.8 s; six seconds walking you down behind walls of crescents; a slam to end it
  const S = e.bx;
  if (g.banner) g.banner('The Death March!', 1400); g.sfx('roar');
  S.jwMarchAt = g.t + 0.8; S.jwMarchUntil = g.t + 6.8;
  for (let k = 0; k < 7; k++) later(e, 0.8 + 0.3 + k * 0.85, 'marchWall', { side: k % 2 ? 1 : -1, dmg: D(90) });
  later(e, 6.9, 'marchSlam', { dmg: D(175) });
}
function marchWall(g, e, V) {                              // a wall of crescents square to you, its gap one side then the other
  const [lx, ly] = toward(g, e, 0.5), a = angleTo(e.x, e.y, lx, ly), nx = -Math.sin(a), ny = Math.cos(a);
  for (let k = -5; k <= 5; k++) { if (k === V.side * 2 || k === V.side * 3) continue; shot(g, e, e.x + nx * k * 0.6, e.y + ny * k * 0.6, a, { ...CRESCENT, speed: 5.2, range: 11, dmg: V.dmg }); }
}
function marchSlam(g, e, V) { mark(g, e, e.x, e.y, 3.0, 0.7, V.dmg, FIRE, 10, 'jarl_shots/stone'); }

const P = {
  cleave: { name: 'Royal Cleave', special: 'royalCleave', windup: 0.15, dur: 1.3, cd: 3.5 },
  lunge: { name: 'Gravebound Lunge', special: 'lunge', windup: 0.15, dur: 1.4, cd: 5.5 },
  quake: { name: 'Crownquake', special: 'crownquake', windup: 0.15, dur: 2.2, cd: 7.5 },
  hunt: { name: 'Berserker Hunt', special: 'hunt', windup: 0.2, dur: 10.4, cd: 18, block: true, after: 1.2, w: 2 },
  banners: { name: 'Gravebound War Banners', special: 'banners', windup: 0.2, dur: 8.9, cd: 15, w: 3 },
  crossing: { name: "Executioner's Crossing", special: 'crossing', windup: 0.15, dur: 2.0, cd: 8 },
  crownfall: { name: 'Crownfall', special: 'crownfall', windup: 0.2, dur: 2.9, cd: 9, block: true, after: 1.1, w: 2 },
  march: { name: 'Death March', special: 'march', windup: 0.2, dur: 7.6, cd: 15, block: true, after: 1.2, w: 2 },
};

export default {
  id: 'jarl_warrior', art: 'jarl_warrior', name: 'The Hollow Jarl, Warrior', biome: 'dungeon', hp: 230000, def: 26, xp: 9000,
  r: 1.5, speed: 2.0, keep: 1.8, faces: false, tempo: 1, dmgScale: 1, spawnCentre: true, thresholds: [0.65, 0.30],
  choose: scheduler([[2.5, 3.5], [2.0, 3.0], [1.8, 2.5]]),
  phases: {
    1: { move: 'hunt', pressure: [{ every: 2.2, special: 'reachAsh' }], patterns: [P.cleave, P.lunge, P.quake] },
    2: { move: 'hunt', pressure: [{ every: 2.0, special: 'reachAsh' }], patterns: [P.hunt, P.banners, P.crossing, P.cleave, P.lunge, P.quake] },
    3: { move: 'hunt', pressure: [{ every: 1.8, special: 'reachAsh' }], patterns: [P.crownfall, P.march, P.banners, P.crossing, P.cleave, P.lunge] },
  },
  specials: { reachAsh, royalCleave, crescents, swish, lunge, ashBurst, crownquake, quakeRing, hunt, huntSweep, shockwave, banners, raiseBanners, crossing, axeWall,
    crownfall, fallSweep, fallSlam, walls, march, marchWall, marchSlam },
  moves: {
    hunt(g, e, dt) {                                        // he walks you down, quicker as he breaks (a quarter quicker in a hunt)
      if (e.jwDash) return;
      const S = e.bx, q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      let sp = [2.0, 2.4, 2.8][(S.phase || 1) - 1];
      if (S.jwHuntUntil > g.t && g.t > S.jwHuntAt) sp *= 1.25; else if (S.jwMarchUntil > g.t && g.t > S.jwMarchAt) sp = 2.3;
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
    // the banners: eight seconds each; in turn, a fan of ash at you (where you're running, if you are)
    for (const q of S.jwBanners || []) if (!q.dead && g.t > q.jwUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; g.vx({ k: 'burst', x: q.x, y: q.y, n: 12, colors: ['#8e4ca8', '#b884cc'] }); }
    const B = (S.jwBanners || []).filter((q) => !q.dead);
    if (B.length && S.state !== 'morph' && (S.jwBannerT = (S.jwBannerT ?? 0.8) - dt) <= 0) {
      S.jwBannerT = 1.25 / 2; S.jwBannerK = (S.jwBannerK || 0) + 1;            // (each banner every 1.25 s, the two in turn)
      const b = B[S.jwBannerK % B.length], q = target(g, e), [lx, ly] = toward(g, e, Math.hypot(q.x - b.x, q.y - b.y) / 5.5), a = angleTo(b.x, b.y, lx, ly);
      for (let k = 0; k < 4; k++) shot(g, e, b.x, b.y - 0.6, a + (k / 3 - 0.5) * 0.6, { ...SHARD, speed: 5.5, range: 13, dmg: D(75) });
    }
    if (S.phase >= 2 && Math.random() < 0.2) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 2, y: e.y - 1 - Math.random(), n: 1, colors: ASH });   // the ash leaking out of him
  },
  onDeath(g, e) { for (const q of e.bx.jwBanners || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; } e.jwDash = null; g.vx({ k: 'shake', amt: 8 }); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: (e.bx.phase || 1) === 3 ? 70 : 45, col: '#ff8a3a', fire: true }]; },
  loot: [], lootLuck: 1.2,                                  // (every class's gear in its band: src/bosses/boss_loot.js)
};
