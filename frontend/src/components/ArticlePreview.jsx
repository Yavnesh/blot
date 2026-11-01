import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = 'http://localhost:8080/api/v1';

const ArticlePreview = ({ post, onBack, onUpdate }) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [rerunningAgent, setRerunningAgent] = useState(null);
    const [rerunResult, setRerunResult] = useState(null);
    const [showDiff, setShowDiff] = useState(false);
    const [agentMeta, setAgentMeta] = useState({});

    // Agent mapping for display
    const agentDisplayNames = {
        'trend': 'Discovery Node',
        'aggregator': 'Research Crawler',
        'credibility': 'Fact Verifier',
        'keyword_cluster': 'Semantic Architect',
        'intent': 'Strategic Intent',
        'draft': 'Content Synthesis',
        'voice': 'Brand Alignment',
        'image': 'Visual Assets',
        'seo': 'SEO Compliance',
        'readability': 'Flow & Clarity',
        'originality': 'AI Stealth Pass',
        'legal': 'Policy Governance',
        'evaluator': 'E-E-A-T Quality'
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const res = await api.post(`/posts/${post.id}/publish`);
            onUpdate(res.data);
            alert('Article Published Successfully!');
        } catch (err) {
            console.error('Publish failed', err);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRerun = async (agentKey) => {
        setRerunningAgent(agentKey);
        const meta = agentMeta[agentKey] || {};
        try {
            const res = await api.post(`/posts/${post.id}/rerun-agent`, meta, {
                params: { agent_key: agentKey }
            });
            setRerunResult({ agentKey, ...res.data });
            setShowDiff(true);
        } catch (err) {
            console.error('Rerun failed', err);
        } finally {
            setRerunningAgent(null);
        }
    };

    const confirmRerun = async () => {
        if (!rerunResult) return;
        try {
            const res = await api.post(`/posts/${post.id}/confirm-rerun`, rerunResult.new_data, {
                params: { agent_key: rerunResult.agentKey }
            });
            onUpdate(res.data);
            setShowDiff(false);
            setRerunResult(null);
        } catch (err) {
            console.error('Confirm rerun failed', err);
        }
    };

    // Clean content parsing for premium preview experience
    const rawContent = post.content?.[0] || post.content || '';

    const isInstagram = post.pub_platform === 'instagram';
    let instagramData = null;
    if (isInstagram && rawContent) {
        try {
            instagramData = JSON.parse(rawContent);
        } catch (e) {
            console.error("Failed to parse Instagram content JSON", e);
        }
    }

    // Better regex for metadata markers
    const titleMatch = !isInstagram ? rawContent.match(/\*{0,3}\s*Title:\s*\*{0,3}\s*([^\n]+)/i) : null;
    const metaMatch = !isInstagram ? rawContent.match(/\*{0,3}\s*Meta Description:\s*\*{0,3}\s*([^\n]+)/i) : null;

    let embeddedTitle = titleMatch ? titleMatch[1].trim() : null;
    let embeddedMeta = metaMatch ? metaMatch[1].trim() : null;

    // Fallback: If no "Title:" marker, use the first H1 (# Title)
    if (!embeddedTitle && !isInstagram) {
        const h1Match = rawContent.match(/^#{1}\s+([^\n]+)/m);
        if (h1Match) embeddedTitle = h1Match[1].trim();
    }

    const displayTitle = (isInstagram ? (post.title?.[0] || 'Instagram Post') : (embeddedTitle || post.title?.[0] || 'Untitled Article')).replace(/^#+\s*/, '');
    const displayMeta = isInstagram ? 'Synthesized multi-slide Instagram carousel campaign.' : (embeddedMeta || post.seo_data?.meta_description || 'Expertly synthesized intelligence into actionable content.');

    // Clean the body for rendering
    let cleanContent = '';
    if (!isInstagram) {
        cleanContent = rawContent
            .replace(/\*{0,3}\s*Title:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
            .replace(/\*{0,3}\s*Meta Description:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
            .replace(/\*{0,3}\s*URL Slug:\s*\*{0,3}\s*[^\n]+\n?/gi, '')
            .replace(/^---+\s*\n?/gm, '')
            .replace(/^\*+\s*\n?/gm, '')
            .replace(/^#+\s*H\d:\s*/gim, '# ')
            // Strip common AI preamble sentences
            .replace(/^(This refined version|This refined draft|This version|This article|This draft|This content|The following draft|Here is the|I have updated|I have refined).{0,120}(voice|tone|audience|flow|narrative|SEO|keyword|expert|deep-dive|brand|draft|article|style|instruction).{0,60}[:.]\s*\n?/gim, '')
            .replace(/^\s+/, '');

        // Handle redundant titles at the top
        if (embeddedTitle) {
            const titleEscaped = embeddedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            // Strip H1, H2, or Bold title if it's the first thing in the content
            const redundantTitleRegex = new RegExp(`^(#+\\s*|\\*{1,3}\\s*)${titleEscaped}(\\s*\\*{1,3})?\\s*\\n?`, 'i')
            cleanContent = cleanContent.replace(redundantTitleRegex, '').trim()
        }

        cleanContent = cleanContent.replace(/^(\*+\s*)+/, '').trim();
    }

    const telemetry = post.agent_telemetry || [];

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 animate-in fade-in duration-700">
            {/* Context Header */}
            <div className="px-4 md:px-8 lg:px-12 py-4 md:py-6 lg:py-8 flex flex-col md:flex-row items-center justify-between border-b border-white/5 gap-4 md:gap-8 bg-slate-900/50 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-950 border border-white/10 text-slate-400 hover:text-teal-400 hover:border-teal-400/30 transition-all shadow-xl active:scale-95 shrink-0"
                    >
                        <span className="material-icons text-base md:text-lg">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)] animate-pulse shrink-0"></div>
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500">Authority Metadata</p>
                        </div>
                        <h2 className="text-sm md:text-lg font-black text-white tracking-tight uppercase truncate max-w-xs md:max-w-xl">{displayTitle}</h2>
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Publication State</span>
                        <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${
                            post.status === 'Published' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                            {post.status}
                        </div>
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || post.status === 'Published'}
                        className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 ${post.status === 'Published'
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-default'
                            : 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-teal-500/20'
                            }`}
                    >
                        <span className="material-icons text-xs md:text-sm">{post.status === 'Published' ? 'check_circle' : 'bolt'}</span>
                        {post.status === 'Published' ? 'Synchronized' : 'Execute Publish'}
                    </button>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16 lg:py-20">
                {/* Visual Identity Block */}
                <section className="mb-16 md:mb-24 flex flex-col lg:flex-row gap-10 md:gap-16 items-start">
                    <div className="w-full lg:w-3/5">
                        <div className="inline-flex items-center gap-3 md:gap-4 bg-white/5 border border-white/5 px-4 py-1.5 md:px-6 md:py-2 rounded-full mb-6 md:mb-10">
                            <span className="text-teal-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                {isInstagram ? 'Instagram Carousel' : (post.seo_data?.schema_type || 'Bionic Article')}
                            </span>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <span className="text-slate-500 text-[7px] md:text-[9px] font-black uppercase tracking-widest">
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        
                        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] lg:leading-[0.95] tracking-tighter mb-6 md:mb-10 uppercase">
                            {displayTitle}
                        </h1>
                        
                        <p className="text-lg md:text-2xl text-slate-400 leading-relaxed font-medium mb-8 md:mb-12 border-l-4 border-teal-500/30 pl-6 md:pl-8 italic">
                            {displayMeta}
                        </p>

                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {post.tags && (Array.isArray(post.tags) ? post.tags : [post.tags]).map(tag => (
                                <span key={tag} className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl hover:text-teal-400 hover:border-teal-400/30 transition-all cursor-crosshair"
                                    onClick={() => {
                                        const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                                        navigator.clipboard.writeText(cleanTag);
                                        alert(`Copied ${cleanTag}`);
                                    }}
                                >
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-2/5">
                        {post.image_crm?.[0] ? (
                            <div className="rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 relative group">
                                <img
                                    src={post.image_crm[0].startsWith('http') ? post.image_crm[0] : `http://localhost:8080/${post.image_crm[0]}`}
                                    alt={displayTitle}
                                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                            </div>
                        ) : isInstagram ? (
                            <div className="aspect-video lg:aspect-square bg-slate-900 rounded-2xl md:rounded-[3rem] border border-white/5 flex flex-col items-center justify-center gap-4 md:gap-6 text-teal-400/50">
                                <span className="material-icons text-5xl md:text-7xl">photo_library</span>
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Instagram Slide Assets</span>
                            </div>
                        ) : (
                            <div className="aspect-video lg:aspect-square bg-slate-900 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 md:gap-6 text-slate-700">
                                <span className="material-icons text-4xl md:text-6xl">landscape</span>
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Image Matrix Pending</span>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex flex-col lg:flex-row gap-12 md:gap-24 border-t border-white/5 pt-16 md:pt-24">
                    {/* Primary Intelligence Core */}
                    <article className="w-full lg:w-2/3">
                        {isInstagram && instagramData ? (
                            <div className="space-y-12">
                                {/* Carousel slides */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Carousel Slide Deck</h3>
                                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
                                            {instagramData.slides?.length || 0} Slides
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {instagramData.slides?.map((slide, index) => {
                                            const bgUrl = slide.image_url || `https://picsum.photos/seed/${slide.headline?.replace(/[^a-zA-Z0-9]/g, '') || index}/800/800`;
                                            return (
                                                <div 
                                                    key={index} 
                                                    className="border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-[360px] relative overflow-hidden shadow-2xl hover:border-teal-400/30 transition-all duration-300 group"
                                                    style={{
                                                        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.95)), url(${bgUrl})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        backgroundColor: '#0f172a'
                                                    }}
                                                >
                                                    <div className="absolute top-2 right-2 text-slate-800 font-black text-8xl z-0 select-none opacity-20 group-hover:scale-110 transition-transform duration-500">
                                                        {slide.slide_number || index + 1}
                                                    </div>

                                                    <div className="relative z-10 flex flex-col gap-4">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded w-fit">
                                                            Slide {slide.slide_number || index + 1}
                                                        </span>
                                                        <h5 className="text-white font-black text-2xl tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                                            {slide.headline}
                                                        </h5>
                                                        <p className="text-white text-sm font-black leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                                                            {slide.body}
                                                        </p>
                                                    </div>

                                                    <div className="relative z-10 pt-4 border-t border-white/5 flex flex-col gap-2">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                                            Visual AI Prompt
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(slide.image_prompt);
                                                                    alert('Prompt copied!');
                                                                }}
                                                                className="text-teal-400 hover:text-white transition-colors"
                                                            >
                                                                <span className="material-icons text-xs">content_copy</span>
                                                            </button>
                                                        </span>
                                                        <p className="text-[9px] font-mono text-slate-400 italic line-clamp-2">
                                                            {slide.image_prompt}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Caption Details */}
                                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            Synthesized Caption
                                        </h3>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(instagramData.caption);
                                                alert('Caption copied!');
                                            }}
                                            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-4 py-2 rounded-xl transition-all border border-teal-500/20"
                                        >
                                            <span className="material-icons text-xs">content_copy</span>
                                            Copy Caption
                                        </button>
                                    </div>

                                    <p className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                        {instagramData.caption}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                        {instagramData.hashtags?.map((tag) => (
                                            <span 
                                                key={tag} 
                                                className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-white/5 px-2.5 py-1.5 rounded-lg hover:text-teal-400 hover:border-teal-400/30 transition-all cursor-pointer"
                                                onClick={() => {
                                                    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
                                                    navigator.clipboard.writeText(cleanTag);
                                                    alert(`Copied ${cleanTag}`);
                                                }}
                                            >
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-teal max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl md:text-5xl font-black text-white mt-12 md:mt-20 mb-6 md:mb-10 tracking-tighter uppercase" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-black text-white mt-10 md:mt-16 mb-4 md:mb-8 tracking-tight border-b border-white/5 pb-4 md:pb-6 uppercase" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-lg md:text-xl font-black text-teal-400 mt-8 md:mt-12 mb-4 md:mb-6 tracking-widest uppercase" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-slate-400 text-base md:text-lg leading-[1.8] mb-6 md:mb-10 font-medium tracking-wide" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-slate-400 text-base md:text-lg leading-relaxed mb-4 md:mb-6 list-none relative pl-8 before:content-[''] before:absolute before:left-0 before:top-2.5 md:before:top-3 before:w-2 before:h-2 before:bg-teal-500 before:rounded-full before:shadow-[0_0_10px_rgba(20,184,166,0.5)]" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <div className="bg-slate-900/50 border-l-4 border-indigo-500 p-8 md:p-12 my-10 md:my-14 rounded-2xl md:rounded-3xl italic text-slate-200 text-lg md:text-xl font-bold tracking-tight shadow-2xl relative overflow-hidden" {...props}>
                                                <span className="material-icons absolute top-4 left-4 text-white/5 text-6xl md:text-8xl pointer-events-none">format_quote</span>
                                                <div className="relative z-10">{props.children}</div>
                                            </div>
                                        )
                                    }}
                                >
                                    {cleanContent}
                                </ReactMarkdown>
                            </div>
                        )}
                    </article>

                    {/* Strategic Sidebar */}
                    <aside className="w-full lg:w-1/3">
                        <div className="sticky top-32 space-y-8 md:space-y-12">
                            {/* Authority Matrix Widget */}
                            <div className="bg-slate-900 rounded-2xl md:rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/5 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-8 md:mb-10 relative">Authority Grade</h4>
                                <div className="flex items-end gap-3 md:gap-4 mb-8 md:mb-12 relative">
                                    <span className={`text-6xl md:text-8xl font-black tracking-tighter leading-none ${post.seo_data?.score >= 85 ? 'text-white' : 'text-orange-500'}`}>
                                        {post.seo_data?.score || 0}%
                                    </span>
                                    <span className="text-[8px] md:text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 md:mb-4">Verified Quality</span>
                                </div>

                                {isInstagram ? (
                                    <div className="space-y-3 md:space-y-4 relative">
                                        <div className="bg-slate-950 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 flex justify-between items-center group/item hover:bg-slate-800 transition-all">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Tone Profile</span>
                                            <span className="text-xs font-black text-teal-400 capitalize">{post.seo_data?.tone || 'Educational'}</span>
                                        </div>
                                        <div className="bg-slate-950 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 hover:bg-slate-800 transition-all">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Target Audience</span>
                                            <span className="text-xs font-black text-slate-200 uppercase tracking-widest truncate block capitalize">{post.seo_data?.audience || 'Developers'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 md:space-y-4 relative">
                                        <div className="bg-slate-950 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 flex justify-between items-center group/item hover:bg-slate-800 transition-all">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">SERP Coverage</span>
                                            <span className="text-xs font-black text-teal-400">{post.seo_data?.coverage || post.seo_data?.coverage_score || 0}%</span>
                                        </div>
                                        <div className="bg-slate-950 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 hover:bg-slate-800 transition-all">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1 md:mb-2">Focus Keyword</span>
                                            <span className="text-xs font-black text-slate-200 uppercase tracking-widest truncate block">{post.seo_data?.focus_keyword || 'N/A'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Agent Command Center */}
                            <div>
                                <h4 className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.3em] md:tracking-[0.4em] mb-8 md:mb-10 flex items-center gap-3 md:gap-4">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,1)] animate-pulse"></div>
                                    Autonomous Sub-Protocol status
                                </h4>
                                <div className="space-y-4 md:space-y-6">
                                    {telemetry.map((log, idx) => (
                                        <div key={idx} className="bg-slate-900/50 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/5 hover:border-teal-500/30 transition-all group overflow-hidden relative">
                                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center bg-slate-950 border border-white/5 transition-colors group-hover:border-teal-500/50`}>
                                                        <span className="material-icons text-xs md:text-sm text-teal-400">memory</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-tight">
                                                            {agentDisplayNames[log.agent_name] || log.agent_name}
                                                        </h5>
                                                        <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                            {log.model_used || 'GPT-4o / Gemini 1.5'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base md:text-lg font-black text-white tracking-tighter">
                                                        {Math.round(log.confidence_score > 1 ? log.confidence_score : (log.confidence_score || 0) * 100)}%
                                                    </div>
                                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Confidence</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-white/5">
                                                <span className="text-[7px] md:text-[8px] font-black text-slate-700 uppercase tracking-widest italic">
                                                    Latency: {((log.end_time - log.start_time) || 0).toFixed(1)}s
                                                </span>
                                                <button
                                                    onClick={() => handleRerun(log.agent_name)}
                                                    disabled={rerunningAgent === log.agent_name}
                                                    className="flex items-center gap-2 text-teal-400 hover:text-white font-black text-[8px] md:text-[9px] uppercase tracking-widest bg-teal-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl transition-all active:scale-90 disabled:opacity-20"
                                                >
                                                    {rerunningAgent === log.agent_name ? (
                                                        <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <span className="material-icons text-[10px] md:text-xs">replay</span>
                                                    )}
                                                    Re-Sync
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Diff Matrix Overlay */}
            {showDiff && rerunResult && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-8 lg:p-12">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl md:rounded-[4rem] w-full max-w-7xl h-[90vh] md:h-[85vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
                        <div className="p-6 md:p-10 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/50 shrink-0">
                            <div>
                                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter mb-1 md:mb-2 uppercase">
                                    Protocol Rerun Analysis
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping shrink-0"></span>
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">Agent ID: {rerunResult.agentKey}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDiff(false)}
                                className="absolute top-6 right-6 md:static w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
                            >
                                <span className="material-icons text-base md:text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5 min-h-0">
                            <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar">
                                <h4 className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 md:mb-10 pb-3 md:pb-4 border-b border-white/5">Current State Vector</h4>
                                <div className="bg-slate-950 p-6 md:p-10 rounded-xl md:rounded-[2.5rem] border border-white/5 text-slate-500 font-mono text-[10px] md:text-[11px] leading-relaxed italic opacity-40">
                                    {typeof rerunResult.original_data === 'object'
                                        ? <pre className="whitespace-pre-wrap">{JSON.stringify(rerunResult.original_data, null, 2)}</pre>
                                        : <ReactMarkdown>{rerunResult.original_data}</ReactMarkdown>
                                    }
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto custom-scrollbar bg-teal-500/[0.02]">
                                <h4 className="text-[8px] md:text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] mb-6 md:mb-10 pb-3 md:pb-4 border-b border-teal-500/20 flex items-center justify-between">
                                    Enhanced Logic Output
                                    <span className="bg-teal-500 text-slate-950 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[7px] md:text-[8px] animate-pulse font-black uppercase">Active Stream</span>
                                </h4>
                                <div className="bg-slate-950 p-6 md:p-10 rounded-xl md:rounded-[2.5rem] border border-teal-500/20 text-slate-200 font-mono text-[10px] md:text-[11px] leading-relaxed shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                                    {typeof rerunResult.new_data === 'object'
                                        ? <pre className="whitespace-pre-wrap">{JSON.stringify(rerunResult.new_data, null, 2)}</pre>
                                        : <ReactMarkdown>{rerunResult.new_data.final_draft || rerunResult.new_data.content_with_seo || rerunResult.new_data.draft_content || rerunResult.new_data}</ReactMarkdown>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-10 border-t border-white/5 bg-slate-950/50 flex flex-col sm:flex-row justify-end gap-4 md:gap-6 shrink-0">
                            <button
                                onClick={() => setShowDiff(false)}
                                className="order-2 sm:order-1 px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-600 hover:text-white transition-all"
                            >
                                Discard Matrix
                            </button>
                            <button
                                onClick={confirmRerun}
                                className="order-1 sm:order-2 px-10 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 active:scale-95"
                            >
                                Commit Evolution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticlePreview;
