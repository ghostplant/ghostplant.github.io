// ============================================================
// Tank 1990 - Game Controller
// ============================================================

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.state = STATE.MENU;
    this.stage = 1;
    this.score = 0;
    this.lives = PLAYER_LIVES;
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.explosions = [];
    this.map = new GameMap();
    this.base = { x: BASE_PX, y: BASE_PY, destroyed: false };

    this.enemyQueue = [];
    this.enemySpawnTimer = 0;
    this.maxOnScreen = MAX_ENEMIES_ONSCREEN;
    this.freezeTimer = 0;
    this.shovelTimer = 0;
    this.respawnTimer = 0;
    this.stageIntroTimer = 0;
    this.stageClearTimer = 0;
    this.gameOverTimer = 0;
    this.menuTimer = 0;

    this.frame = 0;
    this.frameTimer = 0;
    this.lastTime = 0;
    this.accumulator = 0;

    this.totalStages = LEVELS.length;
    this._lastEnemyCount = -1;
    this._lastHud = {};
  }

  start() {
    Input.init();
    SFX.init();
    this.showMenu();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.accumulator += dt;
    while (this.accumulator >= DT) {
      this.update(DT);
      this.accumulator -= DT;
    }
    this.frameTimer += dt;
    if (this.frameTimer >= 0.3) {
      this.frameTimer = 0;
      this.frame = 1 - this.frame;
    }
    this.render();
    Input.clearPressed();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ===== State Updates =====

  update(dt) {
    switch (this.state) {
      case STATE.MENU: this.updateMenu(dt); break;
      case STATE.STAGE_INTRO: this.updateStageIntro(dt); break;
      case STATE.PLAYING: this.updatePlaying(dt); break;
      case STATE.PAUSED: this.updatePaused(dt); break;
      case STATE.GAME_OVER: this.updateGameOver(dt); break;
      case STATE.STAGE_CLEAR: this.updateStageClear(dt); break;
      case STATE.WIN: this.updateWin(dt); break;
    }
  }

  updateMenu(dt) {
    this.menuTimer += dt;
    if (Input.isPressed('Enter') || Input.isPressed('Space')) {
      SFX.resume();
      SFX.play('start');
      this.stage = 1;
      this.score = 0;
      this.lives = PLAYER_LIVES;
      this.startStage();
    }
  }

  startStage() {
    this.map.load(LEVELS[(this.stage - 1) % LEVELS.length]);
    this.base = { x: BASE_PX, y: BASE_PY, destroyed: false };
    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.explosions = [];
    this.player = new Tank(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 0, true);
    this.player.applyLevel();
    this.enemyQueue = this.generateEnemyQueue();
    this.enemySpawnTimer = 1.5;
    this.freezeTimer = 0;
    this.shovelTimer = 0;
    this.respawnTimer = 0;
    this.state = STATE.STAGE_INTRO;
    this.stageIntroTimer = 2.0;
    this.showOverlay(
      '<h2>STAGE ' + String(this.stage).padStart(2, '0') + '</h2>' +
      '<p>准备战斗！</p>'
    );
    this.updateHUD();
  }

  generateEnemyQueue() {
    const queue = [];
    for (let i = 0; i < ENEMIES_PER_LEVEL; i++) {
      let type;
      const r = Math.random();
      if (this.stage <= 1) {
        type = r < 0.65 ? E_BASIC : (r < 0.85 ? E_FAST : E_POWER);
      } else if (this.stage <= 3) {
        type = r < 0.4 ? E_BASIC : (r < 0.65 ? E_FAST : (r < 0.85 ? E_POWER : E_ARMOR));
      } else if (this.stage <= 5) {
        type = r < 0.25 ? E_BASIC : (r < 0.5 ? E_FAST : (r < 0.75 ? E_POWER : E_ARMOR));
      } else {
        type = r < 0.15 ? E_BASIC : (r < 0.4 ? E_FAST : (r < 0.7 ? E_POWER : E_ARMOR));
      }
      queue.push(type);
    }
    return queue;
  }

  updateStageIntro(dt) {
    this.stageIntroTimer -= dt;
    if (this.stageIntroTimer <= 0) {
      this.state = STATE.PLAYING;
      this.hideOverlay();
    }
  }

  updatePlaying(dt) {
    if (Input.isPressed('KeyP')) {
      this.state = STATE.PAUSED;
      SFX.play('pause');
      this.showOverlay('<h2>暂停</h2><p>按 P 继续</p>');
      return;
    }

    // freeze timer (clock power-up)
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      for (const e of this.enemies) e.frozen = true;
    } else {
      for (const e of this.enemies) e.frozen = false;
    }

    // shovel timer
    if (this.shovelTimer > 0) {
      this.shovelTimer -= dt;
      if (this.shovelTimer <= 0) {
        this.map.setBaseWalls(T_BRICK);
      }
    }

    // spawn enemies
    if (this.enemyQueue.length > 0 && this.enemies.length < this.maxOnScreen) {
      this.enemySpawnTimer -= dt;
      if (this.enemySpawnTimer <= 0) {
        this.spawnEnemy();
        this.enemySpawnTimer = 2.0;
      }
    }

    // respawn player
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.player = new Tank(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 0, true);
        this.player.applyLevel();
      }
    }

    // update player
    if (this.player && !this.player.dead) {
      this.player.update(dt, this);
    }

    // update enemies
    for (const e of this.enemies) {
      e.update(dt, this);
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // update bullets
    for (const b of this.bullets) {
      b.update(dt, this);
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    this.enemies = this.enemies.filter(e => !e.dead);

    // update power-ups
    for (const p of this.powerups) {
      p.update(dt, this);
    }
    this.powerups = this.powerups.filter(p => !p.dead);

    // update explosions
    for (const ex of this.explosions) {
      ex.timer -= dt;
    }
    this.explosions = this.explosions.filter(ex => ex.timer > 0);

    // check stage clear
    if (this.enemyQueue.length === 0 && this.enemies.length === 0 && !this.base.destroyed) {
      this.score += 500;
      SFX.play('levelup');
      if (this.stage >= this.totalStages) {
        this.state = STATE.WIN;
        this.showOverlay(
          '<h2>恭喜通关！</h2>' +
          '<p>你完成了全部 ' + this.totalStages + ' 关</p>' +
          '<p class="highlight">最终得分: ' + this.score + '</p>' +
          '<p class="blink" style="margin-top:20px;">按 ENTER 返回菜单</p>'
        );
      } else {
        this.state = STATE.STAGE_CLEAR;
        this.stageClearTimer = 0;
        this.showOverlay(
          '<h2>STAGE ' + String(this.stage).padStart(2, '0') + ' 通关</h2>' +
          '<p>关卡奖励: +500</p>' +
          '<p>当前得分: ' + this.score + '</p>' +
          '<p class="blink" style="margin-top:20px;">按 ENTER 进入下一关</p>'
        );
      }
      this.updateHUD();
      return;
    }

    this.updateHUD();
  }

  updatePaused(dt) {
    if (Input.isPressed('KeyP') || Input.isPressed('Enter')) {
      this.state = STATE.PLAYING;
      SFX.play('pause');
      this.hideOverlay();
    }
  }

  updateGameOver(dt) {
    this.gameOverTimer += dt;
    // continue updating explosions for visual effect
    for (const ex of this.explosions) ex.timer -= dt;
    this.explosions = this.explosions.filter(ex => ex.timer > 0);
    if (this.gameOverTimer > 1.5 && (Input.isPressed('Enter') || Input.isPressed('Space'))) {
      this.showMenu();
    }
  }

  updateStageClear(dt) {
    this.stageClearTimer += dt;
    if (this.stageClearTimer > 1.0 && (Input.isPressed('Enter') || Input.isPressed('Space'))) {
      this.stage++;
      this.startStage();
    }
  }

  updateWin(dt) {
    if (Input.isPressed('Enter') || Input.isPressed('Space')) {
      this.showMenu();
    }
  }

  // ===== Spawn & Events =====

  spawnEnemy() {
    if (this.enemyQueue.length === 0) return;
    const type = this.enemyQueue.shift();
    // pick a spawn point that's not blocked
    const spawns = ENEMY_SPAWNS.slice();
    // shuffle
    for (let i = spawns.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spawns[i], spawns[j]] = [spawns[j], spawns[i]];
    }
    for (const sp of spawns) {
      let blocked = false;
      for (const e of this.enemies) {
        if (Math.abs(e.x - sp.x) < TANK_SIZE && Math.abs(e.y - sp.y) < TANK_SIZE) {
          blocked = true;
          break;
        }
      }
      if (this.player && !this.player.dead &&
          Math.abs(this.player.x - sp.x) < TANK_SIZE &&
          Math.abs(this.player.y - sp.y) < TANK_SIZE) {
        blocked = true;
      }
      if (!blocked) {
        const enemy = new Tank(sp.x, sp.y, type, false);
        enemy.carrier = Math.random() < 0.18;
        this.enemies.push(enemy);
        SFX.play('spawn');
        return;
      }
    }
    // all spawn points blocked - put enemy back in queue
    this.enemyQueue.unshift(type);
  }

  spawnExplosion(x, y, size) {
    this.explosions.push({
      x: x, y: y,
      timer: 0.4,
      maxTimer: 0.4,
      size: size === 'small' ? 8 : 16
    });
  }

  onEnemyKilled(enemy) {
    this.score += enemy.score || 100;
    this.spawnExplosion(enemy.x + 16, enemy.y + 16, 'big');
    SFX.play('explode');
    if (enemy.carrier) {
      this.spawnPowerUp();
    }
    this.updateHUD();
  }

  spawnPowerUp() {
    const type = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
    let x, y, valid = false, tries = 0;
    while (!valid && tries < 50) {
      x = Math.floor(Math.random() * (GRID_W - 2)) * TILE;
      y = Math.floor(Math.random() * (GRID_H - 4)) * TILE;


      valid = true;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const t = this.map.getTile(Math.floor(x / TILE) + dx, Math.floor(y / TILE) + dy);
          if (t === T_BRICK || t === T_STEEL || t === T_WATER) valid = false;
        }
      }
      if (x < this.base.x + 48 && x + 32 > this.base.x - 16 &&
          y < this.base.y + 48 && y + 32 > this.base.y - 16) {
        valid = false;
      }
      tries++;
    }
    this.powerups.push(new PowerUp(x, y, type));
    SFX.play('powerup');
  }

  applyPowerUp(type) {
    SFX.play('powerup');
    switch (type) {
      case PU_STAR:
        if (this.player.level < 3) {
          this.player.level++;
          this.player.applyLevel();
        }
        this.score += 500;
        break;
      case PU_BOMB:
        for (const e of this.enemies) {
          e.dead = true;
          this.score += e.score || 100;
          this.spawnExplosion(e.x + 16, e.y + 16, 'big');
        }
        this.enemies = [];
        SFX.play('explode');
        break;
      case PU_CLOCK:
        this.freezeTimer = 10;
        break;
      case PU_SHOVEL:
        this.shovelTimer = 15;
        this.map.setBaseWalls(T_STEEL);
        break;
      case PU_TANK:
        this.lives++;
        this.score += 500;
        break;
      case PU_SHIELD:
        this.player.shieldTimer = 10;
        break;
    }
    this.updateHUD();
  }

  onPlayerDeath() {
    if (!this.player) return;
    this.spawnExplosion(this.player.x + 16, this.player.y + 16, 'big');
    SFX.play('explode');
    this.lives--;
    this.player = null;
    this.updateHUD();
    if (this.lives <= 0) {
      this.gameOverTimer = 0;
      this.state = STATE.GAME_OVER;
      SFX.play('gameover');
      this.showOverlay(
        '<h3>GAME OVER</h3>' +
        '<p>得分: ' + this.score + '</p>' +
        '<p class="blink" style="margin-top:20px;">按 ENTER 返回菜单</p>'
      );
    } else {
      this.respawnTimer = 1.5;
    }
  }

  onBaseDestroyed() {
    this.base.destroyed = true;
    this.spawnExplosion(this.base.x + 16, this.base.y + 16, 'big');
    SFX.play('explode');
    this.gameOverTimer = 0;
    this.state = STATE.GAME_OVER;
    SFX.play('gameover');
    this.showOverlay(
      '<h3>GAME OVER</h3>' +
      '<p>基地被摧毁！</p>' +
      '<p>得分: ' + this.score + '</p>' +
      '<p class="blink" style="margin-top:20px;">按 ENTER 返回菜单</p>'
    );
  }

  // ===== HUD =====

  updateHUD() {
    document.getElementById('hud-stage').textContent = String(this.stage).padStart(2, '0');
    document.getElementById('hud-score').textContent = this.score;
    document.getElementById('hud-lives').textContent = this.lives > 0 ? 'I'.repeat(this.lives) : '0';
    document.getElementById('hud-level').textContent = this.player ? (this.player.level + 1) : '1';
    const enemyCount = this.enemyQueue.length + this.enemies.length;
    if (this._lastEnemyCount !== enemyCount) {
      this._lastEnemyCount = enemyCount;
      const icons = document.getElementById('hud-enemies');
      icons.innerHTML = '';
      for (let i = 0; i < enemyCount; i++) {
        const icon = document.createElement('div');
        icon.className = 'enemy-icon';
        icons.appendChild(icon);
      }
    }
  }

  // ===== Overlay =====

  showOverlay(html) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlay-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
  }

  showMenu() {
    this.state = STATE.MENU;
    this.menuTimer = 0;
    this.showOverlay(
      '<h2>TANK 1990</h2>' +
      '<p>坦克大战</p>' +
      '<div class="controls-list">' +
      '<span>↑↓←→ / WASD</span> 移动<br>' +
      '<span>空格 / J</span> 射击<br>' +
      '<span>P</span> 暂停<br>' +
      '<span>Enter</span> 确认' +
      '</div>' +
      '<p>保护基地，消灭全部敌机！</p>' +
      '<p>拾取道具：★升级炸弹💣时钟⏰铁铲🛡坦克🛡护盾</p>' +
      '<p class="blink" style="margin-top:20px;">按 ENTER 开始游戏</p>'
    );
  }

  // ===== Render =====

  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, PLAY_W, PLAY_H);

    if (this.state === STATE.MENU) {
      this.renderMenuCanvas();
    } else if (this.state === STATE.WIN) {
      this.renderWinCanvas();
    } else {
      this.renderGame();
    }
  }

  renderGame() {
    // map (non-tree tiles)
    this.map.draw(this.ctx, this.frame);
    // base
    drawBase(this.ctx, this.base.x, this.base.y, this.base.destroyed);
    // power-ups
    for (const p of this.powerups) p.draw(this.ctx);
    // tanks
    if (this.player) this.player.draw(this.ctx, this.frame);
    for (const e of this.enemies) e.draw(this.ctx, this.frame);
    // bullets
    for (const b of this.bullets) b.draw(this.ctx);
    // trees (on top, to hide tanks)
    this.map.drawTrees(this.ctx, this.frame);
    // explosions
    for (const ex of this.explosions) {
      const progress = 1 - ex.timer / ex.maxTimer;
      const frame = Math.min(3, Math.floor(progress * 4));
      drawExplosion(this.ctx, ex.x, ex.y, frame, ex.size);
    }
  }

  renderMenuCanvas() {
    const ctx = this.ctx;
    // decorative tanks
    drawTank(ctx, 40, 120, DIR_RIGHT, 'player', this.frame, 0, false);
    drawTank(ctx, 344, 120, DIR_LEFT, 'basic', this.frame, 0, false);
    drawTank(ctx, 40, 200, DIR_RIGHT, 'fast', this.frame, 0, false);
    drawTank(ctx, 344, 200, DIR_LEFT, 'power', this.frame, 0, false);
    drawTank(ctx, 40, 280, DIR_RIGHT, 'armor', this.frame, 0, false);
    drawTank(ctx, 344, 280, DIR_LEFT, 'player', this.frame, 3, false);
    // base in center
    drawBase(ctx, 192, 180, false);
    // some bricks
    for (let i = 0; i < 5; i++) {
      drawBrick(ctx, 120 + i * 16, 340);
      drawBrick(ctx, 200 + i * 16, 340);
    }
  }

  renderWinCanvas() {
    const ctx = this.ctx;
    drawTank(ctx, 100, 180, DIR_UP, 'player', this.frame, 3, false);
    drawTank(ctx, 284, 180, DIR_UP, 'player', this.frame, 3, false);
    drawBase(ctx, 192, 260, false);
  }
}
