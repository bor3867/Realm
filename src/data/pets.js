// Pets: a companion that follows you everywhere and heals you. Each pet has abilities that level up on their own:
//   Heal (Life), Magic Heal (Mana), and from Rare upward, Shield (a ward that soaks damage).
// Feed it gear (paying gold or fame) to level its abilities: the meal's power is split, most to the pet's main ability.
// Rarity caps the ability levels. Two pets of the same rarity whose abilities are all maxed can MORPH into one pet of
// the next rarity, keeping their levels and raising the cap, all the way to Divine at level 100.
import { ITEMS } from './items.js';
import { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, BOSS } from './enemies.js';

export const PET_KINDS = {
  ember_fox: { name: 'Ember Fox', heal: 1.25, magic: 0.75, desc: 'A fox with a tail that never quite stops smouldering. Warm to curl up against.' },
  tide_turtle: { name: 'Tide Turtle', heal: 1.4, magic: 0.6, desc: 'Slow, patient, and older than it looks. Carries a little sea on its back.' },
  lantern_moth: { name: 'Lantern Moth', heal: 0.6, magic: 1.4, desc: 'Drawn to light, and to people who make it. Its glow refills the mind.' },
  bog_frog: { name: 'Bog Frog', heal: 1.0, magic: 1.0, desc: 'Croaks at monsters. Croaks at you. Croaks at nothing in particular.' },
  rune_owl: { name: 'Rune Owl', heal: 0.75, magic: 1.3, desc: 'A rune glows on its chest. It reads over your shoulder and judges you.' },
  salt_crab: { name: 'Salt Crab', heal: 1.3, magic: 0.7, desc: 'Pinches your enemies, given the chance. Pinches you, given the chance.' },
  frost_kit: { name: 'Frost Kit', heal: 0.9, magic: 1.1, desc: 'A snow-white kit from Runeholt. Cold paws, warm heart.' },
  star_wisp: { name: 'Star Wisp', heal: 1.2, magic: 1.2, desc: 'A crumb of a fallen star that decided to follow you home.' },
};
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

// which kinds hatch from an egg: every kind can come from any egg; the star wisp is shy below rare
export function hatchKind(rarity, r = Math.random) {
  const kinds = Object.keys(PET_KINDS).filter((k) => k !== 'star_wisp' || rarity === 'rare' || rarity === 'legendary');
  return kinds[Math.floor(r() * kinds.length)];
}
export function newPet(kind, rarity) {
  return upgradePet({ id: 'pet' + Date.now().toString(36) + Math.floor(Math.random() * 99999).toString(36), kind, rarity, ab: { heal: { lv: 1, xp: 0 }, magic: { lv: 1, xp: 0 } } });
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
// the skin a pet wears: its kind, gilded at Legendary, celestial at Divine
export const petSprite = (p) => 'pet_' + p.kind + (p.rarity === 'legendary' ? '_gold' : p.rarity === 'divine' ? '_divine' : '');
export function morph(a, b, kind = a.kind) {
  const next = RARITY_ORDER[RARITY_ORDER.indexOf(a.rarity) + 1];
  const p = newPet(kind, next);
  for (const k of new Set([...Object.keys(a.ab), ...Object.keys(b.ab)])) p.ab[k] = { lv: Math.max(a.ab[k] ? a.ab[k].lv : 1, b.ab[k] ? b.ab[k].lv : 1), xp: 0 };
  return upgradePet(p);
}
