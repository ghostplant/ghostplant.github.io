// ============================================================
// Tank 1990 - Power-Up Class
// ============================================================

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.timer = 15;       // 15 seconds before disappearing
    this.dead = false;
    this.frame = 0;
    this.frameTimer = 0;
    this.size = 32;
  }

  update(dt, game) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.dead = true;
      return;
    }
    this.frameTimer += dt;
    if (this.frameTimer >= 0.2) {
      this.frameTimer = 0;
      this.frame = 1 - this.frame;
    }
    // check collision with player
    if (game.player && !game.player.dead && game.player.spawnTimer <= 0) {
      if (this.x < game.player.x + TANK_SIZE &&
          this.x + this.size > game.player.x &&
          this.y < game.player.y + TANK_SIZE &&
          this.y + this.size > game.player.y) {
        this.dead = true;
        game.applyPowerUp(this.type);
      }
    }
  }

  draw(ctx) {
    // blink when about to disappear
    if (this.timer < 3 && Math.floor(this.timer * 6) % 2 === 0) {
      return;
    }
    drawPowerUp(ctx, this.x, this.y, this.type, this.frame);
  }
}
