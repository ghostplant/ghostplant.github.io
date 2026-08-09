/**
 * grid.js - 网格/场地管理
 */
(function() {
  const C = window.CONFIG;

  class Grid {
    constructor() {
      this.cols = C.GRID_COLS;
      this.rows = C.GRID_ROWS;
      this.cellW = C.CELL_W;
      this.cellH = C.CELL_H;
      this.offsetX = C.GRID_X;
      this.offsetY = C.GRID_Y;
      // plants[row][col] = plant or null
      this.cells = [];
      for (let r = 0; r < this.rows; r++) {
        this.cells.push(new Array(this.cols).fill(null));
      }
    }

    pixelToGrid(px, py) {
      const col = Math.floor((px - this.offsetX) / this.cellW);
      const row = Math.floor((py - this.offsetY) / this.cellH);
      if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
        return null;
      }
      return { row, col };
    }

    gridToPixel(row, col) {
      return {
        x: this.offsetX + col * this.cellW + this.cellW / 2,
        y: this.offsetY + row * this.cellH + this.cellH / 2,
      };
    }

    gridToTopLeft(row, col) {
      return {
        x: this.offsetX + col * this.cellW,
        y: this.offsetY + row * this.cellH,
      };
    }

    getPlant(row, col) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      return this.cells[row][col];
    }

    setPlant(row, col, plant) {
      this.cells[row][col] = plant;
    }

    removePlant(row, col) {
      this.cells[row][col] = null;
    }

    isOccupied(row, col) {
      return this.cells[row][col] !== null;
    }

    cleanup(game) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const p = this.cells[r][c];
          if (p && p.hp <= 0) {
            this.cells[r][c] = null;
          }
        }
      }
    }
  }

  window.Grid = Grid;
})();
