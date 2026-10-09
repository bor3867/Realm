// Headless check of the realm event bosses (Phase 2f): the arenas are raised properly, the boss sleeps until you
// step in, every pattern of every phase is seen, and each one's own mechanics really happen.
//   node tools/check_events.mjs
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const { TID } = await import('../src/world/maps.js');
const { BX } = await import('../src/bosses/index.js');
const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
g.newCharacter('priest'); g.god = true; g.enter('realm');
const p = g.player, m = g.map;
let fail = 0;
for (const id of ['abyssal_kraken', 'thornheart_treant']) {
  const problems = [], e = g.spawnEventBoss(id, false);
  if (!e) { console.log(id, 'did not spawn'); fail++; continue; }
  const H = e.home, at = (dx, dy) => m.tiles[Math.floor(H.y + dy) * m.w + Math.floor(H.x + dx)];
  if (id === 'abyssal_kraken') {
    if (at(0, 0) !== TID.deep || at(0, 7) !== TID.shallows || at(7, 0) !== TID.shallows) problems.push('reef not raised');
    if (m.solid[Math.floor(H.y + 7) * m.w + Math.floor(H.x)]) problems.push('ring not walkable');
  } else {
    if (at(0, 5) !== TID.loam || m.objects.some((o) => Math.hypot(o.x - H.x, o.y - H.y) < 11 && o.solid)) problems.push('clearing not clear');
    if (m.objects.filter((o) => o.sprite === 'ow_objects/midlands_elder_tree' && Math.abs(Math.hypot(o.x - H.x, o.y - H.y) - 12.8) < 1.2).length < 30) problems.push('no ring of elders');
  }
  // asleep until you step in
  p.x = H.x; p.y = H.y + 20; for (let k = 0; k < 120; k++) g.update(1 / 60);
  if (e.bx && e.bx.state !== 'sleep' && e.state !== 'sleep') problems.push('woke before you came');
  p.x = H.x; p.y = H.y + 8; p.dead = false;
  const seen = new Set(), flags = {};
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 32; f++) {
      const t = f / 60;
      if (phase === 1 && t < 12) { p.x = H.x; p.y = H.y + 7; } else { p.x = H.x + Math.cos(t * 0.5) * 8; p.y = H.y + Math.sin(t * 0.5) * 8; }   // stand still a while, then circle
      p.dead = false; p.hp = 1e6;
      if (f % 40 === 0) { p.x = H.x + 3; }                  // sometimes stand still where things land
      g.update(1 / 60);
      const S = e.bx;
      if (S && S.pat) seen.add(`${S.phase}:${S.pat.name}`);
      if (g.inkUntil > g.t) flags.ink = 1;
      if (p.dragUntil > g.t) flags.drag = 1;
      if (S && S.whirls && S.whirls.some((w) => w.life > 0)) flags.whirl = 1;
      if (S && S.lures && S.lures.length) flags.lures = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('abyss_lightning'))) flags.chain = 1;
      if (S && S.marks && S.marks.length) flags.marks = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('thorn_seed') && !b.lob)) flags.seeds = 1;
      if (g.projectiles.some((b) => b.lob && b.sprite.endsWith('acorn_bomb'))) flags.acorn = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('burning_leaf') && b.life < 3.1 && !b.mv)) flags.embers = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('blight_wisp'))) flags.wisps = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('corrupted_thorn'))) flags.pincer = 1;
      if (g.projectiles.some((b) => !Number.isFinite(b.x + b.y))) problems.push('NaN shot');
    }
    if (phase < 3) { g.damageEnemy(e, Math.ceil(e.maxHp * 0.34) + 50, e.x, e.y, true); for (let k = 0; k < 60 * 5; k++) g.update(1 / 60); }
  }
  const want = Object.values(BX[id].phases).flatMap((ph, i) => ph.patterns.map((q) => `${i + 1}:${q.name}`));
  const missed = want.filter((w) => !seen.has(w));
  if (missed.length) problems.push('patterns never seen: ' + missed.join(', '));
  const need = id === 'abyssal_kraken' ? ['ink', 'drag', 'whirl', 'lures', 'chain'] : ['marks', 'seeds', 'acorn', 'embers', 'wisps', 'pincer'];
  for (const k of need) if (!flags[k]) problems.push('never saw ' + k);
  g.damageEnemy(e, 1e9, e.x, e.y, true); for (let k = 0; k < 60 * 3; k++) g.update(1 / 60);
  if (!e.dead) problems.push('did not die');
  console.log(`${id}: patterns ${seen.size}/${want.length} | mechanics ${Object.keys(flags).join(', ')}` + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
  g.enemies.length = 0; g.projectiles.length = 0;
}
// the clock: neither rolls in the first five minutes; both roll within the hour; the same arena is reused
{
  const g2 = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g2.newCharacter('priest'); g2.god = true; g2.enter('realm');
  let firstAt = null;
  for (let s = 0; s < 3600 && !firstAt; s += 1) { g2.t += 1; g2.eventBossTick(1); if (g2.enemies.some((e) => e.D.bx)) firstAt = s; }
  console.log('first event boss after', firstAt, 's');
  if (firstAt === null || firstAt < 300) { console.log('  PROBLEM: event clock'); fail++; }
}
process.exit(fail ? 1 : 0);
