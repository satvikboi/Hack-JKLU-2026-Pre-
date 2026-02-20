import { Heart } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t border-border mt-auto bg-bg-secondary/50 backdrop-blur-sm px-6 py-8 text-center relative z-10 w-full">
            <div className="max-w-4xl mx-auto space-y-4">
                <p className="text-accent-teal font-medium flex flex-wrap items-center justify-center gap-2">
                    🔒 Your document is deleted in 60 seconds. We promise.
                </p>
                <p className="text-text-muted text-sm flex items-center justify-center gap-1">
                    Made with <Heart className="w-4 h-4 text-accent-red fill-accent-red" /> for India
                </p>
                <div className="flex justify-center gap-6 text-sm text-text-secondary mt-4">
                    <a href="#" className="hover:text-accent-saffron transition-colors">About</a>
                    <a href="#" className="hover:text-accent-saffron transition-colors">Indian Laws</a>
                    <a href="#" className="hover:text-accent-saffron transition-colors">Privacy Policy</a>
                </div>
            </div>
        </footer>
    );
};
