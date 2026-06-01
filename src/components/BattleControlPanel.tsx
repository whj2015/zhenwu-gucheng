import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store';
import { HERO_TEMPLATES } from '../data';
import { HERO_BATTLE_SKILLS, type BattleSkill } from '../data/battleSkills';
import { BATTLE_CONFIG } from '../gameConfig';
import { cn } from '../utils';
import HeroIcon from './HeroIcon';
import {
    Swords,
    Shield,
    SkipForward,
    Play,
    Pause,
    Timer,
    Sparkles,
    Target,
    ChevronDown,
    ChevronUp,
    Bot,
    Hand,
    Skull,
    Heart,
    X
} from 'lucide-react';

interface HeroBattleInfo {
    id: string;
    templateId: string;
    name: string;
    rarity: 'N' | 'R' | 'SR' | 'SSR';
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    currentAction: import('../types').SkillActionType | null;
}

interface EnemyBattleInfo {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    isAlive: boolean;
}

type PendingActionType = 'attack' | 'skill' | 'defend' | 'skip' | null;

export default function BattleControlPanel({
    heroes,
    enemies,
    battleLogs,
    onExecuteTurn,
    onAutoMode,
    onExit
}: {
    heroes: Array<{ id: string; templateId: string; hp: number; maxHp: number }>;
    enemies: Array<{ id: string; name: string; hp: number; maxHp: number; isAlive: boolean }>;
    battleLogs?: string[];
    onExecuteTurn?: (actions: Array<{ heroId: string; action: import('../types').SkillActionType }>) => void;
    onAutoMode?: () => void;
    onExit?: () => void;
}) {
    const manualBattle = useGameStore((s) => s.manualBattle);
    const setBattleMode = useGameStore((s) => s.setBattleMode);
    const spendEnergy = useGameStore((s) => s.spendEnergy);
    const setHeroAction = useGameStore((s) => s.setHeroAction);
    const executeManualTurn = useGameStore((s) => s.executeManualTurn);
    const togglePause = useGameStore((s) => s.togglePause);

    const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [showSkillDetail, setShowSkillDetail] = useState(false);
    const [pendingActionType, setPendingActionType] = useState<PendingActionType>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isManualMode = manualBattle?.mode === 'manual';
    const isPaused = manualBattle?.isPaused ?? false;

    const heroInfos: HeroBattleInfo[] = heroes.map(h => {
        const template = HERO_TEMPLATES[h.templateId];
        const energy = manualBattle?.heroEnergy[h.id];
        return {
            id: h.id,
            templateId: h.templateId,
            name: template?.name ?? '未知',
            rarity: template?.rarity ?? 'N',
            hp: h.hp,
            maxHp: h.maxHp,
            energy: energy?.current ?? 0,
            maxEnergy: energy?.max ?? BATTLE_CONFIG.ENERGY.MAX,
            currentAction: manualBattle?.pendingActions[h.id] ?? null
        };
    });

    const enemyInfos: EnemyBattleInfo[] = enemies.map(e => ({
        id: e.id,
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        isAlive: e.isAlive
    }));

    const selectedHero = heroInfos.find(h => h.id === selectedHeroId);
    const selectedSkill: BattleSkill | undefined = selectedHero 
        ? HERO_BATTLE_SKILLS[selectedHero.templateId] 
        : undefined;

    const needsTargetSelection = (actionType: PendingActionType): boolean => {
        if (!actionType || !selectedHero) return false;
        if (actionType === 'attack') return true;
        if (actionType === 'skill' && selectedSkill) {
            return selectedSkill.targetMode === 'single_enemy' || selectedSkill.targetMode === 'single_ally';
        }
        return false;
    };

    const canExecuteAction = (): boolean => {
        if (!selectedHeroId || !pendingActionType) return false;
        if (needsTargetSelection(pendingActionType) && !selectedTargetId) return false;
        if (pendingActionType === 'skill') {
            if (!selectedSkill || !selectedHero || selectedHero.energy < selectedSkill.cost) return false;
        }
        return true;
    };

    useEffect(() => {
        if (isManualMode && !isPaused && manualBattle) {
            timerRef.current = setInterval(() => {
                useGameStore.setState(state => {
                    if (!state.manualBattle || state.manualBattle.isPaused) return state;
                    const newRemaining = state.manualBattle.turnTimeRemaining - 1;
                    if (newRemaining <= 0) {
                        return {
                            manualBattle: {
                                ...state.manualBattle,
                                turnTimeRemaining: 0
                            }
                        };
                    }
                    return {
                        manualBattle: {
                            ...state.manualBattle,
                            turnTimeRemaining: newRemaining
                        }
                    };
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isManualMode, isPaused, manualBattle?.turnTimeRemaining]);

    useEffect(() => {
        if (manualBattle?.turnTimeRemaining === 0 && isManualMode && !isPaused) {
            handleAutoTimeout();
        }
    }, [manualBattle?.turnTimeRemaining]);

    const handleAutoTimeout = useCallback(() => {
        if (onAutoMode) {
            onAutoMode();
        }
    }, [onAutoMode]);

    const handleAttack = useCallback(() => {
        if (!selectedHeroId || !selectedTargetId) return;

        const success = spendEnergy(selectedHeroId, 0);
        if (success !== false) {
            setHeroAction(selectedHeroId, { type: 'attack', targetId: selectedTargetId });
        }
    }, [selectedHeroId, selectedTargetId, spendEnergy, setHeroAction]);

    const handleSkill = useCallback(() => {
        if (!selectedHero || !selectedSkill) return;

        let targetIds: string[] = [];
        
        switch (selectedSkill.targetMode) {
            case 'single_enemy':
                if (!selectedTargetId) return;
                targetIds = [selectedTargetId];
                break;
            case 'single_ally':
                targetIds = [heroInfos.find(h => h.id !== selectedHeroId)?.id ?? selectedHero.id];
                break;
            case 'all_enemies':
                targetIds = enemies.filter(e => e.isAlive).map(e => e.id);
                break;
            case 'all_allies':
                targetIds = heroInfos.map(h => h.id);
                break;
            case 'self':
                targetIds = [selectedHero.id];
                break;
        }

        const success = spendEnergy(selectedHeroId ?? '', selectedSkill.cost);
        if (success !== false) {
            setHeroAction(selectedHeroId ?? '', {
                type: 'skill',
                skillName: selectedSkill.name,
                targetIds,
                cost: selectedSkill.cost
            });
        }
    }, [selectedHero, selectedSkill, selectedTargetId, heroInfos, enemies, selectedHeroId, spendEnergy, setHeroAction]);

    const handleDefend = useCallback(() => {
        if (!selectedHeroId) return;
        setHeroAction(selectedHeroId, { type: 'defend' });
    }, [selectedHeroId, setHeroAction]);

    const handleSkip = useCallback(() => {
        if (!selectedHeroId) return;
        setHeroAction(selectedHeroId, { type: 'skip' });
    }, [selectedHeroId, setHeroAction]);

    const handleSelectAction = useCallback((actionType: PendingActionType) => {
        setPendingActionType(actionType);
        if (actionType === 'defend' || actionType === 'skip') {
            executeImmediateAction(actionType);
        }
    }, []);

    const executeImmediateAction = useCallback((actionType: 'defend' | 'skip') => {
        if (!selectedHeroId) return;
        if (actionType === 'defend') {
            handleDefend();
        } else if (actionType === 'skip') {
            handleSkip();
        }
        setPendingActionType(null);
        setSelectedTargetId(null);
    }, [selectedHeroId, handleDefend, handleSkip]);

    const handleConfirmAction = useCallback(() => {
        if (!canExecuteAction() || !pendingActionType) return;
        
        if (pendingActionType === 'attack') {
            handleAttack();
        } else if (pendingActionType === 'skill') {
            handleSkill();
        }
        
        setPendingActionType(null);
        setSelectedTargetId(null);
    }, [canExecuteAction, pendingActionType, handleAttack, handleSkill]);

    const handleExecuteTurn = useCallback(() => {
        const actions = executeManualTurn();
        if (onExecuteTurn && actions.length > 0) {
            const formattedActions = actions.map((action, idx) => ({
                heroId: Object.keys(manualBattle?.pendingActions ?? {})[idx] ?? '',
                action
            }));
            onExecuteTurn(formattedActions);
        }
        setSelectedHeroId(null);
        setSelectedTargetId(null);
        setPendingActionType(null);
    }, [executeManualTurn, onExecuteTurn, manualBattle?.pendingActions]);

    const allHeroesActed = heroInfos.every(h => h.currentAction !== null);
    const timePercent = manualBattle 
        ? (manualBattle.turnTimeRemaining / manualBattle.turnTimeLimit) * 100 
        : 100;
    const isTimeLow = (timePercent ?? 100) < 30;

    const handleHeroSelect = useCallback((heroId: string) => {
        setSelectedHeroId(heroId);
        setSelectedTargetId(null);
        setPendingActionType(null);
        setShowSkillDetail(false);
    }, []);

    const handleEnemySelect = useCallback((enemyId: string) => {
        if (!enemyInfos.find(e => e.id === enemyId)?.isAlive) return;
        setSelectedTargetId(enemyId);
    }, [enemyInfos]);

    if (!manualBattle) return null;

    return (
        <div className="h-full flex flex-col bg-[#0d0f12] text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0a0c0f]">
                <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-orange-400" />
                    <span className="font-serif font-bold text-sm tracking-wider">⚔ 战斗中</span>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <button
                        onClick={() => setBattleMode(isManualMode ? 'auto' : 'manual')}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border",
                            isManualMode 
                                ? "bg-violet-500/20 border-violet-500/50 text-violet-300 hover:bg-violet-500/30"
                                : "bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20"
                        )}
                    >
                        {isManualMode ? <Hand className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        {isManualMode ? '手动' : '自动'}
                    </button>

                    {/* Timer (only in manual mode) */}
                    {isManualMode && (
                        <div className="flex items-center gap-2">
                            <Timer className={cn("w-3.5 h-3.5 shrink-0", isTimeLow ? "text-red-400 animate-pulse" : "text-slate-500")} />
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-linear",
                                        timePercent > 50 ? "bg-gradient-to-r from-blue-500 to-violet-500" :
                                        timePercent > 30 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                                        "bg-gradient-to-r from-red-600 to-red-400"
                                    )}
                                    style={{ width: `${Math.max(0, timePercent)}%` }}
                                ></div>
                            </div>
                            <span className={cn(
                                "text-xs font-mono font-bold tabular-nums min-w-[2rem] text-right",
                                isTimeLow ? "text-red-400" : "text-slate-500"
                            )}>
                                {Math.max(0, manualBattle.turnTimeRemaining)}s
                            </span>

                            <button
                                onClick={togglePause}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    isPaused 
                                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                                )}
                            >
                                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    )}

                    {/* Exit Button */}
                    {onExit && (
                        <button
                            onClick={onExit}
                            className="p-1.5 rounded-md bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content: Battlefield Visualization */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Battlefield Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* Player Side */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2 px-1">
                            <Heart className="w-3.5 h-3.5" /> 我方军阵
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {heroInfos.map(hero => {
                                const isSelected = selectedHeroId === hero.id;
                                const hasAction = hero.currentAction !== null;
                                const hpPercent = (hero.hp / hero.maxHp) * 100;
                                
                                return (
                                    <button
                                        key={hero.id}
                                        onClick={() => handleHeroSelect(hero.id)}
                                        className={cn(
                                            "relative p-3 rounded-xl border transition-all duration-200 group",
                                            isSelected 
                                                ? "bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_16px_rgba(6,182,212,0.15)] scale-[1.02]" 
                                                : hasAction
                                                    ? "bg-emerald-500/5 border-emerald-500/30"
                                                    : "bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/40"
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <HeroIcon 
                                                icon={HERO_TEMPLATES[hero.templateId]?.icon}
                                                name={hero.name}
                                                rarity={hero.rarity}
                                                size="md"
                                            />
                                            <span className={cn(
                                                "font-serif font-bold text-xs truncate w-full text-center",
                                                isSelected ? "text-cyan-200" : "text-slate-300"
                                            )}>
                                                {hero.name}
                                            </span>
                                            
                                            {/* HP Bar */}
                                            <div className="w-full relative">
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-300",
                                                            hpPercent > 60 ? "bg-emerald-500" : hpPercent > 30 ? "bg-amber-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 whitespace-nowrap">
                                                    HP {Math.max(0, hero.hp)}/{hero.maxHp}
                                                </span>
                                            </div>

                                            {/* Status Indicators */}
                                            <div className="flex items-center gap-1.5 text-[9px]">
                                                {hasAction && (
                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">已行动 ✓</span>
                                                )}
                                                {!hasAction && (
                                                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
                                                        ⚡{hero.energy}
                                                    </span>
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
                        <div className="text-xs font-bold uppercase tracking-widest text-red-400/80 flex items-center gap-2 px-1">
                            <Skull className="w-3.5 h-3.5" /> 敌方阵容
                        </div>
                        <div className="space-y-2">
                            {enemyInfos.map(enemy => {
                                const isSelected = selectedTargetId === enemy.id;
                                const hpPercent = enemy.isAlive ? (enemy.hp / enemy.maxHp) * 100 : 0;
                                
                                return (
                                    <button
                                        key={enemy.id}
                                        onClick={() => handleEnemySelect(enemy.id)}
                                        disabled={!enemy.isAlive}
                                        className={cn(
                                            "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                                            !enemy.isAlive && "opacity-40 cursor-not-allowed",
                                            enemy.isAlive && isSelected 
                                                ? "bg-red-500/15 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                                                : enemy.isAlive 
                                                    ? "bg-black/30 border-white/10 hover:border-red-500/30 hover:bg-red-950/20"
                                                    : "bg-slate-900/30 border-slate-800/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Skull className={cn("w-4 h-4", enemy.isAlive ? "text-red-400" : "text-slate-600")} />
                                                <span className={cn(
                                                    "font-serif font-bold text-sm",
                                                    enemy.isAlive ? "text-slate-200" : "line-through text-slate-600"
                                                )}>
                                                    {enemy.name}
                                                </span>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-mono px-2 py-0.5 rounded",
                                                enemy.isAlive ? "bg-red-500/15 text-red-400" : "bg-slate-800/50 text-slate-600"
                                            )}>
                                                {enemy.isAlive ? '存活' : '击破'}
                                            </span>
                                        </div>
                                        
                                        {/* HP Bar */}
                                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-300",
                                                    enemy.isAlive ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-slate-700"
                                                )}
                                                style={{ width: `${hpPercent}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] font-mono text-slate-500">
                                            <span>HP {Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
                                            {isSelected && enemy.isAlive && (
                                                <span className="text-red-400 animate-pulse">← 已选为目标</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Panel (when hero selected and not acted) */}
                {selectedHero && !selectedHero.currentAction && (
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
                        {/* Selected Hero Info */}
                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                            <HeroIcon 
                                icon={HERO_TEMPLATES[selectedHero.templateId]?.icon}
                                name={selectedHero.name}
                                rarity={selectedHero.rarity}
                                size="lg"
                            />
                            <div className="flex-1">
                                <div className="font-serif font-bold text-base text-slate-100">{selectedHero.name}</div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-mono text-violet-400">
                                        ⚡ 能量: {selectedHero.energy}/{selectedHero.maxEnergy}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">
                                        HP {selectedHero.hp}/{selectedHero.maxHp}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {!pendingActionType ? (
                            <div className="grid grid-cols-4 gap-3">
                                {/* Attack Button */}
                                <button
                                    onClick={() => handleSelectAction('attack')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-red-500/10 border-red-500/40 text-red-200 hover:bg-red-500/20 active:scale-95 transition-all"
                                >
                                    <Swords className="w-6 h-6" />
                                    <span className="text-xs font-bold">攻击</span>
                                    <span className="text-[9px] text-red-400/70">需选目标</span>
                                </button>

                                {/* Skill Button */}
                                <button
                                    onClick={() => handleSelectAction('skill')}
                                    disabled={!selectedSkill || selectedHero.energy < (selectedSkill?.cost ?? 999)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all relative overflow-hidden",
                                        selectedSkill && selectedHero.energy >= selectedSkill.cost
                                            ? "bg-violet-500/10 border-violet-500/40 text-violet-200 hover:bg-violet-500/20 active:scale-95"
                                            : "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                                    )}
                                >
                                    <Sparkles className="w-6 h-6" />
                                    <span className="text-xs font-bold">技能</span>
                                    <span className="text-[9px]">
                                        ✨ {selectedSkill?.cost ?? '-'}
                                    </span>
                                    {selectedSkill && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowSkillDetail(!showSkillDetail);
                                            }}
                                            className="absolute top-1 right-1 p-0.5 rounded bg-black/40 hover:bg-black/60 transition-colors"
                                        >
                                            {showSkillDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    )}
                                </button>

                                {/* Defend Button */}
                                <button
                                    onClick={() => handleSelectAction('defend')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-cyan-500/10 border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/20 active:scale-95 transition-all"
                                >
                                    <Shield className="w-6 h-6" />
                                    <span className="text-xs font-bold">防御</span>
                                    <span className="text-[9px] text-cyan-400/70">🛡️ +{BATTLE_CONFIG.ENERGY.DEFEND_ENERGY_GAIN}能量</span>
                                </button>

                                {/* Skip Button */}
                                <button
                                    onClick={() => handleSelectAction('skip')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 active:scale-95 transition-all"
                                >
                                    <SkipForward className="w-6 h-6" />
                                    <span className="text-xs font-bold">跳过</span>
                                    <span className="text-[9px] text-amber-400/70">⏭️ +{BATTLE_CONFIG.ENERGY.SKIP_ENERGY_GAIN}能量</span>
                                </button>
                            </div>
                        ) : (
                            /* Target Selection or Confirmation */
                            <div className="space-y-3">
                                {(pendingActionType === 'attack' || 
                                  (pendingActionType === 'skill' && selectedSkill?.targetMode === 'single_enemy')) && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-bold text-red-300 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            选择攻击目标
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {enemyInfos.filter(e => e.isAlive).map(enemy => (
                                                <button
                                                    key={enemy.id}
                                                    onClick={() => setSelectedTargetId(enemy.id)}
                                                    className={cn(
                                                        "p-2.5 rounded-lg border text-left transition-all",
                                                        selectedTargetId === enemy.id
                                                            ? "bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                                                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-red-500/30"
                                                    )}
                                                >
                                                    <div className="font-serif font-bold text-xs">{enemy.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                                        HP {enemy.hp}/{enemy.maxHp}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(pendingActionType === 'skill' && selectedSkill && selectedSkill.targetMode === 'single_ally') && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            选择友方目标
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {heroInfos.filter(h => h.id !== selectedHeroId).map(hero => (
                                                <button
                                                    key={hero.id}
                                                    onClick={() => setSelectedTargetId(hero.id)}
                                                    className={cn(
                                                        "p-2.5 rounded-lg border text-left transition-all",
                                                        selectedTargetId === hero.id
                                                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="font-serif font-bold text-xs">{hero.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                                        HP {hero.hp}/{hero.maxHp}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Confirm/Cancel Buttons */}
                                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            setPendingActionType(null);
                                            setSelectedTargetId(null);
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg border border-slate-500/30 text-slate-400 hover:bg-slate-500/10 transition-all text-sm font-bold"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleConfirmAction}
                                        disabled={!canExecuteAction()}
                                        className={cn(
                                            "flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                            canExecuteAction()
                                                ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 shadow-lg"
                                                : "bg-slate-500/10 border border-slate-500/20 text-slate-600 cursor-not-allowed"
                                        )}
                                    >
                                        确认{pendingActionType === 'attack' ? '攻击' : pendingActionType === 'skill' ? '释放' : ''}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Skill Detail Panel */}
                        {showSkillDetail && selectedSkill && (
                            <div className="bg-black/60 border border-violet-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{selectedSkill.icon}</div>
                                    <div className="flex-1">
                                        <div className="font-serif font-bold text-base text-violet-200">{selectedSkill.name}</div>
                                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{selectedSkill.description}</p>
                                        
                                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10">
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500">消耗</div>
                                                <div className="text-sm font-mono font-bold text-violet-400">{selectedSkill.cost}⚡</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500">冷却</div>
                                                <div className="text-sm font-mono font-bold text-amber-400">{selectedSkill.cooldown}回合</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500">类型</div>
                                                <div className="text-sm font-bold text-cyan-400 capitalize">{selectedSkill.type}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Battle Logs */}
                {battleLogs && battleLogs.length > 0 && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                            <Swords className="w-3.5 h-3.5 text-orange-400" /> 战斗日志
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                            {battleLogs.slice(-10).reverse().map((log, idx) => (
                                <div 
                                    key={`${idx}-${log}`}
                                    className="text-xs text-slate-400 font-mono leading-relaxed animate-in fade-in slide-in-from-right-2 duration-200"
                                >
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Control Bar */}
            <div className="border-t border-white/10 bg-[#0a0c0f]/90 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Left: Quick Hero Status */}
                    <div className="flex items-center gap-2">
                        {heroInfos.slice(0, 3).map(hero => {
                            const hasAction = hero.currentAction !== null;
                            return (
                                <div 
                                    key={hero.id}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono transition-all",
                                        hasAction ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-500"
                                    )}
                                >
                                    <span className="truncate max-w-[4rem]">{hero.name}</span>
                                    {hasAction ? <span>✓</span> : <span>⏳</span>}
                                </div>
                            );
                        })}
                        {heroInfos.length > 3 && (
                            <span className="text-[10px] text-slate-600">+{heroInfos.length - 3}</span>
                        )}
                    </div>

                    {/* Right: Execute Turn Button */}
                    {isManualMode && (
                        <button
                            onClick={handleExecuteTurn}
                            disabled={!allHeroesActed}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold tracking-wider transition-all",
                                allHeroesActed
                                    ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20 active:scale-95"
                                    : "bg-slate-500/10 border border-slate-500/20 text-slate-600 cursor-not-allowed"
                            )}
                        >
                            执行回合 ({heroInfos.filter(h => h.currentAction !== null).length}/{heroInfos.length})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
