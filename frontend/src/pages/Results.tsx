import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Mail, Download, ShieldAlert, CheckCircle, Search, FileText, MessageCircle, Sparkles, Clock, Layers } from 'lucide-react';
import { ClauseCard } from '../components/shared/ClauseCard';
import { WhatsAppButton } from '../components/shared/WhatsAppButton';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '../services/api';

export const Results = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'redFlags' | 'missing' | 'safe' | 'viewer'>('redFlags');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showScore, setShowScore] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('analysisResult');
        if (stored) {
            try {
                setResult(JSON.parse(stored));
                setTimeout(() => setShowScore(true), 500);
            } catch { navigate('/analyze'); }
        } else { navigate('/analyze'); }
    }, [navigate]);

    if (!result) return null;

    const riskScore = result.risk_score;
    const riskLevel = result.risk_level;
    const fillColor = riskLevel === 'high' ? '#EF4444' : riskLevel === 'medium' ? '#F59E0B' : '#10B981';
    const data = [{ name: 'Risk', value: showScore ? riskScore : 0, fill: fillColor }];
    const riskColor = riskLevel === 'high' ? 'text-accent-red' : riskLevel === 'medium' ? 'text-accent-amber' : 'text-accent-teal';
    const riskBg = riskLevel === 'high' ? 'bg-accent-red/10 border-accent-red/30' : riskLevel === 'medium' ? 'bg-accent-amber/10 border-accent-amber/30' : 'bg-accent-teal/10 border-accent-teal/30';
    const riskGlow = riskLevel === 'high' ? 'glow-red' : riskLevel === 'medium' ? 'glow-saffron' : 'glow-teal';

    const redFlagCount = result.red_flags.length;
    const missingCount = result.missing_clauses.length;
    const safeCount = result.safe_clauses.length;

    const tabs = [
        { id: 'redFlags', label: `Red Flags`, count: redFlagCount, icon: <ShieldAlert className="w-4 h-4" />, color: 'accent-red' },
        { id: 'missing', label: `Missing`, count: missingCount, icon: <Search className="w-4 h-4" />, color: 'accent-saffron' },
        { id: 'safe', label: `Safe`, count: safeCount, icon: <CheckCircle className="w-4 h-4" />, color: 'accent-teal' },
        { id: 'viewer', label: `Document`, count: null, icon: <FileText className="w-4 h-4" />, color: 'white' },
    ];

    return (
        <div className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)]">

            {/* LEFT PANEL */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-[400px] border-r border-border bg-bg-secondary/30 p-6 lg:overflow-y-auto flex flex-col gap-5 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16"
            >
                {/* Header */}
                <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Analysis Result</span>
                    <h1 className="font-serif text-2xl text-white mt-1 capitalize">{result.contract_type} Agreement</h1>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(result.processing_time_ms / 1000).toFixed(1)}s</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {result.chunks_indexed} chunks</span>
                    </div>
                </div>

                {/* Risk Score Gauge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className={clsx("glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden", riskGlow)}
                >
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={data} startAngle={180} endAngle={0}>
                                <RadialBar background={{ fill: '#1E2A3A' }} dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                            <motion.span
                                className="font-serif text-5xl font-bold text-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                {showScore ? riskScore : '—'}
                            </motion.span>
                            <span className="text-sm font-medium text-text-secondary mt-1">/100</span>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={clsx("text-center mt-[-30px] relative z-10 px-5 py-2 rounded-full border", riskBg)}
                    >
                        <span className={clsx("font-bold text-sm tracking-wider uppercase", riskColor)}>{riskLevel} RISK</span>
                    </motion.div>
                </motion.div>

                {/* Summary */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-bg-tertiary/50 p-5 rounded-xl border border-border"
                >
                    <p className="text-white text-sm leading-relaxed">
                        {result.summary}
                    </p>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-accent-red/5 border border-accent-red/10 rounded-xl p-3 text-center">
                        <span className="block text-2xl font-bold text-accent-red font-serif">{redFlagCount}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Red Flags</span>
                    </div>
                    <div className="bg-accent-saffron/5 border border-accent-saffron/10 rounded-xl p-3 text-center">
                        <span className="block text-2xl font-bold text-accent-saffron font-serif">{missingCount}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Missing</span>
                    </div>
                    <div className="bg-accent-teal/5 border border-accent-teal/10 rounded-xl p-3 text-center">
                        <span className="block text-2xl font-bold text-accent-teal font-serif">{safeCount}</span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Safe</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 mt-auto pt-4">
                    <Link to="/ask" className="w-full py-3 bg-accent-teal text-black font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-teal-400 transition-all glow-teal group">
                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Ask About This Contract
                    </Link>
                    <Link to="/pushback" className="w-full py-3 bg-gradient-to-r from-accent-saffron to-orange-400 text-black font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(255,153,51,0.4)] transition-all group">
                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" /> Generate Pushback Email
                    </Link>
                    <button className="w-full py-3 glass text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                        <Download className="w-4 h-4" /> Download PDF Report
                    </button>
                    <WhatsAppButton text={`Checked my ${result.contract_type} on LegalSaathi. Risk: ${riskScore}/100. Check yours!`} />
                </div>
            </motion.div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden min-h-screen lg:min-h-0">
                {/* Tabs */}
                <div className="flex border-b border-border px-4 md:px-6 pt-3 gap-1 overflow-x-auto sticky top-16 md:top-0 bg-bg-primary/95 backdrop-blur-xl z-20">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={clsx(
                                "pb-3 px-4 font-medium text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all relative",
                                activeTab === t.id
                                    ? `border-${t.color} text-${t.color}`
                                    : "border-transparent text-text-muted hover:text-text-secondary"
                            )}
                            style={activeTab === t.id ? {
                                borderBottomColor: t.color === 'accent-red' ? '#EF4444' : t.color === 'accent-saffron' ? '#FF9933' : t.color === 'accent-teal' ? '#0D9488' : '#F9FAFB',
                                color: t.color === 'accent-red' ? '#EF4444' : t.color === 'accent-saffron' ? '#FF9933' : t.color === 'accent-teal' ? '#0D9488' : '#F9FAFB',
                            } : {}}
                        >
                            {t.icon} {t.label}
                            {t.count !== null && (
                                <span className={clsx(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                    activeTab === t.id ? "bg-white/20" : "bg-bg-tertiary"
                                )}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl mx-auto space-y-5"
                        >

                            {activeTab === 'redFlags' && (
                                <>
                                    {redFlagCount === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto mb-5 glow-teal">
                                                <CheckCircle className="w-10 h-10 text-accent-teal" />
                                            </div>
                                            <h3 className="text-xl font-serif text-white mb-2">No Red Flags!</h3>
                                            <p className="text-text-secondary">This contract appears to comply with Indian law.</p>
                                        </div>
                                    ) : result.red_flags.map((flag, i) => (
                                        <motion.div
                                            key={flag.flag_id || i}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <ClauseCard
                                                severity={flag.severity === 'low' ? 'medium' : flag.severity}
                                                title={flag.clause_title}
                                                originalText={flag.quoted_text}
                                                explanation={
                                                    <div>
                                                        <p>{flag.plain_explanation}</p>
                                                        {flag.recommendation && (
                                                            <p className="mt-2 text-accent-saffron text-xs font-medium flex items-center gap-1.5">
                                                                <Sparkles className="w-3 h-3" /> {flag.recommendation}
                                                            </p>
                                                        )}
                                                        {flag.replacement_clause && (
                                                            <div className="mt-3 bg-accent-teal/5 p-3 rounded-lg border border-accent-teal/10 text-xs">
                                                                <span className="text-accent-teal font-bold flex items-center gap-1.5 mb-1"><CheckCircle className="w-3 h-3" /> Suggested replacement:</span>
                                                                <p className="text-text-secondary italic">{flag.replacement_clause}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                                lawReference={flag.law_reference}
                                                actionButton={<Link to="/pushback" className="text-accent-red text-sm font-medium hover:underline flex items-center gap-1">Draft Pushback <span>&rarr;</span></Link>}
                                            />
                                        </motion.div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'missing' && (
                                <>
                                    {missingCount === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto mb-5 glow-teal">
                                                <CheckCircle className="w-10 h-10 text-accent-teal" />
                                            </div>
                                            <h3 className="text-xl font-serif text-white mb-2">All Clauses Present</h3>
                                            <p className="text-text-secondary">No missing standard clauses detected.</p>
                                        </div>
                                    ) : result.missing_clauses.map((clause, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <ClauseCard
                                                severity="info"
                                                title={clause.clause_name}
                                                originalText="[Clause Not Found in Document]"
                                                explanation={
                                                    <div>
                                                        <p>{clause.description}</p>
                                                        <p className="mt-2 text-accent-red text-xs font-medium">⚠️ Risk: {clause.risk_if_absent}</p>
                                                    </div>
                                                }
                                                lawReference={clause.law_reference}
                                                actionButton={
                                                    <div className="w-full">
                                                        <div className="text-accent-teal text-xs font-bold mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Suggested Clause:</div>
                                                        <div className="bg-accent-teal/5 p-3 rounded-lg text-xs text-text-secondary border border-accent-teal/10 italic leading-relaxed">{clause.suggested_clause}</div>
                                                    </div>
                                                }
                                            />
                                        </motion.div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'safe' && (
                                <>
                                    {safeCount === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-5">
                                                <FileText className="w-10 h-10 text-text-muted" />
                                            </div>
                                            <h3 className="text-xl font-serif text-white mb-2">No Safe Clauses Identified</h3>
                                            <p className="text-text-secondary">The analysis didn't flag any clauses as safe.</p>
                                        </div>
                                    ) : result.safe_clauses.map((clause, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <ClauseCard
                                                severity="safe"
                                                title={clause.clause_title}
                                                originalText={clause.quoted_text}
                                                explanation={clause.explanation}
                                            />
                                        </motion.div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'viewer' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-2xl p-8 shadow-2xl font-serif text-black leading-loose text-sm md:text-base min-h-[500px] relative"
                                >
                                    <div className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-[10px] font-sans font-medium px-3 py-1 rounded-full">ORIGINAL TEXT</div>
                                    {result.contract_text ? (
                                        <div className="mt-6 space-y-6">
                                            {/* Render contract text with inline highlights */}
                                            {(() => {
                                                let displayText = result.contract_text;
                                                const highlights: { text: string; severity: string; title: string; explanation: string; law: string }[] = [];
                                                result.red_flags.forEach(flag => {
                                                    if (flag.quoted_text && displayText.includes(flag.quoted_text)) {
                                                        highlights.push({
                                                            text: flag.quoted_text,
                                                            severity: flag.severity,
                                                            title: flag.clause_title,
                                                            explanation: flag.plain_explanation,
                                                            law: flag.law_reference,
                                                        });
                                                    }
                                                });

                                                // Sort highlights by position (first occurrence)
                                                highlights.sort((a, b) => displayText.indexOf(a.text) - displayText.indexOf(b.text));

                                                if (highlights.length === 0) {
                                                    // No inline highlights possible — show plain text + flags below
                                                    return (
                                                        <>
                                                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{displayText}</div>
                                                            {result.red_flags.length > 0 && (
                                                                <div className="mt-8 border-t border-gray-200 pt-6 space-y-3">
                                                                    <h4 className="text-xs font-sans font-bold text-red-500 uppercase tracking-wider mb-3">⚠️ Flagged Clauses</h4>
                                                                    {result.red_flags.map((flag, i) => (
                                                                        <div key={i} className={clsx(
                                                                            "p-3 rounded-lg border-l-4",
                                                                            flag.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                                                                        )}>
                                                                            <span className="text-[10px] font-sans font-bold text-red-500 uppercase tracking-wider block mb-1">
                                                                                {flag.severity} • {flag.clause_title}
                                                                            </span>
                                                                            <p className="text-gray-700 text-xs font-sans">"{flag.quoted_text}"</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                }

                                                // Build segments with highlights
                                                const segments: { type: 'text' | 'highlight'; content: string; meta?: typeof highlights[0] }[] = [];
                                                let remaining = displayText;

                                                for (const h of highlights) {
                                                    const idx = remaining.indexOf(h.text);
                                                    if (idx === -1) continue;
                                                    if (idx > 0) {
                                                        segments.push({ type: 'text', content: remaining.slice(0, idx) });
                                                    }
                                                    segments.push({ type: 'highlight', content: h.text, meta: h });
                                                    remaining = remaining.slice(idx + h.text.length);
                                                }
                                                if (remaining) {
                                                    segments.push({ type: 'text', content: remaining });
                                                }

                                                return (
                                                    <>
                                                        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                                            {segments.map((seg, i) => {
                                                                if (seg.type === 'text') {
                                                                    return <span key={i}>{seg.content}</span>;
                                                                }
                                                                const isCritical = seg.meta?.severity === 'critical';
                                                                return (
                                                                    <span
                                                                        key={i}
                                                                        className={clsx(
                                                                            "relative group cursor-help rounded px-0.5 transition-colors",
                                                                            isCritical
                                                                                ? "bg-red-100 border-b-2 border-red-400 hover:bg-red-200"
                                                                                : "bg-yellow-100 border-b-2 border-yellow-400 hover:bg-yellow-200"
                                                                        )}
                                                                    >
                                                                        {seg.content}
                                                                        {/* Tooltip */}
                                                                        <span className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white p-3 text-xs rounded-lg hidden group-hover:block z-50 w-72 leading-tight shadow-2xl font-sans whitespace-normal">
                                                                            <span className={clsx("font-bold block mb-1", isCritical ? "text-red-400" : "text-yellow-400")}>
                                                                                {seg.meta?.severity?.toUpperCase()} • {seg.meta?.title}
                                                                            </span>
                                                                            <span className="block mb-1">{seg.meta?.explanation}</span>
                                                                            {seg.meta?.law && (
                                                                                <span className="text-blue-300 block mt-1">⚖️ {seg.meta.law}</span>
                                                                            )}
                                                                        </span>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                        {/* Missing clauses at the bottom */}
                                                        {result.missing_clauses.length > 0 && (
                                                            <div className="mt-6 space-y-2">
                                                                {result.missing_clauses.map((clause, i) => (
                                                                    <div key={`m-${i}`} className="border-2 border-orange-400 border-dashed rounded-lg p-4 text-orange-600 font-sans text-xs flex items-center gap-2 hover:bg-orange-50 transition-colors">
                                                                        <span className="text-lg">+</span> Missing: <strong>{clause.clause_name}</strong> — {clause.risk_if_absent}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                            <h3 className="text-lg font-sans font-semibold text-gray-500 mb-2">No Document Text Available</h3>
                                            <p className="text-gray-400 font-sans text-sm max-w-xs">Upload a new contract to see the full document here with highlighted clauses.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
