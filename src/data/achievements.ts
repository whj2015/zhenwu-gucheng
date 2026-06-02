export type AchievementCategory = 'battle' | 'collection' | 'challenge' | 'social' | 'growth' | 'economy';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    hint?: string;
    category: AchievementCategory;
    tier: AchievementTier;
    isHidden: boolean;
    condition: {
        type: string;
        value: number;
        operator?: 'gte' | 'eq' | 'lte';
    };
    rewards: {
        bingxiang?: number;
        iron?: number;
        meteorite?: number;
        food?: number;
        wood?: number;
        title?: string;
    };
    icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {

    first_blood: {
        id: 'first_blood',
        name: '初露锋芒',
        description: '首次在战斗中取得胜利',
        category: 'battle',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'battle_win', value: 1, operator: 'gte' },
        rewards: { bingxiang: 100, iron: 50 },
        icon: '⚔️'
    },

    boss_slayer_1: {
        id: 'boss_slayer_1',
        name: '斩将夺旗',
        description: '击败1个BOSS',
        category: 'battle',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'boss_kill', value: 1, operator: 'gte' },
        rewards: { bingxiang: 200, iron: 100, meteorite: 10 },
        icon: '🗡️'
    },

    boss_slayer_10: {
        id: 'boss_slayer_10',
        name: '百战名将',
        description: '击败10个BOSS',
        category: 'battle',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'boss_kill', value: 10, operator: 'gte' },
        rewards: { bingxiang: 500, iron: 250, meteorite: 30 },
        icon: '🏆'
    },

    boss_slayer_50: {
        id: 'boss_slayer_50',
        name: '战神降临',
        description: '击败50个BOSS',
        category: 'battle',
        tier: 'gold',
        isHidden: false,
        condition: { type: 'boss_kill', value: 50, operator: 'gte' },
        rewards: { bingxiang: 1500, iron: 800, meteorite: 100, title: '战神' },
        icon: '👑'
    },

    no_damage_win: {
        id: 'no_damage_win',
        name: '毫发无损',
        description: '无伤通关一场战斗',
        hint: '完美战斗，不损一兵一卒',
        category: 'battle',
        tier: 'diamond',
        isHidden: true,
        condition: { type: 'no_damage_win', value: 1, operator: 'gte' },
        rewards: { bingxiang: 2000, iron: 1000, meteorite: 200, title: '不败战神' },
        icon: '💎'
    },

    speedrun_60s: {
        id: 'speedrun_60s',
        name: '雷霆万钧',
        description: '在60秒内结束一场战斗',
        hint: '速度即是力量',
        category: 'battle',
        tier: 'gold',
        isHidden: true,
        condition: { type: 'speedrun_60s', value: 1, operator: 'gte' },
        rewards: { bingxiang: 800, iron: 400, meteorite: 50, title: '疾风剑豪' },
        icon: '⚡'
    },

    hero_collector_5: {
        id: 'hero_collector_5',
        name: '聚贤纳士',
        description: '拥有5个不同英雄',
        category: 'collection',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'hero_count', value: 5, operator: 'gte' },
        rewards: { bingxiang: 150, food: 200 },
        icon: '👥'
    },

    hero_collector_10: {
        id: 'hero_collector_10',
        name: '群英荟萃',
        description: '拥有10个不同英雄',
        category: 'collection',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'hero_count', value: 10, operator: 'gte' },
        rewards: { bingxiang: 400, food: 500, wood: 300 },
        icon: '🎭'
    },

    hero_collector_13: {
        id: 'hero_collector_13',
        name: '天下归心',
        description: '收集全部13位英雄',
        category: 'collection',
        tier: 'gold',
        isHidden: false,
        condition: { type: 'hero_count', value: 13, operator: 'gte' },
        rewards: { bingxiang: 2000, iron: 1000, meteorite: 100, food: 1000, title: '人皇' },
        icon: '🌟'
    },

    ssr_owner: {
        id: 'ssr_owner',
        name: '天命之人',
        description: '获得首个SSR品质英雄',
        category: 'collection',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'ssr_count', value: 1, operator: 'gte' },
        rewards: { bingxiang: 500, meteorite: 30 },
        icon: '✨'
    },

    gacha_lucky: {
        id: 'gacha_lucky',
        name: '鸿运当头',
        description: '单次抽卡获得SR及以上品质英雄',
        category: 'collection',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'gacha_sr_plus', value: 1, operator: 'gte' },
        rewards: { bingxiang: 100 },
        icon: '🍀'
    },

    floor_reacher_5: {
        id: 'floor_reacher_5',
        name: '初入深渊',
        description: '探索到达第5层',
        category: 'challenge',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'explore_floor', value: 5, operator: 'gte' },
        rewards: { iron: 150, food: 200 },
        icon: '🏔️'
    },

    floor_reacher_10: {
        id: 'floor_reacher_10',
        name: '深入腹地',
        description: '探索到达第10层',
        category: 'challenge',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'explore_floor', value: 10, operator: 'gte' },
        rewards: { iron: 400, meteorite: 20, food: 500 },
        icon: '🗻'
    },

    floor_reacher_20: {
        id: 'floor_reacher_20',
        name: '绝境探险者',
        description: '探索到达第20层',
        category: 'challenge',
        tier: 'gold',
        isHidden: false,
        condition: { type: 'explore_floor', value: 20, operator: 'gte' },
        rewards: { iron: 1000, meteorite: 80, bingxiang: 800, title: '探险家' },
        icon: '🌋'
    },

    deep_explorer: {
        id: 'deep_explorer',
        name: '深层勘探',
        description: '完成3次深层探索（15层以上）',
        category: 'challenge',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'deep_explore', value: 3, operator: 'gte' },
        rewards: { meteorite: 50, iron: 300, wood: 200 },
        icon: '🔍'
    },

    level_10: {
        id: 'level_10',
        name: '小有所成',
        description: '任意英雄达到10级',
        category: 'growth',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'max_hero_level', value: 10, operator: 'gte' },
        rewards: { bingxiang: 200, food: 300 },
        icon: '📈'
    },

    level_25: {
        id: 'level_25',
        name: '身经百战',
        description: '任意英雄达到25级',
        category: 'growth',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'max_hero_level', value: 25, operator: 'gte' },
        rewards: { bingxiang: 500, iron: 300, meteorite: 20 },
        icon: '🎯'
    },

    level_50: {
        id: 'level_50',
        name: '登峰造极',
        description: '任意英雄达到50级',
        category: 'growth',
        tier: 'gold',
        isHidden: false,
        condition: { type: 'max_hero_level', value: 50, operator: 'gte' },
        rewards: { bingxiang: 1200, iron: 600, meteorite: 80, title: '宗师' },
        icon: '🏅'
    },

    total_level_100: {
        id: 'total_level_100',
        name: '军团崛起',
        description: '所有英雄总等级达到100',
        category: 'growth',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'total_level', value: 100, operator: 'gte' },
        rewards: { bingxiang: 600, food: 800, wood: 400 },
        icon: '🛡️'
    },

    rich_man: {
        id: 'rich_man',
        name: '富甲一方',
        description: '任意资源数量超过5000',
        category: 'economy',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'resource_milestone', value: 5000, operator: 'gte' },
        rewards: { bingxiang: 200, iron: 100 },
        icon: '💰'
    },

    craftsman_10: {
        id: 'craftsman_10',
        name: '巧匠入门',
        description: '累计锻造10件装备',
        category: 'economy',
        tier: 'bronze',
        isHidden: false,
        condition: { type: 'craft_count', value: 10, operator: 'gte' },
        rewards: { iron: 200, bingxiang: 150 },
        icon: '🔨'
    },

    craftsman_50: {
        id: 'craftsman_50',
        name: '名匠大师',
        description: '累计锻造50件装备',
        category: 'economy',
        tier: 'silver',
        isHidden: false,
        condition: { type: 'craft_count', value: 50, operator: 'gte' },
        rewards: { iron: 600, meteorite: 40, bingxiang: 400 },
        icon: '⚒️'
    },

    master_forger: {
        id: 'master_forger',
        name: '神工天匠',
        description: '将锻造坊升级到5级',
        category: 'economy',
        tier: 'gold',
        isHidden: false,
        condition: { type: 'forge_level', value: 5, operator: 'gte' },
        rewards: { meteorite: 100, iron: 500, bingxiang: 600, title: '神匠' },
        icon: '🔥'
    },

    pacifist: {
        id: 'pacifist',
        name: '兵不血刃',
        description: '不击杀任何小兵，直接击败BOSS',
        hint: '以最小代价换取最大胜利',
        category: 'battle',
        tier: 'diamond',
        isHidden: true,
        condition: { type: 'pacifist_win', value: 1, operator: 'gte' },
        rewards: { bingxiang: 3000, iron: 1500, meteorite: 300, title: '仁义之师' },
        icon: '🕊️'
    },

    come_back_king: {
        id: 'come_back_king',
        name: '绝地反击',
        description: 'HP低于10%时反杀获胜',
        hint: '置之死地而后生',
        category: 'battle',
        tier: 'gold',
        isHidden: true,
        condition: { type: 'comeback_win', value: 1, operator: 'gte' },
        rewards: { bingxiang: 1000, iron: 500, meteorite: 60, title: '不屈战魂' },
        icon: '🔥'
    }
};

export const TIER_POINTS: Record<AchievementTier, number> = {
    bronze: 10,
    silver: 25,
    gold: 50,
    diamond: 100
};

export const TIER_COLORS: Record<AchievementTier, string> = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    diamond: '#b9f2ff'
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
    battle: '战斗',
    collection: '收集',
    challenge: '挑战',
    social: '社交',
    growth: '成长',
    economy: '经济'
};

export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
    battle: '⚔️',
    collection: '🎯',
    challenge: '🏔️',
    social: '🤝',
    growth: '📈',
    economy: '💰'
};
