// ============================================================
// ChartRenderer.ts - Real-time history trend chart
// ============================================================

import { HistoryPoint, COLORS, CellState } from '../Types';

export class ChartRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maxPoints: number = 500;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render(history: HistoryPoint[], currentTick: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const ctx = this.ctx;
    const padding = { top: 10, right: 10, bottom: 25, left: 45 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    if (history.length < 2) {
      ctx.fillStyle = '#555';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('等待數據...', w / 2, h / 2);
      return;
    }

    // Find max value for scaling
    let maxVal = 1;
    for (const pt of history) {
      maxVal = Math.max(maxVal, pt.red, pt.blue);
    }
    maxVal = Math.ceil(maxVal / 100) * 100; // Round up to nearest 100

    const xScale = plotW / Math.max(1, history.length - 1);
    const yScale = plotH / maxVal;

    // Draw grid lines
    ctx.strokeStyle = '#1c2333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();

      // Y-axis labels
      const val = Math.round(maxVal * (1 - i / 4));
      ctx.fillStyle = '#666';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(val.toString(), padding.left - 5, y + 3);
    }

    // Draw X-axis labels
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    const tickStart = history[0].tick;
    const tickEnd = history[history.length - 1].tick;
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (plotW * i) / 4;
      const tick = Math.round(tickStart + (tickEnd - tickStart) * i / 4);
      ctx.fillText(tick.toString(), x, h - 5);
    }

    // Draw lines
    this.drawLine(history, 'red', COLORS[CellState.RED], padding, xScale, yScale, maxVal, plotH);
    this.drawLine(history, 'blue', COLORS[CellState.BLUE], padding, xScale, yScale, maxVal, plotH);

    // Legend
    ctx.font = '11px system-ui';
    ctx.fillStyle = COLORS[CellState.RED];
    ctx.textAlign = 'left';
    ctx.fillText('● 紅軍', padding.left + 5, padding.top + 12);
    ctx.fillStyle = COLORS[CellState.BLUE];
    ctx.fillText('● 藍軍', padding.left + 60, padding.top + 12);
  }

  private drawLine(
    history: HistoryPoint[],
    field: 'red' | 'blue',
    color: string,
    padding: { top: number; left: number },
    xScale: number,
    yScale: number,
    maxVal: number,
    plotH: number
  ): void {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < history.length; i++) {
      const x = padding.left + i * xScale;
      const y = padding.top + plotH - history[i][field] * yScale;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw filled area under line (subtle)
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    ctx.lineTo(padding.left + (history.length - 1) * xScale, padding.top + plotH);
    ctx.lineTo(padding.left, padding.top + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
