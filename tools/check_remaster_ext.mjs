// Headless check of the remaster's new content (docs/design/09_remaster.md): monsters fire their new shot now and
// then; champions fire their signature volley. (The original bosses' remaster phases went with the old boss engine.)
//   node tools/check_remaster_ext.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 11; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);   // seeded: the same run every time (its monsters fire on chance)
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const ROOT = new URL('../', import.meta.url), G = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const sheets = { champions: { guide: G('art/sprites/enemies/champions_sheet.json') }, enemies: { guide: G('art/sprites/enemies/enemies_sheet.json') } };
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const mk = () => { const g = new Game({ reg, sheets }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 }); g.newCharacter('priest'); g.persist = () => {}; return g; };
{                                                          // monsters and champions
  const g = mk(); g.enter('realm'); g.enemies = g.map.enemies = []; const p = g.player;
  for (const [id, dx, dy] of [['brine_pilgrim', 4, -2], ['pilgrim_elder', -4, 2]]) if (ENEMIES[id]) { const q = g.addEnemy(id, p.x + dx, p.y + dy); q.seen = true; }
  const seen = new Set();
  for (let f = 0; f < 60 * 25; f++) { p.hp = 1e7; p.dead = false; g.update(1 / 60); for (const b of g.projectiles) if (b.from === 'e' && /^rx_shots\//.test(b.sprite)) seen.add(b.sprite); }
  const m = [...seen].filter((s) => s.includes('brine_pilgrim')).length, c = [...seen].filter((s) => s.includes('pilgrim_elder')).length;
  console.log(`monster new shot: ${m} | champion signature shots: ${c}`);
  if (m < 1 || c < 2) bad('monster/champion new shots');
}
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
