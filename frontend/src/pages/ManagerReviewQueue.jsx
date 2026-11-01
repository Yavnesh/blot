import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, AlertCircle, MessageSquare, ThumbsUp, RotateCcw, Share2, Search, ArrowUpRight } from 'lucide-react';
import SocialPublishModal from '../components/SocialPublishModal';

export default function ManagerReviewQueue() {
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8080/api/v1/posts/?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
                if (data.length > 0 && !selectedPost) {
                    selectPost(data[0]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const selectPost = async (post) => {
        setSelectedPost(post);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8080/api/v1/reviews/${post.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDecision = async (action) => {
        if (!selectedPost) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8080/api/v1/reviews/${selectedPost.id}/decision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: action,
                    feedback: newComment || (action === 'approve' ? 'Approved by Editorial Manager.' : 'Changes requested.')
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setSelectedPost(prev => ({ ...prev, review_status: updated.review_status }));
                setNewComment('');
                fetchPosts();
                if (action === 'approve') {
                    setIsPublishModalOpen(true);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async () => {
        if (!selectedPost || !newComment.trim()) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8080/api/v1/reviews/${selectedPost.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    comment_text: newComment,
                    step_name: 'editorial_review'
                })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment]);
                setNewComment('');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'manager_approved':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
            case 'changes_requested':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Changes Requested</span>;
            case 'submitted_to_manager':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">Awaiting Review</span>;
            case 'published':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">Published</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">Drafting</span>;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <CheckSquare className="text-teal-400" /> Editorial Review & Approval Queue
                    </h1>
                    <p className="text-xs text-slate-400">Review drafts submitted by content creators, leave inline guidance, and authorize publishing.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Posts List */}
                <div className="lg:col-span-4 bg-slate-900 border border-white/5 rounded-3xl p-4 flex flex-col overflow-hidden">
                    <div className="pb-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Submissions Feed</span>
                        <span className="text-[10px] font-bold text-teal-400">{posts.length} Posts</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
                        {posts.map((p) => {
                            const isSelected = selectedPost?.id === p.id;
                            const title = (p.title && p.title[0]) || `Post #${p.id}`;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => selectPost(p)}
                                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'bg-teal-500/10 border-teal-500/40 text-white' 
                                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{p.target_platform || 'Blog'}</span>
                                        {getStatusBadge(p.review_status)}
                                    </div>
                                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug">{title}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Post Preview & Review Actions */}
                <div className="lg:col-span-8 bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col min-h-0 overflow-hidden">
                    {selectedPost ? (
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5 shrink-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                                            {selectedPost.target_platform || 'Blog'}
                                        </span>
                                        {getStatusBadge(selectedPost.review_status)}
                                    </div>
                                    <h2 className="text-base font-black text-white">
                                        {(selectedPost.title && selectedPost.title[0]) || `Post #${selectedPost.id}`}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleDecision('request_changes')}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                        <RotateCcw size={13} /> Request Changes
                                    </button>

                                    <button
                                        onClick={() => handleDecision('approve')}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all"
                                    >
                                        <ThumbsUp size={13} /> Approve Draft
                                    </button>

                                    {selectedPost.review_status === 'manager_approved' && (
                                        <button
                                            onClick={() => setIsPublishModalOpen(true)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all"
                                        >
                                            <Share2 size={13} /> Publish Now
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content & Comments split */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 pt-4 overflow-hidden">
                                {/* Content Body */}
                                <div className="md:col-span-7 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                    <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                                        {Array.isArray(selectedPost.content) ? selectedPost.content.join('\n\n') : selectedPost.content}
                                    </div>
                                </div>

                                {/* Threaded Comments */}
                                <div className="md:col-span-5 flex flex-col bg-slate-950/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                                        <MessageSquare size={14} /> Review Discussion ({comments.length})
                                    </span>

                                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                                        {comments.length === 0 ? (
                                            <p className="text-[11px] text-slate-600 text-center py-6">No review notes yet.</p>
                                        ) : (
                                            comments.map(c => (
                                                <div key={c.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs">
                                                    <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase tracking-widest mb-1">
                                                        <span>{c.step_name || 'Note'}</span>
                                                        <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-slate-300 text-[11px]">{c.comment_text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            placeholder="Write feedback..."
                                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-600 text-xs">Select a post to review</div>
                    )}
                </div>
            </div>

            {/* Social Publish Modal */}
            <SocialPublishModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                postId={selectedPost?.id}
                postTitle={(selectedPost?.title && selectedPost.title[0]) || ''}
                postPlatform={selectedPost?.target_platform}
            />
        </div>
    );
}
