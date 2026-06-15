/**
 * 玩家控制 - 第一人称移动、物理、碰撞检测
 */

class Player {
  constructor(world) {
    this.world = world;

    // 位置和速度
    this.position = new THREE.Vector3(WORLD_SIZE / 2, 40, WORLD_SIZE / 2);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.pitch = 0;  // 上下
    this.yaw = 0;    // 左右

    // 参数
    this.height = 1.7;
    this.eyeHeight = 1.62;
    this.width = 0.6;
    this.speed = 5.5;
    this.flySpeed = 10;
    this.jumpForce = 8;
    this.gravity = -22;
    this.maxFallSpeed = -50;

    // 状态
    this.onGround = false;
    this.flying = false;
    this.selectedSlot = 0;

    // 方块高亮
    this.highlightMesh = null;
    this._createHighlight();

    // 输入
    this.keys = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
  }

  _createHighlight() {
    const geo = new THREE.BoxGeometry(1.005, 1.005, 1.007);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.highlightMesh = new THREE.LineSegments(edges, mat);
    this.highlightMesh.visible = false;
  }

  // 处理键盘输入
  handleKeyDown(e) {
    this.keys[e.code] = true;

    // 数字键选择快捷栏
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      this.selectedSlot = parseInt(e.code.charAt(5)) - 1;
      updateHotbar(this.selectedSlot);
    }

    // E键切换飞行
    if (e.code === 'KeyE') {
      this.flying = !this.flying;
      this.velocity.y = 0;
      showToast(this.flying ? '飞行模式' : '生存模式');
      document.getElementById('mode-display').textContent = '模式: ' + (this.flying ? '飞行' : '生存');
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  handleMouseMove(dx, dy) {
    this.mouseDX += dx;
    this.mouseDY += dy;
  }

  handleMouseWheel(delta) {
    if (delta > 0) {
      this.selectedSlot = (this.selectedSlot + 1) % 9;
    } else {
      this.selectedSlot = (this.selectedSlot + 8) % 9;
    }
    updateHotbar(this.selectedSlot);
  }

  // 更新玩家状态
  update(dt) {
    // 限制dt防止大跳跃
    dt = Math.min(dt, 0.05);

    // 鼠标视角
    const sensitivity = 0.002;
    this.yaw -= this.mouseDX * sensitivity;
    this.pitch -= this.mouseDY * sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    this.mouseDX = 0;
    this.mouseDY = 0;

    // 计算前进方向（水平面）
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // 移动
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyA']) moveDir.sub(right);
    if (this.keys['KeyD']) moveDir.add(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const currentSpeed = this.flying ? this.flySpeed : this.speed;

    if (this.flying) {
      // 飞行模式
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;

      if (this.keys['Space']) {
        this.velocity.y = currentSpeed;
      } else if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
        this.velocity.y = -currentSpeed;
      } else {
        this.velocity.y = 0;
      }
    } else {
      // 生存模式
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;

      // 重力
      this.velocity.y += this.gravity * dt;
      this.velocity.y = Math.max(this.velocity.y, this.maxFallSpeed);

      // 跳跃
      if (this.keys['Space'] && this.onGround) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }
    }

    // 移动并碰撞检测
    this._moveWithCollision(dt);

    // 更新相机
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 更新高亮
    this._updateHighlight();

    // 更新位置显示
    const pos = this.position;
    document.getElementById('pos-display').textContent =
      `位置: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
  }

  _moveWithCollision(dt) {
    // 分轴移动
    const newPos = this.position.clone();
    const hw = this.width / 2;

    // X轴
    newPos.x += this.velocity.x * dt;
    if (this._checkCollision(newPos, hw)) {
      newPos.x = this.position.x;
      this.velocity.x = 0;
    }

    // Z轴
    newPos.z += this.velocity.z * dt;
    if (this._checkCollision(newPos, hw)) {
      newPos.z = this.position.z;
      this.velocity.z = 0;
    }

    // Y轴
    newPos.y += this.velocity.y * dt;
    if (this._checkCollision(newPos, hw)) {
      if (this.velocity.y < 0) {
        // 落地 - 对齐到方块顶部
        newPos.y = Math.floor(this.position.y + this.velocity.y * dt) + 1;
        this.onGround = true;
      } else {
        // 撞天花板
        newPos.y = this.position.y;
      }
      this.velocity.y = 0;
    } else {
      if (!this.flying) {
        this.onGround = false;
      }
    }

    // 世界边界
    newPos.x = Math.max(hw, Math.min(WORLD_SIZE - hw, newPos.x));
    newPos.z = Math.max(hw, Math.min(WORLD_SIZE - hw, newPos.z));
    newPos.y = Math.max(0, newPos.y);

    this.position.copy(newPos);
  }

  _checkCollision(pos, halfWidth) {
    // 检查玩家AABB与方块的碰撞
    const minX = Math.floor(pos.x - halfWidth);
    const maxX = Math.floor(pos.x + halfWidth);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + this.height);
    const minZ = Math.floor(pos.z - halfWidth);
    const maxZ = Math.floor(pos.z + halfWidth);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _updateHighlight() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);

    const hit = this.world.raycast(this.camera.position, dir, 7);
    if (hit) {
      this.highlightMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      this.highlightMesh.visible = true;
      this.targetBlock = hit;
    } else {
      this.highlightMesh.visible = false;
      this.targetBlock = null;
    }
  }

  // 破坏方块
  breakBlock() {
    if (!this.targetBlock) return;
    const { x, y, z, block } = this.targetBlock;
    if (block === BLOCK.BEDROCK) return; // 基岩不可破坏
    this.world.setBlock(x, y, z, BLOCK.AIR);
  }

  // 放置方块
  placeBlock() {
    if (!this.targetBlock) return;
    const { placeX, placeY, placeZ } = this.targetBlock;

    // 检查放置位置是否与玩家重叠
    const hw = this.width / 2;
    const playerMinX = this.position.x - hw;
    const playerMaxX = this.position.x + hw;
    const playerMinY = this.position.y;
    const playerMaxY = this.position.y + this.height;
    const playerMinZ = this.position.z - hw;
    const playerMaxZ = this.position.z + hw;

    if (placeX + 1 > playerMinX && placeX < playerMaxX &&
        placeY + 1 > playerMinY && placeY < playerMaxY &&
        placeZ + 1 > playerMinZ && placeZ < playerMaxZ) {
      return; // 不能放在玩家位置
    }

    // 获取当前选中的方块类型
    const blockTypes = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.WOOD,
                        BLOCK.LEAVES, BLOCK.SAND, BLOCK.WATER, BLOCK.BRICK, BLOCK.SNOW];
    const blockType = blockTypes[this.selectedSlot];

    this.world.setBlock(placeX, placeY, placeZ, blockType);
  }
}
