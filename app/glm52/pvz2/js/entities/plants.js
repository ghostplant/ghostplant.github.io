/**
 * plants.js - 植物定义
 */
(function() {
  const PT = window.PlantType;

  window.PLANT_DEFS = {
    [PT.SUNFLOWER]: {
      name: '向日葵',
      cost: 50,
      cooldown: 7500,
      hp: 100,
      color: '#FFD700',
      desc: '产生阳光',
      update(plant, dt, game) {
        plant._sunTimer = (plant._sunTimer || 0) + dt * 1000;
        if (plant._sunTimer >= 6000) {
          plant._sunTimer = 0;
          game.spawnSunFromPlant(plant);
        }
      },
    },

    [PT.POTATOMINE]: {
      name: '土豆雷',
      cost: 25,
      cooldown: 30000,
      hp: 100,
      color: '#C8B88A',
      desc: '埋入地下，准备完毕后踩到即爆',
      armingTime: 15000, // 15秒准备时间
      update(plant, dt, game) {
        // 准备阶段
        plant._armTimer = (plant._armTimer || 0) + dt * 1000;
        if (plant._armTimer < this.armingTime) return; // 还�µ好

        // 已就绪：检测同行是否有僵尸踩到
        const cellLeft = game.grid.gridToTopLeft(plant.row, plant.col).x;
        for (const z of game.zombies) {
          if (z.dead) continue;
          if (z.row !== plant.row) continue;
          // 僵尸踏入土豆雷所在格子的范围
          if (z.x + z.w > cellLeft && z.x < cellLeft + game.grid.cellW) {
            // 爆炸！对同行所有僵尸造成大量伤害
            game.potatoExplode(plant.row, plant.col);
            plant.hp = 0; // 自毁
            return;
          }
        }
      },
    },

    [PT.REPEATER]: {
      name: '双发射手',
      cost: 200,
      cooldown: 7500,
      hp: 100,
      color: '#44AA88',
      desc: '连射两颗豌豆',
      update(plant, dt, game) {
        plant._fireTimer = (plant._fireTimer || 0) + dt * 1000;
        if (plant._fireTimer >= 1500) {
          if (game.hasZombieInRow(plant.row, plant.x)) {
            plant._fireTimer = 0;
            game.spawnPea(plant.x + 30, plant.y, false);
            plant._secondShot = 0.15;
          }
        }
        // 第二发
        if (plant._secondShot !== undefined && plant._secondShot > 0) {
          plant._secondShot -= dt;
          if (plant._secondShot <= 0) {
            game.spawnPea(plant.x + 30, plant.y, false);
            plant._secondShot = undefined;
          }
        }
      },
    },

    [PT.SNOWPEA]: {
      name: '寒冰射手',
      cost: 175,
      cooldown: 7500,
      hp: 100,
      color: '#66CCFF',
      desc: '冰冻豌豆减速僵尸',
      update(plant, dt, game) {
        plant._fireTimer = (plant._fireTimer || 0) + dt * 1000;
        if (plant._fireTimer >= 1500) {
          if (game.hasZombieInRow(plant.row, plant.x)) {
            plant._fireTimer = 0;
            game.spawnPea(plant.x + 30, plant.y, true);
          }
        }
      },
    },

    [PT.WALLNUT]: {
      name: '坚果墙',
      cost: 50,
      cooldown: 30000,
      hp: 400,
      color: '#C48844',
      desc: '高血量阻挡僵尸',
      update() {},
    },

    [PT.CHERRYBOMB]: {
      name: '樱桃炸弹',
      cost: 150,
      cooldown: 50000,
      hp: 100,
      color: '#FF3344',
      desc: '3x3范围爆炸',
      update(plant, dt, game) {
        plant._fuse = (plant._fuse || 0) + dt;
        if (plant._fuse >= 1.2) {
          game.cherryExplode(plant.row, plant.col);
          plant.hp = 0; // 自毁
        }
      },
    },

    [PT.GLOOMSHROOM]: {
      name: '忧郁菇',
      cost: 150,
      cooldown: 7500,
      hp: 100,
      color: '#7B68EE',
      desc: '3x3范围穿透孢子',
      update(plant, dt, game) {
        plant._fireTimer = (plant._fireTimer || 0) + dt * 1000;
        if (plant._fireTimer >= 450 && game.hasZombieNear(plant)) {
          plant._fireTimer = 0;
          game.gloomShroomAttack(plant);
        }
      },
    },
  };

  window.SEED_ORDER = [
    PT.SUNFLOWER,
    PT.POTATOMINE,
    PT.WALLNUT,
    PT.REPEATER,
    PT.SNOWPEA,
    PT.CHERRYBOMB,
    PT.GLOOMSHROOM,
  ];
})();
