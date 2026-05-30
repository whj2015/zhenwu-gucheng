import React, { useState } from 'react';
import { useGameStore } from '../store';
import { HERO_TEMPLATES } from '../data';
import { cn } from '../utils';
import { Shield, Tent, Users } from 'lucide-react';
import HeroIcon from './HeroIcon';

export default function BarracksPanel() {
    const { heroes, recruitTroops, resources } = useGameStore();
    const [selectedHero, setSelectedHero] = useState<string | null>(null);
    const [recruitAmount, setRecruitAmount] = useState<number>(0);

    const activeHero = heroes.find(h => h.id === selectedHero);
    const activeTemplate = activeHero ? HERO_TEMPLATES[activeHero.templateId] : null;

    const maxTroops = activeHero ? activeHero.level * 100 : 0;
    const currentTroops = activeHero?.troops || 0;
    const availableCapacity = maxTroops - currentTroops;

    const baseFoodCost = 10;
    const baseBingxiangCost = 2;

    const costFood = recruitAmount * baseFoodCost;
    const costBingxiang = recruitAmount * baseBingxiangCost;

    const canAfford = resources.food >= costFood && resources.bingxiang >= costBingxiang;

    const handleRecruit = () => {
        if (!activeHero || recruitAmount <= 0 || !canAfford) return;
        recruitTroops(activeHero.id, recruitAmount, costFood, costBingxiang);
        setRecruitAmount(0);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-3 sm:gap-4 lg:gap-8 animate-in fade-in duration-500">
             {/* Left List - optimized for mobile */}
             <div className="w-full lg:w-1/3 shrink-0 lg:shrink-0 max-h-[30vh] sm:max-h-[40vh] lg:max-h-none bg-black/40 border border-white/5 rounded-xl flex flex-col p-3 sm:p-4 shadow-xl">
                  <div className="border-b border-white/5 pb-3 mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-300">
                          <Tent className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          <h2 className="font-serif text-base sm:text-lg tracking-widest uppercase">将领点兵</h2>
                      </div>
                      <span className="text-[10px] sm:text-xs font-mono text-slate-500">{heroes.length} 英雄</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 custom-scrollbar pr-1 sm:pr-2">
                       {heroes.map(hero => {
                           const t = HERO_TEMPLATES[hero.templateId];
                           const isSelected = selectedHero === hero.id;
                           return (
                               <button
                                   key={hero.id}
                                   onClick={() => {
                                       setSelectedHero(hero.id);
                                       setRecruitAmount(0);
                                   }}
                                   className={cn(
                                       "w-full text-left p-2 sm:p-3 rounded-lg border transition-all flex items-center justify-between group mobile-touch-target",
                                       isSelected ? "bg-emerald-500/10 border-emerald-500/50" : "bg-black/40 border-white/5 hover:border-emerald-500/30 hover:bg-white/5"
                                   )}
                               >
                                   <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                       <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded bg-white/5 flex items-center justify-center font-serif text-sm sm:text-lg font-bold border overflow-hidden shrink-0", isSelected ? "border-emerald-500 text-emerald-400" : "border-white/10 text-slate-300 group-hover:text-emerald-300")}>
                                           <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center" />
                                       </div>
                                       <div className="min-w-0">
                                           <div className={cn("font-bold text-xs sm:text-sm truncate", isSelected ? "text-emerald-100" : "text-slate-200")}>{t.name}</div>
                                           <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">LVL {hero.level}</div>
                                       </div>
                                   </div>
                                   <div className="text-right shrink-0 ml-2">
                                        <div className="text-[10px] sm:text-xs font-mono text-slate-400">{hero.troops} / {hero.level * 100}</div>
                                        <div className="text-[8px] sm:text-[10px] text-slate-600">兵力</div>
                                        <div className="text-[8px] sm:text-[9px] font-mono text-amber-500/70 mt-0.5">统{t.attributes.command}</div>
                                   </div>
                               </button>
                           )
                       })}
                  </div>
             </div>

             {/* Right Content - optimized for mobile */}
             <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 sm:p-4 lg:p-8 relative shadow-inner overflow-hidden flex flex-col min-h-0">
                  {/* Decorative background */}
                  <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-900/10 blur-[60px] sm:blur-[80px] pointer-events-none rounded-full"></div>

                  {activeHero && activeTemplate ? (
                      <div className="relative z-10 flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto custom-scrollbar">
                           <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
                               <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                   <HeroIcon icon={activeTemplate.icon} name={activeTemplate.name} className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl font-serif font-bold bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-transparent" />
                               </div>
                               <div className="min-w-0">
                                   <h2 className="text-lg sm:text-xl lg:text-3xl font-serif text-slate-200 mb-1 sm:mb-2 truncate">{activeTemplate.name} <span className="text-xs sm:text-sm font-mono text-emerald-400 ml-1 sm:ml-2">LVL {activeHero.level}</span></h2>
                                   <p className="text-slate-400 text-xs sm:text-sm italic line-clamp-2">{activeTemplate.desc}</p>
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-8">
                               <div className="bg-white/5 p-2.5 sm:p-4 rounded-lg border border-white/5">
                                    <div className="text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 mb-1">当前兵力 / 最高统帅</div>
                                    <div className="text-xl sm:text-2xl font-mono text-slate-200">
                                         {activeHero.troops} <span className="text-sm sm:text-lg text-slate-500">/ {maxTroops}</span>
                                    </div>
                                    <div className="w-full bg-black/50 h-1 sm:h-1.5 mt-2 sm:mt-3 rounded-full overflow-hidden">
                                         <div className="bg-emerald-500 h-full" style={{ width: `${(activeHero.troops / maxTroops) * 100}%` }}></div>
                                    </div>
                               </div>
                               <div className="bg-white/5 p-2.5 sm:p-4 rounded-lg border border-white/5">
                                    <div className="text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 mb-1">统帅 / 伤兵率</div>
                                    <div className="text-xl sm:text-2xl font-mono text-slate-200">
                                         {activeTemplate.attributes.command}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-amber-400/70 mt-1 sm:mt-2">
                                        伤兵率 {Math.min(85, Math.round((30 + activeTemplate.attributes.command * 2.5) * 10) / 10)}%
                                        {(activeHero.wounded || 0) > 0 && (
                                            <span className="ml-1 sm:ml-2 text-orange-400">· 待救治 {activeHero.wounded}</span>
                                        )}
                                    </div>
                               </div>
                           </div>

                           {availableCapacity > 0 ? (
                               <div className="bg-black/60 border border-emerald-500/20 p-3 sm:p-4 lg:p-6 rounded-xl relative mt-auto">
                                    <h3 className="text-xs sm:text-sm tracking-widest text-emerald-400 font-bold mb-3 sm:mb-6 flex items-center"><Users className="w-3 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 募兵诏令</h3>

                                    <div className="mb-4 sm:mb-6">
                                        <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 mb-2 font-mono">
                                            <span>招募数量</span>
                                            <span>{recruitAmount}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={availableCapacity}
                                            value={recruitAmount}
                                            onChange={(e) => setRecruitAmount(parseInt(e.target.value))}
                                            className="w-full accent-emerald-500"
                                        />
                                    </div>

                                    {recruitAmount > 0 && (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 bg-black/40 p-3 sm:p-4 rounded border border-white/5 gap-2 sm:gap-0">
                                            <div className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-widest">所需军资</div>
                                            <div className="flex items-center space-x-3 sm:space-x-6">
                                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                                    <span className="text-emerald-200 text-xs sm:text-sm font-mono">{costFood}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-slate-500">粮草</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                                    <span className="text-amber-200 text-xs sm:text-sm font-mono">{costBingxiang}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-slate-500">兵饷</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleRecruit}
                                        disabled={recruitAmount <= 0 || !canAfford}
                                        className={cn(
                                            "w-full py-3 sm:py-4 rounded-lg font-bold tracking-widest uppercase transition-all shadow-xl text-xs sm:text-sm flex items-center justify-center space-x-2 mobile-touch-target",
                                            recruitAmount > 0 && canAfford
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                                        )}
                                    >
                                        <Tent className="w-4 h-4" />
                                        <span>确认点兵</span>
                                    </button>
                               </div>
                           ) : (
                               <div className="mt-auto bg-white/5 border border-white/10 p-3 sm:p-4 lg:p-6 rounded-xl flex items-center justify-center text-slate-500 italic text-xs sm:text-sm">
                                   统帅已达上限，需提升豪杰等级方可调配更多兵马。
                               </div>
                           )}
                      </div>
                  ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 italic text-sm sm:text-base px-4">
                          选择左侧豪杰进行驻军安排
                      </div>
                  )}
             </div>
        </div>
    );
}
