"""The browser tab's icon (2026-10-29): a watermelon slice, 32x32 pixel art.  py -I tools/favicon.py -> art/favicon.png"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pixlib import hex_rgba, write_png  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N, CX, CY, R = 32, 15.5, 9.5, 14.5          # a half-disc, flat side up, curve down
T = (0, 0, 0, 0)
img = [[T] * N for _ in range(N)]
for y in range(N):
    for x in range(N):
        dx, dy = x - CX, y - CY
        d = math.hypot(dx, dy)
        if dy < -0.5 or d > R + 0.5:
            continue
        if d > R - 0.6 or dy < 0.6:
            c = '#0d0a12'                     # the outline
        elif d > R - 2.6:
            c = '#2e8a3a' if (int(math.degrees(math.atan2(dy, dx)) / 9)) % 2 else '#4ab060'   # the striped rind
        elif d > R - 3.6:
            c = '#e8f4c8'                     # the pale band
        else:
            c = '#ff4a5a' if dy > 2 else '#ff7a86'   # the flesh, lit along the cut
        img[y][x] = hex_rgba(c)
for sx, sy in ((10, 5), (15, 7), (20, 5), (12, 10), (18, 10), (15, 3), (8, 2), (22, 2)):   # seeds
    if img[int(CY + sy - 2)][sx][3]:
        img[int(CY + sy - 2)][sx] = hex_rgba('#1a1014')
write_png(os.path.join(ROOT, 'art', 'favicon.png'), img)
print('favicon written')
