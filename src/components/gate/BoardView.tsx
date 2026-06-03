import { useEffect } from 'react';
import { useGameStore } from '../../store';
import { QUEST_TEMPLATES } from '../../data';
import type { QuestTemplate } from '../../data';
import { cn } from '../../utils';
import { ScrollText, Clock, Trophy, CheckCircle2, RotateCcw, Target, Hand } from 'lucide-react';
import { QUEST_TYPE_CONFIG } from '../../utils/questEngine';

const DIFFICULTY_COLORS: Record<number, string> = {
    1: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    2: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    3: 'text-red-400 bg-red-500/10 border-red-500/20'
};

const DIFFICULTY_LABELS: Record<number, string> = {
    1: '简易',
    2: '困难',
    3: '极难'
};

const CATEGORY_ICONS = {
    daily: <Clock className="w-3.5 h-3.5" />,
    weekly: <Trophy className="w-3.5 h-3.5" />
};

const REQUIRE_TYPE_LABELS: Record<string, string> = {
    resource: '资源',
    explore: '探索',
    craft: '锻造',
    recruit: '募兵',
    boss_kill: '击杀BOSS',
    deep_explore: '深层探索'
};

const RESOURCE_LABELS: Record<string, string> = {
    bingxiang: '兵饷', iron: '铁锭', meteorite: '陨铁',
    food: '粮草', wood: '木材', population: '人口'
};

export default function BoardView() {
    const { questState, turnInQuest, checkAndRefreshQuests, acceptQuest, resources } = useGameStore();

    useEffect(() => {
        checkAndRefreshQuests();
    }, []);

    // Get active quests (randomly selected)
    const getActiveDailyQuests = (): [string, QuestTemplate][] => {
        const activeIds = questState.activeDailyIds || [];
        return activeIds
            .map(id => [id, QUEST_TEMPLATES[id]] as [string, QuestTemplate])
            .filter(([, t]) => t !== undefined)
            .sort((a, b) => a[1].difficulty - b[1].difficulty);
    };

    const getActiveWeeklyQuests = (): [string, QuestTemplate][] => {
        const activeIds = questState.activeWeeklyIds || [];
        return activeIds
            .map(id => [id, QUEST_TEMPLATES[id]] as [string, QuestTemplate])
            .filter(([, t]) => t !== undefined)
            .sort((a, b) => a[1].difficulty - b[1].difficulty);
    };

    const dailyQuests = getActiveDailyQuests();
    const weeklyQuests = getActiveWeeklyQuests();

    const getQuestProgressInfo = (questId: string, template: QuestTemplate) => {
        if (template.requireType === 'resource' && template.resourceKey) {
            // Resource quests: read from inventory in real-time
            return resources[template.resourceKey as keyof typeof resources] || 0;
        }
        // Action quests: read from accumulated progress
        return questState.progress[questId] || 0;
    };

    const renderQuestCard = ([questId, template]: [string, QuestTemplate]) => {
        const isCompleted = template.category === 'daily'
            ? questState.completedDailyIds.includes(questId)
            : questState.completedWeeklyIds.includes(questId);
        
        const isAccepted = questState.acceptedIds?.includes(questId) || false;
        const isResourceQuest = template.requireType === 'resource';
        const typeConfig = QUEST_TYPE_CONFIG[template.requireType as keyof typeof QUEST_TYPE_CONFIG];
        
        const progress = getQuestProgressInfo(questId, template);
        const canTurnIn = !isCompleted && (isResourceQuest || isAccepted) && progress >= template.amount;
        const progressPct = Math.min(100, (progress / template.amount) * 100);

        return (
            <div key={questId} className={cn(
                "bg-[#121418] border rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col relative overflow-hidden group shadow-lg transition-all",
                isCompleted ? "border-emerald-500/15 opacity-70" : isAccepted ? "border-indigo-500/20" : "border-white/5 hover:border-white/10"
            )}>
                <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none",
                    isCompleted ? "bg-emerald-500/5" : isAccepted ? "bg-indigo-500/5" : "bg-indigo-500/5"
                )}></div>

                <div className="flex items-start justify-between mb-2 relative z-10">
                    <h3 className={cn("text-sm sm:text-base font-serif", isCompleted ? "text-emerald-300 line-through" : "text-slate-200")}>
                        {template.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            "text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-mono border uppercase tracking-wider",
                            DIFFICULTY_COLORS[template.difficulty]
                        )}>
                            {DIFFICULTY_LABELS[template.difficulty]}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-600 flex items-center gap-0.5">
                            {CATEGORY_ICONS[template.category]}
                            {template.category === 'daily' ? '日' : '周'}
                        </span>
                    </div>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 mb-2.5 sm:mb-3 leading-relaxed pr-6">{template.description}</p>
                
                {/* Type indicator */}
                <div className="mb-2.5 sm:mb-3 flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                    <span className="px-1.5 py-0.5 bg-slate-700/30 rounded text-slate-300 font-mono">
                        {typeConfig?.label || template.requireType}
                    </span>
                    {isResourceQuest && template.resourceKey && (
                        <span className="text-slate-500">
                            ({RESOURCE_LABELS[template.resourceKey]})
                        </span>
                    )}
                    {!isResourceQuest && typeConfig?.needsAcceptance && !isAccepted && (
                        <span className="text-orange-400 animate-pulse">需接取</span>
                    )}
                </div>

                <div className="mb-2.5 sm:mb-3 relative z-10">
                    <div className="flex justify-between text-[9px] sm:text-[10px] font-mono mb-1">
                        <span className="text-slate-400">
                            {REQUIRE_TYPE_LABELS[template.requireType] || template.requireType}
                            {template.resourceKey && `(${RESOURCE_LABELS[template.resourceKey]})`}
                        </span>
                        <span className={cn(
                            progress >= template.amount && !isCompleted
                                ? "text-emerald-400 font-bold"
                                : "text-slate-500"
                        )}>
                            {Math.floor(progress)}/{template.amount}
                        </span>
                    </div>
                    <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 rounded-full",
                                isCompleted ? "bg-emerald-500" : progress >= template.amount ? "bg-indigo-500 animate-pulse" : "bg-slate-600"
                            )}
                            style={{ width: `${progressPct}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-auto pt-2 sm:pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 relative z-10">
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(template.rewards).map(([key, val]) => (
                            <span key={key} className="text-[9px] sm:text-[10px] font-mono text-indigo-300 bg-indigo-500/8 px-1.5 py-0.5 rounded border border-indigo-500/12">
                                +{val} {RESOURCE_LABELS[key] || key}
                            </span>
                        ))}
                    </div>

                    {isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 已完成
                        </span>
                    ) : canTurnIn ? (
                        <button
                            onClick={() => turnInQuest(questId)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold tracking-widest text-[10px] sm:text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all mobile-touch-target"
                        >
                            提交任务
                        </button>
                    ) : isResourceQuest ? (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            库存不足
                        </span>
                    ) : isAccepted ? (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Target className="w-3 h-3" /> 进行中...
                        </span>
                    ) : (
                        <button
                            onClick={() => acceptQuest(questId)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold tracking-widest text-[10px] sm:text-[11px] bg-orange-600/80 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-1 mobile-touch-target"
                        >
                            <Hand className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 接取
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-8 animate-in fade-in duration-500 pb-20 lg:pb-0">
            <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-serif text-slate-200 tracking-widest mb-2 flex items-center justify-center">
                    <ScrollText className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-indigo-400" /> 城中告示
                </h2>
                <p className="text-slate-500 text-[10px] sm:text-xs">每日任务自动刷新，每周任务周一重置</p>
                <p className="text-slate-600 text-[8px] sm:text-[9px] mt-1">任务随机发布，每次可能不同</p>
            </div>

            <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm font-serif text-slate-300">每日委托</span>
                    <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 ml-auto" />
                    <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono">每日随机刷新</span>
                </div>
                
                {dailyQuests.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                        {dailyQuests.map(renderQuestCard)}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-600 text-sm">
                        今日暂无委托，明日再来吧...
                    </div>
                )}
            </div>

            {weeklyQuests.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2 sm:mb-3 px-1">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                        <span className="text-xs sm:text-sm font-serif text-slate-300">每周挑战</span>
                        <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600 ml-auto" />
                        <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono">周一随机刷新</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                        {weeklyQuests.map(renderQuestCard)}
                    </div>
                </div>
            )}

            {/* Task Pool Info */}
            <div className="mt-6 p-3 bg-black/40 border border-white/5 rounded-xl">
                <h4 className="text-xs font-bold text-slate-400 mb-2">📋 任务池信息</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <div>
                        每日任务池：<span className="text-slate-300 font-mono">
                            {Object.values(QUEST_TEMPLATES).filter(q => q.category === 'daily').length} 个模板
                        </span>
                    </div>
                    <div>
                        每周任务池：<span className="text-slate-300 font-mono">
                            {Object.values(QUEST_TEMPLATES).filter(q => q.category === 'weekly').length} 个模板
                        </span>
                    </div>
                    <div>
                        当前每日任务：<span className="text-blue-400 font-mono">{dailyQuests.length}/6</span>
                    </div>
                    <div>
                        当前每周任务：<span className="text-purple-400 font-mono">{weeklyQuests.length}/3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
