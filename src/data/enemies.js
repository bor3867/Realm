import { DMG_TUNE } from './tuning.js';
import { SPEECH } from './lore.js';
import { SET_PIECES } from './items.js';
// Enemy definitions. Attack patterns:
//  aimed  - `count` shots fanned over `arc` radians toward the player
//  radial - `count` shots evenly around (rotated by `turn` each volley)
//  burst  - `waves` aimed volleys `gap` seconds apart
// speed: tiles/s, range: tiles. tell: ms the sprite holds its tell frame first.
const L = (w, a, ab, rg, stat, extra = []) => [
  { slot: 'weapon', tiers: w, p: 0.07 }, { slot: 'armor', tiers: a, p: 0.07 },
  { slot: 'ability', tiers: ab, p: 0.035 }, { slot: 'ring', tiers: rg, p: 0.035 },
  { id: 'pot_hp', p: 0.05 }, { id: 'pot_mp', p: 0.04 }, { stat: true, p: stat }, ...extra,
];

export const ENEMIES = {
  // ---------------- Drowned Shore
  brine_pilgrim: {
    name: 'Brine Pilgrim', biome: 'shore', hp: 110, def: 0, speed: 1.4, xp: 9, r: 0.45, ai: 'shamble', aggro: 8,
    attacks: [{ pattern: 'aimed', proj: 'pearl', count: 1, dmg: 16, speed: 6, range: 7, cd: 1.6, tell: 350 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0, [{ id: 'pilgrims_pearl', p: 0.003 }]),
  },
  lantern_jelly: {
    name: 'Lantern Jelly', biome: 'shore', hp: 85, def: 0, speed: 1.8, xp: 8, r: 0.45, ai: 'drift', keep: 4, aggro: 9,
    attacks: [{ pattern: 'aimed', proj: 'brine', count: 3, arc: 0.6, dmg: 12, speed: 5, range: 6, cd: 1.9, tell: 300 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0),
  },
  // ---------------- Ashfen
  bell_taken: {
    name: 'The Bell-Taken', biome: 'fen', hp: 420, def: 4, speed: 1.2, xp: 32, r: 0.55, ai: 'shamble', aggro: 9,
    attacks: [{ pattern: 'radial', proj: 'toll', count: 10, turn: 0.31, dmg: 26, speed: 4.5, range: 6, cd: 2.2, tell: 550 }],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.01, [{ id: 'bell_of_the_taken', p: 0.003 }]),
  },
  peat_saint: {
    name: 'Peat Saint', biome: 'fen', hp: 520, def: 7, speed: 1.0, xp: 34, r: 0.55, ai: 'kite', keep: 5, aggro: 9,
    attacks: [{ pattern: 'aimed', proj: 'bile', count: 3, arc: 0.45, dmg: 32, speed: 6, range: 7, cd: 1.5, tell: 400 }],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.01),
  },
  // ---------------- Runeholt
  frozen_executioner: {
    name: 'Frozen Executioner', biome: 'runeholt', hp: 1150, def: 12, speed: 1.1, xp: 85, r: 0.6, ai: 'shamble', aggro: 10,
    attacks: [
      { pattern: 'radial', proj: 'frostshard', count: 12, turn: 0.26, dmg: 42, speed: 6, range: 6, cd: 2.6, tell: 650 },
      { pattern: 'aimed', proj: 'icicle', count: 2, arc: 0.2, dmg: 50, speed: 8, range: 8, cd: 1.3, tell: 200 },
    ],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03, [{ id: 'rime_headsman_plate', p: 0.003 }]),
  },
  cairn_crawler: {
    name: 'Cairn Crawler', biome: 'runeholt', hp: 800, def: 15, speed: 2.2, xp: 80, r: 0.6, ai: 'charge', aggro: 10, contact: 60,
    attacks: [{ pattern: 'radial', proj: 'runestone', count: 6, turn: 0.52, dmg: 38, speed: 5, range: 5, cd: 2.4, tell: 600, charge: 9 }],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03),
  },
  // ---------------- Godfall
  hollow_thane: {
    name: 'Hollow Thane', biome: 'godfall', hp: 2300, def: 18, speed: 2.0, xp: 190, r: 0.55, ai: 'orbit', keep: 4.5, aggro: 11,
    attacks: [
      { pattern: 'burst', proj: 'blade', count: 3, arc: 0.35, waves: 3, gap: 0.15, dmg: 60, speed: 9, range: 8, cd: 2.0, tell: 450 },
      { pattern: 'radial', proj: 'soulflame', count: 8, turn: 0.4, dmg: 48, speed: 5, range: 5, cd: 3.1, tell: 300 },
    ],
    loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.06),
  },
  censer_magistrate: {
    name: 'Censer-Magistrate', biome: 'godfall', elite: true, hp: 6500, def: 25, speed: 1.0, xp: 900, r: 0.6, ai: 'kite', keep: 6, aggro: 12,
    attacks: [
      { pattern: 'radial', proj: 'smoke', count: 8, turn: 0.2, dmg: 70, speed: 2.6, range: 9, cd: 2.4, tell: 700, size: 0.6 },
      { pattern: 'aimed', proj: 'incense', count: 5, arc: 0.9, dmg: 55, speed: 5, range: 8, cd: 1.4, tell: 300 },
    ],
    loot: L([7, 9], [7, 10], [3, 4], [3, 4], 0.25, [{ id: 'censer_of_absolution', p: 0.02 }, { slot: 'weapon', tiers: [7, 9], p: 0.3 }]),
  },
  // ---------------- The Drowned Forge (dungeon)
  bellows_bound: {
    name: 'Bellows-Bound', biome: 'forge', hp: 1800, def: 15, speed: 1.3, xp: 280, r: 0.6, ai: 'shamble', aggro: 11,
    attacks: [{ pattern: 'aimed', proj: 'cinder', count: 7, arc: 1.1, dmg: 85, speed: 6.5, range: 6, cd: 2.0, tell: 600 }],
    loot: L([7, 9], [8, 10], [4, 4], [4, 4], 0.08),
  },
  mold_wrought: {
    name: 'Mold-Wrought', biome: 'forge', hp: 2400, def: 20, speed: 1.0, xp: 300, r: 0.6, ai: 'kite', keep: 4, aggro: 11,
    attacks: [
      { pattern: 'radial', proj: 'slag', count: 16, turn: 0.2, dmg: 80, speed: 4.5, range: 7, cd: 2.8, tell: 700 },
      { pattern: 'aimed', proj: 'ingot', count: 1, dmg: 100, speed: 9, range: 9, cd: 1.0, tell: 150 },
    ],
    loot: L([7, 9], [8, 10], [4, 4], [4, 4], 0.08),
  },
};

// ---- wave 2 mobs. `waves` on any attack repeats it (radial + turn + waves = a spiral).
const MYTHIC = (p) => ['the_unbroken_oath', 'oathbreaker', 'the_thirteenth_page', 'the_witchs_eye', 'hammer_that_never_fell', 'starfall_knuckles', 'sunless_psalter', 'shard_of_the_first_star', 'the_unburied_choir', 'the_white_whale', 'the_mirrorworld', 'the_first_storm', 'the_last_second',
  'the_unbroken_bellows', 'the_first_anvil', 'the_second_sun', 'the_grave_of_kings', 'the_leviathans_maw', 'the_infinite_reflection', 'the_eye_of_the_storm', 'the_unwound_spring',
  'the_conductors_band', 'ring_of_the_first_flame', 'ring_of_still_waters', 'band_of_the_open_hand']
  .map((id, _, all) => ({ id, p: p * 12 / all.length }));   // more mythics, but the bag stays about as rare
Object.assign(ENEMIES, {
  salt_widow: {
    name: 'Salt Widow', biome: 'shore', hp: 140, def: 2, speed: 0.6, xp: 12, r: 0.45, ai: 'kite', keep: 5, aggro: 8,
    attacks: [{ pattern: 'aimed', proj: 'salt', count: 5, arc: 0.8, dmg: 18, speed: 6, range: 7, cd: 2.0, tell: 500 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0.005, [{ id: 'salt_widows_veil', p: 0.004 }]),
  },
  trap_hound: {
    name: 'Trap-Hound', biome: 'shore', hp: 90, def: 0, speed: 3.2, xp: 10, r: 0.45, ai: 'shamble', aggro: 9, contact: 18,
    attacks: [{ pattern: 'aimed', proj: 'hook', count: 1, dmg: 12, speed: 7, range: 5, cd: 1.2, tell: 200 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0, [{ id: 'trap_hound_collar', p: 0.004 }]),
  },
  mire_choir: {
    name: 'Mire Choir', biome: 'fen', hp: 480, def: 5, speed: 0.9, xp: 36, r: 0.55, ai: 'shamble', aggro: 9,
    attacks: [
      { pattern: 'radial', proj: 'hymn', count: 15, turn: 0.21, dmg: 28, speed: 4, range: 6, cd: 2.4, tell: 500 },
      { pattern: 'aimed', proj: 'wail', count: 3, arc: 0.5, dmg: 30, speed: 6, range: 7, cd: 1.6, tell: 300 },
    ],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.012, [{ id: 'hymn_of_the_mire', p: 0.004 }]),
  },
  lantern_heron: {
    name: 'Lantern Heron', biome: 'fen', hp: 380, def: 4, speed: 1.8, xp: 34, r: 0.5, ai: 'kite', keep: 6, aggro: 10,
    attacks: [{ pattern: 'aimed', proj: 'wisp', count: 1, dmg: 42, speed: 10, range: 9, cd: 1.1, tell: 300 }],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.01),
  },
  candle_mite: {
    name: 'Candle Mite', biome: 'fen', hp: 120, def: 0, speed: 2.6, xp: 6, r: 0.4, ai: 'shamble', aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'drip', count: 6, turn: 0.5, dmg: 22, speed: 4, range: 4, cd: 2.2, tell: 300 }],
    loot: [{ id: 'pot_hp', p: 0.04 }],
  },
  prayer_monk: {
    name: 'Prayer-Wheel Monk', biome: 'runeholt', hp: 900, def: 12, speed: 0.8, xp: 82, r: 0.6, ai: 'kite', keep: 5, aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'verse', count: 4, turn: 0.35, waves: 10, gap: 0.11, dmg: 40, speed: 5, range: 7, cd: 3.0, tell: 600 }],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03, [{ id: 'the_turning_verse', p: 0.004 }]),
  },
  antlered_hush: {
    name: 'Antlered Hush', biome: 'runeholt', hp: 750, def: 14, speed: 1.6, xp: 85, r: 0.55, ai: 'drift', keep: 5, aggro: 10,
    attacks: [{ pattern: 'aimed', proj: 'tine', count: 4, arc: 0.9, dmg: 46, speed: 7, range: 7, cd: 1.8, tell: 400 }],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03, [{ id: 'antler_crown', p: 0.004 }]),
  },
  halo_eater: {
    name: 'Halo-Eater', biome: 'godfall', hp: 1900, def: 16, speed: 2.6, xp: 180, r: 0.55, ai: 'orbit', keep: 3.5, aggro: 11, contact: 50,
    attacks: [{ pattern: 'aimed', proj: 'halofrag', count: 3, arc: 0.3, waves: 2, gap: 0.12, dmg: 62, speed: 10, range: 7, cd: 1.4, tell: 250 }],
    loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.06, [{ id: 'eaten_halo', p: 0.004 }, ...MYTHIC(0.0005)]),
  },
  choir_engine: {
    name: 'Choir Engine', biome: 'godfall', hp: 3200, def: 22, speed: 0.7, xp: 220, r: 0.6, ai: 'shamble', aggro: 11,
    attacks: [
      { pattern: 'radial', proj: 'chord', count: 12, turn: 0.26, waves: 2, gap: 0.3, dmg: 70, speed: 4, range: 8, cd: 2.6, tell: 700, size: 0.45 },
      { pattern: 'aimed', proj: 'note', count: 1, dmg: 80, speed: 7, range: 8, cd: 1.2, tell: 200 },
    ],
    loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.07, MYTHIC(0.0005)),
  },
});


// ---- PARENTS: small mobs gather around these and are re-spawned by them.
// ---- HERALDS: mini-events. Kill EVENTS_TO_BOSS heralds in a biome to summon its realm boss.
const HL = (w, a, ab, rg, relic) => [
  { slot: 'weapon', tiers: w, p: 0.45 }, { slot: 'armor', tiers: a, p: 0.45 }, { slot: 'ability', tiers: ab, p: 0.25 },
  { slot: 'ring', tiers: rg, p: 0.25 }, { stat: true, p: 0.4 }, { id: 'pot_hp', p: 0.5 }, { id: relic, p: 0.02 },
];
Object.assign(ENEMIES, {
  pilgrim_elder: {
    name: 'Pilgrim Elder', biome: 'shore', sheet: 'champions', hp: 650, def: 3, speed: 0.7, xp: 70, r: 0.7, ai: 'shamble', aggro: 9,
    attacks: [{ pattern: 'radial', proj: 'relic', count: 8, turn: 0.4, dmg: 22, speed: 4, range: 7, cd: 2.6, tell: 500 }],
    children: ['brine_pilgrim', 'trap_hound', 'salt_widow', 'lantern_jelly'], cap: 6, every: 9,
    loot: L([1, 3], [1, 3], [0, 2], [0, 2], 0.02),
  },
  bog_abbess: {
    name: 'Bog Abbess', biome: 'fen', sheet: 'champions', hp: 2000, def: 8, speed: 0.6, xp: 200, r: 0.75, ai: 'kite', keep: 6, aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'mournbell', count: 10, turn: 0.3, waves: 2, gap: 0.3, dmg: 45, speed: 4, range: 8, cd: 2.6, tell: 600 }],
    children: ['bell_taken', 'mire_choir', 'candle_mite', 'peat_saint', 'lantern_heron'], cap: 6, every: 10,
    loot: L([3, 5], [3, 5], [1, 3], [1, 3], 0.04),
  },
  rune_warden: {
    name: 'Rune-Warden', biome: 'runeholt', sheet: 'champions', hp: 4800, def: 18, speed: 0.5, xp: 450, r: 0.8, ai: 'shamble', aggro: 10,
    attacks: [{ pattern: 'aimed', proj: 'glyphbolt', count: 3, arc: 0.4, dmg: 85, speed: 8, range: 9, cd: 1.6, tell: 400 }],
    children: ['cairn_crawler', 'prayer_monk', 'antlered_hush', 'frozen_executioner'], cap: 5, every: 11,
    loot: L([5, 7], [5, 7], [2, 4], [2, 4], 0.06),
  },
  fallen_choirmaster: {
    name: 'The Fallen Choirmaster', biome: 'godfall', sheet: 'champions', hp: 9500, def: 24, speed: 0.9, xp: 950, r: 0.75, ai: 'kite', keep: 6, aggro: 11,
    attacks: [{ pattern: 'radial', proj: 'requiem', count: 14, turn: 0.22, waves: 3, gap: 0.25, dmg: 110, speed: 4.5, range: 8, cd: 2.8, tell: 600 }],
    children: ['hollow_thane', 'halo_eater', 'choir_engine'], cap: 5, every: 12,
    loot: L([7, 9], [7, 10], [3, 4], [3, 4], 0.12, MYTHIC(0.0008)),
  },
  tide_herald: {
    name: 'The Tide Herald', biome: 'shore', sheet: 'champions', herald: true, hp: 2600, def: 5, speed: 1.0, xp: 500, r: 0.75, ai: 'kite', keep: 5, aggro: 12,
    attacks: [
      { pattern: 'radial', proj: 'conchwave', count: 14, turn: 0.22, waves: 3, gap: 0.35, dmg: 34, speed: 4, range: 8, cd: 2.8, tell: 700 },
      { pattern: 'aimed', proj: 'tidebolt', count: 3, arc: 0.35, dmg: 38, speed: 8, range: 8, cd: 1.2, tell: 250 },
    ],
    escort: [['brine_pilgrim', 4], ['trap_hound', 2]],
    loot: HL([2, 4], [2, 4], [1, 2], [1, 2], 'salt_widows_veil'),
  },
  bog_bellringer: {
    name: 'The Bog Bellringer', biome: 'fen', sheet: 'champions', herald: true, hp: 6000, def: 10, speed: 0.8, xp: 1200, r: 0.8, ai: 'kite', keep: 6, aggro: 12,
    attacks: [
      { pattern: 'radial', proj: 'bellwave', count: 12, turn: 0.26, waves: 4, gap: 0.3, dmg: 55, speed: 3.5, range: 9, cd: 3.0, tell: 800 },
      { pattern: 'aimed', proj: 'clapper', count: 1, dmg: 70, speed: 9, range: 9, cd: 1.0, tell: 200 },
    ],
    escort: [['bell_taken', 3], ['candle_mite', 3]],
    loot: HL([4, 6], [4, 6], [2, 3], [2, 3], 'hymn_of_the_mire'),
  },
  rime_herald: {
    name: 'The Rime Herald', biome: 'runeholt', sheet: 'champions', herald: true, hp: 12000, def: 18, speed: 0.8, xp: 2500, r: 0.8, ai: 'kite', keep: 6, aggro: 12,
    attacks: [
      { pattern: 'radial', proj: 'rimeflag', count: 4, turn: 0.3, waves: 12, gap: 0.1, dmg: 80, speed: 5, range: 8, cd: 3.2, tell: 700 },
      { pattern: 'aimed', proj: 'hailstone', count: 3, arc: 0.5, dmg: 95, speed: 7, range: 9, cd: 1.4, tell: 300 },
    ],
    escort: [['prayer_monk', 2], ['antlered_hush', 2], ['cairn_crawler', 2]],
    loot: HL([6, 8], [6, 9], [3, 4], [3, 4], 'the_turning_verse'),
  },
  gilded_penitent: {
    name: 'The Gilded Penitent', biome: 'godfall', sheet: 'champions', herald: true, hp: 22000, def: 26, speed: 1.0, xp: 4500, r: 0.8, ai: 'orbit', keep: 5, aggro: 12,
    attacks: [
      { pattern: 'radial', proj: 'gildlash', count: 18, turn: 0.17, waves: 2, gap: 0.25, dmg: 130, speed: 5, range: 8, cd: 2.6, tell: 600 },
      { pattern: 'aimed', proj: 'chainlink', count: 5, arc: 0.7, waves: 2, gap: 0.15, dmg: 120, speed: 8, range: 9, cd: 1.5, tell: 300 },
    ],
    escort: [['halo_eater', 3], ['hollow_thane', 2]],
    loot: HL([8, 10], [9, 11], [4, 5], [4, 5], 'eaten_halo'),
  },
});

// ---- wave 3: eight more small mobs
Object.assign(ENEMIES, {
  anchor_bearer: { name: 'Anchor-Bearer', biome: 'shore', hp: 150, def: 2, speed: 1.0, xp: 11, r: 0.45, ai: 'shamble', aggro: 8,
    attacks: [{ pattern: 'radial', proj: 'rustlink', count: 8, turn: 0.39, dmg: 18, speed: 4, range: 5, cd: 2.2, tell: 500 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0.004) },
  lens_moth: { name: 'Lens Moth', biome: 'shore', hp: 80, def: 0, speed: 2.4, xp: 9, r: 0.45, ai: 'drift', keep: 4, aggro: 9,
    attacks: [{ pattern: 'aimed', proj: 'lensflare', count: 2, arc: 0.3, dmg: 14, speed: 9, range: 7, cd: 1.5, tell: 250 }],
    loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0) },
  mourning_willow: { name: 'Mourning Willow', biome: 'fen', hp: 450, def: 6, speed: 0.5, xp: 34, r: 0.5, ai: 'kite', keep: 5, aggro: 9,
    attacks: [{ pattern: 'aimed', proj: 'tear', count: 5, arc: 0.9, dmg: 30, speed: 5, range: 7, cd: 1.8, tell: 400 }],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.012) },
  grave_leech: { name: 'Grave Leech', biome: 'fen', hp: 520, def: 4, speed: 1.4, xp: 36, r: 0.5, ai: 'shamble', aggro: 9, contact: 30,
    attacks: [{ pattern: 'aimed', proj: 'bloodclot', count: 2, arc: 0.2, dmg: 34, speed: 7, range: 7, cd: 1.4, tell: 250 }],
    loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.012) },
  frost_skald: { name: 'Frost Skald', biome: 'runeholt', hp: 800, def: 12, speed: 1.0, xp: 82, r: 0.55, ai: 'kite', keep: 5, aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'icenote', count: 5, turn: 0.4, waves: 6, gap: 0.12, dmg: 42, speed: 5, range: 7, cd: 2.8, tell: 600 }],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03) },
  wolf_shield: { name: 'Wolf-Shield', biome: 'runeholt', hp: 1000, def: 22, speed: 2.0, xp: 88, r: 0.6, ai: 'shamble', aggro: 10, contact: 55,
    attacks: [{ pattern: 'aimed', proj: 'shieldboss', count: 3, arc: 0.4, dmg: 45, speed: 7, range: 7, cd: 1.6, tell: 300 }],
    loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03) },
  cherub_husk: { name: 'Cherub Husk', biome: 'godfall', hp: 1700, def: 14, speed: 2.4, xp: 175, r: 0.5, ai: 'drift', keep: 4.5, aggro: 11,
    attacks: [{ pattern: 'aimed', proj: 'goldtear', count: 3, arc: 0.5, waves: 2, gap: 0.12, dmg: 58, speed: 9, range: 8, cd: 1.4, tell: 250 }],
    loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.06, MYTHIC(0.0005)) },
  reliquary_spider: { name: 'Reliquary Spider', biome: 'godfall', hp: 2100, def: 20, speed: 1.8, xp: 190, r: 0.55, ai: 'orbit', keep: 4, aggro: 11,
    attacks: [{ pattern: 'aimed', proj: 'bonebeam', count: 1, dmg: 85, speed: 11, range: 9, cd: 1.1, tell: 300 }],
    loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.06, MYTHIC(0.0005)) },
});
ENEMIES.pilgrim_elder.children = ['brine_pilgrim'];
ENEMIES.rune_warden.children = ['cairn_crawler'];

// ---- EVOLVED parents: a bigger, older version of one small mob, surrounded by its own kind.
// Stats derive from the child; each gets its own signature attack.
const EVOLVED = {
  lighthouse_jelly: ['lantern_jelly', 'The Lighthouse Jelly', { pattern: 'radial', proj: 'beacon', count: 12, turn: 0.26, waves: 2, gap: 0.3 }],
  salt_matriarch: ['salt_widow', 'Salt Matriarch', { pattern: 'radial', proj: 'saltcrystal', count: 10, turn: 0.31 }],
  trap_hound_alpha: ['trap_hound', 'Trap-Hound Alpha', { pattern: 'aimed', proj: 'snapjaw', count: 3, arc: 0.5, waves: 2, gap: 0.15 }],
  anchor_titan: ['anchor_bearer', 'Anchor Titan', { pattern: 'radial', proj: 'anchorhead', count: 10, turn: 0.31, waves: 2, gap: 0.4 }],
  moth_queen: ['lens_moth', 'Lens Moth Queen', { pattern: 'radial', proj: 'mothdust', count: 16, turn: 0.2 }],
  great_bell: ['bell_taken', 'The Great Bell-Taken', { pattern: 'radial', proj: 'greattoll', count: 16, turn: 0.2, waves: 3, gap: 0.35 }],
  peat_martyr: ['peat_saint', 'Peat Martyr', { pattern: 'aimed', proj: 'tombshard', count: 5, arc: 0.7 }],
  mire_chorus: ['mire_choir', 'The Mire Chorus', { pattern: 'radial', proj: 'chorusnote', count: 20, turn: 0.16, waves: 2, gap: 0.3 }],
  twin_lamp_heron: ['lantern_heron', 'Twin-Lamp Heron', { pattern: 'aimed', proj: 'twinwisp', count: 2, arc: 0.25, waves: 3, gap: 0.12 }],
  tallow_matron: ['candle_mite', 'Tallow Matron', { pattern: 'radial', proj: 'tallowdrop', count: 12, turn: 0.26 }],
  elder_willow: ['mourning_willow', 'Elder Willow', { pattern: 'radial', proj: 'thornseed', count: 14, turn: 0.22, waves: 2, gap: 0.4 }],
  leech_prime: ['grave_leech', 'Leech Prime', { pattern: 'aimed', proj: 'leechspit', count: 4, arc: 0.45, waves: 2, gap: 0.14 }],
  glacier_headsman: ['frozen_executioner', 'Glacier Headsman', { pattern: 'radial', proj: 'glacierchunk', count: 14, turn: 0.22, waves: 2, gap: 0.35 }],
  wheel_abbot: ['prayer_monk', 'Prayer-Wheel Abbot', { pattern: 'radial', proj: 'wheelglyph', count: 6, turn: 0.3, waves: 12, gap: 0.1 }],
  elder_hush: ['antlered_hush', 'The Elder Hush', { pattern: 'aimed', proj: 'hushtine', count: 6, arc: 1.1 }],
  saga_singer: ['frost_skald', 'Saga-Singer', { pattern: 'radial', proj: 'sagachord', count: 12, turn: 0.26, waves: 3, gap: 0.3 }],
  shieldwall_pack: ['wolf_shield', 'The Shieldwall Pack', { pattern: 'aimed', proj: 'shieldbash', count: 5, arc: 0.8, waves: 2, gap: 0.2 }],
  hollow_jarl: ['hollow_thane', 'The Hollow Jarl', { pattern: 'radial', proj: 'jarlblade', count: 12, turn: 0.26, waves: 2, gap: 0.25 }],
  halo_glutton: ['halo_eater', 'The Halo Glutton', { pattern: 'radial', proj: 'gluttonhalo', count: 10, turn: 0.31, waves: 3, gap: 0.3 }],
  cathedral_engine: ['choir_engine', 'The Cathedral Engine', { pattern: 'radial', proj: 'organblast', count: 18, turn: 0.17, waves: 2, gap: 0.3 }],
  seraph_husk: ['cherub_husk', 'Seraph Husk', { pattern: 'aimed', proj: 'seraphfeather', count: 6, arc: 0.9, waves: 2, gap: 0.15 }],
  broodmother: ['reliquary_spider', 'Reliquary Broodmother', { pattern: 'radial', proj: 'broodegg', count: 14, turn: 0.22 }],
};
for (const [id, [of, name, atk]] of Object.entries(EVOLVED)) {
  const c = ENEMIES[of], base = c.attacks[0];
  ENEMIES[id] = {
    name, biome: c.biome, sheet: 'champions', evolved: of,
    hp: c.hp * 5, def: c.def + 5, speed: Math.max(0.5, c.speed * 0.7), xp: c.xp * 5, r: 0.75,
    ai: c.ai === 'charge' ? 'shamble' : c.ai, keep: (c.keep || 3) + 1, aggro: c.aggro + 2, contact: c.contact ? Math.round(c.contact * 1.5) : 0,
    attacks: [{ ...atk, dmg: Math.round(base.dmg * 1.4), speed: base.speed * 0.95, range: base.range + 1, cd: base.cd * 1.15, tell: base.tell + 150 }],
    children: [of], cap: 6, every: 9,
    loot: c.loot, lootLuck: 3,
  };
}
// which parents lead groups in each biome (the old mixed parents stay as rarer leaders)
export const GROUPS = {
  shore: ['pilgrim_elder', 'lighthouse_jelly', 'salt_matriarch', 'trap_hound_alpha', 'anchor_titan', 'moth_queen'],
  fen: ['great_bell', 'peat_martyr', 'mire_chorus', 'twin_lamp_heron', 'tallow_matron', 'elder_willow', 'leech_prime', 'bog_abbess'],
  runeholt: ['rune_warden', 'glacier_headsman', 'wheel_abbot', 'elder_hush', 'saga_singer', 'shieldwall_pack'],
  godfall: ['hollow_jarl', 'halo_glutton', 'cathedral_engine', 'seraph_husk', 'broodmother', 'fallen_choirmaster'],
};

export const PARENTS = { shore: 'pilgrim_elder', fen: 'bog_abbess', runeholt: 'rune_warden', godfall: 'fallen_choirmaster' };
export const HERALDS = { shore: 'tide_herald', fen: 'bog_bellringer', runeholt: 'rime_herald', godfall: 'gilded_penitent' };
export const BIOME_BOSS = { shore: 'brine_cathedral', fen: 'wick_mother', runeholt: 'orrery_of_winter', godfall: 'penitent_colossus' };
export const EVENTS_TO_BOSS = 3;


// ---- uniques on heralds and bosses
ENEMIES.tide_herald.loot.push({ id: 'heralds_conch', p: 0.08 });
ENEMIES.bog_bellringer.loot.push({ id: 'bellringers_rope', p: 0.08 });
ENEMIES.rime_herald.loot.push({ id: 'rime_standard', p: 0.08 });
ENEMIES.gilded_penitent.loot.push({ id: 'penitents_scourge', p: 0.08 });

// ---- DUNGEON BOSSES (scripted like realm bosses; asleep until you enter their room)
export const DUNGEON_BOSSES = {
  drowned_abbot: {
    name: 'The Drowned Abbot', biome: 'chapel', hp: 14000, def: 8, xp: 2600, r: 1.4, speed: 0.35, keep: 6, summon: 'brine_pilgrim',
    phases: [{ at: 1, cycle: ['censer', 'crozier', 'censer'] }, { at: 0.66, name: 'The water rises.', cycle: ['censer', 'glass', 'crozier', 'summon'] },
      { at: 0.33, name: 'Mass for the drowned!', cycle: ['flood', 'glass', 'crozier', 'flood'] }],
    moves: {
      censer: { tell: 0.6, fire: [{ pattern: 'aimed', proj: 'tidebolt', count: 7, arc: 1.0, waves: 2, gap: 0.25, dmg: 48, speed: 6, range: 8 },
        { delay: 0.3, pattern: 'radial', proj: 'bubble', count: 16, dmg: 40, speed: 3, range: 8 }], recover: 0.8 },
      crozier: { tell: 0.8, fire: [0, 0.3].map((delay, k) => ({ delay, pattern: 'radial', proj: 'bellpearl', count: 20, turn: k * 0.16, dmg: 52, speed: 4.5 - k, range: 9 })), recover: 0.9 },
      glass: { special: true, tell: 0.9, spirals: [{ proj: 'conchwave', arms: 3, every: 0.1, turn: 0.23, speed: 5, dmg: 46, range: 9, dur: 2.6 },
        { proj: 'lensflare', arms: 3, every: 0.1, turn: -0.23, speed: 6, dmg: 46, range: 9, dur: 2.6 }], recover: 0.8 },
      flood: { special: true, tell: 0.9, spirals: [{ proj: 'bubble', arms: 6, every: 0.12, turn: 0.17, speed: 3.5, dmg: 42, range: 9, dur: 3 }],
        stream: { proj: 'tidebolt', every: 0.08, speed: 9, dmg: 55, range: 10, dur: 2.2, wobble: 0.3 }, recover: 0.8 },
      summon: { special: true, tell: 0.5, summon: 4, recover: 0.5 },
    },
    loot: [{ slot: 'weapon', tiers: [3, 5], p: 1 }, { slot: 'armor', tiers: [3, 5], p: 1 }, { slot: 'ability', tiers: [2, 3], p: 0.6 },
      { slot: 'ring', tiers: [2, 3], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'pot_hp', p: 1 },
      { id: 'abbots_crozier', p: 0.14 }, { id: 'stained_glass_halo', p: 0.12 }, { id: 'tidewoven_coat', p: 0.14 }, { id: 'drowned_bell', p: 0.16 }],
  },
  fallen_heart: {
    name: 'The Fallen Heart', biome: 'heart', sheet: 'godheart', hp: 95000, def: 40, xp: 16000, r: 2.2, speed: 0, keep: 0, summon: 'cherub_husk',
    phases: [{ at: 1, cycle: ['beat', 'veins', 'beat'] }, { at: 0.75, name: 'The cage cracks.', cycle: ['beat', 'saints', 'veins', 'pulse'] },
      { at: 0.5, name: 'It remembers being a god.', cycle: ['cage', 'veins', 'beat', 'pulse', 'saints'] },
      { at: 0.25, name: 'THE LAST BEAT.', cycle: ['cataclysm', 'pulse', 'cage', 'cataclysm', 'veins'] }],
    moves: {
      beat: { tell: 0.7, fire: [0, 0.35].map((delay, k) => ({ delay, pattern: 'radial', proj: 'gaze', count: 28, turn: k * 0.11, dmg: 150, speed: 4.5 + k, range: 10 })), recover: 0.8 },
      veins: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'kintsugi', count: 7, arc: 1.0, waves: 4, gap: 0.18, dmg: 160, speed: 9, range: 10 }], recover: 0.7 },
      pulse: { tell: 0.6, spirals: [{ proj: 'organblast', arms: 4, every: 0.1, turn: 0.21, speed: 5, dmg: 140, range: 10, dur: 2.8 }], recover: 0.6 },
      saints: { special: true, tell: 0.6, summon: 4, fire: [{ pattern: 'radial', proj: 'requiem', count: 16, dmg: 130, speed: 4, range: 9 }], recover: 0.6 },
      cage: { special: true, tell: 1.0, spirals: [{ proj: 'gluttonhalo', arms: 5, every: 0.1, turn: 0.17, speed: 5, dmg: 150, range: 10, dur: 3 },
        { proj: 'quake', arms: 5, every: 0.1, turn: -0.17, speed: 4, dmg: 150, range: 10, dur: 3 }], recover: 0.9 },
      cataclysm: { special: true, tell: 1.2, fire: [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((delay, k) => ({ delay, pattern: 'radial', proj: k % 2 ? 'gaze' : 'organblast', count: 24, turn: k * 0.13, dmg: 170, speed: 3.5 + k * 0.4, range: 11 })),
        stream: { proj: 'kintsugi', every: 0.07, speed: 11, dmg: 170, range: 12, dur: 1.6, wobble: 0.35 }, recover: 1.0 },
    },
    loot: [{ slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [10, 11], p: 1 }, { slot: 'ability', tiers: [5, 5], p: 0.9 },
      { slot: 'ring', tiers: [5, 5], p: 0.9 }, { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.6 },
      { id: 'godheart_knuckle', p: 0.1 }, { id: 'godheart_tongs', p: 0.1 }, { id: 'godheart_scepter', p: 0.1 },
      { id: 'godforged_plate', p: 0.1 }, { id: 'heartstring_vestment', p: 0.1 }, { id: 'heartbreak_coat', p: 0.1 },
      { id: 'crown_of_the_fallen', p: 0.08 }, ...MYTHIC(0.02)],
  },
};

// ---- DUNGEONS
export const DUNGEONS = {
  chapel: { name: 'The Sunken Chapel', floor: 'chapelfloor', wall: 'chapelwall', hazard: null, rooms: 9, portal: 'chapel', style: 'chapel',
    hazardFx: { kind: 'tide', name: 'the rising tide', every: 6, speed: 3.2, dmg: 34, proj: 'bubble' },
    chestLoot: [{ slot: 'weapon', tiers: [3, 6], p: 0.8 }, { slot: 'armor', tiers: [3, 6], p: 0.8 }, { slot: 'ring', tiers: [2, 3], p: 0.5 },
      { stat: true, p: 0.6 }, { id: 'pot_hp', p: 1 }, { id: 'drowned_bell', p: 0.05 }, { id: 'tidewoven_coat', p: 0.04 }],
    mobs: ['brine_pilgrim', 'lantern_jelly', 'anchor_bearer', 'salt_widow', 'lens_moth'], elites: ['pilgrim_elder', 'salt_matriarch', 'anchor_titan'],
    boss: 'drowned_abbot', mobHp: 1.6 },
  forge: { name: 'The Drowned Forge', floor: 'forge', wall: 'forgewall', hazard: 'lava', rooms: 11, portal: 'dungeon', style: 'forge',
    hazardFx: { kind: 'zones', name: 'falling slag', every: 3.2, n: 3, r: 1.4, delay: 1.1, dmg: 95, spread: 4, stagger: 0.15, shards: 6, proj: 'slag', colors: ['#f2641a', '#ffc94a'] },
    chestLoot: [{ slot: 'weapon', tiers: [7, 9], p: 0.8 }, { slot: 'armor', tiers: [7, 10], p: 0.8 }, { slot: 'ability', tiers: [3, 4], p: 0.5 },
      { stat: true, p: 0.9 }, { id: 'pot_hp', p: 1 }, { id: 'cinder_saints_fist', p: 0.03 }, { id: 'bellwrights_mail', p: 0.03 }],
    mobs: ['bellows_bound', 'mold_wrought'], elites: [], boss: 'unstruck', mobHp: 1 },
  heart: { name: 'The Heart of Godfall', floor: 'goldvein', wall: 'ribwall', hazard: 'lava', rooms: 13, portal: 'heart', style: 'heart',
    hazardFx: { kind: 'zones', name: 'a heartbeat', every: 4, n: 5, r: 1.7, delay: 1.0, dmg: 150, spread: 5, stagger: 0.06, shards: 8, proj: 'kintsugi', colors: ['#ff4a5a', '#f2c14e'] },
    chestLoot: [{ slot: 'weapon', tiers: [9, 10], p: 0.8 }, { slot: 'armor', tiers: [10, 11], p: 0.8 }, { slot: 'ability', tiers: [4, 5], p: 0.6 },
      { slot: 'ring', tiers: [4, 5], p: 0.6 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'crown_of_the_fallen', p: 0.03 }, { id: 'gravedust_band', p: 0.05 }],
    mobs: ['halo_eater', 'reliquary_spider', 'cherub_husk', 'hollow_thane', 'choir_engine'],
    elites: ['seraph_husk', 'hollow_jarl', 'halo_glutton', 'broodmother'], boss: 'fallen_heart', mobHp: 1.8 },
};
// portal drops: [dungeon, chance] by what died
export function portalDrop(D, id) {
  if (D.herald) return { shore: ['chapel', 0.45], fen: ['chapel', 0.45], runeholt: ['scriptorium', 0.45], godfall: ['heart', 0.3] }[D.biome];
  if (id === 'brine_cathedral' || id === 'wick_mother') return ['chapel', 1];
  if (id === 'orrery_of_winter') return ['forge', 1];
  if (id === 'penitent_colossus') return ['heart', 1];
  const parent = !!D.children;
  return { shore: ['chapel', parent ? 0.05 : 0.008], fen: ['chapel', parent ? 0.06 : 0.012],
    runeholt: ['forge', parent ? 0.07 : 0.02], godfall: [parent ? 'heart' : 'forge', parent ? 0.025 : 0.03] }[D.biome] || null;
}

export const BIOME_SPAWNS = {
  shore: [['brine_pilgrim', 3, 5], ['lantern_jelly', 2, 4], ['salt_widow', 1, 2], ['trap_hound', 2, 4]],
  fen: [['bell_taken', 2, 4], ['peat_saint', 2, 3], ['mire_choir', 1, 2], ['lantern_heron', 1, 3], ['candle_mite', 3, 5]],
  runeholt: [['frozen_executioner', 1, 3], ['cairn_crawler', 2, 3], ['prayer_monk', 1, 2], ['antlered_hush', 1, 3]],
  godfall: [['hollow_thane', 2, 4], ['censer_magistrate', 1, 1], ['halo_eater', 2, 3], ['choir_engine', 1, 2]],
};

// ---- REALM BOSSES: random events, one per biome.
// moves: tell (s) -> fire[] (each may have `delay`) and/or spiral / invuln / summon -> recover (s).
// special:true shows the sprite's special frame during the tell and the move.
const BL = (w, a, ab, rg, stats, uniques, mythic) => [
  { slot: 'weapon', tiers: w, p: 0.7 }, { slot: 'armor', tiers: a, p: 0.7 }, { slot: 'ability', tiers: ab, p: 0.4 },
  { slot: 'ring', tiers: rg, p: 0.4 }, ...Array.from({ length: stats }, () => ({ stat: true, p: 0.8 })),
  { id: 'pot_hp', p: 0.6 }, { id: 'pot_mp', p: 0.6 }, ...uniques, ...MYTHIC(mythic),
];
export const REALM_BOSSES = {
  brine_cathedral: {
    name: 'The Brine Cathedral', biome: 'shore', hp: 7000, def: 4, xp: 900, r: 1.5, speed: 0.9, keep: 5,
    summon: 'brine_pilgrim',
    phases: [{ at: 1, cycle: ['bell', 'claw', 'claw'] }, { at: 0.66, name: 'The bell tolls for the drowned.', cycle: ['hide', 'bell', 'tidecall', 'claw'] }, { at: 0.33, name: 'The Cathedral floods!', cycle: ['deluge', 'claw', 'bell', 'deluge', 'hide'] }],
    moves: {
      tidecall: { tell: 0.7, fire: [{ pattern: 'radial', proj: 'bubble', count: 24, dmg: 30, speed: 2.5, range: 9 }, { delay: 0.3, pattern: 'aimed', proj: 'clawsnap', count: 5, arc: 0.6, dmg: 40, speed: 8, range: 8 }], recover: 0.8 },
      deluge: { special: true, tell: 0.8, spirals: [{ proj: 'bellpearl', arms: 3, every: 0.1, turn: 0.21, speed: 5, dmg: 36, range: 9, dur: 3 }, { proj: 'bubble', arms: 3, every: 0.1, turn: -0.21, speed: 4, dmg: 30, range: 9, dur: 3 }], recover: 0.8 },
      bell: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'bellpearl', count: 18, dmg: 34, speed: 4.5, range: 9 },
        { delay: 0.25, pattern: 'radial', proj: 'bellpearl', count: 18, turn: 0.17, dmg: 34, speed: 3.5, range: 9 }], recover: 0.9 },
      claw: { tell: 0.35, fire: [{ pattern: 'aimed', proj: 'clawsnap', count: 3, arc: 0.4, waves: 3, gap: 0.12, dmg: 40, speed: 9, range: 8 }], recover: 0.6 },
      hide: { special: true, tell: 0.5, invuln: 2.4, summon: 3,
        spiral: { proj: 'bubble', arms: 4, every: 0.12, turn: 0.25, speed: 5, dmg: 30, range: 8, dur: 2.4 }, recover: 0.6 },
    },
    loot: BL([2, 4], [2, 4], [1, 2], [1, 2], 1, [{ id: 'abbots_claw', p: 0.12 }, { id: 'pearl_of_the_drowned_mass', p: 0.12 }], 0.003),
  },
  wick_mother: {
    name: 'The Wick-Mother', biome: 'fen', hp: 15000, def: 10, xp: 2200, r: 1.4, speed: 0.6, keep: 6,
    summon: 'candle_mite',
    phases: [{ at: 1, cycle: ['flare', 'drip', 'brood', 'drip'] }, { at: 0.66, name: 'The wick catches.', cycle: ['flare', 'brood', 'pyre', 'drip'] }, { at: 0.33, name: 'She burns down to the bone!', cycle: ['conflagration', 'drip', 'flare', 'brood'] }],
    moves: {
      pyre: { tell: 0.6, spirals: [{ proj: 'candleflame', arms: 4, every: 0.12, turn: 0.27, speed: 4.5, dmg: 55, range: 9, dur: 2.4 }], recover: 0.7 },
      conflagration: { special: true, tell: 0.9, spirals: [{ proj: 'candleflame', arms: 5, every: 0.1, turn: 0.19, speed: 4.5, dmg: 60, range: 9, dur: 3.2 }, { proj: 'waxspark', arms: 5, every: 0.1, turn: -0.19, speed: 3.5, dmg: 50, range: 9, dur: 3.2 }], fire: [{ pattern: 'aimed', proj: 'tallow', count: 3, arc: 0.5, dmg: 65, speed: 5, range: 9 }], recover: 0.9 },
      flare: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'corpseflame', count: 24, turn: 0.13, waves: 2, gap: 0.3, dmg: 52, speed: 3.6, range: 9 },
        { delay: 0.2, pattern: 'aimed', proj: 'candleflame', count: 5, arc: 0.7, dmg: 60, speed: 7, range: 9 }], recover: 1.0 },
      drip: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'tallow', count: 7, arc: 1.2, waves: 2, gap: 0.35, dmg: 58, speed: 4.5, range: 9, size: 0.55 }], recover: 0.7 },
      brood: { special: true, tell: 0.7, summon: 4, fire: [{ pattern: 'radial', proj: 'waxspark', count: 12, dmg: 50, speed: 5, range: 6 }], recover: 0.9 },
    },
    loot: BL([4, 6], [4, 6], [2, 3], [2, 3], 2, [{ id: 'wick_of_the_mother', p: 0.1 }, { id: 'tallow_vestment', p: 0.12 }], 0.004),
  },
  orrery_of_winter: {
    name: 'The Orrery of Winter', biome: 'runeholt', hp: 26000, def: 18, xp: 4200, r: 1.6, speed: 0.7, keep: 6,
    summon: 'cairn_crawler',
    phases: [{ at: 1, cycle: ['orbit', 'shatter', 'align'] }, { at: 0.66, name: 'The rings realign.', cycle: ['orbit', 'align', 'shatter', 'summon'] }, { at: 0.33, name: 'Absolute winter!', cycle: ['eclipse', 'align', 'shatter', 'eclipse', 'summon'] }],
    moves: {
      eclipse: { special: true, tell: 1.0, spirals: [{ proj: 'snowflake', arms: 4, every: 0.09, turn: 0.17, speed: 5.5, dmg: 95, range: 9, dur: 3 }, { proj: 'starbeam', arms: 4, every: 0.09, turn: -0.17, speed: 4.5, dmg: 95, range: 9, dur: 3 }], recover: 0.9 },
      orbit: { tell: 0.6, spiral: { proj: 'snowflake', arms: 3, every: 0.09, turn: 0.19, speed: 5.5, dmg: 95, range: 9, dur: 2.6 }, recover: 0.6 },
      shatter: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'starbeam', count: 16, dmg: 105, speed: 6, range: 8 },
        { delay: 0.2, pattern: 'radial', proj: 'starbeam', count: 16, turn: 0.2, dmg: 105, speed: 4.5, range: 8 }], recover: 0.8 },
      align: { special: true, tell: 0.9, stream: { proj: 'rune', every: 0.06, speed: 11, dmg: 100, range: 11, dur: 1.6, wobble: 0.15 }, recover: 0.8 },
      summon: { special: true, tell: 0.5, summon: 2, recover: 0.5 },
    },
    loot: BL([6, 8], [6, 9], [3, 4], [3, 4], 2, [{ id: 'orrery_seal', p: 0.1 }, { id: 'starless_band', p: 0.12 }], 0.005),
  },
  penitent_colossus: {
    name: 'The Penitent Colossus', biome: 'godfall', hp: 42000, def: 26, xp: 7000, r: 1.7, speed: 0.5, keep: 6,
    summon: 'hollow_thane',
    phases: [{ at: 1, cycle: ['gaze', 'seams', 'slam'] }, { at: 0.66, name: 'The Colossus remembers its crimes.', cycle: ['slam', 'gaze', 'seams', 'summon'] }, { at: 0.33, name: 'PENANCE.', cycle: ['penance', 'gaze', 'slam', 'penance', 'summon'] }],
    moves: {
      penance: { special: true, tell: 1.1, fire: [0, 0.25, 0.5, 0.75, 1.0].map((delay, k) => ({ delay, pattern: 'radial', proj: 'quake', count: 18, turn: k * 0.17, dmg: 150, speed: 4 + k * 0.5, range: 8 })), stream: { proj: 'gaze', every: 0.08, speed: 11, dmg: 150, range: 11, dur: 1.2, wobble: 0.4 }, recover: 1.0 },
      gaze: { tell: 0.7, stream: { proj: 'gaze', every: 0.07, speed: 11, dmg: 150, range: 11, dur: 1.8, wobble: 0.3 }, recover: 0.7 },
      seams: { tell: 0.6, fire: [{ pattern: 'radial', proj: 'goldshard', count: 24, turn: 0.13, dmg: 140, speed: 5, range: 8 },
        { delay: 0.15, pattern: 'aimed', proj: 'kintsugi', count: 5, arc: 0.5, dmg: 160, speed: 9, range: 9 }], recover: 0.8 },
      slam: { special: true, tell: 1.0, fire: [0, 0.25, 0.5].map((delay, k) => ({ delay, pattern: 'radial', proj: 'quake', count: 20, turn: k * 0.15, dmg: 170, speed: 4 + k, range: 8 })), recover: 1.0 },
      summon: { special: true, tell: 0.6, summon: 2, recover: 0.5 },
    },
    loot: BL([8, 10], [9, 11], [4, 5], [4, 5], 3, [{ id: 'penitents_head', p: 0.1 }, { id: 'gilded_penance', p: 0.12 }], 0.006),
  },
};

export const BOSS = {
  id: 'unstruck', name: 'The Unstruck', hp: 42000, def: 30, xp: 6000, r: 2.1,
  loot: [
    { slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 },
    { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.5 },
    { id: 'knuckle_of_the_unstruck', p: 0.15 }, { id: 'billet_of_the_first_oath', p: 0.15 }, { id: 'the_last_noon', p: 0.1 },
  ],
};

// boss uniques added after the boss tables exist
REALM_BOSSES.brine_cathedral.loot.push({ id: 'rose_window_vestment', p: 0.1 });
REALM_BOSSES.wick_mother.loot.push({ id: 'tallow_tongs', p: 0.1 });
REALM_BOSSES.orrery_of_winter.loot.push({ id: 'orrery_rod', p: 0.1 });
REALM_BOSSES.penitent_colossus.loot.push({ id: 'kintsugi_band', p: 0.1 });
BOSS.loot.push({ id: 'unstruck_anvil', p: 0.12 }, { id: 'furnace_heart_coat', p: 0.12 });

// ---- relics added with the Summoner + Harpooner, and the second wave of specials
REALM_BOSSES.wick_mother.loot.push({ id: 'lantern_of_the_last_watch', p: 0.1 });
REALM_BOSSES.orrery_of_winter.loot.push({ id: 'choir_of_bones', p: 0.08 });
REALM_BOSSES.brine_cathedral.loot.push({ id: 'leviathan_tine', p: 0.1 });
REALM_BOSSES.penitent_colossus.loot.push({ id: 'cinder_saints_fist', p: 0.08 });
ENEMIES.bog_bellringer.loot.push({ id: 'gravewardens_pall', p: 0.06 });
ENEMIES.tide_herald.loot.push({ id: 'whalers_slicker', p: 0.06 });
ENEMIES.rime_herald.loot.push({ id: 'quenching_tongs', p: 0.06 });
ENEMIES.gilded_penitent.loot.push({ id: 'ring_of_the_undertow', p: 0.05 });
ENEMIES.censer_magistrate.loot.push({ id: 'gravedust_band', p: 0.03 });
DUNGEON_BOSSES.drowned_abbot.loot.push({ id: 'drowned_mans_line', p: 0.12 }, { id: 'dawnbreaker', p: 0.1 });
DUNGEON_BOSSES.fallen_heart.loot.push({ id: 'the_hollow_psalm', p: 0.1 }, { id: 'kraken_bane', p: 0.08 });
BOSS.loot.push({ id: 'abyssal_line', p: 0.1 }, { id: 'bellwrights_mail', p: 0.1 });

// ---- the nexus training yard: dummies never die, never fight back, and count your damage
ENEMIES.training_dummy = { name: 'Training Dummy', biome: 'town', dummy: true, hp: 1e9, def: 0, speed: 0, xp: 0, r: 0.5, ai: 'shamble', aggro: 0, attacks: [], loot: [] };
ENEMIES.armored_dummy = { name: 'Armored Dummy (25 DEF)', biome: 'town', dummy: true, hp: 1e9, def: 25, speed: 0, xp: 0, r: 0.5, ai: 'shamble', aggro: 0, attacks: [], loot: [] };

// ---- boss movement + mechanics (see game.updateRealmBoss): every boss now moves and has its own tricks.
//   dash {speed, dur, dmg, trail?, slam?}  charges at you         blink {r}        teleports around you
//   orbit {dur, speed, r}                 circles you            zones {n, r, delay, dmg, spread, stagger?, shards?}  telegraphed slams
//   gapring {count, gap, speed, dmg, proj, waves?}  a ring with one gap   shield {count, id?}   immune until its guard dies
const BM = (id, moves, phases) => {
  const B = REALM_BOSSES[id] || DUNGEON_BOSSES[id];
  Object.assign(B.moves, moves);
  phases.forEach((cyc, i) => { if (B.phases[i]) B.phases[i].cycle = cyc; });
};
BM('brine_cathedral', {
  scuttle: { tell: 0.5, dash: { speed: 9, dur: 0.75, dmg: 60, trail: { proj: 'bubble', dmg: 28, speed: 2.5, range: 5, every: 0.08 } }, recover: 0.6 },
  tidepools: { tell: 0.4, zones: { n: 5, r: 1.6, delay: 0.9, dmg: 55, spread: 4, stagger: 0.12, shards: 6, proj: 'bubble', colors: ['#3c82ae', '#c8eeff'] }, recover: 0.5 },
  bellring: { special: true, tell: 0.7, gapring: { count: 36, gap: 0.8, speed: 4.2, dmg: 40, proj: 'bellpearl', waves: 3 }, recover: 0.8 },
}, [['bell', 'scuttle', 'claw', 'tidepools'], ['hide', 'scuttle', 'bell', 'tidecall', 'tidepools', 'claw'], ['deluge', 'bellring', 'scuttle', 'claw', 'tidepools', 'hide']]);
BM('wick_mother', {
  waxpools: { tell: 0.5, zones: { n: 6, r: 1.5, delay: 1.0, dmg: 70, spread: 4.5, stagger: 0.1, shards: 6, proj: 'waxspark', colors: ['#d4ff5a', '#e8e0c8'] }, recover: 0.6 },
  flicker: { tell: 0.4, blink: { r: 5, colors: ['#d4ff5a', '#e8e0c8', '#4a4434'] }, fire: [{ pattern: 'radial', proj: 'candleflame', count: 20, dmg: 60, speed: 4.5, range: 8 }], recover: 0.7 },
  wickrun: { tell: 0.6, dash: { speed: 7, dur: 1.0, dmg: 80, trail: { proj: 'corpseflame', dmg: 45, speed: 2, range: 4, every: 0.07 } }, recover: 0.7 },
}, [['flare', 'drip', 'waxpools', 'brood', 'drip'], ['flicker', 'flare', 'brood', 'waxpools', 'pyre', 'wickrun'], ['conflagration', 'flicker', 'wickrun', 'waxpools', 'flicker', 'brood']]);
BM('orrery_of_winter', {
  revolve: { tell: 0.6, orbit: { dur: 2.6, speed: 1.6, r: 6 }, stream: { proj: 'starbeam', every: 0.09, speed: 10, dmg: 95, range: 10, dur: 2.6, wobble: 0.1 }, recover: 0.6 },
  phase: { tell: 0.35, blink: { r: 6, colors: ['#cfffff', '#3befff', '#0e1530'] }, fire: [{ pattern: 'radial', proj: 'snowflake', count: 24, dmg: 90, speed: 5, range: 9 }], recover: 0.7 },
  zero: { special: true, tell: 0.9, gapring: { count: 40, gap: 0.7, speed: 4, dmg: 100, proj: 'snowflake', waves: 4, shift: 0.5 }, recover: 0.9 },
  hail: { tell: 0.5, zones: { n: 7, r: 1.4, delay: 1.0, dmg: 110, spread: 5, stagger: 0.08, shards: 0, colors: ['#cfffff', '#3befff'] }, recover: 0.5 },
}, [['orbit', 'revolve', 'shatter', 'hail', 'align'], ['phase', 'revolve', 'align', 'shatter', 'hail', 'summon'], ['eclipse', 'zero', 'phase', 'revolve', 'hail', 'eclipse', 'summon']]);
BM('penitent_colossus', {
  charge: { tell: 0.9, dash: { speed: 10, dur: 0.9, dmg: 220, slam: { n: 7, r: 1.7, delay: 0.35, dmg: 160, spread: 2.6, shards: 10, proj: 'quake' } }, recover: 0.9 },
  quakefield: { tell: 0.6, zones: { n: 8, r: 1.9, delay: 1.1, dmg: 180, spread: 5.5, stagger: 0.09, shards: 8, proj: 'goldshard', colors: ['#f2c14e', '#ff4a5a'] }, recover: 0.7 },
  vigil: { special: true, tell: 0.8, shield: { count: 4, id: 'hollow_thane' }, fire: [{ pattern: 'radial', proj: 'goldshard', count: 18, dmg: 120, speed: 4, range: 8 }], recover: 1.2 },
  kneel: { special: true, tell: 0.8, gapring: { count: 32, gap: 0.75, speed: 4.5, dmg: 160, proj: 'quake', waves: 3, shift: 0.7 }, recover: 0.9 },
}, [['gaze', 'charge', 'seams', 'slam', 'quakefield'], ['slam', 'charge', 'gaze', 'quakefield', 'seams', 'summon'], ['vigil', 'penance', 'charge', 'kneel', 'quakefield', 'gaze', 'charge']]);
BM('drowned_abbot', {
  procession: { tell: 0.6, orbit: { dur: 2.4, speed: 1.4, r: 5 }, spiral: { proj: 'bellpearl', arms: 3, every: 0.12, turn: 0.25, speed: 4, dmg: 42, range: 8, dur: 2.4 }, recover: 0.6 },
  baptism: { tell: 0.5, zones: { n: 6, r: 1.6, delay: 1.0, dmg: 60, spread: 4, stagger: 0.1, shards: 6, proj: 'bubble', colors: ['#3c82ae', '#ff8fbf'] }, recover: 0.6 },
  litany: { special: true, tell: 0.7, shield: { count: 4, id: 'brine_pilgrim' }, recover: 1.0 },
  vespers: { special: true, tell: 0.7, gapring: { count: 30, gap: 0.85, speed: 4, dmg: 50, proj: 'conchwave', waves: 3 }, recover: 0.8 },
}, [['censer', 'procession', 'baptism', 'crozier'], ['litany', 'censer', 'glass', 'procession', 'baptism', 'crozier'], ['flood', 'vespers', 'procession', 'baptism', 'glass', 'vespers']]);
BM('fallen_heart', {
  arteries: { tell: 0.5, zones: { n: 9, r: 2, delay: 1.0, dmg: 190, spread: 6, stagger: 0.07, shards: 8, proj: 'kintsugi', colors: ['#ff4a5a', '#f2c14e'] }, recover: 0.6 },
  systole: { special: true, tell: 0.8, gapring: { count: 44, gap: 0.65, speed: 4.5, dmg: 170, proj: 'gaze', waves: 4, shift: 0.45 }, recover: 0.8 },
  choir: { special: true, tell: 0.8, shield: { count: 5, id: 'cherub_husk' }, spiral: { proj: 'requiem', arms: 3, every: 0.12, turn: 0.2, speed: 4, dmg: 130, range: 9, dur: 3 }, recover: 1.0 },
}, [['beat', 'arteries', 'veins', 'beat'], ['beat', 'saints', 'arteries', 'veins', 'systole', 'pulse'], ['cage', 'choir', 'veins', 'systole', 'arteries', 'saints'], ['cataclysm', 'systole', 'arteries', 'cage', 'cataclysm', 'choir']]);

// ---- relics for the Duelist, Stormwright and Clockmaker
REALM_BOSSES.orrery_of_winter.loot.push({ id: 'the_eleventh_hour', p: 0.08 });
REALM_BOSSES.wick_mother.loot.push({ id: 'heaven_wire', p: 0.08 });
REALM_BOSSES.brine_cathedral.loot.push({ id: 'the_last_reflection', p: 0.08 });
DUNGEON_BOSSES.drowned_abbot.loot.push({ id: 'hall_of_mirrors', p: 0.1 });
DUNGEON_BOSSES.fallen_heart.loot.push({ id: 'the_broken_hourglass', p: 0.08 }, { id: 'the_thunderhead', p: 0.08 });
ENEMIES.rime_herald.loot.push({ id: 'silvered_duelcoat', p: 0.05 });

// ---- every enemy moves and shoots like itself (see game.moveEnemy / game.steerEnemyShot)
// ai: hop, burrow, swoop, blink, skitter, zigzag, flank, float, rooted (+ the originals)
// fly: drawn airborne with a bobbing shadow
// shot mv: wave {amp,freq} · accel (+max) · curve (rad/s, alt flips every other shot) · brake (+re: retarget speed)
//          boomer (s until it turns back) · split {at,n} · lob {n,h} (a mortar with a landing marker)
const MOVE = {
  lantern_jelly: 'float', bell_taken: 'hop', cairn_crawler: 'burrow', hollow_thane: 'flank', salt_widow: 'blink', trap_hound: 'zigzag',
  mire_choir: 'float', lantern_heron: 'swoop', candle_mite: 'skitter', antlered_hush: 'blink', halo_eater: 'swoop', anchor_bearer: 'hop',
  lens_moth: 'zigzag', mourning_willow: 'rooted', grave_leech: 'burrow', wolf_shield: 'flank', cherub_husk: 'float', reliquary_spider: 'skitter',
  bog_abbess: 'float', fallen_choirmaster: 'float', lighthouse_jelly: 'float', salt_matriarch: 'blink', trap_hound_alpha: 'zigzag', anchor_titan: 'hop',
  moth_queen: 'swoop', great_bell: 'hop', mire_chorus: 'float', twin_lamp_heron: 'swoop', tallow_matron: 'skitter', elder_willow: 'rooted',
  leech_prime: 'burrow', glacier_headsman: 'hop', wheel_abbot: 'blink', elder_hush: 'blink', shieldwall_pack: 'flank', hollow_jarl: 'flank',
  halo_glutton: 'swoop', seraph_husk: 'swoop', broodmother: 'skitter', tide_herald: 'float', bog_bellringer: 'hop', rime_herald: 'blink', gilded_penitent: 'flank',
};
const FLY = ['lantern_jelly', 'mire_choir', 'lantern_heron', 'halo_eater', 'lens_moth', 'cherub_husk', 'bog_abbess', 'fallen_choirmaster', 'lighthouse_jelly',
  'moth_queen', 'mire_chorus', 'twin_lamp_heron', 'halo_glutton', 'seraph_husk', 'tide_herald'];
const SHOT = {
  brine_pilgrim: [{ brake: 0.45, re: 8 }], lantern_jelly: [{ wave: { amp: 2.2, freq: 9 } }], bell_taken: [{ curve: 1.4 }], peat_saint: [{ lob: { n: 6, h: 30 } }],
  frozen_executioner: [{ curve: -0.9 }, { accel: 14, max: 2.5 }], cairn_crawler: [{ split: { at: 0.6, n: 4 } }],
  hollow_thane: [{ wave: { amp: 1.5, freq: 10 } }, { curve: 1.2 }], censer_magistrate: [{ curve: 0.8 }, { brake: 0.4, re: 9 }],
  bellows_bound: [{ lob: { n: 5, h: 24 } }], mold_wrought: [{ curve: 0.7 }, { accel: 12 }],
  salt_widow: [{ split: { at: 0.55, n: 5 } }], trap_hound: [{ boomer: 0.45 }], mire_choir: [{ wave: { amp: 1.8, freq: 7 } }, { accel: 10 }],
  lantern_heron: [{ curve: 2.2, alt: true }], candle_mite: [{ lob: { n: 4, h: 20 } }], prayer_monk: [{ curve: 1.0 }], antlered_hush: [{ accel: 16, max: 3 }],
  halo_eater: [{ boomer: 0.5 }], choir_engine: [{ wave: { amp: 1.2, freq: 8 } }, { curve: 2, alt: true }], anchor_bearer: [{ boomer: 0.6 }],
  lens_moth: [{ accel: 18, max: 3 }], mourning_willow: [{ lob: { n: 5, h: 36 } }], grave_leech: [{ split: { at: 0.5, n: 3 } }],
  frost_skald: [{ wave: { amp: 1.4, freq: 8 } }], wolf_shield: [{ boomer: 0.5 }], cherub_husk: [{ brake: 0.4, re: 9 }], reliquary_spider: [{ accel: 15 }],
  pilgrim_elder: [{ curve: 0.9 }], bog_abbess: [{ wave: { amp: 1.6, freq: 6 } }], rune_warden: [{ brake: 0.5, re: 10 }], fallen_choirmaster: [{ curve: -1.1 }],
  tide_herald: [{ wave: { amp: 1.6, freq: 7 } }, { accel: 12 }], bog_bellringer: [{ curve: 1.2 }, { lob: { n: 5, h: 30 } }],
  rime_herald: [{ split: { at: 0.6, n: 4 } }, { lob: { n: 6, h: 34 } }], gilded_penitent: [{ wave: { amp: 1.4, freq: 9 } }, { boomer: 0.55 }],
  lighthouse_jelly: [{ curve: 0.9 }], salt_matriarch: [{ split: { at: 0.5, n: 4 } }], trap_hound_alpha: [{ boomer: 0.5 }], anchor_titan: [{ lob: { n: 6, h: 34 } }],
  moth_queen: [{ wave: { amp: 1.6, freq: 8 } }], great_bell: [{ curve: 1.0 }], peat_martyr: [{ brake: 0.45, re: 9 }], mire_chorus: [{ wave: { amp: 1.4, freq: 7 } }],
  twin_lamp_heron: [{ curve: 2.0, alt: true }], tallow_matron: [{ lob: { n: 6, h: 26 } }], elder_willow: [{ split: { at: 0.6, n: 4 } }], leech_prime: [{ accel: 14 }],
  glacier_headsman: [{ lob: { n: 6, h: 38 } }], wheel_abbot: [{ curve: 1.3 }], elder_hush: [{ accel: 16, max: 3 }], saga_singer: [{ wave: { amp: 1.5, freq: 8 } }],
  shieldwall_pack: [{ boomer: 0.5 }], hollow_jarl: [{ curve: 1.1 }], halo_glutton: [{ boomer: 0.6 }], cathedral_engine: [{ wave: { amp: 1.2, freq: 6 } }],
  seraph_husk: [{ brake: 0.45, re: 10 }], broodmother: [{ split: { at: 0.55, n: 4 } }],
};
for (const [id, ai] of Object.entries(MOVE)) if (ENEMIES[id]) ENEMIES[id].ai = ai;
for (const id of FLY) if (ENEMIES[id]) ENEMIES[id].fly = true;
for (const [id, list] of Object.entries(SHOT)) {
  const E = ENEMIES[id];
  if (!E) continue;
  list.forEach((mv, k) => { if (E.attacks[k] && mv) E.attacks[k] = { ...E.attacks[k], mv }; });
}

// ---- wave 3: one hunter per biome, built around how it moves
ENEMIES.reef_eel = { name: 'Reef Eel', biome: 'shore', hp: 160, def: 2, speed: 1.6, xp: 14, r: 0.45, ai: 'burrow', aggro: 9, contact: 18,
  attacks: [{ pattern: 'aimed', proj: 'eelspit', count: 3, arc: 0.5, dmg: 18, speed: 6, range: 7, cd: 1.5, tell: 350, mv: { wave: { amp: 1.8, freq: 9 } } }],
  loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0, [{ id: 'whalers_slicker', p: 0.002 }]) };
ENEMIES.bog_toad = { name: 'Bog Toad', biome: 'fen', hp: 600, def: 6, speed: 1.6, xp: 40, r: 0.55, ai: 'hop', keep: 4, aggro: 9, contact: 30,
  attacks: [{ pattern: 'aimed', proj: 'bogspit', count: 3, dmg: 34, speed: 5, range: 7, cd: 2.0, tell: 500, mv: { lob: { n: 6, h: 32 } } }],
  loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.01) };
ENEMIES.frost_wraith = { name: 'Frost Wraith', biome: 'runeholt', hp: 950, def: 10, speed: 1.4, xp: 90, r: 0.5, ai: 'blink', keep: 4.5, aggro: 10, fly: true,
  attacks: [{ pattern: 'aimed', proj: 'iceneedle', count: 3, arc: 0.35, dmg: 48, speed: 4, range: 8, cd: 1.4, tell: 300, mv: { accel: 16, max: 3 } },
    { pattern: 'radial', proj: 'iceneedle', count: 8, dmg: 40, speed: 3, range: 6, cd: 3, tell: 500, mv: { curve: 1.2 } }],
  loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.03) };
ENEMIES.ash_harpy = { name: 'Ash Harpy', biome: 'godfall', hp: 2000, def: 16, speed: 2.2, xp: 170, r: 0.55, ai: 'swoop', keep: 5, aggro: 11, fly: true, contact: 70,
  attacks: [{ pattern: 'aimed', proj: 'emberfeather', count: 5, arc: 0.8, dmg: 58, speed: 8, range: 8, cd: 1.6, tell: 300, mv: { curve: 1.6, alt: true } }],
  loot: L([6, 8], [6, 9], [3, 4], [3, 4], 0.06) };
// roaming packs, per biome: [enemy, packs]
export const PACKS = { shore: [['reef_eel', 26]], fen: [['bog_toad', 20]], runeholt: [['frost_wraith', 16]], godfall: [['ash_harpy', 12]] };
// camp chests: what the guarded caches in each biome hold
export const CAMP_LOOT = {
  shore: [{ slot: 'weapon', tiers: [2, 4], p: 0.8 }, { slot: 'armor', tiers: [2, 4], p: 0.8 }, { slot: 'ring', tiers: [1, 2], p: 0.4 }, { stat: true, p: 0.3 }, { id: 'pot_hp', p: 1 }],
  fen: [{ slot: 'weapon', tiers: [4, 6], p: 0.8 }, { slot: 'armor', tiers: [4, 6], p: 0.8 }, { slot: 'ability', tiers: [2, 3], p: 0.5 }, { stat: true, p: 0.5 }, { id: 'pot_hp', p: 1 }],
  runeholt: [{ slot: 'weapon', tiers: [6, 8], p: 0.8 }, { slot: 'armor', tiers: [6, 9], p: 0.8 }, { slot: 'ring', tiers: [3, 4], p: 0.5 }, { stat: true, p: 0.7 }, { id: 'pot_mp', p: 1 }],
  godfall: [{ slot: 'weapon', tiers: [8, 10], p: 0.8 }, { slot: 'armor', tiers: [9, 11], p: 0.8 }, { slot: 'ability', tiers: [4, 5], p: 0.6 }, { stat: true, p: 1 }, { id: 'gravedust_band', p: 0.02 }],
};

// ---- wave 4: monsters built around mechanics
//   split {id, n}: bursts into smaller copies on death       bomb {r, dmg, fuse}: rushes you, swells, explodes
//   heal {every, pct, r}: mends wounded allies                guard: blocks shots from the front unless it is attacking
//   enrage: at 40% life it speeds up and attacks faster
// new patterns: wall (a line of shots), cage (a ring around YOU that closes in), orbit (shots circle the shooter, then fly),
//   shotgun (random spread and speeds), cross (+ then x), beam (a telegraphed laser)
ENEMIES.brine_slime = { name: 'Brine Slime', biome: 'shore', hp: 300, def: 0, speed: 1.0, xp: 18, r: 0.55, ai: 'hop', keep: 2, aggro: 8, contact: 20,
  split: { id: 'brine_slimelet', n: 3 },
  attacks: [{ pattern: 'shotgun', proj: 'slimeglob', count: 6, arc: 0.9, dmg: 16, speed: 5, range: 6, cd: 1.8, tell: 400 }],
  loot: L([0, 2], [0, 2], [0, 1], [0, 1], 0) };
ENEMIES.brine_slimelet = { name: 'Brine Slimelet', biome: 'shore', hp: 70, def: 0, speed: 2.2, xp: 4, r: 0.35, ai: 'skitter', aggro: 9, contact: 12,
  attacks: [{ pattern: 'aimed', proj: 'slimeglob', count: 1, dmg: 10, speed: 6, range: 5, cd: 1.6, tell: 250 }], loot: [] };
ENEMIES.gas_bloat = { name: 'Gas-Bloat', biome: 'fen', hp: 380, def: 2, speed: 2.4, xp: 30, r: 0.5, ai: 'zigzag', aggro: 10, fly: true,
  bomb: { r: 2.2, dmg: 90, fuse: 0.9 },
  attacks: [{ pattern: 'cross', proj: 'gasbubble', count: 4, dmg: 24, speed: 3.5, range: 5, cd: 2.4, tell: 400 }],
  loot: L([2, 4], [2, 4], [1, 2], [1, 2], 0.01) };
ENEMIES.cairn_mender = { name: 'Cairn Mender', biome: 'runeholt', hp: 1100, def: 12, speed: 0.8, xp: 95, r: 0.55, ai: 'kite', keep: 6, aggro: 11,
  heal: { every: 3.5, pct: 0.18, r: 6 },
  attacks: [{ pattern: 'cross', proj: 'mendrune', count: 8, dmg: 40, speed: 4.5, range: 7, cd: 2.2, tell: 450 },
    { pattern: 'cage', proj: 'mendrune', count: 10, r: 3.2, dmg: 44, speed: 3.2, range: 4, cd: 4.5, tell: 600 }],
  loot: L([4, 6], [4, 6], [2, 3], [2, 3], 0.04) };
ENEMIES.gilded_lancer = { name: 'Gilded Lancer', biome: 'godfall', hp: 2600, def: 20, speed: 1.6, xp: 210, r: 0.6, ai: 'flank', keep: 5, aggro: 11,
  guard: true,
  attacks: [{ pattern: 'beam', proj: 'goldshard', dmg: 120, range: 9, cd: 3.0, tell: 650 },
    { pattern: 'wall', proj: 'goldshard', count: 7, dmg: 60, speed: 5, range: 8, cd: 2.4, tell: 400 }],
  loot: L([7, 9], [7, 10], [3, 4], [3, 4], 0.07) };
// an easter egg that waddles the shore. It never fights back. It just runs.
ENEMIES.golden_duck = { name: 'The Golden Duck', biome: 'shore', hp: 1500, def: 30, speed: 3.2, xp: 300, r: 0.4, ai: 'flee', aggro: 7, attacks: [],
  loot: [{ id: 'rubber_duck', p: 1 }, { stat: true, p: 1 }] };
PACKS.shore.push(['brine_slime', 14]);
PACKS.fen.push(['gas_bloat', 12]);
PACKS.runeholt.push(['cairn_mender', 8]);
PACKS.godfall.push(['gilded_lancer', 7]);

// mechanics and new patterns for the old guard too
for (const id of ['wolf_shield', 'shieldwall_pack', 'anchor_bearer', 'anchor_titan']) ENEMIES[id].guard = true;
for (const id of ['hollow_thane', 'frozen_executioner', 'glacier_headsman', 'great_bell', 'hollow_jarl', 'grave_leech', 'trap_hound_alpha']) ENEMIES[id].enrage = true;
ENEMIES.mire_chorus.heal = { every: 4, pct: 0.12, r: 6 };
ENEMIES.cathedral_engine.heal = { every: 5, pct: 0.1, r: 7 };
const EXTRA = {
  trap_hound_alpha: { pattern: 'cage', proj: 'snapjaw', count: 9, r: 3, dmg: 40, speed: 3.4, range: 4, cd: 4, tell: 500 },
  cathedral_engine: { pattern: 'wall', proj: 'organblast', count: 9, dmg: 80, speed: 4, range: 9, cd: 3, tell: 500 },
  elder_hush: { pattern: 'beam', proj: 'hushtine', dmg: 90, range: 8, cd: 3.4, tell: 650 },
  salt_matriarch: { pattern: 'orbit', proj: 'saltcrystal', count: 8, r: 1.4, spin: 1.1, dmg: 30, speed: 5, range: 6, cd: 3.2, tell: 400 },
  candle_mite: { pattern: 'shotgun', proj: 'drip', count: 5, arc: 1.0, dmg: 20, speed: 5, range: 4, cd: 2.5, tell: 300 },
  halo_glutton: { pattern: 'orbit', proj: 'gluttonhalo', count: 10, r: 1.6, spin: 1.2, dmg: 70, speed: 5, range: 7, cd: 3.5, tell: 450 },
  rune_warden: { pattern: 'cage', proj: 'glyphbolt', count: 12, r: 3.5, dmg: 50, speed: 3, range: 5, cd: 4.5, tell: 600 },
  wheel_abbot: { pattern: 'cross', proj: 'wheelglyph', count: 8, dmg: 50, speed: 4, range: 7, cd: 2.5, tell: 400, waves: 3, gap: 0.3 },
  seraph_husk: { pattern: 'beam', proj: 'seraphfeather', dmg: 150, range: 9, cd: 3.2, tell: 600 },
  tide_herald: { pattern: 'wall', proj: 'tidebolt', count: 7, dmg: 45, speed: 4.5, range: 8, cd: 3.5, tell: 500 },
  gilded_penitent: { pattern: 'cage', proj: 'chainlink', count: 10, r: 3.3, dmg: 80, speed: 3.5, range: 4, cd: 4, tell: 550 },
};
for (const [id, atk] of Object.entries(EXTRA)) ENEMIES[id].attacks.push(atk);

// ---- calibrated damage (tools/calibrate.mjs): every monster scaled to its biome's budget
for (const [id, f] of Object.entries(DMG_TUNE)) {
  const D = ENEMIES[id];
  if (!D || f === 1) continue;
  D.attacks = D.attacks.map((a) => ({ ...a, dmg: Math.max(1, Math.round(a.dmg * f)) }));
  if (D.contact) D.contact = Math.round(D.contact * f);
  if (D.bomb) D.bomb = { ...D.bomb, dmg: Math.round(D.bomb.dmg * f) };
}

// ---- boss damage tuning: streams and spirals fire many separate volleys, so inner bosses get scaled as a whole
const scaleDmg = (o, f) => {
  if (Array.isArray(o)) { o.forEach((x) => scaleDmg(x, f)); return; }
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) { if (k === 'dmg' && typeof v === 'number') o[k] = Math.round(v * f); else scaleDmg(v, f); }
};
for (const [id, f] of Object.entries({ orrery_of_winter: 0.45, penitent_colossus: 0.5, fallen_heart: 0.55, drowned_abbot: 0.9 })) {
  const B = REALM_BOSSES[id] || DUNGEON_BOSSES[id];
  scaleDmg(B.moves, f);
}

// ================================================================ the last pass: dungeons get their own monsters
// (stats sit at each dungeon's tier; mobHp scales them further)
const DL = (w, a, ab, rg, st) => [{ slot: 'weapon', tiers: w, p: 0.1 }, { slot: 'armor', tiers: a, p: 0.1 }, { slot: 'ability', tiers: ab, p: 0.05 },
  { slot: 'ring', tiers: rg, p: 0.05 }, { stat: true, p: st }, { id: 'pot_hp', p: 0.08 }];
Object.assign(ENEMIES, {
  // ---- The Sunken Chapel
  drowned_acolyte: { name: 'Drowned Acolyte', biome: 'chapel', hp: 520, def: 5, speed: 1.1, xp: 45, r: 0.5, ai: 'kite', keep: 5, aggro: 10,
    attacks: [{ pattern: 'aimed', proj: 'tidebolt', count: 3, arc: 0.5, dmg: 30, speed: 6, range: 8, cd: 1.6, tell: 400, mv: { wave: { amp: 1.4, freq: 8 } } },
      { pattern: 'cage', proj: 'bubble', count: 8, r: 3, dmg: 32, speed: 3, range: 4, cd: 4.5, tell: 600 }], loot: DL([3, 5], [3, 5], [2, 3], [2, 3], 0.03) },
  barnacle_knight: { name: 'Barnacle Knight', biome: 'chapel', hp: 900, def: 12, speed: 1.0, xp: 60, r: 0.55, ai: 'flank', keep: 3.5, aggro: 10, guard: true,
    attacks: [{ pattern: 'wall', proj: 'bellpearl', count: 6, dmg: 34, speed: 4.5, range: 7, cd: 2.4, tell: 450 },
      { pattern: 'aimed', proj: 'clawsnap', count: 2, arc: 0.2, dmg: 40, speed: 8, range: 6, cd: 1.2, tell: 250 }], loot: DL([3, 5], [3, 6], [2, 3], [2, 3], 0.04) },
  bell_wraith: { name: 'Bell Wraith', biome: 'chapel', hp: 600, def: 4, speed: 1.5, xp: 50, r: 0.5, ai: 'blink', keep: 4.5, aggro: 10, fly: true,
    attacks: [{ pattern: 'radial', proj: 'toll', count: 12, dmg: 28, speed: 4, range: 7, cd: 2.2, tell: 500, mv: { curve: 1.1 } },
      { pattern: 'orbit', proj: 'bellpearl', count: 6, r: 1.3, spin: 1, dmg: 30, speed: 5, range: 6, cd: 3.5, tell: 400 }], loot: DL([3, 5], [3, 5], [2, 3], [2, 3], 0.03) },
  pew_mimic: { name: 'Pew Mimic', biome: 'chapel', hp: 700, def: 8, speed: 1.8, xp: 55, r: 0.6, ai: 'hop', keep: 1.5, aggro: 9, contact: 45,
    attacks: [{ pattern: 'shotgun', proj: 'splinter', count: 7, arc: 1, dmg: 26, speed: 5.5, range: 5, cd: 1.8, tell: 350 }], loot: DL([3, 5], [3, 5], [2, 3], [2, 3], 0.03) },
  bell_totem: { name: 'Drowned Bell', biome: 'chapel', hp: 1800, def: 10, speed: 0, xp: 40, r: 0.6, ai: 'rooted', aggro: 16,
    attacks: [{ pattern: 'radial', proj: 'bellpearl', count: 10, dmg: 30, speed: 3.5, range: 8, cd: 2.4, tell: 500, waves: 2, gap: 0.3 }], loot: [] },
  // ---- The Drowned Forge
  slag_imp: { name: 'Slag Imp', biome: 'forge', hp: 900, def: 10, speed: 2.6, xp: 120, r: 0.45, ai: 'skitter', aggro: 10,
    attacks: [{ pattern: 'shotgun', proj: 'cinder', count: 6, arc: 0.9, dmg: 60, speed: 6, range: 5, cd: 1.6, tell: 300 }], loot: DL([7, 9], [7, 10], [4, 4], [4, 4], 0.06) },
  anvil_golem: { name: 'Anvil Golem', biome: 'forge', hp: 3200, def: 22, speed: 1.4, xp: 320, r: 0.65, ai: 'hop', keep: 2, aggro: 10, guard: true, contact: 90,
    attacks: [{ pattern: 'aimed', proj: 'slag', count: 3, dmg: 80, speed: 5, range: 8, cd: 2.4, tell: 600, mv: { lob: { n: 8, h: 36 } } },
      { pattern: 'cross', proj: 'ingot', count: 8, dmg: 70, speed: 5, range: 6, cd: 3, tell: 500 }], loot: DL([8, 10], [8, 10], [4, 5], [4, 5], 0.1) },
  quench_wraith: { name: 'Quench Wraith', biome: 'forge', hp: 1500, def: 12, speed: 1.6, xp: 200, r: 0.5, ai: 'blink', keep: 5, aggro: 11, fly: true,
    attacks: [{ pattern: 'beam', proj: 'furnacebeam', dmg: 110, range: 9, cd: 3, tell: 600, col: '#cfffff' },
      { pattern: 'radial', proj: 'cinder', count: 10, dmg: 60, speed: 4, range: 6, cd: 2.6, tell: 400, mv: { accel: 10 } }], loot: DL([7, 9], [7, 10], [4, 4], [4, 4], 0.08) },
  // ---- The Heart of Godfall
  vein_crawler: { name: 'Vein Crawler', biome: 'heart', hp: 1600, def: 18, speed: 2, xp: 220, r: 0.5, ai: 'burrow', aggro: 10, enrage: true, contact: 80,
    attacks: [{ pattern: 'aimed', proj: 'kintsugi', count: 3, arc: 0.4, dmg: 70, speed: 8, range: 7, cd: 1.6, tell: 300, mv: { wave: { amp: 1.2, freq: 9 } } }], loot: DL([8, 10], [9, 11], [4, 5], [4, 5], 0.1) },
  gilded_cardinal: { name: 'Gilded Cardinal', biome: 'heart', hp: 2600, def: 22, speed: 1, xp: 300, r: 0.55, ai: 'kite', keep: 6, aggro: 11, heal: { every: 3.5, pct: 0.15, r: 7 },
    attacks: [{ pattern: 'cage', proj: 'goldshard', count: 12, r: 3.4, dmg: 80, speed: 3, range: 5, cd: 4, tell: 600 },
      { pattern: 'aimed', proj: 'requiem', count: 5, arc: 0.8, dmg: 70, speed: 6, range: 8, cd: 1.8, tell: 400 }], loot: DL([9, 10], [9, 11], [4, 5], [4, 5], 0.12) },
  reliquary_maw: { name: 'Reliquary Maw', biome: 'heart', hp: 3600, def: 26, speed: 0, xp: 340, r: 0.65, ai: 'rooted', aggro: 12,
    attacks: [{ pattern: 'orbit', proj: 'gaze', count: 10, r: 1.6, spin: 1.2, dmg: 80, speed: 5, range: 8, cd: 3, tell: 450 },
      { pattern: 'radial', proj: 'organblast', count: 16, dmg: 70, speed: 4, range: 8, cd: 2.4, tell: 500, mv: { curve: 0.9 } }], loot: DL([9, 10], [10, 11], [5, 5], [5, 5], 0.15) },
  blood_seraph: { name: 'Blood Seraph', biome: 'heart', hp: 2200, def: 18, speed: 2.4, xp: 280, r: 0.55, ai: 'swoop', keep: 5, aggro: 12, fly: true, contact: 90,
    attacks: [{ pattern: 'beam', proj: 'gaze', dmg: 130, range: 10, cd: 3.2, tell: 650, col: '#ff4a5a' },
      { pattern: 'aimed', proj: 'seraphfeather', count: 5, arc: 0.9, dmg: 70, speed: 8, range: 8, cd: 1.8, tell: 300, mv: { brake: 0.4, re: 10 } }], loot: DL([9, 10], [9, 11], [4, 5], [4, 5], 0.12) },
  // ---- The Frozen Scriptorium
  ink_wisp: { name: 'Ink Wisp', biome: 'scriptorium', hp: 700, def: 6, speed: 1.6, xp: 70, r: 0.5, ai: 'float', keep: 4, aggro: 10, fly: true,
    attacks: [{ pattern: 'aimed', proj: 'inkblot', count: 3, arc: 0.5, dmg: 40, speed: 6, range: 8, cd: 1.4, tell: 300, mv: { wave: { amp: 1.6, freq: 8 } } },
      { pattern: 'aimed', proj: 'inkblot', count: 3, dmg: 46, speed: 5, range: 7, cd: 3.5, tell: 500, mv: { lob: { n: 6, h: 30 } } }], loot: DL([5, 7], [5, 8], [3, 4], [3, 4], 0.05) },
  frost_librarian: { name: 'Frost Librarian', biome: 'scriptorium', hp: 1300, def: 12, speed: 1.1, xp: 110, r: 0.55, ai: 'kite', keep: 6, aggro: 11,
    attacks: [{ pattern: 'cage', proj: 'page', count: 10, r: 3.2, dmg: 50, speed: 3.2, range: 4, cd: 4, tell: 600 },
      { pattern: 'aimed', proj: 'iceneedle', count: 4, arc: 0.6, dmg: 48, speed: 5, range: 8, cd: 1.6, tell: 300, mv: { accel: 14 } }], loot: DL([6, 8], [6, 9], [3, 4], [3, 4], 0.07) },
  living_tome: { name: 'Living Tome', biome: 'scriptorium', hp: 800, def: 8, speed: 2.4, xp: 90, r: 0.5, ai: 'swoop', keep: 4.5, aggro: 10, fly: true, contact: 50,
    attacks: [{ pattern: 'orbit', proj: 'page', count: 8, r: 1.3, spin: 1, dmg: 40, speed: 5, range: 6, cd: 3, tell: 400 }], loot: DL([5, 7], [5, 8], [3, 4], [3, 4], 0.05) },
  ice_scribe: { name: 'Ice Scribe', biome: 'scriptorium', hp: 1800, def: 16, speed: 0, xp: 140, r: 0.55, ai: 'rooted', aggro: 12,
    attacks: [{ pattern: 'beam', proj: 'iceneedle', dmg: 90, range: 10, cd: 2.6, tell: 600, col: '#cfffff' },
      { pattern: 'cross', proj: 'snowflake', count: 8, dmg: 44, speed: 4.5, range: 8, cd: 2.2, tell: 400, waves: 2, gap: 0.3 }], loot: DL([6, 8], [6, 9], [3, 4], [3, 4], 0.08) },
  // a roaming realm event: the coin thief. It runs; every hit knocks gold loose.
  coin_imp: { name: 'The Coin Thief', biome: 'shore', hp: 2500, def: 10, speed: 3.4, xp: 50, r: 0.45, ai: 'flee', aggro: 9, attacks: [],
    loot: [{ id: 'mystery_box', p: 1 }, { slot: 'ring', tiers: [2, 5], p: 0.6 }] },
});
SPEECH.drowned_acolyte = { see: ['The Abbot sees you.', 'Breathe in. Deeper.'], die: ['...the water is warm...'] };
SPEECH.barnacle_knight = { see: ['None shall pass the nave.', 'Shells up!'], hurt: ['Barnacles... cracking...'] };
SPEECH.bell_wraith = { see: ['DOOONG.', 'Who rang me?'], die: ['...dong.'] };
SPEECH.pew_mimic = { see: ['Have a seat!', '*creeeak*'], atk: ['SIT DOWN!'], die: ['...service is over.'] };
SPEECH.slag_imp = { see: ['Hot! Hot! HOT!', 'Hee hee, burn!'] };
SPEECH.anvil_golem = { see: ['STRIKE.', 'I AM THE ANVIL.'], atk: ['HAMMER-FALL.'] };
SPEECH.quench_wraith = { see: ['Hssssss...', 'Cool... down...'] };
SPEECH.vein_crawler = { see: ['Ba-dum. Ba-dum.', 'The heart feeds me.'] };
SPEECH.gilded_cardinal = { see: ['Kneel, sinner.', 'The god is not dead. Only resting.'], atk: ['Absolvo te.'] };
SPEECH.reliquary_maw = { see: ['FEED THE RELIQUARY.', '*the lid creaks open*'] };
SPEECH.blood_seraph = { see: ['I see you through the blindfold.', 'Judgment.'], atk: ['FALL.'] };
SPEECH.ink_wisp = { see: ['Blot!', 'You are a typo.'] };
SPEECH.frost_librarian = { see: ['SHHHH.', 'This is a LIBRARY.', 'Overdue. Very overdue.'], atk: ['Silence!'] };
SPEECH.living_tome = { see: ['Read me! READ ME!', '*flap flap flap*'] };
SPEECH.ice_scribe = { see: ['...noted.', 'Your death, in triplicate.'] };
SPEECH.emily_chick = { see: ['Mama!', 'peep!'], hurt: ['PEEP!'], die: ['...peep.'] };
SPEECH.coin_imp = { see: ['Mine! All mine!', 'Catch me if you can!'], hurt: ['My gold!', 'Nooo, my coins!'], die: ['...tell my mother I was rich.'] };

// rosters: every dungeon lives on its own monsters now
DUNGEONS.chapel.mobs = ['drowned_acolyte', 'barnacle_knight', 'bell_wraith', 'pew_mimic'];
DUNGEONS.chapel.elites = ['barnacle_knight', 'bell_wraith'];
DUNGEONS.forge.mobs = ['bellows_bound', 'mold_wrought', 'slag_imp', 'quench_wraith', 'slag_imp'];
DUNGEONS.forge.elites = ['anvil_golem'];
DUNGEONS.heart.mobs = ['vein_crawler', 'gilded_cardinal', 'blood_seraph', 'reliquary_maw', 'vein_crawler'];
DUNGEONS.heart.elites = ['reliquary_maw', 'gilded_cardinal'];
DUNGEONS.scriptorium = { name: 'The Frozen Scriptorium', floor: 'runefloor', wall: 'forgewall', hazard: 'ice', rooms: 10, portal: 'scriptorium', style: 'scriptorium',
  hazardFx: { kind: 'zones', name: 'falling icicles', every: 3.6, n: 4, r: 1.3, delay: 1.0, dmg: 70, spread: 4.5, stagger: 0.12, shards: 6, proj: 'iceneedle', colors: ['#cfffff', '#3befff'] },
  chestLoot: [{ slot: 'weapon', tiers: [6, 9], p: 0.8 }, { slot: 'armor', tiers: [6, 9], p: 0.8 }, { slot: 'ability', tiers: [3, 4], p: 0.5 },
    { stat: true, p: 0.8 }, { id: 'pot_mp', p: 1 }, { id: 'the_turning_verse', p: 0.04 }, { id: 'starless_band', p: 0.04 }],
  mobs: ['ink_wisp', 'frost_librarian', 'living_tome', 'ice_scribe', 'ink_wisp'], elites: ['frost_librarian', 'ice_scribe'],
  boss: 'the_archivist', mobHp: 1.4 };

// ================================================================ the dungeon bosses, rebuilt as real fights
// new move keys: sweep {n, speed, dur, dmg, len} rotating lasers · pull {force, dur} the undertow · arena {r0, r1, dur, dmg} a closing circle
//                clones {n} mirror copies · flood {ring} the room's edges sink · shield {count, id, corners} (now can stand in the corners)
const AB = DUNGEON_BOSSES.drowned_abbot;
AB.hp = 16000;
AB.phases = [
  { at: 1, name: 'The sermon begins.', cycle: ['censer', 'undertow', 'crozier', 'baptism'] },
  { at: 0.72, name: 'THE WATER RISES.', open: 'flood', cycle: ['procession', 'glass', 'undertow', 'baptism', 'crozier'] },
  { at: 0.45, name: 'Ring the bells for the drowned!', open: 'bells', cycle: ['vespers', 'crozier', 'baptism', 'glass'] },
  { at: 0.18, name: 'MASS FOR THE DROWNED.', open: 'tidelight', cycle: ['tidelight', 'flood_last', 'vespers', 'undertow', 'deluge_abbot'] },
];
Object.assign(AB.moves, {
  undertow: { tell: 0.6, pull: { force: 2.6, dur: 2.2 }, spiral: { proj: 'bubble', arms: 4, every: 0.14, turn: 0.3, speed: 3.5, dmg: 34, range: 7, dur: 2.2 }, recover: 0.6 },
  flood: { special: true, tell: 1.2, flood: { ring: 3 }, invuln: 1.2, fire: [{ pattern: 'radial', proj: 'tidebolt', count: 24, dmg: 40, speed: 4, range: 9 }], recover: 0.8 },
  flood_last: { special: true, tell: 1.0, flood: { ring: 5 }, fire: [{ pattern: 'radial', proj: 'bubble', count: 20, dmg: 36, speed: 3, range: 8 }], recover: 0.8 },
  bells: { special: true, tell: 1.0, shield: { count: 4, id: 'bell_totem', corners: true }, recover: 1.2 },
  tidelight: { special: true, tell: 1.0, sweep: { n: 2, speed: 0.8, dur: 3.4, dmg: 60, len: 13 }, spiral: { proj: 'bellpearl', arms: 3, every: 0.16, turn: 0.4, speed: 3.5, dmg: 36, range: 8, dur: 3.4 }, recover: 0.8 },
  deluge_abbot: { special: true, tell: 0.9, zones: { n: 9, r: 1.7, delay: 1.0, dmg: 60, spread: 6, stagger: 0.08, shards: 6, proj: 'bubble', colors: ['#3c82ae', '#ff8fbf'] }, recover: 0.6 },
});
const FH = DUNGEON_BOSSES.fallen_heart;
FH.hp = 100000;
FH.phases = [
  { at: 1, name: 'It still beats.', cycle: ['beat', 'arteries', 'veins', 'beat'] },
  { at: 0.75, name: 'The arteries open.', open: 'aorta', cycle: ['aorta', 'saints', 'veins', 'systole', 'pulse'] },
  { at: 0.5, name: 'It remembers being a god.', open: 'diastole', cycle: ['cage', 'diastole', 'choir', 'aorta', 'veins'] },
  { at: 0.25, name: 'THE LAST BEAT.', open: 'lastbeat', cycle: ['cataclysm', 'aorta', 'diastole', 'systole', 'cataclysm'] },
];
Object.assign(FH.moves, {
  aorta: { special: true, tell: 0.9, sweep: { n: 3, speed: 0.7, dur: 3.6, dmg: 80, len: 14 }, fire: [{ pattern: 'radial', proj: 'gaze', count: 16, dmg: 70, speed: 3.5, range: 9 }], recover: 0.7 },
  diastole: { special: true, tell: 0.8, pull: { force: 3.2, dur: 2 }, fire: [0, 0.6, 1.2].map((delay, k) => ({ delay, pattern: 'radial', proj: 'organblast', count: 22, turn: k * 0.15, dmg: 70, speed: 4.5, range: 10 })), recover: 0.7 },
  lastbeat: { special: true, tell: 1.4, arena: { r0: 13, r1: 6, dur: 30, dmg: 120 }, invuln: 1.4, fire: [{ pattern: 'radial', proj: 'gaze', count: 36, dmg: 80, speed: 4, range: 12 }], recover: 0.8 },
});
// The Archivist: the Frozen Scriptorium's master
DUNGEON_BOSSES.the_archivist = {
  name: 'The Archivist', biome: 'scriptorium', hp: 34000, def: 24, xp: 9000, r: 1.6, speed: 0.6, keep: 6, summon: 'living_tome',
  phases: [
    { at: 1, name: 'The catalogue opens.', cycle: ['tomes', 'index', 'shelving', 'frostnote', 'index'] },
    { at: 0.66, name: 'ERRATA.', open: 'echoes', cycle: ['redact', 'index', 'echoes_blink', 'frostnote', 'tomes'] },
    { at: 0.33, name: 'THE FINAL CHAPTER.', open: 'blizzard', cycle: ['redact_all', 'blizzard', 'margin', 'index', 'redact_all', 'summon'] },
  ],
  moves: {
    tomes: { tell: 0.6, fire: [{ pattern: 'orbit', proj: 'page', count: 12, r: 2.2, spin: 1.4, dmg: 50, speed: 5.5, range: 9 }], recover: 0.6 },
    index: { tell: 0.5, stream: { proj: 'page', every: 0.09, speed: 10, dmg: 55, range: 11, dur: 1.6, wobble: 0.25 }, recover: 0.6 },
    shelving: { tell: 0.7, fire: [{ pattern: 'wall', proj: 'iceneedle', count: 11, dmg: 55, speed: 4, range: 11 }, { delay: 0.6, pattern: 'wall', proj: 'iceneedle', count: 11, dmg: 55, speed: 4, range: 11 }], recover: 0.7 },
    frostnote: { tell: 0.7, fire: [{ pattern: 'cage', proj: 'snowflake', count: 14, r: 3.6, dmg: 60, speed: 3.4, range: 5 }], zones: { n: 3, r: 1.5, delay: 1, dmg: 60, spread: 3, stagger: 0.15 }, recover: 0.6 },
    echoes: { special: true, tell: 1.0, clones: { n: 2 }, invuln: 1.0, recover: 0.8 },
    echoes_blink: { special: true, tell: 0.5, blink: { r: 6, colors: ['#cfffff', '#3befff', '#101828'] }, fire: [{ pattern: 'radial', proj: 'page', count: 20, dmg: 50, speed: 4.5, range: 9 }], recover: 0.6 },
    redact: { special: true, tell: 0.9, sweep: { n: 2, speed: 0.9, dur: 3.2, dmg: 70, len: 13 }, recover: 0.6 },
    redact_all: { special: true, tell: 1.0, sweep: { n: 4, speed: 0.55, dur: 3.6, dmg: 70, len: 13 }, fire: [{ pattern: 'cross', proj: 'snowflake', count: 8, dmg: 55, speed: 4, range: 9 }], recover: 0.7 },
    blizzard: { special: true, tell: 1.0, pull: { force: 2.2, dur: 2.5 }, zones: { n: 12, r: 1.5, delay: 1.1, dmg: 70, spread: 8, stagger: 0.07, shards: 6, proj: 'iceneedle', colors: ['#cfffff', '#3befff'] }, recover: 0.7 },
    margin: { special: true, tell: 0.8, gapring: { count: 40, gap: 0.75, speed: 4, dmg: 70, proj: 'page', waves: 4, shift: 0.5 }, recover: 0.8 },
    summon: { special: true, tell: 0.5, summon: 3, recover: 0.5 },
  },
  loot: [{ slot: 'weapon', tiers: [8, 10], p: 1 }, { slot: 'armor', tiers: [8, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'the_turning_verse', p: 0.15 }, { id: 'orrery_seal', p: 0.12 }, { id: 'starless_band', p: 0.15 },
    { id: 'the_eleventh_hour', p: 0.1 }, { id: 'heaven_wire', p: 0.1 }, ...MYTHIC(0.01)],
};
scaleDmg(DUNGEON_BOSSES.the_archivist.moves, 0.6);
for (const k of ['undertow', 'flood', 'flood_last', 'tidelight', 'deluge_abbot']) scaleDmg(AB.moves[k], 0.9);
for (const k of ['aorta', 'diastole', 'lastbeat']) scaleDmg(FH.moves[k], 0.7);

// realm bosses each pick up one signature mechanic too
REALM_BOSSES.brine_cathedral.moves.undertow = { tell: 0.6, pull: { force: 2.2, dur: 2 }, spiral: { proj: 'bubble', arms: 3, every: 0.14, turn: 0.3, speed: 3.5, dmg: 28, range: 7, dur: 2 }, recover: 0.6 };
REALM_BOSSES.brine_cathedral.phases[1].cycle.push('undertow');
REALM_BOSSES.wick_mother.moves.candleward = { special: true, tell: 1.0, arena: { r0: 11, r1: 6, dur: 20, dmg: 60 }, fire: [{ pattern: 'radial', proj: 'candleflame', count: 24, dmg: 45, speed: 4, range: 9 }], recover: 0.8 };
REALM_BOSSES.wick_mother.phases[2].open = 'candleward';
REALM_BOSSES.orrery_of_winter.moves.ringlight = { special: true, tell: 0.9, sweep: { n: 3, speed: 0.75, dur: 3.2, dmg: 50, len: 12 }, recover: 0.7 };
REALM_BOSSES.orrery_of_winter.phases[1].cycle.push('ringlight');
REALM_BOSSES.orrery_of_winter.phases[2].cycle.push('ringlight');
REALM_BOSSES.penitent_colossus.moves.gravity = { special: true, tell: 0.9, pull: { force: 3, dur: 2.2 }, fire: [0, 0.5, 1].map((delay, k) => ({ delay, pattern: 'radial', proj: 'quake', count: 18, turn: k * 0.2, dmg: 75, speed: 3.8, range: 9 })), recover: 0.8 };
REALM_BOSSES.penitent_colossus.phases[2].cycle.push('gravity');

// portals: Runeholt now opens the Frozen Scriptorium
export const PORTAL_EXTRA = [];                                  // later dungeons add their own sources here
export function portalDrop2(D, id) {
  for (const f of PORTAL_EXTRA) { const got = f(D, id); if (got) return got; }
  if (id === 'orrery_of_winter') return ['scriptorium', 1];
  if (id === 'wick_mother') return ['crypt', 1];
  if (id === 'the_fallen_star') return ['ember', 1];
  if (D.biome === 'dunes' || D.biome === 'thornwood') return ['crypt', D.children ? 0.05 : 0.012];
  if (D.biome === 'steppe') return ['ember', D.children ? 0.05 : 0.015];
  if (D.biome === 'godfall' && D.children && Math.random() < 0.3) return ['ember', 0.04];
  if (D.biome === 'runeholt') return ['scriptorium', D.children ? 0.06 : 0.018];
  return portalDrop(D, id);
}

// ================================================================ EMILY, THE YAPPER
// A very large emperor penguin who waddled out of the Runeholt snow and has not stopped talking since.
// She turns up as a Runeholt world event (and /boss emily_the_yapper). say: she yaps while doing it.
ENEMIES.emily_chick = { name: 'Emily\'s Chick', biome: 'runeholt', hp: 260, def: 4, speed: 2.2, xp: 10, r: 0.4, ai: 'hop', keep: 1.5, aggro: 10, contact: 30,
  attacks: [{ pattern: 'aimed', proj: 'snowball', count: 1, dmg: 28, speed: 6, range: 6, cd: 2.2, tell: 300 }], loot: [{ id: 'pot_hp', p: 0.05 }] };
REALM_BOSSES.emily_the_yapper = {
  name: 'Emily, the Yapper', biome: 'runeholt', hp: 20000, def: 14, xp: 3600, r: 1.5, speed: 0.8, keep: 5, event: true,
  summon: 'emily_chick',
  phases: [
    { at: 1, cycle: ['snowballs', 'yap', 'slide', 'lobfish'] },
    { at: 0.66, name: 'Emily has a LOT to say.', cycle: ['yapring', 'snowballs', 'chicks', 'slide', 'iceslide', 'yap'] },
    { at: 0.33, name: 'EMILY WILL NOT BE INTERRUPTED.', open: 'monologue', cycle: ['blizzard', 'yapring', 'slide', 'iceslide', 'monologue', 'chicks'] },
  ],
  moves: {
    snowballs: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'snowball', count: 5, arc: 0.6, waves: 3, gap: 0.18, dmg: 50, speed: 7, range: 8 }], recover: 0.6 },
    yap: { tell: 0.5, say: true, fire: [{ pattern: 'radial', proj: 'yap', count: 16, dmg: 45, speed: 3.5, range: 8, mv: { wave: { amp: 1.2, freq: 6 } } }], recover: 0.7 },
    lobfish: { tell: 0.6, fire: [{ pattern: 'aimed', proj: 'fishy', count: 5, arc: 1.2, dmg: 55, speed: 5, range: 8, mv: { lob: { n: 5, h: 30 } } }], recover: 0.7 },
    slide: { special: true, tell: 0.7, dash: { speed: 10, dur: 0.9, dmg: 70, trail: { proj: 'snowball', dmg: 35, speed: 2.5, range: 4, every: 0.08 } }, recover: 0.7 },
    yapring: { special: true, tell: 0.7, say: true, gapring: { count: 30, gap: 0.9, speed: 4, dmg: 45, proj: 'yap', waves: 2 }, recover: 0.8 },
    chicks: { tell: 0.6, summon: 3, fire: [{ pattern: 'radial', proj: 'snowball', count: 12, dmg: 40, speed: 4, range: 7 }], recover: 0.7 },
    iceslide: { tell: 0.5, zones: { n: 6, r: 1.5, delay: 1.0, dmg: 60, spread: 4.5, stagger: 0.1, shards: 6, proj: 'snowball', colors: ['#a8e2ff', '#ffffff'] }, recover: 0.5 },
    blizzard: { special: true, tell: 0.8, pull: { force: 2, dur: 2.2 }, spiral: { proj: 'snowball', arms: 3, every: 0.1, turn: 0.25, speed: 4.5, dmg: 45, range: 9, dur: 2.2 }, recover: 0.7 },
    monologue: { tell: 0.8, say: true, sweep: { n: 2, speed: 0.8, dur: 3, dmg: 55, len: 11 }, fire: [{ pattern: 'radial', proj: 'yap', count: 12, dmg: 45, speed: 3, range: 8 }], recover: 0.8 },
  },
  loot: [...BL([6, 8], [6, 9], [3, 4], [3, 4], 2, [{ id: 'emilys_scarf', p: 0.15 }, { id: 'the_squall', p: 0.08 }, { id: 'the_cuckoo', p: 0.08 },
    { id: 'the_feint', p: 0.08 }, { id: 'the_sea_wolf', p: 0.06 }], 0.005)],
};
// the other new relics find homes in the existing loot tables
REALM_BOSSES.orrery_of_winter.loot.push({ id: 'the_hourglass_of_sand', p: 0.08 }, { id: 'the_tempest_cloak', p: 0.08 });
REALM_BOSSES.wick_mother.loot.push({ id: 'the_bone_lantern', p: 0.08 }, { id: 'the_lightning_rod', p: 0.08 });
REALM_BOSSES.brine_cathedral.loot.push({ id: 'cracked_looking_glass', p: 0.08 }, { id: 'the_sea_wolf', p: 0.06 });
REALM_BOSSES.penitent_colossus.loot.push({ id: 'the_gearmail', p: 0.08 }, { id: 'the_mourners_veil', p: 0.08 });
DUNGEON_BOSSES.the_archivist.loot.push({ id: 'the_hourglass_of_sand', p: 0.08 }, { id: 'the_feint', p: 0.08 });
DUNGEON_BOSSES.fallen_heart.loot.push({ id: 'the_mourners_veil', p: 0.08 }, { id: 'the_tempest_cloak', p: 0.08 });
BOSS.loot.push({ id: 'the_gearmail', p: 0.08 }, { id: 'the_lightning_rod', p: 0.08 });

// ================================================================ readability pass: fewer bullets, more room to dodge
// Volleys are thinned, waves shortened and cooldowns lengthened for every monster; boss scripts are thinned the same way.
for (const D of Object.values(ENEMIES)) {
  D.attacks = D.attacks.map((a) => {
    const o = { ...a, cd: a.cd * 1.3 };
    const single = o.pattern === 'aimed' || o.pattern === 'burst' || o.pattern === 'shotgun' || o.pattern === 'wall';
    if (o.count) o.count = single ? Math.max(1, Math.round(o.count * 0.5)) : Math.max(4, Math.round(o.count * 0.55));
    if (o.waves) o.waves = Math.max(1, Math.ceil(o.waves / 2));
    if (o.mv && o.mv.lob) o.mv = { ...o.mv, lob: { ...o.mv.lob, n: Math.max(3, Math.round(o.mv.lob.n * 0.6)) } };
    if (o.mv && o.mv.split) o.mv = { ...o.mv, split: { ...o.mv.split, n: Math.max(2, o.mv.split.n - 1) } };
    return o;
  });
}
const thinMove = (M) => {
  for (const f of M.fire || []) { if (f.count) f.count = f.pattern === 'radial' ? Math.max(6, Math.round(f.count * 0.6)) : Math.max(1, Math.round(f.count * 0.6)); if (f.waves) f.waves = Math.max(1, Math.ceil(f.waves / 2)); }
  if (M.fire) M.fire = M.fire.filter((f, k) => k < 3);                // at most three volleys per move
  for (const S of [M.spiral, ...(M.spirals || [])].filter(Boolean)) { S.arms = Math.max(2, Math.round(S.arms * 0.6)); S.every *= 1.4; }
  if (M.spirals && M.spirals.length > 1) M.spirals = M.spirals.slice(0, 1);
  if (M.stream) M.stream.every *= 1.7;
  if (M.gapring) { M.gapring.count = Math.round(M.gapring.count * 0.65); M.gapring.waves = Math.min(2, M.gapring.waves || 1); M.gapring.gap = Math.max(M.gapring.gap, 0.95); }
  if (M.zones) { M.zones.n = Math.max(2, Math.round(M.zones.n * 0.6)); if (M.zones.shards) M.zones.shards = Math.max(3, Math.round(M.zones.shards * 0.5)); }
  if (M.dash && M.dash.trail) M.dash.trail.every *= 1.8;
  if (M.sweep) M.sweep.n = Math.min(M.sweep.n, 3);
};
for (const B of [...Object.values(REALM_BOSSES), ...Object.values(DUNGEON_BOSSES)]) for (const M of Object.values(B.moves)) thinMove(M);
for (const H of Object.values(DUNGEONS)) if (H.hazardFx) { if (H.hazardFx.n) H.hazardFx.n = Math.max(2, H.hazardFx.n - 1); if (H.hazardFx.shards) H.hazardFx.shards = Math.max(3, Math.round(H.hazardFx.shards * 0.5)); H.hazardFx.every *= 1.4; }

// only a few monsters teleport or burrow now (and they warn you first: see game.moveEnemy)
const KEEP_BLINK = new Set(['frost_wraith', 'quench_wraith', 'bell_wraith']), KEEP_BURROW = new Set(['reef_eel', 'vein_crawler']);
const CALM = { salt_widow: 'kite', antlered_hush: 'drift', salt_matriarch: 'kite', wheel_abbot: 'kite', elder_hush: 'drift', rime_herald: 'kite',
  cairn_crawler: 'charge', grave_leech: 'shamble', leech_prime: 'shamble' };
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.ai === 'blink' && !KEEP_BLINK.has(id)) D.ai = CALM[id] || 'kite';
  if (D.ai === 'burrow' && !KEEP_BURROW.has(id)) D.ai = CALM[id] || 'shamble';
}
delete SPEECH.training_dummy; delete SPEECH.armored_dummy;

// ---- RotMG pace: monsters move briskly (the player runs 3.6-8.6 tiles/s); movement itself is eased in game.moveEnemy
for (const [id, D] of Object.entries(ENEMIES)) {
  if (!D.speed || D.dummy) continue;
  D.speed = id === 'coin_imp' ? 4.4 : Math.min(5.5, Math.max(1.4, D.speed * 1.7));
}
for (const B of [...Object.values(REALM_BOSSES), ...Object.values(DUNGEON_BOSSES)]) if (B.speed) B.speed = Math.min(2.2, B.speed * 1.4);

// ---- class set pieces: every boss guards a few, from several classes, so each hunt can complete someone's set
{
  const pieces = Object.values(SET_PIECES).flat();
  const hosts = [REALM_BOSSES.brine_cathedral, REALM_BOSSES.wick_mother, REALM_BOSSES.orrery_of_winter, REALM_BOSSES.penitent_colossus,
    REALM_BOSSES.emily_the_yapper, DUNGEON_BOSSES.drowned_abbot, DUNGEON_BOSSES.the_archivist, DUNGEON_BOSSES.fallen_heart, BOSS];
  pieces.forEach((id, k) => { hosts[k % hosts.length].loot.push({ id, p: 0.06 }); hosts[(k + 4) % hosts.length].loot.push({ id, p: 0.04 }); });
}

// ================================================================ THE FINAL BOSS: the Unstruck God, on his throne
// Five phases that escalate through every trick the realm has taught you. (Admins: /portal throne, /tp throne, /boss unstruck_god)
DUNGEONS.throne = { name: 'The Throne of the Unstruck God', floor: 'marble', wall: 'ribwall', hazard: 'lava', rooms: 3, portal: 'heart', style: 'heart',
  bossW: 43, bossH: 35,
  hazardFx: { kind: 'zones', name: 'falling gold', every: 4.5, n: 4, r: 1.6, delay: 1.1, dmg: 110, spread: 5, stagger: 0.08, shards: 6, proj: 'goldshard', colors: ['#ffd650', '#ffffff'] },
  chestLoot: [{ slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [10, 11], p: 1 }, { slot: 'ability', tiers: [5, 5], p: 0.8 },
    { slot: 'ring', tiers: [5, 5], p: 0.8 }, { stat: true, p: 1 }, { stat: true, p: 1 }],
  mobs: ['hollow_thane', 'gilded_cardinal', 'blood_seraph', 'cherub_husk', 'gilded_lancer'],
  elites: ['hollow_jarl', 'seraph_husk', 'cathedral_engine'], boss: 'the_unstruck_god', mobHp: 2.0 };
DUNGEON_BOSSES.the_unstruck_god = {
  name: 'The Unstruck God', biome: 'throne', sheet: 'godking', hp: 180000, def: 34, xp: 20000, r: 1.9, speed: 0.7, keep: 6, summon: 'cherub_husk',
  phases: [
    { at: 1, name: 'I WAS NEVER STRUCK.', cycle: ['crown', 'judgment', 'solar', 'charge', 'crown'] },
    { at: 0.8, name: 'KNEEL BEFORE YOUR GOD.', open: 'court', cycle: ['verdict', 'crown', 'halo_of_ruin', 'judgment', 'gaze'] },
    { at: 0.6, name: 'THE ANVIL OPENS FOR ME.', open: 'forgefall', cycle: ['gravity', 'charge', 'judgment', 'gaze', 'solar'] },
    { at: 0.35, name: 'I AM THE REALM.', open: 'echoes', cycle: ['blinkstrike', 'verdict', 'halo_of_ruin', 'summon', 'gravity'] },
    { at: 0.12, name: 'THEN STRIKE ME.', open: 'last_stand', cycle: ['cataclysm', 'blinkstrike', 'halo_of_ruin', 'cataclysm', 'gaze'] },
  ],
  moves: {
    crown: { tell: 0.6, fire: [{ pattern: 'radial', proj: 'goldshard', count: 16, dmg: 95, speed: 4.5, range: 10 }, { delay: 0.25, pattern: 'aimed', proj: 'kintsugi', count: 3, arc: 0.35, dmg: 110, speed: 9, range: 10 }], recover: 0.6 },
    judgment: { tell: 0.6, zones: { n: 6, r: 1.8, delay: 1.1, dmg: 130, spread: 6, stagger: 0.08, shards: 5, proj: 'goldshard', colors: ['#ffd650', '#ffffff'] }, recover: 0.5 },
    solar: { tell: 0.7, spiral: { proj: 'starbeam', arms: 3, every: 0.13, turn: 0.22, speed: 4.5, dmg: 95, range: 10, dur: 2.6 }, recover: 0.6 },
    charge: { tell: 0.9, dash: { speed: 10, dur: 0.9, dmg: 180, slam: { n: 5, r: 1.7, delay: 0.35, dmg: 130, spread: 2.4, shards: 6, proj: 'quake' } }, recover: 0.8 },
    court: { special: true, tell: 1.0, shield: { count: 4, id: 'hollow_thane', corners: true }, fire: [{ pattern: 'radial', proj: 'goldshard', count: 20, dmg: 90, speed: 4, range: 9 }], recover: 1.0 },
    verdict: { special: true, tell: 0.9, sweep: { n: 3, speed: 0.7, dur: 3.4, dmg: 110, len: 14 }, recover: 0.6 },
    halo_of_ruin: { special: true, tell: 0.8, gapring: { count: 30, gap: 0.95, speed: 4.2, dmg: 110, proj: 'gaze', waves: 2, shift: 0.5 }, recover: 0.7 },
    forgefall: { special: true, tell: 1.0, arena: { r0: 16, r1: 8, dur: 24, dmg: 120 }, fire: [{ pattern: 'radial', proj: 'quake', count: 18, dmg: 100, speed: 4, range: 10 }], recover: 0.8 },
    gravity: { special: true, tell: 0.9, pull: { force: 2.6, dur: 2.4 }, spiral: { proj: 'kintsugi', arms: 3, every: 0.12, turn: 0.25, speed: 4, dmg: 100, range: 9, dur: 2.4 }, recover: 0.7 },
    gaze: { tell: 0.6, stream: { proj: 'gaze', every: 0.12, speed: 11, dmg: 120, range: 12, dur: 1.8, wobble: 0.3 }, recover: 0.6 },
    echoes: { special: true, tell: 1.0, clones: { n: 2 }, invuln: 1.0, recover: 0.8 },
    blinkstrike: { tell: 0.5, blink: { r: 6, colors: ['#fff0a0', '#f2c14e', '#3a1a6a'] }, fire: [{ pattern: 'radial', proj: 'goldshard', count: 18, dmg: 100, speed: 4.5, range: 9 }], recover: 0.6 },
    summon: { special: true, tell: 0.6, summon: 3, recover: 0.5 },
    cataclysm: { special: true, tell: 1.1, spirals: [{ proj: 'starbeam', arms: 3, every: 0.12, turn: 0.2, speed: 4.5, dmg: 110, range: 10, dur: 3 }], sweep: { n: 2, speed: 0.8, dur: 3, dmg: 120, len: 14 }, recover: 0.9 },
    last_stand: { special: true, tell: 1.2, invuln: 2.0, gapring: { count: 36, gap: 0.95, speed: 4, dmg: 120, proj: 'kintsugi', waves: 2, shift: 0.6 }, recover: 0.8 },
  },
  loot: [{ slot: 'weapon', tiers: [10, 10], p: 1 }, { slot: 'armor', tiers: [11, 11], p: 1 }, { slot: 'ability', tiers: [5, 5], p: 1 }, { slot: 'ring', tiers: [5, 5], p: 1 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 1 }, { stat: true, p: 0.5 }, { id: 'crown_of_the_unstruck', p: 0.12 },
    ...Object.values(SET_PIECES).flat().map((id) => ({ id, p: 0.04 })), ...MYTHIC(0.04)],
};

// ================================================================ BOSS REWORK: every boss is its own fight
// Each special mechanic belongs to exactly one boss; the rest of a boss's kit is its own projectiles and shot behaviours.
//   Brine Cathedral   - the scuttling charge (dash) and hiding in its shell (invuln)
//   Wick-Mother       - the closing ring of candle-fire (arena)
//   Orrery of Winter  - circling you (orbit) and its rotating ring-lights (sweep)
//   Penitent Colossus - its guard of thanes (shield) and telegraphed ground slams (zones)
//   Emily             - the bouncing belly-slide (bounce), lobbed fish (lob) and speech-bubble rings (gapring)
//   Drowned Abbot     - the rising water (flood) and the undertow (pull)
//   Fallen Heart      - artery streams (stream) and veins that fire in from the edges (edgefire)
//   The Archivist     - mirror copies (clones) and blinking (blink)
//   The Unstruck God  - meteors, the tether and orbiting blades
//   The Fallen Star   - star mines and burning constellations
const rework = (B, phases, moves) => { B.moves = moves; B.phases = phases; };
rework(REALM_BOSSES.brine_cathedral, [
  { at: 1, cycle: ['bell', 'claw', 'scuttle', 'claw'] },
  { at: 0.66, name: 'The bell tolls for the drowned.', cycle: ['hide', 'scuttle', 'tidecall', 'bell'] },
  { at: 0.33, name: 'The Cathedral floods!', cycle: ['deluge', 'scuttle', 'tidecall', 'hide', 'claw'] },
], {
  bell: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'bellpearl', count: 14, dmg: 34, speed: 4.5, range: 9 }, { delay: 0.3, pattern: 'radial', proj: 'bellpearl', count: 14, turn: 0.22, dmg: 34, speed: 3.5, range: 9 }], recover: 0.8 },
  claw: { tell: 0.35, fire: [{ pattern: 'aimed', proj: 'clawsnap', count: 3, arc: 0.4, waves: 2, gap: 0.15, dmg: 40, speed: 9, range: 8 }], recover: 0.6 },
  scuttle: { tell: 0.5, dash: { speed: 9, dur: 0.8, dmg: 55, trail: { proj: 'bubble', dmg: 28, speed: 2.5, range: 5, every: 0.14 } }, recover: 0.6 },
  hide: { special: true, tell: 0.5, invuln: 2.4, summon: 3, spiral: { proj: 'bubble', arms: 3, every: 0.16, turn: 0.25, speed: 4.5, dmg: 30, range: 8, dur: 2.4 }, recover: 0.6 },
  tidecall: { tell: 0.7, fire: [{ pattern: 'wall', proj: 'tidebolt', count: 9, dmg: 36, speed: 4, range: 10 }, { delay: 0.5, pattern: 'cage', proj: 'bubble', count: 10, r: 3, dmg: 30, speed: 3, range: 4 }], recover: 0.7 },
  deluge: { special: true, tell: 0.8, spirals: [{ proj: 'bellpearl', arms: 2, every: 0.14, turn: 0.21, speed: 5, dmg: 36, range: 9, dur: 3 }, { proj: 'bubble', arms: 2, every: 0.14, turn: -0.21, speed: 4, dmg: 30, range: 9, dur: 3 }], recover: 0.8 },
});
rework(REALM_BOSSES.wick_mother, [
  { at: 1, cycle: ['flare', 'drip', 'brood', 'drip'] },
  { at: 0.66, name: 'The wick catches.', open: 'candleward', cycle: ['pyre', 'flare', 'brood', 'drip'] },
  { at: 0.33, name: 'She burns down to the bone!', open: 'candleward', cycle: ['conflagration', 'drip', 'flare', 'brood'] },
], {
  flare: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'corpseflame', count: 16, dmg: 52, speed: 3.6, range: 9, mv: { curve: 1.0, alt: true } }], recover: 0.9 },
  drip: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'tallowdrop', count: 5, arc: 1.0, waves: 2, gap: 0.35, dmg: 55, speed: 5, range: 9, mv: { brake: 0.5, re: 7 } }], recover: 0.7 },
  brood: { special: true, tell: 0.7, summon: 4, fire: [{ pattern: 'radial', proj: 'waxspark', count: 10, dmg: 45, speed: 5, range: 6 }], recover: 0.9 },
  pyre: { tell: 0.6, spiral: { proj: 'candleflame', arms: 3, every: 0.15, turn: 0.27, speed: 4.5, dmg: 52, range: 9, dur: 2.4 }, recover: 0.7 },
  candleward: { special: true, tell: 1.0, arena: { r0: 11, r1: 6, dur: 18, dmg: 60 }, fire: [{ pattern: 'radial', proj: 'candleflame', count: 16, dmg: 45, speed: 4, range: 9 }], recover: 0.8 },
  conflagration: { special: true, tell: 0.9, spirals: [{ proj: 'candleflame', arms: 3, every: 0.13, turn: 0.19, speed: 4.5, dmg: 55, range: 9, dur: 3 }], fire: [{ pattern: 'aimed', proj: 'tallow', count: 3, arc: 0.5, dmg: 60, speed: 5, range: 9 }], recover: 0.9 },
});
rework(REALM_BOSSES.orrery_of_winter, [
  { at: 1, cycle: ['revolve', 'shatter', 'align'] },
  { at: 0.66, name: 'The rings realign.', cycle: ['ringlight', 'revolve', 'align', 'shatter', 'summon'] },
  { at: 0.33, name: 'Absolute winter!', cycle: ['eclipse', 'revolve', 'ringlight', 'shatter', 'summon'] },
], {
  revolve: { tell: 0.6, orbit: { dur: 2.6, speed: 1.6, r: 6 }, spiral: { proj: 'snowflake', arms: 2, every: 0.14, turn: 0.3, speed: 5, dmg: 55, range: 9, dur: 2.6 }, recover: 0.6 },
  ringlight: { special: true, tell: 0.9, sweep: { n: 3, speed: 0.75, dur: 3.2, dmg: 60, len: 12 }, recover: 0.7 },
  shatter: { tell: 0.8, fire: [{ pattern: 'radial', proj: 'starbeam', count: 12, dmg: 58, speed: 5, range: 9, mv: { split: { at: 0.5, n: 3 } } }], recover: 0.8 },
  align: { tell: 0.6, fire: [{ pattern: 'aimed', proj: 'rune', count: 5, arc: 0.5, waves: 3, gap: 0.2, dmg: 58, speed: 4, range: 11, mv: { accel: 14, max: 2.5 } }], recover: 0.7 },
  summon: { special: true, tell: 0.5, summon: 2, recover: 0.5 },
  eclipse: { special: true, tell: 1.0, sweep: { n: 2, speed: 0.9, dur: 3, dmg: 60, len: 12 }, spiral: { proj: 'snowflake', arms: 3, every: 0.12, turn: 0.17, speed: 5, dmg: 55, range: 9, dur: 3 }, recover: 0.9 },
});
rework(REALM_BOSSES.penitent_colossus, [
  { at: 1, cycle: ['gazebolts', 'seams', 'slam', 'quakefield'] },
  { at: 0.66, name: 'The Colossus remembers its crimes.', cycle: ['slam', 'quakefield', 'seams', 'summon', 'gazebolts'] },
  { at: 0.33, name: 'PENANCE.', open: 'vigil', cycle: ['penance', 'quakefield', 'slam', 'seams', 'vigil'] },
], {
  gazebolts: { tell: 0.7, fire: [{ pattern: 'aimed', proj: 'gaze', count: 3, arc: 0.3, waves: 3, gap: 0.25, dmg: 85, speed: 9, range: 11 }], recover: 0.7 },
  seams: { tell: 0.6, fire: [{ pattern: 'radial', proj: 'goldshard', count: 18, turn: 0.13, dmg: 80, speed: 5, range: 8 }, { delay: 0.15, pattern: 'aimed', proj: 'kintsugi', count: 4, arc: 0.5, dmg: 90, speed: 9, range: 9 }], recover: 0.8 },
  slam: { special: true, tell: 0.9, zones: { n: 7, r: 1.7, delay: 0.5, dmg: 110, spread: 2.6, shards: 6, proj: 'quake', at: 'self', colors: ['#f2c14e', '#ffffff'] }, recover: 0.9 },
  quakefield: { tell: 0.6, zones: { n: 6, r: 1.9, delay: 1.1, dmg: 105, spread: 5, stagger: 0.09, shards: 5, proj: 'goldshard', colors: ['#f2c14e', '#ff4a5a'] }, recover: 0.7 },
  vigil: { special: true, tell: 0.8, shield: { count: 4, id: 'hollow_thane' }, fire: [{ pattern: 'radial', proj: 'goldshard', count: 16, dmg: 75, speed: 4, range: 8 }], recover: 1.2 },
  penance: { special: true, tell: 1.1, fire: [0, 0.3, 0.6].map((delay, k) => ({ delay, pattern: 'radial', proj: 'quake', count: 14, turn: k * 0.17, dmg: 90, speed: 4 + k * 0.5, range: 8 })), recover: 1.0 },
  summon: { special: true, tell: 0.6, summon: 2, recover: 0.5 },
});
rework(REALM_BOSSES.emily_the_yapper, [
  { at: 1, cycle: ['snowballs', 'yap', 'slide', 'lobfish'] },
  { at: 0.66, name: 'Emily has a LOT to say.', cycle: ['yapring', 'snowballs', 'chicks', 'slide', 'lobfish', 'yap'] },
  { at: 0.33, name: 'EMILY WILL NOT BE INTERRUPTED.', open: 'monologue', cycle: ['yapring', 'slide', 'lobfish', 'monologue', 'chicks'] },
], {
  snowballs: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'snowball', count: 5, arc: 0.6, waves: 3, gap: 0.18, dmg: 50, speed: 7, range: 8 }], recover: 0.6 },
  yap: { tell: 0.5, say: true, fire: [{ pattern: 'radial', proj: 'yap', count: 14, dmg: 45, speed: 3.5, range: 8, mv: { wave: { amp: 1.2, freq: 6 } } }], recover: 0.7 },
  lobfish: { tell: 0.6, fire: [{ pattern: 'aimed', proj: 'fishy', count: 5, arc: 1.2, dmg: 55, speed: 5, range: 8, mv: { lob: { n: 5, h: 30 } } }], recover: 0.7 },
  slide: { special: true, tell: 0.7, bounce: { speed: 10, dur: 1.0, dmg: 70, bounces: 3, trail: { proj: 'snowball', dmg: 35, speed: 2.5, range: 4, every: 0.12 } }, recover: 0.7 },
  yapring: { special: true, tell: 0.7, say: true, gapring: { count: 28, gap: 0.95, speed: 4, dmg: 45, proj: 'yap', waves: 2 }, recover: 0.8 },
  chicks: { tell: 0.6, summon: 3, fire: [{ pattern: 'radial', proj: 'snowball', count: 12, dmg: 40, speed: 4, range: 7 }], recover: 0.7 },
  monologue: { special: true, tell: 0.8, say: true, spiral: { proj: 'yap', arms: 3, every: 0.16, turn: 0.3, speed: 3.5, dmg: 45, range: 9, dur: 3 }, recover: 0.8 },
});
{
  const AB0 = DUNGEON_BOSSES.drowned_abbot;
  rework(AB0, [
    { at: 1, name: 'The sermon begins.', cycle: ['censer', 'undertow', 'crozier', 'glass'] },
    { at: 0.66, name: 'THE WATER RISES.', open: 'flood', cycle: ['glass', 'undertow', 'censer', 'crozier', 'mass'] },
    { at: 0.33, name: 'MASS FOR THE DROWNED.', open: 'flood_last', cycle: ['undertow', 'baptism', 'glass', 'mass', 'baptism'] },
  ], {
    censer: { tell: 0.7, fire: [{ pattern: 'radial', proj: 'incense', count: 16, dmg: 42, speed: 3.6, range: 9, mv: { curve: 0.9, alt: true } }], recover: 0.8 },
    crozier: { tell: 0.8, fire: [0, 0.3].map((delay, k) => ({ delay, pattern: 'radial', proj: 'bellpearl', count: 16, turn: k * 0.16, dmg: 46, speed: 4.5 - k, range: 9 })), recover: 0.9 },
    glass: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'halofrag', count: 5, arc: 0.6, waves: 2, gap: 0.25, dmg: 46, speed: 8, range: 9 }], recover: 0.6 },
    undertow: { tell: 0.6, pull: { force: 2.6, dur: 2.2 }, spiral: { proj: 'bubble', arms: 3, every: 0.14, turn: 0.3, speed: 3.5, dmg: 36, range: 7, dur: 2.2 }, recover: 0.6 },
    flood: { special: true, tell: 1.2, flood: { ring: 3 }, invuln: 1.2, fire: [{ pattern: 'radial', proj: 'tidebolt', count: 20, dmg: 42, speed: 4, range: 9 }], recover: 0.8 },
    flood_last: { special: true, tell: 1.0, flood: { ring: 5 }, fire: [{ pattern: 'radial', proj: 'bubble', count: 18, dmg: 38, speed: 3, range: 8 }], recover: 0.8 },
    baptism: { special: true, tell: 0.9, pull: { force: 3.2, dur: 1.6 }, fire: [{ pattern: 'cage', proj: 'conchwave', count: 12, r: 3, dmg: 46, speed: 3, range: 4 }], recover: 0.7 },
    mass: { special: true, tell: 0.6, summon: 3, recover: 0.5 },
  });
}
rework(DUNGEON_BOSSES.fallen_heart, [
  { at: 1, name: 'It still beats.', cycle: ['beat', 'artery', 'veins', 'beat'] },
  { at: 0.75, name: 'The arteries open.', cycle: ['artery', 'saints', 'veins', 'systole', 'beat'] },
  { at: 0.5, name: 'It remembers being a god.', cycle: ['systole', 'veins', 'artery', 'saints', 'veins'] },
  { at: 0.25, name: 'THE LAST BEAT.', open: 'lastbeat', cycle: ['cataclysm', 'artery', 'veins', 'systole', 'cataclysm'] },
], {
  beat: { tell: 0.6, fire: [0, 0.35].map((delay, k) => ({ delay, pattern: 'radial', proj: 'bloodclot', count: 18, turn: k * 0.17, dmg: 95, speed: 4, range: 10 })), recover: 0.7 },
  artery: { tell: 0.6, stream: { proj: 'bloodclot', every: 0.11, speed: 10, dmg: 95, range: 12, dur: 2.0, wobble: 0.3 }, recover: 0.7 },
  veins: { special: true, tell: 0.8, edgefire: { n: 14, r: 13, dmg: 100, speed: 5, proj: 'kintsugi', waves: 2 }, recover: 0.8 },
  saints: { special: true, tell: 0.7, summon: 3, recover: 0.6 },
  systole: { tell: 0.7, fire: [{ pattern: 'radial', proj: 'kintsugi', count: 22, dmg: 95, speed: 4.5, range: 10 }, { delay: 0.3, pattern: 'cross', proj: 'requiem', count: 8, dmg: 100, speed: 4, range: 10 }], recover: 0.8 },
  lastbeat: { special: true, tell: 1.4, invuln: 1.4, edgefire: { n: 20, r: 13, dmg: 110, speed: 4.5, proj: 'gaze', waves: 3 }, recover: 0.8 },
  cataclysm: { special: true, tell: 1.1, stream: { proj: 'gaze', every: 0.12, speed: 10, dmg: 105, range: 12, dur: 2.4, wobble: 0.5 }, edgefire: { n: 12, r: 13, dmg: 100, speed: 4, proj: 'kintsugi' }, recover: 0.9 },
});
rework(DUNGEON_BOSSES.the_archivist, [
  { at: 1, name: 'The catalogue opens.', cycle: ['tomes', 'shelving', 'frostnote', 'echoes_blink'] },
  { at: 0.66, name: 'ERRATA.', open: 'echoes', cycle: ['margins', 'echoes_blink', 'tomes', 'frostnote'] },
  { at: 0.33, name: 'THE FINAL CHAPTER.', open: 'echoes', cycle: ['inkstorm', 'echoes_blink', 'margins', 'shelving', 'summon'] },
], {
  tomes: { tell: 0.6, fire: [{ pattern: 'orbit', proj: 'page', count: 10, r: 2.2, spin: 1.4, dmg: 50, speed: 5.5, range: 9 }], recover: 0.6 },
  shelving: { tell: 0.7, fire: [{ pattern: 'wall', proj: 'iceneedle', count: 10, dmg: 52, speed: 4, range: 11 }, { delay: 0.6, pattern: 'wall', proj: 'iceneedle', count: 10, dmg: 52, speed: 4, range: 11 }], recover: 0.7 },
  frostnote: { tell: 0.7, fire: [{ pattern: 'cage', proj: 'snowflake', count: 12, r: 3.6, dmg: 55, speed: 3.4, range: 5 }], recover: 0.6 },
  echoes: { special: true, tell: 1.0, clones: { n: 2 }, invuln: 1.0, recover: 0.8 },
  echoes_blink: { special: true, tell: 0.5, blink: { r: 6, colors: ['#cfffff', '#3befff', '#101828'] }, fire: [{ pattern: 'radial', proj: 'page', count: 18, dmg: 50, speed: 4.5, range: 9 }], recover: 0.6 },
  margins: { tell: 0.7, fire: [{ pattern: 'radial', proj: 'page', count: 20, dmg: 52, speed: 4, range: 10, mv: { curve: 1.2, alt: true } }], recover: 0.7 },
  inkstorm: { special: true, tell: 0.9, spiral: { proj: 'inkblot', arms: 3, every: 0.13, turn: 0.22, speed: 4, dmg: 55, range: 10, dur: 3 }, recover: 0.8 },
  summon: { special: true, tell: 0.5, summon: 3, recover: 0.5 },
});
rework(DUNGEON_BOSSES.the_unstruck_god, [
  { at: 1, name: 'I WAS NEVER STRUCK.', cycle: ['crown', 'judgment', 'solar', 'crown'] },
  { at: 0.8, name: 'KNEEL BEFORE YOUR GOD.', open: 'bind', cycle: ['judgment', 'halo', 'crown', 'solar'] },
  { at: 0.6, name: 'THE ANVIL OPENS FOR ME.', cycle: ['halo', 'judgment', 'bind', 'crown', 'court'] },
  { at: 0.35, name: 'I AM THE REALM.', open: 'halo', cycle: ['halo', 'bind', 'judgment', 'solar', 'court'] },
  { at: 0.12, name: 'THEN STRIKE ME.', open: 'last_stand', cycle: ['cataclysm', 'halo', 'judgment', 'bind'] },
], {
  crown: { tell: 0.6, fire: [{ pattern: 'radial', proj: 'goldshard', count: 16, dmg: 95, speed: 4.5, range: 10 }, { delay: 0.25, pattern: 'aimed', proj: 'kintsugi', count: 3, arc: 0.35, dmg: 110, speed: 9, range: 10 }], recover: 0.6 },
  judgment: { special: true, tell: 0.7, meteor: { n: 4, r: 2.2, delay: 1.3, stagger: 0.25, dmg: 160, spread: 5, burn: { dps: 60, t: 4 } }, recover: 0.6 },
  halo: { special: true, tell: 0.8, orbitals: { n: 6, r0: 2, r1: 9, dur: 4, dmg: 120, spin: 1.6, proj: 'halofrag' }, recover: 0.6 },
  bind: { special: true, tell: 1.0, tether: { r: 5, dur: 6, dmg: 90 }, spiral: { proj: 'goldshard', arms: 3, every: 0.15, turn: 0.24, speed: 4, dmg: 95, range: 9, dur: 3 }, recover: 0.7 },
  solar: { tell: 0.7, spiral: { proj: 'starbeam', arms: 3, every: 0.13, turn: 0.22, speed: 4.5, dmg: 95, range: 10, dur: 2.6 }, recover: 0.6 },
  court: { special: true, tell: 0.6, summon: 4, recover: 0.5 },
  cataclysm: { special: true, tell: 1.1, meteor: { n: 7, r: 2, delay: 1.2, stagger: 0.18, dmg: 160, spread: 7, burn: { dps: 70, t: 4 } }, orbitals: { n: 8, r0: 2, r1: 11, dur: 4, dmg: 120, spin: 1.3, proj: 'halofrag' }, recover: 0.9 },
  last_stand: { special: true, tell: 1.2, invuln: 2.0, orbitals: { n: 10, r0: 3, r1: 12, dur: 5, dmg: 130, spin: 1.1, proj: 'kintsugi' }, tether: { r: 4.5, dur: 8, dmg: 110 }, recover: 0.8 },
});

// ---- the Fallen Star: the falling-star world event's boss (see game.worldEvent)
REALM_BOSSES.the_fallen_star = {
  name: 'The Fallen Star', biome: 'godfall', hp: 60000, def: 20, xp: 8000, r: 1.5, speed: 0.9, keep: 5, event: true, summon: 'lens_moth',
  phases: [
    { at: 1, cycle: ['shards', 'mines', 'comet'] },
    { at: 0.6, name: 'The star burns brighter.', cycle: ['constellation', 'shards', 'mines', 'nova'] },
    { at: 0.25, name: 'SUPERNOVA.', open: 'nova', cycle: ['constellation', 'nova', 'mines', 'comet', 'constellation'] },
  ],
  moves: {
    shards: { tell: 0.6, fire: [{ pattern: 'radial', proj: 'star', count: 16, dmg: 85, speed: 3, range: 10, mv: { accel: 12, max: 2.4 } }], recover: 0.6 },
    mines: { special: true, tell: 0.6, mines: { n: 8, delay: 1.4, spread: 6, shards: 8, dmg: 80, proj: 'star' }, recover: 0.6 },
    comet: { tell: 0.5, fire: [{ pattern: 'aimed', proj: 'lensflare', count: 3, arc: 0.3, waves: 3, gap: 0.2, dmg: 95, speed: 10, range: 11 }], recover: 0.6 },
    constellation: { special: true, tell: 0.7, constellation: { n: 5, r: 4.5, delay: 1.0, dur: 2.4, dmg: 110 }, recover: 0.6 },
    nova: { special: true, tell: 1.0, fire: [0, 0.35].map((delay, k) => ({ delay, pattern: 'radial', proj: 'starbeam', count: 22, turn: k * 0.14, dmg: 90, speed: 4.5, range: 10 })), summon: 2, recover: 0.8 },
  },
  loot: [{ slot: 'weapon', tiers: [8, 10], p: 1 }, { slot: 'armor', tiers: [9, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { id: 'shard_of_the_first_star', p: 0.12 }, { id: 'starfall_knuckles', p: 0.04 }, ...MYTHIC(0.03)],
};

// ---- every boss gets tougher: 60% more Life, 30% more damage
for (const B of [...Object.values(REALM_BOSSES), ...Object.values(DUNGEON_BOSSES)]) {
  B.hp = Math.round(B.hp * 1.6);
  scaleDmg(B.moves, 1.3);
}
BOSS.hp = Math.round(BOSS.hp * 1.6);

// ================================================================ DUNGEON LAYOUTS: no two dungeons play alike
// layout: grid (cells across x down), loops (extra passages), secrets (hidden rooms behind cracked walls), room sizes and shapes.
// seals: what breaks the boss gate's seals - 'warden' (a brutal elite), 'lever' (find and pull it), 'puzzle' (the dungeon's puzzle room).
// puzzle: 'plates' (stand on every pressure plate before the hum dies) or 'runes' (read the stone, touch the runes in its order).
Object.assign(DUNGEONS.chapel, { rooms: 11, layout: { grid: [6, 3], loops: 1, secrets: 1, minW: 19, maxW: 29, minH: 13, maxH: 19, shapes: ['pillared', 'rect', 'cross'] },
  seals: ['lever', 'lever', 'puzzle'], puzzle: 'plates', wardens: ['anchor_titan', 'salt_matriarch'] });
Object.assign(DUNGEONS.forge, { rooms: 13, layout: { grid: [5, 5], loops: 2, secrets: 1, minW: 19, maxW: 31, minH: 17, maxH: 25, shapes: ['rect', 'rect', 'cross'] },
  seals: ['warden', 'warden', 'puzzle'], puzzle: 'plates', wardens: ['anvil_golem', 'glacier_headsman'] });
Object.assign(DUNGEONS.scriptorium, { rooms: 16, layout: { grid: [6, 5], loops: 3, secrets: 3, minW: 15, maxW: 25, minH: 13, maxH: 21, shapes: ['rect', 'pillared', 'cross'] },
  seals: ['puzzle', 'lever', 'warden'], puzzle: 'runes', wardens: ['wheel_abbot', 'saga_singer'] });
Object.assign(DUNGEONS.heart, { rooms: 16, layout: { grid: [5, 5], loops: 4, secrets: 2, minW: 19, maxW: 29, minH: 17, maxH: 25 },
  seals: ['warden', 'warden', 'warden', 'puzzle'], puzzle: 'runes', wardens: ['hollow_jarl', 'halo_glutton', 'broodmother', 'cathedral_engine'] });
Object.assign(DUNGEONS.throne, { rooms: 6, layout: { grid: [4, 3], cell: 52, loops: 1, secrets: 1, minW: 21, maxW: 31, minH: 17, maxH: 25, altar: false },
  seals: ['warden', 'warden'], wardens: ['fallen_choirmaster', 'hollow_jarl'] });

// ================================================================ THE NEW LANDS: the Saltglass Dunes, the Thornwood, the Crystal Steppe
// Each shares a ring (and so a difficulty) with an older land: the dunes with the shore, the Thornwood with Ashfen,
// the Steppe with Runeholt. Values here are final (they come after the readability and pace passes above).
const LD = L([0, 2], [0, 2], [0, 1], [0, 1], 0), LT = L([2, 4], [2, 4], [1, 2], [1, 2], 0.01), LS = L([4, 6], [4, 6], [2, 3], [2, 3], 0.03);
Object.assign(ENEMIES, {
  // ---- the Saltglass Dunes
  glass_scarab: { name: 'Glass Scarab', biome: 'dunes', hp: 110, def: 1, speed: 3.0, xp: 10, r: 0.45, ai: 'skitter', aggro: 9, contact: 14,
    attacks: [{ pattern: 'aimed', proj: 'shard', count: 2, arc: 0.3, dmg: 13, speed: 6, range: 6, cd: 2.2, tell: 300, mv: { accel: 10, max: 2 } }], loot: LD },
  dune_lurker: { name: 'Dune Lurker', biome: 'dunes', hp: 140, def: 1, speed: 2.6, xp: 12, r: 0.5, ai: 'burrow', aggro: 8, contact: 16,
    attacks: [{ pattern: 'radial', proj: 'saltcrystal', count: 6, dmg: 14, speed: 4, range: 6, cd: 2.8, tell: 500 }], loot: LD },
  salt_mummy: { name: 'Salt Mummy', biome: 'dunes', hp: 170, def: 2, speed: 2.2, xp: 13, r: 0.5, ai: 'shamble', aggro: 9,
    attacks: [{ pattern: 'aimed', proj: 'salt', count: 3, arc: 0.5, dmg: 15, speed: 5, range: 7, cd: 2.4, tell: 400, mv: { brake: 0.45, re: 8 } }], loot: LD },
  sand_skimmer: { name: 'Sand Skimmer', biome: 'dunes', hp: 90, def: 0, speed: 4.2, xp: 9, r: 0.4, ai: 'zigzag', aggro: 10, fly: true, contact: 12,
    attacks: [{ pattern: 'aimed', proj: 'ember', count: 1, dmg: 12, speed: 8, range: 6, cd: 1.6, tell: 200, mv: { curve: 1.4, alt: true } }], loot: LD },
  glass_sphinx: { name: 'The Glass Sphinx', biome: 'dunes', sheet: 'champions', hp: 800, def: 6, speed: 1.8, xp: 90, r: 0.75, ai: 'kite', keep: 5, aggro: 11,
    attacks: [{ pattern: 'radial', proj: 'lensflare', count: 10, turn: 0.3, waves: 2, gap: 0.3, dmg: 20, speed: 4, range: 8, cd: 3, tell: 600 }],
    children: ['glass_scarab', 'salt_mummy', 'dune_lurker'], cap: 6, every: 9, loot: L([1, 3], [1, 3], [0, 2], [0, 2], 0.02), lootLuck: 2 },
  mirage_caller: { name: 'Mirage Caller', biome: 'dunes', sheet: 'champions', hp: 700, def: 4, speed: 2.0, xp: 80, r: 0.75, ai: 'kite', keep: 6, aggro: 11,
    attacks: [{ pattern: 'aimed', proj: 'wisp', count: 3, arc: 0.6, waves: 2, gap: 0.2, dmg: 18, speed: 6, range: 8, cd: 2.4, tell: 450, mv: { wave: { amp: 1.6, freq: 7 } } }],
    children: ['glass_scarab', 'salt_mummy'], cap: 6, every: 9, loot: L([1, 3], [1, 3], [0, 2], [0, 2], 0.02), lootLuck: 2 },
  // ---- the Thornwood
  thorn_sprite: { name: 'Thorn Sprite', biome: 'thornwood', hp: 380, def: 4, speed: 3.6, xp: 30, r: 0.45, ai: 'swoop', aggro: 10, fly: true, contact: 28,
    attacks: [{ pattern: 'aimed', proj: 'thornseed', count: 2, arc: 0.4, dmg: 30, speed: 7, range: 7, cd: 2.0, tell: 300, mv: { curve: 1.8, alt: true } }], loot: LT },
  bramble_wolf: { name: 'Bramble Wolf', biome: 'thornwood', hp: 520, def: 6, speed: 3.4, xp: 38, r: 0.5, ai: 'flank', aggro: 10, contact: 36,
    attacks: [{ pattern: 'aimed', proj: 'splinter', count: 3, arc: 0.6, dmg: 32, speed: 7, range: 6, cd: 2.0, tell: 300 }], loot: LT },
  spore_puff: { name: 'Spore Puff', biome: 'thornwood', hp: 450, def: 3, speed: 1.6, xp: 34, r: 0.5, ai: 'drift', aggro: 9,
    attacks: [{ pattern: 'radial', proj: 'gasbubble', count: 8, dmg: 30, speed: 3, range: 6, cd: 3, tell: 600, mv: { brake: 0.5, re: 6 } }], loot: LT },
  briar_bee: { name: 'Briar Bee', biome: 'thornwood', hp: 260, def: 2, speed: 4.6, xp: 22, r: 0.4, ai: 'zigzag', aggro: 11, fly: true, contact: 24,
    attacks: [{ pattern: 'aimed', proj: 'thornseed', count: 1, dmg: 28, speed: 9, range: 6, cd: 1.4, tell: 150 }], loot: LT },
  thornwood_stag: { name: 'The Thornwood Stag', biome: 'thornwood', sheet: 'champions', hp: 2400, def: 10, speed: 2.4, xp: 240, r: 0.8, ai: 'hop', keep: 4, aggro: 11, contact: 60,
    attacks: [{ pattern: 'radial', proj: 'splinter', count: 12, turn: 0.26, waves: 2, gap: 0.3, dmg: 44, speed: 5, range: 7, cd: 2.8, tell: 600 }],
    children: ['bramble_wolf', 'thorn_sprite'], cap: 6, every: 10, loot: L([3, 5], [3, 5], [1, 3], [1, 3], 0.04), lootLuck: 2 },
  witch_of_briars: { name: 'The Witch of Briars', biome: 'thornwood', sheet: 'champions', hp: 2100, def: 8, speed: 1.6, xp: 220, r: 0.75, ai: 'kite', keep: 6, aggro: 11,
    attacks: [{ pattern: 'aimed', proj: 'thornseed', count: 4, arc: 0.7, waves: 2, gap: 0.25, dmg: 42, speed: 6, range: 8, cd: 2.6, tell: 500, mv: { split: { at: 0.55, n: 3 } } }],
    children: ['spore_puff', 'thorn_sprite'], cap: 6, every: 10, loot: L([3, 5], [3, 5], [1, 3], [1, 3], 0.04), lootLuck: 2 },
  // ---- the Crystal Steppe
  crystal_golem: { name: 'Crystal Golem', biome: 'steppe', hp: 1500, def: 16, speed: 1.6, xp: 95, r: 0.6, ai: 'shamble', aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'shard', count: 10, turn: 0.3, dmg: 52, speed: 5, range: 6, cd: 3, tell: 650 },
      { pattern: 'aimed', proj: 'lensflare', count: 1, dmg: 58, speed: 9, range: 8, cd: 1.8, tell: 250 }], loot: LS },
  prism_hawk: { name: 'Prism Hawk', biome: 'steppe', hp: 1000, def: 10, speed: 4.0, xp: 85, r: 0.5, ai: 'swoop', aggro: 11, fly: true, contact: 60,
    attacks: [{ pattern: 'aimed', proj: 'starbeam', count: 3, arc: 0.5, dmg: 50, speed: 8, range: 8, cd: 2.0, tell: 300, mv: { curve: -1.4, alt: true } }], loot: LS },
  shard_crawler: { name: 'Shard Crawler', biome: 'steppe', hp: 900, def: 12, speed: 3.6, xp: 75, r: 0.5, ai: 'skitter', aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'shard', count: 6, dmg: 46, speed: 4, range: 5, cd: 2.4, tell: 400, mv: { split: { at: 0.5, n: 2 } } }], loot: LS },
  quartz_jackal: { name: 'Quartz Jackal', biome: 'steppe', hp: 800, def: 10, speed: 4.4, xp: 70, r: 0.5, ai: 'flank', aggro: 11, contact: 55,
    attacks: [{ pattern: 'aimed', proj: 'shard', count: 2, arc: 0.3, dmg: 48, speed: 8, range: 6, cd: 1.6, tell: 200 }], loot: LS },
  geode_titan: { name: 'The Geode Titan', biome: 'steppe', sheet: 'champions', hp: 6500, def: 22, speed: 1.6, xp: 520, r: 0.85, ai: 'shamble', keep: 3, aggro: 11, contact: 110,
    attacks: [{ pattern: 'radial', proj: 'shard', count: 14, turn: 0.22, waves: 2, gap: 0.35, dmg: 70, speed: 4.5, range: 8, cd: 3, tell: 700, mv: { split: { at: 0.6, n: 2 } } }],
    children: ['crystal_golem', 'shard_crawler'], cap: 5, every: 11, loot: L([5, 7], [5, 7], [2, 4], [2, 4], 0.06), lootLuck: 2 },
  skyglass_seer: { name: 'The Skyglass Seer', biome: 'steppe', sheet: 'champions', hp: 5200, def: 18, speed: 2.0, xp: 480, r: 0.75, ai: 'kite', keep: 6, aggro: 12, fly: true,
    attacks: [{ pattern: 'aimed', proj: 'starbeam', count: 3, arc: 0.4, waves: 3, gap: 0.15, dmg: 75, speed: 9, range: 9, cd: 2.4, tell: 400 },
      { pattern: 'radial', proj: 'lensflare', count: 12, dmg: 60, speed: 3.5, range: 8, cd: 4, tell: 700, mv: { accel: 10, max: 2.5 } }],
    children: ['prism_hawk', 'shard_crawler'], cap: 5, every: 11, loot: L([5, 7], [5, 7], [2, 4], [2, 4], 0.06), lootLuck: 2 },
});
Object.assign(GROUPS, { dunes: ['glass_sphinx', 'mirage_caller'], thornwood: ['thornwood_stag', 'witch_of_briars'], steppe: ['geode_titan', 'skyglass_seer'] });
Object.assign(PARENTS, { dunes: 'glass_sphinx', thornwood: 'thornwood_stag', steppe: 'geode_titan' });
Object.assign(BIOME_SPAWNS, { dunes: [['glass_scarab', 2, 4], ['salt_mummy', 1, 3], ['dune_lurker', 1, 2]],
  thornwood: [['bramble_wolf', 2, 3], ['thorn_sprite', 1, 3], ['spore_puff', 1, 2]], steppe: [['crystal_golem', 1, 2], ['shard_crawler', 2, 3], ['prism_hawk', 1, 2]] });
for (const list of Object.values(PACKS)) for (const p of list) p[1] = Math.round(p[1] * 1.4);       // the older lands grew with the realm
Object.assign(PACKS, { dunes: [['sand_skimmer', 14]], thornwood: [['briar_bee', 12]], steppe: [['quartz_jackal', 8]] });
Object.assign(CAMP_LOOT, { dunes: CAMP_LOOT.shore, thornwood: CAMP_LOOT.fen, steppe: CAMP_LOOT.runeholt });
Object.assign(SPEECH, {
  glass_sphinx: { see: ['Answer me this...', 'No. Wrong.'], die: ['...the riddle... was...'] },
  witch_of_briars: { see: ['Lost, dearie?', 'The thorns are hungry.'], die: ['...plant me... deep...'] },
  skyglass_seer: { see: ['I saw you coming.', 'This ends badly. For you.'], die: ['...did not... foresee...'] },
});
REALM_BOSSES.the_fallen_star.speed = 1.3;

// ================================================================ THE SPRITE PACK'S DUNGEONS: the Sunken Crypt and the Emberforge Depths
// Values are final (they come after the readability and pace passes above).
const LC = L([4, 7], [4, 7], [2, 3], [2, 3], 0.03), LE = L([6, 9], [6, 9], [3, 4], [3, 4], 0.05);
Object.assign(ENEMIES, {
  // ---- the Sunken Crypt
  bone_wisp: { name: 'Bone Wisp', biome: 'crypt', hp: 700, def: 6, speed: 2.6, xp: 60, r: 0.45, ai: 'float', aggro: 10, fly: true,
    attacks: [{ pattern: 'radial', proj: 'wisp_flame', count: 6, dmg: 40, speed: 4, range: 6, cd: 2.6, tell: 400, mv: { curve: 1.2, alt: true } }], loot: LC },
  drowned_thrall: { name: 'Drowned Thrall', biome: 'crypt', hp: 1100, def: 10, speed: 2.0, xp: 75, r: 0.5, ai: 'shamble', aggro: 10, contact: 50,
    attacks: [{ pattern: 'aimed', proj: 'tide_wave', count: 2, arc: 0.4, dmg: 48, speed: 6, range: 6, cd: 2.0, tell: 350 }], loot: LC },
  brine_jelly: { name: 'Brine Jelly', biome: 'crypt', hp: 800, def: 4, speed: 1.8, xp: 65, r: 0.5, ai: 'drift', aggro: 9, fly: true,
    attacks: [{ pattern: 'radial', proj: 'bubble', count: 8, dmg: 38, speed: 3, range: 6, cd: 3, tell: 500, mv: { brake: 0.5, re: 6 } }], loot: LC },
  // ---- the Emberforge Depths
  magma_imp: { name: 'Magma Imp', biome: 'ember', hp: 1300, def: 12, speed: 4.0, xp: 110, r: 0.45, ai: 'zigzag', aggro: 11, fly: true, contact: 60,
    attacks: [{ pattern: 'aimed', proj: 'fireball', count: 2, arc: 0.3, dmg: 62, speed: 8, range: 7, cd: 1.8, tell: 250 }], loot: LE },
  cinder_golem: { name: 'Cinder Golem', biome: 'ember', hp: 7500, def: 32, speed: 1.7, xp: 320, r: 0.65, ai: 'shamble', aggro: 11, contact: 150,
    attacks: [{ pattern: 'radial', proj: 'slag_shard', count: 14, turn: 0.22, waves: 2, gap: 0.35, dmg: 95, speed: 4.5, range: 7, cd: 2.6, tell: 600 },
      { pattern: 'aimed', proj: 'fireball', count: 3, arc: 0.3, dmg: 105, speed: 9, range: 9, cd: 1.6, tell: 280 },
      { pattern: 'cage', proj: 'slag_shard', count: 12, r: 3.2, dmg: 90, speed: 3, range: 4, cd: 4.2, tell: 650 }], loot: LE },
  slag_crawler: { name: 'Slag Crawler', biome: 'ember', hp: 1600, def: 16, speed: 3.4, xp: 120, r: 0.5, ai: 'skitter', aggro: 10,
    attacks: [{ pattern: 'radial', proj: 'slag_shard', count: 6, dmg: 60, speed: 4, range: 5, cd: 2.4, tell: 400, mv: { split: { at: 0.5, n: 2 } } }], loot: LE },
});
Object.assign(SPEECH, {
  bone_wisp: { see: ['...cold...', 'Join us below.'] }, drowned_thrall: { see: ['The Lich commands.', 'Down... down...'] },
  magma_imp: { see: ['Hot hot HOT!', 'Burn, burn!'] }, cinder_golem: { see: ['STOKE.', 'MORE FUEL.'] },
});

DUNGEONS.crypt = { name: 'The Sunken Crypt', floor: 'cryptfloor', wall: 'cryptwall', hazard: null, rooms: 13, portal: 'crypt', style: 'crypt',
  layout: { grid: [5, 4], loops: 2, secrets: 2, minW: 17, maxW: 27, minH: 15, maxH: 21, shapes: ['rect', 'pillared', 'cross'] },
  seals: ['lever', 'puzzle', 'warden'], puzzle: 'runes', wardens: ['drowned_thrall', 'bone_wisp'],
  hazardFx: { kind: 'tide', name: 'the drowning dark', every: 8, speed: 3, dmg: 40, proj: 'tide_wave' },
  chestLoot: [{ slot: 'weapon', tiers: [5, 8], p: 0.8 }, { slot: 'armor', tiers: [5, 8], p: 0.8 }, { slot: 'ability', tiers: [2, 4], p: 0.5 },
    { stat: true, p: 0.8 }, { id: 'pot_mp', p: 1 }, { id: 'ring_of_tides', p: 0.03 }, { id: 'hexsilk_robe', p: 0.03 }],
  mobs: ['bone_wisp', 'drowned_thrall', 'brine_jelly', 'drowned_thrall'], elites: ['drowned_thrall', 'brine_jelly'],
  boss: 'tidebound_lich', mobHp: 1.4 };
DUNGEONS.ember = { name: 'The Emberforge Depths', floor: 'emberfloor', wall: 'emberwall', hazard: 'emberlava', rooms: 15, portal: 'ember', style: 'ember',
  layout: { grid: [5, 5], loops: 3, secrets: 1, minW: 19, maxW: 31, minH: 17, maxH: 25, shapes: ['rect', 'rect', 'cross', 'pillared'] },
  seals: ['warden', 'warden', 'puzzle', 'lever'], puzzle: 'plates', plateTime: 8, wardens: ['cinder_golem', 'anvil_golem'],
  hazardFx: { kind: 'zones', name: 'falling cinders', every: 4.5, n: 3, r: 1.4, delay: 1.1, dmg: 110, spread: 4, stagger: 0.15, shards: 4, proj: 'slag_shard', colors: ['#ff8c1e', '#ffd84a'] },
  chestLoot: [{ slot: 'weapon', tiers: [8, 10], p: 0.8 }, { slot: 'armor', tiers: [9, 11], p: 0.8 }, { slot: 'ability', tiers: [4, 5], p: 0.5 },
    { slot: 'ring', tiers: [4, 5], p: 0.5 }, { stat: true, p: 1 }, { id: 'emberheart_ring', p: 0.03 }, { id: 'runeplate_armor', p: 0.03 }],
  mobs: ['magma_imp', 'cinder_golem', 'slag_crawler', 'slag_crawler', 'slag_imp'], elites: ['cinder_golem', 'magma_imp'],
  boss: 'forgeheart_colossus', mobHp: 1.7 };

// ---- THE TIDEBOUND LICH: it trades places with you, and it puts out the lights
DUNGEON_BOSSES.tidebound_lich = {
  name: 'The Tidebound Lich', biome: 'crypt', sheet: 'pack_bosses', hp: 64000, def: 26, xp: 9000, r: 1.4, speed: 1.3, keep: 6, summon: 'bone_wisp',
  phases: [
    { at: 1, name: 'Kneel in the water.', cycle: ['tidecall', 'grasp', 'souls', 'grasp'] },
    { at: 0.66, name: 'The candles gutter.', open: 'lightsout', cycle: ['swap', 'tidecall', 'souls', 'grasp', 'raise'] },
    { at: 0.33, name: 'THE TIDE TAKES ALL.', open: 'lightsout', cycle: ['swap', 'souls', 'tidecall', 'swap', 'raise', 'grasp'] },
  ],
  moves: {
    tidecall: { tell: 0.7, fire: [0, 0.35].map((delay, k) => ({ delay, pattern: 'radial', proj: 'tide_wave', count: 14, turn: k * 0.22, dmg: 72, speed: 4.2 - k * 0.6, range: 9 })), recover: 0.7 },
    grasp: { tell: 0.45, fire: [{ pattern: 'aimed', proj: 'tide_wave', count: 3, arc: 0.4, waves: 3, gap: 0.2, dmg: 78, speed: 8, range: 9 }], recover: 0.6 },
    souls: { tell: 0.6, spiral: { proj: 'wisp_flame', arms: 3, every: 0.16, turn: 0.26, speed: 4, dmg: 66, range: 9, dur: 2.6 }, recover: 0.6 },
    swap: { special: true, tell: 0.9, soulswap: { delay: 0.6, dmg: 70, proj: 'wisp_flame' }, recover: 0.8 },
    lightsout: { special: true, tell: 1.0, darkness: { dur: 9, r: 3.4 }, fire: [{ pattern: 'radial', proj: 'wisp_flame', count: 12, dmg: 60, speed: 3, range: 9 }], recover: 0.6 },
    raise: { special: true, tell: 0.6, summon: 3, recover: 0.5 },
  },
  loot: [{ slot: 'weapon', tiers: [7, 9], p: 1 }, { slot: 'armor', tiers: [8, 10], p: 1 }, { slot: 'ability', tiers: [3, 5], p: 0.7 }, { slot: 'ring', tiers: [3, 5], p: 0.6 },
    { stat: true, p: 1 }, { stat: true, p: 0.6 }, { id: 'tidecaller_blade', p: 0.1 }, { id: 'staff_of_drowned_stars', p: 0.1 }, { id: 'hexsilk_robe', p: 0.1 },
    { id: 'ring_of_tides', p: 0.1 }, { id: 'soul_lantern', p: 0.08 }, { id: 'grimoire_of_ash', p: 0.06 }, ...MYTHIC(0.02)],
};
// ---- THE FORGEHEART COLOSSUS: roads of fire burst from the floor, and its blazing core throws your shots back
DUNGEON_BOSSES.forgeheart_colossus = {
  name: 'The Forgeheart Colossus', biome: 'ember', sheet: 'pack_bosses', hp: 220000, def: 40, xp: 18000, r: 1.6, speed: 1.1, keep: 4, summon: 'magma_imp',
  phases: [
    { at: 1, name: 'The forge stirs.', cycle: ['hammer', 'furnace', 'eruption', 'hammer'] },
    { at: 0.6, name: 'THE FORGE WAKES.', open: 'bulwark', cycle: ['eruption', 'hammer', 'bulwark', 'furnace', 'forge'] },
    { at: 0.3, name: 'IT RUNS WHITE-HOT.', open: 'bulwark', cycle: ['eruption', 'furnace', 'bulwark', 'eruption', 'hammer'] },
    // the end: it cannot be hurt. Live through 22 seconds of meltdown and it burns itself out.
    { at: 0.06, survive: 22, name: 'MELTDOWN. It cannot be hurt: SURVIVE for 22 seconds!', open: 'meltdown', cycle: ['meltdown', 'eruption', 'cinderstorm', 'meltdown', 'cinderstorm'] },
  ],
  moves: {
    hammer: { tell: 0.7, fire: [{ pattern: 'radial', proj: 'slag_shard', count: 16, dmg: 105, speed: 4.5, range: 9 }, { delay: 0.25, pattern: 'aimed', proj: 'fireball', count: 3, arc: 0.35, dmg: 120, speed: 9, range: 10 }], recover: 0.7 },
    furnace: { tell: 0.6, spiral: { proj: 'fireball', arms: 3, every: 0.15, turn: 0.21, speed: 4.5, dmg: 100, range: 9, dur: 2.6 }, recover: 0.6 },
    eruption: { special: true, tell: 0.8, lanes: { n: 4, len: 15, w: 0.9, delay: 1.0, dur: 3.5, dmg: 85 }, fire: [{ delay: 1.0, pattern: 'radial', proj: 'slag_shard', count: 10, dmg: 95, speed: 4, range: 8 }], recover: 0.8 },
    bulwark: { special: true, tell: 0.7, reflect: { dur: 3.2, dmg: 95, proj: 'slag_shard' }, fire: [{ pattern: 'radial', proj: 'fireball', count: 8, dmg: 95, speed: 3, range: 8 }], recover: 1.0 },
    forge: { special: true, tell: 0.6, summon: 3, recover: 0.5 },
    // the survival phase's moves: dense, fast, and meant to be dodged rather than tanked
    meltdown: { special: true, tell: 0.9, lanes: { n: 6, len: 16, w: 1.0, delay: 0.9, dur: 3.2, dmg: 95 },
      spirals: [{ proj: 'fireball', arms: 4, every: 0.16, turn: 0.19, speed: 4, dmg: 110, range: 10, dur: 3 }], recover: 0.5 },
    cinderstorm: { special: true, tell: 0.6, fire: [0, 0.3, 0.6, 0.9].map((delay, k) => ({ delay, pattern: 'radial', proj: k % 2 ? 'fireball' : 'slag_shard', count: 18, turn: k * 0.17, dmg: 110, speed: 4.2 + k * 0.3, range: 10 })), recover: 0.4 },
  },
  loot: [{ slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [10, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
    { stat: true, p: 1 }, { stat: true, p: 1 }, { id: 'emberbrand_greatsword', p: 0.1 }, { id: 'cinderwood_staff', p: 0.1 }, { id: 'runeplate_armor', p: 0.1 },
    { id: 'emberheart_ring', p: 0.1 }, { id: 'colossus_core', p: 0.08 }, { id: 'runic_aegis', p: 0.06 }, ...MYTHIC(0.03)],
};

// ---- the Anvil Golem (the Emberforge's other warden) hits like its cinder cousin now
Object.assign(ENEMIES.anvil_golem, { hp: 6500, def: 30, contact: 140, xp: 320 });
ENEMIES.anvil_golem.attacks = ENEMIES.anvil_golem.attacks.map((a) => ({ ...a, dmg: Math.round(a.dmg * 1.5), count: a.count ? a.count + 2 : a.count }));

// ================================================================ THE DUNGEONS' STORIES: journal pages along the way in (F to read)
Object.assign(DUNGEONS.ember, { storyTitle: 'The Forgemaster\'s Journal', story: [
  'Day 1. The Emberforge is lit. Six hundred smiths, one anvil, one purpose: a guardian for the god\'s fallen heart. We are calling it the Forgeheart. Hadrek, Forgemaster.',
  'Day 90. The golems work the bellows night and day. They do not tire, and they do not speak. Sometimes I catch them watching the Forgeheart, as if they are waiting for it to tell them something.',
  'Day 212. We poured the core today. The metal would not cool. Ilsa swears she heard it breathing. I told her it was the bellows. I am no longer sure it was the bellows.',
  'Day 300. It moved. Before we finished its arms, before we carved its eyes, it moved. Half the smiths fled. The golems did not. They knelt.',
  'Day 301. It has sealed the lower halls with our own wardens and hidden the levers in the dark. It wants to be left alone with the heat. Do not wake it. If you are reading this, you already have.',
] });
Object.assign(DUNGEONS.chapel, { storyTitle: 'Hymnal of the Drowned', story: [
  'The tide came in during Mass and never went out again. Abbot Morrow told us to keep singing.',
  'We sang until the water reached the pews. Then the altar. Then our mouths. He said the sea was listening.',
  'The bells still ring at the hour of Mass. No one pulls the ropes. The Abbot does not breathe any more, but he still preaches.',
  'He sealed the nave with our own bell-ropes. Pull the levers and the seals break; he never could stand the noise.',
  'If you find the Abbot, do not let him finish the sermon. Nobody has ever heard the end of it and come back up.',
] });
Object.assign(DUNGEONS.crypt, { storyTitle: 'Epitaphs of the Sunken Kings', story: [
  'Here lie the drowned kings of the shore, laid to rest in salt and silence.',
  'The tide found the crypt before the priests could seal it. The kings woke wet, and angry.',
  'One of them, Vaelor, did not want to be a king any more. He wanted to be the tide.',
  'The candles here burn without wax. He keeps them lit so that he can put them out. He likes it when you cannot see.',
  'He will trade places with you, if you let him. Do not stand where he can reach your soul.',
] });
Object.assign(DUNGEONS.forge, { storyTitle: 'Ledger of the Drowned Forge', story: [
  'The first smiths of the realm worked here, beneath the sea, where the water kept the fires from running wild.',
  'They built a hammer to strike the god-anvil. The anvil had never been struck. They meant to be the first.',
  'The hammer fell. The anvil did not ring. The sea came in through the cracks.',
  'Something stands at the anvil now, still swinging. We call it the Unstruck, because nothing it hits has ever stopped it.',
  'Watch the floor. When the forge hisses, the steam rises in a pattern. Stand where it is not.',
] });
Object.assign(DUNGEONS.scriptorium, { storyTitle: 'Marginalia', story: [
  'Every word ever spoken in the realm is kept here, frozen into pages. The Archivist keeps them.',
  'It catalogued the god\'s fall in nine thousand volumes. It is still on the first sentence.',
  'Readers who stay too long become footnotes. Readers who stay longer become errata.',
  'The Archivist copies everything, even itself. Strike the copy and the original laughs.',
  'If you reach the last chapter, write your name in the margin. It is the only thing it will never be able to shelve.',
] });
Object.assign(DUNGEONS.heart, { storyTitle: 'Prayers to a Fallen Heart', story: [
  'When the god fell, its heart rolled down into the earth, and it kept beating.',
  'Gold grew around it like scar tissue. Saints came to pray. The heart drank their prayers.',
  'Every beat sends a shiver through Godfall. Count them: they are getting faster.',
  'Its wardens feed it. Cut them down and the way to the heart will open.',
  'It remembers being a god. It does not remember losing.',
] });
Object.assign(DUNGEONS.throne, { storyTitle: 'The Unstruck God Speaks', story: [
  'I was never struck. Every smith tried. Every hammer broke.',
  'They called me unfinished, as if that were a weakness. An unfinished thing cannot end.',
  'My champions hold the seals. They chose to. Do not pity them.',
  'You have walked through my heart and my forge and my tomb. Did you think they were yours?',
  'Come, then. Strike me. Be the first.',
] });

// ================================================================ v2 dungeon layouts (see world/maps.js dungeon()): what each one asks of you
// The lower dungeons are straight runs to the boss: no gate, no seals, no puzzle.
Object.assign(DUNGEONS.chapel, { seals: [], puzzle: null, altar: false, layout: { secrets: 1 } });
Object.assign(DUNGEONS.crypt, { seals: [], puzzle: null, altar: true, layout: { secrets: 3 } });
Object.assign(DUNGEONS.forge, { seals: [], puzzle: null, altar: false, layout: { secrets: 1 } });
// the upper ones each guard the boss their own way
Object.assign(DUNGEONS.scriptorium, { seals: ['puzzle', 'lever', 'warden'], puzzle: 'runes', altar: true, layout: { secrets: 3 } });
Object.assign(DUNGEONS.heart, { seals: ['warden', 'warden', 'warden'], puzzle: null, altar: true, layout: { secrets: 2 } });
Object.assign(DUNGEONS.throne, { style: 'throne', seals: ['warden', 'warden'], puzzle: null, altar: false, layout: { secrets: 1 } });

// ================================================================ BULLET HELL: every boss gets a new signature, a frenzy, more life, denser patterns
// frenzy: N   - the boss cannot be hurt for N seconds and runs its frenzy script (cycle); afterwards it settles into 'after'.
// bloodlust   - the endgame bosses' frenzies are called bloodlust, and they come twice for the god and the heart.
{
  const ADD = (B, moves, phases, bloodlust = false) => {
    Object.assign(B.moves, moves);
    for (const ph of phases) { B.phases.push(ph); }
    B.phases.sort((a, b) => b.at - a.at);
    if (bloodlust) B.bloodlust = true;
  };
  const RB = REALM_BOSSES, DB = DUNGEON_BOSSES;
  ADD(RB.brine_cathedral, {
    tidewall: { special: true, tell: 0.6, tidewall: { n: 4, every: 1.0, gap: 2.6, speed: 4, dmg: 42, proj: 'tidebolt' }, recover: 0.5 },
  }, [{ at: 0.5, frenzy: 7, name: 'THE TIDE RISES. The Cathedral cannot be hurt!', open: 'tidewall', cycle: ['tidewall', 'deluge', 'tidewall'], after: ['tidewall', 'bell', 'scuttle', 'claw', 'tidecall'] }]);
  ADD(RB.wick_mother, {
    seekwisps: { special: true, tell: 0.6, seekers: { n: 6, speed: 3.2, life: 3.5, turn: 2.0, dmg: 58, proj: 'candleflame', burst: 8 }, recover: 0.6 },
  }, [{ at: 0.45, frenzy: 8, name: 'Her wicks hunt you!', open: 'seekwisps', cycle: ['seekwisps', 'conflagration', 'seekwisps'], after: ['seekwisps', 'flare', 'brood', 'drip', 'pyre'] }]);
  ADD(RB.orrery_of_winter, {
    galaxy: { special: true, tell: 0.7, rotor: { arms: 5, every: 0.1, turn: 0.14, flip: 1.2, dur: 4, speed: 4.5, dmg: 60, proj: 'snowflake' }, recover: 0.6 },
  }, [{ at: 0.45, frenzy: 9, name: 'The heavens turn backwards!', open: 'galaxy', cycle: ['galaxy', 'ringlight', 'galaxy'], after: ['galaxy', 'revolve', 'align', 'shatter', 'eclipse'] }]);
  ADD(RB.penitent_colossus, {
    judgement: { special: true, tell: 0.6, blitz: { n: 3, speed: 16, ring: 14, dmg: 100, proj: 'goldshard' }, recover: 0.7 },
  }, [{ at: 0.4, frenzy: 9, name: 'JUDGEMENT.', open: 'judgement', cycle: ['judgement', 'penance', 'quakefield', 'judgement'], after: ['judgement', 'slam', 'seams', 'gazebolts', 'quakefield'] }]);
  ADD(RB.emily_the_yapper, {
    fishbounce: { special: true, tell: 0.5, say: true, ricochet: { n: 5, speed: 7, bounces: 4, life: 6, dmg: 58, proj: 'fishy' }, recover: 0.5 },
  }, [{ at: 0.4, frenzy: 8, name: 'EMILY IS VERY UPSET NOW.', open: 'fishbounce', cycle: ['fishbounce', 'yapring', 'monologue', 'fishbounce'], after: ['fishbounce', 'slide', 'snowballs', 'lobfish', 'yapring'] }]);
  ADD(RB.the_fallen_star, {
    starlattice: { special: true, tell: 0.7, lattice: { size: 3, gap: 2.2, delay: 0.9, speed: 8, dmg: 100, proj: 'star' }, recover: 0.6 },
  }, [{ at: 0.4, frenzy: 10, name: 'BLOODLUST: the star goes supernova!', open: 'starlattice', cycle: ['starlattice', 'constellation', 'nova', 'starlattice'], after: ['starlattice', 'mines', 'comet', 'constellation'] }], true);
  ADD(DB.drowned_abbot, {
    maelstrom: { special: true, tell: 0.6, whirlpool: { n: 18, r: 7, spin: 1.8, shrink: 1.9, dur: 3.6, dmg: 52, proj: 'bubble' }, recover: 0.5 },
  }, [{ at: 0.5, frenzy: 8, name: 'THE MAELSTROM.', open: 'maelstrom', cycle: ['maelstrom', 'baptism', 'crozier', 'maelstrom'], after: ['maelstrom', 'undertow', 'glass', 'censer', 'mass'] }]);
  ADD(DB.fallen_heart, {
    heartbeat: { special: true, tell: 0.5, pulse: { n: 6, every: 0.42, count: 34, gap: 0.8, speed: 4.6, dmg: 115, proj: 'bloodclot' }, recover: 0.5 },
  }, [{ at: 0.6, frenzy: 12, name: 'BLOODLUST: it beats faster and faster!', open: 'heartbeat', cycle: ['heartbeat', 'cataclysm', 'veins', 'heartbeat'], after: ['heartbeat', 'artery', 'veins', 'systole', 'saints'] },
    { at: 0.15, frenzy: 12, name: 'BLOODLUST: THE FINAL BEAT.', open: 'heartbeat', cycle: ['heartbeat', 'lastbeat', 'cataclysm', 'heartbeat'], after: ['heartbeat', 'cataclysm', 'artery', 'veins'] }], true);
  ADD(DB.the_archivist, {
    errata: { special: true, tell: 0.7, mirror: { dur: 6 }, spiral: { proj: 'page', arms: 3, every: 0.13, turn: 0.24, speed: 4.2, dmg: 58, range: 10, dur: 3 }, recover: 0.6 },
  }, [{ at: 0.45, frenzy: 10, name: 'BLOODLUST: EVERY PAGE AT ONCE.', open: 'errata', cycle: ['errata', 'inkstorm', 'margins', 'errata'], after: ['errata', 'tomes', 'shelving', 'echoes_blink', 'frostnote'] }], true);
  ADD(DB.the_unstruck_god, {
    eclipse_god: { special: true, tell: 0.7, eclipse: { waves: 6, every: 0.45, count: 56, safe: 0.9, turn: 0.35, speed: 5, dmg: 135, proj: 'goldshard' }, recover: 0.5 },
  }, [{ at: 0.5, frenzy: 12, name: 'BLOODLUST: THE GOD ECLIPSES THE SUN.', open: 'eclipse_god', cycle: ['eclipse_god', 'halo', 'judgment', 'eclipse_god'], after: ['eclipse_god', 'halo', 'bind', 'judgment', 'solar', 'court'] },
    { at: 0.2, frenzy: 12, name: 'BLOODLUST: I AM UNSTRUCK.', open: 'eclipse_god', cycle: ['eclipse_god', 'cataclysm', 'bind', 'eclipse_god'], after: ['eclipse_god', 'cataclysm', 'halo', 'judgment', 'bind'] }], true);
  ADD(DB.tidebound_lich, {
    gravecall: { special: true, tell: 0.6, echo: { dur: 6, delay: 1.0, every: 0.32, n: 6, speed: 3.5, dmg: 82, proj: 'wisp_flame' }, recover: 0.5 },
  }, [{ at: 0.45, frenzy: 10, name: 'BLOODLUST: the dead walk where you walked.', open: 'gravecall', cycle: ['gravecall', 'souls', 'swap', 'gravecall'], after: ['gravecall', 'tidecall', 'grasp', 'souls', 'raise'] }], true);
  ADD(DB.forgeheart_colossus, {}, [{ at: 0.45, frenzy: 10, name: 'BLOODLUST: THE FORGE ROARS.', open: 'eruption', cycle: ['eruption', 'cinderstorm', 'bulwark', 'eruption'], after: ['eruption', 'furnace', 'bulwark', 'hammer'] }], true);
  // everything gets denser and tougher: 2.5x life, about a third more bullets, an extra arm on every spiral
  for (const B of [...Object.values(RB), ...Object.values(DB)]) {
    B.hp = Math.round(B.hp * 2.5);
    for (const M of Object.values(B.moves)) {
      for (const f of M.fire || []) if (f.count) f.count = Math.round(f.count * (f.pattern === 'aimed' ? 1.25 : 1.35));
      for (const S of [M.spiral, ...(M.spirals || [])].filter(Boolean)) S.arms += 1;
    }
  }
  BOSS.hp = Math.round(BOSS.hp * 2.5);
}

// ---- each dungeon's darkness has its own colour (the light pools are carved out of it)
Object.assign(DUNGEONS.chapel, { ambient: 'rgba(6,24,34,0.5)' });
Object.assign(DUNGEONS.crypt, { ambient: 'rgba(4,14,10,0.66)' });
Object.assign(DUNGEONS.forge, { ambient: 'rgba(24,12,6,0.46)' });
Object.assign(DUNGEONS.scriptorium, { ambient: 'rgba(8,16,34,0.42)' });
Object.assign(DUNGEONS.ember, { ambient: 'rgba(30,6,4,0.52)' });
Object.assign(DUNGEONS.heart, { ambient: 'rgba(34,4,10,0.55)' });
Object.assign(DUNGEONS.throne, { ambient: 'rgba(20,12,30,0.38)' });

// ================================================================ FOUR NEW DUNGEONS
// The Honeyed Hollow (low), the Gilded Marionette Theatre (mid), the Prism Lighthouse and the Sleeper's Dream (hard).
// Every shot, pattern, phase and door here is their own: see src/dungeons4.js for the mechanics.
{
  const LH = DL([2, 4], [2, 4], [1, 2], [1, 2], 0.02), LT = DL([5, 7], [5, 7], [2, 4], [2, 4], 0.04);
  const LP = DL([8, 10], [8, 10], [4, 5], [4, 5], 0.06), LD = DL([9, 10], [10, 11], [4, 5], [4, 5], 0.08);
  Object.assign(ENEMIES, {
    // ---- the Honeyed Hollow
    worker_bee: { name: 'Worker Bee', biome: 'hive', hp: 380, def: 2, speed: 3.6, xp: 24, r: 0.4, ai: 'zigzag', aggro: 10, fly: true, contact: 22,
      attacks: [{ pattern: 'aimed', proj: 'stinger', count: 1, dmg: 26, speed: 10, range: 6, cd: 1.3, tell: 200 }], loot: LH },
    wax_drone: { name: 'Wax Drone', biome: 'hive', hp: 700, def: 6, speed: 1.2, xp: 40, r: 0.5, ai: 'float', aggro: 10, fly: true,
      attacks: [{ pattern: 'radial', proj: 'waxdrop', count: 6, turn: 0.4, dmg: 30, speed: 2, range: 6, cd: 2.6, tell: 500, mv: { accel: 4, max: 2.4 } }], loot: LH },
    honey_grub: { name: 'Honey Grub', biome: 'hive', hp: 900, def: 8, speed: 1.0, xp: 45, r: 0.5, ai: 'shamble', aggro: 9,
      attacks: [{ pattern: 'shotgun', proj: 'honeyglob', count: 5, arc: 0.9, dmg: 34, speed: 5, range: 4.5, cd: 2.2, tell: 450 }], loot: LH },
    comb_guard: { name: 'Comb Guard', biome: 'hive', hp: 1600, def: 10, speed: 2.6, xp: 90, r: 0.55, ai: 'flank', keep: 3, aggro: 11, fly: true, contact: 40,
      attacks: [{ pattern: 'aimed', proj: 'stinger', count: 3, arc: 0.35, waves: 2, gap: 0.2, dmg: 36, speed: 10, range: 7, cd: 1.8, tell: 300 },
        { pattern: 'radial', proj: 'nectar', count: 8, dmg: 34, speed: 3.5, range: 6, cd: 3.4, tell: 600 }], loot: LH },
    brood_cell: { name: 'Brood Cell', biome: 'hive', hp: 520, def: 0, speed: 0, xp: 10, r: 0.5, ai: 'rooted', aggro: 30, attacks: [], loot: [] },
    // ---- the Gilded Marionette Theatre
    marionette: { name: 'Marionette', biome: 'theatre', hp: 1100, def: 10, speed: 2.4, xp: 80, r: 0.5, ai: 'hop', keep: 3, aggro: 10,
      attacks: [{ pattern: 'aimed', proj: 'puppet_string', count: 2, arc: 0.25, dmg: 46, speed: 8, range: 7, cd: 1.6, tell: 300, mv: { jerk: 0.22 } }], loot: LT },
    masked_chorister: { name: 'Masked Chorister', biome: 'theatre', hp: 1300, def: 8, speed: 1.2, xp: 90, r: 0.5, ai: 'kite', keep: 6, aggro: 11,
      attacks: [{ pattern: 'radial', proj: 'mask_shot', count: 10, turn: 0.3, dmg: 44, speed: 3.5, range: 7, cd: 2.8, tell: 600, mv: { serp: 2.2 } }], loot: LT },
    stagehand: { name: 'Stagehand', biome: 'theatre', hp: 1800, def: 14, speed: 1.8, xp: 100, r: 0.55, ai: 'flank', keep: 3.5, aggro: 10, contact: 60,
      attacks: [{ pattern: 'aimed', proj: 'sandbag_shot', count: 1, dmg: 62, speed: 6, range: 6, cd: 1.8, tell: 450 }], loot: LT },
    prima_donna: { name: 'Prima Donna', biome: 'theatre', hp: 3200, def: 12, speed: 1.4, xp: 200, r: 0.6, ai: 'kite', keep: 7, aggro: 12,
      attacks: [{ pattern: 'radial', proj: 'rose', count: 16, waves: 2, gap: 0.3, turn: 0.2, dmg: 52, speed: 3.2, range: 8, cd: 3, tell: 700 },
        { pattern: 'aimed', proj: 'ribbon', count: 3, arc: 0.6, dmg: 58, speed: 7, range: 8, cd: 2, tell: 350, mv: { serp: 3 } }], loot: LT },
    hanging_marionette: { name: 'Hanging Marionette', biome: 'theatre', hp: 9000, def: 20, speed: 0, xp: 300, r: 0.6, ai: 'rooted', aggro: 30,
      attacks: [{ pattern: 'aimed', proj: 'ribbon', count: 2, arc: 0.4, dmg: 70, speed: 6, range: 9, cd: 2.8, tell: 500, mv: { serp: 2.6 } }], loot: [] },
    understudy: { name: 'The Understudy', biome: 'theatre', hp: 7000, def: 16, speed: 2.2, xp: 400, r: 0.6, ai: 'orbit', keep: 5, aggro: 30,
      attacks: [{ pattern: 'aimed', proj: 'mask_shot', count: 4, arc: 0.5, dmg: 70, speed: 6, range: 9, cd: 1.8, tell: 350, mv: { jerk: 0.18 } },
        { pattern: 'radial', proj: 'scissor_blade', count: 10, dmg: 72, speed: 4, range: 9, cd: 3.2, tell: 600 }], loot: [] },
    mirror_puppet: { name: 'Your Mirror Puppet', biome: 'theatre', hp: 1e9, def: 999, speed: 0, xp: 0, r: 0.45, ai: 'rooted', aggro: 0, attacks: [], loot: [], dummy: true },
    // ---- the Prism Lighthouse
    refractor: { name: 'Refractor', biome: 'prism', hp: 2600, def: 22, speed: 1.6, xp: 150, r: 0.5, ai: 'float', aggro: 11, fly: true,
      attacks: [{ pattern: 'aimed', proj: 'refraction', count: 1, dmg: 80, speed: 8, range: 8, cd: 1.6, tell: 300, mv: { refract: 0.4 } }], loot: LP },
    lumen_moth: { name: 'Lumen Moth', biome: 'prism', hp: 1800, def: 12, speed: 3.4, xp: 120, r: 0.45, ai: 'swoop', aggro: 11, fly: true, contact: 70,
      attacks: [{ pattern: 'radial', proj: 'lumen', count: 6, dmg: 64, speed: 5, range: 5, cd: 2, tell: 350 }], loot: LP },
    glass_knight: { name: 'Glass Knight', biome: 'prism', hp: 4200, def: 30, speed: 1.6, xp: 220, r: 0.55, ai: 'flank', keep: 3, aggro: 10, guard: true, contact: 90,
      attacks: [{ pattern: 'aimed', proj: 'glass_pane', count: 3, arc: 0.5, dmg: 90, speed: 7, range: 7, cd: 2, tell: 400 }], loot: LP },
    prism_eye: { name: 'Prism Eye', biome: 'prism', hp: 7000, def: 28, speed: 1.0, xp: 420, r: 0.65, ai: 'kite', keep: 7, aggro: 12, fly: true,
      attacks: [{ pattern: 'aimed', proj: 'white_bolt', count: 1, dmg: 110, speed: 7, range: 9, cd: 2.2, tell: 450, mv: { disperse: 0.5 } },
        { pattern: 'radial', proj: 'refraction', count: 12, dmg: 90, speed: 4, range: 8, cd: 3.6, tell: 700, mv: { refract: 0.6 } }], loot: LP },
    prism_image: { name: 'A Prism Image', biome: 'prism', hp: 30000, def: 999, speed: 1.4, xp: 0, r: 1.2, ai: 'orbit', keep: 7, aggro: 30,
      attacks: [{ pattern: 'aimed', proj: 'white_bolt', count: 2, arc: 0.3, dmg: 110, speed: 7, range: 10, cd: 2.4, tell: 450, mv: { disperse: 0.55 } }], loot: [] },
    // ---- the Sleeper's Dream
    night_mare: { name: 'Night Mare', biome: 'dream', hp: 4800, def: 26, speed: 3.8, xp: 260, r: 0.55, ai: 'charge', aggro: 11, contact: 140,
      attacks: [{ pattern: 'aimed', proj: 'nightmare_eye', count: 3, arc: 0.3, dmg: 100, speed: 8, range: 8, cd: 2, tell: 350 }], loot: LD },
    sleepwalker: { name: 'Sleepwalker', biome: 'dream', hp: 3600, def: 20, speed: 0.9, xp: 220, r: 0.5, ai: 'drift', aggro: 10,
      attacks: [{ pattern: 'radial', proj: 'zzz', count: 8, turn: 0.4, dmg: 70, speed: 2.8, range: 7, cd: 2.6, tell: 600, mv: { wave: { amp: 0.8, freq: 5 } } }], loot: LD },
    dream_eater: { name: 'Dream Eater', biome: 'dream', hp: 6000, def: 30, speed: 1.4, xp: 300, r: 0.6, ai: 'shamble', aggro: 10, contact: 120,
      attacks: [{ pattern: 'shotgun', proj: 'dreamstar', count: 7, arc: 0.8, dmg: 95, speed: 6, range: 6, cd: 2.2, tell: 450, mv: { blink: [0.35, 0.25] } }], loot: LD },
    lullaby_moth: { name: 'Lullaby Moth', biome: 'dream', hp: 2400, def: 14, speed: 3.0, xp: 180, r: 0.45, ai: 'orbit', keep: 4, aggro: 11, fly: true,
      attacks: [{ pattern: 'radial', proj: 'pillow_feather', count: 5, turn: 0.6, dmg: 74, speed: 4.5, range: 6, cd: 1.6, tell: 300 }], loot: LD },
    nightmare_knight: { name: 'Nightmare Knight', biome: 'dream', hp: 9000, def: 34, speed: 1.8, xp: 520, r: 0.65, ai: 'flank', keep: 3, aggro: 12, guard: true, contact: 160,
      attacks: [{ pattern: 'wall', proj: 'crescent_moon', count: 7, space: 0.8, dmg: 120, speed: 5, range: 8, cd: 2.6, tell: 550 },
        { pattern: 'aimed', proj: 'nightmare_eye', count: 5, arc: 0.6, dmg: 110, speed: 8, range: 8, cd: 2, tell: 350 }], loot: LD },
    sleepers_nightmare: { name: 'The Sleeper\'s Nightmare', biome: 'dream', hp: 1e9, def: 40, speed: 2.4, xp: 0, r: 1.0, ai: 'orbit', keep: 6, aggro: 40,
      attacks: [{ pattern: 'aimed', proj: 'nightmare_eye', count: 5, arc: 0.7, dmg: 120, speed: 8, range: 10, cd: 1.6, tell: 350 },
        { pattern: 'radial', proj: 'crescent_moon', count: 14, dmg: 115, speed: 4, range: 9, cd: 3, tell: 600 }], loot: [] },
  });
  Object.assign(SPEECH, {
    comb_guard: { see: ['Bzzt! Intruder!', 'For the Queen!'] }, marionette: { see: ['*clack clack*', 'Dance with me!'] },
    prima_donna: { see: ['Encore? ENCORE?', 'Lalalaaaa!'], die: ['...my final... note...'] }, stagehand: { see: ['You\'re not on the call sheet.'] },
    glass_knight: { see: ['Shatter.', 'Hold the light.'] }, prism_eye: { see: ['I see every colour of you.'] },
    night_mare: { see: ['*a scream with hooves*'] }, sleepwalker: { see: ['...five more minutes...', '...mm...'] },
    nightmare_knight: { see: ['Wake, and I end.', 'You are not dreaming this.'] },
  });

  const CH = (w, a, ab, rg, extra) => [{ slot: 'weapon', tiers: w, p: 0.8 }, { slot: 'armor', tiers: a, p: 0.8 }, { slot: 'ability', tiers: ab, p: 0.5 },
    { slot: 'ring', tiers: rg, p: 0.4 }, { stat: true, p: 0.8 }, ...extra];
  DUNGEONS.hive = { name: 'The Honeyed Hollow', floor: 'combfloor', wall: 'waxwall', hazard: null, rooms: 9, portal: 'hive', style: 'hive',
    layout: { secrets: 1 }, seals: [], altar: true, chestLoot: CH([3, 5], [3, 5], [1, 3], [1, 2], [{ id: 'pot_hp', p: 1 }, { id: 'honeyguard_band', p: 0.03 }]),
    mobs: ['worker_bee', 'worker_bee', 'wax_drone', 'honey_grub'], elites: ['comb_guard'], boss: 'honey_queen', mobHp: 1.0, ambient: 'rgba(40,24,4,0.36)' };
  DUNGEONS.theatre = { name: 'The Gilded Marionette Theatre', floor: 'stageboards', wall: 'velvetwall', hazard: null, rooms: 12, portal: 'theatre', style: 'theatre',
    layout: { secrets: 1 }, seals: ['mask', 'mask', 'mask'], chestLoot: CH([5, 8], [5, 8], [2, 4], [2, 4], [{ id: 'pot_mp', p: 1 }, { id: 'the_last_curtain', p: 0.03 }]),
    mobs: ['marionette', 'marionette', 'masked_chorister', 'stagehand'], elites: ['prima_donna', 'stagehand'], boss: 'the_puppeteer', mobHp: 1.3,
    ambient: 'rgba(24,6,16,0.55)', bossW: 35, bossH: 25 };
  DUNGEONS.spire = { name: 'The Prism Lighthouse', floor: 'prismfloor', wall: 'crystalwall', hazard: null, rooms: 11, portal: 'spire', style: 'spire',
    layout: { secrets: 1 }, seals: ['mirror', 'mirror', 'mirror'], chestLoot: CH([8, 10], [9, 11], [4, 5], [4, 5], [{ stat: true, p: 1 }, { id: 'prismglass_mantle', p: 0.03 }]),
    mobs: ['refractor', 'lumen_moth', 'glass_knight', 'lumen_moth'], elites: ['prism_eye', 'glass_knight'], boss: 'prism_wyrm', mobHp: 1.6,
    ambient: 'rgba(10,12,40,0.4)', bossW: 35, bossH: 35 };
  DUNGEONS.dream = { name: 'The Sleeper\'s Dream', floor: 'dreamfloor', wall: 'dreamwall', hazard: null, rooms: 13, portal: 'dream', style: 'islands',
    layout: { secrets: 0 }, seals: ['trial', 'trial', 'trial'], chestLoot: CH([9, 10], [10, 11], [4, 5], [4, 5], [{ stat: true, p: 1 }, { id: 'nightlight_ring', p: 0.03 }]),
    mobs: ['night_mare', 'sleepwalker', 'dream_eater', 'lullaby_moth', 'sleepwalker'], elites: ['nightmare_knight', 'night_mare'], boss: 'the_sleeper', mobHp: 1.8,
    ambient: 'rgba(30,12,60,0.28)' };

  Object.assign(DUNGEONS.hive, { storyTitle: 'A Beekeeper\'s Notes', story: [
    'The bees have moved into the old oak by the fen. Biggest swarm I have ever seen. I will smoke them out tomorrow.',
    'The oak is hollow all the way down. Wax tunnels, cells as big as cottages. The honey glows. I took a jar home.',
    'The jar is empty and I do not remember eating it. My hands smell of wax. I keep humming.',
    'There is a Queen down there. She is the size of a cart and she sang to me. I said I would come back. I came back.',
    'Careful of the honey on the floor. It holds your boots like a lover. The Queen likes her guests to stay.',
  ] });
  Object.assign(DUNGEONS.theatre, { storyTitle: 'Programme for the Final Performance', story: [
    'TONIGHT ONLY: Maestro Vesper presents THE MARIONETTES OF THE GILDED STAGE. No strings attached. (There are strings attached.)',
    'Act I. The Maestro\'s puppets dance so well the audience forgets to breathe. Some of them never remember again.',
    'Act II. The Maestro lost his three masks: Comedy, Tragedy and Silence. Without them the stage stays shut. Return them to the stand.',
    'INTERMISSION. Refreshments are served in the foyer. The understudies will entertain you. Please do not feed the understudies.',
    'Act III. The Finale. The Maestro takes his bow. Audience participation is mandatory.',
  ] });
  Object.assign(DUNGEONS.spire, { storyTitle: 'The Lightkeeper\'s Log', story: [
    'The lamp at World\'s End has burned for a thousand years. Its light is not fire. It is something that lives in the glass.',
    'The light has a name. She calls herself Aurelia. She coils round the lens when she thinks I am asleep.',
    'She sealed the lantern room. The only key is light itself: turn the mirrors in the three wells until each crystal burns.',
    'She cannot be hurt in the dark. Glass hides her. Only the lens, focused, shows her true body. Stand in it, and pray.',
    'Do not hold the light on her too long. I did. The lighthouse has been white ever since.',
  ] });
  Object.assign(DUNGEONS.dream, { storyTitle: 'Pages Found Under a Pillow', story: [
    'Something is asleep beneath the Realm. When it dreams, we walk in its dream. Tonight it dreamed of me.',
    'The bridges here are made of half-remembered things. They fade when you forget them. Do not forget them.',
    'Three nightmares guard the way to the Sleeper. Stand in their circle and they come for you. Live, and they let you pass.',
    'Do not stand still. Stillness is sleep, and sleep is how it keeps you.',
    'It cannot be woken. It must be woken. Ring every alarm you can find, and run.',
  ] });

  DUNGEON_BOSSES.honey_queen = {
    name: 'Queen Melliflua, the Honeyed Mother', biome: 'hive', sheet: 'pack_bosses', hp: 52000, def: 6, xp: 4500, r: 1.5, speed: 1.0, keep: 6, summon: 'worker_bee',
    phases: [
      { at: 1, name: 'The Queen rises from her comb.', cycle: ['hexsting', 'swarm', 'brood', 'hexsting', 'swarm'] },
      { at: 0.55, name: 'THE HIVE SWARMS.', open: 'honeyrain', cycle: ['waggle', 'hexsting', 'honeyrain', 'swarm', 'brood', 'waggle'] },
      { at: 0.22, name: 'The Queen is furious!', open: 'brood', cycle: ['honeyrain', 'waggle', 'swarm', 'hexsting', 'waggle', 'honeyrain'] },
    ],
    moves: {
      hexsting: { tell: 0.6, hexburst: { rings: 2, gap: 0.35, n: 6, per: 3, spread: 0.16, speed: 6, dmg: 46, proj: 'royal_sting' }, recover: 0.6 },
      swarm: { tell: 0.5, swarm: { n: 16, every: 0.08, speed: 4.5, dmg: 34, proj: 'beeshot', jitter: 2.4, seek: 0.9 }, recover: 0.5 },
      brood: { special: true, tell: 0.7, brood: { n: 4, hatch: 6, kid: 'worker_bee' }, recover: 0.5 },
      waggle: { tell: 0.6, waggle: { n: 10, dur: 2.2, r: 3.2, speed: 6, dmg: 40, proj: 'nectar' }, recover: 0.6 },
      honeyrain: { special: true, tell: 0.8, drip: { n: 7, delay: 1.0, r: 1.4, dmg: 52, puddle: 7, proj: 'honeyglob' }, recover: 0.6 },
    },
    loot: [{ slot: 'weapon', tiers: [4, 6], p: 1 }, { slot: 'armor', tiers: [4, 6], p: 1 }, { slot: 'ability', tiers: [2, 3], p: 0.6 }, { slot: 'ring', tiers: [2, 3], p: 0.5 },
      { stat: true, p: 0.8 }, { id: 'queens_stinger', p: 0.12 }, { id: 'honeyguard_band', p: 0.1 }, ...MYTHIC(0.005)],
  };
  DUNGEON_BOSSES.the_puppeteer = {
    name: 'Maestro Vesper, the Puppeteer', biome: 'theatre', sheet: 'pack_bosses', hp: 140000, def: 22, xp: 9000, r: 1.5, speed: 1.2, keep: 7,
    phases: [
      { at: 1, name: 'Places, everyone.', open: 'strings', cycle: ['jig', 'scissors', 'bow', 'jig', 'curtain'] },
      { at: 0.55, intermission: 22, name: 'INTERMISSION! The understudies take the stage.', cycle: ['mimic', 'scissors', 'jig', 'curtain', 'bow'] },
      { at: 0.25, name: 'THE FINALE!', open: 'strings', cycle: ['mimic', 'scissors', 'curtain', 'jig', 'bow', 'scissors'] },
    ],
    moves: {
      strings: { special: true, tell: 0.9, strings: { n: 4, r: 7 }, recover: 0.6 },
      jig: { tell: 0.5, jig: { arms: 9, waves: 3, gap: 0.4, step: 0.22, speed: 5.5, dmg: 72, proj: 'puppet_string' }, recover: 0.6 },
      scissors: { tell: 0.7, scissors: { n: 8, len: 9, dur: 1.2, open: 1.1, dmg: 82, proj: 'scissor_blade' }, recover: 0.6 },
      curtain: { special: true, tell: 0.9, curtain: { dur: 5, close: 0.4, dmg: 60 }, recover: 0.5 },
      mimic: { special: true, tell: 0.8, mimic: { dur: 10 }, recover: 0.5 },
      bow: { tell: 0.5, ribbons: { n: 5, arc: 0.9, speed: 7, dmg: 78, proj: 'ribbon', serp: 3.4 }, recover: 0.5 },
    },
    loot: [{ slot: 'weapon', tiers: [6, 8], p: 1 }, { slot: 'armor', tiers: [7, 9], p: 1 }, { slot: 'ability', tiers: [3, 4], p: 0.7 }, { slot: 'ring', tiers: [3, 4], p: 0.6 },
      { stat: true, p: 1 }, { id: 'maestros_baton', p: 0.1 }, { id: 'the_last_curtain', p: 0.1 }, { id: 'stringcutter', p: 0.08 }, ...MYTHIC(0.012)],
  };
  DUNGEON_BOSSES.prism_wyrm = {
    name: 'Aurelia, the Prism Wyrm', biome: 'prism', sheet: 'pack_bosses', hp: 380000, def: 36, xp: 16000, r: 1.6, speed: 1.6, keep: 6, prismatic: true,
    phases: [
      { at: 1, name: 'The lantern turns. Stand in the lens light to break her glass!', cycle: ['disperse', 'helix', 'glassrain', 'disperse', 'sunbeam'] },
      { at: 0.55, name: 'PRISMATIC: which of her is real?', open: 'images', cycle: ['shuffle', 'disperse', 'images', 'helix', 'sunbeam', 'glassrain'] },
      { at: 0.22, overcharge: true, name: 'OVERCHARGE: pulse the light, never hold it!', open: 'shuffle', cycle: ['glassrain', 'disperse', 'sunbeam', 'helix', 'images', 'disperse'] },
    ],
    moves: {
      disperse: { tell: 0.6, disperse: { n: 3, arc: 0.5, speed: 7, at: 0.45, fan: 7, dmg: 110, proj: 'white_bolt' }, recover: 0.6 },
      sunbeam: { special: true, tell: 0.8, sunbeam: { dur: 5, r: 1.3, lag: 1.4, dmg: 70 }, recover: 0.5 },
      glassrain: { tell: 0.7, glassrain: { cols: 11, gaps: 2, waves: 3, gap: 0.85, speed: 7, dmg: 105, proj: 'glass_pane' }, recover: 0.6 },
      helix: { tell: 0.6, helix: { arms: 3, n: 9, every: 0.12, w: 2.2, v: 3.4, dmg: 100, proj: 'refraction' }, recover: 0.6 },
      images: { special: true, tell: 0.9, images: { n: 2 }, recover: 0.5 },
      shuffle: { special: true, tell: 0.6, shuffle: true, recover: 0.3 },
    },
    loot: [{ slot: 'weapon', tiers: [9, 10], p: 1 }, { slot: 'armor', tiers: [10, 11], p: 1 }, { slot: 'ability', tiers: [4, 5], p: 0.8 }, { slot: 'ring', tiers: [4, 5], p: 0.8 },
      { stat: true, p: 1 }, { stat: true, p: 0.7 }, { id: 'wyrmglass_wand', p: 0.1 }, { id: 'prismglass_mantle', p: 0.1 }, { id: 'the_seventh_colour', p: 0.07 }, ...MYTHIC(0.025)],
  };
  DUNGEON_BOSSES.the_sleeper = {
    name: 'The Sleeper, Who Dreams the Realm', biome: 'dream', sheet: 'pack_bosses', hp: 520000, def: 40, xp: 22000, r: 1.7, speed: 1.0, keep: 7, drowsy: true, bloodlust: true,
    phases: [
      { at: 1, name: 'It dreams of you. Keep moving: stillness is sleep.', cycle: ['sheep', 'lullaby', 'stars', 'sheep', 'crescents'] },
      { at: 0.62, name: 'THE DREAM TURNS.', open: 'dreamshift', cycle: ['dreamshift', 'sheep', 'stars', 'crescents', 'lullaby'] },
      { at: 0.32, name: 'THE NIGHTMARE WAKES.', open: 'dreamlogic', cycle: ['dreamlogic', 'crescents', 'dreamshift', 'stars', 'sheep', 'lullaby'] },
      { at: 0.1, wake: 3, name: 'IT WILL NOT WAKE. Ring the three alarms!', cycle: ['crescents', 'stars', 'sheep', 'lullaby'] },
    ],
    moves: {
      sheep: { tell: 0.6, sheep: { rows: 3, n: 7, hop: 0.55, speed: 5.5, dmg: 120, proj: 'sheep' }, recover: 0.6 },
      lullaby: { tell: 0.6, lullaby: { n: 12, waves: 3, gap: 0.5, speed: 2.6, dmg: 60, drowsy: 0.35, proj: 'zzz' }, recover: 0.6 },
      crescents: { tell: 0.8, crescents: { n: 16, r: 13, speed: 4.2, dmg: 115, proj: 'crescent_moon' }, recover: 0.6 },
      stars: { tell: 0.6, blinkstars: { n: 22, speed: 3.4, on: 0.5, off: 0.35, dmg: 100, proj: 'dreamstar' }, recover: 0.6 },
      dreamshift: { special: true, tell: 1.0, dreamshift: { dur: 11 }, recover: 0.5 },
      dreamlogic: { special: true, tell: 1.0, invert: { dur: 4.5 }, recover: 0.6 },
    },
    loot: [{ slot: 'weapon', tiers: [10, 10], p: 1 }, { slot: 'armor', tiers: [11, 11], p: 1 }, { slot: 'ability', tiers: [5, 5], p: 0.9 }, { slot: 'ring', tiers: [5, 5], p: 0.9 },
      { stat: true, p: 1 }, { stat: true, p: 1 }, { id: 'lullaby_staff', p: 0.1 }, { id: 'nightlight_ring', p: 0.1 }, { id: 'the_waking_bell', p: 0.07 }, ...MYTHIC(0.04)],
  };
  Object.assign(SPEECH, {
    honey_queen: { see: ['Welcome to my hive, little drone.', 'Stay. Stay forever. Bzz.', 'My children are hungry!'], die: ['...my... hive...'] },
    the_puppeteer: { see: ['The show must go on!', 'Dance, puppet. DANCE.', 'Bravo! Bravo!'], die: ['...curtain...'] },
    prism_wyrm: { see: ['You cannot touch what you cannot see.', 'I am every colour at once.'], die: ['...the light... goes out...'] },
    the_sleeper: { see: ['...shhh...', '...mmmh... five more aeons...', '...you are part of my dream...'], die: ['...i... am... awake...'] },
  });
}
// where their portals come from
{
  const prev = portalDrop2;
  // the new dungeons open from the realm too (wrapping the older table)
  PORTAL_EXTRA.push((D, id) => {
    if (id === 'emily_the_yapper') return ['theatre', 1];
    if (id === 'the_fallen_star') return Math.random() < 0.5 ? ['dream', 1] : null;
    if (id === 'penitent_colossus') return Math.random() < 0.5 ? ['spire', 1] : null;
    if (D.biome === 'thornwood' || D.biome === 'fen') return Math.random() < 0.5 ? ['hive', D.children ? 0.06 : 0.015] : null;
    if (D.biome === 'dunes' || D.biome === 'runeholt') return Math.random() < 0.4 ? ['theatre', D.children ? 0.05 : 0.01] : null;
    if (D.biome === 'steppe') return Math.random() < 0.5 ? ['spire', D.children ? 0.04 : 0.008] : null;
    if (D.biome === 'godfall' && D.children) return Math.random() < 0.35 ? ['dream', 0.03] : null;
    return null;
  });
  void prev;
}

// the big ones among the newer dungeons' adds are drawn a size up
for (const [id, k] of [['prism_image', 2.6], ['sleepers_nightmare', 2.4], ['hanging_marionette', 1.6], ['understudy', 1.5], ['comb_guard', 1.3], ['prima_donna', 1.4], ['nightmare_knight', 1.5], ['glass_knight', 1.3]]) ENEMIES[id].scale = k;
