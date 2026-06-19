import API from './axiosConfig';

export const createInspection = (conteneurId, inspecteurId, organisme) =>
    API.post(`/api/inspections?conteneurId=${conteneurId}&inspecteurId=${inspecteurId}&organisme=${organisme}`);

export const getMesTaches = async (inspecteurId) => {
    const response = await API.get(`/api/inspections/mes-taches?inspecteurId=${inspecteurId}`);
    return response.data;
};

export const getAllInspections = async () => {
    const response = await API.get('/api/inspections');
    return response.data;
};

export const enregistrerResultat = (id, data) =>
    API.put(`/api/inspections/${id}/resultat`, data);

export const getInspectionById = (id) =>
    API.get(`/api/inspections/${id}`);

export const uploadPhotoInspection = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post(`/api/inspections/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};