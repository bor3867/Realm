"""Projectile sprites: 12x12 cells. Every enemy attack gets its own shot so
patterns read apart at a glance. Shapes are built from a few generators and
hand grids; elongated shots point RIGHT (the engine rotates them to velocity).
"""
import math

N = 12


def grid():
    return [['.'] * N for _ in range(N)]


def done(g):
    return [''.join(r) for r in g]


def orb(r, ramp, hl=True, cx=5.5, cy=5.5):
    """ramp: [outline, dark, mid, light, core] chars; concentric shading, top-left highlight."""
    g = grid()
    for y in range(N):
        for x in range(N):
            d = math.hypot(x - cx, y - cy)
            if d <= r + 0.5:
                k = d / (r + 0.5)
                ch = ramp[1] if k > 0.72 else ramp[2] if k > 0.42 else ramp[3]
                if k < 0.2:
                    ch = ramp[4]
                g[y][x] = ch
    _outline(g, ramp[0])
    if hl:
        hx, hy = round(cx - r * 0.45), round(cy - r * 0.45)
        if g[hy][hx] not in '.' + ramp[0]:
            g[hy][hx] = ramp[4]
    return done(g)


def ring(r, ch, inner=None, thick=1):
    g = grid()
    for y in range(N):
        for x in range(N):
            d = math.hypot(x - 5.5, y - 5.5)
            if r - thick + 0.5 <= d <= r + 0.5:
                g[y][x] = ch
            elif inner and d <= r - thick - 0.5 and d > r - thick - 1.6:
                g[y][x] = inner
    return done(g)


def shard(length, width, ramp, tail=0):
    """pointing right; ramp [outline, dark, mid, light]"""
    g = grid()
    cy = 5.5
    x0 = (N - length) // 2
    for x in range(length):
        t = x / max(1, length - 1)
        w = width * (1 - t) ** 0.6 if t > 0.35 else width * (0.6 + t)
        for y in range(N):
            if abs(y - cy) <= w / 2:
                g[y][x0 + x] = ramp[3] if abs(y - cy) < 0.6 and t > 0.3 else ramp[2] if y < cy else ramp[1]
    _outline(g, ramp[0])
    return done(g)


def crescent(r, ramp):
    g = grid()
    for y in range(N):
        for x in range(N):
            a = math.hypot(x - 5.5, y - 5.5) <= r + 0.4
            b = math.hypot(x - 3.6, y - 5.5) <= r - 0.3
            if a and not b:
                g[y][x] = ramp[2] if x > 7 else ramp[1]
    _outline(g, ramp[0])
    return done(g)


def _outline(g, ch):
    add = []
    for y in range(N):
        for x in range(N):
            if g[y][x] == '.' and any(0 <= x + dx < N and 0 <= y + dy < N and g[y + dy][x + dx] not in ('.', ch)
                                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for x, y in add:
        g[y][x] = ch


def pad(rows8):
    """centre an 8-wide hand grid in a 12x12 cell"""
    out = ['.' * N] * 2 + ['..' + r + '..' for r in rows8] + ['.' * N] * 2
    return out


# palettes are per-sprite: {char: hex}
P = {}


def add(name, g, pal):
    assert len(g) == N and all(len(r) == N for r in g), name
    P[name] = (g, pal)


# ------------------------------------------------------------- player shots (unchanged look, re-centred)
add('ember', pad(["........", "...oo...", "..oYMo..", ".oYWYMo.", ".oMYMmo.", "..omMo..", "...oo...", "........"]),
    {'o': '#5A1A0A', 'Y': '#FFE45C', 'W': '#FFFDF0', 'M': '#FF8A1F', 'm': '#D8341A'})
add('spark', pad(["........", "...Y....", "...W.Y..", ".YWWWY..", "..YWW...", ".Y..W...", "....Y...", "........"]),
    {'Y': '#FFC94A', 'W': '#FFF6C8'})
add('lance', ["............", "............", "............", "............", "..YYYYYY....", "YWWWWWWWWYY.",
              "YWWWWWWWWYY.", "..YYYYYY....", "............", "............", "............", "............"],
    {'Y': '#FFEB8F', 'W': '#FFFDF0'})
add('star', pad(["........", "...W....", "...C....", ".WCWCW..", "...C....", "...W....", "........", "........"]),
    {'W': '#FFFFFF', 'C': '#8AF6FF'})
add('molten', orb(3, 'omMYW'), {'o': '#3A0E06', 'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8'})

# ------------------------------------------------------------- shore
add('pearl', orb(2.5, 'opPQW'), {'o': '#5A1A3A', 'p': '#C8508A', 'P': '#FF8FBF', 'Q': '#FFC4DE', 'W': '#FFFFFF'})
add('brine', orb(2, 'ocCDW'), {'o': '#0A3A34', 'c': '#1FCFB8', 'C': '#6FF0DC', 'D': '#B8FFF2', 'W': '#FFFFFF'})
add('salt', shard(7, 4, 'osSW'), {'o': '#3A4A5A', 's': '#8AA0B4', 'S': '#B8C8D4', 'W': '#F0F6FA'})
add('hook', pad(["....oo..", "...oSo..", "...oSo..", "...oSo..", "oo.oSo..", "oSooSo..", ".oSSo...", "..oo...."]),
    {'o': '#1A1410', 'S': '#C8C4B8'})

# ------------------------------------------------------------- ashfen
add('toll', ring(4.5, 'c', inner='C', thick=1), {'c': '#5EF0FF', 'C': '#A6E8C4'})
add('bile', orb(2.5, 'ogGyY'), {'o': '#1E2A10', 'g': '#4D6B2A', 'G': '#8DB03A', 'y': '#D4FF5A', 'Y': '#F4FFC8'})
add('hymn', pad(["....gg..", "....gYg.", "....g.gg", "....g...", "..ogg...", ".oGGGo..", ".oGYGo..", "..ooo..."]),
    {'o': '#1E2A10', 'g': '#8DB03A', 'G': '#6A9A2A', 'Y': '#D4FF5A'})
add('wail', crescent(4, 'ogG'), {'o': '#1E2A10', 'g': '#6A9A2A', 'G': '#D4FF5A'})
add('wisp', ["............", "............", "............", "......ooo...", ".....oyYyo..", "g.g.gyYWYyo.",
             ".g.g.oyYyo..", "......ooo...", "............", "............", "............", "............"],
    {'o': '#1E2A10', 'g': '#6A9A2A', 'y': '#8DB03A', 'Y': '#D4FF5A', 'W': '#F4FFC8'})
add('drip', pad(["...o....", "..owo...", "..owo...", ".owWwo..", ".owwWo..", ".owwwo..", "..ooo...", "........"]),
    {'o': '#4A4434', 'w': '#E8E0C8', 'W': '#FFFFFF'})
add('corpseflame', pad(["...g....", "..gy....", "..gyg...", ".gyYyg..", ".gyYyg..", ".ggyyg..", "..gggg..", "........"]),
    {'g': '#6A9A2A', 'y': '#D4FF5A', 'Y': '#F4FFC8'})
add('tallow', orb(4, 'oWwYF', hl=True), {'o': '#4A4434', 'W': '#B8AE94', 'w': '#E8E0C8', 'Y': '#FFFFFF', 'F': '#D4FF5A'})

# ------------------------------------------------------------- runeholt
add('icicle', shard(10, 4, 'oaAW'), {'o': '#0E1830', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF'})
add('frostshard', pad(["...W....", "..oAo...", ".oAWAo..", "WAWWWAW.", ".oAWAo..", "..oAo...", "...W....", "........"]),
    {'o': '#0E1830', 'A': '#5FA8D8', 'W': '#F0FCFF'})
add('runestone', pad(["........", "..oooo..", ".oSSso..", ".oScso..", ".oSCso..", ".oSsso..", "..oooo..", "........"]),
    {'o': '#16122A', 'S': '#B2ACCA', 's': '#726D8E', 'c': '#3BEFFF', 'C': '#CFFFFF'})
add('verse', pad(["........", ".cccccc.", ".c.CC.c.", ".cC..Cc.", ".cC..Cc.", ".c.CC.c.", ".cccccc.", "........"]),
    {'c': '#3BEFFF', 'C': '#CFFFFF'})
add('tine', ["............", "............", "........a...", "......aAa...", "....aAa.....", "aaAAAAAAAAc.",
             "....aAa.....", "......aAa...", "........a...", "............", "............", "............"],
    {'a': '#8A7A6A', 'A': '#E8E4D8', 'c': '#3BEFFF'})
add('snowflake', pad(["...W....", ".W.A.W..", "..AWA...", "WAWCWAW.", "..AWA...", ".W.A.W..", "...W....", "........"]),
    {'W': '#F0FCFF', 'A': '#8AD0F0', 'C': '#3BEFFF'})
add('rune', pad(["........", "...cc...", "..cCCc..", ".cC..Cc.", ".cC..Cc.", "..cCCc..", "...cc...", "........"]),
    {'c': '#3BEFFF', 'C': '#CFFFFF'})
add('shard', pad(["........", "......A.", ".....AW.", "....AWa.", "...AWa..", "..aWa...", ".aa.....", "........"]),
    {'A': '#A8E2FF', 'W': '#F0FCFF', 'a': '#5FA8D8'})
add('starbeam', shard(11, 3, 'onCW'), {'o': '#0E1530', 'n': '#3A57A8', 'C': '#3BEFFF', 'W': '#FFFFFF'})

# ------------------------------------------------------------- godfall
add('blade', pad(["........", "......P.", ".....PM.", "....PMm.", "...PMm..", ".gGMm...", ".gg.....", "g......."]),
    {'P': '#B57CFF', 'M': '#E1E6F0', 'm': '#8A93AE', 'g': '#C29A3E', 'G': '#F7DE8C'})
add('soulflame', pad(["...P....", "..PwP...", "..PwP...", ".pPwPp..", ".pPWPp..", "..pPp...", "...p....", "........"]),
    {'p': '#5A2BB0', 'P': '#B57CFF', 'w': '#E6D4FF', 'W': '#FFFFFF'})
add('smoke', orb(4.5, 'qpPPw', hl=True), {'q': '#2A1458', 'p': '#5A2BB0', 'P': '#B98CFF', 'w': '#F4EDFF'})
add('incense', pad(["........", "....P...", "...PwP..", "..PwWwP.", "...PwP..", "....P...", "...p.p..", "....p..."]),
    {'p': '#5A2BB0', 'P': '#B98CFF', 'w': '#E6D4FF', 'W': '#FFFFFF'})
add('goldshard', pad(["........", "......G.", ".....GY.", "....GYg.", "...GYg..", "..GYg...", ".gg.....", "........"]),
    {'G': '#F2C14E', 'Y': '#FFF4C2', 'g': '#A8792A'})
add('halofrag', crescent(4, 'ogG'), {'o': '#3A2808', 'g': '#C98A22', 'G': '#FFEB8F'})
add('chord', ring(5, 'G', inner='Y', thick=1), {'G': '#E3B95A', 'Y': '#FFEB8F'})
add('note', pad(["....GG..", "....GYG.", "....G..G", "....G...", "..oGG...", ".oGYGo..", ".oGGGo..", "..ooo..."]),
    {'o': '#3A2808', 'G': '#E3B95A', 'Y': '#FFF4C2'})
add('gaze', ["............", "............", "............", "............", "rrRRRRRRRR..", "RRWWWWWWWRRo",
             "RRWWWWWWWRRo", "rrRRRRRRRR..", "............", "............", "............", "............"],
    {'r': '#6A0A1A', 'R': '#FF4A5A', 'W': '#FFE0E4', 'o': '#2A0A10'})
add('kintsugi', shard(9, 4, 'ogGY'), {'o': '#3A2808', 'g': '#A8792A', 'G': '#F2C14E', 'Y': '#FFF4C2'})
add('quake', orb(4.5, 'okiIY', hl=True), {'o': '#0E0A0E', 'k': '#4A4458', 'i': '#A8A0B8', 'I': '#E4DEEC', 'Y': '#F2C14E'})

# ------------------------------------------------------------- the drowned forge
add('cinder', orb(2.5, 'omMYW'), {'o': '#3A0E06', 'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8'})
add('slag', orb(3.5, 'okmMY', hl=True), {'o': '#120C10', 'k': '#3A2A2A', 'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A'})
add('ingot', ["............", "............", "............", "............", "..oooooooo..", ".oYYYYYYMMo.",
              ".oMYWWYMMmo.", "..oooooooo..", "............", "............", "............", "............"],
    {'o': '#3A0E06', 'm': '#8C2A12', 'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8'})
add('hammerlet', pad(["........", ".oooooo.", ".oIIIio.", ".oiiiko.", ".oooooo.", "...ok...", "...ok...", "...oo..."]),
    {'o': '#120C10', 'I': '#8E8AA6', 'i': '#4F4B60', 'k': '#2E2A38'})
add('furnacebeam', ["............", "............", "............", "............", "MMYYYYYYYYM.", "YYWWWWWWWWYY",
                    "YYWWWWWWWWYY", "MMYYYYYYYYM.", "............", "............", "............", "............"],
    {'M': '#F2641A', 'Y': '#FFC94A', 'W': '#FFF6C8'})

# ------------------------------------------------------------- realm boss signature shots
add('bellpearl', orb(4, 'opPQW'), {'o': '#5A1A3A', 'p': '#C8508A', 'P': '#FF8FBF', 'Q': '#FFE3F0', 'W': '#FFFFFF'})
add('clawsnap', crescent(4.5, 'orR'), {'o': '#3A0A0A', 'r': '#8A2A2A', 'R': '#FF7A5A'})
add('bubble', pad(["..cccc..", ".c....c.", "c.WW...c", "c.W....c", "c......c", "c......c", ".c....c.", "..cccc.."]),
    {'c': '#A6E0D0', 'W': '#FFFFFF'})
add('candleflame', pad(["....y...", "...yY...", "...yYy..", "..gyWYg.", "..gYWYg.", "..ggyg..", "...kk...", "...kk..."]),
    {'g': '#6A9A2A', 'y': '#D4FF5A', 'Y': '#F4FFC8', 'W': '#FFFFFF', 'k': '#1A1A12'})
add('waxspark', pad(["........", "...W....", "..wGw...", ".WGyGW..", "..wGw...", "...W....", "........", "........"]),
    {'W': '#E8E0C8', 'w': '#B8AE94', 'G': '#8DB03A', 'y': '#F4FFC8'})

# ------------------------------------------------------------- parents & heralds
add('relic', orb(2.5, 'opPQW'), {'o': '#5A3A08', 'p': '#C98A22', 'P': '#F2C14E', 'Q': '#FFE3F0', 'W': '#FFFFFF'})
add('mournbell', pad(["...oo...", "..oHHo..", ".oHhhHo.", ".oHhhHo.", "oHHHHHHo", "oooooooo", "...oo...", "........"]),
    {'o': '#10180E', 'H': '#E3B95A', 'h': '#8A5A1E'})
add('glyphbolt', shard(9, 4, 'onCW'), {'o': '#16122A', 'n': '#4A4466', 'C': '#3BEFFF', 'W': '#CFFFFF'})
add('requiem', pad(["...GG...", "..G..G..", ".G.YY.G.", ".G.YY.G.", "..G..G..", "...GG...", "...GG...", "....G..."]),
    {'G': '#E3B95A', 'Y': '#FF4A5A'})
add('conchwave', crescent(5, 'oqP'), {'o': '#3A0E24', 'q': '#C8508A', 'P': '#FFE3F0'})
add('tidebolt', shard(8, 4, 'otTW'), {'o': '#0A3A34', 't': '#2B6E6A', 'T': '#5FB3A1', 'W': '#E8FFF8'})
add('bellwave', ring(5, 'H', inner='h', thick=1), {'H': '#E3B95A', 'h': '#8A5A1E'})
add('clapper', orb(2.5, 'okKyY'), {'o': '#10180E', 'k': '#3A4A2E', 'K': '#6E8450', 'y': '#D4FF5A', 'Y': '#F4FFC8'})
add('rimeflag', pad(["........", ".AAAAA..", ".AWWWAA.", ".AWcWA..", ".AAWAA..", ".AA.A...", ".A......", "........"]),
    {'A': '#A8E2FF', 'W': '#F0FCFF', 'c': '#3BEFFF'})
add('hailstone', orb(3, 'oaAWW'), {'o': '#0E1830', 'a': '#5FA8D8', 'A': '#A8E2FF', 'W': '#F0FCFF'})
add('gildlash', crescent(5, 'ogG'), {'o': '#3A2808', 'g': '#C98A22', 'G': '#FFF4C2'})
add('chainlink', pad(["........", "..oooo..", ".oGggGo.", ".oG..Go.", ".oG..Go.", ".oGggGo.", "..oooo..", "........"]),
    {'o': '#3A2808', 'G': '#F2C14E', 'g': '#A8792A'})

# ------------------------------------------------------------- wave 3: new small mobs + evolved parents
def _o(name, r, cols):            # orb from [outline, dark, mid, light, core]
    add(name, orb(r, 'oabcW'), dict(zip('oabcW', cols)))


def _s(name, ln, w, cols):        # shard from [outline, dark, mid, light]
    add(name, shard(ln, w, 'oabc'), dict(zip('oabc', cols)))


def _c(name, r, cols):            # crescent from [outline, dark, light]
    add(name, crescent(r, 'oab'), dict(zip('oab', cols)))


def _r(name, r, cols):            # ring [ring, inner]
    add(name, ring(r, 'a', inner='b', thick=1), dict(zip('ab', cols)))


_r('rustlink', 3.5, ['#C0603A', '#8A3A22'])
_s('lensflare', 9, 3, ['#5A4A3A', '#FFE45C', '#FFF6C8', '#FFFFFF'])
_o('tear', 2.2, ['#1E2A10', '#4C7A2E', '#7AA44A', '#D4FF5A', '#F4FFC8'])
_o('bloodclot', 2.4, ['#2A0A14', '#4A2A3A', '#7A4A5E', '#C87A9A', '#FFE0EA'])
_c('icenote', 4, ['#0E1830', '#5FA8D8', '#F0FCFF'])
_o('shieldboss', 2.6, ['#14101E', '#5A5A62', '#8A8A92', '#C8C8D0', '#FFFFFF'])
_o('goldtear', 2.2, ['#3A2808', '#A8792A', '#F2C14E', '#FFF4C2', '#FFFFFF'])
_s('bonebeam', 10, 3, ['#2A1A3A', '#B57CFF', '#E8E4D8', '#FFFFFF'])
_r('beacon', 4.5, ['#B8FFF2', '#1FCFB8'])
_s('saltcrystal', 9, 5, ['#3A4A5A', '#8AA0B4', '#C8D8E4', '#F0F6FA'])
_c('snapjaw', 4.5, ['#1A1410', '#C8B890', '#E8DCC0'])
_o('anchorhead', 3.6, ['#2A0E06', '#8A3A22', '#C0603A', '#FF9A6A', '#FFE0C8'])
_o('mothdust', 3, ['#3A3A4A', '#C8E8F0', '#E8F4F8', '#FFFFFF', '#FFE45C'])
_r('greattoll', 5.5, ['#5EF0FF', '#4FA37E'])
_s('tombshard', 9, 5, ['#151A12', '#5E6470', '#9AA0AE', '#D4FF5A'])
_c('chorusnote', 4.5, ['#10180E', '#6E8450', '#D4FF5A'])
_o('twinwisp', 2.6, ['#121410', '#3A3A2E', '#8DB03A', '#E8FF8A', '#FFFFFF'])
_o('tallowdrop', 3, ['#4A4434', '#B8AE94', '#E8E0C8', '#FFFFFF', '#8DB03A'])
_s('thornseed', 8, 4, ['#10180E', '#4A3A2A', '#7AA44A', '#D4FF5A'])
_o('leechspit', 2.6, ['#2A0A14', '#7A4A5E', '#C87A9A', '#FFC4DE', '#FFFFFF'])
_o('glacierchunk', 3.8, ['#0E1830', '#2A6FB0', '#5FA8D8', '#A8E2FF', '#F0FCFF'])
_r('wheelglyph', 3.5, ['#3BEFFF', '#CFFFFF'])
_s('hushtine', 10, 3, ['#12102A', '#8A7A6A', '#E8E4D8', '#3BEFFF'])
_r('sagachord', 5, ['#A8E2FF', '#F0FCFF'])
_c('shieldbash', 5, ['#14101E', '#6A4A30', '#C0603A'])
_s('jarlblade', 10, 4, ['#110E29', '#6A2ED6', '#E1E6F0', '#FFFFFF'])
_r('gluttonhalo', 5, ['#F2C14E', '#E2343F'])
_o('organblast', 3.6, ['#3A2808', '#A8792A', '#E3B95A', '#FFEB8F', '#FFFFFF'])
_s('seraphfeather', 10, 3, ['#3A3448', '#B8B0C8', '#E4DEEC', '#FFFFFF'])
_o('broodegg', 3, ['#2A1A3A', '#A8A294', '#E8E4D8', '#FFFFFF', '#B57CFF'])

# Emily, the Yapper: speech bubbles, snowballs and fish
add('yap', pad(["oooooooo", "oWWWWWWo", "oWkWkWko", "oWWWWWWo", "ooWWoooo", ".oWo....", ".oo.....", "........"]),
    {'o': '#1A1E2E', 'W': '#FFFFFF', 'k': '#D8457A'})
add('snowball', orb(3, 'osWWW'), {'o': '#2A3A5E', 's': '#A8B8D0', 'W': '#FFFFFF'})
add('fishy', pad(["........", "...oooo.", "o.obbbBo", "oooBbbeo", "oboBBbbo", "o.obbbo.", "...ooo..", "........"]),
    {'o': '#0E1830', 'b': '#5FA8D8', 'B': '#A8E2FF', 'e': '#101018'})


import weapon_shots  # noqa: E402,F401  (player weapon shots)
