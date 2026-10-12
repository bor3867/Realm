# Projectile art standard (player weapons and abilities)

Every player shot must look like it belongs to the same game: crisp, small, readable, quiet. Shapes, colours and
behaviours vary freely; scale, edges and palette discipline do not. `node tools/audit_shots.mjs` checks the
measurable rules for every weapon.

## 1. Scale and canvas
- 16 art pixels = 1 tile. A shot is drawn at exactly 1:1: one art pixel is one screen pixel. The renderer never
  resizes a player shot (no 0.875x, no 1.3x, no fit-to-size shrinking); the item's `size` sets only gameplay values.
- Authored in a 16x16 cell, pointing right (east), centred on the cell's centre.
- Nothing longer than one tile (16 px).

## 2. Size by weight, not by rarity
| Weight | Examples | Length | Thickness |
|---|---|---|---|
| light | dagger flicks, needles, darts, sparks | 5-9 px | 2-4 px |
| standard | sword cuts, arrows, wand and staff bolts | 8-12 px | 3-6 px |
| heavy | greatswords, hammers, lances, a Mythic or Legendary signature shot | 11-16 px | 4-8 px (round: up to 10) |

A Legendary is not drawn bigger to look important; it is drawn better. Rarity shows in silhouette and behaviour.

## 3. Static art
- One frame. Motion comes from position, rotation, and (rarely) opacity, never from cycling frames.
- Pointed shots turn to their heading. Only round or star-shaped shots may spin, and slowly.

## 4. Edges and palette
- Hard alpha only: every pixel fully opaque or fully clear. No anti-aliasing, no baked glow, no soft trails.
- At most 5 colours including the outline.
- A 1 px outline in the darkest shade of the shot's own hue (never pure black, never white).
- At most one highlight colour, lit from the top-left.
- Tiered shots use their tier's material (rust, iron, bronze, steel ... gold, rune-white). Special shots use their
  origin's palette: the colours of the dungeon or boss they came from.

## 5. Silhouette first
- Every special shot is recognisable in greyscale.
- No two UT, Mythic or Legendary weapons share a sprite or a silhouette. Tiered families share one silhouette that
  grows a little and changes material by tier.

## 6. Effects around shots
- No particle trails behind player shots.
- Impacts: at most 6 pixels of debris, gone within 0.25 s.
- Marks, glyphs and zones on the ground: 1 px lines, at most 45% opacity, in the shot's palette.
- No screen flashes, no shake from player weapons.
- Player shots never carry the dark halo that marks enemy shots; enemies keep it, so the two never read alike.
