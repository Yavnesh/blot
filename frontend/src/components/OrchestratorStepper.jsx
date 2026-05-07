import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useOrchestratorStore } from '../store/orchestratorStore';

const NODES = [
    { id: 'discovery', label: 'Discovery' },
    { id: 'research', label: 'Research' },
    { id: 'credibility', label: 'Fact-Check' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'writing', label: 'Prose' },
    { id: 'optimization', label: 'Engage' },
    { id: 'evaluation', label: 'Assess' },
    { id: 'approval', label: 'Human' }
];

const OrchestratorStepper = memo(() => {
    const { activePipeline, setSelectedNode } = useOrchestratorStore();
    const currentNode = activePipeline.current_node;
    const selectedNode = activePipeline.selectedNode;

    const getNodeStatus = (nodeId) => {
        const order = NODES.map(n => n.id);
        const currentIndex = order.indexOf(currentNode);
        const nodeIndex = order.indexOf(nodeId);

        if (nodeIndex < currentIndex) return 'completed';
        if (nodeIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="glass-panel p-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between gap-4 min-w-[800px]">
            {NODES.map((node, i) => {
                const status = getNodeStatus(node.id);
                const isFirst = i === 0;
                const isSelected = selectedNode === node.id || (!selectedNode && node.id === currentNode);
                
                return (
                    <div key={node.id} className="flex items-center flex-1 min-w-fit cursor-pointer group/node" onClick={() => setSelectedNode(node.id)}>
                        {!isFirst && (
                            <div className={`h-[1px] flex-1 min-w-[20px] mx-4 ${
                                status === 'completed' ? 'bg-teal-500' : 'bg-slate-800'
                            }`} />
                        )}
                        
                        <div className="relative group">
                            <motion.div
                                animate={status === 'active' ? { scale: [1, 1.1, 1], opacity: 1 } : { scale: 1 }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 group-hover/node:scale-110 ${
                                    isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900 ' : ''
                                }${
                                    status === 'completed' ? 'bg-teal-500/10 border-teal-500 text-teal-400' :
                                    status === 'active' ? (node.id === 'approval' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)]') :
                                    'bg-slate-900 border-slate-800 text-slate-600'
                                }`}
                            >
                                {status === 'completed' && <Check size={18} />}
                                {status === 'active' && (
                                    node.id === 'approval' ? <UserCheck size={18} className="animate-pulse" /> :
                                    <Loader2 size={18} className="animate-spin" />
                                )}
                                {status === 'pending' && <span className="text-[10px] font-black">{i + 1}</span>}
                            </motion.div>

                            <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    status === 'active' ? 'text-white' : 'text-slate-500'
                                }`}>
                                    {node.label}
                                </span>
                            </div>

                            {/* Tooltip for output preview */}
                            <AnimatePresence>
                                {status === 'completed' && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block transition-all z-20">
                                        <div className="bg-slate-800 text-white text-[10px] py-2 px-3 rounded-lg shadow-xl border border-white/5 whitespace-nowrap">
                                            View Agent Artifact
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
});

export default OrchestratorStepper;
