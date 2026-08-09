/**
 * projectiles.js - 子弹（豌豆）定义
 */
(function() {
  const C = window.CONFIG;

  window.createPea = function(x, y, row, frozen) {
    return {
      x,
      y: y - 5,
      w: 16,
      h: 16,
      row,
      vx: C.PEA_SPEED,
      vy: 0,
      damage: C.PEA_DAMAGE,
      frozen,
      dead: false,
    };
  };
})();
