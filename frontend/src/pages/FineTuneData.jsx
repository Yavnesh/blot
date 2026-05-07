import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Zap, Brain, Terminal, Database, ArrowUpRight, CheckCircle2, Cpu } from 'lucide-react';
import api from '../lib/axios';

const FineTuneData = () => {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSamples = async () => {
            try {
                const response = await api.get('/finetune/samples');
                setSamples(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSamples();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-[1720px] mx-auto p-4 lg:p-0 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-3xl">
                    <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <Layers className="text-teal-400 w-8 h-8" />
                        Dataset <span className="text-teal-400">Refinery</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 leading-relaxed">
                        Capturing <span className="text-white">Latent Intelligence Traces</span> from the editorial pipeline. Ensuring synthetic evolution.
                    </p>
                </div>
                <div className="glass-panel px-6 py-4 bg-slate-900 border border-white/5">
                    <div className="text-right">
                        <div className="flex items-center gap-3 justify-end mb-1">
                            <span className="text-2xl font-black text-white">{samples.length}</span>
                            <Zap size={16} className="text-teal-400" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pairs Collected</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8 pb-24">
                {samples.map((sample, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={sample.id} 
                        className="glass-panel border border-white/5 bg-slate-900 overflow-hidden shadow-2xl group"
                    >
                        <div className="bg-slate-950/50 px-8 py-4 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Cpu size={14} className="text-teal-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{sample.agent_role} Node</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{new Date(sample.created_at).toLocaleString()}</span>
                        </div>
                        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Terminal size={12} /> Probabilistic Input
                                </h4>
                                <div className="bg-slate-950 p-6 rounded-2xl text-[11px] font-mono text-teal-500/80 border border-white/5 h-64 overflow-y-auto custom-scrollbar shadow-inner leading-relaxed">
                                    {sample.prompt}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Brain size={12} /> Deterministic Output
                                </h4>
                                <div className="bg-teal-500/5 p-6 rounded-2xl text-[12px] font-bold text-slate-100 border border-teal-500/10 h-64 overflow-y-auto custom-scrollbar leading-relaxed">
                                    {sample.completion}
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-6 bg-slate-950/30 border-t border-white/5 flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Logic Score:</span>
                                <span className={`text-xs font-black ${sample.score >= 90 ? 'text-teal-400' : 'text-amber-500'}`}>
                                    {sample.score}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol:</span>
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-3 py-1 rounded-lg uppercase font-black tracking-widest border border-white/5">
                                    {sample.format}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {samples.length === 0 && (
                    <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <Database size={64} className="text-slate-800 mx-auto mb-6 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Awaiting Intelligence Extraction Traces</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FineTuneData;
