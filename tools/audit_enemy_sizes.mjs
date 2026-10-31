// Every monster's drawn body, in tiles (its opaque pixels as the game draws them: enemyBox), by kind, with the outliers
// flagged against the size rules (2026-10-31): an everyday monster 0.7-1.8 tiles tall, an elite / champion / herald /
// warden 1.2-3.2, a boss 2.5 and up; never under 0.6.
//   node tools/audit_enemy_sizes.mjs [--all]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
const all = process.argv.includes('--all'), rows = [];
for (const [id, D] of Object.entries(ENEMIES)) {
  if (D.dummy || D.speed === 0 && !D.attacks.length) continue;
  let e; try { e = g.addEnemy(id, g.player.x, g.player.y); } catch { continue; }
  const B = g.enemyBox(e); g.enemies.length = 0;
  if (!B) continue;
  const h = +(B.ry / 0.85 * 2).toFixed(2), w = +((B.rx / 0.85) * 2).toFixed(2);
  const kind = D.herald ? 'herald' : D.sheet === 'champions' || D.elite || D.title ? 'elite' : 'mob';
  const [lo, hi] = kind === 'mob' ? [0.7, 1.8] : [1.2, 3.2];
  const flag = h < 0.6 || h < lo ? 'SMALL' : h > hi ? 'BIG' : '';
  if (flag || all) rows.push(`${flag.padEnd(6)} ${kind.padEnd(7)} ${id.padEnd(26)} ${D.name.slice(0, 26).padEnd(27)} ${h} tall x ${w} wide  (scale ${D.scale || 1}, r ${D.r})`);
}
console.log(rows.join('\n'));
console.log(rows.length, all ? 'monsters' : 'outliers');
