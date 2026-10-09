"""Builds the sprite pack's classes and bosses into the game's sheet formats.

    py tools/pack_build.py

- art/sprites/player/runeblade/runeblade_sheet.png, art/sprites/player/hexweaver/hexweaver_sheet.png
  (the hero layout from heroes8.py: front / side / back rows, attacks, ability, death; 8x8 art stored doubled)
- art/sprites/bosses/pack_bosses_sheet.png: the Tidebound Lich and the Forgeheart Colossus. Their 16x16 art is
  stored TRIPLED in 48px frames (RotMG-style scaled-up bosses), in the realm-boss column layout:
  idle x4 | tell | attack | special | death x3.
"""
import json
import os

from pixlib import hex_rgba, write_png
import pack_sprites as ps

HERE = os.path.dirname(__file__)
T = (0, 0, 0, 0)


def paint(out, grid, pal, ox, oy, k):
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != '.' and ch in pal:
                c = hex_rgba(pal[ch])
                for dy in range(k):
                    for dx in range(k):
                        out[oy + y * k + dy][ox + x * k + dx] = c


def squash(g):
    rows = [r for i, r in enumerate(g) if i % 3 != 1 or i == len(g) - 1]
    return ['.' * len(g[0])] * (len(g) - len(rows)) + rows


def lying(g):
    n = len(g)
    rot = [''.join(g[n - 1 - x][y] for x in range(n)) for y in range(n)]
    rows = [r for r in rot if r.strip('.')]
    return ['.' * n] * (n - len(rows)) + rows


def hero(cls, F, pal):
    d = lambda k: F[k][:8] if len(F[k][0]) == 8 else [r[:8] for r in F[k]]   # noqa: E731
    fi, si, bi = d('down_idle'), d('right_idle'), d('up_idle')
    rows = [
        [fi, fi, fi, d('down_walk1'), fi, d('down_walk2')],
        [si, si, si, d('right_walk1'), si, d('right_walk2')],
        [bi, bi, bi, d('up_walk1'), bi, d('up_walk2')],
        [fi, d('down_attack1'), si, d('right_attack1'), bi, d('up_attack1')],
        [d('down_attack1'), d('down_attack1'), fi, fi],
        [fi, squash(fi), lying(fi), lying(fi)],
    ]
    out = [[T] * 96 for _ in range(len(rows) * 16)]
    for r, row in enumerate(rows):
        for c, g in enumerate(row):
            paint(out, g, pal, c * 16, r * 16, 2)
    dd = os.path.join(HERE, '..', 'art', 'sprites', 'player', cls)
    os.makedirs(dd, exist_ok=True)
    write_png(os.path.join(dd, cls + '_sheet.png'), out)
    anims = {'front_idle': (0, 0, 2, 3), 'front_walk': (0, 2, 4, 8), 'side_idle': (1, 0, 2, 3), 'side_walk': (1, 2, 4, 8),
             'back_idle': (2, 0, 2, 3), 'back_walk': (2, 2, 4, 8),
             'front_attack': (3, 0, 2, 10), 'side_attack': (3, 2, 2, 10), 'back_attack': (3, 4, 2, 10),
             'ability': (4, 0, 3, 8), 'hit': (4, 3, 1, 1), 'death': (5, 0, 4, 6)}
    guide = {'image': cls + '_sheet.png', 'frameWidth': 16, 'frameHeight': 16, 'columns': 6, 'rows': len(rows), 'art': 8,
             'pivot': {'x': 8, 'y': 15},
             'animations': {k: {'row': a, 'col': b, 'frames': n, 'fps': fps, 'loop': k.endswith(('idle', 'walk'))} for k, (a, b, n, fps) in anims.items()}}
    json.dump(guide, open(os.path.join(dd, cls + '_sheet.json'), 'w'), indent=2)


def boss_deaths(g):
    n = len(g)
    d0 = ['.' * n] + g[:-1]
    d1 = ['.' * n] * (n // 2) + [r for k, r in enumerate(g) if k % 2][:n - n // 2]
    pile = ['.' * n] * (n - 4) + [''.join(c if (x + k) % 3 == 0 else '.' for x, c in enumerate(r)) for k, r in enumerate(g[-4:])]
    return [d0, d1, pile]


def bosses():
    B = {'tidebound_lich': (ps.CRYPT, [ps.LICH_IDLE1, ps.LICH_IDLE1, ps.LICH_IDLE2, ps.LICH_IDLE2, ps.LICH_CAST1, ps.LICH_CAST2, ps.LICH_CAST2]),
         'forgeheart_colossus': (ps.EMBER, [ps.COLOSSUS_IDLE1, ps.COLOSSUS_IDLE1, ps.COLOSSUS_IDLE2, ps.COLOSSUS_IDLE2, ps.COLOSSUS_ATK1,
                                            ps.COLOSSUS_ATK2, ps.COLOSSUS_ATK2])}
    import dungeons4_art
    B.update(dungeons4_art.BOSSES)
    S, K = 48, 3
    out = [[T] * (S * 10) for _ in range(S * len(B))]
    meta = {}
    for r, (name, (pal, frames)) in enumerate(B.items()):
        frames = frames + boss_deaths(frames[0])
        for c, g in enumerate(frames):
            paint(out, g, pal, c * S, r * S, K)
        meta[name] = {'row': r, 'dungeon': True}
    dd = os.path.join(HERE, '..', 'art', 'sprites', 'bosses')
    write_png(os.path.join(dd, 'pack_bosses_sheet.png'), out)
    guide = {'image': 'pack_bosses_sheet.png', 'frameWidth': S, 'frameHeight': S, 'columns': 10, 'rows': len(B),
             'pivot': {'x': S // 2, 'y': S - 1},
             'animations': {'idle': {'col': 0, 'frames': 4, 'fps': 5, 'loop': True}, 'tell': {'col': 4, 'frames': 1},
                            'attack': {'col': 5, 'frames': 1}, 'special': {'col': 6, 'frames': 1},
                            'death': {'col': 7, 'frames': 3, 'fps': 4, 'loop': False, 'holdLastFrame': True}},
             'bosses': meta}
    json.dump(guide, open(os.path.join(dd, 'pack_bosses_sheet.json'), 'w'), indent=2)


if __name__ == '__main__':
    # the Runeblade and the Hexweaver are drawn in tools/heroes8.py now
    bosses()
    print('built runeblade, hexweaver, pack bosses')
