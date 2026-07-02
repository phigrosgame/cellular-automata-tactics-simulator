// ============================================================
// Grid.ts - Core grid data structure with typed arrays
// ============================================================

import { CellState, TerrainType, BuffFlag, GridConfig, MapData, CellDiff } from '../Types';

export class Grid {
  readonly width: number;
  readonly height: number;
  private cells: Uint8Array;
  private terrain: Uint8Array;
  private buffs: Uint8Array;
  private buffDurations: Int16Array;

  constructor(config: GridConfig) {
    this.width = config.width;
    this.height = config.height;
    const size = this.width * this.height;
    this.cells = new Uint8Array(size);
    this.terrain = new Uint8Array(size);
    this.buffs = new Uint8Array(size);
    this.buffDurations = new Int16Array(size);
  }

  idx(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getCell(x: number, y: number): CellState {
    if (!this.inBounds(x, y)) return CellState.EMPTY;
    return this.cells[this.idx(x, y)] as CellState;
  }

  setCell(x: number, y: number, state: CellState): void {
    if (!this.inBounds(x, y)) return;
    this.cells[this.idx(x, y)] = state;
  }

  getTerrain(x: number, y: number): TerrainType {
    if (!this.inBounds(x, y)) return TerrainType.NORMAL;
    return this.terrain[this.idx(x, y)] as TerrainType;
  }

  setTerrain(x: number, y: number, terrain: TerrainType): void {
    if (!this.inBounds(x, y)) return;
    this.terrain[this.idx(x, y)] = terrain;
  }

  getBuff(x: number, y: number): BuffFlag {
    if (!this.inBounds(x, y)) return BuffFlag.NONE;
    return this.buffs[this.idx(x, y)] as BuffFlag;
  }

  setBuff(x: number, y: number, flag: BuffFlag, duration: number): void {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.buffs[i] = flag;
    this.buffDurations[i] = duration;
  }

  clearBuff(x: number, y: number): void {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.buffs[i] = BuffFlag.NONE;
    this.buffDurations[i] = 0;
  }

  tickBuffs(): void {
    for (let i = 0; i < this.buffDurations.length; i++) {
      if (this.buffDurations[i] > 0) {
        this.buffDurations[i]--;
        if (this.buffDurations[i] <= 0) {
          this.buffs[i] = BuffFlag.NONE;
        }
      }
    }
  }

  countNeighbors(x: number, y: number, state: CellState): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (this.inBounds(nx, ny) && this.cells[this.idx(nx, ny)] === state) {
          count++;
        }
      }
    }
    return count;
  }

  countRed(): number {
    let count = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CellState.RED) count++;
    }
    return count;
  }

  countBlue(): number {
    let count = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CellState.BLUE) count++;
    }
    return count;
  }

  getCellsArray(): Uint8Array {
    return this.cells;
  }

  getTerrainArray(): Uint8Array {
    return this.terrain;
  }

  getBuffsArray(): Uint8Array {
    return this.buffs;
  }

  getBuffDurationsArray(): Int16Array {
    return this.buffDurations;
  }

  setCellsFromBuffer(buffer: Uint8Array): void {
    this.cells.set(buffer);
  }

  setBuffsFromBuffer(buffer: Uint8Array): void {
    this.buffs.set(buffer);
  }

  setBuffDurationsFromBuffer(buffer: Int16Array): void {
    this.buffDurations.set(buffer);
  }

  clear(): void {
    this.cells.fill(0);
    this.terrain.fill(0);
    this.buffs.fill(0);
    this.buffDurations.fill(0);
  }

  clone(): Grid {
    const g = new Grid({ width: this.width, height: this.height });
    g.cells.set(this.cells);
    g.terrain.set(this.terrain);
    g.buffs.set(this.buffs);
    g.buffDurations.set(this.buffDurations);
    return g;
  }

  placeCellsRandom(density: number = 0.3): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (Math.random() < density) {
          const state = Math.random() < 0.5 ? CellState.RED : CellState.BLUE;
          this.setCell(x, y, state);
        }
      }
    }
  }

  /** Create initial pattern - symmetric factions */
  placeInitialPattern(): void {
    const hw = Math.floor(this.width / 2);
    const density = 0.25;

    // Red on left half
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < hw - 5; x++) {
        if (Math.random() < density) {
          this.setCell(x, y, CellState.RED);
        }
      }
    }

    // Blue on right half
    for (let y = 0; y < this.height; y++) {
      for (let x = hw + 5; x < this.width; x++) {
        if (Math.random() < density) {
          this.setCell(x, y, CellState.BLUE);
        }
      }
    }
  }

  // ==================== Serialization ====================

  toJSON(): MapData {
    return {
      width: this.width,
      height: this.height,
      cells: Array.from(this.cells),
      terrain: Array.from(this.terrain),
      version: '1.0.0',
    };
  }

  static fromJSON(data: MapData): Grid {
    const grid = new Grid({ width: data.width, height: data.height });
    grid.cells.set(new Uint8Array(data.cells));
    grid.terrain.set(new Uint8Array(data.terrain));
    return grid;
  }

  exportJSON(): string {
    return JSON.stringify(this.toJSON());
  }

  static importJSON(json: string): Grid {
    const data = JSON.parse(json) as MapData;
    return Grid.fromJSON(data);
  }

  // ==================== Diff operations ====================

  createDiffSnapshot(): { cells: Uint8Array; terrain: Uint8Array; buffs: Uint8Array; buffDurations: Int16Array } {
    return {
      cells: new Uint8Array(this.cells),
      terrain: new Uint8Array(this.terrain),
      buffs: new Uint8Array(this.buffs),
      buffDurations: new Int16Array(this.buffDurations),
    };
  }

  restoreFromSnapshot(snapshot: { cells: Uint8Array; terrain: Uint8Array; buffs: Uint8Array; buffDurations: Int16Array }): void {
    this.cells.set(snapshot.cells);
    this.terrain.set(snapshot.terrain);
    this.buffs.set(snapshot.buffs);
    this.buffDurations.set(snapshot.buffDurations);
  }
}
