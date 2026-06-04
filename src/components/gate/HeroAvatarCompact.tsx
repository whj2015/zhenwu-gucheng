/* Extracted from GatePanel.tsx - HeroAvatarCompact */
import React from 'react';
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { cn } from '../../utils';
import HeroIcon from '../HeroIcon';

const HeroAvatarCompact: React.FC<{ heroId: string | null }> = ({ heroId }) => {
    if (!heroId) return <div className="w-14 h-14 rounded-lg border border-dashed border-white/5 bg-white/[0.02]" />;
    
    const { heroes } = useGameStore();
    const h = heroes.find(x => x.id === heroId);
    if (!h) return null;
    const t = HERO_TEMPLATES[h.templateId];
    if (!t) return null;
    const maxHp = t.attributes.physique * 10;
    const hpPct = Math.max(0, (h.hp / maxHp) * 100);

    return (
        <div className="w-14 h-14 rounded-lg border bg-white/[0.03] border-white/10 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/[0.05] transition-all">
            <HeroIcon icon={t.icon} name={t.name} className="text-xs" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden">
                <div 
                    className={cn("h-full transition-colors", hpPct > 50 ? "bg-emerald-500" : hpPct > 20 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${hpPct}%` }}
                ></div>
            </div>
            {(h.equipment.weapon || h.equipment.armor) && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]"></div>
            )}
        </div>
    );
};

export default HeroAvatarCompact;
