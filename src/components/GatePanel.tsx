import { useState, useCallback } from 'react';
import { useGameStore } from '../store';
import { generateFloor } from '../engine/ruins';
import { MISSIONS } from '../data';
import { COMBAT_CONFIG } from '../gameConfig';
import { ChevronLeft, Archive, Navigation } from 'lucide-react';
import { RuinsNode } from '../types';
import BattleResultPanel, { buildBattleResultData } from './BattleResultPanel';
import BoardView from './gate/BoardView';
import MissionSelectionView from './gate/MissionSelectionView';
import SetupView from './gate/SetupView';
import MapExploreView from './gate/MapExploreView';
import ResultView from './gate/ResultView';

type GateViewState = 
    | { phase: 'main' }
    | { phase: 'board' }
    | { phase: 'expedition' }
    | { phase: 'mission'; missionId: string }
    | { phase: 'setup'; missionId: string }
    | { phase: 'exploring' }
    | { phase: 'result' }
    | { phase: 'battle'; result: ReturnType<typeof buildBattleResultData>; pendingNode: RuinsNode };

export default function GatePanel() {
    const { ruinsRun, updateRun, addResources } = useGameStore();
    const [viewState, setViewState] = useState<GateViewState>({ phase: 'main' });

    const processPostBattle = useCallback((node: RuinsNode, victory: boolean) => {
        if (!ruinsRun) return;

        if (victory) {
            const rewardIron = (node.type === 'boss' ? COMBAT_CONFIG.REWARD_IRON_BASE * COMBAT_CONFIG.REWARD_IRON_BOSS_MULTIPLIER : COMBAT_CONFIG.REWARD_IRON_BASE) * ruinsRun.currentFloor;
            const rewardMet = node.type === 'boss' ? COMBAT_CONFIG.REWARD_METEORITE_BOSS_BASE * ruinsRun.currentFloor : 0;
            addResources({ iron: rewardIron, meteorite: rewardMet });
        }

        if (!victory) {
            updateRun({ status: 'failed' });
            return;
        }

        if (node.type === 'boss') {
            const nextFloor = ruinsRun.currentFloor + 1;
            const mission = MISSIONS[ruinsRun.missionId];
            const maxFloors = mission ? mission.availableFloors : 3;
            if (nextFloor > maxFloors) {
                updateRun({ status: 'completed' });
            } else {
                updateRun({ currentFloor: nextFloor, nodes: generateFloor(nextFloor, ruinsRun.missionId) });
            }
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
    }, [ruinsRun, updateRun, addResources]);

    const handleBattleConfirm = useCallback(() => {
        if (viewState.phase !== 'battle') return;
        const { pendingNode, result } = viewState;
        processPostBattle(pendingNode, result.victory);
        setViewState({ phase: 'main' });
    }, [viewState, processPostBattle]);
    
    const handleBattleRetreat = useCallback(() => {
        if (viewState.phase !== 'battle') return;
        const { result } = viewState;
        if (!result.victory) {
            updateRun({ status: 'failed' });
        }
        setViewState({ phase: 'main' });
    }, [viewState, updateRun]);

    const handleBattleComplete = useCallback((data: ReturnType<typeof buildBattleResultData>, node: RuinsNode) => {
        setViewState({ phase: 'battle', result: data, pendingNode: node });
    }, []);

    switch (viewState.phase) {
        case 'battle':
            return (
                <BattleResultPanel
                    battleData={viewState.result}
                    onConfirm={() => {
                        setViewState({ phase: 'main' });
                        setTimeout(() => handleBattleConfirm(), 50);
                    }}
                    onRetreat={() => {
                        setViewState({ phase: 'main' });
                        setTimeout(() => handleBattleRetreat(), 50);
                    }}
                />
            );

        case 'exploring':
            return <MapExploreView onBattleComplete={handleBattleComplete} />;

        case 'result':
            return <ResultView onReturn={() => setViewState({ phase: 'main' })} />;

        case 'mission':
            return <SetupView missionId={viewState.missionId} onCancel={() => setViewState({ phase: 'main' })} onDeploy={() => setViewState({ phase: 'exploring' })} />;

        case 'board':
            return (
                <div className="max-w-5xl mx-auto h-full flex flex-col pt-3 sm:pt-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 pb-2.5 sm:pb-3 lg:pb-4 border-b border-white/10">
                        <button onClick={() => setViewState({ phase: 'main' })} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all mobile-touch-target">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-sm sm:text-base lg:text-lg font-serif font-bold text-indigo-400 tracking-widest">告示板</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <BoardView />
                    </div>
                </div>
            );

        case 'expedition':
            return (
                <div className="max-w-5xl mx-auto h-full flex flex-col pt-3 sm:pt-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 pb-2.5 sm:pb-3 lg:pb-4 border-b border-white/10">
                        <button onClick={() => setViewState({ phase: 'main' })} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all mobile-touch-target">
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-sm sm:text-base lg:text-lg font-serif font-bold text-orange-400 tracking-widest">兵马出征</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <MissionSelectionView onSelect={(id) => setViewState({ phase: 'mission', missionId: id })} />
                    </div>
                </div>
            );

        default:
            if (ruinsRun && ruinsRun.status !== 'setup') {
                if (ruinsRun.status === 'in_progress') {
                    setViewState({ phase: 'exploring' });
                    return <MapExploreView onBattleComplete={handleBattleComplete} />;
                }
                setViewState({ phase: 'result' });
                return <ResultView onReturn={() => setViewState({ phase: 'main' })} />;
            }

            return (
                <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-4 sm:gap-5 lg:gap-5 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
                        <button
                            onClick={() => setViewState({ phase: 'board' })}
                            className="group relative bg-[#121418] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-3 sm:gap-4 hover:border-indigo-500/50 hover:bg-[#0e1015] transition-all duration-300 shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                                <Archive className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-indigo-400" />
                            </div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-slate-200 group-hover:text-indigo-300 transition-colors tracking-wide">告示板</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500 text-center leading-relaxed">城内布告、任务委托与物资兑换</p>
                        </button>

                        <button
                            onClick={() => setViewState({ phase: 'expedition' })}
                            className="group relative bg-[#121418] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-3 sm:gap-4 hover:border-orange-500/50 hover:bg-[#0e1015] transition-all duration-300 shadow-xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
                                <Navigation className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-orange-400" />
                            </div>
                            <h2 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-slate-200 group-hover:text-orange-300 transition-colors tracking-wide">兵马出征</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500 text-center leading-relaxed">率领门客深入废墟，讨伐流寇</p>
                        </button>
                    </div>
                </div>
            );
    }
}
