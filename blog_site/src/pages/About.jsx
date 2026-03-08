
import React from 'react';
import { ArrowRight, Globe, Cpu, Users } from 'lucide-react';

export default function About() {
    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen pt-40 pb-24 transition-colors duration-500">
            <div className="container-custom">
                {/* Hero */}
                <header className="mb-24 max-w-3xl animate-reveal">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">Editorial Philosophy</span>
                    <h1 className="display-medium text-neutral-900 dark:text-white mb-8 leading-tight">
                        From a simple ink <span className="italic">Blot</span> to an infinite source of ideas.
                    </h1>
                    <p className="body-large italic leading-relaxed text-neutral-800 dark:text-neutral-300">
                        <strong>Blot</strong> (Blog + Bot) is a modern AI-powered blogging platform where every article is a result of a sophisticated, 13-step autonomous generation protocol. We transform minimal prompts into high-EEAT editorial pieces across technology, business, and culture.
                    </p>
                </header>

                {/* Values Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 animate-reveal delay-200">
                    <ValueCard
                        icon={<Cpu className="text-brand" />}
                        title="Blog + Bot"
                        desc="Blot represents the perfect fusion of digital publishing and robotic precision. Our system organizes and writes everything automatically."
                    />
                    <ValueCard
                        icon={<Users className="text-brand" />}
                        title="Autonomous Pipeline"
                        desc="From trend discovery to evaluator finalization, our 13-step protocol ensures every blot of ink has a purpose."
                    />
                    <ValueCard
                        icon={<Globe className="text-brand" />}
                        title="Infinite Knowledge"
                        desc="By process-mapping global data, Blot generates a continuous stream of insights for the tech-forward reader."
                    />
                </section>

                {/* Team/Mission Text */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center bg-neutral-50 dark:bg-neutral-800/50 rounded-[4rem] p-12 md:p-24 animate-reveal delay-400">
                    <div>
                        <h2 className="heading-large dark:text-white mb-8">The Protocol.</h2>
                        <div className="space-y-6 text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                            <p>
                                Blot doesn't just write; it orchestrates. Every story begins as a microscopic <strong>ink blot</strong>—a single trend or idea—and undergoes a massive architectural expansion.
                            </p>
                            <p>
                                Our pipeline utilizes separate specialized agents for <strong>Credibility Verification</strong>, <strong>Intent Mapping</strong>, <strong>Voice Stylization</strong>, and <strong>Legal Compliance</strong>. This ensures that the "Bot" in Blot maintains the highest standards of journalistic integrity.
                            </p>
                            <p>
                                The result is a clean, modern editorial experience that feels human-centric but is powered by the future of automation.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-square bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl relative overflow-hidden border border-neutral-100 dark:border-neutral-700 flex items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(#4CAF50_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
                            <span className="text-neutral-200 dark:text-neutral-700 font-black text-9xl absolute -bottom-10 -right-10 select-none">B.</span>
                            <div className="relative z-10 text-center space-y-4">
                                <a
                                    href="http://localhost:5173"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-16 h-16 bg-neutral-900 dark:bg-brand rounded-full flex items-center justify-center mx-auto shadow-xl hover:scale-110 transition-transform cursor-pointer"
                                >
                                    <ArrowRight className="text-white" size={24} />
                                </a>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 dark:text-neutral-500">Editorial Node 01</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ValueCard({ icon, title, desc }) {
    return (
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2rem] border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mb-6 group-hover:bg-brand/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{title}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
