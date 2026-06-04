import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store';
import { QUEST_TEMPLATES } from '../data';
import { getQuestProgress, QUEST_TYPE_CONFIG } from '../utils/questEngine';
import { X, Clock, CheckCircle2, Circle, Trophy, Target, Flame, Star } from 'lucide-react';

interface QuestBoardProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'daily' | 'weekly';

const RESOURCE_ICONS: Record<string, string> = {
    bingxiang: '🪙',
    iron: '⛏️',
    meteorite: '✨',
    food: '🌾',
    wood: '🪵',
    population: '👤'
};

const DIFFICULTY_CONFIG = {
    1: { label: '简', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    2: { label: '中', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    3: { label: '难', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
};

function getResetCountdown(category: TabType): { hours: number; minutes: number; seconds: number; targetTime: string } {
    const now = new Date();
    let target = new Date();
    
    if (category === 'daily') {
        target.setHours(4, 0, 0, 0);
        if (now >= target) {
            target.setDate(target.getDate() + 1);
        }
    } else {
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
        target.setDate(now.getDate() + daysUntilMonday);
        target.setHours(0, 0, 0, 0);
    }
    
    const diff = target.getTime() - now.getTime();
    return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        targetTime: category === 'daily' ? '04:00' : '周一 00:00'
    };
}

export default function QuestBoard({ isOpen, onClose }: QuestBoardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('daily');
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, targetTime: '' });
    
    const questState = useGameStore((state) => state.questState);
    const resources = useGameStore((state) => state.resources);
    const checkAndRefreshQuests = useGameStore((state) => state.checkAndRefreshQuests);
    const turnInQuest = useGameStore((state) => state.turnInQuest);
    const acceptQuest = useGameStore((state) => state.acceptQuest);

    useEffect(() => {
        if (!isOpen) return;
        checkAndRefreshQuests();
    }, [isOpen, checkAndRefreshQuests]);

    useEffect(() => {
        if (!isOpen) return;
        
        const timer = setInterval(() => {
            setCountdown(getResetCountdown(activeTab));
        }, 1000);
        
        setCountdown(getResetCountdown(activeTab));
        
        return () => clearInterval(timer);
    }, [isOpen, activeTab]);

    const questData = useMemo(() => {
        // 可用任务池（未接取）
        const availableIds = activeTab === 'daily'
            ? (questState.availableDailyIds || [])
            : (questState.availableWeeklyIds || []);

        // 活跃任务（已接取）
        const activeIds = activeTab === 'daily'
            ? (questState.activeDailyIds || [])
            : (questState.activeWeeklyIds || []);

        const completedIds = activeTab === 'daily'
            ? questState.completedDailyIds
            : questState.completedWeeklyIds;

        // 可用任务列表
        const availableQuests = availableIds
            .map(id => ({
                id,
                template: QUEST_TEMPLATES[id]
            }))
            .filter(q => q.template);

        // 活跃任务列表
        const activeQuests = activeIds
            .map(id => ({
                id,
                template: QUEST_TEMPLATES[id]
            }))
            .filter(q => q.template);

        return { availableQuests, activeQuests, completedIds };
    }, [activeTab, questState]);

    const stats = useMemo(() => {
        const dailyCompleted = questState.completedDailyIds?.length || 0;
        const dailyActive = questState.activeDailyIds?.length || 0;
        const dailyAvailable = questState.availableDailyIds?.length || 0;
        const weeklyCompleted = questState.completedWeeklyIds?.length || 0;
        const weeklyActive = questState.activeWeeklyIds?.length || 0;
        const weeklyAvailable = questState.availableWeeklyIds?.length || 0;

        return { dailyCompleted, dailyTotal: dailyActive + dailyCompleted, dailyAvailable, weeklyCompleted, weeklyTotal: weeklyActive + weeklyCompleted, weeklyAvailable };
    }, [questState]);

    const handleAccept = (questId: string) => {
        acceptQuest(questId);
    };

    const handleTurnIn = (questId: string) => {
        turnInQuest(questId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
            <div className="bg-[#0d0f12]/95 border border-white/10 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/5 blur-[80px] rounded-full pointer-events-none"></div>
                
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-serif text-slate-100 font-bold">任务看板</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500">完成使命，获取丰厚奖励</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="relative z-10 flex gap-2 px-4 sm:p-6 pt-4">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'daily'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <Target className="w-4 h-4" />
                        每日任务
                    </button>
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'weekly'
                                ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <Flame className="w-4 h-4" />
                        每周任务
                    </button>
                </div>

                {/* Countdown */}
                <div className="relative z-10 px-4 sm:px-6 pb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>距离重置：</span>
                        <span className="font-mono text-slate-300">
                            {String(countdown.hours).padStart(2, '0')}:
                            {String(countdown.minutes).padStart(2, '0')}:
                            {String(countdown.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-slate-600">({countdown.targetTime})</span>
                    </div>
                </div>

                {/* Quest List */}
                <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 pb-4 custom-scrollbar space-y-4">
                    {/* 可接取任务 */}
                    {questData.availableQuests.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">可接取 ({questData.availableQuests.length})</span>
                            </div>
                            <div className="space-y-2.5">
                                {questData.availableQuests.map(({ id, template }) => {
                                    const config = QUEST_TYPE_CONFIG[template.requireType];
                                    const difficulty = DIFFICULTY_CONFIG[template.difficulty];

                                    return (
                                        <div
                                            key={id}
                                            className="rounded-xl border p-3.5 bg-white/[0.03] border-white/10 hover:border-cyan-500/30 transition-all group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                                                    <Circle className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="font-bold text-sm text-slate-200 truncate">{template.title}</h3>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${difficulty.bg} ${difficulty.color} ${difficulty.border} border shrink-0`}>
                                                            {difficulty.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mb-2.5 line-clamp-2">{template.description}</p>

                                                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                                                        <span className="text-[9px] text-slate-600 uppercase tracking-wider">奖励</span>
                                                        {Object.entries(template.rewards).map(([key, value]) => (
                                                            <div key={key} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/5">
                                                                <span className="text-xs">{RESOURCE_ICONS[key] || '📦'}</span>
                                                                <span className="text-[10px] font-mono text-slate-300">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => handleAccept(id)}
                                                        className="w-full py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Circle className="w-3.5 h-3.5" />
                                                        接取任务
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 进行中任务 */}
                    <div>
                        {questData.availableQuests.length > 0 && questData.activeQuests.length > 0 && (
                            <div className="flex items-center gap-2 mb-2.5 mt-4 pt-4 border-t border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">进行中 ({questData.activeQuests.length})</span>
                            </div>
                        )}
                        {(questData.availableQuests.length === 0) && questData.activeQuests.length > 0 && (
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">进行中 ({questData.activeQuests.length})</span>
                            </div>
                        )}

                        {questData.activeQuests.length === 0 && questData.availableQuests.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Circle className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm font-serif">暂无{activeTab === 'daily' ? '每日' : '每周'}任务</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {questData.activeQuests.map(({ id, template }) => {
                                const progress = getQuestProgress(id, template, { resources, questState });
                                const isCompleted = questData.completedIds.includes(id);
                                const config = QUEST_TYPE_CONFIG[template.requireType];
                                const difficulty = DIFFICULTY_CONFIG[template.difficulty];
                                const canTurnIn = progress.canTurnIn;

                                return (
                                    <div
                                        key={id}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isCompleted
                                                ? 'bg-white/[0.02] border-white/5 opacity-50'
                                                : canTurnIn
                                                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30 shadow-lg shadow-amber-500/10 animate-pulse-slow'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status Icon */}
                                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                isCompleted
                                                    ? 'bg-emerald-500/20'
                                                    : canTurnIn
                                                    ? 'bg-amber-500/20'
                                                    : 'bg-white/5'
                                            }`}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                ) : canTurnIn ? (
                                                    <Star className="w-4 h-4 text-amber-400 animate-spin-slow" style={{ animationDuration: '3s' }} />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-slate-500" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <h3 className={`font-bold text-sm truncate ${
                                                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'
                                                    }`}>
                                                        {template.title}
                                                    </h3>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${difficulty.bg} ${difficulty.color} ${difficulty.border} border shrink-0`}>
                                                        {difficulty.label}
                                                    </span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5 shrink-0">
                                                        {config.label}
                                                    </span>
                                                </div>

                                                <p className={`text-xs mb-3 ${isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {template.description}
                                                </p>

                                                {/* Progress Bar */}
                                                {!isCompleted && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] text-slate-500">进度</span>
                                                            <span className="text-[10px] font-mono text-slate-400">
                                                                {progress.current} / {progress.required}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    progress.isComplete
                                                                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                                                }`}
                                                                style={{ width: `${Math.min(100, progress.percentage)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rewards */}
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    <span className="text-[9px] text-slate-600 uppercase tracking-wider">奖励</span>
                                                    {Object.entries(template.rewards).map(([key, value]) => (
                                                        <div key={key} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/5">
                                                            <span className="text-xs">{RESOURCE_ICONS[key] || '📦'}</span>
                                                            <span className="text-[10px] font-mono text-slate-300">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Action Button */}
                                                <div className="flex justify-end">
                                                    {canTurnIn && (
                                                        <button
                                                            onClick={() => handleTurnIn(id)}
                                                            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-500/25 transition-all animate-glow"
                                                        >
                                                            领取奖励
                                                        </button>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="px-4 py-1.5 text-xs text-slate-600 font-bold">
                                                            已完成
                                                        </span>
                                                    )}
                                                    {!canTurnIn && !isCompleted && (
                                                        <span className="px-4 py-1.5 text-xs text-slate-500 font-bold">
                                                            进行中...
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="relative z-10 p-4 sm:p-6 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">今日进度</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-amber-300">{stats.dailyCompleted}</span>
                                <span className="text-xs text-slate-500">/ {stats.dailyTotal}</span>
                            </div>
                            {stats.dailyAvailable > 0 && (
                                <div className="mt-1 text-[10px] text-cyan-500">+{stats.dailyAvailable} 可接取</div>
                            )}
                        </div>
                        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">本周进度</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-purple-300">{stats.weeklyCompleted}</span>
                                <span className="text-xs text-slate-500">/ {stats.weeklyTotal}</span>
                            </div>
                            {stats.weeklyAvailable > 0 && (
                                <div className="mt-1 text-[10px] text-cyan-500">+{stats.weeklyAvailable} 可接取</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
