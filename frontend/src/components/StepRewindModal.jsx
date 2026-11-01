import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, AlertTriangle, X, ArrowRight, Info } from 'lucide-react';

export default function StepRewindModal({ isOpen, onClose, targetNode, taskId, onRewindSuccess }) {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleRewind = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8080/api/v1/generation/rewind/${taskId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    target_node: targetNode,
                    feedback: feedback,
                    reset_subsequent_steps: true
                })
            });

            if (res.ok) {
                if (onRewindSuccess) onRewindSuccess(targetNode);
                onClose();
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Failed to rewind step.');
            }
        } catch (err) {
            setError(err.message || 'Network error.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <RotateCcw size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Rewind & Refine Step</h3>
                            <p className="text-[10px] text-slate-400">Target Node: <span className="text-amber-400 font-bold uppercase">{targetNode}</span></p>
                        </div>
                    </div>

                    <div className="p-3 mb-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2 text-amber-300 text-[11px] leading-relaxed">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <span>
                            Rewinding will reset all steps downstream of <strong>{targetNode}</strong>. The agent will re-execute forward using your guidance notes.
                        </span>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Human-in-the-Loop Feedback / Instructions
                        </label>
                        <textarea
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="e.g. Please prioritize authoritative government sources, verify Shor's algorithm, and tone down promotional language..."
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-[11px] text-rose-400 mt-3 flex items-center gap-1.5">
                            <AlertTriangle size={14} /> {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={isSubmitting}
                            onClick={handleRewind}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Rewinding...' : 'Execute Rewind'}
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
