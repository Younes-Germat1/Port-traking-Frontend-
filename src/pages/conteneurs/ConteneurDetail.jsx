import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getConteneurById, assignEmplacement, getDwellTime } from '../../api/conteneurAPI';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, QrCode, ArrowLeft, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

const STATUT_CONFIG = {
    ARRIVE:        { color: 'bg-blue-100 text-blue-700 border-blue-200',      label: 'Arrivé' },
    STOCKE:        { color: 'bg-green-100 text-green-700 border-green-200',    label: 'Stocké' },
    EN_INSPECTION: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'En Inspection' },
    CHARGEMENT:    { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Chargement' },
    PARTI:         { color: 'bg-gray-100 text-gray-700 border-gray-200',       label: 'Parti' },
};

const formatDwellTime = (hours) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days} jour(s)`;
};

const getDwellColor = (hours) => {
    if (hours === null || hours === undefined) return 'text-gray-500';
    if (hours < 48)  return 'text-green-600';
    if (hours < 120) return 'text-yellow-600';
    return 'text-red-600';
};

const getDwellLabel = (hours) => {
    if (hours === null || hours === undefined) return '-';
    if (hours < 48)  return '✅ Délai normal';
    if (hours < 120) return '⚠️ Attention — délai long';
    return '🔴 Critique — action requise';
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

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [cont, dwell] = await Promise.all([
                getConteneurById(id),
                getDwellTime(id),
            ]);
            setConteneur(cont);
            setDwellTime(dwell);
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

    const cfg = STATUT_CONFIG[conteneur?.statut] || {};
    const qrUrl = `http://localhost:8080/api/qrcode/${id}`;

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
                            <span className={`px-4 py-2 rounded-xl text-sm font-semibold border ${cfg.color}`}>
                                {cfg.label || conteneur?.statut}
                            </span>
                        </div>
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
                                            <MapPin size={15} className="text-gray-400" />
                                            {label}
                                        </div>
                                        <span className="font-semibold text-gray-700">{value || '-'}</span>
                                    </div>
                                ))}

                                {/* Dwell Time */}
                                <div className="flex justify-between items-center py-3 mt-2">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Clock size={15} className="text-gray-400" />
                                        Dwell Time
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold text-2xl ${getDwellColor(dwellTime)}`}>
                                            {formatDwellTime(dwellTime)}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {getDwellLabel(dwellTime)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {dwellTime !== null && (
                                    <div className="mt-1">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>0h</span>
                                            <span>48h</span>
                                            <span>120h+</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    dwellTime < 48  ? 'bg-green-500'  :
                                                        dwellTime < 120 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min((dwellTime / 120) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-right">
                                            Arrivé le {conteneur?.arrivedAt
                                            ? new Date(conteneur.arrivedAt).toLocaleDateString('fr-MA')
                                            : '-'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* QR Code inline */}
                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <button
                                    onClick={() => setShowQR(!showQR)}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 text-sm font-medium transition"
                                >
                                    {showQR
                                        ? <><X size={18} /> Fermer QR Code</>
                                        : <><QrCode size={18} /> Voir QR Code</>
                                    }
                                </button>

                                {showQR && (
                                    <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <img
                                            src={qrUrl}
                                            alt={`QR Code Conteneur #${id}`}
                                            className="w-48 h-48 rounded-lg"
                                        />
                                        <p className="text-xs text-gray-400">Conteneur #{id}</p>
                                        <a
                                            href={qrUrl}
                                            download={`qrcode-conteneur-${id}.png`}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Télécharger
                                        </a>
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
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">
                                                {label}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                value={form[field]}
                                                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 mt-2 transition"
                                    >
                                        {saving
                                            ? <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
                                            : <><MapPin size={18} /> Assigner Emplacement</>
                                        }
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConteneurDetail;