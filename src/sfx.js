// Procedural sound effects (WebAudio). No audio files: every sound is a few
// oscillators / noise bursts shaped by envelopes, so it stays tiny and retro.
export class Sfx {
  constructor() { this.ctx = null; this.vol = 0.5; this.muted = false; this.last = {}; }
  unlock() {                                   // browsers need a user gesture before audio
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.setVolume(this.vol, this.muted);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch { this.ctx = null; }
  }
  setVolume(v, muted) {
    this.vol = v; this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : v * 0.6;
  }
  tone(type, f0, f1, dur, gain = 0.3, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, gain = 0.25, freq = 1200, q = 1, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + 0.02);
  }
  play(name, arg) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    const gap = { shoot: 40, hit: 30, ehit: 25, step: 120, zap: 60 }[name] || 0;      // don't machine-gun the mixer
    if (gap && now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    switch (name) {
      case 'shoot': {
        const f = { brawler: 180, forge_knight: 130, priest: 620 }[arg] || 300;
        if (arg === 'priest') { this.tone('triangle', f, f * 1.6, 0.09, 0.12); }
        else if (arg === 'summoner') { this.tone('sine', 520, 780, 0.14, 0.1); this.tone('triangle', 1040, 690, 0.12, 0.05, 0.03); }
        else if (arg === 'harpooner') { this.tone('square', 95, 55, 0.12, 0.12); this.noise(0.14, 0.14, 700, 0.8); }
        else if (arg === 'duelist') { this.noise(0.05, 0.1, 5200, 2); this.tone('triangle', 1400, 2400, 0.05, 0.06); }
        else if (arg === 'stormwright') { this.noise(0.08, 0.12, 2600, 0.6); this.tone('sawtooth', 880, 220, 0.07, 0.05); }
        else if (arg === 'clockmaker') { this.tone('square', 1800, 0, 0.02, 0.07); this.tone('sine', 140, 90, 0.16, 0.12, 0.02); }
        else { this.tone('square', f, f * 0.5, 0.07, 0.08); this.noise(0.05, 0.08, 900); }
        break;
      }
      case 'hit': this.tone('square', 900, 500, 0.04, 0.05); break;
      case 'ehit': this.noise(0.04, 0.06, 2400, 3); break;
      case 'kill': this.noise(0.18, 0.18, 500); this.tone('sawtooth', 220, 60, 0.18, 0.08); break;
      case 'bigkill': this.noise(0.6, 0.3, 300); this.tone('sawtooth', 110, 30, 0.8, 0.2); this.tone('square', 220, 55, 0.6, 0.1, 0.1); break;
      case 'hurt': this.tone('square', 140, 70, 0.12, 0.14); this.noise(0.08, 0.12, 400); break;
      case 'ability': this.noise(0.3, 0.12, 1800, 0.7); this.tone('triangle', 330, 990, 0.25, 0.12); break;
      case 'loot': [880, 1320].forEach((f, k) => this.tone('triangle', f, 0, 0.12, 0.1, k * 0.06)); break;
      case 'rare': [523, 659, 784, 1047, 1319].forEach((f, k) => this.tone('triangle', f, 0, 0.35, 0.12, k * 0.07)); break;
      case 'level': [392, 523, 659, 784].forEach((f, k) => this.tone('square', f, 0, 0.18, 0.08, k * 0.08)); break;
      case 'portal': this.tone('sine', 200, 900, 0.4, 0.15); this.noise(0.4, 0.06, 3000, 0.5); break;
      case 'boss': this.tone('sawtooth', 73, 55, 1.2, 0.18); this.tone('sawtooth', 110, 82, 1.2, 0.12, 0.05); break;
      case 'coin': this.tone('square', 1320, 0, 0.06, 0.06); this.tone('square', 1760, 0, 0.1, 0.06, 0.05); break;
      case 'forge': this.noise(0.08, 0.25, 3500, 4); this.tone('square', 620, 0, 0.25, 0.1); this.tone('square', 930, 0, 0.3, 0.06, 0.02); break;
      case 'click': this.tone('square', 660, 0, 0.03, 0.05); break;
      case 'zap': this.noise(0.07, 0.12, 3200, 0.5); this.tone('sawtooth', 1200, 300, 0.06, 0.05); break;
      case 'glass': [2600, 3300, 2100].forEach((f, k) => this.tone('triangle', f, f * 0.7, 0.18, 0.05, k * 0.03)); this.noise(0.2, 0.08, 6000, 2); break;
      case 'drink': this.tone('sine', 300, 700, 0.15, 0.12); this.tone('sine', 500, 900, 0.12, 0.08, 0.08); break;
      case 'death': this.tone('sawtooth', 220, 40, 1.4, 0.2); this.noise(1.0, 0.15, 250); break;
      default: break;
    }
  }
}
