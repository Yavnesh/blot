import React, { useState, useEffect } from 'react';
import { Database, Shield, Cloud, Loader2, FileText, Trash2, ShieldCheck, Eye, X, ExternalLink } from 'lucide-react';
import api from '../lib/axios';

const KnowledgeBase = () => {
    const [assets, setAssets] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previewAsset, setPreviewAsset] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchAssets = async () => {
        try {
            const res = await api.get('/context/');
            setAssets(res.data);
        } catch (err) {
            console.error('Failed to fetch knowledge assets', err);
        }
    };

    useEffect(() => {
        fetchAssets();
        const interval = setInterval(fetchAssets, 5000); // Poll for processing status
        return () => clearInterval(interval);
    }, []);

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        
        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/context/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchAssets();
        } catch (err) {
            alert(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this asset from the organization knowledge base?')) return;
        try {
            await api.delete(`/context/${id}`);
            fetchAssets();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const handleViewAsset = async (asset) => {
        try {
            const res = await api.get(`/context/${asset.id}/file`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            setPreviewUrl(url);
            setPreviewAsset(asset);
        } catch (err) {
            console.error('Failed to fetch file', err);
            alert('Could not retrieve file content');
        }
    };

    const closePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewAsset(null);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 pb-32">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                        <Database className="text-teal-400 w-6 h-6 md:w-8 md:h-8" />
                        Knowledge <span className="text-teal-400">Vault</span>
                    </h1>
                    <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3">Proprietary Organization Intelligence</p>
                </div>
                <div className="flex items-center gap-2 text-teal-400 bg-teal-500/10 px-4 py-2 rounded-xl border border-teal-500/20 italic text-[8px] md:text-[9px] font-black uppercase tracking-widest w-fit">
                    <Shield className="w-3 h-3" />
                    End-to-End Encrypted RAG
                </div>
            </header>

            {/* Premium Upload Area */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
                className={`relative group bg-slate-900 border-2 border-dashed rounded-2xl md:rounded-[3rem] p-8 md:p-16 transition-all duration-500 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl ${dragActive ? 'border-teal-500 bg-teal-500/5 scale-[1.01]' : 'border-white/5 hover:border-teal-500/20'}`}
            >
                <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e.target.files)} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl mb-6 flex items-center justify-center transition-transform duration-500 shadow-2xl shrink-0 ${uploading ? 'bg-teal-600 rotate-180' : 'bg-slate-950 group-hover:scale-110 group-hover:rotate-6 border border-white/10'}`}>
                    {uploading ? <Loader2 className="text-white w-6 h-6 md:w-8 md:h-8 animate-spin" /> : <Cloud className="text-teal-400 w-6 h-6 md:w-8 md:h-8" />}
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2 uppercase tracking-tight">
                    {uploading ? 'Vectorizing Intelligence...' : 'Upload Core Assets'}
                </h3>
                <p className="text-slate-500 font-black text-[8px] md:text-[10px] uppercase tracking-widest max-w-xs leading-relaxed">
                    Drag and drop your PDFs, Research Papers, or Style Guides to prime the Authority Engine.
                </p>
                {uploading && (
                    <div className="mt-8 w-48 md:w-64 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-teal-500 animate-pulse w-2/3 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                    </div>
                )}
            </div>

            {/* Asset Repository */}
            <div className="space-y-6 md:space-y-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-500">Verified Knowledge Registry</h2>
                    <div className="flex-1 h-[1px] bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-24">
                    {assets.map((asset) => (
                        <div key={asset.id} className="bg-slate-900 rounded-xl md:rounded-[2rem] p-5 md:p-6 border border-white/5 shadow-sm hover:shadow-2xl hover:border-teal-500/20 transition-all group relative overflow-hidden flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4 md:mb-6">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center border shrink-0 ${asset.status === 'ready' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-950 text-slate-600 border-white/5'}`}>
                                    <FileText className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => handleViewAsset(asset)}
                                        className="p-2 text-slate-400 hover:text-teal-400 transition-colors"
                                        title="View File"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(asset.id)}
                                        className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                                        title="Delete Asset"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <h4 className="text-xs md:text-sm font-black text-white truncate mb-2 pr-4">{asset.name}</h4>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full border shadow-sm ${asset.status === 'ready' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                                    {asset.status}
                                </span>
                                <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                    {new Date(asset.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {asset.status === 'ready' && (
                                <div className="absolute -bottom-6 -right-6 w-10 md:w-12 h-10 md:h-12 bg-teal-500 rounded-full flex items-center justify-center group-hover:-translate-x-8 group-hover:-translate-y-8 transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-xl shadow-teal-500/20">
                                    <ShieldCheck className="text-white w-4 h-4 md:w-5 md:h-5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {assets.length === 0 && !uploading && (
                    <div className="text-center py-16 md:py-24 bg-slate-950/50 rounded-2xl md:rounded-[3rem] border border-dashed border-white/5">
                        <Database className="text-slate-800 w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                        <p className="text-slate-600 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">The Repository is Empty</p>
                    </div>
                )}
            </div>

            {/* Asset Preview Modal */}
            {previewAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 lg:p-12">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={closePreview} />
                    <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                        <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/20 shrink-0">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 shrink-0">
                                    <FileText size={16} md:size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-black text-[10px] md:text-sm uppercase tracking-widest truncate">{previewAsset.name}</h3>
                                    <p className="text-[7px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{previewAsset.file_type} Resource • Verified</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-3 shrink-0">
                                <a 
                                    href={previewUrl} 
                                    download={previewAsset.name}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={16} md:size={18} />
                                </a>
                                <button onClick={closePreview} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                    <X size={18} md:size={20} />
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 bg-slate-950 relative overflow-hidden">
                            {previewAsset.file_type === 'pdf' || previewAsset.file_type.match(/jpg|jpeg|png|gif|webp/i) ? (
                                <iframe src={previewUrl} className="w-full h-full border-none" title="Asset Preview" />
                            ) : (
                                <div className="p-6 md:p-10 flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-6">
                                        <FileText size={24} md:size={32} />
                                    </div>
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-6">Preview not available for this format.</p>
                                    <a 
                                        href={previewUrl} 
                                        download={previewAsset.name}
                                        className="px-5 py-2.5 md:px-6 md:py-3 bg-teal-600 hover:bg-teal-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all shadow-xl shadow-teal-500/10 active:scale-95"
                                    >
                                        Download to View
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
