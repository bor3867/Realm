# The Grand Orrery (the Astral Observatory)

## Arena: the Orrery Floor
36×36. A round marble platform over the void (fall off and you lose Life and come back at your last footing),
brass rings inlaid in the floor. The doors lock when you step onto it. The machine hangs over the centre.

## Numbers
240,000 Life, Defense 30, 13,000 XP. Shots 110–140. Phases at 66% / 33%. (Steppe/Godfall tier.)

## Phase 1 — Aligned
1. **Orbits**: three rings of shots wheel round it at radius 3, 5 and 7 (`moon_shard` on the inner and outer,
   `star_bolt` on the middle), each ring turning its own way at its own speed, each with two gaps. After 3 s each
   shot flies off along its orbit's tangent. Read the gaps while they turn; step through as they fly.
2. **Conjunction**: every ring's shots stop where they are for 0.6 s (a chime), then all of them fire at you at
   once. A held breath, then a volley from everywhere it was.

## Phase 2 — Eclipse
1. **The umbra**: a shadow disc (radius 6) slides across the arena for the whole phase, slowly, bouncing off the
   rim. Inside it everything is dark: the floor, the shots, you. Its edge is a bright corona so you always know
   where it is.
2. **Corona flares**: from the rim of the umbra (not from the machine), eight `corona_flare`s burst outward.
3. **Eclipse rings**: rings of `eclipse_ring` that expand from the machine with three gaps, 0.5 s apart; the gaps
   of the second ring sit between those of the first.

## Phase 3 — Collapse
1. **Gravity well**: a `gravity_well` settles somewhere on the floor and for 4 s pulls you toward it (gently, but
   the void is close). Touching it hurts. Walk against the pull.
2. **Debris**: the machine shakes and `brass_shard`s rain down at marked spots (shadows grow for 0.8 s, then the
   shards land and skitter outward in fours).
3. **Orbits** return, faster.

## Death
The death clip; the rings stop; the loot fountain; the doors open; a portal home.

## Loot
Themed (boss tier): Starforged Katana (sword: piercing arcs), Comet Bow (three arrows that leave a trail), Nebula
Robe (robe: Mana, Wisdom; your ability costs less), Astral Signet (ring: Dexterity, Wisdom), Orrery Orb (halo: a
ring of stars). Legendary (phase-3 kill, 2%): **Event Horizon** (ring: Attack and Life; your shots curve toward
enemies). Plus T9–T11 gear.

## Unique to it
Rings of shots that wheel in orbits and fly off on tangents; a conjunction that freezes every shot and fires them
all at you; a moving umbra that blacks out part of the floor; flares from the umbra's rim; expanding rings with
staggered gaps; a gravity well; debris that rains on marked spots. The Lich's darkness hides everything but you;
this umbra is a place on the floor. None of these is used by another boss.

## Result (built)
- `src/bosses/grand_orrery.js` (with a new `drawTop` hook in the boss framework for things drawn over the bullets).
  Checked on its floor (`tools/check_astral.mjs`): all 7 patterns; orbits wheel and fly off, the conjunction
  freezes and looses everything, the umbra slides and the flares come from its rim, the rings' gaps alternate, the
  well pulls, the debris shadows grow and the shards skitter.
- Seen in the browser: three rings of moon shards and star bolts wheeling round the brass machine; the umbra (made
  bolder after looking: a burning corona ring, so its edge always reads against the marble); the eclipse rings; the
  well; the debris shadows.
