import { useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Mail, Download, ShieldAlert, CheckCircle, Search, FileText } from 'lucide-react';
import { ClauseCard } from '../components/shared/ClauseCard';
import { WhatsAppButton } from '../components/shared/WhatsAppButton';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export const Results = () => {
    const [activeTab, setActiveTab] = useState<'redFlags' | 'missing' | 'safe' | 'viewer'>('redFlags');

    const riskScore = 73;
    const data = [{ name: 'Risk', value: riskScore, fill: '#EF4444' }];

    return (
        <div className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)]">

            {/* LEFT PANEL - Overview */}
            <div className="w-full lg:w-[400px] border-r border-border bg-bg-secondary/30 p-6 lg:overflow-y-auto flex flex-col gap-6 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16">
                <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Analysis Result</span>
                    <h1 className="font-serif text-2xl text-white mt-1">Rental Agreement</h1>
                </div>

                <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={data} startAngle={180} endAngle={0}>
                                <RadialBar background={{ fill: '#1E2A3A' }} dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                            <span className="font-serif text-5xl font-bold text-white">{riskScore}</span>
                            <span className="text-sm font-medium text-text-secondary mt-1">/100</span>
                        </div>
                    </div>
                    <div className="text-center mt-[-30px] relative z-10 bg-accent-red/10 px-4 py-1.5 rounded-full border border-accent-red/30">
                        <span className="text-accent-red font-bold text-sm tracking-wide">HIGH RISK</span>
                    </div>
                </div>

                <div className="bg-bg-tertiary p-5 rounded-xl border border-border">
                    <p className="text-white text-sm leading-relaxed font-medium">
                        This rental agreement has <span className="text-accent-red font-bold">3 critical violations</span> and <span className="text-accent-saffron font-bold">2 missing clauses</span>. You should NOT sign this as-is.
                    </p>
                </div>

                <div className="flex flex-col gap-3 mt-auto pt-6">
                    <Link to="/pushback" className="w-full py-3 bg-accent-saffron text-black font-semibold rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-orange-400 transition-colors shadow-[0_0_15px_rgba(255,153,51,0.2)]">
                        <Mail className="w-4 h-4" /> Generate Pushback Email
                    </Link>
                    <button className="w-full py-3 glass text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                        <Download className="w-4 h-4" /> Download PDF Report
                    </button>
                    <WhatsAppButton text="My landlord tried slipping an illegal eviction clause into my contract. Checked it on LegalSaathi. Score 73/100. Check yours now: " />
                </div>
            </div>

            {/* RIGHT PANEL - Details */}
            <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden min-h-screen lg:min-h-0">
                <div className="flex border-b border-border px-6 pt-4 gap-8 overflow-x-auto sticky top-16 md:top-0 bg-bg-primary/90 backdrop-blur-md z-20">
                    {[
                        { id: 'redFlags', label: 'Red Flags (3)', icon: <ShieldAlert className="w-4 h-4" /> },
                        { id: 'missing', label: 'Missing Clauses (2)', icon: <Search className="w-4 h-4" /> },
                        { id: 'safe', label: 'Safe Clauses (12)', icon: <CheckCircle className="w-4 h-4" /> },
                        { id: 'viewer', label: 'Original Document', icon: <FileText className="w-4 h-4" /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={clsx(
                                "pb-4 font-medium text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors",
                                activeTab === t.id
                                    ? t.id === 'redFlags' ? "border-accent-red text-accent-red" : t.id === 'missing' ? "border-accent-saffron text-accent-saffron" : t.id === 'safe' ? "border-accent-teal text-accent-teal" : "border-white text-white"
                                    : "border-transparent text-text-muted hover:text-text-secondary"
                            )}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {activeTab === 'redFlags' && (
                            <>
                                <ClauseCard
                                    severity="critical"
                                    title="Excessive Security Deposit"
                                    originalText="Tenant shall pay a security deposit equivalent to six (6) months of rent upfront before moving in."
                                    explanation="Landlords can legally charge a maximum of 2 months rent as security deposit for residential properties."
                                    lawReference="Model Tenancy Act 2021, Section 11"
                                    actionButton={<Link to="/pushback" className="text-accent-red text-sm font-medium hover:underline">Draft Pushback Email &rarr;</Link>}
                                />
                                <ClauseCard
                                    severity="critical"
                                    title="Arbitrary Eviction Notice"
                                    originalText="Landlord reserves the right to terminate this lease with 15 days written notice without stating any cause."
                                    explanation="The law dictates that a minimum of 3 months notice must be provided, and arbitrary evictions are not permitted during the term of a signed agreement."
                                    lawReference="Model Tenancy Act 2021, Section 21"
                                    actionButton={<Link to="/pushback" className="text-accent-red text-sm font-medium hover:underline">Draft Pushback Email &rarr;</Link>}
                                />
                                <ClauseCard
                                    severity="medium"
                                    title="Vague Maintenance Charges"
                                    originalText="Tenant will bear costs for any and all wear and tear and structural maintenance."
                                    explanation="Structural maintenance (like plumbing, wiring, and roofing) is legally the landlord's responsibility. Tenant is only responsible for routine day-to-day fixes."
                                    lawReference="Model Tenancy Act 2021, Section 15"
                                />
                            </>
                        )}

                        {activeTab === 'missing' && (
                            <>
                                <ClauseCard
                                    severity="info"
                                    title="Force Majeure (Act of God)"
                                    originalText="[Clause Not Found in Document]"
                                    explanation="There is no protection for you in case of natural disasters, pandemics, or government lockdowns. Without this clause, you must continue paying rent even if the property is uninhabitable."
                                    actionButton={<button className="text-accent-saffron text-sm font-medium hover:text-white transition-colors text-center w-full bg-accent-saffron/10 hover:bg-accent-saffron/20 py-2 rounded">Add Suggested Clause &rarr;</button>}
                                />
                                <ClauseCard
                                    severity="info"
                                    title="Lock-in Period Breakage Caps"
                                    originalText="[Clause Not Found in Document]"
                                    explanation="The contract has a lock-in period but doesn't specify the exact penalty for leaving early. The landlord could illegally demand the entire year's rent."
                                    actionButton={<button className="text-accent-saffron text-sm font-medium hover:text-white transition-colors text-center w-full bg-accent-saffron/10 hover:bg-accent-saffron/20 py-2 rounded">Add Suggested Clause &rarr;</button>}
                                />
                            </>
                        )}

                        {activeTab === 'safe' && (
                            <>
                                <ClauseCard
                                    severity="safe"
                                    title="Rent Escalation Cap"
                                    originalText="Rent shall be increased by no more than 5% annually for the first three years."
                                    explanation="This is a very fair clause. It protects you from sudden arbitrary 15-20% rent hikes which are common in major cities."
                                />
                            </>
                        )}

                        {activeTab === 'viewer' && (
                            <div className="bg-white rounded-lg p-8 shadow-sm font-serif text-black leading-loose text-sm md:text-base min-h-[500px]">
                                <p>This RENTAL AGREEMENT is made and executed on this day by and between...</p>
                                <div className="my-6 space-y-4">
                                    <span className="bg-red-200 block p-2 rounded relative group cursor-help transition-colors hover:bg-red-300">
                                        "Tenant shall pay a security deposit equivalent to six (6) months of rent upfront before moving in."
                                        <div className="absolute top-[-100%] left-0 bg-black text-white p-2 text-xs rounded hidden group-hover:block z-50 w-64 leading-tight shadow-xl">
                                            Violates Model Tenancy Act 2021 (Max 2 months)
                                        </div>
                                    </span>
                                    <p>And...</p>
                                    <span className="bg-yellow-200 block p-2 rounded cursor-help transition-colors hover:bg-yellow-300">
                                        "Tenant will bear costs for any and all wear and tear and structural maintenance."
                                    </span>
                                    <p>In witness whereof, both parties have set their hands...</p>
                                    <div className="border-2 border-orange-500 border-dashed rounded p-3 text-orange-600 font-sans text-xs flex justify-center mt-8 cursor-pointer hover:bg-orange-50 transition-colors">
                                        + Missing Force Majeure Clause should go here
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
