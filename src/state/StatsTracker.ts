// ============================================================
// StatsTracker.ts - Statistics tracking & history for charts
// ============================================================

import { GameStats, HistoryPoint, MAX_HISTORY_POINTS } from '../Types';

export class StatsTracker {
  private redCount: number = 0;
  private blueCount: number = 0;
  private tick: number = 0;
  private fps: number = 0;
  private computeTime: number = 0;
  private history: HistoryPoint[] = [];
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();

  update(redCount: number, blueCount: number, tick: number, computeTime: number): void {
    this.redCount = redCount;
    this.blueCount = blueCount;
    this.tick = tick;
    this.computeTime = computeTime;

    // Add to history
    this.history.push({ tick, red: redCount, blue: blueCount });

    // Memory optimization: limit history size
    if (this.history.length > MAX_HISTORY_POINTS) {
      this.history = this.history.slice(-MAX_HISTORY_POINTS);
    }
  }

  tickFps(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsTime;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  getRedCount(): number { return this.redCount; }
  getBlueCount(): number { return this.blueCount; }
  getTick(): number { return this.tick; }
  getFps(): number { return this.fps; }
  getComputeTime(): number { return this.computeTime; }
  getHistory(): HistoryPoint[] { return this.history; }

  getStats(): GameStats {
    return {
      tick: this.tick,
      redCount: this.redCount,
      blueCount: this.blueCount,
      fps: this.fps,
      computeTime: this.computeTime,
    };
  }

  clear(): void {
    this.redCount = 0;
    this.blueCount = 0;
    this.tick = 0;
    this.fps = 0;
    this.computeTime = 0;
    this.history = [];
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
  }
}
