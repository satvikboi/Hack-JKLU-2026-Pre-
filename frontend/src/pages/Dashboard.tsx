import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, EyeOff, Mail, Upload, Mic, GitCompare, Trash2, Clock } from 'lucide-react';
import { RiskTrafficLight } from '../components/shared/RiskTrafficLight';
import type { AnalysisResult } from '../services/api';

interface HistoryEntry extends AnalysisResult {
    _fileName: string;
    _analyzedAt: string;
}

export const Dashboard = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisHistory');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch { /* ignore bad data */ }
        }
    }, []);

    const stats = useMemo(() => {
        const contractsAnalyzed = history.length;
        const highRiskClauses = history.reduce((sum, h) => sum + (h.red_flags?.length || 0), 0);
        const clausesMissing = history.reduce((sum, h) => sum + (h.missing_clauses?.length || 0), 0);
        const lettersGenerated = 0; // Will be tracked when pushback generator is used
        return { contractsAnalyzed, highRiskClauses, clausesMissing, lettersGenerated };
    }, [history]);

    const clearHistory = () => {
        sessionStorage.removeItem('analysisHistory');
        setHistory([]);
    };

    const viewReport = (entry: HistoryEntry) => {
        sessionStorage.setItem('analysisResult', JSON.stringify(entry));
    };

    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-text-secondary">
                        {history.length > 0
                            ? `You've analyzed ${history.length} contract${history.length > 1 ? 's' : ''} this session.`
                            : 'Welcome! Upload your first contract to get started.'}
                    </p>
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs text-text-muted hover:text-red-400 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3 h-3" /> Clear History
                    </button>
                )}
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Contracts Analyzed", val: String(stats.contractsAnalyzed), icon: <FileText className="w-5 h-5 text-accent-teal" /> },
                    { label: "High Risk Clauses", val: String(stats.highRiskClauses), icon: <AlertTriangle className="w-5 h-5 text-accent-red" /> },
                    { label: "Clauses Missing", val: String(stats.clausesMissing), icon: <EyeOff className="w-5 h-5 text-accent-saffron" /> },
                    { label: "Letters Generated", val: String(stats.lettersGenerated), icon: <Mail className="w-5 h-5 text-accent-gold" /> }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass-panel p-5 rounded-xl flex items-center justify-between"
                    >
                        <div>
                            <p className="text-text-muted text-sm font-medium mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-white font-serif">{stat.val}</p>
                        </div>
                        <div className="bg-bg-primary p-3 rounded-lg border border-border">
                            {stat.icon}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* RECENT ANALYSES */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white font-serif mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent-gold" /> Recent Analyses
                    </h2>

                    {history.length === 0 ? (
                        <div className="glass rounded-xl border border-border p-12 text-center">
                            <FileText className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
                            <p className="text-text-muted text-sm mb-4">No analyses yet. Upload your first contract to see results here.</p>
                            <Link to="/analyze" className="text-accent-saffron hover:text-white text-sm font-medium transition-colors">
                                Upload a Contract →
                            </Link>
                        </div>
                    ) : (
                        <div className="glass rounded-xl overflow-hidden border border-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-bg-tertiary/50 border-b border-border/50 text-sm text-text-muted">
                                            <th className="p-4 font-medium">Document Name</th>
                                            <th className="p-4 font-medium">Type</th>
                                            <th className="p-4 font-medium">Risk Score</th>
                                            <th className="p-4 font-medium">Flags</th>
                                            <th className="p-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {history.map((entry, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-bg-tertiary/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{entry._fileName}</div>
                                                    <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-2.5 h-2.5" /> {timeAgo(entry._analyzedAt)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-text-secondary capitalize">{entry.contract_type || '—'}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <RiskTrafficLight level={entry.risk_level as any} size="sm" />
                                                        <span className={
                                                            entry.risk_level === 'high' ? 'text-accent-red font-medium'
                                                                : entry.risk_level === 'medium' ? 'text-accent-amber font-medium'
                                                                    : 'text-green-400 font-medium'
                                                        }>{entry.risk_score}/100</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        {(entry.red_flags?.length || 0) > 0 && (
                                                            <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                                                                {entry.red_flags.length} red flags
                                                            </span>
                                                        )}
                                                        {(entry.missing_clauses?.length || 0) > 0 && (
                                                            <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">
                                                                {entry.missing_clauses.length} missing
                                                            </span>
                                                        )}
                                                        {(entry.red_flags?.length || 0) === 0 && (entry.missing_clauses?.length || 0) === 0 && (
                                                            <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Clean</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link
                                                        to="/results"
                                                        onClick={() => viewReport(entry)}
                                                        className="text-accent-saffron hover:text-white transition-colors text-xs font-medium px-3 py-1.5 bg-accent-saffron/10 rounded-full border border-accent-saffron/20"
                                                    >
                                                        View Report
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* QUICK ACTIONS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white font-serif mb-4">Quick Actions</h2>

                    <div className="flex flex-col gap-3">
                        <Link to="/analyze" className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-accent-saffron/50 transition-all group">
                            <div className="bg-accent-saffron/10 p-3 rounded-lg text-accent-saffron group-hover:bg-accent-saffron group-hover:text-black transition-colors">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Upload Contract</h3>
                                <p className="text-xs text-text-muted">Select PDF or Paste Text</p>
                            </div>
                        </Link>

                        <Link to="/voice" className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-accent-teal/50 transition-all group">
                            <div className="bg-accent-teal/10 p-3 rounded-lg text-accent-teal group-hover:bg-accent-teal group-hover:text-black transition-colors">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Voice Assistant</h3>
                                <p className="text-xs text-text-muted">Ask questions in Hindi</p>
                            </div>
                        </Link>

                        <Link to="/compare" className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-text-primary/50 transition-all group">
                            <div className="bg-white/5 p-3 rounded-lg text-text-secondary group-hover:bg-white group-hover:text-black transition-colors">
                                <GitCompare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Compare Drafts</h3>
                                <p className="text-xs text-text-muted">Spot hidden changes</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* TICKER */}
            <div className="mt-12 bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3 overflow-hidden flex items-center">
                <span className="bg-accent-gold text-black text-xs font-bold px-2 py-1 rounded mr-3 whitespace-nowrap shrink-0">LAW UPDATES</span>
                <div className="whitespace-nowrap overflow-hidden relative w-full">
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: "-100%" }}
                        transition={{ ease: "linear", duration: 25, repeat: Infinity }}
                        className="inline-block text-sm text-accent-gold/90 font-medium tracking-wide"
                    >
                        New: Model Tenancy Act 2021 applies in 12 states • Alert: New labour code enforcement from Jan 2025 • Tip: RERA mandatory for all property agreements above 500 sqft
                    </motion.div>
                </div>
            </div>

        </div>
    );
};
