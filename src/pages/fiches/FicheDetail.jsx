import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, Download, Upload, Clock, CheckCircle, XCircle,
    AlertCircle, Loader2, ChevronLeft, History, Package,
    MapPin, Phone, Tag, Weight, RefreshCw
} from 'lucide-react';
import API from '../../api/axiosConfig';
import { getDocumentsByFiche, uploadDocument, downloadDocument } from '../../api/documentAPI';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

const DOCUMENT_TYPES = [
    { value: 'FACTURE',      label: 'Facture' },
    { value: 'CERTIFICAT',   label: 'Certificat' },
    { value: 'BON_COMMANDE', label: 'Bon de commande' },
    { value: 'DECLARATION',  label: 'Déclaration douanière' },
    { value: 'AUTRE',        label: 'Autre' },
];

const STATUT_CONFIG = {
    EN_ATTENTE: { label: 'En Attente',  color: 'bg-yellow-100 text-yellow-700',   icon: Clock },
    APPROUVEE:  { label: 'Approuvée',   color: 'bg-green-100 text-green-700',     icon: CheckCircle },
    REJETEE:    { label: 'Rejetée',     color: 'bg-red-100 text-red-700',         icon: XCircle },
    PLACEE:     { label: 'Placée',      color: 'bg-purple-100 text-purple-700',   icon: Package },
    DEDOUANEE:  { label: 'Dédouanée',   color: 'bg-blue-100 text-blue-700',       icon: CheckCircle },
    LIBEREE:    { label: 'Libérée',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

const CLASSIFICATION_COLORS = {
    STANDARD:   'bg-gray-100 text-gray-700',
    DANGEREUSE: 'bg-red-100 text-red-700',
    PERISSABLE: 'bg-yellow-100 text-yellow-700',
    FRAGILE:    'bg-blue-100 text-blue-700',
};

export default function FicheDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [fiche, setFiche]           = useState(null);
    const [historique, setHistorique] = useState([]);
    const [documents, setDocuments]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [activeTab, setActiveTab]   = useState('details');

    // Upload state
    const [selectedFile, setSelectedFile]   = useState(null);
    const [selectedType, setSelectedType]   = useState('FACTURE');
    const [uploading, setUploading]         = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError]     = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    // Re-submit state
    const [showResubmit, setShowResubmit]   = useState(false);
    const [resubmitForm, setResubmitForm]   = useState({ nom: '', adresse: '', contact: '' });
    const [resubmitting, setResubmitting]   = useState(false);
    const [resubmitError, setResubmitError] = useState(null);
    const [resubmitSuccess, setResubmitSuccess] = useState(false);

    // ADII action state
    const [motif, setMotif]           = useState('');
    const [adiiLoading, setAdiiLoading] = useState(false);
    const [adiiError, setAdiiError]   = useState(null);
    const [adiiSuccess, setAdiiSuccess] = useState('');

    useEffect(() => { fetchAll(); }, [id]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [ficheRes, historiqueRes, docsRes] = await Promise.all([
                API.get(`/api/fiches/${id}`),
                API.get(`/api/fiches/${id}/historique`),
                getDocumentsByFiche(id),
            ]);
            setFiche(ficheRes.data);
            setHistorique(historiqueRes.data);
            setDocuments(docsRes);

            setResubmitForm({
                nom:     ficheRes.data.importateurNom     || '',
                adresse: ficheRes.data.importateurAdresse || '',
                contact: ficheRes.data.importateurContact || '',
            });
        } catch {
            setError('Impossible de charger la fiche.');
        } finally {
            setLoading(false);
        }
    };

    const motifRejet = historique.find(
        h => h.action === 'CHANGEMENT_STATUT' && h.details?.includes('REJETEE')
    )?.details || null;

    // ✅ ADII approve/reject
    const handleAdiiAction = async (statut) => {
        if (statut === 'REJETEE' && !motif.trim()) {
            setAdiiError('Veuillez préciser un motif de rejet.');
            return;
        }
        try {
            setAdiiLoading(true);
            setAdiiError(null);
            await API.put(`/api/fiches/${id}/statut`, {
                statut,
                motif: motif || null,
            });
            setAdiiSuccess(statut === 'APPROUVEE' ? 'Fiche approuvée avec succès !' : 'Fiche rejetée.');
            setMotif('');
            setTimeout(() => {
                setAdiiSuccess('');
                fetchAll();
            }, 2000);
        } catch {
            setAdiiError("Erreur lors de la mise à jour du statut.");
        } finally {
            setAdiiLoading(false);
        }
    };

    // ✅ Re-submit handler
    const handleResubmit = async () => {
        if (!resubmitForm.nom.trim() || !resubmitForm.adresse.trim() || !resubmitForm.contact.trim()) {
            setResubmitError('Tous les champs sont obligatoires.');
            return;
        }
        try {
            setResubmitting(true);
            setResubmitError(null);
            await API.put(`/api/fiches/${id}/resoumission`, {
                importateurNom:     resubmitForm.nom,
                importateurAdresse: resubmitForm.adresse,
                importateurContact: resubmitForm.contact,
            });
            setResubmitSuccess(true);
            setShowResubmit(false);
            setTimeout(() => {
                setResubmitSuccess(false);
                fetchAll();
            }, 2000);
        } catch {
            setResubmitError('Erreur lors de la re-soumission. Veuillez réessayer.');
        } finally {
            setResubmitting(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) { setUploadError('Veuillez sélectionner un fichier.'); return; }
        try {
            setUploading(true);
            setUploadError(null);
            await uploadDocument(id, selectedType, selectedFile);
            setUploadSuccess(true);
            setSelectedFile(null);
            document.getElementById('file-input-detail').value = '';
            const docs = await getDocumentsByFiche(id);
            setDocuments(docs);
        } catch {
            setUploadError("Erreur lors de l'upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            setDownloadingId(doc.id);
            const fileName = doc.filePath?.split('/').pop() || `${doc.type}-${doc.id}`;
            await downloadDocument(doc.id, fileName);
        } catch {
            alert('Erreur lors du téléchargement.');
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-MA', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const statut = STATUT_CONFIG[fiche?.statut] || {};
    const StatutIcon = statut.icon || Clock;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title={`Fiche #${id}`} />
                <div className="max-w-4xl mx-auto p-6">

                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 size={36} className="animate-spin text-blue-500" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-lg">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {!loading && !error && fiche && (
                        <>
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Fiche #{fiche?.id}</h1>
                                    <p className="text-sm text-gray-400">Créée le {formatDate(fiche?.createdAt)}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statut.color}`}>
                                        <StatutIcon size={14} /> {statut.label}
                                    </span>
                                </div>
                            </div>

                            {/* ✅ ADII Actions — only shown when EN_ATTENTE and user is ADII or ADMIN */}
                            {(user?.role === 'ADII' || user?.role === 'ADMIN') && fiche?.statut === 'EN_ATTENTE' && (
                                <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <p className="text-sm font-semibold text-blue-800 mb-3">Action ADII — Décision sur la fiche</p>

                                    {adiiSuccess && (
                                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg mb-3">
                                            <CheckCircle size={15} /> {adiiSuccess}
                                        </div>
                                    )}
                                    {adiiError && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-3">
                                            <AlertCircle size={15} /> {adiiError}
                                        </div>
                                    )}

                                    <textarea
                                        rows={2}
                                        placeholder="Motif (obligatoire en cas de rejet, optionnel pour approbation)"
                                        value={motif}
                                        onChange={e => setMotif(e.target.value)}
                                        className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none mb-3"
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAdiiAction('APPROUVEE')}
                                            disabled={adiiLoading}
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                                        >
                                            {adiiLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                                            Approuver
                                        </button>
                                        <button
                                            onClick={() => handleAdiiAction('REJETEE')}
                                            disabled={adiiLoading}
                                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                                        >
                                            {adiiLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                                            Rejeter
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Alerte Rejet + Re-submit */}
                            {fiche?.statut === 'REJETEE' && (
                                <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex gap-3">
                                        <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-red-700">Fiche rejetée par l'ADII</p>
                                            <p className="text-sm text-red-600 mt-1">
                                                {motifRejet
                                                    ? motifRejet.replace('Statut changé à REJETEE', '').trim() || 'Aucun motif précisé.'
                                                    : 'Aucun motif précisé.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowResubmit(!showResubmit)}
                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition shrink-0"
                                        >
                                            <RefreshCw size={15} />
                                            Re-soumettre
                                        </button>
                                    </div>

                                    {showResubmit && (
                                        <div className="mt-4 border-t border-red-200 pt-4 space-y-3">
                                            <p className="text-sm font-semibold text-red-700 mb-2">
                                                Corrigez vos informations et re-soumettez :
                                            </p>

                                            {resubmitSuccess && (
                                                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                                    <CheckCircle size={15} /> Fiche re-soumise avec succès !
                                                </div>
                                            )}
                                            {resubmitError && (
                                                <div className="flex items-center gap-2 text-red-500 text-sm bg-white px-3 py-2 rounded-lg">
                                                    <AlertCircle size={15} /> {resubmitError}
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                                                    Nom complet / Raison sociale *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resubmitForm.nom}
                                                    onChange={e => setResubmitForm({ ...resubmitForm, nom: e.target.value })}
                                                    className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                                                    Adresse *
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={resubmitForm.adresse}
                                                    onChange={e => setResubmitForm({ ...resubmitForm, adresse: e.target.value })}
                                                    className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">
                                                    Contact *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resubmitForm.contact}
                                                    onChange={e => setResubmitForm({ ...resubmitForm, contact: e.target.value })}
                                                    className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => setShowResubmit(false)}
                                                    className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={handleResubmit}
                                                    disabled={resubmitting}
                                                    className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                                >
                                                    {resubmitting
                                                        ? <><Loader2 size={15} className="animate-spin" /> Envoi...</>
                                                        : <><RefreshCw size={15} /> Confirmer re-soumission</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Alerte Libération */}
                            {fiche?.statut === 'LIBEREE' && (
                                <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                                    <CheckCircle size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-700">🎉 Conteneur libéré !</p>
                                        <p className="text-sm text-emerald-600 mt-1">
                                            Toutes les inspections sont validées. Votre marchandise est prête pour l'enlèvement.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                                {[
                                    { key: 'details',    label: 'Détails',                         icon: FileText },
                                    { key: 'documents',  label: `Documents (${documents.length})`, icon: Upload },
                                    { key: 'historique', label: 'Historique',                      icon: History },
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition
                                            ${activeTab === key
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Icon size={15} /> {label}
                                    </button>
                                ))}
                            </div>

                            {/* TAB : Détails */}
                            {activeTab === 'details' && (
                                <div className="space-y-5">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="font-bold text-gray-800 mb-4">Informations Importateur</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Nom</p>
                                                <p className="text-sm font-medium text-gray-800">{fiche?.importateurNom || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Statut actuel</p>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statut.color}`}>
                                                    <StatutIcon size={12} /> {statut.label}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin size={15} className="text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Adresse</p>
                                                    <p className="text-sm text-gray-700">{fiche?.importateurAdresse || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Phone size={15} className="text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                                                    <p className="text-sm text-gray-700">{fiche?.importateurContact || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date de création</p>
                                                <p className="text-sm text-gray-700">{formatDate(fiche?.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dernière mise à jour</p>
                                                <p className="text-sm text-gray-700">{formatDate(fiche?.updatedAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {fiche?.marchandises?.length > 0 && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <h3 className="font-bold text-gray-800 mb-4">Marchandises</h3>
                                            <div className="space-y-4">
                                                {fiche.marchandises.map((m, i) => (
                                                    <div key={m.id || i} className="border border-gray-100 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="font-semibold text-gray-700 flex items-center gap-2">
                                                                <Package size={15} className="text-blue-500" />
                                                                Marchandise {i + 1}
                                                            </p>
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CLASSIFICATION_COLORS[m.classification] || 'bg-gray-100 text-gray-600'}`}>
                                                                {m.classification}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                                                                <p className="text-gray-700">{m.description || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 mb-0.5">Code SH</p>
                                                                <p className="text-gray-700">{m.codeSH || '-'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Weight size={13} className="text-gray-400" />
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
                                        </div>
                                    )}

                                    {fiche?.organismes?.length > 0 && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <h3 className="font-bold text-gray-800 mb-4">Organismes de contrôle</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {fiche.organismes.map((org, i) => (
                                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                        <Tag size={13} /> {org}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {fiche?.conteneur && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <h3 className="font-bold text-gray-800 mb-4">Conteneur assigné</h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Zone</p>
                                                    <p className="text-gray-700 font-medium">{fiche.conteneur.zone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Rangée</p>
                                                    <p className="text-gray-700 font-medium">{fiche.conteneur.rangee || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Position</p>
                                                    <p className="text-gray-700 font-medium">{fiche.conteneur.position || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-0.5">Quai</p>
                                                    <p className="text-gray-700 font-medium">{fiche.conteneur.quai || '-'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/conteneurs/${fiche.conteneur.id}`)}
                                                className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                Voir détail conteneur →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB : Documents */}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Upload size={16} className="text-blue-600" /> Ajouter un document
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <select
                                                value={selectedType}
                                                onChange={e => setSelectedType(e.target.value)}
                                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {DOCUMENT_TYPES.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>

                                            <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                                <FileText size={15} className="text-gray-400" />
                                                <span className="text-sm text-gray-500 truncate">
                                                    {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image)'}
                                                </span>
                                                <input
                                                    id="file-input-detail"
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="hidden"
                                                    onChange={e => { setSelectedFile(e.target.files[0]); setUploadError(null); setUploadSuccess(false); }}
                                                />
                                            </label>

                                            <button
                                                onClick={handleUpload}
                                                disabled={uploading || !selectedFile}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                            >
                                                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                                {uploading ? 'Envoi...' : 'Uploader'}
                                            </button>
                                        </div>

                                        {uploadSuccess && (
                                            <div className="mt-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                                <CheckCircle size={15} /> Document uploadé avec succès !
                                            </div>
                                        )}
                                        {uploadError && (
                                            <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                                                <AlertCircle size={15} /> {uploadError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                        {documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <FileText size={36} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Aucun document. Uploadez-en un ci-dessus.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {documents.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                                                <FileText size={17} className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">
                                                                    {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                                                                </p>
                                                                <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDownload(doc)}
                                                            disabled={downloadingId === doc.id}
                                                            className="flex items-center gap-1.5 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 disabled:opacity-50 transition"
                                                        >
                                                            {downloadingId === doc.id
                                                                ? <Loader2 size={13} className="animate-spin" />
                                                                : <Download size={13} />}
                                                            Télécharger
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB : Historique */}
                            {activeTab === 'historique' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                    {historique.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <History size={36} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Aucun historique disponible.</p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                                            <div className="space-y-4">
                                                {historique.map(h => (
                                                    <div key={h.id} className="flex gap-4 relative">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10
                                                            ${h.details?.includes('REJETEE')  ? 'bg-red-100'     :
                                                            h.details?.includes('LIBEREE')  ? 'bg-emerald-100' :
                                                                'bg-blue-100'}`}>
                                                            {h.details?.includes('REJETEE')
                                                                ? <XCircle size={15} className="text-red-500" />
                                                                : h.details?.includes('LIBEREE')
                                                                    ? <CheckCircle size={15} className="text-emerald-500" />
                                                                    : <Clock size={15} className="text-blue-500" />}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <p className="text-sm font-medium text-gray-800">{h.details || h.action}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
                                                                {h.acteurNom && (
                                                                    <span className="text-xs text-gray-400">· par {h.acteurNom}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}