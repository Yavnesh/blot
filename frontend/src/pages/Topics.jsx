import React, { useState, useEffect } from 'react';

const InlineAgentStatus = ({ taskId, taskData }) => {
    const [status, setStatus] = useState(taskData || null);

    const formatDuration = (start, end) => {
        if (!start) return '';
        const startTime = new Date(start);
        const endTime = end ? new Date(end) : new Date();
        const durationMs = endTime - startTime;
        if (durationMs < 0) return '0s';
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    useEffect(() => {
        if (taskData?.status === 'completed' || taskData?.status === 'error') return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/v1/generation/status/${taskId}`);
                if (!response.ok) throw new Error('Status check failed');
                const data = await response.json();
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

    const TOTAL_AGENTS = 12;
    const completedSteps = status.steps?.filter(s => ['completed', 'success', 'warning'].includes(s.status)) || [];
    const errorSteps = status.steps?.filter(s => s.status === 'error') || [];
    const runningSteps = status.steps?.filter(s => s.status === 'running') || [];

    // If the orchestrator finished perfectly or failed, we set bar accordingly.
    const isFullyCompleted = status.status === 'completed';
    const isFailed = status.status === 'error';

    // Calculate progress based on steps vs TOTAL_AGENTS. If fully completed, jump to 100.
    const processedCount = completedSteps.length + errorSteps.length;
    const progressPercent = isFullyCompleted ? 100 : Math.min(100, Math.round((processedCount / TOTAL_AGENTS) * 100));

    return (
        <div className="mt-6 space-y-6">
            {/* Live Counter for Research Layer */}
            {status.preview_data?.fact_count > 0 && (
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10">
                        <i className="material-icons text-7xl">account_tree</i>
                    </div>
                    <div className="flex justify-between items-center mb-3 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Research Node Pool</span>
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(status.preview_data.fact_count, 5))].map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-[8px] font-black backdrop-blur-sm">
                                    <i className="material-icons text-[10px] text-indigo-400">link</i>
                                </div>
                            ))}
                            {status.preview_data.fact_count > 5 && (
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-[8px] font-black text-indigo-300">+{status.preview_data.fact_count - 5}</div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-end gap-2 relative z-10">
                        <span className="text-3xl font-black">{status.preview_data.fact_count}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400">Sources Verified</span>
                    </div>
                </div>
            )}

            {/* Live Scaffolding Preview */}
            {(status.preview_data?.headline || status.preview_data?.outline) && (
                <div className="bg-[#f8f9fc] border border-slate-200 rounded-[2rem] p-6 shadow-inner relative group/scaffold">
                    <div className="absolute top-0 right-0 p-3">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">Scaffolding</span>
                    </div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i className="material-icons text-[12px]">draw</i> Dynamic Preview
                    </h4>
                    {status.preview_data.headline && (
                        <h5 className="text-sm font-black text-slate-900 mb-2 leading-tight pr-8 capitalize">{status.preview_data.headline}</h5>
                    )}
                    {(status.preview_data.primary_keyword || status.preview_data.search_intent) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {status.preview_data.primary_keyword && (
                                <span className="text-[8px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    🔑 {status.preview_data.primary_keyword}
                                </span>
                            )}
                            {status.preview_data.search_intent && (
                                <span className="text-[8px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    {status.preview_data.search_intent}
                                </span>
                            )}
                        </div>
                    )}
                    {status.preview_data.outline && (
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2 mt-3 p-3 bg-white rounded-xl border border-slate-100">
                            {status.preview_data.outline}
                        </p>
                    )}
                </div>
            )}

            {/* Timeline & Feedback */}
            <div className="space-y-4 px-1">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-3 items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent Mesh Progress</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ring-1 shadow-sm ${isFailed ? 'text-red-600 bg-red-50 ring-red-200' : isFullyCompleted ? 'text-emerald-600 bg-emerald-50 ring-emerald-200' : 'text-indigo-600 bg-indigo-50 ring-indigo-200 animate-pulse'}`}>
                            {progressPercent}%
                        </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm border ${isFullyCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        isFailed ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white border-indigo-100 text-indigo-600 animate-pulse'
                        }`}>
                        {isFullyCompleted ? 'Finished' : isFailed ? 'Failed' : `Running: ${status.current_step || 'Orchestrating'}`}
                    </span>
                </div>

                <div className="flex gap-1.5 h-2 bg-slate-100 rounded-full overflow-hidden mb-3 border border-slate-200/50 shadow-inner">
                    <div
                        className={`h-full transition-all duration-700 rounded-full ${isFullyCompleted ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-indigo-500 loading-stripes'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="mt-4 bg-slate-50/50 rounded-xl border border-slate-100 p-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {['trend', 'credibility', 'semantic', 'intent', 'aggregator', 'draft', 'seo', 'voice', 'readability', 'category', 'hashtag', 'image', 'evaluator'].map(stepName => {
                        const stepInfo = status.steps?.find(s => s.name.toLowerCase() === stepName);
                        let stateColor = 'text-slate-300';
                        let icon = 'radio_button_unchecked';
                        let timeText = '';
                        let spin = false;

                        if (stepInfo) {
                            if (['completed', 'success', 'warning'].includes(stepInfo.status)) {
                                stateColor = 'text-emerald-500';
                                icon = 'check_circle';
                                timeText = formatDuration(stepInfo.start_time, stepInfo.end_time);
                            } else if (stepInfo.status === 'error') {
                                stateColor = 'text-red-500';
                                icon = 'error';
                            } else if (stepInfo.status === 'running') {
                                stateColor = 'text-indigo-500';
                                icon = 'sync';
                                spin = true;
                                timeText = 'Running...';
                            }
                        }

                        return (
                            <div key={stepName} className="flex items-center justify-between text-[9px] uppercase tracking-widest p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-2">
                                    <i className={`material-icons text-[12px] ${stateColor} ${spin ? 'animate-spin' : ''}`}>{icon}</i>
                                    <span className={stepInfo?.status === 'running' ? 'text-indigo-700 font-black' : stepInfo?.status === 'error' ? 'text-red-600 font-black' : stepInfo ? 'text-slate-700 font-bold' : 'text-slate-400 font-medium'}>
                                        {stepName} Agent
                                    </span>
                                </div>
                                <div className={`text-[8px] font-black ${spin ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`}>
                                    {timeText || '--'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {status.logs && status.logs.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 pt-4 border-t border-slate-100 mt-4">
                        <i className="material-icons text-[14px] text-indigo-400">psychology</i>
                        <span className="truncate italic">"{status.logs[status.logs.length - 1].feedback || 'Processing intent...'}"</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Topics = () => {
    const [topics, setTopics] = useState([]);
    const [tasks, setTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingTopics, setGeneratingTopics] = useState({});

    const fetchData = async () => {
        try {
            const [topicsRes, tasksRes] = await Promise.all([
                fetch('http://localhost:8080/api/v1/trendings/'),
                fetch('http://localhost:8080/api/v1/generation/tasks')
            ]);

            if (!topicsRes.ok || !tasksRes.ok) throw new Error('Data fetch failed');

            const topicsData = await topicsRes.json();
            const tasksData = await tasksRes.json();

            // Map tasks to topics (latest task per topic name)
            const taskMap = {};
            tasksData.forEach(task => {
                if (!taskMap[task.topic]) {
                    taskMap[task.topic] = task;
                }
            });

            // Find unmapped active tasks (newly created from dashboard)
            const dbTopicNames = topicsData.map(t => t.topic);
            const activeUnmappedTasks = tasksData.filter(t => !dbTopicNames.includes(t.topic));

            const pseudoTopics = activeUnmappedTasks.map(t => ({
                id: `pseudotopic-${t.task_id}`,
                topic: t.topic || 'Unknown Target',
                status: 'Discovering',
                source: 'User Engagement',
                created_at: t.updated_at,
                is_pseudo: true,
                taskId: t.task_id
            }));

            setTopics([...pseudoTopics, ...topicsData]);
            setTasks(taskMap);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Background refresh

        // Handle scrolling to specific ID if present
        const urlParams = new URLSearchParams(window.location.search);
        const topicId = urlParams.get('id');
        if (topicId) {
            setTimeout(() => {
                const element = document.getElementById(`topic-${topicId}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, []);

    const handleCreatePost = async (topic) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/generation/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic_id: topic.id, limit: 1 })
            });
            if (!response.ok) throw new Error('Generation trigger failed');
            const data = await response.json();

            setGeneratingTopics(prev => ({
                ...prev,
                [topic.id]: data.task_id
            }));

            // Refresh to catch the new task
            fetchData();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const [retryModal, setRetryModal] = useState(null); // { topicId, topicName }

    const handleRetry = async (topicId, reuseCache) => {
        setRetryModal(null);
        try {
            const res = await fetch('http://localhost:8080/api/v1/generation/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: topicId,
                    reuse_scrape: reuseCache,
                    include_images: false
                })
            });
            if (!res.ok) throw new Error('Failed to trigger retry');
            const data = await res.json();
            setGeneratingTopics(prev => ({ ...prev, [topicId]: data.task_id }));
            fetchData();
        } catch (err) {
            alert('Retry failed: ' + err.message);
        }
    };

    if (error && topics.length === 0) return <div className="p-8 text-red-600 bg-red-50 rounded-3xl m-4 font-black uppercase tracking-widest text-center border-2 border-red-100">Error: {error}</div>;

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Trending Intelligence</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Autonomous Editorial Discovery Engine</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {topics.map((topic) => {
                    const latestTask = tasks[topic.topic];
                    const taskId = generatingTopics[topic.id] || latestTask?.task_id;
                    const isProcessing = taskId && (latestTask?.status === 'running' || generatingTopics[topic.id]);

                    return (
                        <div id={`topic-${topic.id}`} key={topic.id} className={`bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col group relative ${isProcessing ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-50 bg-indigo-50/10' : ''}`}>
                            {isProcessing && (
                                <div className="absolute top-0 right-0 p-4 z-10">
                                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest">Processing Node</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-8 pb-4 flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[10px] font-black text-slate-400 mr-2 bg-slate-50 px-2 py-1 rounded-lg">#{typeof topic.id === 'string' && topic.id.startsWith('pseudo') ? 'SYS' : topic.id}</span>
                                        <span className={`px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border shadow-sm ${topic.status === 'New' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                            }`}>
                                            {topic.status}
                                        </span>
                                        {topic.trend_score > 0 && (
                                            <span className="bg-amber-50 text-amber-600 border border-amber-100 px-4 py-1 rounded-full text-[8px] font-black tracking-widest uppercase">
                                                {topic.trend_score} Trend Score
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{new Date(topic.created_at).toLocaleDateString()}</span>
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-4 leading-snug group-hover:text-indigo-600 transition-colors duration-300 tracking-tight">{topic.topic}</h2>

                                <div className="flex items-center text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6 px-1">
                                    <span className="material-icons text-[14px] mr-2 text-indigo-300">hub</span>
                                    <span className="opacity-80">{topic.source}</span>
                                </div>

                                {topic.related_topics_top && topic.related_topics_top.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {topic.related_topics_top.slice(0, 4).map((tag, idx) => (
                                            <span key={idx} className="bg-slate-50/80 text-slate-500 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border border-slate-100 group-hover:border-indigo-100/50 group-hover:bg-indigo-50/30 transition-colors">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Inline Analysis & Timeline */}
                                {(taskId || topic.is_pseudo) && (
                                    <InlineAgentStatus
                                        taskId={taskId || topic.taskId}
                                        taskData={(taskId || topic.taskId) === latestTask?.task_id ? latestTask : null}
                                    />
                                )}
                            </div>

                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 mt-auto flex gap-3">
                                <button
                                    onClick={() => handleCreatePost(topic)}
                                    className={`flex-1 font-black py-4 rounded-2xl transition-all duration-300 text-[10px] uppercase tracking-widest active:scale-[0.98] ${taskId ? 'bg-white border-2 border-slate-200 text-slate-400 shadow-sm' : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-xl shadow-slate-900/10'
                                        }`}
                                    disabled={!!taskId && (latestTask?.status === 'running' || generatingTopics[topic.id])}
                                >
                                    {taskId && (latestTask?.status === 'running' || generatingTopics[topic.id]) ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <i className="material-icons text-[14px] animate-spin">sync</i> ORCHESTRATING...
                                        </div>
                                    ) : 'Create Authority Post'}
                                </button>
                                {(latestTask?.status === 'completed' || latestTask?.status === 'error') && (
                                    <button
                                        onClick={() => setRetryModal({ topicId: topic.id, topicName: topic.topic })}
                                        title="Rerun pipeline for this topic"
                                        className="w-14 h-14 mt-auto flex items-center justify-center rounded-2xl border-2 border-amber-100 text-amber-500 hover:bg-amber-50 hover:border-amber-300 bg-white transition-all shadow-sm"
                                    >
                                        <i className="material-icons text-lg">replay</i>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {topics.length === 0 && (
                <div className="text-center py-40 bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100">
                    <div className="material-icons text-gray-200 text-8xl mb-6">insights</div>
                    <p className="text-gray-300 text-xl font-black tracking-[0.2em] uppercase italic">Awaiting Market Trends</p>
                </div>
            )}

            {/* Retry Choice Modal */}
            {retryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <i className="material-icons text-orange-500">replay</i>
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Rerun Pipeline</h2>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mb-6">
                            Regenerating: <span className="font-black text-gray-800 italic">{retryModal.topicName}</span>
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Choose Data Source</p>
                        <div className="space-y-3 mb-8">
                            <button
                                onClick={() => handleRetry(retryModal.topicId, true)}
                                className="w-full text-left p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:border-indigo-400 transition-all"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <i className="material-icons text-indigo-500 text-lg">inventory_2</i>
                                    <span className="text-sm font-black text-gray-900">Reuse Cached Data</span>
                                    <span className="ml-auto text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">0 API Calls</span>
                                </div>
                                <p className="text-[10px] text-gray-500 pl-8">Skip GNews — regenerate from previously scraped sources. Zero quota cost.</p>
                            </button>
                            <button
                                onClick={() => handleRetry(retryModal.topicId, false)}
                                className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-orange-200 transition-all"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <i className="material-icons text-orange-500 text-lg">travel_explore</i>
                                    <span className="text-sm font-black text-gray-900">Scrape Fresh Data</span>
                                    <span className="ml-auto text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">Live Search</span>
                                </div>
                                <p className="text-[10px] text-gray-500 pl-8">Fresh GNews search before regenerating — latest data, more API tokens.</p>
                            </button>
                        </div>
                        <button
                            onClick={() => setRetryModal(null)}
                            className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all text-[10px] uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Topics;
