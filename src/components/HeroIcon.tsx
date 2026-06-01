import React from 'react';
import { cn } from '../utils';
import type { Rarity } from '../data';

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; shadow: string; glow: string }> = {
    N: {
        border: 'border-gray-500/40',
        bg: 'bg-gray-500/10',
        shadow: 'shadow-gray-900/20',
        glow: ''
    },
    R: {
        border: 'border-emerald-500/50',
        bg: 'bg-emerald-500/10',
        shadow: 'shadow-emerald-900/30',
        glow: 'group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
    },
    SR: {
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        shadow: 'shadow-orange-900/30',
        glow: 'group-hover:shadow-[0_0_12px_rgba(249,115,22,0.3)]'
    },
    SSR: {
        border: 'border-red-500/60',
        bg: 'bg-red-500/15',
        shadow: 'shadow-red-900/40',
        glow: 'group-hover:shadow-[0_0_16px_rgba(239,68,68,0.4)] animate-pulse'
    }
};

interface HeroIconProps {
    icon: string | null;
    name: string;
    className?: string;
    gradient?: boolean;
    rarity?: Rarity;
    size?: 'sm' | 'md' | 'lg';
}

const HeroIcon = React.forwardRef<HTMLSpanElement, HeroIconProps>(
    ({ icon, name, className, gradient = false, rarity = 'N', size = 'md' }, ref) => {
        const style = RARITY_STYLES[rarity] || RARITY_STYLES.N;
        
        const sizeClasses = {
            sm: 'w-8 h-8 text-sm',
            md: 'w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg',
            lg: 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-xl sm:text-2xl lg:text-3xl'
        };

        if (icon) {
            return (
                <div className={cn(
                    "rounded-lg overflow-hidden border transition-all duration-300",
                    style.border,
                    style.bg,
                    style.shadow,
                    style.glow,
                    sizeClasses[size],
                    className
                )}>
                    <img src={icon} alt={name} className="w-full h-full object-cover" />
                </div>
            );
        }
        
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center font-serif font-bold rounded-lg border transition-all duration-300",
                    style.border,
                    style.bg,
                    style.shadow,
                    style.glow,
                    sizeClasses[size],
                    gradient && rarity === 'N' ? "bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-transparent" : 
                        rarity === 'R' ? "bg-gradient-to-b from-emerald-200 to-emerald-600 bg-clip-text text-transparent" :
                        rarity === 'SR' ? "bg-gradient-to-b from-orange-200 to-orange-600 bg-clip-text text-transparent" :
                        rarity === 'SSR' ? "bg-gradient-to-b from-red-200 to-red-600 bg-clip-text text-transparent" : "",
                    className
                )}
            >
                {name.charAt(0)}
            </span>
        );
    }
);

HeroIcon.displayName = 'HeroIcon';

export default HeroIcon;

export function RarityBadge({ rarity, size = 'sm' }: { rarity: Rarity; size?: 'sm' | 'md' }) {
    const style = RARITY_STYLES[rarity] || RARITY_STYLES.N;
    
    const labels: Record<Rarity, string> = {
        N: '普通',
        R: '稀有',
        SR: '史诗',
        SSR: '传说'
    };
    
    return (
        <span className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
            style.border,
            rarity === 'N' ? 'text-gray-300 bg-gray-500/10' :
            rarity === 'R' ? 'text-emerald-300 bg-emerald-500/10' :
            rarity === 'SR' ? 'text-orange-300 bg-orange-500/10' :
            'text-red-300 bg-red-500/10',
            size === 'md' ? 'text-xs px-2.5 py-1' : ''
        )}>
            {labels[rarity]}
        </span>
    );
}
