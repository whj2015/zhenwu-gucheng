import { ACHIEVEMENTS, Achievement, AchievementCategory, TIER_POINTS } from '../data/achievements';
import { HERO_TEMPLATES } from '../data';
import type { GameState } from '../types';

export interface AchievementState {
    unlockedIds: string[];
    unlockTimes: Record<string, number>;
    notifiedIds: string[];
    totalPoints: number;
}

interface GameContext {
    heroes: GameState['heroes'];
    resources: GameState['resources'];
    buildings: GameState['buildings'];
    crafting: GameState['crafting'];
    recruitStats: GameState['recruitStats'];
    ruinsRun: GameState['ruinsRun'] | null;
}

function getCurrentValue(conditionType: string, context: GameContext): number {
    switch (conditionType) {
        case 'battle_win':
            return context.heroes.reduce((sum, h) => {
                const battles = Math.floor(h.exp / 50);
                return sum + battles;
            }, 0);

        case 'boss_kill':
            const bossWins = context.heroes.reduce((sum, h) => {
                const bossBattles = Math.floor(h.exp / (50 + 50));
                return sum + Math.max(0, bossBattles);
            }, 0);
            return Math.max(1, Math.floor(bossWins / context.heroes.length || 1));

        case 'hero_count':
            const uniqueHeroes = new Set(context.heroes.map(h => h.templateId));
            return uniqueHeroes.size;

        case 'ssr_count': {
            const ssrHeroes = context.heroes.filter(h => {
                const template = HERO_TEMPLATES[h.templateId];
                return template?.rarity === 'SSR';
            });
            return ssrHeroes.length;
        }

        case 'gacha_sr_plus': {
            const srPlus = context.heroes.filter(h => {
                const template = HERO_TEMPLATES[h.templateId];
                return template && (template.rarity === 'SR' || template.rarity === 'SSR');
            });
            return srPlus.length;
        }

        case 'explore_floor':
            return context.ruinsRun?.currentFloor || 1;

        case 'deep_explore':
            return context.ruinsRun && context.ruinsRun.currentFloor >= 15 ? 1 : 0;

        case 'max_hero_level':
            if (context.heroes.length === 0) return 0;
            return Math.max(...context.heroes.map(h => h.level));

        case 'total_level':
            return context.heroes.reduce((sum, h) => sum + h.level, 0);

        case 'resource_milestone': {
            const maxResource = Math.max(
                context.resources.bingxiang,
                context.resources.iron,
                context.resources.meteorite,
                context.resources.food,
                context.resources.wood
            );
            return maxResource;
        }

        case 'craft_count':
            return context.crafting.totalCrafted;

        case 'forge_level':
            return context.buildings.forgeLevel;

        case 'no_damage_win':
        case 'speedrun_60s':
        case 'pacifist_win':
        case 'comeback_win':
            return 0;

        default:
            return 0;
    }
}

function checkCondition(
    achievement: Achievement,
    currentValue: number,
    eventType: string,
    eventValue: number
): boolean {
    const { condition } = achievement;
    const operator = condition.operator || 'gte';

    const isRelevantEvent = (
        eventType === condition.type ||
        eventType === 'battle_win' ||
        eventType === 'boss_kill' ||
        eventType === 'craft' ||
        eventType === 'level_up' ||
        eventType === 'resource_milestone' ||
        eventType === 'building_upgrade'
    );

    if (!isRelevantEvent && 
        !['no_damage_win', 'speedrun_60s', 'pacifist_win', 'comeback_win'].includes(condition.type)) {
        return false;
    }

    let checkValue = currentValue;

    if (condition.type === eventType) {
        checkValue = eventValue;
    }

    switch (operator) {
        case 'gte': return checkValue >= condition.value;
        case 'eq': return checkValue === condition.value;
        case 'lte': return checkValue <= condition.value;
        default: return checkValue >= condition.value;
    }
}

export function checkAchievements(
    eventType: string,
    eventValue: number,
    currentState: AchievementState,
    gameState: Pick<GameState, 'heroes' | 'resources' | 'buildings' | 'crafting' | 'recruitStats' | 'ruinsRun'>
): {
    newlyUnlocked: Achievement[];
    newState: AchievementState;
    totalReward: Partial<GameState['resources']>;
} {
    const newlyUnlocked: Achievement[] = [];
    const totalReward: Partial<GameState['resources']> = {};
    let newTotalPoints = currentState.totalPoints;

    const context: GameContext = {
        heroes: gameState.heroes,
        resources: gameState.resources,
        buildings: gameState.buildings,
        crafting: gameState.crafting,
        recruitStats: gameState.recruitStats,
        ruinsRun: gameState.ruinsRun
    };

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (currentState.unlockedIds.includes(achievement.id)) return;

        const currentValue = getCurrentValue(achievement.condition.type, context);

        if (checkCondition(achievement, currentValue, eventType, eventValue)) {
            newlyUnlocked.push(achievement);

            newTotalPoints += TIER_POINTS[achievement.tier];

            if (achievement.rewards.bingxiang) {
                totalReward.bingxiang = (totalReward.bingxiang || 0) + achievement.rewards.bingxiang;
            }
            if (achievement.rewards.iron) {
                totalReward.iron = (totalReward.iron || 0) + achievement.rewards.iron;
            }
            if (achievement.rewards.meteorite) {
                totalReward.meteorite = (totalReward.meteorite || 0) + achievement.rewards.meteorite;
            }
            if (achievement.rewards.food) {
                totalReward.food = (totalReward.food || 0) + achievement.rewards.food;
            }
            if (achievement.rewards.wood) {
                totalReward.wood = (totalReward.wood || 0) + achievement.rewards.wood;
            }
        }
    });

    const newState: AchievementState = {
        unlockedIds: [
            ...currentState.unlockedIds,
            ...newlyUnlocked.map(a => a.id)
        ],
        unlockTimes: {
            ...currentState.unlockTimes,
            ...Object.fromEntries(newlyUnlocked.map(a => [a.id, Date.now()]))
        },
        notifiedIds: [...currentState.notifiedIds],
        totalPoints: newTotalPoints
    };

    return { newlyUnlocked, newState, totalReward };
}

export function calculateAchievementProgress(
    achievementId: string,
    gameState: Pick<GameState, 'heroes' | 'resources' | 'buildings' | 'crafting' | 'recruitStats' | 'ruinsRun'>
): { current: number; required: number; percent: number } {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
        return { current: 0, required: 0, percent: 0 };
    }

    const context: GameContext = {
        heroes: gameState.heroes,
        resources: gameState.resources,
        buildings: gameState.buildings,
        crafting: gameState.crafting,
        recruitStats: gameState.recruitStats,
        ruinsRun: gameState.ruinsRun
    };

    const current = getCurrentValue(achievement.condition.type, context);
    const required = achievement.condition.value;
    const percent = Math.min(100, Math.round((current / required) * 100));

    return { current, required, percent };
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

export function getAllAchievements(): Achievement[] {
    return Object.values(ACHIEVEMENTS);
}

export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS[id];
}
