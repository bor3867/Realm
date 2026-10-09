// Headless check of Frostveil Hollows (docs/design/dungeon_frostveil.md): the cave connects from the mouth to the
// lake, the pacing is all there, every tile has its skin, the chill rises in frigid water and melts by a brazier,
// the Hall of the Frozen wakes only when you cross it, and Glacius sleeps in his lake until you step onto it.
//   node tools/check_frostveil.mjs [seeds]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { dungeon, TID, SKIN_TID } = await import('../src/world/maps.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const seeds = +(process.argv[2] || 6);
for (let s = 1; s <= seeds; s++) {
  const problems = [], m = dungeon(s * 9973 + 3, DUNGEONS.frostveil);
  const kinds = m.rooms.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'mouth' || kinds[kinds.length - 1] !== 'lake') problems.push('order ' + kinds.join(','));
  if (count('cavern') < 3 || count('hall') !== 1 || count('stair') !== 1 || count('icerun') < 1) problems.push('pacing ' + kinds.join(','));
  if (!m.rooms.some((n) => n.role === 'treasure')) problems.push('no treasure room');
  // walk from the mouth to the lake
  const seen = new Uint8Array(m.w * m.h), q = [[Math.floor(m.spawn.x), Math.floor(m.spawn.y)]];
  seen[q[0][1] * m.w + q[0][0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, i = Y * m.w + X; if (!seen[i] && !m.solid[i]) { seen[i] = 1; q.push([X, Y]); } } }
  const L = m.rooms[m.rooms.length - 1];
  if (!seen[L.cy * m.w + L.cx]) problems.push('the lake cannot be reached');
  for (const n of m.rooms) if (!seen[n.cy * m.w + n.cx] && !m.solid[n.cy * m.w + n.cx]) problems.push('room unreachable: ' + n.kind);
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.fvsnow || t === TID.fvice || t === TID.fvwater || t === TID.fvwall) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' tiles without a skin');
  const statues = m.objects.filter((o) => o.fvStatue), sentinels = statues.filter((o) => o.sentinel);
  if (statues.length < 12 || sentinels.length < 4) problems.push(`hall: ${statues.length} statues, ${sentinels.length} sentinels`);
  if (m.objects.filter((o) => o.fvRim).length !== 4) problems.push('lake braziers');
  console.log(`seed ${s}: ${m.rooms.length} rooms (${kinds.join(' ')}) | statues ${statues.length}/${sentinels.length} | braziers ${m.objects.filter((o) => o.fvBrazier).length}` + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
// the systems, in a real run
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter('frostveil');
  const m = g.map, p = g.player;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
  // chill: stand in frigid water, then by a lit brazier
  const wi = m.tiles.indexOf(TID.fvwater); p.x = (wi % m.w) + 0.5; p.y = Math.floor(wi / m.w) + 0.5; g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  step(1.5); const wet = p.chill;
  if (!(wet > 40)) problems.push('frigid water did not chill: ' + wet);
  for (let k = 0; k < 60 * 3 && !(p.frozenUntil > g.t); k++) { p.x = (wi % m.w) + 0.5; p.y = Math.floor(wi / m.w) + 0.5; p.hp = 1e6; g.update(1 / 60); }
  if (!(p.frozenUntil > g.t)) problems.push('never froze solid');
  const fr = m.objects.find((o) => o.fvBrazier && o.lit); p.x = fr.x + 1.2; p.y = fr.y + 0.2; p.frozenUntil = 0;
  const c0 = p.chill; step(1); if (!(c0 - p.chill > 25)) problems.push(`brazier warmed too slowly ${c0} -> ${p.chill}`);
  // the hall: quiet until crossed
  const H = m.fvHall;
  p.x = H.x0 - 6; p.y = (H.y0 + H.y1) / 2; step(0.5);
  if (H.woke) problems.push('the hall woke early');
  p.x = (H.x0 + H.x1) / 2; step(0.2);
  if (!H.woke || g.enemies.filter((e) => e.id === 'glacial_sentinel').length < 4) problems.push('the hall never woke');
  // Glacius: asleep until you step onto the lake
  const gl = g.enemies.find((e) => e.D.bx === 'glacius_frozen_wyrm');
  if (!gl) problems.push('no Glacius');
  else {
    const L = m.rooms[m.rooms.length - 1];
    const st = m.rooms.find((n) => n.kind === 'stair'); p.x = st.cx + 0.5; p.y = st.cy + 0.5; step(1);   // waiting on the Wyrm's Stair
    if (gl.bx && gl.bx.state !== 'sleep' && gl.state !== 'sleep') problems.push('Glacius woke early');
    p.x = L.cx; p.y = L.y + L.h - 5; step(2.5);
    if (!gl.bx || gl.bx.state === 'sleep') problems.push('Glacius never woke');
    if (!m.objects.some((o) => o.arenaLock)) problems.push('the lake did not lock');
  }
  // the fight: every signature happens in the real lake
  if (gl && gl.bx) {
    const L = m.rooms[m.rooms.length - 1], S = gl.bx, seen = new Set(), flags = {};
    const snowIn = () => { let n = 0; for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) if (m.tiles[y * m.w + x] === TID.fvsnow) n++; return n; };
    const snow0 = snowIn();
    for (let phase = 1; phase <= 3; phase++) {
      for (let f = 0; f < 60 * 30; f++) {
        const t = f / 60;
        p.x = L.cx + Math.cos(t * 0.4) * 13; p.y = L.cy + Math.sin(t * 0.4) * 15; p.hp = 1e6; p.dead = false; p.frozenUntil = 0;
        g.update(1 / 60);
        if (S.pat) seen.add(`${S.phase}:${S.pat.name}`);
        if (f % 30 === 0 && snowIn() < snow0) flags.freeze = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('frost_breath') && b.chill)) flags.breath = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('blizzard_orb'))) flags.orbs = 1;
        if (p.gust) flags.gust = 1;
        if (S.glideTo) flags.glide = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('core_nova'))) flags.nova = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('aurora_wave'))) flags.aurora = 1;
        if (p.chill > 0) flags.chill = 1;
      }
      if (phase < 3) { g.damageEnemy(gl, Math.ceil(gl.maxHp * 0.34) + 50, gl.x, gl.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
    }
    const lit = m.objects.filter((o) => o.fvRim && o.lit).length;
    if (lit > 3) problems.push('no brazier was snuffed');
    if (gl.D.def !== 0) problems.push('the heart is not bare in phase 3');
    for (const k of ['breath', 'freeze', 'orbs', 'gust', 'glide', 'nova', 'aurora', 'chill']) if (!flags[k]) problems.push('never saw ' + k);
    if (seen.size < 8) problems.push('patterns seen ' + [...seen].join(', '));
    console.log(`glacius: patterns ${seen.size}/8 | ${Object.keys(flags).join(', ')} | rim braziers lit ${lit}`);
  }
  console.log('systems: chill in water ' + Math.round(wet) + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
