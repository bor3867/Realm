// Every monster's own items drop (2026-10-28: "check all unique enemies to make sure their items drop from them"):
//   1. every item a monster's table names exists
//   2. a monster: killed through the game's own death path until each named item has had a fair chance (about six
//      drops expected), each must have dropped at least once
//   3. a boss: rolled from its loot table as its death rolls it, the same
//   4. the special items no table names at all (no monster, chest, melon or quest drops them) are listed
//   node tools/check_drops.mjs [monster ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES, REALM_BOSSES, DUNGEON_BOSSES, DUNGEONS } = await import('../src/data/enemies.js');
const { ITEMS, rollLoot } = await import('../src/data/items.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2);
const base = (id) => String(id).split('~')[0];          // (an enchanted roll: the item under it)
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true; g.enter('realm'); g.enemies.length = 0;
g.eggDrop = () => null; g.keyDrop = () => null;            // (not what is checked here)
let missing = 0, never = 0, n = 0;
const named = new Set();
const defs = { ...ENEMIES, ...REALM_BOSSES, ...DUNGEON_BOSSES };
for (const [id, D] of Object.entries(defs)) {
  if (!D || !Array.isArray(D.loot)) continue;
  const own = D.loot.filter((l) => l.id && !/^(pot_|stat_)/.test(l.id));
  for (const l of own) named.add(l.id);
  if (!own.length || (only.length && !only.includes(id))) continue;
  n++;
  const bad = own.filter((l) => !ITEMS[l.id]);
  for (const l of bad) { console.log(`MISSING ${id}: names "${l.id}", which is no item`); missing++; }
  const luck = D.lootLuck || 1, pmin = Math.min(...own.map((l) => Math.min(1, l.p * luck))), K = Math.min(4000, Math.ceil(6 / pmin));
  const got = {};
  if (D.bx || REALM_BOSSES[id] || DUNGEON_BOSSES[id]) {   // a boss: its death rolls its table (src/bosses/boss_loot.js made it)
    for (let k = 0; k < K; k++) for (const it of rollLoot(D.loot, luck, 'dboss')) got[base(it)] = (got[base(it)] || 0) + 1;
  } else {                                                   // a monster: its own death path, as you kill it
    const ab = g.addBag.bind(g); g.addBag = (x, y, items) => { for (const it of items) got[base(it)] = (got[base(it)] || 0) + 1; return { x, y, items: [] }; };
    for (let k = 0; k < K; k++) { g.enemies.length = 0; const e = g.addEnemy(id, g.player.x + 3, g.player.y); if (!e) break; e.seen = true; g.damageEnemy(e, 1e9, e.x, e.y, true); }
    g.addBag = ab;
  }
  const dry = own.filter((l) => ITEMS[l.id] && !got[l.id] && K * l.p * luck >= 4);
  for (const l of dry) { console.log(`NEVER   ${id}: "${l.id}" (p ${l.p}) never dropped in ${K} kills`); never++; }
}
// the special items nothing names (no monster's table, no chest, no melon, no quest)
const chestNamed = new Set();
for (const d of Object.values(DUNGEONS)) for (const l of d.chestLoot || []) if (l.id) chestNamed.add(l.id);
const src = ['src/melon.js', 'src/game.js', 'src/data/items.js', 'src/quests.js', 'src/ui.js'].map((f) => { try { return readFileSync(new URL('../' + f, import.meta.url), 'utf8'); } catch { return ''; } }).join('\n');
const orphans = Object.values(ITEMS).filter((it) => (it.ut || it.legendary || it.mythic) && !it.admin && !it.arm && !it.rf && !named.has(it.id) && !chestNamed.has(it.id) && !src.includes(`'${it.id}'`)).map((it) => it.id);
console.log(`${n} monsters with items of their own: ${missing} name an item that isn't one, ${never} items never dropped`);
console.log(`special items nothing names (${orphans.length}):`, orphans.slice(0, 60).join(' '));
process.exit(missing || never ? 1 : 0);
