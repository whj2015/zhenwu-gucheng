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

const ROWS: PositionRow[] = ['front', 'middle', 'back'];
const COLS: PositionCol[] = ['left', 'center', 'right'];
const ROW_LABELS: Record<PositionRow, string> = { front: '前', middle: '中', back: '后' };

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
    const canDeploy = deployedCount >= 1 && deployedCount <= MAX_DEPLOY_COUNT;

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

    const renderGridCell = (row: PositionRow, col: PositionCol) => {
        const pos = `${row}-${col}` as PositionKey;
        const cfg = POSITION_CONFIG[pos] || POSITION_CONFIG['front-center'];
        const heroId = party[pos];
        const hero = heroId ? heroes.find(h => h.id === heroId) : null;
        const tpl = hero ? HERO_TEMPLATES[hero.templateId] : null;
        return (
            <button key={pos} onClick={() => handleSlotClick(pos)} className={cn(
                "relative rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-0.5 lg:gap-1 py-2 sm:py-3 lg:aspect-square lg:py-0",
                heroId
                    ? "bg-cyan-500/10 border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-500/15 cursor-pointer group"
                    : availableHeroes.length > 0 && deployedCount < MAX_DEPLOY_COUNT
                        ? "border-dashed border-white/12 bg-white/[0.02] hover:border-orange-500/40 hover:bg-orange-500/6 cursor-pointer"
                        : "border-white/[0.04] bg-transparent cursor-not-allowed opacity-30"
            )}>
                {heroId && <div className="absolute inset-0 rounded-xl bg-cyan-400/[0.03] group-hover:bg-cyan-400/[0.06] transition-colors pointer-events-none" />}
                {heroId && hero && tpl ? (
                    <>
                        <HeroIcon icon={tpl.icon} name={tpl.name} className="text-base lg:text-lg text-slate-100 leading-none relative z-10" />
                        <span className={cn("text-[9px] lg:text-[10px] font-mono px-1.5 py-0.5 rounded-md", cfg.tagColor, "bg-black/50 z-10")}>{cfg.tag}</span>
                        {(hero.equipment.weapon || hero.equipment.armor) && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.5)] z-10" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-base lg:text-lg leading-none opacity-60">{cfg.icon}</span>
                        <span className={cn("text-[9px] lg:text-[10px] font-mono", cfg.tagColor, "opacity-50")}>{cfg.desc}</span>
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col animate-in slide-in-from-right-4 duration-300 gap-2 sm:gap-3 px-1">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 lg:gap-3">
                    <button onClick={onCancel} className="text-slate-400 hover:text-white flex items-center space-x-1 text-xs lg:text-sm transition-colors shrink-0">
                        <ChevronLeft className="w-4 h-4" /> <span>返回</span>
                    </button>
                    <div className="h-5 w-px bg-white/10"></div>
                    <Skull className="w-5 h-5 text-orange-400 shrink-0" />
                    <div>
                        <h2 className="text-sm lg:text-base font-serif text-slate-200 leading-none">{mission?.name}</h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">布阵 · 最多 {MAX_DEPLOY_COUNT} 人</p>
                    </div>
                </div>
                <div className={cn(
                    "text-xs font-mono px-3 py-1 rounded-lg border font-bold shrink-0",
                    canDeploy ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-600"
                )}>
                    {deployedCount}/{MAX_DEPLOY_COUNT}
                </div>
            </div>

            {/* Preset Bar */}
            <div className="flex gap-1.5 items-center flex-wrap shrink-0">
                {presets.map(preset => (
                    <div key={preset.id} className="group relative flex items-center">
                        <button onClick={() => applyPreset(preset)} className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all shrink-0",
                            "border-white/10 bg-white/[0.04] hover:border-orange-500/40 hover:bg-orange-500/8 hover:text-orange-200 text-slate-400"
                        )}>
                            <span>{preset.icon}</span>
                            <span className="font-medium tracking-wide">{preset.name}</span>
                        </button>
                        {preset.id.startsWith('custom-') && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                                className="ml-[-6px] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all shrink-0">
                                <Trash2 className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                ))}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {!showSaveInput ? (
                        <>
                            <button onClick={() => setShowSaveInput(true)} className={cn(
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all shrink-0",
                                deployedCount > 0 ? "border-cyan-500/25 text-cyan-400 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/8"
                                    : "border-white/8 text-slate-700 cursor-not-allowed opacity-40"
                            )}>
                                <Save className="w-3.5 h-3.5" /> 存阵
                            </button>
                            <button onClick={clearAll} disabled={deployedCount === 0} className={cn(
                                "flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-all shrink-0",
                                deployedCount > 0 ? "border-red-500/20 text-red-400/70 hover:border-red-500/40 hover:text-red-300 hover:bg-red-500/5"
                                    : "border-white/8 text-slate-700 cursor-not-allowed opacity-40"
                            )}>
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in duration-150">
                            <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSavePreset()} placeholder="阵型名称..." autoFocus
                                className="w-28 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 font-mono" />
                            <button onClick={handleSavePreset} className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-500/30 transition-all">保存</button>
                            <button onClick={() => { setShowSaveInput(false); setNewPresetName(''); }} className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 text-xs">取消</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Grid + Hero List */}
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4">
                {/* 3x3 Grid */}
                <div className="flex-1 rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-2 sm:p-3 lg:p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/[0.04] via-transparent to-orange-900/[0.03] pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-[auto_1fr_1fr_1fr] gap-1.5 sm:gap-2 lg:gap-3 items-center">
                        <div className="flex items-center justify-center text-[10px] lg:text-xs font-mono text-slate-600 uppercase tracking-widest select-none font-bold">{ROW_LABELS.front}</div>
                        {COLS.map(col => renderGridCell('front', col))}
                        <div className="flex items-center justify-center text-[10px] lg:text-xs font-mono text-slate-600 uppercase tracking-widest select-none font-bold">{ROW_LABELS.middle}</div>
                        {COLS.map(col => renderGridCell('middle', col))}
                        <div className="flex items-center justify-center text-[10px] lg:text-xs font-mono text-slate-600 uppercase tracking-widest select-none font-bold">{ROW_LABELS.back}</div>
                        {COLS.map(col => renderGridCell('back', col))}
                    </div>
                </div>

                {/* Hero List */}
                <div className="w-full lg:w-52 xl:w-56 rounded-xl border border-white/[0.06] bg-black/30 p-2 lg:p-3 flex flex-col shrink-0">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1.5 lg:mb-2 flex items-center justify-between shrink-0 pb-1.5 lg:pb-2 border-b border-white/[0.04]">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />门客</span>
                        <span className="font-normal text-slate-600 normal-case tracking-normal tabular-nums">{availableHeroes.length}/{heroes.length}</span>
                    </div>
                    {/* Mobile: horizontal scroll */}
                    <div className="lg:hidden flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-1.5 min-h-0">
                        {heroes.map(h => {
                            const t = HERO_TEMPLATES[h.templateId];
                            const isDeployed = deployedIds.has(h.id);
                            return (
                                <div key={h.id} className={cn(
                                    "rounded-lg border p-1.5 flex items-center gap-1.5 shrink-0 transition-all h-fit min-w-[72px]",
                                    isDeployed ? "border-cyan-500/20 bg-cyan-500/8 opacity-50" : "border-white/[0.06] bg-white/[0.02]"
                                )}>
                                    <div className="w-7 h-7 rounded-md bg-black/50 border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                                        <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-[10px] text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-serif font-bold text-[10px] text-slate-200 truncate leading-tight">{t.name}</div>
                                        <div className="text-[8px] font-mono text-slate-600 leading-tight">HP{h.hp}</div>
                                    </div>
                                    {isDeployed && <span className="text-cyan-500 shrink-0 text-[9px]">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                    {/* Desktop: vertical list */}
                    <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 pt-1">
                        {heroes.map(h => {
                            const t = HERO_TEMPLATES[h.templateId];
                            const isDeployed = deployedIds.has(h.id);
                            return (
                                <div key={h.id} className={cn(
                                    "rounded-lg border px-2.5 py-2 flex items-center gap-2.5 text-left transition-all",
                                    isDeployed ? "border-cyan-500/15 bg-cyan-500/6 opacity-50" : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08]"
                                )}>
                                    <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                                        <HeroIcon icon={t.icon} name={t.name} className="w-full h-full flex items-center justify-center text-[11px] text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-serif font-bold text-[11px] text-slate-200 truncate leading-tight">{t.name}</div>
                                        <div className="text-[9px] font-mono text-slate-600 mt-0.5">HP{h.hp} · 兵{h.troops} · 统{t.attributes.command}</div>
                                    </div>
                                    {isDeployed && <span className="text-cyan-500 shrink-0 text-[10px]">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Deploy Bar */}
            <div className="flex items-center gap-2 shrink-0 pt-2 border-t border-white/[0.06]">
                <div className="flex-1 flex items-center gap-1 min-w-0 overflow-x-auto">
                    {deployedCount > 0 ? (
                        Object.entries(party).filter(([, id]) => id).map(([pos, heroId]) => {
                            const hero = heroes.find(h => h.id === heroId);
                            const tpl = hero ? HERO_TEMPLATES[hero.templateId] : null;
                            return (
                                <div key={pos} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/8 border border-cyan-500/15 shrink-0">
                                    <HeroIcon icon={tpl?.icon || '?'} name={tpl?.name || ''} className="text-[10px] text-slate-300" />
                                    <span className="text-[9px] font-serif text-slate-400 truncate max-w-[50px]">{tpl?.name}</span>
                                </div>
                            );
                        })
                    ) : (
                        <span className="text-[10px] text-slate-600 italic">点击空格放置门客</span>
                    )}
                </div>
                <button onClick={() => { if (!canDeploy) return; beginRun(missionId, party, generateFloor(1, missionId)); onDeploy?.(); }}
                    disabled={!canDeploy} className={cn(
                        "shrink-0 px-4 py-1.5 rounded-lg font-bold text-sm tracking-wider transition-all flex items-center gap-1.5",
                        canDeploy ? "bg-orange-500/90 hover:bg-orange-500 text-white shadow-[0_2px_12px_rgba(234,88,12,0.25)] active:scale-[0.97]"
                            : "bg-white/[0.04] text-slate-600 cursor-not-allowed"
                    )}>
                    <Navigation className="w-3.5 h-3.5" />
                    出发
                </button>
            </div>
        </div>
    );
}