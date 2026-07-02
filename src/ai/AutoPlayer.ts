// ============================================================
// AutoPlayer.ts - Autonomous spectator/competitor AI
// ============================================================
//
// "Spectator mode" - the AI plays both factions, choosing where to
// drop cells and which skills to cast based on the live game state.
//
// Strategy (lightweight + entertaining):
//   - Every N ticks, look at the cell density heatmap
//   - For the leading faction, reinforce the densest zone
//     (drop friendly cells + Gene Boost if available)
//   - For the trailing faction, harass the enemy: drop enemy cells
//     in their weakest gap, throw Meteor at their densest zone
//   - Sprinkle Swamp between the two fronts to slow reinforcement
//
// All decisions are logged so the UI can show "AI thinks...".

import { Grid } from '../engine/Grid';
import { Rules } from '../engine/Rules';
import { SkillSystem } from '../skills/SkillSystem';
import {
  CellState, TerrainType, SkillType,
} from '../Types';

export interface AutoPlayerDecision {
  tick: number;
  faction: CellState;
  action: 'place' | 'skill' | 'idle';
  skill?: SkillType;
  x: number;
  y: number;
  reason: string;
}

export interface AutoPlayerConfig {
  /** How often (in ticks) the AI makes a decision */
  decisionInterval: number;
  /** Probability of placing a cluster of cells per decision (0..1) */
  placeProbability: number;
  /** Probability of casting a skill per decision (0..1) */
  skillProbability: number;
  /** Search window radius for density scan */
  scanRadius: number;
}

export const DEFAULT_AUTO_CONFIG: AutoPlayerConfig = {
  decisionInterval: 6,
  placeProbability: 0.85,
  skillProbability: 0.35,
  scanRadius: 14,
};

export class AutoPlayer {
  private enabled = false;
  private config: AutoPlayerConfig;
  private decisionLog: AutoPlayerDecision[] = [];
  private maxLog = 50;
  private lastFaction: CellState = CellState.RED;
  private tickCounter = 0;

  // Stats
  private skillsCast = 0;
  private cellsPlaced = 0;

  constructor(config: Partial<AutoPlayerConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_CONFIG, ...config };
  }

  isEnabled(): boolean { return this.enabled; }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (enabled) {
      this.decisionLog.unshift({
        tick: 0,
        faction: CellState.RED,
        action: 'idle',
        x: 0,
        y: 0,
        reason: '🎬 觀眾模式啟動 — AI 接手操控',
      });
    } else {
      this.decisionLog.unshift({
        tick: 0,
        faction: CellState.RED,
        action: 'idle',
        x: 0,
        y: 0,
        reason: '⏸️ 觀眾模式關閉 — 玩家接手',
      });
    }
  }

  getConfig(): AutoPlayerConfig { return this.config; }

  updateConfig(patch: Partial<AutoPlayerConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  getLog(): AutoPlayerDecision[] { return this.decisionLog; }

  clearLog(): void {
    this.decisionLog = [];
    this.skillsCast = 0;
    this.cellsPlaced = 0;
  }

  getStats(): { skillsCast: number; cellsPlaced: number } {
    return { skillsCast: this.skillsCast, cellsPlaced: this.cellsPlaced };
  }

  /**
   * Called by Game every simulation tick (regardless of enabled -
   * we only act when enabled, but always tick the counter so the
   * interval is consistent).
   */
  onTick(
    tick: number,
    grid: Grid,
    skillSystem: SkillSystem,
  ): AutoPlayerDecision | null {
    this.tickCounter++;
    if (!this.enabled) return null;
    if (this.tickCounter % this.config.decisionInterval !== 0) return null;

    return this.makeDecision(tick, grid, skillSystem);
  }

  /**
   * Force a fresh decision right now (used by the "Run N ticks" button).
   */
  forceDecision(
    tick: number,
    grid: Grid,
    skillSystem: SkillSystem,
  ): AutoPlayerDecision {
    return this.makeDecision(tick, grid, skillSystem);
  }

  private makeDecision(
    tick: number,
    grid: Grid,
    skillSystem: SkillSystem,
  ): AutoPlayerDecision {
    // Decide which faction the AI "plays as" this round:
    // alternate so both get attention; if one is much weaker, favor them.
    const counts = Rules.countCells(grid.getCellsArray());
    const total = counts.red + counts.blue + counts.empty;
    const redRatio = total > 0 ? counts.red / total : 0.5;
    const blueRatio = total > 0 ? counts.blue / total : 0.5;
    const imbalance = Math.abs(redRatio - blueRatio);

    let faction: CellState;
    if (imbalance > 0.18 && Math.random() < 0.75) {
      // Boost the trailing faction
      faction = redRatio < blueRatio ? CellState.RED : CellState.BLUE;
    } else {
      faction = this.lastFaction === CellState.RED ? CellState.BLUE : CellState.RED;
    }
    this.lastFaction = faction;
    skillSystem.setActiveFaction(faction);

    const enemy = faction === CellState.RED ? CellState.BLUE : CellState.RED;

    const densestEnemy = Rules.findHighestDensityZone(
      grid.getCellsArray(), enemy, grid.width, grid.height, this.config.scanRadius
    );
    const densestFriendly = Rules.findHighestDensityZone(
      grid.getCellsArray(), faction, grid.width, grid.height, this.config.scanRadius
    );
    const emptiest = Rules.findHighestDensityZone(
      grid.getCellsArray(), CellState.EMPTY, grid.width, grid.height, this.config.scanRadius
    );

    // ---- 1. Maybe cast a skill ----
    if (Math.random() < this.config.skillProbability) {
      const skillChoice = this.chooseSkill(
        faction, enemy, grid, skillSystem, counts, imbalance
      );
      if (skillChoice) {
        const target = this.chooseSkillTarget(
          skillChoice.skill, faction, enemy, grid, densestEnemy, densestFriendly, emptiest
        );
        const ok = skillSystem.executeSkill(skillChoice.skill, grid, target);
        if (ok) {
          this.skillsCast++;
          const decision: AutoPlayerDecision = {
            tick, faction, action: 'skill',
            skill: skillChoice.skill, x: target.x, y: target.y,
            reason: skillChoice.reason,
          };
          this.pushDecision(decision);
          return decision;
        }
      }
    }

    // ---- 2. Maybe place cells ----
    if (Math.random() < this.config.placeProbability) {
      const dropPoint = this.chooseDropPoint(
        faction, enemy, grid, densestFriendly, emptiest, counts
      );
      if (dropPoint) {
        this.dropCluster(grid, dropPoint.x, dropPoint.y, faction);
        this.cellsPlaced += 9;
        const reason = this.dropReason(faction, dropPoint, counts);
        const decision: AutoPlayerDecision = {
          tick, faction, action: 'place',
          x: dropPoint.x, y: dropPoint.y, reason,
        };
        this.pushDecision(decision);
        return decision;
      }
    }

    // ---- 3. Idle ----
    const decision: AutoPlayerDecision = {
      tick, faction, action: 'idle',
      x: 0, y: 0,
      reason: '觀望局勢',
    };
    this.pushDecision(decision);
    return decision;
  }

  private chooseSkill(
    faction: CellState,
    enemy: CellState,
    grid: Grid,
    skills: SkillSystem,
    counts: { red: number; blue: number; empty: number },
    imbalance: number,
  ): { skill: SkillType; reason: string } | null {
    // Priority logic
    const candidates: { skill: SkillType; score: number; reason: string }[] = [];

    if (skills.canUse(SkillType.GENE_BOOST)) {
      // Strong when we have a cluster worth protecting
      const friendlyCount = faction === CellState.RED ? counts.red : counts.blue;
      const score = friendlyCount * (1 + imbalance);
      candidates.push({
        skill: SkillType.GENE_BOOST,
        score,
        reason: `🧬 強化我方密集區（${friendlyCount} 細胞）`,
      });
    }

    if (skills.canUse(SkillType.METEOR)) {
      // Strong when enemy is dominating
      const enemyCount = faction === CellState.RED ? counts.blue : counts.red;
      const score = enemyCount * (1 + imbalance * 2);
      candidates.push({
        skill: SkillType.METEOR,
        score,
        reason: `☄️ 隕石轟炸敵軍（${enemyCount} 細胞）`,
      });
    }

    if (skills.canUse(SkillType.SWAMP_TERRAIN)) {
      // Good mid-game territory denial
      candidates.push({
        skill: SkillType.SWAMP_TERRAIN,
        score: 40 + Math.random() * 30,
        reason: `🌿 部署沼澤切斷補給線`,
      });
    }

    if (candidates.length === 0) return null;

    // Add randomness so it's not predictable
    for (const c of candidates) c.score += Math.random() * 50;

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  private chooseSkillTarget(
    skill: SkillType,
    faction: CellState,
    enemy: CellState,
    grid: Grid,
    densestEnemy: { x: number; y: number; count: number },
    densestFriendly: { x: number; y: number; count: number },
    emptiest: { x: number; y: number; count: number },
  ): { x: number; y: number } {
    switch (skill) {
      case SkillType.METEOR:
        // Hit the densest enemy zone with a tiny random offset for variety
        return {
          x: this.clamp(densestEnemy.x + (Math.random() < 0.5 ? 0 : 1), 5, grid.width - 6),
          y: this.clamp(densestEnemy.y + (Math.random() < 0.5 ? 0 : 1), 5, grid.height - 6),
        };
      case SkillType.GENE_BOOST:
        return {
          x: this.clamp(densestFriendly.x, 1, grid.width - 2),
          y: this.clamp(densestFriendly.y, 1, grid.height - 2),
        };
      case SkillType.SWAMP_TERRAIN:
        // Place halfway between friendly and enemy fronts
        return {
          x: this.clamp(Math.floor((densestFriendly.x + densestEnemy.x) / 2), 2, grid.width - 3),
          y: this.clamp(Math.floor((densestFriendly.y + densestEnemy.y) / 2), 2, grid.height - 3),
        };
    }
  }

  private chooseDropPoint(
    faction: CellState,
    enemy: CellState,
    grid: Grid,
    densestFriendly: { x: number; y: number; count: number },
    emptiest: { x: number; y: number; count: number },
    counts: { red: number; blue: number; empty: number },
  ): { x: number; y: number } | null {
    // 70% reinforce our densest area, 30% seed a new empty zone to expand
    if (Math.random() < 0.7) {
      return {
        x: this.clamp(densestFriendly.x + this.randOffset(8), 3, grid.width - 4),
        y: this.clamp(densestFriendly.y + this.randOffset(8), 3, grid.height - 4),
      };
    }
    return {
      x: this.clamp(emptiest.x + this.randOffset(6), 3, grid.width - 4),
      y: this.clamp(emptiest.y + this.randOffset(6), 3, grid.height - 4),
    };
  }

  private dropReason(
    faction: CellState,
    drop: { x: number; y: number },
    counts: { red: number; blue: number; empty: number },
  ): string {
    const tag = faction === CellState.RED ? '🔴 紅軍' : '🔵 藍軍';
    const friendlyCount = faction === CellState.RED ? counts.red : counts.blue;
    if (counts.empty > (counts.red + counts.blue) * 2) {
      return `${tag} 擴張領地（空地 ${counts.empty} 格）`;
    }
    return `${tag} 增援前線（${friendlyCount} 細胞）`;
  }

  private dropCluster(grid: Grid, cx: number, cy: number, faction: CellState): void {
    // 3x3 brush, but skip walls
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (grid.inBounds(x, y) && grid.getTerrain(x, y) !== TerrainType.WALL) {
          grid.setCell(x, y, faction);
        }
      }
    }
  }

  private pushDecision(d: AutoPlayerDecision): void {
    this.decisionLog.unshift(d);
    if (this.decisionLog.length > this.maxLog) {
      this.decisionLog.length = this.maxLog;
    }
  }

  private clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
  }

  private randOffset(range: number): number {
    return Math.floor((Math.random() - 0.5) * 2 * range);
  }
}