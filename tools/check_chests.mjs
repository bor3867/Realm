// Every chest in every dungeon can be broken: a player 4 tiles off, aiming at the middle of the chest as drawn, fires
// until it breaks (or 12 s pass). Lists the dungeons whose chests stand, and why (guarded, out of reach, missed).
//   node tools/check_chests.mjs [dungeon ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const { isSolid } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let bad = 0;
for (const id of Object.keys(DUNGEONS)) {
  if (only.length && !only.includes(id)) continue;
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.adminOk = () => true; g.command('/ascend'); g.god = true; if (!process.argv.includes('--hosanna')) g.player.equip[0] = 'wand_t9';   // (a plain wand: shots that fly straight; --hosanna: the admin set's pillar wand)
  try { g.enter(id); } catch (err) { console.log(`${id.padEnd(12)} could not enter: ${err.message}`); continue; }
  const chests = g.map.objects.filter((o) => o.interact === 'chest' && !o.opened);
  const out = [];
  for (const o of chests) {
    for (const e of g.enemies) { e.dead = true; e.noLoot = true; }
    g.enemies = g.map.enemies = []; if (o.guards) for (const q of o.guards) q.dead = true;
    const p = g.player, I = g.input; I.scripted = true;
    let spot = null;
    for (const [dx, dy] of [[0, 4], [0, -4], [4, 0], [-4, 0], [3, 3], [-3, 3], [0, 3], [0, 2.5]]) if (!isSolid(g.map, o.x + dx, o.y + dy)) { spot = [o.x + dx, o.y + dy]; break; }
    if (!spot) { out.push(`${o.sprite || 'chest'}@${Math.round(o.x)},${Math.round(o.y)}: nowhere to stand`); continue; }
    let t = 0;
    for (; t < 12 && !o.opened; t += 1 / 30) { p.x = spot[0]; p.y = spot[1]; I.fire = true; I.aimX = o.x; I.aimY = o.y - 0.5; g.update(1 / 30); }
    I.fire = false;
    if (!o.opened) out.push(`${o.sprite || 'chest'}@${Math.round(o.x)},${Math.round(o.y)}: stands (hp ${Math.round(o.hp ?? -1)}/${Math.round(o.maxHp ?? -1)}${o.guards ? ', guarded' : ''}${isSolid(g.map, o.x, o.y) ? ', on a solid tile' : ''}${o.locked ? ', locked' : ''})`);
  }
  if (out.length) bad++;
  console.log(`${out.length ? 'PROBLEM' : 'ok     '} ${id.padEnd(12)} ${chests.length} chests${out.length ? '  ' + out.join(' | ') : ''}`);
}
process.exit(bad ? 1 : 0);
