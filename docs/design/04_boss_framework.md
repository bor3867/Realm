# Boss framework: three phases, morphs, data-driven patterns

Built once, used by all ten bundle bosses (8 from the Boss Overhaul, Count Vesper, the Ringmaster). It sits next to
the existing boss system rather than replacing it: older bosses (realm bosses, the Abbot, the Heart, the Archivist,
the Unstruck God, my four recent dungeons) keep running on `updateRealmBoss`.

## How it plugs in
- A bundle boss is an ordinary boss enemy (`e.rb`), spawned by the existing `spawnRealmBoss`, with `D.bx` naming its
  registry def. Spawning, loot rolls, portals home, quests, trophies and the boss bar all keep working.
- `updateEnemies`: `if (e.rb) e.D.bx ? updateBx(e) : updateRealmBoss(e)`.
- `damageEnemy`: one hook before damage (immune while morphing or dying) and one after (phase thresholds, and
  turning a lethal blow into the death sequence).
- `Renderer.realmBoss`: `D.bx` bosses draw through `drawDef` with their `Anim`, hover (HOVER.json), a ground shadow
  and a rate-limited hurt flash.
- One file per boss in `src/bosses/<boss>.js` holds its data (HP, phases, pattern scripts, arena, loot) and its own
  special mechanics. `src/bosses/index.js` lists them. `src/bossx.js` is the framework, mixed into Game like
  `dungeons4.js`.

## State machine
`sleep → intro → fight(P1) → morph(P1→P2) → fight(P2) → morph(P2→P3) → fight(P3) → death → gone`
- **sleep / intro:** the boss waits in its arena. When you enter, the doors lock (barrier objects on every way in),
  the name banner shows, and it idles, invulnerable, for 1.6 s.
- **fight:** it rotates through its phase's patterns (2–4 per phase). Between patterns it moves the way its data
  says (hold, pace, hop between perches, drift, orbit).
- **morph:** triggered when HP crosses 66% or 33%. Damage that would skip a phase is clamped at the threshold, so
  every phase is seen. Invulnerable; the boss's live bullets fade out (a small burst each); the `enter` clip plays,
  the screen shakes, the phase name shows as a banner. When the clip's `ended` event fires, a 1.4 s grace window
  follows before the first pattern.
- **death:** a lethal blow plays the `death` clip (invulnerable, no attacks). On `ended`, the normal death runs
  (loot fountain, portal home), the doors unlock, and the boss bag shows its legendary chance.

## Attacks: windup → release → recover
Each pattern plays the phase's 3-frame `attack` clip:
- frame 0, **windup**, is held for the pattern's `windup` seconds (the telegraph; at least 0.45 s);
- on frame 1, **release**, the volleys fire;
- frame 2, **recover**, then the clip's `ended` event starts the pattern's `recover` pause.

## Pattern scripts (data, not code)
```
{ name: 'crescent sweep', windup: 0.7, recover: 0.5, move: 'hold',
  volleys: [ { t: 0,   form: 'fan',  shot: 'sand_crescent', count: 7, spread: 1.4, speed: 5, dmg: 60 },
             { t: 0.3, form: 'fan',  shot: 'sand_crescent', count: 6, spread: 1.4, speed: 5, dmg: 60, offset: 0.12 } ] }
```
`t` is seconds after release. `shot` is the boss's own shot name (`<boss>.<shot>` in `bx_shots` / `bx2_shots`).
Generic forms, each with fairness built in:

| form | what it does | key params |
|---|---|---|
| `fan` | an arc aimed at you (or at `angle`) | count, spread, offset |
| `ring` | all the way round, rotated each time | count, rot, gaps (missing shots = a way through) |
| `wall` | a line of shots across your path, marching | count, space, gaps |
| `stream` | aimed shots one after another | n, every, wobble |
| `spiral` | arms that turn over time | arms, every, dur, turn |
| `curtain` | shots from one side of the arena sweeping across, with a gap | count, gaps, from |
| `burstAt` | a ring born at a point (your position, a vent, a puppet) | at, count |
| `special` | calls the boss's own function | name, args |

Shots can carry any existing movement modifier (`mv`: hold, seek, accel, curve, wave, split, boomerang). Anything
that's truly one boss's own (the Sphinx's sandstorm, the Kraken's ink, Vesper's blood pools, the Ringmaster's
puppets) is a `special` in that boss's file, so no two bosses share a signature.

## Bullets
Bundle shots are registry defs. `shoot()` keeps its signature; a sprite name containing `/` is a registry key, and
`drawProjectiles` draws those with `drawDef` (rotated to travel, animated with the shot's own clip). Each boss's live
bullets are tagged with its name, which is how the morph clears them.

## Boss bar
Phase pips at 66% and 33%, the current phase's name, grey while invulnerable (intro, morph, death).

## How it's tested
- `/bx <boss>` (admin) spawns a bundle boss beside you in any map, for looking at it.
- `tools/check_bosses.mjs` (headless): for each boss, drive it through every phase. Checks that patterns fire,
  morphs make it immune and clear its bullets, clamping prevents skipped phases, death plays its clip before the
  drop, and there are no NaN positions.
- In the browser: watch each phase and morph, and check readability against the arena floor.

## Result (built)
- `src/bossx.js` (framework), `src/bosses/index.js` (+ `bxEnemyDef`), `src/bosses/framework_test.js` (a stand-in on
  the Sphinx's art, admin only: `/bx framework_test`), hooks in `game.js` (update routing, two damage hooks, hit
  heights from the sprite's body centre, `/bx`) and `render.js` (`bxBoss`, registry shots, boss-bar pips).
- `tools/check_bosses.mjs`: phases 1>2>3, all 6 test patterns fire, no damage taken while morphing, the death clip
  plays 0.8 s before the drop.
- Seen in the browser (captured): Guardian idle facing the player, the grey bar during the morph, the Ascendant form,
  a sun-disk spiral.
- Bugs found and fixed while testing: a morph landing mid-windup inherited speed 0 and never ended (morph and death
  now always play at speed 1); a lethal blow subtracted damage after the death routine had set 1 life (now lands 0).
