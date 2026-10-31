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
import { TAU, R, angleTo, players, target, ring, fan, mark, running, ahead, heading } from './kit.js';

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
// The Monologue (reworked 2026-10-31, the user: "Emily no longer does anything for the survival ... It should be hard
// with many shots and dodging"; it was one slow three-armed spiral). Fourteen seconds of her talking at you:
//   the yap spiral, four arms, turning back the other way each time she changes the subject;
//   every line she says bursts out of her as a ring of yaps with a gap in it;
//   snowball fans, at you and then at where you're going;
//   and she cuts you off: a belly-slide marked across your path.
const finale = {
  at: 0.1, dur: 14, name: 'The Monologue', say: '', after: 1.2,
  start(g, e) { e.emMonoT = 0; e.emDir = 1; e.emSubjT = 3.5; e.emLineT = 0.6; e.emSnowT = 1.2; e.emCutT = 2.2; e.emSnowN = 0; },
  update(g, e, dt, T) {
    const [ox, oy] = g.bxOrigin(e), L = BOSS_SPEECH.emily_the_yapper || ['And THEN-'];
    if ((e.emSubjT -= dt) <= 0) { e.emSubjT = 3.5; e.emDir = -e.emDir; say(g, e, R() < 0.5 ? 'ANYWAY, that reminds me-' : 'Oh! And another thing-'); }
    if ((e.emMonoT -= dt) <= 0) { e.emMonoT = 0.15; e.emSpin = (e.emSpin || 0) + e.emDir * 0.25; for (let i = 0; i < 4; i++) g.bxShot(e, ox, oy, e.emSpin + (i * TAU) / 4, { shot: 'yap', speed: 3.8, range: 12, dmg: 30 }); }
    if ((e.emLineT -= dt) <= 0) {                           // a line, and the words burst out of her
      e.emLineT = 1.8; say(g, e, L[Math.floor(R() * L.length)]);
      const gap = R() * TAU, n = 18;
      for (let k = 0; k < n; k++) { const a = gap + 0.55 + (k / n) * (TAU - 1.1); g.bxShot(e, ox, oy, a, { shot: 'yap', speed: 5.2, range: 13, dmg: 32 }); }
    }
    if ((e.emSnowT -= dt) <= 0) {                           // snowballs at you, then where you're going
      e.emSnowT = 1.4; const q = target(g, e), [lx, ly] = (e.emSnowN++ % 2) ? ahead(g, e, 0.5) : [q.x, q.y];
      fan(g, e, ox, oy, angleTo(ox, oy, lx, ly), 5, 0.7, { shot: 'snowball', speed: 7, range: 12, dmg: 34 });
    }
    if ((e.emCutT -= dt) <= 0) {                            // and she cuts you off: a slide marked across your path
      e.emCutT = 2.6; const q = target(g, e), [hx, hy] = running(e) ? heading(e) : [Math.cos(R() * TAU), Math.sin(R() * TAU)], a = Math.atan2(hx, -hy), Ln = 8, d = 0.8;
      const [x, y] = running(e) ? ahead(g, e, 0.8) : [q.x, q.y];
      g.fx.push({ kind: 'lane', x: x - Math.cos(a) * Ln / 2, y: y - Math.sin(a) * Ln / 2, a, len: Ln, w: 1, delay: d, t: 0, life: d + 0.6, dmg: g.bxDmg(e, 60), by: e.D.name, hitT: 0, cols: SNOW });
    }
    void T;
  },
};
// what she says goes in a speech bubble over her head, like a player's line (never across the top of your screen)
function say(g, e, text, col = '#ffffff') { if (g.bubble) g.bubble(e, text, col); }

// against a steady circle (check_boss_safespots, 2026-10-27): only when you run, at where you are running to
function interrupt(g, e, V) {                             // "Wait wait WAIT-": she cuts you off, a belly-slide across where you are running to
  if (!running(e)) return;
  const [x, y] = ahead(g, e, 1.0), [hx, hy] = heading(e), a = Math.atan2(hx, -hy), L = 7, d = 0.75;   // (across your path)
  g.fx.push({ kind: 'lane', x: x - Math.cos(a) * L / 2, y: y - Math.sin(a) * L / 2, a, len: L, w: 1, delay: d, t: 0, life: d + 0.6, dmg: g.bxDmg(e, V.dmg || 60), by: e.D.name, hitT: 0, cols: SNOW });
  if (R() < 0.4) say(g, e, 'Wait wait WAIT-');
}

export default {
  id: 'emily_the_yapper', art: 'emily_the_yapper', shotSheet: 'last_shots', name: 'Emily, the Yapper', biome: 'runeholt', hp: 80000, def: 14, xp: 3600,
  // dmgScale was 1.6: her biggest blow took 43% (after every enemy began to hit 1.5x, 2026-10-22: tools/bench_boss_hits.mjs)
  dmgScale: 2.1, r: 1.5, speed: 0.8, keep: 5, faces: true, tempo: 1, finale, talks: true,   // (was 1.3: a maxed character tanked her, every small shot eaten by Defense. 2026-10-29: MAXED=1 tools/bench_boss_hits.mjs)
  phases: {
    1: { move: 'pace', pressure: [{ every: 3.6, special: 'interrupt', delay: 2.9, dmg: 60 }], patterns: [
      { name: 'snowballs', windup: 0.5, recover: 0.6, special: 'snowballs', waves: 3, dmg: 34 },
      { name: 'a belly-slide', windup: 0.5, recover: 0.8, special: 'slide', dmg: 60 },
      { name: 'fish!', windup: 0.6, recover: 0.7, special: 'fish', n: 3, dmg: 44 },
    ] },
    2: { move: 'pace', pressure: [{ every: 3.2, special: 'interrupt', delay: 2.6, dmg: 60 }], patterns: [
      { name: 'yap yap yap', windup: 0.5, recover: 0.6, special: 'yapring', rings: 2, dmg: 32 },
      { name: 'a belly-slide', windup: 0.4, recover: 0.7, special: 'slide', dmg: 62 },
      { name: 'snowballs', windup: 0.4, recover: 0.6, special: 'snowballs', waves: 4, dmg: 34 },
      { name: 'fish!', windup: 0.5, recover: 0.6, special: 'fish', n: 4, dmg: 44 },
    ] },
    3: { move: 'pace', pressure: [{ every: 2.8, special: 'interrupt', delay: 2.2, dmg: 60 }], patterns: [
      { name: 'yap yap yap', windup: 0.4, recover: 0.5, special: 'yapring', rings: 3, dmg: 34 },
      { name: 'a belly-slide', windup: 0.4, recover: 0.6, special: 'slide', dmg: 64 },
      { name: 'snowballs', windup: 0.3, recover: 0.5, special: 'snowballs', waves: 4, dmg: 36 },
      { name: 'fish!', windup: 0.4, recover: 0.5, special: 'fish', n: 4, dmg: 46 },
    ] },
  },
  specials: { snowballs, snowFan, slide, fish, yapring, yapRing, interrupt },
  // she talks (talks: the framework's announcements go in her bubble, as her own words)
  say(g, e, text) {
    const S = e.bx, W = { 'EMILY, THE YAPPER': 'Oh! Hi! Okay so ANYWAY-', 'THE MONOLOGUE': 'Okay. Okay. Let me START from the beginning.' };
    const line = W[text] || (/BROKEN/.test(text) ? '...wait, what was I saying?' : S && S.phase === 2 ? 'I have SO much to tell you.' : S && S.phase === 3 ? 'No no no, let me FINISH.' : null);
    if (line) say(g, e, line);
  },
  onWake(g, e) { if (e) say(g, e, 'Oh! Hi! Okay so ANYWAY-'); },
  update(g, e, dt) {
    const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return;
    // she talks, then gasps for breath: talking longer and breathing shorter as she goes
    const talk = S.phase === 1 ? 5 : S.phase === 2 ? 6 : 7.5, breath = S.phase === 1 ? 2 : S.phase === 2 ? 1.6 : 1.2;
    if ((e.emBreathT = (e.emBreathT ?? talk) - dt) <= 0) { e.emBreathUntil = g.t + breath; e.emBreathT = talk + breath; say(g, e, '*gasp*', '#7aff9a'); }   // (her breath: hit her now, double)
    if (S.state === 'fight' && (e.emChatT = (e.emChatT ?? 2) - dt) <= 0 && !(e.emBreathUntil > g.t)) { e.emChatT = 3.2 + R() * 1.5; const L = BOSS_SPEECH.emily_the_yapper || []; if (L.length) say(g, e, L[Math.floor(R() * L.length)]); }
    const C = e.emSlide;                                    // the slide itself
    if (C && g.t >= C.at) { if (g.t >= C.until) e.emSlide = null; else { const k = (g.t - C.at) / (C.until - C.at); e.x = C.x0 + (C.x1 - C.x0) * k; e.y = C.y0 + (C.y1 - C.y0) * k; } }
  },
  // while she talks, half of every blow is lost; while she breathes, double (the engine's damage step asks dmgScale)
  hitScale(g, e) { return e.emBreathUntil > g.t ? 2 : 0.5; },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 70, col: '#e0f6ff' }]; },
  get loot() { return REALM_BOSSES.emily_the_yapper.loot; },
  lootLuck: 1.3,
};
