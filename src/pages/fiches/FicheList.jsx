import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getAllFiches } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import { FileText, Plus, Eye, Filter } from 'lucide-react';

const FicheList = () => {
    const { user } = useAuth();
    const [fiches, setFiches] = useState([]);
    const [allFiches, setAllFiches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatut, setFilterStatut] = useState('');

    useEffect(() => {
        getAllFiches()
            .then(res => {
                let data = res.data;
                if (user?.role === 'IMPORTATEUR') {
                    data = data.filter(f => f.importateurId === user.id);
                } else if (user?.role === 'OPERATEUR') {
                    data = data.filter(f => ['APPROUVEE', 'PLACEE'].includes(f.statut));
                }
                // ADII sees ALL fiches (no filter) — they need to track approved/rejected too
                setAllFiches(data);
                setFiches(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Apply status filter
    useEffect(() => {
        if (filterStatut === '') {
            setFiches(allFiches);
        } else {
            setFiches(allFiches.filter(f => f.statut === filterStatut));
        }
    }, [filterStatut, allFiches]);

    const statutConfig = {
        EN_ATTENTE: { color: 'bg-yellow-100 text-yellow-700', label: 'En Attente' },
        APPROUVEE: { color: 'bg-green-100 text-green-700', label: 'Approuvée' },
        REJETEE: { color: 'bg-red-100 text-red-700', label: 'Rejetée' },
        PLACEE: { color: 'bg-blue-100 text-blue-700', label: 'Placée' },
        DEDOUANEE: { color: 'bg-purple-100 text-purple-700', label: 'Dédouanée' },
        LIBEREE: { color: 'bg-gray-100 text-gray-700', label: 'Libérée' },
    };

    const getTitle = () => {
        switch (user?.role) {
            case 'IMPORTATEUR': return 'Mes Fiches';
            case 'ADII': return 'Fiches Suiveuses';
            case 'OPERATEUR': return 'Fiches Approuvées';
            default: return 'Toutes les Fiches';
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Fiches Suiveuses" />
                <div className="p-6">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
                            <p className="text-gray-500 text-sm mt-1">{fiches.length} fiche(s) trouvée(s)</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status filter — shown for ADII and ADMIN */}
                            {(user?.role === 'ADII' || user?.role === 'ADMIN') && (
                                <div className="flex items-center gap-2">
                                    <Filter size={16} className="text-gray-400" />
                                    <select
                                        value={filterStatut}
                                        onChange={e => setFilterStatut(e.target.value)}
                                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tous les statuts</option>
                                        <option value="EN_ATTENTE">En Attente</option>
                                        <option value="APPROUVEE">Approuvée</option>
                                        <option value="REJETEE">Rejetée</option>
                                        <option value="PLACEE">Placée</option>
                                        <option value="DEDOUANEE">Dédouanée</option>
                                        <option value="LIBEREE">Libérée</option>
                                    </select>
                                </div>
                            )}
                            {user?.role === 'IMPORTATEUR' && (
                                <Link
                                    to="/fiches/create"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                                >
                                    <Plus size={18} />
                                    Nouvelle Fiche
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Importateur</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                {fiches.map(fiche => (
                                    <tr key={fiche.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-700">#{fiche.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    {fiche.importateurNom?.charAt(0)}
                                                </div>
                                                <span className="text-gray-700 font-medium">{fiche.importateurNom}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statutConfig[fiche.statut]?.color}`}>
                          {statutConfig[fiche.statut]?.label || fiche.statut}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {fiche.createdAt ? new Date(fiche.createdAt).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/fiches/${fiche.id}`}
                                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                <Eye size={15} />
                                                Voir Détails
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {fiches.length === 0 && (
                                <div className="text-center py-16">
                                    <FileText size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">Aucune fiche trouvée</p>
                                    {user?.role === 'IMPORTATEUR' && (
                                        <Link to="/fiches/create" className="text-blue-600 text-sm mt-2 hover:underline inline-block">
                                            Créer votre première fiche →
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FicheList;