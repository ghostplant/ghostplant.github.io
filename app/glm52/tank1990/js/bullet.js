// ============================================================
// Tank 1990 - Bullet Class
// ============================================================

class Bullet {
  constructor(x, y, dir, owner, speed, power) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.owner = owner;   // 'player' or 'enemy'
    this.speed = speed;
    this.power = power;   // 0 = normal, 1 = can destroy steel
    this.size = BULLET_SIZE;
    this.dead = false;
  }

  update(dt, game) {
    const dist = this.speed * dt * 60;
    this.x += DX[this.dir] * dist;
    this.y += DY[this.dir] * dist;

    // out of bounds
    if (this.x < 0 || this.x > PLAY_W - this.size ||
        this.y < 0 || this.y > PLAY_H - this.size) {
      this.dead = true;
      game.spawnExplosion(this.x, this.y, 'small');
      return;
    }

    // tile collision (check leading edge)
    let cx = this.x + this.size / 2;
    let cy = this.y + this.size / 2;
    if (this.dir === DIR_UP) cy = this.y;
    else if (this.dir === DIR_DOWN) cy = this.y + this.size - 1;
    else if (this.dir === DIR_LEFT) cx = this.x;
    else if (this.dir === DIR_RIGHT) cx = this.x + this.size - 1;

    const tx = Math.floor(cx / TILE);
    const ty = Math.floor(cy / TILE);
    const tile = game.map.getTile(tx, ty);

    if (tile === T_BRICK) {
      game.map.setTile(tx, ty, T_EMPTY);
      this.dead = true;
      SFX.play('brick');
      game.spawnExplosion(this.x, this.y, 'small');
      return;
    } else if (tile === T_STEEL) {
      if (this.power >= 1) {
        game.map.setTile(tx, ty, T_EMPTY);
        SFX.play('explode');
      } else {
        SFX.play('steel');
      }
      this.dead = true;
      return;
    }

    // base collision
    if (!game.base.destroyed) {
      const bx = game.base.x, by = game.base.y;
      if (this.x + this.size > bx && this.x < bx + 32 &&
          this.y + this.size > by && this.y < by + 32) {
        game.base.destroyed = true;
        this.dead = true;
        game.onBaseDestroyed();
        return;
      }
    }

    // tank collision
    if (this.owner === 'player') {
      for (const e of game.enemies) {
        if (e.spawnTimer > 0 || e.dead) continue;
        if (this.hits(e)) {
          this.dead = true;
          e.hit(game);
          return;
        }
      }
    } else {
      if (game.player && !game.player.dead && game.player.spawnTimer <= 0) {
        if (this.hits(game.player)) {
          this.dead = true;
          game.player.hit(game);
          return;
        }
      }
    }

    // bullet vs bullet
    for (const b of game.bullets) {
      if (b === this || b.dead) continue;
      if (b.owner !== this.owner) {
        if (this.x < b.x + b.size && this.x + this.size > b.x &&
            this.y < b.y + b.size && this.y + this.size > b.y) {
          this.dead = true;
          b.dead = true;
          return;
        }
      }
    }
  }

  hits(tank) {
    return this.x < tank.x + TANK_SIZE &&
           this.x + this.size > tank.x &&
           this.y < tank.y + TANK_SIZE &&
           this.y + this.size > tank.y;
  }

  draw(ctx) {
    drawBullet(ctx, this.x, this.y, this.dir);
  }
}
