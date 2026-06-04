import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '../store';
import { TUTORIAL_STEPS, TUTORIAL_PHASES, type TutorialStepId } from '../data/tutorial';
import { X, ChevronRight, SkipForward, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  forceVisible?: boolean;
}

// ============================================================
// 主组件：带镂空遮罩的引导覆盖层
// ============================================================
export default function TutorialOverlay({ forceVisible }: TutorialOverlayProps) {
    const tutorialState = useGameStore((s) => s.tutorialState);
    const completeTutorialStep = useGameStore((s) => s.completeTutorialStep);
    const skipTutorial = useGameStore((s) => s.skipTutorial);

    const [stepIndex, setStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 所有步骤（按顺序）
    const orderedSteps = useMemo(() =>
        Object.values(TUTORIAL_STEPS).sort((a, b) => a.order - b.order), []
    );

    // 过滤可用步骤
    const availableSteps = useMemo(() =>
        orderedSteps.filter(step => {
            if (tutorialState.completedSteps.includes(step.id)) return false;
            if (step.trigger.requireCompletedStep && !tutorialState.completedSteps.includes(step.trigger.requireCompletedStep)) return false;
            return true;
        }), [orderedSteps, tutorialState.completedSteps]
    );

    // 当前步骤
    const currentStep: typeof TUTORIAL_STEPS[TutorialStepId] | null = useMemo(() => {
        if (!tutorialState.isTutorialActive && !forceVisible) return null;
        if (availableSteps.length === 0) return null;
        if (stepIndex >= availableSteps.length) {
            setStepIndex(Math.max(0, availableSteps.length - 1));
            return availableSteps[availableSteps.length - 1] || null;
        }
        return availableSteps[stepIndex] || null;
    }, [tutorialState.isTutorialActive, forceVisible, availableSteps, stepIndex]);

    // 进度
    const totalSteps = orderedSteps.length;
    const completedCount = tutorialState.completedSteps.length;
    const progressPercent = Math.round((completedCount / totalSteps) * 100);

    // 目标元素位置
    const targetRect = useTargetRect(currentStep?.highlightTarget);

    // 提示框最佳位置（避免遮挡目标）
    const tooltipPlacement = useMemo(() => {
        if (!targetRect) return { position: 'bottom' as const, coords: { top: 80, left: 16 }, maxHeight: window.innerHeight - 128 };
        return calculateTooltipPosition(targetRect);
    }, [targetRect]);

    const handleNext = useCallback(() => {
        if (!currentStep) return;
        setIsAnimating(true);
        setTimeout(() => {
            completeTutorialStep(currentStep.id);
            setStepIndex(0);
            setIsAnimating(false);
        }, 350);
    }, [currentStep, completeTutorialStep]);

    const handleSkip = useCallback(() => skipTutorial(), [skipTutorial]);

    // 不显示条件
    if (!forceVisible && !tutorialState.isTutorialActive) return null;
    if (!currentStep && !forceVisible) return null;

    // 全部完成
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
        <div
            ref={containerRef}
            className={`fixed inset-0 z-[90] transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* ====== 镂空遮罩层 (SVG clip-path) ====== */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 1 }}>
                <defs>
                    {/* 遮罩：默认全黑，目标区域透明 */}
                    <mask id="tutorial-mask">
                        {/* 白色 = 可见区域，黑色 = 遮罩区域 */}
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <>
                                {/* 目标区域镂空（黑色 = 透明） */}
                                <rect
                                    x={targetRect.left - 8}
                                    y={targetRect.top - 8}
                                    width={targetRect.width + 16}
                                    height={targetRect.height + 16}
                                    rx={12}
                                    fill="black"
                                    className={`transition-all duration-400 ease-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                                />
                            </>
                        )}
                    </mask>
                    {/* 聚光灯光晕渐变 */}
                    {targetRect && (
                        <radialGradient id="spotlight-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                            <stop offset="70%" stopColor="#f97316" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        </radialGradient>
                    )}
                </defs>

                {/* 半透明暗色背景（被遮罩镂空） */}
                <rect x="0" y="0" width="100%" height="100%"
                    fill="rgba(0, 0, 0, 0.65)"
                    mask="url(#tutorial-mask)"
                    style={{ backdropFilter: 'blur(2px)' }}
                />

                {/* 聚光灯光晕 */}
                {targetRect && (
                    <ellipse
                        cx={targetRect.left + targetRect.width / 2}
                        cy={targetRect.top + targetRect.height / 2}
                        rx={Math.max(targetRect.width, targetRect.height) * 0.8}
                        ry={Math.max(targetRect.width, targetRect.height) * 0.6}
                        fill="url(#spotlight-glow)"
                        className={`transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                    />
                )}

                {/* 高亮边框（围绕目标元素） */}
                {targetRect && (
                    <rect
                        x={targetRect.left - 6}
                        y={targetRect.top - 6}
                        width={targetRect.width + 12}
                        height={targetRect.height + 12}
                        rx={10}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={2}
                        className={`transition-all duration-400 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                        style={{
                            filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5)) drop-shadow(0 0 16px rgba(249,115,22,0.2))',
                        }}
                    >
                        {/* 边框流动动画 */}
                        <animate
                            attributeName="stroke-opacity"
                            values="1;0.5;1"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </rect>
                )}

                {/* 四角装饰 */}
                {targetRect && (
                    <>
                        {/* 左上角 */}
                        <path d={`M${targetRect.left - 12},${targetRect.top + 4} L${targetRect.left - 12},${targetRect.top - 12} L${targetRect.left + 4},${targetRect.top - 12}`}
                            fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round"
                            className={`transition-all duration-400 ${isAnimating ? 'opacity-0' : 'opacity-100'}`} />
                        {/* 右上角 */}
                        <path d={`M${targetRect.right - 4},${targetRect.top - 12} L${targetRect.right + 12},${targetRect.top - 12} L${targetRect.right + 12},${targetRect.top + 4}`}
                            fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round"
                            className={`transition-all duration-400 ${isAnimating ? 'opacity-0' : 'opacity-100'}`} />
                        {/* 左下角 */}
                        <path d={`M${targetRect.left - 12},${targetRect.bottom - 4} L${targetRect.left - 12},${targetRect.bottom + 12} L${targetRect.left + 4},${targetRect.bottom + 12}`}
                            fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round"
                            className={`transition-all duration-400 ${isAnimating ? 'opacity-0' : 'opacity-100'}`} />
                        {/* 右下角 */}
                        <path d={`M${targetRect.right - 4},${targetRect.bottom + 12} L${targetRect.right + 12},${targetRect.bottom + 12} L${targetRect.right + 12},${targetRect.bottom - 4}`}
                            fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round"
                            className={`transition-all duration-400 ${isAnimating ? 'opacity-0' : 'opacity-100'}`} />
                    </>
                )}
            </svg>

            {/* ====== 提示框卡片（智能定位） ====== */}
            <div
                className="pointer-events-auto z-[92] transition-all duration-400 ease-out"
                style={{
                    position: 'absolute',
                    ...tooltipPlacement.coords,
                    maxHeight: tooltipPlacement.maxHeight,
                    ...(isAnimating ? { opacity: 0, transform: 'translateY(8px)' } : { opacity: 1, transform: 'translateY(0)' }),
                }}
            >
                {/* 指向箭头 */}
                {targetRect && (
                    <ArrowIndicator placement={tooltipPlacement.position} targetRect={targetRect} />
                )}

                <div className="bg-[#131820]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden relative w-[380px] max-w-[calc(100vw-32px)] flex flex-col max-h-full">
                    {/* 顶部装饰线 */}
                    <div className={`shrink-0 h-1 ${
                        currentStep?.phase === 'basics' ? 'bg-indigo-500' :
                        currentStep?.phase === 'economy' ? 'bg-emerald-500' :
                        currentStep?.phase === 'combat' ? 'bg-orange-500' :
                        'bg-purple-500'
                    }`} />

                    <div className="p-5 space-y-3.5 flex flex-col min-h-0">
                        {/* 头部 */}
                        <div className="shrink-0 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                                    currentStep?.phase === 'basics' ? 'bg-indigo-500/20 text-indigo-300' :
                                    currentStep?.phase === 'economy' ? 'bg-emerald-500/20 text-emerald-300' :
                                    currentStep?.phase === 'combat' ? 'bg-orange-500/20 text-orange-300' :
                                    'bg-purple-500/20 text-purple-300'
                                }`}>
                                    {phaseInfo?.icon} {phaseInfo?.name}
                                </span>
                                <span className="text-[10px] text-slate-600">
                                    {completedCount + 1}/{totalSteps}
                                </span>
                            </div>
                            <button onClick={handleSkip}
                                className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-red-400"
                                title="跳过引导">
                                <SkipForward className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 标题 */}
                        <h3 className="shrink-0 text-base font-serif font-bold text-slate-100 leading-tight">
                            {currentStep?.title}
                        </h3>

                        {/* 进度条 */}
                        <div className="shrink-0 space-y-1">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>

                        {/* 内容文本（弹性区域，自动填充剩余空间并滚动） */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                            {currentStep?.content.map((text, idx) =>
                                text === '' ? (
                                    <div key={idx} className="h-2" />
                                ) : (
                                    <p key={idx} className={`text-sm leading-relaxed ${
                                        idx === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'
                                    }`}>{text}</p>
                                )
                            )}
                        </div>

                        {/* 奖励 */}
                        {currentStep?.rewards && Object.keys(currentStep.rewards).length > 0 && (
                            <div className="shrink-0 flex flex-wrap gap-1.5 pt-1">
                                {Object.entries(currentStep.rewards).map(([key, val]) => (
                                    <span key={key} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded border border-amber-500/20">
                                        +{val as number} {resourceLabel(key)}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="shrink-0 flex items-center gap-2.5 pt-1">
                            {currentStep?.skippable ? (
                                <>
                                    <button
                                        onClick={() => stepIndex < availableSteps.length - 1 ? setStepIndex(stepIndex + 1) : handleNext()}
                                        disabled={availableSteps.length <= 1}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                                        下一步
                                    </button>
                                    <button onClick={handleNext}
                                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] text-sm flex items-center justify-center gap-2">
                                        完成并领取奖励 <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleNext}
                                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] text-sm flex items-center justify-center gap-2">
                                    我知道了 <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Hook: 获取目标元素的屏幕位置
// ============================================================
function useTargetRect(
    highlightTarget?: NonNullable<typeof TUTORIAL_STEPS[TutorialStepId]>['highlightTarget']
): DOMRect | null {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!highlightTarget) {
            setRect(null);
            return;
        }

        let el: Element | null = null;

        switch (highlightTarget.type) {
            case 'tab':
                el = document.querySelector(`[data-tab-id="${highlightTarget.id}"]`);
                break;
            case 'element':
                el = document.querySelector(`[data-tutorial-target="${highlightTarget.id}"]`)
                    || document.getElementById(highlightTarget.id)
                    || document.querySelector(`[aria-label="${highlightTarget.id}"]`);
                break;
            case 'area':
                el = document.querySelector(`[data-tutorial-area="${highlightTarget.id}"]`);
                break;
        }

        if (el) {
            const r = el.getBoundingClientRect();
            setRect(r);
        } else {
            setRect(null);
        }
    }, [highlightTarget]);

    return rect;
}

// ============================================================
// 计算提示框最佳位置（避开目标元素）
// ============================================================
function calculateTooltipPosition(
    targetRect: DOMRect
): {
    position: 'top' | 'bottom' | 'left' | 'right';
    coords: { top: number; left: number };
    maxHeight: number;
} {
    const PADDING = 16;
    const GAP = 16;
    const CARD_W = 380;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    type Dir = 'right' | 'bottom' | 'left' | 'top';

    /** 检测矩形是否重叠（含 GAP 间距缓冲） */
    function rectsOverlap(
        t: { top: number; left: number; w: number; h: number },
        r: DOMRect
    ): boolean {
        const separated =
            t.left + t.w + GAP <= r.left ||
            t.left - GAP >= r.right ||
            t.top + t.h + GAP <= r.top ||
            t.top - GAP >= r.bottom;
        return !separated;
    }

    /** 计算某个方向的位置和可用高度 */
    function calcDir(dir: Dir): {
        top: number; left: number; maxH: number;
    } {
        let left: number;
        // 先确定水平位置（左右方向固定，上下方向居中）
        switch (dir) {
            case 'right':  left = targetRect.right + GAP; break;
            case 'left':   left = targetRect.left - CARD_W - GAP; break;
            case 'bottom': left = targetRect.left + targetRect.width / 2 - CARD_W / 2; break;
            case 'top':    left = targetRect.left + targetRect.width / 2 - CARD_W / 2; break;
        }
        left = Math.max(PADDING, Math.min(vw - PADDING - CARD_W, left));

        // 垂直位置：先按方向算理想值，再确保卡片完全在视口内
        let idealTop: number;
        const EST_H = 450; // 卡片预估高度，用于垂直居中计算

        switch (dir) {
            case 'right':
            case 'left':
                // 左右放置：尝试让卡片垂直中心与目标中心对齐
                idealTop = targetRect.top + targetRect.height / 2 - EST_H / 2;
                break;
            case 'bottom':
                idealTop = targetRect.bottom + GAP;
                break;
            case 'top':
                idealTop = targetRect.top - EST_H - GAP;
                break;
        }

        // 钳制：确保顶部不超出视口顶部
        let top = Math.max(PADDING, idealTop);
        // 确保底部不超出视口底部（用预估高度反推最大允许的 top）
        const maxTopForBottomFit = vh - PADDING - EST_H;
        if (top > maxTopForBottomFit) top = maxTopForBottomFit;
        // 再次保证最小值
        top = Math.max(PADDING, top);

        // 实际可用高度 = 从最终位置到底部视口边缘的距离
        const maxH = Math.max(150, vh - top - PADDING);

        return { top, left, maxH };
    }

    // 按优先级尝试：右 > 下 > 左 > 上
    const dirOrder: Dir[] = ['right', 'bottom', 'left', 'top'];

    for (const dir of dirOrder) {
        const pos = calcDir(dir);
        const cardRect = { top: pos.top, left: pos.left, w: CARD_W, h: pos.maxH };
        if (!rectsOverlap(cardRect, targetRect)) {
            return { position: dir, coords: { top: pos.top, left: pos.left }, maxHeight: pos.maxH };
        }
    }

    // 兜底：强制放右侧，紧贴目标但不超出屏幕
    const fbLeft = Math.max(PADDING, targetRect.right + GAP);
    const fbMaxH = Math.max(150, vh - PADDING * 2);
    const fbTop = Math.max(PADDING, vh - PADDING - fbMaxH);
    return { position: 'right', coords: { top: fbTop, left: fbLeft }, maxHeight: fbMaxH };
}

// ============================================================
// 箭头指示器组件
// ============================================================
function ArrowIndicator({
    placement,
    targetRect,
}: {
    placement: 'top' | 'bottom' | 'left' | 'right';
    targetRect: DOMRect;
}) {
    const arrowSize = 10;
    const color = '#131820'; // 卡片背景色
    const borderColor = 'rgba(255,255,255,0.1)';

    // 根据位置计算箭头位置
    const getArrowStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
        };

        switch (placement) {
            case 'bottom':
                return {
                    ...base,
                    top: -arrowSize,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: `${arrowSize}px ${arrowSize}px 0`,
                    borderColor: `${color} transparent transparent transparent`,
                };
            case 'top':
                return {
                    ...base,
                    bottom: -arrowSize,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: `0 ${arrowSize}px ${arrowSize}px`,
                    borderColor: `transparent transparent ${color} transparent`,
                };
            case 'left':
                return {
                    ...base,
                    right: -arrowSize,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
                    borderColor: `transparent transparent transparent ${color}`,
                };
            case 'right':
                return {
                    ...base,
                    left: -arrowSize,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
                    borderColor: `transparent ${color} transparent transparent`,
                };
        }
    };

    return <div style={getArrowStyle()} />;
}

/** 资源名称 */
function resourceLabel(key: string): string {
    const labels: Record<string, string> = {
        bingxiang: '兵饷', iron: '铁锭', food: '粮草', wood: '木材', meteorite: '陨铁', population: '人口',
    };
    return labels[key] || key;
}
