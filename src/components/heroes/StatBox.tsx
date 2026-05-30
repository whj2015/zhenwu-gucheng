/* Extracted from HeroesPanel.tsx - StatBox */
import React from 'react';
import { cn } from '../../utils';

export default function StatBox({ label, base, bonus = 0, max = 0, isHp = false }: { label: string, base: number, bonus?: number, max?: number, isHp?: boolean }) {
    return (
        <div className="bg-white/5 p-3 border border-white/5 rounded-lg flex flex-col justify-center">
             <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</div>
             <div className="font-mono text-base flex items-baseline">
                 <span className={cn("text-slate-200", isHp && base < max*0.3 ? "text-red-400" : "")}>{isHp ? base : base}</span>
                 {isHp && max > 0 && <span className="text-slate-600 text-xs ml-1">/{max}</span>}
                 {bonus > 0 && <span className="text-cyan-400 text-xs ml-1 font-bold">+{bonus}</span>}
             </div>
        </div>
    );
}
