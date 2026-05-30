/* Extracted from GatePanel.tsx - MapExploreView */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { simulateBattle, initTacticalBattle, executePlayerAttack, executeEnemyTurn, endPlayerPhase, canTarget } from '../../engine/ruins';
import { HERO_TEMPLATES, ENEMY_TEMPLATES, POSITION_CONFIG } from '../../data';
import { RuinsNode, PositionKey } from '../../types';
import { cn } from '../../utils';
import BattleResultPanel, { buildBattleResultData } from '../BattleResultPanel';
import NodeButton from './NodeButton';
import HeroAvatarCompact from './HeroAvatarCompact';

type HeroTrait = 'assault' | 'flank' | 'tank' | 'support' | 'ranged';

interface BattleUnit {
    id: string;
    name: string;
    side: 'player' | 'enemy';
    hp: number;
    maxHp: number;
    row: 'front' | 'middle' | 'back';
    col: number;
    templateId?: string;
    isAlive: boolean;
}

interface BattleState {
    round: number;
    phase: 'player' | 'enemy' | 'ended';
    playerUnits: BattleUnit[];
    enemyUnits: BattleUnit[];
    selectedAttacker: string | null;
    selectedTarget: string | null;
    logs: string[];
    victory: boolean | null;
    playerAttacksThisRound: Record<string, string>;
}

const TRAIT_COLORS: Record<HeroTrait | 'ranged', { bg: string; text: string; label: string }> = {
    assault: { bg: 'bg-red-500/20', text: 'text-red-400', label: '突击' },
    flank: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: '侧翼' },
    tank: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '重装' },
    support: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '辅助' },
    ranged: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: '远程' },
};

function BattleCell({ unit, isPlayerSide, isSelected, isSelectable, onSelect, reason }: {
    unit: { id: string; name: string; hp: number; maxHp: number; row: string; col: number; templateId?: string; isAlive: boolean };
    isPlayerSide: boolean;
    isSelected: boolean;
    isSelectable: boolean;
    onSelect: () => void;
    reason?: string;
    key?: React.Key;
}) {
    const hpRatio = unit.hp / unit.maxHp;
    const hpColor = hpRatio > 0.6 ? 'bg-emerald-500' : hpRatio > 0.3 ? 'bg-amber-500' : 'bg-red-500';
    
    const trait = (HERO_TEMPLATES[unit.templateId || '']?.trait || null) as HeroTrait | null;
    const traitStyle = trait ? TRAIT_COLORS[trait] : null;

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200",
                !unit.isAlive && "opacity-30",
                isSelected && "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-[1.05]",
                isSelectable && !isSelected && "border-emerald-400/60 hover:border-emerald-400 hover:scale-105 cursor-pointer hover:bg-emerald-500/10",
                !isSelectable && !unit.isAlive && "border-white/5 bg-white/[0.02] cursor-default",
                !isSelectable && unit.isAlive && "border-white/10 bg-white/[0.03] opacity-50 cursor-not-allowed",
                isPlayerSide ? "bg-black/40" : "bg-red-950/30"
            )}
            title={!isSelectable ? reason : undefined}
        >
            <span className="text-[9px] sm:text-xs font-serif font-bold truncate w-full text-center text-slate-200">
                {unit.name}
            </span>
            
            {traitStyle && (
                <span className={cn("text-[6px] sm:text-[7px] px-1 rounded-full mt-0.5", traitStyle.bg, traitStyle.text)}>
                    {traitStyle.label}
                </span>
            )}

            <div className="w-full h-1 sm:h-1.5 rounded-full bg-black/40 mt-1 overflow-hidden">
                <div 
                    className={cn("h-full transition-all duration-300", hpColor)}
                    style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                />
            </div>
            
            <span className={cn(
                "text-[8px] sm:text-[9px] font-mono mt-0.5",
                hpRatio > 0.6 ? "text-emerald-300" : hpRatio > 0.3 ? "text-amber-300" : "text-red-300"
            )}>
                {unit.isAlive ? Math.max(0, Math.floor(unit.hp)) : '💀'}
            </span>
            
            <span className="absolute top-0.5 right-1 text-[6px] text-slate-600 font-mono">
                {unit.row === 'front' ? '前' : unit.row === 'middle' ? '中' : '后'}
            </span>
        </div>
    );
}

function BattleGrid({ units, side, battleState, selectedAttacker, onUnitClick }: {
    units: BattleState['playerUnits'] | BattleState['enemyUnits'];
    side: 'player' | 'enemy';
    battleState: BattleState;
    selectedAttacker: string | null;
    onUnitClick: (unitId: string) => void;
}) {
    const isPlayerSide = side === 'player';
    
    const rows: Array<'front' | 'middle' | 'back'> = ['front', 'middle', 'back'];
    
    return (
        <div className="flex flex-col gap-1 sm:gap-1.5 w-full max-w-[180px] sm:max-w-[220px]">
            {rows.map(row => (
                <div key={row} className="flex gap-1 sm:gap-1.5">
                    {[0, 1, 2].map(col => {
                        const unit = units.find(u => u.row === row && u.col === col);
                        if (!unit) {
                            return (
                                <div 
                                    key={`${row}-${col}`}
                                    className="w-full aspect-square rounded-xl border border-dashed border-white/5 bg-white/[0.01]"
                                />
                            );
                        }

                        let isSelectable = false;
                        let reason: string | undefined;

                        if (isPlayerSide) {
                            isSelectable = unit.isAlive && battleState.phase === 'player';
                        } else if (selectedAttacker && battleState.phase === 'player') {
                            const check = canTarget(selectedAttacker, unit.id, battleState);
                            isSelectable = check.can && unit.isAlive;
                            reason = check.reason;
                        }

                        return (
                            <BattleCell
                                key={unit.id}
                                unit={unit}
                                isPlayerSide={isPlayerSide}
                                isSelected={selectedAttacker === unit.id}
                                isSelectable={isSelectable}
                                reason={reason}
                                onSelect={() => onUnitClick(unit.id)}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default function MapExploreView({ onBattleComplete }: { onBattleComplete: (data: ReturnType<typeof buildBattleResultData>, node: RuinsNode) => void }) {
    const { ruinsRun, updateRun, heroes, addResources, healParty } = useGameStore();
    const [hoveredNode, setHoveredNode] = useState<RuinsNode | null>(null);
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [currentNode, setCurrentNode] = useState<RuinsNode | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [enemyAnimating, setEnemyAnimating] = useState(false);

    if (!ruinsRun) return null;

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [battleState?.logs]);

    const handleNodeClick = useCallback((node: RuinsNode) => {
        if (!node.revealed || node.completed || enemyAnimating) return;

        if (node.type === 'battle' || node.type === 'boss') {
            const activeHeros = Object.values(ruinsRun.party)
                .filter((hId): hId is string => hId !== null)
                .map(hId => heroes.find(x => x.id === hId)!)
                .filter(Boolean);

            const enemyIds = (node as any).enemies as string[];
            
            const state = initTacticalBattle(activeHeros, enemyIds, ruinsRun.party);
            setBattleState(state);
            setCurrentNode(node);
            return;
        }

        if (node.type === 'camp') {
            healParty(0.2);
        } else if (node.type === 'armory') {
            const r = (node as any).rewardOptions[0];
            addResources({ [r.type]: r.amount });
        }

        const parts = node.id.split('-');
        if (parts.length >= 3) {
            const row = parseInt(parts[1].replace('r',''));
            const nextRow = row + 1;
            const updatedNodes = ruinsRun.nodes.map(n => {
                if (n.id === node.id) return { ...n, completed: true };
                if (n.id.includes(`r${nextRow}-`) || (row === 1 && n.type === 'boss')) return { ...n, revealed: true };
                return n;
            });
            updateRun({ nodes: updatedNodes });
        }
    }, [ruinsRun, heroes, addResources, healParty, updateRun, enemyAnimating]);

    const handleBattleUnitClick = useCallback((unitId: string) => {
        if (!battleState || battleState.phase !== 'player' || enemyAnimating) return;

        const isPlayerUnit = battleState.playerUnits.some(u => u.id === unitId);

        if (isPlayerUnit) {
            const unit = battleState.playerUnits.find(u => u.id === unitId);
            if (!unit || !unit.isAlive) return;

            if (battleState.selectedAttacker === unitId) {
                setBattleState(prev => prev ? { ...prev, selectedAttacker: null } : null);
            } else {
                setBattleState(prev => prev ? { ...prev, selectedAttacker: unitId } : null);
            }
            return;
        }

        if (battleState.selectedAttacker && !battleState.selectedTarget) {
            const check = canTarget(battleState.selectedAttacker, unitId, battleState);
            if (check.can) {
                const newState = executePlayerAttack({ ...battleState, selectedTarget: unitId });
                setBattleState(newState);

                if (newState.victory === true) {
                    setTimeout(() => {
                        setShowVictory(true);
                        setTimeout(() => handleBattleEnd(newState, true), 1500);
                    }, 300);
                }
            }
        }
    }, [battleState, enemyAnimating]);

    const handleEndTurn = useCallback(() => {
        if (!battleState || battleState.phase !== 'player' || enemyAnimating) return;

        const newState = endPlayerPhase(battleState);
        setBattleState(newState);
        setEnemyAnimating(true);

        setTimeout(() => {
            const afterEnemy = executeEnemyTurn(newState);
            setBattleState(afterEnemy);
            setEnemyAnimating(false);

            if (afterEnemy.victory === false) {
                setTimeout(() => handleBattleEnd(afterEnemy, false), 500);
            } else if (afterEnemy.victory === true) {
                setShowVictory(true);
                setTimeout(() => handleBattleEnd(afterEnemy, true), 1500);
            }
        }, 800);
    }, [battleState, enemyAnimating]);

    const handleBattleEnd = useCallback((finalState: BattleState, victory: boolean) => {
        if (!currentNode) return;

        const activeHeros = Object.values(ruinsRun.party)
            .filter((hId): hId is string => hId !== null)
            .map(hId => heroes.find(x => x.id === hId)!)
            .filter(Boolean);

        const enemyData = (currentNode as any).enemies.map((eId:string) => ({ ...ENEMY_TEMPLATES[eId], id: eId }));

        const res = simulateBattle(activeHeros, enemyData, HERO_TEMPLATES, ruinsRun.party);
        
        useGameStore.getState().applyCombatResults(res.remainingState, victory);

        const battleResultData = buildBattleResultData({
            victory,
            logs: finalState.logs,
            remainingState: res.remainingState,
            heroes: activeHeros,
            enemies: enemyData,
            nodeType: currentNode.type as 'battle' | 'boss',
            floorNumber: ruinsRun.currentFloor,
        });

        setBattleState(null);
        setCurrentNode(null);
        setShowVictory(false);

        onBattleComplete(battleResultData, currentNode);
    }, [currentNode, ruinsRun, heroes, onBattleComplete]);

    const handleRetreat = useCallback(() => {
        if (!battleState || enemyAnimating) return;
        
        setBattleState(null);
        setCurrentNode(null);
        setShowVictory(false);
    }, [battleState, enemyAnimating]);

    const getNodeLabel = (node: RuinsNode) => {
        if (node.type === 'camp') return { name: '营地', desc: '扎营修整，恢复血气与部分伤兵', color: 'text-emerald-400' };
        if (node.type === 'armory') {
            const r = (node as any).rewardOptions[0];
            return { name: '武备库', desc: `可获得 ${r.type==='iron'?'铁锭':'陨铁'}x${r.amount}`, color: 'text-violet-400' };
        }
        if ((node.type === 'battle' || node.type === 'boss') && (node as any).enemies) {
            const names = (node as any).enemies.map((eId: string) => ENEMY_TEMPLATES[eId]?.name || eId);
            return { 
                name: node.type === 'boss' ? 'BOSS' : '遭遇战', 
                desc: names.join('、'), 
                color: node.type === 'boss' ? 'text-red-400' : 'text-orange-400'
            };
        }
        return { name: '', desc: '', color: '' };
    };

    const completedCount = ruinsRun.nodes.filter(n => n.completed).length;
    const totalCount = ruinsRun.nodes.length;

    if (battleState && currentNode) {
        const alivePlayers = battleState.playerUnits.filter(u => u.isAlive).length;
        const aliveEnemies = battleState.enemyUnits.filter(u => u.isAlive).length;

        return (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-500 relative">
                
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h3 className="font-serif text-base sm:text-lg text-slate-200 tracking-widest">
                            第 {battleState.round} 回合
                        </h3>
                        <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded border",
                            battleState.phase === 'player' 
                                ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" 
                                : "text-red-400 bg-red-500/10 border-red-500/30"
                        )}>
                            {battleState.phase === 'player' ? '⚔️ 我方回合' : '🔥 敌方回合'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                            敌方剩余: <span className="text-red-400 font-bold">{aliveEnemies}</span>
                        </span>
                        <button
                            onClick={handleRetreat}
                            disabled={enemyAnimating}
                            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-2 py-1 rounded border border-white/5 hover:border-white/20 transition-all disabled:opacity-30"
                        >
                            撤退
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-10 py-2 sm:py-4 min-h-0">
                    
                    <div className="flex flex-col items-center gap-2 w-full lg:w-auto">
                        <div className="text-[10px] font-mono text-cyan-400/80 tracking-wider mb-1">我方阵型</div>
                        <BattleGrid
                            units={battleState.playerUnits}
                            side="player"
                            battleState={battleState}
                            selectedAttacker={battleState.selectedAttacker}
                            onUnitClick={handleBattleUnitClick}
                        />
                    </div>

                    <div className="hidden lg:flex flex-col items-center gap-2 px-4">
                        <div className="text-2xl font-serif text-slate-500">⚔️</div>
                        <div className="text-sm font-serif text-slate-600">VS</div>
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                    </div>

                    <div className="lg:hidden flex items-center gap-2 py-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                        <span className="text-xs font-serif text-slate-500">⚔️ VS ⚔️</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-full lg:w-auto">
                        <div className="text-[10px] font-mono text-red-400/80 tracking-wider mb-1">敌方阵型</div>
                        <BattleGrid
                            units={battleState.enemyUnits}
                            side="enemy"
                            battleState={battleState}
                            selectedAttacker={battleState.selectedAttacker}
                            onUnitClick={handleBattleUnitClick}
                        />
                    </div>
                </div>

                <div className="mt-2 sm:mt-3 bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl p-2 sm:p-3 max-h-[120px] sm:max-h-[150px] overflow-y-auto">
                    <div className="space-y-1">
                        {battleState.logs.slice(-20).map((log, idx) => (
                            <div 
                                key={idx} 
                                className={cn(
                                    "text-[10px] sm:text-xs font-mono leading-relaxed animate-in fade-in duration-200",
                                    log.includes('💀') ? 'text-red-400' :
                                    log.includes('击破') ? 'text-amber-400' :
                                    log.includes('胜利') ? 'text-emerald-400' :
                                    log.includes('失败') ? 'text-red-500' :
                                    log.includes('---') ? 'text-slate-600' :
                                    'text-slate-400'
                                )}
                            >
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                <div className="mt-3 sm:mt-4 flex items-center justify-between gap-3">
                    <div className="text-[9px] font-mono text-slate-600">
                        存活: <span className="text-cyan-400">{alivePlayers}</span> / {battleState.playerUnits.length}
                    </div>
                    
                    {battleState.phase === 'player' && !enemyAnimating && (
                        <button
                            onClick={handleEndTurn}
                            className={cn(
                                "px-4 sm:px-6 py-2 rounded-xl font-serif text-sm transition-all",
                                "border border-amber-500/30 bg-amber-500/10 text-amber-400",
                                "hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                                "active:scale-95"
                            )}
                        >
                            结束回合 →
                        </button>
                    )}

                    {(battleState.phase === 'enemy' || enemyAnimating) && (
                        <div className="px-4 sm:px-6 py-2 rounded-xl font-serif text-sm border border-red-500/30 bg-red-500/10 text-red-400 animate-pulse">
                            敌方行动中...
                        </div>
                    )}

                    {showVictory && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30 animate-in fade-in duration-300">
                            <div className="text-center animate-in zoom-in-95 duration-500">
                                <div className="text-4xl sm:text-5xl font-serif text-emerald-400 mb-2">
                                    {battleState.victory === true ? '🏆 战斗胜利！' : '💀 战斗失败...'}
                                </div>
                                <div className="text-sm text-slate-400 font-mono">结算中...</div>
                            </div>
                        </div>
                    )}

                    <div className="text-[9px] font-mono text-slate-600">
                        回合: {battleState.round}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col animate-in fade-in duration-500 relative">

            <div className="flex items-center justify-between mb-3 sm:mb-5 lg:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-slate-200 tracking-widest">第 {ruinsRun.currentFloor} 阵</h3>
                    <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded border border-white/5">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <div className="hidden sm:flex flex-wrap gap-2 sm:gap-3 lg:gap-4 text-[9px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500/50"></span>可探索</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>营地</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/50"></span>宝箱</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50"></span>BOSS</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-5 lg:gap-10 py-2 sm:py-4 lg:py-6 relative overflow-hidden">
                
                <div className="flex justify-center gap-4 lg:gap-8">
                    {ruinsRun.nodes.filter(n => n.id.includes('r0-')).map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-0">
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-transparent to-white/10"></div>
                </div>

                <div className="flex justify-center gap-4 lg:gap-8">
                    {ruinsRun.nodes.filter(n => n.id.includes('r1-')).map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                <div className="flex flex-col items-center gap-0">
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-transparent to-white/10"></div>
                </div>

                <div className="flex justify-center">
                    {ruinsRun.nodes.filter(n => n.type === 'boss').map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                {hoveredNode && !hoveredNode.completed && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 sm:top-4 sm:right-0 sm:left-auto sm:translate-x-0 sm:mt-0 w-48 lg:w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-20 sm:max-w-[200px]">
                        {(() => {
                            const info = getNodeLabel(hoveredNode);
                            return (
                                <>
                                    <div className={cn("font-serif font-bold text-sm mb-1", info.color)}>{info.name}</div>
                                    <div className="text-xs text-slate-400 leading-relaxed">{info.desc}</div>
                                    {hoveredNode.revealed && (
                                        <div className="mt-2 text-[10px] font-mono text-cyan-400/80">点击进入</div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-3 sm:pt-4 border-t border-white/5 bg-black/30 rounded-xl p-2.5 sm:p-3 lg:p-4 backdrop-blur-sm">
                <div className="grid grid-cols-3 sm:flex justify-center items-start gap-x-4 sm:gap-2 lg:gap-2 gap-y-1 sm:gap-y-0">
                    {(['front-left','front-center','front-right','middle-left','middle-center','middle-right','back-left','back-center','back-right'] as PositionKey[]).map(pos => {
                        const hId = ruinsRun.party[pos];
                        return (
                            <div key={pos} className="flex flex-col items-center gap-0.5 sm:gap-1">
                                <HeroAvatarCompact heroId={hId} />
                                {!hId && (
                                    <span className="text-[7px] sm:text-[8px] font-mono text-slate-700">{(POSITION_CONFIG[pos] || POSITION_CONFIG['front-center']).name}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
