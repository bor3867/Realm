# Count Vesper, the Crimson Count (the Crimson Keep)

## Arena: the Throne Room
40×40, marble checker, a carpet from the door to the throne, two rows of gothic pillars (cover), candelabras along
the walls. The doors lock when you step in. He stands before the throne.

## Numbers
200,000 Life, Defense 26, 11,000 XP. Shots 95–125. Phases at 66% / 33%.

## Phase 1 — Nobleman (he paces before the throne, unhurried)
1. **Blood bolts**: two volleys of three `blood_bolt`s aimed at you, a beat apart, the second leading you.
2. **Hedge of thorns**: a row of nine `rose_thorn`s takes root in a straight line between him and you, holds for a
   breath, then every thorn flies off sideways, half one way and half the other. Don't stand beside the hedge.
3. **The kneeling thralls**: on his first move (and once more at half his phase) two blood thralls kneel at the
   throne's sides; while one lives, every 2 s it heals him by 1% of his Life. They kneel and never move, so the
   candlelight can't help you with these: kill them.

## Phase 2 — Batstorm (his cape tears into wings; he hovers)
1. **Bat swarm**: a fan of `bat_swarm`s that weave as they fly (each its own way), three fans in a row.
2. **Scythes**: four great `blood_scythe` crescents thrown out wide that slow, stop and come wheeling back to him.
   They hit going out and coming back.
3. **The dash**: between volleys he dashes to a new spot (a red afterimage trails him), always somewhere you have
   a clear line to him.

## Phase 3 — Blood Beast (a hulking bat fiend at the centre)
1. **Blood rain**: three patches of the floor (3×3) darken red for 1 s, then rain `blood_rain` for 2 s; each patch
   then **leaves a blood pool** that stays (slow and drain). The floor fills with pools as the phase goes on.
2. **Sanguine nova**: rings of `sanguine_nova` pulse out from him: three rings, each with a gap a quarter-turn on.
3. **Blood bolts** return, three volleys.

## Death
The death clip; the pools dry; the loot fountain; the doors open; a portal home.

## Loot
Themed (boss tier, `d2_items`): Crimson Rapier (dagger: quick, a sip of lifesteal), Bloodthorn Staff (thorns that
burst), Batwing Bow (arrows that weave), Sanguine Cloak (leather: Life, Speed; drains when low), Signet of the Count
(Attack, Vitality), Crimson Chalice (reliquary: drink to heal and bleed your foes). Legendary (phase-3 kill, 2%):
**Nightfall Scythe** (sword: wide arcing reaps that pierce and drain). Plus T8–T10 gear.

## Unique to it
Healing thralls that kneel by the throne and burn in candlelight; a hedge of thorns that flies apart sideways;
weaving bat fans; scythes that go out and wheel back; a dash with an afterimage; blood rain on marked patches that
leaves pools behind; staggered nova rings. None is used by another boss.

## Result (built)
- `src/bosses/count_vesper.js` (shots from `bx2_shots`). Checked in the throne room (`tools/check_keep.mjs`): all
  patterns; the kneeling thralls heal him while they live, the hedge holds then flies apart, the bats weave, the
  scythes come back, he dashes with an afterimage, the rain patches leave blood pools (about 180 tiles of pool by
  the end of a long phase 3), the novas' gaps step a quarter-turn.
- Found while testing: the dash only checked between patterns in a state that lasts one frame, so it never
  happened; it now chooses its spot during the recovery pause.
