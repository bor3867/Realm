# The Abyssal Kraken (realm event, the Drowned Shore)

## Where and when
- A realm event, rolled about every 15–25 minutes of realm time when none is alive (and never in the first
  5 minutes): "The Abyssal Kraken rises off the coast!" Marked on the minimap like the realm bosses.
- **Arena: a ring of shallows around deep water**, raised out of the sea a little way off the Drowned Shore. The
  Kraken sits in the deep pool at the centre (radius 4: you can't wade in, but shots fly over water). Around it, a
  ring of shallows (to radius 11) where you fight, wading (shallows slow you, so dodging is about reading early).
  A shallows causeway joins the ring to the nearest beach. The ring stays after the fight: the Kraken's reef, and
  the next Kraken rises in the same pool.
- It wakes when you step onto the ring. Realm events don't lock their arenas.
- Its frames have sea water baked into the bottom band; it sits on the deep pool's own bundle water tile, so the
  band blends. It only ever moves within the pool.

## Numbers
32,000 Life, Defense 18. Damage 45–60 per shot (a shore event that the whole realm comes to). Phases at 66% / 33%.

## Phase 1 — Surfaced (it lurks in the pool, swaying)
1. **Ink lob**: three `ink_blob`s arc to where you stand and just around it (marked on the water as they fly). One
   that lands on you splashes ink across your view for 1.6 s: dark blots over the screen, not full darkness — you
   can still see the shots, barely. Its own mechanic: vision, not damage over time.
2. **Twin tentacle streams**: two `water_bolt` streams, one from each side of its body, wobbling, 10 shots each.
3. **Breach ring**: a ring of 20 `water_bolt`s with a 3-shot gap, rotating each time.

## Phase 2 — Enraged
1. **Barbed tentacles**: four arms of six `barbed_hook`s each, one arm per quarter. Every hook in an arm leaves at
   a different speed on the same heading and they all curve the same way, so each arm draws a sweeping, bending
   line, like a tentacle lashing across the shallows. Step between two arms.
2. **Whirlpool**: a `whirlpool` (drawn large) leaves the pool and drifts toward you for 7 s. Inside its circle the
   current drags at you (you move at 55%), and every 0.6 s it throws out four spray bolts that curve with its spin.
   It doesn't pull you: drift with your feet, not with the water. At most two at once.
3. **Ink lob** returns, four blobs.

## Phase 3 — Leviathan
1. **Lures and chain lightning**: four `glow_orb` lures float out and hang in the shallows around you. A faint
   flickering line joins the Kraken to the first lure, the first to the second, and so on (0.9 s). Then
   `abyss_lightning` crackles down every link at once, a line of bolts racing along each segment. Stand clear of
   the lines between the lights. Lures burst into a small ring when the lightning has passed.
2. **Barbed tentacles**, six arms now, faster.
3. **Deep breach**: two rings of 22 bolts 0.25 s apart, gaps offset, so you thread one gap and then the next.

## Death
The death clip sinks it; the loot fountain follows; the pool stays.

## Loot
- Themed (boss tier): **Tidebreaker Trident** (staff: three piercing tines in a tight fan) and **Abyssal Pearl**
  (ring: Life, Mana, Wisdom).
- Legendary, phase-3 kill only: **The Leviathan Eye** (ring: Attack, Dexterity and Life; 15% crits for double,
  and a little Mana back on every hit). 1.5%.
- Plus the shore's best regular rolls.

## Unique to it
Ink that blots your view; arms of hooks that bend as they fly; a drifting whirlpool that drags and sprays; lures
joined by chain lightning. None of these is used by another boss.

## Result (built)
- `src/bosses/abyssal_kraken.js` (data and its own specials), `src/realmevents.js` (the clock, the reef, `/kraken`).
- Shots now fly over open water everywhere (`shotBlocked` in maps.js): water and deep water stop feet, not shots.
  Without that the Kraken couldn't be hit in its pool; it's also how RotMG's sea works.
- Lobs gained an `onLand` hook (the ink) and a shard sprite of their own (the Treant's embers); registry lobs draw
  their landing mark and arc. A whirlpool's drag sets `p.dragUntil` (55% speed).
- Checked (`tools/check_events.mjs`): all 9 patterns, ink, whirlpool and drag, lures and the chain all happen.
- Seen in the browser: the reef (pool, ring, causeway), the arms bending, the whirlpool spraying, the lures' links
  flickering and then the lightning running them, the ink blots.
- Tuned after looking: the causeway was cutting a notch through the pool (it now stops at the ring); ink blots
  0.86 → 0.78 opacity so shots still show through.
