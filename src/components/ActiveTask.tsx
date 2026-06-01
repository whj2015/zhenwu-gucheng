import { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { CRAFTING_TEMPLATES } from '../data';
import { Sparkles } from 'lucide-react';
import { formatTime } from '../utils';

export default function ActiveTask() {
    const crafting = useGameStore((state) => state.crafting);
    const claimCrafting = useGameStore((state) => state.claimCrafting);
    const task = crafting.task;
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!task?.endTime) return;

        let animationFrameId: number;
        const update = () => {
            const rem = task.endTime - Date.now();
            setTimeLeft(Math.max(0, rem));

            if (rem > 0) {
                animationFrameId = requestAnimationFrame(update);
            }
        };

        update();
        return () => cancelAnimationFrame(animationFrameId);
    }, [task?.endTime]);

    if (!task) return null;
    const template = CRAFTING_TEMPLATES[task.templateId];
    const done = timeLeft <= 0;
    const progress = Math.min(100, Math.max(0, 100 - (timeLeft / template.durationMs) * 100));

    return (
        <div className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
            {done ? (
                 <button onClick={claimCrafting} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-[0_4px_15px_rgba(234,88,12,0.3)] animate-pulse flex items-center justify-center gap-2 mobile-touch-target">
                     <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 取出 {template.name}
                 </button>
            ) : (
                <>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-500 mb-1.5 sm:mb-2 uppercase tracking-widest font-mono">
                            <span>锻造中: {template.name}</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-600 to-yellow-500 shadow-[0_0_8px_#f97316] transition-all duration-200 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    <div className="hidden sm:block w-px h-10 sm:h-12 bg-white/10"></div>
                    <div className="text-right w-full sm:w-24">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase tracking-widest">剩余</span>
                        <span className="text-base sm:text-lg font-mono text-orange-400">{formatTime(timeLeft)}</span>
                    </div>
                </>
            )}
        </div>
    );
}
