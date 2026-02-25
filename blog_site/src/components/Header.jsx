import { Link } from 'react-router-dom'

export default function Header() {
    return (
        <header className="site-header">
            <div className="header-inner">
                <Link to="/" className="site-logo">
                    TEWS<span>.</span>
                </Link>
                <nav className="header-nav">
                    <Link to="/">Articles</Link>
                    <Link to="/analyzer">SEO Analyzer</Link>
                    <a href="https://yourblog.com/about" target="_blank" rel="noopener noreferrer">About</a>
                    <a
                        href="http://localhost:5173"
                        className="header-badge"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        CMS Admin ↗
                    </a>
                </nav>
            </div>
        </header>
    )
}
