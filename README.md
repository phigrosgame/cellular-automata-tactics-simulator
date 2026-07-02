# 終極細胞自動機戰術模擬器
# Ultimate Cellular Automata Tactics Simulator

一個基於康威生命遊戲擴展的即時戰術/生態對抗沙盒遊戲。支援百萬級細胞、GPU加速計算、戰術技能系統、Boss實體AI、基因宏腳本等進階功能。

## 🎮 功能特色

### 階段一：核心對抗機制
- 100×100 二維網格，紅藍陣營對抗
- 生命遊戲規則（孤獨/擁擠死亡 + 同色繁殖 + 衝突判定）
- 滑鼠點擊/拖曳放置細胞

### 階段二：即時數據統計
- 即時數據面板（紅軍/藍軍數量、回合數、FPS）
- 歷史趨勢折線圖（Canvas 自繪）

### 階段三：戰術技能系統
- ☄️ **隕石打擊**：清除半徑5格內所有細胞
- 🧬 **基因強化**：3×3區域20回合內不擁擠死亡
- 🌿 **沼澤地形**：改變繁殖條件
- ⏸️ 暫停/播放 + 1x/2x/5x 加速
- ⏪ **時空回溯**：Undo 50個回合（差異記錄優化）

### 階段四：地形系統
- 牆壁（不可穿透）+ 沼澤（改變繁殖規則）
- 地圖 JSON 序列化/反序列化
- **Web Worker** 非同步計算

### 階段五：Boss 實體 + 宏腳本
- 🐉 **Leviathan**：3×3 Boss，A* 尋路，自動吞噬細胞
- 📝 **基因宏腳本系統**：
  ```
  IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
  ```

### 階段六：極致效能
- **WebGL GPGPU**：GLSL Shader 實現 GPU 平行計算
- **WebGPU**：WGSL Compute Shader（下一代 GPU API）
- Canvas 2D 自動降級方案
- 支援 1000×1000 百萬級細胞

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產構建
npm run build

# 預覽構建結果
npm run preview
```

## 🏗️ 技術架構

```
src/
├── main.ts              # 應用入口
├── Game.ts              # 遊戲主控制器
├── Types.ts             # 類型定義 & 常量
├── engine/
│   ├── Grid.ts          # 網格數據結構（TypedArray）
│   ├── Rules.ts         # 生命遊戲規則
│   └── GameEngine.ts    # 引擎（Worker 協調）
├── workers/
│   └── GameWorker.ts    # Web Worker 異步計算
├── renderer/
│   ├── CanvasRenderer.ts # Canvas 2D 渲染器
│   ├── WebGLRenderer.ts  # WebGL GPGPU 渲染器
│   ├── WebGPURenderer.ts # WebGPU 渲染器
│   └── ChartRenderer.ts  # 折線圖渲染
├── ui/
│   ├── DataPanel.ts     # 數據面板
│   ├── SkillPanel.ts    # 技能面板
│   ├── TimeControlPanel.ts # 時間控制
│   └── MacroPanel.ts    # 宏腳本編輯器
├── skills/
│   └── SkillSystem.ts   # 戰術技能系統
├── state/
│   ├── TimeController.ts # 時間控制 & Undo
│   └── StatsTracker.ts  # 統計追蹤
├── terrain/
│   └── TerrainSystem.ts # 地形管理
├── entities/
│   └── Leviathan.ts     # Boss 實體 (A* 尋路)
├── macro/
│   └── MacroEngine.ts   # 宏腳本解析器
└── styles.css           # 樣式
```

## 🎹 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| Space | 暫停/播放 |
| Ctrl+Z | 時空回溯 (Undo) |
| 1 | 1x 速度 |
| 2 | 2x 速度 |
| 3 | 5x 速度 |

## 📋 巨集腳本語法

```
// 條件: IF <條件> THEN CAST <技能> AT <目標>
// 支援的條件變量:
//   red_cells, blue_cells, red_ratio, blue_ratio
//   tick, meteor_cooldown, gene_boost_cooldown, swamp_cooldown
// 支援的運算子: ==, !=, >, <, >=, <=
// 支援的技能: meteor, gene_boost, swamp
// 支援的目標: highest_density_zone, center

// 範例:
IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
IF red_cells < 500 AND gene_boost_cooldown == 0 THEN CAST gene_boost AT center
```

## 🛠️ 技術棧

- **TypeScript** - 類型安全
- **Vite** - 快速構建
- **HTML5 Canvas 2D** - 主渲染路徑
- **WebGL (GLSL)** - GPGPU 加速
- **WebGPU (WGSL)** - 下一代 GPU 計算
- **Web Worker** - 主線程異步計算

## 📄 License

MIT
