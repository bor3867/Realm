# The Wick-Mother (the fen's realm boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/wick_mother.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).
**Its sprite is its original one** (the `realm_bosses` sheet, with the remaster's later phases, morphs and death), drawn from the new engine's state (src/render.js `realmBossOld`). The user asked to keep the overworld bosses' sprites (2026-10-22); its frames in `art/bundle/last` only pace the engine's animation clips.

"Come closer, little moth. Burn down with me."

- **She Burns Down (her signature):** the heat round her reaches 2 tiles at full Life and 6.5 near the end (drawn on the ground). Inside it you burn, in your own browser. Her tallow drips leave wax pools that hold your feet.
- **I The Wick Is Lit:** flares (fans of flame) and tallow drips.
- **II The Wick Catches:** the pyre: rings of fire marked round her, further out each time.
- **III Burned to the Bone:** conflagration, a turning spiral.
- **Last: The Last Inch:** four waves of flame roll out, each with gaps.

## Numbers
15,000 Life (x1.7 in the realm), 10 DEF. The overworld extras still come.
