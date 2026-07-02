// ============================================================
// main.ts - Application entry point
// ============================================================

import { Game, RenderMode } from './Game';
import { DataPanel } from './ui/DataPanel';
import { SkillPanel } from './ui/SkillPanel';
import { TimeControlPanel } from './ui/TimeControlPanel';
import { MacroPanel } from './ui/MacroPanel';
import { CellState, SkillType, DEFAULT_GRID_SIZE, GAME_PRESETS, COLORS } from './Types';
import './styles.css';

class App {
  private game!: Game;
  private dataPanel!: DataPanel;
  private skillPanel!: SkillPanel;
  private timeControl!: TimeControlPanel;
  private macroPanel!: MacroPanel;
  private updateInterval: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    const appRoot = document.getElementById('app')!;
    appRoot.innerHTML = `
      <div class="app-layout">
        <!-- Top toolbar -->
        <div class="toolbar" id="toolbar">
          <div class="toolbar-left">
            <span class="logo">🧬 終極細胞自動機戰術模擬器</span>
          </div>
          <div class="toolbar-center" id="toolbar-center"></div>
          <div class="toolbar-right" id="toolbar-right"></div>
        </div>

        <!-- Main content area -->
        <div class="main-content">
          <!-- Left sidebar -->
          <div class="sidebar sidebar-left" id="sidebar-left">
            <div id="data-panel-container"></div>
            <div id="skill-panel-container"></div>
            <div id="settings-container">
              <div class="panel-section">
                <div class="panel-title">地圖設置</div>
                <div class="setting-row">
                  <label>網格大小</label>
                  <select id="grid-size-select" style="background:#1c2333;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:3px 6px;font-size:12px;">
                    <option value="100">100×100</option>
                    <option value="500">500×500</option>
                    <option value="1000">1000×1000 (GPU)</option>
                  </select>
                </div>
                <div class="setting-row">
                  <label>渲染模式</label>
                  <select id="render-mode-select" style="background:#1c2333;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:3px 6px;font-size:12px;">
                    <option value="canvas2d">Canvas 2D</option>
                    <option value="webgl">WebGL</option>
                    <option value="webgpu">WebGPU</option>
                  </select>
                </div>
                <div class="setting-row">
                  <label>
                    <input type="checkbox" id="leviathan-toggle" /> 
                    召喚 Leviathan Boss
                  </label>
                </div>
                <div class="setting-row">
                  <label>
                    <input type="checkbox" id="grid-lines-toggle" /> 
                    顯示網格線
                  </label>
                </div>
              </div>
              <div class="panel-section">
                <div class="panel-title">地圖序列化</div>
                <button id="export-map-btn" class="small-btn">匯出 JSON</button>
                <button id="import-map-btn" class="small-btn">匯入 JSON</button>
                <textarea id="map-json-input" rows="3" placeholder="貼上 JSON 地圖資料..." style="width:100%;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:4px;font-size:10px;margin-top:4px;resize:vertical;display:none;"></textarea>
              </div>
            </div>
          </div>

          <!-- Canvas area -->
          <div class="canvas-container" id="canvas-container">
            <canvas id="main-canvas"></canvas>
          </div>

          <!-- Right sidebar -->
          <div class="sidebar sidebar-right" id="sidebar-right">
            <div id="macro-panel-container"></div>
            <div class="panel-section">
              <div class="panel-title">歷史趨勢</div>
              <canvas id="chart-canvas" style="width:100%;height:120px;"></canvas>
            </div>
            <div class="panel-section">
              <div class="panel-title">操作說明</div>
              <div class="help-text">
                <p>🖱️ 點擊/拖曳放置細胞</p>
                <p>⌨️ Space: 暫停/播放</p>
                <p>⌨️ Ctrl+Z: 時空回溯</p>
                <p>⌨️ 1/2/3: 切換速度</p>
                <p>🎯 選擇技能後點擊地圖施放</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get canvas elements
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const chartCanvas = document.getElementById('chart-canvas') as HTMLCanvasElement;

    // Size the canvas
    this.resizeCanvas(mainCanvas);

    // Create game
    this.game = new Game(mainCanvas, chartCanvas, DEFAULT_GRID_SIZE);

    // Create UI panels
    this.dataPanel = new DataPanel(document.getElementById('data-panel-container')!);
    this.skillPanel = new SkillPanel(
      document.getElementById('skill-panel-container')!,
      (type) => this.onSkillSelect(type)
    );
    this.timeControl = new TimeControlPanel(
      document.getElementById('toolbar-center')!,
      {
        onPause: () => this.game.togglePause(),
        onSpeedChange: (speed) => this.game.setSpeed(speed),
        onUndo: () => this.game.undo(),
        onReset: () => this.game.reset(),
      }
    );
    this.macroPanel = new MacroPanel(
      document.getElementById('macro-panel-container')!,
      this.game.getMacroEngine()
    );

    // Setup settings handlers
    this.setupSettingsHandlers(mainCanvas);

    // Start the game
    this.game.start();

    // Periodic UI update
    this.updateInterval = window.setInterval(() => this.updateUI(), 100);

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas(mainCanvas);
      this.game.resize(mainCanvas.clientWidth, mainCanvas.clientHeight);
    });
  }

  private resizeCanvas(canvas: HTMLCanvasElement): void {
    const container = document.getElementById('canvas-container');
    if (container) {
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
    }
  }

  private onSkillSelect(type: SkillType): void {
    if (this.game.getSelectedSkill() === type) {
      this.game.selectSkill(null);
    } else {
      this.game.selectSkill(type);
    }
  }

  private setupSettingsHandlers(mainCanvas: HTMLCanvasElement): void {
    // Grid size selector
    const gridSelect = document.getElementById('grid-size-select') as HTMLSelectElement;
    gridSelect.addEventListener('change', () => {
      const size = parseInt(gridSelect.value);
      this.game.setGridSize(size);
      this.resizeCanvas(mainCanvas);
      this.game.resize(mainCanvas.clientWidth, mainCanvas.clientHeight);
    });

    // Render mode selector
    const renderSelect = document.getElementById('render-mode-select') as HTMLSelectElement;
    renderSelect.addEventListener('change', () => {
      this.game.setRenderMode(renderSelect.value as RenderMode);
    });

    // Leviathan toggle
    const levToggle = document.getElementById('leviathan-toggle') as HTMLInputElement;
    levToggle.addEventListener('change', () => {
      this.game.enableLeviathan(levToggle.checked);
    });

    // Grid lines toggle
    const gridLines = document.getElementById('grid-lines-toggle') as HTMLInputElement;

    // Export/Import map
    const exportBtn = document.getElementById('export-map-btn') as HTMLButtonElement;
    const importBtn = document.getElementById('import-map-btn') as HTMLButtonElement;
    const jsonInput = document.getElementById('map-json-input') as HTMLTextAreaElement;

    exportBtn.addEventListener('click', () => {
      const json = this.game.exportMap();
      jsonInput.value = json;
      jsonInput.style.display = 'block';
    });

    importBtn.addEventListener('click', () => {
      jsonInput.style.display = jsonInput.style.display === 'none' ? 'block' : 'none';
    });

    jsonInput.addEventListener('change', () => {
      if (jsonInput.value.trim()) {
        const success = this.game.importMap(jsonInput.value);
        if (success) {
          importBtn.textContent = '✓ 已匯入';
        } else {
          importBtn.textContent = '✗ 格式錯誤';
        }
        setTimeout(() => { importBtn.textContent = '匯入 JSON'; }, 2000);
      }
    });
  }

  private updateUI(): void {
    const stats = this.game.getStatsTracker().getStats();
    const speed = this.game.getTimeController().getSpeed();
    this.dataPanel.update(stats, speed);

    const skills = this.game.getSkillSystem().getAllSkills();
    this.skillPanel.updateSkills(skills);

    const paused = this.game.getTimeController().isPaused();
    this.timeControl.setPaused(paused);
    this.timeControl.updateSpeedSelection(speed);

    // Update macro log
    if (this.game.getMacroEngine().isEnabled()) {
      this.macroPanel.updateLog();
    }
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
