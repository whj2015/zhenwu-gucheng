export interface BattleSkill {
    name: string;
    description: string;
    cost: number;
    cooldown: number;
    type: 'attack' | 'heal' | 'buff' | 'debuff' | 'aoe';
    targetMode: 'single_enemy' | 'single_ally' | 'all_enemies' | 'all_allies' | 'self';
    value: number;
    icon: string;
}

export const HERO_BATTLE_SKILLS: Record<string, BattleSkill> = {
    tieshan: {
        name: '铁壁护体',
        description: '凝聚全身气力强化防御，本回合所受伤害降低50%',
        cost: 50,
        cooldown: 2,
        type: 'buff',
        targetMode: 'self',
        value: 0.5,
        icon: '🛡️'
    },
    liuyidao: {
        name: '瞬杀一刀',
        description: '以极快速度斩击敌方单体，造成180%攻击伤害',
        cost: 50,
        cooldown: 2,
        type: 'attack',
        targetMode: 'single_enemy',
        value: 1.8,
        icon: '⚔️'
    },
    yunniang: {
        name: '幻影连袭',
        description: '利用矫健身法对敌人发动连续攻击，造成120%伤害并使其命中率降低',
        cost: 50,
        cooldown: 2,
        type: 'attack',
        targetMode: 'single_enemy',
        value: 1.2,
        icon: '🌪️'
    },
    guansheng: {
        name: '偃月横扫',
        description: '挥舞偃月刀横扫前方，对目标造成150%伤害并对相邻敌人溅射40%伤害',
        cost: 50,
        cooldown: 3,
        type: 'aoe',
        targetMode: 'all_enemies',
        value: 1.5,
        icon: '🌀'
    },
    huanniang: {
        name: '妙手回春',
        description: '为单个友军恢复40%最大生命值，并清除所有负面状态',
        cost: 50,
        cooldown: 2,
        type: 'heal',
        targetMode: 'single_ally',
        value: 0.4,
        icon: '💚'
    },
    liefao: {
        name: '狂暴突进',
        description: '进入狂暴状态，本回合攻击力提升50%，无视30%防御',
        cost: 50,
        cooldown: 3,
        type: 'buff',
        targetMode: 'self',
        value: 0.5,
        icon: '😤'
    },
    dianwei: {
        name: '舍身护卫',
        description: '为相邻友军承担50%伤害，持续至回合结束',
        cost: 50,
        cooldown: 3,
        type: 'buff',
        targetMode: 'all_allies',
        value: 0.5,
        icon: '🛡️'
    },
    xiahoudun: {
        name: '不屈战魂',
        description: '激发潜能，HP越低攻击力越高，最高翻倍',
        cost: 100,
        cooldown: 4,
        type: 'buff',
        targetMode: 'self',
        value: 2.0,
        icon: '🔥'
    },
    lvbu: {
        name: '无双乱舞',
        description: '消耗全部能量发动狂暴攻击，对所有敌人造成80%伤害，自身防御降低50%（持续2回合）',
        cost: 100,
        cooldown: 4,
        type: 'aoe',
        targetMode: 'all_enemies',
        value: 0.8,
        icon: '💀'
    },
    machao: {
        name: '神威破阵',
        description: '以雷霆之势突破敌阵，对前排敌人造成200%伤害',
        cost: 50,
        cooldown: 3,
        type: 'attack',
        targetMode: 'single_enemy',
        value: 2.0,
        icon: '🐎'
    },
    xunyu: {
        name: '军师令',
        description: '发布作战指令，全体友军攻击力提升20%，持续3回合',
        cost: 80,
        cooldown: 3,
        type: 'buff',
        targetMode: 'all_allies',
        value: 0.2,
        icon: '📜'
    },
    pangtong: {
        name: '凤雏困阵',
        description: '布置奇门阵法，使2个随机敌人下回合无法行动',
        cost: 100,
        cooldown: 5,
        type: 'debuff',
        targetMode: 'all_enemies',
        value: 2,
        icon: '🦅'
    },
    sunsimiao: {
        name: '药王济世',
        description: '施展医术治疗单个友军40%HP，并清除所有负面状态',
        cost: 70,
        cooldown: 2,
        type: 'heal',
        targetMode: 'single_ally',
        value: 0.4,
        icon: '💊'
    }
};

export function getHeroBattleSkill(templateId: string): BattleSkill | undefined {
    return HERO_BATTLE_SKILLS[templateId];
}

export function canUseSkill(templateId: string, currentEnergy: number): boolean {
    const skill = HERO_BATTLE_SKILLS[templateId];
    if (!skill) return false;
    return currentEnergy >= skill.cost;
}
