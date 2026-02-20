import { AlertCircle, Trash2, Globe, Shield } from 'lucide-react';
import { useSession } from '../hooks/useSession';

export const Settings = () => {
    const { clearSession } = useSession();

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-text-secondary mb-10">Manage your preferences and data privacy.</p>

            <div className="space-y-8 w-full max-w-none">

                {/* Preferences */}
                <div className="glass-panel p-6 rounded-2xl w-full">
                    <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-accent-gold" /> Preferences
                    </h2>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-6 border-b border-border gap-4">
                            <div>
                                <h3 className="text-white font-medium">Default Output Language</h3>
                                <p className="text-sm text-text-muted mt-1">Language for AI explanations</p>
                            </div>
                            <select className="bg-bg-secondary border border-border text-white rounded-lg px-4 py-2 outline-none w-full sm:w-auto">
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="mr">Marathi</option>
                                <option value="ta">Tamil</option>
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="text-white font-medium">Default Contract Type</h3>
                                <p className="text-sm text-text-muted mt-1">Speeds up analysis upload</p>
                            </div>
                            <select className="bg-bg-secondary border border-border text-white rounded-lg px-4 py-2 outline-none w-full sm:w-auto">
                                <option value="rental">Rental Agreement</option>
                                <option value="employment">Employment</option>
                                <option value="freelance">Freelance</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Privacy */}
                <div className="glass-panel p-6 rounded-2xl border-accent-teal/30 w-full flex flex-col">
                    <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-accent-teal" /> Privacy & Data
                    </h2>

                    <div className="bg-bg-secondary p-4 rounded-xl border border-border mb-6 flex-grow relative z-10">
                        <h3 className="text-white font-medium flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-accent-teal" /> How we handle your data</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            We operate an anonymous-by-default architecture. Your IP is not linked to your documents. All documents are securely processed with military-grade encryption and automatically completely securely wiped from our servers after exactly 60 minutes or immediately when you click the button below.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border mt-auto w-full shrink-0">
                        <div className="w-full sm:w-auto text-left">
                            <h3 className="text-red-300 font-medium">Danger Zone</h3>
                            <p className="text-sm text-text-muted">Instantly delete all active session data.</p>
                        </div>
                        <button
                            onClick={clearSession}
                            className="px-6 py-2 bg-accent-red/10 border border-accent-red hover:bg-accent-red hover:text-white text-accent-red text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 w-full sm:w-auto shrink-0"
                        >
                            <Trash2 className="w-4 h-4" /> Clear Session Now
                        </button>
                    </div>
                </div>

                <div className="text-center text-sm text-text-muted pt-8 pb-8 flex flex-col items-center">
                    <p>© 2026 LegalSaathi | Open Source | Made for Bharat</p>
                </div>

            </div>
        </div>
    );
};
