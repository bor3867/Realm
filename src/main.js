// Boot: load assets, wire input (through rebindable settings), run the loop.
import { loadAssets } from './assets.js';
import { loadSave } from './save.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { UI } from './ui.js';
import { loadSettings, saveSettings, actionFor, MINI_STEPS, VIEW_ZOOM } from './settings.js';
import { Sfx } from './sfx.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');

async function boot() {
  if (new URLSearchParams(location.search).has('sprites')) { (await import('./spritebrowser.js')).run(); return; }   // dev: the sprite browser
  let assets;
  try {
    assets = await loadAssets();
    (await import('./rf/host.js')).loadRF();      // the Realmforge dungeons' data, in the background
  } catch (err) {
    stage.innerHTML = `<p style="padding:20px">Could not load game assets (${err.message}).<br>Serve this folder over HTTP, e.g. <code>node tools/serve.mjs</code></p>`;
    return;
  }
  const settings = loadSettings();
  const game = new Game(assets, loadSave());
  game.netStart();                                   // the other players, when a server is there (src/net.js)
  addEventListener('pagehide', () => { if (game.account && game.account.online) { if (game.player && !game.player.dead && game.mode === 'play') game.persist(); game.netSaveNow(); } });   // (an online save goes before you leave)
  const rnd = new Renderer(canvas, document.getElementById('minimap'), assets);
  rnd.settings = settings;
  rnd.game = game;
  const ui = new UI(game, rnd);
  ui.settings = settings;
  window.__game = game; window.__rnd = rnd; window.__ui = ui; // handy for debugging in devtools

  const fit = () => { if (stage.clientWidth > 0 && stage.clientHeight > 0) rnd.resize(stage.clientWidth, stage.clientHeight); };   // a hidden pane has no size yet: wait for one
  new ResizeObserver(fit).observe(stage);
  fit();
  const sfx = new Sfx();
  sfx.setVolume(settings.volume, settings.muted);
  ui.sfx = sfx;
  ui.onSettingsChanged = () => { saveSettings(settings); fit(); sfx.setVolume(settings.volume, settings.muted); ui.keyLine(); };
  ui.keyLine();                                          // the hints show your own keys
  game.onTravel = (where) => ui.travel(where);            // portals show a loading card while the next place is made
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => sfx.unlock(), { once: false, passive: true });
  ui.miniLabel();

  // ---- minimap zoom
  const miniZoom = (dir) => {
    let i = MINI_STEPS.indexOf(settings.miniView);
    if (i < 0) i = MINI_STEPS.reduce((b, v, j) => (Math.abs(v - settings.miniView) < Math.abs(MINI_STEPS[b] - settings.miniView) ? j : b), 0);   // an old saved range: snap to the nearest step
    const k = Math.max(0, Math.min(MINI_STEPS.length - 1, i + dir));
    settings.miniView = MINI_STEPS[k];
    saveSettings(settings);
    ui.miniLabel();
  };
  ui.miniZoom = miniZoom;
  // ---- view zoom: lean in or out a little around the player
  const viewZoom = (dir) => {
    const v = Math.round(((+settings.viewZoom || 1) + dir * VIEW_ZOOM.step) * 100) / 100;
    settings.viewZoom = Math.max(VIEW_ZOOM.min, Math.min(VIEW_ZOOM.max, v));
    saveSettings(settings); fit();
    game.toast && game.toast(`View zoom ${Math.round(settings.viewZoom * 100)}%`);
  };
  // click a discovered waypoint on the minimap to travel there
  const mini = document.getElementById('minimap');
  mini.addEventListener('click', (e) => {
    const T = rnd.miniT;
    if (!T || game.mode !== 'play' || game.map.kind !== 'realm' || game.player.dead) return;
    const r = mini.getBoundingClientRect(), cx = (e.clientX - r.left) * (mini.width / r.width), cy = (e.clientY - r.top) * (mini.height / r.height);
    const known = game.player.waypoints || [];
    let best = null, bd = 14;                                  // within 14 minimap pixels of the click
    for (const o of game.map.objects) {
      if (o.interact !== 'waypoint' || !known.includes(o.name)) continue;
      const d = Math.hypot((o.x - T.x0) * T.k - cx, (o.y - T.y0) * T.k - cy);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) { wpMenu.classList.add('hidden'); return; }
    // a dropdown at the click: the waypoint's name and a Teleport button (2026-10-19)
    wpMenu.querySelector('b').textContent = best.name;
    wpMenu.dataset.to = best.name;
    wpMenu.style.left = Math.round(e.clientX - 150) + 'px'; wpMenu.style.top = Math.round(e.clientY + 8) + 'px';
    wpMenu.classList.remove('hidden');
    e.stopPropagation();
  });
  const wpMenu = document.createElement('div');
  wpMenu.id = 'wpmenu'; wpMenu.className = 'hidden';
  wpMenu.innerHTML = '<b></b><button type="button">Teleport</button>';
  document.body.appendChild(wpMenu);
  wpMenu.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation(); wpMenu.classList.add('hidden');
    if (game.mode !== 'play' || game.player.dead) return;
    const err = game.warpTo(wpMenu.dataset.to); if (err) game.toast(err);
  });
  document.addEventListener('click', (e) => { if (!wpMenu.contains(e.target) && e.target !== mini) wpMenu.classList.add('hidden'); });
  addEventListener('keydown', (e) => { if (e.code === 'Escape') wpMenu.classList.add('hidden'); });
  mini.addEventListener('mousemove', (e) => {
    const T = rnd.miniT;
    if (!T || game.map.kind !== 'realm') { mini.style.cursor = ''; return; }
    const r = mini.getBoundingClientRect(), cx = (e.clientX - r.left) * (mini.width / r.width), cy = (e.clientY - r.top) * (mini.height / r.height), known = game.player.waypoints || [];
    const hit = game.map.objects.find((o) => o.interact === 'waypoint' && known.includes(o.name) && Math.hypot((o.x - T.x0) * T.k - cx, (o.y - T.y0) * T.k - cy) < 14);
    mini.style.cursor = hit ? 'pointer' : '';
    mini.title = hit ? `${hit.name}: click to teleport` : '';
  });
  document.getElementById('minimap').addEventListener('wheel', (e) => { e.preventDefault(); miniZoom(e.deltaY > 0 ? 1 : -1); }, { passive: false });

  // ---- input
  const I = game.input;
  const HELD = new Set(['up', 'down', 'left', 'right', 'rotL', 'rotR']);
  // one place that turns an action into what it does, for keys and mouse buttons alike
  const doAction = (act, code, e) => {
    if (act === 'settings') { e.preventDefault(); if (!document.getElementById('gearmenu').classList.contains('hidden')) document.getElementById('gearmenu').classList.add('hidden'); else if (ui.vaultOpen) ui.closeVault(true); else if (ui.modal) ui.closeModal(); else ui.toggleSettings(); return; }
    if (game.mode !== 'play' || ui.overlayOpen()) return;
    if (act === 'chat' || act === 'command') {
      e.preventDefault();
      I.up = I.down = I.left = I.right = I.rotL = I.rotR = 0; I.fire = false;
      ui.openChat(act === 'command' ? '/' : '');
      return;
    }
    if (HELD.has(act)) { I[act] = 1; e.preventDefault(); return; }
    switch (act) {
      case 'ability': game.useAbility(); e.preventDefault(); break;
      case 'potion1': game.drinkPot(0); ui.refreshSlots(); break;
      case 'potion2': game.drinkPot(1); ui.refreshSlots(); break;
      case 'portal': ui.enterNear(); break;
      case 'lootAll': game.lootAll(); ui.refreshSlots(); break;
      case 'nexus': game.toNexus(); break;
      case 'viewIn': viewZoom(1); break;
      case 'viewOut': viewZoom(-1); break;
      case 'autofire': I.auto = !I.auto; game.toast(`Autofire ${I.auto ? 'on' : 'off'}`); break;
      case 'lookAhead': settings.lookAhead = !settings.lookAhead; saveSettings(settings); game.toast(`Look ahead ${settings.lookAhead ? 'on' : 'off'}`); break;
      case 'resetCam': game.resetCam(); break;
      case 'snapCam': game.snapCam(); break;
      case 'miniIn': miniZoom(-1); break;
      case 'miniOut': miniZoom(1); break;
      default:
        if (/^Digit[1-8]$/.test(code)) { game.useSlot('inv', +code.slice(5) - 1); ui.refreshSlots(); }
    }
  };
  addEventListener('keydown', (e) => {
    if (ui.capturing || ui.chatOpen()) return;              // rebinding a key, or typing in chat
    doAction(actionFor(settings, e.code), e.code, e);
  });
  // mouse buttons bound to actions (middle, right, and the side buttons). The side buttons never send the page back.
  addEventListener('mousedown', (e) => {
    if (ui.capturing || ui.chatOpen() || e.button === 0) return;
    const act = actionFor(settings, 'Mouse' + e.button);
    if (e.button >= 3) e.preventDefault();
    if (act) { e.preventDefault(); doAction(act, 'Mouse' + e.button, e); }
  });
  addEventListener('mouseup', (e) => {
    if (e.button >= 3) e.preventDefault();
    const act = actionFor(settings, 'Mouse' + e.button);
    if (HELD.has(act)) I[act] = 0;
  });
  addEventListener('auxclick', (e) => { if (e.button >= 3) e.preventDefault(); });
  // ...an old code still works here
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let kbuf = [];
  addEventListener('keydown', (e) => {
    if (game.mode !== 'play' || ui.chatOpen()) return;
    kbuf = [...kbuf, e.code].slice(-KONAMI.length);
    if (kbuf.join() === KONAMI.join()) { kbuf = []; game.konami(); }
  });
  addEventListener('keyup', (e) => { const act = actionFor(settings, e.code); if (HELD.has(act)) I[act] = 0; });
  addEventListener('blur', () => { I.up = I.down = I.left = I.right = I.rotL = I.rotR = 0; I.fire = false; });
  // drag an item out of the side panel and drop it on the world -> it goes into a bag at your feet
  canvas.addEventListener('dragover', (e) => { if (game.mode === 'play') e.preventDefault(); });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const [c, k] = (e.dataTransfer.getData('text/plain') || '').split(':');
    if (c && game.dropOnGround(c, +k)) ui.refreshSlots();
  });
  let mouse = { x: 0, y: 0 };
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (game.mode === 'play') ui.hoverWorld(rnd.toWorld(mouse.x * (canvas.width / canvas.clientWidth), mouse.y * (canvas.height / canvas.clientHeight)), e);
  });
  canvas.addEventListener('mouseleave', () => ui.hoverWorld(null));
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) I.fire = true; });
  addEventListener('mouseup', (e) => { if (e.button === 0) I.fire = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // mouse wheel anywhere over the world zooms the MINIMAP (the play view keeps its scale)
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); miniZoom(e.deltaY > 0 ? 1 : -1); }, { passive: false });

  // ---- loop
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.mode === 'play' && !ui.settingsOpen && !ui.modal && !game.loading) {   // (and a portal's loading card)    // settings / shop / forge screens pause the game
      if (!I.scripted) {                                   // scripted = automated playtest drives aim
        const w = rnd.toWorld(mouse.x * (canvas.width / canvas.clientWidth), mouse.y * (canvas.height / canvas.clientHeight));
        I.aimX = w.x; I.aimY = w.y;
      }
      // E turns the view right, Q turns it left (flip with "invert rotation")
      const turn = ((I.rotL || 0) - (I.rotR || 0)) * (settings.invertRotation ? -1 : 1);
      if (turn) game.rotateCam(turn * settings.rotSpeed / 1.9, dt);
      game.update(dt);
      rnd.draw(game);
    }
    for (const [n, a] of game.sfxq.splice(0)) sfx.play(n, a);
    ui.tick(dt);
    requestAnimationFrame(frame);
  };
  addEventListener('pagehide', () => { if (game.mode === 'play' && !game.player.dead) game.persist(); });
  ui.start();
  requestAnimationFrame(frame);
}
boot();
