import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings as SettingsIcon, 
    Shield, 
    Bell, 
    User, 
    Cpu, 
    Database, 
    Cloud, 
    Save, 
    Sparkles, 
    Zap,
    BookOpen,
    Instagram,
    Plus,
    Trash2,
    Globe,
    Youtube,
    Rss,
    Link,
    Search,
    X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const Settings = () => {
    const { user, setUser, orgId } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        role_position: user?.role_position || '',
        personalization_enabled: true
    });

    const [blogSources, setBlogSources] = useState([]);
    const [instagramSources, setInstagramSources] = useState([]);

    useEffect(() => {
        if (user) {
            const org = user.organizations?.find(o => o.id.toString() === orgId?.toString()) || user.organizations?.[0];
            setFormData({
                full_name: user.full_name || '',
                role_position: user.role_position || '',
                personalization_enabled: org?.personalization_enabled ?? true
            });
            setBlogSources(org?.blog_sources || []);
            setInstagramSources(org?.instagram_sources || []);
        }
    }, [user, orgId]);

    const handleToggle = () => {
        setFormData(prev => ({
            ...prev,
            personalization_enabled: !prev.personalization_enabled
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            const activeOrgId = orgId || user?.organizations?.[0]?.id;
            if (!activeOrgId) {
                throw new Error("No active organization ID identified. Profile update aborted.");
            }

            // Update profile info
            const res = await api.put('/users/me', {
                full_name: formData.full_name,
                role_position: formData.role_position
            });

            // Update organization sources and personalization
            const orgRes = await api.put(`/organizations/${activeOrgId}`, {
                personalization_enabled: formData.personalization_enabled,
                blog_sources: blogSources,
                instagram_sources: instagramSources
            });
            const updatedOrg = orgRes.data;

            // Sync user state in frontend
            const finalUser = { ...res.data };
            const currentOrgs = user?.organizations || [];

            if (updatedOrg) {
                const orgsToMap = finalUser.organizations && finalUser.organizations.length > 0
                    ? finalUser.organizations
                    : currentOrgs;

                finalUser.organizations = orgsToMap.map(o => 
                    o.id.toString() === activeOrgId.toString() ? { ...o, ...updatedOrg } : o
                );
            } else if (!finalUser.organizations) {
                finalUser.organizations = currentOrgs;
            }
            
            setUser(finalUser);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to commit settings updates:", err);
            alert("Error: Failed to save changes. " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto p-4 lg:p-0 space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <SettingsIcon className="text-teal-400 w-8 h-8" />
                        System <span className="text-teal-400">Settings</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                        Platform Orchestration & Security Protocols
                    </p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                    {loading ? 'Syncing...' : success ? 'Successfully Saved' : <><Save size={14} /> Commit Changes</>}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <nav className="space-y-2">
                    <SettingsNav active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label="Personal Profile" />
                    <SettingsNav active={activeTab === 'blog'} onClick={() => setActiveTab('blog')} icon={<BookOpen size={16} />} label="Blog Channels" />
                    <SettingsNav active={activeTab === 'instagram'} onClick={() => setActiveTab('instagram')} icon={<Instagram size={16} />} label="Instagram Channels" />
                    <SettingsNav active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={16} />} label="Access & Security" />
                    <SettingsNav active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell size={16} />} label="Node Notifications" />
                    <SettingsNav active={activeTab === 'model'} onClick={() => setActiveTab('model')} icon={<Cpu size={16} />} label="Model Engine" />
                    <SettingsNav active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={16} />} label="Data Persistence" />
                </nav>

                <div className="md:col-span-2 space-y-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div 
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-8"
                            >
                                <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <User size={120} />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                                        <User size={16} className="text-teal-400" />
                                        Entity Profile
                                    </h3>
                                    <div className="space-y-6 relative z-10">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] ml-1">Full Name</label>
                                                <input 
                                                    type="text"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                                    className="w-full h-16 bg-slate-950/50 border border-white/5 rounded-2xl px-6 flex items-center text-sm font-black text-slate-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] ml-1">Matrix Role</label>
                                                <input 
                                                    type="text"
                                                    value={formData.role_position}
                                                    onChange={(e) => setFormData({...formData, role_position: e.target.value})}
                                                    className="w-full h-16 bg-slate-950/50 border border-white/5 rounded-2xl px-6 flex items-center text-sm font-black text-slate-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] ml-1">Nexus Email</label>
                                            <div className="h-16 bg-slate-950/20 border border-white/5 rounded-2xl px-6 flex items-center text-sm font-black text-slate-600 shadow-inner">
                                                {user?.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl relative">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Sparkles size={16} className="text-teal-400" />
                                        AI Personalization
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 group hover:border-teal-500/20 transition-all cursor-pointer" onClick={handleToggle}>
                                            <div>
                                                <p className="text-xs font-black text-white px-1">Use Company & Profile Data</p>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1 mt-1">Incorporate your brand's unique voice into all blog generation</p>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.personalization_enabled ? 'bg-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-800'}`}>
                                                <motion.div 
                                                    animate={{ x: formData.personalization_enabled ? 24 : 4 }}
                                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Cloud size={120} />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Cloud size={16} className="text-teal-400" />
                                        Orchestrator Defaults
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-white/5 group hover:border-teal-500/20 transition-all">
                                            <div>
                                                <p className="text-xs font-black text-white px-1">Automatic Research</p>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1 mt-1">Enable web-scraping for all new topics</p>
                                            </div>
                                            <div className="w-12 h-6 bg-teal-500 rounded-full relative cursor-pointer shadow-lg shadow-teal-500/20">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-all" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <Zap size={16} className="text-amber-400" />
                                        Subscription & Node Capacity
                                    </h3>
                                    
                                    <div className="bg-slate-950/50 rounded-3xl p-8 border border-white/5 space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Active Protocol</span>
                                                <h4 className="text-xl font-black text-white uppercase tracking-tighter">
                                                    {user?.organizations?.[0]?.plan_id === 'pro_tier' ? 'Bionic Professional' : 'Basic Compute'}
                                                </h4>
                                            </div>
                                            <div className="px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                                                    {user?.organizations?.[0]?.subscription_status || 'Trial'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                                                <span>Generation Quota</span>
                                                <span>84% Used</span>
                                            </div>
                                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-gradient-to-r from-teal-500 to-amber-500 w-[84%]" />
                                            </div>
                                        </div>

                                        <button className="w-full h-16 bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-teal-400 transition-all transform hover:-translate-y-1 active:scale-[0.98]">
                                            Manage Subscription
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'blog' && (
                            <motion.div 
                                key="blog"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <SourcesManager 
                                    title="Blog Content"
                                    sources={blogSources}
                                    onChange={setBlogSources}
                                    themeColor="teal"
                                />
                            </motion.div>
                        )}

                        {activeTab === 'instagram' && (
                            <motion.div 
                                key="instagram"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <SourcesManager 
                                    title="Instagram Campaign"
                                    sources={instagramSources}
                                    onChange={setInstagramSources}
                                    themeColor="pink"
                                />
                            </motion.div>
                        )}

                        {['security', 'notifications', 'model', 'data'].includes(activeTab) && (
                            <motion.div 
                                key="restricted"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <RestrictedAreaTab tabName={activeTab} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const SettingsNav = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
            active 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/5 font-black' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 font-bold'
        }`}
    >
        <div className={active ? 'text-teal-400' : 'text-slate-600'}>
            {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </button>
);

const RestrictedAreaTab = ({ tabName }) => {
    const getTabDetails = () => {
        switch (tabName) {
            case 'security':
                return {
                    icon: <Shield size={120} />,
                    title: 'Access & Security',
                    subtitle: 'Matrix access control and credentials persistence',
                };
            case 'notifications':
                return {
                    icon: <Bell size={120} />,
                    title: 'Node Notifications',
                    subtitle: 'System alerts and webhooks dispatch configurations',
                };
            case 'model':
                return {
                    icon: <Cpu size={120} />,
                    title: 'Model Engine',
                    subtitle: 'LLM hyperparameters and API key provisioning',
                };
            case 'data':
                return {
                    icon: <Database size={120} />,
                    title: 'Data Persistence',
                    subtitle: 'Vector DB partitions and database replication schema',
                };
            default:
                return {
                    icon: <Zap size={120} />,
                    title: 'Restricted Protocol',
                    subtitle: 'Secure connection module parameters',
                };
        }
    };

    const details = getTabDetails();

    return (
        <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white">
                {details.icon}
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <span className="text-teal-400">{React.cloneElement(details.icon, { size: 16 })}</span>
                {details.title}
            </h3>
            <div className="bg-slate-950/50 rounded-3xl p-8 border border-white/5 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider">
                    {details.subtitle}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em]">
                    <Zap size={12} /> Restricted Protocol Area
                </div>
            </div>
        </div>
    );
};

const SourcesManager = ({ title, sources, onChange, themeColor = 'teal' }) => {
    const [type, setType] = useState('website');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [validationError, setValidationError] = useState('');

    const handleAdd = () => {
        if (!value.trim()) {
            setValidationError('Value cannot be empty');
            return;
        }

        if (value.includes('.') && !value.startsWith('http://') && !value.startsWith('https://')) {
            setValidationError('Please prefix with http:// or https://');
            return;
        }

        setValidationError('');
        const newSource = { type, value: value.trim() };
        onChange([...sources, newSource]);
        setValue('');
    };

    const handleRemove = (indexToRemove) => {
        onChange(sources.filter((_, idx) => idx !== indexToRemove));
    };

    const filteredSources = sources.filter(src => {
        const matchesSearch = src.value.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterType === 'all' || src.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getIcon = (srcType) => {
        switch (srcType) {
            case 'youtube': return <Youtube size={16} className="text-red-500" />;
            case 'rss': return <Rss size={16} className="text-amber-500" />;
            case 'website':
            default:
                return <Globe size={16} className="text-teal-400" />;
        }
    };

    const getThemeGradient = () => {
        if (themeColor === 'pink') {
            return 'from-purple-600 via-pink-500 to-yellow-500';
        }
        return 'from-teal-600 via-teal-500 to-emerald-500';
    };

    return (
        <div className="glass-panel p-10 border border-white/5 bg-slate-900 shadow-2xl relative overflow-hidden">
            <div className={`absolute -right-20 -top-20 w-80 h-80 ${themeColor === 'pink' ? 'bg-pink-500/5' : 'bg-teal-500/5'} rounded-full blur-3xl`} />
            
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                {themeColor === 'pink' ? <Instagram size={18} className="text-pink-400" /> : <BookOpen size={18} className="text-teal-400" />}
                {title} default sources
            </h3>

            <div className="space-y-8 relative z-10">
                {/* Form to Add Source */}
                <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        Add New Content Feed Source
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="bg-slate-900 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="website">Website URL</option>
                            <option value="youtube">YouTube Link</option>
                            <option value="rss">RSS Feed URL</option>
                        </select>
                        
                        <div className="md:col-span-2 relative">
                            <input 
                                type="text"
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    if (validationError) setValidationError('');
                                }}
                                placeholder={
                                    type === 'website' ? 'https://example.com' :
                                    type === 'youtube' ? 'https://youtube.com/c/channel' :
                                    'https://example.com/rss.xml'
                                }
                                className={`w-full bg-slate-900 border ${validationError ? 'border-amber-500/50' : 'border-white/5'} rounded-2xl px-4 py-3 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                            />
                            {validationError && (
                                <span className="absolute left-1 -bottom-5 text-[8px] font-black uppercase text-amber-500 tracking-wider">
                                    {validationError}
                                </span>
                            )}
                        </div>

                        <button 
                            onClick={handleAdd}
                            className={`bg-gradient-to-r ${getThemeGradient()} hover:opacity-90 text-white rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2`}
                        >
                            <Plus size={14} /> Add Source
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 bg-slate-950/40 px-4 py-2 rounded-2xl border border-white/5 w-full md:w-64">
                        <Search size={14} className="text-slate-500" />
                        <input 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter sources..."
                            className="bg-transparent text-xs font-medium text-slate-300 placeholder-slate-600 focus:outline-none w-full"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {['all', 'website', 'youtube', 'rss'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    filterType === t 
                                        ? 'bg-white/10 text-white border border-white/10' 
                                        : 'text-slate-500 hover:text-slate-300 bg-transparent'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sources List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {filteredSources.length === 0 ? (
                        <div className="text-center py-12 bg-slate-950/20 rounded-3xl border border-dashed border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {search || filterType !== 'all' ? 'No matching sources found' : 'No default sources configured'}
                            </p>
                            <p className="text-[8px] text-slate-600 uppercase tracking-wider mt-2">
                                {search || filterType !== 'all' ? 'Try adjusting your filters' : 'Use the form above to add primary channels'}
                            </p>
                        </div>
                    ) : (
                        filteredSources.map((src, index) => {
                            const originalIndex = sources.findIndex(s => s.value === src.value && s.type === src.type);
                            return (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between p-4 bg-slate-950/60 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                                            {getIcon(src.type)}
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">
                                                {src.type}
                                            </span>
                                            <div className="text-xs font-bold text-slate-300 truncate max-w-[280px] md:max-w-md">
                                                {src.value}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemove(originalIndex !== -1 ? originalIndex : index)}
                                        className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
