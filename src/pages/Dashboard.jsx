import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getAllFiches } from '../api/ficheAPI';
import { getAllUsers } from '../api/userAPI';
import { getMesTaches } from '../api/inspectionAPI';
import { getConteneursByFiche, getDwellTime } from '../api/conteneurAPI';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Package, Users, CheckCircle,
    Clock, XCircle, TrendingUp, ArrowRight,
    Search, Bell
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, bg, subtitle, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition ${onClick ? 'cursor-pointer hover:border-blue-200' : ''}`}
    >
        <div className={`${bg} p-4 rounded-xl`}>
            <Icon size={24} className={color} />
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const formatDwellTime = (hours) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days} jour(s)`;
};

const getDwellColor = (hours) => {
    if (hours === null || hours === undefined) return 'text-gray-500';
    if (hours < 48)  return 'text-green-600';
    if (hours < 120) return 'text-yellow-600';
    return 'text-red-600';
};

const statutColor = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
    APPROUVEE:  'bg-green-100 text-green-700',
    REJETEE:    'bg-red-100 text-red-700',
    PLACEE:     'bg-blue-100 text-blue-700',
    DEDOUANEE:  'bg-purple-100 text-purple-700',
    LIBEREE:    'bg-emerald-100 text-emerald-700',
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [fiches, setFiches]         = useState([]);
    const [users, setUsers]           = useState([]);
    const [inspections, setInspections] = useState([]);
    const [conteneurs, setConteneurs] = useState([]);
    const [dwellTimes, setDwellTimes] = useState({}); // map conteneurId -> hours
    const [avgDwell, setAvgDwell]     = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (user?.role === 'INSPECTEUR') {
                    const inspRes = await getMesTaches(user.id);
                    setInspections(Array.isArray(inspRes) ? inspRes : []);
                } else {
                    const fichesRes = await getAllFiches();
                    const allFiches = Array.isArray(fichesRes) ? fichesRes : [];
                    setFiches(allFiches);

                    if (user?.role === 'IMPORTATEUR') {
                        try {
                            const myFiches = allFiches.filter(f => f.importateurId === user.id);

                            // Fetch conteneurs for each fiche
                            const conteneurResults = await Promise.all(
                                myFiches.map(f => getConteneursByFiche(f.id).catch(() => []))
                            );
                            const allMyConteneurs = conteneurResults.flat().filter(Boolean);
                            setConteneurs(allMyConteneurs);

                            // ✅ Fetch dwell time for each conteneur individually
                            if (allMyConteneurs.length > 0) {
                                const dwellResults = await Promise.all(
                                    allMyConteneurs.map(async c => {
                                        try {
                                            const d = await getDwellTime(c.id);
                                            return { id: c.id, hours: d };
                                        } catch {
                                            return { id: c.id, hours: null };
                                        }
                                    })
                                );

                                // Build map of conteneurId -> hours
                                const dwellMap = {};
                                dwellResults.forEach(r => { dwellMap[r.id] = r.hours; });
                                setDwellTimes(dwellMap);

                                // Calculate average
                                const validDwells = dwellResults
                                    .map(r => r.hours)
                                    .filter(d => d !== null && !isNaN(d));
                                if (validDwells.length > 0) {
                                    const avg = Math.round(validDwells.reduce((a, b) => a + b, 0) / validDwells.length);
                                    setAvgDwell(avg);
                                }
                            }
                        } catch { /* silent */ }
                    }

                    if (user?.role === 'ADMIN') {
                        const usersRes = await getAllUsers();
                        setUsers(Array.isArray(usersRes) ? usersRes : []);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    const countByStatut = (statut) => fiches.filter(f => f.statut === statut).length;
    const mesFiches = fiches.filter(f => f.importateurId === user?.id);

    const goToFiches = (statut = null) => {
        navigate('/fiches', { state: { filtreStatut: statut } });
    };

    const renderStats = () => {
        switch (user?.role) {
            case 'ADMIN':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        <StatCard title="Total Fiches"  value={fiches.length}                icon={FileText}    color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches()} />
                        <StatCard title="En Attente"    value={countByStatut('EN_ATTENTE')} icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" onClick={() => goToFiches('EN_ATTENTE')} />
                        <StatCard title="Approuvées"    value={countByStatut('APPROUVEE')}  icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                        <StatCard title="Utilisateurs"  value={users.length}                icon={Users}       color="text-purple-600" bg="bg-purple-50" onClick={() => navigate('/admin/users')} />
                    </div>
                );

            case 'IMPORTATEUR':
                return (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                            <StatCard
                                title="Mes Fiches"
                                value={mesFiches.length}
                                icon={FileText}
                                color="text-blue-600"
                                bg="bg-blue-50"
                                onClick={() => goToFiches()}
                            />
                            <StatCard
                                title="En Attente"
                                value={mesFiches.filter(f => f.statut === 'EN_ATTENTE').length}
                                icon={Clock}
                                color="text-yellow-600"
                                bg="bg-yellow-50"
                                onClick={() => goToFiches('EN_ATTENTE')}
                            />
                            <StatCard
                                title="Approuvées"
                                value={mesFiches.filter(f => f.statut === 'APPROUVEE').length}
                                icon={CheckCircle}
                                color="text-green-600"
                                bg="bg-green-50"
                                onClick={() => goToFiches('APPROUVEE')}
                            />
                            <StatCard
                                title="Rejetées"
                                value={mesFiches.filter(f => f.statut === 'REJETEE').length}
                                icon={XCircle}
                                color="text-red-600"
                                bg="bg-red-50"
                                onClick={() => goToFiches('REJETEE')}
                            />
                        </div>

                        {/* ✅ Each conteneur with its own dwell time */}
                        {conteneurs.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800">Mes Conteneurs & Dwell Time</h3>
                                    <button
                                        onClick={() => navigate('/conteneurs')}
                                        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                                    >
                                        Voir tout <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {conteneurs.map(c => {
                                        const hours = dwellTimes[c.id] ?? null;
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => navigate(`/conteneurs/${c.id}`)}
                                                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                                        <Package size={16} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">Conteneur #{c.id}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {c.zone || '-'} — {c.rangee || '-'} — {c.position || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${getDwellColor(hours)}`}>
                                                        {hours !== null ? formatDwellTime(hours) : '-'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {hours === null  ? 'Calcul...' :
                                                            hours < 48      ? '✅ Normal'  :
                                                                hours < 120     ? '⚠️ Long'   :
                                                                    '🔴 Critique'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Average dwell time at bottom */}
                                {avgDwell !== null && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-sm text-gray-500 font-medium">Dwell Time Moyen</span>
                                        <span className={`text-xl font-bold ${getDwellColor(avgDwell)}`}>
                                            {formatDwellTime(avgDwell)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-orange-50 p-3 rounded-xl">
                                            <Clock size={22} className="text-orange-500" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium">Dwell Time Moyen</p>
                                    </div>
                                    <p className="text-4xl font-bold text-gray-500">-</p>
                                    <p className="text-xs text-gray-400 mt-1">Aucun conteneur actif</p>
                                </div>
                                <div
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:border-blue-200 hover:shadow-md transition"
                                    onClick={() => navigate('/conteneurs')}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-blue-50 p-3 rounded-xl">
                                            <Package size={22} className="text-blue-500" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium">Mes Conteneurs</p>
                                    </div>
                                    <p className="text-4xl font-bold text-gray-800">0</p>
                                    <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                        <ArrowRight size={12} /> Cliquer pour voir les détails
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                );

            case 'ADII':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <StatCard title="Total Fiches" value={fiches.length}                icon={FileText}    color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches()} />
                        <StatCard title="À Valider"    value={countByStatut('EN_ATTENTE')} icon={Clock}       color="text-yellow-600" bg="bg-yellow-50" onClick={() => goToFiches('EN_ATTENTE')} />
                        <StatCard title="Validées"     value={countByStatut('APPROUVEE')}  icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                    </div>
                );

            case 'OPERATEUR':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                        <StatCard title="Approuvées"  value={countByStatut('APPROUVEE')} icon={CheckCircle} color="text-green-600"  bg="bg-green-50"  onClick={() => goToFiches('APPROUVEE')} />
                        <StatCard title="Placées"     value={countByStatut('PLACEE')}    icon={Package}     color="text-blue-600"   bg="bg-blue-50"   onClick={() => goToFiches('PLACEE')} />
                        <StatCard title="Dédouanées"  value={countByStatut('DEDOUANEE')} icon={TrendingUp}  color="text-purple-600" bg="bg-purple-50" onClick={() => goToFiches('DEDOUANEE')} />
                    </div>
                );

            case 'INSPECTEUR':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        <StatCard title="Inspections Assignées" value={inspections.length}                                  icon={Search}      color="text-blue-600"  bg="bg-blue-50"  onClick={() => navigate('/inspections')} />
                        <StatCard title="Complétées"            value={inspections.filter(i => i.resultat !== null).length} icon={CheckCircle} color="text-green-600" bg="bg-green-50" onClick={() => navigate('/inspections')} />
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
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">
                                Bonjour, {user?.nom || user?.email} 👋
                            </h2>
                            <p className="text-blue-200 mt-1">
                                Bienvenue sur le système de suivi portuaire
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative bg-white/20 hover:bg-white/30 p-3 rounded-xl transition"
                            >
                                <Bell size={22} className="text-white" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : renderStats()}

                    {/* Fiches récentes */}
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
                                    {(user?.role === 'IMPORTATEUR' ? mesFiches : fiches)
                                        .slice(0, 5)
                                        .map(f => (
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
                                {(user?.role === 'IMPORTATEUR' ? mesFiches : fiches).length === 0 && (
                                    <div className="text-center py-12">
                                        <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">Aucune fiche pour le moment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inspections récentes */}
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
                                        <tr
                                            key={i.id}
                                            className="hover:bg-gray-50 cursor-pointer transition"
                                            onClick={() => navigate(`/inspections/${i.id}`)}
                                        >
                                            <td className="px-5 py-3.5 font-medium text-gray-700">#{i.id}</td>
                                            <td className="px-5 py-3.5 text-gray-600">#{i.conteneurId}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.organisme || '-'}</td>
                                            <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        i.resultat === 'CONFORME'     ? 'bg-green-100 text-green-700'  :
                                                            i.resultat === 'NON_CONFORME' ? 'bg-red-100 text-red-700'     :
                                                                'bg-yellow-100 text-yellow-700'
                                                    }`}>
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