import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, Download, Upload, Clock, CheckCircle, XCircle,
    AlertCircle, Loader2, ChevronLeft, History, Package,
    MapPin, Phone, Tag, Weight, RefreshCw, Unlock, ChevronDown, Megaphone, Send
} from 'lucide-react';
import API from '../../api/axiosConfig';
import { getDocumentsByFiche, uploadDocument, downloadDocument } from '../../api/documentAPI';
import { sendAdminAlert } from '../../api/notificationAPI';
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

const TIMELINE_STEPS = [
    { key: 'EN_ATTENTE', label: 'Soumise' },
    { key: 'APPROUVEE',  label: 'Approuvée' },
    { key: 'PLACEE',     label: 'Placée' },
    { key: 'DEDOUANEE',  label: 'Dédouanée' },
    { key: 'LIBEREE',    label: 'Libérée' },
];
const STATUT_ORDER = { EN_ATTENTE: 0, APPROUVEE: 1, PLACEE: 2, DEDOUANEE: 3, LIBEREE: 4, REJETEE: -1 };

const ALERT_TARGETS = [
    { value: 'ADII',       label: 'Agent ADII' },
    { value: 'OPERATEUR',  label: 'Opérateur Portuaire' },
    { value: 'INSPECTEUR', label: 'Inspecteur' },
];

// ── Interactive Timeline Component ──
const FicheTimeline = ({ fiche, historique, formatDate, navigate }) => {
    const [expandedStep, setExpandedStep] = useState(null);
    const currentIndex = STATUT_ORDER[fiche?.statut] ?? 0;
    const isRejected = fiche?.statut === 'REJETEE';

    const getHistoFor = (statutKey) =>
        historique.find(h => h.details?.includes(statutKey) || h.action === (statutKey === 'EN_ATTENTE' ? 'CREATION' : null));

    const toggleStep = (key) => setExpandedStep(prev => prev === key ? null : key);

    if (isRejected) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                <h3 className="font-bold text-gray-800 mb-4">Suivi de la fiche</h3>
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">✕</div>
                    <div>
                        <p className="text-sm font-semibold text-red-700">Fiche rejetée</p>
                        <p className="text-xs text-red-400">Voir le motif ci-dessous et re-soumettez si nécessaire</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <h3 className="font-bold text-gray-800 mb-5">Suivi de la fiche</h3>

            <div className="flex items-center">
                {TIMELINE_STEPS.map((step, index) => {
                    const isDone    = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isClickable = isDone || isCurrent;
                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => isClickable && toggleStep(step.key)}
                                    disabled={!isClickable}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        isDone    ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' :
                                            isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 hover:bg-blue-700 cursor-pointer' :
                                                'bg-gray-100 text-gray-400 cursor-default'
                                    }`}
                                >
                                    {isDone ? '✓' : index + 1}
                                </button>
                                <p className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                                    isDone ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                    {step.label}
                                </p>
                            </div>
                            {index < TIMELINE_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 mb-5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Expanded panel */}
            {expandedStep && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                    {expandedStep === 'EN_ATTENTE' && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-yellow-800">📋 Fiche soumise</p>
                            <p className="text-xs text-gray-600">Date de soumission : {formatDate(fiche?.createdAt)}</p>
                            <p className="text-xs text-gray-600">
                                Marchandises déclarées : {fiche?.marchandises?.length || 0}
                            </p>
                            <p className="text-xs text-gray-600">
                                Organismes concernés : {fiche?.organismes?.join(', ') || '-'}
                            </p>
                        </div>
                    )}

                    {expandedStep === 'APPROUVEE' && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-green-800">✅ Validée par l'ADII</p>
                            <p className="text-xs text-gray-600">
                                {STATUT_ORDER[fiche?.statut] >= 1
                                    ? "Votre fiche a été approuvée et transmise à l'opérateur portuaire pour l'assignation d'un emplacement."
                                    : "En attente de validation."}
                            </p>
                        </div>
                    )}

                    {expandedStep === 'PLACEE' && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-purple-800">📦 Emplacement assigné</p>
                            {fiche?.conteneur ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <p>Zone : <span className="font-medium text-gray-800">{fiche.conteneur.zone || '-'}</span></p>
                                        <p>Rangée : <span className="font-medium text-gray-800">{fiche.conteneur.rangee || '-'}</span></p>
                                        <p>Position : <span className="font-medium text-gray-800">{fiche.conteneur.position || '-'}</span></p>
                                        <p>Quai : <span className="font-medium text-gray-800">{fiche.conteneur.quai || '-'}</span></p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/conteneurs/${fiche.conteneur.id}`)}
                                        className="text-xs text-purple-600 hover:underline mt-1"
                                    >
                                        Voir le détail du conteneur →
                                    </button>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500">Emplacement pas encore assigné.</p>
                            )}
                        </div>
                    )}

                    {expandedStep === 'DEDOUANEE' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-blue-800">🔍 Dédouanement</p>
                            <p className="text-xs text-gray-600">
                                {STATUT_ORDER[fiche?.statut] >= 3
                                    ? "Toutes les inspections requises ont été validées par les organismes de contrôle."
                                    : "En attente des résultats d'inspection."}
                            </p>
                        </div>
                    )}

                    {expandedStep === 'LIBEREE' && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-emerald-800">🎉 Marchandise libérée</p>
                            <p className="text-xs text-gray-600">
                                {STATUT_ORDER[fiche?.statut] >= 4
                                    ? "Votre marchandise est prête pour l'enlèvement. Présentez-vous au port avec les documents nécessaires."
                                    : "En attente de libération."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Admin Alert Panel ──
const AdminAlertPanel = ({ ficheId }) => {
    const [open, setOpen]         = useState(false);
    const [targetRole, setTargetRole] = useState('OPERATEUR');
    const [message, setMessage]   = useState('');
    const [sending, setSending]   = useState(false);
    const [success, setSuccess]   = useState('');
    const [error, setError]       = useState('');

    const handleSend = async () => {
        if (!message.trim()) {
            setError('Veuillez écrire un message.');
            return;
        }
        try {
            setSending(true);
            setError('');
            const result = await sendAdminAlert(targetRole, message.trim(), ficheId);
            setSuccess(`Alerte envoyée à ${result.length} utilisateur(s).`);
            setMessage('');
            setTimeout(() => setSuccess(''), 4000);
        } catch {
            setError("Erreur lors de l'envoi de l'alerte.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mb-5 bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Megaphone size={18} className="text-indigo-600" /></div>
                    <span className="font-semibold text-gray-700 text-sm">Envoyer une alerte concernant cette fiche</span>
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                    {success && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle size={15} /> {success}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Destinataire</label>
                        <select
                            value={targetRole}
                            onChange={e => setTargetRole(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                            {ALERT_TARGETS.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Message</label>
                        <textarea
                            rows={2}
                            placeholder="Ex: Merci de prioriser cette fiche, le client attend une réponse urgente."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        {sending ? 'Envoi...' : "Envoyer l'alerte"}
                    </button>
                </div>
            )}
        </div>
    );
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

    const [selectedFile, setSelectedFile]   = useState(null);
    const [selectedType, setSelectedType]   = useState('FACTURE');
    const [uploading, setUploading]         = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError]     = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    const [showResubmit, setShowResubmit]       = useState(false);
    const [resubmitForm, setResubmitForm]       = useState({ nom: '', adresse: '', contact: '' });
    const [resubmitting, setResubmitting]       = useState(false);
    const [resubmitError, setResubmitError]     = useState(null);
    const [resubmitSuccess, setResubmitSuccess] = useState(false);

    const [motif, setMotif]             = useState('');
    const [adiiLoading, setAdiiLoading] = useState(false);
    const [adiiError, setAdiiError]     = useState(null);
    const [adiiSuccess, setAdiiSuccess] = useState('');

    const [libereeLoading, setLibereeLoading] = useState(false);
    const [libereeError, setLibereeError]     = useState(null);
    const [libereeSuccess, setLibereeSuccess] = useState('');

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

    const handleAdiiAction = async (statut) => {
        if (statut === 'REJETEE' && !motif.trim()) {
            setAdiiError('Veuillez préciser un motif de rejet.');
            return;
        }
        try {
            setAdiiLoading(true);
            setAdiiError(null);
            await API.put(`/api/fiches/${id}/statut?acteurId=${user.id}`, { statut, motif: motif || null });
            setAdiiSuccess(statut === 'APPROUVEE' ? 'Fiche approuvée avec succès !' : 'Fiche rejetée.');
            setMotif('');
            setTimeout(() => { setAdiiSuccess(''); fetchAll(); }, 2000);
        } catch {
            setAdiiError("Erreur lors de la mise à jour du statut.");
        } finally {
            setAdiiLoading(false);
        }
    };

    const handleLiberer = async () => {
        try {
            setLibereeLoading(true);
            setLibereeError(null);
            await API.put(`/api/fiches/${id}/statut?acteurId=${user.id}`, {
                statut: 'LIBEREE',
                motif: null,
            });
            setLibereeSuccess('Marchandise libérée avec succès !');
            setTimeout(() => { setLibereeSuccess(''); fetchAll(); }, 2000);
        } catch {
            setLibereeError("Erreur lors de la libération.");
        } finally {
            setLibereeLoading(false);
        }
    };

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
            setTimeout(() => { setResubmitSuccess(false); fetchAll(); }, 2000);
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

    const canUpload = user?.role === 'IMPORTATEUR' || user?.role === 'ADMIN';
    const statut    = STATUT_CONFIG[fiche?.statut] || {};
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
                                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
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

                            {/* Admin Alert Panel — admin only */}
                            {user?.role === 'ADMIN' && (
                                <AdminAlertPanel ficheId={fiche?.id} />
                            )}

                            {/* Interactive Timeline — IMPORTATEUR mainly, but visible to all */}
                            <FicheTimeline fiche={fiche} historique={historique} formatDate={formatDate} navigate={navigate} />

                            {/* ADII Actions — ADII only, NOT admin */}
                            {user?.role === 'ADII' && fiche?.statut === 'EN_ATTENTE' && (
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
                                    <textarea rows={2} placeholder="Motif (obligatoire en cas de rejet, optionnel pour approbation)"
                                              value={motif} onChange={e => setMotif(e.target.value)}
                                              className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none mb-3"
                                    />
                                    <div className="flex gap-3">
                                        <button onClick={() => handleAdiiAction('APPROUVEE')} disabled={adiiLoading}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                                            {adiiLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approuver
                                        </button>
                                        <button onClick={() => handleAdiiAction('REJETEE')} disabled={adiiLoading}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                                            {adiiLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Rejeter
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* DEDOUANEE visibility for operator */}
                            {fiche?.statut === 'DEDOUANEE' && (user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && (
                                <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                                    <CheckCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">🔍 Marchandise dédouanée</p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            Toutes les inspections sont passées. Vous pouvez maintenant libérer la marchandise.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* LIBEREE button for operator */}
                            {fiche?.statut === 'DEDOUANEE' && (user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && (
                                <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                    <p className="text-sm font-semibold text-emerald-800 mb-3">
                                        ✅ Toutes les inspections sont validées — libérez la marchandise
                                    </p>
                                    {libereeSuccess && (
                                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg mb-3">
                                            <CheckCircle size={15} /> {libereeSuccess}
                                        </div>
                                    )}
                                    {libereeError && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg mb-3">
                                            <AlertCircle size={15} /> {libereeError}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleLiberer}
                                        disabled={libereeLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                                    >
                                        {libereeLoading
                                            ? <><Loader2 size={15} className="animate-spin" /> Libération en cours...</>
                                            : <><Unlock size={15} /> Libérer la marchandise</>
                                        }
                                    </button>
                                </div>
                            )}

                            {/* Alerte Rejet */}
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
                                        {user?.role === 'IMPORTATEUR' && (
                                            <button onClick={() => setShowResubmit(!showResubmit)}
                                                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition shrink-0">
                                                <RefreshCw size={15} /> Re-soumettre
                                            </button>
                                        )}
                                    </div>

                                    {showResubmit && user?.role === 'IMPORTATEUR' && (
                                        <div className="mt-4 border-t border-red-200 pt-4 space-y-3">
                                            <p className="text-sm font-semibold text-red-700 mb-2">Corrigez vos informations et re-soumettez :</p>
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
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">Nom complet / Raison sociale *</label>
                                                <input type="text" value={resubmitForm.nom} onChange={e => setResubmitForm({ ...resubmitForm, nom: e.target.value })}
                                                       className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">Adresse *</label>
                                                <textarea rows={2} value={resubmitForm.adresse} onChange={e => setResubmitForm({ ...resubmitForm, adresse: e.target.value })}
                                                          className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 block">Contact *</label>
                                                <input type="text" value={resubmitForm.contact} onChange={e => setResubmitForm({ ...resubmitForm, contact: e.target.value })}
                                                       className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => setShowResubmit(false)}
                                                        className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition">
                                                    Annuler
                                                </button>
                                                <button onClick={handleResubmit} disabled={resubmitting}
                                                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                                                    {resubmitting ? <><Loader2 size={15} className="animate-spin" /> Envoi...</> : <><RefreshCw size={15} /> Confirmer re-soumission</>}
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
                                        <p className="text-sm text-emerald-600 mt-1">Toutes les inspections sont validées. Votre marchandise est prête pour l'enlèvement.</p>
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
                                    <button key={key} onClick={() => setActiveTab(key)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition
                                            ${activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
                                                                <Package size={15} className="text-blue-500" /> Marchandise {i + 1}
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
                                                <div><p className="text-xs text-gray-400 mb-0.5">Zone</p><p className="text-gray-700 font-medium">{fiche.conteneur.zone || '-'}</p></div>
                                                <div><p className="text-xs text-gray-400 mb-0.5">Rangée</p><p className="text-gray-700 font-medium">{fiche.conteneur.rangee || '-'}</p></div>
                                                <div><p className="text-xs text-gray-400 mb-0.5">Position</p><p className="text-gray-700 font-medium">{fiche.conteneur.position || '-'}</p></div>
                                                <div><p className="text-xs text-gray-400 mb-0.5">Quai</p><p className="text-gray-700 font-medium">{fiche.conteneur.quai || '-'}</p></div>
                                            </div>
                                            <button onClick={() => navigate(`/conteneurs/${fiche.conteneur.id}`)}
                                                    className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                Voir détail conteneur →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB : Documents */}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    {canUpload ? (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Upload size={16} className="text-blue-600" /> Ajouter un document
                                            </h3>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                    {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                                <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                                    <FileText size={15} className="text-gray-400" />
                                                    <span className="text-sm text-gray-500 truncate">
                                                        {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image)'}
                                                    </span>
                                                    <input id="file-input-detail" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                                           onChange={e => { setSelectedFile(e.target.files[0]); setUploadError(null); setUploadSuccess(false); }} />
                                                </label>
                                                <button onClick={handleUpload} disabled={uploading || !selectedFile}
                                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
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
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                                            <FileText size={15} className="text-gray-400" />
                                            Seul l'importateur peut ajouter des documents. Vous pouvez télécharger les documents existants.
                                        </div>
                                    )}

                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                        {documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <FileText size={36} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Aucun document disponible.</p>
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
                                                        <button onClick={() => handleDownload(doc)} disabled={downloadingId === doc.id}
                                                                className="flex items-center gap-1.5 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 disabled:opacity-50 transition">
                                                            {downloadingId === doc.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
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
                                                            ${h.details?.includes('REJETEE')   ? 'bg-red-100'     :
                                                            h.details?.includes('LIBEREE')   ? 'bg-emerald-100' :
                                                                h.details?.includes('APPROUVEE') ? 'bg-green-100'   :
                                                                    'bg-blue-100'}`}>
                                                            {h.details?.includes('REJETEE')
                                                                ? <XCircle size={15} className="text-red-500" />
                                                                : h.details?.includes('LIBEREE')
                                                                    ? <CheckCircle size={15} className="text-emerald-500" />
                                                                    : h.details?.includes('APPROUVEE')
                                                                        ? <CheckCircle size={15} className="text-green-500" />
                                                                        : <Clock size={15} className="text-blue-500" />}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <p className="text-sm font-medium text-gray-800">{h.details || h.action}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
                                                                {h.acteurNom && <span className="text-xs text-gray-400">· par {h.acteurNom}</span>}
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