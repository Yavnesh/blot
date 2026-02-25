import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import BlogPost from './pages/BlogPost'
import Analyzer from './pages/Analyzer'

export default function App() {
    return (
        <div className="site-wrapper">
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/analyzer" element={<Analyzer />} />
            </Routes>
        </div>
    )
}
