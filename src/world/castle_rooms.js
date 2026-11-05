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
export const ROOMS = {
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
