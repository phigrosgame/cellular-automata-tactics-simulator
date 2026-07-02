// ============================================================
// GameEngine.ts - Main engine coordinating worker + fallback
// ============================================================

import { Grid } from './Grid';
import { Rules } from './Rules';
import { CellState, SimulationConfig, DEFAULT_CONFIG, BuffFlag } from '../Types';

export class GameEngine {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingResolve: ((value: any) => void) | null = null;
  private useWorker: boolean = false;
  private workerReady: boolean = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/GameWorker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.onmessage = (e) => this.handleWorkerMessage(e);
      this.worker.onerror = (err) => {
        console.warn('Worker error, falling back to main thread:', err);
        this.useWorker = false;
      };
      this.useWorker = true;
      this.workerReady = true;
    } catch (err) {
      console.warn('Web Worker not available, using main thread:', err);
      this.useWorker = false;
    }
  }

  private handleWorkerMessage(e: MessageEvent): void {
    const data = e.data;
    if (data.type === 'result' && data.id === this.requestId) {
      if (this.pendingResolve) {
        this.pendingResolve({
          cells: new Uint8Array(data.cells),
          buffs: new Uint8Array(data.buffs),
          buffDurations: new Int16Array(data.buffDurations),
          changes: new Uint8Array(data.changes),
          redCount: data.redCount,
          blueCount: data.blueCount,
          computeTime: data.computeTime,
        });
        this.pendingResolve = null;
      }
    }
  }

  /**
   * Compute next generation. Uses worker if available, else main thread.
   */
  async computeNext(grid: Grid, config: SimulationConfig = DEFAULT_CONFIG): Promise<{
    cells: Uint8Array;
    buffs: Uint8Array;
    buffDurations: Int16Array;
    changes: Uint8Array;
    redCount: number;
    blueCount: number;
    computeTime: number;
  }> {
    if (this.useWorker && this.worker && this.workerReady) {
      return this.computeWithWorker(grid, config);
    }
    return this.computeMainThread(grid, config);
  }

  private computeWithWorker(
    grid: Grid,
    config: SimulationConfig
  ): Promise<any> {
    return new Promise((resolve) => {
      this.requestId++;
      this.pendingResolve = resolve;

      const cellsCopy = new Uint8Array(grid.getCellsArray());
      const terrainCopy = new Uint8Array(grid.getTerrainArray());
      const buffsCopy = new Uint8Array(grid.getBuffsArray());
      const buffDurCopy = new Int16Array(grid.getBuffDurationsArray());

      this.worker!.postMessage(
        {
          id: this.requestId,
          type: 'compute',
          cells: cellsCopy.buffer,
          terrain: terrainCopy.buffer,
          buffs: buffsCopy.buffer,
          buffDurations: buffDurCopy.buffer,
          width: grid.width,
          height: grid.height,
          config,
        },
        [
          cellsCopy.buffer,
          terrainCopy.buffer,
          buffsCopy.buffer,
          buffDurCopy.buffer,
        ]
      );
    });
  }

  private computeMainThread(
    grid: Grid,
    config: SimulationConfig
  ): {
    cells: Uint8Array;
    buffs: Uint8Array;
    buffDurations: Int16Array;
    changes: Uint8Array;
    redCount: number;
    blueCount: number;
    computeTime: number;
  } {
    const startTime = performance.now();

    const cells = grid.getCellsArray();
    const terrain = grid.getTerrainArray();
    const buffs = grid.getBuffsArray();
    const buffDurations = grid.getBuffDurationsArray();
    const width = grid.width;
    const height = grid.height;
    const size = width * height;

    // Tick buffs
    const newBuffs = new Uint8Array(buffs);
    const newBuffDurations = new Int16Array(buffDurations);
    for (let i = 0; i < size; i++) {
      if (newBuffDurations[i] > 0) {
        newBuffDurations[i]--;
        if (newBuffDurations[i] <= 0) {
          newBuffs[i] = BuffFlag.NONE;
        }
      }
    }

    // Compute next generation with diffs
    const { newCells, changeIndices, oldValues } = Rules.computeWithDiffs(
      cells, terrain, newBuffs, width, height, config
    );

    // Build changes buffer
    const changesList: number[] = [];
    for (let i = 0; i < changeIndices.length; i++) {
      changesList.push(changeIndices[i], oldValues[i], newCells[changeIndices[i]]);
    }
    const changes = new Uint8Array(changesList);

    // Count
    const counts = Rules.countCells(newCells);
    const computeTime = performance.now() - startTime;

    return {
      cells: newCells,
      buffs: newBuffs,
      buffDurations: newBuffDurations,
      changes,
      redCount: counts.red,
      blueCount: counts.blue,
      computeTime,
    };
  }

  /**
   * Synchronous computation (for time control / undo preview)
   */
  computeSync(grid: Grid, config: SimulationConfig = DEFAULT_CONFIG): {
    cells: Uint8Array;
    buffs: Uint8Array;
    buffDurations: Int16Array;
    redCount: number;
    blueCount: number;
  } {
    return this.computeMainThread(grid, config);
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.useWorker = false;
    this.workerReady = false;
  }
}
