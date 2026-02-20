import { Lock } from 'lucide-react';
import { useSession } from '../../hooks/useSession';

export const SessionTimer = () => {
    const { formattedTime } = useSession();

    return (
        <div className="flex items-center gap-2 text-xs md:text-sm text-accent-teal font-mono bg-accent-teal/10 px-3 py-1.5 rounded-full border border-accent-teal/20 shadow-[0_0_10px_rgba(13,148,136,0.1)] whitespace-nowrap">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">🔒 Auto-delete in </span>
            <span>{formattedTime}</span>
        </div>
    );
};
