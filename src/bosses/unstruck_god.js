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
// (2026-11-02 overhaul, the user: "far too easy and underwhelming for the final boss".) His shots all solar now (no
// sideways swords); Lesser Suns (S15) in every phase, miniature suns he throws out of the stolen one, each a source of
// its own (breakable; break a set and he staggers); his damage raised to the user's targets. And at 1 Life his true end,
// RECLAIM THE SUN (FINALE): nothing kills him; the sun tears free and comes down as a sanctuary of moving light; outside
// it the void eats you, inside it void bolts and crescents still must be dodged; 46 s, then the sun is yours and he dies.
// Art: tools/build_solkhar.py ('bx_solkhar', 'sol_shots/<name>': his solar shots, suns, void bolts and crescents).
import { DUNGEON_BOSSES } from '../data/enemies.js';
import { TAU, angleTo, target, ahead, running } from './kit.js';

const D = (n) => n + 4;
const deg = (d) => (d * Math.PI) / 180;
const SUNC = ['#ffd650', '#fff6c8', '#ff9a2a'], VOID = ['#3a1a4a', '#8a5ad8', '#ffd650'];
const later = (e, t, name, V = {}) => e.bx.vol.push({ t, V: { form: 'special', ...V, name } });   // (its own name last)
const shot = (g, e, x, y, a, V) => g.bxShot(e, x, y, a, V);
// his shots, solar all of them (2026-11-02, the user: no sideways swords): sharp solar shards from his chest, small golden
// fireballs, thin solar lances (the sundial's), burning pieces of his broken halo (its knives), dark-purple void bolts,
// black-and-gold eclipse crescents; the great shard for his last blows
const SPEAR = { sprite: 'sol_shots/shard', size: 0.4 }, DOT = { sprite: 'sol_shots/fireball', size: 0.36 }, STAR = { sprite: 'sol_shots/voidbolt', size: 0.36 };
const FRAG = { sprite: 'sol_shots/fragment', size: 0.55 }, LANCE = { sprite: 'sol_shots/halo', size: 0.45 }, SUNLANCE = { sprite: 'sol_shots/sunlance', size: 0.45 };
const CRESC = { sprite: 'sol_shots/eclipse', size: 0.42 };
const GOLD = ['#ffd650', '#ffd650', '#fff6c8', '#ffffff'], RED = ['#ff6a1c', '#ff6a1c', '#ffd650', '#ffffff'], CYAN = ['#8af0ff', '#8af0ff', '#8af0ff', '#ffffff'];
const show = (g, e, x, y, a, len, delay, w = 0.5, cols = GOLD) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay, dmg: 0, by: e.D.name, hitT: 0, cols });
const beam = (g, e, x, y, a, len, delay, dmg, w = 1, live = 0.4) => g.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + live, every: 0.5, dmg: g.bxDmg(e, dmg), by: e.D.name, hitT: 0, cols: GOLD });
// the dais, in the spec's own 44x44 tiles
const room = (e) => e.room || { x: Math.floor(e.x) - 22, y: Math.floor(e.y) - 22, w: 44, h: 44 };
const MID = (e) => { const C = room(e); return { x: C.x + C.w / 2, y: C.y + C.h / 2 }; }, RAD = () => 24;   // (the sanctum's floor: 24 tiles from its middle to its wall, 2026-11-03)
const P = (e, sx, sy) => { const C = MID(e); return { x: C.x + (sx - 22) * (24 / 19), y: C.y + (sy - 22) * (24 / 19) }; };   // (the older patterns' 44-unit dais, its rim on the wall)
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
  if (e.bx.slStagger > g.t) return;                        // (staggered: nothing)
  const S = e.bx, [ox, oy] = FEET(g, e), q = target(g, e), lead = (S.slVk = (S.slVk || 0) + 1) % 2, [x, y] = lead ? ahead(g, e, Math.hypot(q.x - ox, q.y - oy) / 7) : [q.x, q.y], a = angleTo(ox, oy, x, y);
  for (const o of [-0.2, -0.07, 0.07, 0.2]) shot(g, e, ox, oy, a + o, { ...SPEAR, speed: 7.2, range: 18, dmg: D(110) });
  if (running(e)) { const [fx, fy] = ahead(g, e, 1.4 + Math.hypot(q.x - ox, q.y - oy) / 7), b = angleTo(ox, oy, fx, fy); for (const o of [-0.08, 0.08]) shot(g, e, ox, oy, b + o, { ...SPEAR, speed: 7.2, range: 18, dmg: D(110) }); }   // (a runner: two more, well ahead of you)
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
  for (let i = 0; i < 12; i++) { if (Q.dark.includes(i)) continue; const a = sundialAngle(Q, g, i); shot(g, e, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, a, { ...SUNLANCE, speed: 7, range: 16, dmg: D(135) }); }
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
      shot(g, e, x, y, sp > 0 ? a : a + Math.PI, { ...DOT, speed: Math.abs(sp), range: Math.abs(sp) * 3, dmg: D(110) });
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
function noonDots(g, e, V) { const C = MID(e); for (const s of [1, -1]) for (let k = 0; k < 3; k++) shot(g, e, C.x, C.y, V.a + s * Math.PI / 2 + (k - 1) * deg(14), { ...DOT, speed: 4.8, range: 16, dmg: D(100) }); g.sfx('zap'); }

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
  for (let i = 0; i < 3; i++) shot(g, e, x, y, b + (i - 1) * deg(12), { ...LANCE, speed: 6.2, range: 14, dmg: D(120) });
}
function knifeWarn(g, e) { const H = e.bx.slHalo; if (!H) return; for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t + 0.45, k); show(g, e, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, a, 8, 0.45, 0.3); } }
function knifeLances(g, e) { const H = e.bx.slHalo; if (!H) return; for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t, k); shot(g, e, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, a, { ...LANCE, speed: 7.4, range: 16, dmg: D(140) }); } e.bx.slHalo = null; }

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
  for (const b of e.bx.slRet || []) { if (!(b.life > 0)) continue; const a = Math.atan2(b.y - C.y, b.x - C.x); b.vx = Math.cos(a) * 5.7; b.vy = Math.sin(a) * 5.7; b.a = a; b.sprite = CRESC.sprite; b.dmg = g.bxDmg(e, D(145)); b.life = 3; }
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
    beam(g, e, o.x + nx, o.y + ny, a, Math.hypot(C.x - o.x, C.y - o.y), 1.25, D(215), 1, 0.45);
    later(e, 1.25, 'heavenDots', { x: o.x, y: o.y, a });
  }
}
function heavenDots(g, e, V) { for (let k = 0; k < 8; k++) shot(g, e, V.x, V.y, V.a + (k / 7 - 0.5) * deg(120), { ...DOT, speed: 5.2, range: 16, dmg: D(100) }); }

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

// ================================================================ S15 Lesser Suns (I+)
// (2026-11-02, the user: "introduce actual miniature suns as independent attack sources... shots must visibly originate
// from the miniature suns".) He calls them out of the stolen one: each a spark thrown from his chest to its place (0.5 s),
// swelling there (0.5 s), then a source of its own (14,000 Life, drawn where its shots leave from; never set down within
// 4.5 tiles of you). I: two, still, firing fans together, then a collapsing ring (out, then back through the sun);
// II: three turning about him, rotating streams, and aimed lances from each by turns; III: four along paths across the
// dais, each its own pattern, changing every 2.5 s. They gutter after 9 s; break them all first and he staggers.
const SUN_HP = 14000, FREE = { free: true };
function lesserSuns(g, e) {
  const S = e.bx, ph = S.phase, n = ph + 1, q = target(g, e), C = MID(e), list = [];
  if (!S.slSunSaid) { S.slSunSaid = true; if (g.banner) g.banner('LESSER SUNS RISE.', 1800); }
  const a0 = angleTo(C.x, C.y, q.x, q.y) + Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const mode = ph === 1 ? 'still' : ph === 2 ? 'orbit' : 'path', a = a0 + (i / n) * TAU;
    let path = null, x, y;
    if (mode === 'orbit') { x = e.x + Math.cos(a) * 6; y = e.y + Math.sin(a) * 6; }
    else if (mode === 'still') { x = C.x + Math.cos(a) * 9; y = C.y + Math.sin(a) * 9; }
    else { path = [inDais(e, C.x + Math.cos(a) * 13, C.y + Math.sin(a) * 13, 2.5), inDais(e, C.x + Math.cos(a + 2.4) * 13, C.y + Math.sin(a + 2.4) * 13, 2.5)]; [x, y] = path[0]; }
    [x, y] = inDais(e, x, y, 2.5);
    const d = Math.hypot(x - q.x, y - q.y); if (d < 4.5) { const k = (4.5 - d) / (d || 1); [x, y] = inDais(e, x + (x - q.x) * k, y + (y - q.y) * k, 2.5); }
    const m = minion(g, e, 'sol_minisun', x, y, 10.5); m.hp = m.maxHp = SUN_HP;
    list.push({ q: m, mode, a, path, k: 0, born: g.t + i * 0.15, ready: g.t + 1.0 + i * 0.15, t: 0, i, fx: e.x, fy: e.y, pat: 0 });
  }
  S.slSuns = { list, until: g.t + 10, aim: 0, aimT: 1.6, back: [] };
  g.sfx('portal');
}
function sunFire(g, e, Z, s, kind) {
  const q = s.q, p = target(g, e), a = angleTo(q.x, q.y, p.x, p.y);
  if (kind === 'fans') { for (let j = 0; j < 5; j++) shot(g, e, q.x, q.y, a + (j / 4 - 0.5) * deg(50), { ...DOT, ...FREE, speed: 5.4, range: 18, dmg: D(100) }); return 1.4; }
  if (kind === 'collapse') {                               // out from the sun, then back in through it
    for (let j = 0; j < 10; j++) { const b = shot(g, e, q.x, q.y, (j / 10) * TAU + g.t, { ...DOT, ...FREE, speed: 3.6, range: 30, dmg: D(105) }); b.life = 3.2; Z.back.push({ b, at: g.t + 0.8 }); }
    g.vx({ k: 'burst', x: q.x, y: q.y, n: 8, colors: SUNC }); return 2.2;
  }
  if (kind === 'stream') { s.sa = (s.sa ?? a) + (s.i % 2 ? 1 : -1) * deg(100) * 0.22; shot(g, e, q.x, q.y, s.sa, { ...SPEAR, ...FREE, speed: 4.8, range: 18, dmg: D(95) }); return 0.22; }
  for (const o of [-1, 0, 1]) shot(g, e, q.x, q.y, a + o * deg(9), { ...SUNLANCE, ...FREE, speed: 7, range: 20, dmg: D(115) });   // aimed
  return 0.9;
}
function sunsTick(g, e, dt) {
  const S = e.bx, Z = S.slSuns; if (!Z) return;
  for (const B of Z.back) if (!B.done && g.t >= B.at) { B.done = true; const b = B.b; if (b.life > 0) { b.vx = -b.vx; b.vy = -b.vy; b.a = (b.a || 0) + Math.PI; } }
  const up = Z.list.filter((s) => !gone(s.q));
  if (!up.length) {                                        // all broken before they guttered: he staggers
    S.slSuns = null; S.slStagger = g.t + 2.4;
    if (g.banner) g.banner('THE LESSER SUNS GUTTER · SOLKHAR STAGGERS', 1800); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 30, colors: SUNC });
    return;
  }
  if (g.t > Z.until) { for (const s of up) { s.q.noLoot = true; s.q.dead = true; s.q.deadT = 0; g.vx({ k: 'burst', x: s.q.x, y: s.q.y, n: 10, colors: SUNC }); } S.slSuns = null; return; }
  for (const s of up) {
    if (g.t < s.ready) continue;
    const q = s.q;
    if (s.mode === 'orbit') { s.a += 0.6 * dt; [q.x, q.y] = inDais(e, e.x + Math.cos(s.a) * 6, e.y + Math.sin(s.a) * 6, 2.5); }
    if (s.mode === 'path') { const [A0, A1] = s.path, L = Math.hypot(A1[0] - A0[0], A1[1] - A0[1]) || 1; s.k += (2.2 / L) * dt; const u = 1 - Math.abs(1 - (s.k % 2)); q.x = A0[0] + (A1[0] - A0[0]) * u; q.y = A0[1] + (A1[1] - A0[1]) * u; }
    if ((s.t -= dt) > 0) continue;
    const kind = s.mode === 'still' ? (s.pat++ % 3 === 2 ? 'collapse' : 'fans') : s.mode === 'orbit' ? 'stream' : ['aimed', 'stream', 'collapse', 'fans'][(s.i + Math.floor((g.t - s.ready) / 2.5)) % 4];
    s.t = sunFire(g, e, Z, s, kind);
  }
  if (up[0].mode === 'orbit' && (Z.aimT -= dt) <= 0) { Z.aimT = 1.6; const s = up[Z.aim++ % up.length]; if (g.t >= s.ready) sunFire(g, e, Z, s, 'aimed'); }   // (II: lances from each by turns)
  Z.back = Z.back.filter((B) => !B.done);
}

// ================================================================ the true last phase: Stealing Back the Sun
// (2026-11-02, the user.) At 1 Life nothing kills him: the stolen sun tears free of his chest and comes down into the dais
// as a sanctuary of light; he is a dark, collapsing figure at its north edge. Outside the light the void eats you (70
// every half second); the light does not stop shots: void bolts come in from the edges and from portals that circle the
// dais, and must be dodged inside it. Four movements, 46 s in all (the bar counts it down), then the sun is yours:
//   1  2.5-13 s   one great light at the middle; fans of void bolts from the edge, aimed through it; his crescents at you
//   2  12-24 s    the light moves round the dais (each next one shown 1.5 s before it lights, the last fading 1.2 s after);
//                 two void portals circle the edge firing at you; a void lance across your light every 5 s (190)
//   3  24-35 s    the light split in two small ones, each lasting 8 s, staggered: one fades as another lights elsewhere;
//                 walls of eclipse crescents across the dais with a moving gap
//   4  35-46 s    lights that shrink as they last; everything at once, and rings of void collapsing in from the edge
const RING6 = (e) => { const C = MID(e); return [0, 1, 2, 3, 4, 5].map((k) => ({ x: C.x + Math.cos(k * TAU / 6 - Math.PI / 2) * 9, y: C.y + Math.sin(k * TAU / 6 - Math.PI / 2) * 9 })); };
const VOIDC = ['#8a5ad8', '#8a5ad8', '#3a1a4a', '#ffffff'];
function reclaimLights(e) {                                // the whole plan of lights, by the finale's own clock
  const C = MID(e), R = RING6(e), L = [{ ...C, r: 4.6, from: 2.5, to: 13.6 }];
  [0, 2, 4, 1].forEach((k, i) => L.push({ ...R[k], r: 3.8, from: 12.4 + i * 3.2, to: 12.4 + i * 3.2 + 4.4 }));
  [[3, 24.2, 32.2], [0, 24.2, 28.2], [5, 28.2, 36.2], [2, 32.2, 36.4]].forEach(([k, a, b]) => L.push({ ...R[k], r: 2.6, from: a, to: b }));
  [1, 4, 0, 3].forEach((k, i) => L.push({ ...R[k], r: 4.2, r1: 2.2, from: 35.2 + i * 2.7, to: 35.2 + i * 2.7 + 3.7 }));
  L.push({ ...C, r: 3, from: 45, to: 47 });
  return L;
}
const lightR = (L, T) => (L.r1 ? L.r + (L.r1 - L.r) * Math.max(0, Math.min(1, (T - L.from) / (L.to - L.from))) : L.r);
const FINALE = {
  name: 'Reclaim the Sun', say: 'STAY IN ITS LIGHT', at: 2e-6, dur: 46,   // (the bar: '... · RECLAIM THE SUN 31s', the countdown its objective)
  start(g, e) {
    const S = e.bx, [cx, cy] = CORE(g, e);
    S.slSpears = S.slCorona = S.slHalo = S.slVise = S.slChase = S.slHeralds = S.slBlack = S.slLens = S.slSuns = null; e.slDash = null; S.slPause = g.t + 999;
    for (const q of S.slMinions || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.slFin = { lights: reclaimLights(e), sunFrom: [cx, cy], home: P(e, 22, 6), x0: e.x, y0: e.y, tick: 0, fan: 0.6, volley: 1.4, port: 0.8, pk: 0, lance: 14, wall: 24.6, wk: 0, ring: 36 };
    if (S.anim && S.def.anims.void) S.anim.play('void', { speed: 1 });   // (a dark, collapsing figure: the sun gone out of him, coming apart)
    if (g.map) g.map.ambBoss = [6, 2, 12, 0.74];
    g.vx({ k: 'burst', x: cx, y: cy, n: 70, colors: ['#ffffff', ...SUNC] }); g.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, max: 12, color: '#ffd650' }); g.sfx('shatter');
    if (g.banner) g.banner('THE STOLEN SUN TEARS FREE · RECLAIM IT', 3000);
  },
  update(g, e, dt, T) {
    const S = e.bx, F = S.slFin; if (!F) return;
    if (T >= FINALE.dur - 0.1) {                           // the sun is yours
      g.bxClearBullets(e); S.slFin = null; if (g.map) g.map.ambBoss = [60, 40, 10, 0.14];
      if (g.banner) g.banner('THE SUN IS RECLAIMED', 3200);
      g.fx.push({ kind: 'ring', x: MID(e).x, y: MID(e).y, t: 0, max: 22, color: '#fff6c8' }); g.vx({ k: 'shake', amt: 12 });
      e.invulnT = 0; g.bxDie(e); return;
    }
    const k = Math.min(1, T / 2.2); e.x = F.x0 + (F.home.x - F.x0) * k; e.y = F.y0 + (F.home.y - F.y0) * k;   // (he drifts to the dais's north edge)
    if (Math.random() < 0.4) g.vx({ k: 'burst', x: e.x + (Math.random() - 0.5) * 3, y: e.y - Math.random() * 5, n: 1, colors: ['#3a1a4a', '#8a5ad8'] });   // (coming apart)
    const C = MID(e), R0 = RAD(e), p = g.player, act = F.lights.filter((L) => T >= L.from && T < L.to), q = target(g, e);
    if (p && !p.dead && T > 2.5 && !act.some((L) => Math.hypot(p.x - L.x, p.y - L.y) < lightR(L, T))) {   // the void, outside the light
      if ((F.tick -= dt) <= 0) { F.tick = 0.5; g.hurtPlayer(g.bxDmg(e, D(70)), 'the void'); }
    } else F.tick = Math.min(F.tick, 0.25);
    const main = act[act.length - 1] || C, edge = (a) => [C.x + Math.cos(a) * (R0 - 0.5), C.y + Math.sin(a) * (R0 - 0.5)];
    if (T > 2.5 && (F.fan -= dt) <= 0) {                   // void fans from the edge, through the light
      F.fan = T < 13 ? 0.55 : T < 35 ? 1.2 : 0.8;
      const [x, y] = edge(Math.random() * TAU), a = angleTo(x, y, main.x, main.y);
      for (let j = 0; j < 5; j++) shot(g, e, x, y, a + (j / 4 - 0.5) * deg(36), { ...STAR, ...FREE, speed: 4.6, range: 30, dmg: D(105) });
    }
    if (T > 3 && (F.volley -= dt) <= 0) {                  // his crescents, from the dark figure
      F.volley = T < 35 ? 1.4 : 1.0; const a = angleTo(e.x, e.y, q.x, q.y);
      for (const o of [-1, 0, 1]) shot(g, e, e.x, e.y, a + o * deg(14), { ...CRESC, speed: 6, range: 30, dmg: D(115) });
    }
    if (T > 12 && (F.port -= dt) <= 0) {                   // two void portals circling the edge
      F.port = 0.8; const i = F.pk++ % 2, [x, y] = edge(T * 0.35 + i * Math.PI), a = angleTo(x, y, q.x, q.y);
      for (const o of [-1, 0, 1]) shot(g, e, x, y, a + o * deg(10), { ...STAR, ...FREE, speed: 5.4, range: 30, dmg: D(100) });
    }
    if (T > F.lance && (T < 24 || T > 35)) {               // a void lance across your light (telegraphed 1.2 s)
      F.lance = T + 5; const a = Math.random() * Math.PI, R1 = R0 * 2;
      g.fx.push({ kind: 'lane', x: main.x - Math.cos(a) * R0, y: main.y - Math.sin(a) * R0, a, len: R1, w: 1.1, delay: 1.2, t: 0, life: 1.6, every: 0.5, dmg: g.bxDmg(e, D(190)), by: e.D.name, hitT: 0, cols: VOIDC });
    }
    if (T > F.wall && T < 35) {                            // walls of eclipse crescents across the dais, a gap that moves
      F.wall = T + 1.3; const dir = (F.wk % 4) * Math.PI / 2, gap = (F.wk * 3) % 13, k2 = F.wk++;
      const ox = C.x - Math.cos(dir) * R0, oy = C.y - Math.sin(dir) * R0, nx = -Math.sin(dir), ny = Math.cos(dir);
      for (let j = 0; j < 15; j++) { if (j >= gap && j < gap + 3) continue; const o = (j - 7) * 1.7; shot(g, e, ox + nx * o, oy + ny * o, dir, { ...CRESC, ...FREE, speed: 3.6 + (k2 % 2) * 0.4, range: R0 * 2, dmg: D(110) }); }
    }
    if (T > F.ring) {                                      // rings of void collapsing in from the edge
      F.ring = T + 3; const g0 = Math.floor(Math.random() * 18);
      for (let j = 0; j < 18; j++) { if ((j - g0 + 18) % 18 < 3) continue; const a = (j / 18) * TAU, [x, y] = edge(a); shot(g, e, x, y, a + Math.PI, { ...STAR, ...FREE, speed: 3.4, range: R0 * 2, dmg: D(110) }); }
    }
  },
};

// ================================================================ the director: the spec's cycles
const A = (name, special, recover, o = {}) => ({ name, special, windup: 0.45, recover, ...o });
const AT = {
  S1: A('Sundial Execution', 'sundial', 2.4), S2: A('Corona Tides', 'corona', 5.0), S3: A('Judgment of Noon', 'judgment', 3.0), S4: A('The Four Heralds', 'heralds', 2.0),
  S6: A('Halo Knives', 'haloKnives', 6.0), S7: A('Black Sun Clock', 'blackClock', 2.0), S8: A('Sunless Pursuit', 'pursuit', 7.4, { move: 'hold' }), S9: A('Lens of Starvation', 'lenses', 6.5),
  S10: A('Heliocentric Vise', 'vise', 5.3, { move: 'hold' }), S11: A('Black Sun Return', 'blackReturn', 5.0), S12: A('Heavens Underfoot', 'heavens', 6.3), S13: A('Fallen Sun Chase', 'chase', 9.4, { move: 'chase' }),
  S14: A('The Last Light', 'lastLight', 14.0, { move: 'hold' }), S15: A('Lesser Suns', 'lesserSuns', 1.2),
};
const CYCLE = {
  1: { len: 23, list: [[0, 'S15'], [1.7, 'S1'], [5.0, 'S2'], [10.0, 'S4'], [14.0, 'S3'], [18.5, 'S1']] },
  2: { len: 25, list: [[0, 'S7'], [4.0, 'S15'], [5.7, 'S6'], [11.0, 'S8'], [18.0, 'S9']] },
  3: { len: 28, list: [[0, 'S15'], [1.7, 'S10'], [7.5, 'S11'], [12.5, 'S15'], [14.2, 'S12'], [19.5, 'S13']] },
};

// ================================================================ v2: THE AUDITED SPEC (2026-11-03, the user's
// solkhar_sunthief_AUDITED_IMPLEMENTATION_v2.md). Built a phase at a time; Phase I (100-75%) is this, the phases after it
// are still the older ones until theirs are built.
// Coordinates: the spec's tiles from the arena's middle, +X east, +Y south, its entrance south and the captive Sun north.
// The sanctum's way in is from the north, so the whole encounter is turned half round: SP(sx, sy) = middle - (sx, sy), and
// a spec bearing θ (counter-clockwise from east) is π - θ here (y down). Aimed shots aim in the world as it is.
// Every attack keeps the spec's own clock (t = 0 when its first warning starts), its recovery, and its cooldown from its
// end; the order is the spec's, repeated with the safe sectors turned by a seeded {0, 45, 90, 135}. No filler: between
// attacks he hovers (never more than ~3 s idle when something is ready). Damage: the spec's effective numbers through D().
const SP = (e, sx, sy) => { const C = MID(e); return { x: C.x - sx, y: C.y - sy }; };
const SANG = (d) => Math.PI - deg(d);
const SHOT2 = { glint: { sprite: 'sol2/glint', size: 0.3 }, spear: { sprite: 'sol2/spear', size: 0.28 }, ember: { sprite: 'sol2/ember', size: 0.28 }, halo: { sprite: 'sol2/halo', size: 0.32 },
  eclipse: { sprite: 'sol2/eclipse', size: 0.32 }, void: { sprite: 'sol2/void', size: 0.26 }, comet: { sprite: 'sol2/comet', size: 0.32 }, sunspark: { sprite: 'sol2/sunspark', size: 0.3 } };
function edgeDist(e, x, y, a) { const C = MID(e), dx = x - C.x, dy = y - C.y, c = Math.cos(a), s = Math.sin(a), b = dx * c + dy * s, q = dx * dx + dy * dy - 24 * 24, disc = b * b - q; return disc > 0 ? Math.max(0.5, -b + Math.sqrt(disc)) : 0.5; }
// a shot of the library: its life the distance to the wall at its speed + 0.3 s, at most 10 s (the spec, 14)
function fire2(g, e, x, y, a, kind, speed, dmg, o = {}) { const range = o.range || Math.min(edgeDist(e, x, y, a) + 0.3 * speed, 10 * speed); const b = shot(g, e, x, y, a, { ...SHOT2[kind], speed, range, dmg: D(dmg), free: !!o.free }); if (o.phase && b) b.phase = true; return b; }   // (free: from a source of its own, a sun or a shard, not his feet; phase: born behind the wall)
const fan = (b, n, arc) => Array.from({ length: n }, (_, i) => (n === 1 ? b : b + (i / (n - 1) - 0.5) * arc));
const V2S = (e) => e.bx.v2 || (e.bx.v2 = { i: 0, ready: {}, busyUntil: 0, rot: 0, seed: 7331, beams: [], dial: null, pinc: null, kneel: 0, lastEnd: 0, counts: [] });
const seeded = (D) => { D.seed = (D.seed * 1103515245 + 12345) & 0x7fffffff; return D.seed / 0x7fffffff; };
const ROTS = [0, 45, 90, 135];

// ---- I-A ROYAL SUNDIAL: 12 points round him (3 tiles), three in a row go dark (the 90° way out); 0.8 s, then 9 spears
// outward (7 t/s, 115); 0.45 s after, the second ring forms turned 45°, its own 3-gap, and flies 0.8 s after it formed.
// Recovery 0.65 s, cooldown 5.5 s.
function v2Sundial(g, e) {
  const D = V2S(e), q = target(g, e), [ox, oy] = FEET(g, e), toP = angleTo(ox, oy, q.x, q.y);
  const a0 = toP + deg(D.rot) - deg(45) + deg(15);   // (the first gap's middle a turn from you by the cycle's rotation)
  D.dial = { cx: ox, cy: oy, rings: [{ a0, from: g.t, at: g.t + 0.8, gap: [0, 1, 2] }] };
  later(e, 0.8, 'v2DialFly', { k: 0 });
  later(e, 1.25, 'v2DialForm', { a0: a0 + deg(45) });
  later(e, 2.05, 'v2DialFly', { k: 1 });
}
function v2DialForm(g, e, V) { const D = V2S(e); if (D.dial) D.dial.rings.push({ a0: V.a0, from: g.t, at: g.t + 0.8, gap: [0, 1, 2] }); }
function v2DialFly(g, e, V) {
  const D = V2S(e), R0 = D.dial && D.dial.rings[V.k]; if (!R0) return;
  let n = 0; for (let i = 0; i < 12; i++) { if (R0.gap.includes(i)) continue; const a = R0.a0 + (i / 12) * TAU; fire2(g, e, D.dial.cx + Math.cos(a) * 3, D.dial.cy + Math.sin(a) * 3, a, 'spear', 7, 115); n++; }
  R0.done = true; D.counts.push(['sundial', n]); g.sfx('zap');
  if (V.k === 1) D.dial = null;
}

// ---- I-B CROWN'S REBUKE: crosshairs from his feet lock on you; a 7-glint fan over 64° (5.5 t/s, 75); twice more at +0.55
// and +1.10 s, each re-aimed in a 0.35 s visible twitch before its lock, turned +8° then -8°. Recovery 0.45 s, cooldown 3.3 s.
function v2Rebuke(g, e) { for (const [k, t, off] of [[0, 0.55, 0], [1, 1.1, 8], [2, 1.65, -8]]) { later(e, t - (k ? 0.35 : 0.55), 'v2RebukeAim', { k, off, wait: k ? 0.35 : 0.55 }); } }
function v2RebukeAim(g, e, V) {
  const D = V2S(e), [ox, oy] = FEET(g, e), b = bearing(g, e, ox, oy) - deg(V.off);
  for (const a of [b, b - deg(32), b + deg(32)]) show(g, e, ox, oy, a, 9, V.wait, a === b ? 0.18 : 0.1);   // (the crosshair: its middle and its edges)
  later(e, V.wait, 'v2RebukeFire', { b, ox, oy });
}
function v2RebukeFire(g, e, V) { const D = V2S(e); const [ox, oy] = FEET(g, e); for (const a of fan(V.b, 7, deg(64))) fire2(g, e, ox, oy, a, 'glint', 5.5, 75); D.counts.push(['rebuke', 7]); }

// ---- I-C CORONA PINCER: source lines either side (the spec's x = ±19 from y = -15 to +15, each slot pulled in to the
// wall where the round floor ends before it); 1.0 s, then each fires Wall(13, omit 5-7) of embers at the other (4.4 t/s,
// 70); 0.85 s later Wall(13, omit 8-10). Never on a player. Cooldown 9 s.
const PINC = [[5, 6, 7], [8, 9, 10]];
function pincSlots(e) { const out = []; for (let i = 0; i < 13; i++) { const sy = -15 + i * 2.5, sx = Math.min(19, Math.sqrt(23.2 * 23.2 - sy * sy)); out.push([sx, sy]); } return out; }
function v2Pincer(g, e) { const D = V2S(e), flip = (D.cycle || 0) % 2; D.pinc = { from: g.t, sets: flip ? [PINC[1], PINC[0]] : PINC, at: [g.t + 1.0, g.t + 1.85] }; later(e, 1.0, 'v2PincFire', { k: 0 }); later(e, 1.85, 'v2PincFire', { k: 1 }); }
function v2PincFire(g, e, V) {
  const D = V2S(e), P0 = D.pinc; if (!P0) return; const omit = P0.sets[V.k], pl = g.player; let n = 0;
  for (const side of [-1, 1]) pincSlots(e).forEach(([sx, sy], i) => {
    if (omit.includes(i)) return;
    const w = SP(e, side * sx, sy); if (pl && !pl.dead && Math.hypot(pl.x - w.x, pl.y - w.y) < 1.2) return;   // (never inside a player)
    fire2(g, e, w.x, w.y, SANG(side < 0 ? 0 : 180), 'ember', 4.4, 70); n++;
  });
  D.counts.push(['pincer', n]); if (V.k === 1) D.pincEnd = g.t + 0.4;
}

// ---- I-D SOLAR VERDICT: three light pillars. At its start the orientation is locked from where you stand (a lane through
// you, the spec's x or y clamped to ±16), the next two 4 tiles either side of it (clamped ±18). The first shown 1.2 s, the
// others 0.55 s before their own; each burns 0.35 s (190), 0.75 s apart. Recovery 1.15 s; cooldown 11 s. Survive it
// untouched and he kneels 1.1 s.
function v2Verdict(g, e) {
  const D = V2S(e), q = target(g, e), C = MID(e), vert = (D.vcount = (D.vcount || 0) + 1) % 2 === 1;
  if (g.banner) g.banner('SOLAR VERDICT', 1500);
  const base = vert ? q.x - C.x : q.y - C.y, cl = (v, m) => Math.max(-m, Math.min(m, v)), offs = [cl(base, 16), cl(cl(base, 16) + 4, 18), cl(cl(base, 16) - 4, 18)];
  D.vHit = false;
  offs.forEach((o, k) => {
    const on = g.t + 1.2 + k * 0.75, half = Math.sqrt(Math.max(1, 24 * 24 - o * o));
    D.beams.push(vert ? { x0: C.x + o, y0: C.y - half, x1: C.x + o, y1: C.y + half, show: k ? on - 0.55 : g.t, on, off: on + 0.35, w: 0.625, dmg: 190, hit: false, verdict: true }
      : { x0: C.x - half, y0: C.y + o, x1: C.x + half, y1: C.y + o, show: k ? on - 0.55 : g.t, on, off: on + 0.35, w: 0.625, dmg: 190, hit: false, verdict: true });
  });
  later(e, 1.2 + 1.5 + 0.35, 'v2VerdictEnd');
}
function v2VerdictEnd(g, e) { const D = V2S(e); D.counts.push(['verdict', 3]); if (!D.vHit) { D.kneel = g.t + 1.1; if (g.banner) g.banner('SOLKHAR STAGGERED', 1100); g.sfx('shatter'); } }
function beamTick(g, e) {
  const Z = e.bx.v2; if (!Z) return; const p = g.player;
  for (const B of Z.beams) {
    if (B.hit || g.t < B.on || g.t >= B.off || !p || p.dead) continue;
    const dx = B.x1 - B.x0, dy = B.y1 - B.y0, L = Math.hypot(dx, dy), u = ((p.x - B.x0) * dx + (p.y - B.y0) * dy) / (L * L), across = Math.abs((p.x - B.x0) * dy - (p.y - B.y0) * dx) / L;
    if (u >= 0 && u <= 1 && across < B.w + 0.32) { B.hit = true; if (B.verdict) Z.vHit = true; g.hurtPlayer(g.bxDmg(e, D(B.dmg)), 'Solar Verdict'); }   // (its core against your body: one hit a beam)
  }
  Z.beams = Z.beams.filter((B) => g.t < B.off + 0.2);
}

// the phase's record: each named attack, its clock, recovery, cooldown (the spec, 14: the implemented table)
const P1 = {
  rebuke: { id: 'crowns_rebuke', name: "Crown's Rebuke", start: v2Rebuke, total: 1.65 + 0.45, cd: 3.3 },
  sundial: { id: 'royal_sundial', name: 'Royal Sundial', start: v2Sundial, total: 2.05 + 0.65, cd: 5.5 },
  pincer: { id: 'corona_pincer', name: 'Corona Pincer', start: v2Pincer, total: 1.85 + 0.8, cd: 9.0 },
  verdict: { id: 'solar_verdict', name: 'Solar Verdict', start: v2Verdict, total: 1.2 + 1.5 + 0.35 + 1.15, cd: 11.0 },
};
const SEQ1 = ['rebuke', 'sundial', 'rebuke', 'pincer', 'sundial', 'verdict'];
const GAP = 0.6;                                             // (a breath between one attack's recovery and the next)
function choose1(g, e) {
  const D = V2S(e); D.counts = D.counts || [];
  if (g.t < D.busyUntil || g.t < D.kneel) return null;
  const k = SEQ1[D.i % SEQ1.length], A0 = P1[k];
  if (g.t < (D.ready[k] || 0) || g.t < D.lastEnd + GAP) return null;
  D.i++; if (D.i % SEQ1.length === 0) { D.cycle = (D.cycle || 0) + 1; D.rot = ROTS[Math.floor(seeded(D) * 4)]; }
  D.busyUntil = g.t + A0.total; D.lastEnd = D.busyUntil; D.ready[k] = D.busyUntil + A0.cd; D.log = D.log || []; D.log.push([A0.id, +g.t.toFixed(2)]);
  A0.start(g, e);
  return { name: A0.name, special: 'v2Nop', windup: 0.45, recover: 0.3 };
}
function v2Nop() {}
// ================================================================ v2 PHASE II: THE STOLEN LIGHT (75-50%). His sanctum
// darkens over the change ("THE LIGHT IS NOT YOURS."); a support (the lesser suns, the eclipse floor) beside at most one
// attack; Sundering Dawn never while a lesser sun lives.
// ---- II-A SUNSEED SUMMONING: two lesser suns rise from the captive Sun's pedestal (1.2 s, on their trails) to (±13, -2);
// 18,000 Life, 8 s each; by turns every 0.95 s, a 0.3 s pulse, then Fan(5, 55°) of sunsparks at you (5 t/s, 90). Break
// both inside 5 s and he staggers 1.4 s (+20%). Cooldown 14 s after both are gone.
function v2Sunseed(g, e) {
  const D = V2S(e), from = SP(e, 0, -17), at = g.t + 1.2;
  D.suns = { born: g.t, at, until: at + 8, k: 0, next: at + 0.3, list: [[13, -2], [-13, -2]].map(([sx, sy], i) => { const w = SP(e, sx, sy), q = minion(g, e, 'sol_herald', w.x, w.y, 9.2); q.hp = q.maxHp = 18000; return { q, i, x0: from.x, y0: from.y, pulse: -9 }; }) };
}
function sunsTick2(g, e) {
  const D = e.bx.v2, Z = D && D.suns; if (!Z) return;
  const alive = Z.list.filter((s) => !gone(s.q));
  if (!alive.length || g.t > Z.until) {
    if (!alive.length && !Z.judged && g.t < Z.at + 5) { Z.judged = true; D.stag = g.t + 1.4; if (g.banner) g.banner('SOLKHAR STAGGERED', 1400); g.sfx('shatter'); }
    for (const s of Z.list) if (!gone(s.q)) { s.q.noLoot = true; s.q.dead = true; s.q.deadT = 0; }
    D.ready.sunseed = g.t + 14; D.suns = null; return;
  }
  if (g.t < Z.at) return;
  if (g.t >= Z.next - 0.3 && !Z.lit) { Z.lit = true; const s = Z.list[Z.k % 2]; s.pulse = g.t; }   // (the pulse before it fires)
  if (g.t >= Z.next) {
    const s = Z.list[Z.k % 2]; Z.k++; Z.next += 0.95; Z.lit = false;
    if (!gone(s.q)) { const b = bearing(g, e, s.q.x, s.q.y); for (const a of fan(b, 5, deg(55))) fire2(g, e, s.q.x, s.q.y, a, 'sunspark', 5, 90, { free: true }); D.counts.push(['sunseed', 5]); }
  }
}
// ---- II-B HALO FRACTURE: four shards of his halo settle round him (4 tiles, the quarters; 0.75 s); each fires Fan(3, 24°)
// outward (5 t/s, 100) at +0, +0.5, +1.0, +1.5 s, the shards turning 22.5° a time; in the second the shard in a 70° sector
// stays dark (a way out). Recovery 0.7 s, cooldown 8 s.
function v2Halo(g, e) {
  const D = V2S(e), [ox, oy] = FEET(g, e), q = target(g, e);
  D.halo = { cx: ox, cy: oy, a0: deg(D.rot) + Math.PI / 4, from: g.t, dark: angleTo(ox, oy, q.x, q.y) + Math.PI };   // (the dark sector away from you: you run through it)
  for (let k = 0; k < 4; k++) later(e, 0.75 + k * 0.5, 'v2HaloFire', { k });
  later(e, 0.75 + 1.5 + 0.3, 'v2HaloEnd');
}
const shardAt = (H, k, i) => H.a0 + k * deg(22.5) + i * Math.PI / 2;
function v2HaloFire(g, e, V) {
  const D = V2S(e), H = D.halo; if (!H) return; let n = 0;
  for (let i = 0; i < 4; i++) {
    const a = shardAt(H, V.k, i); if (V.k === 1 && Math.abs(Math.atan2(Math.sin(a - H.dark), Math.cos(a - H.dark))) < deg(35)) continue;
    const x = H.cx + Math.cos(a) * 4, y = H.cy + Math.sin(a) * 4; for (const b of fan(a, 3, deg(24))) { fire2(g, e, x, y, b, 'halo', 5, 100, { free: true }); n++; }
  }
  D.counts.push(['halo', n]); H.k = V.k + 1;
}
function v2HaloEnd(g, e) { const D = V2S(e); D.halo = null; }
// ---- II-C ECLIPSE EXCHANGE: floor sigils mark two opposite quarters (solar: north-east and south-west gold; eclipse:
// north-west and south-east violet; by turns cast to cast); a 2-tile cross along the axes stays neutral. 2.0 s to walk
// out (the sigils from its start), then 6 s burning (32 straight off your Life every 0.5 s while you stand in them), then
// 1.2 s neutral. Never with Sundering Dawn or the beams.
function v2Eclipse(g, e) {
  const D = V2S(e), solar = !((D.ecount = (D.ecount || 0) + 1) % 2 === 0);
  if (g.banner) g.banner('ECLIPSE SHIFT — SEEK THE UNMARKED STONE.', 2200);
  D.ecl = { solar, from: g.t, on: g.t + 2.0, off: g.t + 8.0, end: g.t + 9.2, tick: 0 };
}
function inEclipse(e, Ec, x, y) {
  const C = MID(e), sx = C.x - x, sy = C.y - y;                // (back into the spec's frame)
  if (Math.abs(sx) < 1 || Math.abs(sy) < 1 || Math.hypot(sx, sy) > 24.5) return false;
  const ne = sx > 0 && sy < 0, sw = sx < 0 && sy > 0;
  return Ec.solar ? ne || sw : !(ne || sw);
}
function eclTick(g, e, dt) {
  const D = e.bx.v2, Ec = D && D.ecl; if (!Ec) return;
  if (g.t > Ec.end) { D.ecl = null; return; }
  const p = g.player; if (!p || p.dead || g.t < Ec.on || g.t >= Ec.off) return;
  if (inEclipse(e, Ec, p.x, p.y)) { if ((Ec.tick -= dt) <= 0) { if (Ec.tick > -0.4) { Ec.tick = 0.5; g.hurtPlayer(32, Ec.solar ? 'the solar floor' : 'the eclipse', true); } else Ec.tick = 0.25; } }   // (on entering, a breath first: never two in a frame)
  else Ec.tick = -1;
}
// ---- II-D SUNDERING DAWN: a wall of comets forms along the south edge (the spec's y = -19, its 17 lanes the spec's
// spacing drawn in to the round floor), three in a row missing (7-9); 1.25 s, then it marches across at 3.4 t/s, every
// comet drifting sideways together at 0.8 t/s so the gap moves (125). 2.6 s after it sets off the second forms, its own
// 1.25 s, gap 4-6, drifting the other way. Cooldown 12 s after both are spent.
const DAWN_X = (i) => (-20 + i * 2.5) * 0.8;
function v2Dawn(g, e) {
  const D = V2S(e), dir = seeded(D) < 0.5 ? 1 : -1;
  D.dawn = { waves: [{ omit: [7, 8, 9], from: g.t, at: g.t + 1.25, dir }, { omit: [4, 5, 6], from: g.t + 1.25 + 2.6 - 1.25, at: g.t + 1.25 + 2.6, dir: -dir }] };
  later(e, 1.25, 'v2DawnFire', { k: 0 }); later(e, 1.25 + 2.6, 'v2DawnFire', { k: 1 });
}
function v2DawnFire(g, e, V) {
  const D = V2S(e), W0 = D.dawn && D.dawn.waves[V.k]; if (!W0) return; let n = 0;
  const vx = 0.8 * W0.dir, vy = 3.4, sp = Math.hypot(vx, vy), pl = g.player;
  for (let i = 0; i < 17; i++) {
    if (W0.omit.includes(i)) continue;
    const w = SP(e, DAWN_X(i), -19); if (pl && !pl.dead && Math.hypot(pl.x - w.x, pl.y - w.y) < 1.2) continue;
    const a = Math.atan2(-vy, -vx);                           // (the spec's +Y, south, is north here; its +X west)
    fire2(g, e, w.x, w.y, a, 'comet', sp, 125, { free: true, phase: true, range: (39 / 3.4) * sp }); n++;
  }
  W0.done = true; D.counts.push(['dawn', n]); if (V.k === 1) D.dawnEnd = g.t + 39 / 3.4;
}
// ---- II-E STOLEN HOUR: four black-gold stars at the diagonals (±11, ±11), 0.95 s, then 5.5 s still; by turns clockwise
// every 0.55 s, each brightening 0.35 s first, a Fan(5, 48°) of eclipse crescents at you (5 t/s, 105). They are sources,
// not bodies. Cooldown 13 s.
function v2Hour(g, e) {
  const D = V2S(e); D.hour = { from: g.t, at: g.t + 0.95, until: g.t + 0.95 + 5.5, stars: [[11, -11], [11, 11], [-11, 11], [-11, -11]].map(([sx, sy]) => SP(e, sx, sy)), k: 0, lit: -1 };   // (the spec's NE, SE, SW, NW: clockwise)
  for (let k = 0; k < 10; k++) { later(e, 0.95 + k * 0.55 - 0.35, 'v2HourLit', { k }); later(e, 0.95 + k * 0.55, 'v2HourFire', { k }); }
}
function v2HourLit(g, e, V) { const D = V2S(e); if (D.hour) D.hour.lit = V.k % 4; }
function v2HourFire(g, e, V) { const D = V2S(e), H = D.hour; if (!H) return; const st = H.stars[V.k % 4], b = bearing(g, e, st.x, st.y); for (const a of fan(b, 5, deg(48))) fire2(g, e, st.x, st.y, a, 'eclipse', 5, 105, { free: true }); D.counts.push(['hour', 5]); H.lit = -1; if (V.k === 9) D.hourEnd = g.t + 0.4; }
function hourTick(g, e) { const D = e.bx.v2; if (D && D.hour && g.t > D.hour.until + 0.5) D.hour = null; if (D && D.dawn && D.dawnEnd && g.t > D.dawnEnd) { D.dawn = null; D.dawnEnd = 0; } }

const P2 = {
  sunseed: { id: 'sunseed_summoning', name: 'Sunseed Summoning', start: (g, e) => { v2Sunseed(g, e); later(e, 1.5, 'v2Combo', { k: 'rebuke' }); }, total: 1.5 + P1.rebuke.total, cd: 0, support: true },   // (with Crown's Rebuke; its cooldown runs from the suns' end)
  halo: { id: 'halo_fracture', name: 'Halo Fracture', start: v2Halo, total: 0.75 + 1.5 + 0.7, cd: 8 },
  eclipse: { id: 'eclipse_exchange', name: 'Eclipse Exchange', start: (g, e) => { v2Eclipse(g, e); later(e, 2.4, 'v2Combo', { k: 'sundial' }); }, total: 9.2, cd: 0 },   // (with Royal Sundial, its gaps radial)
  hour: { id: 'stolen_hour', name: 'Stolen Hour', start: v2Hour, total: 0.95 + 5.5 + 0.8, cd: 13 },
  dawn: { id: 'sundering_dawn', name: 'Sundering Dawn', start: v2Dawn, total: 1.25 + 2.6 + 4.5 + 1.2, cd: 12 + 7 },   // (alone, then a breath; its cooldown 12 s from the second wall's end, ~7 s after it sets off)
};
function v2Combo(g, e, V) { const A0 = P1[V.k]; A0.start(g, e); const D = V2S(e); D.log.push([A0.id, +g.t.toFixed(2)]); }
const SEQ2 = ['sunseed', 'halo', 'eclipse', 'hour', 'dawn'];
const table = (P) => Object.fromEntries(Object.values(P).map((A0) => [A0.id, { name: A0.name, total_s: +A0.total.toFixed(2), cooldown_s: A0.cd }]));
export const ATTACKS_V2 = { 1: { order: SEQ1, attacks: table(P1) }, 2: { order: SEQ2, attacks: table(P2) } };   // (the spec's 16.4: the implemented table, machine-readable)
function choose2(g, e) {
  const D = V2S(e); D.log = D.log || [];
  if (g.t < D.busyUntil || g.t < (D.stag || 0)) return null;
  const k = SEQ2[D.i % SEQ2.length], A0 = P2[k];
  if (g.t < (D.ready[k] || 0) || g.t < D.lastEnd + GAP) return null;
  if (k === 'sunseed' && D.suns) return null;
  if (k === 'dawn' && D.suns) return null;                   // (never Sundering Dawn while a lesser sun lives)
  if (k === 'eclipse' && D.ecl) return null;
  D.i++; if (D.i % SEQ2.length === 0) { D.cycle = (D.cycle || 0) + 1; D.rot = ROTS[Math.floor(seeded(D) * 4)]; }
  D.busyUntil = g.t + A0.total; D.lastEnd = D.busyUntil; if (A0.cd) D.ready[k] = D.busyUntil + A0.cd; if (k === 'eclipse') D.ready.eclipse = g.t + 9.2 + 1.2;
  D.log.push([A0.id, +g.t.toFixed(2)]);
  A0.start(g, e);
  return { name: A0.name, special: 'v2Nop', windup: 0.45, recover: 0.3 };
}
function v2Ground2(r, g, e) {
  const D = e.bx.v2; if (!D) return; const b = r.b;
  const [o0x] = r.proj(0, 0), [o1x] = r.proj(1, 0), ts = Math.max(4, Math.round(Math.abs(o1x - o0x)));
  const Ec = D.ecl;
  if (Ec) {                                                  // the eclipse floor: its sigils (a sun's dot, or violet hatching: never colour alone), pulsing while it's a warning
    const C = MID(e), warn = g.t < Ec.on, end = g.t >= Ec.off, a0 = end ? 0.08 : warn ? 0.12 + 0.12 * Math.sin(g.t * 10) : 0.3;
    for (let ty = Math.floor(C.y - 24); ty <= C.y + 24; ty++) for (let tx = Math.floor(C.x - 24); tx <= C.x + 24; tx++) {
      if (!inEclipse(e, Ec, tx + 0.5, ty + 0.5)) continue;
      const [x, y] = r.proj(tx + 0.5, ty + 0.5);
      b.globalAlpha = a0; b.fillStyle = Ec.solar ? '#ffb030' : '#6a2ab0'; b.fillRect(Math.round(x - ts / 2), Math.round(y - ts / 2), ts, ts);
      b.globalAlpha = Math.min(1, a0 + 0.3); b.fillStyle = Ec.solar ? '#fff0a0' : '#2a1040';
      if (Ec.solar) b.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); else for (let i = 0; i < ts; i += 4) b.fillRect(Math.round(x - ts / 2 + i), Math.round(y - ts / 2 + i), 2, 1);
    }
  }
  const Dw = D.dawn;
  if (Dw) for (const W0 of Dw.waves) {                       // the dawn's wall forming: a gold mark at every lane that will fire, nothing in its gap
    if (W0.done || g.t < W0.from) continue;
    for (let i = 0; i < 17; i++) { const w = SP(e, DAWN_X(i), -19), om = W0.omit.includes(i), [x, y] = r.proj(w.x, w.y); b.globalAlpha = om ? 0.35 : 0.6 + 0.4 * Math.sin(g.t * 14); b.fillStyle = om ? '#3a2410' : '#fff0a0'; b.fillRect(Math.round(x) - 2, Math.round(y) - 2, om ? 2 : 5, om ? 2 : 5); }
    const [ax, ay] = r.proj(SP(e, DAWN_X(0), -19).x, SP(e, 0, -19).y), [bx2] = r.proj(SP(e, DAWN_X(16), -19).x, 0); b.globalAlpha = 0.5; b.fillStyle = '#ffd650';   // (an arrow-mark of its drift)
    const mx = (ax + bx2) / 2 + W0.dir * -18; for (let k = 0; k < 4; k++) b.fillRect(Math.round(mx + W0.dir * -k * 4), Math.round(ay) - 8 + (k % 2), 3, 1);
  }
  b.globalAlpha = 1;
}
function v2Air2(r, g, e, put, get) {
  const D = e.bx.v2; if (!D) return;
  const sun = get('sol_shots/sun'), black = get('sol_shots/blacksun'), shard = get('sol2/halo');
  const bar = (q) => { if (q.dead || q.hp >= q.maxHp) return; const [sx, sy] = r.proj(q.x, q.y); r.hpBar(sx, sy + 3, q.hp / q.maxHp, 14); };
  const Z = D.suns;
  if (Z && sun) for (const s of Z.list) {                    // the lesser suns: rising from the pedestal along their trails, then burning where they stop; brighter in their pulse
    if (gone(s.q)) continue; const k = Math.min(1, (g.t - Z.born) / 1.2), x = s.x0 + (s.q.x - s.x0) * k, y = s.y0 + (s.q.y - s.y0) * k;
    put(sun, x, y + 1.4 + Math.sin(k * Math.PI) * 1.5, { scale: (0.6 + 0.6 * k) * (g.t - s.pulse < 0.3 ? 1.25 : 1) });
    if (k >= 1) bar(s.q);
  }
  const H = D.halo;
  if (H && shard) for (let i = 0; i < 4; i++) { const k = Math.min(3, H.k || 0), a = shardAt(H, k, i), dark = k === 1 && Math.abs(Math.atan2(Math.sin(a - H.dark), Math.cos(a - H.dark))) < deg(35); put(shard, H.cx + Math.cos(a) * 4, H.cy + Math.sin(a) * 4 + 1.2, { rot: a, scale: 1.6, alpha: dark ? 0.3 : Math.min(1, (g.t - H.from) / 0.75) }); }
  const Hr = D.hour;
  if (Hr && black) Hr.stars.forEach((st, i) => put(black, st.x, st.y + 1.4, { scale: (Math.min(1, (g.t - Hr.from) / 0.95)) * (Hr.lit === i ? 1.45 : 1.05), alpha: Hr.lit === i ? 1 : 0.8 }));
}


function v2Ground(r, g, e) {
  const D = e.bx.v2; if (!D) return; const b = r.b;
  const [o0x] = r.proj(0, 0), [o1x] = r.proj(1, 0), ts = Math.max(4, Math.abs(o1x - o0x));
  const dot = (x, y, c, a, sz = 2) => { const [sx, sy] = r.proj(x, y); b.globalAlpha = a; b.fillStyle = c; b.fillRect(Math.round(sx) - (sz >> 1), Math.round(sy) - (sz >> 1), sz, sz); };
  if (D.dial) for (const R0 of D.dial.rings) {                // the sundial's 12 points; its dark sector dim (a safe sector, dim/off)
    if (R0.done) continue; const k = Math.min(1, (g.t - R0.from) / 0.3);
    for (let i = 0; i < 12; i++) { const a = R0.a0 + (i / 12) * TAU, x = D.dial.cx + Math.cos(a) * 3, y = D.dial.cy + Math.sin(a) * 3, dark = R0.gap.includes(i) && g.t > R0.from + 0.25; dot(x, y, dark ? '#4a2a10' : '#ffe680', dark ? 0.5 : k, dark ? 2 : 4); }
  }
  if (D.pinc) {                                             // the pincer's source lines, a bright mark at each slot that will fire, none where the gap is
    const P0 = D.pinc, nxt = P0.at.findIndex((t) => g.t < t); if (nxt < 0 && g.t > P0.at[1] + 0.3) D.pinc = null;
    else if (nxt >= 0) for (const side of [-1, 1]) pincSlots(e).forEach(([sx, sy], i) => { const w = SP(e, side * sx, sy), om = P0.sets[nxt].includes(i); dot(w.x, w.y, om ? '#3a2410' : '#ffb030', om ? 0.4 : 0.6 + 0.4 * Math.sin(g.t * 14), om ? 2 : 4); });
  }
  for (const B of D.beams) {                                // the verdict's pillars: gold floor lines while they're coming, the light itself while they burn
    if (g.t < B.show) continue; const on = g.t >= B.on && g.t < B.off, [ax, ay] = r.proj(B.x0, B.y0), [bx, by] = r.proj(B.x1, B.y1), wpx = B.w * 2 * ts;
    b.save(); b.lineCap = 'butt';
    if (on) { b.globalAlpha = 0.85; b.strokeStyle = '#ffd650'; b.lineWidth = wpx; b.beginPath(); b.moveTo(ax, ay); b.lineTo(bx, by); b.stroke(); b.strokeStyle = '#ffffff'; b.lineWidth = Math.max(2, wpx * 0.35); b.beginPath(); b.moveTo(ax, ay); b.lineTo(bx, by); b.stroke(); }
    else if (g.t < B.on) { const k = (g.t - B.show) / Math.max(0.01, B.on - B.show); b.globalAlpha = 0.18 + 0.2 * k; b.fillStyle = '#ffb030'; b.strokeStyle = '#ffd650'; b.lineWidth = wpx; b.beginPath(); b.moveTo(ax, ay); b.lineTo(bx, by); b.stroke(); b.globalAlpha = 0.9; b.lineWidth = 1; b.setLineDash([5, 4]); const nx = (by - ay), ny = -(bx - ax), L = Math.hypot(nx, ny) || 1, ox = (nx / L) * wpx / 2, oy = (ny / L) * wpx / 2; for (const s2 of [-1, 1]) { b.beginPath(); b.moveTo(ax + ox * s2, ay + oy * s2); b.lineTo(bx + ox * s2, by + oy * s2); b.stroke(); } }
    b.restore();
  }
  b.globalAlpha = 1;
}
function choose(g, e) {
  const S = e.bx;
  if (S.phase === 1) return choose1(g, e);                  // (Phase I: the audited spec's)
  if (S.phase === 2) return choose2(g, e);                  // (Phase II: the audited spec's)
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
  r: 2.2, speed: 2, keep: 5, faces: false, spawnCentre: true, tempo: 1, dmgScale: 1, thresholds: [0.75, 0.5], choose,   // (Phases I and II to the spec's 75% and 50%; the older III after them until III and IV are built)
  finale: FINALE,                                           // (at 1 Life: Stealing Back the Sun, his true end)
  dmgMult: (g, e) => (e.bx.v2 && e.bx.v2.stag > g.t ? 1.2 : e.bx.slStagger > g.t ? 1.3 : 1),   // (the spec's II stagger: +20%)     // (staggered: his lenses or his lesser suns broken; open to you)
  walkPace: 2.5, charging: (g, e) => !!(e.slDash && g.t >= e.slDash.at),   // (his glide at his pace; his dashes)
  death: { hold: 1 },                                      // (4 s in all, the spec's: the 3 s clip, then held while the sun goes out)
  phases: {
    1: { move: 'home', pressure: [], patterns: Object.values(AT) },   // (no filler: the spec's named attacks only)
    2: { move: 'home', pressure: [], patterns: Object.values(AT) },   // (the spec's II: no filler)
    3: { move: 'hunt', pressure: [{ every: 1.2, special: 'solarVolley', delay: 1.5 }], patterns: Object.values(AT) },
  },
  specials: { v2Nop, v2Combo, v2HaloFire, v2HaloEnd, v2DawnFire, v2HourLit, v2HourFire, v2DialForm, v2DialFly, v2RebukeAim, v2RebukeFire, v2PincFire, v2VerdictEnd, solarVolley, sundial, sundialShow, sundialForm, sundialFly, corona, coronaGo, judgment, noonMark, noonDots, heralds, haloKnives, knifeFan, knifeWarn, knifeLances,
    blackClock, pursuit, dashMark, dashLock, lenses, lensFans, lensEnd, vise, viseGo, blackReturn, returnIn, returnHold, returnOut, heavens, heavenMark, heavenDots, chase,
    lastLight, lastRing, lastCorridor, lastPortals, lastBeams, lastFlash, lastClear, lastFragments, lesserSuns },
  moves: {
    home(g, e, dt) {                                        // I: he keeps near the spec's (0, -5), a slow sway about it
      const H = SP(e, Math.sin(g.t * 0.5) * 1.5, -5), d = Math.hypot(H.x - e.x, H.y - e.y);
      if (d > 0.1) g.moveCircle(e, ((H.x - e.x) / d) * Math.min(d, 2 * dt), ((H.y - e.y) / d) * Math.min(d, 2 * dt), 0.8);
    },
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
  onWake(g, e) {                                           // the spec's intro: 3 s locked in, open to harm after 2 s, nothing hurts during it
    if (g.banner) g.banner('SOLKHAR: YOU HAVE COME TO WATCH THE SUN DIE.', 3000);
    e.bx.wait = 3.0; e.invulnT = 2.0;
  },
  onPhase(g, e, ph) {
    const S = e.bx; S.v2 = null;                            // (the old phase's every timeline, beam and mark gone with it) S.slSpears = S.slCorona = S.slHalo = S.slVise = S.slChase = S.slHeralds = S.slBlack = S.slLens = S.slSuns = null; e.slDash = null;
    for (const q of S.slMinions || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.wait = ph === 2 ? 1.5 : 1.8;
    if (ph === 2) { if (g.banner) g.banner('THE LIGHT IS NOT YOURS.', 2800); g.vx({ k: 'shake', amt: 4 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 40, colors: SUNC }); g.sfx('shatter'); S.slLaw = null; if (g.map) g.map.ambBoss = [26, 12, 20, 0.45]; }   // (the chains snap; his sanctum darkens, eased, never black)
    if (ph === 3) { if (g.banner) g.banner('THE SUNTHIEF UNBOUND', 2800); g.vx({ k: 'shake', amt: 12 }); g.vx({ k: 'burst', x: e.x, y: e.y - 3, n: 60, colors: [...SUNC, '#ff3a1a'] }); g.sfx('roar'); if (g.map) g.map.ambBoss = [12, 3, 8, 0.66]; }   // (his sanctum darker: src/castle.js eases into it)
  },
  update(g, e, dt) {
    const S = e.bx;
    if (S.state === 'sleep' || S.state === 'intro') return;
    const Dh = e.slDash;                                    // a dash: once into you (205); spears after it when it's the Pursuit's
    if (Dh && g.t >= Dh.at) {
      if (g.t >= Dh.until) { e.slDash = null; if (Dh.trail) { const [ox, oy] = FEET(g, e), a = bearing(g, e, ox, oy); for (let k = 0; k < 5; k++) shot(g, e, ox, oy, a + (k / 4 - 0.5) * deg(40), { ...DOT, speed: 6.3, range: 16, dmg: D(115) }); } }
      else { const k = (g.t - Dh.at) / (Dh.until - Dh.at); e.x = Dh.x0 + (Dh.x1 - Dh.x0) * k; e.y = Dh.y0 + (Dh.y1 - Dh.y0) * k; const p = g.player; if (!Dh.hit && p && !p.dead && Math.hypot(p.x - e.x, p.y - e.y) < e.D.r + 0.4) { Dh.hit = true; g.hurtPlayer(g.bxDmg(e, D(215)), e.D.name); } }
    }
    const Ch = S.slChase;                                   // the Chase: the core's spears every 0.75 s
    if (Ch && g.t > Ch.from && g.t < Ch.until && (Ch.t -= dt) <= 0) { Ch.t = 0.75; const [ox, oy] = FEET(g, e), a = bearing(g, e, ox, oy); for (let k = 0; k < 4; k++) shot(g, e, ox, oy, a + (k / 3 - 0.5) * deg(35), { ...DOT, speed: 6.6, range: 16, dmg: D(120) }); }
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
    beamTick(g, e); sunsTick2(g, e); eclTick(g, e, dt); hourTick(g, e);
    sunsTick(g, e, dt);
    for (const q of S.slMinions || []) if (!q.dead && g.t > q.slUntil) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    S.slMinions = (S.slMinions || []).filter((q) => !q.dead);
    if (S.phase >= 3 && S.state !== 'morph') eclipseTick(g, e, dt);   // (the older Eclipse Law: the older Phase III only)
    if (S.slSpears && g.t > S.slSpears.until + 0.8) S.slSpears = null;
    if (S.slHalo && g.t > S.slHalo.until) S.slHalo = null;
    if (S.slCorona && g.t > S.slCorona.until) S.slCorona = null;
  },
  onDeath(g, e) {                                          // every portal stops; the core lifts, implodes; the crown and halo burn away; the eclipse turns to sunrise
    const S = e.bx; S.slSpears = S.slCorona = S.slHalo = S.slVise = S.slChase = S.slHeralds = S.slBlack = S.slLens = S.slLaw = S.slSuns = S.slFin = null; e.slDash = null;
    for (const q of S.slMinions || []) if (!q.dead) { q.noLoot = true; q.dead = true; q.deadT = 0; }
    g.vx({ k: 'shake', amt: 14 }); if (g.banner) g.banner('DAWN RETURNS.', 3600);
    g.fx.push({ kind: 'sunrise', t: 0, life: 6 });
    if (g.map) g.map.ambBoss = [60, 40, 10, 0.14];               // (the sun given back: his sanctum lit)
  },
  // the dais's marks: the Eclipse Law's quarters (gold-outlined suns, violet hatching), the corona's rings shown, the vise's path ahead
  drawGround(r, g, e) {
    v2Ground(r, g, e); v2Ground2(r, g, e);
    const S = e.bx, b = r.b, C = MID(e), R0 = RAD(e), L = S.slLaw;
    const Fn = S.slFin;
    if (Fn) {                                               // the sanctuary's lights: lit (gold, a bright rim), coming (a pulsing outline), fading
      const T = S.finT || 0;
      for (const Q of Fn.lights) {
        if (T < Q.from - 1.5 || T > Q.to + 0.4) continue;
        const [x, y] = r.proj(Q.x, Q.y), [x1] = r.proj(Q.x + 1, Q.y), ts = Math.abs(x1 - x) || 16, R = lightR(Q, Math.min(T, Q.to)) * ts, on = T >= Q.from && T < Q.to;
        const fade = T >= Q.to ? 1 - (T - Q.to) / 0.4 : T > Q.to - 1.2 ? 0.55 + 0.45 * Math.abs(Math.sin(T * 9)) : 1;
        b.save();
        if (on) { b.globalAlpha = 0.22 * fade; b.fillStyle = '#ffd650'; b.beginPath(); b.ellipse(Math.round(x), Math.round(y), R, R, 0, 0, TAU); b.fill(); }
        b.globalAlpha = on ? 0.9 * fade : 0.35 + 0.35 * Math.abs(Math.sin(T * 6)); b.strokeStyle = on ? '#fff6c8' : '#ffd650'; b.lineWidth = on ? 3 : 2;
        if (!on) b.setLineDash([6, 5]);
        b.beginPath(); b.ellipse(Math.round(x), Math.round(y), R, R, 0, 0, TAU); b.stroke(); b.restore();
      }
    }
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
    const spear = get('sol_shots/sunlance'), blade = get('sol_shots/halo'), sun = get('sol_shots/sun'), black = get('sol_shots/blacksun'), frag = get('sol_shots/fragment');
    const put = (def, x, y, o) => { if (def) { const [sx, sy] = r.proj(x, y); r.drawDef(def, Object.keys(def.frames)[0], Math.round(sx), Math.round(sy) - 24, { center: true, ...o }); } };
    v2Air2(r, g, e, put, get);
    const Q = S.slSpears;
    if (Q) for (let i = 0; i < Q.n; i++) { const a = sundialAngle(Q, g, i), dk = Q.dark.includes(i) && g.t >= Q.darkAt; put(spear, Q.cx + Math.cos(a) * Q.r, Q.cy + Math.sin(a) * Q.r, { rot: a, alpha: dk ? 0.25 : 1 }); }
    const H = S.slHalo;
    if (H) for (let k = 0; k < 6; k++) { const a = haloAt(H, g.t, k); put(blade, H.cx + Math.cos(a) * H.r, H.cy + Math.sin(a) * H.r, { rot: a }); }
    const bar = (q) => { if (q.dead || q.hp >= q.maxHp) return; const [sx, sy] = r.proj(q.x, q.y); r.hpBar(sx, sy + 3, q.hp / q.maxHp, 14); };
    if (S.slHeralds) for (const [i, q] of S.slHeralds.ps.entries()) if (!gone(q)) { const on = g.t > S.slHeralds.from && ((S.slHeralds.pair ? [1, 3] : [0, 2]).includes(i)); put(sun, q.x, q.y + 1.4, { scale: on ? 1.1 + 0.1 * Math.sin(g.t * 10) : 0.8, alpha: on ? 1 : 0.6 }); bar(q); }
    if (S.slBlack) S.slBlack.ps.forEach((q, k) => { if (gone(q)) return; put(black, q.x, q.y + 1.4, { scale: g.t - (S.slBlack.flash[k] || -9) < 0.25 ? 1.3 : 1 }); bar(q); });
    if (S.slLens) for (const q of S.slLens.ps) if (!gone(q)) { put(frag, q.x, q.y + 1.2, { scale: 1.4, rot: g.t }); bar(q); }
    const Z = S.slSuns;                                     // the lesser suns: a spark from his chest, swelling where it lands, then burning there
    if (Z && sun) for (const s of Z.list) {
      if (gone(s.q) || g.t < s.born) continue;
      const k = (g.t - s.born) / 0.5;
      if (k < 1) { const [cx, cy] = CORE(g, e), x = cx + (s.q.x - cx) * k, y = cy + (s.q.y - cy) * k - Math.sin(k * Math.PI) * 2; put(get('sol_shots/fireball'), x, y + 1.5, { scale: 1.4, rot: Math.atan2(s.q.y - cy, s.q.x - cx) }); continue; }
      const grow = Math.min(1, (g.t - s.born - 0.5) / 0.5), [sx, sy] = r.proj(s.q.x, s.q.y);
      r.drawDef(sun, Object.keys(sun.frames)[0], Math.round(sx), Math.round(sy), { center: true, scale: (0.3 + 1.3 * grow) * (1 + 0.06 * Math.sin(g.t * 9 + s.i)) });
      if (grow >= 1) bar(s.q);
    }
    const Fn = S.slFin;
    if (Fn && sun) {                                        // the stolen sun: torn from his chest, then over each light it makes
      const T = S.finT || 0, act = Fn.lights.filter((Q) => T >= Q.from && T < Q.to);
      if (T < 2.5) { const k = T / 2.5, C = MID(e), [fx, fy] = Fn.sunFrom, [sx, sy] = r.proj(fx + (C.x - fx) * k, fy + (C.y - fy) * k); r.drawDef(sun, Object.keys(sun.frames)[0], Math.round(sx), Math.round(sy) - 40 * (1 - k) - 30, { center: true, scale: 1.5 + 1.5 * k }); }
      else for (const Q of act) { const [sx, sy] = r.proj(Q.x, Q.y); r.drawDef(sun, Object.keys(sun.frames)[0], Math.round(sx), Math.round(sy) - 30 + Math.sin(g.t * 2) * 2, { center: true, scale: 1.2 + lightR(Q, T) * 0.4 }); }
      for (const i of [0, 1]) if (T > 12) { const C = MID(e), R0 = RAD(e) - 0.5, a = T * 0.35 + i * Math.PI; put(black, C.x + Math.cos(a) * R0, C.y + Math.sin(a) * R0 + 1.5, { scale: 1.4 + 0.1 * Math.sin(g.t * 8) }); }   // (the void portals)
    }
    if (S.slObelisks && g.t - S.slObelisks < 14) OBELISKS(e).forEach((o, k) => { if (g.t - S.slObelisks > k * 0.2) put(sun, o.x, o.y + 1.4, { scale: 0.9, alpha: 0.8 }); });
  },
  lights(g, e) {
    const S = e.bx, ph = S.phase || 1, F = S.slFin, out = [];
    if (F) { const T = S.finT || 0; for (const Q of F.lights) if (T >= Q.from - 0.3 && T < Q.to) out.push({ x: Q.x, y: Q.y, h: 0.5, r: lightR(Q, T) * 16 + 12, col: '#ffd650', fire: true }); return out; }   // (the sanctuary's light; he is dark)
    out.push({ x: e.x, y: e.y, h: 4.2, r: ph === 3 ? 140 : 110, col: '#ffd650', fire: true });
    if (S.slSuns) for (const s of S.slSuns.list) if (!gone(s.q) && g.t > s.born + 0.5) out.push({ x: s.q.x, y: s.q.y, h: 0.3, r: 40, col: '#ffb030', fire: true });
    return out;
  },
  get loot() { return DUNGEON_BOSSES.the_unstruck_god.loot; },
  lootLuck: 2,
};
