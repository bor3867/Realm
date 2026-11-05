// =====================================================================================================================
// MELON REALMS — BOSS SANDBOX ENGINE (a faithful subset of src/bossx.js and the parts of src/game.js a boss fight touches)
// Same names, same fields, same rules as the game: a boss written against this drops into the game unchanged.
// See the RULES panel / comment at the top of the page for the contract.
// =====================================================================================================================
const TS = 16;                                   // screen pixels per tile (a sprite pixel is 2 screen pixels: 8 to a tile)
const TAU_ = Math.PI * 2;
const HITBOX = { foot: 0.26, head: 0.66, r: 0.29 };   // your body: a capsule from 0.26 to 0.66 tiles up from your feet, radius 0.29
const moveSpeed = (spd) => 3.6 + 5.0 * (spd / 50);    // tiles a second (stats top out at 50)
const mitigate = (dmg, def) => Math.max(Math.round(dmg * 0.15), dmg - def);
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
function isSolid(m, x, y) { const xi = Math.floor(x), yi = Math.floor(y); if (xi < 0 || yi < 0 || xi >= m.w || yi >= m.h) return true; return m.solid[yi * m.w + xi] === 1; }
function segDist(ax, ay, bx, by, px, py) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(ax + dx * t - px, ay + dy * t - py); }

// ---------------------------------------------------------------- sprites (the game's own atlases, embedded by the build)
const SPRITES = {};                              // 'sheet/name' -> { img, frames: {fn: [x,y,w,h]}, anims, phases, death, size, foot }
function loadSprites(ATLASES) {
  const jobs = [];
  for (const A of ATLASES) {
    const img = new Image(); img.src = A.png; jobs.push(new Promise((res) => { img.onload = res; img.onerror = res; }));
    for (const [sheet, S] of Object.entries(A.sheets)) for (const [name, sp] of Object.entries(S.sprites)) {
      let w = 0, h = 0; for (const f of Object.values(sp.frames)) { w = Math.max(w, f[2]); h = Math.max(h, f[3]); }
      SPRITES[`${sheet}/${name}`] = { img, frames: sp.frames, anims: sp.anims || { loop: { frames: Object.keys(sp.frames), fps: 8, loop: true } }, phases: sp.phases, death: sp.death, size: [w, h], foot: S.kind === 'boss' ? [w / 2, h - 1] : [w / 2, h / 2], kind: S.kind };
    }
  }
  return Promise.all(jobs);
}
class Anim {                                      // a clip player, as src/anim.js: play(clip, {speed}), frame, i, done, 'ended'
  constructor(def, clip) { this.def = def; this.cb = []; this.play(clip); }
  on(ev, f) { this.cb.push(f); }
  play(clip, o = {}) { const A = this.def.anims[clip]; if (!A) return; this.clip = clip; this.A = A; this.i = 0; this.t = 0; this.speed = o.speed ?? 1; this.done = false; this.frame = A.frames[0]; }
  update(dt) {
    if (!this.A || this.done) return;
    this.t += dt * this.speed * (this.A.fps || 8);
    while (this.t >= 1) { this.t -= 1; this.i++; if (this.i >= this.A.frames.length) { if (this.A.loop) this.i = 0; else { this.i = this.A.frames.length - 1; this.done = true; const c = this.clip; for (const f of this.cb) f(c); break; } } }
    this.frame = this.A.frames[this.i];
  }
}

// ---------------------------------------------------------------- the game a boss sees (g)
class Game {
  constructor(room) {
    this.t = 0; this.map = room.map; this.room = room;
    this.player = { x: room.start[0], y: room.start[1], hp: 750, maxHp: 750, def: 4, spd: 40, dead: false, status: {} };
    this.enemies = []; this.projectiles = []; this.fx = []; this.parts = []; this.floats = []; this.bannerList = []; this.notable = [];
    this.bxLogs = []; this.bxDebug = true; this.god = false; this.shake = 0; this.dmgTaken = []; this.camAngle = 0;
  }
  // ---- what a boss calls
  bxDmg(e, d) { return Math.round((d || 60) * ((e.bx && e.bx.B.dmgScale) || 1)); }
  up(x, y, h) { return [x, y - h]; }                     // (the camera here never turns: 'up' the screen is -y)
  bxShot(e, x, y, a, V, extra) {
    if (e.dead || (e.bx && ['death', 'deathhold', 'gone'].includes(e.bx.state))) return { x, y, vx: 0, vy: 0, a, life: 0, dmg: 0, dead: true };
    { const S = e.bx, def = S && S.def, K = (S && S.drawK) || 1;   // (a shot set off anywhere inside the boss's drawn body starts at its feet, unless V.free)
      const H = def ? (def.size[1] * 2 * K) / 16 : 3, W2 = def ? (def.size[0] * K) / 16 : 1.5, h = -(y - e.y), w = x - e.x;
      if (!V.free && h > -0.6 && h < H + 0.6 && Math.abs(w) < W2 + 0.6) { x = e.x; y = e.y; } }
    const sp = V.speed || 5, b = { from: 'e', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a, life: (V.range || 14) / Math.max(0.01, sp), dmg: this.bxDmg(e, V.dmg || 60), sprite: V.sprite, r: V.size || 0.45, by: e.D.name, bxOf: e };
    if (V.mv) b.mv = { ...V.mv }; if (V.life) b.life = V.life;
    if (extra) Object.assign(b, extra);
    this.projectiles.push(b); return b;
  }
  hurtPlayer(dmg, by) {
    const p = this.player; if (p.dead || p.status.invuln > 0) return;
    const d = mitigate(dmg, p.def); this.dmgTaken.push([this.t, d]);
    this.float(p.x, p.y - 1, '-' + d, '#ff5a5a'); if (this.god) return;
    p.hp -= d; if (p.hp <= 0) { p.hp = 0; p.dead = true; this.banner('YOU DIED · ' + by, 2500); }
  }
  float(x, y, text, color) { this.floats.push({ x, y, text, color, t: 0 }); }
  banner(text, ms = 1500) { this.bannerList.push({ text, until: performance.now() + ms }); if (this.bannerList.length > 3) this.bannerList.shift(); }
  vx(o) { if (o.k === 'shake') this.shake = Math.max(this.shake, o.amt || 3); else if (o.k === 'burst') for (let i = 0; i < Math.min(30, o.n || 4); i++) this.parts.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 1, t: 0, life: 0.5 + Math.random() * 0.4, c: (o.colors || ['#fff'])[i % (o.colors || ['#fff']).length] }); }
  sfx() {}
  addEnemy(id, x, y) { const D = ENEMY_DEFS[id]; const e = { id, D: { ...D, id }, x, y, hp: D.hp, maxHp: D.hp, r: D.r || 0.6, dead: false }; this.enemies.push(e); return e; }
  blockedAt(x, y, r) { return isSolid(this.map, x, y) || isSolid(this.map, x + r, y) || isSolid(this.map, x - r, y) || isSolid(this.map, x, y + r) || isSolid(this.map, x, y - r); }
  moveCircle(o, dx, dy, r = 0.4) {                       // slide along walls: each axis on its own
    if (!this.blockedAt(o.x + dx, o.y, r * 0.75)) o.x += dx;
    if (!this.blockedAt(o.x, o.y + dy, r * 0.75)) o.y += dy;
  }
  bxClearBullets(e) { this.projectiles = this.projectiles.filter((b) => !(b.bxOf === e || (b.from === 'e' && b.by === e.D.name))); }
  bxLog(e, ev, info) {
    if (!this.bxDebug) return; const S = e.bx || {}, d = S.dbg || {};
    this.bxLogs.push({ t: +this.t.toFixed(2), boss: e.D.name, phase: S.phase, state: S.state, dir: d.st, combo: d.combo || (S.pat && S.pat.name), move: d.move, ev, info, shots: this.projectiles.filter((b) => b.bxOf === e).length, portals: this.enemies.filter((q) => !q.dead && q.id === 'wiz_portal').length });
    if (this.bxLogs.length > 400) this.bxLogs.shift();
  }
  damageEnemy(e, d) {                                    // your shots (and the test buttons)
    if (e.dead) return;
    if (e.bx) { if (this.bxImmune(e, e.x, e.y - 2)) return; d = mitigate(d, e.D.def || 0); d = this.bxClamp(e, d); e.hp -= d; this.float(e.x, e.y - 3, String(d), '#ffffff'); return; }
    e.hp -= mitigate(d, e.D.def || 0); if (e.hp <= 0) { e.dead = true; this.vx({ k: 'burst', x: e.x, y: e.y, n: 14, colors: ['#e6c8ff', '#ffffff'] }); }
  }
  // ---- the boss engine (src/bossx.js), the parts a fight runs on
  bxSetup(e) {
    const B = BOSSES[e.D.bx], art = B.art || e.D.bx, def = SPRITES[`bx_${art}/${art}`];
    const S = (e.bx = { B, def, phase: 1, state: 'sleep', t: 0, pat: null, patIdx: 0, vol: [], wait: 1.6, anim: def ? new Anim(def, def.phases['1'].idle) : null, hurtT: 0, flashT: 0, arena: e.room || null });
    e.hitUp = def ? Math.max(0.5, (def.foot[1] - def.size[1] / 2) / 8 * (B.drawScale || 1)) : 1.4;
    if (B.drawScale) S.drawK = B.drawScale;
    if (S.anim) S.anim.on('ended', (clip) => this.bxClipEnded(e, clip));
    return S;
  }
  bxPhaseData(e) { return e.bx.B.phases[e.bx.phase]; }
  bxThresholds(e) { return e.bx.B.thresholds || [0.66, 0.33]; }
  updateBx(e, dt) {
    const S = e.bx || this.bxSetup(e), p = this.player, B = S.B;
    S.t += dt; S.hurtT = Math.max(0, S.hurtT - dt);
    if (e.invulnT > 0 && e.invulnT < 50) e.invulnT = Math.max(0, e.invulnT - dt);
    if (S.anim) S.anim.update(dt);
    if (S.state === 'gone') return;
    if (dt > 0) { const vx = S.plx === undefined ? 0 : (p.x - S.plx) / dt, vy = S.ply === undefined ? 0 : (p.y - S.ply) / dt, k = Math.min(1, dt * 6), jump = Math.hypot(vx, vy) > 30;
      S.pvx = jump ? 0 : (S.pvx || 0) + (vx - (S.pvx || 0)) * k; S.pvy = jump ? 0 : (S.pvy || 0) + (vy - (S.pvy || 0)) * k; S.plx = p.x; S.ply = p.y; }
    if (S.state === 'sleep') { const R0 = e.room; if (!R0 || (p.x > R0.x && p.x < R0.x + R0.w && p.y > R0.y && p.y < R0.y + R0.h)) this.bxWake(e); return; }
    if (S.state === 'deathhold') { S.wait -= dt; if (S.wait <= 0) this.bxFinish(e); return; }
    if (B.update) B.update(this, e, dt);
    if (S.state === 'death') S.vol = [];
    for (const v of S.vol) if ((v.t -= dt) <= 0 && !v.done) { v.done = true; this.bxVolley(e, v.V); }
    S.vol = S.vol.filter((v) => !v.done);
    if (S.state === 'intro') { if ((S.wait -= dt) <= 0) { S.state = 'fight'; S.wait = 0.6; } return; }
    if (S.state === 'morph' || S.state === 'death') return;
    if (S.state !== 'grace' && !p.dead) this.bxPressure(e, dt);
    if (S.state === 'grace') { this.bxMove(e, dt, 'hold'); this.bxPose(e, dt); if ((S.wait -= dt) <= 0) { S.state = 'fight'; S.wait = 0.2; } return; }
    const PH = this.bxPhaseData(e);
    this.bxMove(e, dt, (S.pat && S.pat.move) || PH.move || 'pace');
    this.bxPose(e, dt);
    if (S.state === 'windup') { if ((S.wait -= dt) <= 0) { S.state = 'release'; if (S.anim) S.anim.speed = 1; } return; }
    if (S.state === 'release' && !S.fired && S.anim && S.anim.i >= 1) this.bxRelease(e);
    if (S.state === 'release' || S.state === 'recover') { if (S.state === 'recover' && (S.wait -= dt) <= 0) { S.state = 'fight'; S.pat = null; } return; }
    if ((S.wait -= dt) > 0 || p.dead) return;
    this.bxStartPattern(e);
  }
  bxPose(e, dt) {
    const S = e.bx, A = S.anim, P = S.def && S.def.phases[S.phase];
    if (!A || !P || S.state === 'windup' || S.state === 'release') return;
    if (S.B.posing && S.B.posing(this, e)) return;
    const sp = Math.hypot(e.x - (S.px ?? e.x), e.y - (S.py ?? e.y)) / Math.max(dt, 1e-3); S.px = e.x; S.py = e.y;
    S.spd = (S.spd || 0) + (Math.min(sp, 20) - (S.spd || 0)) * Math.min(1, dt * 8);
    const charging = S.B.charging && S.B.charging(this, e);
    const want = S.flinch > this.t && P.hurt ? P.hurt : charging && P.charge ? P.charge : S.spd > 0.6 && P.walk ? P.walk : P.idle;
    const mine = [P.idle, P.walk, P.charge, P.hurt];
    if (A.clip === want) { if (want === P.walk) A.speed = Math.max(0.6, Math.min(1.8, S.spd / (S.B.walkPace || 2.5))); return; }
    if (mine.includes(A.clip) || A.done) A.play(want, { speed: want === P.walk ? Math.max(0.6, Math.min(1.8, S.spd / (S.B.walkPace || 2.5))) : 1 });
  }
  bxWake(e) { const S = e.bx; e.state = 'idle'; S.state = 'intro'; S.wait = 1.6; this.banner(e.D.name.toUpperCase(), 2000); this.vx({ k: 'shake', amt: 5 }); if (S.B.onWake) S.B.onWake(this, e); }
  bxStartPattern(e) {
    const S = e.bx, PH = this.bxPhaseData(e), list = PH.patterns || [];
    const pat = S.B.choose ? S.B.choose(this, e, list) : list[S.patIdx++ % list.length];
    if (!pat) { S.wait = 0.12; return; }
    S.pat = pat; S.fired = false; this.bxLog(e, 'pattern', pat.name);
    if (pat.special && S.B.specials[pat.special] && pat.instant) { S.B.specials[pat.special](this, e, pat, null); S.state = 'recover'; S.wait = (pat.recover || 0.4) * (S.B.tempo || 1); return; }
    S.state = 'windup'; S.wait = Math.max(0.45, (pat.windup || 0.6) * (S.B.tempo || 1) * (S.tempoK || 1));
    if (S.anim) { S.anim.play(S.def.phases[S.phase].attack); S.anim.speed = 0; }
    if (pat.tell && S.B.specials[pat.tell]) S.B.specials[pat.tell](this, e, pat, null);
  }
  bxClipEnded(e, clip) {
    const S = e.bx, ph = S.def.phases;
    if (clip === ph[S.phase].attack) { if (!S.fired) this.bxRelease(e); S.anim.play(ph[S.phase].idle); if (S.state === 'release') { S.state = 'recover'; S.wait = ((S.pat && S.pat.recover) || 0.4) * (S.B.tempo || 1) * (S.tempoK || 1); } return; }
    if (S.state === 'morph' && clip === ph[S.phase].enter) { S.anim.play(ph[S.phase].idle); S.state = 'grace'; S.wait = S.B.morphGrace || 2.4; e.invulnT = 0; return; }
    if (S.state === 'death' && clip === S.def.death) this.bxFinish(e);
  }
  bxRelease(e) { const S = e.bx, pat = S.pat; S.fired = true; if (!pat) return; for (const V of pat.volleys || []) S.vol.push({ t: V.t || 0, V }); if (pat.special && S.B.specials[pat.special]) S.B.specials[pat.special](this, e, pat, null); }
  bxPressure(e, dt) {
    const S = e.bx, L = this.bxPhaseData(e).pressure; if (!L) return;
    S.pr = S.pr && S.prPhase === S.phase ? S.pr : L.map((q) => (q.delay !== undefined ? q.delay : q.every * 0.6)); S.prPhase = S.phase;
    L.forEach((q, k) => { if ((S.pr[k] -= dt) > 0) return; S.pr[k] = q.every * (0.9 + Math.random() * 0.2); if (q.special && S.B.specials[q.special]) S.B.specials[q.special](this, e, q, null); else if (q.form) this.bxVolley(e, q); });
  }
  bxVolley(e, V) {                                       // (the timed queue: 'special' calls the boss's own function; fan / ring kept for older bosses)
    const S = e.bx;
    if (V.form === 'special') { const f = S.B.specials[V.name]; if (f) f(this, e, V); else console.warn('no special', V.name); return; }
    const p = this.player, aim = V.angle !== undefined ? V.angle : Math.atan2(p.y - e.y, p.x - e.x);
    if (V.form === 'fan') { const n = V.count || 5, sp = V.spread || 1; for (let k = 0; k < n; k++) this.bxShot(e, e.x, e.y, aim + (V.offset || 0) + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0), V); }
    else if (V.form === 'ring') { const n = V.count || 12; for (let k = 0; k < n; k++) this.bxShot(e, e.x, e.y, (V.offset || 0) + (k / n) * TAU_, V); }
  }
  bxMove(e, dt, how) {
    const S = e.bx, x0 = e.x, y0 = e.y;
    this.bxMoveRaw(e, dt, how);
    const dx = e.x - x0, dy = e.y - y0; if (Math.hypot(dx, dy) > 1 || dt <= 0) { S.mvx = 0; S.mvy = 0; return; }
    e.x = x0; e.y = y0;
    const wx = dx / dt, wy = dy / dt, k = Math.min(1, dt * (Math.hypot(wx, wy) > 6 || Math.hypot(S.mvx || 0, S.mvy || 0) > 6 ? 14 : 5));
    S.mvx = (S.mvx || 0) + (wx - (S.mvx || 0)) * k; S.mvy = (S.mvy || 0) + (wy - (S.mvy || 0)) * k;
    this.moveCircle(e, S.mvx * dt, S.mvy * dt, 0.8);
  }
  bxMoveRaw(e, dt, how) {
    const p = this.player, D = e.D, S = e.bx;
    const step = (tx, ty, sp) => { const dd = Math.hypot(tx - e.x, ty - e.y); if (dd > 0.2) this.moveCircle(e, ((tx - e.x) / dd) * Math.min(dd, sp * dt), ((ty - e.y) / dd) * Math.min(dd, sp * dt), 0.8); };
    if (how === 'hold') return;
    if (how === 'pace') { const a = Math.atan2(e.y - p.y, e.x - p.x) + Math.sin(S.t * 0.6) * 0.5; step(p.x + Math.cos(a) * (D.keep || 6), p.y + Math.sin(a) * (D.keep || 6), D.speed || 1.2); }
    else if (S.B.moves && S.B.moves[how]) S.B.moves[how](this, e, dt);
  }
  bxImmune(e, x, y) {
    const S = e.bx; if (!S) return false;
    if (['sleep', 'intro', 'morph', 'death', 'deathhold'].includes(S.state)) { this.float(x, y, 'IMMUNE', '#8d88a0'); return true; }
    if (S.B.immune && S.B.immune(this, e)) { this.float(x, y, S.B.immuneText || 'IMMUNE', '#c8c0d8'); return true; }
    return false;
  }
  bxClamp(e, d) {
    const S = e.bx; if (S.B.dmgMult) d = Math.round(d * S.B.dmgMult(this, e));
    const th = this.bxThresholds(e), next = th[S.phase - 1];
    if (next !== undefined && e.hp - d <= e.maxHp * next) { const keep = e.hp - e.maxHp * next; this.bxMorph(e); return Math.max(0, keep); }
    if (e.hp - d <= 0 && S.state !== 'death') { this.bxDie(e); return 0; }
    if (!(S.flinchNext > this.t)) { S.flinch = this.t + 0.2; S.flinchNext = this.t + 0.6; }
    return d;
  }
  bxMorph(e) {
    const S = e.bx, def = S.def; S.phase++; S.state = 'morph'; S.patIdx = 0; S.pat = null; S.vol = []; S.mvx = 0; S.mvy = 0; e.invulnT = 99;
    this.bxClearBullets(e);
    const ph = def.phases[S.phase]; this.banner((ph && ph.name || 'PHASE ' + S.phase).toUpperCase(), 2000); this.vx({ k: 'shake', amt: 8 });
    if (S.anim && ph) S.anim.play(ph.enter || ph.idle, { speed: S.B.morphSpeed || 0.55 });
    if (!ph || !ph.enter) { S.state = 'grace'; S.wait = 3; e.invulnT = 0; }
    if (S.B.onPhase) S.B.onPhase(this, e, S.phase);
    this.bxLog(e, 'phase', S.phase + ' ' + ((ph && ph.name) || ''));
  }
  bxDie(e) { const S = e.bx; S.state = 'death'; S.vol = []; e.hp = 1; this.bxClearBullets(e); if (S.B.onDeath) S.B.onDeath(this, e); if (S.anim && S.def.anims[S.def.death]) S.anim.play(S.def.death); else this.bxFinish(e); this.bxLog(e, 'death', ''); }
  bxFinish(e) { const S = e.bx; S.state = 'gone'; e.dead = true; e.hp = 0; this.vx({ k: 'burst', x: e.x, y: e.y - 2, n: 30, colors: ['#ffd650', '#ffffff'] }); this.banner(e.D.name + ' FALLS', 2000); }
  // ---- the world each frame
  steerEnemyShot(b, dt) {                                // shots with a personality (V.mv): as src/game.js steerEnemyShot (homing left out: no seeking shots)
    const M = b.mv; b.t = (b.t || 0) + dt;
    if (b.ha === undefined) { b.ha = Math.atan2(b.vy, b.vx); b.hs = Math.hypot(b.vx, b.vy); b.s0 = b.hs; }
    if (M.hold && b.t < M.hold) { b.vx = 0; b.vy = 0; b.life += dt; return false; }
    if (M.accel) b.hs = Math.min(b.s0 * (M.max || 3), b.hs + M.accel * dt);
    if (M.curve) b.ha += M.curve * (b.cs ?? 1) * dt;
    if (M.brake && !b.re && b.t > M.brake) { b.hs = Math.max(0.15, b.hs - b.hs * 7 * dt); if (b.t > M.brake + 0.35) { const f = this.player; b.re = true; b.ha = Math.atan2(f.y - b.y, f.x - b.x); b.hs = M.re || b.s0 * 1.6; b.life = Math.max(b.life, 2.2); } }
    if (M.boomer && !b.back && b.t > M.boomer) { b.back = true; b.ha += Math.PI; b.life = Math.max(b.life, M.boomer + 0.2); }
    if (M.split && b.t >= M.split.at) { const n = M.split.n; for (let k = 0; k < n; k++) this.projectiles.push({ from: 'e', x: b.x, y: b.y, vx: Math.cos(b.ha + (k / n) * TAU_) * (M.split.speed || 4), vy: Math.sin(b.ha + (k / n) * TAU_) * (M.split.speed || 4), life: (M.split.range || 3.5) / (M.split.speed || 4), dmg: Math.round(b.dmg * 0.6), sprite: M.split.proj || b.sprite, r: 0.3, by: b.by, bxOf: b.bxOf }); return true; }
    b.vx = Math.cos(b.ha) * b.hs; b.vy = Math.sin(b.ha) * b.hs;
    if (M.wave) { const w = M.wave.amp * M.wave.freq * Math.cos(M.wave.freq * b.t + (b.cs === -1 ? Math.PI : 0)), perp = b.ha + Math.PI / 2; b.vx += Math.cos(perp) * w; b.vy += Math.sin(perp) * w; }
    b.a = Math.atan2(b.vy, b.vx); return false;
  }
  updateFx(dt) {
    const p = this.player;
    for (const f of this.fx) {
      f.t += dt;
      if (f.kind === 'zone' && !f.done && f.t >= f.delay) { f.done = true; if (!p.dead && f.dmg > 0 && dist2(p.x, p.y, f.x, f.y) < f.r * f.r) this.hurtPlayer(f.dmg, f.by); }
      if (f.kind === 'lane' && f.t >= f.delay && !p.dead) {
        f.hitT = (f.hitT || 0) - dt; if (f.spin) f.a = f.a0 + f.spin * (f.t - f.delay);
        const dx = p.x - f.x, dy = p.y - f.y, along = dx * Math.cos(f.a) + dy * Math.sin(f.a), across = Math.abs(-dx * Math.sin(f.a) + dy * Math.cos(f.a));
        if (f.dmg && f.hitT <= 0 && along > 0 && along < f.len && across < f.w) { f.hitT = f.every || 0.3; this.hurtPlayer(f.dmg, f.by); }
      }
      if (f.kind === 'cleave' && !f.done && f.t >= f.delay && !p.dead) { f.done = true; const dx = p.x - f.x, dy = p.y - f.y, da = Math.atan2(dy, dx) - f.a; if (Math.hypot(dx, dy) < f.r + HITBOX.r && Math.abs(Math.atan2(Math.sin(da), Math.cos(da))) < f.spread / 2) this.hurtPlayer(f.dmg, f.by); }
    }
    this.fx = this.fx.filter((f) => f.t < (f.life ?? (f.kind === 'ring' ? 0.6 : 1)));
  }
  updateShots(dt) {
    const p = this.player, keep = [];
    for (const b of this.projectiles) {
      if (b.mv && b.from === 'e' && this.steerEnemyShot(b, dt)) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.a === undefined) b.a = Math.atan2(b.vy, b.vx);
      if (b.life <= 0 || isSolid(this.map, b.x, b.y)) continue;
      if (b.from === 'e') { if (!p.dead && segDist(p.x, p.y - HITBOX.foot, p.x, p.y - HITBOX.head, b.x, b.y) < b.r + HITBOX.r) { this.hurtPlayer(b.dmg, b.by); continue; } }
      else { const hit = this.enemies.find((e) => !e.dead && Math.hypot(e.x - b.x, (e.y - (e.hitUp || 0) * 0.5) - b.y) < (e.D.r || 0.6) + 0.5); if (hit) { this.damageEnemy(hit, b.dmg); continue; } }
      keep.push(b);
    }
    this.projectiles = keep;
  }
}
const BOSSES = {};                               // id -> the boss's export (filled by the build from the game's own boss files)
