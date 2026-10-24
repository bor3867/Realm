// Do the bosses die online? (2026-10-24: Abbot Morrow stayed immune at the end of his fight.) Every three-phase boss
// is fought in the server's own world (server/world.mjs: a shared dungeon for a dungeon boss, the shared realm for an
// overworld one) by one joined player, sent its place and its blows the way a browser does: it stands 4 tiles from
// the boss and hits it for 600 every tenth of a second (W.hit, which goes through the game's own damage step on the
// server, immunity and all). Reports how far each boss got, how long it was immune, and whether it died.
//   node tools/check_server_bosses.mjs [boss ...]      (RFX=1 to include the Realmforge bosses)
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../server/', import.meta.url)));
const { makeWorld } = await import('../server/world.mjs');
const { DUNGEONS } = await import('../src/data/enemies.js');
const { BX, bxEnemyDef } = await import('../src/bosses/index.js');
const only = process.argv.slice(2);
const rows = [];
for (const id of Object.keys(BX)) {
  if (id === 'framework_test' || (id.startsWith('rfx_') && !process.env.RFX) || (only.length && !only.includes(id))) continue;
  const dg = Object.keys(DUNGEONS).find((k) => DUNGEONS[k].boss === id);
  let W, g, e;
  try {
    W = await makeWorld(1, () => {}, dg || 'realm');
    g = W._g; W.join('p1', 'Tester', true);
    if (dg) e = g.enemies.find((q) => q.D.bx === id);
    else { g.enemies = g.map.enemies = []; const a = g.player; e = g.spawnRealmBoss(id, { x: a.x, y: a.y - 6 }, bxEnemyDef(id)); }
  } catch (err) { rows.push(`${id.padEnd(22)} could not be set up: ${err.message}`); continue; }
  if (!e) { rows.push(`${id.padEnd(22)} not found`); continue; }
  g.maintainRealm = () => {}; g.eventClock = () => {};
  // its mechanic, played the simple way (as tools/bench_rebuilt_bosses.mjs does): a lens for Aurelia, a few seconds each;
  // the nightmare-self while the Sleeper dreams
  const at = () => { if (id === 'prism_wyrm') { const o = g.map.objects.find((q) => q.pedestal === Math.floor(g.t / 4) % 3); if (o) return { x: o.x, y: o.y }; } const T = tgt(); return { x: T.x, y: T.y + 4 }; };
  const tgt = () => (e.slNight && !e.slNight.dead && e.slShiftUntil > g.t ? e.slNight : e);
  let t = 0, imm = 0, states = [], last = '', clock = Date.now();
  const hp0 = e.maxHp || e.hp;
  for (; t < 240 && !e.dead; t += 0.1) {
    const q = at(); W.player('p1', { x: q.x, y: q.y, dead: false, hp: 700 });
    if (e.nid === undefined) W.tick(0.1, (clock += 100));
    const T = tgt(); if (T.nid === undefined) W.tick(0.1, (clock += 100));
    const hp = e.hp; W.hit('p1', T.nid, 600);
    if (!(e.hp < hp)) imm += 0.1;
    W.tick(0.1, (clock += 100));
    const S = e.bx || {}, s = `${S.state || '-'}${S.state === 'finale' ? ':' + ((S.fin && S.fin.name) || '') : ''} p${S.phase}`;
    if (s !== last) { states.push(`${t.toFixed(0)}s ${s}`); last = s; }
  }
  rows.push(`${id.padEnd(22)} ${e.dead ? 'died' : 'ALIVE'} after ${t.toFixed(0)}s | Life ${Math.round((100 * Math.max(0, e.hp)) / hp0)}% | immune ${imm.toFixed(0)}s | ${states.slice(-6).join(' > ')}`);
}
for (const r of rows) console.log(r);
const bad = rows.filter((r) => !/ died /.test(r));
console.log(bad.length ? `${bad.length} boss(es) did not die` : 'every boss died online');
process.exit(bad.length ? 1 : 0);
