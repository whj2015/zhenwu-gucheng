import heroesRaw from './heroes.json';
import enemiesRaw from './enemies.json';
import missionsRaw from './missions.json';
import craftingRaw from './crafting.json';
import questsRaw from './quests.json';
import positionsRaw from './positions.json';

export type SkillEffect =
    | { type: 'damage_reduction'; trigger: 'position'; targetPositions: string[]; value: number; desc: string }
    | { type: 'first_strike_bonus'; value: number; desc: string }
    | { type: 'extra_action_chance'; value: number; desc: string }
    | { type: 'cleave'; value: number; desc: string }
    | { type: 'enhanced_heal'; trigger: 'position'; targetPositions: string[]; baseValue: number; enhancedValue: number; desc: string }
    | { type: 'berserk'; trigger?: 'low_hp' | 'hp_below_threshold'; threshold?: number; atkBoost?: number; hpThreshold?: number; atkMultiplier?: number; defReduction?: number; desc: string }
    | { type: 'rally_cry'; intervalRounds: number; atkBuff: number; durationRounds: number; desc: string }
    | { type: 'dodge'; trigger: 'position'; targetPositions: string[]; dodgeChance: number; desc: string }
    | { type: 'iron_will'; maxHpBonus: number; damageCap: number; desc: string }
    | { type: 'damage_redirect'; value: number; range: string; desc: string }
    | { type: 'last_stand'; trigger: 'hp_below_threshold'; threshold: number; atkMultiplier: number; desc: string }
    | { type: 'aoe_attack'; cost: { energy: number; cooldown: number }; damageMultiplier: number; selfDebuff: { def_reduction: number; duration: number }; desc: string }
    | { type: 'damage_bonus_vs_type'; condition: { enemy_type: string[] }; damageMultiplier: number; desc: string }
    | { type: 'party_buff'; cost: { energy: number; cooldown: number }; buff: { atk_boost: number; duration: number }; target: string; desc: string }
    | { type: 'mass_cc'; cost: { energy: number; cooldown: number }; target: string; count: number; debuff: { stun: boolean; duration: number }; desc: string }
    | { type: 'heal_and_cleanse'; cost: { energy: number; cooldown: number }; heal_percent: number; cleanse_debuffs: boolean; target: string; desc: string };

export type Rarity = 'N' | 'R' | 'SR' | 'SSR';

export interface PositionBonus {
    pos: string;
    bonus: Record<string, number>;
}

export type HeroTrait = 'assault' | 'flank' | 'tank' | 'support' | 'healer' | 'ranged';

export interface HeroTemplate {
    name: string;
    quality: string;
    rarity: Rarity;
    icon: string | null;
    attributes: { force: number; physique: number; agility: number; command: number };
    skillName: string;
    desc: string;
    skillEffect?: SkillEffect;
    trait: HeroTrait;
    traitDesc: string;
    positionBonus?: PositionBonus[];
    flavorText?: string;
    lore?: string;
}

export type EnemyAbility =
    | null
    | { type: 'berserk'; hpThreshold: number; atkMultiplier: number; triggerLog: string }
    | { type: 'heavy_armor'; damageReduction: number; triggerLog: string }
    | { type: 'heavy_armor_fury'; damageReduction: number; furyInterval: number; furyMultiplier: number; triggerLog: string; armorLog: string }
    | { type: 'formation'; allyDefenseBonus: number; triggerLog: string }
    | { type: 'warlord'; summonCount: number; summonTemplateId: string; armorPierce: number; round1Log: string; pierceLog: string };

export interface EnemyTemplate {
    name: string;
    hp: number;
    attack: number;
    defense: number;
    agility: number;
    desc: string;
    ability?: EnemyAbility;
    enemyRow?: 'front' | 'middle' | 'back';
}

export interface MissionDef {
    name: string;
    desc: string;
    type: 'explore' | 'suppress';
    recommendedLvl: number;
    availableFloors: number;
    enemyPool: string[];
    bossPool: string[];
}

export interface CraftingDef {
    name: string;
    type: 'weapon' | 'armor';
    costBingxiang: number;
    costIron: number;
    durationMs: number;
    baseStats: Record<string, { attack: number; defense: number }>;
}

export interface QuestDef {
    id: string;
    type: string;
    title: string;
    desc: string;
    req: { type: string; amount: number };
    reward: { type: string; amount: number };
}

export interface QuestTemplate {
    title: string;
    description: string;
    requireType: 'resource' | 'explore' | 'craft' | 'recruit' | 'boss_kill' | 'deep_explore';
    resourceKey?: string;
    amount: number;
    rewards: Record<string, number>;
    category: 'daily' | 'weekly';
    difficulty: 1 | 2 | 3;
}

export interface PositionDef {
    name: string;
    icon: string;
    tag: string;
    tagColor: string;
    desc: string;
    mainStat: string;
    modValue: number;
    hitRate: number;
    isRear: boolean;
}

export const HERO_TEMPLATES: Record<string, HeroTemplate> = heroesRaw.heroes as unknown as Record<string, HeroTemplate>;

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = enemiesRaw.enemies as Record<string, EnemyTemplate>;

export const MISSIONS: Record<string, MissionDef> = missionsRaw.missions as Record<string, MissionDef>;

export const CRAFTING_TEMPLATES: Record<string, CraftingDef> = craftingRaw.craftingTemplates as Record<string, CraftingDef>;

export const FORGE_UPGRADE_COSTS: Record<string, { bingxiang: number; meteorite: number }> = craftingRaw.forgeUpgradeCosts;

export const QUEST_TEMPLATES: Record<string, QuestTemplate> = questsRaw.templates as unknown as Record<string, QuestTemplate>;

export const QUEST_TEMPLATE_POOL = questsRaw.templates as unknown as Record<string, QuestTemplate>;

export const POSITION_CONFIG: Record<string, PositionDef> = positionsRaw.positions;

export const MAX_DEPLOY_COUNT: number = positionsRaw.maxDeployCount;

export type BattleRow = 'front' | 'middle' | 'back';

export interface BattleUnit {
    id: string;
    name: string;
    side: 'player' | 'enemy';
    hp: number;
    maxHp: number;
    row: BattleRow;
    col: number;
    templateId?: string;
    isAlive: boolean;
}

export interface BattleState {
    round: number;
    phase: 'player' | 'enemy' | 'ended';
    playerUnits: BattleUnit[];
    enemyUnits: BattleUnit[];
    selectedAttacker: string | null;
    selectedTarget: string | null;
    logs: string[];
    victory: boolean | null;
    playerAttacksThisRound: Record<string, string>;
}
