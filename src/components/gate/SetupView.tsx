/* Extracted from GatePanel.tsx - SetupView */
import { useState } from 'react';
import { useGameStore } from '../../store';
import { generateFloor } from '../../engine/ruins';
import { HERO_TEMPLATES, MISSIONS } from '../../data';
import { ChevronLeft, Skull, Navigation, Save, Trash2, X } from 'lucide-react';
import { PositionKey, PositionRow, PositionCol } from '../../types';
import { POSITION_CONFIG, MAX_DEPLOY_COUNT } from '../../data';
import { cn } from '../../utils';
import HeroIcon from '../HeroIcon';

const PRESETS_STORAGE_KEY = 'ironecho_custom_presets';

interface SavedPreset {
    id: string;
    name: string;
    icon: string;
    positions: (PositionKey | null)[];
}

const DEFAULT_PRESETS: SavedPreset[] = [
    { id: 'balanced', name: '均衡阵', icon: '⚖️', positions: ['front-center', null, null, null, 'middle-center', null, null, 'back-center', null] },
    { id: 'assault', name: '猛攻阵', icon: '⚔️', positions: ['front-left', 'front-center', 'front-right', null, null, null, null, null, null] },
    { id: 'fortress', name: '铁壁阵', icon: '🛡️', positions: [null, null, null, 'middle-left', 'middle-center', 'middle-right', null, 'back-center', null] },
];

function loadPresets(): SavedPreset[] {
    try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_PRESETS;
}

function savePresets(presets: SavedPreset[]) {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export default function SetupView({ missionId, onCancel, onDeploy }: { missionId: string; onCancel: () => void; onDeploy?: () => void }) {
    const { heroes, beginRun } = useGameStore();
    const mission = MISSIONS[missionId];

    const [party, setParty] = useState<Record<PositionKey, string | null>>(() => {
        const empty: Record<string, null> = {};
        (Object.keys(POSITION_CONFIG) as PositionKey[]).forEach(k => { empty[k] = null; });
        return empty as Record<PositionKey, string | null>;
    });
    const [presets, setPresets] = useState<SavedPreset[]>(loadPresets);
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');

    const deployedCount = Object.values(party).filter(Boolean).length;
    const deployedIds = new Set(Object.values(party).filter(Boolean) as string[]);
    const availableHeroes = heroes.filter(h => !deployedIds.has(h.id));

    const applyPreset = (preset: SavedPreset) => {
        const emptyParty = Object.fromEntries(
            (Object.keys(POSITION_CONFIG) as PositionKey[]).map(k => [k, null])
        ) as Record<PositionKey, string | null>;

        const positionKeys = Object.keys(POSITION_CONFIG) as PositionKey[];
        preset.positions.forEach((heroId, idx) => {
            if (heroId && idx < positionKeys.length) {
                emptyParty[positionKeys[idx]] = heroId;
            }
        });
        setParty(emptyParty);
    };

    const handleSlotClick = (pos: PositionKey) => {
        if (party[pos]) {
            setParty(prev => ({ ...prev, [pos]: null }));
            return;
        }
        if (deployedCount >= MAX_DEPLOY_COUNT || availableHeroes.length === 0) return;
        setParty(prev => ({ ...prev, [pos]: availableHeroes[0].id }));
    };

    const clearAll = () => {
        const empty: Record<string, null> = {};
        (Object.keys(POSITION_CONFIG) as PositionKey[]).forEach(k => { empty[k] = null; });
        setParty(empty as Record<PositionKey, string | null>);
    };

    const handleSavePreset = () => {
        const name = newPresetName.trim() || `自定义${presets.length + 1}`;
        const newPreset: SavedPreset = {
            id: `custom-${Date.now()}`,
            name,
            icon: '📋',
            positions: (Object.keys(POSITION_CONFIG) as PositionKey[]).map(k => party[k]) as (PositionKey | null)[],
        };
        const updated = [...presets.filter(p => !p.id.startsWith('custom-')), newPreset];
        setPresets(updated);
        savePresets(updated);
        setShowSaveInput(false);
        setNewPresetName('');
    };

    const handleDeletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        savePresets(updated);
    };

    const rows: PositionRow[] = ['front', 'middle', 'back'];
    const cols: PositionCol[] = ['left', 'center', 'right'];
    const canDeploy = deployedCount >= 1 && deployedCount <= MAX_DEPLOY_COUNT;

    return (
        <div className="max-w-2xl lg:max-w-4xl mx-auto h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
             {/* Header with back button integrated */}
             <div className="flex items-center justify-between mb-2 lg:mb-3 pt-1">
                 <div className="flex items-center gap-2 lg:gap-3">
                     <button onClick={onCancel} className="text-slate-400 hover:text-white flex items-center space-x-1 text-xs lg:text-sm transition-colors shrink-0">
                         <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> <span>返回</span>
                     </button>
                     <div className="h-4 lg:h-5 w-px bg-white/10"></div>
                     <Skull className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400 shrink-0" />
                     <div>
                         <h2 className="text-xs lg:text-base font-serif text-slate-200 leading-none">{mission?.name}</h2>
                         <p className="text-[9px] lg:text-[10px] text-slate-500 mt-0.5">布阵 · 最多 {MAX_DEPLOY_COUNT} 人</p>
                     </div>
                 </div>
                 <div className={cn(
                     "text-[10px] lg:text-[11px] font-mono px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-md border shrink-0",
                     canDeploy ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-600"
                 )}>
                     {deployedCount}/{MAX_DEPLOY_COUNT}
                 </div>
             </div>

             {/* Preset Bar */}
             <div className="flex gap-1 lg:gap-1.5 mb-2 lg:mb-3 items-center flex-wrap">
                 {presets.map(preset => (
                     <div key={preset.id} className="group relative flex items-center">
                         <button
                             onClick={() => applyPreset(preset)}
                             className={cn(
                                 "flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-2.5 py-1 lg:py-1.5 rounded-lg border text-[10px] lg:text-[11px] transition-all shrink-0",
                                 "border-white/10 bg-white/[0.03] hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-200 text-slate-400"
                             )}
                         >
                             <span className="text-xs lg:text-sm">{preset.icon}</span>
                             <span className="font-medium tracking-wide hidden sm:inline">{preset.name}</span>
                         </button>
                         {preset.id.startsWith('custom-') && (
                             <button
                                 onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                                 className="ml-[-6px] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all shrink-0"
                             >
                                 <Trash2 className="w-2.5 h-2.5" />
                             </button>
                         )}
                     </div>
                 ))}
                 
                 <div className="flex items-center gap-1 lg:gap-1.5 ml-auto shrink-0">
                 {!showSaveInput ? (
                     <button
                         onClick={() => setShowSaveInput(true)}
                         className={cn(
                             "flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-lg border text-[10px] lg:text-[11px] transition-all shrink-0",
                             deployedCount > 0 
                                 ? "border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/5"
                                 : "border-white/5 text-slate-700 cursor-not-allowed opacity-40"
                         )}
                     >
                         <Save className="w-2.5 h-2.5 lg:w-3 lg:h-3" /> <span className="hidden sm:inline">存阵</span>
                     </button>
                 ) : (
                     <div className="flex items-center gap-1 lg:gap-1.5 shrink-0 animate-in fade-in duration-150">
                         <input
                             type="text"
                             value={newPresetName}
                             onChange={e => setNewPresetName(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                             placeholder="阵型名称..."
                             autoFocus
                             className="w-20 lg:w-28 bg-black/40 border border-white/15 rounded-md px-1.5 lg:px-2 py-1 text-[10px] lg:text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 font-mono"
                         />
                         <button onClick={handleSavePreset} className="px-1.5 lg:px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] lg:text-[11px] hover:bg-cyan-500/30 transition-all">保存</button>
                         <button onClick={() => { setShowSaveInput(false); setNewPresetName(''); }} className="px-1 lg:px-1.5 py-1 rounded text-slate-500 hover:text-slate-300 text-[10px] lg:text-[11px]">取消</button>
                     </div>
                 )}

                 <button
                     onClick={clearAll}
                     className={cn(
                         "flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 py-1 lg:py-1.5 rounded-lg border text-[10px] lg:text-[11px] transition-all shrink-0",
                         deployedCount > 0 
                             ? "border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-300 hover:bg-red-500/5"
                             : "border-white/5 text-slate-700 cursor-not-allowed opacity-40"
                     )}
                     disabled={deployedCount === 0}
                 >
                     <X className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                 </button>
                 </div>
             </div>

             <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-4 min-h-0 overflow-y-auto custom-scrollbar">
                  {/* 3x3 Grid */}
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2 lg:p-4 relative overflow-hidden">
                       <div className="relative z-10 flex flex-col gap-1.5 lg:gap-2 h-full">
                           {rows.map(row => (
                               <div key={row} className="flex gap-1.5 lg:gap-2 flex-1 items-stretch">
                                   <div className="w-5 lg:w-8 flex items-center justify-center text-[8px] lg:text-[9px] font-mono text-slate-700 uppercase tracking-wider shrink-0 select-none">
                                       {row === 'front' ? '前' : row === 'middle' ? '中' : '后'}
                                   </div>
                                   {cols.map(col => {
                                       const pos: PositionKey = `${row}-${col}` as PositionKey;
                                       const cfg = POSITION_CONFIG[pos] || POSITION_CONFIG['front-center'];
                                       const heroId = party[pos];
                                       const hero = heroId ? heroes.find(h => h.id === heroId) : null;
                                       const tpl = hero ? HERO_TEMPLATES[hero.templateId] : null;

                                       return (
                                           <button
                                               key={pos}
                                               onClick={() => handleSlotClick(pos)}
                                               className={cn(
                                                   "relative flex-1 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center gap-0.5 min-h-[44px] sm:min-h-[52px] lg:min-h-[72px]",
                                                   heroId
                                                       ? "bg-cyan-500/8 border-cyan-500/25 hover:border-cyan-400 hover:bg-cyan-500/12 cursor-pointer group"
                                                       : availableHeroes.length > 0 && deployedCount < MAX_DEPLOY_COUNT
                                                           ? "border-dashed border-white/10 bg-white/[0.02] hover:border-orange-500/40 hover:bg-orange-500/5 cursor-pointer"
                                                           : "border-white/5 bg-transparent cursor-not-allowed opacity-35"
                                               )}
                                           >
                                               {heroId && hero && tpl ? (
                                                   <>
                                                       <HeroIcon icon={tpl.icon} name={tpl.name} className="text-xs lg:text-sm text-slate-200 leading-none" />
                                                       <span className={cn("text-[7px] lg:text-[8px] font-mono px-1 py-0.5 rounded", cfg.tagColor, "bg-black/40")}>{cfg.tag}</span>
                                                       {(hero.equipment.weapon || hero.equipment.armor) && (
                                                           <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                                       )}
                                                   </>
                                               ) : (
                                                   <>
                                                       <span className="text-xs lg:text-sm leading-none">{cfg.icon}</span>
                                                       <span className={cn("text-[7px] lg:text-[8px] font-mono", cfg.tagColor)}>{cfg.desc}</span>
                                                   </>
                                               )}
                                           </button>
                                       );
                                   })}
                               </div>
                           ))}
                       </div>
                  </div>

                  {/* Hero List - horizontal scroll on mobile, vertical list on desktop */}
                  <div className="w-full lg:w-48 xl:w-52 bg-black/40 border border-white/5 rounded-xl p-2 lg:p-3 flex flex-col shrink-0 overflow-hidden max-h-[25vh] lg:max-h-none">
                       <div className="text-[9px] uppercase tracking-widest font-bold text-slate-600 mb-1.5 lg:mb-2 flex items-center justify-between shrink-0">
                           <span>门客</span>
                           <span className="font-normal text-slate-700">{availableHeroes.length} 待选</span>
                       </div>

                       {/* Mobile: horizontal scrollable chips */}
                       <div className="lg:hidden flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-1.5 min-h-0">
                           {heroes.map(h => {
                               const t = HERO_TEMPLATES[h.templateId];
                               const isDeployed = deployedIds.has(h.id);
                               return (
                                   <div
                                       key={h.id}
                                       className={cn(
                                           "rounded-lg border p-1.5 flex items-center gap-1.5 shrink-0 transition-all h-fit",
                                           isDeployed
                                               ? "border-cyan-500/20 bg-cyan-500/5 opacity-50 w-16"
                                               : "border-white/5 bg-white/[0.02] w-[72px]"
                                       )}
                                   >
                                       <div className="w-6 h-6 rounded-md bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                           <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-[9px] text-slate-300" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                           <div className="font-serif font-bold text-[10px] text-slate-200 truncate leading-tight">{t.name}</div>
                                           <div className="text-[7px] font-mono text-slate-600 leading-tight">HP{h.hp}</div>
                                       </div>
                                       {isDeployed && (
                                           <span className="text-[8px] text-cyan-500 shrink-0">✓</span>
                                       )}
                                   </div>
                               );
                           })}
                       </div>

                       {/* Desktop: vertical scrollable list */}
                       <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
                           {heroes.map(h => {
                               const t = HERO_TEMPLATES[h.templateId];
                               const isDeployed = deployedIds.has(h.id);
                               return (
                                   <div
                                       key={h.id}
                                       className={cn(
                                           "rounded-lg border p-2 flex items-center gap-2 text-left transition-all",
                                           isDeployed
                                               ? "border-cyan-500/20 bg-cyan-500/5 opacity-50"
                                               : "border-white/5 bg-white/[0.02]"
                                       )}
                                   >
                                       <div className="w-7 h-7 rounded-md bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                           <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-[10px] text-slate-300" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                           <div className="font-serif font-bold text-[11px] text-slate-200 truncate leading-tight">{t.name}</div>
                                           <div className="text-[8px] font-mono text-slate-600">HP{h.hp} 兵{h.troops} 统{t.attributes.command}</div>
                                       </div>
                                       {isDeployed && (
                                           <span className="text-[8px] text-cyan-500 shrink-0">✓</span>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                  </div>
             </div>

             {/* Deploy Button */}
             <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-white/5 flex justify-between items-center">
                 <div className="text-[9px] lg:text-[11px] text-slate-600 hidden sm:block">
                     点击空格放置 · 点击已部署取下 · 布好阵后可存为预设
                 </div>
                 <button 
                     onClick={() => {
                         if (!canDeploy) return;
                         beginRun(missionId, party, generateFloor(1, missionId));
                         onDeploy?.();
                     }}
                     disabled={!canDeploy}
                     className={cn(
                         "px-4 lg:px-8 py-1.5 lg:py-2 border text-xs lg:text-sm font-bold tracking-widest transition-all flex items-center gap-1.5 lg:gap-2 ml-auto",
                         canDeploy 
                             ? "border-orange-500/50 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                             : "border-white/10 bg-white/5 text-slate-700 cursor-not-allowed"
                     )}
                 >
                     <Navigation className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                     出发
                 </button>
             </div>
        </div>
    );
}
