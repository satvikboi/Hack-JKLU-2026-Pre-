import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Loader2, Scale, Sparkles, BookOpen } from 'lucide-react';
import { queryContract } from '../services/api';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
    { text: "What are the key risks?", emoji: "⚠️" },
    { text: "Is the interest rate legal under RBI guidelines?", emoji: "🏦" },
    { text: "Can I prepay without penalty?", emoji: "💰" },
    { text: "What if I miss an EMI?", emoji: "📅" },
    { text: "Are there hidden charges?", emoji: "🔍" },
    { text: "What are my rights as a borrower?", emoji: "⚖️" },
    { text: "Is the termination clause fair?", emoji: "📋" },
    { text: "Which Indian laws protect me?", emoji: "🇮🇳" },
];

export const AskQuery = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "I'm LegalSaathi AI — your contract co-pilot. 🛡️\n\nAsk me anything about the contract you just analyzed. I'll answer based on the actual document text and cite relevant Indian laws.\n\nTry a suggested question below, or type your own!",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await queryContract(text.trim());
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: res.answer,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ Sorry, I couldn't process that. ${err.message || 'Please make sure you\'ve analyzed a contract first.'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-border px-6 py-4 flex items-center gap-4"
            >
                <Link to="/results" className="text-text-muted hover:text-white transition-colors p-2 hover:bg-bg-tertiary rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-gold/20 flex items-center justify-center border border-accent-teal/20">
                    <Scale className="w-5 h-5 text-accent-teal" />
                </div>
                <div className="flex-1">
                    <h1 className="text-white font-serif text-lg font-bold">Ask About Your Contract</h1>
                    <p className="text-text-muted text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
                        Powered by Qwen3 235B • RAG-enhanced • 684 Indian Acts
                    </p>
                </div>
                <Link to="/laws" className="hidden md:flex items-center gap-2 text-xs text-text-muted hover:text-accent-teal transition-colors px-3 py-2 rounded-lg hover:bg-bg-tertiary border border-transparent hover:border-border">
                    <BookOpen className="w-3.5 h-3.5" /> Browse Laws
                </Link>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex gap-3 max-w-[88%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={clsx(
                                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                                msg.role === 'assistant'
                                    ? "bg-gradient-to-br from-accent-teal/20 to-accent-gold/10 border border-accent-teal/20"
                                    : "bg-accent-saffron/10 border border-accent-saffron/20"
                            )}>
                                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-accent-teal" /> : <User className="w-4 h-4 text-accent-saffron" />}
                            </div>
                            <div className={clsx(
                                "rounded-2xl p-4 text-sm leading-relaxed",
                                msg.role === 'assistant'
                                    ? "bg-bg-secondary/80 border border-border text-text-primary"
                                    : "bg-accent-saffron/10 border border-accent-saffron/20 text-white"
                            )}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                <div className={clsx("text-[10px] mt-2 font-medium", msg.role === 'assistant' ? "text-text-muted" : "text-accent-saffron/50")}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-gold/10 flex items-center justify-center flex-shrink-0 border border-accent-teal/20">
                            <Bot className="w-4 h-4 text-accent-teal" />
                        </div>
                        <div className="bg-bg-secondary/80 border border-border rounded-2xl px-5 py-4 flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-accent-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-accent-teal animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-accent-teal animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-text-muted text-sm">Searching contract & Indian law database...</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="px-4 md:px-6 pb-3"
                >
                    <p className="text-text-muted text-[10px] font-bold mb-2.5 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> Suggested Questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                onClick={() => sendMessage(q.text)}
                                disabled={isLoading}
                                className="px-3 py-2 text-xs bg-bg-secondary/50 border border-border rounded-xl text-text-secondary hover:text-white hover:border-accent-teal/30 hover:bg-bg-tertiary/50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <span>{q.emoji}</span> {q.text}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Input */}
            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="border-t border-border px-4 md:px-6 py-4 bg-bg-primary/95 backdrop-blur-xl"
            >
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your contract..."
                            className="w-full bg-bg-secondary border border-border rounded-xl pl-4 pr-4 py-3.5 text-white placeholder-text-muted text-sm focus:border-accent-teal/50 focus:ring-2 focus:ring-accent-teal/10 outline-none transition-all"
                            disabled={isLoading}
                        />
                    </div>
                    <motion.button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                        whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                            input.trim() && !isLoading
                                ? "bg-accent-teal text-black hover:bg-teal-400 glow-teal"
                                : "bg-bg-tertiary text-text-muted cursor-not-allowed"
                        )}
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
                <p className="text-text-muted text-[10px] mt-2 text-center font-medium">
                    Answers are based only on your uploaded contract • References 684 Indian Acts • Not legal advice
                </p>
            </motion.form>
        </div>
    );
};
