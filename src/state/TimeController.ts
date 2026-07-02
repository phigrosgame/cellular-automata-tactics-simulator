// ============================================================
// TimeController.ts - Time control & undo system
// ============================================================

import { Grid } from '../engine/Grid';
import { MAX_UNDO_TICKS } from '../Types';

interface TimeSnapshot {
  cells: Uint8Array;
  terrain: Uint8Array;
  buffs: Uint8Array;
  buffDurations: Int16Array;
  tick: number;
}

export class TimeController {
  private speed: number = 1;
  private paused: boolean = false;
  private history: TimeSnapshot[] = [];
  private future: TimeSnapshot[] = [];
  private currentTick: number = 0;

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  isPaused(): boolean {
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  togglePause(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  incrementTick(): void {
    this.currentTick++;
  }

  /**
   * Save a snapshot of the current grid state for undo
   */
  saveSnapshot(grid: Grid): void {
    const snapshot: TimeSnapshot = {
      cells: new Uint8Array(grid.getCellsArray()),
      terrain: new Uint8Array(grid.getTerrainArray()),
      buffs: new Uint8Array(grid.getBuffsArray()),
      buffDurations: new Int16Array(grid.getBuffDurationsArray()),
      tick: this.currentTick,
    };

    this.history.push(snapshot);

    // Memory optimization: keep only MAX_UNDO_TICKS snapshots
    if (this.history.length > MAX_UNDO_TICKS) {
      this.history.shift();
    }

    // Clear future when new action is taken
    this.future = [];
  }

  /**
   * Undo: restore previous state
   * Returns true if undo was successful
   */
  undo(grid: Grid): boolean {
    if (this.history.length === 0) return false;

    // Save current state to future for redo
    const currentSnapshot: TimeSnapshot = {
      cells: new Uint8Array(grid.getCellsArray()),
      terrain: new Uint8Array(grid.getTerrainArray()),
      buffs: new Uint8Array(grid.getBuffsArray()),
      buffDurations: new Int16Array(grid.getBuffDurationsArray()),
      tick: this.currentTick,
    };
    this.future.push(currentSnapshot);

    // Restore previous state
    const prev = this.history.pop()!;
    grid.setCellsFromBuffer(prev.cells);
    grid.getTerrainArray().set(prev.terrain);
    grid.getBuffsArray().set(prev.buffs);
    grid.getBuffDurationsArray().set(prev.buffDurations);
    this.currentTick = prev.tick;

    return true;
  }

  /**
   * Redo: restore next state
   * Returns true if redo was successful
   */
  redo(grid: Grid): boolean {
    if (this.future.length === 0) return false;

    // Save current state to history
    const currentSnapshot: TimeSnapshot = {
      cells: new Uint8Array(grid.getCellsArray()),
      terrain: new Uint8Array(grid.getTerrainArray()),
      buffs: new Uint8Array(grid.getBuffsArray()),
      buffDurations: new Int16Array(grid.getBuffDurationsArray()),
      tick: this.currentTick,
    };
    this.history.push(currentSnapshot);

    // Restore next state
    const next = this.future.pop()!;
    grid.setCellsFromBuffer(next.cells);
    grid.getTerrainArray().set(next.terrain);
    grid.getBuffsArray().set(next.buffs);
    grid.getBuffDurationsArray().set(next.buffDurations);
    this.currentTick = next.tick;

    return true;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  getFutureLength(): number {
    return this.future.length;
  }

  clearHistory(): void {
    this.history = [];
    this.future = [];
    this.currentTick = 0;
  }
}
