"""Singularity: a small black hole the Grand Orrery drops during the fight (16x16 native, 8-frame rotation loop).
Static banded accretion disk (tilted, Doppler-bright on the left), lensed back-arc over the top, a thin photon ring,
and hot clumps that ride the disk round. Plus spawn (3) and collapse (3) frames."""
import math
from PIL import Image

N = 16
C = (N / 2, N / 2)
INK = (5, 3, 10, 255)
CORE = (14, 8, 26, 255)
# disk ramp: outer -> inner (magenta-violet rim into orange into white-hot)
DISK = [(74, 16, 74), (160, 42, 138), (214, 74, 60), (255, 154, 58), (255, 214, 122), (255, 246, 216)]
RING = (255, 240, 200)
TILT = -0.14        # disk rotation (radians)
FLAT = 0.25         # disk thickness ratio (how edge-on it is)


def frame(t, scale=1.0, nframes=8, clumps=True):
    """t: frame index in the rotation loop. scale shrinks/grows everything (spawn/collapse)."""
    img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    px = img.load()
    rc = 3.1 * scale            # event horizon radius
    r_in, r_out = 2.4 * scale, 7.9 * scale
    ca, sa = math.cos(TILT), math.sin(TILT)
    phase = 2 * math.pi / 3 * t / nframes   # 3 clumps; one clump slot per loop -> seamless
    for y in range(N):
        for x in range(N):
            dx, dy = x + .5 - C[0], y + .5 - C[1]
            r = math.hypot(dx, dy)
            u = dx * ca + dy * sa
            v = -dx * sa + dy * ca
            rd = math.hypot(u, v / FLAT)          # radius in the disk plane
            col = None
            in_disk = r_in <= rd <= r_out
            front = v > 0
            # lensed back of the disk: an arc hugging the top of the hole
            arc = (rc + 0.6 <= r <= rc + 1.9) and v < -0.2 and scale > 0.5
            if r <= rc:
                col = CORE if r > rc - 0.9 else INK
                if in_disk and front:
                    col = None  # front disk passes over the hole
            if col is None and (in_disk or arc):
                if arc and not in_disk:
                    k = 2 if r > rc + 1.3 else 4            # two clean bands
                else:
                    f = (rd - r_in) / (r_out - r_in)          # 0 inner .. 1 outer
                    k = 4 if f < 0.18 else 3 if f < 0.45 else 2 if f < 0.75 else 1
                if u < -1.0:                                # approaching side reads brighter
                    k += 1
                elif u > 2.5:
                    k -= 1
                if clumps and in_disk:
                    th = math.atan2(v / FLAT, u)
                    if math.cos(3 * (th + phase)) > 0.72:   # hot clumps riding the disk (anticlockwise)
                        k += 1
                k = max(0, min(5, k))
                col = DISK[k] + (255,)
            if col is None and rc < r <= rc + 0.75 and scale > 0.5:
                col = RING + (255,)                         # photon ring
            if col is not None:
                px[x, y] = col
    return img


LOOP = [frame(t) for t in range(8)]
SPAWN = [frame(0, s, clumps=False) for s in (0.35, 0.6, 0.85)]
def flash():
    img = Image.new("RGBA", (N, N), (0, 0, 0, 0)); px = img.load()
    for p in ((7, 7), (8, 7), (7, 8), (8, 8)):
        px[p] = (255, 255, 255, 255)
    for p in ((7, 4), (8, 11), (4, 8), (11, 7)):
        px[p] = DISK[4] + (255,)
    for p in ((5, 5), (10, 10), (10, 5), (5, 10)):
        px[p] = DISK[1] + (255,)
    return img


COLLAPSE = [frame(0, s, clumps=False) for s in (0.7, 0.45)] + [flash()]
TEXT = ("Grand Orrery (Collapse phase): drops 2-3 singularities that drift slowly and pull players within 3 tiles "
        "toward them; touching the core deals heavy damage. Lasts 6s, then collapses.")
