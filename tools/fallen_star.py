"""THE FALLEN STAR - the falling-star world event's boss (48x48, realm-boss sheet row).

A star that fell into Godfall and did not die. A white-hot core with one slit eye, a crown
of jagged light-rays, and a cracked shell of crater rock it dragged out of the ground with
it, glowing through every seam. Molten droplets hang in the air around it.

Frames: I0 I1 (rays pulse and turn) | T0 (eye wide, rays drawn in) | A0 (flare: rays at full length)
        | S0 (supernova: shell blown open) | D0 (cracking) D1 (guttering) D2 (a cooling cinder in its crater)
"""
import math

from drawkit import Cv

PAL = {
    'o': '#0A0612', 'r': '#2A2238', 'R': '#4A3E5A', 'g': '#6E6080',        # crater rock, dark to lit
    'm': '#B8401A', 'M': '#FF7A2A', 'y': '#FFC83A', 'Y': '#FFF06A',        # molten seams and light
    'w': '#FFFDE8', 'W': '#FFFFFF', 'c': '#8AF0FF', 'C': '#D8FFFF',        # the core and its cold corona
    'e': '#14081E', 'p': '#5A2A8A',
}
CX, CY = 24, 24


def rays(c, n=8, r0=10, r1=21, rot=0.0, ch='y', tip='Y'):
    """jagged light-rays radiating from the core: long and short alternating"""
    for k in range(n):
        a = rot + k * math.tau / n
        L = r1 if k % 2 == 0 else r1 * 0.68
        x0, y0 = CX + math.cos(a) * r0, CY + math.sin(a) * r0
        x1, y1 = CX + math.cos(a) * L, CY + math.sin(a) * L
        c.ln(round(x0), round(y0), round(x1), round(y1), ch)
        nx, ny = -math.sin(a), math.cos(a)                          # thicken the inner two-thirds
        xm, ym = CX + math.cos(a) * (r0 + (L - r0) * 0.8), CY + math.sin(a) * (r0 + (L - r0) * 0.8)
        for d in (-1, 1):                                           # rays three pixels thick, tapering to a point
            c.ln(round(x0 + nx * d), round(y0 + ny * d), round(xm), round(ym), ch)
        c.ln(round(x0), round(y0), round(x1), round(y1), tip)


def shell(c, open_=0.0):
    """the cracked crater-rock shell, glowing through its seams; open_ pushes the plates apart"""
    for k in range(6):
        a = k * math.tau / 6 + 0.3
        d = 9 + open_ * 5
        px, py = CX + math.cos(a) * d, CY + math.sin(a) * d
        c.ell(px, py, 5.2, 4.4, 'r')
        c.ell(px - 1.2, py - 1.4, 3, 2.2, 'R', only='r')
        c.p(round(px - 2), round(py - 2), 'g')
    for k in range(6):                                              # molten seams between the plates
        a = k * math.tau / 6 + 0.3 + math.tau / 12
        for t in range(6, 12 + int(open_ * 5)):
            c.p(round(CX + math.cos(a) * t), round(CY + math.sin(a) * t), 'M' if t % 3 else 'y')


def core(c, eye='open', r=7.5):
    c.ell(CX, CY, r + 1.5, r + 1.5, 'y')
    c.ell(CX, CY, r, r, 'w')
    c.ell(CX - 1.5, CY - 2, r * 0.5, r * 0.45, 'W', only='w')
    if eye == 'open':                                               # one slit eye, cold blue
        c.ell(CX, CY, 4.4, 3.2, 'c'); c.rect(CX, CY - 4, CX + 1, CY + 3, 'e'); c.p(CX - 3, CY - 2, 'C'); c.p(CX - 2, CY - 2, 'C')
    elif eye == 'wide':
        c.ell(CX, CY, 5, 4.2, 'c'); c.ell(CX - 0.5, CY, 1.8, 3.6, 'e'); c.p(CX - 3, CY - 2, 'C'); c.p(CX - 2, CY - 3, 'C')
    elif eye == 'shut':
        c.rect(CX - 4, CY - 1, CX + 3, CY, 'm')


def droplets(c, f):
    pts = [(7, 9), (41, 12), (5, 34), (43, 37), (17, 44), (33, 3)]
    return [(x, y + (f % 2) * (1 if k % 2 else -1), 'M' if k % 2 else 'Y') for k, (x, y) in enumerate(pts)]


def star(f=0, mode='idle'):
    c = Cv(48, 48)
    if mode == 'idle':
        rays(c, rot=f * math.tau / 32, r1=20 + f % 2)
        shell(c); core(c)
    elif mode == 'tell':
        rays(c, r1=14, ch='M', tip='y'); shell(c, 0.15); core(c, 'wide')
    elif mode == 'attack':
        rays(c, n=12, r1=23, rot=0.13, ch='Y', tip='W'); shell(c, 0.3); core(c, 'wide', 7.5)
    late = droplets(c, f)
    if mode == 'tell':
        late += [(x, y, 'C') for x, y in ((24, 1), (2, 24), (46, 24))]
    return c.done(late=late)


def nova():
    """supernova: the shell blown wide, a corona of cold light"""
    c = Cv(48, 48)
    c.ring(CX, CY, 21, 21, 'c', t=1.0); c.ring(CX, CY, 18, 18, 'C', t=0.6)
    rays(c, n=16, r0=8, r1=23, rot=0.1, ch='Y', tip='W')
    shell(c, 0.8); core(c, 'wide', 8)
    return c.done()


def death(stage):
    c = Cv(48, 48)
    if stage == 0:                                                  # cracking: rays guttering, eye shut
        rays(c, n=8, r1=15, rot=0.2, ch='M', tip='y'); shell(c, 0.4); core(c, 'shut', 5.5)
        return c.done(late=[(x, y, 'W') for x, y in ((12, 8), (36, 10), (10, 38), (38, 36))])
    if stage == 1:                                                  # guttering: a dim ember in broken rock
        shell(c, 0.6)
        c.ell(CX, CY, 4.5, 4.5, 'm'); c.ell(CX, CY, 2.6, 2.6, 'M'); c.p(CX - 1, CY - 1, 'y')
        return c.done()
    for x, y in ((14, 38), (32, 39), (24, 41), (19, 42), (29, 42)):  # a cooling cinder in its crater
        c.ell(x, y, 3.4, 2.4, 'r'); c.p(x - 1, y - 1, 'R')
    c.ell(CX, 39, 3, 2.4, 'm'); c.p(CX, 38, 'M'); c.p(CX - 1, 38, 'y')
    return c.done(late=[(22, 34, 'g'), (27, 33, 'g')])


FRAMES = [star(0), star(1), star(0, 'tell'), star(1, 'attack'), nova(), death(0), death(1), death(2)]
