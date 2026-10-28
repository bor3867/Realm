// The Fallen Star: Godfall's event boss on the boss framework (2026-10-22). A burning star with a crater for an eye. Its
// own mechanic:
//   Constellations - it lays star-mines round the field and joins them, in order, with burning lines (marked, then
//     burning, again and again). Shoot a mine and the lines through it go out.
//   I   It Falls            - embers scattered, a comet run at you (along a marked line), a constellation
//   II  It Burns Brighter   - flares (the old Starflare daze still comes with them), bigger constellations
//   III Supernova           - rings of flares; constellations come faster
//   Last: Supernova         - it swells; fresh mines fall round it. When it bursts, only a mine's shadow is safe:
//                             put a mine between you and the star (felt in your own browser)
// Art: tools/build_last_bosses.py ('bx_the_fallen_star', mines 'last_kin/mine', shots 'last_shots/the_fallen_star.<name>').
import { ENEMIES, REALM_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, arena, players, target, open, ring, fan, kill, running, ahead } from './kit.js';

const MINE = 'fs_mine', FIRE = ['#ff8a1f', '#ffd650'];
if (!ENEMIES[MINE]) ENEMIES[MINE] = { name: 'A Star-Mine', biome: 'godfall', hp: 1400, def: 0, speed: 0, xp: 0, r: 0.6, ai: 'rooted', aggro: 0, reg: 'last_kin/mine', scale: 1.4, contact: 0, attacks: [], loot: [] };
const minesOf = (g, e) => (e.fsMines || []).filter((m) => !m.dead);
function constellation(g, e, V) {
  for (const m of e.fsMines || []) kill(m);
  const m0 = g.map, n = V.n || 5, a0 = R() * TAU, q = target(g, e); e.fsMines = [];
  for (let k = 0; k < n; k++) { let x = 0, y = 0; for (let t = 0; t < 20; t++) { const a = a0 + (k / n) * TAU + (R() - 0.5) * 0.5, d = 5 + R() * 4; x = q.x + Math.cos(a) * d; y = q.y + Math.sin(a) * d; if (open(m0, x, y)) break; }
    const m = g.addEnemy(MINE, x, y); m.seen = true; m.noLoot = true; e.fsMines.push(m); }
  e.fsLineT = 1.2; g.banner('It draws a constellation round you! Shoot a star to break its lines.', 1800);
}
function lines(g, e) {                                     // the constellation's lines, burning again and again (each its two stars alive)
  const M = e.fsMines || [];
  for (let k = 0; k < M.length; k++) { const a = M[k], b = M[(k + 1) % M.length]; if (!a || !b || a.dead || b.dead) continue;
    const L = Math.hypot(b.x - a.x, b.y - a.y); g.fx.push({ kind: 'lane', x: a.x, y: a.y, a: angleTo(a.x, a.y, b.x, b.y), len: L, w: 0.45, delay: 0.7, t: 0, life: 1.6, dmg: g.bxDmg(e, 55), by: e.D.name, hitT: 0, cols: FIRE }); }
}
function embers(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let k = 0; k < (V.n || 18); k++) g.bxShot(e, ox, oy, R() * TAU, { shot: 'ember', speed: 3 + R() * 3, range: 12, dmg: V.dmg || 50 }); }
function comet(g, e, V) {                                  // a run at you, along a marked line, embers flung off its tail
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = Math.min(14, Math.hypot(q.x - e.x, q.y - e.y) + 4), d = V.delay || 0.9;
  g.fx.push({ kind: 'lane', x: e.x, y: e.y, a, len: L, w: 1.1, delay: d, t: 0, life: d + 0.7, dmg: g.bxDmg(e, V.dmg || 80), by: e.D.name, hitT: 0, cols: FIRE });
  e.fsRun = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.6 };
}
function flares(g, e, V) { const [ox, oy] = g.bxOrigin(e), q = target(g, e); for (let w = 0; w < (V.waves || 2); w++) e.bx.vol.push({ t: w * 0.3, V: { form: 'special', name: 'flareRing', w, a: angleTo(ox, oy, q.x, q.y), dmg: V.dmg } }); }
function flareRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy, 12, { shot: 'flare', speed: 7, range: 12, dmg: V.dmg || 50 }, V.w * 0.26); fan(g, e, ox, oy, V.a, 3, 0.3, { shot: 'flare', speed: 10, range: 13, dmg: V.dmg || 50 }); }
const finale = {
  at: 0.1, dur: 10, name: 'Supernova', say: 'hide in a star\'s shadow', after: 1.4,
  start(g, e) { constellation(g, e, { n: 5 }); e.fsMines.forEach((m, k) => { const a = (k / 5) * TAU; m.x = e.x + Math.cos(a) * 4; m.y = e.y + Math.sin(a) * 3.4; }); e.fsNovaUntil = g.t + 8.5; e.fsNovaDone = false; },
  update(g, e) {
    for (let k = 0; k < 5; k++) { const m = (e.fsMines || [])[k]; e['fsM' + k + 'x'] = m && !m.dead ? m.x : -999; e['fsM' + k + 'y'] = m && !m.dead ? m.y : -999; }   // (plain, for the browsers' shadows)
    if (!e.fsNovaDone && g.t >= e.fsNovaUntil) { e.fsNovaDone = true; g.vx({ k: 'shake', amt: 12 }); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: 18, color: '#fff6c8' }); if (!g.netTargets) novaHits(g, e); }
  },
  end(g, e) { e.fsNovaUntil = 0; },
};
function shaded(e, p) {                                    // is a mine between the star and you?
  for (let k = 0; k < 5; k++) { const mx = e['fsM' + k + 'x'], my = e['fsM' + k + 'y']; if (!(mx > -900)) continue;
    const dm = Math.hypot(mx - e.x, my - e.y), dp = Math.hypot(p.x - e.x, p.y - e.y); if (dp <= dm) continue;
    const da = Math.abs(Math.atan2(Math.sin(angleTo(e.x, e.y, p.x, p.y) - angleTo(e.x, e.y, mx, my)), Math.cos(angleTo(e.x, e.y, p.x, p.y) - angleTo(e.x, e.y, mx, my))));
    if (da < Math.atan2(0.9, dm)) return true; }
  return false;
}
// the Supernova: about three quarters of a Godfall player's Life (it was 380 at a scale of 6, three times a Life (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs))
function novaHits(g, e) { const p = g.player; if (!p.dead && !shaded(e, p)) g.hurtPlayer(g.bxDmg(e, 220), `${e.D.name}'s supernova`); }

// against a steady circle (check_boss_safespots, 2026-10-27): only when you run, at where you are running to
function starfall(g, e, V) {                              // a falling star: two marked circles on your path, landing in turn, scattering embers
  if (!running(e)) return;
  for (const T of [0.9, 1.3]) { const [x, y] = ahead(g, e, T); g.fx.push({ kind: 'zone', src: e, x, y, r: 1.2, t: 0, delay: T, life: T + 0.15, dmg: g.bxDmg(e, V.dmg || 52), by: e.D.name, done: false, colors: ['#fff3a0', '#ff9a3a'], shards: 6, proj: 'last_shots/the_fallen_star.ember' }); }
}

export default {
  id: 'the_fallen_star', art: 'the_fallen_star', shotSheet: 'last_shots', name: 'The Fallen Star', biome: 'godfall', hp: 240000, def: 20, xp: 8000,
  // dmgScale was 6 (set while the realm halved every blow): its embers hit for 300 and its comet run for 480, a
  // Godfall player's whole Life (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs)
  dmgScale: 1.6, r: 1.5, speed: 0.9, keep: 5, faces: false, tempo: 1, finale,
  phases: {
    1: { move: 'pace', pressure: [{ every: 3.6, special: 'starfall', delay: 2.9, dmg: 52 }], patterns: [
      { name: 'embers', windup: 0.5, recover: 0.7, special: 'embers', n: 18, dmg: 50 },
      { name: 'a comet run', windup: 0.5, recover: 0.9, special: 'comet', dmg: 80 },
      { name: 'a constellation', windup: 0.8, recover: 0.8, special: 'constellation', n: 4 },
    ] },
    2: { move: 'pace', pressure: [{ every: 3.2, special: 'starfall', delay: 2.6, dmg: 52 }], patterns: [
      { name: 'flares', windup: 0.5, recover: 0.6, special: 'flares', waves: 2, dmg: 52 },
      { name: 'a constellation', windup: 0.7, recover: 0.7, special: 'constellation', n: 5 },
      { name: 'a comet run', windup: 0.4, recover: 0.8, special: 'comet', dmg: 82 },
      { name: 'embers', windup: 0.4, recover: 0.6, special: 'embers', n: 22, dmg: 50 },
    ] },
    3: { move: 'pace', pressure: [{ every: 2.8, special: 'starfall', delay: 2.2, dmg: 52 }], patterns: [
      { name: 'flares', windup: 0.4, recover: 0.5, special: 'flares', waves: 3, dmg: 54 },
      { name: 'a constellation', windup: 0.5, recover: 0.6, special: 'constellation', n: 6 },
      { name: 'a comet run', windup: 0.4, recover: 0.7, special: 'comet', dmg: 84 },
    ] },
  },
  specials: { constellation, embers, comet, flares, flareRing, starfall },
  onWake(g) { g.banner('THE FALLEN STAR · break its constellations', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('IT BURNS BRIGHTER', 2400); if (ph === 3) g.banner('SUPERNOVA', 2400); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    if ((e.fsMines || []).length && (e.fsLineT = (e.fsLineT ?? 1.2) - dt) <= 0) { e.fsLineT = S.phase === 3 ? 1.4 : 1.9; lines(g, e); }
    const C = e.fsRun; if (C && g.t >= C.at) { if (g.t >= C.until) e.fsRun = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; if (Math.random() < 0.4) g.bxShotAt(e, e.x, e.y, 1, R() * TAU, { shot: 'ember', speed: 2.5, range: 6, dmg: 50 }); } }
  },
  // in your own browser: when the supernova lands, a mine's shadow is the only shelter
  local(g, e) { if (e.net && e.fsNovaUntil > 0 && g.t >= e.fsNovaUntil && e.fsNovaSeen !== e.fsNovaUntil) { e.fsNovaSeen = e.fsNovaUntil; novaHits(g, e); } },
  onDeath(g, e) { for (const m of e.fsMines || []) kill(m); g.banner('THE STAR GOES OUT. GODFALL IS DARK, AND COOLER.', 3400); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 140, col: '#ffb070' }]; },
  drawGround(r, g, e) {                                    // the supernova: the shadows behind each mine
    if (!(e.fsNovaUntil > g.t) || e.bx.state !== 'finale') return;
    const b = r.b;
    for (let k = 0; k < 5; k++) { const mx = e['fsM' + k + 'x'], my = e['fsM' + k + 'y']; if (!(mx > -900)) continue;
      const a = angleTo(e.x, e.y, mx, my), dm = Math.hypot(mx - e.x, my - e.y), w = Math.atan2(0.9, dm), pts = [r.proj(mx, my)];
      for (const s of [-1, 1]) pts.push(r.proj(e.x + Math.cos(a + s * w) * (dm + 9), e.y + Math.sin(a + s * w) * (dm + 9)));
      b.globalAlpha = 0.45; b.fillStyle = '#1a1028'; b.beginPath(); b.moveTo(pts[0][0], pts[0][1]); b.lineTo(pts[1][0], pts[1][1]); b.lineTo(pts[2][0], pts[2][1]); b.closePath(); b.fill(); b.globalAlpha = 1; }
  },
  get loot() { return REALM_BOSSES.the_fallen_star.loot; },
  lootLuck: 1.6,
};
