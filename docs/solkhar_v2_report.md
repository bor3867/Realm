# Solkhar, the Sunthief — v2 implementation report (2026-11-03)

Built to `solkhar_sunthief_AUDITED_IMPLEMENTATION_v2.md`, one phase at a time, each tested before the next.
Machine-readable attack table (generated from the code): `docs/solkhar_attacks.json` (`node tools/solkhar_table.mjs`).

## 1. Engine values used (measured or read from the code, not assumed)

| Value | In this game | Where |
|---|---|---|
| Player collision radius | 0.32 tiles | `src/game.js` PLAYER_R |
| Player speed | 3.6 + 5.0 × SPD/50 tiles/s (3.6 to 8.6; a level-1 priest 4.6) | `src/data/classes.js` moveSpeed |
| Defense | max(15% of the hit, hit − DEF); piercing ignores it | `src/data/classes.js` mitigate |
| Post-hit immunity | none in general (only from abilities and items) | `src/game.js` hurtPlayer |
| Spec damage → engine | D(n) = n + 4 (effective numbers over a Throne-geared DEF); piercing values used as they are | `src/bosses/unstruck_god.js` |
| Arena | round, its floor 24 tiles from the middle to the wall (rebuilt to the spec); nothing solid within 19 tiles | `src/world/maps.js` (a52) |
| Orientation | the sanctum's door is north, so the whole encounter is turned half round: spec (x, y) → middle − (x, y); spec bearing θ → π − θ | `SP()`, `SANG()` |
| Simulation | the boss's own clock (g.t); server steps 10 a second, browser every frame | `server/server.mjs`, `src/main.js` |
| Multiplayer | the castle's fight runs on the server; aimed shots lock on the nearest living player; floors, beams, the void and the claim are judged for every player | `eachPlayer()` |
| Sprite | 55×58 on a 67×64 canvas, feet on its bottom row (every shot of his leaves from there) | `tools/build_solkhar2.py` |

## 2. What was built

- **Arena**: the sanctum rebuilt from the user's room art at the spec's 24-tile radius (walls, lava falls, the captive
  Sun's pedestal, hooded statues, banners, a sun dais with runners).
- **Shots**: GLINT, SPEAR, EMBER, HALO, ECLIPSE, VOID, COMET, SUNSPARK hand-drawn (`tools/build_sol2.py`); RAY and
  NIGHT_RAY are beams.
- **Phase I** (100–75%): Royal Sundial, Crown's Rebuke, Corona Pincer, Solar Verdict; 3 s intro; kneel after a clean Verdict.
- **Phase II** (75–50%): Sunseed Summoning (+Rebuke), Halo Fracture, Eclipse Exchange (+Sundial), Stolen Hour,
  Sundering Dawn; stagger when both lesser suns break within 5 s.
- **Phase III** (50–25%): Crown of Ash, Solar Pursuit, Black Sun Implosion, Event Horizon, The Astral Loom; stagger
  after the Implosion.
- **Phase IV** (25%–1 Life): Solar Guillotine, Four Dead Suns, Dusk Reversal, Devouring Eclipse, End of Heaven; stagger
  after End of Heaven.
- **Finale**: Reclaim the Sun — release, four 12 s trials with the light moving A→B→C→D, the 1.2 s claim, death and
  rewards only after it.
- **Animation**: every frame hand-drawn on his sprite (`tools/solkhar_frames.py`): four looks × idle, hover, cast,
  summon, stagger, beam wind-up, chase; three changes; death; void form.

## 3. Deviations from the spec (all decided, none silent)

| What | Spec | Built | Why |
|---|---|---|---|
| Orientation | door south, Sun north | turned half round | the castle's way in comes from the north |
| Corona Pincer / End of Heaven walls | x = ±19 straight lines | each slot pulled in to the round wall | the spec's corners lie outside a round 24-tile floor |
| Sundering Dawn lanes | x = −20 … +20 | ×0.8, shots born behind the wall | the same; shots pass the rim until inside |
| Eclipse Exchange warning | 1.4 s | 2.0 s | the spec's own rule: at least 2.0 s to walk to safety |
| Solar Pursuit fans and its suns | aim at your snapshot | lead your run | the user's call: a full-speed wall-runner outran the spec's aim |
| Event Horizon | fragments at 15 tiles | at 20 tiles | the user's call, against the wall-runner |
| Dusk Reversal omitted slots | not given in the spec | 0–2 and 6–8 | the spec says "see the next line" and gives none |
| Teleport/vanish frames | 8 | not drawn | the spec forbids abrupt teleports; he never teleports |

## 4. Test results

Tests are scripted runs of the real game code (no rendering) unless marked otherwise.

| # | Spec test | Result | Evidence |
|---|---|---|---|
| 15.1 | Spawn counts (Ring omit = 9; Implosion 16 in, 8 out; Guillotine 7; Dead Suns 7) | **PASS** | every volley logged: Sundial 9, Rebuke 7, Pincer 10 a side, Halo 12 (9 on its dark volley), Dawn 14, Ash 12, Implosion 16/8, Loom fans 8, Guillotine 7, Dead Suns 7, Dusk 9, Devour 9, Heaven rings 12, walls 22, crescents 12; finale 28 needles, 8 walls of 9, 12 obelisk fans of 5, 12 volleys of 12 |
| 15.2 | Phase gates under 400,000 bursts at 76/51/26/2% | **PASS** | each clamps exactly to 75/50/25%/1 Life; one transition; a second burst mid-change thrown away; nothing stale after |
| 15.3 | Shot origins | **PASS** | his own shots from his feet (the engine forces it); suns, shards, stars, apertures fire from their own drawn places |
| 15.4 | Real arena geometry | **PASS** | the sanctum rebuilt to 24 tiles; all 52 castle areas still reachable in order at every lock stage |
| 15.5 | Finale transport | **PASS** | a walker at 4.6 t/s following the light takes no void damage over all 48 s; one standing still is hit 69 times |
| 15.6 | Damage safety | **PASS** | beams hit once a player each, only while burning; void and floors at most every 0.5 s a player, a 0.3 s grace stepping out |
| 15.7 | No-cheese (60 s each, no dodging) | **PASS** | standing still: P1 4,100 · P2 6,400 · P3 4,700 · P4 9,800; far-wall camp: 2,200 · 6,200 · 4,400 · 9,300; full-speed wall orbit: 1,850 · 1,500 · 1,140 · 2,100 |
| 15.8 | Instance isolation | **PASS (inherited)** | each castle is its own server world; nothing of his is shared |
| 15.9 | Victory flow | **PASS** | 1 Life → release 3 s → 48 s trials → 1 s → 1.2 s claim → 3 s → death and loot once; online too |
| 12.1 | 2,500 peak DPS, whole fight | **PASS** | 560 s (9.3 min; spec 7–10); phase starts 0 / 169 / 306 / 402 s, finale 499 s, dead 555 s |
| — | Damage a non-dodging player would take, whole fight | measured | ~38,000 (P1 11,300, P2 8,400, P3 4,900, P4 9,800, finale 3,800) |
| — | Peak projectiles | measured | 95 to 118 |
| 12.4 | Every sequence has a survivable route (pathing solver) | **NOT TESTED** | no route solver was built; safety comes from the spec's gaps, warnings and the checks above |
| 12.10 | Video or frame captures of each attack | **NOT TESTED** | Phase I and the sanctum checked by eye in the browser; II–IV and the finale not watched |
| — | Several players online at once | **NOT TESTED** | per-player judging is in the code; only one-player runs, online and off |
| — | Frame rate in a browser during the fight | **NOT TESTED** | `/lag` now shows it; not measured here (the pane was hidden) |
