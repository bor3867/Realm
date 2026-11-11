// RotMG-style sprite outlines: the art carries no outline of its own; every frame is drawn with a thin
// black rim and cached. U is the upscale the frame is baked at (the screen's pixels per art-buffer pixel),
// so the rim can be a crisp 1-2 screen pixels instead of a whole chunky art pixel.
// The returned canvas is the frame at U x, padded by `pad` on each side (canvas.pad).
import { stripEdge } from './outline_strip.js';
const cache = new WeakMap();
// the frame at its own pixels with its drawn black edge taken off (src/outline_strip.js), so the rim below is the only one
function bare(img, sx, sy, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d'); x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  try { const D = x.getImageData(0, 0, w, h); if (stripEdge(D.data, w, h)) x.putImageData(D, 0, 0); } catch { /* (a picture from elsewhere: as it is) */ }
  return cv;
}

// rim: the outline's width in screen pixels; the same for every monster, however fine its own pixels (left out: the
// old rule, 2 only when baked at 4x or more, gave fine-pixel monsters a rim half as thick as their neighbours')
export function outlinedFrame(img, sx, sy, w, h, U = 1, col = '#05040a', rim = 0, corners = true) {
  let per = cache.get(img);
  if (!per) { per = new Map(); cache.set(img, per); }
  const key = `${sx}|${sy}|${w}|${h}|${U}|${col}|${rim}|${corners}`;
  let cv = per.get(key);
  if (cv) return cv;
  const o = rim || (U >= 4 ? 2 : 1), W = w * U, H = h * U;
  cv = document.createElement('canvas'); cv.width = W + 2 * o; cv.height = H + 2 * o; cv.pad = o;
  const x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  const art = document.createElement('canvas'); art.width = W; art.height = H;
  const a = art.getContext('2d');
  a.imageSmoothingEnabled = false;
  // (2026-11-11, the user: "ensure all borders are thin black": every sprite's drawn edge off, the one thin black rim on;
  // the soft rim in the sprite's own darkened colours (the castle's, 2026-11-02) is black now too)
  if (col === 'self') col = '#05040a';
  // (the stripped frame kept once per frame, not made again for every size and colour it is drawn at: 2026-11-11, for speed)
  const bk = `b${sx}|${sy}|${w}|${h}`;
  let bf = per.get(bk); if (!bf) { bf = bare(img, sx, sy, w, h); per.set(bk, bf); }
  a.drawImage(bf, 0, 0, W, H);
  const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
  const s = sil.getContext('2d');
  s.drawImage(art, 0, 0);
  // col 'self': the rim is the sprite's own colours a good deal darker, toward charcoal violet (the castle's monsters, bosses
  // and shots: 2026-11-02, the user: "use subtle charcoal, dark purple, or appropriate darker shades of their existing
  // colours" instead of a heavy black border); otherwise one flat colour
  if (col === 'self') { s.globalCompositeOperation = 'source-atop'; s.fillStyle = 'rgba(24,14,32,0.74)'; s.fillRect(0, 0, W, H); }
  else { s.globalCompositeOperation = 'source-in'; s.fillStyle = col; s.fillRect(0, 0, W, H); }
  for (const [dx, dy] of [[0, o], [2 * o, o], [o, 0], [o, 2 * o]]) x.drawImage(sil, dx, dy);
  if (corners) {                                    // (a softer fill at the corners; a thin line has none)
    x.globalAlpha = 0.6;
    for (const [dx, dy] of [[0, 0], [2 * o, 0], [0, 2 * o], [2 * o, 2 * o]]) x.drawImage(sil, dx, dy);
    x.globalAlpha = 1;
  }
  x.drawImage(art, o, o);
  per.set(key, cv);
  return cv;
}

// the art's own black edge (a pixel touching the outside, near black) in a darker shade of the colour just inside it,
// a little violet; where the black is all there is (a thick border), charcoal violet. At the art's own pixels.
function softEdge(img, sx, sy, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d'); x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  let D; try { D = x.getImageData(0, 0, w, h); } catch { return cv; }
  const d = D.data, src = new Uint8ClampedArray(d), at = (X, Y) => (Y * w + X) * 4;
  const out = (X, Y) => X < 0 || Y < 0 || X >= w || Y >= h || src[at(X, Y) + 3] < 40, dark = (i) => Math.max(src[i], src[i + 1], src[i + 2]) < 40;
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    const i = at(X, Y);
    if (src[i + 3] < 40 || !dark(i) || !(out(X + 1, Y) || out(X - 1, Y) || out(X, Y + 1) || out(X, Y - 1))) continue;
    let r = 38, g = 26, b = 48, n = 0, R = 0, G = 0, B = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const U = X + dx, V = Y + dy; if (out(U, V)) continue; const j = at(U, V); if (dark(j)) continue;
      R += src[j]; G += src[j + 1]; B += src[j + 2]; n++;
    }
    if (n) { r = (R / n) * 0.42 + 10; g = (G / n) * 0.42 + 6; b = (B / n) * 0.42 + 16; }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  x.putImageData(D, 0, 0);
  return cv;
}
