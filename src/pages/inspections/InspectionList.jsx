import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getMesTaches, enregistrerResultat, createInspection, getAllInspections } from '../../api/inspectionAPI';
import { getAllFiches } from '../../api/ficheAPI';
import { getConteneursByFiche } from '../../api/conteneurAPI';
import { getAllUsers } from '../../api/userAPI';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const resultatConfig = {
    CONFORME:     { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
    NON_CONFORME: { color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const InspectionList = () => {
    const { user } = useAuth();
    const navigate  = useNavigate();

    const [inspections, setInspections]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [fiches, setFiches]             = useState([]);
    const [inspecteurs, setInspecteurs]   = useState([]);
    const [conteneurs, setConteneurs]     = useState([]);
    const [selectedFiche, setSelectedFiche] = useState('');
    const [form, setForm]                 = useState({ conteneurId: '', organisme: '', inspecteurId: '' });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [commentModal, setCommentModal] = useState(null);
    const [comment, setComment]           = useState('');
    const [submitting, setSubmitting]     = useState(false);

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        fetchInspections();
        if (isAdmin) {
            getAllFiches().then(data => setFiches(Array.isArray(data) ? data : [])).catch(() => {});
            getAllUsers().then(data => {
                const all = Array.isArray(data) ? data : [];
                setInspecteurs(all.filter(u => u.role === 'INSPECTEUR'));
            }).catch(() => {});
        }
    }, [user]);

    const fetchInspections = async () => {
        try {
            setLoading(true);
            let data;
            if (isAdmin) {
                data = await getAllInspections();
            } else {
                data = await getMesTaches(user.id);
            }
            setInspections(Array.isArray(data) ? data : []);
        } catch {
            setInspections([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFicheSelect = async (ficheId) => {
        setSelectedFiche(ficheId);
        if (ficheId) {
            try {
                const data = await getConteneursByFiche(ficheId);
                setConteneurs(Array.isArray(data) ? data : []);
            } catch {
                setConteneurs([]);
            }
        }
    };

    const handleCreateInspection = async (e) => {
        e.preventDefault();
        if (!form.conteneurId || !form.organisme || !form.inspecteurId) return;
        try {
            setSubmitting(true);
            await createInspection(form.conteneurId, form.inspecteurId, form.organisme);
            setShowCreateForm(false);
            setForm({ conteneurId: '', organisme: '', inspecteurId: '' });
            setSelectedFiche('');
            fetchInspections();
        } catch {
            alert('Erreur lors de la création.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResult = async (id, resultat) => {
        try {
            setSubmitting(true);
            await enregistrerResultat(id, { resultat, commentaire: comment });
            setCommentModal(null);
            setComment('');
            fetchInspections();
        } catch {
            alert('Erreur lors de l\'enregistrement.');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingCount = inspections.filter(i => !i.resultat).length;
    const doneCount    = inspections.filter(i => i.resultat).length;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Inspections" />
                <div className="p-6">

                    {/* Stats for inspector */}
                    {user?.role === 'INSPECTEUR' && (
                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <Clock size={24} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">En attente</p>
                                    <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <CheckCircle size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Complétées</p>
                                    <p className="text-3xl font-bold text-gray-800">{doneCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending alert for inspector */}
                    {user?.role === 'INSPECTEUR' && pendingCount > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-yellow-700 font-medium">
                            <Clock size={16} />
                            {pendingCount} inspection(s) en attente de votre validation
                        </div>
                    )}

                    {/* Create form — ADMIN only */}
                    {isAdmin && (
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
                                            <select value={selectedFiche} onChange={(e) => handleFicheSelect(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner...</option>
                                                {fiches.map(f => (
                                                    <option key={f.id} value={f.id}>Fiche #{f.id} — {f.importateurNom}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Conteneur</label>
                                            <select value={form.conteneurId} onChange={(e) => setForm({ ...form, conteneurId: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner...</option>
                                                {conteneurs.map(c => (
                                                    <option key={c.id} value={c.id}>Conteneur #{c.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Inspecteur</label>
                                            <select value={form.inspecteurId} onChange={(e) => setForm({ ...form, inspecteurId: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner...</option>
                                                {inspecteurs.map(i => (
                                                    <option key={i.id} value={i.id}>{i.nom} — {i.organisme || i.email}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Organisme</label>
                                            <select value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Sélectionner...</option>
                                                <option value="ONSSA">ONSSA</option>
                                                <option value="AMSSNUR">AMSSNUR</option>
                                                <option value="ADII">ADII</option>
                                                <option value="AUTRES">Autres</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={submitting}
                                            className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                        {submitting ? <><Loader2 size={15} className="animate-spin" /> Création...</> : 'Créer l\'Inspection'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Table */}
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
                                <tr key={i.id} className="hover:bg-gray-50 cursor-pointer transition"
                                    onClick={() => navigate(`/inspections/${i.id}`)}>
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
                                        {!i.resultat && (user?.role === 'INSPECTEUR' || user?.role === 'ADMIN') && (
                                            <button onClick={() => setCommentModal(i.id)}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm">
                                                <Search size={14} /> Enregistrer
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

                {/* Result Modal */}
                {commentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                            <h3 className="font-bold text-gray-800 text-lg mb-4">Enregistrer Résultat</h3>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                                      placeholder="Commentaire optionnel..."
                                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none mb-4" />
                            <div className="flex gap-3">
                                <button onClick={() => { setCommentModal(null); setComment(''); }}
                                        className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm">
                                    Annuler
                                </button>
                                <button onClick={() => handleResult(commentModal, 'CONFORME')} disabled={submitting}
                                        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={16} />} Conforme
                                </button>
                                <button onClick={() => handleResult(commentModal, 'NON_CONFORME')} disabled={submitting}
                                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={16} />} Non Conforme
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