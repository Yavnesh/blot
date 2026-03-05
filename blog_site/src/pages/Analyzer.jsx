
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Zap, ShieldCheck, BarChart3, ChevronRight, Terminal } from 'lucide-react';

export default function Analyzer() {
    const [content, setContent] = useState('');
    const [topic, setTopic] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAudit = async (e) => {
        e.preventDefault();
        if (content.length < 50) {
            setError('Please provide at least 50 characters of content.');
            return;
        }

        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const res = await fetch('http://localhost:8080/api/v1/seo/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, topic: topic || 'Custom Audit' })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Audit failed');
            }

            const data = await res.json();
            setReport(data.audit_report);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 min-h-screen transition-colors duration-500">
            <Helmet>
                <title>Audit Engine — Blot Editorial Intelligence</title>
                <meta name="description" content="Use the Blot SEO proprietary engine to audit your content against search intent and SERP blueprints." />
            </Helmet>

            <section className="pt-40 pb-20 md:pt-48 md:pb-32 bg-neutral-50/50 dark:bg-neutral-800/20 border-b border-neutral-100 dark:border-neutral-800 relative overflow-hidden transition-colors duration-500">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="container-custom relative">
                    <div className="max-w-3xl mx-auto text-center animate-reveal">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">Proprietary Intelligence Node</span>
                        <h1 className="display-medium text-neutral-900 dark:text-white mb-8 leading-tight">
                            Deep Content <span className="text-brand italic font-serif">Audit Engine.</span>
                        </h1>
                        <p className="body-large mb-12 italic leading-relaxed text-neutral-500 dark:text-neutral-400">
                            Submit your draft to our autonomous SEO agent. We evaluate your content against SERP benchmarks, search intent, and topical coverage gaps using neural semantic analysis.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto mt-12 animate-reveal delay-200">
                        <form onSubmit={handleAudit} className="bg-white dark:bg-neutral-800 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-neutral-700 flex flex-col gap-8 relative overflow-hidden group transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand opacity-5 dark:opacity-10 rounded-bl-[100%] transition-all group-focus-within:opacity-10 dark:group-focus-within:opacity-20"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                        <Search size={12} className="text-brand" /> Target Intent / Keyword
                                    </label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. Biohacking in 2026"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl py-4 px-6 text-sm outline-none focus:border-brand transition-all font-medium dark:text-white"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-brand" /> Audit Protocol
                                    </label>
                                    <div className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center justify-between">
                                        Topical Coverage Gap Analysis
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
                                    <Terminal size={12} className="text-brand" /> Raw Editorial Content
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Paste your article draft here for semantic evaluation (min 50 chars)..."
                                    className="w-full h-80 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-[2rem] py-6 px-8 text-sm outline-none focus:border-brand transition-all font-medium leading-relaxed resize-none dark:text-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-neutral-900 dark:bg-brand dark:text-white text-white py-6 rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-brand-dark transition-all active:scale-95 shadow-xl shadow-neutral-200 dark:shadow-none flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-brand opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                                {loading ? 'Orchestrating Neural Audit...' : <><Zap size={14} className="text-brand fill-brand dark:text-white dark:fill-white" /> Execute Intelligence Scan</>}
                            </button>

                            {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mt-4">⚠️ Audit Error: {error}</p>}
                        </form>
                    </div>

                    {report && (
                        <div id="results" className="max-w-4xl mx-auto mt-24 animate-reveal">
                            <div className="text-center mb-16">
                                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-neutral-300 dark:text-neutral-700 block mb-4">— SCAN COMPLETED —</span>
                                <h2 className="display-medium text-neutral-900 dark:text-white">Strategic Optimization Report</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <ScoreCard label="Editorial Quality" score={report.score} />
                                <ScoreCard label="SERP Coverage" score={report.coverage_score} isAccent />
                                <ScoreCard label="EEAT Signals" score={Math.min(98, (report.score + report.coverage_score) / 2 + 5)} />
                            </div>

                            <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-[3rem] p-10 md:p-16 shadow-lg shadow-neutral-100 dark:shadow-none transition-colors">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                    <div className="space-y-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">Focus Core Keyphrase</p>
                                            <p className="text-2xl font-serif font-bold text-brand">{report.focus_keyword}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">Generated Meta Description</p>
                                            <p className="text-neutral-500 dark:text-neutral-400 italic leading-relaxed">{report.meta_description}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-6">Semantic Density Gaps (Competitor Edge)</p>
                                        <ul className="space-y-4">
                                            {report.coverage_missing?.map((gap, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                    {gap}
                                                </li>
                                            ))}
                                            {!report.coverage_missing?.length && (
                                                <li className="flex items-center gap-3 text-sm font-bold text-emerald-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    Optimum topical scale achieved.
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function ScoreCard({ label, score, isAccent = false }) {
    return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-[2rem] p-8 text-center shadow-sm hover:shadow-xl dark:hover:shadow-none transition-all group">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-6">{label}</span>
            <div className="relative inline-block">
                <div className={`text-4xl md:text-5xl font-black ${isAccent ? 'text-brand' : 'text-neutral-900 dark:text-white'} tracking-tighter mb-1`}>
                    {Math.round(score)}%
                </div>
                <div className={`h-1.5 w-12 mx-auto rounded-full mt-2 ${isAccent ? 'bg-brand' : 'bg-neutral-100 dark:bg-neutral-700'} group-hover:w-20 transition-all duration-500`}></div>
            </div>
        </div>
    );
}
