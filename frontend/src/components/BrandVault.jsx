import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Database, ToggleRight, ToggleLeft, File, Loader2 } from 'lucide-react';
import { useOrchestratorStore } from '../store/orchestratorStore';

const BrandVault = () => {
    const { 
        isBrandVaultOpen, 
        setBrandVaultOpen, 
        vaultAssets, 
        selectedAssetIds, 
        toggleAssetSelection,
        uploadVaultAsset,
        isUploading
    } = useOrchestratorStore();

    const fileInputRef = useRef(null);

    if (!isBrandVaultOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) uploadVaultAsset(file);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setBrandVaultOpen(false)}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-2xl glass-panel p-10 relative z-10 border border-white/5 shadow-2xl"
                >
                    <button 
                        onClick={() => setBrandVaultOpen(false)}
                        className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Brand Vault</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mt-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                Knowledge Base • Organization-Scoped RAG
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Drag & Drop Zone */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-teal-500/40 hover:bg-teal-500/5 transition-all group cursor-pointer relative"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                            {isUploading ? (
                                <Loader2 size={32} className="text-teal-400 animate-spin mb-4" />
                            ) : (
                                <UploadCloud size={32} className="text-slate-600 group-hover:text-teal-400 mb-4 transition-colors" />
                            )}
                            <span className="text-sm font-bold text-slate-400 mb-1">
                                {isUploading ? 'Ingesting Asset...' : 'Incorporate External Context'}
                            </span>
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">PDF, DOCX, TXT • Accelerated Embedding</span>
                        </div>

                        {/* Active Knowledge Bases */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest tracking-[0.2em]">Available Artifacts</h3>
                                <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{vaultAssets.length} Assets Found</span>
                            </div>
                            
                            {vaultAssets.length > 0 ? (
                                vaultAssets.map((asset) => {
                                    const isSelected = selectedAssetIds.includes(asset.id);
                                    return (
                                        <div 
                                            key={asset.id} 
                                            onClick={() => toggleAssetSelection(asset.id)}
                                            className={`flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer group ${
                                                isSelected 
                                                ? 'bg-teal-500/10 border border-teal-500/20 shadow-lg shadow-teal-500/5' 
                                                : 'bg-slate-900/40 border border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-950 text-slate-600 group-hover:text-slate-400 transition-colors'}`}>
                                                    <File size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-black transition-colors ${isSelected ? 'text-teal-400' : 'text-slate-300'}`}>{asset.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black uppercase text-slate-600 tracking-wider">.{asset.file_type}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Status: {asset.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`${isSelected ? 'text-teal-400' : 'text-slate-800'} transition-colors`}>
                                                {isSelected ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 border border-white/5 rounded-3xl bg-slate-900/20">
                                    <Database size={24} className="mx-auto text-slate-800 mb-3 opacity-20" />
                                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">No brand assets indexed yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button 
                            onClick={() => setBrandVaultOpen(false)}
                            className="flex-1 py-5 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/10 transition-all transform hover:-translate-y-1"
                        >
                            Sync {selectedAssetIds.length} Assets to Pipeline
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BrandVault;
