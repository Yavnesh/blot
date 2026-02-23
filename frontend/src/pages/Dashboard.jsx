import React, { useState, useEffect } from 'react';

const Dashboard = () => {
    const [counts, setCounts] = useState({ topics: 0, scrapes: 0, posts: 0, manual: 0 });
    const [loading, setLoading] = useState(true);
    const [topicInput, setTopicInput] = useState('');
    const [isTriggering, setIsTriggering] = useState(false);
    const [lastTaskId, setLastTaskId] = useState(null);

    const fetchCounts = async () => {
        try {
            const [topicsRes, scrapesRes, postsRes] = await Promise.all([
                fetch('http://localhost:8000/api/v1/trendings/'),
                fetch('http://localhost:8000/api/v1/scrapes/'),
                fetch('http://localhost:8000/api/v1/posts/')
            ]);

            if (!topicsRes.ok || !scrapesRes.ok || !postsRes.ok) throw new Error("Fetch failed");

            const [topics, scrapes, posts] = await Promise.all([
                topicsRes.json(),
                scrapesRes.json(),
                postsRes.json()
            ]);

            setCounts({
                topics: topics.length,
                scrapes: scrapes.length,
                posts: posts.length,
                manual: topics.filter(t => t.source === 'Manual' || t.source === 'User').length
            });
        } catch (error) {
            console.error("Error fetching dashboard counts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const [includeImages, setIncludeImages] = useState(true);

    const handleTriggerTopic = async (e) => {
        e.preventDefault();
        if (!topicInput.trim()) return;

        setIsTriggering(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/generation/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_topic: topicInput,
                    limit: 1,
                    include_images: includeImages
                })
            });

            if (!response.ok) throw new Error('Failed to trigger pipeline');

            const data = await response.json();
            setLastTaskId(data.task_id);
            setTopicInput('');
            alert(`Pipeline triggered for: ${topicInput}`);
            fetchCounts(); // Update counts as a new topic might be created
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsTriggering(false);
        }
    };

    const stats = [
        { label: 'Intelligence Nodes', value: counts.topics, color: 'bg-indigo-600', icon: 'hub' },
        { label: 'Scraped Insights', value: counts.scrapes, color: 'bg-emerald-500', icon: 'auto_graph' },
        { label: 'Published Posts', value: counts.posts, color: 'bg-gray-900', icon: 'article' },
        { label: 'Authority Topics', value: counts.manual, color: 'bg-orange-500', icon: 'star' },
    ];

    if (loading && counts.topics === 0) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto p-4">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Editorial Control</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Strategic Content Orchestration Dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 p-8 border border-gray-50 group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${stat.color} mb-6 shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                            <i className="material-icons text-2xl">{stat.icon}</i>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                            <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pipeline Control Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 z-0"></div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Trigger Authority Pipeline</h3>
                        <p className="text-gray-500 font-medium mb-8">Enter a custom topic or keyword to activate the full 11-agent editorial workflow.</p>

                        <form onSubmit={handleTriggerTopic} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={topicInput}
                                    onChange={(e) => setTopicInput(e.target.value)}
                                    placeholder="e.g. Impact of AI on Indian SaaS Market"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-5 pl-14 font-bold text-gray-800 transition-all outline-none text-lg"
                                    disabled={isTriggering}
                                />
                                <span className="material-icons absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">topic</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${includeImages ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <span className="material-icons text-xl">{includeImages ? 'image' : 'hide_image'}</span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Include Image Generation</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Autonomous visual synthesis</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIncludeImages(!includeImages)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${includeImages ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 transform ${includeImages ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isTriggering || !topicInput.trim()}
                                className={`w-full font-black py-5 rounded-[1.5rem] transition-all duration-300 shadow-2xl text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${isTriggering
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-gray-900 hover:bg-black text-white shadow-gray-200 active:scale-[0.98]'
                                    }`}
                            >
                                {isTriggering ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white"></div>
                                        Initializing Agents...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons text-sm">bolt</span>
                                        Execute Editorial Protocol
                                    </>
                                )}
                            </button>
                        </form>

                        {lastTaskId && (
                            <div className="mt-6 flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Active Task Detected</span>
                                <a href="/topics" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center">
                                    Track Progress <span className="material-icons text-sm ml-1">arrow_forward</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-900 rounded-[2.5rem] shadow-xl p-10 text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-4 tracking-tight">Strategy Center</h3>
                        <p className="text-gray-400 font-medium text-sm leading-relaxed mb-8">
                            Our autonomous agents are currently monitoring <span className="text-white font-bold">{counts.topics} nodes</span> across the global intelligence web.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">1</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-gray-300">Semantic Expansion</div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">2</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-gray-300">Truth Verification</div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-black">3</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-gray-300">Tone Optimization</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10 mt-8">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">System Engine v4.0.1 Stable</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
