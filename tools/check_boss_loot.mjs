// Every dungeon boss drops its tiered gear (2026-10-31, the user: "Dungeon bosses should always guarantee their intended
// tiered equipment drops ... Verify loot behavior through actual testing"). Each dungeon is entered, its boss spawned and
// killed through the game's own death path K times; every bag it drops is caught. Per boss:
//   the tiered pieces a kill (fewest, mean), the share of kills with the guaranteed weapon AND armour, their tiers,
//   and the special items (UT, Legendary, Mythic) a kill: these must stay rare.
//   node tools/check_boss_loot.mjs [K] [dungeon ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS, REALM_BOSSES } = await import('../src/data/enemies.js');
const { ITEMS } = await import('../src/data/items.js');
const { bxEnemyDef } = await import('../src/bosses/index.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const K = +process.argv[2] || 40, only = process.argv.slice(3);
const base = (id) => String(id).split('~')[0];
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true;
g.eggDrop = () => null; g.keyDrop = () => null;
let caught = [];
const add0 = g.addBag.bind(g);
g.addBag = (x, y, items, ...r) => { caught.push(...(items || []).map(base)); return add0(x, y, items, ...r); };
let bad = 0;
const rows = [];
const kill = (id, at) => {
  const e = g.spawnRealmBoss(id, at, g.map.kind === 'dungeon' ? bxEnemyDef(id) : undefined);
  e.rb = true; e.bxKill = true; e.state = 'awake';
  if (e.bx) { e.bx.state = 'fight'; e.bx.finished = true; }
  caught = [];
  g.damageEnemy(e, e.hp + 1e12, e.x, e.y, true);
  return caught;
};
const tally = (name, id, at, stars) => {
  let tiered = 0, fewest = 99, both = 0, special = 0, tiers = [];
  for (let k = 0; k < K; k++) {
    const got = kill(id, at).map((i) => ITEMS[i]).filter(Boolean);
    const T = got.filter((it) => typeof it.tier === 'number' && ['weapon', 'armor', 'ability', 'ring'].includes(it.slot));
    tiered += T.length; fewest = Math.min(fewest, T.length);
    if (T.some((it) => it.slot === 'weapon') && T.some((it) => it.slot === 'armor')) both++;
    tiers.push(...T.filter((it) => it.slot === 'weapon' || it.slot === 'armor').map((it) => it.tier));
    special += got.filter((it) => it.ut || it.legendary || it.mythic).length;
  }
  const ok = both === K && special / K < 0.4;
  if (!ok) bad++;
  rows.push(`${ok ? 'OK  ' : 'BAD '} ${name.padEnd(16)} ${String(stars).padEnd(4)} tiered/kill ${(tiered / K).toFixed(2)} (fewest ${fewest})  weapon+armour ${both}/${K}  w/a tiers ${Math.min(...tiers)}-${Math.max(...tiers)}  specials/kill ${(special / K).toFixed(2)}`);
};
for (const [dk, def] of Object.entries(DUNGEONS)) {
  if (only.length && !only.includes(dk)) continue;
  if (!def.boss) continue;
  try { g.enter(dk); } catch (err) { rows.push(`ERR  ${dk}: ${err.message}`); bad++; continue; }
  g.enemies.length = 0;
  const p = g.player;
  tally(dk, def.boss, { x: p.x + 2, y: p.y }, (def.stars || ''));
}
if (!only.length) {
  g.enter('realm'); g.enemies.length = 0;
  for (const id of Object.keys(REALM_BOSSES)) { try { tally(id, id, { x: g.player.x + 2, y: g.player.y }, 'rb'); } catch (err) { rows.push(`ERR  ${id}: ${err.message}`); bad++; } }
}
console.log(rows.join('\n'));
console.log(`${rows.length} bosses, ${bad} without their guaranteed tiered drops (or too many specials)`);
process.exit(bad ? 1 : 0);
