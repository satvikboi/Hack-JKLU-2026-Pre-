import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, EyeOff, Mail, Upload, Mic, GitCompare } from 'lucide-react';
import { RiskTrafficLight } from '../components/shared/RiskTrafficLight';

export const Dashboard = () => {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-text-secondary">Welcome back. Here's a summary of your session.</p>
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Contracts Analyzed", val: "2", icon: <FileText className="w-5 h-5 text-accent-teal" /> },
                    { label: "High Risk Clauses", val: "7", icon: <AlertTriangle className="w-5 h-5 text-accent-red" /> },
                    { label: "Clauses Missing", val: "3", icon: <EyeOff className="w-5 h-5 text-accent-saffron" /> },
                    { label: "Letters Generated", val: "1", icon: <Mail className="w-5 h-5 text-accent-gold" /> }
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

                    <div className="glass rounded-xl overflow-hidden border border-border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-bg-tertiary/50 border-b border-border/50 text-sm text-text-muted">
                                        <th className="p-4 font-medium">Document Name</th>
                                        <th className="p-4 font-medium">Type</th>
                                        <th className="p-4 font-medium">Risk Score</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {[
                                        { name: "Rental_Agreement_Pune.pdf", type: "Rental", risk: "high", score: 82 },
                                        { name: "Freelance_Contract_TCS.docx", type: "Freelance", risk: "medium", score: 45 }
                                    ].map((doc, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-bg-tertiary/20 transition-colors">
                                            <td className="p-4 font-medium text-white">{doc.name}</td>
                                            <td className="p-4 text-text-secondary">{doc.type}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <RiskTrafficLight level={doc.risk as any} size="sm" />
                                                    <span className={
                                                        doc.risk === 'high' ? 'text-accent-red font-medium' : 'text-accent-amber font-medium'
                                                    }>{doc.score}/100</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Link to="/results" className="text-accent-saffron hover:text-white transition-colors text-xs font-medium px-3 py-1.5 bg-accent-saffron/10 rounded-full border border-accent-saffron/20">
                                                    View Report
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
