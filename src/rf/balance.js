// Realmforge balance (docs/realmforge_port.md, phase 4): each of their dungeons joins one of four bands by its boss's
// HP (their own measure of how hard it is), and each band is measured against our dungeons at the same gear tier:
// their creatures' HP and damage, their boss's HP and damage, and the loot, all brought to that band's numbers.
// Their creature damage was written against a 25-DEF test player: ours comes in with less early, so early bands hit
// softer. Within a band, their own differences (a tough creature, a brittle one) are kept.
// Boss HP is set by fight length, measured (a level-20 test player in the band's own gear tier, always firing): about
// 1.5 min (A), 2 (B), 2.5 (C), 3.5 (D) for that ideal player, so a real one, dodging, takes some 2.5 to 5 minutes.
// Stars by land (requested: one star on the beach and the grass, rising inward to five in Godfall): each dungeon's rating
// is set here to match where its portal drops (tools/rf_build_foes.py, LAND and MOVED). A dungeon rated off its own
// boss's band has its boss's Life brought to that band's usual size (ref) before the band's factor.
export const RATING = { chapel: 1, sewers: 1, oasis: 1, crypt: 2, mire: 2, glade: 2,
  forge: 3, unmelting: 3, cathedral: 3, peaks: 3, clocktower: 3, mirrors: 3,
  crater: 4, pyre: 4, atlas: 4, temple: 4, patch: 4, sanctum: 4,
  rift: 5, monastery: 5, paper: 5, stage: 5, keep: 5, grove: 5 };
export const BANDS = [
  { name: 'S', upTo: 0, ref: 36000, mobHp: 650, mobDmg: 26, bossHp: 1.3, bossDmg: 0.45, defCap: 12, tiers: [2, 5], stars: 1 },  // gentle: new players' first portals
  //            their boss HP up to   creature HP / damage   boss HP x  boss damage x  boss DEF at most (ours at that tier)  loot tiers (old scale)  stars
  { name: 'A', upTo: 45000, ref: 40000, mobHp: 900, mobDmg: 33, bossHp: 1.6, bossDmg: 0.55, defCap: 18, tiers: [3, 6], stars: 2 },   // like the Hive, the Chapel, Mirerot
  { name: 'B', upTo: 65000, ref: 55000, mobHp: 1500, mobDmg: 50, bossHp: 2.2, bossDmg: 0.75, defCap: 26, tiers: [5, 8], stars: 3 },   // like the Crypt, the Theatre, the Keep
  { name: 'C', upTo: 75000, ref: 70000, mobHp: 2600, mobDmg: 80, bossHp: 2.6, bossDmg: 0.95, defCap: 32, tiers: [7, 9], stars: 4 },   // like the Forge, the Observatory
  { name: 'D', upTo: Infinity, ref: 95000, mobHp: 4200, mobDmg: 82, bossHp: 3.1, bossDmg: 1.05, defCap: 38, tiers: [8, 10], stars: 5 }, // like the Ember, the Spire, the Dream
];
const cache = new Map();
// a dungeon's numbers: the band it joins, and the factors that bring its creatures to it
export function rfBalance(DATA, id) {
  if (cache.has(id)) return cache.get(id);
  const dg = DATA.dungeons.find((d) => d.id === id), B = dg && DATA.bosses.find((b) => b.id === dg.boss);
  if (!dg || !B) return null;
  const own = BANDS.find((b) => b.upTo && B.hp <= b.upTo), band = BANDS.find((b) => b.stars === (RATING[id] || own.stars));
  const es = Object.values(DATA.explore.dungeons[id].enemies).filter((e) => !e.boss && !e.rare);
  const hp = es.reduce((a, e) => a + e.hp, 0) / es.length, dmg = es.reduce((a, e) => a + e.dmg, 0) / es.length;
  const out = { band, hp: band.mobHp / hp, dmg: band.mobDmg / dmg, bossHp: band.bossHp * (band === own ? 1 : band.ref / B.hp), bossDmg: band.bossDmg, bossDef: Math.min(B.def || 0, band.defCap), tiers: band.tiers, stars: band.stars };
  cache.set(id, out);
  return out;
}
export const bandOfBoss = (DATA, bossId) => { const dg = DATA.dungeons.find((d) => d.boss === bossId); return dg ? rfBalance(DATA, dg.id) : null; };
