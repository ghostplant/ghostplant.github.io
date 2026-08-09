// audio.js — procedural ambient drone via Web Audio API

export class AmbientAudio {
    constructor() {
        this.ctx = null;
        this.playing = false;
        this.nodes = [];
    }

    _ensureContext() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            this.ctx = new AC();
        }
        return true;
    }

    toggle() {
        if (this.playing) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this._ensureContext()) return;
        if (this.playing) return;
        const ctx = this.ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(0.15, now + 3);
        master.connect(ctx.destination);

        // deep drone — two sine oscill
        const freqs = [55, 55.5, 82.5, 110, 165];
        const gains = [0.4, 0.25, 0.2, 0.15, 0.08];
        for (let i = 0; i < freqs.length; i++) {
            const osc = ctx.createOscillator();
            osc.type = i < 2 ? 'sine' : 'triangle';
            osc.frequency.value = freqs[i];

            const g = ctx.createGain();
            g.gain.value = gains[i];

            // slow LFO on gain
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 0.05 + i * 0.03;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = gains[i] * 0.3;
            lfo.connect(lfoGain);
            lfoGain.connect(g.gain);

            osc.connect(g);
            g.connect(master);
            osc.start(now);
            lfo.start(now);

            this.nodes.push(osc, lfo);
        }

        // low-pass filter for warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        master.disconnect();
        master.connect(filter);
        filter.connect(ctx.destination);

        // subtle noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.02;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 200;
        noiseFilter.Q.value = 2;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(now);

        this.nodes.push(noise);
        this.master = master;
        this.playing = true;
    }

    stop() {
        if (!this.playing) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(0, now + 1);
        setTimeout(() => {
            for (const n of this.nodes) {
                try { n.stop(); } catch (e) {}
            }
            this.nodes = [];
        }, 1100);
        this.playing = false;
    }
}
