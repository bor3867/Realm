# Queen Melliflua, the Honeyed Mother (the Honeyed Hollow)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/honey_queen.js`; art `tools/build_hollow_bosses.py`). Her old fight
kept its state in the dungeon's own per-map store, which a multiplayer server never sends to browsers. Now the server
runs everything and the browsers draw it from plain values on her.

**From a beekeeper's notes:** "She is the size of a cart and she sang to me. I said I would come back. I came back."
"Careful of the honey on the floor. It holds your boots like a lover."

## The Queen's Song (her signature)
- Every 16 s (phase I), 13 s (II) or 10 s (III) she sings for 4 to 5 s. Her reach (7, 7.5, then 9 tiles) shows as a gold
  ring round her.
- Anyone inside the ring is drawn toward her at 1.7 tiles a second (felt in your own browser). Get out of it.
- Within 2 tiles of her while she sings, her stingers find you. Rings of notes come off her as she sings.

## Phase I: The Queen Rises
- Hex-stings: six-way bursts, three stings to each point.
- The swarm: jittering bees that nose toward you.
- Her brood: 4 cells laid round the room. They are real monsters (600 Life); break them before they hatch (6 s) into
  two workers each.

## Phase II: The Hive Swarms
- Honey rain: marked drops, one on each player and the rest scattered. Each leaves a sticky pool for 8 s that slows
  you to half speed.
- The waggle dance: nectar flies in a figure-eight round her, then away.

## Phase III: The Queen Is Furious
The song reaches further and comes more often, and all of her patterns run faster.

## Last: The Royal Jelly (at 10%)
She seals herself in wax (immune) and lays 7 brood cells that hatch in 10 s. Break every cell and the wax cracks early.

## Numbers
52,000 Life, 6 DEF, 4,500 XP. Her loot is her old table.
