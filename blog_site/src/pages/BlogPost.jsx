import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePost, usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { ArrowLeft, Clock, Calendar, Share2, Bookmark, User, MessageSquare } from 'lucide-react';

export default function BlogPost() {
    const { slug } = useParams();
    const { post, loading, error } = usePost(slug);
    const { posts: allPosts } = usePosts();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 transition-colors duration-500">
            <div className="w-12 h-12 border-2 border-neutral-100 dark:border-neutral-800 border-t-brand rounded-full animate-spin"></div>
        </div>
    );

    if (error || !post) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 p-6 text-center transition-colors duration-500">
            <h1 className="display-medium dark:text-white mb-4">Post not found</h1>
            <p className="body-large dark:text-neutral-400 mb-8">The digital archives do not contain this specific entry.</p>
            <Link to="/" className="text-brand font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                <ArrowLeft size={16} /> Return to Home
            </Link>
        </div>
    );

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), text: newComment, author: 'Anonymous Visitor', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }]);
        setNewComment("");
    };

    // Clean up content preamble (if any)
    let cleanContent = post.content || "";
    if (cleanContent.includes("Here is the ") || cleanContent.includes("Analysis:") || cleanContent.includes("**")) {
        // basic heuristic to strip common AI intro sentences before the main content starts.
        // Also just regex replace any single generic starting block like "Here is the article:"
        cleanContent = cleanContent.replace(/^(Here is the .*?)\n+/i, '');
        cleanContent = cleanContent.replace(/^(I have written .*?)\n+/i, '');
    }

    // Suggest related posts (exclude current)
    const relatedPosts = allPosts
        .filter(p => p.slug !== slug)
        .slice(0, 3);

    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen pb-24 transition-colors duration-500">
            {/* 8. Article Page Header */}
            <header className="pt-32 pb-16 md:pt-40 md:pb-24 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-800/20">
                <div className="container-custom">
                    <div className="max-w-[800px] mx-auto animate-reveal">
                        <Link to="/articles" className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-8 flex items-center gap-2 group w-fit">
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Back to Articles
                        </Link>

                        <div className="mb-6 flex items-center gap-3">
                            <span className="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {post.category || 'Intelligence'}
                            </span>
                            <div className="w-10 h-[1px] bg-neutral-200 dark:bg-neutral-800"></div>
                            {post.seo_score > 0 && (
                                <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Score: {post.seo_score}%</span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-serif font-black leading-[1.1] text-neutral-900 dark:text-white mb-8 tracking-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-8 border-t border-neutral-100 dark:border-neutral-800 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <User size={18} className="text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Research Agent v4</p>
                                    <p className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">Lead Investigator</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest transition-colors">
                                    {new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                                <Clock size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest transition-colors">{post.read_time || '5 min'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="container-custom -mt-12 md:-mt-20 mb-20 md:mb-24 animate-reveal delay-200">
                <div className="max-w-[1100px] mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800 aspect-[16/9] md:aspect-[21/9]">
                    {post.image_url ? (
                        <img
                            src={post.image_url.startsWith('http') ? post.image_url : `http://localhost:8080/${post.image_url}`}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800/40" />
                    )}
                </div>
            </div>

            {/* Article Body */}
            <section className="container-custom mb-32">
                <div className="flex flex-col lg:flex-row gap-20">
                    {/* Left Toolbar - Desktop Only */}
                    <div className="hidden lg:block w-12 sticky top-48 h-fit space-y-8 animate-reveal delay-500">
                        <button onClick={handleShare} className="w-12 h-12 rounded-full border border-neutral-100 dark:border-neutral-800 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white relative group">
                            <Share2 size={18} />
                            {copied && <span className="absolute left-16 text-[10px] bg-neutral-900 text-white px-2 py-1 rounded">Copied!</span>}
                        </button>
                        <button onClick={() => setIsBookmarked(!isBookmarked)} className={`w-12 h-12 rounded-full border border-neutral-100 dark:border-neutral-800 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${isBookmarked ? 'text-brand bg-brand/5 border-brand/20' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                            <Bookmark size={18} className={isBookmarked ? "fill-brand" : ""} />
                        </button>
                        <div className="w-12 h-[1px] bg-neutral-100 dark:bg-neutral-800"></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700 transform -rotate-90 origin-center translate-y-8 select-none">
                            BLOT.IP
                        </div>
                    </div>

                    {/* Main Content */}
                    <article className="flex-1 animate-reveal delay-300 max-w-full overflow-hidden">
                        <div className="prose-editorial">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {cleanContent}
                            </ReactMarkdown>
                        </div>

                        {/* Article Tags/Footer */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="prose-editorial border-t border-neutral-100 dark:border-neutral-800 mt-20 pt-12 flex flex-wrap gap-4">
                                {post.hashtags.map(tag => (
                                    <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-lg hover:text-brand transition-colors cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="mt-20 pt-12 border-t border-neutral-100 dark:border-neutral-800">
                            <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
                                <MessageSquare size={24} className="text-neutral-400" /> Discussion ({comments.length})
                            </h3>

                            <form onSubmit={handleAddComment} className="mb-12">
                                <textarea
                                    className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand transition-colors resize-none text-neutral-900 dark:text-white placeholder-neutral-400"
                                    rows="4"
                                    placeholder="Add your perspective..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                ></textarea>
                                <div className="flex justify-end mt-4">
                                    <button type="submit" className="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-colors">
                                        Post Comment
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-8">
                                {comments.map(c => (
                                    <div key={c.id} className="flex gap-4 p-6 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-neutral-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">{c.author}</span>
                                                <span className="text-[10px] font-bold text-neutral-400">{c.date}</span>
                                            </div>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="section-padding bg-neutral-50/50 dark:bg-neutral-800/10 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="container-custom">
                        <h2 className="heading-medium tracking-tight text-neutral-900 dark:text-white mb-12">Related Perspectives</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                            {relatedPosts.map(p => (
                                <PostCard key={p.id} post={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
