// RotMG-style sprite outlines: the art carries no outline of its own; every frame is drawn with a thin
// black rim and cached. U is the upscale the frame is baked at (the screen's pixels per art-buffer pixel),
// so the rim can be a crisp 1-2 screen pixels instead of a whole chunky art pixel.
// The returned canvas is the frame at U x, padded by `pad` on each side (canvas.pad).
const cache = new WeakMap();

export function outlinedFrame(img, sx, sy, w, h, U = 1, col = '#05040a') {
  let per = cache.get(img);
  if (!per) { per = new Map(); cache.set(img, per); }
  const key = `${sx}|${sy}|${w}|${h}|${U}|${col}`;
  let cv = per.get(key);
  if (cv) return cv;
  const o = U >= 4 ? 2 : 1, W = w * U, H = h * U;
  cv = document.createElement('canvas'); cv.width = W + 2 * o; cv.height = H + 2 * o; cv.pad = o;
  const x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  const art = document.createElement('canvas'); art.width = W; art.height = H;
  const a = art.getContext('2d');
  a.imageSmoothingEnabled = false;
  a.drawImage(img, sx, sy, w, h, 0, 0, W, H);
  const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
  const s = sil.getContext('2d');
  s.drawImage(art, 0, 0);
  s.globalCompositeOperation = 'source-in'; s.fillStyle = col; s.fillRect(0, 0, W, H);
  for (const [dx, dy] of [[0, o], [2 * o, o], [o, 0], [o, 2 * o]]) x.drawImage(sil, dx, dy);
  x.globalAlpha = 0.6;
  for (const [dx, dy] of [[0, 0], [2 * o, 0], [0, 2 * o], [2 * o, 2 * o]]) x.drawImage(sil, dx, dy);
  x.globalAlpha = 1;
  x.drawImage(art, o, o);
  per.set(key, cv);
  return cv;
}
