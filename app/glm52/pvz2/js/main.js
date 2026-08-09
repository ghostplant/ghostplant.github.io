/**
 * main.js - 游戏入口
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new window.Game(canvas);
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const muteBtn = document.getElementById('muteBtn');

  // 开始按钮
  startBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    game.start();
  });

  // 暂停/继续
  pauseBtn.addEventListener('click', () => {
    if (game.state === 'playing') {
      game.state = 'paused';
      pauseBtn.textContent = '▶';
    } else if (game.state === 'paused') {
      game.state = 'playing';
      pauseBtn.textContent = '⏸';
    }
  });

  // 音效开关
  muteBtn.addEventListener('click', () => {
    game.audio.enabled = !game.audio.enabled;
    muteBtn.textContent = game.audio.enabled ? '🔊' : '🔇';
  });
});
