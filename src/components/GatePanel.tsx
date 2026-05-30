import React, { useState } from 'react';
import { useGameStore } from '../store';
import { generateFloor } from '../engine/ruins';
import { MISSIONS } from '../data';
import { ChevronLeft, Archive, Navigation } from 'lucide-react';
import { RuinsNode } from '../types';
import BattleResultPanel, { buildBattleResultData } from './BattleResultPanel';
import BoardView from './gate/BoardView';
import MissionSelectionView from './gate/MissionSelectionView';
import SetupView from './gate/SetupView';
import MapExploreView from './gate/MapExploreView';
import ResultView from './gate/ResultView';

export default function GatePanel() {
    const { ruinsRun, updateRun, addResources } = useGameStore();
    const [selectedMission, setSelectedMission] = useState<string | null>(null);
    const [subPage, setSubPage] = useState<'board' | 'expedition' | null>(null);
    const [battleResult, setBattleResult] = useState<ReturnType<typeof buildBattleResultData> | null>(null);
    const [pendingNode, setPendingNode] = useState<RuinsNode | null>(null);

    const processPostBattle = (node: RuinsNode, victory: boolean) => {
        if (!ruinsRun) return;

        if (victory) {
            const rewardIron = (node.type === 'boss' ? 50 : 20) * ruinsRun.currentFloor;
            const rewardMet = node.type === 'boss' ? 10 * ruinsRun.currentFloor : 0;
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
    };
    
    const handleBattleConfirm = () => {
        if (!pendingNode || !battleResult) return;
        const node = pendingNode;
        const victory = battleResult.victory;
        processPostBattle(node, victory);
        setPendingNode(null);
    };
    
    const handleBattleRetreat = () => {
        if (!battleResult) return;
        const victory = battleResult.victory;
        if (!victory) {
            updateRun({ status: 'failed' });
        }
        setPendingNode(null);
    };
    
    if (battleResult) {
        return (
            <BattleResultPanel
                battleData={battleResult}
                onConfirm={() => {
                    setBattleResult(null);
                    setTimeout(() => handleBattleConfirm(), 50);
                }}
                onRetreat={() => {
                    setBattleResult(null);
                    setTimeout(() => handleBattleRetreat(), 50);
                }}
            />
        );
    }
    
    if (ruinsRun && ruinsRun.status !== 'setup') {
         if (ruinsRun.status === 'in_progress') return <MapExploreView onBattleComplete={(data, node) => { setBattleResult(data); setPendingNode(node); }} />;
         return <ResultView onReturn={() => setSelectedMission(null)} />;
    }
    
    if (selectedMission) {
         return <SetupView missionId={selectedMission} onCancel={() => setSelectedMission(null)} />;
    }

    if (subPage === 'board') {
        return (
            <div className="max-w-5xl mx-auto h-full flex flex-col pt-3 sm:pt-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 pb-2.5 sm:pb-3 lg:pb-4 border-b border-white/10">
                    <button onClick={() => setSubPage(null)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all mobile-touch-target">
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-sm sm:text-base lg:text-lg font-serif font-bold text-indigo-400 tracking-widest">告示板</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <BoardView />
                </div>
            </div>
        );
    }

    if (subPage === 'expedition') {
        return (
            <div className="max-w-5xl mx-auto h-full flex flex-col pt-3 sm:pt-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 pb-2.5 sm:pb-3 lg:pb-4 border-b border-white/10">
                    <button onClick={() => setSubPage(null)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all mobile-touch-target">
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-sm sm:text-base lg:text-lg font-serif font-bold text-orange-400 tracking-widest">兵马出征</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <MissionSelectionView onSelect={setSelectedMission} />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-4 sm:gap-5 lg:gap-5 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
                <button
                    onClick={() => setSubPage('board')}
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
                    onClick={() => setSubPage('expedition')}
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
