import { useState } from 'react';
import { Mail, Copy, Send, Check } from 'lucide-react';
import clsx from 'clsx';

export const PushbackGenerator = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 min-h-full">

            {/* Editor Side */}
            <div className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col h-full">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Pushback Generator</h1>
                <p className="text-text-secondary text-sm mb-8">AI crafts a legally sound reply to push back against unfair terms.</p>

                <form className="space-y-6 flex-1 flex flex-col">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">What's the issue?</label>
                        <input type="text" defaultValue="Excessive Security Deposit (6 months)" className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-saffron transition-colors outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Recipient</label>
                        <div className="flex flex-wrap gap-2">
                            {['Landlord', 'Employer', 'Client', 'Other'].map(r => (
                                <button key={r} type="button" className={clsx("px-4 py-2 rounded-lg text-sm transition-colors border flex-1 text-center whitespace-nowrap", r === 'Landlord' ? "bg-accent-saffron/20 border-accent-saffron/50 text-accent-saffron" : "bg-bg-primary border-border text-text-secondary hover:text-white")}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">Tone</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {['Polite but Clear', 'Firm & Legal', 'Urgent'].map(t => (
                                <button key={t} type="button" className={clsx("px-2 py-3 rounded-lg text-sm text-center transition-colors border", t === 'Firm & Legal' ? "bg-accent-teal/20 border-accent-teal/50 text-accent-teal" : "bg-bg-primary border-border text-text-secondary hover:text-white")}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pb-6 w-full mt-auto pt-6 flex flex-col flex-1">
                        <label className="block text-sm font-medium text-text-muted mb-2">Your Name (Optional)</label>
                        <input type="text" placeholder="Leave blank to send as Anonymous Tenant" className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-saffron transition-colors mt-auto outline-none" />
                    </div>

                    <button type="button" className="w-full py-4 mt-4 bg-accent-saffron text-black font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-orange-400 transition-colors shrink-0">
                        Generate New Draft
                    </button>
                </form>
            </div>

            {/* Preview Side */}
            <div className="flex flex-col h-full space-y-4 lg:min-h-[600px]">
                <div className="flex justify-between items-center">
                    <h2 className="font-serif text-xl font-bold text-white">Email Preview</h2>
                    <div className="flex gap-2">
                        <span className="bg-accent-teal/10 text-accent-teal text-xs px-2 py-1 rounded font-bold border border-accent-teal/20">TONE: FIRM</span>
                    </div>
                </div>

                <div className="glass flex-1 rounded-2xl border border-border overflow-hidden flex flex-col h-full min-h-[400px]">
                    <div className="bg-bg-secondary p-4 border-b border-border text-sm shrink-0">
                        <p className="text-text-secondary mb-1">Subject: <span className="text-white font-medium">Re: Security Deposit in Draft Agreement</span></p>
                    </div>

                    <div className="p-6 text-white text-sm leading-relaxed overflow-y-auto flex-1 font-serif">
                        <p>Dear Landlord,</p>
                        <br />
                        <p>I have reviewed the draft rental agreement. While I am eager to move forward, I am unable to accept the clause requesting a 6-month security deposit.</p>
                        <br />
                        <p>
                            As per <span className="bg-accent-gold/20 text-yellow-200 px-1 rounded font-sans">Section 11 of the Model Tenancy Act, 2021</span>, the security deposit for a residential premises shall not exceed two months' rent.
                        </p>
                        <br />
                        <p>I am happy to provide the legally mandated 2-month deposit immediately upon signing to secure the property. Please let me know once the draft has been updated so we can proceed.</p>
                        <br />
                        <p>Best regards,<br />Prospective Tenant</p>
                    </div>

                    <div className="bg-bg-secondary p-4 border-t border-border flex flex-col sm:flex-row gap-3 mt-auto shrink-0">
                        <button onClick={handleCopy} className="flex-1 py-3 bg-bg-primary border border-border rounded-lg flex items-center justify-center gap-2 text-white hover:bg-bg-tertiary transition-colors text-sm font-medium">
                            {copied ? <Check className="w-4 h-4 text-accent-teal" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button className="flex-1 py-3 bg-[#EA4335] rounded-lg flex items-center justify-center gap-2 text-white hover:bg-red-600 transition-colors text-sm font-medium border-transparent">
                            <Mail className="w-4 h-4" /> Gmail
                        </button>
                        <button className="flex-1 py-3 bg-[#25D366] rounded-lg flex items-center justify-center gap-2 text-white hover:bg-green-500 transition-colors text-sm font-medium border-transparent">
                            <Send className="w-4 h-4" /> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
