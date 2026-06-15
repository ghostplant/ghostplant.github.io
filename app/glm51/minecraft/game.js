/**
 * 主游戏逻辑 - 初始化、渲染循环、事件处理
 */

// ====== 全局变量 ======
let world, player, renderer, scene;
let isRunning = false;
let lastTime = 0;
let frameCount = 0;
let fpsTimer = 0;
let currentFPS = 0;

// ====== 初始化 ======
function initGame() {
  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 40, 120);

  // 渲染器
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 光照
  const ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(50, 100, 30);
  scene.add(sunLight);

  // 半球光 - 模拟天空散射
  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.4);
  scene.add(hemiLight);

  // 世界
  world = new World();
  world.generate();
  world.buildAllChunks();
  scene.add(world.meshGroup);

  // 玩家
  player = new Player(world);
  scene.add(player.highlightMesh);

  // 找到合适的出生点
  _findSpawnPoint();

  // 事件监听
  _setupEvents(canvas);

  // 开始循环
  isRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function _findSpawnPoint() {
  const cx = Math.floor(WORLD_SIZE / 2);
  const cz = Math.floor(WORLD_SIZE / 2);

  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    const block = world.getBlock(cx, y, cz);
    if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
      player.position.set(cx + 0.5, y + 2, cz + 0.5);
      return;
    }
  }
  player.position.set(cx + 0.5, 40, cz + 0.5);
}

// ====== 游戏循环 ======
function gameLoop(time) {
  if (!isRunning) return;

  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // FPS 计算
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 1) {
    currentFPS = Math.round(frameCount / fpsTimer);
    document.getElementById('fps-display').textContent = `FPS: ${currentFPS}`;
    frameCount = 0;
    fpsTimer = 0;
  }

  // 更新玩家
  player.update(dt);

  // 重建脏区块
  world.rebuildDirtyChunks();

  // 渲染
  renderer.render(scene, player.camera);

  requestAnimationFrame(gameLoop);
}

// ====== 事件处理 ======
function _setupEvents(canvas) {
  // Pointer Lock
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) {
      // 鼠标解锁 - 显示暂停提示
      _showPauseOverlay();
    } else {
      _hidePauseOverlay();
    }
  });

  // 鼠标移动
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      player.handleMouseMove(e.movementX, e.movementY);
    }
  });

  // 鼠标按键
  document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== canvas) return;

    if (e.button === 0) {
      // 左键 - 破坏方块
      player.breakBlock();
    } else if (e.button === 2) {
      // 右键 - 放置方块
      player.placeBlock();
    }
  });

  // 禁用右键菜单
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // 键盘
  document.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    player.handleKeyDown(e);
  });

  document.addEventListener('keyup', (e) => {
    if (!isRunning) return;
    player.handleKeyUp(e);
  });

  // 滚轮
  document.addEventListener('wheel', (e) => {
    if (document.pointerLockElement !== canvas) return;
    player.handleMouseWheel(e.deltaY);
  });

  // 窗口大小变化
  window.addEventListener('resize', () => {
    if (!player || !renderer) return;
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ====== 暂停覆盖层 ======
function _showPauseOverlay() {
  let overlay = document.getElementById('pause-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.innerHTML = '<span>点击继续游戏</span>';
    overlay.addEventListener('click', () => {
      document.getElementById('game-canvas').requestPointerLock();
    });
    document.getElementById('game-screen').appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function _hidePauseOverlay() {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ====== UI 辅助函数 ======
function updateHotbar(selected) {
  const slots = document.querySelectorAll('.hotbar-slot');
  slots.forEach((slot, i) => {
    slot.classList.toggle('selected', i === selected);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);
}

// ====== 启动 ======
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('menu-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  // 延迟初始化，让DOM更新
  setTimeout(() => {
    initGame();
    // 请求指针锁定
    document.getElementById('game-canvas').requestPointerLock();
    showToast('欢迎来到我的世界！');
  }, 100);
});
