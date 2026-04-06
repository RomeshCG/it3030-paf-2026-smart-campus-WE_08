import React, { useState, useEffect } from 'react';
import { getMyBookings, cancelBooking, getBookingHistory } from '../api/bookingApi';
import { BookingHistory } from '../components/BookingHistory';
import { Calendar, Clock, MapPin, XCircle, Info, RefreshCw, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fetchBookings = async () => {
        try {
            const data = await getMyBookings();
            setBookings(data);
        } catch (err) {
            toast.error('Failed to load your bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await cancelBooking(id);
            toast.success('Booking cancelled successfully');
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleViewHistory = async (id) => {
        try {
            const history = await getBookingHistory(id);
            setSelectedHistory(history);
            setShowHistoryModal(true);
        } catch (err) {
            toast.error('Failed to load booking history');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'APPROVED': return 'badge-success';
            case 'PENDING': return 'badge-warning';
            case 'REJECTED': return 'badge-danger';
            case 'CANCELLED': return 'badge-secondary';
            default: return 'badge-secondary';
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="container animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={32} color="var(--accent-color)" />
                    <h1 className="page-title" style={{ margin: 0 }}>My Bookings</h1>
                </div>
                <button className="btn btn-secondary" onClick={fetchBookings}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {bookings.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Calendar size={64} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                    <h2>No bookings found</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't made any resource requests yet.</p>
                </div>
            ) : (
                <div className="bookings-list" style={{ display: 'grid', gap: '1.5rem' }}>
                    {bookings.map(booking => (
                        <div key={booking.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0 }}>{booking.resourceName}</h3>
                                    <span className={`badge ${getStatusBadgeClass(booking.status)}`} style={{ textTransform: 'capitalize' }}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={14} /> {new Date(booking.date).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={14} /> {booking.startTime} - {booking.endTime}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={14} /> {booking.resourceLocation}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={14} /> {booking.purpose}
                                    </div>
                                </div>
                                {booking.rejectionReason && (
                                    <div className="alert-danger" style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(244, 63, 94, 0.1)' }}>
                                        <MessageSquare size={14} /> <strong>Rejection Reason:</strong> {booking.rejectionReason}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button className="btn btn-secondary" onClick={() => handleViewHistory(booking.id)} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                                    <Clock size={16} /> View History
                                </button>
                                {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                                    <button className="btn btn-danger" onClick={() => handleCancel(booking.id)} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                                        <XCircle size={16} /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Booking Audit History</h2>
                            <button className="btn-close" onClick={() => setShowHistoryModal(false)}>×</button>
                        </div>
                        <BookingHistory history={selectedHistory} />
                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
