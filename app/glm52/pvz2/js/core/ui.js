/**
 * ui.js - 顶部UI栏管理（种子栏、阳光、横幅）
 */
(function() {
  const C = window.CONFIG;
  const SO = window.SEED_ORDER;
  const PD = window.PLANT_DEFS;
  const rr = window.roundRect;

  class UIManager {
    constructor(game) {
      this.game = game;
      this.selectedSeed = null;
      this.seedBar = [];
      this.shovelRect = null;
      this._bannerText = '';
      this._bannerTimer = 0;
      this._floatingTexts = [];
      this._buildSeedBar();
    }

    _buildSeedBar() {
      const w = 60;
      const h = 70;
      const gap = 4;
      let x = 10;
      const y = 12;
      this.seedBar = SO.map((type) => {
        const def = PD[type];
        const rect = { x, y, w, h, type, cost: def.cost, cooldownLeft: 0, cooldownMax: def.cooldown };
        x += w + gap;
        return rect;
      });
      this.shovelRect = { x: x + 10, y: y + 10, w: 50, h: 50 };
    }

    showBanner(text, duration) {
      this._bannerText = text;
      this._bannerTimer = duration / 1000;
    }

    showFloatingText(text, x, y, color) {
      this._floatingTexts.push({ text, x, y, color, life: 1.5, vy: -1 });
    }

    update(dt) {
      for (const s of this.seedBar) {
        if (s.cooldownLeft > 0) {
          s.cooldownLeft -= dt * 1000;
          if (s.cooldownLeft < 0) s.cooldownLeft = 0;
        }
      }
      if (this._bannerTimer > 0) {
        this._bannerTimer -= dt;
      }
      for (const t of this._floatingTexts) {
        t.y += t.vy;
        t.life -= dt;
      }
      this._floatingTexts = this._floatingTexts.filter((t) => t.life > 0);
    }

    triggerCooldown(type) {
      const s = this.seedBar.find((s) => s.type === type);
      if (s) s.cooldownLeft = s.cooldownMax;
    }

    draw(ctx) {
      this._drawTopBar(ctx);
      this._drawBanner(ctx);
      this._drawFloatingTexts(ctx);
    }

    _drawTopBar(ctx) {
      ctx.fillStyle = 'rgba(60,40,20,0.85)';
      rr(ctx, 5, 5, C.CANVAS_W - 10, 85, 8);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`☀ ${Math.floor(this.game.sun)}`, 12, 95);

      for (const s of this.seedBar) {
        const def = PD[s.type];
        const canUse = this.game.sun >= s.cost && s.cooldownLeft <= 0;
        const selected = this.selectedSeed === s.type;

        ctx.fillStyle = selected ? 'rgba(255,255,150,0.9)' : 'rgba(120,90,50,0.8)';
        ctx.strokeStyle = selected ? '#FFF' : 'rgba(200,180,120,0.5)';
        ctx.lineWidth = selected ? 3 : 1;
        rr(ctx, s.x, s.y, s.w, s.h, 5);
        ctx.fill();
        ctx.stroke();

        this._drawPlantIcon(ctx, s.type, s.x + s.w / 2, s.y + 28, 18);

        ctx.fillStyle = canUse ? '#FFF' : '#F88';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${s.cost}`, s.x + s.w / 2, s.y + s.h - 8);

        if (s.cooldownLeft > 0) {
          const ratio = s.cooldownLeft / s.cooldownMax;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          rr(ctx, s.x, s.y, s.w, s.h * ratio, 3);
          ctx.fill();
        }
      }

      const sv = this.shovelRect;
      ctx.fillStyle = this.selectedSeed === '__shovel__' ? 'rgba(255,255,150,0.9)' : 'rgba(120,90,50,0.8)';
      rr(ctx, sv.x, sv.y, sv.w, sv.h, 5);
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(sv.x + sv.w / 2 - 3, sv.y + 10, 6, 25);
      ctx.fillStyle = '#AAA';
      ctx.beginPath();
      ctx.moveTo(sv.x + sv.w / 2 - 12, sv.y + 30);
      ctx.lineTo(sv.x + sv.w / 2 + 12, sv.y + 30);
      ctx.lineTo(sv.x + sv.w / 2 + 8, sv.y + 40);
      ctx.lineTo(sv.x + sv.w / 2 - 8, sv.y + 40);
      ctx.closePath();
      ctx.fill();
    }

    _drawPlantIcon(ctx, type, cx, cy, r) {
      const def = PD[type];
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const label = { sunflower: '花', potatomine: '雷', wallnut: '果', repeater: '双', snowpea: '冰', cherrybomb: '炸', gloomshroom: '菇' };
      ctx.fillText(label[type] || '?', cx, cy + 4);
    }

    _drawBanner(ctx) {
      if (this._bannerTimer <= 0) return;
      const alpha = Math.min(1, this._bannerTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, C.CANVAS_H / 2 - 40, C.CANVAS_W, 80);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this._bannerText, C.CANVAS_W / 2, C.CANVAS_H / 2 + 12);
      ctx.restore();
    }

    _drawFloatingTexts(ctx) {
      for (const t of this._floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.fillStyle = t.color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }
    }
  }

  window.UIManager = UIManager;
})();
