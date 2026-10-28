// The user's Realmforge dungeons, hosted (docs/realmforge_port.md). Their engine (src/rf/explore_gen.js, built from
// Realmforge by tools/rf_build_explore.py) lays the dungeon out and runs its creatures, traps, rooms and module rules
// exactly as Realmforge does; this file is the game around it: our map (tiles, 2.5D walls, collision) mirrors theirs,
// our player stands in for theirs, our shots hit their creatures, their hits hurt us, kills and chests reward us, and
// our renderer draws all of it (their art, 8 pixels to a tile, drawn at 2x like ours).
import { makeExplore } from './explore_gen.js';
import { TID, isSolid } from '../world/maps.js';
import { lift, liftA, liftB, liftO, R, TAU } from '../util.js';
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
const XG = () => X;
let RF_NAME = null;                                               // (our tile ids -> names, for a shared dungeon's tiles)
const NET_HELD = { rfHold: false, net: true };                   // (a browser's creature in a dungeon the server runs: never stepped)
// one engine (docs/realmforge_port.md, Phase 5): which of their creatures our monster engine runs. A kind goes over when it
// came over whole (src/rf/creatures.js: no approximation, nothing left out) and its dungeon has no rule of its own about
// how its creatures move, fight, take hits or die (their module hooks below); the rest stay on their engine until theirs
// is built in ours
let OURS = new Set(), LINK_DG = new Set();
const CREATURE_HOOKS = ['enemy', 'vuln', 'hitEnemy', 'alpha', 'atk', 'bullet', 'kill', 'drawEnemy', 'spawn', 'woke'];
// the rules of theirs our engine keeps now, dungeon by dungeon: the Forge's smith works faster at its anvil (and sparks);
// the Keep's bishop shoots the diagonals; the Rift's rules touch only its echoes (still theirs); the Hall of Mirrors
// turns a monster's shot back once off a mirror
const HOOKS_OURS = { forge: ['drawEnemy'], keep: ['atk'], rift: ['atk', 'drawEnemy'], mirrors: ['bullet'], sewers: ['enemy'], clocktower: ['enemy'],
  glade: ['vuln', 'alpha', 'bullet'],     // (the Glade: moon-spirits solid only in moonlight; still water mirrors a shot)
  temple: ['vuln', 'alpha', 'atk'],       // (the Temple: sun things by day, moon things by night; its one atk rule is a shield, which our rule leaves out)
  grove: ['enemy', 'vuln', 'drawEnemy'],  // (the Grove: guardians keep near their post, nothing is hurt by its runes, wrath)
  pyre: ['enemy', 'vuln', 'kill'],       // (the Pyre: a brute's cooled armour cracks open as it strikes; a phoenixling's ember, by their kill rule)
  unmelting: ['vuln', 'drawEnemy', 'atk', 'bullet'],   // (the Unmelting: a shot through a crystal splits; its encase, an ice shell on an ally, is a guard our rule leaves out)
  sanctum: ['enemy', 'vuln', 'alpha'],   // (the Sanctum: a shade is weak in the sun, a sun-disc sleeps in shadow)
  stage: ['enemy', 'vuln'] };            // (the Stage: blows tell more while you stand in the spotlight)
// kinds a dungeon's own rule still moves (they stay on their engine): the Sewers' lurker, stranded by low water; the
// Clocktower's windup, stepping on the beat, and its cuckoo, out only on the hour
const KEEP_THEIRS = new Set(['rf_sewers_lurker', 'rf_clocktower_windup', 'rf_clocktower_cuckoo', 'rf_grove_blight', 'rf_pyre_eel']);   // (and the Grove's blight, marching on the sapling; the Pyre's eel, swimming its lava)
// (each engine has its own HOST, filled in by rfMap: the calls their engine makes to us)
// how a call into their engine runs: as it is in a browser; on a server, with a canvas lent for it (server/rfstub.mjs)
let RUN = (f) => f();
export const rfRunner = (f) => { RUN = f; };

// boot: the Realmforge data (dungeons, creatures, art) is loaded once, in the background
// one of their engines (it keeps one dungeon at a time): a browser has one; a server one for each dungeon it hosts.
// Every call into it runs through RUN
function newEngine() {
  const host = {}, xx = RUN(() => makeExplore(DATA, host));
  for (const k of Object.keys(xx)) if (typeof xx[k] === 'function') { const f = xx[k]; xx[k] = (...a) => RUN(() => f(...a)); }
  xx.HOST = host;
  return xx;
}
export async function loadRF() {
  try {
    DATA = await (await fetch('art/rf/data.json')).json();
    X = newEngine();
    bossData(DATA); addRfBosses(DATA); rfCreatures();
  } catch (err) { console.warn('Realmforge data not loaded', err); }
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
    if (!XG() || !dg) return null;
    const g = this, X = this.rfOwnEngine ? newEngine() : XG(), HOST = X.HOST;   // (a server: an engine of its own for each)
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
    if (this.rfServe) Object.assign(HOST, { msg() {}, hurt: () => 0, ground() {}, pickup() {}, drop() {}, chest() {}, heal() {}, kill() {}, shrine() {} });   // a server's copy: each player's own game hurts, rewards and tells them
    const seed = seed0 || ((Date.now() & 0xffffff) | 5);
    if (!X.setup(dg, seed)) return null;
    const E = X.E || (X.state ? X.state() : null);
    E.en_.forEach((e, i) => { e.rfSid = i; });                  // (each creature's number: the same on every machine for the same seed)
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
  rfXe() { return (this.map && this.map.rf && this.map.rf.X) || XG(); },
  rfE() { return this.rfXe().state ? this.rfXe().state() : null; },
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
  // a creature of theirs, fighting, moves by their own code (explore.js stepEnemy), in our world: it heads at you (round
  // walls by our flow field when it can't see you), and each kind its own way. Returns true when it moved itself
  rfMoveStep(e, dt, p, dist) {
    const D = e.D, m = D.rfMove, t = this.t - e.born, w = e.rfE, hx = w ? w.hx : e.hx, hy = w ? w.hy : e.hy;
    const spd = (w ? w.spd : D.speed) * (1 - (e.slowF || 0)), a = Math.atan2(p.y - e.y, p.x - e.x), sees = this.seesFoe(e, p);
    const flowA = () => { const q = this.flowStep(e); return q ? Math.atan2(q[1] - e.y, q[0] - e.x) : null; };
    const go = (k, off = 0, ang) => {
      let aa = (ang ?? a) + off;
      if (!sees && k > 0 && ang == null) { const fa = flowA(); if (fa != null) aa = fa; }
      this.moveCircle(e, Math.cos(aa) * spd * k * dt, Math.sin(aa) * spd * k * dt, Math.min(0.42, D.r * 0.65));
    };
    const rg = D.rg || [4, 7];
    if (D.post && !(w && w.wrath) && Math.hypot(e.x - hx, e.y - hy) > 7) { const ha = Math.atan2(hy - e.y, hx - e.x); this.moveCircle(e, Math.cos(ha) * spd * dt, Math.sin(ha) * spd * dt, 0.38); }   // a Grove guardian pulled back to its post (and it still moves as it would)
    if (m === 'still') return true;
    if (m === 'chase') go(1, D.weave ? Math.sin(t * D.weave + hx) * 0.7 : 0);
    else if (m === 'patrol') go(sees ? 0.9 : 1);
    else if (m === 'leader') go(0.6, Math.sin(t * 0.8) * 0.5);
    else if (m === 'formation') { if (!this.formation(e, dt)) go(1); }
    else if (m === 'drift') go(0.8, Math.sin(t * 1.7 + hy) * 0.9);
    else if (m === 'kite') { if (dist < rg[0]) go(-0.8); else if (dist > rg[1]) go(0.8); else go(0.5, (Math.PI / 2) * (Math.sin(t * 0.7 + hx) > 0 ? 1 : -1)); }
    else if (m === 'orbit') {
      const want = rg[0], radial = dist > want + 0.6 ? 0.7 : dist < want - 0.6 ? -0.7 : 0, tang = a + (Math.PI / 2) * (hx % 2 < 1 ? 1 : -1);
      this.moveCircle(e, (Math.cos(a) * radial + Math.cos(tang)) * spd * dt, (Math.sin(a) * radial + Math.sin(tang)) * spd * dt, 0.38);
    } else if (m === 'hop') {
      e.hopT = (e.hopT || 0) - dt;
      if (e.hopT <= 0) { e.hopT = D.hopCd || 1.1; e.hopA = sees ? a + (R() - 0.5) * 0.8 : flowA() ?? a; e.hopV = 0.32; }
      if (e.hopV > 0) { e.hopV -= dt; e.rfHop = true; this.moveCircle(e, Math.cos(e.hopA) * spd * 2.6 * dt, Math.sin(e.hopA) * spd * 2.6 * dt, 0.38); } else e.rfHop = false;
    } else if (m === 'swoop') { e.sw = (e.sw || 0) + dt; const per = D.per || 3.2; if (e.sw % per < per * 0.45) go(1.5, 0.3); else go(-1.1, 0.6); }
    else if (m === 'blink') {
      e.bt = (e.bt ?? 1 + R()) - dt;
      if (e.bt <= 0) {
        e.bt = D.blinkCd || 2.6;
        for (let k = 0; k < 14; k++) {
          const aa = R() * TAU, rr = 2.5 + R() * 2.5, x = p.x + Math.cos(aa) * rr, y = p.y + Math.sin(aa) * rr;
          if (!isSolid(this.map, x, y) && (!w || this.rfXe().roomOf(x, y) === w.room) && this.seesFoe({ x, y }, p)) {
            this.vx({ k: 'burst', ...liftA(e.x, e.y, 0.5), n: 8, colors: ['#ffffff', '#b888ff'] }); if (D.afterimage) (e.rfAfter = e.rfAfter || []).push([e.x, e.y, this.t + 0.8]); e.x = x; e.y = y; this.vx({ k: 'burst', ...liftA(x, y, 0.5), n: 10, colors: ['#ffffff', '#b888ff'] });
            break;
          }
        }
      }
    } else if (m === 'chess') {                                       // a game piece: it moves only on the beat, a piece's move, to stand its distance from you
      const E = this.map.rf && this.map.rf.E;
      if (e.to) {
        e.mv += dt * 5; const q = Math.min(1, e.mv);
        e.x = e.from[0] + (e.to[0] - e.from[0]) * q; e.y = e.from[1] + (e.to[1] - e.from[1]) * q;
        if (q >= 1) { e.to = null; if (D.land) { this.vx({ k: 'boom', ...liftO(e.x, e.y, 0.2), r: 1.1 }); if (Math.hypot(p.x - e.x, p.y - e.y) < 1.1) this.hurtPlayer(D.land, D.name); } }   // (the knight lands hard)
      } else if (E && E.onBeat && !(e.cm > E.t)) {
        e.cm = E.t + (D.every || 1) * (E.cfg.beat || 1) - 0.05;
        const opts = D.piece === 'knight' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
          : (D.piece === 'bishop' ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]]).flatMap(([x, y]) => [1, 2, 3].map((k) => [x * k, y * k]));
        let best = null, bd = 1e9;
        for (const [ox, oy] of opts) {
          const nx = Math.floor(e.x) + ox + 0.5, ny = Math.floor(e.y) + oy + 0.5;
          if (this.rfXe().solidMove(nx, ny) || (w && this.rfXe().roomOf(nx, ny) !== w.room)) continue;
          const dd = Math.abs(Math.hypot(p.x - nx, p.y - ny) - (D.chessKeep || 0));
          if (dd < bd) { bd = dd; best = [nx, ny]; }
        }
        if (best) { e.from = [e.x, e.y]; e.to = best; e.mv = 0; }
      }
    } else if (m === 'mirror') {                                      // your reflection across the middle of its room
      const r = w && this.map.rf.E.M.rooms[w.room];
      if (r) { const tx = 2 * r.cx + 1 - p.x, ty = p.y, q = Math.atan2(ty - e.y, tx - e.x), dd = Math.hypot(tx - e.x, ty - e.y), s = Math.min(dd * 5, (w ? w.spd : D.speed) * 1.4) * dt; if (dd > 0.15) this.moveCircle(e, Math.cos(q) * s, Math.sin(q) * s, 0.38); }
    } else if (m === 'burrow') {                                      // under the ground it can't be hurt; it comes up close by, strikes, dives again
      e.bt = (e.bt ?? 1.5) - dt;
      if (e.under) { go(1.1); if (e.bt <= 0 && dist < 3.4) { e.under = false; e.bt = D.up || 2.2; this.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ['#ffffff', '#8a7e6a'] }); } }
      else if (e.bt <= 0) { e.under = true; e.bt = D.down || 2.4; }
    } else return false;
    return true;
  },
  // the Rift's echo: shots from where it was a moment ago (their engine keeps its trail: E.ghosts)
  rfGhostfire(e, A) {
    const E = this.map.rf.E, h = (e.rfE && E.ghosts && E.ghosts.get(e.rfE)) || [], p = this.player;
    for (const [x, y] of h.slice(0, 2)) { const [ox, oy] = lift(x, y, 0.5); this.shoot('e', ox, oy, Math.atan2(p.y - 0.4 - oy, p.x - ox), A.speed, A.speed * 3, A.dmg, A.proj, 0.35, false, e.D.name); }
  },
  // the faint copies of a creature drawn beside it: a blinker's afterimage where it was, an echo's trailing bodies
  rfGhostsOf(e) {
    const out = [];
    if (e.rfAfter) { e.rfAfter = e.rfAfter.filter((q) => q[2] > this.t); for (const [x, y, u] of e.rfAfter) out.push([x, y, 0.5 * (u - this.t) / 0.8]); }
    if (e.D.echoBody && this.map.rf) { const h = (e.rfE && this.map.rf.E.ghosts && this.map.rf.E.ghosts.get(e.rfE)) || []; for (const [x, y] of h.slice(0, 2)) out.push([x, y, 0.22]); }
    return out;
  },
  // their summoners call their own kind into their rooms (their list: the room counts them), at most so many alive
  rfSummon(e, A) {
    const E = this.map.rf.E, w = e.rfE;
    if (!w) return;
    const live = E.en_.filter((o) => o.from === w && o.hp > 0).length;
    if (live >= A.max) return;
    const k = A.what.slice(`rf_${this.map.rf.id}_`.length);
    for (let q = 0; q < A.n; q++) {
      const sx = e.x + Math.cos(q * Math.PI + E.t) * 1.2, sy = e.y + Math.sin(q * Math.PI + E.t) * 1.2;
      if (this.rfXe().solidMove(sx, sy)) continue;
      const o = this.rfXe().mkEnemy({ k, x: sx, y: sy, room: w.room, aggro: true });
      o.from = w; o.summoned = 1; this.rfScale(o); E.en_.push(o);
      this.vx({ k: 'burst', ...this.rfLift(sx, sy), n: 8, colors: ['#ffffff', '#c9ccd8'] });
    }
  },
  // when a blow tells, by their dungeon's rule: the Glade's moon-spirits take 1.6 times it in a moonbeam and 0.12 out
  // of it; the Temple's sun things 1.3 by day and 0.12 by night (moon things the other way round), and its idol 1.5 just
  // after day and night turn, 0.08 otherwise. Under 1, it is faint to see (rfFaint)
  rfVulnK(e) {
    const E = this.map.rf && this.map.rf.E, v = e.D.rfVuln;
    if (!E) return 1;
    if (v === 'moon') return E.M.beams && E.M.beams.some((q) => Math.hypot(q.x - e.x, q.y - e.y) < q.r) ? 1.6 : 0.12;
    if (v === 'side') return (e.D.side === 'sun') === E.day ? 1.3 : 0.12;
    if (v === 'idol') return E.t - E.lastFlip < 1.2 ? 1.5 : 0.08;
    if (v === 'grove') {                                             // the Grove: nothing standing by its room's runes is hurt; wrath, 1.15
      const w = e.rfE, r = w && E.M.rooms[w.room];
      if (r && r.runes && r.runes.some(([x, y]) => Math.hypot(x + 0.5 - e.x, y + 0.5 - e.y) < 1.3)) return 0;
      return w && w.wrath ? 1.15 : 1;
    }
    if (v === 'cool') return e.rfOpenUntil > this.t ? 1 : 0.25;    // the Pyre's brute: cooled armour, open only just after it strikes
    if (v === 'shade') return this.rfShadow(e) ? 0.4 : 2;          // the Sanctum's shade: 2 in the sun, 0.4 in shadow
    if (v === 'stage') {                                            // the Stage: 1.6 while you stand in the spotlight
      const p = this.player, r = E.M.rooms[this.rfXe().roomOf(p.x, p.y)];
      return r && r.spot && Math.hypot(p.x - r.spot[0], p.y - r.spot[1]) < 2.2 ? 1.6 : 1;
    }
    return 1;
  },
  rfShadow(e) { const E = this.map.rf && this.map.rf.E; return !!(E && E.mod.shadow && E.mod.shadow(e.x, e.y)); },   // (the Sanctum's sun)
  rfFaint(e) { const v = e.D.rfVuln; return v === 'solar' ? (this.rfShadow(e) ? 0.45 : 1) : v === 'moon' && this.rfVulnK(e) < 1 ? 0.45 : v === 'side' && this.rfVulnK(e) < 1 ? 0.55 : 1; },
  // their dungeon's beat (some creatures strike only on it; some only on every other)
  rfOnBeat(A) { const E = this.map.rf && this.map.rf.E; return !!(E && E.onBeat && (A.parity == null || E.beat % 2 === A.parity)); },
  // their Hall of Mirrors: a monster's shot about to meet a mirror turns back once (as their bullet rule does)
  // and the Glade's still water: a monster's shot crossing it sends a reflection of itself back the other way, once;
  // and the Unmelting's crystals: a monster's shot through one splits in two, 0.4 either side
  rfMirror(b, dt) {
    const M = this.map.rf.E.M;
    if (this.map.rf.id === 'unmelting') {
      if ((b.rfAge = (b.rfAge || 0) + dt) < 0.15) return;
      for (const c of this.map.rf.E.en_) if (c.hp > 0 && (c.k === 'crystal' || c.k === 'diamond') && Math.hypot(c.x - b.x, c.y - (b.y + 0.3)) < 0.55) {
        b.refl = 1;
        const s = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx);
        for (const o of [-0.4, 0.4]) { const n = this.shoot('e', b.x, b.y, a + o, s, s * b.life, b.dmg, b.sprite, b.r, false, b.by); if (n) n.refl = 1; }
        return;
      }
      return;
    }
    if (this.map.rf.id === 'glade' && this.rfXe().tileAt(b.x, b.y + 0.3) === this.rfXe().C.DEEP) {
      b.refl = 1;
      const s = Math.hypot(b.vx, b.vy), n = this.shoot('e', b.x, b.y, Math.atan2(-b.vy, b.vx), s, s * b.life, b.dmg, b.sprite, b.r, false, b.by);
      if (n) n.refl = 1;
      return;
    }
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
    const o = this.rfXe().mkEnemy({ k: c.k, x: c.x, y: c.y, room: c.room, aggro: true });
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
      m.solid[k] = this.rfXe().BM[t[k]] && !(t[k] === this.rfXe().C.DEEP && M.deepWalk) ? 1 : og && og[k] > 0 ? 1 : 0;
    }
  },
  // one frame of their dungeon around our player
  rfUpdate(dt) {
    const m = this.map, R = m.rf, E = R.E, p = this.player, ep = E.p;
    if (!ep) return;
    const served = !!m.netWorld;                                   // (the server runs its creatures: yours stand still, unseen)
    ep.x = p.x; ep.y = p.y; ep.hp = p.hp;
    const bx = ep.x, by = ep.y;
    if (served) { for (const e of E.en_) if (!e.ours) e.ours = NET_HELD; }
    else this.rfLinkIn();
    this.rfXe().tick(dt);
    if (!served) this.rfLinkOut();
    if (ep.noRegen > E.t) p.noRegenUntil = Math.max(p.noRegenUntil || 0, this.t + (ep.noRegen - E.t));   // their sickness: no regeneration a while
    if (ep.x !== bx || ep.y !== by) { p.x = ep.x; p.y = ep.y; this.unstick(p); }   // their portals, a collapsing floor, a push
    for (const e of E.en_) this.rfScale(e);
    if (!served) this.rfTheirsTick(dt);
    if ((R.tick = (R.tick || 0) + 1) % 3 === 0 || E.ogDirty === 0) this.rfSync(m);
    if (E.pots > R.pots) { for (let k = R.pots; k < E.pots; k++) this.rfPotion(); }
    R.pots = E.pots;
    if (E.banner && E.banner !== R.banner && !this.rfServe) { R.banner = E.banner; this.banner(E.banner.t, 2200, false); }
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
      if (!o || e.hp <= 0 || o.rfHold) continue;
      if (o.dead) { e.rfByOurs = 1; this.rfXe().kill(e); continue; }       // our blow: their kill (its key, its corpse, its room)
      e.x = o.x; e.y = o.y; e.hp = o.hp; e.aggro = true; e.rfAt = [e.x, e.y]; e.rfHp = e.hp;
      o.rfForged = !!e.forged; o.rfWrath = !!e.wrath;                // (for the wire: a smith at its anvil, the Grove's wrath)
      if (e.wrath && !o.rfWrath) { o.rfWrath = 1; o.cds = o.cds.map((c) => c * 0.5); }   // the Grove's wrath: its next blows come sooner (its pace, theirs: e.spd)
    }
  },
  // after their frame: what their world did to it (a push, a trap, a portal) reaches ours; and the newly woken go over
  rfLinkOut() {
    const m = this.map, E = m.rf.E, dg = m.rf.id;
    for (const e of E.en_) {
      let o = e.ours;
      const id = `rf_${dg}_${e.k}`, fights = e.hp > 0 && e.aggro && !e.dormant && !e.hidden && e.st !== 'gone' && LINK_DG.has(dg) && OURS.has(id) && !KEEP_THEIRS.has(id);
      if (!o && e.hp > 0 && e.st !== 'gone' && (fights || (this.rfServe && ENEMIES[id]))) {   // ours, or (a server) a stand-in everyone sees while it is still theirs
        o = this.addEnemy(id, e.x, e.y);
        o.hp = e.hp; o.maxHp = e.max; o.seen = true; o.rfE = e; o.squad = e.squad; o.rfSid = e.rfSid; e.ours = o;
        o.rfHold = !fights;
        if (fights) o.cds = o.D.attacks.map((A) => A.cd * (0.4 + Math.random() * 0.8));   // (their first cooldowns)
        continue;
      }
      if (!o) continue;
      if (o.rfHold) {                                             // a stand-in: where theirs is, how it is; ours once it wakes to fight
        o.x = e.x; o.y = e.y; o.maxHp = e.max; o.under = !!e.hidden; o.rfDormant = !!e.dormant;
        if (e.hp <= 0) { if (!o.dead) { o.dead = true; o.deadT = 0; o.hp = 0; } continue; }
        o.hp = e.hp;
        if (fights) { o.rfHold = false; o.rfDormant = false; o.cds = o.D.attacks.map((A) => A.cd * (0.4 + Math.random() * 0.8)); }
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
  // a shared dungeon's tiles as the server has them: a gate, a secret or a breakable wall it opened opens in your copy
  // too (what moves or toggles on its own keeps your copy's own time)
  rfNetTiles(list) {
    const M = this.map, E = M.rf.E, X = this.rfXe(), C = X.C, SHUT = new Set([C.GATE, C.SECRET, C.BREAK]);
    const name = RF_NAME || (RF_NAME = Object.fromEntries(Object.entries(TID).map(([k, v]) => [v, k])));
    for (const [i, tid] of list) {
      const code = RF_CODE_TILE.indexOf(name[tid]), here = E.M.t[i];
      if (code >= 0 && code !== here && SHUT.has(here) && !X.BM[code]) X.setTile(i % E.M.W, Math.floor(i / E.M.W), code);
    }
  },
  // the server says one of the creatures fell: your copy of the dungeon counts it (its room, key and gate follow)
  rfNetDeath(sid, mine) {
    const M = this.map, E = M.rf && M.rf.E;
    if (!E) return;
    (M.netRfDead || (M.netRfDead = new Set())).add(sid);
    const e = E.en_.find((q) => q.rfSid === sid && q.hp > 0);
    if (e) { e.rfByOurs = 1; e.rfNetNoLoot = !mine; this.rfXe().kill(e); }
  },
  // a blow on a server's stand-in for one still theirs: their rules take it (it wakes, its weakness, its death)
  rfHoldHit(o, dmg) {
    const e = o.rfE, h0 = e.hp;
    this.rfXe().damageEnemy(e, Math.round(dmg), { x: e.x, y: e.y });
    o.hp = Math.max(0, e.hp);
    if (e.hp <= 0 && !o.dead) { o.dead = true; o.deadT = 0; }
    return Math.max(0, h0 - Math.max(0, e.hp));
  },
  // what the ground does to you: ice slides you, liquid slows and may hurt, conveyors, winds and currents push
  rfGround(p, ground, dt, mod) {
    const P = this.player, C = this.rfXe().C, M = this.map.rf.E.M;
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
    if (e.rfNetNoLoot) return;                                  // (a shared dungeon: one you didn't fight leaves you nothing)
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
        this.rfXe().damageEnemy(nx, Math.round(b.dmg * sp.chain.f), { x: nx.x, y: nx.y }); from = nx;
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
      if (e.rfDot && e.rfDot.t > t) { e.rfDot.acc += dt; if (e.rfDot.acc >= 0.5) { e.rfDot.acc -= 0.5; this.rfXe().damageEnemy(e, Math.round(e.rfDot.dps * 0.5), { x: e.x, y: e.y }); this.float(...lift(e.x, e.y, 1.2), `${Math.round(e.rfDot.dps * 0.5)}`, '#ff9a5a'); } }
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
    this.rfXe().damageEnemy(e, Math.round(dmg), { x: e.x, y: e.y });
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
        this.rfXe().damageEnemy(e, dmg, { x: e.x, y: e.y });
        const dealt = Math.max(0, hp0 - Math.max(0, e.hp));
        if (dealt) { this.float(...lift(e.x, e.y, 1.2), `${Math.round(dealt)}`, '#ff5050'); this.rfOnHitTheirs(e, b, dealt); }
        return !b.pierce;
      }
    }
    return false;
  },
};
export function installRF(Game) { Object.assign(Game.prototype, methods); }
