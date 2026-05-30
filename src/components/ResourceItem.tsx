import { memo, useMemo } from 'react';
import { cn } from '../utils';

export const ResourceItem = memo(function ResourceItem({ label, value, color, dotColor, sub, icon }: {
    label: string;
    value: number | string;
    color: string;
    dotColor: string;
    sub?: string;
    icon: string;
}) {
    const displayValue = useMemo(() => typeof value === 'number' ? Math.floor(value).toLocaleString() : value, [value]);

    return (
        <div className="flex items-center gap-0.5 sm:gap-1.5 sm:flex-col sm:items-end whitespace-nowrap shrink-0">
             <div className="flex items-center gap-0.5 sm:gap-1.5">
                 <span className="text-[10px] hidden sm:inline">{icon}</span>
                 <div className={cn("w-1.5 h-1.5 sm:w-1 sm:h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0", dotColor)}></div>
                 <span className={cn("font-mono text-[9px] sm:text-xs", color)}>
                     {displayValue}
                 </span>
                 <span className="text-[7px] text-slate-500 sm:hidden">{label}</span>
             </div>
             <span className="text-[8px] lg:text-[10px] text-slate-500 hidden sm:inline">{label}</span>
             {sub && <span className="text-[6px] sm:text-[7px] text-slate-600 leading-none hidden lg:block">{sub}</span>}
        </div>
    );
});
