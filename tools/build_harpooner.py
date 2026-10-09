"""Builds the Harpooner sprite assets + previews.

    py tools/build_harpooner.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import buildkit  # noqa: E402
import wreckwhaler  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', 'harpooner')

if __name__ == '__main__':
    F, guide = buildkit.build_sheet(
        wreckwhaler, 'wreckwhaler', ROOT,
        events={'attack': 1, 'ability': 3},
        notes={'side_idle': 'faces RIGHT; flip horizontally for LEFT',
               'side_walk': 'faces RIGHT; flip horizontally for LEFT'})
    print(guide['columns'], guide['rows'], guide['frameCount'])
