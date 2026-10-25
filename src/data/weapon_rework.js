// The item rework (realm_505_item_rework_blueprint.md), weapons: each UT, Mythic and Legendary weapon gets one distinct
// hook (src/weaponmech.js) in place of its old pile of on-hit effects. Tiered weapons keep their plain behaviour.
// Applied last, over every earlier pass (items.js). Numbers are tuned with tools/bench_weapons.mjs against the tiers.
// mech: { kind, theme, ...its numbers }; stats: replaces those weapon numbers (count, dmg, rate, arc, pierce, ...)
export const WEAPON_REWORK = {
  // ---- swords
  billet_of_the_first_oath: { stats: { dmg: [250, 340] }, mech: { kind: 'curve', theme: 'fire', turn: 1.0 } },
  knuckle_of_the_unstruck: { stats: { count: 1, arc: 0, dmg: [120, 170] }, mech: { kind: 'follow', theme: 'arcane', f: 0.5, r: 1.2 } },
  bog_cleaver: { stats: { dmg: [160, 230] }, mech: { kind: 'shards', theme: 'nature', f: 0.4, len: 1.8 } },
  emberbrand_greatsword: { stats: { count: 1 }, mech: { kind: 'converge', theme: 'fire', pairF: 0.62, meet: 0.55 } },
  godheart_knuckle: { stats: { count: 1, arc: 0, dmg: [200, 260] }, mech: { kind: 'dart', theme: 'blood', at: 0.7, hold: 0.12, s: 1.7, f: 1.2 } },
  godheart_tongs: { mech: { kind: 'shards', theme: 'blood', f: 0.4, len: 2 } },
  melon_slicer: { mech: { kind: 'follow', theme: 'ice', f: 0.5, r: 1.2 } },
  oathbreaker: { mech: { kind: 'brand', theme: 'rune', f: 0.6, len: 2.2, heal: 0.12 } },
  oathsworn_greatsword: { stats: { dmg: [220, 300] }, mech: { kind: 'shards', theme: 'rune', f: 0.45, len: 2 } },
  pitfighters_cleaver: { mech: { kind: 'converge', theme: 'arcane', pairF: 0.62, meet: 0.5 } },
  runewarden_blade: { mech: { kind: 'stack', theme: 'rune', cash: 0.6 } },
  starfall_knuckles: { stats: { dmg: [70, 100] }, mech: { kind: 'starfall', theme: 'astral', every: 4, f: 2, r: 1.6, sparkF: 0.5 } },
  starforged_katana: { mech: { kind: 'follow', theme: 'astral', every: 3, cross: true, f: 0.9 } },
  sunscorch_khopesh: { stats: { dmg: [140, 210] }, mech: { kind: 'stack', theme: 'astral', cash: 0.6 } },
  abbots_claw: { stats: { count: 1, arc: 0, dmg: [175, 245] }, mech: { kind: 'curve', theme: 'sea', turn: 1.4 } },
  cinder_saints_fist: { stats: { count: 1, arc: 0, dmg: [150, 205] }, mech: { kind: 'converge', theme: 'fire', pairF: 0.62, meet: 0.5 } },
  forgeheart_maul: { stats: { dmg: [430, 590] }, mech: { kind: 'curve', theme: 'fire', turn: 0.9,
    charge: { need: 10, name: 'Forgeheart', n: 1, arc: 0, f: 3, cap: 3, blast: { r: 2, f: 0.8, max: 6 } } } },
  nightfall_scythe: { stats: { dmg: [115, 160] }, mech: { kind: 'stack', theme: 'blood', cash: 0.4,
    charge: { need: 10, name: 'Nightfall', n: 5, arc: 0.9, f: 1.4, cap: 2, heal: { f: 0.04, max: 4 } } } },
  penitents_head: { mech: { kind: 'glyph', theme: 'death', r: 1.3, f: 0.7 } },
  penitents_scourge: { stats: { count: 3, dmg: [75, 105] }, mech: { kind: 'center', theme: 'death', arc: 0.1, flankF: 0.6, mark: 0.2 } },
  quenching_tongs: { mech: { kind: 'glyph', theme: 'ice', r: 1.3, f: 0.65 } },
  hammer_that_never_fell: { stats: { rate: 0.62 }, mech: { kind: 'phantom', theme: 'sea', delay: 0.6, r: 1.4, f: 1.2, stun: 0.4 } },
  tallow_tongs: { stats: { dmg: [150, 205] }, mech: { kind: 'stack', theme: 'death', cash: 0.6 } },
  tidecaller_blade: { mech: { kind: 'stack', theme: 'sea', cash: 0.6 } },
  // ---- daggers
  the_feint: { stats: { dmg: [95, 138] }, mech: { kind: 'curve', theme: 'arcane', turn: 1.6 } },
  glacial_fang: { mech: { kind: 'shards', theme: 'ice', f: 0.4, len: 1.6 } },
  glassfencer_dirk: { mech: { kind: 'glyph', theme: 'glass', r: 1.2, f: 0.4 } },
  jugglers_dagger: { stats: { dmg: [108, 158] }, mech: { kind: 'follow', theme: 'arcane', f: 0.2, r: 1.2 } },
  melon_baller: { mech: { kind: 'glyph', theme: 'honey', r: 1.2, f: 0.25 } },
  stringcutter: { stats: { count: 1, arc: 0, dmg: [125, 180] }, mech: { kind: 'glyph', theme: 'song', r: 1.2, f: 0.4 } },
  crimson_rapier: { mech: { kind: 'shards', theme: 'blood', f: 0.4, len: 1.6 } },
  the_last_reflection: { stats: { count: 1, arc: 0, dmg: [120, 170] }, mech: { kind: 'shards', theme: 'fire', f: 0.4, len: 1.8 } },
  the_mirrorworld: { stats: { count: 1, arc: 0, dmg: [95, 132] }, mech: { kind: 'mirror', theme: 'glass', f: 0.7, delay: 0.25 } },
  queens_stinger: { stats: { dmg: [130, 195] }, mech: { kind: 'converge', theme: 'honey', pairF: 0.62, meet: 0.55 } },
  // ---- bows
  batwing_bow: { stats: { count: 1, arc: 0, dmg: [185, 275] }, mech: { kind: 'dart', theme: 'blood', at: 0.6, hold: 0.15, s: 2.1, f: 1.15 } },
  carousel_bow: { stats: { count: 1, arc: 0, dmg: [190, 290] }, mech: { kind: 'dart', theme: 'song', at: 0.7, hold: 0.12, s: 1.7, f: 1.2 } },
  comet_bow: { stats: { dmg: [87, 137] }, mech: { kind: 'comet', theme: 'astral', every: 5, r: 1.3, f: 3 } },
  heartwood_bow: { stats: { count: 1, arc: 0, dmg: [115, 185] }, mech: { kind: 'follow', theme: 'nature', f: 0.5, r: 1.2 } },
  kraken_bane: { mech: { kind: 'stack', theme: 'sea', cash: 0.5 } },
  leviathan_longbow: { stats: { dmg: [70, 101] }, mech: { kind: 'stack', theme: 'sea', cash: 0.4 } },
  rimeheart_bow: { stats: { count: 1, arc: 0, dmg: [175, 280] }, mech: { kind: 'shards', theme: 'ice', f: 0.4, len: 1.8 } },
  seedspitter_bow: { stats: { count: 3, dmg: [92, 148] }, mech: { kind: 'center', theme: 'nature', arc: 0.1, flankF: 0.6, mark: 0.2 } },
  leviathan_tine: { stats: { dmg: [240, 330] }, mech: { kind: 'stack', theme: 'sea', cash: 0.7 } },
  the_white_whale: { mech: { kind: 'whale', theme: 'sea', foam: 'bubble', foamF: 0.3, underF: 0.8, delay: 0.5, r: 1.5 } },
  // ---- staves
  bloodthorn_staff: { stats: { count: 1, arc: 0, dmg: [120, 185] }, mech: { kind: 'follow', theme: 'nature', f: 0.4, r: 1.2 } },
  cinderwood_staff: { stats: { count: 1, arc: 0, dmg: [160, 240] }, mech: { kind: 'dart', theme: 'fire', at: 0.7, hold: 0.12, s: 1.6, f: 1.2 } },
  graverite_staff: { stats: { count: 3, dmg: [77, 109] }, mech: { kind: 'center', theme: 'death', arc: 0.12, flankF: 0.6, mark: 0.22 } },
  heaven_wire: { stats: { count: 3, dmg: [62, 90] }, mech: { kind: 'center', theme: 'storm', arc: 0.09, flankF: 0.6, mark: 0.18 } },
  staff_of_drowned_stars: { stats: { count: 1, arc: 0, dmg: [150, 220] }, mech: { kind: 'follow', theme: 'astral', f: 0.3, r: 1.3 } },
  hexcircle_staff: { stats: { dmg: [73, 108] }, mech: { kind: 'stack', theme: 'rune', cash: 0.5 } },
  lantern_of_the_last_watch: { stats: { count: 1, arc: 0, dmg: [120, 170] }, mech: { kind: 'follow', theme: 'time', f: 0.45, r: 1.3 } },
  tempest_staff: { stats: { count: 1, arc: 0, dmg: [135, 195] }, mech: { kind: 'glyph', theme: 'storm', r: 1.3, f: 0.35 } },
  the_bone_lantern: { stats: { count: 3, dmg: [77, 109] }, mech: { kind: 'center', theme: 'death', arc: 0.14, flankF: 0.55, mark: 0.22 } },
  the_first_storm: { stats: { dmg: [84, 114] }, mech: { kind: 'stack', theme: 'storm', cash: 1.0, strike: 1.2 } },
  the_lightning_rod: { stats: { count: 3, dmg: [57, 81] }, mech: { kind: 'center', theme: 'storm', arc: 0.11, flankF: 0.65, mark: 0.15 } },
  lullaby_staff: { stats: { count: 3, dmg: [73, 106] }, mech: { kind: 'center', theme: 'song', arc: 0.12, flankF: 0.6, mark: 0.2 } },
  tidewraith_staff: { stats: { count: 1, arc: 0, dmg: [170, 250] }, mech: { kind: 'glyph', theme: 'sea', r: 1.4, f: 0.5,
    charge: { need: 10, name: 'Tidewraith', n: 3, arc: 0.5, f: 1.6, cap: 3, blast: { r: 1.6, f: 0.6, max: 5 } } } },
  the_unburied_choir: { stats: { dmg: [83, 116] }, mech: { kind: 'choir', theme: 'death', f: 1.0, mana: 12 } },
  the_witchs_eye: { stats: { dmg: [93, 132] }, mech: { kind: 'witch', theme: 'arcane', r: 1.4, f: 1.2 } },
  tidebreaker_trident: { stats: { dmg: [63, 95] }, mech: { kind: 'curve', theme: 'sea', turn: 0.8 } },
  vinegrown_staff: { stats: { dmg: [100, 160] }, mech: { kind: 'curve', theme: 'nature', turn: 0.9 } },
  // ---- wands
  clockwork_wand: { stats: { dmg: [110, 153] }, mech: { kind: 'follow', theme: 'time', f: 0.4, r: 1.5 } },
  dawnchoir_wand: { stats: { dmg: [114, 162] }, mech: { kind: 'shards', theme: 'dawn', f: 0.4, len: 2 } },
  dawnbreaker: { mech: { kind: 'glyph', theme: 'dawn', r: 1.3, f: 0.5 } },
  gilded_scepter: { stats: { count: 3, dmg: [44, 70] }, mech: { kind: 'center', theme: 'arcane', arc: 0.08, flankF: 0.6, mark: 0.2 } },
  godheart_scepter: { stats: { dmg: [35, 52] }, mech: { kind: 'stack', theme: 'blood', cash: 0.45 } },
  honeydew_scepter: { stats: { dmg: [145, 235] }, mech: { kind: 'dart', theme: 'honey', at: 0.75, hold: 0.1, s: 1.8, f: 1.25 } },
  sporecaller_wand: { stats: { count: 3, dmg: [52, 82] }, mech: { kind: 'center', theme: 'nature', arc: 0.1, flankF: 0.55, mark: 0.2 } },
  abbots_crozier: { stats: { dmg: [63, 98] }, mech: { kind: 'glyph', theme: 'sea', r: 1.3, f: 0.55 } },
  orrery_rod: { stats: { count: 1, arc: 0, dmg: [105, 155] }, mech: { kind: 'dart', theme: 'astral', at: 0.65, hold: 0.14, s: 1.9, f: 1.2 } },
  the_cuckoo: { stats: { dmg: [70, 99] }, mech: { kind: 'stack', theme: 'time', cash: 0.55 } },
  the_last_second: { stats: { dmg: [52, 68] }, mech: { kind: 'echo', theme: 'time' } },
  maestros_baton: { stats: { count: 3, dmg: [47, 66] }, mech: { kind: 'center', theme: 'song', arc: 0.1, flankF: 0.6, mark: 0.18 } },
  ringmaster_cane: { mech: { kind: 'curve', theme: 'song', turn: 0.8 } },
  sunless_psalter: { stats: { count: 1, arc: 0, dmg: [58, 86] }, mech: { kind: 'page', theme: 'death', halfF: 0.6, expose: 0.25 } },
  wand_of_hoarfrost: { stats: { count: 3, dmg: [51, 82] }, mech: { kind: 'center', theme: 'ice', arc: 0.1, flankF: 0.6, mark: 0.2 } },
  the_eleventh_hour: { stats: { count: 3, dmg: [62, 90] }, mech: { kind: 'center', theme: 'time', arc: 0.16, flankF: 0.6, mark: 0.2 } },
  wyrmglass_wand: { mech: { kind: 'follow', theme: 'ice', f: 0.45, r: 1.3 } },
};

// one line for the tooltip
export function mechLine(M) {
  const pc = (f) => `${Math.round(f * 100)}%`;
  const L = {
    curve: 'Its cut curves; every third swing curves the other way',
    follow: M.cross ? `Every ${M.every || 1}${M.every ? 'rd' : ''} hit marks the enemy; your next swing cuts across the mark (${pc(M.f)})` : `A hit marks the enemy; your next swing bursts the mark (${pc(M.f)})`,
    shards: `The first hit throws two shards out to the sides (${pc(M.f)})`,
    converge: 'Swings alternate: one narrow cut, then a pair that meets at mid-range',
    dart: `Stops short, then darts onward once, harder (${pc(M.f)})`,
    stack: `Left hand, right hand: the second hit on an enemy ${({ fire: 'burns', blood: 'bleeds', ice: 'chills', sea: 'slows', astral: 'slows', nature: 'slows', rune: 'hexes', death: 'hexes', arcane: 'hexes' })[M.theme] || 'hexes'} it, the third cashes it in (+${pc(M.cash)})`,
    glyph: `Cuts through the first enemy and leaves a glyph; your next swing detonates it (${pc(M.f)})`,
    center: `Three cuts: the outer two hit softer, the centre marks (+${pc(M.mark)} damage taken)`,
    phantom: `Where it strikes, a phantom blow lands ${M.delay}s later (${pc(M.f)})`,
    starfall: `Every ${M.every}th volley that hits calls a star onto your target, which bursts into four sparks`,
    brand: `Hits brand an enemy; the third brand cracks into two blades and heals you (${pc(M.heal)} of the hit)`,
    mirror: `A hit sends a mirrored echo back through the enemy ${M.delay}s later (${pc(M.f)})`,
    whale: 'A harpoon: when it pierces, it leaves a wake of foam, and an undertow crashes where it comes to rest',
    comet: `Fires a converging pair; every ${M.every}th volley calls a comet onto your cursor`,
    choir: `Each enemy hit adds a voice; three voices sound a chord between them (${pc(M.f)}) and give you ${M.mana} Mana`,
    witch: 'Every third volley is an eye that marks; two more hits on the mark burst it into a hex',
    echo: 'A hit stores a beat: your next volley repeats that shot from where it ended',
    page: 'A slow page flies out, then splits in two on its way back; both halves on one enemy expose it (+' + pc(M.expose) + ' damage taken)',
  }[M.kind];
  const C = M.charge;
  return C ? [L, `Legendary: ${C.need} volleys that hit charge ${C.name}, your next swing's signature strike`] : [L];
}

export function applyWeaponRework(ITEMS) {
  if (globalThis.NO_WEAPON_REWORK) return;                  // (tools/bench_weapons.mjs --before: the weapons as they were)
  for (const [id, R] of Object.entries(WEAPON_REWORK)) {
    const it = ITEMS[id];
    if (!it || !it.weapon) continue;
    it.weapon = { ...it.weapon, ...(R.stats || {}), special: { mech: R.mech } };   // the one hook replaces the old effects
    it.reworked = true;
  }
}
