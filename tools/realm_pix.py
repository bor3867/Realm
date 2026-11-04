# The realm's enemies in the user's sprites (2026-11-03, art/source/castle3/sheet_realm_a/b.png, matched in
# docs/realm_sprite_map.md), hand-animated as the castle's were: each a text file art/source/realm/pix/<id>.txt, its base
# cut from the sheet (tools/sheet_crops.py enemies), its walk and attack frames drawn below it pixel by pixel (the
# format: tools/castle_pix.py). Nothing turned, stretched or slid apart.
#   py -I tools/realm_pix.py dump <id> ...     the base frame from art/source/realm/native/<id>.png
#   py -I tools/realm_pix.py build [preview]   art/bundle/realmfoes/realm_user.png + atlas_realm_user.json ('realm_user/<id>')
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, here)
import castle_pix as C  # noqa: E402
C.SRC = os.path.join(root, 'art', 'source', 'realm'); C.PIX = os.path.join(C.SRC, 'pix'); C.OUT = os.path.join(root, 'art', 'bundle', 'realmfoes')
C.SHEET, C.TITLE = 'realm_user', "The realm's monsters, the user's art, hand-animated"
C.IDS = ['shore_crab', 'rf_coral_crab', 'driftwood_bandit', 'tide_herald', 'siren', 'conch_hermit', 'reef_golem', 'trap_hound',
  'bramble_wolf', 'briar_bee', 'spore_puff', 'thornwood_stag', 'spider_queen', 'bark_spider', 'bandit_archer', 'orc_warlord', 'hedge_goblin', 'goblin_shaman', 'wild_boar',
  'rock_troll', 'crag_dwarf', 'crystal_golem', 'cairn_crawler', 'rf_ash_golem', 'glacier_headsman', 'wolf_shield', 'rime_herald', 'frost_skald', 'cinder_golem',
  'fallen_knight', 'gilded_lancer', 'abyss_hound', 'rf_grove_warden', 'rf_sproutling', 'rf_bog_witch', 'rf_marsh_lurker', 'elder_willow',
  'brine_pilgrim', 'lantern_jelly', 'salt_widow', 'pilgrim_elder', 'anchor_bearer', 'lens_moth', 'lighthouse_jelly', 'salt_matriarch', 'trap_hound_alpha', 'anchor_titan', 'moth_queen', 'reef_eel', 'brine_slime', 'brine_slimelet', 'tide_slime', 'gull', 'rf_drowned_chorister', 'kraken_tentacle',
  'bell_taken', 'peat_saint', 'mire_choir', 'lantern_heron', 'candle_mite', 'bog_abbess', 'bog_bellringer', 'mourning_willow', 'grave_leech', 'great_bell', 'peat_martyr', 'mire_chorus', 'twin_lamp_heron', 'tallow_matron', 'leech_prime', 'bog_toad', 'gas_bloat', 'rf_gravekeeper', 'frozen_executioner', 'prayer_monk', 'antlered_hush', 'rune_warden', 'saga_singer', 'shieldwall_pack', 'frost_wraith', 'cairn_mender', 'stone_harpy', 'mountain_ram', 'crag_ogre', 'cave_bat', 'storm_gryphon', 'rf_smelter_imp', 'rf_frost_wraith', 'rf_ice_golem', 'rf_ashen_acolyte', 'rf_penitent_wraith', 'rf_bailiff_automaton', 'rf_clockwork_clerk', 'rf_glass_wraith', 'rf_prism_sentinel', 'hollow_thane', 'censer_magistrate', 'halo_eater', 'choir_engine', 'fallen_choirmaster', 'gilded_penitent', 'cherub_husk', 'reliquary_spider', 'hollow_jarl', 'halo_glutton', 'cathedral_engine', 'seraph_husk', 'broodmother', 'ash_harpy', 'rift_wraith', 'blood_maw', 'gazer', 'obsidian_scorpion', 'void_seer', 'rf_star_wisp', 'rf_crater_crawler', 'rf_sun_acolyte', 'rf_moon_acolyte', 'rf_the_unmaker_s_eye', 'rf_ember_drake', 'rf_cinder_imp', 'rf_hollow_knight', 'rf_crownless_wraith', 'rf_stagehand_shade', 'rf_phantom_usher', 'glass_scarab', 'dune_lurker', 'salt_mummy', 'sand_skimmer', 'glass_sphinx', 'mirage_caller', 'rf_dune_stalker', 'rf_sand_scarab', 'thorn_sprite', 'witch_of_briars', 'orc_brute', 'forest_druid', 'mossback_turtle', 'rf_dusk_moth', 'rf_pale_sprite', 'prism_hawk', 'shard_crawler', 'quartz_jackal', 'geode_titan', 'skyglass_seer', 'rf_gale_harpy', 'rf_thunder_hawk', 'rf_weightless_monk', 'rf_drifting_bell', 'rf_hour_warden', 'rf_sand_wisp', 'rf_star_cartographer', 'rf_comet_hound', 'rf_vine_creeper', 'rf_lantern_jack', 'rf_ink_wraith', 'rf_paper_crane']   # (by land as each is drawn)

if __name__ == '__main__':
    if sys.argv[1] == 'dump': [C.dump(i) for i in sys.argv[2:]]
    elif sys.argv[1] == 'build':
        C.build(sys.argv[2] if len(sys.argv) > 2 else None)
        ip = os.path.join(root, 'art', 'bundle', 'index.json'); idx = json.load(open(ip, encoding='utf8'))
        if 'realmfoes/atlas_realm_user.json' not in idx['atlases']:
            idx['atlases'].append('realmfoes/atlas_realm_user.json'); json.dump(idx, open(ip, 'w', encoding='utf8', newline='\n'), indent=1)
