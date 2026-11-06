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
  // ---- THE CASTLE, FROM THE USER'S MASTER LAYOUT (2026-11-05: "Use this as the layout for the castle ... a single route":
  // West Entrance > Drawbridge Guard > Central Courtyard > the Hollow Jarls (east) > their fall opens the north gate >
  // Chain Hall > Forge Antechamber > Ashkar (north centre) > the North Keep, its Sun Gate on to the Eclipse Walk). Laid out
  // at 0.42 tiles to a pixel of the map, the spine at y 290; the side rooms short branches off the route where the map has
  // them. The rooms are the pages' (src/world/castle_rooms.js), turned where the map turns their doors.
  // the main route
  [24, 'a24', 'THE WEST GATE', 'outer', 355, 290, 44, 40, 'hall'],
  [23, 'a23', 'THE DRAWBRIDGE GUARD', 'outer', 403, 290, 40, 40, 'hall'],
  [28, 'a28', 'THE CENTRAL COURTYARD', 'outer', 534, 290, 100, 72, 'court'],
  [26, 'a26', "THE HOLLOW JARLS' COURT", 'outer', 674, 290, 50, 52, 'court', { prefer: 'warden', court: true }],
  [42, 'a42', 'THE CHAIN HALL', 'inner', 534, 230, 26, 36, 'hall'],
  [45, 'a45', 'THE FORGE ANTECHAMBER', 'inner', 534, 194, 36, 18, 'hall'],
  [46, 'a46', 'ASHKAR, THE CHAINED FORGE-GIANT', 'ashkar', 534, 150, 62, 52, 'octa', { guardhall: true }],
  [47, 'a47', 'THE NORTH KEEP', 'ashkar', 534, 102, 34, 26, 'hall', { role: 'rest', sundoor: true }],
  // the side rooms (optional; each off the route, back the way it came)
  [53, 'a53', 'THE CORRUPTED ROSE COURTYARD', 'outer', 372, 221, 40, 40, 'hall', { opt: true, role: 'treasure' }],
  [20, 'a20', 'THE ROPE & COG GATEHOUSE', 'outer', 401, 349, 42, 44, 'hall', { opt: true, role: 'treasure' }],
  [27, 'a27', 'THE ROYAL GALLERY', 'inner', 469, 221, 32, 28, 'hall', { opt: true, role: 'treasure' }],
  [37, 'a37', 'THE LIBRARY', 'inner', 433, 174, 40, 30, 'hall', { opt: true, role: 'treasure' }],
  [21, 'a21', 'THE DINING HALL', 'inner', 611, 221, 34, 24, 'hall', { opt: true, role: 'treasure' }],
  [29, 'a29', 'THE BARRACKS', 'inner', 668, 205, 44, 44, 'hall', { opt: true, role: 'treasure' }],
  [43, 'a43', 'THE TOWER OVERLOOK', 'inner', 620, 172, 34, 36, 'hall', { opt: true, role: 'treasure' }],
  [31, 'a31', 'THE CHAPEL', 'outer', 534, 356, 44, 42, 'hall', { opt: true, role: 'treasure' }],
  [30, 'a30', 'THE ARMORY', 'outer', 607, 336, 30, 24, 'hall', { opt: true, role: 'treasure' }],
  [33, 'a33', 'THE SIDE CHAPEL', 'outer', 458, 342, 40, 31, 'hall', { opt: true, role: 'treasure' }],
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
  [19, 24], [24, 23], [23, 28], [28, 26], [28, 42], [42, 45], [45, 46], [46, 47], [48, 49], [49, 50], [50, 51], [51, 52],
  [3, 4, true], [4, 5, true], [5, 6, true], [6, 7, true], [12, 14, true], [14, 15, true],
  // the castle's side rooms: short branches, each back the way it came
  [23, 53, true], [23, 20, true], [28, 27, true], [27, 37, true], [28, 21, true], [21, 29, true], [21, 43, true], [28, 31, true], [28, 30, true], [28, 33, true],
];
// the locks: on the way a->b, and what opens it
export const LOCKS = [
  [7, 8, 'clear:7', 'THE WATCH GATE OPENS'], [19, 24, 'clear:19', 'THE FINAL ASCENT OPENS'],
  [23, 28, 'mechs:clampL,clampR', 'THE CHAINS RELEASE · THE DRAWBRIDGE LOWERS'], [28, 42, 'jarls', 'THE JARLS ARE FALLEN · THE NORTH GATE GRINDS OPEN'],
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
export const SECRETS = [[53, 'E', 'THE HIDDEN CHAMBER'], [29, 'E', 'THE SERVANT PASSAGE'], [30, 'E', "THE QUARTERMASTER'S CACHE"], [20, 'W', "THE SMUGGLER'S HOLD"]];
export const TARGETS = [[31, 3, 'cursed_altar'], [50, 2, 'celestial_anchor'], [6, 1, 'cursed_altar']];
// the geysers (src/castle.js): [area, flame vents, lava fissures]; set into the ground on and beside its way
export const GEYSERS = [[9, 3, 0], [10, 4, 0], [11, 0, 3], [12, 5, 0], [13, 2, 0], [15, 2, 0], [16, 0, 4], [17, 0, 2], [18, 3, 0], [19, 4, 1]];
