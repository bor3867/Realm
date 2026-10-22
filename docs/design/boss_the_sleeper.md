# The Sleeper, Who Dreams the Realm (the Sleeper's Dream)

Rebuilt on the three-phase engine on 2026-10-22 (`src/bosses/the_sleeper.js`; art `tools/build_last_bosses.py`; shared helpers `src/bosses/kit.js`).

"Do not stand still. Stillness is sleep, and sleep is how it keeps you." "It cannot be woken. It must be woken. Ring every alarm you can find, and run."

- **Drowsiness (its signature):** stand still and you grow drowsy (the bar under you); drowsy enough and you fall asleep for 1.5 s. Its lullaby's Zs add drowsiness. This is felt in your own browser; the old dream code now leaves drowsiness to this boss.
- **It reaches for you** (every phase): a fan of stars at each player, its one aimed attack.
- **I It Dreams of You:** flocks of sheep hop across in rows (one gap each), lullabies, blinking stars (only solid while they shine), and a tide of crescent moons from every side.
- **II The Dream Turns:** it sleeps, unhurt (DREAMING). Its nightmare-self walks the room, and every blow on the nightmare reaches the Sleeper (through the game's linked-body forwarding, which the Eclipse Twins also use).
- **III The Nightmare Wakes:** dream logic: for 4.5 s your movement keys turn round.
- **Last: It Will Not Wake (10%):** three alarm clocks ring out. Break them all and it wakes, losing 4% of its Life. If any are left at the end, the dream stampedes: four rows of sheep.

## Numbers
520,000 Life, 40 DEF, 22,000 XP. Its loot is its old table.
