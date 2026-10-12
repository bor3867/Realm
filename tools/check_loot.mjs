// Loot bags: they expire (90 s, rare 180 s), keep their time while you are away from their map, vanish when emptied,
// and never take items out of your own inventory or vault.
//   node tools/check_loot.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true;
const p = g.player, problems = [], run = (s) => { for (let k = 0; k < s * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
const say = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) problems.push(what); };
g.enter('realm'); g.enemies.length = 0; run(0.1);
// a monster's drop, and a rare one
const b1 = g.addBag(p.x + 4, p.y, ['pot_hp']), b2 = g.addBag(p.x - 4, p.y, ['oathbreaker']);
say(g.bags.includes(b1) && g.bags.includes(b2), 'drops make bags');
run(95); say(!g.bags.includes(b1), 'a plain bag is gone after 90 s'); say(b2.rare && g.bags.includes(b2), 'a rare bag (a Mythic) lasts longer');
run(90); say(!g.bags.includes(b2), 'every bag is gone after 185 s');
// emptied by hand: it vanishes at once
const b3 = g.addBag(p.x, p.y + 0.3, ['pot_hp']); run(0.05);
const slot = p.inv.indexOf(null); g.nearBag = b3; g.moveItem ? g.moveItem('ground', 0, 'inv', slot) : null;
run(0.05); say(p.inv[slot] === 'pot_hp' && !g.bags.includes(b3), 'a bag emptied by hand disappears, the item in your pack');
// away from its map: it keeps counting
p.x += 6; run(0.05);
const b4 = g.addBag(p.x + 3, p.y, ['pot_mp']); const realm = g.map;
g.enter('nexus'); run(120); g.enter('realm');
say(!realm.bags.includes(b4) && !g.bags.includes(b4), 'a bag left in the realm while you were away for 2 minutes has expired when you return');
// standing at it keeps it (you are looting), but not for ever once you leave
const b5 = g.addBag(p.x, p.y + 0.3, ['pot_mp']); run(100); const kept = g.bags.includes(b5); p.x += 5; run(1);
say(kept && !g.bags.includes(b5), 'a bag you stand at waits for you, and expires once you walk off');
// nothing leaves your inventory
const inv0 = JSON.stringify(p.inv); run(200); say(JSON.stringify(p.inv) === inv0, 'expiry never touches your inventory');
console.log(problems.length ? `${problems.length} PROBLEMS` : 'loot bags OK');
process.exit(problems.length ? 1 : 0);
