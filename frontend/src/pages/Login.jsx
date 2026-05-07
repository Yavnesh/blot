import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const { setToken, token, user } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // If already logged in and user data is loaded, redirect away from login
    useEffect(() => {
        if (token && user) {
            navigate('/workspace'); // Redirect to high-impact workspace
        }
    }, [token, user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            console.log(`📡 Attempting login for ${email}...`);
            const response = await fetch('http://localhost:8080/api/v1/auth/login/access-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                console.warn("❌ Login failed:", data.detail);
                throw new Error(data.detail || 'Access Denied: Invalid Vector Identity');
            }

            const data = await response.json();
            console.log("🔑 Token received, initializing session...");
            
            // setToken in authStore will trigger fetchMe() automatically
            setToken(data.access_token);
            
            // Note: Navigation will happen via the useEffect above once user is populated
            
        } catch (err) {
            setError(err.message || 'Identity verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4 transform hover:rotate-12 transition-transform">
                    <i className="material-icons text-white text-2xl">auto_awesome</i>
                </div>
                <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-white leading-none">
                    Intelligence <span className="text-teal-400">Login</span>
                </h2>
                <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Bionic Workspace Orchestration Protocol
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="glass-panel px-4 py-10 sm:px-10 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-50" />
                    
                    <form className="space-y-8" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 animate-shake flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Vector Identity (Email)
                            </label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="commander@blot.ai"
                                autoFocus
                                className="bg-slate-900/50 border-white/5 text-white h-14 rounded-2xl focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Consensus Key (Password)
                            </label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-slate-900/50 border-white/5 text-white h-14 rounded-2xl focus:ring-teal-500/20"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-full h-16 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/10 transition-all transform hover:-translate-y-1 active:scale-[0.98]" 
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Decrypting Access...</span>
                                </div>
                            ) : 'Authenticate Access'}
                        </Button>
                    </form>
                    
                    <div className="mt-8 pt-8 border-t border-white/5 translate-y-2 flex flex-col gap-4">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-600 px-4">
                            <span>Status: Online</span>
                            <div className="w-1 h-1 rounded-full bg-teal-500" />
                            <span>Node: Localhost:8080</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                            New Command? <Link to="/signup" className="text-teal-400 hover:text-teal-300 transition-colors">Register Hub</Link>
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                            Lost Key? <Link to="/forgot-password" title="Forgot Password" className="text-slate-400 hover:text-white transition-colors">Recover Identity</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
