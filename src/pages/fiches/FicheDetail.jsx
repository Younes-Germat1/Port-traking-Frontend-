import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getFicheById, getFicheHistorique, updateFicheStatut } from '../../api/ficheAPI';
import { getMarchandisesByFiche } from '../../api/marchandiseAPI';
import { getDocumentsByFiche } from '../../api/documentAPI';
import { getConteneursByFiche, createConteneur, assignEmplacement } from '../../api/conteneurAPI';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Package, FileText, Clock, ArrowLeft, Download, History, MapPin, Loader } from 'lucide-react';

const FicheDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [fiche, setFiche] = useState(null);
    const [historique, setHistorique] = useState([]);
    const [marchandises, setMarchandises] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [conteneurs, setConteneurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    // Placement modal state
    const [showPlacementModal, setShowPlacementModal] = useState(false);
    const [placementLoading, setPlacementLoading] = useState(false);
    const [placementError, setPlacementError] = useState('');
    const [emplacement, setEmplacement] = useState({ zone: '', rangee: '', position: '', quai: '' });

    const fetchData = async () => {
        try {
            const [ficheRes, histRes, marcRes, docRes, contRes] = await Promise.all([
                getFicheById(id),
                getFicheHistorique(id),
                getMarchandisesByFiche(id),
                getDocumentsByFiche(id),
                getConteneursByFiche(id),
            ]);
            setFiche(ficheRes.data);
            setHistorique(histRes.data);
            setMarchandises(marcRes.data);
            setDocuments(docRes.data);
            setConteneurs(contRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleStatut = async (statut) => {
        await updateFicheStatut(id, { statut }, user.id);
        await fetchData();
        setShowRejectModal(false);
    };

    // Full placement flow: create conteneur → assign emplacement → update fiche status
    const handlePlacer = async () => {
        const { zone, rangee, position, quai } = emplacement;
        if (!zone || !rangee || !position || !quai) {
            setPlacementError('Tous les champs sont obligatoires.');
            return;
        }
        setPlacementLoading(true);
        setPlacementError('');
        try {
            // 1. Create the conteneur for this fiche
            const contRes = await createConteneur(id);
            const conteneurId = contRes.data.id;

            // 2. Assign the location
            await assignEmplacement(conteneurId, { zone, rangee, position, quai });

            // 3. Update fiche status to PLACEE
            await updateFicheStatut(id, { statut: 'PLACEE' }, user.id);

            // 4. Refresh data
            await fetchData();
            setShowPlacementModal(false);
            setEmplacement({ zone: '', rangee: '', position: '', quai: '' });
        } catch (err) {
            console.error(err);
            setPlacementError('Erreur lors de la mise en place. Vérifiez les données.');
        } finally {
            setPlacementLoading(false);
        }
    };

    const statutConfig = {
        EN_ATTENTE: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
        APPROUVEE: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
        REJETEE: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
        PLACEE: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package },
        DEDOUANEE: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
        LIBEREE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
    };

    const classificationConfig = {
        DANGEREUSE: 'bg-red-100 text-red-700',
        PERISSABLE: 'bg-orange-100 text-orange-700',
        FRAGILE: 'bg-yellow-100 text-yellow-700',
        STANDARD: 'bg-gray-100 text-gray-700',
    };

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        </div>
    );

    const StatutIcon = statutConfig[fiche?.statut]?.icon || Clock;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title={`Fiche #${id}`} />
                <div className="p-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <button onClick={() => navigate('/fiches')} className="p-2 hover:bg-gray-100 rounded-lg transition mt-1">
                                    <ArrowLeft size={18} className="text-gray-500" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Fiche Suiveuse #{fiche?.id}</h2>
                                    <p className="text-gray-500 mt-1">Importateur: <strong>{fiche?.importateurNom}</strong></p>
                                    <p className="text-gray-400 text-sm">
                                        Créée le {fiche?.createdAt ? new Date(fiche.createdAt).toLocaleDateString('fr-FR') : '-'}
                                    </p>
                                </div>
                            </div>
                            <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${statutConfig[fiche?.statut]?.color}`}>
                                <StatutIcon size={16} />
                                {fiche?.statut}
                            </span>
                        </div>

                        {/* ADII actions */}
                        {(user?.role === 'ADII' || user?.role === 'ADMIN') && fiche?.statut === 'EN_ATTENTE' && (
                            <div className="mt-5 pt-5 border-t border-gray-100 flex gap-3">
                                <button onClick={() => handleStatut('APPROUVEE')} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm">
                                    <CheckCircle size={16} /> Approuver
                                </button>
                                <button onClick={() => setShowRejectModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 font-medium text-sm">
                                    <XCircle size={16} /> Rejeter
                                </button>
                            </div>
                        )}

                        {/* OPERATEUR action — opens placement modal */}
                        {(user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && fiche?.statut === 'APPROUVEE' && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                                <button
                                    onClick={() => { setShowPlacementModal(true); setPlacementError(''); }}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm"
                                >
                                    <MapPin size={16} /> Assigner Emplacement
                                </button>
                            </div>
                        )}

                        {/* ADMIN — liberate */}
                        {user?.role === 'ADMIN' && fiche?.statut === 'DEDOUANEE' && (
                            <div className="mt-5 pt-5 border-t border-gray-100">
                                <button onClick={() => handleStatut('LIBEREE')} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 font-medium text-sm">
                                    <CheckCircle size={16} /> Libérer
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content grid */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* Marchandises */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-blue-600" />
                                Marchandises ({marchandises.length})
                            </h3>
                            {marchandises.length > 0 ? (
                                <div className="space-y-3">
                                    {marchandises.map(m => (
                                        <div key={m.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${classificationConfig[m.classification]}`}>
                                                    {m.classification}
                                                </span>
                                                <span className="text-xs text-gray-500">SH: {m.codeSh || '-'}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-600">
                                                <span>⚖️ {m.poids || 0} kg</span>
                                                <span>📦 {m.volume || 0} m³</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-6">Aucune marchandise</p>
                            )}
                        </div>

                        {/* Documents */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" />
                                Documents ({documents.length})
                            </h3>
                            {documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex justify-between items-center border border-gray-100 rounded-xl p-3 bg-gray-50">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">{doc.type}</p>
                                                <p className="text-xs text-gray-400">
                                                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('fr-FR') : '-'}
                                                </p>
                                            </div>
                                            <a
                                                href={`http://localhost:8080/api/documents/${doc.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-blue-600 text-xs hover:text-blue-700 font-medium"
                                            >
                                                <Download size={14} /> Télécharger
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-6">Aucun document</p>
                            )}
                        </div>

                        {/* Conteneurs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={18} className="text-blue-600" />
                                Conteneurs ({conteneurs.length})
                            </h3>
                            {conteneurs.length > 0 ? (
                                <div className="space-y-2">
                                    {conteneurs.map(c => (
                                        <div key={c.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-sm text-gray-700">Conteneur #{c.id}</span>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                                                    {c.statut}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Zone: {c.zone || '-'} | Rangée: {c.rangee || '-'} | Position: {c.position || '-'} | Quai: {c.quai || '-'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-6">Aucun conteneur assigné</p>
                            )}
                        </div>

                        {/* Historique */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <History size={18} className="text-blue-600" />
                                Historique ({historique.length})
                            </h3>
                            <div className="space-y-3">
                                {historique.map(h => (
                                    <div key={h.id} className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">{h.action}</p>
                                            <p className="text-xs text-gray-500">{h.details}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {h.timestamp ? new Date(h.timestamp).toLocaleString('fr-FR') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {historique.length === 0 && (
                                    <p className="text-gray-400 text-sm text-center py-6">Aucun historique</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                            <h3 className="font-bold text-gray-800 text-lg mb-4">Motif de Rejet</h3>
                            <textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Expliquez le motif du rejet..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowRejectModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium">
                                    Annuler
                                </button>
                                <button onClick={() => handleStatut('REJETEE')} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-medium">
                                    Confirmer le Rejet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placement Modal */}
                {showPlacementModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <MapPin size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Assigner Emplacement</h3>
                                    <p className="text-gray-400 text-sm">Fiche #{id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'zone', label: 'Zone', placeholder: 'ex: A' },
                                    { key: 'rangee', label: 'Rangée', placeholder: 'ex: 12' },
                                    { key: 'position', label: 'Position', placeholder: 'ex: 05' },
                                    { key: 'quai', label: 'Quai', placeholder: 'ex: Q3' },
                                ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                                        <input
                                            type="text"
                                            placeholder={placeholder}
                                            value={emplacement[key]}
                                            onChange={e => setEmplacement(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {placementError && (
                                <p className="text-red-500 text-xs mt-3 bg-red-50 px-3 py-2 rounded-lg">{placementError}</p>
                            )}

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setShowPlacementModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handlePlacer}
                                    disabled={placementLoading}
                                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {placementLoading ? (
                                        <><Loader size={15} className="animate-spin" /> En cours...</>
                                    ) : (
                                        <><MapPin size={15} /> Confirmer</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FicheDetail;