// Multiplayer stage 2, milestone 1: the shared realm's monsters live here, on the server. The server runs the game's
// own code (src/game.js) for the realm: monsters spawn, wander, hunt and fire as they always have, each hunting the
// nearest player. Browsers send where their players are and what their shots did; this sends back the monsters (where
// they are, how hurt), every shot they fire, their ground zones and effects, and who dealt the blows when one dies.
// Each browser then dodges, gets hit and is rewarded (XP, loot, quests) by its own rules, RotMG-style.
//   makeWorld(seed, send) -> { join, leave, player, hit, tick }      (server/server.mjs drives it)
import { readFileSync } from 'node:fs';
const { allowHit } = await import('./guard.mjs');
globalThis.localStorage ??= { getItem: () => null, setItem() {} };
const ROOT = new URL('../', import.meta.url);
const { buildRegistry } = await import(new URL('src/registry.js', ROOT));
const { Game } = await import(new URL('src/game.js', ROOT));
const { realm } = await import(new URL('src/world/maps.js', ROOT));
const { REALM_BOSSES } = await import(new URL('src/data/enemies.js', ROOT));
// the Realmforge bosses on the three-phase engine (src/bosses/rf_translate.js): the server knows them too
{ const { addRfBosses } = await import(new URL('src/bosses/rf_translate.js', ROOT)); addRfBosses(JSON.parse(readFileSync(new URL('art/rf/data.json', ROOT), 'utf8'))); }
const { ITEMS, bagFor } = await import(new URL('src/data/items.js', ROOT));
const isBrown = (id) => { try { return bagFor([ITEMS[id]]) === 'brown'; } catch { return false; } };
// the admin commands that make or end monsters: in a shared place the server runs them, so everyone has the same ones
export const WORLD_CMDS = new Set(['spawn', 'bx', 'boss', 'kraken', 'treant', 'star', 'melon', 'event', 'progress', 'killall', 'kill', 'clear']);
const J = (q) => JSON.parse(readFileSync(new URL('art/bundle/' + q, ROOT), 'utf8')), idx = J('index.json');
const reg = buildRegistry(idx.atlases.map((a) => ({ pack: a.split('/')[0], json: J(a) })), J(idx.hover), (q) => q);

const SEND_R = 32;                   // a monster is sent to a player within this many tiles
const SKIP = new Set(['D', 'cds', 'queue', 'kids', 'parent', 'bx', 'ow', 'owOf', 'shieldBy', 'thrallOf', 'cloneOf', 'hit', 'netHitBy', 'netSent', 'lastSent', 'tether', 'kidsOf', 'S', 'mirror']);
// a monster's state for the wire: its plain fields (numbers, words, flags), not its links to other things
function plain(o) {
  const out = {};
  for (const k in o) { if (SKIP.has(k)) continue; const v = o[k]; const t = typeof v; if (t === 'number') out[k] = Math.round(v * 100) / 100; else if (t === 'string' || t === 'boolean') out[k] = v; }
  const B = o.bx;                    // a three-phase boss: its phase, its state and the clip it is playing
  if (B) { out.bx_phase = B.phase; out.bx_state = B.state; if (B.anim) { out.bx_clip = B.anim.clip; out.bx_spd = B.anim.speed; } if (B.leapZ) out.bx_leapZ = Math.round(B.leapZ); if (B.drawK) out.bx_drawK = Math.round(B.drawK * 100) / 100; }
  return out;
}
// a monster's kind, once, for the wire (data only: no functions, no loops)
function safe(o) { const seen = new WeakSet(); return JSON.parse(JSON.stringify(o, (k, v) => { if (typeof v === 'object' && v) { if (seen.has(v)) return undefined; seen.add(v); } return typeof v === 'function' ? undefined : v; })); }
const Dcache = new WeakMap(), Dof = (D) => { let x = Dcache.get(D); if (!x) Dcache.set(D, (x = safe(D))); return x; };
// a shot or a ground zone for the wire: plain data; a monster it points at goes as that monster's number
function shotJSON(b) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(b, (k, v) => {
    if (k === 'hit' || k === 'netSent' || k === 'owner') return undefined;
    if (typeof v === 'function') return undefined;
    if (v && typeof v === 'object') { if (k && v.D && v.hp !== undefined) return v.nid || undefined; if (seen.has(v)) return undefined; seen.add(v); }
    return v;
  }));
}

export function makeWorld(seed, send, where = 'realm') {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.save = { ...g.save };
  if (where === 'realm') { g.realmMap = realm(seed); g.enter('realm'); }
  else g.enter(where, { seed });                // a shared dungeon: the same seed as every player's copy
  g.god = true;
  const M0 = g.map, dung = M0.kind === 'dungeon';
  // a dungeon's changes since it was made (gates, broken walls; chests, levers), for those inside and latecomers
  const baseT = dung ? M0.tiles.slice() : null, objKey = (o) => o.interact || o.sprite || '';
  const OBJ = (o) => { const f = {}; for (const k in o) { const v = o[k]; if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') f[k] = v; } return f; };
  const baseO = dung ? M0.objects.map((o) => JSON.stringify(OBJ(o))) : null, sentO = dung ? baseO.slice() : null;
  const dTiles = new Map(), dObjs = new Map();
  let lastEmpty = Date.now();
  const anchor = g.player;             // the server's own stand-in (never hunted, never hurt): the players are proxies
  const P = new Map();                 // client id -> proxy (a player-shaped object over the anchor, so any field reads)
  const log = { tiles: [], objs: [] }; // the land as events changed it (an arena raised, trees grown): for latecomers too
  const ev0 = g.evSet.bind(g);
  g.evSet = function (x, y, tid, skin = 0) { ev0(x, y, tid, skin); const a = [x, y, tid, skin]; log.tiles.push(a); out.push({ k: 'tile', a }); };
  g.netTargets = [];
  let nid = 0, out = [];               // events this tick: shots, zones, effects, hurts
  let sid = 0;                          // every monster shot's number, so a shot this world steers can be followed
  const steered = new Map();            // shot -> where it was (a shot moved by a boss, not by its own speed)
  // what the world does, caught for the players
  const hurt0 = g.hurtPlayer.bind(g);
  g.hurtPlayer = function (d, by, ap) { if (this.player !== anchor && this.player.netId) send(this.player.netId, { t: 'hurt', d: Math.round(d), by: String(by || ''), ap: !!ap }); else if (this.player === anchor) return; else hurt0(d, by, ap); };
  const vx0 = g.vx.bind(g), VX = new Set(['burst', 'boom', 'shake', 'heal', 'regfx', 'zap', 'spray', 'ring', 'glyph']);
  g.vx = function (v) { if (VX.has(v.k) && !v.e) out.push({ k: 'vx', v }); return vx0(v); };
  const banner0 = g.banner.bind(g);
  g.banner = function (text, ms, ...r) { out.push({ k: 'banner', text: String(text), ms }); return banner0(text, ms, ...r); };
  g.say = function () {};             // (the server's own chat goes nowhere)
  // lighter for a small server: no chest prompts for the stand-in; the slow clocks (events, the melon, quirks) once a
  // second with the time they missed
  g.openChests = function () {};
  // the Drowned Forge's old-style boss (this.boss): it thinks about the nearest player too
  const ub0 = g.updateBoss.bind(g);
  g.updateBoss = function (dt) { const q = this.boss && nearest(this.boss); if (!q) return ub0(dt); this.player = q; try { return ub0(dt); } finally { this.player = anchor; } };
  // loot: the world's roll keeps only what goes in a brown bag, and that lies in a public bag for all here (server.mjs);
  // everything finer, each player who fought it rolls for themselves (their own bag)
  let onBag = null;
  g.addBag = function (x, y, items) { const brown = (items || []).filter(isBrown); if (brown.length && onBag) onBag(x, y, brown); return { x, y, items: Array(8).fill(null), kind: 'brown' }; };
  const add0 = g.addEnemy.bind(g);                                 // a new monster joins the server's short list at once
  g.addEnemy = function (...a) { const e = add0(...a); (this.netNew = this.netNew || []).push(e); return e; };
  g.updateWorld = ((f) => function (dt) { const o = this.map.objects; this.map.objects = []; try { return f.call(this, dt); } finally { this.map.objects = o; } })(g.updateWorld);   // (no town objects to walk up to)
  for (const k of ['melonTick', 'eventClock', 'updateQuirks']) {
    const f = g[k]; if (typeof f !== 'function') continue;
    let acc = 0; g[k] = function (dt, ...r) { acc += dt || 0; if (acc < 1) return; const d = acc; acc = 0; return f.call(this, d, ...r); };
  }

  function nearest(e) {
    let best = null, bd = 1e9;
    for (const q of g.netTargets) { if (q.dead) continue; const d = (q.x - e.x) ** 2 + (q.y - e.y) ** 2; if (d < bd) { bd = d; best = q; } }
    return best;
  }
  g.netNearest = nearest;

  return {
    seed, _g: g,                       // (_g: the world itself, for tests and admin)
    set onBag(f) { onBag = f; },       // where its public loot goes
    get count() { return P.size; },
    join(id, name, admin = false) {
      const q = Object.create(anchor);
      Object.assign(q, { netId: id, name, admin, x: anchor.x, y: anchor.y, dead: false, status: {}, hp: 1, net: { seen: new Set(), last: new Map() } });
      P.set(id, q); g.netTargets = [...P.values()];
      if (log.tiles.length || log.objs.length) send(id, { t: 'wlog', tiles: log.tiles, objs: log.objs });
      if (dung && (dTiles.size || dObjs.size)) send(id, { t: 'dlog', tiles: [...dTiles.values()], objs: [...dObjs.values()] });
    },
    // a player's blow on something breakable (a chest, an urn, a crate, a weak wall, a spore pod): the world takes it,
    // as that player; everyone sees what changed; a chest that breaks gives each who hit it their own loot
    ohit(id, i, k, d) {
      const q = P.get(id), o = g.map.objects[i];
      if (!q || !o || objKey(o) !== k || Math.hypot(o.x - q.x, o.y - q.y) > 14 || !(d > 0)) return;
      (o.netHit || (o.netHit = new Set())).add(id);
      const was = !!o.opened;
      if (o.guards && o.guards.some((e) => !e.dead)) { send(id, { t: 'ofloat', i, k, text: 'GUARDED' }); return; }
      g.player = q; try { g.hitObject(o.x, o.y, Math.min(d, 12000)); } catch (err) { console.warn('ohit', k, err.message); } finally { g.player = anchor; }
      const f = OBJ(o); out.push({ k: 'ostate', i, key: k, f, x: o.x, y: o.y });
      if (!was && o.opened && o.interact === 'chest') for (const h of o.netHit) send(h, { t: 'oopen', i, k });
    },
    // a player used something here (a lever, a door, a chest): the world uses it too, for everyone
    use(id, i, k) {
      const q = P.get(id), o = g.map.objects[i];
      if (!q || !o || objKey(o) !== k || Math.hypot(o.x - q.x, o.y - q.y) > 3) return;
      g.player = q; try { g.interact(o); } catch (err) { console.warn('use', k, err.message); } finally { g.player = anchor; }
    },
    get idleMs() { return P.size ? 0 : Date.now() - lastEmpty; },
    // an admin's spawning command, run in this world round them (/spawn, /bx, /boss, /kraken, ...): what it said
    adminCmd(id, line) {
      const q = P.get(id), said = [];
      if (!q) return said;
      const [cmd, a0] = line.trim().slice(1).split(/\s+/), c = (cmd || '').toLowerCase();
      if (!WORLD_CMDS.has(c)) return ['Not a world command.'];
      if (c === 'boss') { const id2 = ({ emily: 'emily_the_yapper', penguin: 'emily_the_yapper' })[a0] || a0; if (id2 && !REALM_BOSSES[id2]) return ['Dungeon bosses: use /boss away from the shared world (it takes you to them).']; }
      const say0 = g.say, x0 = q.x, y0 = q.y; g.say = (t) => said.push(String(t)); g.player = q;
      try { g.command(line); } catch (err) { said.push('That failed: ' + err.message); } finally { g.player = anchor; g.say = say0; }
      if (Math.hypot(q.x - x0, q.y - y0) > 3) send(id, { t: 'moveto', x: q.x, y: q.y });   // (a command that puts you somewhere: the Kraken's edge)
      return said;
    },
    // monsters an admin brings (/chickens): shared, round a spot
    spawn(id, x, y, n) {
      for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 3; const e = g.addEnemy(id, x + Math.cos(a) * d, y + Math.sin(a) * d); e.seen = true; }
    },
    // a player's effect on a monster: held still, slowed, knocked about (each within reason)
    efx(id, list) {
      const q = P.get(id);
      if (!q) return;
      for (const [eid, k, a, b] of list) {
        const e = g.enemies.find((o) => o.nid === eid);
        if (!e || e.dead || Math.hypot(e.x - q.x, e.y - q.y) > 20) continue;
        if (k === 'stun') { g.player = q; try { g.stun(e, Math.min(3, a)); } finally { g.player = anchor; } }
        else if (k === 'slow' && !e.rb) { e.slowT = Math.max(e.slowT || 0, Math.min(5, a)); e.slowF = Math.max(e.slowF || 0, Math.min(0.8, b)); }
        else if (k === 'push' && !e.rb) { const n = Math.hypot(a, b), s = n > 2 ? 2 / n : 1; g.moveCircle(e, a * s, b * s, 0.35); }
      }
    },
    leave(id) { P.delete(id); g.netTargets = [...P.values()]; if (!P.size) lastEmpty = Date.now(); },
    player(id, s) { const q = P.get(id); if (q) { q.x = s.x; q.y = s.y; q.dead = !!s.dead; q.hp = s.hp; } },
    // a player's shot (or ability) took d off a monster: the server's tally, and its death if it falls
    hit(id, eid, d) {
      const q = P.get(id), e = g.enemies.find((o) => o.nid === eid) || (g.boss && g.boss.nid === eid ? g.boss : null);
      if (!q || !e || e.dead || e.state === 'dead' || !(d > 0)) return;
      if (Math.hypot(e.x - q.x, e.y - q.y) > 20) return;             // (out of reach: ignored)
      d = Math.min(d, Math.max(5000, e.maxHp * 0.25));             // (no one blow takes more than a quarter, or 5000)
      d = allowHit(q, d);                                           // (nor more than a player can deal: server/guard.mjs)
      if (!(d > 0)) return;
      (e.netHitBy || (e.netHitBy = new Set())).add(id);
      // through the game's own damage step (immunity, a three-phase boss's phases and morphs, survive phases, its death),
      // as that player; their browser already took the Defense off
      g.player = q; e.netRawHit = true;
      try { g.damageEnemy(e, d, e.x, e.y, true); } finally { e.netRawHit = false; g.player = anchor; }
    },
    tick(dt, sendNow) {
      if (!P.size) return;
      // the world's bookkeeping happens round a player: take turns
      const list = [...P.values()].filter((q) => !q.dead), at = list[Math.floor(g.t * 2) % Math.max(1, list.length)];
      if (at) { anchor.x = at.x; anchor.y = at.y; }
      const seenShots = new Set(g.projectiles), seenFx = new Set(g.fx), seenBub = new Set(g.bubbles || []), objN = g.map.objects.length;
      g.update(dt);
      anchor.hp = 1e9; anchor.dead = false; g.mode = 'play';
      for (const e of g.enemies) if (!e.nid) e.nid = ++nid;
      const UB = g.boss; if (UB && !UB.nid) UB.nid = ++nid;
      if (UB && UB.state === 'dead' && !UB.netGone) {                       // the old-style boss falls: rewards for those who hit it, the way out for all
        UB.netGone = true;
        for (const q of P.values()) send(q.netId, { t: 'bossdead', nid: UB.nid, credit: !!(UB.netHitBy && UB.netHitBy.has(q.netId)) });
        out.push({ k: 'exit', x: UB.x, y: UB.y, name: 'The Unstruck' });
      }
      if (dung) for (const e of g.enemies) if (e.rb && e.dead && !e.netExit) { e.netExit = true; out.push({ k: 'exit', x: e.x, y: e.y, name: e.D.name }); }   // its master falls: a way out for all
      for (let i = objN; i < g.map.objects.length; i++) { const j = safe(g.map.objects[i]); log.objs.push(j); out.push({ k: 'obj', o: j }); }   // (things the world added this tick)
      if (g.bags && g.bags.length > 40) g.bags.length = 0;                       // (the server's own loot: nobody's)
      // shots a boss holds and moves itself (set pieces, orbits): where they are, until they fly free; and their end
      const live = new Set(g.projectiles);
      for (const [b, at] of steered) {
        if (!live.has(b) || b.life <= 0) { out.push({ k: 'sg', sid: b.sid, x: b.x, y: b.y }); steered.delete(b); continue; }
        if (Math.abs(b.x - at.x) > 0.02 || Math.abs(b.y - at.y) > 0.02 || b.vx !== at.vx || b.vy !== at.vy) {
          const free = !b.ctl && !b.orc && !b.asSpiral && !b.asOrb && !b.toBoss;
          out.push({ k: 'su', sid: b.sid, x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, ...(free ? { vx: b.vx, vy: b.vy, a: b.a, life: b.life } : {}) });
          if (free) steered.delete(b); else steered.set(b, { x: b.x, y: b.y, vx: b.vx, vy: b.vy });
        }
      }
      for (const b of g.projectiles) if (!seenShots.has(b) && b.from === 'e') {
        b.sid = ++sid;
        const held = !!(b.ctl || b.orc || b.asSpiral || b.asOrb || b.toBoss);
        if (held) steered.set(b, { x: b.x, y: b.y, vx: b.vx, vy: b.vy });
        const j = shotJSON(b); if (held) j.netHeld = true;
        out.push({ k: 'shot', b: j });
      }
      for (const f of g.fx) if (!seenFx.has(f) && f.kind) out.push({ k: 'fx', f: shotJSON(f) });
      for (const b of g.bubbles || []) if (!seenBub.has(b) && b.e && b.e.nid) out.push({ k: 'say', id: b.e.nid, text: b.text, col: b.col });
      if (dung && sendNow && Math.floor(g.t * 10) % 3 === 0) {          // a dungeon's changes, about three times a second
        const T = g.map.tiles, nt = [], no = [];
        for (let i = 0; i < T.length; i++) if (T[i] !== baseT[i] && (!dTiles.has(i) || dTiles.get(i)[1] !== T[i])) { const a = [i, T[i], g.map.solid ? g.map.solid[i] : 0]; dTiles.set(i, a); nt.push(a); }
        g.map.objects.forEach((o, i) => { if (i >= sentO.length) return; const j = JSON.stringify(OBJ(o)); if (j !== sentO[i]) { sentO[i] = j; const a = [i, objKey(o), OBJ(o)]; dObjs.set(i, a); no.push(a); } });
        if (nt.length || no.length) for (const q of P.values()) send(q.netId, { t: 'dlog', tiles: nt, objs: no });
      }
      const ev = out; out = [];
      // to each player: the events near them, and (10 a second) the monsters near them
      for (const q of P.values()) {
        const near = (x, y, r = SEND_R) => Math.abs(x - q.x) < r && Math.abs(y - q.y) < r;
        const mine = ev.filter((x) => (x.k === 'ostate' && near(x.x, x.y, 40)) || x.k === 'su' || x.k === 'sg' || x.k === 'banner' || x.k === 'tile' || x.k === 'obj' || x.k === 'exit' || (x.k === 'shot' && near(x.b.x, x.b.y)) || (x.k === 'fx' && near(x.f.x ?? x.f.x0, x.f.y ?? x.f.y0)) || (x.k === 'vx' && near(x.v.x ?? q.x, x.v.y ?? q.y)) || x.k === 'say');
        if (mine.length) send(q.netId, { t: 'wev', ev: mine });
        if (!sendNow) continue;
        const es = [], gone = [];
        for (const e of g.enemies) {
          const inRange = near(e.x, e.y);
          const was = q.net.seen.has(e.nid);
          if (e.dead || !inRange) { if (was) { gone.push([e.nid, e.dead ? (e.netHitBy && e.netHitBy.has(q.netId) ? 1 : 0) : -1]); q.net.seen.delete(e.nid); q.net.last.delete(e.nid); } continue; }
          const s = plain(e), L = q.net.last.get(e.nid);
          if (!was) { q.net.seen.add(e.nid); q.net.last.set(e.nid, s); es.push({ ...s, D: Dof(e.D) }); continue; }   // first sight: all of it, and what it is
          const dlt = { nid: e.nid };                                                    // after that: only what changed
          let n = 0;
          for (const k in s) if (s[k] !== L[k]) { dlt[k] = s[k]; n++; }
          if (n) { es.push(dlt); q.net.last.set(e.nid, s); }
        }
        let boss;
        if (UB && !UB.netGone && near(UB.x, UB.y, 48)) {                        // the old-style boss: what changed
          const s = plain(UB), L = q.net.lastBoss || {}; boss = { nid: UB.nid };
          for (const k in s) if (s[k] !== L[k]) boss[k] = s[k];
          q.net.lastBoss = s;
        }
        if (es.length || gone.length || boss) send(q.netId, { t: 'ws', T: Math.round(g.t * 1000) / 1000, es, gone, ...(boss ? { boss } : {}) });
      }
    },
  };
}
