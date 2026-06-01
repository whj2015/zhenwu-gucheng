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
    }
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
    POP_PER_HOUSE: 100
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
    BONUS_PER_LEVEL: 0.08
};

export const TAVERN_CONFIG = {
    BASE_COST: 150,
    COST_INCREMENT: 50,
    MAX_COST: 500,
    POOL_SIZE: 3
};
