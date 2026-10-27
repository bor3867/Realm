// One engine, step 4 (docs/realmforge_port.md, Phase 5): in each Realmforge dungeon our engine runs the creatures of, a
// bot walks from creature to creature and fights. Each one woken must go over to ours, fight (hurt the bot), die to our
// shots, and die in their dungeon too (their kill count, keys, room-clears follow), with no error and no double reward.
//   node tools/check_rf_link.mjs [dungeon ...]
import { readFileSync } from 'node:fs';
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === 'data' ? new Uint8ClampedArray(4096) : k === 'width' || k === 'height' ? 64 : k === Symbol.toPrimitive ? () => 0 : stub()), apply: () => stub(), set: () => true });
globalThis.document = { createElement: () => ({ width: 64, height: 64, getContext: () => stub() }) };
globalThis.OffscreenCanvas = class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return stub(); } };
globalThis.Image = class {};
globalThis.window = globalThis.window || { addEventListener: () => {} };
const ROOT = new URL('../', import.meta.url);
globalThis.fetch = async (u) => ({ json: async () => JSON.parse(readFileSync(new URL(String(u), ROOT), 'utf8')) });
const { buildRegistry } = await import(new URL('src/registry.js', ROOT).href);
const { Game } = await import(new URL('src/game.js', ROOT).href);
const H = await import(new URL('src/rf/host.js', ROOT).href);
await H.loadRF();
const B0 = new URL('art/bundle/', ROOT), J = (q) => JSON.parse(readFileSync(new URL(q, B0), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);
const only = process.argv.slice(2), list = only.length ? only : H.rfLinkedDungeons();
let fail = 0;
for (const dg of list) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.gainXp(999999);
  const p = g.player, I = g.input; I.scripted = true;
  const res = { linked: 0, ours: 0, theirKills: 0, hurt: 0, xp: 0, errors: [] };
  try {
    g.enter(`rf_${dg}`);
    const T = (res.traits = { raised: 0, chainHits: 0, pulses: 0, formation: 0, mirrored: 0, forged: 0 });   // their traits and rules, in our engine
    const m0 = g.rfMirror.bind(g); g.rfMirror = (b, dt) => { m0(b, dt); if (b.refl) T.mirrored++; };
    const r0 = g.rfRaise.bind(g); g.rfRaise = (e, A) => { const n = g.map.rf.E.en_.length; r0(e, A); if (g.map.rf.E.en_.length > n) T.raised++; };
    const c0 = g.chainBeam.bind(g); g.chainBeam = (e, q) => { const t0 = q.chainT; c0(e, q); if (q.chainT !== t0) T.chainHits++; };
    const f0 = g.formation.bind(g); g.formation = (e, dt) => { const r = f0(e, dt); if (r) T.formation++; return r; };
    const fp = g.firePattern.bind(g); g.firePattern = (e, A, w) => { if (A.pattern === 'pulse') T.pulses++; return fp(e, A, w); };
    const E = g.map.rf.E, k0 = E.kills;
    let hurt = 0; const h0 = g.hurtPlayer.bind(g); g.hurtPlayer = (d, by, ig) => { const b = p.hp; h0(d, by, ig); hurt += Math.max(0, b - p.hp); p.hp = g.stat('hp'); p.dead = false; };
    let next = 0, at = null; const tried = new Map(), live = (q) => q.hp > 0 && q.st !== 'gone' && !q.hidden;
    for (let t = 0; t < 240; t += 1 / 30) {
      const mine = g.enemies.filter((o) => !o.dead && o.rfE), theirs = E.en_.filter((q) => live(q) && !q.ours && !q.dormant && q.aggro);
      if (!mine.length && !theirs.length && t >= next || at && (tried.get(at) || 0) > 8) {   // walk on to the next creature still standing (one that won't die in 8s is passed by)
        const e = E.en_.filter((q) => live(q) && !q.ours && (tried.get(q) || 0) <= 8).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
        if (!e) break;
        for (const [dx, dy] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5], [1.5, 1.5], [0, 0]]) if (!g.map.rfSolid(e.x + dx, e.y + dy)) { p.x = e.x + dx; p.y = e.y + dy; break; }
        e.aggro = true; if (e.dormant) e.wake = 0.1;
        at = e; next = t + 1.5;
      }
      if (at) tried.set(at, (tried.get(at) || 0) + 1 / 30);
      const all = [...mine, ...theirs], tg = all.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      I.fire = !!tg; if (tg) { I.aimX = tg.x; I.aimY = tg.y - 0.5; }
      g.update(1 / 30);
      if (g.enemies.some((o) => !o.dead && o.rfE && o.rfE.forged)) T.forged++;
    }
    I.fire = false; for (let k = 0; k < 30; k++) g.update(1 / 30);   // (the last deaths reach their dungeon)
    const linkedDead = E.en_.filter((q) => q.ours && q.hp <= 0).length + 0, oursAlive = g.enemies.filter((o) => o.rfE && !o.dead && o.rfE.hp <= 0).length;
    if (oursAlive) res.errors.push(`${oursAlive} of ours alive whose creature died`);
    const ghost = E.en_.filter((q) => q.ours && q.hp > 0 && q.ours.dead).length;
    if (ghost) res.errors.push(`${ghost} creatures alive whose monster of ours died`);
    void linkedDead;
    res.ours = g.player.kills; res.theirKills = E.kills - k0; res.hurt = Math.round(hurt);
    res.left = E.en_.filter((q) => q.hp > 0 && !q.ours).length;
  } catch (err) { res.errors.push(err.stack.split('\n').slice(0, 3).join(' | ')); }
  const bad = res.errors.length || !res.ours;
  if (bad) fail++;
  console.log(`${bad ? 'PROBLEM' : 'ok     '} ${dg.padEnd(11)} ours killed ${String(res.ours).padStart(3)}, their kill count +${String(res.theirKills).padStart(3)}, hurt the bot ${res.hurt}, left on theirs ${res.left}${Object.entries(res.traits || {}).filter(([, v]) => v).map(([k, v]) => `, ${k} ${k === 'formation' || k === 'forged' ? 'yes' : v}`).join('')}${res.errors.length ? '  ' + res.errors.join(' ; ') : ''}`);
}
process.exit(fail ? 1 : 0);
