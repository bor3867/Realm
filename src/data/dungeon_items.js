// The dungeons' own items: names that say what they are, and something only that dungeon could give you.
// Each dungeon's relics bring a part of it along: things that orbit you (src/orbiters.js) and guard or strike.
// A name's noun matches the item's kind (a halo is a halo, a ring is a ring): no more orbs that are halos.
// Also here: no item's shots seek (the player asked for none), whatever its data says.
const ORB = (o) => ({ orbit: o });
export const DUNGEON_ITEMS = {
  // the Astral Observatory: planets, moons and black holes
  orrery_orb: { name: 'The Orrery Halo', desc: 'A little brass sky. Raise it and the light falls where you point, while three planets and a black hole wheel round you for eight seconds.',
    sig: { kind: 'orbit', life: 8, dmg: 0, sets: [
      { kind: 'body', n: 3, r: 1.8, w: 2.4, dmg: 160, sprite: 'bx_shots/grand_orrery.moon_shard', scale: 1.6, block: { n: 2, rest: 1.5 } },
      { kind: 'hole', n: 1, r: 3.3, w: -1.1, dmg: 90, pull: 3, block: { n: 10, rest: 3 } }] } },
  event_horizon: { desc: 'What is left of the machine\'s heart. A black hole circles you, swallowing shots and dragging monsters in. Keep moving, and you hit harder.',
    passive: ORB({ kind: 'hole', n: 1, r: 2.1, w: 1.4, dmg: 120, pull: 2.4, block: { n: 5, rest: 5 } }) },
  astral_signet: { desc: 'Its face is a tiny orrery. Two brass moons leave it and circle you, turning shots aside.',
    passive: ORB({ kind: 'body', n: 2, r: 1.4, w: 3, dmg: 80, sprite: 'ap_shots/astrolabe_sentinel.astro_disc', scale: 1.2, block: { n: 1, rest: 3 } }) },
  nebula_robe: { desc: 'Woven from the dust between stars. Your gifts come cheaper, and the dust that trails you burns and slows whatever comes close.',
    passive: { aura: { dps: 30, r: 2.4, slow: 0.15 } } },
  comet_bow: { desc: 'Each arrow drags a tail of light behind it, and every fifth volley calls a comet down where you aim.' },
  // the Drowned Chapel
  drowned_bell: { name: 'Ring of the Drowned Bell', desc: 'A bell on a band, still ringing underwater. It circles you and tolls, throwing holy water at whatever is nearest.',
    passive: ORB({ kind: 'body', n: 1, r: 1.6, w: 2, dmg: 60, sprite: 'rx_shots/bog_bellringer.little_bell', scale: 1.5, fire: { every: 2.5, n: 3, proj: 'rx_shots/drowned_abbot.holy_droplet', dmg: 110, speed: 9, range: 6 } }) },
  // the Fallen Heart
  crown_of_the_fallen: { name: 'Band of the Fallen Crown', desc: 'A ring cut from the crown of a god that fell. Shards of its heart circle you; each one they cut mends you a little.',
    passive: ORB({ kind: 'body', n: 3, r: 1.5, w: 3.2, dmg: 110, heal: 4, sprite: 'rx_shots/fallen_heart.heart_shard', scale: 1.3 }) },
  // the Scriptorium
  starless_band: { desc: 'A ring of night with no stars in it. Four dark stars orbit you and blot out shots.',
    passive: ORB({ kind: 'body', n: 4, r: 1.7, w: -2.4, dmg: 70, sprite: 'el_shots/void_seer.rift_star', scale: 1.2, block: { n: 1, rest: 3 } }) },
  // the Unstruck God's throne
  crown_of_the_unstruck: { name: 'Band of the Sunthief\'s Crown', desc: 'The crown, beaten into a ring. Four gilded motes keep their orbit round you, and nothing gets through them twice.',
    passive: ORB({ kind: 'body', n: 4, r: 1.9, w: 2.6, dmg: 220, sprite: 'rx_shots/the_unstruck_god.orbit_mote', scale: 1.5, block: { n: 1, rest: 2 } }) },
  // Frostveil Hollows
  ring_of_the_wyrm: { desc: 'A scale from its coil, bent into a band. Three ice lances circle you; what they touch is chilled, and they turn shots aside.',
    passive: ORB({ kind: 'body', n: 3, r: 1.6, w: 2.2, dmg: 90, slow: 0.3, sprite: 'bx_shots/glacius_frozen_wyrm.ice_lance', scale: 1.1, block: { n: 1, rest: 3 } }) },
  aurora_heart: { name: 'Ring of the Aurora Heart', desc: 'The light that moved inside the wyrm\'s chest, set in a ring. Nothing can slow you while it is yours.' },
  // Mirerot Grotto
  mycelial_hide: { desc: 'Grown over a frame of roots. Poison has nothing left to take from you, and four spores drift round you, poisoning what they touch.',
    passive: ORB({ kind: 'body', n: 4, r: 1.5, w: 1.6, dmg: 50, burn: 45, sprite: 'bx_shots/mother_mycelia.spore_puff', scale: 1.3 }) },
  spore_bomb: { name: 'The Spore Bellows', desc: 'A bellows stuffed with spores. Charge, and leave a cloud behind you.' },
  glowcap_crown: { name: 'The Glowcap Ring', desc: 'A ring of glowing caps. Whatever dies near you feeds it, and it feeds you.' },
  // Sandscour Tomb
  scarab_ring: { desc: 'A beetle of blue faience. Two cursed scarabs climb off it and circle you, biting what comes close and catching shots.',
    passive: ORB({ kind: 'body', n: 2, r: 1.3, w: 3.4, dmg: 140, sprite: 'bx_shots/gilded_sphinx.cursed_scarab', scale: 1.3, block: { n: 1, rest: 2.5 } }) },
  sphinx_helm: { name: 'Seal of the Sphinx', desc: 'Swear on the riddle. It crowns you in gold and throws the sand back at them.' },
  pharaohs_deathmask: { name: 'The Pharaoh\'s Signet', desc: 'A gold ring with a dead king\'s face on it. Every death you cause, it drinks, and shares.' },
  // the Crimson Keep
  signet_of_the_count: { desc: 'His crest in garnet: a bat over a crown. Three bats circle you; every bite feeds you.',
    passive: ORB({ kind: 'body', n: 3, r: 1.6, w: 3, dmg: 90, heal: 5, sprite: 'bx2_shots/count_vesper.bat_swarm', scale: 1.2 }) },
  crimson_chalice: { name: 'The Crimson Reliquary', desc: 'A reliquary shaped like a chalice. Open it, and those around you bleed for your health.' },
  nightfall_scythe: { name: 'The Nightfall Blade', desc: 'The Count\'s own sword, curved like a scythe. Night falls in a wide red arc, and drinks.' },
  // the Hollowmoon Carnival
  ring_of_the_jester: { desc: 'It jingles. Three juggling pins circle you, and every so often one is thrown at whatever is nearest.',
    passive: ORB({ kind: 'body', n: 3, r: 1.5, w: 4, dmg: 70, sprite: 'bx2_shots/grinning_ringmaster.juggling_pin', scale: 1.2, fire: { every: 1.6, proj: 'bx2_shots/grinning_ringmaster.juggling_pin', dmg: 130, speed: 11, range: 6.5 } }) },
  trick_deck: { name: 'The Grimoire of Tricks', desc: 'A grimoire of playing cards. Pick a page, any page. They all curse.' },
  grinning_mask: { name: 'The Grinning Ring', desc: 'A ring with a grinning face. When you land a lucky blow, it laughs, and the blow lands three times over.' },
  ringmaster_cane: { name: 'The Ringmaster\'s Wand', desc: 'His cane, cut down to a wand. Point it and say "and now". Something always happens.' },
  carousel_bow: { desc: 'Painted horses gallop round its grip. Its arrows start slow and go faster and faster.' },
  // the Tidebound Crypt
  ring_of_tides: { desc: 'Cold, and always wet. Three lost souls circle you and take the shots meant for you.',
    passive: ORB({ kind: 'body', n: 3, r: 1.7, w: -2.2, dmg: 100, sprite: 'bx_shots/tidebound_lich.lost_soul', scale: 1.3, block: { n: 1, rest: 2.5 } }) },
  soul_lantern: { name: 'The Soul Reliquary', desc: 'A reliquary that burns like a lantern. Its dead climb out, and go out with a bang.' },
  // the Emberforge
  emberheart_ring: { desc: 'A coal that never cools, set in a ring. Three magma orbs circle you and set alight whatever they touch.',
    passive: ORB({ kind: 'body', n: 3, r: 1.6, w: 2.8, dmg: 130, burn: 70, sprite: 'bx_shots/forgeheart_colossus.magma_orb', scale: 1.2 }) },
  colossus_core: { name: 'The Colossus Bellows', desc: 'The bellows from the Colossus\'s chest. Charge, and the ground burns behind you.' },
  forgeheart_maul: { name: 'The Forgeheart Greatblade', desc: 'Too heavy to swing, and you swing it anyway. Every blow throws a ring of sparks.' },
  // the Hive
  honeyguard_band: { desc: 'Wax and gold. Four bees guard you, stinging what comes close and slowing it with honey.',
    passive: ORB({ kind: 'body', n: 4, r: 1.4, w: 3.6, dmg: 70, slow: 0.2, sprite: 'rx_shots/honey_queen.drone', scale: 1.2 }) },
  // the Puppeteer's Theatre
  the_last_curtain: { desc: 'Heavy velvet. Two masks dance round you, comedy and tragedy, and catch shots for you.',
    passive: ORB([{ kind: 'body', n: 1, r: 1.5, w: 2.4, dmg: 90, sprite: 'rx_shots/the_puppeteer.comedy_mask', scale: 1.3, block: { n: 1, rest: 2 } },
      { kind: 'body', n: 1, r: 1.5, w: -2.4, dmg: 90, sprite: 'rx_shots/the_puppeteer.tragedy_mask', scale: 1.3, block: { n: 1, rest: 2 } }]) },
  // the Prism Spire
  the_seventh_colour: { desc: 'Seven colours circle you, and every two seconds each throws its shard at whatever is nearest.', dropPrism: true,
    passive: ORB({ kind: 'body', n: 7, r: 1.8, w: 1.8, dmg: 50, sprite: 'rx_shots/prism_wyrm.facet_star', scale: 1, fire: { every: 2, proj: 'rx_shots/prism_wyrm.prism_shard', dmg: 120, speed: 12, range: 6 } }) },
  // the Sleeper's dream
  nightlight_ring: { desc: 'A little moon in a ring. It circles you, catches a shot now and then, and lulls what it touches.',
    passive: ORB({ kind: 'body', n: 1, r: 1.5, w: 2, dmg: 90, slow: 0.4, sprite: 'rx_shots/lullaby_moth.lullaby_moon', scale: 1.6, block: { n: 1, rest: 2 } }) },
  the_waking_bell: { name: 'Halo of the Waking Bell', desc: 'A halo hung with a bell. Raise it and bells toll down where you point.' },
};
// names whose noun named another kind of item (a rapier that is a dagger, a coat that is heavy armour, a vestment
// that is a robe, a crozier that is a wand) or no kind at all (The Feint, The Thunderhead): now they say what they are
const RENAME = {
  crimson_rapier: 'The Crimson Stiletto', the_hollow_psalm: 'Reliquary of the Hollow Psalm', the_turning_verse: 'Seal of the Turning Verse',
  heaven_wire: 'Heaven-Wire Staff', the_eleventh_hour: 'Wand of the Eleventh Hour', the_thunderhead: 'The Thunderhead Kite', kraken_bane: 'Kraken-Bane Bow',
  the_seventh_colour: 'Ring of the Seventh Colour', event_horizon: 'Event Horizon Ring', the_last_curtain: 'Robe of the Last Curtain',
  the_tempest_cloak: 'Storm-Woven Robe', sanguine_cloak: 'Sanguine Leathers', the_mourners_veil: 'The Mourner\'s Robe', heartstring_vestment: 'Heartstring Robe',
  heartbreak_coat: 'Heartbreak Mail', tidewoven_coat: 'Tidewoven Mail', the_feint: 'Dagger of the Feint', dawnbreaker: 'Dawnbreaker Wand',
  abbots_crozier: 'The Abbot\'s Wand', runic_aegis: 'The Runic Ward',
};
export function applyDungeonItems(ITEMS) {
  for (const [id, name] of Object.entries(RENAME)) if (ITEMS[id]) ITEMS[id].name = name;
  for (const [id, D] of Object.entries(DUNGEON_ITEMS)) {
    const it = ITEMS[id];
    if (!it) continue;
    if (D.name) it.name = D.name;
    if (D.desc) it.desc = D.desc;
    if (D.passive) { it.passive = { ...(it.passive || {}), ...D.passive }; if (D.dropPrism) delete it.passive.prism; }
    if (D.sig && it.ability) it.ability.sig = { ...D.sig };
  }
  for (const it of Object.values(ITEMS)) {
    if (it.weapon && it.weapon.special && it.weapon.special.homing) { const s = { ...it.weapon.special }; delete s.homing; it.weapon = { ...it.weapon, special: s }; }
  }
}
// what an orbit does, in a line for the tooltip
export function orbitLine(O, ability) {
  const sets = Array.isArray(O) ? O : [O], parts = sets.map((q) => {
    const what = q.kind === 'hole' ? 'a black hole' : `${q.n} orbiting ${q.n > 1 ? 'guardians' : 'guardian'}`;
    const does = [q.dmg ? `${q.dmg} on touch` : '', q.block ? `${q.kind === 'hole' ? 'swallow' : 'block'} ${q.block.n > 1 ? `up to ${q.block.n} shots` : 'a shot'} (then rest ${q.block.rest}s)` : '',
      q.pull ? 'drag monsters in' : '', q.fire ? `throw a shot every ${q.fire.every}s` : '', q.slow ? 'slow' : '', q.burn ? 'ignite' : '', q.heal ? `heal you ${q.heal} a bite` : ''].filter(Boolean);
    return `${what}: ${does.join(', ')}`;
  });
  return (ability ? `On use, for ${ability}s: ` : 'Orbit: ') + parts.join('; ');
}
