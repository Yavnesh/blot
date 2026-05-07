import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Zap, 
    Search, 
    Globe, 
    Database, 
    Layers, 
    Cpu, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    PlusCircle,
    BrainCircuit,
    ArrowUpRight,
    TrendingUp,
    Shield
} from 'lucide-react';
import api from '../lib/axios';

const InlineAgentStatus = ({ taskId, taskData }) => {
    const [status, setStatus] = useState(taskData || null);

    const formatDuration = (start, end) => {
        if (!start || !end) return null;
        const s = typeof start === 'string' ? new Date(start).getTime() / 1000 : start;
        const e = typeof end === 'string' ? new Date(end).getTime() / 1000 : end;
        const secs = Math.round(e - s);
        if (isNaN(secs) || secs < 0) return null;
        if (secs < 60) return `${secs}s`;
        return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    };

    useEffect(() => {
        if (taskData?.status === 'completed' || taskData?.status === 'error') return;

        const pollStatus = async () => {
            try {
                const response = await api.get(`/generation/status/${taskId}`);
                const data = response.data;
                setStatus(data);

                if (data.status === 'completed' || data.status === 'error') {
                    clearInterval(intervalId);
                }
            } catch (err) {
                clearInterval(intervalId);
            }
        };

        const intervalId = setInterval(pollStatus, 3000);
        if (!taskData) pollStatus();

        return () => clearInterval(intervalId);
    }, [taskId, taskData]);

    if (!status) return null;

    const completedSteps = status.steps?.filter(s => ['completed', 'success', 'warning'].includes(s.status)) || [];
    const isFullyCompleted = status.status === 'completed';
    const isFailed = status.status === 'error';

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isFullyCompleted ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : isFailed ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {isFullyCompleted ? 'Vectorized' : isFailed ? 'Logic Failed' : `Running: ${status.current_step || 'Orchestrating'}`}
                    </span>
                </div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{completedSteps.length} / 12 Nodes</span>
            </div>

            <div className="relative h-2 bg-slate-950 rounded-full border border-white/5 overflow-hidden shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${isFullyCompleted ? 100 : Math.min(100, (completedSteps.length / 12) * 100)}%` }}
                    className={`h-full bg-gradient-to-r ${isFailed ? 'from-red-600 to-red-400' : 'from-teal-600 to-emerald-400'} rounded-full`}
                />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                {['Draft', 'Research', 'SEO', 'Voice'].map((node) => {
                    const isDone = status.steps?.some(s => s.name.toLowerCase().includes(node.toLowerCase()) && ['completed', 'success'].includes(s.status));
                    return (
                        <div key={node} className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${isDone ? 'bg-teal-500/5 border-teal-500/20 text-teal-400' : 'bg-slate-950/50 border-white/5 text-slate-600'}`}>
                            <span className="text-[8px] font-black uppercase tracking-widest">{node} Node</span>
                            {isDone ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Topics = () => {
    const [topics, setTopics] = useState([]);
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const [topicsRes, tasksRes] = await Promise.all([
                api.get('/trendings/'),
                api.get('/generation/tasks')
            ]);
            setTopics(topicsRes.data);
            const taskMap = {};
            tasksRes.data.forEach(task => { if (!taskMap[task.topic]) taskMap[task.topic] = task; });
            setTasks(taskMap);
        } catch (err) {
            setError(err.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-[1720px] mx-auto p-4 lg:p-0 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <Globe className="text-teal-400 w-8 h-8" />
                        Discovery <span className="text-teal-400">Hub</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                        Autonomous Market Intelligence & Trend Scanning
                    </p>
                </div>
                <button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/10 transition-all active:scale-[0.98] flex items-center gap-3 group">
                    Scan Market Vector <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
                {topics.map((topic, i) => {
                    const latestTask = tasks[topic.topic];
                    const isProcessing = latestTask?.status === 'running' || latestTask?.status === 'pending';
                    
                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={topic.id} 
                            className={`glass-panel p-10 border border-white/5 flex flex-col group relative overflow-hidden transition-all hover:bg-slate-900 ${isProcessing ? 'border-teal-500/30 bg-teal-500/5' : ''}`}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <TrendingUp size={120} />
                            </div>

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex gap-2">
                                    <span className="text-[8px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-white/5 tracking-widest">#{topic.id}</span>
                                    <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                        topic.status === 'New' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-950 text-slate-500 border-white/5'
                                    }`}>
                                        {topic.status}
                                    </span>
                                </div>
                                {topic.trend_score > 0 && (
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={12} className="text-teal-400" />
                                        <span className="text-[10px] font-black text-white">{topic.trend_score}</span>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-white mb-4 leading-tight tracking-tight group-hover:text-teal-400 transition-colors">{topic.topic}</h2>
                            
                            <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">
                                <span className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
                                    <BrainCircuit size={12} className="text-teal-400/50" />
                                    {topic.source || 'Genetic Engine'}
                                </span>
                            </div>

                            {latestTask && (
                                <InlineAgentStatus taskId={latestTask.task_id} taskData={latestTask} />
                            )}

                            <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                                <button 
                                    className={`flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                                        latestTask?.status === 'completed' 
                                        ? 'bg-white text-slate-950 hover:bg-slate-100' 
                                        : 'bg-teal-600 text-white hover:bg-teal-500 shadow-xl shadow-teal-500/10'
                                    }`}
                                >
                                    {latestTask?.status === 'completed' ? 'View Intel' : 'Launch Pipeline'}
                                </button>
                                {latestTask && (
                                    <button className="w-16 h-16 rounded-2xl bg-slate-950 border border-white/5 text-slate-500 hover:text-white hover:border-white/10 flex items-center justify-center transition-all">
                                        <RefreshCw size={18} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Topics;
