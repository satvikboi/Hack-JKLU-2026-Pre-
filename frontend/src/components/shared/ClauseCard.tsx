import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Info, CheckCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface ClauseCardProps {
    title: string;
    originalText: string;
    explanation: ReactNode;
    lawReference?: string;
    severity: 'critical' | 'medium' | 'safe' | 'info';
    actionButton?: ReactNode;
}

export const ClauseCard = ({ title, originalText, explanation, lawReference, severity, actionButton }: ClauseCardProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const severityConfig = {
        critical: {
            border: 'border-accent-red/30 hover:border-accent-red/60',
            icon: <AlertTriangle className="w-5 h-5 text-accent-red" />,
            badge: 'bg-accent-red/10 text-accent-red border border-accent-red/20',
            glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.08)]',
            bar: 'bg-accent-red',
        },
        medium: {
            border: 'border-accent-amber/30 hover:border-accent-amber/60',
            icon: <Info className="w-5 h-5 text-accent-amber" />,
            badge: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20',
            glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]',
            bar: 'bg-accent-amber',
        },
        safe: {
            border: 'border-accent-teal/30 hover:border-accent-teal/60',
            icon: <CheckCircle className="w-5 h-5 text-accent-teal" />,
            badge: 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20',
            glow: 'hover:shadow-[0_0_20px_rgba(13,148,136,0.08)]',
            bar: 'bg-accent-teal',
        },
        info: {
            border: 'border-accent-gold/20 hover:border-accent-gold/40',
            icon: <Info className="w-5 h-5 text-accent-gold" />,
            badge: 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20',
            glow: 'hover:shadow-[0_0_20px_rgba(212,160,23,0.08)]',
            bar: 'bg-accent-gold',
        },
    };

    const config = severityConfig[severity];

    return (
        <div className={clsx(
            "glass-panel group transition-all duration-300 rounded-xl relative overflow-hidden",
            config.border, config.glow
        )}>
            {/* Color bar */}
            <div className={clsx("absolute top-0 left-0 w-1 h-full transition-all", config.bar, "group-hover:w-1.5")} />

            {/* Header — clickable to expand */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center gap-4 p-5 pb-3 text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 transition-transform group-hover:scale-110">{config.icon}</div>
                    <h3 className="font-serif text-base text-white group-hover:text-accent-gold transition-colors truncate">{title}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider", config.badge)}>
                        {severity}
                    </span>
                    <ChevronDown className={clsx("w-4 h-4 text-text-muted transition-transform", isExpanded ? "rotate-180" : "")} />
                </div>
            </button>

            {/* Expandable content */}
            <div className={clsx("overflow-hidden transition-all duration-300", isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="px-5 pb-5 space-y-3">
                    {/* Quoted text */}
                    <div className="bg-bg-primary/60 p-3.5 rounded-lg border border-border/30 font-mono text-xs text-text-muted leading-relaxed">
                        <span className="text-text-muted/50 select-none">"</span>{originalText}<span className="text-text-muted/50 select-none">"</span>
                    </div>

                    {/* Explanation */}
                    <div className="text-text-primary text-sm leading-relaxed">
                        {explanation}
                    </div>

                    {/* Law reference */}
                    {lawReference && (
                        <div className="flex items-center gap-2 text-xs text-accent-teal font-medium bg-accent-teal/5 px-3 py-2 rounded-lg border border-accent-teal/10">
                            <span>⚖️</span>
                            <span>{lawReference}</span>
                        </div>
                    )}

                    {/* Action button */}
                    {actionButton && (
                        <div className="pt-3 border-t border-border/30 flex justify-end">
                            {actionButton}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
