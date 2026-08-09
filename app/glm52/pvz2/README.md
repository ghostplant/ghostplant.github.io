# 🌻 植物大战僵尸 - HTML5 复刻版

一个使用纯 HTML5 Canvas + JavaScript (ES Modules) 实现的植物大战僵尸复刻游戏，无需任何外部资源或依赖。

## 🎮 如何运行

由于使用了 ES Modules，需要通过 HTTP 服务器运行（不能直接双击打开 HTML 文件）：

```bash
# 进入项目目录
cd pvz2

# Python 3
python -m http.server 8080

# 或 Node.js (需安装 http-server)
npx http-server -p 8080
```

然后浏览器打开 `http://localhost:8080`

## 🎯 玩法

1. **收集阳光**：点击天上掉落的阳光 ☀ 或向日葵产生的阳光
2. **种植植物**：点击顶部种子栏选择植物 → 点击草地种植
3. **抵御僵尸**：合理布置植物，阻止僵尸到达左侧房屋
4. **6种植物**：向日葵、豌豆射手、坚果墙、双发射手、寒冰射手、樱桃炸弹
5. **3种僵尸**：普通僵尸、路障僵尸、铁桶僵尸
6. **6波僵尸**：抵御所有波次即可获胜！

## 📁 项目结构

```
pvz2/
├── index.html              # 主页面
├── README.md               # 说明文档
├── css/
│   └── style.css           # 样式表
└── js/
    ├── main.js             # 游戏入口
    ├── config.js           # 全局配置常量
    ├── utils.js            # 通用工具函数
    ├── core/
    │   ├── audio.js        # 音频管理 (Web Audio API)
    │   ├── game.js         # 游戏核心逻辑
    │   ├── grid.js         # 网格/场地管理
    │   ├── input.js        # 输入处理 (鼠标)
    │   ├── ui.js           # 顶部UI栏管理
    │   └── waves.js        # 僵尸波次管理
    ├── entities/
    │   ├── plants.js       # 植物定义
    │   ├── projectiles.js  # 子弹 (豌豆) 定义
    │   ├── suns.js         # 阳光定义
    │   └── zombies.js      # 僵尸定义
    └── render/
        └── renderer.js     # 渲染器 (绘制所有游戏元素)
```

## 🏗️ 架构说明

- **模块化解耦**：每个功能模块独立文件，通过 ES Modules 导入导出
- **实体定义分离**：植物、僵尸、子弹、阳光的定义与逻辑分离
- **渲染与逻辑分离**：`Renderer` 负责绘制，`Game` 负责逻辑更新
- **配置驱动**：所有数值（血量、速度、波次等）集中在 `config.js`
- **零依赖**：不依赖任何外部库或资源，所有图形用 Canvas 绘制，音效用 Web Audio API 合成

## ⌨️ 快捷操作

| 操作 | 说明 |
|------|------|
| 左键点击 | 选择植物 / 收集阳光 / 种植 |
| 右键点击 | 取消当前选择 |
| ⏸ 按钮 | 暂停/继续游戏 |
| 🔊 按钮 | 开关音效 |
