/* Extracted from GatePanel.tsx - NodeButton */
import { Sword, Tent, Archive, Skull } from 'lucide-react';
import { RuinsNode } from '../../types';
import { cn } from '../../utils';

export default function NodeButton({ 
    node, 
    hovered, 
    onHover, 
    onClick 
}: { 
    node: RuinsNode; 
    hovered: boolean; 
    onHover: (n: RuinsNode | null) => void; 
    onClick: (n: RuinsNode) => void;
    key?: string; 
}) {
    const isInteractive = node.revealed && !node.completed;
    
    const style = cn(
        "relative w-14 h-14 lg:w-18 lg:h-18 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0",
        !node.revealed && "bg-white/[0.03] border border-white/5 opacity-30 cursor-default scale-90",
        node.completed && "bg-white/[0.04] border border-white/5 opacity-40 cursor-default scale-90",
        isInteractive && node.type === 'battle' && "bg-black/60 border border-cyan-500/40 hover:border-cyan-400 hover:scale-110 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.15)]",
        isInteractive && node.type === 'boss' && "bg-black/60 border border-red-500/40 hover:border-red-400 hover:scale-110 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.2)]",
        isInteractive && node.type === 'camp' && "bg-black/60 border border-emerald-500/30 hover:border-emerald-400 hover:scale-110 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        isInteractive && node.type === 'armory' && "bg-black/60 border border-violet-500/30 hover:border-violet-400 hover:scale-110 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.1)]",
        hovered && isInteractive && "ring-2 ring-white/10"
    );

    return (
        <button
            className={style}
            onClick={() => onClick(node)}
            onMouseEnter={() => onHover(node)}
            onMouseLeave={() => onHover(null)}
            disabled={!isInteractive}
        >
            {node.type === 'battle' && <Sword className="w-5 h-5 lg:w-7 lg:h-7 text-slate-300" />}
            {node.type === 'boss' && <Skull className="w-7 h-7 lg:w-9 lg:h-9 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
            {node.type === 'camp' && <Tent className="w-5 h-5 lg:w-7 lg:h-7 text-emerald-400" />}
            {node.type === 'armory' && <Archive className="w-5 h-5 lg:w-7 lg:h-7 text-violet-400" />}

            {isInteractive && (
                <div className="absolute inset-0 rounded-2xl border animate-ping opacity-10 pointer-events-none"
                     style={{ borderColor: node.type === 'boss' ? 'rgba(239,68,68,0.5)' : node.type === 'camp' ? 'rgb(16,185,129)' : node.type === 'armory' ? 'rgb(139,92,246)' : 'rgb(34,211,238)' }}
                ></div>
            )}

            {node.completed && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
            )}
        </button>
    );
}
