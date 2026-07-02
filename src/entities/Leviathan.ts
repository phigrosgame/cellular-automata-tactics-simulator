// ============================================================
// Leviathan.ts - Boss entity with A* pathfinding
// ============================================================

import { Grid } from '../engine/Grid';
import { CellState, TerrainType, LeviathanState } from '../Types';
import { Rules } from '../engine/Rules';

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

export class Leviathan {
  private state: LeviathanState;
  private pathRecalcInterval: number = 5;
  private tickCounter: number = 0;

  constructor(x: number, y: number) {
    this.state = {
      x, y,
      size: 3,
      hp: 100,
      maxHp: 100,
      targetX: x,
      targetY: y,
      alive: true,
      path: [],
      moveTimer: 0,
    };
  }

  getState(): LeviathanState {
    return { ...this.state };
  }

  isAlive(): boolean {
    return this.state.alive;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  /**
   * Update Leviathan: find target, pathfind, move, consume cells
   */
  update(grid: Grid): void {
    if (!this.state.alive) return;

    this.tickCounter++;

    // Find target: highest density zone
    if (this.tickCounter % this.pathRecalcInterval === 0 || this.state.path.length === 0) {
      this.findTarget(grid);
      this.calculatePath(grid);
    }

    // Move along path
    if (this.state.path.length > 0) {
      this.moveAlongPath(grid);
    }

    // Consume cells at current position
    this.consumeCells(grid);

    // HP decay
    this.state.hp = Math.max(0, this.state.hp - 0.1);
    if (this.state.hp <= 0) {
      this.state.alive = false;
    }
  }

  /**
   * Find the target area (highest cell density)
   */
  private findTarget(grid: Grid): void {
    const cells = grid.getCellsArray();
    const density = Rules.findHighestDensityZone(cells, CellState.EMPTY, grid.width, grid.height, 15);
    
    // Actually find the zone with most living cells (both colors)
    let bestX = 0, bestY = 0, bestCount = 0;
    const zoneSize = 15;
    const halfZone = Math.floor(zoneSize / 2);
    const stepSize = Math.max(1, Math.floor(zoneSize / 2));

    for (let y = halfZone; y < grid.height - halfZone; y += stepSize) {
      for (let x = halfZone; x < grid.width - halfZone; x += stepSize) {
        let count = 0;
        for (let dy = -halfZone; dy < halfZone; dy++) {
          for (let dx = -halfZone; dx < halfZone; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
              const cell = cells[ny * grid.width + nx];
              if (cell !== CellState.EMPTY) count++;
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

    this.state.targetX = bestX;
    this.state.targetY = bestY;
  }

  /**
   * A* pathfinding from current position to target
   */
  private calculatePath(grid: Grid): void {
    const startX = this.state.x;
    const startY = this.state.y;
    const goalX = this.state.targetX;
    const goalY = this.state.targetY;

    // A* implementation
    const openSet: AStarNode[] = [];
    const closedSet = new Set<number>();
    const idx = (x: number, y: number) => y * grid.width + x;

    const heuristic = (x: number, y: number): number => {
      return Math.abs(x - goalX) + Math.abs(y - goalY);
    };

    const startNode: AStarNode = {
      x: startX, y: startY,
      g: 0, h: heuristic(startX, startY),
      f: heuristic(startX, startY),
      parent: null,
    };
    openSet.push(startNode);

    let iterations = 0;
    const maxIterations = 2000; // Limit search for performance

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest f
      let lowestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
      }
      const current = openSet.splice(lowestIdx, 1)[0];

      // Check if we reached the goal (within size radius)
      if (Math.abs(current.x - goalX) <= 2 && Math.abs(current.y - goalY) <= 2) {
        // Reconstruct path
        const path: Array<{ x: number; y: number }> = [];
        let node: AStarNode | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        this.state.path = path;
        return;
      }

      closedSet.add(idx(current.x, current.y));

      // Explore neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = current.x + dx;
          const ny = current.y + dy;

          if (!grid.inBounds(nx, ny)) continue;
          if (closedSet.has(idx(nx, ny))) continue;

          // Can't pass through walls
          if (grid.getTerrain(nx, ny) === TerrainType.WALL) continue;

          const g = current.g + (dx !== 0 && dy !== 0 ? 1.414 : 1);
          const h = heuristic(nx, ny);
          const f = g + h;

          const existing = openSet.find(n => n.x === nx && n.y === ny);
          if (existing) {
            if (g < existing.g) {
              existing.g = g;
              existing.f = f;
              existing.parent = current;
            }
          } else {
            openSet.push({ x: nx, y: ny, g, h, f, parent: current });
          }
        }
      }
    }

    // If no path found, just move directly toward target
    this.state.path = [{ x: goalX, y: goalY }];
  }

  /**
   * Move one step along the path
   */
  private moveAlongPath(grid: Grid): void {
    if (this.state.path.length <= 1) return;

    // Move toward next waypoint
    const next = this.state.path[1];
    const dx = Math.sign(next.x - this.state.x);
    const dy = Math.sign(next.y - this.state.y);

    const newX = this.state.x + dx;
    const newY = this.state.y + dy;

    // Check bounds and walls for entire 3x3 body
    if (this.canMoveTo(grid, newX, newY)) {
      this.state.x = newX;
      this.state.y = newY;

      // Remove passed waypoints
      if (this.state.path.length > 0) {
        const wp = this.state.path[0];
        if (wp.x === newX && wp.y === newY) {
          this.state.path.shift();
        }
      }
    } else {
      // Recalculate path
      this.state.path = [];
    }
  }

  /**
   * Check if the 3x3 body can move to a position
   */
  private canMoveTo(grid: Grid, x: number, y: number): boolean {
    for (let dy = 0; dy < this.state.size; dy++) {
      for (let dx = 0; dx < this.state.size; dx++) {
        const cx = x + dx;
        const cy = y + dy;
        if (!grid.inBounds(cx, cy)) return false;
        if (grid.getTerrain(cx, cy) === TerrainType.WALL) return false;
      }
    }
    return true;
  }

  /**
   * Consume cells under the Leviathan body
   */
  private consumeCells(grid: Grid): void {
    for (let dy = 0; dy < this.state.size; dy++) {
      for (let dx = 0; dx < this.state.size; dx++) {
        const cx = this.state.x + dx;
        const cy = this.state.y + dy;
        if (grid.inBounds(cx, cy)) {
          const cell = grid.getCell(cx, cy);
          if (cell !== CellState.EMPTY) {
            grid.setCell(cx, cy, CellState.EMPTY);
            this.state.hp = Math.min(this.state.maxHp, this.state.hp + 2);
          }
        }
      }
    }
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): void {
    this.state.hp = Math.max(0, this.state.hp - amount);
    if (this.state.hp <= 0) {
      this.state.alive = false;
    }
  }

  /**
   * Reset state
   */
  reset(x: number, y: number): void {
    this.state = {
      x, y,
      size: 3,
      hp: 100,
      maxHp: 100,
      targetX: x,
      targetY: y,
      alive: true,
      path: [],
      moveTimer: 0,
    };
    this.tickCounter = 0;
  }
}
