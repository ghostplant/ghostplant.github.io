// ============================================================
// Tank 1990 - Sprite Drawing Functions (procedural pixel art)
// ============================================================

// Draw a star shape
function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// Draw a tile
function drawTile(ctx, type, x, y, frame) {
  switch (type) {
    case T_BRICK: drawBrick(ctx, x, y); break;
    case T_STEEL: drawSteel(ctx, x, y); break;
    case T_WATER: drawWater(ctx, x, y, frame); break;
    case T_TREES: drawTrees(ctx, x, y); break;
    case T_ICE: drawIce(ctx, x, y); break;
  }
}

function drawBrick(ctx, x, y) {
  ctx.fillStyle = COLOR.brickDark;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = COLOR.brick;
  // row 1
  ctx.fillRect(x, y, 7, 7);
  ctx.fillRect(x + 8, y, 8, 7);
  // row 2 (offset)
  ctx.fillRect(x, y + 8, 3, 7);
  ctx.fillRect(x + 4, y + 8, 8, 7);
  ctx.fillRect(x + 13, y + 8, 3, 7);
  // highlights
  ctx.fillStyle = COLOR.brickLight;
  ctx.fillRect(x, y, 7, 2);
  ctx.fillRect(x + 8, y, 8, 2);
  ctx.fillRect(x, y + 8, 3, 2);
  ctx.fillRect(x + 4, y + 8, 8, 2);
  ctx.fillRect(x + 13, y + 8, 3, 2);
}

function drawSteel(ctx, x, y) {
  ctx.fillStyle = COLOR.steelDark;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = COLOR.steel;
  ctx.fillRect(x + 1, y + 1, 14, 14);
  ctx.fillStyle = COLOR.steelLight;
  ctx.fillRect(x + 1, y + 1, 14, 1);
  ctx.fillRect(x + 1, y + 1, 1, 14);
  ctx.fillStyle = COLOR.steelDark;
  ctx.fillRect(x + 1, y + 14, 14, 1);
  ctx.fillRect(x + 14, y + 1, 1, 14);
  // bolts
  ctx.fillStyle = '#5C5C5C';
  ctx.fillRect(x + 3, y + 3, 2, 2);
  ctx.fillRect(x + 11, y + 3, 2, 2);
  ctx.fillRect(x + 3, y + 11, 2, 2);
  ctx.fillRect(x + 11, y + 11, 2, 2);
}

function drawWater(ctx, x, y, frame) {
  ctx.fillStyle = COLOR.water;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = COLOR.waterLight;
  const o = frame ? 0 : 3;
  ctx.fillRect(x + 1 + o, y + 2, 5, 1);
  ctx.fillRect(x + 9 + o, y + 2, 4, 1);
  const o2 = frame ? 3 : 0;
  ctx.fillRect(x + 1 + o2, y + 7, 5, 1);
  ctx.fillRect(x + 9 + o2, y + 7, 4, 1);
  ctx.fillRect(x + 1 + o, y + 12, 5, 1);
  ctx.fillRect(x + 9 + o, y + 12, 4, 1);
}

function drawTrees(ctx, x, y) {
  ctx.fillStyle = COLOR.trees;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = COLOR.treesLight;
  ctx.fillRect(x + 1, y + 1, 5, 5);
  ctx.fillRect(x + 9, y + 1, 5, 5);
  ctx.fillRect(x + 5, y + 5, 5, 5);
  ctx.fillRect(x + 1, y + 9, 5, 5);
  ctx.fillRect(x + 9, y + 9, 5, 5);
  ctx.fillStyle = COLOR.treesHigh;
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + 10, y + 2, 2, 2);
  ctx.fillRect(x + 6, y + 6, 2, 2);
  ctx.fillRect(x + 2, y + 10, 2, 2);
  ctx.fillRect(x + 10, y + 10, 2, 2);
}

function drawIce(ctx, x, y) {
  ctx.fillStyle = COLOR.ice;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = COLOR.iceDark;
  ctx.fillRect(x + 2, y + 3, 12, 1);
  ctx.fillRect(x + 2, y + 7, 12, 1);
  ctx.fillRect(x + 2, y + 11, 12, 1);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + 4, y + 5, 3, 1);
  ctx.fillRect(x + 9, y + 9, 3, 1);
}

// Draw a tank (32x32). dir: 0=up, 1=right, 2=down, 3=left
function drawTank(ctx, x, y, dir, colorKey, frame, level, flash) {
  ctx.save();
  ctx.translate(x + 16, y + 16);
  ctx.rotate(dir * Math.PI / 2);
  ctx.translate(-16, -16);

  let c = TANK_COLORS[colorKey] || TANK_COLORS.basic;
  if (flash) {
    c = {
      body: '#FCFC54', bodyLight: '#FFFFFF',
      tread: '#FCFC54', treadDark: '#E0A000', turret: '#FFFFFF'
    };
  }

  // treads
  ctx.fillStyle = c.tread;
  ctx.fillRect(3, 2, 5, 28);
  ctx.fillRect(24, 2, 5, 28);
  // tread segments (animated)
  ctx.fillStyle = c.treadDark;
  const off = frame ? 2 : 0;
  for (let i = 2 + off; i < 30; i += 4) {
    ctx.fillRect(3, i, 5, 1);
    ctx.fillRect(24, i, 5, 1);
  }

  // body
  ctx.fillStyle = c.body;
  ctx.fillRect(9, 5, 14, 24);
  // body highlight
  ctx.fillStyle = c.bodyLight;
  ctx.fillRect(9, 5, 14, 2);
  ctx.fillRect(9, 5, 2, 22);

  // turret
  ctx.fillStyle = c.turret;
  ctx.fillRect(12, 9, 8, 12);

  // cannon
  ctx.fillStyle = c.body;
  if (colorKey === 'player' && level >= 2) {
    // double cannon
    ctx.fillRect(12, 0, 3, 14);
    ctx.fillRect(17, 0, 3, 14);
  } else {
    ctx.fillRect(14, 0, 4, 14);
  }

  // level indicator stars on player tank
  if (colorKey === 'player' && level >= 1) {
    ctx.fillStyle = '#FCFC54';
    if (level >= 3) {
      ctx.fillRect(10, 22, 2, 2);
      ctx.fillRect(20, 22, 2, 2);
      ctx.fillRect(15, 25, 2, 2);
    } else if (level >= 2) {
      ctx.fillRect(11, 23, 2, 2);
      ctx.fillRect(19, 23, 2, 2);
    } else {
      ctx.fillRect(15, 24, 2, 2);
    }
  }

  ctx.restore();
}

// Shield effect
function drawShield(ctx, x, y, frame) {
  ctx.save();
  ctx.strokeStyle = (frame % 2 === 0) ? '#FCFC54' : '#5C94FC';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, 30, 30);
  ctx.strokeStyle = (frame % 2 === 0) ? '#5C94FC' : '#FCFC54';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, 26, 26);
  ctx.restore();
}

// Draw a bullet
function drawBullet(ctx, x, y, dir) {
  ctx.fillStyle = '#FCFCFC';
  ctx.fillRect(x + 1, y + 1, 4, 4);
  ctx.fillStyle = '#FCBC3C';
  if (dir === DIR_UP) ctx.fillRect(x + 2, y, 2, 2);
  else if (dir === DIR_DOWN) ctx.fillRect(x + 2, y + 4, 2, 2);
  else if (dir === DIR_LEFT) ctx.fillRect(x, y + 2, 2, 2);
  else ctx.fillRect(x + 4, y + 2, 2, 2);
}

// Draw the base (eagle emblem)
function drawBase(ctx, x, y, destroyed) {
  if (destroyed) {
    ctx.fillStyle = '#5C5C5C';
    ctx.fillRect(x + 8, y + 10, 6, 6);
    ctx.fillRect(x + 18, y + 14, 6, 6);
    ctx.fillRect(x + 12, y + 20, 5, 5);
    ctx.fillStyle = '#3C3C3C';
    ctx.fillRect(x + 10, y + 12, 2, 2);
    ctx.fillRect(x + 20, y + 16, 2, 2);
    ctx.fillRect(x + 14, y + 22, 2, 2);
    return;
  }
  const c = COLOR.base;
  const cd = COLOR.baseDark;
  // wings (spread)
  ctx.fillStyle = c;
  ctx.fillRect(x + 2, y + 12, 10, 5);
  ctx.fillRect(x + 20, y + 12, 10, 5);
  ctx.fillRect(x + 4, y + 9, 8, 3);
  ctx.fillRect(x + 20, y + 9, 8, 3);
  // body
  ctx.fillRect(x + 12, y + 8, 8, 18);
  // head
  ctx.fillRect(x + 13, y + 4, 6, 6);
  // wing detail
  ctx.fillStyle = cd;
  ctx.fillRect(x + 2, y + 16, 10, 1);
  ctx.fillRect(x + 20, y + 16, 10, 1);
  ctx.fillRect(x + 4, y + 11, 8, 1);
  ctx.fillRect(x + 20, y + 11, 8, 1);
  // beak
  ctx.fillRect(x + 15, y + 9, 2, 2);
  // eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 14, y + 6, 1, 1);
  ctx.fillRect(x + 17, y + 6, 1, 1);
  // feet
  ctx.fillStyle = cd;
  ctx.fillRect(x + 13, y + 26, 2, 2);
  ctx.fillRect(x + 17, y + 26, 2, 2);
}

// Draw a power-up (32x32)
function drawPowerUp(ctx, x, y, type, frame) {
  const c1 = frame ? '#FCFC54' : '#FCBC3C';
  const c2 = frame ? '#FCBC3C' : '#FC9020';
  ctx.fillStyle = c1;
  ctx.fillRect(x, y, 32, 32);
  ctx.fillStyle = c2;
  ctx.fillRect(x, y, 32, 2);
  ctx.fillRect(x, y + 30, 32, 2);
  ctx.fillRect(x, y, 2, 32);
  ctx.fillRect(x + 30, y, 2, 32);
  ctx.fillStyle = '#000';
  const cx = x + 16, cy = y + 16;
  switch (type) {
    case PU_STAR:
      drawStar(ctx, cx, cy, 10, 4, 5, '#000');
      break;
    case PU_BOMB:
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FCFC54';
      ctx.fillRect(cx - 1, y + 6, 2, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 4, cy - 2, 2, 2);
      break;
    case PU_CLOCK:
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 1, cy - 8, 2, 9);
      ctx.fillRect(cx, cy - 1, 7, 2);
      break;
    case PU_SHOVEL:
      ctx.fillRect(cx - 2, y + 6, 4, 12);
      ctx.fillRect(cx - 6, y + 16, 12, 5);
      ctx.fillRect(cx - 4, y + 20, 8, 4);
      break;
    case PU_TANK:
      ctx.fillRect(x + 8, y + 14, 16, 10);
      ctx.fillRect(cx - 2, y + 8, 4, 8);
      ctx.fillRect(x + 5, y + 16, 3, 6);
      ctx.fillRect(x + 24, y + 16, 3, 6);
      ctx.fillStyle = '#FCFC54';
      ctx.fillRect(x + 13, y + 16, 6, 6);
      break;
    case PU_SHIELD:
      ctx.beginPath();
      ctx.moveTo(cx, y + 6);
      ctx.lineTo(x + 24, y + 10);
      ctx.lineTo(x + 24, y + 20);
      ctx.lineTo(cx, y + 28);
      ctx.lineTo(x + 8, y + 20);
      ctx.lineTo(x + 8, y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FCFC54';
      ctx.fillRect(cx - 3, y + 12, 6, 8);
      break;
  }
}

// Draw an explosion
function drawExplosion(ctx, cx, cy, frame, size) {
  const sizes = [size * 0.4, size * 0.8, size * 1.2, size * 0.8];
  const colors = ['#FCFCFC', '#FCFC54', '#FC5830', '#A02000'];
  const idx = Math.min(frame, 3);
  const r = sizes[idx];
  ctx.fillStyle = colors[idx];
  // cross
  ctx.fillRect(cx - r, cy - 2, r * 2, 4);
  ctx.fillRect(cx - 2, cy - r, 4, r * 2);
  // diagonals
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-r * 0.7, -2, r * 1.4, 4);
  ctx.fillRect(-2, -r * 0.7, 4, r * 1.4);
  ctx.restore();
  // center
  if (frame < 2) {
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
  }
}

// Draw spawn effect (tank appearing)
function drawSpawnEffect(ctx, x, y, frame) {
  const cx = x + 16, cy = y + 16;
  const colors = ['#FCFCFC', '#FCFC54', '#FCBC3C', '#FCFCFC', '#FC5830', '#FCFCFC'];
  const c = colors[frame % colors.length];
  const r = 14 - Math.abs(frame - 3) * 3;
  drawStar(ctx, cx, cy, r, r * 0.4, 6, c);
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, 28, 28);
}
