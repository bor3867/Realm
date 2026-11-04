# The realm's remaining monsters (the user's seven land sheets, 2026-11-03: "do them all in one pass"): each one's frames
# drawn pixel by pixel from its own base, by the same rules a hand would follow for its kind (no part turned, stretched or
# slid as a piece of the picture):
#   walk   - a creature on feet or legs (its lowest rows broken into separate feet): one set of feet drawn a pixel raised,
#            then the other (each foot's pixels redrawn a row up, its old lowest row rubbed out, the body above kept);
#            one on a hem, a skirt or a blob's base: its left half's hem drawn a pixel up, then its right
#   attack - its own brightest colours (lanterns, eyes, crystals, flames) drawn at its brightest, then sparks of that
#            light thrown off its brightest points, then the light settling
# Writes each pix file's frames after its base (art/source/realm/pix/<id>.txt), then py -I tools/realm_pix.py build.
#   py -I tools/realm_frames_auto.py [id ...]
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_shore import PIX  # noqa: E402

LANDS = {
    'fen': ['bell_taken', 'peat_saint', 'mire_choir', 'lantern_heron', 'candle_mite', 'bog_abbess', 'bog_bellringer', 'mourning_willow', 'grave_leech', 'great_bell', 'peat_martyr',
            'mire_chorus', 'twin_lamp_heron', 'tallow_matron', 'leech_prime', 'bog_toad', 'gas_bloat', 'rf_gravekeeper'],
    'runeholt': ['frozen_executioner', 'prayer_monk', 'antlered_hush', 'rune_warden', 'saga_singer', 'shieldwall_pack', 'frost_wraith', 'cairn_mender', 'stone_harpy', 'mountain_ram', 'crag_ogre', 'cave_bat',
                 'storm_gryphon', 'rf_smelter_imp', 'rf_frost_wraith', 'rf_ice_golem', 'rf_ashen_acolyte', 'rf_penitent_wraith', 'rf_bailiff_automaton', 'rf_clockwork_clerk', 'rf_glass_wraith', 'rf_prism_sentinel'],
    'godfall': ['hollow_thane', 'censer_magistrate', 'halo_eater', 'choir_engine', 'fallen_choirmaster', 'gilded_penitent', 'cherub_husk', 'reliquary_spider', 'hollow_jarl', 'halo_glutton',
                'cathedral_engine', 'seraph_husk', 'broodmother', 'ash_harpy', 'rift_wraith', 'blood_maw', 'gazer', 'obsidian_scorpion', 'void_seer', 'rf_star_wisp',
                'rf_crater_crawler', 'rf_sun_acolyte', 'rf_moon_acolyte', 'rf_the_unmaker_s_eye', 'rf_ember_drake', 'rf_cinder_imp', 'rf_hollow_knight', 'rf_crownless_wraith', 'rf_stagehand_shade', 'rf_phantom_usher'],
    'dunes': ['glass_scarab', 'dune_lurker', 'salt_mummy', 'sand_skimmer', 'glass_sphinx', 'mirage_caller', 'rf_dune_stalker', 'rf_sand_scarab'],
    'thornwood': ['thorn_sprite', 'witch_of_briars', 'orc_brute', 'forest_druid', 'mossback_turtle', 'rf_dusk_moth', 'rf_pale_sprite'],
    'steppe': ['prism_hawk', 'shard_crawler', 'quartz_jackal', 'geode_titan', 'skyglass_seer', 'rf_gale_harpy', 'rf_thunder_hawk', 'rf_weightless_monk', 'rf_drifting_bell',
               'rf_hour_warden', 'rf_sand_wisp', 'rf_star_cartographer', 'rf_comet_hound', 'rf_vine_creeper', 'rf_lantern_jack', 'rf_ink_wraith', 'rf_paper_crane'],
}
ALL = [i for L in LANDS.values() for i in L]
lum = lambda h: int(h[1:3], 16) * .3 + int(h[3:5], 16) * .59 + int(h[5:7], 16) * .11


def read(id_):
    t = open(os.path.join(PIX, id_ + '.txt'), encoding='utf8').read()
    head = t.split('\n# ---- drawn frames')[0].rstrip('\n')
    pal = {l.split()[0]: l.split()[1] for l in head.split('frame base')[0].split('\n') if len(l.split()) == 2 and l.split()[1].startswith('#')}
    rows = head.split('frame base\n')[1].strip('\n').split('\n')
    return head, pal, [list(r) for r in rows]


def feet(G):                                                 # the separate feet in its lowest three rows: runs of columns
    H, W = len(G), len(G[0]); band = range(max(0, H - 3), H)
    occ = [any(G[y][x] != '.' for y in band) for x in range(W)]
    runs, x = [], 0
    while x < W:
        if occ[x]:
            s = x
            while x < W and occ[x]: x += 1
            runs.append((s, x - 1))
        else: x += 1
    return runs


def raise_cols(G, cols):                                     # these columns' lowest three rows drawn a row higher (the body above kept where they'd leave a hole)
    H = len(G); N = [r[:] for r in G]; top = max(0, H - 3)
    for x in cols:
        for y in range(top, H):
            if G[y][x] != '.': N[y - 1][x] = G[y][x]
            elif y - 1 >= top: N[y - 1][x] = '.'
        N[H - 1][x] = '.'
    return N


def walks(G):
    W = len(G[0]); F = feet(G)
    if len(F) >= 2 and max(b - a + 1 for a, b in F) < W * 0.7:
        A = [x for k, (a, b) in enumerate(F) if k % 2 == 0 for x in range(a, b + 1)]
        B = [x for k, (a, b) in enumerate(F) if k % 2 == 1 for x in range(a, b + 1)]
    else:                                                    # (a hem or a base: its left half, then its right)
        xs = [x for x in range(W) if G[-1][x] != '.'] or list(range(W)); mid = (xs[0] + xs[-1]) // 2
        A = [x for x in range(xs[0], mid)]; B = [x for x in range(mid + 1, xs[-1] + 1)]
        A = A[:max(1, len(A) // 2)]; B = B[len(B) // 2:]       # (the outer quarter each side: the hem's ends lift, the middle stays)
    return raise_cols(G, A), raise_cols(G, B)


def attacks(G, pal):
    cols = sorted([k for k in pal if k not in ('A', 'B')], key=lambda k: -lum(pal[k]))
    hot, warm = cols[0], cols[1] if len(cols) > 1 else cols[0]
    H, W = len(G), len(G[0])
    a0 = [[hot if c == warm else c for c in r] for r in G]            # (its light at its brightest)
    a1 = [r[:] for r in a0]
    pts = [(x, y) for y in range(H) for x in range(W) if G[y][x] in (hot, warm)]
    if pts:                                                          # (sparks of it thrown off its brightest points: up, out to each side)
        for (x, y) in [min(pts, key=lambda p: p[1]), min(pts, key=lambda p: p[0]), max(pts, key=lambda p: p[0]), min(pts, key=lambda p: p[1] - abs(p[0] - W / 2))]:
            for dx, dy in ((0, -2), (-2, -1), (2, -1), (0, -3)):
                X, Y = x + dx, y + dy
                if 0 <= X < W and 0 <= Y < H and a1[Y][X] == '.': a1[Y][X] = hot; break
    a2 = [r[:] for r in G]
    for y in range(H):
        for x in range(W):
            if G[y][x] == warm and (x + y) % 2 == 0: a2[y][x] = hot   # (settling: half of it still bright)
    return a0, a1, a2


def write(id_):
    head, pal, G = read(id_)
    W = len(G[0])
    w1, w3 = walks(G); a0, a1, a2 = attacks(G, pal)
    out = ['', '# ---- drawn frames (tools/realm_frames_auto.py writes everything below)']
    for name, F in (('walk1', w1), ('walk3', w3), ('atk0', a0), ('atk1', a1), ('atk2', a2)):
        out.append(f'frame {name}'); out += [''.join(r) for r in F]; out.append('')
    big = len(G) > 30 or W > 40
    out += [f'clip move {5 if big else 7} base walk1 base walk3', f'clip shoot {7 if big else 8} atk0 atk1 atk2 base']
    open(os.path.join(PIX, id_ + '.txt'), 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(out) + '\n')


if __name__ == '__main__':
    ids = sys.argv[1:] or ALL
    for i in ids: write(i)
    print(len(ids), 'monsters')
