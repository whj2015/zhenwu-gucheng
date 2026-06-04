/**
 * 统一加成管线 (BonusPipeline)
 *
 * 计算公式：
 *   finalValue = (base + flatBonus) * (1 + percentBonusSum) + finalFlatBonus
 *
 * 三个加成区域按顺序应用：
 *   - flatBonus:     固定值加成区（装备基础攻击力等）
 *   - percentBonus:  百分比加成区（同类加法堆叠）
 *   - finalFlatBonus: 最终扁平区（预留）
 *
 * 加成来源：
 *   - 装备套装 (equipmentSet)
 *   - 被动技能 (skillEffect)
 *   - 基础属性/兵卒转化 (base attribute + troop conversion)
 */

import type { HeroState, StatType } from '../types';
import type { HeroTemplate, SkillEffect } from '../data';
import { calculateSetStatBonus } from './equipmentSetEngine';

// ── 类型定义 ──────────────────────────────────────

export interface BonusSource {
    source: string;        // 来源名称，如 '铁卫套装'、'快刀'、'兵卒转化'
    type: 'flat' | 'percent' | 'final_flat';
    stat: string;          // 属性名：attack / defense / agility / hp / dodge
    value: number;         // 数值
    description?: string;  // 可选描述
}

export interface StatBreakdown {
    base: number;              // 基础值（来自英雄模板属性）
    flatBonus: number;         // 固定值加成总和
    percentBonus: number;      // 百分比加成总和 (0.15 = +15%)
    percentSources: BonusSource[]; // 百分比加成的明细来源
    flatSources: BonusSource[];    // 固定值加成的明细来源
    finalValue: number;        // 最终计算值
}

export interface HeroBonusResult {
    attack: StatBreakdown;
    defense: StatBreakdown;
    agility: StatBreakdown;
    hp: StatBreakdown;
    dodge: StatBreakdown;
    troopAttackContribution: number; // 兵卒转化的攻击力贡献
    allSources: BonusSource[];       // 所有加成来源的扁平列表
}

// ── 常量 ──────────────────────────────────────────

/** 兵卒转化为攻击力的基础效率系数：每10个兵卒转化为 1 点攻击力的基础值 */
const TROOP_ATK_BASE_EFFICIENCY = 0.1;

// ── 核心 API ───────────────────────────────────────

/**
 * 统一计算一个英雄的所有属性加成
 *
 * @param hero      英雄状态
 * @param template  英雄模板
 * @returns 完整的属性加成明细
 */
export function calculateHeroBonuses(
    hero: HeroState,
    template: HeroTemplate,
): HeroBonusResult {
    const setBonus = calculateSetStatBonus(hero);
    const skillEffect = template.skillEffect || null;

    // 收集所有加成来源
    const allSources: BonusSource[] = [];

    // 1. 装备固定值加成
    const equipmentFlatAtk = hero.equipment.weapon?.attack || 0;
    const equipmentFlatDef = hero.equipment.armor?.defense || 0;

    if (equipmentFlatAtk > 0) {
        allSources.push({
            source: `${hero.equipment.weapon?.name || '武器'}`,
            type: 'flat',
            stat: 'attack',
            value: equipmentFlatAtk,
            description: '武器基础攻击',
        });
    }
    if (equipmentFlatDef > 0) {
        allSources.push({
            source: `${hero.equipment.armor?.name || '防具'}`,
            type: 'flat',
            stat: 'defense',
            value: equipmentFlatDef,
            description: '防具基础防御',
        });
    }

    // 2. 装备套装百分比加成
    for (const [stat, value] of Object.entries(setBonus)) {
        if (value === 0) continue;
        // 判断是百分比还是固定值：套装目前全部为百分比
        allSources.push({
            source: '装备套装',
            type: 'percent',
            stat,
            value,
            description: `套装${stat}+${Math.round(value * 100)}%`,
        });
    }

    // 3. 技能效果加成
    const skillBonuses = extractSkillBonuses(skillEffect);
    allSources.push(...skillBonuses);

    // 4. 兵卒 → 攻击力转化（纳入管线倍率）
    const troopPercentBonus = extractTroopPercentBonus(skillEffect);
    const troopAtkRaw = hero.troops * TROOP_ATK_BASE_EFFICIENCY;
    // 兵卒攻击力受百分比加成区影响
    const troopAtkContribution = Math.floor(troopAtkRaw * (1 + troopPercentBonus));

    if (troopAtkContribution > 0) {
        allSources.push({
            source: '兵卒转化',
            type: 'flat',
            stat: 'attack',
            value: troopAtkContribution,
            description: `${hero.troops}兵→${troopAtkContribution}攻`,
        });
    }

    // ── 构建各属性明细 ──

    const attack = buildStatBreakdown({
        base: template.attributes.force,
        flatSources: allSources.filter(s => s.stat === 'attack' && s.type === 'flat'),
        percentSources: allSources.filter(s => s.stat === 'attack' && s.type === 'percent'),
    });

    const defense = buildStatBreakdown({
        base: template.attributes.physique * 0.4, // 体魄转化为防御基础值
        flatSources: allSources.filter(s => s.stat === 'defense' && s.type === 'flat'),
        percentSources: allSources.filter(s => s.stat === 'defense' && s.type === 'percent'),
    });

    const agility = buildStatBreakdown({
        base: template.attributes.agility,
        flatSources: allSources.filter(s => s.stat === 'agility' && s.type === 'flat'),
        percentSources: allSources.filter(s => s.stat === 'agility' && s.type === 'percent'),
    });

    const hp = buildStatBreakdown({
        base: template.attributes.physique * 10,
        flatSources: allSources.filter(s => s.stat === 'hp' && s.type === 'flat'),
        percentSources: allSources.filter(s => s.stat === 'hp' && s.type === 'percent'),
    });

    const dodge = buildStatBreakdown({
        base: 0,
        flatSources: allSources.filter(s => s.stat === 'dodge' && s.type === 'flat'),
        percentSources: allSources.filter(s => s.stat === 'dodge' && s.type === 'percent'),
    });

    return {
        attack,
        defense,
        agility,
        hp,
        dodge,
        troopAttackContribution: troopAtkContribution,
        allSources,
    };
}

// ── 内部函数 ──────────────────────────────────────

interface BuildStatOptions {
    base: number;
    flatSources: BonusSource[];
    percentSources: BonusSource[];
}

function buildStatBreakdown(opts: BuildStatOptions): StatBreakdown {
    const flatBonus = opts.flatSources.reduce((sum, s) => sum + s.value, 0);
    const percentBonus = opts.percentSources.reduce((sum, s) => sum + s.value, 0);

    return {
        base: opts.base,
        flatBonus,
        percentBonus,
        percentSources: opts.percentSources,
        flatSources: opts.flatSources,
        finalValue: Math.max(0, Math.floor((opts.base + flatBonus) * (1 + percentBonus))),
    };
}

/**
 * 从技能效果中提取加成类 BonusSource
 */
function extractSkillBonuses(skillEffect: SkillEffect | null): BonusSource[] {
    if (!skillEffect) return [];

    const sources: BonusSource[] = [];

    switch (skillEffect.type) {
        case 'iron_will':
            // 不动：最大HP加成
            sources.push({
                source: '不动',
                type: 'percent',
                stat: 'hp',
                value: skillEffect.maxHpBonus,
                description: `HP上限+${Math.round(skillEffect.maxHpBonus * 100)}%`,
            });
            break;

        case 'berserk':
            // 蛮冲：运行时动态加成，不在静态计算中体现
            // （在 simulateBattle 中通过 isBerserkActive 动态施加）
            break;

        case 'dodge':
            // 闪避：闪避率加成
            sources.push({
                source: skillEffect.desc.split(' ')[0] || '闪避',
                type: 'percent',
                stat: 'dodge',
                value: skillEffect.dodgeChance,
                description: `闪避+${Math.round(skillEffect.dodgeChance * 100)}%`,
            });
            break;

        case 'first_strike_bonus':
        case 'extra_action_chance':
        case 'cleave':
        case 'damage_reduction':
        case 'enhanced_heal':
        case 'damage_redirect':
        case 'last_stand':
        case 'aoe_attack':
        case 'damage_bonus_vs_type':
        case 'party_buff':
        case 'mass_cc':
        case 'heal_and_cleanse':
        case 'rally_cry':
            // 这些技能是战斗行为效果（触发式），不直接作为静态属性加成
            // 它们在 simulateBattle 的具体逻辑中处理
            break;
    }

    return sources;
}

/**
 * 提取技能效果中可能存在的兵卒百分比加成（预留扩展）
 */
function extractTroopPercentBonus(skillEffect: SkillEffect | null): number {
    if (!skillEffect) return 0;

    // 预留：如果未来有技能增加兵卒转化效率可在此处扩展
    // 例如：某技能使兵卒攻击转化+20%
    return 0;
}

// ── 便捷查询 API ──────────────────────────────────

/** 获取最终攻击力 */
export function getFinalAttack(result: HeroBonusResult): number {
    return result.attack.finalValue;
}

/** 获取最终防御力 */
export function getFinalDefense(result: HeroBonusResult): number {
    return result.defense.finalValue;
}

/** 获取最终敏捷 */
export function getFinalAgility(result: HeroBonusResult): number {
    return result.agility.finalValue;
}

/** 获取最终 HP 上限 */
export function getFinalMaxHp(result: HeroBonusResult): number {
    return result.hp.finalValue;
}

/** 获取最终闪避率 (0-1) */
export function getFinalDodge(result: HeroBonusResult): number {
    return Math.min(1, result.dodge.percentBonus);
}
