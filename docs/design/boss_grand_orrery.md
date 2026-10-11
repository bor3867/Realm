# The Grand Orrery (the Astral Observatory)

Reworked (Astral Observatory Plus): the old fight was too easy, its first phase too plain, and its conjunction
(every shot frozen, then all loosed at you) is gone for good.

## Arena: the Orrery Floor
36×36. A round marble platform over the void (fall off and you lose Life and come back at your last footing),
brass rings inlaid in the floor. The doors lock when you step onto it. The machine hangs over the floor.

## Numbers
400,000 Life, Defense 30, 17,000 XP. Shots 110–140 before its damage scale (×1.45). Phases at 66% / 33%; the
finale at 12%.

## The eclipse (the whole fight)
An umbra rises with the machine and never sets: a black disc with a burning corona that slides across the floor,
bouncing off the rim. It burns whoever stands in it (every 0.4 s) and blacks out its part of the floor. Corona
flares burst from its rim in every phase. It grows each phase (radius 3.8, then 5) and moves faster; in the finale
it is dragged into orbit round the singularity.

## Phase 1 — Aligned (RotMG-style)
It glides between stations round its floor and fires readable volleys; two planets wheel round it and throw three
bolts at you every 1.3 s.
1. **Meridian**: three aimed fans in quick succession (5, 4, 5), the middle one threaded between the others.
2. **Precession**: three rings of 20, each turned half a step from the last.
3. **Armillary**: a four-arm spiral, turning, for two seconds.
4. **Meteors**: rune circles open on and round you; a second later meteors fall onto them and burst into shards.
5. **Orbits**: three rings wheel round it, each its own way with two gaps, then fly off on their tangents.

## Phase 2 — Eclipse
The umbra grows; flares every 2 s; the planets keep throwing.
1. **Umbral lunge**: the umbra marks where you stand (a violet circle) and slides onto it.
2. **Corona burst**: three rings from the umbra's rim, each between the last.
3. **Eclipse rings**: three expanding rings whose gaps alternate.
4. **Syzygy**: the umbra slides onto the line between the machine and you; a dense stream fires down that line.
5. Meteors (nine), orbits (faster), and the **Clockwork** set piece (`src/setpieces.js`).

## Phase 3 — Collapse
It holds the centre. Black holes open on the floor (two at most), away from you: each pulls you and burns at its
horizon. Debris rains on marked spots; flares go on.
1. **Accretion**: two disks of shots round each black hole, turning opposite ways, winding in until swallowed.
2. **Spaghettification**: rings whose shots bend toward the nearest black hole (and vanish into it; never at you).
3. **Infall**: matter streams in from the floor's rim toward the black holes, in threes.
4. Orbits (fastest), a five-arm armillary turning the other way, and the Clockwork again.

The black holes are drawn as black holes: a black core with a breathing photon ring, a lensed arc over the top, a
tilted accretion disk of hot bands whose far half passes behind the core and near half in front, matter falling in.

## Finale — Singularity (17.5 s; immune, then broken)
1. **It swallows** (10.5 s): one black hole at the centre, growing; it pulls you in. Matter spirals in from the rim
   on three arms that wind tighter, and from 4.5 s on two counter-arms the other way; debris rains. Its horizon burns.
2. **Collapse** (1.5 s): everything falls in at once; the core gathers into a blinding point. SUPERNOVA.
3. **Supernova** (5.5 s): a ring of 36 every 0.46 s, each with four gaps of three in new places, five fast bolts
   between them turning wave by wave; it pushes you outward.

## Unique to it
The ever-present eclipse that burns, lunges and flares; planets; meridian fans; precessing rings; meteors on rune
circles; orbits that fly off on tangents; black holes with accretion disks and infall; a singularity and a
supernova. None of these is used by another boss.

## Result (built)
- `src/bosses/grand_orrery.js`. `tools/check_astral.mjs`: 18 pattern slots seen across the phases; the eclipse in
  all three and it burns; lunges, meteors, flares, rings, orbits, black holes, accretion, infall, debris, shards;
  no shot is ever frozen and loosed at you; the finale swallows (139 shots spiralling in at once), collapses and
  goes supernova (260 shots), ends broken, and the eclipse is still up.
- `tools/check_boss_pressure.mjs`: the hardest boss by far, ~16,000 damage a minute to the dodging bot (was
  ~9,700); then the Forgeheart Colossus (~9,700) and Glacius (~8,000).
- Seen in the browser: phase 1 with the eclipse; the black holes; the singularity's spiral arms with the eclipse in
  orbit; the supernova's rings.

## Loot
Starforged Katana, Comet Bow, Nebula Robe, Astral Signet, Orrery Orb; Event Horizon (2%); T9–T11 gear.

## Second pass (realm_astral__singularity)
- **Small singularities** use their own sprite (ap_shots/grand_orrery.singularity: opens, turns, collapses). In the
  Collapse two or three open at a time (three at most), drift, pull you in from 3.5 tiles (harder the closer you are),
  burn at the core and collapse after 6 s; their accretion disks travel with them. The finale's swallowing throws
  them off every 5.5 s. The astral items' black holes (Orrery Halo, Event Horizon Ring) use the same sprite.
- **Its shots**: the pink star bolts are drawn as lasers (a magenta glow round a white core, along their flight); the
  yellow shards, the rings, the flares and the moons no longer flicker between frames.
- **It grows** to 1.75 times its size in its Collapse (eased), with a bigger body to hit.
- **The finale is twice as long** (36 s): 20 s of swallowing, 2.5 s of collapse, 13.5 s of supernova (a four-arm
  spiral turns out between the rings from its middle on).
- **Its death**: the death clip at 0.4 speed, then it hangs on its last frame for 3.2 s, shaking and sparking, and
  bursts in four rings of light (140 shots; they hurt no one).
- **A bug that made it (and every fight) easier**: shots fired in the same frame share a volley, and after one of
  them hit you every other shot of that volley was absorbed on contact, for the rest of its flight: you were touched,
  the shot vanished, nothing happened. Orbit rings and spiral arms were mostly harmless after the first hit. Now a
  volley only absorbs the shots that land in the same instant (0.12 s), and a shot's hit reach is a little wider.
- Measured: the bot takes ~21,400 damage a minute (was ~16,000); next the Forgeheart Colossus ~12,200, Glacius ~8,100.
  check_astral: the finale reaches all three stages (151 shots spiralling in at once, 283 in the nova), it grows,
  its death holds 3.2 s and bursts, and a later shot of a volley that already hit you still hurts.

## Third pass
- **The eclipse comes and goes.** It was on screen the whole fight. Now it is a transit: its path is marked across
  the floor (orange line), it slides in from beyond one rim and out past the other, then the sky clears. Every 15 s in
  Aligned (small), every 7 s in Eclipse (big; the lunge and syzygy turn it toward you, marked first, and a corona
  burst raises one if none is up), every 11 s in Collapse. The singularity swallows it. Its dark is a little
  lighter, so the shots inside it still show.
- **Openings in every strand**: in the swallowing, each spiral arm leaves out two shots in eight (at a different place
  on each arm); the counter-arms two in seven; the supernova's spiral two in nine, and it now turns smoothly (its
  arms used to jump when the ring count changed, breaking the strands at random).
- **Collapse** is fuller: debris every 2.2 s, the planets keep throwing, nine meteors in the rotation.
- **Hitboxes** (every enemy shot in the game): see docs/changelog.md and tools/check_hitboxes.mjs.
- Measured: the bot takes ~18,200 a minute (the Colossus ~11,900).
