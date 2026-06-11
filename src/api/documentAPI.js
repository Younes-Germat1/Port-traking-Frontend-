import API from './axiosConfig';

export const uploadDocument = (ficheId, type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post(`/api/documents/upload?ficheId=${ficheId}&type=${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const downloadDocument = (id) =>
    API.get(`/api/documents/${id}/download`, { responseType: 'blob' });
export const getDocumentsByFiche = (ficheId) =>
    API.get(`/api/documents/fiche/${ficheId}`);