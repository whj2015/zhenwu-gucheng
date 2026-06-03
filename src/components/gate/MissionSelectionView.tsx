/* Extracted from GatePanel.tsx - MissionSelectionView */
import { useGameStore } from '../../store';
import { MISSIONS } from '../../data';
import { MapPin, Check, X, Sword } from 'lucide-react';
import { cn } from '../../utils';

type MissionStatus = 'available' | 'accepted' | 'in_progress';

export default function MissionSelectionView({ onSelect }: { onSelect: (id: string) => void }) {
    const acceptedMissions = useGameStore((s) => s.acceptedMissions);
    const ruinsRun = useGameStore((s) => s.ruinsRun);
    const acceptMission = useGameStore((s) => s.acceptMission);
    const abandonMission = useGameStore((s) => s.abandonMission);

    const getMissionStatus = (id: string): MissionStatus => {
        if (ruinsRun?.missionId === id) return 'in_progress';
        if (acceptedMissions.includes(id)) return 'accepted';
        return 'available';
    };

    const handleCardClick = (id: string) => {
        const status = getMissionStatus(id);
        if (status === 'available') {
            acceptMission(id);
        } else if (status === 'accepted') {
            onSelect(id);
        }
        // in_progress: do nothing, already running
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 pb-8 lg:pb-0">
            {Object.entries(MISSIONS).map(([id, m]) => {
                const status = getMissionStatus(id);
                const isDisabled = status === 'in_progress';

                return (
                    <div 
                        key={id}
                        className={cn(
                            "bg-[#121418] border rounded-xl p-4 lg:p-6 relative overflow-hidden group flex flex-col transition-all shadow-xl",
                            isDisabled
                                ? "border-cyan-500/20 opacity-60 cursor-not-allowed"
                                : status === 'accepted'
                                    ? "border-orange-500/30 hover:border-orange-500/50 cursor-pointer"
                                    : "border-white/10 hover:border-orange-500/50 hover:bg-black/60 cursor-pointer"
                        )}
                    >
                        {/* Background glow */}
                        <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 blur-2xl transition-colors pointer-events-none",
                            isDisabled ? "bg-cyan-500/5" : "bg-orange-500/5 group-hover:bg-orange-500/10"
                        )} />

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className={cn(
                                    "w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center border transition-all",
                                    isDisabled
                                        ? "bg-cyan-500/10 border-cyan-500/30"
                                        : status === 'accepted'
                                            ? "bg-orange-500/10 border-orange-500/30 group-hover:scale-110 group-hover:bg-orange-500/20"
                                            : "bg-white/5 border-white/10 group-hover:scale-110 group-hover:bg-orange-500/20"
                                )}>
                                    {isDisabled
                                        ? <Sword className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
                                        : <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                                    }
                                </div>
                                <div className="flex space-x-1.5">
                                    <span className={cn(
                                        "text-[10px] font-mono tracking-widest px-2 py-1 rounded",
                                        m.type === 'suppress' ? "bg-red-900/60 text-white" : "bg-cyan-900/60 text-white"
                                    )}>
                                        {m.type === 'suppress' ? '剿匪' : '探索'}
                                    </span>
                                    <span className="text-[10px] font-mono tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                                        LVL {m.recommendedLvl}+
                                    </span>
                                </div>
                            </div>

                            {/* Title & desc */}
                            <h3 className={cn(
                                "text-base lg:text-xl font-bold mb-2 font-serif transition-colors",
                                isDisabled ? "text-slate-400" : status === 'accepted' ? "text-slate-200 group-hover:text-orange-300" : "text-slate-200 group-hover:text-orange-300"
                            )}>{m.name}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{m.desc}</p>
                            
                            {/* Footer info */}
                            <div className="border-t border-white/5 pt-3 mt-auto">
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-3">
                                    <span>层数: <span className="text-slate-300">{m.availableFloors} 层</span></span>
                                    <span className={cn(
                                        "font-medium",
                                        status === 'in_progress' && "text-cyan-400",
                                        status === 'accepted' && "text-orange-400"
                                    )}>
                                        {status === 'in_progress' ? '进行中' : status === 'accepted' ? '已接取' : '可接取'}
                                    </span>
                                </div>

                                {/* Action button */}
                                {status === 'available' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); acceptMission(id); }}
                                        className="w-full py-2 rounded-lg bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-bold tracking-wider hover:bg-orange-500/25 hover:border-orange-500/40 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Check className="w-3.5 h-3.5" /> 接取任务
                                    </button>
                                )}
                                {status === 'accepted' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); abandonMission(id); }}
                                            className="flex-1 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 text-xs font-bold tracking-wider hover:bg-red-500/8 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <X className="w-3.5 h-3.5" /> 放弃
                                        </button>
                                        <button
                                            onClick={() => onSelect(id)}
                                            className="flex-1 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold tracking-wider hover:bg-orange-500/30 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <MapPin className="w-3.5 h-3.5" /> 布阵出发
                                        </button>
                                    </div>
                                )}
                                {status === 'in_progress' && (
                                    <div className="w-full py-2 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-cyan-400/70 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5">
                                        <Sword className="w-3.5 h-3.5 animate-pulse" /> 征战中...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
