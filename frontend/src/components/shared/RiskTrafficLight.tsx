import clsx from 'clsx';

type RiskLevel = 'high' | 'medium' | 'safe';
type Size = 'sm' | 'md' | 'lg';

interface RiskTrafficLightProps {
    level: RiskLevel;
    size?: Size;
    className?: string;
}

export const RiskTrafficLight = ({ level, size = 'md', className }: RiskTrafficLightProps) => {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    const containerClasses = {
        sm: 'p-1 gap-1',
        md: 'p-1.5 gap-1.5',
        lg: 'p-2 gap-2'
    };

    return (
        <div className={clsx("flex flex-col bg-bg-secondary border border-border rounded-full", containerClasses[size], className)}>
            <div className={clsx("rounded-full transition-all duration-300", sizeClasses[size], level === 'high' ? 'bg-accent-red shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-bg-tertiary opacity-30')} />
            <div className={clsx("rounded-full transition-all duration-300", sizeClasses[size], level === 'medium' ? 'bg-accent-amber shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-bg-tertiary opacity-30')} />
            <div className={clsx("rounded-full transition-all duration-300", sizeClasses[size], level === 'safe' ? 'bg-accent-teal shadow-[0_0_10px_rgba(13,148,136,0.8)]' : 'bg-bg-tertiary opacity-30')} />
        </div>
    );
};
