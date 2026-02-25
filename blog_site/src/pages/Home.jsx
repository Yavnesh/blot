import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import PostCard from '../components/PostCard'
import Footer from '../components/Footer'

const SITE_NAME = 'TEWS Intelligence'
const SITE_URL = 'https://yourblog.com'

function SkeletonCard() {
    return <div className="skeleton skeleton-card" />
}

export default function Home() {
    const { posts, loading, error } = usePosts()

    const featured = posts[0] || null
    const rest = posts.slice(1)

    return (
        <>
            <Helmet>
                <title>Tech Intelligence Blog — AI, Innovation & Industry Analysis | TEWS</title>
                <meta name="description" content="In-depth technology analysis, AI research, and industry intelligence — researched and written by an autonomous editorial engine." />
                <link rel="canonical" href={SITE_URL} />
                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={SITE_URL} />
                <meta property="og:title" content="TEWS — Tech Intelligence Blog" />
                <meta property="og:description" content="AI-powered tech analysis and industry intelligence." />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="TEWS — Tech Intelligence Blog" />
                {/* JSON-LD: WebSite schema */}
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": SITE_NAME,
                    "url": SITE_URL,
                    "description": "AI-powered technology intelligence blog",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": `${SITE_URL}/?s={search_term_string}`,
                        "query-input": "required name=search_term_string"
                    }
                })}</script>
            </Helmet>

            <main>
                {/* ── Hero ───────────────────────────────────────────────── */}
                <section className="hero">
                    <div className="container">
                        <div className="hero-eyebrow">AI Editorial Engine · Live</div>
                        <h1 className="hero-title">
                            Technology intelligence,<br />
                            <em>researched and ranked.</em>
                        </h1>
                        <p className="hero-desc">
                            Every article is researched from live sources, SEO-blueprinted against real SERP data,
                            and drafted by a multi-agent AI pipeline — then published here.
                        </p>
                        {!loading && (
                            <div className="hero-stats">
                                <div className="hero-stat">
                                    <div className="hero-stat-num">{posts.length}</div>
                                    <div className="hero-stat-label">Articles Published</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hero-stat-num">
                                        {posts.length > 0
                                            ? Math.round(posts.reduce((s, p) => s + (p.seo_score || 0), 0) / posts.length)
                                            : 0}%
                                    </div>
                                    <div className="hero-stat-label">Avg SEO Score</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hero-stat-num">
                                        {posts.reduce((s, p) => s + (p.word_count || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="hero-stat-label">Words of Intelligence</div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Featured ──────────────────────────────────────────── */}
                <section className="section">
                    <div className="container">
                        {loading ? (
                            <div className="loading-grid">
                                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">⚠️</div>
                                <h2 className="empty-state-title">Could not load articles</h2>
                                <p className="empty-state-desc">Make sure the backend is running at localhost:8080</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">✍️</div>
                                <h2 className="empty-state-title">No articles published yet</h2>
                                <p className="empty-state-desc">
                                    Go to the <a href="http://localhost:5173" style={{ color: 'var(--accent)' }}>CMS Admin</a> and publish your first post.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Featured Post */}
                                {featured && (
                                    <article className="featured-post" aria-label="Featured article">
                                        <div className="featured-post-visual">
                                            <div className="featured-post-visual-grid" />
                                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                                <rect width="80" height="80" rx="20" fill="rgba(255,255,255,0.1)" />
                                                <path d="M20 30h40M20 40h30M20 50h35" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="featured-post-body">
                                            <div className="featured-eyebrow">⚡ Featured Article</div>
                                            <h2 className="featured-title">{featured.title}</h2>
                                            <p className="featured-excerpt">{featured.excerpt}</p>
                                            <Link to={`/blog/${featured.slug}`} className="featured-cta">
                                                Read Full Analysis →
                                            </Link>
                                        </div>
                                    </article>
                                )}

                                {/* Rest of posts */}
                                {rest.length > 0 && (
                                    <>
                                        <div className="section-header">
                                            <div className="section-eyebrow">Latest Intelligence</div>
                                            <h2 className="section-title">All Articles</h2>
                                        </div>
                                        <div className="posts-grid">
                                            {rest.map(post => (
                                                <PostCard key={post.id} post={post} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer totalPosts={posts.length} />
        </>
    )
}
