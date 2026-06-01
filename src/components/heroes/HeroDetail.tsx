/* Extracted from HeroesPanel.tsx - HeroDetail */
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { Shield, Sword } from 'lucide-react';
import HeroIcon from '../HeroIcon';
import StatBox from './StatBox';
import EquipSlot from './EquipSlot';

export default function HeroDetail({ heroId }: { heroId: string }) {
    const hero = useGameStore((state) => state.heroes.find(h => h.id === heroId));
    const equipItem = useGameStore((state) => state.equipItem);
    if (!hero) return null;
    
    const t = HERO_TEMPLATES[hero.templateId];
    const wAtk = hero.equipment.weapon?.attack || 0;
    const aDef = hero.equipment.armor?.defense || 0;

    const maxHp = t.attributes.physique * 10;

    return (
        <div className="flex flex-col h-full relative z-10">
             <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-start border-b border-white/10 pb-4 sm:pb-6 lg:pb-8 mb-4 sm:mb-6 lg:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl" />
                  </div>
                  <div className="space-y-2.5 sm:space-y-4 flex-1 min-w-0">
                       <div>
                           <h3 className="text-lg sm:text-2xl lg:text-3xl font-serif text-slate-100 truncate">{t.name} <span className="text-xs sm:text-sm font-mono text-emerald-400 ml-1 sm:ml-2">LVL {hero.level}</span></h3>
                           <p className="text-xs sm:text-sm text-slate-400 italic mt-0.5 sm:mt-1 line-clamp-2">{t.desc}</p>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3 pt-1.5 sm:pt-2">
                           <StatBox label="武力" base={t.attributes.force} bonus={wAtk} />
                           <StatBox label="体魄" base={t.attributes.physique} />
                           <StatBox label="轻功" base={t.attributes.agility} />
                           <StatBox label="统帅" base={t.attributes.command} />
                           <StatBox label="兵统" base={hero.troops} max={hero.level * 100} />
                           <StatBox label="血气" base={hero.hp} max={maxHp} isHp />
                           <StatBox label="经验" base={hero.exp} max={hero.level * 100} />
                           <StatBox label="护甲" base={0} bonus={aDef} />
                       </div>
                       <div className="mt-3 sm:mt-4 inline-flex items-center bg-white/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded border border-white/10">
                            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest mr-2 sm:mr-3">天赋</span>
                            <span className="text-xs sm:text-sm text-orange-400 font-bold tracking-wide">{t.skillName}</span>
                       </div>
                       {t.skillEffect && (
                           <div className="mt-1.5 sm:mt-2 bg-orange-500/5 border border-orange-500/15 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
                               <span className="text-[10px] sm:text-[11px] text-orange-300/80 leading-relaxed">{t.skillEffect.desc}</span>
                           </div>
                       )}
                  </div>
             </div>

             <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs sm:text-sm tracking-widest text-slate-500 uppercase font-bold mb-2 sm:mb-4">装配面板</h4>
                  <div className="flex space-x-4 sm:space-x-6 flex-1 min-h-[120px] sm:min-h-[160px]">
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
