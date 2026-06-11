import API from './axiosConfig';

export const getMyNotifications = (userId) =>
    API.get(`/api/notifications/me?userId=${userId}`);
export const getUnreadNotifications = (userId) =>
    API.get(`/api/notifications/me/unread?userId=${userId}`);
export const markAsRead = (id) => API.put(`/api/notifications/${id}/lu`);