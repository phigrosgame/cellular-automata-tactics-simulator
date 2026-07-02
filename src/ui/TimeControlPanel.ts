// ============================================================
// TimeControlPanel.ts - Play/pause/speed/undo controls
// ============================================================

import { TIME_SPEEDS } from '../Types';

export class TimeControlPanel {
  private container: HTMLElement;
  private onPause: () => void;
  private onSpeedChange: (speed: number) => void;
  private onUndo: () => void;
  private onReset: () => void;
  private speedButtons: HTMLButtonElement[] = [];
  private pauseBtn: HTMLButtonElement | null = null;

  constructor(
    container: HTMLElement,
    callbacks: {
      onPause: () => void;
      onSpeedChange: (speed: number) => void;
      onUndo: () => void;
      onReset: () => void;
    }
  ) {
    this.container = container;
    this.onPause = callbacks.onPause;
    this.onSpeedChange = callbacks.onSpeedChange;
    this.onUndo = callbacks.onUndo;
    this.onReset = callbacks.onReset;
    this.build();
  }

  private build(): void {
    this.container.innerHTML = `
      <div class="time-control-panel">
        <button id="tc-pause" class="tc-btn" title="暫停/播放">⏸️</button>
        <div class="tc-speed-group">
          ${TIME_SPEEDS.filter(s => s > 0).map(s => `
            <button class="tc-btn tc-speed" data-speed="${s}">${s}x</button>
          `).join('')}
        </div>
        <button id="tc-undo" class="tc-btn" title="時空回溯 (Undo)">⏪</button>
        <button id="tc-reset" class="tc-btn" title="重置">🔄</button>
      </div>
    `;

    this.pauseBtn = this.container.querySelector('#tc-pause') as HTMLButtonElement;
    const undoBtn = this.container.querySelector('#tc-undo') as HTMLButtonElement;
    const resetBtn = this.container.querySelector('#tc-reset') as HTMLButtonElement;

    this.pauseBtn.addEventListener('click', () => this.onPause());
    undoBtn.addEventListener('click', () => this.onUndo());
    resetBtn.addEventListener('click', () => this.onReset());

    // Speed buttons
    const speedBtns = this.container.querySelectorAll('.tc-speed');
    speedBtns.forEach(btn => {
      const el = btn as HTMLButtonElement;
      const speed = parseInt(el.dataset.speed || '1');
      el.addEventListener('click', () => {
        this.onSpeedChange(speed);
        this.updateSpeedSelection(speed);
      });
      this.speedButtons.push(el);
    });

    // Default to 1x
    this.updateSpeedSelection(1);
  }

  updateSpeedSelection(speed: number): void {
    for (const btn of this.speedButtons) {
      const s = parseInt(btn.dataset.speed || '1');
      btn.style.background = s === speed ? '#457b9d' : '#1c2333';
      btn.style.color = s === speed ? '#fff' : '#888';
    }
  }

  setPaused(paused: boolean): void {
    if (this.pauseBtn) {
      this.pauseBtn.textContent = paused ? '▶️' : '⏸️';
      this.pauseBtn.style.background = paused ? '#2d6a4f' : '#1c2333';
    }
  }

  getElement(): HTMLElement {
    return this.container;
  }
}
