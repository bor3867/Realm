# The Fallen Star (Godfall's event boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/the_fallen_star.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).
**Its sprite is its original one** (the `realm_bosses` sheet, with the remaster's later phases, morphs and death), drawn from the new engine's state (src/render.js `realmBossOld`). The user asked to keep the overworld bosses' sprites (2026-10-22); its frames in `art/bundle/last` only pace the engine's animation clips.

A burning star with a crater for an eye.

- **Constellations (its signature):** it lays star-mines round you (real monsters, 1,400 Life) and joins them in order with burning lines, marked and then burning, again and again. Shoot a mine and the lines through it go out.
- **I It Falls:** scattered embers, a comet run at you along a marked line.
- **II It Burns Brighter:** flares (the old Starflare daze still comes), bigger constellations.
- **III Supernova:** rings of flares; constellations come faster.
- **Last: Supernova:** fresh mines fall round it. When it bursts (after 8.5 s), only a mine's shadow is safe: put a mine between you and the star. The shadows are drawn, and checked in your own browser.

## Numbers
60,000 Life (x1.1 in the realm), 20 DEF.
