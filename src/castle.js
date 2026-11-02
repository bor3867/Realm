// Sunthief's Castle, after the eruption (the user's map, 2026-11-02: twelve steps; src/world/maps.js LAYOUT.throne,
// m.castle.rooms): each room's name as you come in, the arrival's door, the causeway's geysers, and the Sunthief Gate,
// mixed into Game like gearmech.js. Nothing here runs while you are dead; every hazard is shown before it hurts.
//   Eruption Arrival   safe; its door onto the descent opens 3 s after you arrive (2.5 s of protection on arrival)
//   Broken Causeway    a geyser every 4 s on the lanes near you (never where you stand): 1.2 s marked, then it bursts (110)
//   Sunthief Gate      once its seals are broken (both Jarls and Ashkar): walk into the great portal and a 1.0 s fade takes
//                      you to the Eclipse Walk's west end, 2.5 s of grace there
import { R } from './util.js';
import { TID } from './world/maps.js';

const inR = (n, x, y) => n && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
const D = (n) => n + 4;
const NAMES = { arrival: 'ERUPTION ARRIVAL', ashfall: 'ASHFALL DESCENT', cause: 'THE BROKEN CAUSEWAY', siege: 'OUTER SIEGE COURT', banners: 'HALL OF HOLLOW BANNERS',
  court: 'TWIN JARL ARENA', galleries: 'THE CINDER GALLERIES', forge: 'CHAINFORGE THRESHOLD', ashkar: "ASHKAR'S FORGE GATE", gate: 'THE SUNTHIEF GATE', walk: 'ECLIPSE WALK', I: "SOLKHAR'S SANCTUM" };

const methods = {
  castleTick(dt) {
    const m = this.map, C = m.castle, p = this.player;
    if (!C || !C.rooms || p.dead) return;
    const Rm = C.rooms, S = C.st || (C.st = { t0: this.t, geyser: 2, said: {} });
    this.castleParty();
    const here = Object.keys(Rm).find((k) => inR(Rm[k], p.x, p.y));
    if (here && !S.said[here]) { S.said[here] = true; this.castleEnter(here); }
    // the arrival's door
    if (!S.breachOpen && this.t - S.t0 > 3) { S.breachOpen = true; this.castleOpen('breach'); }
    // a gate the server opened (its tile back to the floor): open in this copy too
    for (const w of Object.keys(C.gates || {})) for (const o of C.gates[w]) if (o.solid && !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] && m.tiles[Math.floor(o.y) * m.w + Math.floor(o.x)] !== TID.cobble) { o.solid = false; o.sprite = 'gate_open'; }
    // the causeway: geysers on the lanes near you
    if (here === 'cause' && (S.geyser -= dt) <= 0) {
      S.geyser = 4;
      for (let k = 0; k < 2; k++) {
        const x = p.x + (R() - 0.5) * 8, y = p.y + (R() - 0.5) * 6, tx = Math.floor(x), ty = Math.floor(y);
        if (!inR(Rm.cause, tx, ty) || m.solid[ty * m.w + tx] || m.tiles[ty * m.w + tx] === TID.lava || Math.hypot(x - p.x, y - p.y) < 1.5) continue;
        this.fx.push({ kind: 'zone', x: tx + 1, y: ty + 1, r: 1.1, t: 0, delay: 1.2, life: 1.55, dmg: D(110), by: 'a magma geyser', done: false, colors: ['#ff8a1f', '#ffd650'] });
      }
    }
    // the Sunthief Gate: through its portal to the Eclipse Walk
    const Dd = C.door;
    if (here === 'gate' && !S.through && p.x >= Dd.x0 && p.x <= Dd.x1 + 1 && p.y >= Dd.y0 && p.y <= Dd.y1 + 1) {
      if (m.sealsLeft > 0) { if (!(this.gateT > 0)) { this.gateT = 4; this.banner(`The Sunthief Gate is sealed. Still holding it shut: ${this.sealsHint()}.`, 3000); } }
      else { S.through = this.t; this.fx.push({ kind: 'fade', t: 0, life: 1.0 }); this.sfx('portal'); }
    }
    if (S.through && this.t - S.through >= 0.5 && !S.arrived) {   // (under the fade's darkest)
      S.arrived = true; p.x = C.arrive.x; p.y = C.arrive.y; p.status.invuln = Math.max(p.status.invuln || 0, 2.5);
    }
    if (S.through && here !== 'gate' && here !== 'walk' && here !== 'I') { S.through = 0; S.arrived = false; }   // (back another way: the gate works again)
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
  castleEnter(k) {
    const m = this.map;
    if (k === 'arrival') this.player.status.invuln = Math.max(this.player.status.invuln || 0, 2.5);
    this.banner(k === 'gate' ? (m.sealsLeft > 0 ? 'BEYOND THIS GATE, EVEN LIGHT OBEYS HIM.' : 'STEP THROUGH THE SUNTHIEF GATE.') : NAMES[k], 2200);
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
