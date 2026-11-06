// Sunthief's Castle: THE FIXED MASTER FOOTPRINT (2026-11-05, the user: "REBUILD SUNTHIEF'S CASTLE TO MATCH THE REFERENCE
// ... The castle must be a deliberately authored, fixed map ... First create a fixed master tilemap"). Stage A: the
// architecture only (the curtain wall, the moat inside it, every room, hall, tower and walkway, the secret chambers), traced
// from the user's revised master layout. Every shape is in that sheet's own pixels (the full 1448 x 1086 image), and one scale
// turns the whole sheet into tiles, so every room keeps its place and its size against the rest. Nothing here is random.
//   buildMaster() -> { w, h, tiles (Uint8Array of K.*), parts (each shape's tile box), at (sheet px -> tile) }

export const SCALE = 0.4;                 // tiles to a pixel of the sheet (the spine's 36 px hall -> 14 tiles; the courtyard 77 x 73)
export const ORIGIN = [215, 66];          // the sheet's pixel at tile (0, 0)
export const K = { VOID: 0, WATER: 1, WALL: 2, FLOOR: 3, CARPET: 4, LAVA: 5, STAIR: 6, SECRET: 7, PLUG: 8, TOWER: 9 };

// the castle's curtain wall, round the whole: the sheet's outer battlements (water inside it, nothing outside)
export const CURTAIN = [[220, 440], [224, 330], [232, 250], [240, 205], [285, 198], [330, 190], [372, 176], [420, 150], [438, 106],
  [492, 100], [560, 98], [600, 92], [660, 60], [760, 60], [830, 96], [900, 112], [930, 100], [985, 100], [1040, 150], [1066, 200],
  [1110, 210], [1130, 250], [1140, 330], [1138, 470], [1136, 560], [1130, 622], [1108, 648], [1060, 668], [1000, 684], [800, 684],
  [740, 686], [680, 684], [560, 680], [450, 670], [330, 664], [258, 656], [232, 610], [220, 520]];

// shapes: r = rectangle [x0, y0, x1, y1]; o = octagon (the same box, corners cut by c); e = ellipse in the box
// kind: main (the required route), opt (a side room), tower, secret; role names what the room is (for stage C)
const r = (x0, y0, x1, y1, o = {}) => ({ s: 'r', b: [x0, y0, x1, y1], ...o });
const oc = (x0, y0, x1, y1, c, o = {}) => ({ s: 'o', b: [x0, y0, x1, y1], c, ...o });
const el = (x0, y0, x1, y1, o = {}) => ({ s: 'e', b: [x0, y0, x1, y1], ...o });
const tw = (x, y, rr = 17) => el(x - rr, y - rr, x + rr, y + rr);

export const ROOMS = [
  // ---- the required route, west to east, then north
  { id: 'entrance', name: 'THE WEST ENTRANCE', kind: 'main', parts: [r(230, 440, 324, 490), r(244, 426, 300, 440), r(244, 490, 300, 504)] },
  { id: 'drawbridge', name: 'THE DRAWBRIDGE GUARD', kind: 'main', boss: 'drawbridge_technician', parts: [oc(322, 392, 468, 524, 30), r(383, 378, 425, 394), r(370, 522, 432, 534)] },
  { id: 'spineW', name: 'THE GREAT HALL (WEST)', kind: 'main', parts: [r(466, 445, 619, 489), r(500, 416, 528, 446), r(566, 416, 594, 446), r(500, 488, 528, 510), r(566, 488, 594, 510)] },
  { id: 'courtyard', name: 'THE CENTRAL COURTYARD', kind: 'main', parts: [oc(617, 392, 810, 576, 46), r(690, 574, 738, 628)], fit: [617, 392, 810, 540] },   // (its page set out about the great cross: the statue on the route, as the sheet has it)
  { id: 'spineE', name: 'THE GREAT HALL (EAST)', kind: 'main', parts: [r(808, 448, 1006, 488), r(828, 414, 930, 449), r(840, 487, 900, 506), r(906, 487, 932, 506)] },
  { id: 'jarls', name: "THE HOLLOW JARLS' COURT", kind: 'main', boss: 'jarls', parts: [oc(1002, 384, 1126, 544, 38)] },
  { id: 'chainhall', name: 'THE CHAIN HALL', kind: 'main', lock: 'jarls', parts: [r(690, 296, 738, 394)] },
  { id: 'antechamber', name: 'THE FORGE ANTECHAMBER', kind: 'main', parts: [oc(636, 252, 790, 300, 14)] },
  { id: 'ashkar', name: 'ASHKAR, THE CHAINED FORGE-GIANT', kind: 'main', boss: 'ashkar', parts: [el(603, 118, 822, 256)], lavaRim: 14 },
  { id: 'northkeep', name: 'THE NORTH KEEP', kind: 'main', exit: true, parts: [r(680, 80, 746, 124), r(700, 72, 726, 82)] },
  // ---- the side rooms (stage C names their interiors after the user's room pages)
  { id: 'rose', name: 'THE CORRUPTED ROSE COURTYARD', kind: 'opt', parts: [el(284, 254, 404, 374)] },
  { id: 'banners', name: 'THE HALL OF HOLLOW BANNERS', kind: 'opt', parts: [r(417, 250, 488, 312)] },
  { id: 'gallery', name: 'THE ROYAL GALLERY', kind: 'opt', parts: [r(433, 182, 490, 236), r(490, 168, 556, 244)] },
  { id: 'study', name: "THE STEWARD'S STUDY", kind: 'opt', parts: [r(526, 256, 572, 304)] },
  { id: 'library', name: 'THE LIBRARY', kind: 'opt', parts: [oc(486, 304, 604, 386, 10)] },
  { id: 'overlook', name: 'THE TOWER OVERLOOK', kind: 'opt', parts: [r(886, 164, 968, 232), r(860, 180, 886, 214)] },
  { id: 'shrine', name: 'THE BANNER SHRINE', kind: 'opt', parts: [r(852, 236, 902, 288)] },
  { id: 'dining', name: 'THE DINING HALL', kind: 'opt', parts: [oc(816, 302, 940, 390, 10)] },
  { id: 'barracks', name: 'THE ASHEN BARRACKS', kind: 'opt', parts: [oc(958, 214, 1060, 306, 8)] },
  { id: 'sidechapel', name: 'THE SIDE CHAPEL', kind: 'opt', parts: [el(282, 530, 344, 596)] },
  { id: 'armory', name: 'THE ARMORY', kind: 'opt', parts: [oc(358, 562, 446, 648, 10)] },
  { id: 'ropecog', name: 'THE ROPE & COG GATEHOUSE', kind: 'opt', parts: [oc(476, 526, 594, 602, 10)] },
  { id: 'watch', name: 'THE SOUTH WATCH', kind: 'opt', parts: [r(600, 568, 650, 656)] },
  { id: 'chapel', name: 'THE CHAPEL OF HOLLOW LIGHT', kind: 'opt', parts: [oc(816, 534, 960, 630, 12)] },
  // ---- the towers on the curtain (the twin watchtowers are the pair in the north)
  { id: 'twNW', name: 'THE NORTH-WEST TOWER', kind: 'tower', parts: [tw(258, 230)] },
  { id: 'twW', name: 'THE WEST TOWER', kind: 'tower', parts: [tw(257, 418, 15)] },
  { id: 'twN1', name: 'THE TWIN WATCHTOWERS (WEST)', kind: 'tower', parts: [tw(465, 132)] },
  { id: 'twN2', name: 'THE TWIN WATCHTOWERS (EAST)', kind: 'tower', parts: [tw(953, 128)] },
  { id: 'twE1', name: 'THE EAST TOWER', kind: 'tower', parts: [tw(1086, 238)] },
  { id: 'twE2', name: 'THE SEA TOWER', kind: 'tower', parts: [tw(1102, 590)] },
  { id: 'twSE', name: 'THE SOUTH-EAST TOWER', kind: 'tower', parts: [tw(972, 646)] },
  { id: 'twS', name: 'THE SOUTH TOWER', kind: 'tower', parts: [tw(788, 622)] },
  { id: 'twSW', name: 'THE SOUTH-WEST TOWER', kind: 'tower', parts: [tw(534, 642)] },
  // ---- the secret chambers (behind a cracked wall; the dotted lines on the sheet)
  { id: 'secNW', name: 'THE HIDDEN CHAMBER', kind: 'secret', parts: [r(366, 200, 406, 240)] },
  { id: 'secSW', name: "THE SMUGGLER'S HOLD", kind: 'secret', parts: [r(258, 600, 298, 640)] },
  { id: 'secE', name: 'THE SERVANT PASSAGE', kind: 'secret', parts: [r(1074, 344, 1100, 370)] },
  { id: 'secSE', name: 'THE SECRET TREASURE CHAMBER', kind: 'secret', parts: [r(1008, 606, 1040, 638)] },
];

// the walkways and stairs between them: [points..., width px, opts]; secret ones end in a cracked wall (plug: the end at the room)
const L = (pts, w, o = {}) => ({ pts, w, ...o });
export const LINKS = [
  // off the required route
  L([[346, 440], [346, 372]], 16, { stair: true }),                    // the entrance up to the rose courtyard
  L([[314, 488], [314, 534]], 12),                                    // the entrance down to the side chapel
  L([[258, 247], [258, 300], [312, 300]], 10),                        // the north-west tower down to the rose courtyard
  L([[452, 414], [452, 312]], 12),                                    // the drawbridge's north-east up to the banner hall
  L([[470, 250], [470, 236]], 10),                                    // the banner hall up to the gallery
  L([[465, 182], [465, 149]], 10, { stair: true }),                   // the gallery up to the western watchtower
  L([[488, 280], [526, 280]], 10),                                    // the banner hall to the study
  L([[549, 304], [549, 306]], 12),                                    // the study down to the library
  L([[556, 206], [586, 206], [586, 330], [604, 330]], 10),            // the gallery along the forge's west wall to the library
  L([[546, 386], [546, 446]], 12, { stair: true }),                   // the library down to the great hall
  L([[401, 534], [401, 562]], 12, { stair: true }),                   // the drawbridge down to the armory
  L([[446, 584], [476, 584]], 10),                                    // the armory to the gatehouse
  L([[314, 596], [314, 616], [330, 616]], 10),                        // the side chapel's south walk (to the smuggler's cracked wall; no way on to the armory, which is past the drawbridge)
  L([[546, 488], [546, 526]], 12, { stair: true }),                   // the great hall down to the gatehouse
  L([[534, 602], [534, 625]], 10),                                    // the gatehouse to the south-west tower
  L([[650, 612], [690, 612]], 10),                                    // the south watch to the courtyard's south stair
  L([[738, 612], [771, 612]], 10),                                    // the stair to the south tower
  L([[874, 390], [874, 414]], 12, { stair: true }),                   // the east hall up to the dining hall
  L([[877, 288], [877, 302]], 10),                                    // the dining hall up to the shrine
  L([[852, 262], [836, 262], [836, 196], [860, 196]], 10),            // the shrine along the forge's east wall to the overlook
  L([[953, 145], [953, 164]], 10, { stair: true }),                   // the overlook up to the eastern watchtower
  L([[920, 232], [920, 302]], 10),                                    // the overlook down past the dining hall
  L([[968, 222], [958, 222]], 10),                                    // the overlook to the barracks
  L([[1016, 306], [1016, 330], [1086, 330], [1086, 255]], 10),        // the barracks to the east tower
  L([[982, 306], [982, 448]], 10),                                    // the barracks down to the east hall
  L([[870, 506], [870, 532]], 12, { stair: true }),                   // the east hall down to the chapel
  L([[919, 506], [919, 532]], 12),
  L([[960, 600], [972, 600], [972, 629]], 10),                        // the chapel to the south-east tower
  L([[1052, 544], [1052, 590], [1102, 590]], 10),                     // the jarls' court south to the sea tower
  // the secret passages (each a narrow tunnel, its cracked wall where it meets the room it opens from)
  L([[396, 240], [396, 274], [417, 274]], 6, { secret: 'secNW' }),
  L([[298, 620], [314, 620]], 6, { secret: 'secSW' }),
  L([[1086, 333], [1086, 344]], 6, { secret: 'secE', plugAt: 0 }),
  L([[1052, 590], [1024, 590], [1024, 606]], 6, { secret: 'secSE', plugAt: 0 }),
];

// carpets (the main route's runner): [x0, y0, x1, y1] in sheet px
export const CARPETS = [[232, 452, 1004, 481], [700, 252, 728, 476], [690, 92, 736, 124]];

const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const inShape = (p, x, y) => {
  const [x0, y0, x1, y1] = p.b; if (x < x0 || y < y0 || x > x1 || y > y1) return false;
  if (p.s === 'r') return true;
  if (p.s === 'e') { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2; return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; }
  const c = p.c, dx = Math.min(x - x0, x1 - x), dy = Math.min(y - y0, y1 - y); return dx + dy >= c;
};

export function buildMaster() {
  const S = SCALE, [OX, OY] = ORIGIN;
  const toT = (px, py) => [Math.round((px - OX) * S), Math.round((py - OY) * S)], toP = (tx, ty) => [tx / S + OX, ty / S + OY];
  let mx = 0, my = 0; for (const [x, y] of CURTAIN) { mx = Math.max(mx, x); my = Math.max(my, y); }
  const w = Math.ceil((mx - OX) * S) + 4, h = Math.ceil((my - OY) * S) + 4, T = new Uint8Array(w * h), owner = new Int16Array(w * h).fill(-1);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x);
  // the curtain's inside: water for now
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [px, py] = toP(x + 0.5, y + 0.5); if (inPoly(CURTAIN, px, py)) T[y * w + x] = K.WATER; }
  // the rooms
  ROOMS.forEach((R, k) => {
    for (const p of R.parts) {
      const [a, b] = toT(p.b[0], p.b[1]), [c, d] = toT(p.b[2], p.b[3]);
      for (let y = a < 0 ? 0 : b; y <= d; y++) for (let x = a; x <= c; x++) { const [px, py] = toP(x + 0.5, y + 0.5), i = at(x, y); if (i >= 0 && inShape(p, px, py)) { T[i] = R.kind === 'secret' ? K.SECRET : R.kind === 'tower' ? K.TOWER : K.FLOOR; owner[i] = k; } }
    }
    if (R.lavaRim) {                                                  // (Ashkar's arena: a ring of lava inside its wall)
      const p = R.parts[0], [x0, y0, x1, y1] = p.b, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2, k0 = 1 - R.lavaRim / Math.min(rx, ry);
      // (as the sheet has it, 2026-11-05: the lava deepest along the top and down the sides, its edge ragged, thinning to nothing
      // at the south where you come in; the way north to the keep kept open through it)
      for (let i = 0; i < w * h; i++) if (owner[i] === k) {
        const [px, py] = toP(i % w + 0.5, Math.floor(i / w) + 0.5), u = (px - cx) / rx, v = (py - cy) / ry, q = Math.sqrt(u * u + v * v), th = Math.atan2(v, u), up = -Math.sin(th);
        const rim = up < -0.45 ? 0 : (R.lavaRim * 0.6 + R.lavaRim * 1.5 * Math.max(0, (up + 0.45) / 1.45) + 4 * Math.sin(th * 9) + 3 * Math.sin(th * 23)) / Math.min(rx, ry);
        if (q > 1 - rim && !(py < cy && Math.abs(px - cx) <= 20)) T[i] = K.LAVA;
      }
    }
  });
  // the walkways
  const plugs = [];
  for (const Lk of LINKS) {
    const hw = Math.max(1, (Lk.w * S) / 2);
    for (let s = 0; s < Lk.pts.length - 1; s++) {
      const [ax, ay] = toT(...Lk.pts[s]), [bx, by] = toT(...Lk.pts[s + 1]);
      const x0 = Math.min(ax, bx) - Math.floor(hw), x1 = Math.max(ax, bx) + Math.ceil(hw) - 1, y0 = Math.min(ay, by) - Math.floor(hw), y1 = Math.max(ay, by) + Math.ceil(hw) - 1;
      const horiz = ay === by;
      for (let y = horiz ? y0 : Math.min(ay, by); y <= (horiz ? y1 : Math.max(ay, by)); y++) for (let x = horiz ? Math.min(ax, bx) : x0; x <= (horiz ? Math.max(ax, bx) : x1); x++) {
        const i = at(x, y); if (i < 0) continue;
        if (Lk.secret) { if (T[i] === K.WATER || T[i] === K.VOID || T[i] === K.WALL) T[i] = K.SECRET; }
        else if (T[i] !== K.FLOOR && T[i] !== K.LAVA && T[i] !== K.TOWER && T[i] !== K.SECRET) T[i] = Lk.stair ? K.STAIR : K.FLOOR;
        else if (T[i] === K.TOWER || T[i] === K.SECRET) { /* keep */ }
      }
    }
  }
  // the carpets (on the floor only)
  for (const [a, b, c, d] of CARPETS) { const [x0, y0] = toT(a, b), [x1, y1] = toT(c, d); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = at(x, y); if (i >= 0 && T[i] === K.FLOOR) T[i] = K.CARPET; } }
  // the walls: three tiles round every floor, the curtain three thick (the sheet's heavy stonework)
  const walk = (t) => t === K.FLOOR || t === K.CARPET || t === K.LAVA || t === K.STAIR || t === K.SECRET || t === K.TOWER;
  const wall = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (walk(T[i])) continue;
    let near = false; for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) { const j = at(x + dx, y + dy); if (j >= 0 && walk(T[j])) { near = true; break; } }
    let edge = false; if (T[i] === K.WATER) for (let dy = -3; dy <= 3 && !edge; dy++) for (let dx = -3; dx <= 3; dx++) { const j = at(x + dx, y + dy); if (j < 0 || T[j] === K.VOID) { edge = true; break; } }
    if (near || edge) wall[i] = 1;
  }
  for (let i = 0; i < w * h; i++) if (wall[i]) T[i] = K.WALL;
  // ---- stage D, the sheet's stonework (the user, 2026-11-05: "don't forget to make the crenellated, jagged wall edges and
  // small wall projections"): every outside face of the walls crenellated (a merlon every other pair of tiles, out over the
  // moat or the dark); a buttress or a turret's corner thrown out from the long faces now and then, never the same twice;
  // and inside the rooms, piers standing out from their walls along the long straight runs (never by a doorway)
  const hsh = (x, y) => ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1;
  const isW = (x, y) => { const i = at(x, y); return i >= 0 && T[i] === K.WALL; }, open = (x, y) => { const i = at(x, y); return i < 0 || T[i] === K.WATER || T[i] === K.VOID; };
  const add = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (!open(x, y)) continue;
    const nN = isW(x, y - 1), nS = isW(x, y + 1), nE = isW(x + 1, y), nW = isW(x - 1, y);
    if ((nN || nS) && !(nE || nW) && Math.floor(x / 2) % 2 === 0 && open(x, y + (nN ? 1 : -1))) add.push([x, y]);   // (a merlon on a north or south face)
    else if ((nE || nW) && !(nN || nS) && Math.floor(y / 2) % 2 === 0 && open(x + (nW ? 1 : -1), y)) add.push([x, y]);   // (on an east or west face)
  }
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {   // (a buttress: two out and three wide, from a long straight face, about one in eleven)
    if (hsh(x, y) > 0.09 || !open(x, y)) continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      if (!isW(x - dx, y - dy)) continue;
      const px = -dy, py = dx; if (!isW(x - dx + px * 2, y - dy + py * 2) || !isW(x - dx - px * 2, y - dy - py * 2)) continue;   // (a straight face either side)
      let room = true; for (let k = 0; k < 4 && room; k++) for (let q = -1; q <= 1; q++) if (!open(x + dx * k + px * q, y + dy * k + py * q)) room = false;   // (water clear in front)
      if (room) for (let k = 0; k < 2; k++) for (let q = -1; q <= 1; q++) add.push([x + dx * k + px * q, y + dy * k + py * q]);
      break;
    }
  }
  for (const [x, y] of add) T[at(x, y)] = K.WALL;
  // the piers inside: one tile of wall out from a straight wall into a room's own floor, every seven or so along it,
  // only where the room is deep there and no doorway is near (a doorway: within four of floor not the room's own)
  const flr = (i) => i >= 0 && (T[i] === K.FLOOR || T[i] === K.CARPET);
  const nearDoor = (x, y) => { const o = owner[at(x, y)]; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const j = at(x + dx, y + dy); if (j >= 0 && (walk(T[j]) || T[j] === K.STAIR) && owner[j] !== o) return true; } return false; };
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const i = at(x, y); if (!flr(i) || owner[i] < 0 || ROOMS[owner[i]].kind === 'tower' || ROOMS[owner[i]].lavaRim) continue;
    for (const [dx, dy] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) {
      if (!isW(x + dx, y + dy)) continue;
      const px = -dy, py = dx, along = dy ? x : y;
      if (along % 7 !== 3) break;
      let ok = true;
      for (let q = -2; q <= 2 && ok; q++) { if (!isW(x + dx + px * q, y + dy + py * q) || !flr(at(x + px * q, y + py * q))) ok = false; }   // (a straight wall, floor along it)
      for (let k = 1; k <= 4 && ok; k++) if (!flr(at(x - dx * k, y - dy * k))) ok = false;   // (deep enough behind it)
      if (ok && !nearDoor(x, y)) T[i] = K.WALL;
      break;
    }
  }
  // the secret tunnels: a cracked wall where each meets the room it opens from (the tunnel tile next to that room's floor)
  for (let i = 0; i < w * h; i++) if (T[i] === K.SECRET && owner[i] < 0) {
    const x = i % w, y = Math.floor(i / w); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = at(x + dx, y + dy); if (j >= 0 && (T[j] === K.FLOOR || T[j] === K.CARPET || T[j] === K.STAIR || T[j] === K.TOWER)) { T[i] = K.PLUG; plugs.push([x, y]); break; } }
  }
  const parts = ROOMS.map((R) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const p of R.parts) { const [a, b] = toT(p.b[0], p.b[1]), [c, d] = toT(p.b[2], p.b[3]); x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); } return { ...R, box: [x0, y0, x1, y1] }; });
  return { w, h, tiles: T, owner, parts, plugs, at: toT };
}

// ---- stage B: the footprint in the game's world (2026-11-05)
// where the sheet's tile (0, 0) stands in the castle's map (its West Entrance just north of the mountain's Final Rampart)
export const WORLD = [400, 122];
// each room's area in the castle plan: [num, key, region, extra] (the old numbers kept where the game's monsters, mechanisms
// and bosses already know them; new numbers for the rooms new to the layout)
export const AREA_OF = {
  entrance: [24, 'outer'], drawbridge: [23, 'outer'], spineW: [60, 'outer'], courtyard: [28, 'outer'], spineE: [61, 'inner'],
  jarls: [26, 'outer', { prefer: 'warden', court: true }], chainhall: [42, 'inner'], antechamber: [45, 'inner'],
  ashkar: [46, 'ashkar', { guardhall: true }], northkeep: [47, 'ashkar', { role: 'rest', sundoor: true }],
  rose: [53, 'outer'], banners: [25, 'outer'], gallery: [27, 'inner'], study: [62, 'inner'], library: [37, 'inner'],
  overlook: [43, 'inner'], shrine: [63, 'inner'], dining: [21, 'inner'], barracks: [29, 'inner'], sidechapel: [33, 'outer'],
  armory: [30, 'outer'], ropecog: [20, 'outer'], watch: [64, 'outer'], chapel: [31, 'outer'],
  twNW: [70, 'outer'], twW: [71, 'outer'], twN1: [72, 'inner'], twN2: [73, 'inner'], twE1: [74, 'inner'], twE2: [75, 'outer'],
  twSE: [76, 'outer'], twS: [77, 'outer'], twSW: [78, 'outer'],
};
// the locks' doorways on the sheet: [x0, y0, x1, y1] (every open tile in it becomes the lock's gate), the side they face
export const LOCK_DOORS = {
  '23-60': [[463, 444, 471, 490], 'E'],      // the drawbridge: out of the Drawbridge Guard into the great hall
  '23-25': [[442, 396, 462, 412], 'N'],      // the guard's north door (to the banner hall and the north-west wing)
  '23-30': [[390, 536, 412, 550], 'S'],      // the guard's south door (to the armory)
  '28-42': [[688, 383, 740, 397], 'N'],      // the Jarls' gate: the courtyard's north door, up the chain hall
  '45-46': [[668, 247, 758, 259], 'N'],      // the forge seal: the antechamber into Ashkar's arena
  '46-47': [[670, 116, 756, 130], 'N'],      // Ashkar's fall: the arena's north door to the keep
};
// the castle's way in from the mountain: a door through the curtain into the West Entrance (sheet px), facing west
export const WEST_DOOR = [222, 466];

// the areas for the castle plan: [num, key, title, region, cx, cy, w, h, 'master', extra] in the world's tiles
export function masterAreas() {
  const S = SCALE, [OX, OY] = ORIGIN, [WX, WY] = WORLD;
  return ROOMS.filter((R) => AREA_OF[R.id]).map((R) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of R.parts) { x0 = Math.min(x0, p.b[0]); y0 = Math.min(y0, p.b[1]); x1 = Math.max(x1, p.b[2]); y1 = Math.max(y1, p.b[3]); }
    const tx0 = WX + Math.round((x0 - OX) * S), ty0 = WY + Math.round((y0 - OY) * S), tx1 = WX + Math.round((x1 - OX) * S), ty1 = WY + Math.round((y1 - OY) * S);
    const [num, region, ex = {}] = AREA_OF[R.id], w = tx1 - tx0 + 1, h = ty1 - ty0 + 1;
    const F = R.fit || R.parts[0].b, fx0 = WX + Math.round((F[0] - OX) * S), fy0 = WY + Math.round((F[1] - OY) * S), fx1 = WX + Math.round((F[2] - OX) * S), fy1 = WY + Math.round((F[3] - OY) * S);
    const extra = { fit: [fx0 - tx0, fy0 - ty0, fx1 - fx0 + 1, fy1 - fy0 + 1], master: R.id, ...(R.kind === 'opt' ? { opt: true, role: 'treasure' } : R.kind === 'tower' ? { opt: true, role: 'rest' } : {}), ...ex };
    return [num, 'a' + num, R.name, region, tx0 + w / 2, ty0 + h / 2, w, h, 'master', extra];
  });
}
// a sheet point or box in the world's tiles
export const toWorld = (px, py) => [WORLD[0] + Math.round((px - ORIGIN[0]) * SCALE), WORLD[1] + Math.round((py - ORIGIN[1]) * SCALE)];

// the main route's runner (stage D): through each of these rooms, on this line of the sheet; a room's own runners on that
// line join it, its emblems and rings on it break it (capped either side)
export const MAIN_LINES = [
  { d: 'ew', at: 466, rooms: ['entrance', 'drawbridge', 'spineW', 'courtyard', 'spineE', 'jarls'], style: 'crown' },
  { d: 'ns', at: 714, rooms: ['chainhall', 'antechamber', 'northkeep'], style: 'crown' },
];
