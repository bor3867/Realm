// Sunthief's Castle, after the eruption (the user's map and its journey, 2026-11-02; src/world/maps.js LAYOUT.throne,
// m.castle.rooms): each room's name as you come in, each part of the castle its own light, its hazards, the arrival's door
// and the Sunthief Gate, mixed into Game like gearmech.js. Nothing here runs while you are dead; every hazard is shown
// before it hurts.
//   the arrival       safe; its door onto the battlements opens 3 s after you land (2.5 s of protection there)
//   the causeway      a geyser every 4 s on the lanes near you, never where you stand: 1.2 s marked, then it bursts (110)
//   the battlements, the fallen tower, the chain bridge   stones and burning wreckage fall about you: each marked 1.1 s
//                     (90; on the chain bridge an eruption, 110, throwing four blobs)
//   the hammer hall   its presses slam across the hall by turns: their rows glow 0.9 s, then come down (110)
//   the Sunthief Gate once its seals are broken (both Jarls and Ashkar): walk into its portal and a 1.0 s fade takes you
//                     to the Eclipse Walk, 2.5 s of grace there
import { R } from './util.js';
import { TID } from './world/maps.js';
import { ENEMIES, WAVES } from './data/enemies.js';

const inR = (n, x, y) => n && x >= n.x && y >= n.y && x < n.x + n.w && y < n.y + n.h;
const D = (n) => n + 4;
// each region of the castle its own light (2026-11-02, the user: "the castle changes brightness abruptly... establish a
// cohesive lighting system based on dungeon regions... transition smoothly between neighbouring rooms and hallways"):
// the eruption's smoky orange dark outside, the Hollow Court's cold violet, the forges deep charcoal (their molten light
// is their own lamps'), Ashkar's red, the eclipse darker purple-black the further along it, the sanctum near-black but
// for the stolen sun. [r, g, b, alpha] of the dark laid over the floor (under every shot: they always read).
const AMBIENT = { gate: [42, 18, 10, 0.4], siege: [38, 16, 10, 0.42], court: [16, 10, 32, 0.46], forge: [22, 12, 10, 0.48], ashkar: [36, 8, 6, 0.48],
  eclipse: [10, 4, 24, 0.54], sanctum: [8, 3, 10, 0.6] };
const DEEPER = { walk: 0, eclipseshrine: 0.05, walk2: 0.1, a49: 0.03, a50: 0.06 };
const GOLDEN = { a51: [34, 22, 26, 0.5] };                          // (the Sanctum Ascent: the stolen sun's gold coming into the violet dark)        // (along the eclipse: each part a little darker)
const roomAmb = (n) => { if (GOLDEN[n.key]) return GOLDEN[n.key]; const A = AMBIENT[n.sect]; if (!A) return null; const d = DEEPER[n.key] ?? DEEPER[n.kind] ?? 0; return d ? [A[0], A[1], A[2], A[3] + d] : A; };
const distR = (n, x, y) => Math.hypot(Math.max(n.x - x, 0, x - (n.x + n.w)), Math.max(n.y - y, 0, y - (n.y + n.h)));
// what falls about you, by room: [every, damage, what]; the Long Siege's (2026-11-02): burning branches in the forest,
// rockfall on the ascent, the gorge erupting under the span, siege fire on the barbican, his sigils flaring in the chapel,
// the solar vents in the valves' floor
const FALLING = { battlements: [1.8, 90, 'falling stones'], towerfall: [1.5, 90, 'falling masonry'], chainbridge: [1.3, 110, 'an eruption'],
  ashforest: [1.7, 90, 'a burning branch'], ascent: [1.6, 95, 'falling rocks'], span: [1.3, 110, 'an eruption'], barbican: [1.4, 100, 'siege fire'],
  chapel: [1.9, 105, 'a sigil of his'], valves: [1.5, 110, 'a solar vent'] };
const FALL_COL = { chainbridge: ['#ff6a1c', '#ffd650'], span: ['#ff6a1c', '#ffd650'], chapel: ['#b884cc', '#e6c8ff'], valves: ['#ffd650', '#fff6c8'] };

const methods = {
  // the light where you stand: every room near you by how near (inside one, it is all its own; in a hallway between two,
  // a mix of both), eased toward over about a second, so no doorway switches the screen's brightness at a step. A boss
  // may darken its own room (Solkhar's sanctum as his sun is torn from him): m.ambBoss, while you are in it.
  castleLight(dt, Rm, here) {
    const m = this.map, p = this.player, S = m.castle.st;
    let w = 0; const T = [0, 0, 0, 0];
    for (const k in Rm) {
      const n = Rm[k], d = distR(n, p.x, p.y); if (d > 16) continue;
      const A = n === here && m.ambBoss && here.sect === 'sanctum' ? m.ambBoss : roomAmb(n); if (!A) continue;
      const q = d === 0 ? 1e3 : 1 / (1 + (d * d) / 9) ** 2;
      for (let i = 0; i < 4; i++) T[i] += A[i] * q;
      w += q;
    }
    if (!w) return;
    for (let i = 0; i < 4; i++) T[i] /= w;
    const cur = S.amb || (S.amb = T.slice()), k = 1 - Math.exp(-dt / 0.7);
    for (let i = 0; i < 4; i++) cur[i] += (T[i] - cur[i]) * k;
    m.ambient = `rgba(${Math.round(cur[0])},${Math.round(cur[1])},${Math.round(cur[2])},${cur[3].toFixed(3)})`;
  },
  castleTick(dt) {
    const m = this.map, C = m.castle, p = this.player;
    if (!C || !C.rooms || p.dead) return;
    const Rm = C.rooms, S = C.st || (C.st = { t0: this.t, geyser: 2, fall: 1, press: 1, pressK: 0, said: {} });
    this.castleParty();
    const key = Object.keys(Rm).find((k) => inR(Rm[k], p.x, p.y)), n = key && Rm[key];
    if (key && !S.said[key]) { S.said[key] = true; this.castleEnter(key, n); }
    this.castleLight(dt, Rm, n);
    // Realmfall Hollow: no attack while you arrive; four seconds on, three Cinder Bats out of the trees to the north
    // (on a shared castle the server's copy alone makes monsters and hazards: a player's copy that did too made its own,
    // seen and felt by that player only, doubled)
    if (!S.bats && !m.netWorld && this.t - S.t0 > 4 && Rm.a01 && this.spawnPending) { S.bats = true; const A = Rm.a01; this.spawnPending([0.3, 0.5, 0.7].map((f) => ['cinder_bat', A.x + f * A.w, A.y + 3])); }
    // the locks (src/world/castle_plan.js LOCKS): each way's gate opens when what holds it is done
    for (const L of C.locks || []) if (!L.open && this.castleCond(L.cond, Rm)) { L.open = true; this.castleOpen(L.name); this.banner(L.say, 3000); }
    C.goal = n ? this.castleGoal(n, Rm, S) : null;
    this.castleMechs(dt, Rm, S);
    if (this.castleLater) this.castleLater = this.castleLater.filter((q) => { if (this.t < q.t) return true; q.f(); return false; });
    if (!m.netWorld) { this.castleWaves(Rm, S); this.castleGeysers(dt, S); if (n && n.form) this.castleHazard(dt, n, S); }
    // a gate the server opened (its tile back to the floor): open in this copy too
    for (const w of Object.keys(C.gates || {})) for (const o of C.gates[w]) if (o.solid && !m.solid[Math.floor(o.y) * m.w + Math.floor(o.x)] && m.tiles[Math.floor(o.y) * m.w + Math.floor(o.x)] !== TID.cobble) { o.solid = false; o.sprite = 'gate_open'; const L = (C.gateLooks || {})[w]; if (L && L.length && L[0].sprite === 'castle_decor/' + L[0].look) for (const v of L) v.sprite = 'castle_decor/' + (v.look === 'portcullis' ? 'gate_portcullis_open' : v.look + '_open'); }
    if (!n) return;
    // the causeway: geysers on the lanes near you
    if ((n.kind === 'causeway' || n.kind === 'span') && (S.geyser -= dt) <= 0) {
      S.geyser = 4;
      for (let k = 0; k < 2; k++) {
        const x = p.x + (R() - 0.5) * 8, y = p.y + (R() - 0.5) * 6, tx = Math.floor(x), ty = Math.floor(y);
        if (!inR(n, tx, ty) || m.solid[ty * m.w + tx] || m.tiles[ty * m.w + tx] === TID.lava || Math.hypot(x - p.x, y - p.y) < 1.5) continue;
        this.fx.push({ kind: 'zone', x: tx + 1, y: ty + 1, r: 1.1, t: 0, delay: 1.2, life: 1.55, dmg: D(110), by: 'a magma geyser', done: false, colors: ['#ff8a1f', '#ffd650'] });
      }
    }
    // stones, wreckage, eruptions falling about you
    const F = FALLING[n.kind];
    if (F && (S.fall -= dt) <= 0) {
      S.fall = F[0];
      const x = p.x + (R() - 0.5) * 7, y = p.y + (R() - 0.5) * 6;
      if (inR(n, x, y) && !m.solid[Math.floor(y) * m.w + Math.floor(x)] && Math.hypot(x - p.x, y - p.y) > 0.8) this.fx.push({ kind: 'zone', x, y, r: 1.0, t: 0, delay: 1.1, life: 1.25, dmg: D(F[1]), by: F[2], done: false, colors: FALL_COL[n.kind] || ['#8a7a6a', '#ff8a1f'], shards: n.kind === 'chainbridge' || n.kind === 'span' ? 4 : 0, proj: 'castle_shots/blob' });
    }
    // the hammer hall: its presses, by turns, down across the hall
    if ((n.kind === 'hammers' || n.kind === 'cloister') && (S.press -= dt) <= 0) {
      S.press = 2.4; const k0 = S.pressK++ % 2;
      for (let x = n.x + 4 + k0 * (n.kind === 'cloister' ? 8 : 7); x < n.x + n.w - 3; x += n.kind === 'cloister' ? 16 : 14) this.fx.push({ kind: 'lane', x: x + 0.5, y: n.y, a: Math.PI / 2, len: n.h, w: 1.1, delay: 0.9, t: 0, life: 1.25, every: 0.5, dmg: D(110), by: 'a forge press', hitT: 0, cols: ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'] });
    }
    // the Sunthief Gate: through its portal to the Eclipse Walk
    const Dd = C.door;
    if (n.kind === 'sundoor' && !S.through && p.x >= Dd.x0 && p.x <= Dd.x1 + 1 && p.y >= Dd.y0 && p.y <= Dd.y1 + 1) {
      if (m.sealsLeft > 0) { if (!(this.gateT > 0)) { this.gateT = 4; this.banner(`The Sunthief Gate is sealed. Still holding it shut: ${this.sealsHint()}.`, 3000); } }
      else { S.through = this.t; this.fx.push({ kind: 'fade', t: 0, life: 1.0 }); this.sfx('portal'); }
    }
    if (S.through && this.t - S.through >= 0.5 && !S.arrived) {   // (under the fade's darkest)
      S.arrived = true; p.x = C.arrive.x; p.y = C.arrive.y; p.status.invuln = Math.max(p.status.invuln || 0, 2.5);
    }
    if (S.through && n.sect !== 'eclipse' && n.sect !== 'sanctum' && n.kind !== 'sundoor') { S.through = 0; S.arrived = false; }   // (back another way: the gate works again)
  },
  // more players, more Life (the user's formulas): a castle defender 1 + 0.55 a player past the first (at most 2.65), a
  // castle boss 1 + 0.60 (up to six); no more damage. Only the server counts its players (a browser alone is one); a
  // monster keeps the share of its Life it had, so its phases stay where they were
  castleParty() {
    const n = Math.max(1, (this.netTargets || []).filter((q) => q && !q.dead).length);
    const kin = Math.min(2.65, 1 + 0.55 * (n - 1)), boss = 1 + 0.6 * (Math.min(6, n) - 1);
    for (const e of this.enemies) {
      if (e.dead || !(e.D.kin || e.rb)) continue;
      const k = e.rb ? boss : kin, k0 = e.partyK || 1; if (k === k0) continue;
      const f = e.hp / e.maxHp; e.maxHp = Math.round((e.maxHp / k0) * k); e.hp = Math.max(1, Math.round(f * e.maxHp)); e.partyK = k;
    }
  },
  // what holds a lock: clear:<n> (that area's defenders, once woken, all dead), break:<n> (its cursed things broken),
  // mech:<key> (a mechanism turned), jarls / ashkar (the bosses dead), seal+chain (the Broken Crown Seal and the Great
  // Chain Release both done)
  // what holds the way on out of the area you're in, said at the top of the view while it does (2026-11-02, the user: "For
  // rooms that require you to clear all enemies to continue please give players something to let them know"): its
  // defenders and how many are left, the cursed things to break, the mechanisms still to turn. Said once as a banner too
  castleGoal(n, Rm, S) {
    const C = this.map.castle, inA = (e) => e.x >= n.x - 2 && e.y >= n.y - 2 && e.x < n.x + n.w + 2 && e.y < n.y + n.h + 2;
    const mine = (C.mechs || []).filter((M) => M.num === n.num && !M.done);
    const L = (C.locks || []).find((q) => !q.open && (q.cond === 'clear:' + n.num || q.cond === 'break:' + n.num || (/^mechs?:/.test(q.cond) && mine.some((M) => q.cond.split(':')[1].split(',').includes(M.key)))));
    if (!L) return null;
    const foes = this.enemies.filter((e) => !e.dead && inA(e) && (L.cond.startsWith('clear') ? !e.rb : e.D.kin || e.rb || e.D.target)), brk = L.cond.startsWith('break'), tg = foes.filter((e) => e.D.target);
    let text;
    if (brk && tg.length) text = `DESTROY THE ${tg[0].D.name.toUpperCase().replace(/^THE /, '')}${tg.length > 1 ? 'S' : ''} TO OPEN THE WAY · ${tg.length} LEFT`;
    else if (n.pending || foes.length) text = `DEFEAT EVERY DEFENDER TO OPEN THE WAY · ${foes.length} LEFT${n.pending ? ' · MORE ARE COMING' : ''}`;
    else if (mine.length) text = `STAND AT ${mine.length > 1 ? 'EACH OF ' : ''}${mine.map((M) => M.name).join(' AND ')} TO TURN ${mine.length > 1 ? 'THEM' : 'IT'}`;
    else return null;
    if (!S.told) S.told = {};
    if (!S.told[n.num] && (foes.length || brk)) { S.told[n.num] = true; (this.castleLater = this.castleLater || []).push({ t: this.t + 2.4, f: () => this.banner(brk ? 'BREAK THE CURSED THINGS TO OPEN THE WAY' : 'DEFEAT EVERY DEFENDER TO OPEN THE WAY', 2600) }); }
    return text;
  },
  castleCond(c, Rm) {
    const C = this.map.castle, area = (n) => Object.values(Rm).find((q) => q.num === n), mech = (k) => (C.mechs || []).some((M) => M.key === k && M.done);
    const [k, v] = c.split(':'), inA = (n, e) => e.x >= n.x - 2 && e.y >= n.y - 2 && e.x < n.x + n.w + 2 && e.y < n.y + n.h + 2;
    if (k === 'clear' || k === 'break') { const n = area(+v); if (n.pending) return false; return !this.enemies.some((e) => !e.dead && !e.rb && (k === 'break' ? e.D.target : true) && inA(n, e)); }
    if (k === 'mech') return mech(v);
    if (k === 'mechs') return v.split(',').every(mech);
    if (k === 'seal+chain') return mech('seal') && mech('chain');
    if (k === 'jarls' || k === 'ashkar') { const n = area(k === 'jarls' ? 26 : 46), W = (this.map.wardens || []).filter((w) => w.room === n); return W.length > 0 && W.every((w) => w.dead); }
    return false;
  },
  // the mechanisms (src/world/castle_plan.js MECHS): stand at one with its area cleared and it turns (3 s; stepping off,
  // it slips back). Anyone of the party can turn them
  castleMechs(dt, Rm, S) {
    const C = this.map.castle; if (!C.mechs) return;
    const who = [this.player, ...(this.netTargets || [])].filter((q) => q && !q.dead);
    for (const M of C.mechs) {
      if (M.done) continue;
      const rm = Object.values(Rm).find((q) => q.num === M.num), near = who.some((q) => Math.hypot(q.x - M.x - 0.5, q.y - M.y - 0.5) < 2.4);
      const look = (k) => { if (!M.o) return; if (M.sprite.endsWith('pyre')) { if (k === '_done') M.o.unlit = true; return; } M.o.sprite = M.sprite + k; };   // (a signal fire: burning, then out, dark and still)   // (its art: still, turning, turned: castle_decor/winch, _turn, _done)
      const keep = () => { if (M.o) M.o.mechProg = Math.round((M.prog || 0) * 40) / 40; };   // (its progress on its own object: drawn as a bar over it, for everyone online)
      if (!near) { M.prog = Math.max(0, (M.prog || 0) - dt * 0.5); keep(); look(''); continue; }
      if (rm && this.enemies.some((e) => !e.dead && (e.D.kin || e.rb) && inR(rm, e.x, e.y))) { if (!(M.toldT > this.t)) { M.toldT = this.t + 4; this.banner(`${M.name}: ITS DEFENDERS STILL HOLD IT`, 2200); } look(''); continue; }
      M.prog = (M.prog || 0) + dt / 3; keep(); look('_turn');
      if (!M.saidStart) { M.saidStart = true; this.banner(M.verb, 1600); }   // (2026-11-03, the user: a progress bar, not thirty messages: said once, the bar shows the rest)
      if (Math.random() < 0.3) this.vx({ k: 'burst', x: M.x + 0.5, y: M.y, n: 2, colors: M.key === 'winch' ? ['#a39bb2', '#ff8a1f'] : ['#ffd650', '#fff6c8'] });
      if (M.prog >= 1) {
        M.done = true; M.prog = 1; if (M.o) M.o.mechProg = 0; look('_done'); this.sfx('chain'); this.vx({ k: 'shake', amt: 5 }); this.vx({ k: 'burst', x: M.x + 0.5, y: M.y, n: 24, colors: ['#ffd650', '#ff8a1f', '#ffffff'] });
        this.banner(`${M.name} · DONE`, 2400);
      }
    }
  },
  // each area's own danger, where you are (the user's 52-area blueprint, 2026-11-02); every one marked before it lands
  castleHazard(dt, n, S) {
    const m = this.map, p = this.player, H = S.haz || (S.haz = {}), k = n.key, T = (key, every) => { H[key] = (H[key] ?? 1) - dt; if (H[key] > 0) return false; H[key] = every; return true; };
    const zone = (x, y, r, delay, dmg, by, colors) => { const tx = Math.floor(x), ty = Math.floor(y); if (m.solid[ty * m.w + tx] || m.tiles[ty * m.w + tx] === TID.void) return; this.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: D(dmg), by, done: false, colors }); };
    const lane = (x, y, a, len, delay, dmg, w, by, cols) => this.fx.push({ kind: 'lane', x, y, a, len, w, delay, t: 0, life: delay + 0.35, every: 0.5, dmg: D(dmg), by, hitT: 0, cols });
    const near = (r) => [p.x + (R() - 0.5) * r, p.y + (R() - 0.5) * r];
    const ROCK = ['#8a7a6a', '#c8b8a0'], FIRE = ['#ff6a1c', '#ffd650'], RED = ['#ff6a1c', '#ff6a1c', '#ff3a1a', '#ffffff'];
    const alive = (id) => this.enemies.some((e) => !e.dead && e.D === ENEMIES[id] && inR(n, e.x, e.y));
    switch (k) {
      case 'a50': {                                                   // the Broken Orrery: its planets turning on two rings; while its anchors stand, all four fire together
        const O = m.castle.orbs || [], live = this.enemies.some((e) => !e.dead && e.D.target && inR(n, e.x, e.y)), sp = live ? 1 : 0.25;
        H.oa = (H.oa || 0) + dt * 0.5 * sp;
        O.forEach((o, i) => { const r = i < 2 ? n.w * 0.2 : n.w * 0.36, a = H.oa * (i < 2 ? 1.4 : -0.8) + (i % 2) * Math.PI; o.x = n.cx + 0.5 + Math.cos(a) * r; o.y = n.cy + 0.5 + Math.sin(a) * r * (n.h / n.w); });
        if (live && !n.pending && T(k, 1.7)) {
          const ring = (H.of = !H.of);
          for (const o of O) { const b = Math.atan2(p.y - o.y, p.x - o.x); if (ring) for (let j = 0; j < 8; j++) this.shoot('e', o.x, o.y, (j / 8) * Math.PI * 2 + H.oa, 4.2, 14, D(100), 'sol_shots/voidbolt', 0.36, false, 'the orrery'); else for (let j = -1; j <= 1; j++) this.shoot('e', o.x, o.y, b + j * 0.18, 5.6, 16, D(105), 'sol_shots/voidbolt', 0.36, false, 'the orrery'); }
        }
        break;
      }
      case 'a51': if (T(k, 1.1)) {                                    // the Sanctum Ascent: its last gauntlet, rows of void across the stair from the dark, a gap in each
        const gap = Math.floor(R() * 5) - 2;
        for (let j = -3; j <= 3; j++) { if (j === gap || j === gap + 1) continue; this.shoot('e', n.x + 1, p.y + j * 1.1, 0, 5, n.w, D(105), 'sol_shots/voidbolt', 0.36, false, 'the void'); }
      } break;
      case 'a34': if (T(k, 1.6)) { const [x] = near(10); zone(x, p.y + (R() - 0.5) * 6, 1.2, 1.0, 110, 'a valve erupting', FIRE); } break;   // the Western Aqueduct: its valves erupting along the channels
      case 'a39': if (T(k, 3.0)) {                                    // the Ember Crucible: its four vents by pairs, lanes of fire across the chamber, the pair turning each time
        const pr = (H.cp = ((H.cp || 0) + 1) % 2);
        for (const a of pr ? [Math.PI / 4, Math.PI * 5 / 4] : [Math.PI * 3 / 4, Math.PI * 7 / 4]) { const vx = n.cx + Math.cos(a) * n.w * 0.36, vy = n.cy + Math.sin(a) * n.h * 0.36; lane(vx, vy, a + Math.PI, n.w * 0.7, 1.0, 120, 1.6, 'a furnace vent', RED); }
      } break;
      case 'a42': if (T(k, 2.4)) { const a = (H.ga = (H.ga || 0) + 0.9), gx = n.cx + Math.cos(a) * 6, gy = n.cy + Math.sin(a) * 6; lane(gx - Math.cos(a + 1.57) * 8, gy - Math.sin(a + 1.57) * 8, a + 1.57, 16, 0.9, 115, 1.4, 'a turning gear', RED); } break;   // the Chain Galleries: the great gears' arms sweeping, a little further round each time

      case 'a13': case 'a15': {                                       // the Broken Siege Battery: while its mechanism stands, its engine fires down a fixed lane (here and onto the Ember Stair)
        const B = m.castle.rooms.a13; if (!B || B.pending || !alive('siege_battery') || !T('battery', 3.2)) break;
        if (k === 'a13') { lane(B.x, B.cy, 0, B.w, 1.0, 150, 2.2, 'the siege battery', RED);
          if ((H.bolt = (H.bolt || 0) + 1) % 3 === 0) this.castleBreach(B.x + B.w * 0.75, B.y + B.h * 0.35, p);   // (every third: a breaching bolt that breaks your armour)
        }
        else lane(n.cx - 2, n.y, Math.PI / 2, n.h, 1.0, 150, 2.2, 'the siege battery', RED);
        break;
      }

      case 'a17': {                                                   // the Crucible: its reservoir erupts in rings; its four vents fire by turns
        if (T(k, 4.2)) { this.vx({ k: 'burst', x: n.cx, y: n.cy, n: 20, colors: FIRE }); for (let i = 0; i < 14; i++) this.shoot('e', n.cx, n.cy, (i / 14) * Math.PI * 2 + R(), 4.2, 14, D(110), 'castle_shots/blob', 0.45, false, 'the reservoir erupting'); }
        if (T('vent', 1.3)) { const a = ((H.vk = (H.vk || 0) + 1) % 4) * Math.PI / 2 + Math.PI / 4, vx = n.cx + Math.cos(a) * n.w * 0.36, vy = n.cy + Math.sin(a) * n.h * 0.36, b = Math.atan2(p.y - vy, p.x - vx); for (let i = -1; i <= 1; i++) this.shoot('e', vx, vy, b + i * 0.2, 5, 12, D(100), 'castle_shots/flame', 0.4, false, 'a lava vent'); }
        break;
      }
    }
    if (k === 'a15' && T('stair', 2.2)) { const y = p.y + (R() - 0.5) * 4; lane(n.cx + 7, y, Math.PI, 14, 0.9, 110, 1.2, 'a lava burst', RED); }   // the Ember Stair: lava bursting from the wall vents across it
  },
  // the geysers (2026-11-02, the user: geysers set in the ground, not bombs over your head): each vent and fissure on its
  // own rhythm while anyone is near. A flame vent: glows 1.0-1.3 s, then a column of fire 0.55 s (120) and a few embers;
  // 5-8 s between. A lava fissure: glows 1.2-1.5 s, then lava 0.7 s (150) and a molten pool 2.5 s; 'FISSURE ERUPTING!'
  // when one blows (at most every 8 s)
  castleGeysers(dt, S) {
    const C = this.map.castle; if (!C.geysers) return;
    const who = [this.player, ...(this.netTargets || [])].filter((q) => q && !q.dead);
    for (const G of C.geysers) {
      if (!who.some((q) => Math.abs(q.x - G.x) < 18 && Math.abs(q.y - G.y) < 14)) continue;
      if ((G.t -= dt) > 0) continue;
      const lava = G.kind === 'lava', x = G.x + 0.5, y = G.y + 0.5;
      if (!G.warn) {                                              // it glows: the warning
        G.warn = true; const w = lava ? 1.2 + R() * 0.3 : 1.0 + R() * 0.3; G.t = w;
        if (G.o) G.o.sprite = 'castle_decor/' + (lava ? 'fissure_hot' : 'vent_hot');
        this.fx.push({ kind: 'zone', x, y, r: lava ? 1.5 : 1.1, t: 0, delay: w, life: w + (lava ? 0.7 : 0.55), dmg: D(lava ? 150 : 120), by: lava ? 'a lava geyser' : 'a flame geyser', done: false,
          colors: lava ? ['#ff5a1a', '#ffd650'] : ['#ff8a1f', '#ffe08a'], ...(lava ? { pool: { life: 2.5, dmg: D(45), kind: 'fire' } } : {}) });
        if (lava && !(S.fissT > this.t) && who.some((q) => Math.hypot(q.x - x, q.y - y) < 12)) { S.fissT = this.t + 8; this.banner('FISSURE ERUPTING!', 1400); }
        continue;
      }
      G.warn = false; G.t = 5 + R() * 3;                          // it blows: a column of fire or lava, then cools
      if (G.o) G.o.sprite = 'castle_decor/' + (lava ? 'fissure' : 'vent');
      for (let h = 0; h < 4; h++) this.vx({ k: 'burst', x, y: y - h * 0.5, n: lava ? 10 : 7, colors: lava ? ['#ff5a1a', '#ffd650', '#ff3a1a'] : ['#ff8a1f', '#ffe08a', '#ffffff'] });
      if (!lava) { const n = 4 + Math.floor(R() * 3), a0 = R() * Math.PI * 2; for (let i = 0; i < n; i++) this.shoot('e', x, y, a0 + (i / n) * Math.PI * 2, 4.2, 5, D(70), 'castle_shots/ember', 0.3, false, 'a flame geyser'); }
      this.sfx('hammer');
    }
  },
  // a breaching bolt: marked 0.9 s, then one heavy bolt that breaks your armour (Armor Broken: your Defense nothing for
  // 2.5 s; another does not add to it, only renews it. The game's own status: src/owbosses.js owBroken)
  castleBreach(x, y, p) {
    const a = Math.atan2(p.y - y, p.x - x);
    this.fx.push({ kind: 'lane', x, y, a, len: 16, w: 0.6, delay: 0.9, t: 0, life: 0.9, dmg: 0, by: '', hitT: 0, cols: ['#a8a0b0', '#a8a0b0', '#5a5560', '#ffffff'] });
    (this.castleLater = this.castleLater || []).push({ t: this.t + 0.9, f: () => { const b = this.shoot('e', x, y, a, 9, 16, D(110), 'castle_shots/darrow', 0.45, false, 'a breaching bolt'); if (b) { b.sig = 'armor'; b.sigV = 2.5; } } });
  },
  // second waves (src/data/enemies.js WAVES): once an area's first defenders are down, the rest come in where they are
  // shown (a mark on the floor 1.2 s first; never on you)
  castleWaves(Rm, S) {
    const m = this.map, W = S.waves || (S.waves = {});
    for (const [key, list] of Object.entries(WAVES)) {
      const n = Rm[key]; if (!n || n.pending || W[key]) continue;
      if (key === 'a24' && ['brazL', 'brazR'].every((q) => (this.map.castle.mechs || []).some((M) => M.key === q && M.done))) { W[key] = true; continue; }   // (the watchtowers' fires out: the alarm never sounded, no archers come)
      if (!S.woken) S.woken = {};
      if (!S.woken[key]) { if (this.enemies.some((e) => !e.dead && !e.rb && e.x >= n.x && e.y >= n.y && e.x < n.x + n.w && e.y < n.y + n.h)) S.woken[key] = true; continue; }
      if (this.enemies.some((e) => !e.dead && !e.rb && !e.D.target && e.x >= n.x - 2 && e.y >= n.y - 2 && e.x < n.x + n.w + 2 && e.y < n.y + n.h + 2)) continue;
      W[key] = true;
      const at = list.map(([id, fx, fy]) => { let x = n.x + fx * n.w, y = n.y + fy * n.h; for (let r = 0; r < 10 && m.solid[Math.floor(y) * m.w + Math.floor(x)]; r++) { x += (n.cx - x) * 0.2; y += (n.cy - y) * 0.2; } return [id, x, y]; });
      for (const [, x, y] of at) this.fx.push({ kind: 'zone', x, y, r: 1.2, t: 0, delay: 1.2, life: 1.2, dmg: 0, by: '', done: true, colors: ['#ff8a1f', '#ffd650'] });
      this.banner('REINFORCEMENTS', 1600); this.sfx('boss');
      S.waveAt = S.waveAt || []; S.waveAt.push({ t: this.t + 1.2, at });
    }
    if (S.waveAt) S.waveAt = S.waveAt.filter((q) => { if (this.t < q.t) return true; if (this.spawnPending) this.spawnPending(q.at); return false; });
  },
  // the castle's progress, to carry over a server restart (2026-11-02, the user: a castle "reset" mid-run). Every deploy
  // and every sleep restarts the server; a player's copy then asks for its castle again (net.js 'rejoin'), and it was made
  // fresh from its seed: its gates shut again, its mechanisms unturned, its waves to come again. Now the copy says what
  // was done and the new castle is set to it, quietly: locks open, mechanisms turned, waves spent, the arrival's bats come
  castleState() {
    const C = this.map.castle; if (!C || !C.locks) return null;
    const open = (L) => L.open || ((C.gates[L.name] || []).length && C.gates[L.name].every((o) => !o.solid));
    return { locks: C.locks.filter(open).map((L) => L.name), mechs: (C.mechs || []).filter((M) => M.done).map((M) => M.key), waves: Object.keys((C.st && C.st.waves) || {}), bats: !!(C.st && C.st.bats) };
  },
  castleRestore(st) {
    const C = this.map.castle; if (!C || !C.locks || !st || typeof st !== 'object') return;
    const S = C.st || (C.st = { t0: this.t, geyser: 2, fall: 1, press: 1, pressK: 0, said: {} });
    const list = (v) => (Array.isArray(v) ? v.slice(0, 64).map(String) : []);
    const b0 = this.banner, s0 = this.sfx; this.banner = () => {}; this.sfx = () => {};
    try {
      for (const name of list(st.locks)) { const L = C.locks.find((q) => q.name === name); if (L && !L.open) { L.open = true; this.castleOpen(name); } }
      for (const key of list(st.mechs)) { const M = (C.mechs || []).find((q) => q.key === key); if (M && !M.done) { M.done = true; M.prog = 1; if (M.o) { if (M.sprite.endsWith('pyre')) M.o.unlit = true; else M.o.sprite = M.sprite + '_done'; } } }
      S.waves = S.waves || {}; for (const k of list(st.waves)) S.waves[k] = true;
      if (st.bats) S.bats = true;
    } finally { this.banner = b0; this.sfx = s0; }
  },
  castleEnter(key, n) {
    const m = this.map;
    if (key === 'arrival') this.player.status.invuln = Math.max(this.player.status.invuln || 0, 2.5);
    this.banner(n.kind === 'sundoor' ? (m.sealsLeft > 0 ? 'BEYOND THIS GATE, EVEN LIGHT OBEYS HIM.' : 'STEP THROUGH THE SUNTHIEF GATE.') : n.title || key.toUpperCase(), 2200);
  },
  castleOpen(which) {
    const m = this.map;
    if (which === '23-24' && !this.dbLowering && m.castle.rooms && m.castle.rooms.a23) {   // the drawbridge: it comes down a plank at a time from the engine's side, its chains running out
      this.dbLowering = true; const A = m.castle.rooms.a23, G = (m.castle.gates[which] || []).slice().sort((p, q) => Math.hypot(p.x - A.cx, p.y - A.cy) - Math.hypot(q.x - A.cx, q.y - A.cy));
      this.sfx('chain'); this.vx({ k: 'shake', amt: 5 });
      G.forEach((o, k) => (this.castleLater = this.castleLater || []).push({ t: this.t + 0.3 + k * 0.06, f: () => {
        const i = Math.floor(o.y) * m.w + Math.floor(o.x); o.sprite = 'gate_open'; o.solid = false; m.solid[i] = 0; if (o.floor !== undefined) m.tiles[i] = o.floor;
        this.vx({ k: 'burst', x: o.x, y: o.y - 0.3, n: 3, colors: ['#8a6a3a', '#5a3a1a', '#c8b8a0'] }); if (k % 6 === 0) this.sfx('chain');
      } }));
      return;
    }
    for (const o of ((m.castle.gateLooks || {})[which]) || []) {   // its look: opening (dust or sparks where each piece stood), then open
      const L = o.look; o.sprite = 'castle_decor/' + (L === 'portcullis' ? 'gate_portcullis_open' : L + '_open');
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.6, n: 10, colors: L === 'gate_seal' ? ['#b884cc', '#e6c8ff', '#ffffff'] : L === 'gate_roots' ? ['#5a3a1a', '#8a6a3a', '#2a1a10'] : ['#8a8490', '#c8c0d8', '#5a5560'] });
    }
    if ((m.castle.gateLooks || {})[which]) this.vx({ k: 'shake', amt: 4 });
    for (const o of (m.castle.gates && m.castle.gates[which]) || []) {
      const i = Math.floor(o.y) * m.w + Math.floor(o.x);
      o.sprite = 'gate_open'; o.solid = false; m.solid[i] = 0; if (o.floor !== undefined) m.tiles[i] = o.floor;   // (the tile changes: the server sends it on)
      this.vx({ k: 'burst', x: o.x, y: o.y - 0.4, n: 6, colors: ['#ff8a1f', '#ffd650'] });
    }
    this.sfx('chain');
  },
};
export function installCastle(Game) { Object.assign(Game.prototype, methods); }
