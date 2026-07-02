// ============================================================
// CanvasRenderer.ts - Canvas 2D renderer using ImageData
// ============================================================

import { Grid } from '../engine/Grid';
import {
  CellState, TerrainType, BuffFlag, COLORS, LeviathanState
} from '../Types';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private cellSize: number = 4;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private showGrid: boolean = false;
  private gridWidth: number = 100;
  private gridHeight: number = 100;

  // Color lookup for fast pixel writes
  private colorTable: number[][] = [
    [10, 14, 23],    // EMPTY - dark bg
    [230, 57, 70],   // RED
    [69, 123, 157],  // BLUE
    [45, 49, 66],    // WALL
    [45, 106, 79],   // SWAMP
    [249, 199, 79],  // GENE_BOOST overlay
    [155, 93, 229],  // LEVIATHAN
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.recalculateLayout();
  }

  private recalculateLayout(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    this.cellSize = Math.max(1, Math.floor(Math.min(cw / this.gridWidth, ch / this.gridHeight)));
    this.offsetX = Math.floor((cw - this.cellSize * this.gridWidth) / 2);
    this.offsetY = Math.floor((ch - this.cellSize * this.gridHeight) / 2);
  }

  setGridSize(width: number, height: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.recalculateLayout();
  }

  setShowGrid(show: boolean): void {
    this.showGrid = show;
  }

  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(screenX: number, screenY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((screenX - rect.left - this.offsetX) / this.cellSize);
    const y = Math.floor((screenY - rect.top - this.offsetY) / this.cellSize);

    if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
      return { x, y };
    }
    return null;
  }

  /**
   * Render the entire grid using ImageData for maximum performance
   */
  render(grid: Grid, leviathanState?: LeviathanState | null): void {
    const rect = this.canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    // Use ImageData for fast pixel rendering
    if (!this.imageData || this.imageData.width !== this.canvas.width || this.imageData.height !== this.canvas.height) {
      this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }

    const data = this.imageData.data;
    const dpr = window.devicePixelRatio || 1;
    const imgWidth = this.imageData.width;

    // Fill background
    const bgR = 10, bgG = 14, bgB = 23;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = bgR;
      data[i + 1] = bgG;
      data[i + 2] = bgB;
      data[i + 3] = 255;
    }

    const cells = grid.getCellsArray();
    const terrain = grid.getTerrainArray();
    const buffs = grid.getBuffsArray();
    const cs = this.cellSize * dpr;
    const ox = this.offsetX * dpr;
    const oy = this.offsetY * dpr;

    // Render terrain first (walls, swamps)
    for (let gy = 0; gy < this.gridHeight; gy++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        const idx = gy * this.gridWidth + gx;
        const t = terrain[idx];

        if (t !== TerrainType.NORMAL) {
          const color = t === TerrainType.WALL ? this.colorTable[3] : this.colorTable[4];
          this.fillRect(data, imgWidth, gx, gy, cs, ox, oy, color);
        }
      }
    }

    // Render cells
    for (let gy = 0; gy < this.gridHeight; gy++) {
      for (let gx = 0; gx < this.gridWidth; gx++) {
        const idx = gy * this.gridWidth + gx;
        const cell = cells[idx];

        if (cell !== CellState.EMPTY) {
          let colorIdx = cell; // 1=RED, 2=BLUE
          // Gene boost overlay: blend with gold
          if (buffs[idx] === BuffFlag.GENE_BOOST) {
            colorIdx = 5;
          }
          this.fillRect(data, imgWidth, gx, gy, cs, ox, oy, this.colorTable[colorIdx]);
        }
      }
    }

    // Render Leviathan
    if (leviathanState && leviathanState.alive) {
      const levColor = this.colorTable[6];
      for (let dy = 0; dy < leviathanState.size; dy++) {
        for (let dx = 0; dx < leviathanState.size; dx++) {
          this.fillRect(data, imgWidth,
            leviathanState.x + dx, leviathanState.y + dy,
            cs, ox, oy, levColor);
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);

    // Draw grid lines if enabled and cells are large enough
    if (this.showGrid && this.cellSize >= 4) {
      this.drawGridOverlay(cw, ch);
    }
  }

  private fillRect(
    data: Uint8ClampedArray,
    imgWidth: number,
    gx: number, gy: number,
    cs: number,
    ox: number, oy: number,
    color: number[]
  ): void {
    const startX = Math.floor(ox + gx * cs);
    const startY = Math.floor(oy + gy * cs);
    const endX = startX + Math.ceil(cs);
    const endY = startY + Math.ceil(cs);

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        if (px >= 0 && px < imgWidth && py >= 0 && py < this.imageData!.height) {
          const i = (py * imgWidth + px) * 4;
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
          data[i + 3] = 255;
        }
      }
    }
  }

  private drawGridOverlay(cw: number, ch: number): void {
    this.ctx.strokeStyle = COLORS.GRID_LINE;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();

    for (let x = 0; x <= this.gridWidth; x++) {
      const px = this.offsetX + x * this.cellSize;
      this.ctx.moveTo(px, this.offsetY);
      this.ctx.lineTo(px, this.offsetY + this.gridHeight * this.cellSize);
    }
    for (let y = 0; y <= this.gridHeight; y++) {
      const py = this.offsetY + y * this.cellSize;
      this.ctx.moveTo(this.offsetX, py);
      this.ctx.lineTo(this.offsetX + this.gridWidth * this.cellSize, py);
    }

    this.ctx.stroke();
  }

  /**
   * Draw a highlight/selection at grid position
   */
  drawHighlight(x: number, y: number, radius: number = 0, color: string = '#ffffff'): void {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2 * dpr;

    if (radius > 0) {
      // Circle highlight
      const cx = this.offsetX + (x + 0.5) * this.cellSize;
      const cy = this.offsetY + (y + 0.5) * this.cellSize;
      const r = radius * this.cellSize;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      // Single cell highlight
      const px = this.offsetX + x * this.cellSize;
      const py = this.offsetY + y * this.cellSize;
      this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  destroy(): void {
    this.imageData = null;
  }
}
