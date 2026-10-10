# Phase 5: Elites

Ten mid-tier overworld creatures from `packs/elites` (sheet `el_elites`, shots `el_shots`), two per land. Each is a
real step up from the monsters around it: bigger (20–22 px native), tougher, escorted by its land's regulars, with a
nameplate and one ability on a cooldown. They are not bosses: no phases, no arena, a fight of 20–40 s.

## Where they live
| Land (ours) | Bundle biome | Elites |
|---|---|---|
| the Drowned Shore | shore | Reef Golem, Siren |
| the Greenmarch | lowlands | Goblin Shaman, Bramble Bear |
| the Thornwood | midlands | Orc Warlord, Spider Queen |
| Runeholt (and the Crystal Steppe) | highlands | Storm Gryphon, Rock Troll |
| Godfall | godlands | Void Seer, Abyss Hound |

## Spawning
- One elite per **18 regular groups** in a land (rounded, at least one): about the brief's 1 in 15–25. The realm
  tops them up like everything else, never near you.
- **Escort**: three or four of its land's regulars (from that land's spawn table) stand round it.
- **Spawn telegraph**: an elite that appears within sight of you does it visibly: a column of light and a ring on the
  ground for 1.2 s (it can't act or be hit meanwhile), then it steps out with a puff.
- **Nameplate**: its title over its head in gold, and its health bar wider than a monster's.

## The state machine
`wander → aggro → attack loop`, with the **ability** on a cooldown (10–14 s, the first 4–6 s after it sees you).
The ability clip is the telegraph: the elite stops, plays its `ability` clip, and the effect lands on the clip's last
frame. While it plays, nothing else happens (no shots, no moving). Its two shots are its own (`el_shots`).

| Elite | Ability | Effect (on the last frame) |
|---|---|---|
| Reef Golem | Coral Bulwark | invulnerable for 4 s inside a glowing coral shell (drawn round it; hits say BULWARK) |
| Siren | Siren Song | a charm ring (radius 6, wider than she keeps from you) pulses round her for 4 s: inside it you move at 60% |
| Goblin Shaman | Spirit Totem | plants a totem (its own target, 1,800 Life): every 1.5 s it heals goblins within 6 tiles by 5% |
| Bramble Bear | Thorn Roar | 24 thorns in every direction, a second ring half a step later |
| Orc Warlord | War Banner | plants a banner (its own target, 2,400 Life): orcs within 7 tiles move 35% faster and take 30% less |
| Spider Queen | Brood | three spiderlings (bark spiders at 40% Life); never more than six of hers alive |
| Storm Gryphon | Thunder Dive | a line flashes from it toward you for 0.5 s, then it dives along it, fast, through you, leaving after-images |
| Rock Troll | Burrow | it sinks; an untargetable mound moves under you for 2 s; a ring telegraphs 0.8 s; it erupts in rock shards |
| Void Seer | Blink | it comes apart into motes and re-forms 4–6 tiles from you on a free tile (the landing mark shows first) |
| Abyss Hound | Shadow Dash | it crouches, then lunges 6 tiles at you in a blur, shadow copies trailing behind |

Death plays the `death` clip as a dissolve (its alpha fading), then the bag.

## Loot
Elites roll their land's best regular table **plus** one guaranteed piece from a tier above it, and a raised egg
chance (common 6%, uncommon 2%, rare 0.4%).

## Stats (per land tier)
| Land | Life | Def | Shots |
|---|---|---|---|
| shore | 1,800 | 4 | 18–24 |
| Greenmarch | 2,800 | 6 | 26–32 |
| Thornwood | 6,000 | 12 | 40–50 |
| Runeholt / steppe | 10,000 | 18 | 60–70 |
| Godfall | 18,000 | 24 | 80–95 |

## How it's tested
`tools/check_elites.mjs`: each elite spawns with its escort, sees you, uses its ability (the effect lands on the clip's
last frame and does what the table says), shoots both its shots, dies with its clip, and drops its loot; the realm
holds about one elite per 18 groups in every land; the spawn telegraph shows before an elite near you appears.

## Result (built)
- Data: ten elites (`ENEMIES`, `reg: el_elites/*`, both shots from `el_shots`, `ability: {kind, cd, tell}`), their
  per-land tiers, and `ELITES` (land → its two). The totem and banner are `spirit_totem` / `war_banner`: their own
  targets, drawn with object sprites (`objSprite`).
- `src/elites.js`: spawning with an escort (1 per 18 groups, topped up by the realm), the arrival telegraph
  (`spawnT`: no acting, no hurting, a column and a ring), the ability machine (the clip is the telegraph; the effect
  lands at its 0.67 s end), the dive/dash/burrow/blink states, and the auras (song, totem, banner).
- Rendering: elite clips (walk, attack, ability, hurt, death) through `regEnemy`; gold nameplates; wider bars; the
  shell, the charm ring, the dive line, the after-images; the burrowing mound now drawn large and dark for elites
  (the moles' little one was invisible on sand).
- Hooks: `damageEnemy` (arriving, BULWARK, banner's 30% less), `moveEnemy` (banner's speed), `eggDrop` (elites' raised
  chance), realm populate/maintain.
- `tools/check_elites.mjs`: every land holds its elites with escorts; each elite uses its ability, the effect lands on
  the clip's last frame and does what the table says, it fires both shots, dies; the arrival blocks damage, then ends.
- Tuned after testing: the Siren's ring was radius 3.5 but she kites at 5.5, so it could never catch you; it is 6.
