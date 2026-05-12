import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Zap,
    FileText,
    Globe,
    TrendingUp,
    ShieldCheck,
    Cpu,
    Database,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Search,
    BrainCircuit,
    LayoutDashboard,
    Globe2,
    Network,
    Terminal,
    ArrowUpRight,
    Play
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';

import api from '../lib/axios';
import { useOrchestratorStore } from '../store/orchestratorStore';
import { useAuthStore } from '../store/authStore';
import OnboardingModal from '../components/OnboardingModal';

const Dashboard = () => {
    const { selectedAssetIds } = useOrchestratorStore();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [topicInput, setTopicInput] = useState('');
    const [contentType, setContentType] = useState('blog');
    const [isTriggering, setIsTriggering] = useState(false);
    const { user } = useAuthStore();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (user && !user.onboarding_completed) {
            setShowOnboarding(true);
        }
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/analytics/summary');
            setAnalytics(res.data);
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTrigger = async (e) => {
        if (e) e.preventDefault();
        if (!topicInput.trim()) return;
        setIsTriggering(true);
        try {
            await api.post('/generation/trigger', { 
                user_topic: topicInput.trim(), 
                include_images: true, 
                content_type: contentType,
                context_document_ids: selectedAssetIds,
                research_mode: selectedAssetIds.length > 0 ? 'hybrid' : 'web'
            });
            setTopicInput('');
            fetchAnalytics();
        } catch (err) {
            console.error(err);
        } finally {
            setIsTriggering(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Intelligence Matrix...</p>
            </div>
        </div>
    );

    const COLORS = ['#14b8a6', '#f59e0b', '#6366f1', '#ef4444'];

    return (
        <div className="w-full max-w-[1720px] mx-auto p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 pb-32">
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
            {/* Perspective HUD */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <BrainCircuit className="text-teal-400 w-6 h-6 md:w-8 md:h-8" />
                        Intelligence <span className="text-teal-400">Ledger</span>
                    </h1>
                    <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]"></span>
                        Blot OS v4.0.0-PRO • Autonomous Swarm Monitor
                    </p>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 w-full md:w-auto"
                >
                    <div className="glass-panel px-4 md:px-6 py-3 md:py-4 flex flex-1 md:flex-none items-center justify-between md:justify-start gap-4 md:gap-8 border border-white/5 bg-slate-900/40">
                        <div className="flex flex-col">
                            <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Global Entity Reach</span>
                            <span className="text-xs md:text-sm font-black text-white whitespace-nowrap">12.4M Verified Nodes</span>
                        </div>
                        <div className="h-8 md:h-10 w-[1px] bg-white/5" />
                        <div className="flex -space-x-2 md:-space-x-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl border-2 border-slate-950 bg-slate-800 flex items-center justify-center ring-1 ring-white/10 group hover:z-10 transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1">
                                     <Globe2 className="w-3 h-3 md:w-4 md:h-4 text-slate-500 group-hover:text-teal-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Discovery Cycles"
                    value={analytics?.totals?.topics || 0}
                    change="+12.4%"
                    icon={<Activity className="w-4 h-4 text-teal-400" />}
                    data={analytics?.velocity?.map(v => ({ v: v.topics }))}
                    color="#14b8a6"
                    delay={0.1}
                />
                <StatCard
                    title="Knowledge Extraction"
                    value={analytics?.totals?.scrapes || 0}
                    change="+8.2%"
                    icon={<Database className="w-4 h-4 text-amber-500" />}
                    data={analytics?.velocity?.map(v => ({ v: v.scrapes }))}
                    color="#f59e0b"
                    delay={0.2}
                />
                <StatCard
                    title="Generated Assets"
                    value={analytics?.totals?.posts || 0}
                    change="+24.1%"
                    icon={<FileText className="w-4 h-4 text-indigo-400" />}
                    data={analytics?.velocity?.map(v => ({ v: v.posts }))}
                    color="#6366f1"
                    delay={0.3}
                />
                <StatCard
                    title="System Purity"
                    value="98.2%"
                    change="+0.4%"
                    icon={<Terminal className="w-4 h-4 text-slate-400" />}
                    data={analytics?.velocity?.map(v => ({ v: 90 + Math.random() * 8 }))}
                    color="#94a3b8"
                    delay={0.4}
                />
            </div>

            {/* Content & Control Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Orchestration Stream */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-8 glass-panel p-6 md:p-10 border border-white/5 shadow-2xl overflow-hidden relative group min-h-[400px] md:min-h-[500px]"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <TrendingUp size={160} className="md:w-[240px] md:h-[240px]" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 md:mb-12 relative z-10">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-white tracking-widest uppercase italic">Orchestration Throughput</h3>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                                Multi-Agent Latency Analysis • Real-time
                            </p>
                        </div>
                        <div className="flex gap-6 md:gap-8">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                                <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Discovery</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                                <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Research</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] md:h-[380px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.velocity || []}>
                                <defs>
                                    <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', padding: '1rem' }} 
                                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="topics" stroke="#14b8a6" strokeWidth={4} fillOpacity={1} fill="url(#gTeal)" />
                                <Area type="monotone" dataKey="scrapes" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#gAmber)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Swarm Insight (Replaces Controller) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-4 glass-panel p-8 md:p-10 border border-white/5 bg-slate-900 shadow-2xl relative overflow-hidden group flex flex-col items-center justify-center text-center"
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-400 mb-6 border border-teal-500/20 shadow-2xl shadow-teal-500/20">
                        <Cpu size={28} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white tracking-widest uppercase mb-4">Autonomous Mesh</h3>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                        The swarm is monitoring global trends. Trigger new cycles from the Bionic Workspace.
                    </p>
                </motion.div>
            </div>

            {/* Live Operations Stream */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-panel border border-white/5 overflow-hidden shadow-2xl bg-slate-900 rounded-2xl md:rounded-3xl"
            >
                <div className="p-6 md:p-10 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950/20 backdrop-blur-3xl">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-widest uppercase">Live Process Stream</h3>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3 flex items-center gap-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            Consensus Synchronized with Agent Swarm
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-950/30">
                                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Matrix Subject</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol State</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Agent</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Node Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {analytics?.recent_tasks?.length > 0 ? analytics.recent_tasks.map((task, i) => (
                                <tr key={i} className="hover:bg-teal-400/[0.02] transition-colors group cursor-pointer">
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <div className="flex flex-col">
                                            <p className="text-xs md:text-sm font-black text-slate-200 group-hover:text-teal-400 capitalize transition-colors mb-2">{task.topic}</p>
                                            <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">TXN: {task.task_id?.slice(0, 12).toUpperCase() || '...'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <span className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 w-fit border ${
                                            task.status === 'completed' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                            task.status === 'running' || task.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            'bg-slate-800 text-slate-500 border-white/10'
                                        }`}>
                                            {(task.status === 'running' || task.status === 'pending') && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>}
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-teal-400 transition-colors">
                                                <Cpu size={16} md:size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{task.current_step || 'Awaiting Cycle'}</span>
                                                <span className="text-[7px] md:text-[8px] font-bold text-slate-600 uppercase tracking-widest">Logic Node 0x{i+1}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-6 md:py-8">
                                        <div className="flex items-center gap-3 md:gap-5">
                                            <div className="w-24 md:w-40 bg-slate-950 h-2 md:h-2.5 rounded-full overflow-hidden border border-white/10 p-[1px] md:p-[1.5px] shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${85 + (i * 7) % 15}%` }}
                                                    transition={{ duration: 2, ease: "circOut" }}
                                                    className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full shadow-[0_0_15px_rgba(20,184,166,0.4)]"
                                                />
                                            </div>
                                            <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-tighter">{85 + (i * 7) % 15}%</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center">
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">No active process streams detected in vault</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

const StatCard = ({ title, value, change, icon, data, color, delay }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-panel p-6 md:p-8 relative overflow-hidden flex flex-col justify-between group border border-white/5 shadow-2xl bg-slate-900 rounded-2xl md:rounded-3xl"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 blur-sm md:blur-md group-hover:opacity-25 transition-opacity translate-x-3 -translate-y-3 pointer-events-none">
                {React.cloneElement(icon, { size: 60, className: "md:w-20 md:h-20" })}
            </div>

            <div className="flex justify-between items-start mb-6 md:mb-10 relative z-10">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-950 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-teal-500/20 transition-all shadow-xl">
                    {React.cloneElement(icon, { size: 18, className: "md:w-[22px] md:h-[22px]" })}
                </div>
                <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                    change.startsWith('+') ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-teal-500/5' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/5'
                }`}>
                    {change}
                </div>
            </div>
            
            <div className="relative z-10">
                <h4 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter mb-1 md:mb-2 leading-none">{value}</h4>
                <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {title}
                </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-16 md:h-24 opacity-20 pointer-events-none -mb-1 md:-mb-2 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data || []}>
                        <Area type="monotone" dataKey="v" stroke={color} fill={color} strokeWidth={3} dot={false} fillOpacity={0.2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default Dashboard;
