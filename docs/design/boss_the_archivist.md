# The Archivist (the Frozen Scriptorium)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/the_archivist.js`; art `tools/build_the_archivist.py`). It is the
third of the older bosses to be redesigned.

**From the scriptorium's marginalia:** "Every word ever spoken in the realm is kept here, frozen into pages." "It copies
everything, even itself. Strike the copy and the original laughs." "Write your name in the margin. It is the only thing
it will never be able to shelve."

## The Index (its signature)
- The room is split into aisles about three tiles wide (4 to 8 columns, 3 to 6 rows). Every crossing wears its
  reference on the floor, a letter and a numeral ("C·IV"), so you can always read the square you're in.
- It calls references ("Volume C, shelf IV!"). After 1.5 s, that whole row and that whole column burst; the lanes are
  marked first, and the called labels glow gold.
- It calls 1 reference in phase I, 2 in phase II and 3 in phase III. Some calls look up the square you're standing in.

## Recitation
- It reads a line aloud (shown in quotes), and the sentence crosses the room as a wall of frozen ink glyphs. The gaps
  are the spaces between the words, each three letters wide.
- Lines that are too long for the room lose their last words. The wall reads in from either side, and in later
  phases from the top or bottom too.

## Phase I: The Catalogue Opens
The index, recitations, and fans of pages flung at you.

## Phase II: Errata
- A copy stands a quarter of the way across the room, on the side away from it. The copy is the same body and the same
  name, but written backwards ("tsivihcrA ehT"). Neither shows a Life bar.
- Hit the copy and the original laughs: "HA HA HA", a ring of ink, and it heals 0.6% of its Life (at most once every
  0.6 s). The copy reads too, throwing ink at you.
- Every 9 s they trade places in a flurry of pages: read the names again.

## Phase III: The Final Chapter
The copy is gone. Footnotes pin to the floor where each player stands every 2.8 s and burst into ice needles. It
calls three references at a time, and recitations come from any side.

## Last: The Last Chapter (at 10%)
- Recitations keep coming. Gold quills appear one after another in the margins, near the walls, and each lasts 3.6 s.
  Reach one to sign: SIGNED.
- Sign all three: "Your name is in the margin. It can never shelve you." The finale ends there.
- Miss one: SHELVED. The ice closes in a burst under every player.

## Multiplayer
The server runs the calls, the copy, the swaps and the quills. Players' positions on the server decide who signs.
The called references, the copy and the quill's place are plain values the browsers draw.

## Numbers
34,000 Life, 24 DEF, 9,000 XP. Shots deal 50 to 72 damage. Its loot is the Archivist's old table (`DUNGEON_BOSSES.the_archivist.loot`).
