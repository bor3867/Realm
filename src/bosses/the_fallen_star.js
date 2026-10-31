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
function comet(g, e, V) {                                  // a run at you (or where you're going: V.lead), along a marked line, embers flung off its tail
  const q0 = target(g, e), [lx, ly] = V.lead ? ahead(g, e, 0.9) : [q0.x, q0.y], q = { x: lx, y: ly }, a = angleTo(e.x, e.y, q.x, q.y), L = Math.min(14, Math.hypot(q.x - e.x, q.y - e.y) + 4), d = V.delay || 0.9;
  g.fx.push({ kind: 'lane', x: e.x, y: e.y, a, len: L, w: 1.1, delay: d, t: 0, life: d + 0.7, dmg: g.bxDmg(e, V.dmg || 80), by: e.D.name, hitT: 0, cols: FIRE });
  e.fsRun = { x0: e.x, y0: e.y, x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.6 };
}
// (2026-10-31: "the whole fight doesn't scream hardest boss in the realm") a meteor shower: stars streak across the
// field in a sheet from one side, then another from the side after, each with one gap
function shower(g, e, V) {
  const sides = ['n', 'e', 's', 'w'], i = Math.floor(R() * 4);
  for (let w = 0; w < (V.waves || 2); w++) e.bx.vol.push({ t: w * 0.9, V: { form: 'curtain', from_side: sides[(i + w) % 4], shot: 'flare', count: 22, gaps: 3, speed: 6, dmg: V.dmg || 54 } });
}
// its gravity well: for three seconds it draws you in, while a spiral of embers turns out of it: walk out against the pull
function well(g, e, V) {
  e.fsWellUntil = g.t + (V.dur || 3);
  g.banner('IT PULLS YOU IN', 1400);
  e.bx.vol.push({ t: 0, V: { form: 'spiral', shot: 'ember', arms: V.arms || 4, dur: V.dur || 3, every: 0.14, turn: 0.2, speed: 4, range: 13, dmg: V.dmg || 52 } });
}
// twin comets: a run at you, and from where it ends, a second at where you went
function twincomet(g, e, V) { comet(g, e, V); g.fvLater((V.delay || 0.8) + 0.7, () => { if (!e.dead && e.bx.state === 'fight') comet(g, e, { ...V, delay: 0.6, lead: true }); }); }
// (its fan alternates: at you, then where you are running to; a steady circle round it was the way to stand it, 2026-10-31)
function flares(g, e, V) { const [ox, oy] = g.bxOrigin(e), q = target(g, e), [lx, ly] = ahead(g, e, 0.5); for (let w = 0; w < (V.waves || 2); w++) e.bx.vol.push({ t: w * 0.3, V: { form: 'special', name: 'flareRing', w, a: w % 2 ? angleTo(ox, oy, lx, ly) : angleTo(ox, oy, q.x, q.y), dmg: V.dmg } }); }
function flareRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy, 12, { shot: 'flare', speed: 7, range: 12, dmg: V.dmg || 50 }, V.w * 0.26); fan(g, e, ox, oy, V.a, 3, 0.3, { shot: 'flare', speed: 10, range: 13, dmg: V.dmg || 50 }); }
// the Supernova (reworked 2026-10-31, the user: "hard to see safespots, it is easy as hell and isn't interesting"):
// three bursts, five seconds apart, round a ring of five mines. Before each, a ring closes in on the star (the
// countdown) and the mines' shadows are drawn bright, cool and outlined; get into one. Each burst burns a mine out, so
// the shelters thin, five, four, three, and the one you hid behind may be gone: move. Meanwhile embers wheel off the
// star in a slow spiral and the constellation's lines still burn between the mines (shooting a mine to break its lines
// also takes away its shadow).
const NOVA_GAP = 5;
const finale = {
  at: 0.1, dur: 17, name: 'Supernova', say: 'hide in a star\'s shadow', after: 1.4,
  start(g, e) {
    constellation(g, e, { n: 5 });
    e.fsMines.forEach((m, k) => { const a = (k / 5) * TAU + R() * 0.4; m.x = e.x + Math.cos(a) * 4.6; m.y = e.y + Math.sin(a) * 4; });
    e.fsNovaN = 0; e.fsNovaUntil = g.t + NOVA_GAP; e.fsNovaDone = false; e.fsSpin = 0.8;
    g.banner('IT SWELLS · get behind a star-mine, into its shadow', 2400);
  },
  update(g, e, dt) {
    for (let k = 0; k < 5; k++) { const m = (e.fsMines || [])[k]; e['fsM' + k + 'x'] = m && !m.dead ? m.x : -999; e['fsM' + k + 'y'] = m && !m.dead ? m.y : -999; }   // (plain, for the browsers' shadows)
    if (!e.fsNovaDone && g.t >= e.fsNovaUntil) {
      e.fsNovaN++;
      g.vx({ k: 'shake', amt: 12 }); g.fx.push({ kind: 'ring', x: e.x, y: e.y - 1, t: 0, max: 18, color: '#fff6c8' });
      g.vx({ k: 'burst', x: e.x, y: e.y - 1, n: 60, colors: ['#ffffff', '#fff6c8', '#ffb070'] });
      if (!g.netTargets) novaHits(g, e);
      if (e.fsNovaN < 3) {
        const L = minesOf(g, e);
        if (L.length > 2) { const m = L[Math.floor(R() * L.length)]; g.vx({ k: 'burst', x: m.x, y: m.y - 0.5, n: 24, colors: ['#ffd650', '#2a1a14'] }); kill(m); }
        e.fsNovaUntil = g.t + NOVA_GAP;
        g.banner(e.fsNovaN === 1 ? 'A STAR BURNS OUT · find another shadow' : 'ONE MORE · the last shadows', 1800);
      } else e.fsNovaDone = true;
    }
    if ((e.fsSpin -= dt) <= 0) {                            // embers wheel off it between the bursts
      e.fsSpin = 0.17; const [ox, oy] = g.bxOrigin(e), k = (e.fsSpinK = (e.fsSpinK || 0) + 1);
      for (let a = 0; a < 3; a++) g.bxShot(e, ox, oy, k * 0.21 + (a * TAU) / 3, { shot: 'ember', speed: 3.3, range: 13, dmg: 55 });
    }
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
  dmgScale: 2.6, r: 1.5, speed: 0.9, keep: 5, faces: false, tempo: 0.88, finale,   // (2.4 and 1: 2026-10-31, the realm's hardest)   // (was 1.6: its embers did 4% to a maxed character. 2026-10-29)
  phases: {
    1: { move: 'pace', pressure: [{ every: 3.6, special: 'starfall', delay: 2.9, dmg: 52 }], patterns: [
      { name: 'embers', windup: 0.5, recover: 0.7, special: 'embers', n: 18, dmg: 50 },
      { name: 'a comet run', windup: 0.5, recover: 0.9, special: 'comet', dmg: 80 },
      { name: 'a constellation', windup: 0.8, recover: 0.8, special: 'constellation', n: 4 },
      { name: 'a meteor shower', windup: 0.7, recover: 0.7, special: 'shower', waves: 2, dmg: 54 },
    ] },
    2: { move: 'pace', pressure: [{ every: 3.2, special: 'starfall', delay: 2.6, dmg: 52 }], patterns: [
      { name: 'flares', windup: 0.5, recover: 0.6, special: 'flares', waves: 2, dmg: 52 },
      { name: 'a constellation', windup: 0.7, recover: 0.7, special: 'constellation', n: 5 },
      { name: 'a comet run', windup: 0.4, recover: 0.8, special: 'comet', dmg: 82 },
      { name: 'embers', windup: 0.4, recover: 0.6, special: 'embers', n: 22, dmg: 50 },
      { name: 'its gravity well', windup: 0.7, recover: 0.6, special: 'well', dur: 3, arms: 4, dmg: 52 },
    ] },
    3: { move: 'pace', pressure: [{ every: 2.8, special: 'starfall', delay: 2.2, dmg: 52 }], patterns: [
      { name: 'flares', windup: 0.4, recover: 0.5, special: 'flares', waves: 3, dmg: 54 },
      { name: 'a constellation', windup: 0.5, recover: 0.6, special: 'constellation', n: 6 },
      { name: 'twin comets', windup: 0.4, recover: 0.9, special: 'twincomet', dmg: 84 },
      { name: 'a meteor shower', windup: 0.5, recover: 0.6, special: 'shower', waves: 3, dmg: 56 },
      { name: 'its gravity well', windup: 0.6, recover: 0.5, special: 'well', dur: 3.4, arms: 5, dmg: 54 },
    ] },
  },
  specials: { constellation, embers, comet, flares, flareRing, starfall, shower, well, twincomet },
  onWake(g) { g.banner('THE FALLEN STAR · break its constellations', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('IT BURNS BRIGHTER', 2400); if (ph === 3) g.banner('SUPERNOVA', 2400); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    if ((e.fsMines || []).length && (e.fsLineT = (e.fsLineT ?? 1.2) - dt) <= 0) { e.fsLineT = S.phase === 3 ? 1.4 : 1.9; lines(g, e); }
    const C = e.fsRun; if (C && g.t >= C.at) { if (g.t >= C.until) e.fsRun = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; if (Math.random() < 0.4) g.bxShotAt(e, e.x, e.y, 1, R() * TAU, { shot: 'ember', speed: 2.5, range: 6, dmg: 50 }); } }
  },
  // in your own browser: when the supernova lands, a mine's shadow is the only shelter
  local(g, e, dt) {
    if (e.net && (e.fsNovaN || 0) > (e.fsNovaSeenN || 0)) { e.fsNovaSeenN = e.fsNovaN; novaHits(g, e); }   // (a shared star: each burst, once, by its count)
    if (e.fsWellUntil > g.t && !g.player.dead) {             // its gravity well: you are drawn in, steadily
      const p = g.player, d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > 2.5) g.moveCircle(p, ((e.x - p.x) / d) * 2.2 * dt, ((e.y - p.y) / d) * 2.2 * dt, 0.3);
    }
  },
  onDeath(g, e) { for (const m of e.fsMines || []) kill(m); g.banner('THE STAR GOES OUT. GODFALL IS DARK, AND COOLER.', 3400); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 140, col: '#ffb070' }]; },
  drawGround(r, g, e) {                                    // the supernova: the shadows behind each mine, and the countdown
    if (!(e.fsNovaUntil > g.t) || e.bx.state !== 'finale') return;
    const b = r.b, left = e.fsNovaUntil - g.t, k = Math.max(0, Math.min(1, left / NOVA_GAP)), hot = left < 1.5, [sx, sy] = r.proj(e.x, e.y);
    // the light: the field glows hotter as the burst nears, so the shadows stand out against it
    b.globalAlpha = 0.1 + 0.18 * (1 - k); b.fillStyle = '#ffb070'; b.beginPath(); b.arc(sx, sy, 15 * 16, 0, TAU); b.fill();
    for (let i = 0; i < 5; i++) { const mx = e['fsM' + i + 'x'], my = e['fsM' + i + 'y']; if (!(mx > -900)) continue;
      const a = angleTo(e.x, e.y, mx, my), dm = Math.hypot(mx - e.x, my - e.y), w = Math.atan2(0.9, dm), pts = [r.proj(mx, my)];
      for (const s of [-1, 1]) pts.push(r.proj(e.x + Math.cos(a + s * w) * (dm + 9), e.y + Math.sin(a + s * w) * (dm + 9)));
      b.globalAlpha = 0.7; b.fillStyle = '#0c1a3a'; b.beginPath(); b.moveTo(pts[0][0], pts[0][1]); b.lineTo(pts[1][0], pts[1][1]); b.lineTo(pts[2][0], pts[2][1]); b.closePath(); b.fill();
      b.globalAlpha = hot ? 0.6 + 0.4 * Math.sin(g.t * 24) : 0.85; b.strokeStyle = '#7ad0ff'; b.lineWidth = 1; b.setLineDash([3, 3]); b.stroke(); b.setLineDash([]);
    }
    b.globalAlpha = 0.9; b.strokeStyle = hot && Math.floor(g.t * 10) % 2 ? '#ffffff' : '#ffd650'; b.lineWidth = 2;   // the countdown: a ring closing on the star
    b.beginPath(); b.arc(sx, sy - 16, 10 + k * 15 * 16, 0, TAU); b.stroke(); b.lineWidth = 1; b.globalAlpha = 1;
  },
  get loot() { return REALM_BOSSES.the_fallen_star.loot; },
  lootLuck: 1.6,
};
