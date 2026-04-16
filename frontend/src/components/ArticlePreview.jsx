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

    // Better regex for metadata markers
    const titleMatch = rawContent.match(/\*{0,3}\s*Title:\s*\*{0,3}\s*([^\n]+)/i)
    const metaMatch = rawContent.match(/\*{0,3}\s*Meta Description:\s*\*{0,3}\s*([^\n]+)/i)

    let embeddedTitle = titleMatch ? titleMatch[1].trim() : null;
    let embeddedMeta = metaMatch ? metaMatch[1].trim() : null;

    // Fallback: If no "Title:" marker, use the first H1 (# Title)
    if (!embeddedTitle) {
        const h1Match = rawContent.match(/^#{1}\s+([^\n]+)/m);
        if (h1Match) embeddedTitle = h1Match[1].trim();
    }

    const displayTitle = (embeddedTitle || post.title?.[0] || 'Untitled Article').replace(/^#+\s*/, '');
    const displayMeta = embeddedMeta || post.seo_data?.meta_description || 'Expertly synthesized intelligence into actionable content.';

    // Clean the body for rendering
    let cleanContent = rawContent
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

    const telemetry = post.agent_telemetry || [];

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 animate-in fade-in duration-700">
            {/* Context Header */}
            <div className="px-12 py-8 flex flex-col md:flex-row items-center justify-between border-b border-white/5 gap-8 bg-slate-900/50 backdrop-blur-3xl sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-950 border border-white/10 text-slate-400 hover:text-teal-400 hover:border-teal-400/30 transition-all shadow-xl active:scale-95"
                    >
                        <span className="material-icons text-lg">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)] animate-pulse"></div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Authority Metadata</p>
                        </div>
                        <h2 className="text-lg font-black text-white tracking-tight uppercase truncate max-w-xl">{displayTitle}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Publication State</span>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            post.status === 'Published' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                            {post.status}
                        </div>
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || post.status === 'Published'}
                        className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center gap-3 ${post.status === 'Published'
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-default'
                            : 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-teal-500/20'
                            }`}
                    >
                        <span className="material-icons text-sm">{post.status === 'Published' ? 'check_circle' : 'bolt'}</span>
                        {post.status === 'Published' ? 'Synchronized' : 'Execute Publish'}
                    </button>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-12 py-20">
                {/* Visual Identity Block */}
                <section className="mb-24 flex flex-col md:flex-row gap-16 items-start">
                    <div className="md:w-3/5">
                        <div className="inline-flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-2 rounded-full mb-10">
                            <span className="text-teal-400 text-[10px] font-black uppercase tracking-[0.3em]">
                                {post.seo_data?.schema_type || 'Bionic Article'}
                            </span>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        
                        <h1 className="text-7xl font-black text-white leading-[0.95] tracking-tighter mb-10 uppercase">
                            {displayTitle}
                        </h1>
                        
                        <p className="text-2xl text-slate-400 leading-relaxed font-medium mb-12 border-l-4 border-teal-500/30 pl-8">
                            {displayMeta}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            {post.tags && (Array.isArray(post.tags) ? post.tags : [post.tags]).map(tag => (
                                <span key={tag} className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-4 py-2 rounded-xl hover:text-teal-400 hover:border-teal-400/30 transition-all cursor-crosshair">
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-2/5">
                        {post.image_crm?.[0] ? (
                            <div className="rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 relative group">
                                <img
                                    src={post.image_crm[0].startsWith('http') ? post.image_crm[0] : `http://localhost:8080/${post.image_crm[0]}`}
                                    alt={displayTitle}
                                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                            </div>
                        ) : (
                            <div className="aspect-square bg-slate-900 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 text-slate-700">
                                <span className="material-icons text-6xl">landscape</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Image Matrix Pending</span>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex flex-col lg:flex-row gap-24 border-t border-white/5 pt-24">
                    {/* Primary Intelligence Core */}
                    <article className="lg:w-2/3">
                        <div className="prose prose-invert prose-teal max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-5xl font-black text-white mt-20 mb-10 tracking-tighter uppercase" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-3xl font-black text-white mt-16 mb-8 tracking-tight border-b border-white/5 pb-6 uppercase" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-black text-teal-400 mt-12 mb-6 tracking-widest uppercase" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-slate-400 text-lg leading-[1.8] mb-10 font-medium tracking-wide" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-slate-400 text-lg leading-relaxed mb-6 list-none relative pl-8 before:content-[''] before:absolute before:left-0 before:top-3 before:w-2 before:h-2 before:bg-teal-500 before:rounded-full before:shadow-[0_0_10px_rgba(20,184,166,0.5)]" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <div className="bg-slate-900/50 border-l-4 border-indigo-500 p-12 my-14 rounded-3xl italic text-slate-200 text-xl font-bold tracking-tight shadow-2xl relative overflow-hidden" {...props}>
                                            <span className="material-icons absolute top-4 left-4 text-white/5 text-8xl pointer-events-none">format_quote</span>
                                            {props.children}
                                        </div>
                                    )
                                }}
                            >
                                {cleanContent}
                            </ReactMarkdown>
                        </div>
                    </article>

                    {/* Strategic Sidebar */}
                    <aside className="lg:w-1/3">
                        <div className="sticky top-32 space-y-12">
                            {/* Authority Matrix Widget */}
                            <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-white/5 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-10 relative">Authority Grade</h4>
                                <div className="flex items-end gap-4 mb-12 relative">
                                    <span className={`text-8xl font-black tracking-tighter leading-none ${post.seo_data?.score >= 85 ? 'text-white' : 'text-orange-500'}`}>
                                        {post.seo_data?.score || 0}%
                                    </span>
                                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">Verified Quality</span>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 flex justify-between items-center group/item hover:bg-slate-800 transition-all">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SERP Coverage</span>
                                        <span className="text-xs font-black text-teal-400">{post.seo_data?.coverage || post.seo_data?.coverage_score || 0}%</span>
                                    </div>
                                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 hover:bg-slate-800 transition-all">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Focus Keyword</span>
                                        <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{post.seo_data?.focus_keyword || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Command Center */}
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,1)] animate-pulse"></div>
                                    Autonomous Sub-Protocol status
                                </h4>
                                <div className="space-y-6">
                                    {telemetry.map((log, idx) => (
                                        <div key={idx} className="bg-slate-900/50 rounded-3xl p-8 border border-white/5 hover:border-teal-500/30 transition-all group overflow-hidden relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-950 border border-white/5 transition-colors group-hover:border-teal-500/50`}>
                                                        <span className="material-icons text-sm text-teal-400">memory</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[12px] font-black text-white uppercase tracking-tight">
                                                            {agentDisplayNames[log.agent_name] || log.agent_name}
                                                        </h5>
                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                            {log.model_used || 'GPT-4o / Gemini 1.5'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[18px] font-black text-white tracking-tighter">
                                                        {Math.round(log.confidence_score > 1 ? log.confidence_score : (log.confidence_score || 0) * 100)}%
                                                    </div>
                                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Confidence</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">
                                                    Latency: {((log.end_time - log.start_time) || 0).toFixed(1)}s
                                                </span>
                                                <button
                                                    onClick={() => handleRerun(log.agent_name)}
                                                    disabled={rerunningAgent === log.agent_name}
                                                    className="flex items-center gap-2 text-teal-400 hover:text-white font-black text-[9px] uppercase tracking-widest bg-teal-500/10 px-4 py-2 rounded-xl transition-all active:scale-90 disabled:opacity-20"
                                                >
                                                    {rerunningAgent === log.agent_name ? (
                                                        <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <span className="material-icons text-xs">replay</span>
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
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-12">
                    <div className="bg-slate-900 border border-white/10 rounded-[4rem] w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                            <div>
                                <h3 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">
                                    Protocol Rerun Analysis
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Agent ID: {rerunResult.agentKey}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDiff(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex divide-x divide-white/5">
                            <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar">
                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-10 pb-4 border-b border-white/5">Current State Vector</h4>
                                <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 text-slate-500 font-mono text-[11px] leading-relaxed italic opacity-40">
                                    {typeof rerunResult.original_data === 'object'
                                        ? <pre className="whitespace-pre-wrap">{JSON.stringify(rerunResult.original_data, null, 2)}</pre>
                                        : <ReactMarkdown>{rerunResult.original_data}</ReactMarkdown>
                                    }
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar bg-teal-500/[0.02]">
                                <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] mb-10 pb-4 border-b border-teal-500/20 flex items-center justify-between">
                                    Enhanced Logic Output
                                    <span className="bg-teal-500 text-slate-950 px-3 py-1 rounded-full text-[8px] animate-pulse font-black uppercase">Active Stream</span>
                                </h4>
                                <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-teal-500/20 text-slate-200 font-mono text-[11px] leading-relaxed shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                                    {typeof rerunResult.new_data === 'object'
                                        ? <pre className="whitespace-pre-wrap">{JSON.stringify(rerunResult.new_data, null, 2)}</pre>
                                        : <ReactMarkdown>{rerunResult.new_data.final_draft || rerunResult.new_data.content_with_seo || rerunResult.new_data.draft_content || rerunResult.new_data}</ReactMarkdown>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-white/5 bg-slate-950/50 flex justify-end gap-6">
                            <button
                                onClick={() => setShowDiff(false)}
                                className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all uppercase"
                            >
                                Discard Matrix
                            </button>
                            <button
                                onClick={confirmRerun}
                                className="px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 active:scale-95"
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
