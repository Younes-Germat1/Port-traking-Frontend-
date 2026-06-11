import API from './axiosConfig';

export const createMarchandise = (data) => API.post('/api/marchandises', data);
export const getMarchandiseById = (id) => API.get(`/api/marchandises/${id}`);
export const getMarchandisesByFiche = (ficheId) =>
    API.get(`/api/marchandises/fiche/${ficheId}`);