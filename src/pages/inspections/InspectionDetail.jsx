import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getInspectionById, enregistrerResultat } from '../../api/inspectionAPI';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, ArrowLeft, Search } from 'lucide-react';

const InspectionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        getInspectionById(id)
            .then(res => setInspection(res.data))
            .catch(() => setInspection(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleResult = async (resultat) => {
        await enregistrerResultat(id, { resultat, commentaire: comment });
        setShowModal(false);
        const res = await getInspectionById(id);
        setInspection(res.data);
    };

    const resultatColor = {
        CONFORME: 'bg-green-100 text-green-700',
        NON_CONFORME: 'bg-red-100 text-red-700',
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Détail Inspection" />
                <div className="p-6">

                    <button
                        onClick={() => navigate('/inspections')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Retour aux inspections
                    </button>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : !inspection ? (
                        <div className="text-center py-20 text-gray-400">Inspection introuvable.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Info Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 text-lg mb-5">Informations</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">ID</span>
                                        <span className="font-semibold text-gray-700">#{inspection.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">Conteneur</span>
                                        <span className="font-semibold text-gray-700">#{inspection.conteneurId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">Organisme</span>
                                        <span className="font-semibold text-gray-700">{inspection.organisme || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm">Date</span>
                                        <span className="font-semibold text-gray-700">
                                            {inspection.date ? new Date(inspection.date).toLocaleDateString('fr-FR') : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-sm">Résultat</span>
                                        {inspection.resultat ? (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${resultatColor[inspection.resultat]}`}>
                                                {inspection.resultat}
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                EN ATTENTE
                                            </span>
                                        )}
                                    </div>
                                    {inspection.commentaire && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 text-sm">Commentaire</span>
                                            <span className="font-semibold text-gray-700 text-right max-w-xs">{inspection.commentaire}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Card */}
                            {!inspection.resultat && (user?.role === 'INSPECTEUR' || user?.role === 'ADII' || user?.role === 'ADMIN') && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 text-lg mb-5">Enregistrer le Résultat</h3>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Commentaire optionnel..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none mb-4"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleResult('CONFORME')}
                                            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Conforme
                                        </button>
                                        <button
                                            onClick={() => handleResult('NON_CONFORME')}
                                            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16} /> Non Conforme
                                        </button>
                                    </div>
                                </div>
                            )}

                            {inspection.resultat && (
                                <div className={`rounded-2xl p-6 flex items-center gap-4 ${inspection.resultat === 'CONFORME' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                    {inspection.resultat === 'CONFORME'
                                        ? <CheckCircle size={40} className="text-green-500" />
                                        : <XCircle size={40} className="text-red-500" />
                                    }
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg">{inspection.resultat}</p>
                                        <p className="text-gray-500 text-sm mt-1">Inspection terminée</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InspectionDetail;