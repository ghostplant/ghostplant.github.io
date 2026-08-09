/**
 * zombies.js - 僵尸定义
 */
(function() {
  const ZT = window.ZombieType;
  const C = window.CONFIG;

  window.ZOMBIE_DEFS = {
    [ZT.NORMAL]: {
      name: '普通僵尸',
      hp: 100,
      speed: C.ZOMBIE_BASE_SPEED,       // 0.25
      color: '#88AA88',
      accent: '#556655',
    },
    [ZT.CONE]: {
      name: '路障僵尸',
      hp: 200,
      speed: C.ZOMBIE_BASE_SPEED,       // 0.25
      color: '#88AA88',
      accent: '#FF8800',
    },
    [ZT.BUCKET]: {
      name: '铁桶僵尸',
      hp: 400,
      speed: C.ZOMBIE_BASE_SPEED * 0.9, // 0.225 略慢
      color: '#88AA88',
      accent: '#AAAAAA',
    },
    [ZT.BLACKSHELL]: {
      name: '黑壳僵尸',
      hp: 800,                                // 铁桶2倍
      speed: C.ZOMBIE_BASE_SPEED * 0.9 * 2, // 铁桶2倍 = 0.45
      color: '#88AA88',
      accent: '#1A1A1A',
    },
  };

  window.createZombie = function(type, row, x) {
    const def = ZOMBIE_DEFS[type];
    if (!def) {
      console.error('Unknown zombie type:', type);
      return null;
    }
    return {
      type,
      row,
      x,
      y: 0, // 由 grid 设置
      w: 40,
      h: 70,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      frozen: 0,     // 减速剩余时间
      eating: false,
      eatTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      dead: false,
    };
  };
})();
