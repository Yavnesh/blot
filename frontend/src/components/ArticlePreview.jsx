import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = 'http://localhost:8080/api/v1';

const ArticlePreview = ({ post, onBack, onUpdate }) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [rerunningAgent, setRerunningAgent] = useState(null);
    const [rerunResult, setRerunResult] = useState(null);
    const [showDiff, setShowDiff] = useState(false);

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
            const res = await fetch(`${API_BASE}/posts/${post.id}/publish`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                onUpdate(updated);
                alert('Article Published Successfully!');
            }
        } catch (err) {
            console.error('Publish failed', err);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRerun = async (agentKey) => {
        setRerunningAgent(agentKey);
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/rerun-agent?agent_key=${agentKey}`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setRerunResult({ agentKey, ...data });
                setShowDiff(true);
            }
        } catch (err) {
            console.error('Rerun failed', err);
        } finally {
            setRerunningAgent(null);
        }
    };

    const confirmRerun = async () => {
        if (!rerunResult) return;
        try {
            const res = await fetch(`${API_BASE}/posts/${post.id}/confirm-rerun?agent_key=${rerunResult.agentKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rerunResult.new_data)
            });
            if (res.ok) {
                const updated = await res.json();
                onUpdate(updated);
                setShowDiff(false);
                setRerunResult(null);
            }
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
        .replace(/^(This refined version|This refined draft|This version|This article|This draft|This content|The following draft).{0,100}(voice|tone|audience|flow|narrative|SEO|keyword|expert|deep-dive|brand).{0,60}\.\n?/gim, '')
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
        <div className="fixed inset-0 bg-[#f8f9fc] z-[60] overflow-y-auto font-sans text-slate-900">
            {/* Sticky Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-[70] px-8 py-4">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-indigo-600"
                        >
                            <span className="material-icons">arrow_back</span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-200"></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Article Preview</p>
                            <h2 className="text-sm font-bold text-slate-900 truncate max-w-[400px]">{displayTitle}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">
                            Status: <span className={post.status === 'Published' ? 'text-emerald-500' : 'text-amber-500'}>{post.status}</span>
                        </span>
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || post.status === 'Published'}
                            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center gap-2 ${post.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            <span className="material-icons text-sm">{post.status === 'Published' ? 'check_circle' : 'publish'}</span>
                            {post.status === 'Published' ? 'Published' : 'Publish to Blog'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-8 py-12">
                {/* Hero Section */}
                <section className="mb-20">
                    <div className="max-w-4xl">
                        {post.image_crm?.[0] && (
                            <div className="mb-10 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200">
                                <img
                                    src={`http://localhost:8080/${post.image_crm[0]}`}
                                    alt={displayTitle}
                                    className="w-full h-auto object-cover max-h-[500px]"
                                />
                            </div>
                        )}
                        <h1 className="text-6xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8">
                            {displayTitle}
                        </h1>
                        <div className="flex items-center gap-3 mb-12">
                            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {post.seo_data?.schema_type || 'Article'}
                            </span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            {post.seo_data?.score > 0 && (
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                                    SEO {post.seo_data.score}%
                                </span>
                            )}
                        </div>
                        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-medium">
                            {displayMeta}
                        </p>
                    </div>
                </section>

                <div className="flex flex-col lg:flex-row gap-20">
                    {/* Left Column: Content */}
                    <article className="lg:w-2/3">
                        <div className="prose prose-slate prose-indigo max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-4xl font-black text-slate-900 mt-16 mb-8 tracking-tight" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-3xl font-black text-slate-900 mt-12 mb-6 tracking-tight border-b border-slate-100 pb-4" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-slate-600 text-lg leading-[1.8] mb-8 font-medium" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-slate-600 text-lg leading-relaxed mb-4 list-disc marker:text-indigo-500" {...props} />,
                                    blockquote: ({ node, ...props }) => (
                                        <div className="bg-slate-50 border-l-4 border-indigo-500 p-8 my-10 rounded-r-3xl italic text-slate-700 text-xl font-medium" {...props} />
                                    )
                                }}
                            >
                                {cleanContent}
                            </ReactMarkdown>
                        </div>
                    </article>

                    {/* Right Column: Sticky Sidebar */}
                    <aside className="lg:w-1/3">
                        <div className="sticky top-32 space-y-12">
                            {/* Authority Score Widget */}
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative">Authority Grade</h4>
                                <div className="flex items-end gap-3 mb-10 relative">
                                    <span className={`text-7xl font-black tracking-tighter ${post.seo_data?.score >= 85 ? 'text-indigo-600' : 'text-amber-500'}`}>
                                        {post.seo_data?.score || 0}%
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verified Quality</span>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center group/item hover:bg-white hover:shadow-lg transition-all">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SERP Coverage</span>
                                        <span className="text-xs font-black text-indigo-600">{post.seo_data?.coverage || post.seo_data?.coverage_score || 0}%</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group/item hover:bg-white hover:shadow-lg transition-all">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Focus Keyword</span>
                                        <span className="text-xs font-black text-slate-700">{post.seo_data?.focus_keyword || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Agent Transparency Cards */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Autonomous Agents
                                </h4>
                                <div className="space-y-4">
                                    {telemetry.map((log, idx) => (
                                        <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${log.status === 'success' || log.status === 'completed' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        <span className="material-icons text-sm">precision_manufacturing</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                                                            {agentDisplayNames[log.agent_name] || log.agent_name}
                                                        </h5>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {log.model_used || 'Gemini 1.5 Pro'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[14px] font-black text-indigo-600 tracking-tighter">
                                                        {Math.round((log.confidence_score || 0) * 100)}%
                                                    </div>
                                                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Confidence</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                    Lat: {((log.end_time - log.start_time) || 0).toFixed(1)}s
                                                </span>
                                                <button
                                                    onClick={() => handleRerun(log.agent_name)}
                                                    disabled={rerunningAgent === log.agent_name}
                                                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-black text-[9px] uppercase tracking-widest bg-indigo-50/50 px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:bg-slate-50 disabled:text-slate-300"
                                                >
                                                    {rerunningAgent === log.agent_name ? (
                                                        <div className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <span className="material-icons text-[10px]">refresh</span>
                                                    )}
                                                    Rerun Layer
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

            {/* Diff/Comparison Overview */}
            {showDiff && rerunResult && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                    <div className="bg-white rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                                    Autonomous Rerun: {agentDisplayNames[rerunResult.agentKey]}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest uppercase">Inspect improvements and verify changes before persistence</p>
                            </div>
                            <button
                                onClick={() => setShowDiff(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 flex gap-16">
                            <div className="flex-1 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Current Immutable State</h4>
                                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 text-slate-400 line-clamp-[20]">
                                    {typeof rerunResult.original_data === 'object'
                                        ? <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(rerunResult.original_data, null, 2)}</pre>
                                        : <div className="prose prose-sm opacity-50"><ReactMarkdown>{rerunResult.original_data}</ReactMarkdown></div>
                                    }
                                </div>
                            </div>
                            <div className="w-[1px] bg-slate-100"></div>
                            <div className="flex-1 space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-4 flex items-center justify-between">
                                    Synthesized Improvements
                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] animate-pulse">New Data Generated</span>
                                </h4>
                                <div className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100 text-slate-700 ring-4 ring-indigo-50/50">
                                    {typeof rerunResult.new_data === 'object'
                                        ? <pre className="text-[10px] whitespace-pre-wrap text-indigo-900">{JSON.stringify(rerunResult.new_data, null, 2)}</pre>
                                        : <div className="prose prose-sm"><ReactMarkdown>{rerunResult.new_data.final_draft || rerunResult.new_data.content_with_seo}</ReactMarkdown></div>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4">
                            <button
                                onClick={() => setShowDiff(false)}
                                className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                Ignore & Skip
                            </button>
                            <button
                                onClick={confirmRerun}
                                className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-icons text-sm">verified</span>
                                Commit & Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticlePreview;
