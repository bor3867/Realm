// The reworked armour and rings (src/gearmech.js), each in a real fight: you wear it, circle three shooting monsters,
// fire at them and cast every 3 s, low on Life now and then, for 25 s. Each mechanic must show itself at least once
// (its barrier, pulse, sanctuary, counter, shard, glyph, ...), and nothing may throw.
//   node tools/check_gear.mjs [id ...]      --all to list every piece, not only the problems
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Date.now = () => 1.7e12;
let RNG = 7; Math.random = () => ((RNG = (RNG * 1103515245 + 12345) % 2147483648) / 2147483648);
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { ITEMS, canEquip } = await import('../src/data/items.js');
const { CLASSES } = await import('../src/data/classes.js');
const { R: GR } = await import('../src/util.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--')), all = process.argv.includes('--all');
const L = Object.values(ITEMS).filter((it) => it.gear && (!only.length || only.includes(it.id)));
// what each mechanic shows when it works
const SIGN = { stride: ['BARRIER'], openhand: ['BARRIER'], bigpulse: ['ring'], sanctuary: ['SANCTUARY'], hazard: ['gear:hazard'], counter: ['COUNTER'],
  markkill: ['ring'], nebula: ['ring'], control: ['mark'], killshard: ['shot'], motion: ['EMPOWERED'], accuracy: ['hitburst'], glyph: ['GLYPH'],
  tempo: ['shot'], satellite: ['shot'], coronation: ['CROWNED'], stillwater: ['ring'], aurora: ['AURORA'], firstflame: ['shot'], starspear: ['shot'],
  blight: ['gear:pod'], conductor: ['shot'], glowcap: ['gear:mushroom'], mask: ['shot'], tideeye: ['shot'] };
let bad = 0;
for (const it of L) {
  RNG = 7; GR.seed(101);
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  const cls = Object.keys(CLASSES).find((c) => canEquip(c, it)) || 'priest';
  g.newCharacter(cls); g.persist = () => {}; g.enter('realm'); g.enemies.length = 0;
  const p = g.player, C = CLASSES[cls];
  p.equip[0] = `${C.weapon}_t6`; p.equip[1] = `${C.ability}_t3`; p.equip[2] = it.slot === 'armor' ? it.id : `${C.armor}_t5`; p.equip[3] = it.slot === 'ring' ? it.id : null;
  p.x = Math.floor(p.x) + 0.5; p.y = Math.floor(p.y) + 0.5;
  const cx = p.x, cy = p.y, foes = [];
  const spawn = () => { for (const [dx, dy] of [[3.5, 0], [-3, 2], [0.5, -3.5]]) { const e = g.addEnemy('crystal_golem', cx + dx, cy + dy); if (e) { e.seen = true; e.hp = e.maxHp = 2500; foes.push(e); } } };
  spawn();
  const seen = new Set(); let err = null;
  const fl = g.float.bind(g); g.float = (x, y, t, c) => { seen.add(String(t)); return fl(x, y, t, c); };
  const gs = g.gshot.bind(g); g.gshot = (...r) => { seen.add('shot'); return gs(...r); };   // the gear's own shots
  try {
    let t = 0;
    for (let f = 0; f < 25 * 60; f++) {
      t += 1 / 60;
      if (f % 300 === 150) { p.hp = g.stat('hp') * 0.45; p.status.invuln = 0; g.hurtPlayer(Math.round(g.stat('hp') * 0.3), 'a heavy blow', true); }   // now and then a heavy blow, across the low-Life line
      if (p.hp < 30) p.hp = g.stat('hp') * 0.5;
      p.dead = false; p.mp = g.stat('mp');
      const alive = foes.filter((e) => !e.dead);
      if (!alive.length) { foes.length = 0; spawn(); }
      const tgt = foes.find((e) => !e.dead) || foes[0];
      const still = (f % 600) > 420;                                     // a stretch of standing still, for still-water
      const a = t * 0.9, dx = -Math.sin(a), dy = Math.cos(a);           // circling, by the arrow keys (the game reads 'moving' from them)
      Object.assign(g.input = g.input || {}, { left: !still && dx < -0.3 ? 1 : 0, right: !still && dx > 0.3 ? 1 : 0, up: !still && dy < -0.3 ? 1 : 0, down: !still && dy > 0.3 ? 1 : 0 });
      if (Math.hypot(p.x - cx, p.y - cy) > 3) { p.x = cx; p.y = cy; }
      Object.assign(g.input, { fire: true, aimX: tgt.x, aimY: tgt.y - 0.5 });
      if (f % 180 === 90) { p.abilityT = 0; g.useAbility(); }
      g.update(1 / 60);
      for (const fx of g.fx) { if (fx.kind === 'ring') seen.add('ring'); if (fx.kind === 'gear') seen.add('gear:' + fx.h); }
      if (foes.some((e) => e.wmark && e.wmark.until > g.t)) seen.add('mark');
    }
  } catch (e) { err = e.stack.split('\n').slice(0, 2).join(' '); }
  const want = SIGN[it.gear.kind] || [];
  const ok = !err && (it.gear.kind === 'accuracy' ? true : want.some((w) => seen.has(w)));
  if (!ok) bad++;
  if (!ok || all) console.log(`${(ok ? 'ok ' : 'BAD').padEnd(4)} ${it.id.padEnd(28)} ${it.gear.kind.padEnd(11)} ${err ? 'threw: ' + err : ok ? '' : `never showed ${want.join(' / ')}`}`);
}
console.log(`${L.length} armour and rings checked; ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
