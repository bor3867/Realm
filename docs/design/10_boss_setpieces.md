# Boss overhaul: set pieces, movement, pacing (`src/setpieces.js`)

## What was wrong
- **The original bosses all moved the same way**: keep a fixed distance from you and step toward it. Fourteen
  bosses, one dance.
- Their attacks were one-shot volleys (fans, rings, spirals from the boss) in a fixed rotation: pattern, pause,
  pattern. Nothing ever *formed*, held, turned, closed in or came from somewhere other than the boss.
- The three-phase bosses were reworked last time (pressure layers, finales), but several still stood still.
- Bosses flashed white on every hit (the three-phase ones) and on every wind-up (the old ones). Removed.

## The engine
A **set piece** is a script that runs for 4–9 s: it places ground telegraphs (where something lands, a path, the
safe spot), spawns bullets it **steers itself** (formations that rotate, expand, close in, hold and then let go,
with openings that move), and can move its boss. It's harder in later phases (`P.lv`). The old boss engine plays it
as a move (`setpiece`); the three-phase engine as a pattern (`sp_<name>`); the Unstruck on a timer.

## Each boss's signature (all different; none shares a mechanic)
| Boss | Movement | Set piece |
|---|---|---|
| Brine Cathedral | scuttles sideways round you, turning back | **Rose Window**: three rings of glass bloom, turn opposite ways as they open, shatter along their turn; the bell tolls through it |
| Wick-Mother | sways after you; snuffs out and relights elsewhere | **Vigil**: six candles light round you and drip in turn; then all gutter inward at once (paths shown) |
| Rime Astrolabe | orbits you | **Astrolabe**: two sets of spokes turn opposite ways; halfway they chime, stop and turn back |
| Penitent Colossus | relentless: on you, then circling you | **Flagellation**: three charges along shown lines; each landing throws a ring whose gap faces away from you |
| Emily | waddles in loops, close and far | **Yap Storm**: belly-slides corner to corner, sound rings whose gaps walk; she yells at you from each corner |
| Fallen Star | drifts round the field | **Supernova**: three rings collapse inward (gap shown); it pulls you in; a green wedge shows the one way out of the nova |
| Drowned Abbot | — | **Tide Liturgy**: walls of water from alternating sides, each gap somewhere new (shown) |
| Fallen Heart | — | **Arteries**: four arteries of thorns turn round it like clock hands while it beats faster and faster |
| Archivist | steps between the hall's corners | **Redaction**: a page of darts writes itself in rows with spaces; the lines are struck out top to bottom |
| Queen Melliflua | circles you | **Escort**: drones orbit her as she hunts you; two peel off at you every second; the swarm is flung at the end |
| Maestro Lucan | slides along the back of the stage | **Marionette Bar**: strings across the whole stage sway together like a crossbar; then they're cut and fall. Background: strings drop where you stand |
| Aurelia | coils round the lighthouse | **Refraction**: white lances fly at three prisms; each that arrives splits into coloured rays bent at you |
| The Sleeper | always opposite you, as in a dream | **Lucid Waltz**: two (later three) rings of bubbles turn opposite ways round the dream, breathing in and out. Background: nightmare eyes drift in |
| Unstruck God | holds its throne; comes for you if you run | **Coronation**: a crown of halos closes in from the hall's edge, its opening turning; gauntlets slam where you stand |
| The Unstruck | (its own engine) | **Anvil Rhythm**: on the beat a cross of rivets, a half-beat later another between it; every fourth beat hammers go out and back |
| Glacius | | **Glacier Cage**: four walls of lances freeze round you; the opening slides round the cage as it tightens |
| Mother Mycelia | | **Fairy Ring**: a ring of spores rises round you; one by one round the circle they puff inward |
| Grand Orrery | | **Clockwork**: an hour hand and a minute hand of brass sweep round the machine in ticks |
| Gilded Sphinx | | **Sand Riddle**: three glyphs; two erupt, then the gold one does |
| Abyssal Kraken | | **Maelstrom**: six bending arms of water wind out of the pool |
| Thornheart Treant | | **Root Network**: roots erupt toward you, branching as they grow |
| Count Vesper | | **Danse Macabre**: he dashes round a square about you, a scythe wall from each corner, then cuts through |
| Grinning Ringmaster | | **Grand Finale**: three rings of pins orbit you, each its own way, thrown in one ring at a time |
| Tidebound Lich | | **Drowning Clock**: twelve skulls stand round you like the hours; the hand goes round, each fires as it passes, faster each turn |
| Forgeheart Colossus | | **Forge Pistons**: rows of sparks drive across from alternating sides, each gap a step further along |

Pacing: the original bosses play their set piece from their second phase (the Sleeper, Lucan and the Fallen Heart from
their first), twice a rotation in their last phase. The three-phase bosses play theirs in one phase and again, harder,
in their last.

## Measured
- `tools/check_setpieces.mjs`: all 25 run to their end, fire, telegraph, leave no steered bullets behind
  (0.04–1.4 ms a frame); every original boss moves its own way (3–35 tiles in 10 s).
- `tools/check_old_boss_pressure.mjs` (the dodging bot, 40 s per third of their life): the original bosses average
  2,100–6,000 damage a minute (the Sleeper and Lucan lower: their danger is in mechanics the bot never meets).
- `tools/check_boss_pressure.mjs`: the hardest three are still the Orrery (~9,700), the Colossus (~9,100) and
  Glacius (~8,600).
- Seen in the browser: the Coronation (the crown closing with its opening, the slam marks) and the Glacier Cage.
