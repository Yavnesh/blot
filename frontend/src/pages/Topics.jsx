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
                const response = await fetch(`http://localhost:8000/api/v1/generation/status/${taskId}`);
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

    return (
        <div className="mt-6 space-y-4">
            {/* Timeline */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent Workflow</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${status.status === 'completed' ? 'text-green-600' :
                    status.status === 'error' ? 'text-red-600' : 'text-orange-500 animate-pulse'
                    }`}>
                    {status.status === 'completed' ? '✓ Finished' : status.status === 'error' ? '⚠ Failed' : '◈ Processing'}
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
                {status.steps?.map((step, idx) => {
                    const duration = formatDuration(step.start_time, step.end_time);
                    return (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'running' ? 'bg-orange-500 animate-pulse' :
                                step.status === 'error' ? 'bg-red-500' : 'bg-gray-200'
                            }`} title={`${step.name}${duration ? ` (${duration})` : ''}`}></div>
                    );
                })}
            </div>

            {/* Analysis Logs (Completed Agents) */}
            {status.logs && status.logs.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Live Analysis</h4>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {status.logs.map((log, i) => {
                            const stepInfo = status.steps?.find(s => s.name === log.agent);
                            const duration = formatDuration(stepInfo?.start_time, stepInfo?.end_time);
                            return (
                                <div key={i} className="flex gap-3">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                    <div className="text-[11px] leading-relaxed">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-black text-gray-900 uppercase tracking-tighter">{log.agent}</span>
                                            {duration && <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded border border-gray-100 text-indigo-500 shadow-sm">{duration}</span>}
                                        </div>
                                        <span className="text-gray-500 font-medium">{log.feedback || 'Step completed successfully verified by governance.'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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
                fetch('http://localhost:8000/api/v1/trendings/'),
                fetch('http://localhost:8000/api/v1/generation/tasks')
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

            setTopics(topicsData);
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
            const response = await fetch('http://localhost:8000/api/v1/generation/trigger', {
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

    if (loading && topics.length === 0) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

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
                        <div id={`topic-${topic.id}`} key={topic.id} className={`bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col group relative ${isProcessing ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-gray-50 bg-indigo-50/5' : ''}`}>
                            {isProcessing && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-full animate-pulse shadow-lg">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest">Processing Node</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-8 pb-4 flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[10px] font-black text-gray-400 mr-2">#{topic.id}</span>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border shadow-sm ${topic.status === 'New' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                            }`}>
                                            {topic.status}
                                        </span>
                                        {topic.trend_score > 0 && (
                                            <span className="bg-orange-50 text-orange-600 border border-orange-100 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase">
                                                {topic.trend_score} Score
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{new Date(topic.created_at).toLocaleDateString()}</span>
                                </div>

                                <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors duration-300">{topic.topic}</h2>

                                <div className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6 px-1">
                                    <span className="material-icons text-[14px] mr-2 text-indigo-300">hub</span> {topic.source}
                                </div>

                                {topic.related_topics_top && topic.related_topics_top.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {topic.related_topics_top.slice(0, 4).map((tag, idx) => (
                                            <span key={idx} className="bg-gray-50 text-gray-400 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border border-gray-100 group-hover:border-indigo-100 transition-colors">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Inline Analysis & Timeline */}
                                {taskId && (
                                    <InlineAgentStatus
                                        taskId={taskId}
                                        taskData={taskId === latestTask?.task_id ? latestTask : null}
                                    />
                                )}
                            </div>

                            <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 mt-auto">
                                <button
                                    onClick={() => handleCreatePost(topic)}
                                    className={`w-full font-black py-4 rounded-2xl transition-all duration-300 text-[11px] uppercase tracking-widest shadow-xl active:scale-[0.98] ${taskId ? 'bg-white border-2 border-gray-100 text-gray-400' : 'bg-gray-900 hover:bg-black text-white shadow-gray-200'
                                        }`}
                                    disabled={!!taskId && (latestTask?.status === 'running' || generatingTopics[topic.id])}
                                >
                                    {taskId && (latestTask?.status === 'running' || generatingTopics[topic.id]) ? '◈ Pipeline Running' : 'Create Authority Post'}
                                </button>
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
        </div>
    );
};

export default Topics;
