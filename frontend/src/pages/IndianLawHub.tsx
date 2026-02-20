import { BookOpen, Search, Filter } from 'lucide-react';

export const IndianLawHub = () => {

    const categories = [
        { title: "Rental Law", desc: "Model Tenancy Act 2021", icon: "🏠" },
        { title: "Labour & Employment", desc: "4 Labour Codes", icon: "👷" },
        { title: "Consumer Rights", desc: "Consumer Protection Act 2019", icon: "🛡️" },
        { title: "Real Estate", desc: "RERA 2016", icon: "🏗️" },
        { title: "Digital & IT", desc: "IT Act 2000", icon: "💻" },
        { title: "Contract Basics", desc: "Indian Contract Act 1872", icon: "🤝" },
        { title: "Startup Agreements", desc: "DPIIT Guidelines", icon: "🚀" },
        { title: "Loan & Finance", desc: "RBI Guidelines", icon: "💰" },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <div className="mb-10 text-center max-w-3xl mx-auto">
                <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">Indian Law Hub</h1>
                <p className="text-text-secondary text-lg">A clear, plain-language reference guide to your legal rights in India. Stop letting complex jargon be used against you.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search any law, clause, or right..."
                        className="w-full bg-bg-secondary border border-border rounded-lg pl-12 pr-4 py-4 text-white placeholder-text-muted focus:outline-none focus:border-accent-saffron focus:ring-1 focus:ring-accent-saffron transition-all"
                    />
                </div>
                <button className="glass px-6 py-4 rounded-lg flex items-center justify-center gap-2 text-white hover:bg-bg-tertiary transition-colors">
                    <Filter className="w-5 h-5" /> Filter by State
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-accent-gold/50 group transition-all hover:-translate-y-1">
                        <div className="text-4xl mb-4">{cat.icon}</div>
                        <h3 className="font-bold text-lg text-white group-hover:text-accent-gold transition-colors">{cat.title}</h3>
                        <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {cat.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-gradient-to-r from-accent-teal/20 to-bg-secondary border border-accent-teal/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-white mb-2">Need a specific template?</h2>
                    <p className="text-text-secondary">Browse our library of pre-vetted, safe contract clauses.</p>
                </div>
                <button className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-accent-teal hover:text-white transition-colors">
                    Browse Templates
                </button>
            </div>
        </div>
    );
};
