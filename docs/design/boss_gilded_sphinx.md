# The Gilded Sphinx (Sandscour Tomb)

## Arena: the Sanctum
40×40, square, stone. A raised dais in the middle (a ring of tomb floor), four obelisks at its corners (they block
shots: cover for you), sand drifted along the walls. The doors lock when you enter. It sits on the dais's north.

## Numbers
70,000 Life, Defense 10, 4,600 XP (the first-ring dungeon). Shots 55–75. Phases at 66% / 33%.

## Phase 1 — Guardian (it sits)
1. **Crescent sweep**: two fans of `sand_crescent` (seven, then six offset a beat later); every other crescent
   curves the opposite way, so the two fans cross into a lattice of arcs. Find a diamond and stand in it.
2. **The riddle**: six `riddle_glyph`s drift out slowly in a wide fan, stop where they are, and hang, glowing,
   for a heartbeat; then each one darts at wherever you are at that moment. Move just as they flash.

## Phase 2 — Ascendant (its wings open and it floats)
1. **Sunbursts**: rings of `sun_disk`s that wheel as they spread (each disk curves the same way), two rings 0.4 s
   apart turning opposite ways: pinwheels. Step through where the two rings cross.
2. **Feather fans**: three fans of `gilded_feather` aimed at you, each narrower and faster than the last; the
   last is nearly a spear.
Between patterns it glides from one obelisk to the next round the dais.

## Phase 3 — Sandstorm Pharaoh (it lands at the centre; the storm rises)
For the whole phase a **sandstorm** fills the sanctum: a sand-coloured haze over everything more than 7 tiles from
you, and streaks of sand blowing across the screen. You can still see what is close.
1. **Dust devils**: three `dust_devil`s rise from the sand at the walls and wander the sanctum for 8 s (each picks
   a new heading every second, drawn to you a little). Touching one hurts and throws you sideways.
2. **Scarab swarm**: the sand bursts at a spot near you (a puff, 0.5 s), and eight `cursed_scarab`s pour out and
   chase you, each with its own wobble, for 2.5 s.
3. **Crescent sweep** returns, quicker.

## Death
The death clip; the storm settles; the loot fountain; the doors open; a portal home.

## Loot
Themed (boss tier): Sunscorch Khopesh (sword: burning cuts), Gilded Scepter (wand: golden bolts that pierce),
Embalmer's Wraps (robe: Defense, Wisdom), Scarab Ring (Dexterity, Speed), and the Sphinx Helm, which has no helm
slot to go in here and so is an ability: a seal that crowns you in gold (armored, a burst of sand crescents).
Legendary (phase-3 kill, 2%): **Pharaoh's Deathmask** (ring: everything +2, and every kill heals you). Plus T5–T8 gear.

## Unique to it
Crossing fans of curved crescents; riddle glyphs that hang and then dart at you; pinwheel sunbursts; feather fans
that narrow to a spear; the sandstorm haze; wandering dust devils that throw you; scarabs bursting from the sand.
None is used by another boss.

## Result (built)
- `src/bosses/gilded_sphinx.js` (it replaces the framework test as the Sphinx; the test boss stays, admin only).
  Checked in the sanctum (`tools/check_sandscour.mjs`): all 7 patterns; the crescents cross, the riddle glyphs hang
  and dart, the sunbursts wheel, the feathers narrow, it perches round the dais, the storm rises, the devils wander
  and throw you, the scarabs pour out.
- Seen in the browser: the crossing crescents, the glyph line, the pinwheels, the Sandstorm Pharaoh in its haze, the
  dust devils (first drawn as three rotated, stacked copies that looked like tumbling slabs; now one upright funnel
  that sways while its own frames spin it).
- Its riddle glyphs are the only hover-then-dart shot: Mother Mycelia's toxic orbs, which had borrowed it, now curl
  outward instead.
