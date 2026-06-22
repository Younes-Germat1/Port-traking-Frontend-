import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getInspectionById, enregistrerResultat, uploadPhotoInspection } from '../../api/inspectionAPI';
import { useAuth } from '../../context/AuthContext';
import {
    CheckCircle, XCircle, ArrowLeft,
    Package, MapPin, AlertTriangle, Loader2,
    Camera, Weight, FileText, X
} from 'lucide-react';

const CLASSIFICATION_COLORS = {
    STANDARD:   'bg-gray-100 text-gray-700',
    DANGEREUSE: 'bg-red-100 text-red-700',
    PERISSABLE: 'bg-orange-100 text-orange-700',
    FRAGILE:    'bg-blue-100 text-blue-700',
};

const PRIORITY_CONFIG = {
    CRITIQUE: { color: 'bg-red-100 text-red-700 border-red-200',         label: '🔴 Priorité Critique' },
    HAUTE:    { color: 'bg-orange-100 text-orange-700 border-orange-200', label: '🟠 Priorité Haute' },
    MOYENNE:  { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '🟡 Priorité Moyenne' },
    NORMALE:  { color: 'bg-gray-100 text-gray-600 border-gray-200',       label: '⚪ Priorité Normale' },
};

const InspectionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [inspection, setInspection] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [comment, setComment]       = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]       = useState('');
    const [error, setError]           = useState('');

    // Photo upload state
    const [photoFile, setPhotoFile]         = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoSuccess, setPhotoSuccess]   = useState('');
    const [photoError, setPhotoError]       = useState('');

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => { fetchData(); }, [id]);

    // Allow closing the lightbox with Escape
    useEffect(() => {
        if (!lightboxOpen) return;
        const onKeyDown = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getInspectionById(id);
            setInspection(res.data);
        } catch {
            setInspection(null);
        } finally {
            setLoading(false);
        }
    };

    const handleResult = async (resultat) => {
        try {
            setSubmitting(true);
            setError('');
            await enregistrerResultat(id, { resultat, commentaire: comment });
            setSuccess(resultat === 'CONFORME'
                ? '✅ Inspection validée comme conforme !'
                : '❌ Inspection marquée non conforme.');
            setComment('');
            await fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError("Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!photoFile) return;
        try {
            setUploadingPhoto(true);
            setPhotoError('');
            await uploadPhotoInspection(id, photoFile);
            setPhotoSuccess('Photo uploadée avec succès !');
            setPhotoFile(null);
            document.getElementById('photo-input').value = '';
            await fetchData();
            setTimeout(() => setPhotoSuccess(''), 3000);
        } catch {
            setPhotoError("Erreur lors de l'upload de la photo.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    // Use marchandises from inspection DTO directly
    const marchandises = inspection?.marchandises || [];
    const priority     = inspection?.priority || 'NORMALE';
    const priorityCfg  = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMALE;
    const photoUrl     = inspection?.photoPath ? `http://localhost:8080/${inspection.photoPath}` : null;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Détail Inspection" />
                <div className="p-6 max-w-5xl mx-auto">

                    <button onClick={() => navigate('/inspections')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium">
                        <ArrowLeft size={16} /> Retour aux inspections
                    </button>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : !inspection ? (
                        <div className="text-center py-20 text-gray-400">Inspection introuvable.</div>
                    ) : (
                        <div className="space-y-6">

                            {/* Header */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Inspection #{inspection.id}</h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Conteneur #{inspection.conteneurId} — Organisme: {inspection.organisme || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${priorityCfg.color}`}>
                                            {priorityCfg.label}
                                        </span>
                                        {inspection.resultat ? (
                                            <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                                                inspection.resultat === 'CONFORME'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {inspection.resultat === 'CONFORME' ? '✅ Conforme' : '❌ Non Conforme'}
                                            </span>
                                        ) : (
                                            <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-100 text-yellow-700">
                                                ⏳ En Attente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Inspection Info */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 mb-5">Informations Inspection</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'ID Inspection', value: `#${inspection.id}` },
                                            { label: 'Conteneur',     value: `#${inspection.conteneurId}` },
                                            { label: 'Organisme',     value: inspection.organisme || '-' },
                                            { label: 'Date',          value: inspection.date ? new Date(inspection.date).toLocaleDateString('fr-FR') : '-' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                                <span className="text-gray-500 text-sm">{label}</span>
                                                <span className="font-semibold text-gray-700">{value}</span>
                                            </div>
                                        ))}

                                        {inspection.commentaire && (
                                            <div className="pt-2">
                                                <p className="text-gray-500 text-sm mb-1">Commentaire</p>
                                                <p className="text-gray-700 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                                                    💬 {inspection.commentaire}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Photo — click to enlarge */}
                                    {photoUrl && (
                                        <div className="mt-5 pt-5 border-t border-gray-100">
                                            <p className="text-sm font-semibold text-gray-600 mb-3">📸 Photo d'inspection</p>
                                            <img
                                                src={photoUrl}
                                                alt="Photo inspection"
                                                onClick={() => setLightboxOpen(true)}
                                                className="w-full rounded-xl border border-gray-100 object-cover max-h-48 cursor-zoom-in hover:opacity-90 transition"
                                            />
                                            <p className="text-xs text-gray-400 mt-1.5">Cliquez sur la photo pour l'agrandir</p>
                                        </div>
                                    )}
                                </div>

                                {/* Marchandises */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 mb-5">Marchandises à inspecter</h3>

                                    {/* Priority alert */}
                                    {(priority === 'CRITIQUE' || priority === 'HAUTE') && (
                                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${
                                            priority === 'CRITIQUE'
                                                ? 'bg-red-50 border-red-200 text-red-700'
                                                : 'bg-orange-50 border-orange-200 text-orange-700'
                                        }`}>
                                            <AlertTriangle size={16} />
                                            <p className="text-sm font-semibold">
                                                {priority === 'CRITIQUE'
                                                    ? '⚠️ Marchandise dangereuse — précautions requises !'
                                                    : '⚠️ Marchandise périssable — inspection rapide requise !'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Marchandises list */}
                                    {marchandises.length > 0 ? (
                                        <div className="space-y-3">
                                            {marchandises.map((m, i) => (
                                                <div key={m.id || i} className="border border-gray-100 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                                                            <Package size={14} className="text-blue-500" />
                                                            Marchandise {i + 1}
                                                        </p>
                                                        {m.classification && (
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CLASSIFICATION_COLORS[m.classification] || 'bg-gray-100 text-gray-600'}`}>
                                                                {m.classification}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-0.5">Description</p>
                                                            <p className="text-gray-700">{m.description || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-0.5">Code SH</p>
                                                            <p className="text-gray-700">{m.codeSH || '-'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Weight size={12} className="text-gray-400" />
                                                            <div>
                                                                <p className="text-xs text-gray-400 mb-0.5">Poids</p>
                                                                <p className="text-gray-700">{m.poids ? `${m.poids} kg` : '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-0.5">Volume</p>
                                                            <p className="text-gray-700">{m.volume ? `${m.volume} m³` : '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <FileText size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Aucune marchandise disponible.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Photo Upload — inspecteur only, only while inspection is still pending */}
                            {user?.role === 'INSPECTEUR' && !inspection.resultat && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                                        <Camera size={18} className="text-blue-500" /> Ajouter une photo
                                    </h3>
                                    <div className="flex gap-3">
                                        <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                            <Camera size={16} className="text-gray-400" />
                                            <span className="text-sm text-gray-500 truncate">
                                                {photoFile ? photoFile.name : 'Choisir une photo (JPG, PNG)'}
                                            </span>
                                            <input id="photo-input" type="file" accept=".jpg,.jpeg,.png" className="hidden"
                                                   onChange={e => { setPhotoFile(e.target.files[0]); setPhotoError(''); }} />
                                        </label>
                                        <button onClick={handlePhotoUpload} disabled={uploadingPhoto || !photoFile}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition">
                                            {uploadingPhoto ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                                            {uploadingPhoto ? 'Upload...' : 'Uploader'}
                                        </button>
                                    </div>
                                    {photoSuccess && (
                                        <div className="mt-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                            <CheckCircle size={15} /> {photoSuccess}
                                        </div>
                                    )}
                                    {photoError && (
                                        <div className="mt-3 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                                            {photoError}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action section */}
                            {!inspection.resultat && user?.role === 'INSPECTEUR' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 mb-5">Enregistrer le Résultat</h3>
                                    {success && (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                                            <CheckCircle size={16} /> {success}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                                            {error}
                                        </div>
                                    )}
                                    <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                                              placeholder="Commentaire optionnel (observations, anomalies détectées...)"
                                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none mb-4" />
                                    <div className="flex gap-3">
                                        <button onClick={() => handleResult('CONFORME')} disabled={submitting}
                                                className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition">
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                            ✅ Conforme
                                        </button>
                                        <button onClick={() => handleResult('NON_CONFORME')} disabled={submitting}
                                                className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition">
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                            ❌ Non Conforme
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Already completed */}
                            {inspection.resultat && (
                                <div className={`rounded-2xl p-6 flex items-center gap-4 ${
                                    inspection.resultat === 'CONFORME'
                                        ? 'bg-green-50 border border-green-100'
                                        : 'bg-red-50 border border-red-100'
                                }`}>
                                    {inspection.resultat === 'CONFORME'
                                        ? <CheckCircle size={40} className="text-green-500 shrink-0" />
                                        : <XCircle size={40} className="text-red-500 shrink-0" />
                                    }
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg">
                                            {inspection.resultat === 'CONFORME' ? '✅ Inspection Conforme' : '❌ Non Conforme'}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">Inspection terminée — aucune modification possible.</p>
                                        {inspection.commentaire && (
                                            <p className="text-gray-600 text-sm mt-2 bg-white px-3 py-2 rounded-xl border border-gray-100">
                                                💬 {inspection.commentaire}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox overlay */}
            {lightboxOpen && photoUrl && (
                <div
                    onClick={() => setLightboxOpen(false)}
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 cursor-zoom-out"
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={photoUrl}
                        alt="Photo inspection agrandie"
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full rounded-xl shadow-2xl cursor-default"
                    />
                </div>
            )}
        </div>
    );
};

export default InspectionDetail;