import API from './axiosConfig';

export const getAllConteneurs = async () => {
    const response = await API.get('/api/conteneurs');
    return response.data;
};

export const createConteneur = async (ficheId) => {
    const response = await API.post(`/api/conteneurs?ficheId=${ficheId}`);
    return response.data;
};

export const getConteneurById = async (id) => {
    const response = await API.get(`/api/conteneurs/${id}`);
    return response.data;
};

export const getConteneursByFiche = async (ficheId) => {
    const response = await API.get(`/api/conteneurs/fiche/${ficheId}`);
    return response.data;
};

export const assignEmplacement = async (id, data) => {
    const response = await API.put(`/api/conteneurs/${id}/emplacement`, data);
    return response.data;
};

export const getDwellTime = async (id) => {
    const response = await API.get(`/api/conteneurs/${id}/dwell-time`);
    return response.data;
};

export const getManutentions = async (conteneurId) => {
    const response = await API.get(`/api/manutentions/conteneur/${conteneurId}`);
    return response.data;
};

export const createManutention = async (conteneurId, data) => {
    const response = await API.post(`/api/manutentions/conteneur/${conteneurId}`, data);
    return response.data;
};

export const deleteManutention = async (id) => {
    await API.delete(`/api/manutentions/${id}`);
};