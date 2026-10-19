// Multiplayer stage 2, milestone 1: the shared realm's monsters live here, on the server. The server runs the game's
// own code (src/game.js) for the realm: monsters spawn, wander, hunt and fire as they always have, each hunting the
// nearest player. Browsers send where their players are and what their shots did; this sends back the monsters (where
// they are, how hurt), every shot they fire, their ground zones and effects, and who dealt the blows when one dies.
// Each browser then dodges, gets hit and is rewarded (XP, loot, quests) by its own rules, RotMG-style.
//   makeWorld(seed, send) -> { join, leave, player, hit, tick }      (server/server.mjs drives it)
import { readFileSync } from 'node:fs';
globalThis.localStorage ??= { getItem: () => null, setItem() {} };
const ROOT = new URL('../', import.meta.url);
const { buildRegistry } = await import(new URL('src/registry.js', ROOT));
const { Game } = await import(new URL('src/game.js', ROOT));
const { realm } = await import(new URL('src/world/maps.js', ROOT));
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

export function makeWorld(seed, send) {
  const g = new Game({ reg }, { fame: 0, gold: 0, essence: 0, vaults: [[]], graveyard: [], chars: [], slots: 8, bestLevel: 0 });
  g.newCharacter('priest'); g.persist = () => {}; g.save = { ...g.save };
  g.realmMap = realm(seed); g.enter('realm'); g.god = true;
  const anchor = g.player;             // the server's own stand-in (never hunted, never hurt): the players are proxies
  const P = new Map();                 // client id -> proxy (a player-shaped object over the anchor, so any field reads)
  const log = { tiles: [], objs: [] }; // the land as events changed it (an arena raised, trees grown): for latecomers too
  const ev0 = g.evSet.bind(g);
  g.evSet = function (x, y, tid, skin = 0) { ev0(x, y, tid, skin); const a = [x, y, tid, skin]; log.tiles.push(a); out.push({ k: 'tile', a }); };
  g.netTargets = [];
  let nid = 0, out = [];               // events this tick: shots, zones, effects, hurts
  // what the world does, caught for the players
  const hurt0 = g.hurtPlayer.bind(g);
  g.hurtPlayer = function (d, by, ap) { if (this.player !== anchor && this.player.netId) send(this.player.netId, { t: 'hurt', d: Math.round(d), by: String(by || ''), ap: !!ap }); else if (this.player === anchor) return; else hurt0(d, by, ap); };
  const vx0 = g.vx.bind(g), VX = new Set(['burst', 'boom', 'shake', 'heal', 'regfx', 'zap', 'spray', 'ring', 'glyph']);
  g.vx = function (v) { if (VX.has(v.k) && !v.e) out.push({ k: 'vx', v }); return vx0(v); };
  const banner0 = g.banner.bind(g);
  g.banner = function (text, ms, ...r) { out.push({ k: 'banner', text: String(text), ms }); return banner0(text, ms, ...r); };
  g.say = function () {};             // (the server's own chat goes nowhere)

  function nearest(e) {
    let best = null, bd = 1e9;
    for (const q of g.netTargets) { if (q.dead) continue; const d = (q.x - e.x) ** 2 + (q.y - e.y) ** 2; if (d < bd) { bd = d; best = q; } }
    return best;
  }
  g.netNearest = nearest;

  return {
    seed, _g: g,                       // (_g: the world itself, for tests and admin)
    get count() { return P.size; },
    join(id, name) {
      const q = Object.create(anchor);
      Object.assign(q, { netId: id, name, x: anchor.x, y: anchor.y, dead: false, status: {}, hp: 1, net: { seen: new Set(), last: new Map() } });
      P.set(id, q); g.netTargets = [...P.values()];
      if (log.tiles.length || log.objs.length) send(id, { t: 'wlog', tiles: log.tiles, objs: log.objs });
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
    leave(id) { P.delete(id); g.netTargets = [...P.values()]; },
    player(id, s) { const q = P.get(id); if (q) { q.x = s.x; q.y = s.y; q.dead = !!s.dead; q.hp = s.hp; } },
    // a player's shot (or ability) took d off a monster: the server's tally, and its death if it falls
    hit(id, eid, d) {
      const q = P.get(id), e = g.enemies.find((o) => o.nid === eid);
      if (!q || !e || e.dead || !(d > 0)) return;
      if (Math.hypot(e.x - q.x, e.y - q.y) > 20) return;             // (out of reach: ignored)
      d = Math.min(d, Math.max(5000, e.maxHp * 0.25));             // (no one blow takes more than a quarter, or 5000)
      (e.netHitBy || (e.netHitBy = new Set())).add(id);
      e.hp -= d;
      if (e.hp <= 0) { g.player = q; try { e.hp = 1; g.damageEnemy(e, 1e9, e.x, e.y, true); } finally { g.player = anchor; } }
    },
    tick(dt, sendNow) {
      if (!P.size) return;
      // the world's bookkeeping happens round a player: take turns
      const list = [...P.values()].filter((q) => !q.dead), at = list[Math.floor(g.t * 2) % Math.max(1, list.length)];
      if (at) { anchor.x = at.x; anchor.y = at.y; }
      const seenShots = new Set(g.projectiles), seenFx = new Set(g.fx), seenBub = new Set(g.bubbles || []), seenObj = new Set(g.map.objects);
      g.update(dt);
      anchor.hp = 1e9; anchor.dead = false; g.mode = 'play';
      for (const e of g.enemies) if (!e.nid) e.nid = ++nid;
      for (const o of g.map.objects) if (!seenObj.has(o)) { const j = safe(o); log.objs.push(j); out.push({ k: 'obj', o: j }); }
      if (g.bags && g.bags.length > 40) g.bags.length = 0;                       // (the server's own loot: nobody's)
      for (const b of g.projectiles) if (!seenShots.has(b) && b.from === 'e') out.push({ k: 'shot', b: shotJSON(b) });
      for (const f of g.fx) if (!seenFx.has(f) && f.kind) out.push({ k: 'fx', f: shotJSON(f) });
      for (const b of g.bubbles || []) if (!seenBub.has(b) && b.e && b.e.nid) out.push({ k: 'say', id: b.e.nid, text: b.text, col: b.col });
      const ev = out; out = [];
      // to each player: the events near them, and (10 a second) the monsters near them
      for (const q of P.values()) {
        const near = (x, y, r = SEND_R) => Math.abs(x - q.x) < r && Math.abs(y - q.y) < r;
        const mine = ev.filter((x) => x.k === 'banner' || x.k === 'tile' || x.k === 'obj' || (x.k === 'shot' && near(x.b.x, x.b.y)) || (x.k === 'fx' && near(x.f.x, x.f.y)) || (x.k === 'vx' && near(x.v.x ?? q.x, x.v.y ?? q.y)) || x.k === 'say');
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
        if (es.length || gone.length) send(q.netId, { t: 'ws', T: Math.round(g.t * 1000) / 1000, es, gone });
      }
    },
  };
}
