import API from './axiosConfig';

// ─────────────────────────────────────────
// FICHES
// ─────────────────────────────────────────

/**
 * Récupérer toutes les fiches
 * GET /api/fiches
 */
export const getAllFiches = async () => {
    const response = await API.get('/api/fiches');
    return response.data;
};

/**
 * Récupérer les fiches d'un importateur
 * GET /api/fiches → filtré côté front par importateurId
 */
export const getMesFiches = async (importateurId) => {
    const response = await API.get('/api/fiches');
    return response.data.filter(f => f.importateurId === importateurId);
};

/**
 * Récupérer une fiche par ID
 * GET /api/fiches/{id}
 */
export const getFicheById = async (id) => {
    const response = await API.get(`/api/fiches/${id}`);
    return response.data;
};

/**
 * Créer une nouvelle fiche avec importateur + marchandises + organismes + documents
 * POST /api/fiches
 */
export const createFiche = async (formData) => {
    const response = await API.post('/api/fiches', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Changer le statut d'une fiche
 * PUT /api/fiches/{id}/statut?acteurId={acteurId}
 */
export const updateFicheStatut = async (ficheId, statut, acteurId) => {
    const response = await API.put(
        `/api/fiches/${ficheId}/statut?acteurId=${acteurId}`,
        { statut }
    );
    return response.data;
};

/**
 * Rejeter une fiche (ADII) avec motif → retour à l'importateur
 * PUT /api/fiches/{id}/rejeter
 */
export const rejectFiche = async (ficheId, motif) => {
    const response = await API.put(`/api/fiches/${ficheId}/rejeter`, { motif });
    return response.data;
};

/**
 * Récupérer l'historique d'une fiche
 * GET /api/fiches/{id}/historique
 */
export const getFicheHistorique = async (ficheId) => {
    const response = await API.get(`/api/fiches/${ficheId}/historique`);
    return response.data;
};

// ─────────────────────────────────────────
// MARCHANDISES
// ─────────────────────────────────────────

/**
 * Récupérer les marchandises d'une fiche
 * GET /api/fiches/{id}/marchandises
 */
export const getMarchandisesByFiche = async (ficheId) => {
    const response = await API.get(`/api/fiches/${ficheId}/marchandises`);
    return response.data;
};

/**
 * Ajouter une marchandise à une fiche
 * POST /api/fiches/{id}/marchandises
 */
export const addMarchandise = async (ficheId, marchandise) => {
    const response = await API.post(`/api/fiches/${ficheId}/marchandises`, marchandise);
    return response.data;
};

/**
 * Supprimer une marchandise d'une fiche
 * DELETE /api/fiches/{id}/marchandises/{marchandiseId}
 */
export const deleteMarchandise = async (ficheId, marchandiseId) => {
    const response = await API.delete(`/api/fiches/${ficheId}/marchandises/${marchandiseId}`);
    return response.data;
};

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────

/**
 * Récupérer les documents d'une fiche
 * GET /api/fiches/{id}/documents
 */
export const getDocumentsByFiche = async (ficheId) => {
    const response = await API.get(`/api/fiches/${ficheId}/documents`);
    return response.data;
};

/**
 * Uploader des documents pour une fiche (factures, certificats)
 * POST /api/fiches/{id}/documents
 */
export const uploadDocuments = async (ficheId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    const response = await API.post(`/api/fiches/${ficheId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Supprimer un document d'une fiche
 * DELETE /api/fiches/{id}/documents/{documentId}
 */
export const deleteDocument = async (ficheId, documentId) => {
    const response = await API.delete(`/api/fiches/${ficheId}/documents/${documentId}`);
    return response.data;
};

// ─────────────────────────────────────────
// ORGANISMES
// ─────────────────────────────────────────

/**
 * Récupérer les organismes assignés à une fiche
 * GET /api/fiches/{id}/organismes
 */
export const getOrganismesByFiche = async (ficheId) => {
    const response = await API.get(`/api/fiches/${ficheId}/organismes`);
    return response.data;
};

/**
 * Assigner des organismes à une fiche
 * POST /api/fiches/{id}/organismes
 */
export const assignOrganismes = async (ficheId, organismes) => {
    const response = await API.post(`/api/fiches/${ficheId}/organismes`, { organismes });
    return response.data;
};

// ─────────────────────────────────────────
// INSPECTIONS
// ─────────────────────────────────────────

/**
 * Récupérer les inspections d'une fiche
 * GET /api/fiches/{id}/inspections
 */
export const getInspectionsByFiche = async (ficheId) => {
    const response = await API.get(`/api/fiches/${ficheId}/inspections`);
    return response.data;
};

/**
 * Créer une inspection pour une fiche
 * POST /api/fiches/{id}/inspections
 * body: { organisme, date, inspecteurId }
 */
export const createInspection = async (ficheId, inspection) => {
    const response = await API.post(`/api/fiches/${ficheId}/inspections`, inspection);
    return response.data;
};

/**
 * Enregistrer le résultat d'une inspection (inspecteur terrain)
 * PUT /api/inspections/{id}/resultat
 * body: { statut: 'CONFORME' | 'NON_CONFORME', commentaire, photos }
 */
export const updateInspectionResultat = async (inspectionId, resultat) => {
    const formData = new FormData();
    formData.append('statut', resultat.statut);
    formData.append('commentaire', resultat.commentaire || '');
    if (resultat.photos?.length) {
        resultat.photos.forEach(photo => formData.append('photos', photo));
    }
    const response = await API.put(`/api/inspections/${inspectionId}/resultat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Récupérer toutes les inspections assignées à un inspecteur
 * GET /api/inspections?inspecteurId={id}
 */
export const getMyInspections = async (inspecteurId) => {
    const response = await API.get(`/api/inspections?inspecteurId=${inspecteurId}`);
    return response.data;
};

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────

/**
 * Récupérer toutes les notifications de l'utilisateur connecté
 * GET /api/notifications
 */
export const getNotifications = async () => {
    const response = await API.get('/api/notifications');
    return response.data;
};

/**
 * Marquer une notification comme lue
 * PUT /api/notifications/{id}/lu
 */
export const markNotificationRead = async (notificationId) => {
    const response = await API.put(`/api/notifications/${notificationId}/lu`);
    return response.data;
};

/**
 * Marquer toutes les notifications comme lues
 * PUT /api/notifications/lu-tout
 */
export const markAllNotificationsRead = async () => {
    const response = await API.put('/api/notifications/lu-tout');
    return response.data;
};