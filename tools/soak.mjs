// Headless engine soak test (node tools/soak.mjs): no DOM, no assets. Exercises every class ability,
// every realm boss's mechanics, all three dungeons (ambushes, chests, bosses) and every relic special.
import { Game } from '../src/game.js';
import { R as R0 } from '../src/util.js';
import { isSolid, TID } from '../src/world/maps.js';
import { REALM_BOSSES, DUNGEONS, ENEMIES } from '../src/data/enemies.js';
import { ITEMS } from '../src/data/items.js';

globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const save = { fame: 0, gold: 99999, essence: 0, vaults: [[], [], [], []], graveyard: [], chars: [], slots: 8, bestLevel: 0 };
const g = new Game({}, save);
const step = (sec) => { for (let i = 0; i < sec * 60; i++) g.update(1 / 60); };
const log = [];

for (const cls of ['brawler', 'forge_knight', 'priest', 'summoner', 'harpooner', 'duelist', 'stormwright', 'clockmaker']) {
  g.newCharacter(cls); g.god = true; g.command('/maxlevel');
  g.command('/tp realm');
  g.command('/spawn hollow_thane 6');
  const I = g.input; I.scripted = true; I.fire = true;
  const p = g.player;
  for (let k = 0; k < 6; k++) { const e = g.enemies.find((x) => !x.dead && Math.hypot(x.x - p.x, x.y - p.y) < 10); if (e) { I.aimX = e.x; I.aimY = e.y; } p.mp = 999; p.abilityT = 0; g.useAbility(); step(1); }
  log.push(`${cls}: kills ${p.kills}, allies ${g.allies.length}`);
  g.leaveToMenu();
}

// every enemy, one at a time, gets 8 seconds to show off its movement and shots
{
  g.save.chars = []; g.newCharacter('clockmaker'); g.god = true; g.command('/tp realm');
  const p = g.player, seen = {};
  g.maintainRealm = () => {}; g.eventClock = () => {}; g.updateQuirks = () => {};
  g.input.fire = false; g.input.auto = false;                      // hands off: let each monster show its moves
  for (const [id, E] of Object.entries(ENEMIES)) {
    if (E.dummy) continue;
    g.enemies.length = 0;
    let ex = p.x + 3, ey = p.y;                                   // an open tile near the player, so nothing starts stuck in a wall
    for (let k = 0; k < 24 && (isSolid(g.map, ex, ey) || g.map.tiles[Math.floor(ey) * g.map.w + Math.floor(ex)] === TID.water); k++) { const a = k * 0.9; ex = p.x + Math.cos(a) * 3; ey = p.y + Math.sin(a) * 3; }
    const e = g.addEnemy(id, ex, ey);
    const st = new Set(), mv = new Set();
    const secs = ['blink', 'burrow', 'swoop'].includes(E.ai) ? 18 : 8;   // teleporting, burrowing and diving are rarer now
    for (let i = 0; i < secs * 60; i++) {
      g.update(1 / 60);
      if (e.hop) st.add('hop'); if (e.under) st.add('under'); if (e.dive) st.add('dive'); if (e.blinked) st.add('blink'); if (e.sk) st.add('skitter');
      for (const b of g.projectiles) { if (b.lob) mv.add('lob'); if (b.mv) for (const k of Object.keys(b.mv)) mv.add(k); }
    }
    seen[E.ai] = (seen[E.ai] || 0) + 1;
    if (st.size === 0 && ['hop', 'burrow', 'swoop', 'blink', 'skitter'].includes(E.ai)) log.push(`  !! ${id} (${E.ai}) never did its move: state ${e.state} dead ${!!e.dead} d ${Math.hypot(e.x - p.x, e.y - p.y).toFixed(1)} frozen ${g.frozen(e)} ts ${!!g.timeStop} stun ${e.stunT} aggro ${E.aggro} map ${g.map.kind} pdead ${p.dead} hp ${Math.round(e.hp)}`);
    e.dead = true; g.projectiles.length = 0;
  }
  delete g.maintainRealm; delete g.eventClock; delete g.updateQuirks;     // back to the real ones
  log.push('enemy styles exercised: ' + JSON.stringify(seen));
  // stop time with bullets in the air, then rewind them
  g.command('/give the_broken_hourglass'); p.equip[1] = 'the_broken_hourglass';
  for (let k = 0; k < 20; k++) g.shoot('e', p.x + 3, p.y, Math.PI, 2, 8, 50, 'pearl', 0.35, false, 'test');
  p.mp = 999; p.abilityT = 0; g.useAbility(); g.update(1 / 60);
  const frozen = g.projectiles.filter((b) => b.frozen).length;
  for (let i = 0; i < 5 * 60; i++) g.update(1 / 60);
  log.push(`time stop: ${frozen} bullets frozen; after rewind ${g.projectiles.filter((b) => b.from === 'p').length} fly back as yours`);
  // a shrine and a camp chest
  const sh = g.map.objects.find((o) => o.interact === 'shrine');
  p.x = sh.x; p.y = sh.y + 1; g.update(1 / 60);
  const camp = g.map.objects.find((o) => o.interact === 'chest' && o.guards);
  // chests are broken open with your own shots: fire at it until it cracks
  const breakIt = (o, secs = 60) => { const I = g.input; I.scripted = true; for (let i = 0; i < secs * 60 && !o.opened; i++) { p.x = o.x; p.y = o.y + 2.2; I.aimX = o.x; I.aimY = o.y; I.fire = true; g.update(1 / 60); } I.fire = false; };
  breakIt(camp, 2);
  const before = camp.opened;
  for (const e of camp.guards) e.dead = true;
  breakIt(camp);
  log.push(`shrine blessing: ${p.blessKind} ${p.status.bless.toFixed(0)}s · camp chest locked while guarded: ${!before}, opened after: ${!!camp.opened}`);
  g.leaveToMenu();
}

// quests, wanderers, interactables, mechanics, easter eggs
{
  g.save.chars = []; g.newCharacter('stormwright'); g.god = true; g.command('/maxlevel'); g.command('/tp realm');
  const p = g.player, m = g.map;
  const out = [];
  // a hunt quest, completed by killing
  const q = { kind: 'hunt', target: 'reef_eel', n: 3, have: 0, desc: 'test', reward: { gold: 10, essence: 1 } };
  g.acceptQuest(q);
  const gold0 = g.save.gold;
  for (let k = 0; k < 3; k++) { const e = g.addEnemy('reef_eel', p.x + 2, p.y); g.damageEnemy(e, 1e9, e.x, e.y); }
  out.push(`hunt quest paid ${g.save.gold - gold0} gold, quests left ${p.quests.length}`);
  // a fetch quest gets a spot in this realm, and walking there completes it
  g.acceptQuest(g.makeQuest('fetch'));
  const f = p.quests.find((x) => x.kind === 'fetch');
  p.x = f.x; p.y = f.y; g.update(1 / 60);
  out.push(`fetch quest placed at ${f.x.toFixed(0)},${f.y.toFixed(0)} and done: ${!p.quests.includes(f)}`);
  // every interactable kind in the realm
  for (const kind of ['talk', 'lore', 'wish', 'dig', 'altar']) {
    const o = m.objects.find((x) => x.interact === kind);
    g.save.gold = 9999; g.interact(o); g.interact(o);
  }
  const altar = m.objects.find((x) => x.interact === 'altar');
  p.x = altar.x; p.y = altar.y + 2;
  for (let i = 0; i < 40 * 60 && altar.state !== 'won'; i++) { g.update(1 / 60); for (const e of altar.spawned || []) if (!e.dead && R0() < 0.02) g.damageEnemy(e, 1e9, e.x, e.y); }
  out.push(`altar trial: ${altar.state} after ${altar.wave} waves · wanderer quests: ${p.quests.filter((x) => x.from).length} · lore read: ${p.lore.length}`);
  // mechanics: splitter, bomber, healer, guard (alone, so nothing else interferes)
  g.enemies.length = 0; g.maintainRealm = () => {}; g.eventClock = () => {}; g.updateQuirks = () => {};
  const n0 = g.enemies.filter((e) => !e.dead && e.id === 'brine_slimelet').length;
  const sl = g.addEnemy('brine_slime', p.x + 3, p.y); g.damageEnemy(sl, 1e9, sl.x, sl.y);
  out.push(`slime split into ${g.enemies.filter((e) => !e.dead && e.id === 'brine_slimelet').length - n0}`);
  const bomb = g.addEnemy('gas_bloat', p.x + 1, p.y); bomb.seen = true;
  for (let i = 0; i < 90; i++) g.update(1 / 60);
  out.push(`bomber fused and burst: ${bomb.dead}`);
  const mender = g.addEnemy('cairn_mender', p.x + 4, p.y), hurt = g.addEnemy('mourning_willow', p.x + 4.5, p.y + 1);
  hurt.hp = hurt.maxHp * 0.3; const h0 = hurt.hp;
  for (let i = 0; i < 5 * 60; i++) g.update(1 / 60);
  out.push(`mender healed its friend: ${hurt.hp > h0}`);
  g.enemies.length = 0;
  const lan = g.addEnemy('gilded_lancer', p.x + 3, p.y); lan.state = 'move'; lan.cds = lan.cds.map(() => 99);
  const b0 = g.shoot('p', p.x + 1.5, p.y - 0.5, 0, 12, 4, 100, 'lance', 0.4, false); void b0;
  const hp0 = lan.hp; for (let i = 0; i < 20; i++) g.update(1 / 60);
  out.push(`lancer guard: blocked a frontal shot = ${lan.hp === hp0}`);
  delete g.maintainRealm; delete g.eventClock; delete g.updateQuirks;
  // easter eggs
  g.command('/dance'); g.konami(); g.command('/duck');
  out.push(`dance ${p.danceT > 0} · konami ${!!g.konamiDone} · speech bubbles so far ${g.bubbles.length}`);
  log.push('quests + interactables: ' + out.join(' | '));
  // the nexus: board, cat, fishing, campfire rest
  g.enter('nexus');
  const nx = g.map;
  for (const kind of ['cat', 'fish']) g.interact(nx.objects.find((x) => x.interact === kind));
  const fire = nx.objects.find((o) => o.sprite === 'campfire'); p.x = fire.x + 1.5; p.y = fire.y + 1; p.moving = false;
  g.input.up = g.input.down = g.input.left = g.input.right = 0;
  for (let i = 0; i < 7 * 60; i++) g.update(1 / 60);
  log.push(`nexus: offers ${g.questOffers.length}, rested ${p.status.rested > 0}, petted ${p.petted}`);
  g.leaveToMenu();
}

// every dungeon boss, walked through every phase: which mechanics fire?
{
  g.save.chars = []; g.newCharacter('priest'); g.god = true; g.command('/maxlevel');
  const p = g.player;
  for (const d of Object.keys(DUNGEONS)) {
    g.enter(d);
    const br = g.map.rooms.at(-1); p.x = br.cx + 0.5; p.y = br.cy + 5;
    const seen = new Set();
    const B = () => g.boss || g.enemies.find((e) => e.rb && !e.cloneOf);
    for (let i = 0; i < 30; i++) g.update(1 / 60);
    const marks = [1, 0.7, 0.44, 0.17, 0.08];
    for (const hpFrac of marks) {
      const b0 = B(); if (!b0 || b0.dead) break;
      b0.hp = Math.min(b0.hp, b0.maxHp * hpFrac);
      for (let i = 0; i < 22 * 60; i++) {
        g.update(1 / 60);
        for (const f of g.fx) if (['sweep', 'zone', 'laser'].includes(f.kind)) seen.add(f.kind);
        if (g.arena) seen.add('arena');
        const bb = B(); if (!bb) break;
        if (bb.pulling) seen.add('pull'); if (bb.shieldBy && bb.shieldBy.some((m) => !m.dead)) seen.add('shield');
        if (g.enemies.some((e) => e.cloneOf)) seen.add('clones');
        if (g.map.miniDirty !== undefined) seen.add('flood');
        if (bb.dashing) seen.add('dash'); if (bb.orbiting) seen.add('orbit');
        p.x = Math.max(br.x + 7, Math.min(br.x + br.w - 7, p.x)); p.y = Math.max(br.y + 7, Math.min(br.y + br.h - 7, p.y));
      }
    }
    const b1 = B();
    log.push(`${d} boss: ${[...seen].sort().join(', ')} · ended in ${b1 ? (b1.state || 'alive') + ' phase ' + (b1.phaseIdx ?? b1.phase) : 'gone'}`);
  }
  // the realm's events + nexus life
  g.enter('realm'); g.worldEvent('star'); g.worldEvent('thief');
  const ev = g.map.events || [];
  const thief = ev.find((v) => v.kind === 'thief');
  const gold0 = g.save.gold; if (thief) for (let k = 0; k < 20; k++) g.damageEnemy(thief.e, 50, thief.e.x, thief.e.y);
  log.push(`world events: ${ev.map((v) => v.kind).join(', ')} · thief shed ${g.save.gold - gold0} gold`);
  g.enter('nexus');
  const v0 = g.map.villagers.map((v) => [v.x, v.y]);
  for (const kind of ['bard', 'fortune']) { g.save.gold = 1000; g.interact(g.map.objects.find((o) => o.interact === kind)); }
  for (let i = 0; i < 10 * 60; i++) g.update(1 / 60);
  const moved = g.map.villagers.filter((v, k) => Math.hypot(v.x - v0[k][0], v.y - v0[k][1]) > 1).length;
  log.push(`nexus: inspired ${p.status.inspired > 0}, villagers who walked: ${moved}/3, trophies ${JSON.stringify(g.save.trophies || [])}`);
  g.leaveToMenu();
}

// every realm boss with every mechanic, 60 simulated seconds each
g.save.chars = []; g.newCharacter('priest'); g.god = true; g.command('/maxlevel'); g.command('/tp realm');
for (const id of Object.keys(REALM_BOSSES)) {
  const seen = new Set();
  g.command(`/boss ${id}`);
  const B = g.enemies.find((e) => e.rb && e.id === id && !e.dead);
  B.hp = B.maxHp * 0.15;                                          // straight to the last phase too
  for (let i = 0; i < 60 * 60; i++) {
    g.update(1 / 60);
    if (B.move) seen.add(Object.keys(B.move).filter((k) => ['dash', 'blink', 'orbit', 'zones', 'gapring', 'shield'].includes(k)).join('+') || 'classic');
    if (i === 1800) B.hp = B.maxHp;                                // and back to phase 1
  }
  log.push(`${id}: ${[...seen].join(', ')} · projectiles ${g.projectiles.length} · fx ${g.fx.length}`);
  B.dead = true;
}

// dungeons: walk every room, trigger ambushes, crack chests, wake the boss
for (const d of Object.keys(DUNGEONS)) {
  g.enter(d);
  const m = g.map, p = g.player;
  let chests = 0;
  for (const rm of [...m.rooms, ...m.sides]) { p.x = rm.cx + 0.5; p.y = rm.cy + 0.5; step(0.5); }
  for (const o of m.objects) if (o.interact === 'chest') {
    const I = g.input; I.scripted = true;
    for (let i = 0; i < 60 * 60 && !o.opened; i++) { p.x = o.x; p.y = o.y + 2.2; I.aimX = o.x; I.aimY = o.y; I.fire = true; g.update(1 / 60); }
    I.fire = false; chests += o.opened ? 1 : 0;
  }
  const br = m.rooms.at(-1); p.x = br.cx; p.y = br.cy + 4; step(20);
  log.push(`${d}: enemies ${g.enemies.filter((e) => !e.dead).length}, chests opened ${chests}, ambushes left ${m.rooms.filter((r) => r.pending).length}, boss ${g.boss ? g.boss.state : (g.enemies.find((e) => e.rb) || {}).state}`);
}

// every special weapon and passive at least fires without throwing
g.enter('nexus');
for (const it of Object.values(ITEMS).filter((x) => x.ut)) {
  const p = g.player;
  if (it.slot === 'weapon') p.equip[0] = it.id;
  if (it.slot === 'armor') p.equip[2] = it.id;
  if (it.slot === 'ring') p.equip[3] = it.id;
  if (it.slot === 'ability') p.equip[1] = it.id;
  g.input.aimX = 10.5; g.input.aimY = 8.6; p.x = 12.5; p.y = 13.5; p.mp = 999; p.abilityT = 0;
  g.useAbility(); step(0.6);
}
log.push('all relics exercised');
console.log(log.join('\n'));
