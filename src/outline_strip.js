// A sprite's own drawn black edge, taken off (2026-11-11, the user: "Thinner borders on the heralds and other champions ...
// ensure all borders are thin black"). Many sheets carry a black outline in their pixels; drawn bigger (a herald at 1.8x)
// that edge grows with them, and with the game's rim on top it doubles. So every sprite loses its drawn edge here and gets
// the game's one rim instead (src/outline.js): thin, black, the same width on everything, at any size.
// d: RGBA bytes of a frame w x h (changed in place). An edge is taken off only where the sprite really has one: a layer is
// peeled only when half of it or more is near-black, at most three layers deep (a thick border); a dark creature or a black
// boot at the edge of an unoutlined sprite stays.
export const DARK = 48;
export function stripEdge(d, w, h) {
  const at = (x, y) => (y * w + x) * 4;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[at(x, y) + 3] >= 40;
  const dark = (i) => Math.max(d[i], d[i + 1], d[i + 2]) < DARK;
  let peeled = 0;
  for (let layer = 0; layer < 3; layer++) {
    const edge = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid(x, y) && (!solid(x + 1, y) || !solid(x - 1, y) || !solid(x, y + 1) || !solid(x, y - 1))) edge.push([x, y]);
    if (!edge.length) break;
    const dk = edge.filter(([x, y]) => dark(at(x, y)));
    if (dk.length / edge.length < 0.5) break;
    for (const [x, y] of dk) d[at(x, y) + 3] = 0;
    peeled++;
  }
  return peeled;                                          // (how many layers of drawn edge it had)
}
