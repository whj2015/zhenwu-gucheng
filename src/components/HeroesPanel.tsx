import React, { useState } from 'react';
import { cn } from '../utils';
import ResidenceView from './heroes/ResidenceView';
import TavernView from './heroes/TavernView';

export default function HeroesPanel() {
    const [subTab, setSubTab] = useState<'residence' | 'tavern'>('residence');

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 animate-in fade-in duration-500">
            <div className="flex justify-center border-b border-white/10 mb-8 shrink-0">
                 <button 
                     onClick={() => setSubTab('residence')} 
                     className={cn("px-12 py-3 tracking-widest font-bold font-serif text-lg transition-all", subTab === 'residence' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-slate-500 hover:text-slate-300")}
                 >
                     门客居所
                 </button>
                 <button 
                     onClick={() => setSubTab('tavern')} 
                     className={cn("px-12 py-3 tracking-widest font-bold font-serif text-lg transition-all", subTab === 'tavern' ? "text-orange-400 border-b-2 border-orange-500 bg-orange-500/5" : "text-slate-500 hover:text-slate-300")}
                 >
                     酒馆招募
                 </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {subTab === 'residence' && <ResidenceView />}
                {subTab === 'tavern' && <TavernView />}
            </div>
        </div>
    );
}
