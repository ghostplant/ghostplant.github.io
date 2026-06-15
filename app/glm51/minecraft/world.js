/**
 * 世界管理 - 方块类型、区块生成、网格构建
 */

// ====== 方块类型定义 ======
const BLOCK = {
  AIR:    0,
  GRASS:  1,
  DIRT:   2,
  STONE:  3,
  WOOD:   4,
  LEAVES: 5,
  SAND:   6,
  WATER:  7,
  BRICK:  8,
  SNOW:   9,
  BEDROCK: 10
};

// 方块颜色定义 [top, side, bottom]
const BLOCK_COLORS = {
  [BLOCK.GRASS]:  { top: 0x4a8c2a, side: 0x6b8c42, bottom: 0x8b6914 },
  [BLOCK.DIRT]:   { top: 0x8b6914, side: 0x8b6914, bottom: 0x7a5c10 },
  [BLOCK.STONE]:  { top: 0x888888, side: 0x808080, bottom: 0x777777 },
  [BLOCK.WOOD]:   { top: 0x9c7c4e, side: 0x6b4226, bottom: 0x9c7c4e },
  [BLOCK.LEAVES]: { top: 0x2d7a1e, side: 0x267016, bottom: 0x1f6010 },
  [BLOCK.SAND]:   { top: 0xe8d68c, side: 0xd4c070, bottom: 0xc4b060 },
  [BLOCK.WATER]:  { top: 0x1e64c8, side: 0x1a50a0, bottom: 0x144680 },
  [BLOCK.BRICK]:  { top: 0x964B00, side: 0x8a4200, bottom: 0x7a3a00 },
  [BLOCK.SNOW]:   { top: 0xf0f0f0, side: 0xe0e0e0, bottom: 0xd0d0d0 },
  [BLOCK.BEDROCK]:{ top: 0x333333, side: 0x2a2a2a, bottom: 0x222222 }
};

// 方块名称
const BLOCK_NAMES = {
  [BLOCK.GRASS]:  '草方块',
  [BLOCK.DIRT]:   '泥土',
  [BLOCK.STONE]:  '石头',
  [BLOCK.WOOD]:   '木头',
  [BLOCK.LEAVES]: '树叶',
  [BLOCK.SAND]:   '沙子',
  [BLOCK.WATER]:  '水',
  [BLOCK.BRICK]:  '砖块',
  [BLOCK.SNOW]:   '雪块'
};

// 透明方块
const TRANSPARENT_BLOCKS = [BLOCK.AIR, BLOCK.WATER, BLOCK.LEAVES];

function isTransparent(blockType) {
  return TRANSPARENT_BLOCKS.includes(blockType);
}

// ====== 世界参数 ======
const WORLD_SIZE = 64;      // 世界宽度 (区块坐标)
const CHUNK_SIZE = 16;      // 区块大小
const WORLD_HEIGHT = 64;    // 世界高度
const SEA_LEVEL = 20;       // 海平面高度
const TERRAIN_SCALE = 0.02; // 地形缩放
const TERRAIN_HEIGHT = 18;  // 地形基础高度
const TERRAIN_AMP = 14;     // 地形振幅

// ====== 世界类 ======
class World {
  constructor() {
    // 使用扁平数组存储方块数据
    // world[x][z][y] => 存储为 blocks[x * WORLD_SIZE * WORLD_HEIGHT + z * WORLD_HEIGHT + y]
    this.blocks = new Uint8Array(WORLD_SIZE * WORLD_SIZE * WORLD_HEIGHT);
    this.chunks = {};        // 区块网格缓存
    this.dirtyChunks = {};   // 需要重建的区块
    this.meshGroup = new THREE.Group();
  }

  // 坐标转索引
  _index(x, y, z) {
    return x * WORLD_SIZE * WORLD_HEIGHT + z * WORLD_HEIGHT + y;
  }

  // 获取方块
  getBlock(x, y, z) {
    if (x < 0 || x >= WORLD_SIZE || z < 0 || z >= WORLD_SIZE || y < 0 || y >= WORLD_HEIGHT) {
      return BLOCK.AIR;
    }
    return this.blocks[this._index(x, y, z)];
  }

  // 设置方块
  setBlock(x, y, z, type) {
    if (x < 0 || x >= WORLD_SIZE || z < 0 || z >= WORLD_SIZE || y < 0 || y >= WORLD_HEIGHT) {
      return;
    }
    this.blocks[this._index(x, y, z)] = type;

    // 标记受影响的区块为脏
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    this.dirtyChunks[`${cx},${cz}`] = true;

    // 如果方块在区块边界，也标记相邻区块
    const lx = x % CHUNK_SIZE;
    const lz = z % CHUNK_SIZE;
    if (lx === 0 && cx > 0) this.dirtyChunks[`${cx-1},${cz}`] = true;
    if (lx === CHUNK_SIZE - 1 && cx < WORLD_SIZE / CHUNK_SIZE - 1) this.dirtyChunks[`${cx+1},${cz}`] = true;
    if (lz === 0 && cz > 0) this.dirtyChunks[`${cx},${cz-1}`] = true;
    if (lz === CHUNK_SIZE - 1 && cz < WORLD_SIZE / CHUNK_SIZE - 1) this.dirtyChunks[`${cx},${cz+1}`] = true;
  }

  // 生成地形
  generate() {
    const startTime = performance.now();
    console.log('开始生成世界...');

    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        // 多层噪声生成高度
        const nx = x * TERRAIN_SCALE;
        const nz = z * TERRAIN_SCALE;

        // 基础地形
        let height = fbm(nx, nz, 4, 2.0, 0.5);
        height = (height + 1) / 2; // 归一化到 0-1

        // 山地 - 大尺度噪声
        const mountain = fbm(nx * 0.5, nz * 0.5, 2, 2.0, 0.5);
        const mountainFactor = Math.max(0, mountain) * 0.6;
        height = height * (1 - mountainFactor) + mountainFactor * (height * 1.8);

        // 平坦化低处
        height = Math.pow(height, 1.3);

        const surfaceY = Math.floor(TERRAIN_HEIGHT + height * TERRAIN_AMP);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let blockType = BLOCK.AIR;

          if (y === 0) {
            blockType = BLOCK.BEDROCK;
          } else if (y < surfaceY - 4) {
            blockType = BLOCK.STONE;
          } else if (y < surfaceY) {
            blockType = BLOCK.DIRT;
          } else if (y === surfaceY) {
            if (surfaceY <= SEA_LEVEL) {
              blockType = BLOCK.SAND;
            } else if (surfaceY > 30) {
              blockType = BLOCK.SNOW;
            } else {
              blockType = BLOCK.GRASS;
            }
          } else if (y <= SEA_LEVEL && y > surfaceY) {
            blockType = BLOCK.WATER;
          }

          this.blocks[this._index(x, y, z)] = blockType;
        }
      }
    }

    // 生成树木
    this._generateTrees();

    // 标记所有区块为脏
    for (let cx = 0; cx < WORLD_SIZE / CHUNK_SIZE; cx++) {
      for (let cz = 0; cz < WORLD_SIZE / CHUNK_SIZE; cz++) {
        this.dirtyChunks[`${cx},${cz}`] = true;
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`世界生成完成，耗时 ${elapsed}ms`);
  }

  // 生成树木
  _generateTrees() {
    const treeCount = Math.floor(WORLD_SIZE * WORLD_SIZE * 0.003);

    for (let i = 0; i < treeCount; i++) {
      const tx = Math.floor(Math.random() * (WORLD_SIZE - 6)) + 3;
      const tz = Math.floor(Math.random() * (WORLD_SIZE - 6)) + 3;

      // 找到地面
      let groundY = -1;
      for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        const b = this.getBlock(tx, y, tz);
        if (b === BLOCK.GRASS || b === BLOCK.DIRT) {
          groundY = y;
          break;
        }
      }

      if (groundY < SEA_LEVEL + 1 || groundY > 28) continue;

      // 树干高度
      const trunkHeight = 4 + Math.floor(Math.random() * 3);

      // 放置树干
      for (let y = groundY + 1; y <= groundY + trunkHeight; y++) {
        this.blocks[this._index(tx, y, tz)] = BLOCK.WOOD;
      }

      // 放置树叶
      const leafStart = groundY + trunkHeight - 1;
      const leafEnd = groundY + trunkHeight + 2;
      for (let y = leafStart; y <= leafEnd; y++) {
        const radius = y === leafEnd ? 1 : (y === leafEnd - 1 ? 2 : 2);
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (dx === 0 && dz === 0 && y < leafEnd - 1) continue; // 树干位置跳过
            if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() > 0.5) continue;
            const lx = tx + dx, lz = tz + dz;
            if (lx >= 0 && lx < WORLD_SIZE && lz >= 0 && lz < WORLD_SIZE) {
              if (this.getBlock(lx, y, lz) === BLOCK.AIR) {
                this.blocks[this._index(lx, y, lz)] = BLOCK.LEAVES;
              }
            }
          }
        }
      }
    }
  }

  // 构建区块网格
  buildChunkMesh(cx, cz) {
    const key = `${cx},${cz}`;
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    // 顶点数据
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    // 水面顶点
    const waterPositions = [];
    const waterNormals = [];
    const waterColors = [];
    const waterIndices = [];

    let vertCount = 0;
    let waterVertCount = 0;

    // 六个面定义: 法线, 4个顶点偏移, UV面类型(top/side/bottom)
    const faces = [
      { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], face: 'top' },    // 上
      { dir: [0,-1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], face: 'bottom' },  // 下
      { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], face: 'side' },    // 右
      { dir: [-1,0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], face: 'side' },    // 左
      { dir: [0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], face: 'side' },    // 前
      { dir: [0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], face: 'side' },    // 后
    ];

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const block = this.getBlock(wx, y, wz);
          if (block === BLOCK.AIR) continue;

          const isWater = block === BLOCK.WATER;
          const blockColor = BLOCK_COLORS[block];
          if (!blockColor) continue;

          for (const face of faces) {
            const nx = wx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = wz + face.dir[2];
            const neighbor = this.getBlock(nx, ny, nz);

            // 判断是否需要绘制此面
            let shouldDraw = false;
            if (isWater) {
              // 水面只在相邻空气或透明非水方块时绘制
              shouldDraw = neighbor === BLOCK.AIR || (isTransparent(neighbor) && neighbor !== BLOCK.WATER);
            } else {
              // 实体方块在相邻透明方块时绘制
              shouldDraw = isTransparent(neighbor);
            }

            if (!shouldDraw) continue;

            // 获取面颜色
            let color;
            if (face.face === 'top') color = blockColor.top;
            else if (face.face === 'bottom') color = blockColor.bottom;
            else color = blockColor.side;

            // 简单的环境光遮蔽 - 顶面亮，底面暗
            let shade = 1.0;
            if (face.face === 'top') shade = 1.0;
            else if (face.face === 'bottom') shade = 0.6;
            else {
              // 侧面根据朝向稍有不同
              if (face.dir[0] !== 0) shade = 0.8;
              else shade = 0.85;
            }

            const r = ((color >> 16) & 0xFF) / 255 * shade;
            const g = ((color >> 8) & 0xFF) / 255 * shade;
            const b = (color & 0xFF) / 255 * shade;

            if (isWater) {
              // 水面稍微降低一点
              const waterYOffset = (face.face === 'top') ? -0.1 : 0;

              for (const corner of face.corners) {
                waterPositions.push(wx + corner[0], y + corner[1] + waterYOffset, wz + corner[2]);
                waterNormals.push(face.dir[0], face.dir[1], face.dir[2]);
                waterColors.push(r, g, b);
              }
              waterIndices.push(
                waterVertCount, waterVertCount + 1, waterVertCount + 2,
                waterVertCount, waterVertCount + 2, waterVertCount + 3
              );
              waterVertCount += 4;
            } else {
              for (const corner of face.corners) {
                positions.push(wx + corner[0], y + corner[1], wz + corner[2]);
                normals.push(face.dir[0], face.dir[1], face.dir[2]);
                colors.push(r, g, b);
              }
              indices.push(
                vertCount, vertCount + 1, vertCount + 2,
                vertCount, vertCount + 2, vertCount + 3
              );
              vertCount += 4;
            }
          }
        }
      }
    }

    // 移除旧网格
    if (this.chunks[key]) {
      const old = this.chunks[key];
      if (old.solid) {
        this.meshGroup.remove(old.solid);
        old.solid.geometry.dispose();
        old.solid.material.dispose();
      }
      if (old.water) {
        this.meshGroup.remove(old.water);
        old.water.geometry.dispose();
        old.water.material.dispose();
      }
    }

    const chunkData = {};

    // 创建实体网格
    if (positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);

      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.meshGroup.add(mesh);
      chunkData.solid = mesh;
    }

    // 创建水面网格
    if (waterPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
      geo.setIndex(waterIndices);

      const mat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.meshGroup.add(mesh);
      chunkData.water = mesh;
    }

    this.chunks[key] = chunkData;
    delete this.dirtyChunks[key];
  }

  // 重建所有脏区块
  rebuildDirtyChunks() {
    let count = 0;
    for (const key in this.dirtyChunks) {
      const [cx, cz] = key.split(',').map(Number);
      this.buildChunkMesh(cx, cz);
      count++;
      if (count >= 4) break; // 每帧最多重建4个区块
    }
    return count;
  }

  // 构建所有区块
  buildAllChunks() {
    const chunksX = WORLD_SIZE / CHUNK_SIZE;
    const chunksZ = WORLD_SIZE / CHUNK_SIZE;
    for (let cx = 0; cx < chunksX; cx++) {
      for (let cz = 0; cz < chunksZ; cz++) {
        this.buildChunkMesh(cx, cz);
      }
    }
    this.dirtyChunks = {};
  }

  // 射线检测 - 找到玩家看向的方块
  raycast(origin, direction, maxDist) {
    // DDA 射线步进算法
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;

    let tMaxX = dx !== 0 ? ((dx > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY) : Infinity;
    let tMaxZ = dz !== 0 ? ((dz > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ) : Infinity;

    let prevX = x, prevY = y, prevZ = z;
    let dist = 0;

    for (let i = 0; i < maxDist * 3; i++) {
      const block = this.getBlock(x, y, z);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        return {
          x, y, z,
          block,
          // 放置新方块的位置（上一个空气方块）
          placeX: prevX,
          placeY: prevY,
          placeZ: prevZ
        };
      }

      prevX = x;
      prevY = y;
      prevZ = z;

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
        }
      }

      if (dist > maxDist) break;
    }

    return null;
  }
}
