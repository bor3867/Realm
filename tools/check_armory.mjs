// The Mad God Armory (src/armory.js): each of the 28 items, used for a few seconds on a pack of monsters in the realm,
// throws nothing, and does what it should be measurable doing: damage dealt for the weapons and the damaging abilities,
// healing for Gloria, the wings for Empyrean, the crown for the Aureole.
//   node tools/check_armory.mjs [id ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS, ARMORY_IDS } = await import('../src/data/items.js');
const { isSolid } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2);
const bad = [];
for (const id of ARMORY_IDS) {
  if (only.length && !only.includes(id)) continue;
  const it = ITEMS[id], A = it.arm;
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.gainXp(999999);
  g.enter('realm'); g.enemies = g.map.enemies = []; g.maintainRealm = () => {}; g.eventClock = () => {};
  const p = g.player;
  let at = null;
  for (let k = 0; k < 400 && !at; k++) { const x = 30 + Math.random() * (g.map.w - 60), y = 30 + Math.random() * (g.map.h - 60); let ok = true; for (let dx = -9; dx <= 9 && ok; dx++) for (let dy = -9; dy <= 9 && ok; dy++) if (isSolid(g.map, x + dx, y + dy)) ok = false; if (ok) at = { x, y }; }
  p.x = at.x; p.y = at.y;
  const slot = { weapon: 0, ability: 1, armor: 2, ring: 3 }[it.slot];
  p.equip[slot] = id; if (slot !== 0) p.equip[0] = 'wand_t8';
  const foes = [[0, -4], [1.2, -4.5], [-1.2, -4.5], [0, -5.5]].map(([dx, dy]) => { const e = g.addEnemy('rift_wraith', p.x + dx, p.y + dy); e.seen = true; e.hp = e.maxHp = 1e6; e.D = { ...e.D, attacks: [], speed: 0 }; return e; });
  const hp0 = foes.reduce((s, e) => s + e.hp, 0);
  let err = null, healed = 0;
  const I = g.input; I.scripted = true;
  try {
    for (let t = 0; t < 6; t += 1 / 60) {
      p.status.invuln = 0; p.dead = false; g.mode = 'play';
      I.aimX = p.x; I.aimY = p.y - 4.6; I.fire = A.name === 'Singularity Core' ? t % 2 < 1.4 : true;   // (the core collapses when you let go)
      if (slot === 1 && Math.floor(t * 60) % 40 === 0) { p.mp = 9999; p.abilityT = 0; if (A.name === 'Gloria') p.hp = 50; const h1 = p.hp; g.useAbility(); if (p.hp > h1) healed += p.hp - h1; }
      if (A.name === 'Empyrean' && Math.floor(t * 60) === 90) { p.hp = g.stat('hp') * 0.32; g.hurtPlayer(80, 'test'); }
      const h = p.hp; g.update(1 / 60); if (p.hp > h) healed += p.hp - h;
      for (const e of foes) { e.dead = false; e.hp = Math.max(e.hp, 1); }
    }
  } catch (x) { err = x.stack.split('\n').slice(0, 3).join(' | '); }
  const dealt = hp0 - foes.reduce((s, e) => s + e.hp, 0), S = p.armS || {};
  let ok = !err, what = `dealt ${Math.round(dealt)}`;
  if (A.name === 'Gloria') { ok = ok && healed >= 200; what += `, healed ${Math.round(healed)}`; }
  else if (A.name === 'Empyrean') { ok = ok && S.wingCd > 0; what += `, wings ${S.wingCd > 0 ? 'unfolded' : 'never'}`; }
  else ok = ok && dealt > 0;
  console.log(`${A.name.padEnd(20)} ${A.tier.padEnd(10)} ${what}${err ? ' THREW ' + err : ''}${ok ? '' : '  <-- PROBLEM'}`);
  if (!ok) bad.push(A.name);
}
console.log(bad.length ? `${bad.length} problem(s): ${bad.join(', ')}` : 'every armory item works');
process.exit(bad.length ? 1 : 0);
