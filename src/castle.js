// Sunthief's Castle, after the eruption (the user's map and its journey, 2026-11-02; src/world/maps.js LAYOUT.throne,
// m.castle.rooms): each room's name as you come in, each part of the castle its own light, its hazards, the arrival's door
// and the Sunthief Gate, mixed into Game like gearmech.js. Nothing here runs while you are dead; every hazard is shown
// before it hurts.
//   the arrival       safe; its door onto the battlements opens 3 s after you land (2.5 s of protection there)
//   the causeway      a geyser every 4 s on the lanes near you, never where you stand: 1.2 s marked, then it bursts (110)
//   the battlements, the fallen tower, the chain bridge   stones and burning wreckage fall about you: each marked 1.1 s
//                     (90; on the chain bridge an eruption, 110, throwing four blobs)
//   the hammer hall   its presses slam across the hall by turns: their rows glow 0.9 s, then come down (110)
//   the Sunthief Gate once its seals are broken (both Jarls and Ashkar): walk into its portal and a 1.0 s fade takes you
//                     to the Eclipse Walk, 2.5 s of grace there
import { R } from './util.js';
import { TID } from './world/maps.js';

const inR = (n, x, y) => n && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
const D = (n) => n + 4;
// each region of the castle its own light (2026-11-02, the user: "the castle changes brightness abruptly... establish a
// cohesive lighting system based on dungeon regions... transition smoothly between neighbouring rooms and hallways"):
// the eruption's smoky orange dark outside, the Hollow Court's cold violet, the forges deep charcoal (their molten light
// is their own lamps'), Ashkar's red, the eclipse darker purple-black the further along it, the sanctum near-black but
// for the stolen sun. [r, g, b, alpha] of the dark laid over the floor (under every shot: they always read).
const AMBIENT = { gate: [42, 18, 10, 0.4], siege: [38, 16, 10, 0.42], court: [16, 10, 32, 0.46], forge: [22, 12, 10, 0.48], ashkar: [36, 8, 6, 0.48],
  eclipse: [10, 4, 24, 0.54], sanctum: [8, 3, 10, 0.6] };
const DEEPER = { walk: 0, eclipseshrine: 0.05, walk2: 0.1 };        // (along the eclipse: each part a little darker)
const roomAmb = (n) => { const A = AMBIENT[n.sect]; if (!A) return null; const d = DEEPER[n.key] ?? DEEPER[n.kind] ?? 0; return d ? [A[0], A[1], A[2], A[3] + d] : A; };
const distR = (n, x, y) => Math.hypot(Math.max(n.x - x, 0, x - (n.x + n.w)), Math.max(n.y - y, 0, y - (n.y + n.h)));
// what falls about you, by room: [every, damage, what]; the Long Siege's (2026-11-02): burning branches in the forest,
// rockfall on the ascent, the gorge erupting under the span, siege fire on the barbican, his sigils flaring in the chapel,
// the solar vents in the valves' floor
const FALLING = { battlements: [1.8, 90, 'falling stones'], towerfall: [1.5, 90, 'falling masonry'], chainbridge: [1.3, 110, 'an eruption'],
  ashforest: [1.7, 90, 'a burning branch'], ascent: [1.6, 95, 'falling rocks'], span: [1.3, 110, 'an eruption'], barbican: [1.4, 100, 'siege fire'],
  chapel: [1.9, 105, 'a sigil of his'], valves: [1.5, 110, 'a solar vent'] };
const FALL_COL = { chainbridge: ['#ff6a1c', '#ffd650'], span: ['#ff6a1c', '#ffd650'], chapel: ['#b884cc', '#e6c8ff'], valves: ['#ffd650', '#fff6c8'] };

const methods = {
  // the light where you stand: every room near you by how near (inside one, it is all its own; in a hallway between two,
  // a mix of both), eased toward over about a second, so no doorway switches the screen's brightness at a step. A boss
  // may darken its own room (Solkhar's sanctum as his sun is torn from him): m.ambBoss, while you are in it.
  castleLight(dt, Rm, here) {
    const m = this.map, p = this.player, S = m.castle.st;
    let w = 0; const T = [0, 0, 0, 0];
    for (const k in Rm) {
      const n = Rm[k], d = distR(n, p.x, p.y); if (d > 16) continue;
      const A = n === here && m.ambBoss && here.sect === 'sanctum' ? m.ambBoss : roomAmb(n); if (!A) continue;
      const q = d === 0 ? 1e3 : 1 / (1 + (d * d) / 9) ** 2;
      for (let i = 0; i < 4; i++) T[i] += A[i] * q;
      w += q;
    }
    if (!w) return;
    for (let i = 0; i < 4; i++) T[i] /= w;
    const cur = S.amb || (S.amb = T.slice()), k = 1 - Math.exp(-dt / 0.7);
    for (let i = 0; i < 4; i++) cur[i] += (T[i] - cur[i]) * k;
    m.ambient = `rgba(${Math.round(cur[0])},${Math.round(cur[1])},${Math.round(cur[2])},${cur[3].toFixed(3)})`;
  },
  castleTick(dt) {
    const m = this.map, C = m.castle, p = this.player;
    if (!C || !C.rooms || p.dead) return;
    const Rm = C.rooms, S = C.st || (C.st = { t0: this.t, geyser: 2, fall: 1, press: 1, pressK: 0, said: {} });
    this.castleParty();
    const key = Object.keys(Rm).find((k) => inR(Rm[k], p.x, p.y)), n = key && Rm[key];
    if (key && !S.said[key]) { S.said[key] = true; this.castleEnter(key, n); }
    this.castleLight(dt, Rm, n);
    // the arrival's door
    if (!S.breachOpen && this.t - S.t0 > 3) { S.breachOpen = true; this.castleOpen('breach'); }
    // the keep gate, at the Hollow Court's north end: open once both Jarls have fallen
    if (!S.keepOpen && C.gates && C.gates.keep) {
      const J = (m.wardens || []).filter((w) => w.room === Rm.court);
      if (J.length && J.every((w) => w.dead)) { S.keepOpen = true; this.castleOpen('keep'); this.banner('THE KEEP GATE GRINDS OPEN', 2600); }
    }
    this.castleMechs(dt, Rm, S);
    // a gate the server opened (its tile back to the floor): open in this copy too
    for (const w of Object.keys(C.gates || {})) for (const o of C.gates[w]) if (o.solid && !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] && m.tiles[Math.floor(o.y) * m.w + Math.floor(o.x)] !== TID.cobble) { o.solid = false; o.sprite = 'gate_open'; }
    if (!n) return;
    // the causeway: geysers on the lanes near you
    if ((n.kind === 'causeway' || n.kind === 'span') && (S.geyser -= dt) <= 0) {
      S.geyser = 4;
      for (let k = 0; k < 2; k++) {
        const x = p.x + (R() - 0.5) * 8, y = p.y + (R() - 0.5) * 6, tx = Math.floor(x), ty = Math.floor(y);
        if (!inR(n, tx, ty) || m.solid[ty * m.w + tx] || m.tiles[ty * m.w + tx] === TID.lava || Math.hypot(x - p.x, y - p.y) < 1.5) continue;
        this.fx.push({ kind: 'zone', x: tx + 1, y: ty + 1, r: 1.1, t: 0, delay: 1.2, life: 1.55, dmg: D(110), by: 'a magma geyser', done: false, colors: ['#ff8a1f', '#ffd650'] });
      }
    }
    // stones, wreckage, eruptions falling about you
    const F = FALLING[n.kind];
    if (F && (S.fall -= dt) <= 0) {
      S.fall = F[0];
      const x = p.x + (R() - 0.5) * 7, y = p.y + (R() - 0.5) * 6;
      if (inR(n, x, y) && !m.solid[Math.floor(y) * m.w + Math.floor(x)] && Math.hypot(x - p.x, y - p.y) > 0.8) this.fx.push({ kind: 'zone', x, y, r: 1.0, t: 0, delay: 1.1, life: 1.25, dmg: D(F[1]), by: F[2], done: false, colors: FALL_COL[n.kind] || ['#8a7a6a', '#ff8a1f'], shards: n.kind === 'chainbridge' || n.kind === 'span' ? 4 : 0, proj: 'castle_shots/blob' });
    }
    // the hammer hall: its presses, by turns, down across the hall
    if ((n.kind === 'hammers' || n.kind === 'cloister') && (S.press -= dt) <= 0) {
      S.press = 2.4; const k0 = S.pressK++ % 2;
      for (let x = n.x + 4 + k0 * (n.kind === 'cloister' ? 8 : 7); x < n.x + n.w - 3; x += n.kind === 'cloister' ? 16 : 14) this.fx.push({ kind: 'lane', x: x + 0.5, y: n.y, a: Math.PI / 2, len: n.h, w: 1.1, delay: 0.9, t: 0, life: 1.25, every: 0.5, dmg: D(110), by: 'a forge press', hitT: 0, cols: ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'] });
    }
    // the Sunthief Gate: through its portal to the Eclipse Walk
    const Dd = C.door;
    if (n.kind === 'sundoor' && !S.through && p.x >= Dd.x0 && p.x <= Dd.x1 + 1 && p.y >= Dd.y0 && p.y <= Dd.y1 + 1) {
      if (m.sealsLeft > 0) { if (!(this.gateT > 0)) { this.gateT = 4; this.banner(`The Sunthief Gate is sealed. Still holding it shut: ${this.sealsHint()}.`, 3000); } }
      else { S.through = this.t; this.fx.push({ kind: 'fade', t: 0, life: 1.0 }); this.sfx('portal'); }
    }
    if (S.through && this.t - S.through >= 0.5 && !S.arrived) {   // (under the fade's darkest)
      S.arrived = true; p.x = C.arrive.x; p.y = C.arrive.y; p.status.invuln = Math.max(p.status.invuln || 0, 2.5);
    }
    if (S.through && n.sect !== 'eclipse' && n.sect !== 'sanctum' && n.kind !== 'sundoor') { S.through = 0; S.arrived = false; }   // (back another way: the gate works again)
  },
  // more players, more Life (the user's formulas): a castle defender 1 + 0.55 a player past the first (at most 2.65), a
  // castle boss 1 + 0.60 (up to six); no more damage. Only the server counts its players (a browser alone is one); a
  // monster keeps the share of its Life it had, so its phases stay where they were
  castleParty() {
    const n = Math.max(1, (this.netTargets || []).filter((q) => q && !q.dead).length);
    const kin = Math.min(2.65, 1 + 0.55 * (n - 1)), boss = 1 + 0.6 * (Math.min(6, n) - 1);
    for (const e of this.enemies) {
      if (e.dead || !(e.D.kin || e.rb)) continue;
      const k = e.rb ? boss : kin, k0 = e.partyK || 1; if (k === k0) continue;
      const f = e.hp / e.maxHp; e.maxHp = Math.round((e.maxHp / k0) * k); e.hp = Math.max(1, Math.round(f * e.maxHp)); e.partyK = k;
    }
  },
  // the keep's two mechanisms (the Chain Winch, the Solar Valves): stand at one with its room cleared and it turns (3 s;
  // stepping off, it slips back); both turned, the forge gate opens on Ashkar's hall. Anyone of the party can turn them
  castleMechs(dt, Rm, S) {
    const C = this.map.castle; if (!C.mechs) return;
    const who = [this.player, ...(this.netTargets || [])].filter((q) => q && !q.dead);
    for (const M of C.mechs) {
      if (M.done) continue;
      const rm = Rm[M.key], near = who.some((q) => Math.hypot(q.x - M.x - 0.5, q.y - M.y - 0.5) < 2.4);
      if (!near) { M.prog = Math.max(0, (M.prog || 0) - dt * 0.5); continue; }
      if (rm && this.enemies.some((e) => !e.dead && (e.D.kin || e.rb) && inR(rm, e.x, e.y))) { if (!(M.toldT > this.t)) { M.toldT = this.t + 4; this.banner(`${M.name}: ITS DEFENDERS STILL HOLD IT`, 2200); } continue; }
      M.prog = (M.prog || 0) + dt / 3;
      if (!(M.sayT > this.t)) { M.sayT = this.t + 0.5; this.banner(`${M.verb} · ${Math.min(100, Math.round(M.prog * 100))}%`, 700); }
      if (Math.random() < 0.3) this.vx({ k: 'burst', x: M.x + 0.5, y: M.y, n: 2, colors: M.key === 'winch' ? ['#a39bb2', '#ff8a1f'] : ['#ffd650', '#fff6c8'] });
      if (M.prog >= 1) {
        M.done = true; this.sfx('chain'); this.vx({ k: 'shake', amt: 5 }); this.vx({ k: 'burst', x: M.x + 0.5, y: M.y, n: 24, colors: ['#ffd650', '#ff8a1f', '#ffffff'] });
        if (C.mechs.every((q) => q.done)) { this.castleOpen('forge'); this.banner('THE FORGE GATE OPENS · ASHKAR WAITS', 3000); }
        else this.banner(`${M.name} TURNED · ONE MORE HOLDS THE FORGE GATE`, 2600);
      }
    }
  },
  castleEnter(key, n) {
    const m = this.map;
    if (key === 'arrival') this.player.status.invuln = Math.max(this.player.status.invuln || 0, 2.5);
    this.banner(n.kind === 'sundoor' ? (m.sealsLeft > 0 ? 'BEYOND THIS GATE, EVEN LIGHT OBEYS HIM.' : 'STEP THROUGH THE SUNTHIEF GATE.') : n.title || key.toUpperCase(), 2200);
  },
  castleOpen(which) {
    const m = this.map;
    for (const o of (m.castle.gates && m.castle.gates[which]) || []) {
      const i = Math.floor(o.y) * m.w + Math.floor(o.x);
      o.sprite = 'gate_open'; o.solid = false; m.solid[i] = 0; if (o.floor !== undefined) m.tiles[i] = o.floor;   // (the tile changes: the server sends it on)
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 6, colors: ['#ff8a1f', '#ffd650'] });
    }
    this.sfx('chain');
  },
};
export function installCastle(Game) { Object.assign(Game.prototype, methods); }
