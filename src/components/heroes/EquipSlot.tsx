import { useState } from 'react';
import { useGameStore } from '../../store';
import { cn } from '../../utils';
import type { Equipment } from '../../types';
import type { LucideIcon } from 'lucide-react';

interface EquipSlotProps {
    label: string;
    type: 'weapon' | 'armor';
    equip: Equipment | null;
    icon: LucideIcon;
    onUnequip: () => void;
    heroId: string;
}

export default function EquipSlot({ label, type, equip, icon: Icon, onUnequip, heroId }: EquipSlotProps) {
    const { inventory, equipItem } = useGameStore();
    const [selectMode, setSelectMode] = useState(false);

    const availableOpts = inventory.filter(e => e.type === type);

    if (selectMode) {
        return (
            <div className="flex-1 bg-black/60 border border-white/10 p-2.5 sm:p-4 rounded-xl relative flex flex-col">
                <button onClick={() => setSelectMode(false)} className="absolute top-1.5 right-2 sm:top-2 sm:right-3 text-slate-500 hover:text-slate-300 text-[10px] sm:text-xs tracking-widest uppercase mobile-touch-target">关闭</button>
                <div className="text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 mb-3 sm:mb-4 pb-1.5 sm:pb-2 border-b border-white/5">库存 {label}</div>
                <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 custom-scrollbar">
                    {availableOpts.length === 0 && <div className="text-[10px] sm:text-xs text-slate-600 text-center py-4 sm:py-6 font-serif">库中暂无此物</div>}
                    {availableOpts.map(e => (
                        <div key={e.id} onClick={() => { equipItem(heroId, type, e.id); setSelectMode(false); }} className="flex justify-between items-center p-2 sm:p-3 bg-white/5 hover:bg-white/10 cursor-pointer rounded-lg border border-white/5 text-xs sm:text-sm transition-all group mobile-touch-target">
                             <div className="flex items-center gap-1.5 sm:gap-2">
                                 <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", e.quality === 'epic' ? 'bg-orange-500' : e.quality==='fine' ? 'bg-cyan-500' : 'bg-slate-400')}></div>
                                 <span className={cn("truncate", e.quality === 'epic' ? 'text-orange-400' : e.quality==='fine' ? 'text-cyan-200' : 'text-slate-300')}>{e.name}</span>
                             </div>
                             <span className="text-[10px] sm:text-xs font-mono text-slate-400 group-hover:text-slate-200 shrink-0">
                                 {e.type === 'weapon' ? `攻+${e.attack}` : `防+${e.defense}`}
                             </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-white/5 border border-white/10 p-2.5 sm:p-4 rounded-xl relative flex flex-col items-center justify-center group transition-colors hover:bg-white/10 hover:border-white/20 overflow-hidden cursor-pointer" onClick={() => setSelectMode(true)}>
             <div className="absolute top-2 left-2.5 sm:top-3 sm:left-4 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</div>
             {equip ? (
                 <div className="w-full h-full flex flex-col items-center justify-center relative z-10 pt-3 sm:pt-4">
                      <div className={cn("mb-1.5 sm:mb-2 w-10 h-10 sm:w-12 sm:h-12 rounded bg-black/40 border flex items-center justify-center", equip.quality === 'epic' ? 'border-orange-500/50' : equip.quality==='fine' ? 'border-cyan-500/50' : 'border-white/10')}>
                          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", equip.quality === 'epic' ? 'text-orange-400' : equip.quality==='fine' ? 'text-cyan-300' : 'text-slate-400')} />
                      </div>
                      <span className={cn("font-bold text-xs sm:text-sm text-center truncate px-1", equip.quality === 'epic' ? 'text-orange-400' : equip.quality==='fine' ? 'text-cyan-300' : 'text-slate-200')}>{equip.name}</span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 sm:mt-1">
                          {type === 'weapon' ? `ATK +${equip.attack}` : `DEF +${equip.defense}`}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); onUnequip(); }} className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 text-[9px] sm:text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-tl-lg hover:text-red-300 transition-colors uppercase tracking-widest border-t border-l border-red-500/20">卸下</button>
                 </div>
             ) : (
                 <div className="flex flex-col items-center text-slate-600 group-hover:text-slate-400 transition-colors relative z-10 pt-3 sm:pt-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-white/5 border border-white/5 border-dashed flex items-center justify-center mb-2 sm:mb-3 group-hover:border-white/20 group-hover:bg-white/10 transition-all">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-widest">点击装备</span>
                 </div>
             )}
        </div>
    );
}
