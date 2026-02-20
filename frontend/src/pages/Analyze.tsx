import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Mic, CheckCircle2 } from 'lucide-react';
import { PrivacyToast } from '../components/shared/PrivacyToast';
import { useAnalysis } from '../hooks/useAnalysis';
import clsx from 'clsx';

export const Analyze = () => {
    const navigate = useNavigate();
    const { state, startAnalysis } = useAnalysis();
    const [tab, setTab] = useState<'upload' | 'paste' | 'voice'>('upload');
    const [contractType, setContractType] = useState('Rental');
    const [showToast, setShowToast] = useState(false);

    const handleStart = async () => {
        setShowToast(true);
        await startAnalysis("dummy_data");
        navigate('/results');
    };

    const types = ['Rental', 'Employment', 'Freelance', 'Loan', 'NDA', 'Other'];

    if (state.status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                <div className="max-w-md w-full glass p-8 rounded-2xl">
                    <h2 className="text-2xl font-serif font-bold text-center text-white mb-8">Analyzing Document</h2>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            {state.progress >= 15 ? <CheckCircle2 className="w-6 h-6 text-accent-teal" /> : <div className="w-6 h-6 rounded-full border-2 border-border animate-pulse" />}
                            <span className={clsx("font-medium", state.progress >= 15 ? "text-white" : "text-text-muted")}>Parsing document layout...</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {state.progress >= 45 ? <CheckCircle2 className="w-6 h-6 text-accent-teal" /> : <div className={clsx("w-6 h-6 rounded-full border-2", state.progress >= 15 ? "border-accent-saffron border-t-transparent animate-spin" : "border-border")} />}
                            <span className={clsx("font-medium", state.progress >= 45 ? "text-white" : state.progress >= 15 ? "text-accent-saffron" : "text-text-muted")}>Scanning 847 Indian law clauses...</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {state.progress >= 75 ? <CheckCircle2 className="w-6 h-6 text-accent-teal" /> : <div className={clsx("w-6 h-6 rounded-full border-2", state.progress >= 45 ? "border-accent-saffron border-t-transparent animate-spin" : "border-border")} />}
                            <span className={clsx("font-medium", state.progress >= 75 ? "text-white" : state.progress >= 45 ? "text-accent-saffron" : "text-text-muted")}>Cross-referencing legal database...</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {state.progress >= 100 ? <CheckCircle2 className="w-6 h-6 text-accent-teal" /> : <div className={clsx("w-6 h-6 rounded-full border-2", state.progress >= 75 ? "border-accent-saffron border-t-transparent animate-spin" : "border-border")} />}
                            <span className={clsx("font-medium", state.progress >= 100 ? "text-white" : state.progress >= 75 ? "text-accent-saffron" : "text-text-muted")}>Calculating risk score...</span>
                        </div>
                    </div>

                    <div className="mt-8 bg-accent-teal/10 p-4 rounded-lg border border-accent-teal/20 text-sm">
                        <p className="text-accent-teal font-bold mb-1">💡 Fun Fact</p>
                        <p className="text-text-secondary">Security deposit above 2 months is illegal under the Model Tenancy Act 2021.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
            <div className="mb-10 text-center">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">Upload Contract</h1>
                <p className="text-text-secondary text-lg">We check for trap clauses, impossible notice periods, and illegal fees.</p>
            </div>

            <div className="glass-panel p-2 rounded-2xl mb-8">
                <div className="flex border-b border-border p-2">
                    <button onClick={() => setTab('upload')} className={clsx("flex-1 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", tab === 'upload' ? "bg-bg-tertiary text-white" : "text-text-secondary hover:text-white")}>
                        <UploadCloud className="w-4 h-4" /> Upload PDF
                    </button>
                    <button onClick={() => setTab('paste')} className={clsx("flex-1 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", tab === 'paste' ? "bg-bg-tertiary text-white" : "text-text-secondary hover:text-white")}>
                        <FileText className="w-4 h-4" /> Paste Text
                    </button>
                    <button onClick={() => setTab('voice')} className={clsx("flex-1 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", tab === 'voice' ? "bg-accent-saffron/20 text-accent-saffron" : "text-text-secondary hover:text-white")}>
                        <Mic className="w-4 h-4" /> Speak in Hindi
                    </button>
                </div>

                <div className="p-8 pb-10 min-h-[300px] flex flex-col items-center justify-center">
                    {tab === 'upload' && (
                        <div className="w-full max-w-xl mx-auto border-2 border-dashed border-border hover:border-accent-saffron/50 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group bg-bg-secondary/30 hover:bg-bg-secondary/60">
                            <div className="w-16 h-16 rounded-full bg-accent-saffron/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-8 h-8 text-accent-saffron" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Drop your PDF, DOCX, or Image here</h3>
                            <p className="text-text-muted text-sm">or click to browse files</p>
                        </div>
                    )}
                    {tab === 'paste' && (
                        <textarea
                            className="w-full h-64 bg-bg-secondary border border-border rounded-xl p-4 text-white placeholder-text-muted focus:border-accent-saffron focus:ring-1 focus:ring-accent-saffron outline-none resize-none font-mono text-sm"
                            placeholder="Paste your contract text here..."
                        />
                    )}
                    {tab === 'voice' && (
                        <div className="flex flex-col items-center justify-center gap-6">
                            <button className="w-24 h-24 rounded-full bg-accent-saffron/20 flex items-center justify-center group relative cursor-pointer outline-none">
                                <div className="absolute inset-0 rounded-full border-2 border-accent-saffron scale-110 opacity-0 group-hover:animate-ping" />
                                <div className="w-16 h-16 rounded-full bg-accent-saffron flex items-center justify-center shadow-[0_0_20px_rgba(255,153,51,0.5)]">
                                    <Mic className="w-8 h-8 text-black" />
                                </div>
                            </button>
                            <p className="text-white font-medium">Click to start speaking in Hindi</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Contract Type</h3>
                <div className="flex flex-wrap gap-3">
                    {types.map(type => (
                        <button
                            key={type}
                            onClick={() => setContractType(type)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                contractType === type
                                    ? "bg-accent-saffron/10 text-accent-saffron border-accent-saffron/50"
                                    : "bg-bg-tertiary text-text-secondary border-border hover:border-text-secondary"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleStart}
                className="w-full py-4 bg-accent-saffron text-black font-bold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(255,153,51,0.3)] hover:shadow-[0_0_30px_rgba(255,153,51,0.5)] group"
            >
                Analyze Now <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>

            <PrivacyToast isVisible={showToast} />
        </div>
    );
};
