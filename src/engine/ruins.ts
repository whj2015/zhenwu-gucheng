import { RuinsNode, BattleNode, ArmoryNode, CampNode, HeroState, PositionKey, TROOP_ABSORB_PER_TROOP, TROOP_MAX_ABSORB, TROOP_HP_COST } from '../types';
import { POSITION_CONFIG, ENEMY_TEMPLATES } from '../data';
import { generateId } from '../utils';
import { MISSIONS } from '../data';

export function generateFloor(floorNumber: number, missionId: string): RuinsNode[] {
    const nodes: RuinsNode[] = [];
    const rows = 3;
    const cols = 2;
    const mission = MISSIONS[missionId] || MISSIONS.mine;

    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
            const num = Math.random();
            let type: 'battle' | 'armory' | 'camp' = 'battle';
            if (num < 0.2) type = 'camp';
            else if (num < 0.4) type = 'armory';

            const id = `f${floorNumber}-r${r}-c${c}-${generateId()}`;

            if (type === 'battle') {
                const enemiesCount = Math.min(3, floorNumber + 1);
                const enemies: string[] = [];
                for(let i=0; i<enemiesCount; i++) {
                     enemies.push(mission.enemyPool[Math.floor(Math.random() * mission.enemyPool.length)]);
                }
                nodes.push({ id, type: 'battle', completed: false, revealed: r === 0, columnIndex: c, enemies });
            } else if (type === 'camp') {
                nodes.push({ id, type: 'camp', completed: false, revealed: r === 0, columnIndex: c });
            } else {
                 const reward = missionId === 'corridor' || missionId === 'abyss'
                                ? { type: 'meteorite' as const, amount: floorNumber * 2 }
                                : { type: 'iron' as const, amount: 30 + floorNumber * 10 };
                nodes.push({ id, type: 'armory', completed: false, revealed: r === 0, columnIndex: c, rewardOptions: [reward] });
            }
        }
    }

    const bossId = mission.bossPool[Math.floor(Math.random() * mission.bossPool.length)];

    nodes.push({
        id: `f${floorNumber}-boss`,
        type: 'boss',
        completed: false,
        revealed: false,
        columnIndex: 0,
        enemies: [bossId]
    });

    return nodes;
}

interface PlayerState {
    id: string;
    templateId: string;
    hp: number;
    maxHp: number;
    troops: number;
    wounded: number;
    command: number;
    atkMod: number;
    defMod: number;
    agiMod: number;
    isRear: boolean;
    hitRate: number;
    posName: string;
    posKey: PositionKey;
    skillEffect?: any;
    hasFirstStruckThisRound: boolean;
    isBerserkActive: boolean;
    rallyBuffRoundsLeft: number;
    totalAtkBuff: number;
    totalDefBuff: number;
    dodgeChance: number;
    ironWillCap: number | null;
    equipment: { weapon?: { attack: number }; armor?: { defense: number } } | null;
}

interface EnemyState {
    templateId: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    agility: number;
    ability: any;
    isBerserked: boolean;
    furyCounter: number;
    isSummon: boolean;
}

export function simulateBattle(heroes: HeroState[], enemyDataList: any[], templates: any, party: Record<PositionKey, string | null>): { victory: boolean, logs: string[], remainingState: { id: string; hp: number; troops: number; wounded: number}[] } {
    const logs: string[] = [];

    const heroPosMap = new Map<string, PositionKey>();
    Object.entries(party).forEach(([pos, hId]) => {
        if (hId) heroPosMap.set(hId, pos as PositionKey);
    });

    const templateMap = new Map(heroes.map(h => [h.id, templates[h.templateId]]));

    let playerStates: PlayerState[] = heroes.map((h) => {
        const rawPos = heroPosMap.get(h.id) || 'front-center';
        const cfg = POSITION_CONFIG[rawPos] || POSITION_CONFIG['front-center'];
        const t = templateMap.get(h.id)!;
        let atkMod = 1, defMod = 1, agiMod = 1;

        switch (cfg.mainStat) {
            case 'attack': atkMod += cfg.modValue; break;
            case 'defense': defMod += cfg.modValue; break;
            case 'agility': agiMod += cfg.modValue; break;
        }

        const skillEffect = t.skillEffect || null;

        let maxHpBonus = 1;
        let ironWillCap = null;
        let dodgeChance = 0;

        if (skillEffect?.type === 'iron_will') {
            maxHpBonus = 1 + skillEffect.maxHpBonus;
            ironWillCap = skillEffect.damageCap;
        }

        if (skillEffect?.type === 'dodge' && (skillEffect.targetPositions.includes(rawPos) || skillEffect.trigger === 'always')) {
            dodgeChance = skillEffect.dodgeChance;
        }

        return {
            id: h.id,
            templateId: h.templateId,
            hp: h.hp,
            maxHp: t.attributes.physique * 10 * maxHpBonus,
            troops: h.troops || 0,
            wounded: (h as any).wounded || 0,
            command: t.attributes.command || 10,
            atkMod, defMod, agiMod,
            isRear: cfg.isRear,
            hitRate: cfg.hitRate,
            posName: cfg.name,
            posKey: rawPos,
            skillEffect,
            hasFirstStruckThisRound: false,
            isBerserkActive: false,
            rallyBuffRoundsLeft: 0,
            totalAtkBuff: 0,
            totalDefBuff: 0,
            dodgeChance,
            ironWillCap,
            equipment: (h as any).equipment || null,
        };
    });

    let enemyStates: EnemyState[] = enemyDataList.map(e => ({
        templateId: e.id || e.name,
        name: e.name,
        hp: e.hp,
        maxHp: e.hp,
        attack: e.attack,
        defense: e.defense,
        agility: e.agility,
        ability: e.ability || null,
        isBerserked: false,
        furyCounter: 0,
        isSummon: false,
    }));

    const getAliveEnemies = () => enemyStates.filter(e => e.hp > 0);
    const getAlivePlayers = () => playerStates.filter(ps => ps.hp > 0);

    const applyHeroSkillDamageReduction = (ps: PlayerState, rawDmg: number): number => {
        const se = ps.skillEffect;
        if (!se) return rawDmg;
        if (se.type === 'damage_reduction' && (se.targetPositions.includes(ps.posKey) || se.trigger === 'always')) {
            return rawDmg * (1 - se.value);
        }
        return rawDmg;
    };

    const applyEnemyAbilityDamageReduction = (enemy: EnemyState, rawDmg: number): number => {
        const ab = enemy.ability;
        if (!ab) return rawDmg;
        if (ab.type === 'heavy_armor' || ab.type === 'heavy_armor_fury') {
            return rawDmg * (1 - ab.damageReduction);
        }
        if (ab.type === 'formation') {
            const aliveAllies = getAliveEnemies().filter(e => e !== enemy && !e.isSummon).length;
            if (aliveAllies > 0) {
                return rawDmg * (1 - ab.allyDefenseBonus);
            }
        }
        return rawDmg;
    };

    const getEffectiveEnemyAttack = (enemy: EnemyState): number => {
        let atk = enemy.attack;
        const ab = enemy.ability;
        if (ab) {
            if (ab.type === 'berserk' && enemy.isBerserked) {
                atk *= ab.atkMultiplier;
            }
        }
        return atk;
    };

    const getEffectivePlayerAttack = (ps: PlayerState): number => {
        const h = heroes.find(hh => hh.id === ps.id);
        const t = templateMap.get(ps.id)!;
        let baseAtk = t.attributes.force + (h?.equipment?.weapon?.attack || 0) + Math.floor(ps.troops / 10);

        const hasCore = Array.from(heroPosMap.values()).some(p => p === 'middle-center');
        if (hasCore && ps.posName !== '核心') baseAtk *= 1.05;

        baseAtk *= ps.atkMod;

        if (ps.totalAtkBuff > 0) {
            baseAtk *= (1 + ps.totalAtkBuff);
        }

        const se = ps.skillEffect;
        if (se?.type === 'berserk' && ps.isBerserkActive) {
            baseAtk *= se.atkMultiplier;
        }

        return baseAtk;
    };

    for (let round = 1; round <= 25; round++) {
       logs.push(`--- 第 ${round} 回合 ---`);

       const logisticIdx = playerStates.findIndex(ps => ps.posKey === 'back-center');
       if (logisticIdx >= 0 && playerStates[logisticIdx].hp > 0) {
           const ps = playerStates[logisticIdx];
           const se = ps.skillEffect;
           let healRate = 0.03;
           if (se?.type === 'enhanced_heal' && se.targetPositions.includes(ps.posKey)) {
               healRate = se.enhancedValue;
           }
           const healAmt = Math.floor(ps.maxHp * healRate);
           if (healAmt > 0 && ps.hp < ps.maxHp) {
               ps.hp = Math.min(ps.maxHp, ps.hp + healAmt);
               logs.push(`💚 ${templateMap.get(ps.id)?.name}[${ps.posName}] 回复 ${healAmt} HP`);
           }
       }

       const moyanPs = playerStates.find(ps => {
           const t = templateMap.get(ps.templateId);
           return t?.skillEffect?.type === 'rally_cry';
       });
       if (moyanPs && moyanPs.hp > 0 && round % (moyanPs.skillEffect.intervalRounds) === 0) {
           const se = moyanPs.skillEffect;
           playerStates.forEach(ps => {
               if (ps.hp > 0) {
                   ps.rallyBuffRoundsLeft = se.durationRounds;
                   ps.totalAtkBuff = se.atkBuff || 0;
                   ps.totalDefBuff = (se as any).defBuff || 0;
               }
           });
           const buffParts = [];
           if (se.atkBuff) buffParts.push(`攻击+${Math.round(se.atkBuff*100)}%`);
           if ((se as any).defBuff) buffParts.push(`防御+${Math.round((se as any).defBuff*100)}%`);
           logs.push(`🎯 ${templateMap.get(moyanPs.id)?.name}发动【${templateMap.get(moyanPs.id)?.skillName}】！我方全体${buffParts.join('、')}(持续${se.durationRounds}回合)`);
       }

       playerStates.forEach(ps => {
           if (ps.rallyBuffRoundsLeft > 0) {
               ps.rallyBuffRoundsLeft--;
               if (ps.rallyBuffRoundsLeft <= 0) {
                   ps.totalAtkBuff = 0;
                   ps.totalDefBuff = 0;
               }
           }
           const se = ps.skillEffect;
           if (se?.type === 'berserk' && !ps.isBerserkActive && ps.hp > 0 && ps.hp / ps.maxHp < se.hpThreshold) {
               ps.isBerserkActive = true;
               logs.push(`🔥 ${templateMap.get(ps.id)?.name}进入【蛮冲】状态！攻击力+${Math.round((se.atkMultiplier-1)*100)}%！`);
           }
       });

       enemyStates.forEach(enemy => {
           if (enemy.hp <= 0) return;
           const ab = enemy.ability;
           if (ab?.type === 'berserk' && !enemy.isBerserked && enemy.hp / enemy.maxHp < ab.hpThreshold) {
               enemy.isBerserked = true;
               logs.push(ab.triggerLog.replace('{name}', enemy.name));
           }
       });

       const sortedPlayerIndices = playerStates
           .map((_, i) => i)
           .filter(i => playerStates[i].hp > 0)
           .sort((a, b) => playerStates[b].agiMod - playerStates[a].agiMod);

       playerStates.forEach(ps => ps.hasFirstStruckThisRound = false);

       for (const i of sortedPlayerIndices) {
           const ps = playerStates[i];
           if (ps.hp <= 0) continue;
           const t = templateMap.get(ps.id);

           let pAtk = getEffectivePlayerAttack(ps);

           const se = ps.skillEffect;
           let isFirstStrike = false;
           if (se?.type === 'first_strike_bonus' && !ps.hasFirstStruckThisRound) {
               pAtk *= (1 + se.value);
               isFirstStrike = true;
               ps.hasFirstStruckThisRound = true;
           }

           const aliveEnemies = getAliveEnemies();
           if (aliveEnemies.length === 0) break;

           const targetIdx = enemyStates.findIndex(e => e.hp > 0);
           if (targetIdx === -1) continue;

           const targetEnemy = enemyStates[targetIdx];
           let rawDmg = Math.max(1, Math.floor(pAtk - targetEnemy.defense));
           rawDmg = applyEnemyAbilityDamageReduction(targetEnemy, rawDmg);

           targetEnemy.hp -= rawDmg;

           const skillTag = isFirstStrike ? ' ⚡[快刀]' : '';
           logs.push(`${t.name}[${ps.posName}]${skillTag} 攻击 ${targetEnemy.name}，造成 ${rawDmg} 点伤害`);

           if (se?.type === 'cleave' && targetEnemy.hp <= 0) {
               const secondTarget = enemyStates.findIndex((e, idx) => idx !== targetIdx && e.hp > 0);
               if (secondTarget !== -1) {
                   let cleaveDmg = Math.max(1, Math.floor(rawDmg * se.value));
                   cleaveDmg = applyEnemyAbilityDamageReduction(enemyStates[secondTarget], cleaveDmg);
                   enemyStates[secondTarget].hp -= cleaveDmg;
                   logs.push(`  ↘️ [偃月溅射] 对 ${enemyStates[secondTarget].name} 造成额外 ${cleaveDmg} 点伤害`);
               }
           }

           if (getAliveEnemies().length === 0) {
               logs.push('⚔️ 战斗胜利！');
               return { victory: true, logs, remainingState: playerStates.map(s => ({ ...s, hp: s.hp > 0 ? s.hp : 0, troops: Math.max(0, s.troops), wounded: s.wounded })) };
           }

           if (se?.type === 'extra_action_chance' && ps.hp > 0 && Math.random() < se.value) {
               const extraTarget = enemyStates.findIndex(e => e.hp > 0);
               if (extraTarget !== -1) {
                   const extraDmg = Math.max(1, Math.floor(getEffectivePlayerAttack(ps) * 0.6));
                   const et = enemyStates[extraTarget];
                   const finalExtraDmg = applyEnemyAbilityDamageReduction(et, extraDmg);
                   et.hp -= finalExtraDmg;
                   logs.push(`  💨 [灵动连击] ${t.name} 追击 ${et.name}，造成 ${finalExtraDmg} 点伤害`);
                   if (getAliveEnemies().length === 0) {
                       logs.push('⚔️ 战斗胜利！');
                       return { victory: true, logs, remainingState: playerStates.map(s => ({ ...s, hp: s.hp > 0 ? s.hp : 0, troops: Math.max(0, s.troops), wounded: s.wounded })) };
                   }
               }
           }
       }

       if (getAliveEnemies().length === 0) {
           logs.push('⚔️ 战斗胜利！');
           return { victory: true, logs, remainingState: playerStates.map(s => ({ ...s, hp: s.hp > 0 ? s.hp : 0, troops: Math.max(0, s.troops), wounded: s.wounded })) };
       }

       for (const enemy of enemyStates) {
           if (enemy.hp <= 0) continue;

           const ab = enemy.ability;
           if (ab?.type === 'warlord' && round === 1 && !enemy.isSummon) {
               for (let s = 0; s < ab.summonCount; s++) {
                   const summonTpl = ENEMY_TEMPLATES[ab.summonTemplateId];
                   if (summonTpl) {
                       enemyStates.push({
                           templateId: ab.summonTemplateId,
                           name: summonTpl.name,
                           hp: summonTpl.hp,
                           maxHp: summonTpl.hp,
                           attack: summonTpl.attack,
                           defense: summonTpl.defense,
                           agility: summonTpl.agility,
                           ability: summonTpl.ability || null,
                           isBerserked: false,
                           furyCounter: 0,
                           isSummon: true,
                       });
                   }
               }
               logs.push(ab.round1Log.replace('{name}', enemy.name).replace('{count}', String(ab.summonCount)));
           }

           const targets = playerStates
               .map((state, idx) => ({ idx, state }))
               .filter(({ state }) => state.hp > 0 && !state.isRear);

           if (targets.length === 0) {
               playerStates.forEach((state, idx) => {
                   if (state.hp > 0) targets.push({ idx, state });
               });
           }
           if (targets.length === 0) continue;

           let effectiveAtk = getEffectiveEnemyAttack(enemy);
           let furyActive = false;

           if (ab?.type === 'heavy_armor_fury') {
               enemy.furyCounter++;
               if (enemy.furyCounter % ab.furyInterval === 0) {
                   effectiveAtk *= ab.furyMultiplier;
                   furyActive = true;
                   logs.push(ab.triggerLog.replace('{name}', enemy.name));
               }
           }

           const totalWeight = targets.reduce((s, t) => s + t.state.hitRate, 0);
           let roll = Math.random() * totalWeight;
           let target = targets[0];
           for (const t of targets) {
               roll -= t.state.hitRate;
               if (roll <= 0) { target = t; break; }
           }

           const ps = playerStates[target.idx];
           const state = target.state;
           const pt = templateMap.get(ps.id)!;
           let pierceMult = 1;
           if (ab?.type === 'warlord') {
               pierceMult = 1 - ab.armorPierce;
               if (furyActive) logs.push(ab.pierceLog.replace('{name}', enemy.name).replace('{pct}', String(Math.round(ab.armorPierce*100))));
           }

           const aDef = ((ps.equipment?.armor?.defense || 0) * state.defMod * (1 + state.totalDefBuff)) * pierceMult;
           let rawDmg = Math.max(1, Math.floor(effectiveAtk - aDef));

           if (state.dodgeChance > 0 && Math.random() < state.dodgeChance) {
               logs.push(`✨ ${pt.name}[${state.posName}] 闪避了 ${enemy.name} 的攻击！`);
               continue;
           }

           rawDmg = applyHeroSkillDamageReduction(state, rawDmg);

           if (state.ironWillCap !== null) {
               const capDmg = state.maxHp * state.ironWillCap;
               if (rawDmg > capDmg) {
                   logs.push(`🛡️ ${pt.name}[不动] 承伤被限制为 ${Math.floor(capDmg)} HP（原本 ${rawDmg}）`);
                   rawDmg = Math.floor(capDmg);
               }
           }

           const absorbRate = Math.min(TROOP_MAX_ABSORB, state.troops * TROOP_ABSORB_PER_TROOP);
           const heroDmg = Math.max(1, Math.ceil(rawDmg * (1 - absorbRate)));
           const absorbedDmg = rawDmg - heroDmg + (absorbRate >= TROOP_MAX_ABSORB ? 0 : 0);

           state.hp -= heroDmg;

           let troopLoss = 0;
           let newWounded = 0;
           if (state.troops > 0 && absorbedDmg > 0) {
               troopLoss = Math.min(state.troops, Math.ceil(absorbedDmg / TROOP_HP_COST));
               const woundedRate = Math.min(0.85, 0.30 + state.command * 0.025);
               newWounded = Math.floor(troopLoss * woundedRate);
               const deadTroops = troopLoss - newWounded;
               state.troops -= troopLoss;
               state.wounded += newWounded;
           }

           const parts: string[] = [];
           parts.push(`${enemy.name} → ${pt.name}[${state.posName}]`);
           parts.push(`-${heroDmg}HP`);
           if (troopLoss > 0) {
               parts.push(`兵卒-${troopLoss}(${newWounded}伤)`);
           }
           logs.push(parts.join(' | '));
       }

       if (playerStates.every(s => s.hp <= 0)) {
           logs.push('💀 战斗失败...');
           return { victory: false, logs, remainingState: playerStates.map(s => ({ ...s, hp: 0, troops: 0 })) };
       }
    }

    logs.push('⏱️ 战斗超时...');
    return { victory: false, logs, remainingState: playerStates };
}

import { HERO_TEMPLATES } from '../data';
import { BattleState, BattleUnit, BattleRow, HeroTrait } from '../data';

export function initTacticalBattle(
    heroes: { id: string; templateId: string; hp: number; troops: number; wounded: number; equipment: any }[],
    enemyIds: string[],
    party: Record<PositionKey, string | null>
): BattleState {
    const templateMap = new Map(heroes.map(h => [h.id, HERO_TEMPLATES[h.templateId]]));

    const playerUnits: BattleUnit[] = [];
    Object.entries(party).forEach(([posKey, heroId]) => {
        if (!heroId) return;
        const hero = heroes.find(h => h.id === heroId);
        if (!hero || hero.hp <= 0) return;
        const t = templateMap.get(heroId);
        if (!t) return;

        const [row, col] = posKey.split('-');
        const colIdx = col === 'left' ? 0 : col === 'center' ? 1 : 2;

        playerUnits.push({
            id: heroId,
            name: t.name,
            side: 'player',
            hp: hero.hp,
            maxHp: t.attributes.physique * 10,
            row: row as BattleRow,
            col: colIdx,
            templateId: heroId,
            isAlive: true,
        });
    });

    const enemyUnits: BattleUnit[] = [];
    const rowCounts: Record<string, number> = { front: 0, middle: 0, back: 0 };

    enemyIds.forEach((eId, idx) => {
        const et = ENEMY_TEMPLATES[eId];
        if (!et) return;

        let row: BattleRow = et.enemyRow || 'front';
        if (idx >= 3) row = 'middle';
        if (idx >= 5) row = 'back';

        const colIdx = rowCounts[row] % 3;
        rowCounts[row]++;

        enemyUnits.push({
            id: eId,
            name: et.name,
            side: 'enemy',
            hp: et.hp,
            maxHp: et.hp,
            row,
            col: colIdx,
            templateId: eId,
            isAlive: true,
        });
    });

    return {
        round: 1,
        phase: 'player',
        playerUnits,
        enemyUnits,
        selectedAttacker: null,
        selectedTarget: null,
        logs: ['⚔️ 战斗开始！选择你的攻击目标'],
        victory: null,
        playerAttacksThisRound: {},
    };
}

export function canTarget(
    attackerId: string,
    targetId: string,
    battleState: BattleState
): { can: boolean; reason?: string } {
    const attacker = battleState.playerUnits.find(u => u.id === attackerId && u.isAlive);
    const target = battleState.enemyUnits.find(u => u.id === targetId && u.isAlive);
    if (!attacker || !target) return { can: false, reason: '无效目标' };

    const t = HERO_TEMPLATES[attacker.templateId || ''];
    const trait = t?.trait as HeroTrait | undefined;

    if (trait === 'flank' || trait === 'ranged') return { can: true };

    const aliveFrontEnemies = battleState.enemyUnits.filter(u => u.isAlive && u.row === 'front');
    if (aliveFrontEnemies.length > 0 && target.row !== 'front') {
        return { can: false, reason: '前方仍有敌人阻挡，无法攻击后排' };
    }

    return { can: true };
}

export function executePlayerAttack(battleState: BattleState): BattleState {
    const { selectedAttacker, selectedTarget, playerUnits, enemyUnits } = battleState;
    if (!selectedAttacker || !selectedTarget) return battleState;

    const attacker = playerUnits.find(u => u.id === selectedAttacker && u.isAlive);
    const target = enemyUnits.find(u => u.id === selectedTarget && u.isAlive);
    if (!attacker || !target) return battleState;

    const check = canTarget(selectedAttacker, selectedTarget, battleState);
    if (!check.can) {
        return { ...battleState, logs: [...battleState.logs, `⚠️ ${check.reason}`] };
    }

    const t = HERO_TEMPLATES[attacker.templateId || ''];
    const baseAtk = t?.attributes.force || 10;
    const et = ENEMY_TEMPLATES[target.templateId || ''];
    const defense = et?.defense || 5;

    let dmg = Math.max(1, Math.floor(baseAtk - defense * 0.5 + (Math.random() * baseAtk * 0.3)));

    const trait = t?.trait as HeroTrait | undefined;
    if (trait === 'assault') dmg = Math.floor(dmg * 1.15);
    if (trait === 'tank') dmg = Math.floor(dmg * 0.8);
    if (trait === 'support') dmg = Math.floor(dmg * 0.6);

    const posMod = attacker.row === 'front' ? 1.15 : attacker.row === 'back' ? 0.9 : 1.0;
    dmg = Math.floor(dmg * posMod);

    target.hp -= dmg;
    const targetKilled = target.hp <= 0;
    if (targetKilled) target.isAlive = false;

    const newLogs = [
        ...battleState.logs,
        `${attacker.name}[${attacker.row}排] → ${target.name}[${target.row}排]  -${dmg}HP${targetKilled ? ' 💀击破！' : ''}`
    ];

    const newAttacks = { ...battleState.playerAttacksThisRound, [selectedAttacker]: selectedTarget };

    const enemiesAlive = enemyUnits.some(u => u.isAlive);
    const newState: BattleState = {
        ...battleState,
        enemyUnits: [...enemyUnits],
        logs: newLogs,
        selectedAttacker: null,
        selectedTarget: null,
        playerAttacksThisRound: newAttacks,
        victory: !enemiesAlive ? true : null,
        phase: !enemiesAlive ? 'ended' : 'player',
    };

    return newState;
}

export function executeEnemyTurn(battleState: BattleState): BattleState {
    let { playerUnits, enemyUnits, logs, round } = battleState;

    let alivePlayers = playerUnits.filter(u => u.isAlive);
    const aliveEnemies = enemyUnits.filter(u => u.isAlive);

    const newLogs = [...logs];
    newLogs.push(`--- 第 ${round} 回合 敌方反击 ---`);

    for (const enemy of aliveEnemies) {
        const et = ENEMY_TEMPLATES[enemy.templateId || ''];
        if (!alivePlayers.length) break;

        const aliveFrontPlayers = alivePlayers.filter(p => p.row === 'front');
        let targets = aliveFrontPlayers.length > 0 ? aliveFrontPlayers : alivePlayers;

        const target = targets[Math.floor(Math.random() * targets.length)];
        const pt = HERO_TEMPLATES[target.templateId || ''];

        const atk = et?.attack || 10;
        const def = pt?.attributes.physique || 10;
        let dmg = Math.max(1, Math.floor(atk - def * 0.3 + (Math.random() * atk * 0.2)));

        target.hp -= dmg;
        if (target.hp <= 0) target.isAlive = false;

        alivePlayers = playerUnits.filter(u => u.isAlive);
        newLogs.push(`${enemy.name} → ${target.name}  -${dmg}HP${target.hp <= 0 ? ' 💀' : ''}`);
    }

    const playersAlive = playerUnits.some(u => u.isAlive);
    const enemiesAlive = enemyUnits.some(u => u.isAlive);

    return {
        ...battleState,
        playerUnits: [...playerUnits],
        logs: newLogs,
        round: playersAlive && enemiesAlive ? round + 1 : round,
        phase: (!playersAlive || !enemiesAlive) ? 'ended' as const : 'player' as const,
        victory: !playersAlive ? false : !enemiesAlive ? true : null,
        playerAttacksThisRound: {},
    };
}

export function endPlayerPhase(battleState: BattleState): BattleState {
    return { ...battleState, phase: 'enemy', selectedAttacker: null, selectedTarget: null };
}
