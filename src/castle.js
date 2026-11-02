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
// each part of the castle its own light: the entrance burning, the court's violet dusk, the forge's glare, Ashkar's
// red, the eclipse almost black, the sanctum the stolen sun's gold
const AMBIENT = { gate: 'rgba(44,16,8,0.44)', siege: 'rgba(40,18,10,0.46)', court: 'rgba(18,10,34,0.54)', forge: 'rgba(50,18,4,0.38)', ashkar: 'rgba(58,10,4,0.46)',
  eclipse: 'rgba(8,3,20,0.7)', sanctum: 'rgba(34,22,8,0.42)' };
const FALLING = { battlements: [1.8, 90, 'falling stones'], towerfall: [1.5, 90, 'falling masonry'], chainbridge: [1.3, 110, 'an eruption'] };

const methods = {
  castleTick(dt) {
    const m = this.map, C = m.castle, p = this.player;
    if (!C || !C.rooms || p.dead) return;
    const Rm = C.rooms, S = C.st || (C.st = { t0: this.t, geyser: 2, fall: 1, press: 1, pressK: 0, said: {} });
    this.castleParty();
    const key = Object.keys(Rm).find((k) => inR(Rm[k], p.x, p.y)), n = key && Rm[key];
    if (key && !S.said[key]) { S.said[key] = true; this.castleEnter(key, n); }
    if (n && n.sect) m.ambient = AMBIENT[n.sect] || m.ambient;
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
