// The item rework (realm_505_item_rework_blueprint.md), armour and rings: each UT armour and special ring trades its old
// passive for one mechanic (src/gearmech.js). Armour also gives up a tenth of its DEF and Life for it. The table below was
// generated from the blueprint (each entry's template), with the numbers stepped so no two pieces are the same; the
// Mythic and Legendary rings have mechanics of their own. Applied last (items.js).
export const GEAR_REWORK = {
  furnace_heart_coat: { kind: 'stride', move: 1.6, cap: 0.18, cd: 5, col: '#ff8a2a' },
  gilded_penance: { kind: 'stride', move: 1.9, cap: 0.22, cd: 6, col: '#c8b8ff' },
  godforged_plate: { kind: 'bigpulse', at: 0.12, cd: 7, r: 2.4, dmg: 80, col: '#ff8a2a' },
  heartbreak_coat: { kind: 'sanctuary', below: 0.30, absorb: 0.20, t: 3, cd: 40, col: '#ff3a4a' },
  oathsworn_bulwark: { kind: 'hazard', cd: 5, r: 1.1, dps: 70, t: 3, col: '#ff8a2a' },
  pitfighters_harness: { kind: 'counter', every: 3, cap: 3, soften: 0.35, dmg: 160 },
  rime_headsman_plate: { kind: 'counter', every: 4, cap: 3, soften: 0.40, dmg: 190 },
  rime_standard: { kind: 'markkill', hp: 30, mp: 0, dmg: 80, col: '#9ad8ff' },
  rindguard: { kind: 'stride', move: 2.2, cap: 0.26, cd: 7, col: '#ffd650' },
  bellwrights_mail: { kind: 'sanctuary', below: 0.33, absorb: 0.23, t: 3, cd: 45, col: '#e8c87a' },
  tidewoven_coat: { kind: 'stride', move: 2.5, cap: 0.18, cd: 5, col: '#7ae0e0' },
  glassfencer_jerkin: { kind: 'bigpulse', at: 0.14, cd: 8, r: 2.6, dmg: 100, col: '#cfe8ff' },
  leviathan_hide: { kind: 'counter', every: 5, cap: 3, soften: 0.45, dmg: 220 },
  mycelial_hide: { kind: 'stride', move: 1.6, cap: 0.22, cd: 6, col: '#7ad04a' },
  runeplate_armor: { kind: 'stride', move: 1.9, cap: 0.26, cd: 7, col: '#8a7aff' },
  runewarden_brigandine: { kind: 'sanctuary', below: 0.36, absorb: 0.26, t: 3, cd: 50, col: '#8a7aff' },
  sanguine_cloak: { kind: 'hazard', cd: 6, r: 1.2, dps: 85, t: 3, col: '#ff8a2a' },
  the_sea_wolf: { kind: 'bigpulse', at: 0.16, cd: 9, r: 2.8, dmg: 120, col: '#7ae0e0' },
  silvered_duelcoat: { kind: 'stride', move: 2.2, cap: 0.18, cd: 5, col: '#c8b8ff' },
  whalers_slicker: { kind: 'hazard', cd: 7, r: 1.3, dps: 100, t: 3, col: '#7ae0e0' },
  clockwork_robe: { kind: 'bigpulse', at: 0.18, cd: 7, r: 2.4, dmg: 140, col: '#e8c87a' },
  dawnchoir_robe: { kind: 'counter', every: 3, cap: 3, soften: 0.50, dmg: 250 },
  dewveil_robe: { kind: 'sanctuary', below: 0.39, absorb: 0.20, t: 3, cd: 40, col: '#ffd650' },
  embalmers_wraps: { kind: 'hazard', cd: 5, r: 1.4, dps: 115, t: 3, col: '#c8b8ff' },
  frostweave_armor: { kind: 'stride', move: 2.5, cap: 0.22, cd: 6, col: '#9ad8ff' },
  graverite_shroud: { kind: 'bigpulse', at: 0.12, cd: 8, r: 2.6, dmg: 80, col: '#e8e0c8' },
  harlequin_garb: { kind: 'sanctuary', below: 0.30, absorb: 0.23, t: 3, cd: 45, col: '#ffd6f0' },
  heartstring_vestment: { kind: 'markkill', hp: 0, mp: 15, dmg: 100, col: '#ffd6f0' },
  hexsilk_robe: { kind: 'stride', move: 1.6, cap: 0.26, cd: 7, col: '#7ae0e0' },
  nebula_robe: { kind: 'nebula', cd: 4, dmg: 70 },
  prismglass_mantle: { kind: 'sanctuary', below: 0.33, absorb: 0.26, t: 3, cd: 50, col: '#cfe8ff' },
  hexcircle_robe: { kind: 'bigpulse', at: 0.14, cd: 9, r: 2.8, dmg: 100, col: '#8a7aff' },
  the_last_curtain: { kind: 'sanctuary', below: 0.36, absorb: 0.20, t: 3, cd: 40, col: '#ffd6f0' },
  rose_window_vestment: { kind: 'counter', every: 4, cap: 3, soften: 0.35, dmg: 160 },
  salt_widows_veil: { kind: 'hazard', cd: 6, r: 1.1, dps: 70, t: 3, col: '#7ae0e0' },
  the_tempest_cloak: { kind: 'stride', move: 1.9, cap: 0.18, cd: 5, col: '#bfe8ff' },
  tallow_vestment: { kind: 'markkill', hp: 20, mp: 8, dmg: 120, col: '#e8e0c8' },
  tempest_robe: { kind: 'markkill', hp: 0, mp: 18, dmg: 140, col: '#bfe8ff' },
  the_gearmail: { kind: 'sanctuary', below: 0.39, absorb: 0.23, t: 3, cd: 45, col: '#e8c87a' },
  gravewardens_pall: { kind: 'bigpulse', at: 0.16, cd: 7, r: 2.4, dmg: 120, col: '#e8e0c8' },
  the_mourners_veil: { kind: 'sanctuary', below: 0.30, absorb: 0.26, t: 3, cd: 50, col: '#e8e0c8' },
  abyssal_pearl: { kind: 'control', every: 3, slow: 0.25, weaken: 0.08, col: '#7ae0e0' },
  antler_crown: { kind: 'killshard', dmg: 120, range: 4.5 },
  astral_signet: { kind: 'satellite', every: 6, dmg: 220 },
  crown_of_the_fallen: { kind: 'glyph', at: 0.12, cd: 10, life: 4, col: '#ff3a4a' },
  band_of_the_open_hand: { kind: 'openhand', need: 8 },
  crown_of_the_unstruck: { kind: 'coronation', build: 6, cap: 400, cd: 15, dmg: 260 },
  bell_of_the_taken: { kind: 'motion', full: 3.5, bonus: 0.20 },
  dewdrop_ring: { kind: 'accuracy', need: 4, dmg: 200, col: '#ffd650' },
  emberheart_ring: { kind: 'motion', full: 4.0, bonus: 0.25 },
  emilys_scarf: { kind: 'glyph', at: 0.14, cd: 12, life: 5, col: '#c8b8ff' },
  event_horizon: { kind: 'tempo', window: 0.7, mana: 15, dmg: 250, proj: 'void_bolt' },
  honeyguard_band: { kind: 'tempo', window: 0.5, mana: 6, dmg: 100 },
  nightlight_ring: { kind: 'accuracy', need: 5, dmg: 240, col: '#c8b8ff' },
  pearl_of_the_drowned_mass: { kind: 'glyph', at: 0.16, cd: 14, life: 6, col: '#7ae0e0' },
  pilgrims_pearl: { kind: 'control', every: 4, slow: 0.30, weaken: 0.10, col: '#7ae0e0' },
  ring_of_rot: { kind: 'glyph', at: 0.18, cd: 10, life: 7, col: '#7ad04a' },
  ring_of_still_waters: { kind: 'stillwater', dmg: 140 },
  aurora_heart: { kind: 'aurora', need: 3, dmg: 260 },
  drowned_bell: { kind: 'control', every: 5, slow: 0.35, weaken: 0.12, col: '#7ae0e0' },
  ring_of_the_first_flame: { kind: 'firstflame', dmg: 150, cd: 3 },
  ring_of_the_jester: { kind: 'motion', full: 4.5, bonus: 0.30 },
  ring_of_the_rind: { kind: 'tempo', window: 0.6, mana: 8, dmg: 125 },
  the_seventh_colour: { kind: 'glyph', at: 0.12, cd: 12, life: 4, col: '#e8c87a' },
  ring_of_the_undertow: { kind: 'accuracy', need: 6, dmg: 280, col: '#7ae0e0' },
  ring_of_the_wyrm: { kind: 'glyph', at: 0.14, cd: 14, life: 5, col: '#9ad8ff' },
  ring_of_tides: { kind: 'tempo', window: 0.7, mana: 10, dmg: 150 },
  scarab_ring: { kind: 'accuracy', need: 4, dmg: 320, col: '#ffd650' },
  seed_of_renewal: { kind: 'glyph', at: 0.16, cd: 10, life: 6, col: '#7ad04a' },
  shard_of_the_first_star: { kind: 'starspear', dmg: 320 },
  signet_of_the_count: { kind: 'accuracy', need: 5, dmg: 200, col: '#ff3a4a' },
  bellringers_rope: { kind: 'tempo', window: 0.5, mana: 12, dmg: 175 },
  blight_heart: { kind: 'blight', dmg: 280 },
  the_conductors_band: { kind: 'conductor', dmg: 300 },
  glowcap_crown: { kind: 'glowcap', max: 3, t: 3, heal: 45 },
  golden_honeydew: { kind: 'accuracy', need: 6, dmg: 240, col: '#ffd650' },
  gravedust_band: { kind: 'accuracy', need: 4, dmg: 280, col: '#e8e0c8' },
  grinning_mask: { kind: 'mask', cd: 8, dmg: 200 },
  kintsugi_band: { kind: 'accuracy', need: 5, dmg: 320, col: '#7ae0e0' },
  leviathan_eye: { kind: 'tideeye', need: 5, dmg: 320 },
  pharaohs_deathmask: { kind: 'glyph', at: 0.18, cd: 12, life: 7, col: '#e0c070' },
  rubber_duck: { kind: 'tempo', window: 0.6, mana: 6, dmg: 100 },
  starless_band: { kind: 'glyph', at: 0.12, cd: 14, life: 4, col: '#c8b8ff' },
  trap_hound_collar: { kind: 'glyph', at: 0.14, cd: 10, life: 5, col: '#ffd6f0' },
};

const pc = (f) => `${Math.round(f * 100)}%`;
export const GEAR_TEXT = {
  stride: (g) => `Keep moving for ${g.move}s and a barrier forms; it takes the next blow (up to ${pc(g.cap)} of your Life), then rests ${g.cd}s`,
  bigpulse: (g) => `A heavy blow (${pc(g.at)} of your Life or more) sends out a pulse that weakens and slows enemies near you (every ${g.cd}s at most)`,
  sanctuary: (g) => `Dropping below ${pc(g.below)} Life raises a sanctuary that absorbs ${pc(g.absorb)} of your Life for ${g.t}s (every ${g.cd}s)`,
  hazard: (g) => `Being hit leaves a patch behind you that burns those who follow (every ${g.cd}s)`,
  counter: (g) => `Every ${g.every} hits store a counter (up to ${g.cap}); at ${g.cap}, the next blow is softened by ${pc(g.soften)} and a slash flies back`,
  markkill: (g) => `Killing an enemy you hit in the last 3s ${g.hp ? `restores ${g.hp} Life` : ''}${g.hp && g.mp ? ' and ' : ''}${g.mp ? `${g.mp} Mana` : ''} and pulses`,
  nebula: (g) => `A near miss leaves an afterimage: your next blow within 2s is halved, and it pulses (every ${g.cd}s)`,
  control: (g) => `Every ${g.every} hits on one enemy slow it ${pc(g.slow)} and weaken it ${pc(g.weaken)} (once every 3s per enemy)`,
  killshard: (g) => 'A kill throws a shard at the nearest enemy',
  motion: (g) => `Moving charges you (full after ${g.full}s; standing still drains it); your next ability spends it: up to +${pc(g.bonus)} damage for 2.5s`,
  accuracy: (g) => `Every ${g.need} hits on one enemy end in a follow-up strike`,
  glyph: (g) => `Surviving a heavy blow drops a glyph that stops the next shot (every ${g.cd}s)`,
  tempo: (g) => `An ability within ${g.window}s of a weapon hit gives back ${g.mana} Mana and fires a small shot`,
  satellite: () => 'Hits gather three orbit points; at three, the next hit calls a strike across the target',
  openhand: () => 'Close hits build a stance; an ability with a full stance pushes enemies back and gives you a barrier for one blow',
  coronation: (g) => `Unhurt for ${g.build}s, you are crowned: the next blow is blocked (up to ${g.cap}) and two strikes fly out (every ${g.cd}s)`,
  stillwater: () => 'Stand still to charge a pool; once you move on, your next hit leaves a slowing ripple where you stood',
  aurora: (g) => `${g.need} near misses bank an aurora: your next ability raises a veil that stops one shot and sends three crescents at the nearest enemies`,
  firstflame: () => 'Every third hit on one enemy kindles a flame-front ahead of you',
  starspear: () => 'Every 4 hits gather a star fragment (up to 3); your next ability throws them as a constellation spear',
  blight: () => 'Hits fill a rot reservoir; your next ability with it half full or more blooms three spore pods that burst when enemies come near',
  conductor: () => 'Alternate weapon hits and abilities: the third beat sends a lightning note down your aim',
  glowcap: () => 'Up to three glowing spores; being hit spends one to grow a healing mushroom patch at your feet',
  mask: () => 'Every third ability leaves a grinning mask that draws enemy aim, and throws three crescent knives',
  tideeye: (g) => `${g.need} hits on one enemy mark it with tide-rings; your next ability drags it closer and sends an undertow at it`,
};
export const gearLine = (g) => GEAR_TEXT[g.kind](g);

export function applyGearRework(ITEMS) {
  if (globalThis.NO_GEAR_REWORK) return;
  for (const [id, g] of Object.entries(GEAR_REWORK)) {
    const it = ITEMS[id];
    if (!it) continue;
    it.gear = { ...g };
    if (it.passive && it.passive.orbit) it.passive = { orbit: it.passive.orbit };   // the one mechanic replaces the old passive (a dungeon item keeps its orbiters)
    else delete it.passive;
    if (it.slot === 'armor' && it.bonus) {                  // armour trades a tenth of its DEF and Life for it
      it.bonus = { ...it.bonus };
      for (const k of ['def', 'hp']) if (it.bonus[k] > 0) it.bonus[k] = Math.round(it.bonus[k] * 0.9);
    }
    it.reworked = true;
  }
}
