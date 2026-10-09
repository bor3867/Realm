"""Player weapon shots: one per tier for each weapon type, plus a signature shot
for every untiered weapon. Imported at the end of projectiles.py."""
from projectiles import add, orb, ring, pad, crescent, N


def _o(name, r, cols):
    add(name, orb(r, 'oabcW'), dict(zip('oabcW', cols)))


def _ramp(t):
    import world_art
    a, b, c, d = world_art.TIER_RAMPS[t]
    return a, b, c, d, world_art.lighten(c)


def _sparks(g, pts, ch):
    g = [list(r) for r in g]
    for x, y in pts:
        if 0 <= x < N and 0 <= y < N and g[y][x] == '.':
            g[y][x] = ch
    return [''.join(r) for r in g]


for t in range(11):
    a, b, c, d, h = _ramp(t)
    form = 0 if t <= 3 else 1 if t <= 7 else 2
    # GAUNTLET: a thrown fist of embers in the tier's metal
    g = orb(2.2 + form * 0.5, 'oabcW')
    if form >= 1:
        g = _sparks(g, [(2, 2), (9, 2), (2, 9), (9, 9)], 'd')
    if form == 2:
        g = _sparks(g, [(5, 0), (0, 5), (11, 6), (6, 11)], 'W')
    add(f'pj_gauntlet_{t}', g, {'o': '#0A070C', 'a': a, 'b': b, 'c': c, 'W': h, 'd': d})

    # TONGS: a glowing billet; it gets longer with tier
    L = 6 + form
    x0 = (N - L) // 2
    rows = [['.'] * N for _ in range(N)]
    for x in range(x0, x0 + L):
        rows[4][x] = 'o'; rows[7][x] = 'o'
        rows[5][x] = 'c'; rows[6][x] = 'b'
    rows[5][x0] = rows[6][x0] = 'o'
    rows[5][x0 + L - 1] = rows[6][x0 + L - 1] = 'o'
    rows[5][x0 + L - 2] = 'W'; rows[6][x0 + L - 2] = 'd'
    rows = [''.join(r) for r in rows]
    if form >= 1:
        rows = _sparks(rows, [(x0 - 1, 5), (x0 - 2, 7), (x0 - 1, 8)], 'd')
    if form == 2:
        rows = _sparks(rows, [(x0 - 3, 4), (x0, 9), (x0 - 4, 6)], 'W')
    add(f'pj_tongs_{t}', rows, {'o': '#0A070C', 'b': b, 'c': c, 'W': h, 'd': d})

    # SUN-ROD: a lance of light edged in the tier colour
    core = 'W' if form < 2 else 'h'
    rows = ['.' * N] * 4 + [
        '..' + 'b' * 7 + '...',
        'ccc' + core * 7 + 'cc',
        'ccc' + core * 7 + 'cc',
        '..' + 'b' * 7 + '...',
    ] + ['.' * N] * 4
    if form >= 1:
        rows = _sparks(rows, [(10, 3), (10, 8), (8, 2), (8, 9)], 'd')
    if form == 2:
        rows = _sparks(rows, [(11, 3), (11, 8), (11, 4), (11, 7)], 'W')
    add(f'pj_sunrod_{t}', rows, {'b': b, 'c': c, 'W': '#FFFDF0', 'h': h, 'd': d})

# ---- untiered weapons: signature shots
_o('pj_unstruck', 3.2, ['#120C10', '#4F4B60', '#F2641A', '#FFC94A', '#FFF6C8'])
add('pj_firstoath', ['............', '............', '............', '..oooooooo..', '.oWWWWWWYYo.', 'oWWWWWWWYYMo',
                     'oWWWWWWWYYMo', '.oYYYYYYMMo.', '..oooooooo..', '............', '............', '............'],
    {'o': '#3A0E06', 'W': '#FFFDF0', 'Y': '#FFC94A', 'M': '#F2641A'})
add('pj_claw', crescent(4.5, 'oab'), {'o': '#3A0A14', 'a': '#D4583C', 'b': '#FFE3F0'})
add('pj_head', pad(['..oooo..', '.oIIIIo.', 'oIRIIRIo', 'oIIIIIIo', 'oIiooiIo', '.oIIIIo.', '..oooo..', '........']),
    {'o': '#0E0A0E', 'I': '#E4DEEC', 'i': '#A8A0B8', 'R': '#FF4A5A'})
add('pj_hammer', pad(['oooooooo', 'oWWWWWYo', 'oYYYYYMo', 'oooooooo', '...oMo..', '...oMo..', '...oYo..', '...ooo..']),
    {'o': '#120E14', 'W': '#FFF6C8', 'Y': '#FFC94A', 'M': '#FF7A1A'})
add('pj_starfist', pad(['...W....', '..WCW...', 'WWCWCWW.', '.CWWWC..', 'WWCWCWW.', '..WCW...', '...W....', '........']),
    {'W': '#FFFFFF', 'C': '#3BC8E8'})
add('pj_psalter', pad(['.oooooo.', 'oQqqqqGo', 'oqGGGGqo', 'oqGWWGqo', 'oqGGGGqo', 'oGqqqqQo', '.oooooo.', '........']),
    {'o': '#0E0A0E', 'q': '#3A1A6A', 'Q': '#B888FF', 'G': '#F2C14E', 'W': '#FFFDF0'})
add('pj_scourge', ring(4, 'G', inner='R', thick=1), {'G': '#F2C14E', 'R': '#B0213F'})
add('pj_tallow', pad(['...yY...', '...gy...', '..owwo..', '..oWwo..', '..owwo..', '..owWo..', '..oooo..', '........']),
    {'o': '#4A4434', 'w': '#E8E0C8', 'W': '#FFFFFF', 'g': '#8DB03A', 'y': '#D4FF5A', 'Y': '#F4FFC8'})
add('pj_orrery', pad(['..cccc..', '.c....c.', 'c..WW..c', 'c.WCCW.c', 'c.WCCW.c', 'c..WW..c', '.c....c.', '..cccc..']),
    {'c': '#3BEFFF', 'W': '#F0FCFF', 'C': '#3A57A8'})
add('pj_crozier', pad(['..GGG...', '.G...G..', '.G..pP..', '..GpPPp.', '....pPp.', '.....p..', '........', '........']),
    {'G': '#F2C14E', 'p': '#FF8FBF', 'P': '#FFE3F0'})
_o('pj_godfist', 3.2, ['#2A0A10', '#6A0A1A', '#B0213F', '#F2C14E', '#FFEB8F'])
add('pj_godbillet', ['............', '............', '............', '..oooooooo..', '.oGGGGGGYYo.', 'oRRWWWWWWYYo',
                     'oRRWWWWWWYYo', '.oGGGGGGYYo.', '..oooooooo..', '............', '............', '............'],
    {'o': '#2A0A10', 'G': '#F2C14E', 'Y': '#FFEB8F', 'W': '#FFFDF0', 'R': '#FF4A5A'})
add('pj_godlance', ['............', '............', '............', '............', '..RRGGGGG...', 'RRGWWWWWWWGG',
                    'RRGWWWWWWWGG', '..RRGGGGG...', '............', '............', '............', '............'],
    {'R': '#B0213F', 'G': '#F2C14E', 'W': '#FFFDF0'})


# ---- Summoner soul-wisps + Harpooner harpoons (both point RIGHT; the renderer rotates them)
def _wisp(core, body, rim, tail, sparks=0):
    rows = [['.'] * N for _ in range(N)]
    for y in range(N):
        for x in range(N):
            d = ((x - 7.5) ** 2 + (y - 5.5) ** 2) ** 0.5
            if d <= 1.2:
                rows[y][x] = 'W'
            elif d <= 2.3:
                rows[y][x] = 'c'
            elif d <= 3.1 and x >= 6:
                rows[y][x] = 'b'
    for k, (x, y) in enumerate(((4, 5), (3, 6), (2, 6), (1, 7), (4, 6), (3, 7), (5, 4), (4, 4))):
        rows[y][x] = 'b' if k < 4 else 'a'
    if sparks:
        for x, y in ((10, 2), (11, 8), (5, 9))[:sparks]:
            rows[y][x] = 'W'
    return [''.join(r) for r in rows], {'W': core, 'c': body, 'b': rim, 'a': tail}


def _harpoon(shaft, steel, edge, paint, glow=None):
    rows = ['............', '............', '............', '.........s..', '........sSs.',
            'RRwwwwwwwSSE', 'rrwwwwwwwSSE', '........sSs.', '.........s..', '............', '............', '............']
    rows[4] = rows[4][:7] + 'p' + rows[4][8:]
    rows[7] = rows[7][:7] + 'p' + rows[7][8:]
    pal = {'w': shaft, 's': steel, 'S': edge, 'E': edge, 'p': paint, 'R': '#C8A060', 'r': '#7A5A32'}
    if glow:
        rows[5] = rows[5][:11] + 'G'; pal['G'] = glow
    return rows, pal


for t in range(11):
    a, b, c, d, h = _ramp(t)
    form = 0 if t <= 3 else 1 if t <= 7 else 2
    g, pal = _wisp('#F0FFFA', '#5EF0C8' if t < 4 else c, b if t >= 4 else '#2E8A7A', a if t >= 4 else '#1F5A50', sparks=form)
    add(f'pj_lantern_{t}', g, pal)
    g, pal = _harpoon('#8A5A32' if t < 4 else b, c, h, d if form else '#B0213F', glow=d if form == 2 else None)
    add(f'pj_harpoon_{t}', g, pal)

add('pj_thrall', pad(['..bbb...', '.bcbcb..', '.bbbbb..', '..bdb...', '...q....', '..q.....', '........', '........']),
    {'b': '#ECE4CC', 'c': '#5EF0C8', 'd': '#3A3048', 'q': '#2E8A7A'})
g, pal = _wisp('#FFF6C8', '#FFC94A', '#9A96B4', '#4F4B60', 2); add('pj_lastwatch', g, pal)
g, pal = _wisp('#FFFFFF', '#DFF8FF', '#8AF6FF', '#3BC8E8', 3); add('pj_choir', g, pal)
add('pj_choirspark', pad(['...W....', '..WcW...', '...W....', '........', '........', '........', '........', '........']), {'W': '#FFFFFF', 'c': '#8AF6FF'})
g, pal = _harpoon('#5FB3A1', '#E8DCC0', '#FFE3F0', '#FF8FBF'); add('pj_tine', g, pal)
add('pj_tineshard', pad(['..pP....', '.pPPp...', '..pp....', '........', '........', '........', '........', '........']), {'p': '#FF8FBF', 'P': '#FFE3F0'})
g, pal = _harpoon('#B0213F', '#F2C14E', '#FFEB8F', '#3BEFFF', glow='#3BEFFF'); add('pj_krakenbane', g, pal)
g, pal = _harpoon('#C8D4E0', '#FFFFFF', '#FFFFFF', '#8AF6FF', glow='#8AF6FF'); add('pj_whitewhale', g, pal)
add('pj_whaleshard', pad(['...W....', '..WSW...', '.WS.SW..', '..WSW...', '...W....', '........', '........', '........']), {'W': '#FFFFFF', 'S': '#8AF6FF'})
_o('pj_cinderfist', 3.2, ['#3A0E06', '#8C2A12', '#F2641A', '#FFC94A', '#FFF6C8'])
add('pj_quench', ['............', '............', '............', '..oooooooo..', '.oCCCCCCWWo.', 'occccccCCWWo',
                  'occccccCCWWo', '.oCCCCCCcco.', '..oooooooo..', '............', '............', '............'],
    {'o': '#0E1830', 'c': '#5FA8D8', 'C': '#AEE6FF', 'W': '#F0FCFF'})
add('pj_dawn', ['............', '............', '............', '............', '..MMYYYYY...', 'MMYWWWWWWWYY',
                'MMYWWWWWWWYY', '..MMYYYYY...', '............', '............', '............', '............'],
    {'M': '#FF8A5A', 'Y': '#F2C14E', 'W': '#FFFDF0'})
add('pj_dawnray', pad(['........', '..YW....', '.YWWY...', '..WY....', '........', '........', '........', '........']), {'Y': '#FFC94A', 'W': '#FFFDF0'})
add('pj_admin', pad(['...WW...', '..WMMW..', 'WWMCCMWW', 'WMCWWCMW', 'WMCWWCMW', 'WWMCCMWW', '..WMMW..', '...WW...']),
    {'W': '#FFFFFF', 'M': '#FF4AF0', 'C': '#8AF6FF'})
add('grapple', ['............', '............', '..........s.', '.........sS.', '.....rrrsSss', 'RRRRRRRSSSs.',
                'rrrrrrrrsSs.', '.........sS.', '..........s.', '............', '............', '............'],
    {'R': '#C8A060', 'r': '#7A5A32', 's': '#6E7A8A', 'S': '#D0DCE8'})


# ---- Duelist thrusts, Stormwright bolts, Clockmaker weights (thrusts + bolts point RIGHT and rotate)
def _needle(edge, core, glint, flare=False):
    rows = ['............'] * 4 + ['.......ee...', 'eeeccccccWW.', '...eeeccee..', '............'] + ['............'] * 4
    pal = {'e': edge, 'c': core, 'W': glint}
    if flare:
        rows[3] = '..........W.'; rows[8] = '..........W.'
    return rows, pal


def _bolt(dark, mid, core):
    rows = ['............', '............', '..........C.', '.....d...Cc.', '....dcd.Cc..', 'dd.dcCcdcC..',
            '.ddcC.cCc...', '..dc...c....', '..d.........', '............', '............', '............']
    return rows, {'d': dark, 'c': mid, 'C': core}


def _bob(rim, body, glint, chain):
    rows = ['....ss......', '.....s......', '.....s......', '....oooo....', '...obbbbo...', '..obBbbbbo..',
            '..obBbbbbo..', '..obbbbbbo..', '...obbbbo...', '....oooo....', '............', '............']
    return rows, {'s': chain, 'o': rim, 'b': body, 'B': glint}


for t in range(11):
    a, b, c, d, h = _ramp(t)
    form = 0 if t <= 3 else 1 if t <= 7 else 2
    g, pal = _needle(b, c, h, flare=form == 2); add(f'pj_rapier_{t}', g, pal)
    g, pal = _bolt(b if t >= 4 else '#2E5A8A', c if t >= 4 else '#8AC8FF', '#FFFFFF'); add(f'pj_coil_{t}', g, pal)
    g, pal = _bob('#2A1A0A', b, h, '#8E8AA6'); add(f'pj_pendulum_{t}', g, pal)

g, pal = _needle('#C83444', '#CFE8FF', '#FFFFFF', True); add('pj_reflection', g, pal)
g, pal = _needle('#3BC8E8', '#DFF8FF', '#FFFFFF', True); add('pj_mirrorworld', g, pal)
add('pj_glass', pad(['...W....', '..WSs...', '.WSs....', '..s.....', '........', '........', '........', '........']),
    {'W': '#FFFFFF', 'S': '#CFE8FF', 's': '#7AA4CC'})
g, pal = _bolt('#3A57A8', '#8AF6FF', '#FFFFFF'); add('pj_heavenwire', g, pal)
g, pal = _bolt('#3BC8E8', '#FFE45C', '#FFFFFF'); add('pj_firststorm', g, pal)
g, pal = _bob('#3A0E06', '#B0213F', '#FFE08A', '#C8962A'); add('pj_eleventh', g, pal)
g, pal = _bob('#0E1530', '#3BC8E8', '#FFFFFF', '#8AF6FF'); add('pj_lastsecond', g, pal)
add('pj_cog', pad(['..B.B...', '.BBBBB..', 'BBYoYBB.', '.BYoYB..', 'BBYYYBB.', '.BBBBB..', '..B.B...', '........']),
    {'B': '#C8962A', 'Y': '#FFE08A', 'o': '#2A1A0A'})

from projectiles import shard  # noqa: E402
for t in range(11):
    a, b, c, d, h = _ramp(t)
    form = 0 if t <= 3 else 1 if t <= 7 else 2
    g = shard(9 + form, 4, 'oabc')
    add(f'pj_sword_{t}', g, {'o': '#0A070C', 'a': b, 'b': c, 'c': h})
    g, pal = _needle(b, c, h, flare=form == 2); add(f'pj_dagger_{t}', g, pal)
    add(f'pj_bow_{t}', ['............'] * 5 + ['.ff.....cc..', 'fwwwwwwwccc.', '.ff.....cc..'] + ['............'] * 4,
        {'f': '#F0E6D0', 'w': '#8A6038', 'c': c})
    add(f'pj_staff_{t}', orb(2.4 + form * 0.3, 'oabcW'), {'o': '#0A070C', 'a': a, 'b': b, 'c': c, 'W': h})
    g, pal = _bolt(b, c, h); add(f'pj_wand_{t}', g, pal)

# ---- new relic shots
g, pal = _wisp('#ECE4CC', '#5EF0C8', '#9A9078', '#3A3048', 2); add('pj_bonelantern', g, pal)
add('pj_bone', pad(['........', '.bb..bb.', '..bBBb..', '..bBBb..', '.bb..bb.', '........', '........', '........']), {'b': '#ECE4CC', 'B': '#9A9078'})
g, pal = _needle('#6A2ED6', '#E1E6F0', '#FFFFFF', True); add('pj_feint', g, pal)
g, pal = _bolt('#C98A22', '#FFE45C', '#FFFFFF'); add('pj_lightningrod', g, pal)
add('pj_cuckoo', pad(['..yy....', '.yWWyy..', 'yWkWWWy.', '.yWWWWyb', '..yWWyBb', '...yy...', '........', '........']),
    {'y': '#7A5232', 'W': '#F0E6D0', 'k': '#101018', 'b': '#E0701A', 'B': '#FFB03A'})


# ---- wave-3 enemy shots
add('eelspit', pad(['........', '..pPq...', '.pPqqP..', '..pPP...', '........', '........', '........', '........']),
    {'p': '#C8508A', 'P': '#FF8FBF', 'q': '#FFE3F0'})
add('bogspit', pad(['..ggg...', '.gGKGg..', 'gGKYKGg.', 'gGKKKGg.', '.gGGGg..', '..ggg...', '........', '........']),
    {'g': '#2A3620', 'G': '#6A8A30', 'K': '#A8C850', 'Y': '#E8FF9A'})
add('iceneedle', ['............', '............', '............', '............', '............', 'iiIIIwwwWW..',
                  'iiIIIwwwWW..', '............', '............', '............', '............', '............'],
    {'i': '#3A57A8', 'I': '#8AC8FF', 'w': '#E8F6FF', 'W': '#FFFFFF'})
add('emberfeather', ['............', '............', '............', '............', '...ff.......', '.fFFYYYXX...',
                     '..ffFFYY....', '....f.......', '............', '............', '............', '............'],
    {'f': '#8C2A12', 'F': '#F2641A', 'Y': '#FFC94A', 'X': '#FFF6C8'})


# ---- wave-4 enemy shots
add('slimeglob', pad(['..tT....', '.tTUW...', '.tTTU...', '..tt....', '........', '........', '........', '........']),
    {'t': '#1E6A70', 'T': '#3FB3B0', 'U': '#8AF0E0', 'W': '#E8FFFA'})
add('gasbubble', pad(['..gg....', '.gKyg...', '.gKKg...', '..gg....', '........', '........', '........', '........']),
    {'g': '#5A7A22', 'K': '#C8E86A', 'y': '#F4FFC8'})
add('mendrune', pad(['...G....', '..GWG...', '.GW.WG..', '..GWG...', '...G....', '........', '........', '........']),
    {'G': '#7AFFB0', 'W': '#E8FFF0'})


# ---- dungeon monster shots
add('splinter', ['............', '............', '............', '............', '............', '..wwWWWvv...',
                 '...wwWWv....', '............', '............', '............', '............', '............'],
    {'w': '#4A3020', 'W': '#7A5232', 'v': '#B07A44'})
add('inkblot', pad(['..kk....', '.kKbk...', 'kKbbck..', '.kbck...', '..kk....', '...k....', '........', '........']),
    {'k': '#141428', 'K': '#2E2E5A', 'b': '#4A4AA0', 'c': '#8AC8FF'})
add('page', pad(['.pppp...', '.pPPPp..', '.pc.Pp..', '.pPcPp..', '.pPPPp..', '..pppp..', '........', '........']),
    {'p': '#B8AE94', 'P': '#F0E8D0', 'c': '#3BEFFF'})
