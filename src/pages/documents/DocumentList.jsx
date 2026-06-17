import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Download, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getDocumentsByFiche, uploadDocument, downloadDocument } from '../../api/documentAPI';

const DOCUMENT_TYPES = [
    { value: 'FACTURE', label: 'Facture' },
    { value: 'CERTIFICAT', label: 'Certificat' },
    { value: 'BON_COMMANDE', label: 'Bon de commande' },
    { value: 'DECLARATION', label: 'Déclaration douanière' },
    { value: 'AUTRE', label: 'Autre' },
];

export default function DocumentList() {
    const { ficheId } = useParams();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedType, setSelectedType] = useState('FACTURE');
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Download state
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        if (ficheId) fetchDocuments();
    }, [ficheId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDocumentsByFiche(ficheId);
            setDocuments(data);
        } catch (err) {
            setError('Impossible de charger les documents.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
            setUploadSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Veuillez sélectionner un fichier.');
            return;
        }

        try {
            setUploading(true);
            setUploadError(null);
            await uploadDocument(ficheId, selectedType, selectedFile);
            setUploadSuccess(true);
            setSelectedFile(null);
            // Reset file input
            document.getElementById('file-input').value = '';
            // Refresh list
            await fetchDocuments();
        } catch (err) {
            setUploadError("Erreur lors de l'upload. Vérifiez le fichier et réessayez.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            setDownloadingId(doc.id);
            const fileName = doc.filePath
                ? doc.filePath.split('/').pop()
                : `${doc.type}-${doc.id}`;
            await downloadDocument(doc.id, fileName);
        } catch (err) {
            alert('Erreur lors du téléchargement.');
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-MA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type) => {
        return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                📁 Documents — Fiche #{ficheId}
            </h1>

            {/* ── Zone Upload ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-blue-600" />
                    Ajouter un document
                </h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Type */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {DOCUMENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>

                    {/* File picker */}
                    <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500 truncate">
              {selectedFile ? selectedFile.name : 'Choisir un fichier (PDF, image)'}
            </span>
                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* Upload button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Upload size={16} />
                        )}
                        {uploading ? 'Envoi...' : 'Uploader'}
                    </button>
                </div>

                {/* Feedback messages */}
                {uploadSuccess && (
                    <div className="mt-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle size={16} />
                        Document uploadé avec succès !
                    </div>
                )}
                {uploadError && (
                    <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
                        <AlertCircle size={16} />
                        {uploadError}
                    </div>
                )}
            </div>

            {/* ── Liste des documents ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Documents ({documents.length})
                </h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-lg">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <FileText size={40} className="mx-auto mb-2 opacity-30" />
                        <p>Aucun document pour cette fiche.</p>
                        <p className="text-xs mt-1">Uploadez votre premier document ci-dessus.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
                            >
                                {/* Infos doc */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <FileText size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {getTypeLabel(doc.type)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {doc.filePath?.split('/').pop() || `document-${doc.id}`}
                                        </p>
                                        <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
                                    </div>
                                </div>

                                {/* Bouton télécharger */}
                                <button
                                    onClick={() => handleDownload(doc)}
                                    disabled={downloadingId === doc.id}
                                    className="flex items-center gap-2 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
                                >
                                    {downloadingId === doc.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    Télécharger
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}