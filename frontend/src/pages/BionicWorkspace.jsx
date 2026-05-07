import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Zap, Database, Save, Globe, CheckCircle2, AlertTriangle, Terminal, BrainCircuit, Search, ArrowRight, Cpu, Sparkles } from 'lucide-react';
import OrchestratorStepper from '../components/OrchestratorStepper';
import BionicEditor from '../components/BionicEditor';
import BrandVault from '../components/BrandVault';
import { useOrchestratorStore } from '../store/orchestratorStore';
import { usePipelineSocket } from '../lib/socket';

const BionicWorkspace = () => {
    const { 
        setBrandVaultOpen, 
        uiView, 
        toggleView, 
        activePipeline, 
        approveTask, 
        rejectTask,
        triggerPipeline 
    } = useOrchestratorStore();
    
    const [topicInput, setTopicInput] = useState('');
    const [debugMode, setDebugMode] = useState(false);
    
    // Initialize the WebSocket listener for LangGraph updates
    usePipelineSocket();

    const isAwaitingApproval = activePipeline.status === 'awaiting_approval' || activePipeline.current_node === 'approval';
    const isRunning = activePipeline.status === 'running';

    const handleStartGeneration = () => {
        if (!topicInput.trim()) return;
        triggerPipeline(topicInput.trim());
        setTopicInput('');
    };

    return (
        <div className="flex flex-col gap-6 md:gap-10 pb-32 max-w-[1600px] mx-auto w-full px-4 md:px-0">
            {/* 1. Neural Topic Input (Begin your bionic prose) */}
            <div className="glass-panel p-6 md:p-10 border border-white/5 bg-slate-900/60 relative overflow-hidden group">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-teal-400 w-5 h-5" />
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Begin Your Bionic Prose</h2>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStartGeneration()}
                                placeholder={isRunning ? "Input guidance or feedback for the next agent process..." : "Enter your editorial topic or target vector..."}
                                className="w-full h-16 md:h-20 bg-slate-950/50 border-white/10 text-white pl-14 pr-6 rounded-2xl focus:ring-2 focus:ring-teal-500/20 text-base md:text-lg font-bold placeholder:text-slate-600 transition-all"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-6 h-6" />
                        </div>
                        <button 
                            onClick={handleStartGeneration}
                            disabled={!topicInput.trim() || isRunning}
                            className="h-16 md:h-20 px-10 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-teal-500/10 flex items-center justify-center gap-3 active:scale-95 group"
                        >
                            {isRunning ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Ignite Pipeline
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Orchestration Matrix (Status & Stepper) */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isRunning ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                            <Cpu size={22} />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight leading-none mb-2">
                                {activePipeline.topic || "Ready for Synthesis"}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${isRunning ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-800 text-slate-600 border-white/5'}`}>
                                    {isRunning ? `${activePipeline.current_node} NODE ACTIVE` : 'NEURAL IDLE'}
                                </span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">• Consensus Protocol v4</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setBrandVaultOpen(true)}
                            className="flex items-center gap-2 h-12 px-5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all group"
                        >
                            <Database size={16} className="group-hover:text-teal-400 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Vault Context</span>
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-6 border border-white/5 bg-slate-900/40">
                    <OrchestratorStepper />
                </div>
            </div>

            {/* 3. Logic Stream & Editor Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Agent Logic Stream (Vertical) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Logic Process Stream</h4>
                        <button 
                            onClick={() => setDebugMode(!debugMode)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${debugMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}
                        >
                            <Terminal size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{debugMode ? 'DEBUG ON' : 'DEBUG OFF'}</span>
                        </button>
                    </div>
                    
                    <div className="glass-panel p-6 border border-white/5 bg-slate-900/40 min-h-[400px] max-h-[600px] overflow-y-auto space-y-6 no-scrollbar custom-scrollbar">
                        <AnimatePresence initial={false}>
                            {(() => {
                                const displayNode = activePipeline.selectedNode || activePipeline.current_node || 'discovery';
                                const allLogs = activePipeline.logs?.filter(log => log.step === displayNode) || [];
                                
                                // Filter logs if not in debug mode (hide technical/raw messages)
                                const filteredLogs = debugMode ? allLogs : allLogs.filter(log => {
                                    const text = (log.text || log.message || "").toLowerCase();
                                    return !text.includes('state update') && !text.includes('raw output') && !text.includes('tokens');
                                });
                                
                                return filteredLogs.length > 0 ? (
                                    [...filteredLogs].reverse().map((log, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-4 group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-first:bg-teal-500 group-first:text-white transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                </div>
                                                {i !== filteredLogs.length - 1 && <div className="w-[1px] h-full bg-white/5 mt-2" />}
                                            </div>
                                            <div className="flex flex-col gap-1 pb-4">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{log.step || 'AGENT'} node</span>
                                                <p className="text-xs text-slate-300 font-medium leading-relaxed group-first:text-white transition-colors">{log.text || log.message}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                    <BrainCircuit size={48} className="text-slate-700 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Awaiting Neural Ignition</p>
                                </div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Main Bionic Editor */}
                <div className="lg:col-span-8 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <BionicEditor />
                        </motion.div>
                    </AnimatePresence>

                    {/* HITL Intervention Component */}
                    <AnimatePresence>
                        {isAwaitingApproval && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="bg-amber-500 rounded-3xl p-6 md:p-10 mt-10 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-amber-500/20 border border-white/20 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <AlertTriangle size={120} />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl flex-shrink-0">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-950 font-black text-lg md:text-2xl tracking-tighter mb-1">Quality Gate Active</h3>
                                        <p className="text-slate-950/70 text-[9px] font-black uppercase tracking-[0.2em]">Agent requires human confirmation before final synthesis</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-8 md:mt-0 relative z-10 w-full md:w-auto">
                                    <button 
                                        onClick={() => rejectTask(activePipeline.job_id, "Needs revision")}
                                        className="flex-1 md:flex-none px-6 py-4 bg-slate-950/10 border border-slate-950/20 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-950/20 transition-all"
                                    >
                                        Revise
                                    </button>
                                    <button 
                                        onClick={() => approveTask(activePipeline.job_id)}
                                        className="flex-1 md:flex-none px-8 py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-2xl"
                                    >
                                        <CheckCircle2 size={16} />
                                        Approve
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <BrandVault />
        </div>
    );
};

const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            className={`flex w-full bg-slate-950 border-2 border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
            ref={ref}
            {...props}
        />
    );
});

export default BionicWorkspace;
