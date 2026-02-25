
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: 'grid_view' },
        { name: 'Discovery', path: '/topics', icon: 'explore' },
        { name: 'Research', path: '/scrape', icon: 'travel_explore' },
        { name: 'Posts', path: '/posts', icon: 'auto_stories' },
    ];

    const adminItems = [
        { name: 'Dataset Refinery', path: '/finetune', icon: 'psychology' },
        { name: 'Settings', path: '/settings', icon: 'settings' },
    ];

    return (
        <div className="flex h-screen bg-[#FDFDFF] font-sans">
            {/* Sidebar */}
            <aside className={`bg-[#0A0B10] text-white w-72 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? '' : '-ml-72'} flex flex-col`}>
                <div className="p-8 pb-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <i className="material-icons text-white">auto_awesome</i>
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase">Tewsletter</span>
                </div>

                <div className="flex-1 px-4 space-y-8">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-4">Editorial Console</p>
                        <nav>
                            <ul className="space-y-1.5">
                                {navItems.map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            to={item.path}
                                            className={`flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 group ${location.pathname === item.path
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                                                : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <i className={`material-icons mr-4 text-xl ${location.pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'}`}>{item.icon}</i>
                                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-4">System Logic</p>
                        <nav>
                            <ul className="space-y-1.5">
                                {adminItems.map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            to={item.path}
                                            className={`flex items-center px-5 py-3 rounded-2xl transition-all duration-300 group ${location.pathname === item.path
                                                ? 'bg-white/10 text-white'
                                                : 'hover:bg-white/5 text-gray-500 hover:text-white'
                                                }`}
                                        >
                                            <i className="material-icons mr-4 text-lg text-gray-600 group-hover:text-indigo-400">{item.icon}</i>
                                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>

                {/* User Profile Stub */}
                <div className="p-6 m-4 bg-white/5 rounded-[2rem] border border-white/5">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-3 flex items-center justify-center font-black text-xs text-white border-2 border-white/10">
                            DH
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-wider">Dexter Hut</p>
                            <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-tighter">Enterprise Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-400 hover:text-indigo-600 focus:outline-none mr-6 transition-colors"
                        >
                            <span className="material-icons">{sidebarOpen ? 'menu_open' : 'menu'}</span>
                        </button>
                        <nav className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Protocol</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                {navItems.find(i => i.path === location.pathname)?.name || adminItems.find(i => i.path === location.pathname)?.name || 'Console'}
                            </span>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            System Live
                        </div>
                        <button className="text-gray-400 hover:text-indigo-600 transition-colors relative">
                            <i className="material-icons text-xl">notifications</i>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FE] p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
