import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

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

    const fetchAllData = async () => {
        try {
            const [postsRes, tasksRes] = await Promise.all([
                fetch('http://localhost:8000/api/v1/posts/'),
                fetch('http://localhost:8000/api/v1/generation/tasks')
            ]);

            if (!postsRes.ok || !tasksRes.ok) throw new Error('Failed to fetch data');

            const postsData = await postsRes.json();
            const tasksData = await tasksRes.json();

            setPosts(postsData);
            // Filter only running or error tasks that don't have a post yet
            const runningTasks = tasksData.filter(t =>
                (t.status === 'running' || t.status === 'pending') &&
                !postsData.some(p => p.title[0] === t.topic)
            );
            setTasks(runningTasks);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdatePost = (updatedData) => {
        alert("Post updated successfully! (Local simulation)");
        setEditingPost(null);
    };

    const handlePublish = async (postId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Published' })
            });
            if (!response.ok) throw new Error('Failed to publish post');
            fetchAllData();
            alert("Post published successfully!");
        } catch (err) {
            alert("Error publishing: " + err.message);
        }
    };

    if (loading && posts.length === 0 && tasks.length === 0) return (
        <div className="flex justify-center p-8 min-h-screen items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-red-600 bg-red-50 rounded-3xl m-8 text-center border-2 border-red-100 font-black uppercase tracking-widest">
            Error: {error}
        </div>
    );

    if (selectedPost) {
        return (
            <div className="p-8 bg-gray-50 min-h-screen">
                <button
                    onClick={() => setSelectedPost(null)}
                    className="mb-8 flex items-center text-gray-500 font-black hover:text-indigo-600 transition-all duration-300 uppercase tracking-widest text-[10px]"
                >
                    <span className="material-icons mr-2 text-sm">arrow_back</span> BACK TO REPOSITORY
                </button>
                <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                    <div className="h-[400px] bg-gray-900 relative flex items-center justify-center overflow-hidden">
                        {/* Branded style simulation */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-black/60 z-10"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <span className="material-icons text-[200px] text-white">auto_awesome</span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-12 pt-32 z-20">
                            <div className="flex gap-4 mb-4">
                                <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">Premium Article</span>
                                <span className="bg-white/20 text-white backdrop-blur-md px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">Post #{selectedPost.id}</span>
                            </div>
                            <h1 className="text-5xl font-black text-white leading-[1.1] drop-shadow-2xl max-w-4xl tracking-tight">
                                {selectedPost.title && selectedPost.title[0]}
                            </h1>
                        </div>
                    </div>

                    <div className="p-16">
                        <div className="flex items-center space-x-8 mb-12 pb-12 border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                            <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">edit_note</span> AI EDITORIAL TEAM</div>
                            <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">schedule</span> {new Date(selectedPost.created_at).toLocaleDateString()}</div>
                            <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">history_edu</span> {selectedPost.word_count || 0} WORDS</div>
                            <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">verified</span> {selectedPost.status}</div>
                        </div>

                        <div className="markdown-container">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-4xl font-black text-gray-900 mt-12 mb-6 tracking-tight" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-black text-gray-800 mt-10 mb-5 tracking-tight border-l-4 border-indigo-500 pl-6" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-black text-gray-800 mt-8 mb-4" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-600 text-lg leading-[1.8] mb-6 font-medium" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-none space-y-3 mb-8 ml-4" {...props} />,
                                    li: ({ node, ...props }) => (
                                        <li className="flex items-start text-gray-600 text-lg leading-relaxed" {...props}>
                                            <span className="text-indigo-500 mr-3 mt-1.5 material-icons text-[10px]">fiber_manual_record</span>
                                            <span>{props.children}</span>
                                        </li>
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                        <div className="bg-indigo-50/50 border-l-4 border-indigo-500 p-8 my-8 rounded-r-3xl italic text-indigo-900 text-xl font-medium leading-relaxed" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-black text-gray-900" {...props} />,
                                    code: ({ node, ...props }) => <code className="bg-gray-100 rounded px-2 py-1 font-mono text-sm text-indigo-600" {...props} />
                                }}
                            >
                                {selectedPost.content && selectedPost.content[0]}
                            </ReactMarkdown>

                            {/* Render conclusion if available separately */}
                            {selectedPost.conclusion && selectedPost.conclusion[0] && (
                                <div className="mt-16 pt-12 border-t border-gray-100">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPost.conclusion[0]}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Editorial Pipeline Results</h1>
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
                        <div className="md:w-1/3 h-64 md:h-auto bg-gray-50 relative group overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <span className="material-icons text-gray-200 text-8xl group-hover:scale-110 transition-transform duration-500">article</span>
                        </div>
                        <div className="p-10 md:w-2/3 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-gray-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200">
                                    {post.status || 'Draft'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{new Date(post.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight group-hover:text-indigo-600 transition-colors duration-300 tracking-tight">{post.title && post.title[0]}</h2>
                            <p className="text-gray-500 text-sm mb-10 line-clamp-3 leading-relaxed font-medium">
                                {post.content && post.content[0]?.replace(/[#*`>]/g, '').substring(0, 240)}...
                            </p>
                            <div className="mt-auto flex flex-wrap gap-4">
                                <button
                                    onClick={() => setSelectedPost(post)}
                                    className="bg-gray-900 hover:bg-black text-white font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-gray-200 text-[10px] uppercase tracking-widest active:scale-95"
                                >
                                    Review Data
                                </button>
                                {post.status !== 'Published' && (
                                    <button
                                        onClick={() => handlePublish(post.id)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest active:scale-95"
                                    >
                                        Publish Now
                                    </button>
                                )}
                                <button
                                    onClick={() => setEditingPost(post)}
                                    className="border-2 border-gray-100 hover:border-indigo-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 font-black py-4 px-8 rounded-2xl transition-all duration-300 text-[10px] uppercase tracking-widest"
                                >
                                    Edit
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
                                    type="text"
                                    defaultValue={editingPost.title && editingPost.title[0]}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 font-bold text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Body Content (HTML Supported)</label>
                                <textarea
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

            {posts.length === 0 && (
                <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-xl font-bold tracking-tight">No posts generated yet.</p>
                </div>
            )}
        </div>
    );
};

export default Posts;
