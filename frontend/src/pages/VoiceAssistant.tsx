import { Mic, UploadCloud, Play } from 'lucide-react';

export const VoiceAssistant = () => {
    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6 w-full">
            <div className="max-w-3xl w-full flex flex-col items-center">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-2 text-center">Your Voice Lawyer</h1>
                <p className="text-text-secondary text-lg mb-12 text-center">Ask anything in Hindi, Marathi, or Tamil.</p>

                {/* Big Mic Button */}
                <div className="relative mb-16 flex justify-center w-full">
                    <div className="absolute inset-0 bg-accent-saffron/20 rounded-full blur-3xl animate-pulse w-48 h-48 mx-auto top-1/2 -translate-y-1/2" />
                    <button className="relative z-10 w-32 h-32 rounded-full bg-accent-saffron flex items-center justify-center cursor-pointer shadow-[0_0_40px_rgba(255,153,51,0.5)] hover:scale-105 transition-transform group outline-none">
                        <div className="absolute inset-0 border-[3px] border-accent-saffron rounded-full scale-[1.15] opacity-50 group-hover:animate-ping" />
                        <div className="absolute inset-0 border-[2px] border-accent-saffron/50 rounded-full scale-[1.3] opacity-30 group-hover:animate-ping [animation-delay:200ms]" />
                        <Mic className="w-12 h-12 text-black" />
                    </button>
                </div>

                {/* Conversation Mockup */}
                <div className="w-full bg-bg-tertiary/40 border border-border rounded-2xl p-6 backdrop-blur-sm space-y-6">
                    <div className="flex justify-end">
                        <div className="bg-bg-primary border border-border px-5 py-3 rounded-2xl rounded-tr-none max-w-[80%]">
                            <p className="text-white text-sm">"मुझे क्या sign नहीं करना चाहिए एक rent agreement में?"</p>
                        </div>
                    </div>
                    <div className="flex justify-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center shrink-0">
                            <span className="font-serif text-black font-bold">L</span>
                        </div>
                        <div className="flex-1 w-full min-w-0">
                            <div className="bg-accent-teal/10 border border-accent-teal/20 px-5 py-4 rounded-2xl rounded-tl-none max-w-[90%]">
                                <p className="text-white text-sm leading-relaxed mb-3">
                                    Rent agreement में आपको इन चीज़ों को sign करने से बचना चाहिए:<br /><br />
                                    1. 2 महीने से ज़्यादा का security deposit.<br />
                                    2. Lock-in period में भारी पेनाल्टी.<br />
                                    3. 'All repairs by tenant' वाला clause, क्योंकि structural repair मकानमालिक की ज़िम्मेदारी है।
                                </p>
                                <button className="flex items-center gap-2 text-xs font-bold text-accent-teal px-3 py-1.5 rounded-full bg-accent-teal/10 hover:bg-accent-teal/20 transition-colors w-fit">
                                    <Play className="w-3 h-3 fill-accent-teal" /> Play Audio Answer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chips */}
                <div className="mt-12 flex flex-wrap justify-center gap-3 w-full">
                    {["क्या इस contract में hidden charges हैं?", "Security deposit कितना legal है?", "Termination notice kitna hona chahiye?"].map((q, i) => (
                        <button key={i} className="px-4 py-2 rounded-full border border-border bg-bg-secondary text-sm text-text-secondary hover:text-white hover:border-accent-saffron transition-all text-center">
                            "{q}"
                        </button>
                    ))}
                </div>

                <button className="mt-8 flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors">
                    <UploadCloud className="w-4 h-4" /> Or upload a document first to ask specific questions
                </button>
            </div>
        </div>
    );
};
