
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';

export default function PostCard({ post, featured = false }) {
    if (!post) return null;

    return (
        <Link
            to={`/blog/${post.slug}`}
            className={`group block animate-reveal ${featured ? 'relative' : 'flex flex-col h-full'}`}
        >
            <div className={`image-zoom-container rounded-3xl mb-6 relative shadow-sm transition-all duration-500 group-hover:shadow-2xl dark:group-hover:shadow-none group-hover:-translate-y-2 border border-transparent dark:group-hover:border-neutral-800 ${featured ? 'aspect-[16/9]' : 'aspect-square'}`}>
                {post.image_url ? (
                    <img
                        src={post.image_url.startsWith('http') ? post.image_url : `http://localhost:8080/${post.image_url}`}
                        alt={post.title}
                        className="w-full h-full object-cover rounded-3xl"
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-50 dark:bg-neutral-800/20 flex items-center justify-center p-12 rounded-3xl">
                        <div className="w-full h-full border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-[radial-gradient(#eaeaea_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]" />
                    </div>
                )}

                {/* Category Tag */}
                <div className="absolute top-4 left-4">
                    <span className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-900 dark:text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                        {post.category || 'Intelligence'}
                    </span>
                </div>
            </div>

            <div className={`flex flex-col flex-1 ${featured ? 'max-w-2xl' : ''}`}>
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 transition-colors">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 transition-colors">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {post.read_time || '5 min'} read
                        </span>
                    </div>
                </div>

                <h3 className={`font-serif font-bold text-neutral-900 dark:text-white transition-colors duration-300 group-hover:text-brand leading-tight mb-3 ${featured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                    {post.title}
                </h3>

                <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base line-clamp-2 leading-relaxed mb-6 font-medium transition-colors">
                    {post.excerpt || post.meta_description}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2 text-neutral-900 dark:text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em] group-hover:text-brand transition-colors">
                    Read Article
                    <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800 transition-all duration-300 group-hover:w-12 group-hover:bg-brand"></div>
                </div>
            </div>
        </Link>
    );
}
