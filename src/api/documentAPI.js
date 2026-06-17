import API from './axiosConfig';

/**
 * Récupérer tous les documents d'une fiche
 * GET /api/documents/fiche/{ficheId}
 */
export const getDocumentsByFiche = async (ficheId) => {
    const response = await API.get(`/api/documents/fiche/${ficheId}`);
    return response.data;
};

/**
 * Uploader un document pour une fiche
 * POST /api/documents/upload
 * @param {number} ficheId - ID de la fiche
 * @param {string} type - Type du document (ex: "FACTURE", "CERTIFICAT", "AUTRE")
 * @param {File} file - Fichier à uploader (PDF ou image)
 */
export const uploadDocument = async (ficheId, type, file) => {
    const formData = new FormData();
    formData.append('ficheId', ficheId);
    formData.append('type', type);
    formData.append('file', file);

    const response = await API.post('/api/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Télécharger un document
 * GET /api/documents/{id}/download
 * Ouvre le fichier dans un nouvel onglet ou force le téléchargement
 */
export const downloadDocument = async (documentId, fileName) => {
    const response = await API.get(`/api/documents/${documentId}/download`, {
        responseType: 'blob',
    });

    // Créer un lien temporaire pour déclencher le téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `document-${documentId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Obtenir l'URL de prévisualisation d'un document (pour PDF/images)
 */
export const getDocumentPreviewUrl = (documentId) => {
    const token = localStorage.getItem('token');
    return `${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/download?token=${token}`;
};