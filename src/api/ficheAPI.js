import API from './axiosConfig';

export const getAllFiches = () => API.get('/api/fiches');
export const getFicheById = (id) => API.get(`/api/fiches/${id}`);
export const createFiche = (data) => API.post('/api/fiches', data);
export const updateFicheStatut = (id, data, acteurId) =>
    API.put(`/api/fiches/${id}/statut?acteurId=${acteurId}`, data);
export const getFicheHistorique = (id) => API.get(`/api/fiches/${id}/historique`);