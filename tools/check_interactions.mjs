// Every talkable thing in the Nexus answers the talk key: standing beside it makes it the nearest NPC, and talking to
// it (the same g.interact the key and the button both use) opens its menu or does its thing.
//   node tools/check_interactions.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 5000, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.god = true;
const MENUS = new Set(['shop', 'forge', 'board', 'petyard']);
const problems = []; let n = 0;
for (const o of g.map.objects.filter((q) => q.interact && !q.hidden)) {
  // stand beside it, on whichever side it is the nearest thing to talk to (the melon patch's vines stand 2 tiles apart)
  const p = g.player;
  for (const [dx, dy] of [[1.1, 0.3], [0, 0.8], [-1.1, 0.3], [0, -0.8]]) { p.x = o.x + dx; p.y = o.y + dy; g.unstick(p); for (let k = 0; k < 3; k++) g.update(1 / 60); if (g.nearNPC === o) break; }
  if (['vault', 'fountain', 'shrine'].includes(o.interact)) continue;      // (these act as you walk up, no key)
  n++;
  if (g.nearNPC !== o) { problems.push(`${o.interact} (${o.label || o.sprite}): not picked up as the nearest NPC`); continue; }
  g.events.length = 0; g.bubbles = []; const say0 = (g.bubbleLog = 0);
  let err = null; try { g.interact(o); } catch (x) { err = x.message; }
  if (err) { problems.push(`${o.interact}: threw ${err}`); continue; }
  if (MENUS.has(o.interact) && !g.events.some((e) => e.type === 'npc' && e.which === o.interact)) problems.push(`${o.interact}: the talk key opened no menu`);
  void say0;
}
console.log(`nexus: ${n} talkable things checked`);
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'every NPC answers the talk key');
process.exit(problems.length ? 1 : 0);
