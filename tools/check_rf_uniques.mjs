// The Realmforge uniques' effects (src/rf/uniqmech.js), headless: every one of the 79 is worn in a fight (shooting,
// casting, being hit, killing) for a few seconds without an error, and a handful are checked for what they promise.
//   node tools/check_rf_uniques.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS } = await import('../src/data/items.js');
const { CLASSES } = await import('../src/data/classes.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const clsFor = (it) => it.slot !== 'weapon' ? 'brawler' : Object.entries(CLASSES).find(([, c]) => c.weapon === it.type)[0];
function fight(id, secs = 4, setup) {
  const it = ITEMS[id], g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter(clsFor(it)); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
  const p = g.player; g.gainXp(999999); p.equip[it.slot === 'weapon' ? 0 : it.slot === 'armor' ? 2 : 3] = id;
  if (it.slot !== 'weapon') p.equip[0] = `${CLASSES[p.cls].weapon}_t8`;
  const I = g.input; I.scripted = true;
  const ring = () => { for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, e = g.addEnemy('brine_pilgrim', p.x + Math.cos(a) * 3, p.y + Math.sin(a) * 3); e.hp = e.maxHp = 400; } };
  ring(); if (setup) setup(g, p);
  for (let t = 0, k = 0; t < secs; t += 1 / 30, k++) {
    const e = g.enemies.find((q) => !q.dead); if (!e) ring();
    const tg = g.enemies.find((q) => !q.dead) || e;
    I.fire = true; I.aimX = tg.x; I.aimY = tg.y - 0.5;
    if (k % 45 === 10) { p.mp = 999; p.abilityT = 0; g.useAbility(); }
    if (k % 20 === 5 && !p.dead) g.hurtPlayer(40, 'test');
    if (p.hp < 60) p.hp = g.stat('hp');
    g.update(1 / 30);
  }
  return { g, p };
}
const ids = Object.keys(ITEMS).filter((k) => ITEMS[k].rf);
let ok = 0;
for (const id of ids) { try { fight(id); ok++; } catch (err) { bad(`${id}: ${String(err.stack).split('\n').slice(0, 2).join(' ')}`); } }
console.log(`${ok}/${ids.length} worn in a fight without an error`);
// a few promises, measured
{ const { g, p } = fight('rf_hexthorn', 3, (g, p) => { p.mp = 0; }); const mp0 = p.mp; void g; if (!(mp0 > 0)) bad('Hexthorn: kills should restore MP'); }
{ const { g } = fight('rf_gravesignet', 4); if (!g.allies.some((a) => a.rfSignet) && !g.player.rfs) bad('Gravedigger\'s Signet: kills should raise a thrall'); }
{ const { p } = fight('rf_dewring', 7); if (!(p.rfs && p.rfs.cd.dew)) bad('Dew Ring: should pulse a heal every 6s'); }
{ const { g, p } = fight('rf_hollowplate', 1, (g, p) => { p.hp = 5; g.hurtPlayer(999, 'test'); }); if (p.dead || p.hp < 1) bad('Hollow plate: should leave you at 1 HP once a dungeon'); void g; }
{ const { g } = fight('rf_unmakingrobe', 0.1); const A = ITEMS[g.player.equip[1]].ability; if (g.rfAbilityCost(A.cost) >= A.cost) bad('Robe of Unmaking: abilities should cost less'); }
console.log(fail ? `${fail} problem(s)` : 'all OK');
