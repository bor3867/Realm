// Melon Realms' multiplayer server, stage 1: players see each other. Every browser sends its player's state (where it
// is, which way it faces, what it is doing) and the shots it fires; the server passes them on to everyone else in the
// same place (the Nexus, the shared realm). Monsters, loot and saves stay in each browser for now. One realm seed for
// everyone, so all players walk the same land. Plain Node, no packages: a small WebSocket server of its own.
//   node server/server.mjs            (PORT from the environment, else 8787)
import { createServer } from 'node:http';
import { createHash, randomInt } from 'node:crypto';

const PORT = +process.env.PORT || 8787;
let SEED = (+process.env.REALM_SEED || randomInt(1, 0xffffff)) | 1;   // the shared realm (a new one each start)
const LIMIT = { msg: 65536, name: 16, chat: 200, perSec: 40 };           // what one player may send
const ROOM = /^(nexus|realm:\d+)$/;                                        // the places players share (stage 1)
const CLASSES = new Set(['brawler', 'forge_knight', 'priest', 'summoner', 'harpooner', 'duelist', 'stormwright', 'clockmaker', 'runeblade', 'hexweaver']);

const clients = new Map();   // id -> { sock, name, cls, room, budget }
// milestone 4: accounts and saves (server/db.mjs: Supabase online, a file when testing with DB=file)
const { makeDb } = await import('./db.mjs');
// milestone 5: what the server won't take (server/guard.mjs)
const { checkSave, movedTooFar, itemOk, hadItem, LIMIT: G } = await import('./guard.mjs');
// dropped bags in the shared places: everyone there sees them, and the server says who gets each item
const bags = new Map();              // room -> Map(bid -> { bid, x, y, items[8], until })
let nextBid = 1;
const bagsIn = (room) => { let B = bags.get(room); if (!B) bags.set(room, (B = new Map())); return B; };
const bagMsg = (b) => ({ t: 'bag', bid: b.bid, x: b.x, y: b.y, items: b.items });
// shared admin chests (an admin's /adminchest in a shared place): one chest for all, its Life here; when it breaks,
// everyone who hit it gets their own admin loot (their browser rolls it)
const chests = new Map();            // room -> Map(cid -> { cid, x, y, hp, max, hit: Set(client ids), until })
let nextCid = 1;
const chestsIn = (room) => { let C = chests.get(room); if (!C) chests.set(room, (C = new Map())); return C; };
const chestMsg = (o) => ({ t: 'chest', cid: o.cid, x: o.x, y: o.y, hp: o.hp, max: o.max });
setInterval(() => { const now = Date.now(); for (const [room, C] of chests) for (const [cid, o] of C) if (o.until < now) { C.delete(cid); toRoom(room, { t: 'chest', cid, gone: true }); } }, 10000);
// a shared kill's brown loot: one public bag where it fell (up to eight to a bag)
function publicBag(room, x, y, items) {
  const B = bagsIn(room);
  for (let k = 0; k < items.length && B.size < 120; k += 8) {
    const b = { bid: nextBid++, x: x + (k ? 0.6 : 0), y, items: [...items.slice(k, k + 8), ...Array(Math.max(0, 8 - items.slice(k, k + 8).length)).fill(null)], until: Date.now() + 60000 };   // (a public bag is plain loot: a minute)
    B.set(b.bid, b); toRoom(room, bagMsg(b));
  }
}
setInterval(() => { const now = Date.now(); for (const [room, B] of bags) for (const [bid, b] of B) if (b.until < now) { B.delete(bid); toRoom(room, { t: 'bag', bid, gone: true }); } }, 5000);
const db = makeDb();
if (db) console.log(`accounts and saves: ${db.kind}`);
// stage 2: the shared realm's monsters run here (server/world.mjs). WORLD=0 in the environment turns it off.
const { makeWorld } = process.env.WORLD === '0' ? {} : await import('./world.mjs');
let world = makeWorld ? makeWorld(SEED, (id, obj) => { const c = clients.get(id); if (c) send(c, obj); }) : null;
let REALM = 'realm:' + SEED;
if (world) world.onBag = (x, y, items) => publicBag(REALM, x, y, items);
// the Nexus has a shared world too: what an admin spawns there (bosses to try, chickens) is everyone's
const nexusWorld = makeWorld ? makeWorld(1, (id, obj) => { const c = clients.get(id); if (c) send(c, obj); }, 'nexus') : null;
if (nexusWorld) nexusWorld.onBag = (x, y, items) => publicBag('nexus', x, y, items);
// milestone 3: shared dungeons, one world each, opened from portals in the shared realm (a dungeon closes when it has
// stood empty for two minutes and its portal is gone)
const { DUNGEONS } = world ? await import('../src/data/enemies.js') : { DUNGEONS: {} };
const dungeons = new Map();          // 'dg:N' -> { world, to, until }
// (from the clock, not 1: after a restart (every deploy) a new dungeon took the number of one players were still in,
// so they were sent another layout's monsters: in walls, the boss nowhere in its room. 2026-10-24)
let nextIid = Date.now() % 1e9;
const worldOf = (room) => (room === REALM ? world : room === 'nexus' ? nexusWorld : room && dungeons.has(room) ? dungeons.get(room).world : null);
// ---- the realm's life (2026-10-30, the user: "Have the realm run on a timer. It stays active for 15 minutes before
// erupting and sending players to the final boss. This also lets the realm reset"). Warnings as it nears; then everyone
// in it is thrown together into one shared Throne of Solkhar, and a fresh realm (a new seed) takes its place. An admin
// can set it off early (/erupt).
const REALM_LIFE = (+process.env.REALM_LIFE_S || 15 * 60) * 1000, REALM_WARN = [300, 60, 30, 10];   // (REALM_LIFE_S: shorter, to try it locally)
let realmBorn = Date.now(), realmWarned = new Set();
const realmEnds = () => realmBorn + REALM_LIFE;
function newRealm() {
  SEED = randomInt(1, 0xffffff) | 1; REALM = 'realm:' + SEED;
  if (makeWorld) { world = makeWorld(SEED, (id, obj) => { const c = clients.get(id); if (c) send(c, obj); }); world.onBag = (x, y, items) => publicBag(REALM, x, y, items); }
  realmBorn = Date.now(); realmWarned = new Set();
  toAll({ t: 'realmseed', seed: SEED, ends: realmEnds(), now: Date.now() });
  console.log(`a new realm, seed ${SEED}`);
}
function erupt(by) {
  const inRealm = [...clients.values()].filter((c) => c.room === REALM && !c.sock.destroyed);
  let pass = null;
  if (inRealm.length && makeWorld && DUNGEONS.throne) {
    const iid = nextIid++, seed = randomInt(1, 0xffffff) | 3, room = 'dg:' + iid;
    try { const dw = makeWorld(seed, (id, obj) => { const t = clients.get(id); if (t) send(t, obj); }, 'throne'); dw.onBag = (x, y, items) => publicBag(room, x, y, items); dungeons.set(room, { world: dw, to: 'throne', until: Date.now() + 120000 }); pass = { iid, seed }; }
    catch (err) { console.error('erupt', err); }
  }
  for (const c of inRealm) send(c, { t: 'erupt', to: 'throne', ...(pass || {}) });
  toAll({ t: 'chat', id: 0, name: 'Server', text: `The realm has erupted${by ? ` (${by})` : ''}! Those in it are thrown before Solkhar. A new realm rises.` });
  newRealm();
}
setInterval(() => {
  const left = Math.round((realmEnds() - Date.now()) / 1000);
  for (const w of REALM_WARN) if (left <= w && left > w - 5 && !realmWarned.has(w)) { realmWarned.add(w); toAll({ t: 'realmwarn', left: w }); }
  if (left <= 0) erupt();
}, 1000);
const roomOk = (room) => typeof room === 'string' && (ROOM.test(room) || dungeons.has(room));
let nextId = 1;
const arenaOf = new Map();                        // a shared rf_ dungeon's room -> its boss room (one for the group)

// ---- WebSocket framing (RFC 6455): text frames, masked from browsers, unmasked from us
function frame(text) {
  const p = Buffer.from(text), n = p.length;
  const h = n < 126 ? Buffer.from([0x81, n]) : n < 65536 ? Buffer.from([0x81, 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x81; b[1] = 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
  return Buffer.concat([h, p]);
}
function send(c, obj) { if (!c.sock.destroyed) c.sock.write(frame(JSON.stringify(obj))); }
function toRoom(room, obj, except) { const f = frame(JSON.stringify(obj)); for (const c of clients.values()) if (c.room === room && c !== except && !c.sock.destroyed) c.sock.write(f); }
function toAll(obj) { const f = frame(JSON.stringify(obj)); for (const c of clients.values()) if (!c.sock.destroyed) c.sock.write(f); }

const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);
const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n) : '');

function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch { return; }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'hi') {
    c.name = str(m.name, LIMIT.name).trim() || `Player ${c.id}`;
    c.cls = CLASSES.has(m.cls) ? m.cls : 'priest';
    send(c, { t: 'welcome', id: c.id, seed: SEED, ends: realmEnds(), now: Date.now(), online: clients.size, world: !!world, nexus: !!nexusWorld, db: !!db });
    return;
  }
  if (m.t === 'tk' && Array.isArray(m.parts)) { for (const part of m.parts.slice(0, 6)) if (part && typeof part === 'object' && part.t !== 'tk') onMessage(c, JSON.stringify(part)); return; }   // one bundle a tick
  // back after a drop, in a shared dungeon the server no longer has (it restarted): made again from its seed, for the
  // group to come back to (its monsters fresh)
  if (m.t === 'rejoin' && world && typeof m.to === 'string' && (DUNGEONS[m.to] || /^rf_[a-z_]+$/.test(m.to))) {
    const iid = Math.floor(num(m.iid, 1, 1e12)), room = 'dg:' + iid, seed = Math.floor(num(m.seed, 1, 0xffffff));
    if (!iid || !seed || dungeons.has(room) || dungeons.size >= 12) return;
    try {
      const dw = makeWorld(seed, (id, obj) => { const t = clients.get(id); if (t) send(t, obj); }, m.to); dw.onBag = (x, y, items) => publicBag(room, x, y, items); dungeons.set(room, { world: dw, to: m.to, until: Date.now() + 60 * 1000 });
      // the rooms its players had cleared stay clear (it used to come back whole: every monster again, 2026-10-24)
      const g = dw._g, R = g.map.rooms || [], gone = new Set((Array.isArray(m.cleared) ? m.cleared : []).slice(0, 200).map((v) => R[Math.floor(num(v, 0, 1e4))]).filter(Boolean));
      if (gone.size) g.enemies = g.map.enemies = g.enemies.filter((e) => ![...gone].some((r) => e.x >= r.x && e.x < r.x + r.w && e.y >= r.y && e.y < r.y + r.h));
      // and in the rest, the monsters they killed (so many of each kind, room by room): a warden or a boss stays dead
      const K = m.kills && typeof m.kills === 'object' ? m.kills : {}, out = new Set();
      for (const [ri, ids] of Object.entries(K).slice(0, 200)) { const r = R[Math.floor(num(+ri, 0, 1e4))]; if (!r || !ids || typeof ids !== 'object') continue;
        for (const [id, n] of Object.entries(ids).slice(0, 40)) { let left = Math.floor(num(n, 0, 200)); for (const e of g.enemies) { if (left <= 0) break; if (!out.has(e) && e.id === id && e.x >= r.x && e.x < r.x + r.w && e.y >= r.y && e.y < r.y + r.h) { out.add(e); left--; } } } }
      if (g.map.rf && Array.isArray(m.rfDead)) {                     // a Realmforge dungeon: the creatures they saw fall, by number, stay dead (quietly: its keys and gates follow)
        const dead = new Set(m.rfDead.slice(0, 400).map((v) => Math.floor(num(v, 0, 1e5))));
        for (const e of g.map.rf.E.en_) if (dead.has(e.rfSid) && e.hp > 0) g.map.rf.X.kill(e);
      }
      if (out.size) {
        g.enemies = g.map.enemies = g.enemies.filter((e) => !out.has(e));
        // a warden that stays dead has broken its seal again (quietly: no banners for a seal long broken), or the gate stays shut
        const b0 = g.banner, n0 = g.narrate, sx = g.sfx; g.banner = g.narrate = g.sfx = () => {};
        try { for (const e of out) if (e.warden) { e.dead = true; e.noLoot = true; g.breakSeal(''); } } finally { g.banner = b0; g.narrate = n0; g.sfx = sx; }
      }
    }
    catch (err) { console.error('rejoin', m.to, err); }
    return;
  }
  if (m.t === 'st') {                                    // where I am and what I'm doing
    const room = roomOk(m.room) ? m.room : null;
    if (room !== c.room) {
      if (c.room) toRoom(c.room, { t: 'bye', id: c.id }, c);
      const W0 = worldOf(c.room); if (W0) W0.leave(c.id);
      c.room = room;
      const W1 = worldOf(room); if (W1) W1.join(c.id, c.name, !!(c.account && c.account.admin));
      if (room) send(c, { t: 'bags', list: [...bagsIn(room).values()].map(bagMsg) });   // the bags lying here
      if (room) for (const o of chestsIn(room).values()) send(c, chestMsg(o));             // and the shared chests
    }
    if (!room) return;
    if (movedTooFar(c, num(m.x, 0, 4096), num(m.y, 0, 4096), room)) {   // faster than any build, again and again
      console.warn(`dropped ${c.name}: moving impossibly fast`);
      send(c, { t: 'kick', reason: 'You were moving faster than the game allows, so the server let you go. Reload to play again.' }); c.sock.end(); return;
    }
    const W = worldOf(room);
    if (W) W.player(c.id, { x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), dead: !!m.dead, hp: num(m.hp, 0, 1e6) });
    if (CLASSES.has(m.cls)) c.cls = m.cls;
    { const nm = str(m.name, LIMIT.name).trim(); if (nm) c.name = nm; }   // (you may sign in after connecting)
    toRoom(room, { t: 'st', id: c.id, name: c.name, cls: c.cls, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), dir: ['front', 'back', 'left', 'right'].includes(m.dir) ? m.dir : 'front',
      mv: !!m.mv, hp: num(m.hp, 0, 1e6), mhp: num(m.mhp, 1, 1e6), dead: !!m.dead, ab: !!m.ab, sh: !!m.sh, dn: !!m.dn, lv: num(m.lv, 1, 99),
      // what they wear and how strong they are, for a look-over (gear: item ids; stats: eight numbers)
      ...(Array.isArray(m.eq) ? { eq: m.eq.slice(0, 4).map((x) => (typeof x === 'string' ? str(x, 80) : null)) } : {}),
      ...(m.stats && typeof m.stats === 'object' ? { stats: Object.fromEntries(['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'].map((k) => [k, num(m.stats[k], 0, 1e5)])) } : {}),
      ...(m.fame !== undefined ? { fame: num(m.fame, 0, 1e9) } : {}) }, c);
    return;
  }
  if (m.t === 'shot' && c.room && Array.isArray(m.list)) {   // my shots, to be drawn (they hurt nothing)
    const list = m.list.slice(0, 24).map((s) => ({ x: num(s.x, 0, 4096), y: num(s.y, 0, 4096), vx: num(s.vx, -60, 60), vy: num(s.vy, -60, 60), a: num(s.a, -10, 10), s: str(s.s, 64), r: num(s.r, 0.05, 2), l: num(s.l, 0, 3), ...(Array.isArray(s.d) ? { d: s.d.slice(0, 4).map((c) => str(c, 9)).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)) } : {}) }));
    toRoom(c.room, { t: 'shot', id: c.id, list }, c);
    return;
  }
  if (m.t === 'hits' && worldOf(c.room) && Array.isArray(m.list)) {   // your blows on the shared monsters
    const W = worldOf(c.room);
    for (const h of m.list.slice(0, 200)) if (Array.isArray(h)) W.hit(c.id, num(h[0], 0, 1e9), num(h[1], 0, 1e6));
    return;
  }
  if (m.t === 'portal' && world && typeof c.room === 'string' && c.room.startsWith('dg:') && /^rfa_[a-z]+$/.test(m.to)) {   // a shared dungeon's boss door: one room for the group
    const had = arenaOf.get(c.room);
    if (had && dungeons.has(had.room)) { send(c, { t: 'portal', iid: had.iid, seed: had.seed, to: m.to, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), life: 30 }); return; }
    if (dungeons.size >= 12 || (c.arenaT || 0) > Date.now()) return;
    c.arenaT = Date.now() + 2000;
    const iid = nextIid++, seed = randomInt(1, 0xffffff) | 3, room = 'dg:' + iid;
    try { const dw = makeWorld(seed, (id, obj) => { const t = clients.get(id); if (t) send(t, obj); }, m.to); dw.onBag = (x, y, items) => publicBag(room, x, y, items); dungeons.set(room, { world: dw, to: m.to, until: Date.now() + 15 * 60 * 1000 }); }
    catch (err) { console.error('arena', m.to, err); return; }
    arenaOf.set(c.room, { room, iid, seed });
    toRoom(c.room, { t: 'portal', iid, seed, to: m.to, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), life: 30 });   // (open 30 s: 2026-10-31)
    return;
  }
  if (m.t === 'portal' && world && (c.room === REALM || c.room === 'nexus') && (DUNGEONS[m.to] || /^rf_[a-z_]+$/.test(m.to))) {   // a dungeon opened in the shared realm or the Nexus
    if (dungeons.size >= 12 || (c.portalT || 0) > Date.now()) return;                   // (a few at a time; one a player every 5 s)
    c.portalT = Date.now() + 5000;
    const iid = nextIid++, seed = randomInt(1, 0xffffff) | 3, room = 'dg:' + iid, life = num(m.life, 10, 120);
    try {
      { const dw = makeWorld(seed, (id, obj) => { const t = clients.get(id); if (t) send(t, obj); }, m.to); dw.onBag = (x, y, items) => publicBag(room, x, y, items); dungeons.set(room, { world: dw, to: m.to, until: Date.now() + life * 1000 }); }
    }
    catch (err) { console.error('dungeon', m.to, err); return; }
    toRoom(c.room, { t: 'portal', iid, seed, to: m.to, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), life, served: 1 });   // (served: the server runs it, Realmforge's too)
    return;
  }
  if (m.t === 'ohit' && worldOf(c.room)) { worldOf(c.room).ohit(c.id, num(m.i, 0, 1e6), str(m.k, 40), num(m.d, 0, 1e6)); return; }   // a blow on something breakable
  if (m.t === 'rfgate' && dungeons.has(c.room) && dungeons.get(c.room).world) { dungeons.get(c.room).world.rfGate(c.id, num(m.i, 0, 1e4)); return; }   // a Realmforge gate a player's copy opened
  if (m.t === 'use' && dungeons.has(c.room) && dungeons.get(c.room).world) { dungeons.get(c.room).world.use(c.id, num(m.i, 0, 1e5), str(m.k, 40)); return; }
  if (m.t === 'efx' && worldOf(c.room) && Array.isArray(m.list)) {     // your stuns, slows, knockback on them
    worldOf(c.room).efx(c.id, m.list.slice(0, 40).filter((x) => Array.isArray(x) && ['stun', 'slow', 'push', 'freeze'].includes(x[1])).map((x) => [num(x[0], 0, 1e9), x[1], num(x[2], -10, 10), num(x[3], -10, 10)]));
    return;
  }
  if (m.t === 'auth' && db) { auth(c, m); return; }
  if (m.t === 'legends') {                                                            // the Hall of Legends: the game's 50 greatest fallen
    if ((c.legT || 0) > Date.now()) return; c.legT = Date.now() + 3000;
    if (!db) { send(c, { t: 'legends', list: [], note: 'This server keeps no accounts.' }); return; }
    db.legends().then((list) => send(c, { t: 'legends', list })).catch((err) => { console.error('legends', err.message); send(c, { t: 'legends', list: [], note: 'The legends could not be read just now.' }); });
    return;
  }
  if (m.t === 'save' && db && c.account && m.data && typeof m.data === 'object') {   // your save, kept on the server
    const json = JSON.stringify(m.data);
    if (json.length > 600000) return;
    c.pendingSave = m.data;
    if (!c.saveTimer) c.saveTimer = setTimeout(() => flushSave(c), Math.max(0, (c.savedAt || 0) + 3000 - Date.now()));
    return;
  }
  if (m.t === 'drop' && c.room && typeof m.id === 'string') {   // an item put on the ground for all here
    const admin = !!(c.account && c.account.admin);
    const ok = itemOk(m.id, admin) && (admin || hadItem(c.pendingSave, m.id) || hadItem(c.goodSave, m.id));   // (the save sent just before counts)
    if (!ok) { send(c, { t: 'dropped', rid: m.rid, ok: false }); return; }
    const B = bagsIn(c.room), x = num(m.x, 0, 4096), y = num(m.y, 0, 4096);
    let b = [...B.values()].find((q) => Math.hypot(q.x - x, q.y - y) < 1 && q.items.includes(null));
    if (!b) { if (B.size >= 60) { send(c, { t: 'dropped', rid: m.rid, ok: false }); return; } b = { bid: nextBid++, x, y, items: Array(8).fill(null) }; B.set(b.bid, b); }
    b.items[b.items.indexOf(null)] = m.id; b.until = Date.now() + 120000;
    send(c, { t: 'dropped', rid: m.rid, ok: true, bid: b.bid });
    toRoom(c.room, bagMsg(b));
    return;
  }
  if (m.t === 'take' && c.room) {                        // taking from a shared bag: the first to ask gets it
    const B = bagsIn(c.room), b = B.get(num(m.bid, 0, 1e9)), i = num(m.i, 0, 7);
    if (!b || !b.items[i] || b.items[i] !== m.id) { send(c, { t: 'took', rid: m.rid, ok: false }); return; }
    b.items[i] = null;
    send(c, { t: 'took', rid: m.rid, ok: true, id: m.id });
    if (b.items.some(Boolean)) toRoom(c.room, bagMsg(b)); else { B.delete(b.bid); toRoom(c.room, { t: 'bag', bid: b.bid, gone: true }); }
    return;
  }
  if (m.t === 'erupt' && c.account && c.account.admin) { erupt(c.name); return; }   // an admin sets the realm off early
  if (m.t === 'cleardeaths' && c.account && c.account.admin && db) {   // an admin cleared their fallen heroes: their save now, then the Hall again
    (async () => { if (c.pendingSave) await flushSave(c); if (db.legendsReset) db.legendsReset(); send(c, { t: 'chat', id: 0, name: 'Server', text: 'Your fallen heroes are off the Hall of Legends.' }); })().catch((err) => console.error('cleardeaths', err.message));
    return;
  }
  if (m.t === 'whisper') {                                // a private line to one player, by name (theirs and yours only)
    if (Date.now() - (c.chatAt || 0) < G.CHAT_GAP) return;
    c.chatAt = Date.now();
    const to = str(m.to, LIMIT.name).trim().toLowerCase(), text = str(m.text, LIMIT.chat).trim();
    if (!to || !text) return;
    const t = [...clients.values()].find((q) => q !== c && !q.sock.destroyed && (q.name || '').toLowerCase() === to);
    if (!t) { send(c, { t: 'whisper', err: `No one named ${str(m.to, LIMIT.name)} is online.` }); return; }
    send(t, { t: 'whisper', from: c.name, text });
    send(c, { t: 'whisper', to: t.name, text });
    return;
  }
  if (m.t === 'acmd' && c.account && c.account.admin && typeof m.line === 'string' && worldOf(c.room)) {   // an admin's world command
    for (const t of worldOf(c.room).adminCmd(c.id, str(m.line, 200)).slice(0, 6)) send(c, { t: 'chat', id: 0, name: 'Server', text: t });
    return;
  }
  if (m.t === 'chesthit' && c.room) {                    // a blow on a shared chest
    const C = chestsIn(c.room), o = C.get(num(m.cid, 0, 1e9));
    if (!o || o.hp <= 0) return;
    o.hp = Math.max(0, o.hp - Math.min(num(m.d, 0, 1e6), 3000)); o.hit.add(c.id);
    if (o.hp > 0) { toRoom(c.room, chestMsg(o)); return; }
    C.delete(o.cid); toRoom(c.room, { t: 'chest', cid: o.cid, open: true, to: [...o.hit] });   // broken: loot for each who hit it
    return;
  }
  if (m.t === 'gift' && c.account && c.account.admin && c.room && ['chickens', 'pigeons', 'chests'].includes(m.what)) {   // an admin's gift for the room
    const n = Math.max(1, Math.min(m.what === 'chests' ? 5 : 100, Math.round(num(m.n, 1, 100)))), x = num(m.x, 0, 4096), y = num(m.y, 0, 4096);
    const W = worldOf(c.room);
    if (W && (m.what === 'chickens' || m.what === 'pigeons')) W.spawn(m.what === 'pigeons' ? 'xp_pigeon' : 'xp_chicken', x, y, n);             // where the server runs the monsters: shared ones
    else if (W && m.what === 'chests') {                                       // a shared place: chests for all to break together
      const C = chestsIn(c.room);
      for (let k = 0; k < n && C.size < 20; k++) {
        const a = Math.random() * Math.PI * 2, d = 2 + Math.random() * 2;
        const o = { cid: nextCid++, x: Math.floor(x + Math.cos(a) * d) + 0.5, y: Math.floor(y + Math.sin(a) * d) + 0.5, hp: 4000, max: 4000, hit: new Set(), until: Date.now() + 600000 };
        C.set(o.cid, o); toRoom(c.room, chestMsg(o));
      }
      toRoom(c.room, { t: 'gift', what: 'note', n, x, y, by: c.name });
    }
    else { const msg = { t: 'gift', what: m.what, n, x, y, by: c.name }; toRoom(c.room, msg, c); send(c, msg); }
    return;
  }
  if (m.t === 'chat') {
    if (Date.now() - (c.chatAt || 0) < G.CHAT_GAP) return;         // one line at a time
    c.chatAt = Date.now();
    const text = str(m.text, LIMIT.chat).trim();
    // dev only (DEV=1 in the environment, never online): !kraken, !treant raise an event boss in the shared realm
    if (process.env.DEV === '1' && world && /^!(kraken|treant)$/.test(text)) { const g = world._g; g.spawnEventBoss(text === '!kraken' ? 'abyssal_kraken' : 'thornheart_treant'); return; }
    if (text) toAll({ t: 'chat', id: c.id, name: c.name, text });
  }
}

// sign up, sign in, come back signed in, sign out (a few tries a minute per connection)
async function auth(c, m) {
  const reply = (r) => send(c, { t: 'auth', rid: m.rid, ...r });
  const now = Date.now();
  c.tries = (c.tries || []).filter((t) => now - t < 60000);
  if (m.kind !== 'logout' && c.tries.length >= 10) return reply({ error: 'Too many tries: wait a minute.' });
  c.tries.push(now);
  try {
    let r;
    if (m.kind === 'signup') r = await db.signup(str(m.name, 16).trim(), typeof m.pass === 'string' ? m.pass.slice(0, 128) : '');
    else if (m.kind === 'login') r = await db.login(str(m.name, 16).trim(), typeof m.pass === 'string' ? m.pass.slice(0, 128) : '');
    else if (m.kind === 'resume') r = await db.resume(str(m.token, 100));
    else if (m.kind === 'logout') { if (c.account) await flushSave(c); await db.logout(str(m.token, 100)); c.account = null; return reply({ ok: true }); }
    else return;
    if (r.error) return reply({ error: r.error });
    if (c.account && c.account.id !== r.account.id) await flushSave(c);
    c.account = r.account; c.name = r.account.name;
    if (r.created && m.upload && typeof m.upload === 'object' && JSON.stringify(m.upload).length < 600000) {   // a new account brings this browser's progress (checked)
      const { save, notes } = checkSave(m.upload, null, { upload: true });
      if (notes.length) console.warn(`upload for ${r.account.name}: ${notes.slice(0, 8).join('; ')}`);
      await db.writeSave(r.account.id, save); r.save = save;
    }
    c.goodSave = r.save; c.goodAt = Date.now();
    reply({ ok: true, token: r.token, account: r.account, save: r.save, created: !!r.created });
  } catch (err) { console.error('auth', m.kind, err.message); reply({ error: 'The account service is not answering. Try again soon.' }); }
}
async function flushSave(c) {
  clearTimeout(c.saveTimer); c.saveTimer = null;
  const data = c.pendingSave; c.pendingSave = null;
  if (!data || !c.account) return;
  c.savedAt = Date.now();
  const { save, notes } = checkSave(data, c.goodSave || { gold: 0, fame: 0, essence: 0 }, { admin: c.account.admin, minutes: (Date.now() - (c.goodAt || Date.now())) / 60000 });
  if (notes.length) console.warn(`save for ${c.account.name}: ${notes.slice(0, 8).join('; ')}`);
  c.goodSave = save; c.goodAt = Date.now();
  try { await db.writeSave(c.account.id, save); } catch (err) { console.error('save', err.message); c.pendingSave = c.pendingSave || data; }
}

const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end(`Melon Realms server: ${clients.size} online · version ${(process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7)}
`);
});
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || req.headers.upgrade?.toLowerCase() !== 'websocket') { sock.destroy(); return; }
  const accept = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  sock.setNoDelay(true);
  const c = { id: nextId++, sock, name: '', cls: 'priest', room: null, budget: LIMIT.perSec, last: Date.now() };
  clients.set(c.id, c);
  let buf = Buffer.alloc(0), parts = [];
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    if (buf.length > LIMIT.msg * 4) { sock.destroy(); return; }
    for (;;) {
      if (buf.length < 2) return;
      const fin = buf[0] & 0x80, op = buf[0] & 0x0f, masked = buf[1] & 0x80;
      let n = buf[1] & 0x7f, o = 2;
      if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); o = 4; }
      else if (n === 127) { if (buf.length < 10) return; n = Number(buf.readBigUInt64BE(2)); o = 10; }
      if (n > LIMIT.msg || !masked) { sock.destroy(); return; }
      if (buf.length < o + 4 + n) return;
      const mask = buf.subarray(o, o + 4), p = Buffer.from(buf.subarray(o + 4, o + 4 + n));
      for (let i = 0; i < n; i++) p[i] ^= mask[i & 3];
      buf = buf.subarray(o + 4 + n);
      if (op === 0x8) { sock.end(Buffer.from([0x88, 0])); return; }                  // close
      if (op === 0x9) { sock.write(Buffer.concat([Buffer.from([0x8a, p.length]), p])); continue; }   // ping -> pong
      if (op === 0xa) continue;                                                     // pong
      parts.push(p);
      if (!fin) continue;
      const text = Buffer.concat(parts).toString('utf8'); parts = [];
      // a budget of messages a second (a misbehaving client is dropped, not the server)
      const now = Date.now(); c.budget = Math.min(LIMIT.perSec, c.budget + ((now - c.last) / 1000) * LIMIT.perSec); c.last = now;
      // over budget: the extra is dropped (a burst after lag is no crime); only a real flood is let go
      if ((c.budget -= 1) < -LIMIT.perSec * 10) { console.warn(`dropped ${c.name || c.id}: flooding`); sock.destroy(); return; }
      if (c.budget >= -LIMIT.perSec) onMessage(c, text);
    }
  });
  const gone = () => { if (!clients.has(c.id)) return; clients.delete(c.id); if (c.pendingSave) flushSave(c); const W = worldOf(c.room); if (W) W.leave(c.id); if (c.room) toRoom(c.room, { t: 'bye', id: c.id }); toAll({ t: 'online', n: clients.size }); };
  sock.on('close', gone); sock.on('error', gone);
  toAll({ t: 'online', n: clients.size });
});
// keep connections alive through hosts' idle timeouts
// awake while anyone plays: Render's free plan sleeps a server after 15 minutes with no web request coming in (the
// game's own connection may not count), and a sleeping server wakes with the realm and every dungeon made fresh:
// bosses gone, cleared rooms full again (2026-10-24). So, every 5 minutes someone is on, it calls itself from outside
if (process.env.RENDER_EXTERNAL_URL) setInterval(() => { if (clients.size) fetch(process.env.RENDER_EXTERNAL_URL).catch(() => {}); }, 5 * 60 * 1000);
setInterval(() => { const ping = Buffer.from([0x89, 0]); for (const c of clients.values()) if (!c.sock.destroyed) c.sock.write(ping); }, 25000);
// the world's clock: 20 steps a second, the monsters' news 10 times a second
if (world) { let n = 0, slow = 0; setInterval(() => { const t0 = performance.now(); const now = true; ++n;
  try { world.tick(0.1, now); } catch (err) { console.error('world tick', err); }
  try { if (nexusWorld) nexusWorld.tick(0.1, now); } catch (err) { console.error('nexus tick', err); }
  for (const [room, d] of dungeons) {
    if (d.world) { try { d.world.tick(0.1, now); } catch (err) { console.error('dungeon tick', d.to, err); } }
    const idle = d.world ? d.world.idleMs : ([...clients.values()].some((c) => c.room === room) ? (d.idleSince = Date.now(), 0) : Date.now() - d.idleSince);
    if (Date.now() > d.until && idle > 120000) dungeons.delete(room);     // empty, its portal long gone: closed
  } const ms = performance.now() - t0; if (ms > 90 && ++slow % 50 === 1) console.warn(`world tick slow: ${ms.toFixed(0)} ms`); }, 100); }
server.listen(PORT, () => console.log(`Melon Realms server on :${PORT}, realm seed ${SEED}`));
// shutting down (Render stops the old server on every deploy): write every save still waiting, then go
let closing = false;
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, async () => {
  if (closing) return; closing = true;
  const waits = [...clients.values()].filter((c) => c.pendingSave).map((c) => flushSave(c).catch(() => {}));
  await Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 8000))]);
  process.exit(0);
});
