// Player classes. Stats: hp mp att def spd dex vit wis.
// base = level 1, max = cap reachable only with stat potions, grow = [min,max] per level.
export const STATS = ['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'];
export const STAT_NAMES = { hp: 'Life', mp: 'Mana', att: 'Attack', def: 'Defense', spd: 'Speed', dex: 'Dexterity', vit: 'Vitality', wis: 'Wisdom' };
export const MAX_LEVEL = 20;
// RotMG fame: once a character reaches level 20, experience turns into base fame (1 per FAME_XP).
// When it dies, base fame plus bonuses goes to the account. Fame goals mark a class's best character.
export const FAME_XP = 150;
export const FAME_GOALS = [20, 150, 400, 800, 2000];
export const xpToNext = (lvl) => 50 + (lvl - 1) * 110;

export const CLASSES = {
  brawler: {
    name: 'Brawler',
    design: 'The Forgefist',
    blurb: 'A forge-thrall fused to a smith-god\'s furnace gauntlet. Swords and heavy armor; hits hard up close. Ability: BELLOWS CHARGE, an untouchable dash that batters everything in its path.',
    sheet: 'brawler',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'sword', ability: 'bellows', armor: 'heavy',
    base: { hp: 200, mp: 100, att: 15, def: 0, spd: 12, dex: 15, vit: 15, wis: 10 },
    max: { hp: 720, mp: 252, att: 50, def: 25, spd: 50, dex: 45, vit: 50, wis: 45 },
    grow: { hp: [20, 30], mp: [5, 15], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [0, 2], vit: [1, 2], wis: [1, 2] },
  },
  forge_knight: {
    name: 'Forge Knight',
    design: 'The Anvilheart',
    blurb: 'Carries a temple anvil as his helm. Swords and heavy armor; the toughest body in the realm. Ability: OATH-ANVIL, hurled onto your cursor to crush and stun.',
    sheet: 'forge_knight',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'sword', ability: 'seal', armor: 'heavy',
    base: { hp: 220, mp: 100, att: 12, def: 5, spd: 8, dex: 10, vit: 12, wis: 10 },
    max: { hp: 770, mp: 252, att: 50, def: 40, spd: 45, dex: 50, vit: 50, wis: 45 },
    grow: { hp: [22, 32], mp: [5, 15], att: [1, 2], def: [1, 2], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  priest: {
    name: 'Priest',
    design: 'The Heliarch',
    blurb: 'A faceless saint wearing the corpse of a sun. Wands and robes. Ability: JUDGMENT OF NOON, a pillar of light that burns everything beneath it while you are healed.',
    sheet: 'priest',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'wand', ability: 'halo', armor: 'robe',
    base: { hp: 140, mp: 140, att: 12, def: 0, spd: 10, dex: 12, vit: 10, wis: 15 },
    max: { hp: 670, mp: 385, att: 45, def: 25, spd: 50, dex: 50, vit: 45, wis: 50 },
    grow: { hp: [18, 28], mp: [10, 20], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  summoner: {
    name: 'Summoner',
    design: 'The Reliquarian',
    blurb: 'A grave-keeper in a funeral shroud who carries the dead with her. Staves and robes. Ability: OPEN THE RELIQUARY, which frees bone thralls that hunt for you.',
    sheet: 'summoner',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'staff', ability: 'reliquary', armor: 'robe',
    base: { hp: 150, mp: 160, att: 10, def: 0, spd: 10, dex: 12, vit: 10, wis: 18 },
    max: { hp: 640, mp: 400, att: 50, def: 25, spd: 45, dex: 50, vit: 45, wis: 50 },
    grow: { hp: [18, 26], mp: [10, 22], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [0, 2] },
  },
  harpooner: {
    name: 'Harpooner',
    design: 'The Wreck-Whaler',
    blurb: 'A diver in a brass bell-helm who hunted things too big for the sea. Bows and leather armor: volleys of piercing arrows. Ability: GRAPPLE LINE, which reels a monster in and stuns it, or hurls you across the map.',
    sheet: 'harpooner',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'bow', ability: 'hookline', armor: 'leather',
    base: { hp: 185, mp: 100, att: 14, def: 2, spd: 10, dex: 9, vit: 11, wis: 10 },
    max: { hp: 680, mp: 250, att: 50, def: 28, spd: 45, dex: 50, vit: 50, wis: 45 },
    grow: { hp: [19, 28], mp: [5, 14], att: [1, 2], def: [0, 2], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  duelist: {
    name: 'Duelist',
    design: 'The Mirror-Knight',
    blurb: 'A knight whose face is a cracked mirror, so every opponent fights themselves. Daggers and leather armor: lightning-fast thrusts. Ability: MIRROR STEP, a blink that leaves a reflection behind for monsters to hunt.',
    sheet: 'duelist',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'dagger', ability: 'mirror', armor: 'leather',
    base: { hp: 170, mp: 110, att: 13, def: 2, spd: 14, dex: 16, vit: 10, wis: 10 },
    max: { hp: 720, mp: 270, att: 50, def: 30, spd: 50, dex: 50, vit: 45, wis: 45 },
    grow: { hp: [20, 30], mp: [5, 14], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  stormwright: {
    name: 'Stormwright',
    design: 'The Kite-Hermit',
    blurb: 'A hermit on stilts who flies a storm kite on a copper wire. Staves and robes. Ability: STORM KITE, a floating lightning turret that strikes everything near it.',
    sheet: 'stormwright',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'staff', ability: 'kite', armor: 'robe',
    base: { hp: 150, mp: 140, att: 12, def: 0, spd: 12, dex: 12, vit: 10, wis: 15 },
    max: { hp: 650, mp: 380, att: 50, def: 25, spd: 50, dex: 45, vit: 45, wis: 50 },
    grow: { hp: [18, 27], mp: [9, 19], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  clockmaker: {
    name: 'Clockmaker',
    design: 'The Horologist',
    blurb: 'A hunched horologist with a cathedral clock grown into her spine. Wands and robes. Ability: STOP TIME, which freezes every monster and bullet around her.',
    sheet: 'clockmaker',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'wand', ability: 'stopwatch', armor: 'robe',
    base: { hp: 180, mp: 120, att: 14, def: 2, spd: 9, dex: 10, vit: 12, wis: 12 },
    max: { hp: 700, mp: 300, att: 45, def: 32, spd: 45, dex: 50, vit: 50, wis: 50 },
    grow: { hp: [20, 30], mp: [6, 16], att: [0, 2], def: [0, 2], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  runeblade: {
    name: 'Runeblade',
    design: 'The Rune-Knight',
    blurb: 'A knight in rune-cut steel and a crimson cloak. Swords and leather armor; quick on his feet. Ability: RUNE WARD, a shield of runes that soaks up damage while rune-slashes cut a ring around you.',
    sheet: 'runeblade',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'sword', ability: 'runeward', armor: 'leather',
    base: { hp: 190, mp: 100, att: 14, def: 2, spd: 13, dex: 13, vit: 13, wis: 10 },
    max: { hp: 700, mp: 260, att: 50, def: 30, spd: 50, dex: 50, vit: 45, wis: 45 },
    grow: { hp: [20, 30], mp: [5, 14], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [0, 2], wis: [1, 2] },
  },
  ranger: {
    name: 'Ranger',
    design: 'The Thornhood',
    blurb: 'A hunter in a green hood who keeps the old roads, a quiver of red-fletched arrows on her back. Bows and leather armor: the steadiest aim in the realm. Ability: SKYFALL, arrows called down on your cursor in three waves.',
    sheet: 'ranger',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'bow', ability: 'skyfall', armor: 'leather',
    base: { hp: 165, mp: 110, att: 13, def: 1, spd: 12, dex: 14, vit: 10, wis: 11 },
    max: { hp: 660, mp: 280, att: 50, def: 26, spd: 50, dex: 50, vit: 45, wis: 45 },
    grow: { hp: [18, 27], mp: [6, 15], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
  hexweaver: {
    name: 'Hexweaver',
    design: 'The Orb-Witch',
    blurb: 'A hooded witch whose eyes glow through the dark, carrying an orb on a gnarled staff. Staves and robes. Ability: HEX, a curse thrown at your cursor: everything inside takes more damage and slows to a crawl.',
    sheet: 'hexweaver',
    anim: { side: 'mirror', attack: { front: 'front_attack', right: 'side_attack', left: 'side_attack', back: 'back_attack' } },
    weapon: 'staff', ability: 'hex', armor: 'robe',
    base: { hp: 145, mp: 150, att: 12, def: 0, spd: 11, dex: 12, vit: 10, wis: 16 },
    max: { hp: 650, mp: 390, att: 50, def: 25, spd: 45, dex: 50, vit: 45, wis: 50 },
    grow: { hp: [18, 27], mp: [10, 21], att: [1, 2], def: [0, 1], spd: [1, 2], dex: [1, 2], vit: [1, 2], wis: [1, 2] },
  },
};
export const START_KIT = {
  duelist: ['dagger_t0', 'mirror_t0', 'leather_t0'], stormwright: ['staff_t0', 'kite_t0', 'robe_t0'],
  clockmaker: ['wand_t0', 'stopwatch_t0', 'robe_t0'],
  brawler: ['sword_t0', 'bellows_t0', 'heavy_t0'], forge_knight: ['sword_t0', 'seal_t0', 'heavy_t0'],
  priest: ['wand_t0', 'halo_t0', 'robe_t0'], summoner: ['staff_t0', 'reliquary_t0', 'robe_t0'],
  harpooner: ['bow_t0', 'hookline_t0', 'leather_t0'],
  ranger: ['bow_t0', 'skyfall_t0', 'leather_t0'],
  runeblade: ['sword_t0', 'runeward_t0', 'leather_t0'], hexweaver: ['staff_t0', 'hex_t0', 'robe_t0'],
};

// Derived combat values.
export const moveSpeed = (spd) => 3.6 + 5.0 * (spd / 50);          // tiles / s (stats top out at 50: 50 is the old 75)
export const fireRate = (dex) => 1.4 + 5.6 * (dex / 50);            // multiplier on weapon rate
export const dmgMult = (att) => 0.5 + att * 0.03;                   // (50 Attack: x2, as 75 was)
export const hpRegen = (vit) => 1 + 0.24 * vit;                      // hp / s
export const mpRegen = (wis) => 0.5 + 0.18 * wis;                    // mp / s
export const mitigate = (dmg, def, pierce) => (pierce ? dmg : Math.max(Math.round(dmg * 0.15), dmg - def));
