// Sunthief's Castle (the user's castle spec, art/sunthiefs_castle_complete_encounter_spec.txt, 1): each room's own hazard
// or objective, and the Grand Sun Door, mixed into Game like gearmech.js. The rooms themselves: src/world/maps.js
// LAYOUT.throne (m.castle.rooms A..I). Nothing here runs while you are dead; every hazard is shown before it hurts.
//   A Breach       safe; its door onto the causeway opens 3 s after you arrive (2.5 s of protection on arrival)
//   B Causeway     a geyser every 4 s on the lanes near you (never where you came in): 1.2 s marked, then it bursts (110)
//   C Gallery      three forge hearts (18,000 each; the dungeon's own, so a shared castle's server has them) fire five slag
//                  every 1.4 s; break all three to raise the portcullis ('BREAK THE THREE FORGE HEARTS — 0/3'); three
//                  sentinels and two brutes rise as you come in, no more
//   D Crowns       jets from the walls: rows across the hall, 1.2 s warming, 0.8 s burning (95, every 0.5 s), 1.0 s
//                  rest, the rows changing each time; the three alcoves are clear of them
//   F Chainwalk    the bridge's ribs crack by turns every 5 s: 1.4 s glowing, then hot for 2 s (90 every 0.5 s)
//   H Sun Door     once its seals are broken (both Jarls and Ashkar): walk into its doorway and a 1.0 s fade takes you
//                  to the Stolen Sun, 2.5 s of grace there
import { R } from './util.js';
import { TID } from './world/maps.js';

const inR = (n, x, y) => n && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
const D = (n) => n + 4;

const methods = {
  castleTick(dt) {
    const m = this.map, C = m.castle, p = this.player;
    if (!C || !C.rooms || p.dead) return;
    const Rm = C.rooms, S = C.st || (C.st = { t0: this.t, geyser: 2, jet: 0, jetK: 0, rib: 2, ribK: 0, hearts: null, wave: 0, said: {} });
    const here = Object.keys(Rm).find((k) => inR(Rm[k], p.x, p.y));
    if (here && !S.said[here]) { S.said[here] = true; this.castleEnter(here); }
    // A: the breach's door
    if (!S.breachOpen && this.t - S.t0 > 3) { S.breachOpen = true; this.castleOpen('breach'); }
    // B: geysers on the lanes near you
    if (here === 'B' && (S.geyser -= dt) <= 0) {
      S.geyser = 4;
      for (let k = 0; k < 2; k++) {
        const x = p.x + (R() - 0.5) * 8, y = p.y + (R() - 0.5) * 6, tx = Math.floor(x), ty = Math.floor(y);
        if (!inR(Rm.B, tx, ty) || m.solid[ty * m.w + tx] || m.tiles[ty * m.w + tx] === TID.lava || Math.hypot(x - p.x, y - p.y) < 1.5 && k) continue;
        this.fx.push({ kind: 'zone', x: tx + 1, y: ty + 1, r: 1.1, t: 0, delay: 1.2, life: 1.55, dmg: D(110), by: 'a magma geyser', done: false, colors: ['#ff8a1f', '#ffd650'] });
      }
    }
    // C: the forge hearts (the dungeon's own: in a shared castle, the server's): all three broken, the portcullis rises
    if (!S.portOpen) {
      const left = this.enemies.filter((q) => q.id === 'forge_heart' && !q.dead && inR(Rm.C, q.x, q.y)).length;
      S.heartsMax = Math.max(S.heartsMax || 0, left);
      if (S.heartsMax && left !== S.heartsLeft) {
        if (S.heartsLeft !== undefined && left < S.heartsLeft && here) this.banner(`BREAK THE THREE FORGE HEARTS — ${3 - left}/3`, 1800);
        S.heartsLeft = left;
        if (!left) { S.portOpen = true; this.castleOpen('port'); if (here) this.banner('The portcullis rises.', 2200); }
      }
    }
    // a gate the server opened (its tile back to the floor): open in this copy too
    for (const w of ['breach', 'port']) for (const o of (C.gates && C.gates[w]) || []) if (o.solid && !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] && m.tiles[Math.floor(o.y) * m.w + Math.floor(o.x)] !== TID.cobble) { o.solid = false; o.sprite = 'gate_open'; }
    // D: the wall jets (rows across the hall; the alcoves are out of their reach)
    if (here === 'D' && (S.jet -= dt) <= 0) {
      S.jet = 3.0; const n = Rm.D, rows = S.jetK++ % 2 ? [3, 9, 15] : [6, 12];
      for (const r of rows) this.fx.push({ kind: 'lane', x: n.x, y: n.y + r + 0.5, a: 0, len: n.w, w: 0.9, delay: 1.2, t: 0, life: 2.0, every: 0.5, dmg: D(95), by: 'the wall jets', hitT: 0, cols: ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'] });
    }
    // F: the ribs crack
    if (here === 'F' && (S.rib -= dt) <= 0) {
      S.rib = 5; const n = Rm.F, k0 = S.ribK++ % 2;
      for (let r = k0 * 3; r < n.h - 1; r += 6) this.fx.push({ kind: 'lane', x: n.x + 8, y: n.y + r + 1.5, a: 0, len: n.w - 16, w: 1.4, delay: 1.4, t: 0, life: 3.4, every: 0.5, dmg: D(90), by: 'a cracked rib', hitT: 0, cols: ['#ff8a1f', '#ff8a1f', '#ffd650', '#ffffff'] });
    }
    // H: the door
    const Dd = C.door;
    if (here === 'H' && !S.through && p.x >= Dd.x0 && p.x <= Dd.x1 + 1 && p.y >= Dd.y0 && p.y <= Dd.y1 + 1) {
      if (m.sealsLeft > 0) { if (!(this.gateT > 0)) { this.gateT = 4; this.banner(`The Sun Door is sealed. Still holding it shut: ${this.sealsHint()}.`, 3000); } }
      else { S.through = this.t; this.fx.push({ kind: 'fade', t: 0, life: 1.0 }); this.sfx('portal'); }
    }
    if (S.through && this.t - S.through >= 0.5 && !S.arrived) {   // (under the fade's darkest)
      S.arrived = true; const I = Rm.I;
      p.x = I.cx + 0.5; p.y = I.y + I.h - 5; p.status.invuln = Math.max(p.status.invuln || 0, 2.5);
    }
  },
  castleEnter(k) {
    const m = this.map, Rm = m.castle.rooms, S = m.castle.st;
    if (k === 'A') { this.player.status.invuln = Math.max(this.player.status.invuln || 0, 2.5); this.banner('THE BREACH', 2000); }
    if (k === 'B') this.banner('THE CINDER CAUSEWAY', 1800);
    if (k === 'C' && !S.portOpen) this.banner('BREAK THE THREE FORGE HEARTS — 0/3', 2600);
    if (k === 'D') this.banner('THE HALL OF BROKEN CROWNS', 1800);
    if (k === 'F') this.banner('THE CHAINWALK', 1800);
    if (k === 'H') this.banner(m.sealsLeft > 0 ? 'BEYOND THIS GATE, EVEN LIGHT OBEYS HIM.' : 'STEP THROUGH THE SUN DOOR.', 2600);
    if (k === 'I') this.banner('THE STOLEN SUN', 2000);
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
