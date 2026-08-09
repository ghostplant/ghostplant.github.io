// ============================================================
// Tank 1990 - Map Class
// ============================================================

class GameMap {
  constructor() {
    this.tiles = [];
    for (let y = 0; y < GRID_H; y++) {
      this.tiles.push(new Array(GRID_W).fill(T_EMPTY));
    }
  }

  load(levelData) {
    this.tiles = [];
    for (let y = 0; y < GRID_H; y++) {
      this.tiles.push(new Array(GRID_W).fill(T_EMPTY));
    }
    // expand 13x13 block data to 26x26 tiles
    for (let by = 0; by < 13; by++) {
      const row = levelData[by] || '';
      for (let bx = 0; bx < 13; bx++) {
        const ch = row[bx] || '.';
        let tile = T_EMPTY;
        switch (ch) {
          case 'B': tile = T_BRICK; break;
          case 'S': tile = T_STEEL; break;
          case 'W': tile = T_WATER; break;
          case 'T': tile = T_TREES; break;
          case 'I': tile = T_ICE; break;
        }
        if (tile !== T_EMPTY) {
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const tx = bx * 2 + dx;
              const ty = by * 2 + dy;
              if (tx < GRID_W && ty < GRID_H) {
                this.tiles[ty][tx] = tile;
              }
            }
          }
        }
      }
    }
    // add base protective walls (brick)
    this.setBaseWalls(T_STEEL);
  }

  setBaseWalls(tile) {
    // top wall
    this.tiles[23][12] = tile;
    this.tiles[23][13] = tile;
    // left wall
    this.tiles[24][11] = tile;
    this.tiles[25][11] = tile;
    // right wall
    this.tiles[24][14] = tile;
    this.tiles[25][14] = tile;
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return T_STEEL;
    return this.tiles[ty][tx];
  }

  setTile(tx, ty, val) {
    if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return;
    this.tiles[ty][tx] = val;
  }

  isSolidForTank(tx, ty) {
    const t = this.getTile(tx, ty);
    return t === T_BRICK || t === T_STEEL || t === T_WATER;
  }

  draw(ctx, frame) {
    for (let ty = 0; ty < GRID_H; ty++) {
      for (let tx = 0; tx < GRID_W; tx++) {
        const t = this.tiles[ty][tx];
        if (t !== T_EMPTY && t !== T_TREES) {
          drawTile(ctx, t, tx * TILE, ty * TILE, frame);
        }
      }
    }
  }

  drawTrees(ctx, frame) {
    for (let ty = 0; ty < GRID_H; ty++) {
      for (let tx = 0; tx < GRID_W; tx++) {
        if (this.tiles[ty][tx] === T_TREES) {
          drawTile(ctx, T_TREES, tx * TILE, ty * TILE, frame);
        }
      }
    }
  }
}
