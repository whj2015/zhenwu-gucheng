/* Extracted from GatePanel.tsx - MapExploreView - Fog of War Edition */
import React, { useState, useCallback, useRef } from 'react';
import { useGameStore } from '../../store';
import { simulateBattle } from '../../engine/ruins';
import { HERO_TEMPLATES, ENEMY_TEMPLATES, POSITION_CONFIG } from '../../data';
import { RuinsNode, PositionKey } from '../../types';
import { cn } from '../../utils';
import BattleResultPanel, { buildBattleResultData } from '../BattleResultPanel';
import HeroAvatarCompact from './HeroAvatarCompact';

type HeroTrait = 'assault' | 'flank' | 'tank' | 'support' | 'ranged';

const TRAIT_COLORS: Record<HeroTrait, { dot: string; label: string }> = {
    assault: { dot: 'bg-red-400', label: '突' },
    flank:   { dot: 'bg-cyan-400', label: '侧' },
    tank:    { dot: 'bg-blue-400', label: '坦' },
    support: { dot: 'bg-emerald-400', label: '辅' },
    ranged:  { dot: 'bg-violet-400', label: '远' },
};

const ROWS: Array<'front' | 'middle' | 'back'> = ['front', 'middle', 'back'];
const COLS = ['left', 'center', 'right'] as const;

type GridPos = number;
type CellState = 'fog' | 'empty' | 'ready' | 'done';

const CELL_SIZE = "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16";
const GAP = "gap-1.5 sm:gap-2";

function getNeighbors(pos: GridPos): GridPos[] {
    const row = Math.floor(pos / 3);
    const col = pos % 3;
    const out: GridPos[] = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) out.push(nr * 3 + nc);
        }
    }
    return out;
}

function isRowAccessible(pos: GridPos, states: CellState[]): boolean {
    const row = Math.floor(pos / 3);
    if (row === 0) return true;
    for (let r = 0; r < row; r++) {
        const hasOpen = states.slice(r * 3, r * 3 + 3).some(s => s !== 'fog');
        if (!hasOpen) return false;
    }
    return true;
}

function distributeNodesToGrid(nodes: RuinsNode[]): (RuinsNode | null)[] {
    const grid: (RuinsNode | null)[] = Array(9).fill(null);
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    let idx = 0;
    for (const node of shuffled) {
        if (node.type === 'boss') { grid[8] = node; continue; }
        while (idx < 9 && grid[idx] !== null) idx++;
        if (idx >= 9) break;
        grid[idx] = node;
        idx++;
    }
    return grid;
}

interface MapData {
    grid: (RuinsNode | null)[];
    initialStates: CellState[];
}

function buildMapData(nodes: RuinsNode[]): MapData {
    const grid = distributeNodesToGrid(nodes);

    const states: CellState[] = Array(9).fill('fog');

    const start = Math.floor(Math.random() * 9);
    states[start] = grid[start] !== null ? 'ready' : 'empty';

    return { grid, initialStates: states };
}

function CellBase({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 select-none",
            className
        )}>{children}</div>
    );
}

function PartyCell({ heroId, position }: { heroId: string | null; position: PositionKey }) {
    if (!heroId) {
        const pc = POSITION_CONFIG[position] || POSITION_CONFIG['front-center'];
        return <CellBase className="border-white/[0.06] bg-white/[0.015]"><span className="text-[8px] sm:text-[9px] font-mono text-slate-700">{pc.name}</span></CellBase>;
    }

    const hero = useGameStore(s => s.heroes.find(h => h.id === heroId));
    if (!hero) return <CellBase className="border-white/[0.06] bg-white/[0.015]"><span className="text-sm text-slate-700">?</span></CellBase>;

    const t = HERO_TEMPLATES[hero.templateId];
    if (!t) {
        return (
            <CellBase className="border-cyan-500/20 bg-cyan-950/20">
                <span className="text-xs font-serif text-cyan-300">{hero.templateId[0]}</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                    <div className={cn("h-full", hero.hp > 30 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${Math.min(100, Math.max(0, Math.floor(hero.hp / (hero.hp > 0 ? 20 : 1))))}%` }} />
                </div>
            </CellBase>
        );
    }

    const maxHp = t.attributes.physique * 10;
    const hpRatio = Math.max(0, Math.min(1, hero.hp / maxHp));
    const hpColor = hpRatio > 0.6 ? 'bg-emerald-500' : hpRatio > 0.3 ? 'bg-amber-500' : 'bg-red-500';
    const trait = t.trait as HeroTrait | undefined;
    const tc = trait ? TRAIT_COLORS[trait] : null;

    return (
        <CellBase className={cn("border-white/10 bg-black/40 hover:border-cyan-500/40 hover:bg-black/55 cursor-default", hero.hp <= 0 && "opacity-35")}>
            {tc && <div className={cn("absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full", tc.dot)} title={TRAIT_COLORS[trait].label} />}
            <span className="text-sm sm:text-base font-serif font-bold text-slate-200 leading-none">{t.name[0] || '?'}</span>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div className={cn("h-full transition-all duration-300", hpColor)} style={{ width: `${hpRatio * 100}%` }} />
            </div>
        </CellBase>
    );
}

function FogCell() {
    return (
        <div className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border border-white/[0.08] bg-white/[0.04]",
            "flex flex-col items-center justify-center cursor-default transition-all duration-200"
        )}>
            <span className="text-base sm:text-lg font-bold text-white/25 select-none">?</span>
        </div>
    );
}

function EmptyCell({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border border-dashed border-white/[0.08] bg-white/[0.012]",
            "flex flex-col items-center justify-center cursor-pointer hover:border-white/18 hover:bg-white/[0.03] transition-all duration-200"
        )}>
            <span className="text-[10px] text-white/[0.06]">·</span>
        </button>
    );
}

function DoneCell({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border border-emerald-500/15 bg-emerald-950/10",
            "flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/30 transition-all duration-200"
        )}>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        </button>
    );
}

function LockedCell() {
    return (
        <div className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border border-white/[0.04] bg-black/20",
            "flex flex-col items-center justify-center cursor-not-allowed opacity-40 transition-all duration-200"
        )}>
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
    );
}

function getNodeInfo(node: RuinsNode) {
    if (node.type === 'camp') return { name: '营地', icon: '🏕️', desc: '扎营修整，恢复血气', color: 'text-emerald-400' };
    if (node.type === 'armory') {
        const r = (node as any).rewardOptions?.[0];
        return { name: '武备库', icon: '📦', desc: r ? `可获得 ${r.type==='iron'?'铁锭':'陨铁'}x${r.amount}` : '', color: 'text-violet-400' };
    }
    if ((node.type === 'battle' || node.type === 'boss') && (node as any).enemies) {
        const names = (node as any).enemies.map((eId: string) => ENEMY_TEMPLATES[eId]?.name || eId);
        return { name: node.type === 'boss' ? 'BOSS' : '遭遇战', icon: node.type === 'boss' ? '💀' : '⚔️', desc: names.join('、'), color: node.type === 'boss' ? 'text-red-400' : 'text-orange-400' };
    }
    return { name: '', icon: '', desc: '', color: '' };
}

const TYPE_STYLES: Record<string, { normal: string; hover: string }> = {
    battle:  { normal: 'border-orange-500/30 bg-orange-950/15', hover: 'border-orange-400/60 bg-orange-950/25 shadow-[0_0_12px_rgba(249,115,22,0.08)]' },
    boss:    { normal: 'border-red-500/30 bg-red-950/20',     hover: 'border-red-400/60 bg-red-950/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]' },
    camp:    { normal: 'border-emerald-500/25 bg-emerald-950/10', hover: 'border-emerald-400/50 bg-emerald-950/18' },
    armory:  { normal: 'border-violet-500/25 bg-violet-950/10',   hover: 'border-violet-400/50 bg-violet-950/18' },
};

function ReadyCell({ node, onClick, isHovered, onHover, onLeave }: {
    node: RuinsNode; onClick: () => void;
    isHovered: boolean; onHover: () => void; onLeave: () => void;
}) {
    const info = getNodeInfo(node);
    const st = TYPE_STYLES[node.type] || { normal: 'border-white/10 bg-white/[0.03]', hover: '' };

    return (
        <button type="button" onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick} className={cn(
            CELL_SIZE,
            "rounded-lg sm:rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 cursor-pointer",
            st.normal,
            isHovered ? cn(st.hover, "scale-110 z-10") : ("hover:" + st.hover)
        )}>
            <span className="text-base sm:text-lg leading-none mb-0.5">{info.icon}</span>
            {(node.type === 'battle' || node.type === 'boss') && (node as any).enemies && (
                <span className="text-[8px] font-mono text-slate-500 leading-none">x{(node as any).enemies.length}</span>
            )}
            {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
                    <div className={cn("font-serif text-xs font-bold mb-0.5", info.color)}>{info.name}</div>
                    <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{info.desc}</div>
                    <div className="mt-1 text-[9px] font-mono text-cyan-400/80">点击进入</div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/95 border-r border-b border-white/10"></div>
                </div>
            )}
        </button>
    );
}

export default function MapExploreView({ onBattleComplete }: { onBattleComplete: (data: ReturnType<typeof buildBattleResultData>, node: RuinsNode) => void }) {
    const { ruinsRun, updateRun, heroes, addResources, healParty } = useGameStore();
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    const gridRef = useRef<(RuinsNode | null)[] | null>(null);
    const [cellStates, setCellStates] = useState<CellState[]>(Array(9).fill('fog'));
    const [ready, setReady] = useState(false);

    const spreadFrom = useCallback((pos: GridPos) => {
        const eg = gridRef.current;
        if (!eg) return;
        setCellStates(prev => {
            const next = [...prev];
            for (const n of getNeighbors(pos)) {
                if (next[n] === 'fog') {
                    next[n] = eg[n] !== null ? 'ready' : 'empty';
                }
            }
            return next;
        });
    }, []);

    const handleReadyNodeAction = useCallback((pos: GridPos, node: RuinsNode) => {
        const rr = useGameStore.getState().ruinsRun;
        if (!rr) return;

        if (node.type === 'camp') {
            healParty(0.2);
        } else if (node.type === 'armory') {
            const r = (node as any).rewardOptions?.[0];
            if (r) addResources({ [r.type]: r.amount });
        } else if (node.type === 'battle' || node.type === 'boss') {
            const activeHeros = Object.values(rr.party)
                .filter((hId): hId is string => hId !== null)
                .map(hId => heroes.find(x => x.id === hId)!)
                .filter(Boolean);
            const enemyIds = (node as any).enemies as string[];
            const enemyData = enemyIds.map((eId: string) => ({ ...ENEMY_TEMPLATES[eId], id: eId }));
            const res = simulateBattle(activeHeros, enemyData, HERO_TEMPLATES, rr.party);
            useGameStore.getState().applyCombatResults(res.remainingState, res.victory);
            const battleResultData = buildBattleResultData({
                victory: res.victory, logs: res.logs, remainingState: res.remainingState,
                heroes: activeHeros, enemies: enemyData, nodeType: node.type as 'battle' | 'boss',
                floorNumber: rr.currentFloor,
            });
            onBattleComplete(battleResultData, node);
        }

        const parts = node.id.split('-');
        if (parts.length >= 3) {
            const row = parseInt(parts[1].replace('r',''));
            const nextRow = row + 1;
            const updatedNodes = rr.nodes.map(n => {
                if (n.id === node.id) return { ...n, completed: true };
                if (n.id.includes(`r${nextRow}-`) || (row === 1 && n.type === 'boss')) return { ...n, revealed: true };
                return n;
            });
            updateRun({ nodes: updatedNodes });
        }

        const eg = gridRef.current;
        setCellStates(prev => {
            if (!eg) return prev;
            const next = [...prev];
            next[pos] = 'done';
            for (const n of getNeighbors(pos)) {
                if (next[n] === 'fog') next[n] = eg[n] !== null ? 'ready' : 'empty';
            }
            return next;
        });
    }, [heroes, addResources, healParty, updateRun, onBattleComplete]);

    const handleCellClick = useCallback((pos: GridPos) => {
        const state = cellStates[pos];
        if (state === 'fog') return;
        if (!isRowAccessible(pos, cellStates)) return;
        if (state === 'ready') {
            const node = gridRef.current?.[pos];
            if (node) handleReadyNodeAction(pos, node);
            return;
        }
        if (state === 'empty' || state === 'done') {
            spreadFrom(pos);
        }
    }, [cellStates, handleReadyNodeAction, spreadFrom]);

    const renderEnemyCell = useCallback((pos: GridPos): React.ReactNode => {
        const state = cellStates[pos];
        const node = gridRef.current?.[pos] ?? null;

        if (state !== 'fog' && !isRowAccessible(pos, cellStates)) {
            return <React.Fragment key={pos}><LockedCell /></React.Fragment>;
        }

        switch (state) {
            case 'fog':
                return <React.Fragment key={pos}><FogCell /></React.Fragment>;
            case 'empty':
                return <React.Fragment key={pos}><EmptyCell onClick={() => handleCellClick(pos)} /></React.Fragment>;
            case 'done':
                return <React.Fragment key={pos}><DoneCell onClick={() => handleCellClick(pos)} /></React.Fragment>;
            case 'ready':
                return <React.Fragment key={pos}>{node ? (
                    <ReadyCell node={node} onClick={() => handleCellClick(pos)}
                        isHovered={hoveredNodeId === node.id}
                        onHover={() => setHoveredNodeId(node.id)}
                        onLeave={() => setHoveredNodeId(null)}
                    />
                ) : <EmptyCell onClick={() => handleCellClick(pos)} />}</React.Fragment>;
            default:
                return <React.Fragment key={pos}><EmptyCell onClick={() => handleCellClick(pos)} /></React.Fragment>;
        }
    }, [cellStates, hoveredNodeId, handleCellClick]);

    if (!ruinsRun) return null;

    if (gridRef.current === null && !ready) {
        const mapData = buildMapData(ruinsRun.nodes);
        gridRef.current = mapData.grid;
        setCellStates(mapData.initialStates);
        setReady(true);
    }

    if (!ready || gridRef.current === null) return null;

    const completedCount = ruinsRun.nodes.filter(n => n.completed).length;
    const totalCount = ruinsRun.nodes.length;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-500 relative">

            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-slate-200 tracking-widest">第 {ruinsRun.currentFloor} 阵</h3>
                    <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded border border-white/5">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <div className="hidden sm:flex flex-wrap gap-2 sm:gap-3 lg:gap-4 text-[9px] lg:text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500/50"></span>可探索</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>营地</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/50"></span>宝箱</span>
                    <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/50"></span>BOSS</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-10 py-2 sm:py-4 min-h-0">

                <div className="flex flex-col items-center">
                    <div className="text-[9px] sm:text-[10px] font-mono text-cyan-500/60 tracking-widest uppercase mb-2">我方阵型</div>
                    <div className={cn("grid grid-cols-3", GAP)}>
                        {ROWS.map(row => COLS.map(col => {
                            const posKey = `${row}-${col}` as PositionKey;
                            return <React.Fragment key={posKey}><PartyCell heroId={ruinsRun.party[posKey]} position={posKey} /></React.Fragment>;
                        }))}
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-center px-2">
                    <div className="text-lg font-serif text-slate-600/60">⚔</div>
                    <div className="text-[10px] font-serif text-slate-600 tracking-widest mt-0.5">VS</div>
                    <div className="w-px h-10 mt-1 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                </div>

                <div className="lg:hidden flex items-center gap-2 py-2 w-full max-w-[280px] mx-auto">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                    <span className="text-[10px] font-serif text-slate-600 tracking-widest">⚔ VS ⚔</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-[9px] sm:text-[10px] font-mono text-red-500/60 tracking-widest uppercase mb-2">敌方阵地</div>
                    <div className={cn("grid grid-cols-3", GAP)}>
                        {Array.from({ length: 9 }, (_, pos) => renderEnemyCell(pos))}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-3 sm:pt-4 border-t border-white/5 bg-black/30 rounded-xl p-2.5 sm:p-3 lg:p-4 backdrop-blur-sm">
                <div className="grid grid-cols-3 sm:flex justify-center items-start gap-x-4 sm:gap-2 lg:gap-2 gap-y-1 sm:gap-y-0">
                    {(['front-left','front-center','front-right','middle-left','middle-center','middle-right','back-left','back-center','back-right'] as PositionKey[]).map(pos => {
                        const hId = ruinsRun.party[pos];
                        return (
                            <div key={pos} className="flex flex-col items-center gap-0.5 sm:gap-1">
                                <HeroAvatarCompact heroId={hId} />
                                {!hId && <span className="text-[7px] sm:text-[8px] font-mono text-slate-700">{(POSITION_CONFIG[pos] || POSITION_CONFIG['front-center']).name}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
