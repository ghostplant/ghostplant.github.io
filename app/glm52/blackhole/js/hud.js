// hud.js — heads-up display and parameter panel

import { PARAM_META, DEBUG_VIEWS, VIEW_PRESETS, QUALITY_PRESETS } from './config.js';

export class HUD {
    constructor(app) {
        this.app = app;
        this.visible = true;
        this.panelVisible = false;
        this._build();
    }

    _build() {
        // root container
        this.root = document.getElementById('hud');
        this.root.innerHTML = '';

        // top-left info
        this.info = document.createElement('div');
        this.info.className = 'hud-info';
        this.root.appendChild(this.info);

        // top-right status
        this.status = document.createElement('div');
        this.status.className = 'hud-status';
        this.root.appendChild(this.status);

        // bottom hints
        this.bottom = document.createElement('div');
        this.bottom.className = 'hud-bottom';
        this.root.appendChild(this.bottom);

        // parameter panel
        this.panel = document.createElement('div');
        this.panel.className = 'hud-panel';
        this.panel.style.display = 'none';
        this.root.appendChild(this.panel);

        this._buildPanel();
        this._buildBottom();
    }

    _buildPanel() {
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.textContent = 'Parameters';
        this.panel.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'panel-grid';

        this.sliders = {};
        for (const meta of PARAM_META) {
            const row = document.createElement('div');
            row.className = 'slider-row';

            const label = document.createElement('label');
            label.textContent = meta.label;
            label.title = 'slider-label';

            const value = document.createElement('span');
            value.className = 'slider-value';
            value.textContent = meta.fmt(this.app.params[meta.key]);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = meta.min;
            slider.max = meta.max;
            slider.step = meta.step;
            slider.value = this.app.params[meta.key];
            slider.className = 'slider-input';

            slider.addEventListener('input', () => {
                const v = meta.int ? parseInt(slider.value) : parseFloat(slider.value);
                this.app.setParam(meta.key, v);
                value.textContent = meta.fmt(v);
            });

            row.appendChild(label);
            row.appendChild(slider);
            row.appendChild(value);
            grid.appendChild(row);

            this.sliders[meta.key] = { slider, value, meta };
        }

        this.panel.appendChild(grid);

        // reset button
        const reset = document.createElement('button');
        reset.textContent = 'Reset Parameters';
        reset.className = 'panel-btn';
        reset.addEventListener('click', () => {
            this.app.resetParams();
            this._syncSliders();
        });
        this.panel.appendChild(reset);
    }

    _buildBottom() {
        const items = [
            '[H] HUD',
            '[P] Panel',
            '[C] Cinematic',
            '[V] View',
            '[Q/W/E] Quality',
            '[0-9] Debug',
            '[M] Music',
            '[Space] Pause',
            '[R] Reset',
            '[S] Screenshot',
        ];
        for (const item of items) {
            const span = document.createElement('span');
            span.textContent = item;
            span.className = 'hud-hint';
            this.bottom.appendChild(span);
        }
    }

    _syncSliders() {
        for (const key in this.sliders) {
            const { slider, value, meta } = this.sliders[key];
            slider.value = this.app.params[key];
            value.textContent = meta.fmt(this.app.params[key]);
        }
    }

    toggle() {
        this.visible = !this.visible;
        this.root.style.display = this.visible ? 'block' : 'none';
    }

    togglePanel() {
        this.panelVisible = !this.panelVisible;
        this.panel.style.display = this.panelVisible ? 'block' : 'none';
        if (this.panelVisible) this._syncSliders();
    }

    update() {
        if (!this.visible) return;

        const cam = this.app.getCameraInfo();
        const q = this.app.quality;
        const vp = VIEW_PRESETS[this.app.viewPreset]?.name || '—';
        const dv = this.app.debugView > 0 ? `[${this.app.debugView}] ${DEBUG_VIEWS[this.app.debugView]}` : '';
        this.info.innerHTML =
            `<div class="hud-title">GARGANTUA</div>` +
            `<div class="hud-sub">Schwarzschild Raytracer</div>` +
            `<div class="hud-stat">FPS: <b>${this.app.fps}</b></div>` +
            `<div class="hud-stat">Cam: ${cam.x}, ${cam.y}, ${cam.z} (${cam.dist})</div>` +
            `<div class="hud-stat">Quality: <b>${q}</b></div>`;

        this.status.innerHTML =
            `<div class="hud-stat">View: <b>${vp}</b></div>` +
            `<div class="hud-stat">C: <b>${this.app.params.steps}</b></div>` +
            (dv ? `<div class="hud-stat debug">${dv}</div>` : '') +
            (this.app.cinematic ? `<div class="hud-stat accent">CINEMATIC</div>` : '') +
            (this.app.paused ? `<div class="hud-stat paused">PAUSED</div>` : '') +
            (this.app.audio?.playing ? `<div class="hud-stat audio">♪ MUSIC</div>` : '');
    }
}
