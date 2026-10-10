// Every untiered, legendary and mythic item is its own (docs/design/11_unique_items.md): each has an effect, no two
// share one, no two share a projectile, every projectile has art, and in play each weapon fires and each ability is
// used without error, its own shot appearing.
//   node tools/check_unique_items.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS, canEquip } = await import('../src/data/items.js');
const { DRAWS_OWN } = await import('../src/data/uniques.js');
const { CLASSES } = await import('../src/data/classes.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const WJ = JSON.parse(readFileSync(new URL('../art/world/world.json', import.meta.url), 'utf8'));
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.persist = () => {}; g.enter('realm'); g.enemies = g.map.enemies = [];
let fail = 0;
const bad = (m) => { console.log('  PROBLEM:', m); fail++; };
const S = Object.values(ITEMS).filter((it) => !it.base && (it.ut || it.mythic || it.legendary) && !it.admin);
const eff = (it) => it.slot === 'weapon' ? JSON.stringify(it.weapon.special || {}) : it.slot === 'ability' ? (it.ability.mod || '') + '|' + JSON.stringify(it.ability.sig ? { ...it.ability.sig, proj: 0 } : {}) + '|' + JSON.stringify(it.passive || {}) : JSON.stringify(it.passive || {});
const empty = S.filter((it) => /^\{\}$|^\|\{\}\|\{\}$/.test(eff(it)));
if (empty.length) bad('no effect: ' + empty.map((i) => i.id).join(', '));
const seen = {};
for (const it of S) { const k = it.slot + eff(it); if (seen[k]) bad(`${it.id} has the same effect as ${seen[k]}`); else seen[k] = it.id; }
const projs = (it) => [it.weapon && it.weapon.proj, it.ability && it.ability.burst && it.ability.burst.count > 0 && !['none', 'zap', 'hook'].includes(it.ability.burst.proj) && !DRAWS_OWN.has(it.type) ? it.ability.burst.proj : null, it.ability && it.ability.sig && it.ability.sig.proj, it.passive && it.passive.prism && it.passive.prism.proj].filter(Boolean);
const owner = {};
for (const it of S) for (const p of projs(it)) { if (owner[p] && owner[p] !== it.id) bad(`${it.id} shares ${p} with ${owner[p]}`); owner[p] = it.id; if (!(p.includes('/') ? reg.resolve(p) : WJ.projectiles[p] !== undefined)) bad(`${it.id}: no art for ${p}`); }
console.log(`special items: ${S.length} | distinct effects: ${Object.keys(seen).length} | distinct shots: ${Object.keys(owner).length}`);
// in play: from an open spot, aiming into open ground, watching every frame for the item's own shots
const { isSolid } = await import('../src/world/maps.js');
const p = g.player; let fired = 0, used = 0;
let home = null;
for (let y = 20; y < g.map.h - 20 && !home; y += 3) for (let x = 20; x < g.map.w - 30 && !home; x += 3) {
  let ok = true; for (let dx = -3; dx <= 12 && ok; dx++) for (let dy = -3; dy <= 3 && ok; dy++) if (isSolid(g.map, x + dx, y + dy)) ok = false;
  if (ok) home = { x: x + 0.5, y: y + 0.5 };
}
const reset = () => { p.x = home.x; p.y = home.y; p.hook = null; p.dash = null; p.dashing = null; p.gust = null; p.status = { ...p.status, asleep: 0 }; p.frozenUntil = 0; p.dead = false; p.hp = 1e7; p.mp = 1e6; g.input.fire = false; };
const watch = (frames, own) => { let hit = false; for (let k = 0; k < frames; k++) { p.hp = 1e7; p.mp = 1e6; g.update(1 / 60); if (g.projectiles.some((b) => own.includes(b.sprite))) hit = true; } return hit; };
for (const it of S) {
  try {
    const cls = Object.keys(CLASSES).find((c) => canEquip(c, it)); if (cls) p.cls = cls;   // someone who can use it
    g.projectiles.length = 0; reset();
    if (it.slot === 'weapon') {
      p.equip[0] = it.id; p.fireCd = 0; Object.assign(g.input, { fire: true, aimX: p.x + 6, aimY: p.y });
      const ok = watch(30, [it.weapon.proj]);
      g.input.fire = false;
      if (ok) fired++; else bad(`${it.id} fired nothing of its own`);
    } else if (it.slot === 'ability') {
      p.equip[1] = it.id; p.abilityT = 0; Object.assign(g.input, { aimX: p.x + 4, aimY: p.y });
      const e0 = g.addEnemy('brine_pilgrim', p.x + 4, p.y + 3); e0.hp = e0.maxHp = 1e7; e0.seen = true;   // something for hooks and kites to find
      g.useAbility(); used++;
      const own = projs(it);
      if (own.length && !watch(420, own)) bad(`${it.id}: its own shot never appeared (${own.join(', ')})`);
      e0.dead = true; g.enemies = g.map.enemies = [];
    }
  } catch (err) { bad(`${it.id} threw: ${err.message}`); }
}
console.log(`weapons fired their own shot: ${fired} | abilities used: ${used}`);
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
