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
    Hand
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

export default function BattleControlPanel({
    heroes,
    enemies,
    onExecuteTurn,
    onAutoMode
}: {
    heroes: Array<{ id: string; templateId: string; hp: number; maxHp: number }>;
    enemies: Array<{ id: string; name: string; hp: number; maxHp: number; isAlive: boolean }>;
    onExecuteTurn?: (actions: Array<{ heroId: string; action: import('../types').SkillActionType }>) => void;
    onAutoMode?: () => void;
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

    const selectedHero = heroInfos.find(h => h.id === selectedHeroId);
    const selectedSkill: BattleSkill | undefined = selectedHero 
        ? HERO_BATTLE_SKILLS[selectedHero.templateId] 
        : undefined;

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
            setSelectedTargetId(null);
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
            setSelectedTargetId(null);
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
    }, [executeManualTurn, onExecuteTurn, manualBattle?.pendingActions]);

    const allHeroesActed = heroInfos.every(h => h.currentAction !== null);
    const timePercent = manualBattle 
        ? (manualBattle.turnTimeRemaining / manualBattle.turnTimeLimit) * 100 
        : 100;
    const isTimeLow = (timePercent ?? 100) < 30;

    if (!manualBattle) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f12]/98 border-t border-white/10 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] via-[#0d0f12]/95 to-transparent pointer-events-none"></div>

            {/* Mode Switch & Timer Bar */}
            <div className="relative px-3 py-2 border-b border-white/5 flex items-center gap-3">
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
                    <div className="flex-1 flex items-center gap-2">
                        <Timer className={cn("w-3.5 h-3.5 shrink-0", isTimeLow ? "text-red-400 animate-pulse" : "text-slate-500")} />
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
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

                        {/* Pause Button */}
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

                {/* Execute Turn Button */}
                {isManualMode && (
                    <button
                        onClick={handleExecuteTurn}
                        disabled={!allHeroesActed}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all",
                            allHeroesActed
                                ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/50 text-cyan-200 hover:from-cyan-500/30 hover:to-violet-500/30 shadow-lg shadow-cyan-500/10"
                                : "bg-slate-500/5 border border-slate-500/20 text-slate-600 cursor-not-allowed"
                        )}
                    >
                        执行回合
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="relative flex">
                {/* Left: Hero List with Energy Bars */}
                <div className="w-48 lg:w-56 shrink-0 border-r border-white/5 p-2 space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5 px-1">
                        <Swords className="w-3 h-3 text-orange-400" /> 我军
                    </div>
                    
                    {heroInfos.map(hero => {
                        const skill = HERO_BATTLE_SKILLS[hero.templateId];
                        const isSelected = selectedHeroId === hero.id;
                        const hasAction = hero.currentAction !== null;
                        const energyPercent = (hero.energy / hero.maxEnergy) * 100;
                        const hpPercent = (hero.hp / hero.maxHp) * 100;

                        return (
                            <button
                                key={hero.id}
                                onClick={() => {
                                    setSelectedHeroId(hero.id);
                                    setSelectedTargetId(null);
                                    setShowSkillDetail(false);
                                }}
                                className={cn(
                                    "w-full p-2 rounded-lg border transition-all duration-200 text-left group",
                                    isSelected 
                                        ? "bg-violet-500/15 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]" 
                                        : hasAction
                                            ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                                            : "bg-black/20 border-white/5 hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <HeroIcon 
                                        icon={HERO_TEMPLATES[hero.templateId]?.icon}
                                        name={hero.name}
                                        rarity={hero.rarity}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "font-serif font-bold text-xs truncate",
                                                isSelected ? "text-violet-200" : "text-slate-200"
                                            )}>
                                                {hero.name}
                                            </span>
                                            {hasAction && (
                                                <span className="text-[9px] text-emerald-400 font-mono">✓</span>
                                            )}
                                        </div>
                                        
                                        {/* Energy Bar */}
                                        <div className="relative mt-1 group/energy">
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                                                    style={{ width: `${energyPercent}%` }}
                                                ></div>
                                            </div>
                                            <div className="absolute -top-4 left-0 right-0 hidden group-hover/energy:flex justify-center">
                                                <span className="text-[9px] font-mono text-violet-400 bg-black/80 px-1.5 py-0.5 rounded">
                                                    ⚡ {hero.energy}/{hero.maxEnergy}
                                                </span>
                                            </div>
                                        </div>

                                        {/* HP Bar */}
                                        <div className="relative mt-0.5">
                                            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-300",
                                                        hpPercent > 50 ? "bg-emerald-500" : hpPercent > 20 ? "bg-amber-500" : "bg-red-500"
                                                    )}
                                                    style={{ width: `${hpPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skill Cost Indicator */}
                                    {skill && (
                                        <div className={cn(
                                            "text-[10px] font-mono px-1 py-0.5 rounded",
                                            hero.energy >= skill.cost 
                                                ? "bg-violet-500/20 text-violet-300" 
                                                : "bg-slate-500/10 text-slate-600"
                                        )}>
                                            ✨{skill.cost}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Center: Action Buttons & Skill Detail */}
                <div className="flex-1 p-3 min-w-0">
                    {selectedHero ? (
                        <div className="space-y-3">
                            {/* Selected Hero Info */}
                            <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                <HeroIcon 
                                    icon={HERO_TEMPLATES[selectedHero.templateId]?.icon}
                                    name={selectedHero.name}
                                    rarity={selectedHero.rarity}
                                    size="md"
                                />
                                <div className="flex-1">
                                    <div className="font-serif font-bold text-sm text-slate-200">{selectedHero.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-mono text-violet-400">
                                            ⚡ {selectedHero.energy}/{selectedHero.maxEnergy}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            HP {selectedHero.hp}/{selectedHero.maxHp}
                                        </span>
                                    </div>
                                </div>
                                {selectedHero.currentAction && (
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                        已行动 ✓
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons Grid */}
                            {!selectedHero.currentAction && (
                                <div className="grid grid-cols-4 gap-2">
                                    {/* Attack */}
                                    <button
                                        onClick={handleAttack}
                                        disabled={!selectedTargetId}
                                        className={cn(
                                            "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all",
                                            selectedTargetId
                                                ? "bg-red-500/10 border-red-500/40 text-red-200 hover:bg-red-500/20 active:scale-95"
                                                : "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                                        )}
                                    >
                                        <Swords className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">攻击</span>
                                        <span className="text-[8px] text-slate-500">⚔️ 无消耗</span>
                                    </button>

                                    {/* Skill */}
                                    <button
                                        onClick={handleSkill}
                                        disabled={!selectedSkill || selectedHero.energy < (selectedSkill?.cost ?? 999)}
                                        className={cn(
                                            "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all relative overflow-hidden",
                                            selectedSkill && selectedHero.energy >= selectedSkill.cost
                                                ? "bg-violet-500/10 border-violet-500/40 text-violet-200 hover:bg-violet-500/20 active:scale-95"
                                                : "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                                        )}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">技能</span>
                                        <span className="text-[8px] text-slate-500">
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

                                    {/* Defend */}
                                    <button
                                        onClick={handleDefend}
                                        className="flex flex-col items-center gap-1 p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/20 transition-all active:scale-95"
                                    >
                                        <Shield className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">防御</span>
                                        <span className="text-[8px] text-cyan-400">🛡️ +{BATTLE_CONFIG.ENERGY.DEFEND_ENERGY_GAIN}能量</span>
                                    </button>

                                    {/* Skip */}
                                    <button
                                        onClick={handleSkip}
                                        className="flex flex-col items-center gap-1 p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 transition-all active:scale-95"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                        <span className="text-[10px] font-bold">跳过</span>
                                        <span className="text-[8px] text-amber-400">⏭️ +{BATTLE_CONFIG.ENERGY.SKIP_ENERGY_GAIN}能量</span>
                                    </button>
                                </div>
                            )}

                            {/* Skill Detail Panel */}
                            {showSkillDetail && selectedSkill && (
                                <div className="bg-black/40 border border-violet-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">{selectedSkill.icon}</div>
                                        <div className="flex-1">
                                            <div className="font-serif font-bold text-sm text-violet-200">{selectedSkill.name}</div>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedSkill.description}</p>
                                            
                                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                                                <div className="text-center">
                                                    <div className="text-[10px] text-slate-500">消耗</div>
                                                    <div className="text-xs font-mono font-bold text-violet-400">{selectedSkill.cost}⚡</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] text-slate-500">冷却</div>
                                                    <div className="text-xs font-mono font-bold text-amber-400">{selectedSkill.cooldown}回合</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] text-slate-500">类型</div>
                                                    <div className="text-xs font-bold text-cyan-400 capitalize">{selectedSkill.type}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Selection (for attack/skill) */}
                            {(selectedHero.currentAction?.type === 'attack' || 
                              (selectedHero.currentAction?.type === 'skill' && selectedSkill?.targetMode === 'single_enemy')) && (
                                <div className="pt-2 border-t border-white/5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                        <Target className="w-3 h-3 text-red-400" /> 选择目标
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {enemies.filter(e => e.isAlive).map(enemy => (
                                            <button
                                                key={enemy.id}
                                                onClick={() => setSelectedTargetId(enemy.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                                    selectedTargetId === enemy.id
                                                        ? "bg-red-500/20 border-red-500/50 text-red-200"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                                )}
                                            >
                                                {enemy.name}
                                                <span className="ml-1 text-[10px] font-mono text-slate-500">
                                                    HP:{enemy.hp}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* No Hero Selected */
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
                            <Hand className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs">选择一个英雄以指定行动</p>
                            <p className="text-[10px] mt-1 text-slate-600">点击左侧英雄头像</p>
                        </div>
                    )}
                </div>

                {/* Right: Enemy Status (compact) */}
                <div className="w-44 lg:w-52 shrink-0 border-l border-white/5 p-2 space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5 px-1">
                        <Target className="w-3 h-3 text-red-400" /> 敌方
                    </div>
                    
                    {enemies.map(enemy => (
                        <div 
                            key={enemy.id}
                            className={cn(
                                "p-2 rounded-lg border transition-all cursor-pointer",
                                enemy.isAlive 
                                    ? selectedTargetId === enemy.id 
                                        ? "bg-red-500/15 border-red-500/40" 
                                        : "bg-black/20 border-white/5 hover:bg-white/5"
                                    : "bg-slate-900/30 border-slate-800/30 opacity-50"
                            )}
                            onClick={() => enemy.isAlive && setSelectedTargetId(enemy.id)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "font-serif font-bold text-xs",
                                    enemy.isAlive ? "text-slate-200" : "line-through text-slate-600"
                                )}>
                                    {enemy.name}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                                    enemy.isAlive ? "bg-red-500/10 text-red-400" : "bg-slate-800/50 text-slate-600"
                                )}>
                                    {enemy.isAlive ? '存活' : '击破'}
                                </span>
                            </div>
                            <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        enemy.isAlive ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-slate-700"
                                    )}
                                    style={{ width: `${enemy.isAlive ? Math.max(0, (enemy.hp / enemy.maxHp) * 100) : 0}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-0.5 text-[9px] font-mono text-slate-600">
                                <span>HP {Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
