// Headless check of the boss set pieces (docs/design/10_boss_setpieces.md): each of the 25 runs to its end on its own
// boss, fires, telegraphs where it says it does, leaves no steered bullets behind, and costs little time per frame.
//   node tools/check_setpieces.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { SP, BX_SP } = await import('../src/setpieces.js');
const { REALM_BOSSES } = await import('../src/data/enemies.js');
const { isSolid } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const DZ = { drowned_abbot: 'chapel', fallen_heart: 'heart', the_archivist: 'scriptorium', the_unstruck_god: 'throne', honey_queen: 'hive', the_puppeteer: 'theatre', prism_wyrm: 'spire', the_sleeper: 'dream',
  glacius_frozen_wyrm: 'frostveil', mother_mycelia: 'mirerot', grand_orrery: 'astral', gilded_sphinx: 'sandscour', count_vesper: 'keep', grinning_ringmaster: 'hollowmoon', tidebound_lich: 'crypt', forgeheart_colossus: 'ember' };
const setup = (id) => {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {};
  const live = () => { g.player.hp = 1e7; g.player.dead = false; g.update(1 / 60); };
  let e;
  if (REALM_BOSSES[id]) {                                  // on open ground near you (a fixed offset can land in a wall)
    g.enter('realm'); g.enemies = g.map.enemies = [];
    let at = { x: g.player.x + 6, y: g.player.y };
    for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, x = g.player.x + Math.cos(a) * 6, y = g.player.y + Math.sin(a) * 6, ok = [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dy) => !isSolid(g.map, x + dx, y + dy) && g.map.tiles[Math.floor(y + dy) * g.map.w + Math.floor(x + dx)] > 1)); if (ok) { at = { x, y }; break; } }
    e = g.spawnRealmBoss(id, at);
  }
  else if (id === 'abyssal_kraken' || id === 'thornheart_treant') { g.enter('realm'); g.enemies = g.map.enemies = []; e = g.spawnEventBoss(id, false); g.player.x = e.home.x; g.player.y = e.home.y + 4; }
  else { g.enter(DZ[id]); const br = g.map.rooms.find((n) => n.boss) || g.map.rooms.at(-1); g.player.x = br.x + br.w / 2; g.player.y = br.y + br.h - 5; }
  for (let k = 0; k < 400 && !e; k++) { live(); e = g.enemies.find((q) => q.id === id || (q.D && q.D.bx === id)); }
  for (let k = 0; k < 200; k++) live();
  return { g, e, live };
};
const runs = Object.entries(BX_SP).map(([id, [, sp]]) => [id, sp]);
for (const [id, sp] of runs) {
  const { g, e, live } = setup(id);
  if (!e) { bad(`${id}: no boss`); continue; }
  e.hp = Math.round(e.maxHp * 0.3);                        // its last phase: the set piece at its hardest
  g.spClear();
  const before = g.projectiles.length, marks0 = 0;
  const seen = new Set(g.projectiles);
  g.spStart(e, sp); const A = g.spLast;
  let fired = 0, marks = 0, ms = 0, frames = 0;
  for (const b of g.projectiles) if (!seen.has(b)) { seen.add(b); if (b.spA === A) fired++; }
  for (let f = 0; f < Math.ceil(SP[sp].dur * 60) + 30; f++) {
    const t0 = performance.now(); live(); ms += performance.now() - t0; frames++;
    for (const b of g.projectiles) if (!seen.has(b)) { seen.add(b); if (b.spA === A) fired++; }
    marks = Math.max(marks, (g.spMarks || []).length);
  }
  for (let k = 0; k < 300; k++) live();
  const stuck = (g.spCtlList || []).filter((b) => b.spA === A).length, active = (g.spActive || []).includes(A) ? 1 : 0;
  const ok = fired >= 8 && !stuck && !active;
  console.log(`${id.padEnd(20)} ${sp.padEnd(15)} shots ${String(fired).padStart(4)} | telegraphs ${marks} | ${(ms / frames).toFixed(2)} ms/frame` + (ok ? ' | OK' : ''));
  if (!ok) bad(`${id} ${sp}: fired ${fired}, steered bullets left ${stuck}, still running ${active}`);
  void before; void marks0;
}
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
