import API from './axiosConfig';

export const getAllUsers = async () => {
    const response = await API.get('/api/admin/users');
    return response.data;
};

export const createUser = async (data) => {
    const response = await API.post('/api/admin/users', data);
    return response.data;
};

export const deleteUser = async (id) => {
    await API.delete(`/api/admin/users/${id}`);
};

export const getInspecteurs = async (organisme) => {
    const url = organisme
        ? `/api/admin/users/inspecteurs?organisme=${organisme}`
        : '/api/admin/users/inspecteurs';
    const response = await API.get(url);
    return response.data;
};