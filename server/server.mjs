// Melon Realms' multiplayer server, stage 1: players see each other. Every browser sends its player's state (where it
// is, which way it faces, what it is doing) and the shots it fires; the server passes them on to everyone else in the
// same place (the Nexus, the shared realm). Monsters, loot and saves stay in each browser for now. One realm seed for
// everyone, so all players walk the same land. Plain Node, no packages: a small WebSocket server of its own.
//   node server/server.mjs            (PORT from the environment, else 8787)
import { createServer } from 'node:http';
import { createHash, randomInt } from 'node:crypto';

const PORT = +process.env.PORT || 8787;
const SEED = (+process.env.REALM_SEED || randomInt(1, 0xffffff)) | 1;   // the shared realm (a new one each start)
const LIMIT = { msg: 16384, name: 16, chat: 200, perSec: 40 };           // what one player may send
const ROOM = /^(nexus|realm:\d+)$/;                                        // the places players share (stage 1)
const CLASSES = new Set(['brawler', 'forge_knight', 'priest', 'summoner', 'harpooner', 'duelist', 'stormwright', 'clockmaker', 'runeblade', 'hexweaver']);

const clients = new Map();   // id -> { sock, name, cls, room, budget }
// stage 2: the shared realm's monsters run here (server/world.mjs). WORLD=0 in the environment turns it off.
const { makeWorld } = process.env.WORLD === '0' ? {} : await import('./world.mjs');
const world = makeWorld ? makeWorld(SEED, (id, obj) => { const c = clients.get(id); if (c) send(c, obj); }) : null;
const REALM = 'realm:' + SEED;
// milestone 3: shared dungeons, one world each, opened from portals in the shared realm (a dungeon closes when it has
// stood empty for two minutes and its portal is gone)
const { DUNGEONS } = world ? await import('../src/data/enemies.js') : { DUNGEONS: {} };
const dungeons = new Map();          // 'dg:N' -> { world, to, until }
let nextIid = 1;
const worldOf = (room) => (room === REALM ? world : room && dungeons.has(room) ? dungeons.get(room).world : null);
const roomOk = (room) => typeof room === 'string' && (ROOM.test(room) || dungeons.has(room));
let nextId = 1;

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
    send(c, { t: 'welcome', id: c.id, seed: SEED, online: clients.size, world: !!world });
    return;
  }
  if (m.t === 'st') {                                    // where I am and what I'm doing
    const room = roomOk(m.room) ? m.room : null;
    if (room !== c.room) {
      if (c.room) toRoom(c.room, { t: 'bye', id: c.id }, c);
      const W0 = worldOf(c.room); if (W0) W0.leave(c.id);
      c.room = room;
      const W1 = worldOf(room); if (W1) W1.join(c.id, c.name);
    }
    if (!room) return;
    const W = worldOf(room);
    if (W) W.player(c.id, { x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), dead: !!m.dead, hp: num(m.hp, 0, 1e6) });
    if (CLASSES.has(m.cls)) c.cls = m.cls;
    { const nm = str(m.name, LIMIT.name).trim(); if (nm) c.name = nm; }   // (you may sign in after connecting)
    toRoom(room, { t: 'st', id: c.id, name: c.name, cls: c.cls, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), dir: ['front', 'back', 'left', 'right'].includes(m.dir) ? m.dir : 'front',
      mv: !!m.mv, hp: num(m.hp, 0, 1e6), mhp: num(m.mhp, 1, 1e6), dead: !!m.dead, ab: !!m.ab, sh: !!m.sh, dn: !!m.dn, lv: num(m.lv, 1, 99) }, c);
    return;
  }
  if (m.t === 'shot' && c.room && Array.isArray(m.list)) {   // my shots, to be drawn (they hurt nothing)
    const list = m.list.slice(0, 24).map((s) => ({ x: num(s.x, 0, 4096), y: num(s.y, 0, 4096), vx: num(s.vx, -60, 60), vy: num(s.vy, -60, 60), a: num(s.a, -10, 10), s: str(s.s, 64), r: num(s.r, 0.05, 2), l: num(s.l, 0, 3) }));
    toRoom(c.room, { t: 'shot', id: c.id, list }, c);
    return;
  }
  if (m.t === 'hits' && worldOf(c.room) && Array.isArray(m.list)) {   // your blows on the shared monsters
    const W = worldOf(c.room);
    for (const h of m.list.slice(0, 60)) if (Array.isArray(h)) W.hit(c.id, num(h[0], 0, 1e9), num(h[1], 0, 1e6));
    return;
  }
  if (m.t === 'portal' && world && c.room === REALM && DUNGEONS[m.to] && m.to !== 'forge') {   // a dungeon opened in the shared realm
    if (dungeons.size >= 12 || (c.portalT || 0) > Date.now()) return;                   // (a few at a time; one a player every 5 s)
    c.portalT = Date.now() + 5000;
    const iid = nextIid++, seed = randomInt(1, 0xffffff) | 3, room = 'dg:' + iid, life = num(m.life, 10, 120);
    try { dungeons.set(room, { world: makeWorld(seed, (id, obj) => { const t = clients.get(id); if (t) send(t, obj); }, m.to), to: m.to, until: Date.now() + life * 1000 }); }
    catch (err) { console.error('dungeon', m.to, err); return; }
    toRoom(REALM, { t: 'portal', iid, seed, to: m.to, x: num(m.x, 0, 4096), y: num(m.y, 0, 4096), life });
    return;
  }
  if (m.t === 'use' && dungeons.has(c.room)) { dungeons.get(c.room).world.use(c.id, num(m.i, 0, 1e5), str(m.k, 40)); return; }
  if (m.t === 'efx' && worldOf(c.room) && Array.isArray(m.list)) {     // your stuns, slows, knockback on them
    worldOf(c.room).efx(c.id, m.list.slice(0, 40).filter((x) => Array.isArray(x) && ['stun', 'slow', 'push'].includes(x[1])).map((x) => [num(x[0], 0, 1e9), x[1], num(x[2], -10, 10), num(x[3], -10, 10)]));
    return;
  }
  if (m.t === 'chat') {
    const text = str(m.text, LIMIT.chat).trim();
    // dev only (DEV=1 in the environment, never online): !kraken, !treant raise an event boss in the shared realm
    if (process.env.DEV === '1' && world && /^!(kraken|treant)$/.test(text)) { const g = world._g; g.spawnEventBoss(text === '!kraken' ? 'abyssal_kraken' : 'thornheart_treant'); return; }
    if (text) toAll({ t: 'chat', id: c.id, name: c.name, text });
  }
}

const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end(`Melon Realms server: ${clients.size} online\n`);
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
      if ((c.budget -= 1) < -LIMIT.perSec) { sock.destroy(); return; }
      if (c.budget >= 0) onMessage(c, text);
    }
  });
  const gone = () => { if (!clients.has(c.id)) return; clients.delete(c.id); const W = worldOf(c.room); if (W) W.leave(c.id); if (c.room) toRoom(c.room, { t: 'bye', id: c.id }); toAll({ t: 'online', n: clients.size }); };
  sock.on('close', gone); sock.on('error', gone);
  toAll({ t: 'online', n: clients.size });
});
// keep connections alive through hosts' idle timeouts
setInterval(() => { const ping = Buffer.from([0x89, 0]); for (const c of clients.values()) if (!c.sock.destroyed) c.sock.write(ping); }, 25000);
// the world's clock: 20 steps a second, the monsters' news 10 times a second
if (world) { let n = 0, slow = 0; setInterval(() => { const t0 = performance.now(); const now = ++n % 2 === 0;
  try { world.tick(0.05, now); } catch (err) { console.error('world tick', err); }
  for (const [room, d] of dungeons) {
    try { d.world.tick(0.05, now); } catch (err) { console.error('dungeon tick', d.to, err); }
    if (Date.now() > d.until && d.world.idleMs > 120000) dungeons.delete(room);     // empty, its portal long gone: closed
  } const ms = performance.now() - t0; if (ms > 45 && ++slow % 50 === 1) console.warn(`world tick slow: ${ms.toFixed(0)} ms`); }, 50); }
server.listen(PORT, () => console.log(`Melon Realms server on :${PORT}, realm seed ${SEED}`));
