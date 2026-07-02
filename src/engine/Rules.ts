// ============================================================
// Rules.ts - Game of Life rules with faction support
// ============================================================

import { CellState, TerrainType, BuffFlag, SimulationConfig, DEFAULT_CONFIG } from '../Types';

export class Rules {
  /**
   * Count neighbors of a specific cell state using direct array access for performance
   */
  static countNeighbors(
    cells: Uint8Array,
    x: number,
    y: number,
    width: number,
    height: number,
    state: CellState
  ): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (cells[ny * width + nx] === state) {
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Get effective birth count considering terrain modifiers
   */
  static getEffectiveBirthCount(baseBirthCount: number, terrain: TerrainType): number {
    switch (terrain) {
      case TerrainType.SWAMP:
        return baseBirthCount + 1; // Swamp requires more neighbors to reproduce
      default:
        return baseBirthCount;
    }
  }

  /**
   * Get effective survival max considering buffs
   */
  static getEffectiveSurvivalMax(
    baseMax: number,
    buff: BuffFlag
  ): number {
    switch (buff) {
      case BuffFlag.GENE_BOOST:
        return baseMax + 1; // Gene boost allows surviving with 4 neighbors
      default:
        return baseMax;
    }
  }

  /**
   * Compute the next state of a single cell
   */
  static computeCell(
    cells: Uint8Array,
    terrain: Uint8Array,
    buffs: Uint8Array,
    x: number,
    y: number,
    width: number,
    height: number,
    config: SimulationConfig = DEFAULT_CONFIG
  ): CellState {
    const idx = y * width + x;
    const current = cells[idx] as CellState;
    const cellTerrain = terrain[idx] as TerrainType;
    const cellBuff = buffs[idx] as BuffFlag;

    // Walls never change
    if (cellTerrain === TerrainType.WALL) {
      return CellState.EMPTY;
    }

    const redNeighbors = Rules.countNeighbors(cells, x, y, width, height, CellState.RED);
    const blueNeighbors = Rules.countNeighbors(cells, x, y, width, height, CellState.BLUE);

    if (current !== CellState.EMPTY) {
      // === Survival check ===
      const sameColorNeighbors =
        current === CellState.RED ? redNeighbors : blueNeighbors;
      const effectiveMax = Rules.getEffectiveSurvivalMax(config.survivalMax, cellBuff);

      if (sameColorNeighbors < config.survivalMin || sameColorNeighbors > effectiveMax) {
        return CellState.EMPTY; // Death by isolation or overcrowding
      }
      return current; // Survives
    } else {
      // === Reproduction check ===
      const effectiveBirth = Rules.getEffectiveBirthCount(config.birthCount, cellTerrain);

      const canRedBirth = redNeighbors === effectiveBirth;
      const canBlueBirth = blueNeighbors === effectiveBirth;

      if (canRedBirth && canBlueBirth) {
        // Conflict: more neighbors wins
        if (redNeighbors > blueNeighbors) return CellState.RED;
        if (blueNeighbors > redNeighbors) return CellState.BLUE;
        // Equal: random
        return Math.random() < 0.5 ? CellState.RED : CellState.BLUE;
      }

      if (canRedBirth) return CellState.RED;
      if (canBlueBirth) return CellState.BLUE;

      return CellState.EMPTY;
    }
  }

  /**
   * Compute the entire next generation using typed arrays
   * Returns new cells array
   */
  static computeNextGeneration(
    cells: Uint8Array,
    terrain: Uint8Array,
    buffs: Uint8Array,
    width: number,
    height: number,
    config: SimulationConfig = DEFAULT_CONFIG
  ): Uint8Array {
    const size = width * height;
    const newCells = new Uint8Array(size);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cellTerrain = terrain[idx] as TerrainType;

        if (cellTerrain === TerrainType.WALL) {
          newCells[idx] = CellState.EMPTY;
          continue;
        }

        newCells[idx] = Rules.computeCell(
          cells, terrain, buffs, x, y, width, height, config
        );
      }
    }

    return newCells;
  }

  /**
   * Compute next generation and track changes (diffs)
   */
  static computeWithDiffs(
    cells: Uint8Array,
    terrain: Uint8Array,
    buffs: Uint8Array,
    width: number,
    height: number,
    config: SimulationConfig = DEFAULT_CONFIG
  ): { newCells: Uint8Array; changeIndices: number[]; oldValues: number[] } {
    const size = width * height;
    const newCells = new Uint8Array(size);
    const changeIndices: number[] = [];
    const oldValues: number[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cellTerrain = terrain[idx] as TerrainType;

        let newState: CellState;
        if (cellTerrain === TerrainType.WALL) {
          newState = CellState.EMPTY;
        } else {
          newState = Rules.computeCell(
            cells, terrain, buffs, x, y, width, height, config
          );
        }

        if (newState !== cells[idx]) {
          changeIndices.push(idx);
          oldValues.push(cells[idx]);
        }
        newCells[idx] = newState;
      }
    }

    return { newCells, changeIndices, oldValues };
  }

  /**
   * Count cells by faction
   */
  static countCells(cells: Uint8Array): { red: number; blue: number; empty: number } {
    let red = 0, blue = 0, empty = 0;
    for (let i = 0; i < cells.length; i++) {
      switch (cells[i]) {
        case CellState.RED: red++; break;
        case CellState.BLUE: blue++; break;
        default: empty++; break;
      }
    }
    return { red, blue, empty };
  }

  /**
   * Find the highest density zone for a faction
   */
  static findHighestDensityZone(
    cells: Uint8Array,
    faction: CellState,
    width: number,
    height: number,
    zoneSize: number = 10
  ): { x: number; y: number; count: number } {
    let bestX = 0, bestY = 0, bestCount = 0;
    const halfZone = Math.floor(zoneSize / 2);

    for (let y = halfZone; y < height - halfZone; y += halfZone) {
      for (let x = halfZone; x < width - halfZone; x += halfZone) {
        let count = 0;
        for (let dy = -halfZone; dy < halfZone; dy++) {
          for (let dx = -halfZone; dx < halfZone; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (cells[ny * width + nx] === faction) count++;
            }
          }
        }
        if (count > bestCount) {
          bestCount = count;
          bestX = x;
          bestY = y;
        }
      }
    }

    return { x: bestX, y: bestY, count: bestCount };
  }
}
