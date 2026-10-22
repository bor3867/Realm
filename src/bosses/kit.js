// Small helpers the boss files share (src/bosses/*.js): where the fight is, who is in it, and a few common shapes.
export const TAU = Math.PI * 2, R = Math.random;
export const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
// the fight's box: the boss room in a dungeon, else a box round where it rose (a realm boss)
export const arena = (e, w = 24, h = 18) => e.bx.arena || { x: (e.rfHx ?? (e.rfHx = e.x)) - w / 2, y: (e.rfHy ?? (e.rfHy = e.y)) - h / 2, w, h };
// the players it fights: the server's (everyone in the room), or you
export const players = (g) => (g.netTargets && g.netTargets.length ? g.netTargets : [g.player]).filter((q) => q && !q.dead);
export const target = (g, e) => { const L = players(g); return L.length ? L.reduce((a, b) => (Math.hypot(b.x - e.x, b.y - e.y) < Math.hypot(a.x - e.x, a.y - e.y) ? b : a)) : g.player; };
export const open = (m, x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solid[ty * m.w + tx]; };
// a ring of shots from (x, y), turned by off, with an optional gap of `gap` shots at angle ga
export function ring(g, e, x, y, n, V, off = 0, ga = null, gap = 0) {
  for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU; if (ga !== null && Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))) < (gap * TAU) / n / 2) continue; g.bxShot(e, x, y, a, V); }
}
// a fan of shots at a point
export function fan(g, e, x, y, aim, n, spread, V) { for (let k = 0; k < n; k++) g.bxShot(e, x, y, aim + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0), V); }
// a marked circle on the floor that bursts
export function mark(g, e, x, y, r, delay, dmg, colors, shards = 0, proj) {
  g.fx.push({ kind: 'zone', x, y, r, t: 0, delay, life: delay + 0.15, dmg: g.bxDmg(e, dmg), by: e.D.name, done: false, colors, shards, proj });
}
// a helper creature: no loot, no Life bar unless asked
export const kill = (m) => { if (m && !m.dead) { m.noLoot = true; m.dead = true; m.deadT = 0; } };
// draw a filled circle on the floor (world units)
export function disc(r, x, y, rad, col, alpha, stroke) {
  const b = r.b; b.globalAlpha = alpha; b.beginPath();
  for (let k = 0; k <= 32; k++) { const a = (k / 32) * TAU, [px, py] = r.proj(x + Math.cos(a) * rad, y + Math.sin(a) * rad); if (k) b.lineTo(px, py); else b.moveTo(px, py); }
  if (stroke) { b.strokeStyle = col; b.lineWidth = stroke; b.stroke(); } else { b.fillStyle = col; b.fill(); }
  b.globalAlpha = 1;
}
