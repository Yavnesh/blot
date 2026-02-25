import { Link } from 'react-router-dom'

export default function Footer({ totalPosts = 0 }) {
    const year = new Date().getFullYear()
    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <div className="footer-logo">TEWS<span>.</span></div>
                    <p className="footer-desc">
                        AI-powered technology intelligence. Every article is researched, drafted,
                        and SEO-optimised by an autonomous editorial engine — then reviewed by humans.
                    </p>
                </div>
                <div>
                    <div className="footer-col-title">Navigate</div>
                    <Link to="/" className="footer-link">All Articles</Link>
                    <a href="/api/v1/posts/sitemap.xml" className="footer-link" target="_blank">Sitemap</a>
                </div>
                <div>
                    <div className="footer-col-title">Product</div>
                    <a href="http://localhost:5173" className="footer-link" target="_blank">CMS Admin</a>
                    <a href="#" className="footer-link">SEO Analyser (Coming Soon)</a>
                </div>
            </div>
            <div className="footer-bottom">
                <span className="footer-copy">© {year} TEWS Intelligence. {totalPosts} articles published.</span>
                <span className="footer-copy">Built with the TEWS Agentic Editorial Engine.</span>
            </div>
        </footer>
    )
}
