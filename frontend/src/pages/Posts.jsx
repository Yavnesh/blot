import React, { useState, useEffect } from 'react';
import ArticlePreview from '../components/ArticlePreview';

const API_BASE = 'http://localhost:8080/api/v1';

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [retryModal, setRetryModal] = useState(null);

    const formatDuration = (start, end) => {
        if (!start || !end) return null;
        const secs = Math.round(end - start);
        if (secs < 60) return `${secs}s`;
        return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    };

    const fetchAllData = async () => {
        try {
            const [postsRes, tasksRes] = await Promise.all([
                fetch(`${API_BASE}/posts/`),
                fetch(`${API_BASE}/generation/tasks`)
            ]);
            const postsData = await postsRes.json();
            const tasksData = await tasksRes.json();
            setPosts(Array.isArray(postsData) ? postsData : []);
            // Only show in-progress tasks (not completed/error)
            setTasks(Array.isArray(tasksData) ? tasksData.filter(t => t.status === 'in_progress' || t.status === 'running') : []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        // Poll every 5 seconds to update live tasks
        const interval = setInterval(fetchAllData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePublish = async (postId) => {
        try {
            const res = await fetch(`${API_BASE}/posts/${postId}/publish`, { method: 'POST' });
            if (res.ok) {
                fetchAllData();
            }
        } catch (err) {
            console.error('Error publishing post:', err);
        }
    };

    const handleUpdatePost = async () => {
        if (!editingPost) return;
        try {
            const titleInput = document.querySelector('#edit-title-input');
            const contentInput = document.querySelector('#edit-content-input');
            const updatedTitle = titleInput?.value || editingPost.title?.[0];
            const updatedContent = contentInput?.value || editingPost.content?.[0];
            const res = await fetch(`${API_BASE}/posts/${editingPost.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: [updatedTitle], content: [updatedContent] })
            });
            if (res.ok) {
                setEditingPost(null);
                fetchAllData();
            }
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };

    const handleRetry = async (postId, reuseData) => {
        setRetryModal(null);
        try {
            const post = posts.find(p => p.id === postId);
            const topic = post?.title?.[0] || '';
            await fetch(`${API_BASE}/generation/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_topic: topic, reuse_scrape: reuseData, include_images: false })
            });
            fetchAllData();
        } catch (err) {
            console.error('Error retrying pipeline:', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
        </div>
    );

    if (selectedPost) {
        return (
            <ArticlePreview
                post={selectedPost}
                onBack={() => setSelectedPost(null)}
                onUpdate={(updated) => {
                    setSelectedPost(updated);
                    fetchAllData();
                }}
            />
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Authority Post Repository</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Verifed Content Assets & Intellectual Property</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                {/* Ongoing Tasks */}
                {tasks.map((task) => (
                    <div key={task.task_id} className="bg-white rounded-3xl shadow-sm border-2 border-dashed border-indigo-100 overflow-hidden flex flex-col md:flex-row p-8 gap-8 animate-pulse italic">
                        <div className="md:w-1/3 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mb-4"></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Protocol in Progress</span>
                        </div>
                        <div className="md:w-2/3">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                                    {task.status}
                                </span>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Processing...</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-400 mb-4 tracking-tight">{task.topic}</h2>

                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {task.steps?.map((step, idx) => {
                                    const duration = formatDuration(step.start_time, step.end_time);
                                    return (
                                        <div key={idx} className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${step.status === 'completed' ? 'bg-green-500' :
                                            step.status === 'running' ? 'bg-orange-500 animate-pulse' :
                                                step.status === 'error' ? 'bg-red-500' : 'bg-gray-200'
                                            }`} title={`${step.name}${duration ? ` (${duration})` : ''}`}></div>
                                    );
                                })}
                            </div>

                            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">The engine is currently orchestrating the {task.current_step} layer...</p>
                        </div>
                    </div>
                ))}

                {/* Published Posts */}
                {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        <div className="md:w-1/3 h-64 md:h-auto bg-gray-50 relative group overflow-hidden flex items-center justify-center border-r-[1px] border-gray-50">
                            {post.image_crm?.[0] ? (
                                <img
                                    src={`http://localhost:8080/${post.image_crm[0]}`}
                                    alt={post.title?.[0]}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                    <span className="material-icons text-gray-200 text-8xl group-hover:scale-110 transition-transform duration-500">article</span>
                                </>
                            )}
                        </div>
                        <div className="p-10 md:w-2/3 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-3">
                                    <span className="bg-gray-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200">
                                        {post.status || 'Draft'}
                                    </span>
                                    {post.seo_data?.score && (
                                        <div className="group relative">
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border ${post.seo_data.score >= 90 ? 'bg-green-50 text-green-600 border-green-100' :
                                                post.seo_data.score >= 80 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                Quality: {post.seo_data.score}%
                                            </span>
                                            {/* Tooltip for Scoring */}
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 z-50 invisible group-hover:visible transition-all duration-300 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                                                <h4 className="text-[10px] font-black text-gray-900 uppercase mb-2 border-b pb-2">Editorial Quality Grade</h4>
                                                <ul className="space-y-2">
                                                    <li className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Depth of Analysis</li>
                                                    <li className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Originality</li>
                                                    <li className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Authority Tone</li>
                                                    <li className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Reader Engagement</li>
                                                </ul>
                                                <p className="mt-3 text-[8px] text-gray-400 leading-tight italic font-medium">Determined by the Evaluator Agent using professional editorial standards.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{new Date(post.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight group-hover:text-indigo-600 transition-colors duration-300 tracking-tight">{post.title && post.title[0]}</h2>
                            <p className="text-gray-500 text-sm mb-10 line-clamp-3 leading-relaxed font-medium">
                                {post.content && post.content[0]?.replace(/[#*`>]/g, '').substring(0, 240)}...
                            </p>
                            <div className="mt-auto flex flex-wrap gap-3 pt-6 border-t border-gray-50">
                                {post.status !== 'Published' ? (
                                    <button
                                        onClick={() => handlePublish(post.id)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-500/20 text-[10px] uppercase tracking-widest active:scale-95 flex items-center gap-2"
                                    >
                                        <i className="material-icons text-sm">publish</i>
                                        Publish to Live Blog
                                    </button>
                                ) : (
                                    <div className="bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl border border-emerald-100 flex items-center gap-2">
                                        <i className="material-icons text-sm">check_circle</i>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Live on Blog</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedPost(post)}
                                    className="bg-gray-900 hover:bg-black text-white font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-gray-200 text-[10px] uppercase tracking-widest active:scale-95 flex items-center gap-2"
                                >
                                    <i className="material-icons text-sm">visibility</i>
                                    Review Data
                                </button>
                                <button
                                    onClick={() => setEditingPost(post)}
                                    className="border-2 border-gray-100 hover:border-indigo-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 font-black py-4 px-8 rounded-2xl transition-all duration-300 text-[10px] uppercase tracking-widest flex items-center gap-2"
                                >
                                    <i className="material-icons text-sm">edit</i>
                                    Refine
                                </button>
                                <button
                                    onClick={() => setRetryModal({ postId: post.id, topic: post.title?.[0] || 'Post' })}
                                    className="border-2 border-orange-100 hover:border-orange-300 text-orange-400 hover:text-orange-600 hover:bg-orange-50 font-black py-4 px-8 rounded-2xl transition-all duration-300 text-[10px] uppercase tracking-widest flex items-center gap-2"
                                >
                                    <i className="material-icons text-sm">replay</i>
                                    Rerun
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Edit Post Content</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Article Title</label>
                                <input
                                    id="edit-title-input"
                                    type="text"
                                    defaultValue={editingPost.title && editingPost.title[0]}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 font-bold text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Body Content (HTML Supported)</label>
                                <textarea
                                    id="edit-content-input"
                                    rows="12"
                                    defaultValue={editingPost.content && editingPost.content[0]}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 font-medium text-gray-700 font-serif leading-relaxed"
                                ></textarea>
                            </div>
                        </div>
                        <div className="mt-10 flex space-x-4">
                            <button
                                onClick={handleUpdatePost}
                                className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-green-100"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => setEditingPost(null)}
                                className="flex-1 bg-gray-100 text-gray-400 font-extrabold py-4 rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
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
                        <p className="text-[11px] text-gray-500 font-medium mb-6 pl-13">
                            Regenerating: <span className="font-black text-gray-800 italic">{retryModal.topic}</span>
                        </p>

                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Data Source</p>
                        <div className="space-y-3 mb-8">
                            <button
                                onClick={() => handleRetry(retryModal.postId, true)}
                                className="w-full text-left p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:border-indigo-400 transition-all group"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <i className="material-icons text-indigo-500 text-lg">inventory_2</i>
                                    <span className="text-sm font-black text-gray-900">Reuse Cached Data</span>
                                    <span className="ml-auto text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">0 API Calls</span>
                                </div>
                                <p className="text-[10px] text-gray-500 pl-8">Skip GNews — regenerate the article from previously scraped sources. Faster, no quota cost.</p>
                            </button>

                            <button
                                onClick={() => handleRetry(retryModal.postId, false)}
                                className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-orange-200 transition-all group"
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <i className="material-icons text-orange-500 text-lg">travel_explore</i>
                                    <span className="text-sm font-black text-gray-900">Scrape Fresh Data</span>
                                    <span className="ml-auto text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">Live Search</span>
                                </div>
                                <p className="text-[10px] text-gray-500 pl-8">Run a new GNews search and scrape fresh articles before regenerating. More tokens, latest data.</p>
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

            {posts.length === 0 && (
                <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-xl font-bold tracking-tight">No posts generated yet.</p>
                </div>
            )}
        </div>
    );
};

export default Posts;
