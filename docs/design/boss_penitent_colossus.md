# The Penitent Colossus (Godfall's realm boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/penitent_colossus.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).
**Its sprite is its original one** (the `realm_bosses` sheet, with the remaster's later phases, morphs and death), drawn from the new engine's state (src/render.js `realmBossOld`). The user asked to keep the overworld bosses' sprites (2026-10-22); its frames in `art/bundle/last` only pace the engine's animation clips.

A kneeling giant of stone mended with gold. "I REMEMBER EVERY SIN. KNEEL."

- **KNEEL (its signature):** every 14 s (12, then 9) it begins to pray (a warning over it), then KNEEL. While it prays, anyone who moves is lashed, in your own browser. Stand still through it.
- **I It Kneels:** its gaze (gold shards), the seams (gold cracks across the ground, marked then burning), the slam (marked where you stand).
- **II It Remembers Its Crimes:** longer prayers, more seams.
- **III Penance:** it rises; it prays more often.
- **Last: The Hands That Broke a God:** its two great hands fall every 1.6 s, each following one of you.

## Numbers
42,000 Life (x1.3 in the realm), 26 DEF.
