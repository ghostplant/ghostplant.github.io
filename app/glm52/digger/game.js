// ==========================================
// Digger - 挖金矿游戏 (大地图 + 摄像机 + 变异敌人)
// ==========================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// --- 常量 ---
const COLS = 80;
const ROWS = 60;
const TILE = 32;
const VIEW_W = 960;
const VIEW_H = 640;

const SAND = 0;
const EMPTY = 1;
const GOLD = 2;
const NEST = 3;

const PLAYER_SPEED = 140;
const ENEMY_SPEED = 340;
const ENEMY_SPEED_MUTATED = 200;  // 变异敌人速度(毫秒/格)，更小=更快
const GOLD_WOBBLE_TIME = 2000;
const MAX_ENEMIES = 20;
const TOTAL_GOLD = 40;
const NEST_COUNT = 5;
const ENEMY_SPAWN_MIN = 4000;
const ENEMY_SPAWN_MAX = 7000;
const MUTATE_CHANCE = 0.05;       // 出生时 5% 变异概率
const MUTATE_CHANCE_MOVE = 0.001;  // 移动中每步 1% 变异概率
const MUTATE_CHANCE_BACK = 0;  // 变异敌人 0.1% 概率变回普通

// --- 游戏状态 ---
let grid = [];
let player;
let enemies = [];
let goldBlocks = [];
let particles = [];
let nests = [];
let score = 0;
let lives = 3;
let collectedGold = 0;
let gameState = 'menu';
let lastTime = 0;
let screenShake = 0;
let keys = {};
let playerStartX, playerStartY;
let camera = { x: 0, y: 0 };

// --- 工具函数 ---
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ==========================================
// 地图生成
// ==========================================
function generateMap() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(SAND));

    playerStartX = Math.floor(COLS / 2);
    playerStartY = 0;
    grid[playerStartY][playerStartX] = EMPTY;

    // 主隧道随机游走
    let x = playerStartX, y = playerStartY;
    for (let i = 0; i < 250; i++) {
        let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        let dir = dirs[Math.floor(Math.random() * 4)];
        if (Math.random() < 0.35) dir = [0, 1];
        let nx = x + dir[0], ny = y + dir[1];
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            grid[ny][nx] = EMPTY;
            x = nx; y = ny;
        }
    }

    // 次要隧道
    for (let w = 0; w < 4; w++) {
        let wx = randInt(5, COLS - 6);
        let wy = randInt(5, ROWS - 6);
        grid[wy][wx] = EMPTY;
        for (let i = 0; i < 100; i++) {
            let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            let dir = dirs[Math.floor(Math.random() * 4)];
            let nx = wx + dir[0], ny = wy + dir[1];
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                grid[ny][nx] = EMPTY;
                wx = nx; wy = ny;
            }
        }
    }

    // 巢穴
    nests = [];
    for (let i = 0; i < NEST_COUNT; i++) {
        let nx, ny, attempts = 0;
        do {
            nx = randInt(3, COLS - 4);
            ny = randInt(5, ROWS - 4);
            attempts++;
        } while (grid[ny][nx] !== SAND && attempts < 300);

        if (grid[ny][nx] === SAND) {
            grid[ny][nx] = NEST;
            nests.push({ x: nx, y: ny, spawnTimer: 2500 + Math.random() * 2000 });
            let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            dirs.sort(() => Math.random() - 0.5);
            for (let d = 0; d < 2; d++) {
                let tx = nx + dirs[d][0], ty = ny + dirs[d][1], len = 0;
                while (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS && len < 20) {
                    if (grid[ty][tx] === EMPTY || grid[ty][tx] === NEST) break;
                    grid[ty][tx] = EMPTY;
                    tx += dirs[d][0]; ty += dirs[d][1]; len++;
                }
            }
        }
    }

    // 金矿
    collectedGold = 0;
    let placed = 0, attempts = 0;
    while (placed < TOTAL_GOLD && attempts < 3000) {
        let gx = randInt(1, COLS - 2);
        let gy = randInt(2, ROWS - 1);
        if (grid[gy][gx] === SAND) {
            grid[gy][gx] = GOLD;
            placed++;
        }
        attempts++;
    }

    player = {
        gridX: playerStartX, gridY: playerStartY,
        pixelX: playerStartX * TILE, pixelY: playerStartY * TILE,
        targetX: playerStartX, targetY: playerStartY,
        direction: 'down',
        moving: false, moveProgress: 0,
        alive: true, respawnTimer: 0, invulnerable: 0
    };

    enemies = [];
    goldBlocks = [];
    particles = [];
    score = 0;
    lives = 3;
    updateCamera();
}

// ==========================================
// 摄像机
// ==========================================
function updateCamera() {
    camera.x = player.pixelX - VIEW_W / 2 + TILE / 2;
    camera.y = player.pixelY - VIEW_H / 2 + TILE / 2;
    let maxX = Math.max(0,COLS * TILE - VIEW_W);
    let maxY = Math.max(0,ROWS * TILE - VIEW_H);
    camera.x = clamp(camera.x, 0, maxX);
    camera.y = clamp(camera.y, 0, maxY);
}

// ==========================================
// BFS 寻路 (普通敌人用)
// ==========================================
function bfsPath(startX, startY, endX, endY) {
    if (startX === endX && startY === endY) return [];
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let queue = [{ x: startX, y: startY }];
    visited[startY][startX] = true;
    let found = false;
    while (queue.length > 0) {
        let { x, y } = queue.shift();
        if (x === endX && y === endY) { found = true; break; }
        let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (let [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
                let cell = grid[ny][nx];
                if (cell === EMPTY || cell === NEST) {
                    visited[ny][nx] = true;
                    parent[ny][nx] = { x, y };
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }
    if (!found) return null;
    let path = [];
    let cx = endX, cy = endY;
    while (cx !== startX || cy !== startY) {
        path.unshift({ x: cx, y: cy });
        let p = parent[cy][cx];
        cx = p.x; cy = p.y;
    }
    return path;
}

// ==========================================
// 玩家更新
// ==========================================
function updatePlayer(dt) {
    if (player.invulnerable > 0) player.invulnerable -= dt;

    if (!player.alive) {
        if (player.respawnTimer > 0) {
            player.respawnTimer -= dt;
            if (player.respawnTimer <= 0) {
                grid[playerStartY][playerStartX] = EMPTY;
                goldBlocks = goldBlocks.filter(g =>
                    !(g.gridX === playerStartX && g.gridY === playerStartY && g.state === 'wobbling')
                );
                player.gridX = playerStartX;
                player.gridY = playerStartY;
                player.pixelX = playerStartX * TILE;
                player.pixelY = playerStartY * TILE;
                player.targetX = playerStartX;
                player.targetY = playerStartY;
                player.moving = false;
                player.moveProgress = 0;
                player.alive = true;
                player.invulnerable = 1500;
            }
        }
        return;
    }

    if (player.moving) {
        player.moveProgress += dt / PLAYER_SPEED;
        if (player.moveProgress >= 1) {
            player.moveProgress = 0;
            player.moving = false;
            player.gridX = player.targetX;
            player.gridY = player.targetY;
            player.pixelX = player.gridX * TILE;
            player.pixelY = player.gridY * TILE;
        }
    }

    if (!player.moving) {
        let dx = 0, dy = 0;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) { dy = -1; player.direction = 'up'; }
        else if (keys['ArrowDown'] || keys['s'] || keys['S']) { dy = 1; player.direction = 'down'; }
        else if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dx = -1; player.direction = 'left'; }
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx = 1; player.direction = 'right'; }

        if (dx !== 0 || dy !== 0) {
            let nx = player.gridX + dx;
            let ny = player.gridY + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                let cell = grid[ny][nx];
                if (cell === SAND) {
                    grid[ny][nx] = EMPTY;
                    createParticles(nx * TILE + TILE / 2, ny * TILE + TILE / 2, '#C2A370', 4);
                    player.targetX = nx; player.targetY = ny;
                    player.moving = true; player.moveProgress = 0;
                } else if (cell === EMPTY || cell === NEST) {
                    player.targetX = nx; player.targetY = ny;
                    player.moving = true; player.moveProgress = 0;
                } else if (cell === GOLD) {
                    goldBlocks = goldBlocks.filter(g =>
                        !(g.gridX === nx && g.gridY === ny && g.state === 'wobbling')
                    );
                    grid[ny][nx] = EMPTY;
                    score += 100;
                    collectedGold++;
                    createParticles(nx * TILE + TILE / 2, ny * TILE + TILE / 2, '#FFD700', 14);
                    player.targetX = nx; player.targetY = ny;
                    player.moving = true; player.moveProgress = 0;
                    if (collectedGold >= TOTAL_GOLD) winGame();
                }
            }
        }
    }

    if (player.moving) {
        let t = easeInOutQuad(player.moveProgress);
        player.pixelX = lerp(player.gridX * TILE, player.targetX * TILE, t);
        player.pixelY = lerp(player.gridY * TILE, player.targetY * TILE, t);
    }
}

// ==========================================
// 敌人更新
// ==========================================
function updateEnemy(enemy, dt) {
    if (!enemy.alive) return;

    // 移动中 → 到达目标格
    if (enemy.moving) {
        let spd = enemy.mutated ? ENEMY_SPEED_MUTATED : ENEMY_SPEED;
        enemy.moveProgress += dt / spd;
        if (enemy.moveProgress >= 1) {
            enemy.moveProgress = 0;
            enemy.moving = false;
            enemy.gridX = enemy.targetX;
            enemy.gridY = enemy.targetY;
            enemy.pixelX = enemy.gridX * TILE;
            enemy.pixelY = enemy.gridY * TILE;
            // ★ 移动到达新格时也有概率变异
            if (!enemy.mutated && Math.random() < MUTATE_CHANCE_MOVE) {
                enemy.mutated = true;
            }
            // 变异敌人有0.1%概率变回普通
            if (enemy.mutated && Math.random() < MUTATE_CHANCE_BACK) enemy.mutated = false;
        }
    }

    if (!enemy.moving) {
        // ★ 变异敌人：贪婪寻路，无视沙土和金矿，直冲玩家
        if (enemy.mutated) {
            let dx = player.gridX - enemy.gridX;
            let dy = player.gridY - enemy.gridY;
            let moveX = 0, moveY = 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = Math.sign(dx);
            } else if (Math.abs(dy) > Math.abs(dx)) {
                moveY = Math.sign(dy);
            } else if (dx !== 0) {
                moveX = Math.sign(dx);
            } else if (dy !== 0) {
                moveY = Math.sign(dy);
            }

            if (moveX !== 0 || moveY !== 0) {
                let nx = enemy.gridX + moveX;
                let ny = enemy.gridY + moveY;
                if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                    // 变异敌人经过沙子挖空，金矿保留
                    if (grid[ny][nx] === SAND) grid[ny][nx] = EMPTY;
                    enemy.targetX = nx;
                    enemy.targetY = ny;
                    enemy.moving = true;
                    enemy.moveProgress = 0;
                    if (moveX > 0) enemy.direction = 'right';
                    else if (moveX < 0) enemy.direction = 'left';
                    else if (moveY > 0) enemy.direction = 'down';
                    else enemy.direction = 'up';
                }
            }
        } else {
            // ★ 普通敌人：BFS寻路，只能走空地和巢穴
            enemy.repathTimer -= dt;
            if (enemy.repathTimer <= 0 || enemy.path.length === 0) {
                if (player.alive) {
                    enemy.path = bfsPath(enemy.gridX, enemy.gridY, player.gridX, player.gridY) || [];
                } else {
                    enemy.path = [];
                }
                enemy.repathTimer = 500;
            }

            if (enemy.path.length > 0) {
                let next = enemy.path[0];
                let cell = grid[next.y][next.x];
                if (cell === EMPTY || cell === NEST) {
                    enemy.path.shift();
                    enemy.targetX = next.x;
                    enemy.targetY = next.y;
                    enemy.moving = true;
                    enemy.moveProgress = 0;
                    if (next.x > enemy.gridX) enemy.direction = 'right';
                    else if (next.x < enemy.gridX) enemy.direction = 'left';
                    else if (next.y > enemy.gridY) enemy.direction = 'down';
                    else enemy.direction = 'up';
                } else {
                    enemy.path = [];
                }
            } else {
                // 无路径，随机游走
                let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                dirs.sort(() => Math.random() - 0.5);
                for (let [dx, dy] of dirs) {
                    let nx = enemy.gridX + dx, ny = enemy.gridY + dy;
                    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
                        let c = grid[ny][nx];
                        if (c === EMPTY || c === NEST) {
                            enemy.targetX = nx; enemy.targetY = ny;
                            enemy.moving = true; enemy.moveProgress = 0;
                            if (dx > 0) enemy.direction = 'right';
                            else if (dx < 0) enemy.direction = 'left';
                            else if (dy > 0) enemy.direction = 'down';
                            else enemy.direction = 'up';
                            break;
                        }
                    }
                }
            }
        }
    }

    // 像素插值
    if (enemy.moving) {
        let t = easeInOutQuad(enemy.moveProgress);
        enemy.pixelX = lerp(enemy.gridX * TILE, enemy.targetX * TILE, t);
        enemy.pixelY = lerp(enemy.gridY * TILE, enemy.targetY * TILE, t);
    }
}

// ==========================================
// 敌人生成
// ==========================================
function updateEnemySpawning(dt) {
    let aliveCount = enemies.filter(e => e.alive).length;
    if (aliveCount >= MAX_ENEMIES) return;

    for (let nest of nests) {
        nest.spawnTimer -= dt;
        if (nest.spawnTimer <= 0 && aliveCount < MAX_ENEMIES) {
            enemies.push({
                gridX: nest.x, gridY: nest.y,
                pixelX: nest.x * TILE, pixelY: nest.y * TILE,
                targetX: nest.x, targetY: nest.y,
                direction: 'up',
                moving: false, moveProgress: 0,
                alive: true, path: [], repathTimer: 0,
                mutated: Math.random() < MUTATE_CHANCE  // ★ 5%变异
            });
            nest.spawnTimer = ENEMY_SPAWN_MIN + Math.random() * (ENEMY_SPAWN_MAX - ENEMY_SPAWN_MIN);
            aliveCount++;
        }
    }
    enemies = enemies.filter(e => e.alive);
}

// ==========================================
// 金矿更新 (摇晃 + 坠落)
// ==========================================
function checkGoldStability() {
    for (let y = 0; y < ROWS - 1; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] !== GOLD) continue;
            let alreadyWobbling = goldBlocks.some(g =>
                g.gridX === x && g.gridY === y && g.state === 'wobbling'
            );
            if (alreadyWobbling) continue;
            if (grid[y + 1][x] === EMPTY) {
                let fallingBelow = goldBlocks.some(g =>
                    g.state === 'falling' && g.gridX === x &&
                    Math.floor((g.pixelY + TILE / 2) / TILE) === y + 1
                );
                if (!fallingBelow) {
                    goldBlocks.push({
                        gridX: x, gridY: y,
                        pixelX: x * TILE, pixelY: y * TILE,
                        state: 'wobbling',
                        wobbleTimer: GOLD_WOBBLE_TIME,
                        fallProgress: 0, fallDuration: 150
                    });
                }
            }
        }
    }
}

function updateGold(dt) {
    checkGoldStability();
    for (let i = goldBlocks.length - 1; i >= 0; i--) {
        let g = goldBlocks[i];
        if (g.state === 'wobbling') {
            g.wobbleTimer -= dt;
            if (g.wobbleTimer <= 0) {
                g.state = 'falling';
                grid[g.gridY][g.gridX] = EMPTY;
                g.fallProgress = 0;
                g.fallDuration = 150;
            }
        } else if (g.state === 'falling') {
            g.fallProgress += dt / g.fallDuration;
            if (g.fallProgress >= 1) {
                g.gridY++;
                g.fallProgress = 0;
                g.fallDuration = Math.max(50, g.fallDuration * 0.85);
                let col = g.gridX, row = g.gridY;
                if (player.alive) {
                    let pCol = Math.floor((player.pixelX + TILE / 2) / TILE);
                    let pRow = Math.floor((player.pixelY + TILE / 2) / TILE);
                    if (pCol === col && pRow === row) killPlayer();
                }
                for (let enemy of enemies) {
                    if (!enemy.alive) continue;
                    let eCol = Math.floor((enemy.pixelX + TILE / 2) / TILE);
                    let eRow = Math.floor((enemy.pixelY + TILE / 2) / TILE);
                    if (eCol === col && eRow === row) {
                        enemy.alive = false;
                        score += 250;
                        createParticles(enemy.pixelX + TILE / 2, enemy.pixelY + TILE / 2, '#DC143C', 18);
                    }
                }
                let belowRow = row + 1;
                let shouldStop = belowRow >= ROWS || grid[belowRow][col] === SAND || grid[belowRow][col] === GOLD;
                if (!shouldStop) {
                    let fallingBelow = goldBlocks.some(og =>
                        og !== g && og.state === 'falling' && og.gridX === col &&
                        Math.floor((og.pixelY + TILE / 2) / TILE) === belowRow
                    );
                    if (fallingBelow) shouldStop = true;
                }
                if (shouldStop) {
                    g.pixelY = row * TILE;
                    if (player.alive && player.gridX === col && player.gridY === row) {
                        score += 100; collectedGold++;
                        createParticles(col * TILE + TILE / 2, row * TILE + TILE / 2, '#FFD700', 14);
                        if (collectedGold >= TOTAL_GOLD) winGame();
                    } else {
                        grid[row][col] = GOLD;
                    }
                    goldBlocks.splice(i, 1);
                    screenShake = 8;
                    createParticles(col * TILE + TILE / 2, row * TILE + TILE / 2, '#FFD700', 6);
                } else {
                    g.pixelY = g.gridY * TILE;
                }
            } else {
                g.pixelY = g.gridY * TILE + g.fallProgress * TILE;
                let col = g.gridX, row = Math.floor((g.pixelY + TILE / 2) / TILE);
                if (player.alive) {
                    let pCol = Math.floor((player.pixelX + TILE / 2) / TILE);
                    let pRow = Math.floor((player.pixelY + TILE / 2) / TILE);
                    if (pCol === col && pRow === row) killPlayer();
                }
                for (let enemy of enemies) {
                    if (!enemy.alive) continue;
                    let eCol = Math.floor((enemy.pixelX + TILE / 2) / TILE);
                    let eRow = Math.floor((enemy.pixelY + TILE / 2) / TILE);
                    if (eCol === col && eRow === row) {
                        enemy.alive = false;
                        score += 250;
                        createParticles(enemy.pixelX + TILE / 2, enemy.pixelY + TILE / 2, '#DC143C', 18);
                    }
                }
            }
        }
    }
}

// ==========================================
// 碰撞检测
// ==========================================
function checkEnemyPlayerCollision() {
    if (!player.alive || player.invulnerable > 0) return;
    let pCol = Math.floor((player.pixelX + TILE / 2) / TILE);
    let pRow = Math.floor((player.pixelY + TILE / 2) / TILE);
    for (let enemy of enemies) {
        if (!enemy.alive) continue;
        let eCol = Math.floor((enemy.pixelX + TILE / 2) / TILE);
        let eRow = Math.floor((enemy.pixelY + TILE / 2) / TILE);
        if (eCol === pCol && eRow === pRow) { killPlayer(); return; }
    }
}

function killPlayer() {
    if (!player.alive || player.invulnerable > 0) return;
    player.alive = false;
    lives--;
    createParticles(player.pixelX + TILE / 2, player.pixelY + TILE / 2, '#4169E1', 24);
    if (lives <= 0) gameOver();
    else player.respawnTimer = 1500;
}

function gameOver() {
    gameState = 'gameover';
    showOverlay('gameover');
    document.getElementById('final-score').textContent = score;
}

function winGame() {
    gameState = 'win';
    showOverlay('win');
    document.getElementById('win-score').textContent = score;
}

function showOverlay(which) {
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameover').classList.add('hidden');
    document.getElementById('win').classList.add('hidden');
    document.getElementById(which).classList.remove('hidden');
}

function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
}

// ==========================================
// 粒子系统
// ==========================================
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = 40 + Math.random() * 140;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 40,
            life: 1, color: color,
            size: 2 + Math.random() * 3
        });
    }
}

function updateParticles(dt) {
    let dts = dt / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dts;
        p.y += p.vy * dts;
        p.vy += 280 * dts;
        p.life -= dts * 1.5;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ==========================================
// 渲染
// ==========================================
function render() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();

    let shakeX = 0, shakeY = 0;
    if (screenShake > 0.1) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.85;
    } else { screenShake = 0; }

    ctx.translate(-Math.round(camera.x + shakeX), -Math.round(camera.y + shakeY));

    let startCol = Math.max(0, Math.floor(camera.x / TILE));
    let endCol = Math.min(COLS, Math.ceil((camera.x + VIEW_W) / TILE));
    let startRow = Math.max(0, Math.floor(camera.y / TILE));
    let endRow = Math.min(ROWS, Math.ceil((camera.y + VIEW_H) / TILE));

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            let cell = grid[y][x];
            let px = x * TILE, py = y * TILE;
            if (cell === SAND) drawSand(px, py, x, y);
            else if (cell === EMPTY) drawEmpty(px, py);
            else if (cell === GOLD) drawGold(px, py);
            else if (cell === NEST) drawNest(px, py);
        }
    }

    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, COLS * TILE, ROWS * TILE);

    for (let g of goldBlocks) {
        if (g.pixelX + TILE < camera.x || g.pixelX > camera.x + VIEW_W ||
            g.pixelY + TILE < camera.y || g.pixelY > camera.y + VIEW_H) continue;
        if (g.state === 'wobbling') {
            let intensity = 1 - (g.wobbleTimer / GOLD_WOBBLE_TIME);
            let shakeSpeed = 60 - intensity * 35;
            let shakeAmount = 2 + intensity * 5;
            let shake = Math.sin(Date.now() / shakeSpeed) * shakeAmount;
            drawGold(g.pixelX + shake, g.pixelY);
            if (g.wobbleTimer < 1000) {
                let alpha = Math.abs(Math.sin(Date.now() / 80)) * 0.45;
                ctx.fillStyle = `rgba(255, 40, 40, ${alpha})`;
                ctx.fillRect(g.pixelX, g.pixelY, TILE, TILE);
            }
        } else if (g.state === 'falling') {
            drawGold(g.pixelX, g.pixelY);
        }
    }

    for (let enemy of enemies) {
        if (enemy.alive) drawEnemy(enemy.pixelX, enemy.pixelY, enemy.mutated);
    }

    if (player.alive) drawPlayer(player.pixelX, player.pixelY);

    for (let p of particles) {
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    drawMinimap();

    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
    document.getElementById('gold-count').textContent = `${collectedGold}/${TOTAL_GOLD}`;
}

// ==========================================
// 小地图
// ==========================================
function drawMinimap() {
    let mmW = 160, mmH = 120;
    let mmX = VIEW_W - mmW - 10;
    let mmY = 10;
    let tw = mmW / COLS, th = mmH / ROWS;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(mmX, mmY, mmW, mmH);

    ctx.fillStyle = '#3a3020';
    for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
            if (grid[y][x] === EMPTY)
                ctx.fillRect(mmX + x * tw, mmY + y * th, tw, th);

    ctx.fillStyle = '#FFD700';
    for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
            if (grid[y][x] === GOLD)
                ctx.fillRect(mmX + x * tw, mmY + y * th, tw, th);

    ctx.fillStyle = '#FF4444';
    for (let nest of nests)
        ctx.fillRect(mmX + nest.x * tw, mmY + nest.y * th, tw + 1, th + 1);

    for (let enemy of enemies) {
        if (enemy.alive) {
            ctx.fillStyle = enemy.mutated ? '#00FF00' : '#FF6464';
            ctx.fillRect(mmX + enemy.gridX * tw, mmY + enemy.gridY * th, tw + 1, th + 1);
        }
    }

    ctx.fillStyle = '#4169E1';
    ctx.fillRect(mmX + player.gridX * tw - 1, mmY + player.gridY * th - 1, tw + 3, th + 3);

    let vx = mmX + (camera.x / TILE) * tw;
    let vy = mmY + (camera.y / TILE) * th;
    let vw = (VIEW_W / TILE) * tw;
    let vh = (VIEW_H / TILE) * th;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(mmX, mmY, mmW, mmH);
}

// ==========================================
// 绘制函数 (世界坐标)
// ==========================================
function drawSand(px, py, gx, gy) {
    ctx.fillStyle = '#C2A370';
    ctx.fillRect(px, py, TILE, TILE);
    let seed = gx * 7 + gy * 13;
    ctx.fillStyle = '#B09560';
    for (let i = 0; i < 3; i++) {
        let dx = (seed + i * 17) % (TILE - 6) + 3;
        let dy = (seed + i * 23) % (TILE - 6) + 3;
        ctx.fillRect(px + dx, py + dy, 3, 3);
    }
    ctx.fillStyle = '#D4B580';
    for (let i = 0; i < 2; i++) {
        let dx = (seed + i * 31 + 5) % (TILE - 6) + 3;
        let dy = (seed + i * 37 + 7) % (TILE - 6) + 3;
        ctx.fillRect(px + dx, py + dy, 2, 2);
    }
    ctx.strokeStyle = '#A08050';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
}

function drawEmpty(px, py) {
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(px, py, TILE, TILE);
}

function drawGold(px, py) {
    let cx = px + TILE / 2, cy = py + TILE / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx, py + 3); ctx.lineTo(px + TILE - 3, cy);
    ctx.lineTo(cx, py + TILE - 3); ctx.lineTo(px + 3, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFEF7F';
    ctx.beginPath();
    ctx.moveTo(cx, py + 6); ctx.lineTo(px + TILE - 9, cy - 3);
    ctx.lineTo(cx - 1, cy); ctx.lineTo(px + 9, cy - 3);
    ctx.closePath(); ctx.fill();
    let sparkle = Math.sin(Date.now() / 250 + cx * 0.1) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.4})`;
    ctx.beginPath();
    ctx.arc(px + TILE * 0.3, py + TILE * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, py + 3); ctx.lineTo(px + TILE - 3, cy);
    ctx.lineTo(cx, py + TILE - 3); ctx.lineTo(px + 3, cy);
    ctx.closePath(); ctx.stroke();
}

function drawNest(px, py) {
    let cx = px + TILE / 2, cy = py + TILE / 2;
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath();
    ctx.arc(cx, cy, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    let pulse = Math.sin(Date.now() / 300) * 0.3 + 0.5;
    ctx.fillStyle = `rgba(200, 50, 50, ${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayer(px, py) {
    let cx = px + TILE / 2, cy = py + TILE / 2;
    let r = TILE / 2 - 3;
    if (player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a4aB1';
    ctx.lineWidth = 2;
    ctx.stroke();
    let eyeOffX = 0, eyeOffY = 0;
    switch (player.direction) {
        case 'up': eyeOffY = -2; break;
        case 'down': eyeOffY = 2; break;
        case 'left': eyeOffX = -2; break;
        case 'right': eyeOffX = 2; break;
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 5 + eyeOffX, cy - 3 + eyeOffY, 2, 0, Math.PI * 2);
    ctx.arc(cx + 5 + eyeOffX, cy - 3 + eyeOffY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

// ★ 变异敌人绘制：绿色身体 + 脉动光晕 + 紫色瞳孔
function drawEnemy(px, py, mutated) {
    let cx = px + TILE / 2, cy = py + TILE / 2;
    let r = TILE / 2 - 3;

    // 变异敌人：绿色脉动光晕
    if (mutated) {
        let pulse = Math.sin(Date.now() / 200) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(0, 255, 0, ${pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // 身体：变异=绿色，普通=红色
    ctx.fillStyle = mutated ? '#00CC00' : '#DC143C';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = mutated ? '#006600' : '#8B0020';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 眼睛
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔：变异=紫色，普通=黑色
    ctx.fillStyle = mutated ? '#CC00CC' : '#000000';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // 愤怒眉毛
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 6);
    ctx.lineTo(cx - 2, cy - 4);
    ctx.moveTo(cx + 8, cy - 6);
    ctx.lineTo(cx + 2, cy - 4);
    ctx.stroke();
}

// ==========================================
// 游戏主循环
// ==========================================
function gameLoop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    let dt = Math.min(50, timestamp - lastTime);
    lastTime = timestamp;
    if (gameState === 'playing') {
        updatePlayer(dt);
        updateEnemySpawning(dt);
        for (let enemy of enemies) updateEnemy(enemy, dt);
        updateGold(dt);
        updateParticles(dt);
        checkEnemyPlayerCollision();
        updateCamera();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// ==========================================
// 输入处理
// ==========================================
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.key === ' ' && (gameState === 'gameover' || gameState === 'win')) startGame();
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// ==========================================
// UI 事件
// ==========================================
function startGame() {
    generateMap();
    gameState = 'playing';
    hideOverlay();
}
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

// ==========================================
// 启动
// ==========================================
generateMap();
requestAnimationFrame(gameLoop);
