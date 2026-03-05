
import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Mail, ChevronRight } from 'lucide-react';

export default function Subscribe() {
    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen pt-40 pb-24 overflow-hidden relative transition-colors duration-500">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 dark:bg-brand/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand/5 dark:bg-brand/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>

            <div className="container-custom relative">
                <div className="max-w-3xl mx-auto text-center mb-24 animate-reveal">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">Join the Intelligence Network</span>
                    <h1 className="display-medium text-neutral-900 dark:text-white mb-8 leading-tight">
                        Stories that matter, <span className="italic font-serif">delivered</span> to your inbox.
                    </h1>
                    <p className="body-large italic leading-relaxed text-neutral-800 dark:text-neutral-300">
                        Subscribe to <strong>Blot</strong> and join a community of 5,000+ deep-tech enthusiasts, industry leaders, and intellectual explorers.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch animate-reveal delay-200">
                    {/* Left: Tiers */}
                    <div className="space-y-8">
                        <TierCard
                            title="The Briefing"
                            price="Free"
                            desc="Weekly synthesis of global tech trends and research summaries."
                            features={['Weekly Newsletter', 'Curated Research Links', 'Public Intelligence Reports']}
                        />
                        <TierCard
                            title="The Protocol"
                            price="$12/mo"
                            desc="Full access to our proprietary deep-dive research and early-access essays."
                            features={['Everything in Briefing', 'Deep-Dive Research Essays', 'Access to SEO Audit Engine', 'Exclusive Webinars']}
                            isFeatured={true}
                        />
                    </div>

                    {/* Right: Signup Form */}
                    <div className="bg-neutral-900 dark:bg-black rounded-[3rem] p-12 md:p-16 text-white shadow-2xl relative flex flex-col justify-center border border-white/5">
                        <div className="mb-12">
                            <h3 className="text-3xl font-serif font-bold mb-4">Initialize Protocol.</h3>
                            <p className="text-neutral-400 text-sm leading-relaxed">Enter your primary neural link (email) to begin the synchronization process.</p>
                        </div>

                        <form className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="human@digital.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white placeholder:text-neutral-700 outline-none focus:border-brand transition-all"
                                    />
                                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-700 w-5 h-5" />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button className="w-full bg-brand text-white py-6 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-dark transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-brand/20 flex items-center justify-center gap-3">
                                    Activate Synchronization <ChevronRight size={16} />
                                </button>
                            </div>

                            <p className="text-[9px] text-center text-neutral-600 uppercase font-bold tracking-widest leading-relaxed mt-8">
                                By subscribing, you agree to our Terms of Protocol and Privacy Policy. Synchronize whenever you wish.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TierCard({ title, price, desc, features, isFeatured = false }) {
    return (
        <div className={`p-8 md:p-12 rounded-[3rem] border transition-all duration-500 group relative overflow-hidden ${isFeatured
            ? 'bg-white dark:bg-neutral-800 border-brand shadow-2xl shadow-brand/10 dark:shadow-none'
            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700'}`}>
            {isFeatured && (
                <div className="absolute top-8 right-8">
                    <Zap className="text-brand fill-brand animate-pulse" size={20} />
                </div>
            )}
            <div className="mb-8">
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-3 block ${isFeatured ? 'text-brand' : 'text-neutral-400'}`}>{title}</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">{price}</span>
                    {price !== 'Free' && <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">/ Node</span>}
                </div>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-8 font-medium">{desc}</p>
            <ul className="space-y-4">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        <CheckCircle2 size={14} className={isFeatured ? 'text-brand' : 'text-neutral-300 dark:text-neutral-600'} />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
