// ============================================================
// Types.ts - Core type definitions and constants
// ============================================================

/** Cell states: Empty, Red faction, Blue faction */
export enum CellState {
  EMPTY = 0,
  RED = 1,
  BLUE = 2,
}

/** Terrain types */
export enum TerrainType {
  NORMAL = 0,
  WALL = 1,
  SWAMP = 2,
}

/** Buff flags (bitmask) */
export enum BuffFlag {
  NONE = 0,
  GENE_BOOST = 1,
}

/** Available skill types */
export enum SkillType {
  METEOR = 'meteor',
  GENE_BOOST = 'gene_boost',
  SWAMP_TERRAIN = 'swamp',
}

/** Grid topology */
export interface GridConfig {
  width: number;
  height: number;
}

/** Cell change diff for undo system */
export interface CellDiff {
  x: number;
  y: number;
  oldState: CellState;
  newState: CellState;
  oldTerrain: TerrainType;
  newTerrain: TerrainType;
  oldBuff: BuffFlag;
  newBuff: BuffFlag;
  oldBuffDuration: number;
  newBuffDuration: number;
}

/** Tick diff: all changes in one simulation tick */
export interface TickDiff {
  tick: number;
  changes: CellDiff[];
}

/** Skill configuration */
export interface SkillConfig {
  type: SkillType;
  name: string;
  description: string;
  cooldown: number;
  icon: string;
}

/** Skill instance with cooldown tracking */
export interface SkillInstance extends SkillConfig {
  currentCooldown: number;
}

/** Game state snapshot for undo */
export interface GameStateSnapshot {
  tick: number;
  redCount: number;
  blueCount: number;
}

/** Leviathan entity state */
export interface LeviathanState {
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  alive: boolean;
  path: Array<{ x: number; y: number }>;
  moveTimer: number;
}

/** Statistics per frame */
export interface GameStats {
  tick: number;
  redCount: number;
  blueCount: number;
  fps: number;
  computeTime: number;
}

/** History data point for chart */
export interface HistoryPoint {
  tick: number;
  red: number;
  blue: number;
}

/** Serializer map data */
export interface MapData {
  width: number;
  height: number;
  cells: number[];
  terrain: number[];
  version: string;
}

/** Worker request message */
export interface WorkerRequest {
  id: number;
  type: 'compute';
  cells: ArrayBuffer;
  terrain: ArrayBuffer;
  buffs: ArrayBuffer;
  buffDurations: ArrayBuffer;
  width: number;
  height: number;
  config: SimulationConfig;
}

/** Worker response message */
export interface WorkerResponse {
  id: number;
  type: 'result';
  cells: ArrayBuffer;
  buffs: ArrayBuffer;
  buffDurations: ArrayBuffer;
  changes: ArrayBuffer;
  redCount: number;
  blueCount: number;
  computeTime: number;
}

/** Simulation configuration */
export interface SimulationConfig {
  survivalMin: number;
  survivalMax: number;
  birthCount: number;
}

/** Macro AST types */
export interface MacroCondition {
  left: string;
  operator: string;
  right: string;
}

export interface MacroAction {
  type: string;
  target: string;
  params?: Record<string, string>;
}

export interface MacroRule {
  conditions: MacroCondition[];
  action: MacroAction;
}

// ============================================================
// Constants
// ============================================================

export const DEFAULT_CONFIG: SimulationConfig = {
  survivalMin: 2,
  survivalMax: 3,
  birthCount: 3,
};

export const DEFAULT_GRID_SIZE = 100;
export const LARGE_GRID_SIZE = 1000;

export const COLORS = {
  [CellState.EMPTY]: '#0a0e17',
  [CellState.RED]: '#e63946',
  [CellState.BLUE]: '#457b9d',
  WALL: '#2d3142',
  SWAMP: '#2d6a4f',
  GRID_LINE: '#151b2b',
  LEVIATHAN: '#9b5de5',
  GENE_BOOST: '#f9c74f',
} as const;

export const SKILL_CONFIGS: Record<SkillType, SkillConfig> = {
  [SkillType.METEOR]: {
    type: SkillType.METEOR,
    name: '隕石打擊',
    description: '清除半徑5格內的所有細胞',
    cooldown: 30,
    icon: '☄️',
  },
  [SkillType.GENE_BOOST]: {
    type: SkillType.GENE_BOOST,
    name: '基因強化',
    description: '3x3區域內我方細胞20回合內不會擁擠死亡',
    cooldown: 20,
    icon: '🧬',
  },
  [SkillType.SWAMP_TERRAIN]: {
    type: SkillType.SWAMP_TERRAIN,
    name: '沼澤地形',
    description: '將區域轉化為沼澤，改變繁殖條件',
    cooldown: 15,
    icon: '🌿',
  },
};

export const GAME_PRESETS = {
  NORMAL: { width: 100, height: 100 },
  LARGE: { width: 500, height: 500 },
  MASSIVE: { width: 1000, height: 1000 },
} as const;

export const TIME_SPEEDS = [0, 1, 2, 5] as const;
export const MAX_UNDO_TICKS = 50;
export const MAX_HISTORY_POINTS = 500;
