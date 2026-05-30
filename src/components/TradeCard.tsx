import { memo } from 'react';
import { ArrowRightLeft, Gift } from 'lucide-react';
import { cn } from '../utils';
import type { TradeOption } from './MarketPanel';
import type { GameState } from '../types';

interface TradeCardProps {
    opt: TradeOption;
    resources: GameState['resources'];
    mktLvl: number;
    bonusRate: number;
    tradeResource: (
        fromType: keyof GameState['resources'],
        toType: keyof GameState['resources'],
        fromAmount: number,
        toAmount: number
    ) => void;
}

function getResourceLabel(key: keyof GameState['resources']): string {
    const map: Record<keyof GameState['resources'], string> = {
        bingxiang: '兵饷',
        iron: '铁锭',
        meteorite: '陨铁',
        food: '粮草',
        wood: '木材',
        population: '人口'
    };
    return map[key] || key;
}

export const TradeCard = memo(function TradeCard({
    opt,
    resources,
    mktLvl,
    bonusRate,
    tradeResource
}: TradeCardProps) {
    const canAfford = resources[opt.fromType] >= opt.fromAmount;
    const fromLabel = getResourceLabel(opt.fromType);
    const toLabel = getResourceLabel(opt.toType);
    const isUnlocked = !opt.requireLevel || opt.requireLevel <= mktLvl;
    const bonusTo = mktLvl >= 2 && opt.toType !== 'bingxiang' ? Math.floor(opt.toAmount * bonusRate / 100) : 0;

    return (
        <div className={cn(
            "bg-black/40 border rounded-xl p-3 sm:p-4 lg:p-5 relative overflow-hidden group",
            isUnlocked ? "border-white/10" : "border-white/5 opacity-50"
        )}>
           <div className="absolute -top-10 -right-10 w-28 h-28 sm:w-32 sm:h-32 bg-white/5 blur-3xl pointer-events-none rounded-full group-hover:bg-amber-500/10 transition-colors"></div>

           <div className="flex items-center justify-between mb-2 sm:mb-3">
               <h3 className="text-xs sm:text-sm lg:text-base font-serif text-slate-200">{opt.label}</h3>
               {!isUnlocked && (
                   <span className="text-[9px] sm:text-[10px] bg-slate-800/80 text-slate-400 px-1.5 sm:px-2 py-0.5 rounded font-mono">
                       需集市 Lv.{opt.requireLevel}
                   </span>
               )}
           </div>

           <div className="flex items-center justify-between bg-black/60 p-2 sm:p-2.5 lg:p-3 rounded-lg border border-white/5 mb-3 sm:mb-4">
               <div className="text-center flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest mb-1">消耗</div>
                    <div className="font-mono text-sm sm:text-base lg:text-lg text-red-300 truncate">-{opt.fromAmount} <span className="text-[10px] sm:text-xs text-slate-400">{fromLabel}</span></div>
                </div>
                <div className="px-1.5 sm:px-2 lg:px-3 text-slate-600 shrink-0">
                    <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <div className="text-center flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest mb-1">获得</div>
                    <div className={cn("font-mono text-sm sm:text-base lg:text-lg", opt.iconColor)}>
                        +{opt.toAmount}{bonusTo > 0 ? <span className="text-emerald-400 ml-0.5">(+{bonusTo})</span> : null}
                        <span className="text-[10px] sm:text-xs text-slate-400">{toLabel}</span>
                    </div>
                    {bonusTo > 0 ? (
                        <div className="text-[8px] sm:text-[9px] text-emerald-400/70 mt-0.5">含集市加成 +{bonusRate}%</div>
                    ) : null}
                </div>
           </div>

           <button
                onClick={() => tradeResource(opt.fromType, opt.toType, opt.fromAmount, opt.toAmount)}
                disabled={!canAfford || !isUnlocked}
                className={cn(
                    "w-full py-2 sm:py-2.5 rounded-lg font-bold tracking-widest text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-1.5 mobile-touch-target",
                    isUnlocked && canAfford
                        ? "bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                        : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                )}
           >
               {!isUnlocked ? <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : null}
               确认交易
           </button>
        </div>
    );
});
