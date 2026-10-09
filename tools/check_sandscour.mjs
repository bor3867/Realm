// Headless check of Sandscour Tomb (docs/design/dungeon_sandscour.md): layouts in bounds, no overlaps, the pacing
// all there, connected (once the vault's seal is open), skinned; quicksand slows and pulls; urns break and sometimes
// hold scarabs; sarcophagi open as you pass; the vault stays sealed until the burial chamber's mummies are dead; the
// Sphinx sleeps until you enter its sanctum, and every one of its mechanics happens there.
//   node tools/check_sandscour.mjs [seeds]
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
  const problems = [], m = dungeon(s * 6007 + 3, DUNGEONS.sandscour), R = m.rooms;
  const kinds = R.map((n) => n.kind), count = (k) => kinds.filter((q) => q === k).length;
  if (kinds[0] !== 'oasis' || kinds[kinds.length - 1] !== 'sanctum') problems.push('order');
  if (count('dunes') !== 1 || count('chamber') < 3 || count('burial') !== 1 || count('vault') !== 1 || count('antechamber') !== 1) problems.push('pacing ' + kinds.join(','));
  for (const n of R) if (n.x < 3 || n.y < 3 || n.x + n.w > m.w - 3 || n.y + n.h > m.h - 3) problems.push(n.kind + ' off the map');
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], b = R[j]; if (a.kind === 'hall' && b.kind === 'hall') continue; if (a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1 && !(a.kind === 'hall' || b.kind === 'hall')) problems.push(`${a.kind} overlaps ${b.kind}`); }
  const vault = R.find((n) => n.kind === 'vault'), from = [Math.floor(m.spawn.x), Math.floor(m.spawn.y)];
  let seen = walk(m, from);
  if (seen[vault.cy * m.w + vault.cx]) problems.push('the vault is open from the start');
  for (const i of m.sdSeal) m.solid[i] = 0;
  seen = walk(m, from);
  for (const n of R) { const c = R.find(() => true); void c; let ok = false; for (let y = n.y; y < n.y + n.h && !ok; y++) for (let x = n.x; x < n.x + n.w && !ok; x++) if (seen[y * m.w + x]) ok = true; if (!ok) problems.push('unreachable: ' + n.kind); }
  let bare = 0;
  for (let i = 0; i < m.tiles.length; i++) { const t = m.tiles[i]; if ((t === TID.sdsand || t === TID.sdtomb || t === TID.quicksand) && SKIN_TID[m.skin[i]] !== t) bare++; }
  if (bare) problems.push(bare + ' unskinned');
  const sag = m.objects.filter((o) => o.sprite.endsWith('saguaro')), tomb = R.filter((n) => !['oasis', 'dunes'].includes(n.kind));
  if (sag.some((o) => tomb.some((n) => o.x >= n.x && o.x < n.x + n.w && o.y >= n.y && o.y < n.y + n.h))) problems.push('a saguaro inside the tomb');
  const burialSarcs = m.objects.filter((o) => o.sdSarc && o.burial).length;
  if (burialSarcs < 8 || burialSarcs > 14) problems.push('burial sarcophagi ' + burialSarcs);
  console.log(`seed ${s}: ${kinds.join(' ')} | burial sarcophagi ${burialSarcs} | urns ${m.objects.filter((o) => o.sdUrn).length}` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter('sandscour');
  const m = g.map, p = g.player, R = m.rooms;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = 1e6; g.update(1 / 60); } };
  if (g.enemies.filter((e) => e.id === 'jackal_warden').length < 4) problems.push('jackals at the doors');
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  // quicksand pulls toward the middle
  const pit = m.sdPits[0], qi = m.tiles.findIndex((t, i) => t === TID.quicksand && Math.hypot((i % m.w) + 0.5 - pit[0], Math.floor(i / m.w) + 0.5 - pit[1]) > 1.2 && Math.hypot((i % m.w) + 0.5 - pit[0], Math.floor(i / m.w) + 0.5 - pit[1]) < 2.6);
  p.x = (qi % m.w) + 0.5; p.y = Math.floor(qi / m.w) + 0.5;
  const d0 = Math.hypot(p.x - pit[0], p.y - pit[1]); step(0.6);
  if (!(Math.hypot(p.x - pit[0], p.y - pit[1]) < d0 - 0.3)) problems.push('quicksand did not pull');
  // urns
  let scarabs = 0;
  for (const o of m.objects.filter((q) => q.sdUrn).slice(0, 12)) { const n0 = g.enemies.length; for (let k = 0; k < 3; k++) g.hitObject(o.x, o.y, 50); if (g.enemies.length > n0) scarabs++; }
  if (m.objects.some((q) => q.sdUrn && q.hp <= 0)) problems.push('an urn did not break');
  if (!scarabs) problems.push('no urn held scarabs');
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  // the burial chamber: walk its length, the sarcophagi open; the vault stays shut until their mummies are dead
  const bur = R.find((n) => n.kind === 'burial'), vault = R.find((n) => n.kind === 'vault');
  for (let x = bur.x + 1; x < bur.x + bur.w - 1; x += 0.5) { p.x = x; p.y = bur.cy - 3.5; step(0.05); p.y = bur.cy + 3; step(0.05); }
  step(1);
  const mums = g.enemies.filter((e) => e.sdBurial);
  if (mums.length < 8) problems.push('mummies risen ' + mums.length);
  if (m.sdVaultOpen) problems.push('the vault opened while its mummies lived');
  for (const e of mums) g.damageEnemy(e, 1e9, e.x, e.y, true);
  step(0.5);
  if (!m.sdVaultOpen || m.solid[m.sdSeal[0]]) problems.push('the vault did not open');
  // the Sphinx
  const sp = g.enemies.find((e) => e.D.bx === 'gilded_sphinx'), L = R[R.length - 1], an = R.find((n) => n.kind === 'antechamber');
  p.x = an.cx + 0.5; p.y = an.cy + 0.5; step(1);
  if (sp.bx && sp.bx.state !== 'sleep') problems.push('the Sphinx woke early');
  p.x = L.cx + 0.5; p.y = L.cy + 8; step(2.5);
  if (!sp.bx || sp.bx.state === 'sleep') problems.push('the Sphinx never woke');
  const S = sp.bx, flags = {}, pats = new Set();
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 30; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 12; p.y = L.cy + 0.5 + Math.sin(t * 0.5) * 12; p.hp = 1e6; p.dead = false;
      g.update(1 / 60);
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      if (g.projectiles.some((b) => b.sprite.endsWith('sand_crescent') && b.cs === -1)) flags.crossing = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('riddle_glyph') && b.re)) flags.riddle = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('sun_disk'))) flags.sun = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('gilded_feather'))) flags.feathers = 1;
      if (S.perch) flags.perch = 1;
      if (S.storm) flags.storm = 1;
      if ((S.devils || []).some((d) => d.life > 0)) flags.devils = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('cursed_scarab'))) flags.scarabs = 1;
      if (p.gust) flags.thrown = 1;
    }
    if (phase < 3) { g.damageEnemy(sp, Math.ceil(sp.maxHp * 0.34) + 50, sp.x, sp.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  for (const k of ['crossing', 'riddle', 'sun', 'feathers', 'perch', 'storm', 'devils', 'scarabs']) if (!flags[k]) problems.push('never saw ' + k);
  if (pats.size < 7) problems.push('patterns ' + [...pats].join(', '));
  console.log(`sphinx: patterns ${pats.size}/7 | ${Object.keys(flags).join(', ')}`);
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
