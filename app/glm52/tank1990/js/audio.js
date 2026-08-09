// ============================================================
// Tank 1990 - Sound Effects (Web Audio API, no external files)
// ============================================================

const SFX = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  beep(freq, dur, wave, vol) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  sweep(f1, f2, dur, wave, vol) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f1, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  noise(dur, vol) {
    if (!this.enabled || !this.ctx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start();
  },

  melody(notes, dur, wave) {
    notes.forEach((f, i) => {
      setTimeout(() => this.beep(f, dur, wave || 'square', 0.15), i * dur * 1000);
    });
  },

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    switch (type) {
      case 'shoot':    this.beep(180, 0.06, 'square', 0.06); break;
      case 'eshoot':   this.beep(140, 0.06, 'square', 0.04); break;
      case 'explode':  this.noise(0.25, 0.25); this.sweep(200, 50, 0.25, 'sawtooth', 0.15); break;
      case 'hit':      this.beep(120, 0.08, 'square', 0.1); break;
      case 'brick':    this.noise(0.08, 0.12); break;
      case 'steel':    this.beep(800, 0.04, 'square', 0.08); break;
      case 'powerup':  this.sweep(400, 800, 0.2, 'sine', 0.15); break;
      case 'move':     this.beep(60, 0.02, 'square', 0.02); break;
      case 'gameover': this.melody([220, 196, 175, 147], 0.25, 'square'); break;
      case 'levelup':  this.melody([262, 330, 392, 523], 0.12, 'square'); break;
      case 'spawn':    this.sweep(100, 300, 0.12, 'square', 0.08); break;
      case 'start':    this.melody([262, 330, 392, 523, 659], 0.1, 'square'); break;
      case 'pause':    this.beep(300, 0.08, 'square', 0.08); break;
      case 'shield':   this.beep(600, 0.05, 'sine', 0.06); break;
    }
  }
};
