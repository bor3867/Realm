"""Builds the Priest sprite assets + previews.

    py tools/build_priest.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import buildkit  # noqa: E402
import heliarch  # noqa: E402
import priest_candidates as pc  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', 'priest')

if __name__ == '__main__':
    F, guide = buildkit.build_sheet(
        heliarch, 'heliarch', ROOT,
        events={'attack': 1, 'ability': 3},
        notes={'side_idle': 'faces RIGHT; flip horizontally for LEFT',
               'side_walk': 'faces RIGHT; flip horizontally for LEFT'})
    buildkit.build_candidates([
        ('a_heliarch', heliarch.PAL, [F['front_idle'][0], F['ability'][2]]),
        ('b_censer_magistrate', pc.PAL_B, pc.censer_magistrate()),
        ('c_tablet_ascendant', pc.PAL_C, pc.tablet_ascendant()),
    ], ROOT)
    print(guide['columns'], guide['rows'], guide['frameCount'])
