import { useState } from 'react';
import { GitCompare, UploadCloud, AlertTriangle, FileText } from 'lucide-react';

export const CompareDrafts = () => {
    const [step, setStep] = useState(1);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col items-center">
            <div className="mb-10 text-center max-w-2xl w-full">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">Compare Drafts</h1>
                <p className="text-text-secondary text-lg">Upload the original and the new version to instantly spot hidden changes, sneaky additions, or removed protections.</p>
            </div>

            {step === 1 ? (
                <div className="w-full space-y-8 flex flex-col items-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                        {/* Version 1 */}
                        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-border hover:border-accent-saffron/50 transition-colors cursor-pointer group min-h-[300px]">
                            <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-text-muted group-hover:text-accent-saffron transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Original Draft</h3>
                            <p className="text-text-muted text-sm mb-6">Upload Version 1 (PDF or DOCX)</p>
                            <button className="px-6 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-white transition-colors flex items-center gap-2 border border-border">
                                <UploadCloud className="w-4 h-4" /> Browse
                            </button>
                        </div>

                        {/* Version 2 */}
                        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-border hover:border-accent-teal/50 transition-colors cursor-pointer group min-h-[300px]">
                            <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-text-muted group-hover:text-accent-teal transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">New Draft</h3>
                            <p className="text-text-muted text-sm mb-6">Upload Version 2 (PDF or DOCX)</p>
                            <button className="px-6 py-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-white transition-colors flex items-center gap-2 border border-border">
                                <UploadCloud className="w-4 h-4" /> Browse
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center w-full">
                        <button
                            onClick={() => setStep(2)}
                            className="px-10 py-4 bg-accent-saffron text-black font-bold rounded-xl text-lg flex items-center gap-2 hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(255,153,51,0.3)] hover:scale-105"
                        >
                            <GitCompare className="w-5 h-5" /> Compare Now
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full space-y-6">
                    <div className="bg-bg-tertiary border border-border p-6 rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <GitCompare className="w-5 h-5 text-accent-saffron" /> Comparison Summary
                            </h2>
                            <p className="text-text-secondary mt-1">Found 6 differences between Version 1 and Version 2.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-accent-red" /> <span>3 removed</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-accent-teal" /> <span>2 added</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-accent-amber" /> <span>1 modified</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-px bg-border rounded-xl flex-grow glass overflow-hidden max-w-none">
                        {/* Header */}
                        <div className="bg-bg-secondary p-4 font-medium text-text-muted border-b border-border">Original Version</div>
                        <div className="bg-bg-secondary p-4 font-medium text-text-muted border-b border-border hidden lg:block">New Version</div>

                        {/* Row 1: Removal */}
                        <div className="bg-bg-primary p-6 lg:border-r border-border border-b border-border lg:border-b">
                            <p className="font-mono text-sm leading-relaxed text-text-secondary">
                                <span className="bg-accent-red/20 text-red-200 line-through rounded px-1">"The landlord shall be responsible for all major structural repairs and plumbing issues."</span>
                            </p>
                        </div>
                        <div className="bg-bg-primary p-6 lg:border-l border-border border-b border-border lg:border-b relative">
                            <div className="absolute top-4 right-4 bg-accent-red/10 text-accent-red text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> REMOVED
                            </div>
                            <p className="font-mono text-sm leading-relaxed text-text-muted italic">
                                [Clause removed in new draft]
                            </p>
                            <div className="mt-4 text-sm text-text-primary bg-bg-tertiary p-3 rounded border border-border">
                                <span className="font-bold text-accent-red">Risk:</span> They quietly removed their repair obligations. You might have to pay for expensive structural fixes now.
                            </div>
                        </div>

                        {/* ... other rows (simplified for brevity) */}

                        <div className="col-span-1 lg:col-span-2 p-6 flex justify-center bg-bg-secondary border-t border-border mt-auto">
                            <button onClick={() => setStep(1)} className="text-text-muted hover:text-white flex items-center gap-2 transition-colors">
                                &larr; Upload different drafts
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};
