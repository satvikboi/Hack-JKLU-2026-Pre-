import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Shield, Scale } from 'lucide-react';
import { PrivacyToast } from '../components/shared/PrivacyToast';
import { useAnalysis } from '../hooks/useAnalysis';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const Analyze = () => {
    const navigate = useNavigate();
    const { state, startAnalysis } = useAnalysis();
    const [tab, setTab] = useState<'paste' | 'upload'>('paste');
    const [contractType, setContractType] = useState('loan');
    const [showToast, setShowToast] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStart = async () => {
        if (tab === 'paste' && !pasteText.trim()) return;
        if (tab === 'upload' && !selectedFile) return;

        setShowToast(true);
        try {
            const result = await startAnalysis(
                pasteText,
                contractType,
                'en',
                selectedFile || undefined,
            );
            sessionStorage.setItem('analysisResult', JSON.stringify(result));
            // Accumulate history for dashboard
            const history = JSON.parse(sessionStorage.getItem('analysisHistory') || '[]');
            history.unshift({
                ...result,
                _fileName: selectedFile?.name || 'Pasted Text',
                _analyzedAt: new Date().toISOString(),
            });
            sessionStorage.setItem('analysisHistory', JSON.stringify(history));
            navigate('/results');
        } catch { /* error handled by hook */ }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) setSelectedFile(file);
    };

    const types = [
        { id: 'loan', label: 'Loan', emoji: '🏦' },
        { id: 'rental', label: 'Rental', emoji: '🏠' },
        { id: 'employment', label: 'Employment', emoji: '💼' },
        { id: 'freelance', label: 'Freelance', emoji: '🎯' },
        { id: 'nda', label: 'NDA', emoji: '🔒' },
        { id: 'consumer', label: 'Consumer', emoji: '🛒' },
        { id: 'startup', label: 'Startup', emoji: '🚀' },
        { id: 'general', label: 'Other', emoji: '📄' },
    ];

    const canSubmit = tab === 'paste' ? pasteText.trim().length > 20 : !!selectedFile;

    // ── Processing State ─────────────────────────────────
    if (state.status === 'processing') {
        const stages = [
            { threshold: 15, label: 'Parsing & chunking document...', icon: '📄' },
            { threshold: 35, label: 'Embedding with multilingual-e5-large...', icon: '🧠' },
            { threshold: 60, label: 'Scanning 684 Indian Central Acts...', icon: '⚖️' },
            { threshold: 85, label: 'Qwen3 235B risk scoring...', icon: '🔍' },
        ];

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full"
                >
                    {/* Animated header */}
                    <div className="text-center mb-10">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="inline-block mb-4"
                        >
                            <Scale className="w-12 h-12 text-accent-gold" />
                        </motion.div>
                        <h2 className="text-3xl font-serif font-bold text-white">Analyzing Your Contract</h2>
                        <p className="text-text-muted text-sm mt-2">AI is cross-referencing Indian law database...</p>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-8 relative">
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-accent-saffron via-accent-gold to-accent-teal rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min(state.progress, 100)}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <span className="text-xs text-text-muted mt-2 block text-right">{Math.round(state.progress)}%</span>
                    </div>

                    {/* Stage checklist */}
                    <div className="glass-panel rounded-2xl p-6 space-y-4">
                        {stages.map((stage, i) => {
                            const isComplete = state.progress >= stage.threshold;
                            const isActive = !isComplete && (i === 0 || state.progress >= stages[i - 1].threshold);
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15 }}
                                    className="flex items-center gap-4"
                                >
                                    {isComplete ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                                            <CheckCircle2 className="w-6 h-6 text-accent-teal" />
                                        </motion.div>
                                    ) : isActive ? (
                                        <div className="w-6 h-6 rounded-full border-2 border-accent-saffron border-t-transparent animate-spin" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-border" />
                                    )}
                                    <span className={clsx(
                                        "font-medium text-sm flex items-center gap-2",
                                        isComplete ? "text-white" : isActive ? "text-accent-saffron" : "text-text-muted"
                                    )}>
                                        <span>{stage.icon}</span> {stage.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Fun fact */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-6 bg-accent-teal/5 p-4 rounded-xl border border-accent-teal/10 text-sm"
                    >
                        <p className="text-accent-teal font-bold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Did you know?</p>
                        <p className="text-text-secondary">Your analysis references 684 Indian Central Acts from indiacode.nic.in — the most comprehensive legal database available.</p>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // ── Error State ──────────────────────────────────────
    if (state.status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-panel p-10 rounded-2xl text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-accent-red/10 flex items-center justify-center mx-auto mb-6 glow-red">
                        <AlertCircle className="w-10 h-10 text-accent-red" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-white mb-3">Analysis Failed</h2>
                    <p className="text-text-secondary mb-8 text-sm leading-relaxed">{state.error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-accent-saffron text-black font-bold rounded-xl hover:bg-orange-400 transition-all glow-saffron"
                    >
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Main Form ────────────────────────────────────────
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-saffron/10 border border-accent-saffron/20 text-accent-saffron text-xs font-medium mb-4">
                    <Shield className="w-3.5 h-3.5" /> Privacy-First Analysis • No Data Stored
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">
                    Analyze <span className="text-gradient-saffron">Contract</span>
                </h1>
                <p className="text-text-secondary text-lg max-w-xl mx-auto">Paste your agreement text or upload a document. We'll scan it against <strong className="text-white">684 Indian Central Acts</strong>.</p>
            </motion.div>

            {/* Tab Switcher */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden mb-8"
            >
                <div className="flex p-2 gap-2">
                    <button
                        onClick={() => setTab('paste')}
                        className={clsx(
                            "flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                            tab === 'paste'
                                ? "bg-accent-saffron/10 text-accent-saffron border border-accent-saffron/30 glow-saffron"
                                : "text-text-secondary hover:text-white hover:bg-bg-tertiary/50"
                        )}
                    >
                        <FileText className="w-4 h-4" /> Paste Text
                    </button>
                    <button
                        onClick={() => setTab('upload')}
                        className={clsx(
                            "flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                            tab === 'upload'
                                ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/30 glow-teal"
                                : "text-text-secondary hover:text-white hover:bg-bg-tertiary/50"
                        )}
                    >
                        <UploadCloud className="w-4 h-4" /> Upload File
                    </button>
                </div>

                <div className="p-6 md:p-8 min-h-[280px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {tab === 'paste' && (
                            <motion.div
                                key="paste"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full"
                            >
                                <textarea
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    className="w-full h-56 bg-bg-primary/50 border border-border rounded-xl p-5 text-white placeholder-text-muted focus:border-accent-saffron/50 focus:ring-2 focus:ring-accent-saffron/10 outline-none resize-none font-mono text-sm leading-relaxed transition-all"
                                    placeholder={`Paste your contract / agreement text here...\n\nExample:\n"This Loan Agreement is made between ABC Finance Ltd and Mr. Kumar.\nThe annual interest rate shall be 36% compounded monthly.\nBorrower agrees to waive all rights to prepayment..."`}
                                />
                                {pasteText.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-between mt-3"
                                    >
                                        <span className={clsx(
                                            "text-xs font-medium flex items-center gap-1.5",
                                            pasteText.length > 20 ? "text-accent-teal" : "text-text-muted"
                                        )}>
                                            {pasteText.length > 20 && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {pasteText.length} characters {pasteText.length <= 20 ? '(min 20 required)' : '— Ready to analyze'}
                                        </span>
                                        <button onClick={() => setPasteText('')} className="text-xs text-text-muted hover:text-accent-red transition-colors">Clear</button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                        {tab === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full"
                            >
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    className={clsx(
                                        "w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                                        isDragOver
                                            ? "border-accent-teal bg-accent-teal/5 scale-[1.01]"
                                            : selectedFile
                                                ? "border-accent-teal/50 bg-accent-teal/5"
                                                : "border-border hover:border-accent-saffron/50 bg-bg-primary/30 hover:bg-bg-primary/50"
                                    )}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} className="hidden" />
                                    <div className={clsx(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all",
                                        selectedFile ? "bg-accent-teal/10" : "bg-accent-saffron/10 group-hover:scale-110"
                                    )}>
                                        {selectedFile ? (
                                            <CheckCircle2 className="w-8 h-8 text-accent-teal" />
                                        ) : (
                                            <UploadCloud className={clsx("w-8 h-8 transition-colors", isDragOver ? "text-accent-teal" : "text-accent-saffron")} />
                                        )}
                                    </div>
                                    {selectedFile ? (
                                        <>
                                            <h3 className="text-lg font-semibold text-accent-teal mb-1">{selectedFile.name}</h3>
                                            <p className="text-text-muted text-sm">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change file</p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-white mb-1">Drop your file here</h3>
                                            <p className="text-text-muted text-sm">PDF, DOCX, DOC, PPTX, TXT, or Image • Click to browse</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Contract Type Selector */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
            >
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Contract Type
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {types.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setContractType(type.id)}
                            className={clsx(
                                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center gap-2",
                                contractType === type.id
                                    ? "bg-accent-saffron/10 text-accent-saffron border-accent-saffron/40 glow-saffron scale-105"
                                    : "bg-bg-tertiary/50 text-text-secondary border-border hover:border-text-secondary hover:text-white hover:bg-bg-tertiary"
                            )}
                        >
                            <span>{type.emoji}</span> {type.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleStart}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                className={clsx(
                    "w-full py-4.5 font-bold rounded-2xl text-lg flex items-center justify-center gap-3 transition-all group relative overflow-hidden",
                    canSubmit
                        ? "bg-gradient-to-r from-accent-saffron to-orange-400 text-black cursor-pointer shadow-[0_0_30px_rgba(255,153,51,0.3)] hover:shadow-[0_0_50px_rgba(255,153,51,0.5)]"
                        : "bg-bg-tertiary text-text-muted cursor-not-allowed border border-border"
                )}
            >
                {canSubmit ? (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Analyze Now
                        <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                    </>
                ) : (
                    'Paste contract text or upload a file to proceed'
                )}
            </motion.button>

            <PrivacyToast isVisible={showToast} />
        </div>
    );
};
