// ============================================================
// AutoPlayPanel.ts - Spectator-mode UI controls + AI decision log
// ============================================================

import { AutoPlayer, AutoPlayerDecision } from '../ai/AutoPlayer';

export interface AutoPlayPanelHandlers {
  onToggle: (enabled: boolean) => void;
  onRunTicks: (n: number) => void;
  onReset: () => void;
}

export class AutoPlayPanel {
  private container: HTMLElement;
  private autoPlayer: AutoPlayer;
  private handlers: AutoPlayPanelHandlers;

  private toggleBtn!: HTMLButtonElement;
  private runBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private tickInput!: HTMLInputElement;
  private logEl!: HTMLDivElement;
  private statusEl!: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private updateTimer: number = 0;

  constructor(
    container: HTMLElement,
    autoPlayer: AutoPlayer,
    handlers: AutoPlayPanelHandlers,
  ) {
    this.container = container;
    this.autoPlayer = autoPlayer;
    this.handlers = handlers;
    this.build();
    this.updateTimer = window.setInterval(() => this.refreshLog(), 250);
  }

  private build(): void {
    this.container.innerHTML = `
      <div class="autoplay-panel">
        <div class="autoplay-header">
          <span class="autoplay-title">🎬 觀眾模式</span>
          <span class="autoplay-badge" id="autoplay-badge">OFF</span>
        </div>
        <div class="autoplay-status" id="autoplay-status">
          AI 待命中 — 開啟後會自動操控紅藍軍互打
        </div>
        <div class="autoplay-actions">
          <button id="autoplay-toggle" class="autoplay-btn primary">
            ▶️ 開啟觀眾模式
          </button>
          <div class="autoplay-run">
            <input id="autoplay-ticks" type="number" value="100" min="10" max="9999" step="10"
              style="width:70px;background:#0d1117;color:#e0e0e0;border:1px solid #30363d;border-radius:4px;padding:4px;font-size:12px;" />
            <button id="autoplay-run" class="autoplay-btn">🎲 自動打 N 回合</button>
          </div>
          <button id="autoplay-reset" class="autoplay-btn small">🔄 重置場地</button>
        </div>
        <div class="autoplay-stats" id="autoplay-stats">技能施放: 0 · 細胞投放: 0</div>
        <div class="autoplay-log-title">🤖 AI 決策紀錄</div>
        <div id="autoplay-log" class="autoplay-log"></div>
      </div>
    `;

    this.toggleBtn = this.container.querySelector('#autoplay-toggle') as HTMLButtonElement;
    this.runBtn = this.container.querySelector('#autoplay-run') as HTMLButtonElement;
    this.resetBtn = this.container.querySelector('#autoplay-reset') as HTMLButtonElement;
    this.tickInput = this.container.querySelector('#autoplay-ticks') as HTMLInputElement;
    this.logEl = this.container.querySelector('#autoplay-log') as HTMLDivElement;
    this.statusEl = this.container.querySelector('#autoplay-status') as HTMLDivElement;
    this.statsEl = this.container.querySelector('#autoplay-stats') as HTMLDivElement;

    this.toggleBtn.addEventListener('click', () => {
      const next = !this.autoPlayer.isEnabled();
      this.handlers.onToggle(next);
    });
    this.runBtn.addEventListener('click', () => {
      const n = parseInt(this.tickInput.value) || 100;
      this.handlers.onRunTicks(n);
    });
    this.resetBtn.addEventListener('click', () => {
      this.handlers.onReset();
    });
  }

  /**
   * Sync UI with current auto-player state (call when externally toggled).
   */
  syncState(): void {
    const enabled = this.autoPlayer.isEnabled();
    const badge = this.container.querySelector('#autoplay-badge') as HTMLSpanElement;
    if (enabled) {
      this.toggleBtn.innerHTML = '⏸️ 暫停觀眾模式';
      this.toggleBtn.classList.add('active');
      badge.textContent = 'ON';
      badge.classList.add('on');
      this.statusEl.textContent = '🟢 AI 正在操控中 — 觀戰享受';
      this.statusEl.classList.add('on');
    } else {
      this.toggleBtn.innerHTML = '▶️ 開啟觀眾模式';
      this.toggleBtn.classList.remove('active');
      badge.textContent = 'OFF';
      badge.classList.remove('on');
      this.statusEl.textContent = 'AI 待命中 — 開啟後會自動操控紅藍軍互打';
      this.statusEl.classList.remove('on');
    }
    this.refreshLog();
  }

  private refreshLog(): void {
    const log = this.autoPlayer.getLog();
    if (log.length === 0) {
      this.logEl.innerHTML = '<div class="autoplay-log-empty">（尚無決策）</div>';
    } else {
      this.logEl.innerHTML = log.map(d => this.renderDecision(d)).join('');
    }
    const stats = this.autoPlayer.getStats();
    this.statsEl.textContent = `技能施放: ${stats.skillsCast} · 細胞投放: ${stats.cellsPlaced}`;
  }

  private renderDecision(d: AutoPlayerDecision): string {
    const factionTag = d.faction === 1
      ? '<span class="ap-tag red">紅</span>'
      : '<span class="ap-tag blue">藍</span>';
    let icon = '👀';
    if (d.action === 'skill') {
      if (d.skill === 'meteor') icon = '☄️';
      else if (d.skill === 'gene_boost') icon = '🧬';
      else if (d.skill === 'swamp') icon = '🌿';
    } else if (d.action === 'place') {
      icon = '🖱️';
    }
    const tickTag = `<span class="ap-tick">t${d.tick}</span>`;
    const posTag = d.action === 'idle' ? '' :
      `<span class="ap-pos">(${d.x},${d.y})</span>`;
    return `<div class="ap-row">
      ${tickTag} ${icon} ${factionTag} ${posTag}
      <span class="ap-reason">${d.reason}</span>
    </div>`;
  }

  destroy(): void {
    clearInterval(this.updateTimer);
  }
}