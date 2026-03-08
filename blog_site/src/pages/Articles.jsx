
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { Search, X } from 'lucide-react';

export default function Articles() {
    const { posts, loading } = usePosts();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    // Synchronize searchTerm with searchParams
    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchTerm(query);
    }, [searchParams]);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.meta_description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 transition-colors duration-500">
            <div className="w-12 h-12 border-2 border-neutral-100 dark:border-neutral-800 border-t-brand rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen pt-40 pb-24 transition-colors duration-500">
            <div className="container-custom">
                <header className="mb-20 animate-reveal">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">Archive Protocol</span>
                    <h1 className="display-medium text-neutral-900 dark:text-white mb-8 max-w-xl self-center">
                        All <span className="italic font-serif">Articles.</span>
                    </h1>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="body-standard italic max-w-sm text-neutral-500 dark:text-neutral-400 font-medium">
                            A complete index of our autonomous research entries, essays, and technological deep-dives.
                        </p>
                        <div className="relative max-w-sm w-full">
                            <input
                                type="text"
                                placeholder="Search archives..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSearchParams(e.target.value ? { search: e.target.value } : {});
                                }}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-full py-4 px-12 text-sm outline-none focus:border-neutral-900 dark:focus:border-brand transition-all dark:text-white"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchParams({});
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                                >
                                    <X size={14} className="text-neutral-400" />
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 animate-reveal delay-200">
                    {filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>

                {filteredPosts.length === 0 && (
                    <div className="py-32 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[3rem] animate-reveal">
                        <p className="text-neutral-400 dark:text-neutral-600 font-serif italic text-xl">
                            {searchTerm ? `No articles matching "${searchTerm}" found.` : "No articles found in the digital repository."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
