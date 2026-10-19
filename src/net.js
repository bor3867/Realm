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
    this.net = { url, ws: null, id: 0, seed: 0, others: new Map(), shots: [], sendT: 0, wait: 2, online: 0, open: false };
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
      N.open = false; N.ws = null; N.others.clear();
      setTimeout(() => this.netConnect(), N.wait * 1000); N.wait = Math.min(30, N.wait * 2);
    };
    ws.onerror = () => {};
  },
  netOn(m) {
    const N = this.net;
    if (m.t === 'welcome') {
      N.id = m.id; N.online = m.online;
      if (N.seed !== m.seed) { N.seed = m.seed; if (this.realmMap && this.realmMap.seed !== m.seed && this.map !== this.realmMap) this.realmMap = null; }   // the shared realm from now on
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
    } else if (m.t === 'chat') this.say(`${m.name}: ${m.text}`, m.id === N.id ? '#e9e4f2' : '#bfe8ff');
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
  },
  // the others here now, for the renderer and the nearby list
  netHere() { const N = this.net, room = this.netRoom(); return N && room ? [...N.others.values()].filter((o) => o.room === room) : []; },
};
export function installNet(Game) { Object.assign(Game.prototype, methods); }
