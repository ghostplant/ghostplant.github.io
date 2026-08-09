/**
 * audio.js - 音频管理（使用Web Audio API生成简单音效，无需外部资源）
 */
(function() {
  class AudioManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this._init();
    }

    _init() {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        this.enabled = false;
      }
    }

    beep(freq, duration, type = 'sine', volume = 0.15) {
      if (!this.enabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playPlant() {
      this.beep(440, 0.15, 'sine', 0.1);
      setTimeout(() => this.beep(660, 0.1, 'sine', 0.08), 80);
    }

    playShoot() {
      this.beep(800, 0.05, 'square', 0.05);
    }

    playBite() {
      this.beep(150, 0.1, 'sawtooth', 0.08);
    }

    playSun() {
      this.beep(880, 0.08, 'sine', 0.1);
      setTimeout(() => this.beep(1320, 0.12, 'sine', 0.08), 60);
    }

    playExplode() {
      if (!this.enabled || !this.ctx) return;
      const noise = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.2;
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    }

    playGameOver() {
      this.beep(200, 0.3, 'sawtooth', 0.15);
      setTimeout(() => this.beep(150, 0.5, 'sawtooth', 0.15), 200);
    }

    playWin() {
      this.beep(523, 0.15, 'sine', 0.12);
      setTimeout(() => this.beep(659, 0.15, 'sine', 0.12), 150);
      setTimeout(() => this.beep(880, 0.3, 'sine', 0.12), 300);
    }
  }

  window.AudioManager = AudioManager;
})();
