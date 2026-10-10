// Pets: a companion that follows you everywhere and heals you. (Phase 7, docs/design/07_pets.md: the bodies are Pets v2's
// 20 lines, baby -> evolved -> divine by the main ability's level; the systems below are ours.) Each pet has abilities that level up on their own:
//   Heal (Life), Magic Heal (Mana), and from Rare upward, Shield (a ward that soaks damage).
// Feed it gear (paying gold or fame) to level its abilities: the meal's power is split, most to the pet's main ability.
// Rarity caps the ability levels. Two pets of the same rarity whose abilities are all maxed can MORPH into one pet of
// the next rarity, keeping their levels and raising the cap, all the way to Divine at level 100.
import { ITEMS } from './items.js';
import { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, BOSS } from './enemies.js';

// the ten families (an egg's shell) and their twenty lines (a pet's kind). forms: baby, evolved, divine (art pt2_pets/<form>)
export const FAMILIES = {
  aquatic: 'Aquatic', avian: 'Avian', canine: 'Canine', feline: 'Feline', spooky: 'Spooky',
  woodland: 'Woodland', reptile: 'Reptile', insect: 'Insect', automaton: 'Automaton', exotic: 'Exotic',
};
const line = (family, forms, heal, magic, desc) => ({ family, forms, heal, magic, desc, name: title(forms[0]) });
function title(s) { return s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '); }
export const PET_KINDS = {
  bubblefin: line('aquatic', ['bubblefin', 'spinefin', 'sovereign_puffer'], 1.3, 0.7, 'Puffs itself up between you and whatever is coming. It is mostly air, and all heart.'),
  coral_seahorse: line('aquatic', ['coral_seahorse', 'reef_seahorse', 'tidecrown_seahorse'], 0.8, 1.25, 'It swims in the air as if the sea came with it. Its little crest hums with calm.'),
  owlet: line('avian', ['owlet', 'great_owl', 'starwise_owl'], 0.75, 1.3, 'It reads over your shoulder and judges you. It is usually right.'),
  ember_chick: line('avian', ['ember_chick', 'firebird', 'phoenix'], 1.2, 0.85, 'Warm as a coal and twice as fussy. One day it will burn bright enough to light a whole road.'),
  shiba_pup: line('canine', ['shiba_pup', 'shiba', 'sun_shiba'], 1.25, 0.75, 'Loyal, loud, and certain that every monster is a friend it hasn\'t met yet.'),
  frost_fox: line('canine', ['frost_fox', 'snow_fox', 'aurora_kitsune'], 0.9, 1.1, 'A snow-white fox from the north. Cold paws, warm heart.'),
  calico_kitten: line('feline', ['calico_kitten', 'calico_cat', 'lucky_cat'], 1.1, 0.95, 'It brings you luck, it says. Mostly it brings you mice.'),
  shadow_lynx: line('feline', ['shadow_lynx', 'night_lynx', 'eclipse_lynx'], 0.7, 1.35, 'You only see it when it wants you to. It always wants you to at dinner.'),
  wisp_ghost: line('spooky', ['wisp_ghost', 'phantom', 'grand_wraith'], 0.85, 1.2, 'A friendly haunting. It follows you because you are the only one who isn\'t scared.'),
  lantern_bat: line('spooky', ['lantern_bat', 'lantern_wing', 'moonwing'], 0.6, 1.4, 'It carries its own light, and it shares. Its glow refills the mind.'),
  mossling: line('woodland', ['mossling', 'moss_golem', 'grove_guardian'], 1.4, 0.6, 'Slow, patient, and older than it looks. Things grow where it sleeps.'),
  acorn_squirrel: line('woodland', ['acorn_squirrel', 'oak_squirrel', 'celestial_squirrel'], 1.0, 1.0, 'It buries acorns in your backpack for later. It has never once remembered where.'),
  jade_gecko: line('reptile', ['jade_gecko', 'jade_lizard', 'jade_dragon'], 1.35, 0.65, 'Cool green scales, a cooler head. It licks its own eyes and is not sorry.'),
  tiny_drake: line('reptile', ['tiny_drake', 'drakeling', 'elder_drake'], 1.15, 0.9, 'A dragon the size of a loaf. It hoards one coin and guards it with its life.'),
  glow_beetle: line('insect', ['glow_beetle', 'lumen_beetle', 'stag_titan'], 1.05, 0.95, 'It lights the path a step ahead of you. It has never been lost, only early.'),
  moth_sprite: line('insect', ['moth_sprite', 'luna_moth', 'solar_moth'], 0.6, 1.4, 'Drawn to light, and to people who make it. Its dust refills the mind.'),
  gear_pup: line('automaton', ['gear_pup', 'clockwork_hound', 'titan_hound'], 1.3, 0.7, 'Tick, tick, wag. Somebody wound it up a long time ago, and it has been happy ever since.'),
  brass_bot: line('automaton', ['brass_bot', 'brass_knight', 'brass_colossus'], 0.95, 1.05, 'It salutes everything. It has saluted a door. It means well.'),
  mimic_chest: line('exotic', ['mimic_chest', 'treasure_mimic', 'king_mimic'], 1.0, 1.05, 'It wants to be opened. Do not open it. It wants that too.'),
  pocket_yeti: line('exotic', ['pocket_yeti', 'yeti', 'yeti_lord'], 1.25, 0.8, 'A yeti small enough to carry, for now. It eats snow and the occasional boot.'),
};
// pets from before Pets v2 wear the closest line (docs/design/07_pets.md)
export const OLD_KINDS = { ember_fox: 'shiba_pup', frost_kit: 'frost_fox', rune_owl: 'owlet', lantern_moth: 'moth_sprite',
  tide_turtle: 'jade_gecko', bog_frog: 'bubblefin', salt_crab: 'coral_seahorse', star_wisp: 'wisp_ghost' };
// a rarer egg hatches a pet that has already grown a little
export const START_LV = { common: 1, uncommon: 5, rare: 10, legendary: 20, divine: 30 };
// a pet's form follows its main ability: evolved at the first cap, divine at the max cap
export const EVOLVE_AT = [0, 30, 100];
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'divine'];
export const RARITY = {
  common: { name: 'Common', max: 30, color: '#d8d0c0', morph: 20 },
  uncommon: { name: 'Uncommon', max: 50, color: '#7ad08a', morph: 60 },
  rare: { name: 'Rare', max: 70, color: '#7aa8ff', morph: 150 },
  legendary: { name: 'Legendary', max: 90, color: '#ffd650', morph: 400 },
  divine: { name: 'Divine', max: 100, color: '#ff7af0', morph: null },
};
export const ABILITIES = {
  heal: { name: 'Heal', what: 'Life' },
  magic: { name: 'Magic Heal', what: 'Mana' },
  shield: { name: 'Shield', what: 'a damage-soaking ward' },
};
export const PET_TICK = 4;                                   // seconds between heals
export const SHIELD_TICK = 12;                               // seconds between shields
export const PET_MAX = 12;                                   // pets you can keep
export const petXpToNext = (level) => 8 + level * 4;

// ---- older pets (one shared level) become pets with an ability each
export function upgradePet(p) {
  if (OLD_KINDS[p.kind]) p.kind = OLD_KINDS[p.kind];
  if (!PET_KINDS[p.kind]) p.kind = 'acorn_squirrel';
  if (!p.ab) {
    const L = p.level || 1;
    p.ab = { heal: { lv: L, xp: 0 }, magic: { lv: L, xp: 0 } };
    delete p.level; delete p.xp;
  }
  if (RARITY_ORDER.indexOf(p.rarity) >= 2 && !p.ab.shield) p.ab.shield = { lv: 1, xp: 0 };
  return p;
}
export const petCap = (p) => RARITY[p.rarity].max;
export const abilityOrder = (p) => {                        // the pet's main ability is the one its kind leans toward
  const K = PET_KINDS[p.kind], first = K.magic > K.heal ? 'magic' : 'heal';
  return [first, first === 'heal' ? 'magic' : 'heal', 'shield'].filter((a) => p.ab[a]);
};
export const SHARE = [1, 0.65, 0.35];                         // how a meal is split between the first, second and third ability
export const petLevel = (p) => Math.round(Object.values(p.ab).reduce((s, a) => s + a.lv, 0) / Object.keys(p.ab).length);
export const petMaxed = (p) => Object.values(p.ab).every((a) => a.lv >= petCap(p));
export const petHeal = (p) => Math.round((4 + p.ab.heal.lv * 1.1) * PET_KINDS[p.kind].heal);
export const petMagic = (p) => Math.round((3 + p.ab.magic.lv * 0.7) * PET_KINDS[p.kind].magic);
export const petShield = (p) => (p.ab.shield ? Math.round(20 + p.ab.shield.lv * 6) : 0);
export const feedCost = (p) => ({ gold: 10 + petLevel(p) * 5, fame: 1 + Math.floor(petLevel(p) / 8) });

// ---- feed power: what an item is worth as a meal. Tiered gear by tier; relics by how hard their source is to beat.
let SOURCE = null;
function sourceDifficulty() {                               // item -> the hardest thing that drops it (1 = common monster ... 7 = the god)
  if (SOURCE) return SOURCE;
  SOURCE = {};
  const note = (loot, d) => { for (const l of loot || []) if (l.id) SOURCE[l.id] = Math.max(SOURCE[l.id] || 0, d); };
  for (const E of Object.values(ENEMIES)) note(E.loot, E.children ? 2 : 1);
  for (const B of Object.values(REALM_BOSSES)) note(B.loot, B.event ? 4 : 3);
  const DD = { honey_queen: 3, the_puppeteer: 4, prism_wyrm: 6, the_sleeper: 6, drowned_abbot: 4, tidebound_lich: 4, the_archivist: 5, forgeheart_colossus: 5, fallen_heart: 6, the_unstruck_god: 7 };
  for (const [id, B] of Object.entries(DUNGEON_BOSSES)) note(B.loot, DD[id] || 5);
  note(BOSS.loot, 5);
  return SOURCE;
}
export function feedValue(it) {
  if (!it || it.admin) return 0;
  const id = it.base || it.id;
  if (it.mythic) return 900;
  if (it.ut) {
    const d = sourceDifficulty()[id] || (it.set ? 4 : 3);
    return Math.round(40 * Math.pow(d, 1.35));               // a common-monster relic ~40 ... a final-boss relic ~500
  }
  if (it.slot === 'consumable') {
    if (!it.use) return 0;
    if (it.use.egg || it.use.key || it.use.vault || it.use.backpack) return 0;
    if (it.use.stat) return it.use.stat === 'hp' || it.use.stat === 'mp' ? 60 : 40;
    return 3;
  }
  const t = it.tier || 0, small = it.slot === 'ability' || it.slot === 'ring';
  return Math.round(small ? 6 + t * t * 8 : 3 + t * t * 1.6);  // T10 weapon ~163, T11 armor ~197, T5 ability ~206
}

// which line hatches from an egg: one of its family's two (any family for an egg without one)
export function hatchKind(family, r = Math.random) {
  const kinds = Object.keys(PET_KINDS).filter((k) => !FAMILIES[family] || PET_KINDS[k].family === family);
  return kinds[Math.floor(r() * kinds.length)];
}
export function newPet(kind, rarity, lv = 1) {
  const p = upgradePet({ id: 'pet' + Date.now().toString(36) + Math.floor(Math.random() * 99999).toString(36), kind, rarity, ab: { heal: { lv, xp: 0 }, magic: { lv, xp: 0 } } });
  if (p.ab.shield) p.ab.shield.lv = lv;
  return p;
}
// feed a pet: split the meal between its abilities, level them up to the cap. Returns the abilities that levelled.
export function feed(p, power) {
  const ups = [];
  abilityOrder(p).forEach((a, k) => {
    const A = p.ab[a];
    if (A.lv >= petCap(p)) return;
    A.xp += Math.round(power * SHARE[k]);
    const was = A.lv;
    while (A.lv < petCap(p) && A.xp >= petXpToNext(A.lv)) { A.xp -= petXpToNext(A.lv); A.lv++; }
    if (A.lv >= petCap(p)) A.xp = 0;
    if (A.lv > was) ups.push(`${ABILITIES[a].name} ${A.lv}`);
  });
  return ups;
}
// FUSE two pets of one rarity into one of the next. Like the old game: only each pet's MAIN ability has to be at the cap.
// The new pet keeps the better of each ability level, wears whichever skin you choose, and its cap rises.
export const FUSE_GOLD = { common: 600, uncommon: 2500, rare: 7500, legendary: 20000 };
export const mainMaxed = (p) => p.ab[abilityOrder(p)[0]].lv >= petCap(p);
export function canMorph(a, b) {
  if (!a || !b || a === b) return 'Choose two different pets.';
  if (a.rarity !== b.rarity) return 'Both pets must be the same rarity.';
  if (!RARITY[a.rarity].morph) return 'Divine pets are as great as pets get.';
  const short = [a, b].filter((q) => !mainMaxed(q)).map((q) => `${PET_KINDS[q.kind].name} (${ABILITIES[abilityOrder(q)[0]].name} ${q.ab[abilityOrder(q)[0]].lv}/${petCap(q)})`);
  if (short.length) return `Each pet's main ability must reach ${petCap(a)} first. Still growing: ${short.join(', ')}.`;
  return null;
}
// what a pet looks like and is called: its line's form for its main ability's level
export const petStage = (p) => { const L = p.ab ? p.ab[abilityOrder(p)[0]].lv : 1; return L >= EVOLVE_AT[2] ? 2 : L >= EVOLVE_AT[1] ? 1 : 0; };
export const petForm = (p, stage = petStage(p)) => PET_KINDS[p.kind].forms[stage];
export const petSprite = (p, stage) => 'pt2_pets/' + petForm(p, stage);
export const petName = (p, stage) => title(petForm(p, stage));
// the eggs: one per family x rarity (art pt2_eggs/<family>_<rarity>)
export const eggId = (family, rarity) => `egg_${family}_${rarity}`;
export function morph(a, b, kind = a.kind) {
  const next = RARITY_ORDER[RARITY_ORDER.indexOf(a.rarity) + 1];
  const p = newPet(kind, next);
  for (const k of new Set([...Object.keys(a.ab), ...Object.keys(b.ab)])) p.ab[k] = { lv: Math.max(a.ab[k] ? a.ab[k].lv : 1, b.ab[k] ? b.ab[k].lv : 1), xp: 0 };
  return upgradePet(p);
}
