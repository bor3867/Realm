// Everything you can talk to or break open, in every dungeon (and the realm): it answers. Standing beside a talkable
// thing makes it the nearest NPC, and talking to it (g.interact, the same route as the key and the button) does
// something you can see: a menu, words, a change to it, loot, a map change. Chests break open under your shots and
// drop a bag. (The Grand Orrery's own fight is not touched; its dungeon's objects are.)
//   node tools/check_dungeon_objects.mjs [dungeon ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 5; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const TALK = new Set(['scope', 'mask', 'maskstand', 'mirror', 'sigil', 'alarm', 'journal', 'petyard', 'shop', 'forge', 'board', 'talk', 'lore', 'wish', 'altar', 'dig', 'fish', 'cat', 'bard', 'fortune', 'waypoint', 'riddle', 'mystery']);
const only = process.argv.slice(2), problems = [];
let talked = 0, chests = 0;
const snap = (g, o) => JSON.stringify([Object.entries(o).filter(([, v]) => typeof v !== 'object' || v === null), g.events.length, g.bags.length, g.save.gold, g.save.fame, g.player.inv, g.map.name, (g.vfx || []).length, g.player.hp, g.player.x, g.player.y, g.fx.length, (g.bubbles || []).length]);
for (const where of ['realm', ...Object.keys(DUNGEONS)]) {
  if (only.length && !only.includes(where)) continue;
  const g = new Game({ reg }, { fame: 500, gold: 5000, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.god = true;
  g.enter(where);
  const p = g.player, objs = g.map.objects.filter((o) => o.interact && !o.hidden);
  for (const o of objs) {
    if (g.map.name !== (g.map.name)) break;
    if (TALK.has(o.interact)) {
      g.enemies.length = 0; p.x = o.x + 1.1; p.y = o.y + 0.3; g.unstick(p);
      for (let k = 0; k < 3; k++) { p.hp = 1e6; g.update(1 / 60); }
      if (g.nearNPC !== o) { if (Math.hypot(p.x - o.x, p.y - o.y) < 1.5) problems.push(`${where}: ${o.interact} (${o.label || o.sprite}) is not picked up as the nearest NPC`); continue; }
      const before = snap(g, o), bub = g.bubble.bind(g); let said = 0; g.bubble = (...a) => { said++; return bub(...a); };
      const say0 = g.say ? g.say.bind(g) : null; if (say0) g.say = (...a) => { said++; return say0(...a); };
      let err = null; try { g.interact(o); for (let k = 0; k < 2; k++) g.update(1 / 60); } catch (x) { err = x.message; }
      g.bubble = bub; if (say0) g.say = say0;
      talked++;
      if (err) problems.push(`${where}: talking to ${o.interact} threw: ${err}`);
      else if (!said && snap(g, o) === before) problems.push(`${where}: ${o.interact} (${o.label || o.sprite}) did nothing when talked to`);
      if (g.map.kind !== DUNGEONS[where] && where !== 'realm' && g.map.name !== objs.mapName) { /* a waypoint or portal may move you: fine */ }
      if (g.mode !== 'play') g.mode = 'play';
    } else if (o.interact === 'chest' && !o.opened && !o.admin) {
      if (o.guards) for (const q of o.guards) q.dead = true;
      const bags0 = g.bags.length; let k = 0;
      while (!o.opened && k++ < 400) g.hitObject(o.x, o.y, 500);
      for (let f = 0; f < 3; f++) g.update(1 / 60);
      chests++;
      if (!o.opened) problems.push(`${where}: a chest at ${o.x},${o.y} would not open`);
      else if (g.bags.length <= bags0 && !o.starVault) problems.push(`${where}: a chest opened but dropped no bag`);
    }
  }
}
console.log(`${talked} talks and ${chests} chests checked`);
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'everything answers');
process.exit(problems.length ? 1 : 0);
