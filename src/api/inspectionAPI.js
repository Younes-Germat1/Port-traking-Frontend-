import API from './axiosConfig';

export const createInspection = (conteneurId, inspecteurId, organisme) =>
    API.post(`/api/inspections?conteneurId=${conteneurId}&inspecteurId=${inspecteurId}&organisme=${organisme}`);
export const getMesTaches = (inspecteurId) =>
    API.get(`/api/inspections/mes-taches?inspecteurId=${inspecteurId}`);
export const getAllInspections = () =>
    API.get('/api/inspections');
export const enregistrerResultat = (id, data) =>
    API.put(`/api/inspections/${id}/resultat`, data);