// A tiny pixel font for numbers drawn in the world (damage, healing): 3x5 glyphs, every digit its own shape (a 5's side
// is open where an 8's is closed), drawn P screen pixels to a font pixel with a black rim, and cached per text, colour
// and size. Words (DODGE, BLOCKED) stay in the text font.
const G = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '110'],
  6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'], '-': ['000', '000', '111', '000', '000'], '+': ['000', '010', '111', '010', '000'],
  '!': ['010', '010', '010', '000', '010'], '%': ['101', '001', '010', '100', '101'] };
export const pixelable = (t) => /^[-+]?\d+[!%]?$/.test(t);
const cache = new Map();
export function pixelText(text, color, P) {
  const key = `${text}|${color}|${P}`;
  let cv = cache.get(key);
  if (cv) return cv;
  const gl = [...text].map((c) => G[c] || G[0]), w = gl.length * 4 - 1, h = 5;
  cv = document.createElement('canvas'); cv.width = (w + 2) * P; cv.height = (h + 2) * P;
  const x = cv.getContext('2d');
  const each = (fn) => gl.forEach((g, i) => g.forEach((row, y) => [...row].forEach((b, xx) => { if (b === '1') fn(1 + i * 4 + xx, 1 + y); })));
  x.fillStyle = '#000';
  each((gx, gy) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) x.fillRect((gx + dx) * P, (gy + dy) * P, P, P); });
  x.fillStyle = color; each((gx, gy) => x.fillRect(gx * P, gy * P, P, P));
  if (cache.size > 600) cache.delete(cache.keys().next().value);
  cache.set(key, cv);
  return cv;
}
