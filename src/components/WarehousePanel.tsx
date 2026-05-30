import React from 'react';
import { useGameStore } from '../store';
import { Package, Coins, Cylinder, Compass, Wheat, TreePine, Users } from 'lucide-react';
import { cn } from '../utils';
import { getWarehouseResourceCap, getWarehouseItemSlots } from '../types';

const RESOURCE_LIST: { key: 'bingxiang' | 'iron' | 'meteorite' | 'food' | 'wood' | 'population'; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'bingxiang', label: '兵饷', icon: <Coins className="w-3 h-3" />, color: 'text-amber-400' },
    { key: 'iron', label: '铁锭', icon: <Cylinder className="w-3 h-3" />, color: 'text-slate-300' },
    { key: 'meteorite', label: '陨铁', icon: <Compass className="w-3 h-3" />, color: 'text-cyan-400' },
    { key: 'food', label: '粮草', icon: <Wheat className="w-3 h-3" />, color: 'text-emerald-400' },
    { key: 'wood', label: '原木', icon: <TreePine className="w-3 h-3" />, color: 'text-orange-400' },
    { key: 'population', label: '人口', icon: <Users className="w-3 h-3" />, color: 'text-blue-400' },
];

export default function WarehousePanel() {
    const { resources, inventory, buildings, upgradeWarehouse } = useGameStore();
    const lvl = buildings.warehouseLevel || 1;
    const resCap = getWarehouseResourceCap(lvl);
    const itemSlots = getWarehouseItemSlots(lvl);

    const nextLvl = lvl + 1;
    const woodCost = 200 + lvl * 150;
    const ironCost = 80 + lvl * 60;
    const bingxiangCost = 100 + lvl * 80;
    const canUpgrade = resources.wood >= woodCost && resources.iron >= ironCost && resources.bingxiang >= bingxiangCost;

    return (
        <div className="max-w-5xl mx-auto pb-6 sm:pb-8">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-slate-200">城中库房</h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">粮草军械，尽归于此</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="bg-[#121418] border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/5 blur-2xl pointer-events-none"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                        <div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-200">库房等级</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Lv.{lvl} → 资源上限 {resCap} / 道具格数 {itemSlots}</p>
                        </div>
                        <button
                            onClick={upgradeWarehouse}
                            disabled={!canUpgrade}
                            className={cn(
                                "w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider transition-all mobile-touch-target",
                                canUpgrade
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                            )}
                        >
                            扩建库房
                        </button>
                    </div>
                    {!canUpgrade && (
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-mono text-slate-500 items-center">
                            <span>需要: </span>
                            <span className="inline-flex items-center gap-1"><TreePine className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400/60" />{woodCost}</span>
                            <span className="inline-flex items-center gap-1"><Cylinder className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400/60" />{ironCost}</span>
                            <span className="inline-flex items-center gap-1"><Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400/60" />{bingxiangCost}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-[#121418] border border-white/10 rounded-xl p-4 sm:p-6">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            资源储备 <span className="text-slate-600 font-normal text-[10px] sm:text-xs">(上限 {resCap})</span>
                        </h3>
                        <div className="space-y-2.5 sm:space-y-3">
                            {RESOURCE_LIST.map(r => {
                                const val = resources[r.key] ?? 0;
                                const pct = Math.min(100, (val / resCap) * 100);
                                const isPop = r.key === 'population';
                                return (
                                    <div key={r.key} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5">
                                                <span className="text-slate-500">{r.icon}</span>
                                                <span>{r.label}</span>
                                            </span>
                                            <span className={cn("text-[10px] sm:text-[11px] font-mono font-bold", pct >= 95 ? "text-red-400" : r.color)}>
                                                {isPop ? Math.floor(val) : Math.floor(val)}{!isPop && ` / ${resCap}`}
                                            </span>
                                        </div>
                                        {!isPop && (
                                            <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500", pct >= 95 ? "bg-red-500" : "bg-emerald-500/60")}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#121418] border border-white/10 rounded-xl p-4 sm:p-6">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                            军械库存 <span className="text-slate-600 font-normal text-[10px] sm:text-xs">({inventory.length}/{itemSlots})</span>
                        </h3>
                        {inventory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-slate-600">
                                <Package className="w-8 h-10 sm:w-10 sm:h-10 mb-2 opacity-30" />
                                <span className="text-[10px] sm:text-xs">库房空空如也</span>
                                <span className="text-[9px] sm:text-[10px] mt-1">前往兵甲坊打造装备</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                {inventory.map(item => {
                                    const qualityColor = item.quality === 'epic' ? 'border-amber-500/40 bg-amber-500/5' :
                                        item.quality === 'fine' ? 'border-blue-400/40 bg-blue-500/5' : 'border-white/10 bg-white/[0.02]';
                                    const qualityText = item.quality === 'epic' ? 'text-amber-400' :
                                        item.quality === 'fine' ? 'text-blue-400' : 'text-slate-400';
                                    return (
                                        <div key={item.id} className={cn("rounded-lg border p-1 sm:p-1.5 lg:p-2 flex flex-col items-center gap-1 transition-all hover:scale-105", qualityColor)}>
                                            <span className="text-sm sm:text-base text-slate-300">{item.type === 'weapon' ? '⚔' : '⛊'}</span>
                                            <span className={cn("text-[9px] sm:text-[10px] font-bold leading-tight text-center truncate w-full", qualityText)}>{item.name}</span>
                                            <span className="text-[8px] sm:text-[9px] font-mono text-slate-600">
                                                {item.attack > 0 ? `攻${item.attack}` : `防${item.defense}`}
                                            </span>
                                            <div className="w-full h-0.5 bg-white/5 rounded mt-0.5 overflow-hidden">
                                                <div className="h-full bg-slate-500 rounded" style={{ width: `${(item.durability / item.maxDurability) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {Array.from({ length: Math.max(0, itemSlots - inventory.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="rounded-lg border border-dashed border-white/5 p-1 sm:p-1.5 lg:p-2 flex flex-col items-center justify-center gap-1 min-h-[60px] sm:min-h-[72px]">
                                        <span className="text-white/5 text-base sm:text-lg">+</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#121418]/50 border border-white/5 rounded-xl p-3 sm:p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-center text-[10px] sm:text-[11px]">
                        <div>
                            <div className="text-slate-600 mb-1">下一级资源上限</div>
                            <div className="font-mono font-bold text-emerald-400">{getWarehouseResourceCap(nextLvl)}</div>
                        </div>
                        <div>
                            <div className="text-slate-600 mb-1">下一级道具格数</div>
                            <div className="font-mono font-bold text-violet-400">{getWarehouseItemSlots(nextLvl)}</div>
                        </div>
                        <div>
                            <div className="text-slate-600 mb-1">扩建所需</div>
                            <div className="font-mono font-bold text-amber-400/80 inline-flex items-center gap-1">
                                <TreePine className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{woodCost} <Cylinder className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />{ironCost} <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />{bingxiangCost}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
