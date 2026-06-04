import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../store';
import { TUTORIAL_STEPS, TUTORIAL_PHASES, type TutorialStepId } from '../data/tutorial';
import { X, ChevronRight, SkipForward, Sparkles, RotateCcw } from 'lucide-react';

interface TutorialOverlayProps {
  /** 外部可控制是否显示 */
  forceVisible?: boolean;
}

export default function TutorialOverlay({ forceVisible }: TutorialOverlayProps) {
    const tutorialState = useGameStore((s) => s.tutorialState);
    const completeTutorialStep = useGameStore((s) => s.completeTutorialStep);
    const skipTutorial = useGameStore((s) => s.skipTutorial);
    const setCurrentTutorialStep = useGameStore((s) => s.setCurrentTutorialStep);

    const [stepIndex, setStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // 获取所有步骤（按顺序）
    const orderedSteps = useMemo(() => {
        return Object.values(TUTORIAL_STEPS).sort((a, b) => a.order - b.order);
    }, []);

    // 过滤出未完成且满足前置条件的步骤
    const availableSteps = useMemo(() => {
        return orderedSteps.filter(step => {
            if (tutorialState.completedSteps.includes(step.id)) return false;
            if (step.trigger.requireCompletedStep && !tutorialState.completedSteps.includes(step.trigger.requireCompletedStep)) {
                return false;
            }
            return true;
        });
    }, [orderedSteps, tutorialState.completedSteps]);

    // 当前应显示的步骤
    const currentStep: typeof TUTORIAL_STEPS[TutorialStepId] | null = useMemo(() => {
        if (!tutorialState.isTutorialActive && !forceVisible) return null;
        if (availableSteps.length === 0) return null;
        // 显示第一个可用步骤
        if (stepIndex >= availableSteps.length) {
            setStepIndex(Math.max(0, availableSteps.length - 1));
            return availableSteps[availableSteps.length - 1] || null;
        }
        return availableSteps[stepIndex] || null;
    }, [tutorialState.isTutorialActive, forceVisible, availableSteps, stepIndex]);

    // 总进度
    const totalSteps = orderedSteps.length;
    const completedCount = tutorialState.completedSteps.length;
    const progressPercent = Math.round((completedCount / totalSteps) * 100);

    // 处理"下一步"
    const handleNext = useCallback(() => {
        if (!currentStep) return;
        setIsAnimating(true);
        setTimeout(() => {
            completeTutorialStep(currentStep.id);
            setStepIndex(0); // 重置索引，因为完成一步后列表会变化
            setIsAnimating(false);
        }, 300);
    }, [currentStep, completeTutorialStep]);

    // 处理跳过
    const handleSkip = useCallback(() => {
        skipTutorial();
    }, [skipTutorial]);

    // 不显示的条件
    if (!forceVisible && !tutorialState.isTutorialActive) return null;
    if (!currentStep && !forceVisible) return null;

    // 全部完成时的展示
    if (availableSteps.length === 0 && completedCount > 0) {
        return (
            <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center">
                <div className="bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md rounded-xl px-6 py-4 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-3 text-emerald-300">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-medium">引导已完成！你已掌握镇武城的基础运营。</span>
                    </div>
                </div>
            </div>
        );
    }

    const phaseInfo = currentStep?.phase ? TUTORIAL_PHASES[currentStep.phase] : null;

    return (
        <div className={`fixed inset-0 z-[90] transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {/* 暗色遮罩 */}
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={(e) => e.stopPropagation()} />

            {/* 高亮区域指示器 */}
            {currentStep?.highlightTarget && (
                <HighlightTarget target={currentStep.highlightTarget} />
            )}

            {/* 引导卡片 */}
            <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-[420px] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-[#131820]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden relative">
                    {/* 顶部装饰线 - 根据阶段变色 */}
                    <div className={`h-1 ${
                        currentStep?.phase === 'basics' ? 'bg-indigo-500' :
                        currentStep?.phase === 'economy' ? 'bg-emerald-500' :
                        currentStep?.phase === 'combat' ? 'bg-orange-500' :
                        'bg-purple-500'
                    }`} />

                    <div className="p-5 space-y-4">
                        {/* 头部：阶段 + 步骤名 + 关闭 */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                                        currentStep?.phase === 'basics' ? 'bg-indigo-500/20 text-indigo-300' :
                                        currentStep?.phase === 'economy' ? 'bg-emerald-500/20 text-emerald-300' :
                                        currentStep?.phase === 'combat' ? 'bg-orange-500/20 text-orange-300' :
                                        'bg-purple-500/20 text-purple-300'
                                    }`}>
                                        {phaseInfo?.icon} {phaseInfo?.name}
                                    </span>
                                </div>
                                <h3 className="text-base font-serif font-bold text-slate-100">
                                    {currentStep?.title}
                                </h3>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-red-400 group"
                                title="跳过引导"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 进度条 */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>进度</span>
                                <span>{completedCount}/{totalSteps} ({progressPercent}%)</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* 内容文本 */}
                        <div className="max-h-[35vh] overflow-y-auto custom-scrollbar pr-1 space-y-2">
                            {currentStep?.content.map((text, idx) => (
                                text === '' ? (
                                    <div key={idx} className="h-2" />
                                ) : (
                                    <p key={idx} className={`text-sm leading-relaxed ${
                                        idx === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'
                                    }`}>
                                        {text}
                                    </p>
                                )
                            ))}
                        </div>

                        {/* 奖励提示 */}
                        {currentStep?.rewards && Object.keys(currentStep.rewards).length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs">
                                {Object.entries(currentStep.rewards).map(([key, val]) => (
                                    <span key={key} className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20">
                                        +{val as number} {resourceLabel(key)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 底部操作栏 */}
                        <div className="flex items-center gap-3 pt-2">
                            {currentStep?.skippable ? (
                                <>
                                    <button
                                        onClick={() => {
                                            if (stepIndex < availableSteps.length - 1) {
                                                setStepIndex(stepIndex + 1);
                                            } else {
                                                handleNext();
                                            }
                                        }}
                                        disabled={availableSteps.length <= 1}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-all text-sm"
                                    >
                                        下一步
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] text-sm flex items-center justify-center gap-2"
                                    >
                                        完成并领取奖励
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] text-sm flex items-center justify-center gap-2"
                                >
                                    我知道了
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 高亮目标区域 */
function HighlightTarget({ target }: { target: NonNullable<typeof TUTORIAL_STEPS[TutorialStepId]>['highlightTarget'] }) {
    const [position, setPosition] = useState<DOMRect | null>(null);

    useEffect(() => {
        let el: Element | null = null;
        if (target.type === 'tab') {
            // 查找导航按钮
            el = document.querySelector(`[data-tab-id="${target.id}"]`);
        } else if (target.type === 'element') {
            el = document.querySelector(`[data-tutorial-target="${target.id}"]`) ||
                 document.querySelector(`#${target.id}`);
        } else if (target.type === 'area') {
            el = document.querySelector(`[data-tutorial-area="${target.id}"]`);
        }

        if (el) {
            const rect = el.getBoundingClientRect();
            setPosition(rect);
        } else {
            setPosition(null);
        }
    }, [target]);

    if (!position) return null;

    return (
        <>
            {/* 高亮框 */}
            <div
                className="absolute pointer-events-none border-2 border-orange-400 rounded-lg shadow-[0_0_20px_rgba(251,146,60,0.4)] transition-all duration-300 z-[91]"
                style={{
                    top: position.top - 4,
                    left: position.left - 4,
                    width: position.width + 8,
                    height: position.height + 8,
                }}
            />
            {/* 标签 */}
            {target.label && (
                <div
                    className="absolute z-[92] px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap animate-bounce"
                    style={{
                        top: position.bottom + 12,
                        left: position.left + position.width / 2,
                        transform: 'translateX(-50%)',
                    }}
                >
                    {target.label}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
                </div>
            )}
        </>
    );
}

/** 资源名称映射 */
function resourceLabel(key: string): string {
    const labels: Record<string, string> = {
        bingxiang: '兵饷',
        iron: '铁锭',
        food: '粮草',
        wood: '木材',
        meteorite: '陨铁',
        population: '人口',
    };
    return labels[key] || key;
}
