/**
 * input.js - 输入处理（鼠标）
 */
(function() {
  const C = window.CONFIG;

  class InputManager {
    constructor(game) {
      this.game = game;
      this.mouseX = 0;
      this.mouseY = 0;
      this.canvas = game.canvas;
      this._bind();
    }

    _bind() {
      const canvas = this.canvas;

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
      });

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        this.handleClick(mx, my);
      });

      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.game.ui.selectedSeed = null;
      });
    }

    handleClick(mx, my) {
      const game = this.game;

      for (const sun of game.suns) {
        if (!sun.collected) {
          const cx = sun.x + C.SUN_RADIUS;
          const cy = sun.y + C.SUN_RADIUS;
          const dx = mx - cx;
          const dy = my - cy;
          if (dx * dx + dy * dy <= (C.SUN_RADIUS + 10) * (C.SUN_RADIUS + 10)) {
            sun.collected = true;
            game.sun += sun.value;
            game.ui.showFloatingText(`+${sun.value}`, mx, my, '#FFD700');
            return;
          }
        }
      }

      const seedBar = game.ui.seedBar;
      if (seedBar) {
        for (let i = 0; i < seedBar.length; i++) {
          const s = seedBar[i];
          if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) {
            if (game.sun >= s.cost && s.cooldownLeft <= 0) {
              game.ui.selectedSeed = s.type;
            }
            return;
          }
        }
      }

      const shovel = game.ui.shovelRect;
      if (shovel && mx >= shovel.x && mx <= shovel.x + shovel.w && my >= shovel.y && my <= shovel.y + shovel.h) {
        game.ui.selectedSeed = '__shovel__';
        return;
      }

      if (game.ui.selectedSeed) {
        const cell = game.grid.pixelToGrid(mx, my);
        if (cell) {
          if (game.ui.selectedSeed === '__shovel__') {
            const p = game.grid.getPlant(cell.row, cell.col);
            if (p) {
              game.grid.removePlant(cell.row, cell.col);
            }
            game.ui.selectedSeed = null;
          } else {
            const def = game.plantDefs[game.ui.selectedSeed];
            if (def && game.sun >= def.cost && !game.grid.isOccupied(cell.row, cell.col)) {
              game.plantSeed(game.ui.selectedSeed, cell.row, cell.col);
              game.ui.selectedSeed = null;
            }
          }
        }
      }
    }
  }

  window.InputManager = InputManager;
})();
