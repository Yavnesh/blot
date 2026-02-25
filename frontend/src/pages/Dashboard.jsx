import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ topics: 0, scrapes: 0, posts: 0, manual: 0 });
    const [loading, setLoading] = useState(true);
    const [topicInput, setTopicInput] = useState('');
    const [isTriggering, setIsTriggering] = useState(false);
    const [lastTaskId, setLastTaskId] = useState(null);

    const fetchCounts = async () => {
        try {
            const [topicsRes, scrapesRes, postsRes] = await Promise.all([
                fetch('http://localhost:8080/api/v1/trendings/'),
                fetch('http://localhost:8080/api/v1/scrapes/'),
                fetch('http://localhost:8080/api/v1/posts/')
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

    const [includeImages, setIncludeImages] = useState(false);

    const handleTriggerTopic = async (e) => {
        if (e) e.preventDefault();
        if (!topicInput.trim()) return;

        setIsTriggering(true);
        try {
            const response = await fetch('http://localhost:8080/api/v1/generation/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_topic: topicInput.trim(),
                    limit: 1,
                    include_images: includeImages
                })
            });

            if (!response.ok) throw new Error('Failed to trigger pipeline');

            const data = await response.json();
            setLastTaskId(data.task_id);
            setTopicInput(''); // Clear input for the next topic

            // Do NOT redirect, allow user to enter another topic immediately
            setIsTriggering(false);
        } catch (error) {
            alert("Error: " + error.message);
            setIsTriggering(false);
        }
    };

    const stats = [
        { label: 'Intelligence Nodes', value: counts.topics, color: 'text-indigo-600', icon: 'hub' },
        { label: 'Verified Insights', value: counts.scrapes, color: 'text-emerald-500', icon: 'auto_graph' },
        { label: 'Published Posts', value: counts.posts, color: 'text-gray-900', icon: 'article' },
        { label: 'Authority Score', value: '98%', color: 'text-orange-500', icon: 'verified' },
    ];



    return (
        <div className="max-w-[1200px] mx-auto p-8 pt-20">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter">Authority Engine.</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px]">Autonomous Editorial Intelligence v4.0</p>
            </div>

            {/* Magic Search Bar - Focal Point */}
            <div className="relative max-w-4xl mx-auto mb-24">
                <div className="bg-white rounded-[3.5rem] shadow-2xl p-2 border border-gray-100 flex items-center transition-all focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTriggerTopic()}
                            placeholder="What do you want to dominate today? Enter a single topic..."
                            className="w-full bg-transparent p-7 pl-14 text-2xl font-bold text-gray-900 placeholder:text-gray-200 outline-none"
                        />
                        <i className="material-icons absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-indigo-500">sparkles</i>
                    </div>
                    <button
                        onClick={handleTriggerTopic}
                        disabled={isTriggering || !topicInput.trim()}
                        className="bg-gray-900 text-white px-12 py-6 rounded-[3rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 group shadow-xl active:scale-[0.98]"
                    >
                        {isTriggering ? 'Engaging Agents...' : 'Engage Engine'}
                        <i className="material-icons text-lg group-hover:rotate-12 transition-transform">bolt</i>
                    </button>
                </div>

                {/* Visual Settings Underneath */}
                <div className="flex justify-center gap-8 mt-6">
                    <button
                        onClick={() => setIncludeImages(!includeImages)}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${includeImages ? 'text-indigo-600' : 'text-gray-300'}`}
                    >
                        <i className="material-icons text-sm">{includeImages ? 'check_circle' : 'radio_button_unchecked'}</i>
                        Generate AI Visuals
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
                        <i className="material-icons text-sm">security</i>
                        Compliance Guard Active
                    </div>
                </div>
            </div>

            {/* Analytics Grid - Clean & Subtle */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-indigo-100 transition-all group flex flex-col items-center text-center">
                        <div className={`mb-4 ${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`}>
                            <i className="material-icons text-2xl">{stat.icon}</i>
                        </div>
                        <h4 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Hidden Progress Indicator for Background Tasks */}
            {lastTaskId && (
                <div className="fixed bottom-8 right-8 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Pipeline Active</span>
                    <a href="/topics" className="text-indigo-400 font-black text-[10px] uppercase hover:underline">Track Protocol</a>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
