// The Crimson Keep's own systems (docs/design/dungeon_crimson_keep.md), mixed into Game like frostveil.js.
//   candlelight  candelabras light pools of floor; blood thralls standing in one take double damage
//   coffins      a sealed coffin opens when you pass it in the dark, and a thrall climbs out
//   statues      some of the stands and gargoyles are real: they wake after you've walked past them
//   ledges       gargoyles perched on the courtyard's walls drop when you come beneath them
//   the gallery  opening its chest wakes three of its stands at once
//   the crypt    once you step in, its coffins open one after another
//   blood pools  slow you and drain you
import { TID } from './world/maps.js';

export const KEEP = { light: 3, coffinR: 3, statueNear: 2.5, statueFar: 4, ledgeR: 4, cryptEvery: 1.2, bloodDmg: 6, bloodTick: 0.5 };
const THRALLS = new Set(['blood_thrall', 'kneeling_thrall']);

const methods = {
  // is this spot in a candle's light?
  ckLit(x, y) {
    const m = this.map;
    if (!m.ckCandles) m.ckCandles = m.objects.filter((o) => o.sprite === 'd2_decor/crimson_keep_candelabra');
    for (const o of m.ckCandles) if ((o.x - x) ** 2 + (o.y - y) ** 2 < KEEP.light * KEEP.light) return true;
    return false;
  },
  // a thrall in the light takes double damage
  ckDamage(e, d) {
    if (!THRALLS.has(e.id) || !this.map.ckCandles || !this.ckLit(e.x, e.y)) return d;
    if (Math.random() < 0.5) this.vx({ k: 'burst', x: e.x, y: e.y - 0.6, n: 3, colors: ['#5a4a4a', '#c8b0a0'] });
    return d * 2;
  },
  ckSpawn(id, x, y) {
    const e = this.addEnemy(id, x, y), m = this.map;
    e.hp = e.maxHp = Math.round(e.hp * ((m.def && m.def.mobHp) || 1)); e.seen = true; e.born = this.t;
    return e;
  },
  ckOpen(o) {
    if (o.openT !== undefined) return;
    o.openT = this.t;
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 10, colors: ['#3a1a20', '#8e1e30', '#c8b0a0'] });
    this.fvLater(0.6, () => this.ckSpawn('blood_thrall', o.x, o.y + 1));
  },
  ckWake(o) {
    const m = this.map;
    m.objects.splice(m.objects.indexOf(o), 1); m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] = 0; m.ogridDirty = true;
    this.ckSpawn(o.ckStatue === 'gargoyle' ? 'gargoyle' : 'haunted_armor', o.x, o.y + 0.2);
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 14, colors: ['#8a8a9a', '#c8c8d8', '#3a3a4a'] });
  },
  updateKeep(dt) {
    const m = this.map, p = this.player;
    if (!m.ckCoffins) { m.ckCoffins = m.objects.filter((o) => o.ckCoffin); m.ckStatues = m.objects.filter((o) => o.ckStatue && o.real && !o.gallery); m.ckLedges = m.objects.filter((o) => o.ckLedge); }
    if (!p.dead) {
      const dark = !this.ckLit(p.x, p.y);
      for (const o of m.ckCoffins) if (!o.crypt && o.openT === undefined && dark && Math.hypot(o.x - p.x, o.y - p.y) < KEEP.coffinR) this.ckOpen(o);
      for (const o of m.ckStatues) {                         // the real ones come for you after you've passed
        if (o.woke) continue;
        const d = Math.hypot(o.x - p.x, o.y - p.y);
        if (d < KEEP.statueNear) o.passed = true;
        else if (o.passed && d > KEEP.statueFar) { o.woke = true; this.ckWake(o); }
      }
      for (const o of m.ckLedges) if (!o.woke && Math.hypot(o.x - p.x, o.y - p.y) < KEEP.ledgeR) {   // gargoyles drop from the ledges
        o.woke = true; m.objects.splice(m.objects.indexOf(o), 1); m.ogridDirty = true;
        const below = o.y + (m.solid[(Math.floor(o.y) + 1) * m.w + Math.floor(o.x)] ? -1.2 : 1.2);
        const e = this.ckSpawn('gargoyle', o.x, below); e.z = 18;
        this.vx({ k: 'burst', x: o.x, y: below, n: 10, colors: ['#8a8a9a', '#5a5a6a'] });
      }
      // blood pools slow (in the movement code) and drain
      if (m.tiles[Math.floor(p.y) * m.w + Math.floor(p.x)] === TID.ckblood && (p.bloodT = (p.bloodT || 0) - dt) <= 0) { p.bloodT = KEEP.bloodTick; this.hurtPlayer(KEEP.bloodDmg, 'a pool of blood', true); }
    }
    // the gallery: its chest opened, three stands step down at once
    const Gy = m.ckGallery;
    if (Gy && !Gy.woke && m.objects.some((o) => o.interact === 'chest' && o.opened && o.x > Gy.x && o.x < Gy.x + Gy.w && o.y > Gy.y && o.y < Gy.y + Gy.h)) {
      Gy.woke = true;
      for (const o of m.objects.filter((q) => q.gallery && q.real)) this.ckWake(o);
      this.banner('The armor steps down from its stands!', 2200); this.vx({ k: 'shake', amt: 4 }); this.sfx('boss');
    }
    // the crypt: step in and the coffins open one after another
    const Cr = m.ckCrypt;
    if (Cr && !Cr.started && p.x > Cr.x + 1 && p.x < Cr.x + Cr.w - 1 && p.y > Cr.y && p.y < Cr.y + Cr.h) {
      Cr.started = true;
      const row = m.ckCoffins.filter((o) => o.crypt).sort((a, b) => a.x - b.x || a.y - b.y);
      row.forEach((o, k) => this.fvLater(0.8 + k * KEEP.cryptEvery, () => { this.ckOpen(o); this.sfx('hit'); }));
      this.banner('A bell tolls somewhere below. The coffins are opening.', 2400);
    }
  },
};

export function installKeep(Game) { Object.assign(Game.prototype, methods); }
