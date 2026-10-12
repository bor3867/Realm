// The item rework (realm_505_item_rework_blueprint.md), abilities. Applied last, over every earlier pass (items.js).
// Halos: the tiered ones keep the falling gold-white pillar; each UT and Mythic Halo replaces it with its own shape
// (src/halos.js) and drops the generic signature it had. Its healing moves into that shape (ability.heal goes to 0).
//   halo: { kind, f (damage, times the burst's dmg and your ATT), heal, ...its numbers }
export const HALO_REWORK = {
  dawnchoir_halo: { kind: 'sunrise', f: 7, heal: 350, proj: 'pj_dawnray' },
  the_waking_bell: { kind: 'bell', f: 7, heal: 260, r: 3.2 },
  stained_glass_halo: { kind: 'rose', f: 4.2, heal: 220, proj: 'beacon' },
  eaten_halo: { kind: 'aureole', f: 11, heal: 240 },
  the_last_noon: { kind: 'horizon', f: 7, heal: 400, w: 5, range: 8, lock: 2 },
  orrery_orb: { kind: 'orrery', heal: 110, every: 2.6, life: 8, keepSig: true },
  the_second_sun: { kind: 'sun', f: 3, heal: 360, proj: 'lance' },
  wick_of_the_mother: { kind: 'wick', f: 0.35, regen: 60, life: 6, proj: 'corpseflame' },
};
export const HALO_TEXT = {
  sunrise: 'Three sunrise sigils fan out ahead of you: each heals you if you are near, and sends a crescent out',
  bell: 'Throw a bell: it rings twice. The first ring heals you if you stand near it; the second stuns and weakens enemies',
  rose: 'A rose sigil shatters into three crescents: red burns, blue slows, and gold flies home to heal you',
  aureole: 'A bitten halo closes on the enemy nearest your cursor and drains it; when it ends, its fragments fly home to heal you',
  horizon: 'A wall of daylight sweeps down the line you aim, judging every enemy it touches (+20% damage taken); a longer recovery',
  orrery: 'Each completed orbit of its planets pulses a healing ring around you',
  sun: 'A black sun pulses three eclipse rings: they scorch enemies and heal and shield you; then a corona of shots',
  wick: 'Plant a tallow wick: it turns out three tongues of flame, and standing near it heals you',
};

export function applyAbilityRework(ITEMS) {
  if (globalThis.NO_ABILITY_REWORK) return;                 // (the benches' --before: the abilities as they were)
  for (const [id, H] of Object.entries(HALO_REWORK)) {
    const it = ITEMS[id];
    if (!it || !it.ability) continue;
    const A = { ...it.ability, halo: { ...H }, heal: 0 };
    delete A.mod;
    if (!H.keepSig) delete A.sig;
    it.ability = A; it.reworked = true;
  }
}
