
import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, ArrowUp } from 'lucide-react';

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 pt-24 pb-12 overflow-hidden transition-colors duration-500">
            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                    {/* Column 1: Brand */}
                    <div className="lg:col-span-5">
                        <Link to="/" className="text-3xl font-black tracking-tighter text-neutral-900 dark:text-white font-serif mb-8 block">
                            BLOT<span className="text-brand">.</span>
                        </Link>
                        <p className="body-standard max-w-sm mb-10 italic text-neutral-500 dark:text-neutral-400 font-medium">
                            Where Blog meets Bot. An autonomous publishing collective transforming digital ink into deep-tech insights across culture, technology, and the future.
                        </p>
                        <div className="flex gap-6 items-center">
                            <a href="#" className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-full text-neutral-400 hover:text-brand transition-all hover:scale-110">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-full text-neutral-400 hover:text-brand transition-all hover:scale-110">
                                <Linkedin size={18} />
                            </a>
                            <a href="#" className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-full text-neutral-400 hover:text-brand transition-all hover:scale-110">
                                <Github size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Nav */}
                    <div className="lg:col-span-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900 dark:text-white mb-8 mt-2">Explore</h4>
                        <ul className="space-y-4">
                            {['Home', 'Articles', 'Categories', 'Premium', 'About'].map(link => (
                                <li key={link}>
                                    <Link to={`/${link.toLowerCase()}`} className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Newsletter */}
                    <div className="lg:col-span-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900 dark:text-white mb-8 mt-2">Intelligence Briefing</h4>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6 font-medium">Join our editorial list for early access to deep-tech research and essays.</p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-full py-4 px-6 text-sm outline-none focus:border-neutral-900 dark:focus:border-brand transition-all font-medium dark:text-white"
                            />
                            <button className="absolute right-2 top-2 bg-neutral-900 dark:bg-brand text-white p-2 rounded-full hover:bg-neutral-800 dark:hover:bg-brand-dark transition-all">
                                <Mail size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Line */}
                <div className="pt-12 border-t border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-wrap justify-center gap-8 items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">
                            &copy; {new Date().getFullYear()} Blot Editorial Node. All rights reserved.
                        </p>
                        <Link to="/privacy" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Terms of Protocol</Link>
                    </div>

                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group"
                    >
                        Return to Top
                        <ArrowUp size={16} className="transition-transform group-hover:-translate-x-1" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
