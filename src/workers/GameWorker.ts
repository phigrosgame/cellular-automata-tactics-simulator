// ============================================================
// GameWorker.ts - Web Worker for async computation
// ============================================================

import { CellState, TerrainType, BuffFlag, SimulationConfig, DEFAULT_CONFIG } from '../Types';

interface ComputeRequest {
  id: number;
  cells: Uint8Array;
  terrain: Uint8Array;
  buffs: Uint8Array;
  buffDurations: Int16Array;
  width: number;
  height: number;
  config: SimulationConfig;
}

// ---- Inline Rules for Worker context ----

function countNeighbors(
  cells: Uint8Array,
  x: number, y: number,
  width: number, height: number,
  state: CellState
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (cells[ny * width + nx] === state) count++;
      }
    }
  }
  return count;
}

function computeCell(
  cells: Uint8Array,
  terrain: Uint8Array,
  buffs: Uint8Array,
  x: number, y: number,
  width: number, height: number,
  config: SimulationConfig
): CellState {
  const idx = y * width + x;
  const current = cells[idx] as CellState;
  const cellTerrain = terrain[idx] as TerrainType;
  const cellBuff = buffs[idx] as BuffFlag;

  if (cellTerrain === TerrainType.WALL) return CellState.EMPTY;

  const redN = countNeighbors(cells, x, y, width, height, CellState.RED);
  const blueN = countNeighbors(cells, x, y, width, height, CellState.BLUE);

  if (current !== CellState.EMPTY) {
    const sameN = current === CellState.RED ? redN : blueN;
    const effMax = cellBuff === BuffFlag.GENE_BOOST ? config.survivalMax + 1 : config.survivalMax;
    if (sameN < config.survivalMin || sameN > effMax) return CellState.EMPTY;
    return current;
  } else {
    const effBirth = cellTerrain === TerrainType.SWAMP ? config.birthCount + 1 : config.birthCount;
    const canRed = redN === effBirth;
    const canBlue = blueN === effBirth;
    if (canRed && canBlue) {
      if (redN > blueN) return CellState.RED;
      if (blueN > redN) return CellState.BLUE;
      return Math.random() < 0.5 ? CellState.RED : CellState.BLUE;
    }
    if (canRed) return CellState.RED;
    if (canBlue) return CellState.BLUE;
    return CellState.EMPTY;
  }
}

function computeNextGeneration(req: ComputeRequest): {
  newCells: Uint8Array;
  newBuffs: Uint8Array;
  newBuffDurations: Int16Array;
  changes: Uint8Array;
  redCount: number;
  blueCount: number;
} {
  const { cells, terrain, buffs, buffDurations, width, height, config } = req;
  const size = width * height;
  const newCells = new Uint8Array(size);
  const newBuffs = new Uint8Array(buffs);
  const newBuffDurations = new Int16Array(buffDurations);

  // Track changes as interleaved [idx, oldVal, newVal, ...]
  const changesList: number[] = [];
  let redCount = 0;
  let blueCount = 0;

  // Tick buffs
  for (let i = 0; i < size; i++) {
    if (newBuffDurations[i] > 0) {
      newBuffDurations[i]--;
      if (newBuffDurations[i] <= 0) {
        newBuffs[i] = BuffFlag.NONE;
      }
    }
  }

  // Compute next generation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const newState = computeCell(cells, terrain, buffs, x, y, width, height, config);

      if (newState !== cells[idx]) {
        changesList.push(idx, cells[idx], newState);
      }

      newCells[idx] = newState;
      if (newState === CellState.RED) redCount++;
      else if (newState === CellState.BLUE) blueCount++;
    }
  }

  const changes = new Uint8Array(changesList);

  return { newCells, newBuffs, newBuffDurations, changes, redCount, blueCount };
}

// ---- Worker message handler ----

self.onmessage = function (e: MessageEvent) {
  const data = e.data;

  if (data.type === 'compute') {
    const startTime = performance.now();

    const req: ComputeRequest = {
      id: data.id,
      cells: new Uint8Array(data.cells),
      terrain: new Uint8Array(data.terrain),
      buffs: new Uint8Array(data.buffs),
      buffDurations: new Int16Array(data.buffDurations),
      width: data.width,
      height: data.height,
      config: data.config || DEFAULT_CONFIG,
    };

    const result = computeNextGeneration(req);
    const computeTime = performance.now() - startTime;

    // Transfer buffers back to main thread
    self.postMessage(
      {
        id: data.id,
        type: 'result',
        cells: result.newCells.buffer,
        buffs: result.newBuffs.buffer,
        buffDurations: result.newBuffDurations.buffer,
        changes: result.changes.buffer,
        redCount: result.redCount,
        blueCount: result.blueCount,
        computeTime,
      },
      [
        result.newCells.buffer,
        result.newBuffs.buffer,
        result.newBuffDurations.buffer,
        result.changes.buffer,
      ]
    );
  }
};
