import React, { useState, useEffect, useCallback, memo } from 'react';
import ArticlePreview from '../components/ArticlePreview';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:8080/api/v1';

// Memoized Task Item to prevent re-rendering all tasks when one updates
const TaskItem = memo(({ task, formatDuration }) => (
    <div key={task.task_id} className="bg-slate-900/50 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row p-10 gap-8 transition-all duration-500 backdrop-blur-xl">
        <div className="md:w-1/3 flex flex-col items-center justify-center bg-teal-500/5 rounded-3xl p-8 border border-teal-500/10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500 mb-6 shadow-[0_0_15px_rgba(20,184,166,0.2)]"></div>
            <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] text-center">Protocol in Progress</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 px-3 py-1 bg-slate-950 rounded-full border border-white/5">{task.status}</span>
        </div>
        <div className="md:w-2/3">
            <div className="flex justify-between items-center mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border ${
                    task.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    task.status === 'completed' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                    Status: {task.status}
                </span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                    {task.status === 'completed' ? 'Finalized' : task.status === 'error' ? 'Critical Failure' : 'Orchestrating...'}
                </span>
            </div>
            <h2 className="text-2xl font-black text-white mb-6 tracking-tight leading-tight uppercase">{task.topic}</h2>

            <div className="flex flex-wrap gap-2 mb-8">
                {task.steps?.map((step, idx) => {
                    const duration = formatDuration(step.start_time, step.end_time);
                    return (
                        <div key={idx} className={`w-3 h-3 rounded-full border-2 border-slate-900 shadow-lg transition-all duration-500 ${step.status === 'completed' ? 'bg-teal-500 shadow-teal-500/50' :
                            step.status === 'running' ? 'bg-orange-400 animate-pulse shadow-orange-400/50' :
                                step.status === 'error' ? 'bg-red-500 shadow-red-500/50' : 'bg-slate-800'
                            }`} title={`${step.name}${duration ? ` (${duration})` : ''}`}></div>
                    );
                })}
            </div>

            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                {task.status === 'error' ? 'Encountered obstruction at ' : 'Synthesizing ' } 
                <span className={task.status === 'error' ? 'text-red-400' : 'text-teal-400'}>
                    {task.current_step || "Initialization"}
                </span> layer
            </p>
            
            <div className="bg-slate-950/80 rounded-2xl p-6 font-mono text-[10px] text-teal-400/90 overflow-hidden h-32 relative border border-white/5 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 pointer-events-none z-10"></div>
                <div className="z-0 w-full space-y-2">
                    {(task.logs?.length ? task.logs : ["Bootstrapping deterministic pipeline parameters...", "Connecting to Celery task orchestrator...", "Awaiting agent assignment..."]).slice(-4).map((log, i) => (
                        <div key={i} className={`flex gap-3 opacity-${i === 3 ? '100' : 60-i*10} truncate`}>
                            <span className="text-indigo-400 shrink-0 font-bold opacity-50">&gt;</span>
                            <span className="truncate italic tracking-wide">{log}</span>
                        </div>
                    ))}
                    <div className="flex gap-3 mt-1 items-center">
                        <span className="text-indigo-400 shrink-0 font-bold opacity-50">&gt;</span>
                        <span className="w-1.5 h-3 bg-teal-400 animate-pulse"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
));

const PostItem = memo(({ post, onView, onEdit, onDelete }) => (
    <div key={post.id} className="bg-slate-900/40 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row hover:bg-slate-900/60 transition-all duration-700 group backdrop-blur-sm">
        <div className="md:w-1/3 h-72 md:h-auto bg-slate-950/50 relative overflow-hidden flex items-center justify-center border-r border-white/5">
            {post.image_crm?.[0] ? (
                <img
                    src={post.image_crm[0].startsWith('http') ? post.image_crm[0] : `http://localhost:8080/${post.image_crm[0]}`}
                    alt={post.title?.[0]}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
            ) : (
                <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                    <span className="material-icons text-7xl">auto_stories</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-center">No Visual Asset</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent pointer-events-none md:hidden"></div>
        </div>
        <div className="p-12 md:w-2/3 flex flex-col relative">
            <div className="absolute top-0 right-0 p-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <button
                    onClick={() => onEdit(post)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-950 border border-white/10 text-slate-500 hover:text-teal-400 hover:border-teal-400/30 rounded-2xl transition-all duration-300 shadow-xl"
                    title="Refine Post"
                >
                    <i className="material-icons text-lg">edit</i>
                </button>
                <button
                    onClick={() => onDelete(post.id)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-950 border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-400/30 rounded-2xl transition-all duration-300 shadow-xl"
                    title="Delete Post"
                >
                    <i className="material-icons text-lg">delete</i>
                </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                    {post.status || 'Draft'}
                </span>
                {post.seo_data?.score && (
                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${post.seo_data.score >= 90 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        post.seo_data.score >= 80 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        Grade: {post.seo_data.score}%
                    </span>
                )}
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] ml-auto">{new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <h2 className="text-4xl font-black text-white mb-6 leading-none tracking-tighter group-hover:text-teal-400 transition-colors duration-500">{post.title && post.title[0]}</h2>
            <p className="text-slate-400 text-sm font-medium line-clamp-3 leading-relaxed mb-10 max-w-2xl">
                {post.content && post.content[0] ? post.content[0].replace(/[#*]/g, '').substring(0, 240) + '...' : 'Awaiting intelligence synthesis...'}
            </p>

            <div className="mt-auto flex items-center gap-6">
                <button
                    onClick={() => onView(post)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-2xl transition-all duration-300 shadow-2xl shadow-indigo-600/30 text-[10px] uppercase tracking-[0.2em] active:scale-95 flex items-center gap-3 group/btn"
                >
                    Extract Insight
                    <i className="material-icons text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</i>
                </button>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Source Origin</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{post.source || 'Aggregated'}</span>
                </div>
            </div>
        </div>
    </div>
));

const Posts = () => {
    const { orgId } = useAuthStore();
    const [posts, setPosts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

    const formatDuration = useCallback((start, end) => {
        if (!start || !end) return null;
        const secs = Math.round(end - start);
        if (secs < 60) return `${secs}s`;
        return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    }, []);

    const fetchAllData = useCallback(async () => {
        try {
            const res = await api.get('/posts/');
            setPosts(Array.isArray(res.data) ? res.data : []);
            
            const tasksRes = await api.get('/generation/tasks');
            const runningTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            setTasks(runningTasks.filter(t => ['running', 'pending', 'in_progress'].includes(t.status)));
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (!orgId) return;

        const wsUrl = API_BASE.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/generation/ws/tasks/${orgId}`);
        
        ws.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data);
                if (update.task_id) {
                    setTasks(prev => {
                        const index = prev.findIndex(t => t.task_id === update.task_id);
                        if (index !== -1) {
                            const newTasks = [...prev];
                            newTasks[index] = { ...newTasks[index], ...update };
                            
                            if (update.status === 'completed' || update.status === 'error') {
                                setTimeout(() => {
                                    setTasks(latest => latest.filter(t => t.task_id !== update.task_id));
                                    if (update.status === 'completed') {
                                        setTimeout(fetchAllData, 500);
                                    }
                                }, 3000);
                            }
                            return newTasks;
                        } else if (update.status === 'running' || update.status === 'pending') {
                            return [...prev, update];
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.error('WS parse error:', err);
            }
        };

        ws.onerror = (error) => console.error('WebSocket Error:', error);
        return () => ws.close();
    }, [orgId, fetchAllData]);

    const handleDelete = useCallback(async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            fetchAllData();
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    }, [fetchAllData]);

    const handleUpdatePost = async () => {
        if (!editingPost) return;
        try {
            const titleInput = document.querySelector('#edit-title-input');
            const contentInput = document.querySelector('#edit-content-input');
            const updatedTitle = titleInput?.value || editingPost.title?.[0];
            const updatedContent = contentInput?.value || editingPost.content?.[0];
            
            await api.put(`/posts/${editingPost.id}`, {
                title: [updatedTitle], 
                content: [updatedContent] 
            });
            setEditingPost(null);
            fetchAllData();
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]"></div>
        </div>
    );

    if (selectedPost) {
        return (
            <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ArticlePreview
                    post={selectedPost}
                    onBack={() => setSelectedPost(null)}
                    onUpdate={(updated) => {
                        setSelectedPost(updated);
                        fetchAllData();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-12 max-w-[1200px] mx-auto animate-in fade-in duration-1000">
            <div className="mb-20">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-[1px] bg-teal-500/50"></div>
                    <p className="text-teal-400 font-black uppercase tracking-[0.4em] text-[10px]">Intellectual Property Registry</p>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none uppercase">Authority Posts</h1>
            </div>
            
            <div className="grid grid-cols-1 gap-12 pb-24">
                {tasks.length > 0 && (
                    <div className="space-y-8 animate-in slide-in-from-left duration-700">
                        {tasks.map((task) => (
                            <TaskItem key={task.task_id} task={task} formatDuration={formatDuration} />
                        ))}
                    </div>
                )}

                <div className="space-y-12">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                onView={setSelectedPost}
                                onEdit={setEditingPost}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5 grayscale">
                            <span className="material-icons text-8xl text-slate-800 mb-6">inventory_2</span>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Registry is currently empty</p>
                        </div>
                    )}
                </div>
            </div>

            {editingPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Edit Post Content</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Article Title</label>
                                <input id="edit-title-input" type="text" defaultValue={editingPost.title && editingPost.title[0]} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 font-bold text-gray-800" />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Body Content</label>
                                <textarea id="edit-content-input" rows="12" defaultValue={editingPost.content && editingPost.content[0]} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 font-medium text-gray-700 font-serif leading-relaxed" />
                            </div>
                        </div>
                        <div className="mt-10 flex space-x-4">
                            <button onClick={handleUpdatePost} className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-all text-sm uppercase tracking-widest shadow-lg shadow-green-100">Save Changes</button>
                            <button onClick={() => setEditingPost(null)} className="flex-1 bg-gray-100 text-gray-400 font-extrabold py-4 rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Posts;

