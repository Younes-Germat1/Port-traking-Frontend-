import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, XCircle, User, CheckCircle } from 'lucide-react';

const Login = () => {
    const [mode, setMode]                       = useState('login');
    const [email, setEmail]                     = useState('');
    const [password, setPassword]               = useState('');
    const [nom, setNom]                         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword]       = useState(false);
    const [error, setError]                     = useState('');
    const [success, setSuccess]                 = useState('');
    const [loading, setLoading]                 = useState(false);
    const { loginUser }                         = useAuth();
    const navigate                              = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await login({ email, password });
            loginUser({ id: res.data.id, email: res.data.email, role: res.data.role, nom: res.data.nom }, res.data.token);
            navigate('/dashboard');
        } catch {
            setError('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
        if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
        setLoading(true);
        try {
            await register({ nom, email, password }, 'IMPORTATEUR');
            setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
            setMode('login');
            setPassword(''); setNom(''); setConfirmPassword('');
        } catch {
            setError('Cet email est déjà utilisé ou une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Left Side */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-900 to-blue-700 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <img src="/logo_portnet_sa.png" alt="Portnet" className="h-26 brightness-0 invert" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Système de Suivi<br />Portuaire Digital
                    </h1>
                    <p className="text-blue-200 text-lg">Gérez vos conteneurs, marchandises et inspections en temps réel.</p>
                    <div className="mt-10 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Fiches Suiveuses', desc: 'Traçabilité complète' },
                            { label: 'Conteneurs',       desc: 'Suivi en temps réel' },
                            { label: 'Inspections',      desc: 'QR Code mobile' },
                            { label: 'Rapports',         desc: 'Export Excel/PDF' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/10 rounded-xl p-4">
                                <p className="text-white font-semibold text-sm">{item.label}</p>
                                <p className="text-blue-200 text-xs mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-blue-300 text-sm">© 2026 Port Tracking System — PFE</p>
            </div>

            {/* Right Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <img src="/logo_portnet_sa.png" alt="Portnet" className="h-18" />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
                            <XCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
                            <CheckCircle size={16} /> {success}
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="votre@email.ma" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="••••••••" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                <button type="submit" disabled={loading}
                                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition bg-white text-blue-600 shadow-sm flex items-center justify-center gap-2">
                                    {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> Connexion...</> : 'Connexion'}
                                </button>
                                <button type="button" onClick={() => switchMode('register')}
                                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition text-gray-500 hover:text-gray-700">
                                    Créer un compte
                                </button>
                            </div>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="Ex: Mohammed Alami" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="contact@societe.ma" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="Minimum 6 caractères" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                           className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                                           placeholder="Répétez votre mot de passe" required />
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
                                ℹ️ Seuls les importateurs peuvent créer un compte. Les autres rôles sont gérés par l'administrateur.
                            </div>
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                                <button type="button" onClick={() => switchMode('login')}
                                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition text-gray-500 hover:text-gray-700">
                                    Connexion
                                </button>
                                <button type="submit" disabled={loading}
                                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition bg-white text-blue-600 shadow-sm flex items-center justify-center gap-2">
                                    {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> Création...</> : 'Créer un compte'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;