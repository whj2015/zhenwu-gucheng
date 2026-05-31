import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { CRAFTING_TEMPLATES, FORGE_UPGRADE_COSTS } from '../data';
import { ArrowUpCircle, Sparkles, Shield, Sword } from 'lucide-react';
import { formatTime } from '../utils';
import { cn } from '../utils';
import { CraftingCard } from './CraftingCard';

const WeaponIcon = () => <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />;
const ArmorIcon = () => <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />;

export const TYPE_ICONS: Record<string, React.ComponentType> = {
  weapon: WeaponIcon,
  armor: ArmorIcon,
};

export default function ForgePanel() {
    const buildings = useGameStore((state) => state.buildings);
    const resources = useGameStore((state) => state.resources);
    const startCrafting = useGameStore((state) => state.startCrafting);
    const crafting = useGameStore((state) => state.crafting);
    const upgradeForge = useGameStore((state) => state.upgradeForge);
    const lvl = buildings.forgeLevel;
    const upgradeCost = FORGE_UPGRADE_COSTS[(lvl + 1) as unknown as keyof typeof FORGE_UPGRADE_COSTS];
    const canUpgrade = upgradeCost && resources.bingxiang >= upgradeCost.bingxiang && resources.meteorite >= upgradeCost.meteorite;
    const pityNormal = crafting.consecutiveNormal || 0;
    const pityFine = crafting.consecutiveFine || 0;
    const nextPityNormal = 5 - pityNormal;
    const nextPityFine = 10 - pityFine;

    return (
        <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-white/10 pb-3 sm:pb-4">
                 <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-serif tracking-wide text-orange-100">兵甲坊 <span className="text-orange-500/80 text-xs sm:text-sm font-sans ml-2">LV.{lvl}</span></h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">锻造绝世神兵，武装你的豪杰以踏破遗迹。</p>
                 </div>
                 {upgradeCost && (
                     <button
                        onClick={upgradeForge}
                        disabled={!canUpgrade || !!crafting.task}
                        className="w-full sm:w-auto px-3 sm:px-4 py-1.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] sm:text-xs hover:bg-cyan-500/20 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 sm:space-x-2 mobile-touch-target"
                     >
                         <ArrowUpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                         <span>升阶 (需 {upgradeCost.bingxiang} 饷 / {upgradeCost.meteorite} 陨)</span>
                     </button>
                 )}
             </div>

             {/* Pity System Display */}
             <div className="grid grid-cols-2 gap-2 sm:gap-3">
                 <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 sm:p-3">
                     <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                         <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-wider">良品保底</span>
                         <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300">{pityNormal}/5</span>
                     </div>
                     <div className="w-full bg-black/60 h-1 sm:h-1.5 rounded-full overflow-hidden">
                         <div
                             className={cn("h-full rounded-full transition-all", nextPityNormal <= 1 ? "bg-cyan-500 w-full animate-pulse" : "bg-slate-600")}
                             style={{ width: `${(pityNormal / 5) * 100}%` }}
                         ></div>
                     </div>
                     <span className="text-[8px] sm:text-[9px] text-slate-600 mt-1 block">{nextPityNormal > 0 ? `再${nextPityNormal}次普通品后必出良品` : '下次必出良品！'}</span>
                 </div>
                 <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 sm:p-3">
                     <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                         <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-wider">史诗保底</span>
                         <span className="text-[9px] sm:text-[10px] font-mono text-purple-300">{pityFine}/10</span>
                     </div>
                     <div className="w-full bg-black/60 h-1 sm:h-1.5 rounded-full overflow-hidden">
                         <div
                             className={cn("h-full rounded-full transition-all", nextPityFine <= 1 ? "bg-purple-500 w-full animate-pulse" : "bg-slate-600")}
                             style={{ width: `${(pityFine / 10) * 100}%` }}
                         ></div>
                     </div>
                     <span className="text-[8px] sm:text-[9px] text-slate-600 mt-1 block">{nextPityFine > 0 ? `再${nextPityFine}次良品后必出史诗` : '下次必出史诗！'}</span>
                 </div>
             </div>

             {/* Crafting Queue Area */}
             <div className="h-16 sm:h-20 lg:h-24 bg-black/40 border border-white/5 rounded-xl px-4 sm:px-6 flex items-center justify-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden">
                  {crafting.task ? <ActiveTask /> : <p className="text-slate-500 font-serif text-xs sm:text-sm tracking-widest relative z-10">炉火休寂，暂无打造队列</p>}
             </div>

             {/* Available Blueprints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                {Object.entries(CRAFTING_TEMPLATES).map(([id, t]) => {
                    const maxStats = t.baseStats[lvl];
                    if (!maxStats) return null;
                    const canAfford = resources.bingxiang >= t.costBingxiang && resources.iron >= t.costIron;
                    const isBusy = !!crafting.task;

                    return (
                        <CraftingCard
                            key={id}
                            id={id}
                            t={t}
                            lvl={lvl}
                            resources={resources}
                            canAfford={canAfford}
                            isBusy={isBusy}
                            startCrafting={startCrafting}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function ActiveTask() {
    const crafting = useGameStore((state) => state.crafting);
    const claimCrafting = useGameStore((state) => state.claimCrafting);
    const task = crafting.task;
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!task?.endTime) return;

        let animationFrameId: number;
        const update = () => {
            const rem = task.endTime - Date.now();
            setTimeLeft(Math.max(0, rem));

            if (rem > 0) {
                animationFrameId = requestAnimationFrame(update);
            }
        };

        update();
        return () => cancelAnimationFrame(animationFrameId);
    }, [task?.endTime]);

    if (!task) return null;
    const template = CRAFTING_TEMPLATES[task.templateId];
    const done = timeLeft <= 0;
    const progress = Math.min(100, Math.max(0, 100 - (timeLeft / template.durationMs) * 100));

    return (
        <div className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
            {done ? (
                 <button onClick={claimCrafting} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] animate-pulse flex items-center justify-center gap-2 mobile-touch-target">
                     <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 取出 {template.name}
                 </button>
            ) : (
                <>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-500 mb-1.5 sm:mb-2 uppercase tracking-widest font-mono">
                            <span>锻造中: {template.name}</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-600 to-yellow-500 shadow-[0_0_8px_#f97316] transition-all duration-200 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 sm:h-12 bg-white/10"></div>
                    <div className="text-right w-full sm:w-24">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase tracking-widest">剩余</span>
                        <span className="text-base sm:text-lg font-mono text-orange-400">{formatTime(timeLeft)}</span>
                    </div>
                </>
            )}
        </div>
    );
}
