// The Wick-Mother: the fen's realm boss on the boss framework (2026-10-22). A towering candle-woman. "Come closer,
// little moth. Burn down with me. Every wick ends in ash." Her own mechanic:
//   She Burns Down - the heat round her flame grows as she loses Life (its edge drawn on the ground): inside it you
//     burn (in your own browser). Fight her from further and further away. Her drips leave pools of wax that hold
//     your feet.
//   I   The Wick Is Lit       - flares (fans of flame), tallow drips that pool, her candle-mites
//   II  The Wick Catches      - the pyre: rings of fire marked round her, one after another, further out each time
//   III Burned to the Bone    - conflagration: a turning spiral of flame
//   Last: The Last Inch       - the wick gutters: four waves of flame roll out from her, each with gaps
// Art: tools/build_last_bosses.py ('bx_wick_mother', shots 'last_shots/wick_mother.<name>').
import { REALM_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, players, target, ring, fan, mark } from './kit.js';

const FIRE = ['#ff8a1f', '#ffd650'];
const heat = (e) => 2 + 4.5 * (1 - e.hp / e.maxHp);      // the heat's reach: 2 tiles at full Life, 6.5 near the end
function flare(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e), a = angleTo(ox, oy, q.x, q.y); for (let w = 0; w < (V.waves || 3); w++) e.bx.vol.push({ t: w * 0.3, V: { form: 'special', name: 'flareFan', a, w, dmg: V.dmg } }); }
function flareFan(g, e, V) { const [ox, oy] = g.bxOrigin(e); fan(g, e, ox, oy, V.a + (V.w % 2 ? 0.08 : -0.08), 7, 1.1, { shot: 'flame', speed: 6.5, range: 11, dmg: V.dmg || 36 }); }
function drip(g, e, V) {                                   // tallow drips: marked, then a pool of wax that holds your feet
  for (const q of players(g)) for (let k = 0; k < (V.n || 3); k++) {
    const a = R() * TAU, d = k ? 1.5 + R() * 3 : 0, x = q.x + Math.cos(a) * d, y = q.y + Math.sin(a) * d, dl = (V.delay || 1) + k * 0.12;
    mark(g, e, x, y, 1.2, dl, V.dmg || 40, FIRE, 0);
    g.fx.push({ kind: 'scorch', x, y, r: 1.3, t: -dl, life: 7, dps: 0, tick: 0, by: e.D.name, ink: 0.55, col: '#e8d8b0' });
  }
}
function pyre(g, e, V) { for (let k = 1; k <= (V.rings || 3); k++) { const n = 6 + k * 3; for (let j = 0; j < n; j++) { const a = (j / n) * TAU + k * 0.4; mark(g, e, e.x + Math.cos(a) * k * 2.4, e.y + Math.sin(a) * k * 2.2, 1.1, 0.9 + k * 0.4, V.dmg || 44, FIRE, 0); } } }
function conflagration(g, e, V) { for (let k = 0; k < 16; k++) e.bx.vol.push({ t: k * 0.12, V: { form: 'special', name: 'spiralArm', k, dmg: V.dmg } }); }
function spiralArm(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let i = 0; i < 4; i++) g.bxShot(e, ox, oy, V.k * 0.24 + (i * TAU) / 4, { shot: 'flame', speed: 4, range: 12, dmg: V.dmg || 40 }); }
const finale = {
  at: 0.1, dur: 9, name: 'The Last Inch', say: 'the wick gutters', after: 1.2,
  start(g, e) { for (let k = 0; k < 4; k++) e.bx.vol.push({ t: 1 + k * 1.8, V: { form: 'special', name: 'gutter', k } }); },
  update() {},
};
function gutter(g, e, V) { const q = target(g, e); ring(g, e, e.x, e.y - 1, 30, { shot: 'flame', speed: 3.4, range: 14, dmg: 55 }, V.k * 0.2, angleTo(e.x, e.y, q.x, q.y) + (R() - 0.5) * 1.5, 4); }

export default {
  id: 'wick_mother', art: 'wick_mother', shotSheet: 'last_shots', name: 'The Wick-Mother', biome: 'fen', hp: 60000, def: 10, xp: 2200,
  dmgScale: 3, r: 1.4, speed: 0.6, keep: 6, faces: false, tempo: 1, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'a flare', windup: 0.6, recover: 0.7, special: 'flare', waves: 3, dmg: 36 },
      { name: 'tallow drips', windup: 0.6, recover: 0.7, special: 'drip', n: 3, dmg: 40 },
      { name: 'a flare', windup: 0.5, recover: 0.7, special: 'flare', waves: 2, dmg: 36 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'the pyre', windup: 0.7, recover: 0.7, special: 'pyre', rings: 3, dmg: 44 },
      { name: 'a flare', windup: 0.5, recover: 0.6, special: 'flare', waves: 3, dmg: 38 },
      { name: 'tallow drips', windup: 0.5, recover: 0.6, special: 'drip', n: 4, dmg: 40 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'conflagration', windup: 0.6, recover: 0.6, special: 'conflagration', dmg: 40 },
      { name: 'the pyre', windup: 0.5, recover: 0.6, special: 'pyre', rings: 4, dmg: 46 },
      { name: 'tallow drips', windup: 0.4, recover: 0.5, special: 'drip', n: 4, dmg: 42 },
      { name: 'a flare', windup: 0.4, recover: 0.5, special: 'flare', waves: 4, dmg: 38 },
    ] },
  },
  specials: { flare, flareFan, drip, pyre, conflagration, spiralArm, gutter },
  onWake(g) { g.banner('THE WICK-MOTHER · she burns down, and her heat reaches further', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('THE WICK CATCHES', 2400); if (ph === 3) g.banner('SHE BURNS DOWN TO THE BONE', 2400); },
  // in your own browser: her heat, and the wax underfoot
  local(g, e, dt) {
    const p = g.player; if (p.dead || e.bx.state === 'sleep') return;
    if (Math.hypot(p.x - e.x, p.y - e.y) < heat(e) && (e.wmHeatT = (e.wmHeatT || 0) - dt) <= 0) { e.wmHeatT = 0.5; g.hurtPlayer(g.bxDmg(e, 30), `${e.D.name}'s heat`); }
    for (const f of g.fx) if (f.ink && f.kind === 'scorch' && f.t >= 0 && f.by === e.D.name && Math.hypot(p.x - f.x, p.y - f.y) < f.r) { p.dragUntil = g.t + 0.15; p.dragF = f.ink; break; }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2.4, r: 60 + heat(e) * 18, col: '#ffb070' }]; },
  drawGround(r, g, e) {                                    // her heat's reach, flickering
    if (e.bx.state === 'sleep') return;
    const b = r.b, R0 = heat(e) + Math.sin(g.t * 9) * 0.08; b.globalAlpha = 0.18; b.fillStyle = '#ff8a1f'; b.beginPath();
    for (let k = 0; k <= 32; k++) { const a = (k / 32) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * R0, e.y + Math.sin(a) * R0); if (k) b.lineTo(x, y); else b.moveTo(x, y); }
    b.fill(); b.globalAlpha = 0.7; b.strokeStyle = '#ffd650'; b.lineWidth = 2; b.stroke(); b.globalAlpha = 1;
  },
  get loot() { return REALM_BOSSES.wick_mother.loot; },
  lootLuck: 1.2,
};
