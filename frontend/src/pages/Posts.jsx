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
    const [retryModal, setRetryModal] = useState(null); // { postId, topic }

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
                fetch('http://localhost:8080/api/v1/posts/'),
                fetch('http://localhost:8080/api/v1/generation/tasks')
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
            const response = await fetch(`http://localhost:8080/api/v1/posts/${postId}`, {
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

    const handleRetry = async (postId, reuseCache) => {
        setRetryModal(null);
        try {
            const res = await fetch('http://localhost:8080/api/v1/generation/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    post_id: postId,
                    reuse_scrape: reuseCache,
                    include_images: false
                })
            });
            if (!res.ok) throw new Error('Failed to trigger retry');
            const data = await res.json();
            alert(`✅ Pipeline re-triggered! Task ID: ${data.task_id}`);
            fetchAllData();
        } catch (err) {
            alert('❌ Retry failed: ' + err.message);
        }
    };

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

                    <div className="flex flex-col lg:flex-row min-h-screen">
                        {/* Left Column: Content */}
                        <div className="lg:w-2/3 p-10 lg:p-20 bg-white">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center space-x-6 mb-12 pb-8 border-b border-gray-100 font-black text-[9px] text-gray-400 uppercase tracking-widest">
                                    <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">edit_note</span> AI EDITORIAL TEAM</div>
                                    <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">schedule</span> {new Date(selectedPost.created_at).toLocaleDateString()}</div>
                                    <div className="flex items-center"><span className="material-icons mr-2 text-indigo-400 text-sm">history_edu</span> {selectedPost.word_count || 0} WORDS</div>
                                </div>

                                <h1 className="text-5xl font-black text-gray-900 leading-[1.1] mb-12 tracking-tighter">
                                    {selectedPost.title && selectedPost.title[0]}
                                </h1>

                                <div className="markdown-container prose prose-indigo max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-4xl font-black text-gray-900 mt-12 mb-6 tracking-tight" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-2xl font-black text-gray-800 mt-10 mb-5 tracking-tight border-l-4 border-indigo-500 pl-6" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-xl font-black text-gray-800 mt-8 mb-4 tracking-tight" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-gray-600 text-lg leading-[1.8] mb-8 font-medium" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-none space-y-4 mb-8 ml-4 border-l-2 border-gray-50 pl-6" {...props} />,
                                            li: ({ node, ...props }) => (
                                                <li className="flex items-start text-gray-600 text-lg leading-relaxed" {...props}>
                                                    <span className="text-indigo-500 mr-3 mt-1.5 material-icons text-[10px]">alternate_email</span>
                                                    <span>{props.children}</span>
                                                </li>
                                            ),
                                            blockquote: ({ node, ...props }) => (
                                                <div className="bg-indigo-50/30 border-l-4 border-indigo-500 p-10 my-10 rounded-r-[2.5rem] italic text-indigo-900 text-xl font-medium leading-relaxed shadow-sm" {...props} />
                                            )
                                        }}
                                    >
                                        {selectedPost.content && selectedPost.content[0]}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Research & Meta (Sticky) */}
                        <div className="lg:w-1/3 bg-gray-50/50 border-l border-gray-100 p-10 lg:p-12 relative">
                            <div className="sticky top-12 space-y-10">
                                {/* SEO / Quality Score Card */}
                                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-4">Authority Score</h4>
                                    <div className="flex items-end gap-3 mb-6">
                                        <span className={`text-6xl font-black tracking-tighter ${(selectedPost.seo_data?.score || 0) >= 85 ? 'text-indigo-600' : 'text-orange-500'}`}>
                                            {selectedPost.seo_data?.score || 0}%
                                        </span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SEO Score</span>
                                    </div>

                                    {/* Coverage Score */}
                                    {selectedPost.seo_data?.coverage_score && (
                                        <div className="mb-4">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">SERP Coverage</span>
                                                <span className="text-[9px] font-black text-indigo-600">{selectedPost.seo_data.coverage_score}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${selectedPost.seo_data.coverage_score}%` }}></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">Primary Keyword</span>
                                            <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">{selectedPost.seo_data?.focus_keyword || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">Search Intent</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedPost.seo_data?.search_intent === 'commercial' ? 'bg-amber-50 text-amber-600' :
                                                selectedPost.seo_data?.search_intent === 'transactional' ? 'bg-green-50 text-green-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>{selectedPost.seo_data?.search_intent || 'Informational'}</span>
                                        </div>
                                        {selectedPost.seo_data?.url_slug && (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight block mb-1">URL Slug</span>
                                                <span className="text-[9px] font-mono text-gray-700">/{selectedPost.seo_data.url_slug}</span>
                                            </div>
                                        )}
                                        {selectedPost.seo_data?.meta_description && (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight block mb-1">Meta Description</span>
                                                <span className="text-[9px] text-gray-600 leading-relaxed">{selectedPost.seo_data.meta_description}</span>
                                            </div>
                                        )}
                                        {selectedPost.seo_data?.title_variants && selectedPost.seo_data.title_variants.length > 0 && (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight block mb-2">Title Variants</span>
                                                <div className="space-y-1">
                                                    {selectedPost.seo_data.title_variants.map((t, i) => (
                                                        <p key={i} className="text-[9px] text-gray-700 leading-tight pl-2 border-l-2 border-indigo-200">{t}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">Hash Tags</span>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedPost.seo_data?.hashtags ? selectedPost.seo_data.hashtags.map((tag, i) => (
                                                    <span key={i} className="text-[9px] font-black text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{tag}</span>
                                                )) : <span className="text-[9px] font-black text-gray-400">#not_provided</span>}
                                            </div>
                                        </div>
                                        {selectedPost.seo_data?.coverage_missing && selectedPost.seo_data.coverage_missing.length > 0 && (
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight block mb-1">Coverage Gaps</span>
                                                {selectedPost.seo_data.coverage_missing.map((gap, i) => (
                                                    <p key={i} className="text-[9px] text-amber-700">• {gap}</p>
                                                ))}
                                            </div>
                                        )}
                                        {selectedPost.seo_data?.internal_link_suggestions && selectedPost.seo_data.internal_link_suggestions.length > 0 && (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight block mb-1">Internal Link Ideas</span>
                                                {selectedPost.seo_data.internal_link_suggestions.map((s, i) => (
                                                    <p key={i} className="text-[9px] text-gray-600">→ {s}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Research Sources Pane */}
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <i className="material-icons text-indigo-400 text-sm">hub</i> Research Node Links
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedPost.research_sources && selectedPost.research_sources.length > 0 ? (
                                            selectedPost.research_sources.map((source, idx) => (
                                                <a
                                                    key={idx}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block bg-white border border-gray-100 p-4 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">Source {idx + 1}</span>
                                                        <i className="material-icons text-[12px] text-gray-300 group-hover:text-indigo-500 transition-colors">open_in_new</i>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-relaxed">
                                                        {source.title || source.url}
                                                    </p>
                                                </a>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                                Sources Baked into Text
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                        <div className="md:w-1/3 h-64 md:h-auto bg-gray-50 relative group overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <span className="material-icons text-gray-200 text-8xl group-hover:scale-110 transition-transform duration-500">article</span>
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
