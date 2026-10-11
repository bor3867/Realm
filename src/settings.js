// Player settings + key bindings, persisted per browser.
const KEY = 'realm.settings.v1';

export const ACTIONS = [
  ['up', 'Move up'], ['down', 'Move down'], ['left', 'Move left'], ['right', 'Move right'],
  ['ability', 'Use ability'], ['potion1', 'Drink from potion slot 1'], ['potion2', 'Drink from potion slot 2'], ['lootAll', 'Take everything from a bag'], ['autofire', 'Toggle autofire'], ['portal', 'Enter portal'], ['nexus', 'Escape to Nexus'],
  ['rotL', 'Rotate camera left'], ['rotR', 'Rotate camera right'], ['resetCam', 'Reset camera upright'],
  ['snapCam', 'Snap camera to nearest 90°'], ['lookAhead', 'Look ahead (you near the bottom of the screen)'], ['viewIn', 'Zoom view in'], ['viewOut', 'Zoom view out'], ['miniIn', 'Minimap zoom in'], ['miniOut', 'Minimap zoom out'],
  ['chat', 'Open chat'], ['command', 'Type a command (/)'], ['settings', 'Open settings'],
];

export const DEFAULTS = {
  binds: {
    up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
    ability: ['Space'], potion1: ['KeyC'], potion2: ['KeyV'], lootAll: ['KeyG'], autofire: ['KeyT'], portal: ['KeyF'], nexus: ['KeyR'], chat: ['Enter'], command: ['Slash'],
    rotL: ['KeyQ'], rotR: ['KeyE'], resetCam: ['KeyZ'], snapCam: ['KeyX'], lookAhead: ['KeyH'], viewIn: ['BracketRight'], viewOut: ['BracketLeft'],
    miniIn: ['Equal', 'NumpadAdd'], miniOut: ['Minus', 'NumpadSubtract'], settings: ['Escape'],
  },
  rotSpeed: 1.9,          // radians / second
  invertRotation: false,
  zoom: 'auto',           // 'auto' or 2..5 (pixel scale)
  miniView: 80,           // tiles shown across the minimap
  viewZoom: 1,            // a gentle zoom on the player, on top of the pixel zoom (0.75 – 1.5)
  shake: true,
  weather: true,
  vignette: false,        // RotMG has no vignette: off by default, the edges stay clean
  groundLight: true,     // soft pools of light and shadow over the terrain
  damageNumbers: true,
  lookAhead: false,       // the camera sits ahead of you: you near the bottom of the screen, more of what is in front
  volume: 0.5,
  muted: false,
};
export const MINI_STEPS = [40, 80, 160, 320, 640, 9999];   // the last step always shows the whole map, however big it grows
export const VIEW_ZOOM = { min: 0.75, max: 1.5, step: 0.05 };

function clone(o) { return JSON.parse(JSON.stringify(o)); }
// the settings in use, so hints anywhere show the player's own keys (and nothing when an action has no key)
let CUR = null;
export function useSettings(s) { CUR = s; }
export function keyName(act) { const c = CUR && CUR.binds[act] && CUR.binds[act].find(Boolean); return c ? keyLabel(c) : ''; }
export const keyHint = (act) => { const k = keyName(act); return k ? `[${k}] ` : ''; };     // "[F] " or ""
export const keyParen = (act) => { const k = keyName(act); return k ? ` (${k})` : ''; };  // " (F)" or ""

export function loadSettings() {
  let s = clone(DEFAULTS);
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && typeof raw === 'object') s = { ...s, ...raw, binds: { ...s.binds, ...(raw.binds || {}) } };
  } catch { /* fall back to defaults */ }
  // older saves bound Enter to portals; Enter now opens chat
  if (s.binds.portal.includes('Enter') && s.binds.chat.includes('Enter')) s.binds.portal = s.binds.portal.map((c) => (c === 'Enter' ? null : c));
  CUR = s;
  return s;
}
export function saveSettings(s) {
  CUR = s;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}
export function resetSettings() { return clone(DEFAULTS); }

// KeyboardEvent.code -> action (first binding wins)
export function actionFor(s, code) {
  for (const [a, codes] of Object.entries(s.binds)) if (codes.includes(code)) return a;
  return null;
}
export function keyLabel(code) {
  if (!code) return '—';
  const named = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Equal: '+', Minus: '−',
    BracketLeft: '[', BracketRight: ']', NumpadAdd: 'Num +', NumpadSubtract: 'Num −', Escape: 'Esc', Space: 'Space', Enter: 'Enter',
    ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', Tab: 'Tab',
    Mouse1: 'Middle mouse', Mouse2: 'Right mouse', Mouse3: 'Mouse 4', Mouse4: 'Mouse 5' };
  return named[code] || code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ');
}
