// Headless check of the remaster's new content (docs/design/09_remaster.md): each original boss with phase art morphs
// at 66% and 33% (immune, its phase name, the morph), fires its new shots in phases 1-3, and dies; monsters fire their
// new shot now and then; champions fire their signature volley.
//   node tools/check_remaster_ext.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
let RNG = 11; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);   // seeded: the same run every time (its monsters fire on chance)
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { RX_BOSSES } = await import('../src/remaster.js');
const { REALM_BOSSES, DUNGEON_BOSSES, ENEMIES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const ROOT = new URL('../', import.meta.url), G = (p) => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const sheets = { champions: { guide: G('art/sprites/enemies/champions_sheet.json') }, enemies: { guide: G('art/sprites/enemies/enemies_sheet.json') } };
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const mk = () => { const g = new Game({ reg, sheets }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 }); g.newCharacter('priest'); g.persist = () => {}; return g; };
const DZ = { drowned_abbot: 'chapel', fallen_heart: 'heart', the_archivist: 'scriptorium', the_unstruck_god: 'throne', honey_queen: 'hive', the_puppeteer: 'theatre', prism_wyrm: 'spire', the_sleeper: 'dream' };
for (const id of Object.keys(RX_BOSSES)) {
  if (id === 'the_unstruck') continue;
  const g = mk(), live = () => { g.player.hp = 1e7; g.player.dead = false; g.update(1 / 60); };
  let e;
  if (REALM_BOSSES[id]) { g.enter('realm'); g.enemies = g.map.enemies = []; e = g.spawnRealmBoss(id, { x: g.player.x + 6, y: g.player.y }); }
  else { g.enter(DZ[id]); const br = g.map.rooms.find((n) => n.boss) || g.map.rooms.at(-1); g.player.x = br.cx + 0.5; g.player.y = br.cy + 4; for (let k = 0; k < 120; k++) live(); e = g.enemies.find((q) => q.id === id); }
  if (!e) { bad(`${id}: no boss`); continue; }
  const shots = [new Set(), new Set(), new Set()], morphs = [], names = [];
  const ob = g.banner.bind(g); g.banner = (t, ms) => { names.push(t); ob(t, ms); };
  for (let n = 1; n <= 3; n++) {                           // hold it in each phase a while and watch its new shots
    e.hp = Math.round(e.maxHp * [0.95, 0.55, 0.25][n - 1]);
    for (let f = 0; f < 60 * 60; f++) {                  // a minute: long enough for a rotation with set pieces in it
      live();
      if (e.rxMorph && !morphs.includes(e.rxMorph.to)) { morphs.push(e.rxMorph.to); if (!(e.invulnT > 0)) bad(`${id}: not immune while it morphs`); }
      for (const b of g.projectiles) if (b.from === 'e' && /^rx_shots\//.test(b.sprite)) shots[n - 1].add(b.sprite.split('.')[1]);
    }
  }
  e.surviveUntil = 0; e.frenzyUntil = 0; e.invulnT = 0; for (const s2 of e.shieldBy || []) s2.dead = true;
  g.damageEnemy(e, e.hp + 1e7, e.x, e.y, true);
  for (let k = 0; k < 120; k++) live();
  const want = RX_BOSSES[id][0], phaseNames = Object.values(reg.resolve(`rx_${id}/${id}`).meta.phaseNames);
  const perPhase = [0, 1, 2].map((k) => want.slice(k * 2, k * 2 + 2).filter((s2) => shots[k].has(s2)).length);
  const named = phaseNames.slice(1).every((nm) => names.some((t) => t.toUpperCase().includes(nm.toUpperCase())));
  const ok = morphs.join() === '2,3' && perPhase.every((c) => c === 2) && named;
  console.log(`${id.padEnd(20)} morphs ${morphs.join(',') || '-'} | new shots by phase ${perPhase.join('/')} (of 2/2/2) | ${e.dead ? 'died' : 'immune to the forced kill (its own mechanic)'}` + (ok ? ' | OK' : ''));
  if (!ok) bad(`${id}: morphs ${morphs}, named ${named}, shots ${shots.map((q) => [...q].join('+')).join(' / ')}`);
}
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
