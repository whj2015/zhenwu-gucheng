/* Extracted from GatePanel.tsx - MapExploreView */
import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { simulateBattle } from '../../engine/ruins';
import { HERO_TEMPLATES, ENEMY_TEMPLATES } from '../../data';
import { RuinsNode, PositionKey } from '../../types';
import { POSITION_CONFIG } from '../../data';
import { cn } from '../../utils';
import BattleResultPanel, { buildBattleResultData } from '../BattleResultPanel';
import NodeButton from './NodeButton';
import HeroAvatarCompact from './HeroAvatarCompact';

export default function MapExploreView({ onBattleComplete }: { onBattleComplete: (data: ReturnType<typeof buildBattleResultData>, node: RuinsNode) => void }) {
    const { ruinsRun, updateRun, heroes, addResources, healParty } = useGameStore();
    const [hoveredNode, setHoveredNode] = useState<RuinsNode | null>(null);

    if (!ruinsRun) return null;

    const handleNodeClick = (node: RuinsNode) => {
        if (!node.revealed || node.completed) return;

        if (node.type === 'battle' || node.type === 'boss') {
             const enemyData = (node as any).enemies.map((eId:string) => ({ ...ENEMY_TEMPLATES[eId], id: eId }));
             
             const activeHeros = Object.values(ruinsRun.party)
                 .filter((hId): hId is string => hId !== null)
                 .map(hId => heroes.find(x => x.id === hId)!)
                 .filter(Boolean);

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
    };

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

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col animate-in fade-in duration-500 relative">
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="font-serif text-xl lg:text-2xl text-slate-200 tracking-widest">第 {ruinsRun.currentFloor} 阵</h3>
                    <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <div className="flex flex-wrap gap-3 lg:gap-4 text-[9px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500/50"></span>可探索</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>营地</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/50"></span>宝箱</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50"></span>BOSS</span>
                </div>
            </div>

            {/* Node Grid */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 lg:gap-10 py-4 lg:py-6 relative">
                
                {/* Row 0 */}
                <div className="flex justify-center gap-4 lg:gap-8">
                    {ruinsRun.nodes.filter(n => n.id.includes('r0-')).map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                {/* Connector lines visual */}
                <div className="flex flex-col items-center gap-0">
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-transparent to-white/10"></div>
                </div>

                {/* Row 1 */}
                <div className="flex justify-center gap-4 lg:gap-8">
                    {ruinsRun.nodes.filter(n => n.id.includes('r1-')).map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                {/* Connector lines visual */}
                <div className="flex flex-col items-center gap-0">
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="w-px h-4 lg:h-8 bg-gradient-to-b from-transparent to-white/10"></div>
                </div>

                {/* Boss Row */}
                <div className="flex justify-center">
                    {ruinsRun.nodes.filter(n => n.type === 'boss').map(n => (
                        <NodeButton key={n.id} node={n} hovered={hoveredNode?.id === n.id} onHover={setHoveredNode} onClick={handleNodeClick} />
                    ))}
                </div>

                {/* Hover tooltip */}
                {hoveredNode && !hoveredNode.completed && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 lg:top-4 lg:right-0 lg:left-auto lg:translate-x-0 lg:mt-0 w-48 lg:w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-20">
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

            {/* Party Status Bar */}
            <div className="mt-auto pt-4 border-t border-white/5 bg-black/30 rounded-xl p-3 lg:p-4 backdrop-blur-sm">
                <div className="flex justify-center items-start gap-2">
                    {(['front-left','front-center','front-right','middle-left','middle-center','middle-right','back-left','back-center','back-right'] as PositionKey[]).map(pos => {
                        const hId = ruinsRun.party[pos];
                        return (
                            <div key={pos} className="flex flex-col items-center gap-1">
                                <HeroAvatarCompact heroId={hId} />
                                {!hId && (
                                    <span className="text-[8px] font-mono text-slate-700">{(POSITION_CONFIG[pos] || POSITION_CONFIG['front-center']).name}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
