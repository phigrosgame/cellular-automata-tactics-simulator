// ============================================================
// MacroEngine.ts - Gene macro script parser & executor
// ============================================================

import { Game } from '../Game';
import { CellState, SkillType, MacroRule, MacroCondition, MacroAction } from '../Types';
import { Rules } from '../engine/Rules';

interface MacroContext {
  redCells: number;
  blueCells: number;
  totalCells: number;
  tick: number;
  meteorCooldown: number;
  geneBoostCooldown: number;
  swampCooldown: number;
}

export class MacroEngine {
  private rules: MacroRule[] = [];
  private rawScript: string = '';
  private enabled: boolean = false;
  private executionLog: string[] = [];
  private maxLogSize: number = 100;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getScript(): string {
    return this.rawScript;
  }

  getLog(): string[] {
    return this.executionLog;
  }

  /**
   * Parse a macro script into executable rules
   */
  parseScript(script: string): boolean {
    this.rawScript = script;
    this.rules = [];
    this.executionLog = [];

    const lines = script.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

    for (const line of lines) {
      try {
        const rule = this.parseLine(line);
        if (rule) this.rules.push(rule);
      } catch (e) {
        this.log(`Parse error: ${line} - ${e}`);
        return false;
      }
    }

    this.log(`Parsed ${this.rules.length} rule(s)`);
    return true;
  }

  /**
   * Parse a single line like:
   * IF blue_cells > 60% AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
   */
  private parseLine(line: string): MacroRule | null {
    const upper = line.toUpperCase();

    // Match pattern: IF <conditions> THEN <action>
    const ifMatch = upper.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/);
    if (!ifMatch) return null;

    const conditionsStr = ifMatch[1];
    const actionStr = ifMatch[2];

    // Parse conditions (split by AND)
    const condParts = conditionsStr.split(/\s+AND\s+/);
    const conditions: MacroCondition[] = condParts.map(part => {
      const trimmed = part.trim();
      // Match: <left> <operator> <right>
      const condMatch = trimmed.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);
      if (!condMatch) throw new Error(`Invalid condition: ${trimmed}`);
      return {
        left: condMatch[1].toLowerCase(),
        operator: condMatch[2],
        right: condMatch[3].trim(),
      };
    });

    // Parse action: CAST <skill> AT <target>
    const actionMatch = actionStr.match(/^CAST\s+(\w+)\s+AT\s+(\w+)$/);
    if (!actionMatch) throw new Error(`Invalid action: ${actionStr}`);

    const action: MacroAction = {
      type: 'cast',
      target: actionMatch[2].toLowerCase(),
      params: { skill: actionMatch[1].toLowerCase() },
    };

    return { conditions, action };
  }

  /**
   * Execute all rules against current game state
   */
  executeRules(game: Game): void {
    if (!this.enabled || this.rules.length === 0) return;

    const ctx = this.buildContext(game);

    for (const rule of this.rules) {
      if (this.evaluateConditions(rule.conditions, ctx)) {
        this.executeAction(rule.action, game, ctx);
      }
    }
  }

  /**
   * Build evaluation context from game state
   */
  private buildContext(game: Game): MacroContext {
    const grid = game.getGrid();
    const cells = grid.getCellsArray();
    const counts = Rules.countCells(cells);
    const total = counts.red + counts.blue + counts.empty;
    const skillSystem = game.getSkillSystem();

    return {
      redCells: counts.red,
      blueCells: counts.blue,
      totalCells: total,
      tick: game.getTick(),
      meteorCooldown: skillSystem.getSkill(SkillType.METEOR)?.currentCooldown ?? 999,
      geneBoostCooldown: skillSystem.getSkill(SkillType.GENE_BOOST)?.currentCooldown ?? 999,
      swampCooldown: skillSystem.getSkill(SkillType.SWAMP_TERRAIN)?.currentCooldown ?? 999,
    };
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: MacroCondition[], ctx: MacroContext): boolean {
    for (const cond of conditions) {
      const left = this.resolveValue(cond.left, ctx);
      const right = this.resolveValue(cond.right, ctx);

      if (!this.compare(left, cond.operator, right)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Resolve a value reference to a number
   */
  private resolveValue(ref: string, ctx: MacroContext): number {
    const trimmed = ref.trim().toLowerCase();

    // Check for percentage (e.g., "60%")
    if (trimmed.endsWith('%')) {
      return parseFloat(trimmed) / 100;
    }

    // Named values
    switch (trimmed) {
      case 'red_cells': return ctx.redCells;
      case 'blue_cells': return ctx.blueCells;
      case 'total_cells': return ctx.totalCells;
      case 'tick': return ctx.tick;
      case 'meteor_cooldown': return ctx.meteorCooldown;
      case 'gene_boost_cooldown': return ctx.geneBoostCooldown;
      case 'swamp_cooldown': return ctx.swampCooldown;
      case 'red_ratio': return ctx.totalCells > 0 ? ctx.redCells / ctx.totalCells : 0;
      case 'blue_ratio': return ctx.totalCells > 0 ? ctx.blueCells / ctx.totalCells : 0;
      default: return parseFloat(trimmed) || 0;
    }
  }

  /**
   * Compare two values with operator
   */
  private compare(left: number, operator: string, right: number): boolean {
    switch (operator) {
      case '==': return left === right;
      case '!=': return left !== right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      default: return false;
    }
  }

  /**
   * Execute an action
   */
  private executeAction(action: MacroAction, game: Game, ctx: MacroContext): void {
    if (action.type !== 'cast' || !action.params) return;

    const skillName = action.params.skill;
    const skillType = this.resolveSkillType(skillName);
    if (!skillType) {
      this.log(`Unknown skill: ${skillName}`);
      return;
    }

    const skillSystem = game.getSkillSystem();
    if (!skillSystem.canUse(skillType)) {
      this.log(`Skill ${skillName} on cooldown`);
      return;
    }

    // Determine target
    let targetX: number, targetY: number;
    const grid = game.getGrid();

    if (action.target === 'highest_density_zone') {
      const zone = Rules.findHighestDensityZone(
        grid.getCellsArray(), CellState.RED, grid.width, grid.height, 10
      );
      targetX = zone.x;
      targetY = zone.y;
    } else if (action.target === 'center') {
      targetX = Math.floor(grid.width / 2);
      targetY = Math.floor(grid.height / 2);
    } else {
      targetX = Math.floor(grid.width / 2);
      targetY = Math.floor(grid.height / 2);
    }

    const success = skillSystem.executeSkill(skillType, grid, { x: targetX, y: targetY });
    if (success) {
      this.log(`Executed: CAST ${skillName} AT (${targetX}, ${targetY})`);
    }
  }

  private resolveSkillType(name: string): SkillType | null {
    switch (name) {
      case 'meteor': return SkillType.METEOR;
      case 'gene_boost': case 'geneboost': return SkillType.GENE_BOOST;
      case 'swamp': return SkillType.SWAMP_TERRAIN;
      default: return null;
    }
  }

  private log(msg: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.executionLog.push(`[${timestamp}] ${msg}`);
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog.shift();
    }
  }

  /**
   * Get a default example script
   */
  static getExampleScript(): string {
    return `// Gene Macro Script Example
// Conditions: IF blue_ratio > 0.4 AND meteor_cooldown == 0
// Action: CAST meteor AT highest_density_zone
IF blue_ratio > 0.4 AND meteor_cooldown == 0 THEN CAST meteor AT highest_density_zone
IF red_cells < 500 AND gene_boost_cooldown == 0 THEN CAST gene_boost AT center`;
  }
}
