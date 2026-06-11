import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getAllFiches } from '../api/ficheAPI';
import { getAllUsers } from '../api/userAPI';
import { getMesTaches } from '../api/inspectionAPI';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Package, Users, CheckCircle,
    Clock, XCircle, TrendingUp, ArrowRight, Search
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition">
        <div className={`${bg} p-4 rounded-xl`}>
            <Icon size={24} className={color} />
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [fiches, setFiches] = useState([]);
    const [users, setUsers] = useState([]);
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.role === 'INSPECTEUR') {
                    const inspRes = await getMesTaches(user.id);
                    setInspections(inspRes.data);
                } else {
                    const fichesRes = await getAllFiches();
                    setFiches(fichesRes.data);
                    if (user?.role === 'ADMIN') {
                        const usersRes = await getAllUsers();
                        setUsers(usersRes.data);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const countByStatut = (statut) => fiches.filter(f => f.statut === statut).length;

    const statutColor = {
        EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
        APPROUVEE: 'bg-green-100 text-green-700',
        REJETEE: 'bg-red-100 text-red-700',
        PLACEE: 'bg-blue-100 text-blue-700',
        DEDOUANEE: 'bg-purple-100 text-purple-700',
        LIBEREE: 'bg-gray-100 text-gray-700',
    };

    const renderStats = () => {
        switch (user?.role) {
            case 'ADMIN':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        <StatCard title="Total Fiches" value={fiches.length} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard title="En Attente" value={countByStatut('EN_ATTENTE')} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
                        <StatCard title="Approuvées" value={countByStatut('APPROUVEE')} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                        <StatCard title="Utilisateurs" value={users.length} icon={Users} color="text-purple-600" bg="bg-purple-50" />
                    </div>
                );
            case 'IMPORTATEUR':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <StatCard title="Mes Fiches" value={fiches.filter(f => f.importateurId === user.id).length} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard title="En Attente" value={countByStatut('EN_ATTENTE')} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
                        <StatCard title="Approuvées" value={countByStatut('APPROUVEE')} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                    </div>
                );
            case 'ADII':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <StatCard title="Total Fiches" value={fiches.length} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard title="À Valider" value={countByStatut('EN_ATTENTE')} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
                        <StatCard title="Validées" value={countByStatut('APPROUVEE')} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                    </div>
                );
            case 'OPERATEUR':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <StatCard title="Fiches Approuvées" value={countByStatut('APPROUVEE')} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                        <StatCard title="Placées" value={countByStatut('PLACEE')} icon={Package} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard title="Dédouanées" value={countByStatut('DEDOUANEE')} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
                    </div>
                );
            case 'INSPECTEUR':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <StatCard title="Inspections Assignées" value={inspections.length} icon={Search} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard title="Complétées" value={inspections.filter(i => i.resultat !== null).length} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Dashboard" />
                <div className="p-6">

                    {/* Welcome */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white">
                        <h2 className="text-2xl font-bold">
                            Bonjour, {user?.nom || user?.email} 👋
                        </h2>
                        <p className="text-blue-200 mt-1">
                            Bienvenue sur le système de suivi portuaire
                        </p>
                    </div>

                    {/* Stats */}
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : renderStats()}

                    {/* Recent Fiches — hidden for INSPECTEUR */}
                    {user?.role !== 'INSPECTEUR' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-gray-800 text-lg">Fiches Récentes</h3>
                                <button
                                    onClick={() => navigate('/fiches')}
                                    className="flex items-center gap-1 text-blue-600 text-sm hover:underline font-medium"
                                >
                                    Voir tout <ArrowRight size={16} />
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">ID</th>
                                        <th className="px-5 py-3 text-left font-semibold">Importateur</th>
                                        <th className="px-5 py-3 text-left font-semibold">Statut</th>
                                        <th className="px-5 py-3 text-left font-semibold">Date</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {fiches.slice(0, 5).map(f => (
                                        <tr
                                            key={f.id}
                                            className="hover:bg-gray-50 cursor-pointer transition"
                                            onClick={() => navigate(`/fiches/${f.id}`)}
                                        >
                                            <td className="px-5 py-3.5 font-medium text-gray-700">#{f.id}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{f.importateurNom}</td>
                                            <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutColor[f.statut]}`}>
                          {f.statut}
                        </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500">
                                                {f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {fiches.length === 0 && (
                                    <div className="text-center py-12">
                                        <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">Aucune fiche pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Inspections — only for INSPECTEUR */}
                    {user?.role === 'INSPECTEUR' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-gray-800 text-lg">Mes Inspections</h3>
                                <button
                                    onClick={() => navigate('/inspections')}
                                    className="flex items-center gap-1 text-blue-600 text-sm hover:underline font-medium"
                                >
                                    Voir tout <ArrowRight size={16} />
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold">ID</th>
                                        <th className="px-5 py-3 text-left font-semibold">Conteneur</th>
                                        <th className="px-5 py-3 text-left font-semibold">Organisme</th>
                                        <th className="px-5 py-3 text-left font-semibold">Résultat</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {inspections.slice(0, 5).map(i => (
                                        <tr key={i.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3.5 font-medium text-gray-700">#{i.id}</td>
                                            <td className="px-5 py-3.5 text-gray-600">#{i.conteneurId}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.organisme || '-'}</td>
                                            <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${i.resultat === 'CONFORME' ? 'bg-green-100 text-green-700' : i.resultat === 'NON_CONFORME' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {i.resultat || 'EN ATTENTE'}
                                            </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                {inspections.length === 0 && (
                                    <div className="text-center py-12">
                                        <Search size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">Aucune inspection assignée</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;