/* Extracted from HeroesPanel.tsx - TavernView */
import React, { useEffect } from 'react';
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils';
import HeroIcon from '../HeroIcon';

export default function TavernView() {
    const { resources, recruitHero, heroes, tavernPool, tavernRefreshCount, refreshTavern, initTavernPool } = useGameStore();

    useEffect(() => {
        if (tavernPool.length === 0) {
            initTavernPool();
        }
    }, []);

    const refreshCost = 150 + tavernRefreshCount * 50;
    const canRefresh = resources.bingxiang >= refreshCost;
    const hiredIds = new Set(heroes.map(h => h.templateId));
    const availableHeroes = Object.keys(HERO_TEMPLATES).filter(id => !hiredIds.has(id));

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 pb-3 sm:pb-4 border-b border-white/10 gap-2 shrink-0">
                <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-serif text-slate-200">过客留名</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">酒馆中暂歇的游侠，每次仅露面三位</p>
                </div>
                <button
                    onClick={refreshTavern}
                    disabled={!canRefresh || availableHeroes.length < 3}
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap mobile-touch-target",
                        canRefresh && availableHeroes.length >= 3
                            ? "bg-orange-600/20 text-orange-400 border border-orange-500/30 hover:bg-orange-600/30"
                            : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                    )}
                >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    换一批 (-{refreshCost}饷)
                </button>
            </div>

            {tavernPool.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-500 text-xs sm:text-sm">暂无过客...</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-6 sm:pb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {tavernPool.map((id) => {
                        const t = HERO_TEMPLATES[id];
                        if (!t) return null;
                        const cost = t.quality === '将才' ? 1000 : 500;
                        const canAfford = resources.bingxiang >= cost;
                        const alreadyHired = hiredIds.has(id);

                        return (
                            <div key={id} className="bg-[#121418] border border-white/5 rounded-xl p-3 sm:p-4 lg:p-6 flex flex-col relative overflow-hidden group shadow-lg">
                                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-500/5 blur-2xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>
                                
                                {/* Header: Icon + Name */}
                                <div className="flex items-center space-x-2.5 sm:space-x-4 mb-2.5 sm:mb-4 relative z-10">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded bg-black/40 flex items-center justify-center font-serif text-xl sm:text-2xl font-bold border border-white/10 text-orange-200 overflow-hidden shrink-0">
                                        <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-base sm:text-lg" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm sm:text-base lg:text-lg text-slate-200 truncate">{t.name}</div>
                                        <span className={cn(
                                            "text-[9px] sm:text-[10px] px-1 border inline-block mt-0.5 sm:mt-1",
                                            t.quality === '将才' ? "bg-orange-950 text-orange-400 border-orange-500/30" :
                                            t.quality === '奇才' ? "bg-purple-950 text-purple-400 border-purple-500/30" :
                                            "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                                        )}>{t.quality}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[11px] sm:text-sm text-slate-400 italic mb-2.5 sm:mb-3 lg:mb-6 relative z-10 line-clamp-2 lg:line-clamp-none flex-shrink-0">{t.desc}</p>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 lg:mb-6 border-t border-white/5 pt-2 sm:pt-3 lg:pt-4 flex-shrink-0">
                                    <div className="flex flex-col items-center p-1 sm:p-1.5 lg:p-2 bg-white/5 rounded">
                                        <span className="text-[9px] sm:text-[10px] text-slate-500">武力</span>
                                        <span className="font-mono text-xs sm:text-sm text-orange-300">{t.attributes.force}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-1 sm:p-1.5 lg:p-2 bg-white/5 rounded">
                                        <span className="text-[9px] sm:text-[10px] text-slate-500">体魄</span>
                                        <span className="font-mono text-xs sm:text-sm text-emerald-300">{t.attributes.physique}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-1 sm:p-1.5 lg:p-2 bg-white/5 rounded">
                                        <span className="text-[9px] sm:text-[10px] text-slate-500">轻功</span>
                                        <span className="font-mono text-xs sm:text-sm text-cyan-300">{t.attributes.agility}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-1 sm:p-1.5 lg:p-2 bg-white/5 rounded">
                                        <span className="text-[9px] sm:text-[10px] text-slate-500">统帅</span>
                                        <span className="font-mono text-xs sm:text-sm text-amber-300">{t.attributes.command}</span>
                                    </div>
                                </div>

                                {/* Recruit Button */}
                                <button
                                    onClick={() => recruitHero(id, cost)}
                                    disabled={!canAfford || alreadyHired}
                                    className={cn(
                                        "w-full py-2 sm:py-2.5 lg:py-3 rounded-lg font-bold tracking-widest text-[10px] sm:text-sm transition-all relative z-10 mobile-touch-target mt-auto shrink-0",
                                        alreadyHired ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
                                        : canAfford ? "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                        : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
                                    )}
                                >
                                    {alreadyHired ? '已在帐下' : `招募 (-${cost}兵饷)`}
                                </button>
                            </div>
                        )
                    })}
                    </div>
                </div>
            )}

            {availableHeroes.length > 0 && availableHeroes.length < 3 && (
                <p className="text-center text-[10px] sm:text-xs text-slate-600 mt-2">
                    剩余未招募门客不足三位，无法继续刷新
                </p>
            )}
        </div>
    )
}
