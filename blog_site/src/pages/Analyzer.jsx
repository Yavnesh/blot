import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Footer from '../components/Footer'

export default function Analyzer() {
    const [content, setContent] = useState('')
    const [topic, setTopic] = useState('')
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleAudit = async (e) => {
        e.preventDefault()
        if (content.length < 50) {
            setError('Please provide at least 50 characters of content.')
            return
        }

        setLoading(true)
        setError(null)
        setReport(null)

        try {
            const res = await fetch('http://localhost:8080/api/v1/seo/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, topic: topic || 'Custom Audit' })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.detail || 'Audit failed')
            }

            const data = await res.json()
            setReport(data.audit_report)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Helmet>
                <title>Professional SEO Content Analyzer — TEWS SaaS</title>
                <meta name="description" content="Use the TEWS SEO proprietary engine to audit your content against search intent and SERP blueprints." />
            </Helmet>

            <main className="container" style={{ padding: '6rem 2rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="hero-eyebrow">Product Pipeline B: SEO SaaS</div>
                    <h1 className="hero-title" style={{ fontSize: '3rem' }}>Deep Content <em>Audit Engine</em></h1>
                    <p className="hero-desc">
                        Submit your draft to our autonomous SEO agent. We evaluate your content against
                        SERP benchmarks, search intent, and topical coverage gaps.
                    </p>

                    <form onSubmit={handleAudit} className="sidebar-widget" style={{ background: '#fff', padding: '2.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
                                Target Topic / Keyword
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Future of Generative AI"
                                style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
                                Content to Analyze
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste your article here (min 50 chars)..."
                                style={{ width: '100%', height: '300px', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="featured-cta"
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                        >
                            {loading ? 'Analyzing Content Strategy...' : 'Run Deep SEO Audit ⚡'}
                        </button>

                        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem', fontWeight: 600 }}>⚠️ {error}</p>}
                    </form>

                    {report && (
                        <div id="results" style={{ marginTop: '4rem', animation: 'fadeIn 0.5s ease' }}>
                            <div className="section-header">
                                <div className="section-eyebrow">Audit Results</div>
                                <h2 className="section-title">Strategic Optimization Report</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="sidebar-widget">
                                    <div className="sidebar-widget-title">Content Quality Score</div>
                                    <div className="seo-score-ring">
                                        <div className="seo-score-num">{report.score}%</div>
                                        <div className="seo-score-label">Optimization Grade</div>
                                    </div>
                                </div>
                                <div className="sidebar-widget">
                                    <div className="sidebar-widget-title">SERP Coverage Check</div>
                                    <div className="seo-score-ring">
                                        <div className="seo-score-num" style={{ color: 'var(--accent)' }}>{report.coverage_score}%</div>
                                        <div className="seo-score-label">Competitor Gap Analysis</div>
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar-widget" style={{ background: '#fff' }}>
                                <div className="sidebar-widget-title">On-Page Signals</div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Recommended Focus Keyword</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{report.focus_keyword}</p>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Meta Description Recommendation</p>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)' }}>{report.meta_description}</p>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Missing Search Gaps</p>
                                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                        {report.coverage_missing?.map((gap, i) => (
                                            <li key={i} style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{gap}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    )
}
