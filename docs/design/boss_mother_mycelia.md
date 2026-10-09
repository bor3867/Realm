# Mother Mycelia (Mirerot Grotto)

## Arena: the Mire
34×32. A round island of mud and moss inside a ring of bog (60% speed), eight spore pods round the island's edge
(they burst into poison clouds like the rest of the grotto's), four glowshrooms for light. The doors lock when
you step onto the island. She is rooted at the island's north.

## Numbers
85,000 Life, Defense 14, 5,200 XP. Shots 70–90. Phases at 66% / 33%. Her poison is the grotto's: 8 every 0.5 s
for its duration, ignoring Defense.

## Phase 1 — Bloom (rooted)
1. **Spore clouds**: five `spore_puff`s go out in a wide fan, slow down and stop 3–5 tiles out, and hang there,
   drifting a little, for 4 s: soft walls of spores between you and her. Touching one hurts and poisons you (2 s).
2. **Needle bursts**: three quick fans of five `poison_needle`s aimed at you, 0.15 s apart. Each needle that hits
   poisons you for 1.5 s.

## Phase 2 — Rot (she pulls up her roots and moves)
1. **Acid globs**: four `acid_glob`s lobbed at and around you (each marked as it arcs). Where one lands it leaves a
   puddle of acid (radius 1.2) for 6 s that burns whoever stands in it. The island fills up; keep a way out.
2. **Lunging bite**: she lurches 3 tiles toward you (0.35 s), then her maw snaps: a ring of 12 `maw_fang`s that
   only reach 3.5 tiles. Don't be close when she lands; she is safest at range in this phase.
Movement: she drifts after you, slowly, staying on the island.

## Phase 3 — Sporestorm (rooted again, at the island's centre)
1. **Glowcap seeds**: four `glowcap_seed`s lobbed round the island. Each lands as a **sprout** (a small target,
   600 Life) that bursts into a sporeling after 3 s unless you kill it first. Shoot the sprouts.
2. **Toxic orbs**: a two-armed spiral of `toxic_orb`s; each orb stops after a moment, hangs, then darts straight
   at where you are. Keep moving across their lines.
3. **Spore clouds** return, seven of them.

## Death
The death clip; the loot fountain; the doors open; a portal home.

## Loot
Themed (boss tier): Bog Cleaver (sword, poisons), Sporecaller Wand (bolts that burst into small spores), Mycelial
Hide (leather: Defense, Vitality; poison can't touch you), Ring of Rot (Attack, Life), Spore Bomb (bellows: a dash
that leaves a poison cloud). Legendary (phase-3 kill, 2%): **Glowcap Crown** (ring: Life, Wisdom, Vitality; your
kills sprout a healing glowcap). Plus T6–T8 gear.

## Unique to it
Clouds of spores that hang where they stop; needles that poison; acid that pools where it lands; a lunge that ends
in a short-range bite; seeds that sprout into minions unless shot; orbs that stop, then dart. None is used by
another boss.

## Result (built)
- `src/bosses/mother_mycelia.js`. Checked in her arena (`tools/check_mirerot.mjs`): all 7 patterns; clouds hang,
  needles poison, acid pools, the lunge ends in the bite, seeds sprout and hatch, orbs stop and dart.
- Seen in the browser: the island with its pods and lights, each phase's form and every attack.
