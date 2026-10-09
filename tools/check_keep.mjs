// Headless check of the Crimson Keep (docs/design/dungeon_crimson_keep.md): layouts in bounds, no overlaps, the
// pacing all there, connected, skinned; candlelight doubles damage to thralls; a coffin stays shut when you pass it lit
// and opens when you pass it dark; a real statue wakes behind you and a fake never does; ledge gargoyles drop; the
// gallery's chest wakes three stands; the crypt opens in sequence; blood pools slow and drain; Count Vesper sleeps
// until you enter, and every one of his mechanics happens there.
//   node tools/check_keep.mjs [seeds]
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
  const problems = [], m = dungeon(s * 3301 + 3, DUNGEONS.keep), R = m.rooms;
  const kinds = R.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'court' || kinds[kinds.length - 1] !== 'throneroom') problems.push('order');
  if (count('greathall') !== 2 || count('chamber') < 2 || count('banquet') !== 1 || count('gallery') !== 1 || count('crypt') !== 1 || count('stair') !== 1) problems.push('pacing ' + kinds.join(','));
  for (const n of R) if (n.x < 3 || n.y < 3 || n.x + n.w > m.w - 3 || n.y + n.h > m.h - 3) problems.push(n.kind + ' off the map');
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; if (a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1) problems.push(`${a.kind} overlaps ${b.kind}`); }
  const seen = walk(m, [Math.floor(m.spawn.x), Math.floor(m.spawn.y)]);
  for (const n of R) { let ok = false; for (let y = n.y; y < n.y + n.h && !ok; y++) for (let x = n.x; x < n.x + n.w && !ok; x++) if (seen[y * m.w + x]) ok = true; if (!ok) problems.push('unreachable: ' + n.kind); }
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.ckstone || t === TID.ckcarpet || t === TID.ckmarble || t === TID.ckwall || t === TID.ckwin) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' unskinned');
  const st = m.objects.filter((o) => o.ckStatue && !o.gallery), real = st.filter((o) => o.real).length;
  if (!st.length || real === 0 || real > st.length * 0.5) problems.push(`statues ${real}/${st.length} real`);
  if (m.objects.filter((o) => o.gallery && o.real).length !== 3) problems.push('gallery real stands');
  if (m.objects.filter((o) => o.ckLedge).length < 4) problems.push('ledge gargoyles');
  console.log(`seed ${s}: ${kinds.join(' ')} | statues ${real}/${st.length} real | coffins ${m.objects.filter((o) => o.ckCoffin).length}` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter('keep');
  const m = g.map, p = g.player, R = m.rooms;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
  const clear = () => { g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb); };
  clear(); step(0.1);
  // candlelight: a thrall in the light takes twice what one in the dark does
  const cand = m.ckCandles[0];
  let dk = [cand.x + 30, cand.y + 30];
  for (let t = 0; t < 400 && g.ckLit(dk[0], dk[1]); t++) dk = [m.rooms[0].x + Math.random() * 200, m.rooms[0].y - 60 + Math.random() * 120];
  const tl = g.addEnemy('blood_thrall', cand.x + 1, cand.y + 0.5), td = g.addEnemy('blood_thrall', dk[0], dk[1]);
  const dl = g.damageEnemy(tl, 300, tl.x, tl.y, true), dd = g.damageEnemy(td, 300, td.x, td.y, true);
  if (!(dl >= dd * 1.9)) problems.push(`light ${dl} vs dark ${dd}`);
  clear();
  // a coffin passed in the light stays shut; passed in the dark, it opens
  const cof = m.ckCoffins.filter((o) => !o.crypt);
  const litC = cof.find((o) => g.ckLit(o.x + 1.5, o.y)), darkC = cof.find((o) => [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => !g.ckLit(o.x + dx, o.y + dy) && !m.solid[Math.floor(o.y + dy) * m.w + Math.floor(o.x + dx)]));
  if (litC) { p.x = litC.x + 1.5; p.y = litC.y; if (g.ckLit(p.x, p.y)) { step(0.3); if (litC.openT !== undefined) problems.push('a coffin opened in the light'); } }
  if (darkC) {
    const sp = [[2, 0], [-2, 0], [0, 2], [0, -2]].find(([dx, dy]) => !g.ckLit(darkC.x + dx, darkC.y + dy) && !m.solid[Math.floor(darkC.y + dy) * m.w + Math.floor(darkC.x + dx)]);
    p.x = darkC.x + sp[0]; p.y = darkC.y + sp[1]; step(1);
    if (darkC.openT === undefined || !g.enemies.some((e) => e.id === 'blood_thrall')) problems.push('a coffin passed in the dark did not open');
  } else problems.push('no dark coffin to test');
  clear();
  // statues: walk up to a real one and away; then to a fake one and away
  const realS = m.ckStatues.find((o) => !o.woke), fake = m.objects.find((o) => o.ckStatue && !o.real && !o.gallery);
  const away = (o) => { for (const [dx, dy] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) { const i = Math.floor(o.y + dy) * m.w + Math.floor(o.x + dx); if (!m.solid[i]) return [o.x + dx, o.y + dy]; } return [o.x + 6, o.y]; };
  const nearSpot = (o) => { for (const [dx, dy] of [[0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0]]) if (!m.solid[Math.floor(o.y + dy) * m.w + Math.floor(o.x + dx)]) return [o.x + dx, o.y + dy]; return [o.x, o.y + 1.5]; };
  if (realS) { [p.x, p.y] = nearSpot(realS); step(0.2); [p.x, p.y] = away(realS); step(0.3); if (!realS.woke) problems.push('a real statue did not wake behind you'); }
  const n0 = g.enemies.length;
  if (fake) { [p.x, p.y] = nearSpot(fake); step(0.2); [p.x, p.y] = away(fake); step(0.3); if (!m.objects.includes(fake)) problems.push('a fake statue woke'); }
  void n0; clear();
  // ledges
  const ledge = m.ckLedges[0]; p.x = ledge.x; p.y = ledge.y + 2.5; step(0.3);
  if (!ledge.woke || !g.enemies.some((e) => e.id === 'gargoyle')) problems.push('the ledge gargoyle did not drop');
  clear();
  // the gallery: open its chest, three stands wake
  const G = m.ckGallery, chest = m.objects.find((o) => o.interact === 'chest' && o.x > G.x && o.x < G.x + G.w && o.y > G.y && o.y < G.y + G.h);
  if (!chest) problems.push('no gallery chest');
  else { chest.opened = true; step(0.2); if (!G.woke || g.enemies.filter((e) => e.id === 'haunted_armor').length < 3) problems.push('the gallery did not wake'); }
  clear();
  // the crypt: in sequence
  const C = m.ckCrypt; p.x = C.x + 3; p.y = C.y + C.h / 2; step(0.5);
  const crypt = m.ckCoffins.filter((o) => o.crypt);
  step(2.2); const early = crypt.filter((o) => o.openT !== undefined).length;
  step(crypt.length * 1.2 + 1); const late = crypt.filter((o) => o.openT !== undefined).length;
  if (!(early >= 1 && early < crypt.length && late === crypt.length)) problems.push(`crypt opened ${early} then ${late} of ${crypt.length}`);
  clear();
  // blood pool drains
  const bi = (() => { const Q = R.find((n) => n.kind === 'stair'); const i = Q.cy * m.w + Q.cx + 2; m.tiles[i] = TID.ckblood; return i; })();
  p.x = (bi % m.w) + 0.5; p.y = Math.floor(bi / m.w) + 0.5; g.god = false; p.hp = g.stat('hp'); const h0 = p.hp;
  for (let k = 0; k < 60; k++) g.update(1 / 60);
  if (!(p.hp < h0)) problems.push('the blood pool did not drain'); g.god = true;
  // Count Vesper
  const ve = g.enemies.find((e) => e.D.bx === 'count_vesper'), L = R[R.length - 1], stair = R.find((n) => n.kind === 'stair');
  p.x = stair.cx + 0.5; p.y = stair.cy + 0.5; step(1);
  if (ve.bx && ve.bx.state !== 'sleep') problems.push('Vesper woke early');
  p.x = L.cx + 0.5; p.y = L.cy + 8; step(2.5);
  if (!ve.bx || ve.bx.state === 'sleep') problems.push('Vesper never woke');
  const S = ve.bx, flags = {}, pats = new Set();
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 34; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 12; p.y = L.cy + 2 + Math.sin(t * 0.5) * 10; p.hp = 1e6; p.dead = false;
      if (phase === 1 && f === 400) g.damageEnemy(ve, Math.round(ve.maxHp * 0.12), ve.x, ve.y, true);   // a wound, for the thralls to mend
      const hp0 = ve.hp;
      g.update(1 / 60);
      if (ve.hp > hp0) flags.healed = 1;
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      if (g.projectiles.some((b) => b.sprite.endsWith('blood_bolt'))) flags.bolts = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('rose_thorn') && b.mv && b.mv.hold)) flags.hedge = 1;
      if ((S.kneelers || []).some((k) => !k.dead)) flags.kneel = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('bat_swarm'))) flags.bats = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('blood_scythe') && b.back)) flags.scythesBack = 1;
      if (S.dashTo) flags.dash = 1;
      if ((S.rain || []).length) flags.rain = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('sanguine_nova'))) flags.nova = 1;
    }
    if (phase === 1) for (const k of S.kneelers || []) if (!k.dead) g.damageEnemy(k, 1e9, k.x, k.y, true);
    if (phase < 3) { g.damageEnemy(ve, Math.ceil(ve.hp - ve.maxHp * (phase === 1 ? 0.66 : 0.33)) + 50, ve.x, ve.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  let pools = 0; for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) if (m.tiles[y * m.w + x] === TID.ckblood) pools++;
  if (pools < 9) flags.nopools = 1; else flags.pools = 1;
  for (const k of ['bolts', 'hedge', 'kneel', 'healed', 'bats', 'scythesBack', 'dash', 'rain', 'pools', 'nova']) if (!flags[k]) problems.push('never saw ' + k);
  if (pats.size < 7) problems.push('patterns ' + [...pats].join(', '));
  console.log(`vesper: patterns ${pats.size}/7 | ${Object.keys(flags).join(', ')} | blood tiles ${pools}`);
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
