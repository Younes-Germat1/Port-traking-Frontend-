import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { createFiche, uploadDocuments } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import { MapPin, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react';

const CLASSIFICATIONS = ['STANDARD', 'DANGEREUSE', 'PERISSABLE', 'FRAGILE'];

const CLASSIFICATION_COLORS = {
    STANDARD:   'bg-gray-100 text-gray-700',
    DANGEREUSE: 'bg-red-100 text-red-700',
    PERISSABLE: 'bg-yellow-100 text-yellow-700',
    FRAGILE:    'bg-blue-100 text-blue-700',
};

const ORGANISMES_LIST = [
    { id: 'ADII',    label: 'ADII — Douanes',                obligatoire: true  },
    { id: 'ONSSA',   label: 'ONSSA — Sécurité alimentaire',  obligatoire: false },
    { id: 'AMSSNUR', label: 'AMSSNUR — Sécurité nucléaire',  obligatoire: false },
    { id: 'LPEE',    label: 'LPEE — Essais et études',        obligatoire: false },
];

const getOrganismesAuto = (marchandises) => {
    const auto = new Set(['ADII']);
    marchandises.forEach(m => {
        if (m.classification === 'PERISSABLE') auto.add('ONSSA');
        if (m.classification === 'DANGEREUSE') auto.add('AMSSNUR');
    });
    return [...auto];
};

// ─────────────────────────────────────────
// Contact validation: +212 phone (13 chars) OR email
// ─────────────────────────────────────────
const isValidContact = (value) => {
    const v = value.trim();
    const phoneRegex = /^\+212[0-9]{9}$/;        // +212 followed by exactly 9 digits = 13 chars total
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phoneRegex.test(v) || emailRegex.test(v);
};

const ImportateurStep = ({ data, setData, onNext }) => {
    const contactTouched = data.contact.trim().length > 0;
    const contactValid = !contactTouched || isValidContact(data.contact);

    const isValid =
        data.nom.trim() &&
        data.adresse.trim() &&
        data.contact.trim() &&
        isValidContact(data.contact);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Informations Importateur</h2>

            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    Nom complet / Raison sociale *
                </label>
                <input
                    type="text"
                    placeholder="Ex: Société Import Maroc SARL"
                    value={data.nom}
                    onChange={e => setData({ ...data, nom: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    Adresse *
                </label>
                <textarea
                    rows={3}
                    placeholder="Ex: 12 Rue Hassan II, Casablanca, Maroc"
                    value={data.adresse}
                    onChange={e => setData({ ...data, adresse: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    Contact (téléphone / email) *
                </label>
                <input
                    type="text"
                    placeholder="Ex: +212600000000 ou contact@import.ma"
                    value={data.contact}
                    onChange={e => setData({ ...data, contact: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition
                        ${!contactValid
                        ? 'border-red-300 focus:ring-red-400'
                        : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {!contactValid && (
                    <p className="text-xs text-red-500 mt-1">
                        Format invalide. Utilisez +212XXXXXXXXX (téléphone) ou une adresse email valide.
                    </p>
                )}
            </div>

            <button
                onClick={onNext}
                disabled={!isValid}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition mt-2"
            >
                Suivant — Ajouter les marchandises
            </button>
        </div>
    );
};

const MarchandisesStep = ({ marchandises, setMarchandises, onNext, onBack }) => {

    const addMarchandise = () => {
        setMarchandises([...marchandises, {
            id: Date.now(),
            description: '',
            classification: 'STANDARD',
            codeSH: '',
            poids: '',
            volume: '',
            documents: [],
        }]);
    };

    const update = (id, field, value) =>
        setMarchandises(marchandises.map(m => m.id === id ? { ...m, [field]: value } : m));

    const remove = (id) =>
        setMarchandises(marchandises.filter(m => m.id !== id));

    const handleFileChange = (id, files) =>
        setMarchandises(marchandises.map(m =>
            m.id === id ? { ...m, documents: [...m.documents, ...Array.from(files)] } : m
        ));

    const removeDocument = (marchandiseId, docIndex) =>
        setMarchandises(marchandises.map(m =>
            m.id === marchandiseId
                ? { ...m, documents: m.documents.filter((_, i) => i !== docIndex) }
                : m
        ));

    const isValid = marchandises.every(m =>
        m.description.trim() &&
        m.classification &&
        m.documents.length > 0
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Marchandises</h2>
                <button
                    onClick={addMarchandise}
                    className="flex items-center gap-1 border border-blue-600 text-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition"
                >
                    + Ajouter
                </button>
            </div>

            {marchandises.map((m, index) => (
                <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                            <Package size={16} className="text-blue-500" />
                            Marchandise {index + 1}
                        </div>
                        {marchandises.length > 1 && (
                            <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-600 text-sm">
                                Supprimer
                            </button>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Description *
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Fruits frais, électronique..."
                            value={m.description}
                            onChange={e => update(m.id, 'description', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Classification *
                            </label>
                            <select
                                value={m.classification}
                                onChange={e => update(m.id, 'classification', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {CLASSIFICATIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Code SH
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: 0804.50"
                                value={m.codeSH}
                                onChange={e => update(m.id, 'codeSH', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Poids (kg)
                            </label>
                            <input
                                type="number"
                                placeholder="Ex: 1500"
                                value={m.poids}
                                onChange={e => update(m.id, 'poids', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Volume (m³)
                            </label>
                            <input
                                type="number"
                                placeholder="Ex: 20"
                                value={m.volume}
                                onChange={e => update(m.id, 'volume', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Documents joints (factures, certificats) *
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-xl px-4 py-3 text-sm transition
                            ${m.documents.length === 0
                            ? 'border-red-300 text-red-400 hover:border-red-400'
                            : 'border-green-300 text-green-600 hover:border-green-400'}`}>
                            <span>📎</span>
                            <span>{m.documents.length === 0 ? 'Cliquer pour ajouter PDF / images' : "Ajouter d'autres documents"}</span>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={e => handleFileChange(m.id, e.target.files)}
                            />
                        </label>

                        {m.documents.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {m.documents.map((doc, i) => (
                                    <li key={i} className="text-xs text-gray-600 flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <span className="flex items-center gap-1">📄 {doc.name}</span>
                                        <button
                                            onClick={() => removeDocument(m.id, i)}
                                            className="text-red-400 hover:text-red-600 ml-2"
                                        >✕</button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {m.documents.length === 0 && (
                            <p className="text-xs text-red-400 mt-1">⚠️ Au moins un document est requis</p>
                        )}
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CLASSIFICATION_COLORS[m.classification]}`}>
                        {m.classification}
                    </span>
                </div>
            ))}

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="w-1/3 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                    ← Retour
                </button>
                <button
                    onClick={onNext}
                    disabled={!isValid}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    Suivant — Choisir les organismes
                </button>
            </div>
        </div>
    );
};

const OrganismesStep = ({ organismes, setOrganismes, marchandises, onBack, onSubmit, saving, error }) => {

    useEffect(() => {
        const auto = getOrganismesAuto(marchandises);
        setOrganismes(prev => {
            const manualChoices = prev.filter(o => !['ONSSA', 'AMSSNUR'].includes(o));
            return [...new Set([...auto, ...manualChoices])];
        });
    }, [marchandises]);

    const toggle = (id) => {
        if (id === 'ADII') return;
        setOrganismes(prev =>
            prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
        );
    };

    const isAuto = (id) => getOrganismesAuto(marchandises).includes(id);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Organismes de contrôle</h2>
            <p className="text-sm text-gray-400 mb-4">
                Certains organismes sont présélectionnés selon vos marchandises.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="space-y-3">
                {ORGANISMES_LIST.map(org => {
                    const checked = organismes.includes(org.id);
                    const auto    = isAuto(org.id);

                    return (
                        <label
                            key={org.id}
                            onClick={() => toggle(org.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition
                                ${org.id === 'ADII' ? 'cursor-not-allowed' : 'cursor-pointer'}
                                ${checked
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    readOnly
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {org.label}
                                </span>
                            </div>
                            {auto && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                    ${org.id === 'ADII'
                                    ? 'bg-gray-200 text-gray-600'
                                    : 'bg-blue-100 text-blue-600'}`}>
                                    {org.id === 'ADII' ? 'Obligatoire' : 'Auto'}
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    onClick={onBack}
                    className="w-1/3 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                    ← Retour
                </button>
                <button
                    onClick={onSubmit}
                    disabled={saving || organismes.length === 0}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                    {saving
                        ? <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
                        : <><CheckCircle size={18} /> Soumettre la fiche</>
                    }
                </button>
            </div>
        </div>
    );
};

const CreateFiche = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep]     = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const [importateur, setImportateur] = useState({ nom: '', adresse: '', contact: '' });
    const [marchandises, setMarchandises] = useState([{
        id: Date.now(),
        description: '',
        classification: 'STANDARD',
        codeSH: '',
        poids: '',
        volume: '',
        documents: [],
    }]);
    const [organismes, setOrganismes] = useState([]);

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);

            // 1. Create the fiche as plain JSON (importateur + marchandises + organismes)
            const payload = {
                importateurId: user.id,
                importateurNom: importateur.nom,
                importateurAdresse: importateur.adresse,
                importateurContact: importateur.contact,
                organismes,
                marchandises: marchandises.map(({ documents, id, ...rest }) => rest),
            };

            const ficheCreee = await createFiche(payload);

            // 2. Upload all collected documents separately, now that we have a fiche id
            const allFiles = marchandises.flatMap(m => m.documents);
            if (allFiles.length > 0) {
                await uploadDocuments(ficheCreee.id, allFiles);
            }

            navigate('/fiches');
        } catch (err) {
            setError('Erreur lors de la soumission. Veuillez réessayer.');
        } finally {
            setSaving(false);
        }
    };

    const STEPS = ['Importateur', 'Marchandises', 'Organismes'];

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Nouvelle Fiche Suiveuse" />
                <div className="max-w-2xl mx-auto p-6">

                    <div className="flex items-center gap-2 mb-6">
                        {STEPS.map((label, i) => {
                            const num    = i + 1;
                            const done   = step > num;
                            const active = step === num;
                            return (
                                <div key={label} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition
                                        ${done   ? 'bg-green-100 text-green-700' :
                                        active ? 'bg-blue-600 text-white' :
                                            'bg-gray-100 text-gray-400'}`}>
                                        {done ? '✓' : num} {label}
                                    </div>
                                    {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300" />}
                                </div>
                            );
                        })}
                    </div>

                    {step === 1 && (
                        <ImportateurStep
                            data={importateur}
                            setData={setImportateur}
                            onNext={() => setStep(2)}
                        />
                    )}
                    {step === 2 && (
                        <MarchandisesStep
                            marchandises={marchandises}
                            setMarchandises={setMarchandises}
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                        />
                    )}
                    {step === 3 && (
                        <OrganismesStep
                            organismes={organismes}
                            setOrganismes={setOrganismes}
                            marchandises={marchandises}
                            onBack={() => setStep(2)}
                            onSubmit={handleSubmit}
                            saving={saving}
                            error={error}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};

export default CreateFiche;