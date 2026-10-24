// Map generation: the Nexus (hub), the Realm (procedural island), the Drowned Forge (dungeon).
import { rng, noise2, dist } from '../util.js';

export const TILE_NAMES = ['water', 'deep', 'sand', 'fen', 'mud', 'snow', 'runefloor', 'runeglyph',
  'ash', 'obsidian', 'marble', 'forge', 'forgewall', 'lava', 'void', 'chapelfloor', 'chapelwall', 'goldvein', 'ribwall',
  'grass', 'cobble', 'dirt', 'hedge', 'shallows', 'bog', 'ice', 'dune', 'glassflat', 'loam', 'bramble', 'steppe', 'quartz',
  'cryptfloor', 'cryptwall', 'cryptwater', 'emberfloor', 'emberwall', 'emberlava', 'carpet',
  'combfloor', 'waxwall', 'honey', 'stageboards', 'velvetwall', 'prismfloor', 'crystalwall', 'dreamfloor', 'dreamwall', 'starvoid', 'dreambridge', 'fadebridge', 'fadegone',
  'cliff', 'rift', 'fvsnow', 'fvice', 'fvwater', 'fvwall', 'mrmud', 'mrmoss', 'mrboard', 'mrwall', 'asmarble', 'asgrate', 'asvoid', 'aswall', 'sdsand', 'sdtomb', 'quicksand', 'sdwall', 'ckstone', 'ckcarpet', 'ckmarble', 'ckblood', 'ckwall', 'ckwin', 'hmsaw', 'hmboard', 'hmcheck', 'hmspin', 'hmwall',
  // the user's Realmforge dungeons (src/rf/host.js): one name per tile code of theirs; their art is drawn per dungeon
  'rf_wall', 'rf_floor', 'rf_path', 'rf_pit', 'rf_secret', 'rf_gate', 'rf_haz', 'rf_liq', 'rf_ice', 'rf_bridge', 'rf_tog', 'rf_break', 'rf_conv', 'rf_deep',
  // the Nexus, built in true 8x8 tiles (tools/build_nexus_tiles.py)
  'nxstone', 'nxtrim', 'nxinlay', 'nxwall', 'nxwater', 'nxchasm', 'nxbridge', 'nxsand', 'nxgrass', 'nxbrick'];
export const TID = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i]));
const SOLID_TILES = new Set([TID.nxwall, TID.nxwater, TID.nxchasm, TID.water, TID.deep, TID.forgewall, TID.void, TID.chapelwall, TID.ribwall, TID.hedge, TID.bramble, TID.cryptwall, TID.emberwall, TID.cryptwater,
  TID.waxwall, TID.velvetwall, TID.crystalwall, TID.dreamwall, TID.starvoid, TID.fadegone, TID.cliff, TID.fvwall, TID.mrwall, TID.aswall, TID.sdwall, TID.ckwall, TID.ckwin, TID.hmwall]);
export const BIOMES = ['shore', 'fen', 'runeholt', 'godfall', 'dunes', 'thornwood', 'steppe', 'lowlands'];
// how deep in each land lies: 0 the coast ... 3 the god's fall. The three newer lands share a ring with an older one.
export const BIOME_RING = [0, 1, 2, 3, 0, 1, 2, 1];
export const BIOME_LABEL = { shore: 'The Drowned Shore', fen: 'Ashfen', runeholt: 'Runeholt', godfall: 'Godfall',
  dunes: 'The Saltglass Dunes', thornwood: 'The Thornwood', steppe: 'The Crystal Steppe', lowlands: 'The Greenmarch' };
// ground skins: the Realm Update's tiles (registry, art/bundle/overworld) drawn over a tile that keeps its own
// meaning (sand is still sand to walk on). A skin only shows while the tile under it is still the tile it was laid
// on, so anything that later rewrites a tile (a road, a site's floor) falls back to the old art by itself.
export const SKINS = [null,
  ['ow_tiles/shore_sand_a', 'sand'], ['ow_tiles/shore_sand_b', 'sand'], ['ow_tiles/shore_wet_sand', 'sand'],
  ['ow_tiles/shore_shallows', 'shallows'], ['ow_tiles/shore_deep_water', 'water'], ['ow_tiles/shore_deep_water', 'deep'],
  ['ow_tiles/lowlands_grass_a', 'grass'], ['ow_tiles/lowlands_grass_b', 'grass'], ['ow_tiles/lowlands_tall_grass', 'grass'], ['ow_tiles/lowlands_dirt_path', 'dirt'],
  ['ow_tiles/midlands_forest_floor', 'loam'], ['ow_tiles/midlands_leaf_litter', 'loam'], ['ow_tiles/midlands_mossy_stone', 'loam'], ['ow_tiles/midlands_stream', 'shallows'],
  ['ow_tiles/highlands_rock_floor', 'runefloor'], ['ow_tiles/highlands_gravel', 'runefloor'], ['ow_tiles/highlands_alpine_grass', 'runefloor'],
  ['ow_tiles/highlands_cliff_top', 'cliff'], ['ow_tiles/highlands_snowcap', 'snow'], ['ow_tiles/highlands_gravel', 'steppe'],
  ['ow_tiles/godlands_ash_ground', 'ash'], ['ow_tiles/godlands_blood_rock', 'obsidian'], ['ow_tiles/godlands_rift', 'rift'],
  // Frostveil Hollows (expansion_one): snow in patches, ice, frigid water, and the wall's top (its face is drawn by the renderer)
  ['ex_tiles/frostveil_snow_a', 'fvsnow'], ['ex_tiles/frostveil_snow_b', 'fvsnow'], ['ex_tiles/frostveil_ice', 'fvice'],
  ['ex_tiles/frostveil_frigid_water', 'fvwater'], ['ex_tiles/frostveil_wall_top', 'fvwall'],
  // Mirerot Grotto: mud in patches, moss, the bog (the realm's bog tile, so it slows the same), the wall's top
  ['ex_tiles/mirerot_mud_a', 'mrmud'], ['ex_tiles/mirerot_mud_b', 'mrmud'], ['ex_tiles/mirerot_moss', 'mrmoss'],
  ['ex_tiles/mirerot_bog', 'bog'], ['ex_tiles/mirerot_wall_top', 'mrwall'],
  // the Astral Observatory: marble, brass grate, the void (walkable: you fall), the wall's top
  ['ex_tiles/astral_marble', 'asmarble'], ['ex_tiles/astral_brass_grate', 'asgrate'], ['ex_tiles/astral_void', 'asvoid', { still: true }], ['ex_tiles/astral_wall_top', 'aswall'],
  // Sandscour Tomb: sand outside, the tomb floor inside, quicksand, the wall's top
  ['ex_tiles/sandscour_sand_a', 'sdsand'], ['ex_tiles/sandscour_sand_b', 'sdsand'], ['ex_tiles/sandscour_tomb_floor', 'sdtomb'],
  ['ex_tiles/sandscour_quicksand', 'quicksand'], ['ex_tiles/sandscour_wall_top', 'sdwall'],
  // the Crimson Keep (dungeons_two): stone a/b, the carpet runner, marble checker, blood, and its walls (a window wall has the window as its face)
  ['d2_tiles/crimson_keep_stone_floor_a', 'ckstone'], ['d2_tiles/crimson_keep_stone_floor_b', 'ckstone'], ['d2_tiles/crimson_keep_carpet', 'ckcarpet'],
  ['d2_tiles/crimson_keep_marble_checker', 'ckmarble'], ['d2_tiles/crimson_keep_blood_pool', 'ckblood'], ['d2_tiles/crimson_keep_wall_top', 'ckwall'],
  ['d2_tiles/crimson_keep_wall_top', 'ckwin'],
  // Hollowmoon Carnival: sawdust a/b, the midway's planks, funhouse checker, spin tiles, the tents' canvas
  ['d2_tiles/hollowmoon_sawdust_a', 'hmsaw'], ['d2_tiles/hollowmoon_sawdust_b', 'hmsaw'], ['d2_tiles/hollowmoon_boards', 'hmboard'],
  ['d2_tiles/hollowmoon_funhouse_checker', 'hmcheck'], ['d2_tiles/hollowmoon_spin_tile', 'hmspin'], ['d2_tiles/hollowmoon_wall_top', 'hmwall'],
  // Astral Observatory Plus: inlaid and cracked marble, star-map inlays, skylights, brass walkways, the star vault's floor
  ['ap_tiles/astral_marble_inlay', 'asmarble'], ['ap_tiles/astral_marble_cracked', 'asmarble'], ['ap_tiles/astral_constellation_inlay', 'asmarble'],
  ['ap_tiles/astral_constellation_inlay_b', 'asmarble'], ['ap_tiles/astral_skylight', 'asmarble'], ['ap_tiles/astral_brass_walkway', 'asgrate'],
  ['ap_tiles/vault_floor', 'asmarble'], ['ap_tiles/vault_floor_plain', 'asmarble'],
  // the Nexus: flagstones a/b, trim, the rune inlay, the wall's top, pool water, the chasm, bridges, the bazaar's sand a/b, the gardens' grass a/b and flowers, the forge's brick
  ['nx_tiles/nexus_stone_a', 'nxstone'], ['nx_tiles/nexus_stone_b', 'nxstone'], ['nx_tiles/nexus_trim', 'nxtrim'], ['nx_tiles/nexus_inlay', 'nxinlay'],
  ['nx_tiles/nexus_wall_top', 'nxwall'], ['nx_tiles/nexus_water', 'nxwater', { foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_chasm', 'nxchasm'], ['nx_tiles/nexus_bridge', 'nxbridge'],
  ['nx_tiles/nexus_sand_a', 'nxsand'], ['nx_tiles/nexus_sand_b', 'nxsand'], ['nx_tiles/nexus_grass_a', 'nxgrass'], ['nx_tiles/nexus_grass_b', 'nxgrass'],
  ['nx_tiles/nexus_flowers', 'nxgrass'], ['nx_tiles/nexus_brick', 'nxbrick'],
  // the Nexus, second pass: more flagstones, the crystal's dais, the other bridge, ember brick, and the water that flows
  // ({ flow }: every tile on one frame, stepping fast, so the current runs on unbroken; { foam }: foam where it meets anything else)
  ['nx_tiles/nexus_stone_c', 'nxstone'], ['nx_tiles/nexus_stone_d', 'nxstone'], ['nx_tiles/nexus_stone_e', 'nxstone'], ['nx_tiles/nexus_dais', 'nxstone'],
  ['nx_tiles/nexus_bridge_h', 'nxbridge'], ['nx_tiles/nexus_brick_ember', 'nxbrick'],
  ['nx_tiles/nexus_spring', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_rapids_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_rapids_4', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_fall_0_near', 'nxchasm', { flow: 1 }], ['nx_tiles/nexus_fall_0_far', 'nxchasm', { flow: 1 }], ['nx_tiles/nexus_fall_4_near', 'nxchasm', { flow: 1 }], ['nx_tiles/nexus_fall_4_far', 'nxchasm', { flow: 1 }],
  ['nx_tiles/nexus_flow_0_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_0_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_1_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_1_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_2_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_2_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_3_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_3_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_4_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_4_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_5_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_5_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_6_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_6_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }],
  ['nx_tiles/nexus_flow_7_0', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }], ['nx_tiles/nexus_flow_7_1', 'nxwater', { flow: 1, foam: 'nx_tiles/nexus_foam' }]];
// a wall skin's face: drawn under the wall, toward the camera, so walls stand up (RotMG-style)
export const WALL_FACE = { nxwall: 'nx_tiles/nexus_wall_side', fvwall: 'ex_tiles/frostveil_wall_side', mrwall: 'ex_tiles/mirerot_wall_side', aswall: 'ex_tiles/astral_wall_side', sdwall: 'ex_tiles/sandscour_wall_side', ckwall: 'd2_tiles/crimson_keep_wall_side', ckwin: 'd2_tiles/crimson_keep_wall_window', hmwall: 'd2_tiles/hollowmoon_wall_side' };
export const SKIN_TID = SKINS.map((s) => (s ? TID[s[1]] : -1));
export const SKIN_OPT = SKINS.map((s) => (s && s[2]) || null);   // a skin's drawing options (flow, foam)
export const SK = Object.fromEntries(SKINS.map((s, k) => [s ? s[0].split('/')[1].replace(/^(shore|lowlands|midlands|highlands|godlands)_/, '') + (s[1] === 'deep' || s[1] === 'steppe' || s[1] === 'ckwin' ? '@' + s[1] : '') : '-', k]));
// a fixed per-tile hash (0..1), so jitter and dithering never disturb the generator's random stream
const hash01 = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

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
  if (m.rfSolid) return m.rfSolid(x, y);                 // a Realmforge dungeon or boss arena: its own walls, pits and solid things
  const xi = Math.floor(x), yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= m.w || yi >= m.h) return true;
  return m.solid[yi * m.w + xi] === 1;
}
// (low ruin walls and whale ribs you step over: their rows walled players and realm bosses in)
// only the big things stop you: trees, rocks, spires, pillars and walls, statues, the great furniture, gates. Chests,
// crates, barrels, braziers, candles, fences, seats, signs, lamps, shrines and people you walk through, as in RotMG
const BIG = /tree|palm|pine|oak|saguaro|giant_mushroom|rotting_log|boulder|rock|cairn|spire|crystal_cluster|ice_crystal|pillar|column|obelisk|(?<!ruin_)wall|statue|fallen_head|bookshelf|furnace|well$|fountain|throne|sarcophag|coffin|gate|telescope|star_globe|high_striker|circus_cannon|rowboat|ticket_booth|stage_moon|great_lens|golem_husk|anvil_block|crucible|stump|gargoyle/;
export const blocks = (sprite) => BIG.test(sprite || '');
function finalize(m) {
  for (let i = 0; i < m.tiles.length; i++) if (SOLID_TILES.has(m.tiles[i])) m.solid[i] = 1;
  for (const o of m.objects) if (o.solid && !blocks(o.sprite)) o.solid = false;
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
// ------------------------------------------------------------------ THE NEXUS (rebuilt 2026-10-22 in true 8x8 tiles; the painted
// one before it was the user's art laid as a floor, walked over like a carpet). Its districts: the Realm Gates (seven
// portals to the realm), the Bazaar (the vault, the market), the Hall of Legends (your fallen heroes and class stars; the
// training dummies), the Gardens (the Pet Yard, the quest board, the Dungeon Atlas, the pond), the Emberworks (the Forge),
// the Crystal Plaza (the great crystal and its well), the Arrival (the guide).
export function nexus() {
  // The Nexus, built in true 8x8 tiles (2026-10-22; tools/build_nexus_tiles.py): a crystal plaza of flagstones over a
  // starry chasm, its districts on their own platforms joined by bridges. Walls rim each platform; the water and the
  // chasm stop you. Where the water comes from: the great crystal weeps it. A stream falls from its tip onto the dais,
  // wells out round the dais, swirls round the pool, runs off down two channels (footbridges cross them) and spills
  // over the plaza's edge into the chasm. The corner basins' fountains are shards of it; a spring feeds the pond.
  const W = 84, H = 72, CX = 42, CY = 37;
  const m = makeMap('nexus', 'The Nexus', W, H, TID.nxchasm);
  const r = rng(0x9e55);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : m.tiles[idx(m, x, y)]);
  const set = (x, y, t) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m.tiles[idx(m, x, y)] = t; };
  const rect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  const oct = (cx, cy, rx, ry, cut, t) => { for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) if (Math.abs(x - cx) + Math.abs(y - cy) <= cut) set(x, y, t); };
  const skinOf = new Map(), skin = (x, y, k) => skinOf.set(idx(m, x, y), k);
  // ---- the platforms
  oct(CX, CY, 17, 17, 23, TID.nxstone);                                    // the Crystal Plaza
  rect(CX - 2, 9, CX + 2, CY - 16, TID.nxstone);                           // the causeway north
  rect(CX - 18, 3, CX + 18, 10, TID.nxstone);                              // the Realm Gates
  rect(3, CY - 15, 19, CY + 1, TID.nxsand);                                // the Bazaar (west)
  rect(W - 20, CY - 15, W - 4, CY + 1, TID.nxstone);                       // the Hall of Legends (east)
  rect(3, CY + 6, 21, H - 4, TID.nxgrass);                                 // the Gardens (south-west)
  rect(W - 21, CY + 6, W - 4, H - 10, TID.nxbrick);                        // the Emberworks (south-east)
  rect(CX - 2, CY + 16, CX + 2, H - 13, TID.nxstone);                      // the causeway south
  rect(CX - 7, H - 13, CX + 7, H - 3, TID.nxstone);                        // the Arrival
  // ---- water: the great pool round the crystal's dais, its two channels, four corner basins, the garden pond
  oct(CX, CY, 8, 7, 11, TID.nxwater);
  rect(CX - 2, CY - 2, CX + 2, CY + 2, TID.nxstone);                       // the crystal's island
  rect(CX - 17, CY - 1, CX - 9, CY + 1, TID.nxwater); rect(CX + 9, CY - 1, CX + 17, CY + 1, TID.nxwater);
  const basins = [[-11, -11], [11, -11], [-11, 11], [11, 11]];
  for (const [dx, dy] of basins) oct(CX + dx, CY + dy, 2, 2, 2, TID.nxwater);
  oct(9, H - 12, 3, 2, 4, TID.nxwater);
  // ---- trim round the water (walkable; the island's edge too), the rune ring round the pool
  const ring = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (at(x, y) === TID.nxstone && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === TID.nxwater)) ring.push([x, y]);
  for (const [x, y] of ring) set(x, y, TID.nxtrim);
  for (let a = 0; a < 40; a += 2) { const t = (a / 40) * Math.PI * 2, x = Math.round(CX + Math.cos(t) * 11.5), y = Math.round(CY + Math.sin(t) * 10.5); if (at(x, y) === TID.nxstone) set(x, y, TID.nxinlay); }
  // ---- walls: a rim of stone wherever a platform meets the chasm (a parapet you can't walk through)
  const near8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]], rim = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === TID.nxchasm && near8.some(([dx, dy]) => { const t = at(x + dx, y + dy); return t >= 0 && t !== TID.nxchasm && t !== TID.nxwall; })) rim.push([x, y]);
  for (const [x, y] of rim) m.tiles[idx(m, x, y)] = TID.nxwall;
  // ---- the spillways: each channel breaks through the rim and pours off into the chasm
  for (const s of [-1, 1]) for (let y = CY - 1; y <= CY + 1; y++) {
    set(CX + s * 18, y, TID.nxwater); skin(CX + s * 18, y, s < 0 ? 'nexus_rapids_4' : 'nexus_rapids_0');
    for (const [k, part] of [[19, 'near'], [20, 'far']]) if (at(CX + s * k, y) === TID.nxchasm) skin(CX + s * k, y, `nexus_fall_${s < 0 ? 4 : 0}_${part}`);
  }
  // ---- bridges over the chasm (their two ends cut through the rims), and footbridges over the channels
  const bridge = (x0, y0, x1, y1, across) => { rect(x0, y0, x1, y1, TID.nxbridge); if (across) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) skin(x, y, 'nexus_bridge_h'); };
  bridge(20, CY - 7, CX - 16, CY - 6, true);                               // to the Bazaar
  bridge(CX + 16, CY - 7, W - 21, CY - 6, true);                           // to the Hall of Legends
  bridge(14, CY + 2, 15, CY + 5);                                          // the Bazaar down to the Gardens
  bridge(22, CY + 9, CX - 14, CY + 10, true);                              // the Gardens to the plaza
  bridge(CX + 14, CY + 9, W - 22, CY + 10, true);                          // the plaza to the Emberworks
  bridge(CX - 13, CY - 1, CX - 12, CY + 1); bridge(CX + 12, CY - 1, CX + 13, CY + 1);   // over the channels
  // ---- the water's way: welling out round the dais, swirling round the pool, drawn off down the channels
  for (let y = CY - 8; y <= CY + 8; y++) for (let x = CX - 17; x <= CX + 17; x++) {
    if (at(x, y) !== TID.nxwater || skinOf.has(idx(m, x, y))) continue;
    const dx = x - CX, dy = y - CY, ch = Math.max(Math.abs(dx), Math.abs(dy));
    let a;
    if (ch === 3) a = Math.atan2(dy, dx);                                  // off the dais
    else if (Math.abs(dy) <= 1 && Math.abs(dx) >= 6) a = dx < 0 ? Math.PI : 0;   // into a channel
    else a = Math.atan2(dy, dx) + Math.PI / 2 - 0.4;                       // round the pool, drifting outward
    const d = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
    skin(x, y, `nexus_flow_${d}_${r() < 0.5 ? 0 : 1}`);
  }
  for (const [dx, dy] of basins) skin(CX + dx, CY + dy, 'nexus_spring');
  skin(9, H - 12, 'nexus_spring');
  for (let y = CY - 1; y <= CY + 1; y++) for (let x = CX - 1; x <= CX + 1; x++) skin(x, y, 'nexus_dais');
  // ---- the skins: flagstones, grass and brick vary, tile by tile
  m.skin = new Uint8Array(W * H);
  const ONE = { [TID.nxtrim]: 'nexus_trim', [TID.nxinlay]: 'nexus_inlay', [TID.nxwall]: 'nexus_wall_top', [TID.nxwater]: 'nexus_water', [TID.nxchasm]: 'nexus_chasm', [TID.nxbridge]: 'nexus_bridge' };
  const pick = (t) => { const h = r();
    if (t === TID.nxstone) return h < 0.32 ? 'nexus_stone_a' : h < 0.64 ? 'nexus_stone_b' : h < 0.8 ? 'nexus_stone_c' : h < 0.96 ? 'nexus_stone_d' : 'nexus_stone_e';
    if (t === TID.nxgrass) return h < 0.12 ? 'nexus_flowers' : h < 0.55 ? 'nexus_grass_a' : 'nexus_grass_b';
    if (t === TID.nxbrick) return h < 0.15 ? 'nexus_brick_ember' : 'nexus_brick';
    if (t === TID.nxsand) return h < 0.5 ? 'nexus_sand_a' : 'nexus_sand_b'; return ONE[t]; };
  for (let i = 0; i < W * H; i++) { const k = SK[skinOf.get(i) || pick(m.tiles[i])]; if (k !== undefined) m.skin[i] = k; }
  // ---- the Crystal Plaza: the great crystal over its dais, shards standing in the pool, the well, braziers, fountains
  put(m, 'nx_objects/nexus_crystal_pillar', CX, CY, true);
  put(m, 'nx_objects/nexus_shard', CX, CY + 9, true, { interact: 'fountain', label: 'Drink from the crystal (heals)', tag: 'CRYSTAL WELL', hint: 'Drink to heal fully' });
  for (const [dx, dy] of [[-6, -3], [6, -3], [-6, 3], [6, 3], [-3, -5], [3, -5], [-3, 5], [3, 5]]) put(m, 'nx_objects/nexus_shard', CX + dx, CY + dy, false);
  for (const [dx, dy] of [[-6, -11], [6, -11], [-6, 11], [6, 11]]) put(m, 'nx_objects/nexus_brazier', CX + dx, CY + dy, false);
  for (const [dx, dy] of basins) put(m, 'nx_objects/nexus_fountain', CX + dx, CY + dy, false);
  // ---- the Realm Gates: seven portals in a row, banners between, braziers at the ends
  m.portals = [];
  for (let k = 0; k < 7; k++) {
    const gx = CX - 12 + k * 4;
    m.portals.push({ kind: 'realm', x: gx + 0.5, y: 5.5, label: 'Realm Portal', to: 'realm',
      ...(k === 3 ? { tag: 'REALM PORTAL', hint: 'Step in to fight. The farther from the beach, the stronger the monsters and the better the loot' } : {}) });
    if (k < 6) put(m, 'nx_objects/nexus_banner_red', gx + 2, 4, false);
  }
  for (const x of [CX - 17, CX + 17]) put(m, 'nx_objects/nexus_brazier', x, 8, false);
  // ---- the Bazaar: the vault, the two merchants, stalls
  m.portals.push({ kind: 'vault', x: 6.5, y: CY - 12, label: 'Your Vault', to: 'vault', tag: 'VAULT', hint: 'Keep what you cannot carry. It grows with every Vault Chest you buy' });
  put(m, 'merchant', 8, CY - 6, true, { interact: 'shop', label: 'Trade with the Salt-Peddler', tag: 'SHOP', hint: 'Buy potions and gear; sell what you do not need' });
  put(m, 'merchant', 15, CY - 10, true, { interact: 'shop', label: 'Trade with the Salt-Peddler', hint: 'Buy potions and gear; sell what you do not need' });
  for (const [x, y] of [[5, CY - 8], [12, CY - 13], [17, CY - 3], [5, CY - 1]]) put(m, 'nx_objects/nexus_stall', x, y, false);
  for (const [x, y] of [[11, CY - 4], [18, CY - 14]]) put(m, 'nx_objects/nexus_lamp', x, y, false);
  // ---- the Hall of Legends: its banner (the legends), the training dummies
  put(m, 'banner', W - 12, CY - 13, true, { interact: 'legends', label: 'Read the Hall of Legends', tag: 'LEGENDS', hint: 'Your fallen heroes, and the stars each class has earned' });
  for (const x of [W - 18, W - 15, W - 9, W - 6]) put(m, 'nx_objects/nexus_banner_red', x, CY - 14, false);
  m.dummies = [[W - 15.5, CY - 4.5], [W - 12.5, CY - 5.5], [W - 9.5, CY - 4.5], [W - 14, CY - 2], [W - 11, CY - 2]];
  put(m, 'signpost', W - 17, CY - 2, true, { label: 'Training dummies: hit them to read your damage per second', tag: 'TRAINING DUMMIES', hint: 'Hit them to see your damage per second' });
  // ---- the Gardens: the pet yard, the quest board, the Dungeon Atlas, the pond; blossom trees and flowers
  put(m, 'petkeeper', 7, CY + 9, true, { interact: 'petyard', label: 'Visit the Petkeeper (pets, eggs, feeding)', tag: 'PETS', hint: 'Hatch eggs, raise pets, choose the companion who heals you' });
  m.pen = { x0: 4, y0: CY + 11, x1: 11, y1: CY + 15 };
  put(m, 'board', 17, CY + 9, true, { interact: 'board', label: 'Read the quest board', tag: 'QUESTS', hint: 'Take quests for gold, essence and fame' });
  put(m, 'bookshelf', 18, H - 8, true, { interact: 'atlas', label: 'Read the Dungeon Atlas', tag: 'ATLAS', hint: 'Every dungeon: how hard it is, its boss, where its portal drops' });
  put(m, 'fishspot', 13, H - 12, true, { interact: 'fish', label: 'Fish in the pond', tag: 'FISHING', hint: 'Cast a line: now and then something good bites' });
  for (const [x, y] of [[4, CY + 18], [19, CY + 15], [5, H - 6], [16, H - 5], [20, CY + 20]]) put(m, 'nx_objects/nexus_blossom_tree', x, y, true);
  for (const [x, y, gold] of [[13, CY + 13, 0], [8, CY + 20, 1], [18, CY + 19, 0], [11, H - 7, 1]]) put(m, gold ? 'nx_objects/nexus_flower_bush_gold' : 'nx_objects/nexus_flower_bush', x, y, false);
  // ---- the Emberworks: the Forge, braziers
  put(m, 'smith', W - 12, CY + 11, true, { interact: 'forge', label: 'Use the Forge', tag: 'FORGE', hint: 'Pay gold to raise your gear a tier (up to T11)' });
  for (const [x, y] of [[W - 17, CY + 8], [W - 7, CY + 8], [W - 17, H - 12], [W - 7, H - 12]]) put(m, 'nx_objects/nexus_brazier', x, y, false);
  // ---- the Arrival: the guide, the bard by the plaza, the cat, lamps
  put(m, 'villager_guard', CX - 4, H - 7, true, { interact: 'guide', label: 'Talk to the Nexus guide', tag: 'GUIDE', hint: 'New here? Talk to learn what everything is' });
  put(m, 'bard', CX - 7, CY + 9, true, { interact: 'bard', label: 'Listen to the bard', tag: 'BARD', hint: 'Listen for a little inspiration' });
  put(m, 'cat', CX + 4, H - 6, false, { interact: 'cat', label: 'Pet the cat' });
  for (const x of [CX - 6, CX + 6]) put(m, 'nx_objects/nexus_lamp', x, H - 11, false);
  // the villagers' rounds: a loop round the pool, crossing the channels by their footbridges
  m.strolls = [[CX - 12, CY - 5], [CX - 5, CY - 12], [CX + 5, CY - 12], [CX + 12, CY - 5], [CX + 12, CY + 5], [CX + 5, CY + 12], [CX - 5, CY + 12], [CX - 12, CY + 5]];
  m.villagers = [['villager_farmer', 0], ['villager_child', 3], ['villager_guard', 6]].map(([sp, k]) => ({ sprite: sp, x: m.strolls[k][0] + 0.5, y: m.strolls[k][1] + 0.5, goal: (k + 1) % 8, wait: 0 }));
  m.decor = [];
  m.spawn = { x: CX + 0.5, y: H - 6 };
  m.lights = null;
  finalize(m);
  return m;
}
// the old meadow Nexus (before the painted one), kept for reference
export function nexusMeadow() {
  const W = 96, H = 60, CX = 34, CY = 30, OX = CX - 27, OY = CY - 24;   // the meadow (a third bigger, 2026-10-20), plus the Pet Yard clearing out east
  const m = makeMap('nexus', 'The Nexus', W, H, TID.hedge);
  const r = rng(0x7e55);
  const set = (x, y, t) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m.tiles[idx(m, x, y)] = t; };
  // the meadow: a ragged oval clearing in the hedge
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const d = ((x - CX) / 31) ** 2 + ((y - CY) / 26.5) ** 2 + (Math.sin(x * 0.9) + Math.cos(y * 1.3)) * 0.03;
    if (d < 1) set(x, y, TID.grass);
  }
  // the Pet Yard: a second clearing east of the market, joined by a cobbled path through the hedge
  const YX = CX + 39, YY = CY;
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
  lane(CX - 13, 14 + OY, CX - 13, CY - 2, 0, TID.dirt);       // dirt track up to the training yard
  lane(CX - 13, CY - 2, CX - 2, CY - 2, 0, TID.dirt);
  lane(CX + 6, CY - 9, CX + 11, CY - 9, 0, TID.dirt);         // track to the pond
  lane(CX + 6, CY - 9, CX + 6, CY - 2, 0, TID.dirt);
  // the firepit plaza
  for (let y = CY - 5; y <= CY + 5; y++) for (let x = CX - 5; x <= CX + 5; x++) if (dist(x, y, CX, CY) < 5.2) set(x, y, TID.cobble);
  // the training yard (NW): packed dirt, fenced
  const TX0 = 6 + OX, TY0 = 7 + OY, TX1 = 18 + OX, TY1 = 14 + OY;
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
  put(m, 'well', CX + 6, CY + 5, true, { interact: 'fountain', label: 'Drink from the well (heals)', tag: 'WELL', hint: 'Drink to heal fully' });
  // the guide by where you arrive, and the Dungeon Atlas by the fire
  put(m, 'villager_guard', CX - 3, CY + 7, true, { interact: 'guide', label: 'Talk to the Nexus guide', tag: 'GUIDE', hint: 'New here? Talk to learn what everything is' });
  put(m, 'bookshelf', CX + 5, CY - 6, true, { interact: 'atlas', label: 'Read the Dungeon Atlas', tag: 'DUNGEON ATLAS', hint: 'Every dungeon: how hard it is, its boss, where its portal drops' });
  for (const [x, y] of [[CX - 2, 5], [CX + 2, 5], [CX - 2, 13], [CX + 2, 13], [5, CY - 2], [5, CY + 2], [13, CY - 2], [13, CY + 2],
    [CX + 9, CY - 2], [CX + 9, CY + 2], [CX - 2, CY + 9], [CX + 2, CY + 9], [CX - 5, CY - 5], [CX + 5, CY - 5], [CX - 5, CY + 5]]) put(m, 'lamppost', x, y, true);
  // realm gate (north) and vault door (west)
  m.portals = [
    { kind: 'realm', x: CX + 0.5, y: 3.5, label: 'Realm Portal', to: 'realm', tag: 'REALM PORTAL', hint: 'Step in to fight. The farther from the beach, the stronger the monsters and the better the loot' },
    { kind: 'vault', x: 3.5, y: CY + 0.5, label: 'Your Vault', to: 'vault', tag: 'YOUR VAULT', hint: 'Keep what you cannot carry. It grows with every Vault Chest you buy' },
  ];
  // the market (east): the Salt-Peddler's stall
  bigProp(m, 'market', CX + 16, CY - 1);
  put(m, 'merchant', CX + 15, CY + 2, true, { interact: 'shop', label: 'Trade with the Salt-Peddler', tag: 'MARKET', hint: 'Buy potions and gear; sell what you do not need' });
  for (const [x, y, s] of [[CX + 18, CY + 2, 'barrel'], [CX + 19, CY + 1, 'crate'], [CX + 13, CY - 2, 'crate'], [CX + 19, CY - 3, 'barrel']]) put(m, s, x, y, true);
  // the smithy (south)
  bigProp(m, 'smithy', CX + 1, CY + 17);
  put(m, 'smith', CX - 3, CY + 15, true, { interact: 'forge', label: 'Use the Forge', tag: 'THE FORGE', hint: 'Pay gold to raise your gear a tier (up to T11)' });
  put(m, 'anvil_block', CX + 4, CY + 15, true);
  put(m, 'barrel', CX - 5, CY + 17, true); put(m, 'crate', CX + 5, CY + 17, true);
  // homes, the inn, oaks
  bigProp(m, 'house', CX - 9, CY - 7);
  bigProp(m, 'inn', CX + 10, CY + 9);
  bigProp(m, 'house', CX - 11, CY + 10);
  bigProp(m, 'cottage', CX - 17, CY + 4);
  bigProp(m, 'house', CX - 22, CY - 14); bigProp(m, 'cottage', CX + 20, CY - 18); bigProp(m, 'house', CX + 19, CY + 19); bigProp(m, 'cottage', CX - 24, CY + 15);
  for (const [x, y] of [[CX - 27, CY - 4], [CX + 26, CY + 12], [CX - 14, CY + 24], [CX + 6, CY + 24], [CX + 27, CY - 9], [CX - 8, CY - 22]]) bigProp(m, 'oak', x, y);
  for (const [x, y] of [[CX - 20, CY], [CX + 20, CY - 10], [CX - 10, CY + 20], [CX + 12, CY + 20], [CX - 18, CY - 18]]) put(m, 'lamppost', x, y, true);
  for (const [x, y] of [[CX - 20, CY - 10], [CX + 21, CY + 6], [CX - 6, CY + 19], [CX + 12, CY + 16], [CX - 19, CY + 15], [CX + 8, CY - 15], [CX - 4, CY - 13]]) bigProp(m, 'oak', x, y);
  // the training yard: fence, dummies, hay, a sign
  for (let x = TX0; x <= TX1; x++) {
    put(m, 'fence_h', x, TY0 - 1, true);
    if (Math.abs(x - 12) > 1) put(m, 'fence_h', x, TY1 + 1, true);
  }
  for (let y = TY0; y <= TY1; y++) { put(m, 'fence_v', TX0 - 1, y, true); put(m, 'fence_v', TX1 + 1, y, true); }
  m.dummies = [[TX0 + 2.5, TY0 + 2.5], [TX0 + 6.5, TY0 + 1.5], [TX0 + 10.5, TY0 + 2.5], [TX0 + 4.5, TY0 + 5.5], [TX0 + 8.5, TY0 + 5.5]];
  put(m, 'haybale', TX0, TY1, true); put(m, 'haybale', TX1, TY0, true);
  put(m, 'signpost', 14 + OX, TY1 + 2, true, { label: 'Training yard: hit the dummies to read your damage per second', tag: 'TRAINING YARD', hint: 'Hit the dummies to see your damage per second' });
  put(m, 'board', CX + 8, CY - 3, true, { interact: 'board', label: 'Read the quest board', tag: 'QUEST BOARD', hint: 'Take quests for gold, essence and fame' });       // quests
  put(m, 'bard', CX - 3, CY - 3, true, { interact: 'bard', label: 'Listen to the bard', tag: 'BARD', hint: 'Listen for a little inspiration' });            // a bard by the fire
  bigProp(m, 'tent', CX - 15, CY - 1);                                                                // the fortune teller
  put(m, 'pedestal', CX - 15, CY + 1, true, { interact: 'fortune', label: 'Have your fortune told (100 gold)', hidden: true });
  // (the trophy statues of the great foes you have beaten stand in your vault now: see vaultRoom)
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
  put(m, 'petkeeper', YX - 8, YY - 2, true, { interact: 'petyard', label: 'Visit the Petkeeper (pets, eggs, feeding)', tag: 'PET YARD', hint: 'Hatch eggs, raise pets, choose the companion who heals you' });
  put(m, 'signpost', YX - 8, YY + 2, true, { label: 'The Pet Yard: hatch eggs, raise pets, and pick the companion who heals you' });
  for (const [x, y] of [[YX - 7, YY - 4], [YX - 7, YY + 4], [CX + 22, CY - 2], [CX + 22, CY + 2]]) put(m, 'lamppost', x, y, true);                  // the cat, by the fire
  put(m, 'fishspot', PX - 6, PY + 2, true, { interact: 'fish', label: 'Fish in the pond', tag: 'FISHING', hint: 'Cast a line: now and then something good bites' });         // the pond's little dock
  for (let x = 4; x <= 13 + OX; x++) set(x, 40 + OY, TID.grass);                                 // a secret tunnel through the hedge...
  for (let y = 38 + OY; y <= 42 + OY; y++) for (let x = 2; x <= 5; x++) set(x, y, TID.grass);     // ...to a grotto
  put(m, 'lorestone', 3, 39 + OY, true, { interact: 'lore', lore: 15, label: 'Read the stone' });
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
  const W = 27, H = 16, CX = 13;
  const m = makeMap('vault', 'Your Vault', W, H, TID.void);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) m.tiles[idx(m, x, y)] = TID.marble;
  wallUp(m);
  put(m, 'vault_chest', CX, 3, true, { interact: 'vault', chest: 0 });                 // one chest; buy Vault Chests to make it bigger
  for (const x of [2, W - 3]) put(m, 'brazier', x, 2);
  // your trophies: a pedestal round the walls for every great foe; the ones you have beaten wear their statue.
  // The throne's own and the penguin's flank the chest.
  const T = [['the_unstruck_god', CX - 4, 4], ['emily_the_yapper', CX + 4, 4],
    ['brine_cathedral', 5, 4], ['wick_mother', W - 6, 4], ['orrery_of_winter', 4, 7], ['penitent_colossus', W - 5, 7],
    ['drowned_abbot', 4, 10], ['unstruck', W - 5, 10], ['the_archivist', 7, 12], ['fallen_heart', W - 8, 12]];
  for (const [id, x, y] of T) put(m, 'pedestal', x, y, true, { trophy: id });
  m.portals = [{ kind: 'nexus', x: CX + 0.5, y: H - 2.5, label: 'Back to the Nexus', to: 'nexus' }];
  m.spawn = { x: CX + 0.5, y: H - 4.5 };
  return finalize(m);
}

// ------------------------------------------------------------------ REALM
export const REALM_SIZE = 1280;
const RK = REALM_SIZE / 480;                 // the realm grew: features and set pieces scale with it
const DECOR_BIOME = [['shell', 'starfish', 'kelp', 'driftwood'], ['reeds', 'shrooms', 'lily', 'skullmoss'],
  ['snowtuft', 'runepebble', 'icecrystal', 'brokenshield'], ['embervent', 'goldrubble', 'bonepile', 'pillarstub'],
  ['shell', 'driftwood', 'goldrubble', 'bonepile'], ['shrooms', 'skullmoss', 'reeds', 'bonepile'], ['icecrystal', 'runepebble', 'brokenshield', 'pillarstub'],
  ['reeds', 'shrooms', 'runepebble']];
const LANDMARK_BIOME = ['whale_skull', 'hollow_oak', 'monolith', 'god_hand', 'whale_skull', 'hollow_oak', 'monolith', 'hollow_oak'];
const OB = [['whale_rib', 0.006], ['dead_tree', 0.01], ['rune_pillar', 0.004], ['fallen_head', 0.006],
  ['glass_spire', 0.008], ['thorn_tree', 0.03], ['crystal_spire', 0.01], ['dead_tree', 0.004]];
// standing things per land: [sprite, chance per tile, solid, where]. Registry keys (with a '/') are the Realm
// Update's objects; the rest are the old ones, kept in the mix. 'where' gathers them: grove (slow noise woods, with
// clearings between), meadow (the flowering grass), wet (by the water), rock (bare highland rock), cliff (under the
// ledges), rift (beside a rift). Trees, rocks, spires, obelisks, pillars, wells and cairns block; clutter doesn't.
const OW = 'ow_objects/';
const STAND = [
  [[OW + 'shore_palm_tree', 0.05, true, 'grove'], [OW + 'shore_seashells', 0.004, false], [OW + 'shore_driftwood', 0.003, false], [OW + 'shore_tide_pool', 0.05, false, 'wet'], ['whale_rib', 0.003, true]],
  [['dead_tree', 0.01, true]],
  [[OW + 'highlands_boulder', 0.06, true, 'cliff'], [OW + 'highlands_rock_spire', 0.025, true, 'cliff'], [OW + 'highlands_dead_tree', 0.003, true, 'rock'],
    [OW + 'highlands_heather_bush', 0.012, false, 'rock'], ['rune_pillar', 0.003, true]],
  [[OW + 'godlands_rift_crystal', 0.1, false, 'rift'], [OW + 'godlands_corrupted_obelisk', 0.0025, true], [OW + 'godlands_bone_pile', 0.007, false],
    [OW + 'godlands_broken_pillar', 0.003, true], ['fallen_head', 0.004, true]],
  [['glass_spire', 0.008, true]],
  [[OW + 'midlands_elder_tree', 0.07, true, 'grove'], ['thorn_tree', 0.035, true, 'grove'], [OW + 'midlands_glow_mushrooms', 0.012, false, 'grove'],
    [OW + 'midlands_tree_stump', 0.006, false], [OW + 'midlands_mossy_boulder', 0.004, true]],
  [['crystal_spire', 0.01, true], [OW + 'highlands_boulder', 0.003, true]],
  [[OW + 'lowlands_oak_tree', 0.16, true, 'grove'], [OW + 'lowlands_flower_bed', 0.02, false, 'meadow'], [OW + 'lowlands_hay_bale', 0.0025, false]],
];
// clutter that lies flat: drawn beneath anything standing on the same tile
export const FLAT = new Set(['shore_seashells', 'shore_driftwood', 'shore_tide_pool', 'lowlands_flower_bed', 'midlands_glow_mushrooms', 'highlands_heather_bush',
  'godlands_bone_pile'].map((n) => OW + n));
// the sectors the new lands take out of their ring: a direction and a half-width (radians). The Greenmarch faces the
// landing beach, so the first country you walk into from the sea is the gentlest.
const SECTORS = { 4: [0, 0.95], 5: [Math.PI, 0.95], 6: [-Math.PI / 2, 1.15], 7: [Math.PI / 2, 0.8] };
// waypoint names, three per land
export const WAYPOINT_NAMES = {
  shore: ['Landing Beach', 'Gull Point', 'The Drowned Pier'], fen: ['Lantern Crossing', 'Bellwater', 'The Peat Steps'],
  runeholt: ['Cairnfold', 'The Frozen Gate', 'Skald\'s Rest'], godfall: ['The Gilded Steps', 'Ashen Throne-Road', 'The Last Bell'],
  dunes: ['Glassreach', 'The Sphinx\'s Shadow', 'Mirage Well'], thornwood: ['Briarhollow', 'The Stag\'s Path', 'Witchlight Clearing'],
  steppe: ['Skyglass Rise', 'The Humming Fields', 'Geode Hollow'], lowlands: ['Millbrook', 'Haywain Cross', 'The Old Well'],
};
// set pieces: a name, the lands it appears in, and what it's built from
const SITES = [
  { name: 'The Wrecked Galleon', in: [0], kind: 'wreck' }, { name: 'The Glass Oasis', in: [4], kind: 'oasis' },
  { name: 'The Sunken Bell Tower', in: [1], kind: 'tower' }, { name: 'The Witch\'s Circle', in: [5], kind: 'circle' },
  { name: 'The Standing Stones', in: [2], kind: 'stones' }, { name: 'The Shattered Observatory', in: [6], kind: 'observatory' },
  { name: 'The Fallen Colossus', in: [3], kind: 'colossus' }, { name: 'The Old Waystation', in: [0, 1, 4, 5, 7], kind: 'hamlet' },
  { name: 'The Pilgrim Ruins', in: [1, 2, 5, 6], kind: 'hamlet' }, { name: 'The Glass Graveyard', in: [4], kind: 'graveyard' },
  { name: 'The Thorn Shrine', in: [5], kind: 'circle' }, { name: 'The Rune Gate', in: [2, 6], kind: 'stones' },
  { name: 'The Elder Grove', in: [5], kind: 'eldergrove' }, { name: 'The Cairn Ring', in: [2], kind: 'cairns' },
  { name: 'The Bleeding Fountain', in: [3], kind: 'bloodfountain' }, { name: 'Thistle Farm', in: [7], kind: 'farm' },
];

export function realm(seed) {
  const S = REALM_SIZE, C = S / 2;
  const m = makeMap('realm', 'The Realm', S, S, TID.deep);
  const r = rng(seed), n = noise2(seed), n2 = noise2(seed ^ 0x5bd1e995), n3 = noise2(seed ^ 0x2545f491), n4 = noise2(seed ^ 0x68e31da4);
  const area = new Array(BIOMES.length).fill(0);
  m.skin = new Uint8Array(S * S);
  // slow noise picks a ground's a/b variants in patches (never salt-and-pepper)
  const patch = (x, y, s = 7) => n3(x / s + 311.5, y / s + 97.25);
  const R0 = C * 0.9, SEC = Object.values(SECTORS), SECN = Object.entries(SECTORS).map(([k, [a0, w]]) => [+k, a0, w]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = idx(m, x, y);
    const d0 = dist(x, y, C, C) / R0 + (n(x / (26 * RK), y / (26 * RK)) - 0.5) * 0.32;
    const v = n2(x / (9 * Math.sqrt(RK)), y / (9 * Math.sqrt(RK)));
    if (d0 > 1.06) { m.tiles[i] = TID.deep; m.skin[i] = SK['deep_water@deep']; continue; }
    if (d0 > 1.0) { m.tiles[i] = TID.water; m.skin[i] = SK.deep_water; continue; }
    // where two lands meet, each tile takes its land from a point jittered by up to 3 tiles each way: a dithered
    // band, like a hand-placed edge, rather than a ruled line (the coast itself is never jittered)
    // (only tiles near a border pay for the second sample: the rest keep their own point)
    const wob = (px, py) => (n4(px / (40 * RK), py / (40 * RK)) - 0.5) * 1.1;
    let d = d0, ang = Math.atan2(y - C, x - C) + wob(x, y);
    let near = Math.abs(d0 - 0.78) < 0.03 || Math.abs(d0 - 0.52) < 0.03 || Math.abs(d0 - 0.27) < 0.03;
    for (let k = 0; k < SEC.length && !near; k++) { const q = ang - SEC[k][0]; near = Math.abs(Math.abs(Math.atan2(Math.sin(q), Math.cos(q))) - SEC[k][1]) < 0.09; }
    if (near) {
      const xs = x + (hash01(x, y) - 0.5) * 6, ys = y + (hash01(y + 7919, x + 104729) - 0.5) * 6;
      d = dist(xs, ys, C, C) / R0 + (n(xs / (26 * RK), ys / (26 * RK)) - 0.5) * 0.32;
      ang = Math.atan2(ys - C, xs - C) + wob(xs, ys);
    }
    let b, t, sk = 0;
    if (d > 0.78) { b = 0; t = TID.sand; }
    else if (d > 0.52) { b = 1; t = v > 0.62 ? TID.mud : TID.fen; }
    else if (d > 0.27) { b = 2; t = v > 0.6 ? (r.chance(0.08) ? TID.runeglyph : TID.runefloor) : TID.snow; }
    else { b = 3; t = v > 0.6 ? TID.obsidian : TID.ash; }
    // the new lands take a wedge out of their ring (its edge wanders with the noise)
    for (let k = 0; k < SECN.length; k++) {
      const [nb, a0, w] = SECN[k];
      if (BIOME_RING[nb] !== b) continue;
      if (Math.abs(Math.atan2(Math.sin(ang - a0), Math.cos(ang - a0))) < w) { b = nb; break; }
    }
    const pv = patch(x, y);
    if (b === 4) t = v < 0.2 ? TID.glassflat : TID.dune;
    if (b === 5) {                                                                   // the Thornwood: forest floor and leaf litter
      t = v > 0.8 ? TID.bramble : v < 0.16 ? TID.bog : TID.loam;                   // thickets: small clumps, not hedges
      if (t === TID.loam) sk = v > 0.64 ? SK.mossy_stone : pv > 0.55 ? SK.leaf_litter : SK.forest_floor;   // moss rims the briars
      if (Math.abs(n4(x / (22 * RK) + 40, y / (22 * RK) - 40) - 0.5) < 0.006 && t !== TID.bog) { t = TID.shallows; sk = SK.stream; }   // brooks
    }
    if (b === 6) {
      t = v > 0.64 ? TID.quartz : v < 0.15 ? TID.shallows : TID.steppe;
      if (t === TID.steppe && patch(x, y, 11) > 0.66) sk = SK['gravel@steppe'];            // the highland rock reaches out over the steppe
    }
    if (b === 7) {                                                                   // the Greenmarch: rolling grass, meadows, ponds
      t = TID.grass; sk = pv > 0.62 ? SK.grass_b : SK.grass_a;                       // the flowering meadows are the rarer patches
      if (patch(x, y, 5) > 0.72) sk = SK.tall_grass;
      if (v < 0.08) { t = TID.shallows; sk = SK.shallows; }
    }
    // each land's own ground features
    if ((b === 0 || b === 4) && d0 > 0.955) { t = TID.shallows; sk = SK.shallows; }    // tidal flats: wade, slowly
    if (b === 0) {
      if (v < 0.15) { t = TID.shallows; sk = SK.shallows; }
      else if (t === TID.sand) sk = pv > 0.5 ? SK.sand_b : SK.sand_a;
    }
    if (b === 1 && v < 0.28) t = v < 0.12 ? TID.water : TID.bog;                     // black pools ringed with bog
    if (b === 2) {                                                                   // Runeholt: snowfields over bare rock, a fringe of gravel between
      if (v <= 0.7) {                                                                //   (the old rune floors survive as the land's rarer patches)
        const e = patch(x, y, 13);
        if (e < 0.4) { t = TID.runefloor; sk = patch(x + 500, y, 5) > 0.82 ? SK.alpine_grass : SK.rock_floor; }
        else if (e < 0.45) { t = TID.runefloor; sk = SK.gravel; }
        else { t = TID.snow; sk = SK.snowcap; }
      }
      if (v < 0.26) { t = TID.ice; sk = 0; }                                         // frozen lakes: you slide
      // (no crags: their long one-tile ledges walled players and bosses in)
    }
    if (b === 3) {
      if (t === TID.obsidian && v <= 0.68) t = TID.ash;                             // ash plains, a few slabs of blood rock
      if (t === TID.ash) sk = SK.ash_ground; else if (t === TID.obsidian) sk = SK.blood_rock;
      if (v < 0.14) { t = TID.lava; sk = 0; } else if (v < 0.22) { t = TID.obsidian; sk = 0; }   // lava pools rimmed in glass
      if (Math.abs(n3(x / (16 * RK), y / (16 * RK)) - 0.5) < 0.007) { t = TID.lava; sk = 0; }      // and fissures that cut the land
      else if (Math.abs(n4(x / (12 * RK) - 70, y / (12 * RK) + 30) - 0.5) < 0.005) { t = TID.rift; sk = SK.rift; }   // and rifts that bite
    }
    m.tiles[i] = t;
    m.skin[i] = SKIN_TID[sk] === t ? sk : 0;
    m.biome[i] = t === TID.water ? -1 : b;
    if (b >= 0) area[b]++;
  }
  // wet sand: a dithered band where the beach meets the water
  {
    const wet = (x, y) => { const t = m.tiles[idx(m, x, y)]; return t === TID.shallows || t === TID.water || t === TID.deep; };
    for (let y = 2; y < S - 2; y++) for (let x = 2; x < S - 2; x++) {
      const i = idx(m, x, y), k = m.skin[i];
      if (k !== SK.sand_a && k !== SK.sand_b) continue;
      let near = 9;
      for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (wet(x + xx, y + yy)) near = Math.min(near, Math.max(Math.abs(xx), Math.abs(yy)));
      if (near === 1 || (near === 2 && hash01(x + 31, y + 17) < 0.45)) m.skin[i] = SK.wet_sand;
    }
  }
  m.area = area;
  const per = (b, tilesEach) => Math.max(1, Math.round(area[b] / tilesEach));
  const plain = (x, y) => { const t = m.tiles[idx(m, x, y)]; return t !== TID.shallows && t !== TID.bog && t !== TID.ice && t !== TID.lava && t !== TID.water && t !== TID.bramble && t !== TID.deep && t !== TID.cliff && t !== TID.rift; };
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
        m.skin[i] = m.tiles[i] === TID.dirt && m.biome[i] === 7 ? SK.dirt_path : 0;
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
  // ---- standing things and flat ground dressing (never on a road, nor right beside one)
  m.decor = [];
  const nearTile = (x, y, R, test) => { for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) if (test(m.tiles[idx(m, x + xx, y + yy)], idx(m, x + xx, y + yy))) return true; return false; };
  const WHERE = {
    grove: (x, y) => r.chance(Math.min(1, Math.max(0, (patch(x + 900, y - 300, 9) - 0.5) / 0.25))),
    meadow: (x, y) => m.skin[idx(m, x, y)] === SK.grass_b,
    wet: (x, y) => nearTile(x, y, 1, (t) => t === TID.shallows || t === TID.water),
    rock: (x, y) => m.tiles[idx(m, x, y)] === TID.runefloor && m.skin[idx(m, x, y)] > 0,
    cliff: (x, y) => nearTile(x, y, 2, (t) => t === TID.cliff),
    rift: (x, y) => nearTile(x, y, 1, (t) => t === TID.rift),
  };
  for (let y = 3; y < S - 3; y++) for (let x = 3; x < S - 3; x++) {
    const b = m.biome[idx(m, x, y)];
    if (b < 0 || !plain(x, y) || nearTile(x, y, 1, (t) => t === TID.dirt || t === TID.cobble)) continue;
    let placed = false;
    for (const [spr, p, solid, where] of STAND[b]) {
      if (!r.chance(p) || (where && !WHERE[where](x, y))) continue;
      put(m, spr, x, y, solid); placed = true; break;
    }
    if (!placed && r.chance(0.045)) m.decor.push({ name: r.pick(DECOR_BIOME[b]), x, y });
  }
  // ---- little clusters: a few things gathered on purpose, so the land has places in it and not just scatter
  const cluster = (b, n, fn) => { for (let k = 0; k < n; k++) for (let t = 0; t < 10; t++) { const at = spotIn(b, 6); if (at && clearOf(at[0], at[1], 3)) { fn(at[0], at[1]); break; } } };
  const clearOf = (cx, cy, R) => { for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (!plain(x, y) || isRoad(x, y) || m.solid[idx(m, x, y)]) return false; return !m.objects.some((o) => Math.abs(o.x - cx - 0.5) <= R && Math.abs(o.y - cy - 0.5) <= R); };
  const around = (cx, cy, R, n, spr, solid, a0 = r() * 6.28) => { for (let j = 0; j < n; j++) { const a = a0 + (j / n) * Math.PI * 2; put(m, spr, Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), solid); } };
  m.firecamps = [];                                                // campfires: a fire, stumps to sit on; 2d gives each a band
  for (const b of [5, 7]) cluster(b, per(b, 6000), (x, y) => { put(m, OW + 'midlands_campfire', x, y, false); around(x, y, 2, 4, OW + 'midlands_tree_stump', false); m.firecamps.push({ x: x + 0.5, y: y + 0.5, biome: BIOMES[b] }); });
  cluster(0, per(0, 9000), (x, y) => { put(m, OW + 'shore_driftwood', x, y, false); put(m, OW + 'shore_seashells', x + 1, y + 1, false); put(m, OW + 'shore_seashells', x - 2, y, false); put(m, 'whale_rib', x + 2, y - 1); });
  cluster(7, per(7, 5000), (x, y) => { put(m, OW + 'lowlands_hay_bale', x, y, false); put(m, OW + 'lowlands_hay_bale', x + 1, y, false); put(m, OW + 'lowlands_hay_bale', x, y + 1, false); around(x, y, 3, 5, OW + 'lowlands_flower_bed', false); });
  cluster(5, per(5, 7000), (x, y) => { put(m, OW + 'midlands_mossy_boulder', x, y); around(x, y, 2, 6, OW + 'midlands_glow_mushrooms', false); });      // fairy rings
  cluster(2, per(2, 9000), (x, y) => around(x, y, 2, 5, OW + 'highlands_cairn', true));                                                         // cairn circles
  cluster(3, per(3, 6000), (x, y) => { put(m, OW + 'godlands_corrupted_obelisk', x, y); around(x, y, 3, 5, OW + 'godlands_bone_pile', false); });  // altars of bone
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
        if (r.chance(0.45)) put(m, x % 2 ? 'ruin_wall' : 'ruin_wall2', x, ry);
        if (x - rx !== door && x - rx !== door + 1 && r.chance(0.45)) put(m, x % 2 ? 'ruin_wall2' : 'ruin_wall', x, ry + H);
      }
      for (let y = ry + 1; y < ry + H; y++) { if (r.chance(0.4)) put(m, 'ruin_wall', rx, y); if (r.chance(0.4)) put(m, 'ruin_wall2', rx + W - 1, y); }
      for (let y = ry + 1; y < ry + H; y++) for (let x = rx + 1; x < rx + W - 1; x++) { m.tiles[idx(m, x, y)] = BIOME_RING[b] === 3 ? TID.obsidian : TID.runefloor; m.skin[idx(m, x, y)] = 0; }
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
  const floor = (cx, cy, R, t, round = true) => { for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (!round || (x - cx) ** 2 + (y - cy) ** 2 <= R * R) { m.tiles[idx(m, x, y)] = t; m.skin[idx(m, x, y)] = 0; } };
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
    eldergrove: (x, y) => { floor(x, y, 3, TID.loam); around(x, y, 5, 10, OW + 'midlands_elder_tree', true, 0.3); around(x, y, 3, 8, OW + 'midlands_glow_mushrooms', false);
      put(m, 'chest', x, y, true, { interact: 'chest', loot: 'thornwood' }); },
    cairns: (x, y) => { floor(x, y, 4, TID.runefloor); around(x, y, 4, 7, OW + 'highlands_cairn', true, 0.2); around(x, y, 6, 6, OW + 'highlands_rock_spire', true, 0.7);
      put(m, 'lorestone', x, y, true, { interact: 'riddle', label: 'Read the stone' }); },
    bloodfountain: (x, y) => { around(x, y, 4, 8, OW + 'godlands_broken_pillar', true, 0.4); around(x, y, 2, 6, OW + 'godlands_bone_pile', false);
      put(m, OW + 'godlands_blood_fountain', x, y, true, { interact: 'wish', biome: 'godfall', label: 'Make a wish (50 gold)' }); },
    farm: (x, y) => { for (let k = -3; k <= 3; k++) { put(m, OW + 'lowlands_flower_bed', x + k, y + 2, false); put(m, OW + 'lowlands_flower_bed', x + k, y + 3, false); }
      put(m, OW + 'lowlands_hay_bale', x - 3, y - 2, false); put(m, OW + 'lowlands_hay_bale', x - 2, y - 2, false); put(m, OW + 'lowlands_oak_tree', x + 4, y - 3);
      put(m, OW + 'lowlands_signpost', x + 2, y - 1, false); put(m, 'chest', x, y - 1, true, { interact: 'chest', loot: 'lowlands' }); },
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
    if (w.name === 'Haywain Cross') {                         // the Greenmarch's crossroads: a well and a signpost by the stone
      wipe(w.x, w.y, 3);
      put(m, OW + 'lowlands_well', w.x + 3, w.y - 2, true, { interact: 'wish', biome: 'shore', label: 'Make a wish (50 gold)' });
      put(m, OW + 'lowlands_signpost', w.x - 2, w.y + 2, false);
      put(m, OW + 'lowlands_hay_bale', w.x + 3, w.y + 2, false);
    }
  }
  {                                                           // the Beached Skiff: a rowboat run up on the wet sand, tide pools round it
    const wetSand = [];
    for (let i = 0; i < m.skin.length; i++) if (m.skin[i] === SK.wet_sand && m.biome[i] === 0) wetSand.push(i);
    for (let tries = 0; tries < 300 && wetSand.length; tries++) {
      const i = wetSand[r.int(0, wetSand.length - 1)], x = i % m.w, y = Math.floor(i / m.w);
      if (dist(x, y, m.spawn.x, m.spawn.y) < 60 || isRoad(x, y) || m.objects.some((o) => Math.abs(o.x - x) < 5 && Math.abs(o.y - y) < 5)) continue;
      put(m, OW + 'shore_rowboat', x, y, true);
      for (const [dx, dy] of [[-2, 1], [2, 1], [1, -2], [-1, 2]]) { const t = m.tiles[idx(m, x + dx, y + dy)]; if (t === TID.sand || t === TID.shallows) put(m, OW + 'shore_tide_pool', x + dx, y + dy, false); }
      put(m, OW + 'shore_driftwood', x - 1, y - 1, false);
      put(m, 'chest', x + 1, y, true, { interact: 'chest', loot: 'shore' });
      m.sites.push({ name: 'The Beached Skiff', x: x + 0.5, y: y + 0.5, biome: 'shore' });
      break;
    }
  }
  // the landing beach stays clear: nothing may stand on or right beside the spot you arrive on
  {
    const sx = Math.floor(m.spawn.x), sy = Math.floor(m.spawn.y);
    m.objects = m.objects.filter((o) => o.interact === 'waypoint' || Math.abs(Math.floor(o.x) - sx) > 2 || Math.abs(Math.floor(o.y) - sy) > 2 || (o.big && Math.abs(o.x - sx) > 3));
    for (let y = sy - 2; y <= sy + 2; y++) for (let x = sx - 2; x <= sx + 2; x++) if (!plain(x, y)) { m.tiles[idx(m, x, y)] = TID.sand; m.skin[idx(m, x, y)] = SK.wet_sand; }
    m.decor = m.decor.filter((d) => Math.abs(d.x - sx) > 1 || Math.abs(d.y - sy) > 1);
  }
  // things you talk to stand apart: two within two tiles and you couldn't tell which one F reaches. The lesser goes
  // (a dig spot first, then a lore stone or a shrine); waypoints, wells, altars and the rest stay
  {
    const rank = (o) => (o.interact === 'dig' ? 0 : o.interact === 'lore' || o.interact === 'shrine' ? 1 : 2), talk = m.objects.filter((o) => o.interact && o.interact !== 'chest');
    const grid = new Map(), key = (x, y) => (x >> 3) + ',' + (y >> 3), gone = new Set();
    for (const o of talk) { const k = key(Math.floor(o.x), Math.floor(o.y)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(o); }
    for (const o of talk) {
      if (gone.has(o) || rank(o) === 2) continue;
      const ox = Math.floor(o.x), oy = Math.floor(o.y);
      for (let dy = -8; dy <= 8 && !gone.has(o); dy += 8) for (let dx = -8; dx <= 8 && !gone.has(o); dx += 8)
        for (const q of grid.get(key(ox + dx, oy + dy)) || []) if (q !== o && !gone.has(q) && Math.hypot(q.x - o.x, q.y - o.y) < 2.5 && rank(q) >= rank(o)) { gone.add(o); break; }
    }
    if (gone.size) m.objects = m.objects.filter((o) => !gone.has(o));
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
// the objects inside a box, through a 16x16-tile chunk index (built on first use; rebuilt when objects are added or
// removed). Small maps skip the index: a dungeon's few hundred objects are cheaper to walk than to bucket.
const CH = 16;
export function objectsIn(m, x0, y0, x1, y1) {
  const O = m.objects;
  if (O.length < 2500) return O;
  if (!m.ogrid || m.ogridOf !== O || m.ogridLen !== O.length || m.ogridDirty) {
    m.ogrid = new Map(); m.ogridOf = O; m.ogridLen = O.length; m.ogridDirty = false;
    for (const o of O) { const k = Math.floor(o.y / CH) * 4096 + Math.floor(o.x / CH); let L = m.ogrid.get(k); if (!L) m.ogrid.set(k, (L = [])); L.push(o); }
  }
  const out = [];
  for (let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++) for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++) {
    const L = m.ogrid.get(cy * 4096 + cx);
    if (L) for (const o of L) out.push(o);
  }
  return out;
}
// shots fly over open water (the sea, the fen's pools): only walls, rock and solid things stop them
export function shotBlocked(m, x, y) {
  if (m.rfShot) return m.rfShot(x, y);                   // (shots fly over their pits and deep water)
  if (!isSolid(m, x, y)) return false;
  const xi = Math.floor(x), yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= m.w || yi >= m.h) return true;
  if (m.shotPass && m.shotPass.has(yi * m.w + xi)) return false;   // (an arena's pillars and urns)
  const t = m.tiles[yi * m.w + xi];
  return !(t === TID.water || t === TID.deep);
}
// a clockwork bridge's two arms at step k (of eight): three-wide lines of grate out from the hub, opposite each other
export function clockTiles(C, k, n = 8) {
  const out = new Set(), a = (((k % n) + n) % n) * (Math.PI * 2) / n, ca = Math.cos(a), sa = Math.sin(a);
  for (const s of [1, -1]) for (let d = 2; d <= C.len; d += 0.5) for (let w = -1; w <= 1; w++) {
    const x = Math.round(C.hx + s * ca * d - sa * w), y = Math.round(C.hy + s * sa * d + ca * w);
    out.add(y * C.S + x);
  }
  return [...out];
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
  const S = { chapel: 200, crypt: 180, forge: 180, scriptorium: 214, heart: 196, throne: 196, hive: 200, theatre: 190, spire: 220, islands: 230, frostveil: 300, mirerot: 280, astral: 470, sandscour: 320, keep: 280, hollowmoon: 300 }[def.style] || 230;
  const FLOOR = TID[def.floor], WALL = TID[def.wall], HAZ = def.hazard ? TID[def.hazard] : null;
  const WET = def.style === 'crypt' ? TID.cryptwater : TID.water, HOT = def.style === 'ember' ? TID.emberlava : TID.lava;
  const m = makeMap('dungeon', def.name, S, S, TID.void);
  if (['frostveil', 'mirerot', 'astral', 'sandscour', 'keep', 'hollowmoon'].includes(def.style)) m.skin = new Uint8Array(S * S);
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
    if (n.shape === 'maze') return;                                     // carved by its layout
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
    // ---- HOLLOWMOON CARNIVAL: the midway, the tent maze, the funhouse, the carousel, backstage, the big top; the
    // prize booth off the midway
    hollowmoon() {
      const cy0 = S >> 1, link2 = (a, b, w = 1) => { if (Math.abs(a.cy - b.cy) <= w) carve(Math.min(a.cx, b.cx), a.cy - w, Math.max(a.cx, b.cx), a.cy + w); else { carve(Math.min(a.cx, b.cx), a.cy - w, Math.max(a.cx, b.cx), a.cy + w); carve(b.cx - w, Math.min(a.cy, b.cy), b.cx + w, Math.max(a.cy, b.cy)); } link(a, b); };
      const fits = (x, y, w, h) => x > 6 && y > 6 && x + w < S - 6 && y + h < S - 6 && !rooms.some((o) => x < o.x + o.w + 3 && o.x < x + w + 3 && y < o.y + o.h + 3 && o.y < y + h + 3);
      const mid = room(12, cy0 - 5, 44, 11, { kind: 'midway', dep: 0 });
      for (let t = 0; t < 20; t++) {                                  // the prize booth, off the midway
        const up = r.chance(0.5), x = mid.x + r.int(8, 26), y = up ? mid.y - 6 - 11 : mid.y + mid.h + 6;
        if (!fits(x, y, 13, 11)) continue;
        const b = room(x, y, 13, 11, { kind: 'booth', dep: 1, leaf: true, role: 'treasure' });
        carve(b.cx - 1, Math.min(mid.cy, b.cy), b.cx + 1, Math.max(mid.cy, b.cy)); link(mid, b); break;
      }
      // the tent maze: a grid of 2x2 cells, a wall of canvas between, carved by a recursive backtracker
      const C = 9, R0 = 9, mx0 = mid.x + mid.w + 6, my0 = cy0 - Math.floor(R0 * 3 / 2);
      const maze = room(mx0, my0, C * 3 - 1, R0 * 3 - 1, { kind: 'maze', dep: 2, shape: 'maze', few: true });
      const seen = new Set(), stack = [[0, Math.floor(R0 / 2)]], cellAt = (i, j) => [mx0 + i * 3, my0 + j * 3];
      seen.add(stack[0].join());
      { const [x, y] = cellAt(...stack[0]); carve(x, y, x + 1, y + 1); }
      while (stack.length) {
        const [i, j] = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => [i + di, j + dj]).filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < R0 && !seen.has(a + ',' + b));
        if (!nb.length) { stack.pop(); continue; }
        const [a, b] = nb[Math.floor(r() * nb.length)], [x0, y0] = cellAt(i, j), [x1, y1] = cellAt(a, b);
        carve(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1) + 1, Math.max(y0, y1) + 1);
        seen.add(a + ',' + b); stack.push([a, b]);
      }
      { const [x, y] = cellAt(0, Math.floor(R0 / 2)); carve(mid.x + mid.w - 1, cy0 - 1, x, cy0 + 1); carve(x, Math.min(y, cy0 - 1), x + 1, Math.max(y + 1, cy0 + 1)); }
      link(mid, maze);
      const exitJ = r.int(1, R0 - 2), [ex, ey] = cellAt(C - 1, exitJ);
      m.hmMaze = { x: mx0, y: my0, w: C * 3 - 1, h: R0 * 3 - 1 };
      const fun = room(ex + 8, ey - 8, 27, 17, { kind: 'funhouse', dep: 3 });
      carve(ex, ey, fun.x, ey + 1); link(maze, fun);
      const car = room(fun.x + fun.w + 6, fun.cy - 12, 25, 25, { kind: 'carousel', dep: 4, shape: 'round' });
      link2(fun, car, 1);
      const back = room(car.x + car.w + 6, car.cy - 6, 13, 13, { kind: 'backstage', dep: 5, role: 'rest' });
      link2(car, back, 1);
      const top = room(back.x + back.w + 6, back.cy - 20, 36, 40, { kind: 'bigtop', dep: 6, shape: 'round' });
      link2(back, top, 1);
      m.hmCarousel = { cx: car.cx + 0.5, cy: car.cy + 0.5, r: 7, on: false, box: { x: car.x, y: car.y, w: car.w, h: car.h } };
      return { start: mid, boss: top };
    },
    // ---- THE CRIMSON KEEP: a castle of square rooms joined by long carpeted halls. The courtyard, the Great Hall with
    // chambers off it, the banquet hall, the Long Gallery hall (north or south) with a chamber and the gallery off it,
    // the crypt, the stair, the throne room
    keep() {
      const cy0 = S >> 1, neck = (a, b, w = 1) => { if (Math.abs(a.cx - b.cx) < Math.abs(a.cy - b.cy)) carve(b.cx - w, Math.min(a.cy, b.cy), b.cx + w, Math.max(a.cy, b.cy)); else carve(Math.min(a.cx, b.cx), a.cy - w, Math.max(a.cx, b.cx), a.cy + w); link(a, b); };
      const fits = (x, y, w, h) => x > 6 && y > 6 && x + w < S - 6 && y + h < S - 6 && !rooms.some((o) => x < o.x + o.w + 3 && o.x < x + w + 3 && y < o.y + o.h + 3 && o.y < y + h + 3);
      const court = room(14, cy0 - 10, 23, 21, { kind: 'court', dep: 0 });
      const hallA = room(court.x + court.w + 4, cy0 - 2, r.int(56, 64), 5, { kind: 'greathall', dep: 1, few: true });
      neck(court, hallA, 2);
      m.ckHalls = [hallA];
      const side = (H, kind, k0) => { for (let t = 0; t < 30; t++) {
        const w = 15, h = 15, up = r.chance(0.5), along = H.w > H.h;
        const x = along ? H.x + r.int(4, H.w - w - 4) : (up ? H.x - 4 - w : H.x + H.w + 4), y = along ? (up ? H.y - 4 - h : H.y + H.h + 4) : H.y + r.int(4, H.h - h - 4);
        if (!fits(x, y, w, h)) continue;
        const n = room(x, y, w, h, { kind, dep: k0 });
        if (along) carve(n.cx - 1, Math.min(H.cy, n.cy), n.cx + 1, Math.max(H.cy, n.cy)); else carve(Math.min(H.cx, n.cx), n.cy - 1, Math.max(H.cx, n.cx), n.cy + 1);   // a door straight off the hall
        link(H, n); return n;
      } return null; };
      side(hallA, 'chamber', 2); side(hallA, 'chamber', 2.5);
      const banquet = room(hallA.x + hallA.w + 4, cy0 - 7, 27, 15, { kind: 'banquet', dep: 3 });
      neck(hallA, banquet, 2);
      const dir = banquet.cy < S / 2 ? 1 : -1, L = r.int(44, 52);
      const hallB = room(banquet.cx - 2, dir > 0 ? banquet.y + banquet.h + 4 : banquet.y - 4 - L, 5, L, { kind: 'greathall', dep: 4, few: true });
      neck(banquet, hallB, 2); m.ckHalls.push(hallB);
      side(hallB, 'chamber', 5);
      const gal = side(hallB, 'gallery', 5.5); if (gal) gal.role = 'treasure';
      const crypt = room(hallB.cx - 11, dir > 0 ? hallB.y + hallB.h + 4 : hallB.y - 4 - 17, 23, 17, { kind: 'crypt', dep: 6 });
      neck(hallB, crypt, 2);
      const stair = room(crypt.x + crypt.w + 5, crypt.cy - 6, 13, 13, { kind: 'stair', dep: 7, role: 'rest' });
      neck(crypt, stair, 1);
      const throne = room(stair.x + stair.w + 5, stair.cy - 20, 40, 40, { kind: 'throneroom', dep: 8 });
      neck(stair, throne, 2);
      return { start: court, boss: throne };
    },
    // ---- SANDSCOUR TOMB: the oasis and the dunes outdoors, the gate, the Long Hall with chambers off it, the
    // Burial Chamber and its sealed vault, the antechamber, the Sanctum
    sandscour() {
      const cy0 = S >> 1, sand = (x0, y0, x1, y1) => carve(x0, y0, x1, y1, TID.sdsand);
      const fits = (x, y, w, h) => x > 6 && y > 6 && x + w < S - 6 && y + h < S - 6 && !rooms.some((o) => x < o.x + o.w + 3 && o.x < x + w + 3 && y < o.y + o.h + 3 && o.y < y + h + 3);
      const oasis = room(14, cy0 - 9, 19, 19, { kind: 'oasis', dep: 0, shape: 'blob', rad: 8, seed: r(), calm: true });
      const dunes = room(oasis.x + oasis.w + 8, cy0 - 16, 33, 33, { kind: 'dunes', dep: 1, shape: 'blob', rad: 15, seed: r() });
      tube(oasis.cx, oasis.cy, dunes.cx, dunes.cy, 2, TID.sdsand); link(oasis, dunes);
      const gate = room(dunes.x + dunes.w + 8, cy0 - 7, 15, 13, { kind: 'gate', dep: 2 });
      tube(dunes.cx, dunes.cy, gate.cx, gate.cy, 2, TID.sdsand); link(dunes, gate);
      // the Long Hall: east from the gate, one right-angle jog, chambers off it to either side
      const jog = gate.cy < S / 2 ? 1 : -1, hy1 = gate.cy - 1, L1 = r.int(50, 62), L2 = r.int(56, 66), jx = gate.x + gate.w + L1, hy2 = hy1 + jog * r.int(18, 24);
      const hall1 = room(gate.x + gate.w, hy1, L1, 3, { kind: 'hall', dep: 3, few: true });
      const jogR = room(jx, Math.min(hy1, hy2), 3, Math.abs(hy2 - hy1) + 3, { kind: 'hall', dep: 4, few: true });
      const hall2 = room(jx, hy2, L2, 3, { kind: 'hall', dep: 5, few: true });
      link(gate, hall1); link(hall1, jogR); link(jogR, hall2);
      m.sdDoors = [[gate.x + gate.w - 1.5, gate.cy + 0.5]];
      let side = r.chance(0.5) ? 1 : -1, made = 0;
      for (const [H, k0] of [[hall1, 4], [hall2, 6]]) for (let x = H.x + 8; x < H.x + H.w - 16 && made < 4; x += r.int(17, 22)) {
        const w = 15, h = 13, neck = 4, y = side < 0 ? H.y - neck - h : H.y + H.h + neck;
        if (!fits(x, y, w, h)) { side = -side; continue; }
        const c = room(x, y, w, h, { kind: 'chamber', dep: k0 + made * 0.5 });
        carve(x + (w >> 1) - 1, side < 0 ? y + h : H.y + H.h, x + (w >> 1) + 1, side < 0 ? H.y - 1 : y - 1, TID.sdtomb);
        link(H, c); m.sdDoors.push([x + (w >> 1) + 0.5, side < 0 ? y + h - 1.5 : y + 1.5]);
        side = -side; made++;
      }
      // the Burial Chamber at the hall's end, its sealed vault beside it
      const burial = room(hall2.x + hall2.w, hall2.cy - 8, 27, 17, { kind: 'burial', dep: 8 });
      link(hall2, burial);
      const vw = 11, vh = 9, vx = burial.cx - (vw >> 1), vUp = fits(vx, burial.y - 4 - vh, vw, vh), vy = vUp ? burial.y - 4 - vh : burial.y + burial.h + 4;
      const vault = room(vx, vy, vw, vh, { kind: 'vault', dep: 8, leaf: true, role: 'treasure' });
      link(burial, vault);
      const ny0 = vUp ? vault.y + vault.h : burial.y + burial.h, ny1 = vUp ? burial.y - 1 : vault.y - 1;
      m.sdSeal = []; for (let y = ny0; y <= ny1; y++) for (let x = burial.cx - 1; x <= burial.cx + 1; x++) m.sdSeal.push(y * S + x);
      const ante = room(burial.x + burial.w + 7, burial.cy - 6, 13, 13, { kind: 'antechamber', dep: 9, role: 'rest' });
      tube(burial.cx, burial.cy, ante.cx, ante.cy, 1, TID.sdtomb); link(burial, ante);
      const sanctum = room(ante.x + ante.w + 7, ante.cy - 20, 40, 40, { kind: 'sanctum', dep: 10 });
      tube(ante.cx, ante.cy, sanctum.cx, sanctum.cy, 1, TID.sdtomb); link(ante, sanctum);
      return { start: oasis, boss: sanctum };
    },
    // ---- THE ASTRAL OBSERVATORY: a constellation over the void. Its platforms are its stars, strewn along a wandering line
    // and joined by straight bridges at any angle (its lines); side stars branch off it, and now and then a line closes a
    // loop. Gallery, platforms, the Clockwork (two turning bridges, in a row), the Telescope Dais (its vault across a star
    // bridge), the Antechamber, the Orrery Floor. Nothing is walled: the void is everywhere, with little stars of its own.
    // (It was a grid: one long road east, turning now and then at right angles. 2026-10-24)
    astral() {
      const order = ['gallery', 'platform', 'starhall', 'platform', 'clockwork', 'skylight', 'platform', 'dais', 'starhall', 'platform', 'skylight', 'antechamber', 'orrery'];
      const shape = { gallery: ['octa', 15, 15], platform: null, starhall: ['rect', 23, 15], skylight: ['octa', 19, 19], dais: ['round', 15, 15], antechamber: ['round', 15, 15], orrery: ['round', 36, 36] };
      const grate = (x0, y0, x1, y1) => carve(x0, y0, x1, y1, TID.asgrate);
      // a constellation's line: a bridge two wide along the straight line between two stars' centres
      const line = (a, b) => {
        const L = Math.hypot(b.cx - a.cx, b.cy - a.cy);
        for (let s = 0; s <= L; s += 0.4) { const x = a.cx + ((b.cx - a.cx) * s) / L, y = a.cy + ((b.cy - a.cy) * s) / L, fx = Math.floor(x), fy = Math.floor(y); grate(fx, fy, fx + 1, fy + 1); }
      };
      const keep = [];                                                // (room for what isn't a room: the clockwork's hubs and arms, the vault)
      const clear = (x, y, w, h, M = 7) => x > 8 && y > 8 && x + w < S - 8 && y + h < S - 8 &&
        ![...rooms, ...keep].some((o) => x < o.x + o.w + M && o.x < x + w + M && y < o.y + o.h + M && o.y < y + h + M);
      // a line must cross only the void: never through another star
      const open = (a, cx, cy, skip = []) => [...rooms, ...keep].every((o) => {
        if (o === a || skip.includes(o)) return true;
        const L = Math.hypot(cx - a.cx, cy - a.cy);
        for (let s = 0; s <= L; s += 1) { const x = a.cx + ((cx - a.cx) * s) / L, y = a.cy + ((cy - a.cy) * s) / L; if (x > o.x - 2 && x < o.x + o.w + 2 && y > o.y - 2 && y < o.y + o.h + 2) return false; }
        return true;
      });
      // the next star from one: somewhere ahead (mostly east, wandering), clear of the rest, its line open
      const place = (from, w, h, spread, ok = () => true, skip = []) => {
        for (let t = 0; t < 80; t++) {
          const wide = spread + (t / 80) * 1.4, a = (from.ang || 0) * 0.5 + (r() * 2 - 1) * wide, d = (Math.max(from.w, from.h) + Math.max(w, h)) / 2 + r.int(8, 14);
          const cx = from.cx + Math.cos(a) * d, cy = from.cy + Math.sin(a) * d, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
          if (clear(x, y, w, h) && open(from, cx, cy, skip) && ok(x, y, w, h)) return { x, y, a };
        }
        return null;
      };
      let prev = null, start = null, floorRoom = null;
      const nodes = [], clocks = [];
      for (let k = 0; k < order.length; k++) {
        const kind = order[k];
        if (kind === 'clockwork') {                                   // platform, hub, platform, hub, in a row (the next star is the far bank)
          const w = 13, row = 13 + 8 + 9 + 13 + 8 + 9;               // (A, the first arm's reach, B, the second's, to the far bank)
          const at = place(prev, w, w, 0.5, (x, y) => clear(x, y - 3, row + 25, w + 6, 4));
          if (!at) throw new Error('the constellation would not fit');
          const A = room(at.x, at.y, w, w, { kind: 'cogplatform', dep: k, shape: 'rect', ang: 0 });
          line(prev, A); link(prev, A);
          const h1 = { hx: A.x + A.w + 8, hy: A.cy, k: 1, t: 0, len: 8, S };
          const B = room(h1.hx + 9, A.y, w, w, { kind: 'cogplatform', dep: k, shape: 'rect', ang: 0 });
          const h2 = { hx: B.x + B.w + 8, hy: B.cy, k: 3, t: 2, len: 8, S };
          clocks.push(h1, h2); link(A, B);
          for (const h of [h1, h2]) keep.push({ x: h.hx - 9, y: h.hy - 9, w: 19, h: 19 });
          A.clock = h1; B.clock = h2; A.role = 'fight'; B.role = 'fight'; A.few = true;
          prev = B; nodes.push(A, B);
          // the far bank: where the second arm reaches, straight on
          const [, fw, fh] = shape[order[k + 1]] || ['octa', 17, 17];
          const F = room(h2.hx + 9, B.cy - (fh >> 1), fw, fh, { kind: order[k + 1], dep: k + 1, shape: (shape[order[k + 1]] || ['octa'])[0], ang: 0 });
          link(B, F); nodes.push(F); prev = F; floorRoom = F; k++;
          continue;
        }
        const [shp, w, h] = shape[kind] || [r.chance(0.5) ? 'octa' : 'rect', 17, 17];
        let n;
        if (!prev) n = start = room(16, (S >> 1) - (h >> 1), w, h, { kind, dep: k, shape: shp, ang: 0 });
        else {
          // the dais needs the void clear above or below it, for its vault across the star bridge
          const vaultOk = (x, y, ww, hh) => kind !== 'dais' || clear(x + (ww >> 1) - 5, y - 8 - 11, 11, 11, 3) || clear(x + (ww >> 1) - 5, y + hh + 8, 11, 11, 3);
          const at = place(prev, w, h, kind === 'orrery' || kind === 'antechamber' ? 0.5 : 1.0, vaultOk);
          if (!at) throw new Error('the constellation would not fit');
          n = room(at.x, at.y, w, h, { kind, dep: k, shape: shp, ang: at.a });
          line(prev, n); link(prev, n);
        }
        if (kind === 'antechamber') n.role = 'fight';                // the last guard before the machine: no rest, no way round
        if (kind === 'dais') {                                        // its vault's place (and its star bridge's), kept clear of the stars to come
          const vx = n.cx - 5, top = clear(vx, n.y - 8 - 11, 11, 11, 3);
          keep.push(top ? { x: vx - 1, y: n.y - 8 - 11 - 1, w: 13, h: 11 + 8 + 2 } : { x: vx - 1, y: n.y + n.h - 1, w: 13, h: 11 + 8 + 2 });
        }
        nodes.push(n); prev = n; floorRoom = n;
      }
      // side stars: a few small platforms off the line, each on its own short line (the constellation's branches)
      const main = nodes.filter((n) => !n.clock && !['gallery', 'dais', 'antechamber', 'orrery'].includes(n.kind) && !nodes.some((q) => q.clock && q.links.includes(n)));
      for (let b = 0, want = r.int(3, 4); b < 40 && want > 0; b++) {
        const from = main[r.int(0, main.length - 1)], sz = r.int(11, 13);
        if (!from || from.links.length > 3) continue;
        const at = place({ ...from, ang: (from.ang || 0) + (r.chance(0.5) ? 1.6 : -1.6) }, sz, sz, 0.6, () => true, [from]);
        if (!at) continue;
        const n = room(at.x, at.y, sz, sz, { kind: 'platform', dep: from.dep, shape: r.chance(0.5) ? 'round' : 'octa', leaf: true, few: true });
        line(from, n); link(from, n); want--;
      }
      // a closing line, now and then: two stars two apart on the line, near enough, joined (a loop to run)
      for (let i = 0; i + 2 < main.length; i++) {
        const a = main[i], c = main[i + 2];
        if (c.dep - a.dep !== 2 || a.links.includes(c) || Math.hypot(a.cx - c.cx, a.cy - c.cy) > 40 || !open(a, c.cx, c.cy, [c]) || !r.chance(0.6)) continue;
        line(a, c); link(a, c);
      }
      // the void's own little stars: tiny islands of marble, out of reach, glinting
      for (let t = 0, n = 0; t < 400 && n < 46; t++) {
        const n0 = nodes[r.int(0, nodes.length - 1)], a = r() * Math.PI * 2, d = Math.max(n0.w, n0.h) / 2 + r.int(6, 20), x = Math.round(n0.cx + Math.cos(a) * d), y = Math.round(n0.cy + Math.sin(a) * d);
        if (x < 10 || y < 10 || x > S - 10 || y > S - 10 || !voidAt(x - 2, y - 2, x + 2, y + 2) || !clear(x - 1, y - 1, 3, 3, 3)) continue;
        if (r.chance(0.5)) set(x, y, FLOOR); else { carve(x, y, x + 1, y, FLOOR); if (r.chance(0.5)) set(x, y + 1, FLOOR); }
        n++;
      }
      // the vault: across the void from the dais, reached only by the star bridge the telescopes reveal
      const dais = nodes.find((n) => n.kind === 'dais'), vw = 11, vx = dais.cx - (vw >> 1);
      const clash = (y) => rooms.some((o) => vx < o.x + o.w + 3 && o.x < vx + vw + 3 && y < o.y + o.h + 3 && o.y < y + vw + 3);
      const up = !clash(dais.y - 8 - vw) || clash(dais.y + dais.h + 8);
      const vault = room(vx, up ? dais.y - 8 - vw : dais.y + dais.h + 8, vw, vw, { kind: 'vault', dep: dais.dep, leaf: true, shape: 'rect', role: 'treasure', noChest: true });
      link(dais, vault);
      const y0 = up ? vault.y + vault.h : dais.y + dais.h, y1 = up ? dais.y - 1 : vault.y - 1;
      const span = []; for (let y = y0; y <= y1; y++) span.push(y);
      m.asStar = [0, 1, 2].map((s) => { const ys = span.slice(Math.floor(s * span.length / 3), Math.floor((s + 1) * span.length / 3)); const out = []; for (const y of ys) for (let x = dais.cx - 1; x <= dais.cx + 1; x++) out.push(y * S + x); return out; });
      m.asDais = { cx: dais.cx, cy: dais.cy, r: 7, up, globe: { x: vault.cx + 0.5, y: up ? vault.y + 1.5 : vault.y + vault.h - 1.5 } };
      // the star vault's mouth: where the bridge meets it (the Vault Keeper's Lockdown seals it)
      const mouthY = up ? vault.y + vault.h : vault.y - 1;
      m.asVault = { mouth: [-1, 0, 1].map((d) => mouthY * S + dais.cx + d), door: { x: dais.cx, y: up ? vault.y + vault.h - 1 : vault.y } };
      m.asClocks = clocks;
      m.asRunePairs = [];                                          // no rune circles: every step of the way is walked
      m.asVoidBox = rooms.reduce((B, n) => ({ x0: Math.min(B.x0, n.x - 14), y0: Math.min(B.y0, n.y - 14), x1: Math.max(B.x1, n.x + n.w + 14), y1: Math.max(B.y1, n.y + n.h + 14) }), { x0: S, y0: S, x1: 0, y1: 0 });
      return { start, boss: floorRoom };
    },
    // ---- MIREROT GROTTO: round hollows strung along a meandering way, joined by boardwalks over the bog.
    // Glade, hollows, the Spore Garden, the Mushroom Cathedral, more hollows, the Threshold, the Mire; a cache off it.
    mirerot() {
      const order = ['glade', 'hollow', 'hollow', 'sporegarden', 'hollow', 'cathedral', 'hollow', 'threshold', 'mire'];
      const SZ = { glade: 15, hollow: 0, sporegarden: 19, cathedral: 29, threshold: 13, mire: 34 };
      let cx = 20, cy = S >> 1, dir = 0, prev = null, start = null, mire = null;
      const nodes = [], ways = [];
      const clash = (x, y, w, h) => rooms.some((o) => x < o.x + o.w + 4 && o.x < x + w + 4 && y < o.y + o.h + 4 && o.y < y + h + 4);   // rooms aren't carved yet: test their boxes
      order.forEach((kind, k) => {
        const d = kind === 'hollow' ? r.int(15, 19) : SZ[kind], w = d, h = kind === 'mire' ? 32 : kind === 'cathedral' ? 25 : d;
        if (prev) {                                                    // the way bends up to 60 degrees from east at each step
          dir = Math.max(-1.05, Math.min(1.05, dir + (r() - 0.5) * 1.3));
          if (cy < 60) dir = Math.abs(dir); if (cy > S - 60) dir = -Math.abs(dir);
          const L = (prev.w + w) / 2 + r.int(9, 13), fits = (a) => { const x = prev.cx + Math.cos(a) * L, y = prev.cy + Math.sin(a) * L; return x - w / 2 > 6 && x + w / 2 < S - 6 && y - h / 2 > 6 && y + h / 2 < S - 6 && !clash(x - w / 2, y - h / 2, w, h); };
          for (let t = 0; t < 14 && !fits(dir); t++) dir += (t % 2 ? -1 : 1) * 0.45 * (t + 1);   // near an edge or an earlier room, the way swings aside
          cx = Math.round(prev.cx + Math.cos(dir) * L); cy = Math.round(prev.cy + Math.sin(dir) * L);
        }
        const n = room(cx - (w >> 1), cy - (h >> 1), w, h, { kind, dep: k, shape: 'round' });
        if (kind === 'threshold' || kind === 'glade') n.role = kind === 'glade' ? 'fight' : 'rest';
        if (kind === 'sporegarden') n.few = true;
        if (prev) { ways.push({ a: prev, b: n }); link(prev, n); } else start = n;
        nodes.push(n); prev = n; mire = n;
      });
      // a cache off one of the hollows
      for (let t = 0; t < 16; t++) {
        const a = r.pick(nodes.filter((n) => n.kind === 'hollow')), ang = r() * Math.PI * 2, L = a.w / 2 + 20, w = 13;
        const nx = Math.round(a.cx + Math.cos(ang) * L) - (w >> 1), ny = Math.round(a.cy + Math.sin(ang) * L) - (w >> 1);
        if (nx < 6 || ny < 6 || nx + w > S - 6 || ny + w > S - 6 || clash(nx, ny, w, w)) continue;
        const n = room(nx, ny, w, w, { kind: 'cache', dep: a.dep, leaf: true, shape: 'round', role: 'treasure' });
        ways.push({ a, b: n }); link(a, n);
        break;
      }
      // the ways: a band of bog five wide, a boardwalk down the middle of it (carved after the rooms, below)
      for (const { a, b } of ways) { tube(a.cx, a.cy, b.cx, b.cy, 2, TID.bog); }
      m.mrRoads = ways.map(({ a, b }) => [a.cx, a.cy, b.cx, b.cy]);
      // the chokepoints: the far end of every boardwalk past the first, just short of the room it reaches
      m.mrChokes = ways.slice(1).filter(({ b }) => b.kind !== 'cache').map(({ a, b }) => { const L = Math.hypot(b.cx - a.cx, b.cy - a.cy), k = (b.w / 2 + 2) / L; return [b.cx + (a.cx - b.cx) * k, b.cy + (a.cy - b.cy) * k]; });
      return { start, boss: mire };
    },
    // ---- FROSTVEIL HOLLOWS: a cavern that winds east under the ice. Mouth, caverns, an ice run, the Hall of the
    // Frozen, more caverns, the Wyrm's Stair, the Frozen Lake; a grotto and a second ice run hang off to the side.
    frostveil() {
      const order = ['mouth', 'cavern', 'cavern', 'icerun', 'cavern', 'hall', 'cavern', 'stair', 'lake'];
      const SIZE = { mouth: [16, 14], cavern: [0, 0], icerun: [30, 9], hall: [34, 11], stair: [13, 11], lake: [36, 40] };
      let x = 10, cy = S >> 1, prev = null, start = null, lake = null;
      const path = [];
      order.forEach((kind, k) => {
        let w, h, o = { kind, dep: k };
        if (kind === 'cavern') { const rad = r.int(9, 11); w = h = rad * 2 + 2; Object.assign(o, { shape: 'blob', rad, seed: r() }); }
        else if (kind === 'lake') { [w, h] = SIZE.lake; o.shape = 'round'; }
        else if (kind === 'mouth') { [w, h] = SIZE.mouth; Object.assign(o, { shape: 'blob', rad: 7, seed: r(), calm: true }); }
        else [w, h] = SIZE[kind];
        if (kind === 'stair') o.role = 'rest';
        if (kind === 'hall' || kind === 'icerun') o.few = true;
        const n = room(x, cy - (h >> 1), w, h, o);
        if (prev) {                                                   // a winding tunnel, three wide, from one to the next
          const ax = prev.cx, ay = prev.cy, bx = n.cx, by = n.cy, mx = (ax + bx) >> 1, my = ((ay + by) >> 1) + r.int(-5, 5);   // centre to centre: blobs have ragged edges
          tube(ax, ay, mx, my, 1); tube(mx, my, bx, by, 1); link(prev, n);
        } else start = n;
        path.push(n); prev = n; lake = n;
        x = n.x + n.w + r.int(6, 9);
        cy = Math.max(46, Math.min(S - 46, cy + r.int(-16, 16)));
      });
      // off the main way: a grotto (treasure) and a second ice run, each hanging above or below a cavern
      const caves = path.filter((n) => n.kind === 'cavern');
      for (const [kind, w, h] of [['grotto', 15, 13], ['icerun', 26, 9]]) {
        for (let t = 0; t < 12; t++) {
          const a = r.pick(caves), up = r.chance(0.5), nx = a.cx - (w >> 1) + r.int(-4, 4), ny = up ? a.y - h - r.int(6, 9) : a.y + a.h + r.int(6, 9);
          if (!voidAt(nx - 2, ny - 2, nx + w + 1, ny + h + 1)) continue;
          const n = room(nx, ny, w, h, { kind, dep: a.dep, leaf: true, few: kind === 'icerun', side: true, role: kind === 'grotto' ? 'treasure' : 'fight' });
          tube(a.cx, a.cy, n.cx, n.cy, 1);
          link(a, n);
          break;
        }
      }
      m.fvPath = path.length;
      return { start, boss: lake };
    },
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
  if (m.asVoidBox) {                                                  // Astral: the void fills the whole observatory; rooms and bridges float in it
    const B = m.asVoidBox;
    for (let y = Math.max(2, B.y0); y <= Math.min(S - 3, B.y1); y++) for (let x = Math.max(2, B.x0); x <= Math.min(S - 3, B.x1); x++) if (tile(x, y) === TID.void) set(x, y, TID.asvoid);
  }
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
  const FV = (k) => 'ex_decor/frostveil_' + k;
  const fvBrazier = (x, y, extra = {}) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, FV('frost_brazier'), x, y, true, { fvBrazier: true, lit: true, ...extra }); };
  const MR = (k) => 'ex_decor/mirerot_' + k;
  const pod = (x, y) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, MR('spore_pod'), x, y, false, { mrPod: true }); };
  const AS = (k) => 'ex_decor/astral_' + k;
  const SD = (k) => 'ex_decor/sandscour_' + k;
  const urn = (x, y) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, SD('urn'), x, y, true, { sdUrn: true, hp: 3 }); };
  const sarc = (x, y, extra = {}) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, SD('sarcophagus'), x, y, true, { sdSarc: true, ...extra }); };
  const CK = (k) => 'd2_decor/crimson_keep_' + k;
  const ckPut = (x, y, k, solid = true, extra = {}) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, CK(k), x, y, solid, extra); };
  const HM = (k) => 'd2_decor/hollowmoon_' + k;
  const hmPut = (x, y, k, solid = true, extra = {}) => { if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) put(m, k.includes('/') || k === 'crate' ? k : HM(k), x, y, solid, extra); };
  const crate = (x, y, jack) => hmPut(x, y, 'crate', true, { hmCrate: true, jack });
  const DRESS = {
    hollowmoon(n) {
      const inRoom = (x, y) => isF(x, y) && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
      if (n.kind === 'midway') {                                      // stalls both sides, a striker at the far end, planks underfoot
        for (let x = n.x + 3; x < n.x + n.w - 4; x += 4) { const k = ['popcorn_cart', 'lamp_post', 'balloon_bundle'][((x - n.x) / 4) % 3 | 0]; hmPut(x, n.y + 1, k); hmPut(x + 2, n.y + n.h - 2, k === 'lamp_post' ? 'popcorn_cart' : 'lamp_post'); }
        hmPut(n.x + n.w - 3, n.y + 2, 'high_striker', true, { hmStriker: true });
        for (let k = 0; k < 4; k++) crate(n.x + 6 + k * 9, r.chance(0.5) ? n.y + 2 : n.y + n.h - 3, r.chance(0.4));
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && Math.abs(y - n.cy) <= 2) set(x, y, TID.hmboard);
      } else if (n.kind === 'booth') {
        hmPut(n.x + 1, n.y + 1, 'high_striker', true, { hmStriker: true }); hmPut(n.x + n.w - 2, n.y + 1, 'balloon_bundle');
        for (const [x, y] of [[n.x + 2, n.y + n.h - 2], [n.x + n.w - 3, n.y + n.h - 2]]) crate(x, y, r.chance(0.5));
      } else if (n.kind === 'maze') {                                 // lamps at some turns, crates in dead ends, a cannon or two
        const M0 = m.hmMaze;
        for (let y = M0.y; y < M0.y + M0.h; y += 3) for (let x = M0.x; x < M0.x + M0.w; x += 3) {
          if (!isF(x, y)) continue;
          const open = [[2, 0], [-1, 0], [0, 2], [0, -1]].filter(([dx, dy]) => isF(x + dx, y + dy)).length;
          if (open === 1 && r.chance(0.6)) crate(x, y, r.chance(0.4));
          else if (open >= 3 && r.chance(0.4)) hmPut(x + 1, y + 1, 'lamp_post');
        }
        for (let k = 0; k < 2; k++) { const x = M0.x + 3 * r.int(1, 7), y = M0.y + 3 * r.int(1, 7); hmPut(x, y, 'circus_cannon', true, { hmCannon: { t: r() * 4 } }); }
      } else if (n.kind === 'funhouse') {                             // jugglers' drums and cannons first (they stand on floor), then checker and spin tiles
        m.hmDrumsFun = [];
        for (const [dx, dy] of [[5, 7], [n.w - 6, 7], [n.w >> 1, 2], [n.w >> 1, n.h - 3]]) { hmPut(n.x + dx, n.y + dy, 'star_drum', false); m.hmDrumsFun.push([n.x + dx + 0.5, n.y + dy + 0.5]); }
        hmPut(n.x + 1, n.y + 1, 'circus_cannon', true, { hmCannon: { t: 1 } }); hmPut(n.x + n.w - 2, n.y + n.h - 2, 'circus_cannon', true, { hmCannon: { t: 3 } });
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y)) set(x, y, TID.hmcheck);
        for (let k = 0; k < 4; k++) { const px = n.x + 4 + k * 6, py = n.y + 3 + (k % 2) * 8; for (let y = py; y < py + 3; y++) for (let x = px; x < px + 3; x++) if (tile(x, y) === TID.hmcheck && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) set(x, y, TID.hmspin); }
      } else if (n.kind === 'carousel') {                             // sawdust ring; a pole of lamps at the hub; balloons round the edge
        hmPut(n.cx, n.cy, 'lamp_post'); hmPut(n.cx + 1, n.cy, 'lamp_post');
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; hmPut(Math.round(n.cx + Math.cos(a) * 11), Math.round(n.cy + Math.sin(a) * 11), 'balloon_bundle', false); }
      } else if (n.kind === 'backstage') { hmPut(n.x + 2, n.y + 2, 'lamp_post'); hmPut(n.x + n.w - 3, n.y + 2, 'lamp_post'); hmPut(n.cx, n.cy + 3, 'star_drum', false); }
      else if (n.kind === 'bigtop') {                                 // the ring: eight star drums round its edge
        m.hmDrums = [];
        for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k / 8) * Math.PI * 2, x = Math.round(n.cx + Math.cos(a) * 14), y = Math.round(n.cy + Math.sin(a) * 16); hmPut(x, y, 'star_drum', false); m.hmDrums.push([x + 0.5, y + 0.5]); }
        for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; hmPut(Math.round(n.cx + Math.cos(a) * 17), Math.round(n.cy + Math.sin(a) * 19), 'lamp_post'); }
      }
    },
    keep(n) {
      const corners = (k, inset = 1, solid = true) => { for (const [x, y] of [[n.x + inset, n.y + inset], [n.x + n.w - 1 - inset, n.y + inset], [n.x + inset, n.y + n.h - 1 - inset], [n.x + n.w - 1 - inset, n.y + n.h - 1 - inset]]) ckPut(x, y, k, solid); };
      const statue = (x, y, kind) => ckPut(x, y, kind === 'gargoyle' ? 'gargoyle_statue' : 'armor_stand', true, { ckStatue: kind, real: r.chance(0.25) });   // most are only statues
      if (n.kind === 'court') {                                       // rose bushes in a ring, gothic pillars at the corners
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; if (Math.abs(Math.cos(a)) > 0.93) continue; ckPut(Math.round(n.cx + Math.cos(a) * 7), Math.round(n.cy + Math.sin(a) * 6), 'rose_bush'); }
        corners('gothic_pillar', 2);
        ckPut(n.cx - 3, n.y + 2, 'candelabra'); ckPut(n.cx + 3, n.y + 2, 'candelabra');
      } else if (n.kind === 'greathall') {                            // the carpet runner, stands and candelabras alternating down both sides
        const along = n.w > n.h;
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if ((along ? Math.abs(y - n.cy) : Math.abs(x - n.cx)) <= 1) set(x, y, TID.ckcarpet);
        const len = along ? n.w : n.h;
        for (let k = 3, j = 0; k < len - 3; k += 4, j++) for (const s of [0, 1]) {
          const x = along ? n.x + k : (s ? n.x + n.w - 1 : n.x), y = along ? (s ? n.y + n.h - 1 : n.y) : n.y + k;
          const out = along ? [x, y + (s ? 1 : -1)] : [x + (s ? 1 : -1), y];
          if (tile(out[0], out[1]) !== TID.void) continue;                 // never in a doorway
          if (j % 2) ckPut(x, y, 'candelabra'); else statue(x, y, r.chance(0.3) ? 'gargoyle' : 'armor');
        }
      } else if (n.kind === 'chamber') {
        corners('candelabra', 1);
        ckPut(n.cx - 2, n.cy, 'coffin', true, { ckCoffin: true }); if (r.chance(0.5)) ckPut(n.cx + 2, n.cy, 'coffin', true, { ckCoffin: true });
        statue(n.cx, n.y + 1, 'armor');
      } else if (n.kind === 'banquet') {                              // the table: two rows of candelabras down the middle; pillars along the walls
        for (let x = n.x + 4; x < n.x + n.w - 4; x += 3) { ckPut(x, n.cy - 1, 'candelabra'); ckPut(x, n.cy + 1, 'candelabra'); }
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 6) { ckPut(x, n.y + 1, 'gothic_pillar'); ckPut(x, n.y + n.h - 2, 'gothic_pillar'); }
        m.ckBanquet = { x: n.x, y: n.y, w: n.w, h: n.h };
      } else if (n.kind === 'gallery') {                              // stands round all four walls; a dais at the far end for the chest
        const spots = [];
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 3) { spots.push([x, n.y + 1]); spots.push([x, n.y + n.h - 2]); }
        for (let y = n.y + 3; y < n.y + n.h - 3; y += 3) { spots.push([n.x + 1, y]); spots.push([n.x + n.w - 2, y]); }
        const wake = new Set(spots.map((_, i) => i).sort(() => r() - 0.5).slice(0, 3));
        spots.forEach(([x, y], i) => ckPut(x, y, 'armor_stand', true, { ckStatue: 'armor', gallery: true, real: wake.has(i) }));
        for (let y = n.cy - 2; y <= n.cy + 1; y++) for (let x = n.cx - 2; x <= n.cx + 2; x++) set(x, y, TID.ckcarpet);
        m.ckGallery = { x: n.x, y: n.y, w: n.w, h: n.h, woke: false };
      } else if (n.kind === 'crypt') {                                // two rows of coffins in the dark; one candle at the door
        for (let x = n.x + 3; x < n.x + n.w - 3; x += 3) { ckPut(x, n.cy - 3, 'coffin', true, { ckCoffin: true, crypt: true }); ckPut(x, n.cy + 3, 'coffin', true, { ckCoffin: true, crypt: true }); }
        ckPut(n.x + 1, n.cy - 1, 'candelabra');
        m.ckCrypt = { x: n.x, y: n.y, w: n.w, h: n.h, started: false };
      } else if (n.kind === 'stair') { corners('candelabra', 1); ckPut(n.cx, n.y + 1, 'gothic_pillar'); }
      else if (n.kind === 'throneroom') {                             // marble, a carpet to the throne, two rows of pillars, candelabras at the walls
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {       // a nave of marble before the throne, stone round it
          const nave = Math.abs(x - n.cx) <= 8 && y >= n.y + 2, carpet = (Math.abs(y - n.cy) <= 1 && x <= n.cx) || (Math.abs(x - n.cx) <= 1 && y >= n.y + 4 && y <= n.cy);
          set(x, y, carpet ? TID.ckcarpet : nave ? TID.ckmarble : TID.ckstone);
        }
        for (let x = n.x + 6; x < n.x + n.w - 6; x += 7) { put(m, CK('gothic_pillar'), x, n.y + 9, true); put(m, CK('gothic_pillar'), x, n.y + n.h - 10, true); }
        for (let y = n.y + 4; y < n.y + n.h - 4; y += 8) { put(m, CK('candelabra'), n.x + 1, y, true); put(m, CK('candelabra'), n.x + n.w - 2, y, true); }
        put(m, 'throne', n.cx, n.y + 3, true);
      }
    },
    sandscour(n) {
      const inRoom = (x, y) => isF(x, y) && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
      const toSand = () => { for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y)) set(x, y, TID.sdsand); };   // after the objects: they stand on floor
      const pit = (px, py, rad) => { for (let y = py - rad; y <= py + rad; y++) for (let x = px - rad; x <= px + rad; x++) if (inRoom(x, y) && Math.hypot(x - px, y - py) <= rad + 0.3) set(x, y, TID.quicksand); (m.sdPits = m.sdPits || []).push([px + 0.5, py + 0.5]); };
      if (n.kind === 'oasis') {
        for (let k = 0; k < 5; k++) { const a = r() * Math.PI * 2, d = n.rad * (0.55 + r() * 0.3); put2(n, Math.round(n.cx + Math.cos(a) * d), Math.round(n.cy + Math.sin(a) * d), SD('saguaro')); }
        put2(null, n.x + n.w - 4, n.cy - 3, SD('obelisk')); put2(null, n.x + n.w - 4, n.cy + 3, SD('obelisk')); put2(null, n.cx - 3, n.cy + 3, SD('skull_pile'), false);
        toSand();
      } else if (n.kind === 'dunes') {
        for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + r() * 1.5, d = n.rad * 0.5; pit(Math.round(n.cx + Math.cos(a) * d), Math.round(n.cy + Math.sin(a) * d), 2); }
        for (let k = 0; k < 9; k++) { const a = r() * Math.PI * 2, d = n.rad * (0.3 + r() * 0.55); put2(n, Math.round(n.cx + Math.cos(a) * d), Math.round(n.cy + Math.sin(a) * d), SD('saguaro')); }
        for (let k = 0; k < 3; k++) { const a = r() * Math.PI * 2, d = n.rad * (0.3 + r() * 0.5); put2(n, Math.round(n.cx + Math.cos(a) * d), Math.round(n.cy + Math.sin(a) * d), SD('skull_pile'), false); }
        toSand();
      } else if (n.kind === 'gate') {
        put2(null, n.cx - 3, n.y + 2, SD('obelisk')); put2(null, n.cx + 3, n.y + 2, SD('obelisk')); put2(null, n.cx - 3, n.y + n.h - 3, SD('obelisk')); put2(null, n.cx + 3, n.y + n.h - 3, SD('obelisk'));
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + (n.w >> 1); x++) if (inRoom(x, y) && r.chance(0.5 - (x - n.x) * 0.08)) set(x, y, TID.sdsand);   // the sand blows in at the door
      } else if (n.kind === 'hall') {
        if (n.w > n.h) for (let x = n.x + 3; x < n.x + n.w - 3; x += r.int(5, 9)) if (r.chance(0.5)) urn(x, r.chance(0.5) ? n.y : n.y + n.h - 1);
      } else if (n.kind === 'chamber') {
        for (const [x, y] of [[n.x + 1, n.y + 1], [n.x + n.w - 2, n.y + 1], [n.x + 1, n.y + n.h - 2], [n.x + n.w - 2, n.y + n.h - 2]]) if (r.chance(0.7)) urn(x, y);
        if (r.chance(0.6)) { sarc(n.x + 3, n.cy); if (r.chance(0.5)) sarc(n.x + n.w - 4, n.cy); }
        put2(n, n.cx, n.cy, SD('skull_pile'), false);
      } else if (n.kind === 'burial') {                              // sarcophagi down both long walls, a quicksand moat between, stone crossings
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 4) { sarc(x, n.y + 1, { burial: true }); sarc(x, n.y + n.h - 3, { burial: true }); }
        for (let x = n.x + 1; x < n.x + n.w - 1; x++) for (let y = n.cy - 1; y <= n.cy + 1; y++) if ((x - n.x) % 7 > 1) set(x, y, TID.quicksand);
        for (let x = n.x + 3; x < n.x + n.w - 2; x += 3) (m.sdPits = m.sdPits || []).push([x + 0.5, n.cy + 0.5]);
        m.sdBurial = { x: n.x, y: n.y, w: n.w, h: n.h };
      } else if (n.kind === 'vault') {
        put2(null, n.cx - 2, n.cy, SD('treasure_chest')); put2(null, n.cx + 2, n.cy, SD('treasure_chest'));
        for (const [x, y] of [[n.x + 1, n.y + 1], [n.x + n.w - 2, n.y + 1]]) urn(x, y);
      } else if (n.kind === 'antechamber') {
        put2(null, n.x + 2, n.y + 2, SD('obelisk')); put2(null, n.x + n.w - 3, n.y + 2, SD('obelisk')); put2(null, n.cx, n.cy + 3, SD('skull_pile'), false);
      } else if (n.kind === 'sanctum') {                             // the dais, its four obelisks, sand drifted along the walls
        for (const [dx, dy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) put2(null, n.cx + dx, n.cy + dy, SD('obelisk'));
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
          if (!inRoom(x, y)) continue;
          const d = Math.max(Math.abs(x - n.cx), Math.abs(y - n.cy));
          if (d > 8) set(x, y, TID.sdsand);                           // sand to the walls; the dais is the only stone (bullets read on sand)
        }
      }
    },
    astral(n) {
      const inRoom = (x, y) => isF(x, y) && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
      const corners = (inset, sprite, solid = true) => { for (const [x, y] of [[n.x + inset, n.y + inset], [n.x + n.w - 1 - inset, n.y + inset], [n.x + inset, n.y + n.h - 1 - inset], [n.x + n.w - 1 - inset, n.y + n.h - 1 - inset]]) if (inRoom(x, y)) put2(null, x, y, sprite, solid); };
      m.asPaint = m.asPaint || new Map();
      const paint = (x, y, k) => { if (inRoom(x, y)) m.asPaint.set(y * S + x, k); };
      // every room: inlaid marble round its rim, cracks here and there
      for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
        if (!inRoom(x, y)) continue;
        const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inRoom(x + dx, y + dy));
        if (rim) paint(x, y, 'astral_marble_inlay'); else if (r.chance(0.07)) paint(x, y, 'astral_marble_cracked');
      }
      const AP = (k) => 'ap_decor/' + k;
      if (n.kind === 'gallery') { corners(3, AS('brass_pillar')); put2(null, n.cx, n.cy - 3, AS('star_globe')); put2(null, n.cx - 3, n.cy + 3, AP('celestial_brazier'), false); put2(null, n.cx + 3, n.cy + 3, AP('celestial_brazier'), false); }
      else if (n.kind === 'platform') {                             // a brass walkway across it (sentinels walk it), a fallen meteor, lens stands
        corners(2, AS('brass_pillar'));
        for (let x = n.x; x < n.x + n.w; x++) for (let y = n.cy; y <= n.cy + 1; y++) if (inRoom(x, y)) { set(x, y, TID.asgrate); m.asPaint.set(y * S + x, 'astral_brass_walkway'); }
        const mx = n.x + 3 + r.int(0, 3), my = n.y + 3;
        put2(null, mx, my, AP('fallen_meteor'), false); put2(null, mx + 1, my + 1, AP('gear_heap'), false);
        put2(null, n.x + n.w - 4, n.y + n.h - 3, AP('lens_stand'), false); put2(null, n.x + n.w - 6, n.y + n.h - 3, AP('lens_stand'), false);
        put2(n, n.x + 3 + r.int(0, n.w - 7), n.y + n.h - 4, AS('floating_crystal'));
      } else if (n.kind === 'starhall') {                           // the star-map hall: constellations inlaid in the floor, lecterns and tables
        for (let y = n.y + 2; y < n.y + n.h - 2; y++) for (let x = n.x + 2; x < n.x + n.w - 2; x++) if ((x * 7 + y * 13) % 5 === 0) paint(x, y, (x + y) % 2 ? 'astral_constellation_inlay' : 'astral_constellation_inlay_b');
        for (let x = n.x + 3; x < n.x + n.w - 3; x += 5) { put2(null, x, n.y + 1, AP('star_chart_lectern'), false); put2(null, x, n.y + n.h - 2, AP('armillary_stand'), false); }
        put2(null, n.cx, n.cy, AP('astrolabe_table'), false);
      } else if (n.kind === 'skylight') {                           // a skylight onto the stars; the weaver hangs over it
        for (let y = n.cy - 3; y <= n.cy + 3; y++) for (let x = n.cx - 3; x <= n.cx + 3; x++) if (Math.hypot(x - n.cx, y - n.cy) < 3.6) paint(x, y, 'astral_skylight');
        corners(2, AP('armillary_stand'), false); corners(4, AS('brass_pillar'));
        put2(null, n.cx - 6, n.cy, AP('lens_stand'), false); put2(null, n.cx + 6, n.cy, AP('lens_stand'), false);
      }
      else if (n.kind === 'cogplatform') { corners(1, AS('brass_pillar')); }
      else if (n.kind === 'dais') {                                 // the telescopes, on the side that faces the vault
        const up = m.asDais ? m.asDais.up : n.cy > S / 2, dy = up ? -3 : 3;
        [-4, 0, 4].forEach((dx, j) => put2(null, n.cx + dx, n.cy + dy, AS('telescope'), true, { interact: 'scope', j, dir: (j * 3 + 1) % 8, label: 'Turn the telescope' }));
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && Math.hypot(x - n.cx, y - n.cy) < 2.2) set(x, y, TID.asgrate);
      } else if (n.kind === 'vault') {                              // the star vault: medallion floor, four trap plates, the chest, its keeper asleep beside it
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) paint(x, y, (Math.abs(x - n.cx) + Math.abs(y - n.cy)) % 3 === 0 ? 'vault_floor' : 'vault_floor_plain');
        const T = (k) => 'ap_treasure/' + k;
        const D = m.asVault && m.asVault.door;
        if (D) put(m, T('vault_door'), D.x, D.y, false, { asDoor: true, clip: 'open' });
        put2(null, n.cx, n.cy, T('star_vault_chest'), false, { interact: 'chest', starVault: true });
        for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) put2(null, n.cx + dx, n.cy + dy, 'ap_tiles/vault_trap', false, { asTrap: true, clip: 'loop', clipT: -99 });
        put2(null, n.cx - 2, n.cy - 1, T('relic_pedestal'), false); put2(null, n.cx + 2, n.cy - 1, T('relic_pedestal'), false);
        for (const [dx, dy] of [[-1, 2], [1, 2], [0, -2], [2, 1]]) put2(null, n.cx + dx, n.cy + dy, T('star_gold_pile'), false);
        corners(0, AP('celestial_brazier'), false);
      } else if (n.kind === 'antechamber') { for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; put2(null, Math.round(n.cx + Math.cos(a) * 4.5), Math.round(n.cy + Math.sin(a) * 4.5), AS('brass_pillar')); } corners(1, AP('celestial_brazier'), false); }
      else if (n.kind === 'orrery') {                              // brass rings inlaid in the marble
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) { if (!inRoom(x, y)) continue; const d = Math.hypot(x - n.cx, y - n.cy); if (Math.abs(d - 6) < 0.5 || Math.abs(d - 12) < 0.5) set(x, y, TID.asgrate); }
      }
    },
    mirerot(n) {
      const inRoom = (x, y) => isF(x, y) && Math.hypot((x - n.cx) / (n.w / 2), (y - n.cy) / (n.h / 2)) < 1;
      const ringAt = (k, f, sprite, solid = true, extra = {}, a0 = 0) => { for (let j = 0; j < k; j++) { const a = a0 + (j / k) * Math.PI * 2, x = Math.round(n.cx + Math.cos(a) * (n.w / 2) * f), y = Math.round(n.cy + Math.sin(a) * (n.h / 2) * f); if (inRoom(x, y)) put2(null, x, y, sprite, solid, extra); } };
      const moss = (p) => { for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && noise2(seed ^ 0x6d6f7373)(x / 4, y / 4) > p) set(x, y, TID.mrmoss); };
      const bogPool = (px, py, rad) => { for (let y = py - rad; y <= py + rad; y++) for (let x = px - rad; x <= px + rad; x++) if (inRoom(x, y) && Math.hypot(x - px, y - py) <= rad + 0.2) set(x, y, TID.bog); };
      if (n.kind === 'glade') { moss(0.4); ringAt(7, 0.62, MR('glowshroom_cluster'), false); put2(null, n.cx + 3, n.cy - 2, MR('rotting_log'), false); ringAt(6, 0.85, MR('reeds'), false, {}, 0.3); }
      else if (n.kind === 'hollow') {
        moss(0.62); const a = r() * Math.PI * 2; bogPool(Math.round(n.cx + Math.cos(a) * n.w * 0.22), Math.round(n.cy + Math.sin(a) * n.h * 0.22), r.int(1, 2));
        ringAt(3, 0.75, MR('glowshroom_cluster'), false, {}, r() * 6);
        for (let k = 0; k < r.int(1, 2); k++) { const b = r() * Math.PI * 2; put2(n, Math.round(n.cx + Math.cos(b) * n.w * 0.3), Math.round(n.cy + Math.sin(b) * n.h * 0.3), MR('giant_mushroom')); }
        for (let k = 0; k < 4; k++) { const b = r() * Math.PI * 2; pod(Math.round(n.cx + Math.cos(b) * n.w * 0.38), Math.round(n.cy + Math.sin(b) * n.h * 0.38)); }
      } else if (n.kind === 'sporegarden') {                        // rows of pods with lanes between, a glowshroom at each corner
        moss(0.5);
        for (let y = n.y + 3; y < n.y + n.h - 2; y += 3) for (let x = n.x + 3; x < n.x + n.w - 2; x += 2) if (inRoom(x, y) && r.chance(0.55)) pod(x + (y % 2), y);
        ringAt(4, 0.8, MR('glowshroom_cluster'), false, {}, Math.PI / 4);
      } else if (n.kind === 'cathedral') {                          // two rings of giant mushrooms round a moss nave, a log altar at the head
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && Math.abs(x - n.cx) <= 2) set(x, y, TID.mrmoss);
        ringAt(14, 0.82, MR('giant_mushroom'), true, {}, 0.11); ringAt(10, 0.55, MR('giant_mushroom'), true, {}, 0.3);
        for (let y = n.y + 4; y < n.y + n.h - 3; y += 4) { put2(null, n.cx - 3, y, MR('glowshroom_cluster'), false); put2(null, n.cx + 3, y, MR('glowshroom_cluster'), false); }
        put2(null, n.cx, n.y + 3, MR('rotting_log')); put2(null, n.cx - 1, n.y + 3, MR('rotting_log'));
      } else if (n.kind === 'cache') { ringAt(6, 0.6, MR('rotting_log'), true, {}, 0.5); put2(null, n.cx + 3, n.cy + 3, MR('glowshroom_cluster'), false); }
      else if (n.kind === 'threshold') { moss(0.3); ringAt(4, 0.7, MR('glowshroom_cluster'), false, {}, Math.PI / 4); ringAt(8, 0.88, MR('reeds'), false, {}, 0.2); }
      else if (n.kind === 'mire') {                                 // an island of mud in a ring of bog, pods round its edge
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
          if (!inRoom(x, y)) continue;
          const d = Math.hypot((x - n.cx) / (n.w / 2), (y - n.cy) / (n.h / 2));
          if (d > 0.8) set(x, y, TID.bog); else if (d < 0.35 && noise2(seed)(x / 3, y / 3) > 0.5) set(x, y, TID.mrmoss);
        }
        ringAt(8, 0.7, MR('spore_pod'), false, { mrPod: true }, 0.2);
        ringAt(4, 0.74, MR('glowshroom_cluster'), false, {}, Math.PI / 4);
      }
    },
    frostveil(n) {
      const inRoom = (x, y) => x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h && isF(x, y);
      const edge = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => tile(x + dx, y + dy) === TID.void);
      const crystals = (p) => { for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && edge(x, y) && r.chance(p)) put2(null, x, y, FV('ice_crystal')); };
      const pool = (px, py, rad, t) => { for (let y = py - rad; y <= py + rad; y++) for (let x = px - rad; x <= px + rad; x++) if (inRoom(x, y) && Math.hypot(x - px, y - py) <= rad + 0.3) set(x, y, t); };
      if (n.kind === 'mouth') {                                       // the way in: pines either side, two braziers, and someone's last camp
        put2(null, n.x + 2, n.cy - 4, FV('snowy_pine')); put2(null, n.x + 2, n.cy + 4, FV('snowy_pine'));
        fvBrazier(n.cx - 2, n.cy - 3); fvBrazier(n.cx - 2, n.cy + 3);
        const cx = n.cx + 3, cy = n.y + 3;
        put2(null, cx, cy, FV('frost_brazier'), true, { fvBrazier: true, lit: false, unlit: true });
        put2(null, cx - 1, cy + 1, FV('frozen_statue')); put2(null, cx + 2, cy, FV('snow_rock'), false); put2(null, cx + 1, cy + 2, FV('snow_rock'), false);
      } else if (n.kind === 'cavern') {                              // snow round the edge, a sheet of ice in the middle, frigid pools, crystals on the walls
        const rx = n.rad * 0.45;
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (inRoom(x, y) && Math.hypot(x - n.cx, (y - n.cy) * 1.2) < rx) set(x, y, TID.fvice);
        for (let k = 0, p = r.int(2, 3); k < p; k++) { const a = r() * Math.PI * 2, d = n.rad * 0.7; pool(Math.round(n.cx + Math.cos(a) * d), Math.round(n.cy + Math.sin(a) * d), r.int(1, 2), TID.fvwater); }
        crystals(0.1);
        const a = r() * Math.PI * 2; fvBrazier(Math.round(n.cx + Math.cos(a) * n.rad * 0.62), Math.round(n.cy + Math.sin(a) * n.rad * 0.62));
        for (let k = 0; k < 3; k++) { const b = r() * Math.PI * 2, d = n.rad * (0.5 + r() * 0.3); put2(n, Math.round(n.cx + Math.cos(b) * d), Math.round(n.cy + Math.sin(b) * d), FV('snow_rock'), false); }
      } else if (n.kind === 'icerun') {                              // a run of ice over frigid water, snow rocks for islands of footing
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) set(x, y, (y - n.y < 2 || n.y + n.h - 1 - y < 2) ? TID.fvwater : TID.fvice);
        for (let x = n.x + 6; x < n.x + n.w - 4; x += r.int(5, 8)) { const y0 = n.y + r.int(2, n.h - 4); carve(x, y0, x + 1, y0 + 1, TID.fvsnow); }
        for (let x = n.x + 3; x < n.x + n.w - 3; x += r.int(4, 7)) { const y = n.y + r.int(2, n.h - 3); if (tile(x, y) === TID.fvice) set(x, y, TID.fvwater); }
        carve(n.x, n.cy - 1, n.x + 1, n.cy + 1, TID.fvsnow); carve(n.x + n.w - 3, n.cy - 1, n.x + n.w - 1, n.cy + 1, TID.fvsnow);   // footing at each end
      } else if (n.kind === 'hall') {                                // the Hall of the Frozen: statues down both sides; some of them are watching
        for (let x = n.x; x < n.x + n.w; x++) for (let y = n.cy - 1; y <= n.cy + 1; y++) set(x, y, TID.fvice);
        const spots = [];
        for (let x = n.x + 2; x < n.x + n.w - 2; x += 2) { spots.push([x, n.y + 1]); spots.push([x, n.y + n.h - 2]); }
        const wake = new Set(spots.map((_, i) => i).sort(() => r() - 0.5).slice(0, r.int(4, 6)));
        spots.forEach(([x, y], i) => put2(null, x, y, FV('frozen_statue'), true, { fvStatue: true, sentinel: wake.has(i) }));
        fvBrazier(n.x + 1, n.cy - 3); fvBrazier(n.x + n.w - 2, n.cy + 3);
        m.fvHall = { x0: n.x + n.w / 3, x1: n.x + (2 * n.w) / 3, y0: n.y, y1: n.y + n.h, woke: false };
      } else if (n.kind === 'grotto') {                              // a ring of crystals round the cache, a gap toward the way in
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; if (Math.abs(Math.sin(a)) > 0.92) continue; put2(null, Math.round(n.cx + Math.cos(a) * 4.5), Math.round(n.cy + Math.sin(a) * 3.5), FV('ice_crystal')); }
        fvBrazier(n.x + 2, n.y + 2);
      } else if (n.kind === 'stair') {                               // the Wyrm's Stair: the last warm place
        for (const [dx, dy] of [[2, 2], [n.w - 3, 2], [2, n.h - 3], [n.w - 3, n.h - 3]]) fvBrazier(n.x + dx, n.y + dy);
        put2(null, n.cx - 3, n.y + 1, FV('snowy_pine')); put2(null, n.cx + 3, n.y + 1, FV('snowy_pine'));
      } else if (n.kind === 'lake') {                                // the Frozen Lake: ice, a rim of snow, four braziers on the rim
        for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) {
          if (!inRoom(x, y)) continue;
          const d = Math.hypot((x - n.cx) / (n.w / 2), (y - n.cy) / (n.h / 2));
          set(x, y, d > 0.8 ? TID.fvsnow : TID.fvice);
        }
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) fvBrazier(Math.round(n.cx + dx * (n.w / 2) * 0.88), Math.round(n.cy + dy * (n.h / 2) * 0.88), { fvRim: true });
      }
    },
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
      if (n.kind === 'tomb') {                                          // a candle-lit tomb hall: candles down both walls, sarcophagi, crypt water to wade down the middle
        if (n.role !== 'treasure') { put2(null, n.x + 2, n.cy, 'sarcophagus'); put2(null, n.x + n.w - 3, n.cy, 'sarcophagus'); }
        for (const [x, y] of [[n.x + 1, n.y + 1], [n.x + n.w - 2, n.y + 1], [n.x + 1, n.y + n.h - 2], [n.x + n.w - 2, n.y + n.h - 2]]) put2(null, x, y, 'crypt_candle');
        if (!quietRole(n)) {
          for (let x = n.x + 4; x < n.x + n.w - 4; x += 4) { put2(null, x, n.y + 1, 'crypt_candle'); put2(null, x, n.y + n.h - 2, 'crypt_candle'); }
          for (let x = n.x + 1; x < n.x + n.w - 1; x++) for (let y = n.cy - 1; y <= n.cy + 1; y++) if (isF(x, y) && !m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) set(x, y, TID.shallows);   // wall to wall: you wade across
        }
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
      if (n === boss) {                                                 // the forge floor: six vents round it, for the Colossus
        m.cvVents = [];
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6, x = Math.round(n.cx + Math.cos(a) * (n.w / 2 - 4)), y = Math.round(n.cy + Math.sin(a) * (n.h / 2 - 4));
          put2(null, x, y, 'ember_vent', false, { cvVent: true }); m.cvVents.push([x + 0.5, y + 0.5]);
        }
        return;
      }
      if (n === start || quietRole(n)) return;
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
  if (m.asClocks) for (const C of m.asClocks) {                     // Astral: each clockwork's hub, and its arms where they start
    carve(C.hx - 1, C.hy - 1, C.hx + 1, C.hy + 1, TID.asgrate);
    C.tiles = clockTiles(C, C.k);                                   // (its plank is no floor: src/astral.js asArmAt; the void stays beneath it)
  }
  if (m.asRunePairs) m.asRunePairs.forEach(([a, b], k) => {         // rune circles: each pair folds space between two rooms
    for (const [n, other] of [[a, b], [b, a]]) { const x = n.cx + 2, y = n.cy + 2; if (isF(x, y) || tile(x, y) === TID.asgrate) put(m, AS('rune_circle'), x, y, false, { asRune: k, to: { x: other.cx + 2.5, y: other.cy + 3.7 } }); }
  });
  if (m.mrRoads) for (const [ax, ay, bx, by] of m.mrRoads) {      // Mirerot: a plank down the middle of each way, reeds along its banks
    const L = Math.max(1, Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= L; i++) {
      const x = Math.round(ax + (bx - ax) * i / L), y = Math.round(ay + (by - ay) * i / L);
      if (tile(x, y) === TID.bog) set(x, y, TID.mrboard);
      if (i % 3 === 0) for (const s of [-2, 2]) { const qx = Math.round(x - ((by - ay) / L) * s), qy = Math.round(y + ((bx - ax) / L) * s); if (tile(qx, qy) === TID.bog && !m.objects.some((o) => Math.floor(o.x) === qx && Math.floor(o.y) === qy)) put(m, 'ex_decor/mirerot_reeds', qx, qy, false); }
    }
  }
  if (boss.shape === 'rect' && !['throne', 'crypt', 'forge', 'theatre', 'sandscour', 'keep', 'hollowmoon'].includes(def.style)) {   // a plain boss hall gets pillars and hazards
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
  if (m.sdSeal) for (const i of m.sdSeal) m.tiles[i] = TID.sdwall;
  if (m.ckHalls) {
    for (const H of m.ckHalls) for (let y = H.y - 1; y <= H.y + H.h; y++) for (let x = H.x - 1; x <= H.x + H.w; x++) if (tile(x, y) === TID.ckwall) m.tiles[idx(m, x, y)] = TID.ckwin;
    const C = rooms.find((n) => n.kind === 'court');
    for (let x = C.x + 3; x < C.x + C.w - 3; x += 5) for (const y of [C.y - 1, C.y + C.h]) if (tile(x, y) === TID.ckwall && isF(x, y === C.y - 1 ? y + 1 : y - 1)) put(m, CK('gargoyle_statue'), x, y, true, { ckLedge: true });
  }     // Sandscour: a wall of sand across the vault's door, until the burial chamber is quiet
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
          const len = r.int(3, 5);                                    // (three tiles at least between mirrors: you can tell which one you are beside)
          for (let st = 0; st < len; st++) { x += d[0]; y += d[1]; if (x <= x0 || y <= y0 || x >= x1 || y >= y1 || used.has(x + ',' + y) || m.objects.some((o) => Math.floor(o.x) === x && Math.floor(o.y) === y)) { ok = false; break; } used.add(x + ',' + y); }
          if (ok && t < turns && m.objects.some((o) => o.interact && Math.max(Math.abs(Math.floor(o.x) - x), Math.abs(Math.floor(o.y) - y)) <= 2)) ok = false;   // (a mirror keeps clear of pages and anything else you talk to)
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
          const crowded = [...used].some((q) => { const [ux, uy] = q.split(',').map(Number); return Math.max(Math.abs(ux - dx), Math.abs(uy - dy)) <= 2; }) || m.objects.some((o) => Math.max(Math.abs(Math.floor(o.x) - dx), Math.abs(Math.floor(o.y) - dy)) <= 2);
          if (!crowded) { const st = r.int(0, 1); put(m, st ? 'mirror_b' : 'mirror_a', dx, dy, true, { interact: 'mirror', state: st, label: 'Turn the mirror' }); }   // (a decoy keeps two clear tiles from the beam's path and everything else)
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
    hive: ['goldrubble', 'shell', 'kelp'], theatre: ['brokenshield', 'goldrubble', 'runepebble'], spire: ['icecrystal', 'runepebble', 'icecrystal'], islands: ['snowtuft', 'runepebble', 'icecrystal'], frostveil: ['snowtuft', 'icecrystal', 'snowtuft', 'runepebble'], mirerot: ['shrooms', 'reeds', 'skullmoss', 'lily'], astral: ['runepebble', 'icecrystal'], sandscour: ['bonepile', 'goldrubble', 'shell'], keep: ['bonepile', 'brokenshield', 'goldrubble'], hollowmoon: ['goldrubble', 'shell', 'runepebble'] }[def.style] || ['bonepile', 'goldrubble'];
  for (const n of [...rooms.filter((n) => n !== boss), ...secrets]) {
    for (let j = 0; j < Math.round(n.w * n.h * 0.04); j++) { const x = n.x + r.int(1, n.w - 2), y = n.y + r.int(1, n.h - 2); if (isF(x, y)) m.decor.push({ name: r.pick(DEC), x, y }); }
  }
  for (const n of [...rooms.filter((n) => n.role === 'treasure' && !n.noChest), ...secrets]) {
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
    dream_lamp: [5.5, '#c8b0ff', 1], moon_shard: [3.5, '#bff0ff', 0], dream_sigil: [3.5, '#ff7ab8', 0],
    'ow_objects/midlands_campfire': [5, '#ff9a3a', 1], 'ow_objects/midlands_glow_mushrooms': [2.5, '#7affc8', 0], 'ow_objects/godlands_blood_fountain': [4, '#ff3a4a', 0],
    'ow_objects/godlands_rift_crystal': [2, '#ff5ad0', 0], 'ow_objects/godlands_corrupted_obelisk': [3, '#c03aff', 0],
    'ex_decor/frostveil_frost_brazier': [5, '#a8f0ff', 1], 'ex_decor/frostveil_ice_crystal': [2.2, '#8ad8ff', 0],
    'ex_decor/mirerot_glowshroom_cluster': [4.2, '#8aff6a', 0], 'ex_decor/mirerot_spore_pod': [1.6, '#c8ff8a', 0],
    'd2_decor/crimson_keep_candelabra': [3.4, '#ffb060', 1], 'd2_decor/hollowmoon_lamp_post': [4.5, '#ffe090', 1], 'd2_decor/hollowmoon_popcorn_cart': [2.4, '#fff0a0', 0],
    'ex_decor/astral_floating_crystal': [3.6, '#c8a0ff', 0], 'ex_decor/astral_star_globe': [4, '#fff6c8', 0], 'ex_decor/astral_rune_circle': [2.6, '#8af6ff', 0], 'ex_decor/astral_brass_pillar': [2.4, '#ffd690', 0] };
  m.lights = m.objects.filter((o) => LIGHT[o.sprite] && !o.unlit).map((o) => { const L = LIGHT[o.sprite]; return (o.light = { x: o.x, y: o.y, h: 0.4, r: L[0] * 16, col: L[1], fire: !!L[2] }); });
  if (def.style === 'frostveil') {                                    // the ice: snow in slow patches, ice, frigid water, the wall tops
    const pv = noise2(seed ^ 0x51f15e);
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      if (t === TID.fvsnow) m.skin[i] = pv((i % S) / 6, Math.floor(i / S) / 6) > 0.52 ? SK.frostveil_snow_b : SK.frostveil_snow_a;
      else if (t === TID.fvice) m.skin[i] = SK.frostveil_ice;
      else if (t === TID.fvwater) m.skin[i] = SK.frostveil_frigid_water;
      else if (t === TID.fvwall) m.skin[i] = SK.frostveil_wall_top;
    }
  }
  if (def.style === 'hollowmoon') {                                   // sawdust in slow patches, planks, checker, spin tiles, canvas
    const pv = noise2(seed ^ 0x686d6f6f);
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      if (t === TID.hmsaw) m.skin[i] = pv((i % S) / 5, Math.floor(i / S) / 5) > 0.5 ? SK.hollowmoon_sawdust_b : SK.hollowmoon_sawdust_a;
      else if (t === TID.hmboard) m.skin[i] = SK.hollowmoon_boards; else if (t === TID.hmcheck) m.skin[i] = SK.hollowmoon_funhouse_checker;
      else if (t === TID.hmspin) m.skin[i] = SK.hollowmoon_spin_tile; else if (t === TID.hmwall) m.skin[i] = SK.hollowmoon_wall_top;
    }
  }
  if (def.style === 'keep') {                                         // stone in slow patches, the runner, marble, blood, the walls
    const pv = noise2(seed ^ 0x6b656570);
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      if (t === TID.ckstone) m.skin[i] = pv((i % S) / 5, Math.floor(i / S) / 5) > 0.5 ? SK.crimson_keep_stone_floor_b : SK.crimson_keep_stone_floor_a;
      else if (t === TID.ckcarpet) m.skin[i] = SK.crimson_keep_carpet; else if (t === TID.ckmarble) m.skin[i] = SK.crimson_keep_marble_checker;
      else if (t === TID.ckblood) m.skin[i] = SK.crimson_keep_blood_pool; else if (t === TID.ckwall) m.skin[i] = SK.crimson_keep_wall_top;
      else if (t === TID.ckwin) m.skin[i] = SK['crimson_keep_wall_top@ckwin'];
    }
  }
  if (def.style === 'sandscour') {                                    // sand in slow patches, the tomb floor, quicksand, the wall tops
    const pv = noise2(seed ^ 0x73616e64);
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      if (t === TID.sdsand) m.skin[i] = pv((i % S) / 6, Math.floor(i / S) / 6) > 0.5 ? SK.sandscour_sand_b : SK.sandscour_sand_a;
      else if (t === TID.sdtomb) m.skin[i] = SK.sandscour_tomb_floor; else if (t === TID.quicksand) m.skin[i] = SK.sandscour_quicksand;
      else if (t === TID.sdwall) m.skin[i] = SK.sandscour_wall_top;
    }
  }
  if (def.style === 'astral') {                                       // marble, grate, the void, the wall tops (the hidden star bridge is void until revealed)
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      const pk = m.asPaint && m.asPaint.get(i);
      if (pk && SK[pk] !== undefined && SKIN_TID[SK[pk]] === t) m.skin[i] = SK[pk];
      else if (t === TID.asmarble) m.skin[i] = SK.astral_marble; else if (t === TID.asgrate) m.skin[i] = SK.astral_brass_grate;
      else if (t === TID.asvoid) m.skin[i] = SK.astral_void; else if (t === TID.aswall) m.skin[i] = SK.astral_wall_top;
    }
    m.hasVoid = true;
  }
  if (def.style === 'mirerot') {                                      // mud in slow patches, moss, the bog, the wall tops
    const pv = noise2(seed ^ 0x6d697265);
    for (let i = 0; i < m.tiles.length; i++) {
      const t = m.tiles[i];
      if (t === TID.mrmud) m.skin[i] = pv((i % S) / 5, Math.floor(i / S) / 5) > 0.5 ? SK.mirerot_mud_b : SK.mirerot_mud_a;
      else if (t === TID.mrmoss) m.skin[i] = SK.mirerot_moss;
      else if (t === TID.bog) m.skin[i] = SK.mirerot_bog;
      else if (t === TID.mrwall) m.skin[i] = SK.mirerot_wall_top;
    }
  }
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
