/* Extracted from HeroesPanel.tsx - HeroDetail */
import { useGameStore } from '../../store';
import { HERO_TEMPLATES } from '../../data';
import { Shield, Sword, Sparkles, BookOpen, Gem } from 'lucide-react';
import HeroIcon, { RarityBadge } from '../HeroIcon';
import StatBox from './StatBox';
import EquipSlot from './EquipSlot';
import { detectSetBonuses, calculateSetStatBonus } from '../../utils/equipmentSetEngine';
import { RARITY_COLORS, RARITY_LABELS } from '../../data/equipmentSets';

function getStatLabel(stat: string): string {
    const labels: Record<string, string> = {
        attack: '攻击',
        defense: '防御',
        agility: '敏捷',
        hp: '血气',
        dodge: '闪避'
    };
    return labels[stat] || stat;
}

export default function HeroDetail({ heroId }: { heroId: string }) {
    const hero = useGameStore((state) => state.heroes.find(h => h.id === heroId));
    const equipItem = useGameStore((state) => state.equipItem);
    if (!hero) return null;
    
    const t = HERO_TEMPLATES[hero.templateId];
    const rarity = (t as any).rarity || 'N';
    const wAtk = hero.equipment.weapon?.attack || 0;
    const aDef = hero.equipment.armor?.defense || 0;

    const maxHp = t.attributes.physique * 10;

const setBonuses = detectSetBonuses(hero);
    const setStatBonus = calculateSetStatBonus(hero);
    return (
        <div className="flex flex-col relative z-10">
             <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-start border-b border-white/10 pb-4 sm:pb-6 lg:pb-8 mb-4 sm:mb-6 lg:mb-8">
                  <div className="relative group">
                      <HeroIcon 
                          icon={t.icon} 
                          name={t.name} 
                          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32" 
                          rarity={rarity}
                          size="lg"
                      />
                      <div className="absolute -top-2 -right-2 z-10">
                          <RarityBadge rarity={rarity} size="sm" />
                      </div>
                  </div>
                  <div className="space-y-2.5 sm:space-y-4 flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                           <h3 className="text-lg sm:text-2xl lg:text-3xl font-serif text-slate-100 truncate">{t.name}</h3>
                           <RarityBadge rarity={rarity} size="md" />
                           <span className="text-xs sm:text-sm font-mono text-emerald-400">LVL {hero.level}</span>
                       </div>
                       <p className="text-xs sm:text-sm text-slate-400 italic mt-0.5 sm:mt-1 line-clamp-2">{t.desc}</p>
                       
                       {(t as any).flavorText && (
                           <p className="text-[11px] sm:text-xs text-slate-500 italic border-l-2 border-slate-600 pl-2 py-1">
                               "{(t as any).flavorText}"
                           </p>
                       )}

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

                       <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-orange-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-xs sm:text-sm font-bold tracking-wide text-orange-300">{t.skillName}</span>
                            </div>
                            {t.skillEffect && (
                                <span className="text-[10px] sm:text-[11px] text-orange-200/80 leading-relaxed block">
                                    {t.skillEffect.desc}
                                </span>
                            )}
                       </div>

                  </div>
             </div>

             {(t as any).lore && (
                 <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                     <div className="flex items-center gap-2 mb-2">
                         <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">人物志</span>
                     </div>
                     <p className="text-xs sm:text-sm text-slate-400 leading-relaxed italic">
                         {(t as any).lore}
                     </p>
                 </div>
             )}

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
{setBonuses.length > 0 && (
                 <div className="mt-4 sm:mt-6">
                     <h4 className="text-xs sm:text-sm tracking-widest text-slate-500 uppercase font-bold mb-2 sm:mb-3 flex items-center gap-2">
                         <Gem className="w-3.5 h-3.5 text-purple-400" />
                         套装效果
                     </h4>
                     <div className="space-y-2.5">
                         {setBonuses.map((setInfo) => {
                             const rarityColor = RARITY_COLORS[setInfo.rarity];
                             const rarityLabel = RARITY_LABELS[setInfo.rarity];
                             
                             return (
                                 <div
                                     key={setInfo.setId}
                                     className={`rounded-xl border p-3 sm:p-4 transition-all ${
                                         setInfo.isComplete
                                             ? `${rarityColor.bg} ${rarityColor.border} shadow-lg ${rarityColor.glow}`
                                             : 'bg-white/5 border-white/10'
                                     }`}
                                 >
                                     <div className="flex items-center gap-3 mb-2.5">
                                         <span className="text-xl sm:text-2xl">{setInfo.icon}</span>
                                         <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 flex-wrap">
                                                 <h5 className={`font-bold text-sm ${setInfo.isComplete ? rarityColor.text : 'text-slate-300'}`}>
                                                     {setInfo.setName}
                                                 </h5>
                                                 <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${rarityColor.bg} ${rarityColor.text} ${rarityColor.border} border`}>
                                                     {rarityLabel}
                                                 </span>
                                             </div>
                                             <p className={`text-[10px] sm:text-xs mt-0.5 ${setInfo.isComplete ? 'text-slate-400' : 'text-slate-500'}`}>
                                                 {setInfo.description}
                                             </p>
                                         </div>
                                         <div className={`text-right shrink-0`}>
                                             <div className={`font-mono font-bold ${
                                                 setInfo.isComplete ? rarityColor.text : 'text-slate-400'
                                             }`}>
                                                 {setInfo.activePieces}/{setInfo.requiredPieces}
                                             </div>
                                             <div className="text-[9px] text-slate-600">件</div>
                                         </div>
                                     </div>

                                     {setInfo.activeBonuses.length > 0 && (
                                         <div className="space-y-1.5 pt-2 border-t border-white/5">
                                             {setInfo.activeBonuses.map((bonus, idx) => (
                                                 <div key={idx} className="flex flex-wrap gap-1.5">
                                                     <span className="text-[9px] text-slate-500">集齐{bonus.count}件:</span>
                                                     {Object.entries(bonus.effects).map(([stat, value]) => (
                                                         <span key={stat} className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                                             setInfo.isComplete ? `${rarityColor.bg} ${rarityColor.text}` : 'bg-white/5 text-slate-400'
                                                         }`}>
                                                             +{value}{getStatLabel(stat)}
                                                         </span>
                                                     ))}
                                                 </div>
                                             ))}
                                         </div>
                                     )}

                                     {!setInfo.isComplete && (
                                         <div className="mt-2 pt-2 border-t border-white/5">
                                             <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                                 <div
                                                     className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500`}
                                                     style={{ width: `${(setInfo.activePieces / setInfo.requiredPieces) * 100}%` }}
                                                 ></div>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>

                     {Object.keys(setStatBonus).length > 0 && (
                         <div className="mt-3 p-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                             <div className="flex items-center gap-2 mb-2">
                                 <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                 <span className="text-[10px] font-bold tracking-wide text-purple-300 uppercase">总属性加成</span>
                             </div>
                             <div className="flex flex-wrap gap-1.5">
                                 {Object.entries(setStatBonus).map(([stat, value]) => (
                                     <span key={stat} className="text-[10px] sm:text-xs px-2 py-1 bg-purple-500/20 rounded text-purple-300 font-mono font-bold">
                                         +{value}{getStatLabel(stat)}
                                     </span>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>
             )}
        </div>
    );
}
