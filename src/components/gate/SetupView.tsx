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

const COLS: PositionCol[] = ['left', 'center', 'right'];

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
            if (heroId && idx < positionKeys.length) emptyParty[positionKeys[idx]] = heroId;
        });
        setParty(emptyParty);
    };

    const handleSlotClick = (pos: PositionKey) => {
        if (party[pos]) { setParty(prev => ({ ...prev, [pos]: null })); return; }
        if (deployedCount >= MAX_DEPLOY_COUNT || availableHeroes.length === 0) return;
        setParty(prev => ({ ...prev, [pos]: availableHeroes[0].id }));
    };

    const clearAll = () => {
        const empty: Record<string, null> = {};
        (Object.keys(POSITION_CONFIG) as PositionKey[]).forEach(k => { empty[k] = null; });
        setParty(empty as Record<PositionKey, string | null>);
    };

    const handleSavePreset = () => {
        const newPreset: SavedPreset = {
            id: `custom-${Date.now()}`,
            name: newPresetName.trim() || `自定义${presets.length + 1}`,
            icon: '📋',
            positions: (Object.keys(POSITION_CONFIG) as PositionKey[]).map(k => party[k]) as (PositionKey | null)[],
        };
        const updated = [...presets.filter(p => !p.id.startsWith('custom-')), newPreset];
        setPresets(updated); savePresets(updated);
        setShowSaveInput(false); setNewPresetName('');
    };

    const handleDeletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated); savePresets(updated);
    };

    const renderCell = (row: PositionRow, col: PositionCol) => {
        const pos = `${row}-${col}` as PositionKey;
        const cfg = POSITION_CONFIG[pos] || POSITION_CONFIG['front-center'];
        const heroId = party[pos];
        const hero = heroId ? heroes.find(h => h.id === heroId) : null;
        const tpl = hero ? HERO_TEMPLATES[hero.templateId] : null;
        return (
            <button key={pos} onClick={() => handleSlotClick(pos)} className={cn(
                "relative rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-0.5",
                "lg:aspect-square py-1.5 sm:py-2 lg:py-0",
                heroId
                    ? "bg-cyan-500/10 border-cyan-400/30 hover:border-cyan-400/60 cursor-pointer group"
                    : availableHeroes.length > 0 && deployedCount < MAX_DEPLOY_COUNT
                        ? "border-dashed border-white/12 bg-white/[0.02] hover:border-orange-500/40 cursor-pointer"
                        : "border-white/[0.04] bg-transparent cursor-not-allowed opacity-30"
            )}>
                {heroId && <div className="absolute inset-0 rounded-xl bg-cyan-400/[0.03] group-hover:bg-cyan-400/[0.06] transition-colors pointer-events-none" />}
                {heroId && hero && tpl ? (
                    <>
                        <HeroIcon icon={tpl.icon} name={tpl.name} className="text-base lg:text-lg text-slate-100 relative z-10" />
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 z-10", cfg.tagColor)}>{cfg.tag}</span>
                        {(hero.equipment.weapon || hero.equipment.armor) && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 z-10" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-base lg:text-lg opacity-50">{cfg.icon}</span>
                        <span className={cn("text-[9px] font-mono", cfg.tagColor, "opacity-40")}>{cfg.desc}</span>
                    </>
                )}
            </button>
        );
    };

    /* ── Layout: 3-section flex column ─
     *  ├─ Top:     Header + Presets  → shrink-0, fixed height
     *  ├─ Middle:  Grid + Hero List  → flex-1, fills remaining viewport space
     *  └─ Bottom:  Deploy Bar        → shrink-0, fixed height, always visible
     *  NO h-full — sits naturally in MainUI's scroll area (which has pb-24 for nav)
     */
    return (
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex flex-col animate-in slide-in-from-right-4 duration-300 gap-1.5 sm:gap-2">
            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button onClick={onCancel} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" /><span>返回</span>
                    </button>
                    <Skull className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                        <h2 className="text-sm font-serif text-slate-200 leading-tight">{mission?.name}</h2>
                        <p className="text-[9px] text-slate-600">布阵 · 最多{MAX_DEPLOY_COUNT}人</p>
                    </div>
                </div>
                <div className={cn(
                    "text-[11px] font-mono px-2 py-0.5 rounded border font-bold tabular-nums",
                    canDeploy ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-slate-600"
                )}>
                    {deployedCount}/{MAX_DEPLOY_COUNT}
                </div>
            </div>

            {/* ── Preset Bar ── */}
            <div className="shrink-0 flex gap-1 items-center flex-wrap px-1">
                {presets.map(preset => (
                    <div key={preset.id} className="group relative flex items-center">
                        <button onClick={() => applyPreset(preset)} className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all",
                            "border-white/10 bg-white/[0.03] hover:border-orange-500/30 text-slate-400"
                        )}>
                            <span className="text-xs">{preset.icon}</span><span>{preset.name}</span>
                        </button>
                        {preset.id.startsWith('custom-') && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                                className="ml-[-6px] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400">
                                <Trash2 className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                    {!showSaveInput ? (
                        <>
                            <button onClick={() => setShowSaveInput(true)} className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all",
                                deployedCount > 0 ? "border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5" : "border-white/8 text-slate-700 opacity-40"
                            )}><Save className="w-3 h-3" />存阵</button>
                            <button onClick={clearAll} disabled={deployedCount === 0} className={cn(
                                "flex items-center px-1.5 py-1 rounded-md border text-[11px] transition-all",
                                deployedCount > 0 ? "border-red-500/15 text-red-400/60 hover:bg-red-500/5" : "border-white/8 text-slate-700 opacity-40"
                            )}><X className="w-3 h-3" /></button>
                        </>
                    ) : (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSavePreset()} placeholder="名称..." autoFocus
                                className="w-24 bg-black/40 border border-white/15 rounded px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 font-mono" />
                            <button onClick={handleSavePreset} className="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-[11px] hover:bg-cyan-500/25">保存</button>
                            <button onClick={() => { setShowSaveInput(false); setNewPresetName(''); }} className="px-1.5 py-1 text-slate-500 hover:text-slate-300 text-[11px]">取消</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Grid + Hero List — flexible middle zone, stretches to fill viewport ── */}
            <div className="flex-1 min-h-[280px] sm:min-h-[360px] lg:min-h-[480px] flex flex-col lg:flex-row gap-1.5 sm:gap-2 px-1">
                {/* Grid */}
                <div className="flex-1 min-w-0 rounded-lg border border-white/[0.05] bg-gradient-to-b from-white/[0.02] to-transparent p-1.5 sm:p-2.5 lg:p-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/[0.03] via-transparent to-orange-900/[0.02] pointer-events-none rounded-lg" />
                    <div className="relative grid grid-cols-[auto_1fr_1fr_1fr] gap-1 sm:gap-1.5 lg:gap-2.5 items-stretch h-full">
                        {/* Row labels + cells — flat grid, no fragments */}
                        <div className="flex items-center justify-center text-[9px] font-mono text-slate-600 uppercase tracking-wider select-none font-bold">前</div>
                        {COLS.map(c => renderCell('front', c))}
                        <div className="flex items-center justify-center text-[9px] font-mono text-slate-600 uppercase tracking-wider select-none font-bold">中</div>
                        {COLS.map(c => renderCell('middle', c))}
                        <div className="flex items-center justify-center text-[9px] font-mono text-slate-600 uppercase tracking-wider select-none font-bold">后</div>
                        {COLS.map(c => renderCell('back', c))}
                    </div>
                </div>

                {/* Hero List */}
                <div className="w-full lg:w-48 rounded-lg border border-white/[0.05] bg-black/30 p-1.5 lg:p-2 flex flex-col shrink-0 lg:max-h-none">
                    <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1 flex items-center justify-between shrink-0 pb-1 border-b border-white/[0.04]">
                        <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-600" />门客</span>
                        <span className="font-normal normal-case">{availableHeroes.length}/{heroes.length}</span>
                    </div>
                    {/* Mobile: horizontal chips */}
                    <div className="lg:hidden flex gap-1.5 overflow-x-auto overflow-y-hidden min-h-0 pt-0.5">
                        {heroes.map(h => {
                            const t = HERO_TEMPLATES[h.templateId];
                            const d = deployedIds.has(h.id);
                            return (
                                <div key={h.id} className={cn(
                                    "rounded-lg border p-1.5 flex items-center gap-1.5 shrink-0 w-[68px]",
                                    d ? "border-cyan-500/15 bg-cyan-500/5 opacity-50" : "border-white/[0.05] bg-white/[0.02]"
                                )}>
                                    <div className="w-6 h-6 rounded bg-black/40 border border-white/[0.08] flex items-center justify-center shrink-0">
                                        <HeroIcon icon={t.icon} name={t.name} className="text-[10px] text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-serif font-bold text-[10px] text-slate-300 truncate leading-tight">{t.name}</div>
                                        <div className="text-[8px] font-mono text-slate-700">HP{h.hp}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Desktop: vertical list */}
                    <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-0.5 pt-1">
                        {heroes.map(h => {
                            const t = HERO_TEMPLATES[h.templateId];
                            const d = deployedIds.has(h.id);
                            return (
                                <div key={h.id} className={cn(
                                    "rounded-md border px-2 py-1.5 flex items-center gap-2 text-left transition-all",
                                    d ? "border-cyan-500/12 bg-cyan-500/5 opacity-50" : "border-white/[0.04] bg-white/[0.01]"
                                )}>
                                    <div className="w-7 h-7 rounded-md bg-black/40 border border-white/[0.08] flex items-center justify-center shrink-0">
                                        <HeroIcon icon={t.icon} name={t.name} className="text-[10px] text-slate-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-serif font-bold text-[10px] text-slate-300 truncate">{t.name}</div>
                                        <div className="text-[8px] font-mono text-slate-600 mt-0.5">HP{h.hp}·兵{h.troops}·统{t.attributes.command}</div>
                                    </div>
                                    {d && <span className="text-cyan-500 text-[9px] shrink-0">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Deploy Bar — STICKY FOOTER, always visible ── */}
            <div className="shrink-0 flex items-center gap-2 px-1 pt-1.5 border-t border-white/[0.06] bg-[#0d0f12]/80 backdrop-blur-sm">
                <div className="flex-1 flex items-center gap-1 min-w-0 overflow-x-auto">
                    {deployedCount > 0 ? Object.entries(party).filter(([, id]) => id).map(([pos, hid]) => {
                        const h = heroes.find(x => x.id === hid);
                        const t = h ? HERO_TEMPLATES[h.templateId] : null;
                        return (
                            <div key={pos} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/6 border border-cyan-500/12 shrink-0">
                                <HeroIcon icon={t?.icon||'?'} name={t?.name||''} className="text-[10px] text-slate-400" />
                                <span className="text-[9px] text-slate-500 truncate max-w-[44px]">{t?.name}</span>
                            </div>
                        );
                    }) : <span className="text-[10px] text-slate-700 italic">点击格子放置门客</span>}
                </div>
                <button onClick={() => { if (!canDeploy) return; beginRun(missionId, party, generateFloor(1, missionId)); onDeploy?.(); }}
                    disabled={!canDeploy} className={cn(
                        "shrink-0 px-4 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center gap-1.5",
                        canDeploy ? "bg-orange-500 text-white hover:bg-orange-400 shadow-[0_2px_10px_rgba(234,88,12,0.3)] active:scale-95"
                            : "bg-white/[0.04] text-slate-700"
                    )}>
                    <Navigation className="w-3.5 h-3.5" /> 出发
                </button>
            </div>
        </div>
    );
}
