# Abbot Morrow, the Drowned (the Sunken Chapel)

Rebuilt on the three-phase engine on 2026-10-21 (`src/bosses/drowned_abbot.js`; art `tools/build_drowned_abbot.py`). This is the
first of the older bosses to be redesigned one at a time, each with mechanics of its own.

**From the chapel's own hymnal:** "Abbot Morrow told us to keep singing." "He never could stand the noise." "The bells
still ring at the hour of Mass." "Do not let him finish the sermon."

## The Sermon (his signature)
- Every 20 s (phase I), 17 s (II) or 14 s (III), he begins a verse: a quoted line, and a bar over his head that fills
  over 7.5 / 7 / 6.5 s. Pips over the bar show how many bells the verse wants.
- **Four drowned bells** hang in the corners of the nave, each moved in toward the middle until it hangs over open floor.
  They are rooted, harmless and never break; a blow on one rings it (520 damage in a verse rings it).
- **Ring enough bells** (2 in phases I and II, 3 in III) before the verse ends: SILENCED. He staggers for 3 s.
- **Let him finish:** "AMEN." The tide comes in from all four walls, three waves, each wall with one gap.
- The bells don't shield or ward him; they're something you use (no guarded monsters).

## Phase I: The Sermon Begins
- The censer swung: embers out in an arc, one after another across it (two speeds).
- The crozier: rings of bell-pearls, each ring turned half a step from the last.
- The reading: pages at you, three at a time, in waves.

## Phase II: The Water Rises
- The nave floods from the back. The water line rises to just short of the middle, falls back, and rises again. It only
  covers floor. In the water you're slowed; this is felt in your own browser, and the line is the same for everyone.
- Bubbles rise off the flood.
- The surge: a wave from the flood's edge up the nave, with one gap.
- The baptism: marked splashes where each player stands, and round them.

## Phase III: Mass for the Drowned
- He floats, with a pale halo behind his mitre.
- The stained glass: light falls through the windows in coloured lanes down the nave. They are marked first, then burn.
  Two lanes side by side are always left dark.
- The bells toll on their own: a ring of sound out of one bell, with a gap.
- Verses come faster and want three bells.

## Last: The Last Verse (at 10%)
He begins the last verse. Ring all four bells in 9.5 s, while bubbles rise off the flood.

## Multiplayer
- The server runs him and the bells. Every player's blows ring the same bells, through the server's own damage
  checks.
- The verse, the bells that are rung and the water line are plain values on him and the bells, so every browser
  shows the same state.

## Numbers
16,000 Life, 8 DEF, 2,600 XP. Shots deal 44 to 72 damage. His loot is the Drowned Abbot's old table (`DUNGEON_BOSSES.drowned_abbot.loot`).
