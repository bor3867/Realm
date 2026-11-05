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
  // REGION III, THE OUTER KEEP (the middle)
  [20, 'a20', 'THE KILLING GROUND', 'outer', 470, 404, 42, 42, 'court'],
  [21, 'a21', 'THE SIEGE TRENCH', 'outer', 518, 404, 34, 30, 'hall'],
  [22, 'a22', 'THE TWIN WATCHTOWERS', 'outer', 570, 404, 45, 34, 'hall'],
  [23, 'a23', 'THE DRAWBRIDGE ENGINE', 'outer', 614, 404, 28, 32, 'hall'],
  [24, 'a24', 'THE BARBICAN', 'outer', 614, 360, 45, 38, 'hall'],
  [25, 'a25', 'THE HALL OF HOLLOW BANNERS', 'outer', 556, 358, 48, 33, 'hall'],
  [26, 'a26', "THE HOLLOW JARLS' COURT", 'outer', 496, 348, 58, 52, 'court', { prefer: 'warden', court: true }],
  // REGION IV, THE INNER KEEP (above the court, west to east and back)
  [27, 'a27', 'THE CONQUERED VESTIBULE', 'inner', 496, 300, 32, 28, 'hall'],
  [28, 'a28', 'THE RUPTURED GREAT HALL', 'inner', 444, 296, 52, 40, 'hall'],
  [29, 'a29', 'THE ROYAL BARRACKS', 'inner', 386, 300, 38, 34, 'hall'],
  [30, 'a30', "THE SERVANTS' SPUR", 'inner', 386, 342, 36, 22, 'hall', { opt: true, role: 'treasure' }],
  [31, 'a31', 'THE CHAPEL OF THE HOLLOW CROWN', 'inner', 336, 316, 44, 40, 'cross'],
  [32, 'a32', 'THE RELIQUARY OF BROKEN OATHS', 'inner', 336, 270, 30, 27, 'octa'],
  [33, 'a33', 'THE SHATTERED THRONE GALLERY', 'inner', 386, 254, 50, 30, 'hall'],
  [34, 'a34', 'THE WESTERN LAVA AQUEDUCT', 'inner', 442, 248, 45, 34, 'aqueduct'],
  [35, 'a35', 'THE FLOOD VALVE CHAMBER', 'inner', 494, 252, 30, 28, 'round'],
  [36, 'a36', 'THE CALDERA BRIDGE', 'inner', 542, 252, 46, 20, 'span'],
  [37, 'a37', 'THE ARCHIVE OF THE STOLEN SUN', 'inner', 596, 256, 42, 35, 'hall'],
  [38, 'a38', 'THE FOUNDRY JUNCTION', 'inner', 604, 208, 45, 35, 'cross'],
  [39, 'a39', 'THE EMBER CRUCIBLE', 'inner', 548, 200, 50, 45, 'ring'],
  [40, 'a40', 'THE FURNACE CONTROL', 'inner', 494, 204, 32, 30, 'u'],
  [41, 'a41', "THE OVERSEER'S FOUNDRY", 'inner', 548, 140, 42, 38, 'round', { opt: true, foundry: true }],
  [42, 'a42', 'THE CHAIN GALLERIES', 'inner', 494, 152, 42, 48, 'aqueduct'],
  [43, 'a43', 'THE GATE STAIRS', 'inner', 448, 152, 30, 45, 'stair'],
  // REGION V, ASHKAR'S CHAINED GATE (the top)
  [44, 'a44', 'THE CHAINED CAUSEWAY', 'ashkar', 448, 100, 24, 45, 'span'],
  [45, 'a45', 'THE ANCHOR HALL', 'ashkar', 402, 92, 48, 35, 'hall'],
  [46, 'a46', 'ASHKAR, THE CHAINED FORGE-GIANT', 'ashkar', 340, 92, 62, 60, 'octa', { guardhall: true }],
  [47, 'a47', 'THE GREAT SUN GATE', 'ashkar', 340, 34, 32, 28, 'hall', { role: 'rest', sundoor: true }],
  // REGION VI, ECLIPSE WALK (apart: the gate's portal only)
  [48, 'a48', 'THE ECLIPSE THRESHOLD', 'eclipse', 700, 40, 32, 32, 'round', { arrive: true }],
  [49, 'a49', 'THE DUSK CAUSEWAY', 'eclipse', 700, 90, 24, 55, 'span'],
  [50, 'a50', 'THE BROKEN ORRERY', 'eclipse', 700, 150, 48, 45, 'round'],
  [51, 'a51', 'THE SANCTUM ASCENT', 'eclipse', 700, 204, 34, 48, 'stair'],
  // REGION VII, SOLKHAR'S SANCTUM
  [52, 'a52', 'SOLKHAR, THE SUNTHIEF', 'sanctum', 700, 270, 70, 70, 'round', { boss: true }],
  // (2026-11-04, the user's room pages: the Corrupted Rose Court, a side court off the Procession Hall's north stair)
  [53, 'a53', 'THE CORRUPTED ROSE COURT', 'inner', 550, 298, 40, 40, 'hall', { opt: true, role: 'treasure' }],
  // (the user's other room pages, as side rooms off the halls whose pages have a door to spare)
  [54, 'a54', 'THE TWIN HALL', 'inner', 648, 205, 34, 28, 'hall', { opt: true, role: 'treasure' }],
  [55, 'a55', 'THE SANCTUM ANTECHAMBER', 'inner', 386, 205, 34, 28, 'hall', { opt: true, role: 'treasure' }],
  [56, 'a56', 'THE BROKEN GALLERY', 'inner', 360, 392, 34, 26, 'hall', { opt: true, role: 'treasure' }],
  [57, 'a57', 'THE SIDE CLOISTER', 'outer', 520, 448, 32, 24, 'hall', { opt: true, role: 'treasure' }],
  [58, 'a58', 'THE HANGING BRIDGE', 'inner', 395, 140, 36, 26, 'hall', { opt: true, role: 'treasure' }],
];
// the ways: the main route, then the optional ones (each rejoins the main route)
export const WAYS = [
  [1, 2], [2, 3], [3, 5], [5, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20],
  [20, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 29], [29, 31], [31, 32], [32, 33], [33, 34], [34, 35], [35, 36],
  [36, 37], [37, 38], [38, 39], [39, 40], [40, 42], [42, 43], [43, 44], [44, 45], [45, 46], [46, 47], [48, 49], [49, 50], [50, 51], [51, 52],
  [3, 4, true], [4, 5, true], [5, 6, true], [6, 7, true], [12, 14, true], [14, 15, true], [29, 30, true], [30, 31, true], [38, 41, true], [41, 42, true], [27, 53, true], [38, 54, true], [33, 55, true], [30, 56, true], [21, 57, true], [45, 58, true],
];
// the locks: on the way a->b, and what opens it
export const LOCKS = [
  [7, 8, 'clear:7', 'THE WATCH GATE OPENS'], [19, 20, 'clear:19', 'THE FINAL ASCENT OPENS'],
  [23, 24, 'mechs:clampL,clampR', 'THE CHAINS RELEASE · THE DRAWBRIDGE LOWERS'], [25, 26, 'break:25', 'THE CURSED BANNERS FALL · THE COURT IS OPEN'], [26, 27, 'jarls', 'THE KEEP GATE GRINDS OPEN'],
  [31, 32, 'break:31', 'THE RITUAL ENDS · THE RELIQUARY OPENS'], [35, 36, 'mech:valve', 'THE COOLING VALVE TURNS · THE OVERFLOW SINKS'],
  [43, 44, 'seal+chain', 'THE BROKEN CROWN SEAL AND THE CHAIN RELEASE · THE GATE OPENS'], [45, 46, 'mech:seal45', 'THE ENTRANCE SEAL OPENS'],
  [46, 47, 'ashkar', 'ASHKAR IS FALLEN · THE GREAT SUN GATE IS OPEN'], [50, 51, 'break:50', 'THE CELESTIAL ANCHORS FAIL · THE WAY STEADIES'],
];
// the mechanisms (stand at one, its area cleared, 3 s): [key, area, name, verb, sprite, at x, at y (0..1; else the middle)]
export const MECHS = [
  ['brazL', 22, 'THE WEST SIGNAL BRAZIER', 'SMOTHERING THE SIGNAL FIRE', 'castle_decor/pyre', 0.2, 0.7],
  ['brazR', 22, 'THE EAST SIGNAL BRAZIER', 'SMOTHERING THE SIGNAL FIRE', 'castle_decor/pyre', 0.8, 0.7],
  ['clampL', 23, 'THE WEST WINCH CLAMP', 'RELEASING THE WEST CLAMP', 'castle_decor/winch', 0.2, 0.25],
  ['clampR', 23, 'THE EAST WINCH CLAMP', 'RELEASING THE EAST CLAMP', 'castle_decor/winch', 0.8, 0.25],
  ['seal', 32, 'THE BROKEN CROWN SEAL', 'TAKING THE BROKEN CROWN SEAL', 'castle_decor/valve'],
  ['valve', 35, 'THE COOLING VALVE', 'TURNING THE COOLING VALVE', 'castle_decor/valve'],
  ['chain', 40, 'THE GREAT CHAIN RELEASE', 'RELEASING THE GREAT CHAIN', 'castle_decor/winch'],
  ['seal45', 45, 'THE ENTRANCE SEAL', 'OPENING THE ENTRANCE SEAL', 'castle_decor/winch'],
];
// the cursed things to break (an area's lock): [area, count, enemy id]
export const TARGETS = [[25, 3, 'cursed_banner'], [31, 3, 'cursed_altar'], [50, 2, 'celestial_anchor'], [6, 1, 'cursed_altar']];
// the geysers (src/castle.js): [area, flame vents, lava fissures]; set into the ground on and beside its way
export const GEYSERS = [[9, 3, 0], [10, 4, 0], [11, 0, 3], [12, 5, 0], [13, 2, 0], [15, 2, 0], [16, 0, 4], [17, 0, 2], [18, 3, 0], [19, 4, 1], [20, 4, 0], [21, 0, 2]];
