import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getConteneurById, assignEmplacement, getDwellTime, getManutentions, createManutention, deleteManutention } from '../../api/conteneurAPI';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, QrCode, ArrowLeft, CheckCircle, AlertCircle, Loader2, X, Truck, CalendarClock, AlertTriangle } from 'lucide-react';

const STATUT_CONFIG = {
    ARRIVE:        { color: 'bg-blue-100 text-blue-700 border-blue-200',      label: 'Arrivé' },
    STOCKE:        { color: 'bg-green-100 text-green-700 border-green-200',    label: 'Stocké' },
    EN_INSPECTION: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'En Inspection' },
    CHARGEMENT:    { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Chargement' },
    PARTI:         { color: 'bg-gray-100 text-gray-700 border-gray-200',       label: 'Parti' },
};

const PRIORITY_CONFIG = {
    CRITIQUE: { color: 'bg-red-100 text-red-700 border-red-200',         label: '🔴 Priorité Critique' },
    HAUTE:    { color: 'bg-orange-100 text-orange-700 border-orange-200', label: '🟠 Priorité Haute' },
    MOYENNE:  { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '🟡 Priorité Moyenne' },
    NORMALE:  { color: 'bg-gray-100 text-gray-600 border-gray-200',       label: '⚪ Priorité Normale' },
};

const TYPE_MANUTENTION = [
    { value: 'CHARGEMENT',   label: '🚢 Chargement' },
    { value: 'DECHARGEMENT', label: '📦 Déchargement' },
    { value: 'TRANSFERT',    label: '🔄 Transfert' },
    { value: 'INSPECTION',   label: '🔍 Mise en inspection' },
];

const formatDwellTime = (hours) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days} jour(s)`;
};

const getDwellColor = (hours, warning, critique) => {
    if (hours === null || hours === undefined) return 'text-gray-500';
    if (hours < warning)  return 'text-green-600';
    if (hours < critique) return 'text-yellow-600';
    return 'text-red-600';
};

const getDwellLabel = (hours, warning, critique) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < warning)  return '✅ Délai normal';
    if (hours < critique) return '⚠️ Attention — délai long';
    return '🔴 Critique — action requise';
};

const getDwellBarColor = (hours, warning, critique) => {
    if (hours < warning)  return 'bg-green-500';
    if (hours < critique) return 'bg-yellow-500';
    return 'bg-red-500';
};

const ConteneurDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [conteneur, setConteneur] = useState(null);
    const [dwellTime, setDwellTime] = useState(null);
    const [form, setForm]           = useState({ zone: '', rangee: '', position: '', quai: '' });
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [success, setSuccess]     = useState('');
    const [error, setError]         = useState(null);
    const [showQR, setShowQR]       = useState(false);

    const [manutentionForm, setManutentionForm] = useState({
        type: 'CHARGEMENT', datePrevue: '', heurePrevue: '', responsable: '', notes: '',
    });
    const [manutentionList, setManutentionList]       = useState([]);
    const [savingManutention, setSavingManutention]   = useState(false);
    const [manutentionSuccess, setManutentionSuccess] = useState('');
    const [manutentionError, setManutentionError]     = useState('');

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [cont, dwell, manutentions] = await Promise.all([
                getConteneurById(id),
                getDwellTime(id),
                getManutentions(id),
            ]);
            setConteneur(cont);
            setDwellTime(dwell);
            setManutentionList(Array.isArray(manutentions) ? manutentions : []);
            setForm({
                zone:     cont.zone     || '',
                rangee:   cont.rangee   || '',
                position: cont.position || '',
                quai:     cont.quai     || '',
            });
        } catch {
            setError('Impossible de charger le conteneur.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updated = await assignEmplacement(id, form);
            setConteneur(updated);
            setSuccess('Emplacement assigné avec succès !');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError("Erreur lors de l'assignation.");
        } finally {
            setSaving(false);
        }
    };

    const handleManutention = async (e) => {
        e.preventDefault();
        if (!manutentionForm.datePrevue || !manutentionForm.heurePrevue) {
            setManutentionError("Veuillez renseigner la date et l'heure.");
            return;
        }
        setSavingManutention(true);
        setManutentionError('');
        try {
            const newOp = await createManutention(id, {
                type:        manutentionForm.type,
                datePrevue:  manutentionForm.datePrevue,
                heurePrevue: manutentionForm.heurePrevue,
                responsable: manutentionForm.responsable,
                notes:       manutentionForm.notes,
            });
            setManutentionList(prev => [...prev, newOp]);
            setManutentionForm({ type: 'CHARGEMENT', datePrevue: '', heurePrevue: '', responsable: '', notes: '' });
            setManutentionSuccess('Opération programmée avec succès !');
            setTimeout(() => setManutentionSuccess(''), 3000);
        } catch {
            setManutentionError("Erreur lors de la programmation.");
        } finally {
            setSavingManutention(false);
        }
    };

    const handleDeleteManutention = async (opId) => {
        try {
            await deleteManutention(opId);
            setManutentionList(prev => prev.filter(op => op.id !== opId));
        } catch {
            alert('Erreur lors de la suppression.');
        }
    };

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-blue-500" />
            </div>
        </div>
    );

    if (error && !conteneur) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex items-center justify-center">
                <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                    <AlertCircle size={18} /> {error}
                </div>
            </div>
        </div>
    );

    const cfg            = STATUT_CONFIG[conteneur?.statut] || {};
    const priority       = conteneur?.priority || 'NORMALE';
    const priorityCfg    = PRIORITY_CONFIG[priority];
    const warningThresh  = conteneur?.warningThreshold  || 72;
    const critiqueThresh = conteneur?.critiqueThreshold || 120;
    const qrUrl          = `http://localhost:8080/api/qrcode/${id}`;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title={`Conteneur #${id}`} />
                <div className="p-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <ArrowLeft size={18} className="text-gray-500" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Conteneur #{id}</h2>
                                    <p className="text-gray-400 text-sm">Fiche #{conteneur?.ficheId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${priorityCfg.color}`}>
                                    {priorityCfg.label}
                                </span>
                                <span className={`px-4 py-2 rounded-xl text-sm font-semibold border ${cfg.color}`}>
                                    {cfg.label || conteneur?.statut}
                                </span>
                            </div>
                        </div>

                        {/* Classifications */}
                        {conteneur?.classifications?.length > 0 && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50 flex-wrap">
                                <span className="text-xs text-gray-400 mt-1">Marchandises :</span>
                                {conteneur.classifications.map(c => (
                                    <span key={c} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        c === 'DANGEREUSE' ? 'bg-red-100 text-red-700' :
                                            c === 'PERISSABLE' ? 'bg-orange-100 text-orange-700' :
                                                c === 'FRAGILE'    ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                    }`}>
                                        {c === 'DANGEREUSE' ? '☢️ Dangereuse' :
                                            c === 'PERISSABLE' ? '🥩 Périssable' :
                                                c === 'FRAGILE'    ? '⚠️ Fragile' : '📦 Standard'}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Priority alert banner */}
                        {(priority === 'CRITIQUE' || priority === 'HAUTE') && dwellTime >= warningThresh && (
                            <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${
                                priority === 'CRITIQUE'
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-orange-50 border-orange-200 text-orange-700'
                            }`}>
                                <AlertTriangle size={18} />
                                <p className="text-sm font-semibold">
                                    {priority === 'CRITIQUE'
                                        ? '⚠️ Marchandise dangereuse — traitement urgent requis !'
                                        : '⚠️ Marchandise périssable — risque de détérioration !'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Infos + Dwell Time */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-5">Informations</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Zone',     value: conteneur?.zone },
                                    { label: 'Rangée',   value: conteneur?.rangee },
                                    { label: 'Position', value: conteneur?.position },
                                    { label: 'Quai',     value: conteneur?.quai },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <MapPin size={15} className="text-gray-400" /> {label}
                                        </div>
                                        <span className="font-semibold text-gray-700">{value || '-'}</span>
                                    </div>
                                ))}

                                {/* Dwell Time */}
                                <div className="flex justify-between items-center py-3 mt-2">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Clock size={15} className="text-gray-400" /> Dwell Time
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold text-2xl ${getDwellColor(dwellTime, warningThresh, critiqueThresh)}`}>
                                            {formatDwellTime(dwellTime)}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {getDwellLabel(dwellTime, warningThresh, critiqueThresh)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {dwellTime !== null && (
                                    <div className="mt-1">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>0h</span>
                                            <span>{warningThresh}h</span>
                                            <span>{critiqueThresh}h+</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${getDwellBarColor(dwellTime, warningThresh, critiqueThresh)}`}
                                                style={{ width: `${Math.min((dwellTime / critiqueThresh) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <p className="text-xs text-gray-400">
                                                Arrivé le {conteneur?.arrivedAt ? new Date(conteneur.arrivedAt).toLocaleDateString('fr-MA') : '-'}
                                            </p>
                                            <p className="text-xs text-gray-400">Seuil critique : {critiqueThresh}h</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QR Code */}
                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <button onClick={() => setShowQR(!showQR)}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 text-sm font-medium transition">
                                    {showQR ? <><X size={18} /> Fermer QR Code</> : <><QrCode size={18} /> Voir QR Code</>}
                                </button>
                                {showQR && (
                                    <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <img src={qrUrl} alt={`QR Code Conteneur #${id}`} className="w-48 h-48 rounded-lg" />
                                        <p className="text-xs text-gray-400">Conteneur #{id}</p>
                                        <a href={qrUrl} download={`qrcode-conteneur-${id}.png`} className="text-xs text-blue-600 hover:underline">Télécharger</a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assigner Emplacement */}
                        {(user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 mb-5">Assigner Emplacement</h3>
                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                                        <CheckCircle size={16} /> {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}
                                <form onSubmit={handleAssign} className="space-y-4">
                                    {[
                                        { field: 'zone',     label: 'Zone',     placeholder: 'ex: Zone A' },
                                        { field: 'rangee',   label: 'Rangée',   placeholder: 'ex: Rangée 12' },
                                        { field: 'position', label: 'Position', placeholder: 'ex: Position 5' },
                                        { field: 'quai',     label: 'Quai',     placeholder: 'ex: Quai 3' },
                                    ].map(({ field, label, placeholder }) => (
                                        <div key={field}>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">{label}</label>
                                            <input type="text" placeholder={placeholder} value={form[field]}
                                                   onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                                   className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                    ))}
                                    <button type="submit" disabled={saving}
                                            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 mt-2 transition">
                                        {saving ? <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</> : <><MapPin size={18} /> Assigner Emplacement</>}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Manutention Section */}
                    {(user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && (
                        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-50 rounded-xl"><Truck size={20} className="text-purple-600" /></div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Opérations de Manutention</h3>
                                    <p className="text-xs text-gray-400">Planifier les opérations de chargement / déchargement</p>
                                </div>
                            </div>

                            <form onSubmit={handleManutention} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Type d'opération</label>
                                    <select value={manutentionForm.type} onChange={(e) => setManutentionForm({ ...manutentionForm, type: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                                        {TYPE_MANUTENTION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Date prévue</label>
                                    <input type="date" value={manutentionForm.datePrevue}
                                           onChange={(e) => setManutentionForm({ ...manutentionForm, datePrevue: e.target.value })}
                                           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Heure prévue</label>
                                    <input type="time" value={manutentionForm.heurePrevue}
                                           onChange={(e) => setManutentionForm({ ...manutentionForm, heurePrevue: e.target.value })}
                                           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Responsable</label>
                                    <input type="text" placeholder="ex: Mohamed Alami" value={manutentionForm.responsable}
                                           onChange={(e) => setManutentionForm({ ...manutentionForm, responsable: e.target.value })}
                                           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Notes</label>
                                    <input type="text" placeholder="Instructions particulières..." value={manutentionForm.notes}
                                           onChange={(e) => setManutentionForm({ ...manutentionForm, notes: e.target.value })}
                                           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>
                                <div className="md:col-span-3">
                                    {manutentionSuccess && (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-3 text-sm flex items-center gap-2">
                                            <CheckCircle size={16} /> {manutentionSuccess}
                                        </div>
                                    )}
                                    {manutentionError && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-3 text-sm flex items-center gap-2">
                                            <AlertCircle size={16} /> {manutentionError}
                                        </div>
                                    )}
                                    <button type="submit" disabled={savingManutention}
                                            className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition">
                                        {savingManutention
                                            ? <><Loader2 size={18} className="animate-spin" /> Programmation...</>
                                            : <><CalendarClock size={18} /> Programmer l'opération</>}
                                    </button>
                                </div>
                            </form>

                            {/* Operations List */}
                            {manutentionList.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 mb-3">Opérations programmées ({manutentionList.length})</h4>
                                    <div className="space-y-3">
                                        {manutentionList.map(op => (
                                            <div key={op.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-purple-100 rounded-lg"><Truck size={16} className="text-purple-600" /></div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700">
                                                            {TYPE_MANUTENTION.find(t => t.value === op.type)?.label || op.type}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            📅 {op.datePrevue} à {op.heurePrevue}
                                                            {op.responsable && ` — 👤 ${op.responsable}`}
                                                        </p>
                                                        {op.notes && <p className="text-xs text-gray-400 mt-0.5">📝 {op.notes}</p>}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteManutention(op.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg transition text-gray-300 hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {manutentionList.length === 0 && (
                                <div className="text-center py-8 text-gray-300">
                                    <CalendarClock size={40} className="mx-auto mb-2" />
                                    <p className="text-sm">Aucune opération programmée</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConteneurDetail;