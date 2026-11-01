import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            await axios.post('/api/v1/auth/forgot-password', { email });
            setIsSent(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset link');
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
                            <Sparkles className="text-teal-400 w-8 h-8" />
                        </div>
                    </div>

                    {!isSent ? (
                        <>
                            <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Recover Account</h2>
                            <p className="text-slate-500 text-xs text-center mb-8 uppercase tracking-widest font-black">Enter your email to receive a bionic reset link</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-14 bg-slate-950/50 border border-white/10 text-white pl-12 pr-4 rounded-xl focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-700"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl shadow-teal-500/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Reset Link'}
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
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Link Dispatched</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                If an account exists for <span className="text-white font-bold">{email}</span>, you'll receive instructions shortly.
                            </p>
                        </motion.div>
                    )}

                    <Link 
                        to="/login" 
                        className="flex items-center justify-center gap-2 mt-8 text-slate-600 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
