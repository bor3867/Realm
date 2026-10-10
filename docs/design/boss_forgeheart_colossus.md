# The Forgeheart Colossus (the Emberforge Depths), on the boss framework

Audit D7: the Emberforge keeps its layout, and its boss gets the brief's three phases. Its arena gains six vents round
the forge floor. The Colossus keeps what was always its own: the blazing core that throws your shots back.

## Numbers
520,000 Life, Defense 40 (its tier is unchanged), 18,000 XP. Shots 105–140. Phases at 66% / 33%.

## Phase 1 — Forge Sentinel
1. **Hammer slam**: it raises the hammer (the windup), slams, and `hammer_spark`s burst in a half-ring toward you
   (13 sparks across 180°), then a second half-ring half a spark over.
2. **Rivets**: eight `iron_rivet`s fired at you one after another down a single line, each one **ricocheting once**
   off a wall. The first misses you; the bounce is what you watch for.

## Phase 2 — Overheat
On the morph its core blazes (its own): for 3.2 s every shot you fire at it comes back at you.
1. **Skipping slag**: three `slag_bomb`s lobbed at you that hit the floor and **skip**: a short second hop past where
   they landed, then a burst of six shards. Each lands twice.
2. **Vent flames**: the arena's six vents glow, and 1 s later two or three of them roar: a column of `vent_flame` from
   the vent straight across the floor, for a second and a half. The glowing vents tell you which.
3. **The blazing core** returns.

## Phase 3 — Molten Core
1. **Rolling magma**: three big `magma_orb`s roll slowly along the floor after you, leaving a trail of lava behind
   them that cools after 4 s. They herd you; don't get boxed in.
2. **Quake rings**: it stomps three times; three rings of `quake_shard`, each faster than the one before, so they
   catch each other up and cross a few tiles out. Be either close or far, not in between.
3. **Vent flames**, all six at once.

## Loot
Unchanged from the Emberforge's Colossus (Emberbrand Greatsword, Cinderwood Staff, Runeplate Armor, Emberheart Ring,
Colossus Core, Runic Aegis), plus the brief's legendary (phase-3 kill, 2%): **The Forgeheart Maul** (sword: slow,
huge, each blow throws a ring of sparks).

## Unique to it
Half-ring slams; rivets that ricochet; slag that skips; vent columns that pick vents and tell you which; magma that
rolls and leaves lava; quake rings that catch each other up; and its old core that throws shots back. None is used
by another boss.

## Result (built)
- `src/bosses/forgeheart_colossus.js`; the Emberforge's boss is now this framework boss. Its blazing core reuses the
  game's reflect (`e.reflectUntil`). The forge floor's six vents are `cvVent` objects from the generator.
- Checked on the forge floor (`tools/check_crypt_ember.mjs`): all patterns; the half-ring slam, ricocheting rivets,
  the core, slag that skips, vents that glow then roar, magma that rolls and leaves lava (which cools), quake rings.
- Seen in the browser: the slam, two vents roaring their columns across the floor, the quake rings bunching up.
