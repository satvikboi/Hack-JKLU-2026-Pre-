import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

export interface ClauseCardProps {
    title: string;
    originalText: string;
    explanation: ReactNode;
    lawReference?: string;
    severity: 'critical' | 'medium' | 'safe' | 'info';
    actionButton?: ReactNode;
}

export const ClauseCard = ({ title, originalText, explanation, lawReference, severity, actionButton }: ClauseCardProps) => {
    const severityConfig = {
        critical: { border: 'border-accent-red/50 hover:border-accent-red', icon: <AlertTriangle className="w-5 h-5 text-accent-red" />, badge: 'bg-accent-red/10 text-accent-red' },
        medium: { border: 'border-accent-amber/50 hover:border-accent-amber', icon: <Info className="w-5 h-5 text-accent-amber" />, badge: 'bg-accent-amber/10 text-accent-amber' },
        safe: { border: 'border-accent-teal/50 hover:border-accent-teal', icon: <CheckCircle className="w-5 h-5 text-accent-teal" />, badge: 'bg-accent-teal/10 text-accent-teal' },
        info: { border: 'border-border hover:border-accent-gold/50', icon: <Info className="w-5 h-5 text-accent-gold" />, badge: 'bg-accent-gold/10 text-accent-gold' }
    };

    const config = severityConfig[severity];

    return (
        <div className={clsx("glass-panel group transition-all duration-300 p-5 rounded-xl flex flex-col gap-3 relative overflow-hidden", config.border)}>
            <div className={clsx("absolute top-0 left-0 w-1 h-full", severity === 'critical' ? 'bg-accent-red' : severity === 'medium' ? 'bg-accent-amber' : severity === 'safe' ? 'bg-accent-teal' : 'bg-transparent')} />

            <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1">{config.icon}</div>
                    <h3 className="font-serif text-lg text-white group-hover:text-accent-gold transition-colors">{title}</h3>
                </div>
                <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap", config.badge)}>
                    {severity.toUpperCase()}
                </span>
            </div>

            <div className="bg-bg-primary/50 p-3 rounded-md border border-border/50 font-mono text-sm text-text-muted mt-2">
                "{originalText}"
            </div>

            <div className="text-text-primary text-sm leading-relaxed mt-2">
                {explanation}
            </div>

            {lawReference && (
                <div className="text-xs text-accent-teal font-medium mt-1">
                    ⚖️ {lawReference}
                </div>
            )}

            {actionButton && (
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                    {actionButton}
                </div>
            )}
        </div>
    );
};
