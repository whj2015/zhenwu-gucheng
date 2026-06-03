/* Extracted from GatePanel.tsx - MissionSelectionView */
import { MISSIONS } from '../../data';
import { MapPin } from 'lucide-react';
import { cn } from '../../utils';

export default function MissionSelectionView({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-8 pb-20 lg:pb-0">
            {Object.entries(MISSIONS).map(([id, m]) => (
                <div 
                    key={id}
                    className="bg-[#121418] border border-white/10 rounded-xl p-4 lg:p-6 relative overflow-hidden group hover:border-orange-500/50 hover:bg-black/60 transition-all cursor-pointer shadow-xl flex flex-col"
                    onClick={() => onSelect(id)}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 text-orange-400 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="flex space-x-2">
                                <div className={cn("text-[10px] font-mono tracking-widest px-2 py-1 rounded text-white", m.type === 'suppress' ? "bg-red-900/60" : "bg-cyan-900/60")}>
                                    {m.type === 'suppress' ? '剿匪' : '探索'}
                                </div>
                                <div className="text-[10px] font-mono tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded">
                                    LVL {m.recommendedLvl}+
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg lg:text-xl font-bold text-slate-200 mb-2 font-serif group-hover:text-orange-300 transition-colors">{m.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-1">{m.desc}</p>
                        
                        <div className="border-t border-white/5 pt-4 mt-auto">
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>层数: <span className="text-slate-300">{m.availableFloors} 层</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
