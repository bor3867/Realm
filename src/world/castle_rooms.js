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
      ['castle_decor/rubble', 2, 14, false], ['castle_decor/rubble', 15, 15, false], ['castle_decor/rubble', 4, 27, false], ['castle_decor/rubble', 44, 15, false],
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
    runners: [['ns', 19, 15, 22, 'sun']],
    mechs: { clampL: [8, 10], clampR: [32, 20] },
    props: [
      ['castle_decor/chain_post', 15, 2], ['castle_decor/chain_post', 24, 2], ['castle_art/brazier_gold', 15, 7], ['castle_art/brazier_gold', 24, 7],
      ['castle_art/banner_sun', 6, 8, false], ['castle_art/banner_crown', 30, 8, false],
      ['keep_decor/keep_lever', 17, 15], ['keep_decor/keep_lever', 19, 15], ['keep_decor/keep_lever', 21, 15], ['castle_art/brazier_gold', 16, 14], ['castle_art/brazier_gold', 23, 14],
      ['keep_decor/keep_wheel', 7, 18], ['castle_decor/gear', 11, 15], ['keep_decor/keep_wheel', 30, 15],
      ['keep_decor/keep_rail', 3, 12, false], ['keep_decor/keep_rail', 12, 12, false], ['keep_decor/keep_rail', 27, 22, false], ['keep_decor/keep_rail', 36, 22, false],
      ['castle_decor/rubble', 4, 8, false], ['castle_decor/rubble', 30, 25, false], ['castle_decor/rubble', 8, 28, false], ['castle_decor/rubble', 22, 36, false],
      ['castle_decor/chain_anchor', 16, 32], ['castle_decor/chain_anchor', 23, 32], ['castle_art/brazier_gold', 14, 34], ['castle_art/brazier_gold', 25, 34],
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
    runners: [['ns', 25, 1, 21, 'crown'], ['ns', 25, 33, 48, 'crown'], ['ew', 27, 5, 19, 'crown'], ['ew', 27, 31, 46, 'crown']],
    props: [
      ['castle_art/statue_king', 16, 10], ['castle_art/statue_king', 35, 10], ['castle_art/brazier_gold', 19, 12], ['castle_art/brazier_gold', 32, 12],
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
      ['castle_art/statue_king', 11, 9], ['castle_art/statue_king', 27, 9], ['castle_art/banner_crown', 14, 9, false], ['castle_art/banner_crown', 24, 9, false],
      ['castle_art/banner_crown_torn', 31, 6, false], ['castle_art/brazier_gold', 34, 8],
      ['castle_art/banner_crown', 3, 13, false], ['castle_art/brazier_gold', 5, 13], ['castle_art/statue_knight', 7, 13], ['castle_art/brazier_gold', 9, 13], ['castle_art/banner_sun', 11, 13, false],
      ['castle_art/banner_sun', 28, 15, false], ['castle_art/brazier_gold', 30, 15], ['castle_art/statue_monk', 32, 15], ['castle_art/brazier_gold', 34, 15],
      ['castle_decor/barricade', 12, 20], ['castle_decor/barricade', 26, 18],
      ['castle_decor/rubble', 7, 8, false], ['castle_decor/rubble', 24, 13, false], ['castle_decor/rubble', 31, 21, false], ['castle_decor/rubble', 7, 22, false],
      ['keep_decor/keep_pylon', 16, 24], ['keep_decor/keep_pylon', 22, 24], ['keep_decor/keep_pylon', 16, 28], ['keep_decor/keep_pylon', 22, 28],
      ['castle_art/banner_crown', 13, 28, false], ['castle_art/banner_crown', 25, 28, false],
      ['castle_art/deadwood_mid', 26, 31], ['castle_art/shrub_mid', 13, 33, false], ['castle_art/shrub_small', 24, 34, false],
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
