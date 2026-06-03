import { useGameStore } from '../store';
import { cn } from '../utils';
import { Store, ArrowUpCircle } from 'lucide-react';
import { GameState } from '../types';
import { TradeCard } from './TradeCard';

export interface TradeOption {
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
    const resources = useGameStore((state) => state.resources);
    const tradeResource = useGameStore((state) => state.tradeResource);
    const buildings = useGameStore((state) => state.buildings);
    const upgradeBuilding = useGameStore((state) => state.upgradeBuilding);

    const mktLvl = buildings.marketLevel || 1;
    const bonusRate = (mktLvl - 1) * 8;
    const currentBenefit = MARKET_BENEFITS[Math.min(mktLvl, MARKET_BENEFITS.length) - 1];
    const nextBenefit = mktLvl < MARKET_BENEFITS.length ? MARKET_BENEFITS[mktLvl] : null;
    const upgradeCost = { wood: 60 * mktLvl, bingxiang: 40 * mktLvl };
    const canUpgrade = resources.wood >= upgradeCost.wood && resources.bingxiang >= upgradeCost.bingxiang;

    const allTrades = [...BASE_TRADE_OPTIONS, ...UNLOCKED_TRADES.filter(t => !t.requireLevel || t.requireLevel <= mktLvl)];

    return (
        <div className="max-w-4xl mx-auto flex flex-col pt-2 sm:pt-3 lg:pt-4 animate-in fade-in duration-500">
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
                {allTrades.map(opt => (
                    <TradeCard
                        key={opt.id}
                        opt={opt}
                        resources={resources}
                        mktLvl={mktLvl}
                        bonusRate={bonusRate}
                        tradeResource={tradeResource}
                    />
                ))}
            </div>
        </div>
    );
}

