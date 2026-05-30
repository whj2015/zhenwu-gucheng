export type PositionRow = 'front' | 'middle' | 'back';
export type PositionCol = 'left' | 'center' | 'right';
export type PositionKey = `${PositionRow}-${PositionCol}`;

export type StatType = 'attack' | 'defense' | 'agility' | 'hp' | 'troop' | 'heal' | 'dodge';

export interface PositionEffect {
    name: string;
    icon: string;
    tag: string;
    tagColor: string;
    desc: string;
    mainStat: StatType;
    modValue: number;
    hitRate: number;
    isRear: boolean;
}

export type Quality = 'normal' | 'fine' | 'epic';

export interface HeroAttributes {
  force: number; // 武力
  physique: number; // 体魄
  agility: number; // 轻功
  command: number; // 统帅
}

export interface Equipment {
  id: string; // unique instance id
  templateId: string;
  type: 'weapon' | 'armor';
  name: string;
  quality: Quality;
  attack: number;
  defense: number;
  durability: number;
  maxDurability: number;
}

export interface HeroState {
  id: string;
  templateId: string;
  level: number;
  exp: number;
  troops: number; // 健在兵卒
  wounded: number; // 伤兵（可救治恢复）
  hp: number; // current hp, battles carry over
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
  };
}

export interface CraftingTask {
  id: string;
  templateId: string;
  startTime: number;
  endTime: number;
}

export interface CraftingState {
    task: CraftingTask | null;
    consecutiveNormal: number;
    consecutiveFine: number;
    totalCrafted: number;
}

export interface NodeBase {
  id: string;
  type: 'battle' | 'armory' | 'camp' | 'boss';
  completed: boolean;
  revealed: boolean;
  columnIndex: number; // 0, 1, 2 for layout
}

export interface BattleNode extends NodeBase {
  type: 'battle' | 'boss';
  enemies: string[];
}

export interface ArmoryNode extends NodeBase {
  type: 'armory';
  rewardOptions: { type: 'iron' | 'meteorite', amount: number }[];
}

export interface CampNode extends NodeBase {
  type: 'camp';
}

export type RuinsNode = BattleNode | ArmoryNode | CampNode;

export interface RuinsRun {
  missionId: string;
  currentFloor: number;
  nodes: RuinsNode[];
  party: Record<PositionKey, string | null>;
  status: 'setup' | 'in_progress' | 'completed' | 'failed';
  currentNodeId: string | null;
}

export interface QuestState {
    completedDailyIds: string[];
    completedWeeklyIds: string[];
    lastDailyReset: number;
    lastWeeklyReset: number;
    progress: Record<string, number>;
}

export interface GameState {
  resources: {
    bingxiang: number;
    iron: number;
    meteorite: number;
    food: number;
    wood: number;
    population: number;
  };
  buildings: {
    forgeLevel: number;
    hospitalLevel: number;
    marketLevel: number;
    houseLevel: number;
    farmLevel: number;
    lumberCampLevel: number;
    warehouseLevel: number;
  };
  crafting: CraftingState;
  heroes: HeroState[];
  inventory: Equipment[];
  ruinsRun: RuinsRun | null;
  lastTickTime: number;
  tavernPool: string[];
  tavernRefreshCount: number;
  questState: QuestState;
}

export function getWarehouseResourceCap(warehouseLevel: number): number {
    return 3000 + (warehouseLevel - 1) * 2500;
}
export function getWarehouseItemSlots(warehouseLevel: number): number {
    return 6 + (warehouseLevel - 1) * 4;
}

export const TROOP_ABSORB_PER_TROOP = 0.015; // 每个兵卒减伤 1.5%，上限 70%
export const TROOP_MAX_ABSORB = 0.70;       // 兵卒最多减免 70% 伤害
export const TROOP_HP_COST = 3;             // 抵消 1 点伤害消耗约 3 个兵卒
export const WOUNDED_NATURAL_RECOVER_RATE = 0.02; // 每秒自然恢复 2% 伤兵
export const TREAT_COST_PER_WOUNDED = 0.5;  // 治疗每个伤兵消耗 0.5 粮草（招兵的一半）
