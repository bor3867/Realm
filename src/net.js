// Multiplayer, stage 1 (server/server.mjs): you see the other players. This browser tells the server where its player
// is, what it is doing and the shots it fires; it hears the same from everyone else in the same place (the Nexus, the
// shared realm) and draws them, moving smoothly between updates. Their shots are drawn only: they hurt nothing here.
// Chat goes to everyone online. Monsters, loot and saves stay this browser's own. The server also hands out the realm's
// seed, so every player walks the same land. With no server (none set, or it is down) the game plays alone as before.
// Mixed into Game; game.js calls netTick every frame, shoot() reports your shots, enter() asks netSeed for the realm.

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
    ws.onopen = () => { N.open = true; N.wait = 2; ws.send(JSON.stringify({ t: 'hi', name: (this.account && this.account.name) || '', cls: this.player ? this.player.cls : '' })); };
    ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } this.netOn(m); };
    ws.onclose = () => {                                  // gone: everyone vanishes; try again, waiting longer each time
      N.open = false; N.ws = null; N.others.clear(); this.netWorldOff();
      setTimeout(() => this.netConnect(), N.wait * 1000); N.wait = Math.min(30, N.wait * 2);
    };
    ws.onerror = () => {};
  },
  netOn(m) {
    const N = this.net;
    if (m.t === 'welcome') {
      N.id = m.id; N.online = m.online; N.world = !!m.world;
      if (N.seed !== m.seed) { N.seed = m.seed; if (this.realmMap && this.realmMap.seed !== m.seed && this.map !== this.realmMap) this.realmMap = null; }   // the shared realm from now on
      if (this.map && this.map === this.realmMap) this.netWorldCheck();
    } else if (m.t === 'online') N.online = m.n;
    else if (m.t === 'st') {
      let o = N.others.get(m.id);
      if (!o) { o = { remote: true, id: m.id, x: m.x, y: m.y, status: {}, deadT: 0, lastShot: -9, shotPeriod: 0.3, abilityT: 0, hitT: 0, danceT: 0 }; N.others.set(m.id, o); }
      Object.assign(o, { name: m.name, cls: m.cls, tx: m.x, ty: m.y, dir: m.dir, moving: m.mv, hp: m.hp, maxHp: m.mhp, level: m.lv, seen: this.t, room: this.netRoom() });
      if (m.dead && !o.dead) o.deadT = 0;
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
      }
    } else if (m.t === 'ws') this.netWorldState(m);
    else if (m.t === 'wev') this.netWorldEvents(m.ev);
    else if (m.t === 'wlog') { if (this.map.netWorld) { for (const a of m.tiles) this.netTile(a); for (const o of m.objs) this.netObj(o); } }
    else if (m.t === 'hurt') { if (this.map.netWorld && !this.player.dead) this.hurtPlayer(m.d, m.by, m.ap); }
    else if (m.t === 'chat') this.say(`${m.name}: ${m.text}`, m.id === N.id ? '#e9e4f2' : '#bfe8ff');
  },
  // the place you share with others: the Nexus or the shared realm (dungeons and your vault are your own, for now)
  netRoom() {
    const m = this.map;
    if (!m || this.mode !== 'play') return null;
    if (m.kind === 'nexus') return 'nexus';
    if (m.kind === 'realm' && this.net && m.seed === this.net.seed) return 'realm:' + m.seed;
    return null;
  },
  // the realm's seed: the shared one when the server has given it
  netSeed() { return this.net && this.net.seed ? this.net.seed : 0; },
  netShot(b) { const N = this.net; if (N && N.open && N.shots.length < 24) N.shots.push({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, a: b.a, s: b.sprite, r: b.r, l: b.life }); },
  netChat(text) { const N = this.net; if (!N || !N.open) return false; N.ws.send(JSON.stringify({ t: 'chat', text })); return true; },
  netTick(dt) {
    const N = this.net;
    if (!N) return;
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
    N.ws.send(JSON.stringify({ t: 'st', room, name: (this.account && this.account.name) || '', cls: p.cls, x: +p.x.toFixed(2), y: +p.y.toFixed(2), dir: p.dir, mv: !!p.moving, hp: Math.round(p.hp), mhp: Math.round(this.stat('hp')),
      dead: !!p.dead, ab: p.abilityT > 0, sh: this.t - p.lastShot < 0.25, dn: p.danceT > 0, lv: p.level }));
    if (N.shots.length && room) { N.ws.send(JSON.stringify({ t: 'shot', room, list: N.shots })); }
    N.shots = [];
    if (N.hits.length && this.map.netWorld) N.ws.send(JSON.stringify({ t: 'hits', list: N.hits.slice(0, 60) }));
    N.hits = [];
    if (this.map.netWorld) for (const e of N.byId.values()) if (e.netPx || e.netPy) { N.efx.push([e.nid, 'push', +e.netPx.toFixed(2), +(e.netPy || 0).toFixed(2)]); e.netPx = e.netPy = 0; }
    if (N.efx.length && this.map.netWorld) N.ws.send(JSON.stringify({ t: 'efx', list: N.efx.slice(0, 40) }));
    N.efx = [];
  },
  // ---- stage 2, milestone 1: the shared realm's monsters are the server's (server/world.mjs)
  // this realm is the shared one and the server runs its monsters: ours go, theirs come
  netWorldCheck() {
    const N = this.net, m = this.map;
    if (!N || !N.world || !N.open || !m || m.kind !== 'realm' || m.seed !== N.seed || m.netWorld) return;
    m.netWorld = true; N.byId.clear();
    this.enemies = m.enemies = [];
    this.boss = null;
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
        e = { cds: [], queue: [], hurtT: 0, deadT: 0, phase: 0, state: 'move', st: 0, ...s, net: true, tx: s.x, ty: s.y };
        if (!e.id) e.id = s.D.id || '';
        if (e.D.bx) { this.bxSetup(e); if (e.bx.anim) e.bx.anim.handlers = {}; }   // a three-phase boss: its art here, its mind on the server
        this.netBx(e, s);
        N.byId.set(s.nid, e); this.enemies.push(e);
        continue;
      }
      const { x, y, D, ...rest } = s;
      Object.assign(e, rest);
      this.netBx(e, s);
      if (x !== undefined) e.tx = x;
      if (y !== undefined) e.ty = y;
    }
    for (const [nid, how] of m.gone) {
      const e = N.byId.get(nid);
      if (!e) continue;
      N.byId.delete(nid);
      if (how === -1) { this.enemies = M.enemies = this.enemies.filter((o) => o !== e); continue; }   // out of sight
      e.x = e.tx; e.y = e.ty;
      if (how === 1) { e.netKill = true; e.hp = 0; e.spawnT = 0; e.bulwarkT = 0; e.wardT = 0; this.damageEnemy(e, 1, e.x, e.y, true); }   // yours too: your rewards
      if (!e.dead) { e.dead = true; e.deadT = 0; this.vx({ k: 'death', e, big: !!e.rb }); }
    }
  },
  // what the shared monsters did this moment: their shots (dodged and taken here), ground zones, effects, words
  netWorldEvents(ev) {
    if (!this.map.netWorld) return;
    for (const x of ev) {
      if (x.k === 'shot') { const b = x.b; b.hit = b.pierce ? new Set() : null; b.netRemote = true; this.projectiles.push(b); }
      else if (x.k === 'fx') this.fx.push(x.f);
      else if (x.k === 'vx') this.vx(x.v);
      else if (x.k === 'banner') this.banner(x.text, x.ms);
      else if (x.k === 'say') { const e = this.net.byId.get(x.id); if (e) this.bubble(e, x.text, x.col); }
      else if (x.k === 'tile') this.netTile(x.a);
      else if (x.k === 'obj') this.netObj(x.o);
    }
  },
  // a puppet between updates: it glides to where the server last had it; its burns tick here (the damage is reported);
  // a slow you put on it goes to the server; a boss's animation plays on
  netPuppet(e, dt) {
    const d = Math.hypot(e.tx - e.x, e.ty - e.y);
    if (d > 5) { e.x = e.tx; e.y = e.ty; } else { const k = Math.min(1, dt * 10); e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; }
    if (e.hurtT > 0) e.hurtT = Math.max(0, e.hurtT - dt);
    if (e.burn && e.burn.t > 0) this.tickStatus(e, dt);
    if (e.slowT > 0 && e.slowF > 0 && (e.slowF !== e.netSF || e.slowT > (e.netST || 0) + 0.3)) { e.netSF = e.slowF; e.netST = e.slowT; this.netEfx(e, 'slow', e.slowT, e.slowF); }
    if (e.bx && e.bx.anim) e.bx.anim.update(dt);
  },
  netEfx(e, k, a, b = 0) { const N = this.net; if (N && N.open && e.net) N.efx.push([e.nid, k, +(+a).toFixed(2), +(+b).toFixed(2)]); },
  // a three-phase boss's phase and clip, as the server has them
  netBx(e, s) {
    const S = e.bx;
    if (!S) return;
    if (s.bx_phase !== undefined) S.phase = s.bx_phase;
    if (s.bx_state !== undefined) S.state = s.bx_state;
    if (s.bx_leapZ !== undefined) S.leapZ = s.bx_leapZ;
    if (s.bx_drawK !== undefined) S.drawK = s.bx_drawK;
    if (S.anim && s.bx_clip && S.anim.def.anims[s.bx_clip] && S.anim.clip !== s.bx_clip) S.anim.play(s.bx_clip);
    if (S.anim && s.bx_spd !== undefined) S.anim.speed = s.bx_spd;
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
    if (e && e.net && !e.netKill && d > 0 && this.net && this.net.open) this.net.hits.push([e.nid, Math.round(d)]);
    return d;
  };
}
