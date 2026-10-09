"""Builds the Vanguard-class sprite assets + previews.

    py tools/build_vanguard.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pixlib import hex_rgba, render, write_png, sheet  # noqa: E402
import forgefist  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), '..', 'art', 'sprites', 'player', 'brawler')
PREVIEW = os.path.join(ROOT, 'preview')
os.makedirs(PREVIEW, exist_ok=True)

FW = FH = 16
BG = hex_rgba('#2A2833')


def build_forgefist():
    pal = {k: hex_rgba(v) for k, v in forgefist.PAL.items()}
    F = forgefist.frames()
    grid_rows, anims = [], {}
    for r, (_, keys) in enumerate(forgefist.LAYOUT):
        row = []
        for key in keys:
            anims[key] = {'row': r, 'col': len(row), 'frames': len(F[key])}
            row.extend(F[key])
        grid_rows.append(row)
    big = sheet(grid_rows, FW, FH)
    write_png(os.path.join(ROOT, 'forgefist_sheet.png'), render(big, pal))
    write_png(os.path.join(PREVIEW, 'forgefist_sheet_x8.png'), render(big, pal, 8, BG))
    return F, anims, len(grid_rows), max(len(r) for r in grid_rows)


def paste(dst, src, x, y):
    for j, row in enumerate(src):
        for i, px in enumerate(row):
            if px[3]:
                dst[y + j][x + i] = px


def build_candidates():
    import candidates
    F = forgefist.frames()
    sets = [
        ('a_cairnwarden', candidates.PAL_A, candidates.cairnwarden()),
        ('b_hollow_thane', candidates.PAL_B, candidates.hollow_thane()),
        ('c_forgefist', forgefist.PAL, [F['front_idle'][0], F['front_idle'][1], F['front_attack'][1]]),
    ]
    S, G = 8, 16                     # preview scale, gutter
    cell = FW * S
    W = G + 5 * (cell + G) + (FW + G) + (FW * 2 + G)
    H = G + len(sets) * (cell + G)
    canvas = [[BG] * W for _ in range(H)]
    sil = hex_rgba('#0A0A0E')
    for n, (name, hexpal, frs) in enumerate(sets):
        pal = {k: hex_rgba(v) for k, v in hexpal.items()}
        # 1x asset strip (transparent)
        write_png(os.path.join(ROOT, 'candidates', f'{name}_strip.png'), render(sheet([frs], FW, FH), pal))
        y = G + n * (cell + G)
        x = G
        for fr in frs:
            paste(canvas, render(fr, pal, S), x, y)
            x += cell + G
        for fr in (frs[0], frs[2]):
            paste(canvas, render(fr, pal, S, silhouette=sil), x, y)
            x += cell + G
        paste(canvas, render(frs[0], pal, 1), x, y + cell - FH)          # true 100% size
        x += FW + G
        paste(canvas, render(frs[0], pal, 2), x, y + cell - FH * 2)      # 200%
    write_png(os.path.join(PREVIEW, 'candidates_x8.png'), canvas)


TIMING = {  # fps, loop
    'idle': (3, True), 'walk': (8, True), 'attack': (12, False),
    'ability': (10, False), 'hit': (1, False), 'death': (8, False),
}


def kind(key):
    for k in TIMING:
        if k in key:
            return k


def write_guide(anims, rows, cols):
    guide = {
        'image': 'forgefist_sheet.png',
        'frameWidth': FW, 'frameHeight': FH, 'columns': cols, 'rows': rows,
        'frameCount': sum(a['frames'] for a in anims.values()),
        'pivot': {'x': 8, 'y': 15, 'note': 'pixel coords inside each frame: bottom-centre between the boots'},
        'animations': {},
    }
    for key, a in anims.items():
        fps, loop = TIMING[kind(key)]
        if key == 'hit':
            guide['animations'][key] = dict(a, fps=fps, loop=False, holdMs=150,
                                            note='one frame per facing: front, right, left, back')
            continue
        guide['animations'][key] = dict(a, fps=fps, loop=loop)
    guide['animations']['death']['holdLastFrame'] = True
    guide['animations']['front_attack']['eventFrame'] = 1
    for d in ('right', 'left', 'back'):
        guide['animations'][f'{d}_attack']['eventFrame'] = 1
    guide['animations']['ability']['eventFrame'] = 3
    with open(os.path.join(ROOT, 'forgefist_sheet.json'), 'w') as f:
        json.dump(guide, f, indent=2)
    return guide


def write_player(guide):
    import base64
    with open(os.path.join(ROOT, 'forgefist_sheet.png'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    html = PLAYER.replace('__IMG__', b64).replace('__GUIDE__', json.dumps(guide))
    with open(os.path.join(PREVIEW, 'forgefist_player.html'), 'w') as f:
        f.write(html)


PLAYER = r"""<!doctype html><html><head><meta charset="utf-8"><title>Forgefist Animations</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--bg:#1d1b24;--fg:#e9e4f2;--mut:#8d88a0;--tile:#2a2833;--grass:#355236}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:13px/1.4 system-ui,sans-serif}
h1{font-size:16px;margin:0 0 12px}.g{display:flex;flex-wrap:wrap;gap:12px}
.c{background:var(--tile);padding:8px;border-radius:6px;text-align:center}
.c.grass{background:var(--grass)}canvas{image-rendering:pixelated;display:block}
.l{color:var(--mut);margin-top:4px}label{margin-right:12px}
</style></head><body>
<h1>Forgefist: animation check</h1>
<p><label><input type="checkbox" id="grass"> grass terrain</label>
<label>scale <input type="range" id="sc" min="2" max="10" value="6"></label></p>
<div class="g" id="g"></div>
<script>
const G=__GUIDE__,img=new Image();img.src='data:image/png;base64,__IMG__';
const cells=[];
img.onload=()=>{for(const[k,a]of Object.entries(G.animations)){
 const d=document.createElement('div');d.className='c';
 const c=document.createElement('canvas');d.append(c);
 const l=document.createElement('div');l.className='l';l.textContent=`${k} · ${a.frames}f @${a.fps}fps${a.loop?' loop':''}`;d.append(l);
 document.getElementById('g').append(d);cells.push({k,a,c,d,t0:performance.now()});}
 requestAnimationFrame(tick);};
function tick(t){const s=+document.getElementById('sc').value,gr=document.getElementById('grass').checked;
 for(const o of cells){const{a,c}=o;o.d.classList.toggle('grass',gr);
  c.width=c.height=G.frameWidth*s;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const fps=o.k==='hit'?2:a.fps,n=Math.floor((t-o.t0)/1000*fps);
  let f=a.loop?n%a.frames:n%(a.frames+(a.holdLastFrame?6:3));f=Math.min(f,a.frames-1);
  x.drawImage(img,(a.col+f)*G.frameWidth,a.row*G.frameHeight,G.frameWidth,G.frameHeight,0,0,c.width,c.height);}
 requestAnimationFrame(tick);}
</script></body></html>"""


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'candidates'), exist_ok=True)
    F, anims, rows, cols = build_forgefist()
    build_candidates()
    write_player(write_guide(anims, rows, cols))
    print(rows, cols)
