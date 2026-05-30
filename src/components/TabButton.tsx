import { memo } from 'react';
import { cn } from '../utils';

type Tab = 'city' | 'hospital' | 'market' | 'forge' | 'heroes' | 'gate' | 'barracks' | 'warehouse';

interface TabItem {
    id: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const TabButton = memo(function TabButton({
    t,
    isActive,
    onClick,
    variant = 'sidebar'
}: {
    t: TabItem;
    isActive: boolean;
    onClick: () => void;
    variant?: 'sidebar' | 'mobile';
}) {
    const Icon = t.icon;

    if (variant === 'mobile') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all min-w-0 flex-1 max-w-[16%] mobile-touch-target",
                    isActive
                        ? "text-orange-500"
                        : "text-slate-500 hover:text-slate-300"
                )}
            >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")}/>
                <span className={cn(
                    "text-[8px] sm:text-[9px] font-medium truncate w-full text-center leading-tight",
                    isActive && "font-bold"
                )}>{t.label}</span>
            </button>
        );
    }

    return (
        <button
            key={t.id}
            onClick={onClick}
            className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all outline-none mobile-touch-target",
                isActive
                    ? "bg-orange-600/10 border border-orange-500/30 text-orange-500 shadow-sm"
                    : "border border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 opacity-80 hover:opacity-100"
            )}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="font-medium tracking-wide">{t.label}</span>
        </button>
    );
});
