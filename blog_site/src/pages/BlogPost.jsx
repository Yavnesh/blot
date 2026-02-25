import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePost } from '../hooks/usePosts'
import Footer from '../components/Footer'

const SITE_NAME = 'TEWS Intelligence'
const SITE_URL = 'https://yourblog.com'

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Render raw markdown-ish content as HTML string safely
// We just do basic line-break parsing; full markdown via a lib would be better for production
function renderContent(content) {
    if (!content) return ''
    return content
        .replace(/^#{1} (.+)$/gm, '<h1>$1</h1>')
        .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
        .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
        .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<)(.+)$/gm, '$1')
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

    const canonicalUrl = `${SITE_URL}/blog/${post.slug}`
    const scoreColor = post.seo_score >= 85 ? '#2563eb' : post.seo_score >= 70 ? '#f97316' : '#ef4444'

    // JSON-LD Article schema — the most important on-page ranking signal
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": post.schema_type || "Article",
        "headline": post.title,
        "description": post.meta_description || post.excerpt,
        "url": canonicalUrl,
        "datePublished": post.created_at,
        "dateModified": post.created_at,
        "wordCount": post.word_count,
        "keywords": [post.focus_keyword, ...(post.hashtags || [])].filter(Boolean).join(', '),
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL
        },
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
                <title>{post.title} | {SITE_NAME}</title>
                <meta name="description" content={post.meta_description || post.excerpt} />
                {post.focus_keyword && <meta name="keywords" content={[post.focus_keyword, ...(post.hashtags || [])].join(', ')} />}
                <link rel="canonical" href={canonicalUrl} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.meta_description || post.excerpt} />
                <meta property="og:site_name" content={SITE_NAME} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.meta_description || post.excerpt} />

                {/* Article-specific meta */}
                <meta property="article:published_time" content={post.created_at} />
                {(post.hashtags || []).map((tag, i) => (
                    <meta key={i} property="article:tag" content={tag} />
                ))}

                {/* JSON-LD */}
                <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
            </Helmet>

            {/* ── Post Hero ──────────────────────────────────────────── */}
            <div className="post-hero">
                <div className="container">
                    <div className="post-meta-row">
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

                    <h1 className="post-title">{post.title}</h1>

                    {post.meta_description && (
                        <p className="post-subtitle">{post.meta_description}</p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {post.focus_keyword && (
                            <span className="post-keyword-pill">
                                🔑 {post.focus_keyword}
                            </span>
                        )}
                        {post.hashtags?.length > 0 && (
                            <div className="post-tags-row">
                                {post.hashtags.map((tag, i) => (
                                    <span key={i} className="post-tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Post Body + Sidebar ────────────────────────────────── */}
            <div className="post-layout">
                {/* Main Article Content */}
                <article>
                    <Link to="/" className="back-link" style={{ display: 'inline-flex', marginBottom: '2rem', fontSize: '0.8rem' }}>
                        ← All Articles
                    </Link>

                    <div
                        className="post-content"
                        dangerouslySetInnerHTML={{ __html: '<p>' + renderContent(post.content) + '</p>' }}
                    />

                    {/* Hashtag Footer */}
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
                    {/* SEO Score Widget */}
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

                    {/* Internal Links */}
                    {post.internal_link_suggestions?.length > 0 && (
                        <div className="sidebar-widget">
                            <div className="sidebar-widget-title">Related Topics</div>
                            {post.internal_link_suggestions.map((link, i) => (
                                <Link to="/" key={i} className="internal-link">{link}</Link>
                            ))}
                        </div>
                    )}

                    {/* Research Sources */}
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
                                        {source.title || source.url}
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
