/**
 * waves.js - 僵尸波次管理（无限波数）
 */
(function() {
  const C = window.CONFIG;
  const createZombie = window.createZombie;
  const randInt = window.randInt;
  const pick = window.pick;

  class WaveManager {
    constructor(game) {
      this.game = game;
      this.currentWave = 0;
      this.waveActive = false;
      this.spawnQueue = [];
      this.spawnTimer = 0;
      this.waveDelay = 0;
      this.betweenWaves = true;
      this.allWavesDone = false;
    }

    start() {
      this.betweenWaves = true;
      this.waveDelay = C.WAVE_INITIAL_DELAY;
      this.game.ui.showBanner('种植植物，准备防御！', 3000);
    }

    startNextWave() {
      const w = this.currentWave;
      const count = Math.min(2 + Math.floor(w * 1.5), 80);
      const types = this._pickTypes(w, count);

      this.spawnQueue = [];

      if (w < 5) {
        const interval = Math.max(8 * Math.pow(0.92, w), 1.5);
        for (let i = 0; i < count; i++) {
          this.spawnQueue.push({ type: types[i], delay: i * interval });
        }
      } else {
        const sheetSize = Math.min(C.GRID_ROWS, Math.max(5, Math.ceil(count / 4)));
        const sheetInterval = Math.max(0.5 - w * 0.015, 0.12);
        const totalSheets = Math.ceil(count / sheetSize);
        let idx = 0;
        for (let s = 0; s < totalSheets; s++) {
          const sheetDelay = s * sheetInterval;
          const zombiesInSheet = Math.min(sheetSize, count - s * sheetSize);
          for (let i = 0; i < zombiesInSheet; i++, idx++) {
            if (idx >= types.length) {
              console.warn('idx out of bounds:', idx, 'types.length:', types.length, 'wave:', w);
              break;
            }
            this.spawnQueue.push({ type: types[idx], delay: sheetDelay + i * 0.015 });
          }
        }
      }

      this.spawnTimer = 0;
      this.waveActive = true;
      this.betweenWaves = false;

      const interval = w < 5 ? Math.max(8 * Math.pow(0.92, w), 1.5) : 0.1;
      const dps = (1 / interval).toFixed(1);
      this.game.ui.showBanner(`第 ${w + 1} 波  ·  ${count}只  ·  ${dps}/秒`, 2000);
    }

    _pickTypes(wave, count) {
      const result = [];
      for (let i = 0; i < count; i++) {
        if (wave < 2) {
          result.push('normal');
        } else if (wave < 5) {
          result.push(pick(['normal', 'normal', 'cone']));
        } else if (wave < 10) {
          result.push(pick(['normal', 'cone', 'cone', 'bucket']));
        } else if (wave < 15) {
          result.push(pick(['cone', 'cone', 'bucket', 'bucket', 'normal', 'blackshell']));
        } else {
          result.push(pick(['cone', 'cone', 'bucket', 'bucket', 'normal', 'blackshell', 'blackshell']));
        }
      }
      return result;
    }

    update(dt) {
      if (this.allWavesDone) return;

      if (this.betweenWaves) {
        this.waveDelay -= dt;
        if (this.waveDelay <= 0) {
          this.startNextWave();
        }
        return;
      }

      if (this.waveActive) {
        this.spawnTimer += dt;
        while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
          const item = this.spawnQueue.shift();
          const row = randInt(0, C.GRID_ROWS - 1);
          const z = createZombie(item.type, row, C.ZOMBIE_SPAWN_X);
          if (!z) continue;
          const pos = this.game.grid.gridToPixel(row, 0);
          z.y = pos.y - z.h / 2;
          this.game.zombies.push(z);
        }
        if (this.spawnQueue.length === 0 && this.game.zombies.length === 0) {
          this.currentWave++;
          this.waveActive = false;
          this.betweenWaves = true;
          this.waveDelay = Math.max(12 - this.currentWave * 0.5, 4);
          this.game.ui.showBanner(`准备第 ${this.currentWave + 1} 波`, 3000);
        }
      }
    }

    get progress() {
      return this.currentWave;
    }
  }

  window.WaveManager = WaveManager;
})();
