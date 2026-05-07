import React, { useState, useEffect } from 'react';
import api from '../lib/axios';

const KnowledgeBase = () => {
    const [assets, setAssets] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

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

    return (
        <div className="max-w-[1200px] mx-auto p-4 sm:p-8 space-y-12">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Knowledge Vault</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Proprietary Organization Intelligence</p>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 italic text-[11px] font-bold">
                    <i className="material-icons text-sm">security</i>
                    End-to-End Encrypted RAG
                </div>
            </header>

            {/* Premium Upload Area */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
                className={`relative group bg-white border-2 border-dashed rounded-[3rem] p-16 transition-all duration-500 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-2xl ${dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 hover:border-indigo-300'}`}
            >
                <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(e.target.files)} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center transition-transform duration-500 ${uploading ? 'bg-indigo-600 rotate-180' : 'bg-slate-900 group-hover:scale-110 group-hover:rotate-6'}`}>
                    <i className={`material-icons text-white text-3xl ${uploading ? 'animate-spin' : ''}`}>
                        {uploading ? 'sync' : 'cloud_upload'}
                    </i>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                    {uploading ? 'Vectorizing Intelligence...' : 'Upload Core Assets'}
                </h3>
                <p className="text-slate-400 font-medium text-sm max-w-xs leading-relaxed">
                    Drag and drop your PDFs, Research Papers, or Style Guides to prime the Authority Engine.
                </p>
                {uploading && (
                    <div className="mt-8 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-pulse w-2/3"></div>
                    </div>
                )}
            </div>

            {/* Asset Repository */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verified Knowledge Registry</h2>
                    <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => (
                        <div key={asset.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${asset.status === 'ready' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <i className="material-icons">
                                        {asset.file_type === 'pdf' ? 'description' : 'article'}
                                    </i>
                                </div>
                                <button 
                                    onClick={() => handleDelete(asset.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <i className="material-icons text-sm">delete</i>
                                </button>
                            </div>
                            
                            <h4 className="text-sm font-black text-slate-900 truncate mb-2 pr-4">{asset.name}</h4>
                            <div className="flex items-center justify-between mt-auto">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${asset.status === 'ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                                    {asset.status}
                                </span>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                    {new Date(asset.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            {asset.status === 'ready' && (
                                <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center group-hover:-translate-x-8 group-hover:-translate-y-8 transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-xl shadow-indigo-200">
                                    <i className="material-icons text-white text-sm">verified</i>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {assets.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <i className="material-icons text-slate-200 text-5xl mb-4">folder_open</i>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">The Repository is Empty</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
