// The Brine Cathedral: the shore's realm boss on the boss framework (2026-10-22). A hermit crab that wears a drowned
// chapel for a shell. "THE BELLS TOLL FOR THEE. Enter. Pray. Drown." Its own mechanic:
//   The Doors - only its doors can be hurt: blows from its front land; from behind or the side they glance off the
//     shell (SHELL). It turns slowly toward the nearest of you. From II, it turns away: circle it, or split up.
//   I   The Bells Toll         - the bell's rings (with a gap), its claws, bubbles at your feet
//   II  The Doors Close        - it turns its back on whoever is nearest; the tide calls in from the shore
//   III The Cathedral Floods   - water from every window: rings of bubbles, faster tolls
//   Last: Last Rites           - it buries into the sand and the bell tolls three times: three great rings, one gap each
// Art: tools/build_last_bosses.py ('bx_brine_cathedral', shots 'last_shots/brine_cathedral.<name>').
import { REALM_BOSSES } from '../data/enemies.js';
import { TAU, R, angleTo, arena, players, target, ring, fan, mark } from './kit.js';

const BRINE = ['#2a7ac8', '#7ad0ff'];
function toll(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e); for (let k = 0; k < (V.rings || 2); k++) e.bx.vol.push({ t: k * 0.45, V: { form: 'special', name: 'tollRing', ga: angleTo(ox, oy, q.x, q.y) + (R() - 0.5), k, dmg: V.dmg } }); }
function tollRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy - 1.2, 22, { shot: 'toll', speed: 3.6 + V.k * 0.4, range: 12, dmg: V.dmg || 40 }, V.k * 0.14, V.ga, 4); }
function claws(g, e, V) { const q = target(g, e), [ox, oy] = g.bxOrigin(e); for (let w = 0; w < 3; w++) e.bx.vol.push({ t: w * 0.2, V: { form: 'special', name: 'clawSnap', a: angleTo(ox, oy, q.x, q.y), w, dmg: V.dmg } }); }
function clawSnap(g, e, V) { const [ox, oy] = g.bxOrigin(e); fan(g, e, ox, oy, V.a + (V.w - 1) * 0.12, 4, 0.7, { shot: 'claw', speed: 7, range: 10, dmg: V.dmg || 48 }); }
function bubbles(g, e, V) { for (const q of players(g)) for (let k = 0; k < 3; k++) { const a = R() * TAU, d = k ? 1.5 + R() * 2 : 0; mark(g, e, q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, 1.2, (V.delay || 1) + k * 0.15, V.dmg || 44, BRINE, 5, 'last_shots/brine_cathedral.bubble'); } }
function tidecall(g, e, V) {                                 // the tide comes in from the shore side, a wall with one gap
  const A = arena(e), gap = 3, g0 = A.x + 1 + R() * (A.w - gap - 2);
  for (let x = A.x + 0.5; x < A.x + A.w; x += 0.9) { if (x > g0 && x < g0 + gap) continue; g.bxShot(e, x, A.y + A.h, -Math.PI / 2, { shot: 'bubble', speed: 3.6, range: A.h, dmg: V.dmg || 46 }); }
}
function flood(g, e, V) { for (let k = 0; k < (V.n || 3); k++) e.bx.vol.push({ t: k * 0.5, V: { form: 'special', name: 'floodRing', k, dmg: V.dmg } }); }
function floodRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); ring(g, e, ox, oy - 1, 18, { shot: 'bubble', speed: 3, range: 11, dmg: V.dmg || 42 }, V.k * 0.17); }
const finale = {
  at: 0.1, dur: 8, name: 'Last Rites', say: 'the bell tolls three times', after: 1.2,
  start(g, e) { e.cbBuried = true; for (let k = 0; k < 3; k++) e.bx.vol.push({ t: 1.2 + k * 2.2, V: { form: 'special', name: 'riteToll', k } }); },
  update() {},
  end(g, e) { e.cbBuried = false; },
};
function riteToll(g, e, V) { const q = target(g, e); ring(g, e, e.x, e.y - 1, 36, { shot: 'toll', speed: 3.2, range: 14, dmg: 70 }, V.k * 0.3, angleTo(e.x, e.y, q.x, q.y) + (R() - 0.5) * 1.2, 5); g.vx({ k: 'shake', amt: 6 }); g.float(e.x, e.y - 3, 'DONG', '#f2d070'); }

export default {
  id: 'brine_cathedral', art: 'brine_cathedral', shotSheet: 'last_shots', name: 'The Brine Cathedral', biome: 'shore', hp: 28000, def: 4, xp: 900,
  dmgScale: 1.4, r: 1.5, speed: 0.9, keep: 5, faces: false, tempo: 1, finale,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'the bell tolls', windup: 0.7, recover: 0.7, special: 'toll', rings: 2, dmg: 40 },
      { name: 'its claws', windup: 0.5, recover: 0.7, special: 'claws', dmg: 48 },
      { name: 'bubbles at your feet', windup: 0.5, recover: 0.7, special: 'bubbles', dmg: 44 },
    ] },
    2: { move: 'pace', patterns: [
      { name: 'the tide calls', windup: 0.7, recover: 0.7, special: 'tidecall', dmg: 46 },
      { name: 'the bell tolls', windup: 0.6, recover: 0.6, special: 'toll', rings: 3, dmg: 40 },
      { name: 'its claws', windup: 0.5, recover: 0.6, special: 'claws', dmg: 48 },
      { name: 'bubbles at your feet', windup: 0.5, recover: 0.6, special: 'bubbles', dmg: 44 },
    ] },
    3: { move: 'pace', patterns: [
      { name: 'the cathedral floods', windup: 0.7, recover: 0.6, special: 'flood', n: 3, dmg: 42 },
      { name: 'the bell tolls', windup: 0.5, recover: 0.5, special: 'toll', rings: 3, dmg: 42 },
      { name: 'the tide calls', windup: 0.5, recover: 0.6, special: 'tidecall', dmg: 46 },
      { name: 'its claws', windup: 0.4, recover: 0.5, special: 'claws', dmg: 50 },
    ] },
  },
  specials: { toll, tollRing, claws, clawSnap, bubbles, tidecall, flood, floodRing, riteToll },
  onWake(g) { g.banner('THE BRINE CATHEDRAL · strike its doors, not its shell', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('THE DOORS CLOSE · it turns its back on you, then turns again', 2600); if (ph === 3) g.banner('THE CATHEDRAL FLOODS', 2400); },
  // it turns, slowly: toward the nearest of you (I); from II, its back for 3s, then its doors for 4s, over and over
  // (it used to keep its back to you from II on, so alone you had to outrun its turning for every blow: it seemed
  // immune for good. 2026-10-24)
  update(g, e, dt) {
    e.cbT = ((e.cbT || 0) + dt) % 7;
    const away = e.bx.phase >= 2 && e.cbT < 3;
    const q = target(g, e), want = angleTo(e.x, e.y, q.x, q.y) + (away ? Math.PI : 0), f = e.cbFace ?? want, d = Math.atan2(Math.sin(want - f), Math.cos(want - f));
    e.cbFace = f + Math.max(-0.7 * dt, Math.min(0.7 * dt, d));
  },
  // only the doors: a blow lands if whoever struck stands in front of it (on the server, g.player is the striker)
  immune(g, e) { if (e.cbBuried) return true; const p = g.player, a = angleTo(e.x, e.y, p.x, p.y), d = Math.atan2(Math.sin(a - (e.cbFace || 0)), Math.cos(a - (e.cbFace || 0))); return Math.abs(d) > 1.22; },   // (its doors: 70 degrees either side of its face)
  immuneText: 'SHELL',
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.8, r: 80, col: '#7ad0ff' }]; },
  drawGround(r, g, e) {                                    // where its doors face: a pale wedge on the sand
    if (e.cbFace === undefined || e.bx.state === 'sleep') return;
    const b = r.b, pts = [r.proj(e.x, e.y)]; for (let k = 0; k <= 8; k++) { const a = e.cbFace - 1.22 + (2.44 * k) / 8; pts.push(r.proj(e.x + Math.cos(a) * 4, e.y + Math.sin(a) * 4)); }
    b.globalAlpha = 0.22; b.fillStyle = '#f2d070'; b.beginPath(); pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y))); b.closePath(); b.fill(); b.globalAlpha = 1;
  },
  get loot() { return REALM_BOSSES.brine_cathedral.loot; },
  lootLuck: 1.2,
};
