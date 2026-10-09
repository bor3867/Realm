// Dev-only sprite browser: index.html?sprites
// Every sprite in the registry, animating, grouped by sheet. Drawn through the game's own outline code, with the
// base cell (cyan) and the foot point (red) marked, so bad pivots, facing or double outlines are easy to spot.
import { loadRegistry, hoverY } from './registry.js';
import { Anim } from './anim.js';
import { outlinedFrame } from './outline.js';

export async function run() {
  document.title = 'Realm: sprite browser';
  document.body.innerHTML = `<style>
    body{margin:0;background:#15121c;color:#e8e2f2;font:13px system-ui,sans-serif}
    header{position:sticky;top:0;z-index:2;background:#1d1928ee;padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #2e2840}
    header b{font-size:16px;color:#ffd650} input,select,button{background:#262033;color:#e8e2f2;border:1px solid #3a3350;border-radius:4px;padding:4px 8px;font:inherit}
    h2{margin:22px 16px 6px;font-size:14px;color:#ffd650;letter-spacing:.04em} h2 small{color:#8a8496;font-weight:normal}
    .grid{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px}
    .card{background:#1d1928;border:1px solid #2a2438;border-radius:6px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:96px}
    .card canvas{image-rendering:pixelated} .card .n{font-size:11px;color:#c8c0d8;max-width:160px;text-align:center;word-break:break-all}
    .card .clips{display:flex;flex-wrap:wrap;gap:2px;justify-content:center} .card .clips button{padding:1px 4px;font-size:10px}
    .card .clips button.on{background:#ffd650;color:#1a1420} .card .k{font-size:10px;color:#7a7488}</style>
    <header><b>Sprite browser</b><span id="sum"></span>
      <input id="q" placeholder="filter (sheet, name, kind)" size="28">
      <label>zoom <select id="z"><option>2</option><option selected>3</option><option>4</option><option>6</option></select></label>
      <label><input type="checkbox" id="mk" checked> markers</label><label><input type="checkbox" id="hv" checked> hover</label>
      <select id="bg"><option value="check">checker</option><option value="dark">dark</option><option value="grass">grass</option><option value="sand">sand</option></select>
    </header><main id="out"><p style="padding:16px">loading…</p></main>`;
  const R = await loadRegistry();
  const $ = (id) => document.getElementById(id), out = $('out');
  $('sum').textContent = `${R.defs.size} sprites · ${Object.entries(R.counts).map(([p, n]) => `${p} ${n}`).join(' · ')} · ${R.redirect.size} redirects`;
  const cards = [];
  const build = () => {
    const q = $('q').value.trim().toLowerCase(), Z = +$('z').value;
    out.innerHTML = ''; cards.length = 0;
    const bySheet = {};
    for (const d of R.defs.values()) if (!q || `${d.key} ${d.kind}`.toLowerCase().includes(q)) (bySheet[d.sheet] = bySheet[d.sheet] || []).push(d);
    for (const [sheet, list] of Object.entries(bySheet)) {
      const h = document.createElement('h2'); h.innerHTML = `${sheet} <small>${list.length} · ${list[0].pack} · ${list[0].kind}</small>`; out.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'grid'; out.appendChild(grid);
      for (const d of list) {
        const fw = Math.max(...Object.values(d.frames).map((f) => f.w)), fh = Math.max(...Object.values(d.frames).map((f) => f.h));
        const card = document.createElement('div'); card.className = 'card';
        const cv = document.createElement('canvas'); cv.width = (fw + 4) * Z; cv.height = (fh + 6) * Z;
        const clips = Object.keys(d.anims);
        card.innerHTML = `<div class="n">${d.name}</div><div class="k">${fw}×${fh}${d.hover ? ' · ' + d.hover : ''}${d.outline ? '' : ' · no outline'}</div>`;
        card.insertBefore(cv, card.firstChild);
        const cl = document.createElement('div'); cl.className = 'clips';
        const anim = new Anim(d, clips[0]);
        anim.on('ended', () => { setTimeout(() => anim.play(anim.clip), 500); });     // replay one-shots so they can be watched
        for (const c of clips) {
          const bt = document.createElement('button'); bt.textContent = c; if (c === clips[0]) bt.className = 'on';
          bt.onclick = () => { anim.play(c); cl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === bt)); };
          cl.appendChild(bt);
        }
        card.appendChild(cl); grid.appendChild(card);
        cards.push({ d, cv, anim, Z, fw, fh, phase: Math.random() * 6.28, visible: false });
      }
    }
    const io = new IntersectionObserver((es) => { for (const e of es) { const c = cards.find((k) => k.cv === e.target); if (c) c.visible = e.isIntersecting; } });
    for (const c of cards) io.observe(c.cv);
  };
  const BG = { dark: '#1d1928', grass: '#4a7a30', sand: '#e0c898' };
  const paint = (c, t) => {
    const { d, cv, anim, Z, fw, fh } = c, x = cv.getContext('2d'), bg = $('bg').value;
    x.imageSmoothingEnabled = false;
    if (bg === 'check') { for (let yy = 0; yy < cv.height; yy += 4 * Z) for (let xx = 0; xx < cv.width; xx += 4 * Z) { x.fillStyle = ((xx + yy) / (4 * Z)) % 2 ? '#2a2438' : '#231e30'; x.fillRect(xx, yy, 4 * Z, 4 * Z); } }
    else { x.fillStyle = BG[bg]; x.fillRect(0, 0, cv.width, cv.height); }
    const f = d.frames[anim.frame]; if (!f) return;
    // stand the sprite on a common baseline: its foot at the bottom centre of the card
    const footX = cv.width / 2, footY = (fh + 3) * Z;
    const hy = $('hv').checked ? hoverY(R, d, t, c.phase, 1) / 2 * Z : 0;
    const ox = Math.round(footX - d.foot[0] * Z), oy = Math.round(footY - d.foot[1] * Z + hy);
    if (d.outline) { const I = outlinedFrame(d.img, f.x, f.y, f.w, f.h, Z), p = I.pad; x.drawImage(I, ox - p, oy - p); }
    else x.drawImage(d.img, f.x, f.y, f.w, f.h, ox, oy, f.w * Z, f.h * Z);
    if ($('mk').checked) {
      x.strokeStyle = 'rgba(80,240,255,0.8)'; x.lineWidth = 1;
      if (d.kind !== 'boss' && d.kind !== 'shot') x.strokeRect(ox + d.pivot[0] * Z + 0.5, oy + d.pivot[1] * Z + 0.5, 8 * Z - 1, 8 * Z - 1);
      x.fillStyle = '#ff3a5a'; x.fillRect(Math.round(footX) - 1, Math.round(footY) - 1, 3, 3);
    }
  };
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000), t = now / 1000; last = now;
    for (const c of cards) { c.anim.update(dt); if (c.visible) paint(c, t); }
    requestAnimationFrame(tick);
  };
  ['q', 'z'].forEach((id) => { $(id).oninput = build; });
  build(); requestAnimationFrame(tick);
  // dev capture: paint every card of the matching sheets now and post a contact sheet to the dev server
  window.__capture = async (filter = '', name = 'sprites', cols = 10) => {
    const list = cards.filter((c) => !filter || c.d.key.includes(filter));
    for (const c of list) paint(c, performance.now() / 1000);
    const cw = Math.max(...list.map((c) => c.cv.width)) + 6, ch = Math.max(...list.map((c) => c.cv.height)) + 16;
    const S = document.createElement('canvas'); S.width = cw * Math.min(cols, list.length); S.height = ch * Math.ceil(list.length / cols);
    const x = S.getContext('2d'); x.fillStyle = '#15121c'; x.fillRect(0, 0, S.width, S.height); x.font = '10px sans-serif'; x.fillStyle = '#c8c0d8';
    list.forEach((c, i) => { const X = (i % cols) * cw, Y = Math.floor(i / cols) * ch; x.drawImage(c.cv, X + 3, Y + 3); x.fillText(c.d.name.slice(0, 22), X + 3, Y + ch - 3); });
    const blob = await new Promise((ok) => S.toBlob(ok));
    await fetch('/__dev/shot/' + name, { method: 'POST', body: blob });
    return [list.length, S.width, S.height];
  };
}
