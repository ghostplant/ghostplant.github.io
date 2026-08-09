// controls.js — keyboard and shortcut handling

import { DEBUG_VIEWS, VIEW_PRESETS } from './config.js';

export class Controls {
    constructor(app) {
        this.app = app;
        this._init();
    }

    _init() {
        window.addEventListener('keydown', (e) => this._onKey(e));
    }

    _onKey(e) {
        // don't intercept when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key.toLowerCase();

        // debug views 0-9
        if (key >= '0' && key <= '9') {
            this.app.setDebugView(parseInt(key));
            return;
        }

        switch (key) {
            case 'h':
                this.app.hud.toggle();
                break;
            case 'p':
                this.app.hud.togglePanel();
                break;
            case 'c':
                this.app.toggleCinematic();
                break;
            case 'v':
                this.app.cycleViewPreset();
                break;
            case 'q':
                this.app.setQuality('standard');
                break;
            case 'w':
                this.app.setQuality('high');
                break;
            case 'e':
                this.app.setQuality('cinematic');
                break;
            case 'm':
                this.app.toggleAudio();
                break;
            case ' ':
                e.preventDefault();
                this.app.togglePause();
                break;
            case 'r':
                this.app.resetParams();
                this.app.hud._syncSliders();
                break;
            case 's':
                this.app.screenshot();
                break;
            // view presets shortcuts
            case '1':
                if (e.shiftKey) this.app.setViewPreset(0);
                break;
            case '2':
                if (e.shiftKey) this.app.setViewPreset(1);
                break;
            case '3':
                if (e.shiftKey) this.app.setViewPreset(2);
                break;
            case '4':
                if (e.shiftKey) this.app.setViewPreset(3);
                break;
        }
    }
}
