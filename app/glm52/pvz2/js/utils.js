/**
 * utils.js - 通用工具函数
 */
window.rand = function(min, max) {
  return Math.random() * (max - min) + min;
};

window.randInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

window.pick = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

window.aabb = function(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
};

window.dist2 = function(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
};

window.lerp = function(a, b, t) {
  return a + (b - a) * t;
};

window.clamp = function(v, min, max) {
  return v < min ? min : v > max ? max : v;
};

window.drawCircle = function(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
};

window.roundRect = function(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

window.loadImage = function(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

window.deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};
