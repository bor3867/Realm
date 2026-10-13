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
const eff = (it) => it.slot === 'weapon' ? JSON.stringify(it.weapon.special || {}) : it.slot === 'ability' ? (it.ability.mod || '') + (it.ability.halo ? JSON.stringify(it.ability.halo) : '') + (it.ability.sigil ? JSON.stringify(it.ability.sigil) : '') + (it.ability.myth ? JSON.stringify(it.ability.myth) : '') + '|' + JSON.stringify(it.ability.sig ? { ...it.ability.sig, proj: 0 } : {}) + '|' + JSON.stringify(it.passive || {}) : JSON.stringify(it.passive || {}) + (it.gear ? JSON.stringify(it.gear) : '');
const empty = S.filter((it) => /^\{\}$|^\|\{\}\|\{\}$/.test(eff(it)));
if (empty.length) bad('no effect: ' + empty.map((i) => i.id).join(', '));
const seen = {};
for (const it of S) { const k = it.slot + eff(it); if (seen[k]) bad(`${it.id} has the same effect as ${seen[k]}`); else seen[k] = it.id; }
const projs = (it) => [it.weapon && it.weapon.proj, it.ability && it.ability.burst && it.ability.burst.count > 0 && !['none', 'zap', 'hook'].includes(it.ability.burst.proj) && !DRAWS_OWN.has(it.type) ? it.ability.burst.proj : null, it.ability && it.ability.sig && it.ability.sig.kind !== 'orbit' && it.ability.sig.proj, it.passive && it.passive.prism && it.passive.prism.proj].filter(Boolean);
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
      const onTrigger = it.ability.myth && ['oathrunes', 'spring'].includes(it.ability.myth.kind);   // (fires only once shots are soaked: src/mythics.js)
      if (own.length && !onTrigger && !watch(420, own)) bad(`${it.id}: its own shot never appeared (${own.join(', ')})`);
      e0.dead = true; g.enemies = g.map.enemies = [];
    }
  } catch (err) { bad(`${it.id} threw: ${err.message}`); }
}
console.log(`weapons fired their own shot: ${fired} | abilities used: ${used}`);
// no item seeks
const seek = Object.values(ITEMS).filter((it) => it.weapon && it.weapon.special && it.weapon.special.homing).map((it) => it.id);
if (seek.length) bad('these still seek: ' + seek.slice(0, 8).join(', '));
// the dungeon items' orbiters: each has its art, strikes what comes close, and (where it should) catches shots
const { DUNGEON_ITEMS } = await import('../src/data/dungeon_items.js');
let orbs = 0;
for (const [id, D] of Object.entries(DUNGEON_ITEMS)) {
  const it = ITEMS[id], O = (D.passive && D.passive.orbit) || (D.sig && D.sig.sets);
  if (!O) continue;
  const sets = Array.isArray(O) ? O : [O];
  for (const q of sets) if (q.kind !== 'hole' && !reg.resolve(q.sprite)) bad(`${id}: no art for its orbiter ${q.sprite}`);
  try {
    const cls = Object.keys(CLASSES).find((c) => canEquip(c, it)); if (cls) p.cls = cls;
    g.projectiles.length = 0; g.enemies = g.map.enemies = []; reset(); p.equip = [null, null, null, null]; p.orbCast = []; p.orbKey = null;
    p.equip[{ weapon: 0, ability: 1, armor: 2, ring: 3 }[it.slot]] = id;
    if (D.sig) { p.abilityT = 0; Object.assign(g.input, { aimX: p.x + 3, aimY: p.y }); g.useAbility(); }
    const e0 = g.addEnemy('brine_pilgrim', p.x + 1.6, p.y); e0.hp = e0.maxHp = 1e7; e0.seen = true; e0.D = { ...e0.D, speed: 0, attacks: [] };
    for (let k = 0; k < 300; k++) { p.hp = 1e7; e0.x = p.x + 1.6; e0.y = p.y; g.update(1 / 60); }
    if (!(p.orbsLive || []).length) bad(`${id}: nothing orbits`);
    if (!(e0.hp < e0.maxHp)) bad(`${id}: its orbiters never touched a monster`);
    if (sets.some((q) => q.block)) {
      let caught = 0;
      for (let k = 0; k < 240; k++) {
        p.hp = 1e7;
        if (k % 6 === 0) for (const L of p.orbsLive || []) if (L.O.block) { const b = g.shoot('e', L.B.x + 0.05, L.B.y, 0, 0.2, 2, 1, 'star', 0.3, false, 'test'); b.tag = 'probe'; }
        const before = g.projectiles.filter((b) => b.tag === 'probe' && b.life > 0).length;
        g.update(1 / 60);
        caught += Math.max(0, before - g.projectiles.filter((b) => b.tag === 'probe').length);
      }
      if (!caught) bad(`${id}: its orbiters never caught a shot`);
    }
    orbs++;
  } catch (err) { bad(`${id} (orbit) threw: ${err.message}`); }
}
console.log(`dungeon items with orbiters: ${orbs}`);
console.log(fail ? `${fail} problem(s)` : 'all OK');
process.exit(fail ? 1 : 0);
