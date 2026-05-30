/* Extracted from GatePanel.tsx - MapExploreView */
import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store';
import { simulateBattle } from '../../engine/ruins';
import { HERO_TEMPLATES, ENEMY_TEMPLATES, POSITION_CONFIG } from '../../data';
import { RuinsNode, PositionKey } from '../../types';
import { cn } from '../../utils';
import BattleResultPanel, { buildBattleResultData } from '../BattleResultPanel';
import HeroAvatarCompact from './HeroAvatarCompact';

type HeroTrait = 'assault' | 'flank' | 'tank' | 'support' | 'ranged';

const TRAIT_COLORS: Record<HeroTrait | 'ranged', { bg: string; text: string; label: string }> = {
    assault: { bg: 'bg-red-500/20', text: 'text-red-400', label: '突击' },
    flank: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: '侧翼' },
    tank: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '重装' },
    support: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '辅助' },
    ranged: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: '远程' },
};

const ROWS: Array<'front' | 'middle' | 'back'> = ['front', 'middle', 'back'];
const COLS = ['left', 'center', 'right'] as const;

function PartyCell({ heroId, position }: { heroId: string | null; position: PositionKey }) {
    if (!heroId) {
        const posConfig = POSITION_CONFIG[position] || POSITION_CONFIG['front-center'];
        return (
            <div className="w-full aspect-square rounded-xl border border-dashed border-white/5 bg-white/[0.01] flex items-center justify-center">
                <span className="text-[7px] font-mono text-slate-700">{posConfig.name}</span>
            </div>
        );
    }

    const t = HERO_TEMPLATES[heroId];
    const hero = useGameStore(s => s.heroes.find(h => h.id === heroId));
    const hpRatio = hero ? Math.max(0, hero.hp / (t.attributes.physique * 10)) : 0;
    const hpColor = hpRatio > 0.6 ? 'bg-emerald-500' : hpRatio > 0.3 ? 'bg-amber-500' : 'bg-red-500';
    const trait = t?.trait as HeroTrait | undefined;
    const traitStyle = trait ? TRAIT_COLORS[trait] : null;

    return (
        <div className="w-full aspect-square rounded-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center p-1 sm:p-2 transition-all hover:border-cyan-500/40 hover:bg-black/60">
            <span className="text-[9px] sm:text-xs font-serif font-bold truncate w-full text-center text-slate-200">
                {t?.name?.[0] || '?'}
            </span>
            {traitStyle && (
                <span className={cn("text-[6px] px-0.5 rounded", traitStyle.bg, traitStyle.text)}>
                    {traitStyle.label}
                </span>
            )}
            <div className="w-full h-1 sm:h-1.5 rounded-full bg-black/40 mt-0.5 overflow-hidden">
                <div className={cn("h-full transition-all", hpColor)} style={{ width: `${hpRatio * 100}%` }} />
            </div>
            <span className={cn("text-[7px] sm:text-[8px] font-mono", hpRatio > 0.6 ? "text-emerald-300" : hpRatio > 0.3 ? "text-amber-300" : "text-red-300")}>
                {hero ? Math.max(0, Math.floor(hero.hp)) : '--'}
            </span>
        </div>
    );
}

function EnemyNodeCell({ node, onClick, isHovered, onHover, onLeave }: {
    node: RuinsNode;
    onClick: () => void;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}) {
    if (!node.revealed) {
        return (
            <div className="w-full aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                <span className="text-lg opacity-20">?</span>
            </div>
        );
    }

    if (node.completed) {
        return (
            <div className="w-full aspect-square rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-30">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
        );
    }

    const info = getNodeInfo(node);
    const colorMap: Record<string, string> = {
        battle: 'border-orange-500/40 hover:border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.12)]',
        boss: 'border-red-500/40 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        camp: 'border-emerald-500/30 hover:border-emerald-400',
        armory: 'border-violet-500/30 hover:border-violet-400',
    };

    return (
        <button
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            className={cn(
                "relative w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200 cursor-pointer",
                "bg-red-950/20 hover:bg-red-950/35",
                colorMap[node.type] || 'border-white/10',
                isHovered && "scale-105 z-10"
            )}
        >
            <span className="text-[9px] sm:text-xs font-serif font-bold truncate w-full text-center text-slate-200">
                {info.icon} {info.name}
            </span>
            {(node.type === 'battle' || node.type === 'boss') && (node as any).enemies && (
                <span className="text-[7px] text-slate-500 font-mono">
                    x{(node as any).enemies.length}
                </span>
            )}
            {isHovered && !node.completed && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                    <div className={cn("font-serif text-xs font-bold mb-0.5", info.color)}>{info.name}</div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">{info.desc}</div>
                    <div className="mt-1 text-[9px] font-mono text-cyan-400/80">点击进入</div>
                </div>
            )}
        </button>
    );
}

function getNodeInfo(node: RuinsNode) {
    if (node.type === 'camp') return { name: '营地', icon: '🏕️', desc: '扎营修整，恢复血气', color: 'text-emerald-400' };
    if (node.type === 'armory') {
        const r = (node as any).rewardOptions?.[0];
        return { name: '武备库', icon: '📦', desc: r ? `可获得 ${r.type==='iron'?'铁锭':'陨铁'}x${r.amount}` : '', color: 'text-violet-400' };
    }
    if ((node.type === 'battle' || node.type === 'boss') && (node as any).enemies) {
        const names = (node as any).enemies.map((eId: string) => ENEMY_TEMPLATES[eId]?.name || eId);
        return { name: node.type === 'boss' ? 'BOSS' : '遭遇战', icon: node.type === 'boss' ? '💀' : '⚔️', desc: names.join('、'), color: node.type === 'boss' ? 'text-red-400' : 'text-orange-400' };
    }
    return { name: '', icon: '', desc: '', color: '' };
}

export default function MapExploreView({ onBattleComplete }: { onBattleComplete: (data: ReturnType<typeof buildBattleResultData>, node: RuinsNode) => void }) {
    const { ruinsRun, updateRun, heroes, addResources, healParty } = useGameStore();
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    if (!ruinsRun) return null;

    const handleNodeClick = useCallback((node: RuinsNode) => {
        if (!node.revealed || node.completed) return;

        if (node.type === 'camp') {
            healParty(0.2);
        } else if (node.type === 'armory') {
            const r = (node as any).rewardOptions?.[0];
            if (r) addResources({ [r.type]: r.amount });
        } else if (node.type === 'battle' || node.type === 'boss') {
            const activeHeros = Object.values(ruinsRun.party)
                .filter((hId): hId is string => hId !== null)
                .map(hId => heroes.find(x => x.id === hId)!)
                .filter(Boolean);

            const enemyIds = (node as any).enemies as string[];
            const enemyData = enemyIds.map((eId: string) => ({ ...ENEMY_TEMPLATES[eId], id: eId }));

            const res = simulateBattle(activeHeros, enemyData, HERO_TEMPLATES, ruinsRun.party);

            useGameStore.getState().applyCombatResults(res.remainingState, res.victory);

            const battleResultData = buildBattleResultData({
                victory: res.victory,
                logs: res.logs,
                remainingState: res.remainingState,
                heroes: activeHeros,
                enemies: enemyData,
                nodeType: node.type as 'battle' | 'boss',
                floorNumber: ruinsRun.currentFloor,
            });

            onBattleComplete(battleResultData, node);
            return;
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
    }, [ruinsRun, heroes, addResources, healParty, updateRun, onBattleComplete]);

    const completedCount = ruinsRun.nodes.filter(n => n.completed).length;
    const totalCount = ruinsRun.nodes.length;

    const getEnemyNodesForPosition = (rowIdx: number, colIdx: number): RuinsNode[] => {
        const rowNodes = ruinsRun.nodes.filter(n => {
            if (rowIdx === 0) return n.id.includes('r0-');
            if (rowIdx === 1) return n.id.includes('r1-');
            return n.type === 'boss';
        });
        return rowNodes.filter((_, i) => i % 3 === colIdx);
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-500 relative">

            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
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

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-8 py-2 sm:py-4 min-h-0">

                <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[220px] sm:max-w-[260px] lg:w-auto">
                    <div className="text-[10px] font-mono text-cyan-400/70 tracking-wider mb-0.5">我方阵型</div>
                    {ROWS.map(row => (
                        <div key={row} className="flex gap-1 sm:gap-1.5 w-full">
                            {COLS.map(col => {
                                const posKey = `${row}-${col}` as PositionKey;
                                const hId = ruinsRun.party[posKey];
                                return <PartyCell key={posKey} heroId={hId} position={posKey} />;
                            })}
                        </div>
                    ))}
                </div>

                <div className="hidden lg:flex flex-col items-center gap-1 px-3 py-2">
                    <div className="text-xl font-serif text-slate-600">⚔</div>
                    <div className="text-xs font-serif text-slate-500 tracking-widest">对 峙</div>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/15 to-transparent"></div>
                </div>

                <div className="lg:hidden flex items-center gap-2 py-1.5 w-full max-w-[260px] mx-auto">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"></div>
                    <span className="text-[10px] font-serif text-slate-500 tracking-wider">⚔ 对峙 ⚔</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/25 to-transparent"></div>
                </div>

                <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-[220px] sm:max-w-[260px] lg:w-auto">
                    <div className="text-[10px] font-mono text-red-400/70 tracking-wider mb-0.5">敌方阵型</div>
                    {ROWS.map((row, rowIdx) => (
                        <div key={row} className="flex gap-1 sm:gap-1.5 w-full">
                            {COLS.map((_, colIdx) => {
                                const nodes = getEnemyNodesForPosition(rowIdx, colIdx);
                                const node = nodes[0];
                                if (!node) {
                                    return <div key={`${row}-${colIdx}`} className="w-full aspect-square rounded-xl border border-dashed border-white/5 bg-white/[0.01]" />;
                                }
                                return (
                                    <EnemyNodeCell
                                        key={node.id}
                                        node={node}
                                        onClick={() => handleNodeClick(node)}
                                        isHovered={hoveredNodeId === node.id}
                                        onHover={() => setHoveredNodeId(node.id)}
                                        onLeave={() => setHoveredNodeId(null)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
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
