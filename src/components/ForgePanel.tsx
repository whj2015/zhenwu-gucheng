import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { CRAFTING_TEMPLATES, FORGE_UPGRADE_COSTS } from '../data';
import { Hammer, ArrowUpCircle, Clock, Sparkles, Shield, Sword, Crosshair, Star } from 'lucide-react';
import { formatTime } from '../utils';
import { cn } from '../utils';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    weapon: <Sword className="w-6 h-6 text-orange-400" />,
    armor: <Shield className="w-6 h-6 text-blue-400" />
};

const QUALITY_COLORS: Record<string, string> = {
    normal: 'text-slate-400 border-slate-500/20',
    fine: 'text-cyan-400 border-cyan-500/20',
    epic: 'text-purple-400 border-purple-500/20'
};

export default function ForgePanel() {
    const { buildings, resources, startCrafting, claimCrafting, crafting, upgradeForge } = useGameStore();
    const lvl = buildings.forgeLevel;
    const upgradeCost = FORGE_UPGRADE_COSTS[(lvl + 1) as unknown as keyof typeof FORGE_UPGRADE_COSTS];
    const canUpgrade = upgradeCost && resources.bingxiang >= upgradeCost.bingxiang && resources.meteorite >= upgradeCost.meteorite;
    const pityNormal = crafting.consecutiveNormal || 0;
    const pityFine = crafting.consecutiveFine || 0;
    const nextPityNormal = 5 - pityNormal;
    const nextPityFine = 10 - pityFine;

    return (
        <div className="max-w-4xl w-full mx-auto space-y-5 animate-in fade-in duration-500">
             <div className="flex justify-between items-end border-b border-white/10 pb-4">
                 <div>
                    <h2 className="text-xl lg:text-2xl font-serif tracking-wide text-orange-100">兵甲坊 <span className="text-orange-500/80 text-sm font-sans ml-2">LV.{lvl}</span></h2>
                    <p className="text-xs text-slate-500 mt-1">锻造绝世神兵，武装你的豪杰以踏破遗迹。</p>
                 </div>
                 {upgradeCost && (
                     <button
                        onClick={upgradeForge}
                        disabled={!canUpgrade || !!crafting.task}
                        className="px-4 py-1.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                     >
                         <ArrowUpCircle className="w-3.5 h-3.5" />
                         <span>升阶 (需 {upgradeCost.bingxiang} 饷 / {upgradeCost.meteorite} 陨)</span>
                     </button>
                 )}
             </div>

             {/* Pity System Display */}
             <div className="grid grid-cols-2 gap-3">
                 <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                     <div className="flex justify-between items-center mb-1.5">
                         <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">良品保底</span>
                         <span className="text-[10px] font-mono text-cyan-300">{pityNormal}/5</span>
                     </div>
                     <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
                         <div
                             className={cn("h-full rounded-full transition-all", nextPityNormal <= 1 ? "bg-cyan-500 w-full animate-pulse" : "bg-slate-600")}
                             style={{ width: `${(pityNormal / 5) * 100}%` }}
                         ></div>
                     </div>
                     <span className="text-[9px] text-slate-600 mt-1 block">{nextPityNormal > 0 ? `再${nextPityNormal}次普通品后必出良品` : '下次必出良品！'}</span>
                 </div>
                 <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                     <div className="flex justify-between items-center mb-1.5">
                         <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">史诗保底</span>
                         <span className="text-[10px] font-mono text-purple-300">{pityFine}/10</span>
                     </div>
                     <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden">
                         <div
                             className={cn("h-full rounded-full transition-all", nextPityFine <= 1 ? "bg-purple-500 w-full animate-pulse" : "bg-slate-600")}
                             style={{ width: `${(pityFine / 10) * 100}%` }}
                         ></div>
                     </div>
                     <span className="text-[9px] text-slate-600 mt-1 block">{nextPityFine > 0 ? `再${nextPityFine}次良品后必出史诗` : '下次必出史诗！'}</span>
                 </div>
             </div>

             {/* Crafting Queue Area */}
             <div className="h-20 lg:h-24 bg-black/40 border border-white/5 rounded-xl px-6 flex items-center justify-center gap-6 shadow-xl relative overflow-hidden">
                  {crafting.task ? <ActiveTask /> : <p className="text-slate-500 font-serif text-sm tracking-widest relative z-10">炉火休寂，暂无打造队列</p>}
             </div>

             {/* Available Blueprints */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                 {Object.entries(CRAFTING_TEMPLATES).map(([id, t]) => {
                     const maxStats = t.baseStats[lvl];
                     if (!maxStats) return null;
                     const canAfford = resources.bingxiang >= t.costBingxiang && resources.iron >= t.costIron;
                     const isBusy = !!crafting.task;

                     return (
                         <div key={id} className="bg-white/5 border border-white/10 rounded-xl p-4 lg:p-5 flex flex-col relative overflow-hidden group">
                              <div className={cn(
                                  "absolute -top-4 -right-4 w-24 h-24 blur-2xl group-hover:bg-orange-500/20 transition-all pointer-events-none",
                                  t.type === 'weapon' ? "bg-orange-500/5" : "bg-blue-500/5"
                              )}></div>
                              <div className="flex justify-between items-start relative z-10">
                                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center mb-3">
                                      {TYPE_ICONS[t.type]}
                                  </div>
                                  <div className="text-right">
                                      <span className="text-[10px] text-slate-500 block uppercase tracking-wide">时长</span>
                                      <span className="text-xs font-mono text-slate-300">{formatTime(t.durationMs)}</span>
                                  </div>
                              </div>
                              <h3 className="text-base font-bold text-slate-200 relative z-10">{t.name}</h3>
                              <span className="text-[10px] text-slate-500 mb-2 relative z-10 inline-block px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                  {t.type === 'weapon' ? '兵器' : '铠甲'}
                              </span>
                              <p className="text-xs text-emerald-300/80 relative z-10 font-mono">
                                  {maxStats.attack > 0 ? `攻 +${maxStats.attack}` : ''}{maxStats.defense > 0 ? `防 +${maxStats.defense}` : ''}
                              </p>
                              {(t as any).desc && (
                                  <p className="text-[11px] text-slate-500 mt-1 relative z-10 leading-relaxed">{(t as any).desc}</p>
                              )}

                              <div className="mt-auto pt-3 border-t border-white/5 relative z-10">
                                  <div className="flex gap-3 mb-3 text-xs font-mono">
                                      <span className={cn(resources.bingxiang < t.costBingxiang ? 'text-red-400' : 'text-amber-200')}>饷 {t.costBingxiang}</span>
                                      <span className={cn(resources.iron < t.costIron ? 'text-red-400' : 'text-slate-300')}>铁 {t.costIron}</span>
                                  </div>
                                  <button
                                     onClick={() => startCrafting(id)}
                                     disabled={!canAfford || isBusy}
                                     className="w-full py-2.5 bg-white/5 border border-white/20 hover:bg-white/10 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                  >
                                      锻造
                                  </button>
                              </div>
                         </div>
                     );
                 })}
             </div>
        </div>
    );
}

function ActiveTask() {
    const { crafting, claimCrafting } = useGameStore();
    const task = crafting.task;
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!task?.endTime) return;
        const calc = () => {
            const rem = task.endTime - Date.now();
            setTimeLeft(Math.max(0, rem));
        };
        calc();
        const int = setInterval(calc, 200);
        return () => clearInterval(int);
    }, [task?.endTime]);

    if (!task) return null;
    const template = CRAFTING_TEMPLATES[task.templateId];
    const done = timeLeft <= 0;
    const progress = Math.min(100, Math.max(0, 100 - (timeLeft / template.durationMs) * 100));

    return (
        <div className="w-full flex items-center gap-6 relative z-10">
            {done ? (
                 <button onClick={claimCrafting} className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] animate-pulse flex items-center justify-center gap-2">
                     <Sparkles className="w-4 h-4" /> 取出 {template.name}
                 </button>
            ) : (
                <>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-mono">
                            <span>锻造中: {template.name}</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-600 to-yellow-500 shadow-[0_0_8px_#f97316] transition-all duration-200 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="w-px h-12 bg-white/10"></div>
                    <div className="text-right w-24">
                        <span className="text-[10px] text-slate-500 block uppercase tracking-widest">剩余</span>
                        <span className="text-lg font-mono text-orange-400">{formatTime(timeLeft)}</span>
                    </div>
                </>
            )}
        </div>
    );
}
