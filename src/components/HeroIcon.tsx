import React from 'react';
import { cn } from '../utils';

interface HeroIconProps {
    icon: string | null;
    name: string;
    className?: string;
    gradient?: boolean;
}

const HeroIcon = React.forwardRef<HTMLSpanElement, HeroIconProps>(
    ({ icon, name, className, gradient = false }, ref) => {
        if (icon) {
            return <img src={icon} alt={name} className={cn("object-cover rounded", className)} />;
        }
        return (
            <span
                ref={ref}
                className={cn(
                    "font-serif font-bold",
                    gradient && "bg-gradient-to-b from-slate-200 to-slate-500 bg-clip-text text-transparent",
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
