import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getConteneurById, assignEmplacement, getDwellTime } from '../../api/conteneurAPI';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, QrCode, ArrowLeft, CheckCircle } from 'lucide-react';

const ConteneurDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conteneur, setConteneur] = useState(null);
    const [dwellTime, setDwellTime] = useState(null);
    const [form, setForm] = useState({ zone: '', rangee: '', position: '', quai: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        Promise.all([getConteneurById(id), getDwellTime(id)])
            .then(([cRes, dRes]) => {
                setConteneur(cRes.data);
                setDwellTime(dRes.data);
                setForm({
                    zone: cRes.data.zone || '',
                    rangee: cRes.data.rangee || '',
                    position: cRes.data.position || '',
                    quai: cRes.data.quai || '',
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleAssign = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await assignEmplacement(id, form);
            setConteneur(res.data);
            setSuccess('Emplacement assigné avec succès!');
            setTimeout(() => setSuccess(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const statutConfig = {
        ARRIVE: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Arrivé' },
        STOCKE: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Stocké' },
        EN_INSPECTION: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'En Inspection' },
        CHARGEMENT: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Chargement' },
        PARTI: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Parti' },
    };

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title={`Conteneur #${id}`} />
                <div className="p-6">

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/conteneurs')}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <ArrowLeft size={18} className="text-gray-500" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Conteneur #{id}</h2>
                                    <p className="text-gray-400 text-sm">Fiche #{conteneur?.ficheId}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-sm font-semibold border ${statutConfig[conteneur?.statut]?.color}`}>
                {statutConfig[conteneur?.statut]?.label || conteneur?.statut}
              </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-5">Informations</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={15} className="text-gray-400" />
                                        Zone
                                    </div>
                                    <span className="font-semibold text-gray-700">{conteneur?.zone || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={15} className="text-gray-400" />
                                        Rangée
                                    </div>
                                    <span className="font-semibold text-gray-700">{conteneur?.rangee || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={15} className="text-gray-400" />
                                        Position
                                    </div>
                                    <span className="font-semibold text-gray-700">{conteneur?.position || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={15} className="text-gray-400" />
                                        Quai
                                    </div>
                                    <span className="font-semibold text-gray-700">{conteneur?.quai || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Clock size={15} className="text-gray-400" />
                                        Dwell Time
                                    </div>
                                    <span className="font-bold text-blue-600 text-lg">{dwellTime}h</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <a

                                href={`http://localhost:8080/api/qrcode/${id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 text-sm font-medium transition"
                                >
                                <QrCode size={18} />
                                Voir QR Code
                            </a>
                        </div>
                    </div>

                    {(user?.role === 'OPERATEUR' || user?.role === 'ADMIN') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-800 mb-5">Assigner Emplacement</h3>

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleAssign} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Zone</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Zone A"
                                        value={form.zone}
                                        onChange={(e) => setForm({ ...form, zone: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Rangée</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Rangée 12"
                                        value={form.rangee}
                                        onChange={(e) => setForm({ ...form, rangee: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Position</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Position 5"
                                        value={form.position}
                                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Quai</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Quai 3"
                                        value={form.quai}
                                        onChange={(e) => setForm({ ...form, quai: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 mt-2"
                                >
                                    <MapPin size={18} />
                                    {saving ? 'Sauvegarde...' : 'Assigner Emplacement'}
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