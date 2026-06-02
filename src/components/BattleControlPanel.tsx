import { useState, useCallback, useEffect, useRef } from 'react';
import { HERO_TEMPLATES } from '../data';
import { HERO_BATTLE_SKILLS, type BattleSkill } from '../data/battleSkills';
import { BATTLE_CONFIG } from '../gameConfig';
import { cn } from '../utils';
import HeroIcon from './HeroIcon';
import { TROOP_ABSORB_PER_TROOP, TROOP_MAX_ABSORB, TROOP_HP_COST, type SkillActionType } from '../types';
import {
    Swords, Shield, SkipForward, Play, Pause,
    Timer, Sparkles, Target, Bot, Hand, Skull, Heart, X, Users
} from 'lucide-react';

interface LiveHero {
    id: string;
    templateId: string;
    name: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    hp: number;
    maxHp: number;
    force: number;
    energy: number;
    maxEnergy: number;
    troops: number;
}

interface LiveEnemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    force: number;
    isAlive: boolean;
}

interface TurnResult {
    newHeroes: LiveHero[];
    newEnemies: LiveEnemy[];
    logs: string[];
    victory: boolean;
    defeat: boolean;
}

function resolveTurn(
    heroes: LiveHero[],
    enemies: LiveEnemy[],
    actions: Record<string, SkillActionType | null>
): TurnResult {
    const logs: string[] = [];
    logs.push(`[DEBUG] 收到 ${Object.keys(actions).length} 个行动指令`);
    Object.entries(actions).forEach(([id, act]) => logs.push(`[DEBUG]   ${id}: ${JSON.stringify(act)}`));

    const updatedHeroes = heroes.map(h => ({ ...h }));
    const updatedEnemies = enemies.map(e => ({ ...e }));
    const heroMap = Object.fromEntries(updatedHeroes.map(h => [h.id, h]));
    const enemyMap = Object.fromEntries(updatedEnemies.map(e => [e.id, e]));

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    function applyDamageToHero(target: LiveHero, rawDmg: number, sourceName: string, defendReduced: boolean): number {
        if (rawDmg <= 0 || target.hp <= 0) return 0;

        const absorbRate = Math.min(TROOP_MAX_ABSORB, target.troops * TROOP_ABSORB_PER_TROOP);
        const absorbedDmg = Math.floor(rawDmg * absorbRate);
        const hpDmg = rawDmg - absorbedDmg;
        const troopsLost = target.troops > 0 ? Math.min(target.troops, Math.ceil(absorbedDmg * TROOP_HP_COST)) : 0;

        target.troops = Math.max(0, target.troops - troopsLost);
        target.hp = clamp(target.hp - hpDmg, 0, target.maxHp);

        const parts: string[] = [];
        if (troopsLost > 0) parts.push(`兵卒抵挡${absorbedDmg}(-${troopsLost}人)`);
        if (hpDmg > 0) parts.push(`本体受创${hpDmg}`);
        if (defendReduced) parts.push('防御减伤');

        logs.push(`👹 ${sourceName} 攻击 ${target.name}，${parts.join('，') || '无伤'}`);

        return rawDmg;
    }

    for (const [heroId, action] of Object.entries(actions)) {
        if (!action) continue;
        const hero = heroMap[heroId];
        if (!hero || hero.hp <= 0) continue;

        switch (action.type) {
            case 'attack': {
                const target = enemyMap[action.targetId];
                if (!target || !target.isAlive) break;
                const dmg = Math.floor(hero.force * (0.9 + Math.random() * 0.2));
                target.hp = clamp(target.hp - dmg, 0, target.maxHp);
                if (target.hp <= 0) target.isAlive = false;
                logs.push(`⚔ ${hero.name} 率兵卒攻击 ${target.name}，造成 ${dmg} 点伤害${!target.isAlive ? '，击破！' : ''}`);
                break;
            }
            case 'skill': {
                const skill = HERO_BATTLE_SKILLS[hero.templateId];
                if (!skill) break;

                const targets = (action.targetIds || []).map(tid => enemyMap[tid] || heroMap[tid]).filter(Boolean);

                switch (skill.type) {
                    case 'attack':
                    case 'aoe':
                        targets.forEach(t => {
                            if (!t || t.hp <= 0) return;
                            const mult = skill.type === 'aoe' ? 0.85 : 1.0;
                            const dmg = Math.floor(hero.force * skill.value * mult * (0.9 + Math.random() * 0.2));
                            if ('isAlive' in t && t.id.startsWith('enemy_')) {
                                t.hp = clamp(t.hp - dmg, 0, t.maxHp);
                                if (t.hp <= 0) (t as any).isAlive = false;
                            } else {
                                applyDamageToHero(t as unknown as LiveHero, dmg, hero.name, false);
                            }
                            logs.push(`✨ ${hero.name} 施放【${skill.name}】对 ${(t as any).name ?? '目标'} 造成 ${dmg} 点伤害`);
                        });
                        break;
                    case 'heal':
                        targets.forEach(t => {
                            if (!t || t.hp <= 0) return;
                            const heal = Math.floor(t.maxHp * skill.value);
                            t.hp = clamp(t.hp + heal, 0, t.maxHp);
                            logs.push(`💚 ${hero.name} 施放【${skill.name}】为 ${(t as any).name ?? '目标'} 恢复 ${heal} 点生命`);
                        });
                        break;
                    case 'buff':
                        logs.push(`🛡 ${hero.name} 施放【${skill.name}】，进入强化状态`);
                        break;
                    case 'debuff':
                        logs.push(`😈 ${hero.name} 施放【${skill.name}】，削弱敌人`);
                        break;
                }
                hero.energy = Math.max(0, hero.energy - (skill.cost || 0));
                break;
            }
            case 'defend': {
                hero.energy = Math.min(hero.maxEnergy, hero.energy + BATTLE_CONFIG.ENERGY.DEFEND_ENERGY_GAIN);
                logs.push(`🛡 ${hero.name} 进入防御姿态 (+${BATTLE_CONFIG.ENERGY.DEFEND_ENERGY_GAIN}⚡) [兵卒:${hero.troops}]`);
                break;
            }
            case 'skip': {
                hero.energy = Math.min(hero.maxEnergy, hero.energy + BATTLE_CONFIG.ENERGY.SKIP_ENERGY_GAIN);
                logs.push(`⏭️ ${hero.name} 跳过本回合 (+${BATTLE_CONFIG.ENERGY.SKIP_ENERGY_GAIN}⚡) [兵卒:${hero.troops}]`);
                break;
            }
        }
    }

    updatedEnemies.filter(e => e.isAlive).forEach(enemy => {
        const aliveHeros = updatedHeroes.filter(h => h.hp > 0);
        if (aliveHeros.length === 0) return;
        const target = aliveHeros[Math.floor(Math.random() * aliveHeros.length)];
        let dmg = Math.floor(enemy.force * (0.8 + Math.random() * 0.4));
        const isDefending = actions[target.id]?.type === 'defend';
        if (isDefending) dmg = Math.floor(dmg * 0.5);
        applyDamageToHero(target, dmg, enemy.name, isDefending);
    });

    updatedHeroes.forEach(h => {
        if (h.hp > 0 && actions[h.id]) {
            h.energy = Math.min(h.maxEnergy, h.energy + BATTLE_CONFIG.ENERGY.PER_TURN_GAIN);
        }
    });

    const aliveEnemies = updatedEnemies.filter(e => e.isAlive).length;
    const aliveHeroes = updatedHeroes.filter(h => h.hp > 0).length;
    const victory = aliveEnemies === 0;
    const defeat = aliveHeroes === 0;

    if (victory) logs.push('🎉 战斗胜利！');
    if (defeat) logs.push('💀 战斗失败...');

    return { newHeroes: updatedHeroes, newEnemies: updatedEnemies, logs, victory, defeat };
}

export default function BattleControlPanel({
    initialHeroes,
    initialEnemies,
    onBattleEnd,
    onExit
}: {
    initialHeroes: Array<{ id: string; templateId: string; hp: number; maxHp: number; troops: number }>;
    initialEnemies: Array<{ id: string; name: string; hp: number; maxHp: number; isAlive: boolean }>;
    onBattleEnd?: (result: { victory: boolean; defeat: boolean; logs: string[]; finalHeroes: Array<{ id: string; hp: number; troops: number }> }) => void;
    onExit?: () => void;
}) {
    const [heroes, setHeroes] = useState<LiveHero[]>(() =>
        initialHeroes.map(h => {
            const t = HERO_TEMPLATES[h.templateId];
            return {
                id: h.id, templateId: h.templateId,
                name: t?.name ?? h.templateId,
                rarity: t?.rarity ?? 'N',
                hp: h.hp, maxHp: h.maxHp,
                force: t?.attributes.force ?? 10,
                energy: BATTLE_CONFIG.ENERGY.INITIAL,
                maxEnergy: BATTLE_CONFIG.ENERGY.MAX,
                troops: h.troops ?? 0
            };
        })
    );

    const [enemies, setEnemies] = useState<LiveEnemy[]>(() =>
        initialEnemies.map(e => ({
            id: e.id, name: e.name,
            hp: e.hp, maxHp: e.maxHp,
            force: 8, isAlive: e.isAlive
        }))
    );

    const [turnActions, setTurnActions] = useState<Record<string, SkillActionType | null>>({});
    const [logs, setLogs] = useState<string[]>([]);
    const [turnCount, setTurnCount] = useState(1);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT);

    const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [pendingActionType, setPendingActionType] = useState<'attack' | 'skill' | null>(null);
    const [showSkillDetail, setShowSkillDetail] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastClickRef = useRef<{ id: string; time: number } | null>(null);

    useEffect(() => {
        if (mode === 'manual' && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [mode, isPaused]);

    useEffect(() => {
        if (timeLeft === 0 && mode === 'manual' && !isPaused) {
            handleAutoExecute();
        }
    }, [timeLeft]);

    useEffect(() => {
        if (autoLoopRef.current) clearTimeout(autoLoopRef.current);
        if (mode !== 'auto' || isPaused) return;
        const aliveEnemyCount = enemies.filter(e => e.isAlive).length;
        const aliveHeroCount = heroes.filter(h => h.hp > 0).length;
        if (aliveEnemyCount === 0 || aliveHeroCount === 0) return;
        autoLoopRef.current = setTimeout(() => {
            handleAutoExecute();
        }, 800);
        return () => { if (autoLoopRef.current) clearTimeout(autoLoopRef.current); };
    }, [mode, turnCount, isPaused, heroes, enemies]);

    const selectedHero = heroes.find(h => h.id === selectedHeroId) ?? null;
    const selectedSkill: BattleSkill | undefined = selectedHero
        ? HERO_BATTLE_SKILLS[selectedHero.templateId]
        : undefined;

    const allActed = heroes.every(h => h.hp <= 0 || turnActions[h.id] !== undefined);
    const aliveHeroes = heroes.filter(h => h.hp > 0);
    const actedCount = aliveHeroes.filter(h => turnActions[h.id] !== undefined).length;

    const handleSelectHero = useCallback((id: string) => {
        setSelectedHeroId(id);
        setSelectedTargetId(null);
        setPendingActionType(null);
        setShowSkillDetail(false);
    }, []);

    const handleSelectEnemy = useCallback((id: string) => {
        const enemy = enemies.find(e => e.id === id);
        if (!enemy || !enemy.isAlive) {
            setErrorMsg('⚠️ 该目标已被击破，无法选择');
            setTimeout(() => setErrorMsg(null), 2000);
            return;
        }

        const now = Date.now();
        const last = lastClickRef.current;
        const isDoubleClick = last && last.id === id && (now - last.time) < 350;

        lastClickRef.current = { id, time: now };

        if (isDoubleClick && pendingActionType && selectedHeroId) {
            setErrorMsg(null);
            setSelectedTargetId(id);
            if (pendingActionType === 'attack') {
                setTurnActions(prev => ({ ...prev, [selectedHeroId]: { type: 'attack', targetId: id } }));
                setSelectedHeroId(null);
                setSelectedTargetId(null);
                setPendingActionType(null);
            } else if (pendingActionType === 'skill') {
                const skill = HERO_BATTLE_SKILLS[heroes.find(h => h.id === selectedHeroId)?.templateId ?? ''];
                if (!skill) return;
                let targetIds: string[] = [];
                switch (skill.targetMode) {
                    case 'single_enemy': targetIds = [id]; break;
                    case 'all_enemies': targetIds = enemies.filter(e => e.isAlive).map(e => e.id); break;
                    case 'all_allies': targetIds = heroes.filter(h => h.hp > 0).map(h => h.id); break;
                    default: targetIds = [selectedHeroId];
                }
                setTurnActions(prev => ({ ...prev, [selectedHeroId]: { type: 'skill', skillName: skill.name, targetIds, cost: skill.cost } }));
                setSelectedHeroId(null);
                setSelectedTargetId(null);
                setPendingActionType(null);
            }
        } else {
            setSelectedTargetId(id);
            setErrorMsg(null);
        }
    }, [enemies, heroes, pendingActionType, selectedHeroId]);

    const assignAction = useCallback((action: SkillActionType) => {
        if (!selectedHeroId) return;
        setTurnActions(prev => ({ ...prev, [selectedHeroId]: action }));
        setSelectedHeroId(null);
        setSelectedTargetId(null);
        setPendingActionType(null);
    }, [selectedHeroId]);

    const handleDefend = useCallback(() => {
        if (!selectedHeroId) return;
        assignAction({ type: 'defend' });
    }, [selectedHeroId, assignAction]);

    const handleSkip = useCallback(() => {
        if (!selectedHeroId) return;
        assignAction({ type: 'skip' });
    }, [selectedHeroId, assignAction]);

    const handlePickAction = useCallback((type: 'attack' | 'skill') => {
        setPendingActionType(type);
    }, []);

    // Refs for latest state to avoid stale closures and excessive effect re-runs
    const heroesRef = useRef(heroes);
    heroesRef.current = heroes;
    const enemiesRef2 = useRef(enemies);
    enemiesRef2.current = enemies;
    const turnCountRef = useRef(turnCount);
    turnCountRef.current = turnCount;
    const logsRef = useRef(logs);
    logsRef.current = logs;
    const aliveHeroesRef = useRef(aliveHeroes);
    aliveHeroesRef.current = aliveHeroes;
    const onBattleEndRef = useRef(onBattleEnd);
    onBattleEndRef.current = onBattleEnd;

    const resolveAndApply = useCallback((actions: Record<string, SkillActionType | null>) => {
        const currentHeroes = heroesRef.current;
        const currentEnemies = enemiesRef2.current;
        const currentTurnCount = turnCountRef.current;
        const currentLogs = logsRef.current;
        const currentAliveHeroes = aliveHeroesRef.current;

        const actionCount = Object.keys(actions).filter(k => actions[k] !== null).length;
        console.log('=== EXECUTE TURN ===');
        console.log('actionCount:', actionCount, 'of', currentAliveHeroes.length, 'heroes');
        console.log('actions:', JSON.stringify(actions));
        console.log('heroes before:', currentHeroes.map(h => ({ id: h.id, name: h.name, hp: h.hp, maxHp: h.maxHp, force: h.force })));
        console.log('enemies before:', currentEnemies.map(e => ({ id: e.id, name: e.name, hp: e.hp, maxHp: e.maxHp, force: e.force, alive: e.isAlive })));

        if (actionCount === 0) {
            console.warn('WARNING: 没有任何行动指令！跳过执行');
            setLogs(prev => [...prev, `⚠️ 第 ${currentTurnCount} 回合：未设置任何行动，跳过`]);
            return;
        }

        const result = resolveTurn(currentHeroes, currentEnemies, actions);

        console.log('result logs:', result.logs);
        console.log('victory:', result.victory, 'defeat:', result.defeat);
        console.log('heroes after:', result.newHeroes.map(h => ({ id: h.id, hp: h.hp, troops: h.troops })));
        console.log('enemies after:', result.newEnemies.map(e => ({ id: e.id, hp: e.hp, alive: e.isAlive })));
        console.log('enemies after JSON:', JSON.stringify(result.newEnemies.map(e => ({ id: e.id, hp: e.hp, alive: e.isAlive }))));

        setLogs(prev => [...prev, `--- 第 ${currentTurnCount} 回合 ---`, ...result.logs]);
        setHeroes(result.newHeroes);
        setEnemies(result.newEnemies);
        setTurnCount(c => c + 1);

        if (result.victory || result.defeat) {
            if (timerRef.current) clearInterval(timerRef.current);
            onBattleEndRef.current?.({
                victory: result.victory,
                defeat: result.defeat,
                logs: [...currentLogs, `--- 第 ${currentTurnCount} 回合 ---`, ...result.logs],
                finalHeroes: result.newHeroes.map(h => ({ id: h.id, hp: Math.max(0, h.hp), troops: h.troops }))
            });
            return;
        }

        setTurnActions({});
        setTimeLeft(BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT);
        setSelectedHeroId(null);
        setSelectedTargetId(null);
        setPendingActionType(null);
    }, []); // Stable: reads latest state from refs

    const handleAutoExecute = useCallback(() => {
        const currentHeroes = heroesRef.current;
        const currentEnemies = enemiesRef2.current;
        const autoActions: Record<string, SkillActionType> = {};
        currentHeroes.filter(h => h.hp > 0).forEach(h => {
            const aliveEnemy = currentEnemies.find(e => e.isAlive);
            if (aliveEnemy) {
                autoActions[h.id] = { type: 'attack', targetId: aliveEnemy.id };
            } else {
                autoActions[h.id] = { type: 'skip' };
            }
        });
        resolveAndApply(autoActions);
    }, [resolveAndApply]); // Only depends on stable resolveAndApply

    const prevAllActedRef = useRef(false);
    useEffect(() => {
        if (mode !== 'manual' || isPaused) return;
        if (allActed && !prevAllActedRef.current && aliveHeroes.length > 0) {
            prevAllActedRef.current = true;
            setTimeout(() => resolveAndApply(turnActions), 400);
        } else {
            prevAllActedRef.current = allActed;
        }
    }, [allActed, mode, isPaused, aliveHeroes, turnActions, resolveAndApply]);

    const toggleMode = useCallback(() => {
        setMode(m => m === 'manual' ? 'auto' : 'manual');
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(p => !p);
    }, []);

    if (mode === 'auto') {
        const aliveEnemyCount = enemies.filter(e => e.isAlive).length;
        const aliveHeroCount = heroes.filter(h => h.hp > 0).length;
        const battleOver = aliveEnemyCount === 0 || aliveHeroCount === 0;
        return (
            <div className="h-full flex flex-col items-center justify-center gap-6 bg-[#0d0f12] animate-in fade-in duration-300">
                <div className="text-center space-y-3">
                    <Bot className={cn("w-16 h-16 mx-auto", battleOver ? "text-slate-600" : "text-violet-400 animate-pulse")} />
                    <div className="font-serif text-xl font-bold text-slate-200">
                        {battleOver ? (aliveHeroCount === 0 ? '战斗失败' : '战斗胜利') : '自动战斗中...'}
                    </div>
                    <div className="text-sm text-slate-500">第 {turnCount} 回合</div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleMode} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all text-sm font-bold">
                        <Hand className="w-4 h-4 inline mr-1" /> 切换手动
                    </button>
                    <button onClick={togglePause} disabled={battleOver}
                        className={cn("px-4 py-2 rounded-lg border transition-all text-sm font-bold",
                            isPaused ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        )}>
                        {isPaused ? (<>▶ 继续</>) : (<>⏸ 暂停</>)}
                    </button>
                    {onExit && (
                        <button onClick={onExit} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {logs.length > 0 && (
                    <div className="w-full max-w-md max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                        {logs.slice(-12).map((log, i) => (
                            <div key={`${turnCount}-${i}-${log.slice(0, 10)}`} className="text-xs font-mono text-slate-400 px-2">{log}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const timePercent = (timeLeft / BATTLE_CONFIG.MANUAL_MODE.TURN_TIME_LIMIT) * 100;
    const isTimeLow = timePercent < 30;

    return (
        <div className="h-full flex flex-col bg-[#0d0f12] text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0a0c0f] shrink-0">
                <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <span className="font-serif font-bold text-sm tracking-wider">⚔ 战斗中</span>
                    <span className="text-[10px] font-mono text-slate-600">第{turnCount}回合</span>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleMode}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            mode === 'manual'
                                ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                                : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                        )}>
                        {mode === 'manual' ? <Hand className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        {mode === 'manual' ? '手动' : '自动'}
                    </button>

                    <div className="flex items-center gap-2">
                        <Timer className={cn("w-3.5 h-3.5", isTimeLow ? "text-red-400 animate-pulse" : "text-slate-500")} />
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-1000",
                                timePercent > 50 ? "bg-blue-500" : timePercent > 30 ? "bg-amber-500" : "bg-red-500"
                            )} style={{ width: `${Math.max(0, timePercent)}%` }} />
                        </div>
                        <span className={cn("text-xs font-mono min-w-[1.5rem]", isTimeLow ? "text-red-400" : "text-slate-500")}>
                            {timeLeft}s
                        </span>
                        <button onClick={togglePause}
                            className={cn("p-1.5 rounded-md", isPaused ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400")}
                        >
                            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    {onExit && (
                        <button onClick={onExit} className="p-1.5 rounded-md bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Battlefield Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Player Side */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5" /> 我方军阵
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {heroes.map((hero, idx) => {
                                const isSelected = selectedHeroId === hero.id;
                                const hasAction = turnActions[hero.id] !== undefined;
                                const dead = hero.hp <= 0;
                                const hpPct = Math.max(0, (hero.hp / hero.maxHp) * 100);

                                return (
                                    <button key={`hero-${hero.id}-${idx}`} onClick={() => !dead && handleSelectHero(hero.id)}
                                        disabled={dead}
                                        className={cn(
                                            "relative p-2.5 rounded-xl border transition-all",
                                            dead && "opacity-35 cursor-not-allowed border-slate-800/30 bg-slate-900/20",
                                            !dead && isSelected && "bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-[1.02]",
                                            !dead && hasAction && !isSelected && "bg-emerald-500/5 border-emerald-500/30",
                                            !dead && !hasAction && !isSelected && "bg-black/30 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            <HeroIcon icon={HERO_TEMPLATES[hero.templateId]?.icon} name={hero.name} rarity={hero.rarity} size="sm" />
                                            <span className="font-serif font-bold text-[11px] truncate w-full text-center">{hero.name}</span>
                                            <div className="w-full relative">
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full", hpPct > 60 ? "bg-emerald-500" : hpPct > 30 ? "bg-amber-500" : "bg-red-500")}
                                                        style={{ width: `${hpPct}%` }} />
                                                </div>
                                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-600 whitespace-nowrap">
                                                    {Math.max(0, hero.hp)}/{hero.maxHp}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px]">
                                                {hasAction ? (
                                                    <span className="text-emerald-400">✓</span>
                                                ) : dead ? (
                                                    <span className="text-red-600">✗</span>
                                                ) : (
                                                    <>
                                                        <span className="text-violet-400">⚡{hero.energy}</span>
                                                        <span className={cn("flex items-center gap-0.5", hero.troops > 0 ? "text-cyan-400" : "text-slate-600")}>
                                                            <Users className="w-2.5 h-2.5" />{hero.troops}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enemy Side */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-red-400/80 flex items-center gap-2">
                            <Skull className="w-3.5 h-3.5" /> 敌方阵容
                        </div>
                        <div className="space-y-2">
                            {enemies.map((enemy, idx) => {
                                const isSelected = selectedTargetId === enemy.id;
                                const hpPct = enemy.isAlive ? (enemy.hp / enemy.maxHp) * 100 : 0;

                                return (
                                    <button key={`enemy-${enemy.id}-${idx}`}
                                        onClick={() => handleSelectEnemy(enemy.id)}
                                        disabled={!enemy.isAlive}
                                        className={cn(
                                            "w-full p-3 rounded-xl border transition-all text-left",
                                            !enemy.isAlive && "opacity-35 cursor-not-allowed border-slate-800/30",
                                            enemy.isAlive && isSelected && "bg-red-500/15 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
                                            enemy.isAlive && !isSelected && "bg-black/30 border-white/10 hover:border-red-500/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Skull className={cn("w-4 h-4", enemy.isAlive ? "text-red-400" : "text-slate-600")} />
                                                <span className={cn("font-serif font-bold text-sm", enemy.isAlive ? "text-slate-200" : "line-through text-slate-600")}>
                                                    {enemy.name}
                                                </span>
                                            </div>
                                            <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded",
                                                enemy.isAlive ? "bg-red-500/15 text-red-400" : "bg-slate-800/50 text-slate-600"
                                            )}>
                                                {enemy.isAlive ? '存活' : '击破'}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full", enemy.isAlive ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-slate-700")}
                                                style={{ width: `${hpPct}%` }} />
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] font-mono text-slate-500">
                                            <span>HP {Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
                                            {isSelected && enemy.isAlive && <span className="text-red-400">← 目标</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Panel */}
                {selectedHero && turnActions[selectedHero.id] === undefined && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                            <HeroIcon icon={HERO_TEMPLATES[selectedHero.templateId]?.icon} name={selectedHero.name} rarity={selectedHero.rarity} size="lg" />
                            <div>
                                <div className="font-serif font-bold">{selectedHero.name}</div>
                                <div className="text-xs font-mono text-slate-400 mt-0.5">
                                    HP {selectedHero.hp}/{selectedHero.maxHp} · ⚡{selectedHero.energy}/{selectedHero.maxEnergy} · <span className={cn(selectedHero.troops > 0 ? "text-cyan-400" : "text-slate-600")}><Users className="w-3 h-3 inline" />{selectedHero.troops}</span>
                                </div>
                            </div>
                        </div>

                        {!pendingActionType ? (
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => handlePickAction('attack')}
                                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border bg-red-500/10 border-red-500/40 text-red-200 hover:bg-red-500/20 active:scale-95 transition-all">
                                    <Swords className="w-5 h-5" /><span className="text-[11px] font-bold">攻击</span><span className="text-[9px] text-red-400/60">选目标</span>
                                </button>
                                <button onClick={() => handlePickAction('skill')}
                                    disabled={!selectedSkill || selectedHero.energy < (selectedSkill?.cost ?? 999)}
                                    className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all",
                                        selectedSkill && selectedHero.energy >= selectedSkill.cost
                                            ? "bg-violet-500/10 border-violet-500/40 text-violet-200 hover:bg-violet-500/20 active:scale-95"
                                            : "bg-white/5 border-white/10 text-slate-600 cursor-not-allowed"
                                    )}>
                                    <Sparkles className="w-5 h-5" /><span className="text-[11px] font-bold">技能</span>
                                    <span className="text-[9px]">✨{selectedSkill?.cost ?? '-'}</span>
                                </button>
                                <button onClick={() => { handleDefend(); }}
                                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/20 active:scale-95 transition-all">
                                    <Shield className="w-5 h-5" /><span className="text-[11px] font-bold">防御</span><span className="text-[9px] text-cyan-400/60">+20⚡</span>
                                </button>
                                <button onClick={() => { handleSkip(); }}
                                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 active:scale-95 transition-all">
                                    <SkipForward className="w-5 h-5" /><span className="text-[11px] font-bold">跳过</span><span className="text-[9px] text-amber-400/60">+30⚡</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(pendingActionType === 'attack' ||
                                    (pendingActionType === 'skill' && selectedSkill?.targetMode === 'single_enemy')) && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-bold text-red-300"><Target className="w-4 h-4 inline mr-1" />选择攻击目标</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {enemies.filter(e => e.isAlive).map((e, idx) => (
                                                <button key={`target-${e.id}-${idx}`}
                                                    onClick={() => handleSelectEnemy(e.id)}
                                                    className={cn("p-2 rounded-lg border text-left transition-all",
                                                        selectedTargetId === e.id
                                                            ? "bg-red-500/20 border-red-500/50 text-red-200"
                                                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                                    )}>
                                                    <div className="font-serif font-bold text-xs">{e.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-500">HP {e.hp}/{e.maxHp}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-slate-600 text-center pt-1">
                                            💡 单击选择 · 双击确认行动
                                        </div>
                                    </div>
                                )}

                                {errorMsg && (
                                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono text-center animate-in fade-in duration-200">
                                        {errorMsg}
                                    </div>
                                )}
                            </div>
                        )}

                        {showSkillDetail && selectedSkill && (
                            <div className="bg-black/60 border border-violet-500/20 rounded-xl p-3">
                                <div className="text-lg mb-1">{selectedSkill.icon} <span className="font-serif font-bold text-violet-200 ml-2">{selectedSkill.name}</span></div>
                                <p className="text-sm text-slate-400">{selectedSkill.description}</p>
                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
                                    <div><div className="text-[10px] text-slate-500">消耗</div><div className="text-sm font-mono font-bold text-violet-400">{selectedSkill.cost}⚡</div></div>
                                    <div><div className="text-[10px] text-slate-500">冷却</div><div className="text-sm font-mono font-bold text-amber-400">{selectedSkill.cooldown}回</div></div>
                                    <div><div className="text-[10px] text-slate-500">类型</div><div className="text-sm font-bold text-cyan-400">{selectedSkill.type}</div></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Battle Logs */}
                {logs.length > 0 && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                        <div className="text-xs font-bold text-slate-500 mb-2"><Swords className="w-3.5 h-3.5 inline text-orange-400 mr-1" /> 战斗日志</div>
                        <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1">
                            {logs.slice(-10).reverse().map((log, i) => (
                                <div key={`${turnCount}-${i}-${log}`} className="text-xs font-mono text-slate-400 leading-relaxed">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10 bg-[#0a0c0f]/90 backdrop-blur-sm px-4 py-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {aliveHeroes.slice(0, 4).map((h, idx) => (
                            <div key={`bar-${h.id}-${idx}`} className={cn("flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono",
                                turnActions[h.id] ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-500"
                            )}>
                                <span className="truncate max-w-[3rem]">{h.name}</span>
                                {turnActions[h.id] ? '✓' : '⏳'}
                            </div>
                        ))}
                        {aliveHeroes.length > 4 && <span className="text-[10px] text-slate-600">+{aliveHeroes.length - 4}</span>}
                    </div>
                    <div className={cn("px-5 py-2 rounded-lg text-sm font-bold tracking-wider transition-all flex items-center gap-2",
                        allActed && aliveHeroes.length > 0
                            ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 animate-pulse"
                            : "bg-slate-500/10 border border-slate-500/20 text-slate-500"
                    )}>
                        {allActed && aliveHeroes.length > 0 ? (
                            <><Play className="w-3.5 h-3.5" /> 执行中...</>
                        ) : (
                            <>准备 ({actedCount}/{aliveHeroes.length})</>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
