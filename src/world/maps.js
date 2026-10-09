// Map generation: the Nexus (hub), the Realm (procedural island), the Drowned Forge (dungeon).
import { rng, noise2, dist } from '../util.js';

export const TILE_NAMES = ['water', 'deep', 'sand', 'fen', 'mud', 'snow', 'runefloor', 'runeglyph',
  'ash', 'obsidian', 'marble', 'forge', 'forgewall', 'lava', 'void', 'chapelfloor', 'chapelwall', 'goldvein', 'ribwall',
  'grass', 'cobble', 'dirt', 'hedge', 'shallows', 'bog', 'ice', 'dune', 'glassflat', 'loam', 'bramble', 'steppe', 'quartz',
  'cryptfloor', 'cryptwall', 'cryptwater', 'emberfloor', 'emberwall', 'emberlava', 'carpet',
  'combfloor', 'waxwall', 'honey', 'stageboards', 'velvetwall', 'prismfloor', 'crystalwall', 'dreamfloor', 'dreamwall', 'starvoid', 'dreambridge', 'fadebridge', 'fadegone'];
export const TID = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));
const SOLID_TILES = new Set([TID.water, TID.deep, TID.forgewall, TID.void, TID.chapelwall, TID.ribwall, TID.hedge, TID.bramble, TID.cryptwall, TID.emberwall, TID.cryptwater,
  TID.waxwall, TID.velvetwall, TID.crystalwall, TID.dreamwall, TID.starvoid, TID.fadegone]);
export const BIOMES = ['shore', 'fen', 'runeholt', 'godfall', 'dunes', 'thornwood', 'steppe'];
// how deep in each land lies: 0 the coast ... 3 the god's fall. The three newer lands share a ring with an older one.
export const BIOME_RING = [0, 1, 2, 3, 0, 1, 2];
export const BIOME_LABEL = { shore: 'The Drowned Shore', fen: 'Ashfen', runeholt: 'Runeholt', godfall: 'Godfall',
  dunes: 'The Saltglass Dunes', thornwood: 'The Thornwood', steppe: 'The Crystal Steppe' };

function makeMap(kind, name, w, h, fill) {
  return {
    kind, name, w, h,
    tiles: new Uint8Array(w * h).fill(fill),
    solid: new Uint8Array(w * h),
    biome: new Int8Array(w * h).fill(-1),
    objects: [],          // {sprite, x, y, solid, interact?}
    spawn: { x: w / 2, y: h / 2 },
  };
}
export const idx = (m, x, y) => y * m.w + x;
export function isSolid(m, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= m.w || yi >= m.h) return true;
  return m.solid[yi * m.w + xi] === 1;
}
function finalize(m) {
  for (let i = 0; i < m.tiles.length; i++) if (SOLID_TILES.has(m.tiles[i])) m.solid[i] = 1;
  for (const o of m.objects) if (o.solid) m.solid[idx(m, Math.floor(o.x), Math.floor(o.y))] = 1;
  return m;
}
function put(m, sprite, x, y, solid = true, extra = {}) {
  m.objects.push({ sprite, x: x + 0.5, y: y + 0.5, solid, ...extra });
}

// ------------------------------------------------------------------ NEXUS
// A hamlet at dusk in a hedged meadow. The firepit is the heart of town; cobbled lanes
// run north to the realm gate, west to your vault, east to the market and south to the
// smithy. A fenced training yard (NW) has dummies to test your damage on; there's a
// pond (NE), cottages, an inn, oaks and lamp posts. Everyone rests here.
function wallUp(m) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const i = idx(m, x, y);
    if (m.tiles[i] !== TID.void) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => {
      const xx = x + dx, yy = y + dy;
      return xx >= 0 && yy >= 0 && xx < m.w && yy < m.h && m.tiles[idx(m, xx, yy)] === TID.marble;
    });
    if (near) m.tiles[i] = TID.forgewall;
  }
}
// 32x32 set pieces stand on a 2-tile solid base
function bigProp(m, name, x, y) {
  m.objects.push({ sprite: 'lm:' + name, x, y: y + 0.5, solid: false, big: true });
  m.solid[idx(m, x - 1, y)] = 1; m.solid[idx(m, x, y)] = 1;
}
export function nexus() {
  const W = 76, H = 48, CX = 27, CY = 24;               // the meadow, plus the Pet Yard clearing out east
  const m = makeMap('nexus', 'The Nexus', W, H, TID.hedge);
  const r = rng(0x7e55);
  const set = (x, y, t) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m.tiles[idx(m, x, y)] = t; };
  // the meadow: a ragged oval clearing in the hedge
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const d = ((x - CX) / 24.5) ** 2 + ((y - CY) / 21.5) ** 2 + (Math.sin(x * 0.9) + Math.cos(y * 1.3)) * 0.03;
    if (d < 1) set(x, y, TID.grass);
  }
  // the Pet Yard: a second clearing east of the market, joined by a cobbled path through the hedge
  const YX = 63, YY = CY;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (((x - YX) / 10.5) ** 2 + ((y - YY) / 10) ** 2 + (Math.sin(x * 1.1) + Math.cos(y * 0.9)) * 0.03 < 1) set(x, y, TID.grass);
  }
  for (let y = CY - 1; y <= CY + 1; y++) for (let x = CX + 15; x <= YX - 6; x++) set(x, y, TID.cobble);
  // lanes
  const lane = (x0, y0, x1, y1, w, t) => {
    for (let y = Math.min(y0, y1) - w; y <= Math.max(y0, y1) + w; y++) for (let x = Math.min(x0, x1) - w; x <= Math.max(x0, x1) + w; x++) {
      if (m.tiles[idx(m, x, y)] !== TID.hedge) set(x, y, t);
    }
  };
  lane(CX, 4, CX, CY, 1, TID.cobble);                         // north to the realm gate
  lane(4, CY, CX, CY, 1, TID.cobble);                         // west to the vault
  lane(CX, CY, CX + 15, CY, 1, TID.cobble);                   // east to the market
  lane(CX, CY, CX, CY + 15, 1, TID.cobble);                   // south to the smithy
  lane(CX - 13, 14, CX - 13, CY - 2, 0, TID.dirt);            // dirt track up to the training yard
  lane(CX - 13, CY - 2, CX - 2, CY - 2, 0, TID.dirt);
  lane(CX + 6, CY - 9, CX + 11, CY - 9, 0, TID.dirt);         // track to the pond
  lane(CX + 6, CY - 9, CX + 6, CY - 2, 0, TID.dirt);
  // the firepit plaza
  for (let y = CY - 5; y <= CY + 5; y++) for (let x = CX - 5; x <= CX + 5; x++) if (dist(x, y, CX, CY) < 5.2) set(x, y, TID.cobble);
  // the training yard (NW): packed dirt, fenced
  const TX0 = 6, TY0 = 7, TX1 = 18, TY1 = 14;
  for (let y = TY0; y <= TY1; y++) for (let x = TX0; x <= TX1; x++) set(x, y, TID.dirt);
  // the pond (NE)
  const PX = CX + 15, PY = CY - 11;
  for (let y = PY - 4; y <= PY + 4; y++) for (let x = PX - 6; x <= PX + 6; x++) {
    const d = ((x - PX) / 5.2) ** 2 + ((y - PY) / 3.4) ** 2;
    if (d < 1) set(x, y, d < 0.45 ? TID.deep : TID.water);
  }
  // ---- props
  put(m, 'campfire', CX, CY, true);
  put(m, 'bench_h', CX, CY - 3, false); put(m, 'bench_h', CX, CY + 3, false);
  put(m, 'bench_v', CX - 3, CY, false); put(m, 'bench_v', CX + 3, CY, false);
  put(m, 'well', CX + 6, CY + 5, true, { interact: 'fountain', label: 'Drink from the well (heals)' });
  for (const [x, y] of [[CX - 2, 5], [CX + 2, 5], [CX - 2, 13], [CX + 2, 13], [5, CY - 2], [5, CY + 2], [13, CY - 2], [13, CY + 2],
    [CX + 9, CY - 2], [CX + 9, CY + 2], [CX - 2, CY + 9], [CX + 2, CY + 9], [CX - 5, CY - 5], [CX + 5, CY - 5], [CX - 5, CY + 5]]) put(m, 'lamppost', x, y, true);
  // realm gate (north) and vault door (west)
  m.portals = [
    { kind: 'realm', x: CX + 0.5, y: 3.5, label: 'Realm Portal', to: 'realm' },
    { kind: 'vault', x: 3.5, y: CY + 0.5, label: 'Your Vault', to: 'vault' },
  ];
  // the market (east): the Salt-Peddler's stall
  bigProp(m, 'market', CX + 16, CY - 1);
  put(m, 'merchant', CX + 15, CY + 2, true, { interact: 'shop', label: 'Trade with the Salt-Peddler' });
  for (const [x, y, s] of [[CX + 18, CY + 2, 'barrel'], [CX + 19, CY + 1, 'crate'], [CX + 13, CY - 2, 'crate'], [CX + 19, CY - 3, 'barrel']]) put(m, s, x, y, true);
  // the smithy (south)
  bigProp(m, 'smithy', CX + 1, CY + 17);
  put(m, 'smith', CX - 3, CY + 15, true, { interact: 'forge', label: 'Use the Forge' });
  put(m, 'anvil_block', CX + 4, CY + 15, true);
  put(m, 'barrel', CX - 5, CY + 17, true); put(m, 'crate', CX + 5, CY + 17, true);
  // homes, the inn, oaks
  bigProp(m, 'house', CX - 9, CY - 7);
  bigProp(m, 'inn', CX + 10, CY + 9);
  bigProp(m, 'house', CX - 11, CY + 10);
  bigProp(m, 'cottage', CX - 17, CY + 4);
  for (const [x, y] of [[CX - 20, CY - 10], [CX + 21, CY + 6], [CX - 6, CY + 19], [CX + 12, CY + 16], [CX - 19, CY + 15], [CX + 8, CY - 15], [CX - 4, CY - 13]]) bigProp(m, 'oak', x, y);
  // the training yard: fence, dummies, hay, a sign
  for (let x = TX0; x <= TX1; x++) {
    put(m, 'fence_h', x, TY0 - 1, true);
    if (Math.abs(x - 12) > 1) put(m, 'fence_h', x, TY1 + 1, true);
  }
  for (let y = TY0; y <= TY1; y++) { put(m, 'fence_v', TX0 - 1, y, true); put(m, 'fence_v', TX1 + 1, y, true); }
  m.dummies = [[TX0 + 2.5, TY0 + 2.5], [TX0 + 6.5, TY0 + 1.5], [TX0 + 10.5, TY0 + 2.5], [TX0 + 4.5, TY0 + 5.5], [TX0 + 8.5, TY0 + 5.5]];
  put(m, 'haybale', TX0, TY1, true); put(m, 'haybale', TX1, TY0, true);
  put(m, 'signpost', 14, TY1 + 2, true, { label: 'Training yard: hit the dummies to read your damage per second' });
  put(m, 'board', CX + 8, CY - 3, true, { interact: 'board', label: 'Read the quest board' });       // quests
  put(m, 'bard', CX - 3, CY - 3, true, { interact: 'bard', label: 'Listen to the bard' });            // a bard by the fire
  bigProp(m, 'tent', CX - 15, CY - 1);                                                                // the fortune teller
  put(m, 'pedestal', CX - 15, CY + 1, true, { interact: 'fortune', label: 'Have your fortune told (100 gold)', hidden: true });
  // the trophy hall: a pedestal for every great foe; the ones you've beaten wear their statue
  m.trophySpots = [];
  ['brine_cathedral', 'wick_mother', 'orrery_of_winter', 'penitent_colossus', 'drowned_abbot', 'unstruck', 'the_archivist', 'fallen_heart'].forEach((id, k) => {
    const x = CX - 6 + (k % 4) * 4, y = k < 4 ? 7 : 12;
    put(m, 'pedestal', x + (x >= CX ? 2 : -2), y, true, { trophy: id });
  });
  put(m, 'pedestal', CX + 1, 9, true, { trophy: 'emily_the_yapper' });
  put(m, 'pedestal', CX + 1, 4, true, { trophy: 'the_unstruck_god' });                        // and at the top, the throne's                          // and one for a penguin, front and centre
  // villagers stroll between these points
  m.strolls = [[CX - 6, CY + 7], [CX + 7, CY + 4], [CX + 12, CY - 4], [CX - 9, CY - 4], [CX + 2, CY + 12], [CX - 12, CY + 6]];
  m.villagers = [['villager_farmer', 0], ['villager_child', 2], ['villager_guard', 4]].map(([sp, k]) => ({ sprite: sp, x: m.strolls[k][0] + 0.5, y: m.strolls[k][1] + 0.5, goal: (k + 1) % 6, wait: 0 }));
  put(m, 'cat', CX - 2, CY + 2, false, { interact: 'cat', label: 'Pet the cat' });
  // the Pet Yard: a fenced pen where your pets play, and the Petkeeper at its gate
  const pen = { x0: YX - 5, y0: YY - 5, x1: YX + 6, y1: YY + 5 };
  m.pen = pen;
  for (let x = pen.x0 - 1; x <= pen.x1 + 1; x++) { put(m, 'fence_h', x, pen.y0 - 1, true); put(m, 'fence_h', x, pen.y1 + 1, true); }
  for (let y = pen.y0; y <= pen.y1; y++) { if (Math.abs(y - YY) > 1) put(m, 'fence_v', pen.x0 - 1, y, true); put(m, 'fence_v', pen.x1 + 1, y, true); }
  for (let y = pen.y0; y <= pen.y1; y++) for (let x = pen.x0; x <= pen.x1; x++) if ((x + y) % 7 === 0) set(x, y, TID.dirt);
  put(m, 'haybale', pen.x1, pen.y0, true); put(m, 'haybale', pen.x1, pen.y1, true); put(m, 'barrel', pen.x1 - 1, pen.y0, true);
  put(m, 'petkeeper', YX - 8, YY - 2, true, { interact: 'petyard', label: 'Visit the Petkeeper (pets, eggs, feeding)' });
  put(m, 'signpost', YX - 8, YY + 2, true, { label: 'The Pet Yard: hatch eggs, raise pets, and pick the companion who heals you' });
  for (const [x, y] of [[YX - 7, YY - 4], [YX - 7, YY + 4], [CX + 22, CY - 2], [CX + 22, CY + 2]]) put(m, 'lamppost', x, y, true);                  // the cat, by the fire
  put(m, 'fishspot', PX - 6, PY + 2, true, { interact: 'fish', label: 'Fish in the pond' });         // the pond's little dock
  for (let x = 4; x <= 13; x++) set(x, 40, TID.grass);                                          // a secret tunnel through the hedge...
  for (let y = 38; y <= 42; y++) for (let x = 2; x <= 5; x++) set(x, y, TID.grass);              // ...to a grotto
  put(m, 'lorestone', 3, 39, true, { interact: 'lore', lore: 15, label: 'Read the stone' });
  // pond dressing, pines and bushes along the hedge, stumps, a little clutter
  m.decor = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, x = Math.round(PX + Math.cos(a) * 6.2), y = Math.round(PY + Math.sin(a) * 4.2);
    if (m.tiles[idx(m, x, y)] === TID.grass) m.decor.push({ name: k % 3 ? 'reeds' : 'shrooms', x, y });
  }
  for (const [x, y] of [[PX - 2, PY], [PX + 1, PY - 1], [PX + 3, PY + 1]]) m.decor.push({ name: 'lily', x, y });
  for (let k = 0; k < 900; k++) {
    const x = r.int(2, W - 3), y = r.int(2, H - 3), i = idx(m, x, y);
    if (m.tiles[i] !== TID.grass || m.objects.some((o) => Math.abs(o.x - x - 0.5) < 2.5 && Math.abs(o.y - y - 0.5) < 2.5)) continue;
    if (x >= m.pen.x0 - 2 && x <= m.pen.x1 + 2 && y >= m.pen.y0 - 2 && y <= m.pen.y1 + 2) continue;   // keep the pen and its gate clear
    const edge = [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => m.tiles[idx(m, x + dx, y + dy)] === TID.hedge);
    if (edge && r.chance(0.35)) put(m, r.chance(0.6) ? 'pine' : 'bush', x, y, true);
    else if (!edge && r.chance(0.025)) put(m, r.pick(['stump', 'bush', 'haybale']), x, y, true);
    else if (r.chance(0.05)) m.decor.push({ name: r.pick(['shrooms', 'reeds', 'lily']), x, y });
  }
  m.spawn = { x: CX + 0.5, y: CY + 6.5 };
  m.lights = [{ x: CX + 0.5, y: CY + 0.5, r: 70, fire: true }];
  for (const o of m.objects) if (o.sprite === 'lamppost') m.lights.push({ x: o.x, y: o.y, r: 34 });
  finalize(m);
  for (const o of m.objects) if (o.big) { m.solid[idx(m, Math.floor(o.x) - 1, Math.floor(o.y))] = 1; m.solid[idx(m, Math.floor(o.x), Math.floor(o.y))] = 1; }
  return m;
}

// ------------------------------------------------------------------ VAULT (personal: one chest that grows)
export function vaultRoom() {
  const W = 17, H = 12;
  const m = makeMap('vault', 'Your Vault', W, H, TID.void);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) m.tiles[idx(m, x, y)] = TID.marble;
  wallUp(m);
  put(m, 'vault_chest', 8, 3, true, { interact: 'vault', chest: 0 });                  // one chest; buy Vault Chests to make it bigger
  for (const x of [2, W - 3]) put(m, 'brazier', x, 2);
  m.portals = [{ kind: 'nexus', x: 8.5, y: H - 2.5, label: 'Back to the Nexus', to: 'nexus' }];
  m.spawn = { x: 8.5, y: H - 4.5 };
  return finalize(m);
}

// ------------------------------------------------------------------ REALM
export const REALM_SIZE = 1280;
const RK = REALM_SIZE / 480;                 // the realm grew: features and set pieces scale with it
const DECOR_BIOME = [['shell', 'starfish', 'kelp', 'driftwood'], ['reeds', 'shrooms', 'lily', 'skullmoss'],
  ['snowtuft', 'runepebble', 'icecrystal', 'brokenshield'], ['embervent', 'goldrubble', 'bonepile', 'pillarstub'],
  ['shell', 'driftwood', 'goldrubble', 'bonepile'], ['shrooms', 'skullmoss', 'reeds', 'bonepile'], ['icecrystal', 'runepebble', 'brokenshield', 'pillarstub']];
const LANDMARK_BIOME = ['whale_skull', 'hollow_oak', 'monolith', 'god_hand', 'whale_skull', 'hollow_oak', 'monolith'];
const OB = [['whale_rib', 0.006], ['dead_tree', 0.01], ['rune_pillar', 0.008], ['fallen_head', 0.006],
  ['glass_spire', 0.008], ['thorn_tree', 0.03], ['crystal_spire', 0.01]];
// the sectors the new lands take out of their ring: a direction and a half-width (radians)
const SECTORS = { 4: [0, 0.95], 5: [Math.PI, 0.95], 6: [-Math.PI / 2, 1.15] };
// waypoint names, three per land
export const WAYPOINT_NAMES = {
  shore: ['Landing Beach', 'Gull Point', 'The Drowned Pier'], fen: ['Lantern Crossing', 'Bellwater', 'The Peat Steps'],
  runeholt: ['Cairnfold', 'The Frozen Gate', 'Skald\'s Rest'], godfall: ['The Gilded Steps', 'Ashen Throne-Road', 'The Last Bell'],
  dunes: ['Glassreach', 'The Sphinx\'s Shadow', 'Mirage Well'], thornwood: ['Briarhollow', 'The Stag\'s Path', 'Witchlight Clearing'],
  steppe: ['Skyglass Rise', 'The Humming Fields', 'Geode Hollow'],
};
// set pieces: a name, the lands it appears in, and what it's built from
const SITES = [
  { name: 'The Wrecked Galleon', in: [0], kind: 'wreck' }, { name: 'The Glass Oasis', in: [4], kind: 'oasis' },
  { name: 'The Sunken Bell Tower', in: [1], kind: 'tower' }, { name: 'The Witch\'s Circle', in: [5], kind: 'circle' },
  { name: 'The Standing Stones', in: [2], kind: 'stones' }, { name: 'The Shattered Observatory', in: [6], kind: 'observatory' },
  { name: 'The Fallen Colossus', in: [3], kind: 'colossus' }, { name: 'The Old Waystation', in: [0, 1, 4, 5], kind: 'hamlet' },
  { name: 'The Pilgrim Ruins', in: [1, 2, 5, 6], kind: 'hamlet' }, { name: 'The Glass Graveyard', in: [4], kind: 'graveyard' },
  { name: 'The Thorn Shrine', in: [5], kind: 'circle' }, { name: 'The Rune Gate', in: [2, 6], kind: 'stones' },
];

export function realm(seed) {
  const S = REALM_SIZE, C = S / 2;
  const m = makeMap('realm', 'The Realm', S, S, TID.deep);
  const r = rng(seed), n = noise2(seed), n2 = noise2(seed ^ 0x5bd1e995), n3 = noise2(seed ^ 0x2545f491), n4 = noise2(seed ^ 0x68e31da4);
  const area = new Array(BIOMES.length).fill(0);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = idx(m, x, y);
    const d = dist(x, y, C, C) / (C * 0.9) + (n(x / (26 * RK), y / (26 * RK)) - 0.5) * 0.32;
    const v = n2(x / (9 * Math.sqrt(RK)), y / (9 * Math.sqrt(RK)));
    if (d > 1.06) { m.tiles[i] = TID.deep; continue; }
    if (d > 1.0) { m.tiles[i] = TID.water; continue; }
    let b, t;
    if (d > 0.78) { b = 0; t = TID.sand; }
    else if (d > 0.52) { b = 1; t = v > 0.62 ? TID.mud : TID.fen; }
    else if (d > 0.27) { b = 2; t = v > 0.6 ? (r.chance(0.08) ? TID.runeglyph : TID.runefloor) : TID.snow; }
    else { b = 3; t = v > 0.6 ? TID.obsidian : TID.ash; }
    // the new lands take a wedge out of their ring (its edge wanders with the noise)
    const ang = Math.atan2(y - C, x - C) + (n4(x / (40 * RK), y / (40 * RK)) - 0.5) * 1.1;
    for (const [nb, [a0, w]] of Object.entries(SECTORS)) {
      if (BIOME_RING[nb] !== b) continue;
      if (Math.abs(Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0))) < w) b = +nb;
    }
    if (b === 4) t = v < 0.2 ? TID.glassflat : TID.dune;
    if (b === 5) t = v > 0.68 ? TID.bramble : v < 0.16 ? TID.bog : TID.loam;
    if (b === 6) t = v > 0.64 ? TID.quartz : v < 0.15 ? TID.shallows : TID.steppe;
    // each land's own ground features
    if ((b === 0 || b === 4) && d > 0.955) t = TID.shallows;                       // tidal flats: wade, slowly
    if (b === 0 && v < 0.15) t = TID.shallows;
    if (b === 1 && v < 0.28) t = v < 0.12 ? TID.water : TID.bog;                     // black pools ringed with bog
    if (b === 2 && v < 0.26) t = TID.ice;                                            // frozen lakes: you slide
    if (b === 3) {
      if (v < 0.14) t = TID.lava; else if (v < 0.22) t = TID.obsidian;               // lava pools rimmed in glass
      if (Math.abs(n3(x / (16 * RK), y / (16 * RK)) - 0.5) < 0.007) t = TID.lava;      // and fissures that cut the land
    }
    m.tiles[i] = t;
    m.biome[i] = t === TID.water ? -1 : b;
    if (b >= 0) area[b]++;
  }
  m.area = area;
  const per = (b, tilesEach) => Math.max(1, Math.round(area[b] / tilesEach));
  const plain = (x, y) => { const t = m.tiles[idx(m, x, y)]; return t !== TID.shallows && t !== TID.bog && t !== TID.ice && t !== TID.lava && t !== TID.water && t !== TID.bramble && t !== TID.deep; };
  const spotIn = (b, tries = 30) => { for (let j = 0; j < tries; j++) { const at = randomTileInBiome(m, b, r, null); if (at && plain(Math.floor(at.x), Math.floor(at.y))) return [Math.floor(at.x), Math.floor(at.y)]; } return null; };
  // ---- spawn on the southern shore
  for (let k = 0; k < 400; k++) {
    const a = Math.PI / 2 + (r() - 0.5) * 1.2, dd = C * (0.78 + r() * 0.12);
    const x = Math.floor(C + Math.cos(a) * dd), y = Math.floor(C + Math.sin(a) * dd);
    if (m.biome[idx(m, x, y)] === 0 && plain(x, y)) { m.spawn = { x: x + 0.5, y: y + 0.5 }; break; }
  }
  // ---- waypoints: three per land, spread apart; the first one sits right by the landing beach
  m.waypoints = [];
  for (let b = 0; b < BIOMES.length; b++) {
    const names = WAYPOINT_NAMES[BIOMES[b]];
    for (let k = 0; k < names.length; k++) {
      let best = null, bd = -1;
      if (b === 0 && k === 0) best = [Math.floor(m.spawn.x) + 3, Math.floor(m.spawn.y) - 2];
      else for (let j = 0; j < 40; j++) {
        const at = spotIn(b, 5);
        if (!at) continue;
        let near = 1e9;
        for (const w of m.waypoints) near = Math.min(near, (w.x - at[0]) ** 2 + (w.y - at[1]) ** 2);
        if (near > bd) { bd = near; best = at; }
      }
      if (best) m.waypoints.push({ name: names[k], biome: BIOMES[b], x: best[0], y: best[1] });
    }
  }
  // ---- roads: the waypoints and the landing beach joined by a minimum spanning tree of winding dirt and cobble paths
  const road = (x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1), ph = r() * 6, amp = Math.min(9, L * 0.08);
    for (let s = 0; s <= L; s += 0.5) {
      const f = s / L, wob = Math.sin(f * Math.PI) * Math.sin(f * 7 + ph) * amp;
      const cx = x0 + (x1 - x0) * f + nx * wob, cy = y0 + (y1 - y0) * f + ny * wob;
      for (let oy = 0; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) {
        const x = Math.floor(cx) + ox, y = Math.floor(cy) + oy, i = idx(m, x, y), t = m.tiles[i], b = m.biome[i];
        if (t === TID.deep) continue;
        const inner = b >= 0 && BIOME_RING[b] >= 2;
        m.tiles[i] = t === TID.lava ? TID.obsidian : (t === TID.water || t === TID.bog || t === TID.bramble || inner) ? TID.cobble : TID.dirt;
        if (m.biome[i] < 0) m.biome[i] = biomeAt(m, x + 2, y) >= 0 ? biomeAt(m, x + 2, y) : 0;
      }
    }
  };
  {
    const P = m.waypoints, inT = new Set([0]);
    while (inT.size < P.length) {
      let best = null, bd = 1e18;
      for (const a of inT) for (let j = 0; j < P.length; j++) {
        if (inT.has(j)) continue;
        const d2 = (P[a].x - P[j].x) ** 2 + (P[a].y - P[j].y) ** 2;
        if (d2 < bd) { bd = d2; best = [a, j]; }
      }
      inT.add(best[1]);
      road(P[best[0]].x, P[best[0]].y, P[best[1]].x, P[best[1]].y);
    }
  }
  const isRoad = (x, y) => { const t = m.tiles[idx(m, x, y)]; return t === TID.dirt || t === TID.cobble; };
  // ---- standing things and flat ground dressing (never on the roads)
  m.decor = [];
  for (let y = 2; y < S - 2; y++) for (let x = 2; x < S - 2; x++) {
    const b = m.biome[idx(m, x, y)];
    if (b < 0 || !plain(x, y) || isRoad(x, y)) continue;
    if (r.chance(OB[b][1])) put(m, OB[b][0], x, y);
    else if (r.chance(0.045)) m.decor.push({ name: r.pick(DECOR_BIOME[b]), x, y });
  }
  // ---- landmarks: 32x32 set pieces, solid along their 2-tile base
  for (let b = 0; b < BIOMES.length; b++) {
    for (let k = 0; k < per(b, 2800); k++) {
      const at = randomTileInBiome(m, b, r, null);
      if (!at) continue;
      const x = Math.floor(at.x), y = Math.floor(at.y);
      if ([[-1, 0], [0, 0], [-1, -1], [0, -1]].some(([dx, dy]) => m.biome[idx(m, x + dx, y + dy)] !== b || isRoad(x + dx, y + dy))) continue;
      m.objects.push({ sprite: 'lm:' + LANDMARK_BIOME[b], x: x, y: y + 0.5, solid: false, big: true });
      m.solid[idx(m, x - 1, y)] = 1; m.solid[idx(m, x, y)] = 1;
    }
  }
  // ---- shrines, guarded camps, lore stones, wells, trial altars, dig spots, ruins, wanderers
  m.camps = [];
  for (let b = 0; b < BIOMES.length; b++) {
    const home = BIOMES[BIOME_RING[b]];                        // the new lands borrow their ring's shrines and altars
    for (let k = 0; k < per(b, 7000); k++) { const at = spotIn(b, 3); if (at) put(m, 'shrine_' + home, at[0], at[1], true, { interact: 'shrine', biome: home }); }
    for (let k = 0; k < per(b, 10000); k++) {
      const at = spotIn(b, 3);
      if (!at) continue;
      const [cx, cy] = at;
      put(m, 'chest', cx, cy, true, { interact: 'chest', loot: BIOMES[b] });
      for (let j = 0; j < 6; j++) {                     // a ring of the land's standing things around it
        const a = (j / 6) * Math.PI * 2 + 0.3, x = Math.round(cx + Math.cos(a) * 3.2), y = Math.round(cy + Math.sin(a) * 3.2);
        if (m.biome[idx(m, x, y)] === b && plain(x, y)) put(m, j % 2 ? OB[b][0] : 'brazier', x, y);
      }
      m.camps.push({ x: cx + 0.5, y: cy + 0.5, biome: BIOMES[b] });
    }
    for (let k = 0; k < 4; k++) { const at = spotIn(b); if (at) put(m, 'lorestone', at[0], at[1], true, { interact: 'lore', lore: b * 4 + k, label: 'Read the stone' }); }
    { const at = spotIn(b); if (at) put(m, 'well', at[0], at[1], true, { interact: 'wish', biome: home, label: 'Make a wish (50 gold)' }); }
    { const at = spotIn(b); if (at) put(m, 'altar_' + home, at[0], at[1], true, { interact: 'altar', biome: BIOMES[b], label: 'Begin the trial' }); }
    for (let k = 0; k < per(b, 8500); k++) { const at = spotIn(b); if (at) put(m, 'digspot', at[0], at[1], false, { interact: 'dig', biome: home, label: 'Dig here' }); }
    for (let k = 0; k < per(b, 17000); k++) {   // ruins: a broken stone shell with a doorway, a chest, and something written
      const at = spotIn(b);
      if (!at) continue;
      const [rx, ry] = at, W = 7 + r.int(0, 3), H = 5 + r.int(0, 2), door = r.int(1, W - 2);
      let ok = true;
      for (let y = ry - 1; y <= ry + H && ok; y++) for (let x = rx - 1; x <= rx + W && ok; x++) if (m.biome[idx(m, x, y)] !== b || !plain(x, y) || isRoad(x, y)) ok = false;
      if (!ok) continue;
      for (let x = rx; x < rx + W; x++) {
        if (r.chance(0.8)) put(m, x % 2 ? 'ruin_wall' : 'ruin_wall2', x, ry);
        if (x - rx !== door && x - rx !== door + 1 && r.chance(0.8)) put(m, x % 2 ? 'ruin_wall2' : 'ruin_wall', x, ry + H);
      }
      for (let y = ry + 1; y < ry + H; y++) { if (r.chance(0.75)) put(m, 'ruin_wall', rx, y); if (r.chance(0.75)) put(m, 'ruin_wall2', rx + W - 1, y); }
      for (let y = ry + 1; y < ry + H; y++) for (let x = rx + 1; x < rx + W - 1; x++) m.tiles[idx(m, x, y)] = BIOME_RING[b] === 3 ? TID.obsidian : TID.runefloor;
      put(m, 'chest', rx + Math.floor(W / 2), ry + Math.floor(H / 2), true, { interact: 'chest', loot: BIOMES[b] });
      put(m, 'brazier', rx + 1, ry + 1);
    }
    if (b < 4) {
      const who = ['ossic', 'fennick', 'ingrit', 'laughing'][b];
      const at = spotIn(b); if (at) put(m, 'npc_' + who, at[0], at[1], true, { interact: 'talk', who, label: 'Talk' });
    }
  }
  // ---- named sites: a few set pieces per land, discovered when you first walk up to them
  m.sites = [];
  const clearAround = (cx, cy, R, b) => {
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      if (m.biome[idx(m, x, y)] !== b || !plain(x, y)) return false;
    }
    return true;
  };
  const wipe = (cx, cy, R) => { m.objects = m.objects.filter((o) => Math.abs(o.x - cx) > R + 1 || Math.abs(o.y - cy) > R + 1); m.decor = m.decor.filter((d) => Math.abs(d.x - cx) > R || Math.abs(d.y - cy) > R); };
  const ring = (cx, cy, R, n, sprite, a0 = 0) => { for (let j = 0; j < n; j++) { const a = a0 + (j / n) * Math.PI * 2; put(m, sprite, Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R)); } };
  const floor = (cx, cy, R, t, round = true) => { for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (!round || (x - cx) ** 2 + (y - cy) ** 2 <= R * R) m.tiles[idx(m, x, y)] = t; };
  const BUILD = {
    wreck: (x, y) => { put(m, 'whale_rib', x - 3, y); put(m, 'whale_rib', x - 1, y - 1); put(m, 'whale_rib', x + 1, y - 1); put(m, 'whale_rib', x + 3, y);
      put(m, 'crate', x - 2, y + 2); put(m, 'barrel', x + 2, y + 2); put(m, 'barrel', x + 3, y + 3); put(m, 'chest', x, y + 1, true, { interact: 'chest', loot: 'shore' }); },
    oasis: (x, y) => { floor(x, y, 3, TID.shallows); ring(x, y, 5, 8, 'glass_spire'); put(m, 'well', x + 5, y + 5, true, { interact: 'wish', biome: 'shore', label: 'Make a wish (50 gold)' }); },
    tower: (x, y) => { floor(x, y, 4, TID.chapelfloor, false); ring(x, y, 4, 10, 'ruin_wall2'); put(m, 'statue_sun', x, y - 1); put(m, 'chest', x, y + 2, true, { interact: 'chest', loot: 'fen' }); },
    circle: (x, y) => { floor(x, y, 4, TID.loam); ring(x, y, 5, 9, 'thorn_tree', 0.2); put(m, 'mystery_altar', x, y, true, { interact: 'mystery', label: 'Touch the altar' }); },
    stones: (x, y) => { floor(x, y, 4, TID.runefloor); ring(x, y, 4, 8, 'rune_pillar'); put(m, 'lorestone', x, y, true, { interact: 'riddle', label: 'Read the stone' }); },
    observatory: (x, y) => { floor(x, y, 4, TID.marble, false); ring(x, y, 5, 6, 'crystal_spire', 0.5); ring(x, y, 3, 6, 'ruin_wall'); put(m, 'statue_anvil', x, y); put(m, 'chest', x, y + 2, true, { interact: 'chest', loot: 'steppe' }); },
    colossus: (x, y) => { put(m, 'fallen_head', x - 2, y); put(m, 'statue_fist', x + 2, y + 1); put(m, 'statue_sun', x, y - 3); ring(x, y, 5, 6, 'brazier'); put(m, 'chest', x, y + 3, true, { interact: 'chest', loot: 'godfall' }); },
    hamlet: (x, y) => { floor(x, y, 3, TID.cobble, false); for (const [dx, dy] of [[-5, -4], [4, -4], [-5, 3]]) { for (let k = 0; k < 4; k++) { put(m, k % 2 ? 'ruin_wall' : 'ruin_wall2', x + dx + k, y + dy); } }
      put(m, 'well', x, y, true, { interact: 'wish', biome: 'fen', label: 'Make a wish (50 gold)' }); put(m, 'signpost', x + 2, y + 1); put(m, 'crate', x - 2, y + 2); },
    graveyard: (x, y) => { for (let k = 0; k < 9; k++) put(m, 'ruin_wall2', x - 4 + (k % 3) * 4, y - 3 + Math.floor(k / 3) * 3); put(m, 'mystery_altar', x, y + 5, true, { interact: 'mystery', label: 'Touch the altar' }); },
  };
  for (const site of SITES) for (const b of site.in) {
    for (let tries = 0; tries < 60; tries++) {
      const at = spotIn(b, 3);
      if (!at) break;
      const [x, y] = at;
      if (!clearAround(x, y, 6, b) || m.sites.some((s) => (s.x - x) ** 2 + (s.y - y) ** 2 < 60 * 60)) continue;
      wipe(x, y, 6); BUILD[site.kind](x, y);
      m.sites.push({ name: site.name, x: x + 0.5, y: y + 0.5, biome: BIOMES[b] });
      break;
    }
  }
  for (const w of m.waypoints) {                              // the obelisks themselves, on a little paved square
    wipe(w.x, w.y, 1);
    floor(w.x, w.y, 1, TID.cobble, false);
    put(m, 'waypoint', w.x, w.y, true, { interact: 'waypoint', name: w.name, label: 'Travel' });
  }
  // the landing beach stays clear: nothing may stand on or right beside the spot you arrive on
  {
    const sx = Math.floor(m.spawn.x), sy = Math.floor(m.spawn.y);
    m.objects = m.objects.filter((o) => o.interact === 'waypoint' || Math.abs(Math.floor(o.x) - sx) > 2 || Math.abs(Math.floor(o.y) - sy) > 2 || (o.big && Math.abs(o.x - sx) > 3));
    for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) if (!plain(x, y)) m.tiles[idx(m, x, y)] = TID.sand;
    m.decor = m.decor.filter((d) => Math.abs(d.x - sx) > 1 || Math.abs(d.y - sy) > 1);
  }
  finalize(m);
  {                                                            // landmarks mark their base solid directly: clear any near the beach too
    const sx = Math.floor(m.spawn.x), sy = Math.floor(m.spawn.y);
    for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) {
      const i = idx(m, x, y);
      if (!SOLID_TILES.has(m.tiles[i]) && !m.objects.some((o) => o.solid && Math.floor(o.x) === x && Math.floor(o.y) === y)) m.solid[i] = 0;
    }
  }
  m.portals = [];
  m.seed = seed;
  return m;
}
export function biomeAt(m, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= m.w || yi >= m.h) return -1;
  return m.biome[yi * m.w + xi];
}
export function randomTileInBiome(m, b, r, avoid, minD = 14) {
  for (let k = 0; k < 200; k++) {
    const x = r.int(2, m.w - 3), y = r.int(2, m.h - 3);
    const i = idx(m, x, y);
    if (m.biome[i] === b && !m.solid[i] && (!avoid || dist(x, y, avoid.x, avoid.y) > minD)) return { x: x + 0.5, y: y + 0.5 };
  }
  return null;
}

// ------------------------------------------------------------------ DUNGEONS
// Every dungeon is built its own way (def.style picks the layout), then finished by one shared pass:
//   chapel      a cathedral: entrance hall, a long pillared nave of pews with flooded aisles, side chapels, a crossing
//               with two transepts, and the apse where the Abbot waits
//   crypt       catacombs: a maze of narrow candle-lit tunnels, burial chambers full of sarcophagi, the Lich's ossuary
//   forge       a drowned foundry: a grid of forge halls joined by wide conveyor corridors with a lava gutter down the middle
//   scriptorium the stacks: enormous halls of bookshelf aisles, joined by single-file stairs, with reading rooms off them
//   ember       the Emberforge: themed rooms (foundry, golemworks, smeltery...) joined by narrow bridges over lava
//   heart       organic: round chambers ringed around the heart, joined by winding veins; one artery leads in
//   throne      a royal road: a colonnaded processional through two champions' halls to the throne room
// Upper dungeons seal their boss behind a gate (def.seals: wardens, levers, a puzzle); the lower ones don't.
export function dungeon(seed, def) {
  const r = rng(seed);
  const S = { chapel: 200, crypt: 180, forge: 180, scriptorium: 214, heart: 196, throne: 196, hive: 200, theatre: 190, spire: 220, islands: 230 }[def.style] || 230;
  const FLOOR = TID[def.floor], WALL = TID[def.wall], HAZ = def.hazard ? TID[def.hazard] : null;
  const WET = def.style === 'crypt' ? TID.cryptwater : TID.water, HOT = def.style === 'ember' ? TID.emberlava : TID.lava;
  const m = makeMap('dungeon', def.name, S, S, TID.void);
  const tile = (x, y) => m.tiles[idx(m, x, y)];
  const set = (x, y, t) => { if (x > 1 && y > 1 && x < S - 2 && y < S - 2) m.tiles[idx(m, x, y)] = t; };
  const carve = (x0, y0, x1, y1, t = FLOOR) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, t);
  };
  const isF = (x, y) => tile(x, y) === FLOOR;
  const voidAt = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x < 2 || y < 2 || x > S - 3 || y > S - 3 || tile(x, y) !== TID.void) return false; return true; };
  const rooms = [];
  const room = (x, y, w, h, o = {}) => { const n = { x: Math.round(x), y: Math.round(y), w, h, links: [], role: 'fight', shape: 'rect', ...o }; n.cx = n.x + (w >> 1); n.cy = n.y + (h >> 1); rooms.push(n); return n; };
  const link = (a, b) => { if (!a.links.includes(b)) { a.links.push(b); b.links.push(a); } };
  const H3 = Math.sqrt(3) / 2;
  const carveRoom = (n) => {
    if (n.shape === 'hex') {                                          // a comb cell, pointy-top
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
        const dx = Math.abs(x - n.cx), dy = Math.abs(y - n.cy);
        if (dx <= n.hr * H3 && dy <= n.hr - dx / Math.sqrt(3)) set(x, y, FLOOR);
      }
    } else if (n.shape === 'fan') {                                   // the auditorium: a fan opening away from the stage
      const F = n.fan;
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
        const d = Math.hypot(x - F.ax, y - F.ay), a = Math.atan2(y - F.ay, x - F.ax);
        if ((d <= F.r1 && Math.abs(a - Math.PI / 2) <= F.spread) || (y - F.ay < 4 && Math.abs(x - F.ax) < 6)) set(x, y, FLOOR);
      }
    } else if (n.shape === 'octa') {
      const k = Math.min(n.w, n.h) * 0.3;
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
        const ex = Math.min(x - n.x, n.x + n.w - 1 - x), ey = Math.min(y - n.y, n.y + n.h - 1 - y);
        if (ex + ey >= k) set(x, y, FLOOR);
      }
    } else if (n.shape === 'blob') {                                  // a dream island: a ragged round of earth in the void
      const f = (a) => 0.8 + 0.12 * Math.sin(a * 3 + n.seed * 9) + 0.08 * Math.sin(a * 5 + n.seed * 21);
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
        const d = Math.hypot(x - n.cx, y - n.cy), a = Math.atan2(y - n.cy, x - n.cx);
        if (d <= n.rad * (n.calm ? 0.97 : f(a))) set(x, y, FLOOR);
      }
    } else if (n.shape === 'round') {
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (((x - n.cx) / (n.w / 2)) ** 2 + ((y - n.cy) / (n.h / 2)) ** 2 <= 1) set(x, y, FLOOR);
    } else if (n.shape === 'cross') {
      const cw = Math.floor(n.w / 4), ch = Math.floor(n.h / 4);
      carve(n.x + cw, n.y, n.x + n.w - 1 - cw, n.y + n.h - 1); carve(n.x, n.y + ch, n.x + n.w - 1, n.y + n.h - 1 - ch);
    } else carve(n.x, n.y, n.x + n.w - 1, n.y + n.h - 1);
  };
  // an L-shaped hall: along x first, then along y (width w = half-width either side of the line)
  const hallL = (ax, ay, bx, by, w = 1, t = FLOOR) => { carve(ax, ay - w, bx, ay + w, t); carve(bx - w, ay, bx + w, by, t); };
  const midClear = (n, x, y) => Math.abs(x - n.cx) > 2 && Math.abs(y - n.cy) > 2;
  const tube = (ax, ay, bx, by, w = 1, t = FLOOR) => {                // a straight tunnel at any angle, 2w+1 wide
    const L = Math.max(1, Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= L; i++) { const x = Math.round(ax + (bx - ax) * i / L), y = Math.round(ay + (by - ay) * i / L); carve(x - w, y - w, x + w, y + w, t); }
  };
  const belts = [], roads = [];
  const put2 = (n, x, y, sprite, solid = true, extra = {}) => { if (isF(x, y) && (!n || midClear(n, x, y)) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, sprite, x, y, solid, extra); };
  const bossW = def.bossW || 33, bossH = def.bossH || 27;

  // ================================================================ the layouts
  const LAYOUT = {
    // ---- THE SUNKEN CHAPEL: a drowned cathedral, never quite the same twice
    chapel() {
      const cy = S >> 1, start = room(12, cy - 6, 13, 13, { kind: 'narthex' });
      if (r.chance(0.5)) {                                              // a bell tower off the entrance hall
        const up = r.chance(0.5), t = room(start.cx - 5, up ? start.y - 15 : start.y + start.h + 4, 11, 11, { kind: 'belltower', shape: 'round', leaf: true });
        carve(start.cx - 1, up ? t.y + t.h - 1 : start.y + start.h, start.cx + 1, up ? start.y - 1 : t.y); link(start, t);
      }
      let prev = start, x = start.x + start.w + 4;
      const chapels = [];
      for (let k = 0, nb = r.int(2, 4); k < nb; k++) {
        const w = r.int(19, 25), h = r.int(15, 19), n = room(x, cy - (h >> 1), w, h, { kind: 'nave' });
        roads.push([null, prev.x + prev.w, n.x + n.w - 2, false, cy]);
        carve(prev.x + prev.w, cy - 3, n.x - 1, cy + 3);
        link(prev, n); prev = n; x = n.x + n.w + r.int(3, 6);
        for (const side of [-1, 1]) {
          if (!r.chance(0.6)) continue;
          const cw = r.int(9, 13), ch = r.int(8, 10), off = r.int(-3, 3);
          const c = room(n.cx - (cw >> 1) + off, side < 0 ? n.y - ch - r.int(4, 6) : n.y + n.h + r.int(4, 6), cw, ch, { kind: 'sidechapel', side });
          carve(n.cx + off - 1, side < 0 ? c.y + c.h : n.y + n.h, n.cx + off + 1, side < 0 ? n.y - 1 : c.y - 1);
          link(n, c); chapels.push(c);
        }
      }
      const cross = room(x, cy - 10, 21, 21, { kind: 'crossing' });
      carve(prev.x + prev.w, cy - 3, cross.x - 1, cy + 3); link(prev, cross);
      const dirs = r.pick([['e', 'n', 's'], ['n', 'e', 's'], ['s', 'e', 'n']]);   // which way the apse lies; transepts take the other two
      const arm = (d, w, h, o) => {
        const n = d === 'e' ? room(cross.x + cross.w + 6, cy - (h >> 1), w, h, o) : d === 'n' ? room(cross.cx - (w >> 1), cross.y - h - 6, w, h, o) : room(cross.cx - (w >> 1), cross.y + cross.h + 6, w, h, o);
        if (d === 'e') carve(cross.x + cross.w, cy - 2, n.x + 1, cy + 2); else if (d === 'n') carve(cross.cx - 2, n.y + n.h - 2, cross.cx + 2, cross.y - 1); else carve(cross.cx - 2, cross.y + cross.h, cross.cx + 2, n.y + 1);
        link(cross, n); return n;
      };
      const boss = arm(dirs[0], bossW, bossH, { shape: 'round', kind: 'apse' });
      for (const d of dirs.slice(1)) arm(d, 15, 12, { kind: 'transept', side: d === 'n' ? -1 : 1 });
      if (chapels.length && r.chance(0.6)) {                             // a cloister: a square walk round a drowned garden
        const c = r.pick(chapels), up = c.side < 0, cl = room(c.cx - 11, up ? c.y - 27 : c.y + c.h + 5, 23, 23, { kind: 'cloister', leaf: true });
        if (cl.y > 4 && cl.y + cl.h < S - 4) {
          carve(c.cx - 1, up ? cl.y + cl.h : c.y + c.h, c.cx + 1, up ? c.y - 1 : cl.y - 1); link(c, cl); cl.garden = true;
        } else { rooms.splice(rooms.indexOf(cl), 1); }
      }
      return { start, boss };
    },
    // ---- THE SUNKEN CRYPT: a maze of catacomb tunnels and burial chambers
    crypt() {
      const MW = 13, MH = 9, SP = 8, ox = 14, oy = Math.floor((S - MH * SP) / 2);
      const C = (i, j) => [ox + i * SP, oy + j * SP], seen = new Set(), K = (i, j) => i + ',' + j, nb = new Map();
      const adj = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < MW && b < MH);
      const join = (a, b) => { (nb.get(K(...a)) || nb.set(K(...a), []).get(K(...a))).push(b); (nb.get(K(...b)) || nb.set(K(...b), []).get(K(...b))).push(a); };
      const stack = [[0, MH >> 1]]; seen.add(K(0, MH >> 1));
      while (stack.length) {                                           // the recursive backtracker: one long winding maze
        const cur = stack[stack.length - 1], opts = adj(...cur).filter((c) => !seen.has(K(...c)));
        if (!opts.length) { stack.pop(); continue; }
        const nx = r.pick(opts); seen.add(K(...nx)); join(cur, nx); stack.push(nx);
      }
      for (let k = 0; k < 14; k++) { const i = r.int(0, MW - 1), j = r.int(0, MH - 1), o = r.pick(adj(i, j)); join([i, j], o); }   // a few loops
      for (const [key, L] of nb) {                                    // tunnels two tiles wide
        const [i, j] = key.split(',').map(Number), [x0, y0] = C(i, j);
        for (const [a, b] of L) { const [x1, y1] = C(a, b); carve(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1) + 1, Math.max(y0, y1) + 1); }
      }
      const dist = new Map([[K(0, MH >> 1), 0]]), q = [[0, MH >> 1]];
      while (q.length) { const c = q.shift(); for (const o of nb.get(K(...c)) || []) if (!dist.has(K(...o))) { dist.set(K(...o), dist.get(K(...c)) + 1); q.push(o); } }
      const s0 = C(0, MH >> 1), start = room(s0[0] - 4, s0[1] - 3, 10, 8, { kind: 'vestibule', depth: 0 });
      const ends = [...nb.keys()].filter((k) => nb.get(k).length === 1).map((k) => k.split(',').map(Number)).filter(([i]) => i > 1 && i < MW - 1);
      const tombs = ends.sort(() => r() - 0.5).slice(0, 9);
      for (const [i, j] of tombs) { const [x, y] = C(i, j); room(x - 4, y - 3, 10, 8, { kind: 'tomb', leaf: true, depth: dist.get(K(i, j)) || 1 }); }
      for (let k = 0; k < 5; k++) { const i = r.int(2, MW - 2), j = r.int(0, MH - 1), [x, y] = C(i, j); room(x - 2, y - 2, 6, 6, { kind: 'ossuary', few: true, depth: dist.get(K(i, j)) || 1 }); }
      let far = null, fd = -1;
      for (let j = 0; j < MH; j++) { const d = dist.get(K(MW - 1, j)) || 0; if (d > fd) { fd = d; far = j; } }
      const [fx, fy] = C(MW - 1, far);
      const boss = room(fx + 8, Math.max(4, Math.min(S - bossH - 4, fy - (bossH >> 1))), bossW, bossH, { kind: 'ossuary_hall', depth: fd + 1 });
      carve(fx, fy - 1, boss.x + 1, fy + 1); carve(boss.x, fy - 1, boss.x + 2, boss.cy);
      return { start, boss };
    },
    // ---- THE DROWNED FORGE: a random grid of forge halls, a maze of conveyors between them
    forge() {
      const GW = r.int(3, 4), GH = r.int(2, 3), SP = 36, ox = 12, oy = Math.floor((S - GH * SP) / 2) + 2, H = new Map(), K = (i, j) => i + ',' + j;
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
        if (i > 0 && i < GW - 1 && r.chance(0.18)) continue;              // a collapsed hall: the grid has holes
        const w = r.int(19, 25), h = r.int(15, 21);
        H.set(K(i, j), room(ox + i * SP + ((SP - 4 - w) >> 1), oy + j * SP + ((SP - 4 - h) >> 1), w, h, { kind: 'hall', gi: i, gj: j }));
      }
      const conveyor = (a, b) => {                                    // five wide: two lanes and molten slag down the middle
        const d = r.chance(0.5) ? 1 : -1;                              // each belt runs one way; walking against it is slow
        if (a.gj === b.gj) { const y = (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) >> 1; carve(a.x + a.w, y - 2, b.x - 1, y + 2); carve(a.x + a.w, y, b.x - 1, y, HOT); belts.push({ x0: a.x + a.w, y0: y - 2, x1: b.x, y1: y + 3, dx: d, dy: 0 }); }
        else { const x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) >> 1; carve(x - 2, a.y + a.h, x + 2, b.y - 1); carve(x, a.y + a.h, x, b.y - 1, HOT); belts.push({ x0: x - 2, y0: a.y + a.h, x1: x + 3, y1: b.y, dx: 0, dy: d }); }
        link(a, b);
      };
      // a random maze over the halls that exist, then a few extra conveyors for loops
      const all = [...H.values()], startH = r.pick(all.filter((h) => h.gi === 0)), seen = new Set([startH]), stack = [startH];
      const nbrs = (h) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => H.get(K(h.gi + a, h.gj + b))).filter(Boolean);
      while (stack.length) { const c = stack[stack.length - 1], o = nbrs(c).filter((n) => !seen.has(n)); if (!o.length) { stack.pop(); continue; } const n = r.pick(o); seen.add(n); conveyor(c.gi < n.gi || c.gj < n.gj ? c : n, c.gi < n.gi || c.gj < n.gj ? n : c); stack.push(n); }
      for (const h of all) if (!seen.has(h)) { rooms.splice(rooms.indexOf(h), 1); H.delete(K(h.gi, h.gj)); }
      for (const h of [...H.values()]) for (const n of nbrs(h)) if ((n.gi > h.gi || n.gj > h.gj) && !h.links.includes(n) && r.chance(0.3)) conveyor(h, n);
      const dep = new Map([[startH, 0]]), q = [startH];
      while (q.length) { const c = q.shift(); for (const o of c.links) if (!dep.has(o)) { dep.set(o, dep.get(c) + 1); q.push(o); } }
      const rightmost = [...H.values()].filter((h) => h.gi === Math.max(...[...H.values()].map((v) => v.gi)));
      const last = rightmost.reduce((a, b) => (dep.get(b) > dep.get(a) ? b : a));
      const boss = room(last.x + last.w + 8, last.cy - (bossH >> 1), bossW, bossH, { kind: 'anvilhall' });
      carve(last.x + last.w, last.cy - 2, boss.x, last.cy + 2); carve(last.x + last.w, last.cy, boss.x - 1, last.cy, HOT); link(last, boss);
      return { start: startH, boss };
    },
    // ---- THE FROZEN SCRIPTORIUM: halls of stacks, single-file stairs, reading rooms
    scriptorium() {
      const cy = S >> 1, start = room(10, cy - 6, 13, 13, { kind: 'foyer' });
      let prev = start, x = start.x + start.w + 8;
      for (let k = 0; k < 3; k++) {
        const h = room(x, cy - 13 + r.int(-3, 3), 35, 27, { kind: 'stacks' });
        const lo = Math.max(prev.y, h.y) + 1, hi = Math.min(prev.y + prev.h, h.y + h.h) - 2, yy = lo <= hi ? r.int(lo, hi) : h.cy;
        carve(prev.x + prev.w, yy, h.x - 1, yy);                          // a narrow stair between the halls
        link(prev, h); prev = h; x = h.x + h.w + 9;
        for (const side of [-1, 1]) {
          const rr = room(h.x + 5 + r.int(0, h.w - 18), side < 0 ? h.y - 14 : h.y + h.h + 5, 13, 9, { kind: 'reading', leaf: true });
          const sx = rr.cx;
          carve(sx, side < 0 ? rr.y + rr.h : h.y + h.h, sx, side < 0 ? h.y - 1 : rr.y - 1);
          link(h, rr);
        }
      }
      const boss = room(x, cy - (bossH >> 1), bossW, bossH, { kind: 'archive' });
      carve(prev.x + prev.w, boss.cy - 1, boss.x, boss.cy + 1); link(prev, boss);
      return { start, boss };
    },
    // ---- THE HEART OF GODFALL: chambers in a ring around the heart, veins between them, one artery in
    heart() {
      const C = S >> 1, N = 10, RR = 70, ch = [];
      for (let k = 0; k < N; k++) {
        const a = Math.PI + (k / N) * Math.PI * 2 + (r() - 0.5) * 0.24, w = r.int(15, 21), h = r.int(13, 19);
        ch.push(room(C + Math.cos(a) * RR - w / 2, C + Math.sin(a) * RR - h / 2, w, h, { shape: 'round', kind: 'chamber', ang: a }));
      }
      const vein = (a, b) => {                                       // a winding tunnel, three wide, that never runs straight
        const L = Math.hypot(b.cx - a.cx, b.cy - a.cy), nx = -(b.cy - a.cy) / L, ny = (b.cx - a.cx) / L, ph = r() * 6;
        for (let s = 0; s <= L; s += 0.5) {
          const f = s / L, w = Math.sin(f * Math.PI) * Math.sin(f * 9 + ph) * 4;
          const x = Math.round(a.cx + (b.cx - a.cx) * f + nx * w), y = Math.round(a.cy + (b.cy - a.cy) * f + ny * w);
          carve(x - 1, y - 1, x + 1, y + 1);
        }
        link(a, b);
      };
      for (let k = 0; k < N; k++) vein(ch[k], ch[(k + 1) % N]);
      const start = ch[0], far = ch[N >> 1];
      const boss = room(C - (bossW >> 1), C - (bossH >> 1), bossW, bossH, { shape: 'round', kind: 'heartchamber' });
      vein(far, boss);
      return { start, boss };
    },
    // ---- THE THRONE: a royal road through two champions' halls to the throne
    throne() {
      const CX = S >> 1, start = room(CX - 7, S - 26, 15, 13, { kind: 'gatehouse' });
      let y = start.y;
      const road = (y0, y1) => {                                      // seven wide, with a colonnade down both sides
        carve(CX - 3, y1, CX + 3, y0); roads.push([CX, y1, y0]);
        for (let yy = y1 + 1; yy < y0; yy += 4) { set(CX - 3, yy, WALL); set(CX + 3, yy, WALL); }
      };
      const halls = [];
      let prev = start;
      const guard = (yy, side) => {                                   // a guardroom off the road, behind the colonnade
        const g = room(side < 0 ? CX - 16 : CX + 6, yy - 4, 11, 9, { kind: 'guardroom', leaf: true });
        carve(side < 0 ? g.x + g.w : CX + 3, yy - 1, side < 0 ? CX - 3 : g.x - 1, yy + 1); return g;
      };
      for (let k = 0; k < 2; k++) {
        const len = r.int(10, 19), hw = r.int(21, 29) | 1, hh = r.int(19, 27);
        const h = room(CX - (hw >> 1), y - len - hh, hw, hh, { kind: 'champion', prefer: 'warden' });
        road(y - 1, h.y + h.h);
        if (len > 13 && r.chance(0.7)) link(prev, guard(y - (len >> 1), r.chance(0.5) ? -1 : 1));
        link(prev, h); prev = h; halls.push(h); y = h.y;
        const sides = r.pick([[-1, 1], [-1, 1], [-1], [1]]);
        for (const side of sides) {
          const tw = r.int(9, 13), th = r.int(7, 11), ty = h.y + r.int(2, h.h - th - 2);
          const t = room(side < 0 ? h.x - tw - 6 : h.x + h.w + 6, ty, tw, th, { kind: 'treasury', leaf: true });
          const cyy = Math.max(ty + 1, Math.min(ty + th - 2, h.cy));
          carve(side < 0 ? t.x + t.w : h.x + h.w, cyy - 1, side < 0 ? h.x - 1 : t.x - 1, cyy + 1); link(h, t);
        }
      }
      const len = r.int(10, 16), boss = room(CX - (bossW >> 1), y - len - bossH, bossW, bossH, { kind: 'throneroom' });
      carve(CX - 3, boss.y + boss.h, CX + 3, y - 1); link(prev, boss); roads.push([CX, boss.y + boss.h, y - 1, true]);
      return { start, boss };
    },

    // ---- THE HONEYED HOLLOW: a hive in a hollow tree. Hexagonal comb cells, wax tunnels, a royal cell at the heart
    hive() {
      const R0 = 8, D = 19, C = S >> 1, cells = new Map(), K = (q, rr) => q + ',' + rr;
      const N6 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
      const at = (q, rr) => [C + D * (q + rr / 2), C + D * H3 * rr];
      const cell = (q, rr, o = {}) => {
        const [xc, yc] = at(q, rr), hr = o.hr || R0, hw = Math.round(hr * H3);
        const n = room(Math.round(xc) - hw, Math.round(yc) - hr, hw * 2 + 1, hr * 2 + 1, { shape: 'hex', hr, q, rr, kind: 'comb', ...o });
        cells.set(K(q, rr), n); return n;
      };
      const start = cell(-2, 0, { kind: 'entrance', hr: 7 }), list = [start];
      for (let g = 0; list.length < (def.rooms || 9) && g < 800; g++) {
        const from = r.chance(0.6) ? list[list.length - 1 - r.int(0, Math.min(2, list.length - 1))] : r.pick(list);
        const [dq, dr] = r.pick(N6), q = from.q + dq, rr = from.rr + dr;
        if (cells.has(K(q, rr)) || Math.abs(q + rr / 2) > 3.6 || Math.abs(rr) > 3) continue;
        const n = cell(q, rr, { hr: r.int(7, 9) }); tube(from.cx, from.cy, n.cx, n.cy, 1); link(from, n); list.push(n);
      }
      for (const a of list) for (const [dq, dr] of N6) {                 // a few extra tunnels make loops in the comb
        const b = cells.get(K(a.q + dq, a.rr + dr));
        if (b && !a.links.includes(b) && r.chance(0.18)) { tube(a.cx, a.cy, b.cx, b.cy, 1); link(a, b); }
      }
      const dep = new Map([[start, 0]]), q0 = [start];
      while (q0.length) { const c = q0.shift(); for (const o of c.links) if (!dep.has(o)) { dep.set(o, dep.get(c) + 1); q0.push(o); } }
      const deep = [...list].sort((a, b) => dep.get(b) - dep.get(a));
      // the royal cell: a great hex beyond the deepest comb, wherever there is room for it
      const BR = 15;
      for (const far of deep) for (const [dq, dr] of N6.sort(() => r() - 0.5)) {
        const [x1, y1] = at(far.q + dq * 1.45, far.rr + dr * 1.45);
        if (list.some((o) => o !== far && Math.hypot(o.cx - x1, o.cy - y1) < BR * H3 + o.hr * H3 + 5)) continue;
        if (x1 < BR + 6 || y1 < BR + 6 || x1 > S - BR - 6 || y1 > S - BR - 6) continue;
        const hw = Math.round(BR * H3), boss = room(Math.round(x1) - hw, Math.round(y1) - BR, hw * 2 + 1, BR * 2 + 1, { shape: 'hex', hr: BR, kind: 'royalcell' });
        tube(far.cx, far.cy, boss.cx, boss.cy, 2); link(far, boss);
        return { start, boss };
      }
      const boss = room(C - 16, C - 15, 33, 31, { shape: 'hex', hr: BR, kind: 'royalcell' });
      tube(deep[0].cx, deep[0].cy, boss.cx, boss.cy, 2); link(deep[0], boss);
      return { start, boss };
    },
    // ---- THE GILDED MARIONETTE THEATRE: box office, grand foyer, a fan of seats, the wings backstage, and the Stage
    theatre() {
      const CX = S >> 1, lobby = room(CX - 8, S - 26, 17, 11, { kind: 'lobby' });
      const fw = r.int(27, 35) | 1, foyer = room(CX - (fw >> 1), lobby.y - 5 - 13, fw, 13, { kind: 'foyer' });
      carve(CX - 2, foyer.y + foyer.h, CX + 2, lobby.y - 1); link(lobby, foyer);
      for (const side of [-1, 1]) if (r.chance(0.8)) {                  // the boxes: up a short stair from the foyer
        const b = room(side < 0 ? foyer.x - 16 : foyer.x + foyer.w + 5, foyer.y - 3 + r.int(-2, 2), 11, 9, { kind: 'box', leaf: true, prefer: 'mask' });
        carve(side < 0 ? b.x + b.w : foyer.x + foyer.w, b.cy - 1, side < 0 ? foyer.x - 1 : b.x - 1, b.cy + 1); link(foyer, b);
      }
      const R1 = r.int(17, 21), spread = r.pick([0.8, 0.9, 1.0]), ay = foyer.y - 5 - R1, half = Math.ceil(R1 * Math.sin(spread)) + 1;
      const aud = room(CX - half, ay, half * 2 + 1, R1 + 1, { shape: 'fan', fan: { ax: CX, ay, r1: R1, spread }, kind: 'auditorium' });
      carve(CX - 2, ay + R1 - 3, CX + 2, foyer.y - 1); link(foyer, aud);
      const boss = room(CX - (bossW >> 1), ay - 6 - bossH, bossW, bossH, { kind: 'stage' });
      carve(CX - 4, boss.y + boss.h, CX + 4, ay + 1); link(aud, boss);
      m.maskStand = { x: CX, y: ay + 4 };
      // the wings: a curtained passage from each side of the house, winding up beside the stage, rooms off it
      const KINDS = ['dressing', 'props', 'wardrobe', 'dressing', 'props'].sort(() => r() - 0.5);
      for (const side of [-1, 1]) {
        const dd = R1 * 0.72, ex = Math.round(CX + side * dd * Math.sin(spread)), ey = Math.round(ay + dd * Math.cos(spread));
        const x2 = ex + side * r.int(8, 11), yTop = boss.y + r.int(3, 7);
        carve(Math.min(ex, x2), ey - 1, Math.max(ex, x2), ey + 1); carve(x2 - 1, yTop, x2 + 1, ey + 1);
        const loft = room(side < 0 ? x2 - 12 : x2 + 2, yTop - 3, 11, 8, { kind: 'flyloft', prefer: 'mask', leaf: true });
        carve(side < 0 ? loft.x + loft.w : x2 + 1, yTop, side < 0 ? x2 - 1 : loft.x - 1, yTop + 2); link(aud, loft);
        for (let k = 0, y = yTop + 12; y < ey - 6 && k < 2; k++, y += r.int(11, 14)) {
          const w = r.int(11, 13), h = r.int(8, 10), rx = side < 0 ? x2 - 3 - w : x2 + 3;
          const rm = room(rx, y - (h >> 1), w, h, { kind: KINDS.pop() || 'dressing', prefer: 'mask', leaf: true });
          carve(side < 0 ? rm.x + rm.w : x2 + 1, y - 1, side < 0 ? x2 - 1 : rm.x - 1, y + 1); link(aud, rm);
        }
      }
      return { start: lobby, boss };
    },
    // ---- THE PRISM LIGHTHOUSE: galleries spiralling in and up to the lantern room, light-wells off the spiral
    spire() {
      const C = S >> 1, n = def.rooms || 11, TAU0 = Math.PI * 2;
      const boss = room(C - (bossW >> 1), C - (bossH >> 1), bossW, bossH, { shape: 'round', kind: 'lantern' });
      const clear = (x, y, w, h) => rooms.every((o) => x + w + 4 < o.x || o.x + o.w + 4 < x || y + h + 4 < o.y || o.y + o.h + 4 < y) && x > 4 && y > 4 && x + w < S - 4 && y + h < S - 4;
      let th = r() * TAU0, prev = null, start = null, wells = 0;
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1), rad = 84 - t * 48;
        th += 0.66 + r() * 0.16;
        const w = k === 0 ? 15 : r.int(13, 19) | 1, h = k === 0 ? 13 : r.int(11, 17) | 1;
        const x = Math.round(C + Math.cos(th) * rad - (w >> 1)), y = Math.round(C + Math.sin(th) * rad - (h >> 1));
        const g = room(x, y, w, h, { kind: k === 0 ? 'landing' : 'gallery', shape: k && r.chance(0.5) ? 'octa' : 'rect' });
        if (prev) { tube(prev.cx, prev.cy, g.cx, g.cy, 1); link(prev, g); } else start = g;
        prev = g;
        if (k >= 1 && k < n - 1 && (r.chance(0.45) || (k % 3 === 2 && wells < 3))) {   // a light-well: a mirror chamber out beyond the gallery
          for (let tr = 0; tr < 6; tr++) {
            const ww = 17, hh = 13, rr2 = rad + 21 + tr * 2, a2 = th + (r() - 0.5) * 0.3;
            const wx = Math.round(C + Math.cos(a2) * rr2 - (ww >> 1)), wy = Math.round(C + Math.sin(a2) * rr2 - (hh >> 1));
            if (!clear(wx, wy, ww, hh)) continue;
            const lw = room(wx, wy, ww, hh, { kind: 'lightwell', prefer: 'mirror', leaf: true });
            tube(g.cx, g.cy, lw.cx, lw.cy, 1); link(g, lw); wells++; break;
          }
        }
      }
      tube(prev.cx, prev.cy, boss.cx, boss.cy, 2); link(prev, boss);
      return { start, boss };
    },
    // ---- THE SLEEPER'S DREAM: islands of dream drifting in a starry void, joined by bridges of dream-stuff
    islands() {
      const C = S >> 1, isl = [], n = def.rooms || 13;
      const blob = (cx, cy, rad, o = {}) => { const b = room(cx - rad - 1, cy - rad - 1, rad * 2 + 3, rad * 2 + 3, { shape: 'blob', rad, seed: r(), kind: 'isle', ...o }); b.cx = cx; b.cy = cy; isl.push(b); return b; };
      const bridge = (a, b, fade) => {                                   // a gently curving span, two wide
        const mx = (a.cx + b.cx) / 2 + (r() - 0.5) * 14, my = (a.cy + b.cy) / 2 + (r() - 0.5) * 14, L = Math.hypot(b.cx - a.cx, b.cy - a.cy) * 1.3;
        const span = { tiles: [], fade, period: 4 + r() * 2.5, phase: r() * 6 };
        for (let i = 0; i <= L; i++) {
          const t = i / L, x = (1 - t) * (1 - t) * a.cx + 2 * (1 - t) * t * mx + t * t * b.cx, y = (1 - t) * (1 - t) * a.cy + 2 * (1 - t) * t * my + t * t * b.cy;
          for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
            const X = Math.round(x) + ox, Y = Math.round(y) + oy;
            if (tile(X, Y) === TID.void) { set(X, Y, fade ? TID.fadebridge : TID.dreambridge); span.tiles.push(Y * S + X); }
          }
        }
        (m.spans = m.spans || []).push(span); link(a, b);
      };
      const start = blob(28, C + r.int(-20, 20), 8, { kind: 'shore', calm: true });
      for (let g = 0; isl.length < n && g < 2000; g++) {
        const from = r.chance(0.55) ? isl[isl.length - 1] : r.pick(isl), rad = r.int(8, 12), a = (r() - 0.5) * 2.4 + (from.cx < S * 0.75 ? 0 : Math.PI);
        const dd = from.rad + rad + r.int(7, 12), cx = Math.round(from.cx + Math.cos(a) * dd), cy = Math.round(from.cy + Math.sin(a) * dd);
        if (cx < rad + 8 || cy < rad + 8 || cx > S - rad - 50 || cy > S - rad - 8) continue;
        if (isl.some((o) => Math.hypot(o.cx - cx, o.cy - cy) < o.rad + rad + 6)) continue;
        bridge(from, blob(cx, cy, rad), r.chance(0.35));
      }
      for (const a of isl) for (const b of isl) if (a !== b && !a.links.includes(b) && Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.rad + b.rad + 11 && r.chance(0.12)) bridge(a, b, true);
      const far = isl.reduce((a, b) => (b.cx > a.cx ? b : a));
      const BR = 16;
      let bx = Math.min(S - BR - 6, far.cx + far.rad + BR + 9), by = far.cy;
      if (isl.some((o) => o !== far && Math.hypot(o.cx - bx, o.cy - by) < o.rad + BR + 5)) by = far.cy + (far.cy < C ? BR + far.rad : -BR - far.rad);
      const boss = blob(bx, by, BR, { kind: 'moon', calm: true });
      bridge(far, boss, false);
      return { start, boss };
    },
  };

  // ---- the Emberforge (and anything without its own layout): a grid-grown tree of themed rooms, joined by bridges
  const graph = () => {
    const LY = def.layout || {}, [GW, GH] = LY.grid || [5, 4], CS = LY.cell || 44;
    const OX = Math.floor((S - GW * CS) / 2), OY = Math.floor((S - GH * CS) / 2), grid = new Map(), K = (x, y) => x + ',' + y;
    const DIRS = [[1, 0], [0, 1], [0, -1], [-1, 0]], inGrid = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
    const nodes = [];
    const node = (gx, gy, parent) => { const n = { gx, gy, parent }; nodes.push(n); grid.set(K(gx, gy), n); return n; };
    const s0 = node(0, Math.floor(GH / 2), null);
    for (let guard = 0; nodes.length < Math.min(def.rooms + 1, GW * GH) && guard < 4000; guard++) {
      const from = r.chance(0.65) ? nodes[Math.max(0, nodes.length - 1 - r.int(0, 2))] : r.pick(nodes);
      if (nodes.filter((o) => o.parent === from).length + (from.parent ? 1 : 0) >= 3) continue;
      const d = r.pick(r.chance(0.4) ? [[1, 0]] : DIRS), gx = from.gx + d[0], gy = from.gy + d[1];
      if (!inGrid(gx, gy) || grid.has(K(gx, gy))) continue;
      node(gx, gy, from);
    }
    const dep = new Map([[s0, 0]]);
    for (const n of nodes) if (n.parent) dep.set(n, dep.get(n.parent) + 1);
    const far = nodes.reduce((a, b) => (dep.get(b) > dep.get(a) ? b : a));
    for (const n of nodes) {
      const isB = n === far, isS = n === s0;
      const w = isB ? Math.min(bossW, CS - 7) : isS ? 15 : r.int(LY.minW || 17, Math.min(LY.maxW || 29, CS - 10));
      const h = isB ? Math.min(bossH, CS - 7) : isS ? 13 : r.int(LY.minH || 15, Math.min(LY.maxH || 23, CS - 10));
      const sx = OX + n.gx * CS, sy = OY + n.gy * CS, jx = Math.max(0, Math.floor((CS - w) / 2) - 3), jy = Math.max(0, Math.floor((CS - h) / 2) - 3);
      n.room = room(sx + Math.floor((CS - w) / 2) + r.int(-jx, jx), sy + Math.floor((CS - h) / 2) + r.int(-jy, jy), w, h,
        { kind: 'graph', shape: isB || isS ? 'rect' : r.pick(LY.shapes || ['rect', 'cross']), gx: n.gx, gy: n.gy });
    }
    // bridges: one tile of floor over a channel of lava, bending in the gap between cells
    const bridge = (a, b) => {
      const A = a.room, B = b.room;
      const lay = (x0, y0, x1, y1) => { carve(x0, y0, x1, y1, def.style === 'ember' ? HOT : FLOOR); };
      if (A.gx !== B.gx) {
        const mx = OX + Math.max(A.gx, B.gx) * CS;
        lay(A.cx, A.cy - 1, mx, A.cy + 1); lay(mx - 1, A.cy, mx + 1, B.cy); lay(mx, B.cy - 1, B.cx, B.cy + 1);
        carve(A.cx, A.cy, mx, A.cy); carve(mx, A.cy, mx, B.cy); carve(mx, B.cy, B.cx, B.cy);
      } else {
        const my = OY + Math.max(A.gy, B.gy) * CS;
        lay(A.cx - 1, A.cy, A.cx + 1, my); lay(A.cx, my - 1, B.cx, my + 1); lay(B.cx - 1, my, B.cx + 1, B.cy);
        carve(A.cx, A.cy, A.cx, my); carve(A.cx, my, B.cx, my); carve(B.cx, my, B.cx, B.cy);
      }
      link(A, B);
    };
    for (const n of nodes) if (n.parent) bridge(n.parent, n);
    let loops = (def.layout && def.layout.loops) || 0;
    for (const a of nodes) for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const b = grid.get(K(a.gx + dx, a.gy + dy));
      if (loops > 0 && b && a !== far && b !== far && !a.room.links.includes(b.room) && r.chance(0.5)) { bridge(a, b); loops--; }
    }
    return { start: s0.room, boss: far.room, gridded: true };
  };

  const { start, boss } = (LAYOUT[def.style] || graph)();
  boss.isBoss = true;
  // carve every room (the layouts carve their own halls and corridors)
  for (const n of rooms) carveRoom(n);

  // ---- depth from the entrance (some layouts know it already)
  const depth = new Map();
  { const q = [start]; depth.set(start, 0); while (q.length) { const n = q.shift(); for (const o of n.links) if (!depth.has(o)) { depth.set(o, depth.get(n) + 1); q.push(o); } } }
  for (const n of rooms) if (!depth.has(n)) depth.set(n, n.depth || 1);
  const path = new Set();                                            // the rooms between the entrance and the boss
  { const prev = new Map([[start, null]]), q = [start]; while (q.length) { const n = q.shift(); for (const o of n.links) if (!prev.has(o)) { prev.set(o, n); q.push(o); } }
    for (let n = boss; n; n = prev.get(n)) path.add(n); }

  // ---- roles: the seals (wardens, levers, the puzzle), a mystery altar, treasure
  const cands = () => rooms.filter((n) => n !== start && n !== boss && n.role === 'fight' && !n.few);
  const pickRoom = (kind) => {
    const f = cands(), pref = f.filter((n) => n.prefer === kind), leaves = f.filter((n) => (n.leaf || n.links.length === 1) && !path.has(n)), off = f.filter((n) => !path.has(n));
    const pool = pref.length ? pref : leaves.length ? leaves : off.length ? off : f;
    return pool.length ? r.pick(pool) : null;
  };
  let seals = 0;
  for (const kind of def.seals || []) { const n = pickRoom(kind); if (n) { n.role = kind; seals++; } }
  if (def.altar !== false) { const n = pickRoom('altar'); if (n && r.chance(0.8)) n.role = 'altar'; }
  for (const n of cands()) if ((n.leaf || n.links.length === 1) && r.chance(0.55)) n.role = 'treasure';

  // ================================================================ each dungeon dresses its own rooms
  const ROW = (n, y, x0, x1, step, sprite, solid = true) => { for (let x = x0; x <= x1; x += step) put2(n, x, y, sprite, solid); };
  const THEMES = ['foundry', 'golemworks', 'smeltery', 'armory', 'bridgehall', 'quarters'].sort(() => r() - 0.5);
  let themeK = 0;
  const quietRole = (n) => n.role === 'puzzle' || n.role === 'altar' || n.role === 'lever' || n.role === 'mirror' || n.role === 'trial';
  const DRESS = {
    chapel(n) {
      if (n.kind === 'nave') {                                          // pillars, pews either side of the aisle, flooded side aisles
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 4) { set(x, n.y + 3, WALL); set(x, n.y + n.h - 4, WALL); }
        for (let x = n.x; x < n.x + n.w; x++) { if ((x - n.x) % 5 !== 2) { set(x, n.y + 1, TID.shallows); set(x, n.y + n.h - 2, TID.shallows); } }
        for (let y = n.y + 5; y <= n.y + n.h - 6; y += 2) for (let x = n.x + 3; x < n.x + n.w - 3; x++) if (Math.abs(x - n.cx) > 2 && (x - n.x) % 6) put2(null, x, y, 'bench_h', false);
      } else if (n.kind === 'sidechapel') {                             // a little shrine: an altar, two braziers, kneelers
        put2(null, n.cx, n.y + 1, 'statue_sun'); put2(null, n.x + 1, n.y + 1, 'brazier'); put2(null, n.x + n.w - 2, n.y + 1, 'brazier');
        if (n.role !== 'treasure') ROW(null, n.y + 4, n.x + 2, n.x + n.w - 3, 2, 'bench_h', false);
      } else if (n.kind === 'narthex') {
        put2(null, n.cx, n.cy - 2, 'fountain'); put2(null, n.x + 1, n.y + 1, 'brazier'); put2(null, n.x + n.w - 2, n.y + 1, 'brazier');
      } else if (n.kind === 'crossing') {                                // four great piers and a sunken font
        for (const [dx, dy] of [[-5, -5], [4, -5], [-5, 4], [4, 4]]) carve(n.cx + dx, n.cy + dy, n.cx + dx + 1, n.cy + dy + 1, WALL);
        for (const [dx, dy] of [[-3, 0], [3, 0]]) set(n.cx + dx, n.cy + dy, TID.shallows);
      } else if (n.kind === 'transept') {
        for (let y = n.y + 3; y < n.y + n.h - 2; y += 2) ROW(null, y, n.x + 2, n.x + n.w - 3, 1, 'bench_h', false);
        put2(null, n.cx, n.side < 0 ? n.y + 1 : n.y + n.h - 2, 'whale_rib');
      } else if (n.kind === 'cloister' && n.garden) {                   // a walk round a garden: the middle is a drowned lawn
        for (let y = n.y + 4; y < n.y + n.h - 4; y++) for (let x = n.x + 4; x < n.x + n.w - 4; x++) set(x, y, (x + y) % 5 ? TID.shallows : TID.grass);
        for (const [x, y] of [[n.x + 4, n.y + 4], [n.x + n.w - 5, n.y + 4], [n.x + 4, n.y + n.h - 5], [n.x + n.w - 5, n.y + n.h - 5]]) set(x, y, WALL);
        put2(null, n.cx, n.cy, 'fountain');
      } else if (n.kind === 'belltower') {
        put2(null, n.cx, n.cy - 1, 'statue_sun');
      } else if (n.kind === 'apse') {                                   // a ring of columns round the Abbot's pulpit
        for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const x = Math.round(n.cx + Math.cos(a) * (n.w / 2 - 4)), y = Math.round(n.cy + Math.sin(a) * (n.h / 2 - 4)); if (Math.abs(y - n.cy) > 3) set(x, y, WALL); }
      }
    },
    crypt(n) {
      if (n.kind === 'tomb') {                                          // sarcophagi in rows, candles at the corners
        if (n.role !== 'treasure') { put2(null, n.x + 2, n.cy, 'sarcophagus'); put2(null, n.x + n.w - 3, n.cy, 'sarcophagus'); }
        for (const [x, y] of [[n.x + 1, n.y + 1], [n.x + n.w - 2, n.y + 1], [n.x + 1, n.y + n.h - 2], [n.x + n.w - 2, n.y + n.h - 2]]) put2(null, x, y, 'crypt_candle');
      } else if (n.kind === 'ossuary_hall') {                           // the Lich's hall: rows of sarcophagi, a drowned floor at the edges
        for (let x = n.x + 3; x < n.x + n.w - 3; x += 5) { put2(n, x, n.y + 3, 'sarcophagus'); put2(n, x, n.y + n.h - 4, 'sarcophagus'); }
        for (let x = n.x; x < n.x + n.w; x++) { set(x, n.y, WET); set(x, n.y + n.h - 1, WET); }
      } else if (n.kind === 'vestibule') {
        put2(null, n.x + 1, n.y + 1, 'crypt_candle'); put2(null, n.x + n.w - 2, n.y + 1, 'crypt_candle');
      }
    },
    forge(n) {
      if (n.kind === 'hall') {                                          // furnaces along the back wall, anvils in pairs, the floor half drowned
        ROW(n, n.y + 1, n.x + 3, n.x + n.w - 4, 5, 'furnace');
        for (const [dx, dy] of [[-6, -3], [5, -3], [-6, 3], [5, 3]]) put2(n, n.cx + dx, n.cy + dy, 'anvil_block');
        for (let x = n.x; x < n.x + n.w; x++) for (let y = n.y + n.h - 3; y < n.y + n.h; y++) if (Math.abs(x - n.cx) > 2) set(x, y, TID.shallows);
        put2(n, n.x + 1, n.cy + 4, 'barrel'); put2(n, n.x + n.w - 2, n.cy - 4, 'crate');
      } else if (n.kind === 'anvilhall') {
        put2(n, n.cx, n.y + 2, 'statue_anvil');
        for (const [dx, dy] of [[3, 3], [n.w - 5, 3], [3, n.h - 5], [n.w - 5, n.h - 5]]) carve(n.x + dx, n.y + dy, n.x + dx + 1, n.y + dy + 1, HOT);
      }
    },
    scriptorium(n) {
      if (n.kind === 'stacks') {                                        // rows of shelves: aisles, gaps to slip through, a cross of open floor
        for (let y = n.y + 2; y < n.y + n.h - 2; y += 3) for (let x = n.x + 2; x < n.x + n.w - 2; x++) {
          if (Math.abs(x - n.cx) <= 1 || Math.abs(y - n.cy) <= 1 || (x - n.x) % 7 === 0) continue;
          put2(null, x, y, 'bookshelf');
        }
        for (const [x, y] of [[n.x + 1, n.y + 1], [n.x + n.w - 2, n.y + 1], [n.x + 1, n.y + n.h - 2], [n.x + n.w - 2, n.y + n.h - 2]]) put2(null, x, y, 'rune_pillar');
        if (HAZ !== null) for (let k = 0; k < 6; k++) { const x = n.x + r.int(2, n.w - 3), y = n.y + r.int(2, n.h - 3); if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) set(x, y, HAZ); }
      } else if (n.kind === 'reading' && !quietRole(n)) {               // a reading room: desks, a lamp
        ROW(null, n.cy, n.x + 2, n.x + n.w - 3, 3, 'bench_h', false); put2(null, n.x + 1, n.y + 1, 'brazier');
      } else if (n.kind === 'archive') {
        for (let x = n.x + 2; x < n.x + n.w - 2; x++) if (Math.abs(x - n.cx) > 3) { put2(null, x, n.y + 1, 'bookshelf'); }
      }
    },
    heart(n) {
      if (n.kind === 'chamber' && !quietRole(n)) {                      // rib pillars in a ring, a pool of molten gold
        const k = 10, rx = n.w / 2 - 3, ry = n.h / 2 - 3;
        for (let j = 0; j < k; j++) { const a = (j / k) * Math.PI * 2 + 0.2, x = Math.floor(n.cx + Math.cos(a) * rx), y = Math.floor(n.cy + Math.sin(a) * ry); if (midClear(n, x, y) && isF(x, y)) set(x, y, WALL); }
        if (HAZ !== null) for (let y = n.cy - 2; y <= n.cy + 2; y++) for (let x = n.cx - 2; x <= n.cx + 2; x++) if (Math.hypot(x - n.cx, y - n.cy) < 2.3 && x !== n.cx && y !== n.cy) set(x, y, HAZ);
        if (r.chance(0.5)) put2(n, n.x + 3, n.cy + 2, 'fallen_head');
      } else if (n.kind === 'heartchamber') {
        for (let j = 0; j < 14; j++) { const a = (j / 14) * Math.PI * 2, x = Math.round(n.cx + Math.cos(a) * (n.w / 2 - 3)), y = Math.round(n.cy + Math.sin(a) * (n.h / 2 - 3)); if (Math.abs(y - n.cy) > 2) set(x, y, WALL); }
      }
    },
    throne(n) {
      if (n.kind === 'champion') {                                      // a champion's hall: a throne on a dais, banners, braziers in rows
        carve(n.cx - 3, n.y + 1, n.cx + 3, n.y + 3, TID.marble);
        put2(null, n.cx, n.y + 2, 'throne');
        for (let y = n.y + 6; y < n.y + n.h - 2; y += 4) { put2(n, n.x + 2, y, 'brazier'); put2(n, n.x + n.w - 3, y, 'brazier'); }
        put2(null, n.x + 4, n.y + 1, 'banner'); put2(null, n.x + n.w - 5, n.y + 1, 'banner');
      } else if (n.kind === 'treasury') {
        put2(null, n.x + 1, n.y + 1, 'brazier'); put2(null, n.x + n.w - 2, n.y + 1, 'brazier'); put2(null, n.x + 2, n.y + n.h - 2, 'ingot_pile');
      } else if (n.kind === 'throneroom') {                             // the throne itself, behind where the god stands
        carve(n.cx - 4, n.y + 1, n.cx + 4, n.y + 4, TID.marble);
        put2(null, n.cx, n.y + 2, 'throne');
        for (let y = n.y + 7; y < n.y + n.h - 3; y += 5) for (const x of [n.x + 4, n.x + n.w - 5]) carve(x, y, x + 1, y + 1, WALL);
        put2(null, n.x + 2, n.y + 1, 'banner'); put2(null, n.x + n.w - 3, n.y + 1, 'banner');
      } else if (n.kind === 'guardroom') {
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) put2(null, x, n.y + 1, 'weapon_rack');
        put2(null, n.cx, n.y + n.h - 2, 'brazier');
      } else if (n.kind === 'gatehouse') {
        put2(null, n.x + 1, n.y + 1, 'brazier'); put2(null, n.x + n.w - 2, n.y + 1, 'brazier'); put2(null, n.cx, n.y + 1, 'banner');
      }
    },
    ember(n) {
      if (n === start || n === boss || quietRole(n)) return;
      const theme = THEMES[themeK++ % THEMES.length]; n.theme = theme;
      const at = (x, y, sprite, solid = true) => put2(n, x, y, sprite, solid);
      if (theme === 'foundry') { for (let x = n.x + 3; x < n.x + n.w - 3; x += 4) { at(x, n.y + 3, 'crucible'); at(x, n.y + n.h - 4, 'crucible'); at(x + 2, n.y + 5, 'ember_vent', false); } }
      else if (theme === 'golemworks') { for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) { at(x, n.y + 2, 'golem_husk'); at(x, n.y + n.h - 3, 'golem_husk'); } at(n.x + 2, n.cy + 3, 'anvil_block'); at(n.x + n.w - 3, n.cy - 3, 'anvil_block'); }
      else if (theme === 'smeltery') {
        for (const [qx, qy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const px = Math.round(n.cx + qx * n.w / 4), py = Math.round(n.cy + qy * n.h / 4);
          for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) if ((x - px) ** 2 + (y - py) ** 2 <= 4.5 && isF(x, y) && midClear(n, x, y)) set(x, y, HOT);
          at(px + qx * 3, py, 'crucible');
        }
      } else if (theme === 'armory') { for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) at(x, n.y + 1, 'weapon_rack'); for (const x of [n.x + 2, n.x + 4, n.x + n.w - 5, n.x + n.w - 3]) at(x, n.y + n.h - 3, 'ingot_pile'); }
      else if (theme === 'bridgehall') { for (let y = n.y + 2; y < n.y + n.h - 2; y++) for (let x = n.x + 2; x < n.x + n.w - 2; x++) if (Math.abs(x - n.cx) > 1 && Math.abs(y - n.cy) > 1 && isF(x, y)) set(x, y, HOT); }
      else { for (let k = 0; k < 4; k++) { const x = n.x + 2 + r.int(0, n.w - 5), y = n.y + 2 + r.int(0, n.h - 5); for (let j = 0; j < 3; j++) at(x + j, y, j % 2 ? 'ruin_wall' : 'ruin_wall2'); } at(n.x + 2, n.y + 2, 'brazier'); }
    },

    hive(n) {
      if (n === start) { put2(null, n.cx - 3, n.cy - 3, 'glow_larva', false); put2(null, n.cx + 3, n.cy - 3, 'glow_larva', false); return; }
      if (n === boss) {                                                  // the royal cell: honey moats and wax pillars round the throne-comb
        for (const [dx, dy] of [[-8, -6], [8, -6], [-8, 6], [8, 6], [0, -11], [0, 11]]) { const x = n.cx + dx, y = n.cy + dy; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isF(x + i, y + j) && Math.abs(i) + Math.abs(j) < 2) set(x + i, y + j, TID.honey); }
        for (const [dx, dy] of [[-5, -9], [5, -9], [-5, 9], [5, 9]]) put2(null, n.cx + dx, n.cy + dy, 'glow_larva', false);
        return;
      }
      if (quietRole(n)) return;
      for (let k = 0, pools = r.int(1, 3); k < pools; k++) {              // honey pools: sticky underfoot
        const px = n.cx + r.int(-4, 4), py = n.cy + r.int(-4, 4), pr = r.int(1, 3);
        for (let y = py - pr; y <= py + pr; y++) for (let x = px - pr; x <= px + pr; x++) if (Math.hypot(x - px, y - py) <= pr + 0.3 && isF(x, y)) set(x, y, TID.honey);
      }
      for (let k = 0; k < 3; k++) put2(n, n.cx + r.int(-5, 5), n.cy + r.int(-5, 5), r.pick(['wax_pillar', 'brood_comb', 'brood_comb']));
      put2(null, n.cx + r.int(-4, 4), n.cy + r.int(-6, -3), 'glow_larva', false);
      if (n.role === 'treasure') put2(null, n.cx + 2, n.cy + 2, 'honey_vat');
    },
    theatre(n) {
      if (n.kind === 'lobby') { put2(null, n.cx, n.y + 2, 'ticket_booth'); for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) if (Math.abs(x - n.cx) > 2) put2(null, x, n.cy + 2, 'velvet_rope'); }
      else if (n.kind === 'foyer') { for (let x = n.x + 3; x < n.x + n.w - 3; x += 6) { put2(null, x, n.y + 1, 'bust_statue'); put2(null, x, n.y + n.h - 2, 'footlight', false); } }
      else if (n.kind === 'auditorium') {                                // rows of seats in arcs, with three aisles
        const F = n.fan;
        for (let d = 7; d <= F.r1 - 2; d += 3) {
          const step = 1 / d;
          for (let a = -F.spread + 0.08; a <= F.spread - 0.08; a += step) {
            if (Math.abs(a) < 2.2 / d || Math.abs(Math.abs(a) - F.spread * 0.55) < 1.8 / d) continue;   // the aisles
            const x = Math.round(F.ax + Math.sin(a) * d), y = Math.round(F.ay + Math.cos(a) * d);
            if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, 'seat', x, y, true);
          }
        }
        for (const s2 of [-1, 1]) put2(null, F.ax + s2 * 4, F.ay + 1, 'footlight', false);
      } else if (n.kind === 'box') { for (let x = n.x + 2; x < n.x + n.w - 2; x += 2) put2(null, x, n.y + n.h - 3, 'seat'); }
      else if (n.kind === 'dressing') { for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) put2(null, x, n.y + 1, 'vanity_mirror'); put2(null, n.x + 1, n.y + n.h - 2, 'costume_rack'); }
      else if (n.kind === 'wardrobe') { for (let y = n.y + 2; y < n.y + n.h - 2; y += 2) { put2(null, n.x + 2, y, 'costume_rack'); put2(null, n.x + n.w - 3, y, 'costume_rack'); } }
      else if (n.kind === 'props') { for (let k = 0; k < 5; k++) put2(n, n.x + r.int(1, n.w - 2), n.y + r.int(1, n.h - 2), r.pick(['prop_crate', 'prop_crate', 'stage_moon'])); }
      else if (n.kind === 'flyloft') { for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) put2(null, x, n.y + 1, 'sandbag'); }
      else if (n.kind === 'stage') { for (let x = n.x + 3; x < n.x + n.w - 3; x += 4) put2(null, x, n.y + n.h - 2, 'footlight', false); for (const x of [n.x + 1, n.x + n.w - 2]) for (let y = n.y + 2; y < n.y + n.h - 3; y += 3) put2(null, x, y, 'curtain_drape'); }
    },
    spire(n) {
      if (n === boss) {                                                  // the lantern room: the great lens and three lens pedestals
        put2(null, n.cx, n.y + 2, 'great_lens');
        return;
      }
      if (n.kind === 'lightwell' || quietRole(n)) return;
      for (let k = 0; k < 4; k++) put2(n, n.x + r.int(2, n.w - 3), n.y + r.int(2, n.h - 3), r.pick(['crystal_cluster', 'crystal_cluster', 'prism_pillar']));
      if (n !== start && r.chance(0.7)) put2(null, n.cx + r.pick([-3, 3]), n.cy + r.pick([-3, 3]), 'lens_sentry', true, { sentry: true });
    },
    islands(n) {
      if (n === start) { put2(null, n.cx, n.cy - 3, 'dream_lamp'); return; }
      if (n === boss) { for (const [dx, dy] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) put2(null, n.cx + dx, n.cy + dy, 'dream_lamp'); return; }
      if (quietRole(n)) return;
      for (let k = 0; k < 3; k++) put2(n, n.cx + r.int(-n.rad + 3, n.rad - 3), n.cy + r.int(-n.rad + 3, n.rad - 3), r.pick(['pillow_pile', 'stopped_clock', 'moon_shard', 'dream_lamp']));
    },
  };
  for (const n of rooms) (DRESS[def.style] || (() => {}))(n);
  if (boss.shape === 'rect' && !['throne', 'crypt', 'forge', 'theatre'].includes(def.style)) {   // a plain boss hall gets pillars and hazards
    if (HAZ !== null) for (const [dx, dy] of [[3, 3], [boss.w - 5, 3], [3, boss.h - 5], [boss.w - 5, boss.h - 5]]) carve(boss.x + dx, boss.y + dy, boss.x + dx + 1, boss.y + dy + 1, HAZ);
    for (const [dx, dy] of [[7, 6], [boss.w - 8, 6], [7, boss.h - 7], [boss.w - 8, boss.h - 7]]) set(boss.x + dx, boss.y + dy, WALL);
  }

  // ---- secret rooms: a hollow space beyond a chamber's wall, reached by a narrow tunnel plugged with a cracked wall
  const secrets = [];
  for (let k = 0, tries = 0; k < ((def.layout && def.layout.secrets) || 0) && tries < 200; tries++) {
    const pool = rooms.filter((n) => n !== boss && n !== start && !n.few);
    if (!pool.length) break;
    const a = r.pick(pool);
    const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), gap = r.int(4, 7), w = 11, h = 9;
    const sx = dx > 0 ? a.x + a.w + gap : dx < 0 ? a.x - gap - w : a.cx - (w >> 1), sy = dy > 0 ? a.y + a.h + gap : dy < 0 ? a.y - gap - h : a.cy - (h >> 1);
    const tx0 = dx > 0 ? a.x + a.w : dx < 0 ? sx + w : a.cx, ty0 = dy > 0 ? a.y + a.h : dy < 0 ? sy + h : a.cy;
    const tx1 = dx > 0 ? sx - 1 : dx < 0 ? a.x - 1 : a.cx, ty1 = dy > 0 ? sy - 1 : dy < 0 ? a.y - 1 : a.cy;
    if (!voidAt(sx - 2, sy - 2, sx + w + 1, sy + h + 1) || !voidAt(Math.min(tx0, tx1) - (dy ? 1 : 0), Math.min(ty0, ty1) - (dx ? 1 : 0), Math.max(tx0, tx1) + (dy ? 1 : 0), Math.max(ty0, ty1) + (dx ? 1 : 0))) continue;
    const ex = dx > 0 ? a.x + a.w - 1 : dx < 0 ? a.x : a.cx, ey = dy > 0 ? a.y + a.h - 1 : dy < 0 ? a.y : a.cy;
    if (!isF(ex, ey)) continue;                                         // the chamber's own floor must reach the wall there
    const s = room(sx, sy, w, h, { secret: true, role: 'secret', kind: 'secret', from: a });
    rooms.pop();                                                      // secrets are kept apart from the room list
    carveRoom(s); carve(tx0, ty0, tx1, ty1);
    s.plug = { x: dx > 0 ? a.x + a.w : dx < 0 ? a.x - 1 : a.cx, y: dy > 0 ? a.y + a.h : dy < 0 ? a.y - 1 : a.cy };
    secrets.push(s); k++;
  }

  // ---- walls around every floor tile
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
    if (tile(x, y) !== TID.void) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const t = tile(x + dx, y + dy);
      if (t !== TID.void && t !== WALL) { m.tiles[idx(m, x, y)] = WALL; break; }
    }
  }
  for (const s of secrets) { m.tiles[idx(m, s.plug.x, s.plug.y)] = WALL; put(m, 'weak_wall', s.plug.x, s.plug.y, true, { interact: 'weak', hp: 4 }); }
  if (def.style === 'islands') for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === TID.void) m.tiles[i] = TID.starvoid;

  // ---- the sealed gate: every way into the boss's hall is barred until the seals break
  if (seals > 0) {
    for (let x = boss.x - 1; x <= boss.x + boss.w; x++) for (let y = boss.y - 1; y <= boss.y + boss.h; y++) {
      if (x >= boss.x && x < boss.x + boss.w && y >= boss.y && y < boss.y + boss.h) continue;
      const t = tile(x, y);
      if (t !== WALL && t !== TID.void) put(m, 'seal_gate', x, y, true, { interact: 'gate' });
    }
  }
  // ---- the story: journal pages from the entrance to the last room before the boss
  if (def.story) {
    const way = rooms.filter((n) => n !== boss && !n.few).sort((a, b) => depth.get(a) - depth.get(b));
    def.story.forEach((text, k) => {
      const n = way[Math.min(way.length - 1, Math.round(k * (way.length - 1) / Math.max(1, def.story.length - 1)))];
      for (let t = 0; t < 40; t++) {
        const x = n.x + 1 + r.int(0, n.w - 3), y = n.y + 1 + r.int(0, Math.max(1, Math.min(3, n.h - 3)));
        if (isF(x, y) && midClear(n, x, y) && !m.objects.some((o) => Math.abs(o.x - 0.5 - x) < 2 && Math.abs(o.y - 0.5 - y) < 2)) {
          put(m, 'journal', x, y, true, { interact: 'journal', page: k, label: 'Read the page' }); break;
        }
      }
    });
  }
  // ---- the seals' furniture: levers, the puzzle, the altar
  for (const n of rooms) {
    const k = rooms.indexOf(n);
    if (n.role === 'lever') {
      let lx = n.cx + 3, ly = n.y + 1;
      for (let j = 0; j < 12 && !isF(lx, ly); j++) { lx += Math.sign(n.cx - lx); ly += Math.sign(n.cy - ly); }
      put(m, 'lever_off', lx, ly, true, { interact: 'lever', room: k });
    }
    if (n.role === 'altar') put(m, 'mystery_altar', n.cx, n.cy - 1, true, { interact: 'mystery' });
    if (n.role === 'puzzle' && def.puzzle === 'runes') {
      n.order = [0, 1, 2, 3].sort(() => r() - 0.5);
      put(m, 'lorestone', n.cx, n.cy - 1, true, { interact: 'runehint', room: k });
      [[-4, -2], [4, -2], [-4, 2], [4, 2]].forEach(([ox, oy], j) => { const x = n.cx + ox, y = n.cy + oy; carve(x, y, x, y); put(m, 'rune_off', x, y, true, { interact: 'rune', room: k, j }); });
    } else if (n.role === 'puzzle') {
      [[3, 3], [n.w - 4, 3], [3, n.h - 4], [n.w - 4, n.h - 4]].forEach(([ox, oy], j) => {
        let x = n.x + ox, y = n.y + oy;
        if (n.shape === 'cross') { x = n.cx + (j % 2 ? 4 : -4); y = n.cy + (j < 2 ? -4 : 4); }
        carve(x, y, x, y); put(m, 'plate_off', x, y, false, { interact: 'plate', room: k, j });
      });
    }
  }

  // ---- the new dungeons' seals: masks to carry home, mirror chambers to light, nightmare trials to survive
  for (const n of rooms) {
    const k = rooms.indexOf(n);
    if (n.role === 'mask') {                                          // one of the three lost masks, set on a stand in the room
      const MASKS = ['mask_comedy', 'mask_tragedy', 'mask_silence'], j = rooms.filter((o) => o.role === 'mask').indexOf(n);
      let x = n.cx, y = n.cy;
      for (let t = 0; t < 12 && (!isF(x, y) || m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)); t++) { x = n.cx + r.int(-2, 2); y = n.cy + r.int(-2, 2); }
      put(m, MASKS[j % 3], x, y, false, { interact: 'mask', mask: MASKS[j % 3], label: 'Pick up the mask' });
    }
    if (n.role === 'trial') { carve(n.cx - 1, n.cy - 1, n.cx + 1, n.cy + 1); put(m, 'dream_sigil', n.cx, n.cy, false, { interact: 'sigil', room: k, label: 'Wake the nightmare (a trial)' }); }
    if (n.role === 'mirror') {                                        // a beam puzzle: a lamp, mirrors to turn, a crystal to light
      const x0 = n.x + 1, y0 = n.y + 1, x1 = n.x + n.w - 2, y1 = n.y + n.h - 2;
      for (let tries = 0; tries < 200; tries++) {
        let d = r.pick([[1, 0], [0, 1], [-1, 0], [0, -1]]);
        let x = d[0] > 0 ? x0 : d[0] < 0 ? x1 : r.int(x0 + 2, x1 - 2), y = d[1] > 0 ? y0 : d[1] < 0 ? y1 : r.int(y0 + 2, y1 - 2);
        const src = { x, y, d: [...d] }, used = new Set([x + ',' + y]), mir = [];
        let ok = true;
        const turns = r.int(2, 3);
        for (let t = 0; t <= turns && ok; t++) {
          const len = r.int(2, 5);
          for (let st = 0; st < len; st++) { x += d[0]; y += d[1]; if (x <= x0 || y <= y0 || x >= x1 || y >= y1 || used.has(x + ',' + y) || m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) { ok = false; break; } used.add(x + ',' + y); }
          if (ok && t < turns) { const back = r.chance(0.5), nd = back ? [d[1], d[0]] : [-d[1], -d[0]]; mir.push({ x, y, need: back ? 1 : 0 }); d = nd; }
        }
        const rx = x + d[0], ry = y + d[1];
        if (!ok || rx < x0 || ry < y0 || rx > x1 || ry > y1 || used.has(rx + ',' + ry) || m.objects.some((o) => Math.floor(o.x) === rx && Math.floor(o.y) === ry) || m.objects.some((o) => Math.floor(o.x) === src.x && Math.floor(o.y) === src.y)) continue;
        const beam = { room: k, src, recv: { x: rx, y: ry }, mirrors: [], lit: false };
        put(m, 'beam_lamp', src.x, src.y, true, { beamLamp: true });
        for (const M of mir) { const st = r.chance(0.5) ? M.need : 1 - M.need; beam.mirrors.push(M); put(m, st ? 'mirror_b' : 'mirror_a', M.x, M.y, true, { interact: 'mirror', state: st, label: 'Turn the mirror' }); }
        if (beam.mirrors.every((M) => m.objects.find((o) => o.x === M.x + 0.5 && o.y === M.y + 0.5).state === M.need)) { const o = m.objects.find((q) => q.x === mir[0].x + 0.5 && q.y === mir[0].y + 0.5); o.state = 1 - o.state; o.sprite = o.state ? 'mirror_b' : 'mirror_a'; }
        for (let j = 0; j < 2; j++) {                                   // a decoy or two
          const dx = r.int(x0 + 1, x1 - 1), dy = r.int(y0 + 1, y1 - 1);
          if (!used.has(dx + ',' + dy) && !m.objects.some((o) => Math.floor(o.x) === dx && Math.floor(o.y) === dy)) { const st = r.int(0, 1); put(m, st ? 'mirror_b' : 'mirror_a', dx, dy, true, { interact: 'mirror', state: st, label: 'Turn the mirror' }); }
        }
        put(m, 'receiver_off', rx, ry, true, { receiver: true });
        (m.beams = m.beams || []).push(beam);
        break;
      }
    }
  }
  if (m.maskStand) put(m, 'mask_stand', m.maskStand.x, m.maskStand.y, true, { interact: 'maskstand', label: 'Return the masks' });
  if (def.style === 'spire') {                                        // the lantern room's lens pedestals, in a triangle round the centre
    for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + j * (Math.PI * 2 / 3), x = Math.round(boss.cx + Math.cos(a) * 9), y = Math.round(boss.cy + Math.sin(a) * 8); carve(x, y, x, y); put(m, 'lens_pedestal', x, y, false, { pedestal: j }); }
  }
  // ---- dressing every dungeon shares: a scatter of ground clutter, treasure where it was earned
  m.decor = [];
  const DEC = { chapel: ['shell', 'kelp', 'starfish', 'skullmoss'], forge: ['embervent', 'goldrubble', 'bonepile', 'brokenshield'], heart: ['bonepile', 'goldrubble', 'skullmoss', 'embervent'],
    scriptorium: ['icecrystal', 'runepebble', 'snowtuft', 'brokenshield'], crypt: ['bonepile', 'skullmoss', 'shell', 'kelp'],
    ember: ['embervent', 'goldrubble', 'bonepile'], throne: ['goldrubble', 'pillarstub', 'brokenshield'],
    hive: ['goldrubble', 'shell', 'kelp'], theatre: ['brokenshield', 'goldrubble', 'runepebble'], spire: ['icecrystal', 'runepebble', 'icecrystal'], islands: ['snowtuft', 'runepebble', 'icecrystal'] }[def.style] || ['bonepile', 'goldrubble'];
  for (const n of [...rooms.filter((n) => n !== boss), ...secrets]) {
    for (let j = 0; j < Math.round(n.w * n.h * 0.04); j++) { const x = n.x + r.int(1, n.w - 2), y = n.y + r.int(1, n.h - 2); if (isF(x, y)) m.decor.push({ name: r.pick(DEC), x, y }); }
  }
  for (const n of [...rooms.filter((n) => n.role === 'treasure'), ...secrets]) {
    let x = n.cx, y = n.cy - 1;
    for (let t = 0; t < 8 && (!isF(x, y) || m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)); t++) { x = n.cx + r.int(-2, 2); y = n.cy + r.int(-2, 1); }
    put(m, 'chest', x, y, true, { interact: 'chest', secret: !!n.secret });
    if (n.secret) { put2(null, n.x + 1, n.y + 1, 'brazier'); put2(null, n.x + n.w - 2, n.y + 1, 'brazier'); }
  }
  // some fights are ambushes: their enemies rise only when you walk in
  for (const n of rooms) if (n.role === 'fight' && n !== start && !n.few && depth.get(n) >= 2 && r.chance(0.3)) n.ambush = true;
  // ---- the last touches. A runner of carpet down the royal road and the chapel aisle (only over bare floor)
  const rug = (x, y) => { if (tile(x, y) === FLOOR && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) set(x, y, TID.carpet); };
  for (const [cx, a, b, , cyy] of roads) {
    if (cx === null) { for (let x = a; x <= b; x++) for (let y = cyy - 1; y <= cyy + 1; y++) rug(x, y); continue; }
    for (let y = a; y <= b; y++) for (let x = cx - 1; x <= cx + 1; x++) rug(x, y);
  }
  if (def.style === 'throne') {                       // up the dais to the throne too
    const tr = boss;
    for (let y = tr.y + 4; y < tr.y + tr.h; y++) for (let x = tr.cx - 1; x <= tr.cx + 1; x++) rug(x, y);
    // THE SENTINELS: every other pair of columns on the royal road is a statue that wakes and fires across it
    m.sentinels = [];
    for (const [cx, a, b, last] of roads) {
      if (last) continue;
      let k = 0;
      for (let yy = a + 1; yy < b; yy += 4, k++) {
        if (k % 2) continue;
        for (const side of [-1, 1]) {
          const x = cx + side * 3; set(x, yy, FLOOR);
          put(m, 'statue_sun', x, yy, true, { sentinel: true });
          m.sentinels.push({ x: x + 0.5, y: yy + 0.5, dir: -side, phase: (k >> 1) % 2 ? 1.1 : 0, t: 0 });
        }
      }
    }
  }
  if (belts.length) m.belts = belts;
  // ---- light: the dungeon is dark, and things that burn or glow light it (radius in tiles, colour, flickers)
  const LIGHT = { brazier: [5, '#ff9a3a', 1], crypt_candle: [3.5, '#9cff6a', 1], crucible: [4.5, '#ff8c1e', 1], furnace: [5.5, '#ff7a1a', 1], ember_vent: [3, '#ff6a1a', 1],
    fountain: [4.5, '#6ad8ff', 0], rune_pillar: [3.5, '#3befff', 0], throne: [6, '#ffd650', 0], statue_sun: [4.5, '#ffe89a', 0], mystery_altar: [3.5, '#b888ff', 0],
    journal: [2.5, '#fff6c8', 0], seal_gate: [3, '#ff4a5a', 0], lever_off: [2.2, '#ffd650', 0], lorestone: [3, '#8af0ff', 0], statue_anvil: [3, '#ff9a3a', 0],
    glow_larva: [4, '#ffd650', 1], honey_vat: [3, '#ffb830', 0], footlight: [3.5, '#fff0b0', 0], vanity_mirror: [3, '#fff6d8', 0], ticket_booth: [3, '#ffd650', 0],
    crystal_cluster: [3.5, '#c8a0ff', 0], prism_pillar: [5, '#ffffff', 0], great_lens: [8, '#fffbe0', 0], lens_pedestal: [3, '#fff6c8', 0], beam_lamp: [3, '#fffbe0', 0],
    dream_lamp: [5.5, '#c8b0ff', 1], moon_shard: [3.5, '#bff0ff', 0], dream_sigil: [3.5, '#ff7ab8', 0] };
  m.lights = m.objects.filter((o) => LIGHT[o.sprite]).map((o) => { const L = LIGHT[o.sprite]; return { x: o.x, y: o.y - 0.4, r: L[0] * 16, col: L[1], fire: !!L[2] }; });
  for (let y = 2; y < S - 2; y += 4) for (let x = (y >> 2) % 2 * 2 + 2; x < S - 2; x += 4) {    // lava glows (sampled, so a lake is a few soft pools)
    const t = tile(x, y);
    if (t === TID.lava || t === TID.emberlava) m.lights.push({ x: x + 0.5, y: y + 0.5, r: 40, col: '#ff7a1a', fire: true });
  }
  m.ambient = def.ambient || 'rgba(10,8,20,0.5)';
  finalize(m);
  // m.rooms: entrance first, boss last (other code relies on that); secret rooms ride along in m.secrets
  const order = [start, ...rooms.filter((n) => n !== start && n !== boss), boss];
  for (const o of m.objects) if (o.room !== undefined) o.room = order.indexOf(rooms[o.room]);
  m.rooms = order;
  for (const n of m.rooms) { n.boss = n === boss; n.k = m.rooms.indexOf(n); }
  m.secrets = secrets; m.sides = [];
  m.seals = seals; m.sealsLeft = seals;
  m.gates = m.objects.filter((o) => o.interact === 'gate');
  m.spawn = { x: start.cx + 0.5, y: start.cy + 0.5 };
  m.portals = [];
  m.def = def;
  return m;
}
