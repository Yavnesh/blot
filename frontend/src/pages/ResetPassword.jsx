import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            await axios.post('/api/v1/auth/reset-password', { 
                token, 
                new_password: password 
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.05),transparent_50%)]" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-panel p-10 border border-white/5 bg-slate-900/60 shadow-2xl backdrop-blur-xl rounded-3xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                            <Lock className="text-teal-400 w-8 h-8" />
                        </div>
                    </div>

                    {!isSuccess ? (
                        <>
                            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Set New Password</h2>
                            <p className="text-slate-500 text-xs text-center mb-8 uppercase tracking-widest font-black">Configure your new secure access credentials</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full h-14 bg-slate-950/50 border border-white/10 text-white pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-teal-500/20 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full h-14 bg-slate-950/50 border border-white/10 text-white pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-teal-500/20 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                                    >
                                        <AlertCircle size={14} />
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !!error}
                                    className="w-full h-14 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl shadow-teal-500/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Finalize Reset'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <CheckCircle2 className="text-teal-400 w-16 h-16 mx-auto mb-6" />
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Access Restored</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Your password has been successfully updated. Redirecting to login...
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
