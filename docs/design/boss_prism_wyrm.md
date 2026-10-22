# Aurelia, the Prism Wyrm (the Prism Lighthouse)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/prism_wyrm.js`; art `tools/build_hollow_bosses.py`). Her lens
used to work in each player's browser alone. Now the server runs it, so a group shares the same lenses.

**From the lightkeeper's log:** "She cannot be hurt in the dark. Glass hides her. Only the lens, focused, shows her true
body. Stand in it, and pray." "Do not hold the light on her too long. I did. The lighthouse has been white ever since."

## The Lens (her signature)
- Three lens pedestals stand round the lantern room (the dungeon's own). Stand on one and its beam bares her.
- Only while bared can she be hurt. Over her head it reads BARED, otherwise GLASS.
- Each pedestal heats while you hold it (a ring round it fills, turning red near the top). After about 5 s (2.5 s in
  phase III) it overheats: a white flash where it stands (140 damage), and it goes dark for 6 s. Pulse the light
  between pedestals.

## Phase I: The Lantern Turns
White bolts break into fans of every colour. Helixes of light wind out of her. Glass rains down in columns with a
gap.

## Phase II: Prismatic
- Images of her stand round the room (shots can't hurt them).
- A beam that meets an image first burns it instead of baring her; an image held in a beam for 0.9 s burns away.
  The images fire too.

## Phase III: Overcharge
- The lenses heat twice as fast. Bare her for more than 2.2 s at a stretch and she drinks the light and throws back a
  28-shard ring.
- The great lens follows you a step behind (a sunbeam that burns where it lingers on you, in your own browser).

## Last: White Light (at 10%)
- Every lens starts fresh, and in the finale the light lingers 2.5 s after you step off a pedestal.
- Light all three at once and she shatters, losing 5% of her Life; the finale ends early.
- Too slow (about 11.4 s) and the lighthouse turns white: a burst under every player.

## Numbers
130,000 Life (380,000 before the balance pass: a lone player bared her two-thirds of the time and needed over 13 minutes), 36 DEF, 16,000 XP. Her loot is her old table.
