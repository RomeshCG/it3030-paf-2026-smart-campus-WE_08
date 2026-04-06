import api from '../lib/api';

export const createBooking = async (bookingData) => {
    const { data } = await api.post('/api/bookings', bookingData);
    return data;
};

export const getMyBookings = async () => {
    const { data } = await api.get('/api/bookings/my');
    return data;
};

export const getAllBookings = async () => {
    const { data } = await api.get('/api/bookings');
    return data;
};

export const approveBooking = async (id) => {
    const { data } = await api.put(`/api/bookings/${id}/approve`);
    return data;
};

export const rejectBooking = async (id, reason) => {
    const { data } = await api.put(`/api/bookings/${id}/reject`, { reason });
    return data;
};

export const cancelBooking = async (id) => {
    const { data } = await api.put(`/api/bookings/${id}/cancel`);
    return data;
};

export const getBookingHistory = async (id) => {
    const { data } = await api.get(`/api/bookings/${id}/history`);
    return data;
};

export const getBookingAnalytics = async () => {
    const { data } = await api.get('/api/analytics/bookings/bookings');
    return data;
};
