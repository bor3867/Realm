// The game's cursor over the play field (2026-10-28: "crosshairs players can see better, RotMG style"). RotMG gives a
// choice of bold pixel cursors; so does this: each shape is drawn on a 32x32 grid of pixels, in its colour, with a
// one-pixel black outline round every lit pixel so it reads on any ground (snow, lava, the dark of the void). Made once
// per choice as a PNG and handed to the browser as the canvas's cursor, its hotspot the middle.
//   applyCursor(el, settings)   cursorPreview(style, color)
export const CURSOR_STYLES = [['cross', 'Cross'], ['ring', 'Ring'], ['dot', 'Dot'], ['brackets', 'Brackets'], ['system', 'System (thin)']];
export const CURSOR_COLORS = [['#ffffff', 'White'], ['#ffe04a', 'Yellow'], ['#5ef6ff', 'Cyan'], ['#6aff6a', 'Green'], ['#ff5050', 'Red'], ['#ff7ad9', 'Pink']];
export const CURSOR_SIZES = [[32, 'Normal'], [48, 'Large']];
const N = 32, C = 16;                                    // the grid, and its middle (the hotspot sits between 15 and 16)

// which pixels a shape lights (x, y on the 32 grid)
function shape(style) {
  const on = new Uint8Array(N * N), rect = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) on[j * N + i] = 1; };
  const disc = (r0, r1) => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const d = Math.hypot(i + 0.5 - C, j + 0.5 - C); if (d >= r0 && d < r1) on[j * N + i] = 1; } };
  if (style === 'cross') {                               // four thick arms with a gap, a dot in the middle
    rect(3, 15, 8, 2); rect(21, 15, 8, 2); rect(15, 3, 2, 8); rect(15, 21, 2, 8); rect(15, 15, 2, 2);
  } else if (style === 'ring') {                         // a ring with four ticks pointing in, a dot in the middle
    disc(8, 10); rect(15, 4, 2, 4); rect(15, 24, 2, 4); rect(4, 15, 4, 2); rect(24, 15, 4, 2); rect(15, 15, 2, 2);
  } else if (style === 'dot') {                          // a bold dot
    disc(0, 4.2);
  } else if (style === 'brackets') {                     // four corners round the aim, a dot in the middle
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x0 = sx < 0 ? 6 : 20, y0 = sy < 0 ? 6 : 20;
      rect(x0, sy < 0 ? y0 : y0 + 4, 6, 2); rect(sx < 0 ? x0 : x0 + 4, y0, 2, 6);
    }
    rect(15, 15, 2, 2);
  }
  return on;
}
const cache = new Map();
// the cursor as a PNG data URL: lit pixels in its colour, a black pixel round each, the rest clear
function draw(style, color, size) {
  const key = `${style}|${color}|${size}`;
  if (cache.has(key)) return cache.get(key);
  const on = shape(style), c = document.createElement('canvas');
  c.width = N; c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), n = parseInt(color.slice(1), 16), rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = (j * N + i) * 4;
    if (on[j * N + i]) { img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 255; continue; }
    let edge = false;
    for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const a = i + dx, b = j + dy; if (a >= 0 && b >= 0 && a < N && b < N && on[b * N + a]) { edge = true; break; } }
    if (edge) img.data[k + 3] = 255;                     // (black: the outline)
  }
  x.putImageData(img, 0, 0);
  let out = c;
  if (size !== N) {                                      // larger: the same pixels, scaled up crisply
    out = document.createElement('canvas'); out.width = size; out.height = size;
    const y = out.getContext('2d'); y.imageSmoothingEnabled = false; y.drawImage(c, 0, 0, size, size);
  }
  const url = out.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
// the cursor over the play field, as the settings have it
export function applyCursor(el, s) {
  if (!el || typeof document === 'undefined') return;
  const style = s.cursor || 'cross', color = s.cursorColor || '#ffffff', size = s.cursorSize || 32;
  if (style === 'system') { el.style.cursor = 'crosshair'; return; }
  const h = Math.floor(size / 2);
  el.style.cursor = `url(${draw(style, color, size)}) ${h} ${h}, crosshair`;
}
// a picture of one, for the settings
export const cursorPreview = (style, color) => (style === 'system' ? '' : draw(style, color, 32));
