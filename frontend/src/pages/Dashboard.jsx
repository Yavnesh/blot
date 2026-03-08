
import React, { useState, useEffect } from 'react';
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

const API_BASE = 'http://localhost:8080/api/v1';

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [topicInput, setTopicInput] = useState('');
    const [contentType, setContentType] = useState('blog');
    const [isTriggering, setIsTriggering] = useState(false);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_BASE}/analytics/summary`);
            const data = await res.json();
            setAnalytics(data);
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
            await fetch(`${API_BASE}/generation/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_topic: topicInput.trim(), include_images: true, content_type: contentType })
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
        <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Intelligence...</p>
            </div>
        </div>
    );

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="bg-[#f8f9fc] min-h-screen p-8 pt-6 font-sans text-slate-900 pb-20">
            {/* Top Navigation */}
            <div className="max-w-[1680px] mx-auto mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <BrainCircuit className="text-indigo-600 w-8 h-8" />
                        Blot Intelligence <span className="text-indigo-600">Hub</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Blot OS • Autonomous Pipeline Management • v4.0.0-PRO</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-slate-400">Network Reach</span>
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <Globe2 className="w-3 h-3 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
                        <Zap className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-[1680px] mx-auto space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Discovery Nodes"
                        value={analytics?.totals?.topics || 0}
                        change="+14.2%"
                        icon={<Activity className="w-5 h-5" />}
                        color="indigo"
                        data={analytics?.velocity?.map(v => ({ v: v.topics }))}
                    />
                    <StatCard
                        title="Knowledge Scrapes"
                        value={analytics?.totals?.scrapes || 0}
                        change="+8.2%"
                        icon={<Database className="w-5 h-5" />}
                        color="emerald"
                        data={analytics?.velocity?.map(v => ({ v: v.scrapes }))}
                    />
                    <StatCard
                        title="Published Posts"
                        value={analytics?.totals?.posts || 0}
                        change="+24.1%"
                        icon={<FileText className="w-5 h-5" />}
                        color="amber"
                        data={analytics?.velocity?.map(v => ({ v: v.posts }))}
                    />
                    <StatCard
                        title="System Efficiency"
                        value="98.4%"
                        change="+0.4%"
                        icon={<Terminal className="w-5 h-5" />}
                        color="slate"
                        data={analytics?.velocity?.map(v => ({ v: 90 + Math.random() * 8 }))}
                    />
                </div>

                {/* Main Middle Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Velocity Chart Block */}
                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Pipeline Throughput</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-reference orchestration latency by node</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400">Trend Discovery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400">Knowledge Research</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.velocity || []}>
                                    <defs>
                                        <linearGradient id="gIndigo" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gEmerald" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '1.5rem' }} />
                                    <Area type="monotone" dataKey="topics" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#gIndigo)" />
                                    <Area type="monotone" dataKey="scrapes" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#gEmerald)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right-side Quick Insight Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Interactive Engagement Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <BrainCircuit className="absolute -right-6 -bottom-6 w-48 h-48 text-indigo-500/20 group-hover:rotate-12 transition-transform duration-1000" />
                            <h3 className="text-xl font-black mb-2">Protocol Launch</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Instantiate new autonomous agent layer for deep-dive research.</p>

                            <form onSubmit={handleTrigger} className="relative z-10 space-y-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={topicInput}
                                            onChange={(e) => setTopicInput(e.target.value)}
                                            placeholder="Target Intelligence Topic..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-sm font-bold placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                                        />
                                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={contentType}
                                            onChange={(e) => setContentType(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="blog">Blog (Long-form)</option>
                                            <option value="article">Article (Long-form)</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="twitter">Twitter (X)</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="meta">Meta (Facebook)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    disabled={isTriggering || !topicInput.trim()}
                                    className="w-full bg-indigo-600 text-white rounded-2xl py-5 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isTriggering ? 'Engaging Nodes...' : <><Play className="w-3 h-3" /> Execute Protocol</>}
                                </button>
                            </form>
                        </div>

                        {/* Circular Analytics */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">System Health</h3>
                                <ArrowUpRight className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="h-[220px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={analytics?.seo_distribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={10} dataKey="value">
                                            {analytics?.seo_distribution?.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900 leading-none">94.2</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">E-E-A-T Score</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                {analytics?.seo_distribution?.slice(0, 4).map((item, i) => (
                                    <div key={i} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                            <span className="text-[14px] font-black text-slate-700">{item.value}</span>
                                        </div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Interactive Row - Detailed Tables & Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">

                    {/* Live Operations Table */}
                    <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Intelligence Nodes</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct stream from orchestrator kernel</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Live Stream
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr className="bg-slate-50/30">
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Target</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">State</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Node</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {analytics?.recent_tasks?.map((task, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 capitalize">{task.topic}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${task.status === 'completed' ? 'bg-indigo-50 text-indigo-600' :
                                                    task.status === 'running' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        'bg-slate-100 text-slate-400 font-bold'
                                                    }`}>
                                                    {task.status === 'running' && <div className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></div>}
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Cpu className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.current_step || 'Kernel IDLE'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${85 + Math.random() * 10}%` }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* World Map Simulation or Technical Projections */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Technical Projection vs Actual */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col h-full">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Latency vs Stability</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Agent performance Benchmarks</p>

                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.technical_stats?.latency_vs_accuracy || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                                        <Bar dataKey="latency" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-6 flex justify-between pt-6 border-t border-slate-50">
                                <div>
                                    <p className="text-[18px] font-black text-slate-900 leading-none">1.2s</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Avg Latency</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[18px] font-black text-indigo-600 leading-none">99.9%</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Kernel Uptime</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, change, icon, color, data }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        slate: 'bg-slate-900 text-white border-slate-800'
    };

    const chartColors = {
        indigo: '#6366f1',
        emerald: '#10b981',
        amber: '#f59e0b',
        slate: '#64748b'
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-2xl hover:border-indigo-100 transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${colors[color]} shadow-lg shadow-black/5 transition-transform group-hover:scale-110 duration-500`}>
                    {icon}
                </div>
                <div className="text-right">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${change.startsWith('+') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
                        }`}>
                        {change}
                    </span>
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{value}</h4>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{title}</p>
            </div>

            <div className="absolute right-0 bottom-0 w-32 h-16 opacity-30 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data || []}>
                        <Line type="monotone" dataKey="v" stroke={chartColors[color]} strokeWidth={4} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;
