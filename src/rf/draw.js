// Drawing a hosted Realmforge dungeon (src/rf/host.js) with our renderer: their pre-painted map is our ground (and so
// the tops of our 2.5D walls), and their objects, props, creatures, shots, traps and telegraphs are drawn from their own
// art, 8 pixels to a tile at 2x, turned with our camera like everything else. Mixed into the Renderer (render.js).
const TS = 16, K = 2, TAU = Math.PI * 2;
const fr = (a, f) => a[Math.floor(f) % a.length];

const methods = {
  // one tile of ground, cut from their painted map (walls included: our wall tops are cut from the ground)
  rfGroundTile(gc, m, tx, ty, dx, dy) {
    const E = m.rf.E;
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h || !E.base) { gc.fillStyle = '#000'; gc.fillRect(dx, dy, TS, TS); return; }
    gc.drawImage(E.base, tx * 8, ty * 8, 8, 8, dx, dy, TS, TS);
  },
  // one of their portals in the realm: its own animated art, at 2x
  rfPortal(g, pt, sx, sy) {
    const C = this.objDefs || (this.objDefs = new Map()), key = `rf_portals/${pt.rf}`;
    let def = C.get(key);
    if (def === undefined) C.set(key, (def = (this.R && this.R.resolve(key)) || null));
    if (!def) return;
    const F = def.anims.loop.frames, fr = def.frames[F[Math.floor(g.t * 6) % F.length]], b = this.b;
    b.drawImage(def.img, fr.x, fr.y, fr.w, fr.h, Math.round(sx - fr.w), Math.round(sy - fr.h * 2 + 4), fr.w * 2, fr.h * 2);
  },
  // a sprite of theirs, standing at a ground point, bottom-centred (rx, ry: that point on screen)
  rfSprite(im, rx, ry, o = {}) {
    if (!im) return;
    const b = this.b, w = im.width * K, h = im.height * K;
    b.save();
    if (o.alpha !== undefined) b.globalAlpha = o.alpha;
    if (o.flip) { b.translate(rx, 0); b.scale(-1, 1); b.translate(-rx, 0); }
    b.drawImage(im, Math.round(rx - w / 2), Math.round(ry - h + (o.down || 0)), w, h);
    b.restore();
  },
  // their things in our depth-sorted list
  rfAdd(g, m, add) {
    const E = m.rf.E, t = E.t;
    for (const o of E.M.objs) {
      if (o.gone) continue;
      const a = E.art[o.st ? o.k + '_' + o.st : o.k] || E.art[o.k];
      if (!a) continue;
      add(o.x + o.s / 2, o.y + o.s - 0.02, (rx, ry) => this.rfSprite(fr(a, t * (o.anim || 5) + ((o.x * 7 + o.y * 3) % 4)), rx, ry));
    }
    for (const pr of E.M.props) {
      if (pr.hidden || pr.k[0] === '_') continue;
      let a = E.art[pr.st ? pr.k + '_' + pr.st : pr.k] || E.art[pr.k];
      if (pr.k === 'plate' && pr.on) a = E.art.plate_on || a;
      if ((pr.k === 'chest' || pr.k === 'chest_rare') && pr.opened) a = E.art.chest_open || a;
      if (!a) continue;
      add(pr.x + 0.5, pr.y + 0.98, (rx, ry) => this.rfSprite(fr(a, t * (pr.k === 'portal' ? 8 : 4)), rx, ry, { down: a[0].height > 8 ? Math.min(8, a[0].height - 8) : 0 }));
    }
    for (const e of E.en_) {
      if (e.st === 'gone') continue;
      add(e.x, e.y, (rx, ry) => this.rfEnemy(g, E, e, rx, ry));
    }
    for (const d of E.drops) add(d.x, d.y, (rx, ry) => this.rfDropSpr(E, d, rx, ry));
  },
  rfEnemy(g, E, e, rx, ry) {
    const A = E.en[e.k], d = e.d, b = this.b;
    if (!A) return;
    const im = e.dormant && A.idle ? A.idle[0] : fr(e.flash > 0 || e.hp <= 0 ? A.white : A.f, e.f);
    const zy = Math.round((e.z || 0) * TS);
    if (e.hidden) {                                            // under the ground (or phased): only a stir of dust
      b.fillStyle = 'rgba(255,255,255,.45)'; const q = Math.floor(E.t * 6) % 3;
      b.fillRect(rx - 6 - q * 2, ry, 12 + q * 4, 2);
      if (d.phase) this.rfSprite(fr(A.f, e.f), rx, ry + zy + 6, { alpha: 0.14 + 0.08 * Math.sin(E.t * 9) });
      return;
    }
    b.fillStyle = 'rgba(0,0,0,.4)'; b.beginPath(); b.ellipse(rx, ry + 2, im.width * 0.7, 3, 0, 0, TAU); b.fill();
    let alpha = 1;
    if (e.dormant && e.wake != null) alpha = 0.5 + 0.5 * Math.sin(E.t * 30);
    if (e.hp <= 0) alpha = Math.max(0, 1 - (e.dead || 0) * 3.5);
    if (E.mod.alpha) alpha *= E.mod.alpha(e);
    this.rfSprite(im, rx, ry + zy + 6, { alpha, flip: e.face < 0 && !d.noflip });
    const h = im.height * K;
    if (e.shield > 0) { b.strokeStyle = '#8a8aff'; b.globalAlpha = 0.7; b.beginPath(); b.arc(rx, ry - h / 2, Math.max(im.width, im.height) + 2, 0, TAU); b.stroke(); b.globalAlpha = 1; }
    if (e.teleT > E.t) { b.strokeStyle = E.danger; b.globalAlpha = 0.5 + 0.5 * Math.sin(E.t * 30); b.beginPath(); b.arc(rx, ry - h / 2 + 4, Math.max(im.width, im.height) + 4, 0, TAU); b.stroke(); b.globalAlpha = 1; }
    if (e.hp > 0 && e.hp < e.max && !d.rare) {
      const bw = Math.max(16, im.width * K - 6);
      b.fillStyle = '#000'; b.fillRect(rx - bw / 2 - 1, ry - h - 1, bw + 2, 4);
      b.fillStyle = e.boss ? '#ff5050' : '#5ad06a'; b.fillRect(rx - bw / 2, ry - h, Math.round(bw * e.hp / e.max), 2);
    }
  },
  rfDropSpr(E, d, rx, ry) {
    const a = E.art[d.k] || (d.k === 'key' ? E.art.key : null), b = this.b;
    if (a) { this.rfSprite(fr(a, E.t * 4), rx, ry); return; }
    b.fillStyle = d.k === 'key' ? '#ffd84a' : d.k === 'potion' ? '#ff5c7a' : '#ffe066';
    const bob = Math.round(Math.sin(E.t * 5 + d.x) * 2);
    b.fillRect(rx - 3, ry - 8 + bob, 6, 6); b.fillStyle = '#000'; b.fillRect(rx - 3, ry - 2 + bob, 6, 1);
  },
  // on the ground, under everyone: trap rows, trails, gates, toggles, pulls and sweeps, telegraph circles
  rfGround(g, m) {
    const E = m.rf.E, M = E.M, b = this.b, P = (x, y) => this.proj(x, y);
    if (E.walls && (!this.rfWallArt || this.rfWallArt.id !== m.rf.id)) this.rfWallArt = { id: m.rf.id, img: E.walls[1] ? E.walls[1][0] : E.walls[0][0] };
    const cell = (x, y, im, fill) => {                        // one tile, turned with the camera
      const [ax, ay] = P(x, y), [bx, by] = P(x + 1, y), [cx, cy] = P(x, y + 1);
      b.save(); b.setTransform(this.scale * (bx - ax) / TS, this.scale * (by - ay) / TS, this.scale * (cx - ax) / TS, this.scale * (cy - ay) / TS, this.scale * ax, this.scale * ay);
      if (im) b.drawImage(im, 0, 0, TS, TS); else { b.fillStyle = fill; b.fillRect(0, 0, TS, TS); }
      b.restore();
    };
    const near = (x, y) => Math.abs(x - g.player.x) < 20 && Math.abs(y - g.player.y) < 20;
    for (const h of M.hz) {
      if (h.k === 'rows' && h.state && !h.hidden) {
        const im = h.state === 2 && E.art[h.on_] ? E.art[h.on_][0] : null;
        for (const k of h.cellset) { const x = k % M.W, y = (k / M.W) | 0; if (near(x, y)) cell(x, y, im, h.warnC || 'rgba(255,80,80,.35)'); }
      }
      if (h.k === 'sweep' && !h.disabled && near(h.x, h.y)) {
        b.save(); b.globalAlpha = 0.35; b.strokeStyle = h.c || E.danger; b.lineWidth = Math.max(3, (h.width || 0.5) * TS * 2);
        for (let i = 0; i < (h.arms || 1); i++) { const a = h.a + i * TAU / (h.arms || 1), [x0, y0] = P(h.x, h.y), [x1, y1] = P(h.x + Math.cos(a) * h.len, h.y + Math.sin(a) * h.len); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke(); }
        b.restore();
      }
      if (h.k === 'pull' && h.active !== 0 && near(h.x, h.y)) {
        const [x, y] = P(h.x, h.y); b.strokeStyle = h.c || 'rgba(255,255,255,.3)'; b.globalAlpha = 0.35;
        for (let i = 0; i < 3; i++) { const rr = ((E.t * 1.5 + i / 3) % 1) * h.r * TS; b.beginPath(); b.arc(x, y, Math.max(1, h.r * TS - rr), 0, TAU); b.stroke(); }
        b.globalAlpha = 1;
      }
    }
    for (const tr of E.trails) {
      if (!near(tr.x, tr.y)) continue;
      const a = E.art['trail_' + tr.kind], q = 1 - tr.age / tr.life, [x, y] = P(tr.x, tr.y);
      b.globalAlpha = Math.min(1, q * 3);
      if (a) { const im = fr(a, E.t * 6 + tr.x); b.drawImage(im, Math.round(x - im.width), Math.round(y - im.height), im.width * K, im.height * K); }
      else { b.fillStyle = tr.kind === 'ice' ? '#bff4ff' : tr.kind === 'ink' ? '#101020' : tr.kind === 'poison' ? '#8aff3a' : '#ff8a2a'; b.fillRect(Math.round(x) - 6, Math.round(y) - 4, 12, 8); }
      b.globalAlpha = 1;
    }
    for (const gt of M.gates) if (!gt.open && (gt.kind !== 'secret' || gt.art)) {
      const a = E.art[gt.art || (gt.kind === 'lock' ? 'lockgate' : 'gate')];
      if (a) for (const [x, y] of gt.cells) if (near(x, y)) cell(x, y, a[0]);
    }
    for (const tg of M.toggles) if (tg.on && tg.art) { const a = E.art[tg.art]; if (a) for (const [x, y] of tg.cells) if (near(x, y)) cell(x, y, fr(a, E.t * 4)); }
    for (const h of E.tele) {
      const q = Math.min(1, h.age / h.at), [x, y] = P(h.x, h.y);
      b.strokeStyle = h.c || E.danger; b.globalAlpha = 0.5 + 0.5 * q; b.lineWidth = 1;
      b.beginPath(); b.ellipse(x, y, h.r * TS, h.r * TS, 0, 0, TAU); b.stroke();
      b.globalAlpha = 0.22 * q; b.fillStyle = h.c || E.danger; b.beginPath(); b.ellipse(x, y, h.r * TS * q, h.r * TS * q, 0, 0, TAU); b.fill(); b.globalAlpha = 1;
    }
  },
  // a dungeon module's own drawing (its drawFloor, drawTop or drawLight: moving sunlight, a rising tide, lava, ink), done
  // in a view of theirs around the player (8 pixels to a tile, unturned) and laid over the world like the ground
  rfModLayer(g, m, which) {
    const E = m.rf.E, mod = E.mod, fn = mod && mod[which];
    if (!fn) return;
    const RT = 26, VW = RT * 16, VH = RT * 16, cx = Math.round((g.player.x - RT) * 8), cy = Math.round((g.player.y - RT) * 8);
    const cv = this.rfModCv || (this.rfModCv = Object.assign(document.createElement('canvas'), { width: VW, height: VH })), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, VW, VH); c.imageSmoothingEnabled = false; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const V = { b: c, sx: (x) => Math.round(x * 8 - cx), sy: (y) => Math.round(y * 8 - cy), vis: (x, y, mg) => x * 8 > cx - mg * 8 && x * 8 < cx + VW + mg * 8 && y * 8 > cy - mg * 8 && y * 8 < cy + VH + mg * 8,
      fr: (a, f) => a[Math.floor(f) % a.length], cx, cy, VW, VH, TS: 8 };
    E.V = V;
    try { fn.call(mod, V); } catch (err) { if (!this.rfModErr) { this.rfModErr = 1; console.warn('Realmforge module drawing', which, err); } }
    const b = this.b, s = this.scale, [ax, ay] = this.proj(cx / 8, cy / 8), [bx, by] = this.proj(cx / 8 + 1, cy / 8), [qx, qy] = this.proj(cx / 8, cy / 8 + 1), k = 1 / 8;
    b.save(); b.setTransform(s * (bx - ax) * k, s * (by - ay) * k, s * (qx - ax) * k, s * (qy - ay) * k, s * ax, s * ay); b.imageSmoothingEnabled = false;
    b.drawImage(cv, 0, 0); b.restore();
  },
  // a module's status line ("The crypt stirs ●●○○○", the tide, the hour), under the counters at the top left
  rfModHud(g, m) {
    const E = m.rf.E, mod = E.mod;
    if (!mod || !mod.hud) return;
    const cv = this.rfHudCv || (this.rfHudCv = Object.assign(document.createElement('canvas'), { width: 300, height: 48 })), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 300, 48);
    try { mod.hud.call(mod, c, 1, 300, 48, 4, 14); } catch (err) { return; }
    const c2 = this.ctx, k = Math.max(1, Math.round(this.c.width / 900)); c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.imageSmoothingEnabled = false; c2.drawImage(cv, 12, 52 * k, 300 * k, 48 * k); c2.restore();
  },
  // their light: the dungeon's darkness with a hole at every lamp, brazier and portal, then the coloured glow of each,
  // painted by their engine (8 pixels to a tile) and laid over the world like the ground. Shots are drawn after it.
  rfLight(g, m) {
    const E = m.rf.E, b = this.b;
    if (!E.dark) return;
    const [ax, ay] = this.proj(0, 0), [bx, by] = this.proj(1, 0), [cx, cy] = this.proj(0, 1), k = 1 / 8, s = this.scale;
    b.save();
    b.setTransform(s * (bx - ax) * k, s * (by - ay) * k, s * (cx - ax) * k, s * (cy - ay) * k, s * ax, s * ay);
    b.imageSmoothingEnabled = true;                          // (light is soft)
    b.drawImage(E.dark, 0, 0);
    b.globalCompositeOperation = 'lighter'; b.drawImage(this.rfSeenGlow(g, m), 0, 0);
    b.restore();
  },
  // the glow, only where you have been: a light in a room you have not found does not give the room away
  rfSeenGlow(g, m) {
    const E = m.rf.E, seen = m.seen;
    if (!seen) return E.glow;
    const R = m.rf.glowSeen || (m.rf.glowSeen = { n: -1, t: -9, c: Object.assign(document.createElement('canvas'), { width: E.glow.width, height: E.glow.height }), mask: Object.assign(document.createElement('canvas'), { width: m.w, height: m.h }) });
    if (g.t - R.t < 0.4) return R.c;
    R.t = g.t;
    let n = 0; for (let i = 0; i < seen.length; i++) n += seen[i];
    if (n === R.n) return R.c;
    R.n = n;
    const mx = R.mask.getContext('2d'), id = mx.createImageData(m.w, m.h);
    for (let i = 0; i < seen.length; i++) if (seen[i]) id.data[i * 4 + 3] = 255;
    mx.putImageData(id, 0, 0);
    const x = R.c.getContext('2d');
    x.globalCompositeOperation = 'copy'; x.drawImage(E.glow, 0, 0);
    x.globalCompositeOperation = 'destination-in'; x.imageSmoothingEnabled = true; x.drawImage(R.mask, 0, 0, R.c.width, R.c.height);
    x.globalCompositeOperation = 'source-over';
    return R.c;
  },
  // over everyone: their shots (always readable) and their bursts
  rfTop(g, m) {
    const E = m.rf.E, b = this.b;
    for (const s of E.bul) {
      if (s.delay > 0) continue;
      const im = E.shots[s.key]; if (!im) continue;
      const [x, y] = this.proj(s.x, s.y);
      b.save(); if (s.ghost) b.globalAlpha = 0.6;
      b.translate(Math.round(x), Math.round(y) - 6); b.rotate(s.a + this.th);
      b.drawImage(im, -im.width, -im.height, im.width * K, im.height * K); b.restore();
    }
    for (const f of E.fx) {
      const q = f.age / (f.life || 0.6), [x, y] = this.proj(f.x, f.y);
      if (f.k === 'boom') { b.strokeStyle = f.c || '#fff'; b.globalAlpha = 1 - q; b.beginPath(); b.arc(x, y, (f.r || 1) * TS * (0.4 + q), 0, TAU); b.stroke(); b.globalAlpha = 1; }
      else if (f.k === 'spark') { b.fillStyle = f.c; b.globalAlpha = 1 - q; b.fillRect(Math.round(x) - 2, Math.round(y) - 8, 4, 4); b.globalAlpha = 1; }
      else if (f.k === 'dust') { b.fillStyle = `rgba(200,190,170,${0.7 * (1 - q)})`; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.fillRect(Math.round(x + Math.cos(a) * q * 18), Math.round(y + Math.sin(a) * q * 12), 2, 2); } }
      else if (f.k === 'beam') { const [x2, y2] = this.proj(f.x2, f.y2); b.strokeStyle = f.c; b.globalAlpha = 1 - q; b.beginPath(); b.moveTo(x, y - 12); b.lineTo(x2, y2 - 12); b.stroke(); b.globalAlpha = 1; }
      else if (f.k === 'text') { b.fillStyle = f.c || '#fff'; b.globalAlpha = 1 - q; b.font = '8px monospace'; b.fillText(f.t, Math.round(x) - 10, Math.round(y - 16 - q * 10)); b.globalAlpha = 1; }
    }
  },
};
export function installRFRender(Renderer) { Object.assign(Renderer.prototype, methods); }
