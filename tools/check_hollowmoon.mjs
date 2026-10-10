// Headless check of Hollowmoon Carnival (docs/design/dungeon_hollowmoon.md): layouts in bounds, no overlaps, the pacing
// all there, connected through the maze, skinned; spin tiles turn your movement; cannons telegraph and fire; a struck
// striker calls the room; shot jack crates spring and plain crates don't; ghouls pass through walls and pop into
// confetti; the carousel horses circle until you enter and then charge; the Ringmaster sleeps until you enter, and
// every one of his mechanics happens in the big top.
//   node tools/check_hollowmoon.mjs [seeds]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { dungeon, TID, SKIN_TID } = await import('../src/world/maps.js');
const { DUNGEONS } = await import('../src/data/enemies.js');
const B0 = new URL('../art/bundle/', import.meta.url), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
let fail = 0;
const walk = (m, from) => {
  const seen = new Uint8Array(m.w * m.h), q = [from]; seen[from[1] * m.w + from[0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, i = Y * m.w + X; if (!seen[i] && !m.solid[i]) { seen[i] = 1; q.push([X, Y]); } } }
  return seen;
};
const seeds = +(process.argv[2] || 6);
for (let s = 1; s <= seeds; s++) {
  const problems = [], m = dungeon(s * 2741 + 3, DUNGEONS.hollowmoon), R = m.rooms;
  const kinds = R.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'midway' || kinds[kinds.length - 1] !== 'bigtop') problems.push('order');
  for (const k of ['maze', 'funhouse', 'carousel', 'backstage', 'booth']) if (count(k) !== 1) problems.push('pacing ' + kinds.join(','));
  for (const n of R) if (n.x < 3 || n.y < 3 || n.x + n.w > m.w - 3 || n.y + n.h > m.h - 3) problems.push(n.kind + ' off the map');
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; if (a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1) problems.push(`${a.kind} overlaps ${b.kind}`); }
  const seen = walk(m, [Math.floor(m.spawn.x), Math.floor(m.spawn.y)]);
  for (const n of R) { let ok = false; for (let y = n.y; y < n.y + n.h && !ok; y++) for (let x = n.x; x < n.x + n.w && !ok; x++) if (seen[y * m.w + x]) ok = true; if (!ok) problems.push('unreachable: ' + n.kind); }
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.hmsaw || t === TID.hmboard || t === TID.hmcheck || t === TID.hmspin || t === TID.hmwall) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' unskinned');
  if (m.tiles.reduce((a, t) => a + (t === TID.hmspin), 0) < 20) problems.push('spin tiles');
  if (m.objects.filter((o) => o.hmCannon).length < 3) problems.push('cannons');
  console.log(`seed ${s}: ${kinds.join(' ')} | crates ${m.objects.filter((o) => o.hmCrate).length} (${m.objects.filter((o) => o.jack).length} jacks)` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter('hollowmoon');
  const m = g.map, p = g.player, R = m.rooms;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
  if (g.enemies.filter((e) => e.id === 'carousel_horse').length !== 6) problems.push('horses');
  if (g.enemies.filter((e) => e.id === 'knife_juggler').length < 4) problems.push('jugglers on drums');
  const horses = g.enemies.filter((e) => e.id === 'carousel_horse');
  const keepOnly = (f) => { g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb || f(e)); };
  keepOnly(() => false);
  // spin tiles: hold "up" on one and you go right
  const si = m.tiles.indexOf(TID.hmspin); p.x = (si % m.w) + 0.5; p.y = Math.floor(si / m.w) + 0.5; const x0 = p.x, y0 = p.y;
  g.input = g.input || {}; const I = g.input; const was = { ...I }; Object.assign(I, { up: 1, down: 0, left: 0, right: 0 });
  for (let k = 0; k < 6; k++) { p.hp = 1e6; g.update(1 / 60); }
  Object.assign(I, was);
  if (!(p.x - x0 > Math.abs(p.y - y0))) problems.push(`spin: moved ${(p.x - x0).toFixed(2)},${(p.y - y0).toFixed(2)}`);
  // a cannon: near it, its line shows, then a glove flies
  const can = m.objects.find((o) => o.hmCannon);
  p.x = can.x + 4; p.y = can.y; can.hmCannon.t = 1.5; let lined = false, fired = false;
  for (let k = 0; k < 120; k++) { p.hp = 1e6; g.update(1 / 60); if (can.hmCannon.aim != null) lined = true; if (g.projectiles.some((b) => b.sprite.endsWith('boxing_glove') && b.bounce !== undefined)) fired = true; }
  if (!lined || !fired) problems.push(`cannon lined ${lined} fired ${fired}`);
  // the striker: everything near comes to it
  const st = m.objects.find((o) => o.hmStriker), lured = [];
  for (let k = 0; k < 3; k++) lured.push(g.addEnemy('balloon_ghoul', st.x - 6 - k, st.y + 3));
  p.x = st.x - 14; p.y = st.y + 2;                                   // close enough that they're awake, far enough not to chase you
  g.hitObject(st.x, st.y, 50);
  const d0 = lured.map((e) => Math.hypot(e.x - st.x, e.y - st.y)); step(2);
  if (!lured.every((e, k) => Math.hypot(e.x - st.x, e.y - st.y) < d0[k] - 1)) problems.push('the striker did not call them');
  keepOnly(() => false);
  // crates: a jack springs when shot; a plain one doesn't
  const jack = m.objects.find((o) => o.hmCrate && o.jack), plain = m.objects.find((o) => o.hmCrate && !o.jack);
  if (jack) { g.hitObject(jack.x, jack.y, 50); if (!g.enemies.some((e) => e.id === 'jack_in_the_box')) problems.push('no jack sprang'); }
  keepOnly(() => false);
  if (plain) { g.hitObject(plain.x, plain.y, 50); if (g.enemies.some((e) => e.id === 'jack_in_the_box')) problems.push('a plain crate sprang'); }
  // a ghoul floats through the canvas
  const Mz = m.hmMaze, gh = g.addEnemy('balloon_ghoul', Mz.x + 0.5, Mz.y + 0.5);
  p.x = Mz.x + 12.5; p.y = Mz.y + 12.5; let crossed = false;
  for (let k = 0; k < 60 * 12 && !crossed; k++) { p.hp = 1e6; g.update(1 / 60); if (m.solid[Math.floor(gh.y) * m.w + Math.floor(gh.x)]) crossed = true; }
  if (!crossed) problems.push('the ghoul never crossed a wall');
  const gold0 = g.save.gold; g.damageEnemy(gh, 1e9, gh.x, gh.y, true); if (!(g.save.gold > gold0)) problems.push('no confetti coins');
  keepOnly(() => false);
  // the carousel: horses ride their circle; step in and they break off
  g.enemies.push(...horses);
  const H = m.hmCarousel; p.x = H.cx - 20; p.y = H.cy; step(1);
  if (horses.some((e) => e.loose)) problems.push('horses loose too early');
  if (!horses.every((e) => Math.abs(Math.hypot(e.x - H.cx, e.y - H.cy) - H.r) < 1)) problems.push('horses off their circle');
  p.x = H.cx + H.r + 2; p.y = H.cy; let swung = 0;
  for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); for (const e of horses) swung = Math.max(swung, Math.hypot(e.x - H.cx, e.y - H.cy) - H.r); }
  if (!horses.every((e) => e.loose)) problems.push('horses never broke off');
  if (swung < 1) problems.push('no horse swung out at you (' + swung.toFixed(2) + ')');
  keepOnly(() => false);
  // the Ringmaster
  const rm = g.enemies.find((e) => e.D.bx === 'grinning_ringmaster'), L = R[R.length - 1], bk = R.find((n) => n.kind === 'backstage');
  p.x = bk.cx + 0.5; p.y = bk.cy + 0.5; step(1);
  if (rm.bx && rm.bx.state !== 'sleep') problems.push('the Ringmaster woke early');
  p.x = L.cx + 0.5; p.y = L.cy + 6; step(2.5);
  if (!rm.bx || rm.bx.state === 'sleep') problems.push('the Ringmaster never woke');
  const S = rm.bx, flags = {}, pats = new Set();
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 30; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 10; p.y = L.cy + 2 + Math.sin(t * 0.5) * 10; p.hp = 1e6; p.dead = false;
      g.update(1 / 60);
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      if (g.projectiles.some((b) => b.sprite.endsWith('playing_card'))) flags.cards = 1;
      if (S.leap) flags.leap = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('cane_star'))) flags.landing = 1;
      if ((S.puppets || []).some((q) => q && !q.dead)) flags.puppets = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('juggling_pin'))) flags.pins = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('string_needle'))) flags.needles = 1;
      if (phase === 2 && f === 900) for (const q of S.puppets || []) if (q && !q.dead) g.damageEnemy(q, 1e9, q.x, q.y, true);
      if (phase === 2 && f === 920 && g.bxBar(rm).name.includes('EXPOSED')) flags.exposed = 1;
      if (phase === 2 && f > 920 && (S.puppets || []).some((q) => q && !q.dead) && flags.exposed) flags.restrung = 1;
      if (g.projectiles.some((b) => b.lob && b.sprite.endsWith('confetti_bomb'))) flags.bombs = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('pennant_dart'))) flags.darts = 1;
      if (S.lit) flags.lit = 1;
      if (phase === 3 && S.lit && !flags.litDmg) { const h0 = rm.hp; const d = g.damageEnemy(rm, 2000, rm.x, rm.y, true); S.litD = d; if (rm.hp < h0) flags.litDmg = 1; }
      if (phase === 3 && !S.lit && flags.litDmg && !flags.darkDmg) { const d = g.damageEnemy(rm, 2000, rm.x, rm.y, true); if (S.litD > d * 1.6) flags.darkDmg = 1; }
    }
    if (phase < 3) { g.damageEnemy(rm, Math.ceil(rm.hp - rm.maxHp * (phase === 1 ? 0.66 : 0.33)) + 50, rm.x, rm.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  for (const k of ['cards', 'leap', 'landing', 'puppets', 'pins', 'needles', 'exposed', 'restrung', 'bombs', 'darts', 'lit', 'litDmg', 'darkDmg']) if (!flags[k]) problems.push('never saw ' + k);
  if (pats.size < 6) problems.push('patterns ' + [...pats].join(', '));
  console.log(`ringmaster: patterns ${pats.size} | ${Object.keys(flags).join(', ')}`);
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
