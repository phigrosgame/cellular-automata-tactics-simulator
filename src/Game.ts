// ============================================================
// Game.ts - Main game controller
// ============================================================

import { Grid } from './engine/Grid';
import { GameEngine } from './engine/GameEngine';
import { Rules } from './engine/Rules';
import { SkillSystem } from './skills/SkillSystem';
import { TimeController } from './state/TimeController';
import { StatsTracker } from './state/StatsTracker';
import { TerrainSystem } from './terrain/TerrainSystem';
import { Leviathan } from './entities/Leviathan';
import { MacroEngine } from './macro/MacroEngine';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { ChartRenderer } from './renderer/ChartRenderer';
import { WebGLRenderer } from './renderer/WebGLRenderer';
import { WebGPURenderer } from './renderer/WebGPURenderer';
import {
  CellState, TerrainType, SkillType, DEFAULT_GRID_SIZE, LARGE_GRID_SIZE,
  DEFAULT_CONFIG, SimulationConfig, COLORS, LeviathanState
} from './Types';

export type RenderMode = 'canvas2d' | 'webgl' | 'webgpu';

export class Game {
  // Core systems
  private grid: Grid;
  private engine: GameEngine;
  private skillSystem: SkillSystem;
  private timeController: TimeController;
  private statsTracker: StatsTracker;
  private leviathan: Leviathan | null = null;
  private macroEngine: MacroEngine;

  // Rendering
  private canvasRenderer: CanvasRenderer;
  private chartRenderer: ChartRenderer;
  private webglRenderer: WebGLRenderer | null = null;
  private webgpuRenderer: WebGPURenderer | null = null;
  private renderMode: RenderMode = 'canvas2d';

  // Game loop
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private targetTickInterval: number = 100; // ms per tick at 1x
  private computing: boolean = false;

  // UI state
  private selectedSkill: SkillType | null = null;
  private mouseDown: boolean = false;
  private mouseGridPos: { x: number; y: number } | null = null;
  private hoverGridPos: { x: number; y: number } | null = null;

  // Config
  private simulationConfig: SimulationConfig = { ...DEFAULT_CONFIG };
  private leviathanEnabled: boolean = false;

  constructor(
    private mainCanvas: HTMLCanvasElement,
    private chartCanvas: HTMLCanvasElement,
    gridSize: number = DEFAULT_GRID_SIZE
  ) {
    // Initialize core
    this.grid = new Grid({ width: gridSize, height: gridSize });
    this.engine = new GameEngine();
    this.skillSystem = new SkillSystem();
    this.timeController = new TimeController();
    this.statsTracker = new StatsTracker();
    this.macroEngine = new MacroEngine();

    // Initialize renderers
    this.canvasRenderer = new CanvasRenderer(mainCanvas);
    this.canvasRenderer.setGridSize(gridSize, gridSize);
    this.chartRenderer = new ChartRenderer(chartCanvas);

    // Try WebGL
    this.initGPU();

    // Setup input
    this.setupInput();
  }

  private async initGPU(): Promise<void> {
    // Try WebGPU first
    const webgpuCanvas = document.createElement('canvas');
    this.webgpuRenderer = new WebGPURenderer(webgpuCanvas);
    const webgpuOk = await this.webgpuRenderer.init();
    if (webgpuOk) {
      console.log('WebGPU available');
    } else {
      this.webgpuRenderer = null;
    }

    // Try WebGL
    const webglCanvas = document.createElement('canvas');
    this.webglRenderer = new WebGLRenderer(webglCanvas);
    if (this.webglRenderer.isAvailable()) {
      console.log('WebGL available');
      this.webglRenderer.initGrid(this.grid.width, this.grid.height);
    } else {
      this.webglRenderer = null;
    }
  }

  /**
   * Setup mouse/touch input for cell placement and skills
   */
  private setupInput(): void {
    const canvas = this.mainCanvas;

    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.handleCanvasInteraction(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = this.canvasRenderer.screenToGrid(e.clientX, e.clientY);
      this.hoverGridPos = pos;
      if (this.mouseDown) {
        this.handleCanvasInteraction(e);
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });

    canvas.addEventListener('mouseleave', () => {
      this.mouseDown = false;
      this.hoverGridPos = null;
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.mouseDown = true;
      const touch = e.touches[0];
      this.handleCanvasInteraction(touch);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleCanvasInteraction(touch);
    });

    canvas.addEventListener('touchend', () => {
      this.mouseDown = false;
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.togglePause();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.undo();
          }
          break;
        case '1':
          this.setSpeed(1);
          break;
        case '2':
          this.setSpeed(2);
          break;
        case '3':
          this.setSpeed(5);
          break;
      }
    });
  }

  private handleCanvasInteraction(e: MouseEvent | Touch): void {
    const pos = this.canvasRenderer.screenToGrid(
      ('clientX' in e ? e.clientX : 0),
      ('clientY' in e ? e.clientY : 0)
    );
    if (!pos) return;

    this.mouseGridPos = pos;

    if (this.selectedSkill !== null) {
      // Execute skill at position
      this.skillSystem.executeSkill(this.selectedSkill, this.grid, { x: pos.x, y: pos.y });
      this.selectedSkill = null;
    } else {
      // Place cells
      const faction = this.skillSystem.getActiveFaction();
      this.placeCellBrush(pos.x, pos.y, faction);
    }
  }

  private placeCellBrush(cx: number, cy: number, faction: CellState): void {
    const radius = 2;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const x = cx + dx;
          const y = cy + dy;
          if (this.grid.inBounds(x, y) && this.grid.getTerrain(x, y) !== TerrainType.WALL) {
            this.grid.setCell(x, y, faction);
          }
        }
      }
    }
  }

  // ==================== Game Loop ====================

  start(): void {
    this.grid.placeInitialPattern();
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop = (time: number): void => {
    this.animFrameId = requestAnimationFrame(this.gameLoop);

    const dt = time - this.lastTime;
    this.lastTime = time;
    this.statsTracker.tickFps();

    if (!this.timeController.isPaused()) {
      this.accumulator += dt * this.timeController.getSpeed();

      while (this.accumulator >= this.targetTickInterval && !this.computing) {
        this.accumulator -= this.targetTickInterval;
        this.simulateTick();
      }
    }

    // Render every frame
    this.render();
  };

  private async simulateTick(): Promise<void> {
    if (this.computing) return;
    this.computing = true;

    // Save snapshot for undo
    this.timeController.saveSnapshot(this.grid);

    try {
      // Compute next generation
      const result = await this.engine.computeNext(this.grid, this.simulationConfig);

      // Apply results
      this.grid.setCellsFromBuffer(result.cells);
      this.grid.setBuffsFromBuffer(result.buffs);
      this.grid.setBuffDurationsFromBuffer(result.buffDurations);

      // Update stats
      this.timeController.incrementTick();
      this.statsTracker.update(result.redCount, result.blueCount, this.timeController.getCurrentTick(), result.computeTime);

      // Tick cooldowns
      this.skillSystem.tickCooldowns();

      // Update Leviathan
      if (this.leviathanEnabled && this.leviathan) {
        this.leviathan.update(this.grid);
      }

      // Execute macro rules
      this.macroEngine.executeRules(this);

    } finally {
      this.computing = false;
    }
  }

  private render(): void {
    const levState = this.leviathan?.getState() ?? null;

    if (this.renderMode === 'canvas2d') {
      this.canvasRenderer.render(this.grid, levState);
    }
    // WebGL/WebGPU render would be triggered here for large grids

    // Draw hover highlight
    if (this.hoverGridPos) {
      if (this.selectedSkill) {
        const radius = this.selectedSkill === SkillType.METEOR ? 5 : 2;
        this.canvasRenderer.drawHighlight(
          this.hoverGridPos.x, this.hoverGridPos.y,
          radius, '#ffd93d'
        );
      } else {
        this.canvasRenderer.drawHighlight(
          this.hoverGridPos.x, this.hoverGridPos.y,
          0, 'rgba(255,255,255,0.5)'
        );
      }
    }

    // Draw Leviathan HP bar if exists
    if (levState && levState.alive) {
      // Leviathan is rendered in CanvasRenderer
    }

    // Render chart (less frequently for performance)
    if (this.timeController.getCurrentTick() % 2 === 0) {
      this.chartRenderer.render(this.statsTracker.getHistory(), this.timeController.getCurrentTick());
    }
  }

  // ==================== Public API ====================

  getGrid(): Grid { return this.grid; }
  getSkillSystem(): SkillSystem { return this.skillSystem; }
  getTimeController(): TimeController { return this.timeController; }
  getStatsTracker(): StatsTracker { return this.statsTracker; }
  getMacroEngine(): MacroEngine { return this.macroEngine; }
  getTick(): number { return this.timeController.getCurrentTick(); }

  togglePause(): void {
    this.timeController.togglePause();
  }

  setSpeed(speed: number): void {
    this.timeController.setSpeed(speed);
  }

  undo(): void {
    this.timeController.undo(this.grid);
  }

  selectSkill(type: SkillType | null): void {
    this.selectedSkill = type;
  }

  getSelectedSkill(): SkillType | null {
    return this.selectedSkill;
  }

  setFaction(faction: CellState): void {
    this.skillSystem.setActiveFaction(faction);
  }

  reset(): void {
    this.grid.clear();
    this.grid.placeInitialPattern();
    this.timeController.clearHistory();
    this.statsTracker.clear();
    this.skillSystem.resetAll();
    if (this.leviathan) {
      this.leviathan.reset(0, Math.floor(this.grid.height / 2));
    }
  }

  resize(width: number, height: number): void {
    this.mainCanvas.style.width = width + 'px';
    this.mainCanvas.style.height = height + 'px';
    this.canvasRenderer.resize();
    this.chartRenderer.resize();
  }

  setGridSize(size: number): void {
    this.grid = new Grid({ width: size, height: size });
    this.grid.placeInitialPattern();
    this.canvasRenderer.setGridSize(size, size);
    this.timeController.clearHistory();
    this.statsTracker.clear();

    if (this.webglRenderer) {
      this.webglRenderer.initGrid(size, size);
    }
  }

  enableLeviathan(enabled: boolean): void {
    this.leviathanEnabled = enabled;
    if (enabled && !this.leviathan) {
      this.leviathan = new Leviathan(0, Math.floor(this.grid.height / 2) - 1);
    }
    if (!enabled) {
      this.leviathan = null;
    }
  }

  getRenderMode(): RenderMode { return this.renderMode; }

  setRenderMode(mode: RenderMode): void {
    this.renderMode = mode;
  }

  addWall(x: number, y: number): void {
    TerrainSystem.addWall(this.grid, x, y);
  }

  addSwamp(x: number, y: number, w: number, h: number): void {
    TerrainSystem.addSwamp(this.grid, x, y, w, h);
  }

  exportMap(): string {
    return TerrainSystem.exportMap(this.grid);
  }

  importMap(json: string): boolean {
    const newGrid = TerrainSystem.importMap(json);
    if (newGrid) {
      this.grid = newGrid;
      this.canvasRenderer.setGridSize(newGrid.width, newGrid.height);
      return true;
    }
    return false;
  }

  /**
   * Get cell state at grid position (for tool use)
   */
  getCellAt(x: number, y: number): CellState {
    return this.grid.getCell(x, y);
  }

  /**
   * Place a cell at grid position
   */
  placeCell(x: number, y: number, state: CellState): void {
    this.grid.setCell(x, y, state);
  }

  destroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.engine.destroy();
    this.canvasRenderer.destroy();
    this.webglRenderer?.destroy();
    this.webgpuRenderer?.destroy();
  }
}
