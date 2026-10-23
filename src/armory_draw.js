// What the Mad God Armory's mechanics show (src/armory.js), drawn as its test range draws them, in the game's world:
// mirrors, gold motes, the echo of you, stars and their constellation, chimes, the black hole, the maw, the mandala,
// the Four Horsemen, the halted field, tears in the world, footprints, pillars of light, Gloria's column, Empyrean's
// wings, the Aureole's halo and crown, and what sits on a monster (seeds, leeches, marks, sun and moon, sleep, stitches).
// armGround: under the shots; armTop: over them.
import { ITEMS } from './data/items.js';
import { glowDraw, sprAt, glowLayer, frameOf } from './armory_art.js';
const TS = 16;                                             // (buffer pixels a tile, as in render.js)

const A = (name) => { for (const it of Object.values(ITEMS)) if (it.arm && it.arm.name === name) return it.arm; return null; };
const cache = {};
const art = (name) => cache[name] || (cache[name] = A(name));
const PLAYER = { f: [['..hhhh..', '.hhhhhh.', '..fkfk..', '..ffff..', '.frrrrf.', 'f.rrrr.f', '..r..r..', '..k..k..']], p: { h: '#3557c9', f: '#f1c9a0', k: '#1b1324', r: '#5b3fa8' } };

const methods = {
  // a sprite of the armory at (screen) x, y: armory pixel scale sc (40 px a tile there, TS here)
  armSpr(def, sc, x, y, color, rot = 0, alpha = 1, strength = 1, t = performance.now()) {
    const U = this.U || 1, scale = Math.max(1, Math.round(sc * (TS / 40) * U)), b = this.b;
    b.save(); b.translate(Math.round(x), Math.round(y)); b.scale(1 / U, 1 / U);
    glowDraw(b, def, scale, t, color, 0, 0, rot, alpha, 1, strength);
    b.restore();
  },
  armRing(x, y, r, col, a = 1, w = 2) { const b = this.b, [sx, sy] = this.proj(x, y); b.save(); b.globalAlpha = a; b.strokeStyle = col; b.lineWidth = w; b.beginPath(); b.ellipse(sx, sy, r * TS, r * TS, 0, 0, Math.PI * 2); b.stroke(); b.restore(); },
  armGround(g) {
    const p = g.player, S = p && p.armS;
    if (!S) return;
    const b = this.b, t = g.t, now = performance.now();
    // Gloria's column of light (5 tiles wide, round you)
    if (S.col && S.col.t < 4.4) {
      const c = S.col, k = Math.min(1, c.t / 0.25, (4.4 - c.t) / 0.4), [sx, sy] = this.proj(c.x, c.y), w = 2.5 * TS;
      b.save(); b.globalCompositeOperation = 'lighter';
      const gr = b.createLinearGradient(sx - w, 0, sx + w, 0); gr.addColorStop(0, 'rgba(255,243,196,0)'); gr.addColorStop(0.5, `rgba(255,243,196,${0.28 * k})`); gr.addColorStop(1, 'rgba(255,243,196,0)');
      b.fillStyle = gr; b.fillRect(sx - w, 0, w * 2, this.buf.height);
      b.strokeStyle = `rgba(255,243,196,${0.5 * k})`; b.lineWidth = 1; b.beginPath(); b.ellipse(sx, sy, w, w * 0.18, 0, 0, Math.PI * 2); b.stroke(); b.restore();
    }
    // Celestial Weaver: the constellation's lines and stars
    const st = S.stars && S.stars.filter((s) => s.until > t);
    if (st && st.length > 1) {
      b.save(); b.strokeStyle = 'rgba(147,197,253,.75)'; b.lineWidth = 1.5; b.shadowColor = '#60a5fa'; b.shadowBlur = 6; b.beginPath();
      st.forEach((s, i) => { const [x, y] = this.proj(s.x, s.y); i ? b.lineTo(x, y) : b.moveTo(x, y); }); if (st.length > 2) b.closePath(); b.stroke(); b.restore();
    }
    if (st) { const W = art('Celestial Weaver'); for (const s of st) { const [x, y] = this.proj(s.x, s.y); this.armSpr(W.shots[0], 3, x, y, '#60a5fa', 0, Math.min(1, (s.until - t) / 0.3), 1, now + s.born * 1000); } }
    // World Ripper: the tears
    for (const tr of S.tears || []) {
      if (tr.until < t) continue;
      const k = Math.min(1, (tr.until - t) / 0.6), [ax, ay] = this.proj(tr.a.x, tr.a.y), [bx, by] = this.proj(tr.b.x, tr.b.y), n = Math.max(2, Math.floor(Math.hypot(bx - ax, by - ay) / 6)), pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, j = i && i < n ? (Math.random() - 0.5) * 3 : 0; pts.push([ax + (bx - ax) * u + j, ay + (by - ay) * u + j]); }
      const ln = (w, col) => { b.strokeStyle = col; b.lineWidth = w; b.beginPath(); pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y))); b.stroke(); };
      b.save(); b.globalAlpha = k; ln(4, 'rgba(126,34,206,.35)'); ln(2, '#0a0410'); ln(0.8, '#e879f9'); b.restore();
    }
    // Thousand Steps: the footprints
    if (S.fp) { const W = art('Thousand Steps'); for (const f of S.fp) { const age = t - f.born, k = age < 0.8 ? 0.5 + (0.5 * age) / 0.8 : Math.max(0, 1 - (age - 0.8) / 0.8), [x, y] = this.proj(f.x, f.y); this.armSpr(W.shots[2], 2, x, y, '#60a5fa', f.a + this.th + Math.PI / 2, k, age < 0.8 ? 0.8 : 1.4); } }
    // Singularity Core: the hole
    const h = S.hole;
    if (h && !h.done && h.mass) {
      const [x, y] = this.proj(h.x, h.y - 0.5), r = (10 + h.mass * 1.6) * (TS / 40);
      b.save(); const gr = b.createRadialGradient(x, y, r * 0.6, x, y, r * 2.4); gr.addColorStop(0, 'rgba(168,85,247,.55)'); gr.addColorStop(1, 'rgba(168,85,247,0)'); b.fillStyle = gr; b.beginPath(); b.arc(x, y, r * 2.4, 0, 7); b.fill();
      b.fillStyle = '#05010a'; b.beginPath(); b.arc(x, y, r, 0, 7); b.fill(); b.strokeStyle = '#f59e0b'; b.lineWidth = 1; b.beginPath(); b.ellipse(x, y, r * 1.5, r * 0.45, now * 0.001, 0, 7); b.stroke();
      b.strokeStyle = '#c084fc'; b.lineWidth = 1.5; b.beginPath(); b.arc(x, y, r, 0, 7); b.stroke(); b.restore();
    }
    // The Hunger: the maw
    const w = S.maw;
    if (w) {
      const k = Math.min(1, w.t / 0.25, Math.max(0, (1.55 - w.t) / 0.35)), r = (w.feast ? 110 : 58) * (TS / 40) * k, [x, y] = this.proj(w.x, w.y - 0.5);
      b.save(); b.translate(x, y); b.fillStyle = 'rgba(127,29,29,.55)'; b.beginPath(); b.arc(0, 0, r * 1.5, 0, 7); b.fill(); b.fillStyle = '#12040a'; b.beginPath(); b.arc(0, 0, r, 0, 7); b.fill();
      b.fillStyle = '#f1e8d0'; const n = w.feast ? 22 : 14; for (let i = 0; i < n; i++) { b.save(); b.rotate((i / n) * 6.283 + w.t * 2); b.fillRect(r - 5, -1.2, 5, 2.4); b.restore(); }
      b.strokeStyle = '#ef4444'; b.lineWidth = 1.5; b.beginPath(); b.arc(0, 0, r, 0, 7); b.stroke(); b.restore();
    }
    // Apocalypse Chorus: the four relics and their reach
    const hm = S.hm;
    if (hm) {
      const W = art('Apocalypse Chorus'), k = Math.min(1, (3.2 - hm.t) / 0.4);
      b.save(); b.globalAlpha = 0.18 * k; for (const s of hm.spots) if (s.up) { const [x, y] = this.proj(s.x, s.y); b.fillStyle = s.c; b.beginPath(); b.arc(x, y, (110 / 40) * TS, 0, 7); b.fill(); } b.restore();
      b.save(); b.globalAlpha = 0.25 * k; b.strokeStyle = '#ffffff'; b.setLineDash([2, 3]); b.beginPath(); hm.spots.forEach((s, i) => { const [x, y] = this.proj(s.x, s.y); i ? b.lineTo(x, y) : b.moveTo(x, y); }); b.closePath(); b.stroke(); b.restore();
      hm.spots.forEach((s, i) => { if (s.up) { const [x, y] = this.proj(s.x, s.y - 0.6); this.armSpr(W.shots[i], 5, x, y + Math.sin(now * 0.004 + i) * 2, s.c, 0, k); } });
    }
    // Reality Unbound: the halted field
    const z = S.za;
    if (z && z.t < 1.4) {
      const k = Math.min(1, z.t / 0.12, (1.4 - z.t) / 0.2), [x, y] = this.proj(z.c.x, z.c.y), r = 5 * TS;
      b.save(); b.globalCompositeOperation = 'difference'; b.fillStyle = `rgba(255,255,255,${0.92 * k})`; b.beginPath(); b.arc(x, y, r, 0, 7); b.fill(); b.restore();
      b.save(); b.strokeStyle = `rgba(240,171,252,${k})`; b.lineWidth = 1.5; b.beginPath(); b.arc(x, y, r, 0, 7); b.stroke();
      const a = -Math.PI / 2 + Math.min(1, z.t / 1.2) * 6.283; b.lineWidth = 2; b.beginPath(); b.moveTo(x, y); b.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); b.stroke(); b.restore();
    }
    // The Last Verse: the mandala
    const m = S.m;
    if (m) {
      const W = art('The Last Verse'), CL = ['#ef4444', '#67e8f9', '#fde047', '#a855f7', '#84cc16', '#fff1a8'], col = CL[m.el], k = Math.min(1, m.t / 0.2, (m.len - m.t) / 0.3), Rk = m.fin ? 1.9 : 1, [x, y] = this.proj(m.x, m.y);
      b.save(); b.globalAlpha = 0.6 * k; b.lineWidth = 1;
      for (const [r0, dir] of [[46, 1], [62, -1], [80, 1]]) { if (r0 === 80 && !m.fin) continue; b.strokeStyle = m.fin ? CL[Math.floor(now / 120 + r0) % 5] : col; b.setLineDash([4, 3]); b.lineDashOffset = dir * m.t * 50; b.beginPath(); b.arc(x, y, (r0 * Rk * TS) / 40, 0, 7); b.stroke(); }
      b.restore();
      this.armSpr(W.item, m.fin ? 9 : 5, x, y, col, m.rot, k, m.fin ? 1.8 : 1);
    }
    // Bone Garden: spikes and turrets
    const BG = art('Bone Garden');
    for (const v of S.vis) if (v.k === 'spike') { const age = t - v.t0, s2 = Math.min(1, age / 0.09) * (age > 0.42 ? (0.6 - age) / 0.18 : 1), [x, y] = this.proj(v.x, v.y); if (s2 > 0) this.armSpr(BG.shots[2], 4 * s2, x, y - 4, '#f5ecd5'); }
    for (const q of S.turrets || []) if (q.until > t) { const [x, y] = this.proj(q.x, q.y); this.armSpr(BG.shots[1], 5 * Math.min(1, (t - q.born) / 0.3), x, y - 6, '#f5ecd5'); }
    // Glass Psalm: the chimes
    if (S.ch) { const W = art('Glass Psalm'); for (const c of S.ch) { if (c.until < t) continue; const rg = t - c.rang < 0.3, [x, y] = this.proj(c.x, c.y); this.armSpr(W.shots[1], 3, x, y, rg ? '#ffffff' : '#7dd3fc', Math.sin(now * 0.004 + c.o) * 0.25 + (rg ? Math.sin(now * 0.08) * 0.3 : 0), Math.min(1, (c.until - t) / 0.3), rg ? 2 : 1); } }
    // Mirror Maw: the mirror
    const mi = S.mir;
    if (mi && mi.until > t && !((mi.until - t) < 0.5 && Math.floor(now / 80) % 2)) {
      const [x, y] = this.proj(mi.x, mi.y), k = Math.min(1, (t - mi.born) / 0.15);
      b.save(); b.translate(x, y); b.rotate(Math.sin(now * 0.003) * 0.25); b.globalAlpha = k; b.shadowColor = '#7dd3fc'; b.shadowBlur = 8;
      b.fillStyle = '#1e3a8a'; b.fillRect(-3, -10, 6, 20); b.fillStyle = '#c7d2e0'; b.fillRect(-2, -9, 4, 18); b.fillStyle = '#bfefff'; b.fillRect(-1, -8, 2, 16);
      const sy = ((now * 0.03) % 24) - 12; b.fillStyle = '#ffffff'; b.fillRect(-1, sy - 2, 2, 3); b.restore();
    }
  },
  armTop(g) {
    const p = g.player, S = p && p.armS;
    if (!S) return;
    const b = this.b, t = g.t, now = performance.now();
    for (const v of S.vis) {
      const age = t - v.t0, k = Math.max(0, 1 - age / (v.life || 1));
      if (v.k === 'ring') this.armRing(v.x, v.y - 0.5, v.r * (age / v.life), v.col, k, 4 * k + 1);
      else if (v.k === 'line') { const [ax, ay] = this.proj(v.x0, v.y0), [bx, by] = this.proj(v.x1, v.y1); b.save(); b.globalAlpha = k; b.strokeStyle = v.col; b.lineWidth = 1.5; b.beginPath(); b.moveTo(ax, ay); b.lineTo(bx, by); b.stroke(); b.restore(); }
      else if (v.k === 'smiteMark') { const [x, y] = this.proj(v.x, v.y); b.save(); b.strokeStyle = `rgba(255,227,154,${0.9 - 0.5 * k})`; b.lineWidth = 1; b.beginPath(); b.ellipse(x, y, TS * (0.6 + k * 1.2), TS * (0.6 + k * 1.2) * 0.6, 0, 0, 7); b.stroke(); b.beginPath(); b.moveTo(x - 4, y); b.lineTo(x + 4, y); b.moveTo(x, y - 4); b.lineTo(x, y + 4); b.stroke(); b.restore(); }
      else if (v.k === 'pillar') {
        const [x, y] = this.proj(v.x, v.y), ww = (26 + 14 * Math.sin(Math.PI * (age / v.life))) * k * (TS / 40);
        b.save(); b.globalCompositeOperation = 'lighter';
        const gr = b.createLinearGradient(x - ww, 0, x + ww, 0); gr.addColorStop(0, 'rgba(255,227,154,0)'); gr.addColorStop(0.5, `rgba(255,250,230,${0.95 * k})`); gr.addColorStop(1, 'rgba(255,227,154,0)');
        b.fillStyle = gr; b.fillRect(x - ww, 0, ww * 2, y + 3);
        const r = b.createRadialGradient(x, y, 2, x, y, 1.5 * TS); r.addColorStop(0, `rgba(255,255,255,${k})`); r.addColorStop(1, 'rgba(255,227,154,0)'); b.fillStyle = r; b.beginPath(); b.ellipse(x, y, 1.5 * TS, 0.55 * TS, 0, 0, 7); b.fill(); b.restore();
      }
      else if (v.k === 'halo') { const H = art('Hosanna'), [x, y] = this.proj(v.x, v.y - 0.5); this.armSpr(H.shots[1], 18, x, y, '#fff1b8', t * 2, k, 1.6); }
      else if (v.k === 'meteor') { const [x, y] = this.proj(v.x, v.y), u = age / v.life, sx = x + 104 * (1 - u) * (TS / 40) * 2.5, sy = y - 132 * (1 - u) * (TS / 40) * 2.5; const S2 = art('Starfall Engine'); this.armSpr(S2.shots[0], 3 + v.n, sx, sy, '#fb923c', Math.atan2(y - sy, x - sx) + Math.PI / 4); }
      else if (v.k === 'eclipse' && v.e) { const [x, y] = this.proj(v.e.x, v.e.y - 0.5), kk = Math.sin(Math.PI * (age / v.life)); b.save(); b.globalCompositeOperation = 'lighter'; const gr = b.createRadialGradient(x, y, 6, x, y, 26); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.4, `rgba(255,241,168,${0.8 * kk})`); gr.addColorStop(1, 'rgba(255,160,60,0)'); b.fillStyle = gr; b.beginPath(); b.arc(x, y, 26, 0, 7); b.fill(); b.restore(); }
      else if (v.k === 'slash') { const [x, y] = this.proj(v.x, v.y - 0.5); b.save(); b.strokeStyle = v.col ? `rgba(245,232,255,${k})` : `rgba(233,213,255,${k})`; b.lineWidth = 2 * k + 1; b.beginPath(); b.moveTo(x - 12, y + 10); b.lineTo(x + 12, y - 10); b.stroke(); b.restore(); }
      else if (v.k === 'crown') { const AU = art('Aureole'), [x, y] = this.proj(v.x, v.y - 0.5); this.armSpr(AU.shots[1], 4 + Math.floor((age / v.life) * 16), x, y, '#fff3c4', 0, k, 1.4); }
      else if (v.k === 'rewind') { const [x0, y0] = this.proj(v.x0, v.y0), [x1, y1] = this.proj(p.x, p.y - 0.5), u = age / v.life; b.save(); b.strokeStyle = `rgba(129,140,248,${1 - u})`; b.lineWidth = 1.5; b.setLineDash([1, 3]); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u); b.stroke(); b.restore(); }
      else if (v.k === 'poly') { b.save(); b.fillStyle = `rgba(147,197,253,${0.35 * k})`; b.beginPath(); v.pts.forEach((q, i) => { const [x, y] = this.proj(q.x, q.y); i ? b.lineTo(x, y) : b.moveTo(x, y); }); b.closePath(); b.fill(); b.restore(); }
    }
    // Null Walker's stutter (Judgment no longer flashes the screen: the user's call, 2026-10-22)
    if (S.stutter && t - S.stutter < 0.26) { b.save(); b.fillStyle = 'rgba(20,0,40,.6)'; b.fillRect(0, 0, this.buf.width, this.buf.height); b.fillStyle = 'rgba(245,232,255,.12)'; for (let y = 0; y < this.buf.height; y += 4) b.fillRect(0, y, this.buf.width, 1); b.restore(); }
    // on the player: Hosanna's halo, the Aureole's gathering halo, Empyrean's wings, the hydra's heads, the counters
    const [px, py] = this.proj(p.x, p.y);
    if (g.armHeld && g.armHeld(this.armId('Hosanna'))) { const H = art('Hosanna'); this.armSpr(H.shots[1], 2, px, py - 22, '#fff1b8', 0, 0.9, 0.9); }
    if (g.armHeld && g.armHeld(this.armId('Aureole'))) { const AU = art('Aureole'), ch = S.halo || 0; this.armSpr(AU.shots[0], 4, px, py - 24, '#fff3c4', 0, 0.35 + 0.65 * ch, ch >= 1 ? 1.8 : 0.6 * ch); }
    if (S.wingsT > t) {
      const E = art('Empyrean'), def = E.shots[1], U = this.U || 1, scale = Math.max(1, Math.round(5 * (TS / 40) * U)), img = sprAt(def, scale, now), gl = glowLayer(def, scale, frameOf(def, now)[0], '#fff3c4'), k = Math.min(1, (S.wingsT - t) / 0.25);
      for (const s of [-1, 1]) { b.save(); b.translate(px + s * 10, py - 14); b.scale((-s) / U, 1 / U); b.globalAlpha = k; b.globalCompositeOperation = 'lighter'; b.drawImage(gl, -gl.width / 2, -gl.height / 2); b.globalCompositeOperation = 'source-over'; b.drawImage(img, -img.width / 2, -img.height / 2); b.restore(); }
    }
    if (g.armHeld && g.armHeld(this.armId("Serpent's Reach"))) { const W = art("Serpent's Reach"), n = S.heads || 1; for (let i = 0; i < 3; i++) this.armSpr(W.shots[0], 2, px - 7 + i * 7, py + 13, i < n ? '#4ade80' : '#333333', -Math.PI / 4, i < n ? 1 : 0.25); }
    const bar = (f, col, y = 12) => { b.fillStyle = 'rgba(255,255,255,.15)'; b.fillRect(px - 10, py + y, 20, 2); b.fillStyle = col; b.fillRect(px - 10, py + y, 20 * Math.max(0, Math.min(1, f)), 2); };
    if (g.armHeld && g.armHeld(this.armId('The Hunger'))) bar((S.hunger || 0) / 10, (S.hunger || 0) >= 10 ? '#ff3b4e' : '#b91c1c');
    if (g.armHeld && g.armHeld(this.armId('Null Walker'))) bar((S.nul || 0) / 12, '#c084fc');
    if (g.armHeld && g.armHeld(this.armId('Paradox Script'))) for (let i = 0; i < 10; i++) { b.fillStyle = i < (S.caus || 0) ? '#a5b4fc' : 'rgba(255,255,255,.15)'; b.fillRect(px - 10 + i * 2, py + 12, 1.5, 2); }
    if (g.armHeld && g.armHeld(this.armId('The Last Verse'))) { const CL = ['#ef4444', '#67e8f9', '#fde047', '#a855f7', '#84cc16']; const pr = S.m ? S.m.el : (S.verse ?? -1); for (let i = 0; i < 5; i++) { b.fillStyle = i <= pr && pr < 5 ? CL[i] : 'rgba(255,255,255,.15)'; b.fillRect(px - 10 + i * 4, py + 12, 3, 2); } }
    if (S.phase) { b.save(); b.globalAlpha = 0.5; b.fillStyle = '#7c3aed'; b.beginPath(); b.arc(px, py - 6, 9, 0, 7); b.fill(); b.restore(); for (const e of S.phase.marked) { const [x, y] = this.proj(e.x, e.y - 0.5); b.save(); b.strokeStyle = '#c084fc'; b.setLineDash([2, 2]); b.beginPath(); b.arc(x, y, 10, 0, 7); b.stroke(); b.restore(); } }
    // Time Echo: you, two seconds behind
    if (g.armHeld && g.armHeld(this.armId('Time Echo'))) {
      const h = S.echoHist || (S.echoHist = []); h.push({ t, x: p.x, y: p.y }); while (h.length && h[0].t < t - 2.1) h.shift();
      if (h.length && t - h[0].t > 1.9) { const q = h[0], [x, y] = this.proj(q.x, q.y); this.armSpr(PLAYER, 5, x, y - 8, '#a855f7', 0, 0.45, 1); }
    }
    // Phantom Thread's stitches
    const tt = S.tether;
    if (tt && tt.until > t) {
      const arr = [...tt.set].filter((e) => !e.dead);
      b.save(); b.strokeStyle = '#e2e8f0'; b.lineWidth = 1; b.setLineDash([2, 2]); b.lineDashOffset = -now * 0.03;
      for (const e of arr) { const [x, y] = this.proj(e.x, e.y - 0.5); b.beginPath(); b.moveTo(px + 6, py - 4); b.quadraticCurveTo((px + x) / 2, (py + y) / 2 - 16, x, y); b.stroke(); }
      if (arr.length > 1) { b.beginPath(); arr.forEach((e, i) => { const [x, y] = this.proj(e.x, e.y - 0.5); i ? b.lineTo(x, y) : b.moveTo(x, y); }); if (arr.length > 2) b.closePath(); b.stroke(); }
      b.restore();
    }
    // on the monsters: seeds, leeches, star marks, sun and moon, sleep, crowns
    const BB = art('Blood Blossom'), VL = art('Void Leech'), SE = art('Starfall Engine'), AU = art('Aureole');
    for (const e of g.enemies) {
      if (e.dead) continue;
      const [x, y] = this.proj(e.x, e.y - 0.5);
      if (e.armSeeds) for (let i = 0; i < e.armSeeds; i++) { const a = (i / 5) * 6.283 + now * 0.002; this.armSpr(BB.shots[0], 1, x + Math.cos(a) * 9, y + Math.sin(a) * 9, '#ff4d5e'); }
      if (e.armLeech) e.armLeech.forEach((l, i) => { if (l.gone) return; const sw = Math.min(1, (t - l.born) / 2), fat = sw >= 1, a = l.o + i * 2.1; this.armSpr(VL.shots[0], fat ? 2.5 + Math.sin(now * 0.012) * 0.4 : 1.5 + sw, x + Math.cos(a) * 6, y + Math.sin(a) * 5, fat ? '#f0abfc' : '#a855f7', 0, 1, fat ? 1.6 : 0.8); });
      if (e.armMarks) for (let i = 0; i < e.armMarks; i++) this.armSpr(SE.shots[1], 2, x - (e.armMarks - 1) * 3 + i * 6, y - 14, '#fb923c');
      if (e.armSun > t) { b.fillStyle = '#fde68a'; b.beginPath(); b.arc(x - 4, y - 14, 2, 0, 7); b.fill(); }
      if (e.armMoon > t) { b.fillStyle = '#c4b5fd'; b.beginPath(); b.arc(x + 4, y - 14, 2, 0, 7); b.fill(); b.fillStyle = '#17181d'; b.beginPath(); b.arc(x + 5, y - 15, 1.6, 0, 7); b.fill(); }
      if (e.armSleepT > t) { b.save(); b.font = '6px monospace'; b.fillStyle = '#c4b5fd'; for (let i = 0; i < 3; i++) { const u = (t / 0.7 + i / 3) % 1; b.globalAlpha = 1 - u; b.fillText('z', x + 4 + u * 6, y - 10 - u * 10); } b.restore(); }
      if (e.armCrownT > t) this.armSpr(AU.shots[0], 2, x, y - 14, '#fff3c4', 0, 0.9);
    }
  },
  armId(name) { return 'arm_' + name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); },
};
export function installArmoryDraw(Renderer) { Object.assign(Renderer.prototype, methods); }
