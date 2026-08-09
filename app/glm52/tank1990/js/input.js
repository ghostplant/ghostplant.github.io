// ============================================================
// Tank 1990 - Input Handler
// ============================================================

const Input = {
  keys: {},
  pressed: {},

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) {
        this.pressed[e.code] = true;
      }
      this.keys[e.code] = true;
      // prevent scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  },

  isDown(code) {
    return !!this.keys[code];
  },

  isPressed(code) {
    return !!this.pressed[code];
  },

  clearPressed() {
    this.pressed = {};
  }
};
