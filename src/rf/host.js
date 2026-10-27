// The user's Realmforge dungeons, hosted (docs/realmforge_port.md). Their engine (src/rf/explore_gen.js, built from
// Realmforge by tools/rf_build_explore.py) lays the dungeon out and runs its creatures, traps, rooms and module rules
// exactly as Realmforge does; this file is the game around it: our map (tiles, 2.5D walls, collision) mirrors theirs,
// our player stands in for theirs, our shots hit their creatures, their hits hurt us, kills and chests reward us, and
// our renderer draws all of it (their art, 8 pixels to a tile, drawn at 2x like ours).
import { makeExplore } from './explore_gen.js';
import { TID } from '../world/maps.js';
import { lift, liftA, liftB, R } from '../util.js';
import { rollLoot } from '../data/items.js';
import { bossData } from './boss.js';
import { RF_FOE_LANDS } from '../data/rf_foes.js';
import { rfBalance } from './balance.js';
import { addRfBosses } from '../bosses/rf_translate.js';
import { translateAll } from './creatures.js';
import { ENEMIES } from '../data/enemies.js';

const TS = 16, K = 2;                                             // our tile is 16 buffer pixels; their art is 8 to a tile
// their tile codes (C in explore.js) -> our tile names: a code change is a tile change, so our chunk caches follow
export const RF_CODE_TILE = ['rf_wall', 'rf_floor', 'rf_path', 'rf_pit', 'rf_secret', 'rf_gate', 'rf_haz', 'rf_liq', 'rf_ice', 'rf_bridge', 'rf_tog', 'rf_break', 'rf_conv', 'rf_deep'];
let DATA = null, X = null;
// one engine (docs/realmforge_port.md, Phase 5): which of their creatures our monster engine runs. A kind goes over when it
// came over whole (src/rf/creatures.js: no approximation, nothing left out) and its dungeon has no rule of its own about
// how its creatures move, fight, take hits or die (their module hooks below); the rest stay on their engine until theirs
// is built in ours
let OURS = new Set(), LINK_DG = new Set();
const CREATURE_HOOKS = ['enemy', 'vuln', 'hitEnemy', 'alpha', 'atk', 'bullet', 'kill', 'drawEnemy', 'spawn', 'woke'];
// the rules of theirs our engine keeps now, dungeon by dungeon: the Forge's smith works faster at its anvil (and sparks);
// the Keep's bishop shoots the diagonals; the Rift's rules touch only its echoes (still theirs); the Hall of Mirrors
// turns a monster's shot back once off a mirror
const HOOKS_OURS = { forge: ['drawEnemy'], keep: ['atk'], rift: ['atk', 'drawEnemy'], mirrors: ['bullet'] };
const HOST = {};                                                  // filled in by rfMap: the calls their engine makes to us

// boot: the Realmforge data (dungeons, creatures, art) is loaded once, in the background
export async function loadRF() {
  try { DATA = await (await fetch('art/rf/data.json')).json(); X = makeExplore(DATA, HOST); bossData(DATA); addRfBosses(DATA); rfCreatures(); } catch (err) { console.warn('Realmforge data not loaded', err); }
}
// their creatures as our monster definitions (rf_<dungeon>_<id>), and which of them our engine runs
function rfCreatures() {
  const T = translateAll(DATA);
  for (const [id, D] of Object.entries(T.defs)) ENEMIES[id] = { ...D, id };
  OURS = new Set(T.report.filter((r) => r.notes.every((n) => n.includes('left out (monsters never'))).map((r) => r.id));   // (a protection left out by our rule is ours as it should be)
  LINK_DG = new Set(DATA.dungeons.map((d) => d.id).filter((id) => !CREATURE_HOOKS.some((k) => X.MODS[id] && X.MODS[id][k] && !(HOOKS_OURS[id] || []).includes(k))));
}
export const rfLinkedDungeons = () => [...LINK_DG];
export const rfReady = () => !!X;
export const rfDungeons = () => (DATA ? DATA.dungeons.map((d) => d.id) : []);
const dgOf = (id) => DATA && DATA.dungeons.find((d) => d.id === id);

const methods = {
  // a fresh run of one of their dungeons, as our map
  rfMap(where, seed0 = 0) {
    const id = where.slice(3), dg = dgOf(id);
    if (!X || !dg) return null;
    const g = this;
    Object.assign(HOST, {
      msg: (t, dur) => g.banner(t, Math.max(1800, dur * 1000), true),
      hurt: (d, o) => { const p = g.player, hp = p.hp; g.rfHurting = true; g.hurtPlayer(Math.round(d * rfBalance(DATA, id).dmg), (o && o.d && o.d.name) || dg.name); g.rfHurting = false; return Math.max(0, Math.round(hp - p.hp)); },   // (their own rule on your hurt already ran: rfHurtK)
      ground: (p, ground, dt, mod) => g.rfGround(p, ground, dt, mod),
      pickup: (d) => { if (d.k === 'potion') g.rfPotion(); },
      drop: (e) => g.rfDrop(e),
      chest: (pr) => g.rfChest(pr),
      heal: () => { const P = g.player; P.hp = g.stat('hp'); P.mp = g.stat('mp'); },
      kill: (e) => g.rfKill(e),
      shrine: () => { g.player.status.berserk = Math.max(g.player.status.berserk || 0, 20); },
      bossDoor: () => {},
    });
    const seed = seed0 || ((Date.now() & 0xffffff) | 5);
    if (!X.setup(dg, seed)) return null;
    const E = X.E || this.rfE();
    const M = E.M, m = {
      kind: 'dungeon', name: dg.name, w: M.W, h: M.H, tiles: new Uint8Array(M.W * M.H), solid: new Uint8Array(M.W * M.H),
      biome: new Int8Array(M.W * M.H).fill(-1), objects: [], portals: [], rooms: [], spawn: { x: M.start.x, y: M.start.y },
      rf: { id, dg, E, X, xp: DATA.explore, pots: E.pots, coins: E.coins, tick: 0 },
    };
    m.rfSolid = (x, y) => X.solidMove(x, y);
    m.rfShot = (x, y) => X.solidShot(x, y);
    this.rfSync(m);
    m.rfMini = (i) => this.rfMiniColor(m, i);
    for (const e of E.en_) this.rfScale(e, id);                 // (this.map is not this one yet)
    return m;
  },
  // the loading card for one of their dungeons or boss rooms
  rfDest(where) {
    if (where.startsWith('rf_boss:')) { const B = DATA && DATA.bosses.find((b) => b.id === where.slice(8)); return { name: B ? B.name : where, stars: 4, sub: B ? B.title : '' }; }
    const dg = dgOf(where.slice(3)), B = dg && DATA.bosses.find((b) => b.id === dg.boss);
    return { name: dg ? dg.name : where, stars: dg ? rfBalance(DATA, dg.id).stars : 1, sub: B ? `Its master: ${B.name}` : '' };
  },
  // the realm keeps about one pack of each portal dropper in its land; the Unmaker's Eye is a rare sight in Godfall
  rfMaintain(packs, r) {
    const alive = {};
    for (const e of this.enemies) if (!e.dead && e.D.rfPortal) alive[e.id] = (alive[e.id] || 0) + 1;
    for (const [land, ids] of Object.entries(RF_FOE_LANDS)) for (const id of ids) {
      if (alive[id]) continue;
      if (id === 'rf_the_unmaker_s_eye') { if ((r || R)() < (r ? 0.5 : 0.004)) this.spawnGroup(land, r || R, this.player || this.map.spawn, 18, id); continue; }
      this.spawnPack(land, id, r);
    }
    void packs;
  },
  // a portal to one of their dungeons, in their portal's art
  rfOpenPortal(to, x, y, life) {
    const id = to.slice(3), dg = dgOf(id);
    if (!dg) return;
    this.map.portals.push({ kind: 'dungeon', rf: id, x, y, label: dg.portal_name ? `${dg.name} (${dg.portal_name})` : dg.name, to, life });
    this.say(`A portal to ${dg.name} has opened!`, dg.glow || '#3befff');
  },
  // a tile's colour on the minimap: the middle of its painted art (walls deep inside the rock stay dark)
  rfMiniColor(m, i) {
    const E = m.rf.E;
    if (!m.rf.miniPx || m.rf.miniPxT !== m.rf.tilesV) { m.rf.miniPx = E.base.getContext('2d').getImageData(0, 0, E.base.width, E.base.height).data; m.rf.miniPxT = m.rf.tilesV; }
    const x = i % m.w, y = (i / m.w) | 0, W = E.base.width, P = m.rf.miniPx, q = ((y * 8 + 4) * W + x * 8 + 3) * 4, r = ((y * 8 + 2) * W + x * 8 + 5) * 4;
    return [(P[q] + P[r]) >> 1, (P[q + 1] + P[r + 1]) >> 1, (P[q + 2] + P[r + 2]) >> 1];
  },
  // a Realmforge map's stars (its band: src/rf/balance.js)
  rfStars() { const m = this.map, id = m.rf ? m.rf.id : (DATA.dungeons.find((d) => d.boss === m.rfBoss.id) || {}).id; const b = id && rfBalance(DATA, id); return b ? b.stars : 3; },
  rfE() { return X.state ? X.state() : null; },
  rfScale(e, id = this.map.rf.id) {                                // (src/rf/balance.js)
    if (e.rfScaled) return;
    e.rfScaled = 1;
    if (e.half) return;                                            // (a splitter's half: made from its scaled parent)
    const k = rfBalance(DATA, id).hp, f = e.hp / e.max;          // (one raised or reborn keeps its share of its health)
    e.max = Math.round(e.max * k); e.hp = Math.round(e.max * f);
  },
  // their dungeon's rule on what hurts you, for our monsters' blows in the dungeons whose creatures are ours
  rfHurtK() {
    const E = this.map.rf.E;
    if (!E.mod || !E.mod.hurt || !LINK_DG.has(this.map.rf.id)) return 1;
    const k = E.mod.hurt(1, null);
    return k === 0 ? 0 : k || 1;
  },
  // their Hall of Mirrors: a monster's shot about to meet a mirror turns back once (as their bullet rule does)
  rfMirror(b, dt) {
    const M = this.map.rf.E.M;
    if (!M.mirror) return;
    if (M.mirror.has(M.I(Math.floor(b.x + b.vx * dt * 1.6), Math.floor(b.y + 0.3 + b.vy * dt * 1.6)))) { b.vy = -b.vy; b.a = Math.atan2(b.vy, b.vx); b.refl = 1; b.life = Math.max(b.life, 1.4); }
  },
  // a raiser of ours raises one of their fallen, as theirs did: in its own room, dead a moment, a kind that may rise
  rfRaise(e, A) {
    const E = this.map.rf.E, w = e.rfE;
    if (!w) return;
    const c = E.corpses.find((q) => q.room === w.room && E.t - q.t > 1.5 && Math.hypot(q.x - e.x, q.y - e.y) < (A.r || 8) && E.cfg.enemies[q.k] && !E.cfg.enemies[q.k].noRaise);
    if (!c || (E.mod.canRaise && !E.mod.canRaise(w))) return;
    E.corpses.splice(E.corpses.indexOf(c), 1);
    const o = X.mkEnemy({ k: c.k, x: c.x, y: c.y, room: c.room, aggro: true });
    o.hp = o.max * 0.6; this.rfScale(o); E.en_.push(o);
    this.vx({ k: 'zap', ...liftA(e.x, e.y, 0.5), ...liftB(c.x, c.y, 0.3) });
    this.vx({ k: 'burst', ...this.rfLift(c.x, c.y), n: 12, colors: [A.color || '#7affc8', '#ffffff'] });
  },
  // our map follows theirs: tile codes, and what blocks you (their walls and solid things)
  rfSync(m) {
    const M = m.rf.E.M, t = M.t, og = m.rf.E.og;
    for (let k = 0; k < t.length; k++) {
      const v = TID[RF_CODE_TILE[t[k]]];
      if (m.tiles[k] !== v) { m.tiles[k] = v; m.miniDirty = true; m.rf.tilesV = (m.rf.tilesV || 0) + 1; }   // (the minimap follows)
      m.solid[k] = X.BM[t[k]] && !(t[k] === X.C.DEEP && M.deepWalk) ? 1 : og && og[k] > 0 ? 1 : 0;
    }
  },
  // one frame of their dungeon around our player
  rfUpdate(dt) {
    const m = this.map, R = m.rf, E = R.E, p = this.player, ep = E.p;
    if (!ep) return;
    ep.x = p.x; ep.y = p.y; ep.hp = p.hp;
    const bx = ep.x, by = ep.y;
    this.rfLinkIn();
    X.tick(dt);
    this.rfLinkOut();
    if (ep.x !== bx || ep.y !== by) { p.x = ep.x; p.y = ep.y; this.unstick(p); }   // their portals, a collapsing floor, a push
    for (const e of E.en_) this.rfScale(e);
    this.rfTheirsTick(dt);
    if ((R.tick = (R.tick || 0) + 1) % 3 === 0 || E.ogDirty === 0) this.rfSync(m);
    if (E.pots > R.pots) { for (let k = R.pots; k < E.pots; k++) this.rfPotion(); }
    R.pots = E.pots;
    if (E.banner && E.banner !== R.banner) { R.banner = E.banner; this.banner(E.banner.t, 2200, false); }
    if (E.M.bossDoor && !R.door && E.atDoor) {                 // the boss's door: it opens onto the boss's own room
      R.door = { kind: 'dungeon', hidden: true, x: E.M.bossDoor.x + 0.5, y: E.M.bossDoor.y + 1, label: E.B.name, to: `rfa_${E.B.id}` };
      m.portals.push(R.door);
      this.banner(`${E.B.name} waits beyond this door.`, 2500);
    }
  },
  // one engine: our monster stands in for their creature from the moment it wakes to fight; theirs stays in their rooms
  // (their locks, guards, room-clears and keys count it) and goes where ours goes. Before their frame: ours -> theirs
  rfLinkIn() {
    const E = this.map.rf.E;
    for (const e of E.en_) {
      const o = e.ours;
      if (!o || e.hp <= 0) continue;
      if (o.dead) { e.rfByOurs = 1; X.kill(e); continue; }       // our blow: their kill (its key, its corpse, its room)
      e.x = o.x; e.y = o.y; e.hp = o.hp; e.aggro = true; e.rfAt = [e.x, e.y]; e.rfHp = e.hp;
    }
  },
  // after their frame: what their world did to it (a push, a trap, a portal) reaches ours; and the newly woken go over
  rfLinkOut() {
    const m = this.map, E = m.rf.E, dg = m.rf.id;
    for (const e of E.en_) {
      const o = e.ours;
      if (!o) {
        if (e.hp > 0 && e.aggro && !e.dormant && !e.hidden && e.st !== 'gone' && LINK_DG.has(dg) && OURS.has(`rf_${dg}_${e.k}`)) {
          const n = this.addEnemy(`rf_${dg}_${e.k}`, e.x, e.y);
          n.hp = e.hp; n.maxHp = e.max; n.seen = true; n.aggro = true; n.rfE = e; n.squad = e.squad; e.ours = n;
        }
        continue;
      }
      if (o.dead || !e.rfAt) continue;
      if (e.x !== e.rfAt[0] || e.y !== e.rfAt[1]) { o.x = e.x; o.y = e.y; }
      if (e.hp < e.rfHp) {                                       // their world hurt it
        o.hp = Math.max(0, o.hp - (e.rfHp - e.hp));
        if (e.hp <= 0) { o.dead = true; o.deadT = 0; o.hp = 0; o.noLoot = true; this.vx({ k: 'death', e: o, big: false }); }   // (their kill paid for it)
      }
    }
  },
  // what the ground does to you: ice slides you, liquid slows and may hurt, conveyors, winds and currents push
  rfGround(p, ground, dt, mod) {
    const P = this.player, C = X.C, M = this.map.rf.E.M;
    let ex = p.ext[0], ey = p.ext[1];
    p.ext[0] *= Math.exp(-dt * 6); p.ext[1] *= Math.exp(-dt * 6);
    if (ground === C.CONV) { const dr = M.aux[M.I(Math.floor(p.x), Math.floor(p.y))]; ex += [1, 0, -1, 0][dr & 3] * 2.6; ey += [0, 1, 0, -1][dr & 3] * 2.6; }
    if (mod && mod.push) { const q = mod.push(p, dt); ex += q[0]; ey += q[1]; }
    if (ex || ey) { this.moveCircle(P, ex * dt, ey * dt, 0.3); p.x = P.x; p.y = P.y; }
    P.rfSlow = this.rfu().washirobe ? (p.root > 0 ? 0.12 : 1) : ground === C.LIQ ? (this.map.rf.E.cfg.liquid && this.map.rf.E.cfg.liquid.slow) || 0.6 : p.root > 0 ? 0.12 : p.slow > this.map.rf.E.t ? 0.55 : 1;
  },
  rfPotion() {
    const p = this.player, f = p.inv.indexOf(null);
    if (f >= 0) p.inv[f] = 'pot_hp'; else this.addBag(p.x, p.y + 0.6, ['pot_hp']);
  },
  // a creature dies: experience, and now and then a bag (their keys stay theirs: the locks count them)
  rfKill(e) {
    const d = e.d, big = e.boss || d.size > 16, T = this.map.rf.E.t;
    if (!e.rfByOurs) {                                           // (one of ours: our death already paid its experience and kill effects)
      this.rfOnKill({ x: e.x, y: e.y, rb: !!e.boss, curseT: e.rfCurseT > T ? 1 : 0, burn: e.rfDot && e.rfDot.t > T ? { t: 1 } : null, D: { r: 0.5 } });   // the uniques that answer a kill
      this.gainXp(Math.round((d.hp || 300) / (big ? 12 : 25)));
    }
    const R = Math.random();
    if (big) this.addBag(e.x, e.y + 0.6, rollLoot(this.rfLoot(2), 1.5));
    else if (R < 0.06) this.addBag(e.x, e.y + 0.4, rollLoot(this.rfLoot(1), 1));
  },
  rfDrop() {},                                                 // (no floor potions: our dungeons drop none, 2026-10-19)
  // a chest: our loot, by how hard it was to reach
  rfChest(pr) {
    const L = { common: 1, puzzle: 1.6, rare: 2, challenge: 2.4, secret: 2.6 }[pr.loot] || 1;
    this.addBag(pr.x + 0.5, pr.y + 1.3, rollLoot(this.rfLoot(L), L));
    this.vx({ k: 'burst', ...this.rfLift(pr.x + 0.5, pr.y + 0.5), n: 10, colors: ['#ffe066', '#ffffff'] });
  },
  rfLift(x, y, h = 0.4) { const [lx, ly] = lift(x, y, h); return { x: lx, y: ly }; },
  // the loot of their dungeon's band (src/rf/balance.js), like our dungeons' chests at the same tier
  rfLoot(k) {
    const T = rfBalance(DATA, this.map.rf.id).tiers;
    return [{ slot: 'weapon', tiers: T, p: 0.35 * k }, { slot: 'armor', tiers: T, p: 0.35 * k }, { slot: 'ring', tiers: [1, 3], p: 0.15 * k },
      { slot: 'ability', tiers: [2, 4], p: 0.15 * k }, { id: 'pot_hp', p: 0.5 }, { stat: true, p: 0.08 * k }];
  },
  // what our shot's on-hit effects do to one of their creatures (ours act through playerHit; theirs have no burn or
  // slow of their own): burning and venom tick, a slow slows, a curse raises the damage it takes, a chain arcs, a split
  // splits, lifesteal heals, a tide shot shoves (the Realmforge uniques' own rules, src/rf/uniqmech.js, included)
  rfOnHitTheirs(e, b, dealt) {
    const E = this.map.rf.E, t = E.t, sp = b.sp || {}, p = this.player;
    const dot = (dps, s) => { e.rfDot = { dps: Math.max(dps, e.rfDot && e.rfDot.t > t ? e.rfDot.dps : 0), t: t + s, acc: 0 }; };
    if (sp.burn) dot(sp.burn.dps, sp.burn.t);
    if (b.rfVenom) dot(Math.round(100 * this.rfMult()), 3);
    if (sp.slow && !e.boss) { e.rfSlowT = t + sp.slow.t; e.rfSlowF = sp.slow.f; }
    const curse = (f, s) => { e.rfCurseF = Math.max(e.rfCurseT > t ? e.rfCurseF || 0 : 0, f); e.rfCurseT = Math.max(e.rfCurseT || 0, t + s); };
    if (sp.curse) curse(sp.curse.f, sp.curse.t);
    if (b.rfCurse) curse(0.15, 3);
    const U = this.rfu();
    if (U.sarrukhfang) curse(0.1, 2);
    if (sp.lifesteal) p.hp = Math.min(this.stat('hp'), p.hp + dealt * sp.lifesteal);
    if (U.worldheart && this.rfReady('wheal')) { this.rfCool('wheal', 0.25); p.hp = Math.min(this.stat('hp'), p.hp + 10); }
    if (sp.split && !sp.split.onEnd && !b.child) this.splitShot(b, sp.split);
    if (sp.chain) {
      let from = e; const seen = new Set([e]);
      for (let k = 0; k < sp.chain.n; k++) {
        const nx = E.en_.filter((o) => o.hp > 0 && !o.ours && !seen.has(o) && !o.hidden && !o.dormant && Math.hypot(o.x - from.x, o.y - from.y) < 4.5).sort((a, c) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(c.x - from.x, c.y - from.y))[0];
        if (!nx) break;
        seen.add(nx); this.vx({ k: 'zap', ...liftA(from.x, from.y, 0.5), ...liftB(nx.x, nx.y, 0.5) });
        X.damageEnemy(nx, Math.round(b.dmg * sp.chain.f), { x: nx.x, y: nx.y }); from = nx;
      }
    }
    if ((b.rfTide || U.unmaker) && !e.boss) { const a = Math.atan2(b.vy, b.vx); e.x += Math.cos(a) * (b.rfTide ? 0.8 : 0); e.y += Math.sin(a) * (b.rfTide ? 0.8 : 0); }
    if ((b.rfStop || b.rfStill || (U.lighthouse && !(e.rfBlindT > t))) && !e.boss) { e.lock = Math.max(e.lock || 0, 0.6); e.rfBlindT = t + 3; b.rfStop = b.rfStill = false; }
  },
  // their creatures under our effects, every frame: burning ticks, slowed ones walk slow
  rfTheirsTick(dt) {
    const E = this.map.rf.E, t = E.t;
    for (const e of E.en_) {
      if (e.hp <= 0 || e.ours) continue;
      if (e.rfDot && e.rfDot.t > t) { e.rfDot.acc += dt; if (e.rfDot.acc >= 0.5) { e.rfDot.acc -= 0.5; X.damageEnemy(e, Math.round(e.rfDot.dps * 0.5), { x: e.x, y: e.y }); this.float(...lift(e.x, e.y, 1.2), `${Math.round(e.rfDot.dps * 0.5)}`, '#ff9a5a'); } }
      if (e.rfSpd0 === undefined) e.rfSpd0 = e.spd;
      e.spd = e.rfSlowT > t ? e.rfSpd0 * e.rfSlowF : e.rfSpd0;
    }
  },
  // what an ability's circle holds here: the creatures (each given a light D for our ability code) and the boss
  rfIn(x, y, r) {
    const out = [], m = this.map;
    if (m.rf) for (const e of m.rf.E.en_) {
      if (e.hp <= 0 || e.ours || e.dormant || e.hidden || e.st === 'gone') continue;
      const er = e.r || 0.5;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < (r + er) ** 2) { e.rfC = true; e.D = e.D || { name: (e.d && e.d.name) || 'creature', r: er }; out.push(e); }
    }
    const P = m.rfBoss && m.rfBoss.bubE;
    if (P && !m.rfBoss.done && (P.x - x) ** 2 + (P.y - y) ** 2 < (r + 1.2) ** 2) { P.rfBossP = true; P.D = P.D || { name: m.rfBoss.B.name, r: 1.2 }; out.push(P); }
    return out;
  },
  // an ability lands on one of them: the creature takes it as a shot would; the boss by its own rules (rf/boss.js)
  rfAbilityHit(e, dmg) {
    if (e.rfBossP) { this.rfBossShot({ x: e.x, y: e.y - 0.35, vx: 0, vy: 1, dmg, hit: null, pierce: true }); return dmg; }
    const hp0 = e.hp;
    X.damageEnemy(e, Math.round(dmg), { x: e.x, y: e.y });
    const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
    if (dealt) this.float(...lift(e.x, e.y, 1.2), `${Math.round(dealt)}`, '#ff5050');
    return dealt;
  },
  // our shot against their creatures (the loop in updateProjectiles calls this for each of your shots)
  rfShotHits(b) {
    const E = this.map.rf.E;
    for (const e of E.en_) {
      if (e.hp <= 0 || e.ours || e.dormant || e.hidden || e.st === 'gone') continue;
      const [hx, hy] = lift(e.x, e.y + (e.z || 0), 0.45), rr = (e.r || 0.5) + b.r * 0.6;
      if ((b.x - hx) ** 2 + (b.y - hy) ** 2 < rr * rr) {
        if (b.hit) { if (b.hit.has(e)) continue; b.hit.add(e); }
        const t = E.t, curse = e.rfCurseT > t ? e.rfCurseF : 0;
        const dmg = Math.round(b.dmg * (1 + curse));
        const hp0 = e.hp;
        X.damageEnemy(e, dmg, { x: e.x, y: e.y });
        const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
        if (dealt) { this.float(...lift(e.x, e.y, 1.2), `${Math.round(dealt)}`, '#ff5050'); this.rfOnHitTheirs(e, b, dealt); }
        return !b.pierce;
      }
    }
    return false;
  },
};
export function installRF(Game) { Object.assign(Game.prototype, methods); }
