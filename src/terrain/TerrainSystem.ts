// ============================================================
// TerrainSystem.ts - Terrain management & serialization
// ============================================================

import { Grid } from '../engine/Grid';
import { TerrainType, MapData } from '../Types';

export class TerrainSystem {
  /**
   * Add a wall at position
   */
  static addWall(grid: Grid, x: number, y: number): void {
    if (grid.inBounds(x, y)) {
      grid.setTerrain(x, y, TerrainType.WALL);
      grid.setCell(x, y, 0); // Clear any cell
    }
  }

  /**
   * Add a wall segment
   */
  static addWallLine(grid: Grid, x1: number, y1: number, x2: number, y2: number): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let cx = x1, cy = y1;

    while (true) {
      TerrainSystem.addWall(grid, cx, cy);
      if (cx === x2 && cy === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }

  /**
   * Add a wall rectangle
   */
  static addWallRect(grid: Grid, x: number, y: number, w: number, h: number): void {
    for (let i = 0; i < w; i++) {
      TerrainSystem.addWall(grid, x + i, y);
      TerrainSystem.addWall(grid, x + i, y + h - 1);
    }
    for (let j = 0; j < h; j++) {
      TerrainSystem.addWall(grid, x, y + j);
      TerrainSystem.addWall(grid, x + w - 1, y + j);
    }
  }

  /**
   * Add swamp area
   */
  static addSwamp(grid: Grid, x: number, y: number, w: number, h: number): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const cx = x + dx;
        const cy = y + dy;
        if (grid.inBounds(cx, cy) && grid.getTerrain(cx, cy) !== TerrainType.WALL) {
          grid.setTerrain(cx, cy, TerrainType.SWAMP);
        }
      }
    }
  }

  /**
   * Remove terrain at position
   */
  static clearTerrain(grid: Grid, x: number, y: number): void {
    if (grid.inBounds(x, y)) {
      grid.setTerrain(x, y, TerrainType.NORMAL);
    }
  }

  /**
   * Generate random terrain features
   */
  static generateRandomTerrain(grid: Grid, wallCount: number = 5, swampCount: number = 3): void {
    // Add random wall segments
    for (let i = 0; i < wallCount; i++) {
      const x1 = Math.floor(Math.random() * grid.width);
      const y1 = Math.floor(Math.random() * grid.height);
      const x2 = Math.min(grid.width - 1, x1 + Math.floor(Math.random() * 20) - 10);
      const y2 = Math.min(grid.height - 1, y1 + Math.floor(Math.random() * 20) - 10);
      TerrainSystem.addWallLine(grid, Math.max(0, x1), Math.max(0, y1), Math.max(0, x2), Math.max(0, y2));
    }

    // Add random swamp areas
    for (let i = 0; i < swampCount; i++) {
      const x = Math.floor(Math.random() * (grid.width - 10));
      const y = Math.floor(Math.random() * (grid.height - 10));
      const w = 5 + Math.floor(Math.random() * 10);
      const h = 5 + Math.floor(Math.random() * 10);
      TerrainSystem.addSwamp(grid, x, y, w, h);
    }
  }

  /**
   * Export map to JSON string
   */
  static exportMap(grid: Grid): string {
    return grid.exportJSON();
  }

  /**
   * Import map from JSON string
   */
  static importMap(json: string): Grid | null {
    try {
      return Grid.importJSON(json);
    } catch {
      console.error('Failed to parse map JSON');
      return null;
    }
  }

  /**
   * Validate map data
   */
  static validateMap(data: MapData): boolean {
    if (!data.width || !data.height) return false;
    if (!data.cells || data.cells.length !== data.width * data.height) return false;
    if (!data.terrain || data.terrain.length !== data.width * data.height) return false;
    return true;
  }
}
