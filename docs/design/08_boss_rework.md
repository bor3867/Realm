# Boss rework: harder, denser, still fair

Feedback: every new dungeon crashed when its boss died (fixed: the death burst looked for the boss on the old boss
sheet), and every boss was too easy. Glacius, the Grand Orrery and the Forgeheart Colossus must be the hardest.

## Why they were easy
Measured before the rework: every boss fired **one attack at a time**, then rested 1.2–1.6 s; 2–3 patterns a
phase; shots of 45–130. Nothing overlapped, so you only ever read one thing. RotMG bosses are hard because two or
three things happen at once: a steady pattern you weave through while the big attacks land on top of it.

## The framework (src/bossx.js)
- **Pressure layers.** Each phase can have `pressure: [{ every, special, delay }]`: attacks on their own timers that
  run underneath the main cycle (not during intros, morphs or the death). This is where the overlap comes from.
- **Tempo.** `tempo` scales every windup and recover (the telegraph never goes below 0.45 s, so a tell is still a
  tell).
- **Damage scale.** `dmgScale` multiplies every shot the boss makes (`bxShot`, lobs included).
- **The finale** (the three hardest only). In phase 3, at `finale.at` of its life, the boss turns immune and runs a
  survival sequence of its own for `finale.dur` seconds: you can only dodge. Live through it and it breaks: it takes
  +50% damage for the rest of the fight (the bar says **BROKEN**). Each finale is its boss's own.

## Tiers
| Tier | Bosses | Tempo | Damage | Pressure | Finale |
|---|---|---|---|---|---|
| Event | Kraken, Treant | 0.85 | ×1.15 | phases 2–3 | no |
| Low-mid | Sphinx, Mycelia | 0.8 | ×1.2 | every phase | no |
| Mid-high | Lich, Vesper, Ringmaster | 0.75 | ×1.3 | every phase | no |
| **Hardest** | **Glacius, Orrery, Colossus** | **0.68** | **×1.45** | every phase, two layers in phase 3 | **yes** |

Life: Glacius 150k → 300k, the Orrery 240k → 380k, the Ringmaster 300k → 240k (so the hardest three are also the
longest fights after the Colossus' 520k).

## What each one gains (every mechanic is still its own)
**Glacius, the Frozen Wyrm** (hardest)
- P1 pressure, *rime crawl*: ice erupts along the ground from the wyrm to where you stood, tile by tile, each
  eruption throwing shards to both sides. New pattern, *glacier maze*: five rows of frost sweep down the lake one
  after another, each row's gap a step to the side of the last, so you walk a staircase.
- P2 pressure, *frost wake*: as it circles the lake it drops pairs of lances pointing in at the middle, fencing
  the lake. Wing beat now beats twice.
- P3 pressure, *heart shards* (three fast aimed shards from the bare heart) and *permafrost* (the lake freezes in
  a ring that grows from the heart). Aurora and nova come faster.
- Finale at 12%, **Absolute Zero** (10 s): two arms of nova spiral opposite ways from the heart while the aurora
  rolls every 2.5 s. Then the heart **breaks**.

**The Grand Orrery** (hardest)
- P1 pressure, *planets*: two planets orbit the machine and each fires a three-shot burst at you as it passes:
  the sources move. Orbits now come with a conjunction in every cycle. (Later removed: see boss_grand_orrery.md.)
- P2 pressure, *corona*: the umbra's rim flares on its own every 1.6 s. New pattern, *syzygy*: the machine, the
  umbra and you line up, and a dense stream fires down that line, **through the dark**.
- P3 pressure, *falling brass* on you every 2.4 s, and *two wells* at once. New pattern, *spaghettification*: rings
  whose shots bend toward the nearest well.
- Finale at 12%, **Collapse** (12 s): the safe floor shrinks from the rim inward (outside it burns), while orbits
  and conjunctions keep coming. Then the machine **stalls**.

**The Forgeheart Colossus** (hardest)
- P1 pressure, *loose rivets*: every 1.6 s a rivet aimed at you that ricochets three times: the forge fills with
  them. New pattern, *flail*: a chain of sparks swings through a half-circle in front of it.
- P2 pressure, *vent burps*: a single vent glows and erupts every 1.8 s. Slag skips twice.
- P3 pressure, *core flare* (a ring of ricochet rivets) and rolling magma on its own timer.
- Finale at 12%, **Meltdown** (12 s): patches of the floor glow and turn to lava, the vents roar in turn round the
  forge, and its core throws your shots back. Then it **cracks**.

**The Gilded Sphinx**: P1 pressure, the four obelisks take turns throwing a crescent at you. P2: feathers fall from
its wings as it glides (a drop of gilded feathers wherever it perches). P3 new pattern, *the scales*: two fans from
its sides that swing toward each other and cross on you.

**Mother Mycelia**: P1 pressure, the pods round the Mire puff a hanging cloud toward the middle in turn. P2: the
lunge chains (two lunges). P3 pressure, every sprout that lives fires needles at you.

**The Tidebound Lich**: P1 pressure, a single current-bent soul bolt every 1.1 s. P2: the souls come in two waves.
P3 pressure, *undertow*: skulls rise from the floor's edge and drift inward.

**Count Vesper**: P1 pressure, bats leave the pillars at you in ones and twos. P2 dashes fire a bolt volley at the
end of each dash. P3 pressure, *the pools boil*: every blood pool he has made spits at you.

**The Grinning Ringmaster**: P1 pressure, *juggling*: pins thrown from the drums arc toward you (pins curve the way
they're thrown). P2: stitches come three at a time. P3 pressure, *the grin*: cards from the tent's mouth every 1.4 s.

**The Abyssal Kraken** (event): P2–P3 pressure, *spouts*: a column of water bursts from the shallows near you and
sprays a fan away from the pool.

**The Thornheart Treant** (event): P2–P3 pressure, *canopy*: burning leaves fall from above on you and sway.

## Result (measured)
`node tools/check_boss_pressure.mjs`, average over the three phases (the bot's numbers swing ±20% run to run):

| Boss | Shots/s before → after | Bot damage/min before → after | Finale |
|---|---|---|---|
| **The Grand Orrery** | 13.2 → 27.8 | 2,395 → **10,810** | Collapse: ran, immune, broken |
| **The Forgeheart Colossus** | 19.1 → 29.0 | 2,550 → **9,077** | Meltdown: ran, immune, broken |
| **Glacius, the Frozen Wyrm** | 15.7 → 29.3 | 2,060 → **8,918** | Absolute Zero: ran, immune, broken |
| Mother Mycelia | 7.7 → 12.7 | 2,722 → 5,191 | — |
| Count Vesper | 12.3 → 15.5 | 3,463 → 4,701 | — |
| The Grinning Ringmaster | 13.3 → 16.4 | 3,299 → 4,684 | — |
| The Tidebound Lich | 15.7 → 22.9 | 3,032 → 3,766 | — |
| The Abyssal Kraken | 14.1 → 16.7 | 1,775 → 3,395 | — |
| The Gilded Sphinx | 7.5 → 13.6 | 2,010 → 2,646 | — |
| The Thornheart Treant | 16.3 → 21.2 | 1,397 → 1,966 | — |

Before the rework the three "hardest" by this measure were Vesper, the Ringmaster and the Lich; now they are the
Orrery, the Colossus and Glacius, and the check fails if that ever changes.

Found and fixed on the way:
- **Glacius' phase 2 couldn't reach you.** It circles 12 tiles out, but its shots flew 3–9 tiles: a player at the
  lake's edge was never hit (the bot took 150 damage a minute). The orbs, wing shards and breath now reach across the
  lake, and the glide dives through where you stand.
- The tools had been placing you in the dungeon's last room, which for Frostveil isn't the lake; they now use the room
  the map marks as the boss's.
- Tuning after measuring: the Ringmaster's needle walls were already the hardest thing in the update, so tripling
  them (14,000/min in phase 2) went back to two rows and his damage scale to ×1.0; Mycelia's and Vesper's ground
  hazards (clouds, blood rain) count heavily against the bot, which only dodges moving shots, so their scales are
  lower (×1.0, ×1.1) than the table above; the Kraken's whirlpools chase a little faster (1.4 → 1.9).
- The bar shows the finale's countdown (`ABSOLUTE ZERO 7s`) and then `BROKEN`; the finale's threshold is a fourth pip.

## How it's tested
- `tools/check_bosses.mjs` and the dungeon checks: every pattern still fires, phases still turn, bosses still die.
- `tools/check_boss_pressure.mjs` (new): for each boss, shots fired per second in each phase before and after,
  and a dodging bot's damage taken per minute; the hardest three must come out on top; each finale turns the boss
  immune, runs, and leaves it broken.
- In the browser: each fight looked at, with a draw every frame and nothing thrown after the boss dies.
