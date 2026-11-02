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
const FALLING = { battlements: [1.8, 90, 'falling stones'], towerfall: [1.5, 90, 'falling masonry'], chainbridge: [1.3, 110, 'an eruption'] };

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
    // a gate the server opened (its tile back to the floor): open in this copy too
    for (const w of Object.keys(C.gates || {})) for (const o of C.gates[w]) if (o.solid && !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] && m.tiles[Math.floor(o.y) * m.w + Math.floor(o.x)] !== TID.cobble) { o.solid = false; o.sprite = 'gate_open'; }
    if (!n) return;
    // the causeway: geysers on the lanes near you
    if (n.kind === 'causeway' && (S.geyser -= dt) <= 0) {
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
      if (inR(n, x, y) && !m.solid[Math.floor(y) * m.w + Math.floor(x)] && Math.hypot(x - p.x, y - p.y) > 0.8) this.fx.push({ kind: 'zone', x, y, r: 1.0, t: 0, delay: 1.1, life: 1.25, dmg: D(F[1]), by: F[2], done: false, colors: n.kind === 'chainbridge' ? ['#ff6a1c', '#ffd650'] : ['#8a7a6a', '#ff8a1f'], shards: n.kind === 'chainbridge' ? 4 : 0, proj: 'castle_shots/blob' });
    }
    // the hammer hall: its presses, by turns, down across the hall
    if (n.kind === 'hammers' && (S.press -= dt) <= 0) {
      S.press = 2.4; const k0 = S.pressK++ % 2;
      for (let x = n.x + 4 + k0 * 7; x < n.x + n.w - 3; x += 14) this.fx.push({ kind: 'lane', x: x + 0.5, y: n.y, a: Math.PI / 2, len: n.h, w: 1.1, delay: 0.9, t: 0, life: 1.25, every: 0.5, dmg: D(110), by: 'a forge press', hitT: 0, cols: ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'] });
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
