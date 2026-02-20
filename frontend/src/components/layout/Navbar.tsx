import { Link } from 'react-router-dom';
import { Scale, Menu } from 'lucide-react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { SessionTimer } from '../shared/SessionTimer';
import { useLanguage } from '../../hooks/useLanguage';

interface NavbarProps {
    onMenuClick?: () => void;
    showMenuBtn?: boolean;
}

export const Navbar = ({ onMenuClick, showMenuBtn }: NavbarProps) => {
    const { t } = useLanguage();

    return (
        <nav className="sticky top-0 w-full z-40 glass border-b border-border/50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-4">
                        {showMenuBtn && (
                            <button
                                onClick={onMenuClick}
                                className="md:hidden text-text-secondary hover:text-white transition-colors"
                                aria-label="Open Menu"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        )}
                        <Link to="/" className="flex items-center gap-2 group">
                            <Scale className="w-7 h-7 text-accent-gold transition-transform group-hover:scale-110 duration-300" />
                            <span className="font-serif text-xl tracking-wide hidden sm:block">
                                <span className="text-accent-gold">Legal</span>
                                <span className="text-white">Saathi</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <SessionTimer />
                        <LanguageSwitcher />
                        <Link
                            to="/analyze"
                            className="hidden lg:flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-accent-saffron text-black hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(255,153,51,0.3)] hover:shadow-[0_0_25px_rgba(255,153,51,0.5)]"
                        >
                            {t('nav.newAnalysis')}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};
