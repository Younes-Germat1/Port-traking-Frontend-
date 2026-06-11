import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, XCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await login({ email, password });
            loginUser({
                id: res.data.id,
                email: res.data.email,
                role: res.data.role,
                nom: res.data.nom
            }, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Left Side */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-900 to-blue-700 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <img src="/logo_portnet_sa.png" alt="Portnet" className="h-26 brightness-0 invert" />                </div>

                <div>
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Système de Suivi<br />Portuaire Digital
                    </h1>
                    <p className="text-blue-200 text-lg">
                        Gérez vos conteneurs, marchandises et inspections en temps réel.
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Fiches Suiveuses', desc: 'Traçabilité complète' },
                            { label: 'Conteneurs', desc: 'Suivi en temps réel' },
                            { label: 'Inspections', desc: 'QR Code mobile' },
                            { label: 'Rapports', desc: 'Export Excel/PDF' },
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

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h2>
                    <p className="text-gray-500 mb-8">Connectez-vous à votre compte</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <XCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-gray-50"
                                    placeholder="admin@port.ma"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-gray-50"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Connexion...
                                </>
                            ) : 'Se connecter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;