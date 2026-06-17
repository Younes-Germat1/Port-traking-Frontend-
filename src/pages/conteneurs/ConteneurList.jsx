import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getConteneursByFiche, createConteneur } from '../../api/conteneurAPI';
import { getAllFiches } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, MapPin, Clock } from 'lucide-react';

const ConteneurList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conteneurs, setConteneurs] = useState([]);
    const [fiches, setFiches] = useState([]);
    const [selectedFiche, setSelectedFiche] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        getAllFiches().then(data => {
            let filtered = Array.isArray(data) ? data : [];
            if (user?.role === 'OPERATEUR') {
                filtered = filtered.filter(f => f.statut === 'APPROUVEE' || f.statut === 'PLACEE');
            }
            setFiches(filtered);
        }).catch(() => setFiches([]));
    }, [user]);

    const search = async (ficheId) => {
        if (!ficheId) return;
        setLoading(true);
        try {
            const data = await getConteneursByFiche(ficheId);
            setConteneurs(Array.isArray(data) ? data : []);
        } catch {
            setConteneurs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateConteneur = async () => {
        if (!selectedFiche) return;
        setCreating(true);
        try {
            await createConteneur(selectedFiche);
            search(selectedFiche);
        } finally {
            setCreating(false);
        }
    };

    const statutConfig = {
        ARRIVE:        { color: 'bg-blue-100 text-blue-700',   label: 'Arrivé' },
        STOCKE:        { color: 'bg-green-100 text-green-700', label: 'Stocké' },
        EN_INSPECTION: { color: 'bg-yellow-100 text-yellow-700', label: 'En Inspection' },
        CHARGEMENT:    { color: 'bg-purple-100 text-purple-700', label: 'Chargement' },
        PARTI:         { color: 'bg-gray-100 text-gray-700',   label: 'Parti' },
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Conteneurs" />
                <div className="p-6">

                    {/* Search */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold text-gray-800 mb-4">Rechercher par Fiche</h3>
                        <div className="flex gap-3">
                            <select
                                value={selectedFiche}
                                onChange={(e) => {
                                    setSelectedFiche(e.target.value);
                                    search(e.target.value);
                                }}
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Sélectionner une fiche...</option>
                                {fiches.map(f => (
                                    <option key={f.id} value={f.id}>
                                        Fiche #{f.id} — {f.importateurNom} ({f.statut})
                                    </option>
                                ))}
                            </select>
                            {(user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && selectedFiche && (
                                <button
                                    onClick={handleCreateConteneur}
                                    disabled={creating}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                >
                                    <Plus size={16} />
                                    {creating ? 'Ajout...' : 'Ajouter Conteneur'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Zone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Position</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Quai</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dwell Time</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : conteneurs.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-semibold text-gray-700">#{c.id}</td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statutConfig[c.statut]?.color}`}>
                                                {statutConfig[c.statut]?.label || c.statut}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{c.zone || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{c.position || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{c.quai || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Clock size={14} className="text-gray-400" />
                                            {c.dwellTimeHours != null ? `${c.dwellTimeHours}h` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => navigate(`/conteneurs/${c.id}`)}
                                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                        >
                                            <MapPin size={14} />
                                            Détails
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {!loading && conteneurs.length === 0 && (
                            <div className="text-center py-16">
                                <Package size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">
                                    {selectedFiche ? 'Aucun conteneur trouvé' : 'Sélectionnez une fiche pour voir les conteneurs'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConteneurList;