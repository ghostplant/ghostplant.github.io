/**
 * game.js - 游戏核心逻辑
 */

(function() {
  const C = window.CONFIG;
  const PD = window.PLANT_DEFS;
  const ZD = window.ZOMBIE_DEFS;
  const createPea = window.createPea;
  const createSun = window.createSun;
  const createSunFromPlant = window.createSunFromPlant;
  const updateSun = window.updateSun;
  const Grid = window.Grid;
  const WaveManager = window.WaveManager;
  const InputManager = window.InputManager;
  const UIManager = window.UIManager;
  const AudioManager = window.AudioManager;
  const Renderer = window.Renderer;
  const rand = window.rand;
  const randInt = window.randInt;

  class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = C.CANVAS_W;
    this.canvas.height = C.CANVAS_H;

    // 状态
    this.state = 'menu'; // menu, playing, paused, gameover, win
    this.sun = C.SUN_INITIAL;

    // 模块
    this.grid = new Grid();
    this.ui = new UIManager(this);
    this.input = new InputManager(this);
    this.audio = new AudioManager();
    this.renderer = new Renderer(this);
    this.waves = new WaveManager(this);

    // 实体
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.effects = [];

    // 天降阳光计时
    this._sunDropTimer = 5000;

    // 引用
    this.plantDefs = PD;

    // 帧时间
    this._lastTime = 0;
    this._running = false;
    this._restartListenerAdded = false;
  }

  start() {
    this.state = 'playing';
    this.waves.start();
    this.ui.showBanner('准备开始！', 2000);
    if (!this._running) {
      this._running = true;
      this._lastTime = performance.now();
      requestAnimationFrame(this._loop);
    }
  }

  _loop = (now = performance.now()) => {
    if (!this._running) return;
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    if (this.state === 'playing') {
      this.update(dt);
    }
    this.renderer.draw(dt);

    // 游戏结束/胜利后，注册一次重启监听
    if ((this.state === 'gameover' || this.state === 'win') && !this._restartListenerAdded) {
      this._restartListenerAdded = true;
      this.canvas.addEventListener('click', this._restartHandler, { once: true });
    }

    requestAnimationFrame(this._loop);
  };

  _restartHandler = () => {
    this.reset();
    this.start();
    this._restartListenerAdded = false;
  };

  reset() {
    this.sun = C.SUN_INITIAL;
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.effects = [];
    this.grid = new Grid();
    this.waves = new WaveManager(this);
    this.ui = new UIManager(this);
    this._sunDropTimer = 5000;
    this._restartListenerAdded = false;
    this.state = 'playing';
  }

  update(dt) {
    // 天降阳光
    this._sunDropTimer -= dt * 1000;
    if (this._sunDropTimer <= 0) {
      this._sunDropTimer = C.SUN_DROP_INTERVAL;
      const x = rand(C.GRID_X + 50, C.GRID_X + C.GRID_COLS * C.CELL_W - 50);
      const targetY = rand(C.GRID_Y + 50, C.GRID_Y + C.GRID_ROWS * C.CELL_H - 50);
      this.suns.push(createSun(x, targetY));
    }

    // 阳光更新 + 自动收集
    for (const sun of this.suns) {
      updateSun(sun, dt, this);
      // 自动收集倒计时结束
      if (!sun.collected && sun.autoCollectTimer <= 0) {
        sun.collected = true;
        this.sun += sun.value;
        this.ui.showFloatingText(`+${sun.value}`, sun.x + C.SUN_RADIUS, sun.y, '#FFD700');
        this.audio.playSun();
      }
    }
    this.suns = this.suns.filter((s) => !s.collected);

    // 植物更新
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const plant = this.grid.getPlant(r, c);
        if (plant) {
          const def = PD[plant.type];
          def.update(plant, dt, this);
        }
      }
    }
    this.grid.cleanup(this);

    // 子弹更新
    for (const pea of this.projectiles) {
      pea.x += pea.vx;
      if (pea.x > C.CANVAS_W) pea.dead = true;
      // 碰撞
      for (const z of this.zombies) {
        if (z.dead || z.row !== pea.row) continue;
        if (
          pea.x + pea.w > z.x &&
          pea.x < z.x + z.w &&
          pea.y + pea.h > z.y &&
          pea.y < z.y + z.h
        ) {
          z.hp -= pea.damage;
          if (pea.frozen) z.frozen = 3;
          pea.dead = true;
          this.spawnHitEffect(pea.x + pea.w / 2, pea.y + pea.h / 2, pea.frozen);
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    // 僵尸更新
    for (const z of this.zombies) {
      if (z.dead) continue;
      z.walkPhase += dt * 4;

      // 检查是否在吃植物
      const col = Math.floor((z.x + z.w / 2 - this.grid.offsetX) / this.grid.cellW);
      let eating = false;
      if (col >= 0 && col < this.grid.cols) {
        const plant = this.grid.getPlant(z.row, col);
        // 樱桃炸弹无敌：僵尸会停下啃但不造成伤害
        if (plant && z.x + z.w / 2 < this.grid.offsetX + (col + 1) * this.grid.cellW) {
          eating = true;
          z.eatTimer += dt;
          if (z.eatTimer >= 0.5) {
            z.eatTimer = 0;
            // 樱桃炸弹无敌，不扣血
            if (plant.type !== 'cherrybomb') {
              plant.hp -= C.ZOMBIE_EAT_DAMAGE * 0.5;
              this.audio.playBite();
            }
          }
        }
      }
      z.eating = eating;

      if (!eating) {
        const speed = z.frozen > 0 ? z.speed * 0.5 : z.speed;
        z.x -= speed;
        if (z.frozen > 0) z.frozen -= dt;
      }

      // 到达房屋
      if (z.x + z.w / 2 < C.ZOMBIE_WIN_X) {
        this.state = 'gameover';
        this.audio.playGameOver();
      }

      // 死亡
      if (z.hp <= 0) {
        z.dead = true;
        this.spawnPoofEffect(z.x + z.w / 2, z.y + z.h / 2);
      }
    }
    this.zombies = this.zombies.filter((z) => !z.dead);

    // 波次
    this.waves.update(dt);

    // 特效更新
    for (const e of this.effects) {
      e.life -= dt;
    }
    this.effects = this.effects.filter((e) => e.life > 0);

    // UI
    this.ui.update(dt);

    // 胜利
    if (this.waves.allWavesDone && this.zombies.length === 0) {
      this.state = 'win';
      this.audio.playWin();
    }
  }

  // ===== 实体生成接口 =====

  spawnPea(x, y, frozen) {
    const row = Math.floor((y - this.grid.offsetY) / this.grid.cellH);
    this.projectiles.push(createPea(x, y, row, frozen));
    this.audio.playShoot();
  }

  spawnSunFromPlant(plant) {
    this.suns.push(createSunFromPlant(plant));
  }

  spawnHitEffect(x, y, frozen) {
    this.effects.push({ type: 'hit', x, y, frozen, life: 0.3, maxLife: 0.3 });
  }

  spawnPoofEffect(x, y) {
    this.effects.push({ type: 'plantPoof', x, y, life: 0.4, maxLife: 0.4 });
  }

  cherryExplode(row, col) {
    const center = this.grid.gridToPixel(row, col);
    this.effects.push({ type: 'explosion', x: center.x, y: center.y, life: 0.6, maxLife: 0.6 });
    this.audio.playExplode();
    // 3x3 范围伤害
    for (const z of this.zombies) {
      const zr = z.row;
      const zc = Math.floor((z.x + z.w / 2 - this.grid.offsetX) / this.grid.cellW);
      if (Math.abs(zr - row) <= 1 && Math.abs(zc - col) <= 1) {
        z.hp -= 300;
      }
    }
  }

  potatoExplode(row, col) {
    const center = this.grid.gridToPixel(row, col);
    this.effects.push({ type: 'explosion', x: center.x, y: center.y, life: 0.5, maxLife: 0.5 });
    this.audio.playExplode();
    // 同行范围伤害
    for (const z of this.zombies) {
      if (z.dead) continue;
      if (z.row !== row) continue;
      // 爆炸范围：土豆雷所在格子及前后半格
      const cellLeft = this.grid.gridToTopLeft(row, col).x;
      if (z.x + z.w > cellLeft - this.grid.cellW * 0.5 && z.x < cellLeft + this.grid.cellW * 1.5) {
        z.hp -= 500;
      }
    }
  }

  gloomShroomAttack(plant) {
    const center = this.grid.gridToPixel(plant.row, plant.col);
    // 穿透孢子特效
    this.effects.push({ type: 'spore', x: center.x, y: center.y, life: 0.4, maxLife: 0.4 });
    this.audio.playShoot();
    // 3x3范围穿透伤害
    for (const z of this.zombies) {
      if (z.dead) continue;
      const dr = Math.abs(z.row - plant.row);
      const zc = Math.floor((z.x + z.w / 2 - this.grid.offsetX) / this.grid.cellW);
      const dc = Math.abs(zc - plant.col);
      if (dr <= 1 && dc <= 1) {
        z.hp -= 20;
      }
    }
  }

  plantSeed(type, row, col) {
    const def = PD[type];
    if (this.sun < def.cost) return;
    this.sun -= def.cost;
    const pos = this.grid.gridToPixel(row, col);
    const plant = {
      type,
      row,
      col,
      x: pos.x,
      y: pos.y,
      hp: def.hp,
      maxHp: def.hp,
    };
    this.grid.setPlant(row, col, plant);
    this.ui.triggerCooldown(type);
    this.audio.playPlant();
    this.spawnPoofEffect(pos.x, pos.y);
  }

  hasZombieInRow(row, fromX) {
    for (const z of this.zombies) {
      if (z.row === row && !z.dead && z.x + z.w / 2 > fromX) return true;
    }
    return false;
  }

  hasZombieNear(plant) {
    for (const z of this.zombies) {
      if (z.dead) continue;
      const dr = Math.abs(z.row - plant.row);
      const zc = Math.floor((z.x + z.w / 2 - this.grid.offsetX) / this.grid.cellW);
      const dc = Math.abs(zc - plant.col);
      if (dr <= 1 && dc <= 1) return true;
    }
    return false;
  }
}

  window.Game = Game;
})();
