/**
 * Quest System Engine
 * 
 * Provides unified quest tracking, progress calculation,
 * and validation for all quest types.
 */

import type { QuestTemplate } from '../data';
import type { QuestState, GameState } from '../types';

export type QuestCategory = 'daily' | 'weekly';

export interface ActiveQuest {
    templateId: string;
    category: QuestCategory;
    acceptedAt?: number;
}

export interface QuestProgressInfo {
    current: number;
    required: number;
    percentage: number;
    isComplete: boolean;
    canTurnIn: boolean;
}

/**
 * Quest Type Definitions with tracking behavior
 */
export const QUEST_TYPE_CONFIG = {
    resource: {
        label: '资源',
        needsAcceptance: false,
        trackFromInventory: true,
        deductOnComplete: true,
        description: '检查当前仓库库存'
    },
    explore: {
        label: '探索',
        needsAcceptance: true,
        trackFromInventory: false,
        deductOnComplete: false,
        description: '完成战斗胜利次数'
    },
    craft: {
        label: '锻造',
        needsAcceptance: true,
        trackFromInventory: false,
        deductOnComplete: false,
        description: '完成装备锻造次数'
    },
    recruit: {
        label: '募兵',
        needsAcceptance: true,
        trackFromInventory: false,
        deductOnComplete: false,
        description: '累计募兵总人数'
    },
    boss_kill: {
        label: '击杀BOSS',
        needsAcceptance: true,
        trackFromInventory: false,
        deductOnComplete: false,
        description: '击杀BOSS次数'
    },
    deep_explore: {
        label: '深层探索',
        needsAcceptance: true,
        trackFromInventory: false,
        deductOnComplete: false,
        description: '完成深层探索次数'
    }
} as const;

export type QuestType = keyof typeof QUEST_TYPE_CONFIG;

/**
 * Get quest progress for a specific active quest
 */
export function getQuestProgress(
    questId: string,
    template: QuestTemplate,
    state: Pick<GameState, 'resources' | 'questState'>
): QuestProgressInfo {
    const { resources, questState } = state;
    
    let current: number;
    
    if (template.requireType === 'resource' && template.resourceKey) {
        // Resource quests: read from inventory in real-time
        current = resources[template.resourceKey as keyof typeof resources] || 0;
    } else {
        // Action quests: read from accumulated progress
        current = questState.progress[questId] || 0;
    }
    
    const required = template.amount;
    const percentage = Math.min(100, (current / required) * 100);
    const isComplete = current >= required;
    
    // Check if can turn in
    const config = QUEST_TYPE_CONFIG[template.requireType as QuestType];
    const isAccepted = !config.needsAcceptance || questState.acceptedIds?.includes(questId);
    const wasCompleted = template.category === 'daily'
        ? questState.completedDailyIds.includes(questId)
        : questState.completedWeeklyIds.includes(questId);
        
    const canTurnIn = !wasCompleted && isAccepted && isComplete;
    
    return {
        current,
        required,
        percentage,
        isComplete,
        canTurnIn
    };
}

/**
 * Validate if a quest can be turned in and calculate rewards/costs
 */
export function validateQuestTurnIn(
    questId: string,
    template: QuestTemplate,
    state: Pick<GameState, 'resources' | 'questState'>
): {
    valid: boolean;
    resourceCosts?: Partial<GameState['resources']>;
    resourceGains?: Partial<GameState['resources']>;
    error?: string;
} {
    const { resources, questState } = state;
    
    // Check if already completed
    const wasCompleted = template.category === 'daily'
        ? questState.completedDailyIds.includes(questId)
        : questState.completedWeeklyIds.includes(questId);
    
    if (wasCompleted) {
        return { valid: false, error: '任务已完成' };
    }
    
    // Check acceptance requirement
    const config = QUEST_TYPE_CONFIG[template.requireType as QuestType];
    if (config.needsAcceptance && !questState.acceptedIds?.includes(questId)) {
        return { valid: false, error: '任务未接取' };
    }
    
    // Check progress
    const progress = getQuestProgress(questId, template, state);
    if (!progress.isComplete) {
        return { valid: false, error: `进度不足 (${progress.current}/${progress.required})` };
    }
    
    // Calculate costs and gains
    const resourceGains: Partial<GameState['resources']> = {};
    const resourceCosts: Partial<GameState['resources']> = {};
    
    // Add rewards
    for (const [key, val] of Object.entries(template.rewards)) {
        resourceGains[key as keyof GameState['resources']] = 
            (resources[key as keyof GameState['resources']] || 0) + val;
    }
    
    // Deduct cost for resource quests
    if (template.requireType === 'resource' && template.resourceKey) {
        const key = template.resourceKey as keyof GameState['resources'];
        resourceCosts[key] = (resources[key] || 0) - template.amount;
    }
    
    return {
        valid: true,
        resourceCosts,
        resourceGains
    };
}

/**
 * Track progress for action-based quests
 * Call this whenever a relevant action occurs
 */
export function trackAction(
    actionType: QuestType,
    amount: number,
    questState: QuestState,
    templates: Record<string, QuestTemplate>
): Record<string, number> {
    const newProgress = { ...questState.progress };
    
    Object.entries(templates)
        .filter(([questId, template]) => {
            // Match quest type
            if (template.requireType !== actionType) return false;

            // Skip completed quests
            if (template.category === 'daily') {
                if (questState.completedDailyIds.includes(questId)) return false;
            } else {
                if (questState.completedWeeklyIds.includes(questId)) return false;
            }

            // Check acceptance for non-resource quests
            const config = QUEST_TYPE_CONFIG[actionType];
            if (config.needsAcceptance && !questState.acceptedIds?.includes(questId)) {
                return false;
            }

            return true;
        })
        .forEach(([questId, template]) => {
            const current = newProgress[questId] || 0;
            newProgress[questId] = Math.min(
                template.amount,
                current + amount
            );
        });
    
    return newProgress;
}

/**
 * Generate random daily quests from template pool
 */
export function generateDailyQuests(
    allTemplates: Record<string, QuestTemplate>,
    count: number = 6
): Map<string, QuestTemplate> {
    const dailyTemplates = Object.entries(allTemplates)
        .filter(([, t]) => t.category === 'daily');
    
    // Shuffle and pick
    const shuffled = dailyTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return new Map(selected);
}

/**
 * Generate random weekly quests from template pool
 */
export function generateWeeklyQuests(
    allTemplates: Record<string, QuestTemplate>,
    count: number = 3
): Map<string, QuestTemplate> {
    const weeklyTemplates = Object.entries(allTemplates)
        .filter(([, t]) => t.category === 'weekly');
    
    // Shuffle and pick
    const shuffled = weeklyTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return new Map(selected);
}
