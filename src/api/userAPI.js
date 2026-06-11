import API from './axiosConfig';

export const getAllUsers = () => API.get('/api/admin/users');
export const createUser = (data) => API.post('/api/admin/users', data);
export const deleteUser = (id) => API.delete(`/api/admin/users/${id}`);