// Headless check of the Crypt and Emberforge detail pass (audit D7): the tomb halls have their candles and wading
// water; the Emberforge's vents erupt on a timer (and warn first); the forge floor has its six vents; the Lich and the
// Colossus, now on the boss framework, sleep until you come, and every one of their mechanics happens in their arenas.
//   node tools/check_crypt_ember.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { TID } = await import('../src/world/maps.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const fight = (g, boss, L, flagsOf, need, phaseSecs = 30) => {
  const p = g.player, S = boss.bx, flags = {}, pats = new Set(), problems = [];
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * phaseSecs; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * (L.w / 2 - 4); p.y = L.cy + 0.5 + Math.sin(t * 0.5) * (L.h / 2 - 4); p.hp = 1e6; p.dead = false;
      g.update(1 / 60);
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      flagsOf(flags, S, phase, f);
    }
    if (phase < 3) { boss.reflectUntil = 0; g.damageEnemy(boss, Math.ceil(boss.hp - boss.maxHp * (phase === 1 ? 0.66 : 0.33)) + 50, boss.x, boss.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  for (const k of need) if (!flags[k]) problems.push('never saw ' + k);
  return { problems, flags, pats };
};
const enterOpen = (which) => {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter(which);
  const m = g.map;
  for (const gt of m.gates || []) { gt.solid = false; m.solid[Math.floor(gt.y) * m.w + Math.floor(gt.x)] = 0; }   // the seals are another test's business
  return g;
};
// ---- the Sunken Crypt
{
  const problems = [], g = enterOpen('crypt'), m = g.map, p = g.player, R = m.rooms;
  const tombs = R.filter((n) => n.kind === 'tomb' && n.role === 'fight');
  const lit = tombs.filter((n) => m.objects.filter((o) => o.sprite === 'crypt_candle' && o.x > n.x && o.x < n.x + n.w && o.y > n.y && o.y < n.y + n.h).length >= 6).length;
  const wet = tombs.filter((n) => { let k = 0; for (let y = n.y; y < n.y + n.h; y++) for (let x = n.x; x < n.x + n.w; x++) if (m.tiles[y * m.w + x] === TID.shallows) k++; return k > 6; }).length;
  if (!tombs.length || lit < tombs.length || wet < tombs.length) problems.push(`tomb halls: ${tombs.length}, candle-lit ${lit}, with water ${wet}`);
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  const L = R[R.length - 1], li = g.enemies.find((e) => e.D.bx === 'tidebound_lich');
  if (!li) problems.push('no Lich on the framework');
  else {
    p.x = R[R.length - 2].cx + 0.5; p.y = R[R.length - 2].cy + 0.5; for (let k = 0; k < 60; k++) g.update(1 / 60);
    if (li.bx && li.bx.state !== 'sleep') problems.push('the Lich woke early');
    p.x = L.cx + 0.5; p.y = L.cy + 3; for (let k = 0; k < 150; k++) { p.hp = 1e6; g.update(1 / 60); }
    const res = fight(g, li, L, (F, S, ph) => {
      if (g.projectiles.some((b) => b.sprite.endsWith('soul_bolt') && b.mv && b.mv.curve)) F.bend = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('coral_shard') && b.mv && b.mv.split)) F.coral = 1;
      if (g.fx.some((f) => f.kind === 'soulswap')) F.swap = 1;
      if (g.darkUntil > g.t) F.dark = 1;
      if (g.projectiles.some((b) => b.tether && b.tether.back)) F.homeward = 1;
      if (g.projectiles.some((b) => b.cage)) F.cage = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('tide_crescent'))) F.tide = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('drowned_skull'))) F.skulls = 1;
      if (g.fx.some((f) => f.kind === 'echo')) F.gravecall = 1;
    }, ['bend', 'coral', 'swap', 'dark', 'homeward', 'cage', 'tide', 'skulls', 'gravecall']);
    problems.push(...res.problems);
    console.log(`lich: patterns ${res.pats.size} | ${Object.keys(res.flags).join(', ')}`);
  }
  console.log(`crypt: ${tombs.length} tomb halls, all candle-lit and wet` + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
// ---- the Emberforge
{
  const problems = [], g = enterOpen('ember'), m = g.map, p = g.player, R = m.rooms;
  if (!m.cvVents || m.cvVents.length !== 6) problems.push('forge floor vents ' + (m.cvVents || []).length);
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  for (let k = 0; k < 5; k++) g.update(1 / 60);
  const V = (m.emVents || [])[0];
  if (!V) problems.push('no dungeon vents');
  else {
    p.x = V.o.x + 3; p.y = V.o.y; let warned = false, erupted = false;
    for (let k = 0; k < 60 * 7; k++) { p.hp = 1e6; g.update(1 / 60); if (V.warn) warned = true; if (g.projectiles.some((b) => b.by === 'an erupting vent')) erupted = true; }
    if (!warned || !erupted) problems.push(`vent warned ${warned} erupted ${erupted}`);
  }
  const L = R[R.length - 1], co = g.enemies.find((e) => e.D.bx === 'forgeheart_colossus');
  if (!co) problems.push('no Colossus on the framework');
  else {
    p.x = L.cx + 0.5; p.y = L.cy + 3; for (let k = 0; k < 150; k++) { p.hp = 1e6; g.update(1 / 60); }
    const res = fight(g, co, L, (F, S) => {
      if (g.projectiles.some((b) => b.sprite.endsWith('hammer_spark'))) F.slam = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('iron_rivet') && b.bounce === 0)) F.ricochet = 1;
      if (co.reflectUntil > g.t) F.core = 1;
      if (g.projectiles.some((b) => b.lob && b.lob.T === 0.45)) F.skip = 1;
      if ((S.glow || []).length) F.ventglow = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('vent_flame'))) F.columns = 1;
      if (g.projectiles.some((b) => b.roll)) F.roll = 1;
      if ((S.lava || []).length) F.lava = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('quake_shard'))) F.quake = 1;
    }, ['slam', 'ricochet', 'core', 'skip', 'ventglow', 'columns', 'roll', 'lava', 'quake']);
    problems.push(...res.problems);
    console.log(`colossus: patterns ${res.pats.size} | ${Object.keys(res.flags).join(', ')}`);
  }
  console.log('ember' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
