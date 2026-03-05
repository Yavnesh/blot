import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePost } from '../hooks/usePosts'
import Footer from '../components/Footer'

const SITE_NAME = 'TEWS Intelligence'
const SITE_URL = 'http://localhost:5174'

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogPost() {
    const { slug } = useParams()
    const { post, loading, error } = usePost(slug)

    if (loading) return (
        <>
            <div style={{ padding: '6rem 2rem', maxWidth: '740px', margin: '0 auto' }}>
                <div className="skeleton" style={{ height: '2rem', marginBottom: '1rem', borderRadius: '8px' }} />
                <div className="skeleton" style={{ height: '3rem', marginBottom: '0.5rem', borderRadius: '8px' }} />
                <div className="skeleton" style={{ height: '3rem', marginBottom: '2rem', borderRadius: '8px', width: '70%' }} />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton" style={{ height: '1rem', marginBottom: '0.6rem', borderRadius: '4px', width: `${70 + Math.random() * 30}%` }} />
                ))}
            </div>
        </>
    )

    if (error || !post) return (
        <>
            <Helmet><title>Post Not Found | TEWS</title></Helmet>
            <div className="not-found">
                <div className="not-found-code">404</div>
                <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Article Not Found</h1>
                <p style={{ color: 'var(--ink-muted)', marginBottom: '2rem' }}>This article may have been moved or is not yet published.</p>
                <Link to="/" className="back-link">← Back to all articles</Link>
            </div>
            <Footer />
        </>
    )

    // Data is pre-cleaned by the usePost hook
    const displayTitle = post.title
    const displayMeta = post.meta_description
    const displaySlug = post.slug
    const canonicalUrl = `${SITE_URL}/blog/${displaySlug}`

    const scoreColor = post.seo_score >= 85 ? '#2563eb' : post.seo_score >= 70 ? '#f97316' : '#ef4444'

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": post.schema_type || "Article",
        "headline": displayTitle,
        "description": displayMeta,
        "url": canonicalUrl,
        "datePublished": post.created_at,
        "dateModified": post.created_at,
        "wordCount": post.word_count,
        "keywords": [post.focus_keyword, ...(post.hashtags || [])].filter(Boolean).join(', '),
        "publisher": { "@type": "Organization", "name": SITE_NAME, "url": SITE_URL },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
    }

    if (post.research_sources?.length > 0) {
        articleSchema.citation = post.research_sources.map(s => ({
            "@type": "CreativeWork",
            "name": s.title || s.url,
            "url": s.url
        }))
    }

    return (
        <>
            <Helmet>
                <title>{displayTitle} | {SITE_NAME}</title>
                <meta name="description" content={displayMeta} />
                {post.focus_keyword && <meta name="keywords" content={[post.focus_keyword, ...(post.hashtags || [])].join(', ')} />}
                <link rel="canonical" href={canonicalUrl} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={displayTitle} />
                <meta property="og:description" content={displayMeta} />
                <meta property="og:site_name" content={SITE_NAME} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={displayTitle} />
                <meta name="twitter:description" content={displayMeta} />

                {/* Article-specific meta */}
                <meta property="article:published_time" content={post.created_at} />
                {(post.hashtags || []).map((tag, i) => (
                    <meta key={i} property="article:tag" content={tag} />
                ))}

                {/* JSON-LD */}
                <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
            </Helmet>

            {/* ── Post Hero ──────────────────────────────────────────── */}
            <div className="container" style={{ marginTop: '2rem' }}>
                <Link to="/" className="back-link" style={{ fontSize: '0.8rem' }}>
                    ← All Articles
                </Link>
            </div>

            <div className="post-hero">
                <div className="container">
                    {post.image_url && (
                        <div className="post-hero-image-wrap">
                            <img
                                src={`http://localhost:8080/${post.image_url}`}
                                alt={displayTitle}
                                className="post-hero-image"
                            />
                        </div>
                    )}
                    <h1 className="post-title" style={{ marginBottom: '1.5rem' }}>{displayTitle}</h1>

                    <div className="post-meta-row" style={{ marginTop: '0' }}>
                        <span className="post-category-badge">
                            {post.schema_type || 'Article'}
                        </span>
                        <span className="post-date">{formatDate(post.created_at)}</span>
                        {post.seo_score > 0 && (
                            <span className="post-seo-badge">SEO {post.seo_score}%</span>
                        )}
                        {post.word_count > 0 && (
                            <span className="post-seo-badge">{post.word_count.toLocaleString()} words</span>
                        )}
                    </div>

                    {displayMeta && (
                        <p className="post-subtitle" style={{ marginTop: '2rem' }}>{displayMeta}</p>
                    )}
                </div>
            </div>

            {/* ── Post Body + Sidebar ────────────────────────────────── */}
            <div className="post-layout">
                {/* Main Article Content */}
                <article>
                    <div className="post-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content}
                        </ReactMarkdown>
                    </div>

                    {post.hashtags?.length > 0 && (
                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>Topics</p>
                            <div className="post-tags-row">
                                {post.hashtags.map((tag, i) => (
                                    <span key={i} className="post-tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </article>

                {/* Sidebar */}
                <aside className="post-sidebar">
                    {post.seo_score > 0 && (
                        <div className="sidebar-widget">
                            <div className="sidebar-widget-title">SEO Authority Score</div>
                            <div className="seo-score-ring">
                                <div className="seo-score-num" style={{ color: scoreColor }}>{post.seo_score}%</div>
                                <div className="seo-score-label">On-Page Score</div>
                            </div>
                            {post.coverage_score > 0 && (
                                <div className="coverage-bar">
                                    <div className="coverage-label">
                                        <span>SERP Coverage</span>
                                        <span style={{ color: 'var(--accent)' }}>{post.coverage_score}%</span>
                                    </div>
                                    <div className="coverage-bar-track">
                                        <div className="coverage-bar-fill" style={{ width: `${post.coverage_score}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {post.internal_link_suggestions?.length > 0 && (
                        <div className="sidebar-widget">
                            <div className="sidebar-widget-title">Related Topics</div>
                            {post.internal_link_suggestions.map((link, i) => (
                                <Link to="/" key={i} className="internal-link">{link}</Link>
                            ))}
                        </div>
                    )}

                    {post.research_sources?.length > 0 && (
                        <div className="sidebar-widget">
                            <div className="sidebar-widget-title">Research Sources</div>
                            {post.research_sources.slice(0, 8).map((source, i) => (
                                <a
                                    key={i}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="source-link"
                                >
                                    <span className="source-num">{i + 1}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {source.title && source.title !== 'Google News' ? source.title : new URL(source.url).hostname}
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            <Footer />
        </>
    )
}
