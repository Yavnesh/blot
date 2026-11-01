import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Share2, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Linkedin, 
    Twitter, 
    Instagram, 
    Facebook, 
    Send, 
    Globe, 
    Calendar, 
    Layers, 
    Radio, 
    RefreshCw, 
    ExternalLink,
    X,
    Filter,
    Shield
} from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import SocialPublishModal from '../components/SocialPublishModal';

export default function PublishingHub() {
    const { user, userRole, orgId } = useAuthStore();
    const { activeProjectId } = useProjectStore();

    const [accounts, setAccounts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('approved'); // 'approved' | 'published' | 'accounts'
    
    // Connect modal state
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({
        platform: 'linkedin',
        account_name: '',
        account_id: '',
        access_token: 'mock_token_' + Math.random().toString(36).substring(7)
    });
    const [connecting, setConnecting] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    // Social publish modal
    const [publishModalPost, setPublishModalPost] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const [accountsRes, postsRes] = await Promise.all([
                fetch('http://localhost:8080/api/v1/social/accounts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:8080/api/v1/posts/?limit=100', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (accountsRes.ok) {
                const accountsData = await accountsRes.json();
                setAccounts(accountsData);
            }
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setPosts(postsData);
            }
        } catch (err) {
            console.error('Error fetching publishing hub data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [orgId, activeProjectId]);

    const handleConnectAccount = async (e) => {
        e.preventDefault();
        setConnecting(true);
        setActionMessage(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8080/api/v1/social/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platform: newAccount.platform,
                    account_name: newAccount.account_name,
                    account_id: newAccount.account_id || `${newAccount.platform}_${Date.now()}`,
                    access_token: newAccount.access_token,
                    project_id: activeProjectId ? parseInt(activeProjectId) : null
                })
            });

            if (res.ok) {
                setActionMessage({ type: 'success', text: `Successfully connected ${newAccount.account_name} (${newAccount.platform})` });
                setIsConnectModalOpen(false);
                setNewAccount({
                    platform: 'linkedin',
                    account_name: '',
                    account_id: '',
                    access_token: 'mock_token_' + Math.random().toString(36).substring(7)
                });
                fetchData();
            } else {
                const errData = await res.json();
                setActionMessage({ type: 'error', text: errData.detail || 'Failed to connect channel.' });
            }
        } catch (err) {
            setActionMessage({ type: 'error', text: err.message });
        } finally {
            setConnecting(false);
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'linkedin': return <Linkedin size={16} className="text-blue-400" />;
            case 'twitter':
            case 'x': return <Twitter size={16} className="text-sky-400" />;
            case 'instagram': return <Instagram size={16} className="text-pink-400" />;
            case 'facebook': return <Facebook size={16} className="text-indigo-400" />;
            default: return <Globe size={16} className="text-teal-400" />;
        }
    };

    // Filter posts for Manager ready-to-broadcast queue vs published history
    const approvedPosts = posts.filter(p => p.review_status === 'manager_approved');
    const publishedPosts = posts.filter(p => p.status === 'published' || p.review_status === 'published');

    return (
        <div className="w-full max-w-[1720px] mx-auto p-4 md:p-8 lg:p-12 space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <Share2 className="text-teal-400 w-7 h-7 md:w-8 md:h-8" />
                        Publishing <span className="text-teal-400">Hub</span>
                    </h1>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mt-2">
                        Omnichannel Social Dispatch & Broadcast Management
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {(userRole === 'admin' || userRole === 'manager') && (
                        <button
                            onClick={() => setIsConnectModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
                        >
                            <Plus size={16} /> Connect Channel
                        </button>
                    )}
                </div>
            </div>

            {/* Notification alert */}
            {actionMessage && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                    actionMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Metrics HUD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connected Channels</span>
                        <Radio size={16} className="text-teal-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{accounts.length}</div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1 block">Active broadcast destinations</span>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Dispatch</span>
                        <Clock size={16} className="text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{approvedPosts.length}</div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1 block">Manager-approved posts</span>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Broadcasted</span>
                        <Send size={16} className="text-blue-400" />
                    </div>
                    <div className="text-3xl font-black text-white">{publishedPosts.length}</div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1 block">Live across platforms</span>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Role Security</span>
                        <Shield size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-teal-400 uppercase">{userRole || 'creator'}</div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1 block">Publishing clearance level</span>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 border-b border-white/5 pb-4">
                <button
                    onClick={() => setSelectedTab('approved')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedTab === 'approved' 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Ready for Broadcast ({approvedPosts.length})
                </button>
                <button
                    onClick={() => setSelectedTab('published')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedTab === 'published' 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Broadcast History ({publishedPosts.length})
                </button>
                <button
                    onClick={() => setSelectedTab('accounts')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        selectedTab === 'accounts' 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Connected Channels ({accounts.length})
                </button>
            </div>

            {/* Main Tab Content */}
            {selectedTab === 'approved' && (
                <div className="space-y-4">
                    {approvedPosts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-white/5">
                            <Clock size={36} className="mx-auto text-slate-700 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Posts Awaiting Dispatch</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-1">
                                Content approved in the Review Queue will appear here ready to broadcast to social channels.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {approvedPosts.map((post) => (
                                <div 
                                    key={post.id}
                                    className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/30 transition-all shadow-xl"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
                                                <CheckCircle2 size={10} /> Ready to Publish
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                {post.platform || 'Multi-channel'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-white line-clamp-2 mb-2">{post.title || post.topic}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                                            {post.content ? post.content.substring(0, 150) + '...' : 'No content preview available.'}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                                        </span>
                                        <button
                                            onClick={() => setPublishModalPost(post)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                                        >
                                            <Send size={12} /> Broadcast
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'published' && (
                <div className="space-y-4">
                    {publishedPosts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-white/5">
                            <Send size={36} className="mx-auto text-slate-700 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Broadcast History Yet</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-1">
                                Dispatched social posts will be archived here along with publication timestamps.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publishedPosts.map((post) => (
                                <div 
                                    key={post.id}
                                    className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                                                <Radio size={10} /> Dispatched Live
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                {post.platform || 'Social Channel'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-white line-clamp-2 mb-2">{post.title || post.topic}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                                            {post.content ? post.content.substring(0, 150) + '...' : 'No content preview available.'}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                        <span>Status: Finalized</span>
                                        <span>{post.updated_at ? new Date(post.updated_at).toLocaleDateString() : 'Live'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedTab === 'accounts' && (
                <div className="space-y-4">
                    {accounts.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-white/5">
                            <Radio size={36} className="mx-auto text-slate-700 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Connected Social Channels</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-1 mb-4">
                                Connect LinkedIn, X (Twitter), Facebook, or Instagram to unlock autonomous and manual broadcasts.
                            </p>
                            <button
                                onClick={() => setIsConnectModalOpen(true)}
                                className="px-4 py-2.5 bg-teal-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-400 transition-all"
                            >
                                Connect Channel Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts.map((acc) => (
                                <div 
                                    key={acc.id}
                                    className="bg-slate-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-teal-500/20 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center">
                                            {getPlatformIcon(acc.platform)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white">{acc.account_name}</h4>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                {acc.platform} • ID: {acc.account_id || acc.id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Active
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Connect Channel Modal */}
            {isConnectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
                    >
                        <button 
                            onClick={() => setIsConnectModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-500 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Connect Social Broadcast Channel</h3>

                        <form onSubmit={handleConnectAccount} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Platform</label>
                                <select 
                                    value={newAccount.platform}
                                    onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                                >
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="twitter">X / Twitter</option>
                                    <option value="facebook">Facebook Pages</option>
                                    <option value="instagram">Instagram Professional</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Channel / Profile Name</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="e.g. Learn Something Daily Official"
                                    value={newAccount.account_name}
                                    onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Account Handle / ID (Optional)</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. @learnsomethingdaily"
                                    value={newAccount.account_id}
                                    onChange={(e) => setNewAccount({ ...newAccount, account_id: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-teal-500 placeholder-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">OAuth Token / Webhook Secret</label>
                                <input 
                                    type="text"
                                    required
                                    value={newAccount.access_token}
                                    onChange={(e) => setNewAccount({ ...newAccount, access_token: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none focus:border-teal-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsConnectModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={connecting}
                                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-50"
                                >
                                    {connecting ? 'Connecting...' : 'Authorize Channel'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Social Broadcast Dispatch Modal */}
            {publishModalPost && (
                <SocialPublishModal
                    isOpen={!!publishModalPost}
                    onClose={() => {
                        setPublishModalPost(null);
                        fetchData();
                    }}
                    postId={publishModalPost.id}
                    postTitle={publishModalPost.title || publishModalPost.topic}
                    postPlatform={publishModalPost.platform}
                />
            )}
        </div>
    );
}
