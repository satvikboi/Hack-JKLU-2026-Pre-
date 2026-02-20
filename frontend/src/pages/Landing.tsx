import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, EyeOff, Gauge, Mail, ArrowRight, Mic, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const Landing = () => {
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="flex flex-col w-full">
            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">
                            {t('hero.title')}
                        </h1>
                        <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            to="/analyze"
                            className="w-full sm:w-auto px-8 py-4 bg-accent-saffron text-black font-semibold rounded-lg text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,153,51,0.4)] hover:shadow-[0_0_40px_rgba(255,153,51,0.6)] hover:scale-105"
                        >
                            Analyze My Contract <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/voice"
                            className="w-full sm:w-auto px-8 py-4 glass text-white font-medium rounded-lg text-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
                            Try Voice in Hindi <Mic className="w-5 h-5 text-accent-teal" />
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-text-muted"
                    >
                        <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-accent-teal" /> Zero Data Storage</span>
                        <span className="flex items-center gap-1.5">⚡ 60 Second Analysis</span>
                        <span className="flex items-center gap-1.5">🇮🇳 Built for Bharat</span>
                        <span className="flex items-center gap-1.5">⚖️ Indian Law Database</span>
                        <span className="flex items-center gap-1.5">🌐 6 Indian Languages</span>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-24 px-6 bg-bg-secondary/40 border-y border-border backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-white">How We Protect You</h2>
                        <p className="text-text-secondary text-lg">AI trained on decades of Indian legal precedent.</p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                icon: <EyeOff className="w-8 h-8 text-accent-saffron" />,
                                title: "Blindspot Detector",
                                desc: "Finds missing clauses your lawyer would miss. We tell you what they left out on purpose."
                            },
                            {
                                icon: <Gauge className="w-8 h-8 text-accent-teal" />,
                                title: "Risk Traffic Light",
                                desc: "Get an instant Red/Amber/Green risk score before you sign anything. Know instantly if it's safe."
                            },
                            {
                                icon: <Mail className="w-8 h-8 text-accent-gold" />,
                                title: "Pushback Letter",
                                desc: "Our AI auto-writes a polite but firm legal reply to send to your landlord or employer."
                            }
                        ].map((f, i) => (
                            <motion.div key={i} variants={itemVariants} className="glass-panel p-8 rounded-2xl hover:border-accent-saffron/30 transition-colors group">
                                <div className="bg-bg-primary/50 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-border group-hover:border-accent-saffron/50 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="font-serif text-3xl md:text-5xl font-bold mb-16 text-white">4 Steps to Safety</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { num: "01", text: "Upload PDF or paste text (or speak in Hindi)" },
                            { num: "02", text: "AI reads & cross-checks Indian law database" },
                            { num: "03", text: "Instant risk score + missing clauses flagged" },
                            { num: "04", text: "Download pushback letter or share on WhatsApp" }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-2xl font-serif text-accent-gold font-bold mb-4 border-accent-gold/30">
                                    {step.num}
                                </div>
                                <p className="text-text-primary font-medium">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 px-6 bg-bg-secondary/40 border-t border-border backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-serif text-3xl md:text-5xl font-bold mb-16 text-center text-white">Trusted Across Bharat</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                text: "My landlord was charging 6 months deposit. LegalSaathi showed me he was violating the Model Tenancy Act.",
                                name: "Priya Sharma",
                                city: "Pune"
                            },
                            {
                                text: "Found 3 clauses that would have locked me into a 2-year notice period. Changed the contract before signing.",
                                name: "Rahul Mehta",
                                city: "Bangalore"
                            },
                            {
                                text: "Used it in Tamil. Got the entire analysis in my language. It's an incredible tool for regular people.",
                                name: "Anita Rajan",
                                city: "Chennai"
                            }
                        ].map((t, i) => (
                            <div key={i} className="glass p-8 rounded-2xl relative">
                                <span className="absolute -top-4 -left-2 text-6xl text-accent-saffron/20 font-serif">"</span>
                                <p className="text-white relative z-10 mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal font-bold border border-accent-teal/30">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{t.name}</h4>
                                        <span className="text-xs text-text-muted">{t.city}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 px-6 text-center">
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8">Don't sign blindly.</h2>
                <Link
                    to="/analyze"
                    className="inline-flex items-center gap-2 px-10 py-5 bg-accent-saffron text-black font-semibold rounded-lg text-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,153,51,0.5)]"
                >
                    Protect Yourself Now <Shield className="w-6 h-6" />
                </Link>
                <p className="mt-6 flex justify-center items-center gap-2 text-text-muted">
                    <CheckCircle2 className="w-4 h-4 text-accent-teal" /> Free analysis. No credit card. Auto-deletes in 60 mins.
                </p>
            </section>
        </div>
    );
};
