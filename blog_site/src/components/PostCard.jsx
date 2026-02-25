import { Link } from 'react-router-dom'

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PostCard({ post }) {
    return (
        <article className="post-card">
            <div className="post-card-thumb">
                <div className="post-card-thumb-pattern" />
                {post.focus_keyword && (
                    <span className="post-card-keyword">🔑 {post.focus_keyword}</span>
                )}
                {post.seo_score > 0 && (
                    <span className="post-card-seo-score">SEO {post.seo_score}%</span>
                )}
            </div>

            <div className="post-card-body">
                {post.hashtags?.length > 0 && (
                    <div className="post-card-tags">
                        {post.hashtags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="post-card-tag">{tag}</span>
                        ))}
                    </div>
                )}

                <Link to={`/blog/${post.slug}`}>
                    <h2 className="post-card-title">{post.title}</h2>
                </Link>

                <p className="post-card-excerpt">{post.excerpt}</p>

                <div className="post-card-footer">
                    <span className="post-card-date">{formatDate(post.created_at)}</span>
                    <Link to={`/blog/${post.slug}`} className="post-card-read-more">
                        Read Article →
                    </Link>
                </div>
            </div>
        </article>
    )
}
