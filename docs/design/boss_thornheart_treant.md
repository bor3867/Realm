# The Thornheart Treant (realm event, the Thornwood)

## Where and when
- A realm event, rolled about every 15–25 minutes of realm time when none is alive (not in the first 5 minutes):
  "The Thornheart Treant wakes deep in the Thornwood!" Marked on the minimap.
- **Arena: a clearing ringed by trees**, deep in the Thornwood (as far from its edge as can be found). The clearing
  is radius 11 of forest floor and leaf litter, cleared of everything; a ring of elder trees at radius 12–13 with
  four gaps (the ways in, roughly north, south, east and west). The clearing stays after the fight, and the next
  Treant wakes in it.
- It wakes when you step into the clearing. Realm events don't lock their arenas.

## Numbers
26,000 Life, Defense 16. Damage 40–55 per shot. Phases at 66% / 33%.

## Phase 1 — Ancient (rooted at the centre)
1. **Seedfall**: three seeds drop around you; a ring of green marks shows where (0.8 s), then each bursts into a
   ring of 8 `thorn_seed`s. The marks follow where you *were*, so keep moving.
2. **Leaf spiral**: four arms of `leaf_blade` turning for 1.8 s, every blade curving as it flies, like leaves on a
   wind. The spiral is slow enough to walk through the gaps.
3. **Bark fan**: a fan of 7 `thorn_seed`s aimed at you, then another offset by half a gap.

## Phase 2 — Autumn (it walks slowly after you)
1. **Falling fire**: from the north edge of the clearing, a curtain of 14 `burning_leaf`s with a 3-leaf gap
   drifts down across it, each leaf swaying side to side as it falls. Slow, wide, readable; the gap sways too.
2. **Acorn bombs**: three `acorn_bomb`s lobbed at you (marked as they arc); each bursts on landing into six
   `burning_leaf` embers.
3. **Seedfall** returns, four seeds.

## Phase 3 — Withered (it returns to the centre and stays)
1. **Pincer**: two walls of `corrupted_thorn` close in at once from the east and west edges of the clearing,
   each with its own gap at a different height. Find the gap in the near wall, then the far one.
2. **Blight wisps**: five `blight_wisp`s come out of the ring of trees (not from the Treant) and seek you for
   3 s, turning slowly, then wither away. Kite them in a circle.
3. **Leaf spiral**, faster, five arms.

## Death
The death clip; the loot fountain; the clearing stays.

## Loot
- Themed (boss tier): **Heartwood Bow** (three arrows that pierce, a touch of homing) and **Seed of Renewal**
  (ring: Life and Vitality; heals you when you are low).
- Legendary, phase-3 kill only: **The Blight Heart** (ring: Attack and Dexterity; your kills burst into thorns).
  1.5%.
- Plus the Thornwood's best regular rolls.

## Unique to it
Seeds that mark the ground and burst; burning leaves that sway as they fall; acorn bombs that burst into embers;
thorn walls closing from both sides at once; wisps born from the trees around you. Nothing here is shared.

## Result (built)
- `src/bosses/thornheart_treant.js`, its clearing in `src/realmevents.js` (`/treant`).
- Checked (`tools/check_events.mjs`): all 9 patterns; seed marks burst, acorns land and throw embers, the pincer
  closes from both sides, wisps come from the trees.
- Seen in the browser: the clearing and its ring of elders with four ways in, each phase's form, the falling fire,
  the acorns, the pincer, the wisps.
- Tuned after looking: the seed marks were a faint dotted ring; now a soft patch of ground with a bold ring
  tightening onto it and a pip at the centre.
