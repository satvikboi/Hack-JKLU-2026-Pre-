import { MessageCircle } from 'lucide-react';

export const WhatsAppButton = ({ text, url = "https://legalsaathi.in" }: { text?: string, url?: string }) => {
    const defaultText = "I just analyzed my contract on LegalSaathi. Risk score: 73/100. 3 critical clauses flagged. Check yours too: ";
    const shareText = encodeURIComponent(`${text || defaultText}${url}`);

    return (
        <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md font-medium transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]"
        >
            <MessageCircle className="w-5 h-5" />
            <span>Share on WhatsApp</span>
        </a>
    );
};
