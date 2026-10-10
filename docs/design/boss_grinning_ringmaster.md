# The Grinning Ringmaster (Hollowmoon Carnival)

## Arena: the Big Top
Round, 36×40: a sawdust ring with eight star drums standing round its edge. The doors lock when you step in.

## Numbers
300,000 Life, Defense 32, 15,000 XP. Shots 115–145. Phases at 66% / 33%.

## Phase 1 — Showman (he poses on his star drum)
1. **Card fans**: fans of `playing_card` dealt at you, three in a row, each fan offset half a card.
2. **The leap**: he leaps from his drum to another round the ring's edge (a high arc you can see coming: his shadow
   races ahead to where he'll land), and as he lands a `cane_star` burst rings out from the drum.
3. **Card fans** again from the new drum.

## Phase 2 — Puppeteer (he floats up, working two jester marionettes)
- Two **jester puppets** hang on strings from his hands, either side of the ring, each its own target (9,000 Life):
  they bob and throw `juggling_pin`s that arc (each pin curves the way its puppet faces).
- He fires `string_needle` lines: a straight line of needles at you, then one either side.
- Killing a puppet cuts its strings (it falls in a heap); after 8 s he re-strings it at full Life. While both are
  down, he takes double damage.

## Phase 3 — Big Top (he becomes the tent itself, at the centre)
1. **Confetti bombs**: the grin opens and lobs four `confetti_bomb`s round you; each bursts into confetti and a ring
   of shards.
2. **Pennant darts**: fans of `pennant_dart` from the bunting at the tent's two shoulders, crossing.
3. **The lantern eyes**: his eyes are the weak point. They light for 3 s, then go dark for 3 s, over and over; **while
   they are lit he takes 75% more damage** (they glow, and the bar says LIT).

## Death
The death clip; the tent folds; the loot fountain; the doors open; a portal home.

## Loot
Themed (boss tier, `d2_items`): Ringmaster's Cane (wand: star bolts), Juggler's Dagger (dagger: thrown pins that
come back), Carousel Bow (arrows that circle in), Harlequin Garb (robe: Dexterity, Speed), Ring of the Jester
(Luck: crits), Trick Deck (hex: a fan of cards that curse). Legendary (phase-3 kill, 2%): **The Grinning Mask**
(ring: Attack, Dexterity; your crits hit three times as hard). Plus T9–T11 gear.

## Unique to it
Leaps between drums whose landing rings out a burst (his shadow shows where); two marionettes that are their own
targets, that he re-strings after you cut them, and whose loss leaves him exposed; pins that arc the way their
puppet faces; lines of needles; a tent with lantern eyes that light and go dark as his weak point; confetti bombs;
crossing dart fans from the bunting. None is used by another boss (the Theatre's Maestro, who once had strings,
now uses trapdoors).

## Result (built)
- `src/bosses/grinning_ringmaster.js` (shots from `bx2_shots`). New framework hooks: `dmgMult` (a boss's own weak
  moments) and `barTag` (words on the boss bar: EXPOSED, LIT).
- Checked in the big top (`tools/check_hollowmoon.mjs`): cards, the leap and its landing burst, the jesters on
  their strings, the pins, the stitches, cut strings leaving him EXPOSED and re-stringing after 8 s, the confetti
  bombs, the crossing darts, the eyes lit and dark (lit hits land 1.75x).
- Seen in the browser: the leap, the jesters with their strings, the stitches, the Big Top. The lantern glow was
  first drawn too high and too faint (it hung in the air above the tent); it now blazes in the tent's face.
- Found while testing the whole game: the Trick Deck (a hex) had no curse block and crashed the soak test's
  ability run; it curses for 6 s now, like the hex family.
