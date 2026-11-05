// SUNTHIEF'S CASTLE, ROOMS FROM THE USER'S PAGES (2026-11-04, art/source/castle4: "Build these castle rooms exactly from the
// provided room pages. Treat each room page as the layout/composition reference and each detail page as a library of
// placeable assets only ... Preserve the entrance and exit directions, room shape, open space for movement"). Each room
// is its page laid out in tiles: its floor (rectangles), the blocks of wall standing in it (towers, alcoves, the inner
// wall), lava, its doors (on the page's own sides: the way to each neighbour leaves through the door named for it), its
// runners and floor emblems, and its props where the page puts them. src/world/maps.js stamps these in place of the
// area's generated shape, routes each way from its door, and dresses the room from `props` (not the generic dressing).
//
//   w, h      the room in tiles; at [cx, cy] where its middle stands (moved from the blueprint where it had to be)
//   floor     [x0, y0, x1, y1] rectangles of floor (room tiles, inclusive)
//   cut       rectangles back to wall: the towers, alcoves, piers standing in the floor
//   lava      rectangles of lava (beside it, never on the way)
//   doors     { neighbour's area number: [x, y, side] }: the door's middle tile on the room's edge, the side it opens to
//   runners   [dir 'ns'|'ew', at, from, to, style]: a carpet runner three wide (its middle line at `at`)
//   emblems   [x, y, style]: a 5x5 floor emblem (sun, crown, forge)
//   props     [sprite, x, y, solid?]: placed as the page places them; solid unless false
//   mechs     { key: [x, y] }: where its mechanisms stand
//   boards    rectangles of wooden floor (a bridge, a catwalk)
//   stairs    rectangles of steps; dais: rectangles of raised floor (its edge a step); rings: [x, y] a 5x5 ritual ring
//   skins     [x0, y0, x1, y1, tile]: any keep floor tile by name (keep_grate, keep_plate)
export const ROOMS = {
  // 02 THE TWIN WATCHTOWERS: in from the foot up a lantern-lit approach, the sun runner to the great brazier on its dais;
  // a battlement walk across from the west tower to the east; each tower's signal fire on its top (the two mechanisms:
  // smother both and the Barbican's archers never come), the knight's alcove under the west tower, the hooded priest's
  // under the east, between moon banners; a stair down from each to its bastion; out through the east bastion
  a22: {
    page: 'rooms/02_twin_watchtowers.png', w: 46, h: 40, at: [570, 404],
    floor: [[3, 1, 13, 6], [12, 7, 14, 9], [1, 10, 17, 17], [17, 13, 29, 16], [19, 6, 27, 12], [33, 2, 42, 7], [32, 8, 34, 10], [29, 11, 45, 17],
      [19, 17, 27, 24], [20, 25, 26, 39], [2, 18, 6, 22], [1, 23, 11, 30], [38, 18, 42, 22], [34, 23, 45, 30]],
    doors: { 21: [23, 39, 'S'], 23: [45, 26, 'E'] },
    stairs: [[2, 18, 6, 22], [38, 18, 42, 22], [12, 7, 14, 9], [32, 8, 34, 10]],
    dais: [[19, 6, 27, 12]],
    runners: [['ns', 23, 13, 38, 'sun']],
    mechs: { brazL: [8, 3], brazR: [37, 4] },
    props: [
      ['castle_art/banner_crown', 8, 6, false], ['castle_art/banner_crown_torn', 38, 7, false],
      ['castle_art/banner_crown', 3, 10, false], ['castle_art/brazier_gold', 5, 10], ['castle_art/statue_knight', 7, 10], ['castle_art/brazier_gold', 9, 10], ['castle_art/banner_crown', 11, 10, false],
      ['castle_art/banner_eclipse', 35, 11, false], ['castle_art/brazier_gold', 37, 11], ['castle_art/statue_priest', 39, 11], ['castle_art/brazier_gold', 41, 11], ['castle_art/banner_eclipse', 43, 11, false],
      ['castle_art/brazier_gold', 23, 8], ['castle_art/banner_crown', 23, 11, false], ['keep_decor/keep_pylon', 20, 12], ['keep_decor/keep_pylon', 26, 12],
      ['castle_art/banner_sun', 16, 17, false], ['castle_art/banner_sun', 30, 17, false],
      ['keep_decor/keep_pylon', 19, 18], ['keep_decor/keep_pylon', 27, 18], ['keep_decor/keep_pylon', 20, 28], ['keep_decor/keep_pylon', 26, 28], ['keep_decor/keep_pylon', 20, 37], ['keep_decor/keep_pylon', 26, 37],
      ['castle_art/banner_crown', 20, 32, false], ['castle_art/banner_crown', 26, 32, false],
      ['castle_props/crate_stack', 3, 13], ['castle_decor/rubble', 15, 15, false], ['castle_props/barrel', 44, 13], ['castle_decor/rubble', 4, 27, false], ['castle_decor/rubble', 44, 15, false],
      ['keep_decor/keep_pylon', 3, 23], ['keep_decor/keep_pylon', 43, 23],
    ],
  },
  // 03 THE DRAWBRIDGE ENGINE: in over the lowered bridge at the foot between the two great clamps, lava either side of
  // it; the lower floor; the control platform up its steps (three levers, grates either side); the great gears west and
  // east; a winch on the west catwalk and one on the east (the two clamps: turn both and the chains release, the
  // drawbridge beyond the portcullis comes down); lava vents in the walls; out north through the portcullis
  a23: {
    page: 'rooms/03_drawbridge_engine.png', w: 40, h: 40, at: [622, 416],
    floor: [[16, 0, 23, 7], [2, 8, 37, 13], [2, 14, 13, 22], [26, 14, 37, 22], [15, 14, 24, 22], [3, 23, 34, 31], [14, 32, 25, 34], [15, 35, 24, 39]],
    cut: [[14, 14, 14, 20], [25, 14, 25, 20], [14, 13, 15, 13], [24, 13, 25, 13]],
    lava: [[34, 9, 37, 11], [1, 25, 3, 29], [10, 35, 13, 39], [26, 35, 29, 39]],
    boards: [[15, 35, 24, 39], [3, 9, 12, 11], [27, 19, 36, 21]],
    doors: { 22: [19, 39, 'S'], 24: [19, 0, 'N'] },
    stairs: [[16, 21, 23, 22]],
    skins: [[12, 21, 13, 22, 'keep_grate'], [26, 21, 27, 22, 'keep_grate'], [17, 30, 22, 31, 'keep_plate']],
    runners: [['ns', 19, 16, 22, 'sun']],
    mechs: { clampL: [8, 10], clampR: [32, 20] },
    props: [
      ['castle_decor/chain_post', 16, 2], ['castle_decor/chain_post', 23, 2], ['castle_art/brazier_gold', 15, 8], ['castle_art/brazier_gold', 24, 8],
      ['castle_art/banner_sun', 6, 8, false], ['castle_art/banner_crown', 30, 8, false],
      ['keep_decor/keep_lever', 17, 15], ['keep_decor/keep_lever', 19, 15], ['keep_decor/keep_lever', 21, 15], ['castle_art/brazier_gold', 16, 14], ['castle_art/brazier_gold', 23, 14],
      ['keep_decor/keep_wheel', 7, 18], ['castle_decor/gear', 11, 15], ['keep_decor/keep_wheel', 30, 15],
      ['keep_decor/keep_rail', 3, 12, false], ['keep_decor/keep_rail', 12, 12, false], ['keep_decor/keep_rail', 27, 22, false], ['keep_decor/keep_rail', 36, 22, false],
      ['castle_decor/rubble', 4, 8, false], ['castle_props/crate_stack', 31, 9], ['castle_decor/rubble', 30, 25, false], ['castle_decor/rubble', 8, 28, false],
      ['castle_decor/chain_anchor', 16, 32], ['castle_decor/chain_anchor', 23, 32], ['castle_art/brazier_gold', 14, 34], ['castle_art/brazier_gold', 25, 34],
    ],
  },
  // 08 THE ASHEN BARRACKS: in at the foot between the guards in their alcoves, the crown runner up the hall to the
  // stair and the dais under the great banner, two knights in its alcoves; the bunks in their alcoves down the west
  // wall, the long mess table with its benches, the weapon racks and map tables east, a purple-lit arch east (the way
  // to the Servants' Spur) and the wing out west
  a29: {
    page: 'rooms/08_ashen_barracks.png', w: 44, h: 44, at: [386, 300],
    floor: [[16, 2, 27, 9], [17, 10, 26, 11], [3, 3, 12, 6], [2, 7, 10, 26], [11, 10, 40, 32], [30, 3, 40, 9], [14, 34, 16, 36], [27, 34, 29, 36], [17, 33, 27, 43], [0, 33, 14, 38], [40, 26, 43, 30]],
    cut: [[2, 13, 7, 13], [2, 19, 7, 19], [30, 9, 33, 9], [11, 10, 11, 12]],
    doors: { 28: [22, 43, 'S'], 31: [0, 35, 'W'], 30: [43, 28, 'E'] },
    dais: [[16, 2, 27, 9]],
    stairs: [[17, 10, 26, 11]],
    runners: [['ns', 22, 12, 42, 'crown']],
    props: [
      ['castle_art/statue_knight', 18, 3], ['castle_art/statue_knight', 25, 3], ['castle_art/banner_crown', 21, 3, false], ['castle_art/brazier_gold', 17, 8], ['castle_art/brazier_gold', 26, 8],
      ['castle_art/banner_crown', 14, 10, false], ['castle_art/banner_crown', 29, 10, false],
      ['keep_decor/keep_bunk', 6, 4], ['keep_decor/keep_bunk', 4, 9], ['keep_decor/keep_bunk', 4, 15], ['keep_decor/keep_bunk', 4, 21], ['castle_art/banner_crown', 10, 14, false],
      ['keep_decor/keep_pew', 13, 18], ['castle_decor/table', 14, 20], ['castle_decor/table', 14, 22], ['keep_decor/keep_pew', 13, 25], ['castle_art/brazier_gold', 14, 19],
      ['castle_art/brazier_gold', 19, 22], ['castle_art/brazier_gold', 25, 22], ['castle_decor/collapsed_pillar', 18, 15],
      ['keep_decor/keep_rack', 31, 12], ['keep_decor/keep_rack', 34, 12], ['keep_decor/keep_armor', 37, 12], ['castle_art/banner_crown_torn', 39, 11, false],
      ['castle_decor/table', 34, 17], ['castle_decor/table', 33, 23], ['keep_decor/keep_pew', 33, 21], ['castle_props/crate_stack', 35, 5], ['castle_props/crate_stack', 38, 8], ['castle_props/crate_stack', 38, 18], ['castle_props/barrel', 12, 30],
      ['castle_art/brazier_purple', 40, 25], ['castle_art/brazier_purple', 40, 31], ['castle_art/banner_crown', 38, 27, false],
      ['castle_decor/rubble', 13, 12, false], ['castle_decor/rubble', 12, 28, false], ['castle_decor/rubble', 31, 30, false], ['castle_decor/rubble', 8, 36, false],
      ['castle_art/statue_knight', 15, 35], ['castle_art/statue_knight', 28, 35], ['castle_art/brazier_gold', 19, 36], ['castle_art/brazier_gold', 25, 36], ['castle_art/banner_crown', 4, 33, false],
    ],
  },
  // 09 THE CHAPEL OF HOLLOW LIGHT: in up the steps at the foot, the sun runner up the nave between the broken pews to
  // the altar on its stepped dais, the great window behind it, a hooded statue either side; a shrine with its candles
  // in each side wall, purple fires down the nave, broken columns; ruins in the north corners, the way north through
  // the broken arch in the east one (to the Reliquary), a side door east (to the Servants' Spur)
  a31: {
    page: 'rooms/09_chapel_of_hollow_light.png', w: 44, h: 42, at: [330, 316],   // (6 west of the blueprint: a corridor's width between it and the Barracks)
    floor: [[15, 3, 28, 14], [5, 4, 12, 14], [31, 4, 38, 14], [34, 0, 36, 3], [3, 15, 40, 33], [0, 17, 3, 21], [40, 17, 43, 21], [12, 34, 31, 36], [17, 37, 26, 41], [40, 27, 43, 31]],
    cut: [[3, 15, 5, 16], [38, 15, 40, 16], [13, 4, 14, 8], [29, 4, 30, 8]],
    doors: { 29: [21, 41, 'S'], 32: [35, 0, 'N'], 30: [43, 29, 'E'] },
    dais: [[15, 9, 28, 14]],
    stairs: [[18, 15, 25, 16], [17, 37, 26, 41]],
    runners: [['ns', 21, 17, 36, 'sun']],
    props: [
      ['castle_art/altar', 21, 11], ['castle_art/statue_monk', 16, 6], ['castle_art/statue_monk', 27, 6], ['castle_art/brazier_purple', 18, 13], ['castle_art/brazier_purple', 25, 13],
      ['castle_art/banner_crown', 15, 4, false], ['castle_art/banner_crown', 28, 4, false], ['castle_art/banner_cursed', 6, 15, false], ['castle_art/banner_cursed', 37, 15, false],
      ['castle_decor/shrine_altar', 1, 19], ['castle_decor/shrine_altar', 42, 19],
      ['castle_art/brazier_purple', 9, 19], ['castle_art/brazier_purple', 34, 19], ['castle_art/brazier_purple', 7, 28], ['castle_art/brazier_purple', 17, 32], ['castle_art/brazier_purple', 26, 32],
      ['keep_decor/keep_pew', 11, 22], ['keep_decor/keep_pew_broken', 11, 25], ['keep_decor/keep_pew_broken', 11, 29], ['keep_decor/keep_pew', 31, 22], ['keep_decor/keep_pew', 31, 25], ['keep_decor/keep_pew_broken', 31, 29],
      ['castle_decor/collapsed_pillar', 15, 20], ['castle_decor/collapsed_pillar', 36, 25],
      ['castle_decor/rubble', 7, 6, false], ['castle_decor/rubble', 10, 12, false], ['castle_decor/rubble', 33, 7, false], ['castle_decor/rubble', 37, 11, false], ['castle_decor/rubble', 5, 31, false], ['castle_decor/rubble', 38, 32, false],
      ['castle_art/banner_crown', 13, 34, false], ['keep_decor/keep_pylon', 16, 36], ['keep_decor/keep_pylon', 27, 36], ['castle_props/alcove_niche', 12, 35], ['castle_props/alcove_niche', 31, 35],
    ],
  },
  // 07 THE ROPE WINCH GATEHOUSE: in over the plank bridge at the foot between the rope posts, up past the great rope
  // drum on its railed platform (a brazier at each corner), the sun runner on to the portcullis north between its
  // towers; a wooden stair up the west side, a wooden balcony east, the wooden cogs that work the ropes in the corners
  a20: {
    page: 'rooms/07_rope_winch_gatehouse.png', w: 42, h: 44, at: [470, 414],
    floor: [[17, 0, 24, 8], [3, 5, 10, 8], [31, 5, 38, 8], [2, 9, 39, 31], [6, 32, 35, 36], [15, 37, 26, 39]],
    boards: [[2, 12, 6, 26], [31, 12, 38, 16], [17, 40, 24, 43]],
    lava: [[13, 40, 15, 43], [26, 40, 28, 43]],
    doors: { 19: [20, 43, 'S'], 21: [20, 0, 'N'] },
    dais: [[14, 19, 27, 28]],
    runners: [['ns', 20, 1, 17, 'sun'], ['ns', 20, 29, 39, 'sun']],
    props: [
      ['castle_art/banner_crown', 15, 9, false], ['castle_art/banner_crown', 26, 9, false], ['castle_decor/gear', 8, 7], ['castle_decor/gear', 33, 7], ['castle_decor/chain_post', 5, 6], ['castle_decor/chain_post', 36, 6],
      ['castle_art/brazier_gold', 16, 11], ['castle_art/brazier_gold', 25, 11],
      ['keep_decor/keep_winch', 20, 23], ['castle_art/brazier_gold', 14, 19], ['castle_art/brazier_gold', 27, 19], ['castle_art/brazier_gold', 14, 28], ['castle_art/brazier_gold', 27, 28],
      ['keep_decor/keep_rail', 17, 19, false], ['keep_decor/keep_rail', 24, 19, false], ['keep_decor/keep_rail', 17, 28, false], ['keep_decor/keep_rail', 24, 28, false], ['castle_art/banner_crown', 20, 28, false],
      ['castle_art/banner_crown', 8, 11, false], ['castle_art/banner_crown', 34, 17, false],
      ['castle_decor/rubble', 9, 18, false], ['castle_props/barrel', 34, 25], ['castle_props/crate_stack', 36, 27], ['castle_props/crate_stack', 4, 29], ['castle_props/barrel', 8, 30], ['castle_decor/rubble', 8, 34, false],
      ['castle_decor/chain_post', 12, 33], ['castle_decor/chain_post', 29, 33], ['castle_art/banner_crown', 7, 32, false], ['castle_art/banner_crown', 34, 32, false],
      ['keep_decor/keep_pylon', 15, 38], ['keep_decor/keep_pylon', 26, 38],
    ],
  },
  // A13 THE BROKEN RAMPART: the north wall broken open to the sky, its stones heaped along the breach; a great heap of
  // fallen masonry east, a brazier at the foot; in from the west, out east
  a21: {
    page: 'rooms/22_broken_rampart.png', w: 36, h: 28, at: [518, 404],
    floor: [[4, 3, 9, 5], [25, 3, 31, 5], [3, 6, 32, 23], [0, 7, 2, 11], [33, 14, 35, 18], [15, 24, 20, 27]],
    doors: { 20: [0, 9, 'W'], 22: [35, 16, 'E'], 57: [17, 27, 'S'] },
    props: [
      ['castle_decor/rubble', 10, 6, false], ['castle_decor/rock', 12, 6], ['castle_decor/rubble', 14, 7, false], ['castle_decor/rock', 17, 6], ['castle_decor/rubble', 20, 6, false], ['castle_decor/rock', 23, 7], ['castle_decor/rubble', 25, 5, false],
      ['castle_decor/rock', 25, 12], ['castle_decor/rock', 27, 11], ['castle_decor/rock', 28, 13], ['castle_decor/rubble', 26, 14, false], ['castle_decor/rubble', 29, 10, false],
      ['castle_art/brazier_gold', 12, 19], ['castle_props/ash_shrub', 21, 21, false], ['castle_decor/rubble', 5, 12, false], ['castle_decor/rubble', 6, 17, false], ['castle_decor/rubble', 30, 20, false], ['castle_decor/rubble', 4, 21, false],
    ],
  },
  // A16 THE PROCESSION HALL: in at the foot (from the Jarls' court), the runner straight up the hall between two rows of
  // candelabra to the stair north between its pillars; sun banners down both walls; doors east and west (west to the
  // great hall)
  a27: {
    page: 'rooms/25_procession_hall.png', w: 32, h: 28, at: [496, 300],
    floor: [[3, 3, 28, 23], [13, 0, 18, 2], [13, 24, 18, 27], [0, 15, 2, 19], [29, 15, 31, 19]],
    cut: [[10, 3, 11, 7], [20, 3, 21, 7]],
    doors: { 26: [15, 27, 'S'], 28: [0, 17, 'W'], 53: [15, 0, 'N'] },
    stairs: [[13, 1, 18, 6]],
    runners: [['ns', 15, 7, 26, 'crown']],
    props: [
      ['castle_art/banner_sun', 5, 4, false], ['castle_art/banner_sun', 8, 3, false], ['castle_art/banner_sun', 23, 3, false], ['castle_art/banner_sun', 26, 4, false],
      ['castle_art/pedestal_flame', 11, 10], ['castle_art/pedestal_flame', 11, 13], ['castle_art/pedestal_flame', 11, 16], ['castle_art/pedestal_flame', 20, 10], ['castle_art/pedestal_flame', 20, 13], ['castle_art/pedestal_flame', 20, 16],
      ['keep_decor/keep_pillar', 6, 21], ['keep_decor/keep_pillar', 25, 21], ['castle_decor/rubble', 5, 12, false], ['castle_decor/rubble', 26, 17, false],
    ],
  },
  // A6 THE COLLAPSED WING: its roof come down: heaps of fallen stone over half its floor (cover to fight from), a torn sun
  // banner hanging on a broken chain, the broken arch north choked; in from the east, out west
  a28: {
    page: 'rooms/15_collapsed_wing.png', w: 44, h: 34, at: [444, 296],
    floor: [[15, 2, 20, 5], [3, 6, 40, 29], [0, 11, 2, 15], [41, 11, 43, 15], [19, 30, 24, 31]],
    cut: [[5, 6, 7, 8], [22, 6, 24, 7]],
    doors: { 27: [43, 13, 'E'], 29: [0, 13, 'W'] },
    props: [
      ['castle_art/banner_sun_torn', 31, 6, false], ['castle_decor/rubble', 17, 3, false], ['castle_decor/rock', 16, 4], ['castle_decor/rock', 19, 4],
      ['castle_decor/rock', 6, 12], ['castle_decor/rubble', 7, 14, false], ['castle_decor/rock', 8, 17], ['castle_decor/rubble', 5, 19, false], ['castle_decor/rock', 6, 23], ['castle_decor/rubble', 9, 25, false], ['castle_decor/collapsed_pillar', 11, 21],
      ['castle_decor/rock', 27, 20], ['castle_decor/rubble', 29, 22, false], ['castle_decor/rock', 31, 24], ['castle_decor/rock', 34, 21], ['castle_decor/rubble', 36, 24, false], ['castle_decor/rock', 33, 26], ['castle_decor/collapsed_pillar', 37, 18],
      ['castle_decor/rubble', 15, 12, false], ['castle_decor/rubble', 23, 15, false], ['castle_decor/rubble', 20, 25, false], ['castle_decor/rock', 21, 30], ['castle_decor/rubble', 23, 30, false],
      ['castle_decor/broken_hammer', 18, 18, false], ['castle_decor/fallen_soldier', 25, 9, false], ['castle_props/ash_shrub', 12, 27, false], ['castle_props/ash_shrub', 35, 9, false],
    ],
  },
  // A10 THE GARDEN CLOISTER: a lawn under the great pale tree at its head, its roots red through the grass; a flagged
  // path from it to the foot; tall pillars and short either side, flowers in the grass; doors west and east
  a30: {
    page: 'rooms/19_garden_cloister.png', w: 34, h: 26, at: [386, 346],
    floor: [[3, 3, 30, 21], [14, 22, 19, 25], [0, 7, 2, 11], [31, 7, 33, 11]],
    grass: [[3, 3, 13, 21], [20, 3, 30, 21], [14, 3, 19, 9]],
    doors: { 29: [33, 9, 'E'], 31: [0, 9, 'W'], 56: [16, 25, 'S'] },
    props: [
      ['castle_art/deadwood_big', 16, 6], ['castle_art/ember_bloom', 12, 8, false], ['castle_art/ember_bloom', 21, 9, false],
      ['keep_decor/keep_pillar', 6, 6], ['keep_decor/keep_pillar', 27, 6], ['castle_decor/collapsed_pillar', 6, 15], ['castle_decor/collapsed_pillar', 27, 15],
      ['castle_art/grass_ember', 9, 18, false], ['castle_art/leaf_ember', 24, 18, false], ['castle_art/grass_small', 4, 12, false], ['castle_art/leaf_small', 29, 13, false], ['castle_art/shrub_small', 11, 13, false], ['castle_art/shrub_small', 22, 14, false],
    ],
  },
  // A7 THE RELIQUARY NICHE: up the runner from the foot to the stepped dais and the Sun's relic on it (the Broken Crown
  // Seal is taken there), candelabra either side, dark arches behind, two broken pillars at the foot; a side door east
  a32: {
    page: 'rooms/16_reliquary_niche.png', w: 32, h: 26, at: [336, 268],
    floor: [[3, 3, 28, 22], [12, 23, 19, 25], [29, 13, 31, 17]],
    cut: [[4, 3, 7, 5], [24, 3, 27, 5]],
    doors: { 31: [15, 25, 'S'], 33: [31, 15, 'E'] },
    dais: [[10, 6, 21, 11]],
    stairs: [[12, 12, 19, 13]],
    runners: [['ns', 15, 14, 25, 'crown']],
    mechs: { seal: [15, 9] },
    props: [
      ['castle_decor/sun_statue', 15, 7], ['castle_art/pedestal_flame', 6, 9], ['castle_art/pedestal_flame', 25, 9], ['castle_art/pedestal_flame', 8, 9], ['castle_art/pedestal_flame', 23, 9],
      ['castle_decor/collapsed_pillar', 7, 19], ['castle_decor/collapsed_pillar', 24, 19], ['castle_props/sarcophagus', 6, 15], ['castle_props/sarcophagus', 25, 15], ['castle_decor/rubble', 5, 14, false], ['castle_decor/rubble', 26, 21, false],
    ],
  },
  // A14 THE CHANCEL: the gold altar on its stepped dais under the great window, sun banners either side, candelabra by
  // the slender windows; the runner from the foot; doors west and east
  a33: {
    page: 'rooms/23_chancel.png', w: 40, h: 31, at: [386, 254],
    floor: [[3, 3, 36, 25], [17, 26, 22, 30], [0, 13, 2, 17], [37, 13, 39, 17], [18, 0, 21, 2]],
    doors: { 32: [0, 15, 'W'], 34: [39, 15, 'E'], 55: [19, 0, 'N'] },
    dais: [[13, 5, 26, 12]],
    stairs: [[15, 13, 24, 14]],
    runners: [['ns', 19, 15, 30, 'crown']],
    props: [
      ['castle_art/altar', 19, 8], ['castle_art/brazier_gold', 15, 7], ['castle_art/brazier_gold', 24, 7], ['castle_art/banner_sun', 10, 4, false], ['castle_art/banner_sun', 29, 4, false],
      ['castle_art/pedestal_flame', 7, 10], ['castle_art/pedestal_flame', 32, 10], ['castle_decor/rubble', 6, 21, false], ['castle_decor/rubble', 33, 19, false],
    ],
  },
  // 06 THE CORRUPTED ROSE COURT: up the steps at its foot, the runner to the great corrupted tree on its round bed in the
  // middle, purple dripping from its pale boughs; braziers about it, rose beds against the walls, broken benches and
  // columns; the crowned statue in its niche and a ruined niche either side of the purple windows at its head
  a53: {
    page: 'rooms/06_corrupted_rose_court.png', w: 40, h: 40,
    floor: [[3, 7, 36, 29], [14, 3, 25, 6], [6, 4, 10, 6], [29, 4, 33, 6], [8, 30, 31, 32], [16, 33, 23, 39]],
    cut: [[3, 7, 6, 9], [33, 7, 36, 9], [3, 27, 5, 29], [34, 27, 36, 29]],
    doors: { 27: [19, 39, 'S'] },
    dais: [[14, 13, 24, 22]],
    rings: [[19, 18]],
    stairs: [[16, 34, 23, 39]],
    runners: [['ns', 19, 23, 33, 'crown']],
    props: [
      ['castle_art/deadwood_big', 19, 16], ['castle_art/brazier_purple', 14, 6], ['castle_art/brazier_purple', 25, 6], ['castle_art/statue_queen', 8, 5], ['castle_decor/rubble', 30, 5, false], ['castle_decor/shattered_statue', 32, 6],
      ['castle_art/brazier_gold', 8, 16], ['castle_art/brazier_gold', 31, 16], ['castle_art/brazier_gold', 10, 24], ['castle_art/brazier_gold', 29, 24],
      ['castle_art/ember_bloom', 5, 11, false], ['castle_art/ember_bloom', 7, 10, false], ['castle_art/leaf_ember', 6, 12, false], ['castle_art/ember_bloom', 33, 11, false], ['castle_art/ember_bloom', 31, 10, false], ['castle_art/leaf_ember', 34, 12, false],
      ['castle_art/ember_bloom', 6, 26, false], ['castle_art/ember_bloom', 8, 27, false], ['castle_art/leaf_ember', 7, 25, false],
      ['keep_decor/keep_pew_broken', 8, 13], ['keep_decor/keep_pew_broken', 30, 25], ['castle_decor/collapsed_pillar', 4, 19], ['castle_decor/collapsed_pillar', 35, 21],
      ['castle_art/banner_crown', 12, 30, false], ['castle_art/banner_crown', 27, 30, false], ['keep_decor/keep_pylon', 16, 32], ['keep_decor/keep_pylon', 23, 32],
    ],
  },
  // A3 THE TWIN HALL: two long red runners with the sun on them down either side, the great pillar with the sun-crystal
  // on its dais between, candles in the side walls, pillars either side of the niche at its head; in from the west
  a54: {
    page: 'rooms/12_twin_hall.png', w: 34, h: 28,
    floor: [[3, 3, 30, 24], [14, 0, 19, 2], [14, 25, 19, 27], [0, 8, 2, 12], [31, 8, 33, 12]],
    doors: { 38: [0, 10, 'W'] },
    dais: [[12, 8, 21, 20]],
    runners: [['ns', 7, 3, 24, 'sun'], ['ns', 26, 3, 24, 'sun']],
    emblems: [[7, 14, 'sun'], [26, 14, 'sun']],
    props: [['keep_decor/keep_pillar', 16, 14], ['castle_art/pedestal_crystal', 16, 11], ['castle_art/pedestal_flame', 4, 9], ['castle_art/pedestal_flame', 29, 9], ['keep_decor/keep_pillar', 12, 3], ['keep_decor/keep_pillar', 21, 3], ['castle_art/banner_sun', 16, 3, false]],
  },
  // A8 THE SANCTUM ANTECHAMBER: a hooded statue on its plinth either side, red banners by the stair up at its head, the
  // great compass worn into the floor, a brazier in each south corner; in from the west
  a55: {
    page: 'rooms/17_sanctum_antechamber.png', w: 34, h: 28,
    floor: [[13, 0, 20, 7], [3, 3, 30, 23], [6, 24, 27, 25], [0, 11, 2, 15], [31, 11, 33, 15]],
    doors: { 33: [0, 13, 'W'] },
    stairs: [[13, 0, 20, 7]],
    dais: [[3, 6, 8, 12], [25, 6, 30, 12]],
    rings: [[16, 16]],
    props: [['castle_art/statue_monk', 5, 9], ['castle_art/statue_monk', 28, 9], ['castle_art/banner_sun', 10, 3, false], ['castle_art/banner_sun', 23, 3, false], ['castle_art/brazier_gold', 6, 21], ['castle_art/brazier_gold', 27, 21]],
  },
  // A2 THE BROKEN GALLERY: its north windows broken open to the sky (the way in from the garden between them), its roof
  // fallen in heaps along the west side, columns standing and broken, candles in the south corners
  a56: {
    page: 'rooms/11_broken_gallery.png', w: 34, h: 26,
    floor: [[3, 4, 30, 22], [15, 0, 18, 3], [0, 9, 2, 13], [31, 9, 33, 13]],
    doors: { 30: [16, 0, 'N'] },
    props: [
      ['castle_decor/rock', 6, 8], ['castle_decor/rubble', 8, 9, false], ['castle_decor/rock', 9, 11], ['castle_decor/rubble', 6, 12, false], ['castle_decor/rubble', 11, 17, false], ['castle_decor/rubble', 13, 6, false], ['castle_props/ash_shrub', 22, 6, false],
      ['castle_decor/collapsed_pillar', 19, 10], ['castle_decor/collapsed_pillar', 23, 12], ['keep_decor/keep_pillar', 8, 18], ['keep_decor/keep_pillar', 24, 18],
      ['castle_art/pedestal_flame', 4, 21], ['castle_art/pedestal_flame', 29, 21],
    ],
  },
  // A1 THE SIDE CLOISTER: the great sun banner at its head over the runner down from it, the runner across at the foot
  // meeting it at the sun; columns with candles at their feet, small banners, braziers at the foot; in from the north
  a57: {
    page: 'rooms/10_side_cloister.png', w: 32, h: 24,
    floor: [[3, 3, 28, 20], [21, 0, 25, 2], [14, 21, 17, 23], [0, 8, 2, 12], [29, 8, 31, 12]],
    doors: { 21: [23, 0, 'N'] },
    runners: [['ns', 15, 4, 13, 'sun'], ['ew', 16, 3, 28, 'sun']],
    emblems: [[15, 16, 'sun']],
    props: [['castle_art/banner_sun', 15, 3, false], ['keep_decor/keep_pillar', 9, 5], ['keep_decor/keep_pillar', 21, 5], ['castle_art/pedestal_flame', 9, 8], ['castle_art/pedestal_flame', 21, 8],
      ['castle_art/banner_sun_torn', 6, 3, false], ['castle_art/banner_sun_torn', 26, 3, false], ['castle_art/pedestal_flame', 4, 9], ['castle_art/pedestal_flame', 27, 9], ['castle_art/brazier_gold', 7, 19], ['castle_art/brazier_gold', 24, 19]],
  },
  // A5 THE HANGING BRIDGE: two ledges either side of a chasm, a plank bridge on ropes across it between its rope posts;
  // sun banners, candles, braziers on each ledge; in from the west
  a58: {
    page: 'rooms/14_hanging_bridge.png', w: 36, h: 26,
    floor: [[2, 4, 11, 22], [24, 4, 33, 22], [0, 11, 1, 15], [34, 11, 35, 15]],
    chasm: [[12, 1, 23, 24]],
    boards: [[12, 11, 23, 14]],
    doors: { 45: [0, 13, 'W'] },
    props: [['castle_art/banner_sun', 5, 4, false], ['castle_art/banner_sun', 30, 4, false], ['castle_decor/chain_post', 11, 10], ['castle_decor/chain_post', 11, 15], ['castle_decor/chain_post', 24, 10], ['castle_decor/chain_post', 24, 15],
      ['castle_art/pedestal_flame', 3, 9], ['castle_art/pedestal_flame', 32, 9], ['castle_art/brazier_gold', 5, 19], ['castle_art/brazier_gold', 30, 19]],
  },
  // A9 THE SCRIPTORIUM: bookshelves along the north wall either side of its dark alcove, writing desks in pairs west and
  // east heaped with books and candles, the great red rug with the sun on it in the middle; doors west and east
  a37: {
    page: 'rooms/18_scriptorium.png', w: 40, h: 30, at: [596, 256],
    floor: [[3, 3, 36, 26], [15, 1, 24, 2], [0, 8, 2, 12], [37, 8, 39, 12]],
    doors: { 36: [0, 10, 'W'], 38: [39, 10, 'E'] },
    rugs: [[14, 10, 25, 18, 'sun']],
    emblems: [[19, 14, 'sun']],
    props: [
      ['keep_decor/keep_rack', 6, 4], ['keep_decor/keep_rack', 9, 4], ['keep_decor/keep_rack', 12, 4], ['keep_decor/keep_rack', 27, 4], ['keep_decor/keep_rack', 30, 4], ['keep_decor/keep_rack', 33, 4],
      ['castle_decor/book_pile', 6, 6, false], ['castle_decor/book_pile', 33, 7, false], ['castle_decor/book_pile', 13, 6, false],
      ['castle_decor/table', 6, 11], ['castle_decor/table', 8, 11], ['castle_decor/table', 6, 18], ['castle_decor/table', 8, 18],
      ['castle_decor/table', 31, 11], ['castle_decor/table', 33, 11], ['castle_decor/table', 31, 18], ['castle_decor/table', 33, 18],
      ['castle_decor/book_pile', 7, 13, false], ['castle_decor/book_pile', 32, 20, false], ['castle_art/pedestal_flame', 10, 11], ['castle_art/pedestal_flame', 29, 18],
      ['castle_decor/rubble', 29, 7, false], ['castle_props/crate_stack', 34, 24], ['castle_decor/rubble', 5, 24, false],
    ],
  },
  // A12 THE CROWNED CROSSING: four ways meeting, the crown runners crossing at the great sun in the middle; candles and
  // braziers in the north corners, candles and pillars in the south; in from the south, west to the Ember Crucible,
  // north to the Overseer's Foundry
  a38: {
    page: 'rooms/21_crowned_crossing.png', w: 40, h: 32, at: [604, 208],
    floor: [[3, 2, 36, 28], [16, 0, 22, 1], [16, 29, 22, 31], [0, 13, 2, 17], [37, 13, 39, 17]],
    doors: { 37: [19, 31, 'S'], 39: [0, 15, 'W'], 41: [19, 0, 'N'], 54: [39, 15, 'E'] },
    runners: [['ns', 19, 0, 31, 'crown'], ['ew', 15, 0, 16, 'crown'], ['ew', 15, 22, 39, 'crown']],
    emblems: [[19, 15, 'sun']],
    props: [
      ['castle_art/pedestal_flame', 5, 5], ['castle_art/brazier_gold', 9, 4], ['castle_art/brazier_gold', 29, 4], ['castle_art/pedestal_flame', 34, 5],
      ['castle_art/pedestal_flame', 5, 25], ['keep_decor/keep_pillar', 10, 24], ['keep_decor/keep_pillar', 29, 24], ['castle_art/pedestal_flame', 34, 25],
      ['castle_decor/rubble', 12, 8, false], ['castle_decor/rubble', 27, 21, false],
    ],
  },
  // A4 THE SPIRAL KEEP: a tower's well, the great stair winding round it down to the landing in the middle; a brazier in
  // each corner; doors west and east
  a43: {
    page: 'rooms/13_spiral_keep.png', w: 36, h: 34, at: [448, 152],
    floor: [[3, 3, 32, 30], [0, 23, 2, 27], [33, 23, 35, 27]],
    doors: { 44: [0, 25, 'W'], 42: [35, 25, 'E'] },
    spiral: [17, 16, 4, 11],
    props: [['castle_art/brazier_gold', 6, 5], ['castle_art/brazier_gold', 29, 5], ['castle_art/brazier_gold', 6, 28], ['castle_art/brazier_gold', 29, 28], ['castle_decor/rubble', 27, 10, false], ['castle_decor/rubble', 8, 20, false]],
  },
  // A11 THE BELL HALL: the great bell hung from its beam at the head of the hall, its two ropes down to the floor (the
  // Entrance Seal is opened there); knights in stone with their swords either side, candles at their feet, red banners,
  // a sigil worn into the floor, braziers at the foot; doors west (to Ashkar) and east
  a45: {
    page: 'rooms/20_bell_hall.png', w: 40, h: 30, at: [402, 92],
    floor: [[3, 3, 36, 24], [13, 25, 26, 26], [16, 27, 23, 29], [0, 7, 2, 11], [37, 7, 39, 11]],
    doors: { 46: [0, 9, 'W'], 44: [39, 9, 'E'], 58: [19, 29, 'S'] },
    rings: [[19, 17]],
    mechs: { seal45: [19, 11] },
    props: [
      ['castle_props/bell', 19, 7], ['castle_decor/chain_post', 13, 11], ['castle_decor/chain_post', 26, 11],
      ['castle_art/statue_knight', 6, 7], ['castle_art/statue_knight', 33, 7], ['castle_art/pedestal_flame', 6, 11], ['castle_art/pedestal_flame', 33, 11],
      ['castle_art/banner_crown', 9, 3, false], ['castle_art/banner_crown', 30, 3, false], ['castle_art/banner_crown_torn', 12, 3, false], ['castle_art/banner_crown_torn', 27, 3, false],
      ['castle_art/brazier_gold', 11, 21], ['castle_art/brazier_gold', 28, 21], ['castle_decor/rubble', 34, 22, false],
    ],
  },
  // A15 THE OVERLOOK: the great arched window over the burning country, where the Great Sun Gate stands; a balustrade
  // either side of it, sun banners, braziers at the foot; in from the west
  a47: {
    page: 'rooms/24_overlook.png', w: 34, h: 26, at: [340, 34],
    floor: [[3, 2, 30, 21], [0, 8, 2, 12], [31, 8, 33, 12]],
    doors: { 46: [0, 10, 'W'] },
    props: [
      ['castle_art/banner_sun', 5, 3, false], ['castle_art/banner_sun', 28, 3, false],
      ['keep_decor/keep_rail', 7, 7, false], ['keep_decor/keep_rail', 9, 7, false], ['keep_decor/keep_rail', 11, 7, false], ['keep_decor/keep_rail', 22, 7, false], ['keep_decor/keep_rail', 24, 7, false], ['keep_decor/keep_rail', 26, 7, false],
      ['castle_art/brazier_gold', 7, 19], ['castle_art/brazier_gold', 26, 19],
    ],
  },
  // 04 THE HOLLOW JARLS' COURT: in at the foot through the gate tower; the court an octagon, the great sigil in its
  // middle where the four runners meet; a ritual platform of purple fires either side; broken columns about it, braziers
  // at its corners; the two Jarls in stone on their thrones either side of the sealed gate north, cursed banners beside
  a26: {
    page: 'rooms/04_hollow_jarl_courtyard.png', w: 52, h: 50,
    floor: [[22, 0, 29, 10], [8, 6, 13, 10], [38, 6, 43, 10], [3, 11, 48, 42], [22, 43, 29, 49]],
    cut: [[3, 11, 6, 14], [45, 11, 48, 14], [3, 15, 4, 16], [47, 15, 48, 16], [3, 39, 6, 42], [45, 39, 48, 42], [3, 37, 4, 38], [47, 37, 48, 38]],
    doors: { 25: [25, 49, 'S'], 27: [25, 0, 'N'] },
    dais: [[7, 17, 14, 24], [37, 17, 44, 24]],
    rings: [[10, 20], [41, 20], [25, 27]],
    runners: [['ns', 25, 1, 24, 'crown'], ['ns', 25, 30, 48, 'crown'], ['ew', 27, 5, 22, 'crown'], ['ew', 27, 28, 46, 'crown']],
    props: [
      ['castle_art/statue_king', 16, 11], ['castle_art/statue_king', 35, 11], ['castle_props/brazier_large', 19, 12], ['castle_props/brazier_large', 32, 12],
      ['castle_art/banner_cursed', 10, 6, false], ['castle_art/banner_cursed', 41, 6, false], ['castle_art/banner_cursed_torn', 5, 15, false], ['castle_art/banner_cursed_torn', 46, 15, false],
      ['castle_art/brazier_purple', 7, 17], ['castle_art/brazier_purple', 14, 17], ['castle_art/brazier_purple', 7, 24], ['castle_art/brazier_purple', 14, 24],
      ['castle_art/brazier_purple', 37, 17], ['castle_art/brazier_purple', 44, 17], ['castle_art/brazier_purple', 37, 24], ['castle_art/brazier_purple', 44, 24],
      ['castle_decor/collapsed_pillar', 16, 16], ['castle_decor/collapsed_pillar', 36, 14], ['castle_decor/collapsed_pillar', 15, 33], ['castle_decor/collapsed_pillar', 36, 33], ['castle_decor/collapsed_pillar', 20, 39], ['castle_decor/collapsed_pillar', 31, 39],
      ['castle_art/brazier_gold', 10, 36], ['castle_art/brazier_gold', 41, 36],
      ['castle_decor/rubble', 12, 13, false], ['castle_decor/rubble', 39, 13, false], ['castle_decor/rubble', 13, 31, false], ['castle_decor/rubble', 38, 32, false],
      ['castle_art/banner_crown', 16, 42, false], ['castle_art/banner_crown', 35, 42, false], ['keep_decor/keep_pylon', 22, 44], ['keep_decor/keep_pylon', 29, 44],
    ],
  },
  // 01 THE BARBICAN GATEHOUSE: in from the drawbridge at the foot, up a lantern-lit approach to the inner gate, into the
  // yard; the knight's alcove west, the hooded statue's east, barricades thrown across; out north between the two
  // towers under their statues, the runner straight from the inner gate to the portcullis. Lava runs down outside the
  // west wall
  a24: {
    page: 'rooms/01_barbican_gatehouse.png', w: 40, h: 44, at: [636, 362],
    floor: [[17, 0, 21, 8], [3, 6, 9, 8], [29, 6, 36, 8], [3, 9, 36, 24], [17, 25, 21, 27], [12, 28, 27, 34], [15, 35, 23, 43]],
    cut: [[3, 6, 5, 7], [3, 9, 11, 12], [29, 9, 36, 14]],
    lava: [[0, 26, 2, 30], [1, 31, 4, 34], [3, 35, 7, 38], [6, 39, 10, 42]],
    doors: { 23: [19, 43, 'S'], 25: [19, 0, 'N'] },
    runners: [['ns', 19, 1, 24, 'crown'], ['ns', 19, 28, 42, 'crown']],
    emblems: [[19, 16, 'sun'], [19, 37, 'sun']],
    props: [
      ['castle_art/statue_king', 12, 9], ['castle_art/statue_king', 27, 9], ['castle_art/banner_crown', 14, 9, false], ['castle_art/banner_crown', 24, 9, false],
      ['castle_art/banner_crown_torn', 31, 6, false], ['castle_props/brazier_large', 34, 8],
      ['castle_art/banner_crown', 3, 13, false], ['castle_art/brazier_gold', 5, 13], ['castle_art/statue_knight', 7, 13], ['castle_art/brazier_gold', 9, 13], ['castle_art/banner_sun', 11, 13, false],
      ['castle_art/banner_sun', 28, 15, false], ['castle_art/brazier_gold', 30, 15], ['castle_art/statue_monk', 32, 15], ['castle_art/brazier_gold', 34, 15],
      ['castle_decor/barricade', 12, 20], ['castle_decor/barricade', 26, 18],
      ['castle_decor/rubble', 7, 8, false], ['castle_decor/rubble', 24, 13, false], ['castle_decor/rubble', 31, 21, false], ['castle_decor/rubble', 7, 22, false],
      ['keep_decor/keep_pylon', 16, 24], ['keep_decor/keep_pylon', 22, 24], ['keep_decor/keep_pylon', 16, 28], ['keep_decor/keep_pylon', 22, 28],
      ['castle_art/banner_crown', 13, 28, false], ['castle_art/banner_crown', 25, 28, false],
      ['castle_art/deadwood_mid', 26, 31], ['castle_props/ash_shrub', 13, 33, false], ['castle_art/shrub_small', 24, 34, false],
      ['keep_decor/keep_pylon', 15, 41], ['keep_decor/keep_pylon', 23, 41],
    ],
  },
  // 05 THE HALL OF HOLLOW BANNERS: in at the foot between lantern pillars, the sun runner straight up the hall to the
  // sealed gate between two towers hung with the great cursed banners; the crowned queen's alcove west, the hooded
  // priest's east, a ritual ring of purple fires on the east side, broken columns and rubble about the floor
  a25: {
    page: 'rooms/05_hall_of_hollow_banners.png', w: 40, h: 40, at: [556, 358],
    floor: [[17, 0, 21, 9], [4, 6, 9, 9], [4, 10, 35, 30], [8, 31, 31, 35], [15, 36, 23, 39]],
    cut: [[4, 12, 11, 15], [28, 10, 35, 12]],
    doors: { 24: [19, 39, 'S'], 26: [19, 0, 'N'] },
    runners: [['ns', 19, 1, 38, 'sun']],
    emblems: [[19, 17, 'sun'], [19, 30, 'sun']],
    props: [
      ['castle_art/banner_cursed', 13, 10, false], ['castle_art/banner_cursed', 25, 10, false], ['castle_art/brazier_purple', 16, 10], ['castle_art/brazier_purple', 22, 10],
      ['castle_art/banner_crown', 4, 16, false], ['castle_art/brazier_gold', 6, 16], ['castle_art/statue_queen', 8, 16], ['castle_art/brazier_gold', 10, 16], ['castle_art/banner_crown', 12, 16, false],
      ['castle_art/brazier_gold', 29, 13], ['castle_art/statue_priest', 32, 13], ['castle_art/brazier_gold', 34, 13],
      ['castle_art/brazier_purple', 27, 18], ['castle_art/brazier_purple', 34, 18], ['castle_art/brazier_purple', 27, 24], ['castle_art/brazier_purple', 34, 24], ['keep_decor/keep_ritual', 30, 21, false],
      ['castle_decor/collapsed_pillar', 25, 13], ['castle_decor/collapsed_pillar', 11, 22], ['castle_decor/collapsed_pillar', 25, 28],
      ['castle_decor/rubble', 8, 10, false], ['castle_decor/rubble', 23, 14, false], ['castle_decor/rubble', 13, 24, false], ['castle_decor/rubble', 27, 29, false],
      ['castle_art/brazier_gold', 15, 23], ['castle_art/brazier_gold', 23, 23],
      ['castle_art/banner_crown', 9, 31, false], ['castle_art/banner_crown', 30, 31, false],
      ['keep_decor/keep_pylon', 15, 37], ['keep_decor/keep_pylon', 23, 37],
    ],
  },
};
