// Headless check of the Astral Observatory (docs/design/dungeon_astral.md): layouts in bounds, no overlaps, the
// pacing all there; with the clockwork arms east-west and the star bridge revealed every room connects (and the
// vault does not until the bridge is revealed); falling, rune circles, the turning arms and the telescopes work;
// the Grand Orrery sleeps until you step onto its floor, and every one of its mechanics happens there.
//   node tools/check_astral.mjs [seeds]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { dungeon, TID, SKIN_TID, clockTiles } = await import('../src/world/maps.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const walk = (m, from) => {
  const seen = new Uint8Array(m.w * m.h), q = [from]; seen[from[1] * m.w + from[0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, i = Y * m.w + X; if (!seen[i] && !m.solid[i] && m.tiles[i] !== TID.asvoid) { seen[i] = 1; q.push([X, Y]); } } }
  return seen;
};
const seeds = +(process.argv[2] || 6);
for (let s = 1; s <= seeds; s++) {
  const problems = [], m = dungeon(s * 4337 + 3, DUNGEONS.astral);
  const kinds = m.rooms.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'gallery' || kinds[kinds.length - 1] !== 'orrery') problems.push('order');
  if (count('platform') < 3 || count('cogplatform') !== 2 || count('dais') !== 1 || count('vault') !== 1 || count('antechamber') !== 1) problems.push('pacing ' + kinds.join(','));
  for (const n of m.rooms) if (n.x < 3 || n.y < 3 || n.x + n.w > m.w - 3 || n.y + n.h > m.h - 3) problems.push(n.kind + ' off the map');
  const R = m.rooms;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; if (a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1) problems.push(`${a.kind} overlaps ${b.kind}`); }
  // set the clockworks east-west and see what joins
  for (const C of m.asClocks) { for (const i of C.tiles) m.tiles[i] = TID.asvoid; C.tiles = clockTiles(C, 0); for (const i of C.tiles) m.tiles[i] = TID.asgrate; }
  const vault = R.find((n) => n.kind === 'vault'), from = [Math.floor(m.spawn.x), Math.floor(m.spawn.y)];
  let seen = walk(m, from);
  if (seen[vault.cy * m.w + vault.cx]) problems.push('the vault is reachable without the star bridge');
  for (const seg of m.asStar) for (const i of seg) m.tiles[i] = TID.asgrate;
  seen = walk(m, from);
  for (const n of R) if (!seen[n.cy * m.w + n.cx] && !m.solid[n.cy * m.w + n.cx]) problems.push('unreachable: ' + n.kind);
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.asmarble || t === TID.aswall) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' unskinned');
  if (m.objects.filter((o) => o.interact === 'scope').length !== 3) problems.push('telescopes');
  if (m.objects.filter((o) => o.asRune !== undefined).length < 4) problems.push('rune circles');
  console.log(`seed ${s}: ${kinds.join(' ')}` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = false; g.enter('astral');
  const m = g.map, p = g.player;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = Math.max(p.hp, 50); g.update(1 / 60); } };
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  // falling: from the gallery's edge into the void
  const G0 = m.rooms[0];
  p.x = G0.cx + 0.5; p.y = G0.cy + 0.5; step(0.3);
  const hp0 = p.hp;
  p.x = G0.x - 3; p.y = G0.cy + 0.5; step(0.2);
  if (Math.hypot(p.x - G0.cx - 0.5, p.y - G0.cy - 0.5) > 1.5 || !(p.hp < hp0)) problems.push(`fall: at ${p.x.toFixed(1)},${p.y.toFixed(1)} hp ${hp0}->${p.hp}`);
  p.hp = g.stat('hp'); p.status.invuln = 0;
  // a rune circle
  const rc = m.objects.find((o) => o.asRune !== undefined);
  p.x = rc.x; p.y = rc.y; step(1);
  if (Math.hypot(p.x - rc.to.x, p.y - rc.to.y) > 1) problems.push('the rune circle did not carry you');
  // a clockwork: it turns on time and carries its rider
  const C = m.asClocks[0], k0 = C.k;
  C.t = 0;
  const rideI = C.tiles[Math.floor(C.tiles.length / 2)];
  p.x = (rideI % m.w) + 0.5; p.y = Math.floor(rideI / m.w) + 0.5;
  const before = Math.atan2(p.y - C.hy - 0.5, p.x - C.hx - 0.5);
  for (let k = 0; k < 60 * 4.1; k++) { p.hp = 1e6; p.asSafe = { x: p.x, y: p.y }; g.update(1 / 60); }
  const after = Math.atan2(p.y - C.hy - 0.5, p.x - C.hx - 0.5);
  if (C.k === k0) problems.push('the clockwork did not turn');
  const turned = ((after - before) + Math.PI * 4) % (Math.PI * 2);
  if (Math.abs(turned - Math.PI / 4) > 0.35) problems.push('the rider was not carried round: ' + turned.toFixed(2));
  // the telescopes: wrong ways reveal nothing; the right way reveals its segment
  const scopes = m.objects.filter((o) => o.interact === 'scope');
  for (const o of scopes) for (let k = 0; k < 8 && !o.found; k++) g.interact(o);
  if (scopes.some((o) => !o.found)) problems.push('a telescope never found the globe');
  if (m.asStar.some((seg) => seg.some((i) => m.tiles[i] !== TID.asgrate))) problems.push('the star bridge is not whole');
  // the Grand Orrery
  g.god = true;
  const orr = g.enemies.find((e) => e.D.bx === 'grand_orrery'), L = m.rooms[m.rooms.length - 1];
  const an = m.rooms.find((n) => n.kind === 'antechamber');
  p.x = an.cx + 0.5; p.y = an.cy - 1.5; step(1);
  if (orr.bx && orr.bx.state !== 'sleep') problems.push('the Orrery woke early');
  p.x = L.cx + 0.5; p.y = L.cy + 8; step(2.5);
  if (!orr.bx || orr.bx.state === 'sleep') problems.push('the Orrery never woke');
  const S = orr.bx, flags = {}, pats = new Set();
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 30; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 9; p.y = L.cy + 0.5 + Math.sin(t * 0.5) * 9; p.hp = 1e6; p.dead = false;
      g.update(1 / 60);
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      if (g.projectiles.some((b) => b.asOrb)) flags.orbit = 1;
      if (g.projectiles.some((b) => b.bxOf === orr && b.mv && b.mv.hold === 0.6)) flags.conjunction = 1;
      if (S.umbra) flags.umbra = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('corona_flare'))) flags.flares = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('eclipse_ring'))) flags.rings = 1;
      if (S.well) flags.well = 1;
      if ((S.debris || []).length) flags.debris = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('brass_shard'))) flags.shards = 1;
    }
    if (phase < 3) { g.damageEnemy(orr, Math.ceil(orr.maxHp * 0.34) + 50, orr.x, orr.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  for (const k of ['orbit', 'conjunction', 'umbra', 'flares', 'rings', 'well', 'debris', 'shards']) if (!flags[k]) problems.push('never saw ' + k);
  if (pats.size < 7) problems.push('patterns ' + [...pats].join(', '));
  console.log(`orrery: patterns ${pats.size}/7 | ${Object.keys(flags).join(', ')}`);
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
