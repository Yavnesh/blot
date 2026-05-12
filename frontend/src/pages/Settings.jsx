import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Bell, User, Cpu, Database, Cloud, Save, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

const Settings = () => {
    const { user, setUser, orgId } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        role_position: user?.role_position || '',
        personalization_enabled: true
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                role_position: user.role_position || '',
                personalization_enabled: user.organizations?.[0]?.personalization_enabled ?? true
            });
        }
    }, [user]);

    const handleToggle = async () => {
        const newVal = !formData.personalization_enabled;
        setFormData({ ...formData, personalization_enabled: newVal });
        
        try {
            if (orgId) {
                await api.put(`/organizations/${orgId}`, {
                    personalization_enabled: newVal
                });
            }
        } catch (err) {
            console.error("Failed to update preference:", err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            const res = await api.put('/users/me', {
                full_name: formData.full_name,
                role_position: formData.role_position
            });
            setUser(res.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
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
                    <SettingsNav active icon={<User size={16} />} label="Personal Profile" />
                    <SettingsNav icon={<Shield size={16} />} label="Access & Security" />
                    <SettingsNav icon={<Bell size={16} />} label="Node Notifications" />
                    <SettingsNav icon={<Cpu size={16} />} label="Model Engine" />
                    <SettingsNav icon={<Database size={16} />} label="Data Persistence" />
                </nav>

                <div className="md:col-span-2 space-y-8">
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
                </div>
            </div>
        </div>
    );
};

const SettingsNav = ({ icon, label, active }) => (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-lg shadow-teal-500/5 font-black' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 font-bold'}`}>
        <div className={active ? 'text-teal-400' : 'text-slate-600'}>
            {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </button>
);

export default Settings;
