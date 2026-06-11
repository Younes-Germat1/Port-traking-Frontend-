import API from './axiosConfig';

export const createConteneur = (ficheId) =>
    API.post(`/api/conteneurs?ficheId=${ficheId}`);
export const getConteneurById = (id) => API.get(`/api/conteneurs/${id}`);
export const getConteneursByFiche = (ficheId) =>
    API.get(`/api/conteneurs/fiche/${ficheId}`);
export const assignEmplacement = (id, data) =>
    API.put(`/api/conteneurs/${id}/emplacement`, data);
export const getDwellTime = (id) => API.get(`/api/conteneurs/${id}/dwell-time`);