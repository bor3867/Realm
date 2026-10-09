"""A unique 8x8 sprite for every untiered and mythic relic (not a recoloured tiered shape).

Letters: a/b/c = the relic's own dark/mid/light colours, d = its glow, h = highlight (shading adds it);
w/W wood, l/L leather, f/F cloth, k dark, g/G glass (the shared materials); plus accents:
e ember, r red, y gold, n bone, O orange, R crimson, Y bright gold, U blue, P pink, p plum, T teal, E violet.
The game outlines each icon and the shading pass lights it from the top-left.
"""

ACCENT = {'e': '#F2641A', 'r': '#D8283A', 'y': '#F2C14E', 'n': '#F0E8D8', 'O': '#FF8A1F', 'R': '#E0303A', 'Y': '#FFD650',
          'U': '#3A7AE8', 'P': '#E08AC8', 'p': '#B05A90', 'T': '#2AA8A0', 'E': '#B888FF'}

RELIC = {
    # ---------------------------------------------------------------- the Runeblade's and the Hexweaver's mythics
    'the_unbroken_oath': ['.abccba.', 'abcddcba', 'bcdYYdcb', 'bcYddYcb', 'bcdYYdcb', '.bcddcb.', '..bccb..', '...bb...'],
    'oathbreaker': ['......cc', '.....cdc', '....cdc.', '...cdc..', 'RR.dc...', '.RRc....', '.wRR....', 'w...R...'],
    'the_thirteenth_page': ['.aaaaaf.', '.abYbaf.', '.aYdYaf.', '.adddaf.', '.aYdYaf.', '.abYbaf.', '.aaaaaF.', '..FFFFF.'],
    'the_witchs_eye': ['....ccc.', '...cdkdc', '...cddc.', '....wc..', '...w....', '..w.....', '.w......', 'w.......'],
    # ---------------------------------------------------------------- swords
    'knuckle_of_the_unstruck': ['......ec', '.....ecb', '....ecb.', '.d.ecb..', '..deb...', '..kd....', '.k..d...', 'k.......'],
    'billet_of_the_first_oath': ['.....ddd', '.....dcb', '....ccb.', '.y.ccb..', '..ycb...', '..wy....', '.w..y...', 'w.......'],
    'abbots_claw': ['....cccc', '...cbbbc', '...cbbba', '..cbbba.', '.ydbba..', '.wy.....', 'w.y.....', '........'],
    'penitents_head': ['.....ccc', '....cbba', '...cbba.', '..cbba..', 'yyyba...', '.ywy....', '.w.y....', 'w.......'],
    'penitents_scourge': ['......c.', '.....c.c', '....c.c.', '...c.c..', '..yc....', '..wy....', '.w......', 'w.......'],
    'tallow_tongs': ['......e.', '.....eff', '....fcb.', '...fcb..', '.y.cb...', '..yb....', '.w..y...', 'w.......'],
    'godheart_knuckle': ['......cc', '.....crb', '....crb.', '.y.crb..', '..yrb...', '..wy....', '.w..y...', 'w.......'],
    'godheart_tongs': ['.....ccc', '....crrb', '...crrb.', '..crrb..', 'yy.rb...', '.yby....', '.w..y...', 'w.......'],
    'hammer_that_never_fell': ['.....dcd', '....cddc', '...cbbc.', '..cbbc..', 'yycbc...', '.yby....', '.w......', 'w.......'],
    'starfall_knuckles': ['.d...ccd', '....ccd.', '...ccb..', '..ccb.d.', '.ycb....', '..yd....', '.w......', 'w...d...'],
    'cinder_saints_fist': ['....e.ce', '.....ccb', '....eca.', '.y.cba..', '..ycb.e.', '..wy....', '.w..y...', 'w.......'],
    'quenching_tongs': ['......gg', '.....gcb', '....gcb.', '.y.gcb..', '..ygb...', '..wy....', '.w..y...', 'w.......'],
    'pitfighters_cleaver': ['....cccc', '...cbbbc', '..cbbbc.', '..cbbc..', '.wdbc...', '.ww.....', 'w.......', '........'],
    'oathsworn_greatsword': ['......cc', '.....cba', '....cba.', 'yy.cba..', '.yyba...', '..wyy...', '.w......', 'w.......'],
    # ---------------------------------------------------------------- daggers
    'the_last_reflection': ['........', '......gc', '.....gb.', '....gb..', '..rgb...', '..wr....', '.w......', '........'],
    'the_mirrorworld': ['.....g.g', '....gcgc', '...gcgc.', '..gcgc..', '.rgc....', '..wr....', '.w......', '........'],
    'the_feint': ['......c.', '.....cb.', '......cb', '.....cb.', '..rcb...', '..wr....', '.w......', '........'],
    'glassfencer_dirk': ['.......c', '......cb', '.....cb.', '..d.cb..', '..ddb...', '..wd....', '.w......', '........'],
    # ---------------------------------------------------------------- bows
    'leviathan_tine': ['..nf....', '.n.f....', 'n..f....', 'n..fbbbc', 'n..f....', 'n..f....', '.n.f....', '..nf....'],
    'kraken_bane': ['.rr.f...', 'r...f...', 'r...f...', 'r..dfbbc', 'r...f...', 'r...f...', 'r...f...', '.rr.f...'],
    'the_white_whale': ['..nnf...', '.n..f...', 'n...f..c', 'n...fbbc', 'n...f..c', 'n...f...', '.n..f...', '..nnf...'],
    'leviathan_longbow': ['.ccf....', 'c..f....', 'c..f....', 'c.dfbbbc', 'c..f....', 'c..f....', 'c..f....', '.ccf....'],
    # ---------------------------------------------------------------- staves
    'lantern_of_the_last_watch': ['....ccc.', '....cdc.', '....ccc.', '....w...', '...w....', '..w.....', '.w......', 'w.......'],
    'the_unburied_choir': ['....nnn.', '...nknkn', '....nnn.', '....w...', '...w..n.', '..w.....', '.w......', 'w.......'],
    'heaven_wire': ['......d.', '.....dcd', '....c.d.', '...cw...', '..c.w...', '...w....', '.w......', 'w.......'],
    'the_first_storm': ['...ccccc', '..ccccc.', '....d...', '...dw...', '..d.....', '..w.....', '.w......', 'w.......'],
    'the_bone_lantern': ['.....nn.', '....nkkn', '.....nn.', '....n...', '...n....', '..n.....', '.n......', 'n.......'],
    'the_lightning_rod': ['....d.d.', '.....cc.', '.....c..', '....c...', '...c....', '..c.....', '.c......', 'c.......'],
    'graverite_staff': ['.....dd.', '....dddd', '.....dd.', '....n...', '...n....', '..n.....', '.n......', 'n.......'],
    'tempest_staff': ['....c.dd', '....cddd', '.....cc.', '....w...', '...w....', '..w.....', '.w......', 'w.......'],
    # ---------------------------------------------------------------- wands
    'orrery_rod': ['....ccc.', '...c.d.c', '....ccc.', '....w...', '...w....', '..w.....', '.w......', '........'],
    'abbots_crozier': ['....ccc.', '...c...c', '.......c', '.....cc.', '....w...', '...w....', '..w.....', '.w......'],
    'godheart_scepter': ['....r.r.', '...rrrrr', '....rrr.', '.....r..', '....w...', '...w....', '..w.....', '.w......'],
    'sunless_psalter': ['.kkkkkk.', 'kkyyyykf', 'kky..ykf', 'kkyyyykf', 'kkkkkkkf', '.fffffff', '........', '........'],
    'dawnbreaker': ['....d.d.', '...dyyd.', '..dyyyyd', '...dyyd.', '....w...', '...w....', '..w.....', '.w......'],
    'the_eleventh_hour': ['......rr', '.....rrr', '......r.', '.....w..', '....w...', '...w....', '..w.....', '.w......'],
    'the_last_second': ['....ccc.', '.....d..', '....ccc.', '....w...', '...w....', '..w.....', '.w......', '........'],
    'the_cuckoo': ['....ww..', '...wkwO.', '....ww..', '....n...', '...n....', '..n.....', '.n......', '........'],
    'dawnchoir_wand': ['...yy.d.', '....ydd.', '.....d..', '....w...', '...w....', '..w.....', '.w......', '........'],
    'clockwork_wand': ['....y.y.', '...yyyyy', '....yky.', '...yyyyy', '....y.y.', '...w....', '..w.....', '.w......'],
    # ---------------------------------------------------------------- halos
    'the_last_noon': ['...d....', '.d.d.d..', '..yyy...', 'dyyyyyd.', '..yyy...', '.d.d.d..', '...d....', '........'],
    'eaten_halo': ['..cccc..', '.c....c.', 'c......c', 'c.......', 'c.......', 'c......c', '.c....c.', '..cccc..'],
    'wick_of_the_mother': ['..d.d.d.', '..f.f.f.', '.cccccc.', 'cc....cc', '.cccccc.', '........', '........', '........'],
    'stained_glass_halo': ['..rTyU..', '.P....r.', 'U......T', 'y......y', 'T......U', '.r....P.', '..UyTr..', '........'],
    'the_second_sun': ['..d.d.d.', '.dyyyyd.', 'dyykkyyd', '.ykkkky.', 'dyykkyyd', '.dyyyyd.', '..d.d.d.', '........'],
    'dawnchoir_halo': ['n......n', 'nn.cc.nn', '.nc..cn.', '..c..c..', '.nc..cn.', 'nn.cc.nn', 'n......n', '........'],
    # ---------------------------------------------------------------- bellows
    'censer_of_absolution': ['...c....', '...c..P.', '...c.P.P', '..ccc...', '.cbdbc..', '.cbbbc..', '..ccc...', '...c....'],
    'hymn_of_the_mire': ['T.......', 'TT......', '.TTT....', '..TTTTd.', '...TTTdd', '..TTTTd.', '.TT.....', '........'],
    'heralds_conch': ['....PPP.', '..PPpPPP', '.PPpPPPP', 'PPpPPPP.', 'PPPPPP..', '.PPPP...', '..PP....', '........'],
    'the_unbroken_bellows': ['yy....O.', '.yyyyy.O', '.YYYYYYb', 'lLlLlLbO', 'lLlLlLbc', '.yyyyyyb', 'yy....O.', '........'],
    'pitfighters_bellows': ['ww....c.', '.wwwww..', 'cWWWWWWb', 'lLlLlLbc', 'lLlLlLbc', 'cwwwwwwb', 'ww......', '........'],
    # ---------------------------------------------------------------- seals
    'the_turning_verse': ['...ww...', '.cccccc.', '.cdcdcc.', '.cccccc.', '.cdcdcc.', '.cccccc.', '...ww...', '...ww...'],
    'orrery_seal': ['..cccc..', '.cbbbbc.', 'cbbdbbbc', 'cbdddbbc', 'cbbdbbbc', '.cbbbbc.', '.U....U.', '.U....U.'],
    'unstruck_anvil': ['cccccccc', 'bbbbbbbb', '.bbbbb..', '..bbb...', '..bbb...', '.bbbbb..', 'bbbbbbb.', '........'],
    'the_first_anvil': ['d.cccccc', '.dbbbbbb', '..bbbbb.', '..bdbb..', '..bbbb..', '.bbbbbb.', 'bbbbbbbb', '........'],
    'oathsworn_seal': ['.cccccc.', 'cbbybbbc', 'cbbybbbc', 'cyyyyybc', 'cbbybbbc', '.cbybbc.', '..cbbc..', '...cc...'],
    # ---------------------------------------------------------------- reliquaries
    'choir_of_bones': ['.nn..nn.', 'nkkn.nkn', '.nn..nn.', 'bbbbbbbb', 'bwwwwwwb', 'bwnnnnwb', 'bwwwwwwb', 'bbbbbbbb'],
    'the_hollow_psalm': ['..dddd..', '.d....d.', '..yyyy..', '.yYYYYy.', '.yYkkYy.', '.yYYYYy.', '.yyyyyy.', '........'],
    'the_grave_of_kings': ['..yyyy..', '..y..y..', '.cccccc.', '.cbkkbc.', '.cbbbbc.', '.cbkkbc.', '.cbbbbc.', 'cccccccc'],
    'graverite_reliquary': ['.bbbbbb.', 'bbccccbb', 'bc.dd.cb', 'bc.dd.cb', 'bbccccbb', 'bwwwwwwb', 'bwwwwwwb', '.bbbbbb.'],
    # ---------------------------------------------------------------- grapple lines
    'drowned_mans_line': ['.LLLL...', 'L....L..', 'L.LL.L..', 'L....L..', '.LLLLc..', '.....c..', '...c.c..', '....cc..'],
    'abyssal_line': ['...ccc..', '...c.d..', '...c....', '...c....', '.d.c....', '.c.c....', '..cc....', '........'],
    'the_leviathans_maw': ['...nnn..', '..nnnnn.', '..nnnnn.', '...nnn..', '...nn...', '..nn....', '.nn.....', 'nn......'],
    'leviathan_line': ['...cc...', '...cc...', '...bb...', '...bb...', 'c..bb..c', 'cc.bb.cc', '.cbbbbc.', '..dddd..'],
    # ---------------------------------------------------------------- mirrors
    'hall_of_mirrors': ['bbb.bbb.', 'bgb.bgb.', 'bgb.bgb.', 'bbb.bbb.', '...bbb..', '...bgb..', '...bgb..', '...bbb..'],
    'cracked_looking_glass': ['..bbbb..', '.bggkgb.', '.bgkggb.', '.bggkgb.', '..bbbb..', '...bb...', '...ww...', '...ww...'],
    'the_infinite_reflection': ['bbbbbbbb', 'bggggggb', 'bgbbbbgb', 'bgbggbgb', 'bgbggbgb', 'bgbbbbgb', 'bggggggb', 'bbbbbbbb'],
    'glassfencer_mirror': ['..bbbb.c', '.bggggc.', '.bggcgb.', '.bgcggb.', '.cbbbb..', 'c..bb...', '...ww...', '...ww...'],
    # ---------------------------------------------------------------- kites
    'the_thunderhead': ['.cccc...', 'ccccccc.', 'cccccccc', '.cdccc..', '..d.....', '.d.L....', '....L...', '.....L..'],
    'the_squall': ['...cb...', '..ccbb..', '...cb...', '....k...', '.....L..', '....d.L.', '.......L', '......d.'],
    'the_eye_of_the_storm': ['...cc...', '..cccc..', '.ccnncc.', 'cccnkncc', '.ccnncc.', '..cccc..', '...cc...', '....k...'],
    'tempest_kite': ['.cb..cb.', 'ccbbccbb', '.cb..cb.', '..k..k..', '...kk...', '...L....', '....L...', '.....L..'],
    # ---------------------------------------------------------------- stopwatches
    'the_broken_hourglass': ['.cccccc.', '..gggg..', '...gg...', '...kg...', '..g.kg..', '..gggg..', '.cccccc.', '........'],
    'the_unwound_spring': ['cccccc..', '.....c..', '.cccc...', '.c......', '..cccc..', '.....c..', '.cccccc.', '........'],
    'the_hourglass_of_sand': ['.cccccc.', '..yyyy..', '...yy...', '...yy...', '..y..y..', '..yyyy..', '.cccccc.', '........'],
    'clockwork_stopwatch': ['...cc...', '..cccc..', '.cfffkc.', 'cfffkffc', 'cffkfffc', 'cfffffyc', '.cffffc.', '..cccc..'],
    # ---------------------------------------------------------------- heavy armour
    'rime_headsman_plate': ['.kkkkkk.', 'kbbbbbbk', '.bbccbb.', '.bcddcb.', '.bbccbb.', '..bbbb..', '.aaaaaa.', '..aaaa..'],
    'gilded_penance': ['cbb..bbc', 'cbbbbbbc', '.ybbbby.', '.bybbyb.', '.bbyybb.', '..bybb..', '.aaaaaa.', '..aaaa..'],
    'rime_standard': ['c.....dd', 'cbb..bdd', 'cbbbbbdb', '.bbccbd.', '.bbccb..', '..bccb..', '.aaaaaa.', '..aaaa..'],
    'furnace_heart_coat': ['.bb..bb.', 'bbbbbbbb', 'bbbOObbb', 'bbOddObb', 'bbbOObbb', 'bbbbbbbb', 'bbb..bbb', 'bbb..bbb'],
    'tidewoven_coat': ['.bb..bb.', 'bTbbbbTb', 'bbTbbTbb', 'bbbTTbbb', 'bbTbbTbb', 'bTbbbbTb', 'bbb..bbb', 'bbb..bbb'],
    'godforged_plate': ['ybb..bby', 'ybbbbbby', '.bbrrbb.', '.brddrb.', '.bbrrbb.', '..bbbb..', '.yyyyyy.', '..yyyy..'],
    'heartbreak_coat': ['.bb..bb.', 'bbbbbbbb', 'bbrrbrrb', 'bbrrrrrb', 'bbbrkrbb', 'bbbbrbbb', 'bbb..bbb', 'bbb..bbb'],
    'bellwrights_mail': ['...cc...', '..cbbc..', '.cbbbbc.', '.cbbbbc.', 'cbbbbbbc', 'cccccccc', '...dd...', '...dd...'],
    'pitfighters_harness': ['.bL..Lb.', 'bbLbbLbb', 'bbbLLbbb', 'bbbddbbb', 'bbbLLbbb', 'bbLbbLbb', '.bb..bb.', '........'],
    'oathsworn_bulwark': ['.cccccc.', 'cbbbbbbc', 'cbbybbbc', 'cbyyybbc', 'cbbybbbc', 'cbbybbbc', '.cbbbbc.', '..cccc..'],
    # ---------------------------------------------------------------- leather
    'whalers_slicker': ['..bbbb..', '.bkkkkb.', 'bbbbbbbb', 'bbbcbbbb', 'bbbcbbbb', 'bbbcbbbb', 'bbb..bbb', 'bbb..bbb'],
    'silvered_duelcoat': ['.bb..bb.', 'bcbbbbcb', 'bbcbbcbb', 'bbbccbbb', 'bbcbbcbb', 'bcbbbbcb', 'bbb..bbb', 'bbb..bbb'],
    'the_sea_wolf': ['ffffffff', 'bfbbbbfb', 'bbbddbbb', 'bbbbbbbb', 'bbbkkbbb', 'bbbbbbbb', 'bbb..bbb', 'bbb..bbb'],
    'leviathan_hide': ['.bb..bb.', 'bcbcbcbb', 'cbcbcbcb', 'bcbcbcbb', 'cbcbcbcb', 'bcbcbcbb', 'bbb..bbb', 'bbb..bbb'],
    'glassfencer_jerkin': ['.bb..bb.', 'bbbffbbb', 'bbbgfbbb', 'bbbffbbb', 'bbbgfbbb', 'bbbffbbb', '.bb..bb.', '........'],
    # ---------------------------------------------------------------- robes
    'salt_widows_veil': ['..ffff..', '.ffffff.', '.fkffkf.', '.ffffff.', '..bbbb..', '.bbbbbb.', 'bbbbbbbb', 'b.b..b.b'],
    'tallow_vestment': ['..bffb..', '.bbffbb.', 'bbbffbbb', 'bdbffbdb', 'bbbffbbb', 'bbbffbbb', 'bdbffbdb', 'b.b..b.b'],
    'rose_window_vestment': ['..bbbb..', '.bbbbbb.', 'bbRUYbbb', 'bbUYRbbb', 'bbYRUbbb', 'bbbbbbbb', 'bbbbbbbb', 'dddddddd'],
    'heartstring_vestment': ['..bffb..', '.bbrrbb.', 'bbbrrbbb', '.bbrrbb.', '.bbrrbb.', 'bbbrrbbb', 'bbbrrbbb', 'rrrrrrrr'],
    'gravewardens_pall': ['..bbbb..', '.bkkkkb.', '.bkddkb.', 'bbbbbbbb', 'bdbbbbdb', 'bbbbbbbb', 'bdbbbbdb', 'b.bb.bb.'],
    'the_mourners_veil': ['..kkkk..', '.kkkkkk.', '.kkkdkk.', '.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'k.kk.kk.'],
    'the_tempest_cloak': ['..bbbb..', '.bkkkkb.', 'bccbbccb', 'bbbbdbbb', 'bbbddbbb', 'bccdbccb', 'bbbbbbbb', 'b.b..b.b'],
    'the_gearmail': ['..bbbb..', '.bbbbbb.', 'bbyyybbb', 'byykyybb', 'bbyyybbb', 'bbbbbbbb', 'bbbbbbbb', 'yyyyyyyy'],
    'dawnchoir_robe': ['..ffff..', '.ffffff.', 'ffyyyfff', 'fyydyyff', 'ffyyyfff', 'ffffffff', 'ffffffff', 'yyyyyyyy'],
    'graverite_shroud': ['..bbbb..', '.bkkkkb.', 'bbnbbnbb', 'bbnnnnbb', 'bbnbbnbb', 'bbnnnnbb', 'bbbbbbbb', 'b.bb.bb.'],
    'tempest_robe': ['..bbbb..', '.bbbbbb.', 'bcccbbbb', 'bbbbcccb', 'bdbbbbbb', 'bbbbbdbb', 'bbbbbbbb', 'cccccccc'],
    'clockwork_robe': ['..bbbb..', '.bbbbbb.', 'bbcccbbb', 'bbckcbbb', 'bbcccbbb', 'bbbybbbb', 'bbbybbbb', 'yyyyyyyy'],
    # ---------------------------------------------------------------- rings
    'pilgrims_pearl': ['...nn...', '..nnnn..', '...nn...', '.cc..cc.', 'c......c', 'c......c', '.c....c.', '..cccc..'],
    'bell_of_the_taken': ['...cc...', '..cbbc..', '..cbbc..', '.cbbbbc.', 'cccccccc', '...dd...', '........', '........'],
    'trap_hound_collar': ['.c.c.c..', 'cccccccc', 'c......c', 'c......c', 'cccccccc', '.c.c.cd.', '......d.', '........'],
    'antler_crown': ['c.c..c.c', '.cc..cc.', '..cccc..', '..d..d..', '..cccc..', '........', '........', '........'],
    'pearl_of_the_drowned_mass': ['...kk...', '..kkkk..', '..kkkk..', '...kk...', '.T....T.', 'T......T', '.T....T.', '..TTTT..'],
    'starless_band': ['..kkkk..', '.kk..kk.', 'kk....kk', 'k......k', 'kk....kk', '.kk..kk.', '..kkkk..', '........'],
    'bellringers_rope': ['..LLLL..', '.L....L.', 'L......L', 'L......L', '.L....L.', '..LLLL..', '...LL...', '..L..L..'],
    'kintsugi_band': ['..cccc..', '.cy..cc.', 'c......y', 'y......c', 'c......c', '.cc..yc.', '..ccyc..', '........'],
    'drowned_bell': ['...cc...', '..cccc..', '.cccccc.', '.cccccc.', 'cccccccc', '...TT...', '..T..T..', '........'],
    'crown_of_the_fallen': ['.c.c.c.c', '.cdcdcdc', '.ccccccc', '.cbbbbbc', '.ccccccc', '........', '........', '........'],
    'shard_of_the_first_star': ['...cc...', '...cc...', 'cccccccc', '.ccddcc.', '..cccc..', '.cc..cc.', 'cc....cc', '........'],
    'ring_of_the_undertow': ['..cccc..', '.c....c.', 'c..TT..c', 'c.T..T.c', 'c..T...c', '.c....c.', '..cccc..', '........'],
    'gravedust_band': ['...nn...', '..nkkn..', '...nn...', '.cc..cc.', 'c......c', 'c......c', '.c....c.', '..cccc..'],
    'emilys_scarf': ['.PPPPPP.', 'PpPpPpPP', 'P......P', 'PPPPPPPP', '.....PP.', '.....PP.', '.....pp.', '........'],
    'rubber_duck': ['...ccc..', '..ccckc.', '..ccccdd', '...ccc..', 'c.ccccc.', 'cccccccc', '.bbbbbbb', '..bbbbb.'],
    'the_conductors_band': ['......k.', '.....kk.', '...cckc.', '.cc.k.cc', 'c..kk..c', 'c......c', '.c....c.', '..cccc..'],
    'ring_of_the_first_flame': ['...dd...', '..dOOd..', '...dd...', '.cc..cc.', 'c......c', 'c......c', '.c....c.', '..cccc..'],
    'ring_of_still_waters': ['...T....', '..TTT...', '..TgT...', '...T....', '.cc..cc.', 'c......c', '.c....c.', '..cccc..'],
    'band_of_the_open_hand': ['.c.c.c..', '.c.c.c.c', '.c.c.c.c', '.ccccccc', 'cccccccc', '.cccccc.', '..cccc..', '...cc...'],
    'crown_of_the_unstruck': ['y..y..y.', 'yy.y.yy.', 'yyyyyyy.', 'yrydyry.', 'yyyyyyy.', '........', '........', '........'],
}

for k, rows in RELIC.items():
    assert len(rows) == 8 and all(len(r) == 8 for r in rows), k
