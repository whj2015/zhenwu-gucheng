import React from 'react';
import { useGameStore } from '../store';
import { Package } from 'lucide-react';
import { cn } from '../utils';
import { getWarehouseResourceCap, getWarehouseItemSlots } from '../types';

const RESOURCE_LIST: { key: 'bingxiang' | 'iron' | 'meteorite' | 'food' | 'wood' | 'population'; label: string; icon: string; color: string }[] = [
    { key: 'bingxiang', label: '兵饷', icon: '💰', color: 'text-amber-400' },
    { key: 'iron', label: '铁锭', icon: '🔩', color: 'text-slate-300' },
    { key: 'meteorite', label: '陨铁', icon: '☄️', color: 'text-cyan-400' },
    { key: 'food', label: '粮草', icon: '🌾', color: 'text-emerald-400' },
    { key: 'wood', label: '原木', icon: '🪵', color: 'text-orange-400' },
    { key: 'population', label: '人口', icon: '👥', color: 'text-blue-400' },
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
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-xl font-serif font-bold text-slate-200">城中库房</h2>
                    <p className="text-xs text-slate-500 mt-0.5">粮草军械，尽归于此</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 pb-8">
                <div className="bg-[#121418] border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl pointer-events-none"></div>
                    <div className="relative flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-serif font-bold text-slate-200">库房等级</h3>
                            <p className="text-xs text-slate-500 mt-1">Lv.{lvl} → 资源上限 {resCap} / 道具格数 {itemSlots}</p>
                        </div>
                        <button
                            onClick={upgradeWarehouse}
                            disabled={!canUpgrade}
                            className={cn(
                                "px-5 py-2.5 rounded-lg font-bold text-sm tracking-wider transition-all",
                                canUpgrade
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                            )}
                        >
                            扩建库房
                        </button>
                    </div>
                    {!canUpgrade && (
                        <div className="flex gap-4 text-[11px] font-mono text-slate-500">
                            <span>需要: 🪵{woodCost} 🔩{ironCost} 💰{bingxiangCost}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#121418] border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            资源储备 <span className="text-slate-600 font-normal text-xs">(上限 {resCap})</span>
                        </h3>
                        <div className="space-y-3">
                            {RESOURCE_LIST.map(r => {
                                const val = resources[r.key] ?? 0;
                                const pct = Math.min(100, (val / resCap) * 100);
                                const isPop = r.key === 'population';
                                return (
                                    <div key={r.key} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                                <span>{r.icon}</span>
                                                <span>{r.label}</span>
                                            </span>
                                            <span className={cn("text-xs font-mono font-bold", pct >= 95 ? "text-red-400" : r.color)}>
                                                {isPop ? Math.floor(val) : Math.floor(val)}{!isPop && ` / ${resCap}`}
                                            </span>
                                        </div>
                                        {!isPop && (
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
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

                    <div className="bg-[#121418] border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                            军械库存 <span className="text-slate-600 font-normal text-xs">({inventory.length}/{itemSlots})</span>
                        </h3>
                        {inventory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                                <Package className="w-10 h-10 mb-2 opacity-30" />
                                <span className="text-xs">库房空空如也</span>
                                <span className="text-[10px] mt-1">前往兵甲坊打造装备</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {inventory.map(item => {
                                    const qualityColor = item.quality === 'epic' ? 'border-amber-500/40 bg-amber-500/5' :
                                        item.quality === 'fine' ? 'border-blue-400/40 bg-blue-500/5' : 'border-white/10 bg-white/[0.02]';
                                    const qualityText = item.quality === 'epic' ? 'text-amber-400' :
                                        item.quality === 'fine' ? 'text-blue-400' : 'text-slate-400';
                                    return (
                                        <div key={item.id} className={cn("rounded-lg border p-2 flex flex-col items-center gap-1 transition-all hover:scale-105", qualityColor)}>
                                            <span className="text-lg">{item.type === 'weapon' ? '⚔️' : '🛡️'}</span>
                                            <span className={cn("text-[10px] font-bold leading-tight text-center truncate w-full", qualityText)}>{item.name}</span>
                                            <span className="text-[9px] font-mono text-slate-600">
                                                {item.attack > 0 ? `攻${item.attack}` : `防${item.defense}`}
                                            </span>
                                            <div className="w-full h-0.5 bg-white/5 rounded mt-0.5 overflow-hidden">
                                                <div className="h-full bg-slate-500 rounded" style={{ width: `${(item.durability / item.maxDurability) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {Array.from({ length: Math.max(0, itemSlots - inventory.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="rounded-lg border border-dashed border-white/5 p-2 flex flex-col items-center justify-center gap-1 min-h-[72px]">
                                        <span className="text-white/5 text-lg">+</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#121418]/50 border border-white/5 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-[11px]">
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
                            <div className="font-mono font-bold text-amber-400/80">🪵{woodCost} 🔩{ironCost} 💰{bingxiangCost}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
