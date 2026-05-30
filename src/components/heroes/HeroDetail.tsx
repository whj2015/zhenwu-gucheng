/* Extracted from HeroesPanel.tsx - HeroDetail */
import React from 'react';
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { Shield, Sword } from 'lucide-react';
import { cn } from '../../utils';
import StatBox from './StatBox';
import EquipSlot from './EquipSlot';

function HeroIcon({ icon, name, className }: { icon: string | null; name: string; className?: string }) {
    if (icon) {
        return <img src={icon} alt={name} className={cn("object-cover rounded-lg", className)} />;
    }
    return <span className={cn("font-serif font-bold bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-transparent", className)}>{name.charAt(0)}</span>;
}

export default function HeroDetail({ heroId }: { heroId: string }) {
    const { heroes, equipItem } = useGameStore();
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return null;
    
    const t = HERO_TEMPLATES[hero.templateId];
    const wAtk = hero.equipment.weapon?.attack || 0;
    const aDef = hero.equipment.armor?.defense || 0;

    const maxHp = t.attributes.physique * 10;

    return (
        <div className="flex flex-col h-full relative z-10">
             <div className="flex gap-8 items-start border-b border-white/10 pb-8 mb-8">
                  <div className="w-32 h-32 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-5xl" />
                  </div>
                  <div className="space-y-4 flex-1">
                       <div>
                           <h3 className="text-3xl font-serif text-slate-100">{t.name} <span className="text-sm font-mono text-emerald-400 ml-2">LVL {hero.level}</span></h3>
                           <p className="text-sm text-slate-400 italic mt-1">{t.desc}</p>
                       </div>
                       <div className="grid grid-cols-4 gap-3 pt-2">
                           <StatBox label="武力" base={t.attributes.force} bonus={wAtk} />
                           <StatBox label="体魄" base={t.attributes.physique} />
                           <StatBox label="轻功" base={t.attributes.agility} />
                           <StatBox label="统帅" base={t.attributes.command} />
                           <StatBox label="兵统" base={hero.troops} max={hero.level * 100} />
                           <StatBox label="血气" base={hero.hp} max={maxHp} isHp />
                           <StatBox label="经验" base={hero.exp} max={hero.level * 100} />
                           <StatBox label="护甲" base={0} bonus={aDef} />
                       </div>
                       <div className="mt-4 inline-flex items-center bg-white/5 px-3 py-1.5 rounded border border-white/10">
                            <span className="text-xs text-slate-500 uppercase tracking-widest mr-3">天赋</span>
                            <span className="text-sm text-orange-400 font-bold tracking-wide">{t.skillName}</span>
                       </div>
                       {t.skillEffect && (
                           <div className="mt-2 bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2">
                               <span className="text-[11px] text-orange-300/80 leading-relaxed">{t.skillEffect.desc}</span>
                           </div>
                       )}
                  </div>
             </div>

             <div className="flex-1 flex flex-col">
                  <h4 className="text-sm tracking-widest text-slate-500 uppercase font-bold mb-4">装配面板</h4>
                  <div className="flex space-x-6 flex-1 min-h-[160px]">
                      {/* Weapon Slot */}
                      <EquipSlot 
                         label="兵器" 
                         type="weapon"
                         equip={hero.equipment.weapon} 
                         icon={Sword} 
                         onUnequip={() => equipItem(hero.id, 'weapon', null)}
                         heroId={hero.id}
                      />
                      {/* Armor Slot */}
                      <EquipSlot 
                         label="宝铠" 
                         type="armor"
                         equip={hero.equipment.armor} 
                         icon={Shield} 
                         onUnequip={() => equipItem(hero.id, 'armor', null)}
                         heroId={hero.id}
                      />
                  </div>
             </div>
        </div>
    );
}
