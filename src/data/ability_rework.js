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

// UT abilities of every other type: the class ability as always, plus a sigil to set off with a second press
// (src/sigils.js). It replaces the item's old twist (ability.mod). sigil: { theme, f, r, window, ...its numbers }
export const SIGIL_REWORK = {
  // bellows (Brawler)
  censer_of_absolution: { theme: 'encore', pattern: 'ring', n: 10, f: 1, r: 2.6 },
  pitfighters_bellows: { theme: 'encore', pattern: 'alternate', n: 6, f: 0.7, r: 2.4 },
  colossus_core: { theme: 'encore', pattern: 'heavy', f: 1.6, r: 1.8 },
  hymn_of_the_mire: { theme: 'undertow', pull: 2.2, r: 3, f: 3.8 },
  heralds_conch: { theme: 'undertow', pull: 3.2, r: 3.4, f: 2.4 },
  spore_bomb: { theme: 'root', root: 1.5, n: 6, f: 4, r: 2.6 },
  // seal (Forge Knight)
  oathsworn_seal: { theme: 'undertow', pull: 2, r: 2.8, f: 3 },
  rind_bulwark: { theme: 'root', root: 1.8, n: 8, f: 1.5, r: 2.4 },
  orrery_seal: { theme: 'undertow', pull: 2.6, r: 3.2, f: 2.8 },
  sphinx_helm: { theme: 'undertow', pull: 1.6, r: 2.4, f: 5 },
  the_turning_verse: { theme: 'undertow', pull: 2.4, r: 3, f: 3.6, window: 5 },
  unstruck_anvil: { theme: 'forge', delay: 0.7, r: 2.2, f: 3 },
  // reliquary (Summoner)
  graverite_reliquary: { theme: 'repeat', beat: 0.5, r: 2.8, f: 3 },
  the_hollow_psalm: { theme: 'align', f: 2.6, r: 2 },
  choir_of_bones: { theme: 'soul', t: 5, mana: 10, f: 3.5, r: 3 },
  crimson_chalice: { theme: 'shatter', r: 2.6, f: 2 },
  soul_lantern: { theme: 'soul', t: 4, mana: 14, f: 5, r: 2.6 },
  // hookline (Harpooner)
  leviathan_line: { theme: 'repeat', beat: 0.6, r: 2.4, f: 0.7 },
  abyssal_line: { theme: 'undertow', pull: 2.8, r: 3, f: 1.1 },
  drowned_mans_line: { theme: 'undertow', pull: 2, r: 2.6, f: 1.2 },
  // mirror (Duelist)
  glassfencer_mirror: { theme: 'refract', n: 5, spread: 0.1, f: 1.4, r: 1.6 },
  cracked_looking_glass: { theme: 'refract', n: 3, spread: 0.16, f: 1.8, r: 1.6 },
  hall_of_mirrors: { theme: 'refract', n: 7, spread: 0.07, f: 0.7, r: 1.6 },
  // kite (Stormwright)
  tempest_kite: { theme: 'jump', n: 4, r: 3, f: 1.8 },
  the_squall: { theme: 'jump', n: 3, r: 3.4, f: 2.4 },
  the_thunderhead: { theme: 'jump', n: 5, r: 2.8, f: 1.4 },
  // stopwatch (Clockmaker)
  clockwork_stopwatch: { theme: 'align', f: 5, r: 2 },
  the_broken_hourglass: { theme: 'repeat', beat: 0.7, r: 3, f: 5 },
  the_hourglass_of_sand: { theme: 'align', f: 4.5, r: 2.2, window: 5 },
  // runeward (Runeblade)
  runewarden_ward: { theme: 'rune', t: 5, n: 5, r: 2.6, f: 1.2 },
  runic_aegis: { theme: 'shatter', r: 2.4, f: 1.6 },
  // hex (Hexweaver)
  hexcircle_grimoire: { theme: 'root', root: 1.4, n: 6, f: 1.5, r: 2.8 },
  grimoire_of_ash: { theme: 'forge', delay: 0.6, r: 2.4, f: 2.4 },
  trick_deck: { theme: 'rune', t: 6, n: 4, r: 3, f: 1.4 },
  melon_orb: { theme: 'align', f: 1.5, r: 2.2 },
};
export const SIGIL_TEXT = {
  encore: (S) => ({ ring: 'its sigil sends out a ring of shots', alternate: 'its sigil sends out two rings, one after the other', heavy: 'its sigil lands one heavy encore blow' })[S.pattern],
  undertow: () => 'its sigil drags the small things near it into its centre, then crashes',
  root: () => 'its sigil roots what stands on it and sprouts thorns',
  repeat: (S) => `its sigil pulses twice, ${S.beat}s apart, slowing what it hits`,
  align: () => 'three stars wheel round its sigil, then line up and fire at your cursor',
  soul: (S) => `its sigil soul-marks what stands near it: it decays, and a kill while marked gives back ${S.mana} Mana`,
  shatter: () => 'its sigil chills what stands near it; a beat later the chilled shatter into shards',
  forge: (S) => `its sigil calls a forge-blow onto the spot ${S.delay}s later, and burns`,
  refract: (S) => `its sigil bends a fan of ${S.n} shards toward your cursor`,
  jump: (S) => `lightning leaps from its sigil between up to ${S.n} enemies`,
  rune: (S) => `its sigil stays ${S.t}s: your next ${S.n} hits on enemies inside it set off rune pulses`,
};
export const sigilLine = (S) => `Leaves a sigil at your cursor; press again within ${S.window || 4}s (no Mana) and ${SIGIL_TEXT[S.theme](S)}`;

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
  for (const [id, S] of Object.entries(SIGIL_REWORK)) {
    const it = ITEMS[id];
    if (!it || !it.ability) continue;
    const A = { ...it.ability, sigil: { ...S } };
    delete A.mod;                                           // the sigil is its twist now
    if (A.sig && A.sig.kind !== 'orbit') delete A.sig;      // (and not a generic signature shape; its own orbiters stay)
    it.ability = A; it.reworked = true;
  }
}
