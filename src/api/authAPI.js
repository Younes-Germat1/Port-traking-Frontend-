import API from './axiosConfig';

export const login = (data) => API.post('/api/auth/login', data);
export const register = (data, role) => API.post(`/api/auth/register?role=${role}`, data);