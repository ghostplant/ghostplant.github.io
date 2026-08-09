/**
 * renderer.js - 渲染器，负责绘制所有游戏元素
 */

(function() {
  const C = window.CONFIG;
  const PD = window.PLANT_DEFS;
  const ZD = window.ZOMBIE_DEFS;
  const rr = window.roundRect;

  class Renderer {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this._bgPattern = null;
    this._time = 0;
  }

  draw(dt) {
    this._time += dt;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    this._drawBackground();
    this._drawGrid();
    this._drawPlants();
    this._drawProjectiles();
    this._drawZombies();
    this._drawSuns();
    this._drawEffects();
    this.game.ui.draw(ctx);
    this._drawPreview();
    this._drawOverlay();
  }

  _drawBackground() {
    const ctx = this.ctx;
    // 天空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, C.CANVAS_H);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.15, '#B0E0E6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    // 草地条纹
    const g = this.game.grid;
    for (let r = 0; r < g.rows; r++) {
      const y = g.offsetY + r * g.cellH;
      ctx.fillStyle = r % 2 === 0 ? '#7CB342' : '#8BC34A';
      ctx.fillRect(g.offsetX, y, g.cols * g.cellW, g.cellH);
    }

    // 左侧种植区边界
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(g.offsetX - 6, g.offsetY, 4, g.rows * g.cellH);

    // 右侧僵尸入口区域
    ctx.fillStyle = 'rgba(80,60,40,0.3)';
    ctx.fillRect(C.ZOMBIE_SPAWN_X, g.offsetY, C.CANVAS_W - C.ZOMBIE_SPAWN_X, g.rows * g.cellH);

    // 房屋（左边）
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(20, g.offsetY, 70, g.rows * g.cellH);
    ctx.fillStyle = '#D32F2F';
    ctx.beginPath();
    ctx.moveTo(15, g.offsetY);
    ctx.lineTo(55, g.offsetY - 30);
    ctx.lineTo(95, g.offsetY);
    ctx.closePath();
    ctx.fill();
    // 门和窗
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(40, g.offsetY + 200, 30, 60);
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(30, g.offsetY + 80, 20, 20);
    ctx.fillRect(60, g.offsetY + 80, 20, 20);
  }

  _drawGrid() {
    // 鼠标悬停高亮
    const cell = this.game.grid.pixelToGrid(this.game.input.mouseX, this.game.input.mouseY);
    if (cell && this.game.ui.selectedSeed) {
      const ctx = this.ctx;
      const tl = this.game.grid.gridToTopLeft(cell.row, cell.col);
      ctx.fillStyle = this.game.grid.isOccupied(cell.row, cell.col)
        ? 'rgba(255,0,0,0.25)'
        : 'rgba(255,255,255,0.25)';
      ctx.fillRect(tl.x, tl.y, this.game.grid.cellW, this.game.grid.cellH);
    }
  }

  _drawPlants() {
    const ctx = this.ctx;
    const g = this.game.grid;
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const p = g.getPlant(r, c);
        if (p) this._drawPlant(ctx, p);
      }
    }
  }

  _drawPlant(ctx, plant) {
    const def = PD[plant.type];
    const x = plant.x;
    const y = plant.y;
    const sway = Math.sin(this._time * 2 + plant.col) * 2;

    ctx.save();
    ctx.translate(x + sway, y);

    switch (plant.type) {
      case 'sunflower':
        this._drawSunflower(ctx, plant);
        break;
      case 'potatomine':
        this._drawPotatoMine(ctx, plant);
        break;
      case 'repeater':
        this._drawRepeater(ctx, plant);
        break;
      case 'snowpea':
        this._drawPeashooter(ctx, plant, def.color, true);
        break;
      case 'wallnut':
        this._drawWallnut(ctx, plant);
        break;
      case 'cherrybomb':
        this._drawCherry(ctx, plant);
        break;
      case 'gloomshroom':
        this._drawGloomShroom(ctx, plant);
        break;
    }

    // 血条
    if (plant.hp < def.hp) {
      const ratio = plant.hp / def.hp;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-20, -35, 40, 5);
      ctx.fillStyle = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
      ctx.fillRect(-20, -35, 40 * ratio, 5);
    }

    ctx.restore();
  }

  _drawSunflower(ctx, plant) {
    // 茎
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, 5);
    ctx.stroke();
    // 叶子
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(-10, 15, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // 花瓣
    const petals = 10;
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 14, Math.sin(a) * 14 - 5, 7, 12, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // 花心
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.arc(0, -5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-3, -6, 2, 0, Math.PI * 2);
    ctx.arc(3, -6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPeashooter(ctx, plant, color, frozen) {
    // 茎
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, 5);
    ctx.stroke();
    // 叶子
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(-10, 15, 8, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // 头
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -2, 14, 0, Math.PI * 2);
    ctx.fill();
    // 嘴/枪口
    ctx.fillStyle = frozen ? '#81D4FA' : '#33691E';
    ctx.beginPath();
    ctx.ellipse(12, -2, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(2, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(4, -5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawRepeater(ctx, plant) {
    this._drawPeashooter(ctx, plant, '#44AA88');
    // 第二个枪口
    ctx.fillStyle = '#1B5E20';
    ctx.beginPath();
    ctx.ellipse(12, 4, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPotatoMine(ctx, plant) {
    const def = PD['potatomine'];
    const armed = (plant._armTimer || 0) >= def.armingTime;
    const t = this._time;

    if (!armed) {
      // 未就绪：土堆 + 嫩芽
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.ellipse(0, 18, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // 嫩芽
      ctx.strokeStyle = '#66BB6A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, 14);
      ctx.quadraticCurveTo(0, 4, 3, 14);
      ctx.stroke();
      // 进度环
      const ratio = (plant._armTimer || 0) / def.armingTime;
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
    } else {
      // 已就绪：土豆本体
      const pulse = 1 + Math.sin(t * 6) * 0.05;
      ctx.fillStyle = '#C8B88A';
      ctx.beginPath();
      ctx.ellipse(0, 5, 16 * pulse, 13 * pulse, 0, 0, Math.PI * 2);
      ctx.fill();
      // 斑点
      ctx.fillStyle = '#A89868';
      ctx.beginPath();
      ctx.arc(-5, 2, 2, 0, Math.PI * 2);
      ctx.arc(4, 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // 引线
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.quadraticCurveTo(6, -16, 2, -20);
      ctx.stroke();
      // 火花
      ctx.fillStyle = '#FF6F00';
      const sx = 2 + Math.sin(t * 20) * 2;
      const sy = -20 + Math.cos(t * 25) * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
      // 眼睛
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(-4, 2, 2, 0, Math.PI * 2);
      ctx.arc(4, 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-3, 2, 1, 0, Math.PI * 2);
      ctx.arc(5, 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawWallnut(ctx, plant) {
    const ratio = plant.hp / 400;
    ctx.fillStyle = '#C48844';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // 表情根据血量
    ctx.fillStyle = '#000';
    if (ratio > 0.66) {
      // 正常
      ctx.beginPath();
      ctx.arc(-6, -5, 2, 0, Math.PI * 2);
      ctx.arc(6, -5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0, Math.PI);
      ctx.stroke();
    } else if (ratio > 0.33) {
      // 受伤
      ctx.beginPath();
      ctx.arc(-6, -5, 2, 0, Math.PI * 2);
      ctx.arc(6, -5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(5, 5);
      ctx.stroke();
    } else {
      // 重伤
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -6); ctx.lineTo(-4, -4);
      ctx.moveTo(-4, -6); ctx.lineTo(-8, -4);
      ctx.moveTo(4, -6); ctx.lineTo(8, -4);
      ctx.moveTo(8, -6); ctx.lineTo(4, -4);
      ctx.stroke();
    }
  }

  _drawCherry(ctx, plant) {
    const fuse = plant._fuse || 0;
    const flash = fuse > 0.8 ? (Math.sin(this._time * 30) > 0 ? '#FF6655' : '#FF0000') : '#D32F2F';
    // 樱桃1
    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(-8, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    // 樱桃2
    ctx.beginPath();
    ctx.arc(8, 2, 12, 0, Math.PI * 2);
    ctx.fill();
    // 茎
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.quadraticCurveTo(0, -20, 8, -8);
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-10, -2, 3, 0, Math.PI * 2);
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-9, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(7, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawGloomShroom(ctx, plant) {
    const t = this._time;
    const firing = (plant._fireTimer || 0) > 0 && (plant._fireTimer || 0) < 300;
    // 茎
    ctx.fillStyle = '#D4C5E0';
    ctx.fillRect(-4, 0, 8, 22);
    // 蘑菇帽（紫色半球）
    ctx.fillStyle = '#7B68EE';
    ctx.beginPath();
    ctx.arc(0, -4, 16, Math.PI, 0);
    ctx.fill();
    // 帽子斑点
    ctx.fillStyle = '#9C8AFE';
    ctx.beginPath();
    ctx.arc(-6, -8, 3, 0, Math.PI * 2);
    ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // 发射孢子粒子（攻击时）
    if (firing) {
      ctx.fillStyle = 'rgba(180,150,255,0.6)';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 18 + Math.sin(t * 10 + i) * 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r - 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 眼睛
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
    ctx.arc(5, -2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawProjectiles() {
    const ctx = this.ctx;
    for (const pea of this.game.projectiles) {
      ctx.fillStyle = pea.frozen ? '#81D4FA' : '#A5D6A7';
      ctx.beginPath();
      ctx.arc(pea.x + pea.w / 2, pea.y + pea.h / 2, pea.w / 2, 0, Math.PI * 2);
      ctx.fill();
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(pea.x + pea.w / 2 - 2, pea.y + pea.h / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawZombies() {
    const ctx = this.ctx;
    for (const z of this.game.zombies) {
      if (z.dead) continue;
      ctx.save();
      ctx.translate(z.x + z.w / 2, z.y + z.h / 2);

      const def = ZD[z.type];
      const walk = Math.sin(z.walkPhase) * 3;
      const lean = z.eating ? Math.sin(this._time * 10) * 2 : 0;

      // 冰冻效果
      if (z.frozen > 0) {
        ctx.shadowColor = '#81D4FA';
        ctx.shadowBlur = 10;
      }

      // 腿
      ctx.fillStyle = '#556655';
      ctx.fillRect(-10, 15, 7, 20 + walk);
      ctx.fillRect(3, 15, 7, 20 - walk);

      // 身体
      ctx.fillStyle = def.color;
      rr(ctx, -12, -5, 24, 25, 4);
      ctx.fill();

      // 手臂（前伸）
      ctx.fillStyle = def.color;
      ctx.fillRect(-15 + lean, -2, 8, 6);
      ctx.fillRect(7 + lean, -2, 8, 6);

      // 头
      ctx.fillStyle = '#9CB8A0';
      ctx.beginPath();
      ctx.arc(0, -15, 11, 0, Math.PI * 2);
      ctx.fill();

      // 眼睛
      ctx.fillStyle = '#F44336';
      ctx.beginPath();
      ctx.arc(-3, -16, 2, 0, Math.PI * 2);
      ctx.arc(3, -16, 2, 0, Math.PI * 2);
      ctx.fill();

      // 嘴
      ctx.fillStyle = '#3E2723';
      if (z.eating) {
        ctx.fillRect(-4, -10, 8, 4 + Math.sin(this._time * 15) * 2);
      } else {
        ctx.fillRect(-4, -10, 8, 3);
      }

      // 装备
      if (z.type === 'cone') {
        ctx.fillStyle = def.accent;
        ctx.beginPath();
        ctx.moveTo(-8, -24);
        ctx.lineTo(8, -24);
        ctx.lineTo(0, -40);
        ctx.closePath();
        ctx.fill();
      } else if (z.type === 'bucket') {
        ctx.fillStyle = def.accent;
        ctx.fillRect(-11, -28, 22, 14);
        ctx.fillStyle = '#777';
        ctx.fillRect(-11, -28, 22, 3);
      } else if (z.type === 'blackshell') {
        // 黑色头盔壳
        ctx.fillStyle = def.accent;
        ctx.beginPath();
        ctx.ellipse(0, -18, 13, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // 头盔反光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-4, -20, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 头盔边缘
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -18, 13, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // 血条
      if (z.hp < z.maxHp) {
        const ratio = z.hp / z.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-15, -35, 30, 4);
        ctx.fillStyle = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillRect(-15, -35, 30 * ratio, 4);
      }

      ctx.restore();
    }
  }

  _drawSuns() {
    const ctx = this.ctx;
    for (const sun of this.game.suns) {
      if (sun.collected) continue;
      const cx = sun.x + C.SUN_RADIUS;
      const cy = sun.y + C.SUN_RADIUS;
      const pulse = 1 + Math.sin(sun.pulse) * 0.1;

      // 光晕
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, C.SUN_RADIUS * 1.8);
      grad.addColorStop(0, 'rgba(255,255,200,0.8)');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, C.SUN_RADIUS * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 太阳本体
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx, cy, C.SUN_RADIUS * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFA000';
      ctx.beginPath();
      ctx.arc(cx, cy, C.SUN_RADIUS * 0.6 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 光线
      ctx.strokeStyle = 'rgba(255,255,200,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + sun.pulse * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * C.SUN_RADIUS, cy + Math.sin(a) * C.SUN_RADIUS);
        ctx.lineTo(cx + Math.cos(a) * C.SUN_RADIUS * 1.5, cy + Math.sin(a) * C.SUN_RADIUS * 1.5);
        ctx.stroke();
      }
    }
  }

  _drawEffects() {
    const ctx = this.ctx;
    for (const e of this.game.effects) {
      if (e.type === 'hit') {
        ctx.fillStyle = e.frozen ? '#81D4FA' : '#FFF59D';
        ctx.globalAlpha = e.life / e.maxLife;
        ctx.beginPath();
        ctx.arc(e.x, e.y, (1 - e.life / e.maxLife) * 15 + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.type === 'explosion') {
        const r = (1 - e.life / e.maxLife) * 80;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        grad.addColorStop(0, 'rgba(255,255,0,0.8)');
        grad.addColorStop(0.5, 'rgba(255,100,0,0.6)');
        grad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = e.life / e.maxLife;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.type === 'plantPoof') {
        ctx.fillStyle = '#C8FF96';
        ctx.globalAlpha = e.life / e.maxLife;
        const r = (1 - e.life / e.maxLife) * 25;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.type === 'spore') {
        // 穿透孢子扩散
        ctx.globalAlpha = e.life / e.maxLife;
        const r = (1 - e.life / e.maxLife) * 50;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        grad.addColorStop(0, 'rgba(180,150,255,0.7)');
        grad.addColorStop(0.5, 'rgba(140,100,220,0.4)');
        grad.addColorStop(1, 'rgba(100,60,180,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  _drawPreview() {
    // 鼠标跟随预览
    if (this.game.ui.selectedSeed && this.game.ui.selectedSeed !== '__shovel__') {
      const def = PD[this.game.ui.selectedSeed];
      const ctx = this.ctx;
      const mx = this.game.input.mouseX;
      const my = this.game.input.mouseY;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(mx, my, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  _drawOverlay() {
    const ctx = this.ctx;
    if (this.game.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ 已暂停', C.CANVAS_W / 2, C.CANVAS_H / 2);
      return;
    }
    if (this.game.state !== 'gameover' && this.game.state !== 'win') return;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);
    ctx.fillStyle = this.game.state === 'win' ? '#FFD700' : '#FF5252';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.game.state === 'win' ? '🎉 胜利！' : '💀 游戏结束',
      C.CANVAS_W / 2,
      C.CANVAS_H / 2 - 20
    );
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('点击屏幕重新开始', C.CANVAS_W / 2, C.CANVAS_H / 2 + 30);
  }
}

  window.Renderer = Renderer;
})();
