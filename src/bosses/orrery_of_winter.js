// The Orrery of Winter: Runeholt's realm boss on the boss framework (2026-10-22). "YOUR ORBIT DECAYS. Absolute zero
// approaches. I have calculated your death." Its own mechanic:
//   The Frost Clock - a clock face of twelve wedges round it, its hand sweeping. Every chime, the wedge under the hand
//     freezes over for a while (inside a frozen wedge you're frostbitten, in your own browser). The frozen wedges add
//     up: keep to the warm ones. The hand speeds up as the fight goes on.
//   I   The Hour Turns       - the clock, snowflake rings that shatter outward, its moons lining up to fire
//   II  The Rings Realign    - two hands now, sweeping opposite ways
//   III Absolute Winter      - wedges stay frozen longer
//   Last: Absolute Zero      - every wedge freezes but one, and the warm one moves round: stay in it
// Art: tools/build_last_bosses.py ('bx_orrery_of_winter', shots 'last_shots/orrery_of_winter.<name>').
import { REALM_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, target, ring, fan } from './kit.js';

const W = 12, REACH = 11;
const wedgeAt = (e, x, y) => { const a = (angleTo(e.x, e.y, x, y) + TAU) % TAU; return Math.floor(a / (TAU / W)) % W; };
function chime(g, e, dt) {                                 // the hand(s) sweep; at each chime, the wedge under a hand freezes
  const S = e.bx, hands = S.phase >= 2 ? 2 : 1, hold = S.phase === 3 ? 10 : 7, speed = 0.35 + 0.25 * (1 - e.hp / e.maxHp);
  e.owHand = ((e.owHand || 0) + speed * dt) % TAU;
  if ((e.owChimeT = (e.owChimeT ?? 2.5) - dt) > 0) return;
  e.owChimeT = 2.4;
  for (let h = 0; h < hands; h++) { const a = h ? (TAU - e.owHand) % TAU : e.owHand, k = Math.floor(a / (TAU / W)) % W; e['owW' + k + 'Until'] = g.t + hold; }
  g.float(e.x, e.y - 3.2, 'CHIME', '#bfe8ff');
}
function shatter(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let k = 0; k < (V.waves || 3); k++) e.bx.vol.push({ t: k * 0.18, V: { form: 'special', name: 'flakeRing', k, dmg: V.dmg } }); }
function flakeRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy, 14, { shot: 'flake', speed: 6.5, range: 12, dmg: V.dmg || 36 }, V.k * 0.11); }
function align(g, e, V) {                                  // its moons line up behind it, and fire down the line at you
  const q = target(g, e), a = angleTo(e.x, e.y, q.x, q.y);
  for (let k = 0; k < 4; k++) { const x = e.x - Math.cos(a) * (2 + k * 1.2), y = e.y - Math.sin(a) * (2 + k * 1.2); e.bx.vol.push({ t: 0.5 + k * 0.12, V: { form: 'special', name: 'moonShot', x, y, a, dmg: V.dmg } }); }
}
function moonShot(g, e, V) { fan(g, e, V.x, V.y - 1, V.a, 3, 0.25, { shot: 'moon', speed: 8, range: 16, dmg: V.dmg || 44 }); }
const finale = {
  at: 0.1, dur: 10, name: 'Absolute Zero', say: 'every wedge freezes but one', after: 1.2,
  start(g, e) { e.owWarm = Math.floor(R() * W); e.owZero = true; },
  update(g, e, dt, T) {
    if ((e.owWarmT = (e.owWarmT ?? 2.5) - dt) <= 0) { e.owWarmT = 2.2; e.owWarm = (e.owWarm + (R() < 0.5 ? 1 : W - 1)) % W; }   // the warm wedge moves, a step at a time
    for (let k = 0; k < W; k++) e['owW' + k + 'Until'] = k === e.owWarm ? 0 : g.t + 0.5;
    if ((e.owFinT = (e.owFinT ?? 1) - dt) <= 0) { e.owFinT = 1.6; flakeRing(g, e, { k: Math.floor(T * 3), dmg: 34 }); }
  },
  end(g, e) { e.owZero = false; for (let k = 0; k < W; k++) e['owW' + k + 'Until'] = 0; },
};

export default {
  id: 'orrery_of_winter', art: 'orrery_of_winter', shotSheet: 'last_shots', name: 'The Orrery of Winter', biome: 'runeholt', hp: 104000, def: 18, xp: 4200,
  r: 1.6, speed: 0.5, keep: 6, faces: false, tempo: 1, finale, dmgScale: 1.6,   // (was 1: tanked by a maxed character. 2026-10-29)
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'it shatters', windup: 0.6, recover: 0.7, special: 'shatter', waves: 3, dmg: 36 },
      { name: 'the moons align', windup: 0.6, recover: 0.7, special: 'align', dmg: 44 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'the moons align', windup: 0.5, recover: 0.6, special: 'align', dmg: 46 },
      { name: 'it shatters', windup: 0.5, recover: 0.6, special: 'shatter', waves: 4, dmg: 36 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'it shatters', windup: 0.4, recover: 0.5, special: 'shatter', waves: 4, dmg: 38 },
      { name: 'the moons align', windup: 0.4, recover: 0.5, special: 'align', dmg: 48 },
    ] },
  },
  specials: { shatter, flakeRing, align, moonShot },
  onWake(g) { g.banner('THE ORRERY OF WINTER · keep to the warm hours', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('THE RINGS REALIGN · two hands now', 2400); if (ph === 3) g.banner('ABSOLUTE WINTER', 2400); },
  update(g, e, dt) { if (e.bx.state === 'sleep' || e.bx.state === 'intro') return; chime(g, e, dt); },
  // in your own browser: a frozen wedge frostbites you
  local(g, e, dt) {
    const p = g.player; if (p.dead) return; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d > REACH || d < 1) return;
    if (e['owW' + wedgeAt(e, p.x, p.y) + 'Until'] > g.t && (e.owBiteT = (e.owBiteT || 0) - dt) <= 0) { e.owBiteT = 0.5; g.hurtPlayer(g.bxDmg(e, 34), `${e.D.name}'s frost`); }
  },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 2, r: 90, col: '#bfe8ff' }]; },
  drawGround(r, g, e) {                                    // the clock: twelve wedges, the frozen ones white; the hand(s)
    if (e.bx.state === 'sleep') return;
    const b = r.b;
    for (let k = 0; k < W; k++) {
      const frozen = e['owW' + k + 'Until'] > g.t, warm = e.owZero && k === e.owWarm;
      if (!frozen && !warm) continue;
      const pts = [r.proj(e.x, e.y)]; for (let j = 0; j <= 4; j++) { const a = (k + j / 4) * (TAU / W); pts.push(r.proj(e.x + Math.cos(a) * REACH, e.y + Math.sin(a) * REACH)); }
      b.globalAlpha = warm ? 0.3 : 0.28; b.fillStyle = warm ? '#ffb070' : '#e0f6ff'; b.beginPath(); pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y))); b.closePath(); b.fill();
    }
    b.globalAlpha = 0.35; b.strokeStyle = '#bfe8ff'; b.lineWidth = 1;
    for (let k = 0; k < W; k++) { const a = k * (TAU / W), [x0, y0] = r.proj(e.x + Math.cos(a) * 1.5, e.y + Math.sin(a) * 1.5), [x1, y1] = r.proj(e.x + Math.cos(a) * REACH, e.y + Math.sin(a) * REACH); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
    b.globalAlpha = 0.9; b.strokeStyle = '#3a5a7a'; b.lineWidth = 4;
    for (let h = 0; h < (e.bx.phase >= 2 ? 2 : 1); h++) { const a = h ? TAU - (e.owHand || 0) : e.owHand || 0, [x0, y0] = r.proj(e.x, e.y), [x1, y1] = r.proj(e.x + Math.cos(a) * REACH, e.y + Math.sin(a) * REACH); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
    b.globalAlpha = 1;
  },
  get loot() { return REALM_BOSSES.orrery_of_winter.loot; },
  lootLuck: 1.3,
};
