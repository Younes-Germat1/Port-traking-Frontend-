import API from './axiosConfig';

export const getMyNotifications = async (userId) => {
    const response = await API.get(`/api/notifications?userId=${userId}`);
    return response.data;
};

export const getUnreadNotifications = async (userId) => {
    const response = await API.get(`/api/notifications/unread?userId=${userId}`);
    return response.data;
};

export const markAsRead = async (notificationId) => {
    const response = await API.put(`/api/notifications/${notificationId}/lu`);
    return response.data;
};

export const markAllAsRead = async () => {
    const response = await API.put('/api/notifications/lu-tout');
    return response.data;
};