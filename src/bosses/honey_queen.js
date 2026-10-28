// Queen Melliflua, the Honeyed Mother: the Honeyed Hollow's boss on the boss framework (2026-10-22). From a beekeeper's
// notes: "There is a Queen down there. She is the size of a cart and she sang to me. I said I would come back. I came
// back." "Careful of the honey on the floor. It holds your boots like a lover. The Queen likes her guests to stay."
//   The Queen's Song - she sings, and anyone in its reach is drawn toward her, step by step (felt in your own browser;
//                      the reach is drawn round her). Get out of it. Close to her while she sings, her stingers find you.
//   I   The Queen Rises     - hex-stings, the swarm, her brood laid round the room (break the cells before they hatch)
//   II  The Hive Swarms     - honey rain: marked drops that leave sticky pools (they hold your boots); the waggle dance
//   III The Queen Is Furious - the song's reach grows, and she sings more often; everything at once
//   Last: The Royal Jelly   - she seals herself in wax (immune) and the whole brood hatches unless broken: every
//                             cell left whole becomes bees; break them all and the wax cracks early
// Art: tools/build_hollow_bosses.py ('bx_honey_queen', brood 'hollow_kin/brood', shots 'hollow_shots/honey_queen.<name>').
import { ENEMIES, DUNGEON_BOSSES } from '../data/enemies.js';

const TAU = Math.PI * 2, R = Math.random;
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
const arena = (e) => e.bx.arena || { x: e.x - 11, y: e.y - 4, w: 22, h: 18 };
const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
const open = (m, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx]; };
const HONEY = ['#e8a020', '#ffd060'];

// ---- the song: its reach and how long it lasts are plain numbers on her, so every browser draws and feels it
function song(g, e, V) {
  e.hqSongUntil = g.t + (V.dur || 4); e.hqSongR = V.r || 7;
  g.banner('The Queen sings... get out of her song!', 1600);
  for (let k = 0; k < 3; k++) e.bx.vol.push({ t: 0.5 + k * 1.1, V: { form: 'special', name: 'notes', k, dmg: V.dmg } });
}
function notes(g, e, V) { const n = 10, off = (V.k % 2) * (Math.PI / n); for (let i = 0; i < n; i++) g.bxShot(e, e.x, e.y - 1, off + (i / n) * TAU, { shot: 'note', speed: 2.6, range: 9, dmg: V.dmg || 40 }); }

// ---- I: stings in hexes, the swarm, the brood
function hexsting(g, e, V) {
  const q = target(g, e), [ox, oy] = g.bxOrigin(e), a0 = angleTo(ox, oy, q.x, q.y);
  for (let r = 0; r < (V.rings || 2); r++) e.bx.vol.push({ t: r * 0.35, V: { form: 'special', name: 'hexRing', a0: a0 + r * 0.26, dmg: V.dmg } });
}
function hexRing(g, e, V) { const [ox, oy] = g.bxOrigin(e); for (let k = 0; k < 6; k++) for (const d of [-0.16, 0, 0.16]) g.bxShot(e, ox, oy, V.a0 + (k * TAU) / 6 + d, { shot: 'sting', speed: 6, range: 11, dmg: V.dmg || 46 }); }
function swarm(g, e, V) {
  for (let k = 0; k < (V.n || 14); k++) e.bx.vol.push({ t: k * 0.08, V: { form: 'special', name: 'bee', dmg: V.dmg } });
}
function bee(g, e, V) { const [ox, oy] = g.bxOrigin(e), q = target(g, e), b = g.bxShot(e, ox, oy, angleTo(ox, oy, q.x, q.y) + (R() - 0.5) * 0.8, { shot: 'bee', speed: 4.5, range: 14, dmg: V.dmg || 34 }); if (b) b.mv = { d4: true, swarm: { jitter: 2.4, seek: 0.9 } }; }
const BROOD = 'hq_brood';
if (!ENEMIES[BROOD]) ENEMIES[BROOD] = { name: 'Brood Cell', biome: 'hive', hp: 600, def: 0, speed: 0, xp: 12, r: 0.55, ai: 'rooted', aggro: 0, reg: 'hollow_kin/brood', scale: 1.4, contact: 0, attacks: [], loot: [] };
function brood(g, e, V) {
  const A = arena(e), m = g.map; e.hqBrood = (e.hqBrood || []).filter((c) => !c.dead);
  for (let k = 0; k < (V.n || 4); k++) for (let t = 0; t < 25; t++) {
    const x = A.x + 2 + R() * (A.w - 4), y = A.y + 2 + R() * (A.h - 4);
    if (!open(m, x, y) || players(g).some((q) => Math.hypot(q.x - x, q.y - y) < 3)) continue;
    const c = g.addEnemy(BROOD, x, y); c.seen = true; c.noLoot = true; c.hqHatch = g.t + (V.hatch || 6); c.hqHatchUntil = c.hqHatch; e.hqBrood.push(c); break;
  }
  g.banner('She lays her brood! Break the cells before they hatch!', 1800);
}
function hatchStep(g, e) {
  for (const c of e.hqBrood || []) if (!c.dead && g.t >= c.hqHatch) {     // it hatches: two workers
    c.noLoot = true; c.dead = true; c.deadT = 0; g.vx({ k: 'burst', x: c.x, y: c.y - 0.5, n: 14, colors: HONEY });
    e.hqBees = (e.hqBees || []).filter((b) => !b.dead);
    for (let k = 0; k < 2 && e.hqBees.length < 6; k++) { const b = g.addEnemy('worker_bee', c.x + (k ? 0.6 : -0.6), c.y); b.seen = true; b.aggro = true; b.noLoot = true; b.hqGone = g.t + 22; e.hqBees.push(b); }   // (six of hers at most, and each flies off after a while)
  }
  e.hqBrood = (e.hqBrood || []).filter((c) => !c.dead);
  for (const b of e.hqBees || []) if (!b.dead && g.t >= b.hqGone) { b.noLoot = true; b.dead = true; b.deadT = 0; }
}

// ---- II: honey rain (sticky pools), the waggle dance
function honeyrain(g, e, V) {
  const L = players(g);
  for (let k = 0; k < (V.n || 7); k++) {
    const q = L[k % L.length] || g.player, x = k < L.length ? q.x : q.x + (R() - 0.5) * 9, y = k < L.length ? q.y : q.y + (R() - 0.5) * 9, d = (V.delay || 1) + k * 0.08;
    g.fx.push({ kind: 'zone', src: e, x, y, r: 1.4, t: 0, delay: d, life: d + 0.15, dmg: g.bxDmg(e, V.dmg || 52), by: e.D.name, done: false, colors: HONEY, shards: 0 });
    g.fx.push({ kind: 'scorch', x, y, r: 1.5, t: -d, life: V.pool || 8, dps: 0, tick: 0, by: e.D.name, ink: 0.5, col: '#c8901a' });   // the pool it leaves: it holds your boots
  }
}
function waggle(g, e, V) {
  const [ox, oy] = g.bxOrigin(e), q = target(g, e), a0 = angleTo(ox, oy, q.x, q.y);
  for (let k = 0; k < (V.n || 10); k++) { const b = g.bxShot(e, ox, oy, a0, { shot: 'nectar', speed: 0, range: 30, dmg: V.dmg || 40 }); if (!b) continue;
    b.mv = { d4: true, fig: { cx: ox, cy: oy, a0, r: V.r || 3.2, T: V.dur || 2.2, s0: (k / (V.n || 10)) * TAU, sp: V.speed || 6 } }; b.life = (V.dur || 2.2) + 3; }
}

// ---- last: the royal jelly. Sealed in wax; the whole brood hatches unless broken
const finale = {
  at: 0.1, dur: 12, name: 'The Royal Jelly', say: 'she seals herself in wax: break the brood!', after: 1.2,
  start(g, e) { brood(g, e, { n: 7, hatch: 10 }); e.hqWax = true; e.hqFinT = 0.8; },
  update(g, e, dt, T) {
    hatchStep(g, e);
    if ((e.hqFinT -= dt) <= 0) { e.hqFinT = 1.4; notes(g, e, { k: Math.floor(T), dmg: 40 }); }
    if (T > 1 && !(e.hqBrood || []).length && !e.hqCracked) { e.hqCracked = true; g.banner('Every cell is broken: the wax cracks!', 2000); e.bx.finT = Math.max(e.bx.finT, (e.bx.fin || e.bx.B.finale).dur - 0.1); }
  },
  end(g, e) { e.hqWax = false; },
};

export default {
  id: 'honey_queen', art: 'honey_queen', shotSheet: 'hollow_shots', name: 'Queen Melliflua, the Honeyed Mother', biome: 'hive', hp: 52000, def: 6, xp: 4500,
  dmgScale: 2.5, r: 1.5, speed: 1.0, keep: 6, faces: true, tempo: 0.95, finale,
  phases: {
    1: { move: 'pace', pressure: [{ every: 16, special: 'song', dur: 4, r: 7, dmg: 40 }], patterns: [
      { name: 'hex-stings', windup: 0.6, recover: 0.6, special: 'hexsting', rings: 2, dmg: 46 },
      { name: 'the swarm', windup: 0.5, recover: 0.6, special: 'swarm', n: 14, dmg: 34 },
      { name: 'her brood', windup: 0.7, recover: 0.6, special: 'brood', n: 4, hatch: 6 },
      { name: 'hex-stings', windup: 0.5, recover: 0.6, special: 'hexsting', rings: 3, dmg: 46 },
    ] },
    2: { move: 'pace', pressure: [{ every: 13, special: 'song', dur: 4.5, r: 7.5, dmg: 42 }], patterns: [
      { name: 'honey rain', windup: 0.7, recover: 0.6, special: 'honeyrain', n: 7, dmg: 52 },
      { name: 'the waggle dance', windup: 0.6, recover: 0.6, special: 'waggle', n: 10, dmg: 40 },
      { name: 'the swarm', windup: 0.5, recover: 0.5, special: 'swarm', n: 16, dmg: 34 },
      { name: 'her brood', windup: 0.6, recover: 0.5, special: 'brood', n: 4, hatch: 6 },
      { name: 'hex-stings', windup: 0.5, recover: 0.6, special: 'hexsting', rings: 2, dmg: 46 },
    ] },
    3: { move: 'pace', pressure: [{ every: 10, special: 'song', dur: 5, r: 9, dmg: 44 }], patterns: [
      { name: 'honey rain', windup: 0.5, recover: 0.5, special: 'honeyrain', n: 9, dmg: 54 },
      { name: 'the waggle dance', windup: 0.5, recover: 0.5, special: 'waggle', n: 12, dmg: 42 },
      { name: 'the swarm', windup: 0.4, recover: 0.5, special: 'swarm', n: 18, dmg: 36 },
      { name: 'hex-stings', windup: 0.4, recover: 0.5, special: 'hexsting', rings: 3, dmg: 48 },
      { name: 'her brood', windup: 0.5, recover: 0.5, special: 'brood', n: 5, hatch: 5.5 },
    ] },
  },
  specials: { song, notes, hexsting, hexRing, swarm, bee, brood, honeyrain, waggle },
  onWake(g) { g.banner('QUEEN MELLIFLUA · welcome to my hive, little drone', 3000); },
  onPhase(g, e, ph) { if (ph === 2) g.banner('THE HIVE SWARMS · mind the honey on the floor', 2600); if (ph === 3) g.banner('THE QUEEN IS FURIOUS · her song reaches further', 2600); },
  update(g, e) { const S = e.bx; if (S.state === 'sleep' || S.state === 'intro') return; hatchStep(g, e); },
  immune(g, e) { return !!e.hqWax; },
  // in your own browser: the song draws you in; honey pools hold your boots
  local(g, e, dt) {
    const p = g.player; if (p.dead) return;
    if (e.hqSongUntil > g.t) { const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < e.hqSongR && d > 1.2) { const k = Math.min(d - 1.2, 1.7 * dt); g.moveCircle(p, ((e.x - p.x) / d) * k, ((e.y - p.y) / d) * k, 0.35); p.hqDrawn = true; }
      if (d < 2.2 && (e.hqStingT = (e.hqStingT || 0) - dt) <= 0) { e.hqStingT = 0.6; g.hurtPlayer(g.bxDmg(e, 50), `${e.D.name}'s stingers`); } }
    for (const f of g.fx) if (f.ink && f.kind === 'scorch' && f.t >= 0 && f.by === e.D.name && Math.hypot(p.x - f.x, p.y - f.y) < f.r) { p.dragUntil = g.t + 0.15; p.dragF = f.ink; break; }
  },
  onDeath(g, e) { for (const c of [...(e.hqBrood || []), ...(e.hqBees || [])]) if (!c.dead) { c.noLoot = true; c.dead = true; c.deadT = 0; } g.banner('THE QUEEN FALLS SILENT. THE HIVE STOPS HUMMING.', 3400); },
  lights(g, e) { return [{ x: e.x, y: e.y, h: 1.6, r: 100, col: '#ffd060' }]; },
  drawGround(r, g, e) {
    const b = r.b;
    if (e.hqSongUntil > g.t && e.hqSongR) {               // the song's reach: a ring of gold notes round her
      const ring = () => { b.beginPath(); for (let k = 0; k <= 48; k++) { const a = (k / 48) * TAU + g.t * 0.6, [x, y] = r.proj(e.x + Math.cos(a) * e.hqSongR, e.y + Math.sin(a) * e.hqSongR); if (k) b.lineTo(x, y); else b.moveTo(x, y); } };
      ring(); b.globalAlpha = 0.16; b.fillStyle = '#fff6c8'; b.fill();
      b.globalAlpha = 0.55; b.strokeStyle = '#2a1a0a'; b.lineWidth = 6; b.stroke();                       // (a dark band under it: it reads on the honeycomb)
      b.globalAlpha = 0.75 + 0.25 * Math.sin(g.t * 6); b.strokeStyle = '#fff6c8'; b.lineWidth = 3; b.setLineDash([8, 6]); ring(); b.stroke(); b.setLineDash([]); b.globalAlpha = 1;
    }
    if (e.hqWax) { b.globalAlpha = 0.55; b.fillStyle = '#e8a020'; b.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, [x, y] = r.proj(e.x + Math.cos(a) * 2.2, e.y - 1 + Math.sin(a) * 2.2); if (k) b.lineTo(x, y); else b.moveTo(x, y); } b.closePath(); b.fill(); b.globalAlpha = 1; }
  },
  get loot() { return DUNGEON_BOSSES.honey_queen.loot; },
  lootLuck: 1.5,
};
