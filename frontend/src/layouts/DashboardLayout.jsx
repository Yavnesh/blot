
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: 'dashboard' },
        { name: 'Topic', path: '/topics', icon: 'topic' },
        { name: 'Scrape', path: '/scrape', icon: 'content_paste' },
        { name: 'Posts', path: '/posts', icon: 'article' },
        { name: 'Fine-Tuning', path: '/finetune', icon: 'model_training' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className={`bg-gray-900 text-white w-64 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? '' : '-ml-64'}`}>
                <div className="p-4 flex items-center justify-between">
                    <span className="text-xl font-bold">Tewsletter</span>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                        <i className="material-icons">close</i>
                    </button>
                </div>
                <hr className="border-gray-700" />

                {/* User Profile Stub */}
                <div className="p-4 flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-500 mr-3 flex items-center justify-center">
                        <span className="text-sm">DH</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Dexter Hut</p>
                    </div>
                </div>
                <hr className="border-gray-700 mb-4" />

                <nav>
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.name} className="mb-1">
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 mx-2 rounded-lg transition-colors ${location.pathname === item.path
                                        ? 'bg-pink-600 text-white shadow-md'
                                        : 'hover:bg-gray-800 text-gray-300'
                                        }`}
                                >
                                    <i className="material-icons mr-3 text-sm">{item.icon}</i>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="bg-white shadow-sm z-10 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-500 focus:outline-none mr-4"
                        >
                            <i className="material-icons">menu</i>
                        </button>
                        <nav className="text-gray-500 text-sm">
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-semibold">{navItems.find(i => i.path === location.pathname)?.name || 'Page'}</span>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Search Stub */}
                        <div className="relative">
                            <input type="text" placeholder="Search here" className="bg-gray-100 border border-gray-300 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block w-full p-2 pl-3" />
                        </div>
                        <button className="text-gray-500 hover:text-gray-700"><i className="material-icons">settings</i></button>
                        <button className="text-gray-500 hover:text-gray-700 relative">
                            <i className="material-icons">notifications</i>
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">11</span>
                        </button>
                    </div>
                </header>

                {/* content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
