import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getMesTaches, enregistrerResultat, createInspection, getAllInspections } from '../../api/inspectionAPI';
import { getAllFiches } from '../../api/ficheAPI';
import { getConteneursByFiche } from '../../api/conteneurAPI';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InspectionList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fiches, setFiches] = useState([]);
    const [inspecteurs, setInspecteurs] = useState([]);
    const [conteneurs, setConteneurs] = useState([]);
    const [selectedFiche, setSelectedFiche] = useState('');
    const [form, setForm] = useState({ conteneurId: '', organisme: '', inspecteurId: '' });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [commentModal, setCommentModal] = useState(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetchInspections();
        if (user?.role === 'ADII' || user?.role === 'ADMIN') {
            getAllFiches().then(res => setFiches(res.data));
            import('../../api/userAPI').then(({ getAllUsers }) => {
                getAllUsers().then(res => {
                    const insp = res.data.filter(u => u.role === 'INSPECTEUR');
                    setInspecteurs(insp);
                }).catch(() => {});
            }).catch(() => {});
        }
    }, []);

    const fetchInspections = async () => {
        try {
            let res;
            if (user?.role === 'ADMIN' || user?.role === 'ADII') {
                res = await getAllInspections();
            } else {
                res = await getMesTaches(user.id);
            }
            setInspections(res.data);
        } catch {
            setInspections([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFicheSelect = async (ficheId) => {
        setSelectedFiche(ficheId);
        if (ficheId) {
            const res = await getConteneursByFiche(ficheId);
            setConteneurs(res.data);
        }
    };

    const handleCreateInspection = async (e) => {
        e.preventDefault();
        await createInspection(form.conteneurId, form.inspecteurId || user.id, form.organisme);
        setShowCreateForm(false);
        setForm({ conteneurId: '', organisme: '', inspecteurId: '' });
        fetchInspections();
    };

    const handleResult = async (id, resultat) => {
        await enregistrerResultat(id, { resultat, commentaire: comment });
        setCommentModal(null);
        setComment('');
        fetchInspections();
    };

    const resultatConfig = {
        CONFORME: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
        NON_CONFORME: { color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Inspections" />
                <div className="p-6">

                    {(user?.role === 'ADII' || user?.role === 'ADMIN') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Créer une Inspection</h3>
                                <button
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    {showCreateForm ? 'Annuler' : 'Nouvelle Inspection'}
                                </button>
                            </div>

                            {showCreateForm && (
                                <form onSubmit={handleCreateInspection} className="mt-5 pt-5 border-t border-gray-100">
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Fiche</label>
                                            <select
                                                value={selectedFiche}
                                                onChange={(e) => handleFicheSelect(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {fiches.map(f => (
                                                    <option key={f.id} value={f.id}>Fiche #{f.id} — {f.importateurNom}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Conteneur</label>
                                            <select
                                                value={form.conteneurId}
                                                onChange={(e) => setForm({ ...form, conteneurId: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {conteneurs.map(c => (
                                                    <option key={c.id} value={c.id}>Conteneur #{c.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Inspecteur</label>
                                            <select
                                                value={form.inspecteurId}
                                                onChange={(e) => setForm({ ...form, inspecteurId: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner...</option>
                                                {inspecteurs.length > 0 ? inspecteurs.map(i => (
                                                    <option key={i.id} value={i.id}>{i.nom}</option>
                                                )) : (
                                                    <option value="3">Inspecteur Test</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Organisme</label>
                                            <select
                                                value={form.organisme}
                                                onChange={(e) => setForm({ ...form, organisme: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Sélectionner...</option>
                                                <option value="ADII">ADII</option>
                                                <option value="ONSSA">ONSSA</option>
                                                <option value="AMSSNUR">AMSSNUR</option>
                                                <option value="AUTRES">Autres</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm"
                                    >
                                        Créer l'Inspection
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Conteneur</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Organisme</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Résultat</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : inspections.map(i => (
                                <tr
                                    key={i.id}
                                    className="hover:bg-gray-50 cursor-pointer transition"
                                    onClick={() => navigate(`/inspections/${i.id}`)}
                                >
                                    <td className="px-6 py-4 font-semibold text-gray-700">#{i.id}</td>
                                    <td className="px-6 py-4 text-gray-600">#{i.conteneurId}</td>
                                    <td className="px-6 py-4 text-gray-600">{i.organisme || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {i.date ? new Date(i.date).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {i.resultat ? (
                                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${resultatConfig[i.resultat]?.color}`}>
                                                {i.resultat === 'CONFORME' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {i.resultat}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                <Clock size={12} /> EN ATTENTE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        {!i.resultat && (user?.role === 'INSPECTEUR' || user?.role === 'ADII' || user?.role === 'ADMIN') && (
                                            <button
                                                onClick={() => setCommentModal(i.id)}
                                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                <Search size={14} />
                                                Enregistrer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {!loading && inspections.length === 0 && (
                            <div className="text-center py-16">
                                <Search size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Aucune inspection trouvée</p>
                            </div>
                        )}
                    </div>
                </div>

                {commentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                            <h3 className="font-bold text-gray-800 text-lg mb-4">Enregistrer Résultat</h3>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Commentaire optionnel..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCommentModal(null)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleResult(commentModal, 'CONFORME')}
                                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> Conforme
                                </button>
                                <button
                                    onClick={() => handleResult(commentModal, 'NON_CONFORME')}
                                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} /> Non Conforme
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InspectionList;