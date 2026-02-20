import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyToast = ({ isVisible }: { isVisible: boolean }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!show) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-bg-tertiary border border-accent-teal/30 p-4 rounded-lg shadow-[0_10px_30px_rgba(13,148,136,0.15)] flex gap-3 items-center max-w-sm">
                <ShieldCheck className="w-6 h-6 text-accent-teal flex-shrink-0" />
                <div className="text-sm">
                    <p className="text-white font-medium">✅ Document Encrypted</p>
                    <p className="text-text-secondary mt-0.5">Your document is secure. Auto-deletes in 60:00.</p>
                </div>
            </div>
        </div>
    );
};
