
import React from 'react';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

export default function Home() {
    const { posts, loading } = usePosts();

    // Split posts into Featured and Recent
    const featuredPosts = posts.slice(0, 3);
    const recentPosts = posts.slice(3, 9);
    const heroPost = posts[0];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 transition-colors duration-500">
            <div className="w-12 h-12 border-2 border-neutral-100 dark:border-neutral-800 border-t-brand rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-neutral-900 transition-colors duration-500">
            {/* 3. Hero Section */}
            <section className="pt-40 pb-24 md:pt-48 md:pb-32 bg-neutral-50/50 dark:bg-neutral-800/20 border-b border-neutral-100 dark:border-neutral-800 overflow-hidden relative">
                {/* Background Subtle Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="container-custom relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="animate-reveal">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">The Future of Content v4.0</span>
                            <h1 className="display-large text-neutral-900 dark:text-white mb-8 max-w-xl">
                                From a simple Blot to <span className="text-brand">infinite ideas</span>.
                            </h1>
                            <p className="body-large mb-12 max-w-lg italic text-neutral-500 dark:text-neutral-400">
                                Welcome to <strong>Blot</strong> — where the <strong>Blog</strong> meets the <strong>Bot</strong>. A modern AI-powered editorial desk delivering high-quality articles on technology, business, and the culture of tomorrow.
                            </p>
                            <div className="flex flex-wrap gap-6">
                                <Link to="/articles" className="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-10 py-5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all hover:translate-x-1 flex items-center gap-3 shadow-xl shadow-neutral-200 dark:shadow-none">
                                    Read Articles <ArrowRight size={14} />
                                </Link>
                                <button className="border-2 border-neutral-100 dark:border-neutral-800 px-10 py-5 rounded-full text-xs font-bold uppercase tracking-widest hover:border-brand transition-all hover:bg-brand/5 dark:text-white">
                                    Subscribe
                                </button>
                            </div>
                        </div>

                        {heroPost && (
                            <div className="animate-reveal delay-200">
                                <PostCard post={heroPost} featured={true} />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. Featured Articles Section */}
            {featuredPosts.length > 0 && (
                <section className="section-padding border-b border-neutral-100 dark:border-neutral-800">
                    <div className="container-custom">
                        <div className="flex items-center justify-between mb-12 md:mb-16">
                            <h2 className="heading-large tracking-tight text-neutral-900 dark:text-white">Featured</h2>
                            <Link to="/articles" className="text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-brand transition-colors flex items-center gap-2">
                                View Selection <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                            {featuredPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. Recent Articles Grid */}
            {recentPosts.length > 0 && (
                <section className="section-padding bg-neutral-50/30 dark:bg-neutral-800/10">
                    <div className="container-custom">
                        <div className="flex items-center justify-between mb-12 md:mb-16">
                            <h2 className="heading-large tracking-tight text-neutral-900 dark:text-white">Recent Articles</h2>
                            <div className="w-1/3 h-[1px] bg-neutral-100 dark:bg-neutral-800"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                            {recentPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>

                        <div className="mt-20 text-center">
                            <Link to="/articles" className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] border-b-2 border-neutral-100 dark:border-neutral-800 pb-2 hover:border-brand transition-all dark:text-white">
                                Load More Stories <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* 7. Newsletter Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="bg-neutral-900 dark:bg-black rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl transition-colors duration-500">
                        {/* Abstract Background Element */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand opacity-10 rounded-full blur-[100px]"></div>
                        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand opacity-10 rounded-full blur-[100px]"></div>

                        <div className="max-w-2xl mx-auto relative z-10 animate-reveal">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                                Stay updated with our <span className="text-brand italic">latest stories</span>
                            </h2>
                            <p className="text-neutral-400 text-lg md:text-xl mb-12 italic">
                                Subscribe to receive new articles, deep-dives into human creative logic, and technology news directly in your inbox.
                            </p>
                            <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                                <div className="flex-1 relative">
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-8 text-white placeholder:text-neutral-600 outline-none focus:border-brand transition-all"
                                    />
                                    <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-600 w-5 h-5" />
                                </div>
                                <button className="bg-brand text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-dark transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-brand/20">
                                    Subscribe Now
                                </button>
                            </form>
                            <p className="mt-8 text-neutral-500 text-[10px] uppercase font-bold tracking-widest opacity-50">
                                Join 5,000+ readers. No spam, just intelligence.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
