// Headless check of the Giant Watermelon (src/melon.js): it spawns on Greenmarch/Thornwood ground, takes hits
// without fighting back, bursts, drops its loot on the burst's last frame, leaves its halves for 20 s, rots after
// 10 minutes if nobody breaks it, and a slice heals over time. Also: how often the natural spawn fires.
//   node tools/check_melon.mjs
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { Game } = await import('../src/game.js');
const { MELON } = await import('../src/melon.js');
const { BIOMES } = await import('../src/world/maps.js');
const { ITEMS } = await import('../src/data/items.js');
const g = new Game({}, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.god = true; g.enter('realm');
const p = g.player, m = g.map, problems = [];
const step = (s) => { for (let k = 0; k < s * 60; k++) g.update(1 / 60); };
// 1. a spot: only on the Greenmarch or the Thornwood
for (let k = 0; k < 20; k++) { const at = g.melonSpot(p); if (at && !['lowlands', 'thornwood'].includes(BIOMES[m.biome[Math.floor(at.y) * m.w + Math.floor(at.x)]])) problems.push('spot outside its lands'); }
// 2. break one
g.enemies.length = 0; g.projectiles.length = 0;
const e = g.spawnMelon({ x: p.x + 3, y: p.y }, false);
const hp0 = p.hp; step(3);
if (g.projectiles.length) problems.push('it shot something');
if (p.hp < hp0) problems.push('it hurt you');
let t0 = g.t, bagAt = null, burstAt = null;
while (!e.dead && g.t - t0 < 60) { g.damageEnemy(e, 300, e.x, e.y, true); step(0.2); }
burstAt = g.t - e.deadT;
const bags0 = g.bags.length;
for (let k = 0; k < 60 && bagAt === null; k++) { g.update(1 / 60); if (g.bags.length > bags0) bagAt = g.t; }
if (bagAt === null) problems.push('no loot');
else if (Math.abs(bagAt - burstAt - MELON.dropAt) > 0.1) problems.push(`loot at ${(bagAt - burstAt).toFixed(2)}s after the burst`);
const bag = g.bags[g.bags.length - 1], items = bag ? bag.items.filter(Boolean) : [];
if (!items.includes('watermelon_slice')) problems.push('no slice');
const halves = m.objects.find((o) => o.melonOpen);
if (!halves) problems.push('no halves'); step(MELON.open + 1);
if (m.objects.some((o) => o.melonOpen)) problems.push('halves never faded');
// 3. one left alone rots away
const e2 = g.spawnMelon({ x: p.x + 3, y: p.y }, false); e2.melonUntil = g.t + 1; step(1.5);
if (!e2.dead) problems.push('never rotted');
// 4. a slice mends over time
p.hp = 10; p.inv[0] = 'watermelon_slice'; g.useIn(p.inv, 0, 'inv'); const h1 = p.hp; step(5.2);
if (!(h1 >= 50 && p.hp >= Math.min(g.stat("hp"), h1 + 190) - 1)) problems.push(`slice healed ${h1} then ${p.hp}`);
// 5. every melon item exists, with an icon from the registry
for (const r of MELON.rolls) for (const id of r.one) if (!ITEMS[id] || !ITEMS[id].reg) problems.push('missing item ' + id);
// 6. loot odds over many bursts, and how often one ripens
const tally = {}; for (let k = 0; k < 4000; k++) for (const id of g.melonLoot()) tally[id] = (tally[id] || 0) + 1;
const hours = Math.log(0.5) / Math.log(1 - MELON.p) * MELON.every / 3600;
console.log('per 1000 melons:', Object.entries(tally).map(([k, v]) => `${k} ${Math.round(v / 4)}`).join(', '));
console.log(`a melon ripens about once per ${hours.toFixed(2)} h of realm time (median)`);
console.log(problems.length ? 'PROBLEMS: ' + problems.join('; ') : 'melon OK');
process.exit(problems.length ? 1 : 0);
