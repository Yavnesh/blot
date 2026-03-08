
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Menu, X, ArrowRight } from 'lucide-react';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Handle theme initialization
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/articles?search=${encodeURIComponent(searchQuery)}`);
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Articles', path: '/articles' },
        { name: 'Categories', path: '/categories' },
        { name: 'About', path: '/about' },
        { name: 'Subscribe', path: '/subscribe' },
    ];

    return (
        <>
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 py-4' : 'bg-transparent py-6'}`}>
                <div className="container-custom flex items-center justify-between">
                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-neutral-900 dark:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link to="/" className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-white font-serif">
                        BLOT<span className="text-brand">.</span>
                    </Link>

                    {/* Navigation - Desktop */}
                    <nav className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`header-link ${location.pathname === link.path ? 'text-neutral-900 dark:text-white after:scale-x-100' : 'dark:text-neutral-400'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-neutral-400">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            <Search size={20} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:text-neutral-900 dark:hover:text-white transition-colors hidden sm:block"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link to="/subscribe" className="hidden md:block bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-95 shadow-lg shadow-neutral-200 dark:shadow-none">
                            Subscribe
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`lg:hidden fixed inset-0 bg-white dark:bg-neutral-900 z-40 transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col items-center justify-center h-full gap-12 pt-20">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-3xl font-serif font-bold text-neutral-900 dark:text-white"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link to="/subscribe" onClick={() => setMobileMenuOpen(false)} className="bg-brand text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Search Overlay */}
            <div className={`fixed inset-0 z-[100] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl transition-all duration-500 ${searchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute top-10 right-10 p-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>
                <div className="h-full container-custom flex flex-col items-center justify-center">
                    <form onSubmit={handleSearch} className="w-full max-w-4xl relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type to search archives..."
                            autoFocus={searchOpen}
                            className="w-full bg-transparent border-b-2 border-neutral-100 dark:border-neutral-800 py-6 text-3xl md:text-5xl font-serif font-bold outline-none placeholder:text-neutral-200 dark:placeholder:text-neutral-800 focus:border-brand dark:focus:border-brand transition-all pr-20 dark:text-white"
                        />
                        <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-brand p-2">
                            <ArrowRight size={48} />
                        </button>
                    </form>
                    <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300">Enter your query to explore the intelligence network</p>
                </div>
            </div>
        </>
    );
}
