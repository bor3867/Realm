// The realm's voice: what monsters mutter mid-fight, what wanderers say, what the stones remember,
// and the quests people will pay you to do.

// ---- enemy speech. Said rarely and at random: on spotting you, mid-attack, when badly hurt, or dying.
// keys are enemy ids; biome lines are the fallback.
export const SPEECH = {
  brine_pilgrim: { see: ['Walk with us...', 'The tide takes all pilgrims.', 'Have you come to pray?'], hurt: ['Salt in the wound...'], die: ['The sea... keeps me...'] },
  lantern_jelly: { see: ['*blub*', 'Follow the light, little one.'], die: ['*pop*'] },
  bell_taken: { see: ['DONG.', 'The bell rings for you.'], atk: ['Toll! Toll!'], die: ['...the bell is silent.'] },
  peat_saint: { see: ['Kneel in the mud with me.', 'I was a saint, once.'], hurt: ['Bury me deeper!'] },
  frozen_executioner: { see: ['Next.', 'Your name is on my list.'], atk: ['Hold still.'], hurt: ['The axe is patient.'], die: ['...the block... is empty...'] },
  cairn_crawler: { see: ['*skitters*', 'Stones remember.'] },
  hollow_thane: { see: ['A warrior. Finally.', 'Draw.'], atk: ['For the hollow hall!'], hurt: ['Good. GOOD.'], die: ['Valhalla was... a lie...'] },
  censer_magistrate: { see: ['You are charged with trespass.', 'The court is in session.'], atk: ['Guilty.', 'Sentence: smoke.'], die: ['Case... dismissed...'] },
  salt_widow: { see: ['Is that you, my love?', 'He said he would come back.'], die: ['...tell him I waited.'] },
  trap_hound: { see: ['*growls*', 'Grr-RAH!'], die: ['*whimper*'] },
  mire_choir: { see: ['La la laaa...', 'Sing with us forever!'], atk: ['A HIGH NOTE!'] },
  lantern_heron: { see: ['Krrrk!', 'A fish with legs?'] },
  candle_mite: { see: ['Burn burn burn!', 'Hee hee!'], die: ['*fizzle*'] },
  prayer_monk: { see: ['Om...', 'Your path ends in this wheel.'], atk: ['Turn, wheel!'] },
  antlered_hush: { see: ['...', 'Shhh.'], die: ['...'] },
  halo_eater: { see: ['Hungry...', 'Is that a halo? Give it.'], atk: ['MINE!'] },
  choir_engine: { see: ['HYMN 404: NOT FOUND.', 'PLAYING HYMN.'], atk: ['FORTISSIMO.'], die: ['...end of... recording...'] },
  anchor_bearer: { see: ['Heavy. So heavy.', 'Drop anchor!'] },
  lens_moth: { see: ['Bright! Bright!', 'You are SO shiny.'] },
  mourning_willow: { see: ['Weep with me.', 'The rain never stops here.'] },
  grave_leech: { see: ['*slurp*', 'Warm blood!'] },
  frost_skald: { see: ['A saga needs a villain!', 'Hear the tale of your death!'], atk: ['Verse two!'], die: ['...the song... unfinished...'] },
  wolf_shield: { see: ['Shields up!', 'Hold the line!'], hurt: ['Break, but do not bend!'] },
  cherub_husk: { see: ['Hallelujah?', 'Little lamb...'] },
  reliquary_spider: { see: ['*click click click*'] },
  reef_eel: { see: ['Hssss!', 'The sand is MINE.'] },
  bog_toad: { see: ['Rrrribbit.', 'Croak. CROAK.', 'You smell like flies.'], atk: ['Hup!'], die: ['...ribbit...'] },
  frost_wraith: { see: ['Cold...', 'Join me in the ice.'], die: ['...thaw...'] },
  ash_harpy: { see: ['SCREEEE!', 'Fresh meat on the ash!'], atk: ['DIVE!'] },
  brine_slime: { see: ['*glorp*', 'Glorp glorp!'], die: ['*splits*'] },
  gas_bloat: { see: ['Hug? Hug!', 'I feel... full...'], atk: ['GOING TO POP!'] },
  cairn_mender: { see: ['The cairn will mend you.', 'Stand, brothers.'], atk: ['Rise!'], die: ['...stones... crumble...'] },
  gilded_lancer: { see: ['In the god\'s name!', 'Lance ready.'], atk: ['CHARGE!', 'Light of the gold!'], hurt: ['A scratch.'], die: ['The gold... tarnishes...'] },
  golden_duck: { see: ['Quack?', 'QUACK!'], hurt: ['Squeak!', 'SQUEAK!'], die: ['...quack.'] },
  training_dummy: { hurt: ['Ow.', 'Please.', 'I have a family.', 'Is this personal?', 'I am made of STRAW.', 'Tell my bucket I loved it.'] },
};
SPEECH.armored_dummy = { hurt: ['Clank.', 'You missed a spot.', 'Is that all?', 'I am wearing a POT.', 'Ow, but in metal.'] };
export const BIOME_SPEECH = {
  shore: { see: ['The sea remembers.', 'Drown!'], die: ['...the tide...'] },
  fen: { see: ['Sink.', 'Stay in the mire.'], die: ['...mud...'] },
  runeholt: { see: ['Cold steel.', 'For the runes!'], die: ['...frost...'] },
  godfall: { see: ['For the fallen god!', 'Gold! Gold!'], die: ['...gold... fading...'] },
  dunes: { see: ['Sand in your eyes!', 'The glass is hungry.'], die: ['...dust...'] },
  thornwood: { see: ['Lost? Good.', 'The wood takes you.'], die: ['...roots...'] },
  steppe: { see: ['Shatter!', 'Hear the hum?'], die: ['...cracking...'] },
  lowlands: { see: ['Off my field!', 'Trespasser!'], die: ['...the harvest...'] },
  forge: { see: ['STRIKE.', 'The fire is hungry.'], die: ['...cooling...'] },
  chapel: { see: ['Pray!', 'Mass is beginning.'], die: ['...amen...'] },
  heart: { see: ['The heart beats for you.', 'Ba-dum.'], die: ['...ba... dum...'] },
};
export const BOSS_SPEECH = {
  brine_cathedral: ['THE BELLS TOLL FOR THEE.', 'Enter. Pray. Drown.', 'My congregation hungers.', 'Confess, and be swallowed.'],
  wick_mother: ['Come closer, little moth.', 'My children are SO hungry.', 'Burn down with me.', 'Every wick ends in ash.'],
  orrery_of_winter: ['YOUR ORBIT DECAYS.', 'The stars align against you.', 'Absolute zero approaches.', 'I have calculated your death.'],
  penitent_colossus: ['I REMEMBER EVERY SIN.', 'KNEEL.', 'Penance is owed.', 'My hands broke a god.'],
  drowned_abbot: ['The mass will not be interrupted.', 'Hush. The water is rising.', 'Join the choir below.'],
  fallen_heart: ['BA-DUM.', 'I WAS A GOD.', 'YOU ARE SO SMALL.', 'FEEL IT BEAT.'],
  unstruck: ['THE FIRST BLOW IS MINE.', 'NEVER STRUCK. NEVER BROKEN.', 'THE ANVIL OPENS.'],
  emily_the_yapper: ['Oh! Hi! Okay so ANYWAY-', 'Did I tell you about my cousin?', 'Wait wait wait, I wasn\'t finished.',
    'So then I said to the Astrolabe, I said-', 'You\'re a GREAT listener.', 'This one time? At the ice shelf?',
    'Hold on, it gets better.', 'Sorry, where was I? Oh right. ME.', 'Fish fact! Fish are delicious.', 'Are you even listening?!',
    'Rude to leave mid-story!', 'Okay okay okay okay okay.', 'And THEN-', 'Don\'t interrupt! Ugh.', 'Snowball! Ha! Gotcha.',
    'My scarf? Knitted it myself.', 'Long story short- no wait, long story LONG.', 'Babies! Come say hi!', 'Wheeee!',
    'Not to brag, but I\'m VERY round.', 'Shh shh shh. My turn.', 'I can talk AND slide. Watch.'],
};
export const HERALD_SPEECH = ['Make way! Make way!', 'My master comes!', 'Kneel before the herald!', 'Hear ye! Hear ye!', 'You will not silence me!'];

// ---- wanderers in the realm: they talk, and each has a favour to ask
export const WANDERERS = {
  ossic: { name: 'Brother Ossic', title: 'a lost pilgrim', biome: 'shore', sprite: 'npc_pilgrim',
    lines: ['I set out for the chapel forty years ago. I think I took a wrong turn.', 'The eels stole my reliquary. It had my lunch in it.',
      'Do you know the way to the chapel? Never mind. I like it here now.', 'If you see a duck made of gold, do NOT trust it.'],
    quest: { kind: 'fetch', item: 'Ossic\'s Reliquary', desc: 'Find Brother Ossic\'s stolen reliquary somewhere on the Drowned Shore.', biome: 'shore', reward: { gold: 250, essence: 15, item: 'pilgrims_pearl' } } },
  fennick: { name: 'Mother Fennick', title: 'the bog hermit', biome: 'fen', sprite: 'npc_hermit',
    lines: ['The toads have been singing all night. ALL night.', 'Kill ten of them and I\'ll brew you something nice.',
      'My cauldron is older than the Wick-Mother. She was a lovely girl, once.', 'Mind the bog. It is hungrier than it looks.'],
    quest: { kind: 'hunt', target: 'bog_toad', n: 10, desc: 'Silence ten Bog Toads for Mother Fennick.', reward: { gold: 400, essence: 25, item: 'stat_vit' } } },
  ingrit: { name: 'Scholar Ingrit', title: 'frozen to the waist', biome: 'runeholt', sprite: 'npc_scholar',
    lines: ['I came to study the runes. The runes studied me back.', 'I am fine. I am FINE. I simply cannot feel my legs.',
      'The shrines are older than the god. Pray at a few and tell me what you feel.', 'Do not lick the monoliths. Trust me on this.'],
    quest: { kind: 'shrine', n: 3, desc: 'Pray at three shrines for Scholar Ingrit\'s research.', reward: { gold: 600, essence: 40, item: 'stat_wis' } } },
  laughing: { name: 'The Penitent Who Laughs', title: 'a madman in gold', biome: 'godfall', sprite: 'npc_penitent',
    lines: ['Ha! HA! The god is dead and we are all still here!', 'The Colossus owes me money. Ha!',
      'I counted the gold on the ground once. It took nine years. Ha!', 'Go open the camps. The guards are terrible at cards.'],
    quest: { kind: 'camp', n: 2, desc: 'Raid two guarded camps for the Penitent Who Laughs.', reward: { gold: 900, essence: 60, item: 'stat_att' } } },
};

// ---- lore stones: 28 of them across the realm. Read them all.
export const LORE = [
  'Before the realm there was the anvil, and the anvil had never been struck.',
  'The smiths drowned before the first blow. Their hammers still sink.',
  'A god that is never finished cannot die. It can only be interrupted.',
  'The Brine Cathedral was a church once. Then the tide came to Mass.',
  'Mother Fennick says the Wick-Mother was a lovely girl. Mother Fennick is lying.',
  'The Astrolabe predicted everything except the cold.',
  'The Colossus broke the god with its own hands, then wept until it turned to marble.',
  'Pilgrims say the sea is the god\'s tears. The sea says nothing. The sea is busy.',
  'There are four shrines in every land, and one god listening to none of them.',
  'Here lies Gerald. He touched the lava to see if it was hot. It was.',
  'If you can read this, you are standing too close to an Ash Harpy.',
  'The Salt-Peddler has never once been seen buying anything.',
  'Count the bells in Ashfen. There is always one more than there should be.',
  'A golden duck walks the shore. No one knows why. No one asks.',
  'The cat in the Nexus is older than the Nexus.',
  'These stones were placed by someone who really, really liked writing on stones.',
  // the Saltglass Dunes
  'When the god fell, the heat turned the eastern beach to glass. The wind has been sanding it down ever since.',
  'The Sphinx asks every traveller one riddle. Nobody has ever stayed long enough to hear it.',
  'Mirages in the dunes show you what you want. Mostly they show water. Sometimes, gold.',
  'Salt keeps the dead from rotting. The mummies are very grateful. They show it by chasing you.',
  // the Thornwood
  'The Thornwood was a garden once. Then nobody came back to prune it.',
  'The Witch of Briars plants a thorn for every traveller who gets lost. Look how many there are.',
  'Never eat the red berries. Never eat the white mushrooms. Honestly, just bring a sandwich.',
  'The great stag of the wood has antlers of living bramble. Its kills feed the forest.',
  // the Crystal Steppe
  "The god's blood crystallised where it fell. The steppe grew up through it.",
  'The Seers of Skyglass read the future in the crystals. It is mostly bad news.',
  'Crystal golems are not alive. Please tell them; they have not been told.',
  'At night the steppe hums one long note. The Geode Titans are singing. Do not join in.',
];

// ---- quest board: three offers each visit, up to three active at once
export const QUEST_HUNTS = {
  shore: ['brine_pilgrim', 'lantern_jelly', 'trap_hound', 'reef_eel', 'brine_slime'],
  fen: ['bell_taken', 'peat_saint', 'candle_mite', 'bog_toad', 'gas_bloat'],
  runeholt: ['frozen_executioner', 'cairn_crawler', 'frost_wraith', 'cairn_mender', 'wolf_shield'],
  godfall: ['hollow_thane', 'halo_eater', 'ash_harpy', 'gilded_lancer', 'reliquary_spider'],
};
export const FETCH_ITEMS = ['a waterlogged diary', 'a bag of very old teeth', 'the Peddler\'s spare hat', 'a jar of bottled lightning',
  'a love letter to the Astrolabe', 'a map with nothing on it', 'a sock (just one)', 'the deed to the Nexus'];
