// Realm events on the boss framework (Phase 2f): the Abyssal Kraken off the Drowned Shore and the Thornheart
// Treant deep in the Thornwood. Each rolls on its own clock, raises its arena out of the land the first time
// (and wakes in the same one after that), and announces itself. The fights live in src/bosses/<boss>.js.
import { BIOMES, TID, SKIN_TID, SK, randomTileInBiome } from './world/maps.js';
import { bxEnemyDef } from './bosses/index.js';

const R = Math.random;
export const EVENT_BOSSES = {
  abyssal_kraken: { first: 300, every: [900, 1500], say: 'The Abyssal Kraken rises off the coast!' },
  thornheart_treant: { first: 300, every: [900, 1500], say: 'The Thornheart Treant wakes deep in the Thornwood!' },
};

const methods = {
  // the map's own tile setter for event terrain: tile, skin and walkability together
  evSet(x, y, tid, skin = 0) {
    const m = this.map, i = y * m.w + x;
    m.tiles[i] = tid; m.skin[i] = SKIN_TID[skin] === tid ? skin : 0;
    m.solid[i] = tid === TID.water || tid === TID.deep || tid === TID.cliff ? 1 : 0;
  },
  // ---- the Kraken's reef: a deep pool (radius 4) inside a ring of shallows (to 11), a causeway to the beach
  krakenArena() {
    const m = this.map;
    if (m.krakenArena) return m.krakenArena;
    const C = m.w / 2;
    for (let tries = 0; tries < 80; tries++) {
      const at = randomTileInBiome(m, 0, { int: (a, b) => a + Math.floor(R() * (b - a + 1)) }, null, 0);
      if (!at) continue;
      // walk out to sea from this bit of shore, then a little further
      const a = Math.atan2(at.y - C, at.x - C);
      let x = at.x, y = at.y, wet = 0, shore = null;
      for (let s = 0; s < 60; s++) {
        x += Math.cos(a); y += Math.sin(a);
        const t = m.tiles[Math.floor(y) * m.w + Math.floor(x)];
        if (t === TID.water || t === TID.deep) { if (!wet) shore = { x: x - Math.cos(a) * 2, y: y - Math.sin(a) * 2 }; wet++; } else wet = 0;
        if (wet >= 14) break;
      }
      if (wet < 14) continue;
      const cx = Math.floor(x), cy = Math.floor(y);
      if (cx < 14 || cy < 14 || cx > m.w - 15 || cy > m.h - 15) continue;
      let open = true;                                   // the reef sits in open water
      for (let yy = -11; yy <= 11 && open; yy++) for (let xx = -11; xx <= 11 && open; xx++) {
        if (xx * xx + yy * yy > 121) continue;
        const t = m.tiles[(cy + yy) * m.w + cx + xx];
        if (t !== TID.water && t !== TID.deep) open = false;
      }
      if (!open) continue;
      for (let yy = -12; yy <= 12; yy++) for (let xx = -12; xx <= 12; xx++) {
        const d = Math.hypot(xx, yy);
        if (d < 4.2) this.evSet(cx + xx, cy + yy, TID.deep, SK['deep_water@deep']);
        else if (d < 11.5) { this.evSet(cx + xx, cy + yy, TID.shallows, SK.shallows); m.biome[(cy + yy) * m.w + cx + xx] = 0; }
      }
      // the causeway: three tiles of shallows back to the beach
      const sx = shore.x, sy = shore.y, L = Math.hypot(cx - sx, cy - sy);
      for (let s = 0; s <= L; s += 0.5) {
        const px = sx + ((cx - sx) * s) / L, py = sy + ((cy - sy) * s) / L;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const X = Math.floor(px) + ox, Y = Math.floor(py) + oy, t = m.tiles[Y * m.w + X];
          if ((t === TID.water || t === TID.deep) && Math.hypot(X - cx, Y - cy) > 6) { this.evSet(X, Y, TID.shallows, SK.shallows); m.biome[Y * m.w + X] = 0; }   // (never into the pool)
        }
      }
      m.miniDirty = true;
      return (m.krakenArena = { x: cx + 0.5, y: cy + 0.5, box: { x: cx - 12, y: cy - 12, w: 25, h: 25 } });
    }
    return null;
  },
  // ---- the Treant's clearing: as deep in the Thornwood as can be found, ringed by elders with four ways in
  treantArena() {
    const m = this.map;
    if (m.treantArena) return m.treantArena;
    const b = BIOMES.indexOf('thornwood'), rr = { int: (a, c) => a + Math.floor(R() * (c - a + 1)) };
    let best = null, bd = -1;
    for (let k = 0; k < 160; k++) {
      const at = randomTileInBiome(m, b, rr, null, 0);
      if (!at) continue;
      const x = Math.floor(at.x), y = Math.floor(at.y);
      let d = 0;                                          // how far to the edge of the wood (in rings of tiles, up to 40)
      ring: for (d = 1; d <= 40; d++) for (let a = 0; a < 24; a++) {
        const X = Math.round(x + Math.cos((a / 24) * Math.PI * 2) * d), Y = Math.round(y + Math.sin((a / 24) * Math.PI * 2) * d);
        if (m.biome[Y * m.w + X] !== b) break ring;
      }
      if (d > bd) { bd = d; best = { x, y }; }
    }
    if (!best || bd < 14) return null;
    const { x: cx, y: cy } = best;
    m.objects = m.objects.filter((o) => Math.hypot(o.x - cx - 0.5, o.y - cy - 0.5) > 13.8);
    if (m.decor) { m.decor = m.decor.filter((d) => Math.hypot(d.x - cx, d.y - cy) > 12); m.decorAt = null; }
    for (let yy = -14; yy <= 14; yy++) for (let xx = -14; xx <= 14; xx++) {
      const d = Math.hypot(xx, yy), X = cx + xx, Y = cy + yy;
      if (d < 13.5) this.evSet(X, Y, TID.loam, ((X * 7 + Y * 13) % 5) < 2 ? SK.leaf_litter : SK.forest_floor);
    }
    for (let k = 0; k < 44; k++) {                       // the ring of elders, with a way in at each quarter
      const a = (k / 44) * Math.PI * 2, q = a % (Math.PI / 2);
      if (Math.min(q, Math.PI / 2 - q) < 0.2) continue;
      const rr2 = 12.4 + (k % 2) * 0.9, X = Math.round(cx + Math.cos(a) * rr2), Y = Math.round(cy + Math.sin(a) * rr2);
      m.objects.push({ sprite: 'ow_objects/midlands_elder_tree', x: X + 0.5, y: Y + 0.5, solid: true });
      m.solid[Y * m.w + X] = 1;
    }
    m.ogridDirty = true; m.miniDirty = true;
    return (m.treantArena = { x: cx + 0.5, y: cy + 0.5, box: { x: cx - 11, y: cy - 11, w: 23, h: 23 } });
  },
  // when the Kraken dies its pool drains, ring by ring from the edge in, to shallows you can wade (its loot lands in
  // the middle); the next time it rises the pool is deep again
  krakenDrain() {
    const m = this.map, A = m.krakenArena;
    if (!A) return;
    const cx = Math.floor(A.x), cy = Math.floor(A.y);
    m.krakenDrained = true;
    for (let r = 5; r >= 0; r--) this.fvLater((5 - r) * 0.55, () => {
      for (let yy = -r - 1; yy <= r + 1; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
        const d = Math.hypot(xx, yy), i = (cy + yy) * m.w + cx + xx;
        if (d > r - 0.5 && d <= r + 0.5 && m.tiles[i] === TID.deep) { this.evSet(cx + xx, cy + yy, TID.shallows, SK.shallows); m.biome[i] = 0; }
      }
      this.vx({ k: 'burst', x: cx + 0.5, y: cy + 0.5, n: 10, colors: ['#c8eeff', '#7ec0e4', '#ffffff'] });
      m.miniDirty = true;
    });
  },
  krakenRefill() {
    const m = this.map, A = m.krakenArena;
    if (!A || !m.krakenDrained) return;
    m.krakenDrained = false;
    const cx = Math.floor(A.x), cy = Math.floor(A.y);
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) if (Math.hypot(xx, yy) < 4.2) this.evSet(cx + xx, cy + yy, TID.deep, SK['deep_water@deep']);
    m.miniDirty = true;
  },
  // raise an event boss: its arena, the boss asleep in it, the announcement
  spawnEventBoss(id, announce = true) {
    if (this.enemies.some((e) => e.D.bx === id && !e.dead)) return null;
    const A = id === 'abyssal_kraken' ? this.krakenArena() : this.treantArena();
    if (!A) return null;
    if (id === 'abyssal_kraken') this.krakenRefill();
    const e = this.spawnRealmBoss(id, { x: A.x, y: A.y }, bxEnemyDef(id));
    if (!e) return null;
    e.state = 'sleep'; e.room = A.box; e.home = { x: A.x, y: A.y };
    if (announce) { this.banner(EVENT_BOSSES[id].say, 4200); this.sfx('boss'); }
    return e;
  },
  // each event boss rolls on its own clock while none is alive
  eventBossTick() {
    const m = this.map;
    m.evb = m.evb || Object.fromEntries(Object.entries(EVENT_BOSSES).map(([id, E]) => [id, this.t + E.first + R() * 120]));
    for (const [id, E] of Object.entries(EVENT_BOSSES)) {
      if (this.t < m.evb[id]) continue;
      m.evb[id] = this.t + E.every[0] + R() * (E.every[1] - E.every[0]);
      this.spawnEventBoss(id);
    }
  },
};

export function installRealmEvents(Game) { Object.assign(Game.prototype, methods); }
