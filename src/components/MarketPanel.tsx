import React from 'react';
import { useGameStore } from '../store';
import { cn } from '../utils';
import { Store, ArrowRightLeft, ArrowUpCircle, Gift } from 'lucide-react';
import { GameState } from '../types';

interface TradeOption {
    id: string;
    label: string;
    fromType: keyof GameState['resources'];
    toType: keyof GameState['resources'];
    fromAmount: number;
    toAmount: number;
    iconColor: string;
    requireLevel?: number;
}

const BASE_TRADE_OPTIONS: TradeOption[] = [
    { id: 'buy_iron', label: '购置铁锭', fromType: 'bingxiang', toType: 'iron', fromAmount: 200, toAmount: 20, iconColor: 'text-slate-300' },
    { id: 'buy_met', label: '购置陨铁', fromType: 'bingxiang', toType: 'meteorite', fromAmount: 1000, toAmount: 5, iconColor: 'text-cyan-400' },
    { id: 'sell_wood', label: '售卖木材', fromType: 'wood', toType: 'bingxiang', fromAmount: 500, toAmount: 100, iconColor: 'text-orange-600' },
    { id: 'sell_food', label: '售卖粮草', fromType: 'food', toType: 'bingxiang', fromAmount: 1000, toAmount: 150, iconColor: 'text-emerald-500' },
];

const UNLOCKED_TRADES: TradeOption[] = [
    { id: 'wood_to_iron', label: '木材换铁锭', fromType: 'wood', toType: 'iron', fromAmount: 300, toAmount: 15, iconColor: 'text-slate-400', requireLevel: 2 },
    { id: 'food_to_pop', label: '粮草换人口', fromType: 'food', toType: 'population', fromAmount: 800, toAmount: 20, iconColor: 'text-pink-300', requireLevel: 2 },
    { id: 'pop_to_bingxiang', label: '人口换兵饷', fromType: 'population', toType: 'bingxiang', fromAmount: 30, toAmount: 150, iconColor: 'text-yellow-300', requireLevel: 3 },
];

const MARKET_BENEFITS = [
    { level: 1, bonus: 0, label: "基础集市" },
    { level: 2, bonus: 8, label: "交易收益+8%，解锁新路线" },
    { level: 3, bonus: 16, label: "交易收益+16%，解锁人口兑换" },
    { level: 4, bonus: 24, label: "交易收益+24%" },
];

export default function MarketPanel() {
    const { resources, tradeResource, buildings, upgradeBuilding } = useGameStore();

    const mktLvl = buildings.marketLevel || 1;
    const bonusRate = (mktLvl - 1) * 8;
    const currentBenefit = MARKET_BENEFITS[Math.min(mktLvl, MARKET_BENEFITS.length) - 1];
    const nextBenefit = mktLvl < MARKET_BENEFITS.length ? MARKET_BENEFITS[mktLvl] : null;
    const upgradeCost = { wood: 60 * mktLvl, bingxiang: 40 * mktLvl };
    const canUpgrade = resources.wood >= upgradeCost.wood && resources.bingxiang >= upgradeCost.bingxiang;

    const allTrades = [...BASE_TRADE_OPTIONS, ...UNLOCKED_TRADES.filter(t => !t.requireLevel || t.requireLevel <= mktLvl)];

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col pt-2 sm:pt-3 lg:pt-4 animate-in fade-in duration-500">
            <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-slate-200 tracking-widest mb-1.5 sm:mb-2 flex items-center justify-center">
                    <Store className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 text-amber-500" /> 城中集市
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed px-2">
                    南来北往的商客汇聚于此，你可以在此将多余的产出兑换为急需的物资。
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-5 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 sm:px-3 lg:px-4 py-1.5 lg:py-2 gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                    <span className="text-[10px] sm:text-xs font-mono text-slate-500">Lv.{mktLvl}</span>
                    <span className="text-[10px] sm:text-[11px] text-amber-300/80 hidden sm:inline">{currentBenefit.label}</span>
                    {bonusRate > 0 && (
                        <span className="text-[9px] sm:text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-mono">+{bonusRate}%收益</span>
                    )}
                </div>
                {nextBenefit && (
                    <button
                        onClick={() => upgradeBuilding('marketLevel', upgradeCost)}
                        disabled={!canUpgrade}
                        className={cn(
                            "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded text-[10px] sm:text-[11px] font-mono transition-all mobile-touch-target",
                            canUpgrade ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25" : "text-slate-600 cursor-not-allowed"
                        )}
                    >
                        <ArrowUpCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        升级 → {nextBenefit.label.split('，')[0]}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-2">
                {allTrades.map(opt => {
                    const canAfford = resources[opt.fromType] >= opt.fromAmount;
                    const fromLabel = getResourceLabel(opt.fromType);
                    const toLabel = getResourceLabel(opt.toType);
                    const isUnlocked = !opt.requireLevel || opt.requireLevel <= mktLvl;
                    const bonusTo = mktLvl >= 2 && opt.toType !== 'bingxiang' ? Math.floor(opt.toAmount * bonusRate / 100) : 0;

                    return (
                        <div key={opt.id} className={cn(
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
                                        +{opt.toAmount}{bonusTo > 0 && <span className="text-emerald-400 ml-0.5">(+{bonusTo})</span>}
                                        <span className="text-[10px] sm:text-xs text-slate-400">{toLabel}</span>
                                    </div>
                                    {bonusTo > 0 && (
                                        <div className="text-[8px] sm:text-[9px] text-emerald-400/70 mt-0.5">含集市加成 +{bonusRate}%</div>
                                    )}
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
                })}
            </div>
        </div>
    );
}

function getResourceLabel(key: keyof GameState['resources']) {
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
