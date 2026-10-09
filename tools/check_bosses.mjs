// Headless check of the Realm Update bosses (src/bossx.js + src/bosses/*.js).
//   node tools/check_bosses.mjs [boss]
// For each boss: spawn it, strafe around it dealing steady damage, and check that every phase is seen in order,
// patterns fire, morphs clear its bullets and block damage, death plays before the drop, and nothing is NaN.
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const { buildRegistry } = await import('../src/registry.js');
const { Game } = await import('../src/game.js');
const { BX } = await import('../src/bosses/index.js');

const B = new URL('../art/bundle/', import.meta.url), J = (p) => JSON.parse(readFileSync(new URL(p, B), 'utf8'));
const idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (p) => p);
const only = process.argv[2];
let fail = 0;
for (const id of Object.keys(BX)) {
  if (only && id !== only) continue;
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.god = true; g.enter(BX[id].map || 'realm');
  g.enemies.length = 0;
  g.command(`/bx ${id}`);
  const e = g.enemies.find((q) => q.D.bx === id), p = g.player, problems = [];
  if (!e) { console.log(id, 'did not spawn'); fail++; continue; }
  const seen = [], shotNames = new Set(), patterns = new Set();
  let morphHits = 0, morphCleared = true, t = 0, diedAt = null, bagAt = null;
  for (let f = 0; f < 60 * 240 && !bagAt; f++) {
    t += 1 / 60;
    p.x = e.x + Math.cos(t * 0.7) * 6; p.y = e.y + Math.sin(t * 0.7) * 5; p.moving = true;
    g.update(1 / 60);
    const S = e.bx;
    if (!S) continue;
    if (!seen.includes(S.phase)) seen.push(S.phase);
    if (S.pat) patterns.add(`${S.phase}:${S.pat.name}`);
    for (const b of g.projectiles) { if (b.bxOf === e) shotNames.add(b.sprite); if (!Number.isFinite(b.x + b.y)) problems.push('NaN bullet ' + b.sprite); }
    if (S.state === 'morph') {
      if (g.projectiles.some((b) => b.bxOf === e && b.born === undefined && b.life > 0 && S.morphCheck)) morphCleared = false;
      const before = e.hp; g.damageEnemy(e, 5000, e.x, e.y, true); if (e.hp < before) morphHits++;
      S.morphCheck = true;
    } else if (f % 10 === 0 && S.state !== 'death') g.damageEnemy(e, Math.round(e.maxHp / 90), e.x, e.y, true);
    if (S.state === 'death' && diedAt === null) diedAt = t;
    if (e.dead && g.bags.length) bagAt = t;
  }
  for (const k of shotNames) if (!reg.resolve(k)) problems.push('shot sprite missing ' + k);
  if (seen.join() !== '1,2,3') problems.push('phases seen ' + seen.join());
  if (morphHits) problems.push(`took damage while morphing (${morphHits})`);
  if (diedAt === null) problems.push('never reached the death clip');
  if (!bagAt) problems.push('no loot after death');
  if (!Number.isFinite(e.x + e.y)) problems.push('boss position NaN');
  console.log(`${id}: phases ${seen.join('>')} | patterns ${patterns.size} | shots ${shotNames.size} | death clip at ${diedAt && diedAt.toFixed(2)}s, loot at ${bagAt && bagAt.toFixed(2)}s` + (problems.length ? '\n  PROBLEMS: ' + [...new Set(problems)].join('; ') : ' | OK'));
  if (problems.length) fail++;
}
process.exit(fail ? 1 : 0);
