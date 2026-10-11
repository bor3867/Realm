// Headless check of the Astral Observatory (docs/design/dungeon_astral.md): layouts in bounds, no overlaps, the
// pacing all there; with the clockwork arms east-west and the star bridge revealed every room connects (and the
// vault does not until the bridge is revealed); falling (no rune circles: no teleporters), the turning arms and the telescopes work;
// the guardians use their abilities; the star vault's keeper sleeps, wakes, seals the vault and opens it in death;
// the Grand Orrery sleeps until you step onto its floor, and every one of its mechanics happens there, the
// eclipse burns all fight long, and its finale swallows, collapses and goes supernova.
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
  if (count('platform') < 4 || count('starhall') !== 2 || count('skylight') !== 2 || count('cogplatform') !== 2 || count('dais') !== 1 || count('vault') !== 1 || count('antechamber') !== 1) problems.push('pacing ' + kinds.join(','));
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
  if (m.objects.some((o) => o.asRune !== undefined)) problems.push('a rune circle (teleporter) is still there');
  if (!m.objects.some((o) => o.starVault) || m.objects.filter((o) => o.asTrap).length !== 4 || !m.objects.some((o) => o.asDoor)) problems.push('the star vault is not furnished');
  for (const k of ['astral_skylight', 'astral_brass_walkway', 'astral_constellation_inlay', 'vault_floor', 'astral_marble_inlay']) if (![...m.skin].some((v, i) => v && m.asPaint && m.asPaint.get(i) === k)) problems.push('no ' + k);
  console.log(`seed ${s}: ${kinds.join(' ')}` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
{
  const problems = [];
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = false; g.enter('astral');
  const m = g.map, p = g.player;
  const step = (sec) => { for (let k = 0; k < sec * 60; k++) { p.hp = Math.max(p.hp, 50); g.update(1 / 60); } };
  const allMobs = g.enemies; g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb);
  // falling: from the gallery's edge into the void
  const G0 = m.rooms[0];
  p.x = G0.cx + 0.5; p.y = G0.cy + 0.5; step(0.3);
  const hp0 = p.hp;
  p.x = G0.x - 3; p.y = G0.cy + 0.5; step(0.2);
  if (Math.hypot(p.x - G0.cx - 0.5, p.y - G0.cy - 0.5) > 1.5 || !(p.hp < hp0)) problems.push(`fall: at ${p.x.toFixed(1)},${p.y.toFixed(1)} hp ${hp0}->${p.hp}`);
  p.hp = g.stat('hp'); p.status.invuln = 0;
  // the guardians: every new monster is on the map; each ability lands
  g.enemies = g.map.enemies = allMobs; g.god = true;
  const ids = new Set(g.enemies.map((e) => e.id));
  for (const id of ['astrolabe_sentinel', 'comet_hound', 'nebula_weaver', 'vault_keeper', 'meteor_mite', 'lens_wisp']) if (!ids.has(id)) problems.push('no ' + id + ' in the dungeon');
  console.log(`monsters: ${g.enemies.filter((e) => !e.rb).length} (${[...ids].length} kinds)`);
  {
    const keep = g.enemies;
    const one = (id) => { const e = g.addEnemy(id, p.x + 4, p.y); e.seen = true; return e; };
    const sen = one('astrolabe_sentinel'); sen.abilCd = 0; g.asEliteEffect(sen);
    if (!(sen.wardT > g.t) || g.damageEnemy(sen, 500, sen.x, sen.y, true) !== 0) problems.push('the Alignment ward did not block');
    const hound = one('comet_hound'); hound.abil = { t: 0 }; g.asEliteEffect(hound); g.active = [hound];
    for (let k = 0; k < 40; k++) { g.updateEliteAbility(hound, 1 / 60, 4); g.asGuardians(1 / 60); }
    if (!(m.asFire || []).length) problems.push('the comet dash left no trail');
    const wv = one('nebula_weaver'); g.asEliteEffect(wv);
    if (!(m.asVeils || []).length) problems.push('no star veil');
    const mite = one('meteor_mite'), n0 = g.projectiles.length; g.damageEnemy(mite, 1e6, mite.x, mite.y, true);
    if (g.projectiles.length - n0 < 8) problems.push('the meteor mite left no ring of embers');
    g.enemies = g.map.enemies = keep; g.projectiles = []; m.asFire = []; m.asVeils = [];
  }
  // the star vault: the keeper sleeps; strike the chest and it wakes, seals the vault, the traps fire; it falls, the chest opens
  {
    step(0.1);
    const k = m.asKeeper, c = m.asChest;
    if (!k || !k.asDormant || !c) problems.push('the keeper is not asleep by its chest');
    else {
      p.x = c.x; p.y = c.y + 2; g.god = true;
      g.hitObject(c.x, c.y, 100);
      if (k.asDormant || !c.guards) problems.push('striking the chest did not wake the keeper');
      step(1.2);
      if (!m.asSealed || !m.asVault.mouth.every((i) => m.solid[i])) problems.push('Lockdown did not seal the vault');
      step(2);
      if (!g.projectiles.some((b) => b.sprite.endsWith('trap_spark'))) problems.push('the trap plates never fired');
      g.damageEnemy(k, 1e9, k.x, k.y, true); step(0.2);
      if (m.asSealed || m.asVault.mouth.some((i) => m.solid[i]) || !c.opened) problems.push('the keeper fell but the vault stayed shut');
      g.projectiles = [];
    }
  }
  g.enemies = g.map.enemies = g.enemies.filter((e) => e.rb); g.god = false; p.dead = false; p.hp = g.stat("hp");
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
  let upFrames = 0, allFrames = 0;
  for (let phase = 1; phase <= 3; phase++) {
    for (let f = 0; f < 60 * 30; f++) {
      const t = f / 60;
      p.x = L.cx + 0.5 + Math.cos(t * 0.5) * 9; p.y = L.cy + 0.5 + Math.sin(t * 0.5) * 9; p.hp = 1e6; p.dead = false;
      g.update(1 / 60);
      if (S.pat) pats.add(`${S.phase}:${S.pat.name}`);
      if (g.projectiles.some((b) => b.asOrb)) flags.orbit = 1;
      if (g.projectiles.some((b) => b.bxOf === orr && b.mv && b.mv.hold)) flags.FROZE_SHOTS = 1;   // nothing may stop its shots and loose them at you
      if (S.umbra) flags[`umbra${phase}`] = 1;
      allFrames++; if (S.umbra) upFrames++;
      if (S.umbra && S.umbra.lunge) flags.lunge = 1;
      if ((S.meteors || []).length) flags.meteors = 1;
      if (g.projectiles.some((b) => b.asSpiral)) flags.accretion = 1;
      if (g.projectiles.some((b) => b.intoWell)) flags.infall = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('corona_flare'))) flags.flares = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('eclipse_ring'))) flags.rings = 1;
      if (S.wells && S.wells.length) flags.well = 1;
      if ((S.debris || []).length) flags.debris = 1;
      if (g.projectiles.some((b) => b.sprite.endsWith('brass_shard'))) flags.shards = 1;
    }
    if (phase < 3) { g.damageEnemy(orr, Math.ceil(orr.maxHp * 0.34) + 50, orr.x, orr.y, true); for (let k = 0; k < 60 * 5; k++) { p.hp = 1e6; g.update(1 / 60); } }
  }
  if (flags.FROZE_SHOTS) problems.push('it froze its shots and loosed them at you');
  for (const k of ['orbit', 'umbra1', 'umbra2', 'umbra3', 'lunge', 'meteors', 'flares', 'rings', 'well', 'accretion', 'infall', 'debris', 'shards']) if (!flags[k]) problems.push('never saw ' + k);
  if (pats.size < 15) problems.push('patterns ' + [...pats].join(', '));
  console.log(`orrery: patterns ${pats.size} | ${Object.keys(flags).join(', ')}`);
  // the eclipse burns whoever stands in it
  { if (!S.umbra) { S.B.specials.lunge(g, orr); step(1.5); } const U = S.umbra; p.x = U.x; p.y = U.y; S.umbraT = 0; const h0 = 1e6; p.hp = h0; g.god = false; p.status.invuln = 0; for (let k = 0; k < 30; k++) { p.x = S.umbra.x; p.y = S.umbra.y; g.update(1 / 60); } if (!(p.hp < h0)) problems.push('the eclipse did not burn'); g.god = true; }
  // the finale: down to the threshold, then swallow, collapse, supernova
  g.damageEnemy(orr, Math.max(1, orr.hp - orr.maxHp * 0.11), orr.x, orr.y, true);
  const seen = new Set(); let spiral = 0, nova = 0;
  for (let f = 0; f < 60 * 38; f++) {
    p.x = L.cx + 0.5 + 10; p.y = L.cy + 0.5; p.hp = 1e6; p.dead = false; g.update(1 / 60);
    if (S.sing) seen.add(S.sing.phase);
    spiral = Math.max(spiral, g.projectiles.filter((b) => b.asSpiral).length);
    if (S.sing && S.sing.phase === 'nova') nova = Math.max(nova, g.projectiles.filter((b) => b.bxOf === orr).length);
  }
  for (const k of ['consume', 'collapse', 'nova']) if (!seen.has(k)) problems.push('the finale never reached ' + k);
  if (spiral < 60 || nova < 60) problems.push(`the finale is thin: ${spiral} spiralling in, ${nova} in the nova`);
  if (!S.broken) problems.push('the finale never ended');
  if (upFrames / allFrames > 0.6) problems.push(`the eclipse is up ${Math.round(100 * upFrames / allFrames)}% of the fight (it should come and go)`);
  if (orr.bx.B.finale.dur < 30) problems.push('the finale is short: ' + orr.bx.B.finale.dur + 's');
  if (!(orr.bx.B.scaleFor(g, orr) >= 1.5)) problems.push('it does not grow in its Collapse');
  // the second survival, the Supernova: at 4% the floor goes dark and it burns; you survive it, and it is back
  { for (let f = 0; f < 60 * 3; f++) { p.hp = 1e6; g.update(1 / 60); }
    g.damageEnemy(orr, Math.max(1, orr.hp - orr.maxHp * 0.03), orr.x, orr.y, true);
    let dark = false, most = 0;
    for (let f = 0; f < 60 * 28; f++) { p.x = L.cx + 0.5 + 9; p.y = L.cy + 0.5; p.hp = 1e6; p.dead = false; g.update(1 / 60); if (S.nova2 && S.nova2.dark > 0.9) dark = true; most = Math.max(most, g.projectiles.filter((b) => b.bxOf === orr).length); }
    if (!S.finale2Done || !dark) problems.push('the Supernova never came');
    if (S.state === 'finale') problems.push('the Supernova never ended');
    console.log(`supernova: dark ${dark}, up to ${most} shots at once`); }
  // its death: the slow clip, a hold on the last frame, then rings of light that hurt no one
  g.damageEnemy(orr, orr.hp + 10, orr.x, orr.y, true);
  let held = 0, rings = 0;
  for (let f = 0; f < 60 * 12 && !orr.dead; f++) { p.hp = 1e6; g.update(1 / 60); if (S.state === 'deathhold') held += 1 / 60; rings = Math.max(rings, g.projectiles.filter((b) => b.harmless).length); }
  for (let f = 0; f < 60; f++) { g.update(1 / 60); rings = Math.max(rings, g.projectiles.filter((b) => b.harmless).length); }
  if (held < 2.5) problems.push(`it held its last frame only ${held.toFixed(1)}s`);
  if (rings < 60) problems.push(`its death burst was thin (${rings})`);
  if (!orr.dead) problems.push('it never died');
  console.log(`death: held ${held.toFixed(1)}s, ${rings} shots in its burst`);
  // a shot from a volley that already hit you still hurts when it reaches you later
  { g.god = false; p.status.invuln = 0; p.dead = false; p.hp = 1e6; g.projectiles = [];
    const a = g.shoot('e', p.x, p.y - 0.45, 0, 0.01, 5, 100, 'star', 0.4, false, 'test'), b2 = g.shoot('e', p.x + 3, p.y - 0.45, Math.PI, 0.01, 5, 100, 'star', 0.4, false, 'test');
    void a; g.update(1 / 60); const h1 = p.hp;
    for (let k = 0; k < 30; k++) g.update(1 / 60);
    b2.x = p.x; b2.y = p.y - 0.45; g.update(1 / 60);
    if (!(h1 < 1e6) || !(p.hp < h1)) problems.push(`a second shot of the same volley did no damage (${1e6} > ${h1} > ${p.hp}?)`);
    g.god = true; }
  console.log(`finale: ${[...seen].join(' > ')} | ${spiral} shots spiralling in at once, ${nova} in the nova`);
  console.log('systems' + (problems.length ? '\n  PROBLEMS: ' + problems.join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
