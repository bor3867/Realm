// The Giant Watermelon (Realm Update, melon_event): a very rare realm object. No attacks; you break it open for
// a slice or three and a chance at the melon items. Mixed into Game like dungeons4.js and bossx.js.
//   spawns  in the Greenmarch or the Thornwood, on open ground, never near you; one at a time; announced
//   lasts   10 minutes, then rots away
//   breaks  cracked at 66% and 33%, bursts at 0, and the loot lands on the burst's last frame; the two halves
//           lie in their juice for 20 s
import { rng } from './util.js';
import { BIOMES, TID, randomTileInBiome, isSolid } from './world/maps.js';
import { ITEMS } from './data/items.js';

export const MELON = {
  every: 20,           // seconds between spawn checks
  p: 0.004,            // chance per check: the bundle's figure; a median of about an hour of realm time
  life: 600,           // seconds before it rots away
  open: 20,            // seconds the halves lie on the ground
  dropAt: 0.5,         // the burst clip (4 frames at 8 fps): the loot lands on its last frame
  // the drop: always 1-3 slices, then independent rolls (the bundle's proposal, kept: it's a rare event)
  slices: [1, 3],
  rolls: [
    { p: 0.35, one: ['melon_slicer', 'rindguard', 'vinegrown_staff', 'ring_of_the_rind'] },
    { p: 0.25, one: ['honeydew_scepter', 'dewveil_robe', 'melon_baller'] },
    { p: 0.06, one: ['seedspitter_bow', 'rind_bulwark', 'dewdrop_ring'] },
    { p: 0.01, one: ['golden_honeydew'] },
  ],
};
const ART = 'mx_giant_watermelon/giant_watermelon';
const R = rng((Date.now() ^ 0x6d656c6f) >>> 0);

const methods = {
  melonAlive() { return this.enemies.find((e) => e.D.melon && !e.dead); },
  // a spot in the Greenmarch or the Thornwood: open, walkable ground with room for a 3x2 fruit
  melonSpot(avoid, minD = 25) {
    const m = this.map;
    for (let k = 0; k < 40; k++) {
      const b = R() < 0.6 ? BIOMES.indexOf('lowlands') : BIOMES.indexOf('thornwood');
      const at = randomTileInBiome(m, b, R, avoid, minD);
      if (!at) continue;
      const t = m.tiles[Math.floor(at.y) * m.w + Math.floor(at.x)];
      if (t !== TID.grass && t !== TID.loam) continue;
      let ok = true;
      for (let dy = -1; dy <= 0 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) if (isSolid(m, at.x + dx, at.y + dy)) ok = false;
      if (ok) return at;
    }
    return null;
  },
  spawnMelon(at, announce = true) {
    if (!at || this.melonAlive()) return null;
    const e = this.addEnemy('giant_watermelon', at.x, at.y);
    e.hitUp = 0.6; e.melonUntil = this.t + MELON.life;
    if (announce) { this.banner('A Giant Watermelon has ripened somewhere in the realm!', 4200); this.sfx('rare'); }
    return e;
  },
  // every frame in the realm: the rare spawn check, rotting, the delayed drop, and the halves fading away
  melonTick(dt) {
    const m = this.map;
    m.melonCheck = (m.melonCheck === undefined ? MELON.every : m.melonCheck) - dt;
    if (m.melonCheck <= 0) {
      m.melonCheck = MELON.every;
      if (!this.melonAlive() && R() < MELON.p) this.spawnMelon(this.melonSpot(this.player));
    }
    const e = this.melonAlive();
    if (e && this.t > e.melonUntil) {                        // rotted: it just sinks away
      e.dead = true; e.deadT = 9; e.rotted = true;
      this.vx({ k: 'burst', x: e.x, y: e.y - 0.4, n: 20, colors: ['#4a6a2a', '#8a6a3a', '#3a3a2a'] });
    }
    for (const d of m.melonDrops || []) if (!d.done && this.t >= d.at) { d.done = true; this.addBag(d.x, d.y + 0.6, d.items); }
    if (m.melonDrops) m.melonDrops = m.melonDrops.filter((d) => !d.done);
    if (m.objects.some((o) => o.melonOpen && this.t > o.until)) { m.objects = m.objects.filter((o) => !o.melonOpen || this.t <= o.until); m.ogridDirty = true; }
  },
  melonLoot() {
    const items = [];
    for (let k = R.int(MELON.slices[0], MELON.slices[1]); k > 0; k--) items.push('watermelon_slice');
    for (const r of MELON.rolls) if (R() < r.p) items.push(R.pick(r.one));
    return items.filter((id) => ITEMS[id]);
  },
  // the fruit bursts: juice everywhere; the loot lands as the burst ends, and the halves stay a while
  melonBurst(e) {
    const m = this.map;
    for (const dx of [-1.3, 1.3]) this.vx({ k: 'regfx', key: 'mx_effects/juice_splash', x: e.x + dx, y: e.y - 0.2, fps: 10 });   // a splash each side: the burst itself stays in view
    this.vx({ k: 'shake', amt: 3 });
    (m.melonDrops = m.melonDrops || []).push({ x: e.x, y: e.y, at: this.t + MELON.dropAt, items: this.melonLoot() });
    m.objects.push({ sprite: ART, x: e.x, y: e.y, solid: false, melonOpen: true, born: this.t + MELON.dropAt, until: this.t + MELON.dropAt + MELON.open });
    m.ogridDirty = true;
    this.banner('The Giant Watermelon bursts open!', 2400);
  },
};

export function installMelon(Game) { Object.assign(Game.prototype, methods); }
