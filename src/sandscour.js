// Sandscour Tomb's own systems (docs/design/dungeon_sandscour.md), mixed into Game like frostveil.js.
//   quicksand   slows you and drags you toward the middle of the pit
//   urns        shoot one open: a third hold a swarm of scarabs, the rest a little gold or a potion
//   sarcophagi  a sealed one opens as you pass, and a mummy steps out
//   the vault   a wall of sand across its door crumbles when the burial chamber's last mummy falls
import { TID, SK } from './world/maps.js';

export const SAND = { pull: 1.1, drag: 0.55, sarcR: 3, sarcRise: 0.5, urnScarabs: 1 / 3 };

const methods = {
  updateSandscour(dt) {
    const m = this.map, p = this.player;
    // quicksand: the pull toward the pit's middle
    if (!p.dead && m.tiles[Math.floor(p.y) * m.w + Math.floor(p.x)] === TID.quicksand && m.sdPits) {
      let best = null, bd = 64;
      for (const [x, y] of m.sdPits) { const d = (x - p.x) ** 2 + (y - p.y) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
      if (best && bd > 0.04) { const d = Math.sqrt(bd); this.moveCircle(p, ((best[0] - p.x) / d) * SAND.pull * dt, ((best[1] - p.y) / d) * SAND.pull * dt, 0.32); }
      if (Math.random() < dt * 5) this.vx({ k: 'regfx', key: 'ex_effects/sand_puff', x: p.x, y: p.y, fps: 10 });
    }
    // sarcophagi open as you pass
    if (!m.sdSarcs) m.sdSarcs = m.objects.filter((o) => o.sdSarc);
    for (const o of m.sdSarcs) {
      if (o.openT === undefined) {
        const reach = o.burial ? SAND.sarcR + 1.5 : SAND.sarcR;          // the burial chamber's wake from its lanes
        if (!p.dead && Math.hypot(o.x - p.x, o.y - p.y) < reach) { o.openT = this.t; this.vx({ k: 'regfx', key: 'ex_effects/sand_puff', x: o.x, y: o.y - 0.4, fps: 10 }); }
      } else if (!o.risen && this.t - o.openT > SAND.sarcRise) {
        o.risen = true;
        const e = this.addEnemy('sand_mummy', o.x, o.y + 0.9);
        e.hp = e.maxHp = Math.round(e.hp * (m.def.mobHp || 1)); e.seen = true; e.born = this.t;
        if (o.burial) e.sdBurial = true;
      }
    }
    // the vault: open when every burial sarcophagus has given up its mummy and every one of them is dead
    if (m.sdSeal && !m.sdVaultOpen) {
      const left = m.sdSarcs.filter((o) => o.burial && !o.risen).length, alive = this.enemies.filter((e) => e.sdBurial && !e.dead).length;
      if (!left && !alive) {
        m.sdVaultOpen = true;
        for (const i of m.sdSeal) { m.tiles[i] = TID.sdtomb; m.solid[i] = 0; if (m.skin) m.skin[i] = SK.sandscour_tomb_floor; if (Math.random() < 0.5) this.vx({ k: 'regfx', key: 'ex_effects/sand_puff', x: (i % m.w) + 0.5, y: Math.floor(i / m.w) + 0.5, fps: 8 }); }
        m.miniDirty = true;
        this.banner('The burial chamber is quiet. The vault\'s seal of sand crumbles.', 3000); this.sfx('rare');
      }
    }
  },
  // a shot hits an urn: it cracks, and on the third hit it breaks
  hitUrn(o) {
    const m = this.map;
    o.hp = (o.hp || 3) - 1; o.cracked = true;
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 4, colors: ['#c89a5a', '#8a6a3a'] });
    if (o.hp > 0) return;
    m.objects.splice(m.objects.indexOf(o), 1); m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0; m.ogridDirty = true;
    this.vx({ k: 'regfx', key: 'ex_effects/sand_puff', x: o.x, y: o.y - 0.3, fps: 10 });
    if (Math.random() < SAND.urnScarabs) {                     // trapped: a swarm pours out
      for (let k = 0; k < 4; k++) { const e = this.addEnemy('tomb_scarab', o.x + (Math.random() - 0.5), o.y + (Math.random() - 0.5)); e.hp = e.maxHp = Math.round(e.hp * (m.def.mobHp || 1)); e.seen = true; }
      this.float(o.x, o.y - 1, 'SCARABS!', '#ffd650');
    } else if (Math.random() < 0.3) this.addBag(o.x, o.y, ['pot_hp']);
    else { const g0 = 5 + Math.floor(Math.random() * 11); this.save.gold = (this.save.gold || 0) + g0; this.float(o.x, o.y - 1, `+${g0}g`, '#f2c14e'); this.sfx('coin'); }
  },
};

export function installSandscour(Game) { Object.assign(Game.prototype, methods); }
