// ============================================================
//  BOMBMAN - 炸弹人游戏
// ============================================================

// --- roundRect polyfill ---
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        this.beginPath();
        this.moveTo(x + r[0], y);
        this.lineTo(x + w - r[1], y);
        this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
        this.lineTo(x + w, y + h - r[2]);
        this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
        this.lineTo(x + r[3], y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
        this.lineTo(x, y + r[0]);
        this.quadraticCurveTo(x, y, x + r[0], y);
        this.closePath();
        return this;
    };
}

// ============================================================
//  CONSTANTS
// ============================================================
const TILE = 48;
const COLS = 15;
const ROWS = 13;
const W = COLS * TILE;   // 720
const H = ROWS * TILE;   // 624

const EMPTY = 0;
const WALL  = 1;  // indestructible
const BRICK = 2;  // destructible

const BOMB_TIMER       = 180;  // 3s @60fps
const EXPLOSION_DUR    = 28;   // ~0.5s
const INVINC_TIME      = 120;  // 2s
const BOMB_PASSABLE    = 24;   // frames bomb is walkable after placing
const COLLIDE_OFFSET   = 6;
const COLLIDE_SIZE     = 36;
const MAX_LEVEL        = 5;

// ============================================================
//  GLOBALS
// ============================================================
let canvas, ctx;
let gameState = 'menu';  // menu | playing | paused | gameover | win | transition
let level = 1;
let score = 0;
let lives = 3;
let map = [];
let player;
let enemies = [];
let bombs = [];
let explosions = [];
let powerups = [];
let particles = [];
let keys = {};
let keysPressed = {};
let shakeTime = 0;
let shakeMag = 0;
let frameCount = 0;
let audioCtx = null;
let levelCompleteTimer = 0;

// ============================================================
//  AUDIO
// ============================================================
function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}

function playSound(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    switch (type) {
        case 'place':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now); osc.stop(now + 0.1);
            break;
        case 'explode':
            // noise burst
            const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
            const src = audioCtx.createBufferSource();
            src.buffer = buf;
            const ng = audioCtx.createGain();
            ng.gain.setValueAtTime(0.25, now);
            ng.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            src.connect(ng); ng.connect(audioCtx.destination);
            src.start(now);
            return;
        case 'powerup':
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(660, now + 0.08);
            osc.frequency.setValueAtTime(880, now + 0.16);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now); osc.stop(now + 0.25);
            break;
        case 'hurt':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
            break;
        case 'enemydie':
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
            break;
        case 'levelclear':
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0.002, now + i * 0.12);
                g.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.15);
                o.connect(g); g.connect(audioCtx.destination);
                o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.2);
            });
            break;
    }
}

// ============================================================
//  UTILITY
// ============================================================
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

function colFromX(x) { return Math.floor((x + TILE / 2) / TILE); }
function rowFromY(y) { return Math.floor((y + TILE / 2) / TILE); }

// ============================================================
//  MAP GENERATION
// ============================================================
function generateMap(lvl) {
    map = [];
    for (let r = 0; r < ROWS; r++) {
        map[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
                map[r][c] = WALL;
            } else if (r % 2 === 0 && c % 2 === 0) {
                map[r][c] = WALL;
            } else {
                map[r][c] = EMPTY;
            }
        }
    }
    // randomly place bricks
    const density = 0.55 + lvl * 0.03;
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (map[r][c] !== EMPTY) continue;
            // keep player start area clear
            if (r <= 2 && c <= 2) continue;
            if (Math.random() < density) {
                map[r][c] = BRICK;
            }
        }
    }
}

// ============================================================
//  PLAYER
// ============================================================
class Player {
    constructor(col, row) {
        this.x = col * TILE;
        this.y = row * TILE;
        this.speed = 2.2;
        this.maxBombs = 1;
        this.bombRange = 1;
        this.alive = true;
        this.invincible = 0;
        this.dir = 'down';
        this.animFrame = 0;
        this.moving = false;
    }

    get col() { return colFromX(this.x); }
    get row() { return rowFromY(this.y); }

    update() {
        if (!this.alive) return;

        let dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dx = -1; this.dir = 'left'; }
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx = 1; this.dir = 'right'; }
        else if (keys['ArrowUp'] || keys['w'] || keys['W']) { dy = -1; this.dir = 'up'; }
        else if (keys['ArrowDown'] || keys['s'] || keys['S']) { dy = 1; this.dir = 'down'; }

        this.moving = (dx !== 0 || dy !== 0);

        if (this.moving) {
            // auto-align perpendicular axis (stronger correction, wider trigger)
            if (dx !== 0) {
                const targetY = Math.round(this.y / TILE) * TILE;
                if (Math.abs(this.y - targetY) < TILE * 0.5) this.y += (targetY - this.y) * 0.5;
            }
            if (dy !== 0) {
                const targetX = Math.round(this.x / TILE) * TILE;
                if (Math.abs(this.x - targetX) < TILE * 0.5) this.x += (targetX - this.x) * 0.5;
            }
            const nx = this.x + dx * this.speed;
            const ny = this.y + dy * this.speed;
            // corner-cutting: shrink collision box on the perpendicular axis
            if (!checkCollision(nx, this.y, true, dx !== 0 ? 6 : 0)) this.x = nx;
            if (!checkCollision(this.x, ny, true, dy !== 0 ? 6 : 0)) this.y = ny;
            this.animFrame++;
        }

        if (this.invincible > 0) this.invincible--;
    }

    placeBomb() {
        if (!this.alive) return;
        const c = this.col, r = this.row;
        if (bombs.some(b => b.col === c && b.row === r)) return;
        const active = bombs.filter(b => b.owner === 'player').length;
        if (active >= this.maxBombs) return;
        bombs.push(new Bomb(c, r, this.bombRange, 'player'));
        playSound('place');
    }

    draw() {
        if (!this.alive) return;
        // flash when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

        const x = this.x, y = this.y;
        const cx = x + TILE / 2;
        const bob = this.moving ? Math.sin(this.animFrame * 0.3) * 2 : 0;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, y + TILE - 4, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // body
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 16 + bob, TILE - 20, TILE - 26, 8);
        ctx.fill();

        // body highlight
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 18 + bob, TILE - 24, 6, 4);
        ctx.fill();

        // head
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(cx, y + 14 + bob, 11, 0, Math.PI * 2);
        ctx.fill();

        // helmet stripe
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(cx, y + 10 + bob, 11, Math.PI, Math.PI * 2);
        ctx.fill();

        // eyes
        ctx.fillStyle = '#1a1a2e';
        let ex = 0, ey = 0;
        if (this.dir === 'left') ex = -3;
        else if (this.dir === 'right') ex = 3;
        else if (this.dir === 'up') ey = -2;
        else if (this.dir === 'down') ey = 1;
        ctx.beginPath();
        ctx.arc(cx - 4 + ex, y + 14 + bob + ey, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 4 + ex, y + 14 + bob + ey, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // feet
        ctx.fillStyle = '#1e40af';
        const footOff = this.moving ? Math.sin(this.animFrame * 0.3) * 3 : 0;
        ctx.fillRect(x + 12, y + TILE - 8 + bob + footOff, 8, 5);
        ctx.fillRect(x + TILE - 20, y + TILE - 8 + bob - footOff, 8, 5);
    }
}

// ============================================================
//  ENEMY
// ============================================================
class Enemy {
    constructor(col, row, type) {
        this.x = col * TILE;
        this.y = row * TILE;
        this.type = type;
        this.alive = true;
        this.deathTimer = 0;
        this.animFrame = Math.floor(Math.random() * 100);
        this.dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];

        if (type === 'walker') { this.speed = 1.2; this.color = '#e74c3c'; }
        else if (type === 'chaser') { this.speed = 1.4; this.color = '#9b59b6'; }
        else if (type === 'fast') { this.speed = 2.0; this.color = '#2ecc71'; }
    }

    get col() { return colFromX(this.x); }
    get row() { return rowFromY(this.y); }

    update() {
        if (!this.alive) { this.deathTimer++; return; }

        const cx = this.col * TILE;
        const cy = this.row * TILE;
        const atCenter = Math.abs(this.x - cx) < 0.5 && Math.abs(this.y - cy) < 0.5;

        if (atCenter) {
            this.x = cx; this.y = cy;
            this.pickDirection();
        }

        const [dx, dy] = this.dirVec();
        const nx = this.x + dx * this.speed;
        const ny = this.y + dy * this.speed;

        if (!checkCollision(nx, ny, false)) {
            this.x = nx; this.y = ny;
        } else {
            this.pickDirection();
        }
        this.animFrame++;
    }

    pickDirection() {
        const dirs = ['up', 'down', 'left', 'right'];
        const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const avail = dirs.filter(d => {
            const [vx, vy] = this.dirVec(d);
            return !checkCollision(this.x + vx * TILE, this.y + vy * TILE, false);
        });
        if (avail.length === 0) return;

        if (this.type === 'chaser' && player && player.alive) {
            const pc = player.col, pr = player.row;
            const ec = this.col, er = this.row;
            const pref = [];
            if (pc > ec) pref.push('right');
            if (pc < ec) pref.push('left');
            if (pr > er) pref.push('down');
            if (pr < er) pref.push('up');
            for (const d of pref) {
                if (avail.includes(d)) { this.dir = d; return; }
            }
        }

        // avoid reversing unless dead-end
        let choices = avail.filter(d => d !== opp[this.dir]);
        if (choices.length === 0) choices = avail;
        // 70% keep direction if available
        if (avail.includes(this.dir) && Math.random() < 0.5) return;
        this.dir = choices[Math.floor(Math.random() * choices.length)];
    }

    dirVec(d) {
        d = d || this.dir;
        switch (d) {
            case 'up': return [0, -1];
            case 'down': return [0, 1];
            case 'left': return [-1, 0];
            case 'right': return [1, 0];
            default: return [0, 0];
        }
    }

    draw() {
        const x = this.x, y = this.y;
        const cx = x + TILE / 2;

        if (!this.alive) {
            // death animation - shrink & fade
            const t = this.deathTimer / 25;
            if (t >= 1) return;
            const s = 1 - t;
            ctx.globalAlpha = 1 - t;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(cx, y + TILE / 2, TILE * 0.32 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return;
        }

        const bounce = Math.sin(this.animFrame * 0.18) * 3;
        const cy = y + TILE / 2 + bounce;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, y + TILE - 4, 15, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();

        // body shade
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(cx, cy + 4, 16, 0.2, Math.PI - 0.2);
        ctx.fill();

        // eyes white
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 3, 5, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // pupils (look in movement direction)
        const [pdx, pdy] = this.dirVec();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(cx - 6 + pdx * 2, cy - 3 + pdy * 2, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 6 + pdx * 2, cy - 3 + pdy * 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // mouth
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy + 5, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // feet
        ctx.fillStyle = this.color;
        const fo = Math.sin(this.animFrame * 0.3) * 3;
        ctx.fillRect(cx - 10, y + TILE - 8 + fo, 7, 5);
        ctx.fillRect(cx + 3, y + TILE - 8 - fo, 7, 5);
    }
}

// ============================================================
//  BOMB
// ============================================================
class Bomb {
    constructor(col, row, range, owner) {
        this.col = col;
        this.row = row;
        this.range = range;
        this.owner = owner;
        this.timer = BOMB_TIMER;
        this.passable = true;
        this.exploded = false;
        this.animFrame = 0;
    }

    update() {
        this.timer--;
        this.animFrame++;
        
        // Once the player walks off the bomb tile, make it solid
        if (this.passable && player) {
            const pbx = player.x + COLLIDE_OFFSET;
            const pby = player.y + COLLIDE_OFFSET;
            const bx2 = this.col * TILE;
            const by2 = this.row * TILE;
            if (pbx >= bx2 + TILE || pbx + COLLIDE_SIZE <= bx2 ||
                pby >= by2 + TILE || pby + COLLIDE_SIZE <= by2) {
                this.passable = false;
            }
        }
        if (this.timer <= 0 && !this.exploded) {
            this.exploded = true;
            explodeBomb(this);
        }
    }

    draw() {
        const x = this.col * TILE;
        const y = this.row * TILE;
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;

        // pulsing - grows as timer decreases
        const progress = 1 - this.timer / BOMB_TIMER;
        const pulse = 1 + Math.sin(this.animFrame * 0.25) * 0.08;
        const grow = 1 + progress * 0.25;
        const r = 15 * pulse * grow;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, y + TILE - 5, r * 0.9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // body
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx, cy + 2, r, 0, Math.PI * 2);
        ctx.fill();

        // highlight
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(cx - r * 0.35, cy - r * 0.35 + 2, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // fuse
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r + 2);
        ctx.quadraticCurveTo(cx + 6, cy - r - 6, cx + 10, cy - r - 12);
        ctx.stroke();

        // spark
        const sparkR = 2 + Math.random() * 3;
        const sparkHue = 30 + Math.random() * 30;
        ctx.fillStyle = `hsl(${sparkHue},100%,65%)`;
        ctx.beginPath();
        ctx.arc(cx + 10 + (Math.random() - 0.5) * 4, cy - r - 12, sparkR, 0, Math.PI * 2);
        ctx.fill();
        // spark glow
        ctx.fillStyle = `hsla(${sparkHue},100%,65%,0.3)`;
        ctx.beginPath();
        ctx.arc(cx + 10, cy - r - 12, sparkR * 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
//  EXPLOSION
// ============================================================
class Explosion {
    constructor(col, row, type) {
        this.col = col;
        this.row = row;
        this.type = type; // center | up | down | left | right
        this.timer = EXPLOSION_DUR;
        this.animFrame = 0;
    }

    update() {
        this.timer--;
        this.animFrame++;
    }

    draw() {
        const x = this.col * TILE;
        const y = this.row * TILE;
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;
        const prog = this.timer / EXPLOSION_DUR;
        const flicker = 0.85 + Math.sin(this.animFrame * 0.6) * 0.15;
        const alpha = prog * flicker;

        ctx.globalAlpha = alpha;

        // radial gradient
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE * 0.55);
        if (this.type === 'center') {
            grad.addColorStop(0, '#fffde7');
            grad.addColorStop(0.3, '#ffeb3b');
            grad.addColorStop(0.6, '#ff9800');
            grad.addColorStop(1, '#e65100');
        } else {
            grad.addColorStop(0, '#ffeb3b');
            grad.addColorStop(0.5, '#ff9800');
            grad.addColorStop(1, '#e65100');
        }
        ctx.fillStyle = grad;

        if (this.type === 'center') {
            ctx.beginPath();
            ctx.arc(cx, cy, TILE * 0.42, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // arm segments
            const w = TILE * 0.36;
            let rx = x, ry = y, rw = TILE, rh = TILE;
            if (this.type === 'left') { rx = x; ry = cy - w / 2; rw = TILE / 2 + 4; rh = w; }
            else if (this.type === 'right') { rx = cx - 4; ry = cy - w / 2; rw = TILE / 2 + 4; rh = w; }
            else if (this.type === 'up') { rx = cx - w / 2; ry = y; rw = w; rh = TILE / 2 + 4; }
            else if (this.type === 'down') { rx = cx - w / 2; ry = cy - 4; rw = w; rh = TILE / 2 + 4; }
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, 6);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

// ============================================================
//  POWERUP
// ============================================================
class PowerUp {
    constructor(col, row, type) {
        this.col = col;
        this.row = row;
        this.type = type; // bomb | fire | speed | life
        this.animFrame = 0;
    }

    update() { this.animFrame++; }

    draw() {
        const x = this.col * TILE;
        const y = this.row * TILE;
        const cx = x + TILE / 2;
        const cy = y + TILE / 2;
        const float = Math.sin(this.animFrame * 0.1) * 3;

        const colors = {
            bomb: '#e74c3c',
            fire: '#ff9800',
            speed: '#2ecc71',
            life: '#e91e63'
        };
        const color = colors[this.type];

        // glow
        ctx.fillStyle = color + '30';
        ctx.beginPath();
        ctx.arc(cx, cy + float, 20, 0, Math.PI * 2);
        ctx.fill();

        // outer
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy + float, 14, 0, Math.PI * 2);
        ctx.fill();

        // inner
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy + float, 10, 0, Math.PI * 2);
        ctx.fill();

        // symbol
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const sym = { bomb: '✚', fire: '🔥', speed: '»', life: '♥' };
        ctx.fillText(sym[this.type], cx, cy + float + 1);
    }
}

// ============================================================
//  PARTICLE
// ============================================================
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 4;
        this.vx = Math.cos(ang) * spd;
        this.vy = Math.sin(ang) * spd - 1;
        this.life = 25 + Math.random() * 20;
        this.maxLife = this.life;
        this.gravity = 0.15;

        switch (type) {
            case 'brick':
                this.color = '#c97f4a';
                this.size = 3 + Math.random() * 4;
                break;
            case 'explosion':
                this.color = `hsl(${30 + Math.random() * 30},100%,${55 + Math.random() * 20}%)`;
                this.size = 3 + Math.random() * 5;
                break;
            case 'enemy':
                this.color = '#e74c3c';
                this.size = 3 + Math.random() * 4;
                break;
            case 'powerup':
                this.color = '#ffeb3b';
                this.size = 2 + Math.random() * 3;
                this.gravity = 0;
                break;
            default:
                this.color = '#fff';
                this.size = 4;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.96;
        this.life--;
    }

    draw() {
        const a = this.life / this.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ============================================================
//  COLLISION
// ============================================================
function checkCollision(x, y, isPlayer = true, pad = 0) {
    // Wall/brick check — padded box allows corner-cutting on perpendicular axis
    const bx = x + COLLIDE_OFFSET + pad;
    const by = y + COLLIDE_OFFSET + pad;
    const bw = COLLIDE_SIZE - pad * 2;
    const bh = COLLIDE_SIZE - pad * 2;

    const sc = Math.floor(bx / TILE);
    const ec = Math.floor((bx + bw - 1) / TILE);
    const sr = Math.floor(by / TILE);
    const er = Math.floor((by + bh - 1) / TILE);

    for (let r = sr; r <= er; r++) {
        for (let c = sc; c <= ec; c++) {
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
            if (map[r][c] === WALL || map[r][c] === BRICK) return true;
        }
    }

    // bombs — always use full-size box (no padding)
    const fbx = x + COLLIDE_OFFSET;
    const fby = y + COLLIDE_OFFSET;
    for (const b of bombs) {
        if (isPlayer && b.passable) continue;
        const bx2 = b.col * TILE;
        const by2 = b.row * TILE;
        if (fbx < bx2 + TILE && fbx + COLLIDE_SIZE > bx2 &&
            fby < by2 + TILE && fby + COLLIDE_SIZE > by2) return true;
    }
    return false;
}

// ============================================================
//  GAME LOGIC
// ============================================================
function explodeBomb(bomb) {
    if (bomb.exploded && bomb._chainProcessed) return;
    bomb._chainProcessed = true;

    // center explosion
    explosions.push(new Explosion(bomb.col, bomb.row, 'center'));

    const dirs = [
        { dx: 0, dy: -1, name: 'up' },
        { dx: 0, dy: 1, name: 'down' },
        { dx: -1, dy: 0, name: 'left' },
        { dx: 1, dy: 0, name: 'right' }
    ];

    for (const dir of dirs) {
        for (let i = 1; i <= bomb.range; i++) {
            const c = bomb.col + dir.dx * i;
            const r = bomb.row + dir.dy * i;
            if (c < 0 || c >= COLS || r < 0 || r >= ROWS) break;
            if (map[r][c] === WALL) break;

            explosions.push(new Explosion(c, r, dir.name));

            // chain reaction
            const other = bombs.find(b => b.col === c && b.row === r && !b.exploded);
            if (other) {
                other.exploded = true;
                other.timer = 0;
                explodeBomb(other);
            }

            // destroy power-ups
            for (let p = powerups.length - 1; p >= 0; p--) {
                if (powerups[p].col === c && powerups[p].row === r) {
                    powerups.splice(p, 1);
                }
            }

            if (map[r][c] === BRICK) {
                destroyBrick(c, r);
                break;
            }
        }
    }

    // particles
    for (let i = 0; i < 16; i++) {
        particles.push(new Particle(bomb.col * TILE + TILE / 2, bomb.row * TILE + TILE / 2, 'explosion'));
    }

    shakeTime = 12;
    shakeMag = 6;
    playSound('explode');
}

function destroyBrick(col, row) {
    if (map[row][col] !== BRICK) return;
    map[row][col] = EMPTY;
    score += 10;
    updateHUD();

    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(col * TILE + TILE / 2, row * TILE + TILE / 2, 'brick'));
    }

    // chance to spawn power-up (life is rarer)
    if (Math.random() < 0.22) {
        const r = Math.random();
        let t;
        if (r < 0.3) t = 'bomb';
        else if (r < 0.6) t = 'fire';
        else if (r < 0.9) t = 'speed';
        else t = 'life';
        powerups.push(new PowerUp(col, row, t));
    }
}

function damagePlayer() {
    if (player.invincible > 0 || !player.alive) return;
    lives--;
    updateHUD();
    playSound('hurt');
    shakeTime = 15;
    shakeMag = 8;

    for (let i = 0; i < 14; i++) {
        particles.push(new Particle(player.x + TILE / 2, player.y + TILE / 2, 'explosion'));
    }

    if (lives <= 0) {
        player.alive = false;
        setTimeout(() => {
            gameState = 'gameover';
            showGameOver();
        }, 800);
    } else {
        player.x = TILE;
        player.y = TILE;
        player.invincible = INVINC_TIME;
    }
}

function killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.deathTimer = 0;
    score += 100;
    updateHUD();
    playSound('enemydie');

    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(enemy.x + TILE / 2, enemy.y + TILE / 2, 'enemy'));
    }

    // check win
    if (enemies.every(e => !e.alive)) {
        gameState = 'transition';
        levelCompleteTimer = 90;
        playSound('levelclear');
    }
}

function checkExplosionDamage() {
    for (const exp of explosions) {
        const ex = exp.col * TILE;
        const ey = exp.row * TILE;

        // player
        if (player.alive && player.invincible === 0) {
            const pbx = player.x + COLLIDE_OFFSET;
            const pby = player.y + COLLIDE_OFFSET;
            if (pbx < ex + TILE && pbx + COLLIDE_SIZE > ex &&
                pby < ey + TILE && pby + COLLIDE_SIZE > ey) {
                damagePlayer();
            }
        }

        // enemies
        for (const en of enemies) {
            if (!en.alive) continue;
            const ebx = en.x + COLLIDE_OFFSET;
            const eby = en.y + COLLIDE_OFFSET;
            if (ebx < ex + TILE && ebx + COLLIDE_SIZE > ex &&
                eby < ey + TILE && eby + COLLIDE_SIZE > ey) {
                killEnemy(en);
            }
        }
    }
}

function checkEnemyCollision() {
    if (!player.alive || player.invincible > 0) return;
    const pbx = player.x + COLLIDE_OFFSET;
    const pby = player.y + COLLIDE_OFFSET;
    for (const en of enemies) {
        if (!en.alive) continue;
        const ebx = en.x + COLLIDE_OFFSET;
        const eby = en.y + COLLIDE_OFFSET;
        if (pbx < ebx + COLLIDE_SIZE && pbx + COLLIDE_SIZE > ebx &&
            pby < eby + COLLIDE_SIZE && pby + COLLIDE_SIZE > eby) {
            damagePlayer();
            return;
        }
    }
}

function checkPowerUpCollection() {
    const pc = player.col, pr = player.row;
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        if (pu.col === pc && pu.row === pr) {
            switch (pu.type) {
                case 'bomb': player.maxBombs = Math.min(player.maxBombs + 1, 8); break;
                case 'fire': player.bombRange = Math.min(player.bombRange + 1, 8); break;
                case 'speed': player.speed = Math.min(player.speed + 0.5, 5); break;
                case 'life': lives = Math.min(lives + 1, 9); break;
            }
            score += 50;
            powerups.splice(i, 1);
            playSound('powerup');
            for (let j = 0; j < 8; j++) {
                particles.push(new Particle(pc * TILE + TILE / 2, pr * TILE + TILE / 2, 'powerup'));
            }
            updateHUD();
        }
    }
}

// ============================================================
//  ENEMY SPAWNING
// ============================================================
function spawnEnemies(lvl) {
    enemies = [];
    const configs = [
        [],
        [{ t: 'walker', n: 3 }],
        [{ t: 'walker', n: 3 }, { t: 'chaser', n: 1 }],
        [{ t: 'walker', n: 2 }, { t: 'chaser', n: 2 }, { t: 'fast', n: 1 }],
        [{ t: 'walker', n: 2 }, { t: 'chaser', n: 2 }, { t: 'fast', n: 2 }],
        [{ t: 'chaser', n: 3 }, { t: 'fast', n: 3 }],
    ];
    const cfg = configs[Math.min(lvl, configs.length - 1)];
    const occupied = [];

    for (const { t, n } of cfg) {
        for (let i = 0; i < n; i++) {
            let c, r, tries = 0;
            do {
                c = 1 + Math.floor(Math.random() * (COLS - 2));
                r = 1 + Math.floor(Math.random() * (ROWS - 2));
                tries++;
            } while (
                (map[r][c] !== EMPTY ||
                 (c <= 3 && r <= 3) ||
                 occupied.some(p => p.c === c && p.r === r)) &&
                tries < 200
            );
            occupied.push({ c, r });
            enemies.push(new Enemy(c, r, t));
        }
    }
}

// ============================================================
//  UPDATE
// ============================================================
function update() {
    frameCount++;

    player.update();
    enemies.forEach(e => e.update());
    bombs.forEach(b => b.update());
    explosions.forEach(e => e.update());
    particles.forEach(p => p.update());

    // cleanup
    bombs = bombs.filter(b => b.timer > 0 || !b.exploded);
    bombs = bombs.filter(b => !b.exploded);
    explosions = explosions.filter(e => e.timer > 0);
    particles = particles.filter(p => p.life > 0);
    enemies = enemies.filter(e => e.alive || e.deathTimer < 25);

    // input: place bomb
    if (keysPressed[' ']) player.placeBomb();

    // collisions
    checkExplosionDamage();
    checkEnemyCollision();
    checkPowerUpCollection();

    // screen shake
    if (shakeTime > 0) shakeTime--;

    // level transition
    if (gameState === 'transition') {
        levelCompleteTimer--;
        if (levelCompleteTimer <= 0) {
            levelComplete();
        }
    }

    keysPressed = {};
}

// ============================================================
//  RENDER
// ============================================================
function render() {
    ctx.save();

    // screen shake
    if (shakeTime > 0) {
        const sx = (Math.random() - 0.5) * shakeMag;
        const sy = (Math.random() - 0.5) * shakeMag;
        ctx.translate(sx, sy);
    }

    // background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    drawFloor();
    drawWallsAndBricks();
    powerups.forEach(p => p.draw());
    bombs.forEach(b => b.draw());
    explosions.forEach(e => e.draw());
    if (player) player.draw();
    enemies.forEach(e => e.draw());
    particles.forEach(p => p.draw());

    ctx.restore();
}

function drawFloor() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (map[r] && (map[r][c] === WALL || map[r][c] === BRICK)) continue;
            const x = c * TILE, y = r * TILE;
            ctx.fillStyle = (r + c) % 2 === 0 ? '#2d6a2d' : '#266026';
            ctx.fillRect(x, y, TILE, TILE);
        }
    }
}

function drawWallsAndBricks() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE, y = r * TILE;
            if (map[r][c] === WALL) {
                // steel wall
                ctx.fillStyle = '#5a5a7a';
                ctx.fillRect(x, y, TILE, TILE);
                // bevel highlights
                ctx.fillStyle = '#7878a0';
                ctx.fillRect(x + 2, y + 2, TILE - 4, 4);
                ctx.fillRect(x + 2, y + 2, 4, TILE - 4);
                // bevel shadows
                ctx.fillStyle = '#3a3a5a';
                ctx.fillRect(x + 2, y + TILE - 6, TILE - 4, 4);
                ctx.fillRect(x + TILE - 6, y + 2, 4, TILE - 4);
                // center rivet
                ctx.fillStyle = '#4a4a6a';
                ctx.beginPath();
                ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#6a6a8a';
                ctx.beginPath();
                ctx.arc(x + TILE / 2 - 1, y + TILE / 2 - 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (map[r][c] === BRICK) {
                // brick wall
                ctx.fillStyle = '#b87333';
                ctx.fillRect(x, y, TILE, TILE);
                // brick pattern
                ctx.strokeStyle = '#8a5424';
                ctx.lineWidth = 2;
                // horizontal lines
                ctx.beginPath();
                ctx.moveTo(x, y + TILE / 3);
                ctx.lineTo(x + TILE, y + TILE / 3);
                ctx.moveTo(x, y + 2 * TILE / 3);
                ctx.lineTo(x + TILE, y + 2 * TILE / 3);
                // vertical line top
                ctx.moveTo(x + TILE / 2, y);
                ctx.lineTo(x + TILE / 2, y + TILE / 3);
                // vertical line bottom (offset)
                ctx.moveTo(x + TILE / 4, y + 2 * TILE / 3);
                ctx.lineTo(x + TILE / 4, y + TILE);
                ctx.moveTo(x + 3 * TILE / 4, y + 2 * TILE / 3);
                ctx.lineTo(x + 3 * TILE / 4, y + TILE);
                ctx.stroke();
                // highlights
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
            }
        }
    }
}

// ============================================================
//  HUD & UI
// ============================================================
function updateHUD() {
    document.getElementById('hud-level').textContent = level;
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-lives').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
    document.getElementById('hud-bombs').textContent = player ? player.maxBombs : 1;
    document.getElementById('hud-range').textContent = player ? player.bombRange : 1;
    document.getElementById('hud-speed').textContent = player ? (player.speed / 2.2).toFixed(1) : 1;
}

function showOverlay(html) {
    const ov = document.getElementById('overlay');
    document.getElementById('overlay-content').innerHTML = html;
    ov.classList.remove('hidden');
}

function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
}

function showMenu() {
    showOverlay(`
        <h1 class="title">BOMBMAN</h1>
        <p class="subtitle">炸弹人</p>
        <div class="instructions">
            <div><span class="key">←→↑↓</span> 移动角色</div>
            <div><span class="key">WASD</span> 移动角色</div>
            <div><span class="key">空格</span> 放置炸弹</div>
            <div><span class="key">P</span> 暂停游戏</div>
            <div style="margin-top:10px;color:#7878aa;">消灭所有敌人即可通关！</div>
            <div style="color:#7878aa;">炸毁砖墙有几率获得道具</div>
        </div>
        <button class="btn" onclick="startGame()">开始游戏</button>
    `);
}

function showGameOver() {
    showOverlay(`
        <h1 class="title" style="color:#e74c3c;text-shadow:0 0 20px #e74c3c,0 0 40px #c0392b,3px 3px 0 #992020;">GAME OVER</h1>
        <p class="subtitle">游戏结束</p>
        <div class="score-display">最终分数: <span class="num">${score}</span></div>
        <button class="btn" onclick="startGame()">重新开始</button>
    `);
}

function showWin() {
    showOverlay(`
        <h1 class="title" style="color:#2ecc71;text-shadow:0 0 20px #2ecc71,0 0 40px #27ae60,3px 3px 0 #1a8a4a;">YOU WIN!</h1>
        <p class="subtitle">恭喜通关！</p>
        <div class="score-display">最终分数: <span class="num">${score}</span></div>
        <button class="btn" onclick="startGame()">再玩一次</button>
    `);
}

function showPause() {
    showOverlay(`
        <h1 class="title" style="font-size:40px;">PAUSED</h1>
        <p class="subtitle">游戏暂停</p>
        <button class="btn" onclick="togglePause()">继续游戏</button>
    `);
}

function showLevelComplete() {
    showOverlay(`
        <h1 class="title" style="color:#2ecc71;font-size:40px;text-shadow:0 0 20px #2ecc71;">LEVEL ${level} CLEAR!</h1>
        <p class="subtitle">关卡完成！准备进入第 ${level + 1} 关...</p>
    `);
}

// ============================================================
//  GAME FLOW
// ============================================================
function startGame() {
    level = 1;
    score = 0;
    lives = 3;
    player = new Player(1, 1);
    initAudio();
    startLevel(1);
}

function startLevel(lvl) {
    level = lvl;
    generateMap(level);
    spawnEnemies(level);
    player.x = TILE;
    player.y = TILE;
    player.alive = true;
    player.invincible = INVINC_TIME;
    bombs = [];
    explosions = [];
    powerups = [];
    particles = [];
    gameState = 'playing';
    hideOverlay();
    updateHUD();
}

function levelComplete() {
    score += 500 * level;
    level++;
    updateHUD();
    if (level > MAX_LEVEL) {
        gameState = 'win';
        showWin();
    } else {
        startLevel(level);
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showPause();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        hideOverlay();
    }
}

// ============================================================
//  INPUT
// ============================================================
window.addEventListener('keydown', (e) => {
    // prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (!keys[e.key]) {
        keysPressed[e.key] = true;
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================================
//  GAME LOOP
// ============================================================
function gameLoop() {
    if (gameState === 'playing' || gameState === 'transition') {
        update();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// ============================================================
//  INIT
// ============================================================
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // init empty map for menu background
    map = [];
    for (let r = 0; r < ROWS; r++) {
        map[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) map[r][c] = WALL;
            else if (r % 2 === 0 && c % 2 === 0) map[r][c] = WALL;
            else map[r][c] = Math.random() < 0.5 ? BRICK : EMPTY;
        }
    }

    showMenu();
    gameLoop();
}

init();
