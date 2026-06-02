import { EQUIPMENT_SETS, EquipmentSet } from '../data/equipmentSets';
import type { HeroState } from '../types';

export interface SetBonusInfo {
    setId: string;
    setName: string;
    activePieces: number;
    requiredPieces: number;
    activeBonuses: Array<{ count: number; effects: Record<string, number> }>;
    isComplete: boolean;
    rarity: EquipmentSet['rarity'];
    icon: string;
    description: string;
}

const SET_EQUIPMENT_MAP: Record<string, { weaponIds: string[]; armorIds: string[] }> = {
    iron_guard: {
        weaponIds: ['iron_blade', 'iron_spear'],
        armorIds: ['leather_armor', 'chainmail']
    },
    flame_blade: {
        weaponIds: ['iron_spear', 'iron_bow'],
        armorIds: ['chainmail']
    },
    shadow_walker: {
        weaponIds: ['iron_bow'],
        armorIds: ['leather_armor']
    },
    dragon_slayer: {
        weaponIds: ['iron_blade', 'iron_spear', 'iron_bow'],
        armorIds: ['chainmail']
    }
};

function getEquipmentSetId(templateId: string, equipmentType: 'weapon' | 'armor'): string | null {
    for (const [setId, mapping] of Object.entries(SET_EQUIPMENT_MAP)) {
        const ids = equipmentType === 'weapon' ? mapping.weaponIds : mapping.armorIds;
        if (ids.includes(templateId)) {
            return setId;
        }
    }
    return null;
}

export function detectSetBonuses(hero: HeroState): SetBonusInfo[] {
    const results: SetBonusInfo[] = [];
    const { weapon, armor } = hero.equipment;

    const weaponSetId = weapon ? getEquipmentSetId(weapon.templateId, 'weapon') : null;
    const armorSetId = armor ? getEquipmentSetId(armor.templateId, 'armor') : null;

    const setPieceCount: Record<string, number> = {};

    if (weaponSetId) {
        setPieceCount[weaponSetId] = (setPieceCount[weaponSetId] || 0) + 1;
    }
    if (armorSetId) {
        setPieceCount[armorSetId] = (setPieceCount[armorSetId] || 0) + 1;
    }

    for (const setDef of EQUIPMENT_SETS) {
        const activePieces = setPieceCount[setDef.id] || 0;
        if (activePieces === 0) continue;

        const activeBonuses = setDef.bonuses.filter(b => b.count <= activePieces);
        
        results.push({
            setId: setDef.id,
            setName: setDef.name,
            activePieces,
            requiredPieces: setDef.pieces,
            activeBonuses,
            isComplete: activePieces >= setDef.pieces,
            rarity: setDef.rarity,
            icon: setDef.icon,
            description: setDef.description
        });
    }

    return results;
}

export function calculateSetStatBonus(hero: HeroState): Record<string, number> {
    const bonuses = detectSetBonuses(hero);
    const totalBonus: Record<string, number> = {};

    for (const setInfo of bonuses) {
        for (const bonus of setInfo.activeBonuses) {
            for (const [stat, value] of Object.entries(bonus.effects)) {
                totalBonus[stat] = (totalBonus[stat] || 0) + value;
            }
        }
    }

    return totalBonus;
}
