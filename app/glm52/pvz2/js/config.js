/**
 * config.js - 游戏全局配置常量
 */
window.CONFIG = {
  // 画布
  CANVAS_W: 900,
  CANVAS_H: 600,

  // 草地区域
  GRID_COLS: 9,
  GRID_ROWS: 5,
  CELL_W: 80,
  CELL_H: 96,
  GRID_X: 100,   // 草地左边距（左边留给种植栏）
  GRID_Y: 100,   // 草地上边距

  // 阳光
  SUN_INITIAL: 350,        // 初始阳光
  SUN_DROP_AMOUNT: 25,
  SUN_DROP_INTERVAL: 8000, // ms 天降阳光间隔（加快阳光获取）
  SUN_DROP_SPEED: 0.5,
  SUN_EXPIRE: 10000,       // 阳光多久后消失
  SUN_RADIUS: 22,
  SUN_AUTO_COLLECT_DELAY: 1.0, // 落地后自动收集延迟（秒）

  // 游戏节奏
  TICK: 1000 / 60,          // 逻辑帧
  FPS_TARGET: 60,

  // 子弹
  PEA_SPEED: 5,
  PEA_DAMAGE: 20,

  // 波次间延迟（秒）
  WAVE_INITIAL_DELAY: 20,  // 第一波僵尸前的准备时间
  WAVE_BETWEEN_DELAY: 15,  // 波次之间的间隔

  // 僵尸
  ZOMBIE_BASE_SPEED: 0.25,
  ZOMBIE_EAT_DAMAGE: 40,   // 每秒伤害
  ZOMBIE_SPAWN_X: 880,     // 出生X

  // 游戏结束
  ZOMBIE_WIN_X: 80,        // 僵尸到达此线则游戏结束
};

/** 植物类型ID */
window.PlantType = {
  SUNFLOWER: 'sunflower',
  POTATOMINE: 'potatomine',
  WALLNUT: 'wallnut',
  REPEATER: 'repeater',
  SNOWPEA: 'snowpea',
  CHERRYBOMB: 'cherrybomb',
  GLOOMSHROOM: 'gloomshroom',
};

/** 僵尸类型ID */
window.ZombieType = {
  NORMAL: 'normal',
  CONE: 'cone',
  BUCKET: 'bucket',
  BLACKSHELL: 'blackshell',
};
