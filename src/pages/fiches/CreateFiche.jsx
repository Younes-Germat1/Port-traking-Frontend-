import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { createFiche } from '../../api/ficheAPI';
import { createMarchandise } from '../../api/marchandiseAPI';
import { uploadDocument } from '../../api/documentAPI';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

const CreateFiche = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [ficheId, setFicheId] = useState(null);

    const [marchandises, setMarchandises] = useState([{
        classification: 'STANDARD', poids: '', volume: '', codeSh: ''
    }]);

    const [documents, setDocuments] = useState([{ type: '', file: null }]);

    const handleCreateFiche = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await createFiche({ importateurId: user.id });
            setFicheId(res.data.id);
            setStep(2);
        } catch {
            setError('Échec de la création de la fiche');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMarchandises = async () => {
        setLoading(true);
        setError('');
        try {
            for (const m of marchandises) {
                await createMarchandise({
                    ficheId,
                    classification: m.classification,
                    poids: parseFloat(m.poids) || 0,
                    volume: parseFloat(m.volume) || 0,
                    codeSh: m.codeSh
                });
            }
            setStep(3);
        } catch {
            setError('Échec de la sauvegarde des marchandises');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            for (const doc of documents) {
                if (doc.file && doc.type) {
                    await uploadDocument(ficheId, doc.type, doc.file);
                }
            }
            navigate('/fiches');
        } catch {
            setError('Échec du téléchargement des documents');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, label: 'Fiche' },
        { num: 2, label: 'Marchandises' },
        { num: 3, label: 'Documents' },
    ];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Créer une Fiche Suiveuse" />
                <div className="p-6 max-w-3xl">

                    {/* Steps */}
                    <div className="flex items-center mb-8">
                        {steps.map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`flex items-center gap-2 ${i > 0 ? 'ml-2' : ''}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                        step > s.num ? 'bg-green-500 text-white' :
                                            step === s.num ? 'bg-blue-600 text-white' :
                                                'bg-gray-200 text-gray-500'
                                    }`}>
                                        {step > s.num ? <CheckCircle size={18} /> : s.num}
                                    </div>
                                    <span className={`text-sm font-medium ${step === s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className={`h-0.5 w-16 mx-3 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Créer la Fiche Suiveuse</h2>
                            <p className="text-gray-500 text-sm mb-6">Une nouvelle fiche sera créée et soumise à l'ADII pour validation.</p>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Importateur</p>
                                        <p className="font-semibold text-gray-800">{user?.nom || user?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Statut Initial</p>
                                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-semibold">EN_ATTENTE</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateFiche}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Création...</>
                                ) : 'Créer la Fiche →'}
                            </button>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-bold text-gray-800">Ajouter les Marchandises</h2>
                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">Fiche #{ficheId} ✓</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">Ajoutez toutes les marchandises de cette fiche.</p>

                            {marchandises.map((m, index) => (
                                <div key={index} className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-semibold text-gray-700 text-sm">Marchandise #{index + 1}</h3>
                                        {marchandises.length > 1 && (
                                            <button
                                                onClick={() => setMarchandises(marchandises.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Classification</label>
                                            <select
                                                value={m.classification}
                                                onChange={(e) => {
                                                    const updated = [...marchandises];
                                                    updated[index].classification = e.target.value;
                                                    setMarchandises(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option>STANDARD</option>
                                                <option>DANGEREUSE</option>
                                                <option>PERISSABLE</option>
                                                <option>FRAGILE</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Code SH</label>
                                            <input
                                                type="text"
                                                placeholder="ex: 0101.21"
                                                value={m.codeSh}
                                                onChange={(e) => {
                                                    const updated = [...marchandises];
                                                    updated[index].codeSh = e.target.value;
                                                    setMarchandises(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Poids (kg)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={m.poids}
                                                onChange={(e) => {
                                                    const updated = [...marchandises];
                                                    updated[index].poids = e.target.value;
                                                    setMarchandises(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Volume (m³)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={m.volume}
                                                onChange={(e) => {
                                                    const updated = [...marchandises];
                                                    updated[index].volume = e.target.value;
                                                    setMarchandises(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setMarchandises([...marchandises, { classification: 'STANDARD', poids: '', volume: '', codeSh: '' }])}
                                className="w-full border-2 border-dashed border-gray-200 text-gray-400 py-3 rounded-xl hover:border-blue-400 hover:text-blue-600 transition text-sm flex items-center justify-center gap-2 mb-5"
                            >
                                <Plus size={16} /> Ajouter une marchandise
                            </button>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-medium">
                                    ← Retour
                                </button>
                                <button
                                    onClick={handleSaveMarchandises}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold"
                                >
                                    {loading ? 'Sauvegarde...' : 'Continuer →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-bold text-gray-800">Télécharger les Documents</h2>
                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">Fiche #{ficheId} ✓</span>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">Factures, certificats et autres documents requis.</p>

                            {documents.map((doc, index) => (
                                <div key={index} className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50">
                                    <h3 className="font-semibold text-gray-700 text-sm mb-3">Document #{index + 1}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Type de Document</label>
                                            <select
                                                value={doc.type}
                                                onChange={(e) => {
                                                    const updated = [...documents];
                                                    updated[index].type = e.target.value;
                                                    setDocuments(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">Sélectionner...</option>
                                                <option value="FACTURE">Facture</option>
                                                <option value="CERTIFICAT">Certificat</option>
                                                <option value="BON_LIVRAISON">Bon de livraison</option>
                                                <option value="ASSURANCE">Assurance</option>
                                                <option value="AUTRE">Autre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Fichier</label>
                                            <input
                                                type="file"
                                                onChange={(e) => {
                                                    const updated = [...documents];
                                                    updated[index].file = e.target.files[0];
                                                    setDocuments(updated);
                                                }}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setDocuments([...documents, { type: '', file: null }])}
                                className="w-full border-2 border-dashed border-gray-200 text-gray-400 py-3 rounded-xl hover:border-blue-400 hover:text-blue-600 transition text-sm flex items-center justify-center gap-2 mb-5"
                            >
                                <Plus size={16} /> Ajouter un document
                            </button>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-medium">
                                    ← Retour
                                </button>
                                <button
                                    onClick={handleSaveDocuments}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Envoi...' : <><CheckCircle size={18} /> Soumettre la Fiche</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateFiche;