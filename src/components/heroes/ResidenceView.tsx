/* Extracted from HeroesPanel.tsx - ResidenceView */
import React, { useState } from 'react';
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { Users } from 'lucide-react';
import { cn } from '../../utils';
import HeroDetail from './HeroDetail';
import HeroIcon from '../HeroIcon';

export default function ResidenceView() {
    const { heroes } = useGameStore();
    const [selectedHero, setSelectedHero] = useState<string | null>(heroes.length > 0 ? heroes[0].id : null);
    
    // Auto-select if selectedHero gets deleted or if heroes become available
    if (selectedHero && !heroes.find(h => h.id === selectedHero)) {
        if (heroes.length > 0) setSelectedHero(heroes[0].id);
        else setSelectedHero(null);
    } else if (!selectedHero && heroes.length > 0) {
        setSelectedHero(heroes[0].id);
    }

    if (heroes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                <Users className="w-16 h-16 opacity-20" />
                <p className="tracking-widest font-serif text-lg">暂无门客，请前往酒馆寻访</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Hero List side */}
            <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[35vh] lg:max-h-none">
                {heroes.map(h => {
                    const t = HERO_TEMPLATES[h.templateId];
                    const maxHp = t.attributes.physique * 10;
                    const isSelected = selectedHero === h.id;
                    return (
                        <button 
                        key={h.id}
                        onClick={() => setSelectedHero(h.id)}
                        className={cn(
                            "w-full text-left p-2.5 lg:p-3 rounded-lg border transition-all flex gap-4",
                            isSelected 
                                ? "bg-white/10 border-orange-500/50 shadow-md" 
                                : "bg-white/5 border-white/5 hover:border-white/20"
                        )}
                        >
                            <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded border overflow-hidden flex items-center justify-center", isSelected ? "bg-orange-900/30 border-orange-500/50" : "bg-black/40 border-white/10")}>
                                <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-lg" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className={cn("font-serif", isSelected ? "text-orange-200" : "text-slate-300")}>{t.name}</span>
                                    <span className={cn(
                                        "text-[10px] px-1 border",
                                        t.quality === '将才' ? "bg-orange-950 text-orange-400 border-orange-500/30" : "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                                    )}>{t.quality}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400">Lv:{h.level}</span>
                                    <span className="text-[10px] text-emerald-400">兵:{h.troops}</span>
                                    <span className="text-[10px] text-cyan-400">轻:{t.attributes.agility}</span>
                                    <span className="text-[10px] text-slate-400">武:{t.attributes.force}</span>
                                    <span className="text-[10px] text-amber-400">统:{t.attributes.command}</span>
                                </div>
                                <div className="mt-2 w-full h-1 bg-black/50 rounded-full overflow-hidden">
                                <div className={cn("h-full", h.hp < maxHp * 0.3 ? "bg-red-500" : "bg-green-500")} style={{ width: `${(h.hp / maxHp) * 100}%` }}></div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Hero Details & Equipment */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 lg:p-8 flex flex-col relative overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 blur-3xl pointer-events-none"></div>
                {selectedHero && <HeroDetail heroId={selectedHero} />}
            </div>
        </div>
    );
}
