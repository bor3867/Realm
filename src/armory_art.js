// The Mad God Armory's art, drawn exactly as the armory draws it (src/data/armory_data.js): each 8x8 frame baked with a
// black outline, its pulsing pixels brightening and dimming, a pixel-stepped glow hugging the silhouette in the item's
// colour, and now and then a light sweeping across. The baking is the armory's own code, kept as it was.
const hexA = (h) => (h.length === 9 ? [h.slice(0, 7), parseInt(h.slice(7), 16) / 255] : [h, 1]);
function lighten(h, k) {
  const n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * k); g = Math.round(g + (255 - g) * k); b = Math.round(b + (255 - b) * k);
  return `rgb(${r},${g},${b})`;
}
const mk = (s) => { const c = document.createElement('canvas'); c.width = c.height = s; return c; };
// one frame at a whole-number scale, outlined; lvl brightens the pulsing pixels (0-4)
export function bake(def, scale, fi = 0, lvl = 0) {
  const c0 = def._c || (def._c = new Map()), key = scale + '|' + fi + '|' + lvl;
  if (c0.has(key)) return c0.get(key);
  const grid = def.f[fi % def.f.length], o = Math.max(1, Math.round(scale / 5)), s = 8 * scale + o * 2;
  const col = mk(s), sil = mk(s), out = mk(s), a = col.getContext('2d'), b = sil.getContext('2d'), z = out.getContext('2d');
  grid.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    const [h, al] = hexA(def.p[ch]);
    a.globalAlpha = al; a.fillStyle = lvl && def.pulse && def.pulse.includes(ch) ? lighten(h, lvl * 0.11) : h; a.fillRect(o + x * scale, o + y * scale, scale, scale);
    if (al >= 0.78) { b.fillStyle = '#000'; b.fillRect(o + x * scale, o + y * scale, scale, scale); }
  }));
  for (let dx = -o; dx <= o; dx += o) for (let dy = -o; dy <= o; dy += o) z.drawImage(sil, dx, dy);
  z.drawImage(col, 0, 0); out._col = col; c0.set(key, out);
  return out;
}
// which frame, and how bright the pulse, at time t (ms)
export function frameOf(def, t) {
  const n = def.f.length, fi = n > 1 ? Math.floor((t * (def.fps || 6)) / 1000) % n : 0, lvl = def.pulse ? Math.round((Math.sin(t / 320) + 1) * 2) : 0;
  return [fi, lvl];
}
export const sprAt = (def, scale, t) => { const [fi, l] = frameOf(def, t); return bake(def, scale, fi, l); };
// the glow: a pixel-stepped halo hugging the silhouette, in the item's colour
export function glowLayer(def, scale, fi, color) {
  const c0 = def._g || (def._g = new Map()), key = scale + '|' + fi + '|' + color;
  if (c0.has(key)) return c0.get(key);
  const grid = def.f[fi % def.f.length], o = Math.max(1, Math.round(scale / 5)), pad = 2 * scale, s = 8 * scale + o * 2 + pad * 2;
  const on = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8 && grid[y][x] !== '.';
  const sm = mk(12), q = sm.getContext('2d'); q.fillStyle = color;
  for (let y = -2; y < 10; y++) for (let x = -2; x < 10; x++) {
    let d = 9;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (on(x + dx, y + dy)) d = Math.min(d, Math.hypot(dx, dy));
    if (d > 2.3) continue;
    q.globalAlpha = d === 0 ? 0.9 : d < 1.5 ? 0.55 : 0.18; q.fillRect(x + 2, y + 2, 1, 1);
  }
  const cv = mk(s), g = cv.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const off = pad + o - 2 * scale; g.drawImage(sm, off, off, 12 * scale, 12 * scale);
  c0.set(key, cv);
  return cv;
}
// the sprite with its glow, centred on (x, y), turned by rot, at alpha; strength scales the glow's pulse
export function glowDraw(c, def, scale, t, color, x, y, rot = 0, alpha = 1, k = 1, strength = 1) {
  const [fi] = frameOf(def, t), gl = glowLayer(def, scale, fi, color), img = sprAt(def, scale, t);
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (k !== 1) c.scale(k, k);
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * Math.min(1, strength * (0.6 + 0.4 * Math.sin(t / 380))); c.drawImage(gl, -gl.width / 2, -gl.height / 2); c.globalCompositeOperation = 'source-over';
  c.globalAlpha = alpha; c.drawImage(img, -img.width / 2, -img.height / 2); c.restore();
  return img;
}
// an inventory icon on its own canvas (px square): idle frames, pulsing pixels, the glow (stronger when hovered or for
// the Divine set's glowBoost), and a light sweep every 3.4s, as the armory's inventory draws it
export function drawIcon(cv, it, now, hot = false, seed = 0, fill = 0.62) {
  const c = cv.getContext('2d'), px = cv.width, def = it.item, scale = Math.max(1, Math.floor((px * fill) / 8)), boost = it.glowBoost || 1, t = now + seed;
  c.clearRect(0, 0, px, px); c.imageSmoothingEnabled = false;
  const img = glowDraw(c, def, scale, t, it.glow, px / 2, px / 2, 0, 1, 1, (hot ? 1.6 : 1) * boost);
  if (boost > 1) {
    const [bf] = frameOf(def, t), gl = glowLayer(def, scale, bf, it.glow);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.25 * Math.sin(t / 300); c.drawImage(gl, Math.round(px / 2 - gl.width / 2), Math.round(px / 2 - gl.height / 2));
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(img, Math.round(px / 2 - img.width / 2), Math.round(px / 2 - img.height / 2));
  }
  const ph = (t % 3400) / 650;
  if (ph >= 1) return;
  const col = img._col, w = col.width, tc = cv._tmp || (cv._tmp = mk(w));
  if (tc.width !== w) tc.width = tc.height = w;
  const z = tc.getContext('2d'); z.globalCompositeOperation = 'source-over'; z.clearRect(0, 0, w, w); z.drawImage(col, 0, 0);
  z.globalCompositeOperation = 'source-atop'; z.fillStyle = 'rgba(255,255,255,.6)';
  const band = scale * 2, pos = -w + ph * w * 3; z.save(); z.translate(pos, 0); z.rotate(Math.PI / 4); z.fillRect(0, -w * 2, band, w * 4); z.restore();
  c.drawImage(tc, Math.round(px / 2 - w / 2), Math.round(px / 2 - w / 2));
}
// a still image of an item or a shot (its first frame, no glow), for places that take a picture
export function stillURL(def, size = 48) {
  const cv = mk(size), c = cv.getContext('2d'), img = bake(def, Math.max(1, Math.floor((size * 0.62) / 8)), 0, 0);
  c.imageSmoothingEnabled = false; c.drawImage(img, Math.round(size / 2 - img.width / 2), Math.round(size / 2 - img.height / 2));
  return cv.toDataURL();
}
