import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export default function Signup() {
    const { setToken } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, full_name: name, org_name: orgName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create account');
            }

            // Immediately login
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
            
            const loginRes = await fetch('http://localhost:8080/api/v1/auth/login/access-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!loginRes.ok) {
                throw new Error('Signup successful, but auto-login failed. Please sign in manually.');
            }

            const loginData = await loginRes.json();
            setToken(loginData.access_token);
            navigate('/');
            
        } catch (err) {
            setError(err.message || 'Failed to signup');
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
                    Register <span className="text-teal-400">Node</span>
                </h2>
                <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Join the Autonomous Intelligence Swarm
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="glass-panel px-4 py-10 sm:px-10 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-50" />
                    <form className="space-y-6" onSubmit={handleSignup}>
                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Full Name
                            </label>
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Commander Shepard"
                                className="bg-slate-900/50 border-white/5 text-white h-14 rounded-2xl focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Organization Name
                            </label>
                            <Input
                                type="text"
                                required
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="e.g. SettleMate"
                                className="bg-slate-900/50 border-white/5 text-white h-14 rounded-2xl focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Work Email
                            </label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@organization.com"
                                className="bg-slate-900/50 border-white/5 text-white h-14 rounded-2xl focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                New Key (Password)
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

                        <Button type="submit" variant="primary" className="w-full h-16 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/10 transition-all transform hover:-translate-y-1" disabled={loading}>
                            {loading ? 'Registering...' : 'Provision Account'}
                        </Button>
                    </form>
                    
                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Authorized Already? <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors">Sign In Hub</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
