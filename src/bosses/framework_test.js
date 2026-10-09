// A stand-in used only to exercise the boss framework (admin: /bx framework_test). It borrows the Gilded
// Sphinx's art and shots with deliberately plain patterns; the real Sphinx is designed in docs/design/boss_gilded_sphinx.md.
export default {
  id: 'framework_test', art: 'gilded_sphinx', name: 'Framework Test (Sphinx art)', hp: 30000, def: 10, xp: 100, r: 2, speed: 1.2, keep: 7, faces: true,
  phases: {
    1: { move: 'pace', patterns: [
      { name: 'fan', windup: 0.6, recover: 0.5, volleys: [{ form: 'fan', shot: 'sand_crescent', count: 5, spread: 1.0, speed: 5, dmg: 40 }] },
      { name: 'ring', windup: 0.7, recover: 0.6, volleys: [{ form: 'ring', shot: 'riddle_glyph', count: 14, rot: 0.2, gaps: 2, speed: 4, dmg: 40 }] },
    ] },
    2: { move: 'orbit', patterns: [
      { name: 'spiral', windup: 0.6, recover: 0.4, volleys: [{ form: 'spiral', shot: 'sun_disk', arms: 3, every: 0.14, dur: 1.6, turn: 0.25, speed: 4, dmg: 45 }] },
      { name: 'wall', windup: 0.6, recover: 0.5, volleys: [{ form: 'wall', shot: 'gilded_feather', count: 11, space: 0.8, gaps: 2, speed: 5, dmg: 45 }] },
    ] },
    3: { move: 'center', patterns: [
      { name: 'curtain', windup: 0.7, recover: 0.4, volleys: [{ form: 'curtain', shot: 'dust_devil', count: 16, gaps: 3, speed: 4, dmg: 50 }] },
      { name: 'stream', windup: 0.5, recover: 0.4, volleys: [{ form: 'stream', shot: 'cursed_scarab', n: 8, every: 0.09, wobble: 0.3, speed: 7, dmg: 45 }] },
    ] },
  },
  specials: {},
  loot: [{ id: 'pot_hp', p: 1 }],
};
