export interface EquipmentSet {
    id: string;
    name: string;
    description: string;
    pieces: number;
    rarity: 'normal' | 'rare' | 'epic' | 'legendary';
    bonuses: Array<{
        count: number;
        effects: Record<string, number>;
    }>;
    icon: string;
    color: string;
}

export const EQUIPMENT_SETS: EquipmentSet[] = [
    {
        id: 'iron_guard',
        name: '铁卫套',
        description: '坚固的铁甲套装',
        pieces: 2,
        rarity: 'normal',
        bonuses: [
            { count: 2, effects: { defense: 15, hp: 30 } }
        ],
        icon: '🛡️',
        color: 'gray'
    },
    {
        id: 'flame_blade',
        name: '炎锋套',
        description: '炽热的攻击型武器组合',
        pieces: 2,
        rarity: 'rare',
        bonuses: [
            { count: 2, effects: { attack: 20 } }
        ],
        icon: '🔥',
        color: 'orange'
    },
    {
        id: 'shadow_walker',
        name: '影行者套装',
        description: '提升敏捷与闪避',
        pieces: 2,
        rarity: 'epic',
        bonuses: [
            { count: 2, effects: { agility: 15, dodge: 5 } }
        ],
        icon: '🌑',
        color: 'purple'
    },
    {
        id: 'dragon_slayer',
        name: '屠龙者套装',
        description: '传说级别的终极装备',
        pieces: 2,
        rarity: 'legendary',
        bonuses: [
            { count: 2, effects: { attack: 35, defense: 20, hp: 80 } }
        ],
        icon: '🐉',
        color: 'red'
    }
];

export const RARITY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    normal: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', glow: '' },
    rare: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
    epic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', glow: 'shadow-purple-500/30' },
    legendary: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', glow: 'shadow-red-500/40' }
};

export const RARITY_LABELS: Record<string, string> = {
    normal: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};
