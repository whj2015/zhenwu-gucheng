import { useState } from 'react';
import { cn } from '../utils';
import ResidenceView from './heroes/ResidenceView';
import TavernView from './heroes/TavernView';

export default function HeroesPanel() {
    const [subTab, setSubTab] = useState<'residence' | 'tavern'>('residence');

    return (
        <div className="max-w-5xl mx-auto flex flex-col pt-3 sm:pt-4 animate-in fade-in duration-500 pb-20 lg:pb-0">
            <div className="flex justify-center border-b border-white/10 mb-4 sm:mb-6 lg:mb-8 shrink-0">
                 <button
                     onClick={() => setSubTab('residence')}
                     className={cn("px-4 sm:px-6 lg:px-12 py-2 sm:py-2.5 lg:py-3 tracking-widest font-bold font-serif text-sm sm:text-base lg:text-lg transition-all mobile-touch-target", subTab === 'residence' ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-slate-500 hover:text-slate-300")}
                 >
                     门客居所
                 </button>
                 <button
                     onClick={() => setSubTab('tavern')}
                     className={cn("px-4 sm:px-6 lg:px-12 py-2 sm:py-2.5 lg:py-3 tracking-widest font-bold font-serif text-sm sm:text-base lg:text-lg transition-all mobile-touch-target", subTab === 'tavern' ? "text-orange-400 border-b-2 border-orange-500 bg-orange-500/5" : "text-slate-500 hover:text-slate-300")}
                 >
                     酒馆招募
                 </button>
            </div>

            <div className="flex-1">
                {subTab === 'residence' && <ResidenceView />}
                {subTab === 'tavern' && <TavernView />}
            </div>
        </div>
    );
}
