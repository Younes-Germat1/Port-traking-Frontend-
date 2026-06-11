import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getDocumentsByFiche, uploadDocument } from '../../api/documentAPI';
import { getAllFiches } from '../../api/ficheAPI';
import { useAuth } from '../../context/AuthContext';
import { FileArchive, Upload, Download, Search } from 'lucide-react';

const DocumentList = () => {
    const { user } = useAuth();
    const [ficheId, setFicheId] = useState('');
    const [fiches, setFiches] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [file, setFile] = useState(null);
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');

    useState(() => {
        getAllFiches().then(res => {
            let data = res.data;
            if (user?.role === 'IMPORTATEUR') {
                data = data.filter(f => f.importateurId === user.id);
            }
            setFiches(data);
        });
    }, []);

    const search = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getDocumentsByFiche(id);
            setDocuments(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !ficheId || !type) return;
        setUploading(true);
        try {
            await uploadDocument(ficheId, type, file);
            await search(ficheId);
            setFile(null);
            setType('');
            setSuccess('Document uploadé avec succès!');
            setTimeout(() => setSuccess(''), 3000);
        } finally {
            setUploading(false);
        }
    };

    const typeConfig = {
        FACTURE: 'bg-blue-100 text-blue-700',
        CERTIFICAT: 'bg-green-100 text-green-700',
        BON_LIVRAISON: 'bg-yellow-100 text-yellow-700',
        ASSURANCE: 'bg-purple-100 text-purple-700',
        AUTRE: 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Documents" />
                <div className="p-6">

                    {/* Search */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h3 className="font-bold text-gray-800 mb-4">Sélectionner une Fiche</h3>
                        <select
                            value={ficheId}
                            onChange={(e) => {
                                setFicheId(e.target.value);
                                search(e.target.value);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="">Sélectionner une fiche...</option>
                            {fiches.map(f => (
                                <option key={f.id} value={f.id}>
                                    Fiche #{f.id} — {f.importateurNom} ({f.statut})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Upload */}
                    {ficheId && (user?.role === 'IMPORTATEUR' || user?.role === 'ADMIN') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Upload size={18} className="text-blue-600" />
                                Télécharger un Document
                            </h3>

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleUpload} className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase">Fichier</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} />
                                        {uploading ? 'Envoi...' : 'Uploader'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Documents List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date Upload</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-semibold text-gray-700">#{doc.id}</td>
                                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig[doc.type] || 'bg-gray-100 text-gray-700'}`}>
                        {doc.type}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('fr-FR') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                       <a
                                        href={`http://localhost:8080/api/documents/${doc.id}/download`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm w-fit"
                                        >
                                        <Download size={14} />
                                        Télécharger
                                    </a>
                                </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                        {!loading && documents.length === 0 && (
                            <div className="text-center py-16">
                                <FileArchive size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">
                                    {ficheId ? 'Aucun document trouvé' : 'Sélectionnez une fiche pour voir les documents'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentList;