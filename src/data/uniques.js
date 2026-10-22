// Every untiered, legendary and mythic item does something of its own, and looks like nothing else when used
// (docs/design/11_unique_items.md). Two parts:
// - EFFECTS: a special for each weapon, a passive for each armour and ring, and for abilities a signature (`sig`) that
//   fires on every use whatever the ability's type (Game.abilitySig), wherever an item had nothing of its own or the
//   same thing as another item. No seeking shots (the player asked for none).
// - shots: at load, every special item's projectile (its weapon's, its ability's burst, its signature's, its prism's)
//   is made unique among items, chosen from the shots of whatever drops it (a boss's or monster's own new shots
//   first), so a relic looks like where it came from (assignItemShots, run once the registry exists).
import { ITEMS } from './items.js';
import { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, BOSS } from './enemies.js';

// these ability types draw their own effect (an anvil, a pillar of light, thralls, glass decoys, a hook, a kite, a
// clock) and never fire their burst as shots: their burst keeps its sprite, and the item's own shot is its signature
export const DRAWS_OWN = new Set(['seal', 'halo', 'reliquary', 'mirror', 'hookline', 'kite', 'stopwatch']);
const W = (o) => ({ weapon: o }), Pv = (o) => ({ passive: o }), Sg = (o) => ({ sig: o });
export const EFFECTS = {
  // ---- weapons that had none
  stringcutter: W({ chain: { n: 3, f: 0.45 } }),                       // it cuts through one and on to the next three
  vinegrown_staff: W({ explode: { r: 1.2, f: 0.5 } }),                  // a seed that bursts where it lands
  seedspitter_bow: W({ split: { n: 5, f: 0.25 } }),                     // arrows that scatter seeds
  heartwood_bow: W({ lifesteal: 0.015, slow: { f: 0.1, t: 0.5 } }),     // the living wood drinks, and roots
  comet_bow: W({ starfall: { every: 5, r: 1.6, dmg: 220 } }),           // every fifth volley calls a comet down
  gilded_scepter: W({ curse: { f: 0.18, t: 3 } }),                      // the pharaoh's mark: they take more
  batwing_bow: W({ lifesteal: 0.025, chain: { n: 1, f: 0.5 } }),        // a bat that bites twice
  ringmaster_cane: W({ boomerang: true, crit: { p: 0.1, x: 2 } }),      // thrown, and it comes back for an encore
  carousel_bow: W({ accel: 22 }),                                       // round and round, faster and faster
  runewarden_blade: W({ explode: { r: 1.4, f: 0.35 } }),                // runes that go off on the strike
  hexcircle_staff: W({ curse: { f: 0.25, t: 2 } }),                     // a hex on every bolt
  tempest_staff: W({ chain: { n: 2, f: 0.7 } }),                        // the storm leaps
  // ---- weapons that shared an effect with another
  pitfighters_cleaver: W({ burn: { dps: 70, t: 2 }, crit: { p: 0.08, x: 2 } }),
  starforged_katana: W({ crit: { p: 0.12, x: 2 }, starfall: { every: 6, r: 1.4, dmg: 180 } }),
  the_last_reflection: W({ crit: { p: 0.25, x: 2.5 }, explode: { r: 1, f: 0.3 } }),
  crimson_rapier: W({ lifesteal: 0.02, burn: { dps: 40, t: 2 } }),      // it bleeds them as it drinks
  glacial_fang: W({ slow: { f: 0.3, t: 1.4 }, crit: { p: 0.06, x: 3 } }),
  wand_of_hoarfrost: W({ slow: { f: 0.3, t: 1.2 }, explode: { r: 0.9, f: 0.25 } }),   // and its frost shatters on them
  // ---- armour that had none
  the_last_curtain: Pv({ dodge: 0.08, manaonkill: 4 }),
  prismglass_mantle: Pv({ prism: { every: 3, n: 6, dmg: 120 } }),
  rindguard: Pv({ lowregen: 25, nopoison: true }),
  embalmers_wraps: Pv({ cheatdeath: 90 }),
  runewarden_brigandine: Pv({ aegis: 4 }),
  hexcircle_robe: Pv({ manashield: 0.22, slowbonus: 0.08 }),
  pitfighters_harness: Pv({ rage: 0.3 }),
  oathsworn_bulwark: Pv({ emberthorns: 50, aegis: 1 }),
  dawnchoir_robe: Pv({ aura: { dps: 40, r: 2.8, slow: 0 } }),
  graverite_shroud: Pv({ manaonkill: 6, killheal: 15 }),
  leviathan_hide: Pv({ aura: { dps: 0, r: 2.6, slow: 0.2 } }),          // the undertow round you
  glassfencer_jerkin: Pv({ dodge: 0.06, critheal: 4 }),
  tempest_robe: Pv({ prism: { every: 2.5, n: 4, dmg: 140 } }),          // lightning crackles off you
  clockwork_robe: Pv({ slowbonus: 0.2, momentum: 0.05 }),
  bellwrights_mail: Pv({ aegis: 5, manashield: 0.1 }),
  // ---- rings that had none (or the same as another)
  honeyguard_band: Pv({ lowregen: 20, killheal: 10 }),
  the_seventh_colour: Pv({ prism: { every: 2, n: 7, dmg: 150 } }),      // seven colours, every two seconds
  nightlight_ring: Pv({ critheal: 3, crit: { p: 0.05, x: 2 } }),
  ring_of_the_rind: Pv({ aegis: 2 }),
  dewdrop_ring: Pv({ manaonkill: 3 }),
  abyssal_pearl: Pv({ manashield: 0.15 }),
  ring_of_the_wyrm: Pv({ slowbonus: 0.15, nofreeze: true }),
  ring_of_rot: Pv({ nopoison: true, execute: 0.15 }),
  astral_signet: Pv({ momentum: 0.08 }),
  scarab_ring: Pv({ killburst: 0.25 }),
  signet_of_the_count: Pv({ rage: 0.2 }),
  gravedust_band: Pv({ killburst: 0.35 }),
  // ---- abilities: a signature on every use (sig.kind: nova | mines | wave | spiral | rain | lance)
  the_waking_bell: Sg({ kind: 'rain', n: 9, dmg: 160 }),               // bells toll down on the cursor
  melon_orb: Sg({ kind: 'mines', n: 6, dmg: 150 }),
  runewarden_ward: Sg({ kind: 'nova', n: 14, dmg: 140 }),
  hexcircle_grimoire: Sg({ kind: 'wave', n: 7, dmg: 150 }),
  rind_bulwark: Sg({ kind: 'mines', n: 4, dmg: 170 }),
  sphinx_helm: Sg({ kind: 'rain', n: 7, dmg: 170 }),
  oathsworn_seal: Sg({ kind: 'wave', n: 9, dmg: 140 }),
  spore_bomb: Sg({ kind: 'spiral', n: 3, dmg: 110 }),
  the_thirteenth_page: Sg({ kind: 'nova', n: 13, dmg: 160 }),
  crimson_chalice: Sg({ kind: 'spiral', n: 2, dmg: 150 }),
  glassfencer_mirror: Sg({ kind: 'wave', n: 5, dmg: 180 }),
  dawnchoir_halo: Sg({ kind: 'rain', n: 11, dmg: 130 }),
  leviathan_line: Sg({ kind: 'lance', n: 3, dmg: 260 }),
  clockwork_stopwatch: Sg({ kind: 'spiral', n: 4, dmg: 100 }),
  choir_of_bones: Sg({ kind: 'rain', n: 6, dmg: 190 }),
  graverite_reliquary: Sg({ kind: 'mines', n: 5, dmg: 160 }),
  colossus_core: Sg({ kind: 'nova', n: 18, dmg: 150 }),
  pitfighters_bellows: Sg({ kind: 'mines', n: 3, dmg: 210 }),
  tempest_kite: Sg({ kind: 'spiral', n: 5, dmg: 90 }),
  // kites, hooklines and stopwatches draw their own effects: these get a signature so their use shows a shot of their own
  the_thunderhead: Sg({ kind: 'nova', n: 10, dmg: 170 }),
  the_squall: Sg({ kind: 'rain', n: 8, dmg: 150 }),
  the_eye_of_the_storm: Sg({ kind: 'spiral', n: 6, dmg: 120 }),
  drowned_mans_line: Sg({ kind: 'lance', n: 2, dmg: 300 }),
  abyssal_line: Sg({ kind: 'wave', n: 6, dmg: 170 }),
  the_leviathans_maw: Sg({ kind: 'lance', n: 4, dmg: 240 }),
  the_broken_hourglass: Sg({ kind: 'nova', n: 12, dmg: 180 }),
  the_hourglass_of_sand: Sg({ kind: 'rain', n: 10, dmg: 120 }),
  the_unwound_spring: Sg({ kind: 'spiral', n: 3, dmg: 140 }),
};
for (const [id, E] of Object.entries(EFFECTS)) {
  const it = ITEMS[id];
  if (!it) continue;
  if (E.weapon && it.weapon && !it.reworked) it.weapon.special = { ...(it.weapon.special || {}), ...E.weapon };   // (a reworked weapon keeps its one hook: src/data/weapon_rework.js)
  if (E.passive && !it.gear) it.passive = { ...(it.passive || {}), ...E.passive };   // (reworked armour and rings have their one mechanic: src/data/gear_rework.js)
  if (E.sig && it.ability && !(it.reworked && (it.ability.halo || it.ability.sigil || it.ability.myth) && E.sig.kind !== 'orbit')) it.ability.sig = { ...E.sig };   // (a reworked ability has its own shape or sigil instead; orbiters stay)
}
// every special ability of a type that draws its own effect gets a signature, if the table above gave it none: a shape
// and a size of its own (no two the same)
{
  const KINDS = ['nova', 'rain', 'mines', 'wave', 'spiral', 'lance'], taken = new Set();
  for (const it of Object.values(ITEMS)) if (it.ability && it.ability.sig) taken.add(it.ability.sig.kind + it.ability.sig.n);
  let k = 0;
  for (const it of Object.values(ITEMS)) {
    if (it.base || it.admin || it.arm || !(it.ut || it.mythic || it.legendary) || !it.ability || it.ability.sig || it.ability.halo || it.ability.sigil || it.ability.myth || !DRAWS_OWN.has(it.type)) continue;
    let sig;
    for (let tries = 0; tries < 60; tries++, k++) { const kind = KINDS[k % 6], n = 4 + (Math.floor(k / 6) % 9); if (!taken.has(kind + n)) { sig = { kind, n, dmg: 120 + (k % 5) * 15 }; taken.add(kind + n); k++; break; } }
    it.ability.sig = sig;
  }
}
// the wand of hoarfrost's pale snowflakes vanished on ice and snow at 19 tiles a second: a slower, bolder shot
if (ITEMS.wand_of_hoarfrost) Object.assign(ITEMS.wand_of_hoarfrost.weapon, { speed: 13, range: 8.6, size: 0.5 });

// ---- unique shots, themed by where an item comes from
const special = () => Object.values(ITEMS).filter((it) => !it.base && (it.ut || it.mythic || it.legendary) && !it.admin && !it.arm);   // (the armory's items keep their own shots)
function droppers() {
  const by = {};
  const note = (owner, loot) => { for (const l of loot || []) if (l.id) (by[l.id] = by[l.id] || []).push(owner); };
  for (const [id, E] of Object.entries(ENEMIES)) note(id, E.loot);
  for (const [id, B] of Object.entries(REALM_BOSSES)) note(id, B.loot);
  for (const [id, B] of Object.entries(DUNGEON_BOSSES)) note(id, B.loot);
  note('the_unstruck', BOSS.loot);
  return by;
}
// the projectile slots an item has: [object, key] pairs (only the ones that draw a shot)
const NO_SHOT = new Set(['none', 'zap', 'hook']);
function slots(it) {
  const out = [];
  if (it.weapon && it.weapon.proj) out.push([it.weapon, 'proj']);
  const B = it.ability && it.ability.burst;
  if (B && B.proj && B.count > 0 && !NO_SHOT.has(B.proj) && !DRAWS_OWN.has(it.type)) out.push([B, 'proj']);
  if (it.ability && it.ability.sig && it.ability.sig.kind !== 'orbit') out.push([it.ability.sig, 'proj']);   // an orbit draws its own sprites
  if (it.passive && it.passive.prism) out.push([it.passive.prism, 'proj']);
  if (it.weapon && it.weapon.special && it.weapon.special.split && !it.weapon.special.split.proj) out.push([it.weapon.special.split, 'proj']);
  return out;
}
let assigned = false;
export function assignItemShots(reg, bxLoot = {}) {
  if (assigned || !reg) return;
  assigned = true;
  const shots = reg.list((d) => d.kind === 'shot').map((d) => d.key).sort();
  const used = new Set();
  for (const it of Object.values(ITEMS)) if (!(it.ut || it.mythic || it.legendary) || it.base) for (const [o, k] of slots(it)) if (o[k]) used.add(o[k]);   // tiered gear keeps its own
  const drop = droppers();
  for (const [boss, loot] of Object.entries(bxLoot)) for (const l of loot || []) if (l.id) (drop[l.id] = drop[l.id] || []).push(boss);
  const words = (id) => id.split('_').filter((w) => w.length > 3 && !['the', 'ring', 'staff', 'bow', 'wand', 'robe', 'armor', 'blade'].includes(w));
  const pick = (it, cur) => {
    const owners = drop[it.id] || [], ws = words(it.id);
    const themed = shots.filter((s) => owners.some((o) => s.includes(`/${o}.`)));
    const named = shots.filter((s) => ws.some((w) => s.includes(w)));
    for (const s of [...themed, ...named]) if (!used.has(s)) return s;
    if (cur && !used.has(cur) && !cur.includes('/')) return cur;                     // its old sprite, if nobody else has it
    return shots.find((s) => !used.has(s) && /^(rx_shots|bx_shots|bx2_shots|el_shots)\//.test(s));
  };
  for (const it of special()) for (const [o, k] of slots(it)) {
    const cur = o[k];
    const n = special().filter((q) => q !== it && slots(q).some(([o2, k2]) => o2[k2] === cur)).length;
    if (cur && n === 0 && !used.has(cur) && it.id !== 'wand_of_hoarfrost') { used.add(cur); continue; }   // already its own
    const s = pick(it, cur);
    if (s) { o[k] = s; used.add(s); }
  }
}
