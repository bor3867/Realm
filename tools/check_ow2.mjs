// Headless check of the Realm Update overworld monsters (Phase 2d): every one spawns, fights and dies cleanly, and
// the five ow2 signatures happen: the hermit's shell, the mole surfacing, the archer's volley, the dwarf fetching
// his pick, the scorpion's split stinger when hot.
//   node tools/check_ow2.mjs
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { Game } = await import('../src/game.js');
const { ENEMIES } = await import('../src/data/enemies.js');
const g = new Game({}, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.god = true; g.enter('realm');
const p = g.player, m = g.map;
let fail = 0;
// the world: every land holds some of its new monsters, and the campfire bands are there
const by = {};
for (const e of g.enemies) if (e.D.reg) by[e.D.biome] = (by[e.D.biome] || 0) + 1;
console.log('in the realm:', JSON.stringify(by), '| bands at campfires:', g.enemies.filter((e) => e.pack && (e.id === 'orc_brute' || e.id === 'hedge_goblin')).length);
for (const b of ['shore', 'lowlands', 'thornwood', 'runeholt', 'godfall']) if (!by[b]) { console.log('no new monsters in', b); fail++; }
const ids = Object.keys(ENEMIES).filter((id) => (ENEMIES[id].reg || '').startsWith('ow_enemies/') || (ENEMIES[id].reg || '').startsWith('ow2_enemies/'));   // the overworld's own (the dungeons have their own checks)
for (const id of ids) {
  g.enemies.length = 0; g.projectiles.length = 0;
  p.x = m.spawn.x; p.y = m.spawn.y;
  const e = g.addEnemy(id, p.x + 4, p.y), seen = new Set(), sprites = new Set();
  let shell = 0, fetch = 0, surfaced = 0, dug = false, hot = 0, t = 0;
  for (let f = 0; f < 60 * 25 && !e.dead; f++) {
    t += 1 / 60;
    p.x = m.spawn.x + Math.cos(t * 0.5) * 2; p.y = m.spawn.y + Math.sin(t * 0.5) * 2;
    const wasUnder = e.under;
    g.update(1 / 60);
    if (e.shellT > 0) shell++;
    if (e.fetch) fetch++;
    if (wasUnder && !e.under) surfaced++;
    if (e.under) dug = true;
    for (const b of g.projectiles) { sprites.add(b.sprite); if (b.mv && b.mv.split) hot++; }
    const waitHot = ENEMIES[id].heat && e.hp < e.maxHp * 0.34 && !hot && (e.hotWait = (e.hotWait || 0) + 1 / 60) < 8;   // let it run hot a while
    if (!waitHot && f % 15 === 0 && t > (ENEMIES[id].surfaceFling ? 12 : 6)) g.damageEnemy(e, Math.round(e.maxHp / 24) + (e.D.def || 0), e.x, e.y, true);
    seen.add(e.state);
  }
  const problems = [];
  if (!e.dead) problems.push('did not die');
  if (!sprites.size) problems.push('never shot');
  if (!Number.isFinite(e.x + e.y)) problems.push('NaN');
  const D = ENEMIES[id];
  if (D.shell && !shell) problems.push('never hid in its shell');
  if (D.attacks.some((a) => a.pick) && !fetch) problems.push('never fetched its pick');
  if (D.surfaceFling && !surfaced && !dug) problems.push('never burrowed');
  if (D.heat && !hot) problems.push('stinger never split');
  console.log(`${id.padEnd(18)} ${problems.length ? 'PROBLEMS: ' + problems.join('; ') : 'OK'}  shots: ${[...sprites].join(', ')}${shell ? ' | shell ' + shell : ''}${fetch ? ' | fetch ' + fetch : ''}${surfaced ? ' | surfaced ' + surfaced : ''}${hot ? ' | split ' + hot : ''}`);
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
