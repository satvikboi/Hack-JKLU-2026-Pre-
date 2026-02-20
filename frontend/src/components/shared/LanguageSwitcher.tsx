import { useLanguage } from '../../hooks/useLanguage';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    const toggleLang = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as any);
    };

    return (
        <div className="flex items-center gap-2 bg-bg-secondary/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full z-50 transition-all hover:border-accent-saffron/50 focus-within:ring-1 focus-within:ring-accent-saffron w-32 md:w-auto">
            <Globe className="w-4 h-4 text-accent-saffron shrink-0" />
            <select
                value={language}
                onChange={toggleLang}
                className="bg-transparent text-sm text-text-primary outline-none cursor-pointer appearance-none pr-4 w-full"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23F9FAFB' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
            >
                <option value="en" className="bg-bg-primary">English 🇬🇧</option>
                <option value="hi" className="bg-bg-primary">हिंदी 🇮🇳</option>
                <option value="mr" className="bg-bg-primary">मराठी 🇮🇳</option>
                <option value="ta" className="bg-bg-primary">தமிழ் 🇮🇳</option>
            </select>
        </div>
    );
};
