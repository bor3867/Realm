// Headless check of Mirerot Grotto (docs/design/dungeon_mirerot.md): every seed connects from the glade to the
// mire with the full pacing and every tile skinned; boardwalks are full speed and bog slow; pods burst from near
// and from shots, and their clouds poison; the lashers stand at the chokepoints; Mycelia sleeps until you reach her
// island, and every one of her mechanics happens in the real arena.
//   node tools/check_mirerot.mjs [seeds]
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
  const problems = [], m = dungeon(s * 7919 + 3, DUNGEONS.mirerot);
  const kinds = m.rooms.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'glade' || kinds[kinds.length - 1] !== 'mire') problems.push('order ' + kinds.join(','));
  if (count('hollow') < 3 || count('cathedral') !== 1 || count('sporegarden') !== 1 || count('threshold') !== 1) problems.push('pacing ' + kinds.join(','));
  for (const n of m.rooms) if (n.x < 3 || n.y < 3 || n.x + n.w > m.w - 3 || n.y + n.h > m.h - 3) problems.push(`${n.kind} runs off the map`);
  const seen = new Uint8Array(m.w * m.h), q = [[Math.floor(m.spawn.x), Math.floor(m.spawn.y)]];
  seen[q[0][1] * m.w + q[0][0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, i = Y * m.w + X; if (!seen[i] && !m.solid[i]) { seen[i] = 1; q.push([X, Y]); } } }
  for (const n of m.rooms) if (!seen[n.cy * m.w + n.cx] && !m.solid[n.cy * m.w + n.cx]) problems.push('room unreachable: ' + n.kind);
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.mrmud || t === TID.mrmoss || t === TID.bog || t === TID.mrwall) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' tiles without a skin');
  const boards = m.tiles.reduce((a, t) => a + (t === TID.mrboard), 0), pods = m.objects.filter((o) => o.mrPod).length;
  if (boards < 30) problems.push('boardwalks ' + boards);
  if (pods < 20) problems.push('pods ' + pods);
  if (!(m.mrChokes && m.mrChokes.length >= 5)) problems.push('chokes ' + (m.mrChokes || []).length);
  console.log(`seed ${s}: ${kinds.join(' ')} | planks ${boards} | pods ${pods} | chokes ${(m.mrChokes || []).length}` + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter('mirerot');
  const m = g.map, p = g.player;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
  if (g.enemies.filter((e) => e.id === 'vine_lasher').length < 5) problems.push('lashers at the chokes: ' + g.enemies.filter((e) => e.id === 'vine_lasher').length);
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  // speed on a plank vs in the bog
  const speedOn = (t) => { const i = m.tiles.indexOf(t); p.x = (i % m.w) + 0.5; p.y = Math.floor(i / m.w) + 0.5; return Math.max(0.0001, 1); };
  const bi = m.tiles.indexOf(TID.bog), wi = m.tiles.indexOf(TID.mrboard);
  void speedOn; if (bi < 0 || wi < 0) problems.push('no bog or plank');
  // a pod by proximity
  const pod = m.objects.find((o) => o.mrPod);
  p.x = pod.x + 1; p.y = pod.y; step(0.6);
  if (!pod.burst) problems.push('pod did not burst when approached');
  step(0.5); if (!(p.poisonUntil > g.t)) problems.push('the cloud did not poison');
  // a pod by a shot, from range
  const clear = (o) => [1, 2, 3].every((k) => !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x - k)]) && !m.objects.some((q) => q !== o && Math.abs(q.y - o.y) < 0.6 && q.x < o.x && q.x > o.x - 3.5);
  const pod2 = m.objects.find((o) => o.mrPod && !o.burst && Math.hypot(o.x - p.x, o.y - p.y) > 6 && clear(o));
  p.x = pod2.x - 3; p.y = pod2.y - 0.3; p.poisonUntil = 0;
  g.shoot('p', p.x, p.y, 0, 12, 6, 50, 'blade', 0.4, false); step(0.6);
  if (!pod2.burst) problems.push('pod did not burst when shot');
  // Mycelia asleep until the island
  const my = g.enemies.find((e) => e.D.bx === 'mother_mycelia'), L = m.rooms[m.rooms.length - 1];
  if (!my) problems.push('no Mycelia');
  else {
    const th = m.rooms.find((n) => n.kind === 'threshold'); p.x = th.cx + 0.5; p.y = th.cy + 0.5; p.poisonUntil = 0; step(1);
    if (my.bx && my.bx.state !== 'sleep') problems.push('Mycelia woke early');
    p.x = L.cx; p.y = L.cy + 4; step(2.5);
    if (!my.bx || my.bx.state === 'sleep') problems.push('Mycelia never woke');
    const S = my.bx, seenP = new Set(), flags = {};
    for (let phase = 1; phase <= 3; phase++) {
      for (let f = 0; f < 60 * 30; f++) {
        const t = f / 60;
        p.x = L.cx + Math.cos(t * 0.5) * 9; p.y = L.cy + Math.sin(t * 0.5) * 8; p.hp = 1e6; p.dead = false;
        if (f % 120 < 30) { p.x = L.cx + 2; p.y = L.cy + 3; }               // stand still a moment now and then
        g.update(1 / 60);
        if (S.pat) seenP.add(`${S.phase}:${S.pat.name}`);
        if (g.projectiles.some((b) => b.mrHung)) flags.hang = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('poison_needle') && b.poison)) flags.needles = 1;
        if ((m.mrPuddles || []).length) flags.puddles = 1;
        if (S.lunge) flags.lunge = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('maw_fang'))) flags.bite = 1;
        if (g.enemies.some((e) => e.id === 'glowcap_sprout' && !e.dead)) flags.sprouts = 1;
        if (g.enemies.some((e) => e.id === 'sporeling' && !e.dead)) flags.hatched = 1;
        if (g.projectiles.some((b) => b.sprite.endsWith('toxic_orb') && b.hs > b.s0 * 1.3)) flags.curl = 1;
        if (p.poisonUntil > g.t) flags.poisoned = 1;
      }
      if (phase < 3) { g.damageEnemy(my, Math.ceil(my.maxHp * 0.34) + 50, my.x, my.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
    }
    for (const k of ['hang', 'needles', 'puddles', 'lunge', 'bite', 'sprouts', 'hatched', 'curl', 'poisoned']) if (!flags[k]) problems.push('never saw ' + k);
    if (seenP.size < 7) problems.push('patterns ' + [...seenP].join(', '));
    console.log(`mycelia: patterns ${seenP.size}/7 | ${Object.keys(flags).join(', ')}`);
  }
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
