import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store';
import { STORY_CHAPTERS, ACTS, getChapter } from '../data/storyline';
import { X, BookOpen, Star, Lock, CheckCircle2, ScrollText } from 'lucide-react';

interface StoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StoryPanel({ isOpen, onClose }: StoryPanelProps) {
    const storyState = useGameStore((s) => s.storyState);
    const readStoryChapter = useGameStore((s) => s.readStoryChapter);
    const makeStoryChoice = useGameStore((s) => s.makeStoryChoice);
    const dismissStoryNotification = useGameStore((s) => s.dismissStoryNotification);

    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);

    // 当前选中的章节
    const selectedChapter = useMemo(() => {
        if (!selectedChapterId) return null;
        return getChapter(selectedChapterId);
    }, [selectedChapterId]);

    // 有未读章节的标记
    const hasUnread = storyState.unreadChapterIds.length > 0;

    // 自动选中第一个未读章节
    useEffect(() => {
        if (isOpen && !selectedChapterId && storyState.unreadChapterIds.length > 0) {
            setSelectedChapterId(storyState.unreadChapterIds[0]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    /** 处理阅读确认 */
    const handleReadConfirm = () => {
        if (!selectedChapter) return;
        readStoryChapter(selectedChapter.id);
        setShowContent(false);
        // 跳转到下一章
        const nextUnread = storyState.unreadChapterIds.find(id => id !== selectedChapter.id);
        if (nextUnread) {
            setSelectedChapterId(nextUnread);
        }
    };

    /** 处理选择分支 */
    const handleChoice = (choiceId: string) => {
        if (!selectedChapter) return;
        makeStoryChoice(selectedChapter.id, choiceId);
        setShowContent(false);
        // 选择后跳转到目标章
        const choice = selectedChapter.choices?.find(c => c.id === choiceId);
        if (choice) {
            setSelectedChapterId(choice.nextChapterId);
        }
    };

    /** 判断章节是否可读 */
    const canReadChapter = (chapterId: string): boolean => {
        return storyState.unlockedChapterIds.includes(chapterId);
    };

    /** 判断章节是否已读 */
    const isChapterRead = (chapterId: string): boolean => {
        return storyState.completedChapterIds.includes(chapterId);
    };

    /** 获取章节状态图标 */
    const ChapterStatusIcon = ({ chapterId }: { chapterId: string }) => {
        if (isChapterRead(chapterId)) return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        if (canReadChapter(chapterId)) {
            const isUnread = storyState.unreadChapterIds.includes(chapterId);
            return isUnread
                ? <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                : <BookOpen className="w-4 h-4 text-slate-400" />;
        }
        return <Lock className="w-4 h-4 text-slate-600" />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0d0f12] border border-white/10 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 blur-[100px) pointer-events-none" />

                {/* 标题栏 */}
                <div className="shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-3">
                        <ScrollText className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-200">镇武纪</h2>
                        {hasUnread && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full animate-pulse">
                                新章节
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 主体：左侧章节列表 + 右侧内容 */}
                <div className="flex-1 flex min-h-0 relative z-10">
                    {/* 左侧：章节列表 */}
                    <div className="w-48 sm:w-56 shrink-0 border-r border-white/10 overflow-y-auto custom-scrollbar p-3 space-y-1 hidden sm:block">
                        {ACTS.map((act) => (
                            <div key={act.id}>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 py-2 sticky top-0 bg-[#0d0f12]">
                                    {act.name}
                                </div>
                                {act.chapters.map((chId) => {
                                    const ch = getChapter(chId);
                                    if (!ch) return null;
                                    const isSelected = selectedChapterId === chId;
                                    const readable = canReadChapter(chId);
                                    return (
                                        <button
                                            key={chId}
                                            disabled={!readable}
                                            onClick={() => { setSelectedChapterId(chId); setShowContent(false); }}
                                            className={`w-full text-left px-2.5 py-2 rounded-lg transition-all text-xs flex items-center gap-2 ${
                                                isSelected
                                                    ? 'bg-orange-500/15 text-orange-200 border border-orange-500/30'
                                                    : readable
                                                        ? 'text-slate-300 hover:bg-white/5'
                                                        : 'text-slate-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <ChapterStatusIcon chapterId={chId} />
                                            <span className="truncate">{ch.subtitle}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* 右侧：内容区 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                        {!selectedChapter ? (
                            /* 未选择章节时的提示 */
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <BookOpen className="w-12 h-12 text-slate-700" />
                                <div>
                                    <p className="text-slate-300 font-serif text-lg">选择一个章节开始阅读</p>
                                    <p className="text-slate-500 text-xs mt-1">达成游戏里程碑以解锁新剧情</p>
                                </div>

                                {/* 移动端：显示未读章节列表 */}
                                <div className="sm:hidden w-full space-y-2 mt-6">
                                    {storyState.unreadChapterIds.map((chId) => {
                                        const ch = getChapter(chId);
                                        if (!ch) return null;
                                        return (
                                            <button
                                                key={chId}
                                                onClick={() => { setSelectedChapterId(chId); setShowContent(false); }}
                                                className="w-full px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-left"
                                            >
                                                <span className="text-orange-200 text-sm font-medium">{ch.title} · {ch.subtitle}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : showContent ? (
                            /* 阅读模式 */
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* 章节标题 */}
                                <div className="border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                        <span>第{selectedChapter.act}幕</span>
                                        <span>·</span>
                                        <span>第{selectedChapter.chapter}章</span>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-orange-200">
                                        {selectedChapter.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1 italic">{selectedChapter.subtitle}</p>
                                </div>

                                {/* 场景描述 */}
                                <div className="bg-black/40 border border-white/5 rounded-lg p-4 italic text-slate-400 text-sm leading-relaxed">
                                    {selectedChapter.scene}
                                </div>

                                {/* 正文 */}
                                <div className="space-y-3">
                                    {selectedChapter.content.map((paragraph, idx) => (
                                        <p
                                            key={idx}
                                            className={`text-sm leading-relaxed ${
                                                idx === 0 ? 'text-slate-300' : 'text-slate-400'
                                            } ${paragraph === '' ? 'h-3' : ''}`}
                                        >
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                {/* 分支选择（如果有的话，且未读） */}
                                {!isChapterRead(selectedChapter.id) && selectedChapter.choices && selectedChapter.choices.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-white/10">
                                        <p className="text-sm text-slate-300 font-medium">你的选择：</p>
                                        {selectedChapter.choices.map((choice) => (
                                            <button
                                                key={choice.id}
                                                onClick={() => handleChoice(choice.id)}
                                                className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 rounded-lg transition-all group"
                                            >
                                                <p className="text-sm text-slate-200 group-hover:text-orange-200">{choice.text}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* 奖励预览 */}
                                {selectedChapter.rewards && Object.keys(selectedChapter.rewards).length > 0 && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                        <p className="text-xs text-emerald-400 font-medium mb-2">本章奖励</p>
                                        <div className="flex flex-wrap gap-3 text-xs">
                                            {selectedChapter.rewards.bingxiang && <span className="text-amber-300">兵饷 +{selectedChapter.rewards.bingxiang}</span>}
                                            {selectedChapter.rewards.iron && <span className="text-slate-300">铁锭 +{selectedChapter.rewards.iron}</span>}
                                            {selectedChapter.rewards.food && <span className="text-emerald-300">粮草 +{selectedChapter.rewards.food}</span>}
                                            {selectedChapter.rewards.wood && <span className="text-orange-300">木材 +{selectedChapter.rewards.wood}</span>}
                                            {selectedChapter.rewards.meteorite && <span className="text-cyan-300">陨铁 +{selectedChapter.rewards.meteorite}</span>}
                                            {selectedChapter.rewards.population && <span className="text-indigo-300">人口 +{selectedChapter.rewards.population}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* 确认按钮（已读的不显示） */}
                                {!isChapterRead(selectedChapter.id) && !selectedChapter.choices && (
                                    <button
                                        onClick={handleReadConfirm}
                                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)]"
                                    >
                                        继续阅读
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* 章节预览卡片 */
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                            <span>第{selectedChapter.act}幕 · 第{selectedChapter.chapter}章</span>
                                            {isChapterRead(selectedChapter.id) && (
                                                <span className="text-emerald-400">已读</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-slate-200">
                                            {selectedChapter.subtitle}
                                        </h3>
                                    </div>
                                    {isChapterRead(selectedChapter.id) ? (
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    ) : storyState.unreadChapterIds.includes(selectedChapter.id) ? (
                                        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                                    ) : (
                                        <BookOpen className="w-8 h-8 text-slate-600" />
                                    )}
                                </div>

                                <div className="bg-black/40 border border-white/5 rounded-lg p-4 italic text-slate-500 text-sm">
                                    {selectedChapter.scene}
                                </div>

                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {selectedChapter.content[0]}
                                </p>

                                <button
                                    onClick={() => setShowContent(true)}
                                    className="w-full py-3 bg-orange-600/80 hover:bg-orange-500 text-white font-bold rounded-lg transition-all"
                                >
                                    {isChapterRead(selectedChapter.id) ? '重新阅读' : '开始阅读'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
