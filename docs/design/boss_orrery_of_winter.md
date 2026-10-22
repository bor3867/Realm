# The Orrery of Winter (Runeholt's realm boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/orrery_of_winter.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).
**Its sprite is its original one** (the `realm_bosses` sheet, with the remaster's later phases, morphs and death), drawn from the new engine's state (src/render.js `realmBossOld`). The user asked to keep the overworld bosses' sprites (2026-10-22); its frames in `art/bundle/last` only pace the engine's animation clips.

"YOUR ORBIT DECAYS. I have calculated your death."

- **The Frost Clock (its signature):** a clock face of twelve wedges round it (11 tiles across), its hand sweeping. Every 2.4 s it chimes, and the wedge under the hand freezes for 7 s (10 s in III). Inside a frozen wedge you're frostbitten. The hand speeds up as it weakens.
- **I The Hour Turns:** snowflake rings shatter outward; its moons line up behind it and fire at you.
- **II The Rings Realign:** two hands, sweeping opposite ways.
- **III Absolute Winter:** wedges stay frozen longer.
- **Last: Absolute Zero:** every wedge freezes but one. The warm wedge moves a step every 2.2 s: stay in it.

## Numbers
26,000 Life (x1.6 in the realm), 18 DEF.
