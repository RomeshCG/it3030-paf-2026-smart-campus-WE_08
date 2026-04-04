import api from '../lib/api';

export const getMyNotifications = async () => {
    const { data } = await api.get('/api/notifications');
    return data;
};

export const getUnreadCount = async () => {
    const { data } = await api.get('/api/notifications/unread-count');
    return data;
};

export const markAsRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    await api.put('/api/notifications/read-all');
};
