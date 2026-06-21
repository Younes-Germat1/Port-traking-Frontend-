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

/**
 * Admin only — send a targeted alert to every user of a given role,
 * optionally linked to a specific fiche.
 * @param {string} targetRole - 'ADII' | 'OPERATEUR' | 'INSPECTEUR'
 * @param {string} message - alert text
 * @param {number|null} ficheId - optional, links the alert to a fiche
 */
export const sendAdminAlert = async (targetRole, message, ficheId = null) => {
    const response = await API.post('/api/notifications/admin-alert', {
        targetRole,
        message,
        ficheId,
    });
    return response.data;
};