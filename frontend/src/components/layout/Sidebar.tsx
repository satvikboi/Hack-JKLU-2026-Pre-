import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import {
    LayoutDashboard,
    Upload,
    FileText,
    GitCompare,
    Mic,
    Scale,
    Settings as SettingsIcon,
    ShieldAlert,
    X
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = ({ isOpen, setOpen }: { isOpen: boolean; setOpen: (v: boolean) => void }) => {
    const { t } = useLanguage();
    const location = useLocation();

    const links = [
        { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t('nav.home') || 'Home' },
        { to: '/analyze', icon: <Upload className="w-5 h-5" />, label: t('nav.newAnalysis') || 'New Analysis', primary: true },
        { to: '/results', icon: <FileText className="w-5 h-5" />, label: t('nav.myAnalyses') || 'My Analyses' },
        { to: '/compare', icon: <GitCompare className="w-5 h-5" />, label: t('nav.compareDrafts') || 'Compare Drafts' },
        { to: '/voice', icon: <Mic className="w-5 h-5" />, label: t('nav.voiceAssistant') || 'Voice Assistant' },
        { to: '/laws', icon: <Scale className="w-5 h-5" />, label: t('nav.lawHub') || 'Indian Law Hub' },
        { to: '/settings', icon: <SettingsIcon className="w-5 h-5" />, label: t('nav.settings') || 'Settings' },
    ];

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
            )}

            <div className={clsx(
                "fixed md:sticky top-16 md:top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 glass border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col pt-4",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Mobile close button */}
                <button
                    className="md:hidden absolute top-4 right-4 text-text-secondary hover:text-white"
                    onClick={() => setOpen(false)}
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
                    {links.map(link => {
                        const isActive = location.pathname.startsWith(link.to);
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setOpen(false)}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-bg-tertiary text-white border border-white/10"
                                        : "text-text-secondary hover:bg-bg-tertiary/50 hover:text-white",
                                    link.primary && !isActive && "text-accent-saffron hover:text-accent-saffron mt-2 border border-accent-saffron/20 hover:border-accent-saffron/50 shadow-[0_0_10px_rgba(255,153,51,0.05)]"
                                )}
                            >
                                <div className={clsx("transition-transform group-hover:scale-110", isActive ? "text-accent-saffron" : "")}>
                                    {link.icon}
                                </div>
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 mt-auto border-t border-border/50">
                    <div className="bg-bg-primary/50 rounded-lg p-4 border border-border">
                        <div className="flex items-start gap-2 text-text-muted text-xs mb-3">
                            <ShieldAlert className="w-4 h-4 text-accent-teal shrink-0" />
                            <p>No account needed. Your privacy is guaranteed by design.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
