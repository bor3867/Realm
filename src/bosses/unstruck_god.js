// Solkhar, the Sunthief: to the user's castle spec (art/sunthiefs_castle_complete_encounter_spec.txt, 4), in the user's
// sprite. The last fight of the game, on the Stolen Sun's round dais (44x44, its edge a drop; four obelisks north, east,
// south and west; four lens pads between them). A director keeps the spec's scripted cycles (each attack at its offset;
// the next never before the last one's active window ends):
//   I   The Golden Tyrant (100-70%), hovering at the middle; 22 s: Sundial Execution, Corona Tides, The Four Heralds,
//       Judgment of Noon, Sundial Execution
//   II  The Broken Sun (70-35%), moving about the middle; 25 s: Black Sun Clock, Halo Knives, Sunless Pursuit, Lens of
//       Starvation; under it all the Eclipse Law: the floor's quarters burn by turns, solar then eclipse (a 17 s cycle)
//   III The Sunthief Unbound (35-15%), after you; 27 s: Heliocentric Vise, Black Sun Return, Heavens Underfoot, Fallen Sun
//       Chase (the Eclipse Law goes on)
//   below 15%: The Last Light (14 s), then the Chase or the Return until 18 s have passed, then the Last Light again
// His heralds, black suns and lenses can be broken; break two lenses and he staggers 1.4 s once the attack ends. A
// volley of spears from his chest runs under it all, by turns at you and where you are going. Damage numbers are
// effective ones (D(n): set above a Throne-geared character's Defense). His death takes 4 s: the core lifts, implodes,
// the crown and halo burn away, and the eclipse turns to sunrise.
// Art: tools/build_solkhar.py ('bx_solkhar', 'sol_shots/<name>'); his spears 'ug_shots/unstruck_god.<name>'.
import { DUNGEON_BOSSES } from '../data/enemies.js';
import { TAU, angleTo, target, ahead, running } from './kit.js';

const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const SUNC = ['#ffd650', '#fff6c8', '#ff9a2a'], VOID = ['#3a1a4a', '#8a5ad8', '#ffd650'];
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
const SPEAR = { sprite: 'ug_shots/unstruck_god.spear', size: 0.45 }, DOT = { sprite: 'sol_shots/orb', size: 0.32 }, STAR = { sprite: 'sol_shots/blacksun', size: 0.4 };
const FRAG = { sprite: 'sol_shots/fragment', size: 0.55 }, LANCE = { sprite: 'ug_shots/unstruck_god.spear', size: 0.4 };
const GOLD = ['#ffd650', '#ffd650', '#fff6c8', '#ffffff'], RED = ['#ff6a1c', '#ff6a1c', '#ffd650', '#ffffff'], CYAN = ['#8af0ff', '#8af0ff', '#8af0ff', '#ffffff'];
const show = (g, e, x, y, a, len, delay, w = 0.5, cols = GOLD) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols });
const beam = (g, e, x, y, a, len, delay, dmg, w = 1, live = 0.4) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + live, every: 0.5, dmg: g.bxDmg(e, dmg), by: e.D.name, hitT: 0, cols: GOLD });
// the dais, in the spec's own 44x44 tiles
const room = (e) => e.room || { x: Math.floor(e.x) - 22, y: Math.floor(e.y) - 22, w: 44, h: 44 };
const P = (e, sx, sy) => { const C = room(e); return { x: C.x + (sx / 44) * C.w, y: C.y + (sy / 44) * C.h }; };
const MID = (e) => P(e, 22, 22), RAD = (e) => (room(e).w / 44) * 19;
const OBELISKS = (e) => [[22, 5], [39, 22], [22, 39], [5, 22]].map(([x, y]) => P(e, x, y));   // N E S W
const PADS = (e) => [[11, 11], [33, 11], [33, 33], [11, 33]].map(([x, y]) => P(e, x, y));
function at(g, e, dx, h) { const a = g.camAngle || 0; return g.up(e.x + dx * Math.cos(a), e.y - dx * Math.sin(a), h); }
const CORE = (g, e) => at(g, e, 0, 4.2);                    // (the stolen sun in his chest: where its light is drawn)
// every shot leaves from the centre of its feet (the user: the bottom-centre of the boss, always; its staff or chest may glow, but never sets where a shot begins)
const FEET = (g, e) => [e.x, e.y];
const bearing = (g, e, x = e.x, y = e.y) => { const q = target(g, e); return angleTo(x, y, q.x, q.y); };
function inDais(e, x, y, m = 1.5) { const C = MID(e), d = Math.hypot(x - C.x, y - C.y), R0 = RAD(e) - m; return d <= R0 ? [x, y] : [C.x + (x - C.x) * R0 / d, C.y + (y - C.y) * R0 / d]; }
function minion(g, e, id, x, y, life) { const q = g.addEnemy(id, x, y); q.noLoot = true; q.seen = true; q.hidden = true; q.slUntil = g.t + life; (e.bx.slMinions = e.bx.slMinions || []).push(q); return q; }
const gone = (q) => !q || q.dead;

// ================================================================ under it all: spears from his chest
function solarVolley(g, e) {
  const S = e.bx, [ox, oy] = FEET(g, e), q = target(g, e), lead = (S.slVk = (S.slVk || 0) + 1) % 2, [x, y] = lead ? ahead(g, e, Math.hypot(q.x - ox, q.y - oy) / 7) : [q.x, q.y], a = angleTo(ox, oy, x, y);
  for (const o of [-0.2, -0.07, 0.07, 0.2]) shot(g, e, ox, oy, a + o, { ...SPEAR, speed: 7, range: 18, dmg: D(100) });
  if (running(e)) { const [fx, fy] = ahead(g, e, 1.4 + Math.hypot(q.x - ox, q.y - oy) / 7), b = angleTo(ox, oy, fx, fy); for (const o of [-0.08, 0.08]) shot(g, e, ox, oy, b + o, { ...SPEAR, speed: 7, range: 18, dmg: D(100) }); }   // (a runner: two more, well ahead of you)
}

// ================================================================ S1 Sundial Execution (I+)
function sundial(g, e) {
  const a0 = Math.random() * TAU, k = Math.floor(Math.random() * 12);
  e.bx.slSpears = { t0: g.t, n: 12, r: 6, a0, w: deg(60) / 0.85, spin: 0.85, until: g.t + 0.85, dark: [k, k + 1, k + 2, k + 3].map((i) => i % 12), darkAt: g.t + 0.55, cx: e.x, cy: e.y };
  later(e, 0.55, 'sundialShow'); later(e, 0.85, 'sundialFly', { second: false });
  later(e, 1.5, 'sundialForm', { k: (k + 2) % 12, a0: a0 + deg(60) });
  later(e, 2.2, 'sundialFly', { second: true });
}
function sundialAngle(Q, g, i) { return Q.a0 + Q.w * Math.min(Q.spin, Math.max(0, g.t - Q.t0)) + (i / Q.n) * TAU; }
function sundialShow(g, e) { const Q = e.bx.slSpears; if (!Q) return; for (let i = 0; i < 12; i++) if (!Q.dark.includes(i)) { const a = sundialAngle(Q, { t: Q.t0 + Q.spin }, i); show(g, e, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, a, 7, 0.3, 0.25); } }
function sundialForm(g, e, V) {
  const Q = { t0: g.t, n: 12, r: 6, a0: V.a0, w: 0, spin: 0, until: g.t + 0.7, dark: [0, 1, 2, 3].map((d) => (V.k + d) % 12), darkAt: g.t, cx: e.x, cy: e.y };
  e.bx.slSpears = Q;
  for (let i = 0; i < 12; i++) if (!Q.dark.includes(i)) { const a = Q.a0 + (i / 12) * TAU; show(g, e, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, a, 7, 0.7, 0.25); }
}
function sundialFly(g, e) {
  const Q = e.bx.slSpears; if (!Q) return;
  for (let i = 0; i < 12; i++) { if (Q.dark.includes(i)) continue; const a = sundialAngle(Q, g, i); shot(g, e, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, a, { ...SPEAR, speed: 7, range: 16, dmg: D(125) }); }
  e.bx.slSpears = null; g.sfx('zap');
}

// ================================================================ S2 Corona Tides (I+)
function corona(g, e) { e.bx.slCorona = { until: g.t + 1.0, cx: e.x, cy: e.y }; later(e, 1.0, 'coronaGo', { cx: e.x, cy: e.y, off: Math.random() * TAU }); }
function coronaGo(g, e, V) {
  e.bx.slCorona = null; const s = TAU / 20;
  for (const [r, sp, rot] of [[4, 3.7, 0], [10, -3.4, deg(36)]]) {
    for (let i = 0; i < 20; i++) {
      if (i < 4) continue;                                 // (four in a row out: the opening, turned 36 degrees ring to ring)
      const a = V.off + rot + i * s, x = V.cx + Math.cos(a) * r, y = V.cy + Math.sin(a) * r;
      shot(g, e, x, y, sp > 0 ? a : a + Math.PI, { ...DOT, speed: Math.abs(sp), range: Math.abs(sp) * 3, dmg: D(105) });
    }
  }
}

// ================================================================ S3 Judgment of Noon (I+)
function judgment(g, e) {
  const S = e.bx;
  if (!S.slKneel || S.phase === 3 && !S.slKneel3) { S.slKneel = true; if (S.phase === 3) S.slKneel3 = true; if (g.banner) g.banner('KNEEL BEFORE THE LAST SUN.', 2000); }
  for (let k = 0; k < 3; k++) later(e, k * 0.65, 'noonMark');
}
function noonMark(g, e) {                                  // a strip through the middle, through where you are: 1.25 s, then 0.4 s of light (230)
  const C = MID(e), q = target(g, e), a = angleTo(C.x, C.y, q.x, q.y), R0 = RAD(e);
  beam(g, e, C.x - Math.cos(a) * R0, C.y - Math.sin(a) * R0, a, R0 * 2, 1.25, D(230), 1, 0.4);
  later(e, 1.25, 'noonDots', { a });
}
function noonDots(g, e, V) { const C = MID(e); for (const s of [1, -1]) for (let k = 0; k < 3; k++) shot(g, e, C.x, C.y, V.a + s * Math.PI / 2 + (k - 1) * deg(14), { ...DOT, speed: 4.5, range: 16, dmg: D(85) }); g.sfx('zap'); }

// ================================================================ S4 The Four Heralds (I+)
function heralds(g, e) {
  const S = e.bx;
  if (!S.slHeraldSaid) { S.slHeraldSaid = true; if (g.banner) g.banner('THE HERALDS ARE AWAKENING.', 2200); }
  S.slHeralds = { ps: OBELISKS(e).map((o) => minion(g, e, 'sol_herald', o.x, o.y, 9.5)), from: g.t + 1.1, until: g.t + 9.5, t: 0, pair: 0, swap: g.t + 1.1 + 1.4 };
}

// ================================================================ S5 Eclipse Law (II+): the floor's quarters, by turns
function eclipseTick(g, e, dt) {
  const S = e.bx, L = S.slLaw || (S.slLaw = { t0: g.t, tick: 0, said: -1 });
  const k = (g.t - L.t0) % 17, step = k < 1.65 ? 0 : k < 8.65 ? 1 : k < 10.3 ? 2 : k < 16.8 ? 3 : 4;   // warn, solar, warn, eclipse, seam
  if (step !== L.said) { L.said = step; if (g.banner && (step === 0 || step === 2)) g.banner(step === 0 ? 'LIGHT FADES · SEEK THE MARKED SHADOW · SOLAR' : 'ECLIPSE', 1500); }
  L.state = step; L.burning = (step === 1 || step === 3) && !(S.slPause > g.t) ? (step === 1 ? 0 : 1) : -1;
  if (L.burning < 0) return;
  const p = g.player, C = MID(e); if (!p || p.dead) return;
  const q = quarterOf(e, p.x, p.y);
  if (q % 2 === L.burning && Math.hypot(p.x - C.x, p.y - C.y) > 2 && (L.tick -= dt) <= 0) { L.tick = 0.5; g.hurtPlayer(g.bxDmg(e, D(55)), L.burning ? 'the eclipse' : 'the solar floor'); }
}
function quarterOf(e, x, y) { const C = MID(e), a = Math.atan2(y - C.y, x - C.x) + Math.PI / 4; return ((Math.floor(a / (Math.PI / 2)) % 4) + 4) % 4; }   // (diagonal quarters: N, E, S, W wedges)

// ================================================================ S6 Halo Knives (II+)
function haloKnives(g, e) {
  const S = e.bx; S.slHalo = { t0: g.t + 0.8, r: 5, w: deg(110), until: g.t + 5.8, cx: e.x, cy: e.y };
  for (let t = 0; t < 5; t += 1.15) for (let k = 0; k < 6; k++) later(e, 0.8 + t + k * (1.15 / 6), 'knifeFan', { k });
  later(e, 0.8 + 4.55, 'knifeWarn'); later(e, 0.8 + 5.0, 'knifeLances');
}
const haloAt = (H, t, k) => H.w * Math.max(0, t - H.t0) + (k / 6) * TAU;
function knifeFan(g, e, V) {
  const H = e.bx.slHalo; if (!H || g.t > H.until) return;
  const a = haloAt(H, g.t, V.k), x = H.cx + Math.cos(a) * H.r, y = H.cy + Math.sin(a) * H.r, b = bearing(g, e, x, y);
  for (let i = 0; i < 3; i++) shot(g, e, x, y, b + (i - 1) * deg(12), { ...LANCE, speed: 6, range: 14, dmg: D(115) });
}
function knifeWarn(g, e) { const H = e.bx.slHalo; if (!H) return; for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t + 0.45, k); show(g, e, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, a, 8, 0.45, 0.3); } }
function knifeLances(g, e) { const H = e.bx.slHalo; if (!H) return; for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t, k); shot(g, e, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, a, { ...LANCE, speed: 7.2, range: 16, dmg: D(130) }); } e.bx.slHalo = null; }

// ================================================================ S7 Black Sun Clock (II+)
function blackClock(g, e) {
  const S = e.bx; S.slBlack = { ps: OBELISKS(e).map((o) => minion(g, e, 'sol_blacksun', o.x, o.y, 7.6)), from: g.t + 1.0, until: g.t + 7.5, t: 0, k: 0, flash: [] };
  for (const o of OBELISKS(e)) g.fx.push({ kind: 'zone', x: o.x, y: o.y, r: 1.2, t: 0, delay: 1.0, life: 1.0, dmg: 0, by: e.D.name, done: true, colors: VOID });
}

// ================================================================ S8 Sunless Pursuit (II+)
function pursuit(g, e) { for (let k = 0; k < 4; k++) later(e, 0.85 + k * 1.6 - 0.75, 'dashMark', { trail: 'spears' }); }
function dashMark(g, e, V) {                               // marked 0.75 s, locked 0.25 s before he goes; 4-6 tiles in 0.55 s (205)
  const a = bearing(g, e), [x1, y1] = inDais(e, e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 5, 2.5), L = Math.hypot(x1 - e.x, y1 - e.y);
  show(g, e, e.x, e.y, a, L + 1, 0.5, 1.1, RED);
  later(e, 0.5, 'dashLock', { trail: V.trail });
}
function dashLock(g, e, V) {
  const a = bearing(g, e), q = target(g, e), [x1, y1] = inDais(e, e.x + Math.cos(a) * Math.min(6, Math.max(4, Math.hypot(q.x - e.x, q.y - e.y))), e.y + Math.sin(a) * Math.min(6, Math.max(4, Math.hypot(q.x - e.x, q.y - e.y))), 2.5);
  show(g, e, e.x, e.y, a, Math.hypot(x1 - e.x, y1 - e.y) + 1, 0.25, 1.1, RED);
  e.slDash = { x0: e.x, y0: e.y, x1, y1, at: g.t + 0.25, until: g.t + 0.8, hit: false, trail: V.trail };
}

// ================================================================ S9 Lens of Starvation (II, III)
function lenses(g, e) {
  if (g.banner) g.banner('BREAK HIS LENSES.', 1800);
  const S = e.bx; S.slLens = { ps: PADS(e).map((o) => minion(g, e, 'sol_lens', o.x, o.y, 8)), t0: g.t };
  for (const t of [1.7, 2.8, 3.9, 5.0, 6.1]) later(e, t, 'lensFans');
  later(e, 8, 'lensEnd');
}
function lensFans(g, e) { const L = e.bx.slLens; if (!L) return; for (const q of L.ps) { if (gone(q)) continue; const a = bearing(g, e, q.x, q.y); for (let i = 0; i < 5; i++) shot(g, e, q.x, q.y, a + (i / 4 - 0.5) * deg(50), { ...DOT, speed: 5.6, range: 18, dmg: D(100) }); } }
function lensEnd(g, e) {
  const S = e.bx, L = S.slLens; if (!L) return;
  const broken = L.ps.filter((q) => q.dead && !q.slExpired).length;
  for (const q of L.ps) if (!q.dead) { q.slExpired = true; q.noLoot = true; q.dead = true; q.deadT = 0; }
  S.slLens = null;
  if (broken >= 2) { S.slStagger = g.t + 1.4; if (g.banner) g.banner('His lenses shatter: Solkhar staggers!', 1600); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 30, colors: SUNC }); }
}

// ================================================================ S10 Heliocentric Vise (III)
function vise(g, e) {
  const a0 = bearing(g, e) + Math.PI / 2, s = Math.random() < 0.5 ? 1 : -1;
  e.bx.slVise = { a0, s, w: deg(100) / 4, t0: g.t + 1.25, until: g.t + 5.25, cx: e.x, cy: e.y, links: null, emit: g.t + 1.25 };
  later(e, 1.25, 'viseGo');
}
const viseAt = (Q, t, arm) => Q.a0 + arm * Math.PI + Q.s * Q.w * Math.max(0, t - Q.t0);
function viseGo(g, e) {
  const Q = e.bx.slVise; if (!Q) return; Q.links = [];
  for (let arm = 0; arm < 2; arm++) for (let j = 0; j < 6; j++) { const r = 4.5 + j, a = viseAt(Q, g.t, arm), b = shot(g, e, Q.cx + Math.cos(a) * r, Q.cy + Math.sin(a) * r, a, { ...DOT, speed: 0.01, range: 1, dmg: D(100) }); b.life = 4.2; b.slArm = arm; b.slR = r; Q.links.push(b); }
}

// ================================================================ S11 Black Sun Return (III)
function blackReturn(g, e) {
  const C = MID(e), off = Math.random() * TAU, gaps = [0, 6, 12, 18].map((i) => [i, i + 1]).flat();
  g.fx.push({ kind: 'ring', x: C.x, y: C.y, t: 0, max: 15, color: '#8a5ad8' });
  later(e, 1.0, 'returnIn', { off, gaps });
}
function returnIn(g, e, V) {
  const C = MID(e); e.bx.slRet = [];
  for (let i = 0; i < 24; i++) { if (V.gaps.includes(i)) continue; const a = V.off + (i / 24) * TAU, b = shot(g, e, C.x + Math.cos(a) * 15, C.y + Math.sin(a) * 15, a + Math.PI, { ...STAR, speed: 4.0, range: 12.8, dmg: D(115) }); b.life = 4; e.bx.slRet.push(b); }
  later(e, 2.4, 'returnHold'); later(e, 2.95, 'returnOut');
}
function returnHold(g, e) { for (const b of e.bx.slRet || []) if (b.life > 0) { b.vx = 0; b.vy = 0; b.life = Math.max(b.life, 1.2); g.vx({ k: 'burst', x: b.x, y: b.y, n: 2, colors: ['#ffffff', '#ffd650'] }); } }
function returnOut(g, e) {
  const C = MID(e);
  for (const b of e.bx.slRet || []) { if (!(b.life > 0)) continue; const a = Math.atan2(b.y - C.y, b.x - C.x); b.vx = Math.cos(a) * 5.7; b.vy = Math.sin(a) * 5.7; b.a = a; b.sprite = FRAG.sprite; b.dmg = g.bxDmg(e, D(145)); b.life = 3; }
  e.bx.slRet = null;
}

// ================================================================ S12 Heavens Underfoot (III)
function heavens(g, e) {
  [[0, 2], [1, 3], [0, 2]].forEach((pair, k) => later(e, k * 2.25, 'heavenMark', { pair, off: k === 2 ? 3 : 0 }));
}
function heavenMark(g, e, V) {                             // two opposite obelisks' strips to the middle: 1.25 s, then 0.45 s of light (205)
  const C = MID(e), O = OBELISKS(e);
  for (const i of V.pair) {
    const o = O[i], a = angleTo(o.x, o.y, C.x, C.y), nx = -Math.sin(a) * V.off, ny = Math.cos(a) * V.off;
    beam(g, e, o.x + nx, o.y + ny, a, Math.hypot(C.x - o.x, C.y - o.y), 1.25, D(205), 1, 0.45);
    later(e, 1.25, 'heavenDots', { x: o.x, y: o.y, a });
  }
}
function heavenDots(g, e, V) { for (let k = 0; k < 8; k++) shot(g, e, V.x, V.y, V.a + (k / 7 - 0.5) * deg(120), { ...DOT, speed: 5.0, range: 16, dmg: D(95) }); }

// ================================================================ S13 Fallen Sun Chase (III)
function chase(g, e) {
  if (g.banner) g.banner('THE SUN WILL HUNT YOU.', 1800); g.sfx('roar');
  e.bx.slChase = { from: g.t + 1.0, until: g.t + 8.2, t: 0 };
  for (const t of [1.4, 3.5, 5.8]) later(e, 1.0 + t - 0.85, 'dashMark', {});
}

// ================================================================ S14 The Last Light (below 15%)
function lastLight(g, e) {
  const S = e.bx;
  if (!S.slLastSaid) { S.slLastSaid = true; if (g.banner) g.banner('THE STOLEN SUN IS COLLAPSING.', 2800); }
  S.slPause = g.t + 14; S.slObelisks = g.t;                // (the eclipse floor goes neutral for it)
  const a0 = Math.random() * TAU;
  for (let k = 0; k < 3; k++) later(e, 1.2 + k * 0.8, 'lastRing', { off: a0 + k * deg(20) });
  for (const a of [a0, a0 + Math.PI]) later(e, 3.6, 'lastCorridor', { a });
  for (let k = 0; k < 4; k++) later(e, 4.7 + k * 0.65, 'lastPortals', { k });
  later(e, 7.4, 'lastBeams');
  later(e, 10.6, 'lastFlash'); later(e, 10.95, 'lastClear'); later(e, 11.65, 'lastFragments', { off: a0 });
}
function lastRing(g, e, V) {
  const C = MID(e), s = TAU / 18, g0 = Math.floor(Math.random() * 18);
  for (let i = 0; i < 18; i++) { if ((i - g0 + 18) % 18 < 3) continue; shot(g, e, C.x, C.y, V.off + i * s, { ...DOT, speed: 4.7, range: 19, dmg: D(105) }); }
}
function lastCorridor(g, e, V) { const C = MID(e), R0 = RAD(e); show(g, e, C.x - Math.cos(V.a) * R0, C.y - Math.sin(V.a) * R0, V.a, R0 * 2, 1.1, 1.5, CYAN); }
function lastPortals(g, e, V) {                            // the four pads, by turns two and two: five-shot fans (110)
  const pads = PADS(e), pair = V.k % 2 ? [1, 3] : [0, 2];
  for (const i of pair) { const o = pads[i], a = bearing(g, e, o.x, o.y); for (let j = 0; j < 5; j++) shot(g, e, o.x, o.y, a + (j / 4 - 0.5) * deg(40), { ...STAR, speed: 6, range: 18, dmg: D(110) }); g.vx({ k: 'burst', x: o.x, y: o.y, n: 8, colors: VOID }); }
}
function lastBeams(g, e) {                                 // three strips at where you are now: 1.2, 1.9, 2.6 s marked, then 0.35 s each (225)
  const C = MID(e), R0 = RAD(e), q = target(g, e), a0 = angleTo(C.x, C.y, q.x, q.y);
  [0, deg(55), -deg(55)].forEach((o, k) => beam(g, e, C.x - Math.cos(a0 + o) * R0, C.y - Math.sin(a0 + o) * R0, a0 + o, R0 * 2, 1.2 + k * 0.7, D(225), 1, 0.35));
}
function lastFlash(g, e) { const [cx, cy] = CORE(g, e); g.vx({ k: 'burst', x: cx, y: cy, n: 40, colors: ['#ffffff', ...SUNC] }); for (let k = 0; k < 8; k++) show(g, e, e.x, e.y, (k / 10) * TAU, 6, 1.05, 0.4); }
function lastClear(g, e) { g.bxClearBullets(e); }
function lastFragments(g, e, V) { for (let k = 0; k < 10; k++) { if (k >= 8) continue; shot(g, e, e.x, e.y, V.off + (k / 10) * TAU, { ...FRAG, speed: 6.2, range: 18, dmg: D(150) }); } g.vx({ k: 'shake', amt: 10 }); g.sfx('shatter'); }

// ================================================================ the director: the spec's cycles
const A = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  S1: A('Sundial Execution', 'sundial', 2.4), S2: A('Corona Tides', 'corona', 5.0), S3: A('Judgment of Noon', 'judgment', 3.0), S4: A('The Four Heralds', 'heralds', 2.0),
  S6: A('Halo Knives', 'haloKnives', 6.0), S7: A('Black Sun Clock', 'blackClock', 2.0), S8: A('Sunless Pursuit', 'pursuit', 7.4, { move: 'hold' }), S9: A('Lens of Starvation', 'lenses', 6.5),
  S10: A('Heliocentric Vise', 'vise', 5.3, { move: 'hold' }), S11: A('Black Sun Return', 'blackReturn', 5.0), S12: A('Heavens Underfoot', 'heavens', 6.3), S13: A('Fallen Sun Chase', 'chase', 9.4, { move: 'chase' }),
  S14: A('The Last Light', 'lastLight', 14.0, { move: 'hold' }),
};
const CYCLE = {
  1: { len: 22, list: [[0, 'S1'], [3.7, 'S2'], [8.5, 'S4'], [12.5, 'S3'], [17.0, 'S1']] },
  2: { len: 25, list: [[0, 'S7'], [4.0, 'S6'], [9.5, 'S8'], [17.0, 'S9']] },
  3: { len: 27, list: [[0, 'S10'], [5.8, 'S11'], [11.5, 'S12'], [17.0, 'S13']] },
};
function choose(g, e) {
  const S = e.bx;
  if (S.slStagger > g.t) return null;                      // (staggered: his lenses broke)
  const C = S.slDir && S.slDir.ph === S.phase ? S.slDir : (S.slDir = { ph: S.phase, t0: g.t, i: 0, alt: 0, lastEnd: -99 });
  if (S.phase === 3 && e.hp / e.maxHp <= 0.15) {           // the Last Light; between, the Chase or the Return, till 18 s have passed
    if (g.t - C.lastEnd >= 18 + 14) { C.lastEnd = g.t; return AT.S14; }
    return AT[C.alt++ % 2 ? 'S11' : 'S13'];
  }
  const Y = CYCLE[S.phase] || CYCLE[3];
  if (C.i >= Y.list.length) { if (g.t < C.t0 + Y.len) return null; C.t0 = g.t; C.i = 0; }
  const [off, k] = Y.list[C.i];
  if (g.t < C.t0 + off) return null;
  C.i++;
  return AT[k];
}

export default {
  id: 'unstruck_god', art: 'solkhar', shotSheet: 'ug_shots', name: 'Solkhar, the Sunthief', biome: 'dungeon', hp: 850000, def: 34, xp: 30000,
  r: 2.2, speed: 2, keep: 5, faces: false, spawnCentre: true, tempo: 1, dmgScale: 1, thresholds: [0.70, 0.35], choose,
  walkPace: 2.5, charging: (g, e) => !!(e.slDash && g.t >= e.slDash.at),   // (his glide at his pace; his dashes)
  death: { hold: 1 },                                      // (4 s in all, the spec's: the 3 s clip, then held while the sun goes out)
  phases: {
    1: { move: 'center', pressure: [{ every: 1.7, special: 'solarVolley', delay: 1.5 }], patterns: Object.values(AT) },
    2: { move: 'roam', pressure: [{ every: 1.55, special: 'solarVolley', delay: 1.5 }], patterns: Object.values(AT) },
    3: { move: 'hunt', pressure: [{ every: 1.4, special: 'solarVolley', delay: 1.5 }], patterns: Object.values(AT) },
  },
  specials: { solarVolley, sundial, sundialShow, sundialForm, sundialFly, corona, coronaGo, judgment, noonMark, noonDots, heralds, haloKnives, knifeFan, knifeWarn, knifeLances,
    blackClock, pursuit, dashMark, dashLock, lenses, lensFans, lensEnd, vise, viseGo, blackReturn, returnIn, returnHold, returnOut, heavens, heavenMark, heavenDots, chase,
    lastLight, lastRing, lastCorridor, lastPortals, lastBeams, lastFlash, lastClear, lastFragments },
  moves: {
    roam(g, e, dt) {                                        // II: about the middle, never more than 8 tiles out
      const S = e.bx, C = MID(e);
      if (!S.slTo || g.t > S.slToT) { const a = Math.random() * TAU, r = Math.random() * 8; S.slTo = { x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r }; S.slToT = g.t + 2.5; }
      const d = Math.hypot(S.slTo.x - e.x, S.slTo.y - e.y); if (d > 0.2) g.moveCircle(e, ((S.slTo.x - e.x) / d) * Math.min(d, 2 * dt), ((S.slTo.y - e.y) / d) * Math.min(d, 2 * dt), 0.8);
    },
    hunt(g, e, dt) {                                        // III: after you, keeping 3 tiles
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      if (d > 3) { const [x, y] = inDais(e, e.x + ((q.x - e.x) / d) * 3 * dt, e.y + ((q.y - e.y) / d) * 3 * dt, 2.5); e.x = x; e.y = y; }
    },
    chase(g, e, dt) {                                       // the Chase: 4.6 tiles a second, between its dashes
      const H = e.bx.slChase; if (e.slDash || !H || g.t < H.from || g.t > H.until) return;
      const q = target(g, e), d = Math.hypot(q.x - e.x, q.y - e.y);
      if (d > 2.5) { const [x, y] = inDais(e, e.x + ((q.x - e.x) / d) * 4.6 * dt, e.y + ((q.y - e.y) / d) * 4.6 * dt, 2.5); e.x = x; e.y = y; }
    },
  },
  onWake(g) { if (g.banner) g.banner('SOLKHAR, THE SUNTHIEF', 2800); },
  onPhase(g, e, ph) {
    const S = e.bx; S.slSpears = S.slCorona = S.slHalo = S.slVise = S.slChase = S.slHeralds = S.slBlack = S.slLens = null; e.slDash = null;
    for (const q of S.slMinions || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.wait = ph === 2 ? 1.5 : 1.8;
    if (ph === 2) { if (g.banner) g.banner('LIGHT IS STOLEN', 2600); g.vx({ k: 'shake', amt: 8 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 40, colors: SUNC }); g.sfx('shatter'); S.slLaw = null; }
    if (ph === 3) { if (g.banner) g.banner('THE SUNTHIEF UNBOUND', 2800); g.vx({ k: 'shake', amt: 12 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 60, colors: [...SUNC, '#ff3a1a'] }); g.sfx('roar'); if (g.map) g.map.ambBoss = [12, 3, 8, 0.66]; }   // (his sanctum darker: src/castle.js eases into it)
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const Dh = e.slDash;                                    // a dash: once into you (205); spears after it when it's the Pursuit's
    if (Dh && g.t >= Dh.at) {
      if (g.t >= Dh.until) { e.slDash = null; if (Dh.trail) { const [ox, oy] = FEET(g, e), a = bearing(g, e, ox, oy); for (let k = 0; k < 5; k++) shot(g, e, ox, oy, a + (k / 4 - 0.5) * deg(40), { ...SPEAR, speed: 6.3, range: 16, dmg: D(115) }); } }
      else { const k = (g.t - Dh.at) / (Dh.until - Dh.at); e.x = Dh.x0 + (Dh.x1 - Dh.x0) * k; e.y = Dh.y0 + (Dh.y1 - Dh.y0) * k; const p = g.player; if (!Dh.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.4) { Dh.hit = true; g.hurtPlayer(g.bxDmg(e, D(205)), e.D.name); } }
    }
    const Ch = S.slChase;                                   // the Chase: the core's spears every 0.75 s
    if (Ch && g.t > Ch.from && g.t < Ch.until && (Ch.t -= dt) <= 0) { Ch.t = 0.75; const [ox, oy] = FEET(g, e), a = bearing(g, e, ox, oy); for (let k = 0; k < 4; k++) shot(g, e, ox, oy, a + (k / 3 - 0.5) * deg(35), { ...SPEAR, speed: 6.5, range: 16, dmg: D(120) }); }
    if (Ch && g.t > Ch.until) S.slChase = null;
    const Hd = S.slHeralds;                                 // the heralds: an opposite pair at a time, swapping every 1.4 s; fans every 0.7 s
    if (Hd && g.t > Hd.from) {
      if (g.t > Hd.until) S.slHeralds = null;
      else { if (g.t > Hd.swap) { Hd.swap += 1.4; Hd.pair ^= 1; } if ((Hd.t -= dt) <= 0) { Hd.t = 0.7; for (const i of Hd.pair ? [1, 3] : [0, 2]) { const q = Hd.ps[i]; if (gone(q)) continue; const a = bearing(g, e, q.x, q.y); for (let j = 0; j < 6; j++) shot(g, e, q.x, q.y, a + (j / 5 - 0.5) * deg(85), { ...DOT, speed: 5.4, range: 18, dmg: D(95) }); } } }
    }
    const Bk = S.slBlack;                                   // the black suns: by turns, a 7-dart fan every 0.65 s
    if (Bk && g.t > Bk.from) {
      if (g.t > Bk.until) S.slBlack = null;
      else if ((Bk.t -= dt) <= 0) { Bk.t = 0.65; for (let n = 0; n < 4; n++) { const i = Bk.k++ % 4, q = Bk.ps[i]; if (gone(q)) continue; const a = bearing(g, e, q.x, q.y); for (let j = 0; j < 7; j++) shot(g, e, q.x, q.y, a + (j / 6 - 0.5) * deg(60), { ...STAR, speed: 5.4, range: 18, dmg: D(105) }); Bk.flash[i] = g.t; break; } }
    }
    const V = S.slVise;                                     // the vise's arms, turning; each arm a dot every 0.4 s
    if (V && V.links) {
      if (g.t > V.until) { for (const b of V.links) b.life = 0; S.slVise = null; }
      else {
        for (const b of V.links) if (b.life > 0) { const a = viseAt(V, g.t, b.slArm); b.x = V.cx + Math.cos(a) * b.slR; b.y = V.cy + Math.sin(a) * b.slR; b.vx = 0; b.vy = 0; }
        if (g.t >= V.emit) { V.emit += 0.4; for (let arm = 0; arm < 2; arm++) { const a = viseAt(V, g.t, arm), r = 9.5; shot(g, e, V.cx + Math.cos(a) * r, V.cy + Math.sin(a) * r, a + V.s * Math.PI / 2, { ...DOT, speed: 4.3, range: 12, dmg: D(100) }); } }
      }
    }
    for (const q of S.slMinions || []) if (!q.dead && g.t > q.slUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.slMinions = (S.slMinions || []).filter((q) => !q.dead);
    if (S.phase >= 2 && S.state !== 'morph') eclipseTick(g, e, dt);
    if (S.slSpears && g.t > S.slSpears.until + 0.8) S.slSpears = null;
    if (S.slHalo && g.t > S.slHalo.until) S.slHalo = null;
    if (S.slCorona && g.t > S.slCorona.until) S.slCorona = null;
  },
  onDeath(g, e) {                                          // every portal stops; the core lifts, implodes; the crown and halo burn away; the eclipse turns to sunrise
    const S = e.bx; S.slSpears = S.slCorona = S.slHalo = S.slVise = S.slChase = S.slHeralds = S.slBlack = S.slLens = S.slLaw = null; e.slDash = null;
    for (const q of S.slMinions || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    g.vx({ k: 'shake', amt: 14 }); if (g.banner) g.banner('DAWN RETURNS.', 3600);
    g.fx.push({ kind: 'sunrise', t: 0, life: 6 });
    if (g.map) g.map.ambBoss = [60, 40, 10, 0.14];               // (the sun given back: his sanctum lit)
  },
  // the dais's marks: the Eclipse Law's quarters (gold-outlined suns, violet hatching), the corona's rings shown, the vise's path ahead
  drawGround(r, g, e) {
    const S = e.bx, b = r.b, C = MID(e), R0 = RAD(e), L = S.slLaw;
    if (L && S.phase >= 2 && !(S.slPause > g.t)) {
      const hot = L.state === 0 || L.state === 1 ? 0 : L.state === 2 || L.state === 3 ? 1 : -1, warn = L.state === 0 || L.state === 2;
      if (hot >= 0) {                                       // each burning quarter's tiles washed in its colour (solar gold, eclipse violet hatched), pulsing while it's only a warning
        const [o0x, o0y] = r.proj(0, 0), [o1x] = r.proj(1, 0), ts = Math.max(4, Math.round(Math.abs(o1x - o0x)));
        const base = warn ? 0.14 + 0.1 * Math.sin(g.t * 10) : 0.26;
        for (let ty = Math.floor(C.y - R0); ty <= C.y + R0; ty++) for (let tx = Math.floor(C.x - R0); tx <= C.x + R0; tx++) {
          const cx = tx + 0.5, cy = ty + 0.5, d = Math.hypot(cx - C.x, cy - C.y);
          if (d < 2 || d > R0 || quarterOf(e, cx, cy) % 2 !== hot) continue;
          const [x, y] = r.proj(cx, cy);
          b.globalAlpha = base; b.fillStyle = hot ? '#6a2ab0' : '#ffb030';
          b.fillRect(Math.round(x - ts / 2), Math.round(y - ts / 2), ts, ts);
          b.globalAlpha = base + 0.25; b.fillStyle = hot ? '#2a1040' : '#fff0a0';   // (a mark in each: a sun's dot, or the eclipse's hatching, not colour alone)
          if (hot) { for (let i = 0; i < ts; i += 4) b.fillRect(Math.round(x - ts / 2 + i), Math.round(y - ts / 2 + i), 2, 1); } else b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
        b.globalAlpha = 0.85; b.fillStyle = hot ? '#b884ff' : '#ffd650';   // the quarters' edges, bright
        for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4; for (let rr = 2; rr < R0; rr += 0.5) { const [x, y] = r.proj(C.x + Math.cos(a) * rr, C.y + Math.sin(a) * rr); b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); } }
        b.globalAlpha = 1;
      }
    }
    const Co = S.slCorona;
    if (Co) { b.fillStyle = '#ffd650'; b.globalAlpha = 0.6; for (let i = 0; i < 20; i++) for (const Rr of [4, 10]) { const a = (i / 20) * TAU, [x, y] = r.proj(Co.cx + Math.cos(a) * Rr, Co.cy + Math.sin(a) * Rr); b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); } b.globalAlpha = 1; }
    const V = S.slVise;
    if (V) { b.fillStyle = '#ffd650'; b.globalAlpha = 0.4; for (let arm = 0; arm < 2; arm++) for (let j = 0; j < 6; j++) { const a = viseAt(V, g.t + 0.6, arm), [x, y] = r.proj(V.cx + Math.cos(a) * (4.5 + j), V.cy + Math.sin(a) * (4.5 + j)); b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2); } b.globalAlpha = 1; }
  },
  // in the air: the sundial's spears, the halo's knives, his heralds, black suns and lenses (with their Life)
  draw(r, g, e) {
    const S = e.bx, R = r.R; if (!R) return;
    const get = (k) => { const M = r.objDefs || (r.objDefs = new Map()); let d = M.get(k); if (d === undefined) M.set(k, (d = R.resolve(k) || null)); return d; };
    const spear = get('ug_shots/unstruck_god.spear'), blade = get('ug_shots/unstruck_god.blade'), sun = get('sol_shots/sun'), black = get('sol_shots/blacksun'), frag = get('sol_shots/fragment');
    const put = (def, x, y, o) => { if (def) { const [sx, sy] = r.proj(x, y); r.drawDef(def, Object.keys(def.frames)[0], Math.round(sx), Math.round(sy) - 24, { center: true, ...o }); } };
    const Q = S.slSpears;
    if (Q) for (let i = 0; i < Q.n; i++) { const a = sundialAngle(Q, g, i), dk = Q.dark.includes(i) && g.t >= Q.darkAt; put(spear, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, { rot: a, alpha: dk ? 0.25 : 1 }); }
    const H = S.slHalo;
    if (H) for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t, k); put(blade, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, { rot: a }); }
    const bar = (q) => { if (q.dead || q.hp >= q.maxHp) return; const [sx, sy] = r.proj(q.x, q.y); r.hpBar(sx, sy + 3, q.hp / q.maxHp, 14); };
    if (S.slHeralds) for (const [i, q] of S.slHeralds.ps.entries()) if (!gone(q)) { const on = g.t > S.slHeralds.from && ((S.slHeralds.pair ? [1, 3] : [0, 2]).includes(i)); put(sun, q.x, q.y + 1.4, { scale: on ? 1.1 + 0.1 * Math.sin(g.t * 10) : 0.8, alpha: on ? 1 : 0.6 }); bar(q); }
    if (S.slBlack) S.slBlack.ps.forEach((q, k) => { if (gone(q)) return; put(black, q.x, q.y + 1.4, { scale: g.t - (S.slBlack.flash[k] || -9) < 0.25 ? 1.3 : 1 }); bar(q); });
    if (S.slLens) for (const q of S.slLens.ps) if (!gone(q)) { put(frag, q.x, q.y + 1.2, { scale: 1.4, rot: g.t }); bar(q); }
    if (S.slObelisks && g.t - S.slObelisks < 14) OBELISKS(e).forEach((o, k) => { if (g.t - S.slObelisks > k * 0.2) put(sun, o.x, o.y + 1.4, { scale: 0.9, alpha: 0.8 }); });
  },
  lights(g, e) { const ph = e.bx.phase || 1; return [{ x: e.x, y: e.y, h: 4.2, r: ph === 3 ? 140 : 110, col: '#ffd650', fire: true }]; },
  get loot() { return DUNGEON_BOSSES.the_unstruck_god.loot; },
  lootLuck: 2,
};
