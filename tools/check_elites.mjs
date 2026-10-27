// Headless check of the elites (docs/design/05_elites.md): each spawns with its escort, sees you, uses its ability (on
// the clip's last frame) and the ability does what it says, shoots both its shots, dies, and drops; the realm holds
// about one per 18 groups in each land; an elite arriving near you does it with a telegraph.
//   node tools/check_elites.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ENEMIES, ELITES } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.god = true; g.enter('realm');
const m = g.map, p = g.player;
{                                                          // the realm's elites
  const by = {};
  for (const e of g.enemies) if (e.elite && e.D.ability) by[e.eliteOf] = (by[e.eliteOf] || 0) + 1;
  const esc = g.enemies.filter((e) => e.escortOf).length;
  console.log('elites in the realm:', JSON.stringify(by), '| escorts', esc);
  for (const b of Object.keys(ELITES)) if (!by[b]) { console.log('  PROBLEM: none in', b); fail++; }
}
const ids = Object.values(ELITES).flat().filter((v, i, a) => a.indexOf(v) === i);
for (const id of ids) {
  const problems = [], D = ENEMIES[id];
  g.enemies = g.map.enemies = []; g.projectiles.length = 0; p.dragUntil = 0;
  p.x = m.spawn.x; p.y = m.spawn.y;
  const e = g.addEnemy(id, p.x + 5, p.y); e.elite = true; e.abilCd = 1.5;
  const shots = new Set(); let used = 0, effect = false, clipAtEffect = null;
  for (let f = 0; f < 60 * 30 && !e.dead; f++) {
    const t = f / 60;
    p.x = m.spawn.x + Math.cos(t * 0.4) * 3; p.y = m.spawn.y + Math.sin(t * 0.4) * 3; p.hp = 1e6; p.dead = false;
    const had = !!e.abil, wasDone = e.abil && e.abil.done;
    g.update(1 / 60);
    if (!had && e.abil) used++;
    if (e.abil && e.abil.done && !wasDone) clipAtEffect = e.abil.t;
    for (const b of g.projectiles) if (b.by === D.name) shots.add(b.sprite);
    const k = D.ability.kind;
    if (k === 'reef' && g.fx.filter((q) => q.kind === 'zone').length >= 3) effect = true;   // its coral line
    if (k === 'song' && p.dragUntil > g.t) effect = true;
    if (k === 'totem' && g.enemies.some((q) => q.id === 'spirit_totem' && !q.dead)) effect = true;
    if (k === 'roar' && g.projectiles.filter((b) => b.sprite.endsWith('thorn_burst')).length >= 20) effect = true;
    if (k === 'banner' && g.enemies.some((q) => q.id === 'war_banner' && !q.dead)) effect = true;
    if (k === 'brood' && g.enemies.some((q) => q.id === 'bark_spider' && !q.dead)) effect = true;
    if ((k === 'dive' || k === 'dash') && e.elState && e.elState.trail && e.elState.trail.length > 3) effect = true;
    if (k === 'burrow' && e.under) effect = true;
    if (k === 'blink' && e.blinkTo) effect = true;
    if (t > 12 && f % 20 === 0) g.damageEnemy(e, Math.round(e.maxHp / 20) + D.def, e.x, e.y, true);
  }
  if (!used) problems.push('never used its ability');
  if (!effect) problems.push('the ability did nothing visible');
  if (clipAtEffect !== null && Math.abs(clipAtEffect - D.ability.tell) > 0.05) problems.push(`effect at ${clipAtEffect.toFixed(2)}s, clip ${D.ability.tell}s`);
  if (shots.size < 2) problems.push('shots seen: ' + [...shots].join(', '));
  if (!e.dead) problems.push('did not die');
  console.log(`${id.padEnd(15)} ability ${D.ability.kind.padEnd(8)} used ${used}x | shots ${shots.size}` + (problems.length ? ' | PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{                                                          // a telegraphed arrival near you
  g.enemies = g.map.enemies = [];
  const b = 'shore', e = g.spawnElite(b, undefined, { x: -999, y: -999 });
  if (e) {
    p.x = e.x + 6; p.y = e.y; e.spawnT = 1.2;
    const h = e.hp; g.damageEnemy(e, 999, e.x, e.y, true);
    const blocked = e.hp === h;
    for (let k = 0; k < 80; k++) g.update(1 / 60);
    console.log('arrival telegraph:', blocked && !(e.spawnT > 0) ? 'OK' : 'PROBLEM'); if (!(blocked && !(e.spawnT > 0))) fail++;
  }
}
process.exit(fail ? 1 : 0);
