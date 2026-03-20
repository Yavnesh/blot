import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import BlogPost from './pages/BlogPost'
import Analyzer from './pages/Analyzer'
import Articles from './pages/Articles'
import About from './pages/About'
import Subscribe from './pages/Subscribe'

// Category and 404 pages
const Categories = () => (
    <div className="pt-40 pb-20 container-custom min-h-screen bg-white dark:bg-neutral-900 transition-colors duration-500">
        <header className="mb-20 animate-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand mb-6 block">Classification Protocol</span>
            <h1 className="display-medium text-neutral-900 dark:text-white mb-8 max-w-xl">Topics & <span className="italic">Categories.</span></h1>
            <p className="body-standard italic max-w-sm border-t border-neutral-100 dark:border-neutral-800 pt-8 text-neutral-500 dark:text-neutral-400 font-medium">
                Browsing our intellectual archives by neural classification and topical intent.
            </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-reveal delay-200">
            {['Technology', 'Culture', 'Lifestyle', 'Intelligence', 'Future', 'Society'].map(cat => (
                <div key={cat} className="bg-neutral-50 dark:bg-neutral-800/40 p-12 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 group hover:border-brand transition-all cursor-pointer">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-4 block">Archive Node</span>
                    <h3 className="text-2xl font-serif font-bold text-neutral-900 dark:text-white group-hover:text-brand transition-colors">{cat}</h3>
                    <div className="mt-8 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">12 Articles</span>
                        <div className="w-8 h-[1px] bg-neutral-100 dark:bg-neutral-800 group-hover:w-12 group-hover:bg-brand transition-all"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const NotFound = () => (
    <div className="pt-48 pb-32 container-custom min-h-[60vh] flex flex-col items-center justify-center text-center animate-reveal bg-white dark:bg-neutral-900 transition-colors duration-500">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 mb-6 block">ERROR 404</span>
        <h1 className="display-medium text-neutral-900 dark:text-white mb-8 leading-none">Protocol Path <span className="italic border-b-4 border-rose-100 dark:border-rose-900/30">Not Found.</span></h1>
        <p className="body-large italic max-w-md mb-12 text-neutral-500 dark:text-neutral-400">The digital coordinate you are seeking does not exist in our current neural index.</p>
        <a href="/" className="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-xl shadow-neutral-200 dark:shadow-none">
            Return to Kernel
        </a>
    </div>
);

export default function App() {
    return (
        <div className="site-wrapper min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/articles" element={<Articles />} />
                    {/* <Route path="/categories" element={<Categories />} /> */}
                    <Route path="/about" element={<About />} />
                    <Route path="/subscribe" element={<Subscribe />} />
                    <Route path="/analyzer" element={<Analyzer />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}
