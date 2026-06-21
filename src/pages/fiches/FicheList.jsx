import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FileText, Clock, CheckCircle, XCircle, Package,
    Plus, Loader2, AlertCircle, Search
} from 'lucide-react';
import { getAllFiches, getMesFiches } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

const STATUT_CONFIG = {
    EN_ATTENTE: { label: 'En Attente', color: 'bg-yellow-100 text-yellow-700',   icon: Clock },
    APPROUVEE:  { label: 'Approuvée',  color: 'bg-green-100 text-green-700',     icon: CheckCircle },
    REJETEE:    { label: 'Rejetée',    color: 'bg-red-100 text-red-700',         icon: XCircle },
    PLACEE:     { label: 'Placée',     color: 'bg-purple-100 text-purple-700',   icon: Package },
    DEDOUANEE:  { label: 'Dédouanée', color: 'bg-blue-100 text-blue-700',       icon: CheckCircle },
    LIBEREE:    { label: 'Libérée',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

const FILTRES_ALL       = ['TOUS', 'EN_ATTENTE', 'APPROUVEE', 'REJETEE', 'PLACEE', 'DEDOUANEE', 'LIBEREE'];
const FILTRES_OPERATEUR = ['TOUS', 'APPROUVEE', 'PLACEE', 'DEDOUANEE'];

export default function FicheList() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { user }  = useAuth();

    const [fiches, setFiches]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [filtre, setFiltre]   = useState(location.state?.filtreStatut || 'TOUS');
    const [search, setSearch]   = useState('');

    const isOperateur = user?.role === 'OPERATEUR';
    const isAdmin      = user?.role === 'ADMIN';
    const FILTRES       = isOperateur ? FILTRES_OPERATEUR : FILTRES_ALL;

    useEffect(() => {
        if (user) fetchFiches();
    }, [user]);

    const fetchFiches = async () => {
        try {
            setLoading(true);
            setError(null);
            let data;
            if (user?.role === 'IMPORTATEUR') {
                data = await getMesFiches(user.id);
            } else {
                // ADMIN, ADII, OPERATEUR all get full list — filtering happens client-side
                data = await getAllFiches();
            }
            let all = Array.isArray(data) ? data : [];

            // Operator only sees APPROUVEE, PLACEE, DEDOUANEE
            if (isOperateur) {
                all = all.filter(f =>
                    f.statut === 'APPROUVEE' ||
                    f.statut === 'PLACEE'    ||
                    f.statut === 'DEDOUANEE'
                );
            }

            setFiches(all);
        } catch {
            setError('Impossible de charger les fiches.');
        } finally {
            setLoading(false);
        }
    };

    const fichesFiltrees = fiches.filter((f) => {
        const matchStatut = filtre === 'TOUS' || f.statut === filtre;
        const matchSearch = search === '' ||
            f.id.toString().includes(search) ||
            f.importateurNom?.toLowerCase().includes(search.toLowerCase());
        return matchStatut && matchSearch;
    });

    const countByStatut = (statut) => fiches.filter(f => f.statut === statut).length;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-MA', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });
    };

    const statsToShow = isOperateur
        ? ['APPROUVEE', 'PLACEE', 'DEDOUANEE']
        : ['EN_ATTENTE', 'APPROUVEE', 'REJETEE', 'PLACEE', 'DEDOUANEE', 'LIBEREE'];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Fiches Suiveuses" />
                <div className="p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Fiches Suiveuses</h1>
                            <p className="text-sm text-gray-400 mt-1">{fiches.length} fiche(s) au total</p>
                        </div>
                        {user?.role === 'IMPORTATEUR' && (
                            <button
                                onClick={() => navigate('/fiches/create')}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                            >
                                <Plus size={16} /> Nouvelle fiche
                            </button>
                        )}
                    </div>

                    {/* Admin info banner */}
                    {isAdmin && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm px-4 py-3 rounded-xl mb-5">
                            <FileText size={16} />
                            Vue administrateur — toutes les fiches du système, consultation uniquement.
                        </div>
                    )}

                    {/* Operator info banner */}
                    {isOperateur && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl mb-5">
                            <Package size={16} />
                            Affichage limité aux fiches nécessitant votre intervention (Approuvées, Placées, Dédouanées).
                        </div>
                    )}

                    {/* Stats */}
                    <div className={`grid gap-3 mb-6 ${isOperateur ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
                        {statsToShow.map((s) => {
                            const cfg = STATUT_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    onClick={() => setFiltre(filtre === s ? 'TOUS' : s)}
                                    className={`p-3 rounded-xl border text-center transition-all ${
                                        filtre === s
                                            ? 'border-blue-400 bg-blue-50 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                                >
                                    <p className="text-lg font-bold text-gray-800">{countByStatut(s)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search + filter */}
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par ID ou importateur..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                        <select
                            value={filtre}
                            onChange={(e) => setFiltre(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {FILTRES.map((f) => (
                                <option key={f} value={f}>
                                    {f === 'TOUS' ? 'Tous les statuts' : STATUT_CONFIG[f]?.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Alerts — only for non-operator, non-admin roles */}
                    {!isOperateur && !isAdmin && fiches.some(f => f.statut === 'REJETEE') && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                            <XCircle size={16} />
                            Vous avez {countByStatut('REJETEE')} fiche(s) rejetée(s). Cliquez dessus pour voir le motif.
                        </div>
                    )}
                    {!isOperateur && !isAdmin && fiches.some(f => f.statut === 'LIBEREE') && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl mb-4">
                            <CheckCircle size={16} />
                            🎉 Vous avez {countByStatut('LIBEREE')} fiche(s) libérée(s) — marchandise prête pour enlèvement !
                        </div>
                    )}

                    {/* Operator alert — fiches waiting for placement */}
                    {isOperateur && countByStatut('APPROUVEE') > 0 && (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3 rounded-xl mb-4">
                            <Package size={16} />
                            {countByStatut('APPROUVEE')} fiche(s) approuvée(s) en attente de placement — assignez un emplacement.
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-4 m-4 rounded-xl">
                                <AlertCircle size={18} /> {error}
                                <button onClick={fetchFiches} className="ml-auto text-blue-600 text-xs underline">Réessayer</button>
                            </div>
                        ) : fichesFiltrees.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Aucune fiche trouvée.</p>
                                {user?.role === 'IMPORTATEUR' && (
                                    <button onClick={() => navigate('/fiches/create')}
                                            className="mt-4 text-blue-600 text-sm font-medium hover:underline">
                                        + Créer votre première fiche
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    <span>ID</span>
                                    <span>Importateur</span>
                                    <span>Statut</span>
                                    <span>Date</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {fichesFiltrees.map((f) => {
                                        const cfg  = STATUT_CONFIG[f.statut] || {};
                                        const Icon = cfg.icon || FileText;
                                        return (
                                            <div key={f.id} onClick={() => navigate(`/fiches/${f.id}`)}
                                                 className="grid grid-cols-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-blue-600">#{f.id}</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 truncate">{f.importateurNom || '-'}</span>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${cfg.color}`}>
                                                    <Icon size={12} /> {cfg.label}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}