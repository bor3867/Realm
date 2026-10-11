"""Build: Astral Observatory+ (ap_*). Mid-tier elites, small enemies, new shots, tiles, decor, treasure room."""
import json, os, shutil, sys, importlib, random
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = ["/home/claude/realm_bosses", "/home/claude/realm_expansion", f"{ROOT}/creatures", f"{ROOT}/data"]
from pixlib import render, outlined, hurt_frame, shine_frames
import astral_plus as D

OUT = f"{ROOT}/out"
if os.path.exists(OUT):
    shutil.rmtree(OUT)
for d in ("native", "x5", "previews"):
    os.makedirs(f"{OUT}/{d}")
P = D.PAL
ELITES = ["astrolabe_sentinel", "comet_hound", "nebula_weaver", "vault_keeper"]
FPS = {"walk": 6, "attack": 8, "ability": 6, "wake": 5}


class Sheet:
    def __init__(self, name, flat=False):
        self.name, self.rows, self.anims, self.info, self.flat = name, [], {}, {}, flat

    def add(self, sprite, frames, anims, **info):
        self.rows.append((sprite, frames)); self.anims[sprite] = anims
        if info:
            self.info[sprite] = info

    def pack(self, scale):
        gap = 1 if scale == 1 else 2
        placed, y, maxw = [], gap, 0
        for sprite, frames in self.rows:
            x, rh = gap, 0
            for fname, img in frames:
                if scale == 1:
                    im = img
                elif self.flat:
                    im = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
                else:
                    im = outlined(img, scale)
                placed.append((sprite, fname, im, x, y)); x += im.width + gap; rh = max(rh, im.height)
            maxw = max(maxw, x); y += rh + gap
        out = Image.new("RGBA", (maxw, y), (0, 0, 0, 0)); meta = {}
        for sprite, fname, im, x, y0 in placed:
            out.paste(im, (x, y0))
            meta.setdefault(sprite, {})[fname] = {"x": x, "y": y0, "w": im.width, "h": im.height}
        return out, meta


def chunky_death(img, k, seed=5):
    """Death in clean 2x2 chunks: chunks drop out and the rest brighten (no per-pixel noise)."""
    f = img.copy(); px = f.load(); rnd = random.Random(seed)
    for by in range(0, f.height, 2):
        for bx in range(0, f.width, 2):
            r = rnd.random()
            for y in range(by, min(by + 2, f.height)):
                for x in range(bx, min(bx + 2, f.width)):
                    if not px[x, y][3]:
                        continue
                    if r < k:
                        px[x, y] = (0, 0, 0, 0)
                    elif r < k + 0.25:
                        c = px[x, y]; px[x, y] = (min(255, c[0] + 80), min(255, c[1] + 80), min(255, c[2] + 90), c[3])
    return f


elites, enemies, shots = Sheet("ap_elites"), Sheet("ap_enemies"), Sheet("ap_shots")
tiles, decor, treasure = Sheet("ap_tiles", flat=True), Sheet("ap_decor"), Sheet("ap_treasure")
hover = {}
gif_src = {}

# ---------------------------------------------------------------- mid-tier elites
for name in ELITES:
    m = importlib.import_module(name)
    frames, anims = [], {}
    for an, ims in m.ANIMS.items():
        names = [f"{an}_{i}" for i in range(len(ims))]
        frames += list(zip(names, ims))
        anims[an] = {"frames": names, "fps": FPS[an], "loop": an == "walk"}
    if name == "vault_keeper":
        anims["dormant"] = {"frames": ["wake_0"], "fps": 1, "loop": True}
    frames.append(("hurt_0", hurt_frame(m.ANIMS["walk"][0])))
    anims["hurt"] = {"frames": ["hurt_0", "walk_0"], "fps": 12, "loop": False}
    for i, k in enumerate((0.25, 0.5, 0.8)):
        frames.append((f"death_{i}", chunky_death(m.ANIMS["walk"][0], k)))
    anims["death"] = {"frames": ["death_0", "death_1", "death_2"], "fps": 8, "loop": False}
    sl = []
    for s, fl in m.SHOTS.items():
        shots.add(f"{name}.{s}", [(str(i), f) for i, f in enumerate(fl)],
                  {"fly": {"frames": [str(i) for i in range(len(fl))], "fps": 10, "loop": True}}, text=m.INFO["shots_text"][s])
        sl.append(f"{name}.{s}")
    elites.add(name, frames, anims, title=m.INFO["title"], tier=m.INFO["tier"], ability=m.INFO["ability"],
               ability_text=m.INFO["ability_text"], shots=sl, size=list(m.ANIMS["walk"][0].size), floats=m.FLOATS)
    if m.FLOATS:
        hover[name] = {"amp_px": 1, "period_s": 2.4}
    gif_src[name] = m

# ---------------------------------------------------------------- small enemies
for name, (grids, floats, text) in D.SMALL.items():
    keys = list(grids)
    ims = [render(grids[k], P, k) for k in keys]
    frames = list(zip(keys, ims))
    frames.append(("hurt_0", hurt_frame(ims[0])))
    for i, k in enumerate((0.3, 0.7)):
        frames.append((f"death_{i}", chunky_death(ims[0], k)))
    anims = {"move": {"frames": keys[:-1], "fps": 4 if floats else 6, "loop": True},
             "attack": {"frames": [keys[-1], keys[0]], "fps": 6, "loop": False},
             "hurt": {"frames": ["hurt_0", keys[0]], "fps": 12, "loop": False},
             "death": {"frames": ["death_0", "death_1"], "fps": 8, "loop": False}}
    own = [k for k in D.SHOTS if k.startswith(name + ".")]
    enemies.add(name, frames, anims, title=name.replace("_", " ").title(), tier="small", text=text, shots=own, floats=floats)
    if floats:
        hover[name] = {"amp_px": 1, "period_s": 2.0}

# ---------------------------------------------------------------- 8x8 shots (new shots for old + new enemies, boss, trap)
for key, fr in D.SHOTS.items():
    shots.add(key, [(str(i), render(g, P, key)) for i, g in enumerate(fr)],
              {"fly": {"frames": [str(i) for i in range(len(fr))], "fps": 10, "loop": True}}, text=D.SHOT_TEXT[key])

# ---------------------------------------------------------------- tiles / decor / treasure
for key, fr in D.TILES.items():
    ims = [render(g, P, key) for g in fr]
    tiles.add(key, [(str(i), im) for i, im in enumerate(ims)],
              {"loop": {"frames": [str(i) for i in range(len(ims))], "fps": 2 if key == "astral_skylight" else 6, "loop": key != "vault_trap"}})
for key, fr in D.DECOR.items():
    ims = [render(g, P, key) for g in fr]
    decor.add(key, [(str(i), im) for i, im in enumerate(ims)],
              {"idle": {"frames": [str(i) for i in range(len(ims))], "fps": 5 if key == "celestial_brazier" else 2, "loop": True}},
              size=list(ims[0].size))
for key, v in D.TREASURE.items():
    if isinstance(v, dict):
        ims = [(k, render(g, P, k)) for k, g in v.items()]
        anims = {"idle": {"frames": ["closed", "glint"], "fps": 1, "loop": True},
                 "open": {"frames": ["opening", "open"], "fps": 6, "loop": False},
                 "opened": {"frames": ["open"], "fps": 1, "loop": True}}
    else:
        ims = [(str(i), render(g, P, key)) for i, g in enumerate(v)]
        if key == "vault_door":
            anims = {"sealed": {"frames": ["0"], "fps": 1, "loop": True}, "unlock": {"frames": ["1", "2"], "fps": 4, "loop": False},
                     "open": {"frames": ["2"], "fps": 1, "loop": True}}
        else:
            anims = {"idle": {"frames": [k for k, _ in ims], "fps": 2, "loop": True}}
    treasure.add(key, ims, anims, size=list(ims[0][1].size))
hover["relic_pedestal"] = {"note": "baked: the relic's bob is in the frames, plinth must stay still"}

# ---------------------------------------------------------------- write sheets + atlas
atlas = {"meta": {"name": "Astral Observatory+", "version": 1, "x5_scale": 5,
                  "notes": "Native sheets are 1px = 1 art pixel; x5 sheets are 5x with the 1px dark outline (tiles are not outlined). "
                           "Shots point right; rotate in-engine. Floating creatures get the renderer hover in HOVER (do not bake bobs)."},
         "sheets": {}, "hover": hover}
for sh in (elites, enemies, shots, tiles, decor, treasure):
    nat, nm = sh.pack(1)
    big, bm = sh.pack(5)
    nat.save(f"{OUT}/native/{sh.name}.png"); big.save(f"{OUT}/x5/{sh.name}.png")
    atlas["sheets"][sh.name] = {"native": f"native/{sh.name}.png", "x5": f"x5/{sh.name}.png",
                                "sprites": {s: {"frames": {f: {"native": nm[s][f], "x5": bm[s][f]} for f in nm[s]},
                                                "anims": sh.anims[s], **sh.info.get(s, {})} for s in nm}}
atlas["dungeon_additions"] = {
    "dungeon": "astral_observatory",
    "spawns": {
        "mid_tier": {"astrolabe_sentinel": "guards brass walkways in pairs", "comet_hound": "packs of 2 in the star-map halls",
                     "nebula_weaver": "1 per skylight hall, hangs over astral_skylight tiles"},
        "small": {"meteor_mite": "packs of 4-6 around fallen_meteor decor", "lens_wisp": "2-3 near lens_stand decor"},
    },
    "treasure_room": {
        "entrance": "vault_door (sealed until the Grand Orrery's 'Aligned' phase is broken, or by a vault key drop)",
        "floor": ["vault_floor", "vault_floor_plain", "vault_trap"], "walls": ["vault_wall_top", "vault_wall_side"],
        "objects": ["star_vault_chest (center)", "vault_keeper (dormant beside the chest)", "relic_pedestal x2",
                    "star_gold_pile x3-4", "celestial_brazier x4 (corners)"],
        "flow": "Open chest -> chest plays 'open' -> Vault Keeper plays 'wake' -> fight (Lockdown seals the vault_door) -> "
                "on death the doors unseal; the chest's loot table rolls when opened (loot is granted on keeper death).",
    },
}
json.dump(atlas, open(f"{OUT}/atlas_astral_plus.json", "w"), indent=1)

# ---------------------------------------------------------------- previews
BG = (36, 30, 52)


def gif_transparent(path, seq, scale=6, hover_amp=0, dur=150):
    """One creature's full animation sequence with a transparent background (for sharing)."""
    cells = [outlined(f, scale) for f in seq]
    cw = max(f.width for f in cells); ch = max(f.height for f in cells) + 2 * hover_amp * scale
    out = []
    import math
    for t, f in enumerate(cells):
        im = Image.new("RGBA", (cw + 8, ch + 8), (0, 0, 0, 0))
        dy = round(math.sin(t / len(cells) * 2 * math.pi * 3) * hover_amp) * scale if hover_amp else 0
        im.alpha_composite(f, ((cw + 8 - f.width) // 2, 4 + ch - f.height - hover_amp * scale + dy))
        key = Image.new("RGBA", im.size, (255, 0, 255, 255)); a = im.split()[3].point(lambda v: 255 if v > 100 else 0)
        key.paste(im.convert("RGB"), (0, 0), a)
        q = key.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
        out.append((q, key))
    # find the magenta index per frame and set it as transparent
    frames = []
    for q, key in out:
        p = q.getpalette(); idx = min(range(len(p) // 3), key=lambda i: abs(p[3 * i] - 255) + p[3 * i + 1] + abs(p[3 * i + 2] - 255))
        q.info["transparency"] = idx; frames.append((q, idx))
    frames[0][0].save(path, save_all=True, append_images=[f for f, _ in frames[1:]], duration=dur, loop=0,
                      transparency=frames[0][1], disposal=2)


for name, m in gif_src.items():
    seq = m.ANIMS["walk"] * 3 + m.ANIMS["attack"] + m.ANIMS["walk"] * 2 + m.ANIMS["ability"] + m.ANIMS["ability"][-1:] * 2
    if name == "vault_keeper":
        seq = m.ANIMS["wake"][:1] * 4 + m.ANIMS["wake"] + seq
    gif_transparent(f"{OUT}/previews/{name}.gif", seq, 6, hover_amp=1 if m.FLOATS else 0)
for name, (grids, floats, _) in D.SMALL.items():
    ims = [render(grids[k], P) for k in grids]
    seq = ims[:-1] * 4 + [ims[-1], ims[-1]] + ims[:-1] * 2
    gif_transparent(f"{OUT}/previews/{name}.gif", seq, 10, hover_amp=1 if floats else 0, dur=220)

# ---------------------------------------------------------------- contact sheet
def label(d, x, y, t):
    d.text((x, y), t, fill=(236, 230, 246))


S = 4
blocks = []
for sh in (elites, enemies, shots, decor, treasure):
    rows = []
    for sprite, frames in sh.rows:
        rows.append((sprite, [outlined(im, S if sh is not shots else 5) for _, im in frames]))
    blocks.append((sh.name, rows))
cols_w = 1500
img_rows = []
for title, rows in blocks:
    # flow sprites left to right, wrap
    x, y, lineh, placed = 10, 22, 0, []
    for sprite, ims in rows:
        w = sum(i.width + 3 for i in ims) + 10
        h = max(i.height for i in ims) + 14
        if x + w > cols_w:
            x, y = 10, y + lineh; lineh = 0
        placed.append((sprite, ims, x, y)); x += w + 8; lineh = max(lineh, h)
    blk = Image.new("RGB", (cols_w, y + lineh + 6), BG); d = ImageDraw.Draw(blk)
    label(d, 10, 4, title)
    for sprite, ims, x0, y0 in placed:
        label(d, x0, y0, sprite)
        xx = x0
        for i in ims:
            blk.paste(i, (xx, y0 + 12), i); xx += i.width + 3
    img_rows.append(blk)
# tiles block: each tile 3x3 tiled
tb = Image.new("RGB", (cols_w, 150), BG); d = ImageDraw.Draw(tb); label(d, 10, 4, "ap_tiles (3x3 tiled)")
x = 10
for sprite, frames in tiles.rows:
    t = frames[0][1]; im = Image.new("RGB", (24, 24))
    for yy in range(3):
        for xx in range(3):
            im.paste(t, (xx * 8, yy * 8))
    im = im.resize((96, 96), Image.NEAREST)
    if x + 100 > cols_w:
        break
    tb.paste(im, (x, 34)); label(d, x, 20, sprite[:16]); x += 106
img_rows.insert(3, tb)
H = sum(b.height for b in img_rows)
sheet = Image.new("RGB", (cols_w, H), BG); y = 0
for b in img_rows:
    sheet.paste(b, (0, y)); y += b.height
sheet.save(f"{OUT}/previews/contact_sheet.png")

# ---------------------------------------------------------------- treasure room mock-up (x4)
SC = 4; T = 8
room_w, room_h = 15, 11
tr = {k: [render(g, P) for g in v] for k, v in D.TILES.items()}
objs = []
def place(img, x, y):  # bottom-centre anchor in pixels
    objs.append((y, img, x - img.width // 2, y - img.height + 8))
door = render(D.TREASURE["vault_door"][2], P)
place(door, 7 * T + 4, 2 * T)
ch = render(D.TREASURE["star_vault_chest"]["closed"], P)
place(ch, 7 * T + 4, 6 * T + 6)
place(gif_src["vault_keeper"].ANIMS["wake"][0], 10 * T + 2, 7 * T + 2)
for x in (2, 12):
    place(render(D.TREASURE["relic_pedestal"][0], P), x * T + 4, 5 * T + 4)
for (x, y) in ((3, 9), (11, 9), (5, 6), (9, 3)):
    place(render(D.TREASURE["star_gold_pile"][0], P), x * T + 4, y * T + 6)
for (x, y) in ((1, 3), (13, 3), (1, 10), (13, 10)):
    place(render(D.DECOR["celestial_brazier"][0], P), x * T + 4, y * T + 6)
base = Image.new("RGBA", (room_w * T, room_h * T + 8), (0, 0, 0, 255))
for ty in range(room_h):
    for tx in range(room_w):
        if ty == 0 or tx in (0, room_w - 1):
            t = tr["vault_wall_top"][0]
        elif ty == 1:
            t = tr["vault_wall_side"][0]
        elif (tx, ty) in ((4, 8), (10, 8), (4, 4), (10, 4)):
            t = tr["vault_trap"][0]
        elif (tx, ty) == (7, 6):
            t = tr["vault_floor"][0]
        else:
            t = tr["vault_floor"][0] if (abs(tx - 7) <= 1 and abs(ty - 6) <= 1 and (tx + ty) % 2 == 1) else tr["vault_floor_plain"][0]
        base.paste(t, (tx * T, ty * T + 8))
big = base.resize((base.width * SC, base.height * SC), Image.NEAREST)
for _, img, x, y in sorted(objs, key=lambda o: o[0]):
    o = outlined(img, SC)
    big.alpha_composite(o, (x * SC - 1, y * SC - 1))
big.convert("RGB").save(f"{OUT}/previews/treasure_room.png")
print("ok:", {s.name: len(s.rows) for s in (elites, enemies, shots, tiles, decor, treasure)})
