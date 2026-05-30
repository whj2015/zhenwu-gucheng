import React from 'react';
import { useGameStore } from '../store';
import { ScrollText, Coins, Users, Home, Wheat, Axe, ArrowUpCircle } from 'lucide-react';
import { cn } from '../utils';

export default function CityPanel() {
    const { resources, buildings, upgradeBuilding } = useGameStore();

    const houseLvl = buildings.houseLevel;
    const farmLvl = buildings.farmLevel;
    const woodLvl = buildings.lumberCampLevel;

    const maxPop = houseLvl * 100;
    const pop = Math.floor(resources.population);

    const houseCost = { wood: 100 * houseLvl, food: 100 * houseLvl };
    const farmCost = { wood: 50 * farmLvl, iron: 10 * farmLvl };
    const woodCost = { food: 50 * woodLvl, iron: 10 * woodLvl };

    const popGrowth = pop < maxPop ? 0.5 : 0;
    const bingxiangRate = pop * 0.01;
    const foodRate = farmLvl * 2;
    const woodRate = woodLvl * 1.5;

    const canAfford = (cost: { wood?: number, food?: number, iron?: number, bingxiang?: number }) => {
        return (
            resources.wood >= (cost.wood || 0) &&
            resources.food >= (cost.food || 0) &&
            resources.iron >= (cost.iron || 0) &&
            resources.bingxiang >= (cost.bingxiang || 0)
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
             <div className="text-center space-y-4 py-8 border-b border-white/10">
                  <h2 className="text-3xl font-serif text-slate-200 tracking-wide">主城署</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                      军镇中枢，百废待兴。建设农田与伐木场充实仓充，修缮民居招徕流民，以人口纳捐获取兵饷。
                  </p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                      <Users className="w-6 h-6 text-indigo-400 mb-2" />
                      <span className="text-slate-500 text-[10px] mb-1 uppercase tracking-widest font-bold">城中丁口 / 容纳上限</span>
                      <span className="text-xl font-bold font-mono text-indigo-200">
                          {pop} <span className="text-xs text-indigo-500/70">/ {maxPop}</span>
                      </span>
                 </div>
                 <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                      <Coins className="w-6 h-6 text-amber-500 mb-2" />
                      <span className="text-slate-500 text-[10px] mb-1 uppercase tracking-widest font-bold">赋税 (兵饷)</span>
                      <span className="text-xl font-bold font-mono text-amber-200">
                          +{Math.floor(bingxiangRate * 60)} <span className="text-[10px] text-amber-500/70">/ min</span>
                      </span>
                 </div>
                 <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                      <Wheat className="w-6 h-6 text-emerald-500 mb-2" />
                      <span className="text-slate-500 text-[10px] mb-1 uppercase tracking-widest font-bold">粮草产出</span>
                      <span className="text-xl font-bold font-mono text-emerald-200">
                          +{Math.floor(foodRate * 60)} <span className="text-[10px] text-emerald-500/70">/ min</span>
                      </span>
                 </div>
                 <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center">
                      <Axe className="w-6 h-6 text-orange-700 mb-2" />
                      <span className="text-slate-500 text-[10px] mb-1 uppercase tracking-widest font-bold">木材产出</span>
                      <span className="text-xl font-bold font-mono text-orange-200">
                          +{Math.floor(woodRate * 60)} <span className="text-[10px] text-orange-500/70">/ min</span>
                      </span>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                 {/* House */}
                 <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative group flex flex-col">
                     <div className="flex items-center space-x-3 mb-4">
                         <div className="w-10 h-10 bg-indigo-500/10 rounded flex items-center justify-center border border-indigo-500/30">
                             <Home className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div>
                             <h3 className="text-slate-200 font-serif font-bold text-lg">民房 <span className="text-xs text-indigo-400 font-mono ml-2">Lv.{houseLvl}</span></h3>
                             <p className="text-xs text-slate-400">吸引流民，增加人口上限</p>
                         </div>
                     </div>
                     <div className="text-sm font-mono text-slate-300 mb-4 bg-black/40 p-3 rounded border border-white/5">
                         人口上限: {maxPop} <ArrowUpCircle className="inline w-3 h-3 text-slate-500 mx-1" /> {maxPop + 100}
                     </div>
                     <div className="mt-auto space-y-4">
                         <div className="flex space-x-4 text-xs font-mono">
                             <div className={cn("flex flex-col", resources.wood < houseCost.wood ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">木材</span>
                                 {houseCost.wood}
                             </div>
                             <div className={cn("flex flex-col", resources.food < houseCost.food ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">粮草</span>
                                 {houseCost.food}
                             </div>
                         </div>
                         <button 
                             onClick={() => upgradeBuilding('houseLevel', houseCost)}
                             disabled={!canAfford(houseCost)}
                             className={cn("w-full py-2 rounded font-bold tracking-widest text-sm transition-all", canAfford(houseCost) ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]" : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10")}
                         >
                             扩建民居
                         </button>
                     </div>
                 </div>

                 {/* Farm */}
                 <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative group flex flex-col">
                     <div className="flex items-center space-x-3 mb-4">
                         <div className="w-10 h-10 bg-emerald-500/10 rounded flex items-center justify-center border border-emerald-500/30">
                             <Wheat className="w-5 h-5 text-emerald-500" />
                         </div>
                         <div>
                             <h3 className="text-slate-200 font-serif font-bold text-lg">农田 <span className="text-xs text-emerald-400 font-mono ml-2">Lv.{farmLvl}</span></h3>
                             <p className="text-xs text-slate-400">稳定产出维生粮草</p>
                         </div>
                     </div>
                     <div className="text-sm font-mono text-slate-300 mb-4 bg-black/40 p-3 rounded border border-white/5">
                         产粮: {foodRate*60}/m <ArrowUpCircle className="inline w-3 h-3 text-slate-500 mx-1" /> {(foodRate+2)*60}/m
                     </div>
                     <div className="mt-auto space-y-4">
                         <div className="flex space-x-4 text-xs font-mono">
                             <div className={cn("flex flex-col", resources.wood < farmCost.wood ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">木材</span>
                                 {farmCost.wood}
                             </div>
                             <div className={cn("flex flex-col", resources.iron < farmCost.iron ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">铁锭</span>
                                 {farmCost.iron}
                             </div>
                         </div>
                         <button 
                             onClick={() => upgradeBuilding('farmLevel', farmCost)}
                             disabled={!canAfford(farmCost)}
                             className={cn("w-full py-2 rounded font-bold tracking-widest text-sm transition-all", canAfford(farmCost) ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10")}
                         >
                             开垦农田
                         </button>
                     </div>
                 </div>

                 {/* Lumber Camp */}
                 <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative group flex flex-col">
                     <div className="flex items-center space-x-3 mb-4">
                         <div className="w-10 h-10 bg-orange-500/10 rounded flex items-center justify-center border border-orange-500/30">
                             <Axe className="w-5 h-5 text-orange-600" />
                         </div>
                         <div>
                             <h3 className="text-slate-200 font-serif font-bold text-lg">伐木场 <span className="text-xs text-orange-400 font-mono ml-2">Lv.{woodLvl}</span></h3>
                             <p className="text-xs text-slate-400">砍伐原木提供城建基础</p>
                         </div>
                     </div>
                     <div className="text-sm font-mono text-slate-300 mb-4 bg-black/40 p-3 rounded border border-white/5">
                         产木: {woodRate*60}/m <ArrowUpCircle className="inline w-3 h-3 text-slate-500 mx-1" /> {(woodRate+1.5)*60}/m
                     </div>
                     <div className="mt-auto space-y-4">
                         <div className="flex space-x-4 text-xs font-mono">
                             <div className={cn("flex flex-col", resources.food < woodCost.food ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">粮草</span>
                                 {woodCost.food}
                             </div>
                             <div className={cn("flex flex-col", resources.iron < woodCost.iron ? "text-red-400" : "text-emerald-400")}>
                                 <span className="text-slate-500 mb-1">铁锭</span>
                                 {woodCost.iron}
                             </div>
                         </div>
                         <button 
                             onClick={() => upgradeBuilding('lumberCampLevel', woodCost)}
                             disabled={!canAfford(woodCost)}
                             className={cn("w-full py-2 rounded font-bold tracking-widest text-sm transition-all", canAfford(woodCost) ? "bg-orange-700 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(194,65,12,0.3)]" : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10")}
                         >
                             扩建伐场
                         </button>
                     </div>
                 </div>
             </div>
        </div>
    );
}
