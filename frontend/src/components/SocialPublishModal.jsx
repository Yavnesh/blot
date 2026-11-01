import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, CheckCircle2, AlertCircle, X, Send, Linkedin, Twitter, Facebook, Instagram, Globe } from 'lucide-react';

export default function SocialPublishModal({ isOpen, onClose, postId, postTitle, postPlatform }) {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
        }
    }, [isOpen]);

    const fetchAccounts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8080/api/v1/social/accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
                if (data.length > 0) {
                    // Try to pre-select account matching postPlatform
                    const matching = data.find(a => a.platform.toLowerCase() === postPlatform?.toLowerCase());
                    setSelectedAccountId(matching ? matching.id : data[0].id);
                }
            } else {
                setError('Failed to fetch social accounts.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedAccountId) return;
        setIsPublishing(true);
        setError(null);
        setStatusMessage(null);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8080/api/v1/social/publish/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    social_account_id: parseInt(selectedAccountId)
                })
            });

            if (res.ok) {
                const data = await res.json();
                setStatusMessage(`Successfully dispatched to ${data.platform}!`);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Publishing failed.');
            }
        } catch (err) {
            setError(err.message || 'Network error.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'linkedin': return <Linkedin size={16} className="text-blue-400" />;
            case 'twitter': return <Twitter size={16} className="text-sky-400" />;
            case 'facebook': return <Facebook size={16} className="text-indigo-400" />;
            case 'instagram': return <Instagram size={16} className="text-pink-400" />;
            default: return <Globe size={16} className="text-teal-400" />;
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Broadcast Post to Social Channel</h3>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{postTitle || `Post #${postId}`}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading connected social accounts...</div>
                    ) : accounts.length === 0 ? (
                        <div className="py-6 text-center">
                            <AlertCircle size={28} className="mx-auto text-amber-400 mb-2 opacity-80" />
                            <p className="text-xs text-slate-300 font-bold mb-1">No Connected Social Accounts</p>
                            <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                                An administrator must first connect an official LinkedIn, Twitter, or Meta account in System Integrations.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 my-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Target Publishing Channel
                            </label>
                            <div className="space-y-2">
                                {accounts.map((acc) => (
                                    <label 
                                        key={acc.id}
                                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                            selectedAccountId.toString() === acc.id.toString()
                                                ? 'bg-teal-500/10 border-teal-500 text-white'
                                                : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="social_account"
                                                value={acc.id}
                                                checked={selectedAccountId.toString() === acc.id.toString()}
                                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                                className="hidden"
                                            />
                                            {getPlatformIcon(acc.platform)}
                                            <div>
                                                <p className="text-xs font-bold text-white capitalize">{acc.platform}: {acc.account_name}</p>
                                                <p className="text-[9px] text-slate-500">ID: {acc.account_id}</p>
                                            </div>
                                        </div>
                                        {selectedAccountId.toString() === acc.id.toString() && (
                                            <CheckCircle2 size={16} className="text-teal-400" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-[11px] text-rose-400 mt-3 flex items-center gap-1.5">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}

                    {statusMessage && (
                        <p className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1.5 font-bold">
                            <CheckCircle2 size={14} /> {statusMessage}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Close
                        </button>
                        <button
                            disabled={isPublishing || accounts.length === 0}
                            onClick={handlePublish}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isPublishing ? 'Publishing...' : 'Dispatch Broadcast'}
                            <Send size={14} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
