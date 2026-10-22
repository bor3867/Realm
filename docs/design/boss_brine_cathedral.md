# The Brine Cathedral (the shore's realm boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/brine_cathedral.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).
**Its sprite is its original one** (the `realm_bosses` sheet, with the remaster's later phases, morphs and death), drawn from the new engine's state (src/render.js `realmBossOld`). The user asked to keep the overworld bosses' sprites (2026-10-22); its frames in `art/bundle/last` only pace the engine's animation clips.

A hermit crab wearing a drowned chapel for a shell. "Enter. Pray. Drown."

- **The Doors (its signature):** only its front can be hurt. A blow lands if the player who struck it stands within 60° of where its doors face; otherwise the blow glances off the SHELL. A pale wedge on the sand shows the front. It turns slowly (0.7 rad a second) toward the nearest of you; from phase II it turns away from them, so circle it or split up. (On the server the striker is known, so this holds for a group.)
- **I The Bells Toll:** rings from the bell (with a gap), claw snaps, bubbles at your feet.
- **II The Doors Close:** the tide calls from the shore side, a wall with one gap.
- **III The Cathedral Floods:** rings of bubbles from every window.
- **Last: Last Rites:** it buries into the sand (immune) and the bell tolls three times: three great rings, one gap each.

## Numbers
7,000 Life (x2.2 in the realm, from owbosses.js), 4 DEF. The overworld extras (adds, the undertow) still come.
