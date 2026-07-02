// ============================================================
// DataPanel.ts - Real-time statistics display
// ============================================================

import { GameStats, COLORS, CellState } from '../Types';

export class DataPanel {
  private container: HTMLElement;
  private tickEl: HTMLElement;
  private redEl: HTMLElement;
  private blueEl: HTMLElement;
  private fpsEl: HTMLElement;
  private computeEl: HTMLElement;
  private speedEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    this.container.innerHTML = `
      <div class="data-panel">
        <div class="data-row">
          <span class="data-label">回合</span>
          <span class="data-value" id="stat-tick">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${COLORS[CellState.RED]}">紅軍</span>
          <span class="data-value" id="stat-red" style="color:${COLORS[CellState.RED]}">0</span>
        </div>
        <div class="data-row">
          <span class="data-label" style="color:${COLORS[CellState.BLUE]}">藍軍</span>
          <span class="data-value" id="stat-blue" style="color:${COLORS[CellState.BLUE]}">0</span>
        </div>
        <div class="data-row">
          <span class="data-label">FPS</span>
          <span class="data-value" id="stat-fps">0</span>
        </div>
        <div class="data-row">
          <span class="data-label">計算</span>
          <span class="data-value" id="stat-compute">0ms</span>
        </div>
        <div class="data-row">
          <span class="data-label">速度</span>
          <span class="data-value" id="stat-speed">1x</span>
        </div>
      </div>
    `;

    this.tickEl = this.container.querySelector('#stat-tick')!;
    this.redEl = this.container.querySelector('#stat-red')!;
    this.blueEl = this.container.querySelector('#stat-blue')!;
    this.fpsEl = this.container.querySelector('#stat-fps')!;
    this.computeEl = this.container.querySelector('#stat-compute')!;
    this.speedEl = this.container.querySelector('#stat-speed')!;
  }

  update(stats: GameStats, speed: number): void {
    this.tickEl.textContent = stats.tick.toString();
    this.redEl.textContent = stats.redCount.toLocaleString();
    this.blueEl.textContent = stats.blueCount.toLocaleString();
    this.fpsEl.textContent = stats.fps.toString();
    this.computeEl.textContent = stats.computeTime.toFixed(1) + 'ms';
    this.speedEl.textContent = speed + 'x';
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
