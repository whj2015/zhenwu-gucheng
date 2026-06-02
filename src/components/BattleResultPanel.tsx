import { useState, useEffect, useRef } from 'react';
import { HERO_TEMPLATES } from '../data';
import { cn } from '../utils';
import { Sword, Shield, Skull, Trophy, ArrowDownLeft, ArrowUpRight, Users, ChevronLeft, Sparkles } from 'lucide-react';

interface BattleLogEntry {
    id: string;
    round: number;
    attacker: string;
    target: string;
    damage: number;
    isPlayer: boolean;
}

interface HeroBattleState {
    id: string;
    name: string;
    templateId: string;
    hpBefore: number;
    hpAfter: number;
    troopsBefore: number;
    troopsAfter: number;
    wounded: number;
    maxHp: number;
    damageDealt: number;
    damageTaken: number;
    isAlive: boolean;
}

interface EnemyBattleState {
    templateId: string;
    name: string;
    hpBefore: number;
    hpAfter: number;
    maxHp: number;
    damageTaken: number;
    isAlive: boolean;
}

interface RewardData {
    iron: number;
    meteorite: number;
    exp: number;
}

interface BattleResultData {
    victory: boolean;
    nodeType: 'battle' | 'boss';
    logs: BattleLogEntry[];
    heroStates: HeroBattleState[];
    enemyStates: EnemyBattleState[];
    rewards: RewardData;
    floorNumber: number;
}

const RE_ATTACK = /(.+)\[(.+?)\].*? 攻击 (.+)，造成 (\d+) 点伤害/;
const RE_MANUAL_ATTACK = /([\u4e00-\u9fa5]+)(?:率兵卒)?攻击 ([\u4e00-\u9fa5]+)，造成 (\d+) 点伤害(?:，击破！?)?/;
const RE_ENEMY_ATTACK = /^(.+) → (.+)\[(.+)\]\s*\| \-(\d+)HP/;
const RE_MANUAL_ENEMY_ATTACK = /([\u4e00-\u9fa5]+) 攻击 ([\u4e00-\u9fa5]+)，(?:兵卒抵挡\d+\(-?\d+人\)[，]?)?(?:本体受创(\d+)|(无伤))/;
const RE_SKILL_ATTACK = /([\u4e00-\u9fa5]+) 追击 ([\u4e00-\u9fa5]+)，造成 (\d+) 点伤害/;
const RE_SKILL_MANUAL = /[✨🌟]\s*(.+?) 施放【.+?】对 (.+?) 造成 (\d+) 点伤害/;
const RE_CLEAVE_ATTACK = /\[偃月溅射\] 对 (.+) 造成额外 (\d+) 点伤害/;
const RE_FALLBACK = /([\u4e00-\u9fa5]+)(?:率兵卒)?攻击 ([\u4e00-\u9fa5]+).*?(\d+)/;

const HERO_NAME_SET_CACHE = new WeakMap<object, Set<string>>();

function getHeroNameSet(heroes: any[]): Set<string> {
    if (!HERO_NAME_SET_CACHE.has(heroes)) {
        const names = new Set<string>();
        heroes.forEach(h => {
            const t = HERO_TEMPLATES[h.templateId];
            if (t) names.add(t.name);
        });
        HERO_NAME_SET_CACHE.set(heroes, names);
    }
    return HERO_NAME_SET_CACHE.get(heroes)!;
}

function parseBattleLogs(rawLogs: string[], heroes: any[], _enemies: any[]): BattleLogEntry[] {
    const entries: BattleLogEntry[] = [];
    let currentRound = 0;
    const heroNames = getHeroNameSet(heroes);

    console.log('[BattleResultPanel] === parseBattleLogs ===');
    console.log('[BattleResultPanel] heroNames:', [...heroNames]);
    console.log('[BattleResultPanel] rawLogs (%d lines):', rawLogs.length);

    rawLogs.forEach((log, idx) => {
        console.log(`[BattleResultPanel]   [${idx}] ${log.substring(0, 80)}`);

        if (log.includes('回合') || log.match(/^\d+:/)) {
            const roundMatch = log.match(/(\d+):/) || log.match(/第 (\d+) 回合/);
            if (roundMatch) currentRound = parseInt(roundMatch[1]);
            return;
        }

        const attackMatch = log.match(RE_ATTACK);
        if (attackMatch) {
            const [, attacker, _pos, target, dmgStr] = attackMatch;
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer: heroNames.has(attacker) });
            return;
        }

        const manualAttackMatch = log.match(RE_MANUAL_ATTACK);
        if (manualAttackMatch) {
            const [, attacker, target, dmgStr] = manualAttackMatch;
            const isPlayer = heroNames.has(attacker);
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer });
            console.log(`[BattleResultPanel]   => RE_MANUAL_ATTACK: ${attacker} -> ${target} (${dmgStr}), isPlayer=${isPlayer}`);
            return;
        }

        const skillAttackMatch = log.match(RE_SKILL_ATTACK);
        if (skillAttackMatch) {
            const [, attacker, target, dmgStr] = skillAttackMatch;
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer: heroNames.has(attacker) });
            return;
        }

        const skillManualMatch = log.match(RE_SKILL_MANUAL);
        if (skillManualMatch) {
            const [, attacker, target, dmgStr] = skillManualMatch;
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer: true });
            return;
        }

        const cleaveMatch = log.match(RE_CLEAVE_ATTACK);
        if (cleaveMatch) {
            const [, target, dmgStr] = cleaveMatch;
            entries.push({ id: `log-${idx}`, round: currentRound, attacker: '[偃月溅射]', target, damage: parseInt(dmgStr), isPlayer: true });
            return;
        }

        const enemyAttackMatch = log.match(RE_ENEMY_ATTACK);
        if (enemyAttackMatch) {
            const [, attacker, target, _pos, dmgStr] = enemyAttackMatch;
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer: false });
            return;
        }

        const manualEnemyAttackMatch = log.match(RE_MANUAL_ENEMY_ATTACK);
        if (manualEnemyAttackMatch) {
            const [, attacker, target, dmgStr] = manualEnemyAttackMatch;
            const isPlayer = heroNames.has(attacker);
            if (!isPlayer) {
                entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr || '0'), isPlayer: false });
            }
            return;
        }

        const fallbackMatch = log.match(RE_FALLBACK);
        if (fallbackMatch) {
            const [, attacker, target, dmgStr] = fallbackMatch;
            const isPlayer = heroNames.has(attacker);
            entries.push({ id: `log-${idx}`, round: currentRound, attacker, target, damage: parseInt(dmgStr), isPlayer });
            console.log(`[BattleResultPanel]   => FALLBACK: ${attacker} -> ${target} (${dmgStr}), isPlayer=${isPlayer}`);
            return;
        }
    });

    console.log('[BattleResultPanel] parsed entries:', entries.length);
    console.log('[BattleResultPanel] player entries:', entries.filter(e => e.isPlayer).length);
    console.log('[BattleResultPanel] enemy entries:', entries.filter(e => !e.isPlayer).length);
    return entries;
}

export default function BattleResultPanel({
    battleData,
    onConfirm,
    onRetreat
}: {
    battleData: BattleResultData;
    onConfirm: () => void;
    onRetreat: () => void;
}) {
    const [displayedLogs, setDisplayedLogs] = useState<BattleLogEntry[]>([]);
    const [logQueue, setLogQueue] = useState<BattleLogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLogQueue(battleData.logs);
    }, [battleData.logs]);

    useEffect(() => {
        if (logQueue.length > 0) {
            const timer = setTimeout(() => {
                const nextLog = logQueue[0];
                setDisplayedLogs(prev => [...prev, nextLog]);
                setLogQueue(prev => prev.slice(1));
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [logQueue]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayedLogs]);

    const totalDamageDealt = battleData.heroStates.reduce((sum, h) => sum + h.damageDealt, 0);
    const totalDamageTaken = battleData.heroStates.reduce((sum, h) => sum + h.damageTaken, 0);
    const totalTroopsLost = battleData.heroStates.reduce((sum, h) => sum + Math.max(0, h.troopsBefore - h.troopsAfter), 0);
    const totalWounded = battleData.heroStates.reduce((sum, h) => sum + (h.wounded || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-3 lg:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(30,41,59,0.4)_0%,transparent_70%)] pointer-events-none"></div>

            <div className={cn(
                "relative w-full max-w-5xl mx-auto bg-[#0d0f12]/95 border rounded-2xl shadow-2xl flex flex-col max-h-[95vh] lg:max-h-[90vh]",
                battleData.victory ? "border-cyan-500/30" : "border-red-500/30"
            )}>
                {battleData.victory && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none"></div>
                )}
                {!battleData.victory && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] pointer-events-none"></div>
                )}

                {/* Header - 固定高度 */}
                <div className={cn(
                    "relative border-b px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between shrink-0",
                    battleData.victory ? "bg-cyan-500/5 border-cyan-500/20" : "bg-red-500/5 border-red-500/20"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center",
                            battleData.victory ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-400"
                        )}>
                            {battleData.victory ? <Trophy className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className={cn("text-base lg:text-lg font-serif font-bold tracking-wide", 
                                battleData.victory ? "text-cyan-200" : "text-red-200"
                            )}>
                                {battleData.victory ? "战役胜利" : "战役失败"}
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">
                                {battleData.nodeType === 'boss' ? 'BOSS战' : '遭遇战'} · 第{battleData.floorNumber}阵
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={battleData.victory ? onConfirm : onRetreat}
                        className={cn(
                            "px-4 py-1.5 lg:px-6 lg:py-2 rounded-lg font-bold tracking-widest text-xs lg:text-sm transition-all shadow-lg shrink-0",
                            battleData.victory 
                                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                : "bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 flex items-center gap-1.5"
                        )}
                    >
                        {battleData.victory ? '确认' : (<><ChevronLeft className="w-3.5 h-3.5" />撤退</>)}
                    </button>
                </div>

                {/* Main Content - 弹性填充剩余空间 */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
                    {/* Left: Battle Log - 占据大部分空间 */}
                    <div className="flex-1 flex flex-col lg:border-r border-white/5 min-w-0">
                        <div className="px-4 lg:px-6 py-2 lg:py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
                            <Sword className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">战斗记录</span>
                            <span className="ml-auto text-[10px] font-mono text-slate-600">
                                {displayedLogs.length}/{battleData.logs.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-0.5 custom-scrollbar max-h-[35vh] lg:max-h-[calc(90vh-180px)]">
                            {displayedLogs.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={cn(
                                        "flex items-start gap-2 py-1 px-2.5 rounded-md text-[11px] font-mono animate-in fade-in slide-in-from-left-2 duration-300",
                                        entry.isPlayer ? "bg-cyan-500/5" : "bg-red-500/5"
                                    )}
                                >
                                    <span className="text-slate-600 shrink-0 w-5 text-[10px]">R{entry.round}</span>
                                    <span className={cn(
                                        "shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center mt-0.5",
                                        entry.isPlayer ? "bg-cyan-500/20 text-cyan-400" : "bg-red-500/20 text-red-400"
                                    )}>
                                        {entry.isPlayer ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownLeft className="w-2 h-2" />}
                                    </span>
                                    <span className={cn("flex-1 truncate", entry.isPlayer ? "text-slate-200" : "text-slate-300")}>
                                        <span className={cn("font-semibold", entry.isPlayer ? "text-cyan-300" : "text-red-300")}>{entry.attacker}</span>
                                        <span className="text-slate-500 mx-1">→</span>
                                        <span className="text-slate-400">{entry.target}</span>
                                    </span>
                                    <span className={cn(
                                        "font-bold tabular-nums shrink-0 px-1.5 py-0.5 rounded text-[10px]",
                                        entry.isPlayer ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        -{entry.damage}
                                    </span>
                                </div>
                            ))}
                            
                            {logQueue.length === 0 && displayedLogs.length === 0 && (
                                <div className="text-center text-slate-600 mt-8 italic text-sm animate-pulse">战斗回放中...</div>
                            )}
                            
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* Right: Result Summary - 固定宽度，独立滚动 */}
                    <div className="w-full lg:w-80 xl:w-96 flex flex-col overflow-y-auto custom-scrollbar shrink-0 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-white/5">
                        {/* Enemy Status */}
                        <div className="p-3 lg:p-4 border-b border-white/5 shrink-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                <Skull className="w-3 h-3 text-red-400" /> 敌方
                            </div>
                            <div className="space-y-1.5">
                                {battleData.enemyStates.map((enemy, idx) => (
                                    <div key={`${enemy.templateId}-${idx}`} className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={cn("font-serif font-bold text-xs", !enemy.isAlive && "line-through text-slate-600")}>
                                                {enemy.name}
                                            </span>
                                            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", 
                                                enemy.isAlive ? "bg-red-500/10 text-red-400" : "bg-slate-500/10 text-slate-500"
                                            )}>
                                                {enemy.isAlive ? "存活" : "击破"}
                                            </span>
                                        </div>
                                        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "absolute left-0 top-0 h-full rounded-full transition-all duration-1000",
                                                    enemy.isAlive ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-slate-700"
                                                )}
                                                style={{ width: `${enemy.isAlive ? Math.max(0, (enemy.hpAfter / enemy.maxHp) * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-0.5 text-[9px] font-mono text-slate-600">
                                            <span>HP {Math.max(0, enemy.hpAfter)}/{enemy.maxHp}</span>
                                            <span className="text-red-400">-{enemy.damageTaken}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hero Status */}
                        <div className="p-3 lg:p-4 border-b border-white/5 shrink-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-cyan-400" /> 我方战损
                            </div>
                            <div className="space-y-1.5">
                                {battleData.heroStates.map((hero) => {
                                    const hpPercent = (hero.hpAfter / hero.maxHp) * 100;
                                    const hpLost = hero.hpBefore - hero.hpAfter;
                                    const troopsLost = hero.troopsBefore - hero.troopsAfter;

                                    return (
                                        <div key={hero.id} className={cn(
                                            "bg-black/40 rounded-lg p-2.5 lg:p-3 border transition-all",
                                            hero.isAlive ? "border-white/5" : "border-red-500/20 bg-red-500/5"
                                        )}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={cn("font-serif font-bold text-xs", !hero.isAlive && "text-red-400")}>
                                                    {hero.name}
                                                    {!hero.isAlive && <span className="ml-1 text-[9px] font-mono text-red-500">阵亡</span>}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[9px] font-mono">
                                                    {troopsLost > 0 && (
                                                        <span className="text-orange-400 flex items-center gap-0.5">
                                                            <Users className="w-2.5 h-2.5" />-{troopsLost}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <div>
                                                    <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                                                        <span>血气</span>
                                                        <span>{hero.hpAfter}/{hero.maxHp} {hpLost > 0 && <span className="text-red-400">(-{hpLost})</span>}</span>
                                                    </div>
                                                    <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn(
                                                                "absolute left-0 top-0 h-full rounded-full transition-all duration-1000",
                                                                hpPercent > 50 ? "bg-emerald-500" : hpPercent > 20 ? "bg-amber-500" : "bg-red-500"
                                                            )}
                                                            style={{ width: `${Math.max(0, hpPercent)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {hero.troopsBefore > 0 && (
                                                    <div>
                                                        <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                                                            <span>兵卒</span>
                                                            <span>{hero.troopsAfter}/{hero.troopsBefore} {troopsLost > 0 && <span className="text-orange-400">(-{troopsLost})</span>}</span>
                                                        </div>
                                                        <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="absolute left-0 top-0 h-full bg-blue-400 rounded-full transition-all duration-1000"
                                                                style={{ width: `${hero.troopsBefore > 0 ? (hero.troopsAfter / hero.troopsBefore) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {hero.wounded > 0 && (
                                                    <div>
                                                        <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                                                            <span className="text-orange-400">伤兵</span>
                                                            <span className="text-orange-400">+{hero.wounded}</span>
                                                        </div>
                                                        <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="absolute left-0 top-0 h-full bg-orange-500/60 rounded-full transition-all duration-1000"
                                                                style={{ width: "100%" }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[9px] font-mono">
                                                <span className="text-cyan-400">+{hero.damageDealt}</span>
                                                <span className="text-red-400">-{hero.damageTaken}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Stats */}
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2 text-center">
                                    <div className="text-base font-bold font-mono text-cyan-400">{totalDamageDealt}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">总输出</div>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2 text-center">
                                    <div className="text-base font-bold font-mono text-red-400">{totalDamageTaken}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">总承伤</div>
                                </div>
                            </div>
                            {totalTroopsLost > 0 && (
                                <div className="mt-1.5 bg-orange-500/5 border border-orange-500/20 rounded-lg p-2 text-center">
                                    <div className="text-base font-bold font-mono text-orange-400">{totalTroopsLost}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">兵卒折损</div>
                                </div>
                            )}
                            {totalWounded > 0 && (
                                <div className="mt-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 text-center">
                                    <div className="text-base font-bold font-mono text-amber-400">{totalWounded}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">伤兵（可救治）</div>
                                </div>
                            )}
                        </div>

                        {/* Rewards */}
                        {battleData.victory && (
                            <div className="p-3 lg:p-4 shrink-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-emerald-400" /> 战利品
                                </div>
                                <div className="space-y-1.5">
                                    {(battleData.rewards.iron > 0 || battleData.rewards.meteorite > 0) && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5">
                                            {battleData.rewards.iron > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-300">铁锭</span>
                                                    <span className="font-mono font-bold text-emerald-400">+{battleData.rewards.iron}</span>
                                                </div>
                                            )}
                                            {battleData.rewards.meteorite > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-300">陨铁</span>
                                                    <span className="font-mono font-bold text-cyan-400">+{battleData.rewards.meteorite}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-300">经验值</span>
                                            <span className="font-mono font-bold text-amber-400">+{battleData.rewards.exp}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!battleData.victory && (
                            <div className="p-3 lg:p-4 shrink-0">
                                <p className="text-xs text-slate-500 leading-relaxed">实力不济，暂避锋芒。回营修整后再战。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function buildBattleResultData({
    victory,
    logs: rawLogs,
    remainingState,
    heroes: activeHeroes,
    enemies: enemyData,
    nodeType,
    floorNumber,
}: {
    victory: boolean;
    logs: string[];
    remainingState: { id: string; hp: number; troops: number; wounded: number }[];
    heroes: any[];
    enemies: any[];
    nodeType: 'battle' | 'boss';
    floorNumber: number;
}): BattleResultData {
    const parsedLogs = parseBattleLogs(rawLogs, activeHeroes, enemyData);

    const heroNameToId = new Map<string, string>();
    activeHeroes.forEach(h => {
        const t = HERO_TEMPLATES[h.templateId];
        if (t) heroNameToId.set(t.name, h.id);
    });

    const damageMap = new Map<string, { dealt: number; taken: number }>();
    parsedLogs.forEach(log => {
        if (!damageMap.has(log.attacker)) damageMap.set(log.attacker, { dealt: 0, taken: 0 });
        if (!damageMap.has(log.target)) damageMap.set(log.target, { dealt: 0, taken: 0 });
        const attackerStats = damageMap.get(log.attacker)!;
        const targetStats = damageMap.get(log.target)!;
        attackerStats.dealt += log.damage;
        targetStats.taken += log.damage;
    });

    const heroStates: HeroBattleState[] = activeHeroes.map(h => {
        const template = HERO_TEMPLATES[h.templateId];
        const after = remainingState.find(r => r.id === h.id);
        const dmg = damageMap.get(template?.name || '') || { dealt: 0, taken: 0 };

        return {
            id: h.id,
            name: template?.name || 'Unknown',
            templateId: h.templateId,
            hpBefore: h.hp,
            hpAfter: after?.hp ?? 0,
            troopsBefore: h.troops || 0,
            troopsAfter: after?.troops ?? 0,
            wounded: after?.wounded ?? 0,
            maxHp: (template?.attributes.physique || 10) * 10,
            damageDealt: dmg.dealt,
            damageTaken: dmg.taken,
            isAlive: (after?.hp ?? 0) > 0 || (after?.troops ?? 0) > 0,
        };
    });

    const enemyStates: EnemyBattleState[] = enemyData.map(e => {
        const dmg = damageMap.get(e.name) || { dealt: 0, taken: 0 };
        const actualHpAfter = Math.max(0, e.hp - dmg.taken);

        return {
            templateId: e.id || e.name,
            name: e.name,
            hpBefore: e.hp,
            hpAfter: victory ? 0 : actualHpAfter,
            maxHp: e.hp,
            damageTaken: dmg.taken,
            isAlive: victory ? false : actualHpAfter > 0,
        };
    });

    const rewardIron = (nodeType === 'boss' ? 50 : 20) * floorNumber;
    const rewardMet = nodeType === 'boss' ? 10 * floorNumber : 0;

    return {
        victory,
        nodeType,
        logs: parsedLogs,
        heroStates,
        enemyStates,
        rewards: {
            iron: victory ? rewardIron : 0,
            meteorite: victory ? rewardMet : 0,
            exp: victory ? activeHeroes.length * 50 : activeHeroes.length * 10,
        },
        floorNumber,
    };
}
