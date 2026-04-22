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

export const approveBooking = async (id, payload = {}) => {
    const { data } = await api.put(`/api/bookings/${id}/approve`, payload);
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

const COUNTABLE_STATUSES = new Set(['APPROVED', 'PENDING']);

const toMinutes = (timeValue) => {
    const [hours = '0', minutes = '0'] = String(timeValue || '00:00').split(':');
    return (Number(hours) * 60) + Number(minutes);
};

const isOverlapping = (existingStart, existingEnd, requestStart, requestEnd) => {
    const existingStartMinutes = toMinutes(existingStart);
    const existingEndMinutes = toMinutes(existingEnd);
    const requestStartMinutes = toMinutes(requestStart);
    const requestEndMinutes = toMinutes(requestEnd);
    return existingStartMinutes < requestEndMinutes && existingEndMinutes > requestStartMinutes;
};

export const getTimeSlotAvailability = async ({ resourceId, date, startTime, endTime, totalCapacity }) => {
    try {
        const { data } = await api.get('/api/bookings/availability', {
            params: { resourceId, date, startTime, endTime },
        });
        return {
            total: Number(data?.totalCapacity || 0),
            used: Number(data?.usedCapacity || 0),
            remaining: Number(data?.remainingCapacity || 0),
            isAvailable: Boolean(data?.available),
            countedStatuses: Array.isArray(data?.countedStatuses) ? data.countedStatuses : ['PENDING', 'APPROVED'],
            source: 'server',
        };
    } catch (error) {
        // Fallback retains backward compatibility if backend endpoint is unavailable.
    }

    const result = {
        total: Number(totalCapacity || 0),
        used: 0,
        remaining: Number(totalCapacity || 0),
        isAvailable: true,
        countedStatuses: ['PENDING', 'APPROVED'],
        source: 'all',
    };

    let bookings;
    try {
        bookings = await getAllBookings();
    } catch (error) {
        // Non-admin users cannot read all bookings. Fall back to user bookings
        // so UI still provides a best-effort estimate before backend validation.
        bookings = await getMyBookings();
        result.source = 'mine';
    }

    const used = bookings
        .filter((booking) => Number(booking.resourceId) === Number(resourceId))
        .filter((booking) => booking.date === date)
        .filter((booking) => COUNTABLE_STATUSES.has(booking.status))
        .filter((booking) => isOverlapping(booking.startTime, booking.endTime, startTime, endTime))
        .reduce((sum, booking) => sum + Number(booking.attendees || 0), 0);

    result.used = used;
    result.remaining = Math.max(result.total - used, 0);
    result.isAvailable = result.remaining > 0;
    return result;
};
