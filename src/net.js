// Multiplayer, stage 1 (server/server.mjs): you see the other players. This browser tells the server where its player
// is, what it is doing and the shots it fires; it hears the same from everyone else in the same place (the Nexus, the
// shared realm) and draws them, moving smoothly between updates. Their shots are drawn only: they hurt nothing here.
// Chat goes to everyone online. Monsters, loot and saves stay this browser's own. The server also hands out the realm's
// seed, so every player walks the same land. With no server (none set, or it is down) the game plays alone as before.
// Mixed into Game; game.js calls netTick every frame, shoot() reports your shots, enter() asks netSeed for the realm.

import { DUNGEONS as DUNGEON_DEFS, REALM_BOSSES } from './data/enemies.js';
import { lift } from './util.js';
const NET_WORLD_CMDS = new Set(['spawn', 'bx', 'boss', 'kraken', 'treant', 'star', 'melon', 'event', 'progress', 'killall', 'kill', 'clear']);
// the dungeons that can be shared (the Drowned Forge's boss is of an older kind and stays each player's own for now)
const NET_DUNGEONS = (to) => !!DUNGEON_DEFS[to] || /^rf_[a-z_]+$/.test(to);   // (rf_ dungeons: the same layout and each other, their creatures each player's own for now)
// where the server is: ?server=wss://... in the address wins; on this computer, the local one; online, SERVER_URL
export const SERVER_URL = 'wss://realm-7ila.onrender.com';   // the multiplayer server (Render)
function serverUrl() {
  const q = new URLSearchParams(location.search).get('server');
  if (q) return q;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return `ws://${location.hostname}:8787`;
  return SERVER_URL;
}
const SEND = 0.1;                    // how often your state goes out (s)

const methods = {
  netStart() {
    if (this.net || typeof WebSocket === 'undefined') return;
    const url = serverUrl();
    this.net = { url, ws: null, id: 0, seed: 0, world: false, others: new Map(), shots: [], hits: [], efx: [], byId: new Map(), sendT: 0, wait: 2, online: 0, open: false };
    if (url) this.netConnect();
  },
  netConnect() {
    const N = this.net;
    let ws;
    try { ws = new WebSocket(N.url); } catch { return; }
    N.ws = ws;
    ws.onopen = () => {
      // (and each browser knocks on its door every 4 minutes it's connected: see server/server.mjs, awake while anyone plays)
      clearInterval(N.keepT); if (/^wss:/.test(N.url)) N.keepT = setInterval(() => { fetch(N.url.replace(/^wss:/, 'https:'), { mode: 'no-cors', cache: 'no-store' }).catch(() => {}); }, 4 * 60 * 1000);
      N.open = true; N.wait = 2; ws.send(JSON.stringify({ t: 'hi', name: (this.account && this.account.name) || '', cls: this.player ? this.player.cls : '' }));
      if (this.account && this.account.online && this.account.token) this.netAuth('resume', { token: this.account.token }).then((r) => { if (r && !r.error && this.player && !this.player.dead && this.mode === 'play') this.persist(); });   // back after a drop: still you (and your latest save goes up again: the server may have restarted)
    };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.netOn(m); };
    ws.onclose = () => {                                  // gone: everyone vanishes; try again, waiting longer each time
      clearInterval(N.keepT);
      N.open = false; N.ws = null; N.others.clear(); this.netWorldOff();
      if (N.kicked) return;                                 // (dropped by the server: not again until you reload)
      setTimeout(() => this.netConnect(), N.wait * 1000); N.wait = Math.min(30, N.wait * 2);
    };
    ws.onerror = () => {};
  },
  netOn(m) {
    const N = this.net;
    if (m.t === 'welcome') {
      N.id = m.id; N.online = m.online; N.world = !!m.world; N.nexusWorld = !!m.nexus; N.db = !!m.db;
      for (const f of N.waiters || []) f(true); N.waiters = [];
      if (N.seed !== m.seed) { N.seed = m.seed; if (this.realmMap && this.realmMap.seed !== m.seed && this.map !== this.realmMap) this.realmMap = null; }   // the shared realm from now on
      if (this.map && this.map === this.realmMap && this.map.seed !== m.seed && this.mode === 'play' && !this.player.dead) {   // out in a realm of your own: over to the shared one
        this.realmMap = null; this.enter('realm'); this.banner('You join the shared realm.', 2600);
      } else if (this.map && (this.map === this.realmMap || this.map.kind === 'nexus')) this.netWorldCheck();
      else if (this.map && this.map.kind === 'dungeon' && this.map.netIid && this.map.netWorld && this.mode === 'play') {   // back after a drop, in a shared dungeon: its monsters come again, fresh
        // (the rooms you cleared: where monsters fell and none you know of still stand; a dungeon made again keeps them clear)
        const M = this.map, inR = (r, e) => e.x >= r.x && e.x < r.x + r.w && e.y >= r.y && e.y < r.y + r.h;
        const cleared = [...(M.netDeadRooms || [])].filter((ri) => M.rooms[ri] && !this.enemies.some((e) => e.net && !e.dead && inR(M.rooms[ri], e))).slice(0, 200);
        N.byId.clear(); this.enemies = M.enemies = [];
        N.ws.send(JSON.stringify({ t: 'rejoin', iid: M.netIid, seed: M.netSeed, to: M.netTo, cleared, kills: M.netKills || {}, rfDead: [...(M.netRfDead || [])].slice(0, 400) }));   // (and every monster you saw fall, by kind and room: a warden stays dead)   // (made again if the server lost it)
      }
    } else if (m.t === 'online') N.online = m.n;
    else if (m.t === 'gift') {                            // an admin's gift: your own chests and chickens (shared chickens in the realm come as monsters)
      if (m.what === 'chests') this.spawnAdminChests(m.x, m.y, m.n);
      if (m.what === 'note') { if (m.by) this.banner(`${m.by} brings gifts!`, 2200); return; }
      else if (m.what === 'chickens' && !this.map.netWorld) this.spawnChickens(m.x, m.y, m.n);
      else if (m.what === 'pigeons' && !this.map.netWorld) this.spawnChickens(m.x, m.y, m.n, 'xp_pigeon');
      if (m.by) this.banner(`${m.by} brings gifts!`, 2200);
    }
    else if (m.t === 'bags') { if (this.map) { this.bags = this.map.bags = this.bags.filter((b) => !b.shared); for (const b of m.list) this.netBag(b); } }
    else if (m.t === 'bag') this.netBag(m);
    else if (m.t === 'chest') this.netChest(m);
    else if (m.t === 'oopen') { const o = this.map && this.map.netWorld && this.netObj2(m.i, m.k); if (o) { o.guards = null; this.breakChest(o); this.map.brk = null; } }   // you hit it: your loot
    else if (m.t === 'ofloat') { const o = this.map && this.netObj2(m.i, m.k); if (o) this.float(o.x, o.y - 1, m.text, '#8d88a0'); }
    else if ((m.t === 'dropped' || m.t === 'took') && N.pending) { const f = N.pending.get(m.rid); if (f) { N.pending.delete(m.rid); f(m); } }
    else if (m.t === 'moveto') { const p = this.player; if (p && !p.dead && this.map.netWorld) { p.x = m.x; p.y = m.y; } }
    else if (m.t === 'kick') { N.kicked = true; this.banner(m.reason || 'The server let you go.', 8000); this.say(m.reason || 'The server let you go.', '#ff8a8a'); }
    else if (m.t === 'auth') { const f = N.pending && N.pending.get(m.rid); if (f) { N.pending.delete(m.rid); f(m); } }
    else if (m.t === 'st') {
      let o = N.others.get(m.id);
      if (!o) { o = { remote: true, id: m.id, x: m.x, y: m.y, status: {}, deadT: 0, lastShot: -9, shotPeriod: 0.3, abilityT: 0, hitT: 0, danceT: 0 }; N.others.set(m.id, o); }
      Object.assign(o, { name: m.name, cls: m.cls, tx: m.x, ty: m.y, dir: m.dir, moving: m.mv, hp: m.hp, maxHp: m.mhp, level: m.lv, seen: this.t, room: this.netRoom() });
      if (m.eq) o.eq = m.eq;
      if (m.stats) o.stats = m.stats;
      if (m.fame !== undefined) o.fame = m.fame;
      if (m.dead && !o.dead) { o.deadT = 0; const M = this.map; if (M) (M.graves = M.graves || []).push({ x: m.x, y: m.y, name: m.name, level: m.lv, cls: m.cls, fame: o.fame || 0, t: this.t }); }   // another player fell: their grave
      o.dead = m.dead;
      if (m.sh) o.lastShot = this.t;
      if (m.ab && o.abilityT <= 0) o.abilityT = 0.5;
      o.danceT = m.dn ? 1 : 0;
    } else if (m.t === 'bye') N.others.delete(m.id);
    else if (m.t === 'shot') {
      if (!N.others.has(m.id)) return;
      for (const s of m.list) {                            // their shots: drawn, harmless
        const b = this.shoot('r', s.x, s.y, s.a, Math.hypot(s.vx, s.vy), Math.hypot(s.vx, s.vy) * s.l, 0, s.s, s.r, true);
        b.vx = s.vx; b.vy = s.vy; b.harmless = true; b.ghost = true;
        if (Array.isArray(s.d)) b.dust = s.d;                 // (its trail, as its owner sees it)
      }
    } else if (m.t === 'ws') this.netWorldState(m);
    else if (m.t === 'bosses') { N.bossPins = (m.list || []).map(([nid, id, x, y, biome, tag]) => ({ nid, id, x, y, biome, tag: tag || 'b' })); N.eventPins = (m.ev || []).map(([kind, x, y]) => ({ kind, x, y })); N.bossPinsMap = this.map; }   // where the bosses here are, near or far (for the minimap)
    else if (m.t === 'wev') this.netWorldEvents(m.ev);
    else if (m.t === 'wlog') { if (this.map.netWorld) { for (const a of m.tiles) this.netTile(a); for (const o of m.objs) this.netObj(o); } }
    else if (m.t === 'portal') {                          // a dungeon opened in the shared realm: everyone's way in
      const M = this.map, D = DUNGEON_DEFS[m.to];
      if (String(m.to).startsWith('rfa_')) {              // the boss's room, opened for the group: the door now leads there
        if (!M || !M.netIid) return;
        for (const q of M.portals) if (q.to === m.to) { q.netIid = m.iid; q.netSeed = m.seed; }
        if (this.netWantArena === m.to) { this.netWantArena = null; this.netEnterNext = { iid: m.iid, seed: m.seed }; this.travel(m.to); }
        return;
      }
      if (!M || !M.netWorld || (M.kind !== 'realm' && M.kind !== 'nexus') || (!D && !String(m.to).startsWith('rf_'))) return;
      if (D) { M.portals.push({ kind: D.portal, x: m.x, y: m.y, label: D.name, to: m.to, life: m.life, netIid: m.iid, netSeed: m.seed }); this.say(`A portal to ${D.name} has opened!`, '#3befff'); }
      else { const n0 = M.portals.length; this.rfOpenPortal(m.to, m.x, m.y, m.life); for (const q of M.portals.slice(n0)) { q.netIid = m.iid; q.netSeed = m.seed; q.netServed = !!m.served; } }   // (served: the server runs its creatures for the group)   // (an rf_ dungeon's own portal art)
    }
    else if (m.t === 'dlog') { if (this.map.netWorld && this.map.kind === 'dungeon') this.netDungeonState(m); }
    else if (m.t === 'hurt') { if (this.map.netWorld && !this.player.dead) this.hurtPlayer(m.d, m.by, m.ap); }
    else if (m.t === 'chat') this.say(`${m.name}: ${m.text}`, m.id === N.id ? '#e9e4f2' : '#bfe8ff');
  },
  // an admin's command that makes or ends monsters, in a shared place: run by the server (true: sent)
  netWorldCmd(line, cmd, args) {
    const N = this.net;
    if (!N || !N.open || !NET_WORLD_CMDS.has(cmd) || !(this.account && this.account.online && this.account.admin)) return false;
    if (cmd === 'boss') { const id = ({ emily: 'emily_the_yapper', penguin: 'emily_the_yapper' })[args[0]] || args[0]; if (id && !REALM_BOSSES[id]) return false; }   // (a dungeon boss: it takes you there)
    N.ws.send(JSON.stringify({ t: 'acmd', line }));
    return true;
  },
  // an admin's gift for everyone in this room: the server checks you're an admin and hands it out (true: sent)
  netGift(what, n) {
    const N = this.net, room = this.netRoom(), p = this.player;
    if (!N || !N.open || !room || !(this.account && this.account.online && this.account.admin)) return false;
    N.ws.send(JSON.stringify({ t: 'gift', what, n, x: +p.x.toFixed(2), y: +p.y.toFixed(2) }));
    return true;
  },
  // ---- shared bags: an item dropped in a shared place lies there for everyone; the server gives each item to one
  netBagsOn() { const N = this.net; return !!(N && N.open && this.netRoom() && this.account && this.account.online); },
  netAsk(msg) {                                          // a request with an answer
    const N = this.net, rid = (N.rid = (N.rid || 0) + 1);
    (N.pending = N.pending || new Map());
    return new Promise((res) => { N.pending.set(rid, res); N.ws.send(JSON.stringify({ ...msg, rid })); setTimeout(() => { if (N.pending.has(rid)) { N.pending.delete(rid); res({ ok: false }); } }, 8000); });
  },
  netPreDrop() { if (!this.player.dead) this.persist(); this.netSaveNow(); },   // your save, with the item still in it: the server checks you had it
  async netDrop(id) {
    const p = this.player;
    const r = await this.netAsk({ t: 'drop', id, x: +p.x.toFixed(2), y: +(p.y + 0.3).toFixed(2) });
    if (r.ok) { this.persist(); return; }
    const f = p.inv.indexOf(null);                         // refused: it comes back to you
    if (f >= 0) p.inv[f] = id; else this.addBag(p.x, p.y + 0.3, [id]);
    this.toast('That could not be dropped here.'); this.events.push({ type: 'ground' });
  },
  async netTake(bag, i, toC, toI) {
    const p = this.player, id = bag.items[i];
    if (!id) return;
    // where it goes: a potion slot it stacks in; an empty slot; an equipment slot it fits, swapping out what was there
    const P = toC === 'pots' ? this.pots() : null, potOk = (k) => !!P && this.isPotion(id) && this.potFits(k, id);
    const C = toC === 'pots' ? null : this.container(toC), slot = toC === 'pots' ? (potOk(toI) ? toI : -1) : C && toI >= 0 && (toC === 'equip' ? this.fitsEquip(toI, id) : !C[toI]) ? toI : -1;
    if (slot < 0 && p.inv.indexOf(null) < 0) { this.toast('Your backpack is full.'); return; }
    const r = await this.netAsk({ t: 'take', bid: bag.bid, i, id });
    if (!r.ok) { this.toast('Someone took it first.'); return; }
    const C2 = toC === 'pots' ? null : this.container(toC);
    if (toC === 'pots' && slot >= 0 && potOk(slot)) { if (P[slot]) P[slot].n++; else P[slot] = { id, n: 1 }; }
    else if (toC === 'equip' && slot >= 0 && C2) {           // swapped in: what you wore goes to your backpack, or back to the ground
      const old = C2[slot]; C2[slot] = id;
      if (old) { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = old; else { this.netPreDrop(); this.netDrop(old); } }
    }
    else if (slot >= 0 && C2 && !C2[slot]) C2[slot] = id;
    else { const f = p.inv.indexOf(null); if (f >= 0) p.inv[f] = id; else this.addBag(p.x, p.y + 0.3, [id]); }
    this.clampVitals(); this.sfx('loot'); this.persist(); this.events.push({ type: 'ground' });
  },
  // a blow on something breakable in a shared place: the server applies it (guards, Life, what breaks) and says
  netObjHit(o, dmg) {
    const N = this.net, i = this.map.objects.indexOf(o);
    if (!N || !N.open || i < 0) return;
    N.ws.send(JSON.stringify({ t: 'ohit', i, k: o.interact || o.sprite || '', d: Math.round(dmg) }));
    if (o.interact === 'chest') { this.float(...lift(o.x, o.y, 0.9), `${Math.round(dmg)}`, '#ffd650'); o.hurtT = this.t; }
    this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 3, colors: ['#c98a44', '#ffd650'] });
  },
  netObj2(i, k) { const o = this.map.objects[i]; return o && (o.interact || o.sprite || '') === k ? o : null; },
  // a shared admin chest: placed, hurt, broken (loot for each who hit it) or gone
  netChest(m) {
    const M = this.map;
    if (!M) return;
    let o = M.objects.find((q) => q.netCid === m.cid);
    if (m.gone) { if (o) { M.objects = M.objects.filter((q) => q !== o); M.solid[Math.floor(o.y) * M.w + Math.floor(o.x)] = 0; M.ogridDirty = true; M.brk = null; } return; }
    if (!o && !m.open) {
      o = { sprite: 'admin_chest', x: m.x, y: m.y, solid: true, interact: 'chest', admin: true, netCid: m.cid, hp: m.hp, maxHp: m.max };
      M.objects.push(o); M.solid[Math.floor(o.y) * M.w + Math.floor(o.x)] = 1; M.ogridDirty = true; M.brk = null;
      if (M.kind === 'nexus') M.nexusChests = true;
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.5, n: 30, colors: ['#ff4af0', '#ffd650', '#ffffff'] });
      return;
    }
    if (!o) return;
    if (m.open) { if ((m.to || []).includes(this.net.id)) this.breakChest(o); else { o.opened = true; o.sprite = 'chest_open'; o.hp = 0; this.eraseChest(o); } M.brk = null; return; }   // yours if you hit it
    o.hp = m.hp; o.hurtT = this.t;
  },
  netBag(m) {                                            // a shared bag: new, changed or gone
    const M = this.map;
    if (!M) return;
    const b = this.bags.find((q) => q.shared && q.bid === m.bid);
    if (m.gone) { if (b) { this.bags = M.bags = this.bags.filter((q) => q !== b); if (this.nearBag === b) this.nearBag = null; this.events.push({ type: 'ground' }); } return; }
    const kind = this.bagKind(m.items) || 'brown';
    if (b) { b.items = m.items; b.kind = kind; } else this.bags.push({ shared: true, bid: m.bid, x: m.x, y: m.y, items: m.items, kind, life: 120, until: this.t + 1e9 });
    this.events.push({ type: 'ground' });
  },
  // ---- milestone 4: accounts and saves on the server (server/db.mjs)
  // wait (a little) for the server: true when it is there
  netWhenOpen(ms) {
    const N = this.net;
    if (!N || !N.url) return Promise.resolve(false);
    if (N.open && N.id) return Promise.resolve(true);
    return new Promise((res) => { (N.waiters = N.waiters || []).push(res); setTimeout(() => res(!!(N.open && N.id)), ms); });
  },
  netHasAccounts() { return !!(this.net && this.net.open && this.net.db); },
  // sign up, sign in, resume, sign out: the server's answer
  netAuth(kind, fields = {}) {
    const N = this.net;
    if (!N || !N.open) return Promise.resolve({ error: 'The server is not answering.' });
    const rid = (N.rid = (N.rid || 0) + 1);
    (N.pending = N.pending || new Map());
    return new Promise((res) => { N.pending.set(rid, res); N.ws.send(JSON.stringify({ t: 'auth', rid, kind, ...fields })); setTimeout(() => { if (N.pending.has(rid)) { N.pending.delete(rid); res({ error: 'The server took too long. Try again.' }); } }, 12000); });
  },
  // your save to the server, a few seconds after the last change (the latest one wins)
  netSave(data) {
    const N = this.net;
    if (!N) return;
    N.saveData = data;
    if (N.saveT) return;
    N.saveT = setTimeout(() => { N.saveT = null; if (N.open && N.saveData) { N.ws.send(JSON.stringify({ t: 'save', data: N.saveData })); N.saveData = null; } }, 3000);
  },
  netSaveNow() { const N = this.net; if (!N) return; clearTimeout(N.saveT); N.saveT = null; if (N.open && N.saveData) { N.ws.send(JSON.stringify({ t: 'save', data: N.saveData })); N.saveData = null; } },
  // the place you share with others: the Nexus or the shared realm (dungeons and your vault are your own, for now)
  netRoom() {
    const m = this.map;
    if (!m || this.mode !== 'play') return null;
    if (m.kind === 'nexus') return 'nexus';
    if (m.kind === 'realm' && this.net && m.seed === this.net.seed) return 'realm:' + m.seed;
    if (m.kind === 'dungeon' && m.netIid) return 'dg:' + m.netIid;                     // a shared dungeon
    return null;
  },
  // the realm's seed: the shared one when the server has given it
  netSeed() { return this.net && this.net.seed ? this.net.seed : 0; },
  netShot(b) { const N = this.net; if (N && N.open && N.shots.length < 24) N.shots.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, a: b.a, s: b.sprite, r: b.r, l: b.life, ...(b.dust ? { d: b.dust } : {}) }); },
  netChat(text) { const N = this.net; if (!N || !N.open) return false; N.ws.send(JSON.stringify({ t: 'chat', text })); return true; },
  netTick(dt) {
    const N = this.net;
    if (!N) return;
    this.netGlide();
    const room = this.netRoom();
    for (const o of N.others.values()) {                   // glide toward where they were last seen; drop the silent
      if (this.t - o.seen > 5 || o.room !== room) { N.others.delete(o.id); continue; }
      const d = Math.hypot(o.tx - o.x, o.ty - o.y);
      if (d > 6) { o.x = o.tx; o.y = o.ty; } else { const k = Math.min(1, dt * 12); o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; }
      if (o.dead) o.deadT += dt;
      if (o.abilityT > 0) o.abilityT -= dt;
    }
    if (!N.open || (N.sendT -= dt) > 0) return;
    N.sendT = SEND;
    const p = this.player;
    if (!p) return;
    const parts = [{ t: 'st', room, name: (this.account && this.account.name) || '', cls: p.cls, x: +p.x.toFixed(2), y: +p.y.toFixed(2), dir: p.dir, mv: !!p.moving, hp: Math.round(p.hp), mhp: Math.round(this.stat('hp')),
      dead: !!p.dead, ab: p.abilityT > 0, sh: this.t - p.lastShot < 0.25, dn: p.danceT > 0, lv: p.level, eq: p.equip }];
    if ((N.statT = (N.statT || 0) - SEND) <= 0) { N.statT = 1; parts[0].stats = Object.fromEntries(['hp', 'mp', 'att', 'def', 'spd', 'dex', 'vit', 'wis'].map((k) => [k, Math.round(this.stat(k))])); parts[0].fame = Math.round(p.fame || 0); }
    if (N.shots.length && room) parts.push({ t: 'shot', room, list: N.shots });
    N.shots = [];
    // (one entry a monster: a spray of shots on a crowd made more than the 60 that used to go, and the rest were lost,
    // so the server's monster outlived yours and stood at 1 Life for good. 2026-10-24)
    if (N.hits.length && this.map.netWorld) { const sum = new Map(); for (const [nid, d] of N.hits) sum.set(nid, (sum.get(nid) || 0) + d); parts.push({ t: 'hits', list: [...sum].slice(0, 200) }); }
    N.hits = [];
    if (this.map.netWorld) for (const e of N.byId.values()) if (e.netPx || e.netPy) { N.efx.push([e.nid, 'push', +e.netPx.toFixed(2), +(e.netPy || 0).toFixed(2)]); e.netPx = e.netPy = 0; }
    if (N.efx.length && this.map.netWorld) parts.push({ t: 'efx', list: N.efx.slice(0, 40) });
    N.efx = [];
    N.ws.send(JSON.stringify(parts.length === 1 ? parts[0] : { t: 'tk', parts }));   // (one message a tick, whatever it holds)
  },
  // ---- stage 2, milestone 1: the shared realm's monsters are the server's (server/world.mjs)
  // this realm is the shared one and the server runs its monsters: ours go, theirs come
  netWorldCheck() {
    const N = this.net, m = this.map;
    if (!N || !N.world || !N.open || !m || m.netWorld) return;
    if (!(m.kind === 'realm' && m.seed === N.seed) && !(m.kind === 'dungeon' && m.netIid && (!m.rf || m.netServed)) && !(m.kind === 'nexus' && N.nexusWorld)) return;
    m.netWorld = true; N.byId.clear(); N.held = new Map();
    for (const o of m.objects) if (o.guards) o.guards = null;   // (camp chests: the server's guards are the ones that count)
    this.enemies = m.enemies = [];
  },
  // the server is gone: the realm runs its own monsters again
  netWorldOff() {
    const m = this.realmMap;
    if (!m || !m.netWorld) return;
    m.netWorld = false; this.net.byId.clear();
    if (this.map === m) { this.enemies = m.enemies = this.enemies.filter((e) => !e.net); }
  },
  // the monsters near you: new ones (with what they are), changes to known ones, and those gone
  netWorldState(m) {
    const N = this.net, M = this.map;
    if (!M || !M.netWorld) return;
    const off = this.t - (m.T || 0), TIMED = /Until$|^born$/;              // the server's clock to ours
    for (const s of m.es) for (const k in s) if (TIMED.test(k) && typeof s[k] === 'number') s[k] += off;
    for (const s of m.es) {
      let e = N.byId.get(s.nid);
      if (!e) {
        if (!s.D) continue;
        e = { cds: [], queue: [], hurtT: 0, deadT: 0, phase: 0, state: 'move', st: 0, ...s, net: true, tx: s.x, ty: s.y, netHp: s.hp };
        if (!e.id) e.id = s.D.id || '';
        if (e.D.bx) { this.bxSetup(e); if (e.bx.anim) e.bx.anim.handlers = { ended: [] }; if (!e.bx.arena && M.rooms) e.bx.arena = M.rooms.find((r) => e.x >= r.x && e.x < r.x + r.w && e.y >= r.y && e.y < r.y + r.h) || null; }   // (its room, which it draws in: the Orrery's starfield)   // a three-phase boss: its art here, its mind on the server
        this.netBx(e, s, off);
        N.byId.set(s.nid, e); this.enemies.push(e);
        continue;
      }
      const { x, y, D, ...rest } = s;
      Object.assign(e, rest);
      if (rest.hp !== undefined) e.netHp = rest.hp;
      this.netBx(e, s, off);
      if (x !== undefined) e.tx = x;
      if (y !== undefined) e.ty = y;
    }
    for (const [nid, how] of m.gone) {
      const e = N.byId.get(nid);
      if (!e) continue;
      N.byId.delete(nid);
      if (how === -1) { this.enemies = M.enemies = this.enemies.filter((o) => o !== e); continue; }   // out of sight
      if (M.kind === 'dungeon' && M.rooms) { const ri = M.rooms.findIndex((r) => e.x >= r.x && e.x < r.x + r.w && e.y >= r.y && e.y < r.y + r.h); if (ri >= 0) { (M.netDeadRooms = M.netDeadRooms || new Set()).add(ri); const K = (M.netKills = M.netKills || {}), r0 = (K[ri] = K[ri] || {}); r0[e.id] = (r0[e.id] || 0) + 1; } }   // (where its monsters fell: rooms you cleared, if the server has to make the dungeon again)
      e.x = e.tx; e.y = e.ty;
      // (bxKill: a three-phase boss is in its death clip by now, immune; this blow is only the kill, so it must land:
      // without it a shared boss never died for you, and dropped nothing. 2026-10-22)
      if (how === 1) { e.netKill = true; e.bxKill = true; e.hp = 0; e.spawnT = 0; e.bulwarkT = 0; e.wardT = 0; this.damageEnemy(e, 1, e.x, e.y, true); }   // yours too: your rewards
      if (!e.dead) { e.dead = true; e.deadT = 0; this.vx({ k: 'death', e, big: !!e.rb }); }
      if (M.rf && e.rfSid !== undefined) this.rfNetDeath(e.rfSid, how === 1);   // a Realmforge creature: your copy of its dungeon counts it (its room, its key, its gate)
    }
  },
  // what the shared monsters did this moment: their shots (dodged and taken here), ground zones, effects, words
  netWorldEvents(ev) {
    if (!this.map.netWorld) return;
    // while this tab is hidden the game stands still but the server's messages keep coming: its shots and ground
    // effects would pile up, frozen, and all go off when you came back. They are stale by then: let them go.
    const away = typeof document !== 'undefined' && document.hidden;
    for (const x of ev) {
      if (away && (x.k === 'shot' || x.k === 'fx' || x.k === 'vx' || x.k === 'su' || x.k === 'sg')) continue;
      if (x.k === 'shot') {
        const b = x.b; b.hit = b.pierce ? new Set() : null; b.netRemote = true; this.projectiles.push(b);
        { const h = b.h ?? 0.5, a = this.camAngle || 0; if (a) { b.x -= h * Math.sin(a); b.y -= h * (Math.cos(a) - 1); if (b.lob) { b.lob.x0 -= h * Math.sin(a); b.lob.y0 -= h * (Math.cos(a) - 1); } } }   // (the server's camera never turns: see liftShift)
        // (born on top of you, a boss shot is harmless until it leaves you: judged here, by where you are, not where the
        // server last had you; it used to stay faint and harmless for good. 2026-10-24)
        if (b.fair) { const p = this.player; b.fair = !!p && Math.hypot(b.x - p.x, b.y - (p.y - 0.45)) < 1.3; b.ghost = b.fair; }
        if (b.netHeld) { (this.net.held = this.net.held || new Map()).set(b.sid, b); b.vx = b.vx || 0; b.vy = b.vy || 0; b.life = Math.max(b.life, 30); }   // held by its boss: the server moves it
      }
      else if (x.k === 'su' || x.k === 'sg') {           // a held shot moved, flew free, or ended
        const H = this.net.held, b = H && H.get(x.sid);
        if (!b) continue;
        if (x.k === 'sg') { b.life = 0; H.delete(x.sid); continue; }
        { const h = b.h ?? 0.5, a = this.camAngle || 0; if (a) { x.x -= h * Math.sin(a); x.y -= h * (Math.cos(a) - 1); } }   // (the server's camera never turns, as for a new shot)
        // between the server's word on it (10 a second) it glides evenly from where it is drawn to where the server last
        // had it, over the time between its words (netGlide): it used to guess on in a straight line and snap back at each
        // word, and the Orrery's closing rings and spirals stuttered ten times a second (2026-10-27)
        const dur = b.netAt !== undefined ? Math.max(0.05, Math.min(0.3, this.t - b.netAt)) : 0.1;
        b.netPx = b.x; b.netPy = b.y; b.netTx = x.x; b.netTy = x.y; b.netAt = this.t; b.netDur = dur; b.vx = 0; b.vy = 0;
        if (Math.hypot(x.x - b.x, x.y - b.y) > 3) { b.x = b.netPx = x.x; b.y = b.netPy = x.y; }   // (too far to glide: it is there)
        if (x.g !== undefined) { b.ghost = !!x.g || !!b.fair; b.hidden = !!x.hd; }   // (its boss lights it or hides it as it goes)
        if (x.vx !== undefined) { b.x = x.x; b.y = x.y; b.netTx = undefined; b.vx = x.vx; b.vy = x.vy; b.a = x.a; b.life = x.life; b.netHeld = false; H.delete(x.sid); }   // (flying free: from where the server let it go)
      }
      else if (x.k === 'fx') this.fx.push(x.f);
      else if (x.k === 'vx') this.vx(x.v);
      else if (x.k === 'banner') this.banner(x.text, x.ms);
      else if (x.k === 'narrate') this.narrate(x.text);   // the dungeon's story, as the server tells it
      else if (x.k === 'say') { const e = this.net.byId.get(x.id); if (e) this.bubble(e, x.text, x.col); }
      else if (x.k === 'exit') {                         // the dungeon's master has fallen: the way out (for all; yours if you dealt a blow)
        const M = this.map;
        if (M.kind === 'dungeon' && !M.portals.some((q) => q.to === 'realm' && q.life && Math.hypot(q.x - x.x, q.y - x.y) < 4)) M.portals.push({ kind: 'realm', x: x.x + 1.5, y: x.y + 1, label: this.exitLabel(), to: 'realm', life: 90 });
        this.banner(`${x.name} has fallen!`, 3000);
      }
      else if (x.k === 'ostate') { const o = this.netObj2(x.i, x.key); if (o) { const { opened, ...f } = x.f; Object.assign(o, f); if (opened && !o.opened) { o.opened = true; o.sprite = f.sprite || 'chest_open'; if (o.interact === 'chest' || /chest/.test(o.sprite)) this.eraseChest(o); } this.map.brk = null; this.map.ogridDirty = true; } }   // something broke or changed, for all
      else if (x.k === 'tile') this.netTile(x.a);
      else if (x.k === 'obj') this.netObj(x.o);
    }
  },
  // the shots a boss holds and moves itself, between the server's words on them: each glides to where it last was
  netGlide() {
    const H = this.net.held;
    if (!H) return;
    for (const b of H.values()) if (b.netTx !== undefined) { const f = Math.min(1, (this.t - b.netAt) / b.netDur); b.x = b.netPx + (b.netTx - b.netPx) * f; b.y = b.netPy + (b.netTy - b.netPy) * f; }
  },
  // a puppet between updates: it glides to where the server last had it; its burns tick here (the damage is reported);
  // a slow you put on it goes to the server; a boss's animation plays on
  netPuppet(e, dt) {
    const d = Math.hypot(e.tx - e.x, e.ty - e.y);
    if (d > 5) { e.x = e.tx; e.y = e.ty; } else { const k = Math.min(1, dt * 10); e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; }
    if (e.hurtT > 0) e.hurtT = Math.max(0, e.hurtT - dt);
    // its Life is the server's: a guess of yours the server hasn't borne out in 2s (your blows lost, or not taken) gives way to it
    if (e.netHp > e.hp && this.t - (e.netHitT || 0) > 2) e.hp = e.netHp;
    this.tickStatus(e, dt);                              // its burn ticks here (the damage is reported); a slow or curse you put on it wears off here too
    if (e.stunT > 0) e.stunT -= dt;                       // (and a stun, between the server's word on it)
    if (e.slowT > 0 && e.slowF > 0 && (e.slowF !== e.netSF || e.slowT > (e.netST || 0) + 0.3)) { e.netSF = e.slowF; e.netST = e.slowT; this.netEfx(e, 'slow', e.slowT, e.slowF); }
    if (e.bx && e.bx.anim) e.bx.anim.update(dt);
    if (e.pulseUntil > this.t && this.map.rf) { const p = this.player, d = Math.hypot(p.x - e.x, p.y - e.y); if (!p.dead && d < 8 && d > 0.4) { const k = (3.5 * dt) / d; this.moveCircle(p, (p.x - e.x) * k, (p.y - e.y) * k, 0.3); } }   // a Realmforge pulse pushes you away
    if (e.chainNid !== undefined) e.chainTo = (e.chainNid && this.net.byId.get(e.chainNid)) || null;   // (its lightning, to the one the server joins it to)
    if (e.bx) {                                          // its planets, black holes...: gliding to where the server has them
      // (each goes evenly from where it is drawn to where the server last had it, over the time between its words: it
      // used to catch up and stop, ten times a second, and shook)
      const go = (o) => { if (o && o.netTx !== undefined) { const f = Math.min(1, (this.t - o.netAt) / o.netDur); o.x = o.netPx + (o.netTx - o.netPx) * f; o.y = o.netPy + (o.netTy - o.netPy) * f; } };
      for (const n in e.bx) { const v = e.bx[n]; if (Array.isArray(v)) { for (const o of v) go(o); } else if (v && typeof v === 'object') go(v); }
    }
  },
  netEfx(e, k, a, b = 0) { const N = this.net; if (N && N.open && e.net) N.efx.push([e.nid, k, +(+a).toFixed(2), +(+b).toFixed(2)]); },
  // a three-phase boss's phase and clip, as the server has them
  netBx(e, s, off = 0) {
    const S = e.bx;
    if (!S) return;
    // the rest of its fight, as the server has it (server/world.mjs plain): its clocks to ours; what moves glides there
    const TIMED = /^(until|born|at|end)$|Until$|At$/;
    const shift = (v) => { if (v && typeof v === 'object') for (const k in v) { if (typeof v[k] === 'number' && TIMED.test(k)) v[k] += off; else if (v[k] && typeof v[k] === 'object') shift(v[k]); } return v; };
    const now = this.t, glide = (o, n) => {
      if (!(o && n && typeof o === 'object' && typeof n === 'object' && typeof o.x === 'number' && typeof n.x === 'number' && Math.hypot(n.x - o.x, n.y - o.y) < 4)) return;
      n.netPx = o.x; n.netPy = o.y; n.netTx = n.x; n.netTy = n.y; n.netDur = Math.max(0.06, Math.min(0.25, o.netAt === undefined ? 0.1 : now - o.netAt)); n.netAt = now; n.x = o.x; n.y = o.y;
    };
    for (const k in s) {
      if (!k.startsWith('bxv_')) continue;
      const name = k.slice(4), w = s[k];
      if (typeof w !== 'string') { S[name] = w; continue; }
      if (w === 'N') { S[name] = null; continue; }
      if (w[0] === 'S') { S[name] = w.slice(1); continue; }
      let v; try { v = shift(JSON.parse(w.slice(1))); } catch { continue; }
      const old = S[name];
      if (Array.isArray(v) && Array.isArray(old) && old.length === v.length) v.forEach((n, i) => glide(old[i], n)); else if (v && !Array.isArray(v)) glide(old, v);
      S[name] = v;
    }
    if (s.bx_phase !== undefined) S.phase = s.bx_phase;
    if (s.bx_state !== undefined) S.state = s.bx_state;
    if (s.bx_leapZ !== undefined) S.leapZ = s.bx_leapZ;
    if (s.bx_drawK !== undefined) S.drawK = s.bx_drawK;
    if (S.anim && s.bx_clip && S.anim.def.anims[s.bx_clip] && S.anim.clip !== s.bx_clip) S.anim.play(s.bx_clip);
    if (S.anim && s.bx_spd !== undefined) S.anim.speed = s.bx_spd;
  },
  // ---- milestone 3: shared dungeons
  // a dungeon portal in the shared realm: ask the server to open it for everyone (true: handled)
  netPortal(to, x, y, life) {
    const N = this.net, m = this.map;
    if (!N || !N.open || !m || !m.netWorld || (m.kind !== 'realm' && m.kind !== 'nexus') || !NET_DUNGEONS(to)) return false;
    N.ws.send(JSON.stringify({ t: 'portal', to, x: +x.toFixed(2), y: +y.toFixed(2), life }));
    return true;
  },
  // the shared portal you are stepping through: its instance and seed
  netTakeEnter(where) { const q = this.netEnterNext; this.netEnterNext = null; return q && (DUNGEON_DEFS[where] || where.startsWith('rf_')) ? q : null; },
  // you used something in a shared dungeon: the server uses it too (by its place in the dungeon's list)
  netRfGate(i) { const N = this.net; if (N && N.open && this.map.netWorld) N.ws.send(JSON.stringify({ t: 'rfgate', i })); },   // a Realmforge gate you opened: the server opens it for all
  netUse(o) { const N = this.net, i = this.map.objects.indexOf(o); if (N && N.open && i >= 0) N.ws.send(JSON.stringify({ t: 'use', i, k: o.interact || o.sprite || '' })); },
  // the dungeon as the server has it: tiles changed (gates opened, walls broken) and things' states (chests, levers)
  netDungeonState(m) {
    const M = this.map;
    if (M.rf) { this.rfNetTiles(m.tiles || []); return; }      // a Realmforge dungeon: what the server opened, opened in your copy (src/rf/host.js)
    for (const [i, tid, solid] of m.tiles || []) { M.tiles[i] = tid; if (M.solid) M.solid[i] = solid; if (!solid && M.veil) this.unveil(i % M.w, Math.floor(i / M.w)); }   // (a cracked wall the server broke: its secret room can be seen)
    if ((m.tiles || []).length) { M.miniDirty = true; M.tilesV = (M.tilesV || 0) + 1; M.ogridDirty = true; }
    for (const [i, k, f] of m.objs || []) { const o = M.objects[i]; if (o && (o.interact || o.sprite || '') === k) Object.assign(o, f); }
    if ((m.objs || []).length) M.ogridDirty = true;
  },
  // the land as the server's events changed it: an arena raised, trees grown
  netTile(a) { if (!this.map.netWorld) return; const [x, y, tid, skin] = a; this.evSet(x, y, tid, skin); this.map.miniDirty = true; this.map.tilesV = (this.map.tilesV || 0) + 1; },
  netObj(o) { if (!this.map.netWorld || !o) return; this.map.objects.push(o); this.map.ogridDirty = true; },
  // the others here now, for the renderer and the nearby list
  netHere() { const N = this.net, room = this.netRoom(); return N && room ? [...N.others.values()].filter((o) => o.room === room) : []; },
};
export function installNet(Game) {
  Object.assign(Game.prototype, methods);
  // your blow on a shared monster goes to the server too (it keeps the true Life, and says who dealt the blows)
  const dmg0 = Game.prototype.damageEnemy;
  Game.prototype.damageEnemy = function (e, ...a) {
    const d = dmg0.call(this, e, ...a);
    if (e && e.net && !e.netKill && d > 0 && this.net && this.net.open) { this.net.hits.push([e.nid, Math.round(d)]); e.netHitT = this.t; }
    return d;
  };
}
