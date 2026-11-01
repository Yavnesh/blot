import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, FileText, CheckCircle2, Shield, ArrowUpRight, X, Trash2, Cpu, Database } from 'lucide-react';
import api from '../lib/axios';

const Scrapes = () => {
    const [scrapes, setScrapes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedData, setSelectedData] = useState(null);

    useEffect(() => {
        const fetchScrapes = async () => {
            try {
                const response = await api.get('/scrapes/');
                setScrapes(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchScrapes();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="w-full max-w-[1720px] mx-auto p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 pb-32">
            <header>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                    <Search className="text-teal-400 w-6 h-6 md:w-8 md:h-8" />
                    Research <span className="text-teal-400">Engine</span>
                </h1>
                <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3">
                    Distributed Intelligence Gathering & Fact Verfication
                </p>
            </header>

            <div className="glass-panel border border-white/5 bg-slate-900 overflow-hidden shadow-2xl rounded-2xl md:rounded-3xl">
                {/* Desktop View Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/40">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Origin</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Research Node</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Verification</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {scrapes.map((scrape, i) => (
                                <motion.tr 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    key={scrape.id} 
                                    className="hover:bg-teal-400/[0.02] transition-colors group cursor-pointer"
                                >
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border shrink-0 ${
                                            scrape.trending_id && scrape.trending_id !== 'none' 
                                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                                            : 'bg-slate-950 text-slate-600 border-white/5'
                                        }`}>
                                            ID #{scrape.trending_id && scrape.trending_id !== 'none' ? scrape.trending_id : 'Global Hub'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="max-w-md">
                                            <p className="text-sm font-black text-white group-hover:text-teal-400 transition-colors truncate mb-1">
                                                {scrape.url && scrape.url[0]}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{new Date(scrape.created_at).toLocaleDateString()}</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                <span className="text-[9px] font-black text-teal-400/60 uppercase tracking-widest">Web Ingestion Node</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Verified Truth</p>
                                                <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none mt-1">Integrity Consensus Pass</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => setSelectedData(scrape)}
                                                className="h-12 px-6 bg-slate-950 text-white border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 hover:border-teal-500 transition-all shadow-xl active:scale-95"
                                            >
                                                Inspect Vector
                                            </button>
                                            <button className="p-3 text-slate-600 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="lg:hidden p-4 space-y-4">
                    {scrapes.map((scrape, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={scrape.id}
                            className="bg-slate-950/50 border border-white/5 rounded-xl p-5 space-y-5"
                            onClick={() => setSelectedData(scrape)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-white truncate mb-1">{scrape.url && scrape.url[0]}</p>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{new Date(scrape.created_at).toLocaleDateString()}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border shrink-0 ${
                                    scrape.trending_id && scrape.trending_id !== 'none' 
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                                    : 'bg-slate-950 text-slate-600 border-white/5'
                                }`}>
                                    ID #{scrape.trending_id && scrape.trending_id !== 'none' ? scrape.trending_id : 'Global'}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                                        <Shield size={14} />
                                    </div>
                                    <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">Verified Integrity</span>
                                </div>
                                <button className="p-2 text-slate-600 hover:text-red-500 transition-all rounded-lg bg-white/5">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {scrapes.length === 0 && (
                    <div className="text-center py-24 md:py-40">
                         <Database size={48} md:size={64} className="text-slate-800 mx-auto mb-6 animate-pulse" />
                         <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-600 italic">No intelligence ingested in active vault</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedData(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative h-full w-full md:max-w-3xl bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col p-6 md:p-12"
                        >
                            <div className="flex justify-between items-start mb-8 md:mb-12">
                                <div className="min-w-0 pr-12">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500/10 rounded-lg md:rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                                            <Cpu size={16} md:size={20} />
                                        </div>
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Analysis Vector</span>
                                    </div>
                                    <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter mb-2 capitalize line-clamp-2 md:line-clamp-none">
                                        {selectedData.title && selectedData.title[0]}
                                    </h2>
                                    <p className="text-[8px] md:text-[10px] font-black text-teal-400 uppercase tracking-widest truncate">Source: {selectedData.url && selectedData.url[0]}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedData(null)}
                                    className="absolute top-6 right-6 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-xl"
                                >
                                    <X size={18} md:size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar space-y-6 md:space-y-10">
                                <div className="p-5 md:p-8 bg-slate-950/50 border border-white/5 rounded-2xl md:rounded-[2.5rem] shadow-inner">
                                    <h4 className="text-[8px] md:text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-teal-500" />
                                        Extracted Intelligence
                                    </h4>
                                    <div className="text-[11px] md:text-base text-slate-300 font-bold leading-relaxed space-y-4 md:space-y-6">
                                        {selectedData.content && selectedData.content[0]?.split('\n').filter(p => p.trim()).map((p, i) => (
                                            <p key={i}>{p}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 md:mt-12">
                                <button
                                    onClick={() => setSelectedData(null)}
                                    className="w-full h-14 md:h-18 bg-teal-600 hover:bg-teal-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-xl md:rounded-2xl transition-all shadow-2xl shadow-teal-500/20 active:scale-[0.98]"
                                >
                                    Relinquish Search Focus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Scrapes;
