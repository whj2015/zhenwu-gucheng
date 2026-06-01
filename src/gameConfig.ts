export const RESOURCE_CONFIG = {
    INITIAL: {
        bingxiang: 500,
        iron: 200,
        meteorite: 0,
        food: 1000,
        wood: 500,
        population: 100
    },
    RATES: {
        POP_BINGXIANG: 0.01,
        FARM_FOOD: 2,
        LUMBER_WOOD: 1.5,
        WAREHOUSE_IRON: 0.8
    },
    EXPEDITION_COST_PER_HERO: 10
};

export const BUILDING_CONFIG = {
    INITIAL_LEVELS: {
        forgeLevel: 1,
        hospitalLevel: 1,
        marketLevel: 1,
        houseLevel: 1,
        farmLevel: 1,
        lumberCampLevel: 1,
        warehouseLevel: 1
    },
    POP_PER_HOUSE: 100,
    UPGRADE_COST_MULTIPLIER: 1.5,
    BASE_COSTS: {
        house: { wood: 100, iron: 50, bingxiang: 80 },
        farm: { wood: 80, iron: 30, food: 50 },
        lumberCamp: { wood: 60, iron: 40, bingxiang: 60 },
        forge: { wood: 200, iron: 150, bingxiang: 100 },
        hospital: { wood: 150, iron: 100, bingxiang: 120 },
        market: { wood: 180, iron: 80, bingxiang: 140 },
        warehouse: { wood: 120, iron: 90, bingxiang: 100 },
        barracks: { wood: 250, iron: 200, bingxiang: 180 }
    }
};

export const OFFLINE_CONFIG = {
    THRESHOLD_MINUTES: 10,
    CAP_HOURS: 12,
    GAINS_PER_MINUTE: 48
};

export const COMBAT_CONFIG = {
    REWARD_IRON_BASE: 20,
    REWARD_IRON_BOSS_MULTIPLIER: 2.5,
    REWARD_METEORITE_BOSS_BASE: 10,
    EXP_WIN: 50,
    EXP_LOSE: 10,
    EXP_PER_LEVEL: 100
};

export const CRAFTING_CONFIG = {
    PITY_NORMAL: 5,
    PITY_FINE: 10,
    QUALITY_MULTIPLIERS: {
        normal: 1,
        fine: 1.2,
        epic: 1.5
    },
    EPIC_CHANCE: 0.05,
    FINE_CHANCE: 0.25
};

export const RECOVERY_CONFIG = {
    WOUNDED_NATURAL_RATE: 0.02,
    TREAT_COST_PER_WOUNDED: 0.5,
    HOSPITAL_DISCOUNT_PER_LEVEL: 0.15
};

export const MARKET_CONFIG = {
    BONUS_PER_LEVEL: 0.08,
    EXCHANGE_RATES: {
        'food-to-wood': 2,
        'wood-to-iron': 3,
        'food-to-bingxiang': 4,
        'bingxiang-to-iron': 2
    }
};

export const TAVERN_CONFIG = {
    BASE_COST: 150,
    COST_INCREMENT: 50,
    MAX_COST: 500,
    POOL_SIZE: 3,
    RECRUIT_COSTS_BY_RARITY: {
        N: 150,
        R: 300,
        SR: 600,
        SSR: 1200
    },
    PITY_SYSTEM: {
        RARE_GUARANTEE: 10,
        EPIC_GUARANTEE: 50
    }
};

export const ECONOMY_CONFIG = {
    PYRAMID_LEVELS: [
        { name: '人口', resource: 'population', source: 'house' },
        { name: '兵饷', resource: 'bingxiang', source: 'population' },
        { name: '粮草', resource: 'food', source: 'farm' },
        { name: '木材', resource: 'wood', source: 'lumberCamp' },
        { name: '铁锭', resource: 'iron', source: ['battle', 'market'] },
        { name: '陨铁', resource: 'meteorite', source: 'boss_drop' }
    ],
    POPULATION_PENALTY_THRESHOLD: 0.9,
    POPULATION_GROWTH_PENALTY: -0.5,
    HERO_RECRUIT_POP_COST: 10
};
