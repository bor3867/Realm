"""Builds the sprite sheets for the later classes in one go (or one by name).

    py tools/build_classes.py                 # all of them
    py tools/build_classes.py duelist         # just one
"""
import importlib
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import buildkit  # noqa: E402

# class folder -> (art module, sheet name)
CLASSES = {
    'summoner': ('reliquarian', 'reliquarian'),
    'harpooner': ('wreckwhaler', 'wreckwhaler'),
    'duelist': ('mirrorknight', 'mirrorknight'),
    'stormwright': ('kitehermit', 'kitehermit'),
    'clockmaker': ('horologist', 'horologist'),
}

if __name__ == '__main__':
    pick = sys.argv[1:] or list(CLASSES)
    for folder in pick:
        mod_name, sheet = CLASSES[folder]
        mod = importlib.import_module(mod_name)
        root = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', folder)
        F, guide = buildkit.build_sheet(mod, sheet, root, events={'attack': 1, 'ability': 3},
                                        notes={'side_idle': 'faces RIGHT; flip horizontally for LEFT',
                                               'side_walk': 'faces RIGHT; flip horizontally for LEFT'})
        print(folder, guide['columns'], guide['rows'], guide['frameCount'])
