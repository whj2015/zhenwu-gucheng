import { memo } from 'react';
import { cn } from '../utils';
import { TYPE_ICONS } from './ForgePanel';
import { formatTime } from '../utils';

interface CraftingCardProps {
    id: string;
    t: import('../data').CraftingDef;
    lvl: number;
    resources: {
        bingxiang: number;
        iron: number;
    };
    canAfford: boolean;
    isBusy: boolean;
    startCrafting: (templateId: string) => void;
}

export const CraftingCard = memo(function CraftingCard({
    id,
    t,
    lvl,
    resources,
    canAfford,
    isBusy,
    startCrafting
}: CraftingCardProps) {
    const maxStats = t.baseStats[lvl];
    if (!maxStats) return null;

    const IconComponent = TYPE_ICONS[t.type];

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col relative overflow-hidden group">
            <div className={cn(
                "absolute -top-4 -right-4 w-20 w-24 sm:w-24 blur-2xl group-hover:bg-orange-500/20 transition-all pointer-events-none",
                t.type === 'weapon' ? "bg-orange-500/5" : "bg-blue-500/5"
            )}></div>
            <div className="flex justify-between items-start relative z-10">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                    <IconComponent />
                </div>
                <div className="text-right">
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase tracking-wide">时长</span>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-300">{formatTime(t.durationMs)}</span>
                </div>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-200 relative z-10">{t.name}</h3>
            <span className="text-[9px] sm:text-[10px] text-slate-500 mb-1.5 sm:mb-2 relative z-10 inline-block px-1 sm:px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                {t.type === 'weapon' ? '兵器' : '铠甲'}
            </span>
            <p className="text-[10px] sm:text-xs text-emerald-300/80 relative z-10 font-mono">
                {maxStats.attack > 0 ? `攻 +${maxStats.attack}` : ''}{maxStats.defense > 0 ? `防 +${maxStats.defense}` : ''}
            </p>
            {(t as any).desc && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 relative z-10 leading-relaxed">{(t as any).desc}</p>
            )}

            <div className="mt-auto pt-2.5 sm:pt-3 border-t border-white/5 relative z-10">
                <div className="flex gap-2 sm:gap-3 mb-2.5 sm:mb-3 text-[10px] sm:text-xs font-mono">
                    <span className={cn(resources.bingxiang < t.costBingxiang ? 'text-red-400' : 'text-amber-200')}>饷 {t.costBingxiang}</span>
                    <span className={cn(resources.iron < t.costIron ? 'text-red-400' : 'text-slate-300')}>铁 {t.costIron}</span>
                </div>
                <button
                    onClick={() => startCrafting(id)}
                    disabled={!canAfford || isBusy}
                    className="w-full py-2 sm:py-2.5 bg-white/5 border border-white/20 hover:bg-white/10 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px] sm:text-xs mobile-touch-target"
                >
                    锻造
                </button>
            </div>
        </div>
    );
});
