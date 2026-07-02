// ============================================================
// SkillSystem.ts - Tactical skills with cooldown management
// ============================================================

import { Grid } from '../engine/Grid';
import {
  CellState, TerrainType, SkillType, SkillConfig, SkillInstance,
  SKILL_CONFIGS
} from '../Types';

export interface SkillTarget {
  x: number;
  y: number;
}

export class SkillSystem {
  private skills: Map<SkillType, SkillInstance> = new Map();
  private activeFaction: CellState = CellState.RED;

  constructor() {
    for (const key of Object.values(SkillType)) {
      const config = SKILL_CONFIGS[key];
      this.skills.set(key, { ...config, currentCooldown: 0 });
    }
  }

  setActiveFaction(faction: CellState): void {
    this.activeFaction = faction;
  }

  getActiveFaction(): CellState {
    return this.activeFaction;
  }

  getSkill(type: SkillType): SkillInstance | undefined {
    return this.skills.get(type);
  }

  getAllSkills(): SkillInstance[] {
    return Array.from(this.skills.values());
  }

  canUse(type: SkillType): boolean {
    const skill = this.skills.get(type);
    return skill !== undefined && skill.currentCooldown <= 0;
  }

  /**
   * Tick all cooldowns down by 1
   */
  tickCooldowns(): void {
    for (const skill of this.skills.values()) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    }
  }

  /**
   * Execute a skill at the target position
   * Returns true if the skill was successfully executed
   */
  executeSkill(type: SkillType, grid: Grid, target: SkillTarget): boolean {
    if (!this.canUse(type)) return false;

    const skill = this.skills.get(type)!;
    let success = false;

    switch (type) {
      case SkillType.METEOR:
        success = this.executeMeteor(grid, target);
        break;
      case SkillType.GENE_BOOST:
        success = this.executeGeneBoost(grid, target);
        break;
      case SkillType.SWAMP_TERRAIN:
        success = this.executeSwamp(grid, target);
        break;
    }

    if (success) {
      skill.currentCooldown = skill.cooldown;
    }

    return success;
  }

  /**
   * Meteor Strike: Clear all cells within radius 5
   */
  private executeMeteor(grid: Grid, target: SkillTarget): boolean {
    const RADIUS = 5;
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        if (dx * dx + dy * dy <= RADIUS * RADIUS) {
          const x = target.x + dx;
          const y = target.y + dy;
          if (grid.inBounds(x, y) && grid.getTerrain(x, y) !== TerrainType.WALL) {
            grid.setCell(x, y, CellState.EMPTY);
          }
        }
      }
    }
    return true;
  }

  /**
   * Gene Boost: 3x3 area friendly cells survive with up to 4 neighbors for 20 ticks
   */
  private executeGeneBoost(grid: Grid, target: SkillTarget): boolean {
    let applied = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = target.x + dx;
        const y = target.y + dy;
        if (grid.inBounds(x, y)) {
          const cell = grid.getCell(x, y);
          if (cell === this.activeFaction) {
            grid.setBuff(x, y, 1 /* GENE_BOOST */, 20);
            applied = true;
          }
        }
      }
    }
    return applied;
  }

  /**
   * Swamp: Convert 5x5 area to swamp terrain
   */
  private executeSwamp(grid: Grid, target: SkillTarget): boolean {
    let applied = false;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = target.x + dx;
        const y = target.y + dy;
        if (grid.inBounds(x, y)) {
          if (grid.getTerrain(x, y) !== TerrainType.WALL) {
            grid.setTerrain(x, y, TerrainType.SWAMP);
            applied = true;
          }
        }
      }
    }
    return applied;
  }

  /**
   * Force set cooldown (for macro system)
   */
  setCooldown(type: SkillType, value: number): void {
    const skill = this.skills.get(type);
    if (skill) skill.currentCooldown = value;
  }

  /**
   * Reset all cooldowns
   */
  resetAll(): void {
    for (const skill of this.skills.values()) {
      skill.currentCooldown = 0;
    }
  }
}
