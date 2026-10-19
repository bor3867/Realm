# The game's pixel font as a web font (art/fonts/realm_pixel.ttf), for the HUD: the same blocky 3x5 digits as the
# damage numbers (src/pixelfont.js) and the tier tags (ui.js pixelTag), with letters and signs to match. Capitals and
# digits are 5 pixels tall, lowercase 4 (ascenders 5), descenders 2 more. One font pixel is 100 units; the em is 8
# pixels (800), so at font-size 16px a font pixel is 2 screen pixels (crisp at 8, 16, 24, 32px). Outlines are traced
# round each run of pixels (no seams between them). Written by hand (no font library needed).
#   py -I tools/build_pixel_font.py
import os, struct, time

# rows top to bottom: 0-4 sit on the baseline (row 4 is the bottom row), 5-6 hang below it
G = {
  '0': '111 101 101 101 111', '1': '010 110 010 010 111', '2': '111 001 111 100 111', '3': '111 001 011 001 111',
  '4': '101 101 111 001 001', '5': '111 100 111 001 110', '6': '011 100 111 101 111', '7': '111 001 010 010 010',
  '8': '111 101 111 101 111', '9': '111 101 111 001 110',
  'A': '010 101 111 101 101', 'B': '110 101 110 101 110', 'C': '011 100 100 100 011', 'D': '110 101 101 101 110',
  'E': '111 100 110 100 111', 'F': '111 100 110 100 100', 'G': '011 100 101 101 011', 'H': '101 101 111 101 101',
  'I': '111 010 010 010 111', 'J': '001 001 001 101 010', 'K': '101 101 110 101 101', 'L': '100 100 100 100 111',
  'M': '10001 11011 10101 10001 10001', 'N': '1001 1101 1011 1001 1001', 'O': '010 101 101 101 010',
  'P': '110 101 110 100 100', 'Q': '010 101 101 110 011', 'R': '110 101 110 101 101', 'S': '011 100 010 001 110',
  'T': '111 010 010 010 010', 'U': '101 101 101 101 111', 'V': '101 101 101 101 010', 'W': '10001 10001 10101 11011 10001',
  'X': '101 101 010 101 101', 'Y': '101 101 010 010 010', 'Z': '111 001 010 100 111',
  'a': '000 110 011 101 011', 'b': '100 110 101 101 110', 'c': '000 011 100 100 011', 'd': '001 011 101 101 011',
  'e': '000 011 111 100 011', 'f': '001 010 111 010 010', 'g': '000 011 101 101 011 001 110', 'h': '100 110 101 101 101',
  'i': '1 0 1 1 1', 'j': '01 00 01 01 01 01 10', 'k': '100 101 110 110 101', 'l': '10 10 10 10 01',
  'm': '00000 11010 10101 10101 10101', 'n': '000 110 101 101 101', 'o': '000 010 101 101 010',
  'p': '000 110 101 101 110 100 100', 'q': '000 011 101 101 011 001 001', 'r': '000 101 110 100 100',
  's': '000 011 110 011 110', 't': '010 111 010 010 001', 'u': '000 101 101 101 011', 'v': '000 101 101 101 010',
  'w': '00000 10101 10101 10101 01010', 'x': '000 101 010 010 101', 'y': '000 101 101 101 011 001 110',
  'z': '000 111 011 110 111',
  '.': '0 0 0 0 1', ',': '00 00 00 00 01 10', ':': '0 1 0 1 0', ';': '00 01 00 01 10', '!': '1 1 1 0 1',
  '?': '111 001 011 000 010', "'": '1 1 0 0 0', '"': '101 101 000 000 000', '-': '000 000 111 000 000',
  '+': '000 010 111 010 000', '=': '000 111 000 111 000', '(': '01 10 10 10 01', ')': '10 01 01 01 10',
  '[': '11 10 10 10 11', ']': '11 01 01 01 11', '{': '011 010 110 010 011', '}': '110 010 011 010 110',
  '/': '001 001 010 100 100', '\\': '100 100 010 001 001', '%': '101 001 010 100 101', '|': '1 1 1 1 1',
  '<': '001 010 100 010 001', '>': '100 010 001 010 100', '_': '000 000 000 000 000 111', '*': '101 010 101 000 000',
  '#': '01010 11111 01010 11111 01010', '&': '010 101 010 101 011', '$': '011 110 010 011 110', '^': '010 101 000 000 000',
  '~': '0000 0101 1010 0000 0000', '`': '10 01 00 00 00', '@': '0110 1001 1011 1000 0111',
  '·': '0 0 1 0 0',                       # middle dot
  '★': '00100 11111 01110 01010 10001',   # star
  '☆': '00100 11011 01010 01010 10001',   # hollow star
  '×': '000 101 010 101 000',             # times
  '→': '0000 0010 1111 0010 0000',        # arrow
  '←': '0000 0100 1111 0100 0000',
  '—': '00000 00000 11111 00000 00000',   # em dash
  '–': '0000 0000 1111 0000 0000',        # en dash
  '…': '00000 00000 00000 00000 10101',   # ellipsis
  '‘': '1 1 0 0 0', '’': '1 1 0 0 0', '“': '101 101 000 000 000', '”': '101 101 000 000 000',
  '•': '00 00 11 11 00',                  # bullet
  '°': '111 101 111 000 000',             # degree
}
SPACE = 3          # a space's advance, in font pixels
PX, ASC, DESC = 100, 600, 200
EM = ASC + DESC

def outline(rows):
    # every filled pixel's edges, clockwise (y up); an edge met twice (in both directions) is inside and cancels
    edges = set()
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            if ch != '1': continue
            x0, x1, yt, yb = c * PX, (c + 1) * PX, (4 - r + 1) * PX, (4 - r) * PX
            for e in (((x0, yt), (x1, yt)), ((x1, yt), (x1, yb)), ((x1, yb), (x0, yb)), ((x0, yb), (x0, yt))):
                rev = (e[1], e[0])
                if rev in edges: edges.remove(rev)
                else: edges.add(e)
    nxt = {}
    for a, b in edges: nxt.setdefault(a, []).append(b)
    loops = []
    while nxt:
        start = next(iter(nxt)); pts = [start]; cur = start
        while True:
            b = nxt[cur].pop()
            if not nxt[cur]: del nxt[cur]
            if b == start: break
            pts.append(b); cur = b
        # drop points in the middle of a straight run
        out = []
        n = len(pts)
        for i in range(n):
            p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
            if (p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]) != 0: out.append(p1)
        loops.append(out)
    return loops

def glyf_data(loops):
    if not loops: return b''
    pts = [p for l in loops for p in l]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    d = struct.pack('>hhhhh', len(loops), min(xs), min(ys), max(xs), max(ys))
    end = -1
    for l in loops: end += len(l); d += struct.pack('>H', end)
    d += struct.pack('>H', 0)                     # no instructions
    d += bytes([0x01] * len(pts))                 # every point on the curve, coordinates as shorts
    px = py = 0
    for x, _ in pts: d += struct.pack('>h', x - px); px = x
    for _, y in pts: d += struct.pack('>h', y - py); py = y
    return d + b'\0' * (-len(d) % 4)

chars = sorted(G, key=ord)
glyphs = [('.notdef', b'', 4 * PX), ('space', b'', SPACE * PX)]
cmap = {32: 1}
for ch in chars:
    rows = G[ch].split(' ')
    w = max(len(r) for r in rows)
    glyphs.append(('g%04x' % ord(ch), glyf_data(outline(rows)), (w + 1) * PX))
    cmap[ord(ch)] = len(glyphs) - 1
cmap[0xa0] = 1

def checksum(b):
    b += b'\0' * (-len(b) % 4)
    return sum(struct.unpack('>%dI' % (len(b) // 4), b)) & 0xffffffff

glyf, loca = b'', []
for _, d, _ in glyphs: loca.append(len(glyf)); glyf += d
loca.append(len(glyf))
maxPts = maxCont = 0
xMin = yMin = 0; xMax = 5 * PX; yMax = 5 * PX; yMin = -2 * PX
for _, d, _ in glyphs:
    if d:
        nc = struct.unpack('>h', d[:2])[0]; ends = struct.unpack('>%dH' % nc, d[10:10 + 2 * nc])
        maxCont = max(maxCont, nc); maxPts = max(maxPts, ends[-1] + 1)
N = len(glyphs)
now = int(time.time()) + 2082844800
T = {}
T['head'] = struct.pack('>IIIIHHqqhhhhHHhhh', 0x00010000, 0x00010000, 0, 0x5F0F3CF5, 0x000B, EM, now, now, xMin, yMin, xMax, yMax, 0, 8, 2, 1, 0)
T['hhea'] = struct.pack('>IhhhHhhhhhhhhhhhH', 0x00010000, ASC, -DESC, 0, max(a for *_, a in glyphs), 0, 0, xMax, 1, 0, 0, 0, 0, 0, 0, 0, N)
T['maxp'] = struct.pack('>IHHHHHHHHHHHHHH', 0x00010000, N, maxPts, maxCont, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0)
T['hmtx'] = b''.join(struct.pack('>Hh', a, struct.unpack('>h', d[2:4])[0] if d else 0) for _, d, a in glyphs)
T['loca'] = b''.join(struct.pack('>I', o) for o in loca)
T['glyf'] = glyf
T['post'] = struct.pack('>IIhhIIIII', 0x00030000, 0, -150, 50, 1, 0, 0, 0, 0)
# OS/2 version 4
T['OS/2'] = struct.pack('>HhHHHhhhhhhhhhhh', 4, 4 * PX, 400, 5, 0, 400, 400, 0, 100, 400, 400, 0, 300, 50, 250, 0) + \
    bytes(10) + struct.pack('>IIII', 1, 0, 0, 0) + b'RLMP' + struct.pack('>HHH', 0x40, min(cmap), max(cmap)) + \
    struct.pack('>hhhHH', ASC, -DESC, 0, ASC, DESC) + struct.pack('>II', 1, 0) + struct.pack('>hhHHH', 4 * PX, 5 * PX, 0, 32, 1)
# name: platform 3 (Windows), Unicode BMP, US English
NAMES = {0: 'Generated for Realm', 1: 'Realm Pixel', 2: 'Regular', 3: 'Realm Pixel Regular', 4: 'Realm Pixel', 5: 'Version 1.0', 6: 'RealmPixel-Regular'}
recs, strs = b'', b''
for nid, s in NAMES.items():
    e = s.encode('utf-16-be'); recs += struct.pack('>HHHHHH', 3, 1, 0x409, nid, len(e), len(strs)); strs += e
T['name'] = struct.pack('>HHH', 0, len(NAMES), 6 + len(recs)) + recs + strs
# cmap format 4 (one segment per run of consecutive codes)
codes = sorted(cmap); segs = []
for c in codes:
    if segs and c == segs[-1][1] + 1 and cmap[c] == cmap[segs[-1][1]] + 1: segs[-1][1] = c
    else: segs.append([c, c])
segs.append([0xffff, 0xffff])
n = len(segs); sr = 2 * (1 << (n.bit_length() - 1)); es = n.bit_length() - 1
ends = b''.join(struct.pack('>H', e) for _, e in segs); starts = b''.join(struct.pack('>H', s) for s, _ in segs)
deltas = b''.join(struct.pack('>H', (cmap[s] - s) % 0x10000 if s != 0xffff else 1) for s, _ in segs)
sub = ends + struct.pack('>H', 0) + starts + deltas + b'\0\0' * n
sub = struct.pack('>HHHHHHH', 4, 14 + len(sub), 0, 2 * n, sr, es, 2 * n - sr) + sub
T['cmap'] = struct.pack('>HHHHI', 0, 1, 3, 1, 12) + sub

tags = sorted(T)
nt = len(tags); srt = 16 * (1 << (nt.bit_length() - 1)); ent = nt.bit_length() - 1
off = 12 + 16 * nt; dirs, body, at = b'', b'', {}
for t in tags:
    d = T[t]; at[t] = off + len(body); dirs += struct.pack('>4sIII', t.encode(), checksum(d), off + len(body), len(d)); body += d + b'\0' * (-len(d) % 4)
font = struct.pack('>IHHHH', 0x00010000, nt, srt, ent, nt * 16 - srt) + dirs + body
adj = (0xB1B0AFBA - checksum(font)) & 0xffffffff
hi = at['head']
font = font[:hi + 8] + struct.pack('>I', adj) + font[hi + 12:]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, 'art', 'fonts'), exist_ok=True)
open(os.path.join(root, 'art', 'fonts', 'realm_pixel.ttf'), 'wb').write(font)
print(f'art/fonts/realm_pixel.ttf: {len(glyphs)} glyphs, {len(font)} bytes')
