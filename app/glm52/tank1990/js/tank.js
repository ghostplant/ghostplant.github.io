// ============================================================
// Tank 1990 - Tank Class (player and enemies)
// ============================================================

class Tank {
  constructor(x, y, type, isPlayer) {
    this.x = x;
    this.y = y;
    this.type = type;       // 0-3 for enemies, 0 for player
    this.isPlayer = isPlayer;
    this.dir = isPlayer ? DIR_UP : DIR_DOWN;
    this.moving = false;
    this.frame = 0;
    this.frameTimer = 0;
    this.cooldown = 0;
    this.spawnTimer = 1.0;
    this.shieldTimer = isPlayer ? 2.5 : 0;
    this.flashTimer = 0;
    this.frozen = false;
    this.dead = false;
    this.carrier = false;
    this.level = 0;
    this.bullets = [];
    this.aiTimer = 0;
    this.aiFireTimer = 0;
    this.carrierFlash = 0;

    if (isPlayer) {
      this.speed = TANK_SPEED;
      this.hp = 1;
      this.maxBullets = 1;
      this.bulletSpeed = BULLET_SPEED_PLAYER;
      this.bulletPower = 0;
    } else {
      const stats = ENEMY_STATS[type];
      this.speed = stats.speed;
      this.hp = stats.hp;
      this.score = stats.score;
      this.maxBullets = 1;
      this.bulletSpeed = stats.bulletSpeed;
      this.bulletPower = 0;
    }
  }

  get colorKey() {
    if (this.isPlayer) return 'player';
    return ['basic', 'fast', 'power', 'armor'][this.type];
  }

  applyLevel() {
    this.bulletSpeed = this.level >= 1 ? BULLET_SPEED_PLAYER_UP : BULLET_SPEED_PLAYER;
    this.maxBullets = this.level >= 2 ? 2 : 1;
    this.bulletPower = this.level >= 3 ? 1 : 0;
  }

  update(dt, game) {
    if (this.dead) return;
    if (this.spawnTimer > 0) {
      this.spawnTimer -= dt;
      return;
    }
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    this.carrierFlash += dt;

    if (this.frozen) return;

    if (this.isPlayer) {
      this.updatePlayer(dt, game);
    } else {
      this.updateAI(dt, game);
    }

    // tread animation
    if (this.moving) {
      this.frameTimer += dt;
      if (this.frameTimer >= 0.08) {
        this.frameTimer = 0;
        this.frame = 1 - this.frame;
      }
    } else {
      this.frame = 0;
    }
  }

  updatePlayer(dt, game) {
    let moved = false;
    if (Input.isDown('ArrowUp') || Input.isDown('KeyW')) {
      this.setDir(DIR_UP);
      if (this.move(dt, game)) moved = true;
    } else if (Input.isDown('ArrowDown') || Input.isDown('KeyS')) {
      this.setDir(DIR_DOWN);
      if (this.move(dt, game)) moved = true;
    } else if (Input.isDown('ArrowLeft') || Input.isDown('KeyA')) {
      this.setDir(DIR_LEFT);
      if (this.move(dt, game)) moved = true;
    } else if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) {
      this.setDir(DIR_RIGHT);
      if (this.move(dt, game)) moved = true;
    }
    this.moving = moved;

    if ((Input.isDown('Space') || Input.isDown('KeyJ')) && this.cooldown <= 0) {
      this.shoot(game);
    }
  }

  updateAI(dt, game) {
    this.aiTimer -= dt;
    this.aiFireTimer -= dt;

    if (this.aiTimer <= 0) {
      this.aiTimer = 1 + Math.random() * 2;
      // 55% chance to move toward player or base
      const target = Math.random() < 0.5 ? game.player : game.base;
      if (target && Math.random() < 0.55) {
        const tx = target.x + 16;
        const ty = target.y + 16;
        const dx = tx - (this.x + 16);
        const dy = ty - (this.y + 16);
        if (Math.abs(dx) > Math.abs(dy)) {
          this.dir = dx > 0 ? DIR_RIGHT : DIR_LEFT;
        } else {
          this.dir = dy > 0 ? DIR_DOWN : DIR_UP;
        }
      } else {
        this.dir = Math.floor(Math.random() * 4);
      }
    }

    if (this.aiFireTimer <= 0) {
      this.aiFireTimer = 0.5 + Math.random() * 1.5;
      if (Math.random() < 0.65) this.shoot(game);
    }

    if (!this.move(dt, game)) {
      this.aiTimer = Math.min(this.aiTimer, 0.15);
    }
    this.moving = true;
  }

  setDir(dir) {
    if (this.dir !== dir) {
      this.dir = dir;
      // snap to grid on perpendicular axis
      if (dir === DIR_UP || dir === DIR_DOWN) {
        this.x = Math.round(this.x / TILE) * TILE;
      } else {
        this.y = Math.round(this.y / TILE) * TILE;
      }
    }
  }

  move(dt, game) {
    const dist = this.speed * dt * 60;
    const nx = this.x + DX[this.dir] * dist;
    const ny = this.y + DY[this.dir] * dist;

    // bounds check
    if (nx < 0 || nx > PLAY_W - TANK_SIZE || ny < 0 || ny > PLAY_H - TANK_SIZE) {
      return false;
    }

    // tile collision
    if (this.collidesWithMap(nx, ny, game)) {
      return false;
    }

    // tank collision
    if (this.collidesWithTanks(nx, ny, game)) {
      return false;
    }

    this.x = nx;
    this.y = ny;
    return true;
  }

  collidesWithMap(nx, ny, game) {
    const tx1 = Math.floor(nx / TILE);
    const ty1 = Math.floor(ny / TILE);
    const tx2 = Math.floor((nx + TANK_SIZE - 1) / TILE);
    const ty2 = Math.floor((ny + TANK_SIZE - 1) / TILE);
    for (let ty = ty1; ty <= ty2; ty++) {
      for (let tx = tx1; tx <= tx2; tx++) {
        const tile = game.map.getTile(tx, ty);
        if (tile === T_BRICK || tile === T_STEEL || tile === T_WATER) {
          return true;
        }
      }
    }
    // base collision
    if (!game.base.destroyed) {
      const bx = game.base.x, by = game.base.y;
      if (nx + TANK_SIZE > bx && nx < bx + 32 &&
          ny + TANK_SIZE > by && ny < by + 32) {
        return true;
      }
    }
    return false;
  }

  collidesWithTanks(nx, ny, game) {
    const tanks = [];
    if (game.player && !game.player.dead && game.player !== this && game.player.spawnTimer <= 0) {
      tanks.push(game.player);
    }
    for (const e of game.enemies) {
      if (e !== this && !e.dead && e.spawnTimer <= 0) tanks.push(e);
    }
    for (const t of tanks) {
      if (nx < t.x + TANK_SIZE && nx + TANK_SIZE > t.x &&
          ny < t.y + TANK_SIZE && ny + TANK_SIZE > t.y) {
        return true;
      }
    }
    return false;
  }

  shoot(game) {
    this.bullets = this.bullets.filter(b => !b.dead);
    const active = this.bullets.length;
    if (active >= this.maxBullets) return;

    let bx, by;
    if (this.dir === DIR_UP) { bx = this.x + 13; by = this.y - 6; }
    else if (this.dir === DIR_DOWN) { bx = this.x + 13; by = this.y + 32; }
    else if (this.dir === DIR_LEFT) { bx = this.x - 6; by = this.y + 13; }
    else { bx = this.x + 32; by = this.y + 13; }

    const bullet = new Bullet(bx, by, this.dir, this.isPlayer ? 'player' : 'enemy', this.bulletSpeed, this.bulletPower);
    this.bullets.push(bullet);
    game.bullets.push(bullet);
    this.cooldown = this.isPlayer ? 0.25 : (0.7 + Math.random() * 0.6);
    SFX.play(this.isPlayer ? 'shoot' : 'eshoot');
  }

  hit(game) {
    if (this.shieldTimer > 0) {
      SFX.play('shield');
      return;
    }
    if (this.isPlayer) {
      game.onPlayerDeath();
      return;
    }
    this.hp--;
    if (this.type === E_ARMOR) {
      this.flashTimer = 0.15;
    }
    if (this.hp <= 0) {
      this.dead = true;
      game.onEnemyKilled(this);
    } else {
      SFX.play('hit');
    }
  }

  draw(ctx, animFrame) {
    if (this.spawnTimer > 0) {
      drawSpawnEffect(ctx, this.x, this.y, Math.floor(this.spawnTimer * 8) % 6);
      return;
    }
    const flash = this.flashTimer > 0 && this.type === E_ARMOR;
    let colorKey = this.colorKey;
    if (this.carrier && !this.isPlayer && Math.floor(this.carrierFlash * 6) % 2 === 0) {
      colorKey = 'carrier';
    }
    drawTank(ctx, this.x, this.y, this.dir, colorKey, this.frame, this.level, flash);
    if (this.shieldTimer > 0) {
      drawShield(ctx, this.x, this.y, animFrame);
    }
  }
}
