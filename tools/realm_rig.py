# The realm's monsters posed properly (2026-11-11, the user: "Most enemies still don't [have] an appropriate animation.
# They all need their own unique moving and attack animations. Not tilting sprites back and forth, real sprite
# animations ... proper poses for moving, attacking, and any special abilities (for example, a charge from a wolf)").
# The earlier pass (tools/realm_frames_auto.py) lifted one foot a pixel and then the other, and brightened the sprite to
# attack: it read as rocking. This draws each monster's frames from its own base pixel by pixel, by its body:
#   its legs found in its lowest rows and followed up to where each joins the body (its hip); each leg swung from the hip
#   (the foot furthest, the hip not at all, so it never comes away from the body)
#   walk   (four frames)  four legs or more: the diagonal pairs swing opposite ways, the body rising and dropping a pixel
#          between; two legs: a stride, then the other; a flier: its wings beat (down, level, up) round its body; a robe,
#          a blob or a hem: its hem swishes one way and back, its body bobbing
#   attack (six frames: three through its warning, three as it strikes)  the wind-up: it draws back and down (a flier:
#          back and up), its light kindling; the strike: it lunges forward past where it stood, legs braced behind it,
#          its head out in front, its light at its brightest; then it recovers
#   charge (four frames, for those that charge)  a gallop: legs flung out ahead and behind, the body low and long, then
#          gathered under it in the air
# Writes each pix file's frames after its base, then: py -I tools/realm_pix.py build [preview.png]
#   py -I tools/realm_rig.py [id ...]          (none: every monster tools/realm_frames_auto.py had done)
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here)
from realm_frames_auto import ALL, PIX, read, feet, lum  # noqa: E402

SYM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=@$'
FLY = set('ash_harpy blood_maw bog_abbess briar_bee cave_bat cherub_husk fallen_choirmaster frost_wraith gas_bloat gazer gull halo_eater halo_glutton lantern_heron lantern_jelly lens_moth lighthouse_jelly mire_choir mire_chorus moth_queen prism_hawk rift_wraith sand_skimmer seraph_husk siren skyglass_seer stone_harpy storm_gryphon thorn_sprite tide_herald twin_lamp_heron void_seer rf_star_wisp rf_dusk_moth rf_pale_sprite rf_gale_harpy rf_thunder_hawk rf_sand_wisp rf_paper_crane rf_drifting_bell rf_frost_wraith rf_glass_wraith rf_penitent_wraith rf_crownless_wraith rf_ink_wraith rf_lantern_jack rf_phantom_usher rf_stagehand_shade rf_the_unmaker_s_eye'.split())
CHARGE = {'cairn_crawler', 'mountain_ram', 'wild_boar', 'abyss_hound', 'quartz_jackal', 'rf_comet_hound', 'rf_dune_stalker', 'shard_crawler', 'storm_gryphon', 'rf_ember_drake'}


def blank(G): return [['.'] * len(G[0]) for _ in G]
def copy(G): return [r[:] for r in G]


def bounds(G):
    ys = [y for y, r in enumerate(G) if any(c != '.' for c in r)]; xs = [x for x in range(len(G[0])) if any(r[x] != '.' for r in G)]
    return xs[0], ys[0], xs[-1], ys[-1]


def legs_of(G):
    """each leg: {cells: [(x, y)], hip, foot}: from each foot in the lowest rows up its own columns till it joins the body"""
    H, W = len(G), len(G[0]); x0, y0, x1, y1 = bounds(G)
    F = []                                                         # (its feet: the lowest row, within five of the bottom, where its pixels part into two or more narrow runs)
    for yy in range(y1, max(y0, y1 - 5) - 1, -1):
        runs, x = [], 0
        while x < W:
            if G[yy][x] != '.':
                st = x
                while x < W and G[yy][x] != '.': x += 1
                runs.append((st, x - 1))
            else: x += 1
        R = [r for r in runs if r[1] - r[0] + 1 <= max(3, (x1 - x0 + 1) * 0.45)]
        if len(R) >= 2 and len(R) >= len(runs) - 1: F = R; break
    if len(F) < 2: return []
    out = []
    for a, b in F:
        yb = max(y for y in range(y0, y1 + 1) if any(G[y][x] != '.' for x in range(a, b + 1)))   # (this foot's own lowest row)
        if yb - y0 < (y1 - y0) * 0.6: continue                    # (not a foot: something hanging high)
        cells, lo, hi, y = [], a, b, yb
        width0 = b - a + 1
        while y >= y0:
            row = [x for x in range(max(0, lo - 1), min(W, hi + 2)) if G[y][x] != '.']
            if not row: break
            run = [x for x in range(min(row), max(row) + 1)]
            if len(run) > width0 + 3 or y < yb - (y1 - y0) * 0.55: break            # (the body begins: its hip)
            if any(o for o in out if any(c[1] == y and min(run) <= c[0] <= max(run) for c in o['cells'])): break
            cells += [(x, y) for x in run if G[y][x] != '.']; lo, hi = min(run), max(run); y -= 1
        if cells and yb - y >= 2: out.append({'cells': cells, 'hip': y, 'foot': yb, 'x': (a + b) / 2})
    return out if len(out) >= 2 else []


def compose(G, legs, body_dx=0, body_dy=0, swing=None, lift=None, front=None, front_dx=0, front_dy=0):
    """the body (everything not a leg) moved by (body_dx, body_dy), its front part (x >= front) a further (front_dx, front_dy);
    each leg swung from its hip (its foot moved swing[k] across, lift[k] up), drawn behind the body"""
    H, W = len(G), len(G[0]); N = blank(G); legcells = {c for L in legs for c in L['cells']}
    for k, L in enumerate(legs):                                   # the legs, each from its hip down, its foot swung
        s = (swing or {}).get(k, 0); up = (lift or {}).get(k, 0); span = max(1, L['foot'] - L['hip'])
        for (x, y) in L['cells']:
            t = (y - L['hip']) / span; X = x + round(s * t) + body_dx * (1 - t > 0.5); Y = y - round(up * t)
            if 0 <= X < W and 0 <= Y < H: N[Y][X] = G[y][x]
    for y in range(H):                                             # the body over them
        for x in range(W):
            if G[y][x] == '.' or (x, y) in legcells: continue
            dx, dy = body_dx, body_dy
            if front is not None and x >= front: dx += front_dx; dy += front_dy
            X, Y = x + dx, y + dy
            if 0 <= X < W and 0 <= Y < H: N[Y][X] = G[y][x]
    if body_dy > 0:                                                # (the body dropped: the top of each leg joins it again)
        for L in legs:
            for (x, y) in L['cells']:
                if y == L['hip'] + 1:
                    for d in range(1, body_dy + 1):
                        if 0 <= y - d + body_dy < H and N[y][x] == '.': N[y][x] = G[y][x]
    return N


def shear_cols(G, cx, s, rows=None):
    """a flier's wings: every column moved up or down by how far it is from its body's middle (s at its tips)"""
    H, W = len(G), len(G[0]); N = blank(G); x0, y0, x1, y1 = bounds(G); half = max(1, max(cx - x0, x1 - cx)); core = half * 0.35
    for y in range(H):
        for x in range(W):
            if G[y][x] == '.': continue
            d = abs(x - cx); t = max(0.0, (d - core) / max(1, half - core))
            Y = y - round(s * t) if (rows is None or y in rows) else y
            if 0 <= Y < H and (N[Y][x] == '.' or t == 0): N[Y][x] = G[y][x]
    return N


def hem(G, s):
    """a robe, a blob, a hem: its lowest rows swung s across (the further down, the more)"""
    H, W = len(G), len(G[0]); x0, y0, x1, y1 = bounds(G); N = blank(G); top = y1 - max(2, (y1 - y0) // 4)
    for y in range(H):
        for x in range(W):
            if G[y][x] == '.': continue
            t = max(0.0, (y - top) / max(1, y1 - top)); X = x + round(s * t)
            if 0 <= X < W: N[y][X] = G[y][x]
    return N


def shift(G, dx, dy):
    H, W = len(G), len(G[0]); N = blank(G)
    for y in range(H):
        for x in range(W):
            if G[y][x] != '.' and 0 <= x + dx < W and 0 <= y + dy < H: N[y + dy][x + dx] = G[y][x]
    return N


def recolor(G, M): return [[M.get(c, c) for c in r] for r in G]


def write(id_):
    head, pal, G = read(id_)
    H, W = len(G), len(G[0]); x0, y0, x1, y1 = bounds(G); cx = (x0 + x1) // 2
    # its light: the two brightest colours (not the outline), and a brighter one of each (added to its palette)
    cols = sorted([k for k in pal if k not in ('A', 'B')], key=lambda k: -lum(pal[k]))
    used = set(pal); free = [c for c in SYM if c not in used]; extra = {}
    def brighter(h, k=1.35): return '#' + ''.join(f'{min(255, int(int(h[i:i + 2], 16) * k + 18)):02x}' for i in (1, 3, 5))
    glowM = {}
    for k in cols[:2]:
        b = brighter(pal[k]); have = [q for q, v in pal.items() if v == b]   # (a re-run finds the brighter colour it added before)
        if have: glowM[k] = have[0]
        elif free: s = free.pop(0); extra[s] = b; glowM[k] = s
    kindle = {k: v for i, (k, v) in enumerate(glowM.items()) if i == 0}
    legs = legs_of(G) if id_ not in FLY else []
    kind = 'fly' if id_ in FLY else 'legs' if legs else 'hem'
    big = H > 30 or W > 40; s = 2 if (y1 - y0) > 14 else 1
    order = sorted(range(len(legs)), key=lambda k: legs[k]['x'])
    A = {k: 1 for i, k in enumerate(order) if i % 2 == 0}; B = {k: 1 for i, k in enumerate(order) if i % 2 == 1}
    front = x0 + (x1 - x0) * 2 // 3                                 # (its front: the bundle's art faces right)
    head_room = y0; foot_room = H - 1 - y1
    F = {}
    if kind == 'legs':
        sw = lambda a, b: {**{k: a for k in A}, **{k: b for k in B}}
        F['walk1'] = compose(G, legs, swing=sw(s, -s), lift={k: 1 for k in B})
        F['walk2'] = compose(G, legs, body_dy=1)
        F['walk3'] = compose(G, legs, swing=sw(-s, s), lift={k: 1 for k in A})
        F['walk4'] = compose(G, legs, body_dy=1)
        move = ['walk1', 'walk2', 'walk3', 'walk4']
        F['atk0'] = compose(G, legs, body_dx=-1, body_dy=1, swing={k: 1 for k in range(len(legs))})
        F['atk1'] = recolor(compose(G, legs, body_dx=-2, body_dy=1, swing={k: 1 for k in range(len(legs))}, front=front, front_dy=-1 if head_room else 0), kindle)
        F['atk2'] = recolor(compose(G, legs, body_dx=-2, body_dy=1, swing={k: 2 for k in range(len(legs))}, front=front, front_dy=-1 if head_room else 0), glowM)
        F['atk3'] = recolor(compose(G, legs, body_dx=2, swing={k: -2 for k in range(len(legs))}, front=front, front_dx=1), glowM)
        F['atk4'] = recolor(compose(G, legs, body_dx=1, swing={k: -1 for k in range(len(legs))}), kindle)
        F['atk5'] = compose(G, legs, body_dy=1)
        if id_ in CHARGE:
            F['run1'] = compose(G, legs, body_dx=1, swing=sw(3, -3), front=front, front_dy=1)
            F['run2'] = compose(G, legs, body_dy=-1 if head_room else 0, swing=sw(-1, 1), lift={k: 1 for k in range(len(legs))})
            F['run3'] = compose(G, legs, body_dx=1, swing=sw(-3, 3), front=front, front_dy=1)
            F['run4'] = F['run2']
    elif kind == 'fly':
        up = 2 if (x1 - x0) > 14 else 1
        F['walk1'] = shear_cols(G, cx, up)                          # (wings up)
        F['walk2'] = shift(G, 0, 1) if foot_room else G
        F['walk3'] = shear_cols(shift(G, 0, 1) if foot_room else G, cx, -up)   # (wings down, the body lifted by the beat)
        F['walk4'] = G
        move = ['walk1', 'walk2', 'walk3', 'walk4']
        r = -1 if head_room else 0
        F['atk0'] = shift(shear_cols(G, cx, up), -1, r)
        F['atk1'] = recolor(shift(shear_cols(G, cx, up + 1), -2, r), kindle)
        F['atk2'] = recolor(shift(shear_cols(G, cx, up + 1), -2, r), glowM)
        F['atk3'] = recolor(shift(shear_cols(G, cx, -up), 2, 1 if foot_room else 0), glowM)
        F['atk4'] = recolor(shift(G, 1, 0), kindle)
        F['atk5'] = G
        if id_ in CHARGE:                                           # (a dive: wings swept back, the body driving down and forward)
            F['run1'] = shift(shear_cols(G, cx, up + 1), 1, 1 if foot_room else 0); F['run2'] = shift(shear_cols(G, cx, -up), 1, 0); F['run3'] = F['run1']; F['run4'] = F['run2']
    else:
        F['walk1'] = hem(G, 1)
        F['walk2'] = shift(hem(G, 0), 0, 1) if foot_room and False else compose(G, [], body_dy=0)
        F['walk3'] = hem(G, -1)
        F['walk4'] = G
        move = ['walk1', 'walk2', 'walk3', 'walk4']
        r = -1 if head_room else 0
        F['atk0'] = hem(shift(G, -1, 0), 1)
        F['atk1'] = recolor(hem(shift(G, -1, r), 2), kindle)
        F['atk2'] = recolor(hem(shift(G, -2, r), 2), glowM)
        F['atk3'] = recolor(hem(shift(G, 2, 0), -2), glowM)
        F['atk4'] = recolor(hem(shift(G, 1, 0), -1), kindle)
        F['atk5'] = G
    # the file: its head with the brighter colours added, its base, then the frames and clips
    pre, base = head.split('frame base', 1)
    pre = pre.rstrip('\n') + '\n' + ''.join(f'{k} {v}\n' for k, v in extra.items())
    out = ['', '# ---- drawn frames (tools/realm_rig.py writes everything below: legs swung from the hip, wings beating, the wind-up and the strike)']
    for name, Fr in F.items(): out.append(f'frame {name}'); out += [''.join(r) for r in Fr]; out.append('')
    fps = 6 if big else 8
    out += [f'clip move {fps} ' + ' '.join(move), f'clip shoot {fps + 1} atk0 atk1 atk2 atk3 atk4 atk5']
    if 'run1' in F: out.append(f'clip charge {fps + 4} run1 run2 run3 run4')
    open(os.path.join(PIX, id_ + '.txt'), 'w', encoding='utf8', newline='\n').write(pre + 'frame base' + base.rstrip('\n') + '\n' + '\n'.join(out) + '\n')
    return kind, len(legs)


if __name__ == '__main__':
    ids = sys.argv[1:] or ALL
    kinds = {}
    for i in ids:
        k, n = write(i); kinds.setdefault(k, []).append(f'{i}({n})' if k == 'legs' else i)
    for k, v in kinds.items(): print(k, len(v), ' '.join(v))
