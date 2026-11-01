import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Users, Target, Key, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export default function AdminProjects() {
    const { token } = useAuthStore();
    const { projects, fetchProjects, createProject } = useProjectStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [keywords, setKeywords] = useState('');
    const [brandVoice, setBrandVoice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (token) fetchProjects(token);
    }, [token, fetchProjects]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        const projectData = {
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            description,
            target_audience: targetAudience,
            preferred_keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            brand_overrides: {
                brand_voice: brandVoice || 'Authoritative and insightful'
            }
        };

        const result = await createProject(token, projectData);
        if (result) {
            setMessage({ type: 'success', text: `Project '${name}' created successfully!` });
            setIsCreateModalOpen(false);
            setName('');
            setSlug('');
            setDescription('');
            setTargetAudience('');
            setKeywords('');
            setBrandVoice('');
        } else {
            setMessage({ type: 'error', text: 'Failed to create project. Please verify inputs.' });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <FolderKanban className="text-teal-400" /> Campaign Projects & Brand Profiles
                    </h1>
                    <p className="text-xs text-slate-400">Partition your organization's content into targeted campaigns with customized brand tone and audience rules.</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 active:scale-95 transition-all self-start md:self-auto"
                >
                    <Plus size={16} /> New Campaign Project
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => (
                    <motion.div
                        key={proj.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-teal-500/30 transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                <span>Slug: /{proj.slug}</span>
                                <span className="text-teal-400">Active</span>
                            </div>
                            <h3 className="text-base font-black text-white mb-1">{proj.name}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2">{proj.description || 'No description provided.'}</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5 text-[11px]">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Target size={14} className="text-teal-400 shrink-0" />
                                <span className="truncate">{proj.target_audience || 'General B2B Audience'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <Key size={14} className="text-teal-400 shrink-0" />
                                <span className="truncate">
                                    {(proj.preferred_keywords && proj.preferred_keywords.join(', ')) || 'Standard keywords'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
                    >
                        <button 
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-500 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Create Campaign Project</h3>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Project Name</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Q4 FinTech Enterprise Growth"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">URL Slug</label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="e.g. q4-fintech-growth (auto-generated if empty)"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Goals and strategic context for this campaign..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Audience</label>
                                    <input
                                        type="text"
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        placeholder="e.g. CISOs & VPs"
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Brand Voice</label>
                                    <input
                                        type="text"
                                        value={brandVoice}
                                        onChange={(e) => setBrandVoice(e.target.value)}
                                        placeholder="e.g. Authoritative"
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Keywords (comma-separated)</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="quantum resistance, post-quantum, NIST compliance"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
