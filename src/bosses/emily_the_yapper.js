// Emily, the Yapper: Runeholt's event boss on the boss framework (2026-10-22). A very round penguin with a great deal to
// say. "Oh! Hi! Okay so ANYWAY-" Her own mechanic:
//   She Will Not Be Interrupted - while she talks, your blows barely land (half damage); every few lines she stops for
//     breath ("*gasp*"), and for that moment she takes double. Her speech bubble says which.
//   I   Okay So Anyway             - snowballs, a belly-slide at you, fish lobbed over (marked where they land)
//   II  Emily Has a LOT to Say     - rings of yaps (the old Yap-yap-yap confusion still comes with them); shorter breaths
//   III She Will Not Be Interrupted - a tiny crown; she barely breathes
//   Last: The Monologue            - she talks for ten seconds straight: yap after yap in a turning spiral
// Art: tools/build_last_bosses.py ('bx_emily_the_yapper', shots 'last_shots/emily_the_yapper.<name>').
import { REALM_BOSSES } from '../data/enemies.js';
import { BOSS_SPEECH } from '../data/lore.js';
import { TAU, R, angleTo, players, target, ring, fan, mark } from './kit.js';

const SNOW = ['#e0f6ff', '#ffffff'];
function snowballs(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e); for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.25, V: { form: 'special', name: 'snowFan', a: angleTo(ox, oy, q.x, q.y), w, dmg: V.dmg } }); }
function snowFan(g, e, V) { const [ox, oy] = g.bxOrigin(e); fan(g, e, ox, oy, V.a + (V.w % 2) * 0.12, 5, 0.8, { shot: 'snowball', speed: 6.5, range: 11, dmg: V.dmg || 34 }); }
function slide(g, e, V) {                                  // a belly-slide straight at you, along a marked line
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y), L = Math.min(12, Math.hypot(q.x - e.x, q.y - e.y) + 3), d = V.delay || 0.8;
  g.fx.push({ kind: 'lane', x: e.x, y: e.y, a, len: L, w: 1, delay: d, t: 0, life: d + 0.6, dmg: g.bxDmg(e, V.dmg || 60), by: e.D.name, hitT: 0, cols: SNOW });
  e.emSlide = { x1: e.x + Math.cos(a) * L, y1: e.y + Math.sin(a) * L, at: g.t + d, until: g.t + d + 0.55, x0: e.x, y0: e.y };
}
function fish(g, e, V) { for (const q of players(g)) for (let k = 0; k < (V.n || 3); k++) { const a = R() * TAU, d = k ? 1.5 + R() * 2.5 : 0; mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.2, 1.1 + k * 0.15, V.dmg || 44, SNOW, 4, 'last_shots/emily_the_yapper.fish'); } }
function yapring(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let k = 0; k < (V.rings || 2); k++) e.bx.vol.push({ t: k * 0.4, V: { form: 'special', name: 'yapRing', k, dmg: V.dmg } }); }
function yapRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy, 16, { shot: 'yap', speed: 4, range: 11, dmg: V.dmg || 32 }, V.k * 0.2); }
const finale = {
  at: 0.1, dur: 10, name: 'The Monologue', say: 'she will not stop talking', after: 1.2,
  start(g, e) { e.emMonoT = 0; },
  update(g, e, dt, T) { if ((e.emMonoT -= dt) <= 0) { e.emMonoT = 0.16; const [ox, oy] = g.bxOrigin(e); for (let i = 0; i < 3; i++) g.bxShot(e, ox, oy, T * 1.7 + (i * TAU) / 3, { shot: 'yap', speed: 3.6, range: 12, dmg: 30 }); }
    if ((e.emLineT = (e.emLineT || 0) - dt) <= 0) { e.emLineT = 1.6; const L = BOSS_SPEECH.emily_the_yapper || ['And THEN-']; g.bubble && g.bubble(e, L[Math.floor(R() * L.length)], '#ffd650'); } },
};

export default {
  id: 'emily_the_yapper', art: 'emily_the_yapper', shotSheet: 'last_shots', name: 'Emily, the Yapper', biome: 'runeholt', hp: 80000, def: 14, xp: 3600,
  dmgScale: 1.6, r: 1.5, speed: 0.8, keep: 5, faces: true, tempo: 1, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'snowballs', windup: 0.5, recover: 0.6, special: 'snowballs', waves: 3, dmg: 34 },
      { name: 'a belly-slide', windup: 0.5, recover: 0.8, special: 'slide', dmg: 60 },
      { name: 'fish!', windup: 0.6, recover: 0.7, special: 'fish', n: 3, dmg: 44 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'yap yap yap', windup: 0.5, recover: 0.6, special: 'yapring', rings: 2, dmg: 32 },
      { name: 'a belly-slide', windup: 0.4, recover: 0.7, special: 'slide', dmg: 62 },
      { name: 'snowballs', windup: 0.4, recover: 0.6, special: 'snowballs', waves: 4, dmg: 34 },
      { name: 'fish!', windup: 0.5, recover: 0.6, special: 'fish', n: 4, dmg: 44 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'yap yap yap', windup: 0.4, recover: 0.5, special: 'yapring', rings: 3, dmg: 34 },
      { name: 'a belly-slide', windup: 0.4, recover: 0.6, special: 'slide', dmg: 64 },
      { name: 'snowballs', windup: 0.3, recover: 0.5, special: 'snowballs', waves: 4, dmg: 36 },
      { name: 'fish!', windup: 0.4, recover: 0.5, special: 'fish', n: 4, dmg: 46 },
    ] },
  },
  specials: { snowballs, snowFan, slide, fish, yapring, yapRing },
  onWake(g) { g.banner('EMILY, THE YAPPER · wait for her to breathe', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('EMILY HAS A LOT TO SAY', 2400); if (ph === 3) g.banner('EMILY WILL NOT BE INTERRUPTED', 2400); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    // she talks, then gasps for breath: talking longer and breathing shorter as she goes
    const talk = S.phase === 1 ? 5 : S.phase === 2 ? 6 : 7.5, breath = S.phase === 1 ? 2 : S.phase === 2 ? 1.6 : 1.2;
    if ((e.emBreathT = (e.emBreathT ?? talk) - dt) <= 0) { e.emBreathUntil = g.t + breath; e.emBreathT = talk + breath; g.float(e.x, e.y - 3.2, '*gasp*', '#bfe8ff'); }
    const C = e.emSlide;                                    // the slide itself
    if (C && g.t >= C.at) { if (g.t >= C.until) e.emSlide = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; } }
  },
  // while she talks, half of every blow is lost; while she breathes, double (the engine's damage step asks dmgScale)
  hitScale(g, e) { return e.emBreathUntil > g.t ? 2 : 0.5; },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 70, col: '#e0f6ff' }]; },
  drawTop(r, g, e) {                                       // her bubble: talking, or catching her breath
    if (e.bx.state === 'sleep') return;
    const [x, y] = r.proj(e.x, e.y - 4.2); r.b.textAlign = 'center';
    const br = e.emBreathUntil > g.t; r.plabel(r.b, br ? 'BREATH! x2' : 'yap yap yap... (x0.5)', x, y, 16, br ? '#7aff9a' : '#e8e4f0');
  },
  get loot() { return REALM_BOSSES.emily_the_yapper.loot; },
  lootLuck: 1.3,
};
