/**
 * suns.js - 阳光定义
 */
(function() {
  const C = window.CONFIG;

  window.createSun = function(x, targetY) {
    return {
      x,
      y: -20,
      targetY,
      w: C.SUN_RADIUS * 2,
      h: C.SUN_RADIUS * 2,
      value: C.SUN_DROP_AMOUNT,
      falling: true,
      expire: C.SUN_EXPIRE,
      collected: false,
      pulse: 0,
      autoCollectTimer: C.SUN_AUTO_COLLECT_DELAY,
    };
  };

  window.createSunFromPlant = function(plant) {
    return {
      x: plant.x + 20 + (Math.random() - 0.5) * 20,
      y: plant.y - 10,
      targetY: plant.y + 20 + Math.random() * 30,
      w: C.SUN_RADIUS * 2,
      h: C.SUN_RADIUS * 2,
      value: C.SUN_DROP_AMOUNT,
      falling: true,
      expire: C.SUN_EXPIRE,
      collected: false,
      pulse: 0,
      autoCollectTimer: C.SUN_AUTO_COLLECT_DELAY,
    };
  };

  window.updateSun = function(sun, dt, game) {
    sun.pulse += dt * 3;
    if (sun.falling) {
      sun.y += C.SUN_DROP_SPEED * 60 * dt;
      if (sun.y >= sun.targetY) {
        sun.y = sun.targetY;
        sun.falling = false;
      }
    }
    // 自动收集倒计时（不管是否在落地，都倒计时）
    if (sun.autoCollectTimer > 0) {
      sun.autoCollectTimer -= dt;
    }
    sun.expire -= dt * 1000;
    if (sun.expire <= 0) {
      sun.collected = true; // 过期移除
    }
  };

  window.hitTestSun = function(sun, mx, my) {
    const cx = sun.x + C.SUN_RADIUS;
    const cy = sun.y + C.SUN_RADIUS;
    const dx = mx - cx;
    const dy = my - cy;
    return dx * dx + dy * dy <= (C.SUN_RADIUS + 8) * (C.SUN_RADIUS + 8);
  };
})();
