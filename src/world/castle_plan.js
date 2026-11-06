// SUNTHIEF'S CASTLE, THE 52 AREAS (2026-11-02, the user's "exact 52-area construction blueprint" and its map): every
// area where it stands, its size (the blueprint's walkable target, in tiles), its shape, its region; the ways between
// them (the main route, the optional ones) and the locks on them. src/world/maps.js LAYOUT.throne builds the map from
// this; src/castle.js keeps its locks and mechanisms; src/data/enemies.js DUNGEONS.throne.compose places who holds each.
//
// An area: [n, key, title, region, cx, cy, w, h, shape, extra]
//   region  forest | mountain | outer | inner | ashkar | eclipse | sanctum (its floor, its edges, its light)
//   shape   'clearing' (an irregular round of woodland), 'trail' (a winding path, woods either side), 'ravine' (a chasm
//           north to south, a broken bridge across), 'zigzag' (a mountain trail turning back and forth), 'switch' (three
//           switchback terraces, cliffs between), 'viaduct' / 'span' (a broken bridge over a gorge of lava), 'twin' (two
//           bridges over one chasm), 'ring' (a path round a lava reservoir), 'stair' (a stair up beside lava), and the
//           built ones: 'hall', 'octa', 'cross', 'u', 'round', 'court'
// A way: [a, b, optional] (from area a to area b); its road winds between their nearest sides.
// A lock: on the way a->b: what opens it (src/castle.js): mech:<key> (a mechanism turned), clear:<n> (that area's
// defenders dead), break:<n> (that area's cursed objects broken), jarls, ashkar, seal+chain.
import { masterAreas } from './castle_master.js';
export const AREAS = [
  // REGION I, THE ASHEN FOREST (bottom right, the forest's way west then north)
  [1, 'a01', 'REALMFALL HOLLOW', 'forest', 700, 748, 26, 28, 'clearing', { role: 'rest' }],
  [2, 'a02', 'THE BLACKROOT TRAIL', 'forest', 650, 742, 46, 22, 'trail'],
  [3, 'a03', 'THE WEEPING GROVE', 'forest', 594, 736, 38, 32, 'clearing'],
  [4, 'a04', "THE WOLF'S DEN", 'forest', 548, 728, 25, 20, 'clearing', { opt: true, role: 'treasure' }],
  [5, 'a05', 'THE THORNBOUND CROSSING', 'forest', 584, 690, 32, 36, 'clearing'],
  [6, 'a06', 'THE FORGOTTEN SHRINE', 'forest', 548, 690, 24, 23, 'clearing', { opt: true, role: 'treasure' }],
  [7, 'a07', 'THE FALLEN WATCHTOWER', 'forest', 588, 648, 34, 29, 'clearing'],
  [8, 'a08', 'DEADWATER RAVINE', 'forest', 538, 630, 44, 28, 'ravine'],
  [9, 'a09', 'THE LAST TREELINE', 'forest', 490, 628, 38, 30, 'clearing'],
  // REGION II, THE MOUNTAIN ASCENT (the left, climbing north)
  [10, 'a10', 'THE SCREE ASCENT', 'mountain', 450, 640, 24, 48, 'zigzag'],
  [11, 'a11', 'THE RUPTURED VIADUCT', 'mountain', 410, 598, 42, 24, 'viaduct'],
  [12, 'a12', 'THE BASALT SWITCHBACKS', 'mountain', 360, 586, 42, 55, 'switch'],
  [13, 'a13', 'THE BROKEN SIEGE BATTERY', 'mountain', 360, 530, 38, 30, 'octa'],
  [14, 'a14', "THE SMUGGLER'S LEDGE", 'mountain', 322, 560, 20, 33, 'zigzag', { opt: true, role: 'treasure' }],
  [15, 'a15', 'THE EMBER STAIR', 'mountain', 316, 506, 24, 48, 'stair'],
  [16, 'a16', 'THE TWIN LAVA BRIDGES', 'mountain', 316, 452, 45, 34, 'twin'],
  [17, 'a17', 'THE CRUCIBLE TRAVERSE', 'mountain', 366, 448, 35, 33, 'ring'],
  [18, 'a18', 'THE PYRE REDOUBT', 'mountain', 418, 452, 42, 35, 'octa'],
  [19, 'a19', 'THE FINAL RAMPART', 'mountain', 418, 404, 50, 35, 'hall'],
  // ---- THE CASTLE: the user's master layout as one fixed footprint (2026-11-05 rebuild: src/world/castle_master.js), each
  // room an area of its own from there (its place, its size, its shape all the footprint's; its tiles laid from it)
  ...masterAreas(),
  // REGION VI, ECLIPSE WALK (apart: the North Keep's Sun Gate's portal only; moved to the west of the map, 2026-11-05)
  [48, 'a48', 'THE ECLIPSE THRESHOLD', 'eclipse', 150, 40, 32, 32, 'round', { arrive: true }],
  [49, 'a49', 'THE DUSK CAUSEWAY', 'eclipse', 150, 90, 24, 55, 'span'],
  [50, 'a50', 'THE BROKEN ORRERY', 'eclipse', 150, 150, 48, 45, 'round'],
  [51, 'a51', 'THE SANCTUM ASCENT', 'eclipse', 150, 204, 34, 48, 'stair'],
  // REGION VII, SOLKHAR'S SANCTUM
  [52, 'a52', 'SOLKHAR, THE SUNTHIEF', 'sanctum', 150, 270, 70, 70, 'round', { boss: true }],
];
// the ways: the main route, then the optional ones (each rejoins the main route)
export const WAYS = [
  [1, 2], [2, 3], [3, 5], [5, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 15], [15, 16], [16, 17], [17, 18], [18, 19],
  // the castle's one route (the master layout), then the eclipse
  [19, 24], [48, 49], [49, 50], [50, 51], [51, 52],   // (the castle's own ways are its footprint's doors and walks: castle_master.js)
  [3, 4, true], [4, 5, true], [5, 6, true], [6, 7, true], [12, 14, true], [14, 15, true],
];
// the locks: on the way a->b, and what opens it
export const LOCKS = [
  [7, 8, 'clear:7', 'THE WATCH GATE OPENS'], [19, 24, 'clear:19', 'THE FINAL ASCENT OPENS'],
  [23, 60, 'mechs:clampL,clampR', 'THE CHAINS RELEASE · THE DRAWBRIDGE LOWERS'], [28, 42, 'jarls', 'THE JARLS ARE FALLEN · THE NORTH GATE GRINDS OPEN'], [23, 25, 'mechs:clampL,clampR'], [23, 30, 'mechs:clampL,clampR'],
  [45, 46, 'mech:seal45', 'THE ENTRANCE SEAL OPENS'], [46, 47, 'ashkar', 'ASHKAR IS FALLEN · THE GREAT SUN GATE IS OPEN'], [50, 51, 'break:50', 'THE CELESTIAL ANCHORS FAIL · THE WAY STEADIES'],
];
// the mechanisms (stand at one, its area cleared, 3 s): [key, area, name, verb, sprite, at x, at y (0..1; else the middle)]
export const MECHS = [
  ['clampL', 23, 'THE WEST WINCH CLAMP', 'RELEASING THE WEST CLAMP', 'castle_decor/winch', 0.2, 0.25],
  ['clampR', 23, 'THE EAST WINCH CLAMP', 'RELEASING THE EAST CLAMP', 'castle_decor/winch', 0.8, 0.25],
  ['seal45', 45, 'THE ENTRANCE SEAL', 'OPENING THE ENTRANCE SEAL', 'castle_decor/winch'],
];
// the cursed things to break (an area's lock): [area, count, enemy id]
// the secret rooms, where the master layout marks them (2026-11-05): [the room it opens from, the side, its name]; behind a
// cracked wall there, unseen until it breaks, never on the way
export const SECRETS = [];   // (the castle's secret chambers are its footprint's: castle_master.js)
export const TARGETS = [[31, 3, 'cursed_altar'], [50, 2, 'celestial_anchor'], [6, 1, 'cursed_altar']];
// the geysers (src/castle.js): [area, flame vents, lava fissures]; set into the ground on and beside its way
export const GEYSERS = [[9, 3, 0], [10, 4, 0], [11, 0, 3], [12, 5, 0], [13, 2, 0], [15, 2, 0], [16, 0, 4], [17, 0, 2], [18, 3, 0], [19, 4, 1]];
