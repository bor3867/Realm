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
