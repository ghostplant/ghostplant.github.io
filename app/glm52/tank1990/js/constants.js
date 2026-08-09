// ============================================================
// Tank 1990 - Game Constants
// ============================================================

// Grid & dimensions
const TILE = 16;              // tile size in pixels
const GRID_W = 26;            // grid width in tiles
const GRID_H = 26;            // grid height in tiles
const PLAY_W = GRID_W * TILE; // play area width  (416)
const PLAY_H = GRID_H * TILE; // play area height (416)
const TANK_SIZE = 32;         // tank size (2x2 tiles)
const BULLET_SIZE = 6;        // bullet size
const DT = 1 / 60;            // fixed timestep

// Speeds
const TANK_SPEED = 2;              // player tank speed (px/step)
const BULLET_SPEED_PLAYER = 5;     // player bullet speed
const BULLET_SPEED_PLAYER_UP = 7;  // upgraded player bullet speed

// Tile types
const T_EMPTY = 0;
const T_BRICK = 1;
const T_STEEL = 2;
const T_WATER = 3;
const T_TREES = 4;
const T_ICE = 5;

// Directions
const DIR_UP = 0;
const DIR_RIGHT = 1;
const DIR_DOWN = 2;
const DIR_LEFT = 3;
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

// Game states
const STATE = {
  MENU: 'menu',
  STAGE_INTRO: 'stageIntro',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  STAGE_CLEAR: 'stageClear',
  WIN: 'win'
};

// Enemy types
const E_BASIC = 0;
const E_FAST = 1;
const E_POWER = 2;
const E_ARMOR = 3;

const ENEMY_STATS = [
  { speed: 1, hp: 1, score: 100, bulletSpeed: 3 }, // basic
  { speed: 2, hp: 1, score: 200, bulletSpeed: 4 }, // fast
  { speed: 1, hp: 1, score: 300, bulletSpeed: 5 }, // power
  { speed: 1, hp: 4, score: 400, bulletSpeed: 3 }  // armor
];

const ENEMY_NAMES = ['普通', '快速', '强力', '装甲'];

// Power-up types
const PU_STAR = 'star';
const PU_BOMB = 'bomb';
const PU_CLOCK = 'clock';
const PU_SHOVEL = 'shovel';
const PU_TANK = 'tank';
const PU_SHIELD = 'shield';
const PU_TYPES = [PU_STAR, PU_BOMB, PU_CLOCK, PU_SHOVEL, PU_TANK, PU_SHIELD];

// Spawn points (pixel coordinates, tank top-left)
const PLAYER_SPAWN = { x: 8 * TILE, y: 24 * TILE };   // (128, 384)
const ENEMY_SPAWNS = [
  { x: 0,            y: 0 },
  { x: 12 * TILE,    y: 0 },
  { x: 24 * TILE,    y: 0 }
];

// Base position (top-left of 2x2 base, in pixels)
const BASE_PX = 12 * TILE;  // 192
const BASE_PY = 24 * TILE;  // 384

// Colors
const COLOR = {
  brick: '#B53120',
  brickDark: '#6B2010',
  brickLight: '#E05040',
  steel: '#ACACAC',
  steelDark: '#7C7C7C',
  steelLight: '#DCDCDC',
  water: '#2038EC',
  waterLight: '#5C94FC',
  trees: '#005800',
  treesLight: '#58D854',
  treesHigh: '#88F088',
  ice: '#D0D8E8',
  iceDark: '#B0B8D0',
  base: '#FCFC54',
  baseDark: '#BC7400'
};

// Tank color schemes
const TANK_COLORS = {
  player:  { body: '#FCBC3C', bodyLight: '#FCFC54', tread: '#885400', treadDark: '#543000', turret: '#FCFC54' },
  basic:   { body: '#9C9C9C', bodyLight: '#BCBCBC', tread: '#5C5C5C', treadDark: '#3C3C3C', turret: '#7C7C7C' },
  fast:    { body: '#FCFCFC', bodyLight: '#FFFFFF', tread: '#8C8C8C', treadDark: '#5C5C5C', turret: '#BCBCBC' },
  power:   { body: '#58D854', bodyLight: '#88F088', tread: '#005800', treadDark: '#003800', turret: '#58A858' },
  armor:   { body: '#BCBCBC', bodyLight: '#DCDCDC', tread: '#5C5C5C', treadDark: '#3C3C3C', turret: '#9C9C9C' },
  carrier: { body: '#FC3030', bodyLight: '#FC6060', tread: '#880000', treadDark: '#440000', turret: '#FC6060' }
};

// Game config
const ENEMIES_PER_LEVEL = 20;
const MAX_ENEMIES_ONSCREEN = 4;
const PLAYER_LIVES = 3;
