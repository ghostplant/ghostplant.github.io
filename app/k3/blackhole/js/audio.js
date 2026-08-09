// Ambient music: plays audio/ambience.wav (seamless loop) with a
// procedural WebAudio synth as fallback. No build step required.
export class Ambience {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.playing = false;
    this._nodes = [];
    this._useFile = true;
  }
  _ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0;
      this.master.connect(this.ctx.destination);
    }
  }
  async _startFile() {
    const ctx = this.ctx;
    const res = await fetch('audio/ambience.wav');
    if (!res.ok) throw new Error('no audio file');
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.master);
    src.start();
    this._nodes.push(src);
  }
  _startSynth() {
    const ctx = this.ctx;
    const master = this.master;
    const freqs = [55, 55 * 1.5, 55 * 2.0, 55 * 2.997, 110.5];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 2) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.12 / (i + 1);
      o.connect(g); g.connect(master); o.start();
      this._nodes.push(o, g);
    });
    const len = 2 * ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.0;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 320; filt.Q.value = 0.6;
    const ng = ctx.createGain(); ng.gain.value = 0.10;
    noise.connect(filt); filt.connect(ng); ng.connect(master); noise.start();
    this._nodes.push(noise, filt, ng);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 140;
    lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();
    this._nodes.push(lfo, lfoG);
  }
  async start() {
    if (this.playing) return;
    this._ensureCtx();
    await this.ctx.resume();
    if (this._useFile) {
      try { await this._startFile(); }
      catch (e) { this._useFile = false; this._startSynth(); }
    } else {
      this._startSynth();
    }
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 2.0);
    this.playing = true;
  }
  stop() {
    if (!this.playing || !this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 1.0);
    this.playing = false;
  }
  toggle() { this.playing ? this.stop() : this.start(); return this.playing; }
}