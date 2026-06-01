import { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import {
    AchievementCategory,
    AchievementTier,
    TIER_COLORS,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
    type Achievement
} from '../data/achievements';
import { calculateAchievementProgress, getAllAchievements, getAchievementsByCategory } from '../utils/achievementEngine';
import { cn } from '../utils';
import { Trophy, Lock, CheckCircle2, Star, X, Gift, ChevronRight } from 'lucide-react';

interface AchievementPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES: (AchievementCategory | 'all')[] = [
    'all', 'battle', 'collection', 'challenge', 'growth', 'economy'
];

function TierBadge({ tier }: { tier: AchievementTier }) {
    return (
        <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
                color: TIER_COLORS[tier],
                backgroundColor: `${TIER_COLORS[tier]}15`,
                border: `1px solid ${TIER_COLORS[tier]}30`
            }}
        >
            {tier === 'bronze' && '青铜'}
            {tier === 'silver' && '白银'}
            {tier === 'gold' && '黄金'}
            {tier === 'diamond' && '钻石'}
        </span>
    );
}

function RewardList({ rewards }: { rewards: Achievement['rewards'] }) {
    const items = Object.entries(rewards)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
            key,
            value: value as number,
            label: {
                bingxiang: '兵饷',
                iron: '铁锭',
                meteorite: '陨铁',
                food: '粮草',
                wood: '木材',
                title: '称号'
            }[key] || key
        }));

    if (items.length === 0) return null;

    return (
        <div className="space-y-1">
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Gift className="w-3 h-3 text-emerald-400" /> 奖励
            </div>
            {items.map(item => (
                <div key={item.key} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={cn(
                        "font-mono font-bold",
                        item.key === 'title' ? "text-purple-400" : "text-emerald-400"
                    )}>
                        {item.key === 'title' ? `"${item.value}"` : `+${item.value}`}
                    </span>
                </div>
            ))}
        </div>
    );
}

function AchievementCard({
    achievement,
    isUnlocked,
    progress,
    isRecent
}: {
    achievement: Achievement;
    isUnlocked: boolean;
    progress: { current: number; required: number; percent: number };
    isRecent?: boolean;
}) {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "relative bg-black/40 border rounded-xl p-3 lg:p-4 transition-all cursor-pointer hover:border-white/20 group",
                    isUnlocked
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-white/5",
                    isRecent && "animate-pulse ring-2 ring-amber-400/50"
                )}
                style={!isUnlocked ? {
                    borderColor: `${TIER_COLORS[achievement.tier]}20`,
                    boxShadow: `inset 0 0 20px ${TIER_COLORS[achievement.tier]}08`
                } : undefined}
                onClick={() => setShowDetail(!showDetail)}
            >
                {isUnlocked && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                )}

                {!isUnlocked && (
                    <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-slate-600" />
                    </div>
                )}

                <div className="flex items-start gap-3 mb-2 pr-6">
                    <div
                        className="text-2xl lg:text-3xl shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center"
                        style={{
                            backgroundColor: `${TIER_COLORS[achievement.tier]}15`,
                            opacity: isUnlocked ? 1 : 0.6
                        }}
                    >
                        {achievement.isHidden && !isUnlocked ? '❓' : achievement.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <TierBadge tier={achievement.tier} />
                        </div>
                        <h3 className={cn(
                            "font-serif font-bold text-sm truncate",
                            isUnlocked ? "text-slate-200" : "text-slate-400"
                        )}>
                            {achievement.isHidden && !isUnlocked ? '???' : achievement.name}
                        </h3>
                        <p className={cn(
                            "text-[11px] leading-relaxed line-clamp-2",
                            isUnlocked ? "text-slate-400" : "text-slate-600"
                        )}>
                            {achievement.isHidden && !isUnlocked
                                ? (achievement.hint || '隐藏成就')
                                : achievement.description
                            }
                        </p>
                    </div>
                </div>

                {!isUnlocked && !achievement.isHidden && (
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">进度</span>
                            <span className="font-mono text-slate-400">
                                {progress.current} / {progress.required}
                            </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(100, progress.percent)}%`,
                                    backgroundColor: TIER_COLORS[achievement.tier],
                                    opacity: 0.8
                                }}
                            />
                        </div>
                    </div>
                )}

                {isUnlocked && (
                    <RewardList rewards={achievement.rewards} />
                )}

                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
            </div>

            {showDetail && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={() => setShowDetail(false)}
                >
                    <div
                        className="bg-[#0d0f12] border border-white/10 p-6 lg:p-8 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute -top-4 -right-4 w-24 h-24 blur-2xl pointer-events-none"
                             style={{ backgroundColor: `${TIER_COLORS[achievement.tier]}30` }}
                        />

                        <button
                            onClick={() => setShowDetail(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4 mb-4 relative z-10">
                            <div
                                className="text-4xl w-16 h-16 rounded-xl flex items-center justify-center"
                                style={{
                                    backgroundColor: `${TIER_COLORS[achievement.tier]}20`
                                }}
                            >
                                {achievement.isHidden && !isUnlocked ? '❓' : achievement.icon}
                            </div>
                            <div className="flex-1">
                                <TierBadge tier={achievement.tier} />
                                <h2 className={cn(
                                    "font-serif font-bold text-xl mt-2",
                                    isUnlocked ? "text-slate-100" : "text-slate-400"
                                )}>
                                    {achievement.isHidden && !isUnlocked ? '???' : achievement.name}
                                </h2>
                                <div className="text-xs text-slate-500 mt-1">
                                    {CATEGORY_LABELS[achievement.category]}
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-lg p-4 mb-4 relative z-10">
                            <p className={cn(
                                "text-sm leading-relaxed",
                                isUnlocked ? "text-slate-300" : "text-slate-500"
                            )}>
                                {achievement.isHidden && !isUnlocked
                                    ? (achievement.hint || '这是一个隐藏成就，完成特定条件后解锁。')
                                    : achievement.description
                                }
                            </p>
                        </div>

                        {!isUnlocked && !achievement.isHidden && (
                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">完成进度</span>
                                    <span className="font-mono font-bold" style={{ color: TIER_COLORS[achievement.tier] }}>
                                        {progress.current} / {progress.required}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, progress.percent)}%`,
                                            background: `linear-gradient(90deg, ${TIER_COLORS[achievement.tier]}80, ${TIER_COLORS[achievement.tier]})`
                                        }}
                                    />
                                </div>
                                <div className="text-right mt-1">
                                    <span className="text-[10px] font-mono text-slate-600">
                                        {progress.percent}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {(isUnlocked || (!achievement.isHidden)) && (
                            <div className="bg-black/40 rounded-lg p-4 relative z-10">
                                <RewardList rewards={achievement.rewards} />
                            </div>
                        )}

                        {achievement.isHidden && !isUnlocked && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 relative z-10">
                                <div className="flex items-center gap-2 text-amber-300 text-sm">
                                    <Star className="w-4 h-4" />
                                    <span>提示</span>
                                </div>
                                <p className="text-amber-200/70 text-xs mt-2 leading-relaxed">
                                    {achievement.hint || '完成特殊条件即可解锁此成就'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default function AchievementPanel({ isOpen, onClose }: AchievementPanelProps) {
    const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

    const achievementState = useGameStore((state) => state.achievementState);
    const heroes = useGameStore((state) => state.heroes);
    const resources = useGameStore((state) => state.resources);
    const buildings = useGameStore((state) => state.buildings);
    const crafting = useGameStore((state) => state.crafting);
    const recruitStats = useGameStore((state) => state.recruitStats);
    const ruinsRun = useGameStore((state) => state.ruinsRun);

    const allAchievements = useMemo(() => getAllAchievements(), []);
    const totalAchievements = allAchievements.length;
    const unlockedCount = achievementState.unlockedIds.length;

    const filteredAchievements = useMemo(() => {
        if (activeCategory === 'all') {
            return allAchievements;
        }
        return getAchievementsByCategory(activeCategory as AchievementCategory);
    }, [activeCategory, allAchievements]);

    const sortedAchievements = useMemo(() => {
        return [...filteredAchievements].sort((a, b) => {
            const aUnlocked = achievementState.unlockedIds.includes(a.id);
            const bUnlocked = achievementState.unlockedIds.includes(b.id);

            if (aUnlocked !== bUnlocked) {
                return aUnlocked ? -1 : 1;
            }

            const tierOrder: Record<AchievementTier, number> = {
                diamond: 0,
                gold: 1,
                silver: 2,
                bronze: 3
            };

            return tierOrder[a.tier] - tierOrder[b.tier];
        });
    }, [filteredAchievements, achievementState]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-3 lg:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.15)_0%,transparent_70%)] pointer-events-none"></div>

            <div className="relative w-full max-w-5xl mx-auto bg-[#0d0f12]/95 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] lg:max-h-[90vh]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="relative border-b border-purple-500/20 px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between shrink-0 bg-purple-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base lg:text-lg font-serif font-bold tracking-wide text-purple-200">
                                功勋簿
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">
                                记录将军的赫赫战功
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono text-emerald-400">{unlockedCount}</div>
                                <div className="text-[9px] text-slate-600">已解锁</div>
                            </div>
                            <div className="text-slate-700">/</div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono text-slate-400">{totalAchievements}</div>
                                <div className="text-[9px] text-slate-600">总数</div>
                            </div>
                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                            <div className="text-center">
                                <div className="text-lg font-bold font-mono text-amber-400">{achievementState.totalPoints}</div>
                                <div className="text-[9px] text-slate-600">功勋点</div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 lg:px-6 lg:py-2 rounded-lg font-bold tracking-widest text-xs lg:text-sm transition-all shadow-lg shrink-0 bg-purple-500/20 border border-purple-500/50 text-purple-200 hover:bg-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        >
                            关闭
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="border-b border-white/5 px-4 lg:px-6 py-2 flex gap-1 overflow-x-auto shrink-0">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                                activeCategory === cat
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <span>{cat === 'all' ? '📜' : CATEGORY_ICONS[cat as AchievementCategory]}</span>
                            <span>{cat === 'all' ? '全部' : CATEGORY_LABELS[cat as AchievementCategory]}</span>
                        </button>
                    ))}
                </div>

                {/* Achievement Grid */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
                        {sortedAchievements.map(achievement => {
                            const isUnlocked = achievementState.unlockedIds.includes(achievement.id);
                            const progress = calculateAchievementProgress(achievement.id, {
                                heroes,
                                resources,
                                buildings,
                                crafting,
                                recruitStats,
                                ruinsRun
                            });

                            return (
                                <AchievementCard
                                    key={achievement.id}
                                    achievement={achievement}
                                    isUnlocked={isUnlocked}
                                    progress={progress}
                                />
                            );
                        })}
                    </div>

                    {sortedAchievements.length === 0 && (
                        <div className="text-center py-12 text-slate-600">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">此分类暂无成就</p>
                        </div>
                    )}
                </div>

                {/* Mobile Stats Footer */}
                <div className="sm:hidden border-t border-white/5 px-4 py-3 flex items-center justify-around bg-black/40">
                    <div className="text-center">
                        <div className="text-base font-bold font-mono text-emerald-400">{unlockedCount}</div>
                        <div className="text-[9px] text-slate-600">已解锁</div>
                    </div>
                    <div className="text-slate-700">/</div>
                    <div className="text-center">
                        <div className="text-base font-bold font-mono text-slate-400">{totalAchievements}</div>
                        <div className="text-[9px] text-slate-600">总数</div>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="text-center">
                        <div className="text-base font-bold font-mono text-amber-400">{achievementState.totalPoints}</div>
                        <div className="text-[9px] text-slate-600">功勋点</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
