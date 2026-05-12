import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
    LayoutDashboard, 
    Zap, 
    Terminal, 
    Database, 
    Globe, 
    Settings, 
    LogOut, 
    Menu, 
    ChevronLeft, 
    Bell,
    BrainCircuit,
    Layers,
    Search
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, orgId, setOrgId, logout, organizations } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { name: 'Intelligence Ledger', path: '/ledger', icon: <LayoutDashboard size={18} /> },
        { name: 'Bionic Workspace', path: '/workspace', icon: <Zap size={18} /> },
        { name: 'Discovery Hub', path: '/topics', icon: <Globe size={18} /> },
        { name: 'Research Engine', path: '/scrape', icon: <Search size={18} /> },
        { name: 'Post Repository', path: '/posts', icon: <Terminal size={18} /> },
        { name: 'Knowledge Vault', path: '/vault', icon: <Database size={18} /> },
    ];

    const adminItems = [
        { name: 'Dataset Refinery', path: '/finetune', icon: <Layers size={18} /> },
        { name: 'System Settings', path: '/settings', icon: <Settings size={18} /> },
    ];

    const activeItem = [...navItems, ...adminItems].find(item => item.path === location.pathname);

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-100 selection:bg-teal-500/30 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (Interstellar Dark) */}
            <aside className={`fixed lg:static inset-y-0 left-0 bg-slate-900 border-r border-white/5 w-72 flex-shrink-0 transition-all duration-500 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0'} flex flex-col z-50 shadow-2xl shadow-black/50 overflow-hidden`}>
                <div className="p-6 md:p-8 pb-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 transform hover:rotate-12 transition-transform">
                        <BrainCircuit className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-white leading-none block">Blot<span className="text-teal-400">.ai</span></span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Autonomous OS</span>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-600 mb-4 pl-4 uppercase tracking-[0.2em]">Console Orchestration</p>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                        className={`flex items-center px-4 py-3 rounded-2xl transition-all group relative ${isActive
                                            ? 'bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5'
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                    >
                                        {isActive && <div className="absolute left-0 w-1 h-6 bg-teal-500 rounded-full" />}
                                        <div className={`mr-4 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-600 mb-4 pl-4 uppercase tracking-[0.2em]">System Logic</p>
                        <nav className="space-y-1">
                            {adminItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                        className={`flex items-center px-4 py-3 rounded-2xl transition-all group relative ${isActive
                                            ? 'bg-teal-500/10 text-teal-400 shadow-lg shadow-teal-500/5'
                                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                    >
                                        {isActive && <div className="absolute left-0 w-1 h-6 bg-teal-500 rounded-full" />}
                                        <div className={`mr-4 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* User Session */}
                <div className="p-4 border-t border-white/5 bg-slate-950/50">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-white/5">
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-teal-500/10 flex items-center justify-center font-black text-[10px] md:text-xs text-teal-400 border border-teal-500/20 shrink-0">
                                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="truncate">
                                <p className="text-[10px] md:text-xs font-black text-white truncate leading-none mb-1">{user?.full_name || 'Admin User'}</p>
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{user?.email || 'admin@blot.ai'}</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => logout()}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Application Stage */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Unified Navbar */}
                <header className="bg-slate-950/50 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-20 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95 shrink-0"
                        >
                            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                        </button>
                        
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Perspective</span>
                                <select 
                                    value={orgId || ''} 
                                    onChange={(e) => setOrgId(e.target.value)}
                                    className="text-[10px] md:text-xs font-black text-white bg-transparent border-none focus:ring-0 p-0 pr-6 uppercase tracking-widest cursor-pointer hover:text-teal-400 transition-colors appearance-none outline-none truncate"
                                >
                                    <option value="" disabled className="bg-slate-900">Switch Realm</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id} className="bg-slate-900">
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-6 w-[1px] bg-white/10 shrink-0" />
                            <div className="flex flex-col gap-1 min-w-0">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Active Matrix</span>
                                <span className="text-[10px] md:text-xs font-black text-teal-400 uppercase tracking-widest truncate">
                                    {activeItem?.name || 'In-Process'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-teal-500/5 border border-teal-500/10">
                            <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                            <span className="text-[8px] md:text-[10px] font-black text-teal-400 uppercase tracking-wider">Synchronized</span>
                        </div>
                        <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all relative">
                            <Bell size={16} />
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-slate-900" />
                        </button>
                    </div>
                </header>

                {/* Content Viewport */}
                <main className="flex-1 overflow-y-auto canvas-grid relative custom-scrollbar">
                    {/* Background Ambient Glows */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
