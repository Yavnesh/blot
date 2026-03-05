import { Link } from 'react-router-dom'

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PostCard({ post }) {
    return (
        <article className="post-card group">
            <div className="post-card-thumb overflow-hidden relative">
                {post.image_url ? (
                    <img
                        src={`http://localhost:8080/${post.image_url}`}
                        alt={post.title}
                        className="post-card-image w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="post-card-thumb-pattern w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
