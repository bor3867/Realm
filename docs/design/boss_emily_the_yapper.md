# Emily, the Yapper (Runeholt's event boss)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/emily_the_yapper.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).

"Oh! Hi! Okay so ANYWAY-"

- **She Will Not Be Interrupted (her signature):** while she talks, your blows land at half damage; every few lines she gasps for breath, and for that moment they land at double (her bubble says which). She talks longer and breathes shorter each phase. This is the engine's new per-boss damage multiplier, B.hitScale.
- **I Okay So Anyway:** snowballs, a belly-slide at you along a marked line, fish lobbed over (marked).
- **II Emily Has a LOT to Say:** rings of yaps (the old Yap-yap-yap confusion still comes from owbosses.js).
- **III She Will Not Be Interrupted:** a tiny crown; she barely breathes.
- **Last: The Monologue:** ten seconds straight: yaps in a turning spiral, and her lines in bubbles.

## Numbers
20,000 Life (x1.6 in the realm), 14 DEF.
